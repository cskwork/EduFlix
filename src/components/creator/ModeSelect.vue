<script setup lang="ts">
import type { CreatorMode } from '../../types/generation'

// Props
const props = defineProps<{
  modelValue: CreatorMode | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: CreatorMode]
}>()

// 모드 옵션
const modes: {
  value: CreatorMode
  label: string
  description: string
  icon: string
  color: string
}[] = [
  {
    value: 'interest',
    label: '관심사로 만들기',
    description: '좋아하는 것을 고르면 AI가 학습 콘텐츠를 만들어요',
    icon: 'sparkles',
    color: 'var(--color-brand-primary)',
  },
  {
    value: 'problem',
    label: '내 문제로 만들기',
    description: '내가 갖고 있는 문제를 재미있게 변환해요',
    icon: 'wand',
    color: 'var(--color-subject-science)',
  },
]

function selectMode(mode: CreatorMode) {
  emit('update:modelValue', mode)
}

function isSelected(mode: CreatorMode) {
  return props.modelValue === mode
}
</script>

<template>
  <div class="mode-select">
    <label class="input-label">어떻게 만들까요?</label>
    <p class="input-description">두 가지 방법 중 하나를 골라주세요.</p>

    <div class="modes-grid">
      <button
        v-for="mode in modes"
        :key="mode.value"
        type="button"
        class="mode-card"
        :class="{ selected: isSelected(mode.value) }"
        :style="{ '--mode-color': mode.color }"
        @click="selectMode(mode.value)"
      >
        <div class="mode-icon-wrap">
          <svg v-if="mode.icon === 'sparkles'" class="mode-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M19 3L19.7 5.3L22 6L19.7 6.7L19 9L18.3 6.7L16 6L18.3 5.3L19 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M5 14L5.7 16.3L8 17L5.7 17.7L5 20L4.3 17.7L2 17L4.3 16.3L5 14Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
          <svg v-else class="mode-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19L9 15M9 15L13 11M9 15L15 9L19 5M13 11L17 7M13 11L9 7M19 5H15M19 5V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <div class="mode-text">
          <span class="mode-label">{{ mode.label }}</span>
          <span class="mode-description">{{ mode.description }}</span>
        </div>
        <span v-if="isSelected(mode.value)" class="check-mark">V</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mode-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-label {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.input-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: calc(-1 * var(--spacing-sm));
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  text-align: left;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
  position: relative;
}

.mode-card:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.mode-card.selected {
  border-color: var(--mode-color);
  background: color-mix(in srgb, var(--mode-color) 14%, #ffffff);
}

.mode-icon-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--mode-color) 12%, #ffffff);
  border-radius: var(--radius-md);
}

.mode-icon {
  width: 32px;
  height: 32px;
  color: var(--mode-color);
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.mode-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.check-mark {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mode-color);
  color: #fff;
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 600px) {
  .modes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
