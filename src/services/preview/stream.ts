// 실시간 프리뷰 SSE 스트림 서비스
// EventSource로 콘텐츠 생성 진행 상황을 실시간으로 수신

import type { PreviewContent } from '../../types/generation'
import { buildApiUrl } from '../api/url'
import { t } from '../../i18n'

// API URL 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 프리뷰 업데이트 콜백 타입
export type PreviewUpdateCallback = (content: PreviewContent) => void

// SSE 연결 상태
export interface PreviewStreamConnection {
  close: () => void
  isConnected: boolean
}

/**
 * SSE 스트림을 통해 실시간 프리뷰 업데이트를 구독합니다.
 *
 * @param jobId - 작업 ID
 * @param onUpdate - 프리뷰 업데이트 콜백
 * @returns 연결 해제 함수
 */
export function subscribeToPreview(
  jobId: string,
  onUpdate: PreviewUpdateCallback
): PreviewStreamConnection {
  const streamUrl = buildApiUrl(`/api/preview/stream/${jobId}`, API_BASE_URL)
  const eventSource = new EventSource(streamUrl)

  let connected = true

  eventSource.onopen = () => {
    console.log('[Preview] SSE 연결됨:', jobId)
  }

  eventSource.onmessage = (event) => {
    try {
      const content = JSON.parse(event.data) as PreviewContent
      onUpdate(content)
    } catch (error) {
      console.error('[Preview] 메시지 파싱 오류:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('[Preview] SSE 오류:', error)
    connected = false
    eventSource.close()
  }

  return {
    close: () => {
      connected = false
      eventSource.close()
      console.log('[Preview] SSE 연결 해제:', jobId)
    },
    get isConnected() {
      return connected && eventSource.readyState === EventSource.OPEN
    },
  }
}

/**
 * 프리뷰 콘텐츠를 조합하여 HTML 문서를 생성합니다.
 *
 * @param content - 부분 프리뷰 콘텐츠
 * @returns 완전한 HTML 문서 문자열
 */
export function buildPreviewDocument(content: PreviewContent): string {
  const loadingStyles = `
    .preview-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #666;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .preview-loading-content {
      text-align: center;
      color: white;
    }
    .preview-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .preview-phase-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(255,255,255,0.2);
      border-radius: 1rem;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
  `

  // 콘텐츠가 없는 경우 로딩 표시
  if (!content.html) {
    const phaseText =
      content.phase === 'html'
        ? t('livePreview.phaseHtml')
        : content.phase === 'css'
          ? t('livePreview.phaseCss')
          : content.phase === 'js'
            ? t('livePreview.phaseJs')
            : t('livePreview.phaseComplete')

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${loadingStyles}</style>
</head>
<body>
  <div class="preview-loading">
    <div class="preview-loading-content">
      <div class="preview-loading-spinner"></div>
      <p>${phaseText}</p>
      <span class="preview-phase-badge">${content.phase.toUpperCase()}</span>
    </div>
  </div>
</body>
</html>`
  }

  // 실제 콘텐츠 조합
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>실시간 프리뷰</title>
  ${content.css ? `<style>${content.css}</style>` : ''}
</head>
<body>
  ${content.html}
  ${content.js ? `<script>${content.js}</script>` : ''}
</body>
</html>`
}

/**
 * 폴링 방식으로 프리뷰 상태를 확인합니다.
 * SSE가 지원되지 않는 환경에서 폴백으로 사용합니다.
 *
 * @param jobId - 작업 ID
 * @returns 프리뷰 콘텐츠
 */
export async function fetchPreviewContent(jobId: string): Promise<PreviewContent | null> {
  try {
    const previewUrl = buildApiUrl(`/api/preview/${jobId}`, API_BASE_URL)
    const response = await fetch(previewUrl)

    if (!response.ok) {
      return null
    }

    return (await response.json()) as PreviewContent
  } catch (error) {
    console.error('[Preview] 폴링 오류:', error)
    return null
  }
}
