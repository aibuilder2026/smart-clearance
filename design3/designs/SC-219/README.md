# SC-219 · The working demo, cut 9

Cut 9 of the demo film, after SC-218's cut 8. It follows the maintainer's notes on cut 8, and is made from:

- the same three production recordings of 13 Oct 2026;
- cut 8's pipeline and media (SC-218);
- four scene pages captured frame by frame on the voice's own words:
  - `src/saas9/`, what it is (new);
  - `src/arch9/`, the architecture in 3D (new);
  - `src/cast9/`, the two paths and the people (new);
  - `src/pwa9/`, the install scene, faster.

It joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its name.

## The brief

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

## What changed

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

## The film

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

## How cut 9 is made

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

## The result

`media/smart-clearance-working-demo.mp4`: **3 min 56.3 s (236.32 s)**, inside the 235 to 238 s asked for.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dB true peak.
- Beside it are a 720p copy and the narration as `.srt`.
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
recordings from the main checkout:

```sh
node icons.mjs && node icons8.mjs && node icons9.mjs && node render-pushes.mjs 380 460   # the icons and the pushes
./run9v.sh                                                                          # the new lines' takes, then the pick
.venv/bin/python prep9.py                                                           # the pages' photographs
./capture9.sh                                                                       # the four scene pages, on the voice's cues
.venv/bin/python render9.py && .venv/bin/python mix9.py && ./export9.sh
node qrcheck9.mjs ../media/smart-clearance-working-demo.mp4 8.4 233                  # the codes, read back
```
