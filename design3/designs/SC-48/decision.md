# SC-48: the console's Overview as a live dashboard

**The request** (the maintainer, 6 Oct 2026): make the console's Overview more intuitive, with dashboards and live
charts and proper pagination of the live batches; an engaging dashboard, dynamic and database-driven, with nothing
hard-coded or stubbed in the UI.

**The options** (`board.html`), each built on the console's own shell and components:

- **A, command centre** (recommended): four figures with their 30-day lines, recovered by day beside the batches in
  flight at each stop (a stop filters the table), the paginated live batches table, then Needs attention, Demo
  requests and Agent runs.
- **B, the nine stops**: the pipeline as a band of nine stops with their counts and agents; the chosen stop's batches
  under it; the charts and lists after.
- **C, clients at a glance**: a card per client with its 30-day line, its batches at each stop and what waits on it;
  a card filters the table.

All three: two new backend-api routes (`/v1/console/dashboard`, and `/v1/console/batches` paginated on the server),
every figure a SQL aggregate; hydrate writes 30 days of history; the figures are read again every 30 s with Pause
updates (WCAG 2.2.2) and nothing moves on its own; charts by the dataviz rules, each with a tooltip and a table view;
filters and the page kept in the address.

**The pick:** **A, command centre**, picked by the maintainer on 6 Oct 2026, the recommended option. The board was
published to platform v3 as `SC-48 design review.html`, with `SC-48 option A.html`, `SC-48 option B.html` and
`SC-48 option C.html`.

The build: backend-api first (`GET /v1/console/dashboard`, `GET /v1/console/batches` paginated on the server, hydrate's
30 days of history), then design3's console Overview (`console/console.jsx`, `console.css`, the mock's aggregates in
`core/platform.js`), then `@smart-clearance/core`'s chart parts and the SvelteKit console's Overview.
