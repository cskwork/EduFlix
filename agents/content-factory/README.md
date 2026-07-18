# AI 콘텐츠 팩토리

주제·학년·교과를 입력하면 기획부터 카탈로그 등록까지 이어지는 독립형 CLI 파이프라인이다. 기존 콘텐츠 생성 API를 교체하지 않으며, 각 단계 산출물을 `agents/content-factory/runs/<id>/`에 남겨 중단 후 재개할 수 있다.

## 빠른 시작

```bash
bun run factory -- --topic "선대칭과 점대칭" --grade elementary-5 --subject math
```

필수 옵션은 `--topic`, `--grade`, `--subject`다. 콘텐츠 유형은 `--type simulation|game|quiz|exploration|story`, ID는 `--id <slug>`로 지정한다. 이미지 생성을 건너뛰려면 `--skip-images`, 해당 단계만 실행하려면 `--stage plan|storyboard|assets|build|qa|publish`, 기존 산출물을 다시 만들려면 `--force`를 사용한다.

```text
입력
  │
  ▼
기획 ── 성취기준·목표·오개념
  │
  ▼
스토리보드 ── hook → story → core → quiz → wrap
  │
  ▼
에셋 ── 공용 에셋 우선, 부족분만 이미지 생성
  │
  ▼
빌드 ── 인라인 EduFlixEngine HTML/CSS/JS
  │
  ▼
QA 게이트 ── 정적 검사 + 22항목 교사 관점 심사
  │                 │ 실패: 최대 2회 수정
  ▼                 └──────────────► 빌드
퍼블리시 ── public/contents/index.json 추가
```

## 산출물과 실패 처리

최종 콘텐츠는 `public/contents/<subject>/<gradeLevel>/<id>/`에 생성된다. QA는 네 핵심 파일, manifest 경로, 다섯 씬, 로컬 이미지, 모바일·모션 감소·접근성 계약을 확인한다. 심사 실패가 두 번 수정 후에도 남으면 카탈로그에 등록하지 않고 오류와 `qa-report.json`을 남긴다. 같은 ID는 기본적으로 덮어쓰지 않는다.

기본 생성 엔진은 `ZAI_API_KEY`를 사용하는 Z.ai `glm-5.2`다. Z.ai는 파일을 직접 쓸 수 없으므로 build marker 응답을 검증한 뒤 staging에 기록한다. `FACTORY_LLM_PROVIDER=codex`를 설정하면 기존 Codex CLI의 workspace-write 실행을 사용한다. 두 경로 모두 외부 npm 의존성을 추가하지 않는다.

## 방법론

제작 흐름은 성취기준 매핑, 차시 설계, 원고·스토리보드 선승인, 에셋 제작, HTML5 개발, 교사 검수, 배포로 이어지는 ADDIE 기반 업계 절차를 다섯 AI 단계로 압축한다. 상세 근거와 22개 품질 기준은 [시장 조사](../../docs/changelog/2026-07/13-ai-content-factory/research/market-research.md), 저장소 보존 계약과 재사용 자산은 [저장소 맵](../../docs/changelog/2026-07/13-ai-content-factory/research/repo-map.md)을 참고한다. 실행 규칙은 [공통 방법론](prompts/methodology.md), 기계 판정 기준은 [품질 게이트](checklists/quality-gate.json)에 있다.
