#!/usr/bin/env bash
# Points the local frontend at an API: the console's, the landing page's and the workspace app's .env.local (the API,
# and each app's Firebase web config from Terraform's outputs). All three files are git-ignored. A Firebase config is
# public by design (it ships in the app's JavaScript); it is still never committed.
#   backend-api/scripts/app-env.sh [API base, default http://localhost:8000]
# The workspace app (SC-66) also learns which workspace it serves (munchly) and FCM's sender id for push.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need jq terraform

base="${1:-http://localhost:${PORT:-8000}}"
workspace="${WORKSPACE_ID:-munchly}"
use_terraform_credentials
config="$(tf prod output -json console_firebase_config)" || die "no console_firebase_config: apply infra/prod (auth.tf) first"
{
	echo "# written by backend-api/scripts/app-env.sh; git-ignored"
	echo "PUBLIC_API_BASE=$base"
	jq -r '"PUBLIC_FIREBASE_API_KEY=\(.apiKey)\nPUBLIC_FIREBASE_AUTH_DOMAIN=\(.authDomain)\nPUBLIC_FIREBASE_PROJECT_ID=\(.projectId)\nPUBLIC_FIREBASE_APP_ID=\(.appId)"' <<<"$config"
} >"$FRONTEND_DIR/console/.env.local"
printf '# written by backend-api/scripts/app-env.sh; git-ignored\nPUBLIC_API_BASE=%s\n' "$base" >"$FRONTEND_DIR/admin/.env.local"
written="frontend/console/.env.local and frontend/admin/.env.local"
if ws="$(tf prod output -json workspace_firebase_config 2>/dev/null)"; then
	{
		echo "# written by backend-api/scripts/app-env.sh; git-ignored"
		echo "PUBLIC_API_BASE=$base"
		echo "PUBLIC_WORKSPACE_ID=$workspace"
		jq -r '"PUBLIC_FIREBASE_API_KEY=\(.apiKey)\nPUBLIC_FIREBASE_AUTH_DOMAIN=\(.authDomain)\nPUBLIC_FIREBASE_PROJECT_ID=\(.projectId)\nPUBLIC_FIREBASE_APP_ID=\(.appId)\nPUBLIC_FIREBASE_MESSAGING_SENDER_ID=\(.messagingSenderId)"' <<<"$ws"
	} >"$FRONTEND_DIR/workspace/.env.local"
	written="frontend/console/.env.local, frontend/admin/.env.local and frontend/workspace/.env.local"
else
	echo "app-env: no workspace_firebase_config yet (apply infra phase A, SC-70); the workspace app stays on its stub" >&2
fi
echo "app-env: $written point at $base"
