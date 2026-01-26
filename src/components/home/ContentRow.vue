<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { ContentGroup } from '../../types/content'
import ContentCard from './ContentCard.vue'
import { useDragScroll } from '../../composables/useDragScroll'

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
  <section class="content-row">
    <h2 class="row-title">{{ group.subjectLabel }}</h2>
    
    <div class="row-container group">
      <button
        aria-label="왼쪽으로 스크롤"
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
        aria-label="오른쪽으로 스크롤"
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
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: #e5e5e5;
  margin-bottom: var(--spacing-sm);
  padding: 0 var(--content-padding);
  transition: color var(--transition-normal);
}

.content-row:hover .row-title {
  color: white;
}

.row-container {
  position: relative;
}

/* Scroll Buttons */
.scroll-btn {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4%;
  min-width: 40px;
  z-index: 20;
  background: rgba(20, 20, 20, 0.5);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.row-container:hover .scroll-btn {
  opacity: 1;
}

.scroll-btn:hover {
  background: rgba(20, 20, 20, 0.7);
  transform: scale(1.0); /* Override default transform */
}

.scroll-btn:hover .arrow {
  transform: scale(1.2);
}

.scroll-left {
  left: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.scroll-right {
  right: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.arrow {
  font-size: 2rem;
  transition: transform var(--transition-fast);
}

/* Row Content */
.row-content {
  display: flex;
  gap: var(--spacing-xs);
  padding: 0 var(--content-padding);
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
  margin-right: 4px; /* Tiny gap */
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
