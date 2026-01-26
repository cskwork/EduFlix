import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../../src/App.vue'

const routes = [
  { path: '/', component: { template: '<div>home</div>' } },
  { path: '/content/:id', component: { template: '<div>content</div>' } },
]

async function mountWithRoute(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      stubs: {
        AppHeader: { template: '<div class="app-header-stub"></div>' },
      },
    },
  })

  return wrapper
}

describe('App layout', () => {
  it('콘텐츠 페이지에서는 AppHeader를 숨기고 전용 클래스를 적용한다', async () => {
    const wrapper = await mountWithRoute('/content/equation-puzzle')

    expect(wrapper.find('.app-header-stub').exists()).toBe(false)
    expect(wrapper.find('main.main-content').classes()).toContain('content-page')
  })

  it('일반 페이지에서는 AppHeader를 표시하고 전용 클래스를 적용하지 않는다', async () => {
    const wrapper = await mountWithRoute('/')

    expect(wrapper.find('.app-header-stub').exists()).toBe(true)
    expect(wrapper.find('main.main-content').classes()).not.toContain('content-page')
  })
})
