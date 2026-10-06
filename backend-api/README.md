# backend-api

The platform's API (SC-45): FastAPI on PostgreSQL, with Firebase Authentication and Google Secret Manager. It serves
the landing page and the staff console the contract the frontend already speaks (`frontend/api`).

- The landing page: the showcase, the catalog, Find your workspace and Book a demo.
- The console: sign-in, clients and their setup, agents, supply-chain profile, channels and rules, people, staff and
  the audit log.

It is a working prototype, with nothing stubbed:
- one database holds the clients, users, roles and every mapping between them;
- every change writes its audit line in the signed-in person's name;
- a hydrate step builds a synthetic world through the API's own code.

## The stack

| Area | Choice |
| --- | --- |
| Runtime | Python 3.14 (uv-managed; `uv.lock` committed), ruff |
| API | FastAPI 0.142 on Uvicorn, Pydantic 2.13 |
| Data | PostgreSQL 18. Locally, the Docker Postgres you already run; in the cloud, Cloud SQL (written, not applied: `infra/prod/sql.tf`). SQLAlchemy 2.1 (async, asyncpg), Alembic. |
| Sign-in | Firebase Authentication (Identity Platform), email and password. ID tokens arrive in `Authorization: Bearer`. |
| Secrets | Google Secret Manager only, read at runtime by reference; nothing secret is in a file, a command line or git |
| Identity | Locally, the developer's own gcloud credentials, impersonating `sc-api-local` in code; on Cloud Run, `sc-api`. No key exists. |
| Hosting | A container (`Dockerfile`) for Cloud Run, behind `backend_runtime` in `infra/prod` |

`docs/smart-clearance-tech-stack.html` planned Python 3.12 and PostgreSQL 16. 3.12 has had only security fixes since
April 2025; 3.14 is current. PostgreSQL 18 is GA on Cloud SQL and is what the local container runs.

## Quick start

From the repository root, once `infra/prod` is applied and `infra/scripts/auth-policy.sh` has run (`infra/README.md`):

```sh
backend-api/scripts/bootstrap.sh        # secrets → database and logins → schema and reference data → checks → synthetic world
backend-api/scripts/dev.sh              # the API on http://localhost:8000 (or the backend-api preview config); docs at /docs
backend-api/scripts/console-env.sh      # point frontend/console and frontend/admin's .env.local at it
backend-api/scripts/default-password.sh --copy   # the password every account starts on
backend-api/scripts/e2e.sh              # the landing page and the console end to end, on the real API and Firebase
```

Sign in to the console as any active staff member, for example `neha.kulkarni@smartclearance.example`, with the
default password.

## Scripts

All are in `scripts/`. They read the project and region from `infra/prod/terraform.tfvars`, and are written for macOS's
bash 3.2 and shellcheck-clean.

| Script | What it does |
| --- | --- |
| `doctor.sh` | Checks Docker, uv, gcloud, application-default credentials, impersonation, Firebase Auth, the secrets and the database. It changes nothing. |
| `secrets.sh [--rotate]` | Generates each secret (24 letters and digits, to the password policy) straight into Secret Manager on stdin. `--rotate` makes new versions, re-applies the database passwords and puts every account still on the default password onto the new one. |
| `db-init.sh [--container NAME] [--db NAME]` | Makes the database, the roles `sc_owner` and `sc_app`, and the logins `sc_migrator` and `sc_api`. It runs as the superuser over the container's own socket; the logins' passwords go in on stdin from Secret Manager. Safe to re-run. |
| `migrate.sh [alembic args]` | Alembic as `sc_migrator`, then the reference data (`sc-admin migrate`) |
| `hydrate.sh [--reset] [--tick] [--seed N] [--clients N] [--staff N] [--days N] [--no-demo-story]` | The synthetic world (below). `--reset` drops the schema and rebuilds; `--tick` adds today's agent runs. |
| `default-password.sh [--copy]` | The default password, in your terminal or on the clipboard |
| `dev.sh` | The API with reload, as `sc-api-local` |
| `up.sh [--with-db]` | The API in its container (`compose.yaml`). `--with-db` also starts a Postgres 18 of its own for a machine without one. |
| `console-env.sh [API base]` | Writes the frontend's git-ignored `.env.local` files: the API base and the console's Firebase web config (public, from Terraform's output) |
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
   SKUs whose shelf life makes the default wrong get gates of their own; every batch has a best-before date, and some
   carry an override that a staff member recorded, with the reason.
4. **Accounts:** every person with an email address gets a Firebase account on the default password, with a
   deterministic uid (`syn-…`).

The same seed builds the same world. `tests/test_hydrate.py` checks it, and that the API reads what it builds.

## Lift and shift

To move to another GCP project:
1. Set the project in `infra/*/terraform.tfvars` (see `infra/README.md`), then plan and apply.
2. Run `infra/scripts/auth-policy.sh`.
3. Run `backend-api/scripts/bootstrap.sh`.

Nothing in this folder names a project. With the runtime on, the `backend-api-migrate` Cloud Run job runs
`sc-admin migrate` against Cloud SQL as `sc-migrator`'s IAM user, and no database password exists at all.

## Tests

`scripts/test.sh` (190 tests, a few seconds) runs against a real PostgreSQL. It migrates `smart_clearance_test` from
scratch and imports Munchly through the services. Each test runs in a transaction that is rolled back, as `sc_api`,
with a fake Firebase that never reaches Google. The suite covers:

- every `frontend/api/tests/console.test.ts` and `site.test.ts` case, with exact audit lines;
- Munchly as the API serves it equal to design3's seed;
- the Python rules against fixtures from `platform.js` itself;
- the server-only checks;
- the roles;
- the audit log refusing UPDATE, DELETE and TRUNCATE;
- the API unable to write the reference data;
- the synthetic world;
- the published OpenAPI.

CI runs the same suite on a `postgres:18` service container, with a secret scan (gitleaks) on every pull request.

## Known gaps

- The workspace app (`design3/app`, `core/money.js`) still judges batches by the client-wide gates. It moves to the per-SKU
  gates with the agents, which read `sc.batch_gates`.

- Phone sign-in, and the workspace app's own sign-in for a client's people, come later; until then `people.accept`
  is called only by hydrate.
- `money.js` is not ported yet: the showcase is design3's computed figures, loaded as content. The port comes with the
  agents.
- The runtime (Cloud SQL, Cloud Run) is written and planned, not applied. The landing page's build prerenders from the
  API only when `PUBLIC_API_BASE` is set.
- The rate limiter keeps its counts per instance.
