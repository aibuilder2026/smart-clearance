# SC-218 · The working demo, cut 8

Cut 8 of the demo film, after SC-209's cut 7. It follows the maintainer's notes after a call with the hackathon team:
techno-functional, the two journeys as live walkthroughs, the architecture and Google's models in depth, crisp
transitions, under the 239-second cap. It is made from:

- the same three production recordings of 13 Oct 2026;
- cut 7's pipeline and media (SC-209);
- two scene pages captured frame by frame on the voice's own words: the architecture (`src/arch8/`, new) and the
  landing film's install scene (`src/pwa8/`, from SC-211's `pwa11`).

It joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its
name.

## The brief

**The maintainer's notes on cut 7** (15 Oct 2026), after a call with the hackathon team:

1. Techno-functional, with more focus on the technology.
2. The last 15 seconds condensed.
3. A live walkthrough of the happy path, made intuitive, then the sad path, with the screens' clicks, scrolls and
   signing shown. The characters stay in the background; the walkthrough leads.
4. A part on the application's architecture and how Google's models are used, in more detail, with animation, motion
   and sound effects drawn from the 7-minute landing film (SC-211). Voice-over only; no characters talking.
5. Scene transitions that are not blurry, and camera moves done professionally.
6. Made with the Playwright recordings, Qwen, LTX, Remotion-style pages and ffmpeg, all local.
7. Reviewed carefully for glitches.
8. Strictly under 239 seconds.

**Then, while it was being made:**

- "Make sure when show a scene, there are no blank portions of in screen, it should be full of animations and
  contents", and later "Some of the scenes have blank sections, they need some content and animations or motion
  effects".
- On the people behind the screens: "Blur it more if we show it like this, or else text is not clear … we have to create
  aesthetically pleasing presentation".
- "Throw in tech stack details every now and then whenever feasible and relevant, for example signatures are saved …
  (then show a motion animation of that happening)", then "Dont overdo it on every scenes, just a touch upon on main
  screens".
- "The notification popups should be seen first in the application window, so that it can be understood that its a
  demo, make sound effects of each clicks and scrolls too.. and notification incoming".
- "Demonstrate somewhere quickly that smartclearance is saas based and progressive webapp which can be installed on any
  laptop, tablet or mobile", then "Do it how we showed in landing demo".

## What changed

| Part | Cut 7 | Cut 8 |
| --- | --- | --- |
| Transitions | every shot dissolved into the next (0.45 s); a window's recording dissolved at each jump (0.24 s); whip pans and the dive into the label zoom-blurred | no dissolve and no blur between shots: a hard cut, a **push** (the next shot slides in at whole pixels while the outgoing slips back a third and darkens, a short shadow on its edge, on an eased camera curve), or one **wipe** with a thin light line, into the sad path (`render8.compose`). A window's recording cuts hard from one moment to the next (`parts8.Walk`) |
| The opening | the godown, the label, the bin | the same three shots; the dive's zoom blur into the label is now a cut on the voice's breath |
| Under the hood | the architecture's five layers and the agents' walk, 12 s | **51 s in three acts**, a page captured frame by frame on the narration's words (`arch8/`), its sounds voiced with SC-211's palette. **All on Google Cloud:** a blueprint of the whole platform lights part by part: Firebase (Hosting, Authentication) and the four apps, backend-api on Cloud Run with OpenTelemetry, Cloud SQL (IAM sign-in only, backups, point-in-time), Secret Manager, ID tokens on every request, Pub/Sub's topics running the bus once each, Cloud Scheduler's tick setting the timers, and SSE and FCM back to every screen. **Ten agents, two Gemini models:** the ten agents wake under the bus, built with ADK on Cloud Run, one run per event; BigQuery feeds the Watcher and the Valuer, Cloud Storage the photos to Vision, `/internal` with a Google ID token back to the API; Gemini on Vertex AI, each agent's tier lit as the voice names its job (Pro prices, splits and negotiates; Flash reads labels and receipts, writes the offers and papers); Cloud Build, Artifact Registry, Monitoring, Trace and Logging along the foot. **One model call, bounded:** the Router asks on ADK; Gemini 3.1 Pro answers in structured output, three tries of 30 s and then a safe fallback; the API works out every figure and checks every word; the reserve price never reaches a model; the evals (Vision 72 of 73, the Router 20 of 20, the reserve never leaked); the call as one trace in Cloud Trace; and nothing moves until a person's yes is clicked |
| The supply chain and its cast | Munchly's map and its people, 16 s | gone: the people are now behind their own screens, all through the walkthrough |
| The console | Neha's face, a whip pan, her screen | the walkthrough over her room: Clients, Kaveri Foods opened, its first stock export mapped, its people, the quick-commerce gates per SKU (on Munchly's SKUs, as the recording has them), Kaveri's agents tuned, each lit on the left as it plays; a card: software as a service, each brand on its own address |
| Sign-ins and the installed app | three sign-ins; cut 7's install scene | **the landing film's own install scene** (SC-211 `pwa11`, the maintainer's "do it how we showed in landing demo"), its kicker naming SaaS too: "Software as a service · a progressive web app", on munchly-smartclearance.web.app. The browser's Install app, the dialog, the app in the dock with its own window; the tablet and the phone install it from their home screens; every alert lands as a notification on all three |
| The walkthrough | a face, a whip to over the shoulder, the screen pushed into | **each beat a continuous walkthrough on the production recordings**: the person's own clip behind their screen, played to and fro with eased turns and a camera that breathes on the film's clock, so it runs on unbroken across their shots (`parts8.Breathe`); defocused hard (20 px at quarter size), graded down, a little desaturated, under a scrim at the text column, the title band and the foot, so every word reads (the maintainer's "blur it more"). The screen at rest is pixel-exact; the agent at work with its model and tool calls; rings and cards on what the voice names; a Google Cloud tag where a service is used |
| Filling the frame | some beats left the frame half empty | every beat has its three parts: the words and a panel on the left, the screen in the middle, and on the right what the step is: the Verify pipeline, the Hindi offer and the same offer in English, the kiranas' maps, the staff's UPI payments and the receipt Vision read, Feeding India's meals and its receipt, ₹0 out of pocket, the price line and the Negotiator's counter, the proof Munchly needs, the four signatures, Vision's checks |
| Notifications | pop-ups out of phones held back to the camera | a notification first drops into the app's own screen, as the device shows it, then lifts out beside it to be read (`parts8.PushOut`): Vision's request for the label photo, the Hindi offer, the staff sale, the pickup, Shree Ganesh Kirana's offer (a new push, the app's own Hindi words), the Negotiator's counter, and expiry day's push as the recording shows it landing on Rakesh's tablet. The review's push lands on Priya's screen. Each is voiced as it arrives |
| The stack, in motion | tags | five main screens show a step's data moving (`parts8.DataFly`, `ServiceBadge`, `StepFlow`), and no more ("dont overdo it"): Verify's pipeline, the label photo flying from her tablet into Cloud Storage, then Pub/Sub, the Vision agent, Gemini 3.8 Flash, backend-api and Priya's screen lighting hop by hop; an order's `offer.received` running over Pub/Sub onto Priya's screen; the four signatures flying into the case record in Cloud SQL, where they are kept as strokes with their times; the certificate's and the credit note's PDFs into the docs bucket; the batch's row into BigQuery's impact ledger |
| The happy path | 1:16 to 2:20 | 1:34 to 2:38: the Watcher's alert landing on Priya's Command Center; the label photo; the plan's split and the one tap; the Hindi offer and an order; each order live on Priya's screen; the scheme filling (34× fast-forward, the map keeping pace with the screen's own counts); the staff's UPI payments and the receipt; Feeding India's pickup and receipt; the papers; Lakshmi Agencies ending whole on her own batch page |
| The sad path | 2:20 to 3:12, with the deliveries' clips and the landfill's camera | 2:38 to 3:24: two orders and Om Sai Provision's "Not this time" on the phone; the lot's bid, counter and win on Agrawal's phone; the window closing on Priya's Execution; expiry day's push on Rakesh's tablet; the photos taken and **the certificate signed in place**, the officer's signature at near its own speed, the other three fast-forwarded 22× sheet to sheet; Vision's checks on Rakesh's tablet; Priya's second yes |
| The record, the swing, the ledger | on the record; both batches' swings; the ledger | on the record (with the audit log's place in Cloud SQL until the trace comes in); the chips' swing; Impact's ledger on Priya's screen, the batch's row into BigQuery |
| The close | what comes next (11 s), then the close | one card, 6.7 s: the mark, the line, the four addresses, the stack, the guided demo's QR code as the voice names it, where the sign-ins and the sample data are (`parts8.EndCard8`) |

**The voice.** Eight lines are new: t01 to t06 (under the hood), s08 (the chips' result) and m11 (the ledger),
six Maya1 takes each (`tts/vo5.py`), picked by Whisper's read-back and UTMOS (`tts/pick.py`). Nine of cut 7's lines are
gone: the agents' line, Munchly's two, the sign-ins', the deliveries', the chips' old result, the old ledger's, what
comes next and the close's.

**Sound** (`mix8.py`): cut 7's voice chain and SC-187's bed, ducked as before. The architecture's and the install
scene's own events, voiced with SC-211's palette (whooshes, thumps, pings, the Pro and Flash chimes, the topics, the
clock, the lock, the click and the gate). A whoosh under each push, a swish and a tick as the wipe's line crosses. A
click under each press the screens show (found in the recordings frame by frame and checked on 10 fps strips,
`clicks8.py`), a soft brush under each scroll, a notification chime as each push arrives, a whoosh as data flies and a
landing tone and a clink where it lands, and cut 7's sounds for its panels.

## The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown: the scan, the days running out, the cartons stamped WRITTEN OFF; the label's date; the bin and its cost |
| 0:14 | Smart-Clearance turns the write-off into recovery; three brands, each its own workspace; the best exit for every pack |
| 0:26 | Under the hood: all on Google Cloud; ten agents and two Gemini models; one model call, bounded |
| 1:17 | The console: a brand set up in minutes |
| 1:26 | Software as a service, a progressive web app: installed from the browser, on any laptop, tablet or phone |
| 1:34 | The happy path, Munchly Mango Drink with Lakshmi Agencies, as a live walkthrough |
| 2:38 | The sad path, Munchly Masala Chips with Rakesh Traders, as a live walkthrough |
| 3:24 | On the record: the audit trail in Cloud SQL, one trace in Cloud Trace and its logs |
| 3:34 | How the chips' swing adds up |
| 3:41 | Impact's ledger, ready for BRSR |
| 3:48 | The close: the guided demo, the sign-ins and the sample data |

## How cut 8 is made

| Part | Tool | Where |
| --- | --- | --- |
| The architecture | an HTML page drawn frame by frame (`renderAt(t)`), its camera, cards and packets on the narration's word times, captured in headless Chromium; its sounds returned as events for the mix | `src/arch8/`, `src/capture-page.mjs`, `src/build/arch8-cues.json` |
| The install scene | SC-211's `pwa11`, copied, its address the demo client's and its kicker naming SaaS, captured on this film's words | `src/pwa8/`, `src/build/pwa8-cues.json` |
| The walkthrough | the production recordings' device screens, the people's clips behind them, the panels | `src/parts8.py`, `src/shots8.py`, `src/render8.py` |
| The clicks and scrolls | the stage's press ripple found in the recordings, checked by eye; scrolls by phase correlation | `src/clicks8.py`, `src/build/clicks8.json` |
| The pushes | the app's own notification banners, rendered by Chromium | `src/render-pushes.mjs`, `src/pushes.json` |
| The icons | the design system's Lucide set | `src/icons.mjs`, `src/icons8.mjs` |
| The voice | Maya1 (local), cut 5's warm narrator | `src/lines.json`, `src/tts/` |
| The sound | synthesised in numpy; SC-187's Lyria bed reused | `src/mix8.py` |

**Found while checking:**

- **The stage's own marks:** the recordings carry the journey stage's note cards, rings, dims and chapter chips. Every
  window's spans were scanned for them (`cardscan8.py`) and chosen around them; two were trimmed late in the check (the
  lot's card at 451.6 s, the expiry-day chapter chip at 558.7 s). What the scan still finds is the app's own green
  buttons and the label photo's colours.
- **The signing fast-forward flickered:** between signers the sheet closes on the certificate for an instant, which at
  26× showed as a single frame twice. It now runs sheet to sheet, each signer from a blank pad to the signature (22×).
- **The sell-through panel** read "28 sell in time" and "28 a day × 1 selling days": its day count was clamped to one.
  It counts the 15 days, to 420.
- **The scheme's map** first ran on cut 7's counts; it now follows the window's own counts through the fast-forward.
- **Text over the people:** at cut 7's blur the rooms' detail came through under the words. The rooms are defocused at
  quarter size and graded, with a scrim under the text.
- **The icons in the new discs** were drawn white on white: the discs keep their dark cores.
- **Window speeds:** the papers' window played at 1.38× and the signing's photos at 1.62×; both were re-spanned.

## The result

`media/smart-clearance-working-demo.mp4`: **3 min 54.3 s (234.32 s)**, under the 239 s cap.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dB true peak.
- Beside it are a 720p copy and the narration as `.srt`.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-15_16-44-16.mp4` (git-ignored), with its
  720p copy and captions, beside cut 7 (`…_23-55-28`).

**Checks:**

- every beat as stills at several moments, transitions mid-way, and the whole film as contact sheets at one frame a
  second;
- all 5,858 frames scanned for a frame that differs from both its neighbours while they match each other: none;
- every window plays between 0.97× and 1.40×, apart from the two labelled fast-forwards (the scheme filling, 34×; the
  signing, 22×);
- both codes read back from the film's own frames: the carton label's
  `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024` and the guided demo's
  `https://smartclearance-demo.web.app`;
- the narration read back from the final mix by Whisper, a slice a line (`readback8.py`): 26 of 30 word for word. Of the
  rest, one slice writes "PubSub" as one word, one hears the brand as "Manchli", one writes the URL as one word, and
  m08's slice, which caught the end of the line before it, hears "bags": from a slice starting at the line it reads
  word for word ("packs");
- the black at the start is the first 0.24 s; the film fades out over its last 0.9 s.

**The spend:** nothing. Maya1, Whisper, UTMOS, Chromium and ffmpeg ran on this Mac; no image, video or paid model was
called. The music is SC-187's.

## Rebuild

From `src/`. It needs cut 7's media in place (SC-209's rebuild, which needs the earlier cuts'), and reads the
recordings from the main checkout:

```sh
node icons.mjs && node icons8.mjs && node render-pushes.mjs 380 460             # the icons and the pushes
(cd tts && .venv-snac/bin/python vo5.py 6 t01 t02 t03 t04 t05 t06 s08 m11)        # then mos.py and pick.py vo3/maya1w-warm
.venv/bin/python shots8.py                                                       # the scene pages' cues
node capture-page.mjs arch8/arch.html build/arch8 build/arch8-cues.json 25
node capture-page.mjs pwa8/pwa.html build/pwa8 build/pwa8-cues.json 25
.venv/bin/python clicks8.py                                                      # the clicks and scrolls, then check them by eye
.venv/bin/python render8.py && .venv/bin/python mix8.py && ./export8.sh
node qrcheck8.mjs ../media/smart-clearance-working-demo.mp4 8.4 232              # the codes, read back
```
