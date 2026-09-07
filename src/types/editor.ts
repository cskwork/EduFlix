// 콘텐츠 편집기 타입 정의

// 편집 가능한 텍스트 항목
export interface EditableText {
  id: string
  label: string // UI 표시 라벨
  path: string // DOM selector 또는 contentData 경로
  value: string
  type: 'title' | 'description' | 'instruction' | 'dialogue' | 'label'
  scene?: string // 속한 씬 (hook, story, core 등)
  originalValue?: string
}

// 편집 가능한 스타일 항목
export interface EditableStyle {
  id: string
  label: string
  variable: string // CSS 변수 이름 (--primary-color 등)
  value: string
  type: 'color' | 'fontSize' | 'spacing'
  category: 'primary' | 'secondary' | 'background' | 'text' | 'accent'
}

// 퀴즈 보기 항목
export interface QuizOption {
  label: string
  value: string | number
  isCorrect: boolean
}

// 편집 가능한 퀴즈 항목
export interface EditableQuiz {
  id: string
  question: string
  options: QuizOption[]
  feedback: {
    correct: string
    incorrect: string
  }
  scene?: string
}

// 전체 편집 가능 콘텐츠 구조
export interface EditableContent {
  contentId: string
  texts: EditableText[]
  styles: EditableStyle[]
  quizzes: EditableQuiz[]
  metadata: {
    title: string
    description: string
  }
}

// postMessage 통신용 메시지 타입
export type EditorMessageType =
  | 'EDITOR_INIT'
  | 'EDITOR_READY'
  | 'EXTRACT_CONTENT'
  | 'CONTENT_EXTRACTED'
  | 'UPDATE_TEXT'
  | 'UPDATE_STYLE'
  | 'UPDATE_QUIZ'
  | 'UPDATE_APPLIED'
  | 'SAVE_REQUEST'
  | 'SAVE_COMPLETE'

// 부모 → iframe 메시지
export interface EditorMessage {
  type: EditorMessageType
  payload?: unknown
}

// 텍스트 업데이트 메시지 페이로드
export interface UpdateTextPayload {
  id: string
  path: string
  value: string
}

// 스타일 업데이트 메시지 페이로드
export interface UpdateStylePayload {
  variable: string
  value: string
}

// 퀴즈 업데이트 메시지 페이로드
export interface UpdateQuizPayload {
  id: string
  question?: string
  options?: QuizOption[]
  feedback?: {
    correct?: string
    incorrect?: string
  }
}

// 콘텐츠 추출 응답 페이로드
export interface ExtractedContentPayload {
  overrides?: SaveContentRequest
  texts: EditableText[]
  styles: EditableStyle[]
  quizzes: EditableQuiz[]
}

// 편집 서비스 저장 요청
export interface SaveContentRequest {
  contentId: string
  texts: EditableText[]
  styles: EditableStyle[]
  quizzes: EditableQuiz[]
}

// 편집 서비스 저장 응답
export interface SaveContentResponse {
  success: boolean
  message?: string
  error?: string
}

// Export/Import 관련 타입
export interface ExportedContent {
  manifest: {
    id: string
    title: string
    subject: string
    gradeLevel: string
    type: string
    version: string
    exportedAt: string
  }
  files: {
    html: string
    css: string
    js: string
  }
}

export interface ImportContentRequest {
  file: File
}

export interface ImportContentResponse {
  success: boolean
  contentId?: string // 새로 생성된 ID (충돌 시)
  originalId?: string // 원본 ID
  message?: string
  error?: string
}
