# SC-205 · The working demo, made again

A demo film of at most 235 seconds made from the three production recordings of 13 Oct 2026, replacing SC-200's cut
in the repository root's `working-demo/` folder. Cut 1 (3 min 39.5 s) is kept beside the new one, with its time stamp;
cut 2 is the one described here.

## The brief

**Cut 1 (13 Oct 2026):**

- at most 230 seconds; the first 45 to 60 s on the problem, the product and its agentic architecture, with realistic
  footage (warehouses, a manufacturer, offices) from Qwen, LTX 2.5 and ffmpeg; then the Mango Drink's happy path, then
  the sad path;
- a proper voice-over and animations; the demo shown running in Rehearsal; the console sign-in's agents animation with
  words on how the architecture sits;
- no shaking or blur (SC-200's cut shook and was soft), no zoom cutting screens off; the production addresses on screen.

**Cut 2 (13 Oct 2026), on the maintainer's notes on cut 1:**

- no need to show Report now clicked by the super admin;
- the people introduced as characters, at work on the devices the screens are running on (supply chain, the
  distributor, the staff sale paying by UPI, the food bank picking up, the van delivering, the destruction and its
  evidence), with the pushes they receive popping up on their devices, while the live screens play beside them;
- how quickly a client's agents and SKUs are configured in the console;
- the agents' animation untouched;
- the first 20 seconds condensed; at most 235 seconds;
- the voice-over to say the screens run live against the production addresses, on Cloud Run, with agents on Gemini;
- quick sign-ins, so it is plain this is run live;
- kiranas get their message in their own language; more Indian languages and WhatsApp are next;
- new images and clips made with Qwen, LTX and ffmpeg, reviewed so nothing is invented;
- the same face for each person throughout, and sharp label images.

## The sources

| Recording | Run | Used for |
| --- | --- | --- |
| `admin-console-walk-prod-2026-10-13_12-16-11.mp4` | SC-204, `runs/2026-10-13-prod-admin-walk/` | the console: Overview, a client's first export, people, SKU gates, agents |
| `munchly-mango-e2e-prod-2026-10-13_09-09-12.mp4` | SC-201, `runs/2026-10-13-prod-mango/` | the sign-ins, Rehearsal, the happy path |
| `munchly-chips-sad-e2e-prod-2026-10-13_11-07-40.mp4` | SC-202, `runs/2026-10-13-prod-sad/` | the sad path |

The 2560 × 1440 originals, read from `playwright-automation-videos/` in the main checkout (git-ignored). Each device
screen was measured on the stage (`kit.py` `DEV`), each step's time comes from the run's `report.json`, and every ring
was placed on a gridded frame of the exact moment it shows (`gridshot.py`).

Captured fresh from production on a virtual clock (`vclock.js`: timers, animation frames, `Date`, `performance.now`
and the Web Animations all follow it), at device scale 2:

- the console sign-in's agents at work (`capture-agents.mjs`): 1,050 frames at a fifth of the walk's speed, each
  logged with its stop, so the walk is retimed to light each agent as the voice names it;
- the landing page (`capture-landing.mjs`): its hero film, the workspace section, the agents' table.

## The film (cut 2)

| When | Part | What is on screen |
| --- | --- | --- |
| 0:00 | The problem | a packing line, a held stack of cartons, the landfill (new Qwen and LTX), in 11 s |
| 0:11 | Smart-Clearance | the brand; the landing page at smartclearance.web.app |
| 0:24 | The agentic architecture | the production console's sign-in opening into the agents' orbit, each agent lit as it is named, beside "How the agents sit" (unchanged from cut 1) |
| 0:47 | The console, a brand in minutes | Neha at her laptop beside the console: every client live, a stock export mapped by the Data agent, people invited, quick-commerce gates per SKU, agents set to act, ask or suggest |
| 1:02 | Live on production | Priya, Lakshmi Agencies and Neha signing in on their own devices, at the production addresses; a "live on production · Cloud Run · Gemini" tag stays on through the journeys |
| 1:15 | Munchly Mango Drink | Rehearsal set in the console; Priya receives the Watcher's alert; Lakshmi Agencies photographs the label and Vision matches it; Priya approves; a kirana gets the offer in Hindi and orders, live on Priya's screen; the roadmap (more Indian languages, WhatsApp); the scheme fills; the staff sale paid by UPI; Meera of Feeding India loads the van; the Saturday van delivers; the papers; the result |
| 2:33 | Munchly Masala Chips | Rakesh by the unsold stack; two kiranas order, thirty-five say no; Agrawal Wholesale bids and the Negotiator counters; the window closes with 540 left; Rakesh asked to destroy them and prove it; the destruction photographed at the landfill; the certificate signed by the officer, two witnesses and Rakesh; Priya's second yes; the result |
| 3:28 | The end | the four production addresses |

Every figure is the production runs' own. Every person and company is fictional. Every push on a device is the app's
own wording (backend-api `domain/copy.py`) with the runs' figures (`src/pushes.json`), rendered by Chromium so the
Hindi is shaped (`render-pushes.mjs`).

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| The people at work, and the intro: 13 keyframes, then edits where a person or place returns (Priya approving and in the evening, the kirana's delivery, Lakshmi photographing the label and at the staff sale, Rakesh at the landfill) so each face stays the same | Qwen-Image 2.1 (bf16, local) | `img/*.webp` with `.prompt.json`; `src/gen-qwen2.sh` to `gen-qwen5.sh`, `src/prompts/` |
| Their clips | LTX 2.5 Fast (local): 540p 5 s for the people's panels, 1080p 5 s for the full-frame intro | `media/*.mp4` with `.prompt.json`; `src/gen-ltx2.py`, the destruction's retake `src/gen-ltx3.py` |
| Each name tag's face | cut from the person's own keyframe (`faces.py`), so a tag always shows the person on screen | `src/build/faces/` |
| The voice-over | Kokoro-82M `af_heart` at 0.94 (free, local); 30 lines, each read back with Whisper (one reworded where "on UPI. Vision" ran together, "Raipur" given its sounds) | `src/lines.json`, `src/tts/vo2.py` |
| The cut | a frame compositor in numpy and OpenCV, 1920 × 1080, 25 fps | `src/kit.py`, `src/parts.py`, `src/shots.py`, `src/render.py` |
| The sound | the voice through one chain; SC-187's felt-piano bed looped and ducked; −14 LUFS | `src/mix.py` |

### Nothing invented

Every keyframe was looked at full size before it was animated. Rejected and redone:

- a landfill heap with tablets in it; then the same frame with lettering on the excavator and brand-like printing on
  the packets (an edit removed every word and logo);
- the staff sale with a worker holding two phones, a signboard and printed packs;
- the signing at the landfill turned into a brown folder by a retake (the voice says tablet; the earlier frame was kept).

Every carton is plain, no screen faces the camera readably, and the only label in the film is the real label photo
Lakshmi Agencies sent (`sampleData/…/label-photo.webp`), shown at its own sharpness.

### No shake, no blur

- Screens never scale on screen: each is resized once to its window's integer size and pasted pixel-exact; entrances
  are a fade and a sub-pixel rise onto the same grid; highlights are rings with cards, never zooms.
- LTX pushes in even when asked to hold still, and the push speeds up and can change a face. `clipcheck.py` finds how
  long each clip stays gentle, `stab.py` locks that stretch to a tripod frame (every frame aligned to the last one
  kept, so no edge shows), and `prep-clips.py` retimes it to its shot (motion-interpolated, never slower than 0.6x,
  forward then back if the shot is longer, with eased turns from `breathe.py` where it would turn more than once).
  Where LTX moved the camera in perspective (Neha at her laptop), no lock can hold it; its gentlest 2.4 s plays forward
  and back with eased turns instead.
- The stage's own green note cards are cut round in every window (`spots.py`, `cardscan.py`, `clean.py`).

## The result (cut 2, 13 Oct 2026)

`media/smart-clearance-working-demo.mp4`: **3 min 39.2 s (219.2 s)**, under the 235 s cap, 1920 × 1080, 25 fps, H.264 crf
21, AAC 48 kHz at −14.0 LUFS integrated, −1.4 dBFS peak; a 720p copy and the narration as `.srt`. The crf-17 master is
`working-demo/smart-clearance-working-demo-2026-10-13_18-52-26.mp4` (git-ignored), beside cut 1
(`…_14-11-48.mp4`) and SC-200's cut in `working-demo/previous-SC-200/`.

- **Checks:** every keyframe at full size before it was animated; every clip as a contact sheet and measured
  (`clipcheck.py`: zoom, pan and jumps; `deflash.py`: one-frame flashes; a flame-colour scan of the destruction clip);
  every shot as stills, every ring on its target; `cardscan.py` over every frame each window shows; the playback speed
  of every window between 0.55× and 1.25× (the fast-forward of the scheme filling aside, which is labelled); resting
  windows still to the sub-pixel (`jitter.py`); the narration transcribed back from the final mix, all 30 lines present.
- **Rejected on the way:** a landfill heap with tablets, then with lettering on the excavator and brand-like printing
  on the packets; a worker holding two phones; a signing frame where the tablet became a folder; a destruction clip
  whose falling packets glowed like flames; the chips' godown clip twice (a jolt and a change of perspective).
- **The spend:** nothing. Qwen, LTX, Kokoro and Whisper ran on this Mac; the music is SC-187's, already made.

## Rebuild

From `src/` (the recordings are read from the main checkout):

```sh
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python numpy opencv-python-headless pillow scipy soundfile
nohup ./gen-qwen2.sh > gen-qwen2.log 2>&1 &     # then gen-qwen3.sh to gen-qwen5.sh, the edits and retakes
nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx2.py > gen-ltx2.log 2>&1 &
node capture-agents.mjs build/agents 42 0.2 dark && node capture-landing.mjs build/landing && node mark.mjs
node render-pushes.mjs 380 460                  # the pushes, as banners
.venv/bin/python faces.py                       # the name tags' faces
<kokoro venv>/bin/python tts/vo2.py af_heart 0.94 && <asr venv>/bin/python tts/asr.py tts/vo2/af_heart-0.94
.venv/bin/python prep-clips.py                  # the clips, steady stretch, locked, fitted to their shots
.venv/bin/python render.py && .venv/bin/python mix.py && ./export.sh
.venv/bin/python sidecars.py
```
