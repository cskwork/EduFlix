<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ModeToggle from './ModeToggle.vue'

const route = useRoute()

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
  return route.fullPath === path
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <!-- 로고 -->
      <router-link to="/" class="logo">
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
        <!-- 검색 버튼 (placeholder) -->
        <button class="icon-button" aria-label="검색">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </button>

        <!-- 모드 토글 -->
        <ModeToggle />
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
  background: linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(20, 20, 20, 0.9) 50%, rgba(20, 20, 20, 0) 100%);
  z-index: var(--z-fixed);
  transition: background-color var(--transition-normal);
}

.app-header.scrolled {
  background: var(--color-bg-primary);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  max-width: var(--content-max-width);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--content-padding);
}

/* 로고 */
.logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-brand-primary);
  letter-spacing: -0.5px;
}

/* 네비게이션 */
.main-nav {
  flex: 1;
}

.nav-list {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-text-primary);
}

.nav-link.active {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
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
  transition: background-color var(--transition-fast);
}

.icon-button:hover {
  background: var(--color-bg-card);
}

/* 반응형 - 태블릿 이하 */
@media (max-width: 768px) {
  .main-nav {
    display: none;
  }

  .page-title {
    display: block;
    flex: 1;
    text-align: center;
  }
}
</style>
