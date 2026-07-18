# 백엔드 아키텍처

## 기술 스택

| 기술 | 역할 |
|------|------|
| Bun | 런타임 + HTTP 서버 |
| SQLite | 추천/클릭 데이터 저장 |
| Z.ai GLM | 인앱 콘텐츠 생성과 리뷰 |

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
│   ├── factory-runner.ts   # 인앱 콘텐츠 팩토리 실행기
│   └── health.ts           # LLM 설정 상태 확인
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

### 2. 로컬 팩토리 실행

```typescript
const job = factoryRunner.startGeneration(eduflixRequest)
return jsonResponse({ success: true, jobId: job.jobId }, 202)
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

### 4. 콘텐츠 게시

완료 시 자동으로:
1. `agents/content-factory` 파이프라인이 임시 실행 디렉터리에서 생성·검증
2. `public/contents/{subject}/{gradeLevel}/{id}/`에 4개 계약 파일 승격
3. publish 단계에서 `index.json` 카탈로그 갱신

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

## 인앱 팩토리 서비스

### 실행기 (factory-runner.ts)

```typescript
const job = factoryRunner.startGeneration(request)
const status = factoryRunner.getJob(job.jobId)
const preview = factoryRunner.getPreview(job.jobId)
```

### 헬스 체크 (health.ts)

```typescript
function getLlmHealth() {
  const llm = getFactoryLlmConfig()
  return { provider: llm.provider, model: llm.model, keyConfigured: llm.keyConfigured }
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
FACTORY_LLM_PROVIDER=zai     # zai(기본) 또는 codex
ZAI_API_KEY=...              # Z.ai API 키
ZAI_MODEL=glm-5.2            # 선택 모델
ZAI_API_URL=https://api.z.ai/api/coding/paas/v4/chat/completions
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
