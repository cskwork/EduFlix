// 추천 시스템 API 클라이언트

// API 엔드포인트 설정 (상대 경로 사용 - Vite 프록시 활용)
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 정적 배포 모드 확인
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

export interface RecommendedContent {
  contentId: string
  clickCount: number
  lastClickedAt: string
}

export interface RecommendationsResponse {
  success: boolean
  count: number
  recommendations: RecommendedContent[]
}

export interface ClickResponse {
  success: boolean
  contentId: string
  clickCount: number
}

export interface StatsResponse {
  success: boolean
  totalClicks: number
  uniqueContents: number
}

/**
 * 콘텐츠 클릭 기록
 */
export async function recordContentClick(contentId: string): Promise<ClickResponse | null> {
  // 정적 모드에서는 클릭 기록 스킵
  if (isStaticMode) {
    console.log('[Static Mode] Click recording skipped:', contentId)
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contentId }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to record click:', error)
    return null
  }
}

/**
 * 인기 콘텐츠 목록 조회
 */
export async function getRecommendations(limit = 10): Promise<RecommendedContent[]> {
  // 정적 모드에서는 빈 배열 반환
  if (isStaticMode) {
    console.log('[Static Mode] Recommendations not available')
    return []
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data: RecommendationsResponse = await response.json()
    return data.recommendations || []
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return []
  }
}

/**
 * 추천 통계 조회
 */
export async function getRecommendationStats(): Promise<StatsResponse | null> {
  if (isStaticMode) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/stats`)

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return null
  }
}

/**
 * 특정 콘텐츠의 클릭 수 조회
 */
export async function getContentClickCount(contentId: string): Promise<number> {
  if (isStaticMode) {
    return 0
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/recommendations/${encodeURIComponent(contentId)}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data = await response.json()
    return data.clickCount || 0
  } catch (error) {
    console.error('Failed to fetch click count:', error)
    return 0
  }
}
