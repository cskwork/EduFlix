M1~M4만 최소 diff로 수정했습니다. 금지 경로와 MINOR/RESIDUAL은 변경하지 않았습니다.

- M1: manifest `grade`에 지정 정규식과 `gradeLevel` 접두 일치를 적용했습니다. QA는 공통 validator를 사용하고, publish는 실행 grade와도 비교합니다.  
  파일: [validate.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/lib/validate.ts), [publish.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/publish.ts), 관련 테스트 3개.

- M2: build 프롬프트를 “assets 단계에서 이미지 제공 완료, 스테이징 이미지 생성·복사 금지, 제공된 상대경로만 참조”로 정합화했습니다. Assets가 `contentDir`에 직접 기록하고 build가 기존 이미지를 보존하는 경로도 테스트로 고정했습니다.  
  파일: [04-build.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/prompts/04-build.md), [build.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/build.ts), [build.test.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/build.test.ts).

- M3: Q21을 입력 이벤트 핸들러, 포커스 가능 요소, 키보드 처리 코드로 정적 판정하도록 변경했습니다. 브라우저 검증은 SC9 책임으로 명시했습니다.  
  파일: [05-judge.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/prompts/05-judge.md), [quality-gate.json](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/checklists/quality-gate.json), [judge-contract.test.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/judge-contract.test.ts).

- M4: 생성 PNG 중 하나 이상이 `index.html`, `style.css`, `script.js`에서 참조되는지 검사합니다. `manifest.thumbnail`만 참조한 경우 실패하며 script 참조 성공도 테스트했습니다.  
  파일: [qa.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/qa.ts), [qa.test.ts](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/pipeline/stages/qa.test.ts).

검증:

```text
bunx tsc --noEmit && bun test agents/content-factory --silent
53 pass / 0 fail / 137 assertions
```

최종 기록: [major-fixes-verify-report.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/docs/changelog/2026-07/13-ai-content-factory/major-fixes-verify-report.md).