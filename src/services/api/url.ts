// API URL 결합 유틸리티
// 상대 baseUrl 오염으로 /create/api/* 같은 경로가 만들어지는 문제를 방지

// 런타임 origin 해석 (브라우저/테스트 환경 모두 지원)
export function getRuntimeOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost'
}

// API URL 안전 결합 (상대 baseUrl 오염 방지)
export function buildApiUrl(path: string, baseUrl = ''): string {
  const origin = getRuntimeOrigin()
  const base = baseUrl ? new URL(baseUrl, origin) : new URL(origin)
  return new URL(path, base).toString()
}
