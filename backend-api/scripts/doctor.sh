#!/usr/bin/env bash
# What backend-api needs on this machine and in the project, checked one by one; it changes nothing.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

fails=0
check() {
	local what=$1
	shift
	if "$@" >/dev/null 2>&1; then echo "  ok    $what"; else
		echo "  FAIL  $what"
		fails=$((fails + 1))
	fi
}
echo "doctor: project $PROJECT_ID, region $REGION"
check "docker" docker info
check "uv" uv --version
check "gcloud signed in" gcloud auth print-access-token
check "application-default credentials (gcloud auth application-default login)" has_adc
check "may act as $SC_IMPERSONATE_SA" gcloud auth print-access-token --impersonate-service-account="$SC_IMPERSONATE_SA"
check "Firebase Auth configured (infra/prod/auth.tf)" bash -c "curl -sf -H \"Authorization: Bearer \$(gcloud auth print-access-token)\" -H 'x-goog-user-project: $PROJECT_ID' https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT_ID/config"
for s in sc-default-user-password sc-local-db-app-password sc-local-db-migrator-password; do
	check "secret $s has a version (scripts/secrets.sh)" gcloud secrets versions describe latest --secret="$s" --project="$PROJECT_ID"
done
check "Postgres container '$PG_CONTAINER' running" bash -c "docker inspect -f '{{.State.Running}}' $PG_CONTAINER | grep -q true"
check "database $DB_NAME (scripts/db-init.sh)" bash -c "docker exec $PG_CONTAINER psql -U postgres -tAc \"select 1 from pg_database where datname='$DB_NAME'\" | grep -q 1"
check "schema migrated (scripts/migrate.sh)" bash -c "docker exec $PG_CONTAINER psql -U postgres -d $DB_NAME -tAc 'select version_num from sc.alembic_version' | grep -q ."
[[ $fails -eq 0 ]] || die "$fails check(s) failed"
echo "doctor: all good"
