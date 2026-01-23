# EduFlix - Netflix 스타일 교육 콘텐츠 플랫폼

<!-- AUTO-MANAGED: project-description -->
초등~고등학생 대상 인터랙티브 교육 콘텐츠 플랫폼. Netflix UI 기반 콘텐츠 제공 및 AI 기반 콘텐츠 자동 생성.

**Tech Stack:**
- Frontend: Vue 3 + TypeScript + Vite
- Backend: Bun (경량 서버, API 프록시)
- AI: Claude (Anthropic) + Gemini (이미지)
- Storage: 로컬 파일시스템 (정적 호스팅)
- Content: Vanilla HTML/CSS/JS (독립 실행 가능)

**Key Features:**
- 보기 모드: Netflix 스타일 콘텐츠 뷰어
- 창조 모드: AI를 통한 맞춤형 콘텐츠 자동 생성
- 지식맵: 선수 지식과 콘텐츠 연결
- Sandbox 실행: iframe 기반 안전한 콘텐츠 실행
<!-- END AUTO-MANAGED -->

---

<!-- AUTO-MANAGED: build-commands -->
## Build & Development

**Setup:**
```bash
cd /Users/chaeseong-gug/Documents/PARA/Resource/EduFlix
bun install
```

**Development:**
```bash
bun run dev          # Vite dev server (http://localhost:5173)
bun run dev:server   # Bun HTTP API server (http://localhost:3000)
bun run dev:all      # Run both Vite and Bun server in parallel
```

**Production:**
```bash
bun run build     # Build to dist/
bun run preview   # Preview production build
```

**Code Quality:**
```bash
bun run lint           # Run ESLint (TS + Vue)
bun run lint:fix       # Auto-fix linting issues
bun run format         # Format with Prettier (src/**/*.{ts,vue,css})
bun run test           # Run all unit tests with Vitest
bun run test:watch     # Watch mode for tests
bun run test:coverage  # Generate test coverage report
```

**Environment:**
- Create `.env` from `.env.example`
- Required: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- Production: `.env.production` (auto-loaded by Vite in build)
  - `VITE_STATIC_MODE=true`: Disables AI generation feature (no backend available)
  - `VITE_API_URL=`: (optional, ignored in static mode)

**Deployment:**
- Static hosting: Vercel, Netlify, GitHub Pages (via `vercel.json` config)
- Build output: `dist/` directory
- Static mode features:
  - Creator mode disabled (routes to home)
  - ModeToggle hidden in header
  - AI generation returns error message
  - No backend API calls
<!-- END AUTO-MANAGED -->

---

<!-- AUTO-MANAGED: architecture -->
## Project Structure

```
EduFlix/
├── src/                          # Frontend source
│   ├── components/               # Vue components
│   │   ├── common/              # Layout, header, navigation
│   │   ├── home/                # Home view components
│   │   ├── viewer/              # Content viewer components
│   │   └── creator/             # Creator mode components
│   ├── views/                    # Page components
│   │   ├── HomeView.vue
│   │   ├── ContentView.vue
│   │   ├── CreatorView.vue
│   │   └── NotFoundView.vue
│   ├── router/                   # Vue Router configuration
│   │   └── index.ts             # Route definitions
│   ├── composables/              # Vue 3 composables
│   │   └── useAIGeneration.ts   # AI generation composable
│   ├── services/                 # API & utility services
│   │   ├── api/                 # External API wrappers
│   │   │   ├── claude.ts        # Claude API client
│   │   │   └── gemini.ts        # Gemini API client
│   │   └── content/             # Content management
│   │       └── loader.ts        # Content loading service
│   ├── stores/                   # Pinia state management
│   │   ├── content.ts           # Content catalog state
│   │   └── generation.ts        # AI generation state
│   ├── types/                    # TypeScript definitions
│   │   ├── content.ts           # Content manifest schema
│   │   ├── knowledge-map.ts     # Knowledge graph types
│   │   └── generation.ts        # AI generation types
│   ├── assets/                   # Static assets
│   │   ├── styles/              # Global CSS
│   │   │   ├── theme.css        # Netflix theme variables
│   │   │   └── responsive.css   # Mobile styles
│   │   └── images/              # SVG, icons
│   ├── App.vue                   # Root component
│   ├── main.ts                   # Entry point
│   └── style.css                 # Global styles
├── server/                       # Bun backend
│   ├── index.ts                 # HTTP server
│   ├── routes/
│   │   ├── generate.ts          # AI generation endpoint
│   │   └── content.ts           # Content CRUD API
│   └── middleware/              # Auth, validation
├── agents/                       # AI content generator
│   └── content-generator/
│       ├── templates/            # HTML templates
│       │   ├── base.html
│       │   ├── game.html
│       │   ├── quiz.html
│       │   ├── simulation.html
│       │   ├── exploration.html
│       │   └── story.html
│       ├── prompts/              # System prompts
│       │   ├── system.md
│       │   ├── math.md
│       │   ├── science.md
│       │   └── english.md
│       └── styles/               # Common CSS
│           ├── game-ui.css
│           ├── animations.css
│           ├── utils.css
│           └── interactions.js   # Game interaction utilities
├── contents/                     # Generated content
│   ├── index.json               # Content catalog
│   ├── knowledge-map.json       # Knowledge graph
│   └── {subject}/{level}/{content-name}/
│       ├── manifest.json        # Content metadata
│       ├── index.html           # Content page
│       ├── style.css            # Content styles
│       └── script.js            # Content logic
├── docs/
│   ├── plans/                   # Project planning
│   │   └── my-feature.md        # Full feature roadmap
│   └── changelog/               # Change logs by date
├── tests/                        # Test suites (Vitest + Playwright)
│   ├── unit/
│   │   ├── content-loader.test.ts      # Content service tests
│   │   ├── content-catalog.test.ts     # Catalog validation (10 contents)
│   │   └── generation.test.ts          # Generation store tests
│   └── e2e/
│       └── browser-compatibility.spec.ts  # Cross-browser feature matrix
├── public/                       # Static files (vite.svg)
├── .vscode/                      # Editor config
│   └── extensions.json          # Recommended VSCode extensions
├── .env.example                  # Environment template
├── .env.production               # Production environment (static mode)
├── .gitignore                    # Git ignore rules
├── .prettierrc                   # Prettier config
├── eslint.config.js             # ESLint flat config
├── vite.config.ts               # Vite build config
├── vitest.config.mjs            # Vitest configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App TypeScript config
├── tsconfig.node.json           # Build tools TypeScript config
├── vercel.json                   # Vercel deployment config
├── package.json                 # Dependencies & scripts
├── bun.lock                      # Bun lock file
└── index.html                   # HTML entry point
```

**Content Structure** (`contents/{subject}/{level}/{content-name}/`):
- Subject: `math`, `science`, `english`
- Level: `elementary` (초), `middle` (중), `high` (고)
- Content Type: `game`, `quiz`, `exploration`, `simulation`, `story`
<!-- END AUTO-MANAGED -->

---

<!-- AUTO-MANAGED: conventions -->
## Code Conventions

**Naming:**
- Components: PascalCase (e.g., `HelloWorld.vue`, `ContentCard.vue`)
- Services: camelCase (e.g., `loader.ts`, `claude.ts`)
- Stores: camelCase (e.g., `content.ts`, `generation.ts`)
- Constants: UPPER_SNAKE_CASE
- Vue component imports: always use relative paths `./components/HelloWorld.vue`

**TypeScript:**
- Type files: `src/types/*.ts`
- Use interfaces for contracts, types for unions/primitives
- Unused variables: prefix with `_` to suppress errors (ESLint rule)
- Strict mode enabled in `tsconfig.app.json`

**Vue 3 Style:**
- `<script setup lang="ts">` for all components
- Scoped styles: `<style scoped>`
- Composition API composables in `src/composables/`
- Props with full TypeScript: `defineProps<{ msg: string }>()`

**Imports:**
- External packages: absolute (e.g., `import { createApp } from 'vue'`)
- Local files: relative paths (e.g., `import App from './App.vue'`)
- No circular dependencies

**File Organization:**
- One component per file
- Services isolated in `services/`
- Store definitions in `stores/`
- Global styles in `src/assets/styles/`, scoped in components

**Formatting:**
- Prettier: `bun run format`
- ESLint: `bun run lint --fix`
- Line length: default (no override in .prettierrc)
- Trailing comma: ES5 (default)
<!-- END AUTO-MANAGED -->

---

<!-- AUTO-MANAGED: patterns -->
## Detected Patterns

**Vue Component Pattern:**
```typescript
<script setup lang="ts">
import ChildComponent from './ChildComponent.vue'
// Logic here
</script>

<template>
  <!-- Template here -->
</template>

<style scoped>
/* Styles here */
</style>
```

**Layout Root Pattern (App.vue):**
```typescript
<script setup lang="ts">
import AppHeader from './components/common/AppHeader.vue'
</script>

<template>
  <div id="app-container">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app-container {
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.main-content {
  padding-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
}
</style>
```

**Header Component Pattern (AppHeader.vue):**
- Position fixed with z-index var(--z-fixed), height var(--header-height) 68px
- Background: gradient (rgba 0,0,0,0.7 to transparent) with smooth transition to solid on scroll (isScrolled ref)
- Scroll detection: window scroll listener at 50px threshold, cleanup on unmount
- Header content: max-width container with flex layout, gap-xl spacing
- Logo: "EduFlix" router-link to home with brand-primary color, 2xl size, bold weight
- Navigation: flex row with nav items (홈, 수학, 과학, 영어), subject filtering via query params (?subject=math|science|english)
- Nav active state: computed `isNavActive(path)` checks route path and query params
- Page title (mobile only): displayed centered when not on home, hidden on desktop via media query
- Header actions: flex row with search icon button (SVG placeholder) and ModeToggle component
- Icon button: 40px circular, flex centered, hover background transition
- Responsive: nav hidden on tablets (max-width 768px), title shown centered
- Event lifecycle: listener registered on mount, cleaned up on unmount

**Mode Toggle Pattern (ModeToggle.vue):**
- Animated switch button with track + thumb
- Label displays current mode: "보기" (view) or "창조" (create)
- Routes to `/` or `/create` on toggle
- Derived from route path (`isCreateMode` computed from route)

**Theme & Design System Pattern:**
- CSS variables in `src/assets/styles/theme.css`
- Color palette: dark backgrounds, Netflix brand red, subject-specific colors
- Typography: Pretendard font family, 8-step font size scale
- Spacing: 8-point grid system
- Transitions: 3 speeds (fast, normal, slow)
- Z-index layers: 100 (dropdown) to 600 (tooltip)

**Router Pattern:**
```typescript
// src/router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '홈' },
  },
  // Additional routes...
]

// Static mode detection and route guards
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

router.beforeEach((to, _from, next) => {
  // Static mode: redirect /create → / (creator mode unavailable)
  if (isStaticMode && to.path === '/create') {
    next({ path: '/' })
    return
  }

  document.title = to.meta.title ? `${to.meta.title} - EduFlix` : 'EduFlix'
  next()
})
```

**Static Mode Detection Pattern:**
- Env variable: `VITE_STATIC_MODE` (set in `.env.production`)
- Detection: `const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'`
- Usage: Conditionally disable features in router, API clients, UI components
- Router guard: Redirect /create to / when static mode active
- API client (claude.ts): Return error with user-friendly message
- Header component: Hide ModeToggle button when static mode active
- Purpose: Graceful feature degradation for static hosting without backend

**Service Module Pattern:**
- API clients wrap external endpoints (claude.ts, gemini.ts)
- Loader services handle data fetching (content/loader.ts)
- Stored state in Pinia stores (content.ts, generation.ts)

**Content Manifest:**
```json
{
  "id": "unique-id",
  "title": "Content Title",
  "subject": "subject",
  "grade": "level",
  "type": "game|quiz|exploration|simulation|story",
  "language": "ko|en",
  "description": "Short description",
  "thumbnail": "url-to-thumbnail",
  "path": "relative/path/to/index.html"
}
```

**Type Definitions Organization:**
- `src/types/content.ts`: Content manifest, catalog, and card types
- `src/types/generation.ts`: AI generation requests, responses, Claude/Gemini types
- `src/types/knowledge-map.ts`: Knowledge graph nodes, edges, learning paths

**ESLint Rules Applied:**
- Vue multi-word component names: off (allows short names like `App.vue`)
- Unused variables: error, unless prefixed with `_`
- Recommended configs: JS, TypeScript, Vue, Prettier-compatible

**Vite + Vue 3 Setup:**
- Plugin: `@vitejs/plugin-vue` for .vue file processing
- TypeScript via `vue-tsc` for type checking during build
- dev: Vite dev server with HMR
- build: SFC compilation + minification to `dist/`

**Home View Pattern (HomeView.vue):**
- Hero section: radial gradient (circle at 70% 20%) with dual vignette overlays (top→bottom + left side) for depth effect
- Hero title: "배움이 재미있어지는 순간" with responsive sizing clamp(2.5rem, 5vw, 4rem)
- Hero subtitle: dual action buttons (play ▶ in white, info ⓘ in translucent gray)
- Hero content: positioned with 100px top offset, max-width 600px for visual balance
- State management: `useContentStore()` with `onMounted` lifecycle hook
- Three rendered states: loading (spinner), error (retry), success (content groups)
- Empty state: call-to-action "콘텐츠 만들기" to create mode via `goToCreateMode()` router push
- Content sections: ContentRow components grouped by subject via `contentStore.contentGroups`
- Responsive layout: hero height 85vh min 600px, content padding responsive via CSS variables

**Content Card Pattern (ContentCard.vue):**
- RouterLink to `/content/:id` with subject-based color class
- Card dimensions: 280px width, flex-shrink-0 for horizontal scroll compatibility
- Thumbnail: 16:9 aspect ratio with live iframe preview of actual content
  - iframe-container: position relative, 100% width/height, overflow hidden
  - preview-iframe: scaled down from 1280x720 (1x scale) to 280x157.5 (0.21875x scale) via transform-origin top-left
  - pointer-events none to prevent iframe interaction during preview
  - opacity 0.9 by default, 1.0 on card hover for visibility enhancement
  - sandbox attribute uses IFRAME_SANDBOX_ATTRS for security
  - tabindex=-1 and aria-hidden=true to exclude from keyboard navigation
- Overlay: dark semi-transparent (rgba 0,0,0,0.4) with play icon (▶) on hover
- Play icon: 48px circular button with backdrop-filter blur effect, scale animation on hover (1.1x)
- Hover effects: card scale (1.05x), box-shadow lift, z-index 10
- Badges: type label (brand red bg) and grade level (dark bg) positioned at bottom-left
- Card info: dark bg (#181818) with truncated title (font-size-sm, bold), hidden description for space
- Focus visible: 2px brand-primary outline with 2px offset for keyboard navigation
- Imports: getContentHtmlPath() from content/loader service for dynamic HTML path resolution

**Content Row Pattern (ContentRow.vue):**
- Section title: subject label (subjectLabel from group) with hover text color transition (#e5e5e5→white)
- Row container: position relative for absolute-positioned scroll buttons
- Horizontal scrollable container (row-content): flex row layout with gap, scrollbar hidden
- Scrollbar hiding: scrollbar-width none (Firefox) + webkit pseudo-element (Chrome/Safari)
- Scroll snap: x mandatory with snap-align start for smooth snapping per card
- Scroll buttons: positioned left/right with 4% width (min 40px), hidden by default
  - Visible on row hover with background opacity transition (0.5→0.7)
  - Background: rgba(20,20,20) with rounded corners on inner edge
  - Arrow icon (◀ left, ▶ right) with scale animation on button hover (1.2x)
  - Scroll behavior: 420px increments (2 card widths), smooth behavior
- ContentCard iteration: v-for with :key="content.id"

**Pinia Store Pattern (content.ts):**
- State: `contents` (manifest array), `isLoading`, `error`, `selectedSubject`, `selectedGradeLevel`
- Computed: `filteredContents` (subject/grade filtered), `contentCards` (mapped card data), `contentGroups` (grouped by subject), `getContentById` (lookup function)
- Action: `loadContents()` (fetch `/contents/index.json` or fallback to dummy data)
- Dummy data for development when catalog unavailable

**Content View Pattern (ContentView.vue):**
- Route props: `id` param from `/content/:id`
- Content lookup via `useContentStore().getContentById(id)`
- Loading/error/success state management with ref-based flags
- Child ref access: `viewerRef.value?.toggleFullscreen()` for child method exposure
- Metadata computed properties: subject/grade/type labels from content object
- Child event handlers: `handleViewerLoad`, `handleViewerError` for lifecycle
- Back navigation with `router.push('/')`, ID change watchers for re-loads

**Content Viewer Pattern (ContentViewer.vue):**
- Props: `src` (HTML path), `title` (content name)
- Emits: `load`, `error`, `fullscreenChange` events
- Exposed methods via `defineExpose()`: `toggleFullscreen()`, `isFullscreen` ref (for parent access)
- Loading/error states with v-if/v-else-if guards (prevents state overlap)
- iframe sandbox security: `IFRAME_SANDBOX_ATTRS` (allow-scripts, allow-forms, allow-popups, allow-modals, excludes allow-same-origin) and `IFRAME_ALLOW_ATTRS` (accelerometer, autoplay, fullscreen, etc.)
- Fullscreen API: `requestFullscreen()`/`exitFullscreen()` with `fullscreenchange` document listener
- Watch prop changes to reset loading state

**Content Loader Service (loader.ts):**
- Functions: `loadContentManifest(path)`, `getContentHtmlPath(content)`, `checkContentExists(path)`, `findContentById(id)`, `loadContentById(id)`
- Default content path pattern: `/contents/{subject}/{gradeLevel}/{id}/index.html`
- Path handling: supports catalog-provided paths (absolute) and fallback default paths
- Exports security constants: `IFRAME_SANDBOX_ATTRS` (excludes allow-same-origin for security), `IFRAME_ALLOW_ATTRS`
- Error handling with descriptive messages
- Fallback content lookup from `/contents/index.json` catalog

**Base Content Template (base.html):**
- Layout: Flexbox container with header, main content area, footer sections
- Header: Title display + score counter (gold star icon)
- Main: Centered content area with vertical scroll
- Footer: Reset and Next buttons (secondary + primary style)
- Styles: Dark gradient background (1a1a2e -> 0f0f23), responsive mobile padding
- Script loading: Links to shared styles (game-ui.css, animations.css, utils.css) and content-specific script.js
- Title substitution: `{{TITLE}}` placeholder for dynamic content titles

**Content Generator Styles (agents/content-generator/styles/):**
- `game-ui.css`: Button variants (primary/secondary/success/warning), sizes (sm/lg/icon), card styles with glassmorphism
  - Primary button: Netflix red gradient (#e50914) with shadow and hover lift
  - Secondary: transparent white with border, minimal hover state
  - Disabled state: 50% opacity with cursor: not-allowed
- `animations.css`: Keyframe definitions (fadeIn/Out, slideUp/Down/Left/Right, scaleUp/Down, bounce, spin, pulse, shimmer)
  - Used for entrance animations and interactive feedback
- `utils.css`: Tailwind-like utility classes (display, flexbox, spacing, margin, padding, sizing, text, colors, backgrounds, borders, radius, shadow, opacity, transforms)
  - Grid system: gap-1 (4px) to gap-8 (32px)
  - Margin/padding: m-0 to m-5, mt/mb/ml/mr variants
  - Flexbox: flex-row, flex-column, justify-*, items-*, flex-wrap, gap-*
- `interactions.js`: Game state management (EduGame object)
  - Score tracking: `addScore(points)`, `updateScoreDisplay()`, `showScorePopup(points)`
  - Level system: `levelUp()`, `showLevelUp()` with modal animation
  - Drag-and-drop utilities for quiz/game interactions
  - Event delegation patterns for dynamic content

**Content Index (contents/index.json):**
- Schema: version, lastUpdated timestamp, contents array
- Populated dynamically by content generator or manually by developers
- Version tracking for catalog migrations

**Backend Server Pattern (server/index.ts):**
- Bun HTTP server running on PORT 3000 (configurable via env)
- CORS headers: origin (default localhost:5173), methods (GET/POST/PUT/DELETE), headers (Content-Type, Authorization)
- Request routing: `/api/generate` (AI generation), `/api/content` (CRUD), `/api/health` (health check)
- Error handling: try-catch wrapping with descriptive error messages
- Response helpers: `jsonResponse(data, status)` and `errorResponse(message, status)` for consistent API responses
- OPTIONS preflight handling for CORS requests

**Vercel Deployment Configuration (vercel.json):**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist/`
- Rewrites: SPA routing for all paths except /contents/* and /assets/*
  - Pattern: `/((?!contents|assets).*)`  → `/index.html` (enables Vue Router history mode)
- Cache headers: /contents/* → `Cache-Control: public, max-age=31536000, immutable`
  - Caches generated content for 1 year (assumes content IDs are immutable)
- Purpose: Cost-free static hosting with proper SPA routing and long-term content caching

**Claude API Integration (server/routes/generate.ts):**
- Claude API endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-20250514` (configurable)
- System prompt builder: subject-specific guides (math: visual concepts, science: experiments, english: gamification)
- User prompt builder: grade labels mapping (elementary-1→'초등 1학년', etc.), interest context, language selection
- Input validation: interests array (max 10 items), subject/grade enum validation, sanitized interest strings
- Content generation rules: single HTML file, vanilla JS/CSS, dark theme (#1a1a2e), mobile responsive, accessibility
- Response format: JSON with title, description, type (game|quiz|exploration|simulation|story), html content
- Error handling: API key validation, response status checking, error text extraction, JSON parse error handling
- Content ID collision detection: prevents duplicate IDs in catalog
- Duplicate check: validates generated ID not already in catalog before save

**Content CRUD API (server/routes/content.ts):**
- GET /api/content: List contents with optional filters (subject, gradeLevel, type query params)
- GET /api/content/:id: Fetch single content manifest
- POST /api/content: Create/register new content with validation (required: id, title, subject, gradeLevel, type), duplicate ID check, JSON parse error handling
- PUT /api/content/:id: Update existing content (merges payload, immutable ID), path traversal protection via path.resolve validation
- DELETE /api/content/:id: Delete content with optional cascade deletion, path validation
- File operations: fs/promises for async catalog load/save with error recovery (creates default catalog on failure)
- Catalog path: `contents/index.json` (auto-created with defaults if missing)
- Response format: { success: boolean, count?: number, contents?: array, content?, error?: string }
- Timestamps: createdAt (POST), updatedAt (PUT) added automatically
- Content ID generation: slug-based from title + timestamp for unique identifiers
- Security: path traversal protection on delete operations, JSON parse error handling with descriptive messages

**Creator Mode Wizard Pattern (CreatorWizard.vue):**
- Multi-step form: interests → subject → grade → generating (4 steps)
- Current step tracking via ref, step validation via computed `canProceed`
- Form state: interests (array, validated), subject (Subject type), grade (Grade type)
- Step navigation: `nextStep()` and `prevStep()` with validation
- Generation trigger: `startGeneration()` wired to actual `useGenerationStore()` (not simulation)
- Input validation: interests array length check, subject/grade null checks before generation
- Progress state: { status, progress (0-100), message } from GenerationProgress type
- Store integration: passes validated interests, subject, grade to `generationStore.startGeneration()`

**Interest Input Component (InterestInput.vue):**
- Tag-based input: type interest + enter/comma to add
- Chip display: each interest as removable tag with X button
- Input validation: trim, lowercase, duplicate prevention
- v-model binding for parent state synchronization
- Styling: flex row layout with spacing, focus states on input

**Subject Select Component (SubjectSelect.vue):**
- Grid layout: 3 columns (math, science, english)
- Selection state: v-bind modelValue to selected subject
- Subject options: { value (Subject type), label (Korean), icon (emoji), color (CSS var) }
- Event emit: 'update:modelValue' on selection
- Visual feedback: selected card styling with check mark indicator
- Color binding: --subject-color CSS variable for dynamic theme

**Grade Select Component (GradeSelect.vue):**
- Selection: elementary/middle/high level + grade (1-6)
- Option grouping: subjects grouped by level
- Label mapping: grade strings to Korean level labels
- v-model binding for parent state
- Event emit: 'update:modelValue' on selection

**Generation Progress Component (GenerationProgress.vue):**
- Status tracking: idle, preparing, generating, generating-images, finalizing, completed, error
- Progress bar: percentage display (0-100) with animated fill
- Status messages: localized Korean messages for each status state
- UI states: spinner (in progress), checkmark (completed), error icon (error)
- Event emits: cancel, retry, viewContent(contentId) for parent handling
- Computed states: showProgress, isCompleted, isError, isInProgress, currentMessage

**Creator View Pattern (CreatorView.vue):**
- Hero section: title "나만의 콘텐츠 만들기", description about AI content generation
- Container: CreatorWizard component for multi-step form
- Styling: full height with variable spacing, responsive media query for mobile
- Layout: hero (centered, bold text) + wizard form below

**ESLint Configuration Update:**
- Ignores: dist, node_modules, agents/**/*.js, contents/**/*.js
- Vue globals added: HTMLElement, HTMLIFrameElement, HTMLDivElement, document, console, KeyboardEvent, setInterval, clearInterval, window
- Rules: vue/multi-word-component-names off, @typescript-eslint/no-unused-vars with argsIgnorePattern '^_'

**TypeScript Server Configuration (tsconfig.server.json):**
- Separate TypeScript config for server-side code (Bun runtime)
- Module resolution for backend-specific types
- Compiler options optimized for server environment

**Claude API Client (services/api/claude.ts):**
- ClaudeApiClient class wraps backend API calls to `/api/generate`
- Interface ContentGenerationOptions: interests, subject, grade, language, additionalContext
- Method generateContent() sends request with onProgress callback for progress tracking
- Progress states: preparing (0%), preparing analysis (10%), generating (20%), finalizing (80%), completed (100%)
- Exports: ClaudeApiClient class, generateContent(), checkApiHealth() convenience functions
- Error handling: catches network/API errors with fallback error messages
- Method checkGenerationStatus() for async generation status polling (future use)

**Gemini Image API Client (services/api/gemini.ts):**
- GeminiApiClient class wraps image generation via `/api/generate/image` endpoint
- Interfaces: ImageGenerationOptions (prompt, style, aspectRatio), ThumbnailOptions (title, subject, contentType)
- Methods: generateImage(), generateThumbnail() (subject/type-specific prompts), generateContentImage()
- Image styles: 'cartoon' (default), 'realistic', 'flat', 'pixel'
- Aspect ratios: '1:1' (default thumbnails), '16:9' (content images), '4:3'
- generateThumbnail() builds subject-specific hints (math: shapes, science: labs, english: alphabet) + type hints
- Exports: GeminiApiClient class, generateImage(), generateThumbnail(), generateContentImage() convenience functions

**Generation State Store (stores/generation.ts):**
- useGenerationStore() Pinia store manages AI content generation lifecycle
- State: currentProgress (status, progress%, message), currentRequest, lastResult, history
- Computed: isGenerating, isCompleted, hasError, progressPercent, statusMessage
- Action startGeneration() orchestrates generation: validates request, tracks timing, adds to content store on success, logs to history
- Action cancelGeneration() resets progress, clears currentRequest
- Action resetState() clears all state for new generation session
- History tracking: stores all generation requests/responses with uuid and duration
- Integration: content store interaction (addContent on success, loadContents after completion)

**AI Generation Composable (composables/useAIGeneration.ts):**
- useAIGeneration() Vue 3 composable provides reactive generation interface for components
- Exposed state: isGenerating, isCompleted, hasError, progress, progressPercent, statusMessage, lastResult, generatedContentId
- Exposed actions: generate(), cancel(), reset(), viewGeneratedContent() (routes to /content/:id), retryLastGeneration()
- Constants: GENERATION_STATUS_MESSAGES (Korean messages per status), SUBJECT_GENERATION_HINTS (subject-specific hints), ESTIMATED_GENERATION_TIME (30 seconds)
- Auto-logging: watches hasError and logs error messages to console
- Return type UseAIGenerationReturn interface defines all reactive and action properties

**Content Generator Prompts (agents/content-generator/prompts/):**
- `system.md`: Master prompt defining roles (education expert, game designer, frontend dev), generation rules (vanilla HTML, single file, dark theme #1a1a2e), structure template, gamification elements, accessibility requirements
- Subject-specific prompts: `math.md`, `science.md`, `english.md` - subject-specific content guidelines, learning objectives, interaction patterns
- Prompt response format: JSON with title, description, type, html fields
- Content types: game, quiz, exploration, simulation, story with interaction pattern guidance

**Keyboard Navigation Composable (useKeyboardNavigation.ts):**
- useKeyboardNavigation() Vue 3 composable for universal keyboard support
- Global shortcuts: `h` (home), `c` (create), `/` (search), `?` (help), `Escape` (fullscreen exit/back)
- Arrow key navigation: navigate content cards between rows/columns with smooth scrolling
- Smart input detection: shortcuts disabled in input fields except Escape
- Methods: `focusFirstCard()` (initial focus), `handleSkipLink(targetId)` (accessibility)
- Options: `enableGlobalShortcuts`, `enableArrowNavigation` (both default true)
- Event lifecycle: registered on mount, cleaned up on unmount

**Test Configuration (Vitest):**
- `vitest.config.mjs`: Environment (happy-dom), globals (true), include pattern (`tests/**/*.{test,spec}.ts`)
- Happy DOM for lightweight browser simulation (no Chromium needed)
- Global test functions: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` without imports

**Unit Test Patterns:**
- Content Loader Tests (`tests/unit/content-loader.test.ts`):
  - Service functions: `createInitialState()`, `getContentHtmlPath()` (with path fallback), `loadContentManifest()`, `checkContentExists()`, `findContentById()`, `loadContentById()`
  - Mock fetch responses: `vi.fn()` for async HTTP operations
  - Security validation: IFRAME_SANDBOX_ATTRS (excludes allow-same-origin) and IFRAME_ALLOW_ATTRS assertions
  - Path testing: validates both catalog-provided and default fallback paths
- Content Catalog Tests (`tests/unit/content-catalog.test.ts`):
  - Validates 10 required contents (all subjects, all levels)
  - File existence checks: manifest.json and index.html for each content
  - Catalog schema validation: version, contents array length, metadata fields
  - Content entry validation: id, title, subject, gradeLevel matching
- Generation Store Tests (`tests/unit/generation.test.ts`):
  - State initialization and computed properties
  - Progress updates: status, progress percentage, message tracking
  - State actions: `cancelGeneration()`, `resetState()`, `updateProgress()`
  - History management: `clearHistory()`, `getHistoryItem()`
  - Mock: Claude API client for isolated testing

**E2E Browser Compatibility Tests (browser-compatibility.spec.ts):**
- Supported browsers: Chrome, Firefox, Safari, Edge
- Feature matrix: CSS Grid/Flexbox, transforms/transitions, Fetch API, Async/Await, ES modules, LocalStorage, History API, Fullscreen, iframe sandbox
- Viewport sizes: Mobile (320x568 to 414x896), Tablet (768x1024), Desktop (1024x768 to 1920x1080)
- Specification tests: Verify feature list and browser support matrix (not automated with Playwright yet)
- Purpose: Identify cross-browser compatibility issues before production deployment
<!-- END AUTO-MANAGED -->

---

<!-- AUTO-MANAGED: git-insights -->
## Recent Changes

**Commit 680fbc8**: `fix: address code review findings`

Security hardening and bug fixes across frontend and backend:
- **Security Fixes**:
  - Removed `allow-same-origin` from iframe sandbox (`IFRAME_SANDBOX_ATTRS`) to prevent sandbox bypass
  - Added path traversal protection in content deletion via path.resolve() validation
  - Added input validation for interests array (max 10), subject/grade enum validation in generation endpoint
  - Implemented JSON parse error handling with descriptive error messages in content routes
- **Bug Fixes**:
  - Fixed ContentViewer loading/error state overlap: changed v-if to v-else-if for mutually exclusive states
  - Wired CreatorWizard to actual generation store (not simulation) with proper input validation
  - Added duplicate content ID check in generation endpoint to prevent catalog conflicts
- **Code Quality**:
  - Added `window` global to ESLint config for Vue files
  - Updated content loader tests to reflect security-focused sandbox changes
  - Enhanced error handling with specific error messages for API failures

**Commit 4f6d364**: `style: 홈 화면 UI/UX 개선 (Netflix 스타일)`

Home screen UI/UX refinement with Netflix-style enhancements:
- **Hero Section Enhancement** (`src/views/HomeView.vue`):
  - Hero height expanded to 85vh (min 600px) for full-screen impact
  - Radial gradient background: circle(1000px at 70% 20%) for abstract "learning universe" effect
  - Dual vignette overlay: top→bottom gradient + left side darkening for depth
  - Hero title responsive sizing: clamp(2.5rem, 5vw, 4rem) for flexible scaling
  - Hero content positioned with 100px top offset for visual balance, max-width 600px
  - Dual action buttons: Play (white background) + Info (translucent gray)
- **Content Card Redesign** (`src/components/home/ContentCard.vue`):
  - Thumbnail aspect ratio: 16:9 (from 1:1 square) for widescreen video-like appearance
  - Card width: 280px for optimal Netflix-style horizontal scroll spacing
  - iframe preview: live content preview in thumbnails (sandbox: `IFRAME_SANDBOX_ATTRS`)
  - Play overlay: centered with backdrop-filter blur effect, scales 1.1x on card hover
  - Badges repositioned: bottom-left placement with proper z-index layering
  - Badge styling: type label (brand red bg), grade level (dark bg)
  - Focus-visible outline: 2px brand-primary for keyboard navigation
- **Scroll Button UX** (`src/components/home/ContentRow.vue`):
  - Scroll buttons: 4% width min 40px, positioned absolute left/right
  - Visibility: hidden by default, opacity fade on row hover (0.5→0.7 transition)
  - Arrow icons: scale animation 1.2x on button hover for better feedback
  - Button background: rgba(20,20,20,0.5) with rounded corners on inner edge
  - Scroll amount: 420px increments (2 card widths) for predictable navigation
  - Scrollbar hidden: scrollbar-width none (Firefox) + webkit styling (Chrome/Safari)
  - Scroll snap: x mandatory with snap-align start for smooth snapping
- **Header Refinement** (`src/components/common/AppHeader.vue`):
  - Gradient background more sophisticated: rgba(0,0,0,0.7)→transparent
  - Scroll-aware transition: background solidifies at 50px scroll threshold
  - Page title display on mobile with route-based content
  - Navigation subject filtering: query params (?subject=math|science|english)
  - Responsive design: nav hidden on tablets, title centered on mobile
  - Event listener cleanup on component unmount for memory efficiency

**Latest Session**: Frontend and backend API improvements

Enhanced UI components and content management API:
- **Backend API Enhancement** (`server/routes/content.ts`):
  - Added PUT /api/content/:id endpoint for content updates with merge logic
  - Added DELETE /api/content/:id endpoint with optional cascade file deletion
  - Implemented path traversal protection via path.resolve() validation
  - Added createdAt/updatedAt timestamps for catalog entries
  - Enhanced POST validation with content ID generation (slug-based + timestamp)
  - Response format updated to include single content manifest in PUT/POST responses
- **AppHeader Component Refinement** (`src/components/common/AppHeader.vue`):
  - Improved scroll-aware gradient background transition
  - Enhanced navigation with subject-based query param filtering
  - Page title display on mobile with dynamic route-based content
  - Icon button styling with hover transitions
  - Event listener cleanup in onUnmounted lifecycle hook
- **ContentCard Component Enhancement** (`src/components/home/ContentCard.vue`):
  - Updated thumbnail to 16:9 aspect ratio (from 1:1 square)
  - Improved play icon styling with backdrop-filter blur and responsive scaling
  - Subject emoji icons: 📐 (math), 🔬 (science), 📚 (english)
  - Enhanced hover effects: scale (1.05x), shadow lift, icon scale (1.1x)
  - Badge positioning: bottom-left with proper z-index layering
  - Focus-visible keyboard navigation support with outline styling
  - Card info section: dark background (#181818) with truncated title display
- **ContentRow Component Refinement** (`src/components/home/ContentRow.vue`):
  - Improved scroll button positioning and visibility (hidden→visible on hover)
  - Enhanced scroll behavior: smooth 420px increments for 2-card widths
  - Scroll snap implementation: x mandatory with start alignment
  - Hidden scrollbar: scrollbar-width none and webkit pseudo-element
  - Rounded corner buttons with opacity transitions and hover scale
  - Arrow icon scaling (1.2x) on button hover for better interactivity
- **HomeView Component Enhancement** (`src/views/HomeView.vue`):
  - Improved hero section with radial gradient (circle at 70% 20%)
  - Added vignette overlay for depth effect (top to bottom + left side)
  - Enhanced title with responsive sizing: clamp(2.5rem, 5vw, 4rem)
  - Dual action buttons: white play button + translucent info button
  - Hero content positioning with 100px top offset for visual balance
  - Responsive hero height: 85vh min 600px with max-width 600px container
  - Three state management: loading spinner, error retry, empty state call-to-action
- **API Client Enhancement** (`server/routes/generate.ts`):
  - Consolidated Claude API integration with subject-specific system prompts
  - Input validation: interests array (max 10), subject/grade enum validation
  - Dynamic content ID generation: `${subject}-${slug}-${timestamp}` format
  - Grade/level mapping: elementaryN → elementary, middleN → middle, highN → high

**Commit a3ad260**: `fix: 콘텐츠 이미지 자산 및 경로 개선`

Content asset images and loader service improvements:
- **Content Asset Images**: PNG image files added to content directories
  - Word Safari vocabulary images: apple, banana, bird, cat, dog, elephant, fish, grape, lion, monkey, orange, rabbit, star, trophy
  - Fractions Pizza game images: pepperoni, sad face, star, trophy
  - Solar System simulation images: sad face, star, trophy (UI feedback icons)
  - Directory structure: `/contents/{subject}/{level}/{content-id}/images/`
  - Purpose: Support interactive educational content with visual references
- **Content Catalog** (`contents/index.json`):
  - Updated with 10 content entries (3 math, 4 science, 3 english) across all grade levels
  - Schema: id, title, subject, gradeLevel, grade, type, language, description, thumbnail, path
  - All entries include complete metadata for content discovery and loading
- **Content Loader Service** (`src/services/content/loader.ts`):
  - Path resolution logic: supports both absolute paths (from catalog) and default paths (/{subject}/{level}/{id}/)
  - `getContentHtmlPath()`: normalized path handling with fallback pattern
  - Improved error handling for missing catalogs and content files

**Latest Update**: `feat: 테스트 및 검증 (Task 14)`

Comprehensive testing infrastructure and keyboard accessibility implementation:
- **Test Framework**: Vitest with happy-dom environment configured
  - Configuration: `vitest.config.mjs` with globals enabled, happy-dom for lightweight browser simulation
  - Scripts: `test` (run), `test:watch` (watch mode), `test:coverage` (coverage report)
- **Unit Tests** (3 test suites, 1400+ lines):
  - `tests/unit/content-loader.test.ts`: Service functions, fetch mocking, security attributes validation
    - Tests: createInitialState, getContentHtmlPath, loadContentManifest, checkContentExists, findContentById, loadContentById
    - Coverage: path generation logic, error handling, manifest loading from catalog
  - `tests/unit/content-catalog.test.ts`: 10 content validation (272 lines)
    - Validates all 10 contents: math (3), science (4), english (3) across all grade levels
    - Checks: catalog schema, file existence, metadata accuracy, version format
  - `tests/unit/generation.test.ts`: Generation store state management (450+ lines)
    - Tests: initial state, computed properties, progress updates, cancellation, history tracking
    - Coverage: status transitions (idle→preparing→generating→completed→error), store actions
- **E2E Browser Compatibility** (`tests/e2e/browser-compatibility.spec.ts`):
  - Browser matrix: Chrome, Firefox, Safari, Edge
  - Feature list: CSS Grid/Flexbox, transforms/transitions, Fetch API, async/await, ES modules, LocalStorage, History API, Fullscreen, iframe sandbox
  - Viewport coverage: 7 sizes (mobile 320px→desktop 1920px)
  - Purpose: Specification tests for pre-production validation
- **Keyboard Navigation Composable** (`src/composables/useKeyboardNavigation.ts`):
  - Global shortcuts: `h` (home), `c` (creator), `/` (search), `?` (help), `Escape` (back/fullscreen exit)
  - Arrow navigation: Up/Down/Left/Right between content rows, Enter/Space to select
  - Smart input detection: disabled in input fields except Escape
  - Accessibility: skip links, first card focus, smooth scroll to focused element
  - Options: enableGlobalShortcuts, enableArrowNavigation (both configurable)
- **Build Integration**:
  - `package.json`: Added test scripts (test, test:watch, test:coverage)
  - Dependencies: added @vue/test-utils, vitest, happy-dom

**Commit 11f1771**: `feat: 반응형 및 마무리 (Task 13)`

Documentation update for 7 additional interactive educational contents and knowledge graph expansion (Task 13 completion):
- **README.md** updated with complete platform feature overview
  - 10 total educational contents now documented (10-row table)
  - Keyboard shortcuts for navigation
  - Accessibility features section with details
  - Content structure documentation with type definitions
- **Contents Catalog** (`contents/index.json`) expanded
  - All 10 content entries fully populated with extended metadata
  - Schema includes: id, title, subject, gradeLevel, grade, type, language, description, thumbnail, path
  - All entries include learningObjectives, prerequisites, estimatedTime, createdAt, updatedAt timestamps
- **Knowledge Map Graph** (`contents/knowledge-map.json`) expanded
  - 14 knowledge nodes across all subjects and levels
  - 13 edges mapping prerequisites and related concepts
  - Prerequisite chains: basic vocabulary → grammar → persuasive writing (English progression)
  - Prerequisite chains: numbers-operations → fractions-basic → shapes (Math progression)
  - Related concept links: solar-system ↔ matter-properties, cell-structure ↔ chemical-reactions (Science)
- **7 New Content Directories** with complete implementations:
  - `contents/math/elementary/shapes-explorer/` (exploration)
  - `contents/math/middle/equation-puzzle/` (quiz)
  - `contents/science/elementary/circuit-lab/` (simulation)
  - `contents/science/middle/cell-explorer/` (exploration)
  - `contents/science/high/chemical-reactor/` (simulation)
  - `contents/english/middle/grammar-quest/` (quiz)
  - `contents/english/high/debate-arena/` (story)
- Each content includes: manifest.json, index.html, style.css, script.js with complete structure

**Commit 35533dd**: `feat: 나머지 7개 교육 콘텐츠 구현`

Completed Task 11: Additional 7 interactive educational contents implemented:
- `contents/math/elementary/shapes-explorer/` - Shapes Explorer Game
  - Interactive exploration of 2D and 3D geometric shapes
  - Learning objectives: understand shape properties, identify vertices/edges/faces, recognize symmetry
  - Estimated time: 15 minutes, Grade 5
  - Manifest schema: learningObjectives, prerequisites, estimatedTime, timestamps
- `contents/math/middle/equation-puzzle/` - Equation Puzzle Game
  - Quiz-based learning for linear and simultaneous equations
  - Learning objectives: solve equations, understand algebraic manipulation
  - Estimated time: 15 minutes, Grade 2 (중학교)
  - Type: quiz interaction pattern with instant feedback
- `contents/science/elementary/circuit-lab/` - Circuit Lab Simulation
  - Interactive circuit building and testing simulation
  - Learning objectives: understand circuit principles, series/parallel connections, voltage and current
  - Estimated time: 15 minutes, Grade 6
  - Type: simulation with interactive component placement
- `contents/science/middle/cell-explorer/` - Cell Explorer Game
  - Microscopic cell structure exploration with interactive labeling
  - Learning objectives: identify cell structures, understand organelle functions
  - Estimated time: 15 minutes, Grade 1 (중학교)
  - Type: exploration pattern for discovery-based learning
- `contents/science/high/chemical-reactor/` - Chemical Reactor Simulator
  - Advanced chemistry simulation for reaction visualization
  - Learning objectives: understand chemical reactions, learn reaction formulas
  - Estimated time: 15 minutes, Grade 1 (고등학교)
  - Type: simulation with complex interactions
- `contents/english/middle/grammar-quest/` - Grammar Quest Game
  - English grammar learning through quest-based gameplay
  - Learning objectives: master tenses, articles, subject-verb agreement
  - Estimated time: 15 minutes, Grade 2 (중학교)
  - Language: English, type: quiz with immediate feedback
  - Prerequisites: Basic English vocabulary
- `contents/english/high/debate-arena/` - Debate Arena Interactive Content
  - Advanced English speaking and argumentation practice
  - Learning objectives: construct arguments, practice debate structures, develop rhetoric
  - Estimated time: 15 minutes, Grade unknown
  - Type: interactive learning platform for advanced students
- `contents/index.json` extended catalog
  - Total: 10 content entries (3 previous + 7 new)
  - All contents include extended manifest with learningObjectives, prerequisites, estimatedTime
  - Consistent schema: id, title, subject, gradeLevel, grade, type, language, description, thumbnail, path
- `contents/knowledge-map.json` expanded knowledge graph
  - 10+ knowledge nodes mapping prerequisites to content
  - Edges connecting foundational concepts to advanced topics
  - Support for prerequisite tracking across subjects and levels
- README.md updated with current platform features and usage instructions

**Commit d631abb**: `feat: AI 생성 파이프라인 구현`

Completed Task 10: Frontend-backend AI generation pipeline integration:
- `src/services/api/claude.ts` Claude API client wrapper
  - ClaudeApiClient class with generateContent() method supporting progress callbacks
  - Progress tracking: 0% (preparing) → 10% (analyzing) → 20% (generating) → 80% (finalizing) → 100% (completed)
  - ProgressCallback type for real-time UI updates during generation
  - checkGenerationStatus() for async polling (future enhancement)
  - healthCheck() endpoint validation
- `src/services/api/gemini.ts` Gemini image generation client
  - GeminiApiClient class with generateImage(), generateThumbnail(), generateContentImage() methods
  - Image styles: cartoon, realistic, flat, pixel
  - Aspect ratios: 1:1 (thumbnails), 16:9 (content images)
  - Subject-specific thumbnail prompts (math/science/english) with type-specific atmosphere hints
  - Dark theme color compatibility (#1a1a2e background)
- `src/stores/generation.ts` Pinia generation state management store
  - State: currentProgress, currentRequest, lastResult, generation history with uuid and duration
  - Computed properties: isGenerating, isCompleted, hasError, progressPercent, statusMessage
  - Action startGeneration(): validates input, tracks timing, integrates with content store, logs history
  - Action cancelGeneration() and resetState() for lifecycle management
  - Auto-adds completed content to content store via `addContent()`
- `src/composables/useAIGeneration.ts` Vue 3 composable for component integration
  - Reactive properties: isGenerating, isCompleted, hasError, progress, progressPercent, statusMessage, lastResult, generatedContentId
  - Actions: generate(), cancel(), reset(), viewGeneratedContent() (routes to /content/:id), retryLastGeneration()
  - Constants: GENERATION_STATUS_MESSAGES (Korean), SUBJECT_GENERATION_HINTS, ESTIMATED_GENERATION_TIME (30s)
  - Auto-logging of errors to console
  - Return type UseAIGenerationReturn interface
- `src/composables/` new directory for Vue 3 composables
  - Follows Composition API best practices
  - Replaces manual state management in components
- `agents/content-generator/prompts/system.md` master system prompt
  - Defines AI roles: education expert, game designer, frontend developer
  - Generation rules: single vanilla HTML file, dark theme (#1a1a2e to #0f0f23), mobile-first responsive
  - Content structure template with header (title + score), main area, footer (buttons)
  - Gamification requirements: scoring, progress tracking, immediate feedback, level system, animations
  - Content types: game, quiz, exploration, simulation, story with interaction patterns
- `agents/content-generator/prompts/math.md`, `science.md`, `english.md` subject-specific prompts
  - Subject-focused learning objectives and interaction patterns
  - Curriculum-aligned difficulty levels (elementary/middle/high)
- Updated `docs/plans/my-feature.md` with Task 10 completion checkmarks

**Commit ddaf79f**: `feat: 백엔드 서버 구현 (Bun HTTP 서버)`

Completed Task 8: Backend API server implementation:
- `server/index.ts` Bun HTTP server with CORS support
  - Port 3000 (configurable), CORS headers for localhost:5173
  - Request routing: /api/generate, /api/content, /api/health, 404 handling
  - Response helpers: jsonResponse(), errorResponse() for consistent API responses
  - OPTIONS preflight handling for cross-origin requests
- `server/routes/generate.ts` AI content generation endpoint
  - Claude API integration (claude-sonnet-4-20250514 model)
  - System prompt builder with subject-specific guides (math, science, english)
  - User prompt builder: grade labels, interests, language support
  - Generation rules: vanilla HTML/CSS/JS, dark theme, mobile responsive, accessibility
  - Response: { title, description, type, html } JSON format
- `server/routes/content.ts` Content CRUD API
  - GET /api/content: list contents with filters (subject, gradeLevel, type)
  - GET /api/content/:id: fetch single content
  - POST /api/content: register new content with validation
  - File I/O: fs/promises for catalog load/save operations
  - Catalog path: contents/index.json with auto-creation fallback
- `package.json` updated with dev server script
  - `dev:server` runs bun server/index.ts
  - `dev:all` runs Vite and Bun server in parallel
- `tsconfig.server.json` TypeScript config for server code (Bun runtime)
- Updated `eslint.config.js` to add server-side globals (HTMLElement, document, console, KeyboardEvent, setInterval, clearInterval)

**Commit 40a3e51**: `feat: 창조 모드 UI 구현`

Completed Task 9: Creator mode UI implementation:
- `src/views/CreatorView.vue` creator mode page
  - Hero section with title "나만의 콘텐츠 만들기" and AI description
  - Multi-step wizard form for content creation
  - Responsive layout with media query for mobile
- `src/components/creator/CreatorWizard.vue` multi-step wizard container
  - Step flow: interests → subject → grade → generating (4 steps)
  - Step validation: `canProceed` computed for next button state
  - Form state: interests (string[]), subject (Subject), grade (Grade)
  - Navigation: `nextStep()`, `prevStep()` with route-based transitions
  - Generation trigger: `startGeneration()` initializes progress state
  - Progress tracking: GenerationProgress type with status, progress percentage, message
- `src/components/creator/InterestInput.vue` interest tag input
  - Tag-based input: type interest + enter/comma to add tags
  - Tag display: chip cards with remove button
  - v-model binding for parent state sync
  - Validation: trim, lowercase, duplicate prevention
- `src/components/creator/SubjectSelect.vue` subject selection
  - Grid layout: 3 columns (수학, 과학, 영어)
  - Options: { value (math|science|english), label, icon (emoji), color (CSS var) }
  - v-model binding with 'update:modelValue' emit
  - Visual feedback: selected card with check mark
  - Dynamic color binding via --subject-color variable
- `src/components/creator/GradeSelect.vue` grade level selection
  - Selection: elementary/middle/high + grade (1-6)
  - Option grouping by level, Korean labels
  - v-model binding with 'update:modelValue' emit
- `src/components/creator/GenerationProgress.vue` progress tracking display
  - Status types: idle, preparing, generating, generating-images, finalizing, completed, error
  - Progress bar: percentage fill (0-100) with animated states
  - Status icons: spinner (progress), checkmark (completed), exclamation (error)
  - Event emits: cancel, retry, viewContent(contentId)
  - Computed message: context-aware status display in Korean
- Updated `eslint.config.js` to ignore agents/**/*.js and contents/**/*.js from linting
  - Rationale: AI-generated and content agent code may not follow strict rules

**Commit 1cd9ea0**: `feat: 첫 3개 교육 콘텐츠 구현`

Completed Task 7: First 3 interactive educational contents implemented:
- `contents/math/elementary/fractions-pizza/` - Pizza Fractions Game
  - Interactive game teaching fraction concepts through pizza slicing
  - Learning objectives: understand fractions, differentiate numerator/denominator, divide equally
  - Estimated time: 10 minutes, Grade 3
  - Implements: flexbox layout, score tracking, game state management
  - Uses: base.html pattern with dark gradient background, interactive game logic
- `contents/science/elementary/solar-system/` - Solar System Simulation
  - Interactive space exploration teaching planetary characteristics
  - Learning objectives: discover planetary features, understand orbital mechanics
  - Estimated time: 15 minutes, Grade 4
  - Implements: radial gradient background, planet visualization, progress tracking
  - Uses: content container pattern with navigation and state persistence
- `contents/english/elementary/word-safari/` - Word Safari Game
  - Picture-to-word matching game for English vocabulary learning
  - Learning objectives: learn vocabulary, match words with images, practice spelling
  - Estimated time: 10 minutes, Grade 3
  - Implements: card-based UI, matching mechanics, progress indicators
  - Uses: flexbox layout with responsive design
- `contents/index.json` catalog updated with 3 new content entries
  - All contents include manifest.json with metadata (id, subject, gradeLevel, type, language)
  - Extended schema: learningObjectives, prerequisites, estimatedTime, timestamps
  - Ready for home page display via content store
- Updated `docs/plans/my-feature.md` with Task 7 completion checkmarks

**Commit 5a6a421**: `feat: 샘플 콘텐츠 템플릿 및 공통 스타일 구현`

Completed Task 6: Sample content templates and common styling:
- `agents/content-generator/templates/base.html` base HTML template
  - Flexbox layout: header (title + score), main (content area), footer (buttons)
  - Dark gradient background with responsive mobile styles
  - Score display with star icon, reset and next buttons
  - Template variable substitution for title and content
  - Script loading: shared styles + content-specific script.js
- `agents/content-generator/styles/game-ui.css` game UI component styles
  - Button variants: primary (Netflix red), secondary (transparent), success (green), warning (yellow)
  - Button sizes: default, sm, lg, icon (circular)
  - Hover states with transform lift and shadow enhancement
  - Disabled state with opacity and cursor management
  - Card styles with glassmorphism effect (semi-transparent with border)
- `agents/content-generator/styles/animations.css` keyframe definitions
  - Entrance animations: fadeIn/Out, slideUp/Down/Left/Right, scaleUp/Down
  - Motion effects: bounce, spin, pulse, shimmer
  - Timing: 0.3s-0.8s durations for smooth transitions
- `agents/content-generator/styles/utils.css` utility classes library
  - Display utilities: d-flex, d-grid, d-block, etc.
  - Flexbox control: flex-row, flex-column, justify-*, items-*, gap-*
  - Spacing grid: m-0 to m-5 (4px to 20px), gap variants
  - Responsive-ready class names matching Tailwind convention
- `agents/content-generator/styles/interactions.js` game interaction utilities
  - EduGame state manager: score, level, highScore tracking
  - Score display: updateScoreDisplay() with scale animation, showScorePopup() with floating text
  - Level progression: levelUp() modal with icon and animation
  - Drag-and-drop event handling patterns
  - Event delegation for dynamic content elements
- `contents/index.json` content catalog index
  - Schema: version, lastUpdated, contents array
  - Version: "1.0.0" with ISO timestamp
  - Ready for programmatic population by AI generator
- Updated `docs/plans/my-feature.md` with Task 6 completion checkmarks
- Updated `eslint.config.js` to ignore `agents/**/*.js` and `contents/**/*.js` from linting
  - Rationale: Generated content and agent scripts may not follow strict rules

**Commit 33d2708**: `feat: 콘텐츠 뷰어 구현`

Completed Task 5: Content viewer and sandbox implementation:
- `src/views/ContentView.vue` content detail page with route-based loading
  - Route param props for content ID
  - Store-based content lookup with loading/error states
  - Metadata display: subject, grade level, content type with label mappings
  - Fullscreen toggle via ref to ContentViewer child component
  - Child event handlers for load/error lifecycle
- `src/components/viewer/ContentViewer.vue` iframe sandbox viewer
  - Props: src (HTML path), title (content name)
  - Emits: load, error, fullscreenChange events
  - Exposed methods: toggleFullscreen(), isFullscreen computed for parent access
  - Loading/error UI states with spinner and error messages
  - iframe sandbox security: allow-scripts, allow-forms, allow-popups, allow-modals, allow-same-origin
  - Fullscreen API integration with document listener for state tracking
- `src/services/content/loader.ts` content loading service
  - Functions: loadContentManifest(), getContentHtmlPath(), checkContentExists(), findContentById(), loadContentById()
  - Default path pattern: `/contents/{subject}/{gradeLevel}/{id}/index.html`
  - Catalog lookup from `/contents/index.json` with error handling
  - Exported security constants: IFRAME_SANDBOX_ATTRS, IFRAME_ALLOW_ATTRS
- Updated `eslint.config.js` with HTMLIFrameElement and HTMLDivElement globals for template refs
- Updated `docs/plans/my-feature.md` with Task 5 completion checkmarks

**Commit 76ce2f2**: `feat: 홈 화면 및 콘텐츠 카드 구현`

Completed Task 4: Home view and content cards implementation:
- `src/views/HomeView.vue` main home page with hero section
  - Hero section with gradient background and title "배움이 재미있어지는 순간"
  - Loading state with spinner and progress message
  - Error state with retry button
  - Empty state with hint to create content
  - Content sections grid organized by subject via ContentRow components
- `src/components/home/ContentCard.vue` content card component
  - RouterLink to `/content/:id` with subject-based color class
  - Square thumbnail (1:1) with emoji icon (subject-specific)
  - Hover overlay with play icon and scale transform
  - Badges for content type and grade level (top-right)
  - Title and description with truncation
- `src/components/home/ContentRow.vue` horizontal scrollable content row
  - Row header with subject label and scroll controls (left/right arrows)
  - Smooth horizontal scroll with 420px increment per button click
  - Grid of ContentCard components via v-for iteration
- `src/stores/content.ts` Pinia content state management store
  - State: contents array, loading/error flags, subject/grade filters
  - Computed: filtered contents, mapped card data, grouped by subject, ID lookup
  - Action: loadContents() fetches `/contents/index.json` with fallback to dummy data
  - Dummy content for development when real catalog unavailable
- Updated `docs/plans/my-feature.md` with Task 4 completion checkmarks

**Commit 64bcae9**: `feat: 레이아웃 및 헤더 컴포넌트 구현`

Completed Task 3: Layout and header implementation:
- `src/App.vue` root layout with AppHeader integration and fixed header padding
- `src/components/common/AppHeader.vue` with fixed navigation, dynamic title, and responsive design
  - Navigation with subject filtering by query params
  - Header actions area with search button and mode toggle
  - Gradient background that transitions on scroll
  - Mobile responsive: nav hidden, title centered
- `src/components/common/ModeToggle.vue` animated switch button
  - Routes navigation (view → `/`, create → `/create`)
  - Toggle state derived from current route
- `src/assets/styles/theme.css` comprehensive design system
  - Netflix dark theme (brand red #e50914, dark backgrounds)
  - Color palette: primary/secondary/card backgrounds, text colors, status colors, subject-specific colors
  - Typography: Pretendard font family, 8-step size scale (xs to 4xl), weight scale
  - Spacing: 8-point grid (xs to 2xl)
  - Layout variables: header-height (68px), sidebar-width (250px), max-width (1920px), padding (4%)
  - Transitions: 3 speeds, z-index layers (100-600)
  - Base styles: scrollbar customization, selection colors, focus management
- `src/style.css` global app wrapper styles
- Updated planning docs with Task 3 completion checkmarks

**Commit 56813be**: `feat: 타입 정의 및 Vue Router 설정`

Established routing infrastructure and comprehensive type definitions:
- Vue Router with 4 routes: `/` (home), `/content/:id` (viewer), `/create` (creator), `/:pathMatch(.*)*` (404)
- Router guards for dynamic page title updates
- `src/router/index.ts` with lazy-loaded view components
- Type definitions: `src/types/content.ts`, `src/types/generation.ts`, `src/types/knowledge-map.ts`
- View placeholders: HomeView, ContentView, CreatorView, NotFoundView (with Netflix-style 404)
- `src/App.vue` root with router-view outlet
- `src/main.ts` bootstraps Vue app with router plugin
- vue-router 4 added to dependencies

**Commit e351c83**: `feat: 프로젝트 초기화 - Vite + Vue 3 + TypeScript`

Project initialization with Vite + Vue 3 + TypeScript + Bun backend. Established:
- Frontend stack with Vite build and HMR
- TypeScript strict mode for type safety
- ESLint + Prettier for code quality
- Directory structure for modular features
- Environment configuration template
- Developer experience setup (VSCode extensions)
<!-- END AUTO-MANAGED -->

---

<!-- MANUAL: Development Notes -->
## Development Notes

- **API Key Management**: Store `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` in `.env` (not in repo)
- **Content Sandbox**: iframe-based execution prevents XSS in user-generated content
- **Asset Loading**: Static content served from `/contents/` directory
- **Knowledge Map**: JSON graph linking content to prerequisite knowledge
- **Bun Backend**: Lightweight server for API proxying (Claude, Gemini) and content CRUD

<!-- END MANUAL -->
