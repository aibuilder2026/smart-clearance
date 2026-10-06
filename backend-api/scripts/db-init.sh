#!/usr/bin/env bash
# The local database and its logins, in the Docker Postgres the developer already runs (default container: postgres).
# Runs as the superuser over the container's own socket, which the official image trusts, so no superuser password is
# needed; the logins' passwords come from Secret Manager and go in on stdin. Safe to re-run.
#   backend-api/scripts/db-init.sh [--container NAME] [--db NAME]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need docker gcloud

while [[ $# -gt 0 ]]; do
	case $1 in
	--container) PG_CONTAINER=$2 && shift 2 ;;
	--db) DB_NAME=$2 && shift 2 ;;
	*) die "usage: ${0##*/} [--container NAME] [--db NAME]" ;;
	esac
done

docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null | grep -q true ||
	die "no running container '$PG_CONTAINER': start your Postgres, or pass --container (or: docker compose --profile db up -d)"

app_password="$(secret_value sc-local-db-app-password)" || die "no app password: run scripts/secrets.sh first"
migrator_password="$(secret_value sc-local-db-migrator-password)" || die "no migrator password: run scripts/secrets.sh first"
{
	# printf is a shell builtin: the values reach psql on stdin, never on a command line
	printf '\\set db %s\n' "$DB_NAME"
	printf '\\set app_password %s\n' "$app_password"
	printf '\\set migrator_password %s\n' "$migrator_password"
	cat "$BACKEND_DIR/db/roles.sql" "$BACKEND_DIR/db/init-local.sql"
} | docker exec -i "$PG_CONTAINER" psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 >/dev/null
unset app_password migrator_password
echo "db-init: database $DB_NAME, roles sc_owner and sc_app, logins sc_migrator and sc_api ($PG_CONTAINER)"
