<script setup lang="ts">
import AppHeader from './components/common/AppHeader.vue'
</script>

<template>
  <div id="app-container">
    <AppHeader />
    <main class="main-content">
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
</style>
