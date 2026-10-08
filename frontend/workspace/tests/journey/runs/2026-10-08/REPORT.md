# Munchly Chips E2E: run of 8 Oct 2026, after the fixes

**Passed**, end to end, in 6 min 41 s (65 steps), headed and recorded, on `main` with SC-96 to SC-100. The run started
at 22:28 UTC, and the suite reset the journey first. SC-101.

- **What ran:** `E2E_SLOWMO=120 corepack pnpm test:journey --headed` from `frontend/`.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini (`gemini-3.1-pro-preview`, `gemini-3.8-flash`), with Pango, so the papers are rendered as PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset.
- **The recording:** `munchly-chips-e2e-2026-10-08.mp4` beside this file, 6 min 42 s. It stays local (git-ignored). A
  caption names who acts and what they do at every step.
- **The record:**
  - `report.json` holds every step, with its time and the figures;
  - `stills/` holds the evidence below.
- **Replaced:** the earlier run of the same day, before the fixes, with its stills and recording. Its findings became
  SC-96 to SC-99, and the PDF bug it led to became SC-100.

## The people

| Character            | Who                            | Signed in to           | What they did                                                                                     |
| -------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------- |
| Staff                | Neha Kulkarni                  | console                | Reset journey; ran the Watcher; fired expiry day's report                                         |
| Supply Chain         | Priya Deshmukh                 | workspace              | Confirmed Setup; approved the plan; watched Execution                                             |
| Distributor          | Rakesh bhai, Rakesh Traders    | workspace              | Allowed the agents; sent the label photo; loaded the truck; issued the invoice; ran the van round |
| Kiranas              | 31 shops of the Nagpur cluster | workspace              | Each ordered its own share of the scheme, 12 to 48 packets                                        |
| Bidder on ExpireSoon | Agrawal ji, Agrawal Wholesale  | workspace (ExpireSoon) | Bid ₹13; took the Negotiator's ₹14.20 counter; paid the token                                     |
| Finance              | Anita Rao                      | workspace              | Read every paper; marked the pack reviewed; read the report                                       |
| ESG                  | Vikram Sethi                   | workspace              | Read the batch's ESG report, its BRSR line and evidence, and the quarter's BRSR Core              |

Each person was signed in with a Firebase custom token minted as sc-api-local (`backend-api/scripts/sessions.sh`), so
no password was handled.

## The journey, against the story

Every line completed: the happy path.

| Stage    | Result                                                                                                                                                                                                                                    | Story |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Detect   | The Watcher flagged MF-2409-117 (Blinkit, Zepto and Instamart all failing); the Command Center reads −₹26,330 if destroyed                                                                                                                | ✓     |
| Verify   | Vision read Rakesh's label photo, Gemini vision 0.99                                                                                                                                                                                      | ✓     |
| Plan     | ₹21,770 net: 588 packets to the kirana cluster at ₹18 effective, 772 to ExpireSoon at ₹15                                                                                                                                                 | ✓     |
| Execute  | Lot ES-24117 listed; the Hindi scheme pushed to 38 kiranas                                                                                                                                                                                | ✓     |
| Kiranas  | 31 of 38 ordered all 588 packets; the scheme filled and closed itself                                                                                                                                                                     | ✓     |
| Deal     | Bid ₹13; counter ₹14.20; award 772 at ₹14.20, token ₹1,644. The Lot won bill reads 772 × ₹14.20 ₹10,962.40, IGST 5% ₹548.00, round off −₹0.40, total ₹11,510.00                                                                           | ✓     |
| Dispatch | The buyer's truck loaded; the Saturday round run, 31 drops, 588 packets                                                                                                                                                                   | ✓     |
| Papers   | Tax invoice INV/26-27/0931 (₹11,510, issued from Tally), price-support credit note CN/0117 (₹8,768), GST ITC memo s.17(5)(h) (₹1,224 kept), each with its PDF. E-way bill check, FSSAI checklist and destruction certificate not required | ✓     |
| Review   | Anita marked the pack reviewed                                                                                                                                                                                                            | ✓     |
| Report   | Expiry day fired from the console; Impact posted the ledger; the batch cleared with 0 packs left at the godown                                                                                                                            | ✓     |
| Actual   | ₹21,152.40 net, ₹618 under plan (the counter at ₹14.20 against ₹15); a ₹25,722 swing against destroying it                                                                                                                                | ✓     |
| ESG      | 217.6 kg kept out of landfill; 544 kg CO₂e avoided (indicative); 0 meals (nothing donated); BRSR row with evidence INV/26-27/0931 · ES-24117 · 31 kirana order logs · CN/0117                                                             | ✓     |

## The fixes, checked in the real UI

The suite now checks each of these as it goes.

| Fix                                  | What the run saw                                                                                                  | Still      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| SC-99, the write-off before the plan | "−₹26,330 if destroyed · 1,360 units at risk" at Detect; backend-api's write-off ₹26,329.60                       | `06-…webp` |
| SC-96, the Lot won bill              | Invoice total ₹11,510.00, IGST 5% ₹548.00, with no ₹NaN or undefined on any screen                                | `47-…webp` |
| SC-100, the papers' PDFs             | The invoice, credit note and ITC memo carry their PDFs, rendered on this Mac into the local docs bucket           | —          |
| SC-97, the van round's day           | "Saturday round" on the Van route, "Van route for Saturday" in the push, "Ran the Saturday round" in the timeline | `50-…webp` |
| SC-98, the FSSAI paper               | "Nothing from this batch was donated." and nothing more                                                           | `55-…webp` |

## Findings

**Note.** The tax invoice still reads "drafted" in Anita's pack after Rakesh issued it from Tally. Only Rakesh's own
card says "issued from Tally". The prototype does the same: issuing sets `invoiceIssued` and leaves the paper's status
alone. Is that the intended reading for Finance?

**Nothing else.** No page errors, no failed API calls, and no NaN, undefined or Invalid Date on any of the 65 screens.
