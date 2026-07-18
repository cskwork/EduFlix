# QA: 인앱 GLM 콘텐츠 생성

## Before

- `/api/generate`는 `server/services/art-assets.ts` HTTP 작업과 `content-sync.ts` 파일 복사에 의존한다.
- science는 `SubjectSelect.vue`에서 비활성화되어 있다.
- content-factory stages는 `runCodexText`를 직접 호출하며 웹 서버에서 실행되지 않는다.
- `bun run test`: 18 files 중 16 pass, 2 fail; 277 tests 중 210 pass, 67 fail. 실패는 현재 80개 카탈로그와 10개 기대값 불일치, archive된 5개 샘플 경로, `IFRAME_SANDBOX_ATTRS`의 현행 `allow-same-origin` 계약과 반대인 테스트 기대값이다.

## Commands

- `bun run test` (frozen_repo): 변경 전 기준선, exit 1.
- `bun run test`: 변경 후 전체 회귀, 25 files / 309 tests pass.
- `bun test agents/content-factory/pipeline`: 기존 팩토리 회귀, 80 tests pass.
- `bun test server/server-http.bun.test.ts`: 임시 포트의 실제 Bun HTTP에서 생성 202→status 200과 무키 503, 2 tests pass.
- `bun run lint`: ESLint 통과.
- `bun run build`: vue-tsc + Vite build 통과, 141 modules transformed.
- `rg -n "art-assets|ART_ASSETS" --glob '!docs/**' --glob '!CLAUDE.md' --glob '!.env'`: 결과 없음.
- focused 회귀: 분할 SSE, choice[0], raw text, provider label/file adapter, 즉시 jobId, 전체 재시도 예산보다 긴 폴링, preview 중복 방지, runner 전이/복사/충돌, rebuild manifest gate, Three.js 정밀 allowlist, review enum과 경로 거부 통과.
- `bun run test -- tests/unit/generate-route-local.test.ts`: `ZAI_API_KEY` 미설정 503, busy 409, 없는 job 404, 생성 202→status, review pending 계약 통과.
- `stat -f '%Sp %Lp %N' start.sh`: `-rwxr-xr-x 755 start.sh`.

## Results

- [x] 새 엔진·runner·라우트 테스트 통과.
- [x] 기존 팩토리 테스트 통과.
- [x] 전체 test/lint/build 통과.
- [x] 비문서 art-assets 참조 없음.
- [x] 키 미설정 503 확인.
- [x] generation/preview 8시간, review 35분과 POST 직후 jobId 전달 확인.
- [x] 실제 stream reader의 분할 SSE·EOF·첫 choice 전용 처리 확인.
- [x] 생성 단계별 정확한 progress/message와 review 응답 enum 확인.
- [x] 모든 QA rebuild/publish 전 manifest-plan 일치, Z.ai 이미지 skip 로그, exact temp ID, `waitForJob` 복사 확인.
- [x] 다른 과목·학년의 `symmetry`, `symmetry-2`도 전역 중복으로 인식해 새 ID를 `symmetry-3`으로 확정함을 확인.
- [x] 실제 Bun HTTP/JSON 배선의 202→status와 503 확인.
- [x] 문서화된 Three.js/OrbitControls 정확 버전만 허용하고 나머지 외부 script를 거부함을 확인.

## Residual Risk

- 실 Z.ai 호출은 스펙대로 테스트하지 않는다. 네트워크·계정·모델 응답 품질은 모킹 테스트 범위 밖이다.
- 기존 lint 기준선에는 archive 스크립트와 브라우저 전역 오인식이 있었다. `eslint.config.js`에서 archive/일회성 스크립트를 검사 대상에서 제외하고 Vue 브라우저 전역을 명시했으며, 실제 미사용 `IconSet` 바인딩은 제거했다.

- Backward-trace: 입력 → route 검증/키 게이트 → 202 jobId 즉시 UI 저장 → 장시간 status/preview → runner 단일 job → plan 확정 ID → storyboard/assets/build → 정적 QA/judge/rebuild → publish manifest까지 코드와 모킹 테스트를 역추적했다.
- Final independent auditor: 전역 콘텐츠 ID 충돌 회귀를 포함한 focused 재검증 PASS.
- Verdict: PASS (실 Z.ai 네트워크 호출 제외, review loop 4)
