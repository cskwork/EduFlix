// Vercel 서버리스 콘텐츠 생성 (정적 배포 전용 경량 경로)
//
// 로컬/터널 배포는 server/routes/generate.ts의 6단계 팩토리를 그대로 사용하고 PC 파일시스템에 저장한다.
// 이 함수는 그 경로를 쓸 수 없는 Vercel 정적 배포를 위한 것이다:
//   - 배포 아티팩트가 읽기 전용이라 public/contents/에 쓸 수 없다
//   - 요청 간 인메모리 job 상태를 공유할 수 없어 폴링 방식을 쓸 수 없다
// 따라서 단일 LLM 호출로 3개 파일을 만들어 응답 본문으로 즉시 돌려주고,
// 보관은 클라이언트(IndexedDB)가 담당한다.
import type { GenerationRequest } from '../src/types/generation'
import { generateZaiFiles } from '../agents/content-factory/pipeline/lib/zai'
import { getFactoryLlmConfig } from '../agents/content-factory/pipeline/lib/engine'
import {
  DEFAULT_CREATOR_MODE,
  DEFAULT_RENDER_MODE,
  DIFFICULTY_TO_GRADE,
} from '../agents/content-factory/pipeline/stages/common'
import { checkWriteAccess } from '../server/security'
import { validateGeneration } from '../server/validation/generation'

// 단일 LLM 호출이라 폴링 없이 한 요청 안에서 끝난다.
//
// ⚠️ 플랫폼 하드 리밋: Hobby는 300초가 천장이고 코드로 늘릴 수 없다.
//    Pro는 800초, extended beta는 1800초까지 가능하므로 플랜에 맞춰 이 값과
//    vercel.json의 functions["api/generate.ts"].maxDuration을 함께 올리면 된다.
//    로컬/터널 배포의 6단계 팩토리는 이 제약이 없다(폴링 상한 8시간).
export const maxDuration = 300

const REQUIRED_FILES = ['index.html', 'style.css', 'script.js'] as const
// 함수가 강제 종료되기 전에 LLM 오류를 정상 응답으로 돌려주기 위해 15초 여유를 둔다
const LLM_TIMEOUT_MS = (maxDuration - 15) * 1000

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 500): Response {
  return json({ success: false, error: message }, status)
}

// 학습 주제와 학년을 요청 모드에 따라 도출한다
function resolveTopic(body: GenerationRequest): { topic: string; grade: string; subject: string } {
  const mode = body.mode ?? DEFAULT_CREATOR_MODE
  if (mode === 'problem') {
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

// 프롬프트는 함수 번들에 인라인한다.
// agents/content-factory/prompts/*.md를 읽으려면 Vercel includeFiles 설정이 필요한데,
// 단일 호출 경량 경로에는 짧은 프롬프트로 충분하다.
function buildPrompt(body: GenerationRequest): string {
  const { topic, grade, subject } = resolveTopic(body)
  const renderMode = body.renderMode ?? DEFAULT_RENDER_MODE
  const isThree = renderMode === '3d' || renderMode === '3d-game'

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
    '## 메타데이터',
    'index.html의 <head>에 아래 주석을 정확히 한 줄 포함하세요:',
    '<!--META {"title":"제목","description":"한 문장 설명","type":"simulation|game|quiz|exploration|story"} META-->',
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
        type: ['game', 'quiz', 'exploration', 'simulation', 'story'].includes(type) ? type : 'simulation',
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

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 })
}

export async function POST(req: Request): Promise<Response> {
  // 이 함수는 운영자의 LLM 키를 소모하므로 쓰기 API와 동일한 인증을 요구한다
  const denial = checkWriteAccess(req)
  if (denial) return fail(denial.message, denial.status)

  let body: GenerationRequest
  try {
    body = (await req.json()) as GenerationRequest
  } catch {
    return fail('요청 본문을 JSON으로 파싱하지 못했습니다', 400)
  }

  const validationError = validateGeneration(body)
  if (validationError) return fail(validationError, 400)

  const llmConfig = getFactoryLlmConfig()
  if (llmConfig.provider !== 'zai') {
    return fail('서버리스 생성은 FACTORY_LLM_PROVIDER=zai만 지원합니다 (codex는 CLI가 필요합니다)', 503)
  }
  if (!llmConfig.apiKey) {
    return fail('ZAI_API_KEY가 설정되지 않아 콘텐츠를 생성할 수 없습니다', 503)
  }

  try {
    const { files } = await generateZaiFiles({
      prompt: buildPrompt(body),
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      apiUrl: llmConfig.apiUrl,
      requiredFiles: REQUIRED_FILES,
      timeoutMs: LLM_TIMEOUT_MS,
      label: 'serverless-generate',
    })

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
