# Munchly Chips E2E

The Masala Chips 150 g batch (MF-2409-117, Rakesh Traders, Nagpur) taken from a fresh journey to Impact's report in a
real browser, on the happy path, with every person acting in the real UI in turn (SC-95). The agents do their part on
live Gemini through the local pull worker. One page drives everyone, so the whole journey is one recording.

| #   | Step                                                                                                                                                                                                                    | Who                           | Where                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| 1   | Reset journey, at 60 min a journey day (Rehearsal)                                                                                                                                                                      | Neha, staff                   | console, Munchly · Agents · Actions              |
| 2   | Confirm Setup: the export's mapping and the guardrails                                                                                                                                                                  | Priya, Supply Chain           | `/setup`                                         |
| 3   | The one-time permission                                                                                                                                                                                                 | Rakesh, distributor           | `/home`, Allow                                   |
| 4   | The Watcher flags the chips (Run now, unless the 09:00 check already has)                                                                                                                                               | Neha                          | console, Watcher · Run now                       |
| 5   | The label photo, uploaded (`agents/evals/vision/images/story-clean.webp`)                                                                                                                                               | Rakesh                        | `/photo/MF-2409-117`                             |
| 6   | The Valuer prices, the Router plans; the plan approved                                                                                                                                                                  | Priya                         | `/route/MF-2409-117`                             |
| 7   | The Lister lists 772 on ExpireSoon, Outreach offers 588 to 38 kiranas                                                                                                                                                   | the agents                    | `/execution/MF-2409-117`                         |
| 8   | Each of the 31 ordering kiranas orders its own share; the scheme fills and closes                                                                                                                                       | each kirana                   | `/offer/MF-2409-117`                             |
| 9   | A bid at ₹13, the Negotiator's counter, the counter taken                                                                                                                                                               | Agrawal Wholesale, ExpireSoon | `/market`, `/listing`                            |
| 10  | The buyer's truck loaded                                                                                                                                                                                                | Rakesh                        | `/van`                                           |
| 11  | Paperwork drafts the pack; the invoice issued from Tally; the van round                                                                                                                                                 | Rakesh                        | `/orders`, `/van`                                |
| 12  | Every paper read (tax invoice, e-way bill check, credit note, GST ITC memo, FSSAI, destruction certificate); the pack reviewed                                                                                          | Priya, Supply Chain           | `/paperwork/MF-2409-117`                         |
| 13  | Expiry day's report fired; Impact posts the ledger                                                                                                                                                                      | Neha                          | console, Impact · Report now                     |
| 14  | Priya verifies the tax: the ledger's GST reading for the quarter, the GST summary exported, the batch's GST ITC memo (its stamp and its PDF), tax invoice and credit note                                               | Priya, Supply Chain           | `/report`, `/report/MF-2409-117`                 |
| 15  | Priya verifies the ESG: the ledger's Impact reading, the BRSR table exported, the batch's BRSR line and its evidence; the year so far                                                                                   | Priya, Supply Chain           | `/report`, `/report/MF-2409-117`                 |
| 16  | Priya reads the batch's Record: the photos sent for it, the audit trail (People only, then as CSV), the yeses; the same tab on her batch page                                                                           | Priya, Supply Chain           | `/report/MF-2409-117?tab=record`, `/execution`   |
| 17  | Priya reads the Impact dashboard (tiles, Food by week as a table, where the kilos went, by product) and the Command Center's Impact card                                                                                | Priya, Supply Chain           | `/report?reading=impact`, `/command`             |
| 18  | Rakesh reads his portal back: Today with nothing left for him, the batch's page (what happened, he ends whole, his papers and their PDFs), Orders and Batches with their sums, his Photos, Deliveries, his label photos | Rakesh, distributor           | `/home`, `/batches`, `/orders`, `/van`, `/photo` |
| 19  | The batch's money in the ledger; Execution with the lot collected and the scheme delivered; the Command Center at the end                                                                                               | Priya                         | `/report`, `/execution`                          |
| 20  | The console's Overview: Food, by day, across every client, and as a table                                                                                                                                               | Neha                          | console, Overview                                |

The story's figures are checked as it goes (softly, so the run reaches the end): a plan of ₹21,770 net (588 to kiranas,
772 to ExpireSoon), 38 kiranas offered, 31 ordering 588 packets, an award of 772 at ₹14.20 with a ₹1,644 token, an
actual net of ₹21,152.40 and nothing left at the godown; Rakesh's portal (SC-133): he ends whole at ₹0, CN/0117 and his invoice each with its PDF, his orders on their papers; and Priya's tax and ESG (SC-128): ₹1,224 of input GST kept and none reversed, INV/26-27/0931 for ₹11,510, CN/0117 for ₹8,768, 217.6 kg kept out of landfill, 544 kg CO₂e and 8.16 kg of plastic packaging resold, each read on screen and in the GST summary and BRSR table she exports, against the ledger backend-api posted. It also holds the fixes its first run led to (SC-96 to SC-100): −₹26,330
if destroyed on the Command Center at Detect, the Lot won bill's total of ₹11,510.00, a PDF on each paper a person
signs, one day for the van round on Deliveries, in its push and in the timeline, and an FSSAI paper that names no
batch as donated.

**What SC-139 to SC-157 added, checked as the journey reaches it (SC-161):**

- **The label photo (SC-147):** the EAN-13 and the batch's QR code read back from the file Rakesh sends (Chromium's
  BarcodeDetector), and Vision's read of the sticker as the batch's record has it.
- **Execution's channel cards (SC-151, SC-156):** the ExpireSoon lot as buyers see it (its id, 772 units, ₹15, 50% off,
  the reserve and the hidden territories), live, awarded and collected, with its stops and the API call behind its
  button; the kirana scheme as the shops see it (₹21.60 a pack, ₹18.00 effective, the 48-hour window), open, filled and
  delivered, with its stops and the push behind its button.
- **The kiranas' tax invoices (SC-153):** one for every order, RT/26-27/1279 on, at ₹18.00 a packet taxable with CGST and
  SGST at 2.5% each, to the rupee; the first shop's order page and invoice; the sales register in Priya's pack; every
  invoice's PDF.
- **The Tally papers (SC-148):** the issued tax invoice reads "issued" in the pack, ORIGINAL FOR RECIPIENT, with its
  IRN worked out from Rakesh Traders' GSTIN and its number, and the three parties' GSTINs; the credit note names
  Munchly's dispatch invoice, MFL/26-27/02417.
- **Destroyed at the godown (SC-139):** Munchly's policy, with nothing left on the happy path, so nothing to destroy.
- **The Record (SC-142, SC-144, SC-146):** the photo sent, Vision's read and the match, the audit trail and the yeses;
  every photo drawn, none failed; Rakesh's Photos tab.
- **The distributor's figures (SC-141, SC-145):** the scheme's row at ₹18.00 effective on its 31 invoices; the sum card
  on Orders and Batches (cost = sold + credited), and a cleared batch's own sum; once the chips clear, they are among
  them (SC-162).
- **The Impact dashboard (SC-157)** and **the console's Food by day (SC-149)**, and Munchly's address,
  munchly-smartclearance.web.app, in the console (SC-150).
- **The buttons (SC-152):** every button the run presses is watched as it waits; its words go in the report, and a blank
  or transparent face, or a refusal, is a finding.

Its run of 11 Oct with these checks (SC-161) is in `runs/2026-10-11/`. Its run of 9 Oct with Rakesh's portal (SC-133) is in `runs/2026-10-09-distributor/`; the one with Priya's tax and ESG (SC-128) is in `runs/2026-10-09/`; the run of 8 Oct, after SC-96 to SC-100, is
in `runs/2026-10-08/`.

## Munchly Mango E2E

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad), `munchly-mango.journey.ts` (SC-104). It
**never resets the journey**: each step reads the batch's case first and is skipped when it is done, so it takes the
batch on from wherever it stands, and can be run again after a failure.

- **Its plan:** three lines and no ExpireSoon lot (22 days left is under ExpireSoon's 30): the kiranas' scheme, the
  staff sale at the godown, and the food-bank donation.
- **Its people:** Lakshmi Agencies (photo, staff sale, van round), Priya (approval), each ordering Hyderabad kirana,
  Meera of Feeding India (pickup), Priya (review), Neha (report) and Priya (the ledger).
- **The kirana orders:** the offer screen orders in twelves from a shop's share down to 12. A story order it cannot
  place (Saraswathi Kirana's 4) is ordered at the nearest it can, and as many twelves are taken off a later shop, so
  the scheme still fills to the packet. The report says which shops ordered other than the story.
- **The figures:** each is checked against the batch's own plan, which grows by a day's sales for each day it is made
  after day 0.

```sh
E2E_SLOWMO=120 corepack pnpm test:journey:mango --headed
```

Its run of 10 Oct, on the distributor portal with Lakshmi Agencies' portal read back (SC-134), is in `runs/2026-10-10-mango/`; the run of 9 Oct is in `runs/2026-10-09-mango/`.

## Munchly Chips Leftover E2E

The Masala Chips batch again, from a fresh journey, with food left at the godown (SC-116),
`munchly-chips-leftover.journey.ts`. Its steps up to the scheme, and the ExpireSoon deal, are the chips flow's own
(`chips.ts`, which both share). Then it parts:

- **The kiranas:** the last `E2E_LEFTOVER` (8) of Rakesh's 31 ordering kiranas open the scheme and place no order: 23 order
  444 packets and 144 are not taken, so the scheme stays open.
- **No truck:** Agrawal Wholesale takes the lot, but the truck loads only once the scheme has closed (backend-api
  refuses it before: "The kirana scheme is still open until …").
- **Report now:** Neha fires expiry day's report in the console. The batch closes as it stands (SC-94): the scheme closes
  with the orders placed, the accepted lot counts as collected and the papers are drafted. Munchly's expiry policy
  destroys the 144 packs left at Rakesh's godown (SC-139, route B), so Impact waits for their evidence.
- **The destruction** (`destruction.ts`, shared with the Mango leftover suite): Rakesh opens Destroy expired packs from
  Today, uploads design3's two evidence photos for the batch (`design3/system/img/evidence/`: before, at the godown with
  the batch label; after, at the landfill with the slate), names the agency and its certificate number, and sends them.
  Vision checks both on live Gemini; a check that does not pass is kept as a note. Priya opens Review the destruction on
  her Command Center and approves it, and Impact reports: the Expiry credit note (the dealer price, the GST he reverses
  and the agency's charges) and the agency's certificate.
- **What it reads back:** the pack (it opens on the Expiry credit note) and Priya's review; her Execution, with Left at
  the godown and the Expiry settlement, and the paper it opens; the batch's page in the ledger; the Command Center.
- **The figures:** the orders, the packs left, the settlement and the expiry paper, against the run's own shortfall.

```sh
E2E_SLOWMO=120 corepack pnpm test:journey:leftover --headed
E2E_LEFTOVER=3 corepack pnpm test:journey:leftover       # fewer kiranas sit out
```

It resets Munchly's journey first, as Munchly Chips E2E does.

Its run of 9 Oct is in `runs/2026-10-09-leftover/`.

## Munchly Mango Leftover E2E

The Mango Drink again, from a fresh journey, with kiranas that do not buy (SC-135), `munchly-mango-leftover.journey.ts`.
Its steps up to the scheme, the staff sale, the donation and the pack with its van round are the Mango flow's own
(`mango.ts`, which both share); the reset and Setup are the chips flow's. Then it parts:

- **Lakshmi Agencies gives her permission**, and Neha runs the Watcher if the 09:00 check has not flagged the Mango yet.
- **The kiranas:** of her 52 ordering kiranas, the last `E2E_LEFTOVER` (10) do not buy. The first `E2E_DECLINE` (2) of
  those press Not this time on their Offers; the rest read the scheme and let it go.
- **The window:** Neha closes the scheme's offer window from the console, short of its packets. With no ExpireSoon lot
  open, what was not ordered stays at the godown. The pack is then drafted, and the van round takes the orders placed.
- **Report now:** expiry day asks Lakshmi Agencies to destroy the packs left at her godown (SC-139, route B). She sends
  the two photos and Deccan Green Waste Management's certificate number, Vision checks them, and Priya approves them
  from her Command Center (`destruction.ts`). Then Impact reports. The Expiry credit note credits her the dealer price,
  the input GST she reverses on the packs (grossed up) and the agency's charges, ₹1.50 a pack. Munchly keeps its own
  input GST on them, so the ITC memo reverses only the donated packs'.
- **What it reads back:**
  - Priya's review;
  - Execution's Left at the godown and Expiry settlement;
  - every paper in the pack, on its page. Each PDF is kept beside the report and read back as text with `pypdf`, when
    python3 has it;
  - the ledger's GST and Impact readings, with the GST summary and the BRSR table (`ledger.ts`, shared with the chips
    flows);
  - one kirana's offer for each outcome: ordered, declined and expired;
  - Meera's pickup and receipt;
  - Lakshmi Agencies' portal: her credit notes, the agency's certificate (hers, with its PDF), and her copy of the
    receipt.
- **No tax invoice:** the Mango's plan has no ExpireSoon lot, so its GST papers are the two credit notes and the ITC memo.

```sh
E2E_SLOWMO=120 corepack pnpm test:journey:mango-leftover --headed
E2E_LEFTOVER=6 E2E_DECLINE=1 corepack pnpm test:journey:mango-leftover
```

It resets Munchly's journey first, as the chips suites do.

Its run of 10 Oct is in `runs/2026-10-10-mango-leftover/`.

## Munchly Chips Sad Path E2E

The chips' sad path, on three screens at once (SC-179, SC-184), `munchly-chips-sad.journey.ts` with `stage.ts`. Almost
no shop buys, and what is left is destroyed at the godown.

**The three screens** run in their own headless Chromium, side by side on a stage:

- a tablet in landscape (1180 × 820) for Priya, Munchly's supply chain operator, with the narrator under it;
- a tablet in portrait (820 × 1180) for Rakesh, the distributor;
- a phone (390 × 844) for everyone else: each kirana, Agrawal Wholesale on ExpireSoon, and Neha in the console.

The stage is a page in a second headless Chromium, never a window on the screen, so nothing about a window can crop
what is recorded (the visible stage window of SC-179's run was captured cropped from a minute in). A monitor window
shows the stage live as it is recorded (`E2E_LIVE=0` opens none).

**Sign-ins on the apps' own screens (SC-184):** the recording opens on three sign-in screens. Priya and Rakesh sign in
on their tablets and stay online to the end: their screens move within the app as a link would, the pushes that reach
them show as the app's banners, and after the reset each reloads in place behind the app's own loader. Neha signs in to
the console on the phone. Each kirana and Agrawal sign in on the phone when they are needed, and the one before signs
out of the workspace from Profile; the console stays signed in on its own address, as an app on a phone does (the
console has no sign-out on a phone). Each sign-in types the person's email, presses Sign in and goes through the app's
welcome, its splash and, the first time on a device, its notifications step. **No password is typed:** the password
field takes a stand-in (`STAND_IN`), and the one call that checks it, Identity Toolkit's `signInWithPassword`, is
answered by the suite with that person's own Firebase session, the custom token `sessions.sh` mints, exchanged with the
app's key (`auth.ts` `signInOnScreen`). Everything after it is real: the SDK reads the account from Firebase, and the app
opens its session with backend-api.

A step ends only once every screen's photos and placeholders have landed.

**Spotlights, notes and scrolling (SC-188):** a screen scrolls smoothly to what a person reads, sideways too inside a
scroller, and a block wider than its screen (the Route Room's channel table) is panned across. What a person reads is
ringed on the stage. At the moments a viewer would ask about, the rest of the screen dims and a card beside the element
says why, in business terms: why Rehearsal (a small synthetic dataset on the story's calendar), why the Watcher, the
window and expiry day are fired by hand in a demo, and what each moment is worth to Munchly, Rakesh and his shops, with
the case's own figures (the risk, the split, the live orders, the counter, the second yes, the outcome). The notes are
the stage's, drawn over the screens; the apps are unchanged.

**On production** (`E2E_TARGET=prod`, SC-137): the suite runs on the deployed apps and Cloud Run, as Munchly Chips E2E
does. It resets production's journey; afterwards put production's day back to 24 hours from the console's clock.

**Every click shows:** each screen draws a cursor (an init script) that glides to its target and ripples where it
presses, and a person reading glides it over what they read: Vision's checks, the certificate's signatures, the Impact
tiles.

Each screen streams its frames (CDP screencast) into the stage, which shows each device under its holder's name and
address. The screen being acted on is lit, and a narrator under the tablets names the step, who acts and what they do,
with running counts and the last steps. The stage is recorded: its frames are piped into ffmpeg at a steady 25 fps,
H.264 at 2560 × 1440, as `recording.mp4` in the run's output folder (`E2E_KEEP=<path>` copies it out).

**The journey:**

- Neha resets the journey from the console. Priya confirms Setup, Rakesh gives his permission, and Neha runs the Watcher.
- Rakesh sends the label photo, and Priya approves the plan (₹21,770).
- Of Rakesh's 38 kiranas, only the first `E2E_BUYERS` (2) of those that order in the story order their 24 packets
  each, each signing in on the phone. Priya's tablet stays on Execution, and each order arrives there live, over the
  stream: the shop in the scheme's latest orders, the count moved on. An order that has not reached her screen within
  45 s is an error in the report.
- Agrawal Wholesale wins the ExpireSoon lot (₹13 bid, ₹14.20 counter). While the scheme is still open, Rakesh's
  Deliveries reads "Load once the scheme closes".
- Neha closes the offer window from the console on the other 36 shops; none of them answers it. The lot was already
  won, so the 540 packets no shop took stay at the godown rather than moving onto it, and Priya's Execution says so as
  the window ends (SC-185).
- Rakesh loads the truck, issues his invoice from Tally, and runs his van round to the two shops.
- Neha fires expiry day. Rakesh sends the destruction's evidence: the photos for 540 packets (`evidence/`, Qwen-Image,
  with sidecars), Orange City Enviro Services, its certificate number, and the window and two witnesses from the agency's
  panel. The officer, both witnesses and Rakesh sign the certificate in place on his tablet, each signature drawn
  stroke by stroke on the pad (SC-183). Vision checks it on live Gemini, and Priya approves from her Command Center,
  after reading the certificate as signed. Impact reports: the Expiry credit
  note (₹13,284: the dealer price, the GST he reverses and the agency's charges) and the two-page certificate of
  destruction.
- **The validation, on screen:** Rakesh's tablet shows Vision reading the label, and Vision checking the two
  destruction photos (his photos in view, SC-180); Priya reads Vision's four checks one by one before her yes.
- **What it reads back:**
  - the certificate of destruction: its reason, method, facility and window, then each signature (the officer under the
    agency's seal, the two witnesses, Rakesh for the packs he handed over), then page 2, the log and its initials;
  - Priya's pack: the Expiry credit note and every other paper with its signature (SC-174), the sales register and a
    glance at each kirana's tax invoice (SC-153);
  - the Impact screens: the quarter's tiles, food by week, where the kilos went, by product, the batch's BRSR line, and
    the Command Center's Impact card;
  - Rakesh's batch: what happened, his money, his signed papers and his photos;
  - on the phone, Shree Ganesh Kirana's order and its tax invoice, and the offer of a shop the window closed on;
  - Execution's settlement and the ledger.

**The evidence photos** were made for 540 packets, the count left when 2 shops order. Vision counted 500 to 540 packs in
the before photo and read its slate as `MF-2409-117 · 540 PKTS`. Another `E2E_BUYERS` leaves another count, and falls
back to design3's photos for 144 packets, whose count and slate checks will then not pass.

```sh
corepack pnpm test:journey:sad                                   # the stage on screen, recorded
E2E_KEEP=$PWD/workspace/tests/journey/runs/<date>-sad/recording.mp4 corepack pnpm test:journey:sad
E2E_FROM=deal E2E_UNTIL=window corepack pnpm test:journey:sad     # part of it, on the journey as it stands
```

It resets Munchly's journey first. Each person's custom token is minted again after 40 minutes, since one is good for an
hour.

## Munchly Mango E2E on three screens

The Mango Drink's happy path on the sad path's stage (SC-190), `munchly-mango-stage.journey.ts` with `stage.ts`, for a
recording that tells the journey from a reset to Impact's report. Munchly Mango E2E (SC-104) stays the one that takes
the batch on from where it stands; this one resets.

**The screens:** Priya on the tablet in landscape and Lakshmi Agencies on the tablet in portrait, each signing in on
camera and online to the end, and the phone, on which Neha signs in to the console, and three kiranas and Meera of
Feeding India sign in to the workspace as each is needed. The sign-ins, the cursor, the scrolling, the spotlights and the
business notes are the sad path's (SC-184, SC-188); `Stage.open` takes the cast (`holds`: who keeps a tablet; `phone`:
the note under the phone).

**The journey:**

- Neha resets the journey from the console. Priya confirms Setup, Lakshmi Agencies gives its permission (or reads it
  as given), and Neha runs the Watcher.
- Lakshmi Agencies sends the label photo (`agents/evals/vision/images/mango.webp`), and Vision matches it to the
  export on its tablet.
- Priya opens the plan from her Command Center: the Route Room's channels read bar by bar, as a table panned sideways,
  and the split (₹16,917: 1,372 packets to the kiranas, 150 to the staff sale, 58 to a food bank; no ExpireSoon lot, at
  22 days left). She approves it.
- The first `E2E_SHOWN` (3) ordering kiranas sign in on the phone and order their story's share, each order checked
  live on Priya's Execution. The other ordering kiranas order as themselves through backend-api, each with its own
  session, meanwhile, and a note says so; Priya watches the scheme fill (52 shops, 1,372 packets).
- Lakshmi Agencies records the staff sale on its consolidated receipt (`design3/system/img/receipts/MF-2410-118.webp`),
  which Vision reads on its tablet. Meera confirms and collects Feeding India's pickup on the phone.
- Paperwork drafts the pack, and Lakshmi Agencies runs the van round from its Today.
- Priya reads every paper and the sales register, with a glance at each kirana's tax invoice, and marks the pack
  reviewed. Neha fires Report now.
- Priya reads the Impact screens and the batch's BRSR line; Lakshmi Agencies reads its batch (what happened, ending
  whole, its papers) and its Orders; Priya ends on Execution, the ledger and the Command Center, with the outcome.

```sh
corepack pnpm test:journey:mango-stage                            # the stage on screen, recorded
E2E_TARGET=prod corepack pnpm test:journey:mango-stage            # on production
E2E_FROM=staff E2E_UNTIL=papers corepack pnpm test:journey:mango-stage   # part of it, on the journey as it stands
```

Its run of 12 Oct on production is in `runs/2026-10-12-prod-mango/`.

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

## On production

`E2E_TARGET=prod` runs a suite on production (SC-137) instead of this machine:

- the deployed apps, munchly-smartclearance.web.app and smartclearance-console.web.app;
- backend-api and the agents on Cloud Run.

Each app's API address and browser key are its production build settings, the repository's variables, read with `gh`.
Nothing local needs to run: no dev servers, no local API, no worker. The people still sign in with custom tokens from
`sessions.sh`, since production shares the Firebase user pool.

```sh
E2E_TARGET=prod corepack pnpm test:journey
```

It resets production's Munchly journey first, as every chips suite does, and the agents call live Gemini on Cloud
Run. Afterwards, set production's journey day back to 24 hours from the console (the client's journey-day badge,
Real time); `hydrate.sh --day-minutes` sets only the local database's.

Its run of 10 Oct on production, after SC-137's deploy (SC-138), is in `runs/2026-10-10-prod/`.

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
- `exports/`, the GST summary and the BRSR table Priya downloaded from the ledger;
- `report.md` and `report.json`: the steps with their times, the figures the journey reached, and the findings (page
  errors, failed API calls, figures off the story, and any NaN, undefined or Invalid Date on screen).

Playwright's HTML report is in `frontend/workspace/playwright-report-journey/`.
