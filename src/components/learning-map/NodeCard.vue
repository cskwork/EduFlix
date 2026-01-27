<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeNode, LearningStatus } from '../../types/knowledge-map'
import { GRADE_LEVEL_LABELS } from '../../types/content'
import IconSet, { type IconName } from '../icons/IconSet.vue'

interface Props {
  node: KnowledgeNode
  status: LearningStatus
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'click', node: KnowledgeNode): void
}>()

const statusConfig = computed(() => {
  const configs: Record<LearningStatus, { icon: IconName; label: string; class: string }> = {
    completed: { icon: 'completed', label: '완료', class: 'status-completed' },
    in_progress: { icon: 'in-progress', label: '진행 중', class: 'status-progress' },
    available: { icon: 'available', label: '학습 가능', class: 'status-available' },
    locked: { icon: 'locked', label: '잠금', class: 'status-locked' },
  }
  return configs[props.status]
})

const difficultyStars = computed(() => {
  const difficulty = props.node.difficulty || 1
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty)
})

const gradeLabel = computed(() => {
  const grade = props.node.grade
  if (!grade) return GRADE_LEVEL_LABELS[props.node.gradeLevel]

  const [level, num] = grade.split('-')
  const levelLabel = GRADE_LEVEL_LABELS[level as keyof typeof GRADE_LEVEL_LABELS] || level
  return `${levelLabel} ${num}학년`
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
        <span class="node-difficulty" :title="`난이도 ${node.difficulty || 1}/5`">
          {{ difficultyStars }}
        </span>
      </div>

      <div v-if="contentCount > 0" class="node-contents">
        <IconSet name="book" :size="14" class="content-icon" />
        <span class="content-count">콘텐츠 {{ contentCount }}개</span>
      </div>
    </div>

    <div v-if="status === 'locked'" class="locked-overlay">
      <span class="locked-message">선수 지식을 먼저 학습하세요</span>
    </div>
  </div>
</template>

<style scoped>
.node-card {
  position: relative;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.node-card.clickable {
  cursor: pointer;
}

.node-card.clickable:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

/* 상태별 스타일 */
.node-card.status-completed {
  border-left: 3px solid #4ade80;
}

.node-card.status-progress {
  border-left: 3px solid #facc15;
}

.node-card.status-available {
  border-left: 3px solid #60a5fa;
}

.node-card.status-locked {
  opacity: 0.5;
  border-left: 3px solid #6b7280;
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
  color: #fff;
  margin: 0 0 0.25rem 0;
}

.node-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.node-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.node-difficulty {
  color: #facc15;
  letter-spacing: -1px;
}

.node-contents {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.content-icon {
  color: rgba(255, 255, 255, 0.5);
}

.content-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node-card.status-locked:hover .locked-overlay {
  opacity: 1;
}

.locked-message {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 8px;
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
