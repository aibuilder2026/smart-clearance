# SC-187 · The three-minute demo film

A cinematic demo film of at most 180 seconds: the Masala Chips (MF-2409-117, Rakesh Traders, Nagpur) and the Mango
Drink (MF-2410-118, Lakshmi Agencies, Hyderabad) routed through the five exits, with the papers, the signing, GST and
the ITC reversal, the BRSR row and the ESG readings, told with real-looking people, the app's own screens in focus,
phone pop-ups, a voice-over and light music. It presents Smart-Clearance as software as a service on an agentic
architecture, and ends on the guided demo and the hosted prototype (credentials and steps in the deck).

## The brief (12 Oct 2026)

- The two workflows, every channel and exit: the kiranas, ExpireSoon, the staff sale, the donation, and the godown
  (packs that cannot sell, destroyed against evidence and a second yes).
- The tax receipts, the signing, GST, the ITC reversal, BRSR, the ESG reports.
- Voice-over, on-screen text, notification pop-ups "as in a film when someone looks at a phone", very light music.
- SaaS, agentic architecture, the business USP; the tech diagrams where they help; UI elements in focus; characters
  and scenes introduced; realistic, reviewed, no hallucination. "Create as many characters and scenes as necessary."
- Entirely in Smart-Clearance's own theme (design system v3: its mark, inks, Bricolage Grotesque and Geist). PwC's
  product pages are a reference for pacing only; nothing is copied, and no default styling is used.
- Tools: Qwen, LTX, ffmpeg, DaVinci Resolve as needed; Google's image models and Veo 3.1 within a $50 budget.
- References: the SC-158 film on YouTube (youtu.be/EWFLqM3oHYU), PwC's product demo pages.

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| The cast: character sheets, three reused from SC-154 (Priya, Rakesh, the Hyderabad kirana owner) and the rest new | Nano Banana 2 (`gemini-3.1-flash-image`, Vertex AI, global) through `design3/tools/vertex-media/nano.py`; SC-158's Qwen sheets as references for Lakshmi, Meera and Neha | `img/cast-*.webp` (+ `.prompt.json`), PNG originals in `src/cast/` |
| The keyframes, one a scene, from the sheets | Nano Banana 2 at 2K, 16:9 | `img/k*.webp`, PNG in `src/img/` |
| The live-action clips: four reused from SC-154 (Veo 3.1, 1080p) and the new ones | Veo 3.1 (`veo-3.1-generate-001`) at 1080p, 8 s, image to video, no audio, through `veo.py` | `media/c*.mp4` (+ `.prompt.json`), raw in `src/clips/` |
| The app's screens at every stage of both journeys | the live stack (backend-api on :8000, the agents on Gemini, the workspace on :5175, the console on :5174); `src/director.py` walks both batches with backend-api's walk and `src/capture.mjs` screenshots each person's screens with Playwright at 2× | `screens/` (WebP), PNG in `src/screens/` |
| The interactions (the yes, an order, the signature) | the workspace's stub and the guided demo, recorded with Playwright | `media/ui-*.mp4` |
| The notifications | backend-api's own pushes for the two batches (`src/pushes.json`), rendered as phone pop-ups from the kit's tokens | `src/overlays/out/` |
| The voice-over | Cloud Text-to-Speech (`src/vo.py`): Chirp 3 HD and Gemini-TTS candidates in `en-IN`, one file a beat (a sentence), trimmed and measured; the cut is laid out on the beats | `src/vo/<voice>/`, `src/lines.json`, `src/vo/durations.json` |
| The captions, lower thirds, chapter cards, callouts, title and end card | HTML on design system v3's tokens, screenshotted transparent (`src/overlays.mjs`) | `src/overlays/out/` |
| The music | Lyria 2 (`lyria-002`, Vertex AI) clips (`src/lyria.py`, priced against the $10 cap), judged by Gemini listening (`src/ears.py`), the picked bed looped on itself and the lift crossfaded in at the ledger (`src/bed.py`); the numpy score (`src/music.py`) is the fallback | `src/music/*.wav`, `src/bed.wav`; the picked clips as mp3 in `media/` |
| The cut | ffmpeg (`src/assemble.py`): the clips, the screens in a window or a phone with pans and focus zooms, the pop-ups, the captions, the voice-over, the music, one loudness pass | `media/smart-clearance-demo.mp4` |

Every figure is the journey's own, as backend-api computes it from money.js's rules; every pop-up is one of
backend-api's pushes for these batches; every paper on screen is the real paper. Every person is fictional.

## The cast (all fictional)

| Who | In the story | Look (the sheet) |
| --- | --- | --- |
| Priya Deshmukh | Munchly Foods, supply chain, Pune: the one yes, the second yes, the ledger | SC-154's planner: navy pinstripe kurta, lanyard, a low ponytail |
| Rakesh bhai | Rakesh Traders, Nagpur: the chips' distributor | SC-154's distributor: mid-fifties, grey moustache, light blue checked shirt, glasses on his head |
| Lakshmi | Lakshmi Agencies, Begum Bazaar, Hyderabad: the Mango Drink's distributor | late forties, deep teal cotton saree, glasses on a beaded cord, a plait (from SC-158's sheet) |
| Ganesh ji | Shree Sai Kirana, Nagpur: the first shop to order | new: a man in his forties, a cream half-sleeve shirt, a tilak, behind his counter |
| The Hyderabad kirana owner | Sri Lakshmi Ganapathi Kirana, Begum Bazaar | SC-154's kirana owner: maroon saree, mustard blouse |
| Agrawal ji | Agrawal Wholesale, Raipur: the ExpireSoon buyer | new: a wholesaler in his forties, a grey safari shirt, a tablet |
| Meera | Feeding India, Hyderabad | early thirties, green T-shirt, lanyard, a bun (from SC-158's sheet) |
| Neha Kulkarni | Smart-Clearance staff, the console | late twenties, white shirt, black-framed glasses (from SC-158's sheet) |
| The agency crew | Orange City Enviro Services: the supervising officer and two witnesses at the landfill | background, hi-vis vests |

## The film, scene by scene

Target 2:55 to 3:00. The voice-over is about 410 words at a measured pace. Each scene names its live action (a
keyframe → a Veo clip, R = reused from SC-154), the screens in focus, the pop-ups, and the on-screen text.

| # | Time | Scene | Live action | Screens (who sees it) | Pop-ups and text |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | The problem | K1 Rakesh in his godown at noon, turning a carton to read its date | — | "45 days to best-before. The gates close." · "Written off. GST credit reversed. Landfill." |
| 2 | 0:11 | Smart-Clearance | R1 the factory bay at dawn (Priya and Rakesh over the plan) · K11 Neha at the console | console Overview (Neha); the nine stops with their agents (the Lucid diagram, panned) | the title; "Software as a service · ten agents on Gemini · one yes" |
| 3 | 0:28 | Detect | K2 Priya's phone lights up at her desk in Pune | Command Center at risk, both batches (Priya); the chips' Journey page | lower thirds: Priya, Rakesh Traders, Lakshmi Agencies; the Watcher's push to Priya; callout: 1,360 packs · −₹26,330 |
| 4 | 0:46 | Verify | K3 Rakesh photographs the carton's label | Rakesh's Today with the request (phone); the label photo with Vision's read; callouts on the barcode, the QR code, the FSSAI licence | Vision's push to Rakesh |
| 5 | 0:59 | Value, decide, approve | K4 Priya's thumb on the green button | Route Room: the five exits priced, the split with its reasons; the approve sheet (recorded, the yes pressed) | the plan's push; callout: ₹21,770 · ₹26,330 better than the bin; "One yes" |
| 6 | 1:17 | Execute: five channels | K5 Ganesh ji reads the offer · R2 the Hyderabad kirana at the counter · K6 Agrawal in Raipur · K7 the staff sale at the gate · K8 Feeding India's van | the Hindi offer and the order (kirana phone); the scheme card's stops; the ExpireSoon card: listed, countered ₹14.20, won; the staff-sale card with the receipt read by Vision; Meera's pickup and receipt; the van round | the Hindi push; the counter; the pickup push; counts: 31 shops · 588; 772 · ₹14.20; 150 at ₹8; 58 packs · 58 meals |
| 7 | 1:52 | The papers, GST | K9 Rakesh signs at his desk · K10 the landfill: the certificate signed in place | the tax invoice issued (IRN, the QR, the signature and stamp); CN/0117; the GST ITC memo (kept, reversed, s.17(5)(h)); the FSSAI checklist; the destruction evidence, the signatures drawn (recorded), the certificate, the expiry credit note | "Signed · stamped · e-invoice"; "ITC kept ₹1,224 · reversed on what was given away"; "The second yes" |
| 8 | 2:22 | The ledger, ESG | R4 Priya and Rakesh at the dashboard | Impact posted; the Ledger's Money, GST and Impact readings; the Impact dashboard; the batch's BRSR line and evidence; the exports; the console's Food by day | callouts: ₹21,152 · ₹16,917; 217.6 kg · 544 kg CO₂e · 58 meals; "BRSR Principle 6 · exported" |
| 9 | 2:46 | Everyone ends whole | K12 the lane at golden hour | the guided demo's route map; the workspace's sign-in | the four cards; "Guided demo · smartclearance-demo.web.app"; "The live prototype: credentials and sign-in steps in the deck"; "Built on Google Cloud" |

## The voice-over

One voice (Cloud Text-to-Speech, Chirp 3 HD, Indian English), one line a scene, each timed to its scene.

1. Every FMCG brand in India has stock going short-dated. Once a batch crosses the quick-commerce gates, nobody wants it. It is written off, its GST credit reversed, and the food goes to a landfill.
2. Smart-Clearance is a software-as-a-service platform for manufacturers. Every brand gets its own workspace, and ten AI agents on Gemini walk each short-dated batch through nine stops, across five exits. A person says yes once.
3. Meet Priya, supply chain at Munchly Foods. This morning the Watcher flagged two batches: Masala Chips at Rakesh Traders, Nagpur, and Mango Drink at Lakshmi Agencies, Hyderabad. 1,360 packs of chips will not sell in time: a 26,000-rupee write-off.
4. Vision asks the distributor for one photo, reads the batch, the dates and the MRP from the label, with its barcode, QR code and FSSAI licence, and matches them to the stock export.
5. The Valuer prices five exits: ExpireSoon, the kirana cluster, the staff sale, a food bank, and the quick-commerce gates it can still pass. The Router splits each batch and explains why. Priya says yes, once. Nothing executes before it.
6. Outreach sends every kirana the offer in Hindi: buy ten, get two free. Thirty-one shops order, each with its own tax invoice. The Lister puts the lot on ExpireSoon, the Negotiator counters at fourteen-twenty, and Agrawal Wholesale takes 784 packs. The staff sale is recorded on its UPI receipt, read by Vision. 86 packs of Mango Drink go to Feeding India, who issue their own receipt. And the van round delivers the scheme.
7. Paperwork lays out every paper as a signed PDF: the tax invoice with its e-invoice and QR code, the credit note that makes the distributor whole, and the GST memo: input credit kept on every pack sold, reversed only on what was given away, under section 17(5)(h). When packs cannot sell, the distributor destroys them against evidence: two photos checked by Vision, a certificate signed in place by the agency and two witnesses, and Priya's second yes.
8. Impact posts the ledger. Money: 21,323 rupees recovered on the chips, 16,888 on the Mango Drink. GST: credit kept and reversed, invoice by invoice. Impact: 565 kilos kept out of landfill across the two batches, 1.4 tonnes of CO₂e avoided, 86 meals, and BRSR Principle 6 with its evidence, exported in a click.
9. The brand recovers, the distributor ends whole, the kiranas earn, and the food bank serves. Try the guided demo, or sign in to the live prototype: the credentials and steps are in the deck.

## The run the film tells

Both journeys were walked on the local stack on 12 Oct 2026 with the journey day at 2 minutes (`src/director.py`), the
agents on live Gemini. The screens, pushes and figures are that run's own (`src/figures.json`, `src/pushes.json`),
and the voice-over was re-recorded where its figures differ from the story's:

- the chips: 1,360 packs at risk at Detect (−₹26,330); a day on, the plan priced 1,372: 588 to 31 kiranas at ₹18
  effective, 784 to ExpireSoon, net ₹21,950, ₹26,560 better than destroying; Agrawal bid ₹13, the Negotiator countered
  ₹14.20, 784 awarded; INV/26-27/0931 (₹11,690, issued with its IRN), CN/0118 (₹8,861), the ITC memo (₹1,235 kept,
  nothing reversed), 31 kirana invoices; actual ₹21,323; 219.5 kg, 548.8 kg CO₂e;
- the Mango Drink: 1,372 to 52 of 58 kiranas, 150 to the staff sale (receipt LA/SR/26-27/0002, 18 UPI payments read by
  Vision), 86 to Feeding India (receipt FI/HYD/26-27/0417); CN/0117, the ITC memo (₹837 kept, ₹47 reversed on the 86);
  actual ₹16,888; 345.7 kg, 864 kg CO₂e, 86 meals;
- the year so far: 14 batches, ₹2,58,594 recovered, 2.52 t kept out of landfill, 958 meals.

The destruction (scene 7) is the pilot quarter's Peanut Chikki MF-2407-116 (the Record with its three photos and
Priya's three yeses, the expiry credit note CN/0116) and the stub's slow week for the certificate signed in place.

## Decisions

- No design round: the maintainer named the deliverable, the tools and the budget outright; the film's own decisions
  are recorded here, as SC-158's were.
- The money: the four SC-154 clips are reused (already paid for, Veo 3.1 at 1080p); the new scenes are Veo 3.1 at
  1080p from Nano Banana 2 keyframes, priced before every call (`veo.py`), the spend reported with `cost.py` against
  the $50 cap.
- The screens come from a real walk of both journeys on the local stack, the interactions (the yes, an order, the
  signing) from the stub, where they are scripted and repeatable.
- The voice: eight candidates were synthesised (Chirp 3 HD Kore and Charon at 1.0 and 0.95; Gemini-TTS Kore and
  Charon, measured, and Kore brisk at 1.0 and 1.1), judged by Gemini listening: Gemini-TTS scored 8.5 ("poised,
  confident, professional"), Chirp 7.5 ("recognisably AI"). The film uses **Gemini-TTS Kore, brisk, at 1.1**, the only
  Gemini take that fits 180 s; the four beats whose figures follow the run were recorded again on it.
- The music: six Lyria 2 beds and two lifts, judged the same way; bed-6 (felt piano and pad, D-flat major, 68 BPM, 9/10)
  looped on itself through 3 s crossfades, lift-2 (A-flat major, the dominant) crossfaded in at the ledger, judged
  seamless (10/10). Under the $10 cap: $0.48.
- The cut leads with the voice: each scene's length is its beats' measured length plus a breath, shared among its
  visuals by weight (`film.py`), so every screen lands as its sentence is said.

## The film (12 Oct 2026)

`media/smart-clearance-demo.mp4`: 2 min 57.8 s (177.75 s), 1920 × 1080, 24 fps, H.264 (crf 23, 70 MB; the crf-18
master, 126 MB, stays local in `src/build/`), AAC stereo at −14.3 LUFS integrated, −1.4 dBFS peak.
`media/smart-clearance-demo-720p.mp4` is the same cut at 1280 × 720 (26 MB), for phones and messaging. 9 scenes, 40
segments: 17 live-action clips (13 new on Veo 3.1, 4 reused from SC-154), 20 app screens (9 of them with a close-in on
the element the voice names), 3 recorded interactions, 1 diagram; 55 overlays (10 pop-ups, 5 lower thirds, 10
callouts, the statements, the title, two end cards); 31 spoken beats.

- **The scenes land at** 0:00 the problem, 0:13 Smart-Clearance, 0:27 Detect, 0:45 Verify, 0:57 Value, decide, approve,
  1:14 Execute (five channels), 1:45 the papers and the second yes, 2:17 the ledger, 2:44 everyone ends whole.
- **The cast:** every person and every signature is fictional; the four new keyframes' people (Ganesh ji, Agrawal ji,
  the landfill crew) and the eleven returning ones were checked on their sheets and on every clip's contact sheet (faces,
  hands, the phone's back to the camera on the label photo, which took a retake of its keyframe).
- **Checks:** every clip's contact sheet; every keyframe; the draft cut's and the final cut's contact sheets; the eight
  close-ins at their zoomed moment; `ffprobe` (177.75 s, h264 1920×1080 at 24 fps, aac 48 kHz); `ebur128` (−14.3 LUFS,
  peak −1.4 dBFS); Gemini listening to two 40 s excerpts (narration intelligible and natural, the music ducking
  smoothly, 9/10, the narration transcribed back word for word).
- **Found on the way:** a Nano Banana keyframe put the phone's screen to the camera (retaken); ffmpeg's `crop` reads
  `iw`/`ih` once at configuration, so a close-in clamped to the top-left until the clamp was written out from the zoom;
  the Gemini-TTS takes vary from call to call (one brisk take of 7c came out at 17.8 s and was dropped), so each take
  was measured and the cut laid out on the measurements; Lyria blocked one seed on its recitation check.
- **The spend:** $22.89 against the $50 cap: 13 Veo 3.1 clips at 1080p $20.80, 14 keyframes and 2 sheets $1.61, 8 Lyria
  clips $0.48 (the music under its $10 cap); the voice and the listening checks a few cents. `cost.py` reports $43.82
  because it also counts the sidecars copied into `media/`.

## The film, cut 2 (12 Oct 2026)

`media/smart-clearance-demo.mp4`: 6 min 5.4 s (365.42 s), 1920 × 1080, 24 fps, H.264 (crf 24, 94 MB; the crf-18 master stays local in
`src/build/`), AAC stereo at −14.4 LUFS integrated. `media/smart-clearance-demo-720p.mp4` is the same cut at 1280 × 720
(40 MB). 10 scenes, 75 segments: 19 live-action shots (12 on Veo 3.1 from labelled keyframes; 2 on LTX 2.5
Fast locally once the Vertex cap was reached, the Tally desk and the closing lane; 2 keyframes on the cut's own slow
push where neither model kept the frame clean, the food bank's van and the landfill; 3 reused from SC-154's landing-page
film; each cut to its clean seconds), 45 recordings of the working app, 2 stills and 9 cards (seven of them
chapter cards); 110 overlays; 52 spoken beats.

- **The scenes land at** 0:00 the problem, 0:33 Smart-Clearance, 1:21 Connect and detect, 1:52 Verify, 2:12 Value, decide, approve, 2:52 Execute: five exits, 3:45 the paperwork, 4:24 when it does not go as planned, 5:09 the ledger and ESG, 5:42 the close.
- **The voice** is Gemini-TTS Kore at 1.08, 337 s of speech over 884 words, trimmed from the storyboard's 977 so the cut
  lands near six minutes.
- **Every clip was reviewed** before it was cut in, twice over: its contact sheet at one frame a second, and Gemini
  watching it as a VFX supervisor (`src/eyes.py`: people, anatomy, objects, text, physics, a severity and a verdict).
  Veo's clips all carry something in their second half (fingers blending on a carton, a packet morphing as it enters
  a crate, a background worker popping in, a phone's screen swapping), so each is cut to the window the review passed,
  slowed to fill its share of the scene, and motion-interpolated (`minterpolate`, mci) so a clip at half speed plays
  smoothly instead of stepping. Three were re-rendered with calmer action (the storeroom, the dark store, the van), and
  the van hallucinated a packet into the coordinator's free hand on three Veo takes before it went to LTX.
- **Checks:** every keyframe and every clip as above; the whole cut's contact sheet at one frame every six seconds;
  `ffprobe`; `ebur128`; every take of the voice transcribed back and checked to end cleanly; Gemini listening to the
  whole mix (narration clear, the bed right and never masking a word, no gaps, the lift near the end, the first,
  middle and last sentences transcribed back word for word).
- **Found on the way:** `clips.sh` picked a superseded `-cut1` keyframe ahead of the current one by `ls` order, and
  five clips went to Veo from the wrong frames ($8); a zsh glob that matched nothing aborted a whole `rm`, so the
  trimmed beats' old takes were still in place for one run; the first full render had no stand-ins only because the
  tour's last recordings landed minutes before their segments; `assemble.py` named its segment files by index, so
  dropping one clip shifted every segment it reused onto its neighbour's file (a 360 s cut with the voice a shot
  out from 0:33), and the files now carry the segment's name and length; Gemini-TTS cut one take off mid-word
  ("the batch is verifi-"), which the whole-mix listen caught at 1:54, so every one of the 52 takes was then checked
  on its own (transcribed, "ends cleanly?") and four were synthesised again.
- **The spend:** $72.92 against the $75 cap (Veo 3.1 clips, Nano Banana 2 keyframes and retakes, Lyria's bed under its
  $10); the voice and the listening and watching checks a few cents; the four LTX clips and the app recordings free.

## Cut 3 (12 Oct 2026): the maintainer's notes on cut 2

The notes, and what each changed:

1. **The first minute** ("lots of hallucinations and glitches"; start with manufacturers, brands and distributors looking
   at stock, in professional settings). Scene 1 is re-shot in offices: a brand's supply planning team at a stock-ageing
   screen; a distributor at his desk by the godown with a stock report; a quick-commerce receiving dock with a pallet
   on hold; the write-off at the landfill; a kirana's shelf that stayed empty. The title shot is a factory's loading
   bay at dawn, and the super stockist's depot is re-shot too. All eight keyframes are Qwen-Image 2.1 locally
   (`src/gen-qwen.sh`: an edit with the cast sheet and a 16:9 reference of the real label beside the pack as condition
   images, `src/refs16/`, at 1024, about 2.5 minutes each) and all eight clips LTX 2.5 Fast locally (`src/gen-ltx3.py`,
   720p, near-static prompts), at no cost. An edit keeps its first condition image's aspect, so the reference is 16:9;
   at 2048 with four condition images the edit swapped the 48 GB machine into a crash, so `guard.sh` now watches the
   free memory beside it. Qwen holds the cast's identity from the sheet and prints the label legibly on every carton.
2. **The chapters** ("looks like a slide"). The seven chapter cards are gone. A chapter opens over the screen it starts
   on: a veil over the frame, "CHAPTER n", the name, one line and the nine stops with this chapter's lit, rising in
   and leaving after 3.4 s as the screen underneath comes clear (`chapter-open` in `overlays.mjs`, `chapter_open()` in
   `film3.py`). The chapter's own labels wait for it.
3. **Overlaps and pop-ups.** The window now fits the right column whatever the recording's shape (a landscape phone
   recording is a tablet, fitted and centred), the desktop window starts at 650 and the feature label keeps to 540 px.
   The pop-ups are notification banners as a phone shows them: the app's icon, its name and "now", a bold title, the
   body; inside the phone's screen on a phone segment, at the frame's top right elsewhere; springing down, settling,
   leaving upward (`banner`, motion "banner"). Every label rises into place (motion "rise").
4. **The camera** held the wrong way round: the label-photo shot is re-shot over the distributor's shoulder with the
   phone's screen toward him and the camera, showing the app's own camera screen with the label in its frame
   (`k57-label-photo`, Qwen with the app's screenshot as a condition image).
5. **Audio and music**: unchanged.
6. **The background**: behind the app's windows, the chapter's own keyframe pulled far out of focus under the studio
   ground, stronger at the right and lifting to the ground's colour under the labels (`photo_ground`).
7. **Transitions and charts**: a push (`smoothleft`) between two app screens, a dissolve to and from live action, the
   window rising in; four animations on the design system's tokens replace the two stills and open two chapters
   (`src/anim.mjs`: the ten agents round the one yes, the nine stops lighting along a rail, the five exits priced
   against the bin, the ledger's recovered-against-written-off bar and the impact tiles; illustrative, no figures).

Google spend for the cut: under $1 (Gemini watching the new clips). The maintainer's cap for these changes was $20.

## The film, cut 3 (12 Oct 2026)

`media/smart-clearance-demo.mp4`: 6 min 6.4 s (366.4 s), 1920 × 1080, 24 fps, H.264 (crf 24; the crf-18 master stays
local in `src/build3/`), AAC stereo at −14.4 LUFS integrated. `media/smart-clearance-demo-720p.mp4` is the same cut at
1280 × 720, and `landing-demo/smart-clearance-demo.mp4` at the repository root is a copy of the 1080p file. 10 scenes,
70 segments: 20 live-action shots (8 on LTX 2.5 Fast from Qwen keyframes, the first minute and the depot;
8 on Veo 3.1 from cut 2; 3 from SC-154's landing-page film), 44 recordings of the working app, 6 grounds
carrying the four animations, the title, the statements and the end cards; 116 overlays; 52 spoken beats.

- **The scenes land at** 0:00 the problem, 0:33 Smart-Clearance, 1:21 Connect and detect, 1:51 Verify, 2:12 Value, decide, approve, 2:52 Execute: five exits, 3:46 the paperwork, 4:24 when it does not go as planned, 5:10 the ledger and ESG, 5:43 the close.
- **Every new clip was reviewed** as in cut 2 (its 1 fps sheet and Gemini through `src/eyes.py`), and cut to its clean
  seconds: the office, the dock, the write-off and the kirana hold for six seconds; the distributor and the label photo
  for four; the factory at dawn for four; the depot for two, slowed to fill its share.
- **Checks:** every keyframe viewed (the real label on every carton, the cast's faces held, the camera's screen facing
  the distributor); the whole cut's contact sheet at one frame every six seconds; spot frames of the first minute and
  of every chapter opening; `ffprobe`; `ebur128`; Gemini listening to the whole mix (narration 10/10, no truncation,
  the bed right, the lift near the end, mix 10/10; the only "gaps" it hears are the chapter openings' breaths).
- **Found on the way:** a Qwen edit at 2048 with four condition images swapped the machine into a crash (the first
  frame never finished; `guard.sh` now watches the memory); an edit keeps its first condition image's aspect, so the
  label and the pack go in as one 16:9 reference; the first office frame showed an amber-and-red stock table where the
  maintainer wanted the app's own green charts, so it was re-rendered with the Ledger's Impact screen as a condition
  image.
- **The spend:** under $1 of Google for the cut (Gemini watching eight clips and listening to the mix); the keyframes,
  the clips and the animations were made locally. The maintainer's cap for these changes was $20.

## The film on the landing page (12 Oct 2026)

The maintainer asked for the YouTube demo to be replaced with cut 3. YouTube cannot replace a video's file, so the cut
goes up as a new unlisted video (`youtube/README.md`: the file, the title, the description with its chapters, the
captions, the settings), and the landing page is repointed:

- the theatre's chapters and captions are cut 3's ten scenes and 52 narration lines (`src/transcript3.py` writes
  `youtube/transcript.json`, `youtube/youtube-description.txt`, `youtube/captions.srt` and
  `design3/site/assets/media/demo-film.json`);
- the label reads "Watch the 6-minute demo", the dialog "The 6-minute demo · From the first flag to the ledger", and the
  end card "One platform. Ten agents. One yes.";
- the poster and the pill's thumbnail are the brand and its distributor at the quarter's dashboard (the office scene's
  source clip, SC-154's, as it opens in the film at 5:40), which names no client;
- the video id follows once the upload is done; until then the page still plays the old film under the new words.

The unit test of the film's words follows (ten chapters, 52 lines, 6:06, no client in a title), as does the keyboard
spec (unrun, SC-55). The frontend gate passes.

## Rebuilding the film from a fresh clone

Everything the cut needs is tracked: the clips in `media/`, the keyframes in `img/`, the app screens in `screens/`,
the timeline in `src/film.json` with the run's figures and pushes beside it, the voice lines in `src/lines.json`, and
the scripts. `src/` holds the originals while a session works (PNG keyframes, the raw clips, the screenshots, the voice
takes, the music clips, the overlays, the build); each script reads from `src/` when the file is there and from the
tracked copy otherwise. The voice takes and the music clips are not tracked: a rebuild synthesises them again
(`vo.py`, `lyria.py`, `bed.py`), so its narration and bed will differ a little.

1. Install the frontend once (`cd frontend && corepack pnpm install`): the overlays use its Playwright.
2. From `design3/designs/SC-187/src/`:

   ```sh
   python3 vo.py --voice gemini-2.5-pro-tts-Kore-brisk-1.1       # the narration, one file a beat (Cloud Text-to-Speech)
   ./lyria-bed.sh; ./lyria-bed2.sh; ./lyria-lift.sh                # the music candidates (Lyria 2 on Vertex AI, $0.06 each)
   python3 bed.py --bed bed-6 --lift lift-2 --length 185 --lift-at 142 --out bed.wav
   python3 film.py --voice gemini-2.5-pro-tts-Kore-brisk-1.1 --gap 0.2 --tail 0.7   # the timeline on the voice's beats
   SC_REPO=/path/to/the/checkout node overlays.mjs                  # the pop-ups, captions, lower thirds, callouts, cards
   uv run --with pillow --with numpy python assemble.py             # the cut, to ../media/smart-clearance-demo.mp4
   ```

   About 15 minutes on this Mac; `--draft` halves it; `--only 3,4` re-renders two segments and re-cuts.
3. To change a caption or a close-in, edit `film.py`, run it, then `node overlays.mjs` and `assemble.py --only N`.
4. To retake one clip (about 2 minutes and $1.60 each): `./clips.sh c05-kirana-nagpur-offer` after deleting the clip;
   a new keyframe comes from `keyframes.sh` (Nano Banana 2, about $0.10), which skips keyframes that exist.
5. To capture the screens afresh (a new run of both journeys, so the figures change): the live stack as `director.sh`
   expects it, then `./director.sh`; it writes `screens/`, `pushes.json` and `figures.json`. Then `film.py` and on.

---

# Cut 2 (12 Oct 2026, the maintainer's second brief)

The first cut was reviewed and sent back with a new brief: six minutes; generic storytelling for the portal, with no
character names and no figures quoted from the example; the agentic ecosystem and its USP for manufacturers,
distributors and super stockists, with no comparisons; the working app recorded and shown with motion, pointers and
real scrolling (the zoom-and-light-sweep is out); phones and tablets in the live-action scenes showing real content;
Munchly-labelled cartons; all five exits and every feature, told generically ("the Paperwork agent helps you file your
GST invoices and credit notes"); the story of a week that does not go to plan; a warmer, more refined female narrator;
the PwC product films as the register. The $50 cap stands ($27 of it left after cut 1; the music's $10 cap stands).

## How cut 2 differs

| | Cut 1 | Cut 2 |
| --- | --- | --- |
| Length | 2:58 | about 6:00 |
| The people | named in lower thirds | roles only ("The brand's supply planner", "The distributor") |
| The figures | the run's, in callouts and narration | none quoted; the screens carry their own |
| The screens | screenshots in a window with a light sweep, close-ins | the app recorded on a walk of both journeys (`tour.mjs`): the pointer glides, scrolls and opens things; the window rises in on a clean studio ground; pointers and feature labels appear beside the elements the voice names |
| The phones | plain white screens | the app's own screens on them (Nano Banana keyframes from the app's screenshots), Munchly cartons |
| The exits | five, briefly | five, each with its screens and papers, and the week that does not go to plan |
| The voice | Gemini-TTS Kore, brisk | Gemini-TTS, a female voice directed for warmth and engagement, measured pace, one file a sentence |

## The voice-over, cut 2

One voice, one file a sentence (the beats). Generic throughout: no names, no figures.

1. **The problem.**
   1a. Every day, across India, good products run out of time before they run out of demand.
   1b. A batch waits in a distributor's godown as its best-before date draws closer.
   1c. Once it crosses the quick-commerce gates, the modern-trade shelves close to it.
   1d. What usually follows is a write-off: the stock destroyed, the GST credit reversed, and perfectly good food in a landfill.
   1e. The brand loses, the distributor loses, and the people who would have bought it never get the chance.
2. **Smart-Clearance.**
   2a. Smart-Clearance changes that.
   2b. It is a software-as-a-service platform for manufacturers, built around an ecosystem of AI agents.
   2c. Every brand gets its own workspace, set up for its supply chain: its distributors and super stockists, its quick-commerce gates, its exits and its rules.
   2d. Inside it, ten agents work together along nine stops.
   2e. They detect, verify, value, decide, execute, settle and report.
   2f. And at the one moment that matters, a person says yes. Nothing moves before that.
   2g. A platform of its own kind: the whole chain on one system, from the manufacturer to the distributor, the kirana, the buyer and the food bank, each acting in their own name.
3. **Connect and Detect.**
   3a. It starts with the stock data the distributor already has.
   3b. The Data agent maps the stock export field by field, so nothing is keyed in twice.
   3c. Every morning, the Watcher checks every batch at every distributor against its sell-through and the quick-commerce gates.
   3d. When a batch will not sell in time, the supply planner is told on her phone, in plain words, with the write-off it would mean.
   3e. The batch gets a page of its own: where it stands, and what comes next.
4. **Verify.**
   4a. Before anything is priced, the batch is verified.
   4b. Vision asks the distributor for one photo of the carton label.
   4c. It reads the batch number, the dates and the MRP, checks the barcode and the FSSAI licence, and matches them to the stock record.
   4d. One photo from a phone, and the batch is real.
5. **Value, decide, approve.**
   5a. Now the Valuer prices every exit: the kirana cluster, the marketplace, the staff sale, the food bank, and the quick-commerce channels the batch can still reach.
   5b. Each one is priced per unit, after costs and GST, against what destroying the stock would cost.
   5c. The Router then splits the batch across the exits, and explains its reasoning in plain language.
   5d. The plan lands on the planner's desk with everything she needs to decide.
   5e. She approves it once. The approval is logged, with who, when, and the device.
   5f. The distributor is told the plan in his own language, with a pause button, and the agents set off.
6. **Execute: five exits.**
   6a. Outreach sends the kirana cluster its scheme, in Hindi, straight to each shop's phone.
   6b. A shop sees the offer and its margin, and orders in a tap. Each order gets its own tax invoice, in the distributor's name.
   6c. The Lister puts the rest on the near-expiry marketplace, hidden from the brand's own territories.
   6d. When a buyer bids, the Negotiator answers in the distributor's name, holds the reserve, and closes the deal. The buyer pays the token; the truck is loaded.
   6e. At the godown, the staff sale opens, recorded on one consolidated UPI receipt that Vision reads and reconciles.
   6f. Packs with enough shelf life go to a food bank, as sealed cartons: the pickup booked, the FSSAI checklist drafted, and the food bank's own receipt issued.
   6g. And the van round delivers the scheme to every shop that ordered.
7. **Settle: the paperwork.**
   7a. This is where most clearances fall apart: the paperwork. Here, it is automatic.
   7b. The Paperwork agent drafts the whole pack: the distributor's tax invoice, ready to issue from Tally with its e-invoice; the brand's credit note, so the distributor ends whole; the GST memo, with the input credit kept and reversed under section 17(5)(h); the FSSAI checklist; and an invoice to every kirana.
   7c. Every paper is laid out as a signed PDF with the firm's stamp, and reviewed by the planner.
   7d. The distributor sees his own papers on his own portal, ready to download.
8. **When it does not go as planned.**
   8a. Sometimes it does not go as planned. Some shops do not order, and stock is still left at the godown on expiry day.
   8b. Smart-Clearance handles that too, fully automated.
   8c. The distributor is asked to destroy the expired packs through an authorised agency, with the evidence: a photo before, a photo after, and the agency's certificate.
   8d. Vision checks the photos against the batch and the count.
   8e. The certificate of destruction is signed in place, on the distributor's screen: the agency's officer, two independent witnesses, and the distributor.
   8f. The planner reviews the evidence and gives her second yes. The expiry credit note and the destruction certificate are issued, and the batch closes, its record complete.
9. **Report.**
   9a. When a batch closes, Impact posts the ledger.
   9b. Money: what was recovered against the write-off, batch by batch, quarter by quarter.
   9c. GST: the input credit kept and reversed, invoice by invoice, ready for the accountant.
   9d. Impact: the food kept out of landfill, the CO₂e avoided, the packs donated, and the BRSR line with its evidence.
   9e. And every batch keeps its record: the photos, the approvals, and the audit trail of every agent and person.
10. **The close.**
   10a. The brand recovers. The distributor ends whole. The kiranas earn. The food bank receives.
   10b. One platform. Ten agents. One yes.
   10c. Try the guided demo, or sign in to the live prototype: the credentials and steps are in the deck.

## The scenes, cut 2

| # | Chapter | Live action | The app, recorded (tour.mjs) | Over it |
| --- | --- | --- | --- | --- |
| 1 | The problem | the distributor reading a Munchly carton's date; the Hyderabad godown; a dark-store shelf being cleared; the write-off | — | five statements |
| 2 | Smart-Clearance | the bay at dawn (R1); a super stockist's depot; the hero film's chapters | the landing page; the console Overview with the agents at work; the system diagram; the nine stops; the ecosystem (client's supply chain, people, partners) | role cards, the stops lit one by one |
| 3 | Connect and Detect | the planner's phone lighting up (the app on it) | Setup (the export mapped); the console's first stock export; the Command Center flagged; the batch's Journey page | pointers: the Watcher's push, the gates, the agent timeline |
| 4 | Verify | the distributor photographing a Munchly carton | Today's request on the phone; the camera screen; Vision's read on the Route Room | pointers: barcode, QR, FSSAI, "matches the DMS record" |
| 5 | Value, decide, approve | the planner's thumb on the approve button (the sheet on screen) | the five channels (chart and table); the split with its reasons; the alternative; the approve sheet pressed; Execution opening; the distributor's Today told | pointers: per unit after GST, "not chosen", the yes logged |
| 6 | Five exits | the kirana reading the Hindi offer; the buyer with the lot on his tablet; the staff sale at the gate; the food bank's van (its keyframe, on a slow push); the godown counter (R2) | the offer and order on the phone, its tax invoice; the scheme card and cluster map; the Lister card, the marketplace, the chat with the Negotiator, the lot won, the truck; the staff-sale card, the receipt uploaded and read; the pickup, the collection, the receipt; Deliveries and the van round | pointers on each |
| 7 | The paperwork | the distributor stamping and signing | the pack; the invoice issued with its e-invoice; the credit note; the ITC memo; the FSSAI checklist; the kirana invoices; Mark reviewed; the distributor's papers with Download PDF | pointers |
| 8 | Not as planned | the landfill, the crew with the tablet (its keyframe, on a slow push) | the scheme card closing short; Left at the godown; the destruction request on Today; the photos taken; the certificate signed in place; the review sheet; the expiry credit note and the certificate | pointers |
| 9 | Report | the office at the dashboard (R4) | the Ledger's Money, GST and Impact readings; the Impact dashboard; the BRSR line; the exports; the Record with photos and the audit trail; the distributor's and the kirana's portals | pointers |
| 10 | The close | the lane at golden hour; the food bank's storeroom receiving the sealed cartons | the guided demo's route map; the workspace sign-in | the four role cards; the links |

## Cut 2, how it is made

- **The screens:** the working app recorded on a fresh walk of both journeys at 2-minute days (`src/tour.mjs`, the
  shot list in `src/tour.json`, 71 shots): a CDP screencast at device pixels (desktop 3200 × 2000, phone 1170 × 2532)
  written at 25 fps, a gliding pointer that scrolls as a person reads, hovers, opens tabs and sheets. The week that does
  not go to plan is recorded on the stub's slow week. The recordings play in a window on the design system's own
  ground (its page colour with the aurora tints), set to the right of the frame; the left carries a feature label (an
  eyebrow and one line) and pointers (an amber dot, a leader and a label pill) beside the element the voice names. No
  light sweep, no screenshot zoom; fades between shots; chapter cards between chapters. The walk behind the
  recordings is `src/director.py --until STAGE`: it brings both journeys to a stage at 2-minute days, then puts the
  day back to 24 hours so each stage holds still while it is recorded (the 48-hour offer window never closed under a
  recording); `src/tour.md` indexes the 71 recordings.
- **The people:** role cards ("The brand's supply planner", "The distributor") in place of names. The phones and
  tablets show the app's own screens: each keyframe was made with the app's screenshot as a second reference, and the
  clip prompt holds the screen still. Every carton carries Munchly's own printed label (the maroon band, the batch,
  MFG and best-before boxes, the MRP, the barcode and the QR code, the FSSAI mark), and every packet is Munchly's own
  pack: the label maker's `MF-2409-117` or `MF-2410-118` label photo and `pack-chips.webp` were given to Nano Banana as
  references (`src/keyframes4.sh`, `keyframes5.sh`), after the maintainer found the first frames' plain MUNCHLY
  lettering unrealistic ("show the munchly logo and product details and barcode labeling with best before dates").
  Three frames were retaken for anatomy the maintainer caught or the review did: the food bank's coordinator had a
  third hand holding her phone from behind; the planner's office grew a second phone in a stray hand; the kirana's
  phone floated beside him. Each prompt now says one phone, two hands, and the clip is rendered only once the frame
  is right.
- **The donation:** the maintainer corrected the first donation scene, a community kitchen serving meals: a donation is
  sealed cartons handed to a food bank such as Feeding India, not cooked food. The scene is now the food bank's
  storeroom receiving the labelled cartons from the van, the coordinator reading the best-before date and her Pickups
  screen (`k32-foodbank-store`); the kitchen keyframe and clip are set aside (`src/img/k32-kitchen-t1.png`,
  `src/clips/old/`). The narration says "as sealed cartons" (6f), "the packs donated" (9d) and "the food bank
  receives" (10a).
- **The voice:** cut 2's lines on Gemini-TTS, four female voices (Kore, Aoede, Leda, Sulafat) and Kore at 1.08,
  directed for warmth and engagement at a measured pace, one file a sentence. Auditioned through Gemini
  (`src/ears.py`): Leda alternated two voices, Aoede slurred one word, Sulafat and Kore scored 8 and 8.5; the pick is
  Kore, cut 1's voice refined, at 1.08 (a few mechanical pauses on acronyms are noted and lived with). The ten lines
  were then trimmed from 977 to 884 words (22 beats re-voiced) so the cut lands near six minutes; the cut is laid out
  on the measured beats (`src/film2.py`), and where a chapter's shots would outrun its narration they shrink in
  proportion, so the voice leads every scene but the close.
- **The music:** the same Lyria bed, looped for the length, the lift at the ledger (`src/bed-cut2.wav`).
