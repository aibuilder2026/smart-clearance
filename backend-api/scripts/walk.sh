#!/usr/bin/env bash
# Munchly's live journey walked on this machine (SC-73, src/sc_api/cli/walk.py): each person's step over HTTP against
# scripts/dev.sh's API, signed in with Firebase custom tokens minted as sc-api-local (no password is handled), while
# agents/scripts/dev.sh answers through Pub/Sub, BigQuery and Cloud Storage. Needs infra phase A (SC-70), a local world
# (scripts/hydrate.sh --reset) and frontend/workspace/.env.local (scripts/app-env.sh).
#   backend-api/scripts/walk.sh [--day-minutes N] [--until setup|detect|photo|plan|approve|orders|deal|donation|settle|papers]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv curl
curl -sf "http://localhost:${PORT:-8000}/readyz" >/dev/null || die "backend-api is not answering on :${PORT:-8000}: run scripts/dev.sh"
[[ $SC_ENV == local ]] || die "walk acts on a local database only (SC_ENV is $SC_ENV)"
as_api
journey_env local
uv_run sc-walk "$@"
