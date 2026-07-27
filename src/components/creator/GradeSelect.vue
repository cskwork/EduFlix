<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Grade, GradeLevel } from '../../types/content'
import { useI18n } from '../../i18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  modelValue: Grade | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Grade]
}>()

// 학교급 선택
const selectedLevel = ref<GradeLevel | null>(null)

// 학교급 옵션
const levels = computed<{ value: GradeLevel; label: string; icon: string }[]>(() => [
  { value: 'elementary', label: t('creator.grade.elementary'), icon: '🏫' },
  { value: 'middle', label: t('creator.grade.middle'), icon: '🎒' },
  { value: 'high', label: t('creator.grade.high'), icon: '🎓' },
])

// 학교급별 학년 수
const gradeCountByLevel: Record<GradeLevel, number> = {
  elementary: 6,
  middle: 3,
  high: 3,
}

// 현재 선택된 학교급의 학년 옵션
const currentGrades = computed<{ value: Grade; label: string }[]>(() => {
  const level = selectedLevel.value
  if (!level) return []

  return Array.from({ length: gradeCountByLevel[level] }, (_, index) => {
    const number = index + 1
    return {
      value: `${level}-${number}` as Grade,
      label: t('creator.grade.gradeNumber', { number }),
    }
  })
})

// 학교급 선택
function selectLevel(level: GradeLevel) {
  selectedLevel.value = level
}

// 학년 선택
function selectGrade(grade: Grade) {
  emit('update:modelValue', grade)
}

// props 변경 시 학교급 자동 선택
watch(
  () => props.modelValue,
  (grade) => {
    if (grade) {
      if (grade.startsWith('elementary')) {
        selectedLevel.value = 'elementary'
      } else if (grade.startsWith('middle')) {
        selectedLevel.value = 'middle'
      } else if (grade.startsWith('high')) {
        selectedLevel.value = 'high'
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="grade-select">
    <label class="input-label">{{ t('creator.grade.label') }}</label>
    <p class="input-description">{{ t('creator.grade.description') }}</p>

    <div class="levels-row">
      <button
        v-for="level in levels"
        :key="level.value"
        type="button"
        class="level-btn"
        :class="{ selected: selectedLevel === level.value }"
        @click="selectLevel(level.value)"
      >
        <span class="level-icon">{{ level.icon }}</span>
        <span class="level-label">{{ level.label }}</span>
      </button>
    </div>

    <transition name="fade">
      <div v-if="selectedLevel" class="grades-row">
        <button
          v-for="grade in currentGrades"
          :key="grade.value"
          type="button"
          class="grade-btn"
          :class="{ selected: modelValue === grade.value }"
          @click="selectGrade(grade.value)"
        >
          {{ grade.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.grade-select {
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

.levels-row {
  display: flex;
  gap: var(--spacing-md);
}

.level-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.level-btn:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.level-btn.selected {
  border-color: var(--color-brand-primary);
  background: rgba(255, 92, 57, 0.08);
}

.level-icon {
  font-size: 1.5rem;
}

.level-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.grades-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}

.grade-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-pill);
  border: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.grade-btn:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.grade-btn.selected {
  background: var(--color-brand-primary);
  color: #fff;
  border-color: var(--color-brand-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .levels-row {
    flex-direction: column;
  }

  .level-btn {
    justify-content: flex-start;
  }
}
</style>
