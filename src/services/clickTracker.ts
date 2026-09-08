// localStorage 기반 콘텐츠 클릭 추적 서비스
// 정적 모드에서도 작동하며, 자주 클릭한 콘텐츠 우선 표시에 사용

const STORAGE_KEY = 'eduflix_click_stats'

export interface ClickStats {
  [contentId: string]: {
    count: number
    lastClickedAt: string
  }
}

/**
 * 모든 클릭 통계 조회
 */
export function getClickStats(): ClickStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * 콘텐츠 클릭 기록
 */
export function recordClick(contentId: string): void {
  const stats = getClickStats()
  const existing = stats[contentId]

  stats[contentId] = {
    count: (existing?.count || 0) + 1,
    lastClickedAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage 용량 초과 시 오래된 항목 정리
    cleanupOldEntries(stats)
  }
}

/**
 * 특정 콘텐츠의 클릭 수 조회
 */
export function getClickCount(contentId: string): number {
  const stats = getClickStats()
  return stats[contentId]?.count || 0
}

/**
 * 콘텐츠 정렬 점수 계산
 * 클릭 수 + 최신순 가중치 조합
 * @param contentId 콘텐츠 ID
 * @param createdAt 콘텐츠 생성일 (ISO string)
 * @returns 정렬 점수 (높을수록 왼쪽)
 */
export function calculateSortScore(
  contentId: string,
  createdAt: string | undefined,
  stats: ClickStats = getClickStats(),
  now: Date = new Date(),
): number {
  const clickData = stats[contentId]

  // 최신순 점수: 최근 30일 내 생성된 콘텐츠에 높은 가산점 (최신 콘텐츠 우선)
  let recencyScore = 0

  if (createdAt) {
    const createdDate = new Date(createdAt)
    if (!isNaN(createdDate.getTime())) {
      const daysSinceCreation = Math.max(0, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      recencyScore = Math.max(0, 100 - daysSinceCreation * 3) // 최대 100점, 매일 3점씩 감소
    }
  }

  // 클릭 점수: 클릭 수 * 5 (최신순보다 낮은 가중치)
  const clickScore = (clickData?.count || 0) * 5

  // 최근 클릭 가산점: 최근 7일 내 클릭 시 추가 점수
  let recentClickBonus = 0
  if (clickData?.lastClickedAt) {
    const lastClicked = new Date(clickData.lastClickedAt)
    const daysSinceClick = (now.getTime() - lastClicked.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceClick <= 7) {
      recentClickBonus = Math.max(0, 7 - daysSinceClick) // 최대 7점
    }
  }

  return clickScore + recencyScore + recentClickBonus
}

/**
 * 오래된 항목 정리 (30일 이상 클릭 없는 항목)
 */
function cleanupOldEntries(stats: ClickStats): void {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const cleaned: ClickStats = {}
  for (const [id, data] of Object.entries(stats)) {
    if (new Date(data.lastClickedAt) > thirtyDaysAgo) {
      cleaned[id] = data
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch {
    // 여전히 실패하면 전체 초기화
    localStorage.removeItem(STORAGE_KEY)
  }
}
