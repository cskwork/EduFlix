// Pinia 생성 상태 관리 스토어
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
  GenerationHistoryItem,
  RenderMode,
  CreatorMode,
  ReviewProgress,
} from '../types/generation'
import type { Subject, Grade, Language, Difficulty, ContentManifest } from '../types/content'
import { generateContent, reviewContent, type ProgressCallback, type ReviewProgressCallback } from '../services/api/claude'
import { t } from '../i18n'
import { useContentStore } from './content'

export const useGenerationStore = defineStore('generation', () => {
  let runVersion = 0
  let controller: AbortController | null = null
  // 현재 생성 상태
  const currentProgress = ref<GenerationProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  })

  // 현재 생성 요청
  const currentRequest = ref<GenerationRequest | null>(null)

  // 마지막 생성 결과
  const lastResult = ref<GenerationResponse | null>(null)

  // 생성 히스토리
  const history = ref<GenerationHistoryItem[]>([])

  // 리뷰 진행 상태
  const reviewProgress = ref<ReviewProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  })

  // 현재 작업 ID (실시간 프리뷰에 필요)
  const currentJobId = ref<string | null>(null)

  // 생성 중인지 여부
  const isGenerating = computed(() => {
    const status = currentProgress.value.status
    return (
      status === 'preparing' ||
      status === 'queued' ||
      status === 'generating' ||
      status === 'generating-images' ||
      status === 'reviewing' ||
      status === 'finalizing'
    )
  })

  // 생성 완료 여부
  const isCompleted = computed(() => currentProgress.value.status === 'completed')

  // 에러 발생 여부
  const hasError = computed(() => currentProgress.value.status === 'error')

  // 진행률 퍼센트
  const progressPercent = computed(() => currentProgress.value.progress)

  // 상태 메시지
  const statusMessage = computed(() => currentProgress.value.message)

  // 프로그레스 업데이트 콜백
  const handleProgress: ProgressCallback = (progress: GenerationProgress) => {
    currentProgress.value = { ...progress }
  }

  // 생성 시작
  async function startGeneration(options: {
    mode?: CreatorMode
    // Option 1
    interests?: string[]
    subject?: Subject
    grade?: Grade
    // 공통
    language?: Language
    renderMode?: RenderMode
    additionalContext?: string
    // Option 2
    problem?: string
    difficulty?: Difficulty
  }): Promise<GenerationResponse> {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal
    const version = ++runVersion
    const contentStore = useContentStore()
    const startTime = Date.now()

    // 요청 저장
    const request: GenerationRequest = {
      mode: options.mode ?? 'interest',
      interests: options.interests ?? [],
      subject: options.subject,
      grade: options.grade,
      language: options.language || 'ko',
      renderMode: options.renderMode,
      additionalContext: options.additionalContext,
      problem: options.problem,
      difficulty: options.difficulty,
    }
    currentRequest.value = request

    // 초기 상태 설정
    currentProgress.value = {
      status: 'preparing',
      progress: 0,
      message: t('generation.status.preparing'),
      startedAt: new Date().toISOString(),
    }
    currentJobId.value = null

    try {
      // API 호출 (jobId 추적 콜백 포함)
      const result = await generateContent(
        {
          mode: options.mode,
          interests: options.interests,
          subject: options.subject,
          grade: options.grade,
          language: options.language || 'ko',
          renderMode: options.renderMode,
          additionalContext: options.additionalContext,
          problem: options.problem,
          difficulty: options.difficulty,
        },
        (progress) => { if (version === runVersion) handleProgress(progress) },
        (jobId) => { if (version === runVersion) currentJobId.value = jobId },
        signal,
      )

      if (version !== runVersion) return { success: false, error: 'Cancelled' }
      // 성공 시 콘텐츠 스토어에 추가
      let finalResult = result
      if (result.success && result.manifest) {
        // contentId 검증: 필수 값이 없으면 스토어에 추가하지 않음
        const contentId = result.contentId || result.manifest.id
        if (!contentId) {
          console.warn('콘텐츠 ID가 누락되어 카탈로그에 추가되지 않았습니다')
          finalResult = {
            ...result,
            warning: t('generation.missingContentId'),
          }
        } else {
          const manifest = result.manifest
          if (manifest.path && manifest.subject && manifest.gradeLevel && manifest.grade) {
            contentStore.addContent({ ...manifest, id: contentId, language: manifest.language ?? options.language ?? 'ko', createdAt: manifest.createdAt ?? new Date().toISOString(), thumbnail: manifest.thumbnail ?? '', tags: manifest.tags ?? [] } as ContentManifest)
          } else {
            // Older APIs omit the canonical path; reload the catalog instead of guessing.
            await contentStore.loadContents(true)
            if (version !== runVersion) return { success: false, error: 'Cancelled' }
          }
        }
      }

      // jobId 저장 (실시간 프리뷰용)
      if (result.jobId) {
        currentJobId.value = result.jobId
      }

      // lastResult와 history에 동일한 결과 저장 (warning 포함)
      lastResult.value = finalResult

      // 히스토리에 추가 (contentId 누락 시에도 기록)
      history.value.push({
        id: crypto.randomUUID(),
        request,
        response: finalResult,
        createdAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      })

      return finalResult
    } catch (error) {
      if (version !== runVersion) return { success: false, error: 'Cancelled' }
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError')

      currentProgress.value = {
        status: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage,
      }

      const errorResult: GenerationResponse = {
        success: false,
        error: errorMessage,
      }

      lastResult.value = errorResult

      return errorResult
    }
  }

  // 생성 취소
  function cancelGeneration() {
    runVersion++
    controller?.abort()
    controller = null
    currentProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
    }
    currentRequest.value = null
    currentJobId.value = null
  }

  // 상태 초기화
  function resetState() {
    runVersion++
    controller?.abort()
    controller = null
    currentProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
    }
    currentRequest.value = null
    lastResult.value = null
    currentJobId.value = null
  }

  // 진행 상태 수동 업데이트
  function updateProgress(status: GenerationStatus, progress: number, message: string) {
    currentProgress.value = {
      ...currentProgress.value,
      status,
      progress,
      message,
    }
  }

  // 히스토리 조회
  function getHistoryItem(id: string): GenerationHistoryItem | undefined {
    return history.value.find((item) => item.id === id)
  }

  // 히스토리 삭제
  function clearHistory() {
    history.value = []
  }

  // 리뷰 상태 초기화
  function resetReviewState() {
    reviewProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
    }
  }

  // 리뷰 진행 상태 업데이트 콜백
  const handleReviewProgress: ReviewProgressCallback = (progress: ReviewProgress) => {
    reviewProgress.value = { ...progress }
  }

  // 리뷰 중인지 여부
  const isReviewing = computed(() => reviewProgress.value.status === 'reviewing')

  // 콘텐츠 리뷰/개선 시작
  async function startReview(
    moduleId: string,
    modulePath: string
  ): Promise<{ success: boolean; error?: string }> {
    // 리뷰 상태 초기화
    reviewProgress.value = {
      status: 'reviewing',
      progress: 0,
      message: t('generation.reviewing'),
    }

    try {
      const result = await reviewContent(moduleId, modulePath, handleReviewProgress)

      if (result.success) {
        reviewProgress.value = {
          status: 'completed',
          progress: 100,
          message: t('generation.reviewCompleted'),
          issues: result.issues,
        }
      } else {
        reviewProgress.value = {
          status: 'error',
          progress: 0,
          message: result.error || t('generation.reviewFailed'),
          error: result.error,
        }
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError')
      reviewProgress.value = {
        status: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage,
      }
      return { success: false, error: errorMessage }
    }
  }

  return {
    // 상태
    currentProgress,
    currentRequest,
    lastResult,
    history,
    reviewProgress,
    currentJobId,
    // 계산된 속성
    isGenerating,
    isCompleted,
    hasError,
    progressPercent,
    statusMessage,
    isReviewing,
    // 액션
    startGeneration,
    cancelGeneration,
    resetState,
    updateProgress,
    getHistoryItem,
    clearHistory,
    startReview,
    resetReviewState,
  }
})
