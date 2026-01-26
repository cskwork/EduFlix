import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('decimal-multiplication asset paths', () => {
  const htmlPath = resolve(
    process.cwd(),
    'public/contents/math/elementary/decimal-multiplication/index.html'
  )
  const cssPath = resolve(
    process.cwd(),
    'public/contents/math/elementary/decimal-multiplication/style.css'
  )
  const html = readFileSync(htmlPath, 'utf-8')
  const css = readFileSync(cssPath, 'utf-8')

  it('아이콘과 일러스트는 /contents 기준 절대 경로를 사용한다', () => {
    expect(html).toMatch(/src="\/contents\/icons\//)
    expect(html).toMatch(/src="\/contents\/illustrations\//)
    expect(html).not.toMatch(/src="\.\.\/\.\.\/icons\//)
    expect(html).not.toMatch(/src="\.\.\/\.\.\/illustrations\//)
  })

  it('배경 이미지는 /contents 기준 절대 경로를 사용한다', () => {
    expect(css).toMatch(/url\(['"]?\/contents\/backgrounds\/bg-numbers-pattern-20260125\.png['"]?\)/)
    expect(css).not.toMatch(/\.\.\/\.\.\/backgrounds\//)
  })
})
