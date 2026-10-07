# SC-60 · The landing page reimagined, in the manner of shopify.com/uk

## The request (7 Oct 2026)

The maintainer, on the landing page as it is (the town hero, SC-32 to SC-42):

> I want you think hard and analyze http://localhost:5173 landing page (frontend/admin). I want you to reimagine the entire
> landing page and see if you can come with something really more engaging that showcases the Agentic journey of
> smartclearance in a crisp and surreal way and really engaging manner. Come up with the best hero that is real eye
> catching and compatible across all device types. You have access to the best design plugins and tools. you have qwen
> and ltx2.5 and ffmpeg.
>
> Draw inspiration from https://www.shopify.com/uk and then see how you can have the similar experience ported over to
> our app. Think hard and give me 3 best solutions. DOnt worry about running any browser-suites, just give the best of
> the best designs.

## The page as it is

`current/`: the first screen in light and dark at 1440 and 390, and the whole page.

- **The hero** is the miniature town (SC-32), toured in 16.9 s with a card at each agent (SC-34), under a sky (SC-42).
  It is rich but busy: eleven pins, a caption, Replay, zoom, and the heading all share the first screen, and the
  tour has to be watched to be understood.
- **Below it** the page reads as five separate sections (How it works, Five exits, Your workspace, Plans, the close),
  each with its own device, so the story is told three times in three ways.
- **On phones** the town is a square card the visitor must drag and pinch; the first screen holds the heading, the
  buttons and a slice of the town.

## What shopify.com/uk does, and what is ported

Read on 7 Oct 2026 at 1440 and 390 (the page is about 11,000 px tall, near-black, with light display type):

| Shopify | Here |
| --- | --- |
| A full-bleed film of one real merchant at work, with a few huge light words over it and a rotating last word ("Be the next AI all-star / solo-preneur"). | The first viewport is one scene of the business, not a header: a film of it (A), the whole of it in the sky (B), or the one human moment in it (C). |
| An editorial statement that fills in word by word as it is scrolled ("Sell everywhere people shop…"). | The statement: one paragraph, 28 to 64 px, whose words fill from the tertiary ink to the full ink as it is read. Both inks hold 4.5:1. |
| Chapters as inset panels with a large radius, each a committed colour (deep green, violet), each showing the product in motion. | Chapters as inset colour fields (deep green, sunken, amber for the yes, night green), each with the product's own card at work: the Watcher's alert, the Valuer's prices, the plan, the agents' work. |
| A marquee of real storefronts as proof. | The five exits as a strip of cards, the two taken ones ringed in their stream's colour, the bin in red. Nothing loops. |
| A persistent "Why we build Shopify" film pill at the bottom right. | "Watch the 6-minute demo" as a pill at the bottom right, on every screen, gone at the close. |
| Big numbers in bands. | A ledger: Impact's own document for the batch, its lines filling in, rather than a stat row. |
| Light type, pure black ground. | Bricolage Grotesque at the brand's weight, the sage grounds, both themes. Option A alone tries a lighter display weight over its film, as a question for the maintainer. |

**Kept from the page as it is:** the bar, Your own workspace (the islands), Plans, the close on the dusk plate, the
footer, Book a demo, Find your workspace. **No client is named;** every figure comes from `core/money.js`.

**Motion rules, every option:** every motion plays once as its part comes into view and stops within five seconds, or
is under the visitor's hand (scroll, a tap) or carries Pause; under reduced motion every step lands in its final state.
The page scrolls the window, as the SvelteKit port does.

## The options

Each option is the complete landing page, built on the real kit (`sc60-core.jsx`, `sc60-options.jsx`, `sc60.css`),
in light and dark at 1440 and 390. `option-*/mockup.html` is the page; `light-1440.webp`, `dark-1440.webp`,
`light-390.webp`, `dark-390.webp` are its first screen; `moment-1440.webp` is the moment that makes it; `motion.mp4` is
the recording.

| | Option | The first viewport | The spine of the page | Imagery |
| --- | --- | --- | --- | --- |
| A | **The film** | The miniature business alive on film (LTX 2.5, from the town plate: the forklift rolls out, the trucks move, the people walk), under enormous light type whose last word turns once through "buyer, shelf, invoice, ledger line" and rests on "chance". Pause, since the film runs 8 s. | Shopify's: the statement, then four chapters (Spot it, Price every exit, Say yes once, The agents do the rest), the ledger, the exits, the workspace, plans, the close. | `a-town.mp4` (day, 720p, 8 s) and `a-town-night.mp4` (540p, 6 s), both playing once over the plates as posters. |
| B | **Islands in the sky** | The business as six islands floating in a sky (a new plate, day and night), joined by the painted road. The copy stands in the band of cloud at the foot. | The journey is the page: a pinned stage of six stops (Stocked, At risk, Priced and split, One yes, Sold, Settled), driven by the scroll. Each stop lights its island, opens its card with the figure and the agents, and during Sold the packs run the painted road as dots. A rail of the stops at the top left; a progress bar on phones. Then the statement, the ledger, the exits, the workspace, plans, the close. | `b-islands.webp` and `b-islands-night.webp`. |
| C | **One yes** (recommended) | Shopify's real person at a kitchen counter becomes ours: a hand holding a phone over a morning table, and on the table the business in miniature. The plan is lifted off the phone as the real approve sheet; the Approve button is live. Tapping it places the plan, streams the packs out of the sheet to the kiranas and the buyer's truck, lights the agents as they work, and rolls the swing. Replay. | The statement, then the agents' day as one line from 09:00 to the ledger a month on (pinned and panned by the scroll on desktops, swiped on phones), the exits, the ledger, the workspace, plans, the close. | `c-table.webp` and `c-table-night.webp` (the same table under a desk lamp). |

**Phones.** A crops its film and keeps the copy at the foot. B keeps the pinned stage full-screen, the plate panned,
the card docked at the foot and the pins arriving once the copy has gone. C puts the heading, then the approve sheet as a
card (the yes within the first screen), then the table; the tap brings the table into view and the packs run down into
it.

**Reduced motion.** A shows the plate, still, with the final word. B is the plate with every pin and the six stops listed
under it. C opens on the result.

### Why C is recommended

- It proves the mechanism in the first viewport instead of describing it: the money on screen, one tap, and the agents
  at work. The memory a visitor keeps is "I pressed Approve and watched the packs go".
- It is the closest to what makes Shopify's hero work, a real human moment, translated into our world: 09:00, chai, a
  phone, and the business in miniature on the table. Surreal in scale, calm in colour.
- It is the most honest on every device: the plan is a phone screen, so on a phone it simply is the screen. No video
  bandwidth, no scroll hijack.
- Its risks: the lifted sheet must stay within the clear part of the picture at every size (held in the mockup at
  1440 and 390; to be checked at 1366 × 768 and 820 × 1180 in the build); the hand and phone are a render, and a
  visitor may expect to tap the phone itself (the sheet is tied to it with a line, and the phone shows the same sheet).

### The others

- **A** is the most cinematic and the closest port of Shopify's page. Its cost is weight (two clips) and that the hero
  shows the world rather than the mechanism; the chapters carry the story. Its lighter display weight departs from
  DESIGN.md and is a question, not a given.
- **B** tells the journey most completely and is the most surreal. Its cost is a long pinned stage (about six screens
  of scroll before the rest of the page), which some visitors scroll through without reading.

## Checks made

- Every option renders without console errors in Chromium at 1440 × 900 and 390 × 844, light and dark.
- The statement's dim ink is the tertiary ink (4.9:1 on the light ground, 6.5:1 on the dark one), so it passes before
  it fills in. Text drawn over the plates sits on glass or on a wash of the plate's own sky.
- No browser suite was run (the maintainer asked not to; SC-55). The design3 a11y suite and the frontend's e2e suite
  would check the picked option once built.

## Open questions

1. **A's display weight.** Option A sets the hero at Bricolage 520 over the film, Shopify's airiness. DESIGN.md's display
   weight is 720 to 780. Keep the lighter weight for the film hero only, or hold the brand weight?
2. **C's table on film.** The table could also be an LTX clip (the chai steams, the lamp flickers once, the van moves)
   under the live sheet. Worth the weight?
3. **The order below the hero.** Every option keeps the workspace, plans and the close. Should the exits strip go, now
   that the hero and the ledger tell the same batch?

## The pick

Not yet made.

## In this folder

- `board.html`: the review board.
- `current/`: the page as it is.
- `img/`: the new plates with their prompt sidecars; `media/`: the film clips with theirs.
- `option-a/`, `option-b/`, `option-c/`: each option's `mockup.html`, stills and `motion.mp4`.
- `sc60.css`, `sc60-core.jsx` and `sc60-options.jsx` (compiled to `.js`): the mockups' code, on the real kit.
- `src/`: the PNG originals and the generation scripts (`gen.sh`, `ltx-run.py`); local only.
