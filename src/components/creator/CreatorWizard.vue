<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Subject, Grade } from '../../types/content'
import type { RenderMode } from '../../types/generation'
import InterestInput from './InterestInput.vue'
import SubjectSelect from './SubjectSelect.vue'
import GradeSelect from './GradeSelect.vue'
import RenderModeSelect from './RenderModeSelect.vue'
import GenerationProgressVue from './GenerationProgress.vue'
import { useGenerationStore } from '../../stores/generation'

// Router
const router = useRouter()

// Generation Store
const generationStore = useGenerationStore()

// 마법사 단계
type WizardStep = 'interests' | 'subject' | 'grade' | 'mode' | 'generating'

// 현재 단계
const currentStep = ref<WizardStep>('interests')

// 폼 데이터 (제작 방식은 3D 시뮬레이션이 기본값)
const interests = ref<string[]>([])
const subject = ref<Subject | null>(null)
const grade = ref<Grade | null>(null)
const renderMode = ref<RenderMode>('3d')

// 생성된 콘텐츠 ID
const generatedContentId = ref<string | null>(null)

// 생성된 콘텐츠 경로 (리뷰에 필요)
const generatedModulePath = ref<string | null>(null)

// 생성 진행 상태 (스토어에서 가져옴)
const generationProgress = computed(() => generationStore.currentProgress)

// 현재 작업 ID (실시간 프리뷰용)
const currentJobId = computed(() => generationStore.currentJobId)

// 단계 정보
const steps: { key: WizardStep; label: string; number: number }[] = [
  { key: 'interests', label: '관심사', number: 1 },
  { key: 'subject', label: '과목', number: 2 },
  { key: 'grade', label: '학년', number: 3 },
  { key: 'mode', label: '만드는 방식', number: 4 },
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
    case 'mode':
      return renderMode.value !== null
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
      currentStep.value = 'mode'
      break
    case 'mode':
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
    case 'mode':
      currentStep.value = 'grade'
      break
    case 'generating':
      currentStep.value = 'mode'
      break
  }
}

// 생성 시작
async function startGeneration() {
  if (!subject.value || !grade.value) return

  currentStep.value = 'generating'
  generatedContentId.value = null

  try {
    const result = await generationStore.startGeneration({
      interests: interests.value,
      subject: subject.value,
      grade: grade.value,
      language: subject.value === 'english' ? 'en' : 'ko',
      renderMode: renderMode.value,
    })

    if (result.success && result.contentId) {
      generatedContentId.value = result.contentId
      // 모듈 경로 저장 (리뷰에 필요)
      const gradeLevel = grade.value?.startsWith('elementary')
        ? 'elementary'
        : grade.value?.startsWith('middle')
          ? 'middle'
          : 'high'
      generatedModulePath.value = `public/contents/${subject.value}/${gradeLevel}/${result.contentId}`
    }
  } catch (error) {
    console.error('콘텐츠 생성 실패:', error)
  }
}

// 생성 취소
function cancelGeneration() {
  generationStore.cancelGeneration()
  currentStep.value = 'mode'
}

// 재시도
function retryGeneration() {
  startGeneration()
}

// 콘텐츠 보기
function viewContent(_contentId: string) {
  // 실제 생성된 콘텐츠 ID로 이동
  if (generatedContentId.value) {
    router.push(`/content/${generatedContentId.value}`)
  }
}

// 콘텐츠 개선
async function improveContent(_contentId: string) {
  if (!generatedContentId.value || !generatedModulePath.value) return

  try {
    await generationStore.startReview(
      generatedContentId.value,
      generatedModulePath.value
    )
  } catch (error) {
    console.error('콘텐츠 개선 실패:', error)
  }
}

// 처음부터 다시 시작
function resetWizard() {
  interests.value = []
  subject.value = null
  grade.value = null
  renderMode.value = '3d'
  generatedContentId.value = null
  generatedModulePath.value = null
  generationStore.resetState()
  generationStore.resetReviewState()
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

        <div v-else-if="currentStep === 'mode'" key="mode" class="step-content">
          <RenderModeSelect v-model="renderMode" />
        </div>

        <div v-else-if="currentStep === 'generating'" key="generating" class="step-content">
          <GenerationProgressVue
            :progress="generationProgress"
            :content-id="generatedContentId"
            :job-id="currentJobId"
            @cancel="cancelGeneration"
            @retry="retryGeneration"
            @view-content="viewContent"
            @improve="improveContent"
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
        {{ currentStep === 'mode' ? '만들기 시작!' : '다음' }}
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

/* 생성 중일 때 더 넓은 레이아웃 (실시간 프리뷰 표시) */
.creator-wizard:has(.generation-progress.with-preview) {
  max-width: 1100px;
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
  border-radius: var(--radius-pill);
  background: var(--color-bg-card);
  border: var(--border-sticker);
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
  border-color: var(--color-brand-primary);
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-ink);
}

.step-item.current .step-number {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.step-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.step-item.current .step-label {
  color: #fff;
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
  border-top: 1px solid rgba(59, 53, 98, 0.08);
}

.wizard-complete-footer {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.btn:not(:disabled):active {
  transform: translateY(2px);
}

.btn-primary {
  background: var(--color-brand-primary);
  color: #fff;
  box-shadow: 0 4px 0 rgba(59, 53, 98, 0.2);
}

.btn-primary:not(:disabled):hover {
  background: var(--color-brand-secondary);
}

.btn-primary:not(:disabled):active {
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.2);
}

.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: var(--border-sticker);
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
