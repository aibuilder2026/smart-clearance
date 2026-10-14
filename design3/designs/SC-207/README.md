# SC-207 · The working demo, cut 5

Cut 5 of the demo film (after SC-206's cut 4), on the maintainer's notes on cut 4, under the 238-second cap they set.
It is made from the same three production recordings of 13 Oct 2026, cut 4's keyframes and clips (SC-206's `img/`
and `media/`), and new scenes. It joins the earlier cuts in the repository root's `working-demo/` folder, carrying its
export's date and time in its name.

## The brief

**The maintainer's notes on cut 4** (14 Oct 2026). They liked "the animation and sound effects", and asked to "take it
to the next level, all under 238 seconds only":

1. The opening is "fabulous", but its words read like subtitles: give them an animation contextual to the use case.
2. Before the journeys, explain how Munchly Foods, an imaginary client, is set up: its supply chain animated
   (distributors, kiranas, donation partners and the rest), then that the demo shows a happy path and a sad path.
3. Play the agents' animation in full, with sound effects, intuitive and engaging.
4. Fix the product images with bad edges (the chips' pack on the result card, and one or two more places).
5. At the close, ask viewers to try the guided demo at smartclearance-demo.web.app, show its landing page, and put the
   links in the video.
6. Align the end card's text.
7. Show Priya's tablet sign-in in dark mode, with her signing in.
8. Highlight the calculations per batch (How the swing adds up).
9. Show that the workspace app is a PWA: installable on every device, and installed for live notifications.
10. Drop the mid-film roadmap line (WhatsApp, Indian languages). End with a future scope: WhatsApp, more Indian
    languages, and native iOS and Android apps.

**Then, while it was being made:**

- "the opening … shows cartons with no labels and seems unrealistic, have some proper labels on them";
- "narrate google technologies every now and then": Cloud Storage for the papers, Cloud SQL for the data, how
  BigQuery is used, Firebase for sign-in, the agents on Cloud Run and the models they use. "Subtle and techno
  functional", in a voice "more human like".

## What changed

| Part | Cut 4 | Cut 5 |
| --- | --- | --- |
| The opening's words | a line of text under the godown | printed on a shipping label as the voice says them (`parts5.LabelPrint`). The label feeds up out of a glowing print line, row by row, with its barcode and the batch's best-before. On "slowly", a red WRITTEN OFF stamp thumps onto it; the label lifts away as the camera dives into a carton |
| The godown's cartons | blank labels (LTX left them so) | every carton's label printed (`cartons.py`), with the brand's band and mark, the product, the batch and best-before, and an ITF-14. They follow the dolly and take the clip's light and haze. The right of the aisle carries the Mango Drink (MF-2410-118), the left the Instant Poha (MF-2410-402): Lakshmi Agencies' two batches in the story |
| The agents | the architecture, then a condensed walk | the architecture in depth, then the walk in full (`parts5.AgentsWalk`): all nine stops at their own pace, the camera easing in on the walk's caption, a light on the agents at work, and a tracker of the stops. Each stop has its own sound, rising stop by stop; the yes has a riser, a low hit and a glint, then the three exits land at once, then Paperwork, Impact and a chime on "Sold, not binned" |
| What you'll see | three lines | Munchly's supply chain on a platform in depth (`parts5.MunchlyMap`). Munchly Foods ("our imaginary client"), then its four distributors (Patil Distributors in Pune with 52 kiranas, Rakesh Traders in Nagpur with 38, Lakshmi Agencies in Hyderabad with 58, Gupta & Sons in Indore with 47), packs running along each route. Their kiranas burst in, then the exits (destroyed, ExpireSoon, the staff sale, food banks). Last, the two batches: the happy path, the Mango Drink through Lakshmi Agencies to her kiranas, the staff sale and the food bank; the sad path, the Masala Chips through Rakesh Traders to two kiranas, ExpireSoon and destruction |
| The sign-ins | three windows | Priya's tablet in dark mode: the production workspace's sign-in captured frame-exact (`capture-signin.mjs`). The agents work behind it while her email is typed at a person's pace, and Sign in is pressed with the film's own pointer. The capture holds the Firebase request, so nothing is sent |
| The PWA | none | `parts5.InstallScene`: Chrome offers to install the workspace on Priya's laptop (the maintainer's screenshot of the prompt), its Next is pressed, and her window becomes the app's own. Then her laptop, Lakshmi Agencies' tablet and a kirana's phone, each with the app installed, and the app's own pushes landing on all three: "Its alerts arrive live, through Firebase Cloud Messaging" |
| The results | the result's figures | how the swing adds up, batch by batch (`parts5.SwingResult`), with the app's own sheet beside it. The bridge runs from the bin's P&L to the plan's, a bar at a time with its figure. The Mango Drink: −₹22,657 if destroyed, +₹15,778 the kirana scheme, +₹1,200 the staff sale, −₹61 the food bank, +₹5,277 not paid (hatched), −₹463 with the plan: a ₹22,194 swing. The Masala Chips: −₹26,330, +₹840, +₹10,862 ExpireSoon, +₹3,166 not paid, −₹11,462: a ₹14,868 swing |
| The packs | dark fringes on their edges | each pack drawn with its own alpha (`parts3.pack_sprite`) |
| Google Cloud | in the architecture only | said as it works (`g01`, `l01`, `m02`, `m03`, `m04`, `m09`, `m10`), each service named in the frame's foot as it is said (`parts5.TechTag`): Google ADK, Gemini on Vertex AI, Cloud SQL, Firebase Authentication, BigQuery, Gemini Flash, Gemini Pro, Pub/Sub, Cloud Storage |
| The voice | Maya1, a brisk corporate explainer | Maya1 described as a warm storytelling narrator, each line spoken whole, so its sentences flow into each other (see below) |
| The roadmap | a card mid-film | at the end, "What comes next" (`parts5.NextScene`): WhatsApp (an offer as a chat, and the shop's answer), more Indian languages (hello in seven scripts in turn, shaped by Chromium: `greetings.mjs`), native iOS and Android apps |
| The guided demo | a URL on the end card | "Try the guided demo": its landing page captured frame-exact (`capture-demo.mjs`), the route map and then its console line, with the film's pointer pressing Play. Beside it, smartclearance-demo.web.app and a QR code that opens it |
| The end card | the name and line centred, the URLs below | one left edge for the name, the line, the four URLs (two columns) and the footer, aligned by their ink (`parts5.EndCard5`) |

**Sound.** New synthesised sounds, all made in `mix.py`:

- the printer's feed per row and the stamp's thud;
- ticks and low hits on the map;
- the install prompt's click, the window's whoosh and three notifications;
- a tick per roadmap card;
- a glint as each Google service is named;
- the film's own pointer clicks;
- a tick per bar of the bridge, and the swing's hit.

The mix puts the voice about 12 dB over the bed (cut 4: 9). Under the voice, the bed's presence band (1.2 to 5 kHz)
goes about 20 dB down, and the airy sounds (whooshes, risers) about 15 dB. The duck looks 0.3 s ahead, so the bed is
already down as a line starts.

## The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown at dawn, every carton labelled; the sentence printed and stamped WRITTEN OFF; the dive into a carton's best-before, 22 days left; the bin |
| 0:14 | Smart-Clearance, over the live landing page |
| 0:26 | The architecture in depth, then the agents' walk in full, to the one human yes |
| 0:40 | Munchly Foods, its distributors, kiranas and exits, and the two batches |
| 0:53 | The console: a brand set up in minutes, then every client live |
| 1:07 | Everyone signs in (Priya's tablet in dark mode), then the workspace installed on every device |
| 1:20 | The Mango Drink: the alert, the label photo, the split, the yes, the offer in Hindi, the orders live, the scheme filling, the UPI staff sale, Feeding India and its receipt, the papers |
| 2:19 | How the Mango Drink's swing adds up, then Lakshmi Agencies' own portal |
| 2:31 | The Masala Chips: two shops order, the lot countered and sold, 540 left, destroyed on evidence, the certificate signed, Priya's second yes, the papers |
| 3:16 | How the chips' swing adds up |
| 3:26 | Impact's ledger, the year so far, and the batch's BRSR line |
| 3:36 | What comes next, then the guided demo to try, with its QR code |
| 3:49 | The end |

## How cut 5 is made

| Part | Tool | Where |
| --- | --- | --- |
| The cartons' labels | OpenCV and Pillow on cut 4's godown clip: each blank label found in every frame, tracked, its corners smoothed (a robust fit, carried past the frame's edge), and a shipper label multiplied in. No model was run | `src/cartons.py`; `media/o0-godown-aisle-labelled.mp4` with its sidecar |
| The voice | Maya1 (local). A bake-off of eight descriptions of the same voice, two seeds each, read whole (`tts/bake5.py`, `tts/sample5*.txt`), scored by UTMOS, pitch spread, pace and Whisper (`tts/score5.py`, `tts/bake5*/score.json`). The pick, "warm": a conversational storytelling narrator with an expressive delivery. Then 6 takes a line, 180 in all (`tts/vo5.py`), a mean UTMOS of 4.47, picked by Whisper's read-back (`tts/pick.py`): 28 of 30 lines word for word on their own (the other two write a figure or the URL differently) | `src/lines.json`, `src/tts/vo3/maya1w-warm/*.json` |
| The captures | Playwright on the virtual clock (`vclock.js`), frame-exact at 2×: Priya's dark sign-in on munchly-smartclearance.web.app (the Firebase request held, never answered) and the guided demo's landing page; the greetings shaped by Chromium | `src/capture-signin.mjs`, `src/capture-demo.mjs`, `src/greetings.mjs` |
| The new scenes | the frame compositor | `src/parts5.py` (`LabelPrint`, `AgentsWalk`, `MunchlyMap`, `InstallScene`, `SwingResult`, `NextScene`, `EndCard5`, `TechTag`, `Pointer`), `src/shots5.py` |
| The sound | synthesised in numpy; SC-187's Lyria bed reused | `src/mix.py` |

**Found while checking:**

- **The opening:**
  - on the new voice, the label lifted away before its last line and stamp. The opening now holds the stamp 0.7 s
    before the dive.
  - Between rows, the next row's letter tops showed under the label. It now rests between rows, and the print line
    follows the label's tilted foot.
- **The agents' walk:** its motion blur averaged frames across a caption change, so two captions ghosted. The blur now
  never reaches back past a stop's first frame.
- **Word cues:** a cue took the first word that begins with it, so "food" fired on "Foods" (the map's exits came 6 s
  early) and "1" on "10". Exact words now win (`parts.at`).
- **Windows:** the new voice tightened several shots, and eight windows played up to 2.1× (a hurried pointer). Each is
  trimmed to its own moment, so every window plays between 0.46× and 1.30× (the scheme's labelled fast-forward aside).
- **The stage's own marks:**
  - three of the recordings' chapter cards fell inside a window (the label photo's last beat, the portal, expiry day).
    The spans now end before them, or start after.
  - The stage's ring round the offer's price, inside the film's own ring, is painted out from a clean frame
    (`kit.RETOUCH`, `parts5._unring`).
  - The chips' sheet is taken from a moment before the stage rings it.
- **Layout:**
  - the install scene's tablet and phone now slide in beside the laptop as it draws back, never over it;
  - the Pub/Sub and Gemini Flash names sit clear of the windows;
  - the results' proof points sit clear of a service named in the foot;
  - "Every paper, drafted and signed." waits for the donation receipt to leave.
- **Rendering:**
  - "CO₂e" lost its subscript, which the brand fonts lack (it is drawn in SF Pro, as ₹ is);
  - a hatched bar only a few pixels tall crashed the renderer as it began to grow.
- **Intelligibility:** with the bed and a whip pan's whoosh under it, Whisper heard "batch" as "badge", which led to
  the mix changes above.

## The result

`media/smart-clearance-working-demo.mp4`: **3 min 56.2 s (236.20 s)**, under the 238 s cap. It is 1920 × 1080 at
25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dBTP true peak. Beside it are a 720p copy
and the narration as `.srt`. The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-14_13-46-56.mp4`
(git-ignored), beside cut 4 (`…_11-16-06`); an earlier export of cut 5 is kept as `…_13-37-58-superseded`.

- **Checks:**
  - every shot as stills at three moments, and every new scene frame by frame where it moves;
  - every window plays between 0.46× and 1.30× (the labelled fast-forward aside);
  - `cardscan.py` finds the stage's note-card green only in the app's own buttons. A scan for the stage's rings
    (bright green) found 29 runs; one, inside the film's own ring, is painted out. The rest are the stage's thin rings
    as cuts 3 and 4 carried them, or the app's own green;
  - a scan of the tablet windows for the stage's chapter cards: none left;
  - both QR codes read back from the film's own frames:
    - the guided demo's: `https://smartclearance-demo.web.app`;
    - the carton label's: `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024`;
  - the narration read back from the final mix, a slice a line: 24 of 30 lines word for word.
    - Two differ only in how they are written: "2.3 tons", and the URL as one word.
    - Two hear the brand as "Manchli" or "Munchli".
    - One reads "packs" as "bags" in its own slice, but as "packs" read with the line before it.
    - One reads "batch" as "badge" from one slice start, and as "batch" from another.
    - Each take reads word for word on its own.
  - −14.0 LUFS, −1.5 dBTP.
- **The spend:** nothing. Maya1, Whisper, UTMOS and Playwright ran on this Mac; no image or video model was run. The
  music is SC-187's.

## Rebuild

From `src/`. It needs cut 4's keyframes, clips and depth maps in place (SC-206's rebuild), and the recordings are read
from the main checkout:

```sh
.venv/bin/python cartons.py                                   # the godown's cartons labelled
node capture-signin.mjs build/signin-dark && node capture-demo.mjs build/demo-landing && node greetings.mjs
(cd tts && .venv-snac/bin/python bake5.py sample5w.txt bake5w/ --whole && .venv-snac/bin/python vo5.py 6)   # the bake-off (score5.py), then the takes; then mos.py and pick.py vo3/maya1w-warm
.venv/bin/python render.py && .venv/bin/python mix.py && ./export.sh
```
