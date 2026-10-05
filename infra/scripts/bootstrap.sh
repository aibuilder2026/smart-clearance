#!/usr/bin/env bash
# Once per project, and safe to run again: the state bucket and the APIs Terraform itself calls (infra/bootstrap).
#   infra/scripts/bootstrap.sh [terraform apply flags, e.g. -auto-approve]
#
# On the first run there is no bucket to keep state in: it applies on local state, then migrates that state into the
# bucket it has just made. Later runs use the bucket like any other root.

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
use_terraform_credentials

root="$INFRA_DIR/bootstrap"
override="$root/backend_override.tf"

if gcloud storage buckets describe "gs://$STATE_BUCKET" --project "$PROJECT_ID" >/dev/null 2>&1; then
	# A plain init: if an earlier first run stopped before migrating, this stops too, rather than drop that state.
	terraform -chdir="$root" init -input=false >&2
	terraform -chdir="$root" apply "$@"
	exit
fi

echo "bootstrap: gs://$STATE_BUCKET does not exist yet; applying on local state first" >&2
trap 'rm -f "$override"' EXIT
printf 'terraform {\n  backend "local" {}\n}\n' >"$override"
terraform -chdir="$root" init -input=false -reconfigure
terraform -chdir="$root" apply "$@"

rm -f "$override"
terraform -chdir="$root" init -input=false -migrate-state -force-copy
rm -f "$root/terraform.tfstate" "$root/terraform.tfstate.backup"
echo "bootstrap: state is in gs://$STATE_BUCKET/bootstrap" >&2
