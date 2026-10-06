#!/usr/bin/env bash
# backend-api's OpenAPI document, exported to contracts/openapi.json (a test fails when it is out of date).
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv

cd "$BACKEND_DIR"
SC_ENV=test IDENTITY=fake uv run --frozen python -c '
import json
from sc_api.main import create_app
print(json.dumps(create_app().openapi(), indent=2, sort_keys=True))' >contracts/openapi.json
echo "contracts: wrote contracts/openapi.json"
