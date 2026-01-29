# 요청/응답 스키마

## 기본 타입

### Subject

```typescript
type Subject = 'math' | 'science' | 'english'
```

### GradeLevel

```typescript
type GradeLevel = 'elementary' | 'middle' | 'high'
```

### Grade

```typescript
type Grade =
  | 'elementary-1' | 'elementary-2' | 'elementary-3'
  | 'elementary-4' | 'elementary-5' | 'elementary-6'
  | 'middle-1' | 'middle-2' | 'middle-3'
  | 'high-1' | 'high-2' | 'high-3'
```

### ContentType

```typescript
type ContentType = 'game' | 'quiz' | 'exploration' | 'simulation' | 'story'
```

### Language

```typescript
type Language = 'ko' | 'en'
```

---

## 콘텐츠 스키마

### ContentManifest

개별 콘텐츠의 메타데이터

```typescript
interface ContentManifest {
  // 필수 필드
  id: string              // 고유 식별자 (URL 친화적)
  title: string           // 콘텐츠 제목
  subject: Subject        // 과목
  gradeLevel: GradeLevel  // 학년 레벨
  grade: Grade            // 세부 학년
  type: ContentType       // 콘텐츠 유형
  language: Language      // 언어
  description: string     // 설명
  thumbnail: string       // 썸네일 (base64 또는 URL)
  path: string            // 콘텐츠 파일 경로

  // 선택적 필드
  prerequisites?: string[] // 선수 지식 콘텐츠 ID
  createdAt?: string       // 생성 일시 (ISO 8601)
  updatedAt?: string       // 수정 일시 (ISO 8601)
  tags?: string[]          // 태그
  duration?: number        // 예상 소요 시간 (분)
  difficulty?: 'easy' | 'medium' | 'hard' // 난이도
}
```

#### 예시

```json
{
  "id": "circle-area",
  "title": "원의 넓이",
  "subject": "math",
  "gradeLevel": "elementary",
  "grade": "elementary-5",
  "type": "simulation",
  "language": "ko",
  "description": "원을 조각으로 나눠 직사각형으로 변환하여 넓이 공식을 발견합니다",
  "thumbnail": "data:image/png;base64,...",
  "path": "contents/math/elementary/circle-area/index.html",
  "prerequisites": ["shapes-explorer"],
  "createdAt": "2026-01-15T10:00:00Z",
  "tags": ["기하", "넓이", "공식"],
  "duration": 15,
  "difficulty": "medium"
}
```

### ContentCatalog

전체 콘텐츠 카탈로그

```typescript
interface ContentCatalog {
  version: string          // 카탈로그 버전
  lastUpdated: string      // 마지막 업데이트 (ISO 8601)
  contents: ContentManifest[]
}
```

#### 예시

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-29T12:00:00Z",
  "contents": [
    { ... },
    { ... }
  ]
}
```

---

## 생성 스키마

### GenerationRequest

AI 콘텐츠 생성 요청

```typescript
interface GenerationRequest {
  interests: string[]      // 관심사 배열 (1-10개)
  subject: 'math' | 'english' // 과목 (science 미지원)
  grade: Grade             // 학년
  language: Language       // 언어
  additionalContext?: string // 추가 컨텍스트
}
```

#### 검증 규칙

| 필드 | 규칙 |
|------|------|
| interests | 1-10개, 각 100자 이하 |
| subject | `math` 또는 `english`만 허용 |
| grade | 유효한 Grade 값 |
| language | `ko` 또는 `en` |

#### 예시

```json
{
  "interests": ["축구", "게임", "요리"],
  "subject": "math",
  "grade": "elementary-5",
  "language": "ko",
  "additionalContext": "분수에 관심이 많고 시각적 학습을 선호함"
}
```

### JobStatusResponse

생성 작업 상태 응답

```typescript
interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'queued' | 'processing' | 'reviewing' | 'completed' | 'failed'
  progress: number         // 0-100
  message: string          // 상태 메시지

  // 완료 시에만
  contentId?: string       // 생성된 콘텐츠 ID
  manifest?: {
    id: string
    title: string
    description: string
    type: ContentType
  }

  // 실패 시에만
  error?: string
}
```

#### 상태별 예시

**대기 중**
```json
{
  "jobId": "job_abc123",
  "status": "queued",
  "progress": 5,
  "message": "생성 대기열에 추가되었습니다..."
}
```

**처리 중**
```json
{
  "jobId": "job_abc123",
  "status": "processing",
  "progress": 40,
  "message": "AI가 콘텐츠를 생성하고 있습니다..."
}
```

**완료**
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
    "description": "축구 경기 통계로 분수를 익힙니다",
    "type": "simulation"
  }
}
```

**실패**
```json
{
  "jobId": "job_abc123",
  "status": "failed",
  "progress": 0,
  "message": "생성에 실패했습니다",
  "error": "AI 응답 파싱 실패: 유효하지 않은 JSON"
}
```

---

## 추천 스키마

### ClickRecord

클릭 기록

```typescript
interface ClickRecord {
  contentId: string
  clickCount: number
  lastClickedAt: string   // ISO 8601
}
```

### RecommendationsResponse

추천 목록 응답

```typescript
interface RecommendationsResponse {
  success: boolean
  recommendations: ClickRecord[]
}
```

#### 예시

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

## 공통 응답 스키마

### SuccessResponse

성공 응답 기본 구조

```typescript
interface SuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}
```

### ErrorResponse

에러 응답 기본 구조

```typescript
interface ErrorResponse {
  success: false
  error: string
  details?: unknown
}
```

---

## 라벨 매핑

UI 표시용 한국어 라벨

```typescript
const SUBJECT_LABELS: Record<Subject, string> = {
  math: '수학',
  science: '과학',
  english: '영어'
}

const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등'
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  game: '게임',
  quiz: '퀴즈',
  exploration: '탐험',
  simulation: '시뮬레이션',
  story: '스토리'
}
```

---

## 다음 단계

- [API 엔드포인트](./endpoints.md)
- [콘텐츠 매니페스트](../content-system/content-manifest.md)
- [코드 패턴](../architecture/code-patterns.md)
