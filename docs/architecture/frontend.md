# 프론트엔드 아키텍처

## 기술 스택

| 기술 | 버전 | 역할 |
|------|------|------|
| Vue 3 | 3.x | UI 프레임워크 |
| TypeScript | 5.x | 타입 안정성 |
| Vite | 5.x | 빌드 도구 |
| Pinia | 2.x | 상태 관리 |
| Vue Router | 4.x | 라우팅 |

---

## 디렉토리 구조

```
src/
├── main.ts                 # 앱 진입점
├── App.vue                 # 루트 컴포넌트
├── router/
│   └── index.ts            # 라우터 설정
│
├── views/                  # 페이지 컴포넌트
│   ├── HomeView.vue        # 홈 화면
│   ├── ContentView.vue     # 콘텐츠 뷰어
│   ├── CreatorView.vue     # AI 생성기
│   └── NotFoundView.vue    # 404 페이지
│
├── components/             # 재사용 컴포넌트
│   ├── common/             # 공통 컴포넌트
│   │   ├── AppHeader.vue
│   │   └── ModeToggle.vue
│   │
│   ├── home/               # 홈 화면용
│   │   ├── ContentCard.vue
│   │   └── ContentRow.vue
│   │
│   ├── viewer/             # 뷰어용
│   │   └── ContentViewer.vue
│   │
│   └── creator/            # 생성기용
│       ├── CreatorWizard.vue
│       ├── InterestInput.vue
│       └── SubjectSelect.vue
│
├── stores/                 # Pinia 스토어
│   ├── content.ts          # 콘텐츠 상태
│   └── generation.ts       # 생성 상태
│
├── services/               # 외부 서비스
│   ├── api/
│   │   ├── claude.ts       # Claude API
│   │   └── gemini.ts       # Gemini API
│   └── clickTracker.ts     # 클릭 추적
│
├── composables/            # 컴포저블 함수
│   ├── useAIGeneration.ts  # AI 생성 훅
│   └── useDragScroll.ts    # 드래그 스크롤
│
├── types/                  # TypeScript 타입
│   ├── content.ts          # 콘텐츠 타입
│   ├── generation.ts       # 생성 타입
│   └── knowledge-map.ts    # 지식맵 타입
│
└── assets/                 # 정적 자원
    └── styles/
        ├── theme.css       # Netflix 다크 테마
        └── responsive.css  # 반응형 스타일
```

---

## 라우팅

### 라우트 정의

```typescript
const routes = [
  { path: '/', component: HomeView },
  { path: '/content/:id', component: ContentView },
  { path: '/create', component: CreatorView },
  { path: '/:pathMatch(.*)*', component: NotFoundView }
]
```

### 정적 모드 처리

```typescript
// CreatorView는 정적 모드에서 홈으로 리다이렉트
if (import.meta.env.VITE_STATIC_MODE === 'true') {
  router.beforeEach((to) => {
    if (to.path === '/create') return '/'
  })
}
```

---

## 상태 관리 (Pinia)

### content.ts - 콘텐츠 스토어

```typescript
interface ContentState {
  catalog: ContentCatalog | null
  currentContent: ContentManifest | null
  isLoading: boolean
  error: string | null
}

const actions = {
  fetchCatalog()     // 카탈로그 로드
  fetchContent(id)   // 단일 콘텐츠 로드
  addContent(data)   // 콘텐츠 추가
}
```

### generation.ts - 생성 스토어

```typescript
interface GenerationState {
  jobId: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  generatedContent: ContentManifest | null
}

const actions = {
  startGeneration(request)  // 생성 시작
  pollStatus()              // 상태 폴링
  cancelGeneration()        // 취소
}
```

---

## 컴포넌트 패턴

### Script Setup

모든 컴포넌트는 `<script setup lang="ts">` 사용:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContentManifest } from '@/types/content'

// Props
const props = defineProps<{
  content: ContentManifest
}>()

// Emits
const emit = defineEmits<{
  click: [id: string]
}>()

// 반응형 상태
const isLoading = ref(false)

// 계산된 속성
const displayTitle = computed(() => props.content.title)

// 라이프사이클
onMounted(() => {
  // 초기화
})
</script>
```

### Scoped Styles

```vue
<style scoped>
.content-card {
  /* 컴포넌트 로컬 스타일 */
}
</style>
```

---

## 주요 컴포넌트

### HomeView.vue

홈 화면 레이아웃:

```
┌─────────────────────────────────────┐
│           AppHeader                 │
├─────────────────────────────────────┤
│         Hero Section                │
├─────────────────────────────────────┤
│  ContentRow (인기)                   │
│  ContentRow (수학)                   │
│  ContentRow (과학)                   │
└─────────────────────────────────────┘
```

핵심 로직:
- 콘텐츠 그룹핑 (과목별)
- 클릭 기반 정렬
- 인기 콘텐츠 섹션

### ContentView.vue

콘텐츠 뷰어:

```
┌─────────────────────────────────────┐
│  [닫기]                    [정보]   │
├─────────────────────────────────────┤
│                                     │
│          iframe                     │
│       (콘텐츠 샌드박스)              │
│                                     │
└─────────────────────────────────────┘
```

핵심 로직:
- iframe 샌드박스 로딩
- postMessage 통신
- ESC 키로 닫기

### ContentCard.vue

콘텐츠 카드:

```
┌─────────────────┐
│   [썸네일]       │
│   (iframe)      │
├─────────────────┤
│ 제목            │
│ [초등] [게임]   │
└─────────────────┘
```

핵심 로직:
- iframe 미리보기
- 호버 효과
- 클릭 추적

---

## Composables

### useDragScroll

가로 스크롤 드래그 기능:

```typescript
const { containerRef, isDragging, preventClickIfDragged } = useDragScroll()
```

특징:
- DRAG_THRESHOLD (5px) 이상 움직임 시 드래그 인식
- 클릭과 드래그 구분
- 터치 디바이스 지원

### useAIGeneration

AI 생성 훅:

```typescript
const {
  startGeneration,
  cancelGeneration,
  status,
  progress
} = useAIGeneration()
```

특징:
- 상태 폴링
- 에러 핸들링
- 취소 기능

---

## 반응형 디자인

### 브레이크포인트 (responsive.css)

```css
/* 모바일 세로 */
@media (max-width: 479px) { }

/* 모바일 가로 */
@media (min-width: 480px) and (max-width: 767px) { }

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) { }

/* 데스크톱 */
@media (min-width: 1024px) { }
```

### 터치 최적화

```css
@media (hover: none) {
  /* 터치 디바이스 전용 스타일 */
  .hover-effect { display: none; }
}
```

---

## 다음 단계

- [백엔드 아키텍처](./backend.md)
- [데이터 흐름](./data-flow.md)
- [코드 패턴](./code-patterns.md)
