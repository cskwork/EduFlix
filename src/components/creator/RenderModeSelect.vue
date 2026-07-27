<script setup lang="ts">
import { computed } from 'vue'
import type { RenderMode } from '../../types/generation'
import { useI18n } from '../../i18n'

const { t } = useI18n()

// Props
const props = defineProps<{
  modelValue: RenderMode
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: RenderMode]
}>()

// 제작 방식 옵션 (3d가 기본 추천)
const modes = computed<
  {
    value: RenderMode
    label: string
    description: string
    color: string
    recommended?: boolean
  }[]
>(() => [
  {
    value: '3d',
    label: t('creator.renderMode.simulation3dLabel'),
    description: t('creator.renderMode.simulation3dDescription'),
    color: 'var(--color-subject-math)',
    recommended: true,
  },
  {
    value: '3d-game',
    label: t('creator.renderMode.game3dLabel'),
    description: t('creator.renderMode.game3dDescription'),
    color: 'var(--color-subject-science)',
  },
  {
    value: 'canvas-game',
    label: t('creator.renderMode.canvasGameLabel'),
    description: t('creator.renderMode.canvasGameDescription'),
    color: 'var(--color-brand-primary)',
  },
  {
    value: 'svg',
    label: t('creator.renderMode.svgLabel'),
    description: t('creator.renderMode.svgDescription'),
    color: 'var(--color-subject-english)',
  },
  {
    value: 'dom',
    label: t('creator.renderMode.domLabel'),
    description: t('creator.renderMode.domDescription'),
    color: 'var(--color-subject-world-history)',
  },
])

function selectMode(mode: RenderMode) {
  emit('update:modelValue', mode)
}

function isSelected(mode: RenderMode) {
  return props.modelValue === mode
}
</script>

<template>
  <div class="render-mode-select">
    <label class="input-label">{{ t('creator.renderMode.label') }}</label>
    <p class="input-description">{{ t('creator.renderMode.description') }}</p>

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
        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <!-- 3D 시뮬레이션: 입체 큐브 -->
          <template v-if="mode.value === '3d'">
            <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M12 12L20 7.5M12 12V21M12 12L4 7.5" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </template>
          <!-- 3D 게임: 깃발 꽂힌 큐브 -->
          <template v-else-if="mode.value === '3d-game'">
            <path d="M12 8L18 11.5V17.5L12 21L6 17.5V11.5L12 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M12 14.5V21M12 14.5L18 11.5M12 14.5L6 11.5" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M12 8V3M12 3H16L14.5 4.5L16 6H12" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </template>
          <!-- 2D 게임: 게임패드 -->
          <template v-else-if="mode.value === 'canvas-game'">
            <path d="M7 8H17C19.5 8 21 10 21 12.5C21 15 19.5 17 17.5 17C16 17 15 16 14.5 15H9.5C9 16 8 17 6.5 17C4.5 17 3 15 3 12.5C3 10 4.5 8 7 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M8 11V14M6.5 12.5H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="16" cy="11.5" r="1" fill="currentColor" />
            <circle cx="17.5" cy="13.5" r="1" fill="currentColor" />
          </template>
          <!-- 인터랙티브 그림: 커서로 도형 조작 -->
          <template v-else-if="mode.value === 'svg'">
            <circle cx="9" cy="9" r="5" stroke="currentColor" stroke-width="2" />
            <path d="M13.5 13.5L20 20M20 20V16M20 20H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </template>
          <!-- 카드·버튼 활동: 겹친 카드 -->
          <template v-else>
            <rect x="3" y="7" width="14" height="12" rx="2" stroke="currentColor" stroke-width="2" />
            <path d="M8 4H19C20.1 4 21 4.9 21 6V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M7 13H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </template>
        </svg>
        <span class="mode-text">
          <span class="mode-label">
            {{ mode.label }}
            <span v-if="mode.recommended" class="recommended-badge">{{
              t('common.recommended')
            }}</span>
          </span>
          <span class="mode-description">{{ mode.description }}</span>
        </span>
        <span v-if="isSelected(mode.value)" class="check-mark">V</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.render-mode-select {
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
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
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

.mode-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: var(--mode-color);
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mode-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.recommended-badge {
  padding: 1px 8px;
  background: var(--color-brand-accent);
  color: var(--color-ink);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.mode-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
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
