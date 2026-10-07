---
name: browser-suites
description: The frontend's a11y, e2e and parity suites run only when the maintainer explicitly asks for them in the current request, never as a routine step of a design, UX change, port or ticket. Use when the maintainer says to run the a11y or accessibility suite, the e2e suite, the parity suite, the Playwright tests, the WCAG checks, or "all the suites". Covers what each suite is, what it needs first (a build, PUBLIC_API_BASE empty), the exact commands, and how to report the result. Also use to decide whether a request is an explicit ask.
---

# The browser suites, on request only

The e2e, parity and a11y suites take minutes, need browsers, and are not gates. The maintainer's rule (SC-55):
**they run only when the maintainer explicitly asks for them in the current request.** A new design, a UX change, a
port into `frontend/`, a ticket's build phase or a finish review is never a reason to run one on your own. The
automatic checks are the jira-flow gates (lint, types and unit tests; ruff and pytest; terraform fmt and validate),
which run on every pull request in CI.

A project hook, `.claude/hooks/ask-before-suites.sh`, turns any attempt to run a suite into a permission prompt. It
is a backstop: the asking belongs in words, before a prompt ever appears.

## Is this an explicit ask?

| The maintainer says | Run |
| --- | --- |
| "run the e2e suite", "run parity", "run the a11y suite", "run the accessibility tests", "run all the suites", "run the Playwright tests", "check WCAG on this" | the suite named, and only that one; "all" means all three |
| "build it", "port it", "ship it", "is it accessible?", "does it still match design3?", a ticket's checklist that lists the suites, a skill step that says to run them | no. Do the work, say which suite would answer the question and how long it takes, and offer to run it |
| a yes given in an earlier turn, or a plan that mentioned the suites | no. The ask is per request |

When unsure, treat it as not asked: say what you would run and ask.

## The suites

| Suite | Where | What it does | Takes |
| --- | --- | --- | --- |
| a11y | each app's `tests/e2e/*.a11y.spec.ts` (`admin`, `console`, `workspace`, `demo`) | on each app's production build (the real UI, never the `/ds` dev route): axe WCAG 2.2 AA scans of every landing-page section, every console screen, tab, sheet, menu, alert and toast, every role's screen in the workspace app, and every stage of the guided demo, in five viewport and theme projects, plus the keyboard and motion specs; then the coverage check, which fails if an app uses a core component no scan had on screen (SC-58; for the workspace app and the demo, every component the workspace screens in core use, SC-65) | about 2 minutes an app, with its build |
| e2e | each app's `flows.spec.ts` (console, workspace, demo) and `smoke.spec.ts` | the console's flows on the mock API, the workspace app's journey and the demo's playthrough on their stub, and the Firefox and WebKit smoke runs | a minute or two an app, with its build |
| parity | each app's `tests/parity/` | each app's build against its design3 prototype (site, console, app, demo), pixel by pixel (design3 served by `frontend/testing/design3-server.py` on :8790) | about 40 seconds an app, after a build |

The live e2e suite, `backend-api/scripts/e2e.sh` (the landing page and the console on the local API and Firebase),
counts as a suite too: it runs on request only, and it adds a client to the local database.

## Before running

- **A build:** `test:a11y`, `test:e2e` and `test:parity` each build their app first, and serve the build on a preview
  port (a11y and e2e: admin 4174, console 4177, workspace 4181, demo 4183; parity: 4175, 4178, 4182, 4184), so the dev
  servers need not run, but a preview server left on one of those ports stops the suite from starting.
- **`PUBLIC_API_BASE` empty.** The a11y, e2e and parity suites run on the mocks, even while `.env.local` points at the
  local API. Run them as `PUBLIC_API_BASE= corepack pnpm test:a11y`.
- **Browsers:** `npx playwright install chromium webkit firefox` once. In a sandboxed shell Firefox cannot start:
  expect the `firefox-desktop` project to fail there, and say so rather than treating it as a regression.
- **Parity serves design3 itself** (`frontend/testing/design3-server.py` on port 8790). Run `./build.sh` in `design3`
  first if a `.jsx` changed.
- **A long timeout** (10 minutes) for each app's `test:a11y`; run the apps one at a time over all four.

## Commands

From `frontend/`:

```sh
corepack pnpm build
PUBLIC_API_BASE= corepack pnpm test:a11y             # every app; test:a11y:admin, :console, :workspace, :demo for one
PUBLIC_API_BASE= corepack pnpm test:e2e              # every app; test:e2e:admin, :console, :workspace, :demo for one
PUBLIC_API_BASE= corepack pnpm test:parity           # every app; test:parity:admin, :console, :workspace, :demo for one
```

Each app's findings land in `test-results/a11y/<project>/<test>.json`, with the components each test's scans had on
screen; `node ../testing/src/a11y-coverage.ts`, from the app's folder, rereads them.

One spec or project, when the maintainer names it, on an existing build (`corepack pnpm build:console`):

```sh
corepack pnpm --filter @smart-clearance/console exec playwright test console.a11y.spec.ts --project=desktop-light
corepack pnpm --filter @smart-clearance/console exec playwright test --project=flows
```

## Reporting

Report what ran and the counts, in the form CLAUDE.md's records use:

- a11y: N pass for each app, with 0 WCAG findings and every core component it uses on screen (the coverage line), or
  which rules failed, on which screen and viewport, and which components no scan reached;
- e2e: N pass, and which projects failed (Firefox in the sandbox is expected, and said so);
- parity: N pass, and the largest difference as a percentage, with the page and viewport.

A failure is reported with the test's name, the page and viewport, and the axe rule or the pixel difference. Fix a
regression you caused; for anything else, report it and ask. Put the counts in the ticket's In Review comment when
the maintainer asked for the suites as part of a ticket.
