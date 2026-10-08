# SC-94 · Expiry day

## The request

The maintainer, on 8 Oct, looking at the chips' "Left at the godown" card (564 packs, net ₹11,282 of ₹21,770):

> "Impact report is not running even on clicking report now."

> "There can be scenarios when food will be left in go down, as per client setting, it should follow Full Credit or price support depending upon what is chosen."

> "Clicking on report now should be treated as Food is being expired and full journey should be realized and completed."

Their answers to four questions:
- **Price support only:** the gap is paid, and the stock stays with the distributor, who destroys it.
- **Report now:** closes as it stands. Orders placed, an accepted lot, a recorded staff sale and a confirmed pickup count; everything else expires at the godown.
- **The shelf check:** removed from the product and the prototype (SC-93).
- **The report:** falls due at best-before.

## What is built (backend, before this round)

- **Expiry day** (`steps.expire`, run by Report now and by the report's timer at best-before; migration 0008 `cases.expired_at`):
  - open lines close as they stand;
  - the papers follow;
  - Impact's report settles the packs left at the godown by `clients.expiry` (money.js `expirySettlement`).
- **The expiry paper:**
  - an "Expiry credit note", "Price support at expiry" or "Expiry notice", numbered from the credit-note sequence when there is a credit;
  - the destruction certificate counts the packs the client destroys;
  - the GST memo reverses their credit;
  - the ledger carries the settlement;
  - the closing push says how it settled.
- **The report's timer** is set at approval, due at best-before.

## The options

All three were mocked on the real kit (`expiry/mockup.html`, `expiry/expiry94.jsx`), with the paper the same in each. Each shows Priya's Execution beside Anita's paper, under the three policies:

- **A, the card settles (recommended):** "Left at the godown" becomes "Expired at the godown", with the policy, the credit, one sentence, and Open the paper.
- **B, a settlement card:** a separate "Expiry settlement" card with three figures, beside the unchanged card.
- **C, on the paper only:** the card gains one line, and the paper carries the rest.

## The pick

Waiting for the maintainer's pick.
