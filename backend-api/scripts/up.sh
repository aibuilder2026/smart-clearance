#!/usr/bin/env bash
# The API in its container (compose.yaml), as Cloud Run runs it, on http://localhost:8000.
#   backend-api/scripts/up.sh            build and run the API against your Docker Postgres
#   backend-api/scripts/up.sh --with-db  also start a Postgres 18 of its own (container sc-postgres), for a machine
#                                        without one; then run db-init.sh --container sc-postgres, migrate and hydrate
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need docker gcloud

as_api
export DB_PASSWORD_SECRET
cd "$BACKEND_DIR"
if [[ ${1:-} == --with-db ]]; then
	if ! docker inspect sc-postgres >/dev/null 2>&1; then
		PG_THROWAWAY_PASSWORD="$(openssl rand -hex 24)" docker compose --profile db up -d db
	else
		docker compose --profile db up -d db
	fi
	export DB_PORT
fi
exec docker compose up --build api
