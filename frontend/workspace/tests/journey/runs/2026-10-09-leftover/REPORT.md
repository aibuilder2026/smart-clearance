# Munchly Chips Leftover E2E: run of 9 Oct 2026

The Masala Chips 150 g batch (MF-2409-117, Rakesh Traders, Nagpur) from a fresh journey to Impact's report. Eight of
Rakesh's kiranas did not order, so 144 packets were left at the godown, and the batch was closed from the console with
Report now. SC-116.

**Passed** in 6 min 0 s, 67 steps, headed and recorded, on branch `SC-116-chips-leftover-e2e` (`d30e1fb`).

- **What ran:** `E2E_SLOWMO=120 corepack pnpm test:journey:leftover --headed` from `frontend/` (`E2E_LEFTOVER` 8, the
  default).
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango for the PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset.
- **The recording:** `munchly-chips-leftover-e2e-2026-10-09.mp4` beside this file, 6 min 1 s. It stays local
  (git-ignored). A caption names who acts at every step.
- **The record:** `report.json` holds every step, with its time, figures and findings; `stills/` holds the evidence
  below.

It took four runs. Runs 1 to 3 each stopped on the suite, not the product:

1. **Run 1** had Rakesh load the buyer's truck while the scheme was open, which backend-api refuses ("The kirana scheme
   is still open until 04 Oct, 08:36"). The truck step was dropped: on expiry day the accepted lot counts as collected.
2. **Run 2** read the expiry paper for "Packs expired at the godown"; a full-credit paper reads "144 packs expired at
   the godown". The check now ignores case.
3. **Run 3** stopped when Anita's Mark reviewed was refused on the cleared batch, a product bug (SC-117, below). The
   suite now keeps it as a finding and goes on.

## The people

| Character         | Who                    | What they did                                                                                   |
| ----------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| Smart-Clearance   | Neha Kulkarni          | Reset the journey; ran the Watcher; fired Report now ("Expire it and report now?")              |
| Supply Chain      | Priya Deshmukh         | Confirmed Setup; approved the plan; read Left at the godown and the Expiry settlement           |
| Distributor       | Rakesh bhai            | Gave the permission; sent the label photo                                                       |
| Kiranas, ordering | 23 of Rakesh's kiranas | Ordered their story share: 444 packets                                                          |
| Kiranas, not      | 8 of Rakesh's kiranas  | Opened the scheme and placed no order: 144 packets                                              |
| ExpireSoon buyer  | Agrawal ji             | Bid ₹13, took the Negotiator's ₹14.20 counter, paid the ₹1,644 token                            |
| Finance           | Anita Rao              | Read every paper, the Expiry credit note first; Mark reviewed refused (SC-117); read the report |
| ESG               | Vikram Sethi           | Read the batch's ledger row, its BRSR line and the quarter's BRSR Core                          |

The eight that did not order: Shubham Provision (36), Mauli Kirana (12), Ekta Super Bazaar (24), Pooja Provision (12),
Tulsi Kirana (12), Vithal Stores (12), Anand General Store (24) and Sainath Kirana (12).

## The figures

|                            | Planned                                   | This run                                                                                    |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Kiranas                    | 588 packets, 31 ordering of 38 offered    | 444 packets from 23 shops                                                                   |
| ExpireSoon                 | 772 at ₹15                                | 772 at ₹14.20, token ₹1,644, invoice total ₹11,510.00                                       |
| Left at the godown         | 0                                         | 144 packs, at Kalamna Market godown                                                         |
| Net                        | ₹21,770                                   | ₹18,632.40                                                                                  |
| Scheme at Report now       | (fills and closes)                        | still open; closed by expiry day                                                            |
| Buyer's truck              | loaded by Rakesh                          | counted as dispatched on expiry day                                                         |
| Expiry settlement          | (none)                                    | full credit: ₹3,168 to Rakesh Traders                                                       |
| Munchly's own expiry costs | (none)                                    | disposal ₹216, EPR ₹138.24, GST reversed ₹129.60                                            |
| The papers                 | INV/26-27/0931, CN/0117, the GST ITC memo | the same, plus the Expiry credit note CN/0118 and the destruction certificate for 144 units |

The settlement, as Execution says it: "The 144 packs come back to Munchly for full credit (₹3,168), and Munchly destroys
them."

## Findings

- **SC-117 (bug, filed):** a pack drafted on expiry day can never be reviewed. Report now drafts the papers and clears
  the batch at once; Paperwork still offers Mark reviewed, and backend-api answers 404, "No such batch in a journey",
  since a step finds only an open case. Rakesh's "Issue from Tally" is the same, so the tax invoice stays "drafted".
- **Noted, not filed:**
  - Rakesh's "Load the buyer's truck" is offered while the scheme is open, and refused only once pressed;
  - Impact's ledger line on the timeline reads "The return window closed on 29 Oct" for a report fired on 2 Oct.

## The stills

- `01` the reset in the console; `06` the chips flagged at Detect, −₹26,330 if destroyed; `09` the plan in the Route
  Room; `12` Execution with the lot listed and the scheme sent.
- `36` Shubham Provision reads the scheme and does not order; `44` Execution at 444 of 588 packets, the scheme open.
- `48` Agrawal takes the counter; `49` Report now, "Expire it and report now?"; `50` Impact posted the ledger.
- `51` Paperwork opens on the Expiry credit note; `57` the destruction certificate, 144 units; `59` Mark reviewed
  refused (SC-117).
- `60` Left at the godown, 144 packs; `61` the Expiry settlement, full credit; `62` the paper, from Execution.
- `63`, `64` Vikram's ESG report; `67` the Command Center at the end.
