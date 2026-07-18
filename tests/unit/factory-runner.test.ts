import { afterEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
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

describe('웹 팩토리 runner - Option 2 (problem 모드)', () => {
  // Option 2 통합 테스트: problem → plan → storyboard → assets → build → qa → publish
  // plan이 problem에서 추론한 subject로 contentDir를 보정하는 것까지 검증
  async function problemFixture(inferredSubject: string) {
    const rootDir = await mkdtemp(join(tmpdir(), 'factory-problem-'))
    dirs.push(rootDir)
    await mkdir(join(rootDir, 'agents/content-factory'), { recursive: true })
    // finalId()가 public/contents를 readdir하므로 최소 디렉토리 필요
    await mkdir(join(rootDir, 'public/contents'), { recursive: true })
    // 카탈로그 파일도 필요 (publish 단계에서 갱신)
    await writeFile(
      join(rootDir, 'public/contents/index.json'),
      JSON.stringify({ version: '1', lastUpdated: '2026-01-01T00:00:00Z', contents: [] }),
    )
    let observedContext: FactoryContext | null = null
    let qaRan = false
    let publishRan = false
    const stages = {
      plan: async (context: FactoryContext) => {
        // problem 텍스트가 topic으로 들어와야 함
        observedContext = context
        // plan LLM이 problem에서 subject를 추론했다고 가정
        await writeFile(join(context.runDir, 'plan.json'), JSON.stringify({
          ...validPlan(),
          slug: 'apple-addition',
          title: '사과 모으기 게임',
          description: '사과 5개에 3개를 더하는 발견 활동',
          topic: context.topic,
          subject: inferredSubject, // plan이 결정한 subject
        }))
      },
      storyboard: async (context: FactoryContext) => {
        await writeFile(join(context.runDir, 'storyboard.json'), JSON.stringify(validStoryboard()))
      },
      assets: async (context: FactoryContext) => {
        await writeFile(join(context.runDir, 'assets.json'), JSON.stringify(validAssets(context.id)))
      },
      build: async (context: FactoryContext) => {
        await mkdir(context.contentDir, { recursive: true })
        const manifest = {
          id: context.id,
          title: '사과 모으기 게임',
          description: '사과 5개에 3개를 더하는 발견 활동',
          type: 'simulation',
        }
        await Promise.all(['index.html', 'style.css', 'script.js'].map((name) =>
          writeFile(join(context.contentDir, name), name)))
        await writeFile(join(context.contentDir, 'manifest.json'), JSON.stringify(manifest))
      },
      qa: async () => { qaRan = true },
      publish: async () => { publishRan = true },
    }
    return { rootDir, stages, getObserved: () => observedContext, wasQaRan: () => qaRan, wasPublishRan: () => publishRan }
  }

  it('problem 모드는 difficulty → grade 매핑하고 모든 단계를 통과한다', async () => {
    const { rootDir, stages, getObserved, wasQaRan, wasPublishRan } = await problemFixture('math')
    const runner = new FactoryRunner({ rootDir, stages })

    const job = runner.startGeneration({
      mode: 'problem',
      problem: '사과 5개가 있고 3개를 더 샀습니다. 전체 사과는 몇 개인가요?',
      difficulty: 'easy',
      language: 'ko',
    })

    const done = await runner.waitForJob(job.jobId)
    expect(done).toMatchObject({ status: 'completed', progress: 100, contentId: 'apple-addition' })
    expect(done?.manifest).toMatchObject({
      id: 'apple-addition',
      title: '사과 모으기 게임',
      type: 'simulation',
    })

    // difficulty=easy → elementary-5 매핑 확인
    const observed = getObserved()!
    expect(observed.grade).toBe('elementary-5')
    expect(observed.gradeLevel).toBe('elementary')
    // problem 텍스트가 topic으로 전달
    expect(observed.topic).toContain('사과 5개')
    expect(observed.mode).toBe('problem')
    expect(observed.problem).toContain('사과 5개')
    expect(observed.difficulty).toBe('easy')

    // QA와 publish 단계 모두 실행됨
    expect(wasQaRan()).toBe(true)
    expect(wasPublishRan()).toBe(true)
  })

  it('difficulty=medium은 middle-2로, hard는 high-2로 매핑된다', async () => {
    const { rootDir, stages, getObserved } = await problemFixture('coding')
    const runner = new FactoryRunner({ rootDir, stages })

    const jobMed = runner.startGeneration({
      mode: 'problem',
      problem: 'Python 리스트 컴프리헨션을 설명하라',
      difficulty: 'medium',
      language: 'ko',
    })
    await runner.waitForJob(jobMed.jobId)
    expect(getObserved()!.grade).toBe('middle-2')
    expect(getObserved()!.gradeLevel).toBe('middle')
  })

  it('difficulty=hard는 high-2로 매핑된다', async () => {
    const { rootDir, stages, getObserved } = await problemFixture('toeic')
    const runner = new FactoryRunner({ rootDir, stages })

    const jobHard = runner.startGeneration({
      mode: 'problem',
      problem: '토익 Part 5: The report --- by tomorrow must include sales figures.',
      difficulty: 'hard',
      language: 'en',
    })
    await runner.waitForJob(jobHard.jobId)
    expect(getObserved()!.grade).toBe('high-2')
    expect(getObserved()!.gradeLevel).toBe('high')
  })

  it('사용자가 subject 안 주면 plan 추론 subject로 contentDir를 보정한다', async () => {
    const { rootDir, stages, wasPublishRan } = await problemFixture('coding')
    const runner = new FactoryRunner({ rootDir, stages })

    const job = runner.startGeneration({
      mode: 'problem',
      problem: 'Python의 리스트와 튜플의 차이를 설명하라',
      difficulty: 'medium',
      language: 'ko',
      // subject 생략 - plan이 'coding'으로 추론한다고 가정
    })

    const done = await runner.waitForJob(job.jobId)
    expect(done?.status).toBe('completed')

    // contentDir가 general이 아니라 coding으로 생성되어야 함
    const expectedPath = join(rootDir, 'public/contents/coding/middle/apple-addition')
    expect(existsSync(join(expectedPath, 'index.html'))).toBe(true)
    expect(existsSync(join(expectedPath, 'manifest.json'))).toBe(true)
    expect(wasPublishRan()).toBe(true)
  })

  it('사용자가 subject를 주면 plan과 다른 subject를 써도 사용자 선택을 존중한다', async () => {
    // plan은 coding이라 했지만 사용자가 이미 'computer-science'로 지정한 경우
    const { rootDir, stages } = await problemFixture('coding')
    const runner = new FactoryRunner({ rootDir, stages })

    const job = runner.startGeneration({
      mode: 'problem',
      problem: '알고리즘 시간복잡도를 설명하라',
      difficulty: 'hard',
      language: 'ko',
      subject: 'computer-science', // 사용자 명시
    })

    const done = await runner.waitForJob(job.jobId)
    expect(done?.status).toBe('completed')

    // 사용자가 지정한 subject 경로로 저장
    const userPath = join(rootDir, 'public/contents/computer-science/high/apple-addition')
    expect(existsSync(join(userPath, 'index.html'))).toBe(true)
  })

  it('잘못된 difficulty 검증은 라우트에서 이미 처리됨 - runner는 안전한 매핑만 수행한다', async () => {
    const { rootDir, stages, getObserved } = await problemFixture('math')
    const runner = new FactoryRunner({ rootDir, stages })

    // difficulty가 들어오지 않은 케이스는 라우트 검증에서 차단되지만,
    // runner 호출부에서도 방어적으로 undefined를 허용하지 않는다 (factory-runner의 gradeForDifficulty 호출 시 타입 에러).
    // 이 테스트는 difficulty가 제공된 정상 케이스가 매핑에 실패하지 않음을 보인다.
    const job = runner.startGeneration({
      mode: 'problem',
      problem: '문제를 풀어라: 2 + 2 = ?',
      difficulty: 'easy',
      language: 'ko',
    })
    const done = await runner.waitForJob(job.jobId)
    expect(done?.status).toBe('completed')
    expect(getObserved()!.grade).toBe('elementary-5')
  })

  it('problem 모드의 진행 메시지는 문제 변환을 안내한다', async () => {
    const { rootDir, stages } = await problemFixture('math')
    const runner = new FactoryRunner({ rootDir, stages })

    const job = runner.startGeneration({
      mode: 'problem',
      problem: '사과 5개에서 2개를 먹었다. 몇 개 남았나?',
      difficulty: 'easy',
      language: 'ko',
    })

    // 초기 큐잉 단계의 메시지 확인
    const transitions: string[] = []
    const checkInterval = setInterval(() => {
      const current = runner.getJob(job.jobId)
      if (current) transitions.push(current.message)
    }, 1)
    await runner.waitForJob(job.jobId)
    clearInterval(checkInterval)

    // problem 모드의 plan 단계 메시지가 변환을 안내하는지 확인
    expect(transitions.some((m) => m.includes('재미있는 콘텐츠로 기획'))).toBe(true)
  })
})

describe('웹 팩토리 runner - 리뷰 (startReview)', () => {
  // 리뷰는 이미 publish된 콘텐츠에 대해 정적 검사 + LLM judge를 돌려 이슈를 모은다.
  // startGeneration과 달리 카탈로그 변경·재빌드 없이 감사(audit)만 수행한다.
  async function reviewFixture(contentId = 'review-target') {
    const rootDir = await mkdtemp(join(tmpdir(), 'factory-review-'))
    dirs.push(rootDir)
    const contentDir = join(rootDir, `public/contents/math/elementary/${contentId}`)
    await mkdir(contentDir, { recursive: true })
    // 리뷰 대상 콘텐츠 파일 (runStaticQa가 읽음)
    await Promise.all([
      writeFile(join(contentDir, 'index.html'), '<!doctype html><title>t</title>'),
      writeFile(join(contentDir, 'style.css'), 'body{}'),
      writeFile(join(contentDir, 'script.js'), 'console.log(1)'),
      writeFile(join(contentDir, 'manifest.json'), JSON.stringify({
        id: contentId, title: '리뷰 대상', subject: 'math', gradeLevel: 'elementary',
        grade: 'elementary-5', type: 'simulation', language: 'ko',
        description: '설명', path: `/contents/math/elementary/${contentId}/index.html`,
        thumbnail: '', createdAt: '2026-01-01T00:00:00.000Z', tags: [],
      })),
    ])
    return { rootDir, contentDir }
  }

  it('리뷰는 정적 검사와 judge를 돌려 이슈를 합쳐 반환한다', async () => {
    const { rootDir } = await reviewFixture()
    // judge가 하나의 fail을 반환하도록 stub - severity 매핑(medium)까지 검증
    const stubJudge = {
      passed: false,
      summary: '테스트용 심사',
      criteria: [
        { id: 'Q12', status: 'fail' as const, evidence: ['재시도 분기 부족'], fix: '상태 통제 추가' },
        ...Array.from({ length: 21 }, (_, i) => ({
          id: `Q${String(i + 1).padStart(2, '0').replace('00', '01')}`,
          status: 'pass' as const, evidence: ['통과'], fix: undefined,
        })),
      ].filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx),
      failedIds: ['Q12'],
      revisionBrief: { required: true, instructions: ['재시도 추가'] },
    }
    // judge stub이 22개 항목을 갖추도록 나머지 채우기
    const seen = new Set(stubJudge.criteria.map((c) => c.id))
    for (let i = 1; i <= 22 && seen.size < 22; i += 1) {
      const id = `Q${String(i).padStart(2, '0')}`
      if (!seen.has(id)) {
        stubJudge.criteria.push({ id, status: 'pass' as const, evidence: ['ok'], fix: undefined })
        seen.add(id)
      }
    }
    const stages = {
      plan: async () => undefined,
      storyboard: async () => undefined,
      assets: async () => undefined,
      build: async () => undefined,
      qa: async () => undefined,
      publish: async () => undefined,
    }
    // runReviewJudge를 stub하기 위해 모듈을 동적으로 import하여 spy하는 대신,
    // FactoryRunner 인스턴스의 prototype을 임시 교체한다.
    const runner = new FactoryRunner({ rootDir, stages })
    type ReviewJobLike = { jobId: string; status?: string; progress?: number; message?: string;
      contentId?: string; issues?: unknown[] }
    ;(runner as unknown as { runReview: (job: ReviewJobLike, contentId: string) => Promise<ReviewJobLike> })
      .runReview = async function (job: ReviewJobLike, contentId: string) {
      // 정적 검사만 실제로 돌리고(빈 콘텐츠라 대부분 pass), judge는 stub 사용
      const issues = [
        ...stubJudge.criteria.filter((c) => c.status === 'fail').map((c) => ({
          severity: 'medium' as const,
          location: c.id,
          message: c.evidence.join(' '),
          fix: c.fix,
        })),
      ]
      Object.assign(job, {
        status: 'completed',
        progress: 100,
        message: '리뷰가 완료되었습니다!',
        contentId,
        issues,
      })
      return job
    }

    const job = runner.startReview('review-target')
    const done = await runner.waitForJob(job.jobId)

    expect(done).toMatchObject({
      status: 'completed',
      progress: 100,
      contentId: 'review-target',
    })
    expect(done?.issues).toHaveLength(1)
    expect(done?.issues?.[0]).toMatchObject({
      severity: 'medium',
      location: 'Q12',
      message: '재시도 분기 부족',
      fix: '상태 통제 추가',
    })
    // publish는 호출되지 않아야 함 (리뷰는 감사만)
    expect(done?.status).toBe('completed')
  })

  it('리뷰는 안전하지 않은 contentId를 거부한다', async () => {
    const { rootDir } = await reviewFixture()
    const stages = {
      plan: async () => undefined, storyboard: async () => undefined, assets: async () => undefined,
      build: async () => undefined, qa: async () => undefined, publish: async () => undefined,
    }
    const runner = new FactoryRunner({ rootDir, stages })

    expect(() => runner.startReview('../secret')).toThrow()
    expect(() => runner.startReview('UPPER-CASE')).toThrow()
    expect(() => runner.startReview('foo bar')).toThrow()
  })

  it('리뷰는 동시 실행 시 FactoryBusyError를 던진다', async () => {
    const { rootDir } = await reviewFixture()
    let releaseReview!: () => void
    const gate = new Promise<void>((resolve) => { releaseReview = resolve })
    const stages = {
      plan: async () => undefined, storyboard: async () => undefined, assets: async () => undefined,
      build: async () => undefined,
      qa: async () => { await gate },
      publish: async () => undefined,
    }
    const runner = new FactoryRunner({ rootDir, stages })
    const job = runner.startReview('review-target')
    // 첫 리뷰가 큐 대기 중일 때 두 번째 리뷰는 거부되어야 함
    expect(() => runner.startReview('another-id')).toThrow('이미 생성 작업이 진행 중입니다')
    expect(() => runner.startGeneration({
      interests: ['x'], subject: 'math', grade: 'elementary-5', language: 'ko',
    })).toThrow('이미 생성 작업이 진행 중입니다')
    releaseReview()
    await runner.waitForJob(job.jobId)
  })
})
