#!/usr/bin/env bash
# From nothing to a working backend in this project, the lift-and-shift path (infra/README.md, Moving it to another
# project): after infra/prod is applied and infra/scripts/auth-policy.sh has run, this makes the secrets, the local
# database and its logins, the schema and reference data, and the synthetic world. Safe to re-run: what exists is kept.
#   backend-api/scripts/bootstrap.sh [hydrate options, e.g. --seed 7 --clients 6]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

cd "$BACKEND_DIR"
uv sync --frozen
scripts/secrets.sh
scripts/db-init.sh
scripts/migrate.sh
scripts/doctor.sh
if scripts/hydrate.sh "$@"; then :; else echo "bootstrap: hydrate skipped (already hydrated? scripts/hydrate.sh --reset rebuilds)"; fi
echo "bootstrap: done. Run scripts/dev.sh for the API, scripts/console-env.sh for the frontend's .env.local."
