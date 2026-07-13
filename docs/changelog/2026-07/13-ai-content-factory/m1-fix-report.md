# M1 manifest grade 계약 수정

## 판단

- `grade`는 카탈로그 계약의 식별 값이므로 `^(elementary|middle|high)-[1-6]$`만 허용한다.
- `grade`의 학교급 접두사는 `gradeLevel`과 같아야 한다.
- QA는 공용 `validateManifest`를 사용해 같은 규칙을 적용하고, publish는 이미 검증된 값도 실행 컨텍스트의 `grade`와 다시 대조한다.

## 변경 파일

- `agents/content-factory/pipeline/lib/validate.ts`: grade 타입·형식·gradeLevel 정합 검증
- `agents/content-factory/pipeline/lib/validate.test.ts`: 숫자, 자유 문자열, 범위 초과, 접두사 불일치 회귀 테스트
- `agents/content-factory/pipeline/stages/qa.test.ts`: 정적 QA가 잘못된 grade를 거부하는 테스트
- `agents/content-factory/pipeline/stages/publish.ts`: `entry.grade === context.grade` 강제
- `agents/content-factory/pipeline/stages/publish.test.ts`: 실행 grade 불일치 시 카탈로그 보존 테스트

## 검증

- RED: focused 29 pass / 3 fail — schema, QA, publish 구멍 재현
- GREEN: `bun test agents/content-factory/pipeline/lib/validate.test.ts agents/content-factory/pipeline/stages/qa.test.ts agents/content-factory/pipeline/stages/publish.test.ts` — 32 pass / 0 fail
- 참고: `bun test agents/content-factory --silent` — M1 포함 49 pass, 범위 밖 M3의 `judge-contract.test.ts` 1 fail
