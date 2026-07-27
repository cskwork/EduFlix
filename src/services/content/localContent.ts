// 브라우저에 보관하는 생성 콘텐츠 (Vercel 정적 배포 전용)
//
// 로컬/터널 배포는 서버 파일시스템(public/contents/)에 저장하므로 이 모듈을 쓰지 않는다.
// 정적 배포에서는 서버가 파일을 쓸 수 없어, 서버리스 함수가 돌려준 3개 파일을
// IndexedDB에 보관하고 뷰어가 Blob URL로 렌더링한다.
// localStorage가 아니라 IndexedDB를 쓰는 이유: 콘텐츠 3파일 합계가 5MB 한도를 넘길 수 있다.
import type { ContentManifest, ContentType, GradeLevel, Subject } from '../../types/content'
import { t } from '../../i18n'

const DB_NAME = 'eduflix-local-content'
const DB_VERSION = 1
const STORE_NAME = 'contents'

// 로컬 콘텐츠 id 접두사 — 서버 카탈로그의 id와 충돌하지 않게 구분한다
export const LOCAL_CONTENT_PREFIX = 'local-'

export interface LocalContent {
  id: string
  title: string
  description: string
  subject: Subject
  gradeLevel: GradeLevel
  grade: string
  type: ContentType
  language: string
  html: string
  css: string
  js: string
  createdAt: string
}

export function isLocalContentId(id: string): boolean {
  return id.startsWith(LOCAL_CONTENT_PREFIX)
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error(t('errors.indexedDbUnsupported')))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error(t('errors.indexedDbOpenFailed')))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode)
      const request = run(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(request.error ?? new Error(t('errors.indexedDbOperationFailed')))
    })
  } finally {
    db.close()
  }
}

export async function saveLocalContent(content: LocalContent): Promise<void> {
  await withStore('readwrite', (store) => store.put(content))
}

export async function getLocalContent(id: string): Promise<LocalContent | undefined> {
  return withStore<LocalContent | undefined>('readonly', (store) => store.get(id))
}

export async function listLocalContents(): Promise<LocalContent[]> {
  const all = await withStore<LocalContent[]>('readonly', (store) => store.getAll())
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteLocalContent(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

// 로컬 콘텐츠를 카탈로그 항목 형태로 변환해 기존 목록 UI에 그대로 태운다
export function toManifest(content: LocalContent): ContentManifest {
  return {
    id: content.id,
    title: content.title,
    subject: content.subject,
    gradeLevel: content.gradeLevel,
    grade: content.grade,
    type: content.type,
    language: content.language,
    description: content.description,
    thumbnail: '',
    // 실제 파일이 없으므로 뷰어가 Blob URL로 대체한다 (isLocalContentId로 분기)
    path: '',
    prerequisites: [],
    createdAt: content.createdAt,
    tags: [],
  } as ContentManifest
}

// 3개 파일을 하나의 실행 가능한 HTML 문서로 합친다
export function buildLocalDocument(content: Pick<LocalContent, 'html' | 'css' | 'js'>): string {
  let document = content.html

  if (content.css) {
    const styleTag = `<style>\n${content.css}\n</style>`
    // 외부 style.css 링크는 파일이 없으므로 인라인 <style>로 치환한다
    document = document.replace(/<link[^>]+href=["']\.?\/?style\.css["'][^>]*>/i, styleTag)
    if (!document.includes(styleTag)) {
      document = document.includes('</head>')
        ? document.replace('</head>', `${styleTag}\n</head>`)
        : `${styleTag}\n${document}`
    }
  }

  if (content.js) {
    const scriptTag = `<script>\n${content.js}\n</script>`
    document = document.replace(/<script[^>]+src=["']\.?\/?script\.js["'][^>]*>\s*<\/script>/i, scriptTag)
    if (!document.includes(scriptTag)) {
      document = document.includes('</body>')
        ? document.replace('</body>', `${scriptTag}\n</body>`)
        : `${document}\n${scriptTag}`
    }
  }

  return document
}

// 뷰어 iframe에 넘길 Blob URL 생성 (해제는 호출자 책임)
export function createLocalContentUrl(content: Pick<LocalContent, 'html' | 'css' | 'js'>): string {
  const blob = new Blob([buildLocalDocument(content)], { type: 'text/html' })
  return URL.createObjectURL(blob)
}
