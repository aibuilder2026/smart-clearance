#!/usr/bin/env bash
# SC-187: runs director.py with the walk's own environment (backend-api/scripts/lib.sh of the main checkout, SC_REPO),
# against the main checkout's live stack: backend-api on :8000, the workspace on :5175 and the console on :5174, so it
# signs people in as sc-api-local and reaches the local buckets. The walk's code (sc_api.cli.walk) is the main
# checkout's, which is on the same commit as this worktree.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
MAIN="${SC_REPO:-$(cd "$HERE/../../../.." && pwd)}"
export SC_REPO="$MAIN"
export PORT="${PORT:-8000}"
export WS_ORIGIN="${WS_ORIGIN:-http://localhost:5175}"
export CONSOLE_ORIGIN="${CONSOLE_ORIGIN:-http://localhost:5174}"
# shellcheck source=/dev/null
source "$MAIN/backend-api/scripts/lib.sh"
curl -sf "http://localhost:${PORT}/readyz" >/dev/null || die "backend-api is not answering on :${PORT}"
as_api
journey_env local
uv_run python "$HERE/director.py" "$@"
