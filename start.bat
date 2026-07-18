@echo off
REM EduFlix 개발 서버 시작 스크립트
REM art-assets 서버까지 함께 기동하여 생성 기능이 동작하도록 보장

setlocal enabledelayedexpansion

cd /d "%~dp0"
set "EDUFLIX_DIR=%CD%"
set "ART_ASSETS_DIR=%EDUFLIX_DIR%\..\art-assets"
set "ART_ASSETS_PORT=3200"
set "ART_ASSETS_URL=http://localhost:%ART_ASSETS_PORT%"
set "ART_ASSETS_LOG=%TEMP%\art-assets-%ART_ASSETS_PORT%.log"

echo EduFlix 개발 서버를 시작합니다...
echo - Vite dev: http://localhost:5173
echo - API server: http://localhost:3001
echo - art-assets: %ART_ASSETS_URL%
echo.

if exist "%ART_ASSETS_DIR%\server.js" (
  set "ART_ASSETS_RUNNING="
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%ART_ASSETS_PORT% .*LISTENING"') do (
    set "ART_ASSETS_RUNNING=1"
  )

  if defined ART_ASSETS_RUNNING (
    echo art-assets 서버가 이미 실행 중입니다: %ART_ASSETS_URL%
  ) else (
    echo art-assets 서버를 시작합니다...
    start "art-assets" /b cmd /c "cd /d \"%ART_ASSETS_DIR%\" && set PORT=%ART_ASSETS_PORT% && node server.js > \"%ART_ASSETS_LOG%\" 2>&1"
    echo art-assets 서버 실행 요청 완료 (log=%ART_ASSETS_LOG%)
  )
) else (
  echo 경고: art-assets 디렉터리를 찾지 못했습니다: %ART_ASSETS_DIR%
)

REM 백엔드가 art-assets 주소를 확실히 바라보도록 환경변수로 고정
set "ART_ASSETS_URL=%ART_ASSETS_URL%"

bun run dev:all
