# Changelog - 2026-02-10

## 인기 콘텐츠 집계 범위 개선 (공용 기본 + 개인 옵션)

### 변경 배경
- 기존 인기 콘텐츠는 브라우저 `localStorage` 기반이라 사용자/기기별로 분리되어 노출됨
- 요구사항에 따라 기본 동작을 "모든 사용자 공용"으로 변경하고, 개인 집계는 옵션으로 유지

### 주요 변경
- 추천 집계 범위 타입 추가: `shared | personal`
- 기본 집계 범위를 `shared`로 설정
- 홈 화면에 집계 범위 토글 UI 추가
  - `전체 공용` (기본)
  - `개인`
- 홈 화면에 인기 콘텐츠 초기화 버튼 추가
- 공용 모드에서 추천/클릭/통계/초기화는 서버 API를 우선 사용
- 서버 연결 실패 또는 정적 모드에서는 기존 `localStorage` 방식으로 자동 폴백

### 백엔드 변경
- `POST /api/recommendations/clear` 엔드포인트 추가
- 추천 데이터 전체 삭제 서비스 함수(`clearAllClicks`) 추가

### 테스트
- `tests/unit/recommendations-api.test.ts` 신규 추가
  - 기본 스코프 `shared` 검증
  - `shared` 클릭 기록 시 서버 API 호출 검증
  - `personal` 모드 localStorage 동작 검증
  - `shared` 초기화 시 clear API 호출 검증

### 수정된 파일
- `src/services/api/recommendations.ts`
- `src/stores/content.ts`
- `src/views/HomeView.vue`
- `server/services/recommendations.ts`
- `server/routes/recommendations.ts`
- `tests/unit/recommendations-api.test.ts`
