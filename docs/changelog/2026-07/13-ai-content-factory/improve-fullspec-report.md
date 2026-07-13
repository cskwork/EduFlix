수정 완료했습니다. 가장 작은 실행 갭 6건을 보완했습니다.

### 발견·수정한 갭

- 단계 JSON 검증 단절
  - 근거: PLAN Step 1, market-research 5절.
  - storyboard→assets→build→QA 소비 경계마다 스키마와 문맥을 재검증합니다.
  - plan/storyboard/assets의 필수 내부 필드도 검사합니다.

- `--skip-images` 썸네일 미보장
  - 근거: PLAN Steps 3~4, 사용자 중점 6.
  - 주입된 공용 에셋 중 실존하는 non-empty PNG를 `assetId: thumbnail`로 요구합니다.
  - 특정 이미지는 하드코딩하지 않았습니다.

- build에 실제 에셋 경로 미전달
  - 근거: market-research Stage 4.
  - 생성·재사용 에셋을 절대경로로 해석하고 파일 실존성을 확인한 뒤 build prompt와 재개 digest에 전달합니다.

- 인라인 EduFlixEngine 계약 부족
  - 근거: repo-map 3-3, PLAN Step 4.
  - `Scene`, `EduFlixEngine`, `Engine.init(data)`, 5씬 순서, `onInit(container, engine)`, `showFeedback`, `enableNext`, wrap의 `postMessage('close', '*')`를 프롬프트와 정적 QA에서 강제합니다.

- publish 래퍼 검증·갱신 오류
  - 근거: PLAN Step 5, repo-map 2-5.
  - 루트 `version`, `lastUpdated`, `contents[]`를 검증합니다.
  - 중첩 항목이 아닌 루트 `lastUpdated`만 JSON-aware 방식으로 변경합니다.
  - 중복 ID 기본 오류와 `--force` 교체 동작은 유지했습니다.

- README의 `--stage` 설명 불일치
  - 실제 동작대로 “해당 단계만 실행”으로 정정했습니다.

CLI 전체 인자 지원과 `methodology.md`의 01~05 프롬프트 실제 인라인은 기존 구현이 이미 충족했습니다.

### 수정 파일

주요 변경:

- [validate.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/lib/validate.ts)
- [assets.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/lib/assets.ts)
- [build.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/build.ts)
- [qa.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/qa.ts)
- [publish.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/publish.ts)
- [03-assets.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/prompts/03-assets.md)
- [04-build.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/prompts/04-build.md)
- 관련 테스트·fixture·README
- [재감사 보고서](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/docs/changelog/2026-07/13-ai-content-factory/fresh-context-full-spec-report.md)

### 검증 결과

- `bunx tsc --noEmit`: 통과
- `bun test agents/content-factory --silent`: 34 pass, 0 fail
- `bun run factory -- --help`: 통과, PLAN의 전체 CLI 인자 출력
- `public/contents/index.json`: 79개, 고유 ID 79개
- 보존 스냅샷과 SHA-256 동일:
  `ce4afc282fd49f29af0f43099d51ace4fc2c50548d6529b2c78ef389f8dff661`
- `git diff --exit-code -- src server public`: 통과

ASK-USER:

- 최종 `image_gen` 도구 호출에도 methodology 전문을 중복 인라인할지는 해석 선택이라 수정하지 않았습니다. 01~05 단계에는 현재 전문이 실제 인라인됩니다.
- 서버의 다른 index writer까지 동일 락을 사용하려면 금지 범위인 `server/` 수정이 필요하므로 변경하지 않았습니다.