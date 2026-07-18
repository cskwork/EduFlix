// 로컬 팩토리 job 기반 실시간 프리뷰 API
import type { PreviewContent } from '../../src/types/generation'
import { factoryRunner } from '../services/factory-runner'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response
const PREVIEW_POLL_INTERVAL_MS = 500
export const PREVIEW_STREAM_DURATION_MS = 8 * 60 * 60 * 1000

interface PreviewDependencies {
  getJob: typeof factoryRunner.getJob
  getPreview: typeof factoryRunner.getPreview
  sleep: (milliseconds: number) => Promise<unknown>
  maxPolls: number
}

const defaultDependencies: PreviewDependencies = {
  getJob: factoryRunner.getJob.bind(factoryRunner),
  getPreview: factoryRunner.getPreview.bind(factoryRunner),
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxPolls: Math.ceil(PREVIEW_STREAM_DURATION_MS / PREVIEW_POLL_INTERVAL_MS),
}

function formatSse(content: PreviewContent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(content)}\n\n`)
}

export function createPreviewStream(
  jobId: string,
  dependencies: PreviewDependencies = defaultDependencies,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      let lastTimestamp = ''
      for (let poll = 0; poll < dependencies.maxPolls; poll += 1) {
        const job = dependencies.getJob(jobId)
        if (!job) break
        const preview = dependencies.getPreview(jobId)
        if (preview && preview.timestamp !== lastTimestamp) {
          controller.enqueue(formatSse(preview))
          lastTimestamp = preview.timestamp ?? ''
        }
        if (job.status === 'completed' || job.status === 'failed') {
          if (preview?.phase !== 'complete') {
            controller.enqueue(formatSse({ ...preview, phase: 'complete', timestamp: new Date().toISOString() }))
          }
          break
        }
        await dependencies.sleep(PREVIEW_POLL_INTERVAL_MS)
      }
      controller.close()
    },
  })
}

export async function handlePreviewRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse,
  dependencies: PreviewDependencies = defaultDependencies,
): Promise<Response> {
  const pathname = new URL(req.url).pathname
  const jobId = pathname.split('/').pop()
  if (!jobId) return errorResponse('작업 ID가 필요합니다', 400)
  if (!dependencies.getJob(jobId)) return errorResponse('작업을 찾을 수 없습니다', 404)

  if (req.method === 'GET' && pathname.startsWith('/api/preview/stream/')) {
    return new Response(createPreviewStream(jobId, dependencies), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
      },
    })
  }

  if (req.method === 'GET' && pathname.startsWith('/api/preview/')) {
    return jsonResponse(dependencies.getPreview(jobId) ?? {
      phase: 'html', message: '프리뷰 대기 중...', timestamp: new Date().toISOString(),
    })
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}
