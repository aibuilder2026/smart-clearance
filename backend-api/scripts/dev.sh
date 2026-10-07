#!/usr/bin/env bash
# The API on http://localhost:8000 (PORT to change it), reloading on every change, as sc-api-local (impersonated in
# code, from your own gcloud credentials) against the local database and the project's Firebase Authentication.
# The console, the landing page and the workspace app call it once their PUBLIC_API_BASE is http://localhost:8000.
# The live workspace (SC-66) runs on the real cloud's `local` resources, with no emulator: it publishes to the
# local.* topics, signs links into the -local buckets, pulls local.notify.api to send FCM pushes, and ticks its own
# journey clock every TICK_SECONDS (15); agents/scripts/dev.sh runs the agents beside it.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

as_api
journey_env local
export NOTIFY_MODE="${NOTIFY_MODE:-pull}" TICK_SECONDS="${TICK_SECONDS:-15}"
export WORKSPACE_ORIGIN="${WORKSPACE_ORIGIN:-http://localhost:5175}"
cd "$BACKEND_DIR"
exec uv run --frozen uvicorn sc_api.main:app --reload --reload-dir src --host 127.0.0.1 --port "${PORT:-8000}"
