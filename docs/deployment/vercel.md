# Vercel 배포 가이드

## 프로덕션 배포 완료

**배포 URL**: https://eduflix.vercel.app

## 배포 프로세스

### 1. 빌드 및 배포

```bash
# 프로덕션 빌드
bun run build

# Vercel에 배포 (프로덕션)
vercel --prod --confirm
```

### 2. 배포 설정 (vercel.json)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!contents|assets).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/contents/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### 3. 정적 호스팅 설정

- **프레임워크**: Vite + Vue 3
- **출력 디렉토리**: `dist/`
- **라우팅**: SPA 라우팅 (index.html로 재작성)
- **캐싱**: `/contents/*` 파일은 1년 캐시

### 4. 환경 변수

정적 모드에서는 AI 기능이 비활성화됩니다:

```bash
# .env.production
VITE_STATIC_MODE=true
```

## 주요 결정사항

### 정적 호스팅 선택 이유

1. **비용 효율**: Vercel Free tier 지원
2. **성능**: 글로벌 CDN을 통한 빠른 제공
3. **기능 제약**: AI 생성 기능은 로컬 개발 환경에서만 작동

### 빌드 최적화

- Vite의 트리 쉐이킹으로 번들 크기 최소화
- 콘텐츠 파일은 정적 제공 (캐시 헤더 설정)
- Vue 3 + TypeScript 타입 안정성

## 배포 후 확인 사항

- [x] 사이트 로드 확인
- [x] SPA 라우팅 작동 확인
- [x] 콘텐츠 캐싱 헤더 설정
- [x] 정적 모드에서 AI 기능 비활성화 확인

## 문제 해결

### 배포 실패 (Request Entity Too Large)

원인: 콘텐츠 파일 크기 초과

해결책:
1. 대용량 콘텐츠는 CDN에서 제공
2. Vercel 빌드 캐시 활용
3. npm 의존성 최소화

### 로컬 테스트

```bash
# 프로덕션 빌드 테스트
bun run preview

# 정적 모드 테스트
VITE_STATIC_MODE=true bun run preview
```

## 다음 단계

- [ ] 분석 도구 통합 (Google Analytics, Vercel Analytics)
- [ ] 에러 모니터링 (Sentry)
- [ ] PWA 지원 추가
- [ ] 다국어 콘텐츠 확장
