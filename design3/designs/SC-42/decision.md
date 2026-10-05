# SC-42 · The town hero: hover a place or agent for its card and a closer look, a tidier Lister and Negotiator, the caption always in view

## The request (5 Oct 2026)

The maintainer, on the SC-32 / SC-34 town hero, with screenshots of it at night and of its caption at "7 of 7":

> I like this hero, can you make the design a bit more intuitive and interactive. Like hover on each nodes to should
> zoom and pan in on it and show the details card. Focussing and hovering away should make it go back to its original
> state.
>
> Lister/Negotiator on the hero does not look proper, needs refinement.
> Also the progress where it shows 7 of 7, problem is on smaller resolution desktops its going done and cannot be be
> seen.
>
> Can we make some more refinement of the hero and make it more engaging.

## The hero as it is

`current/`: 1366 × 768 in dark, and 1440 × 900 in light, at the result.

- **The caption is cut off.** At 1366 × 768 the caption ("7 of 7 Sold, not binned"), Replay and the zoom buttons sit
  below the fold. The desktop hero keeps the comp's 1280 : 800 frame, so its height follows the width alone: 854 px at
  1366 wide.
- **Lister and Negotiator sit in the wrong place.** They stand on the bushes by the kiranas' roofs, beside Outreach and
  the Retailers pin. They work for the buyer, whose warehouse and truck are up the highway at the top right. The long
  handoff lines from You and Paperwork bunch in that corner.

## What every option shares

- **The caption always in view:** on desktops the hero is no taller than the screen, so the caption and its controls
  sit in view at 1280 × 720 and 1366 × 768.
- **Lister and Negotiator at the buyer:** the Lister at the warehouse's loading bays, the Negotiator by the truck.
  Outreach stays with the kiranas.
- **A quieter graph at rest:** the handoff lines rest fainter; the handoffs of the agent at work, pointed at or open
  stand out.
- **Fuller cards:** each says what that place or agent did for this batch, who works there, and the handoffs.
- **Leaving the hero brings the whole town back:** by pointer, by focus, by a tap outside, or by scrolling away (as
  SC-34). A click or Enter keeps a card open. The tour holds while the visitor looks, and carries on after.

## The options

Put to the maintainer as described behaviours, as SC-34's were.

| | Option | Hovering a place or an agent |
| --- | --- | --- |
| A | Card first, zoom on dwell (recommended) | <ul><li>The card opens at once, and the node's handoffs light up.</li><li>Rest on it about 0.6 s and a ring fills round the pin; then the town zooms in about it (1.8×), so it stays under the pointer.</li><li>Sweeping across the town shows cards without the camera lurching in and out.</li></ul> |
| B | Zoom on hover | <ul><li>Pointing zooms the town about the node at once (1.8×, 0.5 s), and opens its card.</li><li>The most direct, but crossing several nodes zooms in and out each time.</li></ul> |
| C | The loupe | <ul><li>No camera move: a round magnifier rises over the town where the pointer is (2.2× inside the lens), with the card beside it.</li><li>The calmest, but the zoom is local rather than the whole view.</li></ul> |

## The pick

**Option A, card first, zoom on dwell.** The maintainer picked it on 5 Oct 2026 ("Card first, zoom on dwell
(Recommended)"), from the described options, before any board was made.

## Round 2: the hero on every screen (6 Oct 2026)

Looking at the build of option A, the maintainer wrote:

> The text is not looking good, too much clutter

with a screenshot of the heading, its line and the buttons run together on a short laptop window, and then:

> Make the hero visually appealing on desktop, laptop and mobile screens as much as possible with the given direction
> and camera zoom as selected. On mobile, tablets and ipads, I want similar background of the hero merging in the sky
> experience too.. Think hard and come up with best solution

**Fixed, no design change:** round 1's height cap left the heading group sized by the window's width, so a short
window squeezed it. It is now sized by the frame as drawn (`--hu`), keeping the approved spacing
(`round-2/fixed/`).

**Options**, on the board (`board.html`), each the real page with `round-2/sc42.css` and `round-2/sc42-town.js`, at
390 × 844, 820 × 1180, 1440 × 800 and 1440 × 900, light and dark:

| | Option | What it does |
| --- | --- | --- |
| A | The horizon (recommended) | The town sits lower under an open sky, the plates' own colour continued upward. The copy stands on clear sky; phones and tablets get the same picture, full-bleed, with the caption docked on the town's foot. |
| B | The haze | The town stays big behind the copy; the renderer's tilt-shift haze holds at rest behind it. Phones and tablets get the town from behind the buttons down. What stands in the haze (the Landfill and the Lister on desktops) is hidden at rest. |

**The pick:** waiting for the maintainer.
