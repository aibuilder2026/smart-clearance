# SC-34 · The hero's tour: back to the whole town on leaving, slower, a card for each agent

## The request (5 Oct 2026)

The maintainer, on the SC-32 town hero:

> on the hero, small changes need,
> When I focus out of the hero, it should return back to original size so that I can see the full picture.
> Also the playing time is too fast it should a bit slower
> during the play these. popups should auto appear one by one when the related nodes are focussed

"These popups" are the town's agent cards, as the maintainer's screenshot shows. The Router's reads: "Splits the batch under each exit's caps. This batch: 588 to 31 kiranas, 772 to one buyer. From: Valuer. Hands to: You".

## What every option shares

- **The tour.** A beat with agents becomes a stop for each agent, in the order they work, so the cards come one by one.
- **Leaving the hero brings the whole town back.** Leaving means any of:
  - the pointer leaves the hero (after 300 ms, in case it only slipped out);
  - focus moves out of it;
  - a tap or click lands outside it;
  - it scrolls out of view.

  A card the visitor opened closes, and the camera flies back to the whole business.
- **Pause and Play.** The tour now runs longer than five seconds, so it carries a Pause / Play button in Replay's place (WCAG 2.2.2). The caption's steps also stop it.
- **Taking the camera holds the tour.** A drag, a pinch, a zoom or a card opened by the visitor pauses it, and Play hands the camera back.
- **Out of view, the tour holds.** It carries on when the hero is back in view.
- **Reduced motion.** The result is there at once, with no tour.

## The options

Each was built as the real landing page with only the hero's town changed. They share one script, `sc34-town.jsx` (`window.SC34_OPTION`), and `sc34.css`. The frames are each option at the Router's stop: `option-*/{light,dark}-{1440,390}.webp`.

| | Option | The camera during the tour | The card | Pace | In all |
| --- | --- | --- | --- | --- | --- |
| A | Beat by beat | The seven beats' shots, as SC-32 | The visitor's card, docked bottom left. On phones a compact card over the foot of the town | 1.4 s an agent, 1.9 s the yes, 1.2 s a beat without agents | about 18 s |
| B | Agent by agent | Flies close to each agent in turn | Docked, as A | 1.8 s, 2.3 s, 1.4 s | about 23 s |
| C | The whole picture | Stays on the whole town | A small card beside the agent's pin: its name, its post, what it did for this batch | 1.3 s, 1.7 s, 1.1 s | about 17 s |

## The pick

**Option C, the whole picture.** The maintainer said "lets go for option C" on 5 Oct 2026, in the same request, after the three options had been described and while their mockups were being built. No review board was published before the pick. `board.html` is the record.

## What the build added to option C

- **A stem.** The card stands on a stem over the agent's pin, as the places' pins stand on theirs, so it reads as attached even where it is held inside the stage's edge.
- **One name.** The pin's own name stands down while the card names the agent, so "Router" no longer shows twice.
- **Phones and tablets.** These stages crop the town's sides, which put You, Paperwork, Outreach, the Lister and the Negotiator off the stage while their card showed. The camera now slides sideways, at the same size, to keep the agent at work (or the beat's place) in view. On desktops the whole width is in view, so nothing moves.
- **Retired camera shots.** The beat-by-beat shots that only the old tour used are gone. The places' shots stay, for a place opened.
- **Timing.** The pace is 1.3 s an agent, 1.7 s on the yes and 1.1 s on the two beats without agents: 16.9 s, after the half second the tour waits for the town to load.

## Checks

- **Contrast.** The card's text was measured on the pixels behind it, in light and dark, at 1440 and 390, for Data, the Router, You, the Negotiator and Impact. The lowest reading is 6.69:1, the small "at the distributor" line on the day plate.
- **The suite.** design3/a11y gained three tests:
  - an axe scan with the tour paused at a card;
  - a motion state with a card showing;
  - a keyboard test: Pause holds the tour and Play carries it on; a place opened from the keyboard holds it; focus moving out of the hero closes the card and brings the whole town back.
