// 도메인 값(과목·학년·콘텐츠 타입·난이도)의 표시 라벨을 현재 언어로 해석한다.
// 과거 types/content.ts에 있던 한국어 라벨 맵을 대체한다.
import type {
  ContentType,
  Difficulty,
  Grade,
  GradeLevel,
  Language,
  Subject,
} from '../types/content'
import type { LearningStatus } from '../types/knowledge-map'
import en from './messages/en'
import { t } from './index'

// 번역이 준비된 과목 슬러그 (영어 카탈로그 기준)
const KNOWN_SUBJECTS = new Set(Object.keys(en.labels.subject))

/**
 * 과목 슬러그 → 표시 라벨.
 * 사용자가 직접 만든 과목처럼 번역이 없는 슬러그는 슬러그를 그대로 보여준다.
 */
export function subjectLabel(subject: Subject): string {
  if (!KNOWN_SUBJECTS.has(subject)) return subject
  return t(`labels.subject.${subject}` as 'labels.subject.math')
}

export function gradeLevelLabel(gradeLevel: GradeLevel): string {
  return t(`labels.gradeLevel.${gradeLevel}` as 'labels.gradeLevel.elementary')
}

/** 'middle-2' 같은 학년 문자열을 "Middle grade 2" / "중등 2학년"으로 표시한다 */
export function gradeLabel(grade: Grade | string): string {
  const [level, number] = grade.split('-')
  if (!level || !number) return grade

  return t('labels.gradeLevelWithNumber', {
    level: gradeLevelLabel(level as GradeLevel),
    number,
  })
}

export function contentTypeLabel(type: ContentType): string {
  return t(`labels.contentType.${type}` as 'labels.contentType.game')
}

export function difficultyLabel(difficulty: Difficulty): string {
  return t(`labels.difficulty.${difficulty}` as 'labels.difficulty.easy')
}

export function learningStatusLabel(status: LearningStatus): string {
  return t(`labels.learningStatus.${status}` as 'labels.learningStatus.completed')
}

export function contentLanguageLabel(language: Language): string {
  return t(`labels.contentLanguage.${language}` as 'labels.contentLanguage.ko')
}

/** 난이도 이모지는 언어와 무관하다 */
export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: '🌱',
  medium: '🌿',
  hard: '🌳',
}
