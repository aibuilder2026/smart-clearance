# Munchly Mango E2E on three screens, locally, with the console's fill: run of 15 Oct 2026

The Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) from a console Reset journey to its swing, on
the happy path, on this machine's stack, on three screens at once (SC-190, SC-201). For SC-215, two kiranas order on
the phone and Neha fills the rest of the scheme from the console, as a judge would.

**Passed end to end** in 14 min 50 s: 72 steps from a reset, with no finding and every figure as the plan has it. The
recording is 14 min 41 s at 2560 × 1440.

The maintainer asked for it in the request that built the console's fill: "make sure you locally run the playwright
automation suite (just for Mango suite) end to end locally for this use case".

It ran on branch `SC-215-fill-scheme` at `46141b0f`, with:

- backend-api on :8000;
- the agents' pull worker on live Gemini;
- the workspace app's and the console's dev servers on :5175 and :5174, on the local API.

- **What ran:** `corepack pnpm test:journey:mango-stage`, with `E2E_LIVE=0` (no monitor window) and `E2E_KEEP` set
  to `…/playwright-automation-videos/munchly-mango-e2e-local-{stamp}.mp4`.
- **The recording:** `playwright-automation-videos/munchly-mango-e2e-local-2026-10-15_12-36-51.mp4` (2560 × 1440,
  74.8 MB) and its `….chapters.json`, local and git-ignored. The stage's bar reads "recorded 15 Oct 2026, 12:36 BST ·
  live on this machine's stack".
- **The screens,** as on 13 Oct:
  - Priya Deshmukh on a tablet in landscape (1180 × 820);
  - Lakshmi Agencies on a tablet in portrait (820 × 1180);
  - a phone (390 × 844), on which Neha signs in to the console, and two kiranas and Meera of Feeding India sign in to
    the workspace as each is needed.

## Chapters

| #   | Chapter                    | From  | To    |
| --- | -------------------------- | ----- | ----- |
| 1   | Everyone signs in          | 0:00  | 1:18  |
| 2   | A fresh journey            | 1:18  | 2:00  |
| 3   | The Watcher finds the risk | 2:00  | 2:28  |
| 4   | Vision checks the label    | 2:28  | 3:03  |
| 5   | The plan, and one yes      | 3:03  | 4:07  |
| 6   | The kiranas order, live    | 4:07  | 6:02  |
| 7   | The staff sale, on UPI     | 6:02  | 9:15  |
| 8   | The donation               | 9:15  | 10:02 |
| 9   | The papers                 | 10:02 | 11:33 |
| 10  | Impact posts the ledger    | 11:33 | 12:03 |
| 11  | Finance and ESG            | 12:03 | 12:49 |
| 12  | Lakshmi Agencies' side     | 12:49 | 13:46 |
| 13  | The swing, worked out      | 13:46 | 14:41 |

## What happened

- **Detect:** ₹22,657.20 if destroyed. Vision matched Lakshmi Agencies' label photo to the export.
- **The plan:** ₹16,917.10 net: 1,372 packets to the kiranas, 150 to the staff sale, 58 to a food bank. There is no
  ExpireSoon lot at 22 days left. Priya approved it and kept Execution open from there.
- **The kiranas:** Sri Lakshmi Ganapathi Kirana (24) and Al-Noor Provision Store (28) ordered on the phone, each order
  on Priya's Execution within seconds.
- **The console's fill (SC-215):** on Munchly's Agents tab, the Stand in for the partners card read "Lakshmi Agencies'
  kiranas · MF-2410-118: 2 of 58 have ordered · 50 more order as the story has them, 1,320 packets".
  - Neha pressed Fill the scheme. The console asked first: "50 of the 56 shops that haven't answered order as the
    story has them". She pressed Fill now, and the card read "Filled Fri 2 Oct, 09:38: 50 shops ordered 1,320
    packets".
  - The scheme closed full: 52 shops and 1,372 packets, each with its tax invoice (LA/26-27/0972 to 1023). Priya's
    Execution read "Filled at 09:38: 52 of 58 shops took every packet, before the window closed".
  - The offer window's timer left the schedule.
  - Bilal Stores and Saraswathi Kirana ordered their story shares, 28 and 4: the fill places any count, where the offer
    screen orders in twelves (13 Oct's finding).
- **The staff sale:** LA/SR/26-27/0002, 18 UPI payments, ₹1,200, read by Vision and matching the count; 150 packs
  recorded. Vision's read took 2 min 34 s (the Pro preview's retries).
- **The donation:** Feeding India confirmed and collected 58 packs; receipt FI/HYD/26-27/0417.
- **The papers,** each with its PDF: CN/0117, the staff sale receipt, the donation receipt, the GST ITC memo, the FSSAI
  checklist, the sales register and one kirana's invoice. Priya marked the pack reviewed. Lakshmi Agencies read its own,
  with its 52 invoices to kiranas.
- **The close:** Report now; actual ₹16,917.10, nothing left at the godown.
- **Finance and ESG, Lakshmi Agencies ending whole, and the swing:** ₹22,194.30, read section by section.

## Findings

None in the run's report. Seen in its stills, and not from this change: on the batch's head, Priya's Execution read
"Scheme open · 52 of 52 kiranas ordered" after the scheme had closed full. The head counts the story's ordering shops,
not the 58 offered, and doesn't say the scheme has closed: SC-184 noted the same ("2 of 2 kiranas ordered").

## Afterwards

Munchly's journey day was set back to 24 hours (`hydrate.sh --day-minutes munchly=1440`). The Mango Drink cleared. The
Masala Chips wait unflagged, since Rakesh Traders hasn't given this journey its permission.
