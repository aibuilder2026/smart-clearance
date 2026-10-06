# frontend

Smart-Clearance's web frontend, in SvelteKit. It is a pnpm workspace: two apps, each built and deployed on its own,
over three shared packages.

| Package                                                      | What it is                                                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`admin/`](admin/README.md) (`@smart-clearance/admin`)       | The platform's own site: the smartclearance.com landing page, prerendered, and `/ds`.                                                                                       |
| [`console/`](console/README.md) (`@smart-clearance/console`) | The staff console, console.smartclearance.com: a client-side app behind a staff sign-in, where each manufacturer's workspace is set up and run (SC-37).                     |
| [`core/`](core/README.md) (`@smart-clearance/core`)          | Design system v3 in Svelte 5: the tokens, component and screen CSS ported from design3, and the components. Every UI piece the apps share lives here.                       |
| [`api/`](api/README.md) (`@smart-clearance/api`)             | The frontend's side of backend-api: the contract, the HTTP transport, and an in-browser mock of each app's calls, seeded from design3. Each app imports only its own entry. |
| [`testing/`](testing/README.md) (`@smart-clearance/testing`) | What the apps' Playwright suites share: design3/a11y's axe scan and report, and the pixel compare of the parity suites.                                                     |

What the two apps share is shared, not copied: components and CSS through `core`, the contract and mocks through `api`,
test helpers through `testing`. The one file each app must keep for itself, `src/app.html`, is the same file in both,
and a test holds it so (`console/tests/unit/shared.test.ts`), as it holds the console's cascade to admin's.

The Python services are beside it: [`../backend-api/`](../backend-api/README.md) and [`../agents/`](../agents/README.md).

`design3/` stays the source of truth for every design. The frontend implements it: a design change is made and reviewed in design3 first (the design-first skill), then ported here. Tests hold the port to design3 (see [Kept in step with design3](#kept-in-step-with-design3)).

## Stack

| Area       | Choice                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework  | SvelteKit 3, Svelte 5 (runes), Vite 8                                                                                       |
| Language   | TypeScript 6.0, Node 22.17 or later                                                                                         |
| Output     | `adapter-static`: `/` is prerendered with its data; any other route is a client-side page served by `200.html`              |
| Styling    | design system v3's own CSS, with Tailwind 4's theme and utilities over its tokens (no Tailwind preflight)                   |
| Primitives | bits-ui 2 for the menu and the sheet (the headless layer under shadcn-svelte)                                               |
| Icons      | Lucide, by the design system's own icon names                                                                               |
| Data       | TanStack Query 6 over a typed API: `backend-api` when `PUBLIC_API_BASE` is set, else an in-browser mock seeded from design3 |
| Motion     | `motion` (motion.dev) and Svelte transitions, with the prototype's springs and eases                                        |
| Fonts      | Fontsource variable fonts: Bricolage Grotesque (opsz, wdth, wght), Geist, Geist Mono, Noto Sans Devanagari                  |
| Tests      | Vitest; Playwright with axe-core; pixelmatch for parity                                                                     |
| Lint       | ESLint 10, Prettier 3                                                                                                       |

## Setup

pnpm comes through corepack, which Node ships; nothing is installed globally.

```sh
cd frontend
corepack pnpm install
corepack pnpm dev                 # the landing page on http://localhost:5173 (/ and /ds)
corepack pnpm dev:console         # the console on http://localhost:5174
```

The first `corepack pnpm` call downloads the pinned pnpm (`packageManager` in `package.json`). pnpm 12 refuses a package published in the last day; let it pick the version before.

### On the real API, locally (SC-46)

Without `PUBLIC_API_BASE` both apps run on their in-browser mocks. To run them end to end against `backend-api` on this
machine (its Postgres, and the project's Firebase Authentication):

```sh
backend-api/scripts/dev.sh                     # the API on :8000 (once backend-api/scripts/bootstrap.sh has run)
backend-api/scripts/console-env.sh             # writes console/.env.local and admin/.env.local (git-ignored)
corepack pnpm dev & corepack pnpm dev:console  # restart them after the .env.local changes
backend-api/scripts/default-password.sh --copy # the password every account starts on
backend-api/scripts/e2e.sh                     # the live suite: Book a demo → sign-in → a new client → the audit log
```

Staff sign in with their email and the default password (for example `neha.kulkarni@smartclearance.example`).
`console/.env.local` also carries the console's Firebase web config (`PUBLIC_FIREBASE_*`, public by design, from
Terraform's `console_firebase_config` output). The e2e and parity suites run on the mocks: run them with
`PUBLIC_API_BASE=` set empty while an `.env.local` points at the API.

## Commands

Run them from `frontend/`.

| Command                     | What it does                                                                                                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm dev`         | The landing page's dev server, :5173 (`dev:console`: the console's, :5174)                                                                                                                          |
| `corepack pnpm build`       | Both static apps, into `admin/build/` and `console/build/` (`build:admin`, `build:console`: one of them)                                                                                            |
| `corepack pnpm preview`     | Serves the landing page's build, :4173 (`preview:console`: the console's, :4176)                                                                                                                    |
| `corepack pnpm lint`        | ESLint and Prettier                                                                                                                                                                                 |
| `corepack pnpm check`       | svelte-check or tsc in every package, warnings fail                                                                                                                                                 |
| `corepack pnpm test`        | The seed and icon checks, then every package's unit tests                                                                                                                                           |
| `corepack pnpm test:e2e`    | Each app's build, then its Playwright suite: WCAG 2.2 AA in five projects, keyboard, motion, the console's flows, the Firefox and WebKit smoke runs (`test:e2e:admin`, `test:e2e:console`: one app) |
| `corepack pnpm test:parity` | Each app's build compared with its prototype pixel by pixel; serves design3 on :8790 (`test:parity:admin`, `test:parity:console`)                                                                   |
| `corepack pnpm seed`        | Regenerates `api/src/seed/` and `admin/src/lib/seed/` from `design3/core`                                                                                                                           |
| `corepack pnpm icons`       | Regenerates `core/src/lib/icons/registry.ts` from `design3/system/icons.js`                                                                                                                         |
| `corepack pnpm format`      | Prettier, writing                                                                                                                                                                                   |

The gate jira-flow runs for a change under `frontend/` is `corepack pnpm lint && corepack pnpm check && corepack pnpm test`. The e2e and parity suites need browsers (`corepack pnpm --filter @smart-clearance/admin exec playwright install chromium firefox webkit`, once for both apps) and run on their own.

## Deploying

Each app is a static build, deployed on its own host name. `firebase.json` gives Firebase Hosting (the Tech Stack's
choice) two targets:

| Target    | Build           | Host name                  | Unknown paths |
| --------- | --------------- | -------------------------- | ------------- |
| `site`    | `admin/build`   | smartclearance.com         | `/200.html`   |
| `console` | `console/build` | console.smartclearance.com | `/index.html` |

Both cache `/_app/immutable/` for a year and everything else with `no-cache`; the console's pages also carry
`noindex`. Terraform in `../infra` makes a Hosting site for each target (SC-39). From the repository root,
`infra/scripts/deploy.sh` builds both apps and releases them (`deploy.sh site` or `deploy.sh console` for one). CI
does the same on every merge to `main` that touches the frontend (`.github/workflows/ci.yml`, SC-40). It
writes `.firebaserc` from Terraform's outputs on each run, so that file is not committed. `../infra/README.md` has
the sites, their addresses and the prerequisites.

## The cascade

`admin/src/app.css` sets the order once:

1. Tailwind's theme (`@layer theme`).
2. `tokens.css`, unlayered, as in the prototype.
3. `fonts.css`: the Fontsource faces, and the type tokens restated with their names.
4. `base.css` in `@layer base`, so its element resets never beat a utility.
5. `components.css`, unlayered, as in the prototype.
6. Tailwind's utilities (`@layer utilities`) and core's `tailwind.css` (the token mapping).

A page's own stylesheet (the landing page's `site.css`) loads after these, unlayered. The console's `app.css` is the same
cascade with core's `screens.css` after `components.css`, and its own `console.css` loads after it all, as design3/console
loads them. So the prototype's specificity between `components.css` and `site.css` holds exactly. A Tailwind utility cannot override a design-system class (unlayered beats layered); use `!` (`h-12!`) where one must.

## Kept in step with design3

| What                                                          | Check                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `core/src/styles/{tokens,base,components}.css`                | equal to `design3/system/*.css` outside marked `/* @port … @port-end */` blocks (`core/tests/drift.test.ts`)                |
| `core/src/styles/screens.css`                                 | equal to `design3/screens/screens.css` (`core/tests/drift.test.ts`)                                                         |
| `admin/src/lib/landing/site.css`, `admin/src/lib/ds/docs.css` | equal to `design3/site/site.css` (one marked change) and `design3/system/docs.css` (`admin/tests/unit/drift.test.ts`)       |
| `console/src/lib/console.css`                                 | equal to `design3/console/console.css` (`console/tests/unit/shared.test.ts`)                                                |
| The console's splash                                          | `design3/console/splash.js`, inlined as it is into the console's page by `console/src/hooks.server.ts`, with its block of `console.css` (SC-51) |
| Every figure                                                  | the seed runs `design3/core/money.js`; `seed:check` fails when design3 changes and the seed was not regenerated             |
| The console's rules                                           | `api/src/console/platform.ts` gives `design3/core/platform.js`'s answers, run side by side (`api/tests/platform.test.ts`)   |
| `fmt`                                                         | identical strings to `money.js`'s `fmt` (`core/tests/format.test.ts`)                                                       |
| Icons                                                         | every name in `design3/system/icons.js`, in its order (`icons:check`, `core/tests/icons.test.ts`)                           |
| Components                                                    | every export of the prototype's kit is built in core or planned (`core/src/lib/coverage.ts`, `core/tests/coverage.test.ts`) |
| The pages                                                     | each app's parity suite compares it with its prototype pixel by pixel                                                       |

Never edit the generated files (`api/src/seed/*`, `admin/src/lib/seed/*`, `core/src/lib/icons/registry.ts`) or the verbatim ones; regenerate or re-port them. Images are referenced in place in design3 and hashed into the build, never copied.

## Where this departs from the Tech Stack doc

`docs/smart-clearance-tech-stack.html` plans the web app as `web/`. Here:

- **`frontend/`, not `web/`,** with the design system as its own package (`core`), the platform site as `admin` and the staff console as `console`, each its own app. The client workspace app will be a third app.
- **`200.html`, not `index.html`, as the fallback.** The prerendered landing page is `index.html`. Firebase Hosting rewrites unknown paths to `/200.html`.
- **bits-ui directly, without the shadcn-svelte CLI.** Its components are styled by design system v3's CSS, not shadcn's.
- **TanStack Query** carries the data, so the prerendered page and the client share one cache, and the mock can become HTTP without touching a component.
- **`motion`** (motion.dev, by framer-motion's authors) replaces framer-motion, which is React-only.
- **SvelteKit 3:** config lives in `vite.config.ts` (`sveltekit({...})`); `#lib/...` subpath imports replace `$lib` (write the `.ts` extension: TypeScript does not add it); environment variables are declared in `admin/src/env.ts` and read from `$app/env/public`.

## Known gaps

- The Firefox smoke run could not be run in the agent's sandboxed shell (Firefox cannot start there); WebKit and Chromium were. Run `corepack pnpm test:e2e` on a normal machine to cover it.
- The landing page ships about 139 kB of JavaScript (gzip): about 128 kB before SC-32, and the hero's town adds about 11 kB net (its WebGL2 renderer, camera, gestures and graph). bits-ui and its floating-ui layer are about 30 kB of it and the icon registry about 9 kB. A leaner menu and sheet, or a per-route icon registry, would cut it.
- On the mock, demo requests stay in the browser (`localStorage`, `sc-demo-requests`); with `PUBLIC_API_BASE` they go to `backend-api`, and the console lists them. The hosted pages still run on the mocks, until backend-api runs in the cloud.
- The client workspace app is not ported yet. `core/src/lib/coverage.ts` lists the design-system pieces waiting for it.
- On its mock the console lets any active staff member's address in with any password, and its changes stay in the browser (`sc-console`); two fictional demo requests stand in for the landing page's. With `PUBLIC_API_BASE` it signs in with Firebase Authentication and reads and writes `backend-api`.
