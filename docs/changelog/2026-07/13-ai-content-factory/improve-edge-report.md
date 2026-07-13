엣지케이스 개선을 완료했습니다. grounded 결함 10개를 red-green 방식으로 최소 수정했고, 의미론 선택이 필요한 4건은 `ASK-USER`로 남겼습니다.

### 발견·수정 결함

| 결함 | 재현 조건·근거 | 판단 |
|---|---|---|
| 한글+ASCII topic ID 충돌 | `대칭 AI`, `회전 AI`가 모두 `ai` | 원문 hash를 추가해 수정 |
| 단독 stage의 raw ENOENT | 선행 JSON 없이 `--stage build` 실행 | 파일명을 명시하고 빈 run 디렉터리도 만들지 않도록 수정 |
| 실패한 JSON 재생성의 기존 파일 삭제 | `--force` 후 Codex 2회 실패 | temp→검증→rename으로 수정 |
| fenced/잘못된 스키마 JSON 오염 | Codex가 코드펜스 JSON 반환 | 단계별 schema 검증 후에만 승격 |
| 실패한 이미지 재생성의 PNG 삭제 | 이미지 Codex 실패 | `.tmp.png` 검증 후 rename |
| timeout 자식 프로세스 잔존 | Codex shell이 child를 생성 | detached process group 전체 종료로 수정. [Bun의 process-group 동작](https://bun.sh/reference/bun/Spawn/SpawnOptions)을 기준으로 적용 |
| 빌드의 추가 파일 수용 | staging에 `unexpected.txt` 생성 | 정확히 4개 일반 파일만 허용 |
| 빌드 중간 실패의 혼합 버전 | 첫 파일 교체 후 다음 승격 실패 | candidate 선준비 + backup/rollback 추가 |
| 성공 QA 불필요 재실행 | publish 실패 후 재시작 | 입력·파일 digest가 동일한 성공 QA만 재개 |
| 잘못된 catalog `contents` 수정 | `metadata.contents`가 루트보다 먼저 등장 | 정확히 하나의 루트 `contents`만 수정 |
| crash 후 publish 영구 잠금 | 죽은 PID의 `.lock` 존재 | owner PID가 확실히 죽은 lock만 회수 |

### 미수정 판단

- 잘못된 grade/subject/type/stage, 빈 topic, unsafe ID, 최초 `runs/` 부재: 기존 처리가 정상.
- fenced JSON 자동 추출: JSON-only 계약과 충돌하므로 엄격한 거부 유지.
- `index.json`: 기존 temp write→parse→rename 구조가 원본 보존을 만족.
- catalog 중복 ID: exact equality와 기존 전체 중복 검사가 정상.
- 경로 이탈: asset allowlist, staging sandbox, 4파일 승격으로 차단됨.
- 금지 경로 `src/`, `server/`, `public/contents/`, `public/contents/index.json`: 변경 없음.

`ASK-USER`:

- 중복 value flag를 거부할지 last-value-wins로 둘지
- `--help`와 잘못된 flag가 함께 있을 때 우선순위
- 서로 다른 ID의 동시 publish를 fail-fast로 둘지 bounded retry할지
- `--force`에서 content와 catalog를 하나의 rollback transaction으로 묶을지

전체 근거는 [fresh-context-edge-cases-report.md](/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix-runs/ai-content-factory/docs/changelog/2026-07/13-ai-content-factory/fresh-context-edge-cases-report.md)에 기록했습니다.

검증 결과:

- `bun test agents/content-factory --silent`: **46 pass, 0 fail, 109 assertions**
- `bunx tsc --noEmit --pretty false`: exit 0
- CLI 트랜스파일 및 `--help`: exit 0
- run-state JSON 검증: 통과