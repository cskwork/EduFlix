<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 현재 모드 상태 (view: 보기 모드, create: 창조 모드)
const currentMode = ref<'view' | 'create'>('view')
const router = useRouter()
const route = useRoute()

// 라우트 기반 모드 결정
const isCreateMode = computed(() => route.path === '/create')

// 모드 전환 핸들러
const toggleMode = () => {
  if (isCreateMode.value) {
    currentMode.value = 'view'
    router.push('/')
  } else {
    currentMode.value = 'create'
    router.push('/create')
  }
}
</script>

<template>
  <button class="mode-toggle" :class="{ 'create-mode': isCreateMode }" @click="toggleMode">
    <span class="toggle-track">
      <span class="toggle-thumb"></span>
    </span>
    <span class="toggle-label">{{ isCreateMode ? '창조' : '보기' }}</span>
  </button>
</template>

<style scoped>
.mode-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-pill);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  transition: background-color var(--transition-normal);
  cursor: pointer;
}

.mode-toggle:hover {
  background: var(--color-bg-card-hover);
}

.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-text-muted);
  border-radius: 12px;
  transition: background-color var(--transition-normal);
}

.create-mode .toggle-track {
  background: var(--color-brand-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(59, 53, 98, 0.3);
  transition: transform var(--transition-normal);
}

.create-mode .toggle-thumb {
  transform: translateX(20px);
}

.toggle-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  min-width: 32px;
}
</style>
