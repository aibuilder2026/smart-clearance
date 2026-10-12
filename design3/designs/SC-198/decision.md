# SC-198 · The sign-ins' ground: the map under the agents

## The request

The workspace and console sign-ins looked blank behind the agents (SC-195, SC-196). The maintainer asked for a layer
like the guided demo's route map, "something really surreal", and asked to see ideas.

## The ideas

Five ideas, each drawn live on the sign-in in day and night (`ideas.html`, published as the private artifact
[Sign-in Grounds](https://claude.ai/artifact/8SR6bgvwXmr6A12TUoHfWg)):

1. The map under the agents (recommended): the route map's plate, each agent on a post that lights while it works.
2. Golconda of cartons: cartons hung at depths over a faint map; at the yes one turns amber and splits into its exits.
3. The town on a sheet of paper: the town tilted on a sheet curling into the sky, the agents above it as weather.
4. The ledger landscape: the product's papers laid like fields, a green pen line ruled across with the walk.
5. Contour lines: a topographic map with peaks of stock at Nagpur and Hyderabad.

## The pick

**1, the map under the agents** ("lets go with 1 and see"). Built in design3 first, on the kit's `AgentStage`, to be
seen on the real sign-ins before the port.

## What was built (design3 `system/product.jsx`)

- **The ground** (`agGround`), drawn once a size and a theme into an offscreen canvas under the agents' field: the
  route map's dotted grid (18 px), two roads, the town's blocks in clusters on the grid, and the river along the foot.
  Seeded, so every visit draws the same.
- **By night** about a third of the blocks are lit windows, in the yes's amber at 15%; the river turns indigo.
- **The posts** (`agPosts`): a block under each agent's node, drawn each frame: the ink's fill while it waits, its own
  ink at 10 to 14% once it has worked, at 24 to 30% with a rim while it works (amber for the yes).
- **Clear ground for the words:** no block under the stage's head or its foot (Pause and the hint), nor on the river or
  round a post. Every ink is the field's own ink at low alpha, so the text keeps the contrast it had.
- **Tablets, and phones held sideways,** keep the agents around the card (SC-196), on the same ground, denser for
  the smaller box.
- **A phone held upright shows the form alone** (the maintainer, after seeing it: "for mobile portrait mode, make it like
  before cause no animation can be seen in such tight space"). The stage draws nothing there (a phone breakpoint, taller
  than wide), so the card sits on the sign-in's own ground, as before SC-195.
- Motion is unchanged: the ground never moves; the posts follow the walk, under its Pause and Play, and rest on the
  result under reduced motion.

## The port

`frontend/core`: `components/agents/mesh.ts` (`agGround`, the posts, the clear ground for the words) and
`components/AgentStage.svelte` (nothing on a phone held upright). The tests: a new one for the phone held upright, the
SC-196 one now on a phone held sideways (700 × 390), and the two phone sign-in goldens lose the agents' words.

## Stills

- `stills/`: design3's workspace and console at 1440 in light and dark, 820 × 1180, and 390 × 844 in light and dark.
- `stills/build/`: the port's stub builds (`ws-`, `cs-`) at the same sizes, plus a phone held sideways (700 × 390).

No page errors in any of them.
