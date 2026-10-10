# SC-145 · The distributor's figures · the decision

## The request (10 Oct)

- "For batches and order, this value is differing for distributors please check this and fix."
- "If they are correct or not triage it, if all good leave it... but UI should have a way to know what the calculations
  show."

## The triage: the figures are correct

Every batch he cleared ends whole to the paisa: what he sold from it plus what Munchly credited him is what it cost him.

- **Batches:** ₹66,918, what Munchly credited Rakesh Traders since July (the price support and the expiry credit, 8
  credit notes). Each row shows its credit: MF-2407-116, ₹7,821.
- **Orders:** ₹1,05,928, what he sold from the same six batches (115 kiranas' orders, 5 ExpireSoon lots, a staff sale).
  Each batch shows its sales: MF-2407-116, ₹14,640.
- **Together:** ₹1,72,846, what the six batches cost him; for MF-2407-116, ₹14,640 + ₹7,821 = ₹22,461. Lakshmi
  Agencies: ₹1,19,975 + ₹64,377 = ₹1,84,352.

Neither page shows the sum, so each reads as a different answer to the same question. The values stay as they are.

## The options

On one board in app v3, `SC-145 design review.html`; the mockups override only the distributor's Batches and Orders
(`fig.jsx`, `option-*/opt.jsx`).

- **A · The same sum on both pages (recommended):** both pages open with one card, cost = sold + credited, the page's
  own part marked and the other linking to its page, with a bar for the split; every batch carries its own sum, the
  page's part first.
- **B · How this adds up, on request:** each page keeps its figure; its card opens one sheet, the same from both pages:
  every cleared batch's cost, sales, credit and how he ended, with the totals.
- **C · One figure on both pages:** both pages lead with what came back to him (the cost), split into sold and credited;
  every batch reads the same on both pages.

## The pick

To be recorded.
