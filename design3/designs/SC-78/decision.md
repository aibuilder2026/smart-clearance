# SC-78 · The landing page refined: the film, the day scene, the islands and the bar

## The request (8 Oct 2026)

The maintainer, on the landing page as it is (SC-60's page, at http://localhost:5173/):

> For the main landing page, I want you refine the following
>
> 1. The main hero image, can we make the video more immersive and longer (10s) and it should play in loop. It should
>    tell the story as much as possible
> 2. During day mode, The 1st image attached looks too whitish, night mode is fine
> 3. This part (2nd image attached) can be refined more, the image needs to be more immersive and engaging and it does
>    not look good.
> 4. The 3rd image - the header with logo and options does not look good, refine it.
>
> Think hard and beuatify the page more

The three images: the agents' table scene by day (the Outreach stop), the "Your own workspace" islands, and the bar
over the film at 1440.

## The page as it is

`current/`: the hero, the scene mid-tour, the workspace section and the bar, in light and dark at 1440 and 390.

- **The film** (SC-60) is one 8 s clip by day (6 s by night) that plays once and ends on Replay. The camera is
  locked; the clip drifts 6% over its length by CSS. It shows the business at work but tells no story in words.
- **The day scene** is washed out for three reasons, all in the page rather than the plate: the stage's top and foot
  blend into the page's near-white ground over 18% of its height each; while an agent works, a wash of that same
  ground at 28% sits over the whole plate; and the plate itself is high-key (a pale table, a bright window).
- **The islands** are a 3.4:1 strip from the SC-28 comp, with three product renders pasted over the plate at 160 px.
  The pasted packs sit flat on the islands, with no shadow of their own, and the strip is cropped top and bottom to
  270 px on laptops.
- **The bar** sets a 34 px mark beside a 15 px wordmark, with the four links jammed 16 px after it, in white over a
  blurred grey sky: the lock-up is unbalanced and the links muddy.

## The options

Each part has its own options, and the three pages combine them (A, B, C). The review switcher at the foot of each
page swaps any part's option without leaving the page (`?hero=&scene=&ws=&nav=`), so a mixed pick is a link.

### Part 1 · the film: longer, looping, telling the story

Every option: ten seconds or more, looping, under a **Pause** control (WCAG 2.2.2; see the rule below), the film
drifting with the scroll instead of the clock, and a **story strip** under the copy that names the beat the film is
on, with a line that fills through it: the Watcher's 1,360 packs, the yes with ₹21,770 on screen (amber), Outreach's
588 packs to 31 kiranas, the Lister's 772 to a buyer and none to the bin. On phones only the current beat shows.
Under reduced motion: the plate, the final word, the last beat.

| | Option | The film | The loop |
| --- | --- | --- | --- |
| A | **One take** (recommended) | One ten-second take of the whole business at work: the forklift, the workers lifting a carton, the truck to the godown's gate, shoppers at the kiranas, the auto past the shops, the van up the highway, the green path pulsing from the godown to the shops and up the hill. | Seamless: the clip is generated to end on its first frame (LTX's last-frame conditioning), so it loops without a cut. |
| B | **The push-in** | The camera glides from the whole business down to the kirana lane over ten seconds, as if following a carton to the shelves, while the same work goes on. | A one-second dissolve from the last frame back to the wide shot, on two players. |
| C | **One day** | A whole day in twenty seconds: morning to night (the light lowers, the windows and lamps come on, the path brightens), then night to morning. The light theme starts in the morning, the dark one at night; the strip reads the hours (09:00 the Watcher … 17:30 the Negotiator; 21:00 Paperwork … 09:00 the Watcher again). | Two clips chained without a cut: each ends on the frame the other begins on. |

**Why A:** it is what was asked for in the fewest moving parts: longer, looping, more story, and the loop is seamless by
construction. B is the most cinematic but its loop is a dissolve, and the close shot leaves less room for the
heading. C is the most surreal and the richest story, at the cost of a 20 s cycle and the same film in both themes.

**A rule to change:** AGENTS.md says nothing loops forever. WCAG 2.2.2 allows auto-playing motion over five seconds
when it can be paused, and the film has Pause (the a11y suite's motion spec checks CSS and web animations, not
`<video loop>`). If a looping film is picked, the rule becomes "nothing loops forever except the hero's film, which
loops under its Pause control".

### Part 2 · the day scene, no longer whitish

Both options change the page: the stage's ground becomes a warm sand field (`#ebe2d2`, from the plate's own table),
the top and foot blend over 14% instead of 18%, and the wash while an agent works is a sage-dark vignette that
darkens the table round the card instead of whitening it. The night treatment is unchanged.

| | Option | The day plate |
| --- | --- | --- |
| A | **Re-lit** (recommended) | The approved plate re-lit by Qwen as an edit of itself, so the geometry holds: late-morning sun raking across a honey-oak table, long shadows, the white wall and curtain toned to cream, deeper terracotta and sage. `img/table-warm.webp`. |
| B | **Graded** | The approved plate as it is, graded in ffmpeg (contrast +16%, saturation +22%, a warm shift, a lifted black): exact geometry, the same picture, warmer and deeper. `img/table-graded.webp`. |

**Why A:** the re-lit plate has real shadows and a warm wall, which no grade can add; its geometry held within the
width of a node, so the posts measured in SC-60 still fit. B is the safe fallback if any post drifts in the build.

### Part 3 · the workspace section, immersive and engaging

| | Option | What it is |
| --- | --- | --- |
| A | **Islands in depth** (recommended) | A new 16:9 plate: three islands at three distances in a morning sky over the town, each carrying its product drawn into the plate (a plain snack packet, a plain carton, a plain oil bottle), the green ribbons arcing down to one point on the town, where the mark sits. The stage is full-bleed and as tall as the window; the plate, the clouds and the address tags move at three speeds with the scroll; each address hangs from its island on a stem, and lifts on hover. The team cards and connectors follow. `img/islands-depth.webp`, `-night.webp`. |
| B | **The workspace itself** | No plate: the product on a browser window (a phone on phones), its address typed in letter by letter as the section comes into view, and the four teams as its navigation: Supply chain (the plan, waiting for one yes), Finance (the documents, drafted), Sustainability (Impact's ledger lines), Distributors (the permission, given once). The tabs play through once, 2.4 s each, and the rail takes over on a click; beside each tab, what the agents did for that team today. No client is named: the workspace is "Your brand". |
| C | **The strip, fixed** | The section as it is, with its products drawn into the plate by Qwen instead of pasted on, the addresses on stems, the mask softened, and the plate drifting under the tags with the scroll. `img/islands-packs.webp`, `-night.webp`. |

**Why A:** it answers "more immersive and engaging" with a picture that has depth and air, keeps the approved idea (one
product on each island, every address its own workspace), and gives the section motion under the reader's hand. B is
the honest product shot and the one Shopify would make; it is the right pick if the islands are to go. C is the least
change.

### Part 4 · the bar

Every option fixes the lock-up (a 28 to 30 px mark, a 16 px wordmark, 9 to 10 px between), sets the links at 14.5 px /
560 with room between them, marks the current section, and keeps the sign-in menu, Appearance and Book a demo.

| | Option | What it is |
| --- | --- | --- |
| A | **The floating pill** (recommended) | One glass capsule floating 10 px below the top, with its own dark glass from the first paint, so it never muddies over the film; the brand, a hairline, the links with a highlight that slides to the current section, then Appearance, Sign in and Book a demo. On scroll it takes the page's glass. |
| B | **The bar, structured** | Full width, in three parts: the brand at the left, the links centred with 30 px between and a dot under the current one, the actions at the right; a stronger shade over the film; a 2 px green progress line along its foot once the page has scrolled. |
| C | **Brand left, capsule centre** | The brand and the actions free on the edges, and only the links in a centred glass capsule with the sliding highlight. |

**Why A:** over a full-bleed film the capsule reads as one object with its own ground, which is what the current bar
lacks; its highlight gives the reader a place. B is the classic (Shopify's own); C is Apple's.

## Checks made

- Every page renders without console errors in Chromium at 1440 × 900 and 390 × 844, light and dark (the only
  errors are the 404s of plates and clips not yet rendered while the board was built).
- The story strip's dim text is white at 66% over the film's shade, which is at least 7:1; its lit text is white.
- **The clips** (LTX 2.5 Fast, 10 s each at 24 fps; day at 720p, night at 540p; 10 to 11.5 minutes each): A's loops end
  within 2.2 (day) and 2.1 (night) of their first frame on a 0 to 255 scale (a frame-to-frame change is about 0.2),
  so the loop has no visible seam. C's pair chain within 1.9 and 3.1. B's last frame is 58 from its first, which is
  the dissolve's job. The day loop's first render (seed 7831) let the glowing path leave the road and trace the
  godown's roof for about three seconds; it was rendered again (seed 7833) with the path told to stay on the road.
- No browser suite was run (SC-55).

## Published

The board and the three pages are in the platform v3 Claude Design project, pinned to commit `8a3b627`:
https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-78+design+review.html (and `SC-78 option A.html`,
`B`, `C`). The kit comes from jsDelivr, the plates and stills from GitHub raw, the clips from jsDelivr (`src/publish.py`).

## In this folder

- `board.html`: the review board; `decision.md`: this record.
- `current/`: the page as it is.
- `img/`: the new plates with their prompt sidecars; `media/`: the six clips with theirs.
- `option-a/`, `option-b/`, `option-c/`: each page's `mockup.html`, its stills and its `motion.mp4`.
- `sc78.jsx` (compiled to `sc78.js`) and `sc78.css`: the options' code, on the real kit, over `site/site.css`.
- `src/`: the PNG originals, the LTX renders, the generation scripts (`gen.sh`, `ltx-run.py`) and `publish.py`; local only.

## The pick (8 Oct 2026)

The maintainer picked, part by part: **the film C, One day** ("I like option C main hero really good"); **the day scene A,
Re-lit**; **the workspace section B, The workspace itself**; and **the bar B, structured** ("the top header selection
should be like B"; the structured answer had said A, and B was confirmed when asked). The page that is built is
`option-c/mockup.html?scene=a&ws=b&nav=b`. Only this combination is built.
