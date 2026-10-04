# frontend

Smart-Clearance's web frontend, in SvelteKit. It is a pnpm workspace with two packages:

| Package                                                | What it is                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`core/`](core/README.md) (`@smart-clearance/core`)    | Design system v3 in Svelte 5: the tokens and component CSS ported from `design3/system`, and the components. Every UI piece the apps share lives here. |
| [`admin/`](admin/README.md) (`@smart-clearance/admin`) | The platform's own site, a SvelteKit app. It serves the smartclearance.com landing page today; the staff console joins it later.                       |

The Python services are beside it: [`../backend-api/`](../backend-api/README.md) and [`../agents/`](../agents/README.md).

`design3/` stays the source of truth for every design. The frontend implements it: a design change is made and reviewed in design3 first (the design-first skill), then ported here. Tests hold the port to design3 (see [Kept in step with design3](#kept-in-step-with-design3)).

## Stack

| Area       | Choice                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Framework  | SvelteKit 3, Svelte 5 (runes), Vite 8                                                                          |
| Language   | TypeScript 6.0, Node 22.17 or later                                                                            |
| Output     | `adapter-static`: `/` is prerendered with its data; any other route is a client-side page served by `200.html` |
| Styling    | design system v3's own CSS, with Tailwind 4's theme and utilities over its tokens (no Tailwind preflight)      |
| Primitives | bits-ui 2 for the menu and the sheet (the headless layer under shadcn-svelte)                                  |
| Icons      | Lucide, by the design system's own icon names                                                                  |
| Data       | TanStack Query 6 over a typed API: an in-browser mock seeded from design3 now, `backend-api` later             |
| Motion     | `motion` (motion.dev) and Svelte transitions, with the prototype's springs and eases                           |
| Fonts      | Fontsource variable fonts: Bricolage Grotesque (opsz, wdth, wght), Geist, Geist Mono, Noto Sans Devanagari     |
| Tests      | Vitest; Playwright with axe-core; pixelmatch for parity                                                        |
| Lint       | ESLint 10, Prettier 3                                                                                          |

## Setup

pnpm comes through corepack, which Node ships; nothing is installed globally.

```sh
cd frontend
corepack pnpm install
corepack pnpm dev                 # the admin app on http://localhost:5173 (/ and /ds)
```

The first `corepack pnpm` call downloads the pinned pnpm (`packageManager` in `package.json`). pnpm 12 refuses a package published in the last day; let it pick the version before.

## Commands

Run them from `frontend/`.

| Command                     | What it does                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm dev`         | The admin app's dev server, :5173                                                                                                               |
| `corepack pnpm build`       | The static site, into `admin/build/`                                                                                                            |
| `corepack pnpm preview`     | Serves the build, :4173                                                                                                                         |
| `corepack pnpm lint`        | ESLint and Prettier                                                                                                                             |
| `corepack pnpm check`       | svelte-check in both packages, warnings fail                                                                                                    |
| `corepack pnpm test`        | The seed and icon checks, then both packages' unit tests                                                                                        |
| `corepack pnpm test:e2e`    | Builds with the dev routes on, then the Playwright suite: WCAG 2.2 AA in five projects, keyboard, motion, and the Firefox and WebKit smoke runs |
| `corepack pnpm test:parity` | Builds, then compares the build with the prototype pixel by pixel; serves design3 on :8790                                                      |
| `corepack pnpm seed`        | Regenerates `admin/src/lib/seed/` from `design3/core`                                                                                           |
| `corepack pnpm icons`       | Regenerates `core/src/lib/icons/registry.ts` from `design3/system/icons.js`                                                                     |
| `corepack pnpm format`      | Prettier, writing                                                                                                                               |

The gate jira-flow runs for a change under `frontend/` is `corepack pnpm lint && corepack pnpm check && corepack pnpm test`. The e2e and parity suites need browsers (`corepack pnpm --filter @smart-clearance/admin exec playwright install chromium firefox webkit`) and run on their own.

## The cascade

`admin/src/app.css` sets the order once:

1. Tailwind's theme (`@layer theme`).
2. `tokens.css`, unlayered, as in the prototype.
3. `fonts.css`: the Fontsource faces, and the type tokens restated with their names.
4. `base.css` in `@layer base`, so its element resets never beat a utility.
5. `components.css`, unlayered, as in the prototype.
6. Tailwind's utilities (`@layer utilities`) and core's `tailwind.css` (the token mapping).

A page's own stylesheet (the landing page's `site.css`) loads after these, unlayered. So the prototype's specificity between `components.css` and `site.css` holds exactly. A Tailwind utility cannot override a design-system class (unlayered beats layered); use `!` (`h-12!`) where one must.

## Kept in step with design3

| What                                                          | Check                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `core/src/styles/{tokens,base,components}.css`                | equal to `design3/system/*.css` outside marked `/* @port … @port-end */` blocks (`core/tests/drift.test.ts`)                |
| `admin/src/lib/landing/site.css`, `admin/src/lib/ds/docs.css` | equal to `design3/site/site.css` (two marked changes) and `design3/system/docs.css` (`admin/tests/unit/drift.test.ts`)      |
| Every figure                                                  | the seed runs `design3/core/money.js`; `seed:check` fails when design3 changes and the seed was not regenerated             |
| `fmt`                                                         | identical strings to `money.js`'s `fmt` (`core/tests/format.test.ts`)                                                       |
| Icons                                                         | every name in `design3/system/icons.js`, in its order (`icons:check`, `core/tests/icons.test.ts`)                           |
| Components                                                    | every export of the prototype's kit is built in core or planned (`core/src/lib/coverage.ts`, `core/tests/coverage.test.ts`) |
| The pages                                                     | the parity suite compares them with the prototype pixel by pixel                                                            |

Never edit the generated files (`admin/src/lib/seed/*`, `core/src/lib/icons/registry.ts`) or the verbatim ones; regenerate or re-port them. Images are referenced in place in design3 and hashed into the build, never copied.

## Where this departs from the Tech Stack doc

`docs/smart-clearance-tech-stack.html` plans the web app as `web/`. Here:

- **`frontend/`, not `web/`,** with the design system as its own package (`core`) and the platform site as `admin`. The client workspace app will be a third package.
- **`200.html`, not `index.html`, as the fallback.** The prerendered landing page is `index.html`. Firebase Hosting rewrites unknown paths to `/200.html`.
- **bits-ui directly, without the shadcn-svelte CLI.** Its components are styled by design system v3's CSS, not shadcn's.
- **TanStack Query** carries the data, so the prerendered page and the client share one cache, and the mock can become HTTP without touching a component.
- **`motion`** (motion.dev, by framer-motion's authors) replaces framer-motion, which is React-only.
- **SvelteKit 3:** config lives in `vite.config.ts` (`sveltekit({...})`); `#lib/...` subpath imports replace `$lib` (write the `.ts` extension: TypeScript does not add it); environment variables are declared in `admin/src/env.ts` and read from `$app/env/public`.

## Known gaps

- The Firefox smoke run could not be run in the agent's sandboxed shell (Firefox cannot start there); WebKit and Chromium were. Run `corepack pnpm test:e2e` on a normal machine to cover it.
- The landing page ships about 128 kB of JavaScript (gzip). bits-ui and its floating-ui layer are about 30 kB of that and the icon registry about 9 kB. A leaner menu and sheet, or a per-route icon registry, would cut it.
- Demo requests stay in the browser (`localStorage`, `sc-demo-requests`) until `backend-api` takes them; the hosted console does not see them.
- The console and the client workspace app are not ported yet. `core/src/lib/coverage.ts` lists the design-system pieces waiting for them.
