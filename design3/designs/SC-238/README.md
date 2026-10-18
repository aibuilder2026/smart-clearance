# SC-238 · The landing demo film v3, "Twenty-Two Days"

The landing page's demo film remade as a short film that is still a product guide and a sales pitch. A batch of mango
drink has twenty-two days left and no app will take it; in one morning ten agents and one yes find every pack a home.
It replaces SC-211's sales film v2 on the landing page's theatre, draws on the four-minute working demo (SC-219 and
SC-228), and was made on this Mac with local tools only: Qwen-Image, LTX 2.5, Maya1, Whisper, UTMOS, Remotion, three.js,
RIFE, Apple's VideoToolbox, Playwright and ffmpeg. No paid or Google model was called. It names no client, person,
product brand, workspace address or batch in its words (SC-28); the app's own screens show the story's sample workspace
as built.

The director's book is [`script.md`](script.md); the storyboard critic's report is in [`review/`](review/).

## The brief

**The maintainer's request (16 Oct 2026), on SC-211's film:**

1. Draw on the working demo.
2. The glitch at 4:48: the photo being taken showed a hand through the tablet at the landfill.
3. The papers were all tilted.
4. The pointer pointed at the wrong place, "like this all over".
5. FSSAI's guidelines highlighted in detail.
6. Professional scene transitions.
7. Sound effects all over; no blank portion of any screen.
8. The agentic flow made to stand out with 3D animation and effects.
9. The screen people watch must match its pop-out.
10. Every scene with video or motion, not still photos; blurred backgrounds must be video too.
11. Talking characters realistic, like a short movie: "act as director and write script, take care of all lighting and
    camera effects and animations".
12. The glitchy, blurry transitions fixed.
13. Backgrounds like the papers scene with video under a green overlay that tells a story.

No architecture section; the entire journey; super-real video and speech; a high-quality final render, reviewed
thoroughly; local tools only; 450 to 480 seconds. **Added during the work:** 60 fps, smooth and never laggy, with RIFE
for the interpolation; the editing-videos and business-motion-film skills for the review.

**Pass 12 (17 Oct 2026), on the 14:49 master:**

1. The opening godown's fix from the working demo (SC-239): its two walking workers, whose hands merged as the
   forklift's load passed, painted out.
2. "Have the video at 25fps as before, 60fps is causing noise. I need you to make it smooth and background noise less."
3. "No other changes needed, everything is fine in terms of content."

The film keeps the 14:49 master's edit, frame for frame in time. Pass 11's work after it (VideoToolbox at fractional
rates and exact clip times, the motion check, and r4's content changes) was kept aside on the branch
`SC-238-pass11-wip`; only its tooling fixes are in this pass.

**Pass 13 (18 Oct 2026, SC-245), on the pass 12 master as it plays on YouTube; no change to the story or the script:**

1. 1:07, the turn's sunrise: the take's two workers faced the camera while they drifted away from it, so they read as
   walking backwards. The aisle was taken again with no one in it: a local Qwen-Image edit of the take's own keyframe
   without the workers (`img/godown-sunrise-empty-245101.png`, `prompts/sc245/`), then LTX 2.5 on it with only the
   light moving (`clips/godown-sunrise-empty-245111.mp4`; `ltx-jobs-sc245.json`). The forklift stays parked, backlit.
   Painting the workers out was not possible: the take's whole aisle reshapes as the camera moves.
2. 2:06, the agents in 3D:
   - **The roll-call** (`agents3d/`): on "Ten agents" the ten rise one by one as large cards, each with its number,
     icon, name and job, on a route that draws under them. On "Gemini" a beam runs from the orb to each of the nine
     that think with it, and its model's pill comes up. On "Watcher" the Watcher steps forward with "Plain rules" while
     the rest dim. As the line ends, each card flies down into its station, which flares as it lands. Then the tour of
     the stops, as before; the first stop waits 0.6 s longer for the cards to land.
   - **Sharp agents:** the depth-of-field pass read each agent's lit outline (a line, hidden from its depth pass) as
     far background and blurred it by up to 14 px. The agents' slabs and icons now write the focus distance into that
     pass, so they stay sharp. The blur is shallower (8 px at most), the shutter shorter (0.3 of a frame) and the colour
     fringe half.
   - **The orb:** the move from the roll-call to the first stop flew through Gemini's orb, which filled the frame
     violet for a few frames. The orb and its beams now fade as the lens nears them.
3. 5:18, the distributor's tablet at dusk: his 5 s take has both thumbs come onto the glass at 2.5 s, the left one
   pressing where his screen has nothing. Turned back and forth over a 12 s shot, it pressed there again and again.
   His screen has no control at that spot anywhere in this part of his recording, so the press can't be made true.
   The shot now uses only the take's first 2.2 s, both thumbs on the bezel: a slow, steady read (`screens.py`'s
   `tmap`). His screen plays his recording at its own pace: the chips batch arrives on his Today, flagged by the
   Watcher, and its request follows. It no longer holds three seconds over twelve.
4. YouTube's header covers the top of the frame. The pop-overs that sat there moved to the foot's right, above
   YouTube's controls (`SAFE` in `kit/ui.tsx`): the call card, the batch card, the godown's date, the journey's clock,
   and each agent at work with its calls typed above it. The landscape tablet, the portrait tablet, the phone and the
   laptop each moved a little left to clear it. A window's card stays between 200 px from the top and 330 px from the
   foot. The bin's bill, the teams' and the audit trail's titles moved below the header. The install page's words
   moved to its clear column at the top right, below the header, as its laptop fills the foot. The papers' title moved to the paper's left, so it never covers a signature. The
   captions along the foot moved up above the controls.
5. No blank or resting frame: the bin's eight black frames are now its heap, darkening. A held app screen drifts 5%
   (it was 3%). The rule's last strip, the teams' row and the audit trail each drift as they are read.
6. 0:16, the godown's tags read as shaky: their days changed every frame, their scale changed every frame (so their
   text was drawn again each time), and twelve crowded the frame. Each tag now keeps one size, the six that stay
   longest in the middle of the frame are tagged, and the days step a week at a time with the date chip, each step
   flipping in.

## How each point was met

| Point | Done |
| --- | --- |
| 1 · the working demo | The three production recordings it used (the console of 16 Oct, the mango and the chips of 13 Oct) are the film's app screens, cropped at their own pixels from each device's screen |
| 2 · the hand through the tablet | The destruction is filmed at an authorised landfill, one place throughout: the pit, the distributor filming over his shoulder (the app's camera live in his tablet's glass, tracked frame by frame, `src/track.py`, `src/xcam.py`), the packs slit open and emptied, the earth over them, the two photos landing in the app, the officer and the witnesses signing on his tablet (their hands on its far side, the app's own sign sheets lifting from it), his line to the lens, the send and Vision's checks; no hand ever crosses a screen |
| 3 · tilted papers | Every paper is the Paperwork agent's own PDF, flat and square, the camera gliding down it to the line the voice names |
| 4 · the pointer | No pointer is drawn: the cursor is the recording's own. Every ring and card is placed on a pixel grid of the recording's frame (`gridframe.py`) and timed to the span it sits on, held long enough to read and gone before its screen changes; the recording stage's own rings, dims, note cards and chapter cards are scanned out of every span (`ringscan.py`) |
| 5 · FSSAI | The rule scene: FSSAI's direction to e-commerce food businesses (Nov 2024) large on its own first, its floor on three shelf lives (the lower of 30% and 45 days); then beside the quick-commerce apps' stricter gates on the same three lives, line for line, in the middle of the frame; then both a strip over the batch's own 180-day life sliding to 22 days, below every line |
| 6, 12 · transitions | Cuts on action and on sound, J and L cuts, pushes and match cuts (the mark the turn's light leaves is the platform's); the papers' footage cuts mid-slide; the 3D gate is an arch the camera pushes straight through; no dissolve between two pictures, no dip to black, no flash or blur in any transition; both ends of every shot rounded to the same frame, so no black or dim frame falls between two shots |
| 7 · sound | A room tone for every place, under the footage the scenes draw too, a sound for every lift, ring, card, tap, check, call typed, clock, stamp and shutter and for every event of the captured scenes, and under every cut into new footage that nothing else marks, under SC-210's score ducked from 1 to 9.5 kHz under every word, the film ending in silence (`mix.py`); no hiss: each talking clip's own sound is denoised, and each room tone, once copied from a generated clip's near-silent gaps (its codec's hiss, raised 50 dB), is held under a falling ceiling above 700 Hz and set 7 dB lower; every frame carries footage or a graphic |
| 8 · the agents in 3D | `src/agents3d/`: the mark's route as a lit road over aerial footage of the godown, the town and the lanes (graded green), nine stops, ten agents, the person's gate an arch of bronze the camera pushes through, Gemini above, the rules as rails, the shield round the money; every event heard |
| 9 · screen and pop-out | A person's screen is the app's real screen set into the glass of their device (over the shoulder, tracked frame by frame), or a device held with its back to the camera whose screen then lifts out; the window is the same recording, from the same frame. The lead holds a tablet at her desk, as her screens are a tablet's |
| 10 · motion everywhere | Every background is footage, and a clip shorter than its shot turns back at its end rather than holding a frame; every graphic moves in on its word, holds while read, and leaves; the install scene and the issued papers keep moving through their holds |
| 11 · a short film | Two phone calls bookend it; the people speak only where a person would, one speaker a clip; whoever speaks alone looks into the lens (the kirana owner, the brand's head, the food bank volunteer, the shopkeeper, the wholesale buyer, calm, the distributor at the landfill), the calls and the lead's answer stay conversations (LTX made each voice with its picture; every take read back, and made again where it misspoke); one face for each role, every new keyframe an edit of that person's own |
| 13 · papers over green video | The record's papers lie over the footage of what each records (the truck, the godown, the office, the food bank, the landfill), one paper at a time, graded green, the certificate's destruction log in place of the certificate read with the chips; the audit trail plays over the office, the evidence check over the landfill, the issued papers over the distributor at his stack |

## How it is made

Everything is driven by one edit decision list, so the picture and the sound read the same cue sheet.

| Step | Script | What it does |
| --- | --- | --- |
| The plan | `src/plan.py` | The edit decision list: every scene, shot, line, ring, card, agent head and clock chip, timed on the narration's own words (Whisper's word times); writes `film/src/film.json`, `build/media.json` and `build/timeline.txt`; closes any gap between two shots |
| The voice | `src/tts/` | The narrator, Maya1 run locally (the working demo's warm Indian storyteller), three takes a line, picked by Whisper's read-back and UTMOS |
| The people | `src/gen-qwen*.sh`, `src/gen-ltx.py` | Qwen-Image keyframes (edits of the earlier films' cast sheets, so each face stays itself), then LTX 2.5 talking clips at 720p with their own voices; every take read back by Whisper (`src/dlg.py`) and retaken where it misspoke |
| The app's screens | `src/media.py` | Each device's screen cropped at its own pixels from the production recordings, span by span at 25 fps: at its own pace the recording's own frames one for one, quicker the nearest of them, a little slower interpolated, longer than its span played at 0.9× and held, a fast-forward sampled straight from its own span (an input seek; an output seek after the speed-up had skipped tens of seconds), cached by that span; `src/ringscan.py` keeps the recording stage's own rings, dims and title cards out of every span |
| Over the shoulder | `src/screens.py`, `src/track.py`, `src/xcam.py` | The app's real screen set into the glass of the device a person holds (SC-206's clips with SC-207's tracked quads, and this film's own filming shot, its blank screen followed frame by frame by `track.py`), under any finger, the same frames carrying on in the window that lifts out of it; the distributor's camera view at the landfill is `xcam.py`'s, the app's camera over the footage of the packs going in |
| The clips at 25 fps | `src/media.py`, `src/screens.py`, `src/xcam.py`, `src/frc.py`, `src/vtfx/`, `src/cadence.py` | Low-resolution clips super-resolved by Apple's VideoToolbox (×4, down to 1920). Then each span shows its source's own frames wherever it can (pass 12): a clip near its own pace one for one (4% quicker at 25 fps), a talking take in real time on the nearest of its own frames (so the lips keep to the sound), the person behind an over-the-shoulder device one for one until the window lifts. Only a span slowed down is interpolated, by VideoToolbox at its own rate (`vtfx` keeps a decimal rate as a fraction, and makes a frame at any clip time with `--times`). `cadence.py` measures every shot's frame-to-frame shift and stops the build on a judder. `vtfx` is built from its source (`swiftc -O -o src/vtfx/vtfx src/vtfx/vtfx.swift`, macOS 15.4 or later; the binary is not committed) |
| The agents in 3D | `src/agents3d/`, `src/aerial.py`, `src/capture-page.mjs` | A three.js scene over aerial footage (LTX, super-resolved, its own frames one for one at 25 fps), captured frame-exact on the narration's cues at 25 fps, its sounds' events kept for the mix |
| The film | `src/film/` | Remotion 4: the kit (`kit/`: footage with its push and rack focus, the device windows and their lift-out, rings, cards, agent heads, the clock, the ways in and out) and twelve scenes; rendered to ProRes 422 HQ at 1920 × 1080, 25 fps |
| The sound | `src/mix.py`, `src/sfxkit.py` | The narration, the people in their own rooms, a room tone for every place, SC-210's score ducked under every word, the editing-videos library's CC0 sounds and synthesised ones on every event; two-pass loudnorm to −14 LUFS, −1.5 dBTP |
| The deliverables | `src/export.py` | The master (H.264 High, crf 17, 25 fps, AAC 320 kb/s), a 720p copy, a phone preview and the captions |

## The film

**7 min 51.0 s** (471.00 s), 1920 × 1080 at 25 fps (11,775 frames), mixed to −14.0 LUFS (range 6.3 LU, true peak
−1.4 dB). Pass 13's master (SC-245) keeps pass 12's edit; the agents scene is 0.6 s longer for the roll-call, so every
scene after it starts 0.6 s later.

| File | Where |
| --- | --- |
| The master (H.264 High, crf 17, 25 fps, AAC 320 kb/s, 332 MB), a 720p copy, a phone preview and the captions | `landing-demo/sales-film/smart-clearance-sales-film-v3-2026-10-18_01-08-51*` (earlier masters in `superseded-v3/` beside it) |
| A 1080p copy, the 720p copy and the captions, beside this record | [`media/`](media/) |

The videos stay on this Mac and are never pushed (the maintainer's call; `.gitignore` keeps `media/*.mp4` out); the
captions are committed.

**Checked on the master** (`src/final-checks.sh`, `src/readback.py`, `src/cadence.py`):

- the motion check on every clip, take and over-the-shoulder shot, and on the 3D and install scenes: no judder (every
  step within 0.22 of its neighbours, the limit 0.40). Its first run stopped the build on five shots: the two short call
  takes, which showed a frame twice a second (now 24 to 25 fps by VideoToolbox, in real time), the bin's aerial (ffmpeg's
  interpolation, now VideoToolbox's) and its two quick inserts (now their own frames one for one);
- no black frame but the opening's half second on the ring;
- 60 of 61 lines word for word in the read-back of the whole mix; the one other, "He sends it, and Vision checks…",
  heard as "Anvision" there, reads word for word on its own, as it does in the 14:49 master;
- near-still samples 33.6 s on pass 13's master (50.9 s on pass 12's): held screens, the rule's last strip, the teams'
  row and the audit trail now drift; no frozen footage;
- pass 13 (SC-245), each note checked on the master's own frames: the sunrise aisle at 1:07 with no one in it; the
  roll-call and sharp agents at 2:06, the orb fading as the camera passes it; the distributor at 5:18 holding his tablet
  with both thumbs on the bezel while his Today updates; the godown's tags steady at 0:16; nothing under YouTube's
  header; the ring scan as pass 12's (no stage mark on his new screen span);
- the background: in the gaps between lines 1 dB lower, the band from 6 kHz up 2 to 3.4 dB lower across the film (its
  tenth percentile −75.3 dBFS, from −71.9);
- the godown shot at 0:10 and the credit note's backdrop at 6:51 read with no walking workers;
- four critics: the first on the full cut (`review/r1-film-critic.md`), a verification of its fixes
  (`review/r2-verify.md`), the 451.8 s master's (`review/r3-verify.md`), and the 14:49 master's, on the maintainer's four
  notes and the third's list (`review/r4-verify.md`).

Nothing was spent: every image, clip, voice and render was made on this Mac.
