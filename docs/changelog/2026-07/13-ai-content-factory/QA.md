# QA - AI 콘텐츠 팩토리

## Before

LEGACY preserve-baseline (run worktree `run/ai-content-factory` @ 990ac03, base=dev):

- `bun install`: OK (242 packages)
- `bun run build`: **성공** (vite build 5.13s, dist/ 산출) — 보존 대상
- `bun run test`: **기존 실패 존재** — 2 test files failed / 16 passed, 67 tests failed / 210 passed (277)
  - 실패 파일(기존, 이번 변경과 무관): `tests/unit/content-catalog.test.ts`, `tests/unit/content-loader.test.ts`
  - After 기준: 통과 210개 유지(감소 금지), 실패는 기존 67개에서 증가 금지
- `public/contents/index.json`: dict 래퍼, **79개 콘텐츠 항목** — 스냅샷 `qa/index.json.before` (After에서 diff: 추가만 허용, 기존 항목 무손상)
- 콘텐츠 팩토리 CLI: **부재** (package.json에 factory 스크립트 없음, `agents/content-factory/` 없음) — GREENFIELD 요소의 red 시작점
- codex CLI: codex-cli 0.144.0, 기본 모델 `gpt-5.6-sol`, reasoning high, auth.json 존재(구독 인증)
- `.env`: ANTHROPIC/GEMINI/OPENAI API 키 모두 부재(0건) → 기존 /api/generate 경로는 키 없이는 실행 불가 (기존 상태 그대로 보존)

## Reproduction Fidelity

Fidelity level: exact

DEBUG 모드가 아니므로 재현 대상 프로덕션 증상 없음(LEGACY 신규 기능). 검증은 실제 명령·실제 브라우저에서 exact로 수행.

## Commands

| Command | Source | 용도 |
|---|---|---|
| `bun run build` | frozen_repo | 기존 앱 빌드 보존 증명 |
| `bun run test` | frozen_repo | 기존 테스트 수준 보존 (210 pass 기준선) |
| `bun run factory -- ...` (신설 예정) | agent_detected → 신설 후 frozen_repo | 파이프라인 E2E 실행 |
| `diff <(jq ...) qa/index.json.before` | evaluator_owned | 카탈로그 무손상 검증 |
| playwright-cli PoC 캡처 | evaluator_owned | SC9/QA1-4 브라우저 증빙 |
| `bun test agents/content-factory/pipeline/lib/validate.test.ts agents/content-factory/pipeline/stages/publish.test.ts` | agent_detected | full-spec 계약·가짜 성공 경로 회귀 검사 |
| `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-full-spec/run.js` | agent_detected | 신설 CLI import·구문 변환 검사 |
| `bun run factory -- --stage qa --id volume-explorer` | agent_detected | 기존 콘텐츠 정적 QA 전용 경로(중첩 Codex 없음) 검사 |
| `bun test agents/content-factory/pipeline/lib/codex.test.ts agents/content-factory/pipeline/lib/validate.test.ts agents/content-factory/pipeline/stages/common.test.ts agents/content-factory/pipeline/stages/qa.test.ts agents/content-factory/pipeline/stages/publish.test.ts` | agent_detected | 경로 이탈·stale 출력·QA 일관성·카탈로그 손상/동시성 회귀 검사 |
| `bun test agents/content-factory/pipeline/lib/*.test.ts agents/content-factory/pipeline/stages/*.test.ts` | agent_detected | H1/H2/H3 및 grounded M1/M2 회귀 검사(21 pass) |
| `bun build agents/content-factory/pipeline/run.ts --outdir /tmp/factory-check --target bun && bunx tsc --noEmit --pretty false` | agent_detected | 팩토리 트랜스파일·저장소 타입 검사 |
| `bun test agents/content-factory --silent` | agent_detected | fresh-context edge-case 전체 회귀 검사 |
| `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-edge-run.js` | agent_detected | edge-case 수정 후 CLI 트랜스파일 검사 |
| `bunx tsc --noEmit --pretty false && bun test agents/content-factory --silent` | agent_detected | Codex 출력 스키마·validator 정합 및 전체 팩토리 회귀 검사 |

## Results

Exact Verify 재실행: 2026-07-13 KST. 명령은 저장소 루트에서 `login=false`, 명령당 60초 이내로 수행했다.

| 검증 | Exit | 결과 |
|---|---:|---|
| `bun run factory -- --help` | 0 | 사용법, 필수 인자, 7개 옵션, 기존 콘텐츠 QA 개발 경로 출력 |
| `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-exact-verify-run.js` | 0 | 26ms, 7.84 KB 트랜스파일 |
| `bunx tsc --noEmit --pretty false` | 0 | 출력 없음, 저장소 타입 오류 0 |
| `bun run factory -- --stage qa --id volume-explorer` | 1 | 검사기 정상 실행 및 `qa-report.json` 생성. 기존 콘텐츠가 새 계약 5개 검사에서 미달해 의도대로 실패 |
| `bun test agents/content-factory/pipeline/lib/*.test.ts agents/content-factory/pipeline/stages/*.test.ts` | 0 | 6개 파일, 21 pass, 0 fail, 51 assertions, 4.95s |
| `bun run build` | 0 | `vue-tsc -b && vite build`, 137 modules, vite 5.57s |
| `git diff --exit-code -- src server public` | 0 | 기존 추적 파일 변경 없음 |
| `cmp -s public/contents/index.json docs/changelog/2026-07/13-ai-content-factory/qa/index.json.before` | 0 | 바이트 동일, SHA-256 `ce4afc282fd49f29af0f43099d51ace4fc2c50548d6529b2c78ef389f8dff661`, 79개 유지 |

`volume-explorer`의 정적 QA 상세: 9개 검사 중 4 pass(`required-files`, `stylesheet-order`, `five-scenes`, `image-files`), 5 fail(`manifest-schema`, `manifest-path`, `reduced-motion`, `no-external-script`, `learning-text`). 실패 원인은 기존 콘텐츠가 `createdAt`/`tags` 포함 12필드 manifest, reduced-motion, 외부 CDN 금지, 학습목표 텍스트라는 신규 생성 계약을 만족하지 않기 때문이다. 이는 검사기 고장이 아니라 위반 검출 증거다. 중첩 Codex 호출은 없었다.

변경 범위: `package.json`은 `factory` script 한 줄만 추가됐다. `agents/content-factory/`에는 실행·단계 코드 10개, 테스트 6개, 프롬프트 6개, 체크리스트/README 2개로 총 24개 비-run 파일이 있다. 실행 증거로 `runs/volume-explorer/qa-report.json` 1개가 갱신됐다. 전체 목록과 원출력 요약은 `exact-verify-report.md`에 기록했다.

방법론 추적성: 리서치 4절 22개 항목이 `methodology.md`의 Q01~Q22, `quality-gate.json`의 22개 고유 ID, `05-judge.md`의 정확히 한 번씩 판정 계약으로 연결된다. `readPrompt()`가 모든 단계 프롬프트 앞에 방법론 원문을 인라인한다.

## Residual Risk

- PLAN Step 7 금지 조건에 따라 실제 `codex exec` 전체 파이프라인, 이미지 생성, PoC 생성/퍼블리시, 브라우저/Playwright는 실행하지 않았다.
- 따라서 단일 명령 무인 완주, 생성 PNG 참조, PoC 4파일·scene 런타임, LLM 22항목 심사 통과, 카탈로그 추가, 브라우저 상호작용은 미검증이다.
- `volume-explorer`는 새 생성 계약의 적합성 표본이 아니며 검사기의 fail 경로만 증명한다.
- 전체 저장소 `bun run test`는 이번 Exact Verify에서 새로 실행하지 않았다. SC7 전체 판정에는 Before의 210 pass/67 fail 기준선과 After 전체 테스트 비교가 별도로 필요하다.

## Backward-trace

- SC1: **증명** — 리서치 보고서의 업체 규명, 8단계 제작 표, Q01~Q22 확인.
- SC2: **증명** — 리서치 Q01~Q22가 방법론·JSON 게이트·judge 계약에 22/22 고유 ID로 대응.
- SC3: **미증명** — `--help`와 타입 검사만 통과; 단일 명령 전체 단계 exit 0 미실행.
- SC4: **미증명** — image_gen 및 PNG 산출 미실행.
- SC5: **미증명** — PoC 미생성, 브라우저 로드 미실행.
- SC6: **부분 증명** — 정적 QA의 pass/fail·리포트 생성은 확인; PoC 정적+LLM 게이트 exit 0은 미실행.
- SC7: **부분 증명** — build, factory 단위 테스트, 기존 `src/server/public`, 79개 index 바이트 보존 확인; 전체 저장소 테스트 After 비교 미실행.
- SC8: **미증명** — 브라우저 open 금지/미실행.
- SC9 및 QA1~QA4: **미증명** — Playwright 금지/미실행.

(위 Backward-trace와 Verdict는 빌더 시점 기록 — 최종 판정은 아래 "Exact Verify 최종" 참조)

## Results — Exact Verify 최종 (2026-07-13, 컨덕터+QA 에이전트)

- [x] E2E 완주: `bun run factory -- --topic "선대칭과 점대칭" --grade elementary-5 --subject math --type simulation --id line-point-symmetry` → 전 단계(plan→storyboard→assets→build→qa→publish) 완료, FACTORY_EXIT=0 (Monitor 스트림 증빙). R-LOOP 3건(빌드 타임아웃 40분 상향, 4단계 output-schema 강제, 숨김 도구 아티팩트 허용) 해소 후 완주.
- [x] 이미지: codex image_gen이 thumbnail.png(1.9MB) 생성, index.html에서 참조, 브라우저에서 200 로드.
- [x] PoC 산출물: manifest 12필드 스키마·경로 규칙 통과, 씬 5종(hook/story/core/quiz/wrap) 존재, 제목 "도리와 대칭 박물관 복원 작전"(스토리·캐릭터 세계관 반영).
- [x] QA 게이트: qa-report.json passed:true (정적 9검사 + LLM 22항목 심사). 데스크톱 CSS 수정 후 재실행도 exit 0.
- [x] 카탈로그: index.json 79→80, 추가는 line-point-symmetry 1건뿐, 기존 79개 항목 동일성 True.
- [x] 기존 동작 보존: `bun run build` 성공(1.63s), `bun run test` 210 pass/67 fail — Before 베이스라인과 정확히 동일(회귀 0).
- [x] 브라우저 QA(playwright): QA1 hook 렌더 PASS, QA2 씬 전환 PASS, QA3 인터랙션 상태변화 PASS, QA4 자산 8건 전부 200·JS 에러 0건 PASS. 증빙 `qa/poc-*.png` 7장 + `qa/browser-qa-report.md`.
- [x] 발견 결함 1건 수정·재검증: 데스크톱(≥1024px)에서 공유 mobile.css `!important`가 hook padding을 덮어 썸네일이 질문을 가림 → 콘텐츠 style.css에 고특이도 재정의 추가 + 04-build.md에 재발 방지 규칙 인코딩 → 1280x900 재검증 PASS, 390px 회귀 없음.
- [x] 브라우저 오픈: `open file:///...line-point-symmetry/index.html` 실행 OK.

## Residual Risk (최종)

- 파이프라인 QA는 정적+LLM 심사 2계층 — 리서치 제언의 헤드리스 브라우저 스모크 계층은 미구현(이번 PoC는 별도 playwright QA로 보완). 향후 콘텐츠 자동 생성 시 브라우저 검증은 수동/별도.
- 한글 topic 자동 슬러그가 무의미 id(`content-xxxxx`)로 떨어질 수 있음 — `--id` 명시 권장 (R-LOOP 1차 기록).
- server/ 측 index.json writer와 팩토리 publish 락 미통합 (d6, server/ 동결 범위).
- thumbnail.png 1.9MB — 이미지 최적화(압축/리사이즈) 단계 없음.
- E2E 1회 소요 30~60분(코드 생성 codex 호출이 지배적)·codex 구독 사용량 소모.
- 기존 테스트 67개 실패는 dev 베이스 기존 문제(content-catalog/content-loader) — 본 변경과 무관, 미수정.
- 7일째 떠 있는 세션 무관 codex 고아 프로세스 2개(PID 13575, 64922) 발견 — 본 런과 무관하여 건드리지 않음, 사용자 확인 필요.

## Backward-trace (최종)

diff 전 범위 → 기준 대응: agents/content-factory/*(SC2·SC3·SC6), package.json factory 스크립트(SC3), public/contents/math/elementary/line-point-symmetry/(SC4·SC5·SC9), public/contents/index.json +1(SC3·SC7), docs/changelog/2026-07/13-ai-content-factory/(런볼트·증빙). 고아 diff 없음.

Backward-trace: clean

## QA

- Tool: playwright-cli (QA 에이전트 구동; vite 5199, 고정 라우트 `/contents/math/elementary/line-point-symmetry/index.html`)
- UI-tier: Expressive
- 뷰포트: 1280x900(데스크톱), 390x844(모바일) 고정 캡처
- as-is: `qa/as-is-content-absent.txt` — Before 카탈로그(79항목)와 파일시스템에 PoC 부재 증명
- to-be: `qa/to-be-poc-hook-desktop.png`(hook 렌더·겹침 수정 후), `qa/to-be-poc-interaction.png`(core 인터랙션 상태 변화), `qa/to-be-poc-assets.png`(자산 8건 200 로드)
- 상세 판정: `qa/browser-qa-report.md` (QA1~4 PASS + 데스크톱 수정 재검증 PASS, 모바일 회귀 없음)
- 대비: `qa/contrast-pairs.json` — style.css 실사용 텍스트/배경 쌍 14개 열거, contrast-gate.mjs 계산 통과 여부는 커밋 게이트 출력 참조

Verdict: **PASS** — GOAL SC1~SC9 및 QA1~4 전부 검증 완료 (2026-07-13, run/ai-content-factory).

## Improve edge cases 재검증 (2026-07-13 KST)

- `bun test agents/content-factory --silent`: 46 pass, 0 fail, 109 assertions.
- `bun run factory -- --help`: exit 0.
- `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-edge-run.js`: exit 0.
- `bunx tsc --noEmit --pretty false`: exit 0, 출력 없음.
- `git status --short -- src server public/contents public/contents/index.json`: 출력 없음.
- 상세 red-green 근거와 ASK-USER/잔여 위험: `fresh-context-edge-cases-report.md`.

## Improve full spec 재검증 (2026-07-13 KST)

- 결정: Codex Structured Outputs의 객체 계약(`additionalProperties: false`, 모든 속성 `required`)에 맞춰 judge의 `fix`를 항상 존재하는 문자열로 통일했다. `pass`는 `해당 없음`, `fail`은 최소 수정 지시다.
- 정합: plan/judge 프롬프트 예시에서 스키마가 금지하는 필드를 제거했다. 네 단계 `schemaFile` 연결과 `validateOutput` 사후 검증은 유지했다.
- 캐시: plan/storyboard/assets의 `shouldRunStage` 입력 객체와 메타데이터 해시 입력은 변경하지 않았다. 스키마 파일은 입력 해시에 포함되지 않는다.
- `bunx tsc --noEmit && bun test agents/content-factory --silent`: exit 0, 57 pass, 0 fail, 452 assertions.
- `git status --short -- src server public/contents public/contents/index.json`: 출력 없음.
