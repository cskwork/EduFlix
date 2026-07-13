# GOAL - AI 콘텐츠 팩토리 (한국 최상위 에듀콘텐츠 방법론 기반 완전 자동 생성기)

Single source of "done". Only the verifier ticks a box; unticking needs regression evidence.

## Original Request

> reserach 에듀템 아이스캔디 등 한국 최고의 컨텐츠 업체들이 만드는 컨텐츠 생성 방식으로 ai 자동 컨텐츠 생성기를 만들고 싶어. 현재 그런 가능성을 가진 게 이 repo인데 전면 개편해서 이미 성공적인 켄텐츠 제작- 교육용을 만들 수 있게 해줘 이미지 같은 건 codex생성도 되고 생성형으로 컨텐츠 생성 완전 자동화 하고 싶어. 완료되면 1개 poc로 html로 만들어서 열어줘 구현은 codex 5.6 sol high 담당하기

## Spec

- **리서치 프리픽스**: 에듀템·아이스캔디(명칭 규명 포함)·아이스크림미디어 등 한국 상위 교육 콘텐츠 업체의 제작 방식을 조사해, 제작 파이프라인 단계와 품질 체크리스트로 정형화한다.
- **전면 개편(LEGACY)**: EduFlix repo의 콘텐츠 생성 체계를 "콘텐츠 팩토리" 파이프라인으로 개편한다.
  - 단계: 기획(교육과정/성취기준·학습목표) → 학습설계·스토리보드(scene 단위) → 에셋 명세·이미지 생성(codex `image_gen`) → 코드 생성(HTML/CSS/JS, EduFlixEngine 계약 준수) → 자동 QA 게이트(방법론 체크리스트) → 배포(manifest 작성 + `public/contents/index.json` 등록)
  - 한 개의 CLI 명령으로 주제/학년 입력 → 완성 콘텐츠 폴더 산출까지 **완전 자동화**.
  - 생성 엔진: codex CLI(`gpt-5.6-sol`, reasoning high, 구독 인증) — 텍스트·코드·이미지 모두. ANTHROPIC_API_KEY 기반 기존 서버 경로는 보존(병렬 유지).
- **PoC**: 파이프라인을 실제 1회 실행해 콘텐츠 1개를 생성하고 브라우저로 연다.
- **비목표(non-goals)**: 기존 21개 콘텐츠 수정, Vue UI 리디자인, 서버 API 계약 파괴, 배포(Vercel/터널) 작업.

## Success Criteria

Each item is falsifiable and names its verification method.

- [x] SC1 리서치 보고서 존재: `docs/changelog/2026-07/13-ai-content-factory/research/market-research.md`에 업체 규명 + 제작 파이프라인 표 + 품질 체크리스트(15개 이상) 포함 - verify: 파일 존재 + 내용 검사
- [x] SC2 방법론 인코딩: 리서치의 파이프라인/체크리스트가 repo 내 프롬프트·설정 파일로 인코딩됨(예: `agents/content-factory/`) - verify: diff check + 파일 내용이 리서치 체크리스트 항목과 대응
- [x] SC3 완전 자동화 CLI: 단일 명령(예: `bun run factory -- --topic <주제> --grade <학년>`)이 기획→스토리보드→이미지→코드→QA게이트→카탈로그 등록까지 무인 실행 - verify: 명령 1회 실행 exit 0 + 산출 폴더 생성 (2026-07-13 Monitor 실행: 전 단계 완료, FACTORY_EXIT=0)
- [x] SC4 이미지 자동 생성: PoC 콘텐츠에 codex `image_gen`으로 생성된 PNG가 1개 이상 포함되고 HTML에서 참조됨 - verify: `[ -s <png> ]` + grep 참조 확인 (thumbnail.png 1.9MB, index.html에서 참조, 브라우저 로드 200)
- [x] SC5 PoC 콘텐츠 1개: `public/contents/<subject>/<level>/<id>/`에 index.html/style.css/script.js/manifest.json 생성, EduFlixEngine scene flow(hook→story→core→quiz→wrap) 및 manifest 스키마 준수 - verify: 파일 존재 + 스키마 검사 + 브라우저 로드 (line-point-symmetry "도리와 대칭 박물관 복원 작전", manifest 12필드, 씬 5종)
- [x] SC6 자동 QA 게이트: 방법론 체크리스트 기반 자동 검증 스크립트가 존재하고 PoC가 통과 - verify: 게이트 스크립트 exit 0 (qa-report.json passed:true; CSS 수정 후 재실행도 EXIT=0)
- [x] SC7 기존 동작 보존: `bun run build` 성공, `bun run test` 기존 통과 수준 유지, 기존 콘텐츠(실측 79개)의 index.json 항목 무손상 - verify: build 성공(1.63s) + 테스트 210 pass/67 fail 베이스라인과 동일 + index.json 79→80 추가만·기존 항목 동일성 True
- [x] SC8 PoC 브라우저 오픈: 생성된 PoC HTML을 기본 브라우저로 연다 - verify: `open file:///...line-point-symmetry/index.html` 실행 OK (2026-07-13)
- [x] SC9 PoC 품질(브라우저 증빙): hook 씬 렌더, 씬 전환, 인터랙션 동작을 playwright-cli로 확인 - verify: `qa/` 스크린샷 7장 + browser-qa-report.md QA1~4 PASS + 데스크톱 겹침 수정 재검증 PASS

## QA Cases (web apps only)

Browser scenarios the QA agent drives via playwright-cli; evidence under `qa/`.

- [x] QA1 PoC index.html 로드 → hook 씬(질문 박스) 렌더 확인 - evidence: `qa/poc-hook.png` (+데스크톱 수정 후 `qa/poc-hook-desktop-fixed.png`)
- [x] QA2 씬 전환(hook→story→core) 버튼/흐름 동작 - evidence: `qa/poc-scenes.png`
- [x] QA3 core 인터랙션 1회 조작 후 상태 변화 확인 - evidence: `qa/poc-interaction.png` (격자 클릭 피드백 + 1단계 성공→2단계 자동 진행)
- [x] QA4 생성 이미지가 실제로 렌더됨(깨진 링크 없음) - evidence: `qa/poc-assets.png` (콘텐츠 자산 8건 전부 200, JS 에러 0건, favicon 404는 환경성)

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | auto-fix | resolved | PoC 주제 미지정 | repo 주력 카테고리(초등 수학) 중 기존 카탈로그에 없는 주제 1개를 리서치 결과 기반으로 선정 | PoC 실행 시 |
| d2 | auto-fix | resolved | ANTHROPIC_API_KEY 부재 가능성 | 생성 엔진 기본값 = codex CLI(gpt-5.6-sol, high; 구독 인증). 사용자가 "구현은 codex 5.6 sol high" 명시 | 파이프라인 실행 시 |
| d3 | auto-fix | resolved | 기존 /api/generate·creator UI 처리 | 파괴하지 않고 보존. 신규 팩토리는 CLI 파이프라인으로 병렬 신설, 프롬프트 자산은 개편 | SC7 |
| d4 | auto-fix | resolved | 자율 실행(사용자 부재) | plan approval = auto-approved (pre-authorized autonomy) | - |
| d5 | no-op | resolved | image_gen 호출에 methodology 전문 중복 인라인 여부 (full-spec 패스 발견) | 불필요 — 이미지 스펙은 03-assets 단계에서 방법론 반영된 산출물. 현행 유지 | - |
| d6 | no-op | resolved | server/ 측 index.json writer와 락 통합 (full-spec 패스 발견) | server/ 수정 금지 범위 → 잔여 위험으로 QA.md에 기록 | - |
| d7 | no-op | resolved | CLI 의미론 4건: 중복 value flag(last-wins), --help 우선순위, 다른 id 동시 publish fail-fast, --force 트랜잭션 범위 (edge 패스 발견) | 일반(no-user) 코딩 모호성 — 현행 보수적·가역적 기본값 유지, 엄격화하지 않음 | - |
