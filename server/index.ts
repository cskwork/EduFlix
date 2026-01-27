// Bun HTTP 서버 진입점
import { serve } from 'bun'
import { handleGenerateRoute } from './routes/generate'
import { handleContentRoute } from './routes/content'
import { handleRecommendationsRoute } from './routes/recommendations'
import { handlePreviewRoute } from './routes/preview'
import { getServerPort } from './config'
import { checkArtAssetsHealth } from './services/health'

const PORT = getServerPort()

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// JSON 응답 헬퍼
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// 에러 응답 헬퍼
function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message, success: false }, status)
}

// 요청 핸들러
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // API 라우팅
    if (pathname.startsWith('/api/generate')) {
      return await handleGenerateRoute(req, jsonResponse, errorResponse)
    }

    if (pathname.startsWith('/api/content')) {
      return await handleContentRoute(req, jsonResponse, errorResponse)
    }

    if (pathname.startsWith('/api/recommendations')) {
      return await handleRecommendationsRoute(req, jsonResponse, errorResponse)
    }

    if (pathname.startsWith('/api/preview')) {
      return await handlePreviewRoute(req, jsonResponse, errorResponse)
    }

    // 헬스 체크
    if (pathname === '/api/health') {
      const artAssets = await checkArtAssetsHealth()
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        artAssets,
      })
    }

    // 404 처리
    return errorResponse('Not Found', 404)
  } catch (error) {
    console.error('Server error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return errorResponse(message, 500)
  }
}

// 서버 시작
const server = serve({
  port: PORT,
  fetch: handleRequest,
})

console.log(`EduFlix API 서버 실행 중: http://localhost:${server.port}`)
