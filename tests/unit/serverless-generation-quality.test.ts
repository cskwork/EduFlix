import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildZaiRequestBody, parseBuildMarkers, parseEducationalVerdict, POST } from '../../api/generate'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const files = (js: string) => `===FILE: index.html===\n<h1>Fractions</h1>\n===END FILE===\n===FILE: style.css===\nh1{color:black}\n===END FILE===\n===FILE: script.js===\n${js}\n===END FILE===`
const sse = (text: string) => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })

describe('serverless generation quality', () => {
  it('uses low for GLM-5.3 while preserving the selected model and explicit supported effort', () => {
    vi.stubEnv('ZAI_MODEL', 'glm-5.3-flash'); vi.stubEnv('ZAI_REASONING_EFFORT', '')
    expect(buildZaiRequestBody('brief')).toMatchObject({ model: 'glm-5.3-flash', reasoning_effort: 'low', stream: true })
    vi.stubEnv('ZAI_REASONING_EFFORT', 'high')
    expect(buildZaiRequestBody('brief').reasoning_effort).toBe('high')
    vi.stubEnv('ZAI_MODEL', 'glm-4.7'); vi.stubEnv('ZAI_REASONING_EFFORT', '')
    expect(buildZaiRequestBody('brief')).not.toHaveProperty('reasoning_effort')
    vi.stubEnv('ZAI_REASONING_EFFORT', 'medium')
    expect(() => buildZaiRequestBody('brief')).toThrow('low, high, max')
  })
  it('parses classic JavaScript without running it and rejects broken or module scripts', () => {
    expect(parseBuildMarkers(files('throw new Error("must not run");'))['script.js']).toContain('must not run')
    expect(() => parseBuildMarkers(files('const broken = ;'))).toThrow('script.js 문법 오류')
    expect(() => parseBuildMarkers(files('export const value = 1;'))).toThrow('script.js 문법 오류')
  })
  it('sends configured effort on the real request path and retries syntax failure with feedback', async () => {
    vi.stubEnv('ZAI_API_KEY', 'test'); vi.stubEnv('ADMIN_TOKEN', ''); vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('ZAI_MODEL', 'glm-5.3-flash'); vi.stubEnv('ZAI_REASONING_EFFORT', 'low')
    const fetch = vi.fn().mockResolvedValueOnce(sse(files('const broken = ;'))).mockResolvedValueOnce(sse(files('const ready = true;'))).mockResolvedValueOnce(sse('{"pass":true,"issues":[]}'))
    vi.stubGlobal('fetch', fetch)
    const response = await POST(new Request('http://localhost/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'quality-fixture' }, body: JSON.stringify({ mode: 'problem', problem: 'Compare these fractions', difficulty: 'easy', grade: 'elementary-3', language: 'en', renderMode: 'dom' }) }))
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
    const first = JSON.parse(fetch.mock.calls[0]![1].body)
    const second = JSON.parse(fetch.mock.calls[1]![1].body)
    expect(first.reasoning_effort).toBe('low')
    expect(second.messages[0].content).toContain('script.js 문법 오류')
    expect((await response.json()).content.js).toBe('const ready = true;')
  })
})

let reviewFixtureId = 0
function reviewRequest() {
  vi.stubEnv('ZAI_API_KEY', 'test'); vi.stubEnv('ADMIN_TOKEN', ''); vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('ZAI_MODEL', 'glm-5.3-flash'); vi.stubEnv('ZAI_REASONING_EFFORT', 'low')
  return new Request('http://localhost/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `educational-review-${reviewFixtureId++}` }, body: JSON.stringify({ mode: 'problem', problem: '차가운 컵 바깥의 물방울은 어디서 왔을까요?', difficulty: 'easy', grade: 'elementary-5', language: 'ko', renderMode: 'dom' }) })
}
const pass = () => sse('{"pass":true,"issues":[]}')

describe('mandatory educational review', () => {
  it('regenerates contradictions using exact review issues and accepts only reviewed output', async () => {
    const issue = 'script.js 문항 1: 물이 담긴 컵의 안쪽이 마르다는 해설은 조건과 모순입니다.'
    const fetch = vi.fn()
      .mockResolvedValueOnce(sse(files('const feedback = "안쪽은 마른 상태";')))
      .mockResolvedValueOnce(sse(JSON.stringify({ pass: false, issues: [issue] })))
      .mockResolvedValueOnce(sse(files('const feedback = "표면 온도와 공기 습도 조건을 확인하세요";')))
      .mockResolvedValueOnce(pass())
    vi.stubGlobal('fetch', fetch)
    const response = await POST(reviewRequest())
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(4)
    const reviewer = JSON.parse(fetch.mock.calls[1]![1].body).messages[0].content
    const retry = JSON.parse(fetch.mock.calls[2]![1].body).messages[0].content
    expect(reviewer).toContain('안쪽은 마른 상태')
    expect(reviewer).toContain('elementary-5')
    expect(retry).toContain(issue)
    expect((await response.json()).content.js).not.toContain('안쪽은 마른 상태')
  })
  it('does not accept malformed reviewer output, even after both generation attempts', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(sse(files('const first = 1;')))
      .mockResolvedValueOnce(sse('Looks good!'))
      .mockResolvedValueOnce(sse(files('const second = 2;')))
      .mockResolvedValueOnce(sse('{"pass":"true","issues":[]}'))
    vi.stubGlobal('fetch', fetch)
    const response = await POST(reviewRequest())
    expect(response.status).toBe(502)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body).not.toHaveProperty('content')
    expect(body.error).toContain('교육 검토 응답')
    expect(fetch).toHaveBeenCalledTimes(4)
  })
  it('rejects contradictory or empty failure verdicts instead of assuming approval', () => {
    for (const value of ['null', '[]', '{"pass":true,"issues":["contradiction"]}', '{"pass":false,"issues":[]}', '{"pass":true}', '{"pass":true,"issues":[],"score":100}']) {
      expect(() => parseEducationalVerdict(value)).toThrow()
    }
  })
  it('returns output after an explicit successful educational review', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(sse(files('const ready = true;'))).mockResolvedValueOnce(pass())
    vi.stubGlobal('fetch', fetch)
    const response = await POST(reviewRequest())
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((await response.json()).success).toBe(true)
  })
  it('keeps the original total deadline rather than granting review a fresh budget', async () => {
    let now = 10_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const fetch = vi.fn().mockImplementationOnce(async () => {
      now += 284_500
      return sse(files('const ready = true;'))
    })
    vi.stubGlobal('fetch', fetch)
    const response = await POST(reviewRequest())
    expect(response.status).toBe(502)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect((await response.json()).error).toContain('교육 검토에 필요한 시간이 남아 있지 않습니다')
  })
})
