# shellcheck shell=bash
# shellcheck disable=SC2034 # the names here are for the scripts that source this file
# Shared by backend-api's scripts (sourced, not run). The project and region come from infra's terraform.tfvars, so
# nothing here names a project: moving to another project is a tfvars change. Written for the bash 3.2 macOS ships.

# shellcheck source=../../infra/scripts/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../infra/scripts" && pwd)/lib.sh"

BACKEND_DIR="$REPO_DIR/backend-api"
REGION="$(tfvar prod region)"
DB_NAME="${DB_NAME:-smart_clearance}"
PG_CONTAINER="${PG_CONTAINER:-postgres}"

secret_ref() { echo "projects/$PROJECT_ID/secrets/$1"; }

# what a local backend runs with: sc-api-local's privileges (impersonated in code), the secrets by reference only
export SC_ENV="${SC_ENV:-local}"
export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
export SC_IMPERSONATE_SA="${SC_IMPERSONATE_SA:-sc-api-local@$PROJECT_ID.iam.gserviceaccount.com}"
export DEFAULT_PASSWORD_SECRET="${DEFAULT_PASSWORD_SECRET:-$(secret_ref sc-default-user-password)}"
export DB_NAME DB_HOST="${DB_HOST:-127.0.0.1}" DB_PORT="${DB_PORT:-5432}"

# as the API (sc_api) or as migrations (sc_migrator)
as_api() {
	export DB_USER=sc_api DB_PASSWORD_SECRET
	DB_PASSWORD_SECRET="$(secret_ref sc-local-db-app-password)"
}
as_migrator() {
	export DB_USER=sc_migrator DB_PASSWORD_SECRET
	DB_PASSWORD_SECRET="$(secret_ref sc-local-db-migrator-password)"
}

need() {
	local tool
	for tool in "$@"; do command -v "$tool" >/dev/null || die "needs $tool"; done
}

# a secret's latest value on stdout, for a pipe; never echo it to a terminal
secret_value() {
	gcloud secrets versions access latest --secret="$1" --project="$PROJECT_ID"
}

# a password Identity Platform's policy accepts: 24 letters and digits, with an upper-case and a lower-case letter and
# a digit (infra/scripts/auth-policy.sh)
new_password() {
	local p=""
	while ! [[ $p =~ [A-Z] && $p =~ [a-z] && $p =~ [0-9] ]]; do
		p="$(openssl rand -base64 48 | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 24)"
	done
	printf '%s' "$p"
}

uv_run() { (cd "$BACKEND_DIR" && uv run --frozen "$@"); }

# the live workspace's cloud resources for an environment (infra/prod events.tf, storage.tf, agents.tf: SC-66), by
# their names, so a laptop needs no Terraform to run; `local` is what a developer's backend and agents use
journey_env() {
	local env="${1:-local}"
	export EVENTS_ENV="$env"
	export PHOTOS_BUCKET="${PHOTOS_BUCKET:-$PROJECT_ID-sc-photos-$env}"
	export DOCS_BUCKET="${DOCS_BUCKET:-$PROJECT_ID-sc-docs-$env}"
	export EXPORTS_BUCKET="${EXPORTS_BUCKET:-$PROJECT_ID-sc-exports-$env}"
	local agents="sc-agents@$PROJECT_ID.iam.gserviceaccount.com"
	[[ $env == local ]] && agents="sc-agents-local@$PROJECT_ID.iam.gserviceaccount.com"
	export INTERNAL_CALLERS="${INTERNAL_CALLERS:-$agents,sc-invoker@$PROJECT_ID.iam.gserviceaccount.com}"
}
