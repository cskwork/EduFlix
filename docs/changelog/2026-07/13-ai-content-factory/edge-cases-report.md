# Improve edge cases 보고서

## 변경

- **입력·경로 보호**: `--id`를 소문자 영숫자 slug로 제한해 `runs/`와 `public/contents/` 경로 이탈을 차단했다. 공백 topic도 거부한다. 기존 콘텐츠 디렉터리는 같은 run의 `plan.json`이 없는 한 비강제 실행으로 재사용·덮어쓰지 않는다. 기존 콘텐츠 정적 QA 전용 경로는 유지한다.
- **Codex 실패 복구**: 각 텍스트·이미지 시도 직전에 대상 파일을 제거한다. timeout/실패 뒤 남은 파일이나 강제 재실행 전 파일을 다음 성공 시도의 새 결과로 오인하지 않는다.
- **에셋·manifest 일관성**: 재사용 에셋은 주입 대상 공용 디렉터리의 단일 파일 경로만 허용한다. 정적 QA는 manifest 내부 필드끼리의 일치뿐 아니라 실제 콘텐츠 디렉터리와 `manifest.path`가 일치하는지도 확인한다.
- **퍼블리시 보호**: `passed: true`만 있는 보고서는 거부하고, 동일 콘텐츠 경로·정적 checks·LLM judge·빈 errors가 모두 일치하는 QA 보고서만 허용한다. manifest를 다시 검증한다. 카탈로그 전체 JSON과 기존 ID 고유성을 먼저 검사한다.
- **카탈로그 동시성**: 배타적 lock을 얻은 뒤 최신 index를 다시 읽고, 임시 파일을 원자적으로 rename한다. 동시 퍼블리시는 명시적으로 실패해 마지막 writer가 기존 추가분을 유실하지 않는다. lock/temp는 성공·실패 모두 정리한다.

## 검증

- RED: stale Codex 파일, 재사용 에셋 traversal, manifest 실제 위치 불일치, 불완전 QA 및 손상·중복 카탈로그 테스트가 수정 전 실패함을 확인했다.
- GREEN: `bun test agents/content-factory/pipeline/lib/codex.test.ts agents/content-factory/pipeline/lib/validate.test.ts agents/content-factory/pipeline/stages/common.test.ts agents/content-factory/pipeline/stages/qa.test.ts agents/content-factory/pipeline/stages/publish.test.ts` — 15 pass, 0 fail.
- `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-edge/run.js` — 성공.
- `bun run factory -- --topic test --grade elementary-5 --subject math --id ../outside --stage plan` — 예상대로 exit 1, slug 검증에서 Codex 실행 전 차단.
- `bun run factory -- --topic test --grade elementary-5 --subject math --id volume-explorer --stage plan` — 예상대로 exit 1, 기존 콘텐츠 비강제 재사용 차단.
- 기존 `src/`, `server/`, `public/contents/`, `public/contents/index.json`, `package.json`은 이 단계에서 수정하지 않았다.

## 남은 우려

- 프로세스가 강제 종료되면 `.lock` 파일이 남아 후속 퍼블리시가 안전하게 중단될 수 있다. 자동으로 오래된 lock을 지우면 살아 있는 writer를 침범할 수 있어 추측 기반 stale-lock 회수는 넣지 않았다.
- Codex 실제 timeout과 재시도는 단위 테스트에서 stale 출력 거부까지만 증명했다. 중첩 Codex E2E와 PoC 브라우저 동작은 Exact Verify 범위다.
- `--force`는 문서화된 명시적 덮어쓰기 권한이므로 기존 콘텐츠 교체를 허용한다. 사용자가 force를 잘못 지정하는 위험까지 숨기지 않는다.
