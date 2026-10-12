# SC-195 · the sign-in's backdrop and products, and the swing explained

## The request (12 Oct 2026)

From the maintainer's list of small UX changes, the two that change a design (the rest is SC-194):

> 4. For workspace login, I need a better background, may something with blurry effect --> product showcased should
>    be done in much better way
>
> 8. See image 6, there should a note added, clicking which I should see the detailed calculation how swing is
>    calculated and loss is minimized .

Image 6 was the Mango Drink's Journey card: "₹16,917 recovered, every line done · swing ₹22,194".

## The options

The board, `board.html` (published to app v3 as `SC-195 design review.html`), has two parts, three options each. Every
option is the workspace itself with only that part changed (`pages.py`, `mockup.tmpl.html`).

**The sign-in** (the live workspace's sign-in, `?state=signin`; each option replaces the desktop stage and the ground):

- **A, In focus** (recommended): one photograph, Munchly's chips and mango drink crisp on a kirana counter, the shop
  soft behind them, under the frosted card; a band at the top on phones. The plate is a local Qwen-Image render from
  the packs' renders, extended to 16:9 (`signin-a/plate.prompt.json`).
- **B, The range, behind glass**: SC-187's depot still far out of focus behind everything; Munchly's six food packs on
  a glass shelf with name, size and MRP, rising once (spring 260 / 26 / 1).
- **C, The brand's own light**: no photograph; a soft-focus field in the system's inks, drifting in once (2.4 s); the
  three packs composed large on a glass floor with reflections and name tags (spring 240 / 22 / 1).

**The swing** (Priya on the Mango Drink's page once it has cleared, on the stub; `?story=chips` for the chips, whose
counter moved the swing; every figure from money.js through `swing.jsx`):

- **A, How it adds up** (recommended): a note, "₹22,194 better than destroying it · How it adds up", opens a sheet: the
  swing, a bridge from the P&L if destroyed (−₹22,657.20) to the P&L with the plan (−₹462.90), the bin's lines, each
  exit's line, the swing as a sum, and how the loss was kept small.
- **B, Beside the figure**: "Show the working" opens two columns on the card: destroyed against the plan, line by line.
- **C, Pack by pack**: an ⓘ opens where the swing came from: each exit's share, and a pack against the bin.

The charts take SC-149's validated inks (#167a52 / #c2410c light, #34a571 / #e0662c dark), every bar labelled.

## The pick

12 Oct 2026, in the same request, through the board's two questions: **sign-in A, In focus** and **swing A, How it adds
up**, both the recommended options. The board was published as a private claude.ai artifact
(https://claude.ai/artifact/KnwHKox8M3HSmcwrRcNynP), since this session's sign-in had no Claude Design access; the copies
for app v3 are written by `publish.py`.

## The build (12 Oct 2026)

**The sign-in, In focus.** design3 first (`screens/auth.jsx` HeroStage and SignIn, `screens/live.jsx` SignInLive,
`screens/screens.css`), then core (`HeroStage.svelte`, `SignIn.svelte`, `SignInLive.svelte`, `screens.css` verbatim):

- the plate, `design3/system/img/signin-plate.webp` (1920 × 1072, 106 KB): the picked photograph rendered again at
  Qwen-Image's native size (2752 × 1536), which held the composition, sharpened the packs and corrected a misprinted
  "Mango"; its steps are in `signin-plate.prompt.json`;
- both workspace sign-ins (`.si-photo`) take it as their ground through `--si-plate`, made absolute, since a url() in a
  custom property resolves against the stylesheet that uses it;
- the stage: the mark and its line in glass, and "Munchly's packs, on a kirana counter" (the workspace's own name); the
  three floating renders, the result, the tracker and its Pause (SC-19, SC-21) are gone, and so is the card's carton;
- phones and tablets: a band of the photograph at the top (330 px, 520 px on tablets so the packs clear the card),
  fading into the ground;
- the text on the glass, measured on the rendered pixels at 1440: the primary ink 11.1:1 and the secondary 5.0:1 at
  the lowest in light, 15.4:1 and 8.2:1 in dark.

**The swing, How it adds up.** design3 first (`screens/brand.jsx` swingOf, SwingBridge, SwingWorking, SwingMoney, on
the Command Center's card and a batch's Journey; `screens.css`), then core (`workspace/swing.ts`, `SwingBridge`,
`SwingWorking`, `SwingMoney`, on `CommandCenter` and `BatchJourney`):

- each exit's line takes the units it took (realised, once the lines are done) at the plan's own price and costs a
  pack, the ExpireSoon lot at the counter; "Not paid" is the swing less the net, so the bridge lands on the P&L; the
  packs left at the godown get their own line;
- the inks pass the dataviz validator on the sheet's fill: #167a52 / #c2410c in light (CVD ΔE 9.1, normal 25.2),
  #34a571 / #e0662c in dark (9.0, 25.2), every bar labelled;
- amounts are kept whole on their line, so a minus never wraps away from its figure.

## Round 2 (12 Oct 2026)

After the build, the maintainer:

> The background of munchly console does not loopk good, I need the design to be more smartclearance specific,
> showcasing agentic mix in the UI on sign in, Try using cool motion animations, you have framer and other best of the
> best plugins, see what you can cook. It need to look really solid in light and dark mode

Read as the Munchly workspace's sign-in (round 1's In focus). Three stages of Smart-Clearance's own, in
`round-2/` (`r2.jsx` shared; each option's `opt.jsx`; `pages.py` writes the pages; `THIRD_PARTY_NOTICES.md` for the two
adapted ThreeUI effects), each with stills in light and dark at 1440 and 390 and its motion recorded (`motion.mp4`):

- **A, The agent mesh** (recommended): ThreeUI's constellation behind the whole sign-in; the ten agents and you on an
  orbit, lit in turn, the yes amber, sparks to the three exits at once;
- **B, Agents at work**: a deck of live agent runs in depth, the newest at the front, the rest receding into the blur;
- **C, The route**: the mark's S as the route through the nine stops; the exits fork at Execute; the pin lands.

The walk: 420 ms a stop, 800 on the yes, 900 on the exits, 4.64 s, then still; Replay; at rest under reduced motion.

### The pick (round 2)

12 Oct 2026, through the board's question: **A, The agent mesh**, "and it should loop constantly and it should be live an
interactive on touch and mouse click"; and the console's own sign-in takes the same stage ("Console too").

- **Looping:** the walk plays, holds on its result, and plays again, with the field drifting all the while. WCAG 2.2.2
  asks for a way to pause anything that moves for longer than five seconds, so the stage has Pause and Play,
  remembered in the browser; under reduced motion it is drawn at rest. AGENTS.md's loop rule gains it beside the
  landing page's hero film.
- **Live and interactive:** the field gives way to the pointer and lights the links near it; a tap or click on the
  field sends a ripple through it; each agent is a button that, pressed (or tapped, or Enter), holds the walk at its stop
  and says what it does, until it is let go.

### The build (round 2, 12 Oct 2026)

One stage for both sign-ins, in the kit: `AgentStage` in `system/product.jsx` (styles in `components.css`, the
sign-in's placement in `screens.css`), then core's `AgentStage.svelte` with `agents/mesh.ts`, `AgentField.svelte` and
`AgentCaption.svelte`. The MIT notice for the adapted constellation field is beside each copy
(`system/THIRD_PARTY_NOTICES.md`, `frontend/core/src/lib/components/agents/THIRD_PARTY_NOTICES.md`).

- **The loop:** 600 ms before the batch sets off, the nine stops in 4.64 s, 2.8 s on the result, then round again, the
  last handoffs fading over 500 ms as it starts. The field drifts only while the walk moves.
- **Pause and Play** under the stage (an icon in the band), remembered in the browser (`sc3-agents`); Pause keeps focus
  as it turns to Play. Under reduced motion every agent is drawn lit and nothing drifts; there is no Pause, since nothing
  moves, and an agent can still be picked.
- **The pointer:** the nodes near it give way a little, and it joins the field as a node of its own, its links drawn in
  the agents' green. A click or a tap on the field sends a ripple through it and lets go of an agent. Touch keeps the
  page scrolling (`touch-action: pan-y`).
- **An agent picked** (its chip, its node, or by keyboard) holds the walk at its stop: it is at work, those before it
  have worked, the rest wait; the caption names it, says what it did and the call it made, and a status line says it to
  a screen reader. Picked again, Play, Escape or a click in the field lets the walk go on.
- **Keyboard:** the agents are one stop in a tab (a toolbar), the arrows, Home and End move between them.
- **Desktops:** the field covers the whole sign-in under the card's glass, and the panel lets the pointer through round
  the card. The stage and the field keep to the sign-in's visible height, pinned while a long card scrolls by (the
  workspace's people list makes it scroll). The chips near the orbit's foot turn sideways so Paperwork and the
  Negotiator never meet.
- **Phones and tablets:** the band over the card; the agent at work is its tile on its node, the caption naming it, so
  the three exits never crowd.
- **The console:** its sign-in keeps "Console" and its line over the same stage; the scene plate beside the card is
  retired, and so is the plate the console's hosts passed in (`plate` on `ConsoleApp`).
- **Retired:** round 1's photograph (`system/img/signin-plate.webp`) and its `.si-photo` ground; the sign-in's ground
  is the app's own again, with its aurora.
- **Found on the way:** inside the guided demo's scaled devices the canvas measured the orbit in screen pixels, so the
  threads and the chips drifted apart; it now measures in its own (the device's scale divided out), for the pointer too.

Stills in `build/` (`r2-signin-live-*`, `r2-console-*`, `r2-signin-held-*`, `r2-signin-pointer-1440-light`) and the
motion recorded in `build/r2-motion.mp4` (20 s: the walk round twice, the pointer, a ripple, the Valuer and the Lister
held, Play).
