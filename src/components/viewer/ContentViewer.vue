<script setup lang="ts">
// iframe 샌드박스 콘텐츠 뷰어
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { IFRAME_SANDBOX_ATTRS, IFRAME_ALLOW_ATTRS } from '../../services/content/loader'
import { useI18n } from '../../i18n'

const { t } = useI18n()

const props = defineProps<{
  src: string
  title: string
  editMode?: boolean
}>()

const emit = defineEmits<{
  load: []
  error: [error: Error]
  fullscreenChange: [isFullscreen: boolean]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const iframeRef = ref<HTMLIFrameElement | null>(null)
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

  // 편집 모드일 때 editor-bridge.js 동적 주입
  if (props.editMode && iframeRef.value?.contentDocument) {
    injectEditorBridge()
  }

  emit('load')
}

// editor-bridge.js 동적 주입
function injectEditorBridge() {
  if (!iframeRef.value?.contentDocument) return

  const doc = iframeRef.value.contentDocument

  // 이미 주입되었는지 확인
  if (doc.getElementById('editor-bridge-script')) return

  const script = doc.createElement('script')
  script.id = 'editor-bridge-script'
  script.src = new URL('/contents/common/editor-bridge.js', window.location.origin).href
  doc.head.appendChild(script)

  console.log('[ContentViewer] editor-bridge.js 동적 주입 완료')
}

// iframe 로드 에러 핸들러
function handleError() {
  isLoading.value = false
  loadError.value = t('viewer.loadFailed')
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
const fullscreenButtonLabel = computed(() =>
  isFullscreen.value ? t('viewer.exitFullscreen') : t('viewer.enterFullscreen')
)

// src 변경 시 로딩 상태 초기화
watch(
  () => props.src,
  () => {
    isLoading.value = true
    loadError.value = null
  }
)

// editMode 변경 시 editor-bridge 주입
watch(
  () => props.editMode,
  (newEditMode) => {
    if (newEditMode && !isLoading.value) {
      injectEditorBridge()
    }
  }
)

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// iframe ref getter
function getIframeRef(): HTMLIFrameElement | null {
  return iframeRef.value
}

// 외부에서 전체화면 토글 메서드 사용 가능하도록 expose
defineExpose({
  toggleFullscreen,
  isFullscreen,
  getIframeRef,
})
</script>

<template>
  <div ref="containerRef" class="content-viewer" :class="{ fullscreen: isFullscreen }">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="viewer-loading">
      <div class="loading-spinner"></div>
      <p>{{ t('viewer.loading') }}</p>
    </div>

    <!-- 에러 상태 (로딩 완료 후에만 표시) -->
    <div v-else-if="loadError" class="viewer-error">
      <div class="error-icon">!</div>
      <p>{{ loadError }}</p>
    </div>

    <!-- iframe 콘텐츠 -->
    <iframe
      ref="iframeRef"
      :src="src"
      :title="title"
      :sandbox="sandboxAttrs"
      :allow="allowAttrs"
      scrolling="auto"
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
  border: 4px solid rgba(59, 53, 98, 0.1);
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
  color: #fff;
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
  background-color: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: 50%;
  color: var(--color-ink);
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
  z-index: 20;
}

.fullscreen-btn:hover {
  background-color: var(--color-bg-card-hover);
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
