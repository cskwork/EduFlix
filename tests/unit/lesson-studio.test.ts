import { describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import { newLesson, validateLesson, renderLesson, importLesson, lessonBrief, removeQuizChoice } from '../../src/services/studio/lesson'
import type { LessonDocument } from '../../src/types/lesson'

function fixture(): LessonDocument {
  return { ...newLesson(), title: '분수 비교', objectives: '같은 크기의 전체에서 분수를 비교한다.', blocks: [{ id: 'q1', kind: 'quiz', title: '분수 확인', body: '같은 크기 케이크의 1/4과 3/4 중 큰 것은?', options: ['1/4', '3/4'], answer: 1, explanation: '전체 크기와 조각 크기가 같으면 세 조각이 한 조각보다 크다.' }], sources: [{ title: 'Reference', url: 'https://example.org/source' }] }
}
describe('structured lesson contract', () => {
  it('rejects missing explanations, invalid answers, duplicate ids and executable source links', () => {
    const lesson = fixture()
    expect(() => validateLesson(lesson)).not.toThrow()
    expect(() => validateLesson({ ...lesson, blocks: [{ ...lesson.blocks[0], answer: 5 }] })).toThrow()
    expect(() => validateLesson({ ...lesson, blocks: [{ ...lesson.blocks[0], explanation: '' }] })).toThrow()
    expect(() => validateLesson({ ...lesson, blocks: [lesson.blocks[0], lesson.blocks[0]] })).toThrow()
    expect(() => validateLesson({ ...lesson, sources: [{ title: 'x', url: 'javascript:alert(1)' }] })).toThrow()
  })
  it('imports a fresh copy preserving quiz answers, objectives and source provenance', () => {
    const lesson = fixture()
    const imported = importLesson(JSON.stringify(lesson))
    expect(imported.id).not.toBe(lesson.id)
    expect(imported.blocks).toEqual(lesson.blocks)
    expect(importLesson(renderLesson(lesson)).blocks).toEqual(lesson.blocks)
    expect(lessonBrief(imported)).toContain('https://example.org/source')
    expect(lessonBrief(imported)).toContain('정답: 3/4')
  })
  it('requires a new answer after deleting the keyed choice rather than silently grading another option', () => {
    const lesson = fixture()
    lesson.blocks[0]!.options = ['1/4', '3/4', '2/4']
    lesson.blocks[0] = removeQuizChoice(lesson.blocks[0]!, 1)
    expect(lesson.blocks[0]!.answer).toBeUndefined()
    expect(() => validateLesson(lesson)).toThrow()
    lesson.blocks[0]!.answer = 1
    expect(() => validateLesson(lesson)).not.toThrow()
  })
  it('can reimport a valid large Korean lesson exported as either JSON or HTML', () => {
    const lesson = fixture()
    lesson.blocks = Array.from({ length: 35 }, (_, index) => ({ id: `block-${index}`, kind: 'explanation', title: '수업 설명', body: '가'.repeat(6000) }))
    validateLesson(lesson)
    const json = JSON.stringify(lesson)
    expect(new TextEncoder().encode(json).byteLength).toBeGreaterThan(500_000)
    expect(importLesson(json).blocks).toHaveLength(35)
    expect(importLesson(renderLesson(lesson)).blocks).toHaveLength(35)
  })
  it('renders human text as text and uses the edited answer for real quiz feedback', async () => {
    const lesson = fixture()
    lesson.title = '<img src=x onerror=alert(1)>'
    lesson.blocks[0]!.answer = 0
    const html = renderLesson(lesson)
    expect(html).not.toContain('<img src=x')
    const window = new Window({ settings: { enableJavaScriptEvaluation: true } })
    window.document.write(html)
    await window.happyDOM.whenAsyncComplete()
    const form = window.document.querySelector('form')!
    expect(form.querySelector('button')!.getAttribute('type')).toBe('button')
    const radio = form.querySelector('input[value="0"]') as unknown as HTMLInputElement
    radio.checked = true
    form.querySelector('button')!.click()
    expect(form.querySelector('.feedback')!.textContent).toContain('정답입니다.')
    expect(form.querySelector('.feedback')!.textContent).toContain(lesson.blocks[0]!.explanation)
    await window.happyDOM.close()
  })
})
