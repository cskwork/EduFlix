<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../stores/learning'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import IconSet, { type IconName } from '../components/icons/IconSet.vue'
import { SUBJECT_LABELS } from '../types/content'
import type { Subject } from '../types/content'

const learningStore = useLearningStore()
const router = useRouter()

onMounted(async () => {
  await learningStore.loadKnowledgeMap()
})

const stats = computed(() => learningStore.stats)
const subjectProgress = computed(() => learningStore.subjectProgress)
const nextNodes = computed(() => learningStore.nextRecommendedNodes)

const subjectIcons: Record<Subject, IconName> = {
  math: 'math',
  science: 'science',
  english: 'english',
}

function goToMap() {
  router.push('/map')
}

function goToContent(contentId: string) {
  router.push(`/content/${contentId}`)
}

function resetProgress() {
  if (window.confirm('모든 학습 진행도를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
    learningStore.resetProgress()
  }
}
</script>

<template>
  <div class="my-learning-view">
    <header class="learning-header">
      <h1 class="learning-title">
        <IconSet name="my-learning" :size="32" class="title-icon" />
        내 학습
      </h1>
      <p class="learning-subtitle">학습 진행 현황을 확인하세요</p>
    </header>

    <LoadingSpinner
      v-if="learningStore.isLoading"
      size="lg"
      message="학습 데이터를 불러오는 중..."
    />

    <div v-else class="learning-content">
      <!-- 연속 학습 배너 -->
      <div v-if="stats.streakDays > 0" class="streak-banner">
        <IconSet name="flame" :size="48" class="streak-icon" />
        <div class="streak-info">
          <span class="streak-days">{{ stats.streakDays }}일 연속</span>
          <span class="streak-label">학습 중!</span>
        </div>
      </div>

      <!-- 통계 카드 그리드 -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.completedNodes }}</span>
          <span class="stat-label">완료한 주제</span>
          <span class="stat-total">/ {{ stats.totalNodes }}개</span>
        </div>

        <div class="stat-card">
          <span class="stat-value">{{ stats.inProgressNodes }}</span>
          <span class="stat-label">진행 중</span>
          <span class="stat-total">개 주제</span>
        </div>

        <div class="stat-card">
          <span class="stat-value">{{ stats.completedContents }}</span>
          <span class="stat-label">학습한 콘텐츠</span>
          <span class="stat-total">/ {{ stats.totalContents }}개</span>
        </div>

        <div class="stat-card">
          <span class="stat-value">{{ stats.streakDays }}</span>
          <span class="stat-label">연속 학습</span>
          <span class="stat-total">일</span>
        </div>
      </div>

      <!-- 과목별 진행도 -->
      <section class="subject-section">
        <h2 class="section-title">과목별 진행도</h2>

        <div class="subject-progress-list">
          <div
            v-for="progress in subjectProgress"
            :key="progress.subject"
            class="subject-progress-item"
          >
            <div class="subject-info">
              <IconSet :name="subjectIcons[progress.subject]" :size="24" class="subject-icon" />
              <span class="subject-name">{{ SUBJECT_LABELS[progress.subject] }}</span>
            </div>

            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="progress.subject"
                  :style="{ width: `${progress.percentage}%` }"
                ></div>
              </div>
              <span class="progress-percent">{{ progress.percentage }}%</span>
            </div>

            <span class="progress-detail">
              {{ progress.completedNodes }}/{{ progress.totalNodes }}
            </span>
          </div>
        </div>
      </section>

      <!-- 추천 학습 -->
      <section v-if="nextNodes.length > 0" class="next-section">
        <h2 class="section-title">추천 학습</h2>

        <div class="next-nodes">
          <div
            v-for="node in nextNodes"
            :key="node.id"
            class="next-node-card"
            @click="node.contentIds[0] && goToContent(node.contentIds[0])"
          >
            <IconSet :name="subjectIcons[node.subject]" :size="24" class="next-icon" />
            <div class="next-info">
              <span class="next-name">{{ node.name }}</span>
              <span class="next-subject">{{ SUBJECT_LABELS[node.subject] }}</span>
            </div>
            <IconSet v-if="node.contentIds.length > 0" name="arrow-right" :size="18" class="next-arrow" />
          </div>
        </div>
      </section>

      <!-- 액션 버튼 -->
      <div class="action-buttons">
        <button class="btn-primary" @click="goToMap">
          <IconSet name="learning-map" :size="20" />
          학습맵 보기
        </button>
        <button class="btn-secondary" @click="resetProgress">
          초기화
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-learning-view {
  min-height: 100%;
  padding: var(--spacing-lg) var(--content-padding);
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 20px));
}

.learning-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.learning-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  color: rgba(255, 255, 255, 0.8);
}

.learning-subtitle {
  font-size: var(--font-size-base);
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.learning-content {
  max-width: 600px;
  margin: 0 auto;
}

/* 연속 학습 배너 */
.streak-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(255, 107, 107, 0.1));
  border-radius: 16px;
  border: 1px solid rgba(229, 9, 20, 0.3);
  margin-bottom: var(--spacing-xl);
}

.streak-icon {
  animation: pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.streak-info {
  display: flex;
  flex-direction: column;
}

.streak-days {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.streak-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 통계 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

.stat-total {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

/* 섹션 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 1rem 0;
}

/* 과목별 진행도 */
.subject-section {
  margin-bottom: var(--spacing-xl);
}

.subject-progress-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subject-progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.subject-icon {
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.subject-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.math {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.progress-fill.science {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.progress-fill.english {
  background: linear-gradient(90deg, #a855f7, #c084fc);
}

.progress-percent {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  min-width: 36px;
  text-align: right;
}

.progress-detail {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  min-width: 40px;
  text-align: right;
}

/* 추천 학습 */
.next-section {
  margin-bottom: var(--spacing-xl);
}

.next-nodes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.next-node-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.next-node-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.next-icon {
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.next-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.next-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
}

.next-subject {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.next-arrow {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #e50914;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #b81d24;
}

.btn-secondary {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* 모바일 */
@media (max-width: 479px) {
  .my-learning-view {
    padding: var(--spacing-md) var(--spacing-sm);
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 20px));
  }

  .streak-banner {
    padding: 1rem;
  }

  .streak-icon {
    font-size: 2rem;
  }

  .streak-days {
    font-size: 1.25rem;
  }

  .stats-grid {
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem 0.75rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .subject-progress-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .progress-container {
    order: 3;
    width: 100%;
  }

  .progress-detail {
    order: 2;
    margin-left: auto;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* 데스크톱 */
@media (min-width: 768px) {
  .my-learning-view {
    padding-bottom: var(--spacing-xl);
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
