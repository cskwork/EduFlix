import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { FactoryRunner } from '../../server/services/factory-runner'
import { validAssets, validPlan, validStoryboard } from '../../agents/content-factory/pipeline/test-fixtures'
import type { FactoryContext } from '../../agents/content-factory/pipeline/stages/common'

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))))

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'factory-runner-'))
  dirs.push(rootDir)
  await mkdir(join(rootDir, 'agents/content-factory'), { recursive: true })
  await mkdir(join(rootDir, 'public/contents/math/elementary/symmetry'), { recursive: true })
  let releasePlan!: () => void
  const planGate = new Promise<void>((resolve) => { releasePlan = resolve })
  let temporaryId = ''
  let observe = () => undefined
  const stages = {
    plan: async (context: FactoryContext) => {
      temporaryId = context.id
      await planGate
      observe()
      await writeFile(join(context.runDir, 'plan.json'), JSON.stringify({ ...validPlan(), slug: 'symmetry', title: '대칭', description: '설명' }))
    },
    storyboard: async (context: FactoryContext) => {
      observe()
      await writeFile(join(context.runDir, 'storyboard.json'), JSON.stringify(validStoryboard()))
    },
    assets: async (context: FactoryContext) => {
      observe()
      await writeFile(join(context.runDir, 'assets.json'), JSON.stringify(validAssets(context.id)))
    },
    build: async (context: FactoryContext) => {
      observe()
      await mkdir(context.contentDir, { recursive: true })
      const manifest = { id: context.id, title: '대칭', description: '설명', type: 'simulation' }
      await Promise.all(['index.html', 'style.css', 'script.js'].map((name) => writeFile(join(context.contentDir, name), name)))
      await writeFile(join(context.contentDir, 'manifest.json'), JSON.stringify(manifest))
    },
    qa: async () => { observe() },
    publish: async () => { observe() },
  }
  return { rootDir, releasePlan, stages, getTemporaryId: () => temporaryId,
    setObserver: (next: () => void) => { observe = next } }
}

describe('웹 팩토리 runner', () => {
  it('임시 run 뒤 plan slug를 안전한 중복 접미사 ID로 확정하고 preview/manifest를 제공한다', async () => {
    const { rootDir, releasePlan, stages, getTemporaryId, setObserver } = await fixture()
    const runner = new FactoryRunner({ rootDir, stages })
    const job = runner.startGeneration({ interests: ['대칭'], subject: 'math', grade: 'elementary-5', language: 'ko' })
    const transitions: Array<{ status: string; progress: number; message: string }> = []
    setObserver(() => {
      const current = runner.getJob(job.jobId)
      if (current) transitions.push({ status: current.status, progress: current.progress, message: current.message })
    })
    expect(() => runner.startGeneration({ interests: ['다른'], subject: 'math', grade: 'elementary-5', language: 'ko' }))
      .toThrow('이미 생성 작업이 진행 중입니다')
    releasePlan()
    const done = await runner.waitForJob(job.jobId)
    expect(getTemporaryId()).toMatch(/^gen-\d{8}-\d{6}$/)
    expect(done).toMatchObject({ status: 'completed', contentId: 'symmetry-2', progress: 100 })
    expect(done?.manifest).toMatchObject({ id: 'symmetry-2', title: '대칭' })
    expect(runner.getPreview(job.jobId)).toMatchObject({ phase: 'complete', html: 'index.html' })
    expect(runner.getJob('missing')).toBeUndefined()
    const exposed = runner.getJob(job.jobId)!
    exposed.message = '외부 변경'
    expect(runner.getJob(job.jobId)?.message).toBe('콘텐츠가 완성되었습니다!')
    if (done) done.message = 'waitForJob 외부 변경'
    expect(runner.getJob(job.jobId)?.message).toBe('콘텐츠가 완성되었습니다!')
    const preview = runner.getPreview(job.jobId)!
    preview.html = '외부 변경'
    expect(runner.getPreview(job.jobId)?.html).toBe('index.html')
    expect(transitions).toEqual([
      { status: 'processing', progress: 10, message: '학습 주제를 기획하고 있습니다...' },
      { status: 'processing', progress: 30, message: '스토리보드를 설계하고 있습니다...' },
      { status: 'processing', progress: 40, message: '에셋을 준비하고 있습니다...' },
      { status: 'processing', progress: 50, message: '콘텐츠를 제작하고 있습니다... (수 분 소요)' },
      { status: 'reviewing', progress: 80, message: '품질을 검증하고 있습니다...' },
      { status: 'reviewing', progress: 95, message: '카탈로그에 등록하고 있습니다...' },
    ])
    expect(() => runner.startReview('../secret')).toThrow()
  })

  it('임시 run ID 충돌 시 접미사 대신 다음 빈 초를 사용한다', async () => {
    const { rootDir, releasePlan, stages, getTemporaryId } = await fixture()
    await mkdir(join(rootDir, 'agents/content-factory/runs/gen-20260718-120000'), { recursive: true })
    const runner = new FactoryRunner({
      rootDir,
      stages,
      now: () => new Date(2026, 6, 18, 12, 0, 0),
    })
    const job = runner.startGeneration({ interests: ['대칭'], subject: 'math', grade: 'elementary-5', language: 'ko' })
    releasePlan()

    expect(await runner.waitForJob(job.jobId)).toMatchObject({ status: 'completed' })
    expect(getTemporaryId()).toBe('gen-20260718-120001')
  })

  it('다른 과목과 학년에 존재하는 콘텐츠 ID도 전역 중복으로 처리한다', async () => {
    const { rootDir, releasePlan, stages } = await fixture()
    await rm(join(rootDir, 'public/contents/math/elementary/symmetry'), { recursive: true })
    for (const [subject, grade, id] of [
      ['science', 'middle', 'symmetry'],
      ['english', 'high', 'symmetry-2'],
    ]) {
      const contentDir = join(rootDir, 'public/contents', subject, grade, id)
      await mkdir(contentDir, { recursive: true })
      await writeFile(join(contentDir, 'index.html'), id)
    }
    const runner = new FactoryRunner({ rootDir, stages })
    const job = runner.startGeneration({
      interests: ['대칭'], subject: 'math', grade: 'elementary-5', language: 'ko',
    })
    releasePlan()

    expect(await runner.waitForJob(job.jobId)).toMatchObject({
      status: 'completed',
      contentId: 'symmetry-3',
    })
  })

  it('QA 재빌드가 manifest 메타데이터를 바꾸면 publish 전에 실패한다', async () => {
    const { rootDir, releasePlan, stages } = await fixture()
    let buildCount = 0
    let published = false
    stages.build = async (context: FactoryContext) => {
      buildCount += 1
      await mkdir(context.contentDir, { recursive: true })
      const manifest = {
        id: context.id,
        title: buildCount === 1 ? '대칭' : '변조된 제목',
        description: '설명',
        type: 'simulation',
      }
      await Promise.all(['index.html', 'style.css', 'script.js'].map((name) =>
        writeFile(join(context.contentDir, name), name)))
      await writeFile(join(context.contentDir, 'manifest.json'), JSON.stringify(manifest))
    }
    stages.qa = async (_context: FactoryContext, rebuild?: (revision: string) => Promise<void>) => {
      await rebuild?.('품질 수정')
    }
    stages.publish = async () => { published = true }
    const runner = new FactoryRunner({ rootDir, stages })
    const job = runner.startGeneration({ interests: ['대칭'], subject: 'math', grade: 'elementary-5', language: 'ko' })
    releasePlan()

    expect(await runner.waitForJob(job.jobId)).toMatchObject({
      status: 'failed',
      error: 'manifest의 id, title, description은 확정된 기획 메타데이터와 같아야 합니다.',
    })
    expect(published).toBe(false)
  })

  it('스테이지 실패를 failed 상태와 오류로 보존한다', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'factory-runner-failure-'))
    dirs.push(rootDir)
    await mkdir(join(rootDir, 'agents/content-factory'), { recursive: true })
    const stages = {
      plan: async () => { throw new Error('기획 생성 실패') },
      storyboard: async () => undefined,
      assets: async () => undefined,
      build: async () => undefined,
      qa: async () => undefined,
      publish: async () => undefined,
    }
    const runner = new FactoryRunner({ rootDir, stages })
    const job = runner.startGeneration({ interests: ['대칭'], subject: 'math', grade: 'elementary-5', language: 'ko' })

    expect(await runner.waitForJob(job.jobId)).toMatchObject({
      status: 'failed', progress: 0, error: '기획 생성 실패',
    })
  })
})
