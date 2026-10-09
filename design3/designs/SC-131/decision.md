# SC-131 · The console's splash and the landing page's loader on a slow line

## The request

The maintainer, 9 Oct 2026:

> I need you to rethink the login/logout splash and reloading splash for console. For slow networks, it does not load
> properly. Also for the main landing admin screen, the loader effect is good but in slow network it is taking time.

And, while the round was being designed:

> The animation where it shows green dots, that itself is loading a bit slow and looks odd, that needs to be changed,
> may think about some motion animations, making the logo throb when loading, think along those lines.

## What was wrong

Measured on the live apps on 9 Oct, cold cache, 1280 × 800, with Chrome's throttling (`current/`):

- **The console, 3G** (400 kbps, 2 s round trips): blank until 7.9 s, because the splash's inline script sits after the
  app's render-blocking stylesheet; "Connecting" while the code downloads; "Waking the platform up…" at about 10 s;
  **"The console did not answer" at 15.4 s**, although nothing failed (the 8 s limit counts the code's download); it
  opens anyway at 17.7 s.
- **The console, Slow 4G** (1.6 Mbps, 560 ms): blank to 2.7 s, the three green stops, the sign-in at 7.4 s.
- The inlined splash leans on the app's stylesheet (its tokens, the kit's tracker, the wordmark), so it cannot stand
  before it, and its progress is redrawn by script every frame, which freezes while the browser reads the app's code.
- **The landing page, Slow 4G:** blank to 2.7 s, the loader until 11.7 s, waiting on the hero's 369 KB plate while the
  table's 240 KB plate, the 6.5 MB film (`preload="auto"`) and 393 KB of fonts download beside it.
- **The landing page, 3G:** blank until 6.9 s; the route stuck halfway; lifted on its 8 s cap at 15.2 s onto a page with
  no plate and its heading in a fallback face, its turning word overlapping (fonts at about 29 s).

## What every option fixes

- The cover paints with the page's first bytes: its styles, inks and wordmark come inline, and the app's stylesheet no
  longer holds back the first paint while it is up (3G: about 2.4 s for both, from 7.9 s and 6.9 s).
- No green dots: one title and one line say what it waits for (loading the console, connecting to the platform,
  opening). Past 3 s, "Slow connection · still loading".
- It never claims a failure for a download still arriving: only a refused read, an offline line, or a read with no
  answer for 20 s, and then it names it, with Try again.
- The API's connection opens with the first bytes; the console's code for after a sign-in is fetched while the person
  types.
- The landing page fetches its first screen first (the poster at high priority; the table's plate when near; the film
  after the lift; only the first screen's fonts, a subset for the Hindi line), and lifts once the first screen can be
  read on the plate's soft preview; the plate sharpens in place (3G about 5 s, Slow 4G about 2.9 s).
- The exit the maintainer liked stays: the pin pings once and the mark's squircle opens into a window onto the page.

## The options

Each is played over the real pages from design3 (`sim/`: the console's sign-in and Overview, the landing page's hero
and its soft preview) on a simulated Fast, Slow 4G or 3G line, the timelines estimated from the measurements with the
shared fixes in. `option-x/mockup.html` takes `surface` (boot, enter, leave, site), `line`, `theme`, `w`, `reduce` and
`at` (freeze there).

- **A · The heartbeat** (recommended): the mark is the loader. Drawn whole, it beats while anything is on its way, two
  pulses a beat (to 1.08, then 1.045) every 1.3 s, a ring of its outline rippling out on the strong pulse; ready, the beat
  settles on a spring (420/30/1), the pin pings, the window opens. CSS transform and opacity only, so the compositor
  keeps it smooth while the browser is busy.
- **B · The route runs:** a bright stretch of the S runs from the godown dot to the pin, a lap every 1.15 s, the pin
  throbbing as it arrives; ready, the last lap draws the whole route. A stroke animation, painted, so a long task can
  hold a frame of it.
- **C · The mark fills:** real progress inside the mark, its outline filling with the brand green by the first screen's
  bytes and the platform's reads; it breathes while it waits on the platform. Script-driven, and the build must keep a
  byte list of the first screen.

All three: screen readers hear each wait once, the page behind is inert and `aria-busy`, only the loader moves and only
while something loads, and under reduced motion the mark is still and the words carry the wait.

Recommended: A, because it is what the request reaches for (the logo throbbing), it is the only one the browser keeps
smooth while it reads the app's code (the moment the green dots stutter today), and with the shared fixes it is on
screen with the first bytes and never cries wolf.

Open questions on the board: does the workspace app's live splash, which shares the console's script, change too
(default yes)? The landing page's theme switch (dusk and dawn) is out of this round.

## The pick

**B · The route runs**, picked by the maintainer on 9 Oct 2026 from the board (`SC-131 design review.html` in platform
v3). The open question was answered **yes**: the workspace app's live splash, which shares the console's script, changes
with it.

What the build carries:

- **The mark is the loader.** The route stands at 30% white; a stretch of it, three tenths long, runs the S from the
  godown dot to the pin, a lap every 1.15 s; the pin throbs to 1.38 as the stretch arrives. Ready: the last lap draws the
  whole route (380 ms) and stays, the pin pings once, and the mark opens into the window (and flies to the page's mark
  first, in the console). Under reduced motion the route is drawn whole and still.
- **No green dots.** The console's tracker goes; one title and one line say what the cover waits for.
- **Every fix the board shared:** the cover paints with the page's first bytes; it fails only on a refused read, an
  offline line or a read silent for 20 s; "Slow connection · still loading" after 3 s; the API's connection opened early
  and the console's code fetched while the person types; the landing page's first screen first, lifting once it can be
  read on the plate's soft preview.
- **Where:** the console's splash (design3 `console/splash.js` and its `@splash` block, then `frontend/console`), the
  workspace app's live splash (the same script, in its own words), and the landing page's loader (design3
  `site/loader.js` and its block, then `frontend/admin`).
