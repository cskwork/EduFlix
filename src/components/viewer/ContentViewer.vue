<script setup lang="ts">
// iframe 샌드박스 콘텐츠 뷰어
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { IFRAME_SANDBOX_ATTRS, IFRAME_ALLOW_ATTRS } from '../../services/content/loader'

const props = defineProps<{
  src: string
  title: string
}>()

const emit = defineEmits<{
  load: []
  error: [error: Error]
  fullscreenChange: [isFullscreen: boolean]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isFullscreen = ref(false)

// iframe sandbox 속성
const sandboxAttrs = IFRAME_SANDBOX_ATTRS
const allowAttrs = IFRAME_ALLOW_ATTRS

// iframe 로드 완료 핸들러
function handleLoad() {
  isLoading.value = false
  loadError.value = null
  emit('load')
}

// iframe 로드 에러 핸들러
function handleError() {
  isLoading.value = false
  loadError.value = '콘텐츠를 불러오는 데 실패했습니다'
  emit('error', new Error(loadError.value))
}

// 전체화면 토글
async function toggleFullscreen() {
  if (!containerRef.value) return

  try {
    if (!document.fullscreenElement) {
      await containerRef.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (err) {
    console.error('전체화면 전환 실패:', err)
  }
}

// 전체화면 상태 변경 감지
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  emit('fullscreenChange', isFullscreen.value)
}

// 전체화면 여부 계산
const fullscreenButtonLabel = computed(() => (isFullscreen.value ? '전체화면 종료' : '전체화면'))

// src 변경 시 로딩 상태 초기화
watch(
  () => props.src,
  () => {
    isLoading.value = true
    loadError.value = null
  }
)

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 외부에서 전체화면 토글 메서드 사용 가능하도록 expose
defineExpose({
  toggleFullscreen,
  isFullscreen,
})
</script>

<template>
  <div ref="containerRef" class="content-viewer" :class="{ fullscreen: isFullscreen }">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="viewer-loading">
      <div class="loading-spinner"></div>
      <p>콘텐츠 로딩 중...</p>
    </div>

    <!-- 에러 상태 (로딩 완료 후에만 표시) -->
    <div v-else-if="loadError" class="viewer-error">
      <div class="error-icon">!</div>
      <p>{{ loadError }}</p>
    </div>

    <!-- iframe 콘텐츠 -->
    <iframe
      :src="src"
      :title="title"
      :sandbox="sandboxAttrs"
      :allow="allowAttrs"
      class="viewer-iframe"
      @load="handleLoad"
      @error="handleError"
    ></iframe>

    <!-- 전체화면 버튼 -->
    <button
      class="fullscreen-btn"
      :title="fullscreenButtonLabel"
      :aria-label="fullscreenButtonLabel"
      @click="toggleFullscreen"
    >
      <svg
        v-if="!isFullscreen"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.content-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--color-bg-secondary);
  border-radius: var(--card-border-radius);
  overflow: hidden;
}

.content-viewer.fullscreen {
  border-radius: 0;
}

.viewer-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* 로딩 상태 */
.viewer-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  z-index: 10;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-bg-card);
  border-top-color: var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.viewer-loading p {
  margin-top: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* 에러 상태 */
.viewer-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  z-index: 10;
}

.error-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-error);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.viewer-error p {
  margin-top: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

/* 전체화면 버튼 */
.fullscreen-btn {
  position: absolute;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  width: 44px;
  height: 44px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
  z-index: 20;
}

.fullscreen-btn:hover {
  background-color: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.fullscreen-btn:active {
  transform: scale(0.95);
}

.content-viewer.fullscreen .fullscreen-btn {
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
}
</style>
