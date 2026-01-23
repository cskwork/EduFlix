<script setup lang="ts">
// 콘텐츠 뷰어 - Task 5에서 구현 예정
defineProps<{
  id: string
}>()
</script>

<template>
  <div class="content-view">
    <h1>콘텐츠 뷰어</h1>
    <p>콘텐츠 ID: {{ id }}</p>
  </div>
</template>

<style scoped>
.content-view {
  padding: 2rem;
}
</style>
