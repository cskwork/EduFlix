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
  width: 280px;
  border-radius: var(--card-border-radius);
  background: var(--color-bg-card);
  overflow: hidden;
  transition:
    transform var(--transition-normal),
    box-shadow var(--transition-normal);
  cursor: pointer;
  position: relative;
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
  aspect-ratio: 16 / 9;
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
  transition: transform var(--transition-normal);
}

.content-card:hover .thumbnail-icon {
  transform: scale(1.1);
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.content-card:hover .card-overlay {
  opacity: 1;
}

.play-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  font-size: 1.25rem;
  color: #fff;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast);
  backdrop-filter: blur(4px);
}

.content-card:hover .play-icon {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.3);
}

.card-badges {
  position: absolute;
  bottom: var(--spacing-xs);
  left: var(--spacing-xs);
  display: flex;
  gap: var(--spacing-xs);
  z-index: 2;
}

.badge {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-text-primary);
  backdrop-filter: blur(4px);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-type {
  background: var(--color-brand-primary);
}

/* Remove subject colored borders for cleaner look */
.card-info {
  padding: var(--spacing-sm);
  background: #181818;
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  display: none; /* Hide description in grid for cleaner look, show on hover maybe? Or just hide like Netflix */
}
</style>
