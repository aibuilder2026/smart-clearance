# SC-219 · The working demo, cuts 9 to 16

A demo film of about four minutes, made from the three production recordings of 13 Oct 2026, as cut 8 (SC-218) was:
cut 9 on the maintainer's notes on cut 8, cut 10 on four notes on cut 9, cut 11 on three notes on cut 10, then cut 12
on a new architecture scene, after a concept round, cut 13 on cut 10's 3D architecture made whole, with the app
beside each part, and cut 14 on Google's own logos, a chip and a bracket on each part, and the four apps on their
screens, then cut 15 (SC-225) on the demo's cast, the landing page and Munchly's workspace address, and cut 16 (SC-227)
on a review of cut 15. Each
joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its name;
`media/` holds the latest.

## Cut 16 (16 Oct 2026, SC-227)

Six notes on cut 15, inside the same strict 240 s.

### The brief

On cut 15's export (`…_2026-10-16_10-55-33`), the maintainer's review:

1. "The place where it says Cloud SQL as the record, then there is some break which is forsure transition issue."
2. "When we are showing the Demo Setup, explain that we are going to demo a happy path and sad path starting like
   'Today we are going to demo ...' -- make the narration more realistic and engaging."
3. "When Neha opens console and shows around, can we make it show Munchly Food workspace on console?"
4. "The destruction signing certificate takes about 4 seconds, can we speed it up and make it 2.5 seconds?"
5. The "For the FMCG supply chain" scene (brands, distributors, retailers): "can we make it under 4 seconds."
6. "All scenes must have really good transition effects to another scenes, I see some dont have any, especially the
   1st 2 scenes."

"Time limit is 240 seconds... please ensure no scene seems rushed and there are no glitches and all have really good
professional transition effects."

### What changed

- **The break after "Cloud SQL as the record"** (`src/arch13/`): at the hand-over from Cloud SQL to Pub/Sub both windows
  swapped on one frame, ghosting through each other, while the camera made the scene's fastest move, 0.6 s, from the
  bright API to the dark bus; the frame's light fell from 74 to 31 in three frames. Now the record's bright window fades
  evenly over 0.46 s while it slides away (a panel's new `fadeOut`, `vig.js`), the bus's window lands only after it has
  gone, and the camera takes a full second for the move; the light falls over 0.6 s, the largest change between two
  frames 23 where it was 34.
- **The demo setup,** a new line: "Today, we're going to demo two journeys, live on production: Munchly Foods, an
  imaginary brand, with two batches at two distributors. One happy path, and one sad." (Maya1, six takes; take 1, read
  back word for word, UTMOS 4.54, 12.2 s). The cast page's title reads "Two journeys, live on production." and lands as
  the line begins (`src/cast16/`).
- **Munchly Foods in the console,** on SC-226's production run of 16 Oct (`admin-console-e2e-prod-2026-10-16_10-14-51`;
  the 13 Oct walk the console and the landing page were built on is no longer on disk): the clients with Munchly's row
  ringed, Munchly opened with its address ringed, its first stock export with 8 of 8 fields mapped, its people and the
  invitation, its SKUs' Blinkit and Zepto gates, its agents and the Negotiator's autonomy; the address bar follows to
  `/clients/munchly`, and the SaaS card names munchly-smartclearance.web.app. The landing page is on the same run: the
  hero held with the pointer resting on Workspace while it is explained, then the pointer glides to Console and
  presses it, the console opens, Sign in, "Welcome, Neha". Every span was scanned for the stage's rings, dimming and
  chapter cards, and none shows.
- **The signing in 2.5 s:** one labelled fast-forward (20x) from the officer's blank pad to all four signed, the
  officer's strokes given 0.85 s so they read as drawn, the three after him 1.65 s; the photos and the certificate
  before it play at about their own pace, and the shot is 0.6 s shorter.
- **The SaaS line's scene in 3.85 s:** the shorter line "Agentic software as a service for FMCG." (cut 15's take 3);
  the workspaces on "software", the heading 0.7 s after, the three tiers lit a third of a second apart, held before the
  architecture rises. Its 1.5 s of near-empty frame is gone.
- **A transition into every scene** (`render13.py`): the godown to the label is a zoom-through, the camera rushing into
  the near stack's carton with the light rising, the label landing out of it; the label to the bin is a pull, the label
  shrinking into a card that drops into the trail of cartons, a shadow under it and a light rim; the two cuts in
  Priya's room (her sign-in to her Command Center, the orders to the scheme filling) are wipes with the light line.
  Each has its sound (`mix13.py`), and the opening's swell lands on the zoom's flash. Only the film's first frame fades
  in from black.

### Found

- The 13 Oct recordings were missing from `playwright-automation-videos/`; the maintainer restored the Mango and chips
  runs, and the console and the landing page moved to the 16 Oct admin run.
- The SaaS scene's ₹16,699 is a frame mid-roll from −₹22,657 to ₹16,917, not a figure.

### The result

- 3 min 59.3 s (239.32 s); −14.0 LUFS, −1.5 dB true peak.
- No one-frame flash in its 5,983 frames; every window within its speed limits apart from the labelled fast-forwards
  (the scheme filling, 34x; the signing, 20x).
- The stage-mark scan: no hit in the new console footage; the landing page's are its dark hero and the console's green
  Sign in button, as in cut 15.
- Both QR codes read back (7.4 s and 238.8 s).
- 30 of 34 lines word for word; the new line reads "we are" for "we're", and the rest are the known ones.
- `working-demo/smart-clearance-working-demo-2026-10-16_13-00-26.mp4` (crf 17), its 720p copy, a light preview, the changed scenes
  on their own (`…-changes.mp4`) and captions; the crf-21 copies in `media/`.

**The spend:** nothing. Maya1, Whisper, UTMOS, Chromium and ffmpeg ran on this Mac.

## Cut 15 (16 Oct 2026, SC-225)

Priya and Neha in the demo's cast, a new scene on the landing page, and Munchly's workspace address said and shown,
inside 240 s.

### The brief

On cut 14's export (`…_2026-10-16_09-46-36`), the maintainer's last changes:

1. "Scene where you are explaining the demo setup, show the character of Priya and Neha too, they are missing."
2. "There should be a scene where the landing page is shown and the console and workspace buttons explained briefly.
   From there we need to show neha clicks on console to login to console."
3. "We need some explanation to tell that for demo client workspace for kiranas, distributor and fmcg is
   munchly-smartclearance.web.app."

The time could come from the closing scene and the SaaS scene, never from the architecture or the main walkthrough.
Asked how, the maintainer kept the SaaS scene as it was, let the close be 1.5 s and asked for the rest to be found
subtly; then "Whole thing has to be under 240seconds strictly", and the destruction certificate's signing could give
a little.

### What changed

- **The cast** (`src/cast15/`, cast10 with two cards): under Munchly Foods' card, Priya Deshmukh (Munchly · supply
  chain, "tracks every batch, approves each plan") and Neha Kulkarni (Smart-Clearance · console, "sets the brand up:
  data, people, agents"), each with the app's portrait, landing as the voice says "two batches".
- **The landing page, 6.5 s,** before the console, in Neha's room:
  - the production landing page (the admin walk's recording, 21.05 s) held while the voice says "Munchly, its
    distributors and kiranas share its workspace. Neha opens the console." (Maya1, six takes; take 4, read back word
    for word, its 0.78 s breath between the sentences cut to 0.40 s);
  - the Workspace button ringed, its line running to a card: "munchly-smartclearance.web.app · This demo's client
    workspace: Munchly Foods' own team, its distributors and their kiranas";
  - then Console, with its card: "smartclearance-console.web.app · Smart-Clearance's own team: every client set up, run
    and watched". Both cards stay to the end of the scene;
  - Neha presses Console on "opens" (21.55 s), the address changes, the console opens, she presses Sign in (37.42 s)
    and "Welcome, Neha" lands; then the console scene, unchanged. A click under each press;
  - "Two ways in.", and Firebase Hosting's tag (the landing page, the console, every workspace).
- **The close, 1.5 s:** the line "Try the guided demo." said over the card, which comes together 3.6 times as fast
  (all of it in by 0.92 s), the QR code up from 0.15 s, and a 0.3 s fade to black. The landing of the mark is voiced
  0.25 s in.
- **The time,** against cut 14's 238.92 s: the landing page adds 6.5 s; the close gives 4.2 s (its line 2.97 s
  shorter, its hold 1.12 s, the breath before it 0.15 s); the signing at the landfill gives 1.0 s (Rakesh's own
  signature at 1.3x, the fast-forward 22x to 25x, the four signed held 0.16 s less); and a few tenths
  each from the opening's lead (0.1), the breath after its first line (0.1), the bin's beat (0.3) and the cast's lead
  and tail (0.25). The SaaS scene, the architecture and the rest of the walkthrough keep every frame.
- `mix.py` can now tighten a pause inside a take (a negative `pause` in `lines.json`): the silence is cut round its
  middle with a 10 ms crossfade, never past the silence.

### Found

- The landing page leaves at 21.6 s, so the press's segment ends there: a frame later the window was blank.
- The kicker "THE LANDING PAGE · SMARTCLEARANCE.WEB.APP" did not fit its column; the address bar carries the address.

### The result

- 3 min 59.4 s (239.40 s); −14.0 LUFS, −1.5 dB true peak.
- No one-frame flash in its 5,985 frames; every window within its speed limits apart from the two labelled
  fast-forwards (the scheme filling, 34x; the signing, 25x).
- The stage-mark scan: 208 frames, the 12 new ones the landing page's dark hero film in its corner and the console's
  own green Sign in button.
- Both QR codes read back (7.4 s and 238.95 s).
- 31 of 34 lines word for word, the new landing line and the close among them; u02 reads exactly again. The rest as
  before: u03's "Pub/Sub", and the brand name in s01 and s08.
- `working-demo/smart-clearance-working-demo-2026-10-16_10-55-33.mp4` (crf 17), its 720p copy, a light preview, the
  changed scenes on their own (`…-changes.mp4`) and captions; the crf-21 copies in `media/`.

**The spend:** nothing. Maya1, Whisper, UTMOS, Chromium and ffmpeg ran on this Mac.

## Cut 14 (16 Oct 2026)

Cut 13's architecture refined, and 1.5 s moved into it from the scene before.

### The brief

On cut 13's export (`…_2026-10-16_01-51-30`), the maintainer's notes:

1. "The firebase hosting and Firebase authentication can bare be understood."
2. The four apps' screens: "this should show the snapshots of the app when the animation starts and they should
   scrolling or doing something to make it interactive."
3. A chip like the app's ("Console · staff set every brand up"): "I need to see these type of info on top of Google
   components that are being explained and highlighted."
4. "When a particular component is being explained, that component and the screenshot must be focussed together in
   a more better way."
5. "Try to use actual google logos for each components (but their colour and theme should be matched with the
   animation background)."
6. "The previous scene which metiones about SaaS platfrom runs for about 6 seconds, we can condense that to save 1-2
   seconds and add that time to Architecture."

### What changed

- **Google's own logos**, recoloured to the scene's inks:
  - Google Cloud's product icons (Google Cloud, Identity Platform, Cloud Run, Cloud SQL, Pub/Sub, Cloud Scheduler,
    BigQuery, Cloud Storage, Agent Platform, Secret Manager, Cloud Trace, Cloud Logging, Cloud Monitoring, Cloud Build,
    Artifact Registry), laid out large in Lucid's Google Cloud 2021 set and exported (a scratch Lucid document,
    "Smart-Clearance film icons (SC-219 scratch, safe to delete)"), then cut into masks that keep their two tones
    (`src/arch13/logos/*.png`);
  - Firebase's flame and Gemini's spark from simple-icons (CC0), downloaded on the maintainer's yes
    (`logos/firebase.svg`, `logos/googlegemini.svg`). Gemini's orb now carries its real spark.
- **The logos everywhere:**
  - on each part's face: Cloud Run on the API, Secret Manager on its block;
  - on glass signs where a part has no flat face: Cloud SQL, BigQuery, Cloud Storage, Firebase on the deck;
  - on discs that turn to the camera: Pub/Sub's hub on the ring, the scheduler beside the clock, Identity Platform
    on the gate;
  - in each window's header, the dock, the agents' model tags and the base services' chips.
- **A roll-call** on "it's all Google Cloud": every part's logo, named, over it in a cascade, the camera holding on
  the whole platform.
- **The four apps on their screens**, from the first frame:
  - the landing page, the console's Overview, the workspace's Command Center and the guided demo, each scrolling
    on its own: holding, gliding, holding;
  - the Command Center's sidebar and right-hand column stay put while its main column scrolls, as in the app;
  - `src/tiles14.mjs` captures them from the live landing page and the live guided demo (each page's scroller
    unfolded and shot whole, since the Command Center is live), and `src/tiles14.py` builds the strips
    (`arch13/tiles/`).
  - The screens are larger (3.9 by 2.44), and the camera passes them two at a time: the landing page and the
    console, a glide, then the workspace and the demo. A light runs along the deck as Firebase deploys them, and
    Firebase Hosting's chip follows under the pair in view. The apps window of cut 13 went, since the screens carry it.
- **Firebase Authentication as a gate:** a ring over the API that every request passes through, Identity Platform's
  badge on its rim. Priya signs in in the window beside it; her ID token runs to the gate, which flashes, a sweep
  crosses it and "ID token ✓" lands; then the token runs on to the API, which checks it.
- **Each part's chip** over it while the voice explains it, in the app chip's form, larger, on a stem down to the
  part: its logo, its name and one line.
- **Focus:**
  - the part being explained is bracketed (corner marks in its ink, a faint box), the rest of the frame a shade down;
  - its window's lead runs to the bracket's side;
  - the bracket glides from part to part through each hand-over;
  - every camera shot now holds while its part is explained, moving only in the hand-overs, so the chips stay up.
- **The time:** the SaaS scene's line re-voiced tighter, "Agentic software as a service for FMCG brands,
  distributors and retailers" (Maya1, six takes; take 4 kept: read back word for word, UTMOS 4.50 against the best
  4.51, the shortest at 5.69 s against 7.19 s). The 1.5 s goes to the architecture's opening:
  - the breath after "it's all Google Cloud" (0.4 to 0.75 s);
  - the pause after "Firebase" (0.45 to 1.15 s);
  - after "Run" (0.3 to 0.55 s);
  - after "step" (0.3 to 0.5 s).

  The SaaS scene runs 9.71 s (11.21 s before), the architecture 37.46 s (35.96 s), the film 238.92 s.

### Found

- The Command Center is live in the guided demo (its agents keep acting), so screens shot a second apart never lined up
  in a stitched strip: each page's scroller is unfolded to its full height, and its frame's clipping and scaling
  undone, and shot whole.
- A chip faded while the camera was already setting off for the next part: every shot now holds.
- Hand-overs on the scene's own clock ease over 0.4 s, which the opening's stretched timing made about 0.8 s, so the
  second pair of screens lost its labels as they were shown; Firebase Hosting's beat runs on, and the screens' labels
  take no dimming of their own.
- The SaaS scene's frames were captured on its old cues: it was captured again on the new line's.
- Cloud SQL's audit rows now arrive from "the record".

### The result

- 3 min 58.9 s (238.92 s); −14.0 LUFS, −1.5 dB true peak.
- No one-frame flash in its 5,973 frames; window speeds as cut 13's.
- The stage-mark scan as before (196 frames, the apps' own green buttons, a phone's dark card and the label photo).
- Both QR codes read back.
- 29 of 33 lines word for word. The re-voiced b91 reads exactly. u02 now reads "Cloud SQL app has the record":
  - the voice on its own reads word for word;
  - any background under it tips Whisper over, the music alone or the effects alone;
  - cut 13's 0.3 s pause after "Run" gives "cloud equal" instead.

  It is the same take as cut 13's.
- No label moves faster than the camera carries it (17 px a frame at most, the bracket gliding between Pro and Flash).
- `working-demo/smart-clearance-working-demo-2026-10-16_09-46-36.mp4` (crf 17), its 720p copy, a light preview, the
  architecture on its own (`…-architecture.mp4`) and captions; the crf-21 copies in `media/`. Three exports from the
  way there are kept as `…-superseded`.

**The spend:** nothing. Lucid's export, Maya1, Whisper, UTMOS, Chromium and ffmpeg ran on this Mac or the connected
Lucid account; no image, video or paid model was called.

## Cut 13 (16 Oct 2026)

Cut 12 with the architecture scene (0:22.5 to 0:58.5, the lines t01, u02, u03, u17, u18 and u06) made again from cut
10's 3D film, and given 2.5 s more, taken a few tenths at a time from ten other scenes; everything else is cut 12's.

### The brief

On cut 10's export (`…_2026-10-15_20-34-52`), the maintainer's notes (16 Oct 2026):

1. "I want to have the 3D cinematic effect like this for the architecture with really exact sound effects."
2. "I need the application screenshots to be displayed sharper and better in the scenes."
3. "Every component that you show and describe there should [have] animation effects and if possible [be] associated
   with [an] application screen (animated and having something done like button being clicking, notifications coming)."
4. "The animation should take up the entire space and not be scoped like a movie, text should be properly highlighted."
5. The Gemini orb: "try to make it more better".

Then, while it was made: "Also show Firebase authentication for identity management".

On the first export (`…_2026-10-16_01-19-44`): "I see sometimes labels flying across on the architecture animation,
can you review it careully please", and "buy me 2-3 extra seconds for the architecture and eat that from somewhere else
little by little, dont eat all 2-3 seconds from 1 scene".

### The scene

Cut 10's lit platform, its lens (depth of field, anamorphic streaks, bloom, motion blur from sub-frames, a grade) and
its camera, now **full frame**: no letterbox. Each part the voice names is framed on one side, and the app beside it on
the other, in a browser window or a phone:

| From | The part | The app beside it, and what happens on it |
| --- | --- | --- |
| 0:03.7 | Firebase · Hosting: four apps | the landing page, the console, the workspace and the guided demo in four windows, each address typed in, each page loading |
| 0:05.0 | **Firebase Authentication** (its own block at the deck's end) | the live workspace's sign-in: the pointer clicks the email field, `priya.deshmukh@munchly.example` is typed, the password, Sign in pressed and "Signing in…"; Firebase Authentication signs her in, and her ID token travels to the API |
| 0:06.7 | Cloud Run: one API | `verify_id_token ✓ · role ws-operator` at the API; the Command Center opens on her screen, its call written under it (`GET /v1/workspaces/munchly/snapshot · 200 OK`) |
| 0:08.5 | Cloud SQL: the record | the batch's Record tab, its audit trail arriving row by row as each line is written to the disks |
| 0:10.4 | Pub/Sub: every step, an event | the topics racing round the ring; two lock screens, Priya's push landing (the Watcher's alert), then Lakshmi Agencies' (the label photo asked for), through Firebase Cloud Messaging |
| 0:13.6 | Cloud Scheduler: the clock | the console's Agents tab: the pointer presses Run now on the Watcher's daily check; "Ran just now", and the console's own toast |
| 0:15.4 | Google's ADK: nine AI agents | the console's agent pipeline scrolling past every agent and its level, as the agents rise in 3D |
| 0:17.9 | BigQuery: sales history | the Watcher's `sellthrough.project` call, then the Valuer's `bigquery.price_history`, each ringed as the data arrives |
| 0:19.6 | Cloud Storage: photos and papers | Lakshmi Agencies' phone: Send photo tapped, "Sending photo…", "Vision is reading the label", "Verified · matches your records" |
| 0:21.9 | Gemini on Google's Agent Platform | the agent timeline's `gemini.vision.read_label` call ringed as "Gemini" is said |
| 0:24.4 | Gemini 3.1 Pro: prices and negotiates | the Valuer's five channels priced, bar by bar; the buyer's phone: Bid tapped, the Negotiator's counter arriving in the chat |
| 0:26.8 | Gemini 3.8 Flash: reads and writes | Vision's read of the label, field by field; the kirana's phone, Outreach's Hindi offer written in |
| 0:28.7 | Guardrails: never the money | the Lister's card, its reserve "Only Munchly sees", ringed; a model reaching for the money flashes off the shield |
| 0:31.1 | Worked out by the API: ₹16,917 | the approval sheet's ₹16,917 ringed; `money.py` |
| 0:33.6 | A person's yes | Priya's phone: Approve tapped, "Approving the plan…", Plan placed, ₹22,194; the yes runs to the API and the platform lights |

**The screens are sharp:** each is the app's own screen captured at 2x from the live guided demo (the production UI on
its stub) and the live workspace's sign-in page (`src/screens13.mjs`, `screens13.py`, into `src/arch13/scr/`), drawn in
screen space over the 3D, never through the lens. Inside a window the screen can pan and zoom (a camera of its own) and
change state (before and after a press). A lead runs from each window to its part in the scene, and the data travels
along it (the ID token, the snapshot, the events, the label photo, the counter, the approval), with a ping where it lands.

**The text is marked:** the act's title stands over the scene on its own shade, its words rising, and the words that
matter marked in green (All on **Google Cloud**; **Nine AI agents**. Two Gemini models; The models never touch **the
money**). The stack's parts sit in a glass dock along the foot, the part being named filled green, Firebase
Authentication among them. Each card marks its key words.

**Gemini, made again:** a glass orb with Gemini's blue, violet and rose turning slowly inside it (kept under the bloom's
threshold, so it glows and never burns to white), a bright rim and a glass highlight, its four-point spark crisp at the
centre, a disc of fine motes turning round it, and its two models riding their own orbits as labelled satellites: Pro
in violet, Flash in blue, each flaring as the voice names it, its beams going to the agents that use it.

**The sound** is the scene's own, placed on the frame each thing happens (`build/arch13/events.json`, 236 events,
`mix13.py`'s `ARCH13_SOUND`): a soft swish as each window lands, a key under every character typed, a click under every
press and a tap under every finger, a tick as each audit row arrives, a chime as each push lands, a zip as each packet
leaves and a ping where it lands, a confirm as the sign-in, the photo and the plan go through, the console's toast, a
scroll under the pipeline, a swell and a shimmer as Gemini wakes, glass as the shield turns a model away; and cut 10's
whooshes under the camera's moves, its title glints, the platform's hits and the yes.

### How it is made

- **`src/arch13/`:** `arch.html` and `arch.js` (cut 10's three.js scene, full frame, with Firebase Authentication's
  block, the new Gemini orb, the title and the dock, the camera keyed for the full frame), `vig.js` (the windows: a
  browser or a phone, the screen's own pan and states, the pointer and finger, typed text, veils over rows yet to
  arrive, rings, pushes, the leads and their packets, and each one's sounds), `scr/` (the screens).
- **Into the film:** captured frame by frame with `capture-page.mjs` on cut 12's cues (`build/arch13-cues.json`) into
  `build/arch13/`; `shots13.py` reads it where cut 12 read `arch12/`; `render13.py`, `mix13.py`, `export13.sh`, with
  `flash13.py`, `cardscan13.py` and `readback13.py` as cut 12's.

### Found

- **A black frame at Gemini:** on the Mac's GPU (Metal), `pow()` in the orb's glass highlight returned NaN for a few
  pixels, and the bloom spread them over the whole frame. The orb's shader uses no `pow()` (a fresnel from a square
  and a root, the highlight by repeated squaring).
- The screens' overlays (typed text, veils, rings, pushes) sat under the screenshot; they are drawn above it.
- The typed email vanished once typed: its typing end was read as its end.
- The cards stretched past their screens; each card is as wide as its screens.
- Pro and Flash framed the orb behind the windows; the camera takes the orb and the agents it lights on the free side.
- Two windows handing over made a light wash for a few frames; a window now lands in 0.14 s and leaves in 0.3 s.

### The labels, and 2.5 s more

- **What flew:** a survey of every label's place on screen, frame by frame (where it is and how visible), found the
  packets' names ("batch.at_risk", "Hindi offer", "counter ₹14.20", "label read") riding their leads in about a third
  of a second, up to 300 px a frame; and the parts' labels swept by the camera as it moved fast or passed near them.
- **Now:** a packet's name is pinned at its panel's outer edge, beside the window it comes from or reaches, shown as an
  outgoing packet leaves or an incoming one lands, held 1.3 s, giving way to the panel's next; only its dot travels
  (never under 0.5 s). A label on a part fades as it moves
  faster than about 7 px a frame on screen (gone by 21) and as the lens nears it; the parts in focus are one run while
  the light moves between them, so a label stays up through a hand-over instead of dipping and coming back. Gemini's
  two models ride their orbits at about half the speed. On the new timing no packet name moves at all, and no other
  label moves faster than 16 px a frame while clearly on screen (the camera carrying it).
- **Found on the way:** a marked title word turned dark all at once halfway through its marker, so for a moment the
  letters the marker hadn't reached vanished ("the mone ."); the dark ink now follows the marker's edge. The Pub/Sub
  panel's badge sat on the dock; a panel with a badge now sits high enough to keep it clear, and the two phones are a
  little smaller (242 × 523) so the card keeps its place under the title.
- **2.5 s more:** the architecture's lines gain pauses where it is busiest (after "Firebase" and "Run", after "step",
  after "negotiates") and longer breaths between them: 33.44 s to 35.96 s. Ten other scenes each give up 0.20 to 0.30 s
  of their gaps (the landfill, the console, Priya's sign-in, the Command Center, the approval, the fill, Lakshmi
  Agencies ending whole, the chips, the lot, the signing), so the film keeps its length.
- **How:** the scene keeps cut 12's timing as its own clock, and the narration's cues warp the film's time onto it,
  piecewise linear between the words (`warp()` in `arch.js`): a stretch of 1.2 to 1.5 times, only where a pause was
  added; its sounds are placed back on the film's time.

### The result

- 3 min 58.9 s (238.92 s), the same length as cut 12; −14.0 LUFS, −1.5 dB true peak.
- No one-frame flash in its 5,973 frames; no dark frame in the architecture's 904; window speeds within their limits
  (the signing scene's last window at 1.35x, given 0.1 s back to stay under 1.4x).
- The stage-mark scan as cut 12's (196 frames, the apps' own green buttons, a phone's dark card and the label photo).
- Both QR codes read back from the film's frames.
- 29 of 33 lines word for word, as cut 12; the architecture's six lines all read back apart from u03's "Pub/Sub",
  which Whisper writes "Pup-Sub", as before.
- `working-demo/smart-clearance-working-demo-2026-10-16_01-51-30.mp4` (crf 17), its 720p copy, a light preview, the
  architecture on its own (`…-architecture.mp4`) and captions; the crf-21 copies in `media/`. The first two exports
  are kept as `…_01-19-44-superseded` and `…_01-42-21-superseded` (before the panel-edge names and the marker fix).

**The spend:** nothing. Chromium (three.js on the GPU, the captures), ffmpeg, Whisper and the film's own synths ran on
this Mac; no image, video or paid model was called.

## Cut 12 (16 Oct 2026)

Cut 11 with the architecture scene (0:22.5 to 0:56, the lines t01, u02, u03, u17, u18 and u06) made again; everything
else is cut 11's.

### The brief

After the concept round below, the maintainer stopped the second round and asked to "revert back the 3D remotion
animation effects you did in the last video to explain the architecture and think hard and better it", then: "The
entire thing should be sharp and surreal and explain the flow and components, camera movement and lighting should be
perfect". That is concept B, the isometric blueprint built in Remotion, made into the whole scene.

### The scene

The data centre as one isometric hall floating in a dark green void over its own faint reflection, built and lit in
motion on the narration's words, with one camera that never cuts and turns a few degrees about the hall as it travels:

| From | What it shows |
| --- | --- |
| 0:00 | one agent's light, bright; the camera leaves it and pulls back, turning, as the hall rises row by row from it; "All on Google Cloud." large at the centre, then docked |
| 0:03.7 | the four apps' screens rise at the hall's edge (Firebase), an orange pool of light under them |
| 0:05.5 | the call runs along the floor from the apps to the core; Cloud Run's racks light and its containers stack |
| 0:07.6 | Cloud SQL's three disks stack; the records fly in |
| 0:09.3 | events leave the core and run Pub/Sub's spine, the camera travelling with them, their names riding them (batch.at_risk, journey.step, offer.received) |
| 0:12.1 | the Scheduler's tower, its clock ticking, its tick dropping into the spine |
| 0:13.8 | the nine AI agents light one by one, each named, the Watcher grey in plain code; an event branches up into each |
| 0:16.5 | BigQuery's sales rise as bars and reach the Watcher and the Valuer; a label photo leaves Cloud Storage for Vision |
| 0:20.9 | Gemini's accelerators wake violet behind the agents; Pro's beams reach the Valuer, the Router and the Negotiator, Flash's the six that read and write, each agent taking its model's colour and chip |
| 0:26.2 | a glass wall rises round the API and the money; Gemini's beam stops at it; the API works out ₹16,917 |
| 0:31.3 | close on the desk: Priya's Approve screen pops up beside it, the cursor taps Approve, the yes runs to the API and across the hall, every rack turning green, and the camera pulls back to the whole hall |

Cut 10's notes come in with each part, its index runs along the foot, and the three acts keep their titles.

### How it is made

- **Remotion 4.0.535** (`src/remo12/`, composition `Arch12`): `src/arch12/world.ts` (the layout in world units, a true
  isometric camera with an azimuth for the orbit, the camera's path on the cues) and `src/arch12/Arch.tsx` (the hall
  drawn in SVG: faces lit from the upper left, rims on every top edge, contact shadows, pools of light where lit parts
  spill onto the floor, bloom on what is lit; cables with packets, beams with light running along them; the void's slow
  light and motes). Camera motion blur (`CameraMotionBlur`, 5 samples, 100°) on the hall only, so the type stays sharp.
- **Into the film:** the scene rendered as a JPEG sequence into `build/arch12/` (`f00000.jpg` …), read by `shots12.py`
  where cut 11 read `arch11/`; `render12.py`, `mix12.py`, `export12.sh`, with `flash12.py`, `cardscan12.py` and
  `readback12.py` as cut 11's.
- **Sound:** `events12.py` lays the scene's own events (the hall rising, the apps, the call, the disks, the clock, each
  agent, the bars, the photo, Gemini, its beams, the glass, the block, the figure, the tap, the wave) in
  `build/arch12/events.json`; `mix12.py` voices them with the film's palette (mix11's, with the call's landing added).
  The scene's preview carries the same sounds (`remo12/public/audio/arch-sfx.wav`).

### Found

- A camera whoosh, the record's pen scratch and the spine's ticks sat on "Pub/Sub" and its line; they were moved or
  removed. Whisper still spells the word "PupSup" in its read-back window, though the take alone reads "PubSub" and the
  mix there differs from cut 11's by −42 dB.
- The opening started on dark racks; it starts on one bright agent light. The title docked too early; it rises large at
  the centre during the pull-back, as concept B's did.
- The yes was small on the desk's screen; the Approve screen pops up beside the desk and the tap is on it.

### The result

- 3 min 58.9 s (238.92 s), the same length as cut 11; −14.0 LUFS, −1.5 dB peak.
- No one-frame flash in its 5,973 frames; the window speeds and stage marks as cut 11's.
- Both QR codes read back.
- 29 of 33 lines word for word, as cut 11; u03's "Pub/Sub" is Whisper's "PupSup".
- `working-demo/smart-clearance-working-demo-2026-10-16_00-11-41.mp4` (crf 17), its 720p copy, a light preview and
  captions; the crf-21 copies in `media/`.

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
inside each rack, a similarity a frame, ridden by the graphics as CSS `matrix3d`). `board12c.py` writes the board's
media.

None was picked; the notes for a second round were "Mix A and B", "A brighter, Google look" and "One continuous shot".
Its bright hall was made (`gen-qwen12d.sh`, `round-cut12/round-2/`) and its chained camera moves begun
(`gen-ltx12d.py`) when the maintainer stopped it and asked for concept B made whole: cut 12, above.

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

Cut 12, after cut 11's steps (its architecture is the Remotion scene; `./prep12c.sh` puts the fonts, screens and voice
in `remo12/public/`):

```sh
./prep12c.sh && .venv/bin/python events12.py                                        # the media, the scene's sounds
(cd remo12 && npm i && npx remotion render src/index.ts Arch12 ../build/arch12-seq --sequence --image-format=jpeg --jpeg-quality=95)
# then name the frames f00000.jpg … in build/arch12/ (the sequence's element-NNN.jpeg, in order)
.venv/bin/python render12.py && .venv/bin/python mix12.py && ./export12.sh
node qrcheck11.mjs ../media/smart-clearance-working-demo.mp4 7.6 235                # the codes, read back
```

Cut 16, after cut 15's steps (the cast page `cast16/`; the new lines voiced and picked; the console and the landing
page read SC-226's run of 16 Oct, `kit.REC['admin2']`):

```sh
.venv/bin/python shots13.py > /dev/null
node capture-page.mjs cast16/cast.html build/cast16 build/cast16-cues.json 25
node capture-page.mjs saas10/saas.html build/saas10 build/saas10-cues.json 25
node capture-page.mjs arch13/arch.html build/arch13 build/arch13-cues.json 25
.venv/bin/python render13.py && .venv/bin/python mix13.py && ./export13.sh
node qrcheck11.mjs ../media/smart-clearance-working-demo.mp4 7.4 238.8
```

Cut 15, after cut 14's steps (the cast page `cast15/`; the landing page's line voiced and picked):

```sh
.venv/bin/python shots13.py > /dev/null                                             # writes the pages' cues
node capture-page.mjs cast15/cast.html build/cast15 build/cast15-cues.json 25
node capture-page.mjs saas10/saas.html build/saas10 build/saas10-cues.json 25
.venv/bin/python render13.py && .venv/bin/python mix13.py && ./export13.sh
node qrcheck11.mjs ../media/smart-clearance-working-demo.mp4 7.4 238.95             # the codes, read back
```

Cut 14, after cut 13's steps (its app screens from `tiles14.mjs` and `tiles14.py`; the SaaS scene captured again on
the new line's cues; the voice's new take picked by `tts/pick.py`):

```sh
node tiles14.mjs build/tiles14 && .venv/bin/python tiles14.py build/tiles14          # the four apps' screens, only to capture them again
node capture-page.mjs saas10/saas.html build/saas10 build/saas10-cues.json 25       # after shots13.py
```

Cut 13, after cut 12's steps (its architecture is cut 10's three.js scene, made again in `arch13/`; its screens are in
`arch13/scr/`, and `screens13.mjs` captures them again from the live guided demo and sign-in page):

```sh
ln -s ../../../SC-210/src/eco/node_modules arch13/node_modules
node screens13.mjs build/screens13 && .venv/bin/python screens13.py build/screens13   # only to capture the screens again
.venv/bin/python shots13.py > /dev/null                                             # writes build/arch13-cues.json
node capture-page.mjs arch13/arch.html build/arch13 build/arch13-cues.json 25       # the scene, frame by frame, and its sounds
.venv/bin/python render13.py && .venv/bin/python mix13.py && ./export13.sh
node qrcheck11.mjs ../media/smart-clearance-working-demo.mp4 7.6 235                # the codes, read back
uv run --no-project --python .venv/bin/python --with mlx-whisper python readback13.py   # the narration, read back
```
