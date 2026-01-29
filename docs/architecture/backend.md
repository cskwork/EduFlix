# 백엔드 아키텍처

## 기술 스택

| 기술 | 역할 |
|------|------|
| Bun | 런타임 + HTTP 서버 |
| SQLite | 추천/클릭 데이터 저장 |
| art-assets | 외부 AI 콘텐츠 생성 서버 |

---

## 디렉토리 구조

```
server/
├── index.ts                # 서버 진입점
├── routes/
│   ├── content.ts          # /api/content - 콘텐츠 CRUD
│   ├── generate.ts         # /api/generate - AI 생성
│   └── recommendations.ts  # /api/recommendations - 추천
│
├── services/
│   ├── art-assets.ts       # art-assets API 클라이언트
│   ├── content-sync.ts     # 콘텐츠 파일 동기화
│   └── health.ts           # 헬스 체크
│
└── db/
    └── recommendations.db  # SQLite 데이터베이스
```

---

## 서버 설정

### 진입점 (index.ts)

```typescript
import { serve } from 'bun'

serve({
  port: process.env.PORT || 3001,
  async fetch(req) {
    const url = new URL(req.url)

    // CORS 헤더
    if (req.method === 'OPTIONS') {
      return corsResponse()
    }

    // 라우팅
    if (url.pathname.startsWith('/api/content')) {
      return handleContentRoute(req)
    }
    if (url.pathname.startsWith('/api/generate')) {
      return handleGenerateRoute(req)
    }
    if (url.pathname.startsWith('/api/recommendations')) {
      return handleRecommendationsRoute(req)
    }

    // 정적 파일 제공 (프로덕션)
    return serveStatic(req)
  }
})
```

### CORS 설정

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

---

## API 엔드포인트 요약

### 콘텐츠 API (/api/content)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/content | 콘텐츠 목록 조회 |
| GET | /api/content/:id | 단일 콘텐츠 조회 |
| POST | /api/content | 콘텐츠 등록 |
| PUT | /api/content/:id | 콘텐츠 수정 |
| DELETE | /api/content/:id | 콘텐츠 삭제 |

### 생성 API (/api/generate)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/generate | 생성 작업 시작 |
| GET | /api/generate/status/:jobId | 상태 조회 |
| POST | /api/generate/review | 리뷰 작업 시작 |
| GET | /api/generate/review/status/:jobId | 리뷰 상태 조회 |

### 추천 API (/api/recommendations)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/recommendations | 인기 콘텐츠 목록 |
| POST | /api/recommendations/click | 클릭 기록 |

---

## 생성 작업 흐름

### 1. 작업 생성

```
POST /api/generate
{
  "interests": ["축구", "게임"],
  "subject": "math",
  "grade": "elementary-5",
  "language": "ko"
}
```

### 2. art-assets 연동

```typescript
// 작업 생성
const jobResult = await createJob(eduflixRequest)

// 컨텍스트 저장 (완료 시 동기화에 필요)
jobContextMap.set(jobResult.jobId, {
  jobId: jobResult.jobId,
  request: eduflixRequest,
  createdAt: new Date().toISOString()
})
```

### 3. 상태 폴링

```
GET /api/generate/status/{jobId}

응답 상태:
- pending: 대기열 대기
- queued: 대기열에 추가됨
- processing: AI 생성 중
- reviewing: 품질 검토 중
- completed: 완료
- failed: 실패
```

### 4. 콘텐츠 동기화

완료 시 자동으로:
1. art-assets에서 파일 다운로드
2. public/contents/{subject}/{gradeLevel}/{id}/ 에 저장
3. index.json 카탈로그 업데이트

---

## 데이터 저장

### 콘텐츠 카탈로그 (index.json)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-29T12:00:00Z",
  "contents": [
    {
      "id": "circle-area",
      "title": "원의 넓이",
      "subject": "math",
      "gradeLevel": "elementary",
      "grade": "elementary-5",
      "type": "simulation",
      "language": "ko",
      "description": "...",
      "path": "contents/math/elementary/circle-area/index.html",
      "thumbnail": "..."
    }
  ]
}
```

### SQLite 스키마 (recommendations)

```sql
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY,
  content_id TEXT NOT NULL,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_id ON clicks(content_id);
```

---

## art-assets 서비스

### 클라이언트 (art-assets.ts)

```typescript
interface EduFlixGenerationRequest {
  interests: string[]
  subject: 'math' | 'english'
  grade: string
  language: 'ko' | 'en'
  additionalContext?: string
}

// 작업 생성
async function createJob(request: EduFlixGenerationRequest) {
  return await fetch(`${ART_ASSETS_URL}/api/jobs`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

// 상태 조회
async function getJobStatus(jobId: string) {
  return await fetch(`${ART_ASSETS_URL}/api/jobs/${jobId}`)
}
```

### 헬스 체크 (health.ts)

```typescript
async function checkArtAssetsHealth() {
  try {
    const response = await fetch(`${ART_ASSETS_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    })
    return { reachable: response.ok }
  } catch {
    return { reachable: false, error: '연결 실패' }
  }
}
```

---

## 정적 파일 제공

### 프로덕션 모드

```typescript
async function serveStatic(req: Request) {
  const url = new URL(req.url)
  let filePath = `dist${url.pathname}`

  // SPA 라우팅
  if (!filePath.includes('.')) {
    filePath = 'dist/index.html'
  }

  return new Response(Bun.file(filePath))
}
```

### 콘텐츠 캐싱

```typescript
if (pathname.startsWith('/contents/')) {
  return new Response(file, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
```

---

## 환경 변수

```bash
# .env
PORT=3001                    # API 서버 포트
ANTHROPIC_API_KEY=sk-...     # Claude API 키
GEMINI_API_KEY=...           # Gemini API 키
ART_ASSETS_URL=http://...    # art-assets 서버 URL
```

---

## 에러 처리

### 응답 헬퍼

```typescript
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

function errorResponse(message: string, status = 500) {
  return jsonResponse({ success: false, error: message }, status)
}
```

### 입력 검증

```typescript
// 필수 필드 검증
if (!body.id || !body.title) {
  return errorResponse('필수 필드 누락', 400)
}

// Path Traversal 방지
const resolvedPath = path.resolve(contentDir)
if (!resolvedPath.startsWith(contentsDir)) {
  return errorResponse('잘못된 경로', 400)
}
```

---

## 다음 단계

- [API 엔드포인트 상세](../api/endpoints.md)
- [데이터 흐름](./data-flow.md)
- [배포 가이드](../deployment/vercel.md)
