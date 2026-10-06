---
name: browser-suites
description: The frontend's e2e and parity suites and design3's a11y suite run only when the maintainer explicitly asks for them in the current request, never as a routine step of a design, UX change, port or ticket. Use when the maintainer says to run the e2e suite, the parity suite, the a11y or accessibility suite, the Playwright tests, the WCAG checks, or "all the suites". Covers what each suite is, what it needs first (a build, PUBLIC_API_BASE empty, a serving design3), the exact commands, and how to report the result. Also use to decide whether a request is an explicit ask.
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
| a11y | `design3/a11y/` | axe WCAG 2.2 AA scans of the demo, every role in the app, the landing page and the console, in five viewport and theme projects, plus the keyboard and motion specs | about 6 minutes; `test:desktop` (light and dark at 1440) about 2 |
| e2e | `frontend/admin/tests/`, `frontend/console/tests/` | the same axe scans in five projects, keyboard, motion, the console's flows, and Firefox and WebKit smoke, against each app's build | about 30 seconds an app, after a build |
| parity | the same folders, the parity specs | each app's build against its design3 prototype, pixel by pixel | about 40 seconds an app, after a build |

The live e2e suite, `backend-api/scripts/e2e.sh` (the landing page and the console on the local API and Firebase),
counts as a suite too: it runs on request only, and it adds a client to the local database.

## Before running

- **A build first** for e2e and parity: `corepack pnpm build` (or `build:admin`, `build:console`). Each suite serves
  its own build on a preview port (4174 and 4177), so the dev servers need not run.
- **`PUBLIC_API_BASE` empty.** The e2e and parity suites run on the mocks, even while `.env.local` points at the local
  API. Run them as `PUBLIC_API_BASE= corepack pnpm test:e2e`.
- **Browsers:** `npx playwright install chromium webkit firefox` once. In a sandboxed shell Firefox cannot start:
  expect the `firefox-desktop` project to fail there, and say so rather than treating it as a regression.
- **design3's suite serves design3 itself** (`serve.py` on port 8790); nothing else need run. Run `./build.sh` in
  `design3` first if a `.jsx` changed.
- **A long timeout** for the a11y suite (10 minutes or more).

## Commands

From `frontend/`:

```sh
corepack pnpm build
PUBLIC_API_BASE= corepack pnpm test:e2e              # both apps; test:e2e:admin, test:e2e:console for one
PUBLIC_API_BASE= corepack pnpm test:parity           # both apps; test:parity:admin, test:parity:console for one
```

From `design3/a11y`:

```sh
npm test                                             # the whole suite
npm run test:desktop                                 # light and dark at 1440 only
npm run report                                       # the HTML report after a run
```

One spec or project, when the maintainer names it:

```sh
npx playwright test site.a11y.spec.ts --project=desktop-light      # in design3/a11y
corepack pnpm --filter @smart-clearance/console exec playwright test tests/flows --project=flows   # in frontend/
```

## Reporting

Report what ran and the counts, in the form CLAUDE.md's records use:

- design3's suite: N pass, with 0 failing WCAG rules (or which rules failed, on which page and viewport);
- e2e: N pass, and which projects failed (Firefox in the sandbox is expected, and said so);
- parity: N pass, and the largest difference as a percentage, with the page and viewport.

A failure is reported with the test's name, the page and viewport, and the axe rule or the pixel difference. Fix a
regression you caused; for anything else, report it and ask. Put the counts in the ticket's In Review comment when
the maintainer asked for the suites as part of a ticket.
