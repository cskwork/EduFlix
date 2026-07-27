# EduFlix

A Netflix-style platform for interactive educational content.

**English** · [한국어](README.ko.md)

[Live demo](https://eduflix.vercel.app) · [Docs](docs/)

## About

EduFlix is a learning platform for students from elementary through high school. It pairs a Netflix-style browsing experience with AI-generated content, so a lesson can be created on demand around whatever a learner is interested in — dinosaurs, football, space — and played straight in the browser.

Every lesson is a self-contained bundle of vanilla HTML/CSS/JS that runs inside a sandboxed iframe, so nothing an AI generates can reach the host app.

### Features

- **View mode** — browse and play lessons, Netflix style
- **Create mode** — generate a tailored lesson with AI, from your interests or from a problem you paste in
- **Learning map** — see how topics and prerequisites connect
- **Sandboxed playback** — lessons run in an isolated iframe
- **Bilingual UI** — English by default, switchable to Korean from the header

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + TypeScript + Vite + Pinia |
| Backend | Bun (lightweight HTTP server) |
| AI | GLM via Z.ai (configurable provider) |
| Storage | Local filesystem (IndexedDB on static deployments) |
| Content | Vanilla HTML/CSS/JS, Three.js for 3D |

## Getting started

### Requirements

- [Bun](https://bun.sh/) v1.0 or later
- Node.js v18 or later (optional)

### Install

```bash
git clone https://github.com/cskwork/EduFlix.git
cd EduFlix

bun install

cp .env.example .env
# open .env and set your API keys
```

### Environment variables

Copy `.env.example` and fill in what you need:

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAI_API_KEY` | for content generation | LLM key used by the content factory |
| `FACTORY_LLM_PROVIDER` | – | `zai` (default) or `codex` |
| `ADMIN_TOKEN` | **for public deployments** | Auth token for write APIs — see [Security](#security) |
| `PORT` | – | API server port (default `3001`) |
| `CORS_ORIGIN` | – | Only when you need cross-origin access |
| `VITE_ALLOWED_HOSTS` | – | Extra hosts allowed to reach the dev server (tunnels) |

### Run the dev servers

```bash
# frontend only (http://localhost:5173)
bun run dev

# backend API only (http://localhost:3001)
bun run dev:server

# both at once — recommended
bun run dev:all
# or ./start.sh  (start.bat on Windows)
```

> The API server is required for content generation and for the "Popular now" row, which is backed by SQLite.

### Production build

```bash
bun run build     # outputs to dist/
bun run preview   # preview the build
bun run start     # serve dist/ + the API from one Bun server
```

## Security

Content generation, editing and deletion cost LLM credits and write to disk, so **write requests require admin authentication**.

- **Development** (`NODE_ENV != production`): leaving `ADMIN_TOKEN` unset keeps write APIs open.
- **Public deployment** (`NODE_ENV=production`, `bun run start`): `ADMIN_TOKEN` is **required**. Without it, write APIs return `503`.

```bash
# generate a token
openssl rand -hex 32

# server: put it in .env
ADMIN_TOKEN=<generated value>

# browser: register it once from the console
localStorage.setItem('eduflix_admin_token', '<same value>')
```

The token travels in the `X-Admin-Token` header. Because browsers don't attach it automatically, this also blocks CSRF. Read APIs (`GET`) and lesson playback stay public.

## Internationalization

The UI ships in English and Korean. English is the default; the switcher sits in the top-right of the header, and the choice is remembered in `localStorage`.

The i18n layer is dependency-free and lives in `src/i18n/`. **Adding a language takes two steps:**

1. Copy `src/i18n/messages/en.ts` to `src/i18n/messages/<code>.ts` and translate it. Declaring it as `MessageSchema` means a missing key fails the build.
2. Register it in `LOCALES` in `src/i18n/locales.ts`.

The switcher, persistence, `<html lang>`, the document title and the content-generation language all follow automatically.

Message keys are typed — `t('a.b.c')` is checked at compile time, so a typo fails `vue-tsc` rather than rendering a raw key at runtime.

Catalog metadata is localized separately: `manifest.json` keeps `title` and `description` in the lesson's original language and adds optional per-language overrides.

```json
{
  "title": "피자로 배우는 분수",
  "translations": {
    "en": { "title": "Fraction Pizza", "description": "Learn what fractions are with a delicious pizza!" }
  }
}
```

Search matches both the original and the translations. Note that the **lesson bodies themselves are not translated** — only the surrounding UI and catalog metadata follow the selected language.

## Project structure

```
EduFlix/
├── src/                      # frontend source
│   ├── components/           # Vue components (common, home, viewer, creator, editor)
│   ├── views/                # page components
│   ├── composables/          # Vue 3 composables
│   ├── services/             # API and content services
│   ├── stores/               # Pinia stores
│   ├── i18n/                 # i18n runtime, locale registry, message catalogs
│   └── types/                # TypeScript types
├── server/                   # Bun backend
│   ├── index.ts              # HTTP server
│   └── routes/               # API routes
├── api/                      # Vercel serverless functions
├── agents/                   # AI content factory (pipeline, prompts, templates)
├── public/contents/          # generated lessons
│   ├── index.json            # content catalog
│   ├── knowledge-map.json    # knowledge graph
│   └── {subject}/{level}/    # lesson files
└── docs/                     # documentation
```

## Content structure

Each lesson follows this layout:

```
public/contents/{subject}/{level}/{content-id}/
├── manifest.json    # metadata
├── index.html       # the lesson
├── style.css        # styles (optional)
└── script.js        # logic (optional)
```

### Content types

| Type | Description |
|------|-------------|
| `game` | Gamified learning activity |
| `quiz` | Questions and problem solving |
| `exploration` | Open-ended exploration |
| `simulation` | Interactive simulation |
| `story` | Story-driven learning |

### Render modes

`renderMode` controls *how* a lesson is built, independently of its educational type:

| Mode | Description |
|------|-------------|
| `3d` | Three.js simulation (**default**) |
| `3d-game` | Three.js with a game loop |
| `canvas-game` | Canvas 2D game |
| `svg` | Interactive SVG |
| `dom` | Classic cards and buttons |

### Included content

84 lessons ship with the repository:

| Subject | Count |
|---------|-------|
| Math | 50 |
| English | 23 |
| Science | 8 |
| World history | 2 |
| Coding | 1 |

By level: 47 elementary, 34 middle, 3 high school.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `h` | Go home |
| `c` | Create mode |
| `/` | Search |
| `ESC` | Back / exit fullscreen |
| Arrow keys | Browse content |
| `Enter` / `Space` | Select content |

## Development commands

```bash
bun run lint       # lint
bun run lint:fix   # lint and autofix
bun run format     # format with Prettier
bun run test       # run the test suite
bun run factory    # run the content factory from the CLI
```

## Deployment

**Vercel** (primary) — `vercel --prod`. Requires `ZAI_API_KEY`, `ADMIN_TOKEN` and `VITE_STATIC_MODE=true`. On static deployments, generation runs through a single serverless LLM call and the result is stored in the browser's IndexedDB.

**Self-hosted** — `bun run build`, then `PORT=9888 bun run start` serves the static files and the API from one process, with the full six-stage generation pipeline and lessons written to disk.

See [docs/deployment](docs/deployment/) for details.

## Accessibility

- Keyboard navigation
- Screen reader support (ARIA attributes)
- High contrast mode
- Reduced motion mode
- Skip navigation link

## License

[GNU AGPL-3.0](LICENSE) — Copyright (c) 2026 cskwork

If you run this software (or a modified version) as a network service, you must make the complete source code of that version available to its users.
