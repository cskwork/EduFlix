#!/bin/bash
# EduFlix 개발 서버 시작 스크립트
# art-assets 서버까지 함께 기동하여 생성 기능이 동작하도록 보장

cd "$(dirname "$0")"

EDUFLIX_DIR="$(pwd)"
ART_ASSETS_DIR="$(cd "$EDUFLIX_DIR/../art-assets" 2>/dev/null && pwd || true)"
ART_ASSETS_PORT=3100
ART_ASSETS_URL="http://localhost:${ART_ASSETS_PORT}"
ART_ASSETS_LOG="/tmp/art-assets-${ART_ASSETS_PORT}.log"
ART_ASSETS_PID=""

is_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return $?
  fi
  return 1
}

cleanup() {
  if [[ -n "${ART_ASSETS_PID}" ]] && kill -0 "${ART_ASSETS_PID}" >/dev/null 2>&1; then
    echo ""
    echo "art-assets 서버를 종료합니다... (pid=${ART_ASSETS_PID})"
    kill "${ART_ASSETS_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "EduFlix 개발 서버를 시작합니다..."
echo "- Vite dev: http://localhost:5173"
echo "- API server: http://localhost:3001"
echo "- art-assets: ${ART_ASSETS_URL}"
echo ""

if [[ -n "${ART_ASSETS_DIR}" && -f "${ART_ASSETS_DIR}/server.js" ]]; then
  if is_port_in_use "${ART_ASSETS_PORT}"; then
    echo "art-assets 서버가 이미 실행 중입니다: ${ART_ASSETS_URL}"
  else
    echo "art-assets 서버를 시작합니다..."
    (
      cd "${ART_ASSETS_DIR}" &&
        PORT="${ART_ASSETS_PORT}" node server.js
    ) >"${ART_ASSETS_LOG}" 2>&1 &
    ART_ASSETS_PID=$!

    sleep 1
    if is_port_in_use "${ART_ASSETS_PORT}"; then
      echo "art-assets 서버 기동 완료 (pid=${ART_ASSETS_PID}, log=${ART_ASSETS_LOG})"
    else
      echo "경고: art-assets 서버 기동을 확인하지 못했습니다. log=${ART_ASSETS_LOG}"
    fi
  fi
else
  echo "경고: art-assets 디렉터리를 찾지 못했습니다: ${EDUFLIX_DIR}/../art-assets"
fi

# 백엔드가 art-assets 주소를 확실히 바라보도록 환경변수로 고정
export ART_ASSETS_URL="${ART_ASSETS_URL}"

bun run dev:all
