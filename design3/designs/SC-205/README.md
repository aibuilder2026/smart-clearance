# SC-205 · The working demo, made again

A demo film of at most 230 seconds made from the three production recordings of 13 Oct 2026, replacing SC-200's cut
in the repository root's `working-demo/` folder.

## The brief (13 Oct 2026)

- Strictly at most 230 seconds.
- The first 45 to 60 s: what Smart-Clearance is, its USP and the problem it solves, with the agentic architecture in
  mind; the landing page where it helps; realistic footage (warehouses, a manufacturer, offices) made with Qwen,
  LTX 2.5 and ffmpeg, or reused; professional, not too cinematic.
- The next 60 to 90 s: the Mango Drink's happy path, the working screens of each person (supply chain, distributor,
  kiranas), sometimes two screens at once to show it is live.
- The last 60 to 90 s: the sad path, highlighting that not everything sells, and the flow that follows.
- A proper voice-over and animations; show that the demo runs in Rehearsal, with the journey's times changed to play
  the given data.
- The console sign-in's agents animation, with words on how the agentic architecture sits.
- No shaking or blur (SC-200's cut shook and was soft), no zoom cutting screens off, highlights and notes done
  properly; the actual production addresses on screen.

## The sources

| Recording | Run | Used for |
| --- | --- | --- |
| `admin-console-walk-prod-2026-10-13_12-16-11.mp4` | SC-204, `runs/2026-10-13-prod-admin-walk/` | the console's Overview and Agents page |
| `munchly-mango-e2e-prod-2026-10-13_09-09-12.mp4` | SC-201, `runs/2026-10-13-prod-mango/` | the happy path, and the Rehearsal reset |
| `munchly-chips-sad-e2e-prod-2026-10-13_11-07-40.mp4` | SC-202, `runs/2026-10-13-prod-sad/` | the sad path |

The 2560 × 1440 originals, read from `playwright-automation-videos/` in the main checkout (git-ignored). Each device
screen was measured on the stage (`kit.py` `DEV`), and each step's time comes from the run's `report.json`.

Two things were captured fresh from production, frame-exact, on a virtual clock (`vclock.js`: timers, animation
frames, `Date`, `performance.now` and the Web Animations all follow it), at device scale 2:

- the console sign-in's agents at work (`capture-agents.mjs`): 1,050 frames of the walk at a fifth of its speed, each
  frame logged with the stop it is at, so the walk is retimed in the cut to light each agent as the voice names it;
- the landing page (`capture-landing.mjs`): its hero film, the workspace section, the agents' table and the yes.

## The film

| When | Part | What is on screen |
| --- | --- | --- |
| 0:00 | The problem | a packing line (new), a carton on hold at a dock, the landfill: written off, GST credit reversed |
| 0:17 | Smart-Clearance | the brand and its line over the dawn bay; the landing page at smartclearance.web.app |
| 0:30 | The agentic architecture | the production console's sign-in opening into the agents' orbit; each agent lights as it is named; "How the agents sit": ADK pipelines on Cloud Run, Pub/Sub events, Gemini on Vertex AI, backend-api as the system of record, one human yes |
| 0:53 | The console | the Overview's figures, agents at work, each client's agents tuned |
| 0:59 | 02 · The happy path | the Mango Drink at a Hyderabad godown (new); **demo setup: Reset journey at Rehearsal, 1 day = 1 hour**; the Watcher run by hand from the console; Vision's label check; five exits priced; Priya's one yes; a kirana's Hindi offer and order beside Priya's Execution, live; the scheme filling (fast-forward); the staff sale on UPI beside Priya's screen; Feeding India's receipt; the papers; the result |
| 2:28 | 03 · When not everything sells | the chips at a Nagpur godown at dusk (a new keyframe); the plan; two orders, thirty-five noes; the Negotiator's counter; **demo control: the offer window closed early**; **expiry day called**; the destruction against evidence, signed in place; Vision's checks and the second yes; the certificate and the credit note; the result |
| 3:31 | The end | the four production addresses |

Every figure is the production runs' own. Every person and company is fictional.

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| Three new keyframes: a packing line, a distributor photographing a mango carton, a distributor by an unsold stack at dusk | Qwen-Image 2.1 (bf16, local), 16:9 at 2048 | `img/*.webp` with `.prompt.json`; `src/gen-qwen.sh`, `src/prompts/` |
| Two clips from them, 1080p, 5 s; the chips' title is its keyframe on a slow push, since both LTX takes of it jolted and changed perspective mid-clip (no stabilizer could lock them) | LTX 2.5 Fast (local) | `media/n1-*.mp4`, `media/n2-*.mp4` with `.prompt.json`; `src/gen-ltx.py` |
| Reused clips | SC-187's dock and landfill (LTX 720p, sharpened), SC-154's dawn bay (Veo 3.1, already made) | read in place |
| Retiming | ffmpeg `minterpolate` (motion-compensated) to each shot's length at 25 fps: no blended ghosts | `src/slow.sh` |
| The voice-over | Kokoro-82M `af_heart` at 0.94 (free, local); 31 lines, each read back with Whisper | `src/lines.json`, `src/tts/` |
| The cut | a frame compositor in numpy and OpenCV, at 1920 × 1080, 25 fps | `src/kit.py`, `src/parts.py`, `src/shots.py`, `src/render.py` |
| The sound | the voice through one chain; SC-187's felt-piano bed (Lyria, already made) looped and ducked; whooshes from filtered noise; −14 LUFS | `src/mix.py` |

### No shake, no blur, nothing cut off

- **Screens never scale on screen.** Each recording's device screen is resized once, with an area filter, to its
  window's integer size, and pasted at an integer place: pixel-exact while it rests. An entrance is a fade and a rise
  of a few pixels, which converges to the same pixel grid, so nothing pops when it lands.
- **No screen is drawn larger than its source pixels.** Priya's tablet plays at 1:1; the others are downscaled.
- **The one camera move** (the agents' window opening into the orbit) resizes the 4K capture to just above the wanted
  size every frame, so the filter changes smoothly with the scale, and warps the rest in float pixels.
- **Measured:** consecutive frames of a resting window, by phase correlation, show no movement; frame differences
  through the agents' opening rise and fall smoothly.
- **Whole screens are always in view:** highlights are rings drawn round the part being read, with a card joined to it
  by a line, never a zoom.
- **The stage's own notes are left out.** The recordings carry the journey suites' green note cards and dimmed
  spotlights; `spots.py` and `cardscan.py` found every one, and every window was cut round them (the apps' own
  sheets and alerts are kept).

## The result (13 Oct 2026)

`media/smart-clearance-working-demo.mp4`: **3 min 39.5 s (219.5 s)**, 1920 × 1080, 25 fps, H.264 crf 21 (48 MB), AAC
48 kHz at −14.0 LUFS integrated, −1.2 dBFS peak; a 720p copy (24 MB) and the narration as `.srt`. The crf-17 master
(78 MB) is in the repository root's `working-demo/` (git-ignored), with the 720p copy and the captions; SC-200's cut is
kept beside it in `working-demo/previous-SC-200/`.

- **Checks:** contact sheets of every shot and stills at every ring; `cardscan.py` over every frame each window shows
  (only the apps' own green buttons remain); `jitter.py` on resting windows of the master (at most 0.13 px between
  frames, codec noise); frame differences through the one camera move (smooth, no spikes); the narration transcribed
  back from the final mix, every line present and in order.
- **The spend:** nothing. Qwen, LTX, Kokoro and Whisper ran on this Mac; the music is SC-187's, already made.

## Rebuild

From `src/` (the recordings are read from the main checkout):

```sh
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python numpy opencv-python-headless pillow scipy soundfile
nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &                     # keyframes; then
nohup ./after-qwen.sh > gen-ltx.log 2>&1 &                    # the clips, once Qwen is done
node capture-agents.mjs build/agents 42 0.2 dark              # the agents at work, from production
node capture-landing.mjs build/landing                        # the landing page, from production
node mark.mjs                                                 # the brand mark
./slow.sh clips/n1-factory-line.mp4 build/slow/n1.mp4 0.78    # n2: 0.68 "" 4.0; c53, c54: 0.9 720; f1: 0.95
<kokoro venv>/bin/python tts/vo.py af_heart 0.94              # the voice-over (SC-200's venvs)
<asr venv>/bin/python tts/asr.py tts/vo/af_heart-0.94         # word timings, which the shots are laid on
.venv/bin/python render.py && .venv/bin/python mix.py         # the picture (about 90 s), then the sound
.venv/bin/python sidecars.py                                  # the shipped keyframes and clips with their sidecars
./export.sh                                                   # the master, the 1080p and 720p copies, the captions
```

`still.py` renders single frames, `cardscan.py` lists any stage note a window would show, and `jitter.py` measures
frame-to-frame movement in a region.
