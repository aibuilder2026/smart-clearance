# Munchly Chips E2E: run of 11 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to Impact's report, every
person acting in the real UI, on this machine's live stack. SC-161: the suite now also checks what SC-139 to SC-157
built, as the journey reaches each.

**Passed end to end** in 8 min 45 s, 99 steps, headless and recorded, from a reset, on `main` at `e038fb0` with the
suite's new checks. Every figure is the story's. One finding, a product question about Rakesh's sums, and one small
accessibility note.

- **What ran:** `corepack pnpm test:journey` from `frontend/`.
- **The stack, all local:**
  - backend-api on :8000 (`smart_clearance`, schema 0015);
  - the agents' pull worker on live Gemini;
  - the workspace app's and the console's dev servers on :5175 and :5174, restarted on `main` before the run.
- **The journey day:** 60 min (Rehearsal), set by the reset, then put back to 24 hours
  (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** the chips cleared and in the ledger. The Mango Drink is flagged and
  waiting for its label photo (Verify).
- **The recording:** `munchly-chips-e2e-2026-10-11.mp4` beside this file, 8 min 46 s, H.264. It stays local
  (git-ignored). A caption names who acts at every step.
- **The record:**
  - `report.json`: every step, with its time and figures;
  - `stills/`: all 99 steps;
  - `exports/`: the GST summary and the BRSR table Priya exported, and the batch's audit trail as CSV.

## The story's figures

- **The plan:** ₹21,770; 588 to the kiranas, 772 to ExpireSoon; 38 kiranas offered.
- **The orders:** 31 kiranas ordered 588 packets.
- **The deal:** a bid at ₹13, countered at ₹14.20; 772 awarded with a ₹1,644 token. The Lot won bill reads ₹11,510.00.
- **The papers:**
  - INV/26-27/0931, CN/0117 and the GST ITC memo, each with its PDF;
  - the Saturday round in the push and the timeline.
- **The close:** actual ₹21,152.40, nothing left at the godown.
- **The tax:** ₹1,224 of input GST kept, none reversed; the memo stamped ITC KEPT; reviewed by Priya.
- **The ESG:** 217.6 kg kept out of landfill, all resold; 544 kg CO₂e; 8.16 kg of plastic packaging.
- **The year so far:** 13 batches, ₹2,41,535.98.
- **Rakesh:** he ends whole at ₹0; his invoice and CN/0117 PDFs serve as `application/pdf`.

## What SC-139 to SC-157 added, as the run found it

| Feature                                       | Checked                                                                                 | Found                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The label photo's sticker (SC-147)            | the codes read back from the file Rakesh sends; Vision's read                           | EAN-13 `8900000001019`; QR `https://id.munchly.example/01/18900000001016/10/MF-2409-117?17=261118`; Vision read MF-2409-117, made 18 May, best before 18 Nov, ₹30, matching the export                                                                                      |
| The ExpireSoon card (SC-151)                  | live, awarded and collected on Execution                                                | ES-24117, 772 units at ₹15, MRP ₹30, 50% off, reserve ₹13.50, hidden in 4 territories; 1, 3 and 4 of 4 stops; won by Agrawal Wholesale at ₹14.20 with ₹1,644 paid; the request and response behind The API call                                                             |
| The Outreach card (SC-156)                    | open, filled and delivered on Execution                                                 | ₹21.60 a pack, ₹18.00 effective, 48-hour window; 1, 3 and 4 of 4 stops; "Delivered on Rakesh's van round, Sat 3 Oct: 588 packets to 31 shops"; the Hindi push only behind its button                                                                                        |
| A tax invoice for every kirana order (SC-153) | every order's invoice; Ganesh ji's order page and invoice; the sales register; the PDFs | 31 of 31, RT/26-27/1279 to 1309, every one at ₹18.00 taxable a packet with 2.5% + 2.5%, to the rupee; ₹10,584 taxable, ₹529.20 GST, ₹11,119 in all; Ganesh ji's 24 packets ₹454; all 31 PDFs laid out                                                                       |
| The Tally papers (SC-148)                     | the pack's card, the issued invoice, the credit note                                    | the invoice reads issued in the pack, ORIGINAL FOR RECIPIENT, with its IRN (SHA-256 of 27ABHPR0000K1ZW, 2026-27 and the number), Ack No. and signed QR, and the three GSTINs; CN/0117 against MFL/26-27/02417. SC-133's old note ("drafted" after Rakesh issues it) is gone |
| Destroyed at the godown (SC-139)              | Munchly's policy; nothing left                                                          | policy `godown`; no packs to destroy, no destruction asked                                                                                                                                                                                                                  |
| The Record (SC-142)                           | Priya's batch page in the ledger and on Execution; Rakesh's Photos                      | the label photo with Vision's read and the match; 23 steps, 10 by people; People shows those 10; the yeses (the plan approved, the papers reviewed, both Priya's); the trail as CSV, 41 rows                                                                                |
| The photo loader (SC-144, SC-146)             | every photo on the Record, opened whole, and Rakesh's Photos                            | every photo drawn, none failed                                                                                                                                                                                                                                              |
| The distributor's figures (SC-141, SC-145)    | Orders and Batches                                                                      | "588 packets at ₹18.00 effective (₹21.60 a pack, 2 free with every 10)" on 31 tax invoices; the sum card ₹1,05,928 sold + ₹66,918 credited = ₹1,72,846 on both pages; each cleared batch's sum adds up (₹14,640 + ₹7,821 = ₹22,461)                                         |
| The Impact dashboard (SC-157)                 | the Ledger's Impact reading; the Command Center's card                                  | the three tiles, Food by week (8 weeks as a table), Where the kilos went, by distributor and by product; Impact · Q3 FY27 with 217.6 kg and 544 kg; Open the ledger lands on `?reading=impact`                                                                              |
| The console (SC-149, SC-150)                  | the Overview; the client's head                                                         | Food, by day, with no second Recovered chart, 30 days as a table; munchly-smartclearance.web.app                                                                                                                                                                            |
| The buttons (SC-152)                          | every button the run pressed, as it waited                                              | 42 waits, none blank or transparent, none refused: Resetting the journey…, Confirming…, Allowing…, Approving the plan…, Placing your bid…, Accepting…, Loading the truck…, Issuing…, Starting the round…, Marking reviewed…                                                 |

## Findings

- **Rakesh's sums leave out the batch that just cleared** (warning). On Orders and Batches, "How your 6 cleared
  batches add up" counts only the history. Orders goes on: "The ₹21,546 sold from the batch still in a journey joins
  the sum once it clears". But the chips have cleared: the row above reads "Cleared · every order", and his partner
  facts say cleared on 2 Oct. CN/0117's ₹8,768 is not in "Munchly credited you" either.
  - The cause: core's `clearedOf` (`screens/trade/pt.ts`) treats any journey phase but `watching` as in a journey,
    and `cleared` is one of them.
  - design3 does the same: `ledger.js` `distBatches` sums only the history. So the port matches the approved
    prototype, and the change needs design3 first.
  - Offered as a separate task.
- **The kirana's order button tells a screen reader "Working" and "Done"** (note). Its busy and done words are Hindi
  snippets (`OfferOrder.svelte`), so the button's status line falls back to the English defaults while its face reads
  ऑर्डर हो रहा है…. Every other button names its own words.

## Before this run

Four shorter runs on the same journey shook out the new checks. Each stop was the suite's own:

- the API call's code block is a region named by its label, not text;
- once an order goes through, the screen reads the order on its way ("Ordered · 24", SC-152 shows a step once it has
  gone through), not ऑर्डर हो गया;
- the Orders headline is now "what sold from each of Munchly's batches";
- the Record's yeses read "Reviewed …", and the People filter is counted by rows. Neha's "Fired the Impact agent's
  timer" is a person's step that names an agent.

No app code changed.
