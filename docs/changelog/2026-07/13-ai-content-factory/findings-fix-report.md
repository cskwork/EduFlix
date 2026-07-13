# Adversarial findings 수정 보고서

## 결정

H1~H3와 grounded M1~M2를 최소 변경으로 차단했다. 핵심 원인은 파일 존재를 성공·재개·퍼블리시 증거로 사용한 것이며, 이를 판정 일관성, 입력 provenance(출처 동일성), 바이트 digest로 교체했다.

## 문제 모델과 수정

- **H1 — failed judge publish**: 유효한 심사 JSON과 통과 심사를 구분한다. `judge.passed === true`가 아니면 상위 보고서가 성공을 주장해도 퍼블리시를 거부한다.
- **H2 — QA 이후 변조**: QA 보고서에 네 핵심 파일과 실제 참조한 모든 로컬 이미지의 SHA-256을 저장한다. 퍼블리시 직전 현재 바이트와 전부 비교하고, `plan/storyboard/assets` 입력 digest도 다시 확인한다.
- **H3 — stale build 산출물**: Codex는 매 시도마다 `runDir` 아래 새 staging 디렉터리에 네 핵심 파일을 작성한다. 네 파일이 모두 non-empty인 경우에만 최종 콘텐츠 디렉터리로 교체하므로, 생성 실패가 기존 핵심 파일을 지우지 않는다.
- **M1 — 혼합 재개**: plan/storyboard/assets/build마다 입력 digest sidecar를 기록한다. 산출물은 있지만 metadata가 없거나 현재 입력과 다르면 `--force`가 필요하다는 명확한 오류로 중단한다. 조용한 자동 무효화보다 기존 산출물 보존과 원인 가시성을 우선했다.
- **M2 — 빈 출력·에셋 실제성**: exit 0이어도 출력 파일이 비면 같은 1회 재시도 예산 안에서 다시 실행한다. 공용 에셋은 non-empty 파일만 프롬프트 목록에 넣고 `reused.sourcePath` membership을 검증한다. 필수 storyboard asset은 coverage에서 정확히 한 번 실제 계획 항목으로 해결되어야 한다. 생성·재사용 이미지는 non-empty이며 최종 HTML/CSS/manifest에서 실제 사용되어야 한다.

## 대안과 이유

- publish에서 정적 QA만 다시 실행: LLM judge 대상 바이트와의 동일성은 증명하지 못하므로 기각했다.
- force 전에 기존 핵심 파일 삭제: stale 성공은 막지만 실패 시 정상 기존 콘텐츠를 파괴하므로 기각했다.
- 입력 변경 시 하위 산출물 자동 삭제: 연쇄 삭제와 부분 실패 복구가 복잡해져, 보수적인 명확 실패를 선택했다.

## 회귀 증거

- `bun test agents/content-factory/pipeline/lib/*.test.ts agents/content-factory/pipeline/stages/*.test.ts` — **21 pass, 0 fail, 51 assertions**
  - 실패 judge 상위 성공 조작 거부
  - QA 후 `script.js` 및 `thumbnail.png` 바이트 변경 거부, 카탈로그 불변
  - force build가 새 핵심 파일을 쓰지 않을 때 기존 4파일 보존
  - 첫 빈 Codex 출력 후 두 번째 시도 fresh 출력 수용
  - stage 입력 변경 재개 거부
  - 공용 에셋 membership·coverage 및 0바이트/미사용 이미지 거부
- `bun build agents/content-factory/pipeline/run.ts --outdir /tmp/factory-check --target bun` — 성공, 10 modules
- `bunx tsc --noEmit --pretty false` — 성공, 오류 없음
- `bun run factory -- --help` — 성공
- `bun run build` — 성공, Vite 137 modules
- 기존 `volume-explorer` 정적 QA 실행 — 검사기가 정상 실행되어 기존 콘텐츠의 알려진 계약 미달을 fail로 보고했다. 파일 수정은 없었다.

## 보호 경계

`src/`, `server/`, 기존 `public/contents/`, `public/contents/index.json`은 수정하지 않았다. package 변경은 기존 계획의 `factory` script 1줄뿐이며 새 package는 추가하지 않았다.
