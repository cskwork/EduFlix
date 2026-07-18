// AI 콘텐츠 생성·리뷰 API 엔드포인트
import type { GenerationRequest } from '../../src/types/generation'
import { getFactoryLlmConfig } from '../../agents/content-factory/pipeline/lib/engine'
import {
  assertSafeContentId,
  DEFAULT_CREATOR_MODE,
  DIFFICULTY_TO_GRADE,
  isSubjectSlug,
  RENDER_MODES,
} from '../../agents/content-factory/pipeline/stages/common'
import { FactoryBusyError, factoryRunner, type FactoryRunner } from '../services/factory-runner'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response
export interface GenerateRouteDependencies {
  runner: Pick<FactoryRunner, 'startGeneration' | 'startReview' | 'getJob'>
  getConfig: typeof getFactoryLlmConfig
}

const defaultDependencies: GenerateRouteDependencies = {
  runner: factoryRunner,
  getConfig: getFactoryLlmConfig,
}

const VALID_GRADES = new Set([
  'elementary-1', 'elementary-2', 'elementary-3', 'elementary-4', 'elementary-5', 'elementary-6',
  'middle-1', 'middle-2', 'middle-3', 'high-1', 'high-2', 'high-3',
])
const VALID_DIFFICULTIES = new Set<string>(Object.keys(DIFFICULTY_TO_GRADE))
const VALID_MODES = new Set<string>(['interest', 'problem'])
const VALID_RENDER_MODES = new Set<string>(RENDER_MODES)
const PROBLEM_MAX_LENGTH = 5000

function validateGeneration(body: GenerationRequest): string | undefined {
  // 공통 필수
  if (!body.language) return '필수 필드가 누락되었습니다: language'

  const mode = body.mode ?? DEFAULT_CREATOR_MODE
  if (!VALID_MODES.has(mode)) return 'mode는 interest 또는 problem이어야 합니다'

  if (body.renderMode !== undefined && !VALID_RENDER_MODES.has(body.renderMode)) {
    return `renderMode는 ${RENDER_MODES.join(', ')} 중 하나여야 합니다`
  }

  if (mode === 'interest') {
    // Option 1: interests + subject + grade 필수
    if (!body.interests || !body.subject || !body.grade) {
      return 'interest 모드에는 interests, subject, grade가 필요합니다'
    }
    if (!Array.isArray(body.interests) || body.interests.length === 0 ||
        body.interests.length > 10 ||
        body.interests.some((item) => typeof item !== 'string' || item.length > 100)) {
      return 'interests는 최소 1개, 최대 10개의 문자열 배열이어야 합니다'
    }
    if (!isSubjectSlug(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다 (예: math, coding, toeic)'
    }
    if (!VALID_GRADES.has(body.grade)) return '유효하지 않은 학년입니다'
  } else {
    // Option 2 (problem): problem + difficulty 필수
    if (!body.problem || typeof body.problem !== 'string' ||
        body.problem.trim().length < 5 || body.problem.length > PROBLEM_MAX_LENGTH) {
      return `problem은 5자 이상 ${PROBLEM_MAX_LENGTH}자 이하의 문자열이어야 합니다`
    }
    if (!body.difficulty || !VALID_DIFFICULTIES.has(body.difficulty)) {
      return `difficulty는 ${[...VALID_DIFFICULTIES].join(', ')} 중 하나여야 합니다`
    }
    // subject는 선택: 없으면 AI가 problem에서 추론. 있으면 slug 검증.
    if (body.subject !== undefined && !isSubjectSlug(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다'
    }
  }
  return undefined
}

export async function handleGenerateRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse,
  dependencies: GenerateRouteDependencies = defaultDependencies,
): Promise<Response> {
  const pathname = new URL(req.url).pathname

  if (req.method === 'POST' && pathname === '/api/generate') {
    try {
      const body = (await req.json()) as GenerationRequest
      const validationError = validateGeneration(body)
      if (validationError) return errorResponse(validationError, 400)
      const config = dependencies.getConfig()
      if (!config.keyConfigured) return errorResponse('ZAI_API_KEY가 설정되지 않아 콘텐츠를 생성할 수 없습니다', 503)
      const job = dependencies.runner.startGeneration(body)
      return jsonResponse({ success: true, jobId: job.jobId, message: job.message }, 202)
    } catch (error) {
      if (error instanceof FactoryBusyError) return errorResponse(error.message, 409)
      const message = error instanceof Error ? error.message : '콘텐츠 생성 요청 실패'
      return errorResponse(message, 500)
    }
  }

  if (req.method === 'GET' && pathname.startsWith('/api/generate/status/')) {
    const jobId = pathname.split('/').pop()
    if (!jobId) return errorResponse('작업 ID가 필요합니다', 400)
    const job = dependencies.runner.getJob(jobId)
    return job ? jsonResponse(job) : errorResponse('작업을 찾을 수 없습니다', 404)
  }

  if (req.method === 'POST' && pathname === '/api/generate/review') {
    try {
      const body = (await req.json()) as { contentId?: string; moduleId?: string }
      const contentId = body.contentId ?? body.moduleId
      if (!contentId) return errorResponse('contentId가 필요합니다', 400)
      try { assertSafeContentId(contentId) }
      catch { return errorResponse('contentId는 안전한 slug여야 합니다', 400) }
      const config = dependencies.getConfig()
      if (!config.keyConfigured) return errorResponse('ZAI_API_KEY가 설정되지 않아 리뷰를 실행할 수 없습니다', 503)
      const job = dependencies.runner.startReview(contentId)
      return jsonResponse({ success: true, jobId: job.jobId, reviewJobId: job.jobId, message: job.message }, 202)
    } catch (error) {
      if (error instanceof FactoryBusyError) return errorResponse(error.message, 409)
      const message = error instanceof Error ? error.message : '리뷰 요청 실패'
      return errorResponse(message, 500)
    }
  }

  if (req.method === 'GET' && pathname.startsWith('/api/generate/review/status/')) {
    const jobId = pathname.split('/').pop()
    if (!jobId) return errorResponse('작업 ID가 필요합니다', 400)
    const job = dependencies.runner.getJob(jobId)
    if (!job) return errorResponse('작업을 찾을 수 없습니다', 404)
    return jsonResponse({
      jobId: job.jobId,
      status: job.status === 'queued' ? 'pending' :
        job.status === 'processing' || job.status === 'reviewing' ? 'processing' : job.status,
      progress: job.progress,
      message: job.message,
      issues: job.issues,
      improvedFiles: [],
      error: job.error,
    })
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}
