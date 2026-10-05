# SC-28: the landing page, refined

**The request** (4 Oct 2026, the maintainer's words):

> https://claude.ai/artifact/QNUcNjbENRZJYWBmFd2BrA -- check this, I want platform landing page section designs to match this, including the fonts.... The screenshot I pasted looks better for the "Your own workspace section". Dont inlude details of Munchly on landing page as they are our client, See landing page of https://www.spoileralert.com and https://nearxpiry.com. Rest all look fine. Design has to be professinal and engaging. Can we refine the design a bit more please

> [Of "Five exits, one batch":] This looks good, the picture, but may be also so something more engaging so that users understands what smart clearance is about

> [Of "Nine stops. Ten agents. One yes.":] Agentic flows can be shown with some motion animations which look cool.... Think of images and quick video clips may be.... or motion animations to depict the business

## What every option does

- **The board's sections and fonts** (SC-25 comps L2 to L6):
  - the street and the nine stops keep the condensed display heading;
  - the teams, plans and closing sections take the normal-width heading the comps show;
  - the street gains the board's three result cards, each still carrying its arithmetic;
  - plans and the close follow comp L6.
- **"Your own workspace"** follows comp L5:
  - three islands with products, and an address under each;
  - four team cards (supply chain, finance, sustainability, distributors);
  - the integration chips.
- **No client details:**
  - gone: the client's name, packs, people, workspace address, batch ids (`MF-…`), story section and sign-in menu entry;
  - the figures stay, labelled as an illustrative batch;
  - new unbranded renders replace the branded packs, godown and kirana (`img/`, each with its prompt sidecar).
- **Motion:**
  - it plays once when it comes into view, in under five seconds, holds on the result and offers Replay;
  - under reduced motion it arrives in place;
  - nothing loops (WCAG 2.2.2).

## Options

| Option | Idea | How it explains Smart-Clearance | Motion |
| --- | --- | --- | --- |
| **A. The board, explained and moving** (recommended) | The board's page with one new section: three steps, from at risk to sold | Three steps under the hero, each naming its agents, then the street as proof | The steps rise and their agents light up; the nine stops run as a live pipeline, with each agent saying what it did and a beat on the human yes |
| B. Explained like a platform | The references' structure: how it works, proof, teams, questions | Three product moments, each the card a team actually sees: the Watcher's alert, the Valuer's priced exits, the plan waiting for one yes. Then a questions section | Each card's rows rise and its figures roll; tapping Approve wakes the agents |
| C. The town at work | The diorama world in motion | Short clips of the miniature town: the town comes alive in the hero, and the square's amber button is pressed as the nine stops fill | Two LTX clips that play once and hold; the street's exits are priced one after another |

## In this folder

- `board.html`: the review board. Open it through the 8787 server.
- `current/`: the page as it is today, full length, in light and dark at 1440 and 390.
- `option-a/`, `option-b/`, `option-c/`. Each holds:
  - `mockup.html`, the option with its motion in framer-motion 11.18.2;
  - the comps, full length, in light and dark at 1440 (scaled to 1080) and 390, with every motion in its final state;
  - `motion.mp4`, the motion recorded from the mockup, with its last frame as `motion.webp`.
- `sc28.css`, `sc28.js`: shared by the three mockups. After the pick, the chosen option's rules move into `site/site.css`.
- `img/`: five Qwen-Image renders without any brand, each with its prompt sidecar:
  - three products for the islands: a snack pouch, a juice carton, an oil bottle;
  - the godown and the kirana, with blank signboards.
- `media/`: option C's two LTX clips, in H.264 and VP9, with their first and last frames and their sidecars.

Every mockup was scanned with axe (the suite's WCAG 2.2 AA tags and the target-size pass) in light and dark at 1440 and 390, after its motion had played: zero violations.

## Published for review

On the platform v3 Claude Design project, with assets pinned to commit `83635d5`:

- [the review board](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-28+design+review.html)
- [option A](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-28+option+A.html)
- [option B](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-28+option+B.html)
- [option C](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-28+option+C.html)

Each hosted page was checked against its local copy, line by line, and loaded in Chromium. Scripts mount, every image and clip loads, and every motion plays through to its end state. There were no console errors.

## Known defects in the review assets

- **Option C's clips are drafts.** They are recorded in their sidecars.
  - LTX moved the camera in both, though asked for a locked-off shot.
  - The phone tap in the square doesn't read.
  - Both were cropped back to their plates' shape, which removed LTX's pad strips.

  If C is picked, the clips are made again with the last frame pinned to the plate, which holds the camera, along with night versions.
- **The kirana render** keeps a tiny, illegible card on the display stand at its right. It came from the source render.

## The pick

**Option A, the board explained and moving** (5 Oct 2026), picked by the maintainer from the review board, as recommended.

The build follows the mockup:
1. `design3/site` first: the steps section, the result cards, the live pipeline, workspace L5, plans and close L6, and every client detail removed.
2. Then the SvelteKit port in `frontend/admin`.

The four renders it uses were copied into `design3/system/img`:
- the files themselves, with their sidecars and manifest entries;
- the PNG originals, kept local in `src/`.

This folder keeps its own copies for the review.

## Round 2

**The request** (5 Oct 2026, the maintainer's words):

> I would like to have a customized approach between A and B.....
>
> From A--> The Agents section looks good
> From B-->  How Smart‑Clearance works really well.
>
> I need you to rethink ---
>    i. Five exits, one batch. -- think of something more animated and engaging . The picture is fine, But somehow show a pictorial workflow how goods are diverted --- use motion animations if needed

**The page** in every round-2 option:
- B's "How Smart-Clearance works", its three product moments;
- A's nine stops, the live pipeline;
- everything else as option A was built.

**The options** are for "Five exits, one batch" only. Each keeps the street picture and shows, in motion, how the batch's packs are diverted. They are in `round-2/`.

The pick: pending.
