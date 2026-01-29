# EduFlix 콘텐츠 구조

## 콘텐츠 조직 체계

### 디렉토리 구조

```
public/contents/
├── index.json              # 콘텐츠 카탈로그 (목록)
├── knowledge-map.json      # 지식 그래프 (관계)
│
├── common/                 # 공유 리소스
│   ├── engine.js           # EduFlixEngine
│   └── mobile.css          # 반응형 스타일
│
├── icons/                  # 공유 아이콘
├── diagrams/               # 공유 다이어그램
├── illustrations/          # 공유 일러스트
├── backgrounds/            # 공유 배경
│
├── math/                   # 수학 콘텐츠
│   ├── elementary/         # 초등
│   ├── middle/             # 중등
│   └── high/               # 고등
│
├── science/                # 과학 콘텐츠
│   ├── elementary/
│   ├── middle/
│   └── high/
│
└── english/                # 영어 콘텐츠 (아카이브)
```

### 개별 콘텐츠 구조

```
{subject}/{gradeLevel}/{contentId}/
├── index.html      # 메인 HTML (진입점)
├── style.css       # 콘텐츠별 스타일
├── script.js       # 로직 + EduFlixEngine
└── manifest.json   # 메타데이터
```

---

## 7-Scene 학습 구조

모든 콘텐츠는 **발견 기반 학습**을 위한 7단계 씬 구조를 따릅니다:

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Hook   │ → │ Anchor  │ → │  Story  │ → │  Core   │
│  (흥미)  │   │  (연결)  │   │  (배경)  │   │  (핵심)  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
                                               │
                                               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Wrap   │ ← │  Quiz   │ ← │Visualize│ ←─┘
│  (정리)  │   │  (확인)  │   │ (시각화) │
└─────────┘   └─────────┘   └─────────┘
```

### 각 씬의 역할

| 씬 | 목적 | 예시 (원의 넓이) |
|---|------|------------------|
| **Hook** | 호기심 유발하는 질문 | "원 모양 피자와 사각형 피자 중 어느 것이 더 클까?" |
| **Anchor** | 일상과 연결 | 피자 가게에서 원형 피자의 크기를 측정하는 상황 |
| **Story** | 문제 상황 제시 | 가장 큰 피자를 만들어야 하는 요리사 캐릭터 |
| **Core** | 핵심 개념 상호작용 | 반지름 슬라이더로 원 크기 조절, 넓이 공식 도출 |
| **Visualize** | 시각적 확인 | 원을 조각으로 나눠 직사각형으로 변환하는 애니메이션 |
| **Quiz** | 이해도 확인 | "반지름이 3cm인 원의 넓이는?" |
| **Wrap** | 학습 정리 | 공식 요약 + 다시하기/홈으로 버튼 |

---

## 콘텐츠 유형

### 1. 시뮬레이션 (Simulation)
사용자가 변수를 조작하며 결과를 관찰

```
예: 원의 넓이
- 반지름 슬라이더 조작
- 실시간 넓이 계산 표시
- 공식 시각화
```

### 2. 게임 (Game)
Phaser 기반 게임 형식 학습

```
예: 분수 피자
- 피자를 분수만큼 자르기
- 점수 획득 시스템
- 레벨 진행
```

### 3. 탐험 (Exploration)
가이드 탐색 형식 학습

```
예: 도형 탐험기
- 3D 도형 회전/확대
- 각 면/모서리 탐색
- 속성 발견
```

### 4. 퀴즈 (Quiz)
문제 풀이 중심 학습

```
예: 방정식 퍼즐
- 단계별 문제 제시
- 정답 선택
- 해설 제공
```

### 5. 스토리 (Story)
내러티브 중심 학습

```
예: (스토리 유형 콘텐츠)
- 캐릭터와 대화
- 스토리 진행
- 개념 자연스럽게 습득
```

---

## 콘텐츠 현황 상세

### 수학 - 초등 (9개)

| ID | 제목 | 학년 | 유형 |
|----|------|------|------|
| fractions-pizza | 분수 피자 | 3학년 | 게임 |
| shapes-explorer | 도형 탐험기 | 5학년 | 탐험 |
| 3d-shapes-discovery | 3D 도형 발견 | 3학년 | 탐험 |
| volume-explorer | 부피 탐험기 | 5학년 | 시뮬레이션 |
| box-volume | 상자 부피 | 5학년 | 시뮬레이션 |
| circle-area | 원의 넓이 | 5학년 | 시뮬레이션 |
| decimal-multiplication | 소수 곱셈 | 5학년 | 시뮬레이션 |
| fraction-division | 분수 나눗셈 | 6학년 | 시뮬레이션 |
| ratio-proportion | 비와 비율 | 6학년 | 시뮬레이션 |

### 수학 - 중등 (8개)

| ID | 제목 | 학년 | 유형 |
|----|------|------|------|
| equation-puzzle | 방정식 퍼즐 | 2학년 | 퀴즈 |
| pythagoras-theorem | 피타고라스 정리 | 3학년 | 시뮬레이션 |
| pythagorean-squares | 피타고라스 정사각형 | 3학년 | 시뮬레이션 |
| probability-coin | 확률 동전 | 2학년 | 시뮬레이션 |
| linear-slope | 일차함수 기울기 | 2학년 | 시뮬레이션 |
| negative-addition | 음수 덧셈 | 1학년 | 시뮬레이션 |
| 3d-coordinate-system | 3D 좌표계 | 1학년 | 시뮬레이션 |
| space-diagonal | 공간 대각선 | 3학년 | 시뮬레이션 |

### 수학 - 고등 (2개)

| ID | 제목 | 학년 | 유형 |
|----|------|------|------|
| quadratic-graph | 이차함수 그래프 | 1학년 | 시뮬레이션 |
| 3d-vectors | 3D 벡터 | 1학년 | 시뮬레이션 |

### 과학 (2개)

| ID | 제목 | 학년 | 유형 |
|----|------|------|------|
| cell-explorer | 세포 탐험기 | 중등 1학년 | 탐험 |
| chemical-reactor | 화학 반응기 | 고등 1학년 | 시뮬레이션 |

---

## 공유 리소스

### 아이콘 (icons/)

| 파일명 | 용도 |
|--------|------|
| icon-arithmetic-basic-color.svg | 기본 연산 |
| icon-help-question-cute.svg | 도움말/힌트 |
| icon-home-cute.svg | 홈 버튼 |
| icon-lightbulb-idea-bright.svg | 아이디어/힌트 |
| icon-star-reward-cute.svg | 보상/별점 |
| icon-trophy-achievement-cute.svg | 완료/트로피 |

### 다이어그램 (diagrams/)

| 파일명 | 용도 |
|--------|------|
| diagram-circle-anatomy-parts.svg | 원 구성 요소 |
| diagram-fraction-pie-thirds.svg | 분수 파이 |
| diagram-prism-net-unfolded.svg | 각기둥 전개도 |
| diagram-pythagorean-theorem.svg | 피타고라스 정리 |
| diagram-ratio-proportion-blocks.svg | 비와 비율 |

### 배경 (backgrounds/)

| 패턴 | 용도 |
|------|------|
| bg-geometric-shapes-* | 도형 콘텐츠 |
| bg-grid-paper-* | 좌표/그래프 |
| bg-math-formulas-overlay | 수학 공식 배경 |
| bg-numbers-pattern | 숫자 패턴 |
| bg-science-*-pattern | 과학 콘텐츠 |

---

## 다음 단계

- [사용자 가이드](./user-guide.md) - 콘텐츠 사용 방법
- [EduFlixEngine 가이드](../content-system/eduflix-engine.md) - 엔진 상세
- [콘텐츠 매니페스트](../content-system/content-manifest.md) - 메타데이터 스키마
