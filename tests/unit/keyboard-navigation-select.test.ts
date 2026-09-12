import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useKeyboardNavigation } from '../../src/composables/useKeyboardNavigation'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push, currentRoute: { value: { path: '/studio' } } }) }))
afterEach(() => { vi.clearAllMocks() })

describe('select control keyboard shortcuts', () => {
  it('preserves select type-ahead keys while retaining shortcuts from the page body', async () => {
    const wrapper = mount(defineComponent({
      setup() { useKeyboardNavigation(); return {} },
      template: '<select aria-label="Grade"><option>Elementary</option><option>High school</option></select>',
    }), { attachTo: document.body })
    try {
      const select = wrapper.get('select')
      ;(select.element as HTMLSelectElement).focus()
      await select.trigger('keydown', { key: 'h' })
      await select.trigger('keydown', { key: 'c' })
      expect(push).not.toHaveBeenCalled()
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }))
      expect(push).toHaveBeenCalledExactlyOnceWith('/')
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))
      expect(push).toHaveBeenLastCalledWith('/create')
    } finally { wrapper.unmount() }
  })
})
