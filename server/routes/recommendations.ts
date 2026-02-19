// 추천 시스템 API 라우트
import {
  recordClick,
  getPopularContent,
  getClickCount,
  getStats,
  clearAllClicks,
  type RecommendedContent,
} from '../services/recommendations'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

interface ClickRequestBody {
  contentId: string
}

/**
 * 추천 API 라우트 핸들러
 *
 * Endpoints:
 * - POST /api/recommendations/click - 클릭 기록
 * - GET /api/recommendations - 인기 콘텐츠 목록
 * - GET /api/recommendations/stats - 통계
 * - POST /api/recommendations/clear - 전체 클릭 데이터 초기화
 * - GET /api/recommendations/:contentId - 특정 콘텐츠 클릭 수
 */
export async function handleRecommendationsRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  // POST /api/recommendations/click - 클릭 기록
  if (req.method === 'POST' && pathname === '/api/recommendations/click') {
    try {
      const body = (await req.json()) as ClickRequestBody

      if (!body.contentId || typeof body.contentId !== 'string') {
        return errorResponse('contentId is required', 400)
      }

      const result = recordClick(body.contentId)

      return jsonResponse({
        success: true,
        contentId: body.contentId,
        clickCount: result.click_count,
      })
    } catch (error) {
      console.error('Click recording error:', error)
      return errorResponse('Failed to record click', 500)
    }
  }

  // GET /api/recommendations/stats - 통계
  if (req.method === 'GET' && pathname === '/api/recommendations/stats') {
    try {
      const stats = getStats()

      return jsonResponse({
        success: true,
        ...stats,
      })
    } catch (error) {
      console.error('Stats fetch error:', error)
      return errorResponse('Failed to fetch stats', 500)
    }
  }

  // GET /api/recommendations - 인기 콘텐츠 목록
  if (req.method === 'GET' && pathname === '/api/recommendations') {
    try {
      const limitParam = url.searchParams.get('limit')
      const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) : 10

      const popular: RecommendedContent[] = getPopularContent(limit)

      return jsonResponse({
        success: true,
        count: popular.length,
        recommendations: popular,
      })
    } catch (error) {
      console.error('Recommendations fetch error:', error)
      return errorResponse('Failed to fetch recommendations', 500)
    }
  }

  // POST /api/recommendations/clear - 전체 클릭 데이터 초기화
  if (req.method === 'POST' && pathname === '/api/recommendations/clear') {
    try {
      const cleared = clearAllClicks()

      return jsonResponse({
        success: true,
        cleared,
      })
    } catch (error) {
      console.error('Recommendations clear error:', error)
      return errorResponse('Failed to clear recommendations', 500)
    }
  }

  // GET /api/recommendations/:contentId - 특정 콘텐츠 클릭 수
  const contentIdMatch = pathname.match(/^\/api\/recommendations\/([^/]+)$/)
  if (req.method === 'GET' && contentIdMatch && contentIdMatch[1] !== 'stats') {
    try {
      const contentId = decodeURIComponent(contentIdMatch[1])
      const clickCount = getClickCount(contentId)

      return jsonResponse({
        success: true,
        contentId,
        clickCount,
      })
    } catch (error) {
      console.error('Click count fetch error:', error)
      return errorResponse('Failed to fetch click count', 500)
    }
  }

  return errorResponse('Not Found', 404)
}
