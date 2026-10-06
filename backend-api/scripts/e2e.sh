#!/usr/bin/env bash
# The landing page and the console end to end against this machine's backend-api and Firebase Authentication
# (frontend/console/tests/live): Book a demo, sign-in, the New client flow, an agent, an invitation, the plan, the
# audit log, and a role's refusal. It needs the API running (scripts/dev.sh) and the frontend's .env.local
# (scripts/console-env.sh); it starts the frontend's dev servers if they aren't running. The default password goes
# to the test process in its environment, from Secret Manager; it is never written anywhere or printed. The run adds a
# client to the local database: scripts/hydrate.sh --reset rebuilds it.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need curl docker gcloud

curl -sf "http://localhost:${PORT:-8000}/readyz" >/dev/null || die "backend-api is not answering on :${PORT:-8000}: run scripts/dev.sh"
[[ -f $FRONTEND_DIR/console/.env.local ]] || die "no frontend/console/.env.local: run scripts/console-env.sh"

pick() { docker exec "$PG_CONTAINER" psql -U postgres -d "$DB_NAME" -tAX -c "$1"; }
SC_LIVE_SUPER_ADMIN="$(pick "select u.email from sc.staff_members s join sc.users u on u.id = s.user_id where s.role_id = 'super-admin' and s.status = 'active' and u.password_state = 'default' order by s.seq limit 1")"
SC_LIVE_SUPPORT="$(pick "select u.email from sc.staff_members s join sc.users u on u.id = s.user_id where s.role_id = 'support' and s.status = 'active' and u.password_state = 'default' order by s.seq limit 1")"
[[ -n $SC_LIVE_SUPER_ADMIN ]] || die "no active Super admin on the default password: run scripts/hydrate.sh"
SC_LIVE_PASSWORD="$(secret_value sc-default-user-password)"
export SC_LIVE_PASSWORD SC_LIVE_SUPER_ADMIN SC_LIVE_SUPPORT

cd "$FRONTEND_DIR/console"
exec corepack pnpm exec playwright test -c playwright.live.config.ts "$@"
