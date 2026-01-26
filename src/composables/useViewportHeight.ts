import { onMounted, onUnmounted } from 'vue'

export function setViewportHeightVar() {
  const visualHeight = window.visualViewport?.height ?? 0
  const height = Math.max(window.innerHeight, visualHeight)
  document.documentElement.style.setProperty('--app-vh', `${height * 0.01}px`)
}

export function useViewportHeight() {
  const update = () => setViewportHeightVar()
  let viewport: VisualViewport | null = null

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    viewport = window.visualViewport ?? null
    viewport?.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
    viewport?.removeEventListener('resize', update)
  })
}
