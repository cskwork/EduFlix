# Fresh-context Improve full spec 재감사

## 결론

PLAN Steps 1~8과 GOAL SC3~SC7을 현재 구현에 다시 대조해, 코드로 답할 수 있는 최소 갭을 수정했다. 기존 `src/`, `server/`, `public/contents/`, `public/contents/index.json`은 수정하지 않았다.

## 발견 갭과 근거

| 갭 | 요구 근거 | 수정 |
|---|---|---|
| 부분 실행에서 상위 JSON을 재검증하지 않음 | PLAN Step 1의 단계별 스키마 검증, market-research 5절의 “중간 JSON 검증 후 다음 단계” | storyboard/assets/build/QA 소비 경계에서 plan/storyboard/assets 타입가드와 문맥 검증 재실행. 프롬프트의 필수 내부 필드까지 검사 |
| `--skip-images`가 manifest 썸네일을 보장하지 않음 | 사용자 중점 6, PLAN Step 3~4, repo-map 4절의 빈 썸네일 문제 | 공용 목록에 실제 존재하는 PNG를 `assetId: thumbnail`로 요구하고 membership·non-empty 파일을 검증. 특정 교과 이미지는 하드코딩하지 않음 |
| build가 에셋 계획 문자열만 받고 실제 경로를 받지 않음 | market-research Stage 4의 “스토리보드 JSON + 에셋 경로”, 04-build 입력 계약 | generated/reused 에셋을 실존 절대경로로 해석해 build prompt와 재개 digest에 전달 |
| 04-build가 인라인 엔진 핵심 불변식을 일부 암묵적으로만 요구 | PLAN Step 4, repo-map 3-3 | `Scene`/`EduFlixEngine`, `Engine.init(data)`, 5씬 순서, `onInit(container, engine)`, feedback/enableNext, wrap close를 프롬프트와 정적 QA에 명시 |
| publish가 루트 래퍼의 `version`/`lastUpdated`를 검증하지 않고 첫 `lastUpdated`를 변경 | PLAN Step 5, repo-map 2-5·4절 | 루트 래퍼 문자열 필드 검증, JSON 깊이를 추적해 루트 `lastUpdated`만 교체. 기존 contents 원문 slice 유지 |
| README의 `--stage` 설명이 “이후 단계”처럼 읽힘 | PLAN Step 1과 실제 CLI의 “해당 단계만” 계약 | 문구를 “해당 단계만 실행”으로 정정 |

## 충족 확인

- CLI는 `--topic`, `--grade`, `--subject`, `--type`, `--id`, `--skip-images`, `--stage`, `--force`, `--help`를 파싱·검증한다.
- `readPrompt()`가 `methodology.md` 전문을 01~05 단계 프롬프트 앞에 실제 인라인한다.
- 04-build는 mobile.css 로드 순서, 고정 12필드 manifest, hook→story→core→quiz→wrap을 강제한다.
- publish는 중복 ID를 기본 거부하고 `--force`일 때만 대상 항목을 교체한다.
- 실제 `public/contents/index.json`은 보존 스냅샷과 SHA-256이 같고 79개 고유 ID를 유지한다.

## 선택과 기각

- 채택: `--skip-images`에서 LLM이 주입 목록 중 의미가 맞는 공용 PNG를 고르고 코드가 실존성을 검증. 교과별 고정 이미지는 도메인 선택을 하드코딩하므로 기각.
- 채택: publish 원문을 JSON 전체 재직렬화하지 않고 루트 값과 대상 배열만 문자열 slice로 수정. 전체 `JSON.stringify`는 기존 79개 항목 바이트 보존을 깨므로 기각.
- 채택: 소비 경계마다 재검증. 앞 단계가 한 번 검증했다는 가정은 `--stage` 부분 실행과 파일 변조를 막지 못하므로 기각.

## ASK-USER

- 이미지 생성 도구의 최종 `image_gen` 호출에도 `methodology.md` 전문을 다시 인라인할지는 해석 선택이다. 01~05 생성 단계에는 이미 전문이 인라인되며, 이미지 호출에는 검증된 asset prompt만 전달한다. 관련 없는 교육 규칙을 이미지 도구에 중복 주입하지 않았다.
- factory 외 서버 writer까지 `index.json` 전역 락을 공유하게 할지는 `server/` 변경이 필요하다. 이번 수정 금지 범위와 충돌하므로 변경하지 않았다.

## 검증

- `bunx tsc --noEmit`: exit 0.
- `bun test agents/content-factory --silent`: 34 pass, 0 fail, 74 assertions.
- `bun run factory -- --help`: exit 0, 전체 인자 계약 출력.
- `cmp -s public/contents/index.json docs/changelog/2026-07/13-ai-content-factory/qa/index.json.before`: exit 0.
- 두 index 파일 SHA-256: `ce4afc282fd49f29af0f43099d51ace4fc2c50548d6529b2c78ef389f8dff661`.
- 실제 카탈로그: `{version,lastUpdated,contents}`, 79개, 고유 ID 79개.
- `git diff --exit-code -- src server public`: exit 0.
