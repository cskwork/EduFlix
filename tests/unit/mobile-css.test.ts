import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mobile.css', () => {
  const filePath = resolve(process.cwd(), 'public/contents/common/mobile.css')
  const content = readFileSync(filePath, 'utf-8')

  it('body 고정 포지션을 사용하지 않는다', () => {
    expect(content).not.toMatch(/position\s*:\s*fixed/i)
  })

  it('scene-container 높이를 100%로 유지한다', () => {
    expect(content).toMatch(/#scene-container[\s\S]*height\s*:\s*100%\s*!important/i)
  })

  it('app 컨테이너가 콘텐츠 높이에 맞게 확장된다', () => {
    expect(content).toMatch(/#app[\s\S]*height\s*:\s*auto\s*!important/i)
    expect(content).toMatch(/#app[\s\S]*overflow-y\s*:\s*auto\s*!important/i)
  })
})
