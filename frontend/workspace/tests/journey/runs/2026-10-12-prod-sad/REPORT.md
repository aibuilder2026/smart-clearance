# Munchly Chips Sad Path E2E on production: run of 12 Oct 2026

The Masala Chips batch (MF-2409-117, Rakesh Traders, Nagpur) from a console Reset journey to Impact's report, on
production's apps (munchly-smartclearance.web.app, smartclearance-console.web.app) and production's backend-api and
agents on Cloud Run, on three screens at once (SC-179, SC-184, SC-188). Two kiranas buy, Neha closes the window on the
rest, and the packets left are destroyed at the godown.

**Passed end to end**, in 14 min 56 s, 81 steps, from a reset, with no finding and every one of Vision's checks passed
(4 of 4).

The maintainer asked for:

- the run on production's URLs, everything recorded;
- Priya's tablet in landscape, Rakesh's in portrait, everyone else on a phone; the pointer and the sign-ins shown;
- horizontal and vertical scrolling to the relevant sections, such as the split in the Route Room;
- the certificate signed, the photos validated, Priya reading the certificates, glancing at the kirana invoices and
  reading the Impact screens; the kiranas' orders seen live by Priya;
- all three screens fully loaded, Priya and Rakesh online throughout; actual sign-ins;
- info pop-overs: why Rehearsal (a small synthetic dataset of batches with fixed best-before dates), why the offer
  window and the other scheduled runs are fired by hand in a demo, and professional highlighting of what is read; then,
  on the trial's first frames, "this notes need to be business oriented … I need this all over the video".

It ran on branch `SC-188-prod-sad-path-callouts` (stacked on SC-189), against production at `1bd13d1` (SC-185
deployed; SC-189 not).

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:sad`, with the monitor window on screen.
- **The screens:** Priya Deshmukh on a tablet in landscape (1180 × 820), Rakesh bhai on a tablet in portrait
  (820 × 1180), a phone (390 × 844) on which Neha, the two kiranas, Agrawal Wholesale and a shop the window closed on
  sign in. Everyone signs in on the app's own screen; the password field takes a stand-in and the password check is
  answered with the person's own session, so no password is typed (the first sign-in says so on screen).
- **The notes:** 26 places in the suite ring an element, dim the rest of its screen and show a card beside it, in
  business terms: why Rehearsal, Setup's guardrails, Rakesh's one permission, why the Watcher is run by hand, the
  ₹26,330 at stake, the verified label, every exit priced net, the recommended split with its figures, the yes, the
  listing that won't undercut, the kirana scheme, the first order landing live, the counter, why the window is closed
  early, the invoice from Tally, why expiry day is brought forward, the evidence, the signatures in place, Vision's
  checks, the second yes with the credit note's figure, the certificate an auditor accepts, the invoice for every shop,
  impact from the ledger, Rakesh ending whole, and the outcome. Anything else read is ringed.
- **Scrolling:** each screen scrolls smoothly to what is read; the Route Room is read from the label down through the
  channels' chart (bar by bar, with each bar's tooltip), the same as a table panned sideways, to the split.
- **The journey day:** 60 min (Rehearsal), set by the reset; afterwards production's day was put back to 24 hours from
  the console's clock, as Neha.
- **Production is left as the run ended:** the chips cleared, their 540 packets destroyed at Kalamna Market godown.
- **The recording:** `munchly-chips-sad-path-e2e-prod-2026-10-12.mp4` beside this file, 14 min 46 s, H.264,
  2560 × 1440, 25 fps, 71 MB, with a 1080p copy (28 MB). They stay local (git-ignored).
- **The record:** `report.json` and `stills/`, the stage at each of the 81 steps.

## Figures

- **The plan:** ₹21,770; 588 to the kiranas, 772 to ExpireSoon; 38 kiranas offered.
- **The orders:** 2 shops, 48 packets, each live on Priya's Execution; the window closed on the other 36.
- **The deal:** 772 packs at ₹14.20, token ₹1,644.
- **Left at the godown:** 540, destroyed there by the distributor.
- **Vision's checks, 4 of 4:** the batch on the carton label; about 540 packs in view (540 left); the slate reads
  MF-2409-117 · 540 packets · 03-10-26; both photos taken today, at the godown and the landfill.
- **On the yes:** Expiry credit note CN/0118, ₹13,284; certificate OCE/DC/26-27/0219, 540 packs, signed by the officer,
  both witnesses and Rakesh.
- **Actual net:** ₹11,702.40 recovered, a swing of ₹14,868 against destroying the 1,360 packs at risk.

## Findings

None in the run.

- **Found in the local trial before it (SC-189):** the Route Room failed to the 500 page when the chips' phase arrived
  over the stream a moment before their plan was read. Fixed on its own branch; until it is deployed, the suite opens the
  Route Room from the plan on Priya's Command Center.
- **Still open, offered as tasks:** the batch head reads "2 of 2 kiranas ordered" once the window closes short; the
  console has no sign-out on a phone.
