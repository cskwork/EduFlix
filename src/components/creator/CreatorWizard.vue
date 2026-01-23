<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Subject, Grade } from '../../types/content'
import type { GenerationProgress, GenerationStatus } from '../../types/generation'
import InterestInput from './InterestInput.vue'
import SubjectSelect from './SubjectSelect.vue'
import GradeSelect from './GradeSelect.vue'
import GenerationProgressVue from './GenerationProgress.vue'

// Router
const router = useRouter()

// 마법사 단계
type WizardStep = 'interests' | 'subject' | 'grade' | 'generating'

// 현재 단계
const currentStep = ref<WizardStep>('interests')

// 폼 데이터
const interests = ref<string[]>([])
const subject = ref<Subject | null>(null)
const grade = ref<Grade | null>(null)

// 생성 진행 상태
const generationProgress = ref<GenerationProgress>({
  status: 'idle',
  progress: 0,
  message: '',
})

// 단계 정보
const steps: { key: WizardStep; label: string; number: number }[] = [
  { key: 'interests', label: '관심사', number: 1 },
  { key: 'subject', label: '과목', number: 2 },
  { key: 'grade', label: '학년', number: 3 },
]

// 현재 단계 인덱스
const currentStepIndex = computed(() => {
  const idx = steps.findIndex((s) => s.key === currentStep.value)
  return idx >= 0 ? idx : 0
})

// 다음 단계로 이동 가능 여부
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'interests':
      return interests.value.length > 0
    case 'subject':
      return subject.value !== null
    case 'grade':
      return grade.value !== null
    default:
      return false
  }
})

// 다음 단계로 이동
function nextStep() {
  if (!canProceed.value) return

  switch (currentStep.value) {
    case 'interests':
      currentStep.value = 'subject'
      break
    case 'subject':
      currentStep.value = 'grade'
      break
    case 'grade':
      startGeneration()
      break
  }
}

// 이전 단계로 이동
function prevStep() {
  switch (currentStep.value) {
    case 'subject':
      currentStep.value = 'interests'
      break
    case 'grade':
      currentStep.value = 'subject'
      break
    case 'generating':
      currentStep.value = 'grade'
      break
  }
}

// 생성 시작
function startGeneration() {
  currentStep.value = 'generating'
  generationProgress.value = {
    status: 'preparing',
    progress: 0,
    message: '콘텐츠 준비 중...',
  }

  // TODO: 실제 AI 생성 API 호출
  // 현재는 시뮬레이션
  simulateGeneration()
}

// 생성 시뮬레이션 (개발용)
function simulateGeneration() {
  const statuses: { status: GenerationStatus; progress: number; message: string }[] = [
    { status: 'preparing', progress: 10, message: '관심사 분석 중...' },
    { status: 'generating', progress: 30, message: 'AI가 콘텐츠 구조를 설계하고 있어요...' },
    { status: 'generating', progress: 50, message: '학습 활동을 만들고 있어요...' },
    { status: 'generating', progress: 70, message: '인터랙션을 추가하고 있어요...' },
    { status: 'generating-images', progress: 85, message: '이미지를 생성하고 있어요...' },
    { status: 'finalizing', progress: 95, message: '마무리 중...' },
    { status: 'completed', progress: 100, message: '완성되었어요!' },
  ]

  let index = 0
  const interval = setInterval(() => {
    const current = statuses[index]
    if (current) {
      generationProgress.value = current
      index++
    } else {
      clearInterval(interval)
    }
  }, 1500)
}

// 생성 취소
function cancelGeneration() {
  generationProgress.value = {
    status: 'idle',
    progress: 0,
    message: '',
  }
  currentStep.value = 'grade'
}

// 재시도
function retryGeneration() {
  startGeneration()
}

// 콘텐츠 보기
function viewContent(_contentId: string) {
  // TODO: 실제 생성된 콘텐츠 ID로 이동
  router.push('/content/generated-content')
}

// 처음부터 다시 시작
function resetWizard() {
  interests.value = []
  subject.value = null
  grade.value = null
  generationProgress.value = {
    status: 'idle',
    progress: 0,
    message: '',
  }
  currentStep.value = 'interests'
}
</script>

<template>
  <div class="creator-wizard">
    <div v-if="currentStep !== 'generating'" class="wizard-header">
      <div class="steps-indicator">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item"
          :class="{
            active: currentStepIndex >= index,
            current: currentStep === step.key,
          }"
        >
          <span class="step-number">{{ step.number }}</span>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>
    </div>

    <div class="wizard-content">
      <transition name="slide" mode="out-in">
        <div v-if="currentStep === 'interests'" key="interests" class="step-content">
          <InterestInput v-model="interests" />
        </div>

        <div v-else-if="currentStep === 'subject'" key="subject" class="step-content">
          <SubjectSelect v-model="subject" />
        </div>

        <div v-else-if="currentStep === 'grade'" key="grade" class="step-content">
          <GradeSelect v-model="grade" />
        </div>

        <div v-else-if="currentStep === 'generating'" key="generating" class="step-content">
          <GenerationProgressVue
            :progress="generationProgress"
            @cancel="cancelGeneration"
            @retry="retryGeneration"
            @view-content="viewContent"
          />
        </div>
      </transition>
    </div>

    <div v-if="currentStep !== 'generating'" class="wizard-footer">
      <button
        v-if="currentStepIndex > 0"
        type="button"
        class="btn btn-secondary"
        @click="prevStep"
      >
        이전
      </button>
      <div v-else></div>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canProceed"
        @click="nextStep"
      >
        {{ currentStep === 'grade' ? '만들기 시작!' : '다음' }}
      </button>
    </div>

    <div
      v-if="generationProgress.status === 'completed'"
      class="wizard-complete-footer"
    >
      <button type="button" class="btn btn-secondary" @click="resetWizard">
        새로운 콘텐츠 만들기
      </button>
    </div>
  </div>
</template>

<style scoped>
.creator-wizard {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.wizard-header {
  margin-bottom: var(--spacing-2xl);
}

.steps-indicator {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.step-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 20px;
  background: var(--color-bg-card);
  opacity: 0.5;
  transition:
    opacity var(--transition-normal),
    background var(--transition-normal);
}

.step-item.active {
  opacity: 1;
}

.step-item.current {
  background: var(--color-brand-primary);
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.step-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.wizard-content {
  min-height: 400px;
}

.step-content {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-bg-card);
}

.wizard-complete-footer {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--card-border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    opacity var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: var(--color-text-primary);
}

.btn-primary:not(:disabled):hover {
  background: var(--color-brand-secondary);
}

.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-text-muted);
}

.btn-secondary:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

@media (max-width: 600px) {
  .creator-wizard {
    padding: var(--spacing-md);
  }

  .steps-indicator {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .step-label {
    display: none;
  }

  .step-item.current .step-label {
    display: inline;
  }
}
</style>
