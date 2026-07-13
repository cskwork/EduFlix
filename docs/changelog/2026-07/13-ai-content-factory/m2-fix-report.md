# M2 수정 보고서

## 결정

빌드 단계는 이미지 파일을 만들거나 복사하지 않고, 에셋 단계가 준비한 경로만 콘텐츠 코드에서 참조한다. 빌드 스테이징과 승격 범위는 기존 계약대로 네 핵심 파일로 유지한다.

## 근거와 변경

- `pipeline/stages/assets.ts`는 생성 이미지를 이미 `contentDir`에 직접 기록한다.
- `pipeline/stages/build.ts`의 승격 함수는 `index.html`, `style.css`, `script.js`, `manifest.json`만 교체하므로 기존 이미지는 보존된다.
- `prompts/04-build.md`의 이미지 생성 허용 문구를 제거하고, 에셋 단계 완료·스테이징 이미지 생성/복사 금지·제공된 상대경로만 참조하는 계약을 명시했다.
- 빌드 모델에는 에셋 존재 확인에 쓰인 `absolutePath`를 노출하지 않고 `assetId`, `kind`, `sourcePath`만 전달한다. 절대경로를 콘텐츠에 복사할 가능성을 제거했다.

스테이징에서 계획된 이미지 파일을 허용하는 대안은 거절했다. 이미지 책임이 assets/build 두 단계에 다시 분산되고, 네 파일만 검증·승격한다는 기존 격리 계약도 약해지기 때문이다.

## 변경 파일

- `agents/content-factory/prompts/04-build.md`
- `agents/content-factory/pipeline/stages/build.ts`
- `agents/content-factory/pipeline/stages/build.test.ts`
- `docs/changelog/2026-07/13-ai-content-factory/m2-fix-report.md`

## 테스트

- RED: `bun test agents/content-factory/pipeline/stages/build.test.ts` — 프롬프트 계약 부재와 빌드 입력의 이미지 절대경로 노출을 각각 재현했다.
- GREEN: `bun test agents/content-factory/pipeline/stages/build.test.ts` — 6 pass, 0 fail, 27 assertions.
- 회귀: `bun test agents/content-factory --silent` — 53 pass, 0 fail, 137 assertions.
- 타입: `bunx tsc --noEmit` — exit 0.

성공 빌드 테스트는 에셋 단계 산출물로 가정한 `thumbnail.png`가 바이트 그대로 남고, 콘텐츠 디렉터리에 이미지와 네 핵심 파일 외 항목이 생기지 않음을 확인한다.
