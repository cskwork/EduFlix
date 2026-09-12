import type { LessonDocument } from '../../types/lesson'
import { validateLesson } from './lesson'
import { buildApiUrl } from '../api/url'
import { withAdminToken } from '../api/adminToken'

export async function generateLessonDraft(draft: LessonDocument, signal?: AbortSignal): Promise<LessonDocument> {
  // Validate only the teacher's plan; unfinished blocks are deliberately excluded.
  const plan = validateLesson({ ...draft, blocks: [{ id: 'brief-placeholder', kind: 'explanation', title: 'brief', body: 'brief' }] })
  const { blocks, ...lessonBrief } = plan
  void blocks
  const response = await fetch(buildApiUrl('/api/generate'), {
    method: 'POST', headers: withAdminToken({ 'Content-Type': 'application/json' }), signal,
    body: JSON.stringify({ editableLesson: true, lessonBrief, language: plan.language, subject: plan.subject, grade: plan.grade }),
  })
  let result: { success?: boolean; lesson?: unknown; error?: string }
  try { result = await response.json() }
  catch { throw new Error('AI 응답을 읽지 못했습니다. 기존 수업은 유지됩니다. / Could not read the AI response. Your lesson is unchanged.') }
  if (!response.ok || !result.success || !result.lesson) {
    throw new Error(result.error || 'AI 초안을 생성하지 못했습니다. 기존 수업은 유지됩니다. / AI drafting failed. Your lesson is unchanged.')
  }
  const generated = validateLesson(result.lesson)
  return validateLesson({ ...generated, ...lessonBrief,
    prerequisites: lessonBrief.prerequisites || generated.prerequisites,
    teacherNotes: lessonBrief.teacherNotes || generated.teacherNotes })
}
