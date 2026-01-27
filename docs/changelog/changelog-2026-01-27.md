# 2026-01-27 Changelog

## 포트 기본값 3000 제거

### 변경 사항
- `server/config.ts`: 서버 포트와 art-assets URL 기본값을 분리하고 3000을 사용하지 않도록 설정
- `server/index.ts`: 기본 포트 계산을 `getServerPort()`로 위임
- `server/services/art-assets.ts`: art-assets URL 계산을 `getArtAssetsUrl()`로 위임
- `tests/unit/server-config.test.ts`: 기본 포트가 3000이 아닌지 검증하는 회귀 테스트 추가
- `.env.example`: 기본 포트와 art-assets URL 예시를 3000이 아닌 값으로 갱신

### 기본값
- 서버 기본 포트: `3001`
- art-assets 기본 URL: `http://localhost:3100`

### 주의 사항
- art-assets 서버가 3100이 아니라면 `ART_ASSETS_URL` 환경변수로 명시적으로 설정 필요

## 생성 API HTML 응답 방어 및 헬스 체크 게이트 추가

### 변경 사항
- `src/services/api/claude.ts`: `/api/health` 선행 확인을 추가하고, JSON이 아닌 응답(예: 정적 index.html)에서 명확한 안내 메시지를 반환하도록 방어 로직 보강
- `tests/unit/claude-api.test.ts`: HTML 응답 재현 회귀 테스트 2건 추가

### 기대 효과
- `Unexpected token '<'` 형태의 난해한 JSON 파싱 오류 대신, 백엔드 연결/환경변수 설정 안내 메시지를 사용자에게 제공

### 확인 필요 사항
- 정적 배포 환경이라면 `VITE_STATIC_MODE=true` 설정 검토
- 백엔드를 분리 배포했다면 `VITE_API_URL`이 실제 API 호스트를 가리키는지 확인

## Vercel SPA 리라이트에서 /api 제외

### 변경 사항
- `vercel.json`: SPA 리라이트 정규식에 `api`를 추가해 `/api/*`가 `index.html`로 리라이트되지 않도록 수정
- `tests/unit/vercel-config.test.ts`: `/api` 제외 여부를 검증하는 회귀 테스트 추가

### 영향
- `/api/health`가 더 이상 HTML(index.html)로 응답되지 않음 (이제 404 또는 실제 API 응답)

## 상대 baseUrl 오염 방지: URL 기반 API 결합

### 원인
- `VITE_API_URL`이 상대 경로(예: `/create`)로 설정되거나 주입될 경우, 문자열 결합으로 `/create/api/health`가 호출되어 HTML(index.html)로 응답될 수 있음

### 변경 사항
- `src/services/api/url.ts`: 상대 baseUrl 오염을 방지하는 공용 `buildApiUrl()` 유틸 추가
- `src/services/api/claude.ts`: 공용 `buildApiUrl()`을 사용하도록 변경
- `src/services/api/recommendations.ts`: 공용 `buildApiUrl()`을 사용하도록 변경
- `src/services/api/gemini.ts`: 공용 `buildApiUrl()`을 사용하도록 변경
- `tests/unit/api-url.test.ts`: URL 결합 유틸 회귀 테스트 추가
- `tests/unit/claude-api.test.ts`: 상대 baseUrl(`/create`) 입력 시에도 `/api/health`가 루트로 호출되는지 검증하는 회귀 테스트 추가

### 기대 효과
- `/create/api/health` 같은 잘못된 호출을 구조적으로 방지하여, 간헐적인 “HTML 응답 → JSON 파싱 오류”를 영구적으로 차단

## /api/health에 art-assets 연결 진단 포함

### 변경 사항
- `server/services/health.ts`: art-assets `/api/health`에 타임아웃(1.5초)으로 진단 요청을 보내는 헬스 체크 보조 서비스 추가
- `server/index.ts`: `/api/health` 응답에 `artAssets` 진단 결과를 포함하도록 변경
- `tests/unit/server-health.test.ts`: art-assets 헬스 진단 회귀 테스트 추가
- `server/services/health.ts`: art-assets에 `/api/health`가 없는 경우를 대비해 `OPTIONS /api/generate-content` 폴백 진단 추가

### 기대 효과
- 배포 환경에서 `ART_ASSETS_URL` 미설정 또는 연결 불가 상태를 `/api/health` 한 번으로 확인 가능
- art-assets 서버가 `/api/health`를 제공하지 않아도 연결 가능 여부를 안정적으로 진단

## /api/generate에 art-assets 헬스체크 게이트 추가

### 변경 사항
- `server/services/health.ts`: art-assets 연결 불가 시 안내 메시지를 만드는 `buildArtAssetsUnavailableMessage()` 추가
- `server/routes/generate.ts`: 작업 생성 전에 art-assets 헬스체크를 수행하고, 연결 불가 시 503과 구체적인 안내 메시지를 반환하도록 변경
- `tests/unit/server-health.test.ts`: 안내 메시지 포맷 회귀 테스트 추가

### 기대 효과
- `Unable to connect. Is the computer able to access the url?` 같은 모호한 오류 대신, `ART_ASSETS_URL` 설정 문제를 바로 알 수 있는 메시지 제공
- art-assets가 `/api/health`를 제공하지 않는 경우에도 정상 서버라면 503 게이트에 막히지 않도록 보완

## start 스크립트에서 art-assets 자동 기동

### 변경 사항
- `start.sh`: `../art-assets/server.js`를 포트 3100으로 자동 기동하고, `ART_ASSETS_URL=http://localhost:3100`을 환경변수로 고정하도록 수정
- `start.bat`: art-assets 서버가 3100 포트에서 실행 중인지 확인한 뒤, 미실행 시 자동 기동하도록 수정
- `start.bat`: API 서버 포트 안내를 3000 → 3001로 수정

### 기대 효과
- `./start.sh` 또는 `start.bat` 한 번으로 생성 기능까지 동작하는 개발 환경을 쉽게 재현 가능
