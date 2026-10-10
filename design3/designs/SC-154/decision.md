# SC-154 · The hero film, live action on Vertex AI

## The request (10 Oct 2026)

The maintainer, on the landing page's hero as SC-111 left it (http://localhost:5173/):

> I want to look at the hero animated movie of Landing page, I now you to use Google video/image generation plugins to
> come up with a really awesome video projecting the journey of the application in about 15 seconds. It should be using
> realistic human characters instead of cartoon, showing journey of brands/FMCG/Retailer/Distributor/kiranas/donations/
> Staff sale. Create a plan what Google Vertex AI models can be used and expected pricing
>
> It needs to professional and aesthetically pleasing

Decided in the same session, before any spend: tracked scripts under `design3/tools/vertex-media/` rather than a plugin;
the design round as storyboards plus one Veo 3.1 Fast draft clip per option at 720p without audio; the final film on
Veo 3.1 at 1080p without audio (the hero plays muted); no night act, both themes starting on the same frame.

## The hero as it is

`current/`: SC-111's film, a miniature town in four acts, 14.2 s, in light and dark at 1440 and on a phone.

## The models, and what they cost

Verified on Google's Vertex AI pricing page and against the project's model registry on 10 Oct 2026.

| Model | Serves at | Price (USD) | Used for |
| --- | --- | --- | --- |
| Veo 3.1 (`veo-3.1-generate-001`, GA) | us-central1 | 0.20 a second without audio at 720p or 1080p (0.40 with audio); 0.40 / 0.60 at 4K | the final film |
| Veo 3.1 Fast (`veo-3.1-fast-generate-001`, GA) | us-central1 | 0.08 a second at 720p, 0.10 at 1080p, without audio | the drafts on the board |
| Veo 3.1 Lite (preview) | us-central1 | 0.03 / 0.05 a second | not used |
| Nano Banana 2 (`gemini-3.1-flash-image`) | global only | 0.067 an image at 1K, 0.101 at 2K, 0.151 at 4K | character sheets, keyframes, cleaning edits |
| Nano Banana Pro (`gemini-3-pro-image`) | global only | 0.134 at 1K–2K, 0.24 at 4K | not needed |
| Gemini Omni Flash | us-central1 | about 0.10 a second at 720p, audio forced, 10 s at most, no first or last frame | the alternative not taken |

Veo 3.1's rules that shaped the plan: clips are 4, 6 or 8 s, and 1080p, reference images and a last frame all need 8 s;
extension is 720p only, so a 1080p film is cut from clips; `allow_adult` on every image-based mode; every frame carries
a SynthID watermark. The registry lists `-preview` ids for the image models that answer 404; only the GA ids on the
global endpoint serve, and their quota is a few images a minute (`_vx.retry` waits out the 429s).

## The cast and the keyframes

Three fictional people, named only here and in the sidecars, never on the page (AGENTS.md: the landing page names no
client): the brand's supply planner (navy pinstripe kurta, a lanyard), the distributor (fifties, a light blue checked
shirt, glasses on his head) and a kirana shop owner (a maroon saree with a gold border). Each has a Nano Banana 2
character sheet (`img/cast-*.webp`), passed as a reference into every keyframe they are in. Every pack and carton is
unbranded (kraft with a sage-green band, solid-colour packets); three keyframes came back with lettering (a chai
stall's board, a printed packet, a gate sign) and were cleaned with an edit before Veo saw them. No children anywhere.

Option C's three later times of day are edits of its dawn frame, so the yard's geometry holds across the day.

## The four chapters, in every option

| Hour | Chapter | The film shows | The strip reads |
| --- | --- | --- | --- |
| 06:30 | The brand and the distributor | Dawn at the factory's loading bay: the planner and the distributor over the plan on her phone, plain cartons onto the blue truck. | 1,360 packs flagged; one yes, ₹21,770 on screen (amber: the person's chapter) |
| 11:00 | The kiranas | High sun in the godown: the kirana owner lifts her crate at the counter while the distributor ticks his register. | 31 shops order 588 packs, buy 10 get 2 free |
| 18:00 | The food bank and the staff sale | Violet dusk in the yard: the food bank's van loading at the left, the staff-sale table at the gate. | packs with 15+ days left go as meals; the godown's own staff buy up to 50 |
| 21:30 | Paperwork | Evening in the office over the godown: the papers, the tablet, chai raised. | the tax invoice and the credit note drafted; ₹1,224 of GST credit kept |

Every figure is `core/money.js`'s. Shared by every option: about 15 s at 1080p, 24 fps; looping under Pause (SC-78's
rule); the film drifts with the scroll, not the clock; both themes start on the same frame; under reduced motion the
poster, the final word and the last chapter.

## The options

| | Option | The film | The loop | Trade-offs |
| --- | --- | --- | --- | --- |
| A | **Four hours, four places** (recommended) | Four live-action chapters at four hours of one day, one 8 s clip each (image to video from its keyframe), trimmed to about 4 s and chained through half-second dissolves; the page's camera leans 1.25× on each chapter's subject. | The tail dissolves into the head. | The clearest story and the safest to generate: each clip is one place, one action. The loop is a dissolve, not a match. |
| B | **One carton, hand to hand** | One unbranded carton passed from hand to hand across the day, centred the whole way: two 8 s clips chained by their last frames (planner → distributor → the counter → the van and the table → the desk → back to the bay). | A true matched loop, the final frame returning to the first. | The most cinematic idea, and the riskiest: the world has to change inside a shot, which Veo renders as a dissolve of its own, and the people drift through it. |
| C | **One yard, one day** | The live-action heir to SC-111: one locked-off camera on the distributor's yard as dawn turns to noon, dusk and the blue hour, four 8 s clips each ending on the next keyframe and the last on the first. | The day turns without a cut. | Keeps what the maintainer liked in SC-111 (the day turning, the violet); the people are small, so the story is in the strip; in both drafts the truck leaves through the gate past the camera and fills the frame for a second. |

Each option's draft on the board: its four keyframes as a storyboard, and one 8 s Veo 3.1 Fast clip at 720p without
audio, two takes each, the better one on the page: A's chapter 1 (the bay at dawn, the camera pushing in); B's clip 1
(the carton from the bay to the counter, with Veo's own dissolve between the places); C's dawn to noon.

## How the drafts were made

- **Tooling:** `design3/tools/vertex-media/` (tracked): `nano.py` for the sheets, keyframes and edits, `veo.py` for the
  clips, `seams.py` for the contact sheets, `cost.py` for the spend. Every asset has its `.prompt.json`.
- **Sheets and keyframes:** Nano Banana 2 at 2K, 16:9, the sheets as references; the prompts are in `prompts/`.
- **Drafts:** Veo 3.1 Fast, 720p, 8 s, no audio, `allow_adult`, Veo's prompt rewriter left on; A from its keyframe, B
  and C from a first and a last frame. About 70 s a clip; nothing was filtered.
- **Captures:** `design3/tools/capture.mjs` on the frontend's Playwright: each option in light and dark at 1440 and on
  a phone, and ten seconds of the page playing.

## Cost

| | USD | GBP |
| --- | --- | --- |
| 3 character sheets | 0.30 | 0.23 |
| 12 keyframes and 3 cleaning edits | 1.51 | 1.13 |
| 6 draft clips (Veo 3.1 Fast, 720p, 8 s, no audio) | 3.84 | 2.88 |
| **The design round** | **5.66** | **4.24** |

The maintainer's yes was for about $9 with a stop at $15. The build of the pick at Veo 3.1 1080p without audio is
estimated at $19.20 for a four-clip option (A or C: 4 clips × 3 takes × $1.60) and $9.60 for B, plus about $1 of
keyframe touch-ups; 4K for the picked takes would add $12.80.

## Checks made

- The drafts' contact sheets (`seams.py`): no lettering in A's and B's clips; C's take 2 keeps the yard's geometry to
  the noon keyframe; B's take 2 carries the carton through its dissolve to the counter's frame.
- The option pages play in light and dark at 1440 and 390 with no console errors (`capture.mjs`).
- The design round came to $5.66 against the $9 asked for.

## The pick

**A, Four hours, four places**, picked by the maintainer on 10 Oct 2026 from the board, with the page's camera lean at
**1.25** and the build at **Veo 3.1 1080p without audio** (no 4K pass), with a stop at $30.

## The build

- **The clips:** four 8 s Veo 3.1 clips at 1080p without audio, image to video from the keyframes, with their prompts
  in `prompts/A-clip*.txt`: the bay at dawn (the camera pushing in on the pair), the godown counter at noon (she lifts
  the crate and turns for the door), the yard at dusk (a slow slide from the van to the table), the office in the
  evening. Each took about 130 s.
- **The maintainer's three notes on the first cut,** and the retakes they led to (about $5 more, within the build's
  stop):
  1. the distributor wore two pairs of glasses in chapter 1 (Veo added a pair to his face on top of the pair on his
     head): the keyframe was edited to take the glasses off his head, and the clip retaken. The second take had him
     put a pair on and off; the third, told his hands stay low and he points once at her phone, is in the film;
  2. in chapter 3 the payment and the packets ran together at the staff-sale table: the keyframe was edited to a packet
     handed over and a clipboard in his other hand, and the clip retaken with no money anywhere;
  3. the chai toast in chapter 4 did not look like an office: a new keyframe puts the two of them side by side reading
     a green dashboard on a monitor (no readable words), the tumblers set aside, and the clip has her trace a rising
     chart with her pen while he nods.

  Chapter 4's very first take was held back by Veo's safety filter (the toast; not charged) and came through
  rephrased before the note made it moot. Clip 1 shows a number plate after 6 s in every take and is used up to 4.5 s;
  clip 3's gate board comes back as a blank blue panel, with no lettering.
- **The cut** (`assemble.py`): each clip trimmed to 4.3 s, chained through 0.5 s dissolves, the tail dissolving over
  0.5 s into the first clip's head, which is then cut, so the last frame runs into the first; 24 fps, no retime,
  contrast 1.03 and saturation 1.06, libx264 crf 27. `design3/site/assets/media/one-journey.mp4`: 15.21 s, 1920 × 1080,
  365 frames, 6.18 MB, with its `.prompt.json` composed by `sidecar.py` from the clips' sidecars.
- **The seams** (`seams.py`): the loop step is 2.9 against a median frame step of 2.3 (continuous); the joins step by
  8.8, 6.4 and 11.5 inside their dissolves. The first cut's head ended on the dissolve's last frame, a blend, and the
  loop stepped by 9.6; two frames of pure head after the dissolve fixed it.
- **The posters** (`frames.py`): `hero-day.webp` and `hero-night.webp` are the film's first frame (156 KB each, q82),
  with 48 px previews (about 400 B); both themes start on the same frame. The town posters and `one-day.mp4` are
  retired.
- **The hero** (`site.jsx`): the chapters at 06:30, 11:00, 18:00 and 21:30 in the journey's order; `FILM` with
  `bounds` [0, 3.55, 7.35, 11.15], `ar` 16/9, `lean` 1.25 and each chapter's subject for the camera; the night offset
  gone. `loader.js` and the page preload the new posters.
- **The shade** (`site.css`): live action is brighter under the copy than the diorama was. Measured with the copy
  hidden, white against the pixels under each element at two moments of every chapter, the heading's 90th percentile
  fell to 2.4:1 on a phone at the noon chapter and the sub's 99th to 4.0:1. The shade's foot and left band are stronger,
  and phones get a darker band behind the copy. After it: heading 5.5:1 at 1440, 4.6:1 at 390 (90th percentile, large
  text); sub 12.0:1 and 8.9:1; strip 15.3:1 and 15.5:1; at 1024, 5.6:1, 10.9:1 and 14.5:1. On the final cut with the retakes: heading 5.6:1 at
  1440 and 4.6:1 at 390, sub 11.6:1 and 8.9:1, strip 14.8:1 and 15.4:1.
- **The port:** `media.ts`, `plates.ts` (`PLATES.hero`), `figures.ts` (`story`), `Hero.svelte` (no night offset),
  `Site.svelte` (the loader's plate names, which still mapped the retired `business.webp`, so a theme switch's poster
  preload had fallen back to a 404), `+page.svelte`'s `og:image`, `site.css` verbatim, the README, the loader spec's
  poster names.
- **Played through** (a Playwright script on design3 and the build, light and dark, 1440 and 390): no console errors;
  the loader lifts and the film starts at 0.3 s; four chapters light in turn at their bounds; Pause and Play by
  keyboard; a seek to the end runs back under 2 s. Stills in `build/`.
- **Cost:** the final clips and their retakes $11.20 (seven clips at $1.60; the filtered one free), the keyframe edits
  $0.30; the ticket in all **$18.76 (£14.07)**, against the $30 stop for the build and the $45 cap.
