// 콘텐츠 생성 요청 검증 (Bun 서버 라우트와 Vercel 서버리스 함수가 공유)
import { editableLessonBrief } from '../../api/generate'
import type { GenerationRequest } from '../../src/types/generation'
import {
  DEFAULT_CREATOR_MODE,
  DIFFICULTY_TO_GRADE,
  isSubjectSlug,
  RENDER_MODES,
} from '../../agents/content-factory/pipeline/stages/common'

export const VALID_GRADES = new Set([
  'elementary-1', 'elementary-2', 'elementary-3', 'elementary-4', 'elementary-5', 'elementary-6',
  'middle-1', 'middle-2', 'middle-3', 'high-1', 'high-2', 'high-3',
])
export const VALID_DIFFICULTIES = new Set<string>(Object.keys(DIFFICULTY_TO_GRADE))
export const VALID_MODES = new Set<string>(['interest', 'problem'])
export const VALID_RENDER_MODES = new Set<string>(RENDER_MODES)
export const PROBLEM_MAX_LENGTH = 5000

// 유효하면 undefined, 아니면 사용자에게 보여줄 오류 메시지를 반환한다
export function validateGeneration(body: GenerationRequest): string | undefined {
  // 공통 필수
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '요청 본문은 JSON 객체여야 합니다'
  if (!body.language) return '필수 필드가 누락되었습니다: language'
  if (body.language !== 'ko' && body.language !== 'en') return 'language는 ko 또는 en이어야 합니다'
  if (body.editableLesson !== undefined && typeof body.editableLesson !== 'boolean') return 'editableLesson은 boolean이어야 합니다'
  if (body.editableLesson) {
    try { editableLessonBrief(body); return undefined }
    catch (error) { return error instanceof Error ? error.message : '수업 계획을 확인하세요' }
  }
  if (body.additionalContext !== undefined &&
      (typeof body.additionalContext !== 'string' || body.additionalContext.length > 5000)) {
    return 'additionalContext는 5000자 이하의 문자열이어야 합니다'
  }

  if (body.grade !== undefined && !VALID_GRADES.has(body.grade)) return '유효하지 않은 학년입니다'
  if (body.contentType !== undefined && !['game', 'quiz', 'exploration', 'simulation', 'story'].includes(body.contentType)) return '유효하지 않은 콘텐츠 유형입니다'
  if (body.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(body.difficulty)) return '유효하지 않은 난이도입니다'

  const mode = body.mode ?? DEFAULT_CREATOR_MODE
  if (!VALID_MODES.has(mode)) return 'mode는 interest 또는 problem이어야 합니다'

  if (body.renderMode !== undefined && !VALID_RENDER_MODES.has(body.renderMode)) {
    return `renderMode는 ${RENDER_MODES.join(', ')} 중 하나여야 합니다`
  }

  if (mode === 'interest') {
    // Option 1: interests + subject + grade 필수
    if (!body.interests || !body.subject || !body.grade) {
      return 'interest 모드에는 interests, subject, grade가 필요합니다'
    }
    if (!Array.isArray(body.interests) || body.interests.length === 0 ||
        body.interests.length > 10 ||
        body.interests.some((item) => typeof item !== 'string' || item.length > 100)) {
      return 'interests는 최소 1개, 최대 10개의 문자열 배열이어야 합니다'
    }
    if (!isSubjectSlug(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다 (예: math, coding, toeic)'
    }
    if (!VALID_GRADES.has(body.grade)) return '유효하지 않은 학년입니다'
  } else {
    // Option 2 (problem): problem + difficulty 필수
    if (!body.problem || typeof body.problem !== 'string' ||
        body.problem.trim().length < 5 || body.problem.length > PROBLEM_MAX_LENGTH) {
      return `problem은 5자 이상 ${PROBLEM_MAX_LENGTH}자 이하의 문자열이어야 합니다`
    }
    if (!body.difficulty || !VALID_DIFFICULTIES.has(body.difficulty)) {
      return `difficulty는 ${[...VALID_DIFFICULTIES].join(', ')} 중 하나여야 합니다`
    }
    // subject는 선택: 없으면 AI가 problem에서 추론. 있으면 slug 검증.
    if (body.subject !== undefined && !isSubjectSlug(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다'
    }
  }
  return undefined
}
