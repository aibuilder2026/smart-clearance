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

Waiting for the maintainer.
