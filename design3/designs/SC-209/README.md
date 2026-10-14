# SC-209 · The working demo, cut 7

Cut 7 of the demo film, after SC-208's cut 6. It follows the maintainer's notes on cut 6 ("This version is really
really solid and mind blowing, … a few more changes"), under the 239-second cap they set. It is made from:

- the same three production recordings of 13 Oct 2026;
- cut 6's pipeline and media (SC-208);
- new motion wherever the frame stood empty, and three new photoreal keyframes and one clip.

It joins the earlier cuts in the repository root's `working-demo/` folder, with its export's date and time in its
name.

## The brief

**The maintainer's notes on cut 6** (14 Oct 2026), "Total length less than 239 seconds":

1. The opening scene (the first 7 to 8 seconds, in the godown): more content and animation. "It needs to be really
   punchy and statement making."
2. The landfill: a better background, more animation and motion effects, and the food wasted and its ESG impacts
   shown.
3. The brand scene over the landing page: more engaging and animated, with more content, scenes and motion.
4. "The scheme fills": animation in the empty left of the frame.
5. The Negotiator: more animation and motion, and an explanation that ExpireSoon is an imaginary marketplace where
   near-expiry food is listed.
6. "Destroy them, and prove it": more animation and motion. "Infact wherever you see blank screen part, think hard
   and add animations and motion effects."

**Then, while it was being made:** "I need this scene background must, its really good", of the opening's godown. The
opening keeps cut 6's godown clip exactly; everything new there is laid over it.

**Then, on the first export of cut 7** (14 Oct 2026):

1. The landfill's background and camera motion seem unrealistic.
2. Between 22 and 25 seconds the scenes seem too rushed: "I cant see them. You can use time from somewhere else and
   make these scenes process gently" (the three brands' factories).
3. Name which of Google's models the agents use.

**Then, as the landfill was being re-shot:** "can we change this background completely with something unique and
aesthetic". Three concepts went to the maintainer as quick stills: A, an aerial trail of the batch's cartons across dark
earth; B, one carton half buried in light; C, the packs in rows on cracked earth under a dusk sky. The pick: **A**.

## What changed

| Part | Cut 6 | Cut 7 |
| --- | --- | --- |
| The opening | WRITTEN OFF stamped on the Mango Drink's cartons, a tally rolling up | over the same godown (note 1): a scan line sweeps the aisle and a tag drops onto each tracked carton with its product and days left, counting down as the calendar card turns from 1 Sep to 2 Oct 2026, day 0; the tags go as the stamps thump. Then the statement slams in, line by line with the voice: "1,580 packs." "22 days left." and the write-off rolling to "−₹22,657 written off.", over a shade that keeps the godown in view, with a red pulse on "write off" (`parts7.StampedGodown7`, `DateTicker`, `Statement`, `RedPulse`) |
| The bin | a still landfill, the cost panel | the batch's cartons in one long curving trail across dark earth, seen straight down at golden hour, every carton throwing a long shadow, kites' shadows on the ground (the maintainer's pick of three concepts, "something unique and aesthetic"): the drone slowly descending over it (LTX, from the still as picked), nothing else laid over it. On the bare earth either side of the trail: what destroying costs Munchly, row by row from money.js (stock, the GST credit taken back, disposal, EPR, −₹22,657), and what it costs the planet: 339.7 kg of food buried, 849 kg CO₂e (indicative), 3.2 kg of plastic packaging to EPR, 1,580 packs that never reach anyone, reported as waste under BRSR Principle 6 (`ESGPanel`) |
| The brand | the mark, the line, the landing page's workspace | the write-off rolls into what the plan recovers under the line, −₹22,657 to ₹16,917, "+₹22,194 better than the bin" (`RecoveryMorph`). Then three brands' factories (Munchly Foods' snack line, a tea line, a biscuit line, two of them new photoreal keyframes), each held 1.75 s on a slow push and cross-faded to the next, with its own workspace card sliding in at its own web.app address and the cards stacking (`BrandScene7`, note 3, and the second round's note 2: the line has 2 s more after it). Then "The best exit for every pack", as the voice reaches "exit": the batch's 1,580 packs flowing into ten agents turning on their ring and out to five exits, the three the plan uses counting up to 1,372, 150 and 58, ExpireSoon "not this time: needs 30+ days" and destruction "the last resort" (`ExitFlow`) |
| The models | "think with Gemini" | Google's models named wherever the agents work (the second round's note 3), as the agents' code sets each one's tier: Gemini 3.1 Pro (`gemini-3.1-pro-preview`) for the Valuer, the Router and the Negotiator's bids; Gemini 3.8 Flash (`gemini-3.8-flash`) for Data, Vision, Outreach, the Lister, the Negotiator's chat, Paperwork and Impact; the Watcher runs rules on BigQuery and calls no model. They are on the architecture's Gemini layer and its tag, beside each agent as the walk reaches it (kept there, so the walk ends with every agent named), and in each agent's header as it works (`MODEL`, `model_chip`) |
| Detect | the Watcher's alert | the sell-through drawn: 28 packs a day for 15 selling days sells 420 of 2,000; 1,580 will not (`SellThrough`) |
| The offer | the Hindi push | Lakshmi Agencies' 58 kiranas as a map, their areas round the Begum Bazaar godown (design3's own world), the offer going out as a ring that lights each shop (`KiranaMap`) |
| The scheme fills | Priya's Execution, fast-forwarded | the map on the empty left (note 4), each shop lighting with its order as Priya's live screen beside it counts them. The map's counts are the recording's own, read off it frame by frame (9 of 58 at 0.3 s … 51 at 2.7 s, then "Filled at 10:32: 52 of 58"), so the two never disagree. Under it, one GST invoice per order, the stack counting to 52 from LA/26-27/0972 (`InvoiceStack`). The fast-forward badge now reads the 52× the window plays at |
| The chips' week | Rakesh's tablet | Rakesh Traders' 38 kiranas as a map: the offer out, two shops ordering, 35 crossed out as they say not this time, one silent (`KiranaMap`, `sad_states`) |
| The lot | the Negotiator's card | ExpireSoon, "an imaginary marketplace", made up for this demo: brands list near-expiry food, and bulk buyers bid on the lots (note 5; `ExpireSoonCard`, and in the voice). Then the negotiation on one price line: listed ₹15.00, Agrawal's bid ₹13.00, Munchly's reserve ₹13.50 (never shown), the Negotiator's counter sliding down from the ask to ₹14.20, and the deal: 772 packs, ₹10,962.40, a ₹1,644 token (`PriceLadder`) |
| The window closes | Priya's screen | the window's clock running out and locking, then 588 offered, 48 ordered, 540 left, each bar growing to its count (`WindowFunnel`) |
| Destroy them, and prove it | Rakesh's screen | the route from Kalamna Market godown to Bhandewadi sanitary landfill, the authorised agency's truck driving it, and the proof Munchly asks for, step by step (`ProofPlan`, note 6) |
| Destroyed, against evidence | the two photos | Vision reading each photo as it lands, a scan line over it, then its checks under it: the batch slip, about 540 packs, the slate, taken today (`VisionScan`) |
| Signed in place | Rakesh's screen | the certificate's four places signed one after the other with the signers' own strokes (design3's `STROKES`) (`SignSlots`) |
| The second yes | Priya's review | Vision's four checks ticked, then Priya's second yes, the papers issued (`ChecksPanel`) |
| The UPI staff sale | the payments list after the payment | the list fills as the phone pays |
| Feeding India | the receipt alone | beside it, what Feeding India received: 58 meals lighting one by one, 12.47 kg kept out of landfill (`DonationMeals`) |
| Impact | the ledger | under the cards, where the year's food went on one scale: 2.07 t resold, 224.6 kg donated, 68.4 kg destroyed; 930 meals, 97.1% saved (`KiloBars`) |

**The voice.** One line is new: s02, "On ExpireSoon, an imaginary near-expiry marketplace, the Negotiator counters a
bid, and seven hundred and seventy-two packs sell." Its 6 Maya1 takes were picked by Whisper's read-back and UTMOS
(`tts/pick.py`). The brand's line has 2 s more after it, for the factories; to keep under the cap, the pause after the
bin is 0.5 s shorter, and a few others a tenth to three tenths of a second.

**Sound.** `mix.py` follows cut 7's shots (`shots7`) and gives each new motion its own sound: a sparkle as the scan
finds the cartons, a soft tick each day the calendar turns, a thud as each line of the statement slams in, a tick for
each ESG row, a chime as the recovery lands, a whoosh for each factory, ticks as the exits light and a sparkle as the
packs flow, a ping for each order on the maps and a low tick for each decline, the invoices shuffling, the price line's
bid, counter and deal, the window locking, the agency's truck, the pen for each signature, Vision's sweep and ticks,
the meals lighting, and the year's bars.

## The film

| When | Part |
| --- | --- |
| 0:00 | A distributor's godown at dawn: the scan, the days running out, the cartons stamped WRITTEN OFF, the statement; the dive into a carton's best-before |
| 0:10 | The bin: the batch's cartons in one long trail across dark earth, seen from above; what destroying costs Munchly and the planet |
| 0:14 | Smart-Clearance turns the write-off into recovery; three brands, each its own workspace, at an easy pace; the best exit for every pack |
| 0:28 | The architecture in depth, the models named, then the agents' walk in full, each agent with its model |
| 0:40 | Munchly Foods, its distributors, kiranas and exits; the people you'll meet; the two batches |
| 0:56 | The console, the sign-ins and the installed app |
| 1:16 | The Mango Drink: the alert and the sell-through, the label, the split, the yes, the offer and the map, the scheme filling with its invoices, the UPI staff sale, Feeding India's meals and receipt, the papers |
| 2:16 | How the Mango Drink's swing adds up |
| 2:20 | The Masala Chips: the map of declines, ExpireSoon and the price line, the window closing on 540, the van and the truck, the proof asked for, Vision's checks, the certificate signed, Priya's second yes |
| 3:12 | On the record: the audit trail in Cloud SQL, one trace in Cloud Trace and its logs |
| 3:22 | How the chips' swing adds up |
| 3:32 | Impact's ledger, the year so far, where the food went, and the batch's BRSR line |
| 3:41 | What comes next, then the guided demo to try, with its QR code |
| 3:52 | The close: where the sign-ins and the sample data are |

## How cut 7 is made

| Part | Tool | Where |
| --- | --- | --- |
| The photoreal keyframes | Qwen-Image 2.1 (bf16, local): a tea packing line and a biscuit line for the brand scene, each looked at full size before use | `src/gen-qwen9.sh`, `src/prompts/`; `img/` with sidecars |
| The bin's background | three concepts as Qwen-Image previews (`gen-qwen9c.sh`), the pick's clip made with LTX 2.5 Fast (local), 1080p, 5 s, one camera glide (`dolly_in`) from the preview as picked; reviewed by contact sheet and full-size frames | `src/gen-qwen9c.sh`, `src/gen-ltx9.py`; `img/` (the pick and the two not picked) and `media/` with their sidecars |
| The factories in depth | Depth Anything V2 depth maps, 2.5D push | `src/depth.py` |
| The kiranas' maps | design3's own world: 38 shops round Kalamna Market, 58 round Begum Bazaar, their areas and orders | `src/dump-kiranas.mjs`, `src/kiranas.json` |
| The voice | Maya1 (local), cut 5's warm narrator, 6 takes of the new line, picked by Whisper and UTMOS | `src/lines.json`, `src/tts/` |
| The new motion | the frame compositor | `src/parts7.py`, `src/shots7.py` |
| The sound | synthesised in numpy; SC-187's Lyria bed reused | `src/mix.py` |

**Found while checking:**

- **The bin's background, three times over:**
  - a landfill at dusk, the batch's labelled cartons tipped from a dump truck. LTX's first take slid the whole heap down
    the slope like a river and bloomed the labels, so the first export laid its moving sky over a still heap under a
    digital push, which the maintainer found unrealistic;
  - a second take, one real camera glide over a still heap with the labels tracked onto it as on the opening's cartons,
    was made, until the maintainer asked for something new altogether;
  - the aerial trail, picked from three concepts.

  The landfill's keyframe and both takes stay local; the record is in `gen-qwen9.sh`, `prep-keys.py` and `gen-ltx9.py`.
- **The bin's panels:** on the first landfill, what the bin costs the planet sat over the dump truck. On the aerial
  trail they sit on the bare earth either side of it, and the cost total lands 0.7 s sooner than at first, so it is
  read before the cut.
- **The brand scene:**
  - the recovery landed at the whip into the first factory and was gone at once. It rolls in on "into" now, and the
    whip waits 0.15 s longer;
  - the kicker over the bright factories could not be read. It sits on a glass chip;
  - the exits' counts ran off the right edge. The flow moved left.
- **Lettering:** a light weight's last glyph was clipped ("a scheme in their languag"): `text_w` measures some light
  weights a few pixels short. Every text sprite is now drawn on a wider canvas and cut to its ink (`parts3.text_sprite`).
- **The scheme fills:** the map's counts first ran on their own clock, so it read 22 of 58 shops where Priya's live
  screen beside it read 46. The map now follows the screen's own counts, read off the recording frame by frame, and the
  fast-forward badge reads the 52× the window plays at (it said 61×).
- **The price line:** the reserve's and the deal's words collided under the line, and the scale's ₹13 and ₹15 sat under
  the labels. The reserve's words now end at its pin and the counter's begin at its pin; the scale sits just under the
  line, ₹13 and ₹15 left to the bid and the ask, ₹14 giving way to the deal's ring.
- **The chips' map** read "0 said not this time" before the first shop said it. That line now waits for the first.
- **Vision's checks** on the two photos came in as the shot dissolved. They now follow each photo's sweep at once.
- **The meals:** an unlit dot drawn with no glow divided by zero. Unlit dots take the smallest glow.
- **The second round:**
  - the aerial clip's descent was quick for its 4.6 s; it is eased 1.3× by motion interpolation;
  - "The best exit for every pack" first faded in over the last factory; it waits for the cross-fade to end, and its
    counts land 0.8 s sooner, so they hold before the cut;
  - the walk's model tag over Vision fell off the top of the frame as the camera pushed in; a tag near the top sits
    under its agent instead;
  - the re-timing pushed the Watcher's screen to 1.31×; its recording is trimmed 0.3 s, to 1.26×.

## The result

`media/smart-clearance-working-demo.mp4`: **3 min 58.7 s (238.72 s)**, under the 239 s cap.

- 1920 × 1080 at 25 fps, H.264 crf 21, with AAC 48 kHz audio at −14.0 LUFS integrated and −1.5 dBTP true peak.
- Beside it are a 720p copy and the narration as `.srt`.
- The crf-17 master is `working-demo/smart-clearance-working-demo-2026-10-14_23-55-28.mp4` (git-ignored), beside cut 6
  (`…_19-41-20`). The first export of cut 7, before the second round, is kept as `…_21-10-50-superseded`.

**Checks:**

- every new scene as stills at several moments, and the whole film as contact sheets every 2 s;
- every window plays between 0.47× and 1.28× (the labelled fast-forward aside);
- `cardscan.py` finds the stage's note-card green only in the app's own buttons: 74 frames in the same six windows as
  cut 6. The ring scan's 23 runs are the spans cut 6 carried;
- both QR codes read back from the film's own frames:
  - the carton label's: `https://id.munchly.example/01/18900000001061/10/MF-2410-118?17=261024`;
  - the guided demo's: `https://smartclearance-demo.web.app`;
- the narration read back from the final mix, a slice a line: 26 of 31 lines word for word (cut 6: 26 of 31), the new
  ExpireSoon line among them. Of the rest, one slice hears "batcher's" for batch's, two hear the brand as "Manchli",
  one writes "2.3 tons", and one the URL as one word; each take reads word for word on its own;
- the new keyframes and the bin's clip looked at full size and by contact sheet: no lettering invented.

**The spend:** nothing. Qwen-Image, LTX, Maya1, Whisper, UTMOS, Depth Anything and ffmpeg ran on this Mac, and no paid
model was called. The music is SC-187's.

## Rebuild

From `src/`. It needs cut 6's media in place (SC-208's rebuild, which needs the earlier cuts'), and reads the
recordings from the main checkout:

```sh
./gen-qwen9.sh && ./gen-qwen9c.sh                                               # the factories; the bin's three concepts
~/.local/bin/uv run --python 3.12 --script gen-ltx9.py w2-aerial                # the bin's clip, from the pick
tts/.venv-snac/bin/python depth.py img/b2-factory-tea.png && tts/.venv-snac/bin/python depth.py img/b3-factory-biscuits.png
node dump-kiranas.mjs ../../.. > kiranas.json                                    # the kiranas' maps, from design3's world
(cd tts && .venv-snac/bin/python vo5.py 6 s02)                                   # then mos.py and pick.py vo3/maya1w-warm
.venv/bin/python render.py && .venv/bin/python mix.py && ./export.sh && .venv/bin/python sidecars7.py
```
