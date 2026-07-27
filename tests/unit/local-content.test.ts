import { describe, it, expect } from 'vitest'
import {
  buildLocalDocument,
  isLocalContentId,
  LOCAL_CONTENT_PREFIX,
  toManifest,
  type LocalContent,
} from '../../src/services/content/localContent'

const sample: LocalContent = {
  id: `${LOCAL_CONTENT_PREFIX}abc`,
  title: '분수 탐험',
  description: '분수를 눈으로 배우기',
  subject: 'math',
  gradeLevel: 'elementary',
  grade: 'elementary-3',
  type: 'simulation',
  language: 'ko',
  html: '',
  css: '',
  js: '',
  createdAt: '2026-07-27T00:00:00.000Z',
}

describe('isLocalContentId', () => {
  it('로컬 접두사가 붙은 id만 인식한다', () => {
    expect(isLocalContentId(`${LOCAL_CONTENT_PREFIX}abc`)).toBe(true)
    expect(isLocalContentId('fractions-pizza')).toBe(false)
  })
})

describe('buildLocalDocument', () => {
  it('style.css 링크를 인라인 style로 치환한다', () => {
    const document = buildLocalDocument({
      html: '<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
      css: 'body { color: red; }',
      js: '',
    })

    expect(document).toContain('<style>')
    expect(document).toContain('body { color: red; }')
    expect(document).not.toContain('href="style.css"')
  })

  it('script.js 태그를 인라인 script로 치환한다', () => {
    const document = buildLocalDocument({
      html: '<html><body><script src="script.js"></script></body></html>',
      css: '',
      js: 'console.log(1)',
    })

    expect(document).toContain('console.log(1)')
    expect(document).not.toContain('src="script.js"')
  })

  it('링크 태그가 없어도 head/body에 주입한다', () => {
    const document = buildLocalDocument({
      html: '<html><head></head><body></body></html>',
      css: 'a{}',
      js: 'b()',
    })

    expect(document).toContain('<style>')
    expect(document).toContain('a{}')
    expect(document).toContain('b()')
  })

  it('css와 js가 비어 있으면 아무것도 주입하지 않는다', () => {
    const html = '<html><head></head><body></body></html>'
    expect(buildLocalDocument({ html, css: '', js: '' })).toBe(html)
  })
})

describe('toManifest', () => {
  it('카탈로그 항목 형태로 변환하고 path는 비운다', () => {
    const manifest = toManifest(sample)

    expect(manifest.id).toBe(sample.id)
    expect(manifest.title).toBe('분수 탐험')
    expect(manifest.subject).toBe('math')
    expect(manifest.gradeLevel).toBe('elementary')
    // 실제 파일이 없으므로 뷰어가 Blob URL로 대체한다
    expect(manifest.path).toBe('')
  })
})
