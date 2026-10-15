#!/usr/bin/env bash
# SC-208: one real trace from production, read only, for the film's audit scene: Rakesh Traders' label photo for the
# Masala Chips (13 Oct 2026, the sad path's run), from his upload through backend-api, Pub/Sub and the agents' decide
# pipeline (Vision on Gemini Flash, the Valuer with BigQuery's sales history and Gemini Pro, the Router on Gemini Pro)
# back to backend-api: its spans from Cloud Trace and the log lines that carry it from Cloud Logging, as the gcloud
# user (read access to the project). Writes build/trace/trace.json and build/trace/logs.json.
#   ./fetch-trace.sh [trace id]
set -eu
cd "$(dirname "$0")"
PROJECT=aibuilder-510213; TRACE="${1:-218be140447598ff3b45ea8a2657618f}"
mkdir -p build/trace
curl -sf -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://cloudtrace.googleapis.com/v1/projects/$PROJECT/traces/$TRACE" -o build/trace/trace.json
gcloud logging read "trace=\"projects/$PROJECT/traces/$TRACE\"" --project "$PROJECT" --order asc --limit 100 \
  --freshness 30d --format json > build/trace/logs.json
echo "trace $TRACE: $(python3 -c 'import json; print(len(json.load(open("build/trace/trace.json"))["spans"]))') spans, $(python3 -c 'import json; print(len(json.load(open("build/trace/logs.json"))))') log lines"
