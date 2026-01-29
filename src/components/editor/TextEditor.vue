<script setup lang="ts">
// 텍스트 편집 컴포넌트
import { computed } from 'vue'
import type { EditableText } from '../../types/editor'

const props = defineProps<{
  texts: EditableText[]
}>()

const emit = defineEmits<{
  update: [text: EditableText]
}>()

// 씬별 텍스트 그룹화
const groupedTexts = computed(() => {
  const groups: Record<string, EditableText[]> = {}

  props.texts.forEach(text => {
    const scene = text.scene || 'global'
    if (!groups[scene]) {
      groups[scene] = []
    }
    groups[scene].push(text)
  })

  return groups
})

// 씬 라벨
const sceneLabels: Record<string, string> = {
  global: '전체',
  hook: '훅 (시작)',
  anchor: '앵커 (복습)',
  story: '스토리',
  core: '핵심 (인터랙션)',
  visualize: '시각화',
  quiz: '퀴즈',
  wrap: '마무리'
}

// 타입 라벨
const typeLabels: Record<string, string> = {
  title: '제목',
  description: '설명',
  instruction: '안내',
  dialogue: '대화',
  label: '라벨'
}

// 텍스트 변경 핸들러
function handleChange(text: EditableText, newValue: string) {
  emit('update', { ...text, value: newValue })
}
</script>

<template>
  <div class="text-editor">
    <div v-if="texts.length === 0" class="empty-state">
      <p>편집 가능한 텍스트가 없습니다</p>
    </div>

    <div v-else class="text-groups">
      <div
        v-for="(items, scene) in groupedTexts"
        :key="scene"
        class="text-group"
      >
        <h3 class="group-title">{{ sceneLabels[scene] || scene }}</h3>

        <div class="text-items">
          <div
            v-for="text in items"
            :key="text.id"
            class="text-item"
          >
            <label :for="text.id" class="text-label">
              <span class="label-main">{{ text.label }}</span>
              <span class="label-type">{{ typeLabels[text.type] || text.type }}</span>
            </label>

            <textarea
              v-if="text.value.length > 50"
              :id="text.id"
              :value="text.value"
              class="text-input text-area"
              rows="3"
              @input="handleChange(text, ($event.target as HTMLTextAreaElement).value)"
            />
            <input
              v-else
              :id="text.id"
              type="text"
              :value="text.value"
              class="text-input"
              @input="handleChange(text, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.text-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.text-group {
  background-color: var(--color-bg-card);
  border-radius: 8px;
  padding: var(--spacing-md);
}

.group-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.text-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.text-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.text-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.label-main {
  color: var(--color-text-primary);
}

.label-type {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background-color: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.text-input {
  width: 100%;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.text-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
}

.text-area {
  resize: vertical;
  min-height: 60px;
}
</style>
