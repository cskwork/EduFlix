import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { GenerationRequest, PreviewContent, ReviewIssue } from '../../src/types/generation'
import { getFactoryLlmConfig } from '../../agents/content-factory/pipeline/lib/engine'
import { assertPlan, type ContentManifest, type PlanOutput } from '../../agents/content-factory/pipeline/lib/validate'
import { runAssetsStage } from '../../agents/content-factory/pipeline/stages/assets'
import { runBuildStage } from '../../agents/content-factory/pipeline/stages/build'
import {
  assertSafeContentId, DEFAULT_CREATOR_MODE, DEFAULT_RENDER_MODE, DIFFICULTY_TO_GRADE,
  isSubjectSlug, readJson, type Difficulty, type FactoryContext,
} from '../../agents/content-factory/pipeline/stages/common'
import { runPlanStage } from '../../agents/content-factory/pipeline/stages/plan'
import { runPublishStage } from '../../agents/content-factory/pipeline/stages/publish'
import { runQaStage, runReviewJudge, runStaticQa } from '../../agents/content-factory/pipeline/stages/qa'
import { runStoryboardStage } from '../../agents/content-factory/pipeline/stages/storyboard'

type GenerationStatus = 'queued' | 'processing' | 'reviewing' | 'completed' | 'failed'

export interface FactoryJob {
  jobId: string
  status: GenerationStatus
  progress: number
  message: string
  createdAt: string
  contentId?: string
  manifest?: Pick<ContentManifest, 'id' | 'title' | 'description' | 'type'>
  issues?: ReviewIssue[]
  error?: string
}

type StageSet = {
  plan: (context: FactoryContext) => Promise<unknown>
  storyboard: (context: FactoryContext) => Promise<unknown>
  assets: (context: FactoryContext) => Promise<unknown>
  build: (context: FactoryContext, revision?: string) => Promise<unknown>
  qa: (context: FactoryContext, rebuild?: (revision: string) => Promise<void>) => Promise<unknown>
  publish: (context: FactoryContext) => Promise<unknown>
}

export class FactoryBusyError extends Error {
  constructor() { super('이미 생성 작업이 진행 중입니다') }
}

const defaultStages: StageSet = {
  plan: runPlanStage,
  storyboard: runStoryboardStage,
  assets: runAssetsStage,
  build: runBuildStage,
  qa: runQaStage,
  publish: runPublishStage,
}

function gradeLevel(grade: string): FactoryContext['gradeLevel'] {
  const level = grade.split('-')[0]
  if (level === 'elementary' || level === 'middle' || level === 'high') return level
  throw new Error(`지원하지 않는 학년입니다: ${grade}`)
}

function supportedSubject(subject: string): string {
  if (!isSubjectSlug(subject)) {
    throw new Error(`지원하지 않는 과목 형태입니다 (kebab-case slug 필요): ${subject}`)
  }
  return subject
}

function gradeForDifficulty(difficulty: Difficulty): string {
  return DIFFICULTY_TO_GRADE[difficulty]
}

// Option 2(problem) 모드에서 문제 텍스트로부터 subject를 추론할 수 없을 때의 기본값.
// 실제 subject는 plan 단계 LLM이 problem에서 추론해 결정하지만, 저장 경로는 미리 잡아야 하므로
// 임시 폴더는 'general' 슬러그로 진행하고 plan 결과로 최종 이동한다.
const TEMP_SUBJECT_FOR_PROBLEM = 'general'

function formatTemporaryRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `gen-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

async function readPreview(contentDir: string): Promise<PreviewContent> {
  const [html, css, js] = await Promise.all([
    readFile(join(contentDir, 'index.html'), 'utf8'),
    readFile(join(contentDir, 'style.css'), 'utf8'),
    readFile(join(contentDir, 'script.js'), 'utf8'),
  ])
  return { phase: 'complete', html, css, js, timestamp: new Date().toISOString() }
}

async function findContentDir(base: string, id: string, depth = 0): Promise<string | undefined> {
  assertSafeContentId(id)
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const path = join(base, entry.name)
    if (entry.name === id && existsSync(join(path, 'index.html'))) return path
    if (depth < 3) {
      const nested = await findContentDir(path, id, depth + 1)
      if (nested) return nested
    }
  }
}

async function listContentIds(base: string): Promise<Set<string>> {
  const ids = new Set<string>()
  for (const subject of await readdir(base, { withFileTypes: true })) {
    if (!subject.isDirectory()) continue
    const subjectDir = join(base, subject.name)
    for (const level of await readdir(subjectDir, { withFileTypes: true })) {
      if (!level.isDirectory()) continue
      const levelDir = join(subjectDir, level.name)
      for (const content of await readdir(levelDir, { withFileTypes: true })) {
        if (content.isDirectory()) ids.add(content.name)
      }
    }
  }
  return ids
}

function assertManifestMatchesPlan(manifest: ContentManifest, plan: PlanOutput, id: string): void {
  if (manifest.id !== id || manifest.title !== plan.title || manifest.description !== plan.description) {
    throw new Error('manifest의 id, title, description은 확정된 기획 메타데이터와 같아야 합니다.')
  }
}

export class FactoryRunner {
  private readonly rootDir: string
  private readonly factoryDir: string
  private readonly stages: StageSet
  private readonly now: () => Date
  private readonly jobs = new Map<string, FactoryJob>()
  private readonly previews = new Map<string, PreviewContent>()
  private readonly completions = new Map<string, Promise<FactoryJob>>()
  private activeJobId?: string

  constructor(options: { rootDir?: string; stages?: StageSet; now?: () => Date } = {}) {
    this.rootDir = resolve(options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), '../..'))
    this.factoryDir = join(this.rootDir, 'agents/content-factory')
    this.stages = options.stages ?? defaultStages
    this.now = options.now ?? (() => new Date())
  }

  getJob(jobId: string): FactoryJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? structuredClone(job) : undefined
  }
  getPreview(jobId: string): PreviewContent | undefined {
    const preview = this.previews.get(jobId)
    return preview ? structuredClone(preview) : undefined
  }
  async waitForJob(jobId: string): Promise<FactoryJob | undefined> {
    const job = await (this.completions.get(jobId) ?? Promise.resolve(this.jobs.get(jobId)))
    return job ? structuredClone(job) : undefined
  }

  startGeneration(request: GenerationRequest): FactoryJob {
    if (this.activeJobId) throw new FactoryBusyError()
    const jobId = crypto.randomUUID()
    const job: FactoryJob = { jobId, status: 'queued', progress: 5, message: '생성 대기열에 추가되었습니다...', createdAt: new Date().toISOString() }
    this.jobs.set(jobId, job)
    this.activeJobId = jobId
    const completion = this.runGeneration(job, request).finally(() => { this.activeJobId = undefined })
    this.completions.set(jobId, completion)
    return structuredClone(job)
  }

  startReview(contentId: string): FactoryJob {
    if (this.activeJobId) throw new FactoryBusyError()
    assertSafeContentId(contentId)
    const jobId = crypto.randomUUID()
    const job: FactoryJob = { jobId, status: 'queued', progress: 5, message: '리뷰 대기열에 추가되었습니다...', createdAt: new Date().toISOString() }
    this.jobs.set(jobId, job)
    this.activeJobId = jobId
    const completion = this.runReview(job, contentId).finally(() => { this.activeJobId = undefined })
    this.completions.set(jobId, completion)
    return structuredClone(job)
  }

  private update(job: FactoryJob, values: Partial<FactoryJob>): void { Object.assign(job, values) }

  private async finalId(plan: PlanOutput): Promise<string> {
    assertSafeContentId(plan.slug)
    let candidate = plan.slug
    let suffix = 2
    const contentIds = await listContentIds(join(this.rootDir, 'public/contents'))
    while (contentIds.has(candidate) ||
           existsSync(join(this.factoryDir, 'runs', candidate))) {
      candidate = `${plan.slug}-${suffix}`
      suffix += 1
    }
    return candidate
  }

  private temporaryRunId(): string {
    const candidateTime = this.now()
    let candidate = formatTemporaryRunId(candidateTime)
    while (existsSync(join(this.factoryDir, 'runs', candidate))) {
      candidateTime.setSeconds(candidateTime.getSeconds() + 1)
      candidate = formatTemporaryRunId(candidateTime)
    }
    return candidate
  }

  private async runGeneration(job: FactoryJob, request: GenerationRequest): Promise<FactoryJob> {
    const temporaryId = this.temporaryRunId()
    let runDir = join(this.factoryDir, 'runs', temporaryId)
    const provider = getFactoryLlmConfig().provider
    const mode = request.mode ?? DEFAULT_CREATOR_MODE

    // 모드별 초기 subject/grade/topic 도출
    let subject: string
    let grade: string
    let topic: string
    if (mode === 'problem') {
      // Option 2: problem 텍스트가 토픽. difficulty → grade 매핑.
      // subject가 사용자에게서 오지 않았으면 plan LLM이 problem에서 추론할 것임.
      subject = request.subject ?? TEMP_SUBJECT_FOR_PROBLEM
      grade = request.grade ?? gradeForDifficulty(request.difficulty!)
      topic = request.problem!
    } else {
      // Option 1 (interest): 관심사가 토픽. subject/grade는 사용자 선택.
      subject = supportedSubject(request.subject!)
      grade = request.grade!
      topic = request.interests!.join(', ')
    }
    const level = gradeLevel(grade)

    const context: FactoryContext = {
      rootDir: this.rootDir, factoryDir: this.factoryDir, runDir,
      contentDir: join(this.rootDir, 'public/contents', subject, level, temporaryId),
      id: temporaryId, topic, grade, gradeLevel: level, subject, language: request.language,
      type: request.contentType, renderMode: request.renderMode ?? DEFAULT_RENDER_MODE,
      force: false, skipImages: provider === 'zai',
      interests: request.interests, additionalContext: request.additionalContext, llmProvider: provider,
      mode, problem: request.problem, difficulty: request.difficulty,
    }
    try {
      await mkdir(runDir, { recursive: true })
      this.update(job, { status: 'processing', progress: 10,
        message: mode === 'problem' ? '문제를 재미있는 콘텐츠로 기획하고 있습니다...' : '학습 주제를 기획하고 있습니다...' })
      await this.stages.plan(context)
      const plan = await readJson<PlanOutput>(join(runDir, 'plan.json'))
      assertPlan(plan)
      const id = await this.finalId(plan)

      // problem 모드에서 사용자가 subject를 주지 않았다면 plan이 결정한 subject로 경로 보정
      if (mode === 'problem' && !request.subject && isSubjectSlug(plan.subject)) {
        subject = supportedSubject(plan.subject)
      }

      const finalRunDir = join(this.factoryDir, 'runs', id)
      await rename(runDir, finalRunDir)
      runDir = finalRunDir
      Object.assign(context, { id, runDir, subject,
        contentDir: join(this.rootDir, 'public/contents', subject, level, id) })

      this.update(job, { progress: 30, contentId: id, message: '스토리보드를 설계하고 있습니다...' })
      await this.stages.storyboard(context)
      this.update(job, { progress: 40, message: '에셋을 준비하고 있습니다...' })
      await this.stages.assets(context)
      this.update(job, { progress: 50, message: '콘텐츠를 제작하고 있습니다... (수 분 소요)' })
      await this.stages.build(context)
      const assertCurrentManifest = async () => assertManifestMatchesPlan(
        await readJson<ContentManifest>(join(context.contentDir, 'manifest.json')), plan, id,
      )
      await assertCurrentManifest()
      this.previews.set(job.jobId, await readPreview(context.contentDir))
      this.update(job, { status: 'reviewing', progress: 80, message: '품질을 검증하고 있습니다...' })
      await this.stages.qa(context, async (revision) => {
        await this.stages.build(context, revision)
        await assertCurrentManifest()
        this.previews.set(job.jobId, await readPreview(context.contentDir))
      })
      this.update(job, { progress: 95, message: '카탈로그에 등록하고 있습니다...' })
      await assertCurrentManifest()
      await this.stages.publish(context)
      const manifest = await readJson<ContentManifest>(join(context.contentDir, 'manifest.json'))
      this.update(job, { status: 'completed', progress: 100, message: '콘텐츠가 완성되었습니다!', contentId: id,
        manifest: { id: manifest.id, title: manifest.title, description: manifest.description, type: manifest.type } })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.update(job, { status: 'failed', progress: 0, message, error: message })
    }
    return job
  }

  private async runReview(job: FactoryJob, contentId: string): Promise<FactoryJob> {
    try {
      const contentDir = await findContentDir(join(this.rootDir, 'public/contents'), contentId)
      if (!contentDir) throw new Error(`콘텐츠를 찾지 못했습니다: ${contentId}`)
      this.update(job, { status: 'reviewing', progress: 40, message: '정적 검사를 실행하고 있습니다...' })
      const report = await runStaticQa({ contentDir })
      const judge = await runReviewJudge({ rootDir: this.rootDir, factoryDir: this.factoryDir, contentDir, contentId, staticReport: report })
      const issues: ReviewIssue[] = [
        ...report.checks.filter((item) => item.status === 'fail').flatMap((item) => item.errors.map((message) =>
          ({ severity: 'high' as const, location: item.name, message }))),
        ...judge.criteria.filter((item) => item.status === 'fail').map((item) => ({
          severity: 'medium' as const, location: item.id, message: item.evidence.join(' '), fix: item.fix,
        })),
      ]
      this.update(job, { status: 'completed', progress: 100, message: '리뷰가 완료되었습니다!', contentId: basename(contentDir), issues })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.update(job, { status: 'failed', progress: 0, message, error: message })
    }
    return job
  }
}

export const factoryRunner = new FactoryRunner()
