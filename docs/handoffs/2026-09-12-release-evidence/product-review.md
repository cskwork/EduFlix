# 작업실·생성 API 배포 전 검토

검토일: 2026-09-12. 변경 범위는 앱·서버·API·빌드 설정·문서입니다. 이 검토에서 제공자 호출과 배포는 실행하지 않았으며, 기존 콘텐츠와 sandbox 권한은 수정하지 않았습니다.

## 발견과 수정

1. **기존 immutable 캐시가 수정한 수업을 가릴 수 있었습니다.** 동일 HTML 주소에 쿼리만 붙여도 상대 `script.js`와 CSS의 주소는 바뀌지 않습니다. 콘텐츠 파일 트리 해시를 사용하는 `/content-revisions/<hash>/...` 경로, Vercel rewrite, 산출물의 절대 콘텐츠 참조 변경으로 HTML과 자식 주소를 함께 바꿨습니다. 원본은 유지합니다. 이전 revision alias도 현재 배포를 가리키므로 캐시 헤더는 재검증을 요구합니다.
2. **업로드 후보에 실제 환경 파일과 DB가 포함되었습니다.** Coordinator가 `vercel deploy --dry --format=json`에서 확인했습니다. `.vercelignore`에 환경 파일·DB·키·로컬 에이전트 상태·증빙·생성 산출물 제외를 추가했습니다. 공개 플래그 파일과 예시 파일만 예외로 유지합니다. 최종 dry-run 제외 증명은 coordinator가 담당합니다.
3. **정답 보기를 지우면 다른 보기가 자동으로 정답이 되었습니다.** 이제 정답을 미선택 상태로 만들고 교사가 다시 고르게 합니다. 저장 검증은 미선택 정답을 거부합니다.
4. **유효한 큰 한글 수업을 내보낸 뒤 가져올 수 없었습니다.** 35개 블록에 각 6,000자 한글을 넣으면 기존 스키마에는 맞지만 JSON이 500KB를 넘습니다. 수업 가져오기 상한을 8MiB로 통일하고 UTF-8 바이트로 검사합니다. 같은 수업의 JSON과 HTML 재가져오기를 검증했습니다. ZIP용 기존 2MiB 제한은 변경하지 않았습니다.
5. **배포 문서가 현재 구현과 달랐습니다.** 정적 전용·AI 비활성·기존 rewrite·1년 불변 캐시 설명을 현재 함수·작업실·환경 변수·revision·검증 절차로 교체했습니다.

## 확인한 경계

- API는 Vercel에서 제거되는 타입 전용 수업 import와 Node 내장 `node:vm`만 추가로 사용합니다. 새 런타임 상대 import나 의존성을 추가하지 않았습니다.
- Bun은 기존 `checkWriteAccess` 후 수업 계획을 검증하고 editable 분기를 호출합니다. 기존 생성 job은 202를 유지합니다. Codex 제공자 설정에서 editable 분기는 Z.ai 필요 오류를 반환합니다.
- AI 생성·교육 검토·재생성은 하나의 285초 deadline을 공유합니다. malformed verdict, 잘못된 정답 인덱스, 부족한 블록 구성, 실패한 검토는 결과를 반환하지 않습니다.
- 클라이언트의 생성 실패·취소·생성 중 편집에는 기존 수업을 유지합니다. 저장은 IndexedDB 트랜잭션 완료 후 성공으로 처리하며, 비동기 저장 도중 편집한 최신 상태를 이전 스냅샷으로 덮지 않습니다.
- JSON/HTML 가져오기는 기존 ID를 덮지 않고 새 사본을 만듭니다. 일반 HTML의 실행 코드를 가져오지 않고 지정된 수업 JSON만 읽습니다. 기존 ZIP 경로와 파일 구성 계약은 유지합니다.

## 이번 검증

- 집중 Vitest 40개 통과: `lesson-studio`, `content-revision`, `vercel-config`, `content-loader`, `local-content`, `editor-overrides`.
- 변경 파일 ESLint 통과, `npm run build` 통과.
- production build revision: `ce475811a17717b4`. 후속 콘텐츠 수정이 있으면 해시는 다시 계산됩니다.
- 로컬 production preview의 revision 경로에서 catalog, chemical-reactor HTML/JS/CSS, common/editor-bridge를 HTTP 200으로 가져오고 바이트 해시가 각 `dist/contents` 파일과 같음을 확인했습니다. MIME도 JSON/HTML/JS/CSS로 확인했습니다.
- 상대 `../../../common/engine.js`가 같은 revision 아래로 해석됨, 절대 `/contents` 참조 변경, 외부 URL·Blob·Bun/dev 경로 불변을 테스트했습니다.
- Bun 정적 라우터도 revision alias를 지원합니다. `server/static.bun.test.ts`와 `server/content-storage.bun.test.ts` 18개가 통과했으며, live public 우선순위와 네 파일 export/import 호환성을 포함합니다. 서버 export는 manifest.path 대신 subject/grade/id로 원본 public 디렉터리를 구성합니다.
- 원본 카탈로그에는 revision 경로가 추가되지 않았습니다. build 산출물에서만 변경됩니다.

## 릴리스 전 남은 증명

- 업로드 dry-run에서 제외 파일이 실제 빠졌는지 coordinator가 확인해야 합니다.
- 실제 Vercel rewrite와 cache header, 새 revision의 내용, 기존 캐시가 있는 브라우저의 새 앱 진입을 배포 후 검증해야 합니다.
- 이미 열려 있는 이전 앱은 자동 교체되지 않습니다. 브라우저 취소는 UI 요청을 중단하지만 이미 진행 중인 제공자 작업의 과금 취소까지 보장하지 않습니다.
- 수업 교육 검토는 LLM의 판단이며 사실 정확성·학년 적합성을 인증하지 않습니다. 기존 임의 코드 콘텐츠의 same-origin sandbox 위험은 별도 운영 과제이며 이번에 변경하지 않았습니다.

현재 코드에서 확인된 위 결함은 수정했습니다. 배포 입력 제외 및 실제 배포 증명이 완료되기 전에는 공개 배포 검증이 완료됐다고 판정하지 않습니다.
