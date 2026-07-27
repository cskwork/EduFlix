// 쓰기 API 접근 제어의 실제 HTTP 배선 회귀 테스트
import { afterEach, describe, expect, test } from 'bun:test'
import { serve, type Server } from 'bun'
import { createRequestHandler } from './index'

const servers: Server<undefined>[] = []
const originalEnv = { NODE_ENV: process.env.NODE_ENV, ADMIN_TOKEN: process.env.ADMIN_TOKEN }

afterEach(() => {
  for (const server of servers.splice(0)) server.stop(true)
  process.env.NODE_ENV = originalEnv.NODE_ENV
  if (originalEnv.ADMIN_TOKEN === undefined) delete process.env.ADMIN_TOKEN
  else process.env.ADMIN_TOKEN = originalEnv.ADMIN_TOKEN
})

function startHttp() {
  const server = serve({ hostname: '127.0.0.1', port: 0, fetch: createRequestHandler() })
  servers.push(server)
  return `http://127.0.0.1:${server.port}`
}

// 콘텐츠 루트 전체 삭제를 노리던 공격 페이로드
const MALICIOUS_CONTENT = {
  id: 'pwned', title: 'x', subject: 'math', gradeLevel: 'elementary',
  type: 'game', path: '/contents',
}

describe('쓰기 API 접근 제어', () => {
  test('프로덕션에서 ADMIN_TOKEN이 없으면 콘텐츠 등록이 503으로 막힌다', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ADMIN_TOKEN
    const baseUrl = startHttp()

    const response = await fetch(`${baseUrl}/api/content`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(MALICIOUS_CONTENT),
    })

    expect(response.status).toBe(503)
  })

  test('ADMIN_TOKEN이 설정되면 토큰 없는 삭제 요청은 401이다', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ADMIN_TOKEN = 'test-admin-token'
    const baseUrl = startHttp()

    const response = await fetch(`${baseUrl}/api/content/anything?deleteFiles=true`, { method: 'DELETE' })

    expect(response.status).toBe(401)
  })

  test('추천 데이터 초기화도 관리자 전용이다', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ADMIN_TOKEN = 'test-admin-token'
    const baseUrl = startHttp()

    const response = await fetch(`${baseUrl}/api/recommendations/clear`, { method: 'POST' })

    expect(response.status).toBe(401)
  })

  test('읽기(GET)는 토큰 없이도 열려 있다', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ADMIN_TOKEN = 'test-admin-token'
    const baseUrl = startHttp()

    const response = await fetch(`${baseUrl}/api/content`)

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true })
  })

  test('프로덕션 응답에 와일드카드 CORS 헤더가 없다', async () => {
    process.env.NODE_ENV = 'production'
    const baseUrl = startHttp()

    const response = await fetch(`${baseUrl}/api/content`)

    expect(response.headers.get('access-control-allow-origin')).not.toBe('*')
  })
})
