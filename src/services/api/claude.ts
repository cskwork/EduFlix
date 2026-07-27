// Claude API 래퍼
// 프론트엔드에서 Bun API의 로컬 콘텐츠 팩토리를 호출

import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
  JobStatusResponse,
  RenderMode,
  CreatorMode,
  ReviewProgress,
  ReviewStatusResponse,
} from '../../types/generation'
import type { Subject, Grade, Language, Difficulty, ContentType } from '../../types/content'
import { gradeForDifficulty, gradeLevelForGrade } from '../../types/content'
import { buildApiUrl } from './url'
import { t } from '../../i18n'
import { isStaticMode } from './capabilities'
import { withAdminToken } from './adminToken'
import {
  LOCAL_CONTENT_PREFIX,
  saveLocalContent,
  type LocalContent,
} from '../content/localContent'

// 서버리스 생성 함수(api/generate.ts)의 응답 형태
interface ServerlessGenerationResult {
  success?: boolean
  error?: string
  storage?: string
  content?: {
    title: string
    description: string
    type: ContentType
    renderMode: RenderMode
    html: string
    css: string
    js: string
  }
}

// API 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 정적 배포 모드 확인


// 폴링 설정
const POLL_INTERVAL_MS = 2000 // 2초마다 폴링
export const GENERATION_MAX_POLL_DURATION_MS = 8 * 60 * 60 * 1000
export const REVIEW_MAX_POLL_DURATION_MS = 35 * 60 * 1000

// 공통 에러 메시지: 백엔드 연결/환경변수 안내 (언어 전환에 맞춰 매번 새로 읽는다)
const apiUnavailableMessage = () => t('errors.apiUnavailable')

// 생성 요청 타입
export interface ContentGenerationOptions {
  mode?: CreatorMode
  // Option 1 (interest)
  interests?: string[]
  subject?: Subject
  grade?: Grade
  // 공통
  language: Language
  renderMode?: RenderMode
  additionalContext?: string
  // Option 2 (problem)
  problem?: string
  difficulty?: Difficulty
}

// 생성 상태 콜백 타입
export type ProgressCallback = (progress: GenerationProgress) => void
export type JobCreatedCallback = (jobId: string) => void

// JSON 응답 여부 확인
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  return contentType.includes('application/json')
}

// JSON 응답 파싱 (HTML 등 비정상 응답 방어)
async function parseJsonResponse<T>(response: Response, context: string): Promise<T> {
  if (!isJsonResponse(response)) {
    // HTML 응답 등은 body를 살짝 읽어 디버깅 단서를 남긴다
    const preview = (await response.text().catch(() => '')).slice(0, 80)
    const hint = preview.toLowerCase().includes('<!doctype') ? t('errors.htmlResponseHint') : ''
    throw new Error(
      t('errors.notJson', { context, hint, apiHint: apiUnavailableMessage() })
    )
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : t('common.unknownError')
    throw new Error(t('errors.jsonParseFailed', { context, message }))
  }
}

// 에러 응답 메시지 추출 (JSON이 아니어도 안전하게 처리)
async function extractErrorMessage(response: Response, context: string): Promise<string> {
  if (isJsonResponse(response)) {
    const errorData = await response.json().catch(() => null as { error?: string } | null)
    if (errorData?.error) {
      return errorData.error
    }
    return t('errors.httpError', { status: response.status })
  }

  // JSON이 아닌 경우 (정적 index.html 등)에는 안내 메시지를 우선 제공
  const preview = (await response.text().catch(() => '')).slice(0, 80)
  const hint = preview.toLowerCase().includes('<!doctype') ? t('errors.htmlResponseHint') : ''
  return t('errors.notJson', { context, hint, apiHint: apiUnavailableMessage() })
}

// 상태 매핑: JobStatusResponse → GenerationProgress
function mapJobStatusToProgress(jobStatus: JobStatusResponse): GenerationProgress {
  const statusMap: Record<JobStatusResponse['status'], GenerationStatus> = {
    pending: 'queued',
    queued: 'queued',
    processing: 'generating',
    reviewing: 'reviewing',
    completed: 'completed',
    failed: 'error',
  }

  return {
    status: statusMap[jobStatus.status] || 'generating',
    progress: jobStatus.progress,
    message: jobStatus.message,
    error: jobStatus.error,
  }
}

// 정적 배포(Vercel)용 단일 호출 생성
//
// 팩토리 서버가 없는 환경이라 job 폴링을 쓸 수 없다. 서버리스 함수가 3개 파일을
// 응답 본문으로 한 번에 돌려주고, 여기서 IndexedDB에 보관한다.
// 진행률은 실제 단계가 없으므로 대기 중임을 알리는 수준으로만 갱신한다.
export async function generateContentServerless(
  options: ContentGenerationOptions,
  onProgress?: ProgressCallback,
): Promise<GenerationResponse> {
  const startedAt = new Date().toISOString()
  onProgress?.({
    status: 'generating',
    progress: 10,
    message: t('generation.generatingWithLimit'),
    startedAt,
  })

  // 응답이 올 때까지 진행률만 천천히 올려 사용자가 멈춘 것으로 오해하지 않게 한다
  let progress = 10
  const ticker = setInterval(() => {
    progress = Math.min(progress + 2, 90)
    onProgress?.({
      status: 'generating',
      progress,
      message: t('generation.generatingWithLimit'),
      startedAt,
    })
  }, 5000)

  try {
    const request: GenerationRequest = {
      mode: options.mode,
      interests: options.interests,
      subject: options.subject,
      grade: options.grade,
      language: options.language,
      renderMode: options.renderMode,
      additionalContext: options.additionalContext,
      problem: options.problem,
      difficulty: options.difficulty,
    }

    const response = await fetch(buildApiUrl('/api/generate', API_BASE_URL), {
      method: 'POST',
      headers: withAdminToken({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, '/api/generate'))
    }

    const result = await parseJsonResponse<ServerlessGenerationResult>(response, '/api/generate')
    if (!result.success || !result.content) {
      throw new Error(result.error || t('generation.failed'))
    }

    const grade = options.grade ?? (options.difficulty ? gradeForDifficulty(options.difficulty) : 'elementary-5')
    const contentId = `${LOCAL_CONTENT_PREFIX}${crypto.randomUUID()}`
    const stored: LocalContent = {
      id: contentId,
      title: result.content.title,
      description: result.content.description,
      subject: options.subject ?? 'general',
      gradeLevel: gradeLevelForGrade(grade),
      grade,
      type: result.content.type,
      language: options.language,
      html: result.content.html,
      css: result.content.css,
      js: result.content.js,
      createdAt: new Date().toISOString(),
    }
    await saveLocalContent(stored)

    onProgress?.({
      status: 'completed',
      progress: 100,
      message: t('generation.savedLocally'),
      completedAt: new Date().toISOString(),
    })

    return {
      success: true,
      contentId,
      manifest: {
        id: contentId,
        title: stored.title,
        description: stored.description,
        type: stored.type,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : t('generation.failed')
    onProgress?.({
      status: 'error',
      progress: 0,
      message: t('generation.errorOccurred'),
      error: message,
    })
    return { success: false, error: message }
  } finally {
    clearInterval(ticker)
  }
}

// Claude API 래퍼 클래스
export class ClaudeApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // 백엔드 API 연결 상태 확인 (정적 index.html 응답 방어 포함)
  private async ensureApiAvailable(): Promise<void> {
    try {
      const healthUrl = buildApiUrl('/api/health', this.baseUrl)
      const response = await fetch(healthUrl)

      if (!response.ok) {
        throw new Error(t('errors.healthCheckFailed', { status: response.status }))
      }

      const data = await parseJsonResponse<{ status?: string }>(response, '/api/health')
      if (data.status !== 'ok') {
        throw new Error(t('errors.healthCheckUnexpected'))
      }
    } catch (error) {
      const hint = apiUnavailableMessage()
      const message = error instanceof Error ? error.message : hint
      // 안내 문구가 이미 포함되어 있으면 중복해서 붙이지 않는다
      if (message.includes(hint) || message.includes('VITE_API_URL')) {
        throw new Error(message)
      }
      throw new Error(`${message}. ${hint}`)
    }
  }

  // 콘텐츠 생성 요청 (비동기 작업 생성 + 폴링)
  async generateContent(
    options: ContentGenerationOptions,
    onProgress?: ProgressCallback,
    onJobCreated?: JobCreatedCallback,
  ): Promise<GenerationResponse> {
    // 정적 배포에는 팩토리 서버가 없으므로 서버리스 단일 호출 경로로 위임한다
    // (결과는 서버 파일시스템 대신 브라우저 IndexedDB에 보관된다)
    if (isStaticMode) {
      return generateContentServerless(options, onProgress)
    }

    // 생성 시작 알림
    if (onProgress) {
      onProgress({
        status: 'preparing',
        progress: 0,
        message: t('generation.status.preparing'),
        startedAt: new Date().toISOString(),
      })
    }

    try {
      // 정적 배포/프록시 오동작 시 HTML 응답을 조기에 감지한다
      await this.ensureApiAvailable()

      // API 요청 구성 - undefined 필드는 JSON.stringify에서 자동 제외됨
      const request: GenerationRequest = {
        mode: options.mode,
        interests: options.interests,
        subject: options.subject,
        grade: options.grade,
        language: options.language,
        renderMode: options.renderMode,
        additionalContext: options.additionalContext,
        problem: options.problem,
        difficulty: options.difficulty,
      }

      // 작업 생성 요청
      if (onProgress) {
        onProgress({
          status: 'preparing',
          progress: 5,
          message: t('generation.requesting'),
        })
      }

      const createUrl = buildApiUrl('/api/generate', this.baseUrl)
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: withAdminToken({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(request),
      })

      if (!createResponse.ok) {
        const errorMessage = await extractErrorMessage(createResponse, '/api/generate')
        throw new Error(errorMessage)
      }

      const createResult = await parseJsonResponse<{ success?: boolean; jobId?: string; error?: string }>(
        createResponse,
        '/api/generate'
      )

      if (!createResult.success || !createResult.jobId) {
        throw new Error(createResult.error || t('generation.createJobFailed'))
      }

      const jobId = createResult.jobId
      onJobCreated?.(jobId)

      // 폴링 시작
      if (onProgress) {
        onProgress({
          status: 'queued',
          progress: 10,
          message: t('generation.status.queued'),
        })
      }

      // 폴링으로 작업 완료 대기
      const result = await this.pollJobStatus(jobId, onProgress)

      // 완료 알림
      if (onProgress) {
        onProgress({
          status: result.success ? 'completed' : 'error',
          progress: result.success ? 100 : 0,
          message: result.success ? t('generation.completed') : result.error || t('generation.failed'),
          completedAt: new Date().toISOString(),
          error: result.error,
        })
      }

      return result
    } catch (error) {
      // 에러 상태 알림
      if (onProgress) {
        onProgress({
          status: 'error',
          progress: 0,
          message: t('generation.errorOccurred'),
          error: error instanceof Error ? error.message : t('common.unknownError'),
        })
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : t('generation.failed'),
      }
    }
  }

  // 작업 상태 폴링
  private async pollJobStatus(
    jobId: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResponse> {
    const startTime = Date.now()

    while (Date.now() - startTime < GENERATION_MAX_POLL_DURATION_MS) {
      // 상태 조회
      const statusUrl = buildApiUrl(`/api/generate/status/${jobId}`, this.baseUrl)
      const statusResponse = await fetch(statusUrl)

      if (!statusResponse.ok) {
        const errorMessage = await extractErrorMessage(
          statusResponse,
          `/api/generate/status/${jobId}`
        )
        throw new Error(errorMessage)
      }

      const status = await parseJsonResponse<JobStatusResponse>(
        statusResponse,
        `/api/generate/status/${jobId}`
      )

      // 진행 상태 업데이트
      if (onProgress) {
        onProgress(mapJobStatusToProgress(status))
      }

      // 완료 확인
      if (status.status === 'completed') {
        return {
          success: true,
          jobId,
          contentId: status.contentId,
          manifest: status.manifest ? {
            id: status.manifest.id,
            title: status.manifest.title,
            description: status.manifest.description,
            type: status.manifest.type as 'game' | 'quiz' | 'exploration' | 'simulation' | 'story',
          } : undefined,
        }
      }

      // 실패 확인
      if (status.status === 'failed') {
        return {
          success: false,
          jobId,
          error: status.error || t('generation.failed'),
        }
      }

      // 대기 후 다시 폴링
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // 타임아웃
    return {
      success: false,
      jobId,
      error: t('generation.timedOut'),
    }
  }

  // 생성 상태 확인 (단일 조회)
  async checkGenerationStatus(jobId: string): Promise<GenerationProgress> {
    try {
      const statusUrl = buildApiUrl(`/api/generate/status/${jobId}`, this.baseUrl)
      const response = await fetch(statusUrl)

      if (!response.ok) {
        throw new Error(t('generation.statusFetchFailed'))
      }

      const data = await parseJsonResponse<JobStatusResponse>(
        response,
        `/api/generate/status/${jobId}`
      )
      return mapJobStatusToProgress(data)
    } catch {
      return {
        status: 'error',
        progress: 0,
        message: t('generation.statusFetchError'),
      }
    }
  }

  // 건강 상태 확인
  async healthCheck(): Promise<boolean> {
    try {
      const healthUrl = buildApiUrl('/api/health', this.baseUrl)
      const response = await fetch(healthUrl)
      if (!response.ok) {
        return false
      }
      const data = await parseJsonResponse<{ status?: string }>(response, '/api/health')
      return data.status === 'ok'
    } catch {
      return false
    }
  }
}

// 기본 인스턴스 생성
export const claudeApi = new ClaudeApiClient()

// 편의 함수: 콘텐츠 생성
export async function generateContent(
  options: ContentGenerationOptions,
  onProgress?: ProgressCallback,
  onJobCreated?: JobCreatedCallback,
): Promise<GenerationResponse> {
  return claudeApi.generateContent(options, onProgress, onJobCreated)
}

// 편의 함수: 건강 상태 확인
export async function checkApiHealth(): Promise<boolean> {
  return claudeApi.healthCheck()
}

// 리뷰 상태 콜백 타입
export type ReviewProgressCallback = (progress: ReviewProgress) => void

// 콘텐츠 리뷰/개선 요청
export async function reviewContent(
  moduleId: string,
  modulePath: string,
  onProgress?: ReviewProgressCallback
): Promise<{ success: boolean; issues?: ReviewStatusResponse['issues']; error?: string }> {
  // 정적 배포 모드에서는 리뷰 기능 비활성화
  if (isStaticMode) {
    return {
      success: false,
      error: t('generation.reviewUnavailableStatic'),
    }
  }

  // 리뷰 시작 알림
  if (onProgress) {
    onProgress({
      status: 'reviewing',
      progress: 0,
      message: t('generation.reviewStarted'),
    })
  }

  try {
    // 리뷰 작업 생성
    const createUrl = buildApiUrl('/api/generate/review', API_BASE_URL)
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: withAdminToken({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ moduleId, modulePath }),
    })

    if (!createResponse.ok) {
      const errorMessage = await extractErrorMessage(createResponse, '/api/generate/review')
      throw new Error(errorMessage)
    }

    const createResult = await parseJsonResponse<{ success?: boolean; jobId?: string; error?: string }>(
      createResponse,
      '/api/generate/review'
    )

    if (!createResult.success || !createResult.jobId) {
      throw new Error(createResult.error || t('generation.reviewJobCreateFailed'))
    }

    const jobId = createResult.jobId

    // 폴링으로 리뷰 완료 대기
    const startTime = Date.now()
    const maxDuration = REVIEW_MAX_POLL_DURATION_MS

    while (Date.now() - startTime < maxDuration) {
      const statusUrl = buildApiUrl(`/api/generate/review/status/${jobId}`, API_BASE_URL)
      const statusResponse = await fetch(statusUrl)

      if (!statusResponse.ok) {
        throw new Error(t('generation.reviewStatusFetchFailed'))
      }

      const status = await parseJsonResponse<ReviewStatusResponse>(
        statusResponse,
        `/api/generate/review/status/${jobId}`
      )

      // 진행 상태 업데이트
      if (onProgress) {
        onProgress({
          status: status.status === 'completed' ? 'completed' :
                 status.status === 'failed' ? 'error' : 'reviewing',
          progress: status.progress,
          message: status.message,
          issues: status.issues,
          error: status.error,
        })
      }

      // 완료 확인
      if (status.status === 'completed') {
        return {
          success: true,
          issues: status.issues,
        }
      }

      // 실패 확인
      if (status.status === 'failed') {
        return {
          success: false,
          error: status.error || t('generation.reviewFailed'),
        }
      }

      // 대기 후 다시 폴링
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // 타임아웃
    return {
      success: false,
      error: t('generation.reviewTimedOut'),
    }
  } catch (error) {
    if (onProgress) {
      onProgress({
        status: 'error',
        progress: 0,
        message: t('generation.reviewErrorOccurred'),
        error: error instanceof Error ? error.message : t('common.unknownError'),
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : t('generation.reviewFailed'),
    }
  }
}
