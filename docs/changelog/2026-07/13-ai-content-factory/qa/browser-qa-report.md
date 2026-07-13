# 브라우저 QA 보고서 — line-point-symmetry (도리와 대칭 박물관 복원 작전)

- 일시: 2026-07-13
- 대상: `public/contents/math/elementary/line-point-symmetry/` (초5 수학, 선대칭·점대칭)
- 검증 URL: `http://localhost:5199/contents/math/elementary/line-point-symmetry/index.html`
- 환경: 워크트리 `EduFlix-runs/ai-content-factory`, `bunx vite --port 5199` 정적 서빙, playwright-cli(Chromium), 기본 뷰포트 1280x720
- 소스 코드는 수정하지 않음 (읽기 전용 검증)

## 종합 판정

| 항목 | 판정 | 증빙 |
|---|---|---|
| QA1 hook 씬 렌더 | PASS | `poc-hook.png` |
| QA2 씬 전환 (hook→story→core) | PASS | `poc-scenes.png` |
| QA3 core 인터랙션 상태 변화 | PASS | `poc-interaction.png` |
| QA4 콘솔 에러 / 네트워크 404 | PASS (환경성 favicon 404 1건 구분 표기) | `poc-assets.png` |

JS 런타임 에러(스크립트 예외): 0건. 콘솔 에러 엔트리: 1건 (favicon 404, 아래 QA4 참조).

## QA1 — hook 씬 렌더 (PASS)

- 페이지 로드 직후 progressbar `1 / 5 · 궁금증 열기`, 질문 헤딩 "나비와 바람개비는 각각 어떻게 움직여야 완전히 겹칠까요?", 학습목표, 나비/바람개비 카드 2개, 비활성 CTA "박물관 안으로"가 모두 렌더됨 (접근성 스냅샷으로 확인).
- 단, 데스크톱 뷰포트에서 썸네일이 질문 헤딩을 가리는 레이아웃 이슈 발견 — "추가 발견" 절 참조. 렌더 자체는 정상이므로 QA1은 PASS, 레이아웃 이슈는 별도 기록.

## QA2 — 씬 전환 (PASS)

전환 경로와 진행도 표시가 모두 정상 동작:

1. hook: "가운데 선으로 접기" + "가운데 점에서 반 바퀴" 클릭 → "박물관 안으로" 활성화 → 클릭
2. story 진입 (progressbar `2 / 5 · 개념 발견`): "방패 접기" + "반 바퀴 돌리기" → "두 움직임 비교하기" 활성화 → "복원 작업대로" 활성화 → 클릭
3. core 진입 (progressbar `3 / 5 · 복원 실험`): 7x7 격자, 출발점 별([1,3]), 세로 대칭축(x=3, 빨간 점선), 도구 패널(접기/반 바퀴, 축 선택, 거리 확인, 미리보기, 되돌리기, 복원 확인) 렌더 확인

버튼 게이팅(선행 조작 완료 전 비활성)도 의도대로 동작.

## QA3 — core 인터랙션 상태 변화 (PASS)

- 조작 1: 격자 셀 [5,3] 클릭 (출발점 [1,3]의 x=3 축 대칭점) → 피드백 텍스트 변화 확인: "가로 6, 세로 4 칸에 점을 놓았어요. 기준까지 거리를 비교해 보세요."
- 조작 2: "복원 확인" 클릭 → 성공 피드백: "1단계 · 선대칭 한 점 복원 성공! 두 대응점은 대칭축에서 같은 거리만큼 떨어져 있고 같은 높이에 있어서 접으면 겹쳐요. 다음 유물로 이동합니다." → 2단계(점대칭 한 점, 출발점 [5,1], 중심 [3,3])로 자동 진행됨.
- `poc-interaction.png`는 2단계로 전환된 화면 — `poc-scenes.png`(1단계)와 비교하면 상태 변화가 명확함.

## QA4 — 콘솔 에러 / 네트워크 404 (PASS, 구분 표기 1건)

네트워크 요청 전체 (8건, 전부 200):

| # | 리소스 | 상태 |
|---|---|---|
| 1 | `.../line-point-symmetry/index.html` | 200 |
| 2 | `.../line-point-symmetry/style.css` | 200 |
| 3 | `/contents/common/mobile.css` | 200 |
| 4 | `.../line-point-symmetry/thumbnail.png` | 200 |
| 5 | `.../line-point-symmetry/script.js` | 200 |
| 6 | `/contents/backgrounds/bg-geometric-shapes-pastel-20260125.png` | 200 |
| 7 | `/contents/icons/icon-trophy-achievement-cute-20260124.svg` | 200 |
| 8 | `/contents/backgrounds/bg-grid-paper-math-subtle-20260125.png` | 200 |

콘솔 에러 목록 (전 세션 누적 1건):

- `[ERROR] Failed to load resource: 404 @ http://localhost:5199/favicon.ico` — 브라우저가 자동 요청하는 사이트 루트 favicon. 콘텐츠가 참조하는 자산이 아니고 외부 CDN도 아닌 **dev 서버 환경성 404**로 구분 표기. 콘텐츠 자산(thumbnail.png 포함)은 전부 200이고 JS 런타임 예외는 0건이므로 PASS 판정.

## 추가 발견 (레이아웃)

### [중요] 데스크톱(>=1024px)에서 hook 썸네일이 질문 헤딩을 가림

- 증상: 1280x720 뷰포트에서 `.hook-thumbnail`(y 54~310)이 hook 질문 헤딩(y 66~149) 위에 겹침 → 질문 텍스트 상당 부분이 가려짐. 증빙: `poc-hook.png`.
- 원인 (getComputedStyle 실측): 콘텐츠 `style.css`는 `#scene-hook.active { padding-top: clamp(252px, 35vw, 294px) }`로 헤딩을 썸네일 아래로 밀어내도록 설계했으나, 나중에 로드되는 공유 `public/contents/common/mobile.css`의 `@media (min-width: 1024px) { .scene { padding-top: 2rem !important; ... } }`가 `!important`로 덮어써 실제 padding-top이 32px로 적용됨.
- 모바일(390x844)에서는 padding-top 237.9px가 적용되어 겹침 없음 (썸네일 bottom 294.6 < 헤딩 top 317.7). 증빙: `poc-hook-mobile.png` (정상 렌더).
- 권고: 콘텐츠 쪽에서 `#scene-hook.active`의 padding-top에 `!important`를 붙이거나, 썸네일을 absolute 오버레이 대신 일반 플로우 배치로 변경. (지시에 따라 소스는 수정하지 않음)

### [경미] core 씬 스크롤 시 씬 제목이 sticky 진행 바에 일부 가려짐

- `poc-interaction.png` 상단에서 "대응점을 같은 거리에 놓아요" 헤딩이 진행 바 뒤로 일부 잘려 보임. 스크롤 위치에 따른 일시적 현상으로 가독성 영향은 작음. scroll-margin-top 또는 포커스 스크롤 보정 검토 권고.

이외 대비/가독성 문제 없음 — 본문 텍스트, 버튼, 피드백 박스 모두 충분한 대비와 44px 이상 터치 타겟 확인.

## 증빙 파일

- `poc-hook.png` — QA1 hook 씬 (데스크톱, 썸네일 겹침 증빙 겸용)
- `poc-hook-mobile.png` — hook 씬 모바일(390x844) 정상 렌더
- `poc-scenes.png` — QA2 core 씬 진입 (1단계)
- `poc-interaction.png` — QA3 1단계 성공 후 2단계 자동 진행 상태
- `poc-assets.png` — QA4 시점 전체 페이지

## 정리

- 브라우저 세션 종료: 완료 (`playwright-cli close`)
- vite 서버(포트 5199) 종료: 완료 (curl 무응답으로 확인)

## 재검증 — 데스크톱 썸네일 겹침 수정 확인 (2026-07-13, 2차)

수정 내용: 콘텐츠 `style.css`에 `@media (min-width: 1024px) { #scene-container #scene-hook.active { padding-top: clamp(252px, 35vw, 294px) !important; } }` 추가 (style.css 87~92행). 공유 `mobile.css`의 `.scene { padding-top: 2rem !important }`보다 높은 특이도로 재정의.

**판정: PASS**

| 검증 | 뷰포트 | 실측 | 결과 |
|---|---|---|---|
| 데스크톱 겹침 해소 | 1280x900 | padding-top **294px** (기존 32px), 썸네일 bottom 310.4 < 헤딩 top 322.4 | 겹침 없음 |
| 모바일 회귀 | 390x844 | padding-top 237.9px, 썸네일 bottom 294.6 < 헤딩 top 317.7 | 수정 전과 동일, 회귀 없음 |

- 데스크톱에서 썸네일 아래에 질문 헤딩·학습목표·카드가 온전히 보임. 증빙: `poc-hook-desktop-fixed.png`
- 모바일 렌더는 수정 전(`poc-hook-mobile.png`)과 동일. 증빙: `poc-hook-mobile-recheck.png`
- 콘솔 에러: 재검증 세션에서도 favicon.ico 404 1건뿐 (환경성, 콘텐츠 무관). JS 런타임 에러 0건.
- 재검증 후 브라우저 세션 및 vite 서버(5199) 종료 완료.
