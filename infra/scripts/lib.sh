# shellcheck shell=bash
# shellcheck disable=SC2034 # the paths and names here are for the scripts that source this file
# Shared by the infra scripts (sourced, not run): paths, the project, and Google and GitHub credentials.
# Written for the bash 3.2 that macOS ships, as well as newer ones.

set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$INFRA_DIR/.." && pwd)"
FRONTEND_DIR="$REPO_DIR/frontend"

# A string variable from a root's terraform.tfvars, so each value is written down once.
tfvar() {
	sed -nE "s/^$2[[:space:]]*=[[:space:]]*\"([^\"]*)\".*/\1/p" "$INFRA_DIR/$1/terraform.tfvars"
}

PROJECT_ID="$(tfvar prod project_id)"
STATE_BUCKET="$PROJECT_ID-tfstate"

die() {
	echo "${0##*/}: $*" >&2
	exit 1
}

has_adc() {
	[[ -n ${GOOGLE_APPLICATION_CREDENTIALS:-} || -f ${CLOUDSDK_CONFIG:-$HOME/.config/gcloud}/application_default_credentials.json ]]
}

# Terraform runs on application-default credentials when there are any. Otherwise it borrows a short-lived token from
# the signed-in gcloud account (good for an hour, which is plenty for one run).
use_terraform_credentials() {
	if [[ -z ${GOOGLE_OAUTH_ACCESS_TOKEN:-} ]] && ! has_adc; then
		command -v gcloud >/dev/null || die "needs gcloud, or application-default credentials"
		GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)" ||
			die "gcloud has no signed-in account: run 'gcloud auth login'"
		export GOOGLE_OAUTH_ACCESS_TOKEN
	fi
	# infra/prod also holds the repository's prod environment (github.tf); the GitHub provider reads GITHUB_TOKEN
	if [[ -z ${GITHUB_TOKEN:-} ]] && command -v gh >/dev/null; then
		GITHUB_TOKEN="$(gh auth token)" || die "gh has no signed-in account: run 'gh auth login'"
		export GITHUB_TOKEN
	fi
}

# terraform in one of infra's roots, initialised on first use: tf <root> <args...>
# .terraform/terraform.tfstate records the backend; check.sh's `init -backend=false` leaves .terraform without it.
tf() {
	local root="$INFRA_DIR/$1"
	shift
	[[ -f $root/.terraform/terraform.tfstate ]] || terraform -chdir="$root" init -input=false >&2
	terraform -chdir="$root" "$@"
}
