#!/usr/bin/env bash
# Firebase custom tokens for the people of Munchly's journey (SC-95, src/sc_api/cli/sessions.py), signed as
# sc-api-local (impersonated in code): the Munchly Chips E2E suite signs each person in with one, so no password is
# handled. JSON on stdout; keep it out of logs. Needs frontend/workspace/.env.local (scripts/app-env.sh).
#   backend-api/scripts/sessions.sh priya rakesh neha …
#   backend-api/scripts/sessions.sh --all
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv
uv_run python -m sc_api.cli.sessions "$@"
