# @smart-clearance/console

The staff console (console.smartclearance.com), in SvelteKit 3: where Smart-Clearance's own staff set up and run each
manufacturer's workspace, its agents, supply chain, channels and rules, people, integrations and plan. It is a faithful
port of `design3/console` (SC-25's approved design, hosted in platform v3), built and deployed on its own, apart from
the landing page (`../admin`).

There is no backend yet: the console talks to a typed API whose in-browser mock holds the prototype's platform
(`@smart-clearance/api/console`). Set `PUBLIC_API_BASE` and the same calls go to backend-api over HTTP.

```sh
cd frontend
corepack pnpm dev:console        # http://localhost:5174
corepack pnpm build:console      # the static app, into console/build/
corepack pnpm preview:console    # serves the build on :4176
```

In the mock, sign in with either staff account (Neha Kulkarni, a super admin, or Sameer Rao, a platform engineer):
Continue with Google or Use a passkey, choose the account, then Use passkey. Account → Reset prototype data puts the
mock back at its seed.

## Routes

The prototype keeps its routes in the hash (`#/clients/munchly/agents`); the console keeps them in the path, so every
place has a real address.

| Route                 | Screen                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                   | Overview: batches on the move, agent runs today, what needs attention, demo requests                     |
| `/clients`            | every client: a sortable table, a list on phones                                                         |
| `/clients/[id]/[tab]` | one client, by tab: `agents` (the default), `supply`, `rules`, `people`, `integrations`, `plan`, `audit` |
| `/new-client`         | the setup flow, seven steps; `?request=<id>` starts it from a demo request                               |
| `/agents`             | the agents every workspace runs, and each client's autonomy                                              |
| `/connectors`         | what a workspace can connect to, and who uses each                                                       |
| `/plans`              | the plans, and the clients on each                                                                       |
| `/staff`              | the console's own staff, and inviting a colleague                                                        |
| `/audit`              | the audit log, everything or one client's                                                                |

Until a staff member is signed in, every route shows the sign-in in place, and the address is kept for after it.

## How it is built

- **Client-side only.** The root layout sets `ssr = false`: the console is behind a sign-in, so nothing is rendered on a
  server or prerendered. `adapter-static` writes the app and its `index.html` fallback; the host rewrites every path to
  it (`../firebase.json`).
- **The shell** is core's `Shell` (a sidebar on desktops, a rail on tablets, a tab bar on phones), whose places are
  links. The screens scroll inside `#main`, as the prototype's do; each new screen fades in and starts at its top.
- **Screens** are in `src/lib/screens/`: `App` (the sign-in or the shell), `SignIn`, `AccountSheet`, `Screen` (core's
  `Page` with the appearance menu), and the client's tabs in `client/`. The routes in `src/routes/` hold the screens
  that are one page each.
- **Data:** TanStack Query over `src/lib/api/client.ts`. Each route's `load` fills the cache before the screen draws
  (`prefetch` in `queries.ts`), so a screen opens with its data. A change goes through `act()` on the console's
  context (`src/lib/console.svelte.ts`): it calls the API, refreshes everything under `['console']`, and confirms in a
  toast, or says what went wrong.
- **The platform's rules** (what a supply-chain profile switches on, the presets, the line under each agent, what an
  invitation or the setup flow accepts) come from `@smart-clearance/api/console`, the same functions the mock applies.
  The setup flow previews with them; the server has the last word.

### Shared, not copied

| What                                                                                                                                 | Where                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Design-system components: Shell, Page, DataTable, Empty, Progress, Alert, NoticeHost (toasts), Tracker, TrackerCompact, and the rest | `@smart-clearance/core`                                             |
| Columns and SectionTitle (`design3/screens/common.jsx`), FindWorkspace                                                               | `@smart-clearance/core`, `patterns/`                                |
| `screens.css` (`design3/screens/screens.css`: the sign-in, the supply-chain strip)                                                   | `@smart-clearance/core/styles/screens.css`                          |
| The API contract, HTTP transport, mocks and seed                                                                                     | `@smart-clearance/api`                                              |
| The HTML shell (`src/app.html`, the theme before the first paint)                                                                    | the same file as admin's, held equal by `tests/unit/shared.test.ts` |
| The cascade (`src/app.css`)                                                                                                          | admin's, plus `screens.css`, held equal by the same test            |
| The axe scan and the pixel compare of the test suites                                                                                | `@smart-clearance/testing`                                          |

`src/lib/console.css` is the console's own stylesheet, design3's verbatim (the same test checks it).

### Fixed from the prototype, none of it visible

| The prototype                                                                    | Here                                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| routes in the hash                                                               | real paths; the sidebar and tab bar are links                        |
| a table row opened by mouse only                                                 | a row is focusable and opens with Enter                              |
| `window.open(…, 'noopener')`'s fallback also navigated the tab                   | Open the workspace is a menu link in a new tab                       |
| a number setting was clamped on every keystroke, so 45 could not be typed from 4 | it is clamped once it is entered                                     |
| the screens wrote the audit lines                                                | the API writes them, in the signed-in staff member's name            |
| a demo request reached the console through the same browser's storage            | the console lists the API's demo requests (the mock starts with two) |

## Environment

Declared in `src/env.ts`, public and inlined at build time. Copy `.env.example` to `.env`.

| Variable                 | Default                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `PUBLIC_API_BASE`        | unset: the in-browser mock                                                       |
| `PUBLIC_MOCK_LATENCY_MS` | 0                                                                                |
| `PUBLIC_SITE_URL`        | the hosted landing page on Claude Design (the sign-in's smartclearance.com link) |
| `PUBLIC_APP_URL`         | Munchly Foods' hosted workspace on Claude Design                                 |

## Deploying on its own subdomain

The build is plain static files: `console/build/`. `../firebase.json` gives Firebase Hosting two targets, `site` (the
landing page, `admin/build`) and `console` (this app, every path rewritten to `index.html`, `noindex`, immutable
caching for `/_app/immutable/`). Terraform in `../../infra` makes the console's own Hosting site,
`smartclearance-console` (SC-39). From the repository root, each deploy is:

```sh
infra/scripts/deploy.sh console     # builds the console, then releases it to its site
```

For `console.smartclearance.com`, set the site's `custom_domain` in `infra/prod/terraform.tfvars` and apply. Then
add the DNS records Terraform outputs (`../../infra/README.md`, Custom domains). Any static host works the same way, as
long as it rewrites unknown paths to `/index.html`.

## Size

The build ships about 168 kB of JavaScript, gzipped, across every route (31 files); the largest share is core with
bits-ui and its floating-ui layer, as on the landing page.

## Tests

| Suite                   | Command                     | What                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit (Vitest)           | `corepack pnpm test`        | `console.css` against design3; `app.html` and the cascade against admin's                                                                                                                                                                                                                                                                        |
| End to end (Playwright) | `corepack pnpm test:e2e`    | axe-core WCAG 2.2 AA in five projects (1440 light and dark, 820, 390 light and dark): the sign-in and its sheets, every screen, an agent's settings, a menu and its alert, each step of the setup flow; keyboard (sheets, alerts, menus, links, rows); motion (nothing loops); the console's flows against the mock; smoke in Firefox and WebKit |
| Parity                  | `corepack pnpm test:parity` | every screen and the sign-in against `design3/console`, pixel by pixel, in five projects                                                                                                                                                                                                                                                         |

The mock's rules and audit lines are tested in `@smart-clearance/api`, against `design3/core/platform.js` itself.

**Parity tolerances:** 0.3% a screen, 0.5% for the supply chain. Measured on 5 Oct 2026: at most 0.09%, and 0.27% for the
supply chain on a phone. The differences are text rasterised from Google Fonts in the prototype against the same faces
self-hosted, and the icons Lucide 1.51 draws differently from the prototype's 0.468.
