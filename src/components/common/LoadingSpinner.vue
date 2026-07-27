<script setup lang="ts">
// 로딩 스피너 컴포넌트
import { useI18n } from '../../i18n'

const { t } = useI18n()

defineProps<{
  size?: 'sm' | 'md' | 'lg'
  message?: string
}>()
</script>

<template>
  <div class="loading-container" role="status" aria-live="polite">
    <div class="spinner" :class="[`spinner-${size || 'md'}`]">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
    <span class="sr-only">{{ t('common.loading') }}</span>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-sm {
  width: 24px;
  height: 24px;
}

.spinner-md {
  width: 40px;
  height: 40px;
}

.spinner-lg {
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  border: 3px solid transparent;
  border-top-color: var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-sm .spinner-ring {
  border-width: 2px;
}

.spinner-lg .spinner-ring {
  border-width: 4px;
}

.spinner-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  width: 75%;
  height: 75%;
  animation-delay: -0.3s;
  border-top-color: var(--color-brand-accent);
}

.spinner-ring:nth-child(3) {
  width: 50%;
  height: 50%;
  animation-delay: -0.15s;
  border-top-color: var(--color-text-muted);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

/* 스크린 리더 전용 텍스트 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
