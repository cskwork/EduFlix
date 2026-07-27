<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../stores/learning'
import SubjectTree from '../components/learning-map/SubjectTree.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import ErrorMessage from '../components/common/ErrorMessage.vue'
import IconSet from '../components/icons/IconSet.vue'
import type { KnowledgeNode } from '../types/knowledge-map'
import type { Subject } from '../types/content'
import { useI18n } from '../i18n'
import { learningStatusLabel } from '../i18n/labels'

const { t } = useI18n()
const learningStore = useLearningStore()
const router = useRouter()

onMounted(async () => {
  await learningStore.loadKnowledgeMap()
})

const subjects: Subject[] = ['math', 'science', 'english']

const subjectNodes = computed(() => {
  const result: { subject: Subject; nodes: KnowledgeNode[] }[] = []

  for (const subject of subjects) {
    const nodes = learningStore.nodesBySubject.get(subject) || []
    if (nodes.length > 0) {
      result.push({ subject, nodes })
    }
  }

  return result
})

function handleNodeClick(node: KnowledgeNode) {
  // 연결된 콘텐츠가 있으면 첫 번째 콘텐츠로 이동
  if (node.contentIds.length > 0) {
    router.push(`/content/${node.contentIds[0]}`)
  }
}
</script>

<template>
  <div class="learning-map-view">
    <header class="map-header">
      <h1 class="map-title">
        <IconSet name="learning-map" :size="32" class="title-icon" />
        {{ t('learningMap.title') }}
      </h1>
      <p class="map-subtitle">{{ t('learningMap.subtitle') }}</p>
    </header>

    <!-- 로딩 상태 -->
    <LoadingSpinner
      v-if="learningStore.isLoading"
      size="lg"
      :message="t('learningMap.loading')"
    />

    <!-- 에러 상태 -->
    <ErrorMessage
      v-else-if="learningStore.error"
      :title="t('learningMap.errorTitle')"
      :message="learningStore.error"
      :retry-label="t('common.retry')"
      @retry="learningStore.loadKnowledgeMap()"
    />

    <!-- 학습맵 트리 -->
    <div v-else class="map-content">
      <!-- 상태 범례 -->
      <div class="status-legend">
        <div class="legend-item">
          <IconSet name="completed" :size="20" class="legend-icon" />
          <span class="legend-label">{{ learningStatusLabel('completed') }}</span>
        </div>
        <div class="legend-item">
          <IconSet name="in-progress" :size="20" class="legend-icon" />
          <span class="legend-label">{{ learningStatusLabel('in_progress') }}</span>
        </div>
        <div class="legend-item">
          <IconSet name="available" :size="20" class="legend-icon" />
          <span class="legend-label">{{ learningStatusLabel('available') }}</span>
        </div>
        <div class="legend-item">
          <IconSet name="locked" :size="20" class="legend-icon" />
          <span class="legend-label">{{ learningStatusLabel('locked') }}</span>
        </div>
      </div>

      <!-- 과목별 트리 -->
      <div class="subject-trees">
        <SubjectTree
          v-for="{ subject, nodes } in subjectNodes"
          :key="subject"
          :subject="subject"
          :nodes="nodes"
          :get-node-status="learningStore.getNodeStatus"
          @node-click="handleNodeClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-map-view {
  min-height: 100%;
  padding: var(--spacing-lg) var(--content-padding);
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 20px));
}

.map-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.map-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-family: var(--font-family-display);
  font-weight: normal;
  color: var(--color-ink);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  color: var(--color-brand-primary);
}

.map-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.map-content {
  max-width: 800px;
  margin: 0 auto;
}

/* 상태 범례 */
.status-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-icon {
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.subject-trees {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 모바일 */
@media (max-width: 479px) {
  .learning-map-view {
    padding: var(--spacing-md) var(--spacing-sm);
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 20px));
  }

  .status-legend {
    gap: 1rem;
    padding: 0.75rem;
  }

  .legend-label {
    font-size: 0.75rem;
  }
}

/* 데스크톱 */
@media (min-width: 768px) {
  .learning-map-view {
    padding-bottom: var(--spacing-xl);
  }
}
</style>
