// Claude API 래퍼
// 프론트엔드에서 백엔드 프록시를 통해 Claude API를 호출

import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
} from '../../types/generation'
import type { Subject, Grade, Language } from '../../types/content'

// API 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 정적 배포 모드 확인
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

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

// Claude API 래퍼 클래스
export class ClaudeApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // 콘텐츠 생성 요청
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
      // 프로그레스 업데이트: 분석 중
      if (onProgress) {
        onProgress({
          status: 'preparing',
          progress: 10,
          message: '관심사를 분석하고 있어요...',
        })
      }

      // API 요청 구성
      const request: GenerationRequest = {
        interests: options.interests,
        subject: options.subject,
        grade: options.grade,
        language: options.language,
        additionalContext: options.additionalContext,
      }

      // 프로그레스 업데이트: 생성 시작
      if (onProgress) {
        onProgress({
          status: 'generating',
          progress: 20,
          message: 'AI가 콘텐츠를 생성하고 있어요...',
        })
      }

      // 백엔드 API 호출
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      // 프로그레스 업데이트: 응답 처리 중
      if (onProgress) {
        onProgress({
          status: 'finalizing',
          progress: 80,
          message: '콘텐츠를 마무리하고 있어요...',
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '서버 오류' }))
        throw new Error(errorData.error || `HTTP 오류: ${response.status}`)
      }

      const result = (await response.json()) as GenerationResponse

      // 완료 알림
      if (onProgress) {
        onProgress({
          status: 'completed',
          progress: 100,
          message: '콘텐츠가 완성되었어요!',
          completedAt: new Date().toISOString(),
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

  // 생성 상태 확인 (향후 비동기 생성용)
  async checkGenerationStatus(generationId: string): Promise<GenerationProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate/status/${generationId}`)

      if (!response.ok) {
        throw new Error('상태 조회 실패')
      }

      const data = await response.json()
      return {
        status: data.status as GenerationStatus,
        progress: data.progress || 0,
        message: data.message || '',
      }
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
