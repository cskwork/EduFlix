// Bun HTTP 서버 진입점
import { serve, file } from 'bun'
import { join } from 'path'
import { handleGenerateRoute } from './routes/generate'
import { handleContentRoute } from './routes/content'
import { handleRecommendationsRoute } from './routes/recommendations'
import { handlePreviewRoute } from './routes/preview'
import { getServerPort } from './config'
import { checkArtAssetsHealth } from './services/health'

// 프로세스 크래시 방지: uncaught exception/rejection 로깅
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION:`, error)
})

process.on('unhandledRejection', (reason) => {
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION:`, reason)
})

const PORT = getServerPort()

// 정적 파일 서빙 설정
const STATIC_DIR = join(import.meta.dir, '..', 'dist')
const PUBLIC_DIR = join(import.meta.dir, '..', 'public')

// MIME 타입 매핑
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
}

// 파일 확장자에서 MIME 타입 가져오기
function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'))
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// 정적 파일 서빙 함수
async function serveStaticFile(pathname: string): Promise<Response | null> {
  // dist 폴더에서 먼저 찾기 (빌드된 파일)
  let filePath = join(STATIC_DIR, pathname)
  let bunFile = file(filePath)

  if (await bunFile.exists()) {
    return new Response(bunFile, {
      headers: { 'Content-Type': getMimeType(pathname) },
    })
  }

  // public 폴더에서 찾기 (개발 시 정적 파일)
  filePath = join(PUBLIC_DIR, pathname)
  bunFile = file(filePath)

  if (await bunFile.exists()) {
    return new Response(bunFile, {
      headers: { 'Content-Type': getMimeType(pathname) },
    })
  }

  return null
}

// CORS 헤더 설정 (프로덕션 모드에서는 동일 origin이므로 * 허용)
const isProduction = process.env.NODE_ENV === 'production'
const corsHeaders = {
  'Access-Control-Allow-Origin': isProduction ? '*' : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
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

  // 요청 로깅 (API 요청만)
  if (pathname.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`)
  }

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

    // 정적 파일 서빙 (dist/ 또는 public/)
    const staticResponse = await serveStaticFile(pathname)
    if (staticResponse) {
      return staticResponse
    }

    // SPA 폴백: index.html 반환 (API가 아닌 경로)
    if (!pathname.startsWith('/api/')) {
      const indexFile = file(join(STATIC_DIR, 'index.html'))
      if (await indexFile.exists()) {
        return new Response(indexFile, {
          headers: { 'Content-Type': 'text/html' },
        })
      }
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
