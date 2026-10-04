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
- **Accessibility:** run the suite first. For a manual WCAG audit, use the `accessibility-tester` agent with the `accessibility` and `web-design-guidelines` skills.
- **Charts:** the `dataviz` skill. Validate palettes with its script; don't eyeball them.
- **Images and motion:** `qwengen-bf16` for images (Qwen-Image) and `ltx-clip` for clips (LTX). Write the `.prompt.json` sidecar beside each asset.
- **Tickets:** the jira-flow skills: `/jira-flow:work`, `:status`, `:pr`, `:ship`.
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
- The full accessibility suite takes about 6 minutes, so give it a long timeout. While iterating, use `npm run test:desktop`.

## Recent changes (4 Oct 2026)

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
- The seven pinned artifacts were shared in #smart-clearance. Sharing them with two teammates as commenters is still to be done by hand on claude.ai.
