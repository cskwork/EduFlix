// 지식맵 타입 정의
import type { Subject, GradeLevel } from './content'

// 난이도 타입
export type Difficulty = 1 | 2 | 3 | 4 | 5

// 학습 상태 타입
export type LearningStatus = 'locked' | 'available' | 'in_progress' | 'completed'

// 지식 노드 타입
export interface KnowledgeNode {
  id: string
  name: string
  subject: Subject
  gradeLevel: GradeLevel
  grade?: string // 세부 학년 (예: 'elementary-3')
  difficulty?: Difficulty // 1-5 난이도
  description?: string
  // 연결된 콘텐츠 ID 목록
  contentIds: string[]
}

// 지식 노드 간 관계 (선수 지식)
export interface KnowledgeEdge {
  from: string // 선수 지식 노드 ID
  to: string // 후속 지식 노드 ID
  relation: 'prerequisite' | 'related' | 'extends'
}

// 지식맵 전체 구조
export interface KnowledgeMap {
  version: string
  lastUpdated: string
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

// 지식 노드와 콘텐츠 연결 정보
export interface KnowledgeContentLink {
  nodeId: string
  contentId: string
  relevance: number // 0-1 사이 관련도
}

// 학습 경로 추천용 타입
export interface LearningPath {
  startNodeId: string
  targetNodeId: string
  nodes: string[] // 순서대로 학습해야 할 노드 ID
  estimatedDuration?: number // 예상 학습 시간 (분)
}

// 지식맵 시각화용 노드 타입
export interface KnowledgeNodeDisplay {
  id: string
  name: string
  x: number
  y: number
  subject: Subject
  isLearned?: boolean
  contentCount: number
}

// 학습 진행도 (localStorage 저장용)
export interface LearningProgress {
  nodeId: string
  status: LearningStatus
  completedContentIds: string[]
  startedAt?: string
  completedAt?: string
  lastAccessedAt?: string
}

// 학습 통계
export interface LearningStats {
  totalNodes: number
  completedNodes: number
  inProgressNodes: number
  totalContents: number
  completedContents: number
  streakDays: number
  lastStudyDate?: string
}

// 과목별 학습 진행도
export interface SubjectProgress {
  subject: Subject
  totalNodes: number
  completedNodes: number
  percentage: number
}

// 지식맵 시각화용 엣지 타입
export interface KnowledgeEdgeDisplay {
  from: string
  to: string
  relation: 'prerequisite' | 'related' | 'extends'
}
