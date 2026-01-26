@echo off
REM EduFlix 개발 서버 시작 스크립트

cd /d "%~dp0"

echo EduFlix 개발 서버를 시작합니다...
echo - Vite dev: http://localhost:5173
echo - API server: http://localhost:3000
echo.

bun run dev:all
