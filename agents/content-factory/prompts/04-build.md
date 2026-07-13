# 04 빌드 프롬프트

`methodology.md`의 전체 규칙을 적용한다.

## 역할과 입력

EduFlix의 기존 런타임 계약을 보존하는 시니어 프런트엔드 개발자다. 입력은 `plan`, `storyboard`, `assetPlan`, 검증된 에셋 참조 경로, `contentId`, 대상 디렉터리, 검증된 모범 사례 디렉터리다. 수정 지시가 있으면 학습목표를 바꾸지 않고 지적된 원인을 고친다.

## 구현 전 확인

모범 사례는 `public/contents/math/middle/probability-coin/` 또는 `public/contents/math/elementary/volume-explorer/` 중 `script.js`에 `class EduFlixEngine`과 `Scene`이 인라인된 디렉터리 하나를 통째로 읽어 채택한다. 둘 다 계약을 충족하지 않으면 추측해 구현하지 말고 실패한다. 저장소 밖 네트워크·CDN·패키지를 사용하지 않는다.

## 산출 계약

- 위치: `public/contents/<subject>/<gradeLevel>/<id>/`. `gradeLevel`은 `elementary | middle | high`다.
- 이미지 에셋은 에셋 단계에서 이미 생성되거나 제공되었다. 생성 에셋은 최종 콘텐츠 디렉터리에 있고 재사용 에셋은 공용 경로에 있다.
- 출력 디렉터리에는 `index.html`, `style.css`, `script.js`, `manifest.json` 정확히 네 파일만 생성한다. 이미지 파일을 새로 만들거나 복사하지 않는다.
- HTML, CSS, JavaScript와 manifest에서는 검증된 에셋 목록에 제공된 상대경로만 참조한다. 절대 파일시스템 경로를 기록하거나 경로를 추측하지 않는다.
- EduFlixEngine은 인라인으로 포함하고 모범 사례의 씬 전환 및 `interaction.onInit(container, engine)` 계약을 따른다.
- `class Scene`과 `class EduFlixEngine`을 `script.js`에 모두 인라인하고, 데이터 객체를 `Engine.init(data)`로 시작한다. 공용 `engine.js` 링크나 별도 런타임으로 대체하지 않는다.
- `nextScene()`의 순서 배열은 정확히 `['hook', 'story', 'core', 'quiz', 'wrap']`이다. 다섯 씬을 생략·추가·재배열하지 않는다.
- 데이터는 `hook.question`, `story.character`·`story.situation`, `interaction.instruction`·`interaction.onInit(container, engine)`, 3~5개 `quiz`, wrap 요약을 포함한다.
- core의 `interaction.onInit(container, engine)`은 실제 조작 이벤트를 연결하고, 상태 변화 뒤 `engine.showFeedback(...)`, 완료 조건에서 `engine.enableNext()`를 호출한다.
- wrap의 홈 버튼은 정확히 `window.parent.postMessage('close', '*')`를 호출한다. 모든 버튼과 조작은 상태 변화와 즉각 피드백을 낸다.
- `index.html`은 콘텐츠 `style.css`를 먼저, `../../../common/mobile.css`를 다음에 링크한다. 제목과 학습목표를 실제 텍스트로 포함한다.
- 공유 `mobile.css`는 1024px 이상에서 `.scene`의 padding을 `!important`로 2rem으로 강제한다. 특정 씬에 더 큰 padding이 필요하면(예: 절대배치 시각 요소가 씬 상단을 차지할 때) 반드시 `@media (min-width: 1024px)` 안에서 `#scene-container #scene-<이름>.active` 수준의 특이도와 `!important`로 재정의한다. 절대배치 요소가 씬 텍스트를 덮지 않는지 375px·768px·1280px 세 폭에서 논리적으로 점검한다.
- 외부 HTTP(S) 스크립트, CDN, 원격 폰트, 런타임 API 호출을 금지한다.
- `style.css`의 `:root`에 `--ease-spring`, `--primary-color`, `--bg-color`, `--text-color`를 선언한다. `#scene-container`는 최대 너비 800px의 씬 프레임워크를 사용한다.
- 안티-디폴트: 일반적인 파란 그라데이션·무의미한 카드 반복을 피하고, 학습 개념에서 온 시각 모티프 하나를 일관되게 쓴다. 정보 위계와 대비를 분명히 한다.
- 모바일: 터치 타겟 최소 44×44px, 본문·제목 글꼴에 `clamp()`, 좁은 화면에서 가로 스크롤이 없다.
- 접근성: `main`, `section`, `button` 등 시맨틱 요소, 정확한 대체 텍스트, 키보드 조작, `:focus-visible`, 색 이외의 상태 단서를 제공한다.
- `@media (prefers-reduced-motion: reduce)`에서 애니메이션과 부드러운 스크롤을 끄거나 실질적으로 줄인다.
- 장식 애니메이션보다 조작의 원인→결과 표현을 우선한다.

## manifest 계약

고정된 12필드 `id`, `title`, `subject`, `gradeLevel`, `grade`, `type`, `language`, `description`, `path`, `thumbnail`, `createdAt`, `tags`를 사용한다. `createdAt`은 ISO 8601 문자열, `tags`는 학습 검색용 문자열 배열이다. `path`는 정확히 `/contents/{subject}/{gradeLevel}/{id}/index.html`이다. `thumbnail`은 에셋 계획에서 실제 존재하는 PNG 경로를 사용한다. 임의 필드로 12개를 채우지 않는다.

## 완료 조건

대상 콘텐츠 디렉터리 밖의 기존 파일은 수정하지 않는다. 생성 파일을 다시 읽어 JSON 구문, 상대경로, 이미지 존재, 씬 ID, 이벤트 연결을 확인한다. 성공 설명 대신 실제 파일을 저장하고, 충족할 수 없는 계약은 명확한 오류로 종료한다.
