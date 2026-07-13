# M4 수정 기록

## 결정

- 생성 PNG의 `manifest.thumbnail` 참조는 콘텐츠 사용 증거로 보지 않는다.
- `assetPlan.generated`의 PNG 중 하나 이상이 `index.html`, `style.css`, `script.js`의 정적 이미지 참조로 해석되어야 한다.
- 기존의 개별 계획 이미지 존재·사용 검사는 유지한다.

## 변경

- `agents/content-factory/pipeline/stages/qa.ts`: 스크립트 이미지 참조를 수집하고, 생성 PNG의 콘텐츠 코드 참조를 별도 검증한다.
- `agents/content-factory/pipeline/stages/qa.test.ts`: manifest-only 참조 실패와 `script.js` 참조 성공을 한 테스트에서 고정한다.

## Red → Green

- Red: `bun test agents/content-factory/pipeline/stages/qa.test.ts --silent` — 신규 기대값 1건 실패.
- Green: 같은 명령 — 6 pass, 0 fail, 12 assertions.
