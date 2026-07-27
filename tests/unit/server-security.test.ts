import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { checkWriteAccess, isContentSlug, isGradeLevel, isInside } from '../../server/security'

function request(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/content', { method: 'POST', headers })
}

describe('isInside', () => {
  const base = resolve('/srv/app/public/contents')

  it('하위 경로를 허용한다', () => {
    expect(isInside(base, resolve('/srv/app/public/contents/math/elementary/foo'))).toBe(true)
  })

  it('형제 디렉터리의 접두사 일치를 거부한다 (startsWith 우회 방지)', () => {
    expect(isInside(base, resolve('/srv/app/public/contents-evil/x'))).toBe(false)
    expect(isInside(base, resolve('/srv/app/public/contents.bak'))).toBe(false)
  })

  it('상위로 탈출하는 경로를 거부한다', () => {
    expect(isInside(base, resolve('/srv/app/public'))).toBe(false)
    expect(isInside(base, resolve('/etc/passwd'))).toBe(false)
  })

  it('base 자기 자신은 기본적으로 거부한다 (콘텐츠 루트 통째 삭제 방지)', () => {
    expect(isInside(base, base)).toBe(false)
    expect(isInside(base, base, true)).toBe(true)
  })
})

describe('slug 검증', () => {
  it('kebab-case slug만 통과시킨다', () => {
    expect(isContentSlug('math')).toBe(true)
    expect(isContentSlug('box-volume-2')).toBe(true)
    expect(isContentSlug('../etc')).toBe(false)
    expect(isContentSlug('Math')).toBe(false)
    expect(isContentSlug('a/b')).toBe(false)
    expect(isContentSlug('')).toBe(false)
    expect(isContentSlug(undefined)).toBe(false)
  })

  it('gradeLevel은 3종만 허용한다', () => {
    expect(isGradeLevel('elementary')).toBe(true)
    expect(isGradeLevel('middle')).toBe(true)
    expect(isGradeLevel('high')).toBe(true)
    expect(isGradeLevel('..')).toBe(false)
    expect(isGradeLevel('college')).toBe(false)
  })
})

describe('checkWriteAccess', () => {
  it('개발 모드에서 토큰이 없으면 통과시킨다', () => {
    expect(checkWriteAccess(request(), { NODE_ENV: 'development' })).toBeUndefined()
  })

  it('프로덕션에서 ADMIN_TOKEN 미설정이면 쓰기를 막는다', () => {
    const denial = checkWriteAccess(request(), { NODE_ENV: 'production' })
    expect(denial?.status).toBe(503)
  })

  it('토큰이 설정되면 헤더가 일치해야 통과한다', () => {
    const env = { NODE_ENV: 'production', ADMIN_TOKEN: 'secret-token' }
    expect(checkWriteAccess(request(), env)?.status).toBe(401)
    expect(checkWriteAccess(request({ 'x-admin-token': 'wrong' }), env)?.status).toBe(401)
    expect(checkWriteAccess(request({ 'x-admin-token': 'secret-token' }), env)).toBeUndefined()
  })

  it('Authorization: Bearer 형식도 허용한다', () => {
    const env = { NODE_ENV: 'production', ADMIN_TOKEN: 'secret-token' }
    expect(checkWriteAccess(request({ authorization: 'Bearer secret-token' }), env)).toBeUndefined()
    expect(checkWriteAccess(request({ authorization: 'Bearer nope' }), env)?.status).toBe(401)
  })

  it('개발 모드라도 토큰이 설정되어 있으면 검증한다', () => {
    const env = { NODE_ENV: 'development', ADMIN_TOKEN: 'secret-token' }
    expect(checkWriteAccess(request(), env)?.status).toBe(401)
    expect(checkWriteAccess(request({ 'x-admin-token': 'secret-token' }), env)).toBeUndefined()
  })
})
