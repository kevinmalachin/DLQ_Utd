#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="${ROOT_DIR}/public/tools"
LOG_DIR="${ROOT_DIR}/logs"

DLQ_SCRIPT="${ROOT_DIR}/App.py"
JIRATASK_SCRIPT="${TOOLS_DIR}/JiraTask/JiraTask.py"
REQUIREMENTS_FILE="${ROOT_DIR}/requirements.tools.txt"

DLQ_PORT=5000
JIRATASK_PORT=2000
STATIC_PORT="${STATIC_PORT:-8080}"
KEEP_LOGS="${KEEP_LOGS:-false}"

DLQ_PID_FILE="${LOG_DIR}/dlq.pid"
JIRATASK_PID_FILE="${LOG_DIR}/jiratask.pid"
STATIC_PID_FILE="${LOG_DIR}/static.pid"

DLQ_LOG_FILE="${LOG_DIR}/dlq.log"
JIRATASK_LOG_FILE="${LOG_DIR}/jiratask.log"
STATIC_LOG_FILE="${LOG_DIR}/static.log"

CLEANUP_DONE=0

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "[run_all] ERRORE: python/python3 non trovato nel PATH." >&2
  exit 1
fi

log() {
  printf '[run_all] %s\n' "$*"
}

pid_is_running() {
  local pid="${1:-}"
  [[ -n "${pid}" ]] && ps -p "${pid}" >/dev/null 2>&1
}

port_in_use() {
  local port="$1"
  "${PYTHON_BIN}" - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    sock.bind(("0.0.0.0", port))
except OSError:
    sys.exit(0)
else:
    sys.exit(1)
finally:
    sock.close()
PY
}

stop_from_pid_file() {
  local pid_file="$1"
  local label="$2"

  [[ -f "${pid_file}" ]] || return 0

  local pid=""
  pid="$(cat "${pid_file}" 2>/dev/null || true)"

  if pid_is_running "${pid}"; then
    log "Stop ${label} (PID ${pid})..."
    kill "${pid}" >/dev/null 2>&1 || true

    for _ in {1..20}; do
      if ! pid_is_running "${pid}"; then
        break
      fi
      sleep 0.2
    done

    if pid_is_running "${pid}"; then
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi
  fi

  rm -f "${pid_file}"
}

cleanup() {
  if [[ "${CLEANUP_DONE}" -eq 1 ]]; then
    return
  fi
  CLEANUP_DONE=1

  set +e
  stop_from_pid_file "${STATIC_PID_FILE}" "static server"
  stop_from_pid_file "${JIRATASK_PID_FILE}" "JiraTask server"
  stop_from_pid_file "${DLQ_PID_FILE}" "DLQ server"

  rm -f "${STATIC_PID_FILE}" "${JIRATASK_PID_FILE}" "${DLQ_PID_FILE}"

  local keep_logs_normalized
  keep_logs_normalized="$(printf '%s' "${KEEP_LOGS}" | tr '[:upper:]' '[:lower:]')"

  if [[ "${keep_logs_normalized}" == "true" ]]; then
    log "KEEP_LOGS=true, log preservati in ${LOG_DIR}"
  else
    rm -f "${STATIC_LOG_FILE}" "${JIRATASK_LOG_FILE}" "${DLQ_LOG_FILE}"
    rmdir "${LOG_DIR}" >/dev/null 2>&1 || true
    log "Log rimossi."
  fi
}

trap 'cleanup; exit 0' INT TERM
trap 'cleanup' EXIT

for required in "${ROOT_DIR}/index.html" "${TOOLS_DIR}" "${DLQ_SCRIPT}" "${JIRATASK_SCRIPT}"; do
  if [[ ! -e "${required}" ]]; then
    log "ERRORE: manca ${required}"
    exit 1
  fi
done

mkdir -p "${LOG_DIR}"

# Pulisce eventuali PID file di run precedenti.
stop_from_pid_file "${STATIC_PID_FILE}" "static server precedente"
stop_from_pid_file "${JIRATASK_PID_FILE}" "JiraTask server precedente"
stop_from_pid_file "${DLQ_PID_FILE}" "DLQ server precedente"

if port_in_use "${DLQ_PORT}"; then
  log "ERRORE: porta DLQ ${DLQ_PORT} già occupata."
  exit 1
fi

if port_in_use "${JIRATASK_PORT}"; then
  log "ERRORE: porta JiraTask ${JIRATASK_PORT} già occupata."
  exit 1
fi

if port_in_use "${STATIC_PORT}"; then
  log "ERRORE: porta static server ${STATIC_PORT} già occupata."
  log "Suggerimento: rilancia con STATIC_PORT=XXXX ./run_all.sh"
  exit 1
fi

# Virtualenv per Linux/macOS (.venv preferito, fallback venv, con recovery se rotto/spostato).
if [[ -d "${ROOT_DIR}/.venv" ]]; then
  VENV_DIR="${ROOT_DIR}/.venv"
elif [[ -d "${ROOT_DIR}/venv" ]]; then
  VENV_DIR="${ROOT_DIR}/venv"
else
  VENV_DIR="${ROOT_DIR}/.venv"
  log "Creo virtualenv in ${VENV_DIR}..."
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

VENV_PY="${VENV_DIR}/bin/python"
if [[ ! -x "${VENV_PY}" ]]; then
  log "WARN: virtualenv non valido in ${VENV_DIR}; provo a rigenerarlo."
  "${PYTHON_BIN}" -m venv --clear "${VENV_DIR}" >/dev/null 2>&1 || "${PYTHON_BIN}" -m venv "${VENV_DIR}"
  VENV_PY="${VENV_DIR}/bin/python"
fi

if [[ ! -x "${VENV_PY}" && "${VENV_DIR}" != "${ROOT_DIR}/.venv" ]]; then
  VENV_DIR="${ROOT_DIR}/.venv"
  log "WARN: fallback su ${VENV_DIR}..."
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
  VENV_PY="${VENV_DIR}/bin/python"
fi

if [[ ! -x "${VENV_PY}" ]]; then
  log "ERRORE: python del virtualenv non trovato (${VENV_PY})."
  exit 1
fi

log "Uso virtualenv: ${VENV_DIR}"

if [[ -f "${REQUIREMENTS_FILE}" ]]; then
  log "Installo requirements da ${REQUIREMENTS_FILE} ..."
  "${VENV_PY}" -m pip install -r "${REQUIREMENTS_FILE}"
else
  log "WARN: ${REQUIREMENTS_FILE} non trovato, installo dipendenze minime."
  "${VENV_PY}" -m pip install flask flask-cors requests python-dotenv openpyxl
fi

log "Avvio DLQ API (${DLQ_SCRIPT}) su http://127.0.0.1:${DLQ_PORT} ..."
nohup "${VENV_PY}" "${DLQ_SCRIPT}" > "${DLQ_LOG_FILE}" 2>&1 &
DLQ_PID=$!
echo "${DLQ_PID}" > "${DLQ_PID_FILE}"
sleep 1
if ! pid_is_running "${DLQ_PID}"; then
  log "ERRORE: DLQ API non partita. Controlla ${DLQ_LOG_FILE}."
  exit 1
fi

JIRATASK_ENABLED=1
log "Avvio JiraTask API (${JIRATASK_SCRIPT}) su http://127.0.0.1:${JIRATASK_PORT} ..."
nohup "${VENV_PY}" "${JIRATASK_SCRIPT}" > "${JIRATASK_LOG_FILE}" 2>&1 &
JIRATASK_PID=$!
echo "${JIRATASK_PID}" > "${JIRATASK_PID_FILE}"
sleep 1
if ! pid_is_running "${JIRATASK_PID}"; then
  JIRATASK_ENABLED=0
  rm -f "${JIRATASK_PID_FILE}"
  log "WARN: JiraTask API non partita. Continuo senza JiraTask."
  log "WARN: Configura JIRA_* in .env e rilancia (usa KEEP_LOGS=true per debug)."
fi

log "Avvio static server su http://127.0.0.1:${STATIC_PORT} ..."
(
  cd "${ROOT_DIR}"
  nohup "${VENV_PY}" -m http.server "${STATIC_PORT}" > "${STATIC_LOG_FILE}" 2>&1 &
  echo "$!" > "${STATIC_PID_FILE}"
)
STATIC_PID="$(cat "${STATIC_PID_FILE}")"
sleep 1
if ! pid_is_running "${STATIC_PID}"; then
  log "ERRORE: static server non partito. Controlla ${STATIC_LOG_FILE}."
  exit 1
fi

log "Tool DLQ (home): http://127.0.0.1:${STATIC_PORT}/index.html"
log "Tool HR: http://127.0.0.1:${STATIC_PORT}/public/tools/HR/HR.html"
if [[ "${JIRATASK_ENABLED}" -eq 1 ]]; then
  log "Tool JiraTask: http://127.0.0.1:${STATIC_PORT}/public/tools/JiraTask/JiraTask.html"
else
  log "Tool JiraTask: non disponibile (API non avviata)."
fi
log "Tool DevToolbox: http://127.0.0.1:${STATIC_PORT}/public/tools/DevToolbox/DevToolbox.html"
log "Premi Ctrl+C per fermare tutto e pulire PID/log."

while true; do
  if ! pid_is_running "${DLQ_PID}"; then
    log "DLQ API terminata inaspettatamente."
    exit 1
  fi
  if [[ "${JIRATASK_ENABLED}" -eq 1 ]] && ! pid_is_running "${JIRATASK_PID}"; then
    log "JiraTask API terminata inaspettatamente."
    exit 1
  fi
  if ! pid_is_running "${STATIC_PID}"; then
    log "Static server terminato inaspettatamente."
    exit 1
  fi
  sleep 2
done
