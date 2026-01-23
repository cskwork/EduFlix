// Pinia 생성 상태 관리 스토어
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GenerationRequest,
  GenerationResponse,
  GenerationProgress,
  GenerationStatus,
  GenerationHistoryItem,
} from '../types/generation'
import type { Subject, Grade, Language, ContentManifest } from '../types/content'
import { generateContent, type ProgressCallback } from '../services/api/claude'
import { useContentStore } from './content'

export const useGenerationStore = defineStore('generation', () => {
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

  // 생성 중인지 여부
  const isGenerating = computed(() => {
    const status = currentProgress.value.status
    return (
      status === 'preparing' ||
      status === 'generating' ||
      status === 'generating-images' ||
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
    interests: string[]
    subject: Subject
    grade: Grade
    language?: Language
    additionalContext?: string
  }): Promise<GenerationResponse> {
    const contentStore = useContentStore()
    const startTime = Date.now()

    // 요청 저장
    const request: GenerationRequest = {
      interests: options.interests,
      subject: options.subject,
      grade: options.grade,
      language: options.language || 'ko',
      additionalContext: options.additionalContext,
    }
    currentRequest.value = request

    // 초기 상태 설정
    currentProgress.value = {
      status: 'preparing',
      progress: 0,
      message: '콘텐츠 준비 중...',
      startedAt: new Date().toISOString(),
    }

    try {
      // API 호출
      const result = await generateContent(
        {
          interests: options.interests,
          subject: options.subject,
          grade: options.grade,
          language: options.language || 'ko',
          additionalContext: options.additionalContext,
        },
        handleProgress
      )

      lastResult.value = result

      // 성공 시 콘텐츠 스토어에 추가
      if (result.success && result.manifest) {
        const gradeLevel = options.grade.startsWith('elementary')
          ? 'elementary'
          : options.grade.startsWith('middle')
            ? 'middle'
            : 'high'

        const newContent: ContentManifest = {
          id: result.contentId || result.manifest.id,
          title: result.manifest.title,
          subject: options.subject,
          gradeLevel,
          grade: options.grade,
          type: result.manifest.type,
          language: options.language || 'ko',
          description: result.manifest.description,
          thumbnail: '',
          path: `/contents/${options.subject}/${gradeLevel}/${result.contentId}/index.html`,
          createdAt: new Date().toISOString(),
          tags: options.interests,
        }

        contentStore.addContent(newContent)
      }

      // 히스토리에 추가
      history.value.push({
        id: crypto.randomUUID(),
        request,
        response: result,
        createdAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

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
    currentProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
    }
    currentRequest.value = null
  }

  // 상태 초기화
  function resetState() {
    currentProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
    }
    currentRequest.value = null
    lastResult.value = null
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

  return {
    // 상태
    currentProgress,
    currentRequest,
    lastResult,
    history,
    // 계산된 속성
    isGenerating,
    isCompleted,
    hasError,
    progressPercent,
    statusMessage,
    // 액션
    startGeneration,
    cancelGeneration,
    resetState,
    updateProgress,
    getHistoryItem,
    clearHistory,
  }
})
