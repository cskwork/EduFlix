<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

// 콘텐츠 존재 여부
const hasContents = computed(() => contentStore.contents.length > 0)

// 첫 번째 콘텐츠 재생
function playFirstContent() {
  const firstContent = contentStore.contents[0]
  if (firstContent) {
    router.push(`/content/${firstContent.id}`)
  }
}

// 콘텐츠 섹션으로 스크롤
function scrollToContent() {
  const contentSection = document.querySelector('.content-sections')
  if (contentSection) {
    contentSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// 창조 모드로 이동
function goToCreateMode() {
  router.push('/create')
}
</script>

<template>
  <div class="home-view">
    <!-- 히어로 섹션 -->
    <section class="hero-section">
      <div class="hero-background">
        <!-- Abstract gradient background representing "Learning Universe" -->
        <div class="hero-gradient"></div>
        <div class="hero-vignette"></div>
      </div>
      
      <div class="hero-content">
        <h1 id="hero-title" class="hero-title">배움이 재미있어지는 순간</h1>
        <p class="hero-subtitle">
          게임, 시뮬레이션, 탐험으로 즐기는 인터랙티브 교육 콘텐츠.<br>
          EduFlix와 함께 새로운 세상으로 떠나보세요.</p>
        
        <div class="hero-actions">
          <button class="btn-hero btn-play" :disabled="!hasContents" @click="playFirstContent">
            <span class="icon">▶</span> 재생
          </button>
          <button class="btn-hero btn-info" @click="scrollToContent">
            <span class="icon">ⓘ</span> 상세 정보
          </button>
        </div>
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
  padding-bottom: 50px;
}

/* 히어로 섹션 */
.hero-section {
  position: relative;
  height: 85vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  padding: 0 var(--content-padding);
  margin-top: calc(var(--header-height) * -1); /* Pull up behind header */
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-gradient {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 70% 20%, #2a2a4e 0%, #141414 70%);
  filter: blur(20px);
}

.hero-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(20, 20, 20, 0.3) 0%,
    rgba(20, 20, 20, 0.1) 60%,
    #141414 100%
  );
}

/* Add left vignette */
.hero-vignette::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(20, 20, 20, 0.8) 0%,
    transparent 50%
  );
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 600px;
  margin-top: 100px; /* Offset for visual balance */
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: #fff;
  margin-bottom: var(--spacing-md);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.1;
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
  font-weight: 500;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.6rem;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all var(--transition-normal);
}

.btn-play {
  background-color: white;
  color: black;
}

.btn-play:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.75);
}

.btn-play:disabled {
  background-color: rgba(255, 255, 255, 0.5);
  color: rgba(0, 0, 0, 0.5);
  cursor: not-allowed;
}

.btn-info {
  background-color: rgba(109, 109, 110, 0.7);
  color: white;
}

.btn-info:hover {
  background-color: rgba(109, 109, 110, 0.4);
}

.icon {
  font-size: 1.2em;
}

/* 콘텐츠 섹션 */
.content-sections {
  position: relative;
  z-index: 20;
  margin-top: -10vh; /* Overlap hero */
  background: transparent;
}
</style>
