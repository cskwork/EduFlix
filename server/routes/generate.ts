// AI 콘텐츠 생성 API 엔드포인트
// Art-assets API 기반 비동기 생성

import type {
  GenerationRequest,
} from '../../src/types/generation'
import {
  createJob,
  getJobStatus,
  createReviewJob,
  getReviewStatus,
  isErrorResponse,
  isSubjectSupported,
  type ArtAssetsStatusResponse,
  type EduFlixGenerationRequest,
} from '../services/art-assets'
import { syncContent } from '../services/content-sync'
import { buildArtAssetsUnavailableMessage, checkArtAssetsHealth } from '../services/health'

type JsonResponse = (data: unknown, status?: number) => Response
type ErrorResponse = (message: string, status?: number) => Response

// In-memory job tracking (maps EduFlix requests to art-assets jobs)
interface JobContext {
  jobId: string
  request: EduFlixGenerationRequest
  createdAt: string
}

const jobContextMap = new Map<string, JobContext>()

// Job status response for frontend
export interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'queued' | 'processing' | 'reviewing' | 'completed' | 'failed'
  progress: number
  message: string
  contentId?: string
  manifest?: {
    id: string
    title: string
    description: string
    type: string
  }
  error?: string
}

// Map art-assets status to EduFlix status with progress
function mapStatus(artAssetsStatus: ArtAssetsStatusResponse): { status: JobStatusResponse['status']; progress: number; message: string } {
  switch (artAssetsStatus.status) {
    case 'pending':
      return { status: 'queued', progress: 5, message: '생성 대기열에 추가되었습니다...' }
    case 'processing':
      // Check review status for more granular progress
      if (artAssetsStatus.reviewStatus === 'pending') {
        return { status: 'reviewing', progress: 70, message: '콘텐츠 품질을 검토하고 있습니다...' }
      }
      return { status: 'processing', progress: 40, message: 'AI가 콘텐츠를 생성하고 있습니다...' }
    case 'completed':
      return { status: 'completed', progress: 100, message: '콘텐츠가 완성되었습니다!' }
    case 'failed':
      return { status: 'failed', progress: 0, message: artAssetsStatus.error || '생성에 실패했습니다' }
    default:
      return { status: 'processing', progress: 50, message: '처리 중...' }
  }
}

// 생성 API 핸들러
export async function handleGenerateRoute(
  req: Request,
  jsonResponse: JsonResponse,
  errorResponse: ErrorResponse
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  // POST /api/generate - 콘텐츠 생성 작업 시작
  if (req.method === 'POST' && pathname === '/api/generate') {
    try {
      const body = (await req.json()) as GenerationRequest

      // 입력 검증
      if (!body.interests || !body.subject || !body.grade || !body.language) {
        return errorResponse('필수 필드가 누락되었습니다: interests, subject, grade, language', 400)
      }

      // interests 배열 검증
      if (
        !Array.isArray(body.interests) ||
        body.interests.length > 10 ||
        body.interests.some((i) => typeof i !== 'string' || i.length > 100)
      ) {
        return errorResponse('interests는 최대 10개의 문자열 배열이어야 합니다', 400)
      }

      // subject 지원 여부 확인 (art-assets는 math, english만 지원)
      if (!isSubjectSupported(body.subject)) {
        return errorResponse(
          `현재 ${body.subject} 과목은 지원하지 않습니다. math 또는 english를 선택해주세요.`,
          400
        )
      }

      // grade 타입 검증
      const validGrades = [
        'elementary-1', 'elementary-2', 'elementary-3',
        'elementary-4', 'elementary-5', 'elementary-6',
        'middle-1', 'middle-2', 'middle-3',
        'high-1', 'high-2', 'high-3',
      ]
      if (!validGrades.includes(body.grade)) {
        return errorResponse('유효하지 않은 학년입니다', 400)
      }

      // EduFlix 요청 구성
      const eduflixRequest: EduFlixGenerationRequest = {
        interests: body.interests,
        subject: body.subject,
        grade: body.grade,
        language: body.language,
        additionalContext: body.additionalContext,
      }

      // art-assets 연결 가능 여부를 먼저 진단하여 난해한 연결 오류를 방지
      const artAssetsHealth = await checkArtAssetsHealth()
      if (!artAssetsHealth.reachable) {
        const message = buildArtAssetsUnavailableMessage(artAssetsHealth)
        return errorResponse(message, 503)
      }

      // Art-assets 작업 생성
      const jobResult = await createJob(eduflixRequest)

      if (isErrorResponse(jobResult)) {
        return errorResponse(jobResult.error, 400)
      }

      // 작업 컨텍스트 저장 (동기화에 필요)
      jobContextMap.set(jobResult.jobId, {
        jobId: jobResult.jobId,
        request: eduflixRequest,
        createdAt: new Date().toISOString(),
      })

      // 작업 ID 반환 (프론트엔드에서 폴링)
      return jsonResponse({
        success: true,
        jobId: jobResult.jobId,
        message: jobResult.message,
      }, 202) // 202 Accepted

    } catch (error) {
      console.error('생성 요청 오류:', error)
      const message = error instanceof Error ? error.message : '콘텐츠 생성 요청 실패'
      return errorResponse(message, 500)
    }
  }

  // GET /api/generate/status/:jobId - 생성 상태 조회 및 완료 시 동기화
  if (req.method === 'GET' && pathname.startsWith('/api/generate/status/')) {
    const jobId = pathname.split('/').pop()

    if (!jobId) {
      return errorResponse('작업 ID가 필요합니다', 400)
    }

    try {
      // Art-assets 상태 조회
      const statusResult = await getJobStatus(jobId)

      if (isErrorResponse(statusResult)) {
        return errorResponse(statusResult.error, 404)
      }

      // 상태 매핑
      const { status, progress, message } = mapStatus(statusResult)

      // 기본 응답 구성
      const response: JobStatusResponse = {
        jobId,
        status,
        progress,
        message,
      }

      // 완료된 경우: 콘텐츠 동기화 수행
      if (statusResult.status === 'completed' && statusResult.moduleId && statusResult.modulePath) {
        const context = jobContextMap.get(jobId)

        if (!context) {
          // 컨텍스트가 없으면 기본값 사용
          console.warn(`Job context not found for ${jobId}, using defaults`)
          return jsonResponse({
            ...response,
            error: '작업 컨텍스트를 찾을 수 없습니다. 콘텐츠 동기화를 건너뜁니다.',
          })
        }

        // 콘텐츠 동기화
        const syncResult = await syncContent({
          moduleId: statusResult.moduleId,
          modulePath: statusResult.modulePath,
          subject: context.request.subject,
          grade: context.request.grade,
          interests: context.request.interests,
          language: context.request.language,
          files: statusResult.files,
        })

        if (!syncResult.success) {
          return jsonResponse({
            ...response,
            status: 'failed',
            progress: 0,
            message: syncResult.error || '콘텐츠 동기화 실패',
            error: syncResult.error,
          })
        }

        // 성공 응답에 콘텐츠 정보 포함
        response.contentId = syncResult.contentId
        if (syncResult.manifest) {
          response.manifest = {
            id: syncResult.manifest.id,
            title: syncResult.manifest.title,
            description: syncResult.manifest.description,
            type: syncResult.manifest.type,
          }
        }

        // 컨텍스트 정리
        jobContextMap.delete(jobId)
      }

      // 실패한 경우: 에러 정보 포함
      if (statusResult.status === 'failed') {
        response.error = statusResult.error || statusResult.reviewError

        // 컨텍스트 정리
        jobContextMap.delete(jobId)
      }

      return jsonResponse(response)

    } catch (error) {
      console.error('상태 조회 오류:', error)
      const message = error instanceof Error ? error.message : '상태 조회 실패'
      return errorResponse(message, 500)
    }
  }

  // POST /api/generate/review - 콘텐츠 리뷰/개선 작업 시작
  if (req.method === 'POST' && pathname === '/api/generate/review') {
    try {
      const body = (await req.json()) as { moduleId?: string; modulePath?: string }

      if (!body.moduleId || !body.modulePath) {
        return errorResponse('moduleId와 modulePath가 필요합니다', 400)
      }

      // Art-assets 리뷰 작업 생성
      const reviewResult = await createReviewJob({
        moduleId: body.moduleId,
        modulePath: body.modulePath,
      })

      if (isErrorResponse(reviewResult)) {
        return errorResponse(reviewResult.error, 400)
      }

      return jsonResponse({
        success: true,
        jobId: reviewResult.jobId,
        message: reviewResult.message,
      }, 202)

    } catch (error) {
      console.error('리뷰 요청 오류:', error)
      const message = error instanceof Error ? error.message : '리뷰 요청 실패'
      return errorResponse(message, 500)
    }
  }

  // GET /api/generate/review/status/:jobId - 리뷰 상태 조회
  if (req.method === 'GET' && pathname.startsWith('/api/generate/review/status/')) {
    const jobId = pathname.split('/').pop()

    if (!jobId) {
      return errorResponse('작업 ID가 필요합니다', 400)
    }

    try {
      const statusResult = await getReviewStatus(jobId)

      if (isErrorResponse(statusResult)) {
        return errorResponse(statusResult.error, 404)
      }

      return jsonResponse({
        jobId,
        status: statusResult.status,
        progress: statusResult.progress,
        message: statusResult.message,
        issues: statusResult.issues,
        improvedFiles: statusResult.improvedFiles,
        error: statusResult.error,
      })

    } catch (error) {
      console.error('리뷰 상태 조회 오류:', error)
      const message = error instanceof Error ? error.message : '상태 조회 실패'
      return errorResponse(message, 500)
    }
  }

  return errorResponse('지원하지 않는 엔드포인트입니다', 404)
}
