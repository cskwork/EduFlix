<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import TabNavigation from './components/tabs/TabNavigation.vue'
import { useKeyboardNavigation } from './composables/useKeyboardNavigation'
import { useI18n } from './i18n'

const { t } = useI18n()

// 키보드 네비게이션 활성화
const { handleSkipLink } = useKeyboardNavigation()
const route = useRoute()
const isContentPage = computed(() => route.path.startsWith('/content/'))
const showTabs = computed(() => route.meta.showTabs === true)
</script>

<template>
  <div id="app-container">
    <!-- 스킵 네비게이션 링크 (접근성) -->
    <a
      href="#main-content"
      class="skip-link"
      @click.prevent="handleSkipLink('main-content')"
    >
      {{ t('app.skipToContent') }}
    </a>

    <AppHeader v-if="!isContentPage" />
    <main
      id="main-content"
      class="main-content"
      :class="{ 'content-page': isContentPage, 'has-tabs': showTabs }"
      role="main"
    >
      <router-view />
    </main>

    <!-- 탭 네비게이션 (모바일: 하단, 데스크톱: 상단) -->
    <TabNavigation v-if="showTabs" />
  </div>
</template>

<style scoped>
#app-container {
  min-height: 100vh;
  /* body의 도트 패턴 배경이 비치도록 투명 유지 */
  background-color: transparent;
  color: var(--color-text-primary);
}

.main-content {
  padding-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
}

.main-content.content-page {
  padding-top: 0;
  min-height: 100vh;
  min-height: calc(var(--app-vh, 1vh) * 100);
  min-height: 100dvh;
}

/* 탭이 있는 페이지: 모바일에서 하단 여백 추가 */
@media (max-width: 767px) {
  .main-content.has-tabs {
    padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
  }
}

/* 스킵 링크 (키보드 사용자를 위한 접근성) */
.skip-link {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
  border-radius: var(--card-border-radius);
  font-weight: var(--font-weight-medium);
  z-index: 9999;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: var(--spacing-md);
}
</style>
