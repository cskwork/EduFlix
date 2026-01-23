<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="not-found-view">
    <h1>404</h1>
    <p>페이지를 찾을 수 없습니다.</p>
    <button @click="goHome">홈으로 돌아가기</button>
  </div>
</template>

<style scoped>
.not-found-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.not-found-view h1 {
  font-size: 6rem;
  margin: 0;
  color: #e50914;
}

.not-found-view p {
  font-size: 1.5rem;
  margin: 1rem 0 2rem;
}

.not-found-view button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #e50914;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.not-found-view button:hover {
  background-color: #f40612;
}
</style>
