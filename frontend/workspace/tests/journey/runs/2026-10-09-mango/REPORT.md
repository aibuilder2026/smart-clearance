# Munchly Mango E2E: run of 9 Oct 2026

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad), taken on from where its journey stood to
Impact's report, with **no reset**. SC-104.

**Passed end to end, in two parts**, headed and recorded, on `main` (`d4ec3f9`) plus the flow and SC-105:

1. **Part 1** (7 min 7 s, 67 steps) took the batch from Verify through the label photo, the plan, the 52 kiranas, the
   staff sale, the donation, the papers and the van round. It stopped at Anita's review: opening the GST ITC memo
   blanked the Paperwork screen.
2. **The fix:** SC-105 was filed and fixed (the memo now reads the plan's per-pack input credit).
3. **Part 2** (1 min, 16 steps) ran the same flow again. It read the state, skipped every step already done, and went
   on from the review to the ledger.

- **What ran:** `E2E_SLOWMO=120 corepack pnpm test:journey:mango --headed` from `frontend/`, twice.
- **The stack:**
  - backend-api on :8000;
  - the agents' pull worker on live Gemini, with Pango for the PDFs;
  - the workspace app's dev server on :5175 and the console's on :5174.
- **The journey day:** 60 min, as the earlier reset (SC-101) had left it.
- **The recording:** `munchly-mango-e2e-2026-10-09.mp4` beside this file, 7 min 55 s. It runs part 1 up to the blank
  screen, then a card on the fix, then part 2. It stays local (git-ignored). A caption names who acts at every step.
- **The record:**
  - `report-part1.json` and `report-part2.json` hold every step, with its time, figures and findings;
  - `stills/` holds the evidence below (`p1-…`, `p2-…`).

## Where it stood

|                                   |                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Phase                             | at-risk, at Verify: the Watcher flagged it on day 0; Vision asked Lakshmi Agencies for the label photo |
| Plan, offer, staff sale, donation | none yet                                                                                               |
| Write-off shown                   | ₹22,657 at the start; the chips (MF-2409-117) already cleared                                          |

## The people

| Character    | Who                               | What they did                                                                                        |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Distributor  | Lakshmi Agencies                  | Sent the label photo; recorded the staff sale; ran the van round                                     |
| Supply Chain | Priya Deshmukh                    | Read where the batch stood; approved the plan; watched Execution                                     |
| Kiranas      | 52 shops of the Hyderabad cluster | Each ordered its share of the scheme, in the offer screen                                            |
| Food bank    | Meera, Feeding India              | Confirmed the pickup; collected the donation                                                         |
| Finance      | Anita Rao                         | Read every paper; marked the pack reviewed; found the batch Cleared on Batches and opened its papers |
| Staff        | Neha Kulkarni, console            | Fired expiry day's report                                                                            |
| ESG          | Vikram Sethi                      | Read the batch's ESG report, its BRSR line, and the quarter's BRSR Core                              |

Each person was signed in with a Firebase custom token minted as sc-api-local, so no password was handled.

## The journey

Every line completed: the happy path.

| Stage      | Result                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verify     | Lakshmi Agencies uploaded the label photo; Vision read it                                                                                                                                                    |
| Plan       | ₹16,887.70 net: 1,372 packets to 58 Hyderabad kiranas at ₹12 effective, 150 to the staff sale at ₹8, 86 to Feeding India                                                                                     |
| Approve    | Priya, at her desk                                                                                                                                                                                           |
| Execute    | the Hindi scheme to 58 kiranas; the staff sale open; 86 packs booked with Feeding India                                                                                                                      |
| Kiranas    | 52 of 58 ordered all 1,372 packets; the scheme filled and closed itself                                                                                                                                      |
| Staff sale | 150 of 150 sold to staff at ₹8 a pack, recorded at the Begum Bazaar godown                                                                                                                                   |
| Donation   | Meera confirmed Sunday 10 am and collected 86 packs: "86 drinks served", an in-app receipt for the BRSR table                                                                                                |
| Papers     | Price-support credit note CN/0118 (₹6,338), GST ITC memo (₹837 kept, ₹47.30 reversed on the donated packs), FSSAI surplus-food checklist (86 units), each with its PDF; destruction certificate not required |
| Van round  | "Van route for Sunday" in the push, the Sunday round on the Van route, "Ran the Sunday round" in the timeline                                                                                                |
| Review     | Anita marked the pack reviewed                                                                                                                                                                               |
| Report     | Expiry day fired from the console; Impact posted the ledger; the batch cleared                                                                                                                               |
| Actual     | ₹16,887.70 net, the plan's own: kirana 1,372, staff 150, food bank 86, nothing left at the godown                                                                                                            |
| ESG        | ₹16,888 recovered; ₹22,258 better than destroying it; ₹837 GST credit kept; 345.7 kg out of landfill; 864 kg CO₂e avoided (indicative)                                                                       |
| After      | Anita's Batches reads the Mango Drink Cleared, and the row opens its processed, reviewed papers (SC-102, SC-103)                                                                                             |

**The quarter after the run:**

- ₹6,68,040 recovered;
- ₹81,061 of GST credit protected;
- 6,263.3 kg out of landfill;
- 3,786 meals;
- 25 batches.

## Findings

### Bug, fixed in this run

1. **SC-105: opening the Mango Drink's GST ITC memo blanked the whole Paperwork screen.**
   - The console read `Cannot read properties of undefined (reading 'toFixed')`. The rest of the papers and Mark
     reviewed went with it (`stills/p1-68-…`).
   - The memo read `c.sku.itcPerUnit`, which only the chips' SKU carries.
   - It now reads the plan's write-off `itcPerUnit`, ₹0.55 a pack for the Mango (`stills/p2-04-…`).

### Bugs, not fixed

2. **The batch's BRSR line says "0 meals (nothing donated)" for a batch that donated 86 packs** (`stills/p2-11-…`).
   - The sentence is written as text in design3's and the port's Finance & ESG report, from the chips' story, which
     had no donation.
   - The BRSR export's row for the batch also puts 0 in the donated column.
   - Meera's receipt says 86 drinks served.
3. **The batch's evidence line reads "Evidence: · · 52 kirana order logs · CN/0118".** It joins an invoice number and
   a lot that a batch with no ExpireSoon line does not have.
4. **Paperwork's subtitle says "prepared by the Paperwork agent at the award"** for a batch that had no award. Its
   papers followed the last of its lines.

### Data against the offer screen

5. **Saraswathi Kirana's story order of 4 packets cannot be placed.**
   - The offer screen orders in twelves from the shop's share (28), down to 12, so it can place only 28, 16 or 12.
     backend-api accepts 1 to 28.
   - To fill the scheme's 1,372 to the packet, the run ordered 16 for Saraswathi and 16 for Bilal Stores (its story
     share is 28). The other 50 shops ordered their story shares (`stills/p1-58-…`, `p1-59-…`).

### Notes

6. **The plan was made on journey day 1**, when the label photo came: ₹16,887.70 against the story's day-0 ₹16,917.10.
   A day's sales (28 packs) more were at risk, and the Router sent them to the food bank: 86 packs for the story's 58.
   That is the dynamic logic working, not a defect. The flow checks each figure against the batch's own plan.
7. **Nothing else:** no failed API calls, and no NaN, undefined or Invalid Date on any screen.
