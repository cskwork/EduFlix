<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mascotFailed = ref(false)

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="not-found-view">
    <div v-if="!mascotFailed" class="mascot-sticker">
      <img
        src="/mascot/mascot-think.webp"
        alt="고민하는 에듀 마스코트"
        class="mascot-img"
        @error="mascotFailed = true"
      />
    </div>
    <h1 class="not-found-code">404</h1>
    <p class="not-found-message">앗! 여기는 아직 만들어지지 않은 길이에요.</p>
    <button class="home-btn" @click="goHome">홈으로 돌아가기</button>
  </div>
</template>

<style scoped>
.not-found-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: var(--spacing-xl);
}

.mascot-sticker {
  width: clamp(160px, 30vw, 240px);
  aspect-ratio: 1;
  background: #fff;
  border: 3px solid rgba(59, 53, 98, 0.1);
  border-radius: 45% 55% 52% 48% / 50% 46% 54% 50%;
  box-shadow: 0 6px 0 rgba(59, 53, 98, 0.1), 0 20px 40px rgba(59, 53, 98, 0.12);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
  animation: float-bob 3.5s ease-in-out infinite;
}

.mascot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.not-found-code {
  font-family: var(--font-family-display);
  font-size: clamp(4rem, 12vw, 6rem);
  line-height: 1;
  margin: 0;
  color: var(--color-brand-primary);
  text-shadow: 0 4px 0 rgba(59, 53, 98, 0.12);
}

.not-found-message {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin: var(--spacing-md) 0 var(--spacing-xl);
  word-break: keep-all;
}

.home-btn {
  padding: 0.9rem 2rem;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  background-color: var(--color-brand-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.2);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.home-btn:hover {
  background-color: var(--color-brand-secondary);
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(59, 53, 98, 0.2);
}

.home-btn:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}
</style>
