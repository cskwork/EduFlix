<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Subject, Difficulty } from '../../types/content'
import type { RenderMode, CreatorMode } from '../../types/generation'
import LessonSettings, { type LessonSettingsValue } from './LessonSettings.vue'
import ModeSelect from './ModeSelect.vue'
import InterestInput from './InterestInput.vue'
import SubjectSelect from './SubjectSelect.vue'
import DifficultySelect from './DifficultySelect.vue'
import RenderModeSelect from './RenderModeSelect.vue'
import ProblemInput, { type ProblemInputValue } from './ProblemInput.vue'
import GenerationProgressVue from './GenerationProgress.vue'
import { useContentStore } from '../../stores/content'
import { useGenerationStore } from '../../stores/generation'
import { useI18n } from '../../i18n'

const { t, contentLanguage } = useI18n()

// Router
const router = useRouter()
const route = useRoute()
let studioBrief: { subject?: string; difficulty?: Difficulty; title?: string } | null = null
const lessonSettings = ref<LessonSettingsValue>({ grade: 'elementary-5', audience: 'teacher', objectives: '', minutes: 40, context: '', contentType: '' })
if (typeof route.query.brief === 'string') {
  try {
    const brief = JSON.parse(window.sessionStorage.getItem('eduflix-studio-brief') || 'null')
    if (brief && typeof brief.context === 'string') { lessonSettings.value = { ...lessonSettings.value, ...brief }; studioBrief = brief }
  } catch { /* The creator remains usable when session storage is unavailable. */ }
}
const teachingContext = computed(() => [
  `사용 목적: ${lessonSettings.value.audience === 'teacher' ? '교사 수업용. 수업 진행 안내를 제공한다.' : '학생 자습용. 단계별 설명과 스스로 확인할 피드백을 제공한다.'}`,
  `활동 시간: ${lessonSettings.value.minutes}분`,
  `학습 목표: ${lessonSettings.value.objectives}`,
  lessonSettings.value.context,
].join('\n'))

// Generation Store
const generationStore = useGenerationStore()
const contentStore = useContentStore()
function resolvedModulePath(id: string) {
  const path = contentStore.getContentById(id)?.path
  return path ? `public/${path.replace(/^\//, '').replace(/\/index\.html$/, '')}` : null
}

// 마법사 단계
// - mode-select: Option 1(interest) vs Option 2(problem) 선택
// - Option 1: interests → subject → difficulty → mode → generating
// - Option 2: problem → mode → generating
type WizardStep =
  | 'mode-select'
  | 'interests'
  | 'subject'
  | 'difficulty'
  | 'mode'
  | 'problem'
  | 'generating'

// 현재 단계
const currentStep = ref<WizardStep>(studioBrief ? 'mode' : 'mode-select')

// 폼 데이터
const creatorMode = ref<CreatorMode | null>(studioBrief ? 'problem' : null)
const interests = ref<string[]>(route.query.brief === 'studio' && lessonSettings.value.objectives ? [lessonSettings.value.objectives.slice(0, 100)] : [])
const subject = ref<Subject | null>(null)
const difficulty = ref<Difficulty | null>(null)
const renderMode = ref<RenderMode>('3d')

// Option 2 (problem mode) 통합 상태
const problemState = ref<ProblemInputValue>({
  problem: studioBrief ? `${studioBrief.title ?? ''}\n${lessonSettings.value.objectives}` : '',
  subject: studioBrief?.subject ?? null,
  difficulty: studioBrief?.difficulty ?? 'medium',
})

// 생성된 콘텐츠 ID
const generatedContentId = ref<string | null>(null)

// 생성된 콘텐츠 경로 (리뷰에 필요)
const generatedModulePath = ref<string | null>(null)

// 생성 진행 상태 (스토어에서 가져옴)
const generationProgress = computed(() => generationStore.currentProgress)

// 현재 작업 ID (실시간 프리뷰용)
const currentJobId = computed(() => generationStore.currentJobId)

// 모드별 단계 시퀀스
const interestSteps = computed<{ key: WizardStep; label: string; number: number }[]>(() => [
  { key: 'interests', label: t('creator.steps.interests'), number: 2 },
  { key: 'subject', label: t('creator.steps.subject'), number: 3 },
  { key: 'difficulty', label: t('creator.steps.difficulty'), number: 4 },
  { key: 'mode', label: t('creator.steps.renderMode'), number: 5 },
])

const problemSteps = computed<{ key: WizardStep; label: string; number: number }[]>(() => [
  { key: 'problem', label: t('creator.steps.problem'), number: 2 },
  { key: 'mode', label: t('creator.steps.renderMode'), number: 3 },
])

// 표시할 단계 (모드 선택 + 모드별 시퀀스)
const steps = computed(() => {
  const baseStep = [
    { key: 'mode-select' as WizardStep, label: t('creator.steps.method'), number: 1 },
  ]
  if (creatorMode.value === 'problem') return [...baseStep, ...problemSteps.value]
  if (creatorMode.value === 'interest') return [...baseStep, ...interestSteps.value]
  return baseStep
})

// 현재 단계 인덱스
const currentStepIndex = computed(() => {
  const idx = steps.value.findIndex((s) => s.key === currentStep.value)
  return idx >= 0 ? idx : 0
})

// 다음 단계로 이동 가능 여부
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'mode-select':
      return creatorMode.value !== null
    case 'interests':
      return interests.value.length > 0
    case 'subject':
      return subject.value !== null
    case 'difficulty':
      return difficulty.value !== null
    case 'problem':
      return problemState.value.problem.trim().length >= 5 &&
        problemState.value.difficulty !== null
    case 'mode':
      return renderMode.value !== null && Number.isFinite(lessonSettings.value.minutes) && lessonSettings.value.minutes >= 5 && lessonSettings.value.minutes <= 120
    default:
      return false
  }
})

// 모드 선택 처리
function selectCreatorMode(mode: CreatorMode) {
  creatorMode.value = mode
}

// 다음 단계로 이동
function nextStep() {
  if (!canProceed.value) return

  // mode-select에서 다음 단계로 분기
  if (currentStep.value === 'mode-select') {
    currentStep.value = creatorMode.value === 'problem' ? 'problem' : 'interests'
    return
  }

  // Option 1 (interest)
  if (creatorMode.value === 'interest') {
    switch (currentStep.value) {
      case 'interests':
        currentStep.value = 'subject'
        break
      case 'subject':
        currentStep.value = 'difficulty'
        break
      case 'difficulty':
        currentStep.value = 'mode'
        break
      case 'mode':
        startGeneration()
        break
    }
    return
  }

  // Option 2 (problem)
  if (creatorMode.value === 'problem') {
    switch (currentStep.value) {
      case 'problem':
        currentStep.value = 'mode'
        break
      case 'mode':
        startGeneration()
        break
    }
  }
}

// 이전 단계로 이동
function prevStep() {
  if (currentStep.value === 'generating') {
    currentStep.value = 'mode'
    return
  }
  const idx = currentStepIndex.value
  if (idx <= 0) return
  const prev = steps.value[idx - 1]
  if (prev) currentStep.value = prev.key
}

// 생성 시작
async function startGeneration() {
  currentStep.value = 'generating'
  generatedContentId.value = null
  generatedModulePath.value = null

  try {
    let result
    if (creatorMode.value === 'problem') {
      // Option 2: problem mode
      result = await generationStore.startGeneration({
        mode: 'problem',
        // 생성 언어는 현재 UI 언어를 따른다
        language: contentLanguage.value,
        renderMode: renderMode.value,
        grade: lessonSettings.value.grade,
        contentType: lessonSettings.value.contentType || undefined,
        additionalContext: teachingContext.value,
        problem: problemState.value.problem,
        subject: problemState.value.subject ?? undefined,
        difficulty: problemState.value.difficulty,
      })
      if (result.success && result.contentId) {
        generatedContentId.value = result.contentId
        generatedModulePath.value = resolvedModulePath(result.contentId)
      }
    } else {
      // Option 1: interest mode
      if (!subject.value || !difficulty.value) return
      result = await generationStore.startGeneration({
        mode: 'interest',
        interests: interests.value,
        subject: subject.value,
        difficulty: difficulty.value,
        // 영어 과목은 언제나 영어로, 그 외에는 현재 UI 언어를 따른다
        language: subject.value === 'english' ? 'en' : contentLanguage.value,
        renderMode: renderMode.value,
        grade: lessonSettings.value.grade,
        contentType: lessonSettings.value.contentType || undefined,
        additionalContext: teachingContext.value,
      })
      if (result.success && result.contentId) {
        generatedContentId.value = result.contentId
        generatedModulePath.value = resolvedModulePath(result.contentId)
      }
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
  if (generatedContentId.value) {
    router.push(`/content/${generatedContentId.value}`)
  }
}

// 콘텐츠 개선
async function improveContent(_contentId: string) {
  if (!generatedContentId.value || !generatedModulePath.value) return
  try {
    await generationStore.startReview(generatedContentId.value, generatedModulePath.value)
  } catch (error) {
    console.error('콘텐츠 개선 실패:', error)
  }
}

// 처음부터 다시 시작
function resetWizard() {
  creatorMode.value = null
  interests.value = []
  subject.value = null
  difficulty.value = null
  renderMode.value = '3d'
  problemState.value = { problem: '', subject: null, difficulty: 'medium' }
  generatedContentId.value = null
  generatedModulePath.value = null
  generationStore.resetState()
  generationStore.resetReviewState()
  currentStep.value = 'mode-select'
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
        <div v-if="currentStep === 'mode-select'" key="mode-select" class="step-content">
          <ModeSelect :model-value="creatorMode" @update:model-value="selectCreatorMode" />
        </div>

        <div v-else-if="currentStep === 'interests'" key="interests" class="step-content">
          <InterestInput v-model="interests" />
        </div>

        <div v-else-if="currentStep === 'subject'" key="subject" class="step-content">
          <SubjectSelect v-model="subject" />
        </div>

        <div v-else-if="currentStep === 'difficulty'" key="difficulty" class="step-content">
          <DifficultySelect v-model="difficulty" />
        </div>

        <div v-else-if="currentStep === 'problem'" key="problem" class="step-content">
          <ProblemInput v-model="problemState" />
        </div>

        <div v-else-if="currentStep === 'mode'" key="mode" class="step-content">
          <LessonSettings v-model="lessonSettings" />
          <RenderModeSelect v-model="renderMode" />
        </div>

        <div v-else-if="currentStep === 'generating'" key="generating" class="step-content">
          <GenerationProgressVue
            :progress="generationProgress"
            :can-improve="!!generatedModulePath && !generationStore.isReviewing"
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
        {{ t('common.back') }}
      </button>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canProceed"
        @click="nextStep"
      >
        {{ currentStep === 'mode' ? t('creator.startGeneration') : t('common.next') }}
      </button>
    </div>

    <div
      v-if="generationProgress.status === 'completed'"
      class="wizard-complete-footer"
    >
      <button type="button" class="btn btn-secondary" @click="resetWizard">
        {{ t('creator.createAnother') }}
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
  flex-wrap: wrap;
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
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
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
