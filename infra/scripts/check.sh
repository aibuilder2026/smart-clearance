#!/usr/bin/env bash
# The infra gate, which jira-flow runs for changes under infra/: formatting, validation and the scripts' syntax.
# It needs no credentials and never touches state.

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

terraform -chdir="$INFRA_DIR" fmt -check -recursive -diff
for root in bootstrap prod; do
	# Its own data directory: `init -backend=false` in one already set up for the GCS backend still opens the backend,
	# which needs credentials. Inside .terraform/, so it is ignored and keeps its providers between runs.
	export TF_DATA_DIR="$INFRA_DIR/$root/.terraform/check"
	terraform -chdir="$INFRA_DIR/$root" init -backend=false -input=false >/dev/null
	terraform -chdir="$INFRA_DIR/$root" validate
done
unset TF_DATA_DIR

# A backend block cannot read variables, so check by hand that both roots agree on the project and the state bucket.
[[ $(tfvar bootstrap project_id) == "$PROJECT_ID" ]] || die "infra/bootstrap and infra/prod name different projects"
for root in bootstrap prod; do
	grep -q "bucket = \"$STATE_BUCKET\"" "$INFRA_DIR/$root/versions.tf" ||
		die "infra/$root/versions.tf: the backend bucket should be $STATE_BUCKET"
done

for script in "$INFRA_DIR"/scripts/*.sh; do bash -n "$script"; done
if command -v shellcheck >/dev/null; then shellcheck -x "$INFRA_DIR"/scripts/*.sh; fi
echo "infra: fmt, validate and scripts pass"
