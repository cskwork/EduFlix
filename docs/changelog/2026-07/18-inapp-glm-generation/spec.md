# 인앱 GLM-5.2 콘텐츠 생성 파이프라인 구현 스펙

작성일: 2026-07-18. 구현 담당: Codex(gpt-5.6-sol high). 리뷰: Claude.

## 배경과 목표

현재 `/api/generate`는 sibling 저장소의 art-assets 서버(HTTP, GLM-4.7)에 생성을 위임한다.
한편 `agents/content-factory`에는 더 우수한 5단계 파이프라인(기획-스토리보드-에셋-빌드-QA-퍼블리시)이
있으나 Codex CLI(gpt-5.6-sol) 전용이고 CLI로만 실행된다.

목표:
1. EduFlix 앱(프론트+Bun 서버) 단독으로 콘텐츠 생성 전 과정 처리. art-assets 의존 완전 제거.
2. LLM 엔진을 Z.ai GLM-5.2 chat completions API(스트리밍)로 교체. Codex CLI는 선택 옵션으로 유지.
3. `/api/generate`가 content-factory 파이프라인을 인프로세스로 실행. 품질 게이트(QA judge + 정적 검사,
   실패 시 최대 2회 수정)를 웹 생성 경로에도 적용.
4. 프롬프트 개선으로 재미·주제 연관성·교육 품질 향상.
5. 과목 확장성: math/science/english 3과목 모두 웹에서 생성 가능 (기존 art-assets는 math/english만).

## 검증된 사실 (탐색 결과)

- Z.ai API: `https://api.z.ai/api/coding/paas/v4/chat/completions`, 모델 `glm-5.2` 정상 동작 확인됨.
  응답은 OpenAI 호환. 주의: reasoning 모델이라 `delta.reasoning_content`가 섞여 오며
  **`delta.content`만 수집**해야 한다. 스트리밍 SSE 파싱 참고 구현:
  `../art-assets/api/src/llm/zai-client.ts` (fetch 기반 부분만 참고, 복사 금지하고 Bun 관용구로 재작성).
- API 키는 루트 `.env`의 `ZAI_API_KEY`로 공급된다 (호스트가 별도 준비, 이 작업 범위 아님).
  `.env.example`에는 키 이름만 추가.
- content-factory build 단계는 Codex가 스테이징 디렉터리에 파일을 직접 쓰는 방식
  (`workspaceWrite: true`). 순수 챗 API인 GLM은 파일을 쓸 수 없으므로 마커 포맷 응답을
  파싱해 엔진이 대신 파일을 쓴다 (아래 참조).

## 아키텍처

### 1. 엔진 추상화 — `agents/content-factory/pipeline/lib/engine.ts` (신규)

```
runFactoryText(options: FactoryTextOptions): Promise<void>
  // options: { prompt, outFile, schemaFile?, timeoutMs?, validateOutput?, label? }
  // 프로바이더 선택: env FACTORY_LLM_PROVIDER = "zai"(기본) | "codex"
  // codex → 기존 lib/codex.ts runCodexText 위임 (기존 동작 불변)
  // zai   → lib/zai.ts 사용

runFactoryFiles(options: FactoryFilesOptions): Promise<void>
  // build 단계 전용. options: { prompt, requiredFiles, stagingDir, responseFile, timeoutMs?, label? }
  // codex → 기존 workspace-write 방식 (스테이징 디렉터리에 직접 쓰기)
  // zai   → 마커 포맷 지시를 프롬프트에 덧붙여 응답 수신 → 파싱 → stagingDir에 파일 기록,
  //          원문 응답은 responseFile에 저장
```

### 2. Z.ai 엔진 — `agents/content-factory/pipeline/lib/zai.ts` (신규)

- env: `ZAI_API_KEY`(필수), `ZAI_API_URL`(기본값 위 URL), `ZAI_MODEL`(기본 `glm-5.2`).
- fetch 스트리밍 SSE. `choices[0].delta.content`만 누적. `[DONE]` 또는 `finish_reason=stop`에서 종료.
- 타임아웃 명시(기본 10분, build 40분 — 호출부에서 전달). AbortController 사용.
- 재시도: 총 2회 시도(기존 runWithRetry 의미와 동일). validateOutput 실패도 재시도 사유.
- `schemaFile`이 있으면 스키마 파일 본문을 프롬프트 말미에 삽입:
  "아래 JSON 스키마를 만족하는 JSON만 출력하세요. 다른 텍스트 금지." + 스키마 본문.
  수신 후 JSON 정규화(마크다운 코드펜스 제거, 첫 `{`부터 마지막 `}`까지 추출) 후 outFile에 저장.
- 마커 파일 포맷 (build용):

```
===FILE: index.html===
(내용)
===END FILE===
===FILE: style.css===
...
```

  파서 규칙: requiredFiles 전부 존재해야 하고 각 내용이 비어 있지 않아야 한다.
  마커 이름은 requiredFiles 화이트리스트만 허용. 위반 시 검증 실패로 재시도.

### 3. 스테이지 수정 — 최소 침습

- `stages/plan|storyboard|assets|qa`: `runCodexText` 호출을 `runFactoryText`로 치환.
- `stages/build.ts`: `runCodexText`(workspace-write) 호출을 `runFactoryFiles`로 치환.
  이후 검증·promoteFiles 로직은 그대로 재사용.
- `stages/assets.ts`: 이미지 생성(`runCodexImage`)은 codex 프로바이더에서만 가능.
  zai 프로바이더일 때 skipImages를 강제 true로 처리하고 로그 한 줄 남김.
- FactoryContext 확장: `interests?: string[]`, `additionalContext?: string` (옵션).
  plan 단계 입력 JSON에 포함시켜 프롬프트에 전달.

### 4. 서버 통합 — `server/services/factory-runner.ts` (신규)

- 인메모리 job store: `Map<jobId, JobRecord>`.
  JobRecord: { jobId, status, progress, message, contentId?, manifest?, error?, createdAt }.
- `startFactoryJob(request: GenerationRequest): { jobId }` — 즉시 반환, 백그라운드 실행.
- 단계별 진행률 매핑 (기존 프론트 계약의 status 문자열 유지):
  - plan 시작: status=processing, progress=10, "학습 주제를 기획하고 있습니다..."
  - storyboard: 30, "스토리보드를 설계하고 있습니다..."
  - assets: 40, "에셋을 준비하고 있습니다..."
  - build: 50, "콘텐츠를 제작하고 있습니다... (수 분 소요)"
  - qa: status=reviewing, 80, "품질을 검증하고 있습니다..."
  - publish: 95, "카탈로그에 등록하고 있습니다..."
  - 완료: status=completed, 100, contentId+manifest 포함
  - 실패: status=failed, error 메시지 (한국어)
- 주제 도출: 웹 요청에는 topic이 없다. interests+grade+subject로 plan 단계가 교육과정 주제를
  선정한다 (프롬프트 개선 참조). 실행 순서:
  1. 임시 id: `gen-YYYYMMDD-HHmmss` 형식으로 runs 디렉터리 생성, topic은 interests를 ", "로 연결한 문자열.
  2. plan 단계 실행 후 plan.json의 `slug` 필드(스키마 확장, 아래)로 최종 id 확정.
     `assertSafeContentId` 통과 필수, 기존 콘텐츠와 중복 시 `-2`, `-3` 접미사.
  3. runs/<임시id> → runs/<최종id> 이동, context 재구성 후 나머지 단계 실행.
- plan.schema.json 확장: `slug`(영문 kebab-case), `title`(한국어 제목), `description`(한 문장) 필드
  추가(required). publish 단계 manifest가 이를 사용하는지 확인하고, manifest.title/description이
  plan에서 오도록 연결 (현 publish.ts 확인 후 필요한 최소 수정).
- 동시 실행 제한: 동시 1개 job (진행 중이면 409 반환 "이미 생성 작업이 진행 중입니다").

### 5. 라우트 교체 — `server/routes/generate.ts` 재작성

- POST `/api/generate`: 입력 검증(기존 규칙 유지: interests 최대 10개 각 100자,
  grade enum, subject는 math|science|english 3과목 허용) → `startFactoryJob` → 202 {success, jobId, message}.
  art-assets 헬스 게이트 제거. ZAI_API_KEY 미설정 시 503과 설정 안내 메시지.
- GET `/api/generate/status/:jobId`: job store 조회 → JobStatusResponse (기존 필드 계약 그대로).
- POST `/api/generate/review` + GET `/api/generate/review/status/:jobId`:
  기존 콘텐츠 로컬 QA로 재구현. moduleId=contentId, modulePath는 `public/contents/...` 경로.
  `runStaticQa` + judge 프롬프트 실행, 결과를 기존 ReviewStatusResponse 형태로 반환.
  (프론트 계약 유지가 목적. 자동 수정까지는 불요 — issues 보고까지.)

### 6. art-assets 제거

- 삭제: `server/services/art-assets.ts`, `server/services/content-sync.ts`
  (퍼블리시는 팩토리 publish 단계가 담당).
- `server/routes/preview.ts`: art-assets `getJobStatus` 의존 제거. job store 상태 기반으로 동작
  (build 완료 시 factory-runner가 완성 파일 내용을 preview 캐시에 push하는 정도로 단순화).
- `server/services/health.ts`: art-assets 체크 제거. `/api/health`는
  `{ status: 'ok', llm: { provider, model, keyConfigured } }` 반환 (프론트는 status만 사용).
- `server/config.ts`: art-assets 상수/함수 제거, `getZaiConfig()` 추가.
- `start.sh`, `start.bat`: art-assets 서버 기동 로직 제거 (Vite + API 서버만).
- `.env.example`: ZAI_API_KEY, ZAI_API_URL, ZAI_MODEL 항목 추가, art-assets 관련 제거.

### 7. 프론트 최소 수정

- `src/components/creator/SubjectSelect.vue`: science 옵션 복원 (주석 해제, grid 3열 복원,
  TODO 주석 제거).
- 그 외 UI/스토어/API 클라이언트는 계약 유지로 무변경이 원칙.
  (진행 메시지는 서버가 내려주는 message를 그대로 표시하는 구조인지 확인만.)

## 프롬프트 개선 (agents/content-factory/prompts/)

프롬프트 파일은 엔진 중립으로 유지한다 (마커/스키마 지시는 엔진이 부착).

- `01-plan.md`:
  - topic이 교육과정 주제가 아닌 관심사 나열일 수 있음을 명시. 이때 grade 성취기준에 맞는
    구체 주제를 선정하고 그 근거를 남기게 한다.
  - interests가 주어지면: 주제 선정이 아니라 훅·스토리·예시의 소재로 반드시 통합
    ("관심사는 포장이 아니라 문제 상황의 무대"). 관심사-개념 연결이 부자연스러우면
    가장 자연스러운 1개만 사용.
  - 산출에 slug/title/description 필드 추가 반영.
  - 흔한 오개념 3개 이상과 각 오개념을 깨는 상호작용 아이디어.
- `02-storyboard.md`: 재미 규칙 명문화 —
  - hook은 5초 안에 읽히는 도발적 질문 1개 + 시각 요소.
  - 발견의 순간(aha)이 core 씬에 정확히 1곳 지정될 것.
  - 인터랙션 다양성: 드래그/슬라이더/버튼탭/입력 중 2종 이상.
  - 모든 조작에 200ms 이내 시각 피드백. 정답/오답 즉시 피드백과 재시도.
- `04-build.md`: EduFlix 기술 표준 보강 —
  - 인라인 EduFlixEngine 패턴(모범 사례 디렉터리 참조) 유지.
  - CSS 변수 표준(`--ease-spring`, `--primary-color`, `--bg-color`, `--text-color` 필수).
  - 캔디팝 키즈 라이트 테마(밝은 배경, 높은 채도 포인트, 둥근 모서리).
  - mobile-first: clamp() 폰트, 터치 타겟 44px 이상, `../../../common/mobile.css` 링크 필수.
  - 이모지 문자 사용 금지 — 아이콘은 인라인 SVG로 직접 그린다.
  - `<html lang="ko">`, 애니메이션은 transform/opacity 기반 60fps.
  - 외부 네트워크 요청 금지 (Three.js 등 기존 허용 CDN 제외).
- `05-judge.md`: 루브릭에 다음 항목이 없으면 추가 —
  - 재미: 훅의 호기심 유발, 진행 보상 피드백.
  - 관심사 연관성: interests가 스토리에 실질 통합되었는가(장식 아님).
  - 学년 적합성: 어휘·난이도가 grade에 맞는가.

## 테스트 (Vitest, LLM 실호출 금지 — 전부 모킹/픽스처)

- `agents/content-factory/pipeline/lib/zai.test.ts`:
  SSE 파싱(reasoning_content 무시 포함), JSON 정규화, 마커 파싱(정상/파일 누락/빈 내용/허용 외 마커),
  재시도 동작, 타임아웃 에러 메시지.
- `engine.test.ts`: 프로바이더 라우팅(zai 기본), schemaFile 프롬프트 삽입.
- `tests/unit/factory-runner.test.ts`: job 상태 전이(성공 경로 목킹, 실패 경로), 동시 실행 409,
  status 응답 필드 계약.
- 기존 테스트 정리: `server-health.test.ts`는 새 health 계약으로 재작성,
  `server-config.test.ts`에서 art-assets 항목 제거, 팩토리 기존 테스트(build/qa/publish/
  schema-contract 등)는 계속 통과해야 한다 (스키마 확장 시 픽스처 갱신 포함).

## 완료 기준

1. `bun run test` 전체 녹색.
2. `bun run lint` 녹색.
3. `bun run build` (vue-tsc 포함) 녹색.
4. 저장소 내 `art-assets` 참조가 문서(docs/changelog 이력 제외)와 CLAUDE.md 갱신분 외에 없음.
5. 서버 기동 후 `POST /api/generate` → 202 → status 폴링 계약 확인 (LLM 키 없이도
   503 안내가 정상 동작).

## 제약

- Bun 런타임. 신규 npm 의존성 금지.
- 주석·에러 메시지는 한국어. 이모지 금지.
- 기존 콘텐츠(`public/contents/**`)와 카탈로그는 수정하지 않는다.
- CLAUDE.md의 코드 컨벤션 준수 (파일 800줄 이하, 함수 50줄 이하 노력).
- `.env`(실키)는 건드리지 않는다. `.env.example`만 갱신.
