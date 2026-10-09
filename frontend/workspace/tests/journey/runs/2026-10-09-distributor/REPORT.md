# Munchly Chips E2E: run of 9 Oct 2026, with Priya's tax and ESG and Rakesh's portal

**Passed**, end to end, in 6 min 45 s (77 steps), headless and recorded. It ran on branch `SC-133-distributor-portal`, with the distributor's portal batch by batch (SC-133) and the suite's new step that reads it back. The run started at 22:39 UTC, and the suite reset the journey first. SC-133.

- **What ran:** `corepack pnpm test:journey` from `frontend/`.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango, so the papers are rendered as PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset, and put back to 24 hours once the run ended (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** the chips cleared and in the ledger. Nothing was reset after it.
- **The recording:** `munchly-chips-e2e-2026-10-09-distributor.mp4` beside this file, 6 min 46 s, H.264. It stays local (git-ignored). A caption names who acts and what they do at every step.
- **The record:**
  - `report.json` holds every step, with its time and the figures;
  - `stills/` holds the evidence below;
  - `exports/` holds the GST summary and the BRSR table Priya downloaded from the ledger.
- **Three earlier attempts the same evening**, each from a reset:
  - the first stopped at the permission: on a quiet Today, before any batch was flagged, SC-133's Today showed Rakesh no permission card. Fixed: he gives his own permission there;
  - the second stopped after Issue from Tally, on the suite's own selector ("issued from Tally" now also reads on his cleared batches' orders). It now reads the chips' own order;
  - the third passed every step but one soft check, also the suite's: it held the price support exactly (₹8,767.60) to the credit note's rupees (₹8,768). It now compares to the rupee.

  Before this run, the new step's checks were drawn on the live fixtures, which found two figures on his batch's page: "What happened" counted the whole batch (1,840) as flagged, and his label photo was dated from its shelf life (22 May). Both fixed: 1,360 packs flagged, made 18 May as the label reads.

## The people

| Character            | Who                            | Signed in to           | What they did                                                                                                      |
| -------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Staff                | Neha Kulkarni                  | console                | Reset journey; ran the Watcher; fired expiry day's report                                                          |
| Supply Chain         | Priya Deshmukh                 | workspace              | Confirmed Setup; approved the plan; reviewed every paper; verified the tax and the ESG on the ledger; Execution    |
| Distributor          | Rakesh bhai, Rakesh Traders    | workspace              | Allowed the agents; sent the label photo; loaded the truck; issued the invoice; ran the van round; read his portal |
| Kiranas              | 31 shops of the Nagpur cluster | workspace              | Each ordered its own share of the scheme, 12 to 48 packets                                                         |
| Bidder on ExpireSoon | Agrawal ji, Agrawal Wholesale  | workspace (ExpireSoon) | Bid ₹13; took the Negotiator's ₹14.20 counter; paid the token                                                      |

Each person was signed in with a Firebase custom token minted as sc-api-local (`backend-api/scripts/sessions.sh`), so no password was handled.

## The journey, against the story

Every line completed: the happy path. Every figure is the story's.

| Stage      | Result                                                            | Story |
| ---------- | ----------------------------------------------------------------- | ----- |
| Detect     | −₹26,330 if destroyed on the Command Center                       | yes   |
| Plan       | ₹21,770 net: 588 to the kiranas, 772 to ExpireSoon                | yes   |
| Kiranas    | 38 offered, 31 ordered 588 packets                                | yes   |
| ExpireSoon | 772 at ₹14.20, a ₹1,644 token; the Lot won bill ₹11,510.00        | yes   |
| Papers     | INV/26-27/0931, CN/0117, the GST ITC memo, each with its PDF      | yes   |
| Van round  | the Saturday round on Deliveries, in its push and in the timeline | yes   |
| The close  | actual ₹21,152.40, nothing left at the godown, cleared            | yes   |

## Priya verifies the tax (steps 60 to 64)

Each figure was read on screen and in the export, and held to the ledger row backend-api posted and to the story.

| What she checked                                    | Read                                                                                      | Story |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- |
| The ledger's GST reading, Q3 FY27                   | ₹1,224 of input credit kept; ₹0 reversed; every pack reviewed                             | yes   |
| The GST summary (`exports/GST-summary-Q3-FY27.csv`) | INV/26-27/0931 for ₹11,510; CN/0117 for ₹8,768; ₹1,224 kept; ₹0 reversed under s.17(5)(h) | yes   |
| The GST ITC memo                                    | stamped ITC KEPT                                                                          | yes   |
| The memo's PDF                                      | served from its signed link as `application/pdf`, starting `%PDF`                         | yes   |
| The tax invoice and the credit note                 | INV/26-27/0931 and CN/0117 on paper                                                       | yes   |
| Who reviewed the pack                               | Priya                                                                                     | yes   |

## Priya verifies the ESG (steps 65 to 67)

| What she checked                                     | Read                                                                                                       | Story |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----- |
| The ledger's Impact reading, Q3 FY27                 | as posted                                                                                                  | yes   |
| The BRSR table (`exports/BRSR-P6-waste-Q3-FY27.csv`) | 217.6 kg diverted, all resold, 0 donated, 0 disposed; plastic packaging (EPR) 8.16 kg diverted             | yes   |
| The batch's BRSR line and its evidence               | 217.6 kg diverted, 544 kg CO₂e avoided, 0 meals (nothing donated); INV/26-27/0931 and CN/0117              | yes   |
| The year so far                                      | 13 batches, ₹2,41,535.98 recovered, ₹17,078.78 of input GST kept, 2.18 t kept out of landfill, 5.44 t CO₂e | —     |

## Rakesh reads his portal (steps 68 to 74, SC-133)

Each read on screen, held to the ledger row, his partner facts (`GET …/partner`) and the story.

| Where                     | Read                                                                                                                                                                                     | Held |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Today                     | no card on the chips: cleared, his invoice issued, nothing left for him                                                                                                                  | yes  |
| His batch · What happened | the Watcher flagged 1,360 packs; his photo; the plan; 772 listed in his name; the scheme to 38 kiranas; ₹14.20 taken; 31 ordered 588; his truck; his papers; the Saturday round; settled | yes  |
| His batch · Money         | from his kiranas ₹10,584, from Agrawal Wholesale ₹10,962, the price-support credit note ₹8,768; what he paid 1,360 × ₹22, the van and the fee; **he ends whole at ₹0**                   | yes  |
| His batch · Papers        | INV/26-27/0931 (he issues it), CN/0117 (Munchly issued it to him), each opening on paper with Download PDF                                                                               | yes  |
| His papers' PDFs          | INV/26-27/0931 and CN/0117 each served from its signed link as `application/pdf`, starting `%PDF`                                                                                        | yes  |
| His credit                | the price support ₹8,767.60, ₹8,768 on CN/0117 as the ledger has it                                                                                                                      | yes  |
| Orders                    | lot ES-24117 · 772 × ₹14.20 on INV/26-27/0931, issued from Tally (₹10,962); 31 kiranas · 588 packets at ₹21.60, 2 free with every 10 (₹10,584)                                           | yes  |
| Deliveries                | the Saturday van round delivered, 31 of 38 shops, 588 packets; the buyer's truck collected; his stops in order; then his earlier deliveries                                              | yes  |
| Label photo               | no request now; the chips' photo: Vision read batch MF-2409-117, made 18 May 2026, best before 18 Nov 2026, MRP ₹30.00                                                                   | yes  |

## Findings

- **note** `/paperwork/MF-2409-117`: the tax invoice still reads "drafted" in Priya's pack after Rakesh issued it from Tally (as in the prototype).

No page errors, no failed API calls, and no NaN, undefined or Invalid Date on screen.

## The evidence

`stills/`: the permission (04), Vision's read (08), the plan and its yes (09, 11), the first kirana's order (13), the deal (47), the truck (48), Issue from Tally (49), the van round (50), Impact's ledger (59), the tax (60, 62, 64), the ESG (65, 67), Rakesh's portal (68 to 74) and the Command Center at the end (77).
