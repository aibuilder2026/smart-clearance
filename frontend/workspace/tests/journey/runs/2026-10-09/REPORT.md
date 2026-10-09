# Munchly Chips E2E: run of 9 Oct 2026, with Priya's tax and ESG

**Passed**, end to end, in 8 min 24 s (70 steps), headed and recorded. It ran on branch `SC-128-tax-esg-e2e`, `main` (SC-121 to SC-127) plus the suite's new tax and ESG steps. The run started at 17:29 UTC, and the suite reset the journey first. SC-128.

- **What ran:** `E2E_SLOWMO=120 corepack pnpm test:journey --headed` from `frontend/`.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango, so the papers are rendered as PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset, and put back to 24 hours once the run ended (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** the chips cleared and in the ledger; the Mango Drink flagged and waiting for Lakshmi Agencies' label photo. Nothing was reset after it.
- **The recording:** `munchly-chips-e2e-2026-10-09.mp4` beside this file, 8 min 25 s, H.264. It stays local (git-ignored). A caption names who acts and what they do at every step.
- **The record:**
  - `report.json` holds every step, with its time and the figures;
  - `stills/` holds the evidence below;
  - `exports/` holds the GST summary and the BRSR table Priya downloaded from the ledger.
- **An earlier attempt the same evening** stopped at the ESG step, on the suite's own selector: the recording's caption also reads "BRSR line". Every tax figure had matched by then. The step now reads the page only, and was checked on its own (`E2E_FROM=esg`, no reset) before this run.

## The people

Anita and Vikram are gone (SC-127). Priya does the review, the tax and the ESG.

| Character            | Who                            | Signed in to           | What they did                                                                                                   |
| -------------------- | ------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Staff                | Neha Kulkarni                  | console                | Reset journey; ran the Watcher; fired expiry day's report                                                       |
| Supply Chain         | Priya Deshmukh                 | workspace              | Confirmed Setup; approved the plan; reviewed every paper; verified the tax and the ESG on the ledger; Execution |
| Distributor          | Rakesh bhai, Rakesh Traders    | workspace              | Allowed the agents; sent the label photo; loaded the truck; issued the invoice; ran the van round               |
| Kiranas              | 31 shops of the Nagpur cluster | workspace              | Each ordered its own share of the scheme, 12 to 48 packets                                                      |
| Bidder on ExpireSoon | Agrawal ji, Agrawal Wholesale  | workspace (ExpireSoon) | Bid ₹13; took the Negotiator's ₹14.20 counter; paid the token                                                   |

Each person was signed in with a Firebase custom token minted as sc-api-local (`backend-api/scripts/sessions.sh`), so no password was handled.

## The journey, against the story

Every line completed: the happy path. Every figure is the story's.

| Stage      | Result                                                       | Story |
| ---------- | ------------------------------------------------------------ | ----- |
| Detect     | −₹26,330 if destroyed on the Command Center                  | yes   |
| Plan       | ₹21,770 net: 588 to the kiranas, 772 to ExpireSoon           | yes   |
| Kiranas    | 38 offered, 31 ordered 588 packets                           | yes   |
| ExpireSoon | 772 at ₹14.20, a ₹1,644 token; the Lot won bill ₹11,510.00   | yes   |
| Papers     | INV/26-27/0931, CN/0117, the GST ITC memo, each with its PDF | yes   |
| Van round  | the Saturday round in its push and in the timeline           | yes   |
| The close  | actual ₹21,152.40, nothing left at the godown, cleared       | yes   |

## Priya verifies the tax (steps 60 to 64)

Each figure was read on screen and in the export, and held to the ledger row backend-api posted and to the story.

| What she checked                                    | Read                                                                                      | Story |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- |
| The ledger's GST reading, Q3 FY27                   | ₹1,224 of input credit kept; ₹0 reversed; 1 invoice, 1 credit note, every pack reviewed   | yes   |
| The GST summary (`exports/GST-summary-Q3-FY27.csv`) | INV/26-27/0931 for ₹11,510; CN/0117 for ₹8,768; ₹1,224 kept; ₹0 reversed under s.17(5)(h) | yes   |
| The GST ITC memo                                    | stamped ITC KEPT; 1,360 packets sold under tax invoices at ₹0.90 a pack                   | yes   |
| The memo's PDF                                      | served from its signed link as `application/pdf`, starting `%PDF`                         | yes   |
| The tax invoice and the credit note                 | INV/26-27/0931 and CN/0117 on paper                                                       | yes   |
| Who reviewed the pack                               | Priya                                                                                     | yes   |

## Priya verifies the ESG (steps 65 to 67)

| What she checked                                     | Read                                                                                                                    | Story |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| The ledger's Impact reading, Q3 FY27                 | 217.6 kg resold, 0 kg donated, 0 meals, 0 kg destroyed, 544 kg CO₂e avoided                                             | yes   |
| The BRSR table (`exports/BRSR-P6-waste-Q3-FY27.csv`) | food waste 217.6 kg diverted, all resold; plastic packaging (EPR) 8.16 kg; the batch's evidence INV/26-27/0931; CN/0117 | yes   |
| The batch's BRSR line                                | 217.6 kg diverted from disposal · 0 kg destroyed · 544 kg CO₂e avoided · 0 meals (nothing donated)                      | yes   |
| Its evidence                                         | INV/26-27/0931 · ES-24117 · 31 kirana order logs · CN/0117                                                              | yes   |

**The year so far** (the twelve history batches and the chips, 13 in all): ₹2,41,535.98 recovered, ₹17,078.78 of input GST kept, 2.18 t kept out of landfill, 5.44 t CO₂e avoided.

## Findings

- **note:** the tax invoice still reads "drafted" in Priya's pack after Rakesh issued it from Tally, as in the prototype.

No page errors, no failed API calls, and no NaN, undefined or Invalid Date on any screen.

## Stills

| Still                                                      | What it shows                                |
| ---------------------------------------------------------- | -------------------------------------------- |
| `06-Command-Center-the-chips-at-risk-Vision-waiting-.webp` | Detect: −₹26,330 if destroyed                |
| `09-Route-Room-the-plan-waiting-for-a-yes.webp`            | The plan at ₹21,770                          |
| `47-Agrawal-took-the-counter-and-paid-the-token.webp`      | The Lot won bill                             |
| `54-Paper-GST-ITC-memo-s-17-5-h-.webp`                     | The memo at the review                       |
| `57-Pack-reviewed.webp`                                    | Priya's review                               |
| `59-Impact-posted-the-ledger.webp`                         | The ledger posted                            |
| `60-Tax-Q3-FY27-in-the-GST-reading.webp`                   | The GST reading: ₹1,224 kept                 |
| `61-Tax-the-GST-summary-exported-GST-summary-Q3-FY27.webp` | The GST summary exported                     |
| `62-Tax-the-GST-ITC-memo-with-its-PDF.webp`                | The memo stamped ITC KEPT, with Download PDF |
| `63-Tax-the-tax-invoice-INV-26-27-0931.webp`               | The tax invoice                              |
| `64-Tax-the-price-support-credit-note-CN-0117.webp`        | The credit note                              |
| `65-ESG-Q3-FY27-in-the-Impact-reading.webp`                | The Impact reading: 218 kg                   |
| `66-ESG-the-BRSR-table-exported-BRSR-P6-waste-Q3-FY2.webp` | The BRSR table exported                      |
| `67-ESG-the-batch-s-BRSR-line-and-its-evidence.webp`       | The batch's BRSR line and evidence           |
| `70-Command-Center-at-the-end.webp`                        | The Command Center at the end                |
