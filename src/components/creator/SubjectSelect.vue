<script setup lang="ts">
import type { Subject } from '../../types/content'
import IconSet, { type IconName } from '../icons/IconSet.vue'

// Props
const props = defineProps<{
  modelValue: Subject | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Subject]
}>()

// 과목 옵션
const subjects: { value: Subject; label: string; icon: IconName; color: string }[] = [
  { value: 'math', label: '수학', icon: 'math', color: 'var(--color-subject-math)' },
  { value: 'science', label: '과학', icon: 'science', color: 'var(--color-subject-science)' },
  { value: 'english', label: '영어', icon: 'english', color: 'var(--color-subject-english)' },
]

// 선택 처리
function selectSubject(subject: Subject) {
  emit('update:modelValue', subject)
}

// 선택 여부 확인
function isSelected(subject: Subject) {
  return props.modelValue === subject
}
</script>

<template>
  <div class="subject-select">
    <label class="input-label">어떤 과목으로 배울까요?</label>
    <p class="input-description">콘텐츠에 담길 과목을 선택해주세요.</p>

    <div class="subjects-grid">
      <button
        v-for="subject in subjects"
        :key="subject.value"
        type="button"
        class="subject-card"
        :class="{ selected: isSelected(subject.value) }"
        :style="{ '--subject-color': subject.color }"
        @click="selectSubject(subject.value)"
      >
        <IconSet class="subject-icon" :name="subject.icon" :size="48" />
        <span class="subject-label">{{ subject.label }}</span>
        <span v-if="isSelected(subject.value)" class="check-mark">V</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.subject-select {
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

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.subject-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
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
  position: relative;
}

.subject-card:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.subject-card.selected {
  border-color: var(--subject-color);
  background: color-mix(in srgb, var(--subject-color) 14%, #ffffff);
}

.subject-icon {
  font-size: 3rem;
}

.subject-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
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
  background: var(--subject-color);
  color: #fff;
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

@media (max-width: 600px) {
  .subjects-grid {
    grid-template-columns: 1fr;
  }

  .subject-card {
    flex-direction: row;
    justify-content: flex-start;
    padding: var(--spacing-md);
  }

  .subject-icon {
    font-size: 2rem;
  }
}
</style>
