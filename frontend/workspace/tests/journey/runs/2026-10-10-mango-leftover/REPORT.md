# Munchly Mango Leftover E2E: run of 10 Oct 2026

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad), from a console Reset journey, with kiranas
that do not buy: the packs they left at the godown settle on expiry day by Munchly's policy, full credit. Every screen
and paper is read back and held to the ledger row backend-api posted. SC-135.

**Passed** end to end in 10 min 1 s (122 steps), headless and recorded, on branch `SC-135-mango-leftover-e2e`, with no
soft failure.

- **What ran:** `corepack pnpm test:journey:mango-leftover` from `frontend/` (`E2E_LEFTOVER` 10, `E2E_DECLINE` 2).
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango, so the papers are rendered as PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset, then put back to 24 hours.
- **The journey is left as the run ended:** the Mango Drink cleared and in the ledger. The reset took the chips back to
  day 0, so they are not flagged.
- **The recording:** `munchly-mango-leftover-e2e-2026-10-10.mp4` beside this file, 10 min, H.264. It stays local
  (git-ignored). A caption names who acts at every step.
- **The record:**
  - `report.json`: every step, with its time and figures;
  - `stills/`: 49 of the 122 steps;
  - `exports/`: the GST summary and the BRSR table Priya exported, and the five PDFs the Paperwork agent laid out.
- **Three attempts before it, the same morning:**
  - the first stopped on the suite: a reset leaves Lakshmi Agencies' permission given (the story gives it at 08:30);
  - the second reached Meera's receipt (110 steps) and found the memo's count and the header (below);
  - the third passed every step, but found Lakshmi Agencies' batch page short of its moments (below).

## The people

| Character    | Who                               | What they did                                                                                |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Staff        | Neha Kulkarni                     | Reset journey; ran the Watcher; closed the kiranas' offer window early; fired expiry day     |
| Supply Chain | Priya Deshmukh                    | Confirmed Setup; approved the plan; reviewed the pack; read every paper, the GST and the ESG |
| Distributor  | Lakshmi Agencies                  | Sent the label photo; recorded the staff sale; ran the van round; read her portal            |
| Kiranas      | 52 shops of the Hyderabad cluster | 42 ordered their share; 2 said Not this time; 8 read the scheme and let it go                |
| Food bank    | Meera, Feeding India              | Confirmed and collected the pickup; read her receipt                                         |

## The journey

| Stage          | Result                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Detect         | 1,580 packs at risk; −₹22,657.20 if destroyed                                                              |
| Plan           | ₹16,917.10 net: 1,372 to the kiranas, 150 to staff, 58 to Feeding India                                    |
| Kiranas        | 58 offered; 42 ordered 1,124 packets; Irani Gali Provisions and Satyanarayana Stores declined; 8 let it go |
| Staff sale     | 150 of 150 recorded                                                                                        |
| Donation       | 58 packs collected by Feeding India, receipt FI/HYD/26-27/0417                                             |
| The window     | closed early from the console: 248 packets not ordered, left at the godown                                 |
| Papers and van | the pack drafted with its PDFs; the Saturday round to the 42 shops that ordered                            |
| Expiry day     | 248 packs settled at full credit: CN/0118 for ₹3,596 to Lakshmi Agencies; Munchly destroys them            |
| The close      | actual ₹14,065.10; cleared; outcome "left at the godown"                                                   |

## The papers, each read on its page and as its PDF

| Paper                         | Read                                                                                                                        | PDF                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Price-support credit note     | CN/0117, ₹5,188, no GST adjustment                                                                                          | read back as text   |
| Expiry credit note            | CN/0118: 248 packs expired at the godown, ₹3,596 at the dealer price (₹14.50), Munchly's own costs                          | read back as text   |
| GST ITC memo                  | ITC PART REVERSED: 1,274 packs sold keep ₹700.70; 306 donated or destroyed reverse ₹168.30 (₹0.55 each)                     | read back as text   |
| Destruction certificate       | GENERATED: 248 units destroyed, ₹136.40 of input GST reversed                                                               | none, by design (1) |
| FSSAI surplus-food checklist  | GENERATED: 58 packs donated to Feeding India                                                                                | read back as text   |
| Donation receipt              | FI/HYD/26-27/0417: 58 packs, 58 meals, issued by Feeding India                                                              | read back as text   |
| Tax invoice, e-way bill check | none: the Mango's plan has no ExpireSoon lot (22 days left, under ExpireSoon's 30), so there is no sale under a tax invoice | —                   |

(1) The Paperwork agent lays out the papers people sign (`agents/src/sc_agents/tools/pdf.py`); the destruction
certificate and the e-way bill check are records on the case, so neither Priya's pack nor Lakshmi Agencies' copy offers
a PDF for them.

## The money, as the ledger posted it

| Figure                           | Value                                                              |
| -------------------------------- | ------------------------------------------------------------------ |
| Recovered (net)                  | ₹14,065.10, against the ₹16,917.10 planned                         |
| Better than destroying (swing)   | ₹18,513.98                                                         |
| P&L                              | −₹4,143.22, where destroying the batch would have cost −₹22,657.20 |
| Price support to the distributor | ₹5,188 (CN/0117)                                                   |
| Expiry credit to the distributor | ₹3,596 (CN/0118, 248 packs at ₹14.50)                              |
| Input GST kept / reversed        | ₹700.70 / ₹168.30                                                  |
| Lakshmi Agencies                 | ends whole: her gain or loss ₹0                                    |

The GST summary (`exports/GST-summary-Q3-FY27.csv`) carries the same row: no tax invoice, CN/0117 ₹5,188, CN/0118
₹3,596, ₹700.70 kept, ₹168.30 reversed under s.17(5)(h). The ledger's GST reading for Q3 FY27 matches it.

## The ESG impact

| Figure                  | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| Kept out of landfill    | 286.38 kg: 273.91 kg resold, 12.47 kg donated                                  |
| Destroyed               | 53.32 kg (the 248 packs), 0.5 kg of plastic packaging                          |
| CO₂e avoided            | 716 kg                                                                         |
| Meals                   | 58, from Feeding India's receipt                                               |
| Plastic packaging (EPR) | 2.67 kg diverted                                                               |
| BRSR evidence           | CN/0117, CN/0118, FI/HYD/26-27/0417, in the BRSR table and on the batch's line |

The year so far: 13 batches, ₹2,34,448.68 recovered, ₹16,555.48 of input GST kept, 2.25 t kept out of landfill,
5.61 t CO₂e avoided.

## Every person's screens

- **Priya:** the Command Center at Detect; the Route Room, the approve sheet and Plan placed; Execution as the scheme
  stays open, closes short, then Left at the godown and the Expiry settlement ("The 248 packs come back to Munchly for
  full credit (₹3,596), and Munchly destroys them."), opening the paper; the pack, reviewed, with the head reading
  "Cleared · 248 packs destroyed"; the ledger's GST and Impact readings and both exports; Batches, the papers processed.
- **The kiranas:** a shop that ordered reads its order and its Orders; Irani Gali Provisions' offer reads Declined;
  Farhan General Store's reads Expired.
- **Meera:** Pickups, the meals and the collected pickup; its page with the tracker, the receipt and the FSSAI
  checklist; the receipt in a sheet with its PDF.
- **Lakshmi Agencies:** Today with nothing left on the Mango; her batch's page: every moment from the flag to "248
  packs expired at your godown … on CN/0118", her money (from her kiranas, her staff sale, both credit notes, ₹0), her
  papers with copies of the receipt and the destruction certificate, each PDF served; Orders; Deliveries.

## Found and fixed on this branch

- **The GST ITC memo counted the donation only.** It read "Destroyed, gifted or lost: 58" and "The 58 packs … have their
  credit reversed" beside a reversal of ₹168.30, which is 306 packs. backend-api's case view (`views.doc_out`) dropped
  the memo's `away` count, so the screen fell back to the plan's donation. Its PDF was right all along. Fixed, with a
  backend test that fails without it.
- **The batch's head read "Cleared · 0 cartons destroyed" for every batch.** It now counts what expired at the godown:
  "Cleared · 248 packs destroyed". The story's batch, which destroys none, reads as before (core `model.ts`).
- **The distributor's page of the journey's own batch, once cleared, left out its moments.** It read the journey's
  state, which a distributor gets without the staff sale, the pickup, the packets not ordered and the expiry, and ended
  "Settled: you ended whole". Once cleared, it now reads her partner facts, as every batch she cleared before does
  (core `DistBatch.svelte`). Its Money then reads as theirs do. A live test covers it.

## Findings left

- **note:** a kirana's expired offer reads "Its 48 hours ended", and Lakshmi Agencies' page "The scheme closed after 48
  hours", though Neha closed the window early from the console (a demo control).
- **note:** Lakshmi Agencies had already given her permission at the reset (the story's own).

No page errors, no failed API calls, and no NaN, undefined or Invalid Date on screen.
