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
