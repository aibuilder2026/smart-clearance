# SC-35 · A loader for the landing page, on first load and on day or night

## The request (5 Oct 2026)

The maintainer:

> I want a add a loader to the main landing page, which will show up when the page is loaded or day/night mode is selected. Think of a real aesthetically pleasing loader which would eye catchy

## The page as it was

- **First load.** Until the town's plate arrives (350 KB, drawn in WebGL2 with its depth map), the agents' pins, the place names and the tour's caption sit on an empty ground. `current/loading-1440.webp`
- **Dark chosen.** The bar, the buttons and the headline's ink turn at once, but the day plate stays until the night plate has loaded. Meanwhile the headline, now in the night ink, almost disappears against the day sky. `current/switch-1440.webp`

## What every option shares

- **When it shows:**
  - from the first paint until the fonts, the town's plate and its depth map are in;
  - when Light, Dark or Match device changes the theme, or the device turns to night while the page follows it, until the new plates in view are drawn. The theme changes under the loader, never in sight.

  Match device on a device already in that theme changes nothing, so nothing plays.
- **Real progress:**
  - it follows the page's own loading: each script as it arrives, the fonts, React's first render, the depth map, and the plate once the town has drawn it;
  - it never goes backwards, and between milestones it creeps without reaching the next one;
  - it shows long enough for its motion to read (about a second on a first load, half that on a later visit in the same session);
  - after 8 s on a first load, or 4 s on a switch, the page shows anyway;
  - the town's tour sets off once the loader has lifted.
- **Access:**
  - screen readers hear "Loading Smart-Clearance" once, and the page is marked busy until the loader lifts;
  - nothing takes focus, and after a switch focus is where the visitor left it;
  - only the loader moves, and only while the page loads, which WCAG 2.2.2 allows for a loading indicator;
  - under reduced motion each option shows a still frame, and the page appears as soon as it is ready.
- **How it is built:**
  - HTML first: the loader is on the page before React (`sc35-loader.js`, plain ES2019);
  - Framer Motion runs its exit and the switch (`motion` in the SvelteKit build);
  - the theme waits behind a gate in the theme provider (`sc35.jsx`);
  - the town says when its depth map is in and when it has drawn a plate (`sc35-town.jsx`, the built town with that handshake added).

## The options

Each option is the real landing page with only the loader added. `option-*/mockup.html` is the mockup, `motion.mp4` the recording (a first load on a slowed connection, then Dark, then Light), and the WebP files are the stills. Switch times were measured on a local server, from the choice to the loader gone.

| | Option | First load | A new theme | A switch |
| --- | --- | --- | --- | --- |
| A | The route | The mark draws its S from the godown dot as the page loads. The amber pin lands and the mark opens into a window onto the page. | The new ground pours out of the control as the mark's squircle; the mark draws, and the window opens. | about 1.8 s |
| B | Dusk and dawn | A paper skyline of the town under a sky that turns with the load: dawn for a light page, nightfall for a dark one. The sun or the moon climbs, and windows light at night. The layers part as the camera moves into the town. | Dark plays dusk, with the moon rising and the windows lighting. Light plays dawn. | about 2.3 s |
| C | The lens | A seven-bladed iris opens as the page loads, the page out of focus behind it. The focus point locks, the blades sweep away and the town comes into focus. | The shutter closes in the old theme, turns while shut, and opens on the new town. | about 1.5 s |

**Recommended: C, the lens.**
- It suits the page's material: photographs of a miniature, with a focus that already follows the camera in the hero.
- It is the quickest on a switch.
- It shows the real page as it arrives.

B is the most memorable switch, and the only one that tells day from night, but it is the slowest and adds a drawn skyline to maintain. A is the simplest to build.

## Open questions

- Should the loader play on every visit? The mockups play a shorter version on later visits in the same session.
- Should a click or a key skip the rest of a switch once the new plates are in?
- The loader also plays when the device turns to night while the page follows it. Should that be quieter?

## The pick

**A for page loads, B for the day and night switch.** The maintainer, 5 Oct 2026, after the three mockups had been built and published:

> I want to implement option A for page loads and re-loads and Option B for day/night switch

- **Every load of the page, reloads included:** A's route. A later load in the same session plays its shorter version.
- **Light, Dark or Match device, or the device turning to night while the page follows it:** B's dusk or dawn.
- Both read the same progress, and both keep what every option shares (above). C, the recommendation, is not built.

The review board is `board.html`, published to the platform v3 Claude Design project as `SC-35 design review.html`, with the pick recorded on it.
