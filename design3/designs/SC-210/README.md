# SC-210 · The sales film

A sales film of Smart-Clearance's whole journey, 4 min 57 s. It reworks the landing page's demo film (SC-187) and
marries it with the working demo (SC-205 to SC-209). Its parts:

- real people at work and talking;
- the agentic ecosystem in 3D;
- the production app as recorded;
- the papers, the money and the impact.

It names no client, person or product, and it sits in the repository root's `landing-demo/sales-film/` folder, its
export's date and time in its name.

## The brief

**The maintainer's request (14 Oct 2026):**

1. Cinematic, full of motion animations and effects.
2. Reviewed properly, with no glitches.
3. A sales video of the full end-to-end journey, not an app demo (parts of either film can be reused).
4. Sharp, with no glitches or hallucinations, proper camera motion and lighting.
5. The agentic AI ecosystem clearly portrayed.
6. A narrator who sounds like a real person, an Indian woman, over very surreal background music.
7. The Playwright recordings used, with animation effects.
8. The SaaS product highlighted.
9. Covering:
   - the financial and ESG impacts;
   - the paperwork, and the destruction and its signing;
   - the food donation, the staff sale and the kiranas;
   - the ExpireSoon marketplace and every integration.
10. No client or product names, very generic; product photos only of the mango and chips packs.
11. Scenes where real people talk.

**A hard limit of about 7 minutes.**

**The maintainer's answers:**

- **Veo 3.1 talking scenes, with a $35 cap.** The cap covers Veo, the Gemini-TTS narrator and the Lyria score.
- **The app's screens kept as recorded.** The narration, titles and overlays name no client, person or product.

## The film

| When | Part |
| --- | --- |
| 0:00 | **The waste.** A distributor's godown at dawn: the days running out on every carton, then the label's best-before. A distributor, in her own words: "Sixteen hundred packs, and twenty-two days left." On hold: too close for quick commerce, too slow for the shelf. The bin: the batch's cartons in one trail across dark earth, with what destroying them costs. Week after week, brand after brand, WRITTEN OFF |
| 0:32 | **The product.** Dawn at the bay. Smart-Clearance: software as a service that turns write-offs into recovery. Every brand its own secure workspace. One console onboards a brand in minutes, and the platform team watches every client, batch and agent live |
| 1:05 | **The agentic ecosystem.** A team that never sleeps: ten agents on Google's Agent Development Kit, on Cloud Run, thinking with Gemini. Each agent named with its job and its model as the voice reaches it. Pub/Sub, BigQuery and every screen live. The batch passed from hand to hand, stopping only for a person's yes |
| 1:58 | **The journey.** The Watcher flags the batch at dawn, and Vision reads one photo of the label. The Valuer prices every exit and the Router splits the batch. The supply chain lead: "Kiranas, a staff sale, the food bank… and nothing to the bin. Approved." Then the offer reaches a kirana in Hindi, and the orders land live, each with its GST invoice. A delivery at the kirana's counter. The staff sale by UPI, its receipt read by Vision. The food bank's collection and receipt: "Fifty-eight packs. That's fifty-eight meals tonight." The marketplace: listed, bid and countered, and the floor price never shown. "Fourteen-twenty a pack? Done. Send the truck." The hardest case: destroyed against two photos Vision checks, the certificate signed at the landfill, "All four signatures. Now it's on the record." Then the second yes |
| 3:47 | **The papers, the money, the record, the impact.** Every paper drafted, signed and filed. How the batch's swing adds up. Every step on the record, one request traced. The impact ledger, ready for BRSR |
| 4:30 | **The close.** What it plugs into: stock exports, Tally, UPI, the marketplace and the food banks, on every device. "Smart-Clearance. Ten agents. One yes. And nothing good goes to waste." The guided demo to try, with its QR code |

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| The narrator | **Gemini-TTS** (`gemini-2.5-pro-tts`, Cloud Text-to-Speech), voice Sulafat in en-IN, directed for a warm, unhurried Indian storyteller. Picked from a bake-off of the 14 Chirp 3 HD en-IN women's voices and the Gemini voices, scored by UTMOS and Whisper. Three takes a line, each read back by Whisper. Gemini-TTS can read its direction aloud, so a take that adds a word loses | `src/tts/tts10.py`, `src/tts/pick.py`, `src/lines.json` |
| The talking scenes | **Veo 3.1** (`veo-3.1-generate-001`), 1080p, 8 s with sound, each from a working-demo keyframe of the same cast and places. Each was reviewed by Gemini as a VFX supervisor, cut to its line, and played frame for frame at 25 fps with its sound sped up to match | `src/gen-veo10.sh`, `src/prompts/talk/`, `src/prep-veo10.py`; `media/talk/` with sidecars |
| The score | **Lyria 2** (`lyria-002`): six cues in D, two seeds each, seven used (one an act, the journey's two alternating). Picked by Gemini as ears. Each cue is looped through equal-power cross-fades, cross-faded into the next over 3 s, and ducked about 12 dB under every voice (20 dB in the presence band) | `src/lyria.py`, `src/gen-lyria10.sh`; `media/music/` with sidecars |
| The agentic ecosystem | three.js 0.170 with bloom: the core, the ten agents on their ring, Pub/Sub, BigQuery's history and the live screens. Captured frame-exact in headless Chromium on the narration's own cues, each frame reporting where every node lands, so the compositor's cards, names and tags follow them | `src/eco/` |
| The cut | the frame compositor (numpy and OpenCV, 1920 × 1080 at 25 fps): the talking scenes, the 3D scene, the app's windows, cards, rings, pushes, papers and type | `src/parts10.py`, `src/shots10.py`, `src/render10.py` |
| Carton labels on the reused Veo clips | the batch's own label (the label maker's) tracked onto the cartons that Veo drew with garbled fine print, across four clips. Each label is found in a clean frame and followed by its plane (SIFT, a RANSAC homography refined by ECC, smoothed over time). It is printed in the paper's own light, focus and grain, and kept off the inspector's finger | `src/relabel.py`, `src/relabel/flat.mjs` |
| The sound | the voices, the talking scenes in their own spaces, the score, and synthesised sound design laid where the shots put their motion | `src/mix10.py` |
| The checks | Whisper's read-back of every line from the final mix; Gemini watching each minute with its sound; lip sync measured frame by frame; QR codes read back | `src/readback10.py`, `src/eyes.py`, `src/ears.py` |

**Reused:**

- the production recordings of 13 Oct 2026 (SC-201, SC-202, SC-204), as recorded;
- SC-187's Veo clips (the hold, the label photo, the food bank, the distributor's office), now carrying real labels;
- SC-154's dawn bay and evening office;
- SC-205 to SC-209's people and devices (LTX), the labelled godown, the aerial bin trail, the factories and the deliveries.

## Found while checking

- **Hallucinated lettering.** All nine of SC-187's Veo clips the first cut used had carton labels with garbled fine print
  ("BATCH NO MF 0168-117", "BEST BEFORE 18/11/0005"). The worst also had garbled brand names ("NUKCKLY", "WUNCHLY"), and
  one had mirrored packs:
  - the hold, the label photo, the food bank and the distributor's office now carry the real label, tracked (above). The
    new label stays within about a pixel of its carton;
  - the landfill became SC-209's aerial bin trail;
  - the factory became the labelled godown stack;
  - the kirana's offer became SC-206's shopkeeper, with her real phone screen;
  - the meeting room, whose wall screen was a garbled dashboard, became the supply chain lead at her desk;
  - the buyer's opening became his labelled keyframe, the one his talking scene was made from.
- **The talking scenes' sound ran 0.3 s past the line.** `prep-veo10.py` cut it with `-t` on the output, after the speed-up,
  so each file took in 0.3 s of its clip after the line. Played over the scene's held last frame, it read as loose lip
  sync. It is now cut on the input. The cut's sync was then measured frame by frame (the mouth opening against the
  sound) and matches the raw clips.
- **Two scenes retaken.** In the kirana scene the shopkeeper grinned through his line, and in the food bank's the
  volunteer smiled through her second sentence, so their mouths barely shaped the words. Both were retaken on Veo 3.1
  ($6.40) with the speech directed: the shopkeeper smiles after his line, and the volunteer speaks to camera. The first
  takes stay local.
- **The talking scenes' sound:**
  - the speech sounded dry and dubbed. Each scene now has its own space: a godown and a warehouse ring, an office is
    small, and the lane, the yard and the landfill are open air with their ambience up. Under it lies a bed of the
    scene's own room tone for the whole shot;
  - the score swelled into each scene's pauses, and now stays down through it.
- **The 3D scene:** black rectangles (a shader's NaN) and a washed-out bloom, both fixed.
- **Type and overlays:**
  - "One yes" read "One ues" for a few frames, as the y's tail rose out of its mask last. Words now slide in whole;
  - the amber ring round BEST BEFORE clipped the MFG line above it, and now hugs its own line;
  - two agent cards shared the frame at each handover, so each card now goes as the next comes;
  - the agents' names ran into each other and under the floating screens, so they now fade where anything nearer
    covers them;
  - "Every event," hung on screen for four seconds, so the line now builds as it is said: "Every event flows. Every
    screen, live.";
  - the tea factory's machine had a blank white screen, which now shows a generic panel (`src/hmi.py`);
  - the food bank's two volunteers ghosted through each other in a dissolve, so they now meet on a cut;
  - the receipt hung into the next dissolve, and is now gone before it;
  - the certificate on the landfill tablet jittered where a finger crossed the screen's edge. The track's thrown
    frames are now bridged and smoothed.
- **"Floor price".** Whisper hears "floor cries" in the final mix. Gemini, listening to the same seconds, hears "floor
  price" with nothing unclear, so the mix is unchanged.

## The result

`media/smart-clearance-sales-film.mp4`: **4 min 57.3 s (297.32 s)**, under the 7-minute limit.

- 1920 × 1080 at 25 fps, H.264 crf 21 (83.9 MB), with AAC 48 kHz audio at −14.0 LUFS integrated, −1.4 dBTP true peak and
  2.8 LU range.
- Beside it are a 720p copy and the narration as `.srt`.
- The crf-17 master is `landing-demo/sales-film/smart-clearance-sales-film-2026-10-15_03-46-58.mp4` (git-ignored).

**Checks:**

- **The read-back:** every line read back from the final mix, a slice a line: 33 of 39 word for word, every talking
  scene among them. Of the rest:
  - "PubSub" for Pub/Sub, "cell through" for sell-through and "PACs" for packs;
  - "floor cries" (above);
  - 14.20 written in digits;
  - the URL as one word.
- **Gemini's review:** each minute watched with its sound: 6.8, 6.5, 6.8, 6.7 and 6.0. It finds no garbled or mirrored
  text and no clipped type. What it still notes:
  - the small artefacts of AI faces in the talking scenes;
  - the app screens' dense text, kept as recorded;
  - the pace of the agents' roll call, set by the narration.
- **Lip sync:** each talking scene's mouth against its sound, frame by frame, in the raw clip and in the cut.
- **The QR codes,** read back from the film's own frames: the carton label's
  `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024`, and the end card's
  `https://smartclearance-demo.web.app`.
- **The whole film** as contact sheets every 4 s, and every changed shot as stills.

**The spend:** about $28 of the $35 cap.

- Veo: $25.60 (eight clips at $3.20, two of them the retakes).
- Lyria: $0.72 (twelve cues).
- The Gemini-TTS narrator: about $0.6.
- Gemini's reviews: under $1.

The Veo and Lyria figures come from their sidecars (`cost.py`). The narrator's and the reviews' are estimated from list
prices, as neither API returns a cost. Qwen, LTX, Whisper, UTMOS and ffmpeg ran locally.

## Rebuild

From `src/`. It needs the earlier cuts' media in place (SC-187, SC-154, SC-205 to SC-209), and reads the recordings from
the main checkout. The talking scenes, the score and the narrator cost money (above):

```sh
./gen-veo10.sh && ./gen-veo10.sh t3-kirana-b t4-foodbank-b        # the talking scenes, and the two retakes
./gen-lyria10.sh                                                  # the score's twelve candidates
(cd tts && python3 tts10.py lines gemini-Sulafat 3)               # the narrator; then pick.py vo3/gemini-Sulafat
.venv/bin/python prep-veo10.py                                    # the reused clips, and each talking scene's window
.venv/bin/python relabel.py quads && .venv/bin/python relabel.py flat && .venv/bin/python relabel.py run
.venv/bin/python hmi.py && node render-pushes.mjs 380 460
.venv/bin/python shots10.py && (cd eco && node capture-eco.mjs ../build/eco ../build/eco-cues.json 25)
.venv/bin/python render10.py --workers 10 && .venv/bin/python mix10.py && ./export10.sh
```
