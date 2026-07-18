import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DEFAULT_ZAI_TIMEOUT_MS, parseBuildMarkers, runZaiFiles, runZaiText } from './zai'

const dirs: string[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function stream(...lines: string[]): Response {
  return new Response(lines.join('\n'), { status: 200 })
}

function chunkedStream(...chunks: string[]): Response {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  }), { status: 200 })
}

describe('Z.ai SSE 생성', () => {
  it('기본 시간 제한은 정확히 10분이다', () => {
    expect(DEFAULT_ZAI_TIMEOUT_MS).toBe(10 * 60 * 1000)
  })

  it('분할된 SSE stream에서 choice[0].delta.content만 모으고 stop에서 종료한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-sse-'))
    dirs.push(dir)
    const outFile = join(dir, 'plan.json')
    const fetchFn = vi.fn().mockResolvedValue(chunkedStream(
      'data: {"choices":[{"delta":{"reasoning_content":"무시","content":"{\\"ok\\":"}},',
      '{"delta":{"content":"false"}}]}\n\nda',
      'ta: {"choices":[{"delta":{"content":"true}"},"finish_reason":"stop"}]}\n\n',
      'data: {"choices":[{"delta":{"content":",\\"late\\":true}"}}]}\n\ndata: [DONE]\n\n',
    ))

    await runZaiText({ prompt: '기획', outFile, apiKey: 'test', fetchFn })

    expect(await readFile(outFile, 'utf8')).toBe('{"ok":true}')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('schema 없는 일반 텍스트는 EOF의 마지막 SSE frame까지 원문 그대로 보존한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-raw-'))
    dirs.push(dir)
    const outFile = join(dir, 'review.txt')
    const fetchFn = vi.fn().mockResolvedValue(chunkedStream(
      'data: {"choices":[{"delta":{"content":"  hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world\\n"}}]}',
    ))

    await runZaiText({ prompt: 'review', outFile, apiKey: 'test', fetchFn })

    expect(await readFile(outFile, 'utf8')).toBe('  hello world\n')
  })

  it('[DONE] 뒤의 event를 읽지 않는다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-done-'))
    dirs.push(dir)
    const outFile = join(dir, 'done.txt')
    const fetchFn = vi.fn().mockResolvedValue(chunkedStream(
      'data: {"choices":[{"delta":{"content":"before"}}]}\n\n',
      'data: [DONE]\n\n',
      'data: {"choices":[{"delta":{"content":"after"}}]}\n\n',
    ))

    await runZaiText({ prompt: 'review', outFile, apiKey: 'test', fetchFn })

    expect(await readFile(outFile, 'utf8')).toBe('before')
  })

  it('schema 본문을 prompt 끝에 붙이고 실패해도 기존 출력을 원자적으로 보존하며 총 3회 시도한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-schema-'))
    dirs.push(dir)
    const outFile = join(dir, 'plan.json')
    const schemaFile = join(dir, 'schema.json')
    await writeFile(outFile, 'old')
    await writeFile(schemaFile, '{"type":"object"}')
    const fetchFn = vi.fn().mockResolvedValue(stream('data: {"choices":[{"delta":{"content":"```json\\n[]\\n```"}}]}', 'data: [DONE]'))

    await expect(runZaiText({
      prompt: '기획', outFile, schemaFile, apiKey: 'test', fetchFn,
      validateOutput: () => '객체가 필요합니다',
    })).rejects.toThrow('3회')

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(await readFile(outFile, 'utf8')).toBe('old')
    const body = JSON.parse(String(fetchFn.mock.calls[0][1]?.body))
    expect(body.messages[0].content).toMatch(/기획[\s\S]*아래 JSON 스키마[\s\S]*\{"type":"object"\}$/)
  })

  it('재시도 prompt에 직전 검증 오류를 피드백한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-feedback-'))
    dirs.push(dir)
    const outFile = join(dir, 'plan.json')
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(stream('data: {"choices":[{"delta":{"content":"{}"}}]}', 'data: [DONE]'))
      .mockResolvedValue(stream('data: {"choices":[{"delta":{"content":"{\\"ok\\":true}"}}]}', 'data: [DONE]'))
    const validateOutput = vi.fn()
      .mockReturnValueOnce('scenes[1]이 계약을 충족하지 않습니다')
      .mockReturnValue(undefined)

    await runZaiText({ prompt: '스토리보드', outFile, apiKey: 'test', fetchFn, validateOutput })

    expect(fetchFn).toHaveBeenCalledTimes(2)
    const firstPrompt = JSON.parse(String(fetchFn.mock.calls[0][1]?.body)).messages[0].content
    const retryPrompt = JSON.parse(String(fetchFn.mock.calls[1][1]?.body)).messages[0].content
    expect(firstPrompt).not.toContain('[재시도 지시]')
    expect(retryPrompt).toContain('[재시도 지시]')
    expect(retryPrompt).toContain('scenes[1]이 계약을 충족하지 않습니다')
  })

  it('HTTP 오류와 빈 응답을 재시도하고 abort timeout을 보고한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-errors-'))
    dirs.push(dir)
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(new Response('bad', { status: 500 }))
      .mockImplementation(async () => stream('data: [DONE]'))
    await expect(runZaiText({ prompt: 'x', outFile: join(dir, 'x.json'), apiKey: 'test', fetchFn }))
      .rejects.toThrow('비어')

    const hanging = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    await expect(runZaiText({ prompt: 'x', outFile: join(dir, 'y.json'), apiKey: 'test', fetchFn: hanging, timeoutMs: 5 }))
      .rejects.toThrow('시간 제한')
    expect(hanging).toHaveBeenCalledTimes(3)
  })

  it('호출자가 지정한 label을 최종 오류에 보존한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-label-'))
    dirs.push(dir)
    const fetchFn = vi.fn().mockImplementation(async () => new Response('bad', { status: 500 }))

    await expect(runZaiText({
      prompt: 'x', outFile: join(dir, 'x.txt'), apiKey: 'test', fetchFn, label: '기획 생성',
    })).rejects.toThrow('기획 생성 실패')
  })
})

describe('build marker 계약', () => {
  const requiredFiles = ['index.html', 'style.css', 'script.js', 'manifest.json']
  const files = requiredFiles
    .map((name) => `===FILE: ${name}===\n${name}\n===END FILE===`).join('\n')

  it('정확한 네 파일을 파싱한다', () => {
    expect(Object.keys(parseBuildMarkers(files, requiredFiles))).toEqual(requiredFiles)
  })

  it('호출자가 지정한 파일 목록만 marker whitelist로 사용한다', () => {
    const custom = [
      '===FILE: lesson.html===\nlesson\n===END FILE===',
      '===FILE: meta.json===\n{}\n===END FILE===',
    ].join('\n')
    expect(parseBuildMarkers(custom, ['lesson.html', 'meta.json'])).toEqual({
      'lesson.html': 'lesson',
      'meta.json': '{}',
    })
    expect(() => parseBuildMarkers(custom, ['lesson.html'])).toThrow('허용되지 않은')
  })

  it('동적 파일 계약으로 staging 파일과 원문 response를 기록한다', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'zai-files-'))
    dirs.push(dir)
    const requiredFiles = ['lesson.html', 'meta.json']
    const raw = requiredFiles
      .map((name) => `===FILE: ${name}===\n${name} body\n===END FILE===`).join('\n')
    const event = JSON.stringify({ choices: [{ delta: { content: raw } }] })
    const fetchFn = vi.fn().mockResolvedValue(stream(`data: ${event}`, 'data: [DONE]'))
    const stagingDir = join(dir, 'staging')
    const responseFile = join(dir, 'response.txt')

    await runZaiFiles({
      prompt: 'build', requiredFiles, stagingDir, responseFile, apiKey: 'test', fetchFn,
    })

    expect(await readFile(join(stagingDir, 'lesson.html'), 'utf8')).toBe('lesson.html body')
    expect(await readFile(join(stagingDir, 'meta.json'), 'utf8')).toBe('meta.json body')
    expect(await readFile(responseFile, 'utf8')).toBe(raw)
    const body = JSON.parse(String(fetchFn.mock.calls[0][1]?.body))
    expect(body.messages[0].content).toContain('정확히 2개 파일')
    expect(body.messages[0].content).not.toContain('index.html')
  })

  it.each([
    ['경로 이탈', files.replace('index.html', '../index.html')],
    ['중복', `${files}\n===FILE: index.html===x===END FILE===`],
    ['누락', files.replace(/===FILE: script\.js===[\s\S]*?===END FILE===/, '')],
    ['빈 파일', files.replace('style.css\n===END FILE===', '\n===END FILE===')],
  ])('%s을 거부한다', (_label, value) => {
    expect(() => parseBuildMarkers(value, requiredFiles)).toThrow()
  })
})
