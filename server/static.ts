import { file } from 'bun'
import { resolve } from 'node:path'
import { isInside } from './security'

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

// Live lesson/catalog files must not be shadowed by the previous frontend build.
export async function serveStaticFile(
  pathname: string, directories: { staticDir: string; publicDir: string },
): Promise<Response | null> {
  const roots = pathname.startsWith('/contents/')
    ? [directories.publicDir, directories.staticDir]
    : [directories.staticDir, directories.publicDir]
  for (const root of roots) {
    const base = resolve(root)
    const target = resolve(base, `.${pathname}`)
    if (!isInside(base, target)) continue
    const candidate = file(target)
    if (await candidate.exists()) {
      return new Response(candidate, { headers: { 'Content-Type': getMimeType(pathname) } })
    }
  }
  return null
}
