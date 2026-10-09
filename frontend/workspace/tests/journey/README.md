# Munchly Chips E2E

The Masala Chips 150 g batch (MF-2409-117, Rakesh Traders, Nagpur) taken from a fresh journey to Impact's report in a
real browser, on the happy path, with every person acting in the real UI in turn (SC-95). The agents do their part on
live Gemini through the local pull worker. One page drives everyone, so the whole journey is one recording.

| #   | Step                                                                                                                           | Who                           | Where                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------------------------------- |
| 1   | Reset journey, at 60 min a journey day (Rehearsal)                                                                             | Neha, staff                   | console, Munchly · Agents · Actions |
| 2   | Confirm Setup: the export's mapping and the guardrails                                                                         | Priya, Supply Chain           | `/setup`                            |
| 3   | The one-time permission                                                                                                        | Rakesh, distributor           | `/home`, Allow                      |
| 4   | The Watcher flags the chips (Run now, unless the 09:00 check already has)                                                      | Neha                          | console, Watcher · Run now          |
| 5   | The label photo, uploaded (`agents/evals/vision/images/story-clean.webp`)                                                      | Rakesh                        | `/photo/MF-2409-117`                |
| 6   | The Valuer prices, the Router plans; the plan approved                                                                         | Priya                         | `/route/MF-2409-117`                |
| 7   | The Lister lists 772 on ExpireSoon, Outreach offers 588 to 38 kiranas                                                          | the agents                    | `/execution/MF-2409-117`            |
| 8   | Each of the 31 ordering kiranas orders its own share; the scheme fills and closes                                              | each kirana                   | `/offer/MF-2409-117`                |
| 9   | A bid at ₹13, the Negotiator's counter, the counter taken                                                                      | Agrawal Wholesale, ExpireSoon | `/market`, `/listing`               |
| 10  | The buyer's truck loaded                                                                                                       | Rakesh                        | `/van`                              |
| 11  | Paperwork drafts the pack; the invoice issued from Tally; the van round                                                        | Rakesh                        | `/orders`, `/van`                   |
| 12  | Every paper read (tax invoice, e-way bill check, credit note, GST ITC memo, FSSAI, destruction certificate); the pack reviewed | Anita, Finance                | `/paperwork/MF-2409-117`            |
| 13  | Expiry day's report fired; Impact posts the ledger                                                                             | Neha                          | console, Impact · Report now        |
| 14  | The batch's ESG report, its BRSR line and evidence, the quarter's BRSR Core                                                    | Vikram, ESG                   | `/report/MF-2409-117`               |
| 15  | The report as Finance; Execution and the Command Center at the end                                                             | Anita, Priya                  | `/report`, `/execution`             |

The story's figures are checked as it goes (softly, so the run reaches the end): a plan of ₹21,770 net (588 to kiranas,
772 to ExpireSoon), 38 kiranas offered, 31 ordering 588 packets, an award of 772 at ₹14.20 with a ₹1,644 token, an
actual net of ₹21,152.40 and nothing left at the godown. It also holds the fixes its first run led to (SC-96 to SC-100): −₹26,330
if destroyed on the Command Center at Detect, the Lot won bill's total of ₹11,510.00, a PDF on each paper a person
signs, one day for the van round on the Van route, in its push and in the timeline, and an FSSAI paper that names no
batch as donated.

## Munchly Mango E2E

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad), `munchly-mango.journey.ts` (SC-104). It
**never resets the journey**: each step reads the batch's case first and is skipped when it is done, so it takes the
batch on from wherever it stands, and can be run again after a failure.

- **Its plan:** three lines and no ExpireSoon lot (22 days left is under ExpireSoon's 30): the kiranas' scheme, the
  staff sale at the godown, and the food-bank donation.
- **Its people:** Lakshmi Agencies (photo, staff sale, van round), Priya (approval), each ordering Hyderabad kirana,
  Meera of Feeding India (pickup), Anita (review), Neha (report) and Vikram (ESG).
- **The kirana orders:** the offer screen orders in twelves from a shop's share down to 12. A story order it cannot
  place (Saraswathi Kirana's 4) is ordered at the nearest it can, and as many twelves are taken off a later shop, so
  the scheme still fills to the packet. The report says which shops ordered other than the story.
- **The figures:** each is checked against the batch's own plan, which grows by a day's sales for each day it is made
  after day 0.

```sh
E2E_SLOWMO=120 corepack pnpm test:journey:mango --headed
```

Its run of 9 Oct is in `runs/2026-10-09-mango/`.

## Munchly Chips Leftover E2E

The Masala Chips batch again, from a fresh journey, with food left at the godown (SC-116),
`munchly-chips-leftover.journey.ts`. Its steps up to the scheme, and the ExpireSoon deal, are the chips flow's own
(`chips.ts`, which both share). Then it parts:

- **The kiranas:** the last `E2E_LEFTOVER` (8) of Rakesh's 31 ordering kiranas open the scheme and place no order: 23 order
  444 packets and 144 are not taken, so the scheme stays open.
- **No truck:** Agrawal Wholesale takes the lot, but the truck loads only once the scheme has closed (backend-api
  refuses it before: "The kirana scheme is still open until …").
- **Report now:** Neha fires expiry day's report in the console. The batch closes as it stands (SC-94): the scheme closes
  with the orders placed, the accepted lot counts as collected, the papers are drafted, and Impact's report settles the
  144 packs left at the godown by Munchly's expiry policy, full credit, with an Expiry credit note.
- **What it reads back:** Anita's pack (it opens on the Expiry credit note) and her review; Priya's Execution, with Left
  at the godown and the Expiry settlement, and the paper it opens; Vikram's ESG report; the Command Center.
- **The figures:** the orders, the packs left, the settlement and the expiry paper, against the run's own shortfall.

```sh
E2E_SLOWMO=120 corepack pnpm test:journey:leftover --headed
E2E_LEFTOVER=3 corepack pnpm test:journey:leftover       # fewer kiranas sit out
```

It resets Munchly's journey first, as Munchly Chips E2E does.

Its run of 9 Oct is in `runs/2026-10-09-leftover/`.

## Before a run

- backend-api on :8000 (`backend-api/scripts/dev.sh`), on a world with Munchly's live workspace (`hydrate.sh --reset`,
  or `--live-only`);
- the agents' pull worker (`agents/scripts/dev.sh`). It calls live Gemini, about GBP 0.05–0.10 a journey; with
  `MODEL_TIER=stub` it replays the recordings instead;
- the workspace app's and the console's dev servers on :5175 and :5174 (the `frontend-workspace` and `frontend-console`
  launch configs), their `.env.local` pointing at the API (`backend-api/scripts/app-env.sh`). The Firebase browser keys
  accept only those origins.

## Running it

Once a run is done, set Munchly's journey day back to 24 hours: the Chips suites leave it at the reset's 60 minutes.

```sh
backend-api/scripts/hydrate.sh --day-minutes munchly=1440
```

From `frontend/`, on request only, like every browser suite (SC-55):

```sh
corepack pnpm test:journey                                    # headless, recorded
E2E_SLOWMO=120 corepack pnpm test:journey --headed            # watch it in a browser window
corepack pnpm test:journey --ui                               # Playwright's UI mode, step by step
E2E_FROM=deal E2E_UNTIL=truck corepack pnpm test:journey      # part of it, on the journey as it stands
```

- `E2E_DAY_MINUTES`: the journey day the reset starts (60 by default; 1440, 60, 5 or 1). At 5 or 1 the kiranas' 48-hour
  offer can close before every shop has ordered.
- `E2E_SETTLE`: how long each screen is held before its still (1200 ms).
- It resets Munchly's journey first, as the console's Reset journey does: the story's batches start again on day 0. The
  Mango Drink is flagged too and is left where the agents take it.

## Signing in

Nobody's password is handled. `backend-api/scripts/sessions.sh` mints a Firebase custom token for each person, signed as
sc-api-local (as `walk.sh` does); `auth.ts` exchanges it with the app's own browser key and leaves the session where the
app's Firebase SDK keeps it, so the page loads signed in as after its own sign-in. The sign-in form itself is not
exercised here.

## What a run leaves

In `frontend/workspace/test-results/journey/<test>/`:

- `video.webm`, the whole run, with a caption naming who acts and what they do;
- `trace.zip` (`corepack pnpm exec playwright show-trace …`);
- `steps/`, a still at the end of each step;
- `report.md` and `report.json`: the steps with their times, the figures the journey reached, and the findings (page
  errors, failed API calls, figures off the story, and any NaN, undefined or Invalid Date on screen).

Playwright's HTML report is in `frontend/workspace/playwright-report-journey/`.
