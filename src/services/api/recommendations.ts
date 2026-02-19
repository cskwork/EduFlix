// localStorage 기반 추천 시스템 (Vercel 정적 배포 지원)
// 서버 API 없이 브라우저 localStorage에서 클릭 데이터 관리

import { buildApiUrl } from './url'

const STORAGE_KEY = 'eduflix_content_clicks'
const STORAGE_VERSION = 'v1'
const SCOPE_STORAGE_KEY = 'eduflix_recommendation_scope_v1'
const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

export type RecommendationScope = 'shared' | 'personal'

const DEFAULT_SCOPE: RecommendationScope = 'shared'

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

interface CountResponse {
  success: boolean
  contentId: string
  clickCount: number
}

function getScopedStorageKey(): string {
  return `${STORAGE_KEY}_${STORAGE_VERSION}`
}

function isRecommendationScope(value: string | null): value is RecommendationScope {
  return value === 'shared' || value === 'personal'
}

export function getRecommendationScope(): RecommendationScope {
  try {
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY)
    if (isRecommendationScope(stored)) {
      return stored
    }
  } catch (e) {
    console.warn('Failed to load recommendation scope from localStorage:', e)
  }

  return DEFAULT_SCOPE
}

export function setRecommendationScope(scope: RecommendationScope): void {
  try {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope)
  } catch (e) {
    console.warn('Failed to save recommendation scope to localStorage:', e)
  }
}

function resolveScope(scope?: RecommendationScope): RecommendationScope {
  return scope ?? getRecommendationScope()
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  return contentType.includes('application/json')
}

async function parseApiJson<T>(response: Response): Promise<T | null> {
  if (!response.ok || !isJsonResponse(response)) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.warn('Failed to parse recommendations API response:', error)
    return null
  }
}

/**
 * localStorage에서 클릭 데이터 로드
 */
function getClickData(): ClickData {
  try {
    const stored = localStorage.getItem(getScopedStorageKey())
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
    localStorage.setItem(getScopedStorageKey(), JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save click data to localStorage:', e)
  }
}

function recordLocalContentClick(contentId: string): ClickResponse {
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
}

function getLocalRecommendations(limit: number): RecommendedContent[] {
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
}

function getLocalStats(): StatsResponse {
  const data = getClickData()

  const totalClicks = Object.values(data).reduce((sum, item) => sum + item.clickCount, 0)
  const uniqueContents = Object.keys(data).length

  return {
    success: true,
    totalClicks,
    uniqueContents,
  }
}

function getLocalClickCount(contentId: string): number {
  const data = getClickData()
  return data[contentId]?.clickCount ?? 0
}

/**
 * 콘텐츠 클릭 기록
 */
export async function recordContentClick(
  contentId: string,
  scope?: RecommendationScope
): Promise<ClickResponse | null> {
  const activeScope = resolveScope(scope)

  if (activeScope === 'shared' && !isStaticMode) {
    try {
      const response = await fetch(buildApiUrl('/api/recommendations/click', API_BASE_URL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId }),
      })

      const apiResult = await parseApiJson<ClickResponse>(response)
      if (apiResult?.success) {
        return apiResult
      }
    } catch (error) {
      console.error('Failed to record shared click:', error)
    }
  }

  try {
    return recordLocalContentClick(contentId)
  } catch (error) {
    console.error('Failed to record click:', error)
    return null
  }
}

/**
 * 인기 콘텐츠 목록 조회 (클릭 수 내림차순)
 */
export async function getRecommendations(
  limit = 10,
  scope?: RecommendationScope
): Promise<RecommendedContent[]> {
  const activeScope = resolveScope(scope)

  if (activeScope === 'shared' && !isStaticMode) {
    try {
      const response = await fetch(
        buildApiUrl(`/api/recommendations?limit=${encodeURIComponent(limit)}`, API_BASE_URL)
      )
      const apiResult = await parseApiJson<RecommendationsResponse>(response)

      if (apiResult?.success && Array.isArray(apiResult.recommendations)) {
        return apiResult.recommendations
      }
    } catch (error) {
      console.error('Failed to fetch shared recommendations:', error)
    }
  }

  try {
    return getLocalRecommendations(limit)
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return []
  }
}

/**
 * 추천 통계 조회
 */
export async function getRecommendationStats(scope?: RecommendationScope): Promise<StatsResponse | null> {
  const activeScope = resolveScope(scope)

  if (activeScope === 'shared' && !isStaticMode) {
    try {
      const response = await fetch(buildApiUrl('/api/recommendations/stats', API_BASE_URL))
      const apiResult = await parseApiJson<StatsResponse>(response)
      if (apiResult?.success) {
        return apiResult
      }
    } catch (error) {
      console.error('Failed to fetch shared recommendation stats:', error)
    }
  }

  try {
    return getLocalStats()
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return null
  }
}

/**
 * 특정 콘텐츠의 클릭 수 조회
 */
export async function getContentClickCount(contentId: string, scope?: RecommendationScope): Promise<number> {
  const activeScope = resolveScope(scope)

  if (activeScope === 'shared' && !isStaticMode) {
    try {
      const response = await fetch(
        buildApiUrl(`/api/recommendations/${encodeURIComponent(contentId)}`, API_BASE_URL)
      )
      const apiResult = await parseApiJson<CountResponse>(response)
      if (apiResult?.success) {
        return apiResult.clickCount
      }
    } catch (error) {
      console.error('Failed to fetch shared click count:', error)
    }
  }

  try {
    return getLocalClickCount(contentId)
  } catch (error) {
    console.error('Failed to fetch click count:', error)
    return 0
  }
}

/**
 * 클릭 데이터 초기화 (테스트용)
 */
export async function clearClickData(scope?: RecommendationScope): Promise<boolean> {
  const activeScope = resolveScope(scope)

  if (activeScope === 'shared' && !isStaticMode) {
    try {
      const response = await fetch(buildApiUrl('/api/recommendations/clear', API_BASE_URL), {
        method: 'POST',
      })

      if (response.ok) {
        return true
      }
    } catch (error) {
      console.error('Failed to clear shared recommendation data:', error)
      return false
    }
  }

  try {
    localStorage.removeItem(getScopedStorageKey())
    return true
  } catch (e) {
    console.warn('Failed to clear click data:', e)
    return false
  }
}
