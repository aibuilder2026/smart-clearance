#!/usr/bin/env bash
# The agents on a laptop: the pull worker, as sc-agents-local (impersonated in code, from your own gcloud credentials),
# on the local environment's resources with no emulator: it pulls local.agents.batch.at_risk, .offer.received,
# .deal.closed and .journey.step, calls the local backend (backend-api/scripts/dev.sh, on http://localhost:8000),
# reads and writes BigQuery's smartclearance_local and the -local buckets, and calls Gemini on Vertex AI.
#
# Needs infra phase A applied (SC-70: the topics, subscriptions, buckets, dataset and sc-agents-local), and the models
# named (MODEL_PRO, MODEL_FLASH in the environment or agents/.env). MODEL_TIER=stub replays the recordings instead.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

agents_env local
need_models
cd "$AGENTS_DIR"
# the Paperwork agent's PDFs need Pango (SC-100); without it the papers carry no PDF
uv run --frozen python -c 'import weasyprint' >/dev/null 2>&1 ||
	echo "agents: WeasyPrint cannot load Pango, so the papers will carry no PDF (on a Mac: brew install pango)" >&2
exec uv run --frozen sc-agents-worker
