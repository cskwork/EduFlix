# Vercel 배포와 검증

배포 대상은 Vue/Vite 정적 앱과 `api/generate.ts` 서버리스 함수입니다. 로컬 Bun 서버의 비동기 팩토리와 파일 쓰기 API는 Vercel에 배포하지 않습니다. 수업 작업실은 브라우저 IndexedDB에 저장하며 AI 초안만 기존 생성 API를 호출합니다.

## 빌드 입력과 환경 설정

- `npm run build`는 TypeScript 검사와 Vite 빌드를 실행하고 `dist/`를 만듭니다.
- Vercel 프로젝트에는 `VITE_STATIC_MODE=true`, `VITE_SERVERLESS_GENERATION=true`를 **빌드 전에** 설정해야 합니다. Vite 환경 변수는 실행 시가 아니라 빌드 때 결정됩니다. 저장소의 `.env.production`은 로컬 기본값이므로 프로젝트 설정을 확인하세요.
- AI에는 `ZAI_API_KEY`, 선택적으로 `ZAI_MODEL`, `ZAI_API_URL`, `ZAI_REASONING_EFFORT`를 설정합니다. GLM-5.3 계열의 서버리스 reasoning effort 기본값은 `low`입니다. `high`와 `max`는 제한 시간 안에 끝나지 않을 수 있습니다.
- `ADMIN_TOKEN`과 `ALLOW_PUBLIC_GENERATION`은 기존 접근 정책을 결정합니다. 공개 생성 허용 여부는 운영자가 명시적으로 확인하세요. 키 값을 클라이언트 변수나 저장소에 넣지 않습니다.
- `.vercelignore`는 실제 `.env`, 데이터베이스, 에이전트 설정·메모, 로컬 증빙과 키 파일을 제외합니다. `.env.production`에는 공개 Vite 플래그만, `.env.example`에는 예시만 있어야 합니다. 업로드 전 dry-run 목록을 확인하세요. [Vercel 제외 파일 안내](https://vercel.com/docs/deployments/vercel-ignore)

## 라우팅과 콘텐츠 갱신

`vercel.json`의 첫 rewrite는 `/content-revisions/:revision/:path*`를 `/contents/:path*`로 연결합니다. 다음 SPA rewrite는 `api`, `contents`, `content-revisions`, `assets`를 제외합니다. `/studio`, `/create` 등의 앱 경로만 `index.html`로 연결합니다.

빌드는 `public/contents` 파일 이름과 내용의 해시로 콘텐츠 revision을 만듭니다. 앱의 카탈로그·iframe·썸네일·편집 브릿지는 `/content-revisions/<hash>/...` 주소를 사용합니다. 예를 들어 그 iframe의 `script.js` 상대 주소도 같은 revision 아래에 남습니다. 빌드 산출물의 절대 `/contents/` 참조도 revision 경로로 바뀝니다. 원본 `public/contents` 파일은 수정하지 않습니다.

이 방식은 이전 배포의 `/contents/...` 응답을 `immutable`로 저장한 브라우저가 같은 주소의 오래된 HTML·JS·CSS를 계속 쓰는 문제를 피합니다. `/contents/*`와 `/content-revisions/*` 응답은 `public, max-age=0, must-revalidate`를 사용합니다. revision alias는 현재 배포 파일을 가리키므로 오래된 revision 주소에 영구 불변 캐시를 적용하지 않습니다.

이미 열려 있는 이전 앱은 자동으로 새 코드가 되지 않습니다. 새 배포를 확인할 때 앱을 다시 열고 새 revision 주소와 실제 자식 파일을 확인하세요. 헤더만 바꾸는 것으로 이전 브라우저의 immutable 항목이 즉시 삭제되지는 않습니다.

개발 서버는 기존 `/contents/`를 유지합니다. 빌드한 앱을 Bun으로 실행할 때는 Bun 정적 라우터도 revision alias를 지원하며, 편집한 public 파일을 오래된 dist보다 우선합니다. `npm run preview`는 production revision alias를 로컬에서 지원합니다. IndexedDB의 Blob 수업과 JSON/HTML 수업 파일은 별도이며 버전 경로로 바꾸지 않습니다. [Vercel rewrites 안내](https://vercel.com/docs/routing/rewrites)

## 생성 경로와 제한

- `editableLesson:true`는 수업 데이터를 작성하고 구조 검사와 교육 검토 후 `{success:true,lesson}`을 반환합니다. 앱이 기존 렌더러로 채점과 화면을 구성합니다. 자동 저장이나 공개 게시를 하지 않습니다.
- 기존 HTML/CSS/JS 생성 응답은 유지됩니다. JS 문법 검사와 교육 검토를 통과해야 반환합니다. 자동 검토는 교사의 사실·정답 확인을 대신하지 않습니다.
- 함수 `maxDuration`은 코드와 `vercel.json`에서 300초이며, 생성·검토·최대 1회 재생성은 285초를 공유합니다. 실패하면 검토되지 않은 결과 대신 오류를 반환합니다.
- Vercel의 요청·응답 크기 제한은 플랫폼 문서와 프로젝트 설정을 함께 확인합니다. 수업 파일 가져오기는 브라우저에서 처리하며 AI 요청에는 파일 전체가 아니라 수업 계획만 보냅니다. [함수 제한](https://vercel.com/docs/functions/limitations)

## 배포 절차

1. 변경 범위, 테스트, build 결과와 업로드 제외 목록을 확인합니다.
2. 연결된 프로젝트와 공개 환경 변수를 확인하고 승인된 배포를 실행합니다.
3. 배포 완료 상태와 실제 production alias 연결을 확인합니다.
4. `/studio` 직접 진입, 새 콘텐츠 revision의 카탈로그·HTML·JS·CSS·공통 자원, 응답 헤더를 확인합니다.
5. 실제 브라우저에서 기존 immutable 캐시가 있더라도 새 revision을 요청하는지 확인합니다. 작업실의 AI 초안, 정답 편집, 미리보기, 저장·재열기, JSON/HTML 왕복을 검증합니다.

`git push`, 로컬 build, HTTP 200 하나만으로 배포 완료나 사용자 동작을 증명하지 않습니다. 릴리스별 증거와 남은 제한은 해당 릴리스 기록에 남깁니다.
