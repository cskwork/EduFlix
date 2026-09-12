// 콘텐츠 로딩 서비스
import type { ContentManifest, Subject, GradeLevel } from '../../types/content'
import { revisionedContentUrl } from './revision'
import { t } from '../../i18n'

// 콘텐츠 HTML 경로 생성에 필요한 최소 타입
interface ContentPathInfo {
  id: string
  subject: Subject
  gradeLevel: GradeLevel
  path?: string
}

// 콘텐츠 로딩 상태
export interface ContentLoadState {
  isLoading: boolean
  error: string | null
  content: ContentManifest | null
  htmlPath: string | null
}

// 초기 상태
export function createInitialState(): ContentLoadState {
  return {
    isLoading: false,
    error: null,
    content: null,
    htmlPath: null,
  }
}

// 콘텐츠 매니페스트 로드
export async function loadContentManifest(contentPath: string): Promise<ContentManifest> {
  const manifestPath = `${contentPath}/manifest.json`
  const response = await fetch(revisionedContentUrl(manifestPath), { cache: 'no-cache' })

  if (!response.ok) {
    throw new Error(t('errors.manifestLoadFailed', { path: manifestPath }))
  }

  return response.json()
}

// 콘텐츠 HTML 경로 생성
export function getContentHtmlPath(content: ContentPathInfo): string {
  // path 필드가 있으면 사용, 없으면 기본 경로 생성
  if (content.path) {
    // 상대경로면 절대경로로 변환
    return revisionedContentUrl(content.path.startsWith('/') ? content.path : `/${content.path}`)
  }

  // 기본 경로: /contents/{subject}/{gradeLevel}/{id}/index.html
  return revisionedContentUrl(`/contents/${content.subject}/${content.gradeLevel}/${content.id}/index.html`)
}

// 콘텐츠 존재 여부 확인
export async function checkContentExists(htmlPath: string): Promise<boolean> {
  try {
    const response = await fetch(htmlPath, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// 콘텐츠 ID로 카탈로그에서 찾기
export async function findContentById(id: string): Promise<ContentManifest | null> {
  try {
    const response = await fetch(revisionedContentUrl('/contents/index.json'), { cache: 'no-cache' })
    if (!response.ok) {
      return null
    }

    const catalog = await response.json()
    const contents = catalog.contents || []
    return contents.find((c: ContentManifest) => c.id === id) || null
  } catch {
    return null
  }
}

// 콘텐츠 전체 로드 (ID 기반)
export async function loadContentById(id: string): Promise<{
  content: ContentManifest
  htmlPath: string
}> {
  // 먼저 카탈로그에서 찾기
  const content = await findContentById(id)

  if (!content) {
    throw new Error(`${t('errors.contentNotFound')}: ${id}`)
  }

  const htmlPath = getContentHtmlPath(content)

  return { content, htmlPath }
}

// iframe sandbox 속성 설정
// allow-same-origin 포함: 외부 CSS/JS 파일 로드에 필요 (solar-system 등)
// 콘텐츠는 신뢰할 수 있는 정적 파일이므로 보안상 허용
export const IFRAME_SANDBOX_ATTRS = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'

// iframe에서 허용할 기능 목록
export const IFRAME_ALLOW_ATTRS =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture'
