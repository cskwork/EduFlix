// 콘텐츠 매니페스트 스키마 정의

// 과목 타입 - kebab-case 슬러그 문자열 (수학/과학/영어 등 기본 과목 + 자격증·코딩 등 자유 과목)
// 저장 경로에 직접 사용되므로 영문 소문자·숫자·하이픈만 허용
export type Subject = string

// UI에서 카드로 제공하는 기본 과목 슬러그
export const BUILTIN_SUBJECTS = ['math', 'science', 'english', 'world-history'] as const
export type BuiltinSubject = (typeof BUILTIN_SUBJECTS)[number]

// 과목 슬러그 검증 (kebab-case)
export const SUBJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSubjectSlug(value: string): boolean {
  return SUBJECT_SLUG_PATTERN.test(value)
}

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

// 난이도 타입 - 학년 대신 UI에서 사용
export type Difficulty = 'easy' | 'medium' | 'hard'

// 난이도 → 학년 매핑 (저장 경로와 기존 검증을 그대로 활용하기 위한 내부 매핑)
export const DIFFICULTY_TO_GRADE: Record<Difficulty, Grade> = {
  easy: 'elementary-5',
  medium: 'middle-2',
  hard: 'high-2',
}

export function gradeForDifficulty(difficulty: Difficulty): Grade {
  return DIFFICULTY_TO_GRADE[difficulty]
}

export function gradeLevelForGrade(grade: Grade): GradeLevel {
  if (grade.startsWith('elementary')) return 'elementary'
  if (grade.startsWith('middle')) return 'middle'
  return 'high'
}

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
  difficulty?: Difficulty // UI 난이도 표시용
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

// 과목 라벨 매핑 (기본 과목 + 알려진 확장 과목)
export const SUBJECT_LABELS: Record<string, string> = {
  math: '수학',
  science: '과학',
  english: '영어',
  'world-history': '세계사',
  coding: '코딩',
  'korean-history': '한국사',
  society: '사회',
  korean: '국어',
  'social-studies': '사회',
  toeic: '토익',
  toefl: '토플',
  'computer-science': '컴퓨터과학',
}

// 슬러그 → 표시 라벨 (매핑에 없으면 슬러그 그대로 반환)
export function subjectLabel(subject: Subject): string {
  return SUBJECT_LABELS[subject] ?? subject
}

// 학년 레벨 라벨 매핑
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

// 난이도 라벨 매핑
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

// 난이도 이모지
export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: '🌱',
  medium: '🌿',
  hard: '🌳',
}

// 콘텐츠 타입 라벨 매핑
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  game: '게임',
  quiz: '퀴즈',
  exploration: '탐험',
  simulation: '시뮬레이션',
  story: '스토리',
}
