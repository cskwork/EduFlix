<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '../../i18n'

const { t, locale } = useI18n()

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

// 추천 관심사 목록 (현재 언어로 표시 - 태그 자체가 생성 프롬프트에 들어간다)
const suggestions = computed(() => [
  t('creator.interests.suggestions.dinosaur'),
  t('creator.interests.suggestions.space'),
  t('creator.interests.suggestions.robot'),
  t('creator.interests.suggestions.game'),
  t('creator.interests.suggestions.soccer'),
  t('creator.interests.suggestions.cooking'),
  t('creator.interests.suggestions.music'),
  t('creator.interests.suggestions.drawing'),
  t('creator.interests.suggestions.animal'),
  t('creator.interests.suggestions.magic'),
])

// 추천 태그 추가
function addSuggestion(suggestion: string) {
  if (!props.modelValue.includes(suggestion)) {
    emit('update:modelValue', [...props.modelValue, suggestion])
  }
}

// 사용 가능한 추천 (아직 선택되지 않은 것)
const availableSuggestions = ref<string[]>([])

watch(
  [() => props.modelValue, suggestions, locale],
  ([tags, currentSuggestions]) => {
    availableSuggestions.value = currentSuggestions.filter((s) => !tags.includes(s))
  },
  { immediate: true }
)
</script>

<template>
  <div class="interest-input">
    <label class="input-label">{{ t('creator.interests.label') }}</label>
    <p class="input-description">{{ t('creator.interests.description') }}</p>

    <div class="tags-container">
      <div class="tags-list">
        <span v-for="(tag, index) in modelValue" :key="tag" class="tag">
          {{ tag }}
          <button
            type="button"
            class="tag-remove"
            :aria-label="t('creator.interests.removeTag')"
            @click="removeTag(index)"
          >
            x
          </button>
        </span>
        <input
          v-model="inputValue"
          type="text"
          class="tag-input"
          :placeholder="t('creator.interests.placeholder')"
          @keydown="handleKeydown"
          @blur="addTag"
        />
      </div>
    </div>

    <div v-if="availableSuggestions.length > 0" class="suggestions">
      <span class="suggestions-label">{{ t('creator.interests.suggestionsLabel') }}</span>
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
  background: #fff;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  min-height: 80px;
  border: var(--border-sticker);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.tags-container:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
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
  color: #fff;
  border-radius: var(--radius-pill);
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
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
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
  border: var(--border-sticker);
  border-radius: var(--radius-pill);
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
  border-color: var(--color-brand-primary);
}
</style>
