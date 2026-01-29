# API 엔드포인트

## 기본 정보

- **Base URL**: `http://localhost:3001` (개발) / Cloudflare Tunnel URL (프로덕션)
- **Content-Type**: `application/json`
- **인증**: 없음 (공개 API)

---

## 콘텐츠 API

### GET /api/content

콘텐츠 목록 조회

#### 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| subject | string | 과목 필터 (`math`, `science`, `english`) |
| gradeLevel | string | 학년 레벨 필터 (`elementary`, `middle`, `high`) |
| type | string | 콘텐츠 타입 필터 (`game`, `quiz`, `exploration`, `simulation`, `story`) |

#### 요청 예시

```bash
# 전체 조회
curl http://localhost:3001/api/content

# 필터링
curl "http://localhost:3001/api/content?subject=math&gradeLevel=elementary"
```

#### 응답

```json
{
  "success": true,
  "count": 9,
  "contents": [
    {
      "id": "circle-area",
      "title": "원의 넓이",
      "subject": "math",
      "gradeLevel": "elementary",
      "grade": "elementary-5",
      "type": "simulation",
      "language": "ko",
      "description": "원의 넓이 공식을 발견하는 시뮬레이션",
      "path": "contents/math/elementary/circle-area/index.html",
      "thumbnail": "...",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /api/content/:id

단일 콘텐츠 조회

#### 요청 예시

```bash
curl http://localhost:3001/api/content/circle-area
```

#### 응답

```json
{
  "success": true,
  "content": {
    "id": "circle-area",
    "title": "원의 넓이",
    "subject": "math",
    "gradeLevel": "elementary",
    "grade": "elementary-5",
    "type": "simulation",
    "language": "ko",
    "description": "원의 넓이 공식을 발견하는 시뮬레이션",
    "path": "contents/math/elementary/circle-area/index.html",
    "thumbnail": "...",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": "콘텐츠를 찾을 수 없습니다"
}
```

---

### POST /api/content

콘텐츠 등록 (수동)

#### 요청 본문

```json
{
  "id": "new-content",
  "title": "새 콘텐츠",
  "subject": "math",
  "gradeLevel": "elementary",
  "grade": "elementary-3",
  "type": "simulation",
  "language": "ko",
  "description": "콘텐츠 설명",
  "path": "contents/math/elementary/new-content/index.html",
  "thumbnail": "data:image/png;base64,..."
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 고유 ID (URL 친화적) |
| title | string | 제목 |
| subject | Subject | 과목 |
| gradeLevel | GradeLevel | 학년 레벨 |
| type | ContentType | 콘텐츠 타입 |

#### 응답

```json
{
  "success": true,
  "content": { ... }
}
```

---

### PUT /api/content/:id

콘텐츠 수정

#### 요청 본문

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명"
}
```

#### 응답

```json
{
  "success": true,
  "content": {
    "id": "circle-area",
    "title": "수정된 제목",
    "updatedAt": "2026-01-29T10:00:00Z",
    ...
  }
}
```

---

### DELETE /api/content/:id

콘텐츠 삭제

#### 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| deleteFiles | boolean | `true`면 파일도 삭제 |

#### 요청 예시

```bash
# 카탈로그에서만 제거
curl -X DELETE http://localhost:3001/api/content/old-content

# 파일도 함께 삭제
curl -X DELETE "http://localhost:3001/api/content/old-content?deleteFiles=true"
```

#### 응답

```json
{
  "success": true,
  "message": "콘텐츠가 삭제되었습니다",
  "deletedId": "old-content"
}
```

---

## 생성 API

### POST /api/generate

AI 콘텐츠 생성 작업 시작

#### 요청 본문

```json
{
  "interests": ["축구", "게임", "요리"],
  "subject": "math",
  "grade": "elementary-5",
  "language": "ko",
  "additionalContext": "분수에 관심이 많음"
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| interests | string[] | 관심사 (최대 10개) |
| subject | string | 과목 (`math` 또는 `english`) |
| grade | string | 학년 (예: `elementary-5`) |
| language | string | 언어 (`ko` 또는 `en`) |

#### 응답 (202 Accepted)

```json
{
  "success": true,
  "jobId": "job_abc123",
  "message": "콘텐츠 생성이 시작되었습니다"
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": "현재 science 과목은 지원하지 않습니다"
}
```

---

### GET /api/generate/status/:jobId

생성 상태 조회

#### 요청 예시

```bash
curl http://localhost:3001/api/generate/status/job_abc123
```

#### 상태 값

| 상태 | 설명 | progress |
|------|------|----------|
| pending | 대기열 대기 | 0 |
| queued | 대기열에 추가됨 | 5 |
| processing | AI 생성 중 | 40 |
| reviewing | 품질 검토 중 | 70 |
| completed | 완료 | 100 |
| failed | 실패 | 0 |

#### 진행 중 응답

```json
{
  "jobId": "job_abc123",
  "status": "processing",
  "progress": 40,
  "message": "AI가 콘텐츠를 생성하고 있습니다..."
}
```

#### 완료 응답

```json
{
  "jobId": "job_abc123",
  "status": "completed",
  "progress": 100,
  "message": "콘텐츠가 완성되었습니다!",
  "contentId": "soccer-fractions",
  "manifest": {
    "id": "soccer-fractions",
    "title": "축구로 배우는 분수",
    "description": "축구 경기 통계로 분수 개념을 익힙니다",
    "type": "simulation"
  }
}
```

#### 실패 응답

```json
{
  "jobId": "job_abc123",
  "status": "failed",
  "progress": 0,
  "message": "생성에 실패했습니다",
  "error": "AI 응답이 유효하지 않습니다"
}
```

---

### POST /api/generate/review

콘텐츠 리뷰/개선 작업 시작

#### 요청 본문

```json
{
  "moduleId": "soccer-fractions",
  "modulePath": "contents/math/elementary/soccer-fractions"
}
```

#### 응답 (202 Accepted)

```json
{
  "success": true,
  "jobId": "review_xyz789",
  "message": "리뷰가 시작되었습니다"
}
```

---

### GET /api/generate/review/status/:jobId

리뷰 상태 조회

#### 응답

```json
{
  "jobId": "review_xyz789",
  "status": "completed",
  "progress": 100,
  "message": "리뷰 완료",
  "issues": [
    {
      "type": "style",
      "description": "버튼 색상 대비가 낮음",
      "fixed": true
    }
  ],
  "improvedFiles": ["style.css"]
}
```

---

## 추천 API

### GET /api/recommendations

인기 콘텐츠 목록 조회

#### 쿼리 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| limit | number | 10 | 반환할 콘텐츠 수 |

#### 요청 예시

```bash
curl "http://localhost:3001/api/recommendations?limit=5"
```

#### 응답

```json
{
  "success": true,
  "recommendations": [
    {
      "contentId": "circle-area",
      "clickCount": 42,
      "lastClickedAt": "2026-01-29T10:00:00Z"
    },
    {
      "contentId": "pythagoras-theorem",
      "clickCount": 35,
      "lastClickedAt": "2026-01-29T09:30:00Z"
    }
  ]
}
```

---

### POST /api/recommendations/click

클릭 기록

#### 요청 본문

```json
{
  "contentId": "circle-area"
}
```

#### 응답

```json
{
  "success": true,
  "message": "클릭이 기록되었습니다"
}
```

---

## 에러 코드

| HTTP 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 201 | 생성 완료 |
| 202 | 작업 수락됨 (비동기) |
| 400 | 잘못된 요청 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 ID 등) |
| 500 | 서버 오류 |
| 503 | 외부 서비스 연결 실패 |

---

## 다음 단계

- [요청/응답 스키마](./schemas.md)
- [백엔드 아키텍처](../architecture/backend.md)
- [데이터 흐름](../architecture/data-flow.md)
