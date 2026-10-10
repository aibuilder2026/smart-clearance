# SC-157 · Impact: the ESG and food-waste dashboard

## The request

The maintainer, on 10 Oct, with a screenshot of the console's "Food kept out of landfill" card (SC-149):

> "Supply chain can have some cool ESG & food waste savings dashboard"

## Now

Priya reads the ESG figures as the Ledger's Impact reading (SC-121): one headline with its working, the period drawn
as its batches, and the batches by month; the BRSR table is an export. Nothing shows the food saved over time, where
the kilos went, the distributors or products side by side, or a quarter against the one before.

## The options

Each option is the workspace app itself on the stub, run to the end, signed in as Priya (`option-*/mockup.html`, with
`sc157-kit.jsx` deriving every figure from `core/ledger.js` and `roles157.jsx` adding the Impact route for A and C).
The chart inks are SC-149's, validated with the dataviz script on the app's surfaces (`sc157.css`).

- **A, Impact, its own page (recommended):** under Reports beside the Ledger: four tiles against the period before,
  with sparklines; Food by week; where the kilos went; by distributor or by product; BRSR Principle 6's row with its
  evidence and Export.
- **B, the Impact reading, grown:** no new page; the Ledger's Impact reading gains the tiles and the charts under its
  headline, over the period's batches.
- **C, the flow:** Impact as its own page, told as one picture: the kilos flagged flowing to each channel and on to
  kept out of landfill or destroyed; then Food by week and BRSR's row.

The question on the board: should one small card of it also stand on the Command Center?

## The pick

10 Oct: the maintainer picked **B, the Impact reading, grown**, and on the board's question, **also a small card on
the Command Center** (this quarter's kilos kept out, CO₂e and meals, opening the Ledger on its Impact reading).

## What was built (option B, with the Command Center's card)

- **The Impact reading** (design3 `screens/finance.jsx` `ImpactReading`, core `screens/finance/ImpactReading.svelte`):
  the headline and its working stay; under them, in the same card, three tiles (kept out of landfill, destroyed with
  the share saved, CO₂e avoided), each against the quarter before and with its weeks as a sparkline, and **Food, by
  week** (SC-149's form: kept out rising from the baseline, destroyed hanging under it, hatched; a crosshair tooltip;
  Show as a table). Then **Where the kilos went** (one bar of the channels, destroyed hatched last, a row each) and
  **By distributor** or **By product** (resold, donated and destroyed on one scale). The period's batches follow as
  before. Money and GST read as they did.
- **The figures** are derived from the ledger's rows by `core/ledger.js` `dashboard()` and `impactPeriod()` (the
  weeks from the period's start or the first batch cleared, by distributor, by product, by channel, the share saved,
  the quarter before); core's `impact.ts` is the same, held to ledger.js for every period at stages 0 and 9
  (`ledger.test.ts`). It reads the ledger whichever source made it, so the live workspace needs no new route.
- **The Command Center's card** (`ImpactCard`, under the agent feed on the Command Center and its quiet day): the
  quarter so far (or the latest with a batch cleared), its kilos kept out of landfill, CO₂e and meals, the weeks as a
  sparkline, and **Open the ledger**, which opens the Ledger on its Impact reading (`/report?reading=impact`; the
  port's address carries the reading as it carries a batch page's tab).
- **Inks:** the console's (SC-149), validated with the dataviz script on the app's surfaces (`screens.css`,
  `--viz-*`); donated takes the food bank's channel ink. The bars grow once (420 ms), still under reduced motion.
- **Specs:** two live tests (the reading and its table; the card opening the ledger); the a11y spec scans the
  reading, its table and the card.

## Checks

- The frontend gate passes: core 276 (3 new; the goldens follow the card), api 79, workspace 97 (2 new), admin 17,
  demo 5, console 3.
- design3's Ledger and Command Center and the port's stub build were shot at 1440 and 390, light and dark (`build/`).
- The browser suites were not run (SC-55).
