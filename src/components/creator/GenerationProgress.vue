<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationStatus, GenerationProgress as ProgressType } from '../../types/generation'
import LivePreview from './LivePreview.vue'
import { useI18n, type MessageKey } from '../../i18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  progress: ProgressType
  contentId?: string | null
  jobId?: string | null
  canImprove?: boolean
}>()

// Emits
const emit = defineEmits<{
  cancel: []
  retry: []
  viewContent: [contentId: string]
  improve: [contentId: string]
}>()

// 상태별 메시지 키
const statusMessageKeys: Record<GenerationStatus, MessageKey> = {
  idle: 'generation.status.idle',
  preparing: 'generation.status.preparing',
  queued: 'generation.status.queued',
  generating: 'generation.status.generating',
  'generating-images': 'generation.status.generatingImages',
  reviewing: 'generation.status.reviewing',
  finalizing: 'generation.status.finalizing',
  completed: 'generation.status.completed',
  error: 'generation.status.error',
}

// 현재 상태 메시지 (스토어가 준 메시지가 있으면 우선)
const currentMessage = computed(() => {
  return props.progress.message || t(statusMessageKeys[props.progress.status])
})

// 진행률 표시 여부
const showProgress = computed(() => {
  return !['idle', 'completed', 'error'].includes(props.progress.status)
})

// 완료 여부
const isCompleted = computed(() => props.progress.status === 'completed')

// 에러 여부
const isError = computed(() => props.progress.status === 'error')

// 진행 중 여부
const isInProgress = computed(() => showProgress.value)

// 취소 버튼 클릭
function handleCancel() {
  emit('cancel')
}

// 재시도 버튼 클릭
function handleRetry() {
  emit('retry')
}

// 콘텐츠 보기 버튼 클릭
function handleViewContent(contentId: string) {
  emit('viewContent', contentId)
}

// 개선 버튼 클릭
function handleImprove(contentId: string) {
  emit('improve', contentId)
}
</script>

<template>
  <div class="generation-progress" :class="{ completed: isCompleted, error: isError, 'with-preview': isInProgress && props.jobId }">
    <!-- 실시간 프리뷰 패널 (생성 중일 때만 표시) -->
    <div v-if="isInProgress && props.jobId" class="preview-panel">
      <LivePreview :job-id="props.jobId" :is-active="isInProgress" />
    </div>

    <div class="progress-content">
      <div v-if="isInProgress" class="progress-animation">
        <div class="spinner"></div>
      </div>

      <div v-if="isCompleted" class="success-animation">
        <span class="success-icon">O</span>
      </div>

      <div v-if="isError" class="error-animation">
        <span class="error-icon">!</span>
      </div>

      <h2 class="progress-title">{{ currentMessage }}</h2>

      <div v-if="showProgress" class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress.progress}%` }"></div>
        </div>
        <span class="progress-percent">{{ progress.progress }}%</span>
      </div>

      <p v-if="isError && progress.error" class="error-message">
        {{ progress.error }}
      </p>

      <div class="progress-actions">
        <button v-if="isInProgress" type="button" class="btn btn-secondary" @click="handleCancel">
          {{ t('common.cancel') }}
        </button>

        <button v-if="isError" type="button" class="btn btn-primary" @click="handleRetry">
          {{ t('common.retry') }}
        </button>

        <button
          v-if="isCompleted && props.contentId"
          type="button"
          class="btn btn-primary"
          @click="handleViewContent(props.contentId)"
        >
          {{ t('creator.progress.viewContent') }}
        </button>

        <button
          v-if="isCompleted && props.contentId && canImprove !== false"
          type="button"
          class="btn btn-secondary btn-improve"
          @click="handleImprove(props.contentId)"
        >
          {{ t('creator.progress.improve') }}
        </button>
      </div>
    </div>

    <div v-if="isInProgress" class="progress-tips">
      <p class="tip-title">{{ t('creator.progress.tipTitle') }}</p>
      <p class="tip-text">{{ t('creator.progress.tipText') }}</p>
    </div>
  </div>
</template>

<style scoped>
.generation-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-2xl);
  min-height: 400px;
}

.generation-progress.with-preview {
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: var(--spacing-2xl);
}

.preview-panel {
  flex: 1;
  max-width: 50%;
  min-width: 300px;
}

.generation-progress.with-preview .progress-content {
  flex: 1;
  max-width: 50%;
}

@media (max-width: 900px) {
  .generation-progress.with-preview {
    flex-direction: column;
  }

  .preview-panel {
    max-width: 100%;
    min-height: 250px;
  }

  .generation-progress.with-preview .progress-content {
    max-width: 100%;
  }
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  text-align: center;
}

.progress-animation,
.success-animation,
.error-animation {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 60px;
  height: 60px;
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

.success-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success);
  color: #fff;
  border-radius: 50%;
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  animation: scaleIn 0.3s ease-out;
}

.error-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-error);
  color: #fff;
  border-radius: 50%;
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.progress-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  max-width: 400px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(59, 53, 98, 0.08);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
  border-radius: var(--radius-pill);
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 45px;
}

.error-message {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  max-width: 400px;
}

.progress-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.btn:hover {
  transform: translateY(-2px);
}

.btn:active {
  transform: translateY(2px);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: #fff;
  box-shadow: 0 4px 0 rgba(59, 53, 98, 0.2);
}

.btn-primary:hover {
  background: var(--color-brand-secondary);
}

.btn-primary:active {
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}

.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: var(--border-sticker);
}

.btn-secondary:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.btn-improve {
  background: var(--color-brand-accent);
  color: var(--color-ink);
  border: none;
  box-shadow: 0 4px 0 rgba(59, 53, 98, 0.2);
}

.btn-improve:hover {
  background: #f5a413;
  color: var(--color-ink);
}

.btn-improve:active {
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}

.progress-tips {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  max-width: 400px;
}

.tip-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.tip-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
