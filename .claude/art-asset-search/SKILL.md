---
name: art-asset-search
description: 한국 교육용 아트 에셋 검색. 카테고리(icons, illustrations, diagrams, backgrounds, 3d), 태그(elementary, middle-school, high-school, math, geometry 등), 설명 키워드로 검색. "에셋 찾기", "아이콘 검색", "교육용 이미지", "수학 다이어그램", "3D 모델 찾기" 요청 시 사용.
---

# Art Asset Search Skill

한국 교육용 아트 에셋을 검색하고 통합 코드를 제공하는 스킬.

## Repository Location

- **경로**: `/Users/chaeseong-gug/Documents/PARA/Resource/art-assets/`
- **인덱스 파일**: `assets-index.json` (LLM 최적화, 경량)
- **전체 메타데이터**: `assets.json` (기존 호환 형식)

## 카테고리

| 카테고리 | 설명 | 기본 형식 | 에셋 수 |
|----------|------|----------|---------|
| icons | 아이콘 (UI, 교육용) | SVG | 34 |
| illustrations | 일러스트레이션 | SVG/PNG | 38 |
| diagrams | 다이어그램, 차트, 그래프 | SVG/PNG | 35 |
| backgrounds | 배경 이미지 | PNG/JPG | 27 |
| 3d | 3D 모델 (Three.js용) | GLB | 25 |

**총 에셋**: 159개

## 태그 분류

### 교육 수준
- `elementary` - 초등학교
- `middle-school` - 중학교
- `high-school` - 고등학교

### 주요 과목
- **수학**: `math`, `arithmetic`, `geometry`, `algebra`, `calculus`, `statistics`, `trigonometry`
- **과학**: `science`, `chemistry`, `biology`, `physics`
- **기타**: `geography`, `history`, `music`, `art`, `literature`

### 수학 세부
- `fraction` - 분수
- `coordinate` - 좌표
- `parabola` - 포물선
- `integral` - 적분
- `matrix` - 행렬
- `vector` - 벡터
- `probability` - 확률
- `platonic-solid` - 플라톤 다면체

### 기하학
- `shapes` - 도형
- `triangle` - 삼각형
- `circle` - 원
- `cylinder` - 원기둥
- `cone` - 원뿔
- `pyramid` - 피라미드
- `sphere` - 구
- `torus` - 토러스

### UI/UX
- `ui` - UI 요소
- `navigation` - 네비게이션
- `achievement` - 성취/보상
- `cute` - 귀여운 스타일 (초등용)

## 검색 절차

### Step 1: 사용자 쿼리 분석
사용자 요청에서 다음을 추출:
- **카테고리**: icons, illustrations, diagrams, backgrounds, 3d
- **교육 수준**: elementary, middle-school, high-school
- **과목/주제**: math, geometry, science 등
- **키워드**: 설명에서 검색할 한국어/영어 단어

### Step 2: 인덱스 파일 읽기
```bash
# assets-index.json 읽기
Read /Users/chaeseong-gug/Documents/PARA/Resource/art-assets/assets-index.json
```

### Step 3: 필터링 및 매칭
인덱스 구조:
```json
{
  "id": "icon-checkmark-green-20260124",
  "c": "icons",           // 카테고리
  "t": ["success", "ui"], // 태그 배열
  "d": "녹색 체크마크"      // 설명 (한국어)
}
```

필터링 우선순위:
1. 카테고리 일치 (`c` 필드)
2. 태그 일치 (`t` 배열)
3. 설명 키워드 일치 (`d` 필드)

### Step 4: 결과 출력
상위 N건 반환 (기본 5건). 결과 형식은 아래 참조.

## 경로 생성 규칙

```
{category}/{id}.{format}
```

| 카테고리 | 기본 형식 | 예시 경로 |
|----------|----------|----------|
| icons | svg | `icons/icon-checkmark-green-20260124.svg` |
| illustrations | svg | `illustrations/illust-student-desk-study-20260124.svg` |
| diagrams | svg | `diagrams/diagram-parabola-graph-gradient-20260124.svg` |
| backgrounds | png | `backgrounds/bg-gradient-soft-blue-20260125.png` |
| 3d | glb | `3d/3d-tetrahedron-math-20260125.glb` |

## 출력 형식 템플릿

```markdown
## 검색 결과

**검색어**: {user_query}
**결과**: {N}건

| # | ID | 카테고리 | 설명 | 태그 |
|---|-----|---------|------|------|
| 1 | {id} | {category} | {description} | {tags} |
| 2 | ... | ... | ... | ... |

### 통합 코드

#### HTML
\`\`\`html
<img src="/art-assets/{path}" alt="{description}" />
\`\`\`

#### Vue
\`\`\`vue
<template>
  <img :src="assetPath" alt="{description}" />
</template>

<script setup>
const assetPath = '/art-assets/{path}';
</script>
\`\`\`

#### Three.js (3D 에셋용)
\`\`\`javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('/art-assets/{path}', (gltf) => {
  scene.add(gltf.scene);
});
\`\`\`
```

## 통합 코드 예제

### Vue 컴포넌트에서 이미지 사용

```vue
<template>
  <div class="asset-container">
    <!-- 아이콘 -->
    <img :src="`/art-assets/icons/${iconId}.svg`" :alt="iconAlt" />

    <!-- 배경 이미지 -->
    <div
      class="hero-section"
      :style="{ backgroundImage: `url(/art-assets/backgrounds/${bgId}.png)` }"
    >
    </div>
  </div>
</template>

<script setup>
const iconId = 'icon-star-reward-cute-20260124';
const iconAlt = '귀여운 별 보상 아이콘';
const bgId = 'bg-gradient-soft-blue-20260125';
</script>
```

### Three.js에서 3D 모델 로딩

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 씬 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// GLB 모델 로딩
const loader = new GLTFLoader();
loader.load(
  '/art-assets/3d/3d-tetrahedron-math-20260125.glb',
  (gltf) => {
    scene.add(gltf.scene);
    console.log('3D 모델 로딩 완료');
  },
  (progress) => {
    console.log(`로딩 진행: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
  },
  (error) => {
    console.error('모델 로딩 오류:', error);
  }
);

// 컨트롤 (마우스로 회전)
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5;
```

### HTML에서 직접 참조

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .hero {
      background-image: url('/art-assets/backgrounds/bg-grid-paper-20260125.png');
      background-size: cover;
    }
    .icon {
      width: 32px;
      height: 32px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <img class="icon" src="/art-assets/icons/icon-home-cute-20260124.svg" alt="홈" />
    <img class="icon" src="/art-assets/icons/icon-star-reward-cute-20260124.svg" alt="별" />
  </div>
</body>
</html>
```

## 사용 예시

### 예시 1: 초등학교 수학 아이콘

**요청**: "초등학교 수학 아이콘 찾아줘"

**검색 조건**:
- 카테고리: `icons`
- 태그: `elementary`, `math`

**예상 결과**:
- `icon-arithmetic-basic-color-20260124` - 기초 산수 연산자 아이콘
- `icon-shapes-primary-bold-20260124` - 기본 기하학 도형 아이콘

### 예시 2: 기하학 다이어그램

**요청**: "기하학 다이어그램 검색"

**검색 조건**:
- 카테고리: `diagrams`
- 태그: `geometry`

**예상 결과**:
- `diagram-triangle-area-labeled-20260124` - 높이와 밑변이 표시된 삼각형
- `diagram-pythagorean-theorem-20260124` - 피타고라스 정리 시각화

### 예시 3: Three.js용 3D 입체도형

**요청**: "Three.js용 3D 입체도형 모델"

**검색 조건**:
- 카테고리: `3d`
- 태그: `geometry`, `입체도형`

**예상 결과**:
- `3d-elementary-sphere-red-20260125` - 빨간색 구
- `3d-elementary-cylinder-blue-20260125` - 파란색 원기둥
- `3d-tetrahedron-math-20260125` - 정사면체

### 예시 4: 귀여운 UI 아이콘 (초등용)

**요청**: "귀여운 UI 아이콘"

**검색 조건**:
- 카테고리: `icons`
- 태그: `cute`, `ui`

**예상 결과**:
- `icon-home-cute-20260124` - 귀여운 홈 버튼 아이콘
- `icon-star-reward-cute-20260124` - 귀여운 별 보상 아이콘
- `icon-trophy-achievement-cute-20260124` - 귀여운 트로피 성취 아이콘

## 주의사항

1. **경로 조합**: 항상 `{category}/{id}.{format}` 형식으로 경로 생성
2. **기본 형식**: 카테고리별 기본 형식 참조 (icons=svg, 3d=glb 등)
3. **한국어 검색**: 설명(`d`)은 한국어로 되어 있으므로 한국어 키워드로 검색 가능
4. **태그 기반 검색**: 정확한 검색을 위해 태그 사용 권장
5. **3D 에셋**: Three.js GLTFLoader 사용 필수

## 참고 파일

- `references/tag-reference.md` - 전체 태그 목록 및 상세 분류
