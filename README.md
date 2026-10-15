> [!IMPORTANT]
> **!!! IMPORTANT !!!** How to run the journey demos, step by step, and the sample data they use are in
> **[DEMO.md](DEMO.md)**. The files themselves are in [`demoDataSet/`](demoDataSet/). The sign-in credentials are
> shared separately, with the submission: every account in the demo uses the same password.

# Smart-Clearance

An agentic near-expiry stock router for Indian FMCG brands, built for the Google AI Hackathon 2026 (Retail &
Commerce track). Agents watch a manufacturer's stock across its distributors, price every exit for a batch that will
not sell in time, split it under each exit's caps, wait for one human yes, then list, sell, settle, report, and send
what no exit takes to be destroyed only on evidence and a second yes. Smart-Clearance is sold as software as a
service: one workspace per manufacturer at `<client>-smartclearance.web.app`, set up by Smart-Clearance's own staff
from a console.

| Surface | Where | Runs on |
| --- | --- | --- |
| The landing page | [smartclearance.web.app](https://smartclearance.web.app) | backend-api (its showcase) |
| The staff console | [smartclearance-console.web.app](https://smartclearance-console.web.app) | backend-api, Firebase sign-in |
| Munchly Foods' workspace | [munchly-smartclearance.web.app](https://munchly-smartclearance.web.app) | backend-api and the agents, live |
| The guided demo | [smartclearance-demo.web.app](https://smartclearance-demo.web.app) | the workspace app's stub, in the browser |
| backend-api, the platform API | Cloud Run in `asia-south1`, Cloud SQL for PostgreSQL 18 | live |
| The agents service | Cloud Run, Gemini on Agent Platform, Pub/Sub | live |
| The design prototypes | [`design3/`](design3/README.md), served locally | in-browser mocks |

Every company, person and figure in the product is fictional. Munchly Foods is the story's client.

## Contents

- [Documentation](#documentation)
- [What is in the repository](#what-is-in-the-repository)
- [Prerequisites](#prerequisites)
- [Set up from scratch](#set-up-from-scratch)
- [Start everything from the command line](#start-everything-from-the-command-line)
- [Everyday commands](#everyday-commands)
- [Tests](#tests)
- [Working on Google Cloud](#working-on-google-cloud)
- [How work is done here](#how-work-is-done-here)

## Documentation

| Document | What it covers |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Why Smart-Clearance exists, in four pictures: the problem (a near-expiry batch has one easy exit, the bin, and what it really costs the brand), the USP (it prices every exit for each batch, the bin included, splits the batch across them, asks one person for one yes, then executes every channel in the distributor's name with the papers and the ledger to prove it), how ten agents on Google Cloud solve it stop by stop with the money never a model's guess, and what it changes in the story's own figures. Then the product itself: who uses it and for what, the story's batches, every surface, the principles and positioning. |
| [DEMO.md](DEMO.md) | How a judge tries it: the guided demo, then the live apps step by step with screenshots from the production recordings (`docs/demo/`): the Mango Drink's happy path, the Masala Chips' sad path destroyed against evidence, and the console. Each step says which file of the demo data set to use. |
| [demoDataSet/README.md](demoDataSet/README.md) | The demo data set, by journey: the carton label photos with their barcodes and QR codes, the staff sale's UPI receipt, the destruction's photos at the godown and the landfill, the certificate's signatures, and a first stock export for a new client. |
| [TESTING.md](TESTING.md) | How every test is run: the gates, the a11y, e2e and parity suites, the live tests, the journey suites and the agents' evals, with the scripts, what each needs first, and which journeys to cover. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it is built: the system on Google Cloud, every service and technology with its version, a batch's journey request by request, the agents and their Gemini models, backend-api, events and the live stream, the data, identity, the cloud, delivery, testing, decisions and known gaps. Every picture is a Lucidchart diagram (`docs/architecture/`), with Google Cloud's icons for its services. |
| [Technical Design Documentation](docs/smart-clearance-tdd.pdf) | The architecture as a printed Technical Design Document (PDF, A4 landscape): document control and contents, the system on Google Cloud, Firebase, Cloud Run and Gemini, every service, the agents, the application flow, identity, delivery, testing, observability, performance and cost, decisions, known gaps and the roadmap, with every Lucidchart diagram in its appendix and a glossary. `docs/tdd/build.sh` rebuilds it from the architecture page and ARCHITECTURE.md. |
| [DESIGN.md](DESIGN.md) | Design system v3: tokens, type, colour, components, motion and imagery. |
| [AGENTS.md](AGENTS.md) | The repository's layout, commands, rules and tooling, for people and coding agents. |
| [design3/README.md](design3/README.md) | The prototypes and their build. |
| [frontend/README.md](frontend/README.md) | The SvelteKit workspace: its four apps, shared packages, stack, and how it is kept in step with design3. |
| [backend-api/README.md](backend-api/README.md) | The API, its database, sign-in and roles, the journey, the contract, the synthetic world, the cloud. |
| [agents/README.md](agents/README.md) | The agents: their pipelines, models, events, PDFs, tests and evals. |
| [infra/README.md](infra/README.md) | Every cloud resource, its cost and what protects it; CI's keyless deploy. |
| `docs/` | Journey Map v4.1 (`dobara-journey-map.html`, the source of every figure), the story (v6), the architecture as built (HTML, PDF and draw.io), the Technical Design Documentation (`smart-clearance-tdd.pdf`, built by `tdd/build.sh`), the walkthrough. |
| Jira | project SC on [duttaarun2015.atlassian.net](https://duttaarun2015.atlassian.net) |

## What is in the repository

| Path | What it is |
| --- | --- |
| `design3/` | The current design and the source of truth for every design: the design system, the guided demo, the workspace app prototype, the landing page and the console, as React pages on in-browser mocks; every design review in `designs/SC-<n>/`. |
| `frontend/` | The production frontend, a SvelteKit 3 pnpm workspace: four apps (`admin`, the landing page; `console`; `workspace`, a client's workspace; `demo`, the guided demo) over three shared packages (`core`, design system v3 with the workspace's and console's screens; `api`, the contract and the in-browser mocks; `testing`). |
| `backend-api/` | The platform API: FastAPI on PostgreSQL 18, Firebase Authentication, Secret Manager; the journey's steps and clock; the hydrate step that builds a synthetic world through the API's own services. |
| `agents/` | The agents service: Google ADK pipelines on Gemini through Agent Platform, one run a Pub/Sub event, reporting to backend-api; the eval sets. |
| `infra/` | Terraform for the Google Cloud project, and the scripts that run it. |
| `.github/` | GitHub Actions: the gates on every pull request, the deploys from `main`. |
| `docs/` | The story pages, the walkthrough page, and PRODUCT.md's pictures with their sources (`docs/product/`). |
| `design/`, `design2/` | Earlier design rounds. Reference only. |

## Prerequisites

macOS or Linux. Nothing is installed globally except these tools.

| Tool | Version | Needed for | Install |
| --- | --- | --- | --- |
| Git | recent | everything | |
| Node.js | 22.17 or later (CI uses 24) | design3's build, the frontend, the Hosting deploy | `brew install node` |
| corepack | ships with Node | pnpm, pinned by `frontend/package.json` | `corepack enable` once, if needed |
| Python 3 | 3.9 or later | serving design3 (`http.server`) | ships with macOS |
| uv | 0.12 or later | backend-api and the agents (uv fetches Python 3.14 itself) | `brew install uv` |
| Docker | recent, running | the local PostgreSQL 18 | Docker Desktop, OrbStack or Colima |
| Google Cloud CLI | current | backend-api and the agents locally, every cloud operation | `brew install --cask google-cloud-sdk` |
| Pango | recent | the Paperwork agent's PDFs, locally | `brew install pango` |
| jq | any | the scripts and hooks | `brew install jq` |
| GitHub CLI (`gh`) | recent | pull requests, `infra/prod` plans, the journey suites on production | `brew install gh` |
| Terraform | 1.9 or later | `infra/` only | `brew install terraform` |
| shellcheck | any | `infra/scripts/check.sh` | `brew install shellcheck` |

For backend-api and the agents you also need a Google account that Terraform lists in `operators`
(`infra/prod/terraform.tfvars`): it lets your machine act as the local service accounts (`sc-api-local`,
`sc-agents-local`). Ask the maintainer to add yours and apply. Without it, design3 and the frontend still run in full on
their mocks and stubs.

## Set up from scratch

Each part works on its own: steps 1 to 3 need no Google account; steps 4 to 7 do.

### 1. Clone

```bash
git clone https://github.com/aibuilder2026/smart-clearance.git && cd smart-clearance
```

### 2. design3, the prototypes

Static pages: React 18 from a CDN, every `.jsx` precompiled to the `.js` beside it.

```bash
cd design3 && ./build.sh && cd ..
```

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

Rebuild after editing any `.jsx` (`./build.sh`); `./dist.sh` bundles the build into `design3/dist/`.

### 3. The frontend, on its mocks

```bash
cd frontend
corepack pnpm install                                 # the first call downloads the pinned pnpm
corepack pnpm exec playwright install chromium webkit firefox   # only for the browser suites
```

With no `PUBLIC_API_BASE`, every app runs on its in-browser mock or stub, so nothing else needs to run (the commands are
in [Start everything](#start-everything-from-the-command-line)). On the mock, the console takes any active staff
member's address (`neha.kulkarni@smartclearance.com`) and any password; the workspace app offers "Explore as someone in
the story".

### 4. Google Cloud sign-in

```bash
gcloud auth login
```

```bash
gcloud auth application-default login
```

```bash
gcloud config set project aibuilder-510213
```

### 5. backend-api

**a. A PostgreSQL 18 container.** The scripts expect it named `postgres` (`PG_CONTAINER` changes it) and run as its
superuser over the container's socket, so the password below is never needed again:

```bash
docker run -d --name postgres -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" -p 127.0.0.1:5432:5432 -v sc-pgdata:/var/lib/postgresql postgres:18
```

**b. Check the machine.** `doctor.sh` changes nothing: it checks Docker, uv, both gcloud sign-ins, the impersonation,
Firebase Auth, each secret, the container, the database and the schema, and names the script that fixes each miss.

```bash
backend-api/scripts/doctor.sh
```

**c. Bootstrap.** Safe to re-run; what exists is kept.

```bash
backend-api/scripts/bootstrap.sh
```

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `secrets.sh` | Gives each Secret Manager container a first version: the default user password and the local database's two login passwords, generated and piped to `gcloud`; never written or printed. |
| 2 | `db-init.sh` | The databases `smart_clearance` and `smart_clearance_test`, the roles `sc_owner` and `sc_app`, the logins `sc_migrator` and `sc_api`. |
| 3 | `migrate.sh` | Alembic as `sc_migrator`, then the reference data from design3. |
| 4 | `hydrate.sh` | The synthetic world through the API's services: the platform's staff, six generated clients with 35 days of batches, and Munchly Foods' live workspace with its story's batches, its people and partners, and its pilot quarter's 12 cleared batches. Every person with an address gets a Firebase account on the default password. |

**d. Run it and test it:**

```bash
backend-api/scripts/dev.sh                 # http://localhost:8000, the docs at /docs, readiness at /readyz
backend-api/scripts/test.sh -q             # pytest on smart_clearance_test
```

### 6. The agents

```bash
cp agents/.env.example agents/.env         # the model ids; no secrets
agents/scripts/dev.sh                      # the pull worker, as sc-agents-local, against http://localhost:8000
```

It calls live Gemini (a few pence a journey); `MODEL_TIER=stub agents/scripts/dev.sh` replays recordings instead. With
Pango installed, the Paperwork agent lays out every paper as a PDF in the local docs bucket. Hydrate queued the pilot
quarter's papers on Pub/Sub, so they are laid out as soon as the worker starts. Any still without a PDF (Pango missing
at the time, say), and the label photos of a world built before SC-142, are filled in by:

```bash
backend-api/scripts/hydrate.sh --papers munchly
backend-api/scripts/hydrate.sh --photos munchly
```

### 7. The frontend on the real API

```bash
backend-api/scripts/app-env.sh             # writes the console's, the landing page's and the workspace app's .env.local
backend-api/scripts/default-password.sh --copy   # the password every account starts on, to the clipboard
```

Restart the dev servers to pick the files up. The console signs in with Firebase
(`neha.kulkarni@smartclearance.example`); the workspace app signs in Munchly's people (`priya.deshmukh@munchly.example`)
and partners (`rakesh-traders@google.example`), every account on the default password. To go back to the mocks, delete
the `.env.local` files, or run an app with `PUBLIC_API_BASE=` empty.

## Start everything from the command line

One terminal per process. Open the apps on `localhost`, which the API's CORS and the Firebase browser keys allow.

| What | Command | Port |
| --- | --- | --- |
| PostgreSQL 18 | `docker start postgres` | 5432 |
| backend-api | `backend-api/scripts/dev.sh` | 8000 |
| The agents' worker | `agents/scripts/dev.sh` | (pulls from Pub/Sub) |
| The landing page | `cd frontend && corepack pnpm dev` (and `/ds`, the design system) | 5173 |
| The staff console | `cd frontend && corepack pnpm dev:console` | 5174 |
| Munchly's workspace | `cd frontend && corepack pnpm dev:workspace` | 5175 |
| The guided demo | `cd frontend && corepack pnpm dev:demo` | 5176 |
| design3 | `python3 -m http.server 8787 --directory design3` | 8787 |

The builds and their previews (restart a preview server after a rebuild; it reads the build's file list once):

```bash
cd frontend
corepack pnpm build                        # every app: admin/build, console/build, workspace/build, demo/build
corepack pnpm preview                      # the landing page on :4173
corepack pnpm preview:console              # :4176
corepack pnpm preview:workspace            # :4177
corepack pnpm preview:demo                 # :4178
```

backend-api can also run as its container, the way Cloud Run does: `backend-api/scripts/up.sh`. In Claude Code each
row above is a preview config in `.claude/launch.json` (`backend-api`, `frontend-admin`, `frontend-console`,
`frontend-workspace`, `frontend-demo`, their `-preview` builds, `design3`).

For only the guided demo or the prototypes, nothing but `corepack pnpm dev:demo` or the design3 server is needed.

## Everyday commands

| Task | Command |
| --- | --- |
| Regenerate what the frontend derives from design3 (after any design3 data or icon change) | `cd frontend && corepack pnpm seed && corepack pnpm icons` |
| Move the synthetic world on a day (today's agent runs, a few batches on a stop) | `backend-api/scripts/hydrate.sh --tick` |
| Rebuild the local world from scratch (Firebase accounts are kept) | `backend-api/scripts/hydrate.sh --reset` |
| Start Munchly's live journey again (as the console's Reset journey) | `backend-api/scripts/hydrate.sh --journey-reset munchly` |
| Set Munchly's journey day (1440 is real time; set it back after a journey run) | `backend-api/scripts/hydrate.sh --day-minutes munchly=1440` |
| Walk the journey over HTTP, to a stop | `backend-api/scripts/walk.sh --until detect` |
| Re-export the API's OpenAPI after a contract change | `backend-api/scripts/contracts.sh` |
| Production's data against local's (read-only) | `backend-api/scripts/sync.sh` |

Demoing step by step, with the demo data set, and what Reset journey keeps: [DEMO.md](DEMO.md).

## Tests

The gates run in CI on every pull request; run them before pushing:

```bash
cd frontend && corepack pnpm lint && corepack pnpm check && corepack pnpm test
```

```bash
cd backend-api && uv run ruff check . && uv run ruff format --check . && scripts/test.sh -q
```

```bash
cd agents && uv run ruff check . && uv run ruff format --check . && uv run pytest
```

```bash
infra/scripts/check.sh
```

The a11y, e2e, parity, live and journey suites, and the agents' evals, run on request only: how to run each, what it
needs first and which journeys to cover are in [TESTING.md](TESTING.md).

## Working on Google Cloud

Everything in the cloud is in one Google Cloud project, made by Terraform in `infra/`, and operated with `gcloud` and
the scripts. The rules, from AGENTS.md: every resource is Terraform, never made by hand; every plan is saved, read in
full and applied as that file; no service account key exists anywhere; every secret lives in Secret Manager only; ask
before adding anything that costs money.

### The project

| | |
| --- | --- |
| Project | `aibuilder-510213` (AIBuilder), billing account `012B20-D65DBD-FBAC0E` |
| Region | `asia-south1` (Mumbai) |
| Terraform state | `gs://aibuilder-510213-tfstate`, prefixes `bootstrap` and `prod` |
| Firebase Hosting | sites `smartclearance`, `smartclearance-console`, `munchly-smartclearance` and `smartclearance-demo` |
| Firebase Authentication | Identity Platform, email and password only, sign-up disabled; one user pool shared by local development and production; a web app for the console and one for the workspace |
| Cloud SQL | instance `sc-main`, PostgreSQL 18, `db-f1-micro`, database `smart_clearance`, IAM authentication only, through connectors only |
| Cloud Run | services `backend-api` (public) and `agents` (internal); jobs `backend-api-migrate` and `backend-api-hydrate` |
| Pub/Sub | per environment (`prod`, `local`): `batch.at_risk`, `offer.received`, `deal.closed`, `journey.step`, `notify`, a dead letter; push subscriptions in prod, pull subscriptions locally |
| Cloud Scheduler | `sc-tick` every minute (the journey clock's timers and daily runs); `sc-journey-reset`, paused |
| BigQuery | datasets `smartclearance` and `smartclearance_local`, seven tables each |
| Cloud Storage | the photos, docs and exports buckets for each environment; photos and papers kept for good, exports deleted after 30 days |
| Artifact Registry, Cloud Build | repository `sc`; builds run as `sc-builder` |
| Secret Manager | `sc-default-user-password`, `sc-local-db-app-password`, `sc-local-db-migrator-password` |
| Service accounts | `sc-api`, `sc-migrator`, `sc-agents`, `sc-invoker`, `sc-builder`, the local `sc-api-local` and `sc-agents-local`, and CI's keyless `github-deployer` and `github-backend` |
| Monitoring | an uptime check on `/readyz`, alert policies and a dashboard, emailing the operator; Cloud Trace for sampled requests |
| Budget | GBP 30 a month, alerting at 50%, 90% and 100% and on a forecast overrun |

### Access

- **Operators** are the Google accounts in `operators` (`infra/prod/terraform.tfvars`). Each may act as the local
  service accounts. Terraform needs Owner on the project; the deploy needs application-default credentials.
- **`infra/prod` also manages the repository's `prod` environment and variables**, through the `gh` CLI's token:
  `gh auth login` with the `repo` scope and admin on the repository.
- **Never** sign in with `gcloud auth application-default login --impersonate-service-account`: Terraform would run as
  that account.
- **CI** signs in through Workload Identity Federation from the `prod` environment only, as `github-deployer` (Hosting
  only) or `github-backend` (may only start Cloud Build builds). Never create a service account key or store a Google
  credential as a GitHub secret.

### Terraform

From the repository root; the wrapper sets up credentials and runs `init`.

```bash
infra/scripts/bootstrap.sh                   # once per project: the state bucket and the APIs
```

```bash
infra/scripts/tf.sh plan -out=prod.tfplan    # read the whole plan, then:
```

```bash
infra/scripts/tf.sh apply prod.tfplan
```

Any subcommand passes through (`infra/scripts/tf.sh output`). After an apply that creates the Identity Platform config,
`infra/scripts/auth-policy.sh` sets the password policy and email enumeration protection. `infra/README.md` lists every
resource, its cost and its protection.

### Secrets

Terraform makes the containers and never holds a value. `backend-api/scripts/secrets.sh` fills them (generated, piped
to `gcloud` on stdin); `--rotate` rotates every one and moves accounts on the old default password to the new one.
Read a value only to hand over the default password: `backend-api/scripts/default-password.sh --copy`. The API reads
every secret by reference at runtime, into memory. CI's gitleaks scan runs on every pull request.

### Releasing

A merge to `main` releases what it touches:

1. **backend-api** (`backend-api/`): Cloud Build (`backend-api/cloudbuild.yaml`, as `sc-builder`) builds and pushes the
   image, runs the migrate job, moves the hydrate job onto it, deploys the service and checks `/readyz`.
2. **The agents** (`agents/`): `agents/cloudbuild.yaml` builds and deploys the internal service, after backend-api.
3. **The four apps** (`frontend/`, `design3/` outside `designs/`, `infra/`): one build of every app against the
   repository's variables, released to Firebase Hosting as `github-deployer`, after the backends.

By hand, from your machine:

```bash
gcloud builds submit backend-api --config=backend-api/cloudbuild.yaml --service-account="projects/aibuilder-510213/serviceAccounts/sc-builder@aibuilder-510213.iam.gserviceaccount.com" --gcs-source-staging-dir=gs://aibuilder-510213-builds/source --substitutions=_TAG="$(git rev-parse --short=12 HEAD)"
```

```bash
infra/scripts/deploy.sh                      # every app; or deploy.sh site | console | workspace | demo
```

Roll back backend-api by deploying an earlier image tag (every tag is a commit):

```bash
gcloud run services update backend-api --region=asia-south1 --image=asia-south1-docker.pkg.dev/aibuilder-510213/sc/backend-api:<commit>
```

Roll back an app from the Firebase console (Hosting, Release history) or with
`npx firebase-tools@15.32.1 hosting:rollback` in `frontend/`. Cloud Run scales to zero, so the first request after a
quiet spell waits a few seconds; it reserves `/healthz` on the public address, so use `/readyz`.

### The cloud database

There is no database password in the cloud: Cloud SQL takes IAM logins through connectors only, as `sc-api` and
`sc-migrator`. Every change to the data goes through the API or its two jobs. `--args` on `execute` replaces a job's
arguments, so always pass `--allow-env,prod` again.

```bash
gcloud run jobs execute backend-api-migrate --region=asia-south1 --wait
```

```bash
gcloud run jobs execute backend-api-hydrate --region=asia-south1 --args=--allow-env,prod,--tick --wait
```

The hydrate job also takes `--live-only` (Munchly's live workspace on a world that already has its story), `--papers`
and `--photos` (the pilot quarter's PDFs and photos). Replacing production's data with local's is
`backend-api/scripts/sync.sh --apply --allow-env prod` (a backup first; only while infra's `data_sync_until` allows),
on the maintainer's yes. Resetting production's schema has no job, on purpose. Cloud SQL keeps seven daily backups and
seven days of point-in-time recovery (`gcloud sql backups list --instance=sc-main`).

### Accounts and passwords

- **One user pool** for local development and production: an account made locally signs in to production too.
  Every synthetic address is on a reserved `.example` domain.
- **No email is ever sent.** Every account starts on the default password, which an operator hands over. Users cannot
  sign themselves up.
- **Staff** are invited from the console (Staff, Invite) by a Super admin. Reset one account to the default password
  (this reaches production too):

  ```bash
  bash -c 'source backend-api/scripts/lib.sh; as_api; uv_run sc-admin reset-passwords --email name@smartclearance.example'
  ```

- **The apps' Firebase web configs** are public by design (they ship in the apps' JavaScript) but never committed:
  locally `app-env.sh` writes them, in CI they are repository variables Terraform sets.

### Logs, traces and alerts

The API and the agents log one JSON object a line, so Cloud Logging indexes it and Error Reporting groups stack traces.
Every request carries a trace through its log lines, spans and audit rows (Cloud Trace, sampled).

```bash
gcloud run services logs read backend-api --region=asia-south1 --limit=100
```

```bash
gcloud logging read 'severity>=ERROR AND (resource.type="cloud_run_revision" OR resource.type="cloud_run_job")' --limit=50
```

```bash
gcloud logging read 'trace="projects/aibuilder-510213/traces/TRACE_ID"' --limit=100
```

The alerts email the operator on a failing `/readyz`, 5xx bursts, slow responses, error lines from the API, the agents
or a job, and a stretched database; the budget at 50%, 90% and 100% of GBP 30.

### Costs

About GBP 9 a month at Google's catalog prices, nearly all Cloud SQL. The live journey adds GBP 1 to 3 a month with
light use and 8 to 15 with heavy use, nearly all Gemini. Everything else sits in free tiers at the prototype's traffic.
Anything new that costs money is asked about first, with its price.

### Moving to another project

Everything is keyed on `project_id` and `region`; the order is in `infra/README.md` (Moving it to another project):
set the tfvars and the state bucket's name, accept the Firebase Terms with the account that will apply,
`bootstrap.sh`, plan and apply, `auth-policy.sh`, `backend-api/scripts/bootstrap.sh`, `deploy.sh`.

## How work is done here

The rules are in [AGENTS.md](AGENTS.md). In short:

- Every change has a Jira key in project SC: branch `SC-<n>-<slug>` from `main`, commits `SC-<n>: <subject>`, pull
  requests `[SC-<n>] <title>`. Never commit on `main`. Pull requests merge with a merge commit, and the branch is
  deleted.
- Every new UI or UX change is designed first: two or three options on a review board, saved under
  `design3/designs/SC-<n>/`; only the option the maintainer picks is built, in design3 first and then ported to
  `frontend/`.
- The frontend implements design3, and tests hold it there: ported CSS stays verbatim, generated files are
  regenerated and never edited, images are referenced in place.
- WCAG 2.2 AA throughout, with every component the apps use scanned, and every animation stopping within five
  seconds (the hero film loops under its Pause).
- Only backend-api's services write data, each change in one transaction with its audit line. The contract is
  `frontend/api/src/types/*.ts`; a change to it changes both sides.
- Nothing in the cloud is made by hand; plans are read before they are applied; no key, no secret in a file.
