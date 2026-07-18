# Changelog 2026-07-18

## 키즈 친화 리디자인 "캔디 팝 플레이그라운드" + 오리지널 마스코트 도입

### 배경
- 요구사항: 앱을 아이 친화적이고 트렌디하게 개편, 마스코트 도입(라부부 감성의 귀여운 캐릭터), 웹/모바일/태블릿 완전 대응.
- 라부부는 Pop Mart의 저작권 캐릭터이므로 그대로 사용하지 않고, 같은 감성(복슬복슬한 크림색 털, 큰 눈, 장난기 있는 이빨 웃음, 긴 토끼 귀)의 오리지널 캐릭터를 GPT Image 2(Codex CLI)로 생성.

### 디자인 결정
- Netflix 다크 테마 → 라이트 캔디 테마로 전면 전환.
  - 채택: 따뜻한 크림 배경(#fff6eb) + 산호 오렌지(#ff5c39) + 블루베리 잉크 텍스트(#3b3562) + 과목별 캔디 컬러(teal/blue/amber/pink), 스티커 스타일(2px 잉크 보더 + 하드 오프셋 그림자), pill 버튼의 눌리는(press) 인터랙션, Jua 디스플레이 폰트 + Pretendard 본문.
  - 기각한 대안 1: 다크 유지 + 네온 포인트 — 초등 저학년 타깃에 부적합, 콘텐츠(대부분 밝은 배경 iframe)와 부조화.
  - 기각한 대안 2: 흰색 배경 + 보라 그라디언트 — 전형적 AI 생성 스타일이라 차별성 없음.
- 기존 CSS 변수명을 유지한 채 theme.css 값만 교체해 전 컴포넌트에 전파, 하드코딩된 다크 색상만 개별 교체. 변수 계약 유지로 회귀 위험 최소화.

### 마스코트 파이프라인
- `scripts/generate-mascot.sh`: 첫 이미지(wave)를 레퍼런스로 `--ref` 파생 생성 → 포즈 5종(wave/cheer/think/book/rocket)의 캐릭터 일관성 확보.
- 원본(1024급 PNG, 각 1.4~1.9MB)은 `art/mascot-originals/` 보관, 서빙용은 640px PNG + WebP(q85, 각 15~21KB)로 `public/mascot/`에 배치. UI는 WebP 참조.
- 흰 배경 이미지를 투명화하지 않고 "스티커 프레임"(흰 blob + 보더 + 오프셋 그림자) 안에 배치 — 배경 제거 후처리의 품질 리스크(크림색 털과 흰 배경 유사) 회피, 디자인적으로도 트렌디한 스티커 룩과 일치.
- 이미지 로드 실패 시 대비: 로고/빈 상태/에러 컴포넌트에 `@error` 폴백(숨김 또는 기존 SVG 아이콘).

### 변경 파일
- 기반: `index.html`(폰트/메타/파비콘), `theme.css`(전면 재작성), `responsive.css`(다크 잔재 제거, 고대비 모드 라이트화), `App.vue`(배경 투명화로 도트 패턴 노출).
- 핵심 화면: `AppHeader`(마스코트 로고, pill 내비), `HomeView`(히어로: 마스코트 스티커 + 플로팅 장식 + 형광펜 하이라이트), `ContentCard`(스티커 카드 + 과목 컬러 라인), `ContentRow`(원형 스크롤 버튼, 호버 리프트 클리핑 방지 여백), `NotFoundView`/`EmptyState`/`ErrorMessage`(마스코트 적용).
- 보조 화면(서브에이전트 병렬 전환): `TabNavigation`, `MyLearningView`, `LearningMapView`, `SubjectTree`, `NodeCard`, `ModeToggle`, `IconSet` 상태색 / `ContentView`, `ContentViewer`, `CreatorView`, creator 6종, editor 5종.

### 검증
- `bun run build`(vue-tsc 포함) 통과.
- Playwright 스크린샷: 데스크톱 1440 / 태블릿 820 / 모바일 390에서 홈·뷰어·학습맵·내학습·404·창조 화면 확인.
- ESLint: 신규 오류 0건 (HomeView `setTimeout` no-undef 등 기존 오류만 잔존).
- Vitest: 67건 실패는 모두 사전 존재 — 아카이브된 콘텐츠 존재를 기대하는 낡은 테스트, 카탈로그 10개 시절 카운트, 의도 변경된 iframe sandbox 정책 검사. 이번 변경(스타일/이미지)과 무관.
