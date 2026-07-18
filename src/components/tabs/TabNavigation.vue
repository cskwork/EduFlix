<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconSet, { type IconName } from '../icons/IconSet.vue'

interface Tab {
  id: string
  label: string
  icon: IconName
  path: string
}

const route = useRoute()
const router = useRouter()

const tabs: Tab[] = [
  { id: 'contents', label: '콘텐츠', icon: 'contents', path: '/' },
  { id: 'map', label: '학습맵', icon: 'learning-map', path: '/map' },
  { id: 'my-learning', label: '내 학습', icon: 'my-learning', path: '/my-learning' },
]

const activeTab = computed(() => {
  const path = route.path
  if (path === '/map') return 'map'
  if (path === '/my-learning') return 'my-learning'
  return 'contents'
})

function selectTab(tab: Tab) {
  router.push(tab.path)
}
</script>

<template>
  <nav class="tab-navigation">
    <div class="tab-list">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="selectTab(tab)"
      >
        <IconSet :name="tab.icon" :size="22" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tab-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(59, 53, 98, 0.08);
  padding: env(safe-area-inset-bottom, 0);
}

.tab-list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  min-width: 80px;
}

.tab-item:hover {
  background: rgba(59, 53, 98, 0.05);
}

.tab-item.active {
  background: rgba(255, 92, 57, 0.12);
}

.tab-icon {
  opacity: 0.6;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
}

.tab-item.active .tab-icon {
  opacity: 1;
  transform: scale(1.1);
  color: var(--color-brand-primary);
}

.tab-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color 0.2s ease;
}

.tab-item.active .tab-label {
  color: var(--color-brand-primary);
  font-weight: 600;
}

/* 데스크톱: 상단 탭 바 */
@media (min-width: 768px) {
  .tab-navigation {
    position: relative;
    bottom: auto;
    background: transparent;
    backdrop-filter: none;
    border-top: none;
    border-bottom: 1px solid rgba(59, 53, 98, 0.1);
    padding: 0;
    margin-bottom: 1rem;
  }

  .tab-list {
    justify-content: flex-start;
    gap: 0.5rem;
    max-width: none;
    padding: 0;
  }

  .tab-item {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    min-width: auto;
  }

  .tab-icon {
    width: 20px;
    height: 20px;
  }

  .tab-label {
    font-size: 0.9rem;
  }
}
</style>
