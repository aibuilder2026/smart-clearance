# @smart-clearance/testing

What the apps' Playwright suites share, so each app is held to the same checks:

| Entry                             | What                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@smart-clearance/testing/a11y`   | `scan()` and `report()`: the axe-core scan (WCAG 2.0 to 2.2, A and AA, a separate target-size pass), first ported from design3's suite, which SC-58 removed. Findings go to the app's `test-results/a11y/`, with the core components each test's scans had on screen (`COMPONENTS`). |
| `src/a11y-coverage.ts`            | Run by each app's `test:a11y` after Playwright: fails if the app imports a core component (outside the dev routes) that no scan had on screen, or one `COMPONENTS` cannot find.                                                                                                      |
| `design3-server.py`               | A threaded static server for `design3/` on :8790, which the parity suites compare against.                                                                                                                                                                                           |
| `@smart-clearance/testing/parity` | `compare()`: two screenshots, their diff by pixelmatch, attached to the report, failing above a share of pixels.                                                                                                                                                                     |

Each app keeps its own pages' helpers (how to open the landing page, how to sign in to the console) beside its specs.
