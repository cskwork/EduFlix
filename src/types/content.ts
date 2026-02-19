// 콘텐츠 매니페스트 스키마 정의

// 과목 타입
export type Subject = 'math' | 'science' | 'english' | 'world-history'

// 학년 레벨 타입
export type GradeLevel = 'elementary' | 'middle' | 'high'

// 세부 학년 타입
export type Grade =
  | 'elementary-1'
  | 'elementary-2'
  | 'elementary-3'
  | 'elementary-4'
  | 'elementary-5'
  | 'elementary-6'
  | 'middle-1'
  | 'middle-2'
  | 'middle-3'
  | 'high-1'
  | 'high-2'
  | 'high-3'

// 콘텐츠 타입
export type ContentType = 'game' | 'quiz' | 'exploration' | 'simulation' | 'story'

// 언어 타입
export type Language = 'ko' | 'en'

// 콘텐츠 매니페스트 인터페이스
export interface ContentManifest {
  id: string
  title: string
  subject: Subject
  gradeLevel: GradeLevel
  grade: Grade
  type: ContentType
  language: Language
  description: string
  thumbnail: string
  path: string
  prerequisites?: string[] // 선수 지식 콘텐츠 ID
  createdAt: string
  updatedAt?: string
  tags?: string[]
  duration?: number // 예상 소요 시간 (분)
  difficulty?: 'easy' | 'medium' | 'hard'
}

// 콘텐츠 카탈로그 (index.json 구조)
export interface ContentCatalog {
  version: string
  lastUpdated: string
  contents: ContentManifest[]
}

// 콘텐츠 카드 표시용 타입
export interface ContentCardData {
  id: string
  title: string
  thumbnail: string
  subject: Subject
  gradeLevel: GradeLevel
  type: ContentType
  description: string
}

// 과목별 콘텐츠 그룹
export interface ContentGroup {
  subject: Subject
  subjectLabel: string
  contents: ContentCardData[]
}

// 과목 라벨 매핑
export const SUBJECT_LABELS: Record<Subject, string> = {
  math: '수학',
  science: '과학',
  english: '영어',
  'world-history': '세계사',
}

// 학년 레벨 라벨 매핑
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

// 콘텐츠 타입 라벨 매핑
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  game: '게임',
  quiz: '퀴즈',
  exploration: '탐험',
  simulation: '시뮬레이션',
  story: '스토리',
}
