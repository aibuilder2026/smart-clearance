# SC-151 · The ExpireSoon card

## The request

The maintainer, on 10 Oct, with a screenshot of the Lister · ExpireSoon card on the chips' Execution:

> "Expire Soon UI work, currently showing HTTP API call, can we improve this marketplace integration piece"

## Now

The card holds the Lister's `POST /v1/listings` body and the `201 Created` as two code blocks (design3 `brand.jsx`
Execution, core `Execution.svelte`). They scroll sideways at a card's width. The reserve and the territory guard are two
numbers among eleven, and the only state is the badge.

## The options

All three are mocked on the real kit (`options/mockup.html`, `options/sc151.jsx`), each in five states: queued, live,
countered, awarded and collected. Each keeps the raw call behind **The API call**, closed by default.

- **A, the lot as listed (recommended):**
  - the lot as buyers see it on ExpireSoon (the pack, the price against MRP, best before, the seller, the listing id);
  - what only Munchly sees (the reserve, and the territories it is hidden in);
  - four steps with their times (Listed, Bid, Won, Collected);
  - the buyer and the price inside the listing once it is won.
- **B, the handshake:** the two ends in sync, then each message between the Lister and ExpireSoon in plain words, sent or
  received, each opening its payload.
- **C, the terms:** one line for where the lot stands, then the terms as the kit's list, with the label photo.

The question on the board: should the raw call stay on the card, or move to the batch's Record (SC-142)?

## The pick

10 Oct: the maintainer picked **A, the lot as listed**, and on the board's question, **keep the raw call on the card,
closed**.

## What was built (option A)

- **The card** (design3 `brand.jsx` `ListerCard`, core `screens/brand/ListerCard.svelte`), on Execution in place of the two
  code blocks:
  - the lot as buyers see it: the pack, the price against MRP, best before, the seller and its cartons, the listing id;
  - once won, the buyer, the price and the token inside the listing; a lot that ended unsold says so;
  - what only the client sees: the reserve, and the territories the lot is hidden in, with their pincode areas;
  - four steps (Listed, Bid, Won, Collected), each with the case's own time, the next one marked waiting;
  - Open on ExpireSoon, and **The API call** (`aria-expanded`, 44 px), which opens the request and response under the
    row.
- **The badge** follows the lot: queued, live, bid in, countered, awarded, collected, or ended unsold.
- **Styles:** `screens.css`'s `.esl`, `.priv`, `.esl-steps` and `.xcall` blocks, copied verbatim into core.
- **No contract or backend change:** every figure is the case's (the plan's line, the SKU, the batch, the award, the
  reserve, the distributors' pincodes).

## Checks

- The frontend gate passes: core 273 (9 goldens of Execution updated, only the card's text), api 79, workspace 93,
  admin 17, demo 5, console 3.
- design3's Execution and the port's stub build were shot at 1440 and 390, light and dark, with the call opened
  (`build/`).
- The a11y specs open the call: the workspace's Execution with the lot awarded, and the demo's stage 7 on Priya's
  laptop, so CodeBlock stays covered. The browser suites were not run (SC-55).
