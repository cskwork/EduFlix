<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModeToggle from './ModeToggle.vue'

const route = useRoute()
const router = useRouter()
const isScrolled = ref(false)
const logoImgFailed = ref(false)
type FocusableElement = { focus: () => void }

const isSearchOpen = ref(false)
const searchText = ref('')
const searchInputRef = ref<FocusableElement | null>(null)

// 정적 배포 모드 확인
import { canGenerate } from '../../services/api/capabilities'

const canGenerateContent = computed(() => canGenerate)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 현재 페이지 타이틀 결정
const pageTitle = computed(() => {
  if (route.path === '/') return ''
  if (route.path === '/create') return '콘텐츠 만들기'
  if (route.path.startsWith('/content/')) return '콘텐츠 학습'
  return ''
})

// 네비게이션 항목
const navItems = [
  { name: '홈', path: '/' },
  { name: '수학', path: '/?subject=math' },
  { name: '과학', path: '/?subject=science' },
  { name: '영어', path: '/?subject=english' },
]

// 활성 네비게이션 체크
const isNavActive = (path: string) => {
  if (path === '/') return route.path === '/' && !route.query.subject
  if (path.startsWith('/?')) {
    const subjectMatch = /(?:\?|&)subject=([^&]+)/.exec(path)
    const subject =
      subjectMatch && subjectMatch[1]
        ? decodeURIComponent(subjectMatch[1])
        : null
    if (route.path === '/' && subject) {
      return route.query.subject === subject
    }
  }
  return route.fullPath === path
}

function buildNextQuery(queryText: string) {
  const nextQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (key === 'q') continue
    if (typeof value === 'string') {
      nextQuery[key] = value
    }
  }
  if (queryText) {
    nextQuery.q = queryText
  }
  return nextQuery
}

async function applySearch() {
  const trimmed = searchText.value.trim()
  const nextQuery = buildNextQuery(trimmed)
  if (route.path !== '/') {
    await router.push({ path: '/', query: nextQuery })
  } else {
    await router.push({ query: nextQuery })
  }
}

function clearSearch() {
  searchText.value = ''
  applySearch()
}

function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

function handleSearchEscape() {
  if (searchText.value) {
    clearSearch()
    return
  }
  isSearchOpen.value = false
}

watch(
  () => route.query.q,
  (value) => {
    const query = typeof value === 'string' ? value : ''
    searchText.value = query
    if (query) {
      isSearchOpen.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <header class="app-header" :class="{ scrolled: isScrolled }">
    <div class="header-content">
      <!-- 로고 -->
      <router-link to="/" class="logo">
        <img
          v-if="!logoImgFailed"
          src="/mascot/mascot-wave.webp"
          alt=""
          class="logo-mascot"
          @error="logoImgFailed = true"
        />
        <span class="logo-text">EduFlix</span>
      </router-link>

      <!-- 네비게이션 -->
      <nav class="main-nav">
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.path">
            <router-link :to="item.path" class="nav-link" :class="{ active: isNavActive(item.path) }">
              {{ item.name }}
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- 페이지 타이틀 (모바일에서 표시) -->
      <span v-if="pageTitle" class="page-title">{{ pageTitle }}</span>

      <!-- 우측 영역 -->
      <div class="header-actions">
        <div class="search-wrapper" :class="{ open: isSearchOpen }">
          <button
            class="icon-button"
            aria-label="검색"
            :aria-expanded="isSearchOpen"
            type="button"
            @click="toggleSearch"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </button>

          <form class="search-form" @submit.prevent="applySearch">
            <input
              ref="searchInputRef"
              v-model="searchText"
              class="search-input"
              type="search"
              placeholder="콘텐츠 검색"
              aria-label="콘텐츠 검색"
              @keydown.escape.prevent="handleSearchEscape"
            />
            <button
              v-if="searchText"
              type="button"
              class="search-clear"
              aria-label="검색어 지우기"
              @click="clearSearch"
            >
              ×
            </button>
          </form>
        </div>

        <!-- 모드 토글 (정적 모드에서는 숨김) -->
        <ModeToggle v-if="canGenerateContent" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: linear-gradient(180deg, rgba(255, 246, 235, 0.95) 30%, rgba(255, 246, 235, 0) 100%);
  z-index: var(--z-fixed);
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
}

.app-header.scrolled {
  background: rgba(255, 246, 235, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.06), 0 10px 24px rgba(59, 53, 98, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  height: 100%;
  padding: 0 var(--content-padding);
}

/* 로고 */
.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.logo-mascot {
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: #fff;
  border: var(--border-sticker);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.08);
  transition: transform var(--transition-normal) var(--ease-bounce, ease);
}

.logo:hover .logo-mascot {
  transform: rotate(-8deg) scale(1.08);
}

.logo-text {
  font-family: var(--font-family-display);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-brand-primary);
  letter-spacing: -0.5px;
  text-shadow: 0 2px 0 rgba(59, 53, 98, 0.08);
}

/* 네비게이션 */
.main-nav {
  flex: 1;
}

.nav-list {
  display: flex;
  gap: var(--spacing-sm);
}

.nav-link {
  display: inline-block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-ink);
  background: rgba(255, 176, 31, 0.2);
}

.nav-link.active {
  color: #fff;
  background: var(--color-brand-primary);
  box-shadow: 0 3px 0 rgba(59, 53, 98, 0.15);
}

/* 페이지 타이틀 */
.page-title {
  display: none;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* 우측 액션 영역 */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-text-primary);
  background: #fff;
  border: var(--border-sticker);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.08);
  transition: all var(--transition-fast);
}

.icon-button:hover {
  background: var(--color-subject-english-soft);
  transform: translateY(-1px);
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.search-form {
  position: relative;
  display: flex;
  align-items: center;
  width: 0;
  opacity: 0;
  pointer-events: none;
  transition: width var(--transition-normal), opacity var(--transition-normal);
  overflow: hidden;
}

.search-wrapper.open .search-form {
  width: 240px;
  opacity: 1;
  pointer-events: auto;
}

.search-input {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 0.9rem;
  border-radius: var(--radius-pill);
  border: var(--border-sticker);
  background: #fff;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.06);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

.search-clear {
  position: absolute;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(59, 53, 98, 0.1);
  color: var(--color-text-primary);
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: rgba(59, 53, 98, 0.2);
}

/* 반응형 - 태블릿 이하 */
@media (max-width: 768px) {
  .header-content {
    gap: var(--spacing-md);
  }
  
  .main-nav {
    display: none;
  }

  .page-title {
    display: block;
    flex: 1;
    text-align: center;
  }
  
  .logo-text {
    font-size: var(--font-size-xl);
  }

  .logo-mascot {
    width: 34px;
    height: 34px;
  }

  .search-wrapper.open .search-form {
    width: 160px;
  }
}

@media (max-width: 479px) {
  .header-content {
    padding: 0 var(--spacing-sm);
  }
  
  .icon-button {
    width: 36px;
    height: 36px;
  }
  
  .icon-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>
