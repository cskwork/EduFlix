<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationStatus, GenerationProgress as ProgressType } from '../../types/generation'
import LivePreview from './LivePreview.vue'

// Props
const props = defineProps<{
  progress: ProgressType
  contentId?: string | null
  jobId?: string | null
}>()

// Emits
const emit = defineEmits<{
  cancel: []
  retry: []
  viewContent: [contentId: string]
  improve: [contentId: string]
}>()

// 상태별 메시지
const statusMessages: Record<GenerationStatus, string> = {
  idle: '대기 중...',
  preparing: '콘텐츠 준비 중...',
  queued: '생성 대기열에 추가되었어요...',
  generating: 'AI가 콘텐츠를 만들고 있어요!',
  'generating-images': '이미지를 생성하고 있어요...',
  reviewing: '콘텐츠 품질을 검토하고 있어요...',
  finalizing: '마무리 중...',
  completed: '완성되었어요!',
  error: '오류가 발생했어요',
}

// 현재 상태 메시지
const currentMessage = computed(() => {
  return props.progress.message || statusMessages[props.progress.status]
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
          취소
        </button>

        <button v-if="isError" type="button" class="btn btn-primary" @click="handleRetry">
          다시 시도
        </button>

        <button
          v-if="isCompleted && props.contentId"
          type="button"
          class="btn btn-primary"
          @click="handleViewContent(props.contentId)"
        >
          콘텐츠 보기
        </button>

        <button
          v-if="isCompleted && props.contentId"
          type="button"
          class="btn btn-secondary btn-improve"
          @click="handleImprove(props.contentId)"
        >
          개선하기
        </button>
      </div>
    </div>

    <div v-if="isInProgress" class="progress-tips">
      <p class="tip-title">잠깐만 기다려주세요!</p>
      <p class="tip-text">AI가 관심사에 맞는 재미있는 콘텐츠를 만들고 있어요.</p>
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

.success-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success);
  color: var(--color-bg-primary);
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
  color: var(--color-text-primary);
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
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
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
  background: var(--color-bg-card);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
  border-radius: 4px;
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
  border-radius: var(--card-border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
}

.btn-primary:hover {
  background: var(--color-brand-secondary);
}

.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-text-muted);
}

.btn-secondary:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.btn-improve {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-improve:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  color: white;
}

.progress-tips {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
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
