# Changelog - 2026-02-09

## 콘텐츠 임포트 및 세계사 과목 추가

### 새로운 과목
- "세계사"(world-history) 과목 추가 (Subject 타입, SUBJECT_LABELS, 아이콘, 색상, UI 전반)

### 임포트된 콘텐츠 (12개)

**수학 (10개)**
- `pythagorean-3d`: 피타고라스 정리 - 3D 큐브 증명 (중2)
- `rotation-solid`: 회전체 - 2D에서 3D로 (중3)
- `space-numbers`: 우주의 크기와 숫자 (초5)
- `pythagorean-isometric`: 피타고라스 탐험 3D - 아이소메트릭 Phaser (중2)
- `8bit-math-quest`: 8비트 수학 원정대: 연산 동굴 레이드 (초3)
- `fraction-precision-alpha~epsilon`: 분수 정밀도 게임 시리즈 5종 (초5)

**세계사 (2개)**
- `mario-country-quiz`: 슈퍼마리오 나라이름 퀴즈 (초4)
- `world-quiz-battle`: WORLD QUIZ BATTLE - 세계 상식 대전 (중1)

### 수정된 파일
- `src/types/content.ts`: Subject 타입에 'world-history' 추가
- `src/stores/content.ts`: subjects 배열에 'world-history' 추가
- `src/views/HomeView.vue`: subjectOptions에 'world-history' 추가
- `src/views/ContentView.vue`: badge 스타일 추가
- `src/views/MyLearningView.vue`: subjectIcons에 'world-history' 추가
- `src/components/home/ContentCard.vue`: colorMap에 'world-history' 추가
- `src/components/icons/IconSet.vue`: 'world-history' 아이콘(지구본) 추가
- `src/components/learning-map/SubjectTree.vue`: icons에 'world-history' 추가
- `src/composables/useAIGeneration.ts`: SUBJECT_GENERATION_HINTS에 'world-history' 추가
- `src/assets/styles/theme.css`: --color-subject-world-history 변수 추가
- `public/contents/index.json`: 12개 콘텐츠 항목 추가, lastUpdated 갱신
- `public/contents/common/edu-common.css`: 8bit-math-quest용 공유 CSS 추가

### 총 콘텐츠 수
- 변경 전: 55개
- 변경 후: 67개
