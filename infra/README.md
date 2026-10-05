# infra

Terraform for Smart-Clearance's Google Cloud project, `aibuilder-510213`, and the scripts that run it (SC-39). For
now it hosts the two frontend apps on Firebase Hosting, each on its own site, and lets GitHub Actions deploy them from
`main` without a key (SC-40). `backend-api` and `agents` join here when they have code.

## What it manages

| Root         | State                                     | What it holds                                                                                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap/` | `gs://aibuilder-510213-tfstate/bootstrap` | <ul><li>The state bucket: in `asia-south1`, versioned (the last 20 versions of each file, for 90 days at most), with uniform access and public access prevented.</li><li>The APIs Terraform itself calls: Service Usage, Resource Manager, Cloud Billing, Storage.</li></ul>                                  |
| `prod/`      | `gs://aibuilder-510213-tfstate/prod`      | <ul><li>The project's link to billing account `012B20-D65DBD-FBAC0E`, adopted by an `import` block (it was linked before Terraform).</li><li>The Firebase Management and Hosting APIs.</li><li>Firebase on the project.</li><li>One Hosting site per app, and a custom domain for each if one is set.</li><li>For CI (SC-40): a Workload Identity pool for GitHub Actions, the `github-deployer` service account, and the repository's `prod` environment with its variables, through the GitHub provider.</li></ul> |

Both roots use `hashicorp/google` 8.5, and `prod` also uses `google-beta` 8.5 (Firebase's resources are beta-only) and
`integrations/github` 6.13. They're locked in `.terraform.lock.hcl` for macOS and Linux on arm64 and amd64.

## The sites

| Target in `frontend/firebase.json` | App                                 | Hosting site             | Address                                |
| ---------------------------------- | ----------------------------------- | ------------------------ | -------------------------------------- |
| `site`                             | `frontend/admin`, the landing page  | `smartclearance`         | https://smartclearance.web.app         |
| `console`                          | `frontend/console`, the staff console | `smartclearance-console` | https://smartclearance-console.web.app |

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
- No custom domain is set, and `smartclearance.com` is not registered in the project.
- No budget alert is set on the billing account.
