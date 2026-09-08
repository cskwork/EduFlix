<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { PreviewContent } from '../../types/generation'
import {
  subscribeToPreview,
  buildPreviewDocument,
  type PreviewStreamConnection,
} from '../../services/preview/stream'
import { useI18n } from '../../i18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  jobId: string | null
  isActive: boolean
}>()

// 프리뷰 콘텐츠
const previewContent = ref<PreviewContent>({
  phase: 'html',
})

// SSE 연결
let connection: PreviewStreamConnection | null = null

// 현재 단계 라벨
const phaseLabel = computed(() => {
  switch (previewContent.value.phase) {
    case 'html':
      return t('livePreview.phaseShort.html')
    case 'css':
      return t('livePreview.phaseShort.css')
    case 'js':
      return t('livePreview.phaseShort.js')
    case 'complete':
      return t('livePreview.phaseShort.complete')
    default:
      return t('livePreview.phaseShort.idle')
  }
})

// 단계별 아이콘
const phaseIcon = computed(() => {
  switch (previewContent.value.phase) {
    case 'html':
      return '📄'
    case 'css':
      return '🎨'
    case 'js':
      return '⚡'
    case 'complete':
      return '✅'
    default:
      return '⏳'
  }
})

// 진행률 (단계별)
const phaseProgress = computed(() => {
  switch (previewContent.value.phase) {
    case 'html':
      return 25
    case 'css':
      return 50
    case 'js':
      return 75
    case 'complete':
      return 100
    default:
      return 0
  }
})

// iframe srcdoc
const iframeSrcDoc = computed(() => {
  return buildPreviewDocument(previewContent.value)
})

// Subscribe on mount as well as when the active job changes.
watch(
  [() => props.jobId, () => props.isActive],
  ([jobId, isActive]) => {
    connection?.close()
    connection = null
    if (jobId && isActive) startPreviewStream(jobId)
  },
  { immediate: true }
)

// SSE 스트림 시작
function startPreviewStream(jobId: string) {
  // 초기화
  previewContent.value = { phase: 'html' }

  connection = subscribeToPreview(jobId, (content) => {
    previewContent.value = content
  })
}

// 정리
onUnmounted(() => {
  if (connection) {
    connection.close()
    connection = null
  }
})
</script>

<template>
  <div class="live-preview" :class="{ active: isActive }">
    <div class="preview-header">
      <div class="preview-phase">
        <span class="phase-icon">{{ phaseIcon }}</span>
        <span class="phase-label">{{ phaseLabel }}</span>
      </div>
      <div class="preview-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${phaseProgress}%` }"></div>
        </div>
        <div class="phase-indicators">
          <span
            v-for="phase in ['html', 'css', 'js', 'complete']"
            :key="phase"
            class="phase-dot"
            :class="{
              active: phaseProgress >= (phase === 'html' ? 25 : phase === 'css' ? 50 : phase === 'js' ? 75 : 100),
              current: previewContent.phase === phase,
            }"
          >
            {{ phase === 'html' ? '📄' : phase === 'css' ? '🎨' : phase === 'js' ? '⚡' : '✅' }}
          </span>
        </div>
      </div>
    </div>

    <div class="preview-frame-container">
      <iframe
        class="preview-frame"
        :srcdoc="iframeSrcDoc"
        sandbox="allow-scripts"
        :title="t('livePreview.title')"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.live-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
  overflow: hidden;
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
}

.preview-header {
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-accent) 100%);
  color: #fff;
}

.preview-phase {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.phase-icon {
  font-size: 1.25rem;
}

.phase-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.preview-progress {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: var(--radius-pill);
  transition: width 0.5s ease;
}

.phase-indicators {
  display: flex;
  justify-content: space-between;
  padding: 0 var(--spacing-xs);
}

.phase-dot {
  font-size: 0.75rem;
  opacity: 0.4;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.phase-dot.active {
  opacity: 1;
}

.phase-dot.current {
  transform: scale(1.3);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.preview-frame-container {
  flex: 1;
  position: relative;
  min-height: 300px;
}

.preview-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

@media (max-width: 768px) {
  .live-preview {
    min-height: 250px;
  }

  .preview-header {
    padding: var(--spacing-sm);
  }

  .phase-icon {
    font-size: 1rem;
  }

  .phase-label {
    font-size: var(--font-size-xs);
  }
}
</style>
