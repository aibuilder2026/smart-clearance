# @smart-clearance/admin

The platform's own site, in SvelteKit 3. Today it serves the smartclearance.com landing page, a faithful port of
`design3/site` (SC-25's approved design), and `/ds`, design system v3 as built in core. The staff console is its own
app, [`../console`](../console/README.md) (SC-37), deployed on its own subdomain.

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
`Nav`, `Hero` (with `Town`, the whole business as one miniature town in depth, the batch's tour and the agent graph, SC-32 and SC-34), `How` (how it works,
three moments), `Exits` (the packs taking the street, the batch split by exit, and the results), `Workspace`, `Plans`,
`Close`, `Footer`, and the `DemoSheet`; `Site` puts them together.
`figures.ts` works out every figure and line of copy from the API's showcase and catalog, as `site.jsx` does from the
prototype's globals. The page names no client: the batch it follows is an illustrative one (SC-28).

The motion plays once as a section comes into view, under five seconds, and then holds; the hero's tour is longer, with Pause and Play (below). The server sends each section
at rest, so the prerendered page is complete without JavaScript. A section already on screen when the page starts
stays at rest, and so does every section when the reader asks for less motion.

**`site.css`** is design3's, unscoped and verbatim, apart from two marked changes:

- **the window scrolls,** not `.site`, so the address bar, find-in-page, `#top` and the section links behave as on any
  site;
- **the town's first paint:** the server sends the hero's plate at rest (`.town-pre`), under the stage's own drawing.

The bar's desktop, tablet and phone parts are all rendered and shown by CSS (`.desk-only`, `.not-phone`, `.phone-only`),
so the server renders every width.

**Plates** come from `design3/site/assets/plates` through `$design3` (a Vite alias). The hero's town is sent as a
`<picture>` whose night source the browser picks before the page hydrates; once hydrated, it is drawn in WebGL2 from the
plate and its depth map (`business-depth.webp`), or flat where WebGL2 is missing. The reader's own choice of theme then
picks every plate.

**The loader** (SC-35) is design3's `site/loader.js`, as it is.

- `hooks.server.ts` puts it first in the prerendered page's `<body>`, so it is on screen from the first paint, and its styles are the loader's part of `site.css`.
- Every load of the page plays the route: the mark draws its S as the page loads, the pin lands, and the mark opens into a window onto the page.
- Every change of theme plays dusk or dawn over a paper skyline of the town. The theme changes underneath.
- `Site` hands it `motion`'s `animate()`, the plates' hashed names (`SC3_PLATE_URL`) and the theme's gate (`theme.gate` on core's `Theme`).
- `Town` tells it when its depth map is in and when it has drawn a plate, and the tour sets off once it has lifted.

**Motion,** with the prototype's numbers:

- `rise.ts` raises each of How it works' cards as it comes into view, its rows following in turn;
- `street.ts` holds the street in the plate's own coordinates (the road, each exit's way in, the dots of about 50 packs),
  and `motion`'s `animate()` moves each dot along its way; the road draws, and the split's parts ease in, by CSS
  transitions set inline only while the section plays;
- the street plays once nearly all of it is in view, and the split once its packs have arrived; one Replay runs both;
- below 1100 px the street is a strip that follows the packs;
- the hero's town (`Town`, with `town/`):
  - **the tour** (SC-34): once the plate and its depth have loaded, the batch tours the town.
    - It makes a stop for each agent, in the order they work (`figures.ts` works out the stops): 1.3 s an agent, 1.7 s
      on the yes, 1.1 s on the two beats without agents, 16.9 s in all.
    - A card opens beside the agent's pin, on a stem, and the pin's name stands down meanwhile.
    - **The camera** (`camera.ts`) rests on the whole town. On phones and tablets it slides along at the same size to
      keep the agent in view. `motion`'s `animate()` flies it and rolls the money.
    - **Control (WCAG 2.2.2):** Pause and Play are one button with Replay. Taking the camera holds the tour, and so
      does the hero going out of view.
    - **Leaving the hero** (the pointer, focus, a tap outside, or scrolling away) brings the whole town back and closes
      the visitor's card;
  - **the depth renderer** (`depth.ts`, WebGL2) shifts each pixel by its depth: parallax as the camera travels, a tilt
    under the pointer, a sway under a swipe, and a focus that follows the camera;
  - **the agent graph** (`graph.ts`) is drawn on a canvas over the town, and the packs run out when the batch sells;
  - **the gestures** (`gestures.ts`): drag or swipe, pinch, Ctrl-scroll and double-click; places open panels by
    keyboard, and the steps walk the tour by hand;
  - **reduced motion:** the batch is at its result at once, and the camera jumps.

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

The UI reads one typed API, the landing page's entry of the shared [`@smart-clearance/api`](../api/README.md)
(`@smart-clearance/api/site`), through `src/lib/api/`:

| Call                      | Endpoint                     | Mock                                                                                |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `showcase()`              | `GET /v1/site/showcase`      | `seed/showcase.json`: one batch, every figure computed by money.js, no client named |
| `catalog()`               | `GET /v1/platform/catalog`   | `seed/catalog.json`: the agents, connectors and plans                               |
| `lookupWorkspaces(query)` | `POST /v1/workspaces/lookup` | the prototype's rules over `seed/directory.json`                                    |
| `requestDemo(input)`      | `POST /v1/demo-requests`     | the prototype's validation; kept in `localStorage` (`sc-demo-requests`)             |

- **The contract:** `@smart-clearance/api` holds it until backend-api publishes its OpenAPI schema, with the shapes the
  console shares (the catalog, workspaces, demo requests).
- **Which API:** `client.ts` picks `siteHttp` when `PUBLIC_API_BASE` is set, and `siteMock` otherwise.
- **Queries:** `queries.ts` holds the TanStack Query options. The landing page's load function prefetches both, so the
  prerendered HTML carries every figure, and the client starts from the same cache.
- **Lookups:** a workspace lookup is a POST, so an email or a phone number never goes in a URL.
- **The seed:** the API's is in `../api/src/seed/`; `src/lib/seed/ds.json` holds what `/ds` quotes. Both are generated
  by `corepack pnpm seed` from design3. Never edit them.

## Environment

Declared in `src/env.ts` (SvelteKit 3's `defineEnvVars`), public and inlined at build time. Copy `.env.example` to `.env`.

| Variable                                                  | Default                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `PUBLIC_API_BASE`                                         | unset: the in-browser mock                   |
| `PUBLIC_MOCK_LATENCY_MS`                                  | 0                                            |
| `PUBLIC_DEMO_URL`, `PUBLIC_APP_URL`, `PUBLIC_CONSOLE_URL` | the hosted prototypes on Claude Design       |
| `PUBLIC_DEV_ROUTES`                                       | off: `/ds` answers 404 in a production build |

## Tests

| Suite                   | Command                     | What                                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (Vitest)           | `corepack pnpm test`        | figures (golden strings), the street's geometry, CSS drift (the mock's lookup and demo rules are tested in `@smart-clearance/api`)                                                                                                                                               |
| End to end (Playwright) | `corepack pnpm test:e2e`    | axe-core WCAG 2.2 AA in five projects (1440 light and dark, 820, 390 light and dark) for the page, its menus and sheets and `/ds`; keyboard (menus, sheets, the form, links, no theme flash, the street playing and Replay); motion (nothing loops); smoke in Firefox and WebKit |
| Parity                  | `corepack pnpm test:parity` | the build against design3 pixel by pixel: every section and overlay in five projects, `/ds` against the DS v3 page                                                                                                                                                               |

The axe scan and report helpers are design3/a11y's, ported verbatim and shared with the console
(`@smart-clearance/testing/a11y`), so every suite holds the port to the same rules. Findings are written to
`test-results/a11y/`.

**Parity tolerances:** the HTML report shows each pair and its diff. Sections and overlays match within 0.2–1.5%. The
accepted differences are:

- the icons Lucide 1.51 draws differently from the prototype's 0.468;
- the rasterising of a panel that framer-motion leaves on its own layer.
