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

// 카탈로그 메타데이터의 언어별 번역
// key = i18n locale code ('en' | 'ko' | ...), 없으면 원문(title/description)으로 폴백
export type ContentTranslations = Record<
  string,
  {
    title?: string
    description?: string
  }
>

// 콘텐츠 매니페스트 인터페이스
export interface ContentManifest {
  id: string
  title: string
  /** 언어별 제목·설명 (선택). 없으면 원문을 그대로 보여준다 */
  translations?: ContentTranslations
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

// 표시 라벨(과목·학년·콘텐츠 타입·난이도)은 언어별로 달라지므로 src/i18n/labels.ts가 담당한다.
// 여기서는 언어와 무관한 스키마·매핑만 유지한다.
