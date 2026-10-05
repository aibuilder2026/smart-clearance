---
name: design-first
description: Design before code for any Smart-Clearance UI or UX change. Use whenever the maintainer asks for a design change to the app, the guided demo, the landing page, the console or the design system, such as a new screen, a redesign, or a change to layout, flow, visuals, copy hierarchy or motion. The change goes the Claude Design route first, in four steps. Design 2 or 3 options with impeccable, ui-ux-pro-max, the taste skills, Framer Motion, Qwen-Image and LTX; save them in design3/designs/; publish a review board to the matching Claude Design project; and build only the option the maintainer picks.
---

# Design first

Every new UI or UX change to Smart-Clearance goes the Claude Design route first. No source under `design3/` changes until step 4.

1. **Design 2 or 3 options** with the design tools.
2. **Save them in `design3/designs/SC-<n>/`** and commit them on the issue's branch. `design3` is the source of truth for designs.
3. **Publish** one review board to the Claude Design project for that surface.
4. **The maintainer picks one option.** Build only that option, and only after the pick, made in the current request.

Small fixes that change no design skip this: a typo, a broken link, or a bug with one obvious fix. When unsure whether something is a design change, treat it as one. The project hook `.claude/hooks/design-first-reminder.sh` repeats this rule whenever a request reads like a UI or UX change.

## 0. Ticket, branch and context

- Find or create the SC issue for the request and move it to In Progress (21). Creating, commenting on and moving issues need no asking.
- Create the branch `SC-<n>-<slug>` from `main` now, so the designs can be committed. The build continues on the same branch after the pick.
- Read the context:
  - `PRODUCT.md` and `DESIGN.md` (design system v3);
  - the surface brief under `.impeccable/surfaces/`, if one exists;
  - earlier designs for the same surface in `design3/designs/`.
- Capture how the screens involved look now, into `design3/designs/SC-<n>/current/`. Serve `python3 -m http.server 8787 --directory design3`, then screenshot with Playwright in light and dark, at 1440 and 390 wide.

## 1. Design 2 or 3 options

### Tools by surface

| Surface | Lead | Also |
| --- | --- | --- |
| Landing page (`design3/site`) | `impeccable`, Persuade mode | `design-taste-frontend` and `high-end-visual-design`; `qwengen-bf16` for plates and comps |
| App, demo and console screens (`design3/app`, `design3/demo`, `design3/console`, `design3/screens`) | `impeccable`, Operate mode (`shape`, `layout`, `critique`) | `ui-ux-pro-max` for UX rules (`python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<outcome>" --domain ux`); `redesign-existing-projects` to audit a screen that exists; `qwengen-bf16` only when the design calls for imagery |
| Design system (`design3/system`, `DESIGN.md`) | `impeccable` (`extract`, `document`) | `ui-ux-pro-max --design-system`, as a reference only |
| Motion, on any surface | Framer Motion: `framer-motion` 11.18.2, the `Motion` global the design system already loads, prototyped in the HTML mockups. The SvelteKit build (`frontend/`) ships the same motion with `motion` (motion.dev) and Svelte transitions, from the same springs, eases and durations (`frontend/core/src/lib/motion`) | `impeccable animate` for the motion grammar; `ltx-clip` only for a video asset such as the carton loop, never for interface motion |
| Charts | `dataviz` | Validate palettes with its script |
| Canvas, WebGL and Three.js effects, on any surface | The `threeui-community` plugin: `/threeui <effect>` finds a ThreeUI Community component (MIT) and returns its source | Adapt it, never drop it in: design system v3's inks, motion that stops within five seconds, reduced motion, and the MIT notice beside the adapted code (AGENTS.md, Design) |

The taste skills say they are for landing pages, portfolios and redesigns, not dashboards or multi-step product UI. Keep them off the app, demo and console screens.

### Rules

- **Precedence.**
  1. The maintainer's words.
  2. `PRODUCT.md` and `DESIGN.md`.
  3. impeccable.
  4. The other skills.

  A skill's defaults (its fonts, palettes, card styles) never override `DESIGN.md`.
- **2 or 3 options, every time.**
  - Each option is a complete answer to the request, different in a way that matters: structure, flow, emphasis or treatment. Never the same idea in two colours.
  - Mark one as recommended, and say why.
  - Each shows the main screen in light and dark, at desktop and phone width.
  - The picked option gets its remaining states (empty, loading, error, long content) before the build starts.
- **Visible.** Every option is something the maintainer can look at:
  - **a comp:** a Qwen-Image render of the screen, from a screenshot of the current screen as reference or generated from scratch, with its prompt sidecar;
  - **an HTML mockup:** built from the real tokens and components (`design3/system/*.css` and the kit). Keep it static, or clickable where the flow is the point;
  - **motion:** a Framer Motion prototype in the HTML mockup, so the motion reviewed is the motion the build will ship. Load React 18.3.1 and framer-motion 11.18.2 as the hosted pages do.
    - Use the build's own patterns: `motion.*`, `AnimatePresence`, `useReducedMotion`, and `useScroll` / `useTransform` for scroll-linked motion.
    - Use the motion tokens in `DESIGN.md`: ease `cubic-bezier(0.22, 1, 0.36, 1)`, 160 / 240 / 420 / 700 ms, springs for sheets.
    - Name any new spring by its stiffness, damping and mass, so the Svelte build can carry it over exactly (`SPRINGS` in `frontend/core/src/lib/motion`).
    - Animate transform and opacity first.
    - Nothing loops forever.
    - Under reduced motion every step lands in its final state at once.
- **Project rules hold in the designs:**
  - WCAG 2.2 AA: contrast measured on the real background, 44 px targets, visible focus;
  - every figure from `core/money.js`;
  - every company and person fictional, and labelled so.

## 2. Save in design3

`design3` is the source of truth for designs. Every design created or edited is saved under `design3/designs/SC-<n>/` and committed on the issue's branch. That covers:
- the options, the comps and the mockups;
- the motion prototypes;
- the review board;
- the record of the pick.

impeccable's `.impeccable/` folder is tool state only. Copy its mock-ups into `design3/designs/`. Claude Design and claude.ai artifacts hold published copies, never the only copy.

```
design3/designs/SC-<n>/
  board.html        the review board, opened locally through the 8787 server
  decision.md       the request in the maintainer's words, the options, the pick and its date
  current/          screenshots of the screens as they are now (WebP)
  option-a/         that option's comps (WebP with a .prompt.json sidecar), mockup.html and motion prototype
  option-b/
  option-c/
  src/              PNG originals; local only (gitignored), since only WebP ships
```

The board holds:
- the request;
- the current screens;
- each option with its rationale, trade-offs and what the code change would touch;
- the recommended option;
- any open question.

Mockups link the design system relatively (`../../../system/tokens.css` and so on). Commit and push before publishing, so the published copies can pin to the commit.

## 3. Publish for review and get the pick

| Working on | Claude Design project |
| --- | --- |
| The app (Munchly's workspace) | app v3, `78962e0f-7300-46e4-8be7-ee1cbd101839` |
| The guided demo | demo v3, `8294ec70-3e6b-4359-8de6-2a3fd056c3b2` |
| The landing page or the console | platform v3, `976c5462-c3c3-4621-80b5-29b3cdda8326` |
| The design system | DS v3, `909d23bb-bd3c-466b-abf8-4eccc7c5881e` |

Shared screens (`design3/screens`, `design3/core`) go to the app project. Name the demo project too when the demo shows them.

- **Paths.** Publish the board as a root-level page, `SC-<n> design review.html`, and each HTML mockup as `SC-<n> option A.html` and so on. Never touch the hosted pages: the `v3.html` files, `manifest.webmanifest` and `sw.js`.
- **Assets.** Point the published copies' images at GitHub raw, and their design system at jsDelivr (`dist/`), both pinned to the pushed commit, as the hosted pages do. If a pinned link cannot serve something, write it with `write_files` and `encoding: "base64"`.
- **Writing.**
  1. Call `finalize_plan` for the paths.
  2. Call `write_files` with `if_match` (`"0"` for a new path).
  3. Call `render_preview`, then check every page in a browser.
- **Asking.**
  1. Give the maintainer the claude.ai/design link (never the serve URL), and comment it on the SC issue.
  2. Ask for the pick with `AskUserQuestion`: one choice per option, the recommended one first, plus "None of these: rework".
  3. Read comments left on the board with `list_comments`, and `ack_comments` once they are handled.
- **The pick.** Record it in `decision.md` and on the SC issue.
  - "None of these", or feedback, means another round: back to step 1, saved over the same folder and republished to the same board.

## 4. Build the picked option

- **When.** Only after the maintainer picks an option in the current request. Build that option only.
- **How.** On the same branch, the usual flow:
  1. Build with impeccable, comp-led when the pick includes an approved comp.
  2. Run `./build.sh`.
  3. Run the accessibility suite.
  4. Run `./dist.sh`, then re-pin the hosted pages.
  5. Where the surface is already in the SvelteKit build (the landing page and the design system, in `frontend/`), port the change there too, after design3: update the ported CSS (its drift tests name what moved), the components and the seed, and run `corepack pnpm lint && corepack pnpm check && corepack pnpm test`, the e2e suite and the parity suite in `frontend/`.
  6. Move the issue to In Review, with the evidence.
  7. Ask once about the PR, the merge and closing the issue.
- **Afterwards.** The designs stay in `design3/designs/`. Whether the published board stays in Claude Design is the maintainer's call.
