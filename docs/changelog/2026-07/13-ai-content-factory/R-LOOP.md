# R-LOOP - Exact Verify 반송 기록

## 2026-07-13 1차 E2E (id=content-lqu2gu)

- [x] 실패: build 단계 codex 호출이 15분 기본 타임아웃을 재시도 포함 2회 초과.
  - 기대: 4파일 생성 완료 / 실제: 900초 kill × 2.
  - 원인: 콘텐츠 전체(인라인 엔진 포함 4파일)를 high reasoning 1콜로 생성하는 데 15분 부족.
  - 수정(컨덕터, 기계적): `stages/build.ts` runCodexText에 `timeoutMs: 40분` 명시. tsc 통과.
- [x] 부수 발견: 자동 id 슬러그가 한글 topic에서 `content-lqu2gu`(무의미)로 떨어짐 → PoC는 `--id line-point-symmetry` 명시로 우회. (개선 여지는 잔여 위험에 기록)

## 2026-07-13 2차 E2E (id=line-point-symmetry) — 진행 중 실패

- [x] (해소: 4단계 output-schema 도입 후 4차 E2E에서 assets 통과) 실패: assets 단계 codex 응답 JSON이 `generated[0..1]` 필수 필드 누락으로 검증 거부(재시도 포함 2회).
  - 기대: 03-assets.md 예시 형태(assetId, fileName, scenes, purpose, prompt, alt, width, height 전부) / 실제: 일부 필드 누락(1차 E2E에서는 통과 → 확률적).
  - 근본 원인: 단계 산출물 JSON 계약이 프롬프트 예시로만 전달되고 `--output-schema`(codex 구조화 출력 강제)를 사용하지 않음. `lib/codex.ts`는 이미 `schemaFile` 옵션을 지원하는데 어느 단계도 쓰지 않음.
  - 최소 수정 지시: JSON을 반환하는 단계(plan, storyboard, assets, judge)에 대해 `agents/content-factory/schemas/<stage>.schema.json`을 validate.ts의 요구와 일치하게 작성하고, 각 단계의 runCodexText 호출에 schemaFile로 전달. validate.ts 사후 검증은 유지(이중 방어). 스키마와 validate.ts가 어긋나면 validate.ts 기준으로 스키마를 맞출 것.
  - 회귀 주의: plan/storyboard 캐시는 line-point-symmetry runs 디렉터리에 이미 존재 — inputs 해시가 변하지 않도록 단계 inputs 구성(스키마 파일 내용은 inputs에 포함하지 말 것)을 유지해 재실행 시 캐시가 살아야 함.

## 2026-07-13 3차 E2E (id=line-point-symmetry) — build 산출물 격리 과잉

- [x] 실패: assets(스키마 강제) 통과 후 build에서 `허용되지 않은 빌드 산출물: .playwright-cli`.
  - 원인: 생성 codex가 산출물을 자가 스모크하며 만든 숨김 도구 상태 디렉터리를 4파일-only 검사가 거부. 승격(promoteFiles)은 어차피 required 4파일만 복사하므로 숨김 항목은 위협이 아님.
  - 수정(컨덕터, 기계적): build.ts unexpected 필터에서 `.` 시작 항목 제외 + 회귀 테스트 추가(숨김 항목 무시·비승격, ReferenceError 1회 수정 후 GREEN).

## 2026-07-13 출력 스키마 edge-case 검토

- [x] `criteria.fix`를 구조화 출력 필수값으로 만들며 사후 validator까지 강화한 범위 확장을 복원.
  - 기존 QA의 필수 수정 지시는 `revisionBrief.instructions`이며 `judgeFailureInstructions`도 `fix` 부재를 허용한다.
  - strict 출력 스키마에서는 선택 속성을 선언하지 않고, validator는 기존 산출물의 선택적 `fix`만 계속 허용한다.
- [x] 네 스키마의 지원 키워드, 모든 객체의 전체 `required`와 `additionalProperties: false`를 재귀 점검.
- [x] 스키마 파일을 캐시 입력에 추가하지 않았고 기존 plan/storyboard 메타 해시가 모두 재사용 가능함을 확인.
- [x] `bunx tsc --noEmit && bun test agents/content-factory --silent`: 57 pass, 0 fail.

## 2026-07-13 출력 스키마 계약 테스트 보강

- [x] enum 계약을 단계·경로별 표로 고정하고 validator가 허용하는 모든 명시값을 schema와 함께 검증.
- [x] 핵심 중첩 필드의 누락과 오타입을 schema/validator가 함께 거부하는 required/type 경계 표 추가.
- [x] RED: `plan.grade`에서 `high-3`를 의도적으로 제거하자 enum 계약 테스트 1건 실패. 즉시 원복.
- [x] GREEN: `bunx tsc --noEmit && bun test agents/content-factory --silent`: 59 pass, 0 fail.
