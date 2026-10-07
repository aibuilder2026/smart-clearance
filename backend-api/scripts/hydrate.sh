#!/usr/bin/env bash
# A working world in the local database, through the API's own services: Munchly Foods (design3's story), the
# platform's staff, and generated clients from their demo requests to live. Every user with an email address gets a
# Firebase account on the default password (scripts/default-password.sh shows it); nothing is mailed.
#   backend-api/scripts/hydrate.sh [--seed N] [--clients N] [--staff N] [--days N] [--no-demo-story]
#   backend-api/scripts/hydrate.sh --reset [...]   drop the schema, migrate, hydrate again (Firebase accounts are kept)
#   backend-api/scripts/hydrate.sh --tick          today's agent runs, so the console's day is today
#   backend-api/scripts/hydrate.sh --journey-reset munchly   Munchly's live journey from its start again (SC-66)
# Munchly's live workspace (SC-66) is built with the story: every member on email and password, the kiranas, and its
# synthetic stock exports in the local exports bucket; --no-live leaves it out.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need uv gcloud

reset=false
args=()
for a in "$@"; do
	if [[ $a == --reset ]]; then reset=true; else args+=("$a"); fi
done

[[ $SC_ENV == local ]] || die "hydrate rebuilds a local database only (SC_ENV is $SC_ENV)"
if $reset; then
	as_migrator
	uv_run sc-admin reset-schema --yes
	uv_run sc-admin migrate
fi
as_api
journey_env local
uv_run sc-hydrate ${args[@]+"${args[@]}"}
