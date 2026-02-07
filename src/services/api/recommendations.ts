// localStorage 기반 추천 시스템 (Vercel 정적 배포 지원)
// 서버 API 없이 브라우저 localStorage에서 클릭 데이터 관리

const STORAGE_KEY = 'eduflix_content_clicks'
const STORAGE_VERSION = 'v1'

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

// localStorage 저장소 구조
interface ClickData {
  [contentId: string]: {
    clickCount: number
    firstClickedAt: string
    lastClickedAt: string
  }
}

/**
 * localStorage에서 클릭 데이터 로드
 */
function getClickData(): ClickData {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${STORAGE_VERSION}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load click data from localStorage:', e)
  }
  return {}
}

/**
 * localStorage에 클릭 데이터 저장
 */
function saveClickData(data: ClickData): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${STORAGE_VERSION}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save click data to localStorage:', e)
  }
}

/**
 * 콘텐츠 클릭 기록
 */
export async function recordContentClick(contentId: string): Promise<ClickResponse | null> {
  try {
    const data = getClickData()
    const now = new Date().toISOString()

    if (data[contentId]) {
      // 기존 레코드 업데이트
      data[contentId].clickCount += 1
      data[contentId].lastClickedAt = now
    } else {
      // 새 레코드 생성
      data[contentId] = {
        clickCount: 1,
        firstClickedAt: now,
        lastClickedAt: now,
      }
    }

    saveClickData(data)

    return {
      success: true,
      contentId,
      clickCount: data[contentId].clickCount,
    }
  } catch (error) {
    console.error('Failed to record click:', error)
    return null
  }
}

/**
 * 인기 콘텐츠 목록 조회 (클릭 수 내림차순)
 */
export async function getRecommendations(limit = 10): Promise<RecommendedContent[]> {
  try {
    const data = getClickData()

    const recommendations: RecommendedContent[] = Object.entries(data)
      .map(([contentId, info]) => ({
        contentId,
        clickCount: info.clickCount,
        lastClickedAt: info.lastClickedAt,
      }))
      .sort((a, b) => {
        // 클릭 수 내림차순, 같으면 최근 클릭순
        if (b.clickCount !== a.clickCount) {
          return b.clickCount - a.clickCount
        }
        return new Date(b.lastClickedAt).getTime() - new Date(a.lastClickedAt).getTime()
      })
      .slice(0, limit)

    return recommendations
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return []
  }
}

/**
 * 추천 통계 조회
 */
export async function getRecommendationStats(): Promise<StatsResponse | null> {
  try {
    const data = getClickData()

    const totalClicks = Object.values(data).reduce((sum, item) => sum + item.clickCount, 0)
    const uniqueContents = Object.keys(data).length

    return {
      success: true,
      totalClicks,
      uniqueContents,
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return null
  }
}

/**
 * 특정 콘텐츠의 클릭 수 조회
 */
export async function getContentClickCount(contentId: string): Promise<number> {
  try {
    const data = getClickData()
    return data[contentId]?.clickCount ?? 0
  } catch (error) {
    console.error('Failed to fetch click count:', error)
    return 0
  }
}

/**
 * 클릭 데이터 초기화 (테스트용)
 */
export function clearClickData(): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${STORAGE_VERSION}`)
  } catch (e) {
    console.warn('Failed to clear click data:', e)
  }
}
