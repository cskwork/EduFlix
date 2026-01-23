// AI 콘텐츠 생성 컴포저블
import { ref, computed, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useGenerationStore } from '../stores/generation'
import { useContentStore } from '../stores/content'
import type { Subject, Grade, Language } from '../types/content'
import type { GenerationProgress, GenerationResponse } from '../types/generation'

// 생성 옵션 타입
export interface GenerationOptions {
  interests: string[]
  subject: Subject
  grade: Grade
  language?: Language
  additionalContext?: string
}

// 컴포저블 반환 타입
export interface UseAIGenerationReturn {
  // 상태
  isGenerating: ComputedRef<boolean>
  isCompleted: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  progress: ComputedRef<GenerationProgress>
  progressPercent: ComputedRef<number>
  statusMessage: ComputedRef<string>
  lastResult: ComputedRef<GenerationResponse | null>
  generatedContentId: ComputedRef<string | null>
  // 액션
  generate: (options: GenerationOptions) => Promise<GenerationResponse>
  cancel: () => void
  reset: () => void
  viewGeneratedContent: () => void
  retryLastGeneration: () => Promise<GenerationResponse | null>
}

// AI 생성 컴포저블
export function useAIGeneration(): UseAIGenerationReturn {
  const router = useRouter()
  const generationStore = useGenerationStore()
  const contentStore = useContentStore()

  // 마지막 생성 옵션 저장 (재시도용)
  const lastOptions = ref<GenerationOptions | null>(null)

  // 계산된 속성
  const isGenerating = computed(() => generationStore.isGenerating)
  const isCompleted = computed(() => generationStore.isCompleted)
  const hasError = computed(() => generationStore.hasError)
  const progress = computed(() => generationStore.currentProgress)
  const progressPercent = computed(() => generationStore.progressPercent)
  const statusMessage = computed(() => generationStore.statusMessage)
  const lastResult = computed(() => generationStore.lastResult)

  // 생성된 콘텐츠 ID
  const generatedContentId = computed(() => {
    const result = generationStore.lastResult
    if (result?.success && result.contentId) {
      return result.contentId
    }
    return null
  })

  // 콘텐츠 생성
  async function generate(options: GenerationOptions): Promise<GenerationResponse> {
    lastOptions.value = options

    const result = await generationStore.startGeneration({
      interests: options.interests,
      subject: options.subject,
      grade: options.grade,
      language: options.language || 'ko',
      additionalContext: options.additionalContext,
    })

    // 성공 시 콘텐츠 목록 새로고침
    if (result.success) {
      await contentStore.loadContents()
    }

    return result
  }

  // 생성 취소
  function cancel() {
    generationStore.cancelGeneration()
  }

  // 상태 초기화
  function reset() {
    generationStore.resetState()
    lastOptions.value = null
  }

  // 생성된 콘텐츠 보기
  function viewGeneratedContent() {
    const contentId = generatedContentId.value
    if (contentId) {
      router.push(`/content/${contentId}`)
    }
  }

  // 마지막 생성 재시도
  async function retryLastGeneration(): Promise<GenerationResponse | null> {
    if (!lastOptions.value) {
      return null
    }
    return generate(lastOptions.value)
  }

  // 에러 발생 시 자동 로깅
  watch(
    () => generationStore.hasError,
    (hasError) => {
      if (hasError && generationStore.currentProgress.error) {
        console.error('콘텐츠 생성 오류:', generationStore.currentProgress.error)
      }
    }
  )

  return {
    // 상태
    isGenerating,
    isCompleted,
    hasError,
    progress,
    progressPercent,
    statusMessage,
    lastResult,
    generatedContentId,
    // 액션
    generate,
    cancel,
    reset,
    viewGeneratedContent,
    retryLastGeneration,
  }
}

// 생성 진행 상태별 메시지
export const GENERATION_STATUS_MESSAGES: Record<string, string> = {
  idle: '',
  preparing: '콘텐츠 준비 중...',
  generating: 'AI가 콘텐츠를 만들고 있어요...',
  'generating-images': '이미지를 생성하고 있어요...',
  finalizing: '마무리 중...',
  completed: '완성되었어요!',
  error: '오류가 발생했어요',
}

// 과목별 생성 힌트
export const SUBJECT_GENERATION_HINTS: Record<Subject, string[]> = {
  math: [
    '시각적인 도형과 그래프를 활용해요',
    '단계별 풀이 과정을 제공해요',
    '실생활 예시로 개념을 설명해요',
  ],
  science: [
    '가상 실험을 통해 원리를 체험해요',
    '관찰과 탐구 과정을 강조해요',
    '과학적 호기심을 자극해요',
  ],
  english: [
    '재미있는 게임으로 단어를 익혀요',
    '맥락 속에서 문법을 배워요',
    '대화 연습 기회를 제공해요',
  ],
}

// 생성 예상 시간 (초)
export const ESTIMATED_GENERATION_TIME = 30
