# SC-49 · Console motion: loaders, Sign in and a livelier Overview

## The request

The maintainer, 6 Oct 2026:

> On console ui, I want to add some cool loader effects, like the hydrating effect when I am changing tabs. Pressing the
> sign in button should be more engaging, currently clicking sign in is removing the text. Make the console UI more
> engaging, especially the overview page graphs, charts and the way the agents are running in batches.

## What was wrong

- **Sign in:** the kit's `loading` state (`.btn[data-loading]`) makes the label and icon transparent behind a spinner, so
  for over a second the button is an empty green bar.
- **Screens and tabs:** design3 fades the next screen in over 180 ms. In the build, each route's load waits for its
  reads (`prefetch`), and the old screen stays put with no sign that the click was heard.
- **Overview:** the figures and charts are drawn once and swap in place on each reading; the agents' work is only counts
  by stop and a list of runs.

## The options

Each option is the console itself (`console49.jsx`, a fork of `design3/console/console.jsx` with hooks), with its own
`option-x/motion.jsx` and `motion.css`. `sc49-world.js` adds four fictional clients and 30 days of batches, and moves
the agents every few seconds (`?tick=`) so the Overview has readings to show. `sc49-shared.jsx` holds the simulated
load (`?latency=`, 700 ms by default), the placeholder shapes and the chart geometry.

- **A · The route** (recommended): the landing page's loader in the console. A green route draws along the top of what
  is loading and lands its amber pin, while the screen's shape hydrates in a green wash. Sign in draws the mark's S and
  welcomes the person by name. The figures roll, the charts draw themselves once, and Agents at work shows every batch
  as its client's mark, travelling the nine stops. It takes the place of "In flight, by stop".
- **B · The fill:** placeholders fill with ink and the content surfaces. Sign in fills, then floods the page green. The
  figures count up, the charts fill from their baseline, and the stops are vessels that drops fall between.
- **C · Quiet and quick:** a progress line and the kit's placeholders; a spinner beside Sign in's label; still charts
  that move and are marked only when a reading changes them; a Live activity feed beside the bars by stop.

All three pass axe (WCAG 2.2 AA) at zero violations in light and dark, at 1440 and 390, on the sign-in, the Overview
and a client page.

## The pick

Pending: asked on the board, `SC-49 design review.html` in platform v3.
