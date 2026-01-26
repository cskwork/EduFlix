#!/bin/bash
# EduFlix 개발 서버 시작 스크립트

cd "$(dirname "$0")"

echo "EduFlix 개발 서버를 시작합니다..."
echo "- Vite dev: http://localhost:5173"
echo "- API server: http://localhost:3001"
echo ""

bun run dev:all
