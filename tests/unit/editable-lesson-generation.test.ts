import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST, validateEditableLesson } from '../../api/generate'
import { handleGenerateRoute } from '../../server/routes/generate'
import { generateLessonDraft } from '../../src/services/studio/generateLesson'
import type { LessonDocument } from '../../src/types/lesson'

const fixture = (): LessonDocument => ({ version: 1, id: 'local-studio-ai-test', title: '분수 비교', subject: 'math', grade: 'elementary-3', language: 'ko', difficulty: 'easy', minutes: 20, objectives: '같은 전체에서 같은 분모의 분수를 비교한다.', prerequisites: '같은 크기로 나누기', teacherNotes: '종이로 비교하세요.', sources: [], updatedAt: '2026-09-12T00:00:00.000Z', blocks: [{ id: 'q1', kind: 'quiz', title: '비교', body: '같은 전체에서 더 큰 분수는?', options: ['1/4', '3/4'], answer: 1, explanation: '같은 크기의 네 조각 중 세 조각이 한 조각보다 많습니다.' }, { id: 'e1', kind: 'explanation', title: '분수의 뜻', body: '같은 크기의 전체를 똑같이 나눈 조각을 비교합니다.' }, { id: 'a1', kind: 'activity', title: '종이 나누기', body: '같은 크기의 종이 두 장을 각각 네 조각으로 접고 한 조각과 세 조각을 색칠해 비교하세요.' }, { id: 'q2', kind: 'quiz', title: '전체 크기', body: '분수를 그림으로 비교할 때 먼저 확인할 것은?', options: ['종이 색', '전체의 크기'], answer: 1, explanation: '전체의 크기가 같아야 색칠한 분수의 양을 직접 비교할 수 있습니다.' }, { id: 'r1', kind: 'reflection', title: '설명하기', body: '왜 전체 크기를 같게 해야 하는지 친구에게 설명하세요.' }] })
const sse = (value: unknown) => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: typeof value === 'string' ? value : JSON.stringify(value) }, finish_reason: 'stop' }] })}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })
let requestId = 0
function request() {
  const { blocks, ...lessonBrief } = fixture(); void blocks
  return new Request('http://localhost/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `editable-fixture-${requestId++}` }, body: JSON.stringify({ editableLesson: true, lessonBrief, language: lessonBrief.language, subject: lessonBrief.subject, grade: lessonBrief.grade }) })
}
function setup() { vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ADMIN_TOKEN', ''); vi.stubEnv('ZAI_API_KEY', 'test'); vi.stubEnv('ZAI_MODEL', 'glm-5.3-flash'); vi.stubEnv('ZAI_REASONING_EFFORT', 'low') }
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('editable AI lesson data', () => {
  it('rejects malformed lesson fields and incorrect answer indices', () => {
    expect(() => validateEditableLesson({})).toThrow()
    const lesson = fixture(); lesson.blocks[0]!.answer = 5
    expect(() => validateEditableLesson(lesson)).toThrow()
    expect(() => validateEditableLesson({ ...fixture(), sources: [{ title: 'bad', url: 'javascript:alert(1)' }] })).toThrow()
  })
  it('returns human-editable data only after review and preserves the teacher metadata', async () => {
    setup()
    const generated = { ...fixture(), title: 'AI changed title' }
    const fetch = vi.fn().mockResolvedValueOnce(sse(generated)).mockResolvedValueOnce(sse({ pass: true, issues: [] }))
    vi.stubGlobal('fetch', fetch)
    const response = await POST(request())
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.lesson.title).toBe('분수 비교')
    expect(result.lesson.blocks[0]).toMatchObject({ answer: 1, explanation: fixture().blocks[0]!.explanation })
    expect(result).not.toHaveProperty('content')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('rejects invalid generated answers after bounded repair rather than rendering them', async () => {
    setup()
    const lesson = fixture(); lesson.blocks[0]!.answer = 12
    const fetch = vi.fn().mockImplementation(async () => sse(lesson))
    vi.stubGlobal('fetch', fetch)
    const response = await POST(request())
    expect(response.status).toBe(502)
    expect((await response.json()).success).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('does not accept a thin AI draft without knowledge checks even if its generic schema is valid', async () => {
    setup()
    const thin = fixture()
    thin.blocks = [thin.blocks[1]!]
    expect(() => validateEditableLesson(thin)).not.toThrow()
    const fetch = vi.fn().mockImplementation(async () => sse(thin))
    vi.stubGlobal('fetch', fetch)
    const response = await POST(request())
    expect(response.status).toBe(502)
    expect((await response.json()).error).toContain('확인 문항 2개 이상')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[1]![1].body).messages[0].content).toContain('직전 초안의 오류')
  })
  it('client keeps the unfinished teacher draft unchanged when the server fails', async () => {
    const draft = fixture(); draft.blocks = [{ id: 'draft', kind: 'activity', title: '', body: '보존할 메모' }]
    const before = structuredClone(draft)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false, error: '교육 검토 실패' }, { status: 502 })))
    await expect(generateLessonDraft(draft)).rejects.toThrow('교육 검토 실패')
    expect(draft).toEqual(before)
  })
  it('client validates the returned draft and leaves saving to the teacher', async () => {
    const draft = fixture(); draft.blocks = []
    const fetch = vi.fn().mockResolvedValue(Response.json({ success: true, lesson: fixture() }))
    vi.stubGlobal('fetch', fetch)
    const result = await generateLessonDraft(draft)
    expect(result.blocks[0]!.answer).toBe(1)
    expect(draft.blocks).toEqual([])
    expect(JSON.parse(fetch.mock.calls[0]![1].body).editableLesson).toBe(true)
  })
  it('Bun routes editable requests synchronously while leaving legacy jobs asynchronous', async () => {
    setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(sse(fixture())).mockResolvedValueOnce(sse({ pass: true, issues: [] })))
    const runner = { startGeneration: vi.fn().mockReturnValue({ jobId: 'legacy', message: 'queued' }), startReview: vi.fn(), getJob: vi.fn() }
    const dependencies = { runner, getConfig: () => ({ provider: 'zai' as const, model: 'glm-5.3-flash', keyConfigured: true }) }
    const json = (value: unknown, status = 200) => Response.json(value, { status })
    const error = (message: string, status = 500) => Response.json({ error: message }, { status })
    const editable = await handleGenerateRoute(request(), json, error, dependencies)
    expect(editable.status).toBe(200)
    expect((await editable.json()).lesson.blocks).toHaveLength(5)
    expect(runner.startGeneration).not.toHaveBeenCalled()
    const legacy = await handleGenerateRoute(new Request('http://localhost/api/generate', { method: 'POST', body: JSON.stringify({ language: 'ko', interests: ['별'], subject: 'science', grade: 'elementary-3' }) }), json, error, dependencies)
    expect(legacy.status).toBe(202)
    expect(runner.startGeneration).toHaveBeenCalledOnce()
  })
  it('Bun authenticates before invoking the editable generation branch', async () => {
    setup(); vi.stubEnv('ADMIN_TOKEN', 'required-test-token')
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    const runner = { startGeneration: vi.fn(), startReview: vi.fn(), getJob: vi.fn() }
    const getConfig = vi.fn().mockReturnValue({ provider: 'zai', model: 'glm-5.3-flash', keyConfigured: true })
    const response = await handleGenerateRoute(request(), value => Response.json(value), (error, status = 500) => Response.json({ error }, { status }), { runner, getConfig })
    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
    expect(getConfig).not.toHaveBeenCalled()
  })
  it('Bun rejects the editable branch when the configured provider is Codex', async () => {
    setup()
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    const runner = { startGeneration: vi.fn(), startReview: vi.fn(), getJob: vi.fn() }
    const response = await handleGenerateRoute(request(), value => Response.json(value), (error, status = 500) => Response.json({ error }, { status }), { runner, getConfig: () => ({ provider: 'codex' as const, model: 'test', keyConfigured: true }) })
    expect(response.status).toBe(503)
    expect((await response.json()).error).toContain('Z.ai')
    expect(fetch).not.toHaveBeenCalled()
  })
})
