import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setViewportHeightVar } from '../../src/composables/useViewportHeight'

describe('setViewportHeightVar', () => {
  let originalInnerHeight = window.innerHeight

  beforeEach(() => {
    originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
    })
    document.documentElement.style.removeProperty('--app-vh')
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true,
    })
  })

  it('뷰포트 높이에 따라 CSS 변수를 설정한다', () => {
    setViewportHeightVar()

    const value = document.documentElement.style.getPropertyValue('--app-vh')
    expect(value).toBe('9px')
  })
})
