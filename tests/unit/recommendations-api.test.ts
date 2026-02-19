import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

type FetchMock = ReturnType<typeof vi.fn>

describe('recommendations api service', () => {
  const originalFetch = global.fetch
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    vi.resetModules()
    localStorage.clear()
  })

  it('기본 추천 스코프는 shared다', async () => {
    const { getRecommendationScope } = await import('../../src/services/api/recommendations')

    expect(getRecommendationScope()).toBe('shared')
  })

  it('shared 스코프에서 클릭 기록은 서버 API로 전송한다', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, contentId: 'solar-system', clickCount: 3 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { recordContentClick } = await import('../../src/services/api/recommendations')
    const result = await recordContentClick('solar-system')

    expect(result).toEqual({ success: true, contentId: 'solar-system', clickCount: 3 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/recommendations/click')
  })

  it('personal 스코프에서는 localStorage만 사용한다', async () => {
    const { setRecommendationScope, recordContentClick, getRecommendations } = await import(
      '../../src/services/api/recommendations'
    )

    setRecommendationScope('personal')
    await recordContentClick('fractions-pizza')
    await recordContentClick('fractions-pizza')

    const recommendations = await getRecommendations(10)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(recommendations).toEqual([
      expect.objectContaining({
        contentId: 'fractions-pizza',
        clickCount: 2,
      }),
    ])
  })

  it('shared 스코프 clear는 서버 clear 엔드포인트를 호출한다', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, cleared: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { clearClickData } = await import('../../src/services/api/recommendations')
    await clearClickData('shared')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/recommendations/clear')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })
})
