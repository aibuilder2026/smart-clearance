# SC-110 · Donation receipt

## The request

The maintainer, on 9 Oct, after the Mango Drink's donation (86 packs collected by Feeding India in the Munchly Mango
E2E run, SC-104):

> "I dont see any receipts in the app for donations...."

Asked whether the receipt should follow the Journey Map per food bank or be one kind for every food bank:

> "yes start the design round, per food bank"

So there are two papers, as the Journey Map v4.1 and `data.js` `SETUP.partners` have them:
- Feeding India: an **in-app receipt**;
- India FoodBanking Network: a **donation acknowledgement (CSR / 80G, indicative)**.

## Where it stands

- Meera's collected pickup reads "In-app receipt issued · 86 drinks served · shared with Munchly for its BRSR table".
- backend-api's audit log reads "collected 86 packs and issued the receipt".
- But no receipt exists: not in Meera's Pickups, not among the Mango Drink's six papers, not in Vikram's evidence.
- The prototype (`trade.jsx` Pickups) has the same sentence and no receipt.

`current/` holds the screens as they are, captured from the live local app.

## The options

All three were mocked on the real kit (`receipt/mockup.html`, `receipt/receipt110.jsx`). They show:
- each food bank's paper;
- Meera's Pickups, on a desktop and on a phone, light and dark, and the receipt as she opens it;
- the desk view, light and dark: Anita's Paperwork for A and B, Vikram's Finance & ESG for C.

The example is the story's donation: 58 packs of Mango Drink (MF-2410-118) from Lakshmi Agencies' Begum Bazaar godown,
collected Tue 6 Oct and served at the Charminar hunger spot. Every figure comes from `money.js` and `data.js`.

**The paper, in each food bank's form.** The receipt states:
- who gave what to whom;
- the batch and its best-before;
- the packs and their weight;
- when it was collected, and by whom;
- where it was served;
- the meals: a pack a meal, indicative.

Feeding India's is a "Donation receipt", stamped RECEIVED. India FoodBanking Network's is a "Donation acknowledgement",
stamped ACKNOWLEDGED. It adds the value at Munchly's cost (₹638, indicative) and the CSR activity, and says that it is not
a tax certificate. India FoodBanking Network needs 21+ days and 100+ units, so its paper is illustrative here.

The options:
- **A, a paper in the pack (recommended).**
  - The receipt is the batch's seventh paper, issued by the food bank at collection, numbered, with its PDF.
  - Meera opens it from the collected pickup (View; a sheet on a phone).
  - Anita sees it in the pack. Vikram sees it in Evidence, and the BRSR evidence line names its number.
- **B, one donation paper.**
  - The FSSAI checklist and the food bank's receipt become one "Surplus-food handover": the donor's checklist on top, the
    food bank's receipt stamped beneath it on collection.
  - It takes the FSSAI checklist's place in the pack and beside Meera's pickup.
- **C, a receipts register.**
  - Receipts live in a register: Meera's "Your receipts", and "Donation receipts" under BRSR Core in Vikram's Finance &
    ESG, every receipt of the quarter with its PDF.
  - The batch's pack and evidence line link to its receipt.

**Why A:** the receipt is evidence for one batch, so it belongs in that batch's pack, where Anita and Vikram already
look, as a paper like the others. B puts two issuers on one page. C serves a quarter's audit, but adds a register to two
screens and keeps the receipt a step away from its batch. A register can follow from A's papers later.

**Open questions:**
- **The numbering:** each food bank's own series, issued by the app (FI/HYD/26-27/0417, IFBN/ACK/26-27/0112), or Munchly's?
- **The meals:** a pack a meal (indicative), or each food bank's own rule?
- **The acknowledgement's value:** keep the value at cost on India FoodBanking Network's paper?

## The board

`board.html`, published to the app v3 Claude Design project on 9 Oct as
[`SC-110 design review.html`](https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=SC-110+design+review.html),
with each option's mockup as `SC-110 option A.html`, `B` and `C`, all pinned to `d372d58`. Every page was opened in a
browser: the board's 24 stills load, and each option draws its five views (Meera's Pickups, the desk, the receipt
opened, and each food bank's paper) with no page errors.

## The pick

The maintainer picked **A, a paper in the pack** (9 Oct), and answered the open questions:
- **The numbering:** each food bank's own series, issued by the app on collection (FI/HYD/26-27/0417, IFBN/ACK/26-27/0112).
- **The meals:** each food bank's own rule, not a pack a meal everywhere.
- **The acknowledgement's value:** kept, at Munchly's cost, marked indicative, with the line that it is not a tax
  certificate.

## The build (option A)

- **Each food bank's form, numbering and meals rule** live with its setup (`data.js` `SETUP.partners`):
  - Feeding India: a Donation receipt, stamped RECEIVED, numbered `FI/{city}/26-27/0417` on, counting a meal for each
    pack served.
  - India FoodBanking Network: a Donation acknowledgement, stamped ACKNOWLEDGED, numbered `IFBN/ACK/26-27/0112` on,
    counting a meal for every 400 g of food. It adds the value at the donor's cost and the CSR activity
    (Schedule VII (i)), and says it is not a tax certificate.
  - The series are `world.js` `NUMBERS` (`receipt.<food bank>`).
  - The rules and numbers are fictional and marked indicative.
- **money.js:**
  - `mealsOf(units, sku, rule)`;
  - `receipt(units, sku, partner, facts)`, the paper;
  - `realised(…, mealsRule)`, which counts meals by the rule of the food bank that collected;
  - `documents(…, receipt)`, which sets the receipt after the FSSAI checklist.
- **The prototype:** Meera's collected pickup opens the receipt in a sheet. The pack's `Paper` sets it out
  (`finance.jsx` `Receipt`). The story's receipt is `data.js` `MANGO_RECEIPT`: 58 packs, 12.47 kg, 58 meals,
  FI/HYD/26-27/0417 on Tue 6 Oct.
- **backend-api:**
  - Collecting issues the receipt in the food bank's series. It is kept on the donation, and the audit line names it.
  - A confirmed pickup on expiry day gets one too.
  - Paperwork is asked to lay it out at once (`journey.step receipt`).
  - The pack carries it, with its own day and PDF.
  - The ledger counts the food bank's meals.
  - A food bank reads its own receipt, and its PDF (`docs.read` for `ws-foodbank`).
- **agents:** Paperwork's receipt pipeline and `receipt.html`.
- **The port:**
  - core's `Receipt.svelte`, used by `Paper` and `Pickups`;
  - the PDF in Meera's sheet once it is laid out;
  - Report's BRSR line and evidence from the receipt;
  - the contract's `ReceiptFields`;
  - the live projection.

**The states:**
- before collection there is no receipt;
- collected, the receipt opens in a sheet;
- once laid out, its PDF is offered;
- a food bank set up without a receipt form says so;
- a declined pickup has none.
