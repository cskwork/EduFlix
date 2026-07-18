<script setup lang="ts">
// 빈 상태 컴포넌트
import { ref } from 'vue'

defineProps<{
  title?: string
  message: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()

const mascotFailed = ref(false)
</script>

<template>
  <div class="empty-container">
    <div v-if="!mascotFailed" class="mascot-sticker">
      <img
        src="/mascot/mascot-book.webp"
        alt=""
        class="mascot-img"
        @error="mascotFailed = true"
      />
    </div>
    <div v-else class="empty-icon">
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

.mascot-sticker {
  width: clamp(140px, 24vw, 200px);
  aspect-ratio: 1;
  background: #fff;
  border: 3px solid rgba(59, 53, 98, 0.1);
  border-radius: 48% 52% 45% 55% / 52% 48% 52% 48%;
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.1), 0 16px 32px rgba(59, 53, 98, 0.12);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
  animation: float-bob 3.5s ease-in-out infinite;
}

.mascot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-icon {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-subject-english-soft);
  border-radius: 50%;
  color: var(--color-brand-accent);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  word-break: keep-all;
}

.action-btn {
  padding: 0.8rem 1.8rem;
  background: var(--color-brand-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.2);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast),
    background var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-brand-secondary);
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(59, 53, 98, 0.2);
}

.action-btn:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}
</style>
