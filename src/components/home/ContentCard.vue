<script setup lang="ts">
import { computed } from 'vue'
import type { ContentCardData, Subject } from '../../types/content'
import { CONTENT_TYPE_LABELS, GRADE_LEVEL_LABELS } from '../../types/content'
import { getContentHtmlPath, IFRAME_SANDBOX_ATTRS } from '../../services/content/loader'
import { useContentStore } from '../../stores/content'

// Props 정의
const props = defineProps<{
  content: ContentCardData
}>()

// 스토어
const contentStore = useContentStore()

// 클릭 추적
function handleClick() {
  contentStore.trackContentClick(props.content.id)
}

// 과목별 색상 클래스
const subjectColorClass = computed(() => {
  const colorMap: Record<Subject, string> = {
    math: 'subject-math',
    science: 'subject-science',
    english: 'subject-english',
    'world-history': 'subject-world-history',
  }
  return colorMap[props.content.subject]
})

// 콘텐츠 타입 라벨
const typeLabel = computed(() => CONTENT_TYPE_LABELS[props.content.type])

// 학년 레벨 라벨
const gradeLevelLabel = computed(() => GRADE_LEVEL_LABELS[props.content.gradeLevel])

// 콘텐츠 미리보기 URL
const previewUrl = computed(() => getContentHtmlPath(props.content))
</script>

<template>
  <router-link :to="`/content/${content.id}`" class="content-card" :class="subjectColorClass" @click="handleClick">
    <div class="card-thumbnail">
      <div class="iframe-container">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="preview-iframe"
          :sandbox="IFRAME_SANDBOX_ATTRS"
          tabindex="-1"
          aria-hidden="true"
        ></iframe>
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
  background: #000;
}

.iframe-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.preview-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 1280px; /* Base resolution width */
  height: 720px; /* Base resolution height */
  border: none;
  /* Scale down from 1280x720 to 280x157.5 */
  transform: scale(0.21875);
  transform-origin: 0 0;
  pointer-events: none; /* Disable interaction */
  background-color: #fff;
  opacity: 0.9;
  transition: opacity var(--transition-normal);
}

.content-card:hover .preview-iframe {
  opacity: 1;
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
  display: none; /* Hide description in grid for cleaner look */
}

/* 모바일 반응형 스타일 */
@media (max-width: 479px) {
  .content-card {
    width: 140px;
  }
  
  .preview-iframe {
    transform: scale(0.109375); /* 1280 -> 140 */
  }
  
  .card-info {
    padding: var(--spacing-xs);
  }
  
  .card-title {
    font-size: var(--font-size-xs);
  }
  
  .play-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .badge {
    font-size: 8px;
    padding: 1px 4px;
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .content-card {
    width: 160px;
  }
  
  .preview-iframe {
    transform: scale(0.125); /* 1280 -> 160 */
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .content-card {
    width: 200px;
  }
  
  .preview-iframe {
    transform: scale(0.15625); /* 1280 -> 200 */
  }
}

@media (min-width: 1024px) and (max-width: 1199px) {
  .content-card {
    width: 220px;
  }
  
  .preview-iframe {
    transform: scale(0.171875); /* 1280 -> 220 */
  }
}

@media (min-width: 1200px) {
  .content-card {
    width: 260px;
  }
  
  .preview-iframe {
    transform: scale(0.203125); /* 1280 -> 260 */
  }
}
</style>
