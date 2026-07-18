@echo off
REM Vite와 인프로세스 콘텐츠 팩토리를 포함한 Bun API를 함께 시작한다.
cd /d "%~dp0"
if not defined PORT set "PORT=3001"
echo EduFlix 개발 서버를 시작합니다.
echo - Vite dev: http://localhost:5173
echo - API server: http://localhost:%PORT%
bun run dev:all
