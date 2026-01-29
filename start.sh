#!/bin/bash
# EduFlix 개발 서버 시작 스크립트
# art-assets 서버 + Cloudflare Tunnel까지 함께 기동

cd "$(dirname "$0")"

EDUFLIX_DIR="$(pwd)"
ART_ASSETS_DIR="$(cd "$EDUFLIX_DIR/../art-assets" 2>/dev/null && pwd || true)"
ART_ASSETS_PORT=3100
ART_ASSETS_URL="http://localhost:${ART_ASSETS_PORT}"
ART_ASSETS_LOG="/tmp/art-assets-${ART_ASSETS_PORT}.log"
ART_ASSETS_PID=""

# Cloudflare Tunnel 설정
CLOUDFLARED_CONFIG="$HOME/.cloudflared/eduflix-config.yml"
CLOUDFLARED_LOG="/tmp/cloudflared-eduflix.log"
CLOUDFLARED_PID=""

is_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return $?
  fi
  return 1
}

is_tunnel_running() {
  pgrep -f "cloudflared.*eduflix" >/dev/null 2>&1
  return $?
}

cleanup() {
  if [[ -n "${ART_ASSETS_PID}" ]] && kill -0 "${ART_ASSETS_PID}" >/dev/null 2>&1; then
    echo ""
    echo "art-assets 서버를 종료합니다... (pid=${ART_ASSETS_PID})"
    kill "${ART_ASSETS_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${CLOUDFLARED_PID}" ]] && kill -0 "${CLOUDFLARED_PID}" >/dev/null 2>&1; then
    echo "Cloudflare Tunnel을 종료합니다... (pid=${CLOUDFLARED_PID})"
    kill "${CLOUDFLARED_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "EduFlix 개발 서버를 시작합니다..."
echo "- Vite dev: http://localhost:5173"
echo "- API server: http://localhost:3001"
echo "- art-assets: ${ART_ASSETS_URL}"
echo "- Cloudflare Tunnel: https://eduflix.agentic-worker.store"
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

# Cloudflare Tunnel 시작
if [[ -f "${CLOUDFLARED_CONFIG}" ]] && command -v cloudflared >/dev/null 2>&1; then
  if is_tunnel_running; then
    echo "Cloudflare Tunnel이 이미 실행 중입니다."
  else
    echo "Cloudflare Tunnel을 시작합니다..."
    cloudflared tunnel --config "${CLOUDFLARED_CONFIG}" run eduflix >"${CLOUDFLARED_LOG}" 2>&1 &
    CLOUDFLARED_PID=$!
    sleep 2
    if is_tunnel_running; then
      echo "Cloudflare Tunnel 기동 완료 (pid=${CLOUDFLARED_PID})"
      echo "- Public URL: https://eduflix.agentic-worker.store"
    else
      echo "경고: Cloudflare Tunnel 기동 실패. log=${CLOUDFLARED_LOG}"
    fi
  fi
else
  echo "경고: cloudflared 또는 설정 파일이 없습니다. 터널 건너뜀."
fi
echo ""

bun run dev:all
