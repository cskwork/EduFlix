<script setup lang="ts">
// 에러 메시지 컴포넌트
defineProps<{
  title?: string
  message: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="error-container" role="alert">
    <div class="error-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>

    <h2 v-if="title" class="error-title">{{ title }}</h2>
    <p class="error-message">{{ message }}</p>

    <div class="error-actions">
      <button
        v-if="retryLabel"
        type="button"
        class="retry-btn"
        @click="emit('retry')"
      >
        {{ retryLabel }}
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(229, 9, 20, 0.1);
  border-radius: 50%;
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
}

.retry-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: var(--card-border-radius);
  font-weight: var(--font-weight-medium);
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-brand-secondary);
  transform: translateY(-1px);
}

.retry-btn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
</style>
