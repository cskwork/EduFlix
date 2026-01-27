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
