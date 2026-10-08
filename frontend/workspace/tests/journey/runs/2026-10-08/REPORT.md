# Munchly Chips E2E: run of 8 Oct 2026

**Passed**, end to end, in 5 min 56 s (65 steps), headed and recorded, on this machine's live stack. The run started
at 21:26 UTC and the journey was reset first. SC-95.

- **What ran:** `E2E_SLOWMO=120 corepack pnpm test:journey --headed` from `frontend/`.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini (`gemini-3.1-pro-preview`, `gemini-3.8-flash`);
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min (Rehearsal), set by the reset.
- **The recording:** `munchly-chips-e2e-2026-10-08.mp4` beside this file, 6 min 8 s. It stays local (git-ignored). A
  caption on screen names who acts and what they do at every step.
- **The record:**
  - `report.json` holds every step, with its time and the figures;
  - `stills/` holds the evidence below.

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
no password was handled. The sign-in form itself was not exercised.

## The journey, against the story

Every line completed: the happy path.

| Stage    | Result                                                                                                                                                                                              | Story |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Detect   | The Watcher flagged MF-2409-117, Blinkit, Zepto and Instamart all failing                                                                                                                           | ✓     |
| Verify   | Vision read Rakesh's label photo, Gemini vision 0.99                                                                                                                                                | ✓     |
| Plan     | ₹21,770 net: 588 packets to the kirana cluster at ₹18 effective, 772 to ExpireSoon at ₹15                                                                                                           | ✓     |
| Approve  | Priya, from the laptop, at 09:40 journey time                                                                                                                                                       | ✓     |
| Execute  | Lot ES-24117 listed; the Hindi scheme pushed to 38 kiranas                                                                                                                                          | ✓     |
| Kiranas  | 31 of 38 ordered all 588 packets; the scheme filled and closed itself                                                                                                                               | ✓     |
| Deal     | Bid ₹13; counter ₹14.20; award 772 at ₹14.20, token ₹1,644                                                                                                                                          | ✓     |
| Dispatch | The buyer's truck loaded; the van round ran, 31 drops, 588 packets                                                                                                                                  | ✓     |
| Papers   | Tax invoice INV/26-27/0931 (₹11,510), price-support credit note CN/0117 (₹8,768), GST ITC memo s.17(5)(h) (₹1,224 kept). E-way bill check, FSSAI checklist and destruction certificate not required | ✓     |
| Review   | Anita marked the pack reviewed                                                                                                                                                                      | ✓     |
| Report   | Expiry day fired from the console; Impact posted the ledger; the batch cleared with 0 packs left at the godown                                                                                      | ✓     |
| Actual   | ₹21,152.40 net, ₹618 under plan (the counter at ₹14.20 against ₹15); a ₹25,722 swing against destroying it                                                                                          | ✓     |
| ESG      | 217.6 kg kept out of landfill; 544 kg CO₂e avoided (indicative); 0 meals (nothing donated); BRSR row with evidence INV/26-27/0931 · ES-24117 · 31 kirana order logs · CN/0117                       | ✓     |

The quarter after the run read:

- ₹6,51,152 recovered;
- ₹80,224 of GST credit protected;
- 5,917.6 kg kept out of landfill;
- 14,250 kg CO₂e avoided;
- 24 batches.

The Mango Drink (MF-2410-118) was flagged by the same Watcher run and left waiting for Lakshmi Agencies' label photo,
as this flow is the chips'.

## Findings

### Bugs

1. **The buyer's "Lot won" bill shows ₹NaN and "IGST undefined%".** It does so from the award until Paperwork drafts
   the invoice. The suite's screen scan caught it at step 47 (`stills/47-…webp`).
   - It reads: "₹9,318 of the bid and ₹NaN IGST due in 48 h"; then "772 × ₹14.20 ₹NaN"; then "IGST undefined%,
     Maharashtra to Chhattisgarh", round off and invoice total all "₹NaN".
   - **The cause:** before the papers, the live projection's invoice is a placeholder with no taxable value, IGST or
     rate (`frontend/workspace/src/lib/live/project.ts`, `caseOf`). ExpireSoon's bill reads it
     (`core/…/screens/trade/ListingView.svelte`).
   - The prototype has its invoice from the start, so it never shows this.
2. **The van round has three different days.** Rakesh's van card reads "Monday round · Mon 5 Oct · from 07:00". The
   push and the feed beside it say "Van route for Saturday". After the round, the agent timeline says "Ran the Friday
   round" (`stills/48-…webp`, `stills/65-…webp`).
   - **The cause:** the card dates the round from the offer's _scheduled_ close, `offer.closesAt`, 48 hours on
     (`backend-api/src/sc_api/services/journey/views.py`, `_moments`). That holds even when the scheme filled and
     closed early, as it does on the happy path.
   - The push uses the day after the papers are drafted (`steps.py`, `push_van`). The round runs whenever Rakesh
     starts it.
3. **The FSSAI checklist contradicts itself on a batch with no donation.** The "not required" paper reads "Nothing from
   this batch was donated. The Masala Chips batch MF-2409-117 has its own checklist: 0 packs to Feeding India, Nagpur"
   (`stills/55-…webp`).
   - **The cause:** the paper's not-required branch names the donated batch from `c.donation`
     (`core/…/screens/finance/Paper.svelte`). On the live workspace, with no donation on the chips, that falls back to
     the chips themselves and 0 packs.
   - In the prototype the sentence points at the Mango Drink, which was donated.

### Display

4. **"₹0 if destroyed" before the Valuer has priced the batch.** On Priya's Command Center at Verify, the chips' card
   reads "₹0 if destroyed · 1,360 units at risk" in red (`stills/06-…webp`). The prototype shows −₹26,330 there.
   - **The cause:** until a plan exists, the live projection uses an empty plan whose write-off is 0
     (`project.ts`, `emptyPlan`).
   - The figure is known from the Watcher's assessment, so it could be shown from Detect.

### Notes

5. **The tax invoice still reads "drafted" in Anita's pack after Rakesh issues it from Tally.** Only Rakesh's own card
   says "issued from Tally". The prototype does the same: issuing sets `invoiceIssued` and leaves the paper's status
   alone. Is that the intended reading for Finance?
6. **No PDFs locally.** The Paperwork agent cannot render PDFs on this machine without Pango (a known gap), so the
   papers carry no PDF here. The agents' image has it.
7. **Nothing else.** No page errors, no failed API calls, and no other NaN, undefined or Invalid Date on any of the 65
   screens.

## On the way to a clean run

Three earlier runs failed on the suite itself, not the product:

- a strict locator matched the toast as well as the badge;
- the session hand-off raced the console's own Firebase start-up, which moves a stored user between localStorage and
  IndexedDB. It now goes through a bare page the suite serves, so no app code runs while the session changes;
- a stale probe file was picked up.

All three are fixed.
