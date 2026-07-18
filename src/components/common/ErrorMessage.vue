<script setup lang="ts">
// 에러 메시지 컴포넌트
import { ref } from 'vue'

defineProps<{
  title?: string
  message: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const mascotFailed = ref(false)
</script>

<template>
  <div class="error-container" role="alert">
    <div v-if="!mascotFailed" class="mascot-sticker">
      <img
        src="/mascot/mascot-think.webp"
        alt=""
        class="mascot-img"
        @error="mascotFailed = true"
      />
    </div>
    <div v-else class="error-icon">
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

.mascot-sticker {
  width: clamp(140px, 24vw, 200px);
  aspect-ratio: 1;
  background: #fff;
  border: 3px solid rgba(59, 53, 98, 0.1);
  border-radius: 52% 48% 55% 45% / 48% 52% 48% 52%;
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.1), 0 16px 32px rgba(59, 53, 98, 0.12);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.mascot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.error-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 63, 94, 0.12);
  border-radius: 50%;
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  word-break: keep-all;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
}

.retry-btn {
  padding: 0.8rem 1.8rem;
  background: var(--color-brand-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.2);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-brand-secondary);
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(59, 53, 98, 0.2);
}

.retry-btn:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}

.retry-btn:focus-visible {
  outline: 3px solid var(--color-brand-primary);
  outline-offset: 2px;
}
</style>
