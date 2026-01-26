import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useDragScroll(containerRef: Ref<HTMLElement | null>) {
  const isDragging = ref(false)

  let startX = 0
  let scrollLeft = 0
  let hasDragged = false
  const DRAG_THRESHOLD = 5

  let isMouseDown = false

  function startDrag(e: MouseEvent) {
    if (!containerRef.value) return
    if ((e.target as HTMLElement).closest('button')) return

    isMouseDown = true
    hasDragged = false
    startX = e.pageX - containerRef.value.offsetLeft
    scrollLeft = containerRef.value.scrollLeft
  }

  function onDrag(e: MouseEvent) {
    if (!isMouseDown || !containerRef.value) return

    const x = e.pageX - containerRef.value.offsetLeft
    const walk = x - startX

    if (Math.abs(walk) > DRAG_THRESHOLD) {
      hasDragged = true
      isDragging.value = true
      e.preventDefault()
    }

    if (isDragging.value) {
      containerRef.value.scrollLeft = scrollLeft - walk
    }
  }

  function endDrag() {
    isMouseDown = false
    isDragging.value = false
  }

  function preventClickIfDragged(e: MouseEvent) {
    if (hasDragged) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onMounted(() => {
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('mousemove', onDrag)
  })

  onUnmounted(() => {
    document.removeEventListener('mouseup', endDrag)
    document.removeEventListener('mousemove', onDrag)
  })

  return { isDragging, startDrag, endDrag, preventClickIfDragged }
}
