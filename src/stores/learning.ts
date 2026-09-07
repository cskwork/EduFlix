// Pinia 학습 진행도 상태 관리 스토어
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  KnowledgeNode,
  KnowledgeMap,
  LearningProgress,
  LearningStatus,
  LearningStats,
  SubjectProgress,
} from '../types/knowledge-map'
import type { Subject } from '../types/content'
import { t } from '../i18n'

const STORAGE_KEY = 'eduflix_learning_progress'
const STREAK_KEY = 'eduflix_learning_streak'

export const useLearningStore = defineStore('learning', () => {
  // 상태
  const knowledgeMap = ref<KnowledgeMap | null>(null)
  const progressMap = ref<Map<string, LearningProgress>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const streakDays = ref(0)
  const persistenceError = ref<string | null>(null)
  const lastStudyDate = ref<string | null>(null)

  // 초기화: localStorage에서 진행도 로드
  function loadProgressFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: LearningProgress[] = JSON.parse(stored)
        progressMap.value = new Map(data.map((p) => [p.nodeId, p]))
      }

      const streakData = localStorage.getItem(STREAK_KEY)
      if (streakData) {
        const streak = JSON.parse(streakData)
        streakDays.value = streak.days || 0
        lastStudyDate.value = streak.lastDate || null
      }
    } catch (e) {
      console.error('Failed to load learning progress:', e)
    }
  }

  // localStorage에 진행도 저장
  function saveProgressToStorage() {
    persistenceError.value = null
    try {
      const data = Array.from(progressMap.value.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

      const streakData = { days: streakDays.value, lastDate: lastStudyDate.value }
      localStorage.setItem(STREAK_KEY, JSON.stringify(streakData))
    } catch (e) {
      persistenceError.value = t('editor.progressSaveFailed')
      console.error('Failed to save learning progress:', e)
    }
  }

  // 지식맵 로드
  async function loadKnowledgeMap() {
    isLoading.value = true
    error.value = null
    loadProgressFromStorage()

    try {
      const response = await fetch('/contents/knowledge-map.json')
      if (!response.ok) {
        throw new Error(t('errors.knowledgeMapLoadFailed'))
      }
      knowledgeMap.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : t('common.unknownError')
    } finally {
      isLoading.value = false
    }
  }

  // 노드의 학습 상태 계산
  function getNodeStatus(nodeId: string): LearningStatus {
    const progress = progressMap.value.get(nodeId)
    if (progress) {
      return progress.status
    }

    // 선수 지식 확인
    if (!knowledgeMap.value) return 'locked'

    const prerequisites = knowledgeMap.value.edges
      .filter((e) => e.to === nodeId && e.relation === 'prerequisite')
      .map((e) => e.from)

    // 선수 지식이 없으면 available
    if (prerequisites.length === 0) return 'available'

    // 모든 선수 지식이 완료되었는지 확인
    const allCompleted = prerequisites.every((prereqId) => {
      const prereqProgress = progressMap.value.get(prereqId)
      return prereqProgress?.status === 'completed'
    })

    return allCompleted ? 'available' : 'locked'
  }

  // 노드 상태 업데이트
  function updateNodeStatus(nodeId: string, status: LearningStatus) {
    const existing = progressMap.value.get(nodeId)
    const now = new Date().toISOString()

    const progress: LearningProgress = {
      nodeId,
      status,
      completedContentIds: existing?.completedContentIds || [],
      startedAt: existing?.startedAt || (status === 'in_progress' ? now : undefined),
      completedAt: status === 'completed' ? now : existing?.completedAt,
      lastAccessedAt: now,
    }

    progressMap.value.set(nodeId, progress)
    updateStreak()
    saveProgressToStorage()
  }

  // 콘텐츠 완료 기록
  function markContentCompleted(nodeId: string, contentId: string) {
    const existing = progressMap.value.get(nodeId)
    const node = knowledgeMap.value?.nodes.find((n) => n.id === nodeId)
    if (!node || !node.contentIds.includes(contentId)) return
    const now = new Date().toISOString()

    const completedContentIds = existing?.completedContentIds || []
    if (!completedContentIds.includes(contentId)) {
      completedContentIds.push(contentId)
    }

    // 모든 콘텐츠 완료 시 노드 완료
    const allCompleted =
      node && node.contentIds.length > 0 && node.contentIds.every((id) => completedContentIds.includes(id))

    const progress: LearningProgress = {
      nodeId,
      status: allCompleted ? 'completed' : 'in_progress',
      completedContentIds,
      startedAt: existing?.startedAt || now,
      completedAt: allCompleted ? now : undefined,
      lastAccessedAt: now,
    }

    progressMap.value.set(nodeId, progress)
    updateStreak()
    saveProgressToStorage()
  }

  // 연속 학습일 업데이트
  function updateStreak() {
    const today = new Date().toISOString().slice(0, 10)

    if (lastStudyDate.value === today) {
      return // 오늘 이미 기록됨
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    if (lastStudyDate.value === yesterday) {
      streakDays.value += 1
    } else if (lastStudyDate.value !== today) {
      streakDays.value = 1 // 연속 끊김, 리셋
    }

    lastStudyDate.value = today
  }

  // 과목별 노드 목록
  const nodesBySubject = computed(() => {
    if (!knowledgeMap.value) return new Map<Subject, KnowledgeNode[]>()

    const map = new Map<Subject, KnowledgeNode[]>()
    for (const node of knowledgeMap.value.nodes) {
      const existing = map.get(node.subject) || []
      existing.push(node)
      map.set(node.subject, existing)
    }
    return map
  })

  // 학년별 노드 목록 (과목 내에서)
  const nodesByGradeLevel = computed(() => {
    if (!knowledgeMap.value) return new Map<string, KnowledgeNode[]>()

    const map = new Map<string, KnowledgeNode[]>()
    for (const node of knowledgeMap.value.nodes) {
      const key = `${node.subject}-${node.gradeLevel}`
      const existing = map.get(key) || []
      existing.push(node)
      map.set(key, existing)
    }
    return map
  })

  // 학습 통계
  const stats = computed<LearningStats>(() => {
    if (!knowledgeMap.value) {
      return {
        totalNodes: 0,
        completedNodes: 0,
        inProgressNodes: 0,
        totalContents: 0,
        completedContents: 0,
        streakDays: streakDays.value,
        lastStudyDate: lastStudyDate.value ?? undefined,
      }
    }

    const totalNodes = knowledgeMap.value.nodes.length
    let completedNodes = 0
    let inProgressNodes = 0
    let totalContents = 0
    let completedContents = 0

    for (const node of knowledgeMap.value.nodes) {
      totalContents += node.contentIds.length

      const progress = progressMap.value.get(node.id)
      if (progress) {
        if (progress.status === 'completed') completedNodes++
        if (progress.status === 'in_progress') inProgressNodes++
        completedContents += progress.completedContentIds.length
      }
    }

    return {
      totalNodes,
      completedNodes,
      inProgressNodes,
      totalContents,
      completedContents,
      streakDays: streakDays.value,
      lastStudyDate: lastStudyDate.value ?? undefined,
    }
  })

  // 과목별 진행도
  const subjectProgress = computed<SubjectProgress[]>(() => {
    if (!knowledgeMap.value) return []

    const subjects = [...new Set(knowledgeMap.value.nodes.map(node => node.subject))]
    const result: SubjectProgress[] = []

    for (const subject of subjects) {
      const nodes = knowledgeMap.value.nodes.filter((n) => n.subject === subject)
      const completedNodes = nodes.filter((n) => {
        const progress = progressMap.value.get(n.id)
        return progress?.status === 'completed'
      }).length

      result.push({
        subject,
        totalNodes: nodes.length,
        completedNodes,
        percentage: nodes.length > 0 ? Math.round((completedNodes / nodes.length) * 100) : 0,
      })
    }

    return result
  })

  // 다음 추천 학습 노드
  const nextRecommendedNodes = computed(() => {
    if (!knowledgeMap.value) return []

    return knowledgeMap.value.nodes
      .filter((node) => {
        const status = getNodeStatus(node.id)
        return node.contentIds.length > 0 && (status === 'available' || status === 'in_progress')
      })
      .slice(0, 5)
  })

  // 진행도 초기화
  function resetProgress() {
    progressMap.value.clear()
    streakDays.value = 0
    lastStudyDate.value = null
    saveProgressToStorage()
  }

  return {
    // 상태
    knowledgeMap,
    progressMap,
    isLoading,
    error,
    streakDays,
    lastStudyDate,
    persistenceError,
    // 계산된 속성
    nodesBySubject,
    nodesByGradeLevel,
    stats,
    subjectProgress,
    nextRecommendedNodes,
    // 액션
    loadKnowledgeMap,
    getNodeStatus,
    updateNodeStatus,
    markContentCompleted,
    resetProgress,
  }
})
