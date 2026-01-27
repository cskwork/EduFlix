// 서버 헬스 체크: art-assets 연결 진단 테스트
import { describe, it, expect, vi, afterEach } from 'vitest'
import { DEFAULT_ART_ASSETS_URL } from '../../server/config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('checkArtAssetsHealth', () => {
  it('ART_ASSETS_URL이 없으면 기본 URL과 /api/health를 사용한다', async () => {
    vi.stubEnv('ART_ASSETS_URL', '')

    const mockFetch = vi.fn(async (_input: string | URL | Request) => {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const { checkArtAssetsHealth } = await import('../../server/services/health')
    const result = await checkArtAssetsHealth(mockFetch)

    expect(result.url).toBe(DEFAULT_ART_ASSETS_URL)
    expect(result.healthUrl.endsWith('/api/health')).toBe(true)
    expect(result.usingDefaultUrl).toBe(true)
    expect(result.reachable).toBe(true)
  })

  it('ART_ASSETS_URL이 있으면 해당 URL로 진단하고 상태 코드를 반영한다', async () => {
    vi.stubEnv('ART_ASSETS_URL', 'https://art-assets.example.com/base')

    const mockFetch = vi.fn(async () => {
      return new Response('Not Found', { status: 404 })
    })

    const { checkArtAssetsHealth } = await import('../../server/services/health')
    const result = await checkArtAssetsHealth(mockFetch)

    expect(result.url).toBe('https://art-assets.example.com/base')
    expect(result.usingDefaultUrl).toBe(false)
    expect(result.status).toBe(404)
    expect(result.reachable).toBe(false)
  })

  it('/api/health가 404여도 OPTIONS 폴백이 성공하면 reachable=true다', async () => {
    vi.stubEnv('ART_ASSETS_URL', 'http://art-assets.local:3100')

    const mockFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url.endsWith('/api/health')) {
        return new Response('Not Found', { status: 404 })
      }

      if (url.endsWith('/api/generate-content') && method === 'OPTIONS') {
        return new Response(null, { status: 204 })
      }

      return new Response('Unexpected', { status: 500 })
    })

    const { checkArtAssetsHealth } = await import('../../server/services/health')
    const result = await checkArtAssetsHealth(mockFetch)

    expect(result.reachable).toBe(true)
    expect(result.status).toBe(204)
  })
})

describe('buildArtAssetsUnavailableMessage', () => {
  it('URL과 환경변수 힌트를 포함한 안내 메시지를 만든다', async () => {
    const { buildArtAssetsUnavailableMessage } = await import('../../server/services/health')

    const message = buildArtAssetsUnavailableMessage({
      url: 'http://localhost:3100',
      healthUrl: 'http://localhost:3100/api/health',
      reachable: false,
      status: 502,
      usingDefaultUrl: true,
      error: 'connect ECONNREFUSED',
    })

    expect(message).toContain('art-assets 서버에 연결할 수 없습니다')
    expect(message).toContain('http://localhost:3100')
    expect(message).toContain('ART_ASSETS_URL')
    expect(message).toContain('502')
  })
})
