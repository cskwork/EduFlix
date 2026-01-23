<script setup lang="ts">
// 빈 상태 컴포넌트
defineProps<{
  title?: string
  message: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="empty-container">
    <div class="empty-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    </div>

    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p class="empty-message">{{ message }}</p>

    <button
      v-if="actionLabel"
      type="button"
      class="action-btn"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
    <slot name="actions"></slot>
  </div>
</template>

<style scoped>
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: 50%;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 350px;
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: var(--card-border-radius);
  font-weight: var(--font-weight-medium);
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-brand-secondary);
  transform: translateY(-1px);
}

.action-btn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
</style>
