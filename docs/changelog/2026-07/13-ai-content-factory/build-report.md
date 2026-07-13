PLAN Steps 1~8 구현과 Step 7 스모크 검증을 완료했습니다. 판정은 `BUILDER SMOKE PASS`입니다.

### 변경·신설 파일

- `package.json`
  - `"factory": "bun agents/content-factory/pipeline/run.ts"` 1줄만 추가

- [agents/content-factory](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/agents/content-factory/)
  - CLI: `pipeline/run.ts`
  - 라이브러리: `pipeline/lib/codex.ts`, `validate.ts`
  - 단계: `plan.ts`, `storyboard.ts`, `assets.ts`, `build.ts`, `qa.ts`, `publish.ts`, `common.ts`
  - 프롬프트: `methodology.md`, `01-plan.md`~`05-judge.md`
  - 품질 게이트: `checklists/quality-gate.json`
  - 테스트 6개: Codex, validation, build, common, QA, publish
  - 문서: `README.md`
  - 스모크 산출물: `runs/volume-explorer/qa-report.json`

- 검증·의사결정 기록
  - [QA.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/docs/changelog/2026-07/13-ai-content-factory/QA.md)
  - [exact-verify-report.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/docs/changelog/2026-07/13-ai-content-factory/exact-verify-report.md)
  - `build-report.md`, `full-spec-report.md`, `edge-cases-report.md`
  - `adversarial-review.md`, `findings-fix-report.md`

### Step 7 실제 실행 결과

- (a) `bun run factory -- --help`
  - exit 0
  - 필수 인자, 6단계, `--force`, `--skip-images`, 개발용 QA 경로 출력 확인

- (b) 신설 TypeScript 검사
  - `bun build --no-bundle ...`: exit 0, 26ms
  - `bunx tsc --noEmit --pretty false`: exit 0, 타입 오류 0

- (c) 기존 `volume-explorer` 정적 QA
  - 검사기 정상 실행, `qa-report.json` 생성
  - exit 1: 검사기 오류가 아니라 기존 콘텐츠의 신규 계약 위반 검출
  - 9개 검사 중 4 pass, 5 fail
  - 미달: 12필드 manifest, reduced-motion, 외부 CDN 금지, 학습목표 텍스트 등
  - 중첩 Codex 호출 없음

- (d) `bun run build`
  - exit 0
  - 137개 모듈 변환, Vite 5.57초

추가 검증:

- 팩토리 단위 테스트: 21 pass, 0 fail, 51 assertions
- `src/`, `server/`, 기존 `public/contents/`: 변경 없음
- `public/contents/index.json`: 기준 스냅샷과 바이트·SHA-256 동일, 79개 유지
- 리서치 Q01~Q22: 방법론·JSON 게이트·LLM judge에 누락/중복 없이 22/22 대응
- `git diff --check`: 통과

### 미해결 사항·주의점

- PLAN Step 7 지시에 따라 실제 전체 Codex 파이프라인, image_gen, PoC 생성·퍼블리시, 브라우저·Playwright E2E는 실행하지 않았습니다.
- 따라서 구현과 빌더 스모크는 완료됐지만, 단일 명령 무인 완주와 실제 생성 콘텐츠 품질은 아직 제품 수용 검증 전입니다.
- 퍼블리시 도중 프로세스가 강제 종료되면 안전을 위해 lock 파일이 남을 수 있으며, 이 경우 수동 확인이 필요합니다.