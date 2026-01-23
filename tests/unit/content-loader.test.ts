// 콘텐츠 로딩 서비스 단위 테스트
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createInitialState,
  getContentHtmlPath,
  IFRAME_SANDBOX_ATTRS,
  IFRAME_ALLOW_ATTRS,
} from '../../src/services/content/loader'
import type { ContentManifest } from '../../src/types/content'

describe('content-loader', () => {
  // createInitialState 테스트
  describe('createInitialState', () => {
    it('초기 상태를 반환한다', () => {
      const state = createInitialState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.content).toBeNull()
      expect(state.htmlPath).toBeNull()
    })
  })

  // getContentHtmlPath 테스트
  describe('getContentHtmlPath', () => {
    it('path 필드가 있으면 해당 경로를 반환한다', () => {
      const content: ContentManifest = {
        id: 'test-content',
        title: 'Test Content',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: 'Test description',
        thumbnail: '/test/thumbnail.png',
        path: '/custom/path/index.html',
        createdAt: '2026-01-01T00:00:00Z',
      }

      const result = getContentHtmlPath(content)
      expect(result).toBe('/custom/path/index.html')
    })

    it('path 필드가 없으면 기본 경로를 생성한다', () => {
      const content: ContentManifest = {
        id: 'test-content',
        title: 'Test Content',
        subject: 'science',
        gradeLevel: 'middle',
        grade: 'middle-1',
        type: 'simulation',
        language: 'ko',
        description: 'Test description',
        thumbnail: '/test/thumbnail.png',
        path: '',
        createdAt: '2026-01-01T00:00:00Z',
      }

      const result = getContentHtmlPath(content)
      expect(result).toBe('/contents/science/middle/test-content/index.html')
    })

    it('영어 콘텐츠 경로를 올바르게 생성한다', () => {
      const content: ContentManifest = {
        id: 'word-safari',
        title: 'Word Safari',
        subject: 'english',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'en',
        description: 'English vocabulary game',
        thumbnail: '',
        path: '',
        createdAt: '2026-01-01T00:00:00Z',
      }

      const result = getContentHtmlPath(content)
      expect(result).toBe('/contents/english/elementary/word-safari/index.html')
    })
  })

  // 보안 속성 테스트
  describe('iframe 보안 속성', () => {
    it('IFRAME_SANDBOX_ATTRS가 필수 보안 설정을 포함한다', () => {
      expect(IFRAME_SANDBOX_ATTRS).toContain('allow-scripts')
      expect(IFRAME_SANDBOX_ATTRS).toContain('allow-forms')
    })

    it('IFRAME_SANDBOX_ATTRS가 allow-same-origin을 포함하지 않는다 (보안)', () => {
      // allow-scripts + allow-same-origin 조합은 sandbox 보안을 무력화하므로
      // allow-same-origin은 항상 제외해야 함
      expect(IFRAME_SANDBOX_ATTRS).not.toContain('allow-same-origin')
    })

    it('IFRAME_ALLOW_ATTRS가 필요한 권한을 포함한다', () => {
      expect(IFRAME_ALLOW_ATTRS).toContain('fullscreen')
      expect(IFRAME_ALLOW_ATTRS).toContain('autoplay')
    })
  })
})

// fetch를 사용하는 함수들의 테스트
describe('content-loader fetch functions', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('loadContentManifest', () => {
    it('성공 시 매니페스트를 반환한다', async () => {
      const { loadContentManifest } = await import('../../src/services/content/loader')
      const mockManifest: ContentManifest = {
        id: 'test',
        title: 'Test',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: 'Test',
        thumbnail: '',
        path: '',
        createdAt: '2026-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest),
      })

      const result = await loadContentManifest('/test/path')
      expect(result).toEqual(mockManifest)
      expect(mockFetch).toHaveBeenCalledWith('/test/path/manifest.json')
    })

    it('실패 시 에러를 던진다', async () => {
      const { loadContentManifest } = await import('../../src/services/content/loader')
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      await expect(loadContentManifest('/invalid/path')).rejects.toThrow(
        '콘텐츠 매니페스트를 불러올 수 없습니다'
      )
    })
  })

  describe('checkContentExists', () => {
    it('콘텐츠가 존재하면 true를 반환한다', async () => {
      const { checkContentExists } = await import('../../src/services/content/loader')
      mockFetch.mockResolvedValueOnce({ ok: true })

      const result = await checkContentExists('/test/path.html')
      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/test/path.html', { method: 'HEAD' })
    })

    it('콘텐츠가 없으면 false를 반환한다', async () => {
      const { checkContentExists } = await import('../../src/services/content/loader')
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await checkContentExists('/invalid/path.html')
      expect(result).toBe(false)
    })

    it('네트워크 에러 시 false를 반환한다', async () => {
      const { checkContentExists } = await import('../../src/services/content/loader')
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await checkContentExists('/test/path.html')
      expect(result).toBe(false)
    })
  })

  describe('findContentById', () => {
    it('카탈로그에서 콘텐츠를 찾는다', async () => {
      const { findContentById } = await import('../../src/services/content/loader')
      const mockCatalog = {
        version: '1.0.0',
        contents: [
          { id: 'test-1', title: 'Test 1' },
          { id: 'test-2', title: 'Test 2' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCatalog),
      })

      const result = await findContentById('test-2')
      expect(result).toEqual({ id: 'test-2', title: 'Test 2' })
    })

    it('존재하지 않는 ID면 null을 반환한다', async () => {
      const { findContentById } = await import('../../src/services/content/loader')
      const mockCatalog = {
        version: '1.0.0',
        contents: [{ id: 'test-1', title: 'Test 1' }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCatalog),
      })

      const result = await findContentById('nonexistent')
      expect(result).toBeNull()
    })

    it('fetch 실패 시 null을 반환한다', async () => {
      const { findContentById } = await import('../../src/services/content/loader')
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await findContentById('test-1')
      expect(result).toBeNull()
    })
  })

  describe('loadContentById', () => {
    it('ID로 콘텐츠와 HTML 경로를 반환한다', async () => {
      const { loadContentById } = await import('../../src/services/content/loader')
      const mockContent: ContentManifest = {
        id: 'fractions-pizza',
        title: '피자로 배우는 분수',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '분수 학습',
        thumbnail: '',
        path: '/contents/math/elementary/fractions-pizza/index.html',
        createdAt: '2026-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0.0',
            contents: [mockContent],
          }),
      })

      const result = await loadContentById('fractions-pizza')
      expect(result.content.id).toBe('fractions-pizza')
      expect(result.htmlPath).toBe('/contents/math/elementary/fractions-pizza/index.html')
    })

    it('존재하지 않는 ID면 에러를 던진다', async () => {
      const { loadContentById } = await import('../../src/services/content/loader')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0.0',
            contents: [],
          }),
      })

      await expect(loadContentById('nonexistent')).rejects.toThrow('콘텐츠를 찾을 수 없습니다')
    })
  })
})
