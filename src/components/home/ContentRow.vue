<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { ContentGroup } from '../../types/content'
import ContentCard from './ContentCard.vue'
import { useDragScroll } from '../../composables/useDragScroll'
import { useI18n } from '../../i18n'

const { t } = useI18n()

// Props 정의
defineProps<{
  group: ContentGroup
}>()

// 스크롤 컨테이너 참조
const scrollContainer: Ref<HTMLElement | null> = ref(null)

// 드래그 스크롤
const { isDragging, startDrag, endDrag } = useDragScroll(scrollContainer)

// 스크롤 함수
function scroll(direction: 'left' | 'right') {
  if (!scrollContainer.value) return

  const scrollAmount = 420 // 카드 2개 정도의 너비
  const newScrollLeft =
    scrollContainer.value.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)

  scrollContainer.value.scrollTo({
    left: newScrollLeft,
    behavior: 'smooth',
  })
}
</script>

<template>
  <section :id="`section-${group.subject}`" class="content-row">
    <h2 class="row-title">{{ group.subjectLabel }}</h2>
    
    <div class="row-container group">
      <button
        :aria-label="t('contentRow.scrollLeft')"
        class="scroll-btn scroll-left"
        @click="scroll('left')"
      >
        <span class="arrow">&#10094;</span>
      </button>

      <div
        ref="scrollContainer"
        class="row-content"
        :class="{ 'is-dragging': isDragging }"
        @mousedown="startDrag"
        @mouseleave="endDrag"
      >
        <ContentCard v-for="content in group.contents" :key="content.id" :content="content" />
      </div>

      <button
        :aria-label="t('contentRow.scrollRight')"
        class="scroll-btn scroll-right"
        @click="scroll('right')"
      >
        <span class="arrow">&#10095;</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.content-row {
  margin-bottom: var(--spacing-2xl);
  position: relative;
}

.row-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-ink);
  margin-bottom: var(--spacing-sm);
  padding: 0 var(--content-padding);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 타이틀 앞 캔디 도트 */
.row-title::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-brand-accent);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.15);
  flex-shrink: 0;
}

.row-container {
  position: relative;
}

/* Scroll Buttons */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  z-index: 20;
  background: #fff;
  border: var(--border-sticker);
  border-radius: 50%;
  color: var(--color-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  box-shadow: 0 4px 0 rgba(59, 53, 98, 0.1);
  transition: opacity var(--transition-normal), background var(--transition-fast);
  cursor: pointer;
}

.row-container:hover .scroll-btn {
  opacity: 1;
}

.scroll-btn:hover {
  background: var(--color-subject-english-soft);
}

.scroll-btn:hover .arrow {
  transform: scale(1.2);
}

.scroll-left {
  left: calc(var(--content-padding) / 3);
}

.scroll-right {
  right: calc(var(--content-padding) / 3);
}

.arrow {
  font-size: 1.4rem;
  line-height: 1;
  transition: transform var(--transition-fast);
}

/* Row Content */
.row-content {
  display: flex;
  gap: var(--spacing-md);
  /* 카드 호버 리프트/그림자가 잘리지 않도록 상하 여백 확보 */
  padding: 10px var(--content-padding) 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.row-content::-webkit-scrollbar {
  display: none;
}

.row-content > :deep(.content-card) {
  scroll-snap-align: start;
}

/* 드래그 스크롤 */
.row-content {
  cursor: grab;
}

.row-content.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
}

.row-content.is-dragging :deep(.content-card) {
  pointer-events: none;
}

/* 모바일에서 스크롤 버튼 숨기기 */
@media (max-width: 767px) {
  .scroll-btn {
    display: none;
  }
}

@media (hover: none) and (pointer: coarse) {
  .scroll-btn {
    display: none;
  }

  .row-content {
    cursor: default;
  }
}

@media (max-width: 479px) {
  .content-row {
    margin-bottom: var(--spacing-xl);
  }
  
  .row-title {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-xs);
  }
  
  .row-content {
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .row-title {
    font-size: var(--font-size-lg);
  }
}
</style>
