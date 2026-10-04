# CLAUDE.md

@AGENTS.md

## Claude Code specifics

**Which tool for what**

- **UI or design work:** the `impeccable` skill; `PRODUCT.md` and `DESIGN.md` are its context. For a finished build, hand off to `impeccable-finish-reviewer`. To record the design system, use `impeccable-documenter`.
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
- The full accessibility suite takes about 4 minutes, so give it a long timeout. While iterating, use `npm run test:desktop`.

## Recent changes (3 Oct 2026)

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
- **SC-22** (branch `SC-22-story-v6`, In Review): the story (v6) and the Journey Map now follow v4.1.
  - The story is told with the v3 renders and portraits, plus a new portrait for the Raipur buyer.
  - Both documents carry a detailed supply-chain diagram.
  - The story works through every v4.1 calculation.
  - The repo copy of the Journey Map is now v4.1.
- **SC-23** (To Do): move the v3 prototype's money model and demo data to v4.1.
- The seven pinned artifacts were shared in #smart-clearance. Sharing them with two teammates as commenters is still to be done by hand on claude.ai.
