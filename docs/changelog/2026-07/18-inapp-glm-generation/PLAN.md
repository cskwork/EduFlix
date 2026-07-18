# Plan: 인앱 GLM 콘텐츠 생성

Approved: user-provided `spec.md` is the implementation authority.

## Intent

- Goal: `art-assets` HTTP/파일 동기화를 제거하고 기존 content-factory 품질 게이트를 Bun 서버 생성 경로에 연결한다.
- Constraints: Bun, 신규 의존성 없음, `.env`·기존 콘텐츠·카탈로그 수정 금지, commit 금지, 한국어 오류/주석, 실 LLM 테스트 금지.
- Preserve: 기존 프론트 생성/리뷰/프리뷰 응답 형태, 팩토리 단계 검증, build staging 승격/복구, 정적 QA, judge 후 최대 2회 rebuild, publish 카탈로그 락.
- Rejected: 별도 서버/큐 도입(스펙 위반), GLM에서 이미지 생성 흉내(기능 불일치), build 직접 파일 쓰기 권한 가정(챗 API 불가).
- Completion promise: 아래 체크리스트와 `spec.md`를 모두 구현하고 `bun run test`, `bun run lint`, `bun run build`, 비문서 `art-assets` 검색, 무키 503 계약을 증명한다. 최대 3회 Build-Verify 반복 후 남은 blocker를 보고한다.

## Blast Radius

- `agents/content-factory/pipeline/lib`: Z.ai SSE/정규화/마커와 provider routing.
- `agents/content-factory/pipeline/stages`, schemas, prompts, fixtures/tests: 엔진 치환과 plan 메타데이터.
- `server/services/factory-runner.ts`, generate/preview/health/config/index: 인프로세스 job/review/preview/health.
- `start.sh`, `start.bat`, `.env.example`, `SubjectSelect.vue`, 관련 단위 테스트와 오래된 계약 테스트.
- 삭제: `server/services/art-assets.ts`, `server/services/content-sync.ts`.

## Acceptance Checklist

1. Z.ai fetch SSE는 `delta.content`만 수집하고 `[DONE]`/stop/EOF를 처리한다. Abort timeout, HTTP/빈 응답 오류, 총 2회 시도, 기존 출력 원자 보존을 테스트한다.
2. schema 입력은 실제 schema 본문을 prompt 끝에 붙이고 JSON만 정규화·검증 후 저장한다. build 마커는 whitelist/중복/누락/빈 파일/경로 이탈을 거부한다.
3. Codex provider는 기존 `runCodexText`와 workspace-write 경로를 보존한다. Z.ai provider는 marker 결과를 staging에 기록한다.
4. Z.ai provider의 assets 단계는 `skipImages=true`를 강제하고 기존 공유 thumbnail 계약을 따른다.
5. plan은 interests/additionalContext를 입력 digest와 prompt에 포함하고 slug/title/description을 검증한다. publish 전 build manifest가 plan 메타데이터를 사용하도록 prompt/runner가 연결한다.
6. runner는 임시 run ID 생성, plan 후 안전한 slug/중복 접미사 확정과 runDir rename, 단계별 상태 전이, preview 캐시, publish 결과 manifest를 제공한다. 동시 실행은 서비스 오류로 구분한다.
7. review는 contentId로 실제 public 콘텐츠 디렉터리를 안전하게 찾고 static QA + judge를 실행해 기존 응답 형태로 issues를 제공하며 파일 수정은 하지 않는다.
8. generate는 기존 입력 제한과 math/science/english만 허용하고 키 미설정 503, 동시 실행 409, 없는 job 404를 반환한다.
9. health는 `{status:'ok', llm:{provider,model,keyConfigured}}`; preview는 runner job 상태만 사용한다.
10. 스크립트/환경 예시/UI/프롬프트/테스트를 스펙과 맞추고 비문서 `art-assets` 참조를 제거한다.
11. 변경 전 67개 실패 중 current catalog와 sandbox 상수에 모순되는 테스트만 현재 계약 기반으로 갱신하며 `public/contents/**`는 건드리지 않는다.

## Verification

- Focused Vitest for `zai`, `engine`, `factory-runner`, server config/health/routes and existing pipeline suites.
- `bun run test`
- `bun run lint`
- `bun run build`
- `rg -n "art-assets|ART_ASSETS" --glob '!docs/**' --glob '!CLAUDE.md' --glob '!.env'`
- route handler request with no `ZAI_API_KEY` returns 503 without reading `.env`.
