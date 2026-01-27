// Art-Assets API Integration Service
// HTTP-based integration with art-assets server

import type { Subject, Grade, Language } from '../../src/types/content'
import { getArtAssetsUrl } from '../config'

// art-assets 서버 URL (기본값은 3000을 사용하지 않음)
const ART_ASSETS_URL = getArtAssetsUrl()

// Art-assets types (mirrored from art-assets/api/src/types.ts)
export type ArtAssetsSubject = 'math' | 'english'

export interface ArtAssetsRequest {
  subject: ArtAssetsSubject
  topic: string
  gradeLevel: string
}

export interface ArtAssetsJobResponse {
  success: true
  jobId: string
  message: string
}

export interface ArtAssetsErrorResponse {
  success: false
  error: string
  code: 'INVALID_SUBJECT' | 'INVALID_REQUEST' | 'JOB_NOT_FOUND' | 'INTERNAL_ERROR'
}

export type ArtAssetsJobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ArtAssetsReviewStatus = 'pending' | 'completed' | 'failed'

export interface ArtAssetsReviewIssue {
  severity: 'high' | 'medium' | 'low'
  location: string
  message: string
  fix?: string
}

export interface ArtAssetsReviewResult {
  pass: boolean
  score: number
  requirements: Record<string, boolean>
  issues: ArtAssetsReviewIssue[]
  summary: string
  deterministic?: Record<string, boolean>
  deterministicPass?: boolean
  sceneCount?: number
}

export interface ArtAssetsStatusResponse {
  jobId: string
  status: ArtAssetsJobStatus
  moduleId?: string
  modulePath?: string
  files?: string[]
  error?: string
  reviewStatus?: ArtAssetsReviewStatus
  review?: ArtAssetsReviewResult
  reviewError?: string
}

// EduFlix request format
export interface EduFlixGenerationRequest {
  interests: string[]
  subject: Subject
  grade: Grade
  language: Language
  additionalContext?: string
}

// Grade label mapping for art-assets
const GRADE_LABELS: Record<string, string> = {
  'elementary-1': '초등 1학년',
  'elementary-2': '초등 2학년',
  'elementary-3': '초등 3학년',
  'elementary-4': '초등 4학년',
  'elementary-5': '초등 5학년',
  'elementary-6': '초등 6학년',
  'middle-1': '중등 1학년',
  'middle-2': '중등 2학년',
  'middle-3': '중등 3학년',
  'high-1': '고등 1학년',
  'high-2': '고등 2학년',
  'high-3': '고등 3학년',
}

// Transform EduFlix request to art-assets format
export function transformRequest(request: EduFlixGenerationRequest): ArtAssetsRequest {
  // Combine interests into a single topic string
  const topic = request.interests.join(', ')

  // Map grade to Korean grade level string
  const gradeLevel = GRADE_LABELS[request.grade] || request.grade

  return {
    subject: request.subject as ArtAssetsSubject,
    topic,
    gradeLevel,
  }
}

// Check if subject is supported by art-assets
export function isSubjectSupported(subject: Subject): subject is ArtAssetsSubject {
  return subject === 'math' || subject === 'english'
}

// Create a generation job via HTTP
export async function createJob(
  request: EduFlixGenerationRequest
): Promise<ArtAssetsJobResponse | ArtAssetsErrorResponse> {
  // Validate subject support
  if (!isSubjectSupported(request.subject)) {
    return {
      success: false,
      error: `지원하지 않는 과목입니다: ${request.subject}. 현재 math, english만 지원됩니다.`,
      code: 'INVALID_SUBJECT',
    }
  }

  const artAssetsRequest = transformRequest(request)

  try {
    const response = await fetch(`${ART_ASSETS_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artAssetsRequest),
    })

    const data = await response.json() as Record<string, unknown>

    if (!response.ok) {
      return {
        success: false,
        error: (data.error as string) || `HTTP ${response.status}`,
        code: 'INTERNAL_ERROR',
      }
    }

    return data as unknown as ArtAssetsJobResponse
  } catch (error) {
    console.error('art-assets API call failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'art-assets 서버에 연결할 수 없습니다',
      code: 'INTERNAL_ERROR',
    }
  }
}

// Get job status via HTTP
export async function getJobStatus(
  jobId: string
): Promise<ArtAssetsStatusResponse | ArtAssetsErrorResponse> {
  try {
    const response = await fetch(`${ART_ASSETS_URL}/api/generate-content/status/${jobId}`)
    const data = await response.json() as Record<string, unknown>

    if (!response.ok) {
      return {
        success: false,
        error: (data.error as string) || `HTTP ${response.status}`,
        code: 'JOB_NOT_FOUND',
      }
    }

    return data as unknown as ArtAssetsStatusResponse
  } catch (error) {
    console.error('art-assets status check failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'art-assets 서버에 연결할 수 없습니다',
      code: 'INTERNAL_ERROR',
    }
  }
}

// Helper to check if response is an error
export function isErrorResponse(
  response: ArtAssetsJobResponse | ArtAssetsStatusResponse | ArtAssetsErrorResponse
): response is ArtAssetsErrorResponse {
  return 'success' in response && response.success === false
}

// Helper to check if job is complete
export function isJobComplete(status: ArtAssetsStatusResponse): boolean {
  return status.status === 'completed' || status.status === 'failed'
}

// Get art-assets project root for content syncing
export function getArtAssetsRoot(): string {
  const path = require('path')
  return path.resolve(process.cwd(), '../art-assets')
}
