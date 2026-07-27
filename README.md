# EduFlix

Netflix 스타일의 인터랙티브 교육 콘텐츠 플랫폼

## 소개

EduFlix는 초등학생부터 고등학생까지를 대상으로 하는 교육 콘텐츠 플랫폼입니다. Netflix의 직관적인 UI와 AI 기반 콘텐츠 자동 생성 기능을 결합하여 학습을 재미있고 개인화된 경험으로 만들어줍니다.

### 주요 기능

- **보기 모드**: Netflix 스타일의 콘텐츠 브라우징 및 학습
- **창조 모드**: AI(Claude + Gemini)를 활용한 맞춤형 콘텐츠 자동 생성
- **지식맵**: 선수 지식과 콘텐츠 간의 연결 관계 시각화
- **Sandbox 실행**: iframe 기반의 안전한 콘텐츠 실행 환경

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Vue 3 + TypeScript + Vite |
| Backend | Bun (경량 HTTP 서버) |
| AI | Claude (Anthropic) + Gemini (이미지) |
| Storage | 로컬 파일시스템 |
| Content | Vanilla HTML/CSS/JS |

## 시작하기

### 필수 요구사항

- [Bun](https://bun.sh/) v1.0 이상
- Node.js v18 이상 (선택적)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd EduFlix

# 의존성 설치
bun install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 설정
```

### 환경 변수

`.env.example`을 복사해 사용합니다. 주요 항목:

| 변수 | 필수 | 설명 |
|------|------|------|
| `ZAI_API_KEY` | 콘텐츠 생성 시 | 콘텐츠 팩토리가 사용하는 LLM 키 |
| `ADMIN_TOKEN` | **공개 배포 시** | 쓰기 API 인증 토큰. 아래 "보안" 참고 |
| `PORT` | - | API 서버 포트 (기본 3001) |
| `CORS_ORIGIN` | - | 교차 origin 허용이 필요할 때만 |

### 보안

콘텐츠 생성·편집·삭제 API는 LLM 비용과 디스크 쓰기를 유발하므로 **쓰기 계열 요청에 관리자 인증이 필요**합니다.

- **개발**(`NODE_ENV != production`): `ADMIN_TOKEN`을 설정하지 않으면 인증 없이 열립니다.
- **공개 배포**(`NODE_ENV=production`, `bun run start`): `ADMIN_TOKEN`이 **필수**입니다. 설정하지 않으면 쓰기 API가 503으로 비활성화됩니다.

```bash
# 토큰 생성
openssl rand -hex 32

# 서버: .env에 설정
ADMIN_TOKEN=<생성한 값>

# 브라우저: 콘솔에서 한 번 등록
localStorage.setItem('eduflix_admin_token', '<같은 값>')
```

토큰은 `X-Admin-Token` 헤더로 전달됩니다. 브라우저가 자동으로 붙이지 않으므로 CSRF도 함께 차단됩니다.
읽기 API(`GET`)와 콘텐츠 열람은 인증 없이 공개됩니다.

### 개발 서버 실행

```bash
# 프론트엔드 개발 서버 (http://localhost:5173)
bun run dev

# 백엔드 API 서버 (http://localhost:3000)
bun run dev:server

# 프론트엔드 + 백엔드 동시 실행
bun run dev:all
```

### 프로덕션 빌드

```bash
# 빌드
bun run build

# 빌드 결과물 미리보기
bun run preview
```

## 프로젝트 구조

```
EduFlix/
├── src/                      # 프론트엔드 소스
│   ├── components/           # Vue 컴포넌트
│   │   ├── common/          # 공통 컴포넌트
│   │   ├── home/            # 홈 화면 컴포넌트
│   │   ├── viewer/          # 콘텐츠 뷰어
│   │   └── creator/         # 창조 모드 컴포넌트
│   ├── views/               # 페이지 컴포넌트
│   ├── composables/         # Vue 3 Composables
│   ├── services/            # API 서비스
│   ├── stores/              # Pinia 상태 관리
│   └── types/               # TypeScript 타입
├── server/                  # Bun 백엔드
│   ├── index.ts             # HTTP 서버
│   └── routes/              # API 라우트
├── agents/                  # AI 콘텐츠 생성기
│   └── content-generator/   # 템플릿, 프롬프트, 스타일
├── contents/                # 생성된 콘텐츠
│   ├── index.json           # 콘텐츠 카탈로그
│   ├── knowledge-map.json   # 지식맵 데이터
│   └── {subject}/{level}/   # 콘텐츠 파일
└── docs/                    # 문서
```

## 콘텐츠 구조

각 콘텐츠는 다음 구조를 따릅니다:

```
contents/{subject}/{level}/{content-name}/
├── manifest.json    # 메타데이터
├── index.html       # 메인 콘텐츠
├── style.css        # 스타일 (선택)
└── script.js        # 로직 (선택)
```

### 콘텐츠 타입

| 타입 | 설명 |
|------|------|
| game | 게임화된 학습 활동 |
| quiz | 퀴즈 및 문제 풀이 |
| exploration | 탐험형 학습 |
| simulation | 시뮬레이션 |
| story | 스토리 기반 학습 |

## 키보드 단축키

| 키 | 기능 |
|----|------|
| `h` | 홈으로 이동 |
| `c` | 창조 모드로 이동 |
| `/` | 검색 |
| `ESC` | 이전으로/전체화면 종료 |
| `화살표` | 콘텐츠 탐색 |
| `Enter/Space` | 콘텐츠 선택 |

## 개발 명령어

```bash
# 린트 검사
bun run lint

# 린트 자동 수정
bun run lint:fix

# 코드 포맷팅
bun run format

# 테스트 실행
bun run test
```

## 포함된 콘텐츠

| # | 과목 | 학년 | 제목 | 타입 |
|---|------|------|------|------|
| 1 | 수학 | 초3 | 피자로 배우는 분수 | game |
| 2 | 수학 | 초5 | 도형 탐험가 | exploration |
| 3 | 수학 | 중2 | 방정식 퍼즐 | quiz |
| 4 | 과학 | 초4 | 태양계 여행 | simulation |
| 5 | 과학 | 초6 | 전기회로 실험실 | simulation |
| 6 | 과학 | 중1 | 세포 탐험 | exploration |
| 7 | 과학 | 고1 | 화학 반응 시뮬레이터 | simulation |
| 8 | 영어 | 초3 | Word Safari | game |
| 9 | 영어 | 중2 | Grammar Quest | quiz |
| 10 | 영어 | 고1 | Debate Arena | story |

## 접근성

EduFlix는 다음 접근성 기능을 지원합니다:

- 키보드 네비게이션
- 스크린 리더 호환 (ARIA 속성)
- 고대비 모드 지원
- 모션 감소 모드 지원
- 스킵 네비게이션 링크

## 라이선스

[GNU AGPL-3.0](LICENSE) - Copyright (c) 2026 cskwork

네트워크를 통해 이 소프트웨어(또는 수정본)를 서비스로 제공하는 경우, 해당 버전의 전체 소스 코드를 이용자에게 공개해야 합니다.
