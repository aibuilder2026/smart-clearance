# SC-158 · The Mango Drink demo film

A demo film of under six minutes: the happy path of the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies,
Begum Bazaar, Hyderabad) from the brand to the distributor, the kiranas, the staff sale and the food bank, through the
papers to the ledger, told with real-looking people and the app's own screens and notifications.

## The brief (10 Oct 2026)

1. LTX (local), Qwen-Image (local) and ffmpeg make the whole film.
2. Realistic human characters.
3. The people's notifications as phone pop-ups, with the running app's own words.
4. Smart-Clearance as a SaaS, agentic AI platform; the staff console shows it.
5. The ESG, GST and credit-note papers being generated.
6. How the kiranas benefit.
7. Background music, and captions explaining each scene.

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| The cast (three new sheets; Priya and the kirana owner reuse SC-154's) and sixteen keyframes | Qwen-Image 2.1 bf16, local (`src/gen-qwen.sh`) | `img/` (WebP + `.prompt.json`), PNG originals in `src/img/` |
| The live-action clips, one per keyframe, 5–8 s at 540p | LTX 2.5 Fast, local, image to video (`src/gen-ltx.py`) | `media/clips/` (+ `.json` sidecars) |
| The app's screens at every stage of the journey | the live stack: backend-api, the agents on Gemini, the workspace and console dev servers; `src/director.py` walks the Mango Drink's journey and `src/capture.mjs` screenshots each person's screens with Playwright | `src/screens/` |
| The notifications | the pushes backend-api composed for the Mango Drink (`push.*` in the live fixtures and the walk's case), rendered as phone pop-ups from the kit's tokens (`src/overlays/`) | `src/overlays/out/` |
| The captions and title cards | HTML on the design system's tokens, screenshotted with a transparent background | `src/overlays/out/` |
| The music | a generative ambient piece in numpy: a warm pad on a four-chord progression, a plucked pentatonic melody, a soft pulse (`src/music.py`) | `src/music.wav` |
| The cut | ffmpeg (`src/assemble.py`): the clips upscaled to 1080p, the screens in a window frame with slow pans, the pop-ups sliding in, the captions fading, the clips' own ambience under the music | `media/mango-drink-demo.mp4` |

## The cast (all fictional)

| Who | In the story | Look |
| --- | --- | --- |
| Priya Deshmukh | Munchly Foods' regional supply-chain manager, Pune; the one yes | SC-154's planner: navy pinstripe kurta, lanyard |
| Lakshmi | owner of Lakshmi Agencies, the distributor; Begum Bazaar godown | late forties, teal cotton saree, glasses on a cord, a plait |
| The kirana owner | Sri Lakshmi Ganapathi Kirana, Begum Bazaar | SC-154's kirana owner: maroon saree, mustard blouse |
| Meera | Feeding India's city lead, Hyderabad | early thirties, green T-shirt, lanyard, a bun |
| Neha Kulkarni | Smart-Clearance staff, in the console | late twenties, white shirt, black-framed glasses |

## The scenes

Target 5:30. Every figure is the journey's own (money.js through backend-api): plan ₹16,917 net, ₹22,194 better
than the bin; 1,372 packs to 52 of 58 kiranas at ₹12 effective (buy 10 get 2 free); 150 to the staff sale at ₹8;
58 to Feeding India; −₹22,657 if destroyed; ₹837 of input GST kept.

| # | Time | Scene | Live action (keyframe → LTX clip) | App and pop-ups | Caption |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Title | k01 the factory's bay at dawn; k16 the filling line | the mark | Smart-Clearance · Near-expiry stock, routed by AI agents. One yes from a person. |
| 2 | 0:18 | The batch | k02 Lakshmi in the godown reading a carton's date | — | 2,000 packs of Mango Drink 200 ml at Begum Bazaar godown. 22 days to best-before. Quick commerce will not take them. |
| 3 | 0:38 | The platform | k04 Neha at the console | console: Overview, Clients, Munchly's agents, Channels & rules | A SaaS: one workspace per brand, set up by Smart-Clearance's staff. Ten agents on Gemini. |
| 4 | 1:05 | Detect | k03 Priya at her laptop; k05 Priya reads her phone | pop-up to Priya (detect); Command Center at risk | Every morning the Watcher checks every batch. 1,580 packs will not sell in time: −₹22,657 if destroyed. |
| 5 | 1:35 | Verify | k06 Lakshmi photographs the label | pop-up to Lakshmi (verify); Vision's read | One photo. Vision reads the batch, the dates and the MRP, and matches the DMS export. |
| 6 | 2:00 | Plan and the yes | k07 Priya's thumb on the green button | pop-up to Priya (plan); Route Room; Plan placed; pop-up to Lakshmi (approved) | The Valuer prices five exits, the Router splits the batch. Priya says yes once. |
| 7 | 2:35 | The kiranas | k08 the owner reads the offer; k09 a sale at the counter | pop-up in Hindi (offer); the offer screen; her orders | 58 shops get the offer in Hindi. Buy 10, get 2 free: ₹20 packs at ₹12. 52 shops order 1,372. |
| 8 | 3:15 | The staff sale | k10 the table at the gate at dusk | pop-up to Lakshmi (staff sale); the card recorded | 150 packs for the godown's own staff at ₹8. |
| 9 | 3:35 | The donation | k11 Feeding India's van | pop-up to Meera (pickup); Meera's pickup and receipt; pop-up to Priya (confirmed) | 58 packs with 22 days left become 58 meals. Feeding India issues its receipt. |
| 10 | 4:05 | The van and the papers | k12 the Saturday round; k13 Priya reads the pack | pop-up (van route); pop-up (document pack); the credit note, the GST memo, the FSSAI checklist | Paperwork drafts the price-support credit note and the GST memo. Munchly keeps ₹837 of input credit. |
| 11 | 4:40 | The ledger | k14 Priya and Arjun at the dashboard | Impact posted; the ledger's Money, GST and Impact readings; the BRSR line; the console's Food by day | Impact posts the ledger: ₹16,917 recovered, 340 kg out of landfill, CO₂e avoided, 58 meals. BRSR and GST exports with evidence. |
| 12 | 5:10 | The close | k15 the lane at golden hour; k02 reprise | the four people's figures | The brand recovers, the distributor ends whole, the kiranas earn, 58 meals are served. smartclearance.web.app |

## Decisions

- No design round: the maintainer named the deliverable and the tools outright, and the tools are local and free.
  The film's own design decisions are recorded here.
- The console is shown on the prototype's seed world, signed in as Neha; the workspace on Munchly's live journey,
  walked to each stage.
- Every pop-up is one of backend-api's own pushes for this batch (`domain/copy.py`), never written for the film.

## The film (11 Oct 2026)

`media/mango-drink-demo.mp4`: 4 min 56 s, 1920 × 1080, 24 fps, H.264 (crf 24, 68 MB; the crf-18 master, 134 MB, stays
local in `src/build/`), AAC stereo normalised to −16 LUFS. 42 segments: 17 live-action clips and 25 app screens, 64
overlays (11 pop-ups, 40 captions, 11 chapter labels, the title and the end card), under the generated score.

- **The run it tells:** the Mango Drink's journey walked on this checkout's own stack (API on :8001, the apps on :5185
  and :5184, a `smart_clearance_film` database, the agents on live Gemini) by `src/director.py`, from a quiet morning
  to Impact's ledger, with the journey day at 2 minutes. Its figures: 1,608 packs at risk, −₹23,059 if destroyed;
  plan ₹16,888 (1,372 to 52 of 58 kiranas at ₹12, 150 to staff at ₹8, 86 to Feeding India); CN/0117, the GST memo
  (₹837 kept), the FSSAI checklist and receipt FI/HYD/26-27/0417, each with its PDF; 345.7 kg kept out of landfill,
  864 kg CO₂e, 86 meals. Every caption reads the run's own numbers (`figures.json`), every pop-up backend-api's own
  push for the batch (`pushes.json`).
- **The cast and keyframes:** Qwen-Image 2.1 at 1024, each person from a reference sheet (Priya and the kirana owner
  from SC-154's, Lakshmi, Meera and Neha new). The maintainer's notes led to retakes: a laptop and a tablet whose
  screens faced the camera (k03, k13: now the lid toward the camera, the tablet upright toward her), Lakshmi's phone
  likewise (k06: shot from behind her shoulder, the phone's back to us), and the golden-hour lane where the kirana
  owner's customer was her own double (k15: a young man in a checked shirt).
- **The clips:** LTX 2.5 Fast at 540p, image to video from each keyframe, 5 to 8 s, about 9 minutes each; every contact
  sheet was checked for form, action and camera before the cut. Upscaled to 1080p and slowed to 0.75–0.85 in the cut.
- **The screens:** each app screen lands in a window (or a phone frame) that scales and slides in as the live scene
  behind it pulls out of focus, a light sweeps across it, a long page scrolls, a short one drifts in; two screens in a
  row cross through a directional wipe. The pop-ups slide down at the top right in the lock-screen's shape.
- **The music:** `src/music.py`, D major at 76 bpm, a pad on I–V–vi–IV, a plucked pentatonic line from 0:14, a sub
  bass from 0:35, a shaker and a tak from 1:04, lifting at the ledger and fading at the end.
- **Checks:** every segment's frames were looked at from contact sheets of the draft and the final; the audio measures
  −16.4 dB mean, −1.5 dB peak; `ffprobe` reads 296.5 s, h264 1920×1080 at 24 fps, AAC 48 kHz.
