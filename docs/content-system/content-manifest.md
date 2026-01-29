# 콘텐츠 매니페스트

## 개요

매니페스트는 각 콘텐츠의 메타데이터를 정의합니다. 개별 콘텐츠 폴더의 `manifest.json`과 전체 카탈로그인 `index.json`에서 사용됩니다.

---

## 파일 구조

```
public/contents/
├── index.json                    # 전체 카탈로그
│
└── math/elementary/circle-area/
    ├── index.html                # 콘텐츠 진입점
    ├── style.css                 # 스타일
    ├── script.js                 # 로직
    └── manifest.json             # 메타데이터
```

---

## 스키마 정의

### ContentManifest

```typescript
interface ContentManifest {
  // === 필수 필드 ===
  id: string              // 고유 식별자 (URL 친화적)
  title: string           // 콘텐츠 제목
  subject: Subject        // 과목
  gradeLevel: GradeLevel  // 학년 레벨
  grade: Grade            // 세부 학년
  type: ContentType       // 콘텐츠 유형
  language: Language      // 언어
  description: string     // 설명
  thumbnail: string       // 썸네일
  path: string            // 콘텐츠 파일 경로

  // === 선택적 필드 ===
  prerequisites?: string[] // 선수 지식 콘텐츠 ID
  createdAt?: string       // 생성 일시 (ISO 8601)
  updatedAt?: string       // 수정 일시 (ISO 8601)
  tags?: string[]          // 태그
  duration?: number        // 예상 소요 시간 (분)
  difficulty?: 'easy' | 'medium' | 'hard' // 난이도
}
```

### 열거형

```typescript
type Subject = 'math' | 'science' | 'english'

type GradeLevel = 'elementary' | 'middle' | 'high'

type Grade =
  | 'elementary-1' | 'elementary-2' | 'elementary-3'
  | 'elementary-4' | 'elementary-5' | 'elementary-6'
  | 'middle-1' | 'middle-2' | 'middle-3'
  | 'high-1' | 'high-2' | 'high-3'

type ContentType = 'game' | 'quiz' | 'exploration' | 'simulation' | 'story'

type Language = 'ko' | 'en'
```

---

## 필드 상세

### id

- **형식**: 소문자, 하이픈 구분 (kebab-case)
- **제약**: URL 친화적, 고유해야 함
- **예시**: `circle-area`, `pythagoras-theorem`, `3d-vectors`

### title

- **형식**: 짧고 명확한 제목
- **예시**: `원의 넓이`, `피타고라스 정리`

### subject

| 값 | 라벨 |
|----|------|
| math | 수학 |
| science | 과학 |
| english | 영어 |

### gradeLevel

| 값 | 라벨 | 학년 범위 |
|----|------|----------|
| elementary | 초등 | 1-6학년 |
| middle | 중등 | 1-3학년 |
| high | 고등 | 1-3학년 |

### grade

형식: `{gradeLevel}-{1-6}`

| 예시 | 의미 |
|------|------|
| elementary-5 | 초등 5학년 |
| middle-2 | 중등 2학년 |
| high-1 | 고등 1학년 |

### type

| 값 | 라벨 | 설명 |
|----|------|------|
| game | 게임 | Phaser 기반 게임 형식 |
| quiz | 퀴즈 | 문제 풀이 중심 |
| exploration | 탐험 | 가이드 탐색 |
| simulation | 시뮬레이션 | 변수 조작 학습 |
| story | 스토리 | 내러티브 중심 |

### path

- **형식**: 상대 경로 (public 기준)
- **예시**: `contents/math/elementary/circle-area/index.html`

### thumbnail

- **형식**: base64 데이터 URI 또는 URL
- **예시**: `data:image/png;base64,iVBOR...`

---

## 예시

### manifest.json (개별 콘텐츠)

```json
{
  "id": "circle-area",
  "title": "원의 넓이",
  "subject": "math",
  "gradeLevel": "elementary",
  "grade": "elementary-5",
  "type": "simulation",
  "language": "ko",
  "description": "원을 조각으로 나눠 직사각형으로 변환하여 넓이 공식을 발견합니다. 반지름을 조절하며 πr² 공식이 왜 성립하는지 직관적으로 이해합니다.",
  "thumbnail": "data:image/png;base64,iVBOR...",
  "path": "contents/math/elementary/circle-area/index.html",
  "prerequisites": ["shapes-explorer"],
  "tags": ["기하", "넓이", "원", "공식", "π"],
  "duration": 15,
  "difficulty": "medium"
}
```

### index.json (카탈로그)

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
      "description": "원의 넓이 공식 발견",
      "thumbnail": "...",
      "path": "contents/math/elementary/circle-area/index.html",
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "pythagoras-theorem",
      "title": "피타고라스 정리",
      "subject": "math",
      "gradeLevel": "middle",
      "grade": "middle-3",
      "type": "simulation",
      "language": "ko",
      "description": "직각삼각형의 비밀",
      "thumbnail": "...",
      "path": "contents/math/middle/pythagoras-theorem/index.html",
      "createdAt": "2026-01-10T10:00:00Z"
    }
  ]
}
```

---

## 디렉토리 규칙

### 표준 경로

```
public/contents/{subject}/{gradeLevel}/{id}/
```

예시:
- `public/contents/math/elementary/circle-area/`
- `public/contents/science/middle/cell-explorer/`
- `public/contents/math/high/quadratic-graph/`

### 필수 파일

| 파일 | 설명 |
|------|------|
| index.html | 콘텐츠 진입점 |
| style.css | 스타일시트 |
| script.js | 로직 + EduFlixEngine |
| manifest.json | 메타데이터 |

### 선택적 파일

| 파일 | 설명 |
|------|------|
| assets/ | 이미지, 오디오 등 |
| lib/ | 외부 라이브러리 (예: Three.js) |

---

## 경로 생성 로직

```typescript
function generatePath(manifest: ContentManifest): string {
  // 명시적 경로가 있으면 사용
  if (manifest.path) {
    return manifest.path
  }

  // 기본 경로 생성
  return `contents/${manifest.subject}/${manifest.gradeLevel}/${manifest.id}/index.html`
}
```

---

## 검증

### 필수 필드 검증

```typescript
function validateManifest(manifest: unknown): manifest is ContentManifest {
  if (!manifest || typeof manifest !== 'object') return false

  const m = manifest as Record<string, unknown>

  // 필수 필드 존재 확인
  const requiredFields = [
    'id', 'title', 'subject', 'gradeLevel', 'grade',
    'type', 'language', 'description', 'thumbnail', 'path'
  ]

  for (const field of requiredFields) {
    if (!m[field] || (typeof m[field] === 'string' && !m[field].trim())) {
      return false
    }
  }

  // 열거형 값 검증
  const validSubjects = ['math', 'science', 'english']
  if (!validSubjects.includes(m.subject as string)) return false

  const validTypes = ['game', 'quiz', 'exploration', 'simulation', 'story']
  if (!validTypes.includes(m.type as string)) return false

  return true
}
```

---

## 다음 단계

- [스타일링 가이드](./styling-guide.md)
- [EduFlixEngine 가이드](./eduflix-engine.md)
- [API 스키마](../api/schemas.md)
