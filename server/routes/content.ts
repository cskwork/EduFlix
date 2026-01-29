// 콘텐츠 CRUD API 엔드포인트
import type { ContentManifest, ContentCatalog } from '../../src/types/content'
import type { SaveContentRequest, EditableText, EditableStyle } from '../../src/types/editor'

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

      // 콘텐츠 디렉토리 경로
      const contentPath = content.path.startsWith('/') ? content.path.slice(1) : content.path
      const contentDir = path.join('public', path.dirname(contentPath))
      const resolvedDir = path.resolve(contentDir)
      const contentsDir = path.resolve('public/contents')

      // Path traversal 방지
      if (!resolvedDir.startsWith(contentsDir)) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      // style.css 업데이트
      if (body.styles && body.styles.length > 0) {
        const cssPath = path.join(resolvedDir, 'style.css')
        try {
          let cssContent = await fs.readFile(cssPath, 'utf-8')
          cssContent = updateCssVariables(cssContent, body.styles)
          await fs.writeFile(cssPath, cssContent, 'utf-8')
        } catch (e) {
          console.error('CSS 업데이트 오류:', e)
        }
      }

      // script.js 업데이트 (텍스트, 퀴즈)
      if ((body.texts && body.texts.length > 0) || (body.quizzes && body.quizzes.length > 0)) {
        // 텍스트와 퀴즈는 현재 실시간 DOM 업데이트만 지원
        // 영구 저장은 추후 contentData 패턴 분석 필요
        console.log('텍스트/퀴즈 변경사항 기록:', {
          texts: body.texts?.length || 0,
          quizzes: body.quizzes?.length || 0
        })
      }

      // index.html 업데이트 (텍스트 내용)
      if (body.texts && body.texts.length > 0) {
        const htmlPath = path.join(resolvedDir, 'index.html')
        try {
          let htmlContent = await fs.readFile(htmlPath, 'utf-8')
          htmlContent = updateHtmlTexts(htmlContent, body.texts)
          await fs.writeFile(htmlPath, htmlContent, 'utf-8')
        } catch (e) {
          console.error('HTML 업데이트 오류:', e)
        }
      }

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

      // 콘텐츠 디렉토리 경로
      const contentPath = content.path.startsWith('/') ? content.path.slice(1) : content.path
      const contentDir = path.join('public', path.dirname(contentPath))
      const resolvedDir = path.resolve(contentDir)
      const contentsDir = path.resolve('public/contents')

      // Path traversal 방지
      if (!resolvedDir.startsWith(contentsDir)) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      // 파일 읽기
      const files: Record<string, string> = {}
      const fileNames = ['index.html', 'style.css', 'script.js', 'manifest.json']

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
          description: content.description,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }, null, 2)
      }

      // ZIP 생성 (Bun 내장 기능 사용)
      const zipBuffer = await createZipBuffer(files, contentId)

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
      const file = formData.get('file') as File

      if (!file) {
        return errorResponse('파일이 필요합니다', 400)
      }

      const path = await import('path')
      const arrayBuffer = await file.arrayBuffer()
      const files = await extractZipBuffer(Buffer.from(arrayBuffer))

      // manifest.json 검증
      if (!files['manifest.json']) {
        return errorResponse('manifest.json이 필요합니다', 400)
      }

      const manifest = JSON.parse(files['manifest.json'])
      if (!manifest.id || !manifest.title || !manifest.subject || !manifest.gradeLevel || !manifest.type) {
        return errorResponse('manifest.json에 필수 필드가 누락되었습니다', 400)
      }

      const catalog = await loadCatalog()
      let finalId = manifest.id
      const originalId = manifest.id

      // ID 충돌 처리 - 새 ID 자동 생성
      if (catalog.contents.some((c) => c.id === manifest.id)) {
        let counter = 2
        while (catalog.contents.some((c) => c.id === `${manifest.id}-${counter}`)) {
          counter++
        }
        finalId = `${manifest.id}-${counter}`
      }

      // 콘텐츠 디렉토리 생성
      const contentDir = path.join('public/contents', manifest.subject, manifest.gradeLevel, finalId)
      const resolvedDir = path.resolve(contentDir)
      const contentsDir = path.resolve('public/contents')

      // Path traversal 방지
      if (!resolvedDir.startsWith(contentsDir)) {
        return errorResponse('잘못된 콘텐츠 경로입니다', 400)
      }

      await fs.mkdir(resolvedDir, { recursive: true })

      // 파일 저장
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

      catalog.contents.push(newContent)
      await saveCatalog(catalog)

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

// CSS 변수 업데이트 헬퍼
function updateCssVariables(css: string, styles: EditableStyle[]): string {
  let updatedCss = css

  for (const style of styles) {
    // CSS 변수 패턴: --variable-name: value;
    const regex = new RegExp(`(${style.variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}):\\s*[^;]+;`, 'g')
    updatedCss = updatedCss.replace(regex, `$1: ${style.value};`)
  }

  return updatedCss
}

// HTML 텍스트 업데이트 헬퍼
function updateHtmlTexts(html: string, texts: EditableText[]): string {
  let updatedHtml = html

  for (const text of texts) {
    // ID 기반 선택자인 경우
    if (text.path.startsWith('#')) {
      const id = text.path.slice(1)
      // id="xxx">텍스트</tag> 패턴 매칭
      const regex = new RegExp(`(id="${id}"[^>]*>)[^<]*(<)`, 'g')
      updatedHtml = updatedHtml.replace(regex, `$1${escapeHtml(text.value)}$2`)
    }
  }

  return updatedHtml
}

// HTML 이스케이프 헬퍼
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ZIP 버퍼 생성 헬퍼 (간단한 구현)
async function createZipBuffer(files: Record<string, string>, _folderName: string): Promise<Buffer> {
  // Bun의 내장 zip API 사용
  const entries = Object.entries(files).map(([name, content]) => ({
    path: name,
    data: new TextEncoder().encode(content)
  }))

  // 간단한 ZIP 구조 생성 (비압축)
  const chunks: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const localHeader = createLocalFileHeader(entry.path, entry.data)
    const centralHeader = createCentralDirectoryHeader(entry.path, entry.data, offset)

    chunks.push(localHeader)
    chunks.push(entry.data)

    centralDirectory.push(centralHeader)
    offset += localHeader.length + entry.data.length
  }

  const cdOffset = offset
  for (const cd of centralDirectory) {
    chunks.push(cd)
    offset += cd.length
  }

  const endRecord = createEndOfCentralDirectory(entries.length, offset - cdOffset, cdOffset)
  chunks.push(endRecord)

  // 모든 청크 병합
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let pos = 0
  for (const chunk of chunks) {
    result.set(chunk, pos)
    pos += chunk.length
  }

  return Buffer.from(result)
}

// ZIP 로컬 파일 헤더 생성
function createLocalFileHeader(filename: string, data: Uint8Array): Uint8Array {
  const encoder = new TextEncoder()
  const filenameBytes = encoder.encode(filename)
  const header = new Uint8Array(30 + filenameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, 0x04034b50, true) // 시그니처
  view.setUint16(4, 20, true) // 버전
  view.setUint16(6, 0, true) // 플래그
  view.setUint16(8, 0, true) // 압축 방식 (저장)
  view.setUint16(10, 0, true) // 수정 시간
  view.setUint16(12, 0, true) // 수정 날짜
  view.setUint32(14, crc32(data), true) // CRC-32
  view.setUint32(18, data.length, true) // 압축 크기
  view.setUint32(22, data.length, true) // 원본 크기
  view.setUint16(26, filenameBytes.length, true) // 파일명 길이
  view.setUint16(28, 0, true) // 추가 필드 길이

  header.set(filenameBytes, 30)
  return header
}

// ZIP 중앙 디렉토리 헤더 생성
function createCentralDirectoryHeader(filename: string, data: Uint8Array, offset: number): Uint8Array {
  const encoder = new TextEncoder()
  const filenameBytes = encoder.encode(filename)
  const header = new Uint8Array(46 + filenameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, 0x02014b50, true) // 시그니처
  view.setUint16(4, 20, true) // 생성 버전
  view.setUint16(6, 20, true) // 필요 버전
  view.setUint16(8, 0, true) // 플래그
  view.setUint16(10, 0, true) // 압축 방식
  view.setUint16(12, 0, true) // 수정 시간
  view.setUint16(14, 0, true) // 수정 날짜
  view.setUint32(16, crc32(data), true) // CRC-32
  view.setUint32(20, data.length, true) // 압축 크기
  view.setUint32(24, data.length, true) // 원본 크기
  view.setUint16(28, filenameBytes.length, true) // 파일명 길이
  view.setUint16(30, 0, true) // 추가 필드 길이
  view.setUint16(32, 0, true) // 코멘트 길이
  view.setUint16(34, 0, true) // 디스크 시작 번호
  view.setUint16(36, 0, true) // 내부 속성
  view.setUint32(38, 0, true) // 외부 속성
  view.setUint32(42, offset, true) // 로컬 헤더 오프셋

  header.set(filenameBytes, 46)
  return header
}

// ZIP 끝 레코드 생성
function createEndOfCentralDirectory(entryCount: number, cdSize: number, cdOffset: number): Uint8Array {
  const record = new Uint8Array(22)
  const view = new DataView(record.buffer)

  view.setUint32(0, 0x06054b50, true) // 시그니처
  view.setUint16(4, 0, true) // 디스크 번호
  view.setUint16(6, 0, true) // CD 시작 디스크
  view.setUint16(8, entryCount, true) // 이 디스크의 항목 수
  view.setUint16(10, entryCount, true) // 전체 항목 수
  view.setUint32(12, cdSize, true) // CD 크기
  view.setUint32(16, cdOffset, true) // CD 오프셋
  view.setUint16(20, 0, true) // 코멘트 길이

  return record
}

// CRC-32 계산
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  const table = getCrc32Table()

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  }

  return (crc ^ 0xffffffff) >>> 0
}

// CRC-32 테이블 생성
let crc32Table: number[] | null = null
function getCrc32Table(): number[] {
  if (crc32Table) return crc32Table

  crc32Table = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crc32Table[i] = c >>> 0
  }

  return crc32Table
}

// ZIP 버퍼 추출 헬퍼
async function extractZipBuffer(buffer: Buffer): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let offset = 0

  while (offset < buffer.length - 4) {
    const signature = view.getUint32(offset, true)

    if (signature === 0x04034b50) {
      // 로컬 파일 헤더
      const filenameLength = view.getUint16(offset + 26, true)
      const extraLength = view.getUint16(offset + 28, true)
      const compressedSize = view.getUint32(offset + 18, true)

      const filenameStart = offset + 30
      const filenameEnd = filenameStart + filenameLength
      const filename = new TextDecoder().decode(buffer.subarray(filenameStart, filenameEnd))

      const dataStart = filenameEnd + extraLength
      const dataEnd = dataStart + compressedSize
      const data = buffer.subarray(dataStart, dataEnd)

      // 폴더가 아닌 경우만 추가
      if (!filename.endsWith('/')) {
        // 경로에서 파일명만 추출
        const basename = filename.split('/').pop() || filename
        files[basename] = new TextDecoder().decode(data)
      }

      offset = dataEnd
    } else if (signature === 0x02014b50) {
      // 중앙 디렉토리 - 파싱 종료
      break
    } else {
      offset++
    }
  }

  return files
}
