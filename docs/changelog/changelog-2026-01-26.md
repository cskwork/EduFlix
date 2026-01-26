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
