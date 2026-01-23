// 콘텐츠 CRUD API 엔드포인트
import type { ContentManifest, ContentCatalog } from '../../src/types/content'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

// 콘텐츠 CRUD API 핸들러
export async function handleContentRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname
  const fs = await import('fs/promises')

  const CATALOG_PATH = 'public/contents/index.json'

  // 카탈로그 로드 헬퍼
  async function loadCatalog(): Promise<ContentCatalog> {
    try {
      const data = await fs.readFile(CATALOG_PATH, 'utf-8')
      return JSON.parse(data)
    } catch {
      return { version: '1.0.0', lastUpdated: new Date().toISOString(), contents: [] }
    }
  }

  // 카탈로그 저장 헬퍼
  async function saveCatalog(catalog: ContentCatalog): Promise<void> {
    catalog.lastUpdated = new Date().toISOString()
    await fs.writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8')
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

      // 필수 필드 검증
      if (!body.id || !body.title || !body.subject || !body.gradeLevel || !body.type) {
        return errorResponse('필수 필드가 누락되었습니다: id, title, subject, gradeLevel, type', 400)
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
        path: body.path || `contents/${body.subject}/${body.gradeLevel}/${body.id}/index.html`,
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

      const catalog = await loadCatalog()
      const index = catalog.contents.findIndex((c) => c.id === contentId)

      if (index === -1) {
        return errorResponse('콘텐츠를 찾을 수 없습니다', 404)
      }

      // 업데이트 가능한 필드만 수정
      const updatedContent: ContentManifest = {
        ...catalog.contents[index],
        ...body,
        id: contentId!, // ID는 변경 불가
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
      if (deleteFiles && deletedContent.path) {
        try {
          const path = await import('path')
          const contentDir = 'public' + deletedContent.path.replace('/index.html', '')
          const resolvedPath = path.resolve(contentDir)
          const contentsDir = path.resolve('public/contents')

          // Path traversal 방지: contents 디렉토리 내부인지 확인
          if (!resolvedPath.startsWith(contentsDir)) {
            console.error('잘못된 콘텐츠 경로:', resolvedPath)
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
