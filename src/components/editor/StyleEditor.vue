<script setup lang="ts">
// 스타일 편집 컴포넌트 (색상, 폰트 크기)
import { computed } from 'vue'
import type { EditableStyle } from '../../types/editor'
import { useI18n } from '../../i18n'

const { t } = useI18n()

const props = defineProps<{
  styles: EditableStyle[]
}>()

const emit = defineEmits<{
  update: [style: EditableStyle]
}>()

// 카테고리별 스타일 그룹화
const groupedStyles = computed(() => {
  const groups: Record<string, EditableStyle[]> = {}

  props.styles.forEach(style => {
    const category = style.category || 'other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(style)
  })

  return groups
})

// 카테고리 라벨
const categoryLabels = computed<Record<string, string>>(() => ({
  primary: t('editor.style.category.primary'),
  secondary: t('editor.style.category.secondary'),
  accent: t('editor.style.category.accent'),
  background: t('editor.style.category.background'),
  text: t('editor.style.category.text'),
  other: t('editor.style.category.other')
}))

// 색상 변경 핸들러
function handleColorChange(style: EditableStyle, newValue: string) {
  emit('update', { ...style, value: newValue })
}

// 프리셋 색상
const colorPresets = [
  '#FF7043', '#FFCA28', '#4CAF50', '#2196F3',
  '#9C27B0', '#E91E63', '#00BCD4', '#607D8B',
  '#F44336', '#FF9800', '#8BC34A', '#3F51B5'
]
</script>

<template>
  <div class="style-editor">
    <div v-if="styles.length === 0" class="empty-state">
      <p>{{ t('editor.style.empty') }}</p>
    </div>

    <div v-else class="style-groups">
      <div
        v-for="(items, category) in groupedStyles"
        :key="category"
        class="style-group"
      >
        <h3 class="group-title">{{ categoryLabels[category] || category }}</h3>

        <div class="style-items">
          <div
            v-for="style in items"
            :key="style.id"
            class="style-item"
          >
            <label :for="style.id" class="style-label">
              {{ style.label }}
            </label>

            <div class="color-picker-wrapper">
              <!-- 색상 미리보기 및 입력 -->
              <div class="color-preview-container">
                <input
                  :id="style.id"
                  type="color"
                  :value="style.value"
                  class="color-input"
                  @input="handleColorChange(style, ($event.target as HTMLInputElement).value)"
                />
                <div
                  class="color-preview"
                  :style="{ backgroundColor: style.value }"
                />
              </div>

              <!-- HEX 값 입력 -->
              <input
                type="text"
                :value="style.value"
                class="hex-input"
                placeholder="#000000"
                maxlength="7"
                @input="handleColorChange(style, ($event.target as HTMLInputElement).value)"
              />
            </div>

            <!-- 프리셋 색상 -->
            <div class="color-presets">
              <button
                v-for="preset in colorPresets"
                :key="preset"
                class="preset-btn"
                :class="{ active: style.value.toLowerCase() === preset.toLowerCase() }"
                :style="{ backgroundColor: preset }"
                :title="preset"
                @click="handleColorChange(style, preset)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 폰트 크기 조절 -->
      <div class="style-group">
        <h3 class="group-title">{{ t('editor.style.fontSizeTitle') }}</h3>
        <div class="font-size-controls">
          <div class="font-size-item">
            <label>{{ t('editor.style.fontSizeLabel') }}</label>
            <div class="size-slider">
              <span class="size-label">A</span>
              <input
                type="range"
                min="80"
                max="120"
                value="100"
                class="slider-input"
                @input="($event.target as HTMLInputElement).nextElementSibling!.textContent = ($event.target as HTMLInputElement).value + '%'"
              />
              <span class="size-value">100%</span>
              <span class="size-label large">A</span>
            </div>
            <p class="size-hint">{{ t('editor.style.fontSizeHint') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.style-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.style-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.style-group {
  background-color: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--radius-sm);
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
  border-bottom: 1px solid rgba(59, 53, 98, 0.08);
}

.style-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.style-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.style-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-preview-container {
  position: relative;
  width: 40px;
  height: 40px;
}

.color-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.color-preview {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px solid rgba(59, 53, 98, 0.15);
  pointer-events: none;
}

.hex-input {
  flex: 1;
  padding: var(--spacing-sm);
  background-color: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: monospace;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.hex-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

/* 프리셋 색상 */
.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.preset-btn:hover {
  transform: scale(1.1);
}

.preset-btn.active {
  border-color: var(--color-text-primary);
}

/* 폰트 크기 조절 */
.font-size-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.font-size-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.font-size-item label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.size-slider {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.size-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.size-label.large {
  font-size: var(--font-size-lg);
}

.slider-input {
  flex: 1;
  accent-color: var(--color-brand-primary);
}

.size-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: center;
}

.size-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
