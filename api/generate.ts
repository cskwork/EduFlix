// Vercel 서버리스 콘텐츠 생성 (정적 배포 전용 경량 경로)
//
// 로컬/터널 배포는 server/routes/generate.ts의 6단계 팩토리를 그대로 사용하고 PC 파일시스템에 저장한다.
// 이 함수는 그 경로를 쓸 수 없는 Vercel 정적 배포를 위한 것이다:
//   - 배포 아티팩트가 읽기 전용이라 public/contents/에 쓸 수 없다
//   - 요청 간 인메모리 job 상태를 공유할 수 없어 폴링 방식을 쓸 수 없다
// 따라서 단일 LLM 호출로 3개 파일을 만들어 응답 본문으로 즉시 돌려주고,
// 보관은 클라이언트(IndexedDB)가 담당한다.
//
// ⚠️ 이 파일은 반드시 자기완결적이어야 한다.
// Vercel은 api/*.ts를 번들하지 않고 트랜스파일만 하므로, 프로젝트 내 상대 import는
// 런타임에 ERR_MODULE_NOT_FOUND로 실패한다(node_modules 패키지 import는 가능).
// 아래 로직은 다음 원본과 의도적으로 중복되어 있으니 규칙 변경 시 함께 고칠 것:
//   - 검증 규칙:   server/validation/generation.ts
//   - 인증 규칙:   server/security.ts (checkWriteAccess)
//   - Z.ai 호출:   agents/content-factory/pipeline/lib/zai.ts

// ⚠️ 플랫폼 하드 리밋: Hobby는 300초가 천장이고 코드로 늘릴 수 없다.
//    Pro는 800초, extended beta는 1800초까지 가능하므로 플랜에 맞춰 이 값과
//    vercel.json의 functions["api/generate.ts"].maxDuration을 함께 올리면 된다.
//    로컬/터널 배포의 6단계 팩토리는 이 제약이 없다(폴링 상한 8시간).
export const maxDuration = 300

const REQUIRED_FILES = ['index.html', 'style.css', 'script.js'] as const
// 함수가 강제 종료되기 전에 오류를 정상 응답으로 돌려주기 위해 15초 여유를 둔다
const LLM_TIMEOUT_MS = (maxDuration - 15) * 1000
const DEFAULT_ZAI_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions'
const MAX_ATTEMPTS = 2
const PROBLEM_MAX_LENGTH = 5000

const SUBJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RENDER_MODES = ['3d', '3d-game', 'canvas-game', 'svg', 'dom'] as const
const DEFAULT_RENDER_MODE = '3d'
const CONTENT_TYPES = ['game', 'quiz', 'exploration', 'simulation', 'story']
const DIFFICULTY_TO_GRADE: Record<string, string> = {
  easy: 'elementary-5',
  medium: 'middle-2',
  hard: 'high-2',
}
const VALID_GRADES = new Set([
  'elementary-1', 'elementary-2', 'elementary-3', 'elementary-4', 'elementary-5', 'elementary-6',
  'middle-1', 'middle-2', 'middle-3', 'high-1', 'high-2', 'high-3',
])

interface GenerateBody {
  mode?: 'interest' | 'problem'
  interests?: string[]
  subject?: string
  grade?: string
  language?: string
  renderMode?: string
  additionalContext?: string
  problem?: string
  difficulty?: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 500): Response {
  return json({ success: false, error: message }, status)
}

// --- 인증 (원본: server/security.ts) ---------------------------------------

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function checkWriteAccess(req: Request): { status: number; message: string } | undefined {
  const adminToken = process.env.ADMIN_TOKEN?.trim()
  if (!adminToken) {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 503,
        message: 'ADMIN_TOKEN이 설정되지 않아 생성 API가 비활성화되어 있습니다.',
      }
    }
    return undefined
  }
  const header = req.headers.get('x-admin-token')
  const authorization = req.headers.get('authorization')
  const provided = header ||
    (authorization?.toLowerCase().startsWith('bearer ') ? authorization.slice(7) : undefined)
  if (!provided || !timingSafeEqual(provided, adminToken)) {
    return { status: 401, message: '관리자 토큰이 필요합니다 (X-Admin-Token 헤더).' }
  }
  return undefined
}

// --- 입력 검증 (원본: server/validation/generation.ts) -----------------------

function validateGeneration(body: GenerateBody): string | undefined {
  if (!body.language) return '필수 필드가 누락되었습니다: language'

  const mode = body.mode ?? 'interest'
  if (mode !== 'interest' && mode !== 'problem') return 'mode는 interest 또는 problem이어야 합니다'

  if (body.renderMode !== undefined && !(RENDER_MODES as readonly string[]).includes(body.renderMode)) {
    return `renderMode는 ${RENDER_MODES.join(', ')} 중 하나여야 합니다`
  }

  if (mode === 'interest') {
    if (!body.interests || !body.subject || !body.grade) {
      return 'interest 모드에는 interests, subject, grade가 필요합니다'
    }
    if (!Array.isArray(body.interests) || body.interests.length === 0 ||
        body.interests.length > 10 ||
        body.interests.some((item) => typeof item !== 'string' || item.length > 100)) {
      return 'interests는 최소 1개, 최대 10개의 문자열 배열이어야 합니다'
    }
    if (!SUBJECT_SLUG_PATTERN.test(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다 (예: math, coding, toeic)'
    }
    if (!VALID_GRADES.has(body.grade)) return '유효하지 않은 학년입니다'
  } else {
    if (!body.problem || typeof body.problem !== 'string' ||
        body.problem.trim().length < 5 || body.problem.length > PROBLEM_MAX_LENGTH) {
      return `problem은 5자 이상 ${PROBLEM_MAX_LENGTH}자 이하의 문자열이어야 합니다`
    }
    if (!body.difficulty || !(body.difficulty in DIFFICULTY_TO_GRADE)) {
      return `difficulty는 ${Object.keys(DIFFICULTY_TO_GRADE).join(', ')} 중 하나여야 합니다`
    }
    if (body.subject !== undefined && !SUBJECT_SLUG_PATTERN.test(body.subject)) {
      return 'subject는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다'
    }
  }
  return undefined
}

// --- Z.ai 호출 (원본: agents/content-factory/pipeline/lib/zai.ts) ------------

function consumeSseLine(line: string): { content: string; done: boolean } {
  if (!line.startsWith('data:')) return { content: '', done: false }
  const data = line.slice(5).trim()
  if (!data) return { content: '', done: false }
  if (data === '[DONE]') return { content: '', done: true }
  let event: unknown
  try { event = JSON.parse(data) } catch { return { content: '', done: false } }
  const choices = (event as { choices?: unknown }).choices
  const choice = Array.isArray(choices) ? choices[0] : undefined
  if (!choice || typeof choice !== 'object') return { content: '', done: false }
  const delta = (choice as { delta?: unknown }).delta
  const value = delta && typeof delta === 'object'
    ? (delta as { content?: unknown }).content : undefined
  return {
    content: typeof value === 'string' ? value : '',
    done: (choice as { finish_reason?: unknown }).finish_reason === 'stop',
  }
}

async function collectSseContent(response: Response): Promise<string> {
  if (!response.body) throw new Error('Z.ai SSE 응답 body가 없습니다.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  const consumeBufferedLines = async (atEof = false): Promise<boolean> => {
    const lines = buffer.split(/\r?\n/)
    buffer = atEof ? '' : lines.pop() ?? ''
    for (const line of lines) {
      const event = consumeSseLine(line)
      content += event.content
      if (event.done) {
        await reader.cancel()
        return true
      }
    }
    return false
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    if (await consumeBufferedLines()) return content
  }
  buffer += decoder.decode()
  await consumeBufferedLines(true)
  return content
}

// LLM이 마커 형식으로 돌려준 응답에서 파일별 본문을 뽑는다
function parseBuildMarkers(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const allowed = new Set<string>(REQUIRED_FILES)
  const marker = /===FILE:\s*([^=\r\n]+?)\s*===([\s\S]*?)===END FILE===/g
  for (const match of text.matchAll(marker)) {
    const name = match[1].trim()
    if (!allowed.has(name)) throw new Error(`허용되지 않은 빌드 파일 marker입니다: ${name}`)
    if (name in result) throw new Error(`중복 빌드 파일 marker입니다: ${name}`)
    const content = match[2].replace(/^\r?\n/, '').replace(/\r?\n$/, '')
    if (!content.trim()) throw new Error(`빌드 파일이 비어 있습니다: ${name}`)
    result[name] = content
  }
  const missing = REQUIRED_FILES.filter((name) => !(name in result))
  if (missing.length) throw new Error(`빌드 파일 marker가 누락되었습니다: ${missing.join(', ')}`)
  return result
}

async function requestOnce(prompt: string, deadline: number): Promise<string> {
  const controller = new AbortController()
  const remaining = Math.max(deadline - Date.now(), 1000)
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, remaining)
  try {
    const response = await fetch(process.env.ZAI_API_URL?.trim() || DEFAULT_ZAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ZAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ZAI_MODEL?.trim() || 'glm-5.2',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`)
    }
    const content = await collectSseContent(response)
    if (!content.trim()) throw new Error('Z.ai 응답이 비어 있습니다.')
    return content
  } catch (error) {
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error(`${Math.round(remaining / 1000)}초 시간 제한 초과`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

// 실패 원인을 되먹여 재시도한다. 남은 시간이 없으면 더 시도하지 않는다.
async function generateFiles(prompt: string): Promise<Record<string, string>> {
  const deadline = Date.now() + LLM_TIMEOUT_MS
  let lastError = '알 수 없는 오류'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (Date.now() >= deadline - 5000) break
    const attemptPrompt = attempt === 1 ? prompt :
      `${prompt}\n\n[재시도 지시] 직전 출력이 다음 검증에 실패했습니다. ` +
      `아래 오류를 해결한 완전한 출력을 처음부터 다시 생성하세요.\n${lastError}`
    try {
      return parseBuildMarkers(await requestOnce(attemptPrompt, deadline))
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  throw new Error(`콘텐츠 생성 실패: ${lastError}`)
}

// --- 프롬프트 ---------------------------------------------------------------

function resolveTopic(body: GenerateBody): { topic: string; grade: string; subject: string } {
  if ((body.mode ?? 'interest') === 'problem') {
    return {
      topic: body.problem!,
      grade: DIFFICULTY_TO_GRADE[body.difficulty!],
      subject: body.subject ?? 'general',
    }
  }
  return {
    topic: body.interests!.join(', '),
    grade: body.grade!,
    subject: body.subject!,
  }
}

function buildPrompt(body: GenerateBody): string {
  const { topic, grade, subject } = resolveTopic(body)
  const renderMode = body.renderMode ?? DEFAULT_RENDER_MODE
  const isThree = renderMode === '3d' || renderMode === '3d-game'
  const markers = REQUIRED_FILES
    .map((name) => `===FILE: ${name}===\n<${name} 본문>\n===END FILE===`).join('\n')

  return [
    '당신은 한국 초·중·고 학생을 위한 인터랙티브 교육 콘텐츠를 만드는 개발자입니다.',
    '',
    `학습 주제: ${topic}`,
    `과목: ${subject}`,
    `대상 학년: ${grade}`,
    `제작 방식(renderMode): ${renderMode}`,
    `언어: ${body.language}`,
    body.additionalContext ? `추가 요구사항: ${body.additionalContext}` : '',
    '',
    '## 요구사항',
    '1. hook(질문) → story(맥락) → core(직접 조작) → quiz(확인) → wrap(정리) 흐름을 갖출 것',
    '2. 학생이 값을 바꾸면 결과가 즉시 반응하는 상호작용이 반드시 있을 것',
    '3. 모바일 우선: 폰트는 clamp(), 터치 타겟은 최소 44px',
    '4. index.html은 <link rel="stylesheet" href="style.css">와 <script src="script.js"></script>를 포함할 것',
    isThree
      ? '5. Three.js는 CDN(v0.128.0 three.min.js, OrbitControls.js)만 사용할 것'
      : '5. 외부 스크립트/CDN을 사용하지 말 것 (순수 HTML/CSS/JS)',
    '6. 모든 텍스트는 한국어로 작성할 것',
    '',
    '## 분량 제한 (중요)',
    // 실측: 분량 제한이 없으면 출력 50KB에 274초가 걸려 300초 한도에 근접한다.
    // 스트리밍 토큰 수가 곧 소요 시간이므로 분량을 직접 제한해 타임아웃을 예방한다.
    'style.css는 250줄 이내, script.js는 250줄 이내로 간결하게 작성하세요.',
    '장식용 CSS와 중복 스타일은 생략하고, 학습에 필요한 최소한의 코드만 쓰세요.',
    '',
    '## 메타데이터',
    'index.html의 <head>에 아래 주석을 정확히 한 줄 포함하세요:',
    '<!--META {"title":"제목","description":"한 문장 설명","type":"simulation|game|quiz|exploration|story"} META-->',
    '',
    `파일을 직접 쓸 수 없습니다. 반드시 아래 marker 형식으로 정확히 ${REQUIRED_FILES.length}개 파일을 반환하세요.`,
    markers,
  ].filter(Boolean).join('\n')
}

// index.html에 심어둔 META 주석에서 제목·설명·타입을 뽑는다
function extractMetadata(html: string, fallbackTitle: string) {
  const match = html.match(/<!--META\s*(\{[\s\S]*?\})\s*META-->/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown>
      const type = typeof parsed.type === 'string' ? parsed.type : 'simulation'
      return {
        title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : fallbackTitle,
        description: typeof parsed.description === 'string' ? parsed.description : '',
        type: CONTENT_TYPES.includes(type) ? type : 'simulation',
      }
    } catch {
      // META 파싱 실패는 폴백으로 처리
    }
  }
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  return {
    title: heading?.[1].replace(/<[^>]*>/g, '').trim() || fallbackTitle,
    description: '',
    type: 'simulation',
  }
}

// --- 핸들러 -----------------------------------------------------------------

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 })
}

export async function POST(req: Request): Promise<Response> {
  // 이 함수는 운영자의 LLM 키를 소모하므로 쓰기 API와 동일한 인증을 요구한다
  const denial = checkWriteAccess(req)
  if (denial) return fail(denial.message, denial.status)

  let body: GenerateBody
  try {
    body = (await req.json()) as GenerateBody
  } catch {
    return fail('요청 본문을 JSON으로 파싱하지 못했습니다', 400)
  }

  const validationError = validateGeneration(body)
  if (validationError) return fail(validationError, 400)

  if (!process.env.ZAI_API_KEY?.trim()) {
    return fail('ZAI_API_KEY가 설정되지 않아 콘텐츠를 생성할 수 없습니다', 503)
  }

  try {
    const files = await generateFiles(buildPrompt(body))
    const { topic } = resolveTopic(body)
    const metadata = extractMetadata(files['index.html'], topic)

    return json({
      success: true,
      storage: 'client',
      content: {
        ...metadata,
        renderMode: body.renderMode ?? DEFAULT_RENDER_MODE,
        html: files['index.html'],
        css: files['style.css'],
        js: files['script.js'],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '콘텐츠 생성에 실패했습니다'
    return fail(message, 502)
  }
}
