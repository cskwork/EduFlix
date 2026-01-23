<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps<{
  modelValue: string[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

// 현재 입력 값
const inputValue = ref('')

// 태그 추가
function addTag() {
  const trimmed = inputValue.value.trim()
  if (trimmed && !props.modelValue.includes(trimmed)) {
    emit('update:modelValue', [...props.modelValue, trimmed])
  }
  inputValue.value = ''
}

// 태그 제거
function removeTag(index: number) {
  const newTags = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newTags)
}

// Enter 키 처리
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

// 추천 관심사 목록
const suggestions = [
  '공룡',
  '우주',
  '로봇',
  '게임',
  '축구',
  '요리',
  '음악',
  '그림',
  '동물',
  '마법',
]

// 추천 태그 추가
function addSuggestion(suggestion: string) {
  if (!props.modelValue.includes(suggestion)) {
    emit('update:modelValue', [...props.modelValue, suggestion])
  }
}

// 사용 가능한 추천 (아직 선택되지 않은 것)
const availableSuggestions = ref<string[]>([])

watch(
  () => props.modelValue,
  (tags) => {
    availableSuggestions.value = suggestions.filter((s) => !tags.includes(s))
  },
  { immediate: true }
)
</script>

<template>
  <div class="interest-input">
    <label class="input-label">관심사를 알려주세요</label>
    <p class="input-description">좋아하는 것들을 입력하면, AI가 맞춤형 콘텐츠를 만들어요!</p>

    <div class="tags-container">
      <div class="tags-list">
        <span v-for="(tag, index) in modelValue" :key="tag" class="tag">
          {{ tag }}
          <button type="button" class="tag-remove" aria-label="태그 제거" @click="removeTag(index)">
            x
          </button>
        </span>
        <input
          v-model="inputValue"
          type="text"
          class="tag-input"
          placeholder="예: 공룡, 우주, 축구..."
          @keydown="handleKeydown"
          @blur="addTag"
        />
      </div>
    </div>

    <div v-if="availableSuggestions.length > 0" class="suggestions">
      <span class="suggestions-label">추천:</span>
      <button
        v-for="suggestion in availableSuggestions.slice(0, 5)"
        :key="suggestion"
        type="button"
        class="suggestion-tag"
        @click="addSuggestion(suggestion)"
      >
        + {{ suggestion }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.interest-input {
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

.tags-container {
  background: var(--color-bg-card);
  border-radius: var(--card-border-radius);
  padding: var(--spacing-md);
  min-height: 80px;
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
}

.tags-container:focus-within {
  border-color: var(--color-brand-primary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: 20px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  animation: tagAppear 0.2s ease-out;
}

@keyframes tagAppear {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.4);
}

.tag-input {
  flex: 1;
  min-width: 150px;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  padding: var(--spacing-xs);
}

.tag-input::placeholder {
  color: var(--color-text-muted);
}

.tag-input:focus {
  outline: none;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.suggestions-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.suggestion-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-text-muted);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.suggestion-tag:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}
</style>
