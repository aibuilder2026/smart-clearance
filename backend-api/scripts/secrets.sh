#!/usr/bin/env bash
# backend-api's secrets in Secret Manager: generated here, piped to gcloud on stdin, and never written to a file, a
# command line or the terminal. Terraform made the containers (infra/prod/secrets.tf) and never holds a value.
#   backend-api/scripts/secrets.sh            add a first version to any secret that has none
#   backend-api/scripts/secrets.sh --rotate   new versions for all, then re-apply them: the local database's passwords
#                                             (db-init.sh) and every account still on the default password
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need gcloud openssl

SECRETS="sc-default-user-password sc-local-db-app-password sc-local-db-migrator-password"
rotate=false
[[ ${1:-} == --rotate ]] && rotate=true

for id in $SECRETS; do
	gcloud secrets describe "$id" --project="$PROJECT_ID" >/dev/null 2>&1 ||
		die "secret $id is missing: apply infra/prod (secrets.tf) first"
	has="$(gcloud secrets versions list "$id" --project="$PROJECT_ID" --filter='state=ENABLED' --limit=1 --format='value(name)' 2>/dev/null)"
	if [[ -z $has ]] || $rotate; then
		new_password | gcloud secrets versions add "$id" --project="$PROJECT_ID" --data-file=- >/dev/null
		echo "secrets: $id has a new version"
	else
		echo "secrets: $id is set"
	fi
done

if $rotate; then
	"$BACKEND_DIR/scripts/db-init.sh"
	as_api
	uv_run sc-admin reset-passwords --still-default
fi
