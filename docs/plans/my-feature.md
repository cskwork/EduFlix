# Plan: EduFlix - Netflix 스타일 교육 콘텐츠 플랫폼

## 개요
초등~고등학생 대상 인터랙티브 교육 콘텐츠 플랫폼. Netflix UI + AI 콘텐츠 생성.

## 기술 스택
- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Bun (경량 서버, API 프록시)
- **AI**: Claude (Anthropic) + Gemini (이미지)
- **Storage**: 로컬 파일시스템 (정적 호스팅)
- **콘텐츠**: Vanilla HTML/CSS/JS (독립 실행 가능)

## Validation Commands
```bash
cd /Users/chaeseong-gug/Documents/PARA/Resource/EduFlix
bun run dev          # 개발 서버 실행
bun run build        # 프로덕션 빌드
bun run test         # 테스트 실행
bun run lint         # 린트 검사
```

---

### Task 1: 프로젝트 초기화
- [x] Vite + Vue 3 + TypeScript 프로젝트 생성
- [x] 디렉토리 구조 생성 (`src/`, `contents/`, `agents/`, `server/`)
- [x] ESLint, Prettier 설정
- [x] `.env.example` 생성 (ANTHROPIC_API_KEY, GEMINI_API_KEY)

**Files**: `package.json`, `vite.config.ts`, `tsconfig.json`

---

### Task 2: 타입 정의 및 기본 구조
- [ ] `src/types/content.ts` - 콘텐츠 매니페스트 스키마
- [ ] `src/types/knowledge-map.ts` - 지식맵 타입
- [ ] `src/types/generation.ts` - AI 생성 관련 타입
- [ ] Vue Router 설정 (`/`, `/content/:id`, `/create`)

**Files**: `src/types/*.ts`, `src/router/index.ts`

---

### Task 3: 레이아웃 및 헤더
- [ ] `App.vue` - 기본 레이아웃
- [ ] `AppHeader.vue` - 상단 네비게이션
- [ ] `ModeToggle.vue` - 보기/창조 모드 토글 (우상단)
- [ ] 전역 CSS 변수 및 Netflix 스타일 테마

**Files**: `src/App.vue`, `src/components/common/*.vue`, `src/assets/styles/`

---

### Task 4: 홈 화면 (보기 모드)
- [ ] `HomeView.vue` - 메인 홈 페이지
- [ ] `ContentRow.vue` - 가로 스크롤 콘텐츠 행 (과목별)
- [ ] `ContentCard.vue` - 정사각형 카드 (호버 시 확대/미리보기)
- [ ] `stores/content.ts` - Pinia 콘텐츠 상태 관리

**Files**: `src/views/HomeView.vue`, `src/components/home/*.vue`, `src/stores/content.ts`

---

### Task 5: 콘텐츠 뷰어
- [ ] `ContentView.vue` - 콘텐츠 상세 페이지
- [ ] `ContentViewer.vue` - iframe 샌드박스 뷰어
- [ ] `services/content/loader.ts` - 콘텐츠 로딩 서비스
- [ ] 전체화면 모드 지원

**Files**: `src/views/ContentView.vue`, `src/components/viewer/*.vue`, `src/services/content/loader.ts`

---

### Task 6: 샘플 콘텐츠 템플릿
- [ ] 기본 HTML 템플릿 (`agents/content-generator/templates/base.html`)
- [ ] 공통 CSS 스타일 (게임 UI, 버튼, 애니메이션)
- [ ] 인터랙션 유틸리티 JS (드래그앤드롭, 퀴즈 로직)
- [ ] `contents/index.json` 인덱스 파일

**Files**: `agents/content-generator/templates/*.html`, `contents/index.json`

---

### Task 7: 첫 3개 콘텐츠 제작 (AI + 수정)
- [ ] **수학 초3**: 피자로 배우는 분수 (game) - 한국어
- [ ] **과학 초4**: 태양계 여행 (simulation) - 한국어
- [ ] **영어 초3**: Word Safari (game) - 영어
- [ ] 각 콘텐츠 `manifest.json` 작성

**Files**:
- `contents/math/elementary/fractions-pizza/`
- `contents/science/elementary/solar-system/`
- `contents/english/elementary/word-safari/`

---

### Task 8: 백엔드 서버 (Bun)
- [ ] `server/index.ts` - Bun HTTP 서버
- [ ] `server/routes/generate.ts` - AI 생성 API 엔드포인트
- [ ] `server/routes/content.ts` - 콘텐츠 CRUD API
- [ ] Claude API 프록시 (API 키 보호)

**Files**: `server/index.ts`, `server/routes/*.ts`

---

### Task 9: 창조 모드 UI
- [ ] `CreatorView.vue` - 창조 모드 페이지
- [ ] `CreatorWizard.vue` - 생성 마법사 컨테이너
- [ ] `InterestInput.vue` - 관심사 입력 (태그 형식)
- [ ] `SubjectSelect.vue` - 과목 선택 (수학/과학/영어)
- [ ] `GradeSelect.vue` - 학년 선택 (초/중/고 + 학년)
- [ ] `GenerationProgress.vue` - 생성 진행 상태

**Files**: `src/views/CreatorView.vue`, `src/components/creator/*.vue`

---

### Task 10: AI 생성 파이프라인
- [ ] `services/api/claude.ts` - Claude API 래퍼
- [ ] `services/api/gemini.ts` - Gemini 이미지 API 래퍼
- [ ] `agents/content-generator/prompts/system.md` - 시스템 프롬프트
- [ ] 과목별 특화 프롬프트 (math.md, science.md, english.md)
- [ ] `stores/generation.ts` - 생성 상태 관리
- [ ] `useAIGeneration.ts` - 생성 컴포저블

**Files**: `src/services/api/*.ts`, `agents/content-generator/prompts/*.md`, `src/stores/generation.ts`

---

### Task 11: 나머지 7개 콘텐츠 (AI 생성)
- [ ] **수학 초5**: 도형 탐험가 (exploration) - 한국어
- [ ] **수학 중2**: 방정식 퍼즐 (quiz) - 한국어
- [ ] **과학 초6**: 전기회로 실험실 (simulation) - 한국어
- [ ] **과학 중1**: 세포 탐험 (exploration) - 한국어
- [ ] **과학 고1**: 화학 반응 시뮬레이터 (simulation) - 한국어
- [ ] **영어 중2**: Grammar Quest (quiz) - 영어
- [ ] **영어 고1**: Debate Arena (story) - 영어

**Files**: `contents/{subject}/{level}/{content-name}/`

---

### Task 12: 지식맵 데이터
- [ ] `contents/knowledge-map.json` 작성
- [ ] 각 콘텐츠와 지식 노드 연결
- [ ] 선수 지식 관계 정의

**Files**: `contents/knowledge-map.json`

---

### Task 13: 반응형 및 마무리
- [ ] 모바일 반응형 CSS
- [ ] 키보드 네비게이션 지원
- [ ] 로딩 상태, 에러 처리 UI
- [ ] README.md 작성

**Files**: `src/assets/styles/responsive.css`, `README.md`

---

### Task 14: 테스트 및 검증
- [ ] 콘텐츠 로딩 단위 테스트
- [ ] AI 생성 파이프라인 테스트
- [ ] 모든 10개 콘텐츠 수동 검증
- [ ] 크로스 브라우저 테스트

**Files**: `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts`

---

## 10개 콘텐츠 목록

| # | 과목 | 학년 | 제목 | 타입 | 언어 |
|---|------|------|------|------|------|
| 1 | 수학 | 초3 | 피자로 배우는 분수 | game | 한국어 |
| 2 | 수학 | 초5 | 도형 탐험가 | exploration | 한국어 |
| 3 | 수학 | 중2 | 방정식 퍼즐 | quiz | 한국어 |
| 4 | 과학 | 초4 | 태양계 여행 | simulation | 한국어 |
| 5 | 과학 | 초6 | 전기회로 실험실 | simulation | 한국어 |
| 6 | 과학 | 중1 | 세포 탐험 | exploration | 한국어 |
| 7 | 과학 | 고1 | 화학 반응 시뮬레이터 | simulation | 한국어 |
| 8 | 영어 | 초3 | Word Safari | game | English |
| 9 | 영어 | 중2 | Grammar Quest | quiz | English |
| 10 | 영어 | 고1 | Debate Arena | story | English |

---

## 검증 체크리스트

구현 완료 후 확인:
- [ ] `bun run dev` - 개발 서버 정상 실행
- [ ] 홈 화면에서 10개 콘텐츠 카드 표시
- [ ] 각 콘텐츠 클릭 시 iframe 뷰어에서 정상 실행
- [ ] 모드 토글(보기/창조) 동작 확인
- [ ] 창조 모드에서 관심사/과목/학년 입력 후 콘텐츠 생성
- [ ] 생성된 콘텐츠가 홈 화면에 추가됨
- [ ] 모바일 화면에서 반응형 레이아웃 확인
