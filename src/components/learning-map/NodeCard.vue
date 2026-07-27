<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeNode, LearningStatus } from '../../types/knowledge-map'
import { gradeLabel as formatGrade, gradeLevelLabel, learningStatusLabel } from '../../i18n/labels'
import { useI18n } from '../../i18n'
import IconSet, { type IconName } from '../icons/IconSet.vue'

interface Props {
  node: KnowledgeNode
  status: LearningStatus
}

const { t } = useI18n()
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'click', node: KnowledgeNode): void
}>()

const statusConfig = computed(() => {
  const icons: Record<LearningStatus, IconName> = {
    completed: 'completed',
    in_progress: 'in-progress',
    available: 'available',
    locked: 'locked',
  }
  const classes: Record<LearningStatus, string> = {
    completed: 'status-completed',
    in_progress: 'status-progress',
    available: 'status-available',
    locked: 'status-locked',
  }
  return {
    icon: icons[props.status],
    label: learningStatusLabel(props.status),
    class: classes[props.status],
  }
})

const difficultyStars = computed(() => {
  const difficulty = props.node.difficulty || 1
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
})

const gradeLabel = computed(() => {
  const grade = props.node.grade
  if (!grade) return gradeLevelLabel(props.node.gradeLevel)
  return formatGrade(grade)
})

const contentCount = computed(() => props.node.contentIds.length)

function handleClick() {
  if (props.status !== 'locked') {
    emit('click', props.node)
  }
}
</script>

<template>
  <div
    class="node-card"
    :class="[statusConfig.class, { clickable: status !== 'locked' }]"
    @click="handleClick"
  >
    <div class="node-status">
      <IconSet :name="statusConfig.icon" :size="22" class="status-icon" />
    </div>

    <div class="node-content">
      <h4 class="node-name">{{ node.name }}</h4>
      <p class="node-description">{{ node.description }}</p>

      <div class="node-meta">
        <span class="node-grade">{{ gradeLabel }}</span>
        <span
          class="node-difficulty"
          :title="t('learningMap.difficultyTitle', { level: node.difficulty || 1 })"
        >
          {{ difficultyStars }}
        </span>
      </div>

      <div v-if="contentCount > 0" class="node-contents">
        <IconSet name="book" :size="14" class="content-icon" />
        <span class="content-count">{{
          t('learningMap.contentCount', { count: contentCount })
        }}</span>
      </div>
    </div>

    <div v-if="status === 'locked'" class="locked-overlay">
      <span class="locked-message">{{ t('learningMap.lockedHint') }}</span>
    </div>
  </div>
</template>

<style scoped>
.node-card {
  position: relative;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
}

.node-card.clickable {
  cursor: pointer;
}

.node-card.clickable:hover {
  background: var(--color-bg-card-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateX(4px);
}

/* 상태별 스타일 */
.node-card.status-completed {
  border-left: 3px solid var(--color-success);
}

.node-card.status-progress {
  border-left: 3px solid var(--color-warning);
}

.node-card.status-available {
  border-left: 3px solid var(--color-subject-science);
}

.node-card.status-locked {
  opacity: 0.6;
  border-left: 3px solid var(--color-text-muted);
}

.node-status {
  display: flex;
  align-items: flex-start;
  padding-top: 0.25rem;
}

.status-icon {
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 0.25rem 0;
}

.node-description {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.node-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.node-difficulty {
  color: var(--color-brand-accent);
  letter-spacing: -1px;
}

.node-contents {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.content-icon {
  color: var(--color-text-muted);
}

.content-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node-card.status-locked:hover .locked-overlay {
  opacity: 1;
}

.locked-message {
  font-size: 0.8rem;
  color: #fff;
  background: var(--color-ink);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
}

/* 모바일 */
@media (max-width: 479px) {
  .node-card {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .node-name {
    font-size: 0.9rem;
  }

  .node-description {
    font-size: 0.8rem;
  }
}
</style>
