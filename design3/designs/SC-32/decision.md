# SC-32: the hero, as the journey

**The request** (5 Oct 2026, the maintainer's words):

> ok.. I really like Option 1 (Constellation) and 3 (carousel), I need you to totally rethink the hero design, the background image of hero should tell the story of supply chain starting from manufacture to Distributor/Stockists to retailer. If needed replace the hero image with some thing more intuitive that will embrace Agentic AI and the entire workflow journey in a really engaging and animated approach..
>
> You motion animations, if needed install framer mcp plugin, threeUI,21st dev, impeccable components and other design skills for really engaging hero.. Rest of the parts of the page are fine.
>
> Design aesthetics is primary, user should be able to understand the journey

Options 1 and 3 are SC-30's: the agents' constellation, and the carton's crew on a turning ring.

## The tools named

- **ThreeUI:** used through the `threeui-community` plugin (SC-31).
  - Options 1 and 3 build on its constellation field.
  - Option 2 rebuilds its Gallery, image panels on a turning cylinder, in CSS 3D.
  - `THIRD_PARTY_NOTICES.md` carries the MIT licence.
- **impeccable and the taste skills:** they led the design. impeccable's motion grammar asks for one authored focal sequence, which here is the batch's journey.
- **Framer Motion:** drives the mockups' motion, as the hosted pages load it.
- **Not installed:**
  - the Framer MCP, which serves Framer the design tool; this project doesn't use it;
  - 21st.dev's Magic MCP, which needs an API key from the maintainer's 21st.dev account, and whose generic React components wouldn't help this hero.

## What every option does

- **One new plate:** `img/journey.webp` and `img/journey-night.webp`, with prompt sidecars.
  - It tells the chain left to right: a snack factory loading a truck, the distributor's godown full of cartons, and a lane of kirana shops, joined by the painted green route.
  - It replaces the giant carton, and is composed by day and by night.
- **The journey plays in seven beats, in 4.7 seconds:**
  1. Made (600 ms): the manufacturer ships 1,840 packs to its distributor.
  2. Stocked (500 ms).
  3. At risk (700 ms): Data, the Watcher and Vision flag 1,360 packs.
  4. Priced and split (600 ms): the Valuer and the Router.
  5. One yes (900 ms): you, at the manufacturer.
  6. Sold (700 ms): the Lister, Outreach and the Negotiator.
  7. Settled (700 ms): Paperwork and Impact, while ₹21,152 rolls in.

  It holds on "Sold, not binned. ₹21,152 recovered, instead of −₹26,330 to destroy it" and offers Replay. Under reduced motion the result shows at once.
- **The person who says yes is "You",** the manufacturer's own team, which matches the subtitle "You say yes once".
- **The rest of the page is unchanged.** The hero's heading, subtitle and buttons stay, and the row of exits under the hero goes.
- **No client is named;** every figure comes from `core/money.js`.

## Options

| Option | Idea | Motion |
| --- | --- | --- |
| 1. The chain and its constellation | The whole chain stays in view, each stage pinned. Over each stage, the agents who work there gather as named stars. | Packs run the route, and the godown is flagged. The handoff line arcs from star to star across the sky: the godown, you, the lane, then back to the manufacturer. |
| 2. The journey ring | Five chapters on a ring of curved panels: Made, Stocked, At risk, One yes, Sold. Each panel is the plate's own view of that place. | The ring turns once to each chapter, with its agents at work under the panel; the chapter steps turn it by hand. |
| 3. Follow the batch | A camera follows the batch down the chain, with the crew riding a ring round it. | In at the factory, along to the godown, out to the lane, then back for the whole chain and the constellation the agents left. |

## Round 1: the answer (5 Oct 2026)

The maintainer saw the three options and answered:

> I really like option 3, can we build upon it more --> the paperwork and impact agent does not go well with the picture. Also the agent graph and the picture should be interactive for desktop and mobile screens. The idea is really good, build upon it and show me a few more options. It needs to be eye catchy and have the wow factor. Pictorial representation of the entire business

So round 1 picked no option to build. Option 3, Follow the batch, is the base for round 2, which answers four points:

- **Paperwork and Impact:** in round 1 their stars sat in the sky over the shops, tied to nothing in the picture. In round 2 every agent works at a place in the picture: Paperwork in the maker's office, Impact at the landfill the batch never reaches.
- **Interactive:** the picture and the agent graph answer touch, pointer and keyboard, on desktop and on phones.
- **The whole business in one picture:** every place the batch can go, not only the chain.
- **Eye-catching:** a wow factor, within DESIGN.md (no glows, nothing loops).

Round 1 is kept here as it was reviewed.

## Round 2: the whole business (5 Oct 2026)

**One new picture, the whole business:** `round-2/img/business.webp`, composed by day and by night, with prompt sidecars.
- It shows the maker's factory and its office, the distributor's godown, the kirana lane, a buyer's warehouse in the next town, a food bank, and the landfill.
- Its depth map, `business-depth.webp`, is for option 2.
- One fix by hand: the generated green route began at the landfill's gate. That stretch of road was repainted on both plates, so the route begins at the maker's loading bay.

**Every agent works at a post in the picture:**

| Place | Agents |
| --- | --- |
| The maker's office | You (the yes), Paperwork (the invoices and the price-support credit note) |
| The distributor's godown | Data, the Watcher, Vision, the Valuer, the Router |
| The kirana lane | Outreach |
| The buyer, by the highway | the Lister, the Negotiator |
| The landfill | Impact (218 kg kept out of it) |
| The food bank | none; an exit the Valuer prices on every plan |

The agent graph is the handoffs between the posts. It rests quiet. The handoff happening now, or those of whatever is hovered or open, stand out.

**What every option does:**
- **The tour plays once, in 4.7 seconds:** the whole business first, then the camera follows the batch to the factory, the godown, the office for the yes, the kiranas and the buyer, and the office and the landfill. Then it holds on the whole business.
- **Then the picture is the visitor's:**
  - drag or swipe, pinch or Ctrl-scroll, double-click;
  - tap a place or an agent for a panel, and its handoffs light up;
  - the steps walk the tour by hand, and Replay plays it again.
- **Under reduced motion,** it rests on the result and the camera jumps.
- **As the camera nears,** the top of the frame goes out of focus into the plate's own haze, so the heading keeps a calm ground.

**Options:**

| Option | Idea |
| --- | --- |
| 1. Take the wheel | The tour, then the picture to explore. |
| 2. In depth (recommended) | Option 1, drawn in WebGL2 with the depth map. It parallaxes as the camera travels, tilts under the pointer (sways under a swipe), and its focus follows the camera. It falls back to option 1 without WebGL2. |
| 3. Your yes | The tour stops at the plan and waits for the visitor's yes before the batch sells. |

**Checks:**
- axe, WCAG 2.2 AA: 0 violations in 36 scans (the three options, light and dark, 1440 and 390, mid-tour, at rest and opened).
- Contrast, measured on the real pixels at every beat: 1,186 text runs, none below 4.5:1. The lowest is 4.79.

Round 2 uses no third-party code. The depth renderer is written for it; round 1's ThreeUI notice stays.

## In this folder

- `board.html`: the review board, both rounds.
- `current/`: the hero as it is now.
- `img/`: the new plate, by day and by night, with sidecars.
- `option-1/`, `option-2/`, `option-3/`: round 1. Each holds its mockup, comps (`light-1440.webp` and the rest), `journey.webp` (four moments at 1440) and `phone-journey.webp` (six moments at 390).
- `sc32-core.jsx` and `sc32-options.jsx`, compiled to `sc32.js`, and `sc32.css`: round 1's mockup code.
- `round-2/`: round 2.
  - `img/`: the plates and the depth map, with their sidecars.
  - `option-1/` to `option-3/`: each holds its mockup, comps (including `open-*` with a place opened), `journey.webp`, `phone-journey.webp` and `motion.mp4`; option 2 also has `depth.webp`.
  - `r2-geo.js`, `r2-core.jsx` and `r2-options.jsx`, compiled to `r2.js`, and `r2.css`.
- `THIRD_PARTY_NOTICES.md`.

## The pick

- **Round 1:** none. Option 3 is the base for round 2 (above).
- **Round 2, 5 Oct 2026:** the maintainer picked **option 2, In depth**.

## The build

- **`design3/site/town.jsx`** (`window.SC3_TOWN`) replaces the SC-30 crew in the hero.
  - Its figures come from the data, through `core/money.js`.
  - Its styles are in `site.css` (`town-*`).
  - Its plates are `site/assets/plates/business.webp`, `business-night.webp` and `business-depth.webp`, with their sidecars.
- **One change from the mockup:** on phones the food bank's pin moves to the kitchen's right, clear of the distributor's (the suite caught the overlap).
- **The SvelteKit port** is `frontend/admin/src/lib/landing/Town.svelte`, with `town/` (the camera, the gestures, the depth renderer and the graph).
  - It is held to design3 by the drift and parity suites.
  - The showcase API carries the batch's sales a day and the food bank's minimum days.
- **Hosting:** the hosted landing page and console in platform v3 load commit `4f2bc65`.
