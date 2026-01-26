# 2026-01-26 Changelog

## art-assets edu-content Import (5개 콘텐츠)

### 신규 콘텐츠 추가
- `box-volume`: 직육면체의 부피 (초5)
- `circle-area`: 원의 넓이 (초5)
- `decimal-multiplication`: 소수의 곱셈 (초5)
- `fraction-division`: 분수의 나눗셈 (초6)
- `ratio-proportion`: 비와 비율 (초6)

### 공유 리소스 복사
- Icons: `icon-help-question-cute`, `icon-lightbulb-idea-bright`, `icon-star-reward-cute`, `icon-arithmetic-basic-color`
- Diagrams: `diagram-prism-net-unfolded`, `diagram-circle-anatomy-parts`, `diagram-fraction-pie-thirds`, `diagram-ratio-proportion-blocks`
- Illustrations: `illust-calculator-math-simple` (새 디렉토리 생성)

### 카탈로그 업데이트
- `public/contents/index.json`: 16개 -> 21개 콘텐츠
- 수학 초등: 4개 -> 9개

---

## Contents 수정

### Three.js CDN 버전 다운그레이드 (5개 파일)
- `volume-explorer/index.html`: v0.160.0 -> v0.128.0
- `3d-shapes-discovery/index.html`: v0.160.0 -> v0.128.0
- `3d-coordinate-system/index.html`: v0.160.0 -> v0.128.0
- `space-diagonal/index.html`: v0.160.0 -> v0.128.0
- `3d-vectors/index.html`: v0.160.0 -> v0.128.0

OrbitControls 호환성 문제 해결 (THREE.OrbitControls is not a constructor 오류)

### cell-explorer CSS 추가
- `cell-explorer/style.css`: 세포소기관 스타일 추가 (nucleus, mitochondria, ribosome)

## ContentRow 드래그 스크롤 기능 추가

### 신규 파일
- `src/composables/useDragScroll.ts`: 마우스 드래그 스크롤 컴포저블
  - mousedown/mousemove/mouseup 이벤트 핸들링
  - 드래그 임계값(5px) 적용으로 클릭과 드래그 구분
  - 전역 이벤트 리스너로 창 밖 드래그 처리

### 수정된 파일
- `src/components/home/ContentRow.vue`:
  - useDragScroll 컴포저블 연동
  - `.is-dragging` 클래스 토글 (커서 변경, scroll-snap 비활성화)
  - 모바일/터치 디바이스에서 스크롤 버튼 숨김 처리

- `src/assets/styles/responsive.css`:
  - `.row-controls` -> `.scroll-btn` 선택자 수정 (실제 클래스명과 일치)

---

## 모바일 콘텐츠 뷰어 레이아웃 개선

### 변경 사항
- `src/App.vue`: 콘텐츠 페이지(`/content/:id`)에서 전역 헤더 숨김 처리
- `src/App.vue`: 콘텐츠 페이지 전용 레이아웃 클래스 추가로 상단 패딩 제거 및 뷰포트 높이 보정
- `src/composables/useViewportHeight.ts`: 모바일 뷰포트 높이 계산 유틸 추가
- `src/views/ContentView.vue`: 뷰어 컨테이너 높이를 `--app-vh` 기준으로 계산
- `src/assets/styles/responsive.css`: 뷰어 컨테이너 높이 계산식 보정
- `public/contents/common/mobile.css`: iframe 콘텐츠 body 고정 포지션 제거 및 높이 계산 보정
- `src/assets/styles/responsive.css`: 모바일 구간에서 콘텐츠 뷰어 컨테이너를 fixed로 배치

모바일 iframe 콘텐츠 하단에 발생하던 검은 여백을 제거하고 기본 화면이 전체 뷰포트를 채우도록 조정

---

## iframe 콘텐츠 스크롤 개선

### 변경 사항
- `public/contents/common/mobile.css`: `#app` 높이를 콘텐츠에 맞게 확장하고 세로 스크롤 허용, body flex 정렬 해제
- `src/components/viewer/ContentViewer.vue`: iframe `scrolling="auto"` 속성 추가

긴 콘텐츠가 iframe 안에서 잘리지 않고 스크롤 가능하도록 처리

---

## linear-slope 스토리 텍스트 레이아웃 수정

### 변경 사항
- `public/contents/common/mobile.css`: 모바일/태블릿 전용 레이아웃 오버라이드 범위를 `max-width: 1023px`로 제한

데스크톱 환경에서 스토리 텍스트가 메인 콘텐츠 영역 밖으로 밀리는 현상을 방지

---

## 메인 검색 기능 추가

### 변경 사항
- `src/components/common/AppHeader.vue`: 검색 입력 토글 UI와 쿼리 동기화 추가
- `src/views/HomeView.vue`: URL 쿼리(q, subject) 기반 필터 동기화 추가
- `src/stores/content.ts`: 검색어 필터 및 관련 액션 추가
- `src/composables/useKeyboardNavigation.ts`: `/` 단축키로 검색 입력 포커스
- `tests/unit/generation.test.ts`: 검색 필터 테스트 추가

---

## decimal-multiplication 이미지 경로 수정

### 변경 사항
- `public/contents/math/elementary/decimal-multiplication/index.html`: 아이콘/일러스트 경로를 `/contents` 절대 경로로 수정
- `public/contents/math/elementary/decimal-multiplication/style.css`: 배경 이미지 경로를 `/contents` 절대 경로로 수정
- `tests/unit/decimal-multiplication-assets.test.ts`: 이미지 경로 회귀 테스트 추가

---

## 콘텐츠 자산 경로 일괄 정리

### 변경 사항
- `public/contents/**/*.html`: 아이콘/다이어그램 경로를 `/contents` 절대 경로로 통일
- `public/contents/**/*.css`: 배경 이미지 경로를 `/contents` 절대 경로로 통일
- `tests/unit/content-asset-paths.test.ts`: 콘텐츠 자산 경로 회귀 테스트 추가

---

## 전체 화면 크기 반응형 수정 (하단 검은색 영역 완전 제거)

### 문제
- 0-767px (모바일/소형 태블릿) 및 가로 모드에서 iframe 콘텐츠 하단에 검은색 영역 발생
- 근본 원인: `100%` 높이가 dvh 폴백 없음, iOS Safari 브라우저 UI 변경 시 빈 공간

### 변경 사항

**mobile.css**:
- 기본 모바일 스타일: `#scene-container` height를 `100dvh`로 변경 (vh 폴백 포함)
- 기본 모바일 스타일: `.scene` height를 `auto`로 변경 (콘텐츠에 맞게 조절)
- 576px+ 브레이크포인트: dvh 처리 추가
- 가로 모드: `.scene` 및 `#scene-container`에 dvh 처리 추가

**responsive.css**:
- <480px: `.viewer-container` height를 `calc(100dvh - var(--header-height))`로 변경
- 480-767px: `.viewer-container` height를 `calc(100dvh - var(--header-height))`로 변경
- 가로 모드: `.viewer-container` height를 `calc(100dvh - 48px)`로 변경

---

## 태블릿 iframe 콘텐츠 하단 검은색 화면 수정 (이전 작업)

### 문제
- 태블릿(768px-1023px)에서 iframe 콘텐츠 하단이 검은색으로 표시됨
- 원인: `100vh`가 브라우저 UI(주소창/탭바)를 고려하지 않음 + `overflow: hidden`으로 콘텐츠 잘림

### 변경 사항
- `public/contents/common/mobile.css` (309-338번째 줄):
  - `html, body`: `overflow: hidden` -> `overflow: auto` (스크롤 허용)
  - `#scene-container`: `height: 100vh` -> `height: 100dvh` + 폴백 (동적 뷰포트 높이)
  - `.scene`: `position: absolute` -> `position: relative`, `height: auto` + `min-height: 100%`

---

## 콘텐츠 뷰어 높이 보정 (중간 해상도 검은 영역 방지)

### 변경 사항
- `src/composables/useViewportHeight.ts`: `visualViewport`가 작게 계산될 때 `innerHeight` 기준으로 CSS 변수 설정
- `src/views/ContentView.vue`: `viewer-container`에 `100dvh` 기반 높이/최소 높이 추가
- `src/App.vue`: 콘텐츠 페이지 최소 높이에 `100dvh` 추가
- `tests/unit/viewport-height.test.ts`: 작은 `visualViewport` fallback 테스트 추가
- `tests/unit/content-view-height.test.ts`: 콘텐츠 뷰어/레이아웃 dvh 규칙 테스트 추가

---

## 중간 해상도 뷰어 하단 여백 제거

### 변경 사항
- `src/assets/styles/responsive.css`: 768px-1023px 구간에서도 `viewer-container` 고정 배치
- `tests/unit/mobile-viewer-layout.test.ts`: 태블릿 구간 fixed 배치 테스트 추가

---

## Chrome 90% 줌 하단 여백 보정

### 변경 사항
- `src/views/ContentView.vue`: 768px-1199px 및 1200px+ 구간에서 `viewer-container` 고정 배치로 계산 오차 방지
- `tests/unit/content-view-height.test.ts`: 중간/대형 화면 고정 배치 규칙 테스트 추가
