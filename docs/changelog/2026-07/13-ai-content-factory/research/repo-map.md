# EduFlix AI 콘텐츠 생성 파이프라인 현황 맵 (repo-map)

- 조사일: 2026-07-13
- 대상: `/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory` (브랜치 `run/ai-content-factory`, HEAD `990ac03`)
- 성격: 읽기 전용 코드 탐사. 전면 개편(ai-content-factory) 설계의 기초 자료.

핵심 요약 (루트 CLAUDE.md와 다른 점 먼저):

1. **생성 엔진이 외부화되어 있다.** 이 워크트리의 서버는 Claude API를 직접 호출하지 않는다. `server/routes/generate.ts`는 형제 디렉토리의 **art-assets 서버**(기본 `http://localhost:3200`, `ART_ASSETS_URL`로 오버라이드)에 HTTP로 위임하고, 완료 시 파일을 복사(sync)해 온다. `src/services/api/claude.ts`는 이름과 달리 자사 백엔드(`/api/generate`) 폴링 클라이언트다.
2. **카탈로그는 21개가 아니라 79개.** `public/contents/index.json`에 79개 콘텐츠 등록(math 47, english 23, science 7, world-history 2). `Subject` 타입에 `world-history`가 추가되어 있다.
3. **프롬프트 파일은 사실상 죽어 있다.** `agents/content-generator/prompts/system.md`는 0바이트, `science.md`/`english.md`는 파일 전체가 HTML 주석 처리. `math.md`만 살아 있으나 **코드 어디에서도 로드하지 않는다** (art-assets 쪽에서 쓰는지 여부는 이 레포 밖).
4. **콘텐츠 런타임이 3계열로 분화.** (a) script.js에 인라인된 EduFlixEngine 계열 15개, (b) Phaser 3 CDN 게임 9개(circle-area, ratio-proportion 등 리뉴얼분), (c) Three.js CDN 3D 콘텐츠 29개. `common/engine.js`를 `<script src>`로 링크하는 HTML은 **0개** — 공용 엔진은 인라인 복사본의 원본 역할만 한다.

---

## 1. 현재 생성 파이프라인 다이어그램 + 단계별 파일:함수

```
[사용자]
   │  /create 라우트
   ▼
CreatorView.vue ──▶ CreatorWizard.vue        (3단계 마법사: 관심사→과목→학년)
   │                  startGeneration()
   ▼
stores/generation.ts :: startGeneration()     (Pinia; 진행상태/히스토리 관리)
   │
   ▼
services/api/claude.ts :: ClaudeApiClient.generateContent()
   │   1) GET  /api/health              ← ensureApiAvailable() (정적배포/HTML응답 방어)
   │   2) POST /api/generate            → { success, jobId } (202)
   │   3) GET  /api/generate/status/:jobId  (2초 폴링, 최대 5분)
   ▼
server/index.ts :: handleRequest()            (Bun serve, CORS, 정적파일, SPA 폴백)
   │
   ▼
server/routes/generate.ts :: handleGenerateRoute()
   │   - 입력 검증 (interests<=10, validGrades 12종, isSubjectSupported: math|english만)
   │   - checkArtAssetsHealth() 선진단 (server/services/health.ts)
   │   - jobContextMap(인메모리)에 요청 컨텍스트 저장
   ▼
server/services/art-assets.ts                 (외부 art-assets 서버 HTTP 클라이언트)
   │   createJob():      POST {ART_ASSETS_URL}/api/generate-content
   │                       body = { subject, topic: interests.join(', '),
   │                                gradeLevel: '초등 5학년' 등 한글 라벨 }  ← transformRequest()
   │   getJobStatus():   GET  {ART_ASSETS_URL}/api/generate-content/status/:jobId
   │   createReviewJob():POST {ART_ASSETS_URL}/api/review/create
   │   getReviewStatus():GET  {ART_ASSETS_URL}/api/review/status/:jobId
   ▼
[art-assets 서버가 실제 AI 생성/리뷰 수행 — 본 레포 범위 밖]
   │  status=completed + moduleId + modulePath(+files)
   ▼
server/services/content-sync.ts :: syncContent()   ← 상태 폴링 응답 처리 중 서버가 호출
   │   - 소스: {cwd}/../art-assets/{modulePath}       ← getArtAssetsRoot() (상대경로 하드코딩)
   │   - 대상: public/contents/{subject}/{gradeLevel}/{contentId}/
   │   - index.html에 mobile.css 링크 주입 (injectMobileCss)
   │   - <title>/<meta description>에서 title/description 추출
   │   - manifest.json 생성 (type은 inferContentType() = 항상 'simulation')
   │   - updateCatalog(): public/contents/index.json 읽기→중복ID면 교체, 아니면 push→저장
   ▼
stores/generation.ts (프론트)                  성공 시 contentStore.addContent(manifest)
   │                                           contentId 누락 시 소프트 워닝(카탈로그 제외)
   ▼
/content/:id 라우트에서 iframe으로 실행 (loader.ts IFRAME_SANDBOX_ATTRS)
```

보조 흐름:

- **리뷰/개선**: CreatorWizard `improveContent()` → `stores/generation.startReview()` → `claude.ts reviewContent()` → `POST /api/generate/review` + 상태 폴링(3분 한도) → art-assets `/api/review/*` 프록시. 결과는 `issues[] {severity, location, message, fix}`.
- **실시간 프리뷰(SSE)**: `GenerationProgress.vue` → `LivePreview.vue` → `src/services/preview/stream.ts`(EventSource) → `GET /api/preview/stream/:jobId`(`server/routes/preview.ts`). 단, 서버의 `previewCache`를 채우는 `updatePreviewCache()`의 **호출처가 코드 전체에 없다** — 프리뷰는 실질적으로 완료 신호만 전달되는 미완성 기능(6절 참고).

단계별 파일:함수 목록

| 단계 | 파일 | 주요 함수/심볼 |
|---|---|---|
| 뷰 | `src/views/CreatorView.vue` | CreatorWizard 래핑만 |
| 마법사 | `src/components/creator/CreatorWizard.vue` | `startGeneration`, `improveContent`, `resetWizard`; 단계 `interests→subject→grade→generating` |
| 입력 컴포넌트 | `src/components/creator/InterestInput.vue`, `SubjectSelect.vue`, `GradeSelect.vue` | v-model 폼 |
| 진행 UI | `src/components/creator/GenerationProgress.vue`, `LivePreview.vue` | jobId 기반 SSE 프리뷰 |
| 상태 | `src/stores/generation.ts` | `startGeneration`, `startReview`, `handleProgress`, `currentJobId` |
| API 클라이언트 | `src/services/api/claude.ts` | `generateContent`, `pollJobStatus`, `reviewContent`, `mapJobStatusToProgress` |
| (미구현) 이미지 | `src/services/api/gemini.ts` | `generateImage`, `generateThumbnail` — 서버 엔드포인트 없음 |
| 서버 진입 | `server/index.ts` | `handleRequest`, 정적서빙, `/api/health` |
| 생성 라우트 | `server/routes/generate.ts` | `handleGenerateRoute`, `mapStatus`, `jobContextMap` |
| art-assets 연동 | `server/services/art-assets.ts` | `createJob`, `getJobStatus`, `transformRequest`, `createReviewJob` |
| 동기화 | `server/services/content-sync.ts` | `syncContent`, `injectMobileCss`, `updateCatalog`, `validateSync` |
| 헬스 | `server/services/health.ts` | `checkArtAssetsHealth`, `buildArtAssetsUnavailableMessage` |
| 설정 | `server/config.ts` | `getServerPort`(3001), `getArtAssetsUrl`(3200) |
| 카탈로그 CRUD | `server/routes/content.ts` | `handleContentRoute` (GET/POST/PUT/DELETE, files, export/import ZIP) |
| 추천 | `server/routes/recommendations.ts`, `server/services/recommendations.ts` | SQLite `server/db/recommendations.db`, `recordClick`, `getPopularContent` |
| 프리뷰 | `server/routes/preview.ts`, `src/services/preview/stream.ts` | SSE 스트림 (캐시 미연결) |

---

## 2. 데이터 계약 (실제 코드 기준)

### 2-1. POST /api/generate 요청 — `GenerationRequest` (`src/types/generation.ts`)

```ts
export interface GenerationRequest {
  interests: string[]        // 최대 10개, 각 100자 이하 (generate.ts 검증)
  subject: Subject           // 서버에서 math|english만 통과 (isSubjectSupported)
  grade: Grade               // 'elementary-1'..'high-3' 12종 화이트리스트
  contentType?: ContentType
  language: Language         // 'ko' | 'en'
  additionalContext?: string
}
```

응답: `202 { success: true, jobId, message }` / 오류 `{ error, success:false }` (400/503/500).
art-assets 미연결 시 503 + `buildArtAssetsUnavailableMessage()` 진단 문자열.

### 2-2. GET /api/generate/status/:jobId 응답 — `JobStatusResponse` (`server/routes/generate.ts`)

```ts
export interface JobStatusResponse {
  jobId: string
  status: 'pending' | 'queued' | 'processing' | 'reviewing' | 'completed' | 'failed'
  progress: number           // mapStatus(): queued=5, processing=40, reviewing=70, completed=100
  message: string
  contentId?: string         // completed + sync 성공 시
  manifest?: { id; title; description; type: string }
  error?: string
}
```

완료 처리의 특이점: **status 폴링 요청이 syncContent()를 트리거**한다(GET에 부수효과). `jobContextMap`이 인메모리라 서버 재시작 시 컨텍스트 유실 → sync 건너뜀 경고 응답.

### 2-3. art-assets 계약 (`server/services/art-assets.ts`)

```ts
// 요청: POST {ART_ASSETS_URL}/api/generate-content
export interface ArtAssetsRequest { subject: 'math'|'english'; topic: string; gradeLevel: string }
// 상태 응답
export interface ArtAssetsStatusResponse {
  jobId: string; status: 'pending'|'processing'|'completed'|'failed'
  moduleId?: string; modulePath?: string; files?: string[]
  reviewStatus?: 'pending'|'completed'|'failed'; review?: ArtAssetsReviewResult; ...
}
```

`moduleId` 형식은 `YYYYMMDD-topic-slug`(content-sync 주석), 그대로 EduFlix `contentId`가 된다.

### 2-4. manifest 스키마 — `ContentManifest` (`src/types/content.ts`)

```ts
export interface ContentManifest {
  id: string
  title: string
  subject: 'math' | 'science' | 'english' | 'world-history'
  gradeLevel: 'elementary' | 'middle' | 'high'
  grade: Grade                       // 'elementary-3' 등
  type: 'game' | 'quiz' | 'exploration' | 'simulation' | 'story'
  language: 'ko' | 'en'
  description: string
  thumbnail: string
  path: string                       // '/contents/{subject}/{gradeLevel}/{id}/index.html'
  prerequisites?: string[]
  createdAt: string
  updatedAt?: string
  tags?: string[]
  duration?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}
```

### 2-5. index.json 스키마 — `ContentCatalog`

```ts
export interface ContentCatalog {
  version: string        // 현재 "1.0.0"
  lastUpdated: string    // ISO; content-sync/updateCatalog와 content.ts/saveCatalog가 갱신
  contents: ContentManifest[]
}
```

실측(79건): 모든 `path`가 `/contents/`로 시작(슬래시 선행). 사용 키 합집합 = `id, title, subject, gradeLevel, grade, type, language, description, thumbnail, path, createdAt, tags`. type 분포: simulation 38, game 20, quiz 12, exploration 9. 단, `content.ts`의 POST 폴백은 `contents/...`(선행 슬래시 없음)를 만들 수 있어 표기 불일치 위험이 코드에 남아 있다.

### 2-6. 기타 엔드포인트

- `GET /api/content?subject=&gradeLevel=&type=` / `GET|PUT|DELETE /api/content/:id` / `POST /api/content`(수동 등록, 중복 ID 409) / `PUT /api/content/:id/files`(편집기 저장: CSS 변수 치환+HTML 텍스트 치환) / `GET /api/content/:id/export`(무압축 ZIP 수제 구현) / `POST /api/content/import`(ZIP, ID 충돌 시 `-2` 접미사)
- `GET /api/recommendations`(SQLite 인기순), `POST /api/recommendations/click`, `GET /api/recommendations/stats`, `POST /api/recommendations/clear`
- `GET /api/preview/stream/:jobId`(SSE), `GET /api/preview/:jobId`
- `GET /api/health` → `{ status:'ok', timestamp, artAssets: ArtAssetsHealthResult }`
- 이미지: `/api/generate/image`는 **서버에 없음**. `src/services/api/gemini.ts`가 호출부만 갖춘 유령 클라이언트(파일 상단 TODO 주석으로 명시).

---

## 3. EduFlixEngine 콘텐츠 해부 — 신규 콘텐츠가 지켜야 할 계약

### 3-1. 콘텐츠 런타임 3계열 현황

| 계열 | 개수(실측 grep) | 예 | 특징 |
|---|---|---|---|
| EduFlixEngine 인라인 | 15 (`EduFlixEngine` 문자열 포함 script.js) | linear-slope, pythagoras-theorem, fractions-pizza, cell-explorer | Scene+Engine 클래스를 script.js에 복사, `Engine.init(data)` |
| Phaser 3 CDN | 9 (`phaser` 링크 HTML) | circle-area, ratio-proportion, angles-rocket | `cdn.jsdelivr.net/npm/phaser@3.80.1`, `#game-container` |
| Three.js CDN | 29 (`three` 링크 HTML) | 3d-vectors, space-diagonal, volume-explorer | CDN v0.128 + OrbitControls |

`public/contents/common/engine.js`(235줄)는 원본 레퍼런스일 뿐 어떤 HTML도 링크하지 않는다. `common/mobile.css` 링크는 21개 HTML에만 존재 — **79개 중 다수가 mobile.css 미적용**.

### 3-2. 파일 계약 (모든 계열 공통)

```
public/contents/{subject}/{gradeLevel}/{id}/
├── index.html      # 필수. <title> = 콘텐츠 제목 (sync 시 title 추출원)
├── script.js       # 필수
├── style.css       # 필수(Phaser 계열은 인라인 style로 대체하기도 함)
├── manifest.json   # 필수. 2-4 스키마
└── assets/         # 선택 (thumbnail.svg, character.svg 등)
```

- `index.html` CSS 로드 순서: `style.css` → `../../../common/mobile.css` (mobile.css가 오버라이드 승자)
- iframe 샌드박스에서 실행됨: `IFRAME_SANDBOX_ATTRS = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'` (`src/services/content/loader.ts:100`)
- 종료 시 부모에게 `window.parent.postMessage('close', '*')` (wrap 씬 "홈으로" 버튼 계약)
- 편집 모드: ContentViewer가 `/contents/common/editor-bridge.js`를 iframe에 동적 주입 → `PUT /api/content/:id/files`가 CSS 변수(`:root`의 `--*`)와 `id` 셀렉터 텍스트만 영구 저장. **CSS 변수 기반 테마와 id 있는 텍스트 노드가 편집 가능성의 전제.**

### 3-3. EduFlixEngine 씬 플로우와 데이터 계약 (linear-slope 실측)

```
index.html: <div id="scene-container"></div> + <script src="script.js">
script.js:  class Scene + class EduFlixEngine (인라인) + const data = {...} + Engine.init(data)
씬 순서:    hook → story → core → quiz(있을 때만) → wrap   // nextScene()의 order 배열
```

`Engine.init(data)`의 data 계약:

```js
{
  title: string,                        // wrap 씬 요약에 표기
  hook: {
    question: string,                   // 필수. h1.hook-question
    subText?: string,                   // p.hook-subtext
    visual?: { type:'svg', content: string },  // .hook-visual 안에 SVG 삽입
    onInit?: (sceneEl) => void          // 훅 씬 렌더 후 콜백
  },
  story: {
    character: { image: 'assets/character.svg' | 이모지문자, alt? },
    situation: string(HTML 허용)
  },
  interaction: {
    title?: string, instruction: string,
    onInit: (container, engine) => void // 핵심 계약: #core-interactive-area와 엔진 수신
    // 내부에서 engine.showFeedback(msg,type), engine.enableNext() 사용
  },
  quiz?: [ { question, options: string[], answer: idx } ],  // 현재 1문항만 실행됨
  wrap: 자동 렌더(다시하기=location.reload, 홈으로=postMessage('close'))
}
```

CSS 계약: `.scene`(absolute, opacity 0)/`.scene.active`, `#scene-container`, `:root` 변수(`--primary-color`, `--bg-color`, `--text-color`, `--ease-spring` 등). 프롬프트(math.md)가 강제하는 7씬(hook/anchor/story/core/visualize/quiz/wrap)과 엔진의 5씬이 **불일치** — anchor/visualize는 엔진에 없다.

### 3-4. 프롬프트 시스템 (`agents/content-generator/prompts/`)

| 파일 | 상태 | 내용 요약 |
|---|---|---|
| `system.md` | **0바이트 (빈 파일)** | - |
| `math.md` | 활성 (474줄, 영문) | 역할 정의(한국 수학과정 인터랙티브 콘텐츠 설계자), Non-Obvious 원칙, 수직 앵커링(선수개념 연결표), 실생활 앵커링(학년대별 관심사표), **7씬 구조**(Hook 5s→Anchor 10s→Story 15s→Core 60-120s→Visualize 30s→Quiz 60s→Wrap 15s), YAML 스토리 템플릿, 출력 HTML 골격(7개 `<section class="scene">`), CSS `:root` 변수·`ContentApp` JS 구조 강제, mobile.css 링크 필수, 품질 체크리스트, 이모지 금지·커스텀 SVG 사용 |
| `science.md` | **전체 주석 처리** (`<!-- -->`) | 시뮬레이션 유형/학년별 주제/색상 가이드 — 비활성 |
| `english.md` | **전체 주석 처리** | 어휘/문법 게임 패턴 — 비활성 |

이 프롬프트들을 로드하는 코드는 이 레포에 없다(grep 확인). 실제 생성 프롬프트는 art-assets 서버 내부에 있을 가능성이 높다. 즉 이 디렉토리는 **설계 문서/이관 대상 자산**이지 동작 코드가 아니다.

### 3-5. 템플릿/스타일 (`agents/content-generator/templates/`, `styles/`)

- `templates/base.html`(120줄): `{{TITLE}}` 플레이스홀더, 다크 그라데이션 배경, header(점수)+main+footer 골격, `../../styles/game-ui.css` 등 상대경로 링크. **현행 콘텐츠 79개 중 이 골격을 쓰는 것은 없음**(다크 배경+점수 헤더 패턴은 구세대). 잔존 레거시.
- `styles/game-ui.css`(519줄): Netflix 레드 버튼, 카드, 퀴즈 옵션 등 게임 UI 킷
- `styles/animations.css`(466줄), `utils.css`(412줄): 키프레임/유틸 클래스
- `styles/interactions.js`(693줄): `EduGame` 전역(점수/레벨/드래그앤드롭 유틸) — 콘텐츠에서 참조 0건

결론: templates/styles 디렉토리 전부 **현행 파이프라인에서 미사용**. 재활용 가치는 CSS 킷의 디자인 토큰 정도.

---

## 4. 전면 개편 시 보존(preserve-baseline) vs 교체/신설

### 보존해야 할 것

| 항목 | 근거 |
|---|---|
| **기존 79개 콘텐츠 디렉토리** (`public/contents/{subject}/{level}/{id}/`) | 정적 자산이 곧 서비스. 홈/뷰어/추천이 전부 이 위에 있음 |
| **index.json 스키마** (`ContentCatalog` + `ContentManifest` 12필드) | 프론트 `stores/content.ts`, `loader.ts`, 서버 `content.ts`, `content-sync.ts`, 테스트(`content-catalog.test.ts`)가 모두 의존 |
| **`/api/*` 엔드포인트 표면** — `/api/health`(`{status:'ok'}` 필수), `/api/generate`(+`status/:jobId` 폴링 계약, 202+jobId), `/api/content` CRUD, `/api/recommendations*` | `claude.ts`의 `ensureApiAvailable()`가 health 형식을 검사, `JobStatusResponse` status enum이 프론트 매핑 테이블에 하드코딩 |
| **경로 규칙** `path = /contents/{subject}/{gradeLevel}/{id}/index.html`, mobile.css 상대경로 `../../../common/mobile.css` | content-sync 주입 로직, `validateSync`, 테스트 |
| **iframe 실행 모델** (`IFRAME_SANDBOX_ATTRS`, `postMessage('close')`, editor-bridge 주입) | ContentViewer/ContentCard 및 모든 콘텐츠의 wrap 버튼이 의존 |
| **빌드/테스트 커맨드** (`bun run dev/dev:server/dev:all/build/start/test`) | start.sh, Vercel/터널 배포 절차, vitest 16개 유닛 스위트 |
| **추천 SQLite 스키마** (`content_clicks` 테이블) | 운영 데이터 보존 필요 |

### 교체/신설 대상 (개편 여지가 큰 곳)

- **생성 백엔드**: art-assets HTTP 위임 전체(`art-assets.ts`, `health.ts`, `content-sync.ts`의 `../art-assets` 상대경로 결합). 자체 파이프라인으로 교체 시 `JobStatusResponse` 계약만 유지하면 프론트 무수정.
- **프롬프트/템플릿 디렉토리**: system.md 공백, science/english 주석 처리, templates·styles 미사용 — 신규 프롬프트 체계로 전면 재설계 가능.
- **콘텐츠 type 추론**: `inferContentType()`이 항상 `'simulation'` 반환 — 실제 타입 분류 신설 필요.
- **썸네일/이미지**: `thumbnail: ''`로 저장되는 신규 생성물 + gemini.ts 유령 클라이언트 + `/api/generate/image` 부재 — 이미지 파이프라인 신설 대상.
- **실시간 프리뷰**: `updatePreviewCache()` 호출처 없음(죽은 SSE) — 재구현 또는 제거.
- **jobContextMap 인메모리**: 재시작 유실 — 영속화 필요.
- **EduFlixEngine 배포 방식**: 콘텐츠마다 인라인 복사(드리프트 발생 중: common/engine.js의 hook 렌더와 linear-slope 인라인본이 이미 다름) — 버전드 공용 엔진 또는 코드젠 템플릿으로 재설계 후보.

---

## 5. 재사용 가능 자산

- `public/contents/common/mobile.css` — mobile-first 디자인 토큰(clamp 폰트/간격, 44px 터치 타겟, 5단계 브레이크포인트). 21개 콘텐츠 링크 중.
- `public/contents/common/engine.js` — EduFlixEngine 원본 레퍼런스(인라인 계보의 조상).
- `public/contents/common/editor-bridge.js`, `edu-common.css`, `style.css` — 편집 모드/공통 스타일.
- 공유 아트: `icons/` 6개, `diagrams/` 5개, `backgrounds/` 9개, `illustrations/` 1개 (`{type}-{desc}-{YYYYMMDD}.{ext}` 명명).
- `public/contents/knowledge-map.json` — `{version, lastUpdated, nodes, edges}` 지식 그래프(선수학습 연결에 활용 가능).
- `agents/content-generator/prompts/math.md` — 7씬 교수설계 프레임(앵커링 표, 학년별 관심사 표)은 신규 프롬프트의 원석.
- `agents/content-generator/styles/*` — 미사용이지만 게임 UI 토큰/애니메이션 킷으로 발췌 가능.
- 테스트 자산: `tests/unit` 16개(카탈로그 정합성, mobile.css, 서버 설정/헬스, 생성 스토어, claude-api 등) + `tests/e2e/browser-compatibility.spec.ts`. `vitest.config.mjs`(happy-dom). 개편 시 회귀 안전망.
- 서버 유틸: `server/routes/content.ts`의 ZIP export/import, path traversal 가드, CSS 변수 치환기.

---

## 6. 리스크와 함정

1. **index.json 동시 편집 충돌**: `content-sync.ts updateCatalog()`와 `content.ts saveCatalog()`가 각각 read-modify-write를 락 없이 수행. 생성 완료 폴링과 수동 편집이 겹치면 마지막 쓰기가 승리(유실). 수동 커밋(git)과 서버 자동 갱신도 충돌 축.
2. **GET에 부수효과**: `/api/generate/status/:jobId`가 완료 감지 시 파일 복사+카탈로그 갱신을 수행. 브라우저 중복 폴링/새로고침 시 중복 sync(멱등이긴 하나 lastUpdated 오염), 폴링 중단 시 영영 sync 안 됨.
3. **`../art-assets` 상대경로 결합**: `getArtAssetsRoot()`가 `process.cwd()/../art-assets` 하드코딩. 워크트리(`EduFlix-runs/ai-content-factory`)에서 실행하면 `EduFlix-runs/art-assets`를 찾는다 — 배치 위치에 따라 sync가 조용히 실패(파일별 warn 후 계속 진행)해 **빈 콘텐츠 + 카탈로그 등록**이 가능.
4. **subject 불일치 3중대**: 타입은 4과목(`world-history` 포함), 서버 생성은 2과목(math/english)만 허용, content-sync의 설명 생성은 3과목만 분기(world-history면 '과학'으로 오기). UI SubjectSelect와 서버 화이트리스트의 정합 확인 필요.
5. **경로 표기 이중성**: 카탈로그 실데이터는 `/contents/...`(선행 슬래시), `content.ts` POST/import 폴백은 `contents/...`. 뷰어의 `content.path.startsWith('/')` 분기가 흡수하고 있으나 신규 코드가 한쪽만 가정하면 깨진다.
6. **iframe sandbox 전제**: `allow-scripts allow-same-origin` 동시 허용은 신뢰된 정적 파일 전제. AI 생성물이 그대로 서빙되므로 생성 파이프라인이 곧 XSS 경계 — 개편 시 생성물 검증 단계(현 art-assets review의 deterministic 체크 상당)를 보존해야 함.
7. **CDN 의존**: Phaser/Three.js/Google Fonts를 CDN에서 로드(오프라인/차단 환경에서 콘텐츠 백지). Three.js v0.128 고정은 OrbitControls 호환 때문(루트 CLAUDE.md).
8. **문서-코드 괴리**: 루트 CLAUDE.md의 "Claude 응답 검증(JSON 파싱/타입가드)" 서술은 현 generate.ts에 없다(그 로직은 art-assets로 이관되었거나 폐기). CLAUDE.md 기준으로 설계하면 존재하지 않는 코드를 전제하게 됨.
9. **프리뷰 SSE 미완**: `updatePreviewCache` 무호출로 LivePreview는 스피너 역할만 함. 개편 범위 산정 시 "이미 있는 기능"으로 오인 금지.
10. **quiz 1문항 제한 / 씬 5-7 불일치**: 엔진 `startQuiz()`는 `quiz[0]`만 실행. math.md가 요구하는 anchor/visualize 씬은 엔진에 미구현 — 프롬프트를 그대로 쓰면 엔진 계약과 어긋난 산출물이 나온다.
