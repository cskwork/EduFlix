// AI 콘텐츠 생성·리뷰 API 엔드포인트
import type { GenerationRequest } from '../../src/types/generation'
import { getFactoryLlmConfig } from '../../agents/content-factory/pipeline/lib/engine'
import { assertSafeContentId } from '../../agents/content-factory/pipeline/stages/common'
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
const VALID_SUBJECTS = new Set(['math', 'science', 'english'])

function validateGeneration(body: GenerationRequest): string | undefined {
  if (!body.interests || !body.subject || !body.grade || !body.language) {
    return '필수 필드가 누락되었습니다: interests, subject, grade, language'
  }
  if (!Array.isArray(body.interests) || body.interests.length > 10 ||
      body.interests.some((item) => typeof item !== 'string' || item.length > 100)) {
    return 'interests는 최대 10개의 문자열 배열이어야 합니다'
  }
  if (!VALID_SUBJECTS.has(body.subject)) return 'subject는 math, science, english 중 하나여야 합니다'
  if (!VALID_GRADES.has(body.grade)) return '유효하지 않은 학년입니다'
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
