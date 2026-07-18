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

## 인앱 GLM 콘텐츠 생성

- 기본 생성 엔진은 Z.ai GLM-5.2로 두고 `FACTORY_LLM_PROVIDER=codex`에서 기존 Codex 실행 방식을 보존한다. 서버 단독 운영이 기본 목표이기 때문이다.
- GLM build는 marker 응답을 파싱해 staging에 기록한다. 챗 API에 파일시스템 쓰기 권한이 없고 기존 원자적 승격 로직을 재사용할 수 있기 때문이다.
- 웹 job은 인메모리 단일 실행으로 제한한다. 스펙의 동시 1건 요구를 가장 작은 상태 모델로 충족하며 외부 큐 의존성을 추가하지 않는다.
- 기존 콘텐츠와 카탈로그는 변경하지 않는다. 변경 전 테스트의 오래된 샘플 기대값은 현재 저장소 계약에 맞춰 테스트에서만 교정한다.
- Z.ai 기본 URL은 검증된 coding endpoint를 한 상수로 두고 서버 설정도 이를 재사용한다. 일반 endpoint와 문서값이 갈라지는 구성을 피하기 위해서다.
- 기존 lint 실패는 제품 코드를 무더기로 고치지 않고 archive/일회성 스크립트 제외와 Vue 브라우저 전역 명시로 해결했다. 현재 실행 경로의 실제 미사용 바인딩만 제거했다.
- 생성·preview는 8시간, review는 35분으로 맞췄다. Z.ai 재시도와 optional Codex 재빌드까지 합산한 최악 실행 시간에 안전 마진을 두기 위해서다. 무제한 대기는 끊긴 작업을 영구 보존하므로 채택하지 않았다.
- Z.ai 응답은 완성 문자열이 아니라 `response.body`의 청크를 직접 읽는다. SSE 프레임이 네트워크 청크 중간에서 잘릴 수 있고 reasoning/복수 choice를 섞으면 결과 계약이 깨지기 때문이다.
- 생성 POST의 jobId는 완료 결과를 기다리지 않고 즉시 스토어에 전달한다. build가 진행되는 동안 LivePreview가 같은 job을 구독할 수 있어야 하기 때문이다.
- manifest의 id/title/description은 최초 build, 모든 QA rebuild, publish 직전에 plan과 다르면 실패한다. 조용히 덮어쓰면 build 결과의 계약 위반을 숨기므로 채택하지 않았다.
- 임시 run ID 충돌은 `-2` 접미사 대신 다음 빈 초를 탐색한다. 항상 `gen-YYYYMMDD-HHmmss` 계약을 유지하기 위해서다.
- plan slug의 중복 여부는 대상 과목·학년만 보지 않고 `public/contents/*/*/*`의 ID를 한 번 스캔해 전역으로 판단한다. 카탈로그 ID가 전역 키이므로 다른 과목의 같은 slug도 `-2`, `-3` 순서로 피해야 하며, 후보마다 전체 트리를 다시 탐색하는 방식은 불필요하게 비싸서 채택하지 않았다.
- 외부 script는 기본 차단하되 문서화된 jsDelivr Three.js 0.128.0과 같은 버전 OrbitControls만 build prompt와 static QA에서 동일하게 허용한다. 도메인만 허용하는 넓은 예외는 재현성을 깨므로 기각했다.
- `server/index.ts`는 import 시 서버를 열지 않는 request-handler factory를 제공하고, 직접 실행할 때만 기본 포트로 시작한다. 실제 Bun HTTP/JSON 배선을 임시 포트에서 검증하면서 운영 시작 방식은 유지한다.
- 과목 선택기는 문자 이모지 대신 기존 `IconSet` SVG를 재사용한다. 수학·과학·영어의 표시 일관성과 에이전트 작성 규칙을 같이 지키기 위해서다.

### 실생성 리뷰 후 보강 (GLM-5.2 첫 실행 실패 교훈)

- 첫 실전 생성에서 storyboard 단계가 2회 모두 검증 실패로 중단됐다. 원인은 GLM-5.2가 긴 중첩 스키마를 프롬프트에 넣어도 비상호작용 씬(story·wrap)의 `interaction` 필수 필드를 생략하는 것이었다.
- Z.ai 재시도를 동일 프롬프트 반복에서 오류 피드백 재시도로 바꿨다. 두 번째 시도부터 직전 검증 오류 목록을 프롬프트에 붙여 모델이 스스로 교정하게 한다. 동일 프롬프트 재시도는 같은 실패를 반복할 뿐이라 기각했다. 시도 횟수는 2에서 3으로 늘렸다(공용 규칙의 최대 재시도 3 준수).
- `02-storyboard.md`에 모든 씬(스토리·랩 포함)이 완전한 `interaction` 계약(controls·initialState·rules 5필드)을 갖춰야 함을 산문으로 명문화했다. 모델은 스키마보다 산문 규칙을 더 잘 따르기 때문이다.

### 2차 실생성 실패 교훈 (QA 게이트 수렴)

- QA 정적 검사의 이미지 추출기가 `src=`/`href=`/`url()`만 인식해, script.js가 객체 속성 문자열(`badge: "/contents/icons/..."`)로 참조한 계획 에셋을 미사용으로 오판했다. 이미지 확장자로 끝나는 JS 문자열 리터럴을 참조 후보로 수집하도록 확장했다(회귀 테스트 추가). 절대/상대 경로는 기존 resolveAsset이 이미 동일 파일로 수렴시키므로 경로 형태 제한은 두지 않았다.
- 재빌드가 3회 모두 수정 지시를 반영하지 못했다. 원인은 (1) 수정 지시가 거대 프롬프트 말미에 묻히고 (2) 기존 산출물이 프롬프트에 없어 매번 처음부터 재생성됐기 때문이다. 재빌드 시 수정 지시를 프롬프트 최상단에 두고 기존 4개 파일을 포함해 "지시 항목만 반영" 방식으로 바꿨다. 처음부터 재생성은 무작위 재추첨과 같아 기각했다.
- `04-build.md`의 키보드 접근성 요구를 구체 계약(button 또는 tabindex+keydown, 드래그의 방향키 대체)으로 명문화했다. Q21 심사가 반복 실패한 항목이기 때문이다.

### 3차 실생성 성공과 마감 보강

- 3차 실행에서 `animal-adaptation-game`(과학·초4·게임형)이 QA 2차 시도 만에 통과해 카탈로그에 등록됐다(81번째 콘텐츠). 재빌드 수렴 개선의 효과가 확인됐다.
- manifest `createdAt`을 모델이 지어낸 날짜(2023-11-01) 그대로 두는 결함을 발견했다. build 단계 파일 승격 직후 서버 시각으로 덮어쓴다. QA digest 계산 전이라 publish 무결성 검사와 충돌하지 않는다. manifest가 JSON이 아니면 정규화를 건너뛰어 QA manifest-schema 검사가 명확한 오류로 잡게 했다.
- 이모지 금지 규칙이 프롬프트에만 있고 검사에 없어 산출물에 이모지 1개가 통과했다. 정적 QA에 `no-emoji` 검사(Extended_Pictographic)를 추가했다.
- 발행된 콘텐츠의 이모지·createdAt은 수동 교정했고, 카탈로그 개수 테스트를 81로 갱신했다.

## 콘텐츠 제작 방식(renderMode) 도입 — 3D(Three.js) 기본값

### 배경
- 요구사항: 콘텐츠를 Three.js 3D 또는 게임 엔진 방식으로 생성하되(단순한 3D), 3D를 기본값으로 하고 사용자가 3~5가지 제작 방식 중 선택할 수 있게 한다.

### 설계 결정
- 새 축 `renderMode`(구현 기술)를 기존 `contentType`(교육 형식: simulation/game/quiz…)과 분리했다. 하나의 축에 합치면 "3D 시뮬레이션"과 "DOM 시뮬레이션"을 구분할 수 없기 때문이다.
- 5가지 방식: `3d`(Three.js 시뮬레이션, 기본값) | `3d-game`(Three.js+게임 루프) | `canvas-game`(Canvas 2D 게임) | `svg`(인터랙티브 SVG) | `dom`(클래식 카드·버튼). 요청 범위 3~5개 중 5개를 채택 — "Three.js 기반"과 "게임 엔진 방식" 요구를 모두 독립 옵션으로 노출하기 위해서다.
- 정본 목록은 `pipeline/stages/common.ts`의 `RENDER_MODES`에 두고 서버 라우트가 재사용한다. 프런트 타입은 기존 `ContentType` 관례를 따라 `src/types/generation.ts`에 리터럴 유니언으로 둔다(파이프라인→src 역방향 의존 회피).
- plan 산출 스키마는 변경하지 않았다. renderMode는 사용자 선택값이므로 모델이 재결정할 필드가 아니라 컨텍스트로만 전달한다. 대신 01/02/04 프롬프트에 방식별 설계·구현 지침을 명문화했다.
- 04-build.md의 Three.js 예외("3D 학습에 필요한 경우에만")를 renderMode 조건("3d·3d-game이면 반드시 사용")으로 바꿨다. 허용 URL 2개(jsDelivr three@0.128.0 + OrbitControls)는 기존 정적 QA 허용 목록과 동일해 QA 변경이 불필요했다.
- build 모범 사례 선택(findExample)을 방식 기반으로 바꿨다: 3D 방식이면 space-diagonal → 3d-coordinate-system → 3d-shapes-discovery 우선, 그 외 DOM 사례(probability-coin 등) 우선. 후보가 없으면 반대 그룹으로 폴백해 기존 배포 호환을 유지한다.
- 3D 공통 규칙(리사이즈 대응, core 씬 활성 시에만 rAF 루프, 기본 지오메트리만 사용, WebGL 실패 시 정적 대체 화면)을 04-build.md에 계약으로 추가했다. "복잡하지 않은 3D" 요구를 기본 지오메트리 제한으로 구현했다.
- renderMode를 각 스테이지 입력 다이제스트에 포함해 방식 변경 시 캐시 재사용을 차단했다.
- UI는 Creator 마법사 4단계 "만드는 방식"으로 추가(RenderModeSelect.vue, 3D 사전 선택 + 추천 배지). 기본값이 있으므로 건너뛰어도 3D로 생성된다.

### 검증
- bun test: 라우트 renderMode 400 검증, build 모범 사례 선택(기본 3d→THREE 사례, dom→DOM 사례) 테스트 추가, 신규 실패 0건(기존 실패 9건은 vitest 전용 파일이 bun test에 걸리는 사전 존재 이슈).
- vitest 310건 전체 통과, eslint 통과, vue-tsc+vite build 통과.
- 실생성 검증: `cylinder-volume`(초6 수학 "원기둥의 부피", renderMode 기본값 3d)을 CLI로 실행 — plan이 "renderMode가 3D로 지정되었으므로"를 근거로 3D 뷰포트 중심 core를 설계함을 확인.
