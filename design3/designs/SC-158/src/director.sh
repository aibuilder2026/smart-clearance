#!/usr/bin/env bash
# SC-158: runs director.py with the walk's own environment (backend-api/scripts/lib.sh), against this checkout's own
# API on :8001 and its dev servers on :5185 and :5184, so it signs people in as sc-api-local and reaches the local buckets.
set -euo pipefail
MAIN=/Users/arundutta/projects/smart-clearance/.claude/worktrees/pensive-taussig-c3747a
export PORT="${PORT:-8001}"
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$MAIN/backend-api/scripts/lib.sh"
curl -sf "http://localhost:${PORT:-8000}/readyz" >/dev/null || die "backend-api is not answering on :8000"
as_api
journey_env local
uv_run python "$HERE/director.py" "$@"
