<script setup lang="ts">
// 콘텐츠 상세 페이지
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'
import ContentViewer from '../components/viewer/ContentViewer.vue'
import { getContentHtmlPath } from '../services/content/loader'
import { useViewportHeight } from '../composables/useViewportHeight'
import {
  SUBJECT_LABELS,
  GRADE_LEVEL_LABELS,
  CONTENT_TYPE_LABELS,
} from '../types/content'
import type { ContentManifest } from '../types/content'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const contentStore = useContentStore()

// 상태
const isLoading = ref(true)
const error = ref<string | null>(null)
const content = ref<ContentManifest | null>(null)
const viewerRef = ref<InstanceType<typeof ContentViewer> | null>(null)
useViewportHeight()

// 콘텐츠 HTML 경로
const contentSrc = computed(() => {
  if (!content.value) return ''
  return getContentHtmlPath(content.value)
})

// 콘텐츠 메타데이터
const subjectLabel = computed(() => {
  if (!content.value) return ''
  return SUBJECT_LABELS[content.value.subject]
})

const gradeLevelLabel = computed(() => {
  if (!content.value) return ''
  return GRADE_LEVEL_LABELS[content.value.gradeLevel]
})

const contentTypeLabel = computed(() => {
  if (!content.value) return ''
  return CONTENT_TYPE_LABELS[content.value.type]
})

const subjectColorClass = computed(() => {
  if (!content.value) return ''
  return `subject-${content.value.subject}`
})

// 콘텐츠 로드
async function loadContent() {
  isLoading.value = true
  error.value = null

  // 스토어에 콘텐츠가 없으면 먼저 로드
  if (contentStore.contents.length === 0) {
    await contentStore.loadContents()
  }

  // ID로 콘텐츠 찾기
  const found = contentStore.getContentById(props.id)

  if (!found) {
    error.value = '콘텐츠를 찾을 수 없습니다'
    isLoading.value = false
    return
  }

  content.value = found
  isLoading.value = false
}

// 뒤로 가기
function goBack() {
  router.push('/')
}

// 전체화면 토글
function toggleFullscreen() {
  viewerRef.value?.toggleFullscreen()
}

// 콘텐츠 로드 완료 핸들러
function handleViewerLoad() {
  // 추후 analytics 등 추가 가능
}

// 콘텐츠 로드 에러 핸들러
function handleViewerError(err: Error) {
  console.error('콘텐츠 로드 에러:', err)
}

// ID 변경 시 콘텐츠 다시 로드
watch(
  () => props.id,
  () => {
    loadContent()
  }
)

onMounted(() => {
  loadContent()
})
</script>

<template>
  <div class="content-view">
    <!-- 상단 바 -->
    <header class="content-header">
      <button class="back-btn" aria-label="뒤로 가기" @click="goBack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      <div v-if="content" class="content-info">
        <h1 class="content-title">{{ content.title }}</h1>
        <div class="content-meta">
          <span class="badge" :class="subjectColorClass">{{ subjectLabel }}</span>
          <span class="badge badge-outline">{{ gradeLevelLabel }}</span>
          <span class="badge badge-outline">{{ contentTypeLabel }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="action-btn" aria-label="전체화면" @click="toggleFullscreen">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="content-loading">
      <div class="loading-spinner"></div>
      <p>콘텐츠 정보 로딩 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="content-error">
      <div class="error-icon">!</div>
      <h2>콘텐츠를 불러올 수 없습니다</h2>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="goBack">홈으로 돌아가기</button>
    </div>

    <!-- 콘텐츠 뷰어 -->
    <div v-else class="viewer-container">
      <ContentViewer
        ref="viewerRef"
        :src="contentSrc"
        :title="content?.title || '콘텐츠'"
        @load="handleViewerLoad"
        @error="handleViewerError"
      />
    </div>

    <!-- 콘텐츠 설명 (선택적) -->
    <aside v-if="content && content.description" class="content-sidebar">
      <section class="sidebar-section">
        <h3>설명</h3>
        <p>{{ content.description }}</p>
      </section>

      <section v-if="content.tags && content.tags.length > 0" class="sidebar-section">
        <h3>태그</h3>
        <div class="tags">
          <span v-for="tag in content.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </section>

      <section v-if="content.duration" class="sidebar-section">
        <h3>예상 소요 시간</h3>
        <p>약 {{ content.duration }}분</p>
      </section>

      <section v-if="content.difficulty" class="sidebar-section">
        <h3>난이도</h3>
        <p class="difficulty" :class="`difficulty-${content.difficulty}`">
          {{ content.difficulty === 'easy' ? '쉬움' : content.difficulty === 'medium' ? '보통' : '어려움' }}
        </p>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.content-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 상단 바 */
.content-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: linear-gradient(180deg, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.8) 100%);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-lg);
  gap: var(--spacing-md);
  z-index: var(--z-fixed);
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-bg-card);
}

.badge.subject-math {
  background-color: var(--color-subject-math);
  color: #000;
}

.badge.subject-science {
  background-color: var(--color-subject-science);
  color: #000;
}

.badge.subject-english {
  background-color: var(--color-subject-english);
  color: #000;
}

.badge-outline {
  background-color: transparent;
  border: 1px solid var(--color-text-muted);
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 로딩 상태 */
.content-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: var(--header-height);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-bg-card);
  border-top-color: var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content-loading p {
  margin-top: var(--spacing-md);
  color: var(--color-text-secondary);
}

/* 에러 상태 */
.content-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: var(--header-height);
  text-align: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-error);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
}

.content-error h2 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-sm);
}

.content-error p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.retry-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: 4px;
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-fast);
}

.retry-btn:hover {
  background-color: var(--color-brand-secondary);
}

/* 뷰어 컨테이너 */
.viewer-container {
  flex: 1;
  margin-top: var(--header-height);
  height: calc(var(--app-vh, 1vh) * 100 - var(--header-height));
}

/* 사이드바 (큰 화면에서 표시) */
.content-sidebar {
  display: none;
}

@media (min-width: 1200px) {
  .content-view {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .content-header {
    width: 100%;
  }

  .viewer-container {
    flex: 1;
    min-width: 0;
  }

  .content-sidebar {
    display: block;
    width: 300px;
    padding: var(--spacing-lg);
    padding-top: calc(var(--header-height) + var(--spacing-lg));
    background-color: var(--color-bg-secondary);
    border-left: 1px solid var(--color-bg-card);
    height: 100vh;
    position: fixed;
    right: 0;
    top: 0;
    overflow-y: auto;
  }

  .viewer-container {
    margin-right: 300px;
  }
}

.sidebar-section {
  margin-bottom: var(--spacing-xl);
}

.sidebar-section h3 {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.sidebar-section p {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  padding: 4px 12px;
  background-color: var(--color-bg-card);
  border-radius: 16px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.difficulty {
  font-weight: var(--font-weight-medium);
}

.difficulty-easy {
  color: var(--color-success);
}

.difficulty-medium {
  color: var(--color-warning);
}

.difficulty-hard {
  color: var(--color-error);
}
</style>
