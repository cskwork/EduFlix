import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('content viewer height', () => {
  const contentViewPath = resolve(process.cwd(), 'src/views/ContentView.vue')
  const appPath = resolve(process.cwd(), 'src/App.vue')
  const contentView = readFileSync(contentViewPath, 'utf-8')
  const app = readFileSync(appPath, 'utf-8')

  it('viewer-container가 dvh 기반 높이를 사용한다', () => {
    expect(contentView).toMatch(
      /\.viewer-container[\s\S]*height\s*:\s*calc\(100dvh\s*-\s*var\(--header-height\)\)/i
    )
  })

  it('중간 해상도에서 viewer-container를 고정 배치한다', () => {
    expect(contentView).toMatch(
      /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1199px\)[\s\S]*\.viewer-container[\s\S]*position\s*:\s*fixed/i
    )
  })

  it('대형 화면에서 viewer-container를 사이드바에 맞춰 고정 배치한다', () => {
    expect(contentView).toMatch(
      /@media\s*\(min-width:\s*1200px\)[\s\S]*\.viewer-container[\s\S]*position\s*:\s*fixed/i
    )
    expect(contentView).toMatch(
      /@media\s*\(min-width:\s*1200px\)[\s\S]*\.viewer-container[\s\S]*right\s*:\s*300px/i
    )
  })

  it('content-page가 dvh 기반 최소 높이를 사용한다', () => {
    expect(app).toMatch(/\.main-content\.content-page[\s\S]*min-height\s*:\s*100dvh/i)
  })
})
