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
