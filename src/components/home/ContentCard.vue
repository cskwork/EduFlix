<script setup lang="ts">
import { computed } from 'vue'
import type { ContentCardData, Subject } from '../../types/content'
import { CONTENT_TYPE_LABELS, GRADE_LEVEL_LABELS } from '../../types/content'

// Props 정의
const props = defineProps<{
  content: ContentCardData
}>()

// 과목별 색상 클래스
const subjectColorClass = computed(() => {
  const colorMap: Record<Subject, string> = {
    math: 'subject-math',
    science: 'subject-science',
    english: 'subject-english',
  }
  return colorMap[props.content.subject]
})

// 콘텐츠 타입 라벨
const typeLabel = computed(() => CONTENT_TYPE_LABELS[props.content.type])

// 학년 레벨 라벨
const gradeLevelLabel = computed(() => GRADE_LEVEL_LABELS[props.content.gradeLevel])
</script>

<template>
  <router-link :to="`/content/${content.id}`" class="content-card" :class="subjectColorClass">
    <div class="card-thumbnail">
      <div class="thumbnail-placeholder">
        <span class="thumbnail-icon">{{ content.subject === 'math' ? '📐' : content.subject === 'science' ? '🔬' : '📚' }}</span>
      </div>
      <div class="card-overlay">
        <span class="play-icon">▶</span>
      </div>
      <div class="card-badges">
        <span class="badge badge-type">{{ typeLabel }}</span>
        <span class="badge badge-grade">{{ gradeLevelLabel }}</span>
      </div>
    </div>
    <div class="card-info">
      <h3 class="card-title">{{ content.title }}</h3>
      <p class="card-description">{{ content.description }}</p>
    </div>
  </router-link>
</template>

<style scoped>
.content-card {
  display: block;
  flex-shrink: 0;
  width: 200px;
  border-radius: var(--card-border-radius);
  background: var(--color-bg-card);
  overflow: hidden;
  transition:
    transform var(--transition-normal),
    box-shadow var(--transition-normal);
  cursor: pointer;
}

.content-card:hover {
  transform: scale(1.05);
  box-shadow: var(--card-shadow-hover);
  z-index: 10;
}

.content-card:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-card) 100%);
}

.thumbnail-icon {
  font-size: 3rem;
  opacity: 0.8;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.content-card:hover .card-overlay {
  opacity: 1;
}

.play-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  font-size: 1.25rem;
  color: var(--color-bg-primary);
  transition: transform var(--transition-fast);
}

.content-card:hover .play-icon {
  transform: scale(1.1);
}

.card-badges {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: 2px 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-text-primary);
}

.badge-type {
  background: var(--color-brand-primary);
}

/* 과목별 그라데이션 */
.subject-math .card-thumbnail {
  border-top: 3px solid var(--color-subject-math);
}

.subject-science .card-thumbnail {
  border-top: 3px solid var(--color-subject-science);
}

.subject-english .card-thumbnail {
  border-top: 3px solid var(--color-subject-english);
}

.card-info {
  padding: var(--spacing-sm);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
