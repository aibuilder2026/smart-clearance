# AGENTS.md

How this repository is worked on: its layout, commands and rules, and the agent tooling around it. It is written for any coding agent and for people. Claude Code reads it through `CLAUDE.md`.

## Project

Smart-Clearance (working title Short-Date Router) is an agentic near-expiry stock router for Indian FMCG brands, built for the Google AI Hackathon 2026 (Retail & Commerce track). The repo holds the product and design work so far:

- three rounds of clickable prototypes;
- the story documents;
- a narrated walkthrough video;
- the first production code: the SvelteKit frontend (SC-27), with the landing page and the staff console as two apps
  (SC-37).

Smart-Clearance is meant to be sold to manufacturers as software as a service, one workspace each at `<client>.smartclearance.com`, set up for that client's supply chain. The prototypes are Munchly Foods' workspace at munchly.smartclearance.com.

The production code starts in `frontend/` (SC-27): design system v3 in Svelte, the platform's landing page, and the staff console (SC-37), each app built and deployed on its own. `backend-api/` (SC-45) is the platform's API: FastAPI on PostgreSQL 18, Firebase Authentication with email and password, and every secret in Google Secret Manager. It serves the frontend's contract, runs locally against the developer's Docker Postgres, and in the cloud on Cloud Run with Cloud SQL (SC-50), built and deployed by Cloud Build. Without `PUBLIC_API_BASE` the frontend runs on its in-browser mocks; with it, the console signs staff in with Firebase (email and password, SC-46) and both apps read and write the API. `agents/` is planned. `infra/` (SC-39) is Terraform for the Google Cloud project, `aibuilder-510213`: Firebase Hosting, one site per app, released by its deploy script.

## Layout

| Path | What it is |
| --- | --- |
| `design3/` | The current design and the source of truth for designs:
<ul><li>design system, guided demo, app prototype (Munchly Foods' workspace, an installable PWA), the platform's landing page and console;</li><li>every design review in `designs/`, one folder per issue;</li><li>the accessibility suite.</li></ul>Start with `design3/README.md`. |
| `frontend/` | The SvelteKit 3 frontend, a pnpm workspace that implements design3. Two apps, each deployed on its own:<ul><li>`admin`, the platform's own site: the landing page (smartclearance.com);</li><li>`console`, the staff console (console.smartclearance.com).</li></ul>Three shared packages:<ul><li>`core`, design system v3 in Svelte;</li><li>`api`, the contract with backend-api and an in-browser mock of it;</li><li>`testing`, what the apps' test suites share.</li></ul>Start with `frontend/README.md`. |
| `backend-api/` | The platform's API (SC-45): FastAPI, PostgreSQL (one database, `smart_clearance`), Firebase Auth, Secret Manager.<ul><li>`src/sc_api/`: routes, services (the only writers; every change writes its audit line), models, the ported rules;</li><li>`migrations/` (Alembic), `db/` (roles);</li><li>`scripts/`: doctor, secrets, db-init, migrate, hydrate, dev, up, test, bootstrap;</li><li>`tests/` (pytest on a real Postgres), `contracts/openapi.json`.</li></ul>Start with `backend-api/README.md`. |
| `agents/` | The AI agents, planned. README only for now. |
| `infra/` | Terraform for the Google Cloud project, and the scripts that run it:<ul><li>`bootstrap/`, the state bucket;</li><li>`prod/`, the billing link, Firebase, a Hosting site per app, and CI's keyless deployer with the repository's `prod` environment;</li><li>`scripts/`, bootstrap, the Terraform wrapper, the deploy and the gate.</li></ul>Start with `infra/README.md`. |
| `.github/` | GitHub Actions (SC-40): `workflows/ci.yml` lints, type-checks, tests and builds the frontend and checks `infra/` on every pull request, then deploys both apps from `main`. `actions/setup-frontend` is the shared Node, pnpm and cache setup. |
| `design2/`, `design/` | Earlier rounds, superseded by v3. Reference only. |
| `docs/` | Story pages: `dobara-journey-map.html` (Journey Map v4.1, the source of every figure), the story, the tech stack and the walkthrough. |
| `video/` | The narrated walkthrough. `build.py` builds the page and `record.mjs` records it with Playwright; `recorder/` is a local voice-recording page. |
| `PRODUCT.md`, `DESIGN.md` | Product context, and the design system of record. |
| `PLAN.md` | The product plan (2 Oct 2026). |
| `.claude/`, `.mcp.json` | Claude Code project configuration (see Tooling). |

## Commands

```sh
cd design3 && ./build.sh            # compile every .jsx to the .js beside it (esbuild); run after any edit
cd design3 && ./dist.sh             # bundle the hosted build into design3/dist/
python3 -m http.server 8787 --directory design3   # serve the demo, app and design system locally

cd design3/a11y && npm ci && npx playwright install chromium   # once
npm test                            # WCAG 2.2 AA suite: 380 tests in five viewports, about 6 minutes
npm run test:desktop                # light and dark at 1440 only, for a quicker loop
npm run report                      # the Playwright HTML report
```

The frontend (from `frontend/`; pnpm comes through corepack, nothing is installed globally):

```sh
corepack pnpm install                     # once
corepack pnpm dev                         # the landing page on :5173, and /ds
corepack pnpm dev:console                 # the console on :5174 (sign in as Neha Kulkarni or Sameer Rao)
corepack pnpm build                       # both apps, into admin/build and console/build (build:admin, build:console)
corepack pnpm lint && corepack pnpm check && corepack pnpm test   # the gate jira-flow runs
corepack pnpm test:e2e                    # both apps: WCAG 2.2 AA in five projects, keyboard, motion, flows, Firefox and WebKit smoke
corepack pnpm test:parity                 # both apps' builds against design3, pixel by pixel
corepack pnpm seed && corepack pnpm icons # regenerate from design3 after it changes
```

The infrastructure (from the repository root; `infra/README.md` has the prerequisites):

```sh
infra/scripts/bootstrap.sh                  # once per project: the Terraform state bucket
infra/scripts/tf.sh plan -out=prod.tfplan   # read the whole plan, then:
infra/scripts/tf.sh apply prod.tfplan
infra/scripts/deploy.sh                     # build both apps and release them to Firebase Hosting (or: deploy.sh site | console)
infra/scripts/check.sh                      # the gate jira-flow runs: terraform fmt and validate, and the scripts' syntax
```

The backend (from the repository root; `backend-api/README.md` has the prerequisites):

```sh
backend-api/scripts/bootstrap.sh            # once per project: secrets, database and logins, schema, reference data, synthetic world
backend-api/scripts/dev.sh                  # the API on :8000, as sc-api-local (or the backend-api preview config)
backend-api/scripts/test.sh                 # pytest against smart_clearance_test: 152 tests, a few seconds
backend-api/scripts/hydrate.sh --reset      # rebuild the synthetic world (Firebase accounts are kept)
backend-api/scripts/hydrate.sh --tick       # today's agent runs, and a few batches moved on a stop (the console's day is today)
backend-api/scripts/default-password.sh --copy   # the password every account starts on
backend-api/scripts/console-env.sh          # point the frontend's .env.local at the local API (restart its dev servers)
backend-api/scripts/e2e.sh                  # the landing page and the console end to end on the local API and Firebase Auth
cd backend-api && uv run ruff check . && scripts/test.sh   # the gate jira-flow runs
```

Local pages:

- `/demo/Smart-Clearance%20demo%20v3.html`
- `/app/Smart-Clearance%20app%20v3.html`
- `/system/Smart-Clearance%20DS%20v3.html`
- `/site/Smart-Clearance%20site%20v3.html`
- `/console/Smart-Clearance%20console%20v3.html`

## Rules

**Work and shipping**

- Every change has a Jira key in project SC:
  - branch from `main` as `SC-<n>-<slug>`;
  - write commit subjects as `SC-<n>: <subject>`;
  - title PRs `[SC-<n>] <title>`.
- Never commit on `main`.
- These need no approval: branching, committing, pushing a feature branch, and creating, updating, commenting on or moving Jira issues.
- These need the maintainer's explicit yes in the current request: raising a PR, merging, and closing a Jira issue (moving it to Done). Prepare everything up to that point, then ask once.
- PRs merge with a merge commit, and the branch is deleted afterwards.
- Commit with the repo's configured git identity, the maintainer's GitHub noreply address. Never override `user.email`.
- No AI attribution lines in commit messages or PR descriptions.

**Design**

- `design3` is the source of truth for designs. Every design created or edited is saved under `design3/designs/SC-<n>/` and committed on that issue's branch:
  - options, comps, mock-ups and motion prototypes;
  - the review board, and the record of the pick.

  PNG originals stay local in `src/`; only WebP ships. Claude Design and claude.ai artifacts hold published copies, never the only copy.
- Every new UI or UX change goes the Claude Design route first, following the `design-first` skill (`.claude/skills/design-first/`):
  1. Design 2 or 3 options:
     - impeccable;
     - ui-ux-pro-max for product screens, or the taste skills for the landing page;
     - Framer Motion for motion;
     - Qwen-Image or LTX for imagery.
  2. Save them in `design3/designs/SC-<n>/`.
  3. Publish one review board to the Claude Design project for the surface: app, demo, platform (landing page and console) or design system.
  4. The maintainer picks one option in the current request. Only the picked option is built.
- Small fixes that change no design skip this.
- A project hook, `.claude/hooks/design-first-reminder.sh`, repeats the rule whenever a request reads like a UI or UX change.
- ThreeUI Community components (MIT), through the `threeui-community` plugin (see Tooling), are effects to adapt, never to drop in as they are:
  - restyle them to design system v3: the system's inks, and no soft halos or glows beyond the aura and the camera scanline;
  - their motion stops within five seconds, and lands on a still frame under reduced motion (WCAG 2.2.2);
  - a decorative canvas is `aria-hidden`, and text drawn over it is measured against the pixels behind it;
  - a `THIRD_PARTY_NOTICES.md` beside the adapted code keeps the MIT notice and names the component and the catalog commit;
  - ThreeUI's Pro and Beta components are not used.

**Code and builds**

- In `design3/`, edit the `.jsx`. The `.js` beside it and everything in `dist/` are generated.
- `core/` and `screens/` are shared by the demo and the app through symlinks, so a change there affects both.
- The hosted pages load `dist/` from jsDelivr and images from GitHub raw, both pinned to a commit SHA. To publish a new version:
  1. Run `./dist.sh`, then commit and push.
  2. Point each hosted page at the new SHA.
  3. Bump `VERSION` in the hosted app's `sw.js`.
  4. Check that each page renders.

**The frontend**

- `frontend/` implements design3. A design change is made in design3 first (the design-first skill), then ported.
- Ported CSS stays verbatim outside marked `/* @port … @port-end */` blocks; the drift tests fail otherwise.
- Never hand-edit the generated files:
  - `frontend/api/src/seed/` and `frontend/admin/src/lib/seed/`, written from `design3/core` by `corepack pnpm seed`;
  - `frontend/core/src/lib/icons/registry.ts`, from `design3/system/icons.js` by `corepack pnpm icons`.

  `seed:check` and `icons:check` run in the gate.
- Reference design3's images in place; the build hashes them. Never copy them.
- What the apps share lives in a shared package, never in a copy: components and CSS in `core`, the contract and mocks in `api`, test helpers in `testing`. Each app's `src/app.html` is the same file, and a test keeps it so.
- Each app deploys on its own: `frontend/firebase.json` has a Hosting target for each (`site` and `console`), and `infra/scripts/deploy.sh` releases each to the Hosting site Terraform made for it.
- SvelteKit 3 differs from 2:
  - its config is in `vite.config.ts`;
  - imports use `#lib/…` with the `.ts` extension written out;
  - environment variables are declared in `src/env.ts` and read from `$app/env/public`;
  - a layout that exports `ssr = false` loses its load function on the server, so turn SSR off in a route group, not the root layout.

**Infrastructure**

- Every cloud resource is Terraform in `infra/`, never made by hand in a console. Something made by hand first is adopted with an `import` block, as the billing link was.
- Plan to a file, read the whole plan, then apply that file (`tf.sh plan -out=prod.tfplan`, `tf.sh apply prod.tfplan`). Never `-auto-approve` a plan nobody has read.
- State lives in `gs://aibuilder-510213-tfstate`, one prefix per root. Never commit state, plans or `.terraform/`; do commit `.terraform.lock.hcl`.
- What would hurt to lose carries a `deletion_policy`: `PREVENT` on the state bucket and the Hosting sites, `ABANDON` on the billing link.
- Releases are not Terraform: the provider cannot upload Hosting files, so `infra/scripts/deploy.sh` releases them through firebase-tools (pinned).
- A merge to `main` that touches the frontend, design3 or `infra/` deploys both apps (SC-40). CI's deploy job runs in the GitHub environment `prod`, the only environment, which only `main` may deploy to.
- CI signs in to Google through Workload Identity Federation, from the `prod` environment only. It uses two accounts:
  - `github-deployer`, which may only deploy Hosting;
  - `github-backend` (SC-50), which may only start Cloud Build builds as `sc-builder`, the account that pushes backend-api's image, migrates the database and deploys Cloud Run.

  Never create a service account key, or store a Google credential as a GitHub secret.
- A merge to `main` touching `backend-api/` rebuilds and redeploys it through Cloud Build (`backend-api/cloudbuild.yaml`) before the apps are deployed. Cloud Build owns the Cloud Run image; Terraform ignores it.
- The cloud runtime costs about GBP 9 a month, nearly all Cloud SQL; a GBP 20 budget alerts the operator. Ask before adding anything that costs money, with its price.
- In workflows, pin every action to a commit SHA, with its version in a comment. Keep the workflow token read-only, and grant `id-token: write` only to the job that deploys.

**The backend and secrets**

- Every secret lives in Google Secret Manager, and only there. Scripts generate a secret and pipe it to `gcloud` on stdin. The API reads it by reference at runtime. No secret goes in a file, a command line, a log, Terraform state or git. Terraform makes the secret containers only. CI's secret scan (gitleaks) runs on every pull request.
- No key exists for any service account. A local backend impersonates `sc-api-local` in code from the developer's own credentials. Never use `gcloud auth application-default login --impersonate-service-account`: Terraform would run as it.
- Only `backend-api`'s services write data, each change in one transaction with its audit line, in the acting person's name and the prototype's words (`frontend/api/src/console/mock.ts`). The audit log is append-only.
- The API's login (`sc_app`) never changes the schema or the reference data. Migrations run as `sc_owner`.
- Synthetic data goes through the services (`hydrate.sh`), never as hand-written rows. Every synthetic address is on a reserved `.example` domain.
- No email is ever sent: accounts start on the default password, which an operator hands over.
- The contract is `frontend/api/src/types/*.ts`. A change to it changes both sides, and `contracts.sh` re-exports the OpenAPI.
- Reference data comes from design3 through `frontend/scripts/seed.mjs` (into `backend-api/src/sc_api/reference/`). Never hand-edit it; `rbac.json` is the exception.

**Accessibility**

- The target is WCAG 2.2 AA, measured by `npm test` in `design3/a11y` and the frontend's `corepack pnpm test:e2e` (the same axe helpers and five projects): zero violations when they run.
- **The browser suites run on request only** (SC-55). The frontend's e2e and parity suites, design3's a11y suite and `backend-api/scripts/e2e.sh` take minutes and browsers, and they are not gates. They run only when the maintainer explicitly asks for them in the current request, never as a routine step of a design, a UX change, a port or a ticket. Do the work, say which suite would answer the question and how long it takes, and offer to run it. When asked, follow the `browser-suites` skill (`.claude/skills/browser-suites/`). The `ask-before-suites` hook turns any attempt into a permission prompt, as a backstop.
- The suite covers what axe-core can decide, plus keyboard checks for:
  - the sign-in tab order;
  - sheets taking, keeping and returning focus;
  - the menu-button pattern;
  - the sign-in hero's pause and replay.

  These criteria still need a manual pass: 2.4.11, 2.5.7, 3.2.6, 3.3.7 and 3.3.8.
- Nothing loops forever: every animation stops within five seconds (WCAG 2.2.2), and only loading indicators keep turning. `motion.a11y.spec.ts` fails on any endless animation.
  - The one longer motion is the landing page's hero tour (SC-34, 16.9 s). It plays once, and carries Pause and Play. It also holds while the visitor has the camera or the hero is out of view.
  - The landing page's loader (SC-35) is a loading indicator: it moves only while the page, or a new theme's plates, load.
  - The console's loader (SC-49), the route and its placeholders' green wash, is a loading indicator too: it moves only while a screen or tab is read. The Overview moves only when a reading changes something, and Pause updates stops the readings.
  - The console's splash (SC-51, `design3/console/splash.js`) is a loading indicator: it covers the first load, signing in and signing out only while their reads are out, and leaves once the page behind it is drawn.
- Measure text contrast against the background it actually sits on, including fills, tinted chips and chat bubbles, after any opacity.

**Data and assets**

- Every company, person and figure is fictional.
  - Figures come from `docs/dobara-journey-map.html`.
  - Every money figure is computed in `design3/core/money.js`.
  - Illustrative splits are labelled as illustrative.
- The platform's own landing page names no client: no name, product, person, workspace address or batch id (SC-28).
  - Munchly Foods is a client; its details belong in its workspace, the demo and the console.
  - The landing page tells one illustrative batch, and its showcase API carries no client details.
- Every generated image or clip ships with a `.prompt.json` sidecar recording its model, seed, prompt and post-processing. PNG originals stay local in `src/` folders; only the WebP ships.
- Third-party Claude Code components are recorded in `.claude/third-party.md`. Read a component before using it; installing one needs the maintainer's yes.

## Tooling

### Configured in this repo

| Kind | Name | Where | Use |
| --- | --- | --- | --- |
| MCP server | `chrome-devtools` (chrome-devtools-mcp 1.10.1, usage statistics off) | `.mcp.json` | Lighthouse accessibility audits, accessibility-tree snapshots, CSS inspection. Claude Code asks once before starting it. |
| Agent | `accessibility-tester` | `.claude/agents/` | WCAG 2.2 AA audits: automated scans, then a manual checklist. |
| Skill | `accessibility` | `.claude/skills/` | WCAG guidance, with `references/WCAG.md`. |
| Skill | `web-quality-audit` | `.claude/skills/` | Page quality audit. `scripts/analyze.sh` works on single HTML files only. |
| Skill | `web-design-guidelines` | `.claude/skills/` | Reviews UI against Vercel's Web Interface Guidelines. |
| Skill | `design-first` | `.claude/skills/` | Design before code: which design tool leads for each surface (motion prototyped in Framer Motion; the Svelte build ships it with `motion` and the same springs), the review board on the surface's Claude Design project, building only after the maintainer's yes (SC-26), and porting into `frontend/` (SC-27). |
| Hook | `design-first-reminder` | `.claude/hooks/`, registered in `.claude/settings.json` | A `UserPromptSubmit` hook. When a request reads like a UI or UX change, it adds the design-first rule to the agent's context; otherwise it stays silent. Needs `jq` (SC-26). |
| Skill | `browser-suites` | `.claude/skills/` | The e2e, parity and a11y suites, which run only when the maintainer explicitly asks (SC-55): what counts as an ask, what each suite needs first, the commands, and how to report. |
| Hook | `ask-before-suites` | `.claude/hooks/`, registered in `.claude/settings.json` | A `PreToolUse` hook on Bash. A command that would run the e2e, parity or a11y suite, Playwright, or the live e2e script becomes a permission prompt; every other command passes. Needs `jq` (SC-55). |
| Config | jira-flow | `.claude/jira-flow.json`, `.claude/jira/taxonomy.md` | Jira project SC: site, issue types, transition ids, branch, commit and PR patterns, and ship rules. |
| Config | Preview servers | `.claude/launch.json` | <ul><li>`voice-recorder`: `video/recorder/server.py` on 8765;</li><li>`frontend-admin`: the frontend's dev server on 5173;</li><li>`frontend-preview`: its build on 4173 (restart it after a rebuild: its file list is read at start);</li><li>`frontend-console`: the console's dev server on 5174;</li><li>`frontend-console-preview`: its build on 4176 (restart it after a rebuild);</li><li>`design3`: design3 on 8787;</li><li>`backend-api`: the API on 8000 (`backend-api/scripts/dev.sh`).</li></ul> |
| Tests | Accessibility suite | `design3/a11y/` | Playwright 1.63 with @axe-core/playwright 4.13. |
| CI | GitHub Actions | `.github/workflows/ci.yml` | The frontend gate, the infra gate and the build on every pull request; the deploy from `main` through the `prod` environment and Workload Identity Federation (SC-40). |
| Config | Terraform | `infra/` | Terraform 1.9 or later with `hashicorp/google` and `google-beta` 8.5, and `integrations/github` 6.13, locked for macOS and Linux. State in GCS; credentials from application-default credentials, or a token borrowed from `gcloud`. firebase-tools 15.32.1 for releases, through `npx`. |
| Tests | Backend suite | `backend-api/tests/` | pytest 9 with httpx against a real PostgreSQL 18 (`smart_clearance_test`; a `postgres:18` service in CI): the frontend's contract tests ported, the rules against `platform.js`'s fixtures, roles, the append-only audit log, the synthetic world. |
| Tests | Frontend suites | `frontend/` | Vitest 5 (unit, drift, seed and coverage, the console's rules against `platform.js`); Playwright 1.63 with @axe-core/playwright 4.13 (e2e, each app); pixelmatch (parity with design3, each app). |

The agent, the three skills and the MCP entry came from the [aitmpl.com](https://www.aitmpl.com) catalog (SC-17).

### On the maintainer's machine (user scope)

These are not in the repo; install your own to match.

**Plugins**

| Plugin | Version | Source | What it adds | Used for |
| --- | --- | --- | --- | --- |
| impeccable | 4.4.0 | `pbakaus/impeccable` | <ul><li>The `impeccable` design skill.</li><li>Four agents: `impeccable-finish-reviewer`, `impeccable-documenter`, `impeccable-asset-producer`, `impeccable-manual-edit-applier`.</li><li>A design-detector hook that reviews UI edits.</li></ul> | Design v3, `PRODUCT.md` and `DESIGN.md`. Its local state lives in `.impeccable/`, which is gitignored. |
| jira-flow | 0.1.1 | `duttaarun/jira-flow-plugin` | <ul><li>Skills: `init`, `plan`, `work`, `track`, `bug`, `status`, `pr`, `ship`.</li><li>The hooks listed below.</li></ul> | Every SC ticket. |
| qwen-image-bf16 | 0.2.0 | A local marketplace | Qwen-Image 2.1 (bf16) image generation and editing, run locally; skill `qwengen-bf16`. | The 3D renders in `design3/system/img/`. |
| ltx-video | 0.2.0 | `duttaarun/ltx-video-plugin` | LTX 2.5 Fast video clips through LTX Desktop, run locally; skills `ltx-clip`, `ltx-init`. | The carton loop in `design3/system/media/`. |
| threeui-community | 0.1.0 | A local marketplace, `~/projects/threeui-community-plugin` (`threeui-community-local`) | <ul><li>The `threeui` MCP server: `search_catalog`, `get_catalog_item`, `get_item_source`, `get_license`.</li><li>It reads a copy of ThreeUI's free Community catalog (MIT, github.com/MengTo/threeui), pinned in `~/threeui-community` by the plugin's `scripts/setup.sh`.</li><li>Skill `threeui`.</li></ul> | Canvas, WebGL and Three.js effects to adapt in design work (SC-30's options 1 and 2 adapted two). No account is needed; ThreeUI's own MCP server is for Pro members only (SC-31). |

**Hooks** (all from jira-flow)

| Hook | When it runs | What it does |
| --- | --- | --- |
| `ask-before-ship` | Before shell commands, GitHub MCP calls and Jira transitions | Turns raising a PR, merging, and moving an issue to Done into a permission prompt. |
| `guard-key` | Before shell commands | Refuses `git commit`, `git push` and `gh pr create` unless the branch or the command carries an SC key. Never commits to or pushes from `main`. |
| `jira-link` | After Jira changes | Prints the issue's link. |
| `session-context` | At session start | Says which issue the branch carries and whether a story is mid-flow. |

**Skills**

| Skill | From | Use |
| --- | --- | --- |
| `aitmpl` | User skill | Searches the aitmpl.com catalog when a skill, agent, MCP server or hook is missing. Read-only; it prints install lines but never runs them. |
| `dataviz` | Bundled with Claude Code | Chart method and colour-palette validation. |
| `ui-ux-pro-max` | User skill, with its companions `design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides` | UX rules by priority (accessibility, touch, layout, forms) and a search script for them (`scripts/search.py --domain ux`). Leads with impeccable on app, demo and console screens. |
| `design-taste-frontend` | User skill, with `high-end-visual-design`, `minimalist-ui`, `redesign-existing-projects`, `industrial-brutalist-ui`, `full-output-enforcement` | Guards against templated landing pages. By its own note, for landing pages and redesigns, not product screens; `redesign-existing-projects` audits a screen that exists. |

**MCP servers**

| Server | Transport | Use here |
| --- | --- | --- |
| `atlassian` | Remote (Atlassian) | Jira project SC. |
| `claude-design` | Remote (Anthropic) | The hosted design system, demo and app pages. |
| `playwright` | `npx @playwright/mcp` | Driving and screenshotting pages during design work. |
| `github` | Remote (GitHub) | Configured, but failing to authenticate. The `gh` CLI is the working route. |
| `gcloud` | `npx @google-cloud/gcloud-mcp` | Google Cloud for the planned build. Unused so far. |
| `threeui` | stdio, from the `threeui-community` plugin | The ThreeUI Community catalog: read-only, from the local copy. |

From the Claude desktop app:

- Slack, through the `design` plugin's Slack server, for #smart-clearance.
- The built-in browser and Claude in Chrome, for previews.
- Artifacts, for publishing pages on claude.ai.

## Where things live

- **Code:** [aibuilder2026/smart-clearance](https://github.com/aibuilder2026/smart-clearance) (public).
- **Jira:** project SC on [duttaarun2015.atlassian.net](https://duttaarun2015.atlassian.net). Issue links take the form `/browse/SC-<n>`.
- **Slack:** #smart-clearance (private), channel id `C0C675VAFFY`.
- **Google Cloud:** project `aibuilder-510213` (AIBuilder), on billing account `012B20-D65DBD-FBAC0E`, with Terraform's state in `gs://aibuilder-510213-tfstate` (SC-39).
- **The live apps (Firebase Hosting, SC-39):** the landing page at [smartclearance.web.app](https://smartclearance.web.app), the staff console at [smartclearance-console.web.app](https://smartclearance-console.web.app).
- **Hosted pages (Claude Design):**
  - [design system](https://claude.ai/design/p/909d23bb-bd3c-466b-abf8-4eccc7c5881e?file=Smart-Clearance+DS+v3.html)
  - [guided demo](https://claude.ai/design/p/8294ec70-3e6b-4359-8de6-2a3fd056c3b2?file=Smart-Clearance+demo+v3.html)
  - [app](https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=Smart-Clearance+app+v3.html)
  - [landing page](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+site+v3.html)
  - [console](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+console+v3.html)
- **Pinned claude.ai artifacts:**
  - [Story](https://claude.ai/artifact/CkH7tpXgYLhs2hBmfhf9SZ)
  - [Journey Map](https://claude.ai/artifact/MacqAdWi87YYY4ADpRyJSh)
  - [Tech Stack](https://claude.ai/artifact/3Duw1kHUoUvXXCaPSavi92)
  - [walkthrough](https://claude.ai/artifact/JaE7HRc3YFpNNJEhxT7gzH)
  - [DS v3](https://claude.ai/artifact/8UuDNC17hMqBnSSmzhQyWx)
  - [demo v3](https://claude.ai/artifact/Xy49Vw8owe5moZBvXPAf3e)
  - [app v3](https://claude.ai/artifact/YHSwoQHc2JbBWVQtuGQzgm)

## Known gaps

- The jira-flow gates cover `frontend/` (lint, type check, unit tests) and `infra/` (`terraform fmt` and `validate`, the scripts' syntax; no plan, since that needs credentials), and `backend-api/` (ruff, and pytest on a real Postgres), and CI runs all three on every pull request with a secret scan. The `agents/` gate waits for code. Nothing gates `design3/`, or the frontend's e2e and parity suites: they run only when the maintainer asks (the `browser-suites` skill).
- The frontend's Firefox smoke run could not be started in the agent's sandboxed shell; when the e2e suite is asked for, run it on a normal machine to cover Firefox.
- The hosted pages on Claude Design still run on the mocks; the deployed apps read backend-api on Cloud Run from their first deploy after SC-50. Locally, `backend-api/scripts/console-env.sh` points both apps at the local API.
- Local development and prod share one Firebase user pool, so the same accounts sign in to both.
- Cloud Run scales to zero: the first request after a quiet spell waits a few seconds. Cloud SQL is `db-f1-micro`, a shared core without an SLA.
- `frontend/console` runs on its in-browser mock: sign-in is a stand-in for Google and a passkey, changes stay in that browser (`sc-console`), and two fictional demo requests stand in for the landing page's. Both apps are live on Firebase Hosting's own addresses (SC-39), with no custom domain yet.
- The landing page ships about 139 kB of JavaScript, gzipped (`frontend/README.md`, Known gaps).
- The landing page's hero draws its town in WebGL2; where WebGL2 is missing it draws the plate flat, without depth.
- In design3 the loader's styles come with the page's stylesheets, so on a slow connection its first paint waits for them (the Google Fonts import included). The SvelteKit build puts the loader first in the prerendered page.
- `.claude/jira-flow.json` names `.github/pull_request_template.md`, which is not in the repo.
- Terraform runs from a workstation, as a person: CI checks the configuration but never plans or applies.
- The `chrome-devtools` MCP server starts only in a new session, after a one-time approval.
- The WCAG 2.2 criteria axe cannot check are untested.
- The console edits its own browser store (`core/platform.js`, seeded from the app's data). The app's workspace doesn't read the console's changes yet.
- The landing page's Book a demo saves its request in the browser store, where the console lists it; nothing is sent anywhere.
- `npm test` in `design3/a11y` covers the landing page and the console too (`site.a11y.spec.ts`, `console.a11y.spec.ts`).
