# Munchly Chips Sad Path E2E on three screens, on production: run of 13 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to its swing, on the sad
path, on production's apps (munchly-smartclearance.web.app, smartclearance-console.web.app) and production's
backend-api and agents on Cloud Run, on three screens at once (SC-179, SC-184), told as the admin tour tells it (SC-199,
SC-201, SC-202).

**Passed end to end**, in 17 min 48 s, 87 steps, from a reset, on the first attempt, with every figure as the story has
it and Vision's checks 4 of 4. The recording is 17 min 38 s at 2560 × 1440.

The maintainer asked for the chips' sad path on production with a journey reset, recorded and shown live, told as the
Mango Drink's run of the same morning (SC-201): Supply Chain on a tablet in landscape, the distributor on a tablet in
portrait, everyone else on a phone; clicks shown; sign-ins from the sign-in page, Priya and Rakesh signed in
throughout; green notes and highlights on the major parts only; only two kiranas accepting and the rest rejecting, two
accepts and one rejection shown and the rest from the backend; Priya's Execution open for the live updates; every
paper shown clearly; the Finance and ESG dashboards; and the swing and how it is worked out, last.

The chips' plan has no staff sale and no food bank: its lines are the kiranas' scheme (588 packets) and the ExpireSoon
lot (772 packs). Priya's Execution followed the orders, the lot and the destruction instead.

It ran on branch `SC-202-chips-sad-prod-recorded`, against production at `5070e166`.

- **What ran:** `E2E_TARGET=prod E2E_KEEP='…/playwright-automation-videos/munchly-chips-sad-e2e-prod-{stamp}.mp4'
corepack pnpm test:journey:sad`, with the monitor window on screen.
- **The recording:** `playwright-automation-videos/munchly-chips-sad-e2e-prod-2026-10-13_11-07-40.mp4` (2560 × 1440,
  90.9 MiB), its 1080p (61.7 MiB) and 720p (25.6 MiB) copies and `….chapters.json`, local and git-ignored. The stage's
  bar reads "recorded 13 Oct 2026, 11:07 BST".
- **The screens:** Priya Deshmukh on a tablet in landscape (1180 × 820), Rakesh on a tablet in portrait (820 × 1180),
  each signing in on camera and online to the end; a phone (390 × 844) on which Neha signs in to the console, and two
  kiranas, Om Sai Provision and Agrawal Wholesale sign in to the workspace as each is needed. Everyone signs in on the
  app's own screen; the password field takes a stand-in and the check is answered with the person's own session.
- **The telling:** green rings, clicks and screen outline; a green card beside the major moments only (the ₹26,330 at
  stake, Vision's check, the split, the yes, the ExpireSoon listing, a live order, a shop's no, the counter, closing the
  window, the e-invoice, expiry day, the destruction against evidence, the second yes, the certificate, GST, ESG, Rakesh
  ending whole, the swing and its formula); a chapter card as each of 14 chapters opens.

## Chapters

| #   | Chapter                    | From  | To    |
| --- | -------------------------- | ----- | ----- |
| 1   | Everyone signs in          | 0:00  | 0:52  |
| 2   | A fresh journey            | 0:52  | 1:33  |
| 3   | The Watcher finds the risk | 1:33  | 2:04  |
| 4   | Vision checks the label    | 2:04  | 2:34  |
| 5   | The plan, and one yes      | 2:34  | 3:36  |
| 6   | The kiranas answer, live   | 3:36  | 6:51  |
| 7   | The ExpireSoon lot         | 6:51  | 7:51  |
| 8   | The window closes short    | 7:51  | 8:56  |
| 9   | Expiry day                 | 8:56  | 9:19  |
| 10  | Destroyed against evidence | 9:19  | 12:15 |
| 11  | The papers                 | 12:15 | 13:52 |
| 12  | Finance and ESG            | 13:52 | 14:37 |
| 13  | Rakesh and his kiranas     | 14:37 | 16:41 |
| 14  | The swing, worked out      | 16:41 | 17:38 |

## What happened

- **Detect:** ₹26,329.60 if destroyed. Vision matched Rakesh's label photo to the export.
- **The plan:** ₹21,770 net: 588 packets to Rakesh's 38 kiranas, 772 to ExpireSoon. Priya approved it and kept
  Execution open from there.
- **The kiranas:** Shree Ganesh Kirana and Jai Durga Stores ordered 24 packets each on the phone, each order on Priya's
  Execution as it landed. Om Sai Provision pressed Not this time on the phone; the other 34 shops that joined the app
  said no through backend-api as themselves (35 in all). Shree Sai Kirana, only invited, could not answer.
- **The lot:** Agrawal Wholesale bid ₹13; the Negotiator countered ₹14.20 and Agrawal took it with a ₹1,644 token. The
  award and the truck's collection each showed live on Priya's Execution.
- **The window:** Neha closed it from the console; the lot was already won, so 540 packets stayed at Kalamna godown.
- **The papers drafted:** Rakesh issued INV/26-27/0931 from Tally and ran his van round to the two shops.
- **Expiry day:** Report now asked Rakesh to destroy the 540 packs, shown on Priya's Execution as it came. Rakesh sent
  the photos made for 540 packs, Orange City Enviro Services and OCE/DC/26-27/0219, and the officer, both witnesses and
  he signed the certificate on his tablet, stroke by stroke. Vision's checks: 4 of 4 (the batch, about 540 packs in
  view, the slate, both photos today).
- **The second yes,** from Execution's destruction card: both photos, the four checks, the four signatures. It issued
  the Expiry credit note CN/0118 (₹13,284) and the certificate for 540 packs. Actual net ₹11,702.40.
- **The papers,** each read top to bottom and ending on its signature: the certificate and its log, CN/0118, the tax
  invoice INV/26-27/0931 with its e-invoice, the price-support credit note CN/0117, the GST ITC memo, the sales register
  and both kiranas' invoices. Priya marked the pack reviewed. Rakesh read his own: the tax invoice, the e-way bill
  check, both credit notes, the certificate and his two invoices to kiranas; then the photos he sent. On the phone,
  Shree Ganesh Kirana read its tax invoice and Om Sai Provision the offer it said no to.
- **Finance and ESG:** the ledger's Money and GST readings for the year so far, the Impact dashboard, and the batch's
  BRSR line.
- **Rakesh ends whole** at ₹0.
- **The swing:** ₹14,868, read section by section (the bridge, if it were destroyed, what the plan did with the packs
  left at the godown, the swing, how the loss was kept small).

## Findings

- Shree Sai Kirana never joined the app (its invitation is open), so it could not answer the scheme.

## After it

Production's journey day is back at 24 hours (the console's clock, as Neha). The chips are cleared; the Mango Drink is
at day 0.
