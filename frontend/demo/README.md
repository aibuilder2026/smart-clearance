# @smart-clearance/demo

The guided demo, in SvelteKit 3 (SC-63): one near-expiry batch in Munchly Foods' workspace on Smart-Clearance, in nine
stages from the sign-in to the BRSR line, on a laptop and a phone running the real screens, with the narration beside
them. It is a faithful port of `design3/demo` (the approved demo v3, hosted in the demo v3 Claude Design project), so it
had no design round.

```sh
cd frontend
corepack pnpm dev:demo        # http://localhost:5176
corepack pnpm build:demo      # the static app, into demo/build/
corepack pnpm preview:demo    # serves the build on :4178
```

## How to drive it

- **Next** (or →, Page Down) moves on a beat: it makes the person's move, or on an agent's beat skips ahead to what the
  agent does. Back (←, Page Up) starts the stage again, or goes to the one before.
- **Each person's move can be made in the devices instead**: sign in, tap the push on a lock screen, confirm, approve,
  order, bid. The narration ticks the beat off as the store changes.
- **The keys:** 1 to 9 jump to a stage; P toggles phone only; N toggles the notes. The stage is in the address
  (`#stage=3`).
- **The top bar:** Autoplay (human beats advance on a timer, the agents run on their own), phone only, notes, the
  appearance menu, and Restart. The finale offers Play it again.
- **On a real phone** (narrower than 768 px), the person in focus fills the screen under a slim bar with Back, the
  stage and Next; tapping the stage opens the notes in a sheet.

## How it is built

- **The director** (`src/lib/Director.svelte`) is `design3/demo/director.jsx`'s: the beats are data
  (`src/lib/stages.ts`), and entering a stage fast-forwards the store to where that stage begins
  (`fastForward` in core's workspace app) and lets that stage's agents run (`Agents.maxStage`), as the prototype does.
- **The devices** (`src/lib/Device.svelte`) run core's workspace app (`@smart-clearance/core/workspace`): `RoleApp` for
  a person's screens, `SignIn` (guided, prefilled) for the two sign-ins, and `LockScreen` for a push, inside core's
  `WindowFrame` and `PhoneFrame`, each an embedded `AppRoot`, so a device's screens lay out at its own width and its
  sheets stay inside it.
- **No backend:** the data is the workspace app's stub, seeded from design3/core, in memory. Nothing is called and
  nothing is kept between visits; the splash shows once a session (`sc3-demo-splash`).
- **Kept in step with design3:** `src/lib/demo.css` is `design3/demo/demo.css` verbatim, and the beats are the
  director's, in order (`tests/unit/shared.test.ts`).

## Not yet

- No Hosting site, and CI builds it but does not release it.
- No a11y, e2e or parity suite; the gate (`lint`, `check`, `test`) covers it.
