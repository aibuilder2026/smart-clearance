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

## In this folder

- `board.html`: the review board.
- `current/`: the hero as it is now.
- `img/`: the new plate, by day and by night, with sidecars.
- `option-1/`, `option-2/`, `option-3/`: round 1. Each holds its mockup, comps (`light-1440.webp` and the rest), `journey.webp` (four moments at 1440) and `phone-journey.webp` (six moments at 390).
- `sc32-core.jsx` and `sc32-options.jsx`, compiled to `sc32.js`, and `sc32.css`.
- `THIRD_PARTY_NOTICES.md`.

## The pick

Round 1: none; option 3 is the base for round 2 (above). Round 2: pending.
