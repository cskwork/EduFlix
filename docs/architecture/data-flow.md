# 데이터 흐름

## 주요 흐름

1. [콘텐츠 로딩](#콘텐츠-로딩)
2. [AI 콘텐츠 생성](#ai-콘텐츠-생성)
3. [클릭 추적](#클릭-추적)
4. [Scene 전환](#scene-전환)

---

## 콘텐츠 로딩

### 시퀀스 다이어그램

```
┌────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────────┐
│  User  │     │  HomeView   │     │ ContentStore│  │ API Server  │
└───┬────┘     └──────┬──────┘     └─────┬─────┘   └──────┬──────┘
    │                 │                  │                │
    │  페이지 접속     │                  │                │
    │────────────────>│                  │                │
    │                 │                  │                │
    │                 │  fetchCatalog()  │                │
    │                 │─────────────────>│                │
    │                 │                  │                │
    │                 │                  │ GET /api/content
    │                 │                  │───────────────>│
    │                 │                  │                │
    │                 │                  │   contents[]   │
    │                 │                  │<───────────────│
    │                 │                  │                │
    │                 │   catalog 반환    │                │
    │                 │<─────────────────│                │
    │                 │                  │                │
    │  콘텐츠 그룹 표시 │                  │                │
    │<────────────────│                  │                │
    │                 │                  │                │
```

### 카탈로그 구조

```typescript
interface ContentCatalog {
  version: string
  lastUpdated: string
  contents: ContentManifest[]
}
```

### 정렬 로직

```typescript
// calculateSortScore (clickTracker.ts)
function calculateSortScore(contentId: string): number {
  const stats = getClickStats(contentId)

  // 클릭 점수 (가장 높은 가중치)
  const clickScore = stats.clickCount * 10

  // 최신순 점수 (30일 내 생성 시 가산)
  const recencyScore = calculateRecencyScore(stats.createdAt)

  // 최근 클릭 가산점 (7일 내)
  const recentClickBonus = calculateRecentClickBonus(stats.lastClickedAt)

  return clickScore + recencyScore + recentClickBonus
}
```

---

## AI 콘텐츠 생성

### 시퀀스 다이어그램

```
┌────────┐  ┌─────────────┐  ┌───────────────┐  ┌──────────┐  ┌───────────┐
│  User  │  │ CreatorView │  │GenerationStore│  │API Server│  │  Factory  │
└───┬────┘  └──────┬──────┘  └───────┬───────┘  └────┬─────┘  └─────┬─────┘
    │              │                 │               │              │
    │ 관심사/과목 입력│                 │               │              │
    │─────────────>│                 │               │              │
    │              │                 │               │              │
    │              │ startGeneration │               │              │
    │              │────────────────>│               │              │
    │              │                 │               │              │
    │              │                 │ POST /generate │              │
    │              │                 │──────────────>│              │
    │              │                 │               │              │
    │              │                 │               │ startGeneration()
    │              │                 │               │─────────────>│
    │              │                 │               │              │
    │              │                 │               │   jobId      │
    │              │                 │               │<─────────────│
    │              │                 │               │              │
    │              │                 │    jobId      │              │
    │              │                 │<──────────────│              │
    │              │                 │               │              │
    │              │                 │               │              │
    │              │                 │ [폴링 시작]     │              │
    │              │                 │               │              │
    │              │                 │ GET /status/id │              │
    │              │                 │──────────────>│              │
    │              │                 │               │ getJob()     │
    │              │                 │               │─────────────>│
    │              │                 │               │              │
    │              │                 │               │   status     │
    │              │                 │               │<─────────────│
    │              │                 │               │              │
    │              │   진행률 업데이트  │               │              │
    │              │<────────────────│               │              │
    │              │                 │               │              │
    │  진행률 표시   │                 │               │              │
    │<─────────────│                 │               │              │
    │              │                 │               │              │
    │              │                 │ ... 반복 ...    │              │
    │              │                 │               │              │
    │              │                 │ status=completed              │
    │              │                 │<──────────────│              │
    │              │                 │               │              │
    │              │                 │   [게시 완료]    │              │
    │              │                 │               │              │
    │              │  완료 알림       │               │              │
    │              │<────────────────│               │              │
    │              │                 │               │              │
    │  완료 메시지   │                 │               │              │
    │<─────────────│                 │               │              │
```

### 상태 전이

```
┌─────────┐     ┌─────────┐     ┌────────────┐     ┌───────────┐
│ pending │ ──> │ queued  │ ──> │ processing │ ──> │ reviewing │
└─────────┘     └─────────┘     └────────────┘     └─────┬─────┘
                                                        │
                 ┌───────────┐                          │
                 │  failed   │ <────────────────────────┤
                 └───────────┘                          │
                                                        ▼
                                                 ┌───────────┐
                                                 │ completed │
                                                 └───────────┘
```

### 콘텐츠 동기화

```typescript
interface SyncParams {
  moduleId: string
  modulePath: string
  subject: string
  grade: string
  interests: string[]
  language: string
  files: GeneratedFile[]
}

async function syncContent(params: SyncParams) {
  // 1. 디렉토리 생성
  const contentDir = `public/contents/${params.subject}/${gradeLevel}/${params.moduleId}`
  await fs.mkdir(contentDir, { recursive: true })

  // 2. 파일 저장
  for (const file of params.files) {
    await fs.writeFile(`${contentDir}/${file.name}`, file.content)
  }

  // 3. 카탈로그 업데이트
  const catalog = await loadCatalog()
  catalog.contents.push(manifest)
  await saveCatalog(catalog)

  return { success: true, contentId: params.moduleId }
}
```

---

## 클릭 추적

### 이중 저장 전략

```
┌────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  User  │     │ ContentCard │     │ clickTracker │     │API Server│
└───┬────┘     └──────┬──────┘     └──────┬───────┘     └────┬─────┘
    │                 │                   │                  │
    │   카드 클릭      │                   │                  │
    │────────────────>│                   │                  │
    │                 │                   │                  │
    │                 │  recordClick(id)  │                  │
    │                 │──────────────────>│                  │
    │                 │                   │                  │
    │                 │                   │  localStorage 저장 │
    │                 │                   │───────────┐      │
    │                 │                   │<──────────┘      │
    │                 │                   │                  │
    │                 │                   │ POST /recommendations/click
    │                 │                   │────────────────> │
    │                 │                   │                  │
    │                 │                   │                  │ SQLite 저장
    │                 │                   │                  │──────┐
    │                 │                   │                  │<─────┘
```

### localStorage 구조

```typescript
interface ClickStats {
  [contentId: string]: {
    clickCount: number
    lastClickedAt: string
  }
}

// 키: eduflix_click_stats
// 예시:
{
  "circle-area": { "clickCount": 5, "lastClickedAt": "2026-01-29T10:00:00Z" },
  "pythagoras-theorem": { "clickCount": 3, "lastClickedAt": "2026-01-28T15:00:00Z" }
}
```

### 점수 계산

```typescript
const WEIGHTS = {
  CLICK: 10,           // 클릭 1회당 10점
  RECENCY_MAX: 30,     // 최신 콘텐츠 최대 30점
  RECENT_CLICK_MAX: 7  // 최근 클릭 최대 7점
}

// 최신순 점수: 30일 내 생성 시 매일 1점 감소
const daysOld = daysSince(createdAt)
const recencyScore = Math.max(0, WEIGHTS.RECENCY_MAX - daysOld)

// 최근 클릭 가산점: 7일 내 클릭 시
const daysSinceClick = daysSince(lastClickedAt)
const recentClickBonus = Math.max(0, WEIGHTS.RECENT_CLICK_MAX - daysSinceClick)
```

---

## Scene 전환

### EduFlixEngine 흐름

```
┌──────────────────────────────────────────────────────────┐
│                     iframe (샌드박스)                     │
│                                                          │
│  ┌──────────┐                                            │
│  │ script.js │                                           │
│  └─────┬────┘                                            │
│        │                                                 │
│        ▼                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │                 EduFlixEngine                     │   │
│  │                                                    │   │
│  │  ┌───────────────────────────────────────────┐   │   │
│  │  │              Scene Map                     │   │   │
│  │  │  hook → story → core → quiz → wrap        │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  switchScene(id):                                 │   │
│  │    1. 현재 씬 hide()                              │   │
│  │    2. 새 씬 show()                                │   │
│  │    3. onEnter 콜백 실행                           │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           │
                           │ postMessage('close')
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   ContentView.vue                        │
│                                                          │
│  window.addEventListener('message', (e) => {             │
│    if (e.data === 'close') router.push('/')             │
│  })                                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Scene 라이프사이클

```typescript
class Scene {
  show() {
    this.element.classList.add('active')
    if (this.onEnter) this.onEnter()
  }

  hide() {
    this.element.classList.remove('active')
    if (this.onExit) this.onExit()
  }
}
```

---

## 다음 단계

- [코드 패턴](./code-patterns.md)
- [EduFlixEngine 가이드](../content-system/eduflix-engine.md)
- [API 엔드포인트](../api/endpoints.md)
