#!/usr/bin/env bash
# The local database's schema and reference data: Alembic as sc_migrator (objects owned by sc_owner), then the
# reference data from src/sc_api/reference/ (plans, agents, exits, connectors, roles, the console's config, the
# showcase). Safe to re-run. Pass Alembic arguments to do something else: migrate.sh downgrade -1
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

as_migrator
if [[ $# -gt 0 ]]; then
	uv_run alembic "$@"
else
	uv_run sc-admin migrate
fi
