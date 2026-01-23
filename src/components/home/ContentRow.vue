<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { ContentGroup } from '../../types/content'
import ContentCard from './ContentCard.vue'

// Props 정의
defineProps<{
  group: ContentGroup
}>()

// 스크롤 컨테이너 참조
const scrollContainer: Ref<HTMLElement | null> = ref(null)

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
    <div class="row-header">
      <h2 class="row-title">{{ group.subjectLabel }}</h2>
      <div class="row-controls">
        <button
          aria-label="왼쪽으로 스크롤"
          class="scroll-btn scroll-left"
          @click="scroll('left')"
        >
          <span class="arrow">&#10094;</span>
        </button>
        <button
          aria-label="오른쪽으로 스크롤"
          class="scroll-btn scroll-right"
          @click="scroll('right')"
        >
          <span class="arrow">&#10095;</span>
        </button>
      </div>
    </div>
    <div ref="scrollContainer" class="row-content">
      <ContentCard v-for="content in group.contents" :key="content.id" :content="content" />
    </div>
  </section>
</template>

<style scoped>
.content-row {
  margin-bottom: var(--spacing-2xl);
}

.row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--content-padding);
  margin-bottom: var(--spacing-md);
}

.row-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.row-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.scroll-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: 50%;
  color: var(--color-text-primary);
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}

.scroll-btn:hover {
  background: var(--color-bg-card-hover);
  transform: scale(1.1);
}

.arrow {
  font-size: var(--font-size-sm);
}

.row-content {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--content-padding);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.row-content::-webkit-scrollbar {
  display: none;
}

.row-content > :deep(.content-card) {
  scroll-snap-align: start;
}
</style>
