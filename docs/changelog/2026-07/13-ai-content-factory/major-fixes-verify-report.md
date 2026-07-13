# MAJOR M1~M4 최종 검증

## 범위 결정

- M1은 사용자 지정 정규식 `^(elementary|middle|high)-[1-6]$`을 그대로 적용했다. 기존 CLI의 중·고등 1~3 제한으로 좁히는 대안은 명시 요구와 달라 채택하지 않았다.
- M3은 요청된 Q21만 정적 증거 계약으로 바꿨다. Q19 변경은 요청 범위 밖이므로 유지했다.
- M4는 신규 생성 PNG의 콘텐츠 코드 참조 게이트까지만 보강했다. 별도의 QA artifact digest 확대는 요청되지 않아 포함하지 않았다.
- 기존 MINOR/RESIDUAL과 `src/`, `server/`, `public/contents/`, `index.json`은 수정하지 않았다.

## 검증

- `bun test agents/content-factory/pipeline/stages/build.test.ts --silent` — 6 pass, 0 fail.
- `bunx tsc --noEmit && bun test agents/content-factory --silent` — 53 pass, 0 fail, 137 assertions.
- 전체 검증 첫 시도에서 build rollback 테스트의 `afterEach` 정리 훅이 한 번 timeout됐으나, 단독 및 전체 재실행에서 재현되지 않았다.
- fresh-context 적대 검토에서 M2의 assets→contentDir 직접 기록과 4파일 승격, M4의 manifest-only 실패·script 참조 성공을 코드로 재확인했다.
