# PLAN - AI 콘텐츠 팩토리 (완전 자동 교육 콘텐츠 생성 파이프라인)

Frozen plan. A fresh-context implementer reads ONLY this file (plus the latest `R-LOOP.md` section on
re-entry) and builds it. 구현 언어: TypeScript (Bun 런타임). 응답/주석/카피는 한국어.

## Approval

- Status: auto-approved
- Record: 2026-07-13; autonomous run (pre-authorized autonomy). 사용자가 원요청에서 구현자(codex gpt-5.6-sol high)와 최종 산출물(PoC 1개 HTML + 브라우저 오픈)까지 지정함.

## Intent

- **Goal**: 한국 상위 에듀콘텐츠 업체의 제작 방법론(ADDIE 8단계, 스토리보드 선승인, 교사 검수)을 AI 단계 체인으로 인코딩한 **완전 자동 콘텐츠 팩토리**를 EduFlix repo에 신설. 한 명령으로 주제/학년 → 완성된 인터랙티브 HTML 학습 콘텐츠(이미지 포함) → 카탈로그 등록까지 무인 수행.
- **Constraints**: 기존 소스(src/, server/, 기존 79개 콘텐츠, index.json 기존 항목) 불변 — package.json 스크립트 추가만 허용. 생성 엔진은 codex CLI(`gpt-5.6-sol`, reasoning high, 구독 인증; API 키 불필요). 이미지도 codex `image_gen`.
- **Tradeoffs / rejected**: (1) 기존 /api/generate(art-assets 외부 서버 위임)를 교체하는 안 → 기각: 외부 서버 의존이며 파괴 위험. 독립 CLI 파이프라인으로 병렬 신설. (2) Phaser 게임 계열 산출 → 기각: 자동 생성 신뢰도가 낮음. EduFlixEngine 인라인 계열(15개 기존 사례)로 고정. (3) Claude API 엔진 → 기각: .env에 키 없음, 사용자가 codex 지정.
- **Completion promise**: `bun run factory -- --topic "선대칭과 점대칭" --grade elementary-5 --subject math` 1회 실행이 exit 0으로 기획→스토리보드→이미지→코드→QA게이트→카탈로그 등록을 마치고, 생성된 index.html이 브라우저에서 열려 씬 전환·인터랙션이 동작한다. Proof: GOAL.md SC1~SC9 전부 체크(빌드/테스트 보존 + playwright 캡처 포함). Stop: 전부 green 또는 `max_iterations` 8 도달. 
- max_iterations: 8

## Design Read (UI/UX overlay)

- 초등 5학년 대상 인터랙티브 수학 학습 콘텐츠 — 밝고 따뜻한 플레이풀 톤, 호기심 훅 + 캐릭터 내레이션 + 즉각 피드백/보상, 기존 EduFlix scene framework(glassmorphism, bg-* 배경) 계승. Aesthetic family: 없음(base taste-skill-v2만). Engagement overlay: off.
- Dials: `DESIGN_VARIANCE=medium`, `MOTION_INTENSITY=medium`(prefers-reduced-motion 폴백 필수), `VISUAL_DENSITY=low`(터치 타겟 44px+, 학년 어휘 수준).

## Steps

모든 경로는 워크트리 루트(`/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory`) 기준. 필독 입력:
- `docs/changelog/2026-07/13-ai-content-factory/research/market-research.md` — 방법론·품질 체크리스트 22항목(4절)·5-Stage 설계 제언(5절)
- `docs/changelog/2026-07/13-ai-content-factory/research/repo-map.md` — 보존 계약·콘텐츠 해부·재사용 자산

1. **디렉토리 신설** `agents/content-factory/`:
   - `pipeline/run.ts` — CLI 엔트리. 인자: `--topic <str> --grade <elementary-1..high-3> --subject <math|science|english> [--type simulation|game|quiz|exploration|story] [--id <slug>] [--skip-images] [--stage <plan|storyboard|assets|build|qa|publish>]`. 단계 순차 실행, 각 단계 산출물을 `agents/content-factory/runs/<id>/`에 JSON/파일로 저장(재개 가능: 산출물 있으면 스킵, `--force`로 재실행).
   - `pipeline/lib/codex.ts` — codex exec 래퍼. 텍스트/JSON: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-5.6-sol --config model_reasoning_effort="high" -o <outFile> [--output-schema <schemaFile>] "<prompt>" </dev/null 2>/dev/null` (Bun.spawn, stdin: "ignore" 필수 — 안 닫으면 무한 대기). 코드 생성 단계만 `--sandbox workspace-write --full-auto`. 이미지: `codex exec --sandbox workspace-write --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C <outDir> "Use the image_gen tool to generate: <스펙>. Save the final PNG to <절대경로>."` 후 파일 크기 >0 검증. 타임아웃(기본 15분)·1회 재시도·실패 시 명확한 에러로 중단(가짜 성공 금지).
   - `pipeline/lib/validate.ts` — 단계별 JSON 스키마 검증(수동 타입가드로 충분, 외부 의존성 추가 금지).
2. **프롬프트(방법론 인코딩)** `agents/content-factory/prompts/`:
   - `methodology.md` — market-research.md 4절 체크리스트 22항목과 품질 공식(훅·세계관·상호작용 밀도·즉각 피드백·학년 어휘·UDL/접근성)을 생성 규칙으로 서술. 모든 단계 프롬프트가 이 파일을 인라인 포함.
   - `01-plan.md` — 입력(topic/grade/subject) → 출력 JSON: 성취기준 매핑(2022 개정 교육과정 코드 추정 포함), 학습목표 2~3개, 선수지식, 오개념, 차시 구조, 콘텐츠 type 선택 근거.
   - `02-storyboard.md` — plan JSON → 씬 단위 스토리보드 JSON: `hook`(질문+비주얼 스펙), `story`(캐릭터·상황 설정), `core`(인터랙션 명세: 조작요소, 상태→피드백 규칙, 오답 교정 멘트), `quiz`(3~5문항, 즉각 피드백), `wrap`(정리+보상). 각 씬에 사용할 에셋 명세 목록 포함.
   - `03-assets.md` — 스토리보드 → 에셋 계획 JSON: **기존 공용 에셋 재사용 우선**(`public/contents/backgrounds|icons|diagrams|illustrations` 목록을 프롬프트에 주입), 부족분만 image_gen 스펙(스타일: 밝은 플랫 일러스트, 초등용, 텍스트 없는 이미지)으로. 신규 이미지는 최대 2개(썸네일 1 + 훅 비주얼 1).
   - `04-build.md` — 스토리보드+에셋 → 콘텐츠 코드 생성 지시. 계약(아래 Step 4)과 모범 사례 파일 경로를 명시.
   - `05-judge.md` — LLM 심사관: 생성물 파일들을 읽고 체크리스트 22항목별 pass/fail JSON + 미달 항목 수정 지시 반환.
3. **QA 게이트** `agents/content-factory/pipeline/stages/qa.ts` + `checklists/quality-gate.json`:
   - 정적 검사(코드로): 4파일 존재(index.html/style.css/script.js/manifest.json), manifest 스키마 12필드 + `path=/contents/{subject}/{gradeLevel}/{id}/index.html` 규칙, index.html에 `style.css` 다음 `../../../common/mobile.css` 링크 순서, 씬 5종(hook/story/core/quiz/wrap) 존재, `prefers-reduced-motion` 처리, 이미지 참조 파일 실존, 인라인 `<script src=http...>` CDN 외부 의존 금지(Three.js 등 불필요), title/학습목표 텍스트 존재.
   - LLM 심사(05-judge.md): 체크리스트 22항목 채점. fail 항목 → build 단계로 수정 지시와 함께 반송(최대 2회), 그래도 fail이면 exit 1 + 리포트.
   - 산출: `runs/<id>/qa-report.json`.
4. **콘텐츠 계약(생성물이 반드시 지킬 것)** — 04-build.md에 그대로 인코딩:
   - 산출 위치 `public/contents/<subject>/<gradeLevel>/<id>/` (gradeLevel은 elementary|middle|high).
   - EduFlixEngine **인라인** 패턴: 기존 인라인 계열 콘텐츠 1개를 모범 사례로 통째로 읽고(추천: `public/contents/math/middle/probability-coin/` 또는 `public/contents/math/elementary/volume-explorer/` — 구현 전 script.js에 `class EduFlixEngine`/`Scene`이 인라인된 계열인지 확인 후 채택) 동일한 씬 전환·`interaction.onInit(container, engine)` 계약 준수.
   - style.css: `:root` CSS 변수(`--ease-spring`, `--primary-color`, `--bg-color`, `--text-color`), scene framework(#scene-container max-width 800px 등), 공용 배경 이미지 사용 가능.
   - manifest.json: `{id,title,subject,gradeLevel,grade,type,language,description,path,thumbnail}` (+repo-map의 12필드 기준 확인). thumbnail은 생성 PNG 상대경로.
   - 모바일: 터치 타겟 44px+, clamp() 폰트. 접근성: 시맨틱 태그, 대비.
5. **퍼블리시** `pipeline/stages/publish.ts`: `public/contents/index.json` 읽기 → `{version, lastUpdated, contents[]}` 래퍼 유지 → 중복 id면 에러(덮어쓰기 금지, `--force`시만 교체), 아니면 push → 저장. 기존 79개 항목 바이트 수준 보존(추가만).
6. **package.json**: scripts에 `"factory": "bun agents/content-factory/pipeline/run.ts"` 1줄 추가 (다른 변경 금지).
7. **스모크 검증(빌더 범위)**: 파이프라인 E2E 실행은 하지 말 것(코덱스 중첩 호출·시간 이슈, Verify 단계 담당). 대신 (a) `bun run factory -- --help` 동작, (b) `bun build --no-bundle` 수준 타입 오류 없음 또는 `bunx tsc --noEmit`가 신설 파일에서 에러 0, (c) qa.ts 정적 검사를 기존 콘텐츠 1개에 적용해 동작 확인(`--stage qa --id <기존id>` 같은 개발용 경로 허용), (d) `bun run build` 여전히 성공.
8. **문서**: `agents/content-factory/README.md` — 사용법, 단계 다이어그램, 방법론 출처(리서치 파일 링크). 한국어.

## Tools & Skills

- 런타임: Bun 1.x (`bun run`, `Bun.spawn`). 외부 npm 의존성 추가 금지(레포 기존 의존성만).
- 생성 엔진: codex CLI 0.144.0 (`gpt-5.6-sol`, `model_reasoning_effort=high`), `~/.codex/auth.json` 구독 인증 확인됨. **주의**: `codex exec`는 stdin을 안 닫으면 영원히 블록 — 항상 stdin ignore/`</dev/null`.
- 검증: `bun run build`(vite), `bun run test`(vitest; 기존 실패 67개는 베이스라인), playwright-cli(Verify 단계).
- UI 품질 기준: `/Users/chaeseong-gug/.claude/skills/supergoal/reference/taste-skill-v2.md` (04-build.md 프롬프트에 핵심 규칙 요약 반영: 안티-디폴트, 대비, reduced-motion, 접근성).

## Verification strategy

- Before proof: QA.md `## Before` — factory CLI 부재, 빌드 green, 테스트 210 pass 기준선, index.json 79개 스냅샷.
- Step → GOAL.md criterion: Step1-2→SC2·SC3, lib/codex.ts 이미지→SC4, Step3→SC6, Step4→SC5, Step5→SC7(무손상)+SC3, Step6→SC3, Step7→SC7.
- Trusted commands: `bun run build`, `bun run test` (frozen_repo); `bun run factory -- --topic "선대칭과 점대칭" --grade elementary-5 --subject math` (신설 후 frozen_repo); index.json diff vs `qa/index.json.before`, playwright-cli 캡처 (evaluator_owned).

## Grounding ledger

- "에듀템/아이스캔디 정체?" → market-research.md 1절: 에듀템=AI 음성·발음평가 B2B 벤더, 아이스캔디=HTML5/애니메이션/게임 외주 스튜디오(icecandy.tv) → 방법론은 "발행사 기획+스튜디오 구현" 분업 전체를 파이프라인 단계로 흡수.
- "업계 공통 제작 파이프라인?" → market-research.md 3절: ADDIE 8단계(성취기준 매핑→차시 설계→원고→스토리보드 선승인→에셋→HTML5 개발→교사 검수→배포) → 5-Stage AI 체인(기획→스토리보드→에셋→빌드→QA게이트)으로 인코딩.
- "품질 기준?" → market-research.md 4절 체크리스트 22항목 → methodology.md + quality-gate.json + 05-judge.md.
- "기존 생성 경로 처리?" → repo-map.md: /api/generate는 외부 art-assets 서버 위임(로컬에 서버 없음), 프롬프트 파일은 사실상 사장 → 독립 CLI 신설, 기존 경로 불변 (GOAL d3).
- "콘텐츠 런타임 선택?" → repo-map.md: 인라인 EduFlixEngine 계열 15개가 표준 계약 → 채택. common/engine.js 직접 링크는 0개(원본 역할만).
- "엔진/키?" → .env에 키 0건, codex 구독 인증 OK, `ENGINE_OK` 스모크 통과 → codex 단일 엔진 (GOAL d2).
- "PoC 주제?" → 카탈로그 79개에 대칭 콘텐츠 부재 → "선대칭과 점대칭"(elementary-5, math, simulation) (GOAL d1).
