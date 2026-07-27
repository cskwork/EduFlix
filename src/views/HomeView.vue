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
import { useI18n } from '../i18n'

const { t } = useI18n()

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
  const confirmed = window.confirm(t('home.confirmClearRecommendations'))
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
      <div class="hero-background" aria-hidden="true">
        <div class="hero-blob hero-blob-mint"></div>
        <div class="hero-blob hero-blob-peach"></div>
        <div class="hero-shape hero-shape-star">★</div>
        <div class="hero-shape hero-shape-plus">+</div>
        <div class="hero-shape hero-shape-ring"></div>
      </div>

      <div class="hero-content">
        <p class="hero-eyebrow">{{ t('home.heroEyebrow') }}</p>
        <h1 id="hero-title" class="hero-title">
          {{ t('home.heroTitleLead')
          }}<span class="hero-highlight">{{ t('home.heroTitleHighlight') }}</span
          >{{ t('home.heroTitleTail') }}
        </h1>
        <p class="hero-subtitle">
          {{ t('home.heroSubtitleLine1') }}<br>
          {{ t('home.heroSubtitleLine2') }}</p>

        <div class="hero-actions">
          <button class="btn-hero btn-play" :disabled="!hasContents" @click="playFirstContent">
            <span class="icon">▶</span> {{ t('home.playFirst') }}
          </button>
          <button class="btn-hero btn-info" @click="scrollToContent">
            {{ t('home.browse') }}
          </button>
        </div>
      </div>

      <div class="hero-mascot" aria-hidden="true">
        <div class="hero-mascot-sticker">
          <img src="/mascot/mascot-rocket.webp" alt="" class="hero-mascot-img" />
        </div>
      </div>
    </section>

    <!-- 로딩 상태 -->
    <LoadingSpinner
      v-if="contentStore.isLoading"
      size="lg"
      :message="t('home.loadingContents')"
    />

    <!-- 에러 상태 -->
    <ErrorMessage
      v-else-if="contentStore.error"
      :title="t('home.errorTitle')"
      :message="contentStore.error"
      :retry-label="t('common.retry')"
      @retry="contentStore.loadContents()"
    />

    <!-- 콘텐츠 목록 -->
    <div v-else class="content-sections">
      <!-- 콘텐츠가 없는 경우 -->
      <EmptyState
        v-if="contentStore.contentGroups.length === 0"
        :title="t('home.emptyTitle')"
        :message="t('home.emptyMessage')"
        :action-label="t('home.emptyAction')"
        @action="goToCreateMode"
      />

      <!-- 추천 콘텐츠 (인기순) -->
      <div class="recommendation-controls">
        <div class="scope-toggle" role="group" :aria-label="t('home.recommendationScopeLabel')">
          <button
            class="scope-button"
            :class="{ active: contentStore.recommendationScope === 'shared' }"
            @click="setRecommendationScope('shared')"
          >
            {{ t('home.scopeShared') }}
          </button>
          <button
            class="scope-button"
            :class="{ active: contentStore.recommendationScope === 'personal' }"
            @click="setRecommendationScope('personal')"
          >
            {{ t('home.scopePersonal') }}
          </button>
        </div>
        <button class="clear-recommendations" @click="clearRecommendations">
          {{ t('home.clearRecommendations') }}
        </button>
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
  border-radius: var(--radius-pill);
  border: var(--border-sticker);
  background: #fff;
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.06);
}

.scope-button {
  border: none;
  border-radius: var(--radius-pill);
  padding: 8px 14px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.scope-button.active {
  background: var(--color-brand-primary);
  color: #fff;
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.15);
}

.clear-recommendations {
  border: var(--border-sticker);
  border-radius: var(--radius-pill);
  padding: 8px 14px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: #fff;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-recommendations:hover {
  color: var(--color-error);
  border-color: rgba(244, 63, 94, 0.35);
  background: #fff5f6;
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
  min-height: 560px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
  padding: calc(var(--header-height) + var(--spacing-xl)) var(--content-padding) var(--spacing-2xl);
  margin-top: calc(var(--header-height) * -1); /* 헤더 뒤로 배경 확장 */
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(160deg, #ffe9d2 0%, var(--color-bg-primary) 65%);
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
}

.hero-blob-mint {
  width: 420px;
  height: 420px;
  background: var(--color-subject-math-soft);
  top: -120px;
  right: 8%;
}

.hero-blob-peach {
  width: 380px;
  height: 380px;
  background: #ffd9c4;
  bottom: -140px;
  left: -60px;
}

.hero-shape {
  position: absolute;
  font-family: var(--font-family-display);
  user-select: none;
}

.hero-shape-star {
  top: 18%;
  left: 55%;
  font-size: 2rem;
  color: var(--color-brand-accent);
  animation: wiggle 3.2s ease-in-out infinite;
}

.hero-shape-plus {
  bottom: 22%;
  left: 42%;
  font-size: 2.4rem;
  color: var(--color-subject-world-history);
  animation: float-bob 4.5s ease-in-out infinite;
}

.hero-shape-ring {
  top: 30%;
  right: 6%;
  width: 34px;
  height: 34px;
  border: 6px solid var(--color-subject-science);
  border-radius: 50%;
  opacity: 0.5;
  animation: float-bob 5.2s ease-in-out 0.8s infinite;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 620px;
  animation: pop-in 0.6s var(--ease-bounce) both;
}

.hero-eyebrow {
  display: inline-block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-brand-secondary);
  background: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  box-shadow: 0 3px 0 rgba(59, 53, 98, 0.08);
  margin-bottom: var(--spacing-md);
}

.hero-title {
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: var(--font-weight-normal);
  color: var(--color-ink);
  margin-bottom: var(--spacing-md);
  line-height: 1.25;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.hero-highlight {
  position: relative;
  color: var(--color-brand-primary);
}

/* 형광펜 밑줄 효과 */
.hero-highlight::after {
  content: '';
  position: absolute;
  left: -2%;
  right: -2%;
  bottom: 0.08em;
  height: 0.35em;
  background: rgba(255, 176, 31, 0.45);
  border-radius: var(--radius-pill);
  z-index: -1;
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
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
  padding: 0.9rem 1.8rem;
  border-radius: var(--radius-pill);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  border: none;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.btn-play {
  background-color: var(--color-brand-primary);
  color: #fff;
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.2);
}

.btn-play:hover:not(:disabled) {
  background-color: var(--color-brand-secondary);
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(59, 53, 98, 0.2);
}

.btn-play:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}

.btn-play:disabled {
  background-color: var(--color-text-muted);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-info {
  background-color: #fff;
  color: var(--color-ink);
  border: var(--border-sticker);
  box-shadow: 0 5px 0 rgba(59, 53, 98, 0.1);
}

.btn-info:hover {
  background-color: var(--color-subject-english-soft);
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(59, 53, 98, 0.1);
}

.btn-info:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.1);
}

.icon {
  font-size: 1.2em;
}

/* 히어로 마스코트 스티커 */
.hero-mascot {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  animation: pop-in 0.7s var(--ease-bounce) 0.15s both;
}

.hero-mascot-sticker {
  width: clamp(240px, 26vw, 380px);
  aspect-ratio: 1;
  background: #fff;
  border: 3px solid rgba(59, 53, 98, 0.1);
  border-radius: 38% 62% 55% 45% / 45% 48% 52% 55%;
  box-shadow: 0 8px 0 rgba(59, 53, 98, 0.1), 0 24px 48px rgba(59, 53, 98, 0.14);
  overflow: hidden;
  transform: rotate(3deg);
  animation: float-bob 4s ease-in-out infinite;
}

.hero-mascot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 콘텐츠 섹션 */
.content-sections {
  position: relative;
  z-index: 20;
  background: transparent;
}

/* 태블릿 반응형 스타일 */
@media (max-width: 1023px) {
  .hero-mascot-sticker {
    width: clamp(200px, 30vw, 280px);
  }
}

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .hero-section {
    flex-direction: column-reverse;
    justify-content: flex-end;
    text-align: center;
    min-height: auto;
    gap: var(--spacing-lg);
    padding-top: calc(var(--header-height) + var(--spacing-lg));
    padding-bottom: var(--spacing-xl);
  }

  .hero-content {
    margin-top: 0;
    max-width: 100%;
  }

  .hero-title {
    font-size: clamp(1.6rem, 7vw, 2.5rem);
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

  .hero-mascot-sticker {
    width: clamp(160px, 44vw, 220px);
  }

  .hero-shape-plus {
    display: none;
  }

  .content-sections {
    margin-top: 0;
  }
}

@media (max-width: 479px) {
  .hero-subtitle {
    font-size: var(--font-size-sm);
  }

  .btn-hero {
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
  }
}
</style>
