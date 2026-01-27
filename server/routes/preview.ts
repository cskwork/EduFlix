// 실시간 프리뷰 SSE 스트림 엔드포인트
// 콘텐츠 생성 중 HTML → CSS → JS 순차 프리뷰 제공

import { getJobStatus, isErrorResponse } from '../services/art-assets'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

// In-memory preview cache
interface PreviewContent {
  phase: 'html' | 'css' | 'js' | 'complete'
  html?: string
  css?: string
  js?: string
  timestamp: string
}

const previewCache = new Map<string, PreviewContent>()

// Update preview cache from art-assets partial content
export function updatePreviewCache(jobId: string, partialContent: Partial<PreviewContent>) {
  const existing = previewCache.get(jobId) || {
    phase: 'html' as const,
    timestamp: new Date().toISOString(),
  }

  const updated: PreviewContent = {
    ...existing,
    ...partialContent,
    timestamp: new Date().toISOString(),
  }

  // Determine phase based on available content
  if (updated.js) {
    updated.phase = 'complete'
  } else if (updated.css) {
    updated.phase = 'js'
  } else if (updated.html) {
    updated.phase = 'css'
  }

  previewCache.set(jobId, updated)
}

// Get cached preview content
export function getPreviewContent(jobId: string): PreviewContent | undefined {
  return previewCache.get(jobId)
}

// Clear preview cache for a job
export function clearPreviewCache(jobId: string) {
  previewCache.delete(jobId)
}

// SSE 헬퍼: 메시지 형식
function formatSSEMessage(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

// 프리뷰 라우트 핸들러
export async function handlePreviewRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  // GET /api/preview/stream/:jobId - SSE 스트림
  if (req.method === 'GET' && pathname.startsWith('/api/preview/stream/')) {
    const jobId = pathname.split('/').pop()

    if (!jobId) {
      return errorResponse('작업 ID가 필요합니다', 400)
    }

    // SSE 스트림 생성
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let lastPhase = ''
        let pollCount = 0
        const maxPolls = 180 // 최대 3분 (1초 간격)

        const sendUpdate = (content: PreviewContent) => {
          try {
            controller.enqueue(encoder.encode(formatSSEMessage(content)))
          } catch {
            // Stream closed
          }
        }

        // 초기 연결 확인 메시지
        sendUpdate({
          phase: 'html',
          timestamp: new Date().toISOString(),
        })

        // 폴링 루프
        while (pollCount < maxPolls) {
          pollCount++

          try {
            // art-assets 상태 조회
            const status = await getJobStatus(jobId)

            if (isErrorResponse(status)) {
              sendUpdate({
                phase: 'complete',
                timestamp: new Date().toISOString(),
              })
              break
            }

            // 캐시된 프리뷰 확인
            const cached = previewCache.get(jobId)
            if (cached && cached.phase !== lastPhase) {
              sendUpdate(cached)
              lastPhase = cached.phase
            }

            // 작업 완료 확인
            if (status.status === 'completed' || status.status === 'failed') {
              // 최종 상태 전송
              sendUpdate({
                phase: 'complete',
                html: cached?.html,
                css: cached?.css,
                js: cached?.js,
                timestamp: new Date().toISOString(),
              })

              // 캐시 정리
              clearPreviewCache(jobId)
              break
            }

            // 1초 대기
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.error('Preview polling error:', error)
            break
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
      },
    })
  }

  // GET /api/preview/:jobId - 현재 프리뷰 상태 (폴링용)
  if (req.method === 'GET' && pathname.startsWith('/api/preview/') && !pathname.includes('/stream/')) {
    const jobId = pathname.split('/').pop()

    if (!jobId) {
      return errorResponse('작업 ID가 필요합니다', 400)
    }

    const cached = previewCache.get(jobId)

    if (!cached) {
      return jsonResponse({
        phase: 'html',
        message: '프리뷰 대기 중...',
      })
    }

    return jsonResponse(cached)
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}
