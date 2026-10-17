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

## How each point was met

| Point | Done |
| --- | --- |
| 1 · the working demo | The three production recordings it used (the console of 16 Oct, the mango and the chips of 13 Oct) are the film's app screens, cropped at their own pixels from each device's screen |
| 2 · the hand through the tablet | The landfill photograph is now the distributor's own shot, raising his tablet with its back to the camera; the evidence photo shown after it is cropped so no hand, arm or face can read as reaching through the glass |
| 3 · tilted papers | Every paper is the Paperwork agent's own PDF, flat and square, the camera gliding down it to the line the voice names |
| 4 · the pointer | No pointer is drawn: the cursor is the recording's own. Every ring and card is placed on a pixel grid of the recording's frame (`gridframe.py`) and timed to the span it sits on, held long enough to read and gone before its screen changes; the recording stage's own rings, dims, note cards and chapter cards are scanned out of every span (`ringscan.py`) |
| 5 · FSSAI | The rule scene: FSSAI's direction to e-commerce food businesses (Nov 2024) large on its own first, its floor on three shelf lives (the lower of 30% and 45 days); then beside the quick-commerce apps' stricter gates on the same three lives, line for line, in the middle of the frame; then both a strip over the batch's own 180-day life sliding to 22 days, below every line |
| 6, 12 · transitions | Cuts on action and on sound, J and L cuts, pushes and match cuts (the mark the turn's light leaves is the platform's); the papers' footage cuts mid-slide; the 3D gate is an arch the camera pushes straight through; no dissolve between two pictures, no dip to black, no flash or blur in any transition; both ends of every shot rounded to the same frame, so no black or dim frame falls between two shots |
| 7 · sound | A room tone for every place, under the footage the scenes draw too, a sound for every lift, ring, card, tap, check, call typed, clock, stamp and shutter and for every event of the captured scenes, under SC-210's score ducked from 1 to 9.5 kHz under every word, the film ending in silence (`mix.py`); every frame carries footage or a graphic |
| 8 · the agents in 3D | `src/agents3d/`: the mark's route as a lit road over aerial footage of the godown, the town and the lanes (graded green), nine stops, ten agents, the person's gate an arch of bronze the camera pushes through, Gemini above, the rules as rails, the shield round the money; every event heard |
| 9 · screen and pop-out | A person's screen is the app's real screen set into the glass of their device (over the shoulder, tracked frame by frame), or a device held with its back to the camera whose screen then lifts out; the window is the same recording, from the same frame. The lead holds a tablet at her desk, as her screens are a tablet's |
| 10 · motion everywhere | Every background is footage, and a clip shorter than its shot turns back at its end rather than holding a frame; every graphic moves in on its word, holds while read, and leaves; the install scene and the issued papers keep moving through their holds |
| 11 · a short film | Two phone calls bookend it; the people speak only where a person would, one speaker a clip, shot and reverse shot, nobody to the lens (LTX made each voice with its picture; takes that misspoke or turned to the lens were made again, or cut short of it); one face for each role, every new keyframe an edit of that person's own |
| 13 · papers over green video | The record's papers lie over the footage of what each records (the truck, the godown, the office, the food bank, the landfill), one paper at a time, graded green, the certificate's destruction log in place of the certificate read with the chips; the audit trail plays over the office, the evidence check over the landfill, the issued papers over the distributor at his stack |

## How it is made

Everything is driven by one edit decision list, so the picture and the sound read the same cue sheet.

| Step | Script | What it does |
| --- | --- | --- |
| The plan | `src/plan.py` | The edit decision list: every scene, shot, line, ring, card, agent head and clock chip, timed on the narration's own words (Whisper's word times); writes `film/src/film.json`, `build/media.json` and `build/timeline.txt`; closes any gap between two shots |
| The voice | `src/tts/` | The narrator, Maya1 run locally (the working demo's warm Indian storyteller), three takes a line, picked by Whisper's read-back and UTMOS |
| The people | `src/gen-qwen*.sh`, `src/gen-ltx.py` | Qwen-Image keyframes (edits of the earlier films' cast sheets, so each face stays itself), then LTX 2.5 talking clips at 720p with their own voices; every take read back by Whisper (`src/dlg.py`) and retaken where it misspoke |
| The app's screens | `src/media.py` | Each device's screen cropped at its own pixels from the production recordings, span by span: near its own pace interpolated to 60 fps, longer than its span played at 0.9× and held, a fast-forward sampled straight; `src/ringscan.py` keeps the recording stage's own rings, dims and title cards out of every span |
| Over the shoulder | `src/screens.py` | The app's real screen set into the glass of the device a person holds (SC-206's clips, SC-207's tracked quads), under any finger, the same frames carrying on in the window that lifts out of it |
| The clips at 60 fps | `src/media.py`, `src/frc.py`, `src/vtfx/` | Low-resolution clips super-resolved by Apple's VideoToolbox (×4, down to 1920), then interpolated to 60 fps by RIFE 4.26 or VideoToolbox's frame-rate conversion, whichever rebuilds the clip's own frames better |
| The agents in 3D | `src/agents3d/`, `src/aerial.py`, `src/capture-page.mjs` | A three.js scene over aerial footage (LTX, super-resolved, 60 fps), captured frame-exact on the narration's cues, its sounds' events kept for the mix |
| The film | `src/film/` | Remotion 4: the kit (`kit/`: footage with its push and rack focus, the device windows and their lift-out, rings, cards, agent heads, the clock, the ways in and out) and twelve scenes; rendered to ProRes 422 HQ at 1920 × 1080, 60 fps |
| The sound | `src/mix.py`, `src/sfxkit.py` | The narration, the people in their own rooms, a room tone for every place, SC-210's score ducked under every word, the editing-videos library's CC0 sounds and synthesised ones on every event; two-pass loudnorm to −14 LUFS, −1.5 dBTP |
| The deliverables | `src/export.py` | The master (H.264 High, crf 17, 60 fps, AAC 320 kb/s), a 720p copy, a phone preview and the captions |

## The film

To be filled in at the final export.
