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
- **Accessibility:** the a11y, e2e and parity suites run only when the maintainer asks for them in the current request (the `browser-suites` skill, SC-55); never as a step of a design or UX change. For a manual WCAG audit, use the `accessibility-tester` agent with the `accessibility` and `web-design-guidelines` skills.
- **Charts:** the `dataviz` skill. Validate palettes with its script; don't eyeball them.
- **Images and motion:** `qwengen-bf16` for images (Qwen-Image) and `ltx-clip` for clips (LTX). Write the `.prompt.json` sidecar beside each asset.
- **Canvas, WebGL and Three.js effects:** the `threeui-community` plugin (user scope). `/threeui <what you need>`, or its `threeui` MCP tools, search ThreeUI's free Community catalog and return the source.
  - Adapt what it returns by AGENTS.md's design rules, with the MIT notice beside the adapted code.
  - ThreeUI's own MCP server is for Pro members only, and is not set up.
- **The frontend (`frontend/`):** a change to a surface already ported goes into design3 first, then into the Svelte port. In the browser pane:
  - preview the landing page with the `frontend-admin` (dev, :5173) and `frontend-preview` (build, :4173) launch configs, and the console with `frontend-console` (dev, :5174) and `frontend-console-preview` (build, :4176);
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
- When asked to run it, the full accessibility suite takes about 6 minutes, so give it a long timeout. While iterating, use `npm run test:desktop`.
- In the frontend the e2e suite takes about 30 seconds and the parity suite about 40, after a build. In the agent's sandboxed shell Firefox cannot start; Chromium and WebKit can.

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
- **SC-57** (In Review, branch `SC-57-request-tracing`): request tracing for backend-api. One trace ties a request's log lines, spans and audit rows together.
  - **The gaps it closes:** app logs carried no trace; there were no spans inside the backend; an audit row did not lead to its request; the apps sent no trace header.
  - **The apps:** `transport()` in `@smart-clearance/api` sends a W3C `traceparent` with every call, a new trace each, flags left to Cloud Run and the API; a failed call's `ApiError` carries its `trace`. Checked on the live API: Cloud Run keeps a client's trace id.
  - **backend-api** (`tracing.py`): OpenTelemetry 1.45 with spans for each route (not the health checks), each SQL statement (an `EngineTracer` per engine) and the sign-in check ("verify ID token"), with Firebase's HTTP calls under it (requests, not httpx: firebase-admin's auth uses requests).
    - **Logs:** a JSON line written during a request carries `logging.googleapis.com/trace`, `spanId` and `trace_sampled`, the crash handler's line included.
    - **Audit rows:** `details.trace`, beside what the change records.
    - **Sampling:** a request Cloud Run sampled is always kept; of the rest, `TRACE_SAMPLE_RATE` (0.25 on Cloud Run, `trace_sample_rate` in `infra/prod`).
    - **Export:** `TRACE_EXPORT=otlp` sends spans over OTLP to the Telemetry API (`telemetry.googleapis.com`), read in Cloud Trace. Google's Python Cloud Trace exporter is deprecated, so it is not used. A test trace exported from a workstation was read back from Cloud Trace with its three spans nested.
  - **Terraform** (`infra/prod`): the Telemetry and Cloud Trace APIs (both already on; adopted), `roles/telemetry.tracesWriter` for `sc-api` and `sc-api-local`, and `TRACE_EXPORT` and `TRACE_SAMPLE_RATE` on the service. The plan (4 to add, 1 to change) is saved and read, and waits for the maintainer's yes.
  - **Cost:** Cloud Trace ingests 2.5 million spans a month free, then 0.20 USD a million; the prototype's traffic stays well under.
  - **The agents:** `agents/README.md` sets the convention: the trace in each Pub/Sub message's attributes, and each agent run recording its trace id.
  - **Checks:**
    - backend-api 214 pass (9 new); the frontend gate passes; infra `check.sh` passes; ARCHITECTURE.md's 15 diagrams parse with Mermaid 11;
    - live: 6 pass, the console's calls carrying `traceparent` through CORS, and each audit row they wrote keeping its own trace id;
    - e2e: landing page 51, console 110 pass; only Firefox fails, as it can't start in the sandbox;
    - parity: landing page 29, console 80 pass;
    - design3's suite: 349 pass, with 0 failing WCAG rules.
  - **Hosting:** unchanged.
- The seven pinned artifacts were shared in #smart-clearance. Sharing them with two teammates as commenters is still to be done by hand on claude.ai.
