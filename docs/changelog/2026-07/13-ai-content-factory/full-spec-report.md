# Improve full spec 보고서

## 이론과 범위

- 목표: PLAN Steps 1~8 구현이 원 요청의 완전 자동 파이프라인과 실패 차단 계약을 실제로 지키게 한다.
- 보호 범위: 기존 `src/`, `server/`, `public/contents/` 및 `public/contents/index.json`은 수정하지 않았다. `package.json`도 수정하지 않았다.
- 최소 수정 원칙: 전체 구조를 바꾸지 않고 실행 불가 옵션, 입력 누락, 검증 모순, QA 우회만 고쳤다.

## PLAN 대조 결과

| Step | 확인된 gap | 수정 |
|---|---|---|
| 1 | 설치된 Codex CLI가 지원하지 않는 `--full-auto` 때문에 build가 항상 실패 | 지원되는 `--sandbox workspace-write`로 실행하고 빌드 Codex의 작업 루트를 새 콘텐츠 디렉터리로 제한 |
| 1 | 이미지 단계가 모델·reasoning 계약을 지정하지 않고 sandbox 우회 플래그를 함께 사용 | `gpt-5.6-sol`, high, workspace-write로 통일 |
| 2 | 리서치 4절 Q01~Q22 대신 별도 22항목을 사용 | 원본 번호·의미를 `methodology.md`와 `quality-gate.json`에 1:1 복원; 별도 기획 요구는 유지 |
| 2~3 | `contentId`, `skipImages`가 에셋 프롬프트에 전달되지 않음 | 두 입력을 명시적으로 주입; skip 모드의 생성 계획을 오류 처리 |
| 3~4 | 기본 실행이 이미지 0개 계획으로도 진행해 SC4를 증명하지 못할 수 있음 | 기본 실행에 `thumbnail.png` 계획을 필수화; 생성 파일명은 `thumbnail.png`/`hook-visual.png`만 허용 |
| 3 | LLM 심사의 `passed`, fail 항목, `failedIds`, 수정 지시가 모순돼도 통과 가능 | 네 필드의 상호 일관성과 각 항목 근거를 타입가드에서 검증 |
| 4 | 빈 핵심 파일도 존재 검사만 통과 | 네 계약 파일의 비어 있지 않은 크기까지 확인 |
| 4 | manifest 나머지 필드가 모델 임의 선택 | 12필드를 `createdAt`, `tags`까지 고정하고 값 종류를 검증 |
| 5 | `--stage publish`로 QA를 우회 가능 | `qa-report.json`의 `passed=true` 없이는 퍼블리시 거부 |
| 7 | 기존 콘텐츠 QA 스모크가 중첩 Codex를 호출할 우려 | 실행 경로가 입력 JSON 부재 시 `runStaticQa`만 호출하고 보고서를 저장함을 실제 exit 1로 확인 |
| 6, 8 | 구현과 문서가 계획에 부합 | 추가 수정 없음 |

## 검증

- `bun test agents/content-factory/pipeline/lib/validate.test.ts agents/content-factory/pipeline/stages/publish.test.ts`: 10 pass, 0 fail.
- `bun run factory -- --help`: exit 0.
- `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-full-spec/run.js`: exit 0.
- 품질 게이트 JSON Q01~Q22 순번 검사: OK.
- `bun run factory -- --stage qa --id volume-explorer`: exit 1(의도한 정적 게이트 거부), `qa-report.json` 저장; LLM/Codex 호출 없음.

## 남은 우려

- 실제 중첩 Codex 텍스트·이미지 생성과 정상 PoC E2E는 Exact Verify 단계가 수행해야 한다.
- 브라우저 동적 품질(Q19, Q21)은 현재 LLM 심사만으로 확정할 수 없으며 PLAN의 Playwright 검증이 필요하다.
