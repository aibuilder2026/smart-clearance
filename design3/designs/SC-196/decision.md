# SC-196 · the sign-ins' agents on phones and tablets in portrait

## The request (12 Oct 2026)

With a screenshot of the console's sign-in on an iPad in portrait (`current/reported-ipad-console.webp`):

> on mobile and ipad, the login graph does not great in portrait mode, need better design just for these devices, rest
> all is fine

SC-195's agents at work (the kit's `AgentStage`) are a band over the card below desktops:
- the desktop's wide orbit is squeezed into a short, wide box, so its nodes read as faint scribbles and only the agent
  at work shows;
- on a tall tablet the band stretches with the sign-in's grid rows, leaving an empty slab under its caption.

`current/` holds both sign-ins as they are, on a phone (390 × 844) and an iPad in portrait (820 × 1180), light and dark.

## The options

Each is the live workspace's sign-in and the console's (`option-x/workspace.html`, `console.html`), with the kit's
`AgentStage` replaced below desktops by `p.js` (shared: a copy of the stage's internals) and the option's `opt.js`;
`build.sh` compiles them and writes the pages. Each has stills of both sign-ins on a phone and an iPad in portrait,
light and dark, and its motion on a phone and an iPad (`motion-390.mp4`, `motion-820.mp4`: the walk, an agent tapped,
the field tapped). All three stop the band stretching, keep the tiles opaque over the field's lit nodes, and give names
their own ground so threads never cross the words.

- **A, The ring** (recommended): the eleven round a circle from the top, every agent a tile you can tap, the field inside
  it and the caption in its middle; names outward on an iPad.
- **B, The relay**: the agents on one track as the batch meets them, the three exits stacked at Execute; stop names over
  the track and agent names under the tiles on an iPad. The lowest band.
- **C, Around the card**: no band; the field behind the whole sign-in, the eleven on a loop round the card's edges, a
  pill at the top saying who is at work with a rail of the nine stops and Pause. The card sits highest.

Board: `board.html`, published as a private artifact, https://claude.ai/artifact/3KX1LKFqNmpAaphz1xFSg9 (Claude Design's
write needs `/design-login`, as for SC-195).
