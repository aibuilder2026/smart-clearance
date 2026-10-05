# @smart-clearance/testing

What the apps' Playwright suites share, so each app is held to the same checks:

| Entry                             | What                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@smart-clearance/testing/a11y`   | `scan()` and `report()`: design3/a11y's axe-core helpers, ported verbatim (WCAG 2.0 to 2.2, A and AA, a separate target-size pass). Findings go to the app's `test-results/a11y/`. |
| `@smart-clearance/testing/parity` | `compare()`: two screenshots, their diff by pixelmatch, attached to the report, failing above a share of pixels.                                                                   |

Each app keeps its own pages' helpers (how to open the landing page, how to sign in to the console) beside its specs.
