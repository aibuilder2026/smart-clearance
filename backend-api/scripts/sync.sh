#!/usr/bin/env bash
# Production's data replaced with local's (SC-136), so the app on Cloud Run reads the dataset a local backend reads:
#
#   backend-api/scripts/sync.sh                        the plan: what each side holds; changes nothing
#   backend-api/scripts/sync.sh --apply --allow-env prod
#   backend-api/scripts/sync.sh --rehearse              the database's transaction, into a scratch local database
#
# --apply, in order:
#   1. an on-demand backup of Cloud SQL sc-main, the way back (point-in-time recovery is on too);
#   2. the database: every table of schema sc replaced with local's in one transaction (src/sc_api/cli/sync.py), the
#      audit log included, its append-only guard lifted for that transaction only;
#   3. the buckets: local's photos, docs (the papers' PDFs) and exports copied over production's, same names. Objects
#      only production has are kept, so the backup stays restorable; the buckets' 30-day lifecycle removes them;
#   4. BigQuery: each of the seven tables in smartclearance replaced with smartclearance_local's, secondary_sales'
#      source_file pointing at the prod exports bucket. BigQuery's time travel keeps the old rows for seven days;
#   5. the plan again, which should show both sides the same.
#
# The operator acts as sc-migrator, which infra/prod allows only until data_sync_until (terraform.tfvars). Local's
# password is read from Secret Manager by reference, in memory. Costs nothing measurable.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud bq python3

apply=0
rehearse=0
env=""
while [[ $# -gt 0 ]]; do
	case "$1" in
	--apply) apply=1 ;;
	--rehearse) rehearse=1 ;;
	--allow-env)
		env="${2:-}"
		shift
		;;
	*) die "unknown argument $1 (--apply --allow-env prod)" ;;
	esac
	shift
done
if [[ $apply == 1 && $env != prod ]]; then die "--apply replaces production's data: pass --allow-env prod too"; fi

as_migrator
# the database's transaction rehearsed: local's tables into smart_clearance_rehearsal, made and migrated afresh
if [[ $rehearse == 1 ]]; then
	"$BACKEND_DIR/scripts/db-init.sh" --db smart_clearance_rehearsal >/dev/null
	DB_NAME=smart_clearance_rehearsal "$BACKEND_DIR/scripts/migrate.sh" >/dev/null
	SYNC_REHEARSAL_DB=smart_clearance_rehearsal uv_run python -m sc_api.cli.sync apply
	exit 0
fi
INSTANCE_NAME=sc-main
SYNC_PROD_INSTANCE="$(gcloud sql instances describe "$INSTANCE_NAME" --project "$PROJECT_ID" --format='value(connectionName)')"
export SYNC_PROD_INSTANCE SYNC_PROD_USER="sc-migrator@$PROJECT_ID.iam"
export SYNC_PROD_SA="sc-migrator@$PROJECT_ID.iam.gserviceaccount.com"
KINDS="photos docs exports"
LOCAL_DS="$PROJECT_ID:smartclearance_local"
PROD_DS="$PROJECT_ID:smartclearance"
TABLES="$(bq ls --format=json "$LOCAL_DS" | python3 -c 'import sys,json; print(" ".join(sorted(t["tableReference"]["tableId"] for t in json.load(sys.stdin))))')"

objects() { gcloud storage ls --recursive "gs://$1" 2>/dev/null | grep -cv '/:$\|^$' || true; }
rows() { bq show --format=json "$1" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("numRows", "0"))'; }

plan() {
	echo "== the database"
	uv_run python -m sc_api.cli.sync plan
	echo "== the buckets (objects)"
	for k in $KINDS; do
		printf '%-8s local %5s  production %5s\n' "$k" "$(objects "$PROJECT_ID-sc-$k-local")" "$(objects "$PROJECT_ID-sc-$k-prod")"
	done
	echo "== BigQuery (rows)"
	for t in $TABLES; do
		printf '%-16s local %6s  production %6s\n' "$t" "$(rows "$LOCAL_DS.$t")" "$(rows "$PROD_DS.$t")"
	done
}

if [[ $apply == 0 ]]; then
	plan
	exit 0
fi

# the same schemas on both sides before anything is replaced
for t in $TABLES; do
	if [[ "$(bq show --schema --format=json "$LOCAL_DS.$t")" != "$(bq show --schema --format=json "$PROD_DS.$t")" ]]; then
		die "BigQuery's $t has another schema in production: apply infra first"
	fi
done

echo "== 1. backup of $INSTANCE_NAME"
gcloud sql backups create --instance "$INSTANCE_NAME" --project "$PROJECT_ID" \
	--description "Before SC-136's sync of local's data, $(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "== 2. the database"
uv_run python -m sc_api.cli.sync apply

echo "== 3. the buckets"
for k in $KINDS; do
	gcloud storage rsync --recursive "gs://$PROJECT_ID-sc-$k-local" "gs://$PROJECT_ID-sc-$k-prod"
done

echo "== 4. BigQuery"
for t in $TABLES; do
	select="SELECT * FROM \`$PROJECT_ID.smartclearance_local.$t\`"
	if [[ $t == secondary_sales ]]; then
		select="SELECT * REPLACE (REPLACE(source_file, '-sc-exports-local/', '-sc-exports-prod/') AS source_file) FROM \`$PROJECT_ID.smartclearance_local.$t\`"
	fi
	bq query --quiet --use_legacy_sql=false --project_id "$PROJECT_ID" \
		"TRUNCATE TABLE \`$PROJECT_ID.smartclearance.$t\`; INSERT INTO \`$PROJECT_ID.smartclearance.$t\` $select" >/dev/null
	echo "$t replaced"
done

echo "== 5. the plan again"
plan
