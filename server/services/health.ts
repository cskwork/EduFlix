// 서버 헬스 체크 보조 서비스
// art-assets 연결 가능 여부를 진단하여 /api/health 응답에 포함

import { DEFAULT_ART_ASSETS_URL, getArtAssetsUrl } from '../config'

export interface ArtAssetsHealthResult {
  url: string
  healthUrl: string
  reachable: boolean
  status?: number
  error?: string
  usingDefaultUrl: boolean
}

// art-assets 연결 불가 시 사용자/개발자에게 보여줄 안내 메시지 생성
export function buildArtAssetsUnavailableMessage(result: ArtAssetsHealthResult): string {
  const statusInfo = result.status ? `status=${result.status}` : 'status=unknown'
  const errorInfo = result.error ? `error=${result.error}` : 'error=none'
  const defaultHint = result.usingDefaultUrl
    ? '현재 기본 URL을 사용 중입니다.'
    : '환경변수 ART_ASSETS_URL이 설정되어 있습니다.'

  return [
    'art-assets 서버에 연결할 수 없습니다.',
    `ART_ASSETS_URL: ${result.url}`,
    `health: ${result.healthUrl}`,
    `진단: ${statusInfo}, ${errorInfo}`,
    defaultHint,
    '해결 방법: 배포 환경에서 ART_ASSETS_URL을 실제 art-assets 서버 주소로 설정하고, 해당 서버의 /api/health가 200인지 확인해주세요.',
  ].join(' ')
}

// 간단한 타임아웃이 적용된 fetch
async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit | undefined,
  timeoutMs: number,
  fetchFn: typeof fetch
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const nextInit: RequestInit = {
      ...init,
      signal: controller.signal,
    }
    return await fetchFn(input, nextInit)
  } finally {
    clearTimeout(timer)
  }
}

// art-assets 헬스 진단
export async function checkArtAssetsHealth(
  fetchFn: typeof fetch = fetch
): Promise<ArtAssetsHealthResult> {
  const url = getArtAssetsUrl()
  const usingDefaultUrl = !process.env.ART_ASSETS_URL?.trim() && url === DEFAULT_ART_ASSETS_URL
  const healthUrl = new URL('/api/health', url).toString()
  const fallbackUrl = new URL('/api/generate-content', url).toString()

  try {
    const response = await fetchWithTimeout(
      healthUrl,
      { method: 'GET' },
      1500,
      fetchFn
    )

    // art-assets에 /api/health가 없을 수 있으므로 404면 OPTIONS 폴백을 시도한다
    if (response.status === 404) {
      const fallbackResponse = await fetchWithTimeout(
        fallbackUrl,
        { method: 'OPTIONS' },
        1500,
        fetchFn
      )

      return {
        url,
        healthUrl,
        reachable: fallbackResponse.ok,
        status: fallbackResponse.status,
        usingDefaultUrl,
      }
    }

    return {
      url,
      healthUrl,
      reachable: response.ok,
      status: response.status,
      usingDefaultUrl,
    }
  } catch (error) {
    return {
      url,
      healthUrl,
      reachable: false,
      error: error instanceof Error ? error.message : 'art-assets 헬스 체크 실패',
      usingDefaultUrl,
    }
  }
}
