# AI 콘텐츠 생성 시스템

## 개요

EduFlix는 Claude AI와 art-assets 서버를 활용하여 학생의 관심사에 맞춘 맞춤형 교육 콘텐츠를 자동 생성합니다.

---

## 시스템 구성

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CreatorView   │────>│   API Server    │────>│   art-assets    │
│   (프론트엔드)   │     │   (Bun HTTP)    │     │   (외부 서버)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Claude API    │
                                                │   (콘텐츠 생성)   │
                                                └─────────────────┘
```

---

## 생성 흐름

### 1. 사용자 입력

CreatorView에서 수집하는 정보:

```typescript
interface GenerationRequest {
  interests: string[]    // 관심사 (축구, 게임, 요리 등)
  subject: 'math' | 'english'
  grade: Grade           // 학년
  language: 'ko' | 'en'
  additionalContext?: string // 추가 정보
}
```

### 2. 작업 생성

```
POST /api/generate
{
  "interests": ["축구", "게임"],
  "subject": "math",
  "grade": "elementary-5",
  "language": "ko"
}

Response: 202 Accepted
{
  "success": true,
  "jobId": "job_abc123",
  "message": "콘텐츠 생성이 시작되었습니다"
}
```

### 3. 상태 폴링

```
GET /api/generate/status/job_abc123

Polling States:
pending (0%) → queued (5%) → processing (40%)
                                    ↓
                            reviewing (70%)
                                    ↓
                            completed (100%)
```

### 4. 콘텐츠 동기화

완료 시 자동으로:
1. art-assets에서 생성된 파일 수신
2. `public/contents/{subject}/{gradeLevel}/{id}/`에 저장
3. `index.json` 카탈로그 업데이트

---

## 프롬프트 구조

### 디렉토리

```
agents/content-generator/
├── prompts/
│   ├── system.md       # 시스템 프롬프트 (공통)
│   ├── math.md         # 수학 콘텐츠 가이드라인
│   ├── science.md      # 과학 콘텐츠 가이드라인
│   └── english.md      # 영어 콘텐츠 가이드라인
│
├── templates/
│   ├── base.html       # 기본 HTML 템플릿
│   ├── game.html       # 게임 템플릿
│   └── quiz.html       # 퀴즈 템플릿
│
└── styles/
    ├── game-ui.css     # 게임 UI 스타일
    ├── animations.css  # 애니메이션
    └── utils.css       # 유틸리티
```

### 수학 프롬프트 (math.md) 핵심 요소

1. **7-Scene 구조**
   - Hook → Anchor → Story → Core → Visualize → Quiz → Wrap

2. **발견 기반 학습**
   - 공식을 직접 알려주지 않고 탐구를 통해 발견하도록 유도

3. **스토리텔링**
   - 학생의 관심사를 수학적 상황에 연결

4. **모바일 우선**
   - clamp() 폰트, 44px 터치 타겟, 반응형 브레이크포인트

---

## 생성 결과물

### 파일 구조

```
{contentId}/
├── index.html      # 메인 HTML
├── style.css       # 스타일
├── script.js       # 로직 + EduFlixEngine
└── manifest.json   # 메타데이터
```

### manifest.json 예시

```json
{
  "id": "soccer-fractions",
  "title": "축구로 배우는 분수",
  "subject": "math",
  "gradeLevel": "elementary",
  "grade": "elementary-5",
  "type": "simulation",
  "language": "ko",
  "description": "축구 경기 통계로 분수 개념을 익힙니다",
  "thumbnail": "data:image/png;base64,..."
}
```

---

## 검증 과정

### Claude 응답 검증

```typescript
// 1. JSON 파싱
const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
const parsed = JSON.parse(jsonMatch[1])

// 2. 타입 가드
if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
  throw new Error('유효하지 않은 구조')
}

// 3. 필드 검증 (필수, trim 후 공백 제외)
const requiredFields = ['title', 'description', 'html', 'type']
for (const field of requiredFields) {
  if (!parsed[field] || !parsed[field].trim()) {
    throw new Error(`필수 필드 누락: ${field}`)
  }
}

// 4. 타입 유효성
const validTypes = ['game', 'quiz', 'exploration', 'simulation', 'story']
if (!validTypes.includes(parsed.type)) {
  throw new Error(`유효하지 않은 타입: ${parsed.type}`)
}
```

### 콘텐츠 리뷰

생성 후 자동 리뷰:
- 코드 구문 오류 검사
- 접근성 검사 (색상 대비, 터치 타겟)
- 반응형 레이아웃 검증

---

## 에러 처리

### 지원 과목 검증

```typescript
if (!isSubjectSupported(body.subject)) {
  return errorResponse(
    `현재 ${body.subject} 과목은 지원하지 않습니다. math 또는 english를 선택해주세요.`,
    400
  )
}
```

### art-assets 연결 실패

```typescript
const artAssetsHealth = await checkArtAssetsHealth()
if (!artAssetsHealth.reachable) {
  const message = buildArtAssetsUnavailableMessage(artAssetsHealth)
  return errorResponse(message, 503)
}
```

### 생성 실패

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

## 상태 관리 (프론트엔드)

### generation.ts 스토어

```typescript
interface GenerationState {
  jobId: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  generatedContent: ContentManifest | null
  error: string | null
}

const actions = {
  async startGeneration(request: GenerationRequest) {
    this.status = 'pending'
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    })
    const { jobId } = await response.json()
    this.jobId = jobId
    this.pollStatus()
  },

  async pollStatus() {
    const poll = async () => {
      const response = await fetch(`/api/generate/status/${this.jobId}`)
      const data = await response.json()

      this.status = data.status
      this.progress = data.progress
      this.message = data.message

      if (data.status === 'completed') {
        this.generatedContent = data.manifest
        return
      }

      if (data.status === 'failed') {
        this.error = data.error
        return
      }

      // 계속 폴링
      setTimeout(poll, 2000)
    }

    poll()
  }
}
```

---

## 제한 사항

### 지원 과목
- **math**: 지원
- **english**: 지원
- **science**: 미지원 (준비 중)

### 입력 제한
- 관심사: 최대 10개, 각 100자 이하
- 추가 컨텍스트: 500자 이하

### 생성 시간
- 일반적으로 1-3분 소요
- 복잡한 콘텐츠는 더 오래 걸릴 수 있음

---

## 다음 단계

- [EduFlixEngine 가이드](./eduflix-engine.md)
- [콘텐츠 매니페스트](./content-manifest.md)
- [API 엔드포인트](../api/endpoints.md)
