<script setup lang="ts">
import { computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContentStore } from '../stores/content'
import type { RecommendationScope } from '../services/api/recommendations'
import ContentRow from '../components/home/ContentRow.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import ErrorMessage from '../components/common/ErrorMessage.vue'
import EmptyState from '../components/common/EmptyState.vue'
import type { Subject } from '../types/content'

// 콘텐츠 스토어 사용
const contentStore = useContentStore()
const router = useRouter()
const route = useRoute()

// 컴포넌트 마운트 시 콘텐츠 로드
onMounted(async () => {
  await contentStore.loadContents()
  // 추천 목록 로드 (콘텐츠 로드 후)
  contentStore.loadRecommendations()
})

const subjectOptions: Subject[] = ['math', 'science', 'english', 'world-history']

// 해당 과목 섹션으로 스크롤 (콘텐츠 섹션 영역으로 이동)
function scrollToSubjectSection(_subject: Subject) {
  // DOM 렌더링 완료 후 스크롤 실행
  nextTick(() => {
    setTimeout(() => {
      // subject 필터가 적용되면 해당 과목만 표시되므로,
      // 콘텐츠 섹션 영역으로 스크롤하여 히어로를 지나감
      const contentSections = document.querySelector('.content-sections')
      if (contentSections) {
        contentSections.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  })
}

function applyRouteFilters() {
  const subjectParam = route.query.subject
  const subject =
    typeof subjectParam === 'string' && subjectOptions.includes(subjectParam as Subject)
      ? (subjectParam as Subject)
      : null
  contentStore.setSubjectFilter(subject)

  const queryParam = route.query.q
  const query = typeof queryParam === 'string' ? queryParam : ''
  contentStore.setSearchQuery(query)
}

// 라우트 쿼리 변경 감지 및 스크롤
watch(() => route.query, applyRouteFilters, { immediate: true, deep: true })

// 콘텐츠가 로드되고 subject 필터가 있을 때 스크롤
watch(
  () => contentStore.contentGroups,
  (groups) => {
    if (groups.length > 0) {
      const currentSubject = route.query.subject
      if (typeof currentSubject === 'string' && subjectOptions.includes(currentSubject as Subject)) {
        scrollToSubjectSection(currentSubject as Subject)
      }
    }
  },
  { immediate: true }
)

// subject 변경 시 해당 섹션으로 스크롤
watch(
  () => route.query.subject,
  (newSubject) => {
    if (typeof newSubject === 'string' && subjectOptions.includes(newSubject as Subject)) {
      // 콘텐츠가 이미 로드된 경우에만 스크롤
      if (contentStore.contentGroups.length > 0) {
        scrollToSubjectSection(newSubject as Subject)
      }
    }
  }
)

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

async function setRecommendationScope(scope: RecommendationScope) {
  if (contentStore.recommendationScope === scope) {
    return
  }

  await contentStore.setRecommendationScopeMode(scope)
}

async function clearRecommendations() {
  const confirmed = window.confirm('인기 콘텐츠 목록을 초기화하시겠습니까?')
  if (!confirmed) {
    return
  }

  await contentStore.clearRecommendations()
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

      <!-- 추천 콘텐츠 (인기순) -->
      <div class="recommendation-controls">
        <div class="scope-toggle" role="group" aria-label="인기 콘텐츠 집계 범위">
          <button
            class="scope-button"
            :class="{ active: contentStore.recommendationScope === 'shared' }"
            @click="setRecommendationScope('shared')"
          >
            전체 공용
          </button>
          <button
            class="scope-button"
            :class="{ active: contentStore.recommendationScope === 'personal' }"
            @click="setRecommendationScope('personal')"
          >
            개인
          </button>
        </div>
        <button class="clear-recommendations" @click="clearRecommendations">초기화</button>
      </div>

      <ContentRow
        v-if="contentStore.recommendedGroup"
        :group="contentStore.recommendedGroup"
        class="recommended-row"
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

.recommendation-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin: var(--spacing-xl) var(--content-padding) var(--spacing-sm);
}

.scope-toggle {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(20, 20, 20, 0.45);
}

.scope-button {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  cursor: pointer;
}

.scope-button.active {
  background: rgba(229, 9, 20, 0.9);
  color: #fff;
}

.clear-recommendations {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: var(--font-size-sm);
  color: #fff;
  background: rgba(20, 20, 20, 0.5);
  cursor: pointer;
}

.clear-recommendations:hover {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(20, 20, 20, 0.7);
}

@media (max-width: 768px) {
  .recommendation-controls {
    align-items: flex-start;
    flex-direction: column;
  }
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
  font-size: clamp(1.75rem, 5vw, 4rem);
  font-weight: 800;
  color: #fff;
  margin-bottom: var(--spacing-md);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  word-break: keep-all;
  overflow-wrap: break-word;
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

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .hero-section {
    height: auto;
    min-height: 60vh;
    padding-top: calc(var(--header-height) + var(--spacing-xl));
    padding-bottom: var(--spacing-2xl);
  }
  
  .hero-content {
    margin-top: 0;
    max-width: 100%;
  }
  
  .hero-title {
    font-size: clamp(1.5rem, 7vw, 2.5rem);
  }
  
  .hero-subtitle {
    font-size: var(--font-size-base);
  }
  
  .hero-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .btn-hero {
    width: 100%;
    justify-content: center;
  }
  
  .content-sections {
    margin-top: 0;
  }
}

@media (max-width: 479px) {
  .hero-section {
    min-height: 55vh;
  }
  
  .hero-title {
    font-size: 1.5rem;
  }
  
  .hero-subtitle {
    font-size: var(--font-size-sm);
  }
  
  .btn-hero {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }
}
</style>
