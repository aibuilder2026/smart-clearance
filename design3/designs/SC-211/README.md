# SC-211 · The sales film v2

The sales film of SC-210, reworked and lengthened: 6 min 50 s (410.08 s), inside the 400 to 420 seconds asked for. It tells Smart-Clearance's whole journey with its agents as
the app's own graph, the brand's rules as guardrails and two human gates, the record traced end to end, and ten people
talking to the camera. Everything new was made on this Mac: Qwen-Image, LTX, Maya1, Whisper, Playwright and ffmpeg,
with no Google model called. It names no client, person or product, and sits in the repository root's
`landing-demo/sales-film/` folder, its export's date and time in its name.

## The brief

**The maintainer's request (15 Oct 2026), on the SC-210 film:**

1. The opening: nothing animating in the top left; more motion and animation.
2. At about 50 s, the factory worker's white-screen tablet looked odd.
3. The agents' "solar system" as a graph like the app's, really cinematic, with sound effects, more content and
   pop-overs about the agents running, and how the whole process is guardrailed by the brand's rules and gated behind
   human approval.
4. The people who speak looking at the camera, as the food bank's volunteer does, better transitions out of their
   scenes, and more dialogue with lip sync, all made locally.
5. More content and animation, 400 to 420 seconds long.
6. No "Live on production" tag.

Only local tools (Qwen Image, LTX, ffmpeg, Remotion and local audio). Stunning light and cinematic transitions. The
whole journey end to end; the agents clear but not technical ("hosted on Google's cloud, thinking with the latest
Gemini models"); end-to-end telemetry and audits. Reviewed for glitches and timing.

**Added during the work:** the graph's animations and its button clicks with sound, chic; whenever someone looks at a
screen, a pop-up of what they see or the notification they receive; the app as a progressive web app, installable on
any device; new images and clips made locally as needed; and the installed ffmpeg skills used throughout.

## The film

| When | Part |
| --- | --- |
| 0:00 | **The waste.** A slit of light opens on a distributor's godown at dawn; a scanner tags every carton's days to its date, the month running out, and the camera dives into one label: best before, 22 days left. A distributor, to the camera: "Sixteen hundred packs, and twenty-two days left. The app won't take them now." Rejected at the dock (the checker's tablet pops up); the bin, with what destroying the batch costs; week after week, brand after brand, WRITTEN OFF. At dawn a phone lights up with a plan |
| 0:38 | **The product.** Smart-Clearance: software as a service that turns write-offs into recovery. Every brand its own secure workspace (the factory tablet now shows it), onboarded in minutes from one console. Every team sees its own part: the supply chain, the distributors, the kiranas, the food banks. A progressive web app: installed from the browser in two clicks, on a laptop, a tablet and a phone, every alert a notification. The platform team watches every client, batch and agent live, and says so: "From here I see every client and every agent, live" |
| 1:39 | **The agents.** A team that never sleeps, as the app's graph in depth: a spark runs its path, ten agents light, hosted on Google's cloud with the latest Gemini models. Each opened with a click: what it does, the rule it keeps, its model. The brand's rules laid on as guardrails, their shields landing on the agents they bind. The brand's head: "We set their rules once. The agents do the legwork, and nothing moves without our yes." The plan stops at the supply chain lead's Approve; a destruction at the second yes; every run and yes on the audit trail, traced end to end, ready for an auditor |
| 3:05 | **The journey.** The Watcher flags the batch; one photo, read by Vision (her phone pops up, sent then read); the Valuer and the Router; the lead: "Kiranas, a staff sale, the food bank, and nothing to the bin. Approved." One tap. The offer in Hindi; orders live with GST invoices; a kirana owner: "The offer came in Hindi, right on my phone"; a shopkeeper: "Delivered this morning, invoice and all"; the staff sale by UPI; the food bank: "Fifty-eight packs. That's fifty-eight meals tonight"; the marketplace and its counter; the buyer: "Fourteen-twenty a pack? Done. Send the truck"; the hardest case, destroyed against evidence, signed at the landfill: "All four signatures. Now it's on record"; the second yes |
| 5:11 | **The papers, the money, the record, the impact.** Every paper drafted, signed and filed (the credit note pops up on the distributor's laptop); how the swing adds up; the distributor of the opening, weeks later: "Every credit note came in on time. We ended whole, to the rupee." Every request traced; which agent did what, who said yes, and when, in one audit trail exported for the auditor; the platform watching itself, a model call timing out, alerted and recovered; the impact ledger, ready for BRSR |
| 6:19 | **The close.** What it plugs into, on every device; "Smart-Clearance. Ten agents. One yes. And nothing good goes to waste." (the two at the screen reading the ledger); the guided demo to try, with its QR code |

## What changed from SC-210

| Asked | Done |
| --- | --- |
| The opening | A slit of light opens on the godown; the wide frame's bars hold while a scanner tags each carton's days to its date, then draw back as the camera dives into the label. Volumetric rays and dust; nothing in the top left (the calendar card is gone) |
| The white tablet | The biscuit factory's tablet shows the brand's workspace watchlist, painted only over the screen's own white so the gloved finger stays in front (`src/tablet11.py`) |
| The agents as a graph | `src/graph11/`: the app's graph in depth. A spark runs the team's path before it wakes; the ten agents light; the camera flies to each, the pointer clicks it open, and a card says what it does, the rule it keeps and the model it thinks with. The brand's rules are laid on the graph as guardrails, their shields landing on the agents they bind. The plan stops at the supply chain lead's Approve, clicked, and a destruction at the second yes. The audit trail fills, every request traced, ready for an auditor. Each event and click has its sound |
| The people talking | Nine scenes made by LTX on this Mac with their voices (the speaker looking into the lens), plus the food bank's volunteer from SC-210. New: the brand's head, a kirana owner, the platform team and the distributor of the opening, weeks later. Each scene starts and ends with the person settling; hand-overs into and out of them are whips, push-throughs and light leaks |
| More content, 400-420 s | Every team's part (`src/teams11/`); installed as a PWA on a laptop, a tablet and a phone, with every alert a notification (`src/pwa11/`); one audit trail (`src/audit11/`); the platform watching itself (`src/ops11/`) |
| Pop-ups | What each person sees: the dock's inbound check, the plan's notification at dawn, the label photo sent and read, the credit note on the distributor's laptop, the impact ledger the two read at the close (`ScreenPop`, `PhonePopAt` in `src/parts11.py`), with SC-210's pushes |
| No live tag | Gone |
| Light and transitions | A hand-over chosen for every cut (whip, push-through, light leak, flash, dip, focus pull: `transition()`), and a bloom on the brightest shots |

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| The narrator | **Maya1** (local, the working demo's warm Indian storyteller), three takes a line, the best kept by **Whisper**'s read-back (mlx, large-v3-turbo); the line Whisper heard as "badge" retaken until it read "batch" | `src/tts/vo5.py`, `src/tts/pick.py`, `src/lines.json` |
| The talking scenes | **Qwen-Image 2.1** (bf16, local) edits of the working demo's own keyframes, each speaker turned to the lens and every screen facing away; cartons whose labels came back garbled cleaned to plain cardboard; the shopkeeper's frame cropped closer and given its detail back. Then **LTX 2.5 Fast** (local, LTX Desktop), 720p, the voice made with the picture, so the lips are made with the words. Each read back by Whisper, cut to its spoken window with half a second of the person before and after, scaled to 1080p by lanczos with the 0.12 sharpening the stitch-videos-ffmpeg skill measured | `src/gen-qwen11.sh`, `src/gen-qwen11b.sh`, `src/prompts/talk11/`, `src/gen-ltx11.py`, `src/ltx-talk.json`, `src/talkwin11.py`, `src/prep11.py`; `media/keyframes/`, `media/talk/` with sidecars |
| The scene pages | HTML and JavaScript drawn frame-exact in headless Chromium on the narrator's own word timings (each page's `renderAt(t)`, captured frame by frame, as Remotion renders), each reporting its sounds: the agents' graph (`graph11/`), every team's part (`teams11/`), installed as an app (`pwa11/`), the audit trail (`audit11/`), the platform watching itself (`ops11/`). Screens are the production app as recorded | `src/capture-page.mjs`, `src/capture11.sh` |
| The cut | the frame compositor (numpy and OpenCV, 1920 × 1080 at 25 fps), with a hand-over chosen for every cut and a bloom on the brightest shots | `src/parts11.py`, `src/shots11.py`, `src/render11.py` |
| The sound | the stitch-videos-ffmpeg skill's mix: the voices set to -16 LUFS and the bed to -24 LUFS from measured passes; the bed ducked by `sidechaincompress` keyed on the voice's smoothed envelope, held through each talking scene (about 12 dB, 18 in the voice's presence band); `amix` without normalising; two-pass loudnorm to -14 LUFS. Each talking scene in its own space over its own room tone. Sound design synthesised for every hand-over, every scene page's event and click, every stamp, pop-up and shutter. The score is SC-210's six Lyria cues, reused (nothing generated now) | `src/mix11.py` |
| The exports | the ffmpeg skills' settings: one harmonising grade over the joined film; a crf-17 master, a YouTube copy, the repository's 1080p copy under 95 MB, a 720p web copy, a phone preview under 30 MB, a palette GIF of the graph; every output's frames, A/V lengths and loudness checked | `src/export11.sh` |

## Found while checking

- **Garbled lettering on the keyframes.** Qwen's edits redrew the distributor's and the buyer's carton labels as
  gibberish; both were cleaned to plain cardboard before LTX saw them.
- **A talking scene's voice came back as gibberish.** LTX's first take of the brand's head said "Before its next model,
  Udi Small Iron Man Seal"; the second said "our eyes" for "our yes"; the third reads back word for word and is used.
  Every scene is read back by Whisper before it is cut.
- **LTX moves its camera** even when told to hold still: most scenes push in from a medium shot to a close-up. The
  compositor's own push on talking scenes was taken off, so the two never add up.
- **Two faces ghosting.** Light-leak dissolves out of a talking scene put one face through another (the volunteer into
  the buyer, the man at the landfill into the second yes); every exit from a talking scene is now a whip, the switch made
  under the motion blur, and the push-through switches within a sixth of its length.
- **Pop-ups in the wrong place.** The dawn notification sat over the woman's face (it now lands over the trees, its stem
  down to her phone); the dock checker's card named the Mango Drink over a carton of chips (it is generic now); the
  verify screen first chosen carried the recording stage's green note card, which names a client (a clean window, 118 s
  to 124 s, is used).
- **The opening's first seconds were empty** in the graph: the title arrives with its line, the agents show as
  silhouettes, and a spark runs the team's path before it wakes.
- **The teams scene** dropped its headline after a second, and its pull-back finished as the scene ended; both fixed.
- **A name clash:** `parts.LEAD` (the timeline's lead-in) shadowed the supply chain lead's role tag; the imports are
  ordered so the person wins.
- **Sound:** the graph's events were named `type` where the other pages say `kind`, and its sounds were silently
  dropped until the mixer read both. AAC overshoots the true peak by a few hundredths, so the loudnorm target is -1.5 dBTP
  for a delivered -1.3.

## The result

`media/smart-clearance-sales-film-v2.mp4`: **6 min 50.1 s (410.08 s)**, 1920 × 1080 at 25 fps, H.264 high profile, two
passes at 1,614 kbps (93.0 MB, under GitHub's limit), AAC 192k at 48 kHz.

- The master, crf 17 (489 MB), its 720p copy, a phone preview (960 × 540, two passes, 28.9 MB) and the captions are in
  `landing-demo/sales-film/` at the repository root, named `smart-clearance-sales-film-v2-2026-10-15_11-40-29`
  (git-ignored); a YouTube copy (crf 18, high profile, a GOP of 2 s) stays in `src/build/`.
- Beside the film: a 720p web copy (65 MB), the captions (`.srt`), a GIF of the agents opening one by one
  (`smart-clearance-agents-graph.gif`), the nine talking clips made here (`talk/`) and the keyframes they were made from
  (`keyframes/`), each with its sidecar.

**Checks:**

- **Every output:** 10,252 frames (the film's length to the frame), the sound within 11 ms of the picture.
- **Loudness:** −14.07 LUFS integrated, −1.38 dBTP true peak on the master.
- **The read-back:** every line read from the final mix by Whisper: 43 of 48 word for word. The rest are its spellings:
  "Everyday", "PACs", "in, on tap" for "in one tap", "credit not" for "credit note", and the URL as one word.
- **Lip sync:** each talking scene's sound sits within 5 ms of where its clip's first frame plays (cross-correlated
  in the mix); each clip's mouth was checked against its words frame by frame.
- **The duck:** the score sits about 12 dB under every line, 18 in the voice's presence band.
- **The whole film** as contact sheets every 3 s, and every pop-up, transition and talking scene as stills.

**The spend:** nothing. Qwen-Image, LTX, Maya1, Whisper, Chromium and ffmpeg ran on this Mac. The score is SC-210's
Lyria cues, reused; no Google model was called.

## Rebuild

From `src/`. It needs SC-210's media in place (hard-linked or copied) and reads the recordings from the main checkout:

```sh
./gen-qwen11.sh && ./gen-qwen11b.sh                                # the talking scenes' keyframes
(cd tts && ../../../SC-209/src/tts/.venv-snac/bin/python vo5.py 3 $(cat ../narr-ids.txt))   # the narrator, three takes a line
(cd tts && uv run --with mlx-whisper python pick.py vo3/maya1w-warm)                          # the best take of each
uv run --python 3.12 --script gen-ltx11.py ltx-talk.json && uv run --python 3.12 --script gen-ltx11.py ltx-retake.json
uv run --script talkwin11.py && .venv/bin/python prep11.py        # each scene's spoken window, read back; the clips cut
.venv/bin/python tablet11.py && .venv/bin/python sidecars11.py
./capture11.sh                                                     # the scene pages, on the narrator's cues
.venv/bin/python render11.py --workers 10 && .venv/bin/python mix11.py && ./export11.sh
```
