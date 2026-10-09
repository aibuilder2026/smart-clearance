# SC-111 · The hero film tells the journey

## The request (9 Oct 2026)

The maintainer, on the landing page's hero as SC-78 left it (http://localhost:5173/):

> the hero looks amazing, but can you refine the video and images more. It should tell the story and journey of the
> application
>
> 1. Brands interacting with distributors
> 2. Distributors go down distributing food to Donations
> 3. Distributors selling to Kiranas or have a staff sale.
> 4. GST and tax savings happening everyone is happy...
>
> Play about 10-15 seconds video and it should be really engaging, lighting effects should be like it is now (day
> changing to night and back with the purplish/violet sky effect looks surreal), but more visible if night scenes are
> depicted.
>
> You have LTX2.5, qwen and ffmpeg... make the best use of them and come up with some really aesthetically background
> atmosphere

## The hero as it is

`current/`: the hero in light and dark at 1440, and on a phone. SC-78's film is two ten-second clips of the whole
town, morning to night and back, chained and looping under Pause. The business works in it, but no chapter of the
journey is staged, so the story is only in the strip's words; the night is a dark navy in which most of the town is
lost, and the violet shows only for a moment at dusk; the cycle is 20 seconds.

## The four chapters, in every option

| Hour | Chapter | The film shows | The strip reads |
| --- | --- | --- | --- |
| 09:00 | The brand and the distributor | Sunrise; the brand's cartons onto the distributor's blue truck at the factory's bay; the office's woman and the distributor shake hands over the plan on her phone. | 1,360 packs flagged; one yes, ₹21,770 on screen (amber: the person's chapter) |
| 13:00 | The food bank | High sun; the white van at the community kitchen's awning, cartons passed to the table, a queue with plates. | packs with 15+ days left go as meals, on the FSSAI checklist |
| 18:30 | The kiranas and the staff sale | Violet dusk; the lane lit and busy; a staff-sale table under a tarpaulin by the godown's gate, the workers queued. | 31 shops order 588 packs; the godown's own staff buy up to 50 |
| 22:00 | Paperwork | Indigo-violet night; the office lit, the papers on the desk, chai raised; then dawn, and round again. | the tax invoice and the credit note drafted; ₹1,224 of GST credit kept |

Every figure is `core/money.js`'s (the plan's `net`, `itcRetained`, the kirana line, the staff channel's cap, the food
bank's minimum days). Shared by every option: 10 to 15 s; looping under Pause (SC-78's rule); the film drifts with the
scroll, not the clock; the light theme starts in the morning, the dark one at night; under reduced motion the plate,
the final word and the last chapter.

## The options

| | Option | The camera | The film | The loop |
| --- | --- | --- | --- | --- |
| A | **One town, four acts** (recommended) | The whole town, locked off, with the page's own camera leaning in 1.5× on each act's place. | Four plates edited from the approved town plate (sunrise, high sun, violet dusk, indigo-violet night), each act staged in it; four 5 s LTX clips, each conditioned to end on the next plate, chained through 0.25 s dissolves; retimed from 19 s to 14.2 s at 32 fps. | The last act runs back into the first, so the loop closes without a cut. |
| B | **Follow the carton** | Four close shots, one per chapter, each with a slow push-in. | Four fresh plates in the same miniature style, four 5 s clips, trimmed to 4 s and dissolved over 0.5 s; 14.1 s. | The tail dissolves back into the first shot's opening frame. |
| C | **One flight** | A slow drone loop over the town (LTX's FPV motion LoRA). | Two 10 s flights, morning to night and back, each conditioned to end where the other begins, retimed to 7.5 s each. | Chained without a cut, as SC-78. |

**Why A:** it keeps what the maintainer likes (one surreal world under a calm heading, the day turning) and adds what
was asked: every chapter staged in the town, the night richer and visible, the violet carried through dusk and
night, 15 s, a seamless loop. Its trade-off is scale: at the wide shot the acts are small, so the page's camera leans
in on each, and the strip names it. B is the most legible story (people, a handshake) at the cost of the one world and
with a dissolve for a loop; C is the most immersive camera and the riskiest, since a generated flight can bend the town.

## How the options were made

- **Plates:** Qwen-Image-2.1 bf16 at 2048 (`src/gen.sh`): A's four as `edit_image` of `site/assets/plates/business.webp`
  (the night one of `business-night.webp`), so the geometry holds; B's four as fresh 16:9 renders. About 10 minutes each.
- **Clips:** LTX 2.5 Fast at 720p, 24 fps (`src/ltx-run.py`): A, four 5 s clips with first and last frames conditioned
  on consecutive plates; B, four 5 s clips with a slow dolly in; C, two 10 s clips with the `fpv-motion` LoRA and
  first and last frames on the morning and night plates.
- **Cut:** ffmpeg 9 (`src/assemble.sh`): A's acts dissolve over 0.25 s and B's shots over 0.5 s, each film's tail
  running back into its first frame; A and C keep every frame at 32 fps (19 s to 14.2 s, 10 s to 7.5 s); a mild grade
  (contrast 1.03, saturation 1.06 to 1.08); H.264 crf 22. The sidecars in `img/` and `media/` record every prompt, seed
  and cut. Option A's night act was rendered twice (`src/ltx-run2.py`).
- **The pages:** `sc111.jsx` is `site/site.jsx` with only its hero replaced (`?hero=a|b|c`, and a switcher at the
  foot), over `site/site.css` and `sc111.css`. The chapters' clock reads the film's time against each chapter's start.

## Checks made

- Every page renders without console errors in Chromium at 1440 × 900 and 390 × 844, light and dark; the stills and
  the recordings are in each option's folder.
- **The films:** A 14.2 s (455 frames at 32 fps, 5.1 MB), B 14.1 s (338 frames at 24 fps, 4.7 MB), C 7.5 s + 7.5 s
  (6.3 and 2.2 MB), all 1280 × 704, H.264 crf 22.
- **The loops,** on a 0 to 255 scale against each film's own frame-to-frame change: A's last frame to its first is 3.7
  where its frames move by 2.0 (median) to 5.1, so the loop is one more step of motion; B's is 5.7 against a median
  of 5.7 (its push-ins move every frame); C's flights meet at 4.5 and 5.7, under the players' one-second cross-fade.
  A's joins measured 4 to 6 as hard cuts (LTX lands within reach of the next plate, not on it), so they became
  quarter-second dissolves, and B's half-second ones; each film's tail runs back into its first frame.
- **The dark theme** opens on the night: A at 10.5 s, B at 10.35 s, C on the night's flight.
- **The strip's** dim text is white at 66% over the film's shade (at least 7:1); its lit text is white. B's shade is
  a touch stronger at the foot, since its shots change.
- No browser suite was run (SC-55).

## Found on the way

- python's `http.server` answers no byte ranges, so a browser cannot seek a film it serves: the dark theme's start at
  the night silently stayed at 0 in every capture until design3 was served with ranges (`npx http-server`). The hosted
  pages (jsDelivr) and the SvelteKit preview serve ranges.
- LTX's last-frame conditioning lands near the plate, not on it (4 to 6 on a 0 to 255 scale), so clips that are meant
  to chain need a short dissolve.
- LTX hurries out of the night: option A's night act (night to morning over five seconds) first left the night within
  a second; told to hold it, the second render keeps about two seconds of night before the sky lifts.
- The FPV LoRA's flight bends the town for its first three seconds and did not fly at all in the night clip.
- The page's camera (option A) can only move as far as its scale allows: the player is the stage's own box and
  `object-fit` crops inside it, so the cover's overflow is not drawable; the lean clamps to `(s − 1) / 2` of the
  stage each way.

## Published

The board and the three pages are in the platform v3 Claude Design project, pinned to commit `4b63ddc`:
https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-111+design+review.html (and `SC-111 option A.html`,
`B`, `C`). The kit comes from jsDelivr, the plates and stills from GitHub raw, the films from jsDelivr (`src/publish.py`;
one cached 403 on `product.js` purged). Played through the published copy: the film plays from jsDelivr, the dark theme
opens on the night, no console errors.

## The pick (9 Oct 2026)

The maintainer picked **A, One town, four acts**, from the board's question. Only A is built: design3 first (the four
plates as the hero's posters, the film in `site/assets/media/`, the hero in `site/site.jsx` with the chapters' clock
and the page's camera), then the port in `frontend/admin`. For the build the four acts are rendered again at 1080p
(5 s each, which LTX allows), so the camera's lean stays sharp; the 720p film stands in until they land.
