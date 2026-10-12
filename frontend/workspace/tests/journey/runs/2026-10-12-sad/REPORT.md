# Munchly Chips Sad Path E2E: run of 12 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to Impact's report, on three
screens at once (SC-179, SC-184). Two kiranas buy, Neha closes the window on the rest, and the packets left are
destroyed at the godown.

**Every step ran to the end**, in 9 min 25 s, 78 steps, from a reset. Playwright marks the test failed on one soft
check: Vision passed 3 of its 4 checks on the destruction's photos, where the story has 4 of 4 (below). This is the
second of two takes of this run; the first ended the same way (Vision's count read about 250 there too), and its
recording was replaced by this one.

The maintainer asked for:

- only 2 kiranas buying, and Neha closing the kiranas' window from the console, with no declines one by one;
- Priya's tablet in landscape, Rakesh's in portrait, everyone else on a phone;
- the clicks shown; the certificate being signed; the photos being validated; Priya reading the certificates, glancing
  at the kirana invoices and reading the Impact screens;
- Priya watching the kiranas' orders arrive live;
- all three screens fully loaded, Priya and Rakesh online throughout;
- actual sign-ins on the apps' own screens, not the stage's "Signing in" chips;
- the whole session recorded as one video.

It ran on branch `SC-184-sad-path-sign-ins`, stacked on `SC-185-scheme-left-at-godown`.

- **What ran:** `corepack pnpm test:journey:sad` from `frontend/`, with the monitor window on screen.
- **The stack, all local:**
  - backend-api on :8000 (`smart_clearance`, schema 0015);
  - the agents' pull worker on live Gemini, restarted on `main` after SC-183;
  - the workspace app's and the console's dev servers on :5175 and :5174, restarted on this branch.
- **The screens:**
  - Priya Deshmukh on a tablet in landscape (1180 × 820), with the narrator under it;
  - Rakesh bhai on a tablet in portrait (820 × 1180);
  - a phone (390 × 844) on which Neha, the two kiranas, Agrawal Wholesale and, at the end, a shop the window closed on
    sign in as they are needed;
  - a cursor on every screen: it glides to each control and ripples where it presses, glides over what a person reads,
    and follows a pen on the signature pad exactly;
  - a step ended only once every screen's photos and loading placeholders had landed.
- **The sign-ins:** the recording opens on three sign-in screens. Each person types their email on the app's own
  sign-in screen and presses Sign in, and the app shows its welcome and its splash; the workspace's first sign-in on a
  device shows its notifications step ("Notifications are blocked" in the test browser), which the person continues
  past. No password is typed: the password field takes a stand-in, and the one call that checks it, Identity Toolkit's
  `signInWithPassword`, is answered by the suite with the person's own Firebase session (the custom token
  `sessions.sh` mints). The rest is real: the account read from Firebase, the session opened with backend-api. Between
  people on the phone, the one before signs out of the workspace from Profile, with the app's own sign-out; Neha's
  console stays signed in on its own address (the console has no sign-out on a phone, below).
- **The stage** renders headless, so no window crops it: every frame of the recording shows all three screens whole and
  the narrator. (SC-179's recording was captured from a visible window and was cropped from about a minute in.)
- **The journey day:** 60 min (Rehearsal), set by the reset, then put back to 24 hours
  (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** the chips cleared, their 540 packets destroyed at Kalamna Market godown.
- **The recording:** `munchly-chips-sad-path-e2e-2026-10-12.mp4` beside this file: 9 min 16 s, H.264, 2560 × 1440,
  25 fps, 41.4 MB. It stays local (git-ignored).
- **The record:** `report.json` (every step, with its time and figures) and `stills/`, the stage at each of the 78
  steps.

## The journey

1. **Sign-ins, on camera:** Priya signs in on her tablet (her Command Center), Rakesh on his (his Today), and Neha in
   the console on the phone.
2. **Reset (phone):** Neha resets Munchly's journey from the console; both tablets reload in place behind the app's own
   loader.
3. **Setup and permission:** Priya confirms Setup; Rakesh gives his permission.
4. **The Watcher (phone):** Neha runs it from the console; the chips are flagged, −₹26,330 if destroyed.
5. **The label photo (Rakesh's tablet):** he uploads it and sends it; his screen shows Vision reading, then the batch,
   its dates and MRP matching the export.
6. **The plan (Priya's tablet):** ₹21,770, 588 to the kiranas and 772 to ExpireSoon; she approves it. The Lister lists
   the lot, and Outreach sends the scheme to 38 kiranas.
7. **Two orders, seen live:** Priya's tablet stays on Execution. Shree Ganesh Kirana signs in on the phone and orders 24
   packets; on Priya's tablet, without a reload, the order arrives in the scheme's latest orders and the count moves to
   1 of 38. Ganesh ji signs out, Jai Durga Stores signs in and orders 24; it arrives on Priya's tablet, 2 of 38.
   Rakesh's Orders follows too.
8. **ExpireSoon (phone):** Agrawal Wholesale signs in, bids ₹13; the Negotiator counters ₹14.20, and Agrawal takes it
   with a ₹1,644 token. Rakesh's Deliveries reads "Load once the scheme closes".
9. **The window (phone):** Agrawal signs out; Neha, still signed in to the console, closes the offer window on the other
   36 shops. On Priya's tablet, live: "The window ended 09:27 with 2 of 38 shops ordering 48; the 540 left stayed at
   Rakesh Traders' godown" (SC-185).
10. **Rakesh's day (tablet):** he loads the buyer's truck, issues INV/26-27/0931 from Tally, and runs his van round to
    the 2 shops.
11. **Expiry day (phone):** Neha fires it. Rakesh is asked to destroy the 540 packs at his godown.
12. **The evidence (Rakesh's tablet):** he uploads the before and after photos, picks Orange City Enviro Services and
    types its certificate OCE/DC/26-27/0219. The cursor reads the window and the two witnesses. Then the certificate to
    sign, stamped TO SIGN: the officer, both witnesses and Rakesh each sign in their own place, drawing their signature
    on the pad stroke by stroke (56 s for the four), and the progress reads 4 of 4 signed. He sends it: "Vision is
    checking your photos", over the two photos, then "Sent for approval".
13. **The second yes (Priya's tablet):** the review: both photos, Vision's four checks read one by one, the certificate
    as signed at the facility with each signature read, then what her yes issues. She approves, and Impact reports:
    Expiry credit note CN/0118 and the certificate of destruction. The chips clear.
14. **The certificate (Priya's tablet):** its reason, method, facility, date and time; each signature; then page 2, the
    destruction log and its initials.
15. **The pack:** the Expiry credit note, the tax invoice, the price-support credit note and the GST ITC memo, each
    signed; the sales register, and a glance at each kirana's tax invoice (RT/26-27/1279 and 1280); Mark reviewed.
16. **The Impact screens:** the quarter's tiles, food by week, where the kilos went, by product, the batch's BRSR line,
    and the Command Center's Impact card.
17. **Read back:** Rakesh's batch (what happened, he ends whole, his Expiry credit note and certificate, his photos); on
    the phone, Shree Ganesh Kirana's order and tax invoice, and Om Sai Provision's offer, which the window closed on;
    Priya's Execution, the ledger and the Command Center.

## Figures

- **The plan:** ₹21,770; 588 to the kiranas, 772 to ExpireSoon; 38 kiranas offered.
- **The orders:** 2 shops, 48 packets; the window closed on the other 36; the ExpireSoon lot kept its 772.
- **The deal:** 772 packs at ₹14.20, token ₹1,644.
- **Realised:** kiranas 48, ExpireSoon 772; 540 left at the godown, settled as destroyed there by the distributor.
- **Vision's checks, 3 of 4:**
  - Batch MF-2409-117 read on the carton label: ok;
  - About 250 packs in view, against the 540 left: **not ok**;
  - The slate reads MF-2409-117 · 540 packets · 03-10-26: ok;
  - Both photos taken today, at the godown and the landfill: ok.
- **On the yes:** Expiry credit note CN/0118, ₹13,284; certificate OCE/DC/26-27/0219, 540 packs, signed by the officer,
  both witnesses and Rakesh.
- **Actual net:** ₹11,702.40, against the plan's ₹21,770.

## Findings

- **warning, Vision's count:** on both takes Vision read about 250 packs in the before photo where 540 were left, so
  its count check failed and Priya approved past it (the operator decides on the yes). The photo reaches Gemini as
  uploaded, full size (1184 × 896, quality 92), and the read is given no count to anchor on. In SC-179's run the same
  photo read 540, and six trial reads gave 500 to 540; today two in a row gave 250. A photo whose packs can be counted
  plainly would make this check steady.
- **Fixed on the way (SC-185):** Execution's Outreach card said the unordered packets "moved to ExpireSoon" whenever the
  window ended short. backend-api moves them onto the lot only while it is still live; here it was already won, and the
  card now says they stayed at Rakesh Traders' godown.
- **note, the batch head's count:** once the window closed short, Priya's batch head read "Awarded at ₹14.20 · 2 of 2
  kiranas ordered", where it read "1 of 38 kiranas ordered" while the scheme was open. The stub's slow week does the same
  ("23 of 23"), so it is design3's too. Not fixed here.
- **note, the console on a phone has no sign-out:** the kit's Shell draws no user button on phones, so the console's
  account sheet, and Sign out, cannot be reached at 390 wide. The phone keeps Neha signed in to the console for that
  reason. Not fixed here.
- **note, notifications:** each first sign-in on the test browser's phone shows the workspace's notifications step as
  "Notifications are blocked" (headless Chromium denies them); the person continues past it.
