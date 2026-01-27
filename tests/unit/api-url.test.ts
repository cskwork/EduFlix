// API URL 결합 유틸 테스트
import { describe, it, expect } from 'vitest'

describe('buildApiUrl', () => {
  it('상대 baseUrl(/create)이어도 /api 경로는 루트로 결합된다', async () => {
    const { buildApiUrl } = await import('../../src/services/api/url')
    const url = buildApiUrl('/api/health', '/create')
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/api/health')
    expect(url).not.toContain('/create/api')
  })

  it('절대 baseUrl이면 해당 호스트로 결합된다', async () => {
    const { buildApiUrl } = await import('../../src/services/api/url')
    const url = buildApiUrl('/api/health', 'https://api.example.com/base')
    expect(url).toBe('https://api.example.com/api/health')
  })
})
