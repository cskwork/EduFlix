<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Subject } from '../../types/content'
import { BUILTIN_SUBJECTS, isSubjectSlug } from '../../types/content'
import IconSet, { type IconName } from '../icons/IconSet.vue'

// Props
const props = defineProps<{
  modelValue: Subject | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Subject]
}>()

// 기본 과목 카드 (3개)
const builtinSubjects: { value: Subject; label: string; icon: IconName; color: string }[] = [
  { value: 'math', label: '수학', icon: 'math', color: 'var(--color-subject-math)' },
  { value: 'science', label: '과학', icon: 'science', color: 'var(--color-subject-science)' },
  { value: 'english', label: '영어', icon: 'english', color: 'var(--color-subject-english)' },
]

// 직접 입력 모드
const isCustomMode = ref<boolean>(
  !!props.modelValue && !BUILTIN_SUBJECTS.includes(props.modelValue as never)
)
const customInput = ref<string>(
  isCustomMode.value ? (props.modelValue as string) : ''
)
const customError = ref<string>('')

// 추천 확장 과목 (빠른 선택용)
const suggestions: { slug: Subject; label: string }[] = [
  { slug: 'coding', label: '코딩' },
  { slug: 'toeic', label: '토익' },
  { slug: 'korean-history', label: '한국사' },
  { slug: 'computer-science', label: '컴퓨터과학' },
]

const KO_TO_SLUG: Record<string, string> = {
  '코딩': 'coding', '프로그래밍': 'coding', '코딩테스트': 'coding-test',
  '토익': 'toeic', '토플': 'toefl',
  '한국사': 'korean-history', '세계사': 'world-history',
  '컴퓨터': 'computer-science', '컴퓨터과학': 'computer-science',
  '사회': 'social-studies', '국어': 'korean',
  '수학': 'math', '과학': 'science', '영어': 'english',
  '화학': 'chemistry', '물리': 'physics', '생물': 'biology',
}

function slugifySubject(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (KO_TO_SLUG[trimmed]) return KO_TO_SLUG[trimmed]
  const ascii = trimmed.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return isSubjectSlug(ascii) ? ascii : ''
}

// 선택 처리
function selectBuiltin(subject: Subject) {
  isCustomMode.value = false
  customInput.value = ''
  customError.value = ''
  emit('update:modelValue', subject)
}

function selectSuggestion(slug: Subject) {
  isCustomMode.value = false
  customInput.value = ''
  customError.value = ''
  emit('update:modelValue', slug)
}

function enableCustomMode() {
  isCustomMode.value = true
  if (customInput.value) {
    commitCustom()
  }
}

function commitCustom() {
  const slug = slugifySubject(customInput.value)
  if (!customInput.value.trim()) {
    customError.value = ''
    return
  }
  if (!slug) {
    customError.value = '영문 소문자·숫자·하이픈 slug만 가능해요 (예: coding, toeic)'
    return
  }
  customError.value = ''
  emit('update:modelValue', slug)
}

function onCustomInput(event: Event) {
  customInput.value = (event.target as HTMLInputElement).value
  commitCustom()
}

// 부모가 외부에서 값을 바꾼 경우 동기화
watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      isCustomMode.value = false
      customInput.value = ''
      customError.value = ''
      return
    }
    if (BUILTIN_SUBJECTS.includes(value as never)) {
      isCustomMode.value = false
      customInput.value = ''
    } else {
      isCustomMode.value = true
      if (customInput.value !== value) customInput.value = value
    }
  }
)

function isSelected(subject: Subject) {
  return props.modelValue === subject
}
</script>

<template>
  <div class="subject-select">
    <label class="input-label">어떤 과목으로 배울까요?</label>
    <p class="input-description">기본 과목을 고르거나 직접 입력할 수 있어요.</p>

    <div class="subjects-grid">
      <button
        v-for="subject in builtinSubjects"
        :key="subject.value"
        type="button"
        class="subject-card"
        :class="{ selected: isSelected(subject.value) }"
        :style="{ '--subject-color': subject.color }"
        @click="selectBuiltin(subject.value)"
      >
        <IconSet class="subject-icon" :name="subject.icon" :size="48" />
        <span class="subject-label">{{ subject.label }}</span>
        <span v-if="isSelected(subject.value)" class="check-mark">V</span>
      </button>

      <!-- 직접 입력 카드 -->
      <button
        type="button"
        class="subject-card custom-card"
        :class="{ selected: isCustomMode }"
        :style="{ '--subject-color': 'var(--color-text-secondary)' }"
        @click="enableCustomMode"
      >
        <div class="subject-icon custom-icon">+</div>
        <span class="subject-label">직접 입력</span>
        <span v-if="isCustomMode" class="check-mark">V</span>
      </button>
    </div>

    <!-- 추천 확장 과목 칩 -->
    <div v-if="!isCustomMode" class="suggestions-row">
      <span class="suggestions-label">빠른 선택:</span>
      <button
        v-for="item in suggestions"
        :key="item.slug"
        type="button"
        class="suggestion-pill"
        :class="{ selected: isSelected(item.slug) }"
        @click="selectSuggestion(item.slug)"
      >
        + {{ item.label }}
      </button>
    </div>

    <!-- 직접 입력 펼침 -->
    <transition name="expand">
      <div v-if="isCustomMode" class="custom-input-wrap">
        <label class="custom-label">과목 이름 (영문 slug)</label>
        <input
          :value="customInput"
          type="text"
          class="custom-input"
          placeholder="예: coding, toeic, korean-history, computer-science..."
          autofocus
          @input="onCustomInput"
        />
        <p v-if="customError" class="custom-error">{{ customError }}</p>
        <p v-else-if="customInput && !customError" class="custom-hint">
          저장 경로: <code>public/contents/{{ customInput }}/...</code>
        </p>
        <div v-if="customInput && !customError" class="suggestions-row">
          <span class="suggestions-label">추천:</span>
          <button
            v-for="item in suggestions"
            :key="item.slug"
            type="button"
            class="suggestion-pill"
            :class="{ selected: isSelected(item.slug) }"
            @click="selectSuggestion(item.slug)"
          >
            + {{ item.label }}
          </button>
        </div>
      </div>
    </transition>
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
  grid-template-columns: repeat(4, 1fr);
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

.custom-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  border: 2px dashed var(--color-text-muted);
  border-radius: 50%;
}

.custom-card:hover .custom-icon {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
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

.suggestions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.suggestions-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.suggestion-pill {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.suggestion-pill:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.suggestion-pill.selected {
  background: var(--color-brand-primary);
  color: #fff;
  border-color: var(--color-brand-primary);
}

.custom-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--card-border-radius);
  margin-top: var(--spacing-sm);
}

.custom-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.custom-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.custom-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

.custom-error {
  font-size: var(--font-size-sm);
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
}

.custom-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.custom-hint code {
  background: var(--color-bg-secondary);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono, monospace);
}

.expand-enter-active,
.expand-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 600px) {
  .subjects-grid {
    grid-template-columns: repeat(2, 1fr);
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
