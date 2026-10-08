# SC-83 · The watchlist row of a gated batch that sells through

## The request

The maintainer, 8 Oct 2026, on the live Command Center's watchlist:

> "Some of them are showing gated selling through, but shows cross on Blinkit, Zepto and Instamart, so they should be
> at risk"

Asked whether a batch that fails every quick-commerce gate but sells out in normal trade should count as at risk, the
maintainer chose **"Keep it, clearer row"**:

- money.js's rule stays: a batch is at risk only when packs will not sell before the last week **and** every gate
  fails;
- the row says why such a batch is fine, for example "Sells through in trade by 14 Nov", instead of three red crosses.

## The row now (`current/`)

- The amber badge "Gated · selling through".
- The countdown and the days left.
- A red cross on each failed gate, though DESIGN.md keeps red for risk and the bin.

Peanut Chikki, MF-2408-311, as an example: 960 packs, 61 days left, 20 a day. All 960 sell in 48 days, 6 days before
retailers stop taking it.

## How the options were made

- **Context:**
  - `PRODUCT.md` and `DESIGN.md`: red for risk and the bin; colour only where something is live.
  - money.js's `assess` and `RULES.projectionStopDays`.
  - SC-47 (the gates per SKU and batch) and SC-68 (the live Command Center, the quiet day).
- **The mockup is the app itself.**
  - `row/sc83.jsx` replaces the kit's `BatchRow` after `system/product.js`.
  - `?opt=a|b|c` picks the option; the page is the live app at SC-68's moments (`?state=quiet`, `?state=live`).
- **The stills:** `shoot.mjs` (with `el` crops and `css`) takes them from the worktree's design3 server (8788), in
  light and dark, at 1440 and 390.
- **No imagery** was generated.

## The options (board `board.html`, app v3)

- **A · Sells out by (recommended):**
  - on its own line under the bar: "✓ Sells out by 19 Nov · 6 days to spare", in the brand's green;
  - a failed gate is neutral unless the batch is at risk.
- **B · One chip:**
  - the badge says "Selling through in trade" (neutral), and the line says when the batch sells out;
  - the failed gates fold into one neutral chip: "Not for quick commerce", or "Not for Zepto, Instamart" when Blinkit
    passes.
- **C · The projection drawn:**
  - the bar shows the days the packs take to sell against the days retailers take the batch, the last week hatched;
  - the line says "Sells out 6 days before retailers stop", and failed gates are neutral.

**Shared:** the rule stays; only a batch that is gated and sells through changes. A failed gate is red only on a batch
at risk. The sell-out day and the margin come from the batch's own data, and every screen that shows the row gets it.

## The pick

Picked by the maintainer on 8 Oct 2026: **C · The projection drawn**.

What the build carries, from the option and its remaining states:

- **Which batches:** only a gated batch that sells through (not in a journey, status `gated`, nothing at risk). An
  at-risk, safe or in-journey row is as it was.
- **The bar** (the kit's `SellBar`, beside `Countdown`):
  - the green part is the days the packs take to sell at today's rate (packs ÷ sales a day, rounded up);
  - the hatched end is the last week retailers will not take the batch (money.js's `projectionStopDays`), drawn to the
    days left;
  - its accessible name: "Sells out in 48 days; retailers take it for 54 more days".
- **The line** says how many days before retailers stop:
  - "Sells out 6 days before retailers stop";
  - "1 day before" for one day;
  - "Sells out the day retailers stop" for none.
- **Red means risk:** a failed gate is red only while the batch is at risk (`GateChips`' `quiet`), and neutral on a
  batch selling through, in motion or cleared.
- **From the data:** every figure comes from the batch's packs, sales a day and days left, and money.js's usable days.
  Nothing is typed, and money.js is unchanged.
- **The phone:** the line takes its own row under the bar, by the row's container rule at 380 px.
