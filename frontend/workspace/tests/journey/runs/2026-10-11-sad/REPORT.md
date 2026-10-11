# Munchly Chips Sad Path E2E: run of 11 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to Impact's report, on three
screens at once (SC-179). Two kiranas buy, the rest decline, and the packets left are destroyed at the godown.

**Passed end to end** in 9 min 45 s, 105 steps, from a reset, with no warning and every one of Vision's checks passed.
This is the maintainer's second take, which asked for:

- both tablets in landscape;
- the clicks shown;
- the certificate's signing, the photos' validation, the kiranas' invoices and the Impact screens read on screen;
- every screen loaded throughout, Priya and Rakesh always online.

It ran on branch `SC-180-evidence-photos-while-checked` (stacked on SC-179 and SC-174), with SC-180's fix. The first
take of this rerun found that Rakesh's photos were black frames while Vision checked them.

- **What ran:** `corepack pnpm test:journey:sad` from `frontend/`, with the stage on screen.
- **The stack, all local:**
  - backend-api on :8000 (`smart_clearance`, schema 0015);
  - the agents' pull worker on live Gemini;
  - the workspace app's and the console's dev servers on :5175 and :5174.
- **The screens:**
  - Priya Deshmukh and Rakesh bhai each on a tablet in landscape (1180 × 820), signed in before the recording started and
    online to the end. After the reset each tablet reloaded in place;
  - a phone (390 × 844) that signed in Neha in the console, each of the 37 kiranas who answered, and Agrawal Wholesale on
    ExpireSoon. While each person signed in, its last frame stayed under a "Signing in" chip, so no screen showed blank;
  - a cursor on every screen: it glides to each control and ripples where it presses, and glides over what a person
    reads;
  - a step ended only once every screen's photos and loading placeholders had landed.
- **The journey day:** 60 min (Rehearsal), set by the reset, then put back to 24 hours
  (`hydrate.sh --day-minutes munchly=1440`).
- **The journey is left as the run ended:** the chips cleared, their 540 packets destroyed at Kalamna Market godown.
- **The recording:** `munchly-chips-sad-path-e2e-2026-10-11.mp4` beside this file: 9 min 32 s, H.264, 2560 × 1440,
  25 fps, 42.5 MB. It stays local (git-ignored). It is the stage as watched:
  - the three devices side by side, each under its holder's name and address, with the cursor on each;
  - the screen being acted on, lit;
  - a narrator naming the step, who acts and what they do, with the running counts (offered, ordered, declined, never
    joined, left at the godown).
- **The record:** `report.json` (every step, with its time and figures) and `stills/`, the stage at each of the 105
  steps.

## The journey

1. **Reset (phone):** Neha resets Munchly's journey from the console.
2. **Signed in before the recording:** Priya on her Command Center, Rakesh on his Today, Neha on the phone. After the
   reset both tablets catch up in place.
3. **Setup and permission:** Priya opens Setup from her sidebar and confirms it; Rakesh gives his permission.
4. **The Watcher (phone):** Neha runs it from the console; the chips are flagged, −₹26,330 if destroyed.
5. **The label photo (tablet):** Rakesh clicks Upload a photo, picks it, and sends it. His screen shows Vision reading,
   then "Verified · matches your records", while Priya's Command Center follows.
6. **The plan (Priya's tablet):** Priya approves it: ₹21,770, 588 to the kiranas and 772 to ExpireSoon. The Lister lists the lot,
   and Outreach sends the scheme to 38 kiranas.
7. **The shops answer (phone), Rakesh's Orders and Priya's Execution following live:**
   - Shree Ganesh Kirana and Jai Durga Stores order 24 packets each;
   - 35 shops sign in one after another and press Not this time;
   - Shree Sai Kirana's invitation is still open (in the story it never joined the app), so it cannot sign in to answer.
8. **ExpireSoon (phone):** Agrawal Wholesale bids ₹13; the Negotiator counters ₹14.20, and Agrawal takes it with a ₹1,644
   token. Rakesh's Deliveries reads "Load once the scheme closes" meanwhile.
9. **The window (phone):** Neha closes the offer window from the console. The lot was already won, so it keeps its 772:
   the 540 packets no shop took stay at the godown.
10. **Rakesh's day (tablet):** he loads the buyer's truck, issues INV/26-27/0931 from Tally, and runs his van round to the
    2 shops.
11. **Expiry day (phone):** Neha fires it. Rakesh is asked to destroy the 540 packs at his godown, and Priya's Command
    Center waits.
12. **The evidence (tablet):** Rakesh uploads:
    - the before photo, the packs at the godown with the carton's batch label;
    - the after photo, at the landfill with the slate.

    He picks Orange City Enviro Services and types its certificate OCE/DC/26-27/0219. The cursor then reads the window
    and the two witnesses who will sign the certificate with the agency's officer, and he sends it. His tablet shows
    "Vision is checking your photos" over the two photos he sent (SC-180), then "Sent for approval", as Vision checks
    all four on live Gemini.

13. **The second yes (Priya's tablet):** Priya opens the review, looks at both photos, and reads Vision's four checks one by
    one, then what her yes issues. She approves, and Impact reports: Expiry credit note CN/0118 and the certificate of
    destruction. The chips clear.
14. **The certificate, signed (Priya's tablet):** its reason, method, facility, date and time. Then each signature: the
    supervising officer under the agency's seal, the two witnesses, and Rakesh for the packs he handed over. Then page 2,
    the destruction log, with each step's time and the initials.
15. **The pack:** the Expiry credit note, the tax invoice, the price-support credit note and the GST ITC memo, each signed.
    Then the sales register, with a glance at each kiranas' tax invoice (RT/26-27/1279 and 1280). Then Mark reviewed.
16. **The Impact screens:**
    - the quarter's tiles (kept out of landfill, destroyed, CO₂e avoided);
    - food by week, where the kilos went, and by product;
    - the batch's BRSR line;
    - the Command Center's Impact card.
17. **Read back on the other screens:**
    - Rakesh's batch: what happened, he ends whole, his Expiry credit note and his certificate, each signature read, and
      his photos;
    - on the phone, Shree Ganesh Kirana's order and the offer Om Sai Provision declined;
    - Priya's Execution, the ledger and the Command Center.

## Figures

- **The plan:** ₹21,770; 588 to the kiranas, 772 to ExpireSoon; 38 kiranas offered.
- **The answers:** 2 shops ordered 48 packets; 35 said Not this time; 1 never joined the app.
- **The scheme closed with** 2 shops and 48 packets; the ExpireSoon lot kept its 772.
- **The deal:** 772 packs at ₹14.20, token ₹1,644.
- **Realised:** kiranas 48, ExpireSoon 772; 540 left at the godown, settled as destroyed there by the distributor.
- **Vision's checks, 4 of 4:**
  - Batch MF-2409-117 read on the carton label;
  - About 540 packs in view (540 left);
  - The slate reads MF-2409-117 · 540 packets · 03-10-26;
  - Both photos taken today, at the godown and the landfill.
- **On the yes:** Expiry credit note CN/0118, ₹13,284 (540 × ₹22.00 dealer price + ₹594.00 GST he reverses + ₹810.00 of
  the agency's charges); certificate OCE/DC/26-27/0219, 540 packs.
- **Actual net:** ₹11,702.40, against the plan's ₹21,770.
- **Signed papers:** the tax invoice, the price-support and expiry credit notes, and the GST ITC memo, one signature each.
  The certificate of destruction has four: the officer, the two witnesses, and Rakesh, who handed the packs over. The
  e-way bill check and the FSSAI checklist are "not required" papers (no consignment over ₹50,000, no donation) and are
  not signed.

## The evidence photos

The design3 evidence for the chips was made for the slow week's 144 packets, so this run has its own for 540. Both were
made with Qwen-Image and are kept in `tests/journey/evidence/`, with sidecars:

- **The before photo:** five crates heaped with packets beside the carton marked BATCH MF-2409-117. Vision counted 500
  to 540 packs in six reads. A 1024-wide copy at quality 82 read as low as 250, so the photo is kept full size, at
  quality 92.
- **The after photo:** design3's own, with the slate's count edited to 540.

## Findings

- **note:** Shree Sai Kirana was offered the scheme, but its invitation is still open, so it cannot sign in to answer. It
  is the one shop of the 38 that never joined the app in the story, so "the rest decline" here means the 35 that can.
- **Fixed on the way (SC-180):** the first take showed Rakesh's photos as black frames while Vision checked them, and
  every read of a case reloaded a photo already on screen under its placeholder, since each read brings a fresh signed
  link. Now:
  - the destruction screen shows the photos he sent until their links arrive;
  - his partner facts are read again after his own step;
  - a photo on screen keeps showing while its new link loads.

  In this run the photos are in view from the send to the yes.
