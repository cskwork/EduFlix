import { describe, expect, it } from 'vitest'
import { handleGenerateRoute } from '../../server/routes/generate'
import { FactoryBusyError, type FactoryRunner } from '../../server/services/factory-runner'

const jsonResponse = (data: unknown, status = 200) => Response.json(data, { status })
const errorResponse = (message: string, status = 500) => Response.json({ error: message, success: false }, { status })

describe('로컬 생성 route', () => {
  it('ZAI_API_KEY가 없으면 생성 요청을 503으로 거부한다', async () => {
    const previous = process.env.ZAI_API_KEY
    delete process.env.ZAI_API_KEY
    try {
      const response = await handleGenerateRoute(new Request('http://local/api/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interests: ['별'], subject: 'science', grade: 'elementary-3', language: 'ko' }),
      }), jsonResponse, errorResponse)
      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({ success: false })
    } finally {
      if (previous === undefined) delete process.env.ZAI_API_KEY
      else process.env.ZAI_API_KEY = previous
    }
  })

  it('동시 실행과 없는 job을 각각 409와 404로 응답한다', async () => {
    const runner = {
      startGeneration: () => { throw new FactoryBusyError() },
      startReview: () => { throw new FactoryBusyError() },
      getJob: () => undefined,
    } satisfies Pick<FactoryRunner, 'startGeneration' | 'startReview' | 'getJob'>
    const dependencies = {
      runner,
      getConfig: () => ({ provider: 'codex' as const, model: 'test', keyConfigured: true }),
    }
    const busy = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ interests: ['별'], subject: 'science', grade: 'elementary-3', language: 'ko' }),
    }), jsonResponse, errorResponse, dependencies)
    const missing = await handleGenerateRoute(
      new Request('http://local/api/generate/status/missing'), jsonResponse, errorResponse, dependencies,
    )

    expect(busy.status).toBe(409)
    expect(missing.status).toBe(404)
  })

  it('review queued 상태를 pending으로 매핑하고 경로 이탈 ID를 거부한다', async () => {
    const runner = {
      startGeneration: () => { throw new Error('호출 금지') },
      startReview: () => { throw new Error('호출 금지') },
      getJob: () => ({
        jobId: 'review-1', status: 'queued' as const, progress: 5,
        message: '리뷰 대기열', createdAt: new Date().toISOString(),
      }),
    } satisfies Pick<FactoryRunner, 'startGeneration' | 'startReview' | 'getJob'>
    const dependencies = {
      runner,
      getConfig: () => ({ provider: 'codex' as const, model: 'test', keyConfigured: true }),
    }
    const status = await handleGenerateRoute(
      new Request('http://local/api/generate/review/status/review-1'), jsonResponse, errorResponse, dependencies,
    )
    const traversal = await handleGenerateRoute(new Request('http://local/api/generate/review', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentId: '../secret' }),
    }), jsonResponse, errorResponse, dependencies)

    expect(await status.json()).toMatchObject({ status: 'pending' })
    expect(traversal.status).toBe(400)
  })

  it('POST 202의 jobId로 즉시 생성 상태를 조회할 수 있다', async () => {
    const job = {
      jobId: 'job-202', status: 'queued' as const, progress: 5,
      message: '생성 대기열에 추가되었습니다...', createdAt: new Date().toISOString(),
    }
    const runner = {
      startGeneration: () => job,
      startReview: () => { throw new Error('호출 금지') },
      getJob: (jobId: string) => jobId === job.jobId ? job : undefined,
    } satisfies Pick<FactoryRunner, 'startGeneration' | 'startReview' | 'getJob'>
    const dependencies = {
      runner,
      getConfig: () => ({ provider: 'codex' as const, model: 'test', keyConfigured: true }),
    }
    const created = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ interests: ['별'], subject: 'science', grade: 'elementary-3', language: 'ko' }),
    }), jsonResponse, errorResponse, dependencies)
    const body = await created.json() as { jobId: string }
    const status = await handleGenerateRoute(
      new Request(`http://local/api/generate/status/${body.jobId}`), jsonResponse, errorResponse, dependencies,
    )

    expect(created.status).toBe(202)
    expect(await status.json()).toMatchObject({ jobId: 'job-202', status: 'queued' })
  })
})

describe('로컬 생성 route - Option 2 (problem 모드) 검증', () => {
  const okConfig = () => ({ provider: 'codex' as const, model: 'test', keyConfigured: true })

  function makeRunner(capture?: (req: unknown) => void) {
    const job = {
      jobId: 'problem-job', status: 'queued' as const, progress: 5,
      message: '생성 대기열에 추가되었습니다...', createdAt: new Date().toISOString(),
    }
    return {
      startGeneration: (req: unknown) => { capture?.(req); return job },
      startReview: () => { throw new Error('호출 금지') },
      getJob: (jobId: string) => jobId === job.jobId ? job : undefined,
    } satisfies Pick<FactoryRunner, 'startGeneration' | 'startReview' | 'getJob'>
  }

  it('problem 모드 정상 요청은 202로 수락된다', async () => {
    const captured: unknown[] = []
    const dependencies = { runner: makeRunner((req) => captured.push(req)), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: '사과 5개에 3개를 더하면 몇 개인가요?',
        difficulty: 'easy',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(202)
    expect(captured).toHaveLength(1)
    expect(captured[0]).toMatchObject({
      mode: 'problem',
      problem: '사과 5개에 3개를 더하면 몇 개인가요?',
      difficulty: 'easy',
    })
  })

  it('problem 모드에서 subject 생략 가능 (AI가 추론)', async () => {
    const captured: unknown[] = []
    const dependencies = { runner: makeRunner((req) => captured.push(req)), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: 'Python 리스트 컴프리헨션을 설명하라',
        difficulty: 'medium',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(202)
    expect((captured[0] as { subject?: string }).subject).toBeUndefined()
  })

  it('problem 모드에서 subject를 kebab-case로 제공하면 통과', async () => {
    const captured: unknown[] = []
    const dependencies = { runner: makeRunner((req) => captured.push(req)), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: 'TOEIC Part 5 문제를 풀어라',
        difficulty: 'hard',
        subject: 'toeic',
        language: 'en',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(202)
    expect((captured[0] as { subject: string }).subject).toBe('toeic')
  })

  it('problem 모드에서 problem이 너무 짧으면 400', async () => {
    const dependencies = { runner: makeRunner(), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: '짧',
        difficulty: 'easy',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string }
    expect(body.error).toContain('problem')
  })

  it('problem 모드에서 difficulty 누락 시 400', async () => {
    const dependencies = { runner: makeRunner(), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: '문제를 충분히 길게 쓴다',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string }
    expect(body.error).toContain('difficulty')
  })

  it('problem 모드에서 잘못된 difficulty 값은 400', async () => {
    const dependencies = { runner: makeRunner(), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: '충분히 긴 문제',
        difficulty: 'impossible',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(400)
  })

  it('problem 모드에서 subject가 kebab-case가 아니면 400', async () => {
    const dependencies = { runner: makeRunner(), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'problem',
        problem: '문제를 푼다',
        difficulty: 'easy',
        subject: 'Korean History!',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(400)
  })

  it('interest 모드는 여전히 기존 스키마를 요구한다', async () => {
    const dependencies = { runner: makeRunner(), getConfig: okConfig }
    // interest 모드인데 problem/difficulty로 오는 경우 거부
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'interest',
        problem: '문제를 푼다',
        difficulty: 'easy',
        language: 'ko',
        // interests/subject/grade 누락
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(400)
    const body = await response.json() as { error: string }
    expect(body.error).toContain('interest')
  })

  it('interest 모드에서도 확장 subject slug를 허용한다 (coding, toeic 등)', async () => {
    const captured: unknown[] = []
    const dependencies = { runner: makeRunner((req) => captured.push(req)), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        interests: ['로봇', '게임'],
        subject: 'coding',
        grade: 'middle-2',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(202)
    expect((captured[0] as { subject: string }).subject).toBe('coding')
  })

  it('mode 생략 시 기본값 interest로 처리되어 기존 클라이언트 호환성 유지', async () => {
    const captured: unknown[] = []
    const dependencies = { runner: makeRunner((req) => captured.push(req)), getConfig: okConfig }
    const response = await handleGenerateRoute(new Request('http://local/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        interests: ['대칭'],
        subject: 'math',
        grade: 'elementary-5',
        language: 'ko',
      }),
    }), jsonResponse, errorResponse, dependencies)

    expect(response.status).toBe(202)
    expect((captured[0] as { mode?: string }).mode ?? 'interest').toBe('interest')
  })
})
