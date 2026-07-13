# M3 수정 보고서

## 결정

Q21을 브라우저 실행 증거가 아닌 정적 코드 준비도 계약으로 바꿨다. 심사관 입력에는 생성 파일과 정적 검사 결과만 있으므로, 입력 이벤트 핸들러·포커스 가능한 조작 요소·키보드 처리 코드가 모두 존재하는지를 판정한다.

실제 브라우저 오류와 입력 동작은 GOAL의 SC9 Playwright 검증이 맡는다. Q21 전체를 SC9로 이관하는 대안은 22개 필수 항목 게이트를 약화하고 이번 요청의 정적 판정 요구와 맞지 않아 채택하지 않았다.

## 변경

- `agents/content-factory/checklists/quality-gate.json`
  - Q21 이름과 설명을 정적 입력 접근성 계약에 맞췄다.
  - evidence의 `브라우저 오류와 입력 스모크`를 세 가지 코드 근거로 교체했다.
- `agents/content-factory/prompts/05-judge.md`
  - Q21 통과에 필요한 세 근거와 정적 판정 범위를 명시했다.
  - 브라우저 실행 증거를 요구하지 않고 SC9에 맡기도록 책임 경계를 기록했다.
- `agents/content-factory/pipeline/judge-contract.test.ts`
  - 체크리스트와 심사 프롬프트가 같은 Q21 계약을 유지하는지 검증하는 독립 테스트를 추가했다.

## 검증

- RED: `bun test agents/content-factory/pipeline/judge-contract.test.ts`
  - 기존 evidence가 `브라우저 오류와 입력 스모크`여서 1 fail.
- GREEN: `bun test agents/content-factory/pipeline/judge-contract.test.ts`
  - 1 pass, 0 fail, 10 assertions.
- 회귀: `bun test agents/content-factory`
  - 50 pass, 3 fail.
  - 실패는 별도 M2/M4 작업의 선행 RED(`04-build.md` 에셋 격리 2건, 생성 PNG 콘텐츠 코드 참조 1건)이며 M3 변경 파일과 겹치지 않는다.

## 범위

M1, M2, M4, MINOR, RESIDUAL과 `src/`, `server/`, `public/contents/`, `index.json`, `QA.md`는 수정하지 않았다.
