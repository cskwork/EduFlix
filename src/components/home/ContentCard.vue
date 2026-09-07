<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ContentCardData, Subject } from '../../types/content'
import { contentTypeLabel, gradeLevelLabel } from '../../i18n/labels'
import { getContentHtmlPath, IFRAME_SANDBOX_ATTRS } from '../../services/content/loader'
import { createLocalContentUrl, getLocalContent, isLocalContentId } from '../../services/content/localContent'
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
const typeLabel = computed(() => contentTypeLabel(props.content.type))

// 학년 레벨 라벨
const gradeLabel = computed(() => gradeLevelLabel(props.content.gradeLevel))

// Start lesson scripts only when their card reaches the viewport; keep a started
// preview mounted so scrolling back preserves its state.
const thumbnailElement = ref<HTMLElement | null>(null)
const previewActive = ref(false)
let previewObserver: InstanceType<typeof window.IntersectionObserver> | undefined
onMounted(() => {
  if (typeof window.IntersectionObserver === 'undefined') {
    previewActive.value = true
    return
  }
  previewObserver = new window.IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      previewActive.value = true
      previewObserver?.disconnect()
    }
  })
  if (thumbnailElement.value) previewObserver.observe(thumbnailElement.value)
})
onUnmounted(() => previewObserver?.disconnect())

// 콘텐츠 미리보기 URL
const localPreviewUrl = ref('')
const previewUrl = computed(() => isLocalContentId(props.content.id)
  ? localPreviewUrl.value
  : getContentHtmlPath(contentStore.getContentById(props.content.id) ?? props.content))
watch([previewActive, () => props.content.id], async ([active, id], _previous, onCleanup) => {
  if (!active || !isLocalContentId(id)) return
  let disposed = false
  let blobUrl = ''
  onCleanup(() => {
    disposed = true
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    localPreviewUrl.value = ''
  })
  try {
    const local = await getLocalContent(id)
    if (!local || disposed) return
    blobUrl = createLocalContentUrl(local)
    localPreviewUrl.value = blobUrl
  } catch {
    // Missing or inaccessible local content keeps its card without a broken URL.
  }
})
</script>

<template>
  <router-link :to="`/content/${content.id}`" class="content-card" :class="subjectColorClass" @click="handleClick">
    <div ref="thumbnailElement" class="card-thumbnail">
      <div class="iframe-container">
        <iframe
          v-if="previewActive && previewUrl"
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
        <span class="badge badge-grade">{{ gradeLabel }}</span>
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
  border: var(--border-sticker);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition:
    transform var(--transition-normal) var(--ease-bounce),
    box-shadow var(--transition-normal);
  cursor: pointer;
  position: relative;
}

.content-card:hover {
  transform: translateY(-6px) rotate(-1deg) scale(1.02);
  box-shadow: var(--card-shadow-hover);
  z-index: 10;
}

.content-card:focus-visible {
  outline: 3px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-bg-secondary);
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
  background: rgba(59, 53, 98, 0.28);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.content-card:hover .card-overlay {
  opacity: 1;
}

.play-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-primary);
  border: 3px solid #fff;
  border-radius: 50%;
  font-size: 1.25rem;
  color: #fff;
  box-shadow: 0 4px 0 rgba(59, 53, 98, 0.25);
  transition:
    transform var(--transition-fast) var(--ease-bounce),
    background var(--transition-fast);
}

.content-card:hover .play-icon {
  transform: scale(1.12);
  background: var(--color-brand-secondary);
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
  padding: 3px 8px;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-ink);
  border: 1px solid rgba(59, 53, 98, 0.12);
  letter-spacing: 0.3px;
}

.badge-type {
  background: var(--color-brand-primary);
  color: #fff;
  border-color: transparent;
}

/* 과목별 카드 포인트 컬러 (썸네일 하단 라인) */
.subject-math .card-thumbnail::after,
.subject-science .card-thumbnail::after,
.subject-english .card-thumbnail::after,
.subject-world-history .card-thumbnail::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
}

.subject-math .card-thumbnail::after {
  background: var(--color-subject-math);
}

.subject-science .card-thumbnail::after {
  background: var(--color-subject-science);
}

.subject-english .card-thumbnail::after {
  background: var(--color-subject-english);
}

.subject-world-history .card-thumbnail::after {
  background: var(--color-subject-world-history);
}

.card-info {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
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
