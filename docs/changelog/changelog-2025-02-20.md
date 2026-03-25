# Changelog 2025-02-20

## 수학 콘텐츠 감사 및 품질 개선

### 정리
- `public/contents/math/elementary/20260127-topic-5f41ee24/` 빈 디렉토리 삭제 (index.json 미등록)

### pythagorean-squares (전면 개선)
- `index.html`: 인터랙티브 슬라이더 (앵커 씬), 캔버스 기반 핵심 시각화, 인라인 퀴즈 피드백 추가
- `script.js`: alert() 퀴즈를 인라인 피드백으로 교체, a/b 슬라이더 캔버스 드로잉, 순차 애니메이션, 색상 코딩 수식
- `style.css`: 그라데이션 버튼, 색상별 슬라이더, 퀴즈 피드백 애니메이션, 컨페티, 반응형 개선 (48px 최소 높이)

### fraction-division (버그 수정)
- `index.html`: 미사용 Three.js CDN 3개 제거 (~500KB 절감), 빈 3D 컨테이너를 SVG 피자로 교체, mobile.css 추가, 비활성 버튼 수정
- `style.css`: `.model-container`를 `.hook-pizza-visual` 스타일로 교체

### linear-slope (모바일 터치 수정)
- `script.js`: SVG viewBox 추가 (500x400), 터치 이벤트 지원 (touchstart/touchmove/touchend), viewBox 스케일 보정

### 변경 불필요 (이미 고품질)
- `negative-addition`: 글래스모피즘 CSS, 펭귄 수직선 애니메이션
- `box-volume`: Phaser 아이소메트릭 큐브 게임 (706줄)
- `ratio-proportion`: Phaser 사이버 에이전트 게임 (424줄)
- `quadratic-graph`: 슬라이더 포물선 탐색기, 핑크/퍼플 테마
- `probability-coin`:  동전 던지기 시뮬레이션, 대수의 법칙
- `space-diagonal`: Three.js 3D 와이어프레임 공간 대각선
