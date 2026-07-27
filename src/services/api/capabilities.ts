// 배포 형태별 기능 가용성 판정
//
// VITE_STATIC_MODE는 원래 "백엔드 API가 전혀 없음"을 뜻했고, 그래서 생성 UI 자체를 감췄다.
// Vercel 서버리스 생성 경로(api/generate.ts)가 생기면서 "정적 배포 = 생성 불가"가 더는
// 성립하지 않으므로, 두 축을 분리한다.
//   - isStaticMode: 팩토리 서버(폴링·추천 DB)가 없다 → 생성은 서버리스 단일 호출 경로를 쓴다
//   - canGenerate:  생성 UI를 노출할지 여부

// 팩토리 서버 없이 배포된 정적 빌드인지
export const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

// 정적 배포에서 서버리스 생성 함수를 쓸 수 있는지 (Vercel 배포 시 true)
export const hasServerlessGeneration = import.meta.env.VITE_SERVERLESS_GENERATION === 'true'

// 생성 기능을 UI에 노출할 수 있는지
export const canGenerate = !isStaticMode || hasServerlessGeneration
