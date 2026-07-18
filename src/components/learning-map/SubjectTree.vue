<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KnowledgeNode, LearningStatus } from '../../types/knowledge-map'
import type { Subject, GradeLevel } from '../../types/content'
import { SUBJECT_LABELS, GRADE_LEVEL_LABELS } from '../../types/content'
import NodeCard from './NodeCard.vue'
import IconSet, { type IconName } from '../icons/IconSet.vue'

interface Props {
  subject: Subject
  nodes: KnowledgeNode[]
  getNodeStatus: (nodeId: string) => LearningStatus
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'node-click', node: KnowledgeNode): void
}>()

const isExpanded = ref(false)

const subjectLabel = computed(() => SUBJECT_LABELS[props.subject] ?? props.subject)

const subjectIcon = computed<IconName>(() => {
  const icons: Record<string, IconName> = {
    math: 'math',
    science: 'science',
    english: 'english',
    'world-history': 'world-history',
  }
  return icons[props.subject] ?? 'book'
})

// 학년별로 노드 그룹화
const nodesByGrade = computed(() => {
  const levels: GradeLevel[] = ['elementary', 'middle', 'high']
  const result: { level: GradeLevel; label: string; nodes: KnowledgeNode[] }[] = []

  for (const level of levels) {
    const levelNodes = props.nodes
      .filter((n) => n.gradeLevel === level)
      .sort((a, b) => {
        // 난이도 순 정렬
        const diffA = a.difficulty || 1
        const diffB = b.difficulty || 1
        return diffA - diffB
      })

    if (levelNodes.length > 0) {
      result.push({
        level,
        label: GRADE_LEVEL_LABELS[level],
        nodes: levelNodes,
      })
    }
  }

  return result
})

// 완료된 노드 수
const completedCount = computed(() => {
  return props.nodes.filter((n) => props.getNodeStatus(n.id) === 'completed').length
})

const progressPercent = computed(() => {
  if (props.nodes.length === 0) return 0
  return Math.round((completedCount.value / props.nodes.length) * 100)
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleNodeClick(node: KnowledgeNode) {
  emit('node-click', node)
}
</script>

<template>
  <div class="subject-tree">
    <button class="subject-header" @click="toggleExpand">
      <IconSet :name="subjectIcon" :size="28" class="subject-icon" />
      <span class="subject-label">{{ subjectLabel }}</span>

      <div class="subject-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span class="progress-text">{{ completedCount }}/{{ nodes.length }}</span>
      </div>

      <span class="expand-icon" :class="{ expanded: isExpanded }">▼</span>
    </button>

    <Transition name="collapse">
      <div v-if="isExpanded" class="subject-content">
        <div v-for="group in nodesByGrade" :key="group.level" class="grade-group">
          <h3 class="grade-header">
            <span class="grade-label">{{ group.label }}</span>
            <span class="grade-count">{{ group.nodes.length }}개 주제</span>
          </h3>

          <div class="nodes-list">
            <NodeCard
              v-for="node in group.nodes"
              :key="node.id"
              :node="node"
              :status="getNodeStatus(node.id)"
              @click="handleNodeClick"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.subject-tree {
  margin-bottom: 1rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-card);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
}

.subject-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.subject-header:hover {
  background: var(--color-bg-card-hover);
}

.subject-icon {
  color: var(--color-text-secondary);
}

.subject-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-ink);
}

.subject-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: rgba(59, 53, 98, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-accent));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  min-width: 40px;
}

.expand-icon {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.subject-content {
  padding: 1rem;
}

.grade-group {
  margin-bottom: 1.5rem;
}

.grade-group:last-child {
  margin-bottom: 0;
}

.grade-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(59, 53, 98, 0.1);
}

.grade-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.grade-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 400;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 애니메이션 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}

/* 모바일 */
@media (max-width: 479px) {
  .subject-header {
    padding: 0.875rem 1rem;
    gap: 0.5rem;
  }

  .subject-icon {
    font-size: 1.25rem;
  }

  .subject-label {
    font-size: 1rem;
  }

  .progress-bar {
    width: 60px;
  }

  .subject-content {
    padding: 0.75rem;
  }
}
</style>
