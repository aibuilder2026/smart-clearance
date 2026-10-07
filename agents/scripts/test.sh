#!/usr/bin/env bash
# The agents' test suite: no network, no live model (the stub tier's recordings), backend-api as an httpx
# MockTransport, BigQuery and Cloud Storage as fakes. A few seconds. Arguments go to pytest.
set -euo pipefail
cd "$(dirname "$0")/.."
export MODEL_TIER=stub AGENTS_ENV=test
exec uv run --frozen pytest "$@"
