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
bun run dev:server       # Bun API 서버 (localhost:3000)
bun run dev:all          # 둘 다 실행
bun run build            # 프로덕션 빌드 (dist/)
bun run test             # Vitest 실행
bun run lint:fix         # ESLint + 자동 수정
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
├── composables/        # useAIGeneration.ts
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
├── prompts/            # system.md, math.md, science.md, english.md
└── styles/             # game-ui.css, animations.css, utils.css
```

## Code Conventions
- **Vue**: `<script setup lang="ts">`, scoped styles, Composition API
- **Naming**: Components=PascalCase, services/stores=camelCase
- **Types**: interfaces for contracts, types for unions
- **Unused vars**: `_` prefix (ESLint rule)
- **Imports**: 외부 패키지=absolute, 로컬=relative

## Key Patterns

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

**iframe Security** (loader.ts):
- `IFRAME_SANDBOX_ATTRS` = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
- `allow-same-origin` 포함: 외부 CSS/JS 파일 로드에 필요 (solar-system 등)
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
