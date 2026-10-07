#!/usr/bin/env bash
# The agents' evals against live Gemini (agents/evals/): each case set run through its writer, scored by
# deterministic checks and a Gemini Pro judge at temperature 0, each case's result into BigQuery's
# smartclearance_local.agent_evals and a summary JSON beside the set.
#
#   agents/scripts/eval.sh [vision|data|valuer|router|lister|outreach|negotiator] [--split held-out] [--limit N] [--yes]
#
# Run on request only: a full run costs about GBP 1-2 in Gemini calls (each set's estimate is printed first). Needs
# the models named (MODEL_PRO, MODEL_FLASH) and sc-agents-local (infra phase A, SC-70).
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

agents_env local
need_models
export MODEL_TIER=live
cd "$AGENTS_DIR"
exec uv run --frozen sc-agents-eval "$@"
