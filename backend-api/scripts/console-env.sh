#!/usr/bin/env bash
# Points the local frontend at the local API: the console's .env.local (the API, and its Firebase web config from
# Terraform's console_firebase_config output) and the landing page's. Both files are git-ignored. The Firebase config
# is public by design (it ships in the console's JavaScript); it is still never committed.
#   backend-api/scripts/console-env.sh [API base, default http://localhost:8000]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need jq terraform

base="${1:-http://localhost:${PORT:-8000}}"
use_terraform_credentials
config="$(tf prod output -json console_firebase_config)" || die "no console_firebase_config: apply infra/prod (auth.tf) first"
{
	echo "# written by backend-api/scripts/console-env.sh; git-ignored"
	echo "PUBLIC_API_BASE=$base"
	jq -r '"PUBLIC_FIREBASE_API_KEY=\(.apiKey)\nPUBLIC_FIREBASE_AUTH_DOMAIN=\(.authDomain)\nPUBLIC_FIREBASE_PROJECT_ID=\(.projectId)\nPUBLIC_FIREBASE_APP_ID=\(.appId)"' <<<"$config"
} >"$FRONTEND_DIR/console/.env.local"
printf '# written by backend-api/scripts/console-env.sh; git-ignored\nPUBLIC_API_BASE=%s\n' "$base" >"$FRONTEND_DIR/admin/.env.local"
echo "console-env: frontend/console/.env.local and frontend/admin/.env.local point at $base"
