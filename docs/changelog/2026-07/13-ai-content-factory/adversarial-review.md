# Adversarial review — AI 콘텐츠 팩토리

## 결론

**Verdict: Request changes.** 현재 구현은 보호 경계와 `package.json` 1줄 추가 원칙은 지키지만, 실제 PoC 완료 증거가 없고 QA·재개·빌드 성공 판정에 우회 가능한 경로가 있다.

## High

### H1. 실패한 LLM 심사 결과도 조작된 상위 `passed: true`로 퍼블리시 가능

- 위치: `agents/content-factory/pipeline/stages/publish.ts:13-30`, `agents/content-factory/pipeline/lib/validate.ts:160-197`
- 기대: PLAN Step 3/5의 22항목이 모두 pass인 QA 보고서만 카탈로그 등록.
- 실제: `assertQaPassed()`는 `validateStageOutput("judge", value.judge).valid`만 검사한다. `validateJudge()`에서 `passed:false`와 실제 fail 항목이 서로 일치하면 이는 **유효한 실패 보고서**다. 따라서 상위 report만 `passed:true`, `errors:[]`로 만들면 실패 judge도 통과한다.
- 재현: 아래 read-only 명령이 예외 없이 `ACCEPTED_FAILED_JUDGE`를 출력했다.

  ```bash
  bun -e 'import {assertQaPassed} from "./agents/content-factory/pipeline/stages/publish.ts"; const checks=["required-files","manifest-schema","manifest-path","stylesheet-order","five-scenes","reduced-motion","image-files","no-external-script","learning-text"].map(id=>({id,status:"pass"})); const criteria=Array.from({length:22},(_,i)=>({id:`Q${String(i+1).padStart(2,"0")}`,status:i===0?"fail":"pass",evidence:["근거"]})); const judge={passed:false,summary:"실패",criteria,failedIds:["Q01"],revisionBrief:{required:true,instructions:["수정"]}}; assertQaPassed({passed:true,contentDir:"/content",errors:[],checks,judge},"/content"); console.log("ACCEPTED_FAILED_JUDGE")'
  ```
- 영향: QA 보고서가 손상·수동 편집되거나 이후 코드가 report 합성을 잘못해도 품질 게이트가 가짜 성공할 수 있다.

### H2. QA 이후 파일이 바뀌어도 이전 보고서로 그대로 퍼블리시됨

- 위치: `agents/content-factory/pipeline/stages/qa.ts:219-242`, `agents/content-factory/pipeline/stages/publish.ts:123-152`
- 기대: 퍼블리시 시점의 콘텐츠가 QA를 통과한 바로 그 바이트여야 한다.
- 실제: QA 보고서에는 파일 해시/manifest digest가 없고, publish는 보고서 구조와 manifest 스키마만 재검증한다. `index.html`, `style.css`, `script.js`, 이미지에 대해 `runStaticQa()`를 다시 실행하지 않는다.
- 재현 근거: 정상 QA 후 `script.js`에 구문 오류를 넣거나 참조 PNG를 0바이트로 바꿔도 `qa-report.json`과 manifest가 그대로라면 `assertQaPassed()` 경로는 이를 관찰하지 않는다.
- 영향: `--stage publish`, 재개, 수동 수정 사이에 생긴 JS 오류·깨진 이미지·외부 의존성이 카탈로그에 등록된다. QA/publish 원자성 계약 불충족.

### H3. 강제 재빌드·QA 수정 빌드가 이전 4파일을 새 산출물로 오인할 수 있음

- 위치: `agents/content-factory/pipeline/stages/build.ts:21-44`, `agents/content-factory/pipeline/lib/codex.ts:72-80`
- 기대: Codex가 이번 시도에 계약 파일을 실제 작성하지 않으면 실패.
- 실제: Codex 재시도 전에 삭제하는 것은 `build-response.txt`뿐이다. 기존 `index.html/style.css/script.js/manifest.json`은 남는다. Codex가 exit 0 및 응답 파일만 만들고 콘텐츠 파일을 하나도 갱신하지 않아도, 빌드 후 검사는 기존 파일의 존재·크기만 보고 성공한다.
- 재현 근거: `--force` 또는 QA revision 경로에서 네 파일을 사전 삭제/mtime·hash 비교하지 않으며, `required.every(existsSync)`/`stat.size` 외 이번 실행의 쓰기를 증명하는 검사가 없다.
- 영향: force 재생성 및 최대 2회 자동 수정이 실제로 아무 수정도 하지 않았는데 성공으로 진행할 수 있다. fake-success 금지 위반.

## Medium

### M1. 재개는 입력·상위 단계 변경을 추적하지 않아 서로 다른 실행의 산출물을 혼합함

- 위치: `agents/content-factory/pipeline/stages/common.ts:32-33`, `plan.ts:6-20`, `storyboard.ts:6-16`, `assets.ts:20-49`, `build.ts:21-31`
- 기대: 같은 run 재개만 skip하고, topic/grade/subject/type/skip-images 또는 상위 JSON이 달라지면 하위 단계를 무효화.
- 실제: `shouldRun()`은 파일 존재만 본다. run metadata나 입력 digest가 없다. 동일 `--id`로 topic/type/`--skip-images`를 바꾸거나 plan만 갱신해도 기존 storyboard/assets/build가 재사용된다.
- 재현 근거: `runs/<id>/plan.json`, `storyboard.json`, `assets.json`이 존재하면 각 단계는 현재 CLI 입력과의 관계를 확인하지 않는다. build도 네 파일이 있으면 즉시 return한다.
- 영향: 최종 manifest와 콘텐츠가 요청한 주제·학년·유형이 아닌 이전 실행 결과일 수 있다. 문서의 “중단 후 재개”가 재현 가능한 재개가 아니다.

### M2. 빈 출력·빈 이미지와 에셋 계획의 실제성 검사가 불완전함

- 위치: `agents/content-factory/pipeline/lib/codex.ts:41-53,72-80,103-110`, `agents/content-factory/pipeline/lib/validate.ts:128-157`, `agents/content-factory/pipeline/stages/assets.ts:34-49`, `agents/content-factory/pipeline/stages/qa.ts:37-42,103-121`
- 기대: 빈 Codex 결과는 1회 재시도하고, 재사용 에셋은 주입 목록에 실재하며, 생성 PNG는 non-empty이고 실제 콘텐츠에서 사용됨.
- 실제: 프로세스가 exit 0이면 `runWithRetry()`가 즉시 반환하므로 빈 output 검사는 재시도 밖에서 한 번 실패한다. 기존 이미지가 있으면 assets 단계는 크기를 확인하지 않고 skip한다. `reused.sourcePath`는 정규식만 검사하며 실제 주입 목록 membership을 확인하지 않고, `coverage`는 배열 여부만 확인한다. 정적 QA의 `exists()`도 파일 크기를 보지 않는다.
- 영향: 정상적으로 회복 가능한 빈 Codex 응답이 전체 실행을 중단하고, 반대로 재개의 0바이트 이미지·누락 coverage는 뒤 단계로 진행할 수 있다. SC4의 non-empty 생성 이미지와 자동 에셋 완결성을 보장하지 못한다.

## Completeness / 증거 상태

- `public/contents/`에 계획된 대칭 PoC가 없고, `agents/content-factory/runs/`에는 기존 `volume-explorer/qa-report.json`만 있다. `docs/.../qa/`에도 `index.json.before` 외 브라우저 캡처가 없다.
- `GOAL.md` SC1~SC9와 QA1~QA4는 모두 unchecked, `QA.md` Results/Verdict도 pending이다. 따라서 단일 명령 E2E, image_gen PNG, 카탈로그 등록, Playwright 동작, 브라우저 open은 아직 완료로 주장할 수 없다.
- 검증: 팩토리 테스트 `15 pass / 0 fail`; 전체 테스트 `210 pass / 67 baseline fail`로 기준선 유지.

## 확인된 보존 경계

- `git status/diff`: 기존 코드 변경은 `package.json`뿐이며 scripts에 `factory` 한 줄만 추가됐다. `src/`, `server/`, 기존 `public/contents/`, `public/contents/index.json` 변경은 확인되지 않았다.
- publish는 `wx` lock 후 최신 catalog를 다시 읽고 PID/UUID temp를 atomic rename하므로 정상 종료 경합의 lost update는 방어한다(`publish.ts:136-156`). 잔여 위험은 강제 종료 후 stale lock이며 문서에 이미 공개돼 있다.
- Codex build는 `-C context.contentDir` + workspace-write로 쓰기 범위를 콘텐츠 디렉터리에 제한하고, 모범 사례 절대경로는 read access로 제공한다. 이 부분에서 보호 경계 위반은 찾지 못했다.
