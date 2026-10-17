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
| 2 · the hand through the tablet | The evidence photo the tablet shows is cropped so no hand, arm or face in it can read as reaching through the glass; the screen is set into the tablet under the man's own thumbs (`screens.py`) |
| 3 · tilted papers | Every paper is the Paperwork agent's own PDF, flat and square, the camera gliding down it to the line the voice names |
| 4 · the pointer | No pointer is drawn: the cursor is the recording's own. Every ring sits on the recording's own pixels, placed from a pixel grid of the frame (`gridframe.py`), so it lands where the app drew the thing |
| 5 · FSSAI | The rule scene: FSSAI's direction to e-commerce food businesses (Nov 2024), its sliding floor on two shelf lives, the quick-commerce apps' stricter gates, and the batch's own 180-day life sliding to 22 days, below every line |
| 6, 12 · transitions | Cuts on action and on sound, J and L cuts, pushes and a flash where the picture moves through, dips at the evening call; no dissolve between two pictures, no blur on a resting screen |
| 7 · sound | A room tone for every place, a sound for every lift, ring, card, tap, call typed, clock and stamp, the captured scenes' own events, under SC-210's score ducked under every word (`mix.py`); every frame carries footage or a graphic |
| 8 · the agents in 3D | `src/agents3d/`: the mark's route as a lit road over aerial footage of the godown, the town and the lanes (graded green), nine stops, ten agents, the amber gate, Gemini above, the rules as rails, the shield round the money |
| 9 · screen and pop-out | A person's screen is the app's real screen set into the glass of their device (over the shoulder, tracked frame by frame); the window that lifts out of it is the same recording, from the same frame |
| 10 · motion everywhere | Every background is footage; every graphic moves in on its word, holds while read, and leaves |
| 11 · a short film | Two phone calls bookend it; the people speak only where a person would, one speaker a clip, shot and reverse shot, nobody to the lens (LTX made each voice with its picture) |
| 13 · papers over green video | The record scene's papers lie over the footage of what each records (the truck, the godown, the office, the food bank, the landfill), graded green |

## The film

To be filled in at the final export.
