---
id: REQ-002
title: Add world-history subject category
status: completed
created_at: 2026-02-09T12:00:00Z
user_request: UR-001
related: [REQ-001]
batch: content-import
---

# Add world-history subject category

## What
새로운 과목 "세계사"(world-history)를 EduFlix 시스템에 추가한다.

## Detailed Requirements
- TypeScript subject 타입에 "world-history" 추가
- 디렉토리 구조 생성: public/contents/world-history/elementary/, middle/, high/
- UI 컴포넌트에서 세계사 과목 표시 지원 (ContentRow, 필터 등)
- mario-country-quiz, world-quiz-battle을 world-history 과목으로 분류
- 홈 화면에 세계사 카테고리 행 표시

---
*Source: "make new math/science/english/세계사"*
