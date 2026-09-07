import { join, resolve } from "node:path"
import { unlink } from "node:fs/promises"
import { inflateRawSync } from "node:zlib"
import { acquireCatalogLock, atomicWriteFile, validateCatalogSource } from "../services/catalog"
import { embedEditorOverrides, validateEditorOverrides } from "../../src/services/editor/overrides"
import { encodeContentZip, decodeContentZip } from "../../src/services/contentArchive"
// 콘텐츠 CRUD API 엔드포인트
import type { ContentManifest, ContentCatalog } from '../../src/types/content'
import type { SaveContentRequest } from '../../src/types/editor'
import { checkWriteAccess, isContentSlug, isGradeLevel, isInside } from '../security'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

// ZIP import로 저장을 허용할 파일 (정적 서빙되는 디렉터리이므로 화이트리스트로 제한)
const IMPORTABLE_FILES = new Set(['index.html', 'style.css', 'script.js', 'manifest.json'])
const MAX_IMPORT_BYTES = 2 * 1024 * 1024
const MAX_IMPORT_ENTRIES = 32

// 카탈로그 항목으로부터 콘텐츠 디렉터리 경로를 재구성한다.
// manifest.path는 클라이언트가 넣을 수 있는 값이므로 신뢰하지 않고 subject/gradeLevel/id로만 만든다.
function resolveContentDir(
  path: typeof import('path'),
  content: Pick<ContentManifest, 'id' | 'subject' | 'gradeLevel'>,
  rootDir: string,
): string | undefined {
  if (!isContentSlug(content.id) || !isContentSlug(content.subject) || !isGradeLevel(content.gradeLevel)) {
    return undefined
  }
  const contentsDir = path.resolve(rootDir, 'public/contents')
  const resolved = path.resolve(rootDir, 'public/contents', content.subject, content.gradeLevel, content.id)
  return isInside(contentsDir, resolved) ? resolved : undefined
}

// 콘텐츠 CRUD API 핸들러
async function handleContentRouteUnlocked(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse,
  rootDir: string,
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname
  const fs = await import('fs/promises')

  const CATALOG_PATH = join(rootDir, 'public/contents/index.json')

  // 읽기(GET)를 제외한 모든 요청은 관리자 권한이 필요하다
  if (req.method !== 'GET') {
    const denial = checkWriteAccess(req)
    if (denial) return errorResponse(denial.message, denial.status)
  }

  // 카탈로그 로드 헬퍼
  async function loadCatalog(): Promise<ContentCatalog> {
    const data = await fs.readFile(CATALOG_PATH, 'utf-8')
    validateCatalogSource(data)
    return JSON.parse(data)
  }

  // 카탈로그 저장 헬퍼
  async function saveCatalog(catalog: ContentCatalog): Promise<void> {
    catalog.lastUpdated = new Date().toISOString()
    await atomicWriteFile(CATALOG_PATH, JSON.stringify(catalog, null, 2))
  }

  // GET /api/content - 콘텐츠 목록 조회
  if (req.method === 'GET' && pathname === '/api/content') {
    try {
      const catalog = await loadCatalog()

      // 쿼리 파라미터로 필터링
      const subject = url.searchParams.get('subject')
      const gradeLevel = url.searchParams.get('gradeLevel')
      const type = url.searchParams.get('type')

      let contents = catalog.contents

      if (subject) {
        contents = contents.filter((c) => c.subject === subject)
      }
      if (gradeLevel) {
        contents = contents.filter((c) => c.gradeLevel === gradeLevel)
      }
      if (type) {
        contents = contents.filter((c) => c.type === type)
      }

      return jsonResponse({
        success: true,
        count: contents.length,
        contents,
      })
    } catch (error) {
      console.error('콘텐츠 목록 조회 오류:', error)
      return errorResponse('콘텐츠 목록 조회 실패', 500)
    }
  }

  // GET /api/content/:id - 단일 콘텐츠 조회
  if (req.method === 'GET' && pathname.match(/^\/api\/content\/[\w-]+$/)) {
    try {
      const contentId = pathname.split('/').pop()
      const catalog = await loadCatalog()

      const content = catalog.contents.find((c) => c.id === contentId)
      if (!content) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      return jsonResponse({
        success: true,
        content,
      })
    } catch (error) {
      console.error('콘텐츠 조회 오류:', error)
      return errorResponse('콘텐츠 조회 실패', 500)
    }
  }

  // POST /api/content - 콘텐츠 등록 (수동 등록용)
  if (req.method === 'POST' && pathname === '/api/content') {
    try {
      const body = (await req.json()) as Partial<ContentManifest>
      if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('요청 본문은 JSON 객체여야 합니다', 400)

      // 필수 필드 검증
      if (!body.id || !body.title || !body.subject || !body.gradeLevel || !body.type) {
        return errorResponse('필수 필드가 누락되었습니다: id, title, subject, gradeLevel, type', 400)
      }
      if (!isContentSlug(body.id) || !isContentSlug(body.subject)) {
        return errorResponse('id와 subject는 영문 소문자·숫자·하이픈 slug여야 합니다', 400)
      }
      if (!isGradeLevel(body.gradeLevel)) {
        return errorResponse('gradeLevel은 elementary, middle, high 중 하나여야 합니다', 400)
      }

      const catalog = await loadCatalog()

      // 중복 ID 확인
      if (catalog.contents.some((c) => c.id === body.id)) {
        return errorResponse('이미 존재하는 콘텐츠 ID입니다', 409)
      }

      // 콘텐츠 추가
      const newContent: ContentManifest = {
        id: body.id,
        title: body.title,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        grade: body.grade || `${body.gradeLevel}-1`,
        type: body.type,
        language: body.language || 'ko',
        description: body.description || '',
        thumbnail: body.thumbnail || '',
        // path는 클라이언트 입력을 쓰지 않고 항상 서버가 구성한다 (임의 경로 지정 방지)
        path: `contents/${body.subject}/${body.gradeLevel}/${body.id}/index.html`,
        prerequisites: body.prerequisites || [],
        createdAt: new Date().toISOString(),
        tags: body.tags || [],
      }

      catalog.contents.push(newContent)
      await saveCatalog(catalog)

      return jsonResponse({
        success: true,
        content: newContent,
      }, 201)
    } catch (error) {
      console.error('콘텐츠 등록 오류:', error)
      return errorResponse('콘텐츠 등록 실패', 500)
    }
  }

  // PUT /api/content/:id - 콘텐츠 수정
  if (req.method === 'PUT' && pathname.match(/^\/api\/content\/[\w-]+$/)) {
    try {
      const contentId = pathname.split('/').pop()
      const body = (await req.json()) as Partial<ContentManifest>
      if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('요청 본문은 JSON 객체여야 합니다', 400)

      const catalog = await loadCatalog()
      const index = catalog.contents.findIndex((c) => c.id === contentId)

      if (index === -1) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      // 업데이트 가능한 필드만 수정
      const existing = catalog.contents[index]
      const updatedContent: ContentManifest = {
        ...existing,
        ...body,
        id: contentId!, // ID는 변경 불가
        // 경로 결정 필드는 변경 불가 (파일 조작 경로가 클라이언트 입력으로 바뀌지 않도록)
        subject: existing.subject,
        gradeLevel: existing.gradeLevel,
        path: existing.path,
        updatedAt: new Date().toISOString(),
      }

      catalog.contents[index] = updatedContent
      await saveCatalog(catalog)

      return jsonResponse({
        success: true,
        content: updatedContent,
      })
    } catch (error) {
      console.error('콘텐츠 수정 오류:', error)
      return errorResponse('콘텐츠 수정 실패', 500)
    }
  }

  // PUT /api/content/:id/files - 콘텐츠 파일 업데이트 (편집기용)
  if (req.method === 'PUT' && pathname.match(/^\/api\/content\/[\w-]+\/files$/)) {
    try {
      const contentId = pathname.split('/')[3]
      const body = (await req.json()) as SaveContentRequest
      const path = await import('path')

      const catalog = await loadCatalog()
      const content = catalog.contents.find((c) => c.id === contentId)

      if (!content) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      // 콘텐츠 디렉토리 경로 (카탈로그의 path 문자열이 아니라 subject/gradeLevel/id로 재구성)
      const resolvedDir = resolveContentDir(path, content, rootDir)
      if (!resolvedDir) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      // Store one overlay atomically; the bridge reapplies supported text/style changes on reload.
      let overrides: SaveContentRequest
      try {
        overrides = validateEditorOverrides(body)
        if (overrides.contentId !== contentId) return errorResponse('contentId가 일치하지 않습니다', 400)
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : '잘못된 편집 데이터입니다', 400)
      }
      const htmlPath = path.join(resolvedDir, 'index.html')
      const htmlContent = await fs.readFile(htmlPath, 'utf-8')
      await atomicWriteFile(htmlPath, embedEditorOverrides(htmlContent, overrides))

      return jsonResponse({
        success: true,
        message: '콘텐츠가 업데이트되었습니다',
        contentId,
      })
    } catch (error) {
      console.error('콘텐츠 파일 업데이트 오류:', error)
      return errorResponse('콘텐츠 파일 업데이트 실패', 500)
    }
  }

  // GET /api/content/:id/export - 콘텐츠 ZIP 내보내기
  if (req.method === 'GET' && pathname.match(/^\/api\/content\/[\w-]+\/export$/)) {
    try {
      const contentId = pathname.split('/')[3]
      const path = await import('path')

      const catalog = await loadCatalog()
      const content = catalog.contents.find((c) => c.id === contentId)

      if (!content) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      // 콘텐츠 디렉토리 경로 (카탈로그의 path 문자열이 아니라 subject/gradeLevel/id로 재구성)
      const resolvedDir = resolveContentDir(path, content, rootDir)
      if (!resolvedDir) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      // 파일 읽기
      const files: Record<string, string> = {}
      const fileNames = ['index.html', 'style.css', 'script.js', 'manifest.json']
      const unsupported = (await fs.readdir(resolvedDir)).filter(name => !name.startsWith('.') && !IMPORTABLE_FILES.has(name))
      if (unsupported.length) return errorResponse(`이 ZIP 형식은 HTML/CSS/JS/manifest만 지원합니다. 별도 에셋이 있어 내보낼 수 없습니다: ${unsupported.join(', ')}`, 400)

      for (const fileName of fileNames) {
        try {
          const filePath = path.join(resolvedDir, fileName)
          files[fileName] = await fs.readFile(filePath, 'utf-8')
        } catch {
          // 파일이 없으면 건너뛰기
        }
      }

      // manifest.json 추가 (없으면 생성)
      if (!files['manifest.json']) {
        files['manifest.json'] = JSON.stringify({
          id: content.id,
          title: content.title,
          subject: content.subject,
          gradeLevel: content.gradeLevel,
          grade: content.grade,
          type: content.type,
          language: content.language,
          description: content.description,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }, null, 2)
      }

      // ZIP 생성 (Bun 내장 기능 사용)
      const zipBuffer = encodeContentZip(files)

      return new Response(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${contentId}.zip"`,
        },
      })
    } catch (error) {
      console.error('콘텐츠 내보내기 오류:', error)
      return errorResponse('콘텐츠 내보내기 실패', 500)
    }
  }

  // POST /api/content/import - 콘텐츠 ZIP 가져오기
  if (req.method === 'POST' && pathname === '/api/content/import') {
    try {
      const formData = await req.formData()
      const file = formData.get('file')

      if (!(file instanceof File)) {
        return errorResponse('파일이 필요합니다', 400)
      }

      const path = await import('path')
      const arrayBuffer = await file.arrayBuffer()
      if (arrayBuffer.byteLength > MAX_IMPORT_BYTES) {
        return errorResponse(`ZIP 파일은 ${MAX_IMPORT_BYTES / 1024 / 1024}MB 이하여야 합니다`, 413)
      }
      let files: Record<string, string>
      let manifest: Partial<ContentManifest>
      try {
        files = await decodeContentZip(new Uint8Array(arrayBuffer), async (data, maxBytes) =>
          new Uint8Array(inflateRawSync(data, { maxOutputLength: maxBytes })))
        manifest = JSON.parse(files['manifest.json'])
        if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('manifest must be an object')
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : '잘못된 ZIP 파일입니다', 400)
      }

      if (Object.keys(files).length > MAX_IMPORT_ENTRIES) {
        return errorResponse(`ZIP 항목은 ${MAX_IMPORT_ENTRIES}개 이하여야 합니다`, 400)
      }

      // manifest.json 검증
      if (!files['manifest.json']) {
        return errorResponse('manifest.json이 필요합니다', 400)
      }

      // 정적으로 서빙되는 디렉터리이므로 허용 목록 밖의 파일은 받지 않는다
      const disallowed = Object.keys(files).filter((name) => !IMPORTABLE_FILES.has(name))
      if (disallowed.length > 0) {
        return errorResponse(
          `허용되지 않은 파일이 포함되어 있습니다: ${disallowed.join(', ')} (허용: ${[...IMPORTABLE_FILES].join(', ')})`,
          400
        )
      }

      if (!manifest.id || !manifest.title || !manifest.subject || !manifest.gradeLevel || !manifest.type) {
        return errorResponse('manifest.json에 필수 필드가 누락되었습니다', 400)
      }
      if (!isContentSlug(manifest.id) || !isContentSlug(manifest.subject)) {
        return errorResponse('manifest의 id와 subject는 영문 소문자·숫자·하이픈 slug여야 합니다', 400)
      }
      if (!isGradeLevel(manifest.gradeLevel)) {
        return errorResponse('manifest의 gradeLevel은 elementary, middle, high 중 하나여야 합니다', 400)
      }

      const catalog = await loadCatalog()
      let finalId = manifest.id
      const originalId = manifest.id

      // Reserve only a fresh directory; uncatalogued factory output must also survive imports.
      let counter = 2
      while (catalog.contents.some((c) => c.id === finalId) ||
          await fs.stat(path.join(rootDir, 'public/contents', manifest.subject, manifest.gradeLevel, finalId)).then(() => true, (error) => {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
            throw error
          })) {
        finalId = `${originalId}-${counter++}`
      }

      // 콘텐츠 디렉토리 생성
      const resolvedDir = resolveContentDir(path, {
        id: finalId,
        subject: manifest.subject,
        gradeLevel: manifest.gradeLevel,
      }, rootDir)
      if (!resolvedDir) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      await fs.mkdir(path.dirname(resolvedDir), { recursive: true })
      try { await fs.mkdir(resolvedDir) }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return errorResponse('콘텐츠 경로가 이미 존재합니다. 다시 시도하세요', 409)
        throw error
      }
      try {

      // 파일 저장 (파일명은 위에서 허용 목록으로 검증됨)
      for (const [fileName, fileContent] of Object.entries(files)) {
        if (fileName === 'manifest.json') continue
        const filePath = path.join(resolvedDir, fileName)
        await fs.writeFile(filePath, fileContent, 'utf-8')
      }

      // 카탈로그에 추가
      const newContent: ContentManifest = {
        id: finalId,
        title: manifest.title,
        subject: manifest.subject,
        gradeLevel: manifest.gradeLevel,
        grade: manifest.grade || `${manifest.gradeLevel}-1`,
        type: manifest.type,
        language: manifest.language || 'ko',
        description: manifest.description || '',
        thumbnail: manifest.thumbnail || '',
        path: `contents/${manifest.subject}/${manifest.gradeLevel}/${finalId}/index.html`,
        prerequisites: manifest.prerequisites || [],
        createdAt: new Date().toISOString(),
        tags: manifest.tags || [],
      }

      await fs.writeFile(path.join(resolvedDir, 'manifest.json'), JSON.stringify(newContent, null, 2), 'utf-8')
      catalog.contents.push(newContent)
      await saveCatalog(catalog)
      } catch (error) {
        await fs.rm(resolvedDir, { recursive: true, force: true })
        throw error
      }

      return jsonResponse({
        success: true,
        contentId: finalId,
        originalId,
        message: finalId !== originalId
          ? `콘텐츠가 새 ID로 가져와졌습니다: ${finalId}`
          : '콘텐츠가 성공적으로 가져와졌습니다',
      }, 201)
    } catch (error) {
      console.error('콘텐츠 가져오기 오류:', error)
      return errorResponse('콘텐츠 가져오기 실패', 500)
    }
  }

  // DELETE /api/content/:id - 콘텐츠 삭제
  if (req.method === 'DELETE' && pathname.match(/^\/api\/content\/[\w-]+$/)) {
    try {
      const contentId = pathname.split('/').pop()

      const catalog = await loadCatalog()
      const index = catalog.contents.findIndex((c) => c.id === contentId)

      if (index === -1) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      const deletedContent = catalog.contents[index]

      // 콘텐츠 파일 삭제 (선택적)
      const deleteFiles = url.searchParams.get('deleteFiles') === 'true'
      if (deleteFiles) {
        try {
          const path = await import('path')
          // 카탈로그의 path 문자열을 신뢰하면 "/contents" 같은 값으로 콘텐츠 루트 전체가 지워질 수 있다.
          // subject/gradeLevel/id로 경로를 재구성하고 contents 루트 자신은 거부한다.
          const resolvedPath = resolveContentDir(path, deletedContent, rootDir)
          if (!resolvedPath) {
            console.error('잘못된 콘텐츠 경로로 파일 삭제를 건너뜁니다:', deletedContent.id)
          } else {
            await fs.rm(resolvedPath, { recursive: true, force: true })
          }
        } catch {
          // 파일 삭제 실패는 무시 (이미 없을 수 있음)
        }
      }

      // 카탈로그에서 제거
      catalog.contents.splice(index, 1)
      await saveCatalog(catalog)

      return jsonResponse({
        success: true,
        message: '콘텐츠가 삭제되었습니다',
        deletedId: contentId,
      })
    } catch (error) {
      console.error('콘텐츠 삭제 오류:', error)
      return errorResponse('콘텐츠 삭제 실패', 500)
    }
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}

// The same cross-process lock is used by factory publication and every CRUD mutation.
export async function handleContentRoute(
  req: Request, jsonResponse: JsonResponse, errorResponse: ErrorResponse,
  options: { rootDir?: string } = {},
): Promise<Response> {
  const rootDir = resolve(options.rootDir ?? '.')
  if (req.method === 'GET') return handleContentRouteUnlocked(req, jsonResponse, errorResponse, rootDir)
  const denial = checkWriteAccess(req)
  if (denial) return errorResponse(denial.message, denial.status)
  const lockPath = join(rootDir, 'public/contents/index.json.lock')
  let lock
  try { lock = await acquireCatalogLock(lockPath) }
  catch (error) { return errorResponse(error instanceof Error ? error.message : '카탈로그 잠금 실패', 409) }
  try { return await handleContentRouteUnlocked(req, jsonResponse, errorResponse, rootDir) }
  finally { await lock.close(); await unlink(lockPath) }
}
