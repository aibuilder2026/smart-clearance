# SC-208 · The working demo, cut 6

Cut 6 of the demo film, after SC-207's cut 5. It follows the maintainer's ten notes on cut 5, under the 238-second
cap they set. It is made from:

- the same three production recordings of 13 Oct 2026;
- cut 5's pipeline and media (SC-207);
- new scenes, and new photoreal keyframes and clips.

It joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its
name.

## The brief

**The maintainer's notes on cut 5** (14 Oct 2026), "Maximum 238 seconds":

1. Condense the last 20 seconds or so. Make the future scope more colourful and pictorial, with better animation. At
   the very end, say that the sign-ins for the app deployed on Google Cloud are in the deck, and the sample data to
   run the demo is on GitHub.
2. Where Munchly's distribution is explained, show every character in the demo, with their roles.
3. Where the split is shown, explain how the agents decide it from the client's rules and the batch's sales history.
4. The amber ring over an empty space above "Watch execution" looks glitchy.
5. On the Record tab, show the detailed audit kept in the database, and the agents' traces in Cloud Trace and
   OpenTelemetry.
6. Show the agent at work, animated, wherever a scene shows an agent doing something.
7. Wherever a person holds a phone with its back to the camera, pop up what they are doing, or the notification they
   got.
8. The opening's narrator only reads the words on screen. Make it animated content in a different flavour, showing
   the write-off, over the same background.
9. Show the distributor delivering to a kirana, and the ExpireSoon buyer collecting the lot, animated.
10. Animate the landfill more, and show the GST input credit reversed.

**Then, while it was being made:** "I need realistic photos and videos, not cartoon". A first try at the new imagery
as clay illustrations (`src/prompts/rejected/`) was dropped unused. Every new picture is a photoreal Qwen-Image
keyframe, and every new clip an LTX clip made from one.

## What changed

| Part | Cut 5 | Cut 6 |
| --- | --- | --- |
| The opening | the sentence printed on a shipping label, stamped WRITTEN OFF | no words on screen (note 8). Over the same godown, two big red WRITTEN OFF stamps thump onto the near pallet's front cartons as the voice says "write off". The frame jolts with each. Then a quicker run of stamps goes down the stack's side, foreshortened as the cartons' faces are. Each stamp is tracked through the dolly by `cartons.py`'s label paths, and its ink takes the carton's light. A tally card rolls the write-off up to −₹22,657 on 1,580 packs of Mango Drink (`parts6.StampedGodown`, `WriteOffTally`). The carton the camera dives into keeps its label clean |
| The bin | two chips | what destroying costs, row by row, as money.js works it out (`CostStack`, note 10). The rows are the stock at cost (−₹17,380), the GST input credit, disposal (−₹2,370) and EPR on the kilos (−₹2,038). On the GST row, a green "ITC ₹869 · kept" pill is struck out and taken back as "reversed" (s.17(5)(h)). The total rolls to −₹22,657. The panel grows with its rows |
| Munchly's supply chain | the map | the map builds as before. Then, on "the people you'll meet", it docks into a card on the left, and the cast stands beside it (note 2), grouped by the batch they belong to: Neha Kulkarni (Smart-Clearance, the console) and Priya Deshmukh (supply chain, every plan's yes); on the happy path Lakshmi Agencies, Sri Lakshmi Ganapathi Kirana and Meera at Feeding India; on the sad path Rakesh Traders and Agrawal Wholesale. Each group lights as its path does (`MunchlyCast`) |
| The agents at work | the stop tracker | wherever an agent works, its orb stands where the tracker stood (note 6): its icon, a dashed ring turning faster while it works, a pulse, data sparks running in, its name and stop. Its real tool calls are typed under the headline, wrapping under the call's name where the column is narrow (`AgentHead`). The Watcher, Vision, the Valuer, the Router, Priya's yes, Outreach, the Negotiator, Paperwork and Impact each step up in turn |
| Phones held with their back to the camera | nothing | a ping at the device, a stem, and the app's own push for that moment springing out (note 7), rendered by Chromium as the app shows it (`PhonePop`, `build/push/`). The pushes are the Watcher's alert to Priya, Vision's photo request to Lakshmi Agencies, the Hindi offer to the kirana, the food bank's pickup request and the buyer's counter. On Rakesh's tablet it is what Outreach is doing: the scheme out to 38 kiranas |
| The split | the Router's routes | the voice says the agents decide "from the batch's sales history and Munchly's own rules" (note 3). Two cards land as it does. The sales history from BigQuery: 28 packs a day, 15 selling days, 420 sell and 1,580 won't. Munchly's own rules, set in the console: quick commerce fails at 22 days, ExpireSoon needs 30+, the kiranas' 1,372, the staff sale's 150, the food bank's 15+ days (`SplitWhy`). Then the Router's split as routes, and Gemini Pro named as the Router explains it |
| The yes | an amber ring that stayed after the sheet had turned | the amber ring holds on Approve only until the sheet turns to "Plan placed" (211.3 s in the recording). A green ring then frames the placed sheet (note 4) |
| The deliveries | none | Rakesh's van at a Nagpur kirana: the carton, with the Masala Chips' printed label, handed over the counter. Then the wholesaler's truck loading the lot at the godown, with Agrawal watching. Both are photoreal LTX clips (`TwoClips`, note 9). A route inset draws the van from Kalamna Market to Shree Ganesh Kirana and Jai Durga Stores (24 packets each), then the truck to Raipur (`RouteInset`) |
| The record | the Record tab, small | Priya's Record of the Masala Chips, captured read-only on production and large (`capture-record.mjs`). One ring and card mark the audit trail and the yeses: 63 steps, every agent's run, every person's step and every yes, append-only in Cloud SQL (note 5). Then the step "Sent the label photo" is joined by a line to its trace: one real production trace from Cloud Trace (218be140…, 232 spans, 34.1 s), played as a waterfall from his upload through backend-api, Pub/Sub and the agents' decide pipeline, with Vision on Gemini Flash, the Valuer with BigQuery and Gemini Pro, and the Router (`TracePanel`, `TraceLink`). Under it are the same trace's Cloud Logging lines, each carrying the trace (`LogPanel`). The trace and logs were read as the gcloud user (`fetch-trace.sh`) |
| What comes next | three cards | on a colourful ground (emerald to marigold, with bokeh), three photo cards (note 1). WhatsApp: a shopkeeper reading his phone, as a clip, with the offer and his reply as chat bubbles. More Indian languages: six shopkeepers' round portraits, each greeting in their own script. Native iOS and Android apps: two phones on a shop counter with the live app set into their screens (`NextScene6`) |
| The close | the line said, then the URLs | the line is on the card but not said, so the close is shorter (note 1). The voice goes from the guided demo straight to "Sign-ins for the live app on Google Cloud are in our deck; the sample data is on GitHub". The card builds the line, the four addresses and the stack, then those two lines as pills, in step with the voice (`EndCard6`) |

**The voice.** Five lines are reworded to fit the new scenes under the cap: a01 and a02 (the client and the people),
m04 (the split), m09 (Paperwork) and c01 (the close). Each has 6 Maya1 takes, picked by Whisper's read-back and
UTMOS (`tts/pick.py`). The tagline is no longer said. Pauses are trimmed where the picture allowed.

**Sound.** In `mix.py`, the cues now follow cut 6's shots (`shots6`):

- a thud for each stamp, heavier for the two big ones;
- a tick for each cost row, then a scratch and a tick as the GST credit is struck out and taken back;
- a notification for each pop-up;
- a tick as each agent steps up, and a softer one for each call it types;
- the cast panel's whoosh and ticks;
- a sparkle as the trace plays, and a tick for each log line;
- the deliveries' whoosh;
- a tick for each of the close's two lines.

## The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown at dawn: the Mango Drink's cartons stamped WRITTEN OFF, the write-off rolling up; the dive into a carton's best-before, 22 days left; the bin, what destroying costs and the GST credit taken back |
| 0:15 | Smart-Clearance, over the live landing page |
| 0:27 | The architecture in depth, then the agents' walk in full, to the one human yes |
| 0:39 | Munchly Foods, its distributors, kiranas and exits; the people you'll meet; the two batches |
| 0:55 | The console: a brand set up in minutes, then every client live |
| 1:04 | Everyone signs in, then the workspace installed on every device |
| 1:16 | The Mango Drink: the alert, the label photo, the split from the sales history and the rules, the yes, the offer in Hindi, the orders live, the scheme filling, the UPI staff sale, Feeding India and its receipt, the papers |
| 2:16 | How the Mango Drink's swing adds up |
| 2:20 | The Masala Chips: two shops order, the lot countered and sold, 540 left, the van and the truck, destroyed on evidence, the certificate signed, Priya's second yes |
| 3:10 | On the record: the audit trail in Cloud SQL, one trace in Cloud Trace and its logs |
| 3:20 | How the chips' swing adds up |
| 3:29 | Impact's ledger, the year so far, and the batch's BRSR line |
| 3:39 | What comes next, then the guided demo to try, with its QR code |
| 3:49 | The close: where the sign-ins and the sample data are |

## How cut 6 is made

| Part | Tool | Where |
| --- | --- | --- |
| The photoreal keyframes | Qwen-Image 2.1 (bf16, local). The delivery at a kirana, and the wholesaler's truck as an edit on Agrawal's cast sheet (SC-187), so he is the man the film already shows. A shopkeeper reading his phone, two phones on a shop counter, and three shopkeepers from Tamil Nadu, Bengal and Gujarat. Each was looked at full size before use. The batch's real label is printed on every carton sticker (`labels.py`, `prep-keys.py`); on a shop's taller stickers it stays the right way up | `src/gen-qwen6.sh`, `src/prompts/`; `img/` with sidecars |
| The clips | LTX 2.5 Fast (local), 1080p, 5 s, a locked-off camera, from the labelled keyframes; each reviewed by contact sheet, and played frame for frame at 25 fps | `src/gen-ltx6.py`; `media/` with sidecars |
| The Record | Playwright on the virtual clock, on production, read only (writes aborted), Priya signed in through the project's own custom-token route | `src/capture-record.mjs` |
| The trace | Cloud Trace's API and Cloud Logging, read as the gcloud user | `src/fetch-trace.sh` |
| The voice | Maya1 (local), the warm narrator of cut 5, 6 takes a line, picked by Whisper and UTMOS | `src/lines.json`, `src/tts/` |
| The new scenes | the frame compositor | `src/parts6.py`, `src/shots6.py` |
| The sound | synthesised in numpy; SC-187's Lyria bed reused | `src/mix.py` |

**Found while checking:**

- **The opening:**
  - The first stamps were label-sized, about 75 px, so most were lost in the haze. Their rings landed on far labels,
    and on tracks along the shelf's beam that are not cartons.
  - Only cartons tracked steadily through the dolly are stamped now: two big ones across the near pallet's faces, and
    a run down its side.
- **The people:** the first cast cards stood on stems from their places. They covered the brand's mark and were gone
  in a second and a half. The map now docks into a card, with the cast in a panel beside it.
- **Lettering:**
  - A kicker's middle dot falls back to another face, wider than measured, which cut "MANGO DRINK" short. Kickers now
    have room to spare.
  - The agents' tool calls ran past their column into the windows beside them. They now wrap under the call's name.
  - The Hindi offer drew as boxes in a card, since Geist has no Devanagari. The pop-ups use the app's own pushes,
    shaped by Chromium.
- **Timing:**
  - The Mango Drink's swing was on screen for about a second after its line was shortened. Its bars now come quicker,
    and 0.6 s moved to it from pauses elsewhere.
  - The audit shot opened under the end of the sentence before it. Priya's second yes now holds over the papers being
    issued, and the record starts just before its own line.
  - The Record was captured again with a quicker scroll and a long rest on the audit trail. Detect's window, sped to
    1.40× by the tighter pacing, is trimmed to 1.26×. An Impact segment a hair under 0.46× is now 0.47×.
- **Layout:**
  - The kirana's phone sat with its name under the orders' headline. It moved down and is slightly smaller.
  - The deliveries' heading sat on a bright sky. The top left now has a shade.
  - On the end card, the sign-ins line landed before the addresses above it. They now land in order.
  - Pop-up cards are kept inside the frame.
- **The media:**
  - Labels printed sideways on a shop's taller stickers. They now stay upright on the sticker's white.
  - One sticker was misread against the truck's dark cargo. It is given by its corners.
  - The truck clip hoists a stack of cartons overhead at 3.6 s. The film leaves it at 3.2 s.
- **The logs:** the agents' log lines ran into their trace tags. Their run ids are shortened to their first six.

## The result

`media/smart-clearance-working-demo.mp4`: **3 min 57.0 s (237.04 s)**, under the 238 s cap.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dBTP true peak.
- Beside it are a 720p copy and the narration as `.srt`.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-14_19-41-20.mp4` (git-ignored), beside cut 5
  (`…_13-46-56`).

**Checks:**

- every new scene as stills at several moments, frame by frame where it moves, and the whole film as contact sheets
  every 2 s;
- every window plays between 0.47× and 1.26× (the labelled fast-forward aside);
- `cardscan.py` finds the stage's note-card green only in the app's own buttons: 74 frames in the same six windows as
  cut 5. The ring scan's 23 runs are the same spans cut 5 carried. The new and extended spans have none;
- both QR codes read back from the film's own frames:
  - the guided demo's: `https://smartclearance-demo.web.app`;
  - the carton label's: `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024`;
- the narration read back from the final mix, a slice a line: 26 of 31 lines word for word (cut 5: 24 of 30).
  - One slice hears "bags" for packs.
  - Two hear the brand as "Manchli" or "Munchli".
  - One writes "2.3 tons", and one the URL as one word.
  - Each take reads word for word on its own;
- the new keyframes looked at full size and the clips by contact sheet and full-size frames: no lettering invented, no
  extra hands or phones, every carton with its label.

**The spend:** nothing. Qwen-Image, LTX, Maya1, Whisper, UTMOS and Playwright ran on this Mac, and no paid model was
called. The music is SC-187's.

## Rebuild

From `src/`. It needs cut 5's media in place (SC-207's rebuild, which needs SC-206's), and reads the recordings from
the main checkout:

```sh
./gen-qwen6.sh && .venv/bin/python prep-keys.py dl-kirana dl-truck fs-whatsapp fs-native   # keyframes, labels printed
~/.local/bin/uv run --python 3.12 --script gen-ltx6.py                                    # the three clips
HOLD=12 SCROLL=110 END=160 node capture-record.mjs build/record2 && ./fetch-trace.sh      # the Record, the trace
(cd tts && .venv-snac/bin/python vo5.py 6 a01 a02 m04 m09 c01)                            # then mos.py and pick.py vo3/maya1w-warm
.venv/bin/python render.py && .venv/bin/python mix.py && ./export.sh && .venv/bin/python sidecars6.py
```
