# SC-25: the smartclearance.com landing page and the staff console

**The request** (4 Oct 2026, the maintainer's words):

> I need now a Smartclearance own landing page (client independet), as I mentioned SmartClearance will be offered as SaaS like nearxpiry.com and optoro.com and spoileralert.com > It will offer for this demo and landing page showcasing smart-clearance in a really surreal way. It will also have an website to configure client and the agents and other configurations needed for FMCG to work with the agents to track short dated stocks. As of now munchly will be the only client, so proper seed data should be in there. it should be like proper working prototype. Think of the best design based on the design system we have and come up with 2-3 page clickable prototype.

## Options and picks (4 Oct 2026)

**The landing page**

| Option | Idea | Comp |
| --- | --- | --- |
| **Miniature India** (picked) | One carton the size of a godown, parked in a miniature Indian town; the page follows where its packs go. | `img/landing-01-hero.webp` |
| Day above, night below | A daylight sky of drifting cartons over a lit night bazaar: stock adrift above, sold below. | `img/opt-landing-empire.webp` |
| Nine stops, one carton | The page is the tracker: one carton travels the nine stops down the page and the rail fills as you read. | `img/opt-landing-nine-stops.webp` |

**The console**

| Option | Idea | Comp |
| --- | --- | --- |
| **Agent pipeline** (picked) | A client's agents laid out as the nine stops, with the human yes as an amber gate in the middle. | `img/console-04-agents.webp` |
| Operations tables | A dense, keyboard-first console: every client, agent and person in sortable tables, with a command palette over all of it. | `img/opt-console-ops-tables.webp` |
| Settings beside the workspace | Change a client's setting on the left and watch its workspace change on the right. | `img/opt-console-preview.webp` |

**Build path:** "Landing matches, console guided". The landing page was built comp-led and the console code-led.

## The board

`board.html` holds the sixteen screens of the picked directions: eight for the landing page (including phone and dark) and eight for the console. Open it through the local server at `/designs/SC-25/board.html`. Its published copy is the claude.ai artifact [Smart-Clearance Platform Design](https://claude.ai/artifact/QNUcNjbENRZJYWBmFd2BrA).

## During the build

- On the comp's authority, the maintainer said:
  - "Yes, letterforms and logo don't bind"
  - "Mock-up is a guide, not exact"
  - "The comp can differ"
- Of the board's dark screen (L8), they said: "I need this dark mode experience".
- Built in [aibuilder2026/smart-clearance#16](https://github.com/aibuilder2026/smart-clearance/pull/16). Hosted in the platform v3 Claude Design project.
