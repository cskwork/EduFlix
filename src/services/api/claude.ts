// Claude API 래퍼
// 프론트엔드에서 백엔드 프록시를 통해 art-assets 기반 콘텐츠 생성

import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
  JobStatusResponse,
  ReviewProgress,
  ReviewStatusResponse,
} from '../../types/generation'
import type { Subject, Grade, Language } from '../../types/content'
import { buildApiUrl } from './url'

// API 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 정적 배포 모드 확인
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

// 폴링 설정
const POLL_INTERVAL_MS = 2000 // 2초마다 폴링
const MAX_POLL_DURATION_MS = 5 * 60 * 1000 // 최대 5분

// 공통 에러 메시지: 백엔드 연결/환경변수 안내
const API_UNAVAILABLE_MESSAGE =
  '백엔드 API(/api)가 연결되어 있는지 확인해주세요. 정적 배포라면 VITE_STATIC_MODE=true, 백엔드를 분리했다면 VITE_API_URL 설정이 필요합니다.'

// 생성 요청 타입
export interface ContentGenerationOptions {
  interests: string[]
  subject: Subject
  grade: Grade
  language: Language
  additionalContext?: string
}

// 생성 상태 콜백 타입
export type ProgressCallback = (progress: GenerationProgress) => void

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
    const hint = preview.toLowerCase().includes('<!doctype') ? ' HTML 응답이 감지되었습니다.' : ''
    throw new Error(`API 응답이 JSON이 아닙니다 (${context}).${hint} ${API_UNAVAILABLE_MESSAGE}`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON 파싱 실패'
    throw new Error(`JSON 파싱에 실패했습니다 (${context}): ${message}`)
  }
}

// 에러 응답 메시지 추출 (JSON이 아니어도 안전하게 처리)
async function extractErrorMessage(response: Response, context: string): Promise<string> {
  if (isJsonResponse(response)) {
    const errorData = await response.json().catch(() => null as { error?: string } | null)
    if (errorData?.error) {
      return errorData.error
    }
    return `HTTP 오류: ${response.status}`
  }

  // JSON이 아닌 경우 (정적 index.html 등)에는 안내 메시지를 우선 제공
  const preview = (await response.text().catch(() => '')).slice(0, 80)
  const hint = preview.toLowerCase().includes('<!doctype') ? ' HTML 응답이 감지되었습니다.' : ''
  return `API 오류 응답이 JSON이 아닙니다 (${context}).${hint} ${API_UNAVAILABLE_MESSAGE}`
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
        throw new Error(`헬스 체크 실패: ${response.status}`)
      }

      const data = await parseJsonResponse<{ status?: string }>(response, '/api/health')
      if (data.status !== 'ok') {
        throw new Error('헬스 체크 응답이 예상과 다릅니다')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : API_UNAVAILABLE_MESSAGE
      // 메시지에 이미 안내 문구가 포함되어 있지 않다면 붙여준다
      if (message.includes('VITE_API_URL') || message.includes('백엔드')) {
        throw new Error(message)
      }
      throw new Error(`${message}. ${API_UNAVAILABLE_MESSAGE}`)
    }
  }

  // 콘텐츠 생성 요청 (비동기 작업 생성 + 폴링)
  async generateContent(
    options: ContentGenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<GenerationResponse> {
    // 정적 배포 모드에서는 AI 생성 기능 비활성화
    if (isStaticMode) {
      if (onProgress) {
        onProgress({
          status: 'error',
          progress: 0,
          message: '정적 배포 모드에서는 AI 생성 기능을 사용할 수 없습니다',
          error: '정적 배포 모드에서는 AI 생성 기능을 사용할 수 없습니다',
        })
      }
      return {
        success: false,
        error: '정적 배포 모드에서는 AI 생성 기능을 사용할 수 없습니다. 추후 백엔드 연결 시 활성화됩니다.',
      }
    }

    // 생성 시작 알림
    if (onProgress) {
      onProgress({
        status: 'preparing',
        progress: 0,
        message: '콘텐츠 준비 중...',
        startedAt: new Date().toISOString(),
      })
    }

    try {
      // 정적 배포/프록시 오동작 시 HTML 응답을 조기에 감지한다
      await this.ensureApiAvailable()

      // API 요청 구성
      const request: GenerationRequest = {
        interests: options.interests,
        subject: options.subject,
        grade: options.grade,
        language: options.language,
        additionalContext: options.additionalContext,
      }

      // 작업 생성 요청
      if (onProgress) {
        onProgress({
          status: 'preparing',
          progress: 5,
          message: '콘텐츠 생성을 요청하고 있어요...',
        })
      }

      const createUrl = buildApiUrl('/api/generate', this.baseUrl)
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        throw new Error(createResult.error || '작업 생성에 실패했습니다')
      }

      const jobId = createResult.jobId

      // 폴링 시작
      if (onProgress) {
        onProgress({
          status: 'queued',
          progress: 10,
          message: '생성 대기열에 추가되었어요...',
        })
      }

      // 폴링으로 작업 완료 대기
      const result = await this.pollJobStatus(jobId, onProgress)

      // 완료 알림
      if (onProgress) {
        onProgress({
          status: result.success ? 'completed' : 'error',
          progress: result.success ? 100 : 0,
          message: result.success ? '콘텐츠가 완성되었어요!' : result.error || '생성에 실패했어요',
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
          message: '생성 중 오류가 발생했어요',
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        })
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '콘텐츠 생성 실패',
      }
    }
  }

  // 작업 상태 폴링
  private async pollJobStatus(
    jobId: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResponse> {
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
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
          error: status.error || '콘텐츠 생성에 실패했습니다',
        }
      }

      // 대기 후 다시 폴링
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // 타임아웃
    return {
      success: false,
      jobId,
      error: '콘텐츠 생성 시간이 초과되었습니다. 다시 시도해주세요.',
    }
  }

  // 생성 상태 확인 (단일 조회)
  async checkGenerationStatus(jobId: string): Promise<GenerationProgress> {
    try {
      const statusUrl = buildApiUrl(`/api/generate/status/${jobId}`, this.baseUrl)
      const response = await fetch(statusUrl)

      if (!response.ok) {
        throw new Error('상태 조회 실패')
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
        message: '상태 조회 중 오류 발생',
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
  onProgress?: ProgressCallback
): Promise<GenerationResponse> {
  return claudeApi.generateContent(options, onProgress)
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
      error: '정적 배포 모드에서는 리뷰 기능을 사용할 수 없습니다',
    }
  }

  // 리뷰 시작 알림
  if (onProgress) {
    onProgress({
      status: 'reviewing',
      progress: 0,
      message: '콘텐츠 품질 검토를 시작합니다...',
    })
  }

  try {
    // 리뷰 작업 생성
    const createUrl = buildApiUrl('/api/generate/review', API_BASE_URL)
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      throw new Error(createResult.error || '리뷰 작업 생성에 실패했습니다')
    }

    const jobId = createResult.jobId

    // 폴링으로 리뷰 완료 대기
    const startTime = Date.now()
    const maxDuration = 3 * 60 * 1000 // 3분

    while (Date.now() - startTime < maxDuration) {
      const statusUrl = buildApiUrl(`/api/generate/review/status/${jobId}`, API_BASE_URL)
      const statusResponse = await fetch(statusUrl)

      if (!statusResponse.ok) {
        throw new Error('리뷰 상태 조회 실패')
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
          error: status.error || '리뷰에 실패했습니다',
        }
      }

      // 대기 후 다시 폴링
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // 타임아웃
    return {
      success: false,
      error: '리뷰 시간이 초과되었습니다',
    }
  } catch (error) {
    if (onProgress) {
      onProgress({
        status: 'error',
        progress: 0,
        message: '리뷰 중 오류가 발생했습니다',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '리뷰 실패',
    }
  }
}
