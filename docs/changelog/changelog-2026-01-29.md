# Changelog - 2026-01-29

## 콘텐츠 편집기 "분석 중" 버그 수정

### 문제
- 편집 모드 진입 시 "콘텐츠 분석 중..." 상태가 영원히 유지되는 버그

### 원인
- **Race Condition**: postMessage 통신 타이밍 문제
- ContentEditorPanel이 `onMounted`에서 메시지 리스너를 등록하는데, `watch`가 `immediate: true`로 먼저 실행되어 iframe이 이미 로드된 경우 `EDITOR_READY` 메시지를 놓침

### 수정 내용

#### ContentEditorPanel.vue
1. 메시지 리스너를 `onMounted` 대신 **setup 단계에서 즉시 등록** (race condition 방지)
2. 3초 타임아웃 후 **재시도 메커니즘** 추가
3. 디버깅용 console.log 추가

#### editor-bridge.js
1. 초기화 완료 후 **자동 EDITOR_READY 전송** (부모가 리스너를 등록하기 전에 메시지를 놓쳤을 경우 대비)
2. 디버깅용 console.log 추가

### 수정된 파일
```
src/components/editor/ContentEditorPanel.vue  - 리스너 조기 등록 + 재시도 로직
public/contents/common/editor-bridge.js       - 자동 EDITOR_READY 전송
src/components/viewer/ContentViewer.vue       - editor-bridge.js 동적 주입
```

### 추가 원인 발견 및 수정
- **editor-bridge.js가 단 1개 콘텐츠(circle-area)에만 포함**되어 있었음
- ContentViewer.vue에서 편집 모드일 때 **동적으로 스크립트 주입**하도록 수정
- 모든 콘텐츠 HTML 파일 수정 없이 편집 기능 작동

### 검증 방법
1. `bun run dev:all`로 개발 서버 실행
2. 아무 콘텐츠 클릭 → 뷰어 진입
3. "편집" 버튼 클릭
4. "콘텐츠 분석 중..." 상태가 3초 내 해제되고 편집 패널 표시 확인
5. 브라우저 콘솔에서 `[Editor]`, `[Bridge]` 로그 확인

---

## 콘텐츠 편집기 및 Export/Import 기능 구현

### 새 기능

#### 콘텐츠 편집 패널 (우측 사이드바)
- 콘텐츠 뷰어 페이지에서 편집 버튼으로 편집 모드 진입
- 탭 기반 UI: 텍스트 / 스타일 / 퀴즈
- iframe postMessage 통신으로 실시간 미리보기
- 1200px 이상 화면에서 우측 360px 패널 표시

#### 텍스트 편집기 (TextEditor.vue)
- 씬별 그룹화된 텍스트 목록
- 제목, 설명, 안내, 대화, 라벨 등 타입별 구분
- 실시간 DOM 업데이트

#### 스타일 편집기 (StyleEditor.vue)
- CSS 변수 기반 색상 편집
- 컬러 피커 + HEX 입력 + 프리셋 색상
- 카테고리별 그룹화 (주요/보조/강조/배경/텍스트)
- 폰트 크기 슬라이더 (80%-120%)

#### 퀴즈 편집기 (QuizEditor.vue)
- 문제 텍스트 수정
- 보기 라벨/값 편집
- 정답 선택 변경
- 피드백 메시지 편집

#### Export/Import 기능
- ZIP 파일로 콘텐츠 내보내기 (index.html, style.css, script.js, manifest.json)
- ZIP 파일 업로드로 콘텐츠 가져오기
- ID 충돌 시 자동 새 ID 생성 (예: `fractions-pizza-2`)

### 새 파일

```
src/types/editor.ts                           - 편집기 타입 정의
src/components/editor/ContentEditorPanel.vue  - 메인 편집 패널
src/components/editor/TextEditor.vue          - 텍스트 편집기
src/components/editor/StyleEditor.vue         - 스타일 편집기
src/components/editor/QuizEditor.vue          - 퀴즈 편집기
src/components/editor/ExportImportButtons.vue - Export/Import 버튼
public/contents/common/editor-bridge.js       - iframe 편집 브릿지
```

### 수정된 파일

```
src/views/ContentView.vue                     - 편집 모드 토글, 패널 통합
src/components/viewer/ContentViewer.vue       - iframe ref expose, editMode prop
server/routes/content.ts                      - 파일 저장/Export/Import API
public/contents/math/elementary/circle-area/index.html - 편집 브릿지 로드 스크립트
```

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| PUT | `/api/content/:id/files` | 콘텐츠 파일 업데이트 |
| GET | `/api/content/:id/export` | ZIP 다운로드 |
| POST | `/api/content/import` | ZIP 업로드 |

### 기술 구현

- postMessage API로 iframe 보안 유지하면서 양방향 통신
- CSS 변수 정규식 치환으로 스타일 영구 저장
- 순수 JavaScript ZIP 구현 (외부 라이브러리 없음)
- CRC-32 체크섬 계산 포함

### 검증 필요 사항

1. 편집 모드 진입 후 텍스트 수정 → iframe 실시간 반영 확인
2. 색상 변경 → 즉시 적용 확인
3. 저장 → 새로고침 후 변경사항 유지 확인
4. Export → ZIP 다운로드 후 압축 해제 검증
5. Import → 새 콘텐츠로 등록 및 재생 확인

---

## 개발 문서화 체계 구축

### 새 문서 디렉토리 구조

```
docs/
├── README.md                      # 문서 허브 (전체 네비게이션)
│
├── overview/                      # 비개발자용 개요
│   ├── introduction.md            # 프로젝트 소개
│   ├── system-diagram.md          # 시스템 구성도 (ASCII 다이어그램)
│   ├── content-structure.md       # 콘텐츠 조직 방식
│   └── user-guide.md              # 사용자 가이드
│
├── architecture/                  # 개발자용 아키텍처
│   ├── frontend.md                # Vue 3 + TypeScript 구조
│   ├── backend.md                 # Bun HTTP 서버 구조
│   ├── data-flow.md               # 데이터 흐름도
│   └── code-patterns.md           # 코드 컨벤션 및 패턴
│
├── api/                           # API 명세
│   ├── endpoints.md               # REST API 엔드포인트 상세
│   └── schemas.md                 # TypeScript 타입 기반 스키마
│
├── content-system/                # 콘텐츠 시스템
│   ├── eduflix-engine.md          # EduFlixEngine 가이드
│   ├── ai-generation.md           # AI 생성 흐름
│   ├── content-manifest.md        # 매니페스트 스키마
│   └── styling-guide.md           # CSS 스타일링 패턴
│
└── deployment/                    # 배포 가이드
    ├── vercel.md                  # Vercel 배포 (기존 이동)
    └── cloudflare-tunnel.md       # Cloudflare Tunnel 백업 배포
```

### 문서 특징

- **한국어** 작성
- **GitHub Flavored Markdown** 형식
- **ASCII 다이어그램**으로 시각화 (외부 의존성 없음)
- **코드 블록**에 문법 하이라이팅
- **상호 참조 링크**로 문서 간 네비게이션

### 대상별 문서 분류

| 대상 | 디렉토리 | 목적 |
|------|----------|------|
| 비개발자 | overview/ | 프로젝트 이해, 사용 방법 |
| 개발자 | architecture/, api/, content-system/ | 구현 상세, 코드 패턴 |
| 운영자 | deployment/ | 배포 및 유지보수 |
