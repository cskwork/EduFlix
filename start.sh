#!/bin/bash
# EduFlix 개발 서버 시작 스크립트
# art-assets 서버 + Cloudflare Tunnel까지 함께 기동
# 포트 정합성 검증 및 자동 재시작 포함

set -euo pipefail

cd "$(dirname "$0")"

EDUFLIX_DIR="$(pwd)"
ART_ASSETS_DIR="$(cd "$EDUFLIX_DIR/../art-assets" 2>/dev/null && pwd || true)"

# 포트 설정 (단일 소스: 여기서만 정의)
EDUFLIX_PORT=3001
ART_ASSETS_PORT=3200
ART_ASSETS_URL="http://localhost:${ART_ASSETS_PORT}"
ART_ASSETS_LOG="/tmp/art-assets-${ART_ASSETS_PORT}.log"
ART_ASSETS_PID=""

# Cloudflare Tunnel 설정
CLOUDFLARED_CONFIG="$HOME/.cloudflared/eduflix-config.yml"
CLOUDFLARED_LOG="/tmp/cloudflared-eduflix.log"
CLOUDFLARED_PID=""

# 서버 재시작 설정
MAX_RESTARTS=5
RESTART_DELAY=2
RESTART_COUNT=0
SERVER_LOG="/tmp/eduflix-server.log"

# --- 유틸리티 함수 ---

is_port_in_use() {
  local port="$1"
  lsof -i :"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

get_pid_on_port() {
  local port="$1"
  lsof -i :"$port" -sTCP:LISTEN -n -P -t 2>/dev/null | head -1
}

is_tunnel_running() {
  pgrep -f "cloudflared.*eduflix" >/dev/null 2>&1
}

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "[$(timestamp)] $*"
}

# --- 사전 검증 (Pre-flight checks) ---

preflight_check() {
  local errors=0

  log "=== 사전 검증 시작 ==="

  # 1. Tunnel config 포트 정합성 검증
  if [[ -f "${CLOUDFLARED_CONFIG}" ]]; then
    local tunnel_port
    tunnel_port=$(grep -o 'localhost:[0-9]*' "${CLOUDFLARED_CONFIG}" | head -1 | sed 's/localhost://')
    if [[ -n "${tunnel_port}" && "${tunnel_port}" != "${EDUFLIX_PORT}" ]]; then
      log "오류: Tunnel 설정 포트(${tunnel_port})와 서버 포트(${EDUFLIX_PORT})가 불일치합니다."
      log "  수정: ${CLOUDFLARED_CONFIG} 의 포트를 ${EDUFLIX_PORT}로 변경하세요."
      errors=$((errors + 1))
    else
      log "  Tunnel 포트 정합성: OK (${EDUFLIX_PORT})"
    fi
  fi

  # 2. .env ART_ASSETS_URL 정합성 검증
  if [[ -f "${EDUFLIX_DIR}/.env" ]]; then
    local env_art_url
    env_art_url=$(grep 'ART_ASSETS_URL=' "${EDUFLIX_DIR}/.env" 2>/dev/null | sed 's/ART_ASSETS_URL=//' || true)
    if [[ -n "${env_art_url}" && "${env_art_url}" != "${ART_ASSETS_URL}" ]]; then
      log "경고: .env ART_ASSETS_URL(${env_art_url})과 스크립트 설정(${ART_ASSETS_URL})이 다릅니다."
      log "  스크립트 설정이 우선 적용됩니다."
    fi
  fi

  # 3. stale 프로세스 정리
  if is_port_in_use "${EDUFLIX_PORT}"; then
    local stale_pid
    stale_pid=$(get_pid_on_port "${EDUFLIX_PORT}")
    log "경고: 포트 ${EDUFLIX_PORT}에 기존 프로세스(pid=${stale_pid})가 있습니다. 종료합니다."
    kill "${stale_pid}" 2>/dev/null || true
    sleep 1
    if is_port_in_use "${EDUFLIX_PORT}"; then
      log "오류: 포트 ${EDUFLIX_PORT}의 기존 프로세스를 종료할 수 없습니다."
      errors=$((errors + 1))
    else
      log "  기존 프로세스 종료 완료."
    fi
  fi

  if [[ ${errors} -gt 0 ]]; then
    log "=== 사전 검증 실패 (${errors}건). 위 오류를 수정 후 다시 실행하세요. ==="
    exit 1
  fi

  log "=== 사전 검증 통과 ==="
}

# --- 정리 ---

cleanup() {
  log "서버를 종료합니다..."
  if [[ -n "${ART_ASSETS_PID}" ]] && kill -0 "${ART_ASSETS_PID}" 2>/dev/null; then
    log "  art-assets 종료 (pid=${ART_ASSETS_PID})"
    kill "${ART_ASSETS_PID}" 2>/dev/null || true
  fi
  if [[ -n "${CLOUDFLARED_PID}" ]] && kill -0 "${CLOUDFLARED_PID}" 2>/dev/null; then
    log "  Cloudflare Tunnel 종료 (pid=${CLOUDFLARED_PID})"
    kill "${CLOUDFLARED_PID}" 2>/dev/null || true
  fi
  # bun 프로세스 정리
  local bun_pid
  bun_pid=$(get_pid_on_port "${EDUFLIX_PORT}")
  if [[ -n "${bun_pid}" ]]; then
    log "  EduFlix 서버 종료 (pid=${bun_pid})"
    kill "${bun_pid}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

# --- 메인 시작 로직 ---

preflight_check

# 빌드 (public/ → dist/ 동기화)
log "프로덕션 빌드를 실행합니다..."
if bun run build; then
  log "빌드 완료."
else
  log "오류: 빌드 실패. 종료합니다."
  exit 1
fi

log "EduFlix 개발 서버를 시작합니다..."
echo "  - API server: http://localhost:${EDUFLIX_PORT}"
echo "  - art-assets: ${ART_ASSETS_URL}"
echo "  - Cloudflare Tunnel: https://eduflix.agentic-worker.store"
echo ""

# art-assets 서버 시작
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
      log "art-assets 서버 기동 완료 (pid=${ART_ASSETS_PID}, log=${ART_ASSETS_LOG})"
    else
      log "경고: art-assets 서버 기동을 확인하지 못했습니다. log=${ART_ASSETS_LOG}"
    fi
  fi
else
  log "경고: art-assets 디렉터리를 찾지 못했습니다: ${EDUFLIX_DIR}/../art-assets"
fi

# 환경변수 고정
export ART_ASSETS_URL="${ART_ASSETS_URL}"
export PORT="${EDUFLIX_PORT}"

# Cloudflare Tunnel 시작
if [[ -f "${CLOUDFLARED_CONFIG}" ]] && command -v cloudflared >/dev/null 2>&1; then
  if is_tunnel_running; then
    log "Cloudflare Tunnel이 이미 실행 중입니다."
  else
    log "Cloudflare Tunnel을 시작합니다..."
    cloudflared tunnel --config "${CLOUDFLARED_CONFIG}" run eduflix >>"${CLOUDFLARED_LOG}" 2>&1 &
    CLOUDFLARED_PID=$!
    sleep 2
    if is_tunnel_running; then
      log "Cloudflare Tunnel 기동 완료 (pid=${CLOUDFLARED_PID})"
      echo "  - Public URL: https://eduflix.agentic-worker.store"
    else
      log "경고: Cloudflare Tunnel 기동 실패. log=${CLOUDFLARED_LOG}"
    fi
  fi
else
  log "경고: cloudflared 또는 설정 파일이 없습니다. 터널 건너뜀."
fi
echo ""

# --- 서버 실행 (watchdog 자동 재시작) ---

log "EduFlix API 서버를 watchdog 모드로 시작합니다 (최대 재시작: ${MAX_RESTARTS}회)..."

while true; do
  log "서버 시작 (시도 #$((RESTART_COUNT + 1)))..."

  # bun 서버 실행 (foreground에서 실행하되 종료 코드를 캡처)
  bun run start 2>&1 | tee -a "${SERVER_LOG}" &
  BUN_PID=$!

  # bun 프로세스 종료 대기
  wait "${BUN_PID}" || true
  EXIT_CODE=$?

  # 정상 종료 (SIGINT/SIGTERM 등)
  if [[ ${EXIT_CODE} -eq 0 || ${EXIT_CODE} -eq 130 || ${EXIT_CODE} -eq 143 ]]; then
    log "서버가 정상 종료되었습니다 (exit=${EXIT_CODE})."
    break
  fi

  # 비정상 종료 - 재시작 시도
  RESTART_COUNT=$((RESTART_COUNT + 1))
  log "서버가 비정상 종료되었습니다 (exit=${EXIT_CODE}, 재시작 ${RESTART_COUNT}/${MAX_RESTARTS})."

  if [[ ${RESTART_COUNT} -ge ${MAX_RESTARTS} ]]; then
    log "오류: 최대 재시작 횟수(${MAX_RESTARTS})를 초과했습니다. 종료합니다."
    log "  로그 확인: ${SERVER_LOG}"
    exit 1
  fi

  log "${RESTART_DELAY}초 후 재시작합니다..."
  sleep "${RESTART_DELAY}"
done
