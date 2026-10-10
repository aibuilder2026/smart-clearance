# Munchly Chips E2E on production: run of 10 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to Impact's report, every
person acting in the deployed apps, on production's own stack, with nothing local running. SC-137.

**Passed end to end** in 10 min 33 s, 77 steps, headless and recorded, from a reset. Every figure is the story's, and
the tax and the ESG are as posted. Two soft checks on Rakesh's batch page failed. One was the suite's own wording; the
other found the van round named by the wrong day (below, fixed on this branch).

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey` from `frontend/`.
- **The stack, all production:**
  - the workspace app at munchly-smartclearance.web.app and the console at smartclearance-console.web.app (Firebase
    Hosting, deployed from `73459e5`);
  - backend-api on Cloud Run (revision `backend-api-00037-82z`) on Cloud SQL `sc-main`, with the dataset SC-136 synced
    from local;
  - the agents on Cloud Run with live Gemini, the papers laid out as PDFs in the prod docs bucket.
- **Signing in:** each person with a Firebase custom token (`sessions.sh`), exchanged with each app's production
  browser key from its own origin. Production shares local's Firebase user pool, so no password was handled.
- **The journey day:** 60 min (Rehearsal), set by the reset, then put back to 24 hours through the console's clock.
- **The journey is left as the run ended:** the chips cleared and in the ledger. The reset took the Mango Drink back to
  day 0.
- **The recording:** `munchly-chips-e2e-prod-2026-10-10.mp4` beside this file, 10 min 45 s, H.264. It stays local
  (git-ignored). A caption names who acts at every step.
- **The record:**
  - `report.json`: every step, with its time and figures;
  - `stills/`: 47 of the 77 steps;
  - `exports/`: the GST summary and the BRSR table Priya exported from the production ledger.
- **One attempt before it:** it stopped at the fifth kirana, whose page opened on the sign-in screen. The deployed
  workspace app registers a service worker (the offline shell and pushes), which served its cached shell for the
  suite's bare sign-in page. The journey suites now block service workers in their own browser; the deployed app is
  unchanged.

## The people

| Character            | Who                            | Signed in to                   | What they did                                                                                                      |
| -------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Staff                | Neha Kulkarni                  | smartclearance-console.web.app | Reset journey; ran the Watcher; fired expiry day's report                                                          |
| Supply Chain         | Priya Deshmukh                 | munchly-smartclearance.web.app | Confirmed Setup; approved the plan; reviewed every paper; verified the tax and the ESG on the ledger               |
| Distributor          | Rakesh bhai, Rakesh Traders    | munchly-smartclearance.web.app | Allowed the agents; sent the label photo; loaded the truck; issued the invoice; ran the van round; read his portal |
| Kiranas              | 31 shops of the Nagpur cluster | munchly-smartclearance.web.app | Each ordered its own share of the scheme                                                                           |
| Bidder on ExpireSoon | Agrawal ji, Agrawal Wholesale  | munchly-smartclearance.web.app | Bid ₹13; took the Negotiator's ₹14.20 counter; paid the token                                                      |

## The journey, against the story

| Stage      | Result                                                            | Story |
| ---------- | ----------------------------------------------------------------- | ----- |
| Detect     | −₹26,330 if destroyed on the Command Center                       | yes   |
| Plan       | ₹21,770 net: 588 to the kiranas, 772 to ExpireSoon                | yes   |
| Kiranas    | 38 offered, 31 ordered 588 packets                                | yes   |
| ExpireSoon | 772 at ₹14.20, a ₹1,644 token; the Lot won bill ₹11,510.00        | yes   |
| Papers     | INV/26-27/0931, CN/0117, the GST ITC memo, each with its PDF      | yes   |
| Van round  | the Saturday round on Deliveries, in its push and in the timeline | yes   |
| The close  | actual ₹21,152.40, nothing left at the godown, cleared            | yes   |

## The tax and the ESG, on production's ledger

| What Priya checked       | Read                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| The GST reading, Q3 FY27 | ₹1,224 of input credit kept, ₹0 reversed; every pack reviewed                                 |
| The GST summary          | INV/26-27/0931 for ₹11,510; CN/0117 for ₹8,768; ₹1,224 kept; ₹0 reversed under s.17(5)(h)     |
| The GST ITC memo         | ITC KEPT; its PDF served from its signed link as `application/pdf`                            |
| The BRSR table           | 217.6 kg diverted, all resold; plastic packaging (EPR) 8.16 kg diverted                       |
| The batch's BRSR line    | 217.6 kg diverted, 544 kg CO₂e avoided, 0 meals (nothing donated), with its evidence          |
| The year so far          | 13 batches, ₹2,41,535.98 recovered, ₹17,078.78 of input GST kept, 2.18 t kept out of landfill |

## Rakesh's portal

His Today (nothing left on the chips), his papers and their PDFs (INV/26-27/0931 and CN/0117), his credit (₹8,768 to the
rupee), Orders, Deliveries and his label photos all read as posted, and he ends whole at ₹0. On his batch's page:

- **the suite's wording:** since SC-135 a cleared batch reads his partner facts, as his earlier batches do, so the
  page reads "Agrawal Wholesale's truck collected the lot" and "From 31 kiranas" where the suite still expected the
  journey state's "You loaded Agrawal Wholesale's truck" and "From your kiranas". The suites follow the facts' wording
  now;
- **a real bug:** it read "Your Friday van round delivered the scheme". In a compressed journey Rakesh runs the round
  as soon as the papers are drafted (Friday), but the round is the Saturday one: its push, the timeline and Deliveries
  say so (SC-97). The facts stamped only when it ran. They now carry when it leaves too (backend-api `partners.py`),
  and his pages name the round by that day (core `partners.ts`, `dist.ts`). The page read Saturday before SC-135, from
  the journey's state. This is a backend fix, so it reaches production with the next deploy.

## Findings

- **warning** `MF-2409-117`: his batch's page named the Friday van round. Fixed on this branch, with a backend test and a
  live test that fail without it.
- **note** `/paperwork/MF-2409-117`: the tax invoice still reads "drafted" in Priya's pack after Rakesh issued it from
  Tally (as in the prototype).

No page errors, no failed API calls, and no NaN, undefined or Invalid Date on screen.
