import type { Grade, Language, Difficulty } from './content'

export type LessonBlockKind = 'explanation' | 'activity' | 'quiz' | 'reflection'
export interface LessonBlock {
  id: string
  kind: LessonBlockKind
  title: string
  body: string
  options?: string[]
  answer?: number
  explanation?: string
}
export interface LessonDocument {
  version: 1
  id: string
  title: string
  subject: string
  grade: Grade
  language: Language
  difficulty: Difficulty
  minutes: number
  objectives: string
  prerequisites: string
  teacherNotes: string
  blocks: LessonBlock[]
  sources: { title: string; url: string }[]
  updatedAt: string
}
