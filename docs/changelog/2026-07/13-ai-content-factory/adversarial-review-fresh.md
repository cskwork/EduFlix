# Fresh-context 적대적 리뷰 (2차)

- 리뷰어: fresh-context adversarial reviewer, 2026-07-13
- 대상: 워크트리 `run/ai-content-factory` (`package.json` 1줄 + `agents/content-factory/` 신설, `docs/changelog/2026-07/`)
- 임무: "변경이 완전하다" 주장의 반증. 소스 무수정(본 보고서 1개만 작성).
- 방법: GOAL/PLAN/QA/repo-map 재독 → 전체 코드·프롬프트·테스트 정독 → 빌더/개선자/프로브 보고서와 코드 대조 → 검증 명령 재실행 및 신규 반증 실험(아래 "직접 실행한 검증").

## 총평

구현·단위검증 품질은 높다. 개선자 보고서 3종(build-report, fresh-context-full-spec-report, fresh-context-edge-cases-report)의 주장은 코드와 전부 일치함을 확인했다(허위 주장 없음). 그러나 **"완전함"은 반증된다**: 원요청의 최종 산출물(PoC 1개 + 이미지 + 브라우저 오픈)이 아직 존재하지 않고(SC3~SC9 미체크, QA.md 스스로 PENDING 판정), 그 미실행 E2E 경로 위에 코드 근거가 있는 예정 실패 지점 4건(MAJOR)이 남아 있다.

---

## [BLOCKER] B1 — 원요청 산출물 부재: 파이프라인 E2E 미실행, SC3~SC9 전부 미증명

- 근거: `GOAL.md:25-31` SC3~SC9 unchecked, `GOAL.md:37-40` QA1~QA4 unchecked. `QA.md:62-79` "SC3~SC9는 체크하지 않는다 / BUILDER SMOKE PASS / PRODUCT ACCEPTANCE PENDING". `git status`: `public/contents/`에 신규 콘텐츠 폴더 0개, `index.json` 바이트 동일(직접 `cmp` 재확인).
- 반증 시나리오: 사용자 원요청 "완료되면 1개 poc로 html로 만들어서 열어줘"(GOAL Original Request) 기준으로, 현재 diff에는 열 수 있는 PoC HTML 자체가 없다. codex 실호출 경로(`runCodexText`/`runCodexImage`)는 단 한 번도 실행 증거가 없다(전 테스트가 PATH 주입 가짜 codex).
- 권장 라우팅: **Verify 단계에서 `bun run factory -- --topic "선대칭과 점대칭" --grade elementary-5 --subject math` 1회 완주가 선행되어야 함**. 완주 전에는 어떤 보고서도 "완전"을 주장할 수 없다. (아래 M1~M4를 먼저 처리하지 않으면 이 실행이 실패할 확률이 유의미함)

---

## MAJOR — 미실행 E2E 경로의 예정 실패 지점 / 계약 구멍

### [MAJOR] M1 — manifest `grade` 형식이 파이프라인 어디에서도 검증되지 않음 (카탈로그 계약 위반 통로)

- 근거: `agents/content-factory/pipeline/lib/validate.ts:398-400` — `grade`는 "비어 있지 않은 문자열 **또는 숫자**"만 요구, 형식 검사 없음. `publish.ts:228`은 `entry.id !== context.id`만 교차검증하고 grade는 안 봄. `qa.ts:263-274` manifest-path 검사는 subject/gradeLevel/id만 디렉터리와 정합 강제.
- 직접 재현(실행함): `validateManifest({...grade: 5})` → **valid=true**, `validateManifest({...grade: "5학년"})` → **valid=true**. 즉 codex가 `"grade": 5`를 쓰면 QA 게이트·퍼블리시 모두 통과해 index.json에 등록된다.
- 계약 위반: repo-map 2-4(`grade: Grade` = `'elementary-1'..'high-3'` 문자열), 기존 79개 항목 전부 문자열(실측). 루트 CLAUDE.md manifest 스키마와도 불일치. CLI는 `--grade`를 정규식으로 검증(run.ts:110)하면서 정작 산출물의 grade는 방치 — 파이프라인이 이미 알고 있는 `context.grade`와 대조하지 않는 비대칭.
- 반증 시나리오: PoC 실행 → codex가 grade를 숫자/자유 문자열로 기입 → 게이트 통과 → 카탈로그에 계약 위반 항목 추가(SC5의 "manifest 스키마 준수" 실패인데 게이트는 green).
- 권장 라우팅: improve-full-spec — `validateManifest`에 grade 정규식 추가 + publish에서 `entry.grade === context.grade` 교차검증(1~2줄).

### [MAJOR] M2 — 04-build 프롬프트와 build 스테이징 검사의 자기모순: 이미지 쓰면 즉사

- 근거: `agents/content-factory/prompts/04-build.md:16` — "파일: index.html, style.css, script.js, manifest.json 정확히 네 핵심 파일**과 계획된 로컬 이미지만 생성한다**" (이미지 생성을 허용하는 문장). 반면 `build.ts:99-103`은 스테이징 디렉터리 최상위에 4개 필수 파일 외 **어떤 항목이라도 있으면** "허용되지 않은 빌드 산출물"로 즉시 실패시키고, 이 검사는 `runCodexText` 재시도 경계 **밖**이라 재시도 없이 파이프라인이 exit 1로 죽는다.
- 반증 시나리오: build 단계에서 모델이 프롬프트 문장을 따르며 thumbnail.png/hook-visual.png를 스테이징에 복사(상대경로 검증 목적의 자연스러운 행동) → `허용되지 않은 빌드 산출물: thumbnail.png` → 전체 무인 실행 실패. 이미지들은 assets 단계가 이미 `contentDir`에 두었으므로 스테이징 복사는 불필요한데, 프롬프트가 그 사실을 명시하지 않고 오히려 생성을 허용한다.
- 권장 라우팅: improve-full-spec — 04-build.md 문구를 "이미지 파일은 이미 최종 디렉터리에 있으니 절대 새로 만들거나 복사하지 말 것, 출력 디렉터리에는 4개 파일만"으로 정정(코드 무수정 1줄 대안: 스테이징에서 계획된 이미지 파일명 허용 후 무시).

### [MAJOR] M3 — LLM 심사관 계약 모순: Q21은 정적 입력만으로는 영구 fail 가능

- 근거: `prompts/05-judge.md:7` — 판정 근거를 plan/storyboard/assetPlan/4파일/정적검사 결과로 **한정**. `05-judge.md:13` — "실행 시 확인이 필요한데 증명되지 않았으면 fail이다". 그런데 `checklists/quality-gate.json` Q21의 evidence는 "**브라우저 오류와 입력 스모크**"(Q19도 "모바일 렌더")로, 심사관 입력에 존재할 수 없는 증거를 요구하며 `required: true` + passRule "Q01~Q22 모두 pass".
- 반증 시나리오: 지시를 엄격히 따르는 심사관은 Q21을 매번 fail → `qa.ts:376-411` 3회 시도 소진 → exit 1. 반대로 통과시키는 심사관은 자기 지시("증명되지 않았으면 fail")를 위반한 것. 어느 쪽이든 게이트의 판정 이론이 비결정적이며, "완전 자동화" 완주가 심사관의 규칙 위반 관대함에 의존한다.
- 권장 라우팅: improve-full-spec — Q19/Q21 evidence를 정적으로 판정 가능한 형태("코드 검토: 오류 없는 이벤트 바인딩, pointer/touch 겸용 처리, CSS 크기 선언")로 재정의하거나, 브라우저 항목을 SC9 playwright 단계 소관으로 이관(decision-gate 병기).

### [MAJOR] M4 — SC4("HTML에서 참조됨")를 파이프라인이 보장하지 않음

- 근거: GOAL.md:26 SC4 verify = "PNG 존재 + **grep 참조 확인**(HTML)". 파이프라인이 강제하는 생성 이미지는 `thumbnail.png` 하나뿐이고(`stages/assets.ts:41-43`), hook-visual.png는 선택(1~2개, `03-assets.md:22`). QA의 사용 검사(`qa.ts:142-163`)는 **manifest.thumbnail 참조만으로 "사용됨"으로 인정**한다.
- 반증 시나리오: PoC에서 모델이 hook 비주얼을 CSS/재사용 에셋으로 해결(프롬프트가 권장하는 방향) → 생성 PNG는 thumbnail.png 1개, HTML/CSS에는 참조 없음, manifest에만 참조 → QA 게이트 green → SC4 검증(HTML grep) 실패. 게이트가 SC와 다른 것을 증명하는 전형적 검증 이론의 구멍.
- 권장 라우팅: decision-gate — SC4 판정을 "HTML 또는 manifest 참조"로 완화할지, hook-visual.png 생성을 기본 강제할지 결정 후 improve-full-spec 반영.

---

## MINOR

### [MINOR] N1 — assets 단계 thumbnail 요구가 codex 재시도 경계 밖 + 메타 기록 후 검사라 wedge 발생

- 근거: `stages/assets.ts:20-27`의 validateOutput은 `stageOutputValidationError("assets")`만 수행(=`validate.ts:207` generated 빈 배열 허용). thumbnail.png 요구는 `assets.ts:41-43`에서 **메타데이터 기록(assets.ts:33) 이후** 검사. 실패 시 재실행해도 digest가 일치해 같은 assets.json을 재사용(`shouldRunStage`) → `--force` 없이는 동일 에러 반복(무인 재시도 불가).
- 라우팅: improve-edge — thumbnail 요구를 validateOutput에 포함해 codex 1회 재시도를 활용하고, 실패 시 메타를 남기지 않기.

### [MINOR] N2 — QA.md/exact-verify-report의 volume-explorer 상세가 최종 코드 기준으로 stale

- 근거: `QA.md:54` "9개 검사 중 4 pass, 5 fail" 및 `runs/volume-explorer/qa-report.json`(9개 체크)은 edge 개선(engine-contract 추가, `qa.ts:44-47` STATIC_CHECK_IDS=10) 이전 스냅샷. 직접 재실행 결과 현재는 **10개 검사, 5 pass/5 fail**(engine-contract pass 추가). 퍼블리시 게이트는 10개를 요구(`assertQaPassed`)하므로 기능 위험은 없으나 기록이 코드와 어긋난다.
- 라우팅: 문서 갱신(exact-verify 재실행 시 자동 해소).

### [MINOR] N3 — `agents/content-factory/runs/`가 .gitignore 미등록

- 근거: 루트 `.gitignore`에 해당 항목 없음. `runs/volume-explorer/qa-report.json`이 이미 untracked로 존재하며, 실제 파이프라인 실행 시 plan/storyboard/assets JSON, qa-judge-N.json, build-backup/staging 잔재까지 커밋 후보가 된다.
- 라우팅: improve-edge — `.gitignore`에 `agents/content-factory/runs/` 1줄.

### [MINOR] N4 — 02-storyboard 프롬프트에 choices 최소 2개 미명시

- 근거: `validate.ts:177` `choices.length >= 2` 강제, `02-storyboard.md` 예시는 choices 1개(64행)이고 본문에 최소 개수 언급 없음. 모델이 자연히 3~4지선다를 내겠지만 계약을 프롬프트에 못 박지 않은 스키마-프롬프트 비대칭.
- 라우팅: improve-full-spec — 프롬프트 말미 1줄.

### [MINOR] N5 — GOAL SC3 예시 명령과 CLI 필수 인자 불일치

- 근거: GOAL.md:25 예시 `--topic <주제> --grade <학년>`에 `--subject` 없음, `run.ts:137`은 셋 다 필수. 예시대로 실행하면 exit 1. Verify가 PLAN의 완주 명령(subject 포함)을 쓰면 문제없으나 GOAL 문구가 오해 소지.
- 라우팅: decision-gate 시 GOAL 예시 정정.

### [MINOR] N6 — 이미지 생성이 PLAN 지정 플래그 대신 사용자 config에 의존 (이식성 리스크)

- 근거: PLAN.md:32는 이미지에 `--dangerously-bypass-approvals-and-sandbox`를 지정, `codex.ts:114-119`는 `--sandbox workspace-write`만 사용. 이 머신에서는 안전함을 직접 확인했다: `~/.codex/config.toml`에 `[sandbox_workspace_write] network_access = true`, `codex features list`에서 `image_generation stable true`. 그러나 이 두 전제는 코드/README 어디에도 기록되지 않아, network_access 기본값(false)인 다른 환경에서는 image_gen 경로가 조용히 죽는 예정 실패 지점이 된다. (`--full-auto` 제거는 정당함을 확인: `codex exec --help`에 해당 플래그 없음 — full-spec-report.md:13 주장 사실)
- 라우팅: residual-risk 기록 + README에 전제 조건 1줄 (또는 improve-edge로 `-c sandbox_workspace_write.network_access=true` 명시 주입).

---

## RESIDUAL (이미 문서화되었거나 정책 결정 대기)

- R1 — codex 출력이 "JSON만" 지침을 어기면(마크다운 fence 등) 1회 재시도 후 실패. fence-복구 미구현은 근거 있는 정책 선택으로 기록됨(fresh-context-edge-cases-report "수정하지 않은 항목", probe-codex-build ASK-USER). E2E 실패 시 1순위 용의자.
- R2 — QA 게이트 통과까지 최악 codex 호출 ~12회 x 15분 타임아웃, 전체 실행 시간 예산 없음. 무인 완주 시간이 수 시간에 이를 수 있음.
- R3 — `--force`의 content+catalog 비트랜잭션, 다른 id 동시 publish fail-fast, server/ writer와 락 미공유: GOAL d6/d7로 보수적 기본값 유지 결정 완료. 유지.
- R4 — 전체 저장소 `bun run test` After 비교 미실행(QA.md 인정). 완화 확인: `vitest.config.mjs` include가 `tests/**`뿐이라 팩토리 bun:test 파일은 기존 테스트에 유입되지 않음. 단 PoC 퍼블리시 후에는 기존 실패 스위트(content-catalog.test.ts)의 실패 양상이 변할 수 있어 After 비교가 필수.
- R5 — 동일 명령 재실행(이미 퍼블리시 성공한 id)은 중복 id 에러로 exit 1 — README에 "같은 ID는 덮어쓰지 않는다"로 문서화된 의도적 동작. 멱등 재실행은 아님을 Verify가 인지할 것.

## 직접 실행한 검증 (본 리뷰의 실행 증거)

| 검증 | 결과 |
|---|---|
| `bun test agents/content-factory --silent` | 46 pass / 0 fail / 109 assertions — 보고서 주장 재현 |
| `bun agents/.../stages/qa.ts public/contents/math/elementary/volume-explorer` (파일 미기록 경로) | 10개 검사, 5 pass/5 fail — N2의 stale 증명 |
| `updateCatalog(실제 index.json 79개, 신규 entry)` 스크래치 실행 | 80개, 기존 79개 항목 원문 바이트 보존, JSON 유효 — SC7 퍼블리시 경로의 보존 이론 실증 |
| `validateManifest(grade=5 / "5학년" / language="en")` | 전부 valid=true — M1 실증 |
| Bun.spawn `detached: true` 프로세스 그룹 실험 | 자식이 그룹 리더(pgid==pid) — edge 보고서의 detached kill 주장 사실 |
| `codex exec --help` / `codex features list` / `~/.codex/config.toml` | `-o`, `--output-schema`, `-C`, `--sandbox` 실재, `--full-auto` 부재, `image_generation` stable true, workspace-write network_access=true — 엔진 전제 확인 |
| `cmp public/contents/index.json qa/index.json.before` | 바이트 동일 — 보존 계약 유지 확인 |

## 대조 결과: 보고서 주장 vs 코드

- build-report / fresh-context-full-spec-report / fresh-context-edge-cases-report의 수정 주장 전 항목(소비 경계 재검증, resolvedAssets 전달, skip-images 썸네일, 루트 contents 스캐너, PID 락 회수, temp-rename 보존, 스테이징 4파일 강제, promote 백업/롤백, slugify 해시, stage preflight, QA 재개)이 현재 코드에 실재함을 확인. probe 3종이 지적한 P1/D1~D3도 전부 반영됨.
- 테스트가 목표를 목킹해 소멸시킨 사례는 없음 — 다만 실 codex/E2E는 본질적으로 단위 테스트 범위 밖이며 그 공백이 B1이다.

## 결론

- 심각도 집계: BLOCKER 1, MAJOR 4 (M1~M4), MINOR 6 (N1~N6), RESIDUAL 5 (R1~R5).
- "빌더 스모크가 완전하다"는 주장은 반증하지 못했다(주장 전 항목 재현·실증됨). 그러나 "변경이 완전하다"(원요청 충족)는 **반증된다**: 산출물 부재(B1)와, 첫 E2E에서 실패하거나 계약 위반 산출물을 통과시킬 수 있는 코드 근거 있는 지점 4건(M1~M4)이 남아 있다. M1/M2는 각 1~2줄 수정, M3/M4는 프롬프트/판정 기준 정합화 후 Verify 완주를 권한다.
