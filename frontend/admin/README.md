# @smart-clearance/admin

The platform's own site, in SvelteKit 3. Today it serves the smartclearance.com landing page, a faithful port of
`design3/site` (SC-25's approved design), and `/ds`, design system v3 as built in core. The staff console
(`design3/console`) joins it later.

## Routes

| Route | What                                                                    | Rendering                                                                                                    |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/`   | the landing page                                                        | prerendered with its data (`+page.ts`: `prerender = true`)                                                   |
| `/ds` | the design system page, laid out as the DS v3 page with its section ids | client-side, in the `(dev)` group: 404 unless the dev server runs it or the build sets `PUBLIC_DEV_ROUTES=1` |

The root layout makes the `QueryClient` and the theme. A client-only route group sets `ssr = false` in its own
`+layout.ts`: SvelteKit 3 drops the load function of a layout that exports `ssr = false` from the server build, so the
root layout cannot.

## The landing page

`src/lib/landing/` has one component per section of the prototype, with its classes, ids and accessible names:
`Nav`, `Hero` (with `HeroCard`), `Exits` (the street and the ledger), `Stops`, `Story`, `Workspace`, `Plans`, `Close`,
`Footer`, and the `DemoSheet`; `Site` puts them together. `figures.ts` works out every figure and line of copy from the
API's showcase and catalog, as `site.jsx` does from the prototype's globals.

**`site.css`** is design3's, unscoped and verbatim, apart from two marked changes:

1. **The window scrolls,** not `.site`: the address bar, find-in-page, `#top` and the section links behave as on any site.
2. **The street's pan is gated by CSS,** not by script, on desktops with motion allowed. The prerendered page already has
   the desktop layout, and the page's height never changes as it hydrates.

The bar's desktop, tablet and phone parts are all rendered and shown by CSS (`.desk-only`, `.not-phone`, `.phone-only`),
so the server renders every width.

**Plates** come from `design3/site/assets/plates` through `$design3` (a Vite alias). The hero is a `<picture>` whose
night source the browser picks before the page hydrates. Once hydrated, the reader's own choice of theme picks every plate.

**Motion,** with the prototype's numbers:

- `pan.ts` holds the street's keyframes (a hold and a move per exit over nine steps, zoom 1.8) and `motion`'s `scroll()` drives them;
- a chip's focus pans to its exit;
- below 1100 px the street is a strip that slides to the chip tapped;
- the hero card walks its stops once, in about 2.5 s, and holds.

**Fixed from the prototype,** none of it visible:

| The prototype                                                                     | Here                                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `#top` did not scroll (the page scrolled inside `.site`)                          | the window scrolls                                                                    |
| `window.open(…, 'noopener')` returns null, so its fallback also navigated the tab | real links with `target=_blank rel=noopener`; menu items that leave are links         |
| a dark page painted light first                                                   | `app.html` sets the theme before the first paint                                      |
| Enter did not send the demo form                                                  | its button is `type=submit form=bd-form`                                              |
| field errors were not tied to their fields                                        | `aria-describedby` and `aria-invalid`, and the first field with a problem takes focus |
| the islands strip was focusable where it does not scroll                          | focusable below 600 px only                                                           |
| section links ignored reduced motion                                              | they jump instead of gliding                                                          |
| "This page needs JavaScript"                                                      | the page renders without it                                                           |

## Data

The UI reads one typed API (`src/lib/api/`):

| Call                      | Endpoint                     | Mock                                                                     |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `showcase()`              | `GET /v1/site/showcase`      | `seed/showcase.json`: Munchly's batch, every figure computed by money.js |
| `catalog()`               | `GET /v1/platform/catalog`   | `seed/catalog.json`: the agents, connectors and plans                    |
| `lookupWorkspaces(query)` | `POST /v1/workspaces/lookup` | the prototype's rules over `seed/directory.json`                         |
| `requestDemo(input)`      | `POST /v1/demo-requests`     | the prototype's validation; kept in `localStorage` (`sc-demo-requests`)  |

- **The contract:** `types.ts` holds it until backend-api publishes its OpenAPI schema.
- **Which API:** `client.ts` picks HTTP when `PUBLIC_API_BASE` is set, and the mock otherwise.
- **Queries:** `queries.ts` holds the TanStack Query options. The landing page's load function prefetches both, so the
  prerendered HTML carries every figure, and the client starts from the same cache.
- **Lookups:** a workspace lookup is a POST, so an email or a phone number never goes in a URL.
- **The seed:** `src/lib/seed/` is generated by `corepack pnpm seed` from design3. Never edit it.

## Environment

Declared in `src/env.ts` (SvelteKit 3's `defineEnvVars`), public and inlined at build time. Copy `.env.example` to `.env`.

| Variable                                                  | Default                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `PUBLIC_API_BASE`                                         | unset: the in-browser mock                   |
| `PUBLIC_MOCK_LATENCY_MS`                                  | 0                                            |
| `PUBLIC_DEMO_URL`, `PUBLIC_APP_URL`, `PUBLIC_CONSOLE_URL` | the hosted prototypes on Claude Design       |
| `PUBLIC_DEV_ROUTES`                                       | off: `/ds` answers 404 in a production build |

## Tests

| Suite                   | Command                     | What                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit (Vitest)           | `corepack pnpm test`        | figures (golden strings), the pan's keyframes, the mock's lookup and demo rules, CSS drift                                                                                                                                                                         |
| End to end (Playwright) | `corepack pnpm test:e2e`    | axe-core WCAG 2.2 AA in five projects (1440 light and dark, 820, 390 light and dark) for the page, its menus and sheets and `/ds`; keyboard (menus, sheets, the form, links, no theme flash, the pan's holds); motion (nothing loops); smoke in Firefox and WebKit |
| Parity                  | `corepack pnpm test:parity` | the build against design3 pixel by pixel: every section and overlay in five projects, `/ds` against the DS v3 page                                                                                                                                                 |

The axe scan and report helpers are design3/a11y's, ported verbatim (`tests/e2e/helpers.ts`), so both suites hold the
port to the same rules. Findings are written to `test-results/a11y/`.

**Parity tolerances:** the HTML report shows each pair and its diff. Sections and overlays match within 0.2–1.5%. The
accepted differences are:

- the icons Lucide 1.51 draws differently from the prototype's 0.468;
- the rasterising of a panel that framer-motion leaves on its own layer.
