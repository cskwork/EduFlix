import { describe, expect, it, vi } from 'vitest'
import { resolveSkipImages } from './assets'
import type { FactoryContext } from './common'

describe('assets image policy', () => {
  it('runner가 skipImages를 미리 true로 설정해도 Z.ai 자동 skip을 로그로 남긴다', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const context = { llmProvider: 'zai', skipImages: true } as FactoryContext

    expect(resolveSkipImages(context)).toBe(true)
    expect(info).toHaveBeenCalledWith('Z.ai provider에서는 신규 이미지 생성을 건너뜁니다.')
    info.mockRestore()
  })
})
