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

The chips' sad path, on three screens at once (SC-179, SC-184, SC-202), `munchly-chips-sad.journey.ts` with `stage.ts`.
Almost no shop buys, and what is left is destroyed at the godown.

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

**Spotlights, notes and scrolling (SC-188, SC-202):** a screen scrolls smoothly to what a person reads, sideways too
inside a scroller, and a block wider than its screen (the Route Room's channel table) is panned across. What a person
reads is ringed on the stage in green, as the admin tour has it (SC-199). At the major moments only, the rest of the
screen dims and a green card beside the element says why, in business terms, with the case's own figures: the risk,
Vision's check, the split, the yes, the ExpireSoon listing, a live order, a shop's no, the counter, why the window and
expiry day are fired by hand, the e-invoice, the destruction against evidence, the second yes, the certificate, GST,
ESG, Rakesh ending whole and the swing. A chapter card opens each of the 14 chapters (`recording.chapters.json`). Every
paper is read top to bottom, ending on who signed it (`read.ts`). The notes are the stage's; the apps are unchanged.

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
  each, each signing in on the phone. Priya's tablet stays on Execution from her yes to the destruction, and each order
  arrives there live, over the stream: the shop in the scheme's latest orders, the count moved on. An order that has not
  reached her screen within 45 s is an error in the report.
- Every other shop says no (SC-202): one (Om Sai Provision) presses Not this time on the phone, and the other 34 that
  joined the app say the same through backend-api as themselves (`POST …/offer/decline`). Shree Sai Kirana, only
  invited, cannot answer.
- Agrawal Wholesale wins the ExpireSoon lot (₹13 bid, ₹14.20 counter), seen awarded on Priya's Execution. While the
  scheme is still open, Rakesh's Deliveries reads "Load once the scheme closes".
- Neha closes the offer window from the console: a shop that says no keeps its 48 hours, so it stays open until then.
  The lot was already won, so the 540 packets no shop took stay at the godown rather than moving onto it, and Priya's
  Execution says so as the window ends (SC-185).
- Rakesh loads the truck (seen collected on Priya's Execution), issues his invoice from Tally, and runs his van round
  to the two shops.
- Neha fires expiry day. Rakesh sends the destruction's evidence: the photos for 540 packets (`evidence/`, Qwen-Image,
  with sidecars), Orange City Enviro Services, its certificate number, and the window and two witnesses from the agency's
  panel. The officer, both witnesses and Rakesh sign the certificate in place on his tablet, each signature drawn
  stroke by stroke on the pad (SC-183). Vision checks it on live Gemini; the destruction is asked for, checked and
  approved on Priya's Execution as it happens, and she approves from there, after reading the certificate as signed. Impact reports: the Expiry credit
  note (₹13,284: the dealer price, the GST he reverses and the agency's charges) and the two-page certificate of
  destruction.
- **The validation, on screen:** Rakesh's tablet shows Vision reading the label, and Vision checking the two
  destruction photos (his photos in view, SC-180); Priya reads Vision's four checks one by one before her yes.
- **What it reads back:**
  - Priya's pack, every paper top to bottom: the certificate of destruction and its log (its signatures as drawn),
    the Expiry credit note, the tax invoice with its e-invoice, the price-support credit note, the GST ITC memo, the
    sales register and each kirana's tax invoice (SC-153, SC-174);
  - the ledger's Money and GST readings, the Impact dashboard and the batch's BRSR line;
  - Rakesh's batch: what happened, how he ends whole, every paper of his, and his photos;
  - on the phone, Shree Ganesh Kirana's order and its tax invoice in full, and Om Sai Provision's offer it said no to;
  - last, the batch's swing, read section by section (SC-195).

**The evidence photos** were made for 540 packets, the count left when 2 shops order. Vision counted 500 to 540 packs in
the before photo and read its slate as `MF-2409-117 · 540 PKTS`. Another `E2E_BUYERS` leaves another count, and falls
back to design3's photos for 144 packets, whose count and slate checks will then not pass.

```sh
corepack pnpm test:journey:sad                                   # the stage on screen, recorded
E2E_TARGET=prod corepack pnpm test:journey:sad                   # on production
E2E_KEEP='../../playwright-automation-videos/munchly-chips-sad-e2e-prod-{stamp}.mp4' corepack pnpm test:journey:sad
E2E_FROM=deal E2E_UNTIL=window corepack pnpm test:journey:sad     # part of it, on the journey as it stands
```

It resets Munchly's journey first. Each person's custom token is minted again after 40 minutes, since one is good for an
hour. Its run of 13 Oct on production, told with the green cards (SC-202), is in `runs/2026-10-13-prod-sad/`.

## Munchly Mango E2E on three screens

The Mango Drink's happy path on the sad path's stage (SC-190, SC-201), `munchly-mango-stage.journey.ts` with `stage.ts`,
for a recording that tells the journey from a reset to the swing. Munchly Mango E2E (SC-104) stays the one that takes
the batch on from where it stands; this one resets.

**The screens:** Priya on the tablet in landscape and Lakshmi Agencies on the tablet in portrait, each signing in on
camera and online to the end, and the phone, on which Neha signs in to the console, and two kiranas and Meera of
Feeding India sign in to the workspace as each is needed. The sign-ins, the cursor and the scrolling are the sad path's
(SC-184, SC-188); `Stage.open` takes the cast (`holds`: who keeps a tablet; `phone`: the note under the phone).

**The telling (SC-201):** as the admin tour (SC-199): green rings and clicks (`ink: 'green'`), a green card beside only
the major moments (`notes: 'card'`: the risk, Vision's check, the split, the yes, a live order, the console's stand-in, the scheme filling, the
staff sale's UPI receipt, the food bank's receipt, the price support, the invoices, the report, GST, ESG, Lakshmi
Agencies ending whole, the swing), and a chapter card as each of its 13 chapters opens (written to
`recording.chapters.json`, which `cut-chapters.mjs` cuts into clips). Every paper is read top to bottom
(`Stage.read`), ending on who signed it.

**The journey:**

- Neha resets the journey from the console. Priya confirms Setup, Lakshmi Agencies gives its permission (or reads it
  as given), and Neha runs the Watcher.
- Lakshmi Agencies sends the label photo (`agents/evals/vision/images/mango.webp`), and Vision matches it to the
  export on its tablet.
- Priya opens the plan from her Command Center: the Route Room's channels read bar by bar, as a table panned sideways,
  and the split (₹16,917: 1,372 packets to the kiranas, 150 to the staff sale, 58 to a food bank; no ExpireSoon lot, at
  22 days left). She approves it, and keeps Execution open from there.
- The first `E2E_SHOWN` (2) ordering kiranas sign in on the phone and order their story's share, each order checked
  live on Priya's Execution. Then Neha, in the console on the phone, stands in for the rest, as a judge does (SC-215):
  Fill the scheme on Munchly's Agents tab, asked first. Each shop orders its story share as itself, with its own
  invoice, and Priya watches the scheme fill (52 shops, 1,372 packets).
- Lakshmi Agencies records the staff sale on its consolidated receipt (`design3/system/img/receipts/MF-2410-118.webp`),
  which Vision reads on its tablet; the sale lands on Priya's Execution, where she opens its UPI references and the
  receipt whole. Meera confirms and collects Feeding India's pickup on the phone, each seen live on Priya's Execution,
  and reads the receipt she issued.
- Paperwork drafts the pack, and Lakshmi Agencies runs the van round from its Today.
- Priya reads every paper in the pack (the price-support credit note, the staff sale's receipt, the donation receipt,
  the ITC memo, the FSSAI checklist), the sales register and one kirana's tax invoice, and marks the pack reviewed.
  Neha fires Report now.
- Priya reads the ledger's Money and GST readings, the Impact dashboard and the batch's BRSR line; Lakshmi Agencies
  reads its batch (what happened, ending whole, every one of its papers) and its Orders; last, Priya opens the
  batch's swing and reads how it adds up, section by section.

```sh
corepack pnpm test:journey:mango-stage                            # the stage on screen, recorded
E2E_TARGET=prod corepack pnpm test:journey:mango-stage            # on production
E2E_FROM=staff E2E_UNTIL=papers corepack pnpm test:journey:mango-stage   # part of it, on the journey as it stands
E2E_KEEP='../../playwright-automation-videos/munchly-mango-e2e-prod-{stamp}.mp4'   # a copy, named for the run's start
```

Its run of 12 Oct on production is in `runs/2026-10-12-prod-mango/`, and its run of 13 Oct, told with the green
cards (SC-201), in `runs/2026-10-13-prod-mango/`. Its run of 15 Oct on this machine's stack, with the console filling
the scheme (SC-215), is in `runs/2026-10-15-mango-local/`.

## Admin and console E2E

The platform's own side (SC-191, SC-197), `admin-console.journey.ts`:

- the landing page, briefly, and the bar's Console;
- the console's sign-in;
- the Overview's dashboards, live;
- a company set up as a client from its demo request, with its first export, its approver and its eleven agents
  configured;
- a live client's journey, and the platform's own screens.

It touches no batch and never resets the journey, but **each run sets up a new client, which the console cannot
delete**. The company is the first of the suite's `COMPANIES` that is not a client yet (`E2E_COMPANY` names one).

**One screen** (the stage's `one` layout, `Cast.layout`, SC-197): a laptop (1440 × 900), as large as the stage allows,
with the narrator in a column beside it. Neha Kulkarni, a Super admin, goes from the landing page to the console on it,
and signs in on the console's own screen.

The prospect's demo request is sent before the recording starts, through the landing page's own Book a demo endpoint
(`POST /v1/demo-requests`), so the landing page is shown only briefly. The Overview then has the request waiting.

**The journey** (14 chapters, each opening with a title card):

1. **the landing page, briefly:** the hero and its film's four chapters, marked; a glance at the agents at work, the
   one yes and the three plans; the bar's Console and Workspace, marked; Console to the console's sign-in;
2. **the console's sign-in:**
   - the agents network swept by the cursor;
   - five agents picked, each saying what it did;
   - a ripple on the field, then Pause and Play;
   - the form's three parts marked, then Neha signs in;
3. **monitoring the dashboards:**
   - the four figures, marked;
   - the live reading every 30 s, with Pause and Resume;
   - Food by day over 7 and 90 days, a day's tooltip, and the table;
   - Agents at work, with Approve filtering the batches;
   - every client's batches: the filters marked, a search, waiting and closed, sorted by days left, paged;
   - Needs attention, Demo requests and Agent runs, marked;
   - the landing page's request, waiting to be set up;
4. **New client from the request:** each of its seven steps, its fields or options marked and explained; then the
   client's head and its seven tabs;
5. **the first stock export:** a CSV of the client's own (fictional distributors in its city, written for the run), the
   Data agent mapping it live, the supply chain drawn, and the profile sheet;
6. **people:** the approver invited as Approver, the people table, and a row's menu;
7. **the eleven agents, one by one:** each inspector read, and most of them customised and saved. Also a run on request,
   and Outreach switched off and on. Then the pipeline after, and the client's actions (read, not pressed);
8. **channels and rules:** the exits, the guardrails raised, and the destruction at the godown marked and changed;
9. integrations, and the plan moved to Growth;
10. the client's audit log, every line in Neha's name;
11. **monitoring a live client, Munchly Foods:** its clock and journey day (read and cancelled), its runs and timers
    (nothing fired), its actions, its distributors, SKUs and gates;
12. **the platform:** clients searched, the agents' catalog, a connector, the plans, the staff, and the audit log
    filtered to the new client;
13. the new client among the clients;
14. Neha's account, and signing out.

**Production gains, each run:** one client, its admin and its approver (Firebase accounts on the default password in
the shared pool), its demo request, its first export in its exports bucket, and one Data agent run on it (a saved map
for the Bizom-style layout: no model call).

**The notes** arrive as chat bubbles beside what is read, never over it, with a tail pointing at it, as a WhatsApp
message's bubble has (stage.ts `spot`, SC-197). Each bubble carries the Smart-Clearance mark and the note's tag, a quoted
line naming whose screen it is and its address, then the note's title and a sentence or two. There is no time and no
ticks: it is not a chat.

A bubble takes the side with room, in this order: right, left, below, above. A narrow side takes a narrower bubble.
While it shows, the rest of the screen dims, and the ring round what is read closes in with corner brackets, a sweep of
light and a pulse. Several parts of one screen are **marked** together (stage.ts `mark`): each is numbered in its own
bright cut-out of the dim, and one bubble beside them all lists what each number is. Every click shows: the arrow dips
and two rings spread.

**Smooth on film** (SC-197):

- every screen's frame reaches the stage as it arrives, so the 25 fps recording has a new frame each time. A 50 ms tick
  let only 20 a second through, and motion juddered;
- the stage drives every scroll itself: a short way glides at a readable pace, and a long way, over three screens, dips
  to dark and cuts. A browser's smooth scroll over a whole page strobed.

```sh
corepack pnpm test:journey:admin                                   # on this machine's stack, with the landing page on :5173
E2E_TARGET=prod corepack pnpm test:journey:admin                   # on production
E2E_COMPANY="Nilgiri Foods" E2E_FROM=agents corepack pnpm test:journey:admin   # part of it, on a client already set up
```

`E2E_FROM` signs Neha in to the console and leaves the landing page out.

**Cutting it for the edit** (SC-197): the stage writes `recording.chapters.json` beside the recording (each chapter's
title, start and end), and `cut-chapters.mjs` cuts one clip per chapter, a quarter second either side, with the
chapters in YouTube's form and as CSV:

```sh
node tests/journey/cut-chapters.mjs <recording.mp4> [out-dir] [--1080]
```

Its one-laptop run on production (SC-197) is in `runs/2026-10-12-prod-admin-laptop/`. The two-screen runs before it set
up Shivalik Snacks (`runs/2026-10-12-prod-admin-detail/`), Nilgiri Foods (`runs/2026-10-12-prod-admin/`) and, on three
screens, Aravalli Snacks.

## Admin and console tour

The same story in about a minute (SC-199), `admin-console-tour.journey.ts`, on one laptop. It covers:

1. the landing page, briefly, and the bar's Console;
2. the console's sign-in, its agents picked quickly, Neha signing in, and the Overview's figures;
3. one client's agents configured:
   - the pipeline;
   - the Watcher's Blinkit gate;
   - the Negotiator trusted to act;
   - the approval, always on.

**The notes** are green cards beside what is read, with the tag and the title on one line and a caret pointing at it.
The rings, numbers, clicks and the screen's outline are green too (the stage's `Cast.ink: 'green'` and
`Cast.notes: 'card'`). Notes are held for about half as long (`Cast.pace`), and the sign-in's note on the password is
left out (`Cast.quiet`).

**What it changes:** it sets up no client. It configures one an earlier Admin and console E2E run set up (`E2E_CLIENT`,
`kaveri` by default). The Watcher's gate moves between two values, so every run saves a change and writes its audit
line; the Negotiator ends on Act.

```sh
corepack pnpm test:journey:admin-tour                       # on this machine's stack, with the landing page on :5173
E2E_TARGET=prod corepack pnpm test:journey:admin-tour       # on production
```

Its run of 12 Oct on production is in `runs/2026-10-12-prod-admin-tour/`.

## Admin and console walkthrough

Between the tour and the detailed run (SC-204), `admin-console-walk.journey.ts`: about three minutes on one laptop,
brief and high level, in green cards and a chapter card for each of six parts.

1. The landing page, scrolled over quickly with nothing on it ringed, then the bar's Console, ringed and pressed.
2. Neha Kulkarni, a Super admin, signs in on the console's own screen.
3. Monitoring: the Overview's four figures, read live; Agents at work, every batch at its stop (one stop listed);
   Needs attention, demo requests and the runs today; the platform's agents across every client.
4. A SaaS client, configured: every client, and where New client starts; then a client an earlier run set up
   (`E2E_CLIENT`, `kaveri` by default): its first stock export mapped by the Data agent and its supply chain (the data),
   and its people with the invitation (the users).
5. Quick-commerce gates by SKU and by batch, read on a client with its own (`E2E_GATES_CLIENT`, `munchly` by default,
   never changed): the SKU table with each SKU's Blinkit and Zepto, Instamart gates; the Mango Drink's own gates and
   its batch checked against them; Choco Cream Biscuits' batch MF-2409-204 overridden to 30% with its reason, and the
   override's form opened, then cancelled.
6. The first client's agents: the pipeline, the Watcher's Blinkit gate changed and saved, the Negotiator on Act, the
   approval always on.

**What it changes:** it adds no client. The Watcher's gate moves between 60 and 65 days, so every run saves a change and
writes its audit line, as the tour does.

**The stage's cards** (SC-204): where what is read nearly fills its screen, so no side has room for the card, the card
sits inside the screen at its foot's right corner, with no caret, rather than past the screen's edge.

```sh
E2E_TARGET=prod corepack pnpm test:journey:admin-walk        # on production
E2E_KEEP='../../playwright-automation-videos/admin-console-walk-prod-{stamp}.mp4' E2E_TARGET=prod corepack pnpm test:journey:admin-walk
```

Its run of 13 Oct on production is in `runs/2026-10-13-prod-admin-walk/`.

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
