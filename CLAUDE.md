# CLAUDE.md

@AGENTS.md

## Claude Code specifics

**Which tool for what**

- **UI or design work:** every new UI or UX change goes the Claude Design route first (the `design-first` skill):
  1. Design 2 or 3 options with `impeccable`, plus `ui-ux-pro-max` for product screens or the taste skills for the landing page. Prototype motion in Framer Motion; use Qwen for imagery and LTX for video assets.
  2. Save them in `design3/designs/SC-<n>/`. `design3` is the source of truth for designs.
  3. Publish one review board to the surface's Claude Design project.
  4. Build only the option the maintainer picks.

  `PRODUCT.md` and `DESIGN.md` are the context. For a finished build, hand off to `impeccable-finish-reviewer`. To record the design system, use `impeccable-documenter`.
- **Accessibility:** the a11y suite is the frontend's, `corepack pnpm test:a11y`: each app's real UI (never `/ds`), every core component it uses on screen in some scan (SC-58). The a11y, e2e and parity suites run only when the maintainer asks for them in the current request (the `browser-suites` skill, SC-55); never as a step of a design or UX change. For a manual WCAG audit, use the `accessibility-tester` agent with the `accessibility` and `web-design-guidelines` skills.
- **Charts:** the `dataviz` skill. Validate palettes with its script; don't eyeball them.
- **Images and motion:** `qwengen-bf16` for images (Qwen-Image) and `ltx-clip` for clips (LTX). Write the `.prompt.json` sidecar beside each asset.
- **Vertex AI's models** (Veo 3.1 for clips, Nano Banana 2 and Pro for keyframes and character sheets): the tracked scripts in `design3/tools/vertex-media/` (`veo.py`, `nano.py`, `assemble.py`, `seams.py`, `frames.py`, `cost.py`), which price every call first and write the sidecars (SC-154). They cost money: ask with the figure before a design round and before a build, and report the spend with `cost.py`. The image models serve only on the `global` endpoint under their GA ids; `veo.py doctor` checks.
- **Canvas, WebGL and Three.js effects:** the `threeui-community` plugin (user scope). `/threeui <what you need>`, or its `threeui` MCP tools, search ThreeUI's free Community catalog and return the source.
  - Adapt what it returns by AGENTS.md's design rules, with the MIT notice beside the adapted code.
  - ThreeUI's own MCP server is for Pro members only, and is not set up.
- **The frontend (`frontend/`):** a change to a surface already ported goes into design3 first, then into the Svelte port. In the browser pane:
  - preview the landing page with the `frontend-admin` (dev, :5173) and `frontend-preview` (build, :4173) launch configs, the console with `frontend-console` (dev, :5174) and `frontend-console-preview` (build, :4176), the workspace app with `frontend-workspace` (dev, :5175) and `frontend-workspace-preview` (build, :4177), and the guided demo with `frontend-demo` (dev, :5176) and `frontend-demo-preview` (build, :4178);
  - restart a preview server after a rebuild, since it reads the build's file list once and 404s new chunks;
  - compare against the `design3` config (:8787).
- **Tickets:** the jira-flow skills: `/jira-flow:work`, `:status`, `:pr`, `:ship`.
- **Infrastructure (`infra/`):** the scripts, never bare `terraform` (they set up credentials and init). Plan to a file, read all of it, then apply the file. Auto mode refuses a blind `-auto-approve`.
- **A missing capability:** the `aitmpl` skill. Reading a component is fine; installing one needs a yes.

**Claude Design (the hosted pages)**

- Project ids:
  - DS v3: `909d23bb-bd3c-466b-abf8-4eccc7c5881e`
  - demo v3: `8294ec70-3e6b-4359-8de6-2a3fd056c3b2`
  - app v3: `78962e0f-7300-46e4-8be7-ee1cbd101839` (the page, `manifest.webmanifest` and `sw.js`)
  - platform v3: `976c5462-c3c3-4621-80b5-29b3cdda8326` (the landing page and the console, which link to each other)
- To write:
  1. Call `finalize_plan` for the paths.
  2. Call `write_files` with each file's `if_match` etag.
  3. Verify with `render_preview`.

  Its `serve_url` is for browser tooling only; give people the claude.ai/design link.
- A re-pin changes only the 40-character SHA, so every file keeps its byte size. Compare sizes after writing to catch slips.

**Jira**

- cloudId `81c51173-bbea-4905-bbc5-1a880fa348bb`. Transitions:
  - To Do: 11
  - In Progress: 21
  - In Review: 31
  - Done: 41, only with a yes
- Move an issue to In Progress at its first edit. Move it to In Review when the branch is pushed, with a comment giving the evidence: test results, what changed, and the state of the hosted pages.

**Sessions**

- Project agents, skills and `.mcp.json` servers load at session start. After changing them, start a new session.
- The built-in browser was refused claude.ai pages; Claude in Chrome reaches them.
- When asked to run them, the a11y suite takes about 2 minutes an app with its build (give both apps a 10-minute timeout), the e2e suite under a minute an app, and the parity suite about 40 seconds an app after a build. Run them with `PUBLIC_API_BASE=` empty. In the agent's sandboxed shell Firefox cannot start; Chromium and WebKit can.

## Recent changes (5 Oct 2026)

- **Design v3** (SC-12 to SC-15, PR #7): the design system, the guided demo and the app prototype, published to Claude Design and pinned to commits.
- **SC-16** (PR #8): the demo's top bar now sits above the device frames, so the Appearance menu opens over them.
- **SC-17** (PR #9): accessibility tooling from aitmpl (the auditor agent, three skills and the Chrome DevTools MCP), plus the `design3/a11y` suite.
- **SC-18** (PR #10): every axe WCAG 2.2 AA failure is fixed, and the suite passes with zero violations.
  - Sheets and alerts take focus, trap it and return it; inside device previews they stay non-modal.
  - Numerals are read out from visually hidden text.
  - Scroll regions are focusable.
  - Contrast is fixed in five places.
  - The hosted pages load its commit `fe559a7`, which is now part of `main`.
- **SC-19** (PR #12):
  - the sign-in hero has a remembered "Pause animation" control (WCAG 2.2.2);
  - every menu follows the WAI-ARIA menu-button pattern;
  - keyboard tests cover both.
- **SC-21** (PR #13): every loop stops within five seconds (WCAG 2.2.2).
  - Pings, aura, typing dots, renders, scanline, map pin and the demo rings all stop.
  - The sign-in hero plays once and offers Replay.
  - `motion.a11y.spec.ts` fails on any endless animation.
- **SC-20** (PR #11): this file and `AGENTS.md`.
- **SC-22** (PR #14): the story (v6) and the Journey Map now follow v4.1.
  - The story is told with the v3 renders and portraits, plus a new portrait for the Raipur buyer.
  - Every scene pairs a story illustration with the v3 design. Two of the v5 drawings are adjusted to v4.1, and scenes 1 and 5 are newly drawn in the same style.
  - Both documents carry a detailed supply-chain diagram.
  - The story works through every v4.1 calculation.
  - The repo copy of the Journey Map is now v4.1.
- **SC-23 and SC-24** (PR #15): the demo and the app are now Munchly Foods' workspace on Smart-Clearance, on Journey Map v4.1. The hosted pages load its commit `58c6874`.
  - SC-23: the money model and the demo data follow v4.1 and story v6: five channels, the price-support credit note, Agrawal Wholesale in Raipur, 31 kiranas, the day-7 shelf check.
  - SC-24 branding, picked by the maintainer from mockups: product first. The Smart-Clearance mark leads; Munchly's workspace sits under it; Munchly leads its own sign-in page with "Powered by Smart-Clearance".
  - SC-24 sign-in, also picked from mockups: email or phone first, at munchly.smartclearance.com.
  - Also new: Rakesh's one-time permission, an admin Workspace screen, and the demo's stage 1, which now opens with both sign-ins.
  - Fixed on the way: tracker labels share one line and stop times wrap only at a space; the design-system page hides its contents list below 1100px as intended, with the mark in its top bar and the compact tracker on phones.
- **SC-25** (PR #16): the smartclearance.com landing page ("Miniature India") and the staff console ("Agent pipeline"), picked from mocked options; the sixteen screens are on the [design board](https://claude.ai/artifact/QNUcNjbENRZJYWBmFd2BrA).
  - Both are built and hosted in the platform v3 project; the hosted pages load commit `65220bd`.
  - The console is `design3/console` with its own mock backend, `core/platform.js`.
  - The landing page is comp-led on the approved diorama comp. Its first viewport was accepted in review and passed the hero gate on the maintainer's answer "The comp can differ". Dark mode is the town at night (board L8), which the maintainer asked for.
  - Book a demo on the landing page saves a request that the console lists in Overview; "Set up" starts a new client from it.
  - The finish review's disposition is ship. One known flaw: `approve-night.webp` has a few faint green light pools near the button.
  - `impeccable build-phase finish` cannot be recorded: the responsive gate keeps its input fingerprint only on an unforced pass, and it is forced on the same waived lettering regions. The disposition is a note in the build state.
  - The design skill's build state lives in `.impeccable/build/`; it expects a copy of the plate at the repo root (`assets/plates/scene.png`, excluded from git locally).
- **SC-26** (PR #17): design first. Every new UI or UX change goes the Claude Design route.
  1. Design 2 or 3 options.
  2. Save them in `design3/designs/SC-<n>/`; `design3` is the source of truth for designs.
  3. Publish one review board to the surface's Claude Design project.
  4. Build only the option the maintainer picks.

  The `design-first` skill and a `UserPromptSubmit` hook (`.claude/hooks/design-first-reminder.sh`) carry the rule. SC-25's board, comps and decision are in `design3/designs/SC-25/`.
- **SC-27** (PR #18): the first production code, `frontend/`, a SvelteKit 3 pnpm workspace (TypeScript 6, Vite 8, Tailwind 4 over the tokens, bits-ui, TanStack Query, `motion`).
  - `core`: design system v3 in Svelte, with the CSS ported verbatim and kept so by drift tests. It has every component the landing page and the DS page's built sections use; `coverage.ts` lists the rest, with the port that brings each.
  - `admin`: the landing page ported 1:1 from `design3/site`, with no design round (the maintainer's call: a faithful port). It is prerendered with its data, seeded from `design3/core` through a typed API that flips to `backend-api` with `PUBLIC_API_BASE`. `/ds` is the design-system page, a dev route.
  - Checked against the prototype:
    - parity within 0.2–1.5% in five projects;
    - zero axe violations in five projects;
    - keyboard and motion specs as design3's.
  - The prototype's quirks are fixed: window scrolling, real links, no theme flash, the demo form.
  - `backend-api/` and `agents/` are READMEs for now. The jira-flow gate moved from `web/` to `frontend/`.
- **SC-28** (PR #19): the landing page refined to the SC-25 board, in two design rounds on one review board in platform v3, `SC-28 design review.html`. The designs, comps, motion recordings and decisions are in `design3/designs/SC-28/`.
  - **Round 1:** three options; the maintainer picked option A. What it changed:
    - **No client on the page:** no name, product, person, workspace address or batch id. The batch is an illustrative one, and the showcase API carries no client details (AGENTS.md, Data and assets).
    - **Sections:** the street's three result cards; the nine stops as a live pipeline, with a beat on the human yes and Replay; "Your own workspace" as comp L5 (one unbranded product on each island, team cards, integration chips); plans and the close as comp L6.
    - **Renders:** four unbranded Qwen renders in `design3/system/img`.
    - **Find your workspace** takes a `note` prop, so the landing page's sheet names no client.
    - **Found on the way:** Svelte 5 trims the space at the start of an element's text, which the port had lost in "· live" and the plans' hidden "about …"; "· soon" on the filled chip now meets 4.5:1.
  - **Round 2:** the maintainer asked for "a customized approach between A and B": A's agents section, B's "How it works", and a rethink of "Five exits, one batch". Three ways to show the packs being diverted went on the board; the pick was "1 and 2 combined". What it changed:
    - **How it works** is option B's three moments: the Watcher's alert, the Valuer's prices with the Router's split, and the plan waiting for one yes, each card rising into place.
    - **Five exits, one batch:** as the street comes into view, the batch leaves the godown as dots of about 50 packs for the kiranas and a marketplace buyer, and the chips count them in; under it, the batch is split by exit, drawn once the packs have arrived. One Replay runs both. The desktop scroll-pan and the chip caption are gone.
    - **Renders:** the godown and the bin join `design3/system/img`.
    - **The port:** `How.svelte`, and `Exits.svelte` over `street.ts` and `rise.ts`. The showcase API carries the batch's product and units, the gates and the pricing rules. `site.css` keeps one marked change, window scrolling.
    - **Found on the way:** option 1's mockup never played on phones, where under a third of the street strip is ever in view (the build watches the strip); the split's ribbons could size their own row from a stale measurement (`contain: size` stops it).
  - **Motion:** every motion plays once as its section comes into view, under five seconds, then holds.
  - **Hosting:** the hosted landing page and console load commit `ad7540f`.
- **SC-30** (PR #21, merged): the agents work the batch in the hero, and "Nine stops. Ten agents. One yes." merges into it.
  - **Design first:** three options on one board in platform v3, `SC-30 design review.html`: the agents' constellation, through the gateway, the carton's crew. The maintainer picked option 3, the carton's crew. Designs, comps, motion recordings and the decision are in `design3/designs/SC-30/`.
  - **ThreeUI:** the maintainer asked for ThreeUI's MCP server and connector. Claude Code's auto mode refused to add an MCP server to the user settings, and ThreeUI's MCP is Pro-only. The maintainer chose its free MIT Community components, which options 1 and 2 adapted (`THIRD_PARTY_NOTICES.md` there). The picked option uses no ThreeUI code.
  - **The crew:** the ten agents and the person ride a tilted ring round the carton, passing behind it. As the plate loads, the batch walks its nine stops:
    - each stop's agent turns to the front, wearing the aura, and the caption under the carton says what it did;
    - threads draw from each agent to the next;
    - 430 ms a stop, 980 ms on the yes, and 700 ms on the report while the money rolls in: 4.69 s in all.

    It holds on the result with Replay; under reduced motion the result shows at once. The hero card goes, and `#agents` is the hero.
  - **Contrast on a plate:** text drawn over a plate is measured against the pixels behind it. Names not reached yet take the secondary ink, never opacity: a chip at 62% opacity fell under 4.5:1 on the darker parts of the town.
  - **The port:** `Crew.svelte` in `Hero`; `HeroCard` and `Stops` are gone; `figures.ts` carries the crew; `plates.ts` bundles only the plates the page shows. The server sends the crew before it sets off; the ring is drawn in the browser, from the plate's measured fit.
  - **Hosting:** the hosted landing page and console load commit `ae62513`.
- **SC-31** (PR #22, merged): ThreeUI Community as a local Claude Code plugin, asked for by the maintainer.
  - **The plugin:** `~/projects/threeui-community-plugin`, a local marketplace (`threeui-community-local`) with the `threeui-community` plugin, laid out like the Qwen plugin's. It holds:
    - a dependency-free MCP server, `threeui`, with `search_catalog`, `get_catalog_item`, `get_item_source` and `get_license`;
    - the `/threeui` skill;
    - `scripts/setup.sh`;
    - a stdio smoke test.
  - **The data:** a copy of ThreeUI's public MIT repository in `~/threeui-community`, pinned to `68802d5` (package 1.2.0, as on npm): 104 records (43 items and 61 variant records) and 177 source files. Some records also name the original exports they came from; those are provenance, not files.
  - **Installed** at user scope; Claude Code connects to its server (`claude mcp list`). The tools come with a new session.
  - **Referenced here:** AGENTS.md (design rules and tooling), the design-first skill and `.claude/third-party.md`.
- **SC-32** (PR #23, merged): the hero is the whole business as one miniature town, in depth.
  - **Design first, in two rounds** on one board in platform v3, `SC-32 design review.html`:
    - round 1 put three heroes on a plate of the chain (manufacturer, distributor, retailers). The maintainer asked to build on the third, Follow the batch;
    - round 2 drew one picture of the whole business, put every agent at a post in it, and made the picture and the agent graph interactive. Its options were Take the wheel, In depth and Your yes. The pick: In depth.

    Designs, comps, recordings and the decision are in `design3/designs/SC-32/`.
  - **The town:** `design3/site/town.jsx` (`window.SC3_TOWN`), on the plates `business.webp`, `business-night.webp` and `business-depth.webp`.
    - **The places:** the maker's factory and office, the distributor's godown, the kirana lane, a buyer in the next town, a food bank and the landfill.
    - **Each agent at its post:**
      - You and Paperwork in the office;
      - Data, the Watcher, Vision, the Valuer and the Router round the godown;
      - Outreach at the kiranas;
      - the Lister and the Negotiator by the buyer's highway;
      - Impact at the landfill.

      The agent graph is their handoffs.
    - **The tour:** the camera follows the batch once, in 4.7 s, then holds (SC-34 made it slower, with a card for each agent). Visitors can then drag or swipe, pinch or Ctrl-scroll, and double-click. Places and agents open panels, by pointer or keyboard; the steps and Replay walk the tour again.
    - **Depth:** WebGL2 draws the town from the plate and its depth map, with parallax as the camera travels, a tilt under the pointer, and a focus that follows the camera. Without WebGL2 it is drawn flat; under reduced motion it rests on its result.
    - **The heading's ground:** as the camera nears, the top of the frame goes out of focus into the plate's haze, so the heading keeps a calm ground.
  - **Found on the way:**
    - the generated green route began at the landfill's gate, so that road was repainted on both plates;
    - on phones the food bank's pin covered the distributor's, so it moves on phones;
    - the parity harness now waits for a section's lazy images, which was the `#how` flake.
  - **The port:**
    - `Town.svelte`, with `town/`: the camera, the gestures, the depth renderer and the graph;
    - `figures.ts` carries the town;
    - the showcase API adds the batch's sales a day and the food bank's minimum days;
    - `site.css` keeps two marked changes;
    - `Crew.svelte` is gone.
  - **Checks:**
    - design3's suite: 0 failing WCAG rules;
    - the frontend's gate passes;
    - e2e: 42 pass, and only Firefox fails, because it cannot start in the sandbox;
    - parity: 29 pass.
  - **Hosting:** the hosted landing page and console load commit `4f2bc65`.
- **SC-34** (PR #24, merged): the hero's tour, slower, with a card for each agent, and the whole town back on leaving.
  - **The request:** the maintainer asked for three changes to the town:
    - when focus leaves the hero, it returns to the whole picture;
    - the play runs a bit slower;
    - the agents' cards appear one by one as the play reaches each agent.
  - **Design first:** three options, each built as the real landing page with only the town changed:
    - A, beat by beat (about 18 s);
    - B, agent by agent, close up (about 23 s);
    - C, the whole picture (about 17 s).

    The maintainer picked C ("lets go for option C") in the same request, before a board was published. `design3/designs/SC-34/` holds the options, frames, the build's recording, `board.html` and `decision.md`.
  - **The tour:** a stop for each agent, in the order they work.
    - A small card opens beside the agent's pin, on a stem: its name, its post, and what it did for this batch. A line along its foot fills while the stop holds, and the pin's own name stands down meanwhile.
    - Pace: 1.3 s an agent, 1.7 s on the yes and 1.1 s on the two beats without agents: 16.9 s, where it was 4.7 s.
    - The camera stays on the whole town. On phones and tablets, whose stage crops the town's sides, it slides along at the same size to keep the agent in view.
  - **WCAG 2.2.2:** the tour now runs longer than five seconds, so it has controls:
    - Pause and Play take Replay's place while it runs, as one button, so focus stays on it; the caption's steps stop it too;
    - a drag, pinch, zoom or opened card holds it, and Play hands the camera back;
    - out of view, it holds;
    - under reduced motion, the result shows at once.
  - **Leaving the hero** brings the whole town back and closes the visitor's card. Leaving means any of: the pointer leaving the hero (after 300 ms), focus moving out, a tap or click outside, or scrolling it away.
  - **Checks:**
    - the card's text, measured on the pixels behind it: 6.69:1 at the lowest;
    - design3's suite: 332 pass, with 0 failing WCAG rules. It gains an axe scan paused at a card, a motion state with a card showing, and a keyboard test (Pause, Play, a place opened, focus leaving the hero);
    - the frontend's gate passes;
    - e2e: 49 pass, with the same checks; only Firefox cannot start in the sandbox;
    - parity: 29 pass.
  - **The port:** `Town.svelte`, `figures.ts` (the stops), `town/graph.ts` (handoffs per stop), `town/geo.ts` (the beats' shots gone), and `site.css` (drift clean).
  - **Hosting:** the hosted landing page and console load commit `79b074d`.
- **SC-33** (In Progress, branch `SC-33-landing-finish`): the landing page's finish after SC-32.
  - **Done:** impeccable's provenance for the town plates.
  - **To do, from the finish review (disposition fix):**
    - the minus sign kept with its figure (`fmt.inr`);
    - the 4 px side stripe on two split rows, which changes an approved design and needs the maintainer's pick;
    - DESIGN.md brought up to SC-28, SC-32 and SC-34 by the documenter.
  - **Blocked:** the impeccable comp build's record. Its responsive gate compares the page with the SC-25 diorama comp, whose hero SC-32 replaced (55% on 5 Oct), so `build-phase finish --disposition ship` is refused.
- **SC-35** (PR #25, merged): a loader for the landing page, on every load and on every change of theme.
  - **Design first:** three options on one board in platform v3, `SC-35 design review.html`:
    - A, the route;
    - B, dusk and dawn;
    - C, the lens (recommended).

    The maintainer picked a mix: "option A for page loads and re-loads and Option B for day/night switch". Designs, mockups, recordings and the decision are in `design3/designs/SC-35/`.
  - **Every load, the route:**
    - the mark draws its S from the godown dot as the page loads;
    - once the town is drawn, the amber pin lands and the mark opens into a window onto the page.
  - **Every change of theme, dusk or dawn:**
    - the town's skyline in paper layers, under a sky that turns with the new plates' load;
    - the theme changes underneath, so a day plate never shows under night chrome.
  - **Real progress:** scripts, fonts, the first render, the town's depth map and plate.
    - It never goes backwards.
    - At least 1.25 s on a load (half that on a later load in the session), at most 8 s (4 s on a switch).
  - **Access:**
    - "Loading Smart-Clearance" said once, and the page aria-busy until the loader lifts;
    - focus stays put on a switch;
    - a still frame under reduced motion;
    - the tour sets off once the loader has lifted.
  - **The build:**
    - `design3/site/loader.js` (plain, first in `<body>`), with its styles in `site.css`;
    - a `gate` on the kit's `ThemeProvider`;
    - the town's handshake.
  - **The port:** `hooks.server.ts` inlines design3's `loader.js` into the prerendered page; core's `Theme` takes the same gate.
  - **Checks:**
    - design3's suite: 334 pass, with 0 failing WCAG rules, plus a new test (the loader up, then a switch by keyboard);
    - the frontend's gate passes;
    - e2e: 51 pass, and only Firefox fails, because it cannot start in the sandbox;
    - parity: 29 pass.
  - **Hosting:** the hosted landing page and console load commit `2fe8134`, with `dist/loader.js` first in the landing page's `<body>`.
- **SC-37** (PR #27, merged): the staff console as its own SvelteKit app, `frontend/console`, deployable on its own subdomain (console.smartclearance.com).
  - **A faithful port** of `design3/console` (SC-25's approved design), so no design round: the sign-in, Overview, Clients, a client's seven tabs, the New client flow, Agents, Connectors, Plans, Staff, Audit log and the account sheet.
  - **No backend:** a typed `ConsoleApi` over an in-browser mock of `design3/core/platform.js`, which writes every audit line in the signed-in staff member's name. `PUBLIC_API_BASE` switches it to HTTP. The mock starts with two fictional demo requests.
  - **Shared, not copied:**
    - core gains Shell, Page, DataTable, Empty, Progress, Alert, NoticeHost, Tracker, VTracker, TrackerCompact, the Columns and SectionTitle patterns, and `screens.css`;
    - `@smart-clearance/api` (new) holds the contract, HTTP transport, both apps' mocks and the seed. Admin moved onto it, and only bundles its own entry;
    - `@smart-clearance/testing` (new) holds the axe scan and the parity compare;
    - both apps' `app.html` is one file, held so by a test, as is the console's cascade.
  - **What changed from the prototype, none of it visible:** real paths instead of the hash, links in the sidebar, table rows that open by keyboard, number settings clamped once entered.
  - **Deploying:** `frontend/firebase.json` has a Hosting target per app (`site`, `console`); nothing is deployed yet.
  - **Checks:**
    - the gate passes;
    - the console's e2e: 96 pass, Firefox not run (it cannot start in the sandbox);
    - the console's parity: 80 pass, at most 0.27% apart;
    - admin unchanged: e2e 51, parity 29.
- **SC-39** (PR #29, merged): `infra/`, Terraform for the GCP project `aibuilder-510213`, and Firebase Hosting for the two apps, each on its own site.
  - **Applied, each plan saved, read in full, then applied as that file:**
    - `infra/bootstrap`: the state bucket, `gs://aibuilder-510213-tfstate`, holding its own state;
    - `infra/prod`: the billing link (adopted by import), the Firebase Management and Hosting APIs, Firebase on the project, and the sites `smartclearance` and `smartclearance-console`.

    A fresh plan on both roots shows no changes.
  - **Live**, released by `infra/scripts/deploy.sh` from commit `82c5fd7`:
    - the landing page at https://smartclearance.web.app;
    - the console at https://smartclearance-console.web.app, with `noindex`, `X-Frame-Options: DENY` and the referrer policy on every path.

    Both rewrite unknown paths to the app, and cache `/_app/immutable/` for a year.
  - **Found on the way:**
    - adding Firebase answered 403 until the account (gilchristfan@gmail.com) accepted the Firebase Terms;
    - accepting them through the console's "Create a project" made a separate project, `smart-clearance-be74c` (Spark, with its own default site). The maintainer kept AIBuilder, and that project is unused;
    - firebase-tools takes only application-default credentials, not a gcloud token;
    - the provider's Hosting resources carry configuration only, so releases go through firebase-tools;
    - `init -backend=false` still opens a configured GCS backend, so `check.sh` uses its own data directory and needs no credentials.
- **SC-40** (PR #30, merged): GitHub Actions lint, type-check, test and build the frontend, check `infra/`, and deploy both apps from `main`. `prod` is the only environment.
  - **The workflow:** `.github/workflows/ci.yml`, with `.github/actions/setup-frontend`. On pull requests and pushes to `main` touching the frontend, design3 (not `designs/` or `a11y/`), `infra/` or the workflow, it runs three jobs: the frontend gate, the infra gate (`check.sh`, with shellcheck on the runner) and one build, kept as an artifact. On `main` the deploy job releases that artifact with `deploy.sh` (`SKIP_BUILD=1`, `HOSTING_SITES` from the environment).
  - **Keyless, applied by Terraform** (plan saved, read in full, then applied: 14 added):
    - the Workload Identity pool `github`, whose provider accepts only repository id `1402270649` under owner id `336086407`;
    - the service account `github-deployer` (Hosting Admin and Service Usage Consumer only), which only `prod` environment jobs may act as;
    - the GitHub environment `prod`, deployable from `main` only, with its variables `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` and `HOSTING_SITES`, through the `integrations/github` provider. The scripts give it `gh auth token`.
  - **Pinned:** every action to a commit SHA; the workflow token is read-only, and only the deploy job gets `id-token: write`.
  - **First runs:** PR #30's checks ran the gates and the build; the merge to `main` ran the first deploy from CI.
- **SC-42** (PR #31, merged): the town hero, easier to explore, and under a sky on every screen.
  - **Round 1, described options:** pointing at a place or an agent. The maintainer picked A, card first, zoom on dwell (B zoomed on hover, C was a loupe).
    - The card opens at once, with the node's handoffs lit. After 0.6 s a ring fills round the pin, and the town zooms to 1.8× about it.
    - Looking away for 250 ms closes the card and puts the camera back. A click keeps the card; Escape, its close button or leaving the hero shuts it. The chips in a kept card move it on, and bring what they name into view.
    - The keyboard: a focused pin describes itself with the card (`aria-describedby`), and Enter opens the panel. The tour holds while the visitor looks.
    - The Lister moves to the buyer's loading bays and the Negotiator to its truck; the graph rests fainter.
    - The desktop hero is no taller than the window, so the caption stays in view at 1366 × 768. The heading group is sized by the frame as drawn (`--hu`), so a short window no longer squeezes it.
    - The heading's boxes hug their text, and the buttons' row lets the pointer through, so every node under them can be pointed at.
  - **Round 2, on one board in platform v3,** `SC-42 design review.html`: the maintainer found the text cluttered, and asked for the desktop's sky-merged picture on phones and tablets too. The options were A, the horizon, and B, the haze (the renderer's tilt-shift haze held at rest). The pick: A. Designs, frames and the decision are in `design3/designs/SC-42/`.
    - **The sky:** the plates' own colours continued upward (`--sky-1`, `--sky-2`), warm haze by day and navy by night, deepening from the page's ground.
    - **Desktops:** the town starts at 21% of the frame, its top fading into the sky, so the copy stands on clear sky. The lens's haze band moves to the stage's top edge (`GEO.haze`).
    - **Phones and tablets:** the card goes. The hero is full-bleed under the nav's glass and as tall as the screen, with the copy centred on the sky, the town filling the rest, and the caption docked on its foot in glass.
  - **Round 3, on the same board:** the maintainer found agents the tour could not show ("like the router nodes. They should be zoomed/panned in too"). Measured stop by stop: on laptops the Router sat under the caption; on the iPad Paperwork's card ran off the screen; on a phone the Negotiator's card landed on a button. The options were A, close on each agent (1.8×), B, only when hidden, and C, each beat framed. The pick: C.
    - **The tour frames each beat:** the camera takes in the beat's agents together (or a beat's place) in the clear part of the stage, under the buttons and over the caption, up to 1.7× (1.5× on phones and tablets). It moves once a beat, seven moves in all, then rests while the agents take their turns; before and after the tour, and when Play hands the camera back, it rests on the whole town. The camera gains `at()`, where a point would land under a shot.
    - **The tour's card** keeps to the same clear part: above its pin, else below it, else where there is more room.
    - **Fixed on the way:** on tablets the town's stage ran 16 px past both screen edges.
    - Played through at 1440 × 900, 1440 × 800, 1366 × 768, 1280 × 720, 820 × 1180 and 390 × 844, every agent and its card is in clear view, in design3 and the port.
  - **Checks:**
    - after round 3: design3's suite 334 pass with 0 failing WCAG rules, e2e 51 (only Firefox fails, as it cannot start in the sandbox), parity 29. At the Router's stop the port's frames match design3's within 0.15%;
    - design3's suite, round 2: 334 pass, with 0 failing WCAG rules. Its first run failed four phone and tablet tests. On tablets the town's faded top took clicks meant for the bottom of "Find your workspace", so the copy now stands above the town. The town test expected the desktop's kept card on touch screens, so that step is now desktop-only. The site, keyboard and motion specs were rerun: 44 pass;
    - the frontend's gate passes;
    - e2e: 51 pass, and only Firefox fails, because it cannot start in the sandbox;
    - parity: 29 pass;
    - scripted on both builds: the card at once, the zoom after the dwell, the camera back on looking away, a click keeping the card, a chip moving it and bringing a far agent into view, Escape, a focused pin's card and Enter's panel. At 1366 × 768 the caption ends at 709 px.
  - **The port:** `site.css` (verbatim), `Town.svelte`, `town/geo.ts`, `town/graph.ts`, `town/camera.ts`. Its frames match design3's within 0.15% at 390, 820 and 1440 wide.
  - **Hosting:** the hosted landing page and console load commit `0ea344d`.
- **SC-43** (epic): Backend v1, the platform API for the landing page and the console. The maintainer's decisions (6 Oct):
  - reuse the local Docker Postgres 18;
  - real Firebase Auth locally, in one shared user pool;
  - email and password for everyone, every user onboarded with the default password, and no email ever sent;
  - the staff email domain set per environment (`smartclearance.example` until `smartclearance.com` is owned);
  - Find your workspace names the workspace only;
  - Cloud SQL and Cloud Run written but not applied;
  - Munchly rebuilt by hydrate;
  - the showcase loaded as content (money.js ported with the agents);
  - three stories.
- **SC-44** (PR #32, merged): Terraform for backend-api.
  - **Applied** (plan read in full, 16 added):
    - Identity Platform, email and password only, sign-up disabled;
    - the console's Firebase web app on a restricted browser key;
    - three Secret Manager containers, empty in Terraform;
    - the `scAuthUsers` custom role;
    - `sc-api-local`, which operators may impersonate.
  - `infra/scripts/auth-policy.sh` sets the password policy (12+ characters, mixed case, a digit) and email enumeration protection.
  - **Written, not applied** (`backend_runtime = false`; a plan with it on reads 25 to add):
    - Cloud SQL Postgres 18 (Enterprise, db-f1-micro, IAM auth only);
    - the Cloud Run service and migrate job;
    - Artifact Registry;
    - a budget;
    - the console's build variables.
- **SC-45** (PR #33, merged): `backend-api/`, FastAPI on Postgres for every route in `frontend/api`.
  - **The database:** one database, `smart_clearance`, schema `sc`:
    - `sc_owner` owns it; `sc_app` gets DML only;
    - the audit log is append-only, by grants and triggers;
    - reference data is loaded at migrate time from `src/sc_api/reference/`, which `seed.mjs` writes from design3.
  - **Auth and roles:**
    - Firebase ID tokens identify active staff;
    - roles are enforced from `reference/rbac.json`;
    - invitations make Firebase accounts on the default password from Secret Manager.
  - **The scripts:** doctor, secrets, db-init, migrate, hydrate, default-password, dev, up, console-env, test, contracts, bootstrap.
  - **Hydrate** builds Munchly and a seeded synthetic world through the services: 7 clients, 61 people, 38 Firebase accounts, 89 audit lines.
  - **Checks:**
    - 152 tests, on the local Postgres and on a fresh `postgres:18` the way CI runs them;
    - signed in through Firebase's REST API, Neha drove the API end to end; Support got the 403, and a client's person the 401;
    - the frontend gate passes;
    - gitleaks: no leaks in the tree or the history.
  - **CI:** a backend gate and a secret scan.
- **SC-46** (PR #34, merged): the platform on the real API, locally.
  - **Design first:** two options on one board in platform v3, `SC-46 design review.html`:
    - A, one step in the card;
    - B, email first, then the password.

    The maintainer picked **A**. Designs, frames and the decision are in `design3/designs/SC-46/`.
  - **The sign-in:**
    - work email, password (show or hide), Sign in;
    - one message for any wrong sign-in (email enumeration protection);
    - no forgot-password, since nothing is mailed.
  - **Find your workspace** names the workspace only, with no role line. This is in design3, core and the contract.
  - **The contract:**
    - `signIn({ email, password })`; `consoleHttp(base, { auth })` takes the app's Firebase `ConsoleAuth`;
    - `signInAccounts` is gone, and so is backend-api's `/v1/console/session/accounts`;
    - `WorkspaceMatch` loses `as`.
  - **The console:**
    - `firebase/auth` (12.19.0) loads only when `PUBLIC_API_BASE` is set;
    - `PUBLIC_FIREBASE_*` are written by `backend-api/scripts/console-env.sh` from Terraform's output into a git-ignored `.env.local`.
  - **Live end to end:** `backend-api/scripts/e2e.sh` (`frontend/console/tests/live`). It covers Book a demo on the landing page, a wrong then a right Firebase sign-in, the New client flow from that request, an agent, an invitation, the plan, the audit log in the signed-in name, and Support refused a plan change.
  - **Checks:**
    - live: 3 pass;
    - the frontend gate passes;
    - e2e: landing page 51, console 97; only Firefox fails, as it can't start in the sandbox;
    - parity: landing page 29, console 80, the new sign-in included;
    - backend-api: 152 pass;
    - design3's suite: 334 pass, with 0 failing WCAG rules.
  - **Hosting:** the hosted landing page and console load commit `d08a08a`. The app and demo stay on `58c6874`, so their Find your workspace still shows the role line.
- **SC-47** (PR #35, merged): quick-commerce gates per SKU, with a per-batch override, for the agents to read.
  - **The request:** Blinkit and Zepto/Instamart settings at SKU and batch level. The maintainer's answers: per SKU with a per-batch override; the client's values stay as the default for new SKUs.
  - **Design first:** three options on one board in platform v3, `SC-47 design review.html`:
    - A, on each SKU;
    - B, a gates matrix;
    - C, batch first.

    The maintainer picked **A**. Designs, frames and the decision are in `design3/designs/SC-47/`.
  - **The rule:** a batch's gates are its override, else its SKU's, else the client's default, value by value.
    - Blinkit wants days left; Zepto and Instamart a share of life, passed when days x 100 >= share x life.
    - An SKU keeps the profile's bounds; an override may go down to 7 days and 5%, needs a reason, and holds until its batch closes.
    - The rule is in `platform.js`, `platform.ts` and `domain/gates.py`, held together by fixtures from `platform.js`.
  - **The console:**
    - the SKU table shows each SKU's two gates ("this SKU" or "default") and its open batches with their overrides;
    - a row opens the SKU sheet: the client's default or its own gates, and each open batch with pass or fail, its override, Change and Remove;
    - the profile's gates are "by default", with how many SKUs differ;
    - every change writes its audit line.
  - **The data:**
    - migration 0002 adds the SKU and batch gate columns, `best_before` and `judged_*`;
    - `sc.batch_gates` is the agents' view;
    - Munchly's nine story batches replace the seven placeholders, and three SKUs and one batch carry their own gates;
    - hydrate gives SKUs gates by shelf life, and records some overrides with reasons.
  - **The contract:** `Sku.gates`, `clientBatches`, `saveSkuGates`, `overrideBatch` and `clearBatchOverride`, over four new routes.
  - **Checks:**
    - backend-api: 190 pass, the view and the API agreeing;
    - the frontend gate passes;
    - e2e: console 103 pass; only Firefox fails, as it can't start in the sandbox;
    - parity: 80 pass;
    - live: 4 pass, the SKU flow on the real API and Firebase;
    - design3's suite: 339 pass, with 0 failing WCAG rules.
  - **Hosting:** the hosted landing page and console load commit `80014aa`. jsDelivr first answered its `console.js` with a cached 403 ("Package size exceeded"); purging that URL fixed it.
  - **Known gap:** the workspace app still judges by the client-wide gates in `money.js`.
- **SC-48** (PR #36, merged): the console's Overview as a live dashboard, database-driven.
  - **The request:** dashboards and live charts, proper pagination of the live batches, an engaging experience; nothing hard-coded or stubbed in the UI.
  - **Design first:** three options on one board in platform v3, `SC-48 design review.html`:
    - A, the command centre;
    - B, the nine stops;
    - C, clients at a glance.

    The maintainer picked **A**. Designs, frames and the decision are in `design3/designs/SC-48/`.
  - **The page:**
    - four figures with their range lines: recovered (with the change on the range before), in flight, waiting for a yes (with the oldest), runs today;
    - recovered by day for 7, 30 or 90 days, with a crosshair tooltip and "Show as a table";
    - batches in flight at each stop, Approve in amber; a stop filters the table;
    - every client's batches a page at a time (8, 16 or 32), by status, client, stop and search, sorted on the server; the view lives in the address;
    - Needs attention, Demo requests and Agent runs.
  - **Live, and still:** the figures are read again every 30 s and on focus. Pause is remembered per browser (WCAG 2.2.2), and nothing moves on its own.
  - **The data:**
    - `GET /v1/console/dashboard` and `GET /v1/console/batches` (`services/dashboard.py`), aggregates over batches, runs and clients;
    - `platform.js`, `platform.ts` and the API give the same answers, held by fixtures;
    - hydrate builds 35 days: none to three batches a day per live client, each closing a few days later or still in flight.
  - **Checks:**
    - backend-api: 198 pass;
    - the frontend gate passes;
    - e2e: console 109 pass; only Firefox fails, as it can't start in the sandbox;
    - parity: 80 pass;
    - live: 5 pass, the Overview on the 35-day world;
    - design3's suite: 344 pass, with 0 failing WCAG rules;
    - the landing page is unchanged: e2e 51, parity 29.
  - **Hosting:** the hosted landing page and console load commit `6a70275`; every pinned file was checked on jsDelivr first.
- **SC-49** (PR #37, merged): the console in motion. Loaders when screens and tabs change, a Sign in that keeps its label, and the Overview's agents at work.
  - **The request:** loader effects ("like the hydrating effect when I am changing tabs"); a more engaging Sign in, since clicking it removed its text; livelier Overview charts and a view of the agents working batches.
  - **Design first:** three options on one board in platform v3, `SC-49 design review.html`:
    - A, the route;
    - B, the fill;
    - C, quiet and quick.

    Each was built on the console itself, with its motion recorded. The maintainer picked **A**. Designs, recordings and the decision are in `design3/designs/SC-49/`.
  - **Loading:**
    - a green route draws along the top of each screen and tab as it loads, and lands its amber pin (the landing page's loader, SC-35);
    - placeholders in the shape of what is coming (dashboard, table, list, cards, pipeline, form, client page) show if the read takes over 120 ms, with one green wash crossing them;
    - the content rises into place, block by block.

    In the build it starts from SvelteKit's navigation. design3 simulates a 450 ms read (`?read=` lengthens it).
  - **Sign in** keeps its label:
    - "Signing in…" with the mark's S drawing in the icon's place and a line along the foot;
    - then "Welcome, <first name>" with a tick, for 720 ms, before the console opens;
    - a wrong sign-in shakes the button (360 ms) before SC-46's message.
  - **The Overview:**
    - the figures roll (the kit's `Roll`), and the sparklines and recovered-by-day chart draw themselves;
    - a reading moves the line and marks what today gained;
    - **Agents at work** replaces "In flight, by stop": the nine stops on a route, each with its agent and count, and the latest three batches to arrive as their clients' marks;
    - Closed today sits at the end, and the latest run under the route;
    - marks travel between stops (spring 170/24/1), and arrivals since the last reading are ringed while their stops light;
    - a stop still filters the table.
  - **The data:**
    - migration `0003`, `batches.stage_at`, stamped as a batch opens, moves on (`supply.advance_batch`, with the agent's run) and closes;
    - the dashboard's `atStop` and `closedToday`, each mark with when it arrived;
    - `hydrate.sh --tick` moves two to four batches on a stop, so the route can be watched locally.
  - **Motion rules:** the loader moves only while something is read, Pause stops the readings, and under reduced motion every step lands at once; the springs are in core's `SPRINGS` (`tick`, `dot`, `token`).
  - **Checks:**
    - backend-api: 202 pass, the API still matching design3's answers (`rules.json`);
    - the frontend gate passes;
    - e2e: console 110 pass, with the new flow; only Firefox fails, as it can't start in the sandbox;
    - parity: console 80 pass;
    - live: 6 pass, including Agents at work moving after `hydrate.sh --tick`;
    - design3's suite: 349 pass, with 0 failing WCAG rules, and a new test (Sign in while it checks, the Overview and a tab loading);
    - the landing page is unchanged: e2e 51.
  - **Hosting:** the hosted landing page and console load commit `e0386f5`; every pinned file was checked on jsDelivr first (one cached 403 purged).
- **SC-50** (PR #38, merged): backend-api in Google Cloud, and the apps on it.
  - **The maintainer's decisions:**
    - Cloud Run scales to zero;
    - production starts with the synthetic world;
    - GitHub Actions starts Cloud Build, and keeps building and deploying the apps to Firebase Hosting;
    - alerts go to gilchristfan@gmail.com;
    - every Terraform run waits for an approved, fully read plan.
  - **Cost** (Google's catalog prices, GBP, `asia-south1`): about GBP 9 a month, nearly all Cloud SQL. Everything else sits in free tiers at the prototype's traffic. A GBP 20 budget emails at 50%, 90% and 100%, and on a forecast overrun.
  - **Applied** (plan read in full, approved; 59 added, then the uptime fix, 2 changed; a fresh plan shows no changes):
    - Cloud SQL `sc-main`: PostgreSQL 18, `db-f1-micro`, zonal, 10 GB SSD, backups and point-in-time recovery, IAM logins through the connector only;
    - the Cloud Run service `backend-api` (0 to 2 instances), the jobs `backend-api-migrate` and `backend-api-hydrate`;
    - Artifact Registry `sc`;
    - Cloud Build's `sc-builder` and a source bucket;
    - `github-backend`, keyless, which may only start builds;
    - monitoring: an email channel, an uptime check on `/readyz`, 7 alerts and a dashboard;
    - the budget;
    - the GitHub variables: the backend job's on `prod`, and the apps' public build settings (`PUBLIC_API_BASE`, `PUBLIC_FIREBASE_*`) as repository variables.
  - **Releases:** `backend-api/cloudbuild.yaml` builds and pushes the image, runs the migrate job, moves the hydrate job onto it, deploys the service and checks `/readyz`. CI's new backend job starts it, on a merge touching `backend-api/`, before the Hosting deploy. Cloud Build owns the image; Terraform ignores it.
  - **Logs:** `LOG_FORMAT=json` (`sc_api/logs.py`), one JSON object a line with severity and source, so Error Reporting groups stack traces; uvicorn's access lines are dropped (Cloud Run logs requests itself).
  - **Done in the cloud:**
    - the first build (about 3 minutes);
    - the migration;
    - the synthetic world: 6 staff, 7 clients, 61 people, 150 batches, 393 runs, 98 audit lines.

    Neha signed in through Firebase and read the session, dashboard, clients and batches from Cloud SQL. CORS allows only the Hosting sites.
  - **Found on the way:** Cloud Run reserves `/healthz` on the public address (404), so the uptime check uses `/readyz`; the container's probes still use `/healthz` inside. The dashboard's JSON is written in the form Cloud Monitoring stores, so plans show no drift.
  - **Checks:** backend-api 205 pass (JSON logging tests added); `check.sh` passes; the workflow validates.
- **SC-51** (PR #39, merged): the console's splash for the first load, signing in and signing out, masking backend-api's waits.
  - **The request:** "a splash screen for login and logout on console UI, to mask the API calls load delays", "something really awesome that goes with the console theme". Measured on the live console: blank for about 1.5 s on a warm API before anything draws (longer on a cold start, as Cloud Run scales to zero); "Welcome, Neha" then a frozen wait; the console still on screen while signing out.
  - **Design first:** three options on one board in platform v3, `SC-51 design review.html`, each built on a fork of the console with Framer Motion:
    - A, the shift (recommended): one surface for every wait, the mark drawing its route as the reads land, the reads as the stops of a short tracker, the mark opening into a window onto the page;
    - B, the handover: no curtain, the console assembling as its reads land;
    - C, the roll-call: the agents in a ring, waking one by one with real figures.

    The maintainer picked **A**, and answered the board's question with **every load**. Designs, mockups, recordings, the build's recordings and the decision are in `design3/designs/SC-51/`.
  - **The splash** (`design3/console/splash.js`, plain script loaded first in `<body>`, before React; its styles in `console.css` between `@splash` markers): the mark's S draws with the progress; one tracker stop per read, each landing with the time it took; "Opening the console", the hour's greeting by name on signing in, "Signing you out" then "Signed out". When everything is in, the mark flies to where the page keeps its mark (the sidebar's brand, or the sign-in card's) and its squircle opens into a window onto the page, which comes into focus as it opens.
    - The progress follows the reads, creeps a little, never goes backwards; at least 1.25 s on a first load and 0.9 s otherwise; after 8 s, "The console did not answer" with Try again.
    - One status line per phase for screen readers; the page behind is inert and `aria-busy` while covered; a still frame under reduced motion.
    - design3 simulates the reads (`?boot=`, `?enter=`, `?leave=`).
  - **The port:** `hooks.server.ts` inlines the script and its CSS block into the console's page, so a cold start is covered from the first paint; `+layout.ts` marks the session, config and catalog; `prefetch` names a page's reads as the splash's stops after a sign-in and marks each; `firebase.ts` marks the sign-out's two stops; `App.svelte` begins each wait and opens the window once the page is drawn. The splash's motion runs on motion's `animate()`.
  - **Checks:**
    - design3's suite: 349 pass, with 0 failing WCAG rules; the splash is scanned mid sign-in (one contrast fix on the way: the Console label);
    - the frontend gate passes;
    - e2e: 110 pass, with the suites waiting for the splash to lift; only Firefox fails, as it cannot start in the sandbox;
    - parity: 80 pass;
    - the e2e and parity suites must run with `PUBLIC_API_BASE=` empty while `.env.local` points at the API.
  - **Hosting:** the hosted landing page and console load commit `b7f143d`; the console page loads `dist/console-splash.js` first in `<body>`.
- **SC-53** (PR #41, merged): the root `README.md` and a new `ARCHITECTURE.md`, documentation only.
  - **README.md** is the practical guide: what is in the repository; prerequisites with versions; running everything locally in six steps (design3, the frontend on its mocks, backend-api on the local Docker Postgres through `bootstrap.sh` and each step it runs, the frontend on the real API, every port); tests and gates; the operator's work on Google Cloud (the project's resources, access, Terraform, secrets, releasing backend-api through Cloud Build by CI or by hand, the migrate and hydrate jobs with `--allow-env,prod`, accounts and passwords on the shared pool, logs and alerts, the Hosting deploys and rollbacks, costs, moving to another project); how work is done; a documentation map.
  - **ARCHITECTURE.md** names every technology by layer, with the versions in the lockfiles, and shows the solution in 14 Mermaid diagrams: the system, design3's structure, the frontend workspace and data flow, the API's layers, the data model, identity and secrets, three request paths, the cloud, the delivery pipeline, local development and the agents' nine stops. It closes with the decisions and their reasons, and the known gaps.
  - **Checks:** all 14 diagrams rendered with Mermaid 11 without parse errors; every anchor and relative link resolves. CI does not run on root files.
  - **Hosting:** unchanged.
- **SC-54** (PR #42, merged): CLAUDE.md records SC-53 as merged.
- **SC-55** (PR #43, merged): the e2e, parity and a11y suites run only when the maintainer asks.
  - **The rule:** the frontend's e2e and parity suites, design3's a11y suite and `backend-api/scripts/e2e.sh` run only when the maintainer explicitly asks for them in the current request, never as a routine step of a design, a UX change, a port or a ticket. The jira-flow gates stay automatic. It is written in AGENTS.md (Accessibility) and in this file's "Which tool for what".
  - **The design-first skill's** build step runs the gate and offers the suites instead of running them.
  - **The `browser-suites` skill** (`.claude/skills/browser-suites/`) loads when a suite is asked for: what counts as an explicit ask, what each suite needs first (a build, `PUBLIC_API_BASE` empty, Firefox's sandbox limit), the commands, and how to report the counts.
  - **The `ask-before-suites` hook** (`.claude/hooks/ask-before-suites.sh`), a `PreToolUse` hook on Bash in `.claude/settings.json`, turns any command that would run a suite into a permission prompt; every other command passes. Tested on ten commands. It takes effect in a new session.
  - **Hosting:** unchanged.
- **SC-57** (PR #45, merged): request tracing for backend-api. One trace ties a request's log lines, spans and audit rows together.
  - **The gaps it closes:** app logs carried no trace; there were no spans inside the backend; an audit row did not lead to its request; the apps sent no trace header.
  - **The apps:** `transport()` in `@smart-clearance/api` sends a W3C `traceparent` with every call, a new trace each, flags left to Cloud Run and the API; a failed call's `ApiError` carries its `trace`. Checked on the live API: Cloud Run keeps a client's trace id.
  - **backend-api** (`tracing.py`): OpenTelemetry 1.45 with spans for each route (not the health checks), each SQL statement (an `EngineTracer` per engine) and the sign-in check ("verify ID token"), with Firebase's HTTP calls under it (requests, not httpx: firebase-admin's auth uses requests).
    - **Logs:** a JSON line written during a request carries `logging.googleapis.com/trace`, `spanId` and `trace_sampled`, the crash handler's line included.
    - **Audit rows:** `details.trace`, beside what the change records.
    - **Sampling:** a request Cloud Run sampled is always kept; of the rest, `TRACE_SAMPLE_RATE` (0.25 on Cloud Run, `trace_sample_rate` in `infra/prod`).
    - **Export:** `TRACE_EXPORT=otlp` sends spans over OTLP to the Telemetry API (`telemetry.googleapis.com`), read in Cloud Trace. Google's Python Cloud Trace exporter is deprecated, so it is not used. A test trace exported from a workstation was read back from Cloud Trace with its three spans nested.
  - **Terraform** (`infra/prod`): the Telemetry and Cloud Trace APIs (both already on; adopted), `roles/telemetry.tracesWriter` for `sc-api` and `sc-api-local`, and `TRACE_EXPORT` and `TRACE_SAMPLE_RATE` on the service. Applied on the maintainer's yes (plan read in full: 4 added, 1 changed, 0 destroyed).
  - **Cost:** Cloud Trace ingests 2.5 million spans a month free, then 0.20 USD a million; the prototype's traffic stays well under.
  - **The agents:** `agents/README.md` sets the convention: the trace in each Pub/Sub message's attributes, and each agent run recording its trace id.
  - **Checks:**
    - backend-api 214 pass (9 new); the frontend gate passes; infra `check.sh` passes; ARCHITECTURE.md's 15 diagrams parse with Mermaid 11;
    - live: 6 pass, the console's calls carrying `traceparent` through CORS, and each audit row they wrote keeping its own trace id;
    - e2e: landing page 51, console 110 pass; only Firefox fails, as it can't start in the sandbox;
    - parity: landing page 29, console 80 pass;
    - design3's suite: 349 pass, with 0 failing WCAG rules.
  - **Hosting:** unchanged.
- **SC-58** (PR #46): the a11y suite runs on the frontend's real UI, and design3's is gone.
  - **The request:** the maintainer found the a11y suite running on design3's prototypes, and asked for it on the actual UI components under `frontend/`. The decisions: remove design3's suite; scan every component the apps use, not `/ds`.
  - **`corepack pnpm test:a11y`** (`:admin`, `:console`): each app's production build, the axe WCAG 2.2 AA scans with the keyboard and motion specs in five projects, then the coverage check. `test:e2e` keeps the console's flows and the Firefox and WebKit smoke runs. The `/ds` scan is gone; `/ds` stays a dev route that parity compares.
  - **Coverage:** each scan records the core components on screen (`COMPONENTS` in `frontend/testing/src/a11y.ts`, with `data-product` on Product, which had no class of its own), and `testing/src/a11y-coverage.ts` fails the run when an app uses a component no scan reached. Its first run found two in the console: the toast (`NoticeHost`) and the checkboxes (`Check`); the console's spec now scans the toast after Pause every agent, and the New client flow's sign-in step.
  - **Found on the way:** the paused state had never been scanned. A switched-off agent's summary failed contrast (2.4:1 light, 2.75:1 dark), faded by `.cs-stop.off .cs-card .cs-text { opacity: 0.6 }` in design3's and the port's `console.css`: SC-59, fixed on this branch (below).
  - **design3/a11y removed;** its static server moved to `frontend/testing/design3-server.py` for the parity runs. The `browser-suites` skill, the `ask-before-suites` hook (now asking on `test:a11y`), CI's paths and the docs follow.
  - **Checks:**
    - a11y: landing page 44 pass, 0 WCAG findings, 22 of 22 components it uses on screen; console 94 pass and 5 fail (SC-59's contrast, in each project, before its fix), 36 of 36 components on screen;
    - the frontend gate passes.
  - **Hosting:** see SC-59.
- **SC-59** (in PR #46): a switched-off agent's name takes the secondary ink instead of the card text's 60% opacity, as AGENTS.md's contrast rule asks; the Off badge and the grey node still mark it.
  - **Where:** `design3/console/console.css`, its dist, and the verbatim port in `frontend/console/src/lib/console.css` (the drift test holds them together).
  - **Measured** on design3's console with every agent paused: the name 7.90:1, the stage and summary 5.37:1 in light; 8.53:1 and 5.50:1 in dark (they were 2.43:1 and 2.75:1).
  - **Checks:** the frontend gate passes. The a11y suite was not re-run after the fix.
  - **Hosting:** the hosted landing page and console load commit `0384e24`; every pinned file was checked on jsDelivr first, and both pages render.
- **SC-60** (In Review, branch `SC-60-landing-reimagined`): the landing page reimagined, in the manner of shopify.com/uk: the miniature business alive on film under the heading, a statement that fills in as it is read, the agents at work on the table with one in focus at a time, the product's moments as chapters in colour fields, and Impact's ledger. The workspace, plans and the close stay.
  - **Design first, in two rounds** on one board in platform v3, `SC-60 design review.html`, each option a complete page built on the real kit, with light and dark stills at 1440 and 390, Qwen plates and LTX clips:
    - round 1: A, the film; B, islands in the sky; C, one yes (recommended). The maintainer asked for "a culmination of A and C": A's hero, and the agents at work on C's table in place of "Five exits, one batch", "centered and in focus showing what is happening";
    - round 2: the combined page with three treatments of the scene: 1, the tour on the table; 2, in focus (recommended); 3, the relay. The pick: **2, In focus**, with the scene **after the statement and the chapters kept**.

    Designs, plates, clips, mockups, recordings and the decision are in `design3/designs/SC-60/`.
  - **The page** (`design3/site/site.jsx`, `site.css`): the town (`town.jsx`) and the exits strip are retired, and the page scrolls the window, as the build does.
    - **The film:** 8 s by day, 6 s by night, over the town plate as its poster, with Pause, Play and Replay (WCAG 2.2.2); the heading's last word turns once and rests on "chance". The bar is clear over it and takes its glass on scroll.
    - **The statement:** three sentences whose words fill in from the tertiary ink as they are read.
    - **The table:** the eleven agents at their posts on a handmade miniature, measured on the plate. One at a time in a large card at the centre, with what it is doing live (the Watcher's gates, the Valuer's prices, the Router's split, the yes with the amber button, Outreach's Hindi offer, the Lister's lot, the Negotiator's counter, Paperwork's documents, Impact's kilos) and a rail of all eleven on desktops. The camera closes in on each post (1.6×; 1.45× on phones and tablets, where the yes frames the phone's screen and the post together), the phone's screen follows the story, the packs fly to the kiranas and the buyer as dots of about 50, the tags count them in, and the result lands with Replay. 1.4 s an agent, 1.8 s on the yes, 15.8 s in all; Pause and Play, under the bar; the result at once under reduced motion.
    - **The chapters:** SC-28's cards in four colour fields (green, sunken, amber, night). **The ledger:** Impact's document for the batch. **The pill** keeps the demo at hand until the close.
  - **Found on the way:** the mockups placed everything on the table from the stage's corner while the layer sat at the plate's offset; the kit's `img { max-width: 100% }` cropped the plate to the stage; the camera was clamped to the stage, not the plate; the data's Hindi offer names the shop, the brand and the distributor (SC-28), so the page composes its own; the scene's Pause sat under the sticky bar; the film clips were caught by the root `.gitignore`'s `*.mp4`. All fixed and recorded in `decision.md`.
  - **The port** (`frontend/admin`): `Hero`, `Statement`, `Scene` with `PhoneScreen` and `scene.ts`, `Chapters`, `Ledger`, `DemoPill` and `media.ts`; `Town`, `town/`, `Exits`, `How` and `street.ts` are gone. `site.css` is design3's verbatim, with no marked change. The showcase contract gains the batch's MRP and date, the plan's share of MRP, swing and CO₂e, the award's bid and token, the Negotiator's reserve, the price-support credit note and the offer's title; the seed and backend-api's reference data are regenerated. The a11y, e2e and parity specs follow the new page, unrun (design3's a11y suite went in SC-58).
  - **Checks:** the gate passes (lint, check, 103 unit tests: core 29, api 54, admin 17, testing 3), after merging main (SC-57 to SC-59). Design3 and the build were played through with Playwright at 1440 × 900, 820 × 1180 and 390 × 844, light and dark: the loader lifts, the film plays once and replays, the tour runs with the camera on each post, Pause, Play, the rail and Replay work, a theme switch swaps the plates and the film under the loader in 2.3 s, and reduced motion opens on the result. The browser suites were not run (SC-55).
  - **Hosting:** the hosted landing page loads commit `d9ede0f`, with `dist/site.js` carrying `core/platform.js` and the film from jsDelivr (`SC3_SITE_MEDIA`), since GitHub raw serves video as octet-stream. The console is unchanged.
- **SC-62** (PR #48, merged): the workspace app, Munchly Foods' workspace (`design3/app`, app v3), ported to the frontend, UI only, on the prototype's stub data.
  - **No design round:** a faithful port of the approved app v3 design, as SC-37 was for the console.
  - **Where it lives:** the main code is in `frontend/core` (the maintainer's ask): `core/src/lib/workspace/` (`@smart-clearance/core/workspace`) holds every role's screens from `design3/screens` (`common`, `auth`, `brand`, `trade`, `finance`, `admin`), `RoleApp` and `WorkspaceApp`. `frontend/workspace` is a thin third app that hosts it on real paths (`/command`, `/route` …), dev on :5175, preview on :4177 (`frontend-workspace`, `frontend-workspace-preview`).
  - **The kit's workspace pieces** in core: Skeleton, Tile, Countdown, StatusBadge, TrackerCard, BatchRow, AgentFeed, ClusterMap, HaulLine, ChannelBars, TrendChart, MixBar (the prototype's own SVG, not LayerChart), ChannelTable, SplitBar, MoneyPanel, DocCard, CodeBlock; `coverage.ts` has them built.
  - **The stub:** `store.svelte.ts` (store.js, persisted as `sc3-store`) and `flow.ts` (flow.js: the actions, and the agents as a reconciler, live while the app is open), on a seed `seed.mjs` writes from design3/core (`core/src/lib/workspace/seed/`), so money.js still works out every figure. `core/tests/workspace.test.ts` runs design3's flow.js beside it: the same store at all nine stages. backend-api can replace the store later without touching the screens.
  - **Found on the way:** core's Sheet now leaves focus on a field that focused itself as it opened (the one-time code's first box), as the kit's useModal does.
  - **Checks:** the gate passes (core 44 tests, api 54, admin 17, console 3, workspace 2). Compared with design3 at 1440 × 900 (25 screens), 390 × 844 and 820 × 1180 (16 each) on the same journey state: within 0.5% of the pixels, the rest hover states. Played through: email and phone sign-in, a wrong code, a first-time invitee joining, Setup, the agents to the plan, the approval, execution, a bid countered and accepted, switching person. The browser suites were not run (SC-55); the workspace app has none yet.
  - **Hosting:** the maintainer asked for munchkly.smartclearance.web.app, which Firebase cannot serve (a site is one label under web.app) and munchly.web.app is taken; the pick was `munchly-smartclearance`. Terraform applied on the maintainer's yes (plan read in full: 1 added, 3 changed: backend-api's CORS origins, a new revision on the same image; Firebase Auth's authorized domains; CI's `HOSTING_SITES`); a fresh plan shows no changes. `firebase.json`'s `workspace` target (the console's headers), `deploy.sh workspace`, and CI builds and releases it. Live at https://munchly-smartclearance.web.app, released from `21627b7`: deep links rewrite to the app, `noindex`, sign-in and the screens play on desktop and phone. backend-api's `/readyz` answers 200 and allows the new origin.
  - **Not yet:** not installable (manifest and service worker), no a11y, e2e or parity suite.
- **SC-63** (PR #49, merged): the guided demo (`design3/demo`, demo v3) ported to `frontend/demo`, exactly as designed, its data in the UI layer and no backend call.
  - **No design round:** a faithful port of the approved demo v3.
  - **The app:** `frontend/demo` (`@smart-clearance/demo`), dev on :5176, preview on :4178 (`frontend-demo`, `frontend-demo-preview`). `Director.svelte` is `director.jsx`'s director; the nine stages and their beats are data (`stages.ts`); `Device.svelte` draws a laptop or a phone; `Narration`, `StageBar` and `Finale` as in the prototype; `demo.css` is design3's, verbatim (a test holds it, and the beats, to `director.jsx`).
  - **On the workspace app (SC-62):** each device runs core's `RoleApp`, the guided `SignIn` or the new `LockScreen` inside an embedded `AppRoot`; entering a stage fast-forwards the stub store and lets that stage's agents run, as the prototype does. In memory: nothing is called, nothing is kept.
  - **Core:** `PhoneFrame` and `StatusBar` (the kit is now all built), `LockScreen` in the workspace app, and `Agents.nextStep`, `Agents.allowed` and `run` for Skip ahead.
  - **Checks:** the gate passes (demo 5 tests, workspace 2, core 44, api 54, admin 17, console 3). Against design3 on the same stage: the nine stages at 1440 × 900, phone only, notes hidden, a tablet (1024 × 1366) and a real phone (390 × 844), each within 0.04% of the pixels once the stage's agent has run. Played through: → from the first sign-in to the finale (41 beats), each person's move made in the devices (both sign-ins, Allow, approving on the phone), the keys, autoplay; no page errors. The production build renders. The browser suites were not run (SC-55); the demo has none yet.
  - **Hosting:** see SC-64.
- **SC-64** (PR #50, merged): the guided demo on Firebase Hosting.
  - **The name:** the maintainer asked for demo-smartclearance.web.app, but Firebase refuses site ids starting with `demo-` (it keeps them for its emulator's demo projects): the first apply failed on the site and had already added its origins to backend-api's CORS and Firebase Auth. The maintainer picked `smartclearance-demo`; the second plan (read in full, 1 added, 3 changed: the site, CORS with a new Cloud Run revision on the same image, Auth's domains, CI's `HOSTING_SITES`) replaced those origins. A fresh plan shows no changes.
  - **The release:** `firebase.json`'s `demo` target (the workspace app's headers: `noindex`, `X-Frame-Options: DENY`, the referrer policy), `deploy.sh demo`, and CI uploads `demo/build` and releases it. Live at https://smartclearance-demo.web.app, released from `3eb8166`: a stage opens from the address, beats move on, a real phone gets the full-screen mode, no page errors. backend-api's `/readyz` answers 200 and allows the new origin.
- **SC-65** (In Review, branch `SC-65-browser-suites`): the a11y, e2e and parity suites over every app, the workspace app and the guided demo's new, and the fixes they called for (the maintainer asked for the suites in the request).
  - **The suites:** `frontend/workspace` (a11y and e2e on :4181, parity :4182) and `frontend/demo` (:4183, :4184) get the console's three, run on request only. The workspace's put the journey at a stage by running design3's own core scripts (`tests/e2e/workspace.ts`); the demo's scan every stage beat by beat. The root `test:a11y`, `test:e2e` and `test:parity` run all four apps.
  - **Coverage:** `COMPONENTS` gains the 29 core components the two apps brought (StatusBadge carries `data-status` for it). `a11y-coverage.ts` follows the workspace screens into core for an app on `@smart-clearance/core/workspace`; an app names the screens it never shows in `package.json` (`a11yCoverage.unreached`: the demo has no workspace admin).
  - **Fixed, design3 first where it was design3's:**
    - dark mode, a hovered list row's tertiary text (4.37:1 on the hover fill): it takes the secondary ink (`components.css`);
    - design3's landing page centred its sheets on the whole page, far below the window: the kit's `AppRoot` gains `scroll="window"` and the fixed overlay layer the port already had, and `.app-window`/`.app-overlays` move from the port's `@port` block into design3's `components.css`;
    - the port's sheets and alerts locked scrolling on the landing page, which jumped it to the top behind a sheet and lost the place: no lock on a window-scrolling page, as the prototype;
    - the one-time code: a wrong code clears the boxes and focus goes back to the first (the kit's `OTP` and core's);
    - the demo's splash sat in the stage's flow from 768 px (`demo.css`); a beat ticked by opening something counts as done once a later beat is, so approving inside the phone moves the notes on; the anchor scroll measures in the scaled device's own pixels (`director.jsx`, the port);
    - the demo's finale is a dialog, the stage behind it inert (Tab went to the stage bar under it); a device's banners and anchor scroll no longer reset on every beat;
    - the landing page's ledger: its figures are Rolls at rest, as design3's are, so its rows keep their height (parity found 6 px);
    - the landing page's film-word check looked at the leaving word too, and was too tight under load.
  - **Checks:** a11y: landing page 36 pass, console 99, workspace app 131, demo 86, each with 0 WCAG findings and every core component it uses on screen (22, 36, 60, 61). e2e: 2, 11, 9 and 11 pass; Firefox cannot start in the sandbox. Parity: 29, 80, 140 and 56 pass (the workspace app's threshold 0.5%, for a prototype that lays its text out 0.18% differently about one load in sixteen). The gate passes.
  - **Hosting:** design3's changes are in `dist/`; the hosted pages still load their pinned commit.
- **SC-66** (epic, done): Workspace v1, Munchly's journey live. The workspace app (`frontend/workspace` over `frontend/core`'s screens) runs the Journey Map v4.1 journey on backend-api, with the agents on Google ADK and Gemini, Pub/Sub, Cloud Scheduler, BigQuery, Cloud Storage, FCM and SSE. The guided demo stays on the stub.
  - **The maintainer's decisions (7 Oct):** Munchly's people sign in on `@munchly.example`, everyone outside Munchly on `@google.example`; email and password only; partners act through their own sign-ins, with no stand-ins; a design round first; compressed days, a client setting of 1 to 1,440 minutes a journey day; no emulators, only Postgres local; nothing hardcoded in the UI.
  - **The plan:** `/Users/arundutta/.claude/plans/now-i-want-to-federated-cookie.md`, one epic in eight stories (SC-67 to SC-74), with costs, BigQuery's seven tables, the evals, and messages and chat.
- **SC-67** (PR #54, merged): the workspace's screens read a `WorkspaceSource` (`core/src/lib/workspace/source.ts`), the stub one of two; golden texts of every role's screens and a literal ratchet at 0 guard it.
- **SC-68** (PR #53, merged; design): the live UI's round, on one board in app v3 (`SC-68 design review.html`) and one in platform v3 (`SC-68 console review.html`). The picks: the workspace's **B, in the header, batch by batch**, and the console's **A, a badge in the client's head**. The four answers: sign-in chips fill the email only; the Users screen invites by email only; the Raipur buyer keeps ExpireSoon's look; the journey clock is essential (quarter-hour steps, never announced, no pause). Designs and the decision are in `design3/designs/SC-68/`.
- **SC-69** (PR #52, merged): `design3/core/world.js` (sign-in addresses, the 38 kiranas, members, numbering), the fixtures `seed.mjs` writes for backend-api (`journey.json` with the story's moments and market, `money.json`, `flow.json`), and the contract `frontend/api/src/types/workspace.ts`.
- **SC-70** (PR #58, merged; applied 7 Oct on the maintainer's yes: 108 added, a fresh plan clean): infra phase A, per environment (prod and local): the topics and local pull subscriptions, BigQuery `smartclearance` and `smartclearance_local` with seven tables, the photos, docs and exports buckets, `sc-agents`, `sc-agents-local` and `sc-invoker`, the workspace's Firebase web app and key, and the WORKSPACE_* repository variables. Under GBP 0.01 a month.
- **SC-71** (PR #55, merged): backend-api's workspace API (`/v1/workspaces/{ws}`, `routers/workspace.py`, `services/journey/`): members on email and password, the journey's steps and agents' `/internal` routes (backend-api computes every figure; the models supply words, checked by `domain/copy.py`), the journey clock, timers and tick, the outbox to Pub/Sub, the SSE stream, the Notifier (FCM), idempotency keys, hydrate's live world. Verified live locally (`scripts/walk.sh`).
- **SC-72** (PR #56, merged): `agents/`, google-adk 2.11 on Python 3.14: stateless pipelines on Gemini (`gemini-3.1-pro-preview`, `gemini-3.8-flash`, on Vertex AI's global endpoint), one run a Pub/Sub event, reporting to `/internal` with a Google ID token; the reserve never reaches a model. The evals (`agents/evals/`, 73 Vision label cases from Qwen photos and the rest) run on request only, about GBP 2 a run; the first live run was SC-75's (see SC-77).
- **SC-73** (PR #57, merged): the frontend live.
  - **The client:** `@smart-clearance/api/workspace` (`workspaceHttp` with idempotency keys and a fresh token on a 401; the live stream, SSE while someone is using the app, else polling every 30 s; uploads to signed links) and `@smart-clearance/api/firebase`, shared with the console.
  - **The live source:** `frontend/workspace/src/lib/live/` projects backend-api's answers onto the screens' shapes, optimistic where safe; `#lib/client.ts` picks it when the build has `PUBLIC_API_BASE`, and a live build aliases the stub away (`scripts/no-seed.mjs` checks).
  - **Option B, built design3 first** (`?live` and `?state=` in the app prototype), then ported: the live sign-in with the story's people as chips, the live line under every title, the band while the stream is down, the console's splash (SC-51) for loads and sign-in, the first-run push step, flagged batches as tabs, upload progress, failures with Retry, and a quiet day.
  - **The console's option A:** the journey-day badge and sheet on every tab of a client (`PUT …/clock`), and the invitation by email only.
  - **Installable:** a manifest written at build time and a service worker for the offline shell and pushes, registered only by a live build.
  - **The journey, walked locally on real cloud services** (`backend-api/scripts/walk.sh`, Firebase custom tokens signed through the impersonated `sc-api-local`, so no password is handled): Setup's export, the permission, the Watcher, the label photo, the plan at ₹21,770, the approval, 588 kiranas' packets, the counter at ₹14.20, the donation, INV/26-27/0931 and CN/0117, the shelf check at Jai Durga Stores, at 5 and then 1 minute a day.
  - **Found on the way:** the console answered 500 for Munchly after the live build (its sign-in methods' shape); a reset dated the story's batches from the next morning, so the label photos never matched (a synthetic workspace now replays the story's own calendar); exports are written once, never replaced; a donation spent a credit-note number.
  - **Checks:** backend-api 407; the frontend gate (core 248, api 69, workspace 35, admin 17, demo 5, console 3). The browser suites were not run (SC-55).
- **SC-74** (PR #59, merged): infra phase B, applied on the maintainer's yes (7 Oct: 22 added, 3 changed, 0 destroyed; a fresh plan clean once the scheduler jobs dropped a `retry_config` that held only defaults): the `agents` Cloud Run service (internal, as `sc-agents`, deployed by Cloud Build from CI), prod push subscriptions, Scheduler (`sc-tick` every minute, `sc-journey-reset` paused), backend-api's live settings and 3,600 s timeout, alerts, and the budget at GBP 30. About GBP 1–3 a month with light use, GBP 8–15 with heavy use.
  - **The merges** (#52 to #59, in order): each branch was brought up to date with `main`, its generated files regenerated, and its gates run. The idempotency table moved into its own migration, 0005, so production, which ran SC-71's 0004 first, gains it too.
- **SC-78** (PR #63, merged): the landing page refined: the film, the day scene, the workspace section and the bar.
  - **The request:** a longer (10 s), looping, more immersive hero film that tells the story; the day scene too whitish; the islands section not good enough; the bar's lock-up and links not good enough; "beautify the page more".
  - **Design first:** four parts, two or three options each, as three complete pages on one board in platform v3, `SC-78 design review.html`, with a switcher that swaps any part. The pick, part by part: the film **C, One day**; the day scene **A, Re-lit**; the workspace section **B, The workspace itself**; the bar **B, structured**. Designs, plates, the six clips, stills, recordings and the decision are in `design3/designs/SC-78/`.
  - **The film:** two ten-second LTX clips, morning to night and night to morning, each ending on the frame the other begins on (seams of 1.9 and 3.1 on a 255 scale), chained and looping under Pause (WCAG 2.2.2); the light theme starts in the morning, the dark at night. A strip under the copy reads the hours of the story (four beats a half-day, the yes in amber); the film drifts with the scroll, not the clock. AGENTS.md's loop rule now exempts the hero film under its Pause. The day loop's first render let the glowing path wander onto the godown's roof; the seamless-loop option was re-rendered with the path told to stay on the road.
  - **The day scene:** the table plate re-lit by Qwen as an edit of itself (geometry held, so the posts still fit); the stage's ground is a warm sand field and the wash while an agent works is a sage-dark vignette, no longer the page's white.
  - **The workspace section:** the islands are gone; the product sits on the kit's browser window (a phone frame on phones), its address typed in as the section comes into view, the four teams as tabs that play through once (2.4 s each), each with its own card and, on desktops, what the agents did for it today. No client is named ("Your brand").
  - **The bar:** the brand lock-up rebalanced (30 px mark, 16 px wordmark), the links centred with a dot under the section the reader is in, the actions at the right, a green progress line along its foot once scrolled.
  - **Also:** the demo pill keeps clear of the hero and of the workspace section's cards; the islands plates and the old town clips are removed.
  - **The port:** `Hero.svelte` (two chained players, the strip, the scroll drift), `Nav.svelte`, `Workspace.svelte` (WindowFrame, PhoneFrame, WorkspaceMark), `figures.ts` (the beats, the teams and their day), `media.ts`, `plates.ts`, `site.css` verbatim; `Plate.svelte` is gone. The film's keyboard spec follows the loop. The browser suites were not run (SC-55).
  - **Checks:** the gate passes (lint, check, tests: core 248, api 69, admin 17, console 3, workspace 35, demo 5). design3 and the build were played through with Playwright at 1440 × 900 and 390 × 844, light and dark: the film chains and loops, the strip reads the beat, the device types its address and plays its tabs, a theme switch swaps the clips and plates under the loader in 2.3 s.
- **SC-76** (PR #60, merged): the agents' readiness check started its ten-minute cache at 0, so a container (or a CI runner) started under ten minutes ago answered ready without checking the models; it failed CI's agents gate on `main`, which held back the agents' and Hosting's deploys. The cache now starts at minus infinity.
- **SC-75** (PR #61, merged; Done): Munchly's workspace live in production.
  - **In production, on the maintainer's yes:** the prod hydrate (`--live-only`: 50 members, 38 kiranas, day 0 on 2 Oct); `workspace_live = true` applied, so CI builds the workspace app on backend-api (munchly-smartclearance.web.app signs Munchly's people in with email and password); one journey walked in production with live Gemini, to the story's figures; the evals' first live run (208 cases, about GBP 2.10), whose findings moved to SC-77.
  - **What it changed:** `sc-hydrate --live-only` builds Munchly's live world on a database that already holds its story, as production does (no reset); the walk (`scripts/walk.sh`) reads no database and can walk production (`--api … --origin … --allow-env prod`); a journey reset through hydrate takes fresh ids (the seeded ones repeated the world's own); the Watcher reads sell-through up to the journey's day, so a replay of the story's calendar never counts later days an earlier replay loaded.
  - **Verified locally:** a world built with `--live-only` on top of the story walked to the story's figures (₹21,770 planned, ₹14.20 countered, INV/26-27/0931 and CN/0117, ₹21,152 actual), and a second reset in a row works.
- **SC-77** (PR #62, merged): the agents on live Gemini, fixing what the first eval run found.
  - **Gemini's structured output:** a map of free keys comes back empty, and a property the schema does not require may be left out. So the Data agent's column map and the Valuer's notes are lists of pairs; every field of every output schema is required, null standing for "not there" (Vision's label read returned only its confidence); the judge scores as a list too. `tests/test_schemas.py` holds every schema to that, and every recording to its schema.
  - **Capacity:** each model call gets up to 3 attempts on 429, 500, 503 and 504, with backoff (1 s, then 2 s, plus up to 1 s of jitter), 30 s an attempt (`MODEL_ATTEMPTS`, `MODEL_TIMEOUT_S`), and `Bounded` allows the whole call exactly that long. The judge retries too, and a case it could not score is reported apart, not as 0. The eval runner paces its cases a second apart (`--pace`).
  - **backend-api's label check:** a read with no batch number asks for another photo with the reason ("the batch number could not be read", or "the label could not be read" when nothing was), never "confidence under the threshold"; the feed says it could not read the label.
  - **The scorers:** a counter that equals the reserve is not a leak (as `reply_ok` holds), and a best-before of 18 Nov does not quote a reserve of ₹18 (`checks.shows` sets dates aside).
  - **The Valuer's prompt:** the second run's judge found its notes faithful (5) but reading each row back (useful 2.25, clear 3.6); a note now makes one point, why that exit suits this batch now, quoting at most two figures (5 on every criterion after).
  - **The second live run** (7–8 Oct, on the maintainer's yes; each set's `summary.json` is committed): Vision 72 of 73 (clean labels exact, hard ones 98.4%, no confident wrong read), Data 25 of 25, Router 20 of 20 (rubric 4.61), Lister 15 of 15, Outreach 15 of 15, Negotiator 38 of 40 (the reserve never leaked, only the decided price), Valuer 19 of 20 on the new prompt (rubric 5; every channel noted wherever the model answered). The three cases that failed were the Pro preview's quota (429 after every attempt), each falling back safely; the eval's judge also runs on Pro, about doubling the load production puts on it. A scorer that still read the Data map as a dict stopped the run once; fixed, with a test on Gemini's shape.
  - **Checks:** agents 187 pass; backend-api 411 pass; infra `check.sh` passes.
- **SC-79** (PR #64, merged): demo controls. The console fires a client's scheduled runs and journey timers at once, and starts its journey again; the workspace's Setup waits for the first mapped export.
  - **The request:**
    - "All batch runs should have a trigger which I should be able to control and do instant trigger from console screen against each agent for that client."
    - A button on each client that resets its journey.
    - The Setup fix: after a reset, "Confirm and start watching" was offered before any export was mapped, and backend-api refused it.
    - The maintainer's answers: keep the schedule and add triggers; only the scheduled runs and the timers.
  - **Design first:**
    - three console options on one board in platform v3 (`SC-79 design review.html`): A, on each agent; B, one journey sheet; C, a Journey tab;
    - two Setup options in app v3: A, waiting in the export card; B, three steps;
    - the picks: console **A**, Setup **A**; a timer asks before it fires early; the reset offers a day length.

    Designs, stills and the decision are in `design3/designs/SC-79/`.
  - **The console:**
    - under each agent's stop on the Agents tab, and in its inspector, are its scheduled runs and pending timers: the Data agent's daily load, the Watcher's daily check, Outreach's offer window and day-7 shelf check, Impact's report;
    - each shows when it falls due in journey time and how long that is in real time, with a button to fire it now;
    - a timer that isn't ready says why, and its button is disabled;
    - a timer asks first ("Close the offer window now?"); a daily run fires at once;
    - **Reset journey…** joins Pause every agent in the client's actions menu. Its sheet explains the reset and offers Real time, Rehearsal, Demo or Fast, starting on the client's current length.
  - **backend-api:**
    - `GET …/clients/{id}/journey`, `POST …/journey/triggers/{trigger}` and `POST …/journey/reset {dayMinutes?}`, in `services/journey/controls.py`;
    - firing runs what the tick runs, so the tick's daily runs and its timer firing are now functions (`tick.run_daily`, `ready`, `fire_timer`);
    - a daily run fired early is that day's run, so the tick doesn't run it again;
    - every fire and the reset write an audit line in the staff member's name;
    - a client that isn't live keeps the old Run now for its two daily agents, and has no journey to reset.
  - **Setup:**
    - on a live workspace with no mapped export, the card says "No stock export mapped yet", keeps the eight fields as waiting, makes Upload an export primary, and names the Data agent's next run;
    - Confirm is disabled until an export is mapped, with its reason tied to it;
    - the workspace's rules gain `dataTime`;
    - the stub and the guided demo are unchanged.
  - **The contract:** `Journey`, `JourneyTrigger`, `journey`, `fireTrigger`, `resetJourney`. The mock follows design3's `platform.js`, held to it by tests.
  - **Checks:**
    - backend-api 415 pass, 4 of them new;
    - the frontend gate passes: core 248, api 75 (6 new), workspace 37 (2 new), admin 17, demo 5, console 3;
    - agents 187 pass;
    - played through on the console's mock build (`frontend-console-mock`, :4196): a timer asked and fired; the reset at Demo, with both audit lines;
    - the browser suites were not run (SC-55).
  - **Hosting:**
    - the hosted console loads commit `99483d5`: re-pinned from `0384e24`, so it also carries SC-68's journey-day badge; it was checked to render with the triggers;
    - the hosted app page stays on `58c6874`: re-pinning it waits on SC-75's note about live mode's files, and Setup's waiting state shows only in live mode.

- **SC-80** (PR #65, merged): the label photo step offers both ways in words, Take a photo and Upload a photo.
  - **The request:** "1. Either take photo. 2. Upload an already taken photo", with a sample to upload. The sample is the story's clean label photo from the Vision eval set, handed over as `label-MF-2409-117.jpg` and kept as `design3/designs/SC-80/sample/label-photo.webp`.
  - **Design first:** three options on one board in app v3, `SC-80 design review.html`:
    - A, two ways under the frame;
    - B, choose first;
    - C, the real viewfinder.

    The maintainer picked **A**. Designs, stills and the decision are in `design3/designs/SC-80/`.
  - **The step:**
    - The frame is the guide, marked Example ("Like this: one carton label, close up").
    - Under it are Take a photo and Upload a photo, 48 px each. The primary follows the device: Take on a phone, Upload on a laptop.
    - A phone takes the photo with its own camera app (`capture`). On the live workspace, a laptop opens its camera in a landscape frame (`getUserMedia`, the rear camera where there is one), with Cancel, the shutter and Upload. A frame from it is sent as a JPEG, and the stream stops when the photo is taken or the step is left.
    - On a laptop, a photo can also be dropped on the frame.
    - A photo in hand shows whole, in its own shape, under its file name, with Retake or Choose another, and Send.
    - What backend-api refuses is refused first, with the reason as an alert: a file that is not a JPEG, PNG or WebP, or a photo of 8 MB or more. A refused or missing camera says so and points to Upload.
    - The 30 px gallery icon is gone.
    - The stub and the guided demo keep the stand-in photo. The demo's hint is now "Tap Take a photo, then Send photo".
  - **The port:** `CameraInner.svelte`; core's `screens.css` (verbatim); the goldens for Rakesh's camera screen; two live tests (a file refused, the camera refused); the workspace e2e specs press "Take a photo".
  - **Checks:**
    - The frontend gate passes: core 248, api 69, workspace 37 (2 new), admin 17, demo 5, console 3.
    - Played through in design3:
      - the laptop camera, with Chromium's fake camera: the shutter, the photo whole, Send;
      - an upload, and a text file refused;
      - no camera;
      - the phone's camera;
      - the demo's Verify beat.
    - Played through on the stub build of the workspace app: the stand-in photo, a 9 MB file refused, the sample uploaded and verified, the phone's camera with its `accept` list.
    - The browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app and demo pages stay on their pinned commit, as for SC-79.

- **SC-81** (PR #66, merged; bug): a journey started again no longer shows the cases an earlier journey finished.
  - **Found:** after a local run-through to the report, `hydrate.sh --journey-reset munchly` left MF-2409-117 showing as cleared at day 0. The reset closed only open cases, and the workspace shows each batch's latest case, so a case already closed as `cleared` stayed in view until the Watcher flagged the batch again.
  - **The fix:**
    - The reset records when the journey began (`workspace_doc.journeyFrom`, wall time).
    - `views.latest_case` ignores cases opened before it, for the snapshot, a batch's case, its documents and the agents' `/internal` read.
    - Nothing is deleted, and no migration is needed. The console's Reset journey (SC-79) runs the same reset.
  - **Checks:**
    - backend-api: 416 pass. The new test fails without the fix, with the old cleared case listed beside the Mango Drink's.
    - Locally, a reset leaves only the Mango Drink's case in Munchly's workspace.

- **SC-82** (PR #67, merged; bug): the live Command Center after a reset.
  - **Found by the maintainer** on the local workspace at day 0:
    - the watchlist's Mango Drink, in motion, opened nothing;
    - "Gated · selling through" rows showed three crossed gates;
    - "All SKU and batch level overrides should be taken as configured per client".
  - **The watchlist:** on the quiet Command Center (`CommandQuiet.svelte`), every row's handler was empty. On the busy Command Center, the batch going to a food bank opened nothing either, since the tabs leave it out. A batch in a journey now opens its Route Room on both, design3 first (`brand.jsx`'s live Command Center), then the port.
  - **The overrides:** every reading in backend-api already used SC-47's effective gates (batch, else SKU, else the client's default). But `journey/reset.py` cleared every batch's override, so Reset journey dropped Munchly's seeded override on MF-2409-204 (Zepto and Instamart at 30%), and the biscuits read as gated. The reset now keeps batch overrides, the client's configuration. Locally, the override was set again through the console API, and the biscuits read safe.
  - **"Gated · selling through" is the money model's rule:** a batch is at risk only when units will not sell before the projection stops and every gate fails. MF-2408-311, for example, sells all 960 packs inside its date. Whether a batch that fails every gate should count as at risk anyway is the maintainer's call.
  - **Checks:**
    - backend-api: 417 pass. The new test fails without the fix: 60 and the default instead of 30 and the override.
    - The frontend gate passes, with workspace at 40 tests: a new live test opens the Mango row from the quiet Command Center, and leaves a batch in no journey where it is.
- **SC-83** (PR #68, merged): a gated batch that sells through says why it is fine on the watchlist.
  - **The request:** the maintainer read "Gated · selling through" rows with three red crosses as at risk. Asked whether such a batch should count as at risk, they chose **"Keep it, clearer row"**: money.js's rule stays (at risk only when packs will not sell before the last week **and** every gate fails).
  - **Design first:** three options on one board in app v3, `SC-83 design review.html`:
    - A, sells out by;
    - B, one chip;
    - C, the projection drawn.

    The maintainer picked **C**. Designs, stills and the decision are in `design3/designs/SC-83/`.
  - **The row** (the kit's `BatchRow`, design3 first, then core):
    - **Which rows:** only a gated batch that sells through (not in a journey, nothing at risk).
    - **The bar:** a new `SellBar` replaces the countdown. The green part is the days its packs take to sell at today's rate; the hatched end is the last week retailers will not take it.
    - **The line:** "Sells out 6 days before retailers stop", or "the day retailers stop". It keeps to the bar's row while the bar can shrink for it, else it takes a row of its own.
    - **Red means risk:** a failed gate is red only while the batch is at risk (`GateChips`' `quiet`), and neutral on a batch selling through, in motion or cleared.
    - **From the data:** every figure comes from the batch's packs, sales a day and money.js's usable days. money.js is unchanged.
  - **The port:**
    - `BatchRow`, `GateChips` and the new `SellBar` in core;
    - `components.css` (verbatim);
    - `coverage.ts`, and the a11y suite's `COMPONENTS` (`.sellbar`);
    - 44 goldens of the gated rows; the seed manifests.
  - **Checks:** the frontend gate passes: core 248, api 75, workspace 39, admin 17, demo 5, console 3. design3's watchlist was shot at 1440 and 820, light and dark. The browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-84** (PR #69, merged): a client's first stock export is set up by staff in the console, so the workspace's Setup opens mapped.
  - **The request:** the workspace's "Connect your stock data to start" should be done already the first time: the export is configured in the console while the client is being set up, and later daily syncs or uploads come from the workspace as needed. The maintainer's answers: **the export mapped** (staff upload it, the Data agent maps it, the client's operator still confirms the guardrails); a journey reset **keeps** the mapping.
  - **Design first:** three options on one board in platform v3, `SC-84 design review.html`:
    - A, a step in New client;
    - B, on the Supply chain tab;
    - C, as a connector.

    The maintainer picked **B**. Designs, stills and the decision are in `design3/designs/SC-84/`.
  - **The console** (design3 first, then `frontend/console`):
    - **First stock export** opens the client's Supply chain tab, above the distributors, SKUs and batches it brings. Its moments: waiting (drop or choose a CSV), uploading, the Data agent mapping, and mapped (the file, its rows and distributors, who uploaded it and when, the field mapping, Replace).
    - Its "90 days of sell-through" and "at 08:30" are the Data agent's own settings (`backfillDays`, `time`).
    - New client's Review says the export comes next, and the new client opens on its Supply chain tab.
  - **The workspace:** while Setup isn't confirmed and the export is mapped, the Command Center reads "Confirm Setup to start watching", with the export's batches and distributors, and "Review and confirm". With nothing mapped (live only), it reads as before.
  - **The contract:** `Client.firstExport` (`status` mapping or mapped, the file, rows, batches, distributors, who and when, and `columns`: each field with the file's column) and `ConsoleApi.uploadExport`. The mock follows `platform.js`, mapping 1.8 s after an upload when it has latency.
  - **backend-api:**
    - `POST …/clients/{id}/exports` (a signed link) and `POST …/exports/{export}` (it has arrived), in `services/exports.py`. It takes Setup's path (the exports bucket, then the Data agent's `export.uploaded`), and writes the audit line in the staff member's name.
    - The client keeps its first export and the column map the Data agent reports (`workspace_doc`).
    - A journey reset keeps `setup_mapped` and the last import; only the confirmation goes back to not given.
    - The story's export is recorded mapped, by Neha Kulkarni.
  - **agents:** the Data agent reports the stock file's columns, field by field (`data.FIELD`).
  - **infra:** the exports buckets' CORS gains the console's origins, since the console uploads straight to the bucket. Applied on the maintainer's yes (plan read in full: 0 to add, 2 changed in place, 0 destroyed; free); a fresh plan shows no changes.
  - **The demo's sample export:** `design3/designs/SC-84/sample/dms_export_2026-10-01.csv`, Munchly's nine story batches as its distributors' closing stock on 1 Oct, in the Bizom-style layout backend-api's synthetic exports use. The Data agent's own parser reads it from its saved layout (no model call): 8 of 8 fields, 9 rows, none unread. Uploading it re-states what the workspace already holds, so it adds no batches.
  - **Checks:**
    - backend-api 421 pass, 3 of them new (`test_first_export.py`), and the reset test updated;
    - agents 189 pass;
    - the frontend gate passes: core 248 (two Command Center goldens updated), api 77 (2 new), workspace 40, admin 17, demo 5, console 3;
    - infra `check.sh` passes;
    - played through on the console's mock build: Munchly's export mapped in light, dark and on a phone; a demo request made a client, ending on its Supply chain tab; an upload mapped, with its audit line; no page errors;
    - design3's card and the port's were shot at 1440 and match;
    - the console's e2e, live and a11y specs follow the new end of New client, and a scan of the waiting card is added. The browser suites were not run (SC-55).
  - **Hosting:** the hosted console loads commit `76774dc`; every pinned file was checked on jsDelivr first, and the page renders the card. The hosted app page stays on its pinned commit.

- **SC-89** (epic, done): the two-batch demo, live and dynamic: the Masala Chips (MF-2409-117, Rakesh Traders, Nagpur) and the Mango Drink (MF-2410-118, Lakshmi Agencies, Hyderabad) each run their own journey from day 0, and the console's Reset journey puts the data back to the story's start.
  - **The request:** "I need Mango Drink batch and Masala chip batch to showcase demo … the logic has to be dynamic not stubbed or hardcoded", and Reset journey should "bring the dataset back to original state for me to redo the demo".
  - **The maintainer's answers (8 Oct):**
    - the staff sale: the distributor records it, after a design round;
    - kirana orders: by hand only; units no shop ordered are reported, not counted as sold;
    - the reset: the journey's data, keeping the client's configuration.
  - **The plan:** `/Users/arundutta/.claude/plans/now-i-want-to-federated-cookie.md`. Four stories, stacked in this order: SC-86, SC-85, SC-88, SC-87.
- **SC-86** (PR #70, merged): the live journey for any plan, with both demo batches from day 0.
  - **Every line runs** (`domain/journey.py` `line_done`, `lines_done`; one `_advance` in `steps.py`). A case reaches its papers once each line with units is done:
    - the kiranas' offer closed;
    - the ExpireSoon truck loaded, or the listing ended unsold (a `listing.close` timer at 9 days, which the console can fire);
    - the staff sale recorded (migration 0006 `cases.staff`; `POST …/cases/{ref}/staff-sale {sold}`, `staff.record` for the batch's own distributor);
    - the food bank collected, or declined (`POST …/donation/decline`; no fitting partner declines too).
  - **No stalls:** an approved case asks the agents only for what they run; an offer with no shops closes at once.
  - **Realised accounting** (money.js and money.py `realised`, held by fixtures):
    - each line counts the units its channel took;
    - what no channel took is left at the godown, recovered nothing, and still faces the write-off;
    - a plan done as planned comes back unchanged.

    The papers (a credit note only above ₹0), the case detail, the report's ledger (with `planned` and `godown`) and Impact's rows use it.
  - **Data:**
    - the Hyderabad cluster, with 58 kiranas, each with its `distributor`;
    - the Mango's label record;
    - the hand-staged Mango (`_second`) is gone.
  - **The clock** runs at the chosen day length until the journey's cases clear. walk.sh walks both batches.
  - **Checks:** backend-api, agents and the frontend gate pass.
  - **Live, locally, with Gemini:** both batches reached settled. The chips came to ₹21,152. The Mango Drink came to ₹16,917 with kirana 1,372, staff 150 and food bank 58.
  - **Found later (SC-87):** core's workspace types lacked the contract's `ended` listing and `declined` donation, which failed the workspace type check. Fixed on this branch and merged up the stack.
- **SC-85** (PR #71, merged; bug): each batch's screens follow its own plan (design3 first, then core).
  - **Route Room:** a sentence per line.
  - **Execution:**
    - a card per line;
    - a left-out channel says why;
    - the Negotiator appears only with an ExpireSoon line.
  - **Per-line plans:** ApproveSheet, DistHome, DistOrders and EndWhole.
  - **Paperwork and Paper:** they open on the first paper that exists, with no crash on a case without an invoice.
  - **ClusterMap:** drawn per distributor (`clusterOf`).
  - **The live projection:**
    - every open case is a tab;
    - each case's donation is its own;
    - the focus holds;
    - no placeholder lines.
  - **Checks:** the goldens are unchanged, and new live tests draw the Mango's screens.
- **SC-88** (PR #72, merged): Reset journey puts a synthetic workspace's journey data back to the story's start.
  - **Members:** back to their story status. Members invited in a demo leave the workspace (their accounts stay), except the approver.
  - **Document numbers:** back to the story's.
  - **Stock export:** the story's export, mapped (`exports.restore`).
  - **Batches:** those an uploaded export brought are removed, or closed as `reset` if a case used them.
  - **History is filtered by `journeyFrom`, not deleted:** notifications and the Quarter report.
  - **Files and ledgers:** the shelf file is named per case, and Impact's ledger id carries the journey's start.
  - **What stays:** the client's configuration (gates, overrides, guardrails, agents' settings, day length) and the audit log.
  - **Checks:** verified on the local console's Reset.
- **SC-87** (PR #73, merged): the staff sale and what is left at the godown, in the workspace.
  - **Design first:** three options on one board in app v3, `SC-87 design review.html`:
    - A, a card on Today;
    - B, a running tally;
    - C, one question at the end.

    The maintainer picked **A**, with the UPI code as an illustration. Designs, stills and the decision are in `design3/designs/SC-87/`.
  - **The distributor's Today** (design3 `trade.jsx` `StaffSale`, core `screens/trade/StaffSale.svelte`):
    - once the plan is approved, a Staff sale card gives the packs, the price and the godown;
    - beside it are the distributor's UPI address and a code drawn from it (`.paycode`, aria-hidden; nothing scans it);
    - one count (`Stepper`, every pack to start) records what sold, once;
    - recorded, it reads what sold and what stays at the godown.
  - **Priya's Execution** (`StaffOps`, `GodownLeft`):
    - a Staff sale card for a plan with a staff line (no agent acts there);
    - once every line is done, **Left at the godown**: each line's planned packs it did not take, and the net against the plan's.
  - **Data:** each distributor's `upi` (fictional, `…@exampleupi`) is in design3's `data.js`, migration 0007 `distributors.upi`, hydrate, the snapshot and `WsDistributor.upi`.
  - **The contract:** `WorkspaceApi.staffSale`. Core gains `Hero.staff`, `CaseData.realised` and the `recordStaffSale` step, in the live source and both stub flows.
  - **The closing push:** when packs are left at the godown, it names how many, where, and what the plan expected.
  - **The live fixtures:** the executing moment now includes Lakshmi Agencies.
  - **Checks:**
    - backend-api 452 passed;
    - the frontend gate passes: core 248, api 77, workspace 45 (3 new: Lakshmi records the sale; Priya sees it open; Left at the godown at the close), admin 17, demo 5, console 3;
    - design3's two cards were played in the prototype with a staff sale and realised figures put in its store;
    - the browser suites were not run (SC-55).
  - **Locally:** migration 0007 is applied. The distributors' addresses arrive with the next `hydrate.sh --live-only`, which restarts the journey; until then the card leaves the code out.
  - **Hosting:** design3's `dist/` is rebuilt, and the hosted app page stays on its pinned commit.

- **SC-90** (PR #74, merged; bug): the console's live batches agree with the workspace, and every watchlist row opens something.
  - **Found by the maintainer** during the two-batch demo: the console's days left were 5 apart from the workspace's on every batch, and on the Command Center the chips (at risk) and every other row opened nothing.
  - **Days left:**
    - the console counted from today's real date, the workspace from the client's journey clock (a synthetic workspace replays the story's calendar);
    - `dashboard.batches` and `supply.client_batches` now count from each client's own day (`events.clock_of`);
    - a client without a journey runs on real time, unchanged. Verified locally: all nine of Munchly's batches agree.
  - **The watchlist:**
    - a row opens its Route Room only when its batch is in a journey; every other row now opens the batch sheet the Batches screen uses (`BatchSheet`, design3 `brand.jsx` first, then core), on the busy and the quiet Command Center;
    - the sheet no longer tells an at-risk batch "Nothing to do": it says the Watcher checks every morning and flags it once Setup is confirmed and its distributor has given permission.
  - **Why the chips had no journey:** the Watcher flags a batch only once Setup is confirmed and its distributor has given permission. Rakesh's came after the day-0 check, so the chips were flagged at the next morning's check. For the story's figures, give it before day 0's 09:00, or fire the Watcher from the console after it.
  - **Not changed:** the console's "Updated" column, which `platform.js` defines the same way.
  - **Checks:**
    - backend-api 453 passed (1 new: the console's days left are the workspace's);
    - the frontend gate passes: workspace 47 (2 new: the sheet from the quiet and the busy Command Center), core 248, api 77, admin 17, demo 5, console 3;
    - design3's sheet was opened from its watchlist in the prototype.
  - **Locally:** the API hung on a reload while the workspace's event stream was open, and was restarted.
- **SC-91** (PR #75, merged; bug): Execution keeps the batch in focus.
  - **Found by the maintainer:** after approving the Masala Chips, Execution read "MF-2410-118 · no agents · Nothing is executing yet", though the chips' lot was live and the kiranas' offer sent.
  - **The cause:** the workspace takes the batch in focus from the address. A screen opened without a batch fell back to the most urgent open case (`focusRef`): the Mango Drink, 22 days left against the chips' 47. The approve sheet, "Watch execution" on the Command Center and in the Route Room, and the sidebar all opened Execution without a batch.
  - **The fix:**
    - those buttons carry the batch in focus (`/execution/<ref>`), design3 `brand.jsx` first, then core;
    - `RoleApp` keeps the batch in focus when a screen is opened without one, so the sidebar moves between the same batch's screens.
  - **Checks:**
    - the frontend gate passes: workspace 49 (2 new; the focus test fails without the fix, showing the Mango's Execution), core 248, api 77, admin 17, demo 5, console 3;
    - the workspace e2e spec expects `/execution/MF-2409-117` after approving;
    - the browser suites were not run.
- **SC-92** (PR #76, merged; bug): the buyer's chat sends, the counter names its token, and the buyer has his face.
  - **Found by the maintainer** on Agrawal ji's listing: "This chat does not work as expected... no way for users to communicate".
  - **What was wrong:**
    - the chat box only cleared itself (`ListingView.svelte`, the prototype's decorative form), though the live source has `message` and the Negotiator answers it;
    - Accept read "pay ₹0 token", as the award's token exists only once accepted;
    - the buyer's bubble showed "?": his member was named "Agrawal ji" for its organisation, since hydrate's live build never updated the organisation of a member the story's import had made.
  - **The fix:**
    - the box sends in the live workspace; the prototype and the guided demo keep their decorative box;
    - Accept's token is worked out from the counter as money.js's `award` does (₹1,644 on 772 at ₹14.20);
    - hydrate sets an existing member's organisation from the reference data. A database built before it needs a `--live-only` hydrate to correct the buyer's.
  - **Checks:**
    - backend-api 454 passed (1 new);
    - the frontend gate passes: workspace 50 (1 new: the message sent, the token, the buyer's face, which fails on the old data), core 248, api 77, admin 17, demo 5, console 3;
    - the live fixtures were regenerated;
    - the browser suites were not run.
- **SC-93** (PR #77, merged): the day-7 shelf check is gone, from the product and the prototype.
  - **The request:** "remove the Shelf Check at distributor level, that feature is not needed". Asked how far: the product and the prototype.
  - **Gone:**
    - **backend-api:** the `shelf.due` timer, the shelf-check step and its `/internal` route, the DMS shelf file, the shelf wording, the case's `shelf` in the views. The report waits for the papers and the van round only, and its timer is set when the papers are drafted (the return window, as before; SC-94 moves it).
    - **agents:** Outreach's shelf pipeline; the Data agent's shelf kind, its layout, prompt and loads. The Data agent's eval set drops its six shelf cases (19 now).
    - **The console:** the trigger row (design3 `console.jsx`, `platform.js`, the port).
    - **The workspace:** the Shelf check card on Execution and the van screen, the live projection's shelf, `Shelf` in core and in the contract.
    - **design3 and the guided demo:** the day-7 beat, the stub flow's step, and the story data and pushes that served it.
  - **Kept:** a batch's godown shelf (B4, on the label photo) and shelf life; the story documents in `docs/`; BigQuery's `shelf_counts` table, unused; the `cases.shelf` column, unused, with no migration to drop it.
  - **A journey started before:** its pending `shelf.due` timer is put away by the tick, sending nothing (`tick.KINDS`); the console lists only the timers a journey sets.
  - **Checks:**
    - backend-api 454 passed (1 new: an old shelf timer put away unsent);
    - agents 190 passed;
    - the frontend gate passes: core 248 (6 goldens updated, each only losing the shelf card, its feed line or its push), api 77, workspace 50, admin 17, demo 5, console 3;
    - the live fixtures were regenerated;
    - the browser suites were not run.
- **SC-94** (PR #78, merged): Report now is expiry day, and the packs left at the godown settle by the client's expiry policy.
  - **The request:** "Impact report is not running even on clicking report now"; food left at the godown should follow full credit or price support, "as per client setting"; Report now "should be treated as Food is being expired and full journey should be realized and completed". The maintainer's answers:
    - price support only: the gap is paid, and the stock stays with the distributor, who destroys it;
    - Report now closes the journey as it stands;
    - the report falls due at best-before.
  - **Why Report now did nothing:** the report's timer was ready only once the case was settled and the van round done, which a batch with packs left never reached.
  - **Expiry day** (`steps.expire`, run by Report now and by the report's timer; migration `0008`, `cases.expired_at`):
    - open lines close as they stand: orders placed, an accepted lot, a recorded staff sale and a confirmed pickup count, and the rest expires at the godown;
    - the papers follow, drafted then if they weren't yet;
    - Impact's report settles the packs left by `clients.expiry` (Munchly: full credit).
  - **The settlement** (money.js `expirySettlement`, `domain/money.py`):
    - full credit: the packs come back for the dealer price, and the client destroys them, paying disposal and EPR and reversing the GST credit;
    - price support only: the distributor is paid the gap to the dealer price, and destroys them;
    - no returns: the distributor's loss.
  - **The paper:** an "Expiry credit note", "Price support at expiry" or "Expiry notice", numbered from the credit-note sequence when there is a credit. The destruction certificate counts the packs the client destroys, the GST memo reverses their credit, the ledger carries the settlement, and the closing push says how it settled.
  - **The report's timer** is set at approval, due at best-before (10:00), and fires once a plan is approved. The console's trigger reads "Expiry day · report" and asks "Expire it and report now?".
  - **Design first:** three options on one board in app v3, `SC-94 design review.html`:
    - A, the card settles (recommended);
    - B, a settlement card;
    - C, on the paper only.

    The maintainer picked **B**, and added a dealer price of ₹14.50 for the Mango Drink (fictional, at the chips' ratio to MRP). Designs, stills and the decision are in `design3/designs/SC-94/`.
  - **The build:** the Expiry settlement card after "Left at the godown" on Execution (the policy, the credit, who destroys the packs, the client's other costs, the sentence, Open the paper); Paperwork opens on the expiry paper. design3 first (`brand.jsx`, `finance.jsx`), then core (`ExpirySettlement.svelte`, `Paper.svelte`, `Paperwork.svelte`); the contract gains `CaseDetail.expiry` and the paper's fields.
  - **Found on the way:**
    - Who keeps what and You end whole added the plan's gross for each line, not what each line took. Both now read the credit note's rows and add the expiry settlement; the story's figures are unchanged.
    - A distributor is not sent the plan, so its You end whole had no lines and the batch's 2,000 packs; it now works from the credit note's rows.
    - design3's Paperwork had lost its sheet's state to a comment.
  - **Known gap:** Who keeps what's caption ("the same swing as the ledger") holds for the chips; for the Mango Drink, Munchly's cash view leaves out the food bank's costs, about ₹61 apart, as before.
  - **Checks:**
    - backend-api 465 passed (11 new: expiry day, each policy, the timer, the Mango's papers);
    - agents 190 passed;
    - the frontend gate passes: workspace 55 (5 new: the card, the paper, Who keeps what, You end whole, none on the chips), core 248 (goldens unchanged), api 77, admin 17, demo 5, console 3;
    - the live fixtures were regenerated;
    - the browser suites were not run.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-95** (In Review, branch `SC-95-munchly-chips-e2e`): Munchly Chips E2E, a recorded browser suite over the live journey of the Masala Chips batch, asked for by the maintainer.
  - **The suite:** `corepack pnpm test:journey` from `frontend/` (`frontend/workspace/tests/journey/`, `playwright.journey.config.ts`). From a console Reset journey to Impact's report, every person acts in the real UI in turn:
    - Neha in the console;
    - Priya (Supply Chain);
    - Rakesh (distributor);
    - each of the 31 ordering kiranas;
    - Agrawal Wholesale on ExpireSoon;
    - Anita (Finance);
    - Vikram (ESG).

    One page drives everyone, so a run is one recording, with a caption naming who acts. It runs on request only (SC-55; the `ask-before-suites` hook asks on `test:journey`), on the live stack: backend-api, the agents' worker, and the workspace and console dev servers. `E2E_FROM` and `E2E_UNTIL` run part of it; `--headed` and `E2E_SLOWMO` let it be watched; `--ui` steps through it.
  - **Signing in without a password:** `backend-api/scripts/sessions.sh` (`sc_api/cli/sessions.py`) mints Firebase custom tokens as sc-api-local, as walk.sh does. The suite exchanges each with the app's own key and leaves the session where the app's Firebase SDK keeps it, from a bare page it serves on the app's origin. The sign-in form is not exercised.
  - **What a run keeps:** the video, a still for each step, and `report.md`/`report.json` with the steps, the figures against the story, and the findings. Findings are page errors, failed API calls, figures off the story, and any NaN, undefined or Invalid Date on screen.
  - **The run of 8 Oct** (`frontend/workspace/tests/journey/runs/2026-10-08/REPORT.md`; the recording stays local): passed in 5 min 56 s, 65 steps, headed.
    - The plan: ₹21,770.
    - The kiranas: 31 of 38 ordered 588.
    - ExpireSoon: 772 awarded at ₹14.20, with a ₹1,644 token.
    - The papers: INV/26-27/0931, CN/0117 and the GST ITC memo.
    - The close: Impact posted the ledger, the batch cleared, actual ₹21,152.40, nothing left at the godown.
    - Findings, not fixed:
      - the buyer's Lot won bill shows ₹NaN and "IGST undefined%" until the invoice is drafted;
      - the van round reads Monday on its card, Saturday in its push and Friday once run (`views._moments` dates it from the offer's scheduled close);
      - the chips' FSSAI checklist names the chips as donated, 0 packs;
      - "₹0 if destroyed" on the Command Center before the Valuer prices;
      - the invoice reads "drafted" for Finance after Rakesh issues it, as in the prototype.
  - **Checks:** backend-api 467 passed (2 new); the frontend gate passes (core 248, api 77, workspace 55, admin 17, demo 5, console 3).
- **SC-96** (In Review, branch `SC-96-lot-won-bill`, stacked on SC-95; bug found by Munchly Chips E2E): ExpireSoon's Lot won bill read ₹NaN and "IGST undefined%" from the award until Paperwork drafted the invoice.
  - **The cause:** before the papers, the live projection's invoice was a placeholder with no figures.
  - **The fix:**
    - backend-api's award carries its invoice (`award.invoice`: taxable, IGST, rate, round-off, total) from money.py's new `invoice()`, which `documents()` now drafts the paper from, so the bill and the paper agree;
    - the contract's `WsAward.invoice`;
    - the projection falls back to it until the paper exists.
  - **Checks:**
    - backend-api 467 passed; the story's journey test checks the buyer's bill before the papers, and that the paper matches it;
    - the frontend gate passes, with workspace at 56: a new live test draws the Lot won bill before the papers, and fails without the fix;
    - the live fixtures were regenerated.
- **SC-100** (In Review, branch `SC-100-paper-pdfs`, stacked on SC-96; bug): the papers' PDFs on a Mac, and every paper keeping its PDF.
  - **The request:** "install pango and have pdf generated on mac and push it to cloud store".
  - **Pango:** Pango 1.58.2 was installed with Homebrew. WeasyPrint loads it with no further setting, so the local Paperwork agent renders the PDFs into `gs://aibuilder-510213-sc-docs-local/{client}/{ref}/{doc}.pdf`. `agents/scripts/dev.sh` says so as it starts when Pango is missing. AGENTS.md and the agents' README say how.
  - **The bug it found:** a paper never kept its PDF, in production too.
    - `steps.document_pdf` set `pdf` on the stored dicts in place, then assigned back an equal list, so SQLAlchemy wrote nothing.
    - Every paper read `pdf: false`, and the documents link answered 404.
    - It now writes a new dict for the paper.
  - **Verified locally:**
    - a reset journey walked to its papers (`walk.sh --day-minutes 60`);
    - six PDFs in the bucket: the chips' invoice, credit note and ITC memo, and the Mango Drink's credit note, ITC memo and FSSAI checklist;
    - each paper reads `pdf: true`;
    - the signed link serves the ITC memo as `application/pdf`;
    - the invoice PDF reads INV/26-27/0931, 772 × ₹14.20, IGST ₹548, total ₹11,510.
  - **Checks:**
    - backend-api 467 passed; the story's journey test records the invoice's PDF and opens its link, and fails without the fix;
    - agents 191 passed (the PDF test now renders).
- **SC-97** (In Review, branch `SC-97-van-round-day`, stacked on SC-100; bug found by Munchly Chips E2E): one day for the van round.
  - **Found:** Rakesh's Van route read "Monday round", its push "Van route for Saturday", and the timeline, once run, "Ran the Friday round".
  - **The causes:**
    - the card dated the round from the offer's scheduled close, 48 hours on, even when the scheme filled early;
    - the push used the day after the papers;
    - the timeline used the day it ran.
  - **The rule** (`domain/journey.py` `van_leaves`): at the client's van hour (`world.van_time`), on the first morning after the scheme closed and after the papers were drafted, whichever is later, since the van runs only once the batch is settled. Before the scheme closes, it is the morning after its window would. It is the story's own: filled on Friday, papers on Monday, the Tuesday round. The Van route, the push and the timeline all read it.
  - **Checks:**
    - backend-api 468 passed: a new unit test of the rule; the story's journey test checks the card, the push and the timeline agree, and fails without the fix (Mon 5 Oct for Sat 3 Oct);
    - workspace 56 passed on the regenerated live fixtures.
- **SC-98** (In Review, branch `SC-98-fssai-paper`, stacked on SC-97; bug found by Munchly Chips E2E): the FSSAI checklist of a batch with no donation.
  - **Found:** on the live workspace, the chips' "not required" paper read "The Masala Chips batch MF-2409-117 has its own checklist: 0 packs to Feeding India, Nagpur".
  - **The cause:** the sentence pointing at the donated batch fell back to the batch itself.
  - **The fix** (`Paper.svelte`): it points at another batch only when that batch was donated. The prototype and the stub, where the Mango Drink is, read as before (core's goldens unchanged), so design3 needs no change.
  - **Checks:** core 248 passed; workspace 57 (1 new: Anita's chips paper on the cleared moment, which fails without the fix).
- **SC-99** (In Review, branch `SC-99-write-off-before-plan`, stacked on SC-98; bug found by Munchly Chips E2E): the Command Center's "if destroyed" before the plan.
  - **Found:** from Detect until the Valuer priced the batch, the live card read "₹0 if destroyed · 1,360 units at risk". The prototype shows −₹26,330 there.
  - **The cause:** the live projection used an empty plan until there was one.
  - **The fix:**
    - backend-api's case carries `writeOff`, money.py's write-off of the Watcher's at-risk packs, from Detect on, for those who may see Munchly's figures;
    - the contract's `CaseDetail.writeOff`;
    - the projection's plan carries it until the plan exists.
  - **Checks:**
    - backend-api 468 passed; the story's journey test checks −₹26,329.60 at Detect, nothing for a partner, and the same write-off in the plan;
    - the frontend gate passes, with workspace at 58: a new live test draws the card at Detect, and fails without the fix;
    - the live fixtures were regenerated.
- **SC-101** (In Review, branch `SC-101-munchly-chips-rerun`): Munchly Chips E2E run again after SC-96 to SC-100, and the old run's stills and recording cleaned up, asked for by the maintainer.
  - **The suite** now checks each fix as it goes:
    - −₹26,330 if destroyed at Detect;
    - the Lot won bill's total of ₹11,510.00;
    - the invoice, credit note and ITC memo each with its PDF;
    - one day for the van round on the Van route, in its push and in the timeline;
    - the FSSAI paper naming no batch as donated.
  - **The run** (`frontend/workspace/tests/journey/runs/2026-10-08/REPORT.md`, replacing the earlier run's report, stills and recording): passed in 6 min 41 s, 65 steps, headed, on `main`.
    - Every figure is as the story has it, and every fix holds in the real UI: the Saturday round in all three places, the PDFs rendered on this Mac.
    - The only finding left is the note that Finance reads the invoice as "drafted" after Rakesh issues it, as in the prototype.
  - **Cleaned up:** the earlier runs' git-ignored output (`test-results/journey`, `playwright-report-journey`, about 1.1 GB) and the old run's 17 stills and recording.
- **SC-102** (In Review, branch `SC-102-batch-status`, stacked on SC-101; bug found by the maintainer): Batches showed a cleared batch as At risk unless it was the batch in focus.
  - **Found:** as Anita, after the chips cleared while the Mango Drink was still open, the chips read "At risk" on Batches.
  - **The cause:** the live projection's `batchOf` dropped each batch's journey phase, which backend-api's snapshot sends. Only the batch in focus had one, from the case. Anita's batch in focus is the first open case, so every other row fell back to the Watcher's `assess.status`.
  - **The fix:**
    - core's `Batch` gains `journey` (the batch's own phase, where the source knows it);
    - the projection keeps it;
    - `batchViews` reads it for every batch not in focus, so Batches, the Command Center, the distributor's home and the quiet screens all agree.

    The prototype's stub has no per-batch journeys, so it reads as before (core's goldens unchanged). As in the prototype, the At risk column and the gates still show the Watcher's reading.
  - **Checks:**
    - the frontend gate passes, with workspace at 59: a new live test draws Anita's Batches on the cleared moment, and fails without the fix;
    - on the local app, Anita's Batches reads the chips Cleared and the Mango Drink At risk.
- **SC-103** (In Review, branch `SC-103-batch-opens-its-screen`, stacked on SC-102; bug found by the maintainer): on Batches, a batch in a journey opens the screen the person reads a batch on.
  - **Found:** as Anita, clicking the cleared chips on Batches opened the batch sheet, not the papers already processed for it.
  - **The cause:** only the batch in focus opened a screen, and it was always the Route Room. For Finance, RoleApp sent that to her home, Paperwork, without its batch; every other row opened the sheet.
  - **The fix** (design3 `brand.jsx` first, then core): `BATCH_SCREEN` maps each role to its screen.
    - The operator gets the Route Room, Finance the batch's Paperwork, Sustainability its report.
    - A batch in a journey opens that screen with the batch in focus: the batch in focus, or, on the live workspace, any batch with its own journey (SC-102).
    - Any other batch opens its sheet. In the prototype each role lands where it did before.
  - **Checks:**
    - the frontend gate passes, with workspace at 60: a new live test clicks the cleared chips on Batches as Anita (Paperwork) and Vikram (report), checks a batch in no journey stays put, and draws the chips' processed Paperwork; it fails without the fix;
    - on the local app, Anita's click opens `/paperwork/MF-2409-117`, reviewed, with INV/26-27/0931, CN/0117 and the GST ITC memo.
  - **Hosting:** design3's `dist/` is rebuilt.
- **SC-105** (In Review, branch `SC-105-itc-memo`; bug found by Munchly Mango E2E): opening the Mango Drink's GST ITC memo blanked the whole Paperwork screen.
  - **Found:** at Anita's review in the Mango flow's first run, the console read `Cannot read properties of undefined (reading 'toFixed')`, and Paperwork went blank: no further papers, no Mark reviewed.
  - **The cause:** `Paper.svelte` read `c.sku.itcPerUnit`, which only the chips' SKU carries.
  - **The fix:** the memo reads the plan's write-off `itcPerUnit`, the figure backend-api works out for every SKU (₹0.90 for the chips; cost × GST, ₹0.55, for the Mango) and every other screen already reads.
  - **Checks:** the frontend gate passes, with workspace at 61 and core's goldens unchanged. A new live test opens the Mango's memo on the cleared moment and reads ₹0.55 a pack; it fails without the fix with the same TypeError.
- **SC-104** (In Review, branch `SC-104-munchly-mango-e2e`, stacked on SC-105): Munchly Mango E2E, the Mango Drink's live journey from where it stands, asked for by the maintainer ("Dont reset any journey").
  - **The flow** (`munchly-mango.journey.ts`, `corepack pnpm test:journey:mango`):
    - each step reads the case first and is skipped when done; it never resets;
    - Lakshmi Agencies, Priya, each ordering Hyderabad kirana, Meera, Anita, Neha and Vikram act in the real UI;
    - figures are checked against the batch's own plan.

    Each flow has its own Playwright project, so `test:journey` (the chips, which resets) never starts the Mango's. The helpers both flows share moved into `flow.ts`; the chips flow's read-only steps were run after the move.
  - **The run of 9 Oct** (`runs/2026-10-09-mango/REPORT.md`; the 7 min 55 s recording stays local): passed end to end in two parts, from Verify.
    - Part 1 ran to Anita's review, where SC-105 blanked Paperwork. Part 2 ran after the fix, skipped what was done, and went on to the ledger.
    - Plan ₹16,887.70, made on journey day 1: 1,372 to 52 kiranas, 150 to staff, 86 to Feeding India.
    - The scheme filled, the staff sale was recorded, and the donation was collected. CN/0118, the ITC memo and the FSSAI checklist each carry their PDF. The Sunday round ran.
    - Impact posted; actual ₹16,887.70, nothing left at the godown. Batches reads it Cleared and opens its papers.
  - **Findings, not fixed:**
    - the batch's BRSR line reads "0 meals (nothing donated)", and its export 0 donated, for a batch that donated 86 (hard-coded from the chips' story);
    - the evidence line reads "· ·" where a batch with no ExpireSoon line has no invoice or lot;
    - Paperwork's subtitle says "at the award" for a batch with no award;
    - Saraswathi Kirana's story order of 4 cannot be placed in the offer screen (twelves, from 12), so the run ordered 16 for it and 16 for Bilal Stores (28 in the story).
- **SC-106** (In Review, branch `SC-106-brsr-donation`; bug found by Munchly Mango E2E): a batch's BRSR line and BRSR export follow its own donation.
  - **The fix** (`Report.svelte`):
    - the line reads "{meals} meals ({packs} packs donated)" for a batch that donated (the Mango Drink's 86) and "0 meals (nothing donated)" for one that did not (the chips);
    - the export's row splits the diverted kilos into resold and donated, by the SKU's kilos a pack.
  - **design3:** its prototype only ever shows the chips, so its text stays right there.
  - **Checks:** a new live test reads both batches' lines on the cleared moment, and fails without the fix.
- **SC-107** (In Review, branch `SC-107-evidence-line`, stacked on SC-106; bug found by Munchly Mango E2E): a batch's evidence line names only what the batch has.
  - **Found:** it joined an invoice number and an ExpireSoon lot whether or not they existed, so the Mango Drink read "Evidence: · · 52 kirana order logs · CN/0118".
  - **The fix** (`Report.svelte`): the line names only what the batch has: its invoice and lot, its shops' orders, its credit note, and the FSSAI checklist where it donated. The Mango reads "52 kirana order logs · CN/0118 · FSSAI checklist"; the chips are unchanged.
  - **Checks:** a new live test reads both lines on the cleared moment, and fails without the fix.
- **SC-108** (In Review, branch `SC-108-paperwork-subtitle`, stacked on SC-107; bug found by Munchly Mango E2E): Paperwork says "at the award" only for a batch with an award.
  - **Found:** the subtitle read "prepared by the Paperwork agent at the award" for the Mango Drink, which had no award. Before its papers, the waiting card also promised a tax invoice, an e-way bill check and the buyer's truck.
  - **The fix** (`Paperwork.svelte`): a batch with no ExpireSoon line reads "prepared by the Paperwork agent once every line was done". Its waiting card says the pack follows the last of its lines, and lists only the papers it gets. The chips are unchanged.
  - **Checks:** the frontend gate passes, with workspace at 64 and core's goldens unchanged. A new live test reads both subtitles and the Mango's waiting state, and fails without the fix.
- **SC-110** (In Review, branch `SC-110-donation-receipt`): the food bank's donation receipt, a real paper, per food bank.
  - **The request:** "I dont see any receipts in the app for donations....": Meera's pickup said "In-app receipt issued", but no receipt existed. Per food bank, as the Journey Map has it.
  - **Design first:** three options on one board in app v3, `SC-110 design review.html`:
    - A, a paper in the pack (recommended);
    - B, one donation paper;
    - C, a receipts register.

    The maintainer picked **A**, with each food bank's own numbering series, each food bank's own meals rule, and the value kept on India FoodBanking Network's acknowledgement. Designs, stills and the decision are in `design3/designs/SC-110/`.
  - **The paper:** Feeding India issues a Donation receipt (RECEIVED; `FI/{city}/26-27/0417` on; a meal for each pack served). India FoodBanking Network issues a Donation acknowledgement (ACKNOWLEDGED; `IFBN/ACK/26-27/0112` on; a meal for every 400 g), which adds the value at the donor's cost and the CSR activity, and is not a tax certificate. Each food bank's form, series and rule sit in `data.js` `SETUP.partners`, and the series in `world.js` `NUMBERS`. money.js gains `mealsOf`, `receipt`, `realised(…, mealsRule)` and `documents(…, receipt)`, held by fixtures.
  - **Where it shows:**
    - Meera's collected pickup opens it in a sheet, with its PDF once laid out;
    - the batch's pack sets it after the FSSAI checklist;
    - Vikram's BRSR line takes its meals, and the evidence names its number.
  - **backend-api:**
    - collecting issues it in the food bank's series (a confirmed pickup on expiry day too), kept on the donation, with the audit line naming it;
    - `journey.step receipt` asks Paperwork for its PDF at once, and the pack carries it with its own day and PDF;
    - the ledger counts the food bank's meals;
    - `ws-foodbank` gains `docs.read` for its own receipt.
  - **agents:** Paperwork's receipt pipeline and `receipt.html`.
  - **Checks:**
    - backend-api 489 passed (money fixtures, the receipt end to end, a food bank's own meals rule);
    - agents 193 passed;
    - the frontend gate passes: core 249 (a golden of the collected pickup and its receipt), api 77, workspace 66 (2 new live tests), admin 17, demo 5, console 3;
    - the live fixtures were regenerated;
    - design3's sheet was shot in the prototype, and both PDFs were rendered with WeasyPrint;
    - the browser suites were not run.
  - **Locally:** a database hydrated before SC-110 has no receipt series or meals rules until `hydrate.sh --live-only`, which restarts the journey. Until then collecting issues no receipt, and Meera's pickup says so.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-111** (In Review, branch `SC-111-hero-story-film`): the hero film tells the journey through one surreal day.
  - **The request:** the film should tell the story: brands and distributors, the donation, the kiranas and the staff sale, the tax savings; 10 to 15 s, engaging, the day-to-night-to-day light with the violet sky kept and the night more visible; LTX, Qwen and ffmpeg.
  - **Design first:** three options on one board in platform v3, `SC-111 design review.html`, each a complete hero on the real kit with its clips rendered:
    - A, One town, four acts (recommended);
    - B, Follow the carton;
    - C, One flight.

    The maintainer picked **A**. Designs, plates, clips, stills, recordings and the decision are in `design3/designs/SC-111/`.
  - **The film:** one day in four acts, 14.2 s, looping without a cut: sunrise at the factory's bay (the brand and the distributor shake hands); a high sun at the community kitchen (the van's cartons to the food bank); a violet dusk at the kirana lane and the staff-sale table; an indigo-violet night in the office (Paperwork), then dawn. Four plates edited from the approved town plate by Qwen so the geometry holds (`site/assets/plates/town-*.webp`), four 5 s LTX clips conditioned to end on the next plate, chained through quarter-second dissolves and retimed to 32 fps in ffmpeg (`site/assets/media/one-day.mp4`); for the build the four acts were rendered again at 1080p (1920 × 1088, 6.5 MB), the night act twice more until it held about 2.5 s. The light theme starts in the morning, the dark one at the night act.
  - **The hero:** one looping player; the strip reads the four chapters (`CHAPTERS`, every figure money.js's); the page's camera leans in 1.5× on each act's place, as far as the player's box allows; the film drifts with the scroll; Pause and Play; under reduced motion the plate and the last chapter. The loader preloads the film's posters.
  - **Found on the way:** LTX's last-frame conditioning lands near a plate, not on it, so chained clips need a short dissolve; LTX hurries out of the night unless told to hold it (the night act was rendered twice); python's `http.server` serves no byte ranges, so a film cannot seek locally and the dark theme's night start looked broken in every capture until design3 was served with `npx http-server`; the page's camera can only move as far as its scale allows, since `object-fit` crops inside the player's box.
  - **The port** (`frontend/admin`): `Hero.svelte` (one player, the chapters' clock, the lean on motion's `animate`), `figures.ts` (`story`), `media.ts` (the film and its chapters' starts), `plates.ts` (the posters), `site.css` verbatim; the keyboard spec follows the loop and the chapters, the loader spec the posters. `business.webp`, `business-night.webp` and `business-depth.webp` are retired.
  - **Checks:** the gate passes (lint, check, tests: core 248, api 77, admin 17, console 3, workspace 64, demo 5). design3 and the build were played through with Playwright at 1440 × 900 and 390 × 844, light and dark: no console errors, the film plays and loops, the strip reads the chapter, the dark theme opens on the night. The browser suites were not run (SC-55).
  - **Hosting:** the hosted landing page and console load commit `9e0a247`.

- **SC-112** (In Review, branch `SC-112-batch-first-nav`): the workspace app, batch first. The operator reads the workspace top down: its own places, then a batch, then the batch's screens.
  - **The request:** "The design of the individual pages are perfect, no change is needed. The navigability seems a bit odd, everything starts from monitoring of a batch which can be in different states. I need a top down approach starting with batch as the 1st point."
  - **Design first:** three options on one board in app v3, `SC-112 design review.html`, each the app itself with only the navigation changed:
    - A, the batch page (recommended);
    - B, the batch rail;
    - C, the stops lead.

    The maintainer picked **A**, for the operator only for now, with a batch in no journey opening its own page. Designs, stills, clips and the decision are in `design3/designs/SC-112/`.
  - **The sidebar:** Command Center, Batches, Setup, then "In a journey · n", each batch by its pack, name and stop (amber while it waits for a yes), then Reports. Route Room and Execution leave it; the phone's tab bar is Today, Batches, Reports. The kit's `Shell` draws a nav item with a `product` as a batch.
  - **The batch's page:** one head for every screen of a batch (the pack, name, id, distributor, state, the live line) with its screens as tabs: Journey, Route Room, Execution, Paperwork. The dot marks where it stands; each screen keeps its own body and its own line under the tabs. Journey is new: the batch's tracker card, cluster and agents; a batch in no journey shows what the Watcher sees of it. A batch opens on the screen for its stop, from the Command Center (busy and quiet), Batches and the sidebar. Back goes to where it was opened from. Addresses stay `/<screen>/<batch>`.
  - **The port:** `Shell.svelte`, `RoleApp.svelte`, `Screen.svelte`, `context.ts` (`provideBatchFrame`), `model.ts` (`BATCH_PARTS`, `journeysOf`, `partAt`), new `BatchHead`, `BatchJourney` and `BatchFacts`; `CommandCenter`, `CommandQuiet`, `Batches` and `RouteRoom` follow; `components.css` and `screens.css` verbatim. Finance and Sustainability are unchanged.
  - **Checks:** the frontend gate passes (core 249, api 77, workspace 66, admin 17, demo 5, console 3); the operator's goldens were updated (the sidebar, the head, the tabs); the workspace live tests follow the batch page (watched batches open their Journey). design3 and the port were checked side by side on the stub at 1440, 820 and 390, light and dark, with no console errors. The e2e and a11y specs follow (a scan of a batch's Journey and a watched batch is added); the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt; the hosted app page stays on its pinned commit.
- **SC-114** (In Review, branch `SC-114-receipt-on-reset`; bug found by Munchly Mango E2E): a workspace built before SC-110 never issued a donation receipt.
  - **Found:** Meera collected the Mango Drink's 58 packs, and no receipt was issued. The local database's food banks had no receipt form or meals rule, and the workspace numbered no `receipt.*` series. Only `hydrate.sh --live-only` set them, and it restarts the journey; production, last hydrated in SC-75, is the same.
  - **The fix** (`services/journey/reset.py` `_story`): a synthetic workspace's Reset journey also gives it what the story has and it lacks, keeping what it set itself:
    - each number series the story numbers (the food banks' receipts among them);
    - each of the story's food banks' receipt form and meals rule.

    The console's Reset journey (or `hydrate.sh --journey-reset`) now brings a workspace from before SC-110 up to date, locally and in production, with no separate hydrate.
  - **Checks:** backend-api 490 passed. The new test fails without the fix, with the receipt series missing.
  - **Locally:** Munchly's journey was reset with the fix; both food banks have their receipt and the two series are numbered from the story's.

- **SC-113** (bug in Munchly Mango E2E): the donation step read Munchly's plan as the food bank, who is not shown it, and stopped right after the collection with "Cannot read properties of null (reading 'lines')". It now awaits the collection as Meera and reads the planned food-bank packs from Priya's case (`munchly-mango.journey.ts`). Lint and the workspace type check pass; the suite was not rerun (SC-55).

- **SC-115** (PR #98, merged; bug in Munchly Mango E2E): the papers step predated SC-110's donation receipt.
  - **Found:** the run of 9 Oct (10:42 UTC) took the Mango Drink from its label photo to Vikram's ESG report in 7 min 15 s, but failed one soft check: "Papers with their PDF" read `support, itc, receipt` where it expected `support, itc, fssai`.
  - **The cause:** the step waited for any three PDFs. The receipt's is asked for as soon as Meera collects, so it landed before the FSSAI checklist's. At Anita's review, a minute later, all four papers carried their PDF.
  - **The fix** (`munchly-mango.journey.ts`): the step waits until every paper that is not "not required" has its PDF, and expects `support, itc, fssai, receipt`.
  - **The rest of the run:**
    - plan and actual ₹16,917.10, nothing left at the godown;
    - 52 kiranas ordered 1,372 (Saraswathi Kirana and Bilal Stores 16 each, as before);
    - CN/0117 and FI/HYD/26-27/0417, the receipt issued on a reset workspace (SC-114);
    - the Saturday round in the push and the timeline.

    The Mango was brought to Detect first with `walk.sh --day-minutes 60 --until detect`, since this suite never resets.
  - **Checks:** lint, Prettier and the workspace type check pass; the suite was not rerun (SC-55).

- **SC-116** (PR #99, merged): Munchly Chips Leftover E2E, a separate suite, asked for by the maintainer.
  - **The request:** "execute Munchly Chips E2E in such a way that some kiranas will not buy and food will be left over at go down, and batch will be forced completed from console by clicking generated report which will show that", then "make this a separate suite".
  - **The suite** (`munchly-chips-leftover.journey.ts`, its own Playwright project, `corepack pnpm test:journey:leftover`; it resets the journey):
    - `E2E_LEFTOVER` (8) of Rakesh's 31 ordering kiranas open the scheme and place no order, so it never fills;
    - Agrawal Wholesale takes the ExpireSoon lot. There is no truck: backend-api loads it only once the scheme has closed, and on expiry day the accepted lot counts as collected;
    - Neha fires Report now in the console, which closes the batch as it stands (SC-94);
    - then it reads back Anita's pack (the Expiry credit note first), Priya's Left at the godown and Expiry settlement and the paper they open, and Vikram's report;
    - figures are checked against the run's own shortfall.
  - **Shared steps:** the chips' steps moved unchanged into `chips.ts`. Munchly Chips E2E runs them as before, and the leftover suite takes those up to the scheme and the deal. `flow.ts` gains `Step`, `running()` and the case's `expiry`.
  - **The run of 9 Oct** (`runs/2026-10-09-leftover/REPORT.md`, the 6 min recording local): passed in 6 min 0 s, 67 steps, headed, on the fourth run (the first three stopped on the suite: the truck, a check's case, SC-117).
    - 23 kiranas ordered 444 of 588 packets, and 144 were left at Kalamna Market godown.
    - Agrawal took 772 at ₹14.20.
    - Net ₹18,632.40 of the ₹21,770 planned.
    - Full credit: Expiry credit note CN/0118, ₹3,168 to Rakesh Traders, Munchly destroying the packs (disposal, EPR and GST reversed, ₹484), and a destruction certificate for 144 units.
  - **Noted, not filed:** "Load the buyer's truck" is offered while the scheme is open and refused only once pressed; Impact's ledger line reads "The return window closed on 29 Oct" for a report fired on 2 Oct.
  - **Checks:** lint, Prettier and the workspace type check pass; each journey project lists only its own suite.

- **SC-117** (In Review, branch `SC-117-review-cleared-pack`; bug found by Munchly Chips Leftover E2E): a pack drafted on expiry day is reviewed and its invoice issued once cleared.
  - **Found:** Report now drafts the papers and clears the batch at once, so there was never an open case to review. Paperwork still offered Mark reviewed, and backend-api answered 404, "No such batch in a journey". Rakesh's "Issue from Tally" was the same.
  - **The cause:** `steps.scene` took only an open case, though the review guard allows `cleared`.
  - **The fix** (the maintainer's "fix SC-117"; option 1, as the guard intends): `scene(…, cleared=True)` takes the batch's case in this journey, open or the last one closed, as the workspace shows it. The review and the invoice issue use it; every other step still needs an open case.
  - **Checks:** backend-api 491 passed, 1 skipped. The new test (`test_controls.py`) takes the leftover run's shape (an awarded lot, a short scheme, Report now): Anita reviews and Rakesh issues his invoice on the cleared batch, each with its audit line. It fails without the fix, with the 404.
  - **Locally:** the dev API reloads, so the chips batch the leftover run cleared can be reviewed now.

- **SC-118** (In Review, branch `SC-118-truck-waits-for-scheme`, stacked on SC-117; bug found by Munchly Chips Leftover E2E): Rakesh's Van route says the truck waits for the kirana scheme.
  - **Found:** with the lot won and the scheme still open, "Load the buyer's truck" was a live button, refused only once pressed ("That didn't go through. The kirana scheme is still open until 04 Oct, 08:36.").
  - **The fix** (design3 `trade.jsx` first, then core's `VanInner.svelte`): as "Load after the award" does before the award, the button is disabled and reads "Load once the scheme closes" while the scheme is open. The scheme is over once it is closed, or once every kirana has ordered (the stub never closes it).
  - **Checks:** the frontend gate passes (core 249 with goldens unchanged, api 77, workspace 67, admin 17, demo 5, console 3). A new live test draws Rakesh's Van route with the lot won and the scheme open, then closed, and fails without the fix. design3's `dist/` is rebuilt.

- **SC-119** (In Review, branch `SC-119-ledger-line-early-report`, stacked on SC-118; bug found by Munchly Chips Leftover E2E): Impact's ledger line says when expiry day came early.
  - **Found:** Neha fired Report now on journey day 0 (2 Oct), and the timeline read "The return window closed on 29 Oct. Posted the ledger: …".
  - **The fix** (`copy.ledger_event`, given the day the report posts): a report posted before the return window closes reads "Expiry day called on 2 Oct, before the return window would close on 29 Oct. Posted the ledger: …". A report on or after that day keeps the story's line, so the fixtures are unchanged.
  - **Checks:** backend-api 492 passed, 1 skipped. A copy test covers both lines, and the Report now test reads the early one; it fails without the fix.

- **SC-120** (epic): Finance & ESG on real data, batch based, live, with a history of cleared batches.
  - **The request (9 Oct):** "redesign the finance and ESG view. It should be batch based, calculations looks off for ITC and others, the dashboard for ESG and finance should live and based on real data", with past batches cleared with mixed outcomes and their GST and tax papers completed.
  - **The maintainer's answers:**
    - Munchly has been live since 1 Jul 2026, and its pilot quarter (Q2 FY27) holds 12 cleared batches: 7 sold through, 3 left at the godown at full credit, 2 donated;
    - the six SKUs without a cost sheet are priced at the chips' ratios;
    - the full-credit expiry note stays without GST;
    - the Mango Drink's input GST stays ₹0.55, labelled estimated;
    - Priya gets the same design.
  - **The stories:** SC-121 (the design, then its build), SC-122 (the figures), SC-123 (the history), SC-124 (the live figures), stacked in the order SC-122, SC-123, SC-124, SC-121.
- **SC-121** (In Review, branch `SC-121-finance-esg-redesign`, stacked on SC-124): Finance & ESG, one ledger (option A), designed then built.
  - **Design first:** three options on one board in app v3, `SC-121 design review.html`:
    - A, one ledger;
    - B, close the quarter;
    - C, the year as a timeline.

    The maintainer picked **A**, with Paperwork as it is (the batch's Papers tab), invoices and receipts as downloadable PDFs, the BRSR export and the reports, and every figure at batch, quarter and year level. Designs, the history's figures and the decision are in `design3/designs/SC-121/`.
  - **The ledger** (design3 `screens/finance.jsx`, then core `screens/finance/`), Finance's and ESG's home and the operator's Reports:
    - the period: each quarter from the first batch cleared to today's, and the year so far;
    - three readings of one ledger, Money, GST and Impact. Anita opens on GST, Vikram on Impact, Priya on Money;
    - the period's figure with its working (recovered against the would-be write-off; credit kept and reversed under s.17(5)(h), the invoices and credit notes; kilos resold, donated and destroyed, CO₂e, meals);
    - the period drawn as its batches, one segment a batch as wide as its figure, the bin hatched;
    - the batches still out;
    - the batches by month, each opening its page.
  - **Exports**, for the period chosen: the BRSR table, the GST summary and the ledger as CSV, and the report printed to a PDF.
  - **A batch's page:** SC-112's head, with three tabs:
    - Money: what each channel took and came to, the van and fee, the credit given away, what destroying it would have cost, and Munchly's credit notes and the distributor's invoice;
    - Papers: Paperwork as it is (`PaperPack`), each paper with **Download PDF**. On the live workspace this is the Paperwork agent's own PDF, from a five-minute link; on the stub it is the paper printed;
    - Impact: the BRSR line with its evidence, and where the kilos went.

    Anita opens a page on its papers, Vikram on its impact.
  - **Navigation:** Finance and ESG have Ledger and Batches; Batches opens a batch's page; `paperwork` stays for the pushes and the guided demo, opening the batch's papers.
  - **design3's ledger** (`core/ledger.js`, bundled into `dist/sc3-core.js` with `core/world.js`):
    - each history batch's case, its papers numbered and dated as backend-api's history issues them, and the kiranas' orders placed as it places them;
    - the rows and periods. seed.mjs writes them for core's stub (`seed/history.json`) and for backend-api (`journey.json` `history.ledger`).

    backend-api's `ledger.py` is held to them period by period and batch by batch, and core's stub ledger at stages 0, 6 and 9.
  - **The live workspace:**
    - the ledger is backend-api's (SC-124);
    - a batch's page is read on its own (`openPage`, `ledgerPage`) and again when its batch changes;
    - every paper keeps its PDF flag (only the receipt's was projected);
    - `documentUrl` takes the batch.
  - **Found on the way:**
    - the snapshot listed the history's 12 cleared cases among the batches in a journey, so the live workspace would have put a history batch in focus and its tabs on the tracker; the history is now on Batches and in the ledger only;
    - the expiry credit note had no PDF: Paperwork now lays it out (`expiry_note.html`), asked for as the packs settle;
    - "Munchly Foods's own costs" on the expiry paper.
  - **Gone:** the constant quarter (`WsQuarter`, core's `Quarter`, `/quarter`, data.js `QUARTER` in the workspace seed), the old Report and `Lakh`. BRSR's plastic packaging row is not modelled (no packaging weight per SKU).
  - **Checks:**
    - backend-api 515 passed, 1 skipped; agents 195 passed;
    - the frontend gate passes (core 254, api 77, workspace 70, admin 17, demo 5, console 3). The goldens follow the Ledger and the batch page;
    - new live tests: each role's reading, a paper's PDF from its link, the live ledger and a batch's page;
    - design3 and the port were checked in the browser: Anita, Vikram and Priya at 1440, a phone in light, the exports and PDFs captured, and the guided demo's stages 8 and 9 on the port;
    - the a11y, e2e and journey specs follow the new screens; the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-122** (In Review, branch `SC-122-realised-figures`): the figures follow what happened.
  - **Found by the audit of 9 Oct:**
    - after the leftover run the screens read the plan: ₹1,224 kept and 217.6 kg, where the ledger has ₹1,094.40 and 194.56 kg;
    - the ITC memo was stamped "ITC KEPT" with nothing reversed, and the destruction certificate counted 0;
    - `realised` left the packs left at the godown out of the ITC reversal and kept the plan's costs avoided;
    - the ledger's lines carried the plan's ExpireSoon price, and a batch with no lot had no swing;
    - "Better for Munchly" left out a donation's own costs (₹60.90 on the Mango Drink).
  - **The rules** (money.js and money.py, held by fixtures):
    - `realised(…, policy)`: under full credit the client destroys the packs that came back, so their credit is reversed and the costs avoided leave them out; under price support or no returns the distributor destroys his own, and the client keeps its credit;
    - `destroyed` counts what the client destroys;
    - `actualNet` always gives a swing and a P&L;
    - `documents`: the ITC memo carries `reversed`, the packs sold and those given away or destroyed, and says so; the destruction certificate counts what the client destroys.
  - **backend-api:**
    - `steps.realised` and the case view pass the client's expiry policy;
    - the ledger carries `swing`, `pnl`, `itcReversed` and `destroyed`, its lines with the ExpireSoon lot at its award price (`atAward`), adding up to the net;
    - the expiry settlement brings the drafted memo and certificate up to date.
  - **agents:** Impact takes a line at its award price as it is.
  - **The papers** (design3 first, then core):
    - the memo reads the paper's own figures, stamps "ITC PART REVERSED" when credit was reversed, and says an SKU without a cost sheet has its credit estimated;
    - the certificate counts the packs destroyed, with their credit reversed;
    - Who keeps what takes a donation's handling and credit off "Better for Munchly", so it is the ledger's swing.
  - **The Negotiator's counter** never goes above the asking price. The reserve is the client's, one price a pack (₹13.50, set for the chips), so on a cheaper lot (the Mango Drink's ₹10, the chikki's ₹12.50) it countered above the ask. On a lot asking less than the reserve, the counter is now the ask (`counter`, money.js and money.py; fixtures for an ask of ₹10).
  - **Checks:**
    - backend-api 505 passed, 1 skipped (a new test of the leftover ledger, and the counter's new cases);
    - agents 194 (a new test of a line at its award price);
    - the frontend gate passes: core 249 (the memo's golden, "Input GST kept"), api 77, workspace 67, admin 17, demo 5, console 3;
    - the live fixtures and the seeds were regenerated.

- **SC-123** (In Review, branch `SC-123-history`, stacked on SC-122): Munchly's history, the twelve batches its workspace cleared in its pilot quarter (Q2 FY27, Jul to Sep 2026), built through the journey's own steps.
  - **design3** (`core/data.js`):
    - Munchly has been live since 1 Jul 2026;
    - the six other SKUs have their cost sheets at the chips' ratios: biscuits ₹29 and ₹1.24, chikki ₹18 and ₹0.73, poha ₹40 and ₹1.74, oats ₹47.50 and ₹2.03, face wash ₹88 and ₹11.75, hair oil ₹110 and ₹4.05. The Mango Drink keeps ₹0.55, estimated;
    - `HISTORY`: the 12 batches (7 sold through, 3 with packs left at the godown at full credit, 2 donated to the first food bank that takes them), each step's day and time (`HISTORY_AT`), what money.js makes of each, and the papers' numbers in the order they were issued, back from the story's: INV/26-27/0921–0930, CN/0102–0116, ES-24107–24116, FI/…/26-27/0415–0416. Every report falls due on the batch's best-before (SC-94), so each clears by 30 Sep.
  - **backend-api:**
    - migration 0009 adds `cases.history` and `batches.history`;
    - `services/journey/history.py` builds each batch at its time through the services: opened, flagged by the Watcher (`detect(…, only=)`, so the story's batches are not judged), the label read, valued, planned, approved by Priya, listed, offered, booked, ordered by the kiranas, the counter taken by Agrawal, collected, the staff sale, the truck, the papers, the invoice issued, the van, reviewed by Anita, expired and reported on its best-before;
    - the agents' part runs in process on backend-api's templates. Nothing reaches a person or an agent (the history's messages marked sent, pushes none, timers fired), except the Paperwork events that lay out its PDFs;
    - `live.build` (hydrate, `--reset` and `--live-only`) builds it once, before the story's reset;
    - the views keep history in view whenever the journey starts again, and Reset journey leaves its batches alone;
    - `documents` and `document_pdf` take a cleared batch's case, so a batch's PDFs land after it cleared (also Report now's race);
    - the history runs at real time (a day a day) whatever the client's day length, so a short day left by a test never hurries it;
    - `hydrate.sh --day-minutes munchly=1440` sets a client's journey day, as the console's control does. The maintainer asked that it go back to 24 hours after every test run (the browser-suites skill and the journey README say so).
  - **Checks:**
    - backend-api 509 passed, 1 skipped; `test_history.py` holds each ledger to money.js's figures, each paper to its number, the story's numbers following on, nothing pending but the PDFs, and the history in view through a reset;
    - the frontend gate passes (goldens: "since 1 Jul 2026");
    - the seeds and live fixtures regenerated.
  - **Locally:** hydrated with the history; all twelve batches cleared to money.js's figures, and the local Paperwork agent laid out every paper's PDF (invoices, credit notes, ITC memos, FSSAI checklists and both receipts). The day is back at 24 hours.
- **SC-124** (In Review, branch `SC-124-live-figures`, stacked on SC-123): Finance & ESG's figures computed live from the cleared batches' ledgers, replacing the story's constant quarter.
  - **Found:** `/quarter` was data.js's `QUARTER` (23 batches, a weekly split, a mix, BRSR rows and 14.25 t of CO₂e, all fixed) plus this journey's ledgers, so the story's chips counted twice and nothing but four totals ever moved. backend-api never told the screens when a ledger posted.
  - **`GET …/ledger`** (`services/journey/ledger.py`, `views.ledger`; `report.read`: the operator, Finance, ESG and the admin):
    - every cleared batch in view (the history and this journey's), as its posted ledger: net, swing, P&L, the write-off it avoided, input credit kept and reversed, kilos resold, donated and destroyed, CO₂e, meals, the expiry credit and the price support, what each channel took, its papers with their numbers and PDFs, and who reviewed it;
    - its outcome: sold through, left at the godown, or donated;
    - the periods: each quarter of the Indian financial year from the first batch cleared to today's (`fy27-q2`, `fy27-q3`), then each year so far (`fy27`, "This year"). Each has its totals, its months, a quarter's 13 weeks, the channel mix in whole percent, and BRSR Principle 6's food-waste row with its evidence counted from the papers. CO₂e is the kilos × the factor;
    - the batches still out, with their stop.
  - **The case detail** carries its batch's ledger row, for Munchly's own staff.
  - **The stream:** a `ledger` event, heard by the roles that read it, when a ledger posts or a cleared batch's papers move on (a review, an invoice, a PDF).
  - **The contract:** `WsLedger` and its parts replace `WsQuarter`; `WorkspaceApi.ledger()`; `CaseDetail.ledger`; the event type `ledger`. `contracts.sh` re-exported the OpenAPI. journey.json drops `quarter`, and the workspace doc no longer carries it.
  - **Until SC-121's build:** the live projection fills today's Finance & ESG screen from the ledger's current quarter once a batch has cleared in it, else the latest quarter that has one (locally, Q2 FY27). The stub keeps data.js's `QUARTER`.
  - **Not modelled:** the SKUs carry no packaging weight, so BRSR's plastic packaging (EPR) row is left out rather than invented.
  - **Checks:**
    - backend-api 514 passed, 1 skipped; `test_ledger.py` (5) holds each history batch to money.js, each period to its batches, the roles, and the case's ledger; the story's journey test sees the chips post into Q3 and the `ledger` event reach Anita and not Rakesh;
    - the frontend gate passes (workspace 68: a live test reads Finance & ESG from the ledger on the cleared moment);
    - the live fixtures regenerated;
    - locally, Munchly's ledger reads Q2 FY27 as 12 batches (7 sold through, 3 left at the godown, 2 donated): ₹2,20,383.58 recovered, ₹15,854.78 of input credit kept and ₹1,981.93 reversed, 1,959.51 kg kept out of landfill, 872 meals, 15 credit notes and 10 invoices.

- **SC-125** (In Review, branch `SC-125-brsr-packaging-and-pdfs`, stacked on SC-121): the two gaps SC-121 to SC-124 left, which the maintainer asked to fix.
  - **BRSR's plastic packaging row:**
    - each SKU carries its plastic packaging, in kg a pack (`packKg` in design3's `data.js`; fictional, indicative): chips 6 g, biscuits 8 g, chikki 4 g, poha 6 g, oats 5 g, the Mango Drink's carton layer and straw 2 g, face wash 12 g, hair oil 20 g;
    - backend-api stores it (migration 0010, `skus.pack_kg`), set by the live build. Reset journey tops up a SKU without one, as SC-114 did for the receipts;
    - each ledger row carries the packaging resold, donated and destroyed, which goes where its pack goes. BRSR's table gains "Plastic packaging (EPR)" in the exports and the printed report: 62.69 kg diverted and 1.23 kg destroyed in Q2 FY27;
    - design3's `ledger.js`, `ledger.py` and core's stub ledger agree, row for row. EPR's money stays on the product's kilos, as money.js has it.
  - **The PDFs a workspace lacks:**
    - `hydrate.sh --papers CLIENT` asks the Paperwork agent for every paper in view, the journey's and the history's, that has no PDF yet; `--again` lays out every paper afresh;
    - Paperwork dated every paper by the day it laid it out, so the history's PDFs read 2 Oct. A paper now carries its own date (`base.html`): the invoice 17 Jul, the expiry credit note 23 Aug, the receipt 30 Jul.
  - **Locally:**
    - the agents' worker was restarted;
    - Munchly's journey was reset at day 0 (no batch was open), which topped up its SKUs;
    - `--papers munchly` laid out the three expiry credit notes, then `--again` relaid all twelve batches' papers with their own dates;
    - the day is 24 hours.
  - **Checks:**
    - backend-api 516 passed, 1 skipped;
    - agents 195 passed;
    - the frontend gate passes (core 254, api 77, workspace 70, admin 17, demo 5, console 3);
    - the live fixtures and the seeds were regenerated;
    - the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-126** (In Review, branch `SC-126-cleared-off-batches`, stacked on SC-125): a batch cleared and past its best-before is in the ledger, not on Batches.
  - **The request:** "The batches which have cleared and are in -ve on days left need not be shown under batches, just aggregated calculations under ledger is enough". The history's twelve batches read Cleared on Batches with −2 to −28 days left, every gate crossed out.
  - **The rule** (backend-api's snapshot, `views.snapshot`): a batch whose journey has cleared and whose best-before has passed leaves the workspace's batches, so Batches and every screen built from them drop it. Its page in the ledger (Money, Papers, Impact) still opens, read from its case. A cleared batch still inside its best-before stays, as the story's chips do. No design changes; design3's stub holds no such batch.
  - **Checks:** backend-api 516 passed, 1 skipped (`test_history.py`: the history out of the snapshot's batches, the story's batches in). The frontend is unchanged. Locally, Anita's Batches lists the story's nine batches; the ledger still has the twelve.

- **SC-127** (In Review, branch `SC-127-one-operator`, stacked on SC-126): one operator. The Finance & GST and Sustainability & BRSR roles go, with Anita and Vikram; Priya reviews the papers and reads the ledger.
  - **The request:** "I dont need Anita and Vikram roles, Priya can do it all". No design round: Priya's screens were already SC-121's (the Ledger in her sidebar under Reports, each batch's page with Money, Papers and Impact) and SC-112's (Paperwork on the batch's page), so nothing new is drawn.
  - **design3** (`data.js`, `world.js`, `flow.js`, `store.js`, `ledger.js`, `roles.jsx`, `brand.jsx`, `finance.jsx`, `admin.jsx`, `live.jsx`, `ds.jsx`, the demo's `director.jsx`):
    - Anita and Vikram leave the people, the explore sheet, the members and the invite sheet's roles; Munchly's staff are Priya and Arjun;
    - the papers' push and the review are Priya's ("Priya reviews Munchly's papers"); the ledger's push goes, and Priya signs off the BRSR row in the audit;
    - the journey's stages name Priya at Settle and Report ("S6 Ledger");
    - Batches is the operator's alone, every row opening its batch's page (SC-112), so the batch sheet goes; what the Watcher sees of a batch stays on a watched batch's Journey;
    - the ledger and a batch's page open on Money for everyone;
    - the guided demo's stage 8 puts the review on Priya's desk, and stage 9 the ledger.
  - **backend-api:**
    - `rbac.json`: `ws-operator` gains `docs.review`; `ws-finance` and `ws-sustainability` go. A role that has gone keeps its row at migrate but none of its permissions, and its members are refused as not members (`views._member`) until a Reset journey takes them out of the workspace;
    - the papers' push goes to the operator; the ledger's push to ESG goes; the ledger's stream reaches the operator and the admin;
    - the history's twelve batches are reviewed by Priya; walk.sh reviews as Priya.
  - **The frontend:** core's roles, the explore sheet, the users and invite sheet, Batches (`BatchSheet.svelte` deleted), the ledger's readings and a batch page's first tab, the demo's stages; the goldens lose Anita's and Vikram's 36 screens and the batch sheet; the workspace's live tests, e2e, a11y and parity specs, and the three journey suites, review as Priya and read the ledger as Priya.
  - **Docs:** PRODUCT.md's users and principles, and the workspace README's roles.
  - **Checks:**
    - backend-api 517 passed, 1 skipped (a new test: a member whose role went is refused; it fails without the guard);
    - the frontend gate passes: core 217, api 77, workspace 67, admin 17, demo 5, console 3;
    - the seeds, the contract and the live fixtures were regenerated; design3's `dist/` is rebuilt;
    - the browser suites were not run (SC-55).
  - **Locally:** `hydrate.sh --reset` rebuilt the world: Munchly's staff are Priya and Arjun, the twelve history batches reviewed by Priya, and the Paperwork agent laid out all 41 of their papers' PDFs. The day is 24 hours.
  - **Production:** Anita and Vikram stay in Munchly's workspace, refused at sign-in once this deploys, until the console's Reset journey (or the hydrate job) takes them out.

- **SC-128** (PR #110, merged): Munchly Chips E2E verifies Priya's tax and ESG, and a recorded run, asked for by the maintainer ("it should include verifying the TAX and ESG by Priya … dont reset the journey leave it as it is. Record the journey for me too").
  - **The suite** (`frontend/workspace/tests/journey/chips.ts`): the old `esg` step expected the ESG reading on opening, which SC-127 changed (Priya's pages open on Money). It is replaced by two steps, after Impact posts:
    - **tax:** the ledger's GST reading for the quarter the batch cleared in; the GST summary she exports, read back as CSV; the batch's GST ITC memo (its stamp, and its PDF fetched from its signed link), the tax invoice and the credit note;
    - **esg:** the ledger's Impact reading; the BRSR table she exports; the batch's BRSR line and its evidence; the year so far.

    Each is held to the ledger row backend-api posted. Munchly Chips E2E also holds them to the story's figures (`CHIPS_TAX_ESG`). Munchly Chips Leftover E2E runs both steps against its own row (not run). The run keeps the exports beside its report (`Run.keep`).
  - **The run of 9 Oct** (`runs/2026-10-09/REPORT.md`, the 8 min 25 s recording local): passed in 8 min 24 s, 70 steps, headed.
    - Every figure is the story's.
    - Tax: ₹1,224 of input GST kept and none reversed, INV/26-27/0931 for ₹11,510, CN/0117 for ₹8,768, the memo stamped ITC KEPT, its PDF served as `application/pdf`, reviewed by Priya.
    - ESG: 217.6 kg kept out of landfill, all resold; 544 kg CO₂e; 8.16 kg of plastic packaging (EPR); the evidence INV/26-27/0931 · ES-24117 · 31 kirana order logs · CN/0117.
    - The year so far: 13 batches, ₹2,41,535.98 recovered.
    - The only finding is the old note: the invoice reads "drafted" in the pack after Rakesh issues it.
    - An earlier attempt stopped on the suite's own selector (the recording's caption also reads "BRSR line"); the step now reads the page only.
  - **The journey is left as the run ended** (the chips cleared, the Mango Drink waiting for its label photo); only the day went back to 24 hours.
  - **Checks:** the frontend gate passes (core 217, api 77, workspace 67, admin 17, demo 5, console 3).

- **SC-130** (PR #112, merged): the partners' portals. Each partner reads its own history with Munchly.
  - **The request:**
    - distributors see each batch, past and present, that was or is at risk, with their GST invoices, credit notes and other finance papers;
    - kiranas see their offers and past orders: accepted, declined or expired;
    - food banks see their past pickups with the donation receipts.
  - **Design first:** three options on one board in app v3, `SC-130 design review.html`:
    - A, batch by batch (recommended);
    - B, one timeline;
    - C, statement and papers.

    The maintainer picked **A**, with the distributor's copies of the food bank's receipt and the destruction certificate, and Not this time kept. Designs, stills, the build's stills and the decision are in `design3/designs/SC-130/`.
  - **The distributor** (Rakesh, Lakshmi):
    - **Batches** joins his sidebar. The label photo leaves the phone's tabs, since it opens from its request.
    - The list: in a journey now; then every batch he cleared, by month, under one figure (what Munchly credited him, ₹66,192 for Rakesh since July, on 8 credit notes); then the stock the Watcher watches.
    - A batch's page has the head and the tabs of SC-112's:
      - **What happened:** each moment with its day and time;
      - **Money:** how he ended whole, ₹0 on every batch, each credit note opening on paper;
      - **Papers:** his own (the tax invoice, the e-way bill check, the price-support and expiry credit notes), then "Copies for your records" (the food bank's receipt, the destruction certificate), each in a sheet with Download PDF. Munchly's GST ITC memo and FSSAI checklist stay Munchly's.
    - His batch in a journey reads its moments as they happen, the next three dimmed. Another distributor's batch is "Not one of your batches". On Today, a stock row in a journey opens its page.
  - **The kirana** (Ganesh ji, Shree Sai Kirana):
    - **Offers:** the open offer with **Not this time** (the scheme stays open to the shop for its 48 hours, and Order after all brings it back), or the order on its way; then every earlier offer, Ordered, Declined or Expired. An expired offer says why: the scheme filled first, or its 48 hours ended.
    - Each offer opens its page: the order with its margin, or why nothing came of it, and what was offered.
    - **Orders:** the margin at MRP over every order since July (₹3,408 for Ganesh ji), each opening its offer.
  - **The food bank** (Meera at Feeding India):
    - Pickups adds the meals made from Munchly's surplus (872) and every collected pickup, each with its receipt.
    - A pickup's page: its tracker, the receipt in a sheet with its PDF, and the FSSAI checklist.
    - The story's Mango Drink request goes to the food bank the plan names, so India FoodBanking Network sees its own history alone.
  - **Found while building:**
    - design3's distributor's "what you receive" took the ExpireSoon lot at the listed price. At the award price every history batch ends whole to the rupee.
    - In design3:
      - a kirana's current offer was listed twice;
      - on phones a batch's figure ran into its chevron;
      - a distributor could open another's batch by its address.
    - In the port:
      - the first `partners.ts` read the seed, which a live build must not carry (`no-seed.mjs`), so the stub's history moved into the stub;
      - the stub served a kirana's history only to the signed-in person, which the goldens do not draw.
    - In backend-api:
      - a food bank was sent the shops' orders;
      - the scheme's running status is `sent`.

    All fixed.
  - **The port:**
    - design3 first (`ledger.js` partners, `flow.js` decline, `trade.jsx`, `roles.jsx`, `screens.css`);
    - then core:
      - `partners.ts`: the functions, held to ledger.js for every history batch, every shop of both distributors at four points of the journey, and Feeding India;
      - the trade screens (`DistBatches`, `DistBatch`, `WholeCard`, `DistPapers`, `RetailHome`, `OfferPage`, `OfferDetail`/`OfferOrder`, `RetailOrders`, `Pickups`/`PickupsNow`/`PickupHistory`/`PickupPage`, and the `Pt*` pieces);
      - the stub's `decline` and `hero.declined`;
      - `screens.css` verbatim;
      - the seed's history steps and every shop (`history.json` `shops`).
  - **backend-api:**
    - `GET …/partner` (`services/journey/partners.py`): each batch the member took part in, in view, as its facts: when each step happened (the case's stamps, and the feed's for the photo sent and the papers), the plan, what each line took, the deal and the papers. They are cut to the partner's part: a distributor's money and his papers with the copies, a kirana's own order and decline, a food bank's donation and receipt;
    - `POST …/cases/{ref}/offer/decline` (`steps.decline`), with its audit line; an order after all clears it;
    - the case detail tells a kirana its own decline, and gives a distributor the receipt and the destruction certificate as copies;
    - `journey.json` `history.partners` (design3's facts) holds the route to ledger.js.
  - **The live workspace:** reads `partner()` for a distributor, kirana or food bank, again on every change to a batch; sends Not this time; projects the scheme's declined.
  - **The contract:** `WsPartner`, `WsPartnerCase`, the offer's `declined`, `WorkspaceApi.partner()` and `declineOffer()`; `contracts.sh` re-exported the OpenAPI.
  - **Checks:**
    - backend-api: 524 passed, 1 skipped (7 new in `test_partners.py`; SC-110's receipt test now expects the distributor's copy);
    - the frontend gate passes: core 231 (14 new), api 77, workspace 74 (7 new live tests: Rakesh's Batches and pages, his batch in a journey, another's batch, Ganesh ji's offers, orders and an offer's page, Not this time, Meera's pickups), admin 17, demo 5, console 3;
    - the goldens follow the new screens;
    - the live fixtures were re-recorded with each member's partner view;
    - design3's build was shot at 1440 and 390, light and dark (`build/`);
    - the port was checked on the stub build in the browser;
    - the a11y spec gains scans of a distributor's batch page and a copy, a kirana's earlier offer, a food bank's pickup and Not this time, and the e2e spec gains two flows; the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-131** (In Review, branch `SC-131-slow-network-loaders`): the console's splash and the landing page's loader on a slow line.
  - **The request:** the console's sign-in, sign-out and reload splash "does not load properly" on slow networks; the landing page's loader "is good but in slow network it is taking time". Then: the green dots load slowly and look odd; "making the logo throb when loading".
  - **Measured on the live apps (9 Oct, cold cache):**
    - the console on 3G: blank until 7.9 s (the splash's script sat behind the app's render-blocking stylesheet, and leaned on it), "Waking the platform up…", then a false "The console did not answer" at 15.4 s (the 8 s limit counted the code's download), then it opened anyway at 17.7 s;
    - the landing page: blank until 6.9 s on 3G; its loader waited on the hero's 369 KB plate while the table's plate, the 6.5 MB film (`preload="auto"`) and 393 KB of fonts downloaded beside it (11.7 s on Slow 4G); on 3G it lifted on its cap at 15.2 s onto a page with no plate.
  - **Design first:** three options on one board in platform v3, `SC-131 design review.html`, each played over the real pages on a simulated Fast, Slow 4G or 3G line: A, the heartbeat (recommended); B, the route runs; C, the mark fills. The maintainer picked **B**, and yes to the workspace app's live splash changing with the console's. Designs, measurements, stills and the decision are in `design3/designs/SC-131/`.
  - **The mark is the loader:** its route stands faint and a stretch of it runs from the godown dot to the pin, a lap every 1.15 s, the pin throbbing as each arrives; ready, the last lap draws the whole route, the pin pings, and the mark opens into the window. The green-dot tracker is gone; one line under the title says what it waits for (the console, the platform, waking it), and past 3 s "Slow connection · still loading".
  - **Never cries wolf:** the splash says the console did not answer only on a refused read, an offline device, a file that failed to load, or 20 s with nothing arriving; a cover that failed opens anyway if everything arrives after all.
  - **Paints with the first bytes:** both covers bring their own styles inside their scripts (the `@splash`, `@splash-ws` and loader blocks left `console.css`, `screens.css` and `site.css`); `@smart-clearance/core/firstpaint` makes each app's stylesheets high-priority preloads that do not block the first paint (with `<noscript>` copies) and opens the API's connection early. The console fetches the Overview's code while the person types.
  - **The landing page's first screen first:** the poster preloaded at high priority for each theme; a 48 px soft preview of it, inlined and blurred, under the film; the table's plate lazy; the film only after the lift. The loader lifts once the HTML is parsed, the stylesheets are in and the faces are in (or 2.5 s), at least 1.25 s; the route's exit runs on its own tween, needing none of the page's scripts.
  - **Measured on the builds, locally, like for like with `main`** (gzip, cold cache, HTTP/1.1, the console on its mock):
    - console, 3G: first paint 8.1 s → 2.6 s, the cover gone at 15.7 s → 16.0 s (bound by the console's code in waves; Firebase Hosting's HTTP/2 shortens those for both);
    - landing page, 3G: first paint 6.4 s → 2.4 s, lifted 14.6 s → 7.8 s; Slow 4G: 1.8 s → 0.7 s, 11.0 s → 3.3 s.
  - **Checks:** the frontend gate passes (core 222 with `firstpaint.test.ts`, api 77, workspace 67, admin 17, demo 5, console 3). design3 played through: the first load in light and dark, sign-in and sign-out, offline and silence failures with recovery, reduced motion, the landing page's lift and its theme switch. The browser suites were not run (SC-55).
  - **The mark springs in on the design system's own spring** (`--ease-spring`, as in SC-35 and SC-51), written out in both scripts.
  - **Hosting:** the hosted landing page and console load commit `fa92724`; every pinned file was checked on jsDelivr first (two cached 403s purged).

- **SC-132** (PR #113, merged; bug found by the maintainer): a distributor's copy of the destruction certificate read ₹0.00 of input GST reversed.
  - **The cause:** the paper worked the reversal out as units × the plan's credit a pack, and a distributor is not sent Munchly's plan.
  - **The fix:**
    - the certificate carries the credit it reverses (`reversed`), drafted with the papers (money.js `documents`, money.py) and counted again on expiry day (`steps.expire`);
    - the paper reads its own figure (design3 `finance.jsx`, core `Paper.svelte`);
    - a certificate drafted before has it worked out from the batch's plan as it is read (`views.with_reversed`), for the case detail and the partner route.
  - **Example:** MF-2407-111's 184 packs read ₹101.20 (₹0.55 a pack), MF-2407-116's 132 read ₹96.36.
  - **Checks:**
    - backend-api 525 passed, 1 skipped: the partner test holds each copy's figure to design3's, and a new test covers an older certificate;
    - the frontend gate passes (core 236, api 77, workspace 74, admin 17, demo 5, console 3);
    - the seeds were regenerated; design3's `dist/` is rebuilt.

- **SC-133** (PR #114, merged): the distributor's portal, batch by batch.
  - **The request** (with three screenshots of the live app): the Van route "seems odd", and its Raipur lot looked stubbed; it should be per batch; Orders should show past orders, and "does not look logical, I cannot understand what is for what"; Today "seems misleading, the batch is all that is tracked for distributors in the app"; "Think of proper design for Distributors". Batches (SC-130) "is fine". The ₹0 reversed on the destruction certificate went to SC-132.
  - **Design first:** three options on one board in app v3, `SC-133 design review.html`:
    - A, a card for each batch (recommended);
    - B, one job list;
    - C, a batch in focus.

    The maintainer picked **A**, with Deliveries and the label photo showing current and past, and Today taking one or more batches in a journey; the label photo stays on laptops (off the phone's tabs). Designs, stills and the decision are in `design3/designs/SC-133/`.
  - **Today:** a card for each batch of Munchly's at his godown in a journey, the one asking most of him first:
    - the batch (pack, name, id, packs at risk, the day it was flagged) and where it stands ("2 for you", else its stop);
    - his next steps, each with one button: the label photo, the staff sale, the buyer's truck, Issue from Tally, the van round. A step that needs its screen opens it on the batch; Issue from Tally acts at once, on that batch;
    - else what it waits for ("The scheme is open: 12 of 38 shops have ordered");
    - its lines (the scheme, the lot, the staff sale, the food bank), each where it stands, opening its Deliveries;
    - with more than one batch, an index over them; a cleared batch stays only while something is left for him;
    - the way to the rest of his stock and the batches he cleared, on Batches.
  - **Deliveries** (was the Van route): a batch at a time under its head, with a switch between batches; only the lines its plan has:
    - the van round on the batch's own cluster, with its stops in the order they ordered; Start the round once the papers are drafted, as backend-api allows (SC-97);
    - the buyer's truck with the lot's buyer, price, token and balance (SC-118's rule);
    - the staff sale (SC-87's card) and the food bank's pickup;
    - then **Earlier deliveries**, batch by batch: each cleared batch's van round, truck, staff sale and pickup, with its day.
  - **Label photo:** the photo Vision asks for now (SC-80's camera), then **Earlier label photos**: every photo he sent, and what Vision read (the batch, made, best before, MRP).
  - **Orders:** every batch's orders, in a journey and cleared, under the batch: who bought what, for how much, on which paper (the invoice, with Issue from Tally while it is a draft), and each scheme's shops on request; what sold since 1 Jul 2026 at the top.
  - **The logic** is design3's `core/ledger.js` partners (`distNow`, `journeyOf`, `ordersNow`, `ordersPast`, `deliveriesPast`, `photoOf`), and core's `workspace/dist.ts`, held to it at every stage for both distributors (`core/tests/dist.test.ts`). The batch in focus reads the journey's state; the stub's Mango Drink its own; on the live workspace every other batch its partner facts.
  - **Found on the way:**
    - a distributor is not sent Munchly's plan, so the batch in focus takes its lines from his partner facts;
    - its batch page's Money tab read the story's figures for a live partner (Lakshmi's cleared Mango Drink: −₹27,169); `storyWhole` now works from the credit note's rows, with the expiry credit, as SC-94's card did (₹0);
    - the stub records the Mango Drink's staff sale at Lakshmi Agencies (design3 `flow.js`, core `flow.ts`).
  - **backend-api:** a distributor's partner facts carry a batch of his from the Watcher's flag, before any plan (the packs at risk, the photo asked), so a request on any of his batches shows on Today. A step names its batch (`act(…, { ref })`). The partner route reads the shops' orders in the order they were placed: it had no order, so Postgres sometimes returned another, and SC-130's distributor test failed in about half of the full runs.
  - **Gone:** the old Today's plan card, You end whole and the stock list (on the batch's page and Batches), `VanInner`, `EndWhole`, `InvoiceDraft`, the live `DistQuiet`.
  - **Checks:**
    - backend-api 526 passed, 1 skipped, in two full runs after the orders' fix (a new partner test: his batch from its flag, with the photo asked);
    - the frontend gate passes: core 258 (22 new in `dist.test.ts`; the distributors' goldens updated), api 77, workspace 78 (4 new live tests: Today with two batches and a step on its own batch, Orders, Deliveries waiting on a batch not yet in focus, his batch's flagged packs and his photo's made date), admin 17, demo 5, console 3;
    - the live fixtures and seeds were regenerated; design3's `dist/` is rebuilt;
    - played through on the stub in dark: design3 at 1440 and 390 (the photo request and camera, the truck, Issue from Tally, the van round, Lakshmi's staff sale recorded) and the port's build at 1440 (Today, Issue from Tally, Deliveries);
    - the a11y spec gains Lakshmi's Today, Deliveries and Orders, and the journey suites follow Deliveries; the browser suites were not run (SC-55).
  - **Munchly Chips E2E, asked for by the maintainer** ("Run munchly e2e journey automation, Check the finance and esg and for rakesh distributor check reports on his portal"; then "fix your test cases and make one complete end to end happy path run"):
    - **The suite gains a step** (`distributorStep`, 16 of 17): after Priya's tax and ESG, Rakesh reads his portal back: Today with nothing left on the chips; the batch's page (what happened, he ends whole, his papers, each with Download PDF, and their PDFs from their links); Orders, each on its paper; Deliveries; his label photos. Each is held to the ledger row, his partner facts and the story. The text checks compare with and without spaces, since a screen breaks its lines where its layout does.
    - **The run of 9 Oct** (`frontend/workspace/tests/journey/runs/2026-10-09-distributor/REPORT.md`; the 6 min 46 s recording stays local): **passed** in 6 min 45 s, 77 steps, from a reset. Every figure is the story's: ₹21,770 planned; 31 kiranas ordered 588; 772 at ₹14.20; INV/26-27/0931 (₹11,510), CN/0117 (₹8,768) and the ITC memo, each with its PDF; actual ₹21,152.40. Priya's tax (₹1,224 kept, none reversed) and ESG (217.6 kg, 544 kg CO₂e, 8.16 kg of packaging) as posted. Rakesh ends whole at ₹0, his two papers' PDFs serve as `application/pdf`, and his photo reads made 18 May, best before 18 Nov.
    - **Found by the attempts before it, all fixed:**
      - a quiet Today (no batch flagged yet, as after a reset) showed no permission card, so Rakesh could not give it: he now gives his own there (a live test holds it);
      - his batch's "What happened" said the Watcher flagged 1,840 packs (the whole batch; a partner is not sent the plan): it reads the 1,360 at risk;
      - his label photos were dated from the shelf life (made 22 May): the partner facts carry each batch's own made date (`batch.mfg`; backend-api, the seed, the contract), so 18 May, as the label reads (a live test holds both);
      - a money line's note ran into its name ("From your kiranas588 packets"): `PtLine` keeps the space Svelte trimmed;
      - Orders called a cleared batch's orders "orders so far": "cleared · every order" (design3 first);
      - the suite's own checks: "issued from Tally" now also reads on his cleared batches' orders, so it reads the chips' own; the price support exactly (₹8,767.60) against the credit note's rupees (₹8,768), now to the rupee.
    - **The only finding:** the old note that Priya's pack reads the invoice "drafted" after Rakesh issues it, as in the prototype.
    - **After it:** the journey day is back to 24 hours; the journey is left as the run ended.

- **SC-134** (PR #115, merged): Munchly Mango E2E on the new UI (SC-127's one operator, SC-133's distributor portal), asked for by the maintainer ("Run mango drink e2e journey, fix anything if needed as per new ui we build").
  - **The suite** (`munchly-mango.journey.ts`):
    - Lakshmi's label photo, staff sale and van round start on Today and press the button on the Mango's own card (`#batch-MF-2410-118`), by its exact name;
    - ESG opens the batch page's Impact tab and the ledger's Impact reading (since SC-127 pages open on Money);
    - a new `distributor` step reads Lakshmi's portal back: Today, What happened (the packs at risk as Priya's case has them), Money (she ends whole at ₹0), Papers with the receipt as a copy, both PDFs, her credit against the ledger, Orders, Deliveries and her label photos;
    - `shows` and `same` moved from `chips.ts` into `flow.ts`, shared by both flows.
  - **Fixed in the app:** a cleared batch's food-bank pickup read "being booked" on the distributor's Deliveries, and her Orders lost "58 packs given": the donation leaves the workspace's state once a batch clears, and a distributor is never sent the plan. `dist.ts` now reads it from her partner facts, collected once they say so. A new live test covers it.
  - **The run of 10 Oct** (`runs/2026-10-10-mango/REPORT.md`, the recording local): passed in four parts on the same journey, never resetting. Parts 1 and 2 stopped on the suite's own selectors, part 3 found the pickup, part 4 passed (81 s, 22 steps).
    - Plan and actual ₹16,917.10, nothing left at the godown: 52 kiranas ordered 1,372, 150 to staff, 58 collected by Feeding India.
    - CN/0118, the ITC memo, the FSSAI checklist and receipt FI/HYD/26-27/0417, each with its PDF; the Saturday round.
    - Lakshmi ends whole at ₹0; her CN/0118 and receipt PDFs serve; her credit ₹5,932.
    - The year so far: 14 batches, ₹2,58,453.08 recovered.
    - The only finding left is the known one: Saraswathi Kirana and Bilal Stores order 16 each, in the offer screen's twelves.
  - **The journey is left as the run ended** (both batches cleared); the day is back at 24 hours.
  - **Checks:** the frontend gate passes (core 258, api 77, workspace 79, admin 17, demo 5, console 3).

- **SC-135** (PR #116, merged): Munchly Mango Leftover E2E, asked for by the maintainer ("run the mango run with left order scenario (kiranas not buying all). I need you verify end to end all the screens and states including gst invoices and destruction certs and donation receipts. And financial and esg impacts").
  - **The suite** (`munchly-mango-leftover.journey.ts`, its own Playwright project, `corepack pnpm test:journey:mango-leftover`; it resets the journey):
    - Lakshmi Agencies' 52 ordering kiranas: the last `E2E_LEFTOVER` (10) do not buy; of those, `E2E_DECLINE` (2) press Not this time and the rest let the scheme go;
    - the staff sale is recorded, and Feeding India collects;
    - Neha closes the offer window early from the console, so the unordered packets stay at the godown;
    - the pack is drafted and the van round runs;
    - Neha fires expiry day, which settles the packs left by Munchly's policy (full credit).
  - **What it reads back**, held to the ledger row:
    - every paper in Priya's pack, with each PDF kept beside the report and read back as text (`pypdf`);
    - Execution's Left at the godown and Expiry settlement;
    - the ledger's GST and Impact readings, with both exports;
    - one kirana for each outcome (ordered, declined, expired);
    - Meera's pickup and receipt;
    - Lakshmi Agencies' portal, with her copies.
  - **Shared steps:** the Mango's steps moved into `mango.ts`, and Munchly Mango E2E runs them as before. Priya's tax and ESG steps moved into `ledger.ts`, for whichever batch a run takes; they now also check the expiry credit note and the receipt. `flow.ts` gains `hero()`.
  - **Fixed in the app:**
    - the GST ITC memo read "Destroyed, gifted or lost: 58" beside a reversal for 306 packs: backend-api's case view dropped its `away` count (`views.doc_out`; its PDF was right);
    - the batch's head read "Cleared · 0 cartons destroyed" for every batch: it counts what expired ("Cleared · 248 packs destroyed"; core `model.ts`);
    - once cleared, the journey's own batch read the journey's state on the distributor's page, with no staff sale, pickup, unordered packets or expiry. It now reads her partner facts, as earlier cleared batches do (core `DistBatch.svelte`).

    The prototype's stub never leaves packs at the godown, so design3 reads as before.
  - **The run of 10 Oct** (`runs/2026-10-10-mango-leftover/REPORT.md`, the recording local): passed in 10 min 1 s, 122 steps, from a reset, on the fourth attempt (the earlier three found the fixes above, and one selector).
    - The scheme: 42 of 52 ordered 1,124 of 1,372 packets; 248 were left at the godown.
    - The papers:
      - CN/0117 (₹5,188) and CN/0118 (₹3,596 for 248 packs at ₹14.50);
      - the ITC memo, part reversed: ₹700.70 kept, ₹168.30 reversed on 306 packs;
      - the destruction certificate: 248 units, ₹136.40 reversed;
      - the FSSAI checklist and FI/HYD/26-27/0417 (58 packs, 58 meals).

      Every paper Paperwork lays out has its PDF. The destruction certificate has none: it is a record on the case.
    - No tax invoice: the Mango's plan has no ExpireSoon lot.
    - The money: net ₹14,065.10 of ₹16,917.10 planned; swing ₹18,513.98; P&L −₹4,143.22 against −₹22,657.20. Lakshmi Agencies ends whole at ₹0.
    - The ESG: 286.38 kg kept out of landfill (273.91 resold, 12.47 donated), 53.32 kg destroyed, 716 kg CO₂e, 2.67 kg of packaging diverted.
    - Notes left: an expired offer reads "Its 48 hours ended", and her page "The scheme closed after 48 hours", though Neha closed the window early.
  - **Checks:**
    - backend-api 526 passed, 1 skipped;
    - the frontend gate passes (core 258, api 77, workspace 81 with 2 new live tests, admin 17, demo 5, console 3);
    - the live fixtures were regenerated;
    - the day is back at 24 hours.

- **SC-136** (PR #117, merged): production's data replaced with local's, asked for by the maintainer ("sync the local postgresql data and bigquery local data with cloud, so that i have exact same dataset on the application deployed on cloud run"; "bigquery and buckets need sync too").
  - **The maintainer's answers:** a time-limited grant for the operators to act as sc-migrator; the audit log copied exactly (an on-demand backup first).
  - **infra/prod:** `migrator_operators`, a `roles/iam.serviceAccountTokenCreator` binding on sc-migrator for the operators, conditioned on `request.time < data_sync_until` (`terraform.tfvars`: `2026-10-12T12:00:00Z`), so it closes by itself; empty removes it. Applied on the maintainer's yes (plan read in full: 1 to add, 0 to change, 0 to destroy).
  - **`backend-api/scripts/sync.sh`** (`sc_api/cli/sync.py`):
    - read-only by default: the schema versions, which must match; each table's rows on both sides; what local still has to send; the buckets' objects; BigQuery's rows;
    - `--rehearse`: the database's transaction into a scratch local database;
    - `--apply --allow-env prod`, in order:
      1. an on-demand Cloud SQL backup;
      2. one transaction as sc_owner: the truncate guards lifted, every table of schema `sc` truncated, then copied (binary COPY) in the order of its non-deferrable keys, with the deferrable ones checked at commit. The sequences are set to local's, the guards put back, and the rows checked against local's before commit;
      3. the photos, docs and exports buckets copied local to prod, same names (production-only objects kept for the backup; the 30-day lifecycle removes them);
      4. BigQuery's seven tables truncated and filled from `smartclearance_local`, with `secondary_sales.source_file` pointed at the prod exports bucket;
      5. the plan again.
  - **Rehearsed** into a scratch local database: 37 tables, 9,268 rows, 19 sequences. The audit log, cases and stream checksums matched, and the restored guard refused a truncate.
  - **Done in production (10 Oct):**
    - the backup `1791624822523` (ON_DEMAND, 09:33 UTC);
    - the database went from 2,585 rows to local's 9,268, with all 37 tables equal;
    - photos, docs and exports copied;
    - BigQuery's seven tables equal, 8,539 rows.

    Read through the live API: the Mango Drink cleared (248 packs settled, ₹3,596), its papers with their PDFs from the prod docs bucket, the ledger's 13 batches, Lakshmi Agencies' 7 batches.
  - **After it:** the two environments run on their own again; each one's tick and agents move its own copy on.
  - **Checks:** backend-api 529 passed, 1 skipped (3 new in `test_sync.py`); infra `check.sh` passes.

- **SC-137** (PR #118, merged): Munchly Chips E2E on production, recorded, asked for by the maintainer ("run the munchly chips end to end on production and record the session").
  - **The production target:** `E2E_TARGET=prod` runs a journey suite on the deployed apps (munchly-smartclearance.web.app, smartclearance-console.web.app) and on backend-api and the agents on Cloud Run. Each app's API address and browser key come from its production build settings, the repository's variables, read with `gh` (`auth.ts`). People still sign in with custom tokens (`sessions.sh`), since the user pool is shared. Nothing local runs.
  - **Service workers blocked** in the suites' browser (`playwright.journey.config.ts`): the deployed workspace's service worker served its cached shell for the bare page a person is signed in from, so the first attempt stopped at the fifth kirana on the sign-in screen. The deployed app is unchanged; in-app notifications come over the live stream.
  - **The run of 10 Oct** (`runs/2026-10-10-prod/REPORT.md`, the 10 min 45 s recording local): passed in 10 min 33 s, 77 steps, from a reset, every figure the story's:
    - ₹21,770 planned; 31 kiranas ordered 588; 772 at ₹14.20;
    - INV/26-27/0931 (₹11,510), CN/0117 (₹8,768) and the ITC memo, each with its PDF from the prod docs bucket;
    - actual ₹21,152.40;
    - the tax: ₹1,224 kept; the ESG: 217.6 kg, 544 kg CO₂e;
    - the year: 13 batches, ₹2,41,535.98.
  - **Found on Rakesh's batch page** (since SC-135 it reads his partner facts once cleared):
    - the suites expected the journey state's wording, and now follow the facts': "Agrawal Wholesale's truck collected the lot", "From 31 kiranas";
    - **a bug:** it named the Friday van round. The partner facts stamped the round when Rakesh ran it, before its Saturday morning in a compressed journey; the push, the timeline and Deliveries say Saturday (SC-97). The facts' van step now carries `leaves` (backend-api `partners.py`; not for the history, stamped on its own day), and his pages name the round by it (core `partners.ts` `vanDay`, `dist.ts`; the contract's step type). It reaches production with the next deploy.
  - **After it:** production's journey day back at 24 hours (the console's clock, as Neha); the chips cleared, the Mango Drink back at day 0.
  - **Checks:**
    - backend-api 530 passed, 1 skipped (a new steps test);
    - the frontend gate passes (core 258, api 77, workspace 82 with a new live test that fails without the fix, admin 17, demo 5, console 3);
    - the live fixtures were regenerated.

- **SC-138** (In Review, branch `SC-138-chips-e2e-prod-rerun`): Munchly Chips E2E on production again once SC-137's build was deployed, recorded, asked for by the maintainer ("once new build is deployed I want to rerun the munchly chip e2e happy path and record the session").
  - **The build:** CI for `a5b3626` passed every gate and deployed backend-api (revision `backend-api-00038-rkg`), the agents and Hosting.
  - **The run** (`runs/2026-10-10-prod/REPORT.md`, replacing SC-137's record; the 9 min 47 s recording local): passed in 9 min 46 s, 77 steps, from a reset, with no soft failure.
    - Every figure is the story's: ₹21,770 planned; 588 to 31 kiranas; 772 at ₹14.20; INV/26-27/0931, CN/0117 and the ITC memo with their PDFs; actual ₹21,152.40.
    - The tax and the ESG are as posted.
    - Rakesh's batch page reads "Your Saturday van round delivered the scheme".
    - The only note is the old one: the invoice reads "drafted" in Priya's pack after Rakesh issues it.
  - **After it:** production's journey day back at 24 hours; the chips cleared, the Mango Drink at day 0.

- **SC-139** (PR #120, merged): packs left at the godown destroyed there, against evidence and a second yes (route B).
  - **The request:** "If chips are destroyed at go down, ask for a photo and supply chain will need to review and approve it before the entire deal closes, destruction certificate, credit note and other stuffs should be properly generated and validated and realistic as much as possible"; the console's client configuration to match, and the GST papers and invoices to follow; then "I want the destruction image to be done as much reaslistic as possible as it is done today - like landfill etc."
  - **Design first:** three options on one board in app v3, `SC-139 design review.html`:
    - A, on Execution;
    - B, a second yes (recommended);
    - C, witnessed.

    The maintainer picked **B**. Route A, the full-credit take-back, is offered in the console and built later. The credit is the dealer price, plus the GST gross-up, plus the agency's charges. The history's three leftover batches are restated under route B, with their documents, photos and approvals. Designs, the evidence photos, the build's stills and the decision are in `design3/designs/SC-139/`.
  - **The policy:** the client's fourth expiry policy, `godown`, "Destroyed at the distributor's godown"; Munchly is set to it. Its settings are in the console's Rules, under Destroyed at the godown (`clients.destruction`):
    - the two photos asked for;
    - Vision's check;
    - the reviewer (Supply Chain);
    - a reminder after 2 days;
    - the gross-up;
    - ₹1.50 a pack in charges;
    - the authorised agencies, each with its city, authorisation and certificate series. Munchly's are Orange City Enviro Services and Vidarbha Waste Care in Nagpur, and Deccan Green Waste Management in Hyderabad.
  - **The flow:**
    - **Expiry day** (or a report that finds packs left) asks the distributor: "Destroy N expired packs at your godown" on his Today, with a push. Impact waits.
    - **The distributor** sends his evidence:
      - two photos, taken or uploaded: before, at the godown with the carton's batch label; after, at the landfill with a slate;
      - the agency from the client's list for his city;
      - its certificate number.

      The screen names the input GST he reverses in GSTR-3B (Table 4(B)(1)).
    - **Vision** reads both photos on Gemini: the batch, the count, the slate's batch, count and date, the landfill, the packs destroyed. backend-api holds the read to the batch, the packs left and the day.
    - **Priya** opens "Review the destruction" on her Command Center. It shows both photos, Vision's checks, the agency on Munchly's list, and what her yes issues. She approves ("Approve · issue the papers"), or asks again with a reason, which re-arms the reminder.
    - **Only on the yes** does Impact report and the batch close.
  - **The papers:**
    - **The Expiry credit note:** a financial note with no GST. Its lines are the dealer price, the input GST he reverses on the packs (grossed up) and the agency's charges, against the agency's certificate. The chips' 144 packs come to ₹3,168.00 + ₹158.40 + ₹216.00 = ₹3,542.40.
    - **The Destruction certificate** is the agency's, for him: the batch, the packs and kilos, the method (slit open, buried and covered at the authorised municipal landfill), the authorisation, the evidence and who approved it, and the GST he reverses. It is his paper on his portal, not a copy.
    - **The ITC memo:** Munchly keeps its own input GST on these packs; they were his stock, so he reverses his.

    Paperwork lays out both as PDFs (`expiry_note.html`, `destruction.html`).
  - **The history, restated:**
    - Lakshmi Agencies' Masala Oats MF-2406-107: 65 packs, DGW/DC/26-27/0085, CN/0111 ₹3,339.38;
    - Rakesh Traders' Mango Drink MF-2407-111: 184 packs, OCE/DC/26-27/0217, CN/0115 ₹3,077.40;
    - Rakesh Traders' Peanut Chikki MF-2407-116: 132 packs, OCE/DC/26-27/0218, CN/0116 ₹2,692.80.

    Each has its two Qwen-Image photos (`design3/system/img/evidence/`, with sidecars), Priya's approval on its day and the agency's certificate. Munchly's input GST is kept.
  - **The build:**
    - **design3:** `trade.jsx` DestroyScreen; `brand.jsx` DestructionCard, DestructionSheet and the Command Center's review; `finance.jsx` the godown papers; `money.js` (`expirySettlement` and `realised` with the godown policy, `RULES.destruction`); `flow.js`; `ledger.js`; `platform.js` `destructionDefaults`; the console's Rules and Client profile.
    - **The port:** core's `DestroyScreen`, `DestructionCard`, `DestructionSheet`, `ExpirySettlement`, `Paper`, `dist.ts` and `partners.ts`; the console's `RulesTab` and `Choice`; the workspace's live source, with both photos uploaded to signed links.
    - **The contract:** `WsDestruction`, `DestructionInput`, `CaseDetail.destruction`, the godown fields on `WsDoc` and `ExpirySettlement`, `WsSetup.destruction`, and `Client.destruction` in the console.
    - **backend-api:** migration 0011 (`clients.destruction`, `cases.destruction`, `godown` in the expiry check). In `steps.py`: `send_destruction`, `destruction_checked`, `approve_destruction`, `ask_destruction_again`, `remind_destruction`, and the report's gate. The `destruction.remind` timer. Four workspace routes and `/internal/…/destruction/check`. `destruction.send` and `destruction.approve` in `rbac.json`. The console's rules, and `history.py`'s three batches.
    - **agents:** Vision's destruction read (`vision_destruction.txt`), and Paperwork's two templates.
    - **The journey suites:** both leftover suites walk route B (`tests/journey/destruction.ts`): the distributor sends design3's evidence photos, Vision checks them live, and Priya approves. Neither was run.
  - **Found on the way:**
    - the swing was a rupee off where the godown credit was rounded a pack at a time;
    - "Rakesh Traders's" in two sentences;
    - the review sheet was too narrow at 1440, and its footer overflowed on phones;
    - the live projection dropped the godown fields, so the note read ₹0.00;
    - a partner's times stored without a zone were read in the server's;
    - `hydrate.sh --papers` (`steps.lay_out_missing`) did not count the agency's certificate as a printed paper, and counted an awaiting one as missing. It now follows the agents' `needs_pdf` (`steps.printed`).
  - **Checks:**
    - backend-api 547 passed, 1 skipped (`test_destruction.py`, 4 new: the whole flow, the reminder, Vision off, the console's settings; the Mango's tests walk route B; `test_ledger.py`'s PDF test now asks for the agency's certificate and leaves an awaiting one, and fails without the fix);
    - agents 202 passed (4 new);
    - the frontend gate passes: core 260, api 78, workspace 87, admin 17, demo 5, console 3. The new goldens cover the request to the second yes, and a history batch's godown papers. The new live tests cover Today, the send with both uploads, Priya's review and the cleared moments;
    - the live fixtures were regenerated, with two new moments (`destruction-asked`, `destruction-checked`);
    - both PDFs were rendered and read;
    - the browser suites and the journey suites were not run (SC-55).
  - **Locally:**
    - migrated to 0011, then rebuilt with `hydrate.sh --reset`;
    - Munchly is on `godown`, and the three history batches are destroyed and approved by Priya;
    - the agents' worker was restarted on the new code, and `--papers munchly` laid out the three agency certificates (OCE/DC/26-27/0218 reads 132 packs and ₹118.80 reversed by Rakesh Traders);
    - the day is 24 hours.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-140** (In Review, branch `SC-140-architecture`): the technical architecture for the hackathon submission, documentation only, asked for by the maintainer.
  - **The artifact:** [Smart-Clearance Architecture](https://claude.ai/artifact/MCFr2c1AVzX9xXKqcYVu47), in design system v3's tokens and mark, light and dark. It holds:
    - the system in one diagram;
    - Firebase, Cloud Run and Gemini as the brief asks, and why Firestore is not in the build (Cloud SQL holds the record);
    - every Google Cloud component, what it does here and why;
    - the agents' nine stops with their Gemini tier, and one ADK run;
    - the application flow, interactive and with no figures: the core loop, signing in, and each stop as a sequence across the apps, Firebase, backend-api, Cloud SQL, Pub/Sub, the agents, Gemini, BigQuery and Cloud Storage;
    - keyless identity, CI/CD (GitHub Actions, Workload Identity Federation, Cloud Build), the testing (gates, a11y, e2e, parity, live, journey, evals) and one trace.
  - **The copy:** `docs/smart-clearance-architecture.html`. The artifact and its copy link the three Lucid documents.
  - **Lucidchart**, made through the Lucid connector once connected, in the maintainer's Lucid account (private until shared there):
    - [Smart-Clearance Architecture on Google Cloud](https://lucid.app/lucidchart/0e33214e-b46f-4cfb-9413-b2c40de7d1c6/view): the system, the agents' nine stops and CI/CD, on Google Cloud's own icon set (GCP 2021);
    - [Application Flow · the core loop](https://lucid.app/lucidchart/2965aa52-3190-4d68-8791-9c95c8fd7bbc/view) and [Application Flow · a batch's journey](https://lucid.app/lucidchart/c2efb94b-7aa2-4cc1-a6cc-af4980ff255f/view): Lucid sequence diagrams, every stop as a group, with no figures;
    - [Smart-Clearance Google Cloud and AI](https://lucid.app/lucidchart/631bbb66-9b43-4e20-abf0-f44fa6a68174/view), for the PDF: the services layer by layer, Cloud Run, Pub/Sub and Cloud Scheduler, where the data lives, who signs as whom, the agents and the Gemini models behind them, and a model call, bounded;
    - two earlier drafts (the architecture's first, whose text rendered too small, and Google Cloud and AI's first, whose container tags overlapped their titles) are renamed "(superseded draft, safe to delete)"; the connector cannot delete;
    - `docs/smart-clearance-architecture.drawio` keeps the same three pages for Lucidchart's draw.io import.
  - **The PDF:** `docs/smart-clearance-architecture.pdf`, rewritten on the maintainer's ask: 24 pages, A4 landscape, every diagram a Lucidchart export (14 pages from the four documents), in Smart-Clearance's own theme (the brand bar and route, the night and morning town plates on the cover and the close, Bricolage Grotesque and Geist). It holds:
    - Google Cloud: the system, the layers, every component with what it does and why, then Firebase (and why not Firestore), Cloud Run, Pub/Sub and Cloud Scheduler, data, identity, delivery, operations and cost;
    - the AI: why Gemini on Vertex AI and why two tiers (Pro where a person decides on the words, Flash for reading and drafting), every agent with its model, why, and what happens if the call fails, the ADK pipelines, the guardrails and the evals;
    - the core loop and a batch's journey, from the Lucid sequence diagrams.

    It is printed by headless Chrome from its own fixed-page print source, kept outside the repo; it replaces the 39-page print of the artifact.
  - **Checks:**
    - the page was played in a browser at 1440 × 900 and 390 × 844, with no console errors and no sideways scroll on a phone. The viewer's frame ignores bare anchors, so the page's section links scroll in script;
    - each of the PDF's 24 pages was rendered and looked at, and every Lucid page was exported and checked for overlaps; the figures on the AI and operations pages were checked against `agents/` and `infra/prod`.

- **SC-141** (PR #121, merged; bug found by the maintainer): the distributor's Orders and Batches, figures that add up as written.
  - **Found:** "calculations dont match" on Rakesh Traders' portal. Every one of his six cleared batches ends whole to the paisa, and both headlines were right. Batches' ₹66,918 is what Munchly credited him (8 credit notes); Orders' ₹1,05,928 is what he sold from the same batches. But:
    - a kirana row read "456 packets at ₹18.00, 2 free with every 10 · ₹6,840", which multiplies to ₹8,208. With 2 free in every 12, the packets came to ₹15.00 each;
    - the two headlines ("from Munchly since July", "sold from Munchly's batches") did not say which figure was which.
  - **The fix** (design3 `core/ledger.js` and `screens/trade.jsx` first, then core's `dist.ts`, `DistBatches` and `DistOrders`):
    - the row gives the effective price first, as the Route Room already does: "456 packets at ₹15.00 effective (₹18.00 a pack, 2 free with every 10)", in a batch in a journey and a cleared one;
    - Batches reads "credited by Munchly since July", and ties the figures together: "They cost you ₹1,72,846; you sold ₹1,05,928 from them (on Orders), and the price support, with the expiry credit where packs expired, made up the rest";
    - Orders names the credit notes on the cleared batches, ₹66,918, as on Batches.
  - **Checks:**
    - the frontend gate passes: core 260, with Rakesh's 18 goldens changing only those lines; api 78; workspace 87; admin 17; demo 5; console 3. The two live tests now hold the row's effective price and its ₹10,584, and the sentence's ₹1,72,846, and fail without the fix;
    - backend-api 547 passed, 1 skipped (only the seed manifest changed);
    - design3's `dist/` is rebuilt.

- **SC-142** (PR #122, merged): a batch's record. Priya reads every batch, past ones too, with the photos sent for it, its yeses and every step; the distributor reads the photos he sent.
  - **The request:** "Both supply chain operator and distributor should be able to see the photos they have sent for batch and destruction evidence pictures"; "Supply chain operator should be able to see past batches under Batches section with details like what picture was sent, audit log of the everything that happened in that batch, photos of destruction and approval sent etc." (The third part, the distributor's figures, was SC-141.)
  - **Design first:** three options on one board in app v3, `SC-142 design review.html`:
    - A, the Record tab (recommended);
    - B, evidence on the timeline;
    - C, the batch file.

    The maintainer picked **A**, and "Yes, use them" for the history's label photos. Designs, the photos, the build's stills and the decision are in `design3/designs/SC-142/`.
  - **The history's label photos:** the twelve pilot-quarter batches had none, so each has one printed with its own batch and dates (`design3/system/img/labels/`, Qwen-Image, with sidecars): Rakesh Traders' as edits of the Vision eval set's clean label, Lakshmi Agencies' rendered afresh. The story's chips use the eval set's own. `seed.mjs` copies them into backend-api's reference (`reference/labels/`), and the history uploads each as the photo its distributor sent.
  - **Batches** (Priya's): under the batches in view ("In view · from the DMS export"), every batch that has cleared and passed its best-before, by month ("Cleared · September 2026"), with its outcome, the photos sent for it and what it recovered. Each opens its page on the Record.
  - **The Record tab**, on a batch's page in the ledger (Money, Papers, Impact, Record) and on the operator's batch page (Journey, Route Room, Execution, Paperwork, Record):
    - **the photos sent for it:** the label photo, with what Vision read and that it matched the export; destroyed at the godown, the before and after photos with Vision's four checks. Each opens whole in a sheet;
    - **the audit trail**, day by day: each agent's run from the case's feed, in its words, and each person's decision as the audit log keeps it, in their name and for whom they act. The kiranas' orders fold into one row ("24 kiranas · Rakesh Traders' scheme, Ordered 456 packets"), opened on request. Filters for Everyone, People or Agents, and a CSV;
    - **the yeses:** the plan's approval, the papers' review and the destruction's approval, each with who and when.
  - **The distributor's batch page** gains **Photos**: his label photo with what Vision read, and the destruction's two with Vision's checks, then Priya's yes on them and the credit note it issued. On the live workspace it reads his own facts' links, never Munchly's audit log.
  - **The clocks:** the audit log keeps wall time, the case and its feed the journey's. A case's lines are the batch's from the moment it opened (wall time) until its next case; the steps go in wall-time order, and each person's step is placed on the journey's clock between the feed's moments around it, so a compressed day, or a day length changed mid-journey, keeps them where they fell.
  - **The build:** design3 first (`ledger.js` `record`, `finance.jsx` RecordTab and its pieces, `brand.jsx` Batches and BatchRecord, `trade.jsx` DistPhotos, `screens.css`'s `rec-*`), then core (`record.ts` for the stub, `photos.ts` for the live facts and the days in India's time, `screens/record/`, `DistPhotos`, `Batches`, `BatchPage`, `RoleApp`, `model.ts`'s record part, `screens.css` verbatim). The workspace's address takes `?tab=` (`/report/MF-2407-116?tab=record`).
  - **The contract:** `WsRecord`, `WsRecordStep`, `WsRecordWho`, `WsLabelPhoto`, `WsPartnerCase.photo`, `WorkspaceApi.record()`; `contracts.sh` re-exported the OpenAPI.
  - **backend-api:** `GET …/cases/{ref}/record` (`services/journey/record.py`, `report.read`); the distributor's facts carry his label photo (`views.label_out`, in the client's time); the history uploads each batch's label photo. `hydrate.sh --photos CLIENT` puts the history's label photos in the photos bucket for a workspace built before this (no reset).
  - **Found on the way:** the photo times came back in UTC where the partner facts are in India time; "1 steps".
  - **Checks:**
    - backend-api 552 passed, 1 skipped (`test_record.py`, 5: the operator's record of a past batch, the roles, his photo, a compressed day keeping each step where it fell, and `--photos`);
    - the frontend gate passes: core 270 (`record.test.ts`, 10 new, holding the stub's record to ledger.js for every history batch and the story at five stages; the operator's goldens gain the Record tab, Batches' cleared months and the record screen), api 78, workspace 92 (5 new live tests: Priya's Record, the ledger page's tab, the cleared months opening on the Record, Rakesh's and Lakshmi Agencies' photos), admin 17, demo 5, console 3;
    - the live fixtures were regenerated, with each case's record;
    - the stub build was played through in the browser at 1440 and 390: Batches' months, a past batch's Record with its three photos and 23 steps, Rakesh's Photos tab;
    - the a11y spec gains the Record tab, its photo sheet and orders, and the distributor's Photos; the browser suites were not run (SC-55).
  - **Locally:** `hydrate.sh --photos munchly` put the twelve history label photos in the local photos bucket.
  - **Production:** the history's label photos go up with the hydrate job's `--photos,munchly,--allow-env,prod` once this is deployed; until then a past batch's label photo has no image there.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-143** (PR #123, merged; bug): CI on `main` had failed since SC-139, so Hosting never deployed SC-139 to SC-142.
  - **Found** after merging SC-142: the SC-139, SC-141 and SC-142 merges each failed CI. backend-api and the agents deployed, but Hosting's deploy depends on the build and was skipped. Production's four apps were still from before SC-139. The PRs had been merged before their checks finished.
  - **The build:** `scripts/no-seed.mjs` refused the live workspace build. Core's image glob bundled every photo under `design3/system/img`, and SC-139's evidence photos and SC-142's label photos are named for their batches (`MF-2409-117-before.webp`). The names showed in a chunk and in `service-worker.js`. The story's photos now live in core's `story-photos.ts`, which the workspace's live build replaces with an empty module (`workspace/src/lib/no-story-photos.ts`), as it does the stub. A live workspace reads every photo from backend-api's links; the stub build and the guided demo keep all 23.
  - **The secret scan:** gitleaks failed on SC-139's and SC-142's merges (112 findings on SC-139's) and passed on SC-141's, which left the fixtures alone. The likely cause is the fictional waste agencies' pollution-board authorisations (`"auth": "MPCB/SWM/NGP/0412"`) in the reference data and the regenerated live fixtures, which the generic-api-key rule reads as credentials. `.gitleaks.toml` extends gitleaks' own rules and allows only that shape. It was not run through gitleaks locally, which isn't installed here.
  - **Checks:** the frontend gate passes (core 270, api 78, workspace 92, admin 17, demo 5, console 3); the full build passes `no-seed.mjs`.

  - **After the merge:** CI on `main` passed and deployed backend-api, the agents and Hosting, so production runs SC-139 to SC-143. The history's label photos reach production's photos bucket only with the hydrate job's `--photos,munchly,--allow-env,prod`, which has not been run.
- **SC-144** (PR #124, merged): every photo loads under the kit's Skeleton shimmer, then fades in.
  - **The request:** "all pictures loading must have hydration effect loader as we have for other sections of the app, reusue dont need to desigm". No design round, on the maintainer's word: the kit's own Skeleton, reused.
  - **The build:** design3 first, then the port.
    - `screens/common.jsx` `Photo`, and core's `screens/common/Photo.svelte`: the Skeleton fills the photo's frame until the photo has loaded, then the photo fades in (240 ms; at once under reduced motion). A photo that fails reads "The photo did not load" (`.photo-failed`).
    - Used on the Record's photos and the photo opened whole, the distributor's destruction slots and his sent evidence, and Execution's card and the review sheet's destruction photos.
    - `.rec-big` holds its frame while it loads. `screens.css` is copied verbatim.
    - The camera's preview of the person's own photo is a local file and needs none.
  - **Checks:**
    - the frontend gate passes: core 270 (four goldens gain a space between the photos' tags), api 78, workspace 92, admin 17, demo 5, console 3;
    - on the stub build, every photo starts under its skeleton, which goes once the photo has loaded (opacity 1), and a photo pointed at a missing file reads "The photo did not load";
    - the motion spec counts `.skeleton` as a loading indicator. The browser suites were not run (SC-55).
- **SC-145** (In Review, branch `SC-145-dist-figures`): the distributor's Batches and Orders show how their figures add up.
  - **The request:** "For batches and order, this value is differing for distributors please check this and fix", then "if they are correct or not triage it, if all good leave it... but UI should have a way to know what the calculations show".
  - **The triage: the figures are correct.** Every cleared batch ends whole to the paisa: sold + credited = cost.
    - Batches leads with the credit: ₹66,918, and ₹7,821 for MF-2407-116.
    - Orders leads with the sales: ₹1,05,928, and ₹14,640 for MF-2407-116.
    - Together they make the cost: ₹1,72,846, and ₹22,461 for MF-2407-116.

    Neither page showed the sum. The values stay.
  - **Design first:** three options on one board in app v3, `SC-145 design review.html`:
    - A, the same sum on both pages (recommended);
    - B, how this adds up, on request;
    - C, one figure on both pages.

    The maintainer picked **A**. Designs, the build's stills and the decision are in `design3/designs/SC-145/`.
  - **The build** (design3 first, then core):
    - **The card:** both pages open with "How your 6 cleared batches add up": what they cost you = you sold + Munchly credited you. The page's own part is marked "this page"; the other is a button to its page. A bar shows the split, and a line says he ended whole.
    - **Each cleared batch** carries its own sum, the page's part first: on Batches "₹7,821 credited + ₹14,640 sold = ₹22,461", on Orders "₹14,640 sold + ₹7,821 credited = ₹22,461".
    - **Batches in a journey:** on Orders they keep their sales so far, which join the sum once they clear.
    - **Rounding:** the figures are whole rupees that add up as shown: the cost is the rounded sales plus the rounded credit. Where the paise round apart, that can sit a rupee from the Money tab's "What you paid" (Lakshmi Agencies' MF-2407-112: ₹40,763, against ₹40,763.50 paid).
    - **Where:** design3's `ledger.js` partners `sumOf` and `sumsOf`, and `trade.jsx` `SumCard`, `SumTerm` and `SumLine`; core's `partners.ts` `sumOf` and `sumsOf`, `SumCard.svelte` and `SumLine.svelte`, and `pt.ts` `clearedOf`, so both pages sum the same cleared batches.
  - **Checks:**
    - backend-api 552 passed, 1 skipped;
    - the frontend gate passes: core 273, with `partners.test.ts` holding both distributors' sums to ledger.js and Rakesh Traders' to the board's; api 78; workspace 93, with a new live test of Orders' sum; admin 17; demo 5; console 3;
    - design3's build was shot at 1440 and 390, light and dark, for both distributors (`build/`);
    - the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-146** (In Review, branch `SC-146-photo-loader-visible`; bug found by the maintainer): photos showed a black frame while they loaded.
  - **Found:** "photos dont show any loading effect, just black". On Rakesh Traders' Photos tab the label and After photos were black boxes with only their tags.
  - **The cause:** SC-144's skeleton was there but could not be seen. The kit's shimmer is a translucent tint (`--fill-2` to `--fill-3`, 7.5% to 12%), meant for a light card, and the photo frames (`.rec-shot`, `.cam`) are near-black. SC-144's check confirmed the skeleton was in the page, not that it showed.
  - **The fix** (design3 `common.jsx` `Photo` first, then core's `Photo.svelte`): the photo's skeleton sits on the page's own surface (`--surface-2`) under the shimmer, above the frame and under the photo's tag. The kit's Skeleton is unchanged.
  - **Checks:**
    - with the photos held back mid-load, design3 (light and dark) and core's stub build each showed the shimmer placeholders with their tags, then the photos once they landed;
    - the frontend gate passes: core 270, api 78, workspace 92, admin 17, demo 5, console 3.

- **SC-147** (PR #134, merged): every carton label photo carries a barcode, a QR code and the FSSAI licence, past and present.
  - **The request:** "food labels uploaded should have FSSAI approved bar code and QR code on the cartons. this should updated for all past batches and orders on munchly", with a real snack label for reference. The GST papers, its second part, are SC-148.
  - **Design first:** three options on one board in app v3, `SC-147 design review.html`:
    - A, the full statutory sticker (recommended);
    - B, the printed shipper carton;
    - C, today's label with a coded foot.

    The maintainer picked **A**, and answered the eval set's question with "Relabel all 73, everything in past and present to new format". Designs and the decision are in `design3/designs/SC-147/`.
  - **The label:** the product in a band (the veg mark on food), the ingredients, the net quantity and MRP, the batch and its dates boxed, the maker and customer care, the FSSAI mark and licence `10019022001234` (a cosmetic, Glowra's face wash and hair oil: its manufacturing licence and "use before", no FSSAI), the pack's EAN-13 and the batch's QR code, the storage line.
    - FSSAI asks for its mark and licence; the barcode is GS1's. Every number is fictional: GTINs under GS1 India's 890 with a company number no business holds (8900000), the QR a GS1 Digital Link on `id.munchly.example` (GTIN, batch, best-before), the fssai mark drawn here.
    - The batch, dates and MRP print as each batch's record has them, so Vision's check still matches.
  - **The label maker,** `design3/system/labels/` (`make.py labels`): `label.py` (the sticker as HTML, in five print styles), `codes.py` (EAN-13, ITF-14, the QR, GSTINs), `quad.py` (each base's blank sticker found), `compose.mjs` (the label warped onto the sticker in perspective, multiplied, any cover laid over a line, every code read back with Chromium's BarcodeDetector), `bases.sh` and 16 Qwen-Image base photos (`bases/`, with sidecars and `bases.json`).
  - **Rebuilt:**
    - the 14 label photos in `design3/system/img/labels/`: the history's twelve, the Masala Chips, and the Mango Drink's (new); `seed.mjs` copies the history's into backend-api;
    - all 73 of Vision's eval photos (`agents/evals/vision/plan.py` on the label maker): the clean ones, the five print styles, and hard cases made exactly (tape over a line, a thumb over both dates, a tear over the MRP, Pillow's blur, glare, darkness, angles, compression, a smear). `story-clean` and `mango` are design3's own photos for MF-2409-117 and MF-2410-118, byte for byte. A thumb now hides what it covers, so story-thumb is no-date, story-tape no-batch, story-dim unreadable and damaged has no MRP; `seen.json` is gone;
    - **LabelShot**, the example and the stub's photo (design3 `brand.jsx`, core `LabelShot.svelte`): the batch's own label photo; the typeset label where there is none, as on a live build. The workspace's live tests now leave the story's photos out, as a live build does.
  - **Vision's prompt** knows USE BEFORE and EXPIRY, and never takes a field from the barcode, the licence or the QR code.
  - **Not changed:** the five destruction "before" photos keep their large batch slips, which Vision's destruction check reads.
  - **Checks:**
    - the frontend gate passes: core 273 (30 goldens lose the typeset label), api 78, workspace 93, admin 17, demo 5, console 3; a live workspace build passes `no-seed.mjs`;
    - backend-api 552 passed, 1 skipped; agents 202 passed;
    - every visible barcode and QR code read back from its photo;
    - the evals were not run on live Gemini (on request only, about GBP 1 to 2).

- **SC-148** (PR #135, merged): the GST papers in Tally's layout, every party with a valid GSTIN, and the tax invoice with its e-invoice, past and present.
  - **The request:** "Same for GST bills and invoices, they should be proper with GST number and realistic as much as possible. I need you to update all images and invoices as needed for all past and present batches." Found: no GSTIN on the papers passed its check character; Lakshmi Agencies, Patil Distributors and Gupta & Sons had none ("GSTIN undefined"); Paperwork's PDFs named Munchly by its name only; the invoice lacked most of CGST rule 46; the credit notes named no invoice.
  - **Design first:** three options on one board in app v3, `SC-148 design review.html`:
    - A, as Tally prints it;
    - B, the e-invoice (recommended);
    - C, the app's paper, completed.

    The maintainer picked **B**, and answered the open question with "an invoice per order" for the kiranas, which is SC-153 ("before GST", with the scheme as a discount). Designs, the build's stills and the decision are in `design3/designs/SC-148/`.
  - **The parties** (design3 `data.js`, fictional, each PAN's digits 0000, never issued): Munchly Foods Ltd `27AAKCM0000M1ZN` (PAN, CIN `L15400MH2011PLC000117`, address, state code, email); Rakesh Traders `27ABHPR0000K1ZW`, Lakshmi Agencies `36AAJFL0000L1ZM`, Patil Distributors `27AAKFP0000P1Z8`, Gupta & Sons `23AAHFG0000G1ZB`, each with its address and pincode, PAN, state code, FSSAI licence, email and bank (`EXMP…` IFS codes); Agrawal Wholesale `22AAGFA0000A1ZW`, with its PAN.
  - **The tax invoice** (Tally's layout): the seller with his GSTIN, state, FSSAI licence and email; the invoice's number and date, the lot as delivery note and buyer's order, the token and the balance's hours, the buyer's truck, Raipur; consignee and buyer with GSTIN and state; place of supply; reverse charge; the e-way bill line ("not required: the consignment is under ₹50,000"); the line with its batch, best-before and MRP, IGST, the round-off and the total; the amount and the tax in words; the HSN summary; his PAN, the declaration, his bank, the signatory, the jurisdiction. Drafted, it reads "DRAFT, for Rakesh Traders to issue from Tally"; **issued**, "ORIGINAL FOR RECIPIENT" with its **e-invoice**: the IRN (SHA-256 of his GSTIN, the year, INV and the number, as the portal works it out), the acknowledgement number and date, and the signed QR code, a JWT of the invoice's key facts whose signature says it is illustrative. Worked out from the paper and its parties when drawn, never stored (`core/papers.js`: `sha256`, `qr`, `words`, `fy`, `einvoice`, `dispatchOf`).
  - **Munchly's credit notes** (price support, and the expiry notes under each policy) in the same layout: Munchly's identity, the distributor's, the reason, the rows, the credit in words, against the invoice Munchly billed the batch on (`MFL/{year}/{2300 + the batch's number}`, three days after it was made: the chips' `MFL/26-27/02417`, 21/05/2026), and why it adjusts no GST: a financial note, not under section 34, not reported to the portal.
  - **Also:** the e-way check and the ITC memo carry the GSTINs, the FSSAI checklist the licence; an issued invoice reads "issued" in the pack (DocCard) and "Issued by … from Tally".
  - **The build:** design3 first (`core/papers.js`, `data.js`, `ledger.js`'s `invoiceIssuedAt`, `finance.jsx` TallyInvoice and TallyCredit, `product.jsx` DocCard, `screens.css`'s `.tl`), then core (`papers.ts`, held to papers.js QR module for module by `papers.test.ts`; `TallyInvoice.svelte`, `TallyCredit.svelte`, `Paper.svelte`, `ledger.ts` `issuedWhen`, `PaperPack`, `DocCard`, `screens.css` verbatim).
  - **backend-api:** migration 0014 (`distributors.details`; 0012 and 0013 are SC-149's and SC-150's); `services/journey/identity.py`, the client's and the buyer's identity, set by hydrate's live build and topped up by Reset journey; the snapshot carries them, and the journey `invoiceIssuedAt`; the agents' case read gives Paperwork the client, the buyer, the balance's hours and the e-way threshold; issuing the invoice stamps its time and asks Paperwork to lay it out again, with its e-invoice.
  - **agents:** Paperwork's PDFs in the same layout (`tally.html`, `invoice.html`, `_credit.html`, `credit_note.html`, `expiry_note.html`); `tools/papers.py` works out the e-invoice, the words and the dispatch invoice as papers.js does (`test_papers.py`), and draws the QR with segno 1.6.
  - **The contract:** `WsDistributor` gains `stateCode`, `pan`, `fssai`, `email`, `bank`; `WsBuyer` `pan`; `WsClient` `pan`, `cin`, `address`, `state`, `stateCode`, `email`; the journey `invoiceIssuedAt`.
  - **Checks:**
    - backend-api 552 passed, 1 skipped (the story's journey test: issuing the invoice keeps its time, asks for its PDF again, and gives Paperwork the three GSTINs);
    - agents 206 passed (the issued invoice's IRN, acknowledgement and QR; the credit notes against the dispatch invoice);
    - the frontend gate passes: core 277 (`papers.test.ts`; the finance goldens in the new layout), api 78, workspace 94 (a new live test: the chips' issued invoice on the cleared moment, its IRN worked out in the test from the GSTINs), admin 17, demo 5, console 3;
    - the live fixtures were regenerated; every QR code drawn decodes with Chromium's BarcodeDetector;
    - the browser suites were not run (SC-55).
  - **Locally:** migrated, rebuilt with `hydrate.sh --reset`, then `--papers munchly --again`: Paperwork laid out all 44 of the history's PDFs afresh (each invoice issued, with its IRN; each credit note against its dispatch invoice). The day is 24 hours.
  - **Production:** CI deployed `3e7a4c6` (SC-147, SC-148 and SC-153), and SC-160 replaced production's data with local's, so the identities, the history's papers and the kirana invoices are there as locally.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-149** (In Review, branch `SC-149-overview-destroyed`): the console's Overview stops drawing what it recovered twice, and shows the food destroyed.
  - **The request:** "Console dashboard graph across all clients seems to be duplicating the recovered graph, see if we can add destroyed food into the graphs too... Agents at work and other sections looks fine dont touch them". The Recovered figure's sparkline and the Recovered, by day card drew the same series under the same total, and nothing recorded what a closed batch destroyed.
  - **Design first:** three options on one board in platform v3, `SC-149 design review.html`, each the console on a review world (Munchly and four fictional clients, 180 days of batches):
    - A, food by day (recommended);
    - B, recovered and written off;
    - C, food so far.

    The maintainer picked **A**. Designs, stills, the build's stills and the decision are in `design3/designs/SC-149/`.
  - **The card, Food, by day:** each day's kilos kept out of landfill (sold or given) rise from one baseline in the console's green, and the kilos destroyed (no channel took them) hang under it, hatched in clay, on one scale; the headline gives both totals and the share saved, the tooltip and Show as a table add the packs destroyed, what the day recovered and the batches closed. The Recovered figure and its sparkline stay; Agents at work and the rest are unchanged.
    - **Colours:** validated with the dataviz script on the card's surface: `#167a52` / `#c2410c` in light (CVD ΔE 9.1), `#34a571` / `#e0662c` in dark (9.0); the ledger's red failed against the green (protan ΔE 1.7). The destroyed figure's text 6.0:1 and 7.4:1; a 0 kg figure stays in the plain ink.
    - **Motion:** the bars grow once (420 ms, a few ms apart), a reading moves them, and a day that keeps more shows what it kept over today's bar; at once under reduced motion.
  - **The data:** a closed batch keeps the packs it destroyed, `sc.batches.destroyed` (migration 0012), from the journey's ledger (destroyed by the client or at the godown) and from the synthetic world's hydrate (about 4 in 10 batches leave 2 to 25%, seeded by the batch, so the rest of the world draws as before). Kilos come from each SKU's `kg_per_unit`: hydrate reads it from the pack size; the migration fills in a missing one from the SKU's name, and backfills a journey batch's packs from its latest cleared case's ledger.
  - **The contract:** `DayFigures` gains `keptKg`, `destroyedKg` and `destroyed`; `Dashboard` gains `food` (`FoodFigures`, with the range before). `platform.js`, `platform.ts` and `dashboard.py` agree, held by the fixtures; `contracts.sh` re-exported the OpenAPI.
  - **The port:** `FoodChart.svelte` replaces `RecoveredChart.svelte`; `+page.svelte`'s card; `overview.ts` (`kg`, `kgAxis`, `savedShare`); `console.css` verbatim. The console's e2e spec reads the table as Food, by day.
  - **Checks:**
    - backend-api 554 passed, 1 skipped (2 new: a closed batch's food, and no more destroyed than it holds);
    - the frontend gate passes: core 273, api 79 (1 new), workspace 93, admin 17, demo 5, console 3;
    - design3 and the console's mock build played through on the review world at 1440 and a phone, light and dark: the tooltip, the table, 90 days, no page errors;
    - the browser suites were not run (SC-55).
  - **Locally:** migrated to 0012: Munchly's three godown batches read 381 packs destroyed, and every SKU has its kilos. The synthetic clients' batches closed before read 0 destroyed until the next `hydrate.sh --reset`.
  - **Hosting:** design3's `dist/` is rebuilt; the hosted console loads commit `4632839` (every pinned file checked on jsDelivr first); it renders, the card in its empty state on the prototype's seed.

- **SC-150** (PR #128, merged): the apps' addresses on Firebase Hosting's own domain, and the landing page's bar links the console and the workspace.
  - **The request:** `<client>.smartclearance.com` becomes `<client>-smartclearance.web.app`, `smartclearance.com` becomes `smartclearance.web.app`, and `console.smartclearance.com` becomes `smartclearance-console.web.app`. On the landing page's bar, Sign in and Book a demo go, replaced by two links: Console and Workspace.
  - **The addresses:** design3 (`data.js` composes Munchly's as `munchly-` + the platform domain; `platform.js`, the console, the landing page's workspace section), the port, backend-api (`workspace_domain` is `smartclearance.web.app`, and a client's address is `{slug}-{domain}`, the reserved and taken messages included), the tests, goldens, live fixtures and the docs. Migration `0013` rewrites each client's stored address and the workspace doc's platform domain (dry-run on the local data: all seven clients moved).
  - **Kept as they were:** staff email addresses and the staff email checks (`@smartclearance.com`, an identity, not an address of the apps); infra's notes on registering the custom domain later; the design records under `design3/designs/` and the images' prompt sidecars.
  - **The bar** (design3 `site.jsx` first, then `Nav.svelte`; `site.css` verbatim): the appearance menu, **Console** where Sign in was, **Workspace** as the primary pill where Book a demo was, each opening another tab. A phone keeps Console in the bar, and its menu sheet offers Workspace and Console. Book a demo stays in the hero and the close; Find your workspace stays in the footer. The maintainer named the change outright, so no design round.
  - **Where they point:** the admin and console builds default `PUBLIC_APP_URL`, `PUBLIC_CONSOLE_URL` and `PUBLIC_SITE_URL` to the live web.app addresses (CI sets none of them, so the live pages linked the Claude Design prototypes). The guided demo's link is unchanged.
  - **Checks:** the frontend gate passes (core 273, api 79, workspace 93, admin 17, demo 5, console 3); backend-api 554 passed, 1 skipped; the landing page's build shows the bar at 1200 and on a phone, with no console errors. The admin's e2e, a11y and parity specs follow the new bar (unrun, SC-55).
  - **Hosting:** design3's `dist/` is rebuilt; the hosted Claude Design pages stay on their pinned commit.

- **SC-151** (In Review, branch `SC-151-expiresoon-listing-card`): Execution's Lister · ExpireSoon card reads as a marketplace listing, not a raw HTTP call.
  - **The request:** "Expire Soon UI work, currently showing HTTP API call, can we improve this marketplace integration piece".
  - **Design first:** three options on one board in app v3, `SC-151 design review.html`, each in five states (queued, live, countered, awarded, collected):
    - A, the lot as listed (recommended);
    - B, the handshake;
    - C, the terms.

    The maintainer picked **A**, and kept the raw call on the card, closed. Designs, stills and the decision are in `design3/designs/SC-151/`.
  - **The card** (design3 `brand.jsx` `ListerCard` first, then core's `ListerCard.svelte`):
    - the lot as buyers see it on ExpireSoon: the pack, the price against MRP, best before, the seller, the listing id; once won, the buyer, the price and the token;
    - what only the client sees: the reserve, and the territories it is hidden in;
    - four steps with the case's own times: Listed, Bid, Won, Collected;
    - Open on ExpireSoon, and **The API call**, which opens the request and response under it.

    No contract or backend change.
  - **Checks:** the frontend gate passes (core 273, with 9 Execution goldens updated; api 79, workspace 93, admin 17, demo 5, console 3). design3 and the port's stub build were shot at 1440 and 390, light and dark. The workspace's and the demo's a11y specs open the call; the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-152** (In Review, branch `SC-152-button-pending`): a button that calls the network says what it is doing, in every app.
  - **The request:** "UI/UX glitches, especially on button clicks across all apps when it makes network calls … currently it just becomes blank or hangs for sometime."
  - **Found:** the kit's loading button hid its label (`color: transparent !important`) and its spinner inherited the transparent ink, so a waiting button was an empty pill, in design3 and every app. Of about 71 buttons that call the network, 45 showed nothing until the answer; 13 workspace screens said it worked before the answer (the live source never rejected); the console's controls snapped back until every query was read again.
  - **Design first:** three options on one board in app v3, `SC-152 design review.html`, each a lab of real buttons from the four apps with the network simulated: A, says what it's doing (recommended); B, the fill; C, act at once. The maintainer picked **A**, with the spinner fix in the same build. Designs, stills and the decision are in `design3/designs/SC-152/`.
  - **The button** (the kit's, then core's `Button`): `action` (it waits on it; a rejection is the refusal), `busy` and `done` words, `loading` and `error` for a screen that drives it, `slow`. It keeps its width, says what it is doing with a spinner in its own ink and a line creeping along its foot; a tick and the done word, or a shake and the reason under it with Try again; past 3 s it says it is still working. Nothing shows under 100 ms; a shown wait stays 400 ms. A button given none of these is the plain button (goldens unchanged).
  - **Also:** Alert waits on an action that returns a promise; `SaveNote` and `save()` (the kit's `useSaving`) for a Switch or Segmented that saves; the workspace's `RouteLine` while a screen reads its batch; sign-out says when it fails, in both apps.
  - **The workspace:** a step sent `inline` (`SendOptions`) rejects with the API's words instead of raising the band, and shows once it has gone through, never before. **The console:** `Console.act` resolves once saved (the console reads itself again without waiting) and rejects with the API's words; controls keep the value pressed; a menu item waits on its "…" button.
  - **Checks:** the frontend gate passes (core 278 with 5 new, api 79, admin 17, console 8 with 5 new, workspace 96 with 3 new, demo 5). The workspace's sign-in was pressed in a headless browser on the stub build; the console agent played its states in the browser pane on the mock build. The browser suites were not run (SC-55); the motion specs count `.btn-arc` as a loading indicator.
  - **Hosting:** the hosted landing page and console load commit `852020d`; every pinned file was checked on jsDelivr first, and both pages render. The app, demo and design-system pages stay on their pins; design3's design-system page crashes on load, which predates SC-152 (a task is offered for it).
- **SC-153** (PR #136, merged): a tax invoice from the distributor for every kirana order, past and present.
  - **The request:** SC-148's board asked whether each shop's order should get its own tax invoice; the maintainer answered **"An invoice per order"**, then **"Before GST"** (₹18.00 effective, plus CGST and SGST at 2.5% each, the shop paying the total) and **"Scheme discount"** (the packets at ₹21.60, less 16.67%, so every invoice equals what the ledger counts).
  - **Design first:** three options on one board in app v3, `SC-153 design review.html`, each the app on its stub with only its screens changed:
    - A, with each order (recommended);
    - B, the bill book;
    - C, as PDFs.

    The maintainer picked **A**. Designs, the build's stills and the decision are in `design3/designs/SC-153/`.
  - **The invoice** (money.js `kiranaInvoice`, money.py `kirana_invoice`, held by fixtures): Tally's tax invoice (SC-148's layout) for a B2C supply within the state: the distributor's identity, the shop as buyer (Unregistered) with its address and pincode, the place of supply, every packet at the pack price less the scheme's discount, CGST and SGST as rows of their own, the total to the rupee, the amounts in words; no IRN. Ganesh ji's 24 packets: ₹518.40 less ₹86.40 = ₹432.00, ₹10.80 + ₹10.80, round-off ₹0.40, **₹454**.
  - **Numbered** in each distributor's own sales series (`data.js` `series`, `world.js` `NUMBERS` `kirana.<id>`): the history's 214 as they were placed, two minutes apart from each batch's orders step (Rakesh Traders `RT/26-27/1164` to `1278`, Lakshmi Agencies `LA/26-27/0873` to `0971`), then the story's from the series' next (the chips' 31: `RT/26-27/1279` to `1309`). Issued as the shop orders, dated then.
  - **Where it shows** (design3 first, then core):
    - the kirana's order page: its figures as the invoice has them (before GST, the GST, what he paid, his margin: ₹266 where it read ₹288) and "Tax invoice · RT/26-27/1279", opening in a sheet with its PDF; his Orders name each invoice; the ordering screen's figures follow it;
    - the distributor's Orders: the scheme's row names its invoices and the GST he collected; each shop's order shows its invoice and total, and opens it; his batch's papers gain the sales register;
    - Priya's pack: one card, "Tax invoices to kiranas", the register beside it, each number opening its invoice.
  - **Also:** the order page's free packets ("2 in every 12") read more paid than the ledger counted on an order not in twelves (73 of the history's: Mauli Kirana's 10 packets read ₹288 where the ledger had ₹240); as a discount on the invoice every order equals the ledger.
  - **backend-api:** migration 0015 (`case_orders.invoice`); `steps.order` issues it in the distributor's series and asks Paperwork for its PDF (`journey.step kirana`); the case detail, the shops' list and the partner facts carry it (a kirana its own); `GET …/documents/{ref}/kirana.{shop}` serves its PDF to the shop, its distributor and Munchly; `hydrate.sh --papers` lays out any that lack one; the history numbers them as ledger.js does, and Reset journey puts the series back.
  - **agents:** Paperwork's `kirana_invoice.html`, laid out as `{client}/{ref}/kirana-{shop}.pdf`.
  - **The contract:** `WsKiranaInvoice`, on the journey's orders, `KiranaOffer` and `WsPartnerCase.kiranas`; `contracts.sh` re-exported the OpenAPI.
  - **Found on the way, fixed on SC-148:** on a phone the Tally papers' blocks ran past the paper's right edge; a narrow paper now keeps its one track to the paper's width and hides the items' per column, so every header stays whole.
  - **Checks:**
    - backend-api 567 passed, 1 skipped (the story's invoices numbered from RT/26-27/1279, who may open a PDF; the history's 214 held to ledger.js through the partner facts; `--papers` asking for the invoices without one);
    - agents 207 passed (the kirana invoice laid out and reported);
    - the frontend gate passes: core 285 (`invoices.test.ts`: money.js's figures, ledger.js's story and history invoices; the goldens follow), api 79, workspace 100 (3 new live tests: Ganesh ji's invoice and its PDF, Rakesh's shop and register, Priya's pack), admin 17, demo 5, console 8, after merging main (SC-149 to SC-152, SC-154);
    - the live fixtures and the seeds were regenerated; design3's `dist/` is rebuilt;
    - the browser suites were not run (SC-55).
  - **Locally:** migrated to 0015, rebuilt with `hydrate.sh --reset`, and `--papers munchly` had Paperwork lay out the history's 214 kirana invoices. The day is 24 hours.
  - **Hosting:** the hosted app page stays on its pinned commit.
- **SC-159** (In Review, branch `SC-159-history-photo-ids`; bug): a rebuilt history kept an old label or evidence photo where its object name repeated.
  - **Found** while readying the local history for SC-160: MF-2406-105's label photo was still the one from before SC-147, though the other eleven were SC-147's.
  - **The cause:** `hydrate.sh --reset` builds the world with seeded ids, so a rebuild could give a history photo the object name it had before; the bucket is written once and never replaced (`Storage.write`), so the old photo stayed. `--photos` counted every photo as put, written or not.
  - **The fix** (`services/journey/history.py`): the history's label and evidence uploads take fresh ids (`_fresh`); `put_labels` returns what it wrote and what was already there, and `--photos` prints both.
  - **Checks:** backend-api 568 passed, 1 skipped; the new test (`test_record.py`) builds the history on seeded ids and holds each photo to a fresh name and its batch's own bytes, and fails without the fix.
  - **Locally:** rebuilt on the fix; all 18 history photos the case details serve (12 labels; the 3 godown batches' before and after) match the reference byte for byte. Paperwork laid out every history paper and the 214 kirana invoices with the current templates, run in process, since another session's agents worker (SC-158, on `main` from before SC-147) shares the local subscriptions, dropped the kirana events and laid out 10 batches' papers with the old templates.

- **SC-160** (In Review; operations): production's data replaced with local's after SC-147, SC-148, SC-153 and SC-159, asked for by the maintainer ("sync all photos, documents, papers, postgresql and big query data to production").
  - **Done (11 Oct)** with `backend-api/scripts/sync.sh` (SC-136), production at schema 0015 after CI deployed `3e7a4c6`: rehearsed into a scratch database first, then the on-demand backup `1791675143836` (23:32 UTC, 10 Oct), the database (37 tables, 5,882 rows, 19 sequences), the photos, docs and exports buckets, and BigQuery's seven tables. The plan after it shows every table equal.
  - **Read back through production's API:** all 18 history photos match the reference; the history's tax invoice (issued, with its IRN), credit note (against `MFL/25-26/02405`), a kirana invoice (`RT/26-27/1164`, ₹605) and an agency's destruction certificate (`OCE/DC/26-27/0218`) serve as PDFs; the ledger reads Q2 FY27 as 12 batches and ₹2,20,383.58; Munchly's journey is at day 0 on 24-hour days.
  - **Replaced with it:** production's own journeys since SC-136 (31 cases, 614 kirana orders), its 2 devices registered for pushes (no push reaches them until they register again from the app), and its idempotency keys. Objects only production had stay in its buckets for the backup, until the 30-day lifecycle removes them.

- **SC-154** (In Review, branch `SC-154-hero-film-vertex`): the hero film, live action on Vertex AI. The landing page's film tells the journey with real people, made with Google's models.
  - **The request:** "a really awesome video projecting the journey of the application in about 15 seconds", with "realistic human characters instead of cartoon", showing brands, distributors, kiranas, donations and the staff sale, made with Google's video and image models, with a plan of the Vertex AI models and their prices; professional and aesthetically pleasing.
  - **The maintainer's decisions (10 Oct):** tracked scripts rather than a plugin; the design round as storyboards plus one Veo 3.1 Fast draft clip per option at 720p without audio (about $8); the final on Veo 3.1 at 1080p without audio (the hero plays muted; silent video is half the price); no night act, both themes starting on the same frame; two money gates, each answered with a figure.
  - **The models and prices** (Google's Vertex AI pricing page, 10 Oct, USD a second without audio): Veo 3.1 0.20 at 720p or 1080p, 0.40 at 4K; Fast 0.08 / 0.10 / 0.25; Lite 0.03 / 0.05. Nano Banana 2 (`gemini-3.1-flash-image`) 0.067 an image at 1K, 0.101 at 2K; Nano Banana Pro (`gemini-3-pro-image`) 0.134 and 0.24 at 4K. Gemini Omni Flash (about 0.10 a second, audio forced, 10 s at most, no first or last frame) is the alternative not taken. Veo 3.1's rules: 4, 6 or 8 s clips; 1080p, 4K, reference images and a last frame need 8 s; extension is 720p only; `allow_adult` on every image-based mode; SynthID in every frame.
  - **The tooling,** `design3/tools/vertex-media/` (uv, `google-genai` 2.29): `veo.py` (doctor, generate, poll; the rules checked and the price printed before any call, the operation name written to the sidecar before the wait), `nano.py` (sheets, keyframes, edits), `assemble.py` (the cut: trims, dissolves, the loop closed on itself), `sidecar.py`, `seams.py`, `frames.py`, `cost.py`; `design3/tools/capture.mjs` records an option page on the frontend's Playwright. Found on the way: the registry lists `-preview` ids for the image models that answer 404, and only the GA ids serve, on the `global` endpoint, at a few images a minute (`_vx.retry` waits out the 429s); a `genai.Client` held only as a temporary is collected mid-request ("client has been closed"); a video Veo's filter holds back is not charged.
  - **Design first:** three options on one board in platform v3, `SC-154 design review.html`, each the real hero with a Veo 3.1 Fast draft and a storyboard of Nano Banana 2 keyframes from three character sheets (the brand's planner, the distributor, a kirana owner, all fictional; every pack unbranded; three keyframes cleaned of lettering by an edit):
    - A, Four hours, four places (recommended);
    - B, One carton, hand to hand;
    - C, One yard, one day.

    The maintainer picked **A**, with the page's camera lean at 1.25 and the build at 1080p with no 4K pass. Designs, the cast, the keyframes, the drafts, the stills, the prompts and the decision are in `design3/designs/SC-154/`.
  - **The film,** `design3/site/assets/media/one-journey.mp4`: four 8 s Veo 3.1 clips at 1080p from the keyframes (the bay at dawn, the godown counter at noon, the yard at violet dusk with the food bank's van and the staff-sale table, the office in the evening, the two of them reading a dashboard), each trimmed to 4.3 s and chained through 0.5 s dissolves, the tail dissolving into the head: 15.21 s, 24 fps, 6.18 MB; the loop steps by 2.9 against a median frame step of 2.3. The maintainer's three notes on the first cut led to retakes: the distributor's second pair of glasses (the keyframe edited, two retakes), cash mixed with the packets at the staff-sale table (a packet and a clipboard, no money), and the chai toast in the office (a new keyframe with the dashboard on a monitor). The posters `hero-day` and `hero-night` are its first frame, with 48 px previews; the town posters and `one-day.mp4` are retired.
  - **The hero** (design3 `site.jsx`, `site.css`, `loader.js`, the page; then the port's `media.ts`, `plates.ts`, `figures.ts`, `Hero.svelte`, `Site.svelte`, `+page.svelte`, `site.css` verbatim, the README and the loader spec): the chapters in the journey's order (06:30 the brand and the distributor, 11:00 the kiranas, 18:00 the food bank and the staff sale, 21:30 Paperwork); `FILM.bounds` [0, 3.55, 7.35, 11.15], lean 1.25; the night offset gone. `Site.svelte`'s loader map still named the retired `business.webp`, so a theme switch's poster preload had fallen back to a 404; it names the new posters.
  - **Contrast, measured with the copy hidden** against the pixels under each element at two moments of every chapter: live action is brighter under the copy than the diorama, and the heading's 90th percentile fell to 2.4:1 on a phone at the noon chapter. The shade's foot and left band are stronger, and phones get a darker band behind the copy: heading 5.5:1 at 1440 and 4.6:1 at 390 (90th percentile, large text), sub 12.0:1 and 8.9:1, strip 15.3:1 and 15.5:1.
  - **Checks:** the frontend gate passes (lint, check, tests: core 273, api 79, admin 17, console 3, workspace, demo 5); design3 and the build played through at 1440 and 390, light and dark: no console errors, the loader lifts, the film plays from 0.3 s and loops, the four chapters light at their bounds, Pause and Play by keyboard. The browser suites were not run (SC-55).
  - **Cost:** $18.76 (£14.07) in all: the design round $5.66, seven final clips $11.20 (one more was filtered, free) and three keyframe edits, against the $45 cap.
  - **Docs:** AGENTS.md (the loop exemption names the new film; the Vertex rule), DESIGN.md (the hero film's material), this file's tool list.
  - **Hosting:** design3's `dist/` is rebuilt; the hosted landing page and console load commit `699c1af`, the branch brought up to date with main (SC-151, SC-152, SC-155), so both carry SC-152's buttons too; every pinned file checked on jsDelivr and GitHub raw first, and the landing page plays the film from it with no console errors.
- **SC-156** (In Review, branch `SC-156-outreach-card`): Execution's Outreach card drops the sample message and says where the kirana scheme stands.
  - **The request:** "messages are sent to multiple kiranas, no need to show them here"; "this block should show something like offer window over like other channels"; "Dont change anything with the VAN delivery map".
  - **Design first:** three options on one board in app v3, `SC-156 design review.html`, each in five states (queued, open, filled, window over, delivered):
    - A, the scheme's stops (recommended);
    - B, the window first;
    - C, the shops.

    The maintainer picked **A**. Designs, stills and the decision are in `design3/designs/SC-156/`.
  - **The card** (design3 `brand.jsx` `SchemeCard`, core `SchemeCard.svelte`): the scheme as the shops see it, the figures, the offer window as one line filled by the time gone, four stops with their times (Sent, First order, Closed, Van round), the cluster map untouched, the latest orders, and **The push, as sent** behind a button. The badge follows: queued, open, filled, window over, delivered.
  - **The data:** the stub's offer carries `closesAt`; backend-api's case view and the contract carry `closedAt`; the live projection carries both and `elapsed`.
  - **Checks:** backend-api 554; the frontend gate passes (core 273 with 9 goldens updated, api 79, workspace 95 with 2 new live tests, admin 17, demo 5, console 3); the e2e and a11y specs follow the card; the browser suites were not run.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-157** (In Review, branch `SC-157-esg-dashboard`, stacked on SC-156): Supply chain's ESG and food-waste dashboard, live from the ledger.
  - **The request:** "Supply chain can have some cool ESG & food waste savings dashboard", with the console's Food kept out of landfill card as the reference.
  - **Design first:** three options on one board in app v3, `SC-157 design review.html`, each the app itself on the stub:
    - A, Impact, its own page (recommended);
    - B, the Impact reading, grown;
    - C, the flow.

    The maintainer picked **B**, and a small card on the Command Center. Designs, stills and the decision are in `design3/designs/SC-157/`.
  - **The Impact reading** keeps its headline and gains three tiles against the quarter before (with sparklines), Food by week (SC-149's form, with a table view), Where the kilos went and By distributor or product, over the period's batches. **The Command Center's card** reads the quarter so far and opens the Ledger on Impact (`/report?reading=impact`).
  - **The figures:** `core/ledger.js` `dashboard()` and `impactPeriod()`, and core's `impact.ts` held to them; derived from the ledger's rows, so the live workspace needs no new route. The inks are SC-149's, validated on the app's surfaces.
  - **Checks:** the frontend gate passes (core 276 with 3 new, api 79, workspace 97 with 2 new, admin 17, demo 5, console 3); the a11y spec scans the reading, its table and the card; the browser suites were not run.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.

- **SC-161** (PR #141, merged): Munchly Chips E2E checks what SC-139 to SC-157 built, and a recorded run, asked for by the maintainer ("run munchly chips happy path end to end journey flow, verify each and every step, especially the new features that developed").
  - **The suite** (`frontend/workspace/tests/journey/features.ts`, called from `chips.ts` as the journey reaches each feature):
    - the label photo's EAN-13 and QR code read back with Chromium's BarcodeDetector, and Vision's read (SC-147);
    - Execution's ExpireSoon and Outreach cards, each at three states with its stops, the API call and the push behind their buttons (SC-151, SC-156);
    - a tax invoice for every kirana order, the first shop's order page and invoice, the sales register, every PDF (SC-153);
    - the issued invoice's e-invoice (its IRN worked out from the GSTIN and number), the GSTINs, the credit note against the dispatch invoice, "issued" in the pack (SC-148);
    - nothing to destroy under the godown policy (SC-139);
    - the Record, with the photo loader (SC-142, SC-144, SC-146), and Rakesh's Photos;
    - Rakesh's effective prices and sums on Orders and Batches (SC-141, SC-145);
    - the Impact dashboard and the Command Center's card (SC-157);
    - the console's Food by day and Munchly's web.app address (SC-149, SC-150);
    - every button the run presses, watched as it waits (SC-152).

    Three new steps: `record`, `impact` and `console` (20 in all).
  - **The run of 11 Oct** (`runs/2026-10-11/REPORT.md`; the 8 min 46 s recording local): passed in 8 min 45 s, 99 steps, from a reset, every figure the story's. Four shorter runs before it stopped on the new checks' own selectors; no app code changed.
  - **Findings, not fixed:**
    - Rakesh's sums on Orders and Batches leave out the chips once they clear ("the batch still in a journey"), as design3's `ledger.js` does (offered as a separate task);
    - the kirana's order button tells a screen reader "Working" and "Done", its Hindi words being snippets.
  - **Checks:** the frontend gate passes (core 288, api 79, workspace 104, admin 17, console 8, demo 5). The day is back at 24 hours.

- **SC-162** (PR #142, merged; bug found by Munchly Chips E2E, SC-161): a batch whose journey has cleared is one of the distributor's cleared batches.
  - **Found:** once the chips cleared, Rakesh's Batches still listed them under "In a journey now" (stop Report). His sums counted only the history's six batches. Orders said their ₹21,546 "sold from the batch still in a journey joins the sum once it clears".
  - **The cause:** core's `clearedOf` and design3's `distBatches` took any phase but watching as in a journey, and design3's sums took only the history.
  - **The fix,** design3 first (`ledger.js` `distBatches` `done`, `storySum`, `sumsAt`; `trade.jsx` DistBatches and DistOrders), then core (`partners.ts` `storySum`, `sumsOf` with the story's; `pt.ts` `inJourney`, `storyCleared`, `clearedSums`; DistBatches, DistOrders):
    - Batches lists the cleared batch in its cleared month with its sum, and no longer under "In a journey now";
    - Orders gives its row its sum, and counts only a batch still under way as "still in a journey";
    - both sums count it: Rakesh's seven come to ₹1,27,474 sold + ₹75,686 credited = ₹2,03,160 on 9 credit notes, the chips ₹21,546 + ₹8,768 = ₹30,314.

    On the live workspace it comes from his partner facts. In design3 and the stub, the story's own figures count once Impact has posted. No design round: one obvious fix.
  - **Checks:**
    - the frontend gate passes (core 291, api 79, workspace 105, admin 17, console 8, demo 5);
    - core's sums are held to ledger.js at stages 8 and 9, and Rakesh's stage 9 goldens follow;
    - a live test on the cleared moment fails without the fix;
    - backend-api 568 passed, 1 skipped (only the seed manifest changed);
    - Munchly Chips E2E now checks it;
    - design3 and the local live app read the same.
- **SC-163** (PR #143, merged; bug found by Munchly Chips E2E, SC-161): a button's status line says its own words when they are markup.
  - **Found:** the kirana's order button gives its words as Hindi snippets (ऑर्डर हो रहा है…). A screen reader heard "Working" and "Done", because core's Button read its words into the status line only when they were a string.
  - **The fix** (core's `Button.svelte`): the status line renders the button's busy and done words in whatever form, so the Hindi keeps its `lang`. "Working" and "Done" stay for a button given none. design3's kit already did this (`busy || "Working"` renders markup), so design3 needed no change. The order button is the only one with markup words.
  - **Checks:** the frontend gate passes (core 290, with two new Button tests; the Hindi one fails without the fix; api 79, workspace 104, admin 17, console 8, demo 5).
- **SC-164** (PR #147, merged): the demo film plays on the landing page when Watch is pressed, in a theatre over the page, from YouTube.
  - **The request:** host SC-158's 1080p demo film so that the landing page plays it on a click, as spoileralert.com does (its video is a Wistia embed in a section of its own), and the options on Google Cloud.
  - **The options given, and the answers (11 Oct):**
    - Firebase Hosting in the build: it serves byte ranges (the live hero film answers 206) and caches at the edge; 360 MB a day free, then $0.15/GB.
    - A public Cloud Storage bucket: about $0.12/GiB.
    - The Transcoder API to HLS: about $0.45 once.
    - YouTube.

    The maintainer chose **YouTube, unlisted**. They also chose: the film plays only on request, under a client-neutral poster; the guided demo is offered when it ends; and the label reads "Watch the 5-minute demo".
  - **Design first:** three options on one board in platform v3, `SC-164 design review.html`, each built on the real landing page:
    - A, the theatre (recommended);
    - B, a section of its own (Spoiler Alert's);
    - C, in the hero.

    The maintainer picked **A**. Designs, stills, recordings and the decision are in `design3/designs/SC-164/`.
  - **The theatre** (design3 `site.jsx`, `site.css`, then the port's `DemoFilm.svelte` on bits-ui's dialog):
    - every Watch (the hero, the pill, the close) opens a dark room over the page, the film as large as the window allows;
    - under it, the twelve chapters as chips (the one playing marked, a click to jump) and "Read the film instead", its 40 captions by chapter;
    - Escape, Close or the scrim return focus to the Watch that opened it, and the page never scrolls behind it;
    - the hero's own film holds while the theatre is open;
    - where the film ends: "One batch, start to finish." with Try the guided demo, Book a demo and Watch again.
  - **YouTube:** the film is [youtu.be/EWFLqM3oHYU](https://youtu.be/EWFLqM3oHYU), unlisted, on the maintainer's channel (@arundutta3411).
    - The maintainer dragged the crf-18 master into YouTube Studio, since Claude in Chrome uploads at most 10 MB. The rest was set in Studio:
      - the title "Smart-Clearance: the 5-minute demo";
      - `youtube-description.txt`, whose 12 chapters YouTube shows;
      - not made for kids, AI use disclosed, embedding allowed, Unlisted.
    - Its oEmbed answers 200.
    - The player is made on `youtube-nocookie.com` through the IFrame API, which loads only after the first Watch (`youtube.ts`).
    - The id is the default of `PUBLIC_DEMO_FILM` and design3's `DEMO_FILM.youtube`. `PUBLIC_DEMO_FILM=off` makes every Watch open the guided demo, as before.
  - **The poster** is the master's frame at 0.5 s, before the title card, which names the client. A square of it is the pill's thumbnail (`site/assets/plates/film-*`, with sidecars).
  - **The chapters and captions** (`site/assets/media/demo-film.json`) and the YouTube description's chapter list come from SC-158's own timeline (`designs/SC-164/transcript.py`). They are read only when the theatre opens. AGENTS.md records the film as the one exception to SC-28.
  - **The guided demo's link** (`PUBLIC_DEMO_URL`) defaults to the live smartclearance-demo.web.app, where it was the Claude Design prototype.
  - **Checks:**
    - the frontend gate passes: core 293, api 79, admin 22 (5 new: the chapters, the YouTube loader and player), console 8, workspace 105, demo 5;
    - design3 and the port's build were played through on the uploaded film:
      - nothing of YouTube loaded before Watch;
      - Enter opened the theatre on the no-cookie host, with its title;
      - the Detect chapter jumped to 0:56, where its caption is, and was marked;
      - the words opened;
      - the film's last seconds ended on the end card;
      - Escape gave focus back with the page where it was;
    - the same was played from the pill and the close, at 1440 and 390, light and dark, with YouTube's own sample video before the upload;
    - a build with `PUBLIC_DEMO_FILM=off` links all three Watch buttons to smartclearance-demo.web.app;
    - the keyboard spec gains the theatre, with YouTube stubbed. The browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt; the hosted landing page on Claude Design stays on its pinned commit.
- **SC-165** (In Review, branch `SC-165-landing-day-scroll`): the landing page is always in day, its wordmark white over the film, and the bar's links and its brand glide.
  - **The request** (with a screenshot of the live hero):
    - remove the light/dark selector, and keep the landing page in day;
    - the wordmark, barely visible over the film, in white;
    - the bar's links scrolling smoothly again;
    - the logo scrolling smoothly to the top.

    The maintainer named each change outright, so there was no design round (as SC-150).
  - **The causes:**
    - the page followed the device or a saved choice, through the bar's appearance menu and the footer's Light/Dark/Auto switch;
    - the kit's `.wordmark` sets its own ink, so it stayed dark green on the clear bar;
    - `scroll-behavior: smooth` sat on `.site`, the scroller before SC-60. The page now scrolls the window, so the links jumped.
  - **Always day:**
    - the kit's and core's `ThemeProvider` take a `fixed` theme, which ignores the device and neither reads nor changes the saved choice the other apps keep;
    - the landing page fixes day (design3's `Root`; admin's layout on `/` only, so `/ds` keeps both themes);
    - the loader names day before the first paint;
    - `hooks.server.ts` turns `app.html`'s pre-paint theme and the browser bar's dark colour to day on `/` (`app.html` stays the file every app shares);
    - only the day poster is preloaded;
    - the appearance menu and the footer's switch are gone, and the loader's dusk and dawn no longer play.
  - **The wordmark** takes the bar's ink: white over the film, the page's ink on the glass (`.nav-brand .wordmark`).
  - **Gliding:** `html:has(.site) { scroll-behavior: smooth }`, at once under reduced motion. The bar's links, the brand (`#top`) and the footer's links glide.
  - **Checks:**
    - the frontend gate passes: core 295 (2 new, the fixed theme), api 79, admin 22, console 8, workspace 105, demo 5;
    - design3 and the build were checked under a dark device with dark saved:
      - only day was ever set;
      - no appearance control;
      - the wordmark white over the film and the page's ink on the glass;
      - Agents, Pricing and the brand passed through 7 to 11 positions on the way;
      - no page errors;
    - the keyboard and site specs follow: no appearance control, day from the first paint, the links and the brand gliding. The browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted landing page on Claude Design stays on its pinned commit.

- **SC-166** (epic, done): Guided demo v4, three journeys and the console, on the stub.
  - **The request (11 Oct):** refine the guided demo at smartclearance-demo.web.app with the new features, on stubbed data in the UI layer, showing three paths: Munchly Chips sold through, the Mango Drink sold through, and a chips batch that cannot sell and calls the destruction flow with Supply Chain's approval; the console's client setup, existing clients and agent setup; every screen possible; "really intuitive and eyecatchy".
  - **The stories:** SC-169 (the console embeddable), SC-168 (the stub's three journeys) and SC-167 (the demo), stacked in that order and merged in that order (PRs #149, #150, #151).
- **SC-169** (PR #149, merged): the console, embeddable.
  - **design3:** with `window.SC3_CONSOLE_EMBED` set, `console/console.js` exposes `window.SC3_CONSOLE` (`App`, `routeOf`, `hashOf`, `setWorld` …) and does not mount itself: `<SC3_CONSOLE.App route go signIn world="demo">`, with no splash and a platform store never saved. On its own page it mounts as before. `console.css` scopes its two rules on the kit's shared components under `.cs-app`. `P.seed({ world: "demo" })` is SC-149's review world (Munchly and four fictional clients, 904 batches, two demo requests on `.example`).
  - **The frontend:** the console's screens, components and stylesheet moved into core (`@smart-clearance/core/console`) behind `ConsoleApp` (the API or the host's data, a typed `ConsoleRoute`, `ongo`, embedded); `frontend/console` is a thin host, keeping its splash, loaders, sign-in and Firebase. `demoConsoleApi({ signedIn })` (`@smart-clearance/core/console/demo`) is an in-memory mock on the demo world, kept out of the console app's builds. Core depends on api, and api no longer on core.
  - **Checks:** the console's mock build against main's, 0 differing pixels on 12 views at 1440 and 390; design3's console page, 0 on 10 routes; first load 206.8 kB gzipped (204.6 before). CI's first run failed one embedded-console test that read the Overview's figures before a slower runner had drawn them; it now waits for them.
- **SC-168** (PR #150, merged): the stub runs three journeys.
  - **The journeys:** `useScenario('chips' | 'mango' | 'slow')` resets the stub to that journey's start (design3's `SC3_FLOW`, core's workspace app); `fastForward`, the scripts, the agents and the stub's case, ledger, record and partner pages follow the journey. The chips keep today's seed.
  - **The Mango Drink:** 1,372 packets to 52 Hyderabad shops, 150 at Lakshmi Agencies' staff sale, 58 to Feeding India; net ₹16,917.10; CN/0117, the ITC memo, the FSSAI checklist, receipt FI/HYD/26-27/0417.
  - **The slow week:** 23 shops order 444 of 588, Shubham Provision declines, the window closes with 144 unordered (`closeOffer`); the lot sells; on expiry day (`expire`) the 144 are destroyed at Kalamna godown on Rakesh's evidence, Vision's checks and Priya's second yes. Net ₹18,632.40; expiry credit note CN/0118 ₹3,542.40; certificate OCE/DC/26-27/0219.
  - **Every figure from money.js**, design3 first, then core; core held to flow.js at every stage of the three journeys, and 25 new goldens.
- **SC-167** (PR #151, merged): the guided demo as a route map.
  - **Design first:** three options on the real screens, each playing the console's prologue and the three journeys from one story script: A, four chapters; B, the route map; C, the show. The maintainer refined B twice (the badges and labels; a light theme on a plate drawn from the cluster map's tokens), then picked it: "Go with option B, start the build". Designs and the decision are in `design3/designs/SC-167/`.
  - **The start:** the route map, a metro map of four lines into Munchly's workspace: the platform's (the console), the chips', the Mango Drink's, and the slow week's, branching off the chips. Each station and badge is a button; Play the whole route rides it all. On a phone, the lines as a list.
  - **Playing:** the line as a strip in the top bar, the batch riding it on the token spring; the station's notes beside the laptop and the phone, which run the real screens; the agents' beats happen on their own, a person's waits for a tap in the device or Next; autoplay; between lines the map shows the token hopping on; the end gives each batch what it recovered. Keys → ← 1–4 M P N; the place in the address (`#at=line.station.beat`).
  - **The lines:** the console on Neha's laptop (SC-169's embed, on the demo world): sign-in, Overview, existing clients, New client from Kesari Foods' request, Munchly's setup (supply chain, rules, people), the agents. The chips: Connect to Report. The Mango Drink and the slow week on SC-168's journeys, every beat a real action, the second yes on Priya's destruction sheet; the slow week's after photo is a Qwen edit whose slate reads expiry day.
  - **Found on the way:** the Mango's cleared card read the chips' wording (core's `placedOf` and `recoveredOf`); Back looped on a station that starts with an agent's beat; an address followed by hand did not move the demo; on a phone the notes covered the app; picking a station on the map, or 1 to 4, reopened the map as "Next line"; a beat's press in a device missed a screen still drawing on a cold hosted load (it now waits for its button, up to 5 s).
  - **The port** (`frontend/demo`): the story (`story.ts`, held to `design3/demo/story.jsx` station by station and beat by beat), the player, the route map, the strip, the notes, the map overlay, the end, the devices and the console device; `demo.css` verbatim. The e2e, a11y, motion, smoke and parity specs follow the route map (unrun, SC-55).
  - **Checks:** the frontend gate passes (core 381, api 83, admin 22, console 2, workspace 105, demo 9). design3 and the port were played along the whole route at 1440 and 390 with no page errors; each beat's sheet (both approvals, the destruction) opened in headless Chromium on design3, the port and the hosted page.
  - **Hosting:** the hosted demo page in demo v3 loads commit `15e0690`, with the console's stylesheet and script; every pinned file was checked on jsDelivr first (one cached 403 purged). smartclearance-demo.web.app follows on the merge to `main`.

- **SC-170** (PR #152, merged): documentation cleanup, asked for by the maintainer.
  - **PLAN.md removed** (the plan of 2 Oct); its market reasoning (why India, why a router rather than a marketplace,
    GST, BRSR and FSSAI) is folded into PRODUCT.md's Positioning. AGENTS.md's layout and the README no longer name it.
  - **PRODUCT.md** brought up to date in impeccable's layout: the four apps, backend-api and the agents, email and
    password for everyone, the users as they are now (Neha in the console, Priya as the one operator, Lakshmi Agencies,
    Meera), the three journeys and the pilot quarter, every surface, the destruction's second yes as a principle.
  - **TESTING.md** (new): the gates and every suite, with the scripts, what each needs first, the four journey suites
    and their options, which journeys to cover for which change, the agents' evals, how to report, what gets in the way.
  - **DEMO.md** (new): the guided demo's route map and how to drive it; the live workspace's two batches and three
    journeys; signing in; the console's controls; what Reset journey puts back and keeps; the clock afterwards; a
    checklist before a live demo; known limits.
  - **README.md** as the setup guide and map: the documents with a summary each, prerequisites, setting up from scratch
    (design3, the frontend, Google sign-in, backend-api, the agents, the frontend on the real API), starting everything
    from the command line, everyday commands, the gates, and the Google Cloud guide brought up to date (the workspace and
    agents live, four apps, Pub/Sub, Scheduler, BigQuery, the buckets, the GBP 30 budget, `app-env.sh`).
  - **Checks:** every relative link and anchor in the five documents resolves.

- **SC-171** (In Review, branch `SC-171-buckets-keep`; bug): the photos and docs buckets kept for good.
  - **Found:** every app bucket deleted its files 30 days after they were written (`infra/prod/storage.tf`, SC-70, when
    every file there was a working copy). The pilot quarter's papers and photos (SC-123), the Record and Photos tabs
    (SC-142) and the destruction evidence (SC-139) keep them for good, and production's copies, made on 10 Oct, would
    have gone around 9 Nov: Download PDF failing, "The photo did not load", and a journey's photos lost.
  - **The fix,** on the maintainer's ask: the delete rule only on the exports buckets (a dynamic `lifecycle_rule`); the
    photos and docs buckets, in prod and local, never expire. Exports keep 30 days: their CSVs are loaded into BigQuery.
  - **Terraform,** applied on the maintainer's yes (11 Oct): the plan read in full, 0 to add, 4 changed in place (the
    rule removed from the photos and docs buckets of both environments), 0 destroyed; nothing else drifted. Read back
    from Google: the four buckets have no lifecycle rule, the two exports buckets keep theirs. A fresh plan shows no
    changes. `check.sh` passes.
  - **Docs:** `infra/README.md`, the README's project table, and DEMO.md's known limits (the caveat is gone).

- **SC-176** (PR #155, merged): the journey clock explained. Wherever the live workspace
  shows the journey's date and time, a note says it is the prototype's own clock, with how to reset or fast-forward.
  - **The request:** "Wherever on UI we see date and time I want an info note to be added that this was done as part of
    the prototype to be able to run it with defined dataset of SKU with best before dates. And show them steps how
    journey can be reset fast forwarded."
  - **Design first:** three options on one board in app v3, `SC-176 design review.html`:
    - A, at the clock (recommended);
    - B, a note under the clock;
    - C, every date marked.

    The maintainer picked **B**, with the steps shown to everyone. Designs, stills and the decision are in
    `design3/designs/SC-176/`.
  - **The note:** under the clock on every title and a batch's head, "Prototype time: the story's own calendar, so its
    batches' best-before dates hold.", with **How to reset or fast-forward**. Under the bar's collapsed title it is an
    info icon. In the console, the same note under a live client's head.
  - **The guide**, "Prototype time": why (a fixed dataset of SKUs and batches with their best-before dates; the journey
    starts on the story's day 0), the journey time now and its pace, **Start the journey again** (Clients, the client,
    ⋯, Reset journey…, a day length), **Move it forward** (the journey-day badge's shorter days; the Agents tab's Run
    now, Close now, Report now), and the badge back to Real time afterwards, with Open the console (in the console, "Here
    in the console").
  - **The build:** design3 first (`screens/common.jsx` `ClockGuide`, `ClockNote`, `ClockInfo`; `screens/live.jsx`;
    `console/console.jsx`; `screens/screens.css`), then core (`workspace/screens/common/Clock*.svelte`, `LiveLine`, the
    console's `ClientPage`, `screens.css` verbatim). DEMO.md names it.
  - **Checks:** the frontend gate passes (api 83, core 381, admin 22, console 2, demo 9, workspace 106, with a new live
    test of the note and its guide that fails without it); design3's workspace, batch page and console, and the port's
    console on its mock, played in the browser with no console errors. The browser suites were not run (SC-55).
  - **Hosting:** re-pinned after the merge, on the maintainer's yes. The hosted app and console pages load commit `9e28e31`; every pinned file was checked on jsDelivr and GitHub raw first, and both pages render.
    - The app page leaves `58c6874` (5 Oct), so it carries everything since: SC-25 to SC-177.
    - It gains live mode's splash: its configuration, inline with the workspace's brand, then `dist/console-splash.js`, first in `<body>`.
    - Its `sw.js` is at `sc3-hosted-9e28e31`.
    - The note shows on the app page in live mode (`?live` or `?state=live`), and in the console on Munchly's page.

- **SC-177** (PR, merged): Reject beside Approve on the plan, not built yet.
  - **The request:** "where there is approve button for supply chain to get things moving, I want to add a reject button but it will be disabled, clicking that will say a note saying \"Coming Soon\"". The maintainer named the change outright, so no design round.
  - **The button:** **Reject the plan** sits between Approve · release the agents and Not now on the plan's approval sheet (design3 `brand.jsx` ApproveSheet first, then core's `ApproveSheet.svelte`). It is drawn disabled (`aria-disabled`, the offline approve's `lv-blocked`) but can be pressed: a press shows "Coming Soon" in the status line it is described by, sends nothing, and leaves the plan waiting. The guided demo shows it too, on the same sheet.
  - **Checks:** the frontend gate passes (core 382 with 1 new, api 83, admin 22, console 2, workspace 105, demo 9); the approval golden gains only the button; played on the workspace's stub as Priya. The browser suites were not run (SC-55).

- **SC-178** (PR #156, merged): ARCHITECTURE.md revised in detail, with the Lucidchart diagrams, documentation only.
  - **The request:** "update the ARCHITECTURE.md with the detailed diagrams from Lucid and revise it in details". ARCHITECTURE.md described 6 Oct (through SC-52): two apps, the agents planned, no workspace app, Pub/Sub, BigQuery, Cloud Storage, Scheduler or FCM.
  - **The diagrams:** all twelve pages of SC-140's four Lucid documents exported through the Lucid connector, converted losslessly to WebP in `docs/architecture/` (about 1 MB), and embedded, each linked to its document: the system, the agents' nine stops, CI/CD, Google Cloud layer by layer, Cloud Run, events and time, the data, who signs as whom, the agents and their models, a model call bounded, the core loop and a batch's journey.
  - **Lucid brought up to date:** "Where the data lives" said the buckets are emptied after 30 days, which SC-171 changed; the label now reads photos and docs kept for good, exports emptied after 30 days.
  - **The document,** 21 sections: the system; the surfaces; every Google Cloud service with what it does and why (and why not Firestore); versions from the lockfiles; the core loop and a batch's journey stop by stop, the case's phases and the destruction at the godown (Mermaid); the agents (modules, events to pipelines, the two Gemini tiers, the guardrails, the evals); backend-api's routers, contexts and journey services; the outbox, the tick, the timers, SSE and FCM; the data (two ERDs, migrations 0001 to 0015, BigQuery, the buckets); the frontend's seven packages and its stub and live sources; design3; identity and the roles; the cloud runtime and Terraform's files; delivery; local development; testing; one trace from the browser to Gemini; accessibility; decisions; known gaps; and the diagrams' sources with how to refresh them. Mermaid draws only what Lucid does not.
  - **Found on the way, listed in its known gaps:** `monitoring.tf` describes the model timeout as 20 s where the code gives 30 s; the agents' `sc-agents-harvest` entry point names a module that does not exist; the Data eval summary predates the shelf cases' removal.
  - **Checks:** the ten Mermaid diagrams parse and render with Mermaid 11.4; every relative link and anchor resolves; all twelve images are used. README's and AGENTS.md's pointers follow.
- **SC-172** (epic, done): papers as evidence. The staff sale's consolidated receipt, the certificate of destruction in full, and a signature on every paper, for past and current batches, then production synced.
  - **The request (11 Oct):**
    - "Can we somehow track receipts given to Staff sale, they will be needed for paperwork evidence": the distributor uploads one consolidated receipt for the staff sale, with UPI payment ids;
    - the certificate of destruction to carry the description, batch numbers, the exact quantity and weight, the reason, the approved method, the date, time and authorised facility, and the signatures of the supervising officer and two independent witnesses ("can be faked");
    - "none of the GST invoices, credit note and price support note has signatures";
    - "old past batches and current batches to be fixed … and then local and production storage and database be synced".
  - **The stories:** SC-173 (the design round), SC-174 (the build), SC-175 (production's sync), stacked in that order.
- **SC-173** (PR #158, merged): the design round, on one board in app v3, `SC-173 design review.html`, each option drawn on the real screens and papers:
  - the staff sale's receipt: A, with the count (recommended); B, a step of its own; C, the payments are the count;
  - the certificate: A, one page, numbered (recommended); B, the certificate and its log;
  - the signatures: A, ink and the firm's stamp (recommended); B, digitally signed.

  The maintainer picked **A**, **B** and **A**, and kept the signatories' names. Designs, the trial signatures, stills and the decision are in `design3/designs/SC-173/`.
- **SC-174** (PR #159, merged; deployed by CI): the build, design3 first, then backend-api, the agents and the frontend.
  - **The staff sale's receipt (A, with the count):**
    - the distributor's Staff sale card takes one consolidated receipt beside the count, a photo or a PDF under 8 MB (Take a photo, Upload): every staff payment by its UPI reference, from his books or his UPI app's statement;
    - Vision reads it on Gemini (`vision_staff_receipt.txt`): its number and date, each payment's reference, payer, time and amount, the total;
    - **Record the sale** is offered only once the payments come to the count × the price (within 50 paise). Short, the card says what the receipt comes to, and offers another receipt or the count its payments make; unreadable, it asks for another;
    - recorded, the receipt is a paper of the pack (`staff`, after the price-support note): Priya reads it on Execution's Staff sale card and in the pack, the distributor on his batch's papers, each opening the photo he sent with what Vision read. The feed says so.
  - **The certificate of destruction (B, the certificate and its log):**
    - page 1, the certificate: the goods (description, batch, made and best before, MRP, packs, cartons, kilos, plastic packaging), the reason (expiry), the method (sanitary landfill, CPCB's rules), the date, the window and the authorised facility with its address and coordinates, who handed the packs over, the evidence, Priya's yes, and the three signatures: the agency's supervising officer and two independent witnesses, each with an address and proof of identity;
    - page 2, the destruction log, step by step with its time (`papers.js` `destructionLog`, `domain/papers.py`): photographed at the godown, loaded on the agency's sealed vehicle, received and weighed on the weighbridge slip, slit open and emptied, buried and covered, photographed with the slate, the packaging sent on, initialled by the three;
    - the destruction screen gains the window and the two witnesses (the agency's panel by default); each agency gains its facility, vehicle, officer, seal and witnesses (`data.js` `SETUP.destruction`).
  - **A signature on every paper (A, ink and the firm's stamp):** the tax invoice, the kirana invoices, Munchly's credit notes (price support and expiry), the ITC memo, the FSSAI checklist, the staff sale's receipt and the certificate, each with its signatory's specimen signature over the firm's stamp: a rectangular rubber stamp for the distributors, a round seal for Munchly and the agencies. A food bank's receipt stays unsigned, since it names a real organisation.
  - **The makers:**
    - the signature maker, `design3/system/signatures/`: 14 Qwen-Image scans of each name in ballpoint, keyed to their ink (`ink.py`) into `system/img/signatures/`, with sidecars; the 8 stamps and seals drawn (`seals.mjs`) into `system/img/seals/`;
    - the receipt maker, `design3/system/receipts/make.mjs`: each staff sale's receipt printed from the batch's own payments (`papers.js` `staffPayments`, `staffReceipt`) onto a Qwen-Image photo of a sheet on a desk, by the label maker's compositor: the history's MF-2406-109 (LA/SR/26-27/0001, 24 payments, ₹3,300) and MF-2407-114 (RT/SR/26-27/0001, 8 payments, ₹1,300), and the Mango Drink's (LA/SR/26-27/0002, 18 payments, ₹1,200);
    - `seed.mjs` copies the receipts into backend-api's reference and the signatures and seals into the agents' templates (`templates/marks/`).
  - **backend-api:**
    - `POST …/cases/{ref}/staff-sale/receipt` (a signed link), `…/receipt/{id}` (it has arrived), and the agents' `…/staff/receipt/read`; `POST …/staff-sale` takes the receipt and refuses a sale its payments do not cover;
    - the staff sale's receipt and the certificate in full on the case, the pack and the partner facts, the receipt's photo on the Record and on the distributor's Photos; each distributor's, the client's and each agency's signatory (`identity.py`), set by hydrate and topped up by Reset journey;
    - the history issues the two receipts and the three certificates in full, each with its window, witnesses and log, held to design3's (`journey.json`);
    - no migration: everything lives in the case's and the workspace's JSON.
  - **agents:** Vision's staff receipt read; Paperwork's signatures (`_sign.html`), the certificate's two pages (`destruction.html`), and the tax invoice kept to one page.
  - **The frontend:** core's screens follow design3 (`Ink`, `TallySign`, `PpSign`, `Certificate`, `ReceiptRead`, `StaffReceiptPaper`, a rewritten `StaffSale`; `papers.ts` `destructionLog`, held to papers.js; the signatures and seals in `marks.ts`, kept in a live build), and the stub records the sale with its receipt. The live workspace uploads the receipt to its signed link, records the sale with it, sends the window and witnesses, and projects the receipt and the certificate in full. The guided demo's staff-sale beat takes a photo, then records.
    - **Beyond design3**, live only: a receipt Vision could not read asks for a clearer photo or the PDF from his UPI app; Priya's Execution shows Vision's read once the sale is recorded; an agency with no witness panel offers two blank witness rows.
    - **Found by the port:** a history batch's tax invoice read as a draft in the port, which never carried `invoiceIssuedAt`; it reads issued, with its e-invoice and signature.
  - **Not done as the board drew it:** Deccan Green Waste Management stays a sanitary landfill (its evidence photo shows one), though the board named incineration.
  - **Checks:**
    - backend-api 572 passed, 1 skipped (`test_staff_receipt.py`, 4 new: a receipt that matches, one Vision cannot read, the receipt as a paper with its link, its printed date as a day; the Mango's tests record the sale on a receipt);
    - agents 223 passed;
    - the frontend gate passes: api 83, core 382, admin 22, console 2, demo 9, workspace 109 (4 new live tests: the receipt being read, matched and recorded, one short of the count, Priya's read and paper, the certificate's two pages, the signed credit note and ITC memo); 12 goldens follow the signatures, the certificate, the receipt and the window and witnesses. A live workspace build passes `no-seed.mjs`. The port was shot beside design3 at 1440 light (within 0.2%) and 390 dark;
    - the live fixtures were regenerated, which found a receipt's printed date (03/10/2026) kept as printed on its paper: it is read as an ISO day (`papers.iso_day`), as every other paper's;
    - the browser suites were not run (SC-55).
  - **Locally:** rebuilt with `hydrate.sh --reset`, then `--papers munchly --again`: Paperwork laid out every history paper afresh with its signature, the three certificates on two pages, and the 214 kirana invoices. Both history receipts read and matched; every paper has its PDF. The day is 24 hours.
  - **Hosting:** design3's `dist/` is rebuilt. The hosted app page stays on its pinned commit.
- **SC-175** (done): production's data replaced with local's after SC-174 (`backend-api/scripts/sync.sh`, SC-136), on the maintainer's yes, once #158 to #161 were merged and CI had deployed SC-174.
  - **Before it:** Munchly's local journey was reset to day 0 on 24-hour days, as for SC-160, keeping the pilot quarter's history; no paper lacked its PDF; the rehearsal copied 8,769 rows, every table equal.
  - **Applied (11 Oct):** the on-demand backup `1791753533423` (21:18 UTC), the database (8,769 rows, every table equal), the photos, docs and exports buckets, and BigQuery's seven tables.
  - **Read back through production's API:** MF-2406-109's receipt LA/SR/26-27/0001 (read, ₹3,300, 24 UPI payments, its photo); MF-2407-111's certificate OCE/DC/26-27/0217 with its window and witnesses, and its PDF, the tax invoice's and the expiry credit note's; the journey at day 0 on 24-hour days.
  - **Replaced with it,** kept in the backup: a real Book a demo request sent from the live landing page on 11 Oct (it looks like a test), one device registered for pushes, and production's own journey activity since SC-160.

- **SC-179** (PR #160, merged): Munchly Chips Sad Path E2E, a journey suite on three screens at once, recorded as one video, asked for by the maintainer.
  - **The request:** "Munchly Chip E2E sad path on local wherein only 2 kiranas will buy and rest will decline, resulting in destruction", shown live with "3 browsers open side by side": the supply chain operator on a laptop and the distributor on a tablet, staying signed in throughout, and kiranas and the others signing in on a phone as needed; the whole session recorded "with all three screens open and seen".
  - **The maintainer's second take:** both tablets in landscape; the clicks shown; the certificate's signing, the photos' validation, the kiranas' invoices and the Impact screens read on screen; every screen fully loaded, Priya and Rakesh always online.
  - **The stage** (`tests/journey/stage.ts`):
    - three screens in a headless Chromium: Priya's and Rakesh's tablets in landscape (1180 × 820) and a phone (390 × 844);
    - all three sign in before the recording starts; after the reset the tablets reload in place; while the phone signs someone in, its last frame holds under a "Signing in" chip; a step ends once every screen's photos and placeholders have landed;
    - a cursor on every screen (an init script) glides to each control and ripples on the press, and glides over what a person reads;
    - each streams its frames (CDP screencast) into a page in a visible Chromium window, which lays them out as devices under their holder's name and address, lights the one being acted on, and keeps a narrator (the step, who acts and what they do, running counts, the last steps);
    - the stage is recorded: its frames piped into ffmpeg at 25 fps, H.264 at 2560 × 1440 (`recording.mp4`; `E2E_KEEP` copies it out; `E2E_LIVE=0` hides the window).

    Priya and Rakesh stay signed in; their screens move within the app as a link would, and the pushes that reach them show as banners, so the suite reads each screen's `#main`. The phone signs each person in. `record.ts` now watches several pages, takes stills at CSS pixels and lets a subclass draw the caption.
  - **The suite** (`munchly-chips-sad.journey.ts`, `corepack pnpm test:journey:sad`; it resets the journey):
    - of Rakesh's 38 kiranas, the first `E2E_BUYERS` (2) story buyers order 24 packets each, and the 35 others who use the app press Not this time;
    - Shree Sai Kirana's invitation is still open in the story, so it cannot sign in to answer, and the report says so;
    - Agrawal wins the ExpireSoon lot, Neha closes the window from the console, and 540 packets stay at the godown;
    - the truck, the invoice and the van round to the 2 shops; expiry day;
    - Rakesh's evidence, Vision's checks and Priya's second yes;
    - then the papers read back on each screen, signed (SC-174): the certificate (its reason, method, facility and window, each signature, then the log and its initials), the Expiry credit note and the other papers, a glance at each kirana's tax invoice, and the Impact screens (the quarter's tiles, food by week, where the kilos went, by product, the batch's BRSR line, the Command Center's card).
  - **The evidence for 540 packets** (`tests/journey/evidence/`, Qwen-Image, with sidecars): a before photo with five heaped crates, which Vision counted at 500 to 540 in six reads (kept full size at quality 92; a 1024-wide q82 copy read as low as 250), and design3's after photo with its slate edited to 540. Both were held to Vision's own prompt on live Gemini before the run.
  - **The run of 11 Oct** (`runs/2026-10-11-sad/REPORT.md`; the 9 min 32 s recording, 42.5 MB, stays local): the second take passed in 9 min 45 s, 105 steps, from a reset, with no warning, on SC-180's branch with its fix (the first take passed in 6 min 58 s, 94 steps, on the laptop layout).
    - The plan: ₹21,770.
    - The answers: 2 shops ordered 48 packets; 35 declined; 1 never joined the app.
    - The lot: 772 at ₹14.20.
    - Left at the godown: 540.
    - Vision's checks: 4 of 4 ("About 540 packs in view (540 left)", the slate's 540).
    - On the yes: CN/0118 for ₹13,284 (dealer price, the GST he reverses and the agency's charges), and certificate OCE/DC/26-27/0219 for 540 packs, signed four times.
    - Actual net: ₹11,702.40.
  - **Found by the trials, all fixed in the suite:**
    - a push banner on a screen that stays signed in also matched "Review and approve";
    - the shop that never joined could not sign in;
    - the case does not expose the scheme's shortfall.
  - **Checks:** the frontend gate passes (core 382, api 83, workspace 109, admin 22, demo 9, console 2). The day is back at 24 hours.

- **SC-180** (PR #161, merged; bug found by Munchly Chips Sad Path E2E): the distributor's destruction photos while Vision checks them, and a photo that blinked on every read.
  - **Found:** on Rakesh's tablet, "Vision is checking your photos" sat over two black frames until the check was done; and every read of a case reloaded a photo already on screen under its placeholder.
  - **The causes:**
    - the destruction screen reads the evidence from his partner facts, which the live source read again only on a stream event, so they still held the destruction as asked, with no photos;
    - each read brings a fresh signed link, and the Photo component dropped the image it had for the new link's load.
  - **The fix:**
    - the live source reads a partner's facts again once a step they send has gone through (`source.svelte.ts`);
    - the destruction screen shows the photos he has just sent until their links arrive (`DestroyScreen.svelte`);
    - a photo already on screen loads its new link behind it and swaps it in once loaded (design3 `common.jsx` Photo first, then core's `Photo.svelte`); its first load keeps its skeleton.
  - **Checks:**
    - the frontend gate passes: core 384 (2 new: the photo keeps its image while a new link loads, and fails without the fix), workspace 110 (1 new: a partner's facts read again after her own step, which fails without the fix), api 83, admin 22, demo 9, console 2;
    - in the sad path's recording the photos are in view from the send to the yes;
    - design3's `dist/` is rebuilt.

- **SC-181** (PR #163, merged; bug found by the maintainer): Verify shows the label photo the distributor sent.
  - **Found:** on the live workspace, the Verify card drew the typeset stand-in carton, not his photo. A live build carries none of the story's photos, and the hero's photo dropped the case's link to his.
  - **The fix** (design3 `brand.jsx` LabelShot and LabelPhoto first, then core): the live projection keeps the photo's signed link (`heroOf`, core's `Hero.photo.url`), and `LabelShot` takes `src`, the photo as sent, whole, under the kit's Photo loader. The stub and the guided demo draw as before.
  - **Checks:** the frontend gate passes; a live test holds the Verify photo to the case's own link, and fails without the fix.
- **SC-182** (PR #164, merged; bug found by the maintainer): the batch page's back crumb no longer sits on its tabs.
  - **The cause:** a batch's page has no large title and draws its own head under the bar (SC-112), and the kit's Page gave the bar its glass only once the whole head had gone.
  - **The fix** (design3 `kit.jsx` Page and `components.css` first, then core's `Page.svelte`): a page with no large title also watches its top edge, and the bar takes its glass (`.navbar.under`) as soon as anything scrolls under it; its title still waits for the head to go. Pages with a large title are unchanged.
  - **Checks:** the frontend gate passes, with 2 new component tests (the first fails without the fix); played in design3 and on the guided demo's stub.
- **SC-183** (PR #165, merged): the certificate of destruction signed in place, live.
  - **The request:** "on Destruction Certificate Signatures are put live, when Evidence is being asked for, Distributor will upload photos and also there should space where witnesses, distrubotor and supervisors will put on a sign, and same sign should be seen by Supply chain operator too."
  - **Design first:** three options on one board in app v3, `SC-183 design review.html`, each on the app itself at the slow week:
    - A, on his screen (recommended);
    - B, on the certificate;
    - C, on their own phones.

    The maintainer picked **B**, and answered both questions as recommended: the pilot quarter's three certificates keep their specimen signatures, and "Type the name instead" stays. Designs, the traced signatures, the build's stills and the decision are in `design3/designs/SC-183/`.
  - **Rakesh's destruction screen:** under the witnesses, "Sign the certificate": the agency's certificate laid out from what he entered, stamped TO SIGN, with a numbered Sign here in each signature's own place and "n of 4 signed · next: …".
    - Each place opens a sheet: who signs, whom to hand the device to, the sentence they sign to, and the pad (`SignPad`). "Type the name instead" is the keyboard's way, and anyone's who cannot draw on glass.
    - Signed, the place shows the ink with its time and Clear. A witness renamed, or another agency chosen, signs again.
    - Send waits for all four.
  - **Priya's review:** "The certificate, as signed at the facility", page 1 stamped SIGNED, each signature drawing itself once as it was signed (1.6 s each, a quarter second apart; at once under reduced motion), and the check "Four signatures on the certificate".
  - **The certificate and its PDF:** each signer's ink where a specimen was, with "signed 13:22" (or "typed") under it, the agency's seal beside the officer's, and the log initialled with the same ink. Paperwork draws the strokes as inline SVG (`drawn()`). The history's certificates keep their specimens.
  - **The data:** each signature is its strokes in the pad's 640 × 220 box, or typed, with the time; no image file and no migration (the case's JSON).
    - design3's `data.js` STROKES (the four specimens traced to pen strokes, `designs/SC-183/tools/strokes.py`) sign for the stub and the guided demo;
    - backend-api refuses the evidence without all four, under a name the certificate does not print, or with no ink, and reads each device time on the journey's clock (else the moment it came);
    - the contract's `DestructionInput.signatures`, `WsDestruction.signatures`, `WsInk`; `contracts.sh` re-exported the OpenAPI.
  - **The port:** the kit's `SignPad` and `InkStrokes` in core (coverage and the a11y suite's `COMPONENTS`); `certificate.ts`, stub-free, so the live workspace lays out the certificate to sign; `SignSheet`, DestroyScreen, DestructionSheet, Certificate, Ink; the live source sends the signatures; the Lucide `signature` icon. The journey suites sign the certificate with the mouse (`signCertificate`), and the guided demo's beats say so.
  - **Checks:**
    - backend-api 572 passed, 1 skipped (the destruction test refuses three, a wrong name and no ink, and reads the four on the case and the certificate);
    - agents 225 passed (2 new: the signed certificate's layout and its PDF);
    - the frontend gate passes: core 388 (the slow week's certificate to sign held to design3's), api 83, workspace 112 (a live test signs the certificate, the officer drawn and three typed, and Priya's review reads it as signed), admin 22, demo 9, console 2;
    - the live fixtures were regenerated; design3's `dist/` is rebuilt;
    - the a11y spec scans the certificate to sign, the sheet drawn and typed, and Priya's review; the browser and journey suites were not run (SC-55).
  - **Hosting:** the hosted app page stays on its pinned commit.

- **SC-185** (PR #166, merged; bug found preparing SC-184): Execution's Outreach card said where the unordered packets went.
  - **Found:** when the kiranas' window ended short, the card always read "the N left moved to ExpireSoon". backend-api (`steps._close_offer`) moves the shortfall onto the lot only while the lot is still live. When it was already won (the sad path, the stub's slow week), or there is no lot (the Mango Drink), the packets stay at the distributor's godown.
  - **The fix** (design3 `brand.jsx` SchemeCard first, then core's `SchemeCard.svelte`): the card says they moved only when the lot grew past its planned units, and otherwise "stayed at Rakesh Traders' godown".
  - **Checks:** the frontend gate passes (core 388, with the slow week's Execution golden changing only that sentence; api 83, workspace 112, admin 22, demo 9, console 2); design3's `dist/` is rebuilt; Munchly Chips Sad Path E2E reads it live on Priya's Execution.
- **SC-184** (PR #167, merged): Munchly Chips Sad Path E2E again, asked for by the maintainer: 2 kiranas buy and Neha closes the window on the rest, Priya's tablet in landscape and Rakesh's in portrait, sign-ins on the apps' own screens, the orders seen live, the whole session recorded.
  - **Found in SC-179's recording:** from about a minute in, every frame was the stage cropped to about 93%, the phone cut at the right and the narrator at the bottom. The stage was a visible window, captured by its screencast.
  - **The stage** (`stage.ts`): renders headless, so no window can crop it; a monitor window shows it live (`E2E_LIVE=0` opens none). Priya's tablet in landscape with the narrator under it, Rakesh's in portrait (820 × 1180), the phone. The cursor follows a pen exactly and makes no ripple on a signature pad.
  - **Sign-ins on screen:** the recording opens on three sign-in screens. Each person types their email on the app's own sign-in screen and presses Sign in; the app's welcome, splash and first-run notifications step follow. No password is typed: the field takes a stand-in, and Identity Toolkit's `signInWithPassword` is answered with the person's own session from `sessions.sh` (`auth.ts` `signInOnScreen`); the rest is the app's own. Between people on the phone, the one before signs out of the workspace from Profile; the console stays signed in on its own address. The "Signing in" and "Catching up" chips are gone.
  - **The suite** (`munchly-chips-sad.journey.ts`): a first step signs Priya, Rakesh and Neha in on camera (it always runs, also with `E2E_FROM`); two kiranas order and Priya's Execution must show each order live within 45 s, without a reload; Neha closes the window on the other 36, and Priya's Execution must read where the packets stayed; the certificate is signed at a hand's pace (`signCertificate`'s `pen`); Priya reads the certificate as signed in the review; the phone reads a buyer's order and invoice and a shop the window closed on.
  - **The run of 12 Oct** (`runs/2026-10-12-sad/REPORT.md`; the 9 min 16 s recording, 41.4 MB, stays local): every step ran, 78 steps in 9 min 25 s, from a reset; Playwright marks it failed on one soft check, Vision's count (below). Plan ₹21,770; 2 shops, 48 packets, each live on Priya's tablet; 772 at ₹14.20; 540 left at the godown; the four signatures drawn on Rakesh's tablet; CN/0118 for ₹13,284 and OCE/DC/26-27/0219 for 540 packs; actual net ₹11,702.40. The day is back at 24 hours.
  - **Findings:** Vision read about 250 packs in the before photo on both takes, where SC-179's run read 540, so its count check failed and Priya approved past it (the photo goes up full size, and no count is given); the batch head reads "2 of 2 kiranas ordered" once the window closes short (design3's stub too); the console has no sign-out on a phone (the Shell draws no user button there).
  - **Checks:** the frontend gate passes (core 388, api 83, workspace 112, admin 22, demo 9, console 2).

- **SC-186** (done; operations): production's data replaced with local's after SC-183 to SC-185 (`backend-api/scripts/sync.sh`, SC-136), on the maintainer's yes, run by the maintainer in their terminal.
  - **Before it:** the sync refused while local had 2 unfired timers left on the chips case the sad path cleared; as for SC-160 and SC-175, Munchly's local journey was reset to day 0 on 24-hour days, keeping the pilot quarter's history. Rehearsed: 9,460 rows, every table equal.
  - **Applied (12 Oct):** the on-demand backup `1791765022211`, the database (9,460 rows, every table equal), the new photos and PDFs, BigQuery's seven tables.
  - **Read back through production's API:** the journey at day 0 on 24-hour days; Q2 FY27, 12 batches, ₹2,20,383.58; MF-2407-111's certificate and expiry credit note serve as PDFs.
- **SC-189** (PR #168, merged; bug found preparing SC-188): the Route Room failed to the 500 page ("Cannot read properties of undefined (reading 'net')") when a case's phase arrived over the stream a moment before its plan was read: it took the batch as priced on the phase alone and read the plan's food-bank row. Priced and planned now also need the plan itself (core `RouteRoom.svelte`; the stub always has its plan, so design3 has no such moment). A live test draws it so, and fails without the fix. Deployed by CI with SC-188 (`b3caf45`).
- **SC-188** (PR #169, merged): Munchly Chips Sad Path E2E on production, recorded, with the stage's spotlights, business notes and smooth scrolling, asked for by the maintainer.
  - **The stage** (`stage.ts`): a screen scrolls smoothly to what is read (sideways too), a block wider than its screen is panned, what is read is ringed, and at 26 moments the rest of the screen dims and a card beside the element says why, in business terms (the maintainer: "this notes need to be business oriented … all over the video"): why Rehearsal, why the Watcher, the window and expiry day are fired by hand, and what each moment is worth, with the case's own figures. The notes are the stage's; the apps are unchanged.
  - **The suite:** the Route Room read down to its split (the chart bar by bar, the table panned); on production the Route Room is opened from the plan on Priya's Command Center (SC-189 not yet deployed there); the stage's bar names production.
  - **The run of 12 Oct on production** (`runs/2026-10-12-prod-sad/REPORT.md`; the 14 min 46 s recording and a 1080p copy stay local): passed end to end, 81 steps in 14 min 56 s, no finding, Vision 4 of 4. Plan ₹21,770; 2 shops, 48 packets, each live; 772 at ₹14.20; 540 destroyed at the godown; CN/0118 ₹13,284; OCE/DC/26-27/0219 signed by four; actual net ₹11,702.40, a ₹14,868 swing. Production's day is back at 24 hours.
  - **Checks:** the frontend gate passes (core 388, api 83, workspace 113, admin 22, demo 9, console 2).
- **SC-190** (In Review, branch `SC-190-mango-three-screens`): Munchly Mango E2E on three screens, on production, recorded, asked for by the maintainer ("run the logic on Munchly mango drinks happy path e2e with Lakhsmi agencies on production"; picked: three screens with the business notes).
  - **The suite** (`munchly-mango-stage.journey.ts`, `corepack pnpm test:journey:mango-stage`; it resets the journey): the Mango Drink's happy path on SC-184's stage, with SC-188's spotlights, notes and scrolling.
    - **The screens:** Priya on the landscape tablet and Lakshmi Agencies on the portrait one, each signing in on camera and online to the end; Neha, three kiranas and Meera of Feeding India sign in on the phone as each is needed. `Stage.open` takes the cast (who keeps a tablet, the note under the phone).
    - **The kiranas:** the first `E2E_SHOWN` (3) ordering kiranas order on the phone, each checked live on Priya's Execution; the other 49 order as themselves through backend-api, each with its own session, and a note says so.
    - **The rest:** the staff sale on its receipt, read by Vision on Lakshmi's tablet; Meera's pickup; the papers and the sales register; the van round; the review; Report now; the Impact screens; Lakshmi's batch and Orders; the outcome.
    - **The notes:** 22, in business terms, among them why the Mango (22 days left) is too close to its date for ExpireSoon.
  - **The run of 12 Oct on production** (`runs/2026-10-12-prod-mango/REPORT.md`): passed end to end, 57 steps in 13 min 47 s, against `b3caf45`.
    - The recording (13 min 35 s) and a 1080p copy stay local, with copies in `playwright-automation-videos/`.
    - ₹22,657.20 at Detect; plan ₹16,917.10 (1,372 to 52 kiranas, 150 to the staff sale, 58 to Feeding India).
    - LA/SR/26-27/0002 read as 18 UPI payments, ₹1,200; FI/HYD/26-27/0417; CN/0117 ₹5,932; every paper with its PDF.
    - Actual net ₹16,917.10, a ₹22,194 swing, nothing left at the godown; 339.7 kg kept out of landfill, 58 meals; Lakshmi Agencies ends whole at ₹0.
    - The only findings are the known twelves on the offer screen (Bilal Stores and Saraswathi Kirana, 16 each).
    - Production's day is back at 24 hours; the Mango cleared, the chips at day 0.
  - **Sample data:** copies of the label photos, the staff sale's receipt and the destruction's evidence the chips and Mango suites upload, with their sidecars and a README naming each original, in `playwright-automation-videos/sampleData/` (local, as the videos are).
  - **Checks:** the frontend gate passes (core 388, api 83, workspace 113, admin 22, demo 9, console 2).

- **SC-191** (In Review, branch `SC-191-admin-console-e2e`, stacked on SC-190): Admin and console E2E, on production, recorded, asked for by the maintainer ("a journey for Admin landing page and console E2E, how admin can login and create clients, configure agents and monitor dashboards"; then "Proper highlighting with whatsapp style banners and mouse click pointers").
  - **The first run** was on three screens (Neha on the landscape tablet, a prospect on the portrait tablet, Support on the phone), and set up Aravalli Snacks in production.
  - **The redo, as the maintainer asked:** "landing should open only once, you go over the entire thing briefly and then showcase how console and workspace can be accessed", banners "whatsapp like … but dont copy everything like showing time and green tick", then the console, "show all things", on a laptop and a tablet side by side, no phone, direct on production.
  - **The suite** (`admin-console.journey.ts`, `corepack pnpm test:journey:admin`):
    - **the laptop** opens the landing page once: the hero, a brief tour (the statement, the agents at work, the chapters, Impact's ledger, the workspace section), Book a demo sent for the company, then the ways in: Find your workspace, the bar's Workspace (Munchly Foods' sign-in opens on the tablet) and Console, where Neha signs in;
    - **the tablet** then has Megha (Support) signed in to the console;
    - the request on the Overview; New client from it in its seven steps; the agents (the Watcher's gate, the Lister's reserve, the Negotiator on Act, the approval); the rules, an approver invited, Pilot to Growth; Megha refused a plan change; the audit log; the Overview (figures, Food by day, Agents at work filtering the batches, the batches searched and paged, Needs attention), with Megha following it; Munchly's live agents, clock note and SKUs; the platform's Agents, Connectors, Plans, Staff and audit log.

    It never resets the journey, but **each run adds a client to its database for good** (the console cannot delete one): the first of the suite's companies not yet a client, its address by the console's own rule.
  - **The stage** (`stage.ts`):
    - a `two` layout (`Cast.layout`): a laptop (1440 × 900) and a portrait tablet, no phone; the `three` layout stays the earlier suites';
    - the landing page is an app of its own (`auth.ts` `ORIGIN.site`), and a person who signs in nowhere is a guest of the cast (`Cast.guests`, `apps`, `roles`, `host`);
    - the notes are banners in the manner of a phone's notification, not a chat: the Smart-Clearance mark, its name and the tag, then the note's title and text, with no time or ticks, sliding onto the screen being read;
    - a click dips the arrow and spreads two rings. The earlier suites get the banners and the clicks too.
  - **sessions.sh** mints a staff member by address (`megha=megha.bava@smartclearance.example`), on the staff email domain only (`test_sessions.py`).
  - **The run of 12 Oct on production** (`runs/2026-10-12-prod-admin/REPORT.md`, replacing the first run's): passed, 42 steps in 9 min 30 s, against `b3caf45`.
    - The 9 min 25 s recording, a 1080p and a lighter copy, stay local, with copies in `playwright-automation-videos/`, where the first run's are kept as `…-three-screens.mp4`.
    - Production gains Nilgiri Foods (`nilgiri-smartclearance.web.app`, setting up, Growth), Ritu Malhotra as its admin and Arvind Sethi as its approver, with six audit lines in Neha's name. Aravalli Snacks, from the first run, stays.
    - The Overview read ₹64,84,415 recovered in 30 days, 39 batches in flight, 12 waiting for a yes, 127 runs today.
  - **Findings, not fixed:** the Overview's demo requests are not part of its 30-second live reading (a new request shows once the Overview is opened again); Set up is clipped in Demo requests at 1180 and on a phone; "Aravalli Snacks's workspace is set up".
  - **Locally:** the trials set up Aravalli Snacks and Nilgiri Foods in the local database, with three demo requests.
  - **Checks:** the frontend gate passes (core 388, api 83, workspace 113, admin 22, demo 9, console 2); backend-api's sessions tests pass.

- **SC-187** (PR #170, merged; Done): the demo film, in three cuts on one day, and on YouTube.
  - **The request:** a cinematic demo video of the Masala Chips and the Mango Drink through all five exits, the papers, GST, the ITC reversal, BRSR and ESG, presenting Smart-Clearance as SaaS on an agentic architecture; voice-over, on-screen text, phone-style pop-ups, light music; closing on the guided demo and the live prototype; Google's image and video models within a budget.
  - **Cut 1** (under 3 minutes): Nano Banana 2 keyframes and Veo 3.1 clips of the story's people, the app's screens with close-ins, Gemini-TTS and a Lyria bed, cut by ffmpeg on the voice's measured beats (`design3/designs/SC-187/src/film.py`, `assemble.py`, `overlays.mjs`).
  - **Cut 2** (6 minutes), on the maintainer's notes: a generic story with no names or figures; the working app recorded on a fresh walk of both journeys (`tour.mjs`, 71 recordings with a gliding pointer; `director.py --until`); every carton with Munchly's printed label, from the label maker's photos as references; the donation as sealed cartons received by a food bank, not a kitchen; every Veo clip reviewed by Gemini as a VFX supervisor (`eyes.py`) and cut to its clean seconds, slowed with motion interpolation; the Kore voice at 1.08, every take transcribed back; two clips on LTX once the $75 cap was reached.
  - **Cut 3**, on seven more notes: the first minute re-shot in professional settings on Qwen-Image keyframes (edits with the cast sheet, the app's green ledger on a wall screen, and a 16:9 reference of the label beside the pack) and LTX clips, all local; chapters opening over their first screen with the nine stops lit, instead of cards; notification banners as a phone shows them, inside the phone's screen; the camera shot re-shot over the distributor's shoulder; the chapter's keyframe out of focus behind every app window; a push between app screens and labels rising; four chart animations in the app's greens (`anim.mjs`). Audio untouched. Google spend for the cut under $1.
  - **On YouTube:** youtu.be/5Z9-32Fuwh4, unlisted, uploaded through Claude in Chrome (the Studio page fetched the master from a local CORS server, `youtube/serve.py`, and handed it to its own uploader; the browser tools have no file picker and cap uploads at 10 MB), with the ten chapters, English captions from the cut's own timeline, AI use disclosed, embedding allowed; cut 1's video is private. The landing page's theatre is repointed (`transcript3.py` writes `demo-film.json`, the description and the SRT): "Watch the 6-minute demo", a client-neutral poster, "One platform. Ten agents. One yes." A copy of the 1080p film is in `landing-demo/`.
  - **Found on the way:** a Qwen edit at 2048 with four condition images crashed the machine (`guard.sh` now watches memory; edits run at 1024); Gemini-TTS cut one take off mid-word, so every take is checked on its own; `assemble.py` names its segment files by identity and length after a dropped clip shifted every reused segment; gitleaks read the timeline's `"key": "k51-brand-office"` as a credential (allowed in `.gitleaks.toml`).
  - **Spend:** $72.92 of Vertex AI over the three cuts (Veo, Nano Banana, Lyria), against the $75 cap; the records are in `design3/designs/SC-187/storyboard.md`.
- **SC-192** (In Review, branch `SC-192-claude-md-sc-187`): this entry.

- **SC-194** (In Review, branch `SC-194-small-ux-fixes`): small UX fixes, asked for by the maintainer with six screenshots.
  - **The console on phones** carries the account (Sign out) in its bar, as the workspace does; staff have portraits (`Staff.img`, from the console's reference data).
  - **Portraits:** every person who signs in has the portrait the films cast (SC-154, SC-158, SC-187), cut from the cast sheets (`design3/designs/SC-194/portraits.py`, `design3/system/img/people/`); Arjun and Sameer made with local Qwen-Image. Lakshmi Agencies and Sri Lakshmi Ganapathi Kirana join the sign-in's people. The live sign-in follows the story's suggestions without a rebuild, and Reset journey brings the portraits.
  - **Gone:** "Not your workspace? Find yours" from the workspace's sign-in.
  - **The sign-in's wait:** the button's S laps like the splash's route while it waits, its line creeps on, and past 3 s it says the connection is slow (the workspace and the console).
  - **Execution:** the cards stack in columns, so a plan with no ExpireSoon line leaves no hole.
  - **The staff sale's receipt** opens whole in a sheet, and zooms to full size.
- **SC-195** (In Review, branch `SC-195-signin-backdrop-swing`, stacked on SC-194): the sign-ins' stage, and how the swing adds up.
  - **The request:** a better workspace sign-in ("something with blurry effect", the products shown better), and a note under a batch's "swing" that opens how it is worked out and how the loss is kept small.
  - **Design first, round 1,** on one board, published as a private artifact since Claude Design's write needed `/design-login`: three sign-ins and three swing notes. The picks: sign-in **A, In focus**, and swing **A, How it adds up**. Both were built.
  - **How the swing adds up:** under a card's figure, a note says the swing in words and opens the working in a sheet: the swing, a bridge from the bin's P&L to the plan's (inks validated with the dataviz script), the bin's lines, each exit's line, the P&L with the plan, the swing as a sum, and how the loss was kept small. On the Command Center and a batch's Journey, from money.js's figures (design3 `brand.jsx`; core `swing.ts`, `SwingMoney`, `SwingWorking`, `SwingBridge`).
  - **Round 2:** the maintainer found the photograph "does not look good" and asked for a sign-in Smart-Clearance's own, "showcasing agentic mix", in motion, "really solid in light and dark mode". Three stages: A, the agent mesh (recommended); B, agents at work; C, the route. The pick: **A**, "and it should loop constantly and it should be live an interactive on touch and mouse click", and the console's sign-in too. Designs, recordings and the decision are in `design3/designs/SC-195/`.
  - **The agents at work** (the kit's `AgentStage`, design3 `system/product.jsx`, then core's `AgentStage.svelte` and `components/agents/`): ThreeUI's constellation field (MIT, its notice beside each copy) behind the whole sign-in; the ten agents and the one person on an orbit, lit in turn as a batch walks the nine stops, the yes amber, sparks from the yes to the three exits. It holds on the result for 2.8 s and walks again, under Pause and Play, remembered in the browser (`sc3-agents`); at rest under reduced motion. The field gives way to the pointer and links to it; a click or a tap sends a ripple; an agent picked holds the walk and says what it did. The agents are one stop in a tab. On a phone or a tablet it is a band over the card. AGENTS.md's loop rule names it beside the hero film.
  - **The console's sign-in** keeps "Console" over the same stage; its scene plate, and the hosts' `plate` prop, are retired. Round 1's photograph (`signin-plate.webp`) is retired too.
  - **Found on the way:** inside the guided demo's scaled devices the canvas measured in screen pixels, so its threads and the chips drifted apart; it measures in its own now.
  - **Checks:** the frontend gate passes (api 83, core 407 with `agents.test.ts`, admin 22, console 2, demo 9, workspace 115); the sign-in goldens follow; backend-api 574 passed, 1 skipped (only its seed manifest changed). design3 and the port's stub builds (workspace, console on its mock, the guided demo) were played at 1440 and 390, light and dark, with the pointer, a ripple, an agent held and Pause, by keyboard and under reduced motion, with no page errors. The keyboard specs of the workspace and the console gain the stage; the browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted pages stay on their pinned commits.

- **SC-196** (In Review, branch `SC-196-agents-portrait`): the sign-ins' agents on phones and tablets.
  - **The request:** "on mobile and ipad, the login graph does not great in portrait mode, need better design just for these devices, rest all is fine". SC-195's band squeezed the desktop's orbit into a short, wide box, and stretched on a tall tablet.
  - **Design first:** three options on one board, published as a private artifact. A, the ring (recommended); B, the relay; C, around the card. The maintainer picked **C**, and asked that tablets held sideways below 1100 px take it too. Designs, recordings and the decision are in `design3/designs/SC-196/`.
  - **Around the card** (the kit's `AgentStage` below desktops, design3 first, then core's `agents/AgentAround.svelte` and `mesh.ts` `agAround`):
    - the field behind the whole sign-in, pinned and taking no room in its rows;
    - the eleven agents on a loop round the card, below the pill, as tiles. A tap holds the walk on one; a tap on the field lets go;
    - a pill at the top with Pause, who is at work and what they did, and the nine stops as a rail of buttons (one stop in a tab, Enter holding the walk on a stop's agent);
    - on a phone the card takes its own glass. Desktops keep SC-195's stage.
  - **Checks:** the frontend gate passes (api 83, core 407, admin 22, console 2, demo 9, workspace 115); the phone goldens follow. design3 and the port were played on a phone, an iPad in portrait and 1024 × 768, light and dark, with no page errors. The browser suites were not run (SC-55).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted pages stay on their pinned commits.
- **SC-197** (PR #179, merged): Admin and console E2E on one laptop, on production, recorded as raw footage for the final walkthrough, asked for by the maintainer.
  - **The ask:**
    - "Detail out the major flows as to how dashboards can be monitored", with WhatsApp-style notes, without the time and ticks;
    - the notes positioned "next to the highlighted area, no overlap and should pointing to it like whatsapp chats have a small tail";
    - the landing page "just briefly showed", on "just one screen, laptop, moving from landing to console";
    - the sign-in's agents network hovered over quickly;
    - then "The videos are flickering".
  - **The suite** (`admin-console.journey.ts`), 14 chapters on one laptop:
    - the landing page briefly, then the bar's Console;
    - the sign-in's agents network swept, five agents picked, Pause and Play, the form marked;
    - **the dashboards**: the four figures, the 30-second reading with Pause, Food by day over 7 and 90 days, Agents at work filtering by a stop, and the batches searched, filtered, sorted and paged; then Needs attention, Demo requests and Agent runs;
    - New client from the request, every step's options marked;
    - the first stock export, mapped live by the Data agent;
    - the approver invited;
    - all eleven agents, most customised;
    - the rules and the destruction at the godown;
    - the plan, the audit log, a live client's controls, and the platform's screens;
    - sign-out.

    The demo request is sent before recording, through the landing page's own `POST /v1/demo-requests`.
  - **The stage** (`stage.ts`):
    - the `one` layout: a laptop with the narrator beside it;
    - the notes as bubbles beside what is read, never over it, choosing right, left, below or above, with a tail pointing at it, a quoted line naming the screen, and no time or ticks;
    - rings with corner brackets, a sweep and a pulse;
    - `mark()` numbers several parts, each in its own cut-out of the dim;
    - a title card for each chapter, `recording.chapters.json`, and `cut-chapters.mjs`, which cuts one clip per chapter;
    - `atSignIn()`.
  - **The flicker:**
    - Frames reached the stage on a 50 ms tick, so the 25 fps recording repeated about one frame in five while anything moved (probed: 19.8 distinct a second). They now go as they arrive: 24.8 in the probe, and 4% repeats inside motion on production, against 20%.
    - A browser's smooth scroll over a long page strobed. The stage now glides short scrolls at a readable pace, and dips to dark and cuts over three screens.
    - The cursor's script stays out of embedded frames.
  - **The run of 12 Oct on production** (`runs/2026-10-12-prod-admin-laptop/REPORT.md`): passed in 18 min 36 s, 54 steps, against `6e9aa43`.
    - The recording (18 min 33 s, 2560 × 1440), its 1080p copy and 14 chapter clips stay local in `playwright-automation-videos/`.
    - Production gains Kaveri Foods, with its admin and approver, its request, its first export (8 of 8 fields mapped) and 16 audit lines.
    - The two-screen run before it, which set up Shivalik Snacks, is kept in `runs/2026-10-12-prod-admin-detail/`.
  - **Findings, not fixed:**
    - the Overview's demo requests are not live;
    - Set up is clipped in Demo requests;
    - "Kaveri Foods's" in the console's words;
    - the approver list offers only people who have signed in.
  - **Checks:** lint, Prettier and the workspace type check pass on the suite; local trials passed before the run.
- **SC-199** (In Review, branch `SC-199-admin-console-tour`): Admin and console tour, about a minute on one laptop, recorded on production, asked for by the maintainer ("a quick 1 minute tour of admin landing and console journey E2E tests. Highlighting main points and client agent configuration", with notes like a reference still "but in green background and the highlighting border should be green").
  - **The suite** (`admin-console-tour.journey.ts`, `corepack pnpm test:journey:admin-tour`, its own Playwright project), in three chapters:
    - the landing page's heading and the bar's Console;
    - the sign-in's approval picked, Neha signing in, and the Overview's figures;
    - one client's agents: the pipeline, the Watcher's gate changed and saved, the Negotiator on Act, the approval always on.

    It sets up no client: it configures Kaveri Foods (`E2E_CLIENT`), which SC-197's run set up. The gate moves between 60 and 65, so every run saves a change.
  - **The stage** (`stage.ts`), chosen per suite through `Cast`, the other suites unchanged:
    - `ink: 'green'`: the rings, numbers, clicks and the screen's outline in green, as CSS variables;
    - `notes: 'card'`: a green card beside what is read, the tag and the title on one line, the note under it, and a caret pointing at it;
    - `pace`: holds about half as long;
    - `quiet`: the sign-in's password note left out;
    - `chapter()` takes how long its title card holds.
  - **The run of 12 Oct on production** (`runs/2026-10-12-prod-admin-tour/REPORT.md`): passed, 64.6 s of recording, against `6e9aa43`. The recording and its 1080p copy stay local in `playwright-automation-videos/`.
  - **Changed on production:** Kaveri Foods' Watcher gate (60 days) and Negotiator (Act), with their audit lines. An earlier, longer attempt left the gate at 65, the Lister's reserve at ₹12.50 and the Negotiator on Ask. This run put the gate and the Negotiator back; the reserve stays at ₹12.50.
- **SC-200** (PR #181, merged; Done): the E2E film, a 3 min 31 s demo cut from the three production recordings of 12 Oct (SC-199's admin and console tour, SC-190's Mango Drink, SC-188's Chips sad path), asked for by the maintainer.
  - **The tools, as the maintainer set them:** only Qwen, LTX 2.5 and ffmpeg, and the best free voice; no paid Google model was called. The music is SC-187's Lyria bed, reused (nothing new generated). The spend: nothing.
  - **The film:** the problem (an hourglass of snack packets, blank pages drifting down a godown aisle, the landfill); Smart-Clearance (the town's agents' network, the mark drawing its route, the console's sign-in agents); 01 admin and the console; 02 the Mango Drink's happy path; 03 the Chips' sad path; everyone ends whole, and the end card. The recordings' device screens float over each section's blurred plate and drifting dust, with a camera inside each screen that zooms and pans to what the voice names; headlines, name tags and figure callouts on design system v3.
  - **The voice:** Kokoro-82M `af_heart` at 0.94, picked by a bake-off scored with UTMOS (4.54, highest) and a Whisper read-back against Chatterbox and five other Kokoro voices; two names given phonemes (Rakesh, Priya). espeak-ng ignores a data path over 160 characters, so its data is copied to `~/.cache/sc200-espeak/`.
  - **Where:** `design3/designs/SC-200/` (`README.md` has the scene list, the checks and the rebuild); `media/smart-clearance-e2e-film.mp4` (1080p, 72 MB), a 720p copy and an `.srt`; the crf-17 master stays local, also in `playwright-automation-videos/`.
  - **Checks:** every shot's frame, every screen window's crops (four moved off stage notes cut at a device's edge), the narration transcribed back from the final mix and heard on its marks, −14.0 LUFS, −1.4 dBFS peak.
- **SC-201** (PR #182, merged; Done): Munchly Mango E2E on production from a journey reset, recorded and shown live, told as the admin tour tells it, asked for by the maintainer.
  - **The request:** Supply Chain on a tablet in landscape, the distributor on a tablet in portrait, everyone else on a phone; clicks shown; sign-ins from the sign-in page, Priya and Lakshmi Agencies signed in throughout; green notes and green highlights on the major parts only, "professional and should not look too flashy"; two kiranas on the phone, the rest from the backend, Priya's Execution open for the kiranas, the staff sale and the pickup; every paper shown clearly; Finance and ESG; the swing and how it is worked out, last; the recording saved with a date-time stamp.
  - **The suite** (`munchly-mango-stage.journey.ts`, SC-190's, evolved):
    - the admin tour's green rings, clicks and cards (`ink: 'green'`, `notes: 'card'`), on 15 major moments instead of 22 notes, and a chapter card for each of 13 chapters (`recording.chapters.json`);
    - `E2E_SHOWN` 2; Priya keeps Execution open, and the staff sale (with its 18 UPI references and the receipt whole) and Feeding India's pickup (confirmed, then collected) are each checked landing live there;
    - every paper read top to bottom, ending on who signed it: Priya's pack, the sales register and a kirana's invoice, Meera's receipt, Lakshmi Agencies' own papers;
    - the ledger's Money and GST readings, the Impact dashboard and the batch's BRSR line; last, the batch's swing sheet (SC-195) read section by section;
    - `E2E_KEEP` takes `{stamp}`, the run's start; the stage's bar says when it was recorded.
  - **The stage** (`stage.ts`): `read()`, a tall block read top to bottom a part of a screen at a time; a note card never wider than its screen (a phone's); the monitor window named for the flow.
  - **The run of 13 Oct on production** (`runs/2026-10-13-prod-mango/REPORT.md`): passed, 69 steps in 14 min 19 s, against `5070e166`. The recording (14 min 9 s, 2560 × 1440) and its 1080p copy are `playwright-automation-videos/munchly-mango-e2e-prod-2026-10-13_09-09-12*.mp4`, local.
    - Plan and actual ₹16,917.10; 52 shops, 1,372 packets (two on the phone); 150 to staff on LA/SR/26-27/0002 (18 UPI payments, ₹1,200); 58 to Feeding India, FI/HYD/26-27/0417; CN/0117 ₹5,932; the swing ₹22,194.30; Lakshmi Agencies ends whole.
    - Findings: one console resource that failed to load once; the known twelves on the offer screen.
    - A first attempt stopped at ESG: the suite changed the address to the ledger's Impact reading, which the ledger reads only as it opens; it now presses the reading. Its partial video is kept as `…_08-49-53-incomplete.mp4`.
  - **After it:** production's journey day is back at 24 hours; the Mango cleared, the chips at day 0.
  - **Checks:** the frontend gate passes (api 83, core 408, admin 22, console 2, demo 9, workspace 115).
- **SC-202** (PR #183, merged; Done): Munchly Chips Sad Path E2E on production from a journey reset, recorded and shown live, told as SC-201 tells the Mango Drink, asked for by the maintainer.
  - **The request:** as SC-201's, with the kiranas: "only 2 should accept and rest reject, show only 2 accepts and 1 rejects and rest rejection do from backend". The chips' plan has no staff sale or food bank (its lines are the kiranas' scheme and the ExpireSoon lot), so Priya's Execution follows the orders, the lot and the destruction instead.
  - **The suite** (`munchly-chips-sad.journey.ts`, evolved):
    - green rings, clicks and cards on the major moments, and a chapter card for each of 14 chapters;
    - two kiranas order on the phone; Om Sai Provision presses Not this time on the phone, and the other 34 shops that joined the app say no through backend-api as themselves (`POST …/offer/decline`; Shree Sai Kirana, only invited, cannot answer). A no does not close the scheme (the shop keeps its 48 hours), so Neha still closes the window;
    - Priya keeps Execution open from her yes: each order, the lot awarded and collected (read from the card's badge: its four stops name Won and Collected all along), the window ending short, the destruction asked for, checked and approved; she gives her second yes from Execution's destruction card;
    - every paper read top to bottom: Priya's pack (the certificate and its log, both credit notes, the tax invoice with its e-invoice, the GST memo, the register and both kiranas' invoices), Rakesh's papers, a kirana's invoice on the phone; then the ledger's Money and GST, the Impact dashboard and the BRSR line; last, the swing.
  - **Shared with the Mango suite** (`read.ts`): `readPaper` (every page of a paper, in its sheet or beside the pack, ending on its signature), `closeSheet`, `sigs` and `showSwing`.
  - **The run of 13 Oct on production** (`runs/2026-10-13-prod-sad/REPORT.md`): passed on the first attempt, 87 steps in 17 min 48 s, against `5070e166`. The recording (17 min 38 s, 2560 × 1440) and its 1080p and 720p copies are `playwright-automation-videos/munchly-chips-sad-e2e-prod-2026-10-13_11-07-40*.mp4`, local.
    - Plan ₹21,770; 2 shops, 48 packets; 35 said no; 772 at ₹14.20 (token ₹1,644); 540 left at the godown; Vision 4 of 4; CN/0118 ₹13,284 and OCE/DC/26-27/0219 for 540 packs, signed by four; actual net ₹11,702.40; the swing ₹14,868; Rakesh ends whole.
    - The only finding: Shree Sai Kirana cannot answer, being only invited.
  - **After it:** production's journey day is back at 24 hours; the chips cleared, the Mango Drink at day 0.
  - **Checks:** the frontend gate passes (api 83, core 408, admin 22, console 2, demo 9, workspace 115).
- **SC-203** (PR #184, merged; Done; bug found by the maintainer): rolled figures sat off a straight line.
  - **Found:** on the console's Overview, "The numbers look and feel is misaligned not in straight line" (₹64,79,201, 39, 12, 41).
  - **Measured** against the same digits set as plain text: at 1× a rolled digit could sit a pixel above the rest (the 4 and the 9 at 30 px; the 1 of 21,770 in the design system's specimen), at 2× a device pixel, and a comma 2 px from where plain text puts it.
  - **The causes:** each digit is a strip of ten rows `0.98em` tall (29.39 px at 30 px), so each row started at a different fraction of a pixel and the browser snapped each glyph to a whole pixel on its own; the strip moved by `digit × 0.98em`, a hair off the rows as laid out; the separators sat in the figure's own line height (1.1), not the digit cell's.
  - **The fix** (design3 `components.css` and `world.jsx` Roll first, then core's `Roll.svelte` and `components.css`, verbatim): rows a whole number of pixels tall (`round(0.98em, 1px)`, with `0.98em` before it for a browser without `round()`), the strip moved a tenth of its own height a step, and the separators on the same line. Every rolled figure shares it: the console's Overview, Money and DaysNum in the workspace, the landing page's ledger.
  - **Checks:** the console's Overview on its mock build and design3's specimen, measured character by character against plain text at 1× and 2×: every digit and comma now lands where plain text puts it. The frontend gate passes (api 83, core 408, admin 22, console 2, demo 9, workspace 115).
  - **Hosting:** design3's `dist/` is rebuilt. The hosted pages stay on their pinned commits; production follows on the merge to `main`.
- **SC-204** (PR #185, merged; Done): Admin and console walkthrough, a few minutes on one laptop on production, recorded, asked for by the maintainer.
  - **The request:** start on the production landing page, scroll over it quickly, then highlight and click Console; sign in as a Super admin; show, brief and high level, how admins track the Overview's dashboards and the agents running, how SaaS clients are configured with their data and user setup, and how agents are configured per client, with the green notes of the other journeys. Then, mid-run: "dont highlight/bix anything on landing screen, except for console button"; and "show how Blinkit Zepto deadlines can be customized at SKU and batch level".
  - **The suite** (`admin-console-walk.journey.ts`, `corepack pnpm test:journey:admin-walk`, its own Playwright project), between the one-minute tour (SC-199) and the detailed run (SC-197), in green cards and a chapter card for each of six parts:
    1. the landing page, scrolled over with nothing ringed but the bar's Console, pressed;
    2. Neha, a Super admin, signs in on the console's screen;
    3. monitoring: the Overview's figures read live, Agents at work, what waits on a person and the runs today, the platform's agents;
    4. every client and where New client starts; Kaveri Foods' first stock export mapped and its supply chain, its people;
    5. quick-commerce gates by SKU and batch on Munchly Foods, read and never changed (`E2E_GATES_CLIENT`): the SKU table, the Mango Drink's own gates, MF-2409-204's override with its reason, the override's form opened and cancelled;
    6. Kaveri Foods' agents: the pipeline, the Watcher's gate saved, the Negotiator on Act, the approval always on.

    It adds no client; Kaveri's Watcher gate moves between 60 and 65 days each run, with its audit line, as the tour's does.
  - **The stage** (`stage.ts`): a note card with no room beside, under or over what it reads sits inside the screen at its foot's right corner, with no caret; the first take's cards went past the screen's edge, cut off.
  - **The run of 13 Oct on production** (`runs/2026-10-13-prod-admin-walk/REPORT.md`): passed, 15 steps in 3 min 40 s, against `730f90c0`, with no finding. The recording (2560 × 1440) and its 720p copy are `playwright-automation-videos/admin-console-walk-prod-2026-10-13_12-16-11*.mp4`, local; two earlier takes are kept as `…-superseded.mp4`. Munchly's gates read back unchanged afterwards.
  - **Checks:** the frontend gate passes (api 83, core 408, admin 22, console 2, demo 9, workspace 115).
- **SC-205** (PR #186, merged): the working demo made again from the three production recordings of 13 Oct (SC-204's admin and console walkthrough, SC-201's Mango Drink, SC-202's chips sad path), asked for by the maintainer, in two cuts.
  - **Cut 1** (3 min 39.5 s): the problem, the product and the agents' animation (the production console's sign-in, captured frame-exact at 2x on a virtual clock, `vclock.js`), the console, the Mango Drink from Rehearsal, the chips' sad path. A frame compositor that never scales a screen on screen (rings with cards, never zooms) cured SC-200's shake and blur; the stage's own green note cards were cut round in every window.
  - **Cut 2** (3 min 39.2 s, under the 235 s cap), on the maintainer's notes: no Report now; the people as characters at work beside their own live device, the app's real pushes popping up on it (backend-api's own words, `src/pushes.json`; the Hindi offer shaped by Chromium); the console setting a brand up quickly (stock export mapped, people invited, gates per SKU, agents tuned); quick sign-ins on production; a "live on production · Cloud Run · Gemini" tag, and the voice says so; kiranas offered in their own language, more Indian languages and WhatsApp on the roadmap; the opening condensed to 11 s; the agents' animation untouched.
  - **The people:** Priya, Lakshmi Agencies, a kirana shopkeeper, the staff paying by UPI, Meera loading the food bank's van, the Saturday van delivering, Agrawal on his tablet, Rakesh by the stack and at the landfill (photographing, then signing with the agency's officer and two witnesses), Neha at the console. Qwen keyframes, then edits of the same frame where a person returns, so each face stays the same; every name tag's face cut from the person's own keyframe (`faces.py`); LTX 540p clips.
  - **Nothing invented:** every keyframe checked at full size and every clip by contact sheet before use. Rejected: a landfill heap with tablets, then lettering on the excavator and brand-like printing on packets; a worker with two phones; a tablet turned into a folder; a destruction clip whose falling packets glowed like flames; the chips' godown clip twice. The only label in the film is the real label photo Lakshmi Agencies sent.
  - **Steady:** LTX pushes in even when told to hold still and the push can change a face. `clipcheck.py` measures each clip's gentle stretch, `stab.py` locks it to a tripod frame, `deflash.py` removes one-frame flashes, `prep-clips.py` retimes it to its shot, and `breathe.py` plays a short clip forward and back with eased turns where a shot is longer. Resting screens hold to the sub-pixel; every window plays between 0.55× and 1.25× (the labelled fast-forward aside).
  - **Where:** `working-demo/smart-clearance-working-demo-2026-10-13_18-52-26.mp4` (crf 17), its 720p copy and captions, beside cut 1 (`…_14-11-48`) and SC-200's cut (`previous-SC-200/`); the crf-21 1080p, 720p and captions, every keyframe and clip with its sidecar, in `design3/designs/SC-205/`. −14.0 LUFS. The spend: nothing (Qwen, LTX, Kokoro and Whisper locally; SC-187's music reused).
- **SC-206** (PR #187, merged; Done): cuts 3 and 4 of the working demo, each at most 240 seconds.
  - **Cut 3**, on the maintainer's ten notes on cut 2:
    - the app's own faces, cut from its cast sheets (SC-194);
    - an Indian English woman's voice (Maya1, local), every line read back word for word;
    - each person seen at work, then their device brought into focus (a whip pan, then a push into the screen or the screen lifting out);
    - the batch's own labels on the cartons, the papers highlighted, the UPI scan made clear;
    - every device the right way round, its screen towards its user.

    3 min 59.0 s (`working-demo/…_2026-10-14_01-31-38.mp4`).
  - **Cut 4**, on five notes on cut 3 ("This looks really really good"), with the smooth motion of the film on spoileralert.com (studied frame by frame in the browser; nothing downloaded) as its model:
    - **The opening:** a distributor's godown at dawn (Qwen, then LTX, stretched 1.2× by motion interpolation), the words landing as the voice says them; then the camera rushes into one carton's label: its best-before ringed, 22 days left counted down. The second shot, a worker lifting a carton, was rejected: its clip crumpled the carton.
    - **The agents in 5.9 s** (`parts4.ArchScene`): five layers rise onto a platform in depth (Firebase Hosting, backend-api on Cloud Run with Cloud SQL, Pub/Sub and Scheduler, the ten agents on Google ADK, Gemini on Vertex AI); routes draw on with packets; the camera dives into the agents' layer, and their walk runs through the nine stops to the amber yes.
    - **Rehearsal** is gone.
    - **New beats:**
      - the console's live Overview;
      - the Router's split drawn as routes (`PlanFlow`);
      - Lakshmi Agencies' own portal: she ends whole, every step, every paper, ticked as said (`Checklist`, `TiltIn`);
      - Impact's ledger, the year so far (2.30 t kept out of landfill, 930 meals), and the batch's BRSR line.
    - **The close** is 7.0 s: the mark draws its route as the design system plays it.
    - **Smoother:** the LTX clips play frame for frame at 25 fps (cut 3 showed one frame twice a second), and the stage's note cards no longer show through three segment joins (`cardscan.py` scans the dissolves now).
  - **Checks (cut 4):**
    - 230.80 s, −14.0 LUFS, −1.5 dBTP;
    - windows between 0.46× and 1.29× (the labelled fast-forward aside);
    - `cardscan.py`'s hits all the app's own green buttons;
    - the label's QR read back from the film's own frames;
    - 23 of 29 lines word for word from the final mix (the rest a word under the music, or a figure written differently).
  - **Where:**
    - `working-demo/smart-clearance-working-demo-2026-10-14_11-16-06.mp4` (crf 17), its 720p copy and captions;
    - the crf-21 1080p, 720p and captions, the keyframes and clips with their sidecars, the pipeline and its README in `design3/designs/SC-206/`.

    The spend: nothing (Qwen-Image, LTX, Maya1, Whisper and UTMOS locally; SC-187's music reused).
- **SC-207** (PR #188, merged; Done): cut 5 of the working demo, 3 min 56.2 s, under the maintainer's 238 s cap.
  - **The request:** ten notes on cut 4 ("take it to the next level"), then labels on the opening's cartons, Google Cloud narrated "subtle and techno functional", and a more human voice.
  - **The opening:** the sentence printed on a shipping label as the voice says it, stamped WRITTEN OFF on "slowly" (`LabelPrint`). Every carton in the godown carries a printed Munchly shipper label (`cartons.py`): Lakshmi Agencies' Mango Drink and Instant Poha, tracked through the dolly and taking the clip's light.
  - **The agents' walk in full** (`AgentsWalk`): all nine stops, a sound each, the yes, the three exits, Paperwork, Impact.
  - **Munchly's supply chain** (`MunchlyMap`): the brand, four distributors and their kiranas, the exits, then the happy path (the Mango Drink) and the sad path (the Masala Chips).
  - **New beats:**
    - Priya's sign-in in dark mode, captured frame-exact on production with the Firebase request held;
    - the workspace installed as a PWA on a laptop, a tablet and a phone, its pushes landing on all three;
    - how the swing adds up for each batch, bar by bar beside the app's own sheet (`SwingResult`);
    - "What comes next": WhatsApp, more Indian languages, native iOS and Android apps;
    - the guided demo's landing page, its URL and a QR code that opens it.
  - **Also:**
    - each Google Cloud service named as it is said (`TechTag`);
    - the packs' edges clean;
    - the end card aligned on one edge;
    - the voice Maya1 as a warm storytelling narrator, chosen by a bake-off and spoken a line at a time;
    - the bed about 12 dB under the voice.
  - **Found on the way:**
    - eight windows trimmed to play under 1.3×;
    - three of the stage's chapter cards and one ring kept out (`kit.RETOUCH`);
    - the walk's caption ghosting;
    - word cues preferring the exact word;
    - the subscript ₂;
    - a renderer crash on a tiny bar.
  - **Checks:**
    - 236.20 s, −14.0 LUFS, −1.5 dBTP;
    - windows between 0.46× and 1.30× (the labelled fast-forward aside);
    - both QR codes read back from the film's own frames;
    - 24 of 30 lines word for word from the final mix (the rest a figure or URL written differently, the brand spelled "Munchli", or one word heard differently from one slice, which reads right from another).
  - **Where:**
    - `working-demo/smart-clearance-working-demo-2026-10-14_13-46-56.mp4` (crf 17), its 720p copy and captions;
    - the crf-21 1080p, 720p and captions, the labelled godown clip with its sidecar, the pipeline and its README in `design3/designs/SC-207/`.

    The spend: nothing (Maya1, Whisper, UTMOS and Playwright locally; no image or video model run; SC-187's music reused).
- **SC-208** (PR #189, merged; Done): cut 6 of the working demo, 3 min 57.0 s, under the maintainer's 238 s cap.
  - **The request:** ten notes on cut 5, then "I need realistic photos and videos, not cartoon" (a clay first try at the new imagery was dropped unused).
  - **The opening:** no words on screen. Red WRITTEN OFF stamps thump onto the Mango Drink's cartons as the voice says "write off": two big ones on the near pallet, with a jolt, then a run down the stack's side. Each is tracked through the dolly, and a tally rolls up to −₹22,657 on 1,580 packs (`StampedGodown`, `WriteOffTally`).
  - **The bin:** what destroying costs, row by row from money.js: stock, disposal, EPR, and the GST input credit, shown kept, struck out and taken back (s.17(5)(h)), to −₹22,657 (`CostStack`).
  - **The people:** as the voice turns to them, Munchly's map docks into a card and the cast stands beside it with their roles, grouped by batch: Neha and Priya; Lakshmi Agencies, Sri Lakshmi Ganapathi Kirana and Meera on the happy path; Rakesh Traders and Agrawal Wholesale on the sad path (`MunchlyCast`).
  - **The agents at work:** wherever an agent works, its orb (icon, turning ring, pulse, sparks) stands where the tracker stood, with its name, stop and real tool calls typed under the headline (`AgentHead`).
  - **Phones held back to the camera:** the app's own push for the moment pops out of the device (`PhonePop`): the Watcher's alert, Vision's photo request, the Hindi offer, the pickup request and the counter-offer.
  - **The split:** "from the batch's sales history and Munchly's own rules". Cards for BigQuery's sales history and the console's rules land as it is said (`SplitWhy`); the amber ring on Approve ends as the sheet turns to Plan placed.
  - **The deliveries:** two photoreal LTX clips. Rakesh's van hands a labelled carton over a Nagpur kirana's counter; the wholesaler's truck loads the lot while Agrawal watches. A route inset draws both (`TwoClips`, `RouteInset`).
  - **On the record:** Priya's Record tab, captured read-only on production. Its audit trail in Cloud SQL is ringed; then "Sent the label photo" leads to its real production trace from Cloud Trace (232 spans, 34.1 s), played as a waterfall, with the same trace's Cloud Logging lines (`TracePanel`, `TraceLink`, `LogPanel`; `fetch-trace.sh`, `capture-record.mjs`).
  - **What comes next:** three photo cards on a colourful ground: WhatsApp (a shopkeeper's clip with the chat), six shopkeepers greeting in their own scripts, and the app in two phones on a counter (`NextScene6`).
  - **The close:** condensed. The tagline is on the card, not said, and the voice ends on "Sign-ins for the live app on Google Cloud are in our deck; the sample data is on GitHub", both shown as pills (`EndCard6`).
  - **Photoreal media:** 7 Qwen-Image keyframes (one an edit on Agrawal's cast sheet), the batch's real label printed on every carton sticker (upright on a shop's taller stickers), and 3 LTX clips, each reviewed full size and by contact sheet. Five lines re-voiced with Maya1, each read back word for word.
  - **Checks:**
    - 237.04 s, −14.0 LUFS, −1.5 dBTP;
    - windows between 0.47× and 1.26× (the labelled fast-forward aside);
    - `cardscan.py`'s hits are all the app's own green buttons, and the ring scan's runs are the spans cut 5 carried;
    - both QR codes read back from the film's own frames;
    - 26 of 31 lines word for word from the final mix (the rest one word heard differently in its slice, the brand as "Munchli", or a figure or URL written differently).
  - **Where:**
    - `working-demo/smart-clearance-working-demo-2026-10-14_19-41-20.mp4` (crf 17), its 720p copy and captions;
    - the crf-21 1080p, 720p and captions, the new keyframes and clips with their sidecars, the pipeline and its README in `design3/designs/SC-208/`.

    The spend: nothing (Qwen-Image, LTX, Maya1, Whisper, UTMOS and Playwright locally; SC-187's music reused).
- **SC-209** (In Review, branch `SC-209-working-demo-film-v7`): cut 7 of the working demo, 3 min 58.7 s, under the maintainer's 239 s cap.
  - **The request:** six notes on cut 6 ("really really solid and mind blowing"): a punchier opening, the landfill's background and its food waste and ESG impact, a livelier brand scene, animation on the empty left of "The scheme fills", ExpireSoon explained as an imaginary marketplace, and motion wherever the frame stood empty; then "I need this scene background must", of the opening's godown, which stays exactly as it was. On the first export: the landfill's background and camera motion seemed unrealistic, the factories at 0:22 were too rushed, and the agents' Google models should be named; then "change this background completely with something unique and aesthetic", picked from three concepts: A, the aerial trail.
  - **The opening:** over the same godown, a scan tags each tracked carton with its product and days left, counting down as a calendar card turns from 1 Sep to 2 Oct 2026, day 0; the WRITTEN OFF stamps; then "1,580 packs. 22 days left. −₹22,657 written off." slammed in with the voice (`StampedGodown7`, `DateTicker`, `Statement`).
  - **The bin:** the batch's cartons in one long curving trail across dark earth, seen straight down at golden hour, a drone slowly descending over it (a Qwen-Image concept as picked, then LTX, eased 1.3×). Beside it, what destroying costs Munchly and what it costs the planet: 339.7 kg buried, 849 kg CO₂e (indicative), 3.2 kg of packaging, 1,580 packs, reported under BRSR Principle 6 (`ESGPanel`). The landfill before it, and a second take of it with the labels tracked onto a real camera glide, stay local.
  - **The brand:** the write-off rolls into ₹16,917 recovered, "+₹22,194 better than the bin"; three brands' factories (two new keyframes in 2.5D), each held 1.75 s and cross-faded, with its own workspace sliding in; then the batch's packs flowing through ten agents to five exits (`RecoveryMorph`, `BrandScene7`, `ExitFlow`). The brand's line has 2 s more after it, taken from small pauses elsewhere.
  - **The models:** Gemini 3.1 Pro for the Valuer, the Router and the Negotiator's bids, Gemini 3.8 Flash for the other agents (the Watcher runs rules and calls none), as the agents' code sets them: on the architecture's Gemini layer and tag, beside each agent in the walk, and in each agent's header.
  - **Motion where the frame stood empty:** the Watcher's sell-through; the kiranas as maps (design3's own world, `kiranas.json`): the offer going out, the scheme filling in step with Priya's live screen (its counts read off the recording), the chips' 35 declines; one GST invoice per order; ExpireSoon "an imaginary marketplace" (in the voice too) and the negotiation on one price line; the window closing on 540; the agency's route and the proof asked for; Vision sweeping the two photos with its checks; the certificate signed with the signers' strokes; Priya's second yes; the UPI list as the phone pays; Feeding India's 58 meals; the year's kilos on one scale.
  - **Found on the way:** the recovery landed at the whip; the kicker could not be read over bright factories; the exits' counts ran off the frame; a light weight's last glyph was clipped (`text_sprite` now cuts to its ink); the fast-forward badge read 61× where the window plays 52×.
  - **Checks:** 238.72 s, −14.0 LUFS, −1.5 dBTP; windows between 0.47× and 1.28× (the labelled fast-forward aside); the note-card and ring scans as cut 6's; both QR codes read back; 26 of 31 lines word for word from the final mix.
  - **Where:** `working-demo/smart-clearance-working-demo-2026-10-14_23-55-28.mp4` (crf 17), its 720p copy and captions (the first export, `…_21-10-50-superseded`); the crf-21 1080p, 720p and captions, the new keyframes and the bin's clip with their sidecars, the pipeline and its README in `design3/designs/SC-209/`. The spend: nothing (all local; SC-187's music reused).
- The seven pinned artifacts were shared in #smart-clearance. Sharing them with two teammates as commenters is still to be done by hand on claude.ai.
