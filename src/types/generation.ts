// AI 생성 관련 타입 정의
import type { Subject, Grade, ContentType, ContentManifest, Language, Difficulty } from './content'

import type { LessonDocument } from './lesson'

// 콘텐츠 제작(렌더링) 방식 - 3d(Three.js 시뮬레이션)가 기본값
export type RenderMode = '3d' | '3d-game' | 'canvas-game' | 'svg' | 'dom'

// 생성 모드 - Option 1(관심사 기반)과 Option 2(문제 기반)
export type CreatorMode = 'interest' | 'problem'

// 생성 요청 입력 타입
export interface GenerationRequest {
  editableLesson?: boolean
  lessonBrief?: Omit<LessonDocument, 'blocks'>
  mode?: CreatorMode // 기본값: 'interest'
  language: Language
  renderMode?: RenderMode // 선택 사항, 미지정 시 3d

  // Option 1 (interest mode)
  interests?: string[] // 사용자 관심사 태그
  subject?: Subject // 미지정 시 AI가 problem에서 추론
  grade?: Grade // difficulty로부터 매핑, 또는 직접 지정
  contentType?: ContentType // 선택 사항, AI가 결정 가능
  additionalContext?: string // 추가 컨텍스트

  // Option 2 (problem mode)
  problem?: string // 사용자가 입력한 원본 문제 텍스트
  difficulty?: Difficulty // easy | medium | hard
}

// 생성 상태 타입
export type GenerationStatus =
  | 'idle'
  | 'preparing'
  | 'queued'      // 로컬 단일 실행 대기
  | 'generating'
  | 'generating-images'
  | 'reviewing'   // 정적 QA와 LLM judge 실행 중
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
  jobId?: string    // 작업 ID (비동기 생성용)
  contentId?: string
  manifest?: Partial<ContentManifest> & {
    id: string
    title: string
    description: string
    type: ContentType
  }
  error?: string
  warning?: string // 소프트 워닝 (성공했으나 일부 문제 발생 시)
}

// 로컬 팩토리 작업 상태 응답 타입
export interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'queued' | 'processing' | 'reviewing' | 'completed' | 'failed'
  progress: number
  message: string
  contentId?: string
  manifest?: {
    id: string
    title: string
    description: string
    type: ContentType
    subject?: Subject
    gradeLevel?: ContentManifest['gradeLevel']
    grade?: Grade
    path?: string
    language?: Language
  }
  error?: string
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

// 리뷰 이슈 타입
export interface ReviewIssue {
  severity: 'high' | 'medium' | 'low'
  location: string
  message: string
  fix?: string
}

// 리뷰 요청 타입
export interface ReviewRequest {
  contentId: string
  modulePath: string
}

// 리뷰 응답 타입
export interface ReviewResponse {
  success: boolean
  reviewJobId?: string
  issues?: ReviewIssue[]
  error?: string
}

// 리뷰 상태 응답 타입
export interface ReviewStatusResponse {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  issues?: ReviewIssue[]
  improvedFiles?: string[]
  error?: string
}

// 리뷰 진행 상태
export interface ReviewProgress {
  status: 'idle' | 'reviewing' | 'completed' | 'error'
  progress: number
  message: string
  issues?: ReviewIssue[]
  error?: string
}

// 실시간 프리뷰 콘텐츠 타입
export interface PreviewContent {
  phase: 'html' | 'css' | 'js' | 'complete'
  html?: string
  css?: string
  js?: string
  timestamp?: string
}
