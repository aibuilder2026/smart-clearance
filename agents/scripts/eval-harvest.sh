#!/usr/bin/env bash
# The runs worth a look as new eval cases: every live agent run that fell back to backend-api's template, or that a
# person corrected, read from the local database (read only) with what the case held at the time. Writes one JSON
# line per run to agents/evals/harvest/<date>.jsonl for the maintainer to accept (or not) into a case set.
#
#   agents/scripts/eval-harvest.sh [--days N] [--db smart_clearance]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need docker

days=14
db=smart_clearance
while [[ $# -gt 0 ]]; do
	case "$1" in
	--days) days="$2" && shift 2 ;;
	--db) db="$2" && shift 2 ;;
	*) die "unknown option $1" ;;
	esac
done
[[ $days =~ ^[0-9]+$ ]] || die "--days takes a number"
[[ $db =~ ^[a-z_]+$ ]] || die "--db takes a database name"

docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null | grep -q true ||
	die "no running container '$PG_CONTAINER'"

out_dir="$AGENTS_DIR/evals/harvest"
mkdir -p "$out_dir"
out="$out_dir/$(date +%Y-%m-%d).jsonl"

# read only: the session cannot write, whatever the query
docker exec -i "$PG_CONTAINER" psql -U postgres -d "$db" -X -q -A -t -v ON_ERROR_STOP=1 -v days="$days" >"$out" <<'SQL'
SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;
SELECT json_build_object(
  'runId', r.run_id, 'agent', r.agent_id, 'client', r.client_id, 'at', r.ran_at, 'text', r.text,
  'status', r.status, 'model', r.model, 'fallback', r.fallback, 'corrected', r.corrected, 'trace', r.trace_id,
  'batch', c.batch_ref,
  'case', CASE r.agent_id
    WHEN 'vision' THEN json_build_object('photo', c.photo)
    WHEN 'router' THEN json_build_object('explanation', c.plan->'explanation', 'net', c.plan->'net')
    WHEN 'valuer' THEN json_build_object('valuation', c.valuation)
    WHEN 'lister' THEN json_build_object('title', c.listing->'title', 'description', c.listing->'description')
    WHEN 'outreach' THEN json_build_object('words', c.offer->'words')
    WHEN 'negotiator' THEN json_build_object('chat', (
      SELECT json_agg(json_build_object('from', m.sender, 'text', m.text) ORDER BY m.id)
      FROM sc.case_messages m WHERE m.case_id = c.id))
    ELSE NULL END
)
FROM sc.agent_runs r LEFT JOIN sc.cases c ON c.id = r.case_id
WHERE (r.fallback OR r.corrected) AND r.ran_at > now() - make_interval(days => :days)
ORDER BY r.id DESC;
SQL

n="$(grep -c . "$out" || true)"
echo "eval-harvest: $n run(s) to review in ${out#"$REPO_DIR"/}"
