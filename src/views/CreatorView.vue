<script setup lang="ts">
import CreatorWizard from '../components/creator/CreatorWizard.vue'
</script>

<template>
  <div class="creator-view">
    <div class="creator-hero">
      <h1 class="hero-title">나만의 콘텐츠 만들기</h1>
      <p class="hero-description">
        좋아하는 것을 알려주면, AI가 재미있는 학습 콘텐츠를 만들어줘요!
      </p>
    </div>

    <CreatorWizard />
  </div>
</template>

<style scoped>
.creator-view {
  min-height: calc(100vh - var(--header-height));
  padding: var(--spacing-xl) var(--content-padding);
}

.creator-hero {
  text-align: center;
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-xl);
}

.hero-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.hero-description {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 500px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .creator-view {
    padding: var(--spacing-md) var(--spacing-md);
  }

  .creator-hero {
    padding: var(--spacing-lg) 0;
  }

  .hero-title {
    font-size: var(--font-size-2xl);
  }

  .hero-description {
    font-size: var(--font-size-base);
  }
}
</style>
