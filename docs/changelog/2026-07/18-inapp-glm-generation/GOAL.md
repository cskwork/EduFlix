# Goal: 인앱 GLM 콘텐츠 생성

## Spec

EduFlix가 sibling `art-assets` 없이 Z.ai GLM-5.2 또는 선택적 Codex 엔진으로 콘텐츠 팩토리 전체 단계를 인프로세스 실행한다.

## Success Criteria

- [ ] `engine.ts`가 기본 Z.ai와 선택적 Codex의 텍스트·파일 생성을 라우팅하며 단위 테스트로 증명된다.
- [ ] `zai.ts`가 SSE content만 수집하고 JSON/마커 정규화, 2회 시도, 타임아웃을 단위 테스트로 증명한다.
- [ ] plan/storyboard/assets/build/qa가 엔진 추상화를 사용하고 기존 검증·격리·QA 재시도 계약을 보존한다.
- [ ] 웹 factory runner가 plan부터 publish까지 백그라운드 실행하고 진행률, 안전한 최종 ID, 중복 접미사, 실패, 동시 1건 제한을 테스트로 증명한다.
- [ ] generate/review/preview/health가 로컬 runner 계약을 사용하며 키 미설정 생성 요청은 503을 반환한다.
- [ ] 비문서 코드·설정·스크립트에서 `art-assets` 의존이 제거되고 science 생성 선택이 복원된다.
- [ ] plan 스키마·publish 연결과 네 프롬프트 개선이 스펙을 충족한다.
- [ ] `bun run test`, `bun run lint`, `bun run build`가 모두 통과한다.
- [ ] `.env`와 `public/contents/**`는 변경되지 않고 git commit은 생성하지 않는다.

## Decision Gates

- Resolved: 사용자 제공 `spec.md`를 승인된 상세 계획으로 사용한다.
- Resolved: 사용자 지정 체크아웃에 미커밋 변경을 남겨야 하므로 별도 worktree·commit 단계는 생략한다.
- Resolved: 변경 전 전체 테스트의 카탈로그/iframe 실패는 현재 저장소 계약과 모순되는 테스트 기대값만 최소 갱신하며 콘텐츠 파일은 수정하지 않는다.
