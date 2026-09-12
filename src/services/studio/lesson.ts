import type { LessonDocument, LessonBlock, LessonBlockKind } from '../../types/lesson'
import { GRADES, gradeLevelForGrade, isSubjectSlug } from '../../types/content'
import { listLocalContents, saveLocalContent } from '../content/localContent'

export const LESSON_FILE_MAX_BYTES = 8 * 1024 * 1024

export function removeQuizChoice(quiz: LessonBlock, index: number): LessonBlock {
  if (quiz.kind !== 'quiz' || !quiz.options || quiz.options.length <= 2 || index < 0 || index >= quiz.options.length) return quiz
  return { ...quiz, options: quiz.options.filter((_, position) => position !== index),
    answer: quiz.answer === index ? undefined : quiz.answer !== undefined && quiz.answer > index ? quiz.answer - 1 : quiz.answer }
}

export function newBlock(kind: LessonBlockKind, language = 'ko'): LessonBlock {
  const ko = language === 'ko'
  return { id: crypto.randomUUID(), kind, title: '', body: '', ...(kind === 'quiz' ? { options: ko ? ['보기 1', '보기 2', '보기 3'] : ['Option 1', 'Option 2', 'Option 3'], answer: 0, explanation: '' } : {}) }
}
export function newLesson(language: 'ko' | 'en' = 'ko'): LessonDocument {
  return { version: 1, id: `local-studio-${crypto.randomUUID()}`, title: '', subject: 'math', grade: 'elementary-5', language, difficulty: 'medium', minutes: 40, objectives: '', prerequisites: '', teacherNotes: '', blocks: [newBlock('explanation', language)], sources: [], updatedAt: new Date().toISOString() }
}
export function validateLesson(value: unknown): LessonDocument {
  const lesson = value as LessonDocument
  const fail = (message: string): never => { throw new Error(message) }
  const text = (v: unknown, max = 6000) => typeof v === 'string' && v.length <= max
  if (!lesson || lesson.version !== 1 || !/^local-studio-[\w-]+$/.test(lesson.id)) fail('지원하는 EduFlix 수업 파일이 아닙니다. / Invalid lesson file.')
  if (!text(lesson.title, 160) || !lesson.title.trim()) fail('수업 제목을 입력하세요. / Enter a lesson title.')
  if (!text(lesson.subject, 80) || !isSubjectSlug(lesson.subject) || !GRADES.includes(lesson.grade)) fail('과목과 학년을 확인하세요. / Check subject and grade.')
  if (!['ko', 'en'].includes(lesson.language) || !['easy', 'medium', 'hard'].includes(lesson.difficulty)) fail('언어와 난이도를 확인하세요. / Check language and difficulty.')
  if (!Number.isInteger(lesson.minutes) || lesson.minutes < 5 || lesson.minutes > 120) fail('활동 시간은 5~120분으로 입력하세요. / Duration must be 5–120 minutes.')
  if (![lesson.objectives, lesson.prerequisites, lesson.teacherNotes].every(v => text(v)) || !lesson.objectives.trim()) fail('학습 목표를 입력하세요. / Enter learning objectives.')
  if (!Array.isArray(lesson.blocks) || !lesson.blocks.length || lesson.blocks.length > 40) fail('학습 블록은 1~40개가 필요합니다. / Include 1–40 blocks.')
  const ids = new Set<string>()
  for (const [index, block] of lesson.blocks.entries()) {
    if (!block || !text(block.id, 100) || !block.id || ids.has(block.id) || !['explanation', 'activity', 'quiz', 'reflection'].includes(block.kind)) fail(`블록 ${index + 1}의 형식이 올바르지 않습니다. / Invalid block.`)
    ids.add(block.id)
    if (!text(block.title, 160) || !block.title.trim() || !text(block.body) || !block.body.trim()) fail(`블록 ${index + 1}의 제목과 내용을 입력하세요. / Complete block ${index + 1}.`)
    if (block.kind === 'quiz' && (!Array.isArray(block.options) || block.options.length < 2 || block.options.length > 6 || block.options.some(o => !text(o, 500) || !o.trim()) || !Number.isInteger(block.answer) || block.answer! < 0 || block.answer! >= block.options.length || !text(block.explanation) || !block.explanation!.trim())) fail(`문항 ${index + 1}의 보기·정답·해설을 확인하세요. / Complete choices, answer and explanation.`)
  }
  if (!Array.isArray(lesson.sources) || lesson.sources.length > 20 || lesson.sources.some(source => {
    if (!source || !text(source.title, 200) || !source.title.trim() || !text(source.url, 2000)) return true
    try { return !['https:', 'http:'].includes(new URL(source.url).protocol) } catch { return true }
  })) fail('출처 제목과 http(s) 주소를 확인하세요. / Check source titles and URLs.')
  if (typeof lesson.updatedAt !== 'string' || !Number.isFinite(Date.parse(lesson.updatedAt))) fail('저장 날짜가 올바르지 않습니다. / Invalid save date.')
  // Strip unknown properties and Vue proxies before storing or exporting.
  return JSON.parse(JSON.stringify({ version: 1, id: lesson.id, title: lesson.title, subject: lesson.subject, grade: lesson.grade, language: lesson.language, difficulty: lesson.difficulty, minutes: lesson.minutes, objectives: lesson.objectives, prerequisites: lesson.prerequisites, teacherNotes: lesson.teacherNotes, blocks: lesson.blocks.map(b => ({ id: b.id, kind: b.kind, title: b.title, body: b.body, ...(b.kind === 'quiz' ? { options: b.options, answer: b.answer, explanation: b.explanation } : {}) })), sources: lesson.sources.map(s => ({ title: s.title, url: s.url })), updatedAt: lesson.updatedAt }))
}
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function renderLesson(lesson: LessonDocument): string {
  const ko = lesson.language === 'ko'
  const [level, number] = lesson.grade.split('-')
  const levelName = ({ elementary: ko ? '초등학교' : 'Elementary', middle: ko ? '중학교' : 'Middle school', high: ko ? '고등학교' : 'High school' } as Record<string, string>)[level!] ?? level
  const displayedGrade = `${levelName} ${number}${ko ? '학년' : ''}`
  const lessonData = JSON.stringify(lesson).replace(/</g, '\\u003c')
  const blocks = lesson.blocks.map((block, i) => `<section><p class="kind">${i + 1} / ${lesson.blocks.length}</p><h2>${escape(block.title)}</h2><p class="body" ${block.kind !== 'quiz' ? `id="body-${i}" data-editable` : ''}>${escape(block.body)}</p>${block.kind === 'quiz' ? `<form data-quiz="${i}"><fieldset><legend>${ko ? '정답을 선택하고 확인하세요.' : 'Choose an answer and check.'}</legend>${(block.options ?? []).map((o, n) => `<label><input required type="radio" name="answer" value="${n}"> ${escape(o)}</label>`).join('')}</fieldset><button type="button">${ko ? '답 확인하기' : 'Check answer'}</button><p role="status" class="feedback"></p></form>` : block.kind === 'activity' || block.kind === 'reflection' ? `<label class="response">${ko ? '생각 기록하기 (이 화면에서만 유지됩니다)' : 'Your notes (kept on this screen only)'}<textarea rows="4"></textarea></label>` : ''}</section>`).join('')
  const quizData = JSON.stringify(lesson.blocks.map(b => b.kind === 'quiz' ? { answer: b.answer, explanation: b.explanation } : null)).replace(/</g, '\\u003c')
  return `<!doctype html><html lang="${lesson.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(lesson.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f7fc;color:#292441;font:17px/1.75 system-ui,sans-serif}main{max-width:800px;margin:auto;padding:32px 24px 80px}h1{font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.3}h2{font-size:1.4rem;line-height:1.4}header{border-bottom:2px solid #d9d2eb;padding-bottom:24px}section{padding:28px 0;border-bottom:1px solid #d9d2eb}.body,.notes{white-space:pre-wrap}.kind{font-size:.8rem;color:#625477}fieldset{border:0;padding:0}legend{margin-bottom:12px}label{display:block;padding:10px 0}input{accent-color:#6443a3}button{min-height:44px;background:#6443a3;color:white;border:0;border-radius:8px;padding:10px 20px;font:inherit;cursor:pointer}textarea{display:block;width:100%;font:inherit;border:1px solid #a89abf;border-radius:8px;padding:12px}a{color:#58378f}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #9a70db;outline-offset:3px}.feedback{font-weight:600;white-space:pre-wrap}details{margin:24px 0}summary{cursor:pointer;font-weight:600}footer{font-size:.85rem;margin-top:30px}@media print{button,.response{display:none}body{background:white}section{break-inside:avoid}main{padding:0}}
</style></head><body><main><header><p>${escape(displayedGrade)} · ${lesson.minutes} ${ko ? '분' : 'minutes'}</p><h1 id="lesson-title" data-editable>${escape(lesson.title)}</h1><h2>${ko ? '학습 목표' : 'Learning objectives'}</h2><p class="notes" id="lesson-objectives" data-editable>${escape(lesson.objectives)}</p>${lesson.prerequisites ? `<p class="notes">${ko ? '준비 지식' : 'Prior knowledge'}: ${escape(lesson.prerequisites)}</p>` : ''}</header>${blocks}${lesson.teacherNotes ? `<details><summary>${ko ? '교사 수업 안내' : 'Teaching notes'}</summary><p class="notes">${escape(lesson.teacherNotes)}</p></details>` : ''}<footer><h2>${ko ? '참고 자료' : 'Sources'}</h2>${lesson.sources.filter(s => /^https?:\/\//i.test(s.url)).map(s => `<p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a></p>`).join('')}<p>${ko ? '수업 전 사실과 학습 수준을 확인하세요. 학생의 답은 서버로 전송되지 않습니다.' : 'Review facts and learner level before teaching. Student answers are not sent to a server.'}</p></footer></main><script>
const quizzes=${quizData};document.querySelectorAll('form[data-quiz]').forEach(form=>{form.querySelector('button').addEventListener('click',()=>{if(!form.reportValidity())return;const answer=new FormData(form).get('answer');if(answer===null)return;const q=quizzes[Number(form.dataset.quiz)];const correct=Number(answer)===q.answer;form.querySelector('.feedback').textContent=(correct?${JSON.stringify(ko ? '정답입니다. ' : 'Correct. ')}:${JSON.stringify(ko ? '다시 생각해 보세요. ' : 'Try again. ')})+q.explanation;});});
</script><script type="application/json" id="eduflix-lesson">${lessonData}</script></body></html>`
}
export async function saveLesson(value: LessonDocument) {
  const lesson = validateLesson({ ...value, updatedAt: new Date().toISOString() })
  await saveLocalContent({ id: lesson.id, title: lesson.title, description: lesson.objectives, subject: lesson.subject, gradeLevel: gradeLevelForGrade(lesson.grade), grade: lesson.grade, type: 'exploration', language: lesson.language, html: renderLesson(lesson), css: '', js: '', createdAt: lesson.updatedAt, lesson })
  return lesson
}
export async function listLessons(): Promise<LessonDocument[]> {
  return (await listLocalContents()).filter(c => c.lesson).map(c => validateLesson(c.lesson))
}
export function importLesson(text: string): LessonDocument {
  if (new TextEncoder().encode(text).byteLength > LESSON_FILE_MAX_BYTES) throw new Error('파일이 너무 큽니다. / File is too large.')
  const embedded = text.trimStart().startsWith('<')
    ? /<script\b[^>]*id=["']eduflix-lesson["'][^>]*>([\s\S]*?)<\/script\s*>/i.exec(text)?.[1]
    : text
  if (!embedded) throw new Error('편집 데이터가 포함된 EduFlix 파일이 아닙니다. / Missing editable lesson data.')
  const lesson = validateLesson(JSON.parse(embedded))
  return { ...lesson, id: `local-studio-${crypto.randomUUID()}`, updatedAt: new Date().toISOString() }
}
export function lessonBrief(lesson: LessonDocument): string {
  return [`제목: ${lesson.title}`, `학습 목표: ${lesson.objectives}`, `선수 지식: ${lesson.prerequisites}`, `교사 안내: ${lesson.teacherNotes}`, `참고 출처: ${lesson.sources.map(s => `${s.title}: ${s.url}`).join('\n')}`, ...lesson.blocks.map(b => `${b.kind}: ${b.title}\n${b.body}${b.kind === 'quiz' ? `\n보기: ${b.options?.join(' / ')}\n정답: ${b.options?.[b.answer!]}\n해설: ${b.explanation}` : ''}`)].join('\n\n')
}
