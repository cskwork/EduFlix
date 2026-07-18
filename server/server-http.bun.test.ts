import { afterEach, describe, expect, test } from 'bun:test'
import { serve, type Server } from 'bun'
import { createRequestHandler } from './index'

const servers: Server<undefined>[] = []
afterEach(() => {
  for (const server of servers.splice(0)) server.stop(true)
})

function startHttp(fetch: (request: Request) => Response | Promise<Response>) {
  const server = serve({ hostname: '127.0.0.1', port: 0, fetch })
  servers.push(server)
  return `http://127.0.0.1:${server.port}`
}

describe('Bun HTTP server wiring', () => {
  test('POST 202의 jobId를 실제 HTTP GET status로 즉시 조회한다', async () => {
    const job = {
      jobId: 'http-job', status: 'queued' as const, progress: 5,
      message: '생성 대기열에 추가되었습니다...', createdAt: new Date().toISOString(),
    }
    const handler = createRequestHandler({
      generate: {
        runner: {
          startGeneration: () => job,
          startReview: () => { throw new Error('호출 금지') },
          getJob: (jobId: string) => jobId === job.jobId ? job : undefined,
        },
        getConfig: () => ({ provider: 'zai' as const, model: 'test', keyConfigured: true }),
      },
    })
    const baseUrl = startHttp(handler)
    const created = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ interests: ['별'], subject: 'science', grade: 'elementary-3', language: 'ko' }),
    })
    const body = await created.json() as { jobId: string }
    const status = await fetch(`${baseUrl}/api/generate/status/${body.jobId}`)

    expect(created.status).toBe(202)
    expect(status.status).toBe(200)
    expect(await status.json()).toMatchObject({ jobId: 'http-job', status: 'queued' })
  })

  test('키가 없으면 실제 HTTP/JSON 배선에서 503을 반환한다', async () => {
    const handler = createRequestHandler({
      generate: {
        runner: {
          startGeneration: () => { throw new Error('호출 금지') },
          startReview: () => { throw new Error('호출 금지') },
          getJob: () => undefined,
        },
        getConfig: () => ({ provider: 'zai' as const, model: 'test', keyConfigured: false }),
      },
    })
    const baseUrl = startHttp(handler)
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ interests: ['별'], subject: 'science', grade: 'elementary-3', language: 'ko' }),
    })

    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toMatchObject({ success: false })
  })
})
