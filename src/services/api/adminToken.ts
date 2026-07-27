// 쓰기 계열 API(생성·편집·삭제) 호출에 붙이는 관리자 토큰
//
// 서버가 ADMIN_TOKEN을 설정한 배포에서는 이 토큰이 있어야 콘텐츠 생성·편집이 가능하다.
// 공개 배포본에 토큰을 번들로 심을 수는 없으므로 브라우저 localStorage에서 읽는다.
// 운영자는 콘솔에서 아래처럼 한 번만 설정하면 된다:
//   localStorage.setItem('eduflix_admin_token', '<서버의 ADMIN_TOKEN>')

const STORAGE_KEY = 'eduflix_admin_token'

export function getAdminToken(): string {
  if (typeof localStorage === 'undefined') return ''
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function setAdminToken(token: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (token.trim()) localStorage.setItem(STORAGE_KEY, token.trim())
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 스토리지 접근이 막힌 환경에서는 무시
  }
}

// 기존 헤더에 관리자 토큰을 덧붙인다 (토큰이 없으면 그대로 반환)
export function withAdminToken(headers: Record<string, string> = {}): Record<string, string> {
  const token = getAdminToken()
  return token ? { ...headers, 'X-Admin-Token': token } : headers
}
