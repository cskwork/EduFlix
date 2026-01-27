// Claude API 래퍼
// 프론트엔드에서 백엔드 프록시를 통해 art-assets 기반 콘텐츠 생성

import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
  JobStatusResponse,
} from '../../types/generation'
import type { Subject, Grade, Language } from '../../types/content'

// API 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 정적 배포 모드 확인
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

// 폴링 설정
const POLL_INTERVAL_MS = 2000 // 2초마다 폴링
const MAX_POLL_DURATION_MS = 5 * 60 * 1000 // 최대 5분

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

      const createResponse = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ error: '서버 오류' }))
        throw new Error(errorData.error || `HTTP 오류: ${createResponse.status}`)
      }

      const createResult = await createResponse.json()

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
      const statusResponse = await fetch(`${this.baseUrl}/api/generate/status/${jobId}`)

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({ error: '상태 조회 실패' }))
        throw new Error(errorData.error || `상태 조회 HTTP 오류: ${statusResponse.status}`)
      }

      const status = (await statusResponse.json()) as JobStatusResponse

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
      const response = await fetch(`${this.baseUrl}/api/generate/status/${jobId}`)

      if (!response.ok) {
        throw new Error('상태 조회 실패')
      }

      const data = (await response.json()) as JobStatusResponse
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
      const response = await fetch(`${this.baseUrl}/api/health`)
      return response.ok
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
