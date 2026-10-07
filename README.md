# Smart-Clearance

An agentic near-expiry stock router for Indian FMCG brands, built for the Google AI Hackathon 2026 (Retail &
Commerce track). Ten agents watch a manufacturer's stock across its distributors, price every exit for a batch that
will not sell in time, split it under each exit's caps, wait for one human yes, then list, sell, settle and report.
Smart-Clearance is sold as software as a service: one workspace per manufacturer at `<client>.smartclearance.com`,
set up by Smart-Clearance's own staff from a console.

| Surface | Where | Status |
| --- | --- | --- |
| The landing page, smartclearance.com | [smartclearance.web.app](https://smartclearance.web.app) | live, on backend-api |
| The staff console, console.smartclearance.com | [smartclearance-console.web.app](https://smartclearance-console.web.app) | live, on backend-api with Firebase sign-in |
| Munchly Foods' workspace, munchly.smartclearance.com | [munchly-smartclearance.web.app](https://munchly-smartclearance.web.app) | live, on the prototype's stub data in the browser (SC-62) |
| backend-api, the platform API | Cloud Run in `asia-south1`, Cloud SQL for PostgreSQL 18 | live, with a synthetic world |
| The design prototypes (design system, guided demo, workspace app, landing page, console) | [Claude Design](#documentation-map) | hosted, on in-browser mocks |
| The agents service | `agents/` | planned |

Every company, person and figure in the product is fictional. Munchly Foods is the story's client.

This README is the practical guide: what to install, how to run everything on your machine, and how an operator
works on the Google Cloud project. [ARCHITECTURE.md](ARCHITECTURE.md) explains how it is built, with diagrams.
[AGENTS.md](AGENTS.md) holds the rules the repository is worked on by, for people and for coding agents.

## Contents

- [What is in the repository](#what-is-in-the-repository)
- [Prerequisites](#prerequisites)
- [Run it locally](#run-it-locally)
  1. [Clone](#1-clone)
  2. [The design prototypes](#2-the-design-prototypes-design3)
  3. [The frontend on its mocks](#3-the-frontend-on-its-mocks)
  4. [backend-api on your machine](#4-backend-api-on-your-machine)
  5. [The frontend on the real API](#5-the-frontend-on-the-real-api)
  6. [Everything at once](#6-everything-at-once)
- [Tests and gates](#tests-and-gates)
- [Working on Google Cloud](#working-on-google-cloud)
  - [The project](#the-project)
  - [Access](#access)
  - [Terraform](#terraform)
  - [Secrets](#secrets)
  - [Releasing backend-api](#releasing-backend-api)
  - [The cloud database: migrate, hydrate, tick](#the-cloud-database-migrate-hydrate-tick)
  - [Accounts and passwords](#accounts-and-passwords)
  - [Logs, monitoring and alerts](#logs-monitoring-and-alerts)
  - [Deploying the frontend](#deploying-the-frontend)
  - [Costs](#costs)
  - [Moving to another project](#moving-to-another-project)
- [How work is done here](#how-work-is-done-here)
- [Documentation map](#documentation-map)

## What is in the repository

| Path | What it is | Start with |
| --- | --- | --- |
| `design3/` | The current design, and the source of truth for every design: the design system, the guided demo, the workspace app prototype (a PWA), the landing page and the console, as React pages on in-browser mocks, plus every design review (`designs/SC-<n>/`) and the WCAG 2.2 AA suite (`a11y/`). | [design3/README.md](design3/README.md) |
| `frontend/` | The production frontend: a SvelteKit 3 pnpm workspace. Two apps, `admin` (the landing page) and `console` (the staff console), over three shared packages, `core` (design system v3 in Svelte), `api` (the contract with backend-api and its in-browser mocks) and `testing`. | [frontend/README.md](frontend/README.md) |
| `backend-api/` | The platform API: FastAPI on PostgreSQL 18, Firebase Authentication, Google Secret Manager; every secret by reference; a hydrate step that builds a synthetic world through the API's own services. | [backend-api/README.md](backend-api/README.md) |
| `infra/` | Terraform for the Google Cloud project, and the scripts that run it: the state bucket, Firebase Hosting, Firebase Auth, Secret Manager, Cloud SQL, Cloud Run, Cloud Build, monitoring, the budget, and CI's keyless deployer. | [infra/README.md](infra/README.md) |
| `agents/` | The AI agents service, planned. | [agents/README.md](agents/README.md) |
| `.github/` | GitHub Actions: the gates on every pull request, the deploys from `main`. | `.github/workflows/ci.yml` |
| `docs/` | The story pages: Journey Map v4.1 (the source of every figure), the story, the planned tech stack and the walkthrough. | `docs/dobara-journey-map.html` |
| `video/` | The narrated walkthrough and its recorder. | `video/build.py` |
| `design/`, `design2/` | Earlier design rounds. Reference only. | |
| `PRODUCT.md`, `DESIGN.md`, `PLAN.md` | Product context, the design system of record, the product plan. | |

## Prerequisites

Everything runs on macOS or Linux. Nothing is installed globally except the tools below.

| Tool | Version | Needed for | Install |
| --- | --- | --- | --- |
| Git | any recent | everything | |
| Node.js | 22.17 or later (CI uses 24) | design3's build, the frontend, the Hosting deploy | [nodejs.org](https://nodejs.org) or `brew install node` |
| corepack | ships with Node | pnpm, pinned by `frontend/package.json`; nothing to install | `corepack enable` once if `corepack` is not on your PATH |
| Python 3 | 3.9 or later | serving design3 locally (`http.server`), `video/` | ships with macOS; `brew install python` |
| Python 3.14 and uv | uv 0.12 or later | backend-api (uv downloads 3.14 itself) | `brew install uv` or [docs.astral.sh/uv](https://docs.astral.sh/uv/) |
| Docker | any recent, running | the local PostgreSQL 18 container, `up.sh` | Docker Desktop, OrbStack or Colima |
| Google Cloud CLI (`gcloud`) | current | backend-api locally (Secret Manager, Firebase Auth, impersonation), every cloud operation | `brew install --cask google-cloud-sdk` |
| Terraform | 1.9 or later (CI uses 1.16) | `infra/` only | `brew install terraform` |
| `jq` | any | the infra and backend scripts | `brew install jq` |
| GitHub CLI (`gh`) | any recent | `infra/prod` plans (it manages the repository's `prod` environment), pull requests | `brew install gh` |
| shellcheck | any | `infra/scripts/check.sh` | `brew install shellcheck` |
| Playwright browsers | installed by Playwright | the a11y, e2e and parity suites | `npx playwright install chromium` (and `webkit`, `firefox`) |

For backend-api you also need a Google account that the project's Terraform lists in `operators`
(`infra/prod/terraform.tfvars`): it is what lets your machine act as the local backend's service account. Ask the
maintainer to add yours and apply. Without it, the frontend and design3 still run in full on their mocks.

## Run it locally

Each part runs on its own. Parts 2 and 3 need no Google account; parts 4 and 5 do.

### 1. Clone

```bash
git clone https://github.com/aibuilder2026/smart-clearance.git && cd smart-clearance
```

### 2. The design prototypes (design3)

The prototypes are static pages: React 18 from a CDN, with every `.jsx` precompiled to the `.js` beside it. Serve
the folder and open the pages.

```bash
python3 -m http.server 8787 --directory design3
```

| Page | Address |
| --- | --- |
| Design system | http://127.0.0.1:8787/system/Smart-Clearance%20DS%20v3.html |
| Guided demo | http://127.0.0.1:8787/demo/Smart-Clearance%20demo%20v3.html |
| Workspace app (Munchly Foods) | http://127.0.0.1:8787/app/Smart-Clearance%20app%20v3.html |
| Landing page | http://127.0.0.1:8787/site/Smart-Clearance%20site%20v3.html |
| Staff console | http://127.0.0.1:8787/console/Smart-Clearance%20console%20v3.html |

After editing any `.jsx`, rebuild the `.js` files (esbuild, through `npx`):

```bash
cd design3 && ./build.sh
```

`./dist.sh` bundles the hosted build into `design3/dist/`, which the Claude Design pages load from jsDelivr pinned
to a commit. Publishing a new version is described in AGENTS.md (Code and builds).

The accessibility suite runs on the frontend's real UI, not on these prototypes: `corepack pnpm test:a11y` in
`frontend/` (SC-58; see [3. The frontend on its mocks](#3-the-frontend-on-its-mocks)).

### 3. The frontend on its mocks

Without `PUBLIC_API_BASE`, both apps run on an in-browser mock of backend-api seeded from design3, so nothing else
has to be running.

```bash
cd frontend
corepack pnpm install          # the first call downloads the pinned pnpm
corepack pnpm dev              # the landing page on http://localhost:5173, and /ds, the design system
corepack pnpm dev:console      # the staff console on http://localhost:5174
```

Sign in to the console on the mock with any active staff member's address, for example
`neha.kulkarni@smartclearance.com` (a Super admin) or `sameer.rao@smartclearance.com` (a Platform engineer), and any
password. Changes stay in that browser (`localStorage`); Account, then "Reset prototype data" goes back to the seed.
Book a demo on the landing page saves a request the console lists on its Overview.

The builds, and their previews:

```bash
corepack pnpm build            # both apps: admin/build and console/build
corepack pnpm preview          # the landing page's build on http://localhost:4173
corepack pnpm preview:console  # the console's build on http://localhost:4176
```

A preview server reads the build's file list once: restart it after a rebuild.

The accessibility suite (SC-58) scans each app's production build, never the `/ds` dev route: axe-core WCAG 2.2 AA
in five viewport and theme projects, the keyboard and motion specs, then a coverage check that fails if an app uses a
core component no scan had on screen. It builds first, and runs on the mocks:

```bash
PUBLIC_API_BASE= corepack pnpm test:a11y     # both apps, about 2 minutes each (test:a11y:admin, test:a11y:console)
```

Regenerate what the frontend derives from design3 whenever design3 changes (the gate fails otherwise):

```bash
corepack pnpm seed && corepack pnpm icons
```

### 4. backend-api on your machine

The API runs from source on your machine against a PostgreSQL 18 in Docker, and reaches Google for three things: the
secrets (Secret Manager), the user pool (Firebase Authentication) and its identity. It acts as the service account
`sc-api-local` by impersonating it in code from your own gcloud credentials. No key file ever exists.

**a. Sign in to Google Cloud, twice.** Once for `gcloud` itself, once for application-default credentials, which the
Google client libraries (and firebase-tools) read:

```bash
gcloud auth login
```

```bash
gcloud auth application-default login
```

```bash
gcloud config set project aibuilder-510213
```

**b. A PostgreSQL 18 container.** The scripts expect a container named `postgres` (`PG_CONTAINER` changes it), and
run as its superuser over the container's own socket, so its password is never needed again:

```bash
docker run -d --name postgres -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" -p 127.0.0.1:5432:5432 -v sc-pgdata:/var/lib/postgresql postgres:18
```

Or let the backend's compose file start one as `sc-postgres`: `backend-api/scripts/up.sh --with-db`, then pass
`--container sc-postgres` to `db-init.sh` below.

**c. Check the machine.** `doctor.sh` changes nothing. It checks Docker, uv, both gcloud sign-ins, that you may act as
`sc-api-local`, Firebase Auth, each secret, the container, the database and the schema, and names the script that
fixes each miss:

```bash
backend-api/scripts/doctor.sh
```

**d. Bootstrap.** One script does the rest, in order, and is safe to re-run (what exists is kept):

```bash
backend-api/scripts/bootstrap.sh
```

It runs these, which you can also run one at a time:

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `backend-api/scripts/secrets.sh` | Gives each Secret Manager container a first version if it has none: the default user password and the local database's two login passwords. Generated and piped to `gcloud` on stdin; never written or printed. |
| 2 | `backend-api/scripts/db-init.sh` | Makes the database `smart_clearance` (and `smart_clearance_test`), the roles `sc_owner` and `sc_app`, and the logins `sc_migrator` and `sc_api`, with their passwords from Secret Manager. |
| 3 | `backend-api/scripts/migrate.sh` | Alembic as `sc_migrator`, then the reference data (plans, agents, exits, connectors, roles, the console's config, the showcase). |
| 4 | `backend-api/scripts/hydrate.sh` | The synthetic world through the API's services: Munchly Foods, the platform's staff, six generated clients with 35 days of batches and runs. Every person with an email address gets a Firebase account on the default password. |

**e. Run the API:**

```bash
backend-api/scripts/dev.sh
```

It serves http://localhost:8000 with reload; the OpenAPI docs are at http://localhost:8000/docs and the readiness
check at http://localhost:8000/readyz. In Claude Code, the `backend-api` preview config runs the same script.

To run it as its container instead, the way Cloud Run does, with your gcloud credentials mounted read-only:

```bash
backend-api/scripts/up.sh
```

**f. Keep the world moving.** The console's day is today, so after a few days the dashboard's batches look stale.
Move two to four batches on a stop and add today's agent runs:

```bash
backend-api/scripts/hydrate.sh --tick
```

Rebuild the world from scratch (the schema is dropped and migrated again; Firebase accounts are kept):

```bash
backend-api/scripts/hydrate.sh --reset
```

`--seed N`, `--clients N`, `--staff N`, `--days N` and `--no-demo-story` shape the world; the same seed builds the
same world.

**g. Tests:**

```bash
backend-api/scripts/test.sh
```

The suite runs against `smart_clearance_test`, migrating it from scratch, with a fake Firebase that never reaches
Google. Arguments go to pytest.

### 5. The frontend on the real API

Point both apps at the local API. The script writes each app's git-ignored `.env.local`: `PUBLIC_API_BASE`, and for
the console its public Firebase web config from Terraform's output.

```bash
backend-api/scripts/console-env.sh
```

Restart the dev servers (`corepack pnpm dev`, `corepack pnpm dev:console`) so they pick the files up. The console now
signs in with Firebase, email and password. Every account starts on the default password, which no email ever
carries; copy it from Secret Manager:

```bash
backend-api/scripts/default-password.sh --copy
```

Sign in as `neha.kulkarni@smartclearance.example`, a Super admin, or any other active staff member hydrate made.
Note the domain: on the real API every synthetic address is on a reserved `.example` domain.

The live end-to-end suite drives the landing page and the console against the running API and Firebase (Book a demo,
a wrong then a right sign-in, the New client flow, an agent, an invitation, the plan, the audit log, a role's
refusal). It starts the frontend's dev servers if they are not running, and adds a client to your database:

```bash
backend-api/scripts/e2e.sh
```

To go back to the mocks, delete the two `.env.local` files, or set `PUBLIC_API_BASE=` empty in the environment. The
a11y, e2e and parity suites must run with it empty.

### 6. Everything at once

| What | Command | Port |
| --- | --- | --- |
| PostgreSQL 18 | the Docker container | 5432 |
| backend-api | `backend-api/scripts/dev.sh` | 8000 |
| The landing page (dev) | `cd frontend && corepack pnpm dev` | 5173 |
| The staff console (dev) | `cd frontend && corepack pnpm dev:console` | 5174 |
| The landing page (build) | `cd frontend && corepack pnpm preview` | 4173 |
| The staff console (build) | `cd frontend && corepack pnpm preview:console` | 4176 |
| design3 | `python3 -m http.server 8787 --directory design3` | 8787 |
| The voice recorder (video) | `python3 video/recorder/server.py` | 8765 |

In Claude Code each row is a preview config in `.claude/launch.json` (`frontend-admin`, `frontend-console`,
`frontend-preview`, `frontend-console-preview`, `design3`, `backend-api`, `voice-recorder`).

The API's CORS allows the four frontend ports on `localhost` and the two dev ports on `127.0.0.1`; open the apps on
`localhost`.

## Tests and gates

The gates are what jira-flow runs before a change ships and what CI runs on every pull request.

| Area | The gate | Also run yourself |
| --- | --- | --- |
| `frontend/` | `corepack pnpm lint && corepack pnpm check && corepack pnpm test` (ESLint and Prettier, svelte-check, Vitest, the seed and icons checks) | `corepack pnpm test:a11y` (WCAG 2.2 AA in five viewports, keyboard, motion and component coverage), `corepack pnpm test:e2e` (the console's flows, Firefox and WebKit smoke) and `corepack pnpm test:parity` (each app's build against design3, pixel by pixel) |
| `backend-api/` | `cd backend-api && uv run ruff check . && uv run ruff format --check . && scripts/test.sh -q` (pytest on a real PostgreSQL) | `scripts/e2e.sh` on the live API |
| `infra/` | `infra/scripts/check.sh` (`terraform fmt` and `validate`, the scripts' syntax, shellcheck; no credentials) | a plan, read in full |
| `design3/` | nothing gates it | `./build.sh`, and the frontend's parity suite against it |

CI (`.github/workflows/ci.yml`) runs the three gates, a gitleaks secret scan and one build of both apps on every pull
request to `main`. The a11y, e2e and parity suites need browsers and are not in CI. In a sandboxed shell Firefox
cannot start; run the e2e suite on a normal machine to cover it.

## Working on Google Cloud

Everything in the cloud is in one Google Cloud project, made by Terraform in `infra/`, and operated with `gcloud`
and the scripts. The maintainer's rules, from AGENTS.md: every resource is Terraform, never made by hand; every plan is
saved, read in full and applied as that file; no service account key exists anywhere; every secret lives in Secret
Manager only; ask before adding anything that costs money.

### The project

| | |
| --- | --- |
| Project | `aibuilder-510213` (AIBuilder), billing account `012B20-D65DBD-FBAC0E` |
| Region | `asia-south1` (Mumbai) |
| Terraform state | `gs://aibuilder-510213-tfstate`, prefixes `bootstrap` and `prod` |
| Firebase Hosting | sites `smartclearance` (the landing page), `smartclearance-console` (the console) and `munchly-smartclearance` (Munchly's workspace) |
| Firebase Authentication | Identity Platform, email and password only, sign-up disabled, one user pool shared by local development and production |
| Cloud SQL | instance `sc-main`, PostgreSQL 18, `db-f1-micro`, database `smart_clearance`, IAM authentication only, through connectors only |
| Cloud Run | service `backend-api` (0 to 2 instances), jobs `backend-api-migrate` and `backend-api-hydrate` |
| Artifact Registry | repository `sc`, image `asia-south1-docker.pkg.dev/aibuilder-510213/sc/backend-api` |
| Cloud Build | builds run as `sc-builder`; sources staged in `gs://aibuilder-510213-builds` |
| Secret Manager | `sc-default-user-password`, `sc-local-db-app-password`, `sc-local-db-migrator-password` |
| Service accounts | `sc-api` (the service and the hydrate job), `sc-migrator` (the migrate job), `sc-api-local` (a developer's backend), `sc-builder` (Cloud Build), `github-deployer` and `github-backend` (CI, keyless) |
| Monitoring | an uptime check on `/readyz`, seven alert policies and a dashboard, emailing the operator |
| Budget | GBP 20 a month, alerting at 50%, 90% and 100% and on a forecast overrun |

Set the project once on your machine, so every `gcloud` command below needs no `--project`:

```bash
gcloud config set project aibuilder-510213
```

### Access

- **Operators** are the Google accounts listed in `operators` in `infra/prod/terraform.tfvars`. Each may act as
  `sc-api-local`, which is all a local backend needs. Terraform itself needs Owner on the project, and the deploy
  needs application-default credentials (`gcloud auth application-default login`).
- **`infra/prod` also manages the GitHub repository's `prod` environment.** The scripts pass Terraform the `gh` CLI's
  token, so `gh auth login` with the `repo` scope and admin on the repository is needed for a plan or apply.
- **Never** sign in with `gcloud auth application-default login --impersonate-service-account`: Terraform would then
  run as that account.
- **CI** signs in through Workload Identity Federation from the `prod` environment only, as `github-deployer` (Hosting
  only) or `github-backend` (may only start Cloud Build builds). Never create a service account key or store a Google
  credential as a GitHub secret.

### Terraform

Run from the repository root. The wrapper sets up credentials and runs `init` for you.

```bash
infra/scripts/bootstrap.sh
```

Once per project (safe to re-run): the state bucket and the APIs Terraform calls. The project already has it.

```bash
infra/scripts/tf.sh plan -out=prod.tfplan
```

Read the whole plan. Then, and only then:

```bash
infra/scripts/tf.sh apply prod.tfplan
```

Any Terraform subcommand passes through, for example the outputs:

```bash
infra/scripts/tf.sh output
```

The outputs are `project_id`, `hosting_sites`, `github_deployer`, `custom_domain_dns`, `console_firebase_config`
(public by design, written into the console's `.env.local` by `console-env.sh`) and `backend`.

After an apply that creates the Identity Platform config, set the two settings the provider has no block for, the
password policy (12 or more characters, mixed case, a digit) and email enumeration protection:

```bash
infra/scripts/auth-policy.sh
```

`--check` only prints what the project has. Before a pull request touching `infra/`, run the gate:

```bash
infra/scripts/check.sh
```

`backend_runtime` in `prod/terraform.tfvars` turns the whole backend runtime (Cloud SQL, Cloud Run, Cloud Build,
Artifact Registry, monitoring, the budget) on or off. It is on. Cloud SQL, the Cloud Run service and jobs, the state
bucket and both Hosting sites carry deletion protection: a destroy fails until it is changed and applied.

### Secrets

Terraform makes the three containers and never holds a value. `secrets.sh` fills them, generating each password to
the policy and piping it to `gcloud` on stdin:

```bash
backend-api/scripts/secrets.sh
```

Rotate every secret, re-apply the local database's passwords and move every account still on the old default password
onto the new one:

```bash
backend-api/scripts/secrets.sh --rotate
```

Read a secret's value only when you must hand it to someone, and then only the default password, to the clipboard:

```bash
backend-api/scripts/default-password.sh --copy
```

The API reads every secret by reference (`projects/<project>/secrets/<id>/versions/latest`) with its own identity,
at runtime, into memory. Nothing secret goes in a file, a command line, a log, Terraform state or git. CI's gitleaks
scan runs on every pull request.

### Releasing backend-api

A merge to `main` that touches `backend-api/` releases it. CI's backend job signs in as `github-backend` and starts
`backend-api/cloudbuild.yaml` on Cloud Build as `sc-builder`, which:

1. builds the image from `backend-api/`, reusing the last image's layers, tagged with the commit and `latest`, and
   pushes it to Artifact Registry;
2. moves the `backend-api-migrate` job onto the image and runs it: the schema's roles and grants, Alembic, the
   reference data;
3. moves the `backend-api-hydrate` job onto the image, without running it;
4. deploys the image to the `backend-api` service and checks `/readyz` answers.

The Hosting deploy waits for it, so the apps never reach an API older than they are. Cloud Build owns the Cloud Run
image; Terraform ignores it.

To release by hand from your machine (the same pipeline, tagged with your commit):

```bash
gcloud builds submit backend-api --config=backend-api/cloudbuild.yaml --service-account="projects/aibuilder-510213/serviceAccounts/sc-builder@aibuilder-510213.iam.gserviceaccount.com" --gcs-source-staging-dir=gs://aibuilder-510213-builds/source --substitutions=_TAG="$(git rev-parse --short=12 HEAD)"
```

Add `,_DEPLOY=false` to the substitutions to build and push without migrating or deploying. Watch builds:

```bash
gcloud builds list --limit=5
```

The service's address, which the apps' builds read as the repository variable `PUBLIC_API_BASE`:

```bash
gcloud run services describe backend-api --region=asia-south1 --format='value(status.url)'
```

Roll back by deploying an earlier image tag (every tag is a commit):

```bash
gcloud run services update backend-api --region=asia-south1 --image=asia-south1-docker.pkg.dev/aibuilder-510213/sc/backend-api:<commit>
```

Cloud Run scales to zero, so the first request after a quiet spell waits a few seconds for a cold start. Cloud Run
reserves `/healthz` on the public address (it answers 404); use `/readyz`, which also reaches the database.

### The cloud database: migrate, hydrate, tick

There is no database password in the cloud. Cloud SQL accepts IAM logins only, through connectors only, and the only
IAM database users are `sc-api` and `sc-migrator`, the two service accounts the Cloud Run jobs and service run as. So
every change to the data goes through the API or its two jobs; there is no `psql` prompt into production by design.
(If you ever need one, the Cloud SQL Auth Proxy with IAM authentication as an account that Terraform has granted
`cloudsql.instanceUser` and made a database user counts as a connector. Terraform does not make one for any person.)

**Migrate.** Every release runs the migrate job. Run it by hand after a change to the reference data, or to re-check
the schema (Alembic is idempotent):

```bash
gcloud run jobs execute backend-api-migrate --region=asia-south1 --wait
```

**Hydrate.** Production was hydrated once with the synthetic world, the maintainer's call. The job's default
arguments are `--allow-env prod`, which the hydrate command requires before it touches anything but a local database.
`--args` on `execute` replaces the job's arguments, so always pass that pair again.

Move two to four open batches on a stop and record today's agent runs, so the console's Overview and Agents at work
show today (the same as `hydrate.sh --tick` locally):

```bash
gcloud run jobs execute backend-api-hydrate --region=asia-south1 --args=--allow-env,prod,--tick --wait
```

Hydrate again with other sizes (hydrate is additive: it links accounts that exist and adds what does not; it never
deletes). Ask the maintainer first, since production's data is what the live console shows:

```bash
gcloud run jobs execute backend-api-hydrate --region=asia-south1 --args=--allow-env,prod,--clients,8,--days,45 --wait
```

What a job did:

```bash
gcloud run jobs executions list --job=backend-api-hydrate --region=asia-south1 --limit=5
```

```bash
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="backend-api-hydrate"' --limit=50 --format='value(timestamp,severity,jsonPayload.message,textPayload)'
```

**Resetting production** has no job, on purpose. `sc-admin reset-schema --yes` exists for a local database. Running
it in the cloud would mean changing the migrate job's command, executing it, then putting the command back, and the
Firebase accounts would still be kept. Do not do this without the maintainer's yes in writing.

**Backups.** Cloud SQL keeps seven daily backups and seven days of point-in-time recovery (`infra/prod/sql.tf`). List
them:

```bash
gcloud sql backups list --instance=sc-main
```

### Accounts and passwords

- **One user pool.** Local development and production share one Firebase user pool. An account made locally by
  hydrate signs in to production too, and a password reset anywhere changes it everywhere. Every synthetic address is
  on a reserved `.example` domain.
- **No email is ever sent.** Every account is made by the API on the default password, which an operator hands over
  (`default-password.sh --copy`). Users cannot sign themselves up. "Resend invitation" in the console puts an invited
  account back on the default password.
- **Staff** are invited through the console by a Super admin (Staff, Invite). The first Super admin of an empty
  database comes from hydrate, or from the package's command line on a local database:

  ```bash
  bash -c 'source backend-api/scripts/lib.sh; as_api; uv_run sc-admin staff-add "Full Name" name@smartclearance.example "Super admin"'
  ```

  The command runs inside the scripts' environment (sourcing `lib.sh` sets the project, the identity and the secrets'
  references), from the repository root.

- **Reset passwords** to the current default, every account still on an old default, or one address (this reaches
  the shared pool, so production too):

  ```bash
  bash -c 'source backend-api/scripts/lib.sh; as_api; uv_run sc-admin reset-passwords --email name@smartclearance.example'
  ```

- **The staff email domain** is a setting, `STAFF_EMAIL_DOMAIN`, `smartclearance.example` until `smartclearance.com`
  is owned.
- **The console's Firebase web config** (API key, auth domain, project id, app id) is public by design: it ships in
  the console's JavaScript, and the key is restricted to the Identity Toolkit and Secure Token APIs from the console's
  origins. It is still never committed: locally `console-env.sh` writes it; in CI it comes from repository variables
  Terraform sets.

### Logs, monitoring and alerts

The API logs one JSON object a line (`LOG_FORMAT=json`), with severity and source, so Cloud Logging indexes it and
Error Reporting groups stack traces. Cloud Run logs each request itself. Logs stay 30 days.

The service's recent lines:

```bash
gcloud run services logs read backend-api --region=asia-south1 --limit=100
```

Errors only, from the service and both jobs:

```bash
gcloud logging read 'severity>=ERROR AND (resource.type="cloud_run_revision" AND resource.labels.service_name="backend-api" OR resource.type="cloud_run_job")' --limit=50
```

Follow the service live:

```bash
gcloud beta run services logs tail backend-api --region=asia-south1
```

In the Cloud console: Cloud Run, the `backend-api` service, Logs and Metrics; Cloud Monitoring, the dashboard
"Smart-Clearance backend-api"; Error Reporting for grouped exceptions; Cloud Trace for sampled requests' spans; Cloud
SQL, `sc-main`, Query Insights.

One request, followed (SC-57). The apps start a trace on every API call, and the API's log lines, spans and audit rows
all carry its id: a failed call's `ApiError` has it in the browser, and an audit row keeps it in `details->>'trace'`.
Every line from one request:

```bash
gcloud logging read 'trace="projects/aibuilder-510213/traces/TRACE_ID"' --limit=100
```

Its spans, if it was sampled (Cloud Run's own samples, and a quarter of the rest): Cloud Trace, Trace explorer, search
by the trace id. The spans show the route, the sign-in check with Firebase's calls under it, and each SQL statement.
`backend-api/README.md` (In the cloud) has more.

The alert policies email the operator (`alert_email` in `terraform.tfvars`) when: `/readyz` fails from two or more
regions for 10 minutes; more than five 5xx responses in five minutes; the 95th percentile latency is over 5 s for 15
minutes; the API or a job logs a line at ERROR or above; or the database's CPU, memory or disk run high. The budget
emails at 50%, 90% and 100% of GBP 20, and on a forecast over it.

### Deploying the frontend

A merge to `main` that touches `frontend/`, `design3/` (outside `designs/` and `a11y/`), `infra/` or the workflow
builds both apps once (against the `PUBLIC_API_BASE` and `PUBLIC_FIREBASE_*` repository variables) and, after the
backend job, releases them to Firebase Hosting from the `prod` environment as `github-deployer`. Deploys queue rather
than overlap. Only `main` may deploy to `prod`.

By hand, with application-default credentials:

```bash
infra/scripts/deploy.sh
```

One app, by its `frontend/firebase.json` target (`site` is the landing page):

```bash
infra/scripts/deploy.sh console
```

`SKIP_BUILD=1` releases the builds already on disk. The script writes `frontend/.firebaserc` from Terraform's
`hosting_sites` output (never committed), runs firebase-tools 15.32.1 through `npx`, labels the release with the
commit (`-dirty` if `frontend/` has uncommitted changes) and checks each site answers 200. Both sites rewrite unknown
paths to the app and cache `/_app/immutable/` for a year; the console also sends `noindex`, `X-Frame-Options: DENY`
and a strict referrer policy.

Firebase Hosting keeps earlier releases: roll back from the Firebase console (Hosting, Release history) or with
`npx firebase-tools@15.32.1 hosting:rollback` in `frontend/`.

A custom domain is a `custom_domain` on a site in `prod/terraform.tfvars`, planned and applied, then the records from
`infra/scripts/tf.sh output custom_domain_dns` at the registrar. None is set yet.

### Costs

About GBP 9 a month at Google's catalog prices, nearly all Cloud SQL (`db-f1-micro`, 10 GB SSD, backups). Cloud Run,
Cloud Build, Artifact Registry, Firebase Hosting, Firebase Auth, Secret Manager, Logging and Monitoring sit in free
tiers at the prototype's traffic. The budget warns at GBP 20. Anything new that costs money is asked about first, with
its price (`infra/README.md` lists each resource's).

### Moving to another project

Everything is keyed on `project_id` and `region`; nothing in `backend-api/` names a project. The order is in
`infra/README.md` (Moving it to another project): set the tfvars and the state bucket's name in both roots, accept the
Firebase Terms with the account that will apply, `bootstrap.sh`, plan and apply, `auth-policy.sh`,
`backend-api/scripts/bootstrap.sh`, `deploy.sh`.

## How work is done here

The rules are in [AGENTS.md](AGENTS.md). The short version:

- Every change has a Jira key in project SC: branch `SC-<n>-<slug>` from `main`, commits `SC-<n>: <subject>`, pull
  requests `[SC-<n>] <title>`. Never commit on `main`. Pull requests merge with a merge commit, and the branch is
  deleted.
- Every new UI or UX change is designed first: two or three options on a review board in the surface's Claude Design
  project, saved under `design3/designs/SC-<n>/`, and only the option the maintainer picks is built, in design3 first
  and then ported to `frontend/`.
- The frontend implements design3 and tests hold it there: ported CSS stays verbatim outside marked blocks, generated
  files (`seed`, `icons`) are regenerated and never edited, images are referenced in place.
- WCAG 2.2 AA throughout, with zero axe violations in the frontend's a11y suite on every component the apps use, and every
  animation stopping within five seconds.
- Only backend-api's services write data, each change in one transaction with its audit line. Synthetic data goes
  through them too. The contract is `frontend/api/src/types/*.ts`; a change to it changes both sides.
- Nothing in the cloud is made by hand; plans are read before they are applied; no key, no secret in a file.

## Documentation map

| Document | What it covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the solution is built: every technology, with diagrams of the system, the frontend, the API, the data, sign-in, the cloud and the pipeline |
| [AGENTS.md](AGENTS.md) | The repository's layout, commands, rules and tooling, for people and coding agents |
| [CLAUDE.md](CLAUDE.md) | Claude Code specifics, and the record of every change by issue |
| [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [PLAN.md](PLAN.md) | The product, the design system of record, the plan |
| [design3/README.md](design3/README.md) | The prototypes, their build and the hosted copies |
| [frontend/README.md](frontend/README.md) | The SvelteKit workspace, its stack, and how it is kept in step with design3 |
| [backend-api/README.md](backend-api/README.md) | The API, its database, sign-in and roles, the contract, the synthetic world, the cloud |
| [infra/README.md](infra/README.md) | Every cloud resource, its cost and what protects it; CI's keyless deploy |
| [agents/README.md](agents/README.md) | The planned agents service |
| `docs/dobara-journey-map.html` | Journey Map v4.1, the source of every figure |
| `docs/smart-clearance-story.html` | The story (v6), with every calculation |
| `docs/smart-clearance-tech-stack.html` | The planned 15-day stack, which the build has since departed from in places |
| Hosted design pages | [design system](https://claude.ai/design/p/909d23bb-bd3c-466b-abf8-4eccc7c5881e?file=Smart-Clearance+DS+v3.html), [guided demo](https://claude.ai/design/p/8294ec70-3e6b-4359-8de6-2a3fd056c3b2?file=Smart-Clearance+demo+v3.html), [app](https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=Smart-Clearance+app+v3.html), [landing page](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+site+v3.html), [console](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+console+v3.html) |
| Jira | project SC on [duttaarun2015.atlassian.net](https://duttaarun2015.atlassian.net) |
