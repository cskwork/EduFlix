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
})
