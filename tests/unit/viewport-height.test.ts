import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setViewportHeightVar } from '../../src/composables/useViewportHeight'

describe('setViewportHeightVar', () => {
  let originalInnerHeight = window.innerHeight
  let originalVisualViewport: VisualViewport | undefined = window.visualViewport

  beforeEach(() => {
    originalInnerHeight = window.innerHeight
    originalVisualViewport = window.visualViewport
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
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      configurable: true,
    })
  })

  it('뷰포트 높이에 따라 CSS 변수를 설정한다', () => {
    setViewportHeightVar()

    const value = document.documentElement.style.getPropertyValue('--app-vh')
    expect(value).toBe('9px')
  })

  it('visualViewport 높이가 더 작아도 innerHeight 기준으로 설정한다', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: {
        height: 600,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      configurable: true,
    })

    setViewportHeightVar()

    const value = document.documentElement.style.getPropertyValue('--app-vh')
    expect(value).toBe('9px')
  })
})
