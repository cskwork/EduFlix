<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore } from '../stores/content'
import ContentRow from '../components/home/ContentRow.vue'

// 콘텐츠 스토어 사용
const contentStore = useContentStore()

// 컴포넌트 마운트 시 콘텐츠 로드
onMounted(() => {
  contentStore.loadContents()
})
</script>

<template>
  <div class="home-view">
    <!-- 히어로 섹션 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">배움이 재미있어지는 순간</h1>
        <p class="hero-subtitle">
          게임, 시뮬레이션, 탐험으로 즐기는 인터랙티브 교육 콘텐츠
        </p>
      </div>
    </section>

    <!-- 로딩 상태 -->
    <div v-if="contentStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>콘텐츠를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="contentStore.error" class="error-state">
      <p class="error-message">{{ contentStore.error }}</p>
      <button class="retry-btn" @click="contentStore.loadContents()">다시 시도</button>
    </div>

    <!-- 콘텐츠 목록 -->
    <div v-else class="content-sections">
      <!-- 콘텐츠가 없는 경우 -->
      <div v-if="contentStore.contentGroups.length === 0" class="empty-state">
        <p>표시할 콘텐츠가 없습니다.</p>
        <p class="empty-hint">창조 모드에서 새로운 콘텐츠를 만들어보세요!</p>
      </div>

      <!-- 과목별 콘텐츠 행 -->
      <ContentRow
        v-for="group in contentStore.contentGroups"
        :key="group.subject"
        :group="group"
      />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100%;
}

/* 히어로 섹션 */
.hero-section {
  padding: var(--spacing-2xl) var(--content-padding);
  background: linear-gradient(
    180deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-primary) 100%
  );
}

.hero-content {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.hero-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-bg-card);
  border-top-color: var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 에러 상태 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
}

.error-message {
  color: var(--color-error);
  margin-bottom: var(--spacing-md);
}

.retry-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: var(--card-border-radius);
  font-weight: var(--font-weight-medium);
  transition: background var(--transition-fast);
}

.retry-btn:hover {
  background: var(--color-brand-secondary);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}

/* 콘텐츠 섹션 */
.content-sections {
  padding: var(--spacing-xl) 0;
}
</style>
