import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const DEFAULT_ZAI_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions'
export const DEFAULT_ZAI_TIMEOUT_MS = 10 * 60 * 1000

export interface ZaiRequestOptions {
  prompt: string
  label?: string
  timeoutMs?: number
  apiKey: string
  model?: string
  apiUrl?: string
  fetchFn?: typeof fetch
}

export interface ZaiTextOptions extends ZaiRequestOptions {
  outFile: string
  schemaFile?: string
  validateOutput?: (text: string) => string | undefined
}

export interface ZaiFilesOptions extends ZaiRequestOptions {
  requiredFiles: readonly string[]
  stagingDir: string
  responseFile: string
}

function normalizeJson(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('Z.ai 응답에서 JSON 객체를 찾지 못했습니다.')
  const parsed = JSON.parse(fenced.slice(start, end + 1))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Z.ai 응답은 JSON 객체여야 합니다.')
  }
  return `${JSON.stringify(parsed)}\n`
}

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

function validateRequiredFiles(requiredFiles: readonly string[]): void {
  if (!requiredFiles.length) throw new Error('필수 빌드 파일 목록이 비어 있습니다.')
  if (new Set(requiredFiles).size !== requiredFiles.length) {
    throw new Error('필수 빌드 파일 목록에 중복이 있습니다.')
  }
  for (const name of requiredFiles) {
    if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
      throw new Error(`안전하지 않은 빌드 파일 이름입니다: ${name}`)
    }
  }
}

export function parseBuildMarkers(text: string, requiredFiles: readonly string[]): Record<string, string> {
  validateRequiredFiles(requiredFiles)
  const result: Record<string, string> = {}
  const allowedFiles = new Set(requiredFiles)
  const marker = /===FILE:\s*([^=\r\n]+?)\s*===([\s\S]*?)===END FILE===/g
  for (const match of text.matchAll(marker)) {
    const name = match[1].trim()
    if (!allowedFiles.has(name)) {
      throw new Error(`허용되지 않은 빌드 파일 marker입니다: ${name}`)
    }
    if (name in result) throw new Error(`중복 빌드 파일 marker입니다: ${name}`)
    const content = match[2].replace(/^\r?\n/, '').replace(/\r?\n$/, '')
    if (!content.trim()) throw new Error(`빌드 파일이 비어 있습니다: ${name}`)
    result[name] = content
  }
  const missing = requiredFiles.filter((name) => !(name in result))
  if (missing.length) throw new Error(`빌드 파일 marker가 누락되었습니다: ${missing.join(', ')}`)
  return result
}

async function writeBuildFiles(
  stagingDir: string, files: Record<string, string>, requiredFiles: readonly string[],
): Promise<void> {
  const base = resolve(stagingDir)
  await mkdir(base, { recursive: true })
  for (const name of requiredFiles) {
    const target = resolve(base, name)
    if (dirname(target) !== base) throw new Error(`빌드 파일 경로가 작업 디렉터리를 벗어납니다: ${name}`)
    const temp = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`
    try {
      await writeFile(temp, files[name], { encoding: 'utf8', flag: 'wx' })
      await rename(temp, target)
    } finally {
      await rm(temp, { force: true })
    }
  }
}

async function requestOnce(options: ZaiRequestOptions, prompt: string): Promise<string> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, options.timeoutMs ?? DEFAULT_ZAI_TIMEOUT_MS)
  try {
    const response = await (options.fetchFn ?? fetch)(options.apiUrl ?? DEFAULT_ZAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model ?? 'glm-5.3-flash',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`)
    const content = await collectSseContent(response)
    if (!content.trim()) throw new Error('Z.ai 응답이 비어 있습니다.')
    return content
  } catch (error) {
    if (timedOut || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error(`${Math.round((options.timeoutMs ?? DEFAULT_ZAI_TIMEOUT_MS) / 1000)}초 시간 제한 초과`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

const MAX_ATTEMPTS = 3

async function requestWithRetry<T>(
  options: ZaiRequestOptions, prompt: string, accept: (raw: string) => Promise<T>,
): Promise<T> {
  let lastError = '알 수 없는 오류'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // 재시도에는 직전 실패 원인을 피드백해 모델이 스스로 교정하게 한다
    const attemptPrompt = attempt === 1 ? prompt :
      `${prompt}\n\n[재시도 지시] 직전 시도 출력이 다음 검증에 실패했습니다. ` +
      `아래 오류를 모두 해결한 완전한 출력을 처음부터 다시 생성하세요.\n${lastError}`
    try {
      const raw = await requestOnce(options, attemptPrompt)
      return await accept(raw)
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  throw new Error(`${options.label ?? 'Z.ai 생성'} 실패(총 ${MAX_ATTEMPTS}회 시도): ${lastError}`)
}

async function writeAtomic(path: string, content: string): Promise<void> {
  const target = resolve(path)
  await mkdir(dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' })
    await rename(temporary, target)
  } finally {
    await rm(temporary, { force: true })
  }
}

function assertApiKey(apiKey: string): void {
  if (!apiKey.trim()) throw new Error('ZAI_API_KEY가 설정되지 않았습니다.')
}

export async function runZaiText(options: ZaiTextOptions): Promise<void> {
  assertApiKey(options.apiKey)
  let prompt = options.prompt
  if (options.schemaFile) {
    const schema = await readFile(options.schemaFile, 'utf8')
    prompt = `${prompt}\n\n아래 JSON 스키마를 만족하는 JSON만 출력하세요. 다른 텍스트 금지.\n${schema.trim()}`
  }
  await requestWithRetry(options, prompt, async (raw) => {
    const output = options.schemaFile ? normalizeJson(raw) : raw
    const validationError = options.validateOutput?.(output)
    if (validationError) throw new Error(validationError)
    await writeAtomic(options.outFile, output)
  })
}

export interface ZaiGeneratedFiles {
  files: Record<string, string>
  raw: string
}

// 파일시스템에 쓰지 않고 파일 내용만 생성한다.
// 디스크가 읽기 전용인 환경(서버리스 함수)에서 재사용하기 위해 분리했다.
export async function generateZaiFiles(
  options: ZaiRequestOptions & { requiredFiles: readonly string[] },
): Promise<ZaiGeneratedFiles> {
  assertApiKey(options.apiKey)
  validateRequiredFiles(options.requiredFiles)
  const markers = options.requiredFiles
    .map((name) => `===FILE: ${name}===\n<${name} 본문>\n===END FILE===`).join('\n')
  const prompt = `${options.prompt}\n\n파일을 직접 쓸 수 없습니다. 반드시 아래 marker 형식으로 ` +
    `정확히 ${options.requiredFiles.length}개 파일을 반환하세요.\n${markers}`
  return requestWithRetry(options, prompt, async (raw) => ({
    files: parseBuildMarkers(raw, options.requiredFiles),
    raw,
  }))
}

export async function runZaiFiles(options: ZaiFilesOptions): Promise<void> {
  const { files, raw } = await generateZaiFiles(options)
  await writeBuildFiles(options.stagingDir, files, options.requiredFiles)
  await writeAtomic(options.responseFile, raw)
}
