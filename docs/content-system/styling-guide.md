# 콘텐츠 스타일링 가이드

## 개요

모든 EduFlix 콘텐츠는 일관된 스타일링 패턴을 따릅니다. 각 콘텐츠는 자체 `style.css`를 가지며, 공유 `mobile.css`로 반응형 동작을 보장합니다.

---

## CSS 로드 순서

```html
<!-- 1. 콘텐츠별 스타일 (우선) -->
<link rel="stylesheet" href="style.css">

<!-- 2. 공유 모바일 스타일 (오버라이드) -->
<link rel="stylesheet" href="../../../common/mobile.css">
```

---

## CSS 변수

### 필수 변수

모든 콘텐츠에서 정의해야 하는 변수:

```css
:root {
  /* 애니메이션 */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* 색상 */
  --primary-color: #4A90D9;
  --bg-color: #f0f4f8;
  --text-color: #2c3e50;
}
```

### 선택적 변수

고급 콘텐츠/3D 콘텐츠용:

```css
:root {
  /* 애니메이션 */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* 색상 확장 */
  --primary-dark: #3a7bc8;
  --primary-light: #6ba3e0;
  --accent-color: #f39c12;
  --text-muted: #6c757d;

  /* 그래프 색상 */
  --line-color: #3498db;
  --grid-color: #ecf0f1;
  --axis-color: #2c3e50;

  /* 배경 */
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* 글래스모피즘 */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);

  /* 그림자 */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
}
```

---

## Scene 프레임워크

### 기본 레이아웃

```css
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  background-image: url('../../../backgrounds/bg-math-formulas-20260125.png');
  background-size: cover;
}

#scene-container {
  position: relative;
  max-width: 800px;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-lg);
  overflow: auto;
}
```

### Scene 전환

```css
.scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.scene.active {
  opacity: 1;
  pointer-events: all;
}

/* 선택적: 씬 진입 애니메이션 */
.scene.active {
  animation: sceneEnter 0.6s var(--ease-spring);
}

@keyframes sceneEnter {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## Hook Scene 스타일

```css
.hook-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.question-box {
  max-width: 600px;
}

.hook-question {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: bold;
  color: var(--text-color);
  line-height: 1.4;
}

.hook-subtext {
  color: #666;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.hook-visual {
  max-width: 400px;
  width: 100%;
}

.hook-visual svg {
  width: 100%;
  height: auto;
}
```

---

## 버튼 스타일

```css
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-spring);
  min-width: 44px;  /* 터치 타겟 */
  min-height: 44px;
}

.btn-primary-large {
  background: var(--primary-color);
  color: white;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-primary-large:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-secondary-large {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 14px 30px;
  font-size: 1.1rem;
}

.btn-secondary-large:hover {
  background: var(--primary-color);
  color: white;
}
```

---

## 퀴즈 스타일

```css
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.quiz-option {
  padding: 16px 24px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
}

.quiz-option:hover {
  border-color: var(--primary-color);
  background: #f8fafc;
}

.quiz-option.correct {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.quiz-option.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}
```

---

## 글래스모피즘

투명 배경 패널:

```css
.glass-panel {
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 16px;
  padding: 2rem;
}

.control-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}
```

---

## 반응형 유닛

### clamp() 함수

폰트 크기:

```css
.title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.text {
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
}
```

간격:

```css
.container {
  padding: clamp(1rem, 3vw, 2rem);
  gap: clamp(0.5rem, 2vw, 1rem);
}
```

### 터치 타겟

iOS HIG 준수 (최소 44px):

```css
.interactive-element {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

.slider-thumb {
  width: 44px;
  height: 44px;
}
```

---

## 모바일 반응형 (mobile.css)

### 브레이크포인트

```css
/* 모바일 기본 (0-575px) */
/* 기본 스타일이 여기에 적용 */

/* 스몰 태블릿 (576px+) */
@media (min-width: 576px) {
  /* 스타일 */
}

/* 태블릿 (768px+) */
@media (min-width: 768px) {
  /* 스타일 */
}

/* 데스크톱 (992px+) */
@media (min-width: 992px) {
  /* 스타일 */
}

/* 대형 데스크톱 (1200px+) */
@media (min-width: 1200px) {
  /* 스타일 */
}
```

### 모바일 오버라이드

```css
/* 모바일에서 전체 높이 사용 */
html, body {
  height: 100%;
  overflow-y: auto;
}

/* 씬을 상대 위치로 변경 */
.scene {
  position: relative;
}

/* 비활성 씬 완전 숨김 */
.scene:not(.active) {
  display: none !important;
}
```

---

## 애니메이션

### 기본 애니메이션

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 53%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-30px); }
  70% { transform: translateY(-15px); }
  90% { transform: translateY(-4px); }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease forwards;
}

.animate-bounce {
  animation: bounce 1s ease;
}

.animate-bounce-in {
  animation: bounceIn 0.6s var(--ease-spring);
}
```

---

## 인터랙티브 요소

### 슬라이더

```css
.slider-input {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e0e0e0;
  -webkit-appearance: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: grab;
  box-shadow: var(--shadow-sm);
}

.slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}
```

### 드래그 포인트

```css
.control-point {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: grab;
  transition: transform 0.2s ease;
}

.control-point:hover {
  transform: scale(1.2);
}

.control-point:active {
  cursor: grabbing;
  transform: scale(1.3);
}
```

---

## 3D 콘텐츠

Three.js 콘텐츠용:

```css
.three-container {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.three-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.size-controls,
.step-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}
```

---

## 피드백 스타일

```css
.scene-text.feedback-positive {
  color: #28a745;
  font-weight: bold;
}

.scene-text.feedback-negative {
  color: #dc3545;
  font-weight: bold;
}

.scene-text.feedback-neutral {
  color: var(--text-color);
}
```

---

## 다음 단계

- [EduFlixEngine 가이드](./eduflix-engine.md)
- [콘텐츠 매니페스트](./content-manifest.md)
- [코드 패턴](../architecture/code-patterns.md)
