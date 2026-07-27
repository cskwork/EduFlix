# EduFlix

Netflix 스타일의 인터랙티브 교육 콘텐츠 플랫폼

[English](README.md) · **한국어**

[데모](https://eduflix.vercel.app) · [문서](docs/)

## 소개

EduFlix는 초등학생부터 고등학생까지를 대상으로 하는 교육 콘텐츠 플랫폼입니다. Netflix의 직관적인 브라우징 경험과 AI 콘텐츠 자동 생성을 결합해, 공룡·축구·우주처럼 학습자가 관심 있는 무엇이든 소재로 삼아 즉석에서 콘텐츠를 만들고 브라우저에서 바로 학습할 수 있습니다.

모든 콘텐츠는 독립 실행 가능한 바닐라 HTML/CSS/JS 묶음이며 샌드박스 iframe 안에서 실행됩니다. AI가 생성한 코드가 호스트 앱에 접근할 수 없습니다.

### 주요 기능

- **보기 모드** — Netflix 스타일로 콘텐츠를 탐색하고 학습
- **창조 모드** — 관심사 또는 직접 붙여넣은 문제를 바탕으로 AI가 맞춤형 콘텐츠 생성
- **학습맵** — 주제와 선수 지식의 연결 관계 시각화
- **샌드박스 실행** — 콘텐츠는 격리된 iframe에서 실행
- **다국어 UI** — 기본 영어, 헤더에서 한국어로 전환 가능

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Vue 3 + TypeScript + Vite + Pinia |
| Backend | Bun (경량 HTTP 서버) |
| AI | Z.ai의 GLM (프로바이더 교체 가능) |
| Storage | 로컬 파일시스템 (정적 배포 시 IndexedDB) |
| Content | 바닐라 HTML/CSS/JS, 3D는 Three.js |

## 시작하기

### 필수 요구사항

- [Bun](https://bun.sh/) v1.0 이상
- Node.js v18 이상 (선택)

### 설치

```bash
git clone https://github.com/cskwork/EduFlix.git
cd EduFlix

bun install

cp .env.example .env
# .env 파일을 열어 API 키 설정
```

### 환경 변수

`.env.example`을 복사해 필요한 값을 채웁니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `ZAI_API_KEY` | 콘텐츠 생성 시 | 콘텐츠 팩토리가 사용하는 LLM 키 |
| `FACTORY_LLM_PROVIDER` | – | `zai`(기본) 또는 `codex` |
| `ADMIN_TOKEN` | **공개 배포 시** | 쓰기 API 인증 토큰 — [보안](#보안) 참고 |
| `PORT` | – | API 서버 포트 (기본 `3001`) |
| `CORS_ORIGIN` | – | 교차 origin 허용이 필요할 때만 |
| `VITE_ALLOWED_HOSTS` | – | 터널 등 외부 도메인의 dev 서버 접근 허용 |

### 개발 서버 실행

```bash
# 프론트엔드만 (http://localhost:5173)
bun run dev

# 백엔드 API만 (http://localhost:3001)
bun run dev:server

# 둘 다 — 권장
bun run dev:all
# 또는 ./start.sh  (Windows는 start.bat)
```

> 콘텐츠 생성과 "인기 콘텐츠" 섹션(SQLite 기반)에는 API 서버가 필요합니다.

### 프로덕션 빌드

```bash
bun run build     # dist/에 출력
bun run preview   # 빌드 결과 미리보기
bun run start     # 정적 파일 + API를 하나의 Bun 서버로 제공
```

## 보안

콘텐츠 생성·편집·삭제는 LLM 비용과 디스크 쓰기를 유발하므로 **쓰기 계열 요청에 관리자 인증이 필요**합니다.

- **개발**(`NODE_ENV != production`): `ADMIN_TOKEN`을 설정하지 않으면 쓰기 API가 열려 있습니다.
- **공개 배포**(`NODE_ENV=production`, `bun run start`): `ADMIN_TOKEN`이 **필수**입니다. 없으면 쓰기 API가 503으로 비활성화됩니다.

```bash
# 토큰 생성
openssl rand -hex 32

# 서버: .env에 설정
ADMIN_TOKEN=<생성한 값>

# 브라우저: 콘솔에서 한 번 등록
localStorage.setItem('eduflix_admin_token', '<같은 값>')
```

토큰은 `X-Admin-Token` 헤더로 전달됩니다. 브라우저가 자동으로 붙이지 않으므로 CSRF도 함께 차단됩니다. 읽기 API(`GET`)와 콘텐츠 열람은 인증 없이 공개됩니다.

## 다국어 지원

UI는 영어와 한국어를 제공합니다. 기본값은 영어이며, 전환 버튼은 헤더 우측 상단에 있고 선택은 `localStorage`에 저장됩니다.

i18n 계층은 외부 의존성 없이 `src/i18n/`에 구현되어 있습니다. **언어 추가는 2단계면 끝납니다.**

1. `src/i18n/messages/en.ts`를 `src/i18n/messages/<code>.ts`로 복제해 번역합니다. `MessageSchema` 타입으로 선언되므로 키가 빠지면 빌드가 실패합니다.
2. `src/i18n/locales.ts`의 `LOCALES`에 등록합니다.

전환 UI, 저장, `<html lang>`, 문서 타이틀, 콘텐츠 생성 언어는 자동으로 따라옵니다.

메시지 키는 타입으로 관리됩니다. `t('a.b.c')`가 컴파일 타임에 검증되므로, 오타는 런타임에 원시 키가 노출되는 대신 `vue-tsc`에서 실패합니다.

카탈로그 메타데이터는 별도로 현지화됩니다. `manifest.json`의 `title`·`description`은 콘텐츠 원문 언어를 유지하고, 언어별 번역을 선택적으로 덧붙입니다.

```json
{
  "title": "피자로 배우는 분수",
  "translations": {
    "en": { "title": "Fraction Pizza", "description": "Learn what fractions are with a delicious pizza!" }
  }
}
```

검색은 원문과 번역을 모두 매칭합니다. 다만 **콘텐츠 본문 자체는 번역되지 않습니다.** 선택한 언어를 따르는 것은 주변 UI와 카탈로그 메타데이터뿐입니다.

## 프로젝트 구조

```
EduFlix/
├── src/                      # 프론트엔드 소스
│   ├── components/           # Vue 컴포넌트 (common, home, viewer, creator, editor)
│   ├── views/                # 페이지 컴포넌트
│   ├── composables/          # Vue 3 Composables
│   ├── services/             # API·콘텐츠 서비스
│   ├── stores/               # Pinia 상태 관리
│   ├── i18n/                 # i18n 런타임, 언어 레지스트리, 메시지 카탈로그
│   └── types/                # TypeScript 타입
├── server/                   # Bun 백엔드
│   ├── index.ts              # HTTP 서버
│   └── routes/               # API 라우트
├── api/                      # Vercel 서버리스 함수
├── agents/                   # AI 콘텐츠 팩토리 (파이프라인, 프롬프트, 템플릿)
├── public/contents/          # 생성된 콘텐츠
│   ├── index.json            # 콘텐츠 카탈로그
│   ├── knowledge-map.json    # 지식 그래프
│   └── {subject}/{level}/    # 콘텐츠 파일
└── docs/                     # 문서
```

## 콘텐츠 구조

각 콘텐츠는 다음 구조를 따릅니다.

```
public/contents/{subject}/{level}/{content-id}/
├── manifest.json    # 메타데이터
├── index.html       # 메인 콘텐츠
├── style.css        # 스타일 (선택)
└── script.js        # 로직 (선택)
```

### 콘텐츠 타입

| 타입 | 설명 |
|------|------|
| `game` | 게임화된 학습 활동 |
| `quiz` | 퀴즈 및 문제 풀이 |
| `exploration` | 탐험형 학습 |
| `simulation` | 인터랙티브 시뮬레이션 |
| `story` | 스토리 기반 학습 |

### 제작 방식 (renderMode)

교육 형식(콘텐츠 타입)과 독립적으로, 콘텐츠를 **어떻게** 만들지를 결정합니다.

| 방식 | 설명 |
|------|------|
| `3d` | Three.js 시뮬레이션 (**기본값**) |
| `3d-game` | Three.js + 게임 루프 |
| `canvas-game` | Canvas 2D 게임 |
| `svg` | 인터랙티브 SVG |
| `dom` | 클래식 카드·버튼 |

### 포함된 콘텐츠

저장소에는 84개 콘텐츠가 함께 제공됩니다.

| 과목 | 개수 |
|------|------|
| 수학 | 50 |
| 영어 | 23 |
| 과학 | 8 |
| 세계사 | 2 |
| 코딩 | 1 |

학교급별로는 초등 47개, 중등 34개, 고등 3개입니다.

## 키보드 단축키

| 키 | 기능 |
|----|------|
| `h` | 홈으로 이동 |
| `c` | 창조 모드로 이동 |
| `/` | 검색 |
| `ESC` | 이전으로 / 전체화면 종료 |
| 화살표 | 콘텐츠 탐색 |
| `Enter` / `Space` | 콘텐츠 선택 |

## 개발 명령어

```bash
bun run lint       # 린트 검사
bun run lint:fix   # 린트 자동 수정
bun run format     # Prettier 포맷팅
bun run test       # 테스트 실행
bun run factory    # CLI에서 콘텐츠 팩토리 실행
```

## 배포

**Vercel** (주 배포) — `vercel --prod`. `ZAI_API_KEY`, `ADMIN_TOKEN`, `VITE_STATIC_MODE=true`가 필요합니다. 정적 배포에서는 생성이 단일 서버리스 LLM 호출로 처리되고 결과는 브라우저 IndexedDB에 저장됩니다.

**자체 호스팅** — `bun run build` 후 `PORT=9888 bun run start`를 실행하면 정적 파일과 API를 한 프로세스에서 제공하며, 6단계 생성 파이프라인 전체가 동작하고 콘텐츠가 디스크에 저장됩니다.

자세한 내용은 [docs/deployment](docs/deployment/)를 참고하세요.

## 접근성

- 키보드 네비게이션
- 스크린 리더 호환 (ARIA 속성)
- 고대비 모드 지원
- 모션 감소 모드 지원
- 스킵 네비게이션 링크

## 라이선스

[GNU AGPL-3.0](LICENSE) — Copyright (c) 2026 cskwork

네트워크를 통해 이 소프트웨어(또는 수정본)를 서비스로 제공하는 경우, 해당 버전의 전체 소스 코드를 이용자에게 공개해야 합니다.
