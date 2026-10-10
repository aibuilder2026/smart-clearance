# Munchly Mango E2E: run of 10 Oct 2026, on SC-133's distributor portal

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad), taken on from where its journey stood to
Impact's report with **no reset**, on the workspace app as SC-127 (one operator) and SC-133 (the distributor's portal,
batch by batch) left it. SC-134.

**Passed end to end, in four parts on the same journey**, headless and recorded, on branch `SC-134-mango-e2e`. Each
part read the case first and skipped the steps already done:

1. **Part 1** took the batch from where it stood through the label photo, the plan, the 52 kiranas and the scheme. It stopped
   at the staff sale: "Record what sold" also matched the line's own state text on Lakshmi's Today card. The step now
   presses the button by its exact name.
2. **Part 2** recorded the staff sale, collected the donation, drafted the papers, ran the van round, had Priya review
   the pack and Impact post the ledger. It stopped at ESG: since SC-127 a batch's page opens on Money, and "BRSR line"
   had matched the recording's caption. The step now opens the Impact tab and the ledger's Impact reading.
3. **Part 3** passed every step but soft-failed on Lakshmi's portal: the cleared batch's food-bank pickup read "being
   booked" in Deliveries, and her Orders lacked "58 packs given". **An app bug:** once a batch clears, its donation
   leaves the workspace's state, and a distributor is never sent the plan, so the portal had nothing to read it from.
   Fixed in core (`dist.ts`): the pickup comes from her partner facts (`GET …/partner`), collected once the facts say
   so. A new live test covers it.
4. **Part 4** (81 s, 22 steps) passed with no soft failure: every step up to the ledger skipped as done, then ESG,
   Lakshmi's portal, Batches, the papers, Execution and the Command Center at the end.

- **What ran:** `corepack pnpm test:journey:mango` from `frontend/`, four times.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango, so the papers are rendered as PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **Where it stood:** the Watcher had flagged the Mango Drink (write-off ₹22,657.20 if destroyed); the chips
  (MF-2409-117) had cleared in SC-133's run.
- **The journey day:** 60 min while it ran, then put back to 24 hours (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** both batches cleared and in the ledger. Nothing was reset.
- **The recording:** `munchly-mango-e2e-2026-10-10.mp4` beside this file, part 4's. It stays local (git-ignored).
- **The record:** `report.json` (part 4's steps and figures) and `stills/`.

## The people

| Character    | Who                               | What they did                                                                                                             |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Distributor  | Lakshmi Agencies                  | Sent the label photo, recorded the staff sale and ran the van round, each from its batch's card on Today; read her portal |
| Supply Chain | Priya Deshmukh                    | Approved the plan; reviewed every paper; verified the ESG on the batch's page and the ledger; watched Execution           |
| Kiranas      | 52 shops of the Hyderabad cluster | Each ordered its share of the scheme                                                                                      |
| Food bank    | Meera, Feeding India              | Confirmed and collected the pickup                                                                                        |
| Staff        | Neha Kulkarni                     | Fired the console's triggers where the journey waited on a timer                                                          |

Each person was signed in with a Firebase custom token minted as sc-api-local (`backend-api/scripts/sessions.sh`), so
no password was handled.

## The journey, against its own plan

| Stage      | Result                                                                                                        | Held |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| Plan       | ₹16,917.10 net: 1,372 to the kiranas, 150 to staff, 58 to Feeding India                                       | yes  |
| Kiranas    | 58 offered, 52 ordered 1,372 packets                                                                          | yes  |
| Staff sale | 150 of 150 recorded by Lakshmi Agencies                                                                       | yes  |
| Donation   | 58 packs collected by Feeding India                                                                           | yes  |
| Papers     | CN/0118, the GST ITC memo, the FSSAI checklist and receipt FI/HYD/26-27/0417, each with its PDF               | yes  |
| Van round  | the Saturday round, on Deliveries and in its push                                                             | yes  |
| The close  | actual ₹16,917.10, nothing left at the godown, cleared                                                        | yes  |
| The year   | 14 batches, ₹2,58,453.08 recovered, ₹17,915.88 of input GST kept, 2,516.81 kg kept out of landfill, 930 meals | —    |

## Lakshmi reads her portal (steps 12 to 18, SC-133)

| Where                     | Read                                                                                                                                                 | Held |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Today                     | no card on the Mango Drink: cleared, nothing left for her                                                                                            | yes  |
| Her batch · What happened | the Watcher's flag (the packs at risk, as Priya's case has them), her photo, the plan, the scheme, the staff sale, the pickup, her papers, the round | yes  |
| Her batch · Money         | **she ends whole at ₹0**                                                                                                                             | yes  |
| Her batch · Papers        | CN/0118, and the food bank's receipt FI/HYD/26-27/0417 under the copies for her records                                                              | yes  |
| Her papers' PDFs          | CN/0118 and FI/HYD/26-27/0417 each served from its signed link as `application/pdf`, starting `%PDF`                                                 | yes  |
| Her credit                | the price support, ₹5,932 to the rupee as the ledger has it                                                                                          | yes  |
| Orders                    | the scheme's shops and packets, the staff sale, 58 packs given to Feeding India                                                                      | yes  |
| Deliveries                | the Saturday van round delivered (52 of 58 shops, 1,372 packets), the staff sale recorded 150 of 150, "Feeding India collects · collected"           | yes  |
| Label photo               | every photo she sent, with the made and best-before dates the label reads                                                                            | yes  |

## Findings

- **warning** `/offer/MF-2410-118`: Saraswathi Kirana's story order of 4 cannot be placed (the offer screen orders in
  twelves from its share of 28), so it ordered 16, and Bilal Stores 16 of its 28, so the scheme fills to 1,372
  exactly. As in SC-104's run.
- **note:** part 4 skipped eight steps already done in parts 1 to 3.

No page errors, no failed API calls, and no NaN, undefined or Invalid Date on screen.

## The evidence

`stills/`: the Command Center at the start (01), Execution (02), the papers (03 to 07), Impact's ledger (08), the ESG
(09 to 11), Lakshmi's portal (12 to 18), Batches and the papers processed (19, 20), Execution with every line done (21)
and the Command Center at the end (22).
