---
name: design-first
description: Design before code for any Smart-Clearance UI or UX change. Use whenever the maintainer asks for a design change to the app, the guided demo, the landing page, the console or the design system, such as a new screen, a redesign, or a change to layout, flow, visuals, copy hierarchy or motion. Designs it with impeccable, ui-ux-pro-max, the taste skills, Framer Motion for motion, Qwen-Image and LTX, publishes the designs to the matching Claude Design project for review, and starts the code only after the maintainer confirms.
---

# Design first

A UI or UX change to Smart-Clearance takes three steps, in this order. No source under `design3/` changes until step 3.

1. **Design** it with the design tools.
2. **Publish** the designs to the Claude Design project for that surface, and ask for a review.
3. **Build** it only after the maintainer confirms, in their own words, in the current request.

Small fixes that change no design skip this: a typo, a broken link, or a bug with one obvious fix. When unsure whether something is a design change, treat it as one.

## 0. Ticket and context

- Find or create the SC issue for the request (creating, commenting on and moving issues need no asking), and move it to In Progress (21).
- Read the context:
  - `PRODUCT.md` and `DESIGN.md` (design system v3);
  - the surface brief under `.impeccable/surfaces/`, if one exists.
- Capture how the screens involved look now. Serve `python3 -m http.server 8787 --directory design3` and screenshot with Playwright in light and dark, at desktop and phone width (1440 and 390).

## 1. Design

### Tools by surface

| Surface | Lead | Also |
| --- | --- | --- |
| Landing page (`design3/site`) | `impeccable`, Persuade mode | `design-taste-frontend` and `high-end-visual-design`; `qwengen-bf16` for plates and comps; `ltx-clip` for motion |
| App, demo and console screens (`design3/app`, `design3/demo`, `design3/console`, `design3/screens`) | `impeccable`, Operate mode (`shape`, `layout`, `critique`) | `ui-ux-pro-max` for UX rules (`python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<outcome>" --domain ux`); `redesign-existing-projects` to audit a screen that exists; `qwengen-bf16` only when the design calls for imagery |
| Design system (`design3/system`, `DESIGN.md`) | `impeccable` (`extract`, `document`) | `ui-ux-pro-max --design-system`, as a reference only |
| Motion, on any surface | Framer Motion: `framer-motion` 11.18.2, the `Motion` global the design system already loads, prototyped in the HTML mockups | `impeccable animate` for the motion grammar; `ltx-clip` only for a video asset such as the carton loop, never for interface motion |
| Charts | `dataviz` | Validate palettes with its script |

The taste skills say they are for landing pages, portfolios and redesigns, not dashboards or multi-step product UI. Keep them off the app, demo and console screens.

### Rules

- **Precedence.**
  1. The maintainer's words.
  2. `PRODUCT.md` and `DESIGN.md`.
  3. impeccable.
  4. The other skills.

  A skill's defaults (its fonts, palettes, card styles) never override `DESIGN.md`.
- **Options.** When the direction is a real choice, show 2 to 4 options. Otherwise show one design, with the states it needs (empty, loading, error, long content) in light and dark, at desktop and phone width.
- **Visible.** Every option is something the maintainer can look at:
  - **a comp:** a Qwen-Image render of the screen, from a screenshot of the current screen as reference or generated from scratch. Save it under `.impeccable/mocks/design/SC-<n>/` with its prompt sidecar;
  - **an HTML mockup:** built from the real tokens and components (`design3/system/*.css` and the kit). Keep it static, or clickable where the flow is the point;
  - **motion:** a Framer Motion prototype in the HTML mockup, so the motion reviewed is the motion the build will ship. Load React 18.3.1 and framer-motion 11.18.2 as the hosted pages do.
    - Use the build's own patterns: `motion.*`, `AnimatePresence`, `useReducedMotion`, and `useScroll` / `useTransform` for scroll-linked motion.
    - Use the motion tokens in `DESIGN.md`: ease `cubic-bezier(0.22, 1, 0.36, 1)`, 160 / 240 / 420 / 700 ms, springs for sheets.
    - Animate transform and opacity first.
    - Nothing loops forever.
    - Under reduced motion every step lands in its final state at once.
    - An LTX clip is only for a video asset.
- **Project rules hold in the designs:**
  - WCAG 2.2 AA: contrast measured on the real background, 44 px targets, visible focus;
  - every figure from `core/money.js`;
  - every company and person fictional, and labelled so.
- **One review board per issue,** an HTML page holding:
  - the request in the maintainer's words;
  - the screens as they are now;
  - each option with its rationale and trade-offs;
  - what the code change would touch;
  - any open question.

## 2. Publish for review

| Working on | Claude Design project |
| --- | --- |
| The app (Munchly's workspace) | app v3, `78962e0f-7300-46e4-8be7-ee1cbd101839` |
| The guided demo | demo v3, `8294ec70-3e6b-4359-8de6-2a3fd056c3b2` |
| The landing page or the console | platform v3, `976c5462-c3c3-4621-80b5-29b3cdda8326` |
| The design system | DS v3, `909d23bb-bd3c-466b-abf8-4eccc7c5881e` |

Shared screens (`design3/screens`, `design3/core`) go to the app project. Name the demo project too when the demo shows them.

- **Paths.** Write the board as one root-level page, `SC-<n> design review.html`, with its images under `designs/SC-<n>/` and linked relatively. Never touch the hosted pages: the `v3.html` files, `manifest.webmanifest` and `sw.js`.
- **Writing.**
  1. Call `finalize_plan` for the paths.
  2. Call `write_files` with `if_match` (`"0"` for a new path). Write images as WebP at about 1600 px wide, with `encoding: "base64"`.
  3. Call `render_preview`, then check the board in a browser.

  If an image write is refused, put the images on a pushed `SC-<n>-design` branch and link them from GitHub raw, pinned to that commit, as the hosted pages do.
- **Asking for the review.** Give the maintainer the claude.ai/design link (never the serve URL), comment it on the SC issue, and ask for the review in one line.
- **Comments.** The maintainer can comment on the board in Claude Design. Read them with `list_comments`, and `ack_comments` once they are handled.

## 3. Build after the yes

- **The yes.** Start the code only after the maintainer confirms in the current request, for example "go ahead" or "build option B". Feedback instead of a yes means another design round: back to step 1, republished to the same board.
- **The build** follows the usual flow:
  1. Create the branch `SC-<n>-<slug>`.
  2. Build with impeccable, comp-led when an approved comp exists. Run `./build.sh`.
  3. Run the accessibility suite.
  4. Run `./dist.sh`, then re-pin the hosted pages.
  5. Move the issue to In Review, with the evidence.
  6. Ask once about the PR, the merge and closing the issue.
- **The board afterwards.** After the build ships, the maintainer decides whether the review board stays in the Claude Design project or goes.
