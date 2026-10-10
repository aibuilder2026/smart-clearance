# backend-api

The platform's API (SC-45): FastAPI on PostgreSQL, with Firebase Authentication and Google Secret Manager. It serves
the landing page and the staff console the contract the frontend already speaks (`frontend/api`).

- The landing page: the showcase, the catalog, Find your workspace and Book a demo.
- The console: sign-in, clients and their setup, agents, supply-chain profile, channels and rules, people, staff and
  the audit log.
- A client's workspace (SC-66): Munchly Foods' members sign in with email and password and work the journey live, with
  the agents (`agents/`), over `/v1/workspaces/{ws}`; the agents report through `/internal`.

It is a working prototype, with nothing stubbed:
- one database holds the clients, users, roles and every mapping between them;
- every change writes its audit line in the signed-in person's name;
- a hydrate step builds a synthetic world through the API's own code.

## The stack

| Area | Choice |
| --- | --- |
| Runtime | Python 3.14 (uv-managed; `uv.lock` committed), ruff |
| API | FastAPI 0.142 on Uvicorn, Pydantic 2.13 |
| Data | PostgreSQL 18. Locally, the Docker Postgres you already run; in the cloud, Cloud SQL (`infra/prod/sql.tf`, SC-50). SQLAlchemy 2.1 (async, asyncpg), Alembic. |
| Sign-in | Firebase Authentication (Identity Platform), email and password. ID tokens arrive in `Authorization: Bearer`. |
| Secrets | Google Secret Manager only, read at runtime by reference; nothing secret is in a file, a command line or git |
| Identity | Locally, the developer's own gcloud credentials, impersonating `sc-api-local` in code; on Cloud Run, `sc-api`. No key exists. |
| Hosting | A container (`Dockerfile`) on Cloud Run in `asia-south1` (SC-50), built and deployed by Cloud Build (`cloudbuild.yaml`), logging JSON lines for Cloud Logging (`LOG_FORMAT=json`, `logs.py`) |
| Tracing | OpenTelemetry 1.45 (SC-57, `tracing.py`): spans for each route, SQL statement and sign-in check (with Firebase's HTTP calls), sent over OTLP to the Telemetry API, read in Cloud Trace. Log lines and audit rows carry the request's trace id. |

`docs/smart-clearance-tech-stack.html` planned Python 3.12 and PostgreSQL 16. 3.12 has had only security fixes since
April 2025; 3.14 is current. PostgreSQL 18 is GA on Cloud SQL and is what the local container runs.

## Quick start

From the repository root, once `infra/prod` is applied and `infra/scripts/auth-policy.sh` has run (`infra/README.md`):

```sh
backend-api/scripts/bootstrap.sh        # secrets → database and logins → schema and reference data → checks → synthetic world
backend-api/scripts/dev.sh              # the API on http://localhost:8000 (or the backend-api preview config); docs at /docs
backend-api/scripts/app-env.sh          # point the console's, the landing page's and the workspace app's .env.local at it
backend-api/scripts/default-password.sh --copy   # the password every account starts on
backend-api/scripts/e2e.sh              # the landing page and the console end to end, on the real API and Firebase
```

Sign in to the console as any active staff member, for example `neha.kulkarni@smartclearance.example`, with the
default password. Sign in to Munchly's workspace as `priya.deshmukh@munchly.example` (the approver),
`rakesh-traders@google.example` (the distributor), `shree-ganesh-kirana@google.example` (a kirana),
`agrawal-wholesale@google.example` (the buyer) or `feeding-india@google.example` (the food bank), with the same
password.

## Scripts

All are in `scripts/`. They read the project and region from `infra/prod/terraform.tfvars`, and are written for macOS's
bash 3.2 and shellcheck-clean.

| Script | What it does |
| --- | --- |
| `doctor.sh` | Checks Docker, uv, gcloud, application-default credentials, impersonation, Firebase Auth, the secrets and the database. It changes nothing. |
| `secrets.sh [--rotate]` | Generates each secret (24 letters and digits, to the password policy) straight into Secret Manager on stdin. `--rotate` makes new versions, re-applies the database passwords and puts every account still on the default password onto the new one. |
| `db-init.sh [--container NAME] [--db NAME]` | Makes the database, the roles `sc_owner` and `sc_app`, and the logins `sc_migrator` and `sc_api`. It runs as the superuser over the container's own socket; the logins' passwords go in on stdin from Secret Manager. Safe to re-run. |
| `migrate.sh [alembic args]` | Alembic as `sc_migrator`, then the reference data (`sc-admin migrate`) |
| `hydrate.sh [--reset] [--tick] [--journey-reset CLIENT] [--no-live] [--seed N] [--clients N] [--staff N] [--days N] [--no-demo-story]` | The synthetic world (below), 35 days of it by default, with Munchly's live workspace (SC-66; `--no-live` leaves it out). `--reset` drops the schema and rebuilds; `--tick` adds today's agent runs and moves two to four open batches on a stop, as their agents would (SC-49), leaving batches in a live journey alone; `--journey-reset munchly` starts Munchly's journey again. |
| `default-password.sh [--copy]` | The default password, in your terminal or on the clipboard |
| `dev.sh` | The API with reload, as `sc-api-local` |
| `up.sh [--with-db]` | The API in its container (`compose.yaml`). `--with-db` also starts a Postgres 18 of its own for a machine without one. |
| `app-env.sh [API base]` | Writes the frontend's git-ignored `.env.local` files: the API base, and the console's and the workspace app's Firebase web configs (public, from Terraform's outputs). `console-env.sh` is its older name. |
| `test.sh [pytest args]` | The suite, against `smart_clearance_test` |
| `e2e.sh [playwright args]` | The landing page and the console end to end against the running API and Firebase Auth (`frontend/console/tests/live`). It covers Book a demo, a wrong then a right sign-in, the New client flow, an agent, an invitation, the plan, the audit log, and Support refused a plan change. The default password reaches the test process in its environment only. |
| `contracts.sh` | Exports `contracts/openapi.json` (a test fails when it is stale) |
| `bootstrap.sh [hydrate args]` | The lift-and-shift path: all of the above, in order |

`sc-admin` (in the package) adds `staff-add NAME EMAIL ROLE` to bootstrap a first Super admin, and
`reset-passwords --still-default | --email EMAIL`.

## The database

One database, `smart_clearance`, schema `sc` (`src/sc_api/models.py`, `migrations/`):

| Group | Tables |
| --- | --- |
| Reference, loaded at migrate time from `src/sc_api/reference/` | `plans`, `agents`, `connectors`, `exits`, `roles`, `permissions`, `role_permissions`, `documents` (the console's config, the showcase) |
| People | `users` (one per person: Firebase uid, email, phone), `staff_members`, `client_members`, `invitations` |
| Clients | `clients` (typed columns for the profile, gates, rules), `client_exits`, `client_agents`, `distributors`, `skus` (with their own quick-commerce gates), `client_integrations` |
| Activity | `demo_requests`, `agent_runs`, `batches` (with best-before dates and gate overrides), `audit_log` |
| For the agents | the view `batch_gates`: every open batch's quick-commerce gates, where each came from, and pass or fail |

- **Who may do what.** `sc_owner` owns everything, and migrations run as it. `sc_app` (the API's logins) may read and
  write the data and only read the reference data. On `audit_log` it may only insert and read; triggers refuse
  UPDATE, DELETE and TRUNCATE even to the owner.
- **Each fact once.** A client's gates, return window, territory guard, approver and staff-sale cap are its own
  columns. The JSON shows them inside the agents' settings too (`domain/mirrors.py`). The reserve, token and scheme are
  the Lister's, the Negotiator's and Outreach's settings, and the client's `rules` show them.
- **Quick-commerce gates per SKU, with a per-batch override** (SC-47, migration 0002):
  - a client's `gate_blinkit_days` and `gate_qcom_pct` are the default for new SKUs;
  - an SKU's own values (`skus.gate_*`, empty for the default) keep the same bounds, 30 to 180 days and 30 to 90%;
  - a batch's override (`batches.gate_*`) may go down to 7 days and 5%, as it records a deal a warehouse agreed to.
    It needs a reason, and keeps who set it and when;
  - a batch's gates are its override, else its SKU's, else the client's default, value by value. Blinkit wants days
    of shelf life left; Zepto and Instamart a share of the SKU's life, passed when days x 100 >= share x life;
  - `sc.batch_gates` applies that rule in SQL for the agents, counting days from India's date. `domain/gates.py`
    applies it for the API, and a test holds the two together;
  - a closed batch keeps the gates it was judged by (`judged_*`).
- **The Overview's figures** (SC-48, `services/dashboard.py`) are aggregates over `batches`, `agent_runs` and
  `clients` when they are read; nothing is stored for them.
  - A batch's recovery counts on the day it closed, or, while it is still open past Settle, on the day it was flagged.
  - A batch is in flight from being flagged until it closes, and waits for a yes at Approve.
  - In flight is valued at MRP (units x MRP); past Settle, by what it recovered.
  - `rules.json` carries design3's answers on Munchly's day, and a test holds the API to them.
  - Agents at work (SC-49) reads `batches.stage_at`, when each batch reached the stop it is at. The services stamp it
    as a batch opens, moves on (`supply.advance_batch`, which records the agent's run) and closes. A batch at Approve
    waits for a person; one at Report closes with what it recovered.
- **The reference data** is design3's: `frontend/scripts/seed.mjs` writes `src/sc_api/reference/` alongside the
  frontend's seed, and `seed:check` fails if it drifts. `rbac.json` (roles and permissions) is written by hand.

## Sign-in and roles

- **Staff** sign in to the console with Firebase email and password.
  - The API checks the ID token and finds the active staff member it belongs to. Anyone else gets 401, which the
    console reads as signed out.
  - An invited staff member becomes active on their first sign-in (`POST /v1/console/session`).
- **What each role may do** (`reference/rbac.json`):
  - Super admin: everything.
  - Platform engineer and Support: set clients up, configure them, their supply chain and people. Not plans, going
    live, or inviting staff.
  - A refusal is a 403 with a plain message, which the console shows as a toast.
- **No email is ever sent.**
  - Every account (staff, and a client's people with an email address) is made by the API with the default password.
    Users cannot sign themselves up.
  - "Resend invitation" puts an invited account back on it. An operator hands the password over.
  - Phone-only partners have no account until phone sign-in exists.
- **One shared user pool.** Local development and prod share one Firebase user pool. So an address that already has an
  account is linked, not remade. Every synthetic address is on a reserved `.example` domain, and hydrate never deletes
  an account.
- **The staff email domain** is a setting (`STAFF_EMAIL_DOMAIN`, default `smartclearance.example`). Until
  `smartclearance.com` is owned, a password reset could go to whoever receives its mail.

## The contract

The routes and shapes are `frontend/api/src/types/*.ts`, field for field:
- errors are `{ message, fields? }`;
- calls that return nothing answer 204;
- optional fields are absent, not null;
- times read as the prototype writes them, in India's time ("Today, 09:40", "30 Sep, 17:05", "1 Oct 2026").

`contracts/openapi.json` is the published schema.

| Route | Who | Notes |
| --- | --- | --- |
| `GET /v1/site/showcase`, `GET /v1/platform/catalog` | anyone | cacheable |
| `POST /v1/workspaces/lookup` `{ query }` | anyone | **Names the workspace only**, never the person's role or whether they were deactivated (SC-43). Rate-limited (10 a minute per address). A POST, so the identifier never reaches a URL or a log line. |
| `POST /v1/demo-requests` | anyone | rate-limited; 422 names each field's problem |
| `GET /v1/console/config` | anyone | the console's config, plus `staffEmailDomain`. Nothing lists staff before sign-in. |
| `POST`, `GET`, `DELETE /v1/console/session` | staff | sign in (activates an invite), who is signed in, sign out (204) |
| everything else under `/v1/console`, and `GET /v1/demo-requests` | staff, by role | as `frontend/api/src/console/http.ts` |
| `GET /v1/console/clients/{id}/batches[?sku=]` | staff | a client's open batches and their gates, as the agents read them (SC-47) |
| `PUT /v1/console/clients/{id}/skus/{sku}/gates` `{ gates }` | staff, `clients.configure` | an SKU's own gates, or `null` for the client's default |
| `PUT`, `DELETE /v1/console/clients/{id}/batches/{ref}/override` | staff, `clients.configure` | one open batch's gates with its reason, or back on its SKU's |
| `GET /v1/console/dashboard?days=7\|30\|90[&client=]` | staff | the Overview's figures over a range (SC-48): recovered by day and the range before, batches in flight (and at the end of each day), at each stop, waiting for a yes (and the oldest), runs; and for Agents at work (SC-49), the latest three batches to arrive at each stop and today's closed batches, each with when it arrived |
| `GET /v1/console/batches?status&client&stop&q&sort&dir&page&size` | staff | every client's batches a page at a time (8, 16 or 32), with the counts for in flight, waiting and closed |

The server also enforces what the prototype's mock did not:
- the approval step is always on and has no autonomy;
- settings are checked against the console's own fields (type, range, options, locks);
- the approver is an active member of the client;
- a locked exit stays off, and one exit stays on;
- plans must exist;
- no duplicate invites;
- reserved workspace addresses are refused;
- unchanged rules write no line.

## Synthetic data

`hydrate.sh` builds the world through the services, as the console and the agents would. No row is inserted by hand.

1. **Munchly Foods**, design3's story (`reference/console.json`). Its dates move to today, and its addresses become
   reserved ones (`munchly.in` → `munchly.example`).
2. **The platform's staff:** a founding Super admin, who invites the rest through the console.
3. **Generated clients** (Faker `en_IN`, seeded), each going the way a real one does: a demo request, then the New
   client flow, its supply chain, invitations, people joining, distributors' permissions, the approver taking over,
   going live, daily exports, runs and batches. History is spread over the last `--days`, on a simulated clock.
   Each live client's Watcher flags none to three batches a day over the last `--days` (35 by default); each closes
   a few days later with what it recovered, or is still in flight, some waiting for a yes. SKUs whose shelf life makes
   the default wrong get gates of their own; every batch has a best-before date, and some
   carry an override that a staff member recorded, with the reason.
4. **Accounts:** every person with an email address gets a Firebase account on the default password, with a
   deterministic uid (`syn-…`).

The same seed builds the same world. `tests/test_hydrate.py` checks it, and that the API reads what it builds.

## The live workspace (SC-66)

Munchly Foods' workspace app runs on this API: its members sign in with email and password (Munchly's people on
`munchly.example`, everyone outside Munchly on `google.example`), and the journey of Journey Map v4.1 runs live, worked
by the agents in `agents/`. The contract is `frontend/api/src/types/workspace.ts`.

- **A batch's case** (`services/journey/steps.py`): the Watcher flags a batch, Vision asks for and reads its label,
  the Valuer and the Router price and split it, the approver says yes, the Lister, Outreach and Donation execute, the
  kiranas order, the buyer bids and the Negotiator answers, the distributor dispatches, Paperwork drafts the papers,
  and Impact posts the ledger. Every step is one change with its timeline entry, its
  pushes, its audit line and the agents' next event; nothing here acts for a person.
- **Packs left at the godown on expiry day** settle by the client's expiry policy (`clients.expiry`, the console's
  Client profile). Under `godown` (SC-139, migration 0011) the distributor destroys them at his godown through an
  authorised agency on the client's list (`clients.destruction`, the console's Rules). The case's `destruction` walks
  `requested`, `reading`, `checked` (or `asked` again), then `approved`:
  - he sends two photos (signed uploads) and the agency's certificate number;
  - Vision checks them (`POST /internal/…/destruction/check`);
  - the operator approves or asks again.

  A `destruction.remind` timer nudges him after `remindDays`. Impact reports only on the yes. The expiry credit note is
  then the dealer price plus the input GST he reverses on the packs (grossed up) plus the agency's charges, and the
  destruction certificate is the agency's. The client keeps its own input GST. The history's three leftover batches
  were destroyed this way, with their photos (`reference/evidence/`).
- **The money is money.js's** (`domain/money.py`); an agent brings only words (a reason, an offer, a reply), held to the
  computed figures, and a template stands in for whatever it gets wrong (`domain/copy.py`).
- **What a member sees** is cut to their role on the server (`services/journey/views.py`): the buyer never sees the
  reserve, a kirana sees its own offer, partners never see Munchly's P&L.
- **Live updates:** each client's stream is one sequence; a change NOTIFYs `sc_stream` as it commits, and members read
  it as server-sent events (`GET …/events/stream`) or by polling (`GET …/events?after=`). One listener connection an
  instance (`stream.py`).
- **Pub/Sub:** each change writes its messages to the outbox in its transaction; they are published after the commit,
  in order per batch, and the tick sends again whatever failed. Topics are per environment (`local.*` on a laptop,
  `prod.*` on Cloud Run), from `infra/prod/events.tf`.
- **Push:** the Notifier (`/internal/pubsub/notify`, or a laptop pulling `local.notify.api`) sends each notification
  through FCM to the member's registered devices; the inbox row exists either way.
- **The journey clock:** a client's `day_minutes` (the console's setting, 1 to 1,440) sets how long a journey day lasts
  while a batch is at risk; real time runs between. The tick (every minute, `/internal/jobs/tick`) runs the Data agent
  at 08:30 and the Watcher at 09:00 on journey time, fires due timers, and re-sends a stalled journey's event.
- **Synthetic DMS exports** (`services/journey/dms.py`): no DMS is connected, so stock and secondary sales by pincode are written as CSV into the exports bucket for the Data agent to load into BigQuery, calibrated to each
  batch's sell-through.
- **The agents' routes** (`/internal`): Google ID tokens minted for `INTERNAL_AUDIENCE` by `sc-agents`,
  `sc-agents-local` or `sc-invoker`; each report names the event it answered, so a redelivered event does nothing.
  The agents service is `agents/` (SC-72). `GET …/batches` names each distributor and each SKU's item code, which the
  Data agent maps a DMS export's rows by; `GET …/agents` gives the offer window Outreach's offer states; and the
  Router may quote how many kiranas the scheme goes to, as the template does.
- **Locally, no emulator:** `dev.sh` uses the `local` topics and buckets, pulls `local.notify.api` and ticks every
  `TICK_SECONDS` itself.

## Lift and shift

To move to another GCP project:
1. Set the project in `infra/*/terraform.tfvars` (see `infra/README.md`), then plan and apply.
2. Run `infra/scripts/auth-policy.sh`.
3. Run `backend-api/scripts/bootstrap.sh`.

Nothing in this folder names a project. With the runtime on, the `backend-api-migrate` Cloud Run job runs
`sc-admin migrate` against Cloud SQL as `sc-migrator`'s IAM user, and no database password exists at all.

## In the cloud

backend-api runs on Cloud Run in `asia-south1`, on Cloud SQL for PostgreSQL 18 (SC-50; `infra/README.md` has the
resources and their costs, about GBP 9 a month).

- **Releases.** A merge to `main` touching `backend-api/` runs CI's backend job, which starts `cloudbuild.yaml` on
  Cloud Build as `sc-builder`: build and push the image (tagged with the commit), run `backend-api-migrate` on it, move
  `backend-api-hydrate` onto it, deploy `backend-api`, and check `/readyz`. By hand, from the repository's root:

  ```sh
  gcloud builds submit backend-api --config=backend-api/cloudbuild.yaml \
    --service-account="projects/aibuilder-510213/serviceAccounts/sc-builder@aibuilder-510213.iam.gserviceaccount.com" \
    --gcs-source-staging-dir=gs://aibuilder-510213-builds/source --substitutions=_TAG="$(git rev-parse --short=12 HEAD)"
  ```
- **The synthetic world.** Production was hydrated once (the maintainer's call). To move some batches on, as
  `hydrate.sh --tick` does locally:

  ```sh
  gcloud run jobs execute backend-api-hydrate --region=asia-south1 --args=--allow-env,prod,--tick --wait
  ```
- **Logs and alerts.** Cloud Logging keeps 30 days; Error Reporting groups the API's stack traces. The uptime check,
  the alerts (emailed to the operator) and the dashboard "Smart-Clearance backend-api" are in Cloud Monitoring.
- **Following a request** (SC-57). The console and the landing page start a trace for every API call (a W3C
  `traceparent`; a failed call's `ApiError` carries its `trace`). Cloud Run keeps that trace id, and the API continues
  it:
  - **Logs.** Every line the API writes during a request carries the trace and span, so Logs Explorer shows it under
    Cloud Run's request line ("Show entries for this trace"), or filter on
    `trace="projects/aibuilder-510213/traces/<trace id>"`.
  - **Audit rows.** Each row keeps its request's trace id in `details`, so a change leads to its request:

    ```sql
    SELECT at, actor_name, text, details->>'trace' AS trace FROM sc.audit_log ORDER BY id DESC LIMIT 10;
    ```
  - **Spans.** Cloud Trace shows a sampled request's route, its sign-in check with Firebase's calls under it, and each
    SQL statement. A request Cloud Run sampled (at most one every ten seconds an instance) is always kept, and a
    quarter of the rest (`trace_sample_rate` in `infra/prod`). Unsampled requests still have their trace id in the logs
    and audit rows.
  - **Locally,** spans are made but not sent. `TRACE_EXPORT=otlp` sends them to Cloud Trace as `sc-api-local`, which
    holds `roles/telemetry.tracesWriter` as `sc-api` does.
- **Accounts.** Production shares the Firebase user pool with local development, so the same accounts sign in to both,
  on the default password (`scripts/default-password.sh`).

## Tests

`scripts/test.sh` (382 tests, a few seconds) runs against a real PostgreSQL. It migrates `smart_clearance_test` from
scratch and imports Munchly through the services. Each test runs in a transaction that is rolled back, as `sc_api`,
with a fake Firebase that never reaches Google. The suite covers:

- every `frontend/api/tests/console.test.ts` and `site.test.ts` case, with exact audit lines;
- Munchly as the API serves it equal to design3's seed;
- the Python rules against fixtures from `platform.js` itself;
- the money rules (`domain/money.py`, SC-71) against `money.js`'s own answers (`reference/money.json`): every plan,
  write-off, counter, award, credit note, document and format, with no database needed;
- the journey's sentences against design3's own (`test_copy.py`), and the live workspace end to end over HTTP
  (`test_workspace.py`): the story's journey walked by its people and its agents to the same figures, each role's cut,
  a redelivered event, a wrong label, the reserve kept, the stream, the Notifier and the tick, on in-memory Pub/Sub,
  Cloud Storage and FCM (no emulator);
- the server-only checks;
- the roles;
- the audit log refusing UPDATE, DELETE and TRUNCATE;
- the API unable to write the reference data;
- the synthetic world;
- the published OpenAPI;
- the tracing: a request continuing its caller's trace, with its sign-in check and SQL statements under it, its log
  lines and audit rows carrying the trace, the sampling, and CORS letting the apps send `traceparent`.

CI runs the same suite on a `postgres:18` service container, with a secret scan (gitleaks) on every pull request.

## Known gaps

- The workspace app's prototype (`design3/app`, `core/money.js`) judges batches by the client-wide gates; the live
  journey uses the per-SKU gates (SC-47), as the console does.
- The workspace's response bodies are typed in the contract (`frontend/api/src/types/workspace.ts`), not yet as
  Pydantic models, so the OpenAPI describes them as objects.
- When the kirana scheme closes short, the unordered packs move to the ExpireSoon lot while it is open; the plan's
  figures are not worked out again.
- The console invites partners by phone too; the workspace's sign-in is email only (its console change comes with the
  design round, SC-68).
- Cloud Run scales to zero, so the first request after a quiet spell waits for a cold start (a few seconds).
- `db-f1-micro` is a shared core with 0.6 GB of memory and no SLA: enough for the prototype, not for real load.
- The rate limiter keeps its counts per instance.
- The apps start a trace per API call, not per click, so a screen that reads three things leaves three traces. The
  hydrate and migrate jobs are not traced.
