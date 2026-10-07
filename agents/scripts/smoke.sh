#!/usr/bin/env bash
# A live smoke test of the models (not part of any gate, and never run by CI): each writer called once on Vertex AI
# with the story's facts (agents/tests/fixtures/story.json), its output and the checks it passes printed. About a dozen
# calls, a few pence. --record writes the outputs into src/sc_agents/recordings/, the stub tier's replies.
#
#   agents/scripts/smoke.sh [--record]
#
# Needs MODEL_PRO and MODEL_FLASH, and credentials that may call Vertex AI (sc-agents-local, impersonated).
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

agents_env local
need_models
export MODEL_TIER=live
cd "$AGENTS_DIR"
exec uv run --frozen python -m sc_agents.evals.smoke "$@"
