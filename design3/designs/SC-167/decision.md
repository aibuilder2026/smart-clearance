# SC-167 · The guided demo's three journeys and the console

Part of SC-166, Guided demo v4.

## The request (11 Oct 2026)

> I now want to refine the demo app hosted on https://smartclearance-demo.web.app/
>
> it should include all the new features that was recently implemented and showcase the demo like it is now.. And it
> should be using mocked/stubbed data on UI layer. Now it should demonstrate 3 paths
>
> 1. Munchly Chips E2E journey which is able to sell all the stocks.
> 2. Munchly Mango drinks E2E journey which is able sell all the stocks.
> 3. This will be a munchly scenario where Munchly chip2 E2E is not able to sell chips hence call for destruction flow,
>    and approval from Supply chain manager.
> 4. The demo should traverse Console Screen to showcase client setup, existing clients and agent setup.
> 5. The demo should traverse all screens possible for each of the above usecases.
>
> The entire automated guided demo should look really intuitive and eyecatchy

## The options

Each option is a working mockup on the real kit, playing one shared story script (`sc167-acts.jsx`): the console's
prologue, then the three journeys, on the workspace's stub and the console (`console-frame.html`, Neha signed in, on
SC-149's world of Munchly and four fictional clients). Shared devices and the beat player are in `sc167-dev.jsx`.

- **A · Four chapters:** a lobby of four chapter cards (the platform, then the journeys), each played as the demo is
  today: chapter tabs and the stations in the top bar, the notes beside the devices with the screen on show named.
- **B · The route map (recommended):** the story is a map of lines in the product's own route idiom. The platform's
  line runs into Munchly's workspace; from there the chips, the Mango Drink and the slow week each run to an outcome,
  the slow week branching off the chips after the yes. Playing, the map folds into a strip over the stage and the
  batch travels it as a token (the console's `token` spring, 170/24/1); the map comes back between lines, the token
  hopping to the next.
- **C · The show:** it plays itself like a film: a title card, a card for each chapter with its batch and its cast,
  the device in play lit and the other dimmed, a caption with the station's figures, a timeline to scrub.

Why B was recommended: the map shows all three endings and how they relate at a glance (the slow week visibly shares
the chips' opening), the travelling token makes progress visible, and it is the product's own idiom (every batch a live
order on its route).

## Refinements before the pick (11 Oct)

The maintainer asked for B's UI glitches to be fixed ("the graph looks stunning, but has some UI glitches"), then for
its light mode to be more beautiful ("The graph looks great in dark mode, but in bright mode can we make it look more
beautiful"):

- the line badges were clipped at their top edge; the slow week drew a grey ghost track beside the chips' line (it now
  starts at its branch, and lights the chips' stations to the yes when played); badges and names had more room; the
  platform badge read "smart-clearance's console";
- the playing strip became an even track with one rail filled to where the story is, the token inside the bar, the
  station's name beside the line's; the map overlay's heading kept together; "recovered, where the bin would have
  cost ₹26,330";
- on a phone the start lists the lines, the slow week hanging off the chips with its branch drawn as a track;
- in light the routes sit on a plate drawn from the cluster map's tokens (ground, a dot grid, city blocks, a river),
  each line on a white road with its stations lifted and its names in full ink; dark keeps its ground; the start's map
  fits the window.

## The pick (11 Oct 2026)

**Option B · The route map.** The maintainer: "Go with option B, start the build".

### Its remaining states, for the build

- **Loading:** the console's device shows the console's own splash and placeholders (SC-49, SC-51) while it reads.
- **Reduced motion:** the map draws at once, the token jumps, the hop is a cut; every beat lands in its final state.
- **A phone:** the start lists the lines; playing, the person in focus fills the screen under a slim bar with the
  station's ring, Back and Next; Map opens the map in a sheet that scrolls sideways.
- **Long content:** station names on the map are short forms (Setup, Agents, Expiry, Yes); the strip names only the
  station on play; captions wrap in the station card.
- **The end:** three outcome cards with their figures rolling, Ride it again.

### The build (SC-166)

- **SC-168 · The stub's three journeys:** the Mango Drink and the chips' slow week as journeys of their own in the
  stub (design3's `core/` and core's workspace app), every figure from money.js; the chips' story unchanged.
- **SC-169 · The console, embeddable:** design3's console mounts inside another page with its route as a prop; the
  frontend console's screens move into core (`@smart-clearance/core/console`), the console app a thin host; a demo
  world of Munchly and four fictional clients for the Overview.
- **SC-167 · The route-map director:** design3's demo as option B, then the port in `frontend/demo`; released by CI.
