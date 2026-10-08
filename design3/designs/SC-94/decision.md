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

8 Oct: the maintainer picked **B, a settlement card**: the "Left at the godown" card stays as it is, and an "Expiry settlement" card follows it, with:
- the policy as a badge;
- three figures: the credit to the distributor, who destroys the packs, and the client's other costs;
- the sentence;
- Open the paper.

Their answer on the Mango Drink's missing dealer price: **add ₹14.50**. It is fictional, at the chips' ratio of dealer price to MRP (₹22 of ₹30), so the Mango's expiry credit and its price support get a figure.

## What was built (option B)

- **Execution:** "Left at the godown" as it was, then the **Expiry settlement** card once a batch has expired with packs left (`brand.jsx` `ExpirySettlement`, core `screens/brand/ExpirySettlement.svelte`): the policy as a badge, the credit to the distributor, who destroys the packs, the client's other costs (disposal, EPR and the GST reversal under full credit), the sentence, and Open the paper.
- **Paperwork** opens on the expiry paper once there is one (`finance.jsx`, core `Paper.svelte` and `Paperwork.svelte`): the credit for the packs at the dealer price, and under full credit a sub-heading with the client's own costs and the total ("Expiry, all in"); under no returns, an expiry notice.
- **The contract:** `CaseDetail.expiry` (`ExpirySettlement`), and the expiry paper's `policy`, `destroyedBy`, `disposal`, `epr`, `itc` and `reversed` on `WsDoc`.

## Found on the way

- **Who keeps what** (Anita) and **You end whole** (the distributor) added the plan's gross for each line, not what each line took, so the Mango Drink read −₹4,615 for Lakshmi Agencies. Both now read the credit note's rows (what each line took, at its price), and add the expiry settlement: the credit on the distributor's side, the settlement on the client's. The story's figures are unchanged.
- **A distributor is not sent the plan**, so its You end whole had no lines and paid for the batch's 2,000 packs: it now works from the credit note's rows (the plan's before settlement), 1,580 packs.
- **design3's Paperwork** lost its sheet's state to a comment on the same line; fixed.

## Known gap

Who keeps what's caption says Munchly's gain is "the same swing as the ledger". That holds for the chips. For the Mango Drink, Munchly's cash view leaves out the food bank's costs, so the two differ by about ₹61, as they did before this ticket.
