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
