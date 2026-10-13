# Munchly Mango E2E on three screens, on production: run of 13 Oct 2026

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) from a console Reset journey to its swing, on
the happy path, on production's apps (munchly-smartclearance.web.app, smartclearance-console.web.app) and production's
backend-api and agents on Cloud Run, on three screens at once (SC-190), told as the admin tour tells it (SC-199, SC-201).

**Passed end to end**, in 14 min 19 s, 69 steps, from a reset, with every figure as the plan has it. The recording is
14 min 9 s at 2560 × 1440.

The maintainer asked for the Mango Drink's happy path on production with a journey reset, recorded and shown live:
Supply Chain on a tablet in landscape, the distributor on a tablet in portrait, everyone else on a phone; clicks shown;
sign-ins from the sign-in page, Supply Chain and the distributor signed in throughout; green notes and green highlights
on the major parts only, as the admin tour has them; two kiranas on the phone and the rest through the backend, with
Priya's Execution open for the kiranas, the staff sale and the pickup; every paper shown clearly; the Finance and ESG
dashboards; and the swing and how it is worked out, last.

It ran on branch `SC-201-mango-prod-recorded`, against production at `5070e166` (SC-199 deployed; the swing sheet is
SC-195's).

- **What ran:** `E2E_TARGET=prod E2E_KEEP='…/playwright-automation-videos/munchly-mango-e2e-prod-{stamp}.mp4'
corepack pnpm test:journey:mango-stage`, with the monitor window on screen.
- **The recording:** `playwright-automation-videos/munchly-mango-e2e-prod-2026-10-13_09-09-12.mp4` (2560 × 1440,
  71.7 MB), its 1080p copy (`…-1080p.mp4`, 48.4 MB) and `….chapters.json`, local and git-ignored. The stage's bar reads
  "recorded 13 Oct 2026, 09:09 BST".
- **The screens:** Priya Deshmukh on a tablet in landscape (1180 × 820), Lakshmi Agencies on a tablet in portrait
  (820 × 1180), each signing in on camera and online to the end; a phone (390 × 844) on which Neha signs in to the
  console, and two kiranas and Meera of Feeding India sign in to the workspace as each is needed. Everyone signs in on
  the app's own screen; the password field takes a stand-in and the check is answered with the person's own session.
- **The telling:** green rings, clicks and screen outline; a green card beside 15 major moments (the ₹22,657 at stake,
  Vision's check, the split, the yes, a live order, the scheme filling, the staff sale's UPI receipt, Feeding India's
  receipt, the price support, an invoice for every shop, the journey closing, GST, ESG, Lakshmi Agencies ending whole,
  the swing and its formula); a chapter card as each of 13 chapters opens.

## Chapters

| #   | Chapter                    | From  | To    |
| --- | -------------------------- | ----- | ----- |
| 1   | Everyone signs in          | 0:00  | 0:44  |
| 2   | A fresh journey            | 0:44  | 1:23  |
| 3   | The Watcher finds the risk | 1:23  | 1:47  |
| 4   | Vision checks the label    | 1:47  | 2:23  |
| 5   | The plan, and one yes      | 2:23  | 3:34  |
| 6   | The kiranas order, live    | 3:34  | 7:27  |
| 7   | The staff sale, on UPI     | 7:27  | 8:24  |
| 8   | The donation               | 8:24  | 9:17  |
| 9   | The papers                 | 9:17  | 10:55 |
| 10  | Impact posts the ledger    | 10:55 | 11:28 |
| 11  | Finance and ESG            | 11:28 | 12:15 |
| 12  | Lakshmi Agencies' side     | 12:15 | 13:12 |
| 13  | The swing, worked out      | 13:12 | 14:09 |

## What happened

- **Detect:** ₹22,657.20 if destroyed. Vision matched Lakshmi Agencies' label photo to the export.
- **The plan:** ₹16,917.10 net: 1,372 packets to the kiranas, 150 to the staff sale, 58 to a food bank; no ExpireSoon
  lot at 22 days left. Priya approved it and kept Execution open from there.
- **The kiranas:** Sri Lakshmi Ganapathi Kirana (24) and Al-Noor Provision Store (28) ordered on the phone, each order
  on Priya's Execution within seconds; the other 50 ordered through backend-api as themselves. 52 shops, 1,372
  packets, each with its tax invoice (LA/26-27/0972 to 1023).
- **The staff sale:** LA/SR/26-27/0002, 18 UPI payments, ₹1,200, read by Vision and matching the count; 150 packs
  recorded. On Priya's Execution: the sale, its 18 UPI references and the receipt whole.
- **The donation:** Feeding India confirmed and collected 58 packs, each seen live on Priya's Execution; Meera read
  receipt FI/HYD/26-27/0417.
- **The papers,** each read top to bottom and each with its PDF: the price-support credit note CN/0117 (₹5,932), the
  staff sale receipt, the donation receipt, the GST ITC memo, the FSSAI checklist, the sales register and one kirana's
  invoice. Priya marked the pack reviewed. Lakshmi Agencies read its own: the credit note, the staff sale receipt, its
  52 invoices to kiranas, and its copy of the donation receipt.
- **The close:** Report now; actual ₹16,917.10, nothing left at the godown.
- **Finance and ESG:** the ledger's Money and GST readings for the year so far, the Impact dashboard, and the batch's
  BRSR line (339.7 kg kept out of landfill, 58 meals).
- **Lakshmi Agencies ends whole** at ₹0.
- **The swing:** ₹22,194.30: a P&L of −₹462.90 with the plan against −₹22,657.20 in the bin, read section by section
  (the bridge, if it were destroyed, what the plan did, the swing, how the loss was kept small).

## Findings

- A console resource failed once to load (`net::ERR_CONNECTION_CLOSED`) on Neha's phone; nothing on screen was missing.
- The known twelves on the offer screen: Bilal Stores and Saraswathi Kirana ordered 16 each (28 and 4 in the story).

## Before it

A first attempt the same morning (08:49) passed 53 steps and stopped at ESG: the suite moved to the ledger's Impact
reading by changing the address, which the ledger reads only as it opens. The suite now presses the Impact reading. Its
partial video is kept as `…_08-49-53-incomplete.mp4`. The last three steps were then tried on the journey as it stood
before the full run.

## After it

Production's journey day is back at 24 hours (the console's clock, as Neha). The Mango Drink is cleared; the chips are
at day 0.
