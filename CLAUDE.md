# EduFlix - Netflix 스타일 교육 콘텐츠 플랫폼

초등~고등학생 대상 인터랙티브 교육 콘텐츠 플랫폼. Netflix UI + AI 콘텐츠 자동 생성.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite + Pinia
- **Backend**: Bun HTTP 서버 (API 프록시)
- **AI**: Claude (콘텐츠 생성) + Gemini (이미지)
- **Content**: Vanilla HTML/CSS/JS (iframe 샌드박스 실행)

## Commands
```bash
bun install              # 의존성 설치
bun run dev              # Vite dev (localhost:5173)
bun run dev:server       # Bun API 서버 (localhost:3001)
bun run dev:all          # 둘 다 실행
bun run build            # 프로덕션 빌드 (dist/)
bun run test             # Vitest 실행
bun run lint:fix         # ESLint + 자동 수정
./start.sh               # Unix/Linux 개발 서버 시작 (bun run dev:all)
start.bat                # Windows 개발 서버 시작 (bun run dev:all)
```

## Environment
```bash
# .env (required)
ANTHROPIC_API_KEY=sk-...
GEMINI_API_KEY=...

# .env.production
VITE_STATIC_MODE=true    # 정적 호스팅 시 AI 기능 비활성화
```

## Project Structure
```
src/
├── components/          # Vue 컴포넌트
│   ├── common/         # AppHeader, ModeToggle
│   ├── home/           # ContentCard, ContentRow
│   ├── viewer/         # ContentViewer
│   └── creator/        # CreatorWizard, InterestInput, SubjectSelect...
├── views/              # HomeView, ContentView, CreatorView, NotFoundView
├── stores/             # content.ts, generation.ts (Pinia)
├── services/api/       # claude.ts, gemini.ts
├── composables/        # useAIGeneration.ts, useDragScroll.ts
├── types/              # content.ts, generation.ts, knowledge-map.ts
└── assets/styles/      # theme.css (Netflix dark theme)

server/
├── index.ts            # Bun HTTP 서버 (CORS, 라우팅)
└── routes/             # generate.ts, content.ts

public/contents/        # 생성된 교육 콘텐츠
├── index.json          # 콘텐츠 카탈로그
├── knowledge-map.json  # 지식 그래프
└── {subject}/{level}/{id}/  # math|science|english / elementary|middle|high
    ├── index.html
    └── manifest.json

agents/content-generator/
├── templates/          # base.html, game.html, quiz.html...
├── prompts/            # system.md, math.md, science.md, english.md (system-2.md 삭제됨)
└── styles/             # game-ui.css, animations.css, utils.css

archive/                # 더 이상 제공하지 않는 콘텐츠
├── english/            # word-safari, grammar-quest, debate-arena
├── math/               # fractions-pizza, shapes-explorer, equation-puzzle
└── science/            # circuit-lab, solar-system, cell-explorer, chemical-reactor
```

## Code Conventions
- **Vue**: `<script setup lang="ts">`, scoped styles, Composition API
- **Naming**: Components=PascalCase, services/stores=camelCase
- **Types**: interfaces for contracts, types for unions
- **Unused vars**: `_` prefix (ESLint rule)
- **Imports**: 외부 패키지=absolute, 로컬=relative

## Key Patterns

**EduFlixEngine Content Structure** (hook scene enhancement):
- `hook.question`: Main hook question (required)
- `hook.subText`: Optional subtitle with context
- `hook.visual`: Optional visual element (SVG content, onInit callback)
- `hook.onInit()`: Optional callback for dynamic hook initialization
- Hook scene renders with `.hook-content` > `.question-box` > `h1.hook-question` + optional `p.hook-subtext` and `.hook-visual`
- Applied to all math content (elementary/middle/high)
- **EduFlixEngine Implementation**: Inline engine class (Scene + EduFlixEngine) in script.js for standalone content execution
- **Scene flow**: hook → story → core (interaction) → quiz (optional) → wrap (completion)
- **Interaction hook**: `interaction.onInit(container, engine)` receives container div and engine reference for custom interactivity

**Routes** (`/`, `/content/:id`, `/create`, `/:pathMatch(.*)*`)
- Static mode: `/create` → `/` 리다이렉트

**Content Manifest Schema**:
```json
{ "id", "title", "subject", "gradeLevel", "grade", "type", "language", "description", "path", "thumbnail" }
```
- `gradeLevel`: `elementary`, `middle`, `high`
- `grade`: formatted string like `elementary-3`, `middle-1`, `high-2` (학년 세부정보)
- Types: `game`, `quiz`, `exploration`, `simulation`, `story`
- Subjects: `math`, `science`, `english`
- **Content Catalog** (indexed in `/public/contents/index.json`, last updated 2026-01-26):
  - Math Elementary: fractions-pizza (game, gr.3), shapes-explorer (exploration, gr.5), 3d-shapes-discovery (exploration, gr.3), volume-explorer (simulation, gr.5), box-volume (simulation, gr.5), circle-area (simulation, gr.5), decimal-multiplication (simulation, gr.5), fraction-division (simulation, gr.6), ratio-proportion (simulation, gr.6)
  - Math Middle: equation-puzzle (quiz, gr.2), pythagoras-theorem (simulation, gr.3), pythagorean-squares (simulation, gr.3), probability-coin (simulation, gr.2), linear-slope (simulation, gr.2), negative-addition (simulation, gr.1), 3d-coordinate-system (simulation, gr.1), space-diagonal (simulation, gr.3)
  - Math High: quadratic-graph (simulation, gr.1), 3d-vectors (simulation, gr.1)
  - Science Middle: cell-explorer (exploration, gr.1)
  - Science High: chemical-reactor (simulation, gr.1)
  - Archived Content: English (word-safari, grammar-quest, debate-arena), Science Elementary (circuit-lab, solar-system)
  - All manifests follow schema: `id`, `title`, `subject`, `gradeLevel`, `grade`, `type`, `language`, `description`, `thumbnail`, `path`
  - Grade format: "elementary-N", "middle-N", "high-N" where N ∈ [1-6] for grade specificity
  - 3D Content (Three.js): All Three.js-based content uses CDN links (v0.128.0) + common engine.js pattern (OrbitControls compatibility)

**Three.js Content Pattern**:
- 3D 모듈: Three.js + OrbitControls CDN 링크 (script.js에서 `engine.js` 활용)
- 공유 리소스: `public/contents/common/engine.js` (기본 엔진), `style.css` (공통 스타일)
- 모각 콘텐츠는 자체 `style.css` 추가 (UI, 컨트롤 패널)
- Three.js 초기화: Scene, PerspectiveCamera, WebGLRenderer 기본 설정

**Content Styling Pattern** (모든 수학/과학 콘텐츠 - 표준화):
- 각 콘텐츠는 독립형 `style.css` (base reset + scene framework + hook scene + content-specific)
- **CSS Variables 표준**: `:root`에서 정의
  - 필수: `--ease-spring`, `--primary-color`, `--bg-color`, `--text-color`
  - 선택적: `--ease-smooth`, `--primary-dark/light`, `--accent-*`, `--bg-gradient`, `--glass-bg`, `--glass-border`, `--shadow-sm/md/lg`, `--text-muted` (3D/고급 콘텐츠)
  - 추가 색상: `--line-color`, `--grid-color`, `--axis-color` (그래프 콘텐츠)
- **Scene Framework** (통일된 구조):
  - `html, body`: width 100%, height 100%, overflow hidden, background-image `bg-*-20260125.png`, display flex (center)
  - `#scene-container`: max-width 800px, height 100vh, background rgba(255,255,255,0.9), box-shadow
  - `.scene`: position absolute, opacity 0 → 1 (transition 0.5-0.6s), pointer-events none → all on active
  - `.scene.active`: animation (선택적 - `sceneEnter` 등)
- **Hook Scene 구조**: `.hook-content` (flex column, gap 2rem, center) > `.question-box` (텍스트 중앙) + `.hook-visual` (max-width 400px SVG)
  - `.hook-subtext`: color #666, font-size 1.1rem, margin-top 0.5rem
  - `.hook-visual svg`: width 100%, height auto (반응형)
- **Glassmorphism 패턴**: 패널/컨테이너에 `backdrop-filter: blur()` + `border: 1px solid var(--glass-border)`, `background: var(--glass-bg)`
- **반응형 브레이크포인트**: `@media (max-width: 768px, 600px, 480px)` (3D 콘텐츠 768px 우선, 모바일 480px)
- **애니메이션 정의**: `@keyframes fadeIn`, `bounce`, `bounceIn`, `sceneEnter` 기본 제공 (필요시 추가)
- **인터랙티브 요소**: `.control-point`, `.slider-input`, `.coin` (hover/active 상태 + 필터 효과)
- **3D 콘텐츠 패턴**: `.three-container` (고정 크기 + border-radius + shadow), `.control-panel` (glassmorphic), `.size-controls`, `.step-buttons`

**UI 상호작용 패턴** (홈 화면):
- **AppHeader 레이아웃**: `.header-content` (flex, gap xl, padding 0 content-padding) - width 전체 사용, max-width/margin 제거
  - `.logo-text`: font-size 3xl, font-weight bold, letter-spacing -0.5px
  - `.nav-link`: font-size base, 호버 시 text-color-primary, active 상태 font-weight medium
  - `.page-title`: 모바일(max-width 768px)에서만 display block (중앙 정렬)
- **드래그 스크롤**: `useDragScroll` 컴포저블 - 마우스 드래그로 컨텐츠 행 스크롤 (ContentRow에서 사용)
  - 드래그 감지: `DRAG_THRESHOLD=5px` 이상 움직임 시만 활성화 (클릭 오판 방지)
  - 상태 관리: `isDragging`, `startDrag`, `endDrag`, `preventClickIfDragged`
  - 스타일링: `.row-content.is-dragging` → `cursor: grabbing`, `scroll-snap-type: none` (모바일 제외)
  - 접근성: `@media (hover: none)` 터치 장치에서 스크롤 버튼 숨김
- **히어로 섹션**: 텍스트 정렬 (`white-space: nowrap`) - 단일 행 오버플로우 방지
- **반응형 스타일**: `.scroll-btn` CSS 클래스명 통일 (responsive.css에서 사용)

**iframe Security** (loader.ts):
- `IFRAME_SANDBOX_ATTRS` = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
- `allow-same-origin` 포함: 외부 CSS/JS 파일 로드에 필요 (Three.js CDN 등)
- 콘텐츠는 신뢰할 수 있는 정적 파일이므로 보안상 허용
- `allow-same-origin` 제외 시 sandbox 우회 방지 (allow-scripts와 조합 시 보안 이슈)

**API Endpoints**:
- `GET/POST /api/content` - 콘텐츠 CRUD (카탈로그 경로: `public/contents/index.json`)
- `POST /api/generate` - AI 콘텐츠 생성
  - **Claude 응답 검증** (server/routes/generate.ts):
    1. JSON 파싱: 마크다운 코드 블록 추출 후 파싱
    2. 타입 가드: `typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null` (null/배열/원시값 제외)
    3. 필드 검증 (모두 필수, trim() 후 공백 제외): `title`, `description`, `html`, `type`
    4. 타입 유효성: `game|quiz|exploration|simulation|story` 중 하나
    5. Parse 실패: `SyntaxError` (파싱 오류) vs 타입 가드 실패 (유효하지 않은 구조) 구분 처리
  - **contentId 처리** (src/stores/generation.ts):
    - `contentId = result.contentId || result.manifest.id` (폴백)
    - 누락 시: `warning` 필드 추가 후 히스토리만 기록, 카탈로그 추가 안 함 (소프트 워닝)
    - 콘텐츠 생성 성공 후에만 스토어에 추가 (조건: contentId 필수)

**Generation Response Pattern**:
- `success: true` + `manifest` + `contentId` → 정상 (콘텐츠 스토어에 추가)
- `success: true` + `manifest` + 누락된 `contentId` + `warning` → 소프트 워닝 (히스토리 기록, 카탈로그 제외, UI 경고)
- `success: false` → 에러 (UI에 에러 메시지 표시)

## Notes
- API 키는 `.env`에만 저장 (git 제외)
- 콘텐츠는 `/public/contents/` 디렉토리에서 정적 제공
- Vercel 배포: `vercel.json` SPA 라우팅 + 콘텐츠 캐싱 설정
