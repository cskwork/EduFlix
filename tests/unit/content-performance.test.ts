import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as localContent from '../../src/services/content/localContent'
import ContentCard from '../../src/components/home/ContentCard.vue'
import { useContentStore } from '../../src/stores/content'
import { calculateSortScore } from '../../src/services/clickTracker'
import type { ContentManifest } from '../../src/types/content'

const lesson = (id: string, subject = 'math'): ContentManifest => ({
  id, subject, title: id, gradeLevel: 'elementary', grade: 'elementary-3',
  type: 'game', language: 'en', description: '', thumbnail: '', path: '',
  createdAt: '2026-01-01T00:00:00Z',
})

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('catalog performance and discoverability', () => {
  it('reads click statistics once while preserving popularity order and custom subjects', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T00:00:00Z'))
    const read = vi.fn().mockReturnValue(JSON.stringify({ popular: { count: 5, lastClickedAt: '2026-09-07T00:00:00Z' } }))
    vi.stubGlobal('localStorage', { getItem: read })
    const store = useContentStore()
    store.contents = [lesson('first'), lesson('popular'), lesson('custom', 'coding')]
    read.mockClear()
    expect(store.contentGroups.map((group) => [group.subject, group.contents.map((c) => c.id)]))
      .toEqual([['math', ['popular', 'first']], ['coding', ['custom']]])
    expect(read).toHaveBeenCalledTimes(1)
    store.setSubjectFilter('coding')
    expect(store.contentGroups[0]?.contents[0]?.id).toBe('custom')
  })

  it('keeps click, recency, invalid-date and future-date score semantics', () => {
    const now = new Date('2026-09-08T00:00:00Z')
    const stats = { a: { count: 2, lastClickedAt: '2026-09-07T00:00:00Z' } }
    expect(calculateSortScore('a', '2026-09-06T00:00:00Z', stats, now)).toBe(110)
    expect(calculateSortScore('a', 'invalid', stats, now)).toBe(16)
    expect(calculateSortScore('a', '2026-09-09T00:00:00Z', stats, now)).toBe(116)
  })

  it('loads thumbnails lazily without running lesson iframes and falls back on image error', async () => {
    const wrapper = mount(ContentCard, {
      props: { content: { ...lesson('preview'), thumbnail: '/lesson.webp' } },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
    expect(wrapper.find('img').attributes('decoding')).toBe('async')
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.thumbnail-fallback').text()).toContain('preview')
    wrapper.unmount()
  })
  it('does not read or execute local lesson contents for a card', () => {
    const read = vi.spyOn(localContent, 'getLocalContent')
    const wrapper = mount(ContentCard, {
      props: { content: lesson('local-preview') },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    expect(read).not.toHaveBeenCalled()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('.thumbnail-fallback').text()).toContain('local-preview')
    wrapper.unmount()
  })
})
