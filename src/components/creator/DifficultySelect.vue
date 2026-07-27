<script setup lang="ts">
import { computed } from 'vue'
import type { Difficulty } from '../../types/content'
import { DIFFICULTY_EMOJI, difficultyLabel } from '../../i18n/labels'
import { useI18n } from '../../i18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  modelValue: Difficulty | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Difficulty]
}>()

// 난이도 옵션 (학년 대신 사용)
const difficulties = computed<
  {
    value: Difficulty
    label: string
    emoji: string
    desc: string
    example: string
    mappedGrade: string
  }[]
>(() => [
  {
    value: 'easy',
    label: difficultyLabel('easy'),
    emoji: DIFFICULTY_EMOJI.easy,
    desc: t('creator.difficulty.easyDesc'),
    example: t('creator.difficulty.easyExample'),
    mappedGrade: 'elementary-5',
  },
  {
    value: 'medium',
    label: difficultyLabel('medium'),
    emoji: DIFFICULTY_EMOJI.medium,
    desc: t('creator.difficulty.mediumDesc'),
    example: t('creator.difficulty.mediumExample'),
    mappedGrade: 'middle-2',
  },
  {
    value: 'hard',
    label: difficultyLabel('hard'),
    emoji: DIFFICULTY_EMOJI.hard,
    desc: t('creator.difficulty.hardDesc'),
    example: t('creator.difficulty.hardExample'),
    mappedGrade: 'high-2',
  },
])

function selectDifficulty(d: Difficulty) {
  emit('update:modelValue', d)
}

function isSelected(d: Difficulty) {
  return props.modelValue === d
}
</script>

<template>
  <div class="difficulty-select">
    <label class="input-label">{{ t('creator.difficulty.label') }}</label>
    <p class="input-description">
      {{ t('creator.difficulty.description') }}
    </p>

    <div class="difficulty-grid">
      <button
        v-for="d in difficulties"
        :key="d.value"
        type="button"
        class="difficulty-card"
        :class="{ selected: isSelected(d.value) }"
        @click="selectDifficulty(d.value)"
      >
        <span class="difficulty-emoji">{{ d.emoji }}</span>
        <span class="difficulty-label">{{ d.label }}</span>
        <span class="difficulty-desc">{{ d.desc }}</span>
        <span class="difficulty-example">{{ d.example }}</span>
        <span v-if="isSelected(d.value)" class="check-mark">V</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.difficulty-select {
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

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xl) var(--spacing-md);
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  position: relative;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.difficulty-card:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.difficulty-card.selected {
  border-color: var(--color-brand-primary);
  background: rgba(255, 92, 57, 0.08);
}

.difficulty-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.difficulty-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.difficulty-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.difficulty-example {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
  margin-top: var(--spacing-xs);
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
  background: var(--color-brand-primary);
  color: #fff;
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 600px) {
  .difficulty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
