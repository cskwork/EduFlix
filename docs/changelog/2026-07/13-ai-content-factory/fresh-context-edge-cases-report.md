# Fresh-context Improve edge cases 결과

## 판단

명시 계약으로 재현된 결함 8개를 최소 수정했다. 제품 선택이 필요한 3개 항목은 엄격한 새 의미론을 만들지 않고 `ASK-USER`로 남겼다. `src/`, `server/`, `public/contents/`, `public/contents/index.json`은 수정하지 않았다.

## 수정한 grounded 결함

| 결함 | 재현 조건과 근거 | 최소 수정 | 대응 테스트 |
|---|---|---|---|
| 혼합 한글 topic ID 충돌 | `대칭 AI`, `회전 AI`가 모두 `ai`가 되어 같은 run/content ID를 사용했다. | ASCII가 아닌 의미 문자가 제거되면 정규화한 원문 hash를 slug에 붙인다. | `run.test.ts` 혼합 topic 두 ID의 안전성·비동일성 |
| 단독 stage 선행 산출물 오인 | `--stage build`에 plan/storyboard/assets가 없으면 빈 run 디렉터리를 만든 뒤 raw `ENOENT`가 발생했고 QA는 정적 QA 경로로 오인할 수 있었다. | run 디렉터리 생성 전 stage별 선행 파일 preflight와 명시 오류를 추가하고 기존 콘텐츠 정적 QA를 명시 모드로 분리했다. | `run.test.ts` build 선행 3파일 오류·빈 run 미생성 |
| 실패한 텍스트 재생성이 이전 결과 삭제 | `--force`에서 Codex 두 번 실패 시 기존 JSON을 시도 전에 삭제했다. fenced/잘못된 스키마 JSON도 정식 stage 파일을 오염시켰다. | 같은 디렉터리 temp에 쓰고 단계 스키마 검증까지 성공한 뒤 rename한다. 실패·재시도 뒤 temp만 제거한다. | `codex.test.ts` fenced JSON 2회 실패 후 이전 JSON 보존 |
| 실패한 이미지 재생성이 이전 PNG 삭제 | 이미지 Codex 실패 시 기존 PNG를 먼저 삭제했다. | `.tmp.png`에 생성·크기 검증 후 rename한다. | `codex.test.ts` 이미지 실패 후 이전 PNG 보존 |
| timeout 자식 프로세스 잔존 | shell 형태 Codex가 자식을 띄운 뒤 timeout되면 직접 프로세스만 kill될 수 있었다. | Bun의 detached process group을 사용하고 POSIX timeout 시 그룹 전체를 `SIGKILL`한다. | `codex.test.ts` 두 재시도에서 생성된 자식 PID 모두 종료 |
| 빌드 계약 외 산출물 수용 | staging에 `unexpected.txt`를 써도 4파일만 복사하고 성공했다. 프롬프트의 “정확히 네 핵심 파일” 계약과 달랐다. | staging 최상위가 정확히 네 일반 파일인지 검사하고 디렉터리·symlink·추가 파일을 거부한다. | `build.test.ts` 추가 파일 거부·최종 미승격 |
| 빌드 중간 실패의 혼합 버전 | 첫 파일 승격 뒤 두 번째 `.factory-next` 쓰기 실패 시 `new index.html + old 나머지`가 남았다. | 네 candidate를 먼저 준비하고 기존 4파일을 backup한 뒤 승격한다. 실패 시 승격분 제거·backup 복원, next/backup을 정리한다. | `build.test.ts` 중간 실패 후 기존 4파일·temp 상태 보존 |
| 성공 QA의 비재개 | publish 일시 실패 뒤 재실행하면 입력·콘텐츠가 동일해도 Codex judge를 다시 호출했다. | 기존 report의 pass 구조, content 경로, 상위 입력 digest, 4파일·이미지 digest가 모두 현재일 때만 skip한다. | `qa.test.ts` 동일 report 재개, script 변경 시 재개 거부 |
| 루트가 아닌 `contents` 수정 | `metadata.contents`가 루트보다 먼저 나오면 중첩 배열에 추가하고 성공처럼 `lastUpdated`만 바꿨다. 중복 루트 키도 허용했다. | JSON scanner가 정확히 하나의 루트 `contents` 배열만 찾도록 했다. | `publish.test.ts` 중첩 key 무시·중복 루트 key 거부 |
| 죽은 owner의 publish lock 영구 차단 | 프로세스 crash가 빈 `.lock`을 남기면 이후 모든 publish가 영구 실패했다. | 새 lock에 PID/시각을 기록하고 `kill(pid, 0)`이 `ESRCH`인 확실한 dead-owner lock만 회수한다. 알 수 없는/살아 있는 lock은 보수적으로 차단한다. | `publish.test.ts` dead PID stale lock 회수·등록 성공 |

## 수정하지 않은 항목

- Markdown fenced JSON 자동 복구: **미수정**. 각 프롬프트가 JSON-only를 명시하므로 fence는 오염이며, 현재처럼 schema 검증 실패→1회 재시도→실패가 근거 있는 동작이다.
- 잘못된 grade/subject/type/stage, 빈/공백 topic, unsafe `--id`, 최초 `runs/` 부재: **미수정**. 기존 검증·recursive mkdir가 이미 요구 동작을 만족했다.
- publish index 원자성: **추가 수정 없음**. 같은 디렉터리의 고유 temp write→JSON parse→rename이며 실패 시 원본 보존, finally temp 정리가 이미 구현돼 있었다.
- 중복 catalog ID: **추가 수정 없음**. 전체 기존 ID 중복을 먼저 거부하고 새 ID는 exact string equality로 판정하며, `--force`만 해당 항목을 교체했다.
- 경로 이탈: **추가 수정 없음**. generated 이름 allowlist, reused public group allowlist+실제 주입 목록 membership, build 전용 staging sandbox, 4개 regular-file 승격으로 차단된다.

## ASK-USER

- 중복 value flag: 충돌 플래그를 거부할지, shell override 용도로 last-value-wins를 문서화할지 선택 필요.
- `--help`와 잘못된 flag 동시 입력: help 우선과 strict parse 모두 합리적이다.
- 서로 다른 ID의 동시 publish: 현재 fail-fast lock을 유지할지 bounded retry/jitter로 직렬화할지 운영 정책 필요.
- `--force`의 content+catalog 단일 트랜잭션: catalog 실패 때 새 content를 rollback할지, 재실행 가능한 최신 content를 유지할지 둘 다 가능한 의미론이다. generation directory/journal 도입 여부를 결정해야 한다.

## 잔여 위험

- 4파일 backup/rollback은 실패 후 기존 상태를 복구하지만, 독자가 동시에 파일을 읽는 순간까지 하나의 원자적 디렉터리 전환으로 만들지는 않는다.
- content 디렉터리와 catalog를 하나의 crash-safe transaction으로 묶는 generation-directory/journal 설계는 현재 PLAN의 최소 diff를 넘어 이번 패스에서 수행하지 않았다.
- Windows는 detached process-group kill의 POSIX 검증 범위 밖이며 직접 subprocess `SIGKILL` fallback만 사용한다.

## 검증

- red: 신규 테스트 추가 직후 `34 pass / 5 fail / 1 module export error`, 이후 publish/QA red `37 pass / 4 fail / 1 module export error`, build rollback red `44 pass / 1 fail`을 확인했다.
- green: 최종 `bun test agents/content-factory --silent` → `46 pass / 0 fail / 109 expect()`.
- `bun run factory -- --help` → exit 0.
- `bun build --no-bundle agents/content-factory/pipeline/run.ts --outfile /tmp/ai-content-factory-edge-run.js` → exit 0.
- `bunx tsc --noEmit --pretty false` → exit 0, 출력 없음.
- `git status --short -- src server public/contents public/contents/index.json` → 출력 없음.
