# Exact Verify Report - AI 콘텐츠 팩토리

## 판정

**BUILDER SMOKE PASS / PRODUCT ACCEPTANCE PENDING.** 신규 팩토리의 CLI 진입, TypeScript 변환·타입 검사, 정적 QA fail 경로, 21개 단위 테스트, 기존 앱 빌드와 보존 계약은 실제 명령으로 확인했다. 실제 Codex 전체 파이프라인과 PoC·브라우저는 PLAN Step 7 금지 범위라 실행하지 않았다.

## 검증 이론과 범위

이 구현이 모델링하는 실제 활동은 교육 콘텐츠 제작의 기획→스토리보드 승인→에셋→HTML5 개발→교사 관점 QA→발행 흐름이다. 이번 검증 목표는 생성 작업 자체가 아니라 이 흐름을 실행할 CLI와 계약 검사가 연결되고, 기존 EduFlix가 손상되지 않았음을 확인하는 것이다.

- 영향 영역: `agents/content-factory/`, `package.json` scripts, 검증 문서.
- 기대 결과: 비-E2E smoke green, 기존 `src/`, `server/`, `public/` 불변, Q01~Q22 추적 가능.
- 제외: 중첩 `codex exec`, image_gen, 전체 파이프라인, PoC 생성·퍼블리시, 브라우저/Playwright.
- 실행 조건: 2026-07-13 KST, 저장소 루트, shell `login=false`, 각 명령 60초 이내.

## 실제 명령과 결과

### 1. CLI 도움말

`bun run factory -- --help`

- Exit: 0
- 핵심 출력: `AI 콘텐츠 팩토리`; topic/grade/subject 필수 인자; type/id/skip-images/stage/force/help 옵션; `--stage qa --id <기존 콘텐츠 id>` 개발 경로.

### 2. 신설 TypeScript 검사

`bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-exact-verify-run.js`

- Exit: 0
- 핵심 출력: `Transpiled file in 26ms`, 7.84 KB.

`bunx tsc --noEmit --pretty false`

- Exit: 0
- 핵심 출력: 없음. 타입 오류 0.

### 3. 기존 콘텐츠 정적 QA

`bun run factory -- --stage qa --id volume-explorer`

- Exit: 1
- 검사기 상태: **정상**. 중첩 Codex 호출 없이 정적 검사만 실행했고 `agents/content-factory/runs/volume-explorer/qa-report.json`을 새로 기록했다.
- 콘텐츠 상태: **신규 계약 미달**. exit 1은 검사기 작동 실패가 아니라 fail-closed 위반 검출이다.
- 9개 검사: 4 pass / 5 fail.
  - pass: 필수 파일 4종, CSS 링크 순서, 5개 scene, 이미지 파일.
  - fail: manifest 12필드(`createdAt`, `tags`, 현재 10필드), manifest path 판정 불가, reduced-motion 부재, 외부 CDN script, 학습목표 텍스트 부재.
- 리포트: `passed=false`, errors 7개, artifact digest 5개, 실제 콘텐츠 경로 기록.

### 4. 팩토리 전체 단위 테스트

`bun test agents/content-factory/pipeline/lib/*.test.ts agents/content-factory/pipeline/stages/*.test.ts`

- Exit: 0
- 핵심 출력: 6 files, 21 pass, 0 fail, 51 `expect()` calls, 4.95s.
- 포함 파일: `codex.test.ts`, `validate.test.ts`, `build.test.ts`, `common.test.ts`, `publish.test.ts`, `qa.test.ts`.

### 5. 기존 앱 빌드

`bun run build`

- Exit: 0
- 핵심 출력: `vue-tsc -b && vite build`, 137 modules transformed, `built in 5.57s`.

### 6. 보존 계약

`git diff --exit-code -- src server public`

- Exit: 0
- 결과: 기존 추적 파일 변경 없음.

`cmp -s public/contents/index.json docs/changelog/2026-07/13-ai-content-factory/qa/index.json.before`

- Exit: 0
- 결과: 바이트 동일. 양쪽 SHA-256 `ce4afc282fd49f29af0f43099d51ace4fc2c50548d6529b2c78ef389f8dff661`; 79개 항목 유지.

`git diff -- package.json`

- Exit: 0
- 결과: scripts 마지막에 쉼표와 `"factory": "bun agents/content-factory/pipeline/run.ts"` 한 줄만 추가. dependency와 기존 script 변경 없음.

## Q01~Q22 추적성

| 출처/소비자 | 확인 결과 |
|---|---|
| `research/market-research.md` 4절 | 도입·세계관·상호작용·피드백·학년·접근성·구조의 22개 원본 항목 |
| `prompts/methodology.md` | Q01~Q22를 같은 순서와 의미로 명시 |
| `checklists/quality-gate.json` | 22개, unique 22개, first Q01, last Q22; 각 항목에 category/name/description/evidence |
| `pipeline/stages/common.ts` | `readPrompt()`가 방법론 원문을 각 단계 프롬프트 앞에 인라인 |
| `prompts/01-plan.md`~`05-judge.md` | 모든 단계가 방법론 적용을 선언 |
| `prompts/05-judge.md` | Q01~Q22를 JSON 순서대로 정확히 한 번씩 판정, 하나라도 fail이면 전체 fail |
| `pipeline/stages/qa.ts` | 정적 검사 후 quality-gate 경로와 결과를 judge 입력에 전달 |

결론: Q01~Q22 ID는 누락·중복 없이 1:1 대응한다. 브라우저 증거가 필요한 Q19/Q21을 실제로 통과했는지는 이번 범위에서 판정하지 않았다.

## 신설 파일 목록

`agents/content-factory/` 비-run 파일 24개:

- 문서/설정: `README.md`, `checklists/quality-gate.json`.
- 파이프라인 진입: `pipeline/run.ts`.
- 라이브러리: `pipeline/lib/codex.ts`, `pipeline/lib/validate.ts`.
- 단계: `pipeline/stages/assets.ts`, `build.ts`, `common.ts`, `plan.ts`, `publish.ts`, `qa.ts`, `storyboard.ts`.
- 테스트: `pipeline/lib/codex.test.ts`, `validate.test.ts`, `pipeline/stages/build.test.ts`, `common.test.ts`, `publish.test.ts`, `qa.test.ts`.
- 프롬프트: `prompts/methodology.md`, `01-plan.md`, `02-storyboard.md`, `03-assets.md`, `04-build.md`, `05-judge.md`.

검증 실행 산출물:

- `agents/content-factory/runs/volume-explorer/qa-report.json`.

검증/설계 기록:

- `docs/changelog/2026-07/13-ai-content-factory/GOAL.md`, `PLAN.md`, `QA.md`, `exact-verify-report.md`.
- `research/market-research.md`, `research/repo-map.md`, `qa/index.json.before`.
- 기존 구현자 보고서 5개와 `run-state.json`은 파일 존재만 확인했으며 Exact Verify 판정 근거 대신 실제 명령 출력을 사용했다.

## Backward trace와 잔여 위험

| 기준 | 상태 | 근거/미검증 이유 |
|---|---|---|
| SC1 | 증명 | 리서치 파일과 8단계 표·22항목 직접 확인 |
| SC2 | 증명 | Q01~Q22 22/22 고유 매핑과 공통 프롬프트 인라인 확인 |
| SC3 | 미증명 | help만 확인; 전체 단계 한 명령 exit 0 미실행 |
| SC4 | 미증명 | image_gen/PNG 미실행 |
| SC5 | 미증명 | PoC 4파일·런타임·브라우저 미실행 |
| SC6 | 부분 | 정적 검사 fail 경로 정상; PoC+LLM 게이트 pass 미실행 |
| SC7 | 부분 | build, factory tests, 파일/index 보존 확인; 전체 저장소 After 테스트 비교 미실행 |
| SC8 | 미증명 | 브라우저 open 미실행 |
| SC9, QA1~QA4 | 미증명 | Playwright 및 캡처 미실행 |

SC3~SC9는 완료 체크하지 않았다. 제품 수용 판정에는 실제 전체 파이프라인 1회, 이미지·PoC·카탈로그 확인, 전체 저장소 테스트 비교, 브라우저 QA가 추가로 필요하다.
