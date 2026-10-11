# @smart-clearance/demo

The guided demo, in SvelteKit 3 (SC-63; v4 in SC-167): Munchly Foods on Smart-Clearance as a route map. The platform's
line sets Munchly up in the staff console, then three journeys run in Munchly's workspace: the Masala Chips sold
through, the Mango Drink sold through with a staff sale and a donation, and the chips' slow week, whose leftover packs
are destroyed at the godown on a second yes. A laptop and a phone run the real screens beside the station's notes. It
is a port of `design3/demo` (option B of SC-167's design round, the route map; the prototype is in the demo v3 Claude
Design project).

```sh
cd frontend
corepack pnpm dev:demo        # http://localhost:5176
corepack pnpm build:demo      # the static app, into demo/build/
corepack pnpm preview:demo    # serves the build on :4178
```

It is live at https://smartclearance-demo.web.app, its own Firebase Hosting site (`demo` in `../firebase.json`,
`smartclearance-demo` in `infra/prod/terraform.tfvars`; SC-64): `infra/scripts/deploy.sh demo` releases it from a
workstation, and CI releases it with the other apps on every merge to `main`.

## How to drive it

- **The route map** opens the demo: four lines, each station a button, each line's badge its start. Play the whole
  route plays it from the console's sign-in to the end. Pointing at a line names what it shows.
- **Next** (or →, Page Down) moves on a beat: it makes the person's move, or on an agent's beat skips ahead to what the
  agent does; the agents' beats also happen on their own after 1.5 s. On a station whose beats are done it moves to
  the next station. Back (←, Page Up) goes a beat back, past any an agent would make again on its own at once, and from
  a station's first beat to the station before.
- **Each person's move can be made in the devices instead**: sign in, tap the push on a lock screen, confirm, approve,
  order, bid, record the staff sale, collect the donation, send the destruction's photos, approve it. The notes tick
  the beat off as the store changes.
- **Between lines**, when Next moves the story on, the map comes up with the token hopping to the next line; it closes
  on its own while playing. A jump (a station on the map, 1 to 4, Back) has no hop.
- **The keys:** 1 to 4 jump to a line's start; M opens the map; P toggles phone only; N toggles the notes. The place is
  in the address (`#at=line.station.beat`, `#at=0.0.0` the console's sign-in; the old `#stage=N` opens the chips'
  station N), and an address followed by hand moves the story there.
- **The top bar:** the mark (back to the route map), the line on play as a strip of its stations (Map, each station a
  button, the batch riding it), Play the route and Pause, phone only, the notes, and the appearance menu. The end
  offers Ride it again and Stay on the last stop.
- **On a real phone** (narrower than 768 px), the person in focus fills the screen under a slim bar with Back, the
  station and Next; tapping the station opens the notes in a sheet, with the route map and all lines.

## How it is built

- **The story** (`src/lib/story.ts`) is `design3/demo/story.jsx`'s: four lines, each a run of stations (the day, the
  laptop and the phone, its figures), each a run of beats (who, what, the screen, the store's acts). Each station names
  its journey on the stub (`scenario`: chips, mango or slow; SC-168) and how far to fast-forward it, with any acts to run
  first (`prep`).
- **The player** (`src/lib/player.svelte.ts`) is `director.jsx`'s `usePlayer`: entering a beat puts the stub's store
  where it begins (`useScenario`, `fastForward`, the station's prep, then the beats before it), so any beat opens from
  the address or the map; a beat is done when the director ran it, the visitor tapped it, or the store says so.
- **The director** (`src/lib/Director.svelte`): the strip, the notes (`Notes.svelte`), the stage (`Stage.svelte`), the
  map between lines and on M (`MapOver.svelte` over `RouteMap.svelte`), and the end (`End.svelte`). The start is
  `Start.svelte` (`PhoneLines.svelte` on a phone). The map's geometry is `map.ts`.
- **The devices** (`src/lib/Device.svelte`) run core's workspace app (`@smart-clearance/core/workspace`): `RoleApp` for
  a person's screens, `SignIn` (guided, prefilled) for the sign-ins, and `LockScreen` for a push, inside core's
  `WindowFrame` and `PhoneFrame`, each an embedded `AppRoot`, so a device's screens lay out at its own width and its
  sheets stay inside it. A device's app is drawn afresh when a beat points it at a new screen.
- **The console** on Neha's laptop (`ConsoleDevice.svelte`, `ConsoleScreen.svelte`) is core's `ConsoleApp`
  (`@smart-clearance/core/console`, SC-169) on the console's demo world (`demoConsoleApi`: Munchly and four fictional
  clients, 180 days of batches, two demo requests), signed in as Neha; each beat names its route, and New client opens
  from Kesari Foods' request.
- **No backend:** the data is the workspace app's stub (three journeys, seeded from design3/core) and the console's
  demo world, in memory. Nothing is called and nothing is kept between visits.
- **Kept in step with design3:** `src/lib/demo.css` is `design3/demo/demo.css` verbatim, and the story is design3's,
  line by line, station by station and beat by beat (`tests/unit/shared.test.ts`).

## The browser suites (SC-65, SC-167)

Run only when asked (the `browser-suites` skill), each on the demo's build:

- **`test:a11y`**: the route map, every station of the four lines beat by beat, the map between lines and on M, the
  end, phone only, the notes, the appearance menu and the real phone's notes sheet, and the moves made inside the
  devices (the sign-ins, the channels as a table, the tracker's sheet, the Lister's API call, the marketplace, the
  staff sale, Meera's receipt, the destruction's evidence and its second yes), in five viewport and theme projects; the
  keys, the strip, the map, the menu and the end by keyboard; nothing looping, on the map, on stations, between lines,
  during autoplay and at the end. Then the coverage check, which leaves out the workspace admin's screens and the
  console's pages the demo never visits (`a11yCoverage` in `package.json`).
- **`test:e2e`**: → along the whole route, the start's map, each person's move made inside the devices on every line,
  the console's Overview and New client, Back, Map, the end, autoplay, phone only, the notes and the address; Firefox
  and WebKit smoke runs.
- **`test:parity`**: the route map, every station, the map on M and the end against `design3/demo` in five projects,
  and phone only and notes hidden on desktops.
