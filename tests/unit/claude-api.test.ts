// Claude API 클라이언트 방어 로직 테스트
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ContentGenerationOptions } from '../../src/services/api/claude'

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('ClaudeApiClient 방어 로직', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  const baseOptions: ContentGenerationOptions = {
    interests: ['축구'],
    subject: 'math',
    grade: 'elementary-3',
    language: 'ko',
  }

  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch
    mockFetch.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('헬스 체크가 HTML이면 생성 요청을 중단한다', async () => {
    const { ClaudeApiClient } = await import('../../src/services/api/claude')

    mockFetch.mockResolvedValueOnce(
      new Response('<!doctype html><html></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    )

    const client = new ClaudeApiClient('')
    const result = await client.generateContent(baseOptions)

    expect(result.success).toBe(false)
    expect(result.error).toContain('백엔드')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(String(mockFetch.mock.calls[0][0])).toContain('/api/health')
  })

  it('생성 응답이 HTML이면 명확한 오류를 반환한다', async () => {
    const { ClaudeApiClient } = await import('../../src/services/api/claude')

    mockFetch
      // 헬스 체크는 정상 JSON
      .mockResolvedValueOnce(createJsonResponse({ status: 'ok' }))
      // 생성 요청은 HTML (정적 index.html 응답 시나리오)
      .mockResolvedValueOnce(
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        })
      )

    const client = new ClaudeApiClient('')
    const result = await client.generateContent(baseOptions)

    expect(result.success).toBe(false)
    expect(result.error).toContain('JSON')
    expect(result.error).toContain('VITE_API_URL')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(String(mockFetch.mock.calls[1][0])).toContain('/api/generate')
  })

  it('상대 baseUrl이 주어져도 /api 경로를 루트로 유지한다', async () => {
    const { ClaudeApiClient } = await import('../../src/services/api/claude')

    mockFetch
      // 헬스 체크
      .mockResolvedValueOnce(createJsonResponse({ status: 'ok' }))
      // 작업 생성
      .mockResolvedValueOnce(createJsonResponse({ success: true, jobId: 'job-1' }, 202))
      // 상태 완료
      .mockResolvedValueOnce(
        createJsonResponse({
          jobId: 'job-1',
          status: 'completed',
          progress: 100,
          message: '완료',
          contentId: 'content-1',
          manifest: {
            id: 'content-1',
            title: '테스트 콘텐츠',
            description: '설명',
            type: 'game',
          },
        })
      )

    const client = new ClaudeApiClient('/create')
    const result = await client.generateContent(baseOptions)

    expect(result.success).toBe(true)

    const healthUrl = String(mockFetch.mock.calls[0][0])
    expect(healthUrl).toContain('/api/health')
    expect(healthUrl).not.toContain('/create/api')
  })

  it('POST 응답 직후 폴링 전에 jobId를 알린다', async () => {
    const { ClaudeApiClient } = await import('../../src/services/api/claude')
    const events: string[] = []
    mockFetch
      .mockResolvedValueOnce(createJsonResponse({ status: 'ok' }))
      .mockResolvedValueOnce(createJsonResponse({ success: true, jobId: 'job-live' }, 202))
      .mockImplementationOnce(() => {
        events.push('poll')
        return Promise.resolve(createJsonResponse({
          jobId: 'job-live', status: 'completed', progress: 100, message: '완료',
        }))
      })

    await new ClaudeApiClient('').generateContent(baseOptions, undefined, (jobId) => events.push(jobId))

    expect(events).toEqual(['job-live', 'poll'])
  })

  it('생성·리뷰 폴링 제한이 장시간 LLM 호출보다 길다', async () => {
    const { GENERATION_MAX_POLL_DURATION_MS, REVIEW_MAX_POLL_DURATION_MS } =
      await import('../../src/services/api/claude')

    // Z.ai 2회 재시도 + optional Codex 재빌드를 모두 포함한 최악 시간.
    expect(GENERATION_MAX_POLL_DURATION_MS).toBeGreaterThan(7 * 60 * 60 * 1000)
    // static QA 후 review judge의 Z.ai/Codex 재시도 최악 시간.
    expect(REVIEW_MAX_POLL_DURATION_MS).toBeGreaterThan(30 * 60 * 1000)
  })
})
