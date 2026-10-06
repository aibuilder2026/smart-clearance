#!/usr/bin/env bash
# The test suite, against smart_clearance_test in the local Docker Postgres (made, or re-made, by db-init.sh with the
# same logins). The suite migrates it from scratch itself, and never reaches Firebase. Arguments go to pytest.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv docker gcloud

"$BACKEND_DIR/scripts/db-init.sh" --db smart_clearance_test >/dev/null
as_api
export SC_ENV=test IDENTITY=fake DB_NAME=smart_clearance_test
export TEST_MIGRATOR_PASSWORD_SECRET
TEST_MIGRATOR_PASSWORD_SECRET="$(secret_ref sc-local-db-migrator-password)"
uv_run pytest "$@"
