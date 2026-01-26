<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import { useKeyboardNavigation } from './composables/useKeyboardNavigation'

// 키보드 네비게이션 활성화
const { handleSkipLink } = useKeyboardNavigation()
const route = useRoute()
const isContentPage = computed(() => route.path.startsWith('/content/'))
</script>

<template>
  <div id="app-container">
    <!-- 스킵 네비게이션 링크 (접근성) -->
    <a
      href="#main-content"
      class="skip-link"
      @click.prevent="handleSkipLink('main-content')"
    >
      메인 콘텐츠로 건너뛰기
    </a>

    <AppHeader v-if="!isContentPage" />
    <main
      id="main-content"
      class="main-content"
      :class="{ 'content-page': isContentPage }"
      role="main"
    >
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app-container {
  min-height: 100vh;
  background-color: var(--color-bg-primary);
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
