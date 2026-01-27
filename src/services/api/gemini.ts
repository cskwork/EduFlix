// Gemini 이미지 API 래퍼
// 프론트엔드에서 백엔드 프록시를 통해 Gemini API를 호출하여 이미지 생성
// TODO: /api/generate/image 엔드포인트는 아직 서버에 구현되지 않음.
// 이미지 생성 기능이 필요하면 server/routes/generate.ts에 엔드포인트 추가 필요.

import type { GeminiImageRequest, GeminiImageResponse } from '../../types/generation'
import { buildApiUrl } from './url'

// API 엔드포인트 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 이미지 스타일 타입
export type ImageStyle = 'cartoon' | 'realistic' | 'flat' | 'pixel'

// 이미지 비율 타입
export type AspectRatio = '1:1' | '16:9' | '4:3'

// 이미지 생성 옵션
export interface ImageGenerationOptions {
  prompt: string
  style?: ImageStyle
  aspectRatio?: AspectRatio
}

// 썸네일 생성 옵션
export interface ThumbnailOptions {
  title: string
  subject: string
  contentType: string
  style?: ImageStyle
}

// Gemini API 래퍼 클래스
export class GeminiApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // 이미지 생성 요청
  async generateImage(options: ImageGenerationOptions): Promise<GeminiImageResponse> {
    try {
      const request: GeminiImageRequest = {
        prompt: options.prompt,
        style: options.style || 'cartoon',
        aspectRatio: options.aspectRatio || '1:1',
      }

      const generateUrl = buildApiUrl('/api/generate/image', this.baseUrl)
      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '이미지 생성 실패' }))
        return {
          success: false,
          error: errorData.error || `HTTP 오류: ${response.status}`,
        }
      }

      const result = (await response.json()) as GeminiImageResponse
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 생성 중 오류 발생',
      }
    }
  }

  // 콘텐츠 썸네일 생성
  async generateThumbnail(options: ThumbnailOptions): Promise<GeminiImageResponse> {
    // 과목별 스타일 힌트
    const subjectHints: Record<string, string> = {
      math: '기하학적 도형, 숫자, 수학 기호가 포함된',
      science: '과학 실험 도구, 자연 현상, 분자 구조가 포함된',
      english: '알파벳, 책, 대화 말풍선이 포함된',
    }

    // 콘텐츠 타입별 분위기
    const typeHints: Record<string, string> = {
      game: '재미있고 활기찬',
      quiz: '도전적이고 퀴즈 느낌의',
      exploration: '탐험적이고 호기심을 자극하는',
      simulation: '실험실 또는 시뮬레이션 느낌의',
      story: '이야기책 같은 동화적인',
    }

    const subjectHint = subjectHints[options.subject] || ''
    const typeHint = typeHints[options.contentType] || ''

    const prompt = `${typeHint} ${subjectHint} 교육용 썸네일 이미지. 제목: "${options.title}".
아이들이 좋아할 만한 밝고 친근한 색상,
간단하고 명확한 구성,
텍스트 없이 시각적 요소만으로 내용 전달.
어두운 배경(#1a1a2e)과 어울리는 색상 사용.`

    return this.generateImage({
      prompt,
      style: options.style || 'cartoon',
      aspectRatio: '1:1',
    })
  }

  // 콘텐츠 내부 이미지 생성
  async generateContentImage(
    description: string,
    style: ImageStyle = 'cartoon'
  ): Promise<GeminiImageResponse> {
    const prompt = `교육 콘텐츠용 일러스트: ${description}.
아이들에게 친근한 카툰 스타일,
밝고 선명한 색상,
간단하고 명확한 형태.`

    return this.generateImage({
      prompt,
      style,
      aspectRatio: '16:9',
    })
  }

  // 건강 상태 확인
  async healthCheck(): Promise<boolean> {
    try {
      const healthUrl = buildApiUrl('/api/health', this.baseUrl)
      const response = await fetch(healthUrl)
      return response.ok
    } catch {
      return false
    }
  }
}

// 기본 인스턴스 생성
export const geminiApi = new GeminiApiClient()

// 편의 함수: 이미지 생성
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeminiImageResponse> {
  return geminiApi.generateImage(options)
}

// 편의 함수: 썸네일 생성
export async function generateThumbnail(options: ThumbnailOptions): Promise<GeminiImageResponse> {
  return geminiApi.generateThumbnail(options)
}

// 편의 함수: 콘텐츠 이미지 생성
export async function generateContentImage(
  description: string,
  style?: ImageStyle
): Promise<GeminiImageResponse> {
  return geminiApi.generateContentImage(description, style)
}
