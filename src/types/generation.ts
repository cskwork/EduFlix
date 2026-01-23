// AI 생성 관련 타입 정의
import type { Subject, Grade, ContentType, Language } from './content'

// 생성 요청 입력 타입
export interface GenerationRequest {
  interests: string[] // 사용자 관심사 태그
  subject: Subject
  grade: Grade
  contentType?: ContentType // 선택 사항, AI가 결정 가능
  language: Language
  additionalContext?: string // 추가 컨텍스트
}

// 생성 상태 타입
export type GenerationStatus =
  | 'idle'
  | 'preparing'
  | 'generating'
  | 'generating-images'
  | 'finalizing'
  | 'completed'
  | 'error'

// 생성 진행 상태
export interface GenerationProgress {
  status: GenerationStatus
  progress: number // 0-100
  message: string
  startedAt?: string
  completedAt?: string
  error?: string
}

// AI 생성 응답 타입
export interface GenerationResponse {
  success: boolean
  contentId?: string
  manifest?: {
    id: string
    title: string
    description: string
    type: ContentType
  }
  error?: string
  warning?: string // 소프트 워닝 (성공했으나 일부 문제 발생 시)
}

// Claude API 요청 타입
export interface ClaudeRequest {
  model: string
  max_tokens: number
  system: string
  messages: ClaudeMessage[]
}

// Claude 메시지 타입
export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContentBlock[]
}

// Claude 콘텐츠 블록 타입
export interface ClaudeContentBlock {
  type: 'text' | 'image'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
}

// Claude API 응답 타입
export interface ClaudeResponse {
  id: string
  type: string
  role: string
  content: ClaudeContentBlock[]
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// Gemini 이미지 생성 요청 타입
export interface GeminiImageRequest {
  prompt: string
  style?: 'cartoon' | 'realistic' | 'flat' | 'pixel'
  aspectRatio?: '1:1' | '16:9' | '4:3'
}

// Gemini 이미지 생성 응답 타입
export interface GeminiImageResponse {
  success: boolean
  imageUrl?: string
  imageBase64?: string
  error?: string
}

// 생성된 콘텐츠 파일 구조
export interface GeneratedContentFiles {
  html: string
  css: string
  js: string
  manifest: string
  assets?: {
    name: string
    type: 'image' | 'audio' | 'json'
    data: string
  }[]
}

// 콘텐츠 생성 프롬프트 컨텍스트
export interface PromptContext {
  subject: Subject
  grade: Grade
  interests: string[]
  contentType: ContentType
  language: Language
  template: string
  examples?: string[]
}

// 생성 히스토리 항목
export interface GenerationHistoryItem {
  id: string
  request: GenerationRequest
  response: GenerationResponse
  createdAt: string
  duration: number // 생성 소요 시간 (ms)
}
