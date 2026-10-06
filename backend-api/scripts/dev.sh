#!/usr/bin/env bash
# The API on http://localhost:8000 (PORT to change it), reloading on every change, as sc-api-local (impersonated in
# code, from your own gcloud credentials) against the local database and the project's Firebase Authentication.
# The console and the landing page call it once their PUBLIC_API_BASE is http://localhost:8000.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

as_api
cd "$BACKEND_DIR"
exec uv run --frozen uvicorn sc_api.main:app --reload --reload-dir src --host 127.0.0.1 --port "${PORT:-8000}"
