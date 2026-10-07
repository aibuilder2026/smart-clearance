# @smart-clearance/admin

The platform's own site, in SvelteKit 3. Today it serves the smartclearance.com landing page, a faithful port of
`design3/site` (SC-60's picked design), and `/ds`, design system v3 as built in core. The staff console is its own
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
`Nav`, `Hero` (the miniature business alive on film under the heading, SC-60), `Statement` (the three sentences that
fill in as they are read), `Scene` (the agents at work on the table, one in focus at a time, with `PhoneScreen` on the
phone), `Chapters` (the four moments each team sees, each in a colour field, SC-28's cards), `Ledger` (Impact's
document for the batch), `Workspace`, `Plans`, `Close`, `Footer`, the `DemoPill` that keeps the demo at hand, and the
`DemoSheet`; `Site` puts them together. `figures.ts` works out every figure and line of copy from the API's showcase
and catalog, as `site.jsx` does from the prototype's globals; `scene.ts` holds the table's geometry (every post,
measured on the plate; the order the agents work in; the stage's cover fit and the camera). The page names no client:
the batch it follows is an illustrative one (SC-28), and the kirana offer is composed on the page without one.

The motion plays once as a section comes into view, under five seconds, and then holds; the film and the table's tour
run longer, with Pause and Play (below). The server sends each section at rest, so the prerendered page is complete
without JavaScript. A section already on screen when the page starts stays at rest, and so does every section when the
reader asks for less motion.

**`site.css`** is design3's, unscoped and verbatim: since SC-60 the prototype scrolls the window too, so nothing is
marked as changed (`tests/unit/drift.test.ts` holds it so).

The bar's desktop, tablet and phone parts are all rendered and shown by CSS (`.desk-only`, `.not-phone`, `.phone-only`),
so the server renders every width. The bar is clear over the film, and takes its glass once the page has scrolled.

**Plates and media** come from design3 through `$design3` (a Vite alias), hashed into the build: the plates from
`design3/site/assets/plates` (`plates.ts`), the film and the demo's poster from `design3/site/assets/media` and
`design3/system/media` (`media.ts`). The server sends the day plate; the reader's own choice of theme then picks every
plate and the film.

**The loader** (SC-35) is design3's `site/loader.js`, as it is.

- `hooks.server.ts` puts it first in the prerendered page's `<body>`, so it is on screen from the first paint, and its styles are the loader's part of `site.css`.
- Every load of the page plays the route: the mark draws its S as the page loads, the pin lands, and the mark opens into a window onto the page.
- Every change of theme plays dusk or dawn over a paper skyline of the town. The theme changes underneath, the table's plate and the film with it.
- `Site` hands it `motion`'s `animate()`, the plates' hashed names (`SC3_PLATE_URL`) and the theme's gate (`theme.gate` on core's `Theme`).
- `Hero` tells it when the film's poster has decoded, for each theme.

**Motion,** with the prototype's numbers:

- **the film** (`Hero`): 8 s by day, 6 s by night, played once over its poster, with Pause, Play and Replay (WCAG 2.2.2);
  the heading's last word turns once through what a carton gets and rests on "chance", which is what is read out and
  what the server sends. A reader who asks for less motion gets the plate;
- **the statement** (`Statement`): its words fill in from the tertiary ink to the full ink as it is read, 0 as its top
  reaches 85% of the window and 1 as its foot reaches 45%. The progress is one custom property on the paragraph, each
  word's opacity a clamp over it, so a scroll costs one write; with no script, or less motion, every word is lit;
- **the table** (`Scene`, with `scene.ts`): the agents work the batch stop by stop, 1.4 s an agent and 1.8 s on the yes,
  15.8 s in all, once the table is mostly in view.
  - One agent at a time in a large card at the centre: its icon, name, post, what it did, and what it is doing live
    (the Watcher's gates and its 1,360; the Valuer's five prices; the Router's split; the yes with ₹21,770 and the
    amber button; Outreach's Hindi offer; the Lister's lot; the Negotiator's counter; Paperwork's documents; Impact's
    kilos), with a rail of all eleven to jump between on desktops.
  - **The camera** rests on the whole table and closes in on the agent's post (1.6× on desktops, 1.45× elsewhere), no
    further than the plate's own edges, which overflow the stage on both sides. On phones and tablets the person's stop
    frames the phone's screen and the post together.
  - **The phone's screen** follows the story: the batch flagged while the first agents work, the plan waiting for the yes
    from the Router's stop, then placed, with the agents the yes released lighting as they work.
  - The packs leave the phone as dots of about 50 for the kiranas as Outreach works and for the buyer's truck as the
    Lister works, on `motion`'s `animate()`; the places' tags count them in; the landfill's tag turns to what was kept
    out; the result lands with Replay.
  - **Control (WCAG 2.2.2):** Pause and Play are one button, under the bar. A step chosen in the rail holds the tour,
    and so does the table going out of view.
  - **Reduced motion, and the server:** the scene is sold at once, every agent lit, with no Replay;
- **the chapters** (`Chapters`, `rise.ts`): each field rises with its copy as the reader reaches it, its card on its
  own, the rows following in turn; the alert's and the plan's figures roll in; the plan's agents light in turn, and
  the work's three cards light theirs;
- **the ledger** (`Ledger`): rises with its lines, and its figures roll in.

**Fixed from the prototype,** none of it visible:

| The prototype                                                                     | Here                                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
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
  console shares (the catalog, workspaces, demo requests). SC-60 added to the showcase what the table and the chapters
  quote: the batch's MRP and date, the plan's share of MRP, swing and CO₂e, the award's bid and token, the Negotiator's
  reserve, the price-support credit note and the offer's title.
- **Which API:** `client.ts` picks `siteHttp` when `PUBLIC_API_BASE` is set, and `siteMock` otherwise.
- **Queries:** `queries.ts` holds the TanStack Query options. The landing page's load function prefetches both, so the
  prerendered HTML carries every figure, and the client starts from the same cache.
- **Lookups:** a workspace lookup is a POST, so an email or a phone number never goes in a URL.
- **The seed:** the API's is in `../api/src/seed/`; `src/lib/seed/ds.json` holds what `/ds` quotes. Both are generated
  by `corepack pnpm seed` from design3, which also writes backend-api's reference data. Never edit them.

## Environment

Declared in `src/env.ts` (SvelteKit 3's `defineEnvVars`), public and inlined at build time. Copy `.env.example` to `.env`.

| Variable                                                  | Default                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `PUBLIC_API_BASE`                                         | unset: the in-browser mock                   |
| `PUBLIC_MOCK_LATENCY_MS`                                  | 0                                            |
| `PUBLIC_DEMO_URL`, `PUBLIC_APP_URL`, `PUBLIC_CONSOLE_URL` | the hosted prototypes on Claude Design       |
| `PUBLIC_DEV_ROUTES`                                       | off: `/ds` answers 404 in a production build |

## Tests

| Suite                   | Command                     | What                                                                                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (Vitest)           | `corepack pnpm test`        | figures (golden strings), the table's geometry, CSS drift (the mock's lookup and demo rules are tested in `@smart-clearance/api`)                                                                                                                                                                                 |
| End to end (Playwright) | `corepack pnpm test:e2e`    | axe-core WCAG 2.2 AA in five projects (1440 light and dark, 820, 390 light and dark) for the page, the table paused and sold, its menus and sheets and `/ds`; keyboard (menus, sheets, the form, links, no theme flash, the film's and the table's controls); motion (nothing loops); smoke in Firefox and WebKit |
| Parity                  | `corepack pnpm test:parity` | the build against design3 pixel by pixel: every section and overlay in five projects, the film held at its first frame, `/ds` against the DS v3 page                                                                                                                                                              |

The e2e and parity suites run only when the maintainer asks for them (SC-55, the `browser-suites` skill). The axe scan
and report helpers are design3/a11y's, ported verbatim and shared with the console (`@smart-clearance/testing/a11y`),
so every suite holds the port to the same rules. Findings are written to `test-results/a11y/`.

**Parity tolerances:** the HTML report shows each pair and its diff. Sections and overlays match within 0.2–1.5%. The
accepted differences are:

- the icons Lucide 1.51 draws differently from the prototype's 0.468;
- the rasterising of a panel that framer-motion leaves on its own layer;
- the film's first frame, held on both sides.
