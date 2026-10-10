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

_Pending._
