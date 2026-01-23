// AI 콘텐츠 생성 API 엔드포인트
import type {
  GenerationRequest,
  GenerationResponse,
  ClaudeRequest,
  ClaudeResponse,
} from '../../src/types/generation'
import type { ContentManifest, Subject, GradeLevel, ContentType } from '../../src/types/content'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

// 학년을 학년 레벨로 변환
function gradeToGradeLevel(grade: string): GradeLevel {
  if (grade.startsWith('elementary')) return 'elementary'
  if (grade.startsWith('middle')) return 'middle'
  return 'high'
}

// 콘텐츠 ID 생성
function generateContentId(subject: Subject, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
  const timestamp = Date.now().toString(36)
  return `${subject}-${slug}-${timestamp}`
}

// Claude API 호출
async function callClaudeAPI(request: ClaudeRequest): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API 오류: ${response.status} - ${errorText}`)
  }

  return (await response.json()) as ClaudeResponse
}

// 시스템 프롬프트 생성
function buildSystemPrompt(subject: Subject, language: string): string {
  const subjectGuides: Record<Subject, string> = {
    math: '수학적 개념을 시각적으로 표현하고, 단계별 문제 해결 과정을 포함하세요.',
    science: '과학적 원리를 실험과 시뮬레이션으로 체험할 수 있게 하세요.',
    english: '영어 학습을 게임화하여 재미있게 배울 수 있도록 구성하세요.',
  }

  return `당신은 교육 콘텐츠 생성 전문가입니다.
학생들이 재미있게 학습할 수 있는 인터랙티브 HTML 콘텐츠를 생성합니다.

콘텐츠 언어: ${language === 'ko' ? '한국어' : '영어'}
과목 가이드: ${subjectGuides[subject]}

생성 규칙:
1. 단일 HTML 파일로 완성된 콘텐츠를 생성
2. CSS는 <style> 태그에, JS는 <script> 태그에 포함
3. 외부 라이브러리 사용 금지 (Vanilla HTML/CSS/JS만 사용)
4. 다크 테마 배경 (#1a1a2e), 밝은 텍스트
5. 게이미피케이션 요소 포함 (점수, 진행률, 피드백)
6. 모바일 반응형 디자인
7. 접근성 고려 (키보드 네비게이션, 대비)

응답 형식 (JSON):
{
  "title": "콘텐츠 제목",
  "description": "간단한 설명",
  "type": "game|quiz|exploration|simulation|story",
  "html": "완전한 HTML 코드"
}`
}

// 사용자 프롬프트 생성
function buildUserPrompt(request: GenerationRequest): string {
  const gradeLabels: Record<string, string> = {
    'elementary-1': '초등 1학년',
    'elementary-2': '초등 2학년',
    'elementary-3': '초등 3학년',
    'elementary-4': '초등 4학년',
    'elementary-5': '초등 5학년',
    'elementary-6': '초등 6학년',
    'middle-1': '중등 1학년',
    'middle-2': '중등 2학년',
    'middle-3': '중등 3학년',
    'high-1': '고등 1학년',
    'high-2': '고등 2학년',
    'high-3': '고등 3학년',
  }

  const subjectLabels: Record<Subject, string> = {
    math: '수학',
    science: '과학',
    english: '영어',
  }

  return `다음 조건에 맞는 교육 콘텐츠를 생성해주세요:

- 과목: ${subjectLabels[request.subject]}
- 학년: ${gradeLabels[request.grade] || request.grade}
- 관심사/주제: ${request.interests.join(', ')}
${request.contentType ? `- 콘텐츠 유형: ${request.contentType}` : ''}
${request.additionalContext ? `- 추가 요청: ${request.additionalContext}` : ''}

JSON 형식으로 응답해주세요.`
}

// 생성 API 핸들러
export async function handleGenerateRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  // POST /api/generate - 콘텐츠 생성
  if (req.method === 'POST' && pathname === '/api/generate') {
    try {
      const body = (await req.json()) as GenerationRequest

      // 입력 검증
      if (!body.interests || !body.subject || !body.grade || !body.language) {
        return errorResponse('필수 필드가 누락되었습니다: interests, subject, grade, language', 400)
      }

      // interests 배열 검증
      if (
        !Array.isArray(body.interests) ||
        body.interests.length > 10 ||
        body.interests.some((i) => typeof i !== 'string' || i.length > 100)
      ) {
        return errorResponse('interests는 최대 10개의 문자열 배열이어야 합니다', 400)
      }

      // subject/grade 타입 검증
      const validSubjects: Subject[] = ['math', 'science', 'english']
      const validGrades = [
        'elementary-1',
        'elementary-2',
        'elementary-3',
        'elementary-4',
        'elementary-5',
        'elementary-6',
        'middle-1',
        'middle-2',
        'middle-3',
        'high-1',
        'high-2',
        'high-3',
      ]
      if (!validSubjects.includes(body.subject)) {
        return errorResponse('유효하지 않은 과목입니다', 400)
      }
      if (!validGrades.includes(body.grade)) {
        return errorResponse('유효하지 않은 학년입니다', 400)
      }

      // Claude API 요청 구성
      const claudeRequest: ClaudeRequest = {
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        system: buildSystemPrompt(body.subject, body.language),
        messages: [
          {
            role: 'user',
            content: buildUserPrompt(body),
          },
        ],
      }

      // Claude API 호출
      const claudeResponse = await callClaudeAPI(claudeRequest)

      // 응답 파싱
      const firstBlock = claudeResponse.content[0]
      const responseText = firstBlock.type === 'text' && firstBlock.text ? firstBlock.text : ''

      if (!responseText) {
        throw new Error('Claude 응답이 비어 있습니다')
      }

      // JSON 추출 (마크다운 코드 블록 처리)
      let jsonStr = responseText
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim()
      }

      let generatedContent: {
        title: string
        description: string
        type: ContentType
        html: string
      }
      try {
        const parsed: unknown = JSON.parse(jsonStr)
        // 타입 가드: 객체인지 확인 (null, 배열, 원시값 제외)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error(
            `Claude 응답이 유효한 객체가 아닙니다. 받은 타입: ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}`
          )
        }
        generatedContent = parsed as typeof generatedContent
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          throw new Error(`Claude 응답 JSON 파싱 실패: ${jsonStr.substring(0, 200)}...`)
        }
        throw parseError
      }

      // Claude 응답 필드 검증
      if (
        typeof generatedContent.title !== 'string' ||
        !generatedContent.title.trim()
      ) {
        throw new Error('Claude 응답에 유효한 title이 없습니다')
      }
      if (
        typeof generatedContent.description !== 'string' ||
        !generatedContent.description.trim()
      ) {
        throw new Error('Claude 응답에 유효한 description이 없습니다')
      }
      if (typeof generatedContent.html !== 'string' || !generatedContent.html.trim()) {
        throw new Error('Claude 응답에 유효한 html이 없습니다')
      }
      const validTypes: ContentType[] = ['game', 'quiz', 'exploration', 'simulation', 'story']
      if (!validTypes.includes(generatedContent.type)) {
        throw new Error(
          `Claude 응답의 type이 유효하지 않습니다: ${generatedContent.type}. 허용값: ${validTypes.join(', ')}`
        )
      }

      // 콘텐츠 ID 생성
      const contentId = generateContentId(body.subject, generatedContent.title)
      const gradeLevel = gradeToGradeLevel(body.grade)

      // 콘텐츠 파일 저장
      const contentDir = `contents/${body.subject}/${gradeLevel}/${contentId}`
      const fs = await import('fs/promises')
      const pathModule = await import('path')

      // Path traversal 방지
      const resolvedDir = pathModule.resolve(contentDir)
      const contentsBase = pathModule.resolve('contents')
      if (!resolvedDir.startsWith(contentsBase)) {
        throw new Error('잘못된 콘텐츠 경로가 생성되었습니다')
      }

      await fs.mkdir(contentDir, { recursive: true })

      // HTML 파일 저장
      await fs.writeFile(`${contentDir}/index.html`, generatedContent.html, 'utf-8')

      // 매니페스트 생성 및 저장
      const manifest: ContentManifest = {
        id: contentId,
        title: generatedContent.title,
        subject: body.subject,
        gradeLevel,
        grade: body.grade,
        type: generatedContent.type,
        language: body.language,
        description: generatedContent.description,
        thumbnail: '',
        path: `${contentDir}/index.html`,
        tags: body.interests,
        createdAt: new Date().toISOString(),
      }

      await fs.writeFile(`${contentDir}/manifest.json`, JSON.stringify(manifest, null, 2), 'utf-8')

      // 카탈로그 업데이트
      const catalogPath = 'contents/index.json'
      let catalog = { version: '1.0.0', lastUpdated: '', contents: [] as ContentManifest[] }

      try {
        const catalogData = await fs.readFile(catalogPath, 'utf-8')
        catalog = JSON.parse(catalogData)
      } catch {
        // 카탈로그가 없으면 새로 생성
      }

      // 중복 ID 확인
      if (catalog.contents.some((c) => c.id === contentId)) {
        throw new Error('생성된 콘텐츠 ID가 이미 존재합니다')
      }

      catalog.contents.push(manifest)
      catalog.lastUpdated = new Date().toISOString()
      await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8')

      // 응답
      const response: GenerationResponse = {
        success: true,
        contentId,
        manifest: {
          id: contentId,
          title: generatedContent.title,
          description: generatedContent.description,
          type: generatedContent.type,
        },
      }

      return jsonResponse(response, 201)
    } catch (error) {
      console.error('생성 오류:', error)
      const message = error instanceof Error ? error.message : '콘텐츠 생성 실패'
      return errorResponse(message, 500)
    }
  }

  // GET /api/generate/status/:id - 생성 상태 조회 (향후 비동기 생성용)
  if (req.method === 'GET' && pathname.startsWith('/api/generate/status/')) {
    const id = pathname.split('/').pop()
    return jsonResponse({
      id,
      status: 'completed',
      message: '동기 생성 모드에서는 상태 조회가 필요하지 않습니다',
    })
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}
