# infra

Terraform for Smart-Clearance's Google Cloud project, `aibuilder-510213`, and the scripts that run it (SC-39). For
now it hosts the two frontend apps on Firebase Hosting, each on its own site, and lets GitHub Actions deploy them from
`main` without a key (SC-40). It also holds `backend-api`'s Firebase Authentication, secrets and identity (SC-44), with
its cloud runtime (Cloud SQL, Cloud Run, Cloud Build, monitoring), on since SC-50.

## What it manages

| Root         | State                                     | What it holds                                                                                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap/` | `gs://aibuilder-510213-tfstate/bootstrap` | <ul><li>The state bucket: in `asia-south1`, versioned (the last 20 versions of each file, for 90 days at most), with uniform access and public access prevented.</li><li>The APIs Terraform itself calls: Service Usage, Resource Manager, Cloud Billing, Storage.</li></ul>                                  |
| `prod/`      | `gs://aibuilder-510213-tfstate/prod`      | <ul><li>The project's link to billing account `012B20-D65DBD-FBAC0E`, adopted by an `import` block (it was linked before Terraform).</li><li>The Firebase Management and Hosting APIs.</li><li>Firebase on the project.</li><li>One Hosting site per app, and a custom domain for each if one is set.</li><li>For CI (SC-40): a Workload Identity pool for GitHub Actions, the `github-deployer` service account, and the repository's `prod` environment with its variables, through the GitHub provider.</li><li>For backend-api (SC-44): Firebase Authentication, the console's web app and browser key, Secret Manager's containers, and the <code>sc-api-local</code> service account. Its runtime (SC-50) is behind <code>backend_runtime</code>, on: Cloud SQL, Cloud Run, Cloud Build, Artifact Registry, monitoring and a budget.</li></ul> |

Both roots use `hashicorp/google` 8.5, and `prod` also uses `google-beta` 8.5 (Firebase's resources are beta-only) and
`integrations/github` 6.13. They're locked in `.terraform.lock.hcl` for macOS and Linux on arm64 and amd64.

## The sites

| Target in `frontend/firebase.json` | App                                 | Hosting site             | Address                                |
| ---------------------------------- | ----------------------------------- | ------------------------ | -------------------------------------- |
| `site`                             | `frontend/admin`, the landing page  | `smartclearance`         | https://smartclearance.web.app         |
| `console`                          | `frontend/console`, the staff console | `smartclearance-console` | https://smartclearance-console.web.app |
| `workspace`                        | `frontend/workspace`, Munchly Foods' workspace (SC-62) | `munchly-smartclearance` | https://munchly-smartclearance.web.app |

`prod/terraform.tfvars` maps each target to its site. A site id is global across Firebase; once taken, it is gone.

## Before the first run

- Terraform 1.9 or later, `gcloud` signed in to an account with Owner on the project, `jq`, and Node with corepack
  for the deploy.
- **Credentials.** Terraform uses application-default credentials when there are any. Otherwise the scripts borrow a
  short-lived token from the signed-in `gcloud` account. firebase-tools has no way to take that token, so the deploy
  needs application-default credentials: `gcloud auth application-default login`, once. `prod` also manages the
  GitHub repository's `prod` environment: the scripts pass Terraform the `gh` CLI's token (`gh auth login`, with
  the `repo` scope and admin on the repository).
- **The Firebase Terms.** The account adding Firebase must have accepted the Firebase Terms of Service. Until it has,
  Google answers `403 The caller does not have permission`, even for an Owner. Accept them once at
  [console.firebase.google.com](https://console.firebase.google.com) with that account.

## Commands

From the repository root:

```sh
infra/scripts/bootstrap.sh                   # once per project (safe to re-run): the state bucket
infra/scripts/tf.sh plan -out=prod.tfplan    # what would change; read all of it
infra/scripts/tf.sh apply prod.tfplan        # apply exactly that plan
infra/scripts/tf.sh output hosting_sites     # any other terraform subcommand passes through

infra/scripts/deploy.sh                      # build both apps and release them
infra/scripts/deploy.sh console              # one app, by its target: site or console
SKIP_BUILD=1 infra/scripts/deploy.sh         # release the builds already on disk

infra/scripts/auth-policy.sh                 # after an apply: the password policy and email enumeration protection
infra/scripts/check.sh                       # the gate: terraform fmt and validate, and the scripts' syntax
```

Plan to a file, read the whole plan, then apply that file. Never apply with `-auto-approve` on a plan you have not read.

The first `bootstrap.sh` has no bucket to keep its state in. It applies on local state, through a temporary
`backend_override.tf`, then migrates the state into the bucket it has just made.

## Releases are not Terraform

Terraform owns the sites; the files go out with `deploy.sh`. The provider's Hosting version and release resources
carry configuration only: they cannot upload files. So `deploy.sh`:

1. builds the apps (`corepack pnpm build:admin`, `build:console`);
2. writes `frontend/.firebaserc` from Terraform's `hosting_sites` output, binding each target to its site (the file
   is never committed);
3. runs firebase-tools, pinned to 15.32.1 through `npx`. It reads `frontend/firebase.json` for the rewrites and
   headers, and labels the release with the commit (`-dirty` if `frontend/` has changes not yet committed);
4. checks that each site answers 200.

## CI and the deploy from GitHub

`.github/workflows/ci.yml` runs on every pull request to `main`, and every push to it, that touches the frontend,
design3 (outside `designs/` and `a11y/`), `infra/` or the workflow. It can also be run by hand.

| Job           | When                      | What                                                                                                                                                  |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate | always                    | `corepack pnpm lint`, `check`, `test` (eslint and prettier, svelte-check, the unit tests, and the seed and icons checks)                                   |
| Infra gate    | always                    | `infra/scripts/check.sh`: `terraform fmt` and `validate`, the scripts' syntax, and shellcheck                                                          |
| Build         | always                    | Builds both apps once and keeps the build as an artifact (`frontend-build`, for 7 days)                                                                     |
| Deploy        | on `main`, after all three | In the `prod` environment: signs in as `github-deployer` through Workload Identity Federation, then releases that same artifact with `deploy.sh` (`SKIP_BUILD=1`) |

Deploys queue rather than overlap.

How the deploy is kept to `main` and to this repository:

- **No key.** The job exchanges GitHub's OIDC token for the deployer's credentials. Only the deploy job may ask for
  that token (`id-token: write`); every other job has a read-only `GITHUB_TOKEN`.
- **This repository only.** The pool's provider accepts tokens whose `repository_id` and `repository_owner_id` are
  this repository's numeric ids. Unlike a name, those can't be taken over by a new repository.
- **The `prod` environment only.** Only `prod` environment jobs may act as the deployer
  (`attribute.environment/prod`), and the environment's deployment policy lets only `main` deploy to it.
- **Hosting and nothing else.** The deployer holds `roles/firebasehosting.admin`, plus
  `roles/serviceusage.serviceUsageConsumer` (firebase-tools bills its calls to the project).
- **Pinned actions.** Every action is pinned to a commit SHA, with its version in a comment.

The environment's variables come from Terraform's outputs: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, and
`HOSTING_SITES` (the `hosting_sites` output as JSON, which `deploy.sh` reads instead of Terraform state). None of them
is a secret. A site added in `prod/terraform.tfvars` reaches CI with the next apply.

Terraform itself still runs from a workstation, as a person.

## Firebase Authentication, secrets and backend-api's identity (SC-44)

Applied, and free:

| File | What |
| --- | --- |
| `auth.tf` | <ul><li>Identity Platform's config: **email and password only**, a password required, and **sign-up disabled**. Only backend-api creates accounts (with the Admin SDK), each onboarded with the default password; no email is ever sent.</li><li>Authorized domains: `localhost`, the project's own, both Hosting sites', any custom domains and `extra_auth_domains`.</li><li>The console's Firebase web app, bound to its own browser key (`console-browser`), which may only call the Identity Toolkit and Secure Token APIs, and only from the console's origins and its local dev and preview servers (`console_dev_origins`).</li></ul> |
| `secrets.tf` | Secret Manager **containers**, replicated in the project's region: `sc-default-user-password`, `sc-local-db-app-password`, `sc-local-db-migrator-password`. Terraform never holds a value: `backend-api/scripts/secrets.sh` generates each and pipes it to `gcloud` on stdin. |
| `backend.tf` | <ul><li>A custom role, `scAuthUsers`: create, read, update and delete Firebase users, nothing else. `roles/firebaseauth.admin` would also allow changing the auth config and reading its password-hash parameters.</li><li>`sc-api-local`, the service account a local backend-api runs as. It holds that role and may read the three secrets. It has no key: the backend impersonates it in code, from the developer's own credentials.</li><li>Each of `operators` (in `terraform.tfvars`) may impersonate it.</li></ul> |

Two settings have no Terraform block: the **password policy** (at least 12 characters, with upper and lower case and a
digit) and **email enumeration protection**. `scripts/auth-policy.sh` sets both through the Identity Toolkit API, and
prints what the project has; run it after an apply that creates the config (`--check` only prints).

The console's Firebase config (`console_firebase_config`) is public by design: it ships in the console's JavaScript,
and its key is restricted. It is still never committed: `backend-api/scripts/console-env.sh` (SC-45) writes it into the
console's git-ignored `.env.local`.

## backend-api's runtime (on since SC-50)

`backend_runtime = true` (in `prod/terraform.tfvars`) runs backend-api in the cloud. Turned off, everything below
leaves the plan. It costs about GBP 9 a month in `asia-south1`, nearly all Cloud SQL; the rest sits in free tiers at
the prototype's traffic.

| File | What | About, a month |
| --- | --- | --- |
| `sql.tf` | Cloud SQL for PostgreSQL 18, Enterprise edition, `db-f1-micro`, zonal: IAM database authentication only, through Cloud SQL connectors only, over TLS, with no authorised network; daily backups (7 kept) and point-in-time recovery; deletion protection. The `smart_clearance` database, and IAM users for `sc-api` and `sc-migrator` (only the migrator holds `cloudsqlsuperuser`). No database password exists. | GBP 8.70 |
| `run.tf` | `sc-api` and `sc-migrator`; the `backend-api` Cloud Run service (public ingress, the API checks Firebase tokens itself; 0 to 2 instances; JSON logs) and its jobs: `backend-api-migrate` (as `sc-migrator`) and `backend-api-hydrate` (the synthetic world, as `sc-api`). Created on `backend_image`, a placeholder; Cloud Build deploys every image after that, and Terraform ignores the image. | free tier |
| `registry.tf` | Artifact Registry `sc` for backend-api's images, keeping the last 10 | under GBP 0.10 |
| `build.tf` | Cloud Build: `sc-builder`, what builds run as (push the image, run the migrate job, deploy the service and jobs); a source bucket that empties after 7 days; `github-backend`, the keyless account GitHub Actions starts builds as, from the `prod` environment only | free tier |
| `monitoring.tf` | An email channel (`alert_email`); an uptime check on `/readyz` (it reaches the database) from three regions every 5 minutes; alerts for the API down, 5xx, slow responses, errors in the logs, and the database's CPU, memory and disk; a dashboard. Logs stay in Cloud Logging's `_Default` bucket for 30 days. | free |
| `budget.tf` | A monthly budget on the project (`budget_amount`, GBP 20), alerting the billing account's admins and `alert_email` at 50%, 90% and 100%, and on a forecast over 100% | free |
| `github.tf` | On the `prod` environment: what the backend job starts Cloud Build with. Repository variables `PUBLIC_API_BASE` and `PUBLIC_FIREBASE_*`, which both apps' builds read (the build job runs outside the environment) | |

**How a change reaches Cloud Run.** A merge to `main` touching `backend-api/` runs CI's backend job: it signs in as
`github-backend` and starts `backend-api/cloudbuild.yaml` on Cloud Build, which builds the image, pushes it, runs the
migrate job, moves the hydrate job onto it, deploys the service and checks `/readyz`. The Hosting deploy waits for it.

## Moving it to another project

Everything is keyed on `project_id` and `region`; nothing else names the project.

1. Set `project_id`, `region`, `billing_account`, `github_repository`, `hosting_sites` (site ids are global) and
   `operators` in `prod/terraform.tfvars`, `project_id` and `region` in `bootstrap/terraform.tfvars`, and the backend
   bucket (`<project_id>-tfstate`) in both roots' `versions.tf`. `check.sh` checks that they agree.
2. Accept the Firebase Terms with the account that will apply, then run `scripts/bootstrap.sh`.
3. `scripts/tf.sh plan -out=prod.tfplan`, read it, `scripts/tf.sh apply prod.tfplan`, then `scripts/auth-policy.sh`.
4. `backend-api/scripts/bootstrap.sh` (SC-45): the secrets, the database, its migrations and the synthetic data.
5. `scripts/deploy.sh` for the frontend.

## Custom domains

Set `custom_domain` on a site in `prod/terraform.tfvars` (`smartclearance.com`, `console.smartclearance.com`), plan
and apply. Then add the records from `infra/scripts/tf.sh output custom_domain_dns` at the registrar. Hosting issues
the certificate once the records resolve. Terraform does not wait for DNS.

## What protects what

- The state bucket and both sites have `deletion_policy = "PREVENT"`, kept in state. A destroy, or a change that
  would replace one, fails until the policy is changed and applied.
- The billing link has `deletion_policy = "ABANDON"`. A destroy forgets it, and never unlinks billing from the project.
- No API is disabled on destroy (`disable_on_destroy = false`).
- Firebase cannot be taken off a project. Destroying `google_firebase_project` only drops it from state.
- The billing account id in `prod/terraform.tfvars` is an identifier, not a credential. Access to the account is
  governed by IAM on the account.

## Adding to it

New resources go in `prod/`, one file per concern (for example, `backend-api`'s Cloud Run service in `run.tf`), with
any new API added to `local.services` in `project.tf`. A second environment would be a copy of `prod/` with its own
state prefix and tfvars.

## Known gaps

- Terraform plans and applies run from a workstation, as a person. CI checks the configuration but never plans: a
  plan needs credentials to the state and to GitHub.
- CI doesn't run the e2e or parity suites, which need browsers. Run them yourself (`AGENTS.md`, Commands).
- No custom domain is set, and `smartclearance.com` is not registered in the project. Until it is, console staff use
  `staff_email_domain` (`smartclearance.example`): a password reset goes to whoever receives a domain's mail.
- The budget alert comes with the runtime (`budget.tf`); until then none is set.
- Local development and prod share one Firebase user pool. backend-api's hydrate upserts users and never deletes them,
  and every synthetic address is on a reserved `.example` domain.
