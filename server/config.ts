// 서버 설정 기본값과 환경변수 해석 유틸

// 3000 충돌을 피하기 위한 기본 서버 포트
export const DEFAULT_SERVER_PORT = 3001

// art-assets 기본 포트도 3000을 사용하지 않음
export const DEFAULT_ART_ASSETS_PORT = 3100
export const DEFAULT_ART_ASSETS_URL = `http://localhost:${DEFAULT_ART_ASSETS_PORT}`

// 서버 포트 해석
export function getServerPort(env: Partial<Record<string, string | undefined>> = process.env): number {
  const rawPort = env.PORT
  const parsedPort = rawPort ? Number(rawPort) : NaN

  if (Number.isFinite(parsedPort) && parsedPort > 0) {
    return parsedPort
  }

  return DEFAULT_SERVER_PORT
}

// art-assets URL 해석
export function getArtAssetsUrl(
  env: Partial<Record<string, string | undefined>> = process.env
): string {
  const rawUrl = env.ART_ASSETS_URL?.trim()
  if (rawUrl) {
    return rawUrl
  }
  return DEFAULT_ART_ASSETS_URL
}

