#!/bin/bash
# EduFlix 개발 서버 시작 스크립트
# Vite dev + EduFlix API + art-assets 서버를 함께 기동하여
# 콘텐츠 생성 기능(art-assets 의존)까지 동작하는 dev 환경을 보장한다.
# start.bat 과 동일한 동작을 Unix/macOS에서 제공.

set -euo pipefail

cd "$(dirname "$0")"

EDUFLIX_DIR="$(pwd)"
ART_ASSETS_DIR="$(cd "$EDUFLIX_DIR/../art-assets" 2>/dev/null && pwd || true)"

# 단일 진실 공급원: server/config.ts 의 기본 포트와 동일하게 유지
EDUFLIX_PORT=3001        # API 서버 (bun run dev:server)
VITE_PORT=5173           # Vite dev 서버
ART_ASSETS_PORT=3200     # art-assets 서버 (server/config.ts DEFAULT_ART_ASSETS_PORT)
ART_ASSETS_URL="http://localhost:${ART_ASSETS_PORT}"
ART_ASSETS_LOG="/tmp/art-assets-${ART_ASSETS_PORT}.log"
ART_ASSETS_PID=""

# --- 유틸리티 ---

is_port_in_use() {
  local port="$1"
  lsof -i :"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

get_pid_on_port() {
  local port="$1"
  lsof -i :"$port" -sTCP:LISTEN -n -P -t 2>/dev/null | head -1
}

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $*"; }

cleanup() {
  log "종료 중..."
  if [[ -n "${ART_ASSETS_PID}" ]] && kill -0 "${ART_ASSETS_PID}" 2>/dev/null; then
    log "  art-assets 종료 (pid=${ART_ASSETS_PID})"
    kill "${ART_ASSETS_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# --- 사전 검증 ---

log "=== EduFlix dev 서버 시작 ==="
echo "  - Vite dev:    http://localhost:${VITE_PORT}"
echo "  - API server:  http://localhost:${EDUFLIX_PORT}"
echo "  - art-assets:  ${ART_ASSETS_URL}"
echo ""

# 1. art-assets 서버 기동 (포트 3200)
if [[ -n "${ART_ASSETS_DIR}" && -f "${ART_ASSETS_DIR}/server.js" ]]; then
  if is_port_in_use "${ART_ASSETS_PORT}"; then
    log "art-assets 서버가 이미 실행 중입니다: ${ART_ASSETS_URL}"
  else
    log "art-assets 서버를 시작합니다..."
    (
      cd "${ART_ASSETS_DIR}" &&
        PORT="${ART_ASSETS_PORT}" node server.js
    ) >>"${ART_ASSETS_LOG}" 2>&1 &
    ART_ASSETS_PID=$!

    sleep 1
    if is_port_in_use "${ART_ASSETS_PORT}"; then
      log "art-assets 기동 완료 (pid=${ART_ASSETS_PID}, log=${ART_ASSETS_LOG})"
    else
      log "경고: art-assets 기동을 확인하지 못했습니다. log=${ART_ASSETS_LOG}"
    fi
  fi
else
  log "경고: art-assets 디렉터리를 찾을 수 없습니다: ${EDUFLIX_DIR}/../art-assets"
  log "  콘텐츠 생성 기능이 동작하지 않습니다. sibling repo 'art-assets'를 클론하세요."
fi

# 2. 백엔드가 art-assets 주소를 확실히 바라보도록 환경변수 고정
export ART_ASSETS_URL="${ART_ASSETS_URL}"
export PORT="${EDUFLIX_PORT}"

# 3. Vite dev + API 서버 동시 실행 (foreground)
#    bun run dev:all = "bun run dev & bun run dev:server"
log "Vite + API 서버를 시작합니다 (bun run dev:all)..."
bun run dev:all
