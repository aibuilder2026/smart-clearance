# SC-130 · Partner portals: the decision

## The request (9 Oct 2026, the maintainer)

1. "Distributors UI needs some change, they should be able to see Batch level information of what happened for past and present events, based on the stocks they that are at risk or were at risk and got cleared, They should see GST invoices, creditnote and other finance documents on their portal too."
2. "Kiranas should be able to see offers and past order, where they were accepted or declined/expired on their portal."
3. "Food bank partners also should be able to see past pickups, and donation receipts /certificates."

## The options

The board is `board.html`, published to app v3 as `SC-130 design review.html`. Each option runs the app prototype with its own screens (`sc130-kit.jsx`, `option-*/opt.jsx`).

- **A · Batch by batch** (recommended). The three partners read their own batches, offers and pickups the way Priya reads hers: as a list, each item opening its own page.
  - Rakesh's Batches: each batch has What happened, Money and Papers.
  - A kirana's Offers: the open offer with Not this time, then the earlier offers, each opening its page.
  - A food bank's Pickups: the coming pickup, then the collected ones, each opening its page with its receipt.
- **B · One timeline.** Each partner gets one History, newest first by month, down a rail. Each card opens in place and carries its papers as chips.
- **C · Statement and papers.** Each partner gets a register, led by one figure and with an export:
  - Rakesh's Account: a statement with Munchly, by date or by batch;
  - a kirana's Schemes;
  - a food bank's Receipts.

## What every option shares

- **Each partner sees only its own.**
  - A distributor sees his own papers: his tax invoice and its e-way bill check, and Munchly's price-support and expiry credit notes to him.
  - He also sees copies of what concerns his packs: the food bank's receipt and the destruction certificate.
  - Munchly's GST ITC memo and FSSAI checklist stay Munchly's.
- **Not this time:** a kirana can decline an open offer. An offer it never answered shows as expired, with the reason: the scheme filled first, or its 48 hours ended.
- **Papers:** every paper opens on paper, with Download PDF.

## Found on the way

- **The ExpireSoon line's money:** the distributor's "what you receive" must take the price the buyer actually took (the Negotiator's counter), not the listed price. Taken at the listed price, four batches read as up to ₹844 ahead. At the award price, every batch in the history ends whole to the rupee.

## The pick

Waiting for the maintainer.
