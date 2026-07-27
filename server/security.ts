// 쓰기 계열 API 접근 제어와 경로 봉쇄 유틸
import { isAbsolute, relative, sep } from 'node:path'

export const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const GRADE_LEVELS = ['elementary', 'middle', 'high'] as const

export interface AccessDenial {
  status: number
  message: string
}

// target이 base 하위에 있는지 검사한다.
// resolve().startsWith()는 `contents`와 `contents-evil`을 구분하지 못하므로 relative 기반으로 판정한다.
// includeBase=false면 base 자기 자신도 거부한다(디렉터리 통째 삭제 방지).
export function isInside(base: string, target: string, includeBase = false): boolean {
  if (target === base) return includeBase
  const rel = relative(base, target)
  if (rel === '' || isAbsolute(rel)) return includeBase && rel === ''
  return rel !== '..' && !rel.startsWith(`..${sep}`)
}

export function isContentSlug(value: unknown): value is string {
  return typeof value === 'string' && CONTENT_SLUG_PATTERN.test(value)
}

export function isGradeLevel(value: unknown): value is (typeof GRADE_LEVELS)[number] {
  return typeof value === 'string' && (GRADE_LEVELS as readonly string[]).includes(value)
}

// 길이 노출을 줄이기 위한 상수 시간 비교
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readToken(req: Request): string | undefined {
  const header = req.headers.get('x-admin-token')
  if (header) return header
  const authorization = req.headers.get('authorization')
  if (authorization?.toLowerCase().startsWith('bearer ')) return authorization.slice(7)
  return undefined
}

// 콘텐츠 생성·수정·삭제처럼 부작용이 있는 요청에 대한 접근 제어.
//
// - ADMIN_TOKEN 설정 시: X-Admin-Token 또는 Authorization: Bearer 헤더가 일치해야 통과.
//   헤더 기반이라 브라우저가 자동으로 붙이지 않으므로 CSRF도 함께 차단된다.
// - ADMIN_TOKEN 미설정 시: 개발 모드(NODE_ENV !== 'production')에서만 통과.
//   프로덕션에서는 토큰 없이 열어두지 않는다. 리버스 프록시(cloudflared) 뒤에서는
//   소켓 IP가 항상 loopback으로 보이므로 IP 기반 판정은 신뢰할 수 없다.
export function checkWriteAccess(
  req: Request,
  env: Partial<Record<string, string | undefined>> = process.env,
): AccessDenial | undefined {
  const adminToken = env.ADMIN_TOKEN?.trim()

  if (!adminToken) {
    if (env.NODE_ENV === 'production') {
      return {
        status: 503,
        message: 'ADMIN_TOKEN이 설정되지 않아 쓰기 API가 비활성화되어 있습니다. 서버 환경변수에 ADMIN_TOKEN을 설정하세요.',
      }
    }
    return undefined
  }

  const provided = readToken(req)
  if (!provided || !timingSafeEqual(provided, adminToken)) {
    return { status: 401, message: '관리자 토큰이 필요합니다 (X-Admin-Token 헤더).' }
  }
  return undefined
}
