# EduFlix 개발 문서

Netflix 스타일 인터랙티브 교육 콘텐츠 플랫폼

## 문서 구조

```
docs/
├── README.md              <- 현재 파일 (문서 허브)
├── changelog/             # 변경 이력
│
├── overview/              # 비개발자용 개요
│   ├── introduction.md    # 프로젝트 소개
│   ├── system-diagram.md  # 시스템 구성도
│   ├── content-structure.md # 콘텐츠 구조
│   └── user-guide.md      # 사용자 가이드
│
├── architecture/          # 개발자용 아키텍처
│   ├── frontend.md        # 프론트엔드 아키텍처
│   ├── backend.md         # 백엔드 아키텍처
│   ├── data-flow.md       # 데이터 흐름
│   └── code-patterns.md   # 코드 패턴
│
├── api/                   # API 명세
│   ├── endpoints.md       # API 엔드포인트
│   └── schemas.md         # 요청/응답 스키마
│
├── content-system/        # 콘텐츠 시스템
│   ├── eduflix-engine.md  # EduFlixEngine 가이드
│   ├── ai-generation.md   # AI 생성 시스템
│   ├── content-manifest.md # 매니페스트 스키마
│   └── styling-guide.md   # CSS 스타일링
│
└── deployment/            # 배포 가이드
    ├── vercel.md          # Vercel 배포
    └── cloudflare-tunnel.md # Cloudflare Tunnel
```

---

## 빠른 시작

### 비개발자용
1. [프로젝트 소개](./overview/introduction.md) - EduFlix가 무엇인지 이해
2. [시스템 구성도](./overview/system-diagram.md) - 전체 구조 파악
3. [사용자 가이드](./overview/user-guide.md) - 사용 방법

### 개발자용
1. [프론트엔드 아키텍처](./architecture/frontend.md) - Vue 3 + TypeScript 구조
2. [백엔드 아키텍처](./architecture/backend.md) - Bun HTTP 서버
3. [API 엔드포인트](./api/endpoints.md) - REST API 명세
4. [EduFlixEngine 가이드](./content-system/eduflix-engine.md) - 콘텐츠 엔진 사용법

### 배포
1. [Vercel 배포](./deployment/vercel.md) - 기본 배포 (정적 호스팅)
2. [Cloudflare Tunnel](./deployment/cloudflare-tunnel.md) - 백업 배포

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Vue 3 + TypeScript + Vite + Pinia |
| 백엔드 | Bun HTTP 서버 (API 프록시) |
| AI | Claude (콘텐츠 생성) + Gemini (이미지) |
| 콘텐츠 | Vanilla HTML/CSS/JS (iframe 샌드박스) |
| 배포 | Vercel (Primary) / Cloudflare Tunnel (Backup) |

---

## 주요 명령어

```bash
# 개발
bun run dev:all       # Vite + API 서버 동시 실행

# 빌드
bun run build         # 프로덕션 빌드

# 테스트
bun run test          # Vitest 실행

# 린트
bun run lint:fix      # ESLint 자동 수정
```

---

## 콘텐츠 현황 (2026-01-29 기준)

- **총 콘텐츠**: 55개+
- **과목**: 수학, 과학, 영어
- **학년**: 초등, 중등, 고등
- **유형**: 시뮬레이션, 게임, 퀴즈, 탐험, 스토리

---

## 관련 링크

- **프로덕션**: https://eduflix.vercel.app
- **백업**: https://eduflix.example.com (Cloudflare Tunnel)
