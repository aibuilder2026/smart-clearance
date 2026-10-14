# SC-206 · The working demo, cut 3

A demo film of at most 240 seconds, made again from the three production recordings of 13 Oct 2026 (as SC-205's cuts
1 and 2), on the maintainer's ten notes on cut 2. It joins cut 1 and cut 2 in the repository root's `working-demo/`
folder, carrying its export's date and time in its name.

## The brief

**The maintainer's notes on cut 2 (13 Oct 2026):**

1. The characters must look like the people in the app (its portraits), not new faces.
2. A more human voice-over, in an Indian female accent.
3. The brand scene: more animated, the landing page behind it, special effects and VFX; no blank, grainy ground.
4. Before the console, context: the demo shows the SaaS console, one happy path and one sad path.
5. Each person first seen at work on their device (laptop, tablet or phone), then a VFX move brings the device into
   focus; mixed across scenes.
6. The result screens need more elements, more punch.
7. No unrealistic camera moves or glitches in the clips.
8. Cartons with labels whose FSSAI licence, barcode and QR code can be read.
9. The donation receipt and the GST invoices highlighted.
10. The UPI QR scan made clear.

Then, while it was being made: English only (no Hindi in the voice); and every device the right way round, its screen
towards the person using it ("the images I see being generated with screen on opposite side and looks really bad and
unreal"). Tools: Qwen, LTX, DaVinci (the plugin's checks) and ffmpeg; at most 240 seconds.

## The sources

| Source | Used for |
| --- | --- |
| SC-204's, SC-201's and SC-202's production recordings of 13 Oct (`playwright-automation-videos/`, git-ignored) | the console, the sign-ins, Rehearsal, the Mango Drink's happy path, the chips' sad path; as SC-205 |
| SC-205's captures of production on a virtual clock (`build/agents`, `build/landing`), and its landfill keyframe (`i3-landfill`, with its sidecar in `../SC-205/img/`) | the agents' walk, the landing page under the brand, the opening's landfill |
| The production papers, read from `gs://aibuilder-510213-sc-docs-prod` (read-only, `gcloud storage cp`), laid out at 2.6 px a point with PyMuPDF | the kirana's tax invoice, the donation receipt, the credit notes, the certificate of destruction, the GST e-invoice |
| The cast sheets the app's portraits were cut from (SC-154, SC-158, SC-187; SC-194) | every person's face |
| The label maker (`design3/system/labels`, SC-147) | the Mango Drink's and the Masala Chips' own labels on the cartons |
| The destruction's evidence and the staff sale's receipt (`playwright-automation-videos/sampleData/`) | the photos Rakesh sent, the UPI payments |

## The film (cut 3)

| When | Part | What is on screen |
| --- | --- | --- |
| 0:00 | Every carton has a date | a Mango Drink carton in macro, its real label (FSSAI licence, EAN-13, the batch's QR) in a 2.5D push, called out; a pallet of labelled cartons; the landfill |
| 0:13 | Smart-Clearance | the mark springs in over the live landing page, out of focus, with light and dust; "write-offs" struck out, "recovery" lit; the page comes into focus as a window, then its workspace section |
| 0:27 | Ten agents, nine stops, one yes | the production console's sign-in agents, each lit as the voice names it, beside how the agents sit |
| 0:52 | What you'll see | a route map: the SaaS console, the happy path (Mango Drink) and the sad path (Masala Chips), each line drawn as it is named |
| 0:59 | The console | Neha at her laptop; the camera whips over her shoulder and flies into her screen: every client live, a stock export mapped, people invited, gates per SKU, agents tuned |
| 1:14 | Live on production | Priya, Lakshmi Agencies and Neha signing in; a "live on production · Cloud Run · Gemini" tag stays on through the journeys |
| 1:22 | The Mango Drink | Rehearsal; Priya's alert (face, whip, push); Lakshmi Agencies photographing the label (her screen lifts out of the tablet); the plan approved; the kirana's offer in Hindi (face, whip, push), her order live on Priya's screen; the roadmap; the scheme filling and a kirana's GST invoice, CGST and SGST highlighted; the staff sale paid by UPI; Feeding India collecting, and its donation receipt; the result |
| 2:46 | The Masala Chips | Rakesh by the unsold stack; two shops order; Agrawal Wholesale bids, the Negotiator counters; the window closes with 540 left; destroy and prove it; the landfill photographed through Rakesh's tablet, the before and after evidence; the certificate signed by the officer, two witnesses and Rakesh; Priya's second yes; the certificate and the GST e-invoice; the result |
| 3:47 | The end | the four production addresses |

Every figure is the production runs' own. Every person and company is fictional.

## The ten notes, answered

1. **The app's own faces.** Every person is a Qwen-Image edit whose one condition image is the cast sheet the app's
   portrait was cut from (`gen-qwen.sh`), checked against the portrait; each name tag is the app's own portrait.
2. **The voice.** Maya1 (maya-research, Apache-2.0, local), described as an Indian woman in her thirties, warm,
   corporate explainer, brisk; one take a sentence, two takes a line. A bake-off of the free Indian English voices
   scored by UTMOS22 (naturalness) and an accent classifier (CommonAccent): Veena 3.28 to 3.61, Svara 4.25, Maya1 4.43
   to 4.49, and 11 of 12 segments heard as Indian. Each take was read back by Whisper and the line's take chosen word for
   word (`tts/pick.py`: figures compared by their value, however written). "Munchly" in the chips' result was said
   "Munkli" in six takes; it is respelled "Munch-lee" there (`lines.json` `say`, `tts/vo3/maya1b-brisk/extra.json`).
   Every take naming the brand was then heard three ways (`tts/brand.py`) and the clearest kept: the chips' opening
   line takes a respelled take; elsewhere the respelling split the word, so the original takes stay.
   216 s of speech at its own pace; a pause after "he photographs it" for the shutter.
3. **The brand scene** (`parts3.BrandScene`): from black, a green route drawn across the frame, the live landing page
   behind it out of focus with turning light and dust; the mark springs in, the name wiped on with a sweep of light,
   "write-offs" struck out and "recovery" lit as the voice says them; then the page racks into focus as a browser
   window at smartclearance.web.app and the mark flies home to its logo.
4. **The context** (`parts3.Agenda`): "Three journeys on one platform", a route map of the console, the happy path and
   the sad path, each line and its stations drawn as the voice names it, the two batches' packs where their lines begin.
5. **People, then their devices** (`parts3.DeviceShot`, `vfx.py`): each person is first seen face on, at work, the
   device's back to us; a whip pan takes the camera over their shoulder, where the live app plays in their screen (set
   in frame by frame, under their fingers); then either the camera flies into the screen until it is the window
   (push: Priya, Neha, the kirana, Agrawal, the second yes) or the screen rises out of the device as the room racks out
   of focus (lift: Lakshmi Agencies, Rakesh, the signing, the UPI phone).
6. **The results** (`parts3.ResultPunch`): what was recovered rolls up beside the bin's figure struck through, the
   swing, a bar a channel growing in turn, the facts (ends whole, kilos kept out of landfill, every paper signed), the
   pack, over the batch's own scene; a low hit as the figure lands.
7. **No glitches.** Every clip was measured (`clipcheck.py`: push, pan, jumps; `deflash.py`: one-frame flashes) and is
   used only for its steady first seconds, at its own speed, then held behind a blur where the shot is longer; four
   takes were rejected, and two faces kept as stills (below).
8. **Labels that read.** The label maker's sticker for the batch (FSSAI licence, the pack's EAN-13, the batch's QR) is
   printed onto each carton's blank sticker in perspective, lit and softened to its own focus (`labels.py`,
   `prep-keys.py`, `prep-opening.py`); the barcode and QR code read back from a rendered frame of the film.
9. **The papers** (`parts3.PaperShow`): the production PDFs themselves, each flying in, the camera easing in on one
   highlight with its card: the kirana's tax invoice (CGST and SGST, 2.5% each), Feeding India's donation receipt, the
   price-support credit note, the certificate of destruction signed in place, the GST e-invoice with its IRN.
10. **The UPI scan** (`parts3.UpiScene`): over a staff member's shoulder he holds his phone up to the code on Lakshmi
    Agencies' tablet; his phone's screen rises out of his hand, scans, and pays ₹96 for 12 packs with its UPI
    reference; then all 18 payments arrive and add up to the receipt's ₹1,200 for 150 packs, beside Vision's check.

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| 18 people keyframes (a face and an over-the-shoulder each) and 2 places | Qwen-Image 2.1 (bf16, local) | `img/*.webp` with `.prompt.json`; `src/gen-qwen.sh`, `src/gen-qwen2.sh`, `src/prompts/` |
| Their clips (16 in the cut) | LTX 2.5 Fast (local), 1080p, 5 s, a locked-off camera | `media/*.mp4` with `.prompt.json`; `src/gen-ltx.py`, `src/retakes.sh` |
| The labels on the cartons | the label maker's sticker, printed in perspective | `src/labels.py`, `src/prep-keys.py`, `src/prep-opening.py` |
| Depth for the stills' 2.5D moves | Depth Anything V2 Small (local) | `src/depth.py`, `parts3.Still25D` |
| The screens: found, followed, the app set in | OpenCV | `src/screens.py`, `src/build/screens.json` (corners, some set by eye), `src/track3.py`, `src/vfx.py` |
| The voice-over | Maya1 (local), Whisper large-v3-turbo (mlx), UTMOS22 | `src/lines.json`, `src/tts/` |
| The cut | a frame compositor in numpy and OpenCV, 1920 × 1080, 25 fps | `src/kit.py`, `src/parts.py`, `src/parts3.py`, `src/shots3.py`, `src/render.py` |
| The sound | the voice through one chain; SC-187's felt-piano bed looped and ducked; sound design synthesised from noise and sine tones (whooshes on the whip pans, swells as devices come into focus, a riser and low hits under the mark and the results, a shutter, a payment's chime); −14 LUFS | `src/mix.py` |

### Nothing invented, every device the right way round

Every keyframe was looked at full size. Rejected and redone, each with the device's screen turned to the camera while
its user looked at it (`src/img/rejected/`, `src/prompts/rejected/`): Rakesh in the godown, Agrawal's phone, the
kirana's phone (twice), Neha's laptop, Priya's tablet, Lakshmi Agencies' label photo, Meera at the van. Every clip was
looked at as a contact sheet before use. Rejected: Agrawal's face clip (from 0.9 s he turned the phone's screen to the
camera) and Neha's (she looked up into the lens); each retaken with a firmer prompt and a new seed, and both retakes
failed the same way. Their 1.4 s and 1.6 s face shots are their keyframes instead, moved through in 2.5D on a depth map
(`parts3.StillFace`): every other person's face shot is their clip.

### Each clip, for as long as it holds

- The UPI clip holds the scan for 1.5 s, then the worker lowers his phone: his phone's screen rises out at 1.5 s, and
  its window scans until the voice says "scanning".
- The landfill clip pushes in after 2.5 s: its frame is held there and racked out of focus under the evidence photos.
- A hand over a screen's edge (Lakshmi Agencies tapping) would pull a followed edge in: that screen is followed by its
  three clear edges and its own shape (`track3.follow_hidden`).

## The result (cut 3, 14 Oct 2026)

`media/smart-clearance-working-demo.mp4`: **3 min 59.0 s (238.96 s)**, under the 240 s cap, 1920 × 1080, 25 fps, H.264
crf 21, AAC 48 kHz at −14.0 LUFS integrated and −1.5 dBTP true peak; a 720p copy and the narration as `.srt`. The crf-17
master is `working-demo/smart-clearance-working-demo-2026-10-14_01-31-38.mp4` (git-ignored), beside cut 2
(`…_18-52-26`), cut 1 (`…_14-11-48`) and SC-200's cut in `working-demo/previous-SC-200/`.

- **Checks:**
  - every keyframe at full size, every clip as a contact sheet and measured (`clipcheck.py`, `deflash.py`), every
    tracked screen drawn on its clip (`track3.py`), every shot as stills;
  - every window plays between 0.63× and 1.23× (the scheme's fast-forward aside, which is labelled), and every
    resting window is still from frame to frame (its bar's mean change under 0.5 of 255); the only movement over a
    resting window is designed: the donation receipt flying in, and the app's push landing on Agrawal's phone;
  - the stage's note cards: `cardscan.py`'s 81 hits are all the app's own green buttons in their pressed shade,
    checked by eye; no note card shows;
  - the label's QR code reads back from the film's own frames (`https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024`);
    its barcode's digits are legible, its bars under 2 px a module at that framing;
  - the narration read back from the final mix, a slice a line: 26 of 30 lines word for word; the other four differ by
    one word each, the brand heard as "Manchali" under the music in three and "router" as "rotor" in one, where each
    take reads "Munchly" and "router" on its own;
  - −14.0 LUFS, −1.5 dBTP.
- **The spend:** nothing. Qwen-Image, LTX, Maya1, Depth Anything, Whisper and UTMOS ran on this Mac; the music is
  SC-187's; the production papers were read, not changed.

## Rebuild

From `src/` (the recordings are read from the main checkout):

```sh
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python numpy opencv-python-headless pillow scipy soundfile pymupdf
nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &            # the people (cast-sheet edits) and the places; gen-qwen2.sh, the retake
.venv/bin/python prep-keys.py && .venv/bin/python prep-opening.py o1b && .venv/bin/python prep-opening.py o1 3 4 5 6 7 8 9 10 13 14 15 16 17 18 21 22 23 24 25 26
tts/.venv-snac/bin/python depth.py img/i3-landfill.png img/o1b-carton-macro-L.png img/o1-godown-stack-L.png
nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx.py > gen-ltx.log 2>&1 &   # then ./retakes.sh f-agrawal-b f-neha-b
.venv/bin/python track3.py                           # every over-the-shoulder screen, followed
(cd tts && ./setup.sh && .venv-snac/bin/python vo3.py maya1b brisk 2)                # then mos.py and pick.py
.venv/bin/python render.py && .venv/bin/python mix.py && ./export.sh && .venv/bin/python sidecars3.py
```
