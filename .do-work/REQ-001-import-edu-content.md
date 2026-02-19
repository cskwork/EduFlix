---
id: REQ-001
title: Import 12 remaining edu-content from art-assets
status: completed
created_at: 2026-02-09T12:00:00Z
user_request: UR-001
related: [REQ-002]
batch: content-import
---

# Import 12 remaining edu-content from art-assets

## What
art-assets/edu-content에서 EduFlix index.json에 미등록된 12개 콘텐츠를 임포트한다.

## Detailed Requirements
- 각 콘텐츠 폴더(index.html, style.css, script.js)를 적절한 EduFlix 경로로 복사
- index.json에 manifest 항목 추가
- fraction-game-precision 시리즈(alpha~epsilon) 5개 모두 임포트
- 8bit-math-quest의 common.css 참조 경로 수정 필요
- 빈 폴더(v2, v3) 제외

## Content List
1. 20260127-pythagorean-3d (수학/중등)
2. 20260127-rotation-solid (수학/중등)
3. 20260127-topic-5f41ee24 (수학)
4. 20260206-phaser (수학/Phaser)
5. 20260207-8bit-math-quest (수학/게임)
6. 20260207-fraction-game-precision-alpha (수학/초등)
7. 20260207-fraction-game-precision-beta (수학/초등)
8. 20260207-fraction-game-precision-gamma (수학/초등)
9. 20260207-fraction-game-precision-delta (수학/초등)
10. 20260207-fraction-game-precision-epsilon (수학/초등)
11. 20260209-mario-country-quiz (세계사/게임) -> REQ-002 참조
12. 20260209-world-quiz-battle (세계사/게임) -> REQ-002 참조

---
*Source: "yes continue import"*
