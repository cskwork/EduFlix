<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Grade, GradeLevel } from '../../types/content'

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
const levels: { value: GradeLevel; label: string; icon: string }[] = [
  { value: 'elementary', label: '초등학교', icon: '🏫' },
  { value: 'middle', label: '중학교', icon: '🎒' },
  { value: 'high', label: '고등학교', icon: '🎓' },
]

// 학교급별 학년 옵션
const gradesByLevel: Record<GradeLevel, { value: Grade; label: string }[]> = {
  elementary: [
    { value: 'elementary-1', label: '1학년' },
    { value: 'elementary-2', label: '2학년' },
    { value: 'elementary-3', label: '3학년' },
    { value: 'elementary-4', label: '4학년' },
    { value: 'elementary-5', label: '5학년' },
    { value: 'elementary-6', label: '6학년' },
  ],
  middle: [
    { value: 'middle-1', label: '1학년' },
    { value: 'middle-2', label: '2학년' },
    { value: 'middle-3', label: '3학년' },
  ],
  high: [
    { value: 'high-1', label: '1학년' },
    { value: 'high-2', label: '2학년' },
    { value: 'high-3', label: '3학년' },
  ],
}

// 현재 선택된 학교급의 학년 옵션
const currentGrades = computed(() => {
  if (!selectedLevel.value) return []
  return gradesByLevel[selectedLevel.value]
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
    <label class="input-label">학년을 선택해주세요</label>
    <p class="input-description">학년에 맞는 난이도로 콘텐츠를 만들어요.</p>

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
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.level-btn:hover {
  background: var(--color-bg-card-hover);
}

.level-btn.selected {
  border-color: var(--color-brand-primary);
  background: rgba(229, 9, 20, 0.1);
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
  border-radius: var(--card-border-radius);
}

.grade-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: 20px;
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
  color: var(--color-text-primary);
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
