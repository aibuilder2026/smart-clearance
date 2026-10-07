# shellcheck shell=bash
# shellcheck disable=SC2034 # the names here are for the scripts that source this file
# Shared by the agents' scripts (sourced, not run). The project and region come from infra's terraform.tfvars, so
# nothing here names a project. Written for the bash 3.2 macOS ships.

# shellcheck source=../../infra/scripts/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../infra/scripts" && pwd)/lib.sh"

AGENTS_DIR="$REPO_DIR/agents"
REGION="$(tfvar prod region)"
PG_CONTAINER="${PG_CONTAINER:-postgres}"

export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"

need() {
	local tool
	for tool in "$@"; do command -v "$tool" >/dev/null || die "needs $tool"; done
}

uv_run() { (cd "$AGENTS_DIR" && uv run --frozen "$@"); }

# An environment's resources by their names (infra/prod events.tf, storage.tf, analytics.tf, agents.tf: SC-70), so a
# laptop needs no Terraform to run. `local` is a developer's: sc-agents-local, impersonated in code from your own
# gcloud credentials, the local.* subscriptions, the -local buckets and the smartclearance_local dataset.
agents_env() {
	local env="${1:-local}"
	export AGENTS_ENV="$env"
	export PHOTOS_BUCKET="${PHOTOS_BUCKET:-$PROJECT_ID-sc-photos-$env}"
	export DOCS_BUCKET="${DOCS_BUCKET:-$PROJECT_ID-sc-docs-$env}"
	export EXPORTS_BUCKET="${EXPORTS_BUCKET:-$PROJECT_ID-sc-exports-$env}"
	export BQ_LOCATION="${BQ_LOCATION:-$REGION}"
	if [[ $env == local ]]; then
		export BQ_DATASET="${BQ_DATASET:-smartclearance_local}"
		export SC_IMPERSONATE_SA="${SC_IMPERSONATE_SA:-sc-agents-local@$PROJECT_ID.iam.gserviceaccount.com}"
		export API_BASE="${API_BASE:-http://localhost:8000}"
	else
		export BQ_DATASET="${BQ_DATASET:-smartclearance}"
	fi
}

# the model ids, from the environment or agents/.env (never a default: README, "Models")
need_models() {
	[[ ${MODEL_TIER:-live} == stub ]] && return 0
	local env_file="$AGENTS_DIR/.env"
	if [[ -z ${MODEL_PRO:-} || -z ${MODEL_FLASH:-} ]] && ! grep -qs '^MODEL_PRO=.' "$env_file"; then
		die "set MODEL_PRO and MODEL_FLASH (agents/.env.example), or MODEL_TIER=stub"
	fi
}
