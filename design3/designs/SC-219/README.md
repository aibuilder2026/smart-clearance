# SC-219 · The working demo, cuts 9 to 11

A demo film of about four minutes, made from the three production recordings of 13 Oct 2026, as cut 8 (SC-218) was:
cut 9 on the maintainer's notes on cut 8, cut 10 on four notes on cut 9, then cut 11 on three notes on cut 10. Each
joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its name;
`media/` holds the latest.

## Cut 12's concept round (15 Oct 2026)

On cut 11 the maintainer asked for the architecture scene (0:22.5 to 0:56) "more better and professional, think of
Google Cloud Data center", with "animations and motion effects", made in Remotion if useful, and to see three ideas
before anything is built. The rest of cut 11 stays as it is. Three concepts went on one board, `round-cut12/board.html`
(the request, cut 11's frames, each option's motion test with the real voice and two stills of its later beats, and how
they compare); `round-cut12/decision.md` records the pick.

- **A · The data hall:** live action with motion graphics: a real camera moves through a data centre (Qwen-Image
  plates, LTX camera moves), the stack laid onto the racks as each part is named, each graphic tracked to its rack.
- **B · The blueprint:** motion graphics: the data centre as one isometric floor plan in the brand's greens, built and
  lit in motion. Nothing generated.
- **C · Inside the machine:** a macro product film: fibres, server sleds, a TPU, a locked cage; each part set large.

The motion tests are a Remotion 4.0.535 project, `src/remo12/` (`A-DataHall`, `B-Blueprint`, `C-InsideMachine`, and
the stills). `src/prep12c.sh` rebuilds its media: the fonts, the app screens, the voice of the scene's first two
lines, the sounds (`sfx12c.py`, the film's own synths), the plates (`gen-qwen12c.sh`, `plates12c.py`), the camera
moves made to their shots (`gen-ltx12c.py`, `retime12c.sh`) and their tracks (`track12c.py`: Lucas-Kanade features
inside each rack, a homography a frame, ridden by the graphics as CSS `matrix3d`). `board12c.py` writes the board's
media.

## Cut 11 (15 Oct 2026)

Made from cut 10's pipeline, with the architecture drawn again in 2D (`src/arch11/`), and the bin and the close
re-timed.

### The brief

**The maintainer's notes on cut 10** (15 Oct 2026):

1. The bin's scene (its costs and the planet's) runs too fast.
2. The architecture (0:22 to 0:55): its storytelling and the parts shown, with their screens and notes, are fine, but
   the 3D animation is too much. Keep Smart-Clearance's green background theme, but in 2D motion animation, with sound
   effects, and surreal.
3. The last scene a bit condensed.

"Think hard and come up with best solution." The film stays inside cut 10's 238 to 239 s.

### What changed

| Part | Cut 10 | Cut 11 |
| --- | --- | --- |
| The bin | 1.2 s before the iris, its rows landing as fast as they could | **3.6 s.** The voice pauses 2.4 s after "it's destroyed". The four costs land 0.35 s apart, with a tick each; the GST credit is kept, struck out and taken back; the total rolls to −₹22,657 on a low hit; then the planet's four figures; and the whole holds about a second before the iris opens on the name |
| Under the hood | 3D: a lens (depth of field, streaks, motion blur), a letterbox, a camera that flew | **2D motion, surreal, 33.4 s (0:23 to 0:56)** (`arch11/`): the same story, parts, screens and notes on Smart-Clearance's green. The camera sinks through night clouds to a still lake under a huge, low moon, Google Cloud, whose cloud draws itself into the moon as the voice names it. Everything above the water is mirrored in it, rippled, and each part is a surreal object, below |
| The close | the card held 3.2 s after the last word | **1.2 s:** the card and its QR code are up within its first two seconds; 5.7 s in all |

**The parts, in the dreamscape:**

- **Firebase:** the four apps' own screens rise out of the water, each on a pillar of light, under a flickering flame.
- **Cloud Run:** a door stands in the lake, its rack of lights blinking faster as the apps' requests flow into it;
  Secret Manager's key hangs at its shoulder.
- **Cloud SQL:** stone tablets float up beside it, and a line is written on the top one as the voice says "record".
- **Pub/Sub:** three paper boats carry `batch.at_risk`, `journey.step` and `offer.received` along a lane of light on the
  horizon, and give their events to the agents as they rise.
- **Cloud Scheduler:** a clock drops onto the door's lintel and melts over its shoulder, following the arch, still
  ticking.
- **The agents:** nine lanterns rise out of their own reflections; the Watcher is a grey block of plain code.
- **BigQuery:** a cloud rains a bar chart onto the Watcher and the Valuer.
- **Cloud Storage:** a floating chest of drawers opens and hands Vision the label photo; Paperwork's papers fly back in.
- **Gemini:** a star is born from the moon and rises. Its light reaches the Valuer, the Router and the Negotiator in
  violet (Pro), then the six others in blue (Flash). The Watcher gets none.
- **The guardrails:** a coin rises, the money. The light reaches for it; a pane of glass drops between them and turns
  it away.
- **The API's figure:** the coin's light runs into the door, which glows amber as ₹16,917 is worked out.
- **The yes:** the plan's Approve sheet rises from the water; a tap, and an amber ring spreads across the lake, lighting
  each part as it passes, as the camera pulls back over the whole dreamscape.

**Motion:** a 2D pan and zoom, with parallax (the moon and the stars move less); the long moves ease out wide mid-move;
a light motion blur only while the camera moves.

**Sound:** each part has its own. A drop of water as something rises out of the lake; a woody knock for each tablet;
a pen's scratch on the record; a glass bell for each boat; a sagging tone for the melting clock; a kalimba's note for
each lantern, up the pentatonic scale, and two dry digital blips for the Watcher; a rain of soft drops; a drawer; a
cluster of bells for the star; a glass note for each ray, lower for Pro; a coin's ring; a glassy chime as the glass
lands; the API's climbing ticks; the yes's swell.

The notes, the act titles and the parts' index along the foot are cut 10's.

### The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown, the label's date, the bin and its cost |
| 0:12 | Agentic software as a service for the FMCG supply chain |
| 0:23 | Under the hood, in 2D: all on Google Cloud; nine AI agents and two Gemini models; the guardrails and a person's yes |
| 0:56 | The live demo: Munchly Foods, an imaginary brand; two batches, two distributors, two paths |
| 1:06 | The console: a brand set up in minutes |
| 1:15 | The workspace installs as an app on any laptop, tablet or phone |
| 1:21 | Priya signs in, live |
| 1:27 | Her Command Center tracks every batch at risk; the Watcher flags two |
| 1:43 | The happy path, Munchly Mango Drink with Lakshmi Agencies |
| 2:40 | The sad path, Munchly Masala Chips with Rakesh Traders |
| 3:29 | On the record: the audit trail and one trace |
| 3:40 | How the chips' swing adds up |
| 3:47 | Impact's ledger, ready for BRSR |
| 3:53 | The close: the guided demo |

### How cut 11 is made

| Part | Tool | Where |
| --- | --- | --- |
| The architecture | a 2D canvas drawn frame-exact on the voice's cues, captured frame by frame. Parallax layers, a rippled mirror pass for the lake, motion blur from sub-frames while the camera moves, and the notes, labels and index in HTML | `src/arch11/` |
| The bin | cut 10's shot, with a pause after the line and the cost stack's own pace | `src/shots11.py`, `src/parts6.py` |
| The close | cut 9's card, held 1.2 s after the last word | `src/parts.py` (`HOLD`) |
| The sound | cut 10's mix, with the dreamscape's own synths (`DREAM_SOUND`) | `src/mix11.py` |
| The rest | cut 10's pages and parts, re-timed | `src/render11.py`, `src/capture11.sh`, `src/export11.sh` |

**Found while making it:**

- **The first clouds were a white wall:** they are night clouds now, a dim body with moonlit tops.
- **The paper boats read as sparkles** and lingered under the lanterns. They are larger now, paper-white with their
  folds, and they give their events to the agents as the lanterns rise.
- **The melting clock smeared into a glow:** each of its strips drew its own glow. One glow sits behind it now.
- **The long moves** (the clock to the agents, the apps to the door, the guardrails back to the door) crossed about
  1,700 px a second, and the motion blur smeared whole frames. They take longer now, ease out wide mid-move, and the
  shutter is lighter.
- **The three boats launched on top of each other**, their events overlapping; and the Cloud Storage note covered the
  chest.

### The result

`media/smart-clearance-working-demo.mp4`: **3 min 58.9 s (238.92 s)**, inside the 238 to 239 s.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dB true peak.
- Beside it are a 720p copy and the narration as `.srt`.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-15_21-40-01.mp4` (git-ignored), with its 720p
  copy, a light preview and the captions.

**Checks:**

- the 2D scene played through at two frames a second and its long moves at five; the bin, the close and the first minute
  in the finished film at one a second;
- the six architecture lines read back from the final mix over the new sounds, word for word, and "date" in the opening's
  second line;
- all 5,973 frames scanned for a one-frame flash: none (`flash11.py`);
- every window plays between 0.67× and 1.21×, apart from the two labelled fast-forwards and the Masala Chips' card,
  held as a still;
- the recordings' own stage marks: none; the scan's 196 hits are the apps' own buttons, as in cut 10 (`cardscan11.py`);
- both codes read back from the film's own frames;
- the narration read back from the final mix by Whisper, a slice a line (`readback11.py`): 29 of 33 word for word, the
  same four spellings as cut 10.

**The spend:** nothing. Maya1's takes were cut 10's; Whisper, Chromium and ffmpeg ran on this Mac; no image, video or
paid model was called. The music is SC-187's.

## Cut 10 (15 Oct 2026)

Made from cut 9's pipeline, with three scene pages built again and captured frame by frame on the voice's own words:
`src/arch10/` (the architecture, as a film), `src/cast10/` (the use cases) and `src/saas10/` (what it is, with the
Watcher in code). The install is cut 9's (`src/pwa9/`).

### The brief

**The maintainer's notes on cut 9** (15 Oct 2026):

1. The architecture (0:30 to 1:00) looks good, but refine it more: every component properly highlighted, and the
   animation and motion really cinematic, like a film.
2. The use cases (1:00 to 1:05): say that Munchly Foods is an imaginary company, and that we picked two batches with
   two different distributors; at most 7 to 10 seconds.
3. "Live", in "Live on production", was said wrong.
4. The first 15 seconds sped up to 10, and the time given to the application's walkthrough.

"Think hard and use best of the best cinematic, animation and motion effects." The film runs at least 238 and at most
239 seconds.

**Then, while it was being made:** "Video should mention 9 AI agents, Watcher is a normal coding agent".

### What changed

| Part | Cut 9 | Cut 10 |
| --- | --- | --- |
| The opening | 0:00 to 0:13: the godown, the label's date, the bin and its costs | **10.1 s**, the same three shots, faster. The second line is shorter ("Too close to its date for quick commerce, it's destroyed."); the GST credit taken back is shown, not said. Every figure lands before its shot cuts: the statement's ₹22,657 rolls in on "too", the countdown runs from 60 to 22 days in 0.7 s, the bin's four costs come in a beat apart (the GST credit kept, struck out, then taken back) with the planet's four figures beside them, and the iris opens on the name as the voice says it |
| Under the hood | 33.8 s, 0:24 to 0:58: a lit 3D scene the camera flew through | **33.7 s, 0:20 to 0:54**, built again as a film (`arch10/`). **A lens:** depth of field on the camera's target (a bokeh pass over a depth pre-pass), anamorphic streaks on the lights, bloom, motion blur from 1 to 14 sub-frames a frame (a 180° shutter, as many as the move needs), ACES tone mapping, a touch of chromatic aberration and lens ghosts, a grade, a vignette and grain. **A 2.39:1 letterbox:** the act's title in the top bar (1/3 All on Google Cloud; 2/3 Nine AI agents, two Gemini models; 3/3 The models never touch the money) and the stack's parts in the bottom bar, each lit as the voice names it. **Every component highlighted:** as the voice names it, a light comes down on it, a ring pulses under it, the rest of the platform dims, and a callout beside it, on a leader line, says what it does here, with its real names: Firebase's four apps, backend-api on Cloud Run, Cloud SQL, Pub/Sub, Cloud Scheduler, the agents, BigQuery, Cloud Storage, Gemini on Google's Agent Platform (formerly Vertex AI), Pro, Flash, the shield, the API's ₹16,917 and the person's yes. **The camera** flies a keyed path with roll and lens changes, and Gemini's core wakes as it is named. **Its sound:** a whoosh under each move, a rise into the last shot, an impact as the platform lights |
| The use cases | 8 s: "Two batches. Two paths." | **9.7 s** (`cast10/`). "Live, on production." large, then the camera pushes through it onto Munchly Foods' card, stamped "Imaginary brand · fictional data" as the voice says "imaginary". The card moves into a tree as the header says "Two batches. Two distributors. Two paths.": the Mango Drink (MF-2410-118) at Lakshmi Agencies in Hyderabad and the Masala Chips (MF-2409-117) at Rakesh Traders in Nagpur, each with its godown and kiranas, then each path with its people and how it ended: Sri Lakshmi Ganapathi Kirana, the godown's staff and Feeding India, ₹16,917 recovered; Shree Ganesh Kirana, Agrawal Wholesale and Orange City Enviro, ₹11,702 recovered and 540 packs destroyed with proof. A light runs each lane |
| "Live" | x01, "Now, live on production", said as the verb (/lɪv/) | x24, "Live on production: Munchly Foods, an imaginary brand, with two batches at two different distributors. One happy path, one sad." Maya1 is given "Lyve", and the take is kept only once its vowel measures as /aɪ/ (`tts/vowel.py`) and Whisper reads it as "Live" |
| Nine AI agents | "Ten agents" | **Nine AI agents, and the Watcher in plain code.** The voice says it (u17); the architecture's act and callout say it, its Watcher stands in a grey "plain code" tier with no beam from Gemini; what it is says "Nine AI agents, and the Watcher in plain code, at every step"; the Command Center's head reads "Watcher · plain code · no AI model"; the close reads "Nine AI agents, one yes, and nothing good goes to waste." |
| Gemini | "Gemini on Vertex AI thinks for them" | u18, "On Google's Agent Platform, Gemini Pro prices and negotiates, and Flash reads and writes.", the new name (SC-220) |
| The walkthrough | 2 min 43 s, from the console to the close | **2 min 47.5 s**: the console, the offer, the donation, the lot, the signing and the papers each hold longer |

**Only realistic photographs and footage**, as in cut 9: the use cases are the people's portraits, the work's
photographs and the packs; the architecture is a technical scene, not an illustration.

**The voice.** Four lines are new (Maya1, six takes each): i13, the opening's second line; u17 and u18, the agents and
Gemini; x24, the use cases. Three lines keep the take whose consonants still read with the music under it: i13
("date"), u18 ("prices") and m08 ("packs"). Each read right on its own, but Whisper heard "state", "prizes" and "bags"
once the bed was under the take first kept, so every take of the three was voiced over the bed at its place in the film.

### The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown, the label's date, the bin and its cost |
| 0:10 | Agentic software as a service for the FMCG supply chain |
| 0:20 | Under the hood: all on Google Cloud; nine AI agents and two Gemini models; the guardrails and a person's yes |
| 0:54 | The live demo: Munchly Foods, an imaginary brand; two batches, two distributors, two paths |
| 1:04 | The console: a brand set up in minutes |
| 1:13 | The workspace installs as an app on any laptop, tablet or phone |
| 1:19 | Priya signs in, live |
| 1:25 | Her Command Center tracks every batch at risk; the Watcher flags two |
| 1:41 | The happy path, Munchly Mango Drink with Lakshmi Agencies |
| 2:38 | The sad path, Munchly Masala Chips with Rakesh Traders |
| 3:27 | On the record: the audit trail and one trace |
| 3:37 | How the chips' swing adds up |
| 3:45 | Impact's ledger, ready for BRSR |
| 3:51 | The close: the guided demo |

### How cut 10 is made

| Part | Tool | Where |
| --- | --- | --- |
| The opening | cut 9's shots, re-timed; the cost stack's pace | `src/shots10.py`, `src/parts6.py` |
| The architecture | three.js 0.170 (from SC-210's eco) with its own passes: a bokeh depth of field over a depth pre-pass, anamorphic streaks, bloom, motion blur by sub-frame accumulation and a lens pass; WebGL in headless Chromium on the GPU, HTML callouts at each part's projected place | `src/arch10/` |
| The use cases | an HTML page drawn frame by frame | `src/cast10/` |
| What it is | cut 9's page, with the Watcher in code | `src/saas10/` |
| The pages' photographs | cut 9's, copied | `src/prep10.py` |
| The captures | `capture-page.mjs` on each page's cues, which `shots10.py` writes | `src/capture10.sh` |
| The walkthrough | cut 9's parts, re-timed | `src/shots10.py`, `src/render10.py` |
| The sound | cut 9's mix with the architecture's moves, its rise and impact, and the use cases' stamp | `src/mix10.py` |
| The voice | Maya1 (local), "live" checked by its formants | `src/lines.json`, `src/tts/`, `src/run10v.sh`, `src/tts/vowel.py` |

**Found while making it:**

- **Black frames in the 3D scene:** `pow()` of a negative number is NaN on Metal, and the bloom spread one into a whole
  black frame; the spotlights' cone shader clamps before each `pow()`.
- **The camera flew through the Pub/Sub ring** three times (from the clock to the agents, from the agents to BigQuery,
  and from Gemini's close-up to Pro). With motion blur, the ring's glow washed those frames out green-white, up to 28%
  of the frame clipped. Every additive light now fades within 2.4 units of the lens, as a real lens loses what passes
  it; the nearest framed part sits 5 units off, so nothing else changes. The clock also keeps its close-up's softer
  light while the camera is near it.
- **An empty moment** before the brand card arrived (0.3 s): the title now pushes through onto the card.
- **The opening's figures** landed just as their shots cut, and the bin's were complete only 0.3 s before the iris.
- **"Lyve"** still came out short in 2 of 6 takes, so each take's vowel was measured.
- **Three words misheard under the music**, above.

### The result

**3 min 58.8 s (238.80 s)**, inside the 238 to 239 s asked for.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.4 dB true peak.
- Beside it are a 720p copy and the narration as `.srt`.
- Its crf-21 copies and captions were in `media/` until cut 11 replaced them.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-15_20-34-52.mp4` (git-ignored), with its 720p
  copy, a light preview and the captions. Two earlier exports of cut 10 are kept there as `…-superseded` (`…_20-17-10`,
  `…_20-25-57`).

**Checks:**

- the opening, the architecture and the use cases as stills and at 5 to 25 frames a second through each move, and the
  whole film at about one frame a second;
- the architecture scanned frame by frame for a burst of light: none left (the bright frames are the Approve sheet's
  and the console's own white screens);
- all 5,970 frames scanned for a frame that differs from both its neighbours while they match each other: none
  (`flash10.py`);
- every window plays between 0.67× and 1.21×, apart from the two labelled fast-forwards (the scheme filling, 34×; the
  signing, 22×) and the Masala Chips' card, held as a still;
- the recordings' own stage marks: none. The scan's 196 hits are the apps' own green buttons, a phone's dark card and
  the label photo (`cardscan10.py`);
- both codes read back from the film's own frames: the carton label's
  `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024` and the guided demo's
  `https://smartclearance-demo.web.app`;
- the narration read back from the final mix by Whisper, a slice a line (`readback10.py`): 29 of 33 word for word. One
  slice writes Pub/Sub as "PupSup" (sliced at the line's own edges, the voice and the mix both read "PubSub"), one hears
  the brand as "Manchli", one writes the URL as one word, and b91's slice heard "Argentic" (from its own slice it reads
  "Agentic");
- "Live" in x24: its vowel opens as /aɪ/ does (F1's 90th percentile 868 Hz, against 874 Hz for the "live" m05 says
  right), and Whisper reads "Live";
- the opening is over at 0:10.1, the architecture runs 33.7 s (0:20 to 0:54), and the use cases are on screen 9.7 s.

**The spend:** nothing. Maya1, Whisper, UTMOS, Chromium (three.js on the GPU) and ffmpeg ran on this Mac; no image, video
or paid model was called. The music is SC-187's.

## Cut 9 (15 Oct 2026)

Cut 9 of the demo film, after SC-218's cut 8. It follows the maintainer's notes on cut 8, and is made from:

- the same three production recordings of 13 Oct 2026;
- cut 8's pipeline and media (SC-218);
- four scene pages captured frame by frame on the voice's own words:
  - `src/saas9/`, what it is (new);
  - `src/arch9/`, the architecture in 3D (new);
  - `src/cast9/`, the two paths and the people (new);
  - `src/pwa9/`, the install, faster.

### The brief

**The maintainer's notes on cut 8** (15 Oct 2026):

1. The progressive web app part shown a little faster.
2. Before the demo starts, show quickly that it covers a happy path and a sad path, and everyone in them, in a lively,
   animated way.
3. The scenes where each brand gets its own workspace condensed. They should make the point that Smart-Clearance is an
   agentic SaaS product for retailers and the FMCG supply chain, with animations and backgrounds that suit it, and look
   really aesthetic.
4. The architecture (0:30 to 1:20 in cut 8): the content is right. Rethink its animation, motion, lighting and camera
   to make it more immersive, and cut it to between 30 and under 60 seconds.
5. Show how Supply Chain tracks the batches at risk from the Command Center.
6. The overlap at the impact shot fixed.
7. The close's QR code on the right.

The film runs at least 235 and at most 238 seconds, with special care on the screen transitions.

**Then, while it was being made:**

- "Make sure we show a live sign in to the application for Supply chain persona".
- "Only use realistic photos and videos, no cartoons please".

### What changed

| Part | Cut 8 | Cut 9 |
| --- | --- | --- |
| What it is | the name, then three brands' factories one after another, each with its workspace (12.7 s) | **11.3 s, one composition** (`saas9/`), on photographs of the work. The name turns the bin's −₹22,657 into the plan's ₹16,917 recovered, then rises to a header over **"Agentic software as a service · For the FMCG supply chain."** Each brand's own workspace address lines up as the voice says "service". The supply chain's three tiers arrive as the voice names them, each a photograph in a glass card with the agents that help it: brands (a packing line), distributors (a godown counter), retailers and kiranas (a delivery at a kirana's counter). The ten agents ride the route that joins them. The background is the distributor's godown, out of focus and graded down |
| Under the hood | a tilted blueprint of the platform the camera travelled, then four panels for one model call (50.8 s, 0:26 to 1:17) | **33.8 s, 0:24 to 0:58**, the same content, built again as a lit 3D scene (three.js) that the camera flies through (`arch9/`). The platform first appears as a faint blueprint under a scan of light; then each part powers on as the voice names it. **The apps:** the four apps' own screens on the Firebase deck. **The API layer:** backend-api on Cloud Run, a server with rack lights that blink as requests land, with Secret Manager and Cloud SQL beside it. **Pub/Sub:** a ring of light carrying the topics, with Cloud Scheduler's clock ticking on it. **The agents:** ten agent pods with their icons, fed by BigQuery and Cloud Storage (the label photo flies to Vision). **Gemini:** on Vertex AI, a core at the heart, lighting each agent's tier as the voice names Pro and Flash. **The guardrails:** a shield the reserve never crosses, the API's own ₹16,917 and its checks, structured output with its fallback, then a person's yes on the plan's real Approve sheet, which lights the whole platform. The scene has soft light shafts, dust, a mirror floor and bloom on the light, with labels set as HTML so they stay crisp. The content is cut 8's, said in fewer words (t02 to t06 become u02 to u06) |
| The live demo, introduced | — | **8 s** (`cast9/`) before the console: "Two batches. Two paths." The Mango Drink's happy path and the Masala Chips' sad path, each from its pack. Each person arrives, in the order they act, as a photograph on the lane: Priya, Lakshmi Agencies, Sri Lakshmi Ganapathi Kirana, the godown's staff and Meera of Feeding India; then Rakesh Traders, Shree Ganesh Kirana, Agrawal Wholesale, the agency's officer and witnesses, and Priya again. A light runs each lane, each path's outcome lands, and Neha's console sits beside both |
| The install | 7.7 s | **5.6 s**: the same scene with its steps closer together (`pwa9/`), and a shorter line |
| Priya signs in | — | **5.7 s, live on production** (the mango recording): her email typed, the password, Sign in pressed, the button signing in, "Welcome, Priya", then "Good afternoon, Priya" as her workspace opens. Beside it, the steps under the hood: her tablet, Firebase Authentication, an ID token, backend-api checking her role, her Command Center |
| The Command Center | the Watcher's alert on Priya's screen (9.5 s) | **16.1 s**, the sad recording's Command Center. **The watchlist:** both batches at risk and the gated ones selling through, with a panel of what it tracks for every batch, each row lit as the voice names it (days left, sell-through, quick-commerce gates, the cost of the bin), and ₹48,987 at stake if both are destroyed. **The pushes:** the Watcher's two pushes landing in her screen, in Hinglish, then held up beside it. **The flagged batches:** the Mango Drink's card (22 days, −₹22,657), then the Masala Chips' (47 days, −₹26,330) |
| The agents' heads | the Verify and staff-sale shots opened on "Priya · Approve" | each opens on the agent at work (Vision); "you" is Priya only where she acts |
| The impact shot | BigQuery's badge lay over the "Ready for BRSR" card | the card sits under the food panel and the badge under the card |
| The close | the QR code at the top right, over the line | the mark, the name, the line and the addresses move left; the guided demo's QR code has a column of its own at the right, with its kicker over it and its address under it; the card holds 3.2 s after the last word |
| Transitions | pushes, one wipe, cuts | each cut chosen for its join. An **iris** (the brand's squircle opening onto what it is) into the product, a **rise** under the hood, **pushes** between people, a **cut** from the sign-in's splash to the Command Center (the same screen goes on), and cut 8's wipe into the sad path. None blurs; the iris has a thin light rim |

**Only realistic photographs and footage:** the people's portraits and their scenes, the work's photographs, the
recordings and the apps' own screens. The architecture is a technical scene, not an illustration.

**The voice.** Eleven lines are new, each read back word for word and picked for naturalness (Maya1, six takes each):

- b91, the product;
- u02 to u06, the architecture in fewer words;
- x01, the live demo;
- p02, the install;
- q01 to q03, the sign-in, the Command Center and the Watcher's flags.

m02 is gone.

### The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown, the label's date, the bin and its cost |
| 0:13 | Agentic software as a service for the FMCG supply chain |
| 0:24 | Under the hood: all on Google Cloud; ten agents and two Gemini models; the guardrails and a person's yes |
| 0:58 | The live demo: two batches, two paths, and the people in them |
| 1:06 | The console: a brand set up in minutes |
| 1:15 | The workspace installs as an app on any laptop, tablet or phone |
| 1:21 | Priya signs in, live |
| 1:27 | Her Command Center tracks every batch at risk; the Watcher flags two |
| 1:43 | The happy path, Munchly Mango Drink with Lakshmi Agencies |
| 2:38 | The sad path, Munchly Masala Chips with Rakesh Traders |
| 3:25 | On the record: the audit trail and one trace |
| 3:35 | How the chips' swing adds up |
| 3:42 | Impact's ledger, ready for BRSR |
| 3:49 | The close: the guided demo |

### How cut 9 is made

| Part | Tool | Where |
| --- | --- | --- |
| What it is | an HTML page drawn frame by frame on the narration's words, its photographs decoded before each frame | `src/saas9/` |
| The architecture | three.js (from SC-210's eco), WebGL in headless Chromium on the GPU, HTML labels at each part's projected place | `src/arch9/` |
| The cast | an HTML page drawn frame by frame | `src/cast9/` |
| The install | SC-211's scene, tightened | `src/pwa9/` |
| The pages' photographs | cut from their sources and written as WebP: the keyframes (each sidecar is with the WebP its cut shipped, in SC-205, SC-206 and SC-208), the people's portraits, SC-154's hero film, the recordings and the label photo | `src/prep9.py` |
| The captures | `capture-page.mjs` on each page's cues, which `shots9.py` writes | `src/capture9.sh` |
| The walkthrough | cut 8's parts with cut 9's (`EndCard9`, `TrackList`) | `src/parts9.py`, `src/shots9.py`, `src/render9.py` |
| The sound | cut 8's mix with the pages' events, the iris and the rise | `src/mix9.py` |
| The voice | Maya1 (local) | `src/lines.json`, `src/tts/`, `src/run9v.sh` |

**Found while making it:**

- **Black boxes in the 3D scene:** GLSL's `pow(x, 2.0)` is undefined for a negative x, and Metal returns NaN; the
  Gemini core's `1 − dot(n, v)` could also come out a hair below zero. The bloom spread each NaN into a black
  rectangle. Every such square is now written out, and the dot product clamped.
- **Parts that hid what was behind them:** transparent meshes at zero opacity still wrote depth. Fading parts are now
  hidden until they show, and glass never writes depth. The floor's dark edge was also sorted by its centre, so it
  painted over the agents near the horizon; it is now drawn first.
- **A wash of light over the scene:** the app screens were bright enough to trip the bloom, and one halo was sized to the
  21.5-unit deck. Only light pushed past white blooms now, and halos are capped.
- **Rounded boxes have no edges to outline**, so the slabs are outlined with a box's edges.
- **The Masala Chips' card is clean in the recording only from 115.95 to 116.1 s**, before the stage's own card dims
  it, so it is held there as a still.

### The result

**3 min 56.3 s (236.32 s)**, inside the 235 to 238 s asked for.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dB true peak.
- Its crf-21 1080p and 720p copies and its captions were in `media/` until cut 10 replaced them.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-15_18-53-48.mp4` (git-ignored), with its 720p
  copy, a light preview and the captions, beside cut 8 (`…_16-44-16`).

**Checks:**

- every new beat as stills, each transition at a quarter, half and three quarters through, and the whole film at about one
  frame a second;
- all 5,908 frames scanned for a frame that differs from both its neighbours while they match each other: none
  (`flash9.py`);
- every window plays between 0.67× and 1.4×, apart from the two labelled fast-forwards (the scheme filling, 34×; the
  signing, 22×) and the Masala Chips' card, held as a still;
- the recordings' own stage marks: none in the new beats. The scan's hits are the apps' own green buttons and the label
  photo's colours (`cardscan9.py`);
- both codes read back from the film's own frames: the carton label's
  `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024` (and its EAN-13) and the guided demo's
  `https://smartclearance-demo.web.app`;
- the narration read back from the final mix by Whisper, a slice a line (`readback9.py`): 28 of 33 word for word. One
  slice writes "PubSub" as one word, two hear the brand as "Manchli", one writes the URL as one word, and m08's slice
  catches the end of the line before it. b91's first slice heard "Argentic"; from its own slice it reads "Agentic";
- the architecture is 33.8 s long and over at 0:58; the install is 5.6 s;
- the film was captured from JPEG copies of the pages' photographs, which ship as the WebP `prep9.py` makes from their
  sources: on them the pages draw within a mean of 0.6 of 255 of the film's own captures.

**The spend:** nothing. Maya1, Whisper, UTMOS, Chromium (three.js on the GPU) and ffmpeg ran on this Mac; no image, video
or paid model was called. The music is SC-187's.

## Rebuild

From `src/`. It needs cut 8's media in place (SC-218's rebuild, which needs the earlier cuts'), and reads the
recordings from the main checkout. `lines.json` and the voice's picks now hold cut 11's narration (cut 10's takes, with its
gaps and hold); cut 9's are at its commit, `3d7eaa6b`, and cut 10's at `dc391d62`. Cut 9:

```sh
node icons.mjs && node icons8.mjs && node icons9.mjs && node render-pushes.mjs 380 460   # the icons and the pushes
./run9v.sh                                                                          # the new lines' takes, then the pick
.venv/bin/python prep9.py                                                           # the pages' photographs
./capture9.sh                                                                       # the four scene pages, on the voice's cues
.venv/bin/python render9.py && .venv/bin/python mix9.py && ./export9.sh
node qrcheck9.mjs ../media/smart-clearance-working-demo.mp4 8.4 233                  # the codes, read back
```

Cut 10, after cut 9's steps (its pages' three.js comes from SC-210's eco by a link, as arch9's does):

```sh
ln -s ../../../SC-210/src/eco/node_modules arch10/node_modules
./run10v.sh                                                                         # the new lines' takes, then the pick
.venv/bin/python tts/vowel.py x24-3.wav:Live m05-2.wav:live                         # how each "live" is said
.venv/bin/python prep10.py                                                          # cut 9's photographs, for cut 10's pages
./capture10.sh                                                                      # the four scene pages, on the voice's cues
.venv/bin/python render10.py && .venv/bin/python mix10.py && ./export10.sh
node qrcheck10.mjs ../media/smart-clearance-working-demo.mp4 7.6 233.5              # the codes, read back
```

Cut 11, after cut 10's steps (its architecture is a plain 2D page: no three.js):

```sh
.venv/bin/python prep10.py                                                          # cut 9's photographs, for arch11/ too
./capture11.sh                                                                      # the four scene pages, arch11/ among them
.venv/bin/python render11.py && .venv/bin/python mix11.py && ./export11.sh
node qrcheck11.mjs ../media/smart-clearance-working-demo.mp4 7.6 235                # the codes, read back
```
