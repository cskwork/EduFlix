<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'
import ContentRow from '../components/home/ContentRow.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import ErrorMessage from '../components/common/ErrorMessage.vue'
import EmptyState from '../components/common/EmptyState.vue'

// 콘텐츠 스토어 사용
const contentStore = useContentStore()
const router = useRouter()

// 컴포넌트 마운트 시 콘텐츠 로드
onMounted(() => {
  contentStore.loadContents()
})

// 창조 모드로 이동
function goToCreateMode() {
  router.push('/create')
}
</script>

<template>
  <div class="home-view">
    <!-- 히어로 섹션 -->
    <section class="hero-section" aria-labelledby="hero-title">
      <div class="hero-content">
        <h1 id="hero-title" class="hero-title">배움이 재미있어지는 순간</h1>
        <p class="hero-subtitle">
          게임, 시뮬레이션, 탐험으로 즐기는 인터랙티브 교육 콘텐츠
        </p>
      </div>
    </section>

    <!-- 로딩 상태 -->
    <LoadingSpinner
      v-if="contentStore.isLoading"
      size="lg"
      message="콘텐츠를 불러오는 중..."
    />

    <!-- 에러 상태 -->
    <ErrorMessage
      v-else-if="contentStore.error"
      title="콘텐츠를 불러올 수 없습니다"
      :message="contentStore.error"
      retry-label="다시 시도"
      @retry="contentStore.loadContents()"
    />

    <!-- 콘텐츠 목록 -->
    <div v-else class="content-sections">
      <!-- 콘텐츠가 없는 경우 -->
      <EmptyState
        v-if="contentStore.contentGroups.length === 0"
        title="표시할 콘텐츠가 없습니다"
        message="창조 모드에서 AI와 함께 새로운 학습 콘텐츠를 만들어보세요!"
        action-label="콘텐츠 만들기"
        @action="goToCreateMode"
      />

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

/* 콘텐츠 섹션 */
.content-sections {
  padding: var(--spacing-xl) 0;
}
</style>
