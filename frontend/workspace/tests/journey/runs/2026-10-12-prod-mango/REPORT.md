# Munchly Mango E2E on three screens, on production: run of 12 Oct 2026

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) from a console Reset journey to Impact's
report, on the happy path, on production's apps (munchly-smartclearance.web.app, smartclearance-console.web.app) and
production's backend-api and agents on Cloud Run, on three screens at once (SC-190), as Munchly Chips Sad Path E2E plays
the chips (SC-179, SC-184, SC-188).

**Passed end to end**, in 13 min 47 s, 57 steps, from a reset, with every figure as the plan has it and no finding but
the two known notes on the kirana screen's twelves.

The maintainer asked for "the logic on Munchly mango drinks happy path e2e with Lakhsmi agencies on production", and
picked three screens with the business notes, as the chips' sad path had them.

It ran on branch `SC-190-mango-three-screens`, against production at `b3caf45` (SC-188 and SC-189 deployed).

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:mango-stage`, with the monitor window on screen.
- **The screens:** Priya Deshmukh on a tablet in landscape (1180 × 820), Lakshmi Agencies on a tablet in portrait
  (820 × 1180), each signing in on camera and online to the end; a phone (390 × 844) on which Neha signs in to the
  console, three kiranas and Meera of Feeding India sign in to the workspace as each is needed. Everyone signs in on the
  app's own screen; the password field takes a stand-in and the password check is answered with the person's own
  session, so no password is typed.
- **The notes:** 22 places in the suite ring an element, dim the rest of its screen and show a card beside it, in
  business terms: why Rehearsal, Setup's guardrails, Lakshmi Agencies' one permission, why the Watcher is run by hand,
  the ₹22,657 at stake, the verified label, every exit priced net (and why the Mango, at 22 days, is too close to its
  date for ExpireSoon), the recommended split with its figures, the yes, the kirana scheme, each order landing live,
  the scheme filling, the staff sale on one receipt, food for Feeding India, the van round, the price-support note, an
  invoice for every shop, why the report is brought forward, impact from the ledger, Lakshmi Agencies ending whole, and
  the outcome.
- **The kiranas:** the first three ordering shops sign in on the phone and order (Sri Lakshmi Ganapathi Kirana 24,
  Al-Noor Provision Store 28, Deccan General Stores 32), each order checked live on Priya's Execution. The other 49
  ordering shops order as themselves through backend-api, each with its own session, while the recording shows the
  three (a sign-in on camera for each of 52 shops would take twenty minutes); the note on the scheme filling says so.
- **The journey day:** 60 min (Rehearsal), set by the reset; afterwards production's day was put back to 24 hours from
  the console's clock, as Neha.
- **Production is left as the run ended:** the Mango Drink cleared, nothing left at the godown; the chips at day 0.
- **The recording:** `munchly-mango-e2e-prod-2026-10-12.mp4` beside this file, 13 min 35 s, H.264, 2560 × 1440,
  25 fps, 55 MB, with a 1080p copy (24 MB). They stay local (git-ignored), with copies in the repository root's
  `playwright-automation-videos/`.
- **The record:** `report.json` and `stills/`, the stage at each of the 57 steps.

## Figures

- **At Detect:** ₹22,657.20 if destroyed.
- **The label:** Vision matched the batch, its dates and MRP to the export.
- **The plan:** ₹16,917.10 net, with no ExpireSoon lot:
  - 1,372 packets to the kiranas;
  - 150 to the staff sale at Begum Bazaar godown;
  - 58 to Feeding India.

  58 kiranas were offered the scheme.

- **The orders:** 52 shops, 1,372 packets, each with its tax invoice from Lakshmi Agencies (52 in its series, ₹823.20
  of GST collected).
- **The staff sale:** 150 packs at ₹8, recorded on its consolidated receipt LA/SR/26-27/0002, which Vision read as 18
  UPI payments of ₹1,200 in all, matching the count.
- **The donation:** 58 packs collected by Feeding India, receipt FI/HYD/26-27/0417.
- **The papers, each with its PDF:** the price-support credit note CN/0117 (₹5,932), the staff sale's receipt, the GST
  ITC memo, the FSSAI checklist (58 units) and the donation receipt. No tax invoice and no e-way bill: the plan has no
  ExpireSoon lot. No destruction certificate: nothing was left.
- **The report:** actual net ₹16,917.10, a swing of ₹22,194 against destroying the packs; nothing left at the godown.
- **Impact:** 339.7 kg kept out of landfill (327.2 kg resold, 12.5 kg donated), 0 kg destroyed, 849.3 kg CO₂e avoided,
  58 meals.
- **Lakshmi Agencies ends whole:** ₹16,464 from 52 kiranas, ₹1,200 from its staff, ₹5,932 from Munchly's credit note:
  ₹23,596 received against ₹23,596 paid, ₹0 gained or lost.

## Findings

Only the two known notes, from the offer screen ordering in twelves (SC-104):

- Bilal Stores ordered 16 packets where the story has 28;
- Saraswathi Kirana ordered 16 packets where the story has 4.
