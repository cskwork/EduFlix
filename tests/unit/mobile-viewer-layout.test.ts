import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile viewer layout', () => {
  const filePath = resolve(process.cwd(), 'src/assets/styles/responsive.css')
  const content = readFileSync(filePath, 'utf-8')

  it('모바일에서 viewer-container를 fixed로 배치한다', () => {
    expect(content).toMatch(
      /@media\s*\(max-width:\s*479px\)[\s\S]*\.viewer-container[\s\S]*position\s*:\s*fixed/i
    )
  })

  it('태블릿 구간에서 viewer-container를 fixed로 배치한다', () => {
    expect(content).toMatch(
      /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)[\s\S]*\.viewer-container[\s\S]*position\s*:\s*fixed/i
    )
  })
})
