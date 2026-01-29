# 코드 패턴

## 코드 컨벤션

### 네이밍

| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ContentCard.vue` |
| 스토어/서비스 | camelCase | `contentStore.ts` |
| 타입/인터페이스 | PascalCase | `ContentManifest` |
| 상수 | UPPER_SNAKE_CASE | `DRAG_THRESHOLD` |
| 미사용 변수 | `_` 접두사 | `_unusedParam` |

### 임포트 순서

```typescript
// 1. 외부 패키지 (절대 경로)
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 2. 내부 모듈 (상대 경로)
import type { ContentManifest } from '@/types/content'
import { useContentStore } from '@/stores/content'
```

### 타입 정의

```typescript
// interface: 계약/구조 정의
interface ContentManifest {
  id: string
  title: string
}

// type: 유니온/교차 타입
type Subject = 'math' | 'science' | 'english'
type Grade = 'elementary-1' | 'elementary-2' | ...
```

---

## Vue 컴포넌트 패턴

### Script Setup (권장)

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContentManifest } from '@/types/content'

// Props (타입 추론)
const props = defineProps<{
  content: ContentManifest
  isActive?: boolean
}>()

// Props (기본값)
const props = withDefaults(defineProps<{
  isActive?: boolean
}>(), {
  isActive: false
})

// Emits
const emit = defineEmits<{
  click: [id: string]
  update: [content: ContentManifest]
}>()

// 반응형 상태
const isLoading = ref(false)
const items = ref<ContentManifest[]>([])

// 계산된 속성
const displayTitle = computed(() =>
  props.content.title.slice(0, 20)
)

// 메서드
function handleClick() {
  emit('click', props.content.id)
}

// 라이프사이클
onMounted(async () => {
  isLoading.value = true
  // 초기화 로직
  isLoading.value = false
})
</script>
```

### Scoped Styles

```vue
<style scoped>
/* 컴포넌트 로컬 스타일 */
.content-card {
  border-radius: 8px;
}

/* Deep 선택자 (자식 컴포넌트 스타일) */
.wrapper :deep(.child-class) {
  color: red;
}
</style>
```

---

## Pinia 스토어 패턴

### 스토어 정의

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useContentStore = defineStore('content', () => {
  // State
  const catalog = ref<ContentCatalog | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const contentCount = computed(() =>
    catalog.value?.contents.length ?? 0
  )

  const contentsBySubject = computed(() => {
    if (!catalog.value) return {}
    return groupBy(catalog.value.contents, 'subject')
  })

  // Actions
  async function fetchCatalog() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/content')
      const data = await response.json()
      catalog.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '알 수 없는 오류'
    } finally {
      isLoading.value = false
    }
  }

  function addContent(content: ContentManifest) {
    if (!catalog.value) return
    catalog.value.contents.push(content)
  }

  return {
    // State
    catalog,
    isLoading,
    error,
    // Getters
    contentCount,
    contentsBySubject,
    // Actions
    fetchCatalog,
    addContent
  }
})
```

### 스토어 사용

```vue
<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const store = useContentStore()

// 반응형 접근
console.log(store.contentCount)

// 액션 호출
await store.fetchCatalog()

// 스토어 리셋
store.$reset()
</script>
```

---

## Composable 패턴

### 컴포저블 정의

```typescript
// composables/useDragScroll.ts
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useDragScroll() {
  const containerRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const startX = ref(0)
  const scrollLeft = ref(0)

  const DRAG_THRESHOLD = 5

  function handleMouseDown(e: MouseEvent) {
    if (!containerRef.value) return
    isDragging.value = true
    startX.value = e.pageX - containerRef.value.offsetLeft
    scrollLeft.value = containerRef.value.scrollLeft
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging.value || !containerRef.value) return
    const x = e.pageX - containerRef.value.offsetLeft
    const walk = x - startX.value
    containerRef.value.scrollLeft = scrollLeft.value - walk
  }

  function handleMouseUp() {
    isDragging.value = false
  }

  function preventClickIfDragged(e: MouseEvent) {
    if (Math.abs(e.pageX - startX.value) > DRAG_THRESHOLD) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return {
    containerRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    preventClickIfDragged
  }
}
```

### 컴포저블 사용

```vue
<script setup lang="ts">
import { useDragScroll } from '@/composables/useDragScroll'

const {
  containerRef,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  preventClickIfDragged
} = useDragScroll()
</script>

<template>
  <div
    ref="containerRef"
    :class="{ 'is-dragging': isDragging }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @click="preventClickIfDragged"
  >
    <!-- 콘텐츠 -->
  </div>
</template>
```

---

## CSS 패턴

### CSS 변수 (콘텐츠용)

```css
:root {
  /* 필수 변수 */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --primary-color: #4A90D9;
  --bg-color: #f0f4f8;
  --text-color: #2c3e50;

  /* 선택적 변수 */
  --primary-dark: #3a7bc8;
  --primary-light: #6ba3e0;
  --accent-color: #f39c12;
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
}
```

### Glassmorphism

```css
.glass-panel {
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 16px;
}
```

### 반응형 유닛 (clamp)

```css
.title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.container {
  padding: clamp(1rem, 3vw, 2rem);
}
```

### 모바일 터치 타겟

```css
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

@media (hover: none) {
  .button:hover {
    /* 터치 디바이스에서 호버 효과 제거 */
    background: inherit;
  }
}
```

---

## 에러 처리 패턴

### API 호출

```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data }

  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '알 수 없는 오류'

    console.error('데이터 로드 실패:', message)
    return { success: false, error: message }
  }
}
```

### 입력 검증

```typescript
function validateGenerationRequest(body: unknown): body is GenerationRequest {
  if (!body || typeof body !== 'object') return false

  const req = body as Record<string, unknown>

  // 필수 필드
  if (!req.interests || !Array.isArray(req.interests)) return false
  if (!req.subject || typeof req.subject !== 'string') return false
  if (!req.grade || typeof req.grade !== 'string') return false

  // 값 범위
  if (req.interests.length > 10) return false
  if (!['math', 'english'].includes(req.subject)) return false

  return true
}
```

---

## 보안 패턴

### Path Traversal 방지

```typescript
import path from 'path'

const resolvedPath = path.resolve(userPath)
const allowedDir = path.resolve('public/contents')

if (!resolvedPath.startsWith(allowedDir)) {
  throw new Error('접근이 거부되었습니다')
}
```

### HTML 이스케이프

```typescript
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

### iframe 샌드박스

```typescript
const IFRAME_SANDBOX_ATTRS = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-popups',
  'allow-modals'
].join(' ')
```

---

## 다음 단계

- [프론트엔드 아키텍처](./frontend.md)
- [백엔드 아키텍처](./backend.md)
- [스타일링 가이드](../content-system/styling-guide.md)
