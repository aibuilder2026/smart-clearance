# Accessibility checks (WCAG 2.2 AA)

Automated WCAG checks for design v3 with [axe-core](https://github.com/dequelabs/axe-core) through Playwright (`@axe-core/playwright`), plus keyboard checks axe cannot make.

- `demo.a11y.spec.ts`: the guided demo, all nine stages, scanned where each stage opens and after every beat, then the finale.
- `app.a11y.spec.ts`: every role's screens in a journey state with real content, the approve sheet through "Plan placed", and the workspace sign-in at munchly.smartclearance.com:
  - the one-time-code, Google Workspace and join sheets;
  - an address outside the workspace, and "Find your workspace";
  - the people sheet;
  - the workspace sheet inside the app.
- `keyboard.a11y.spec.ts`: behaviour axe cannot see:
  - the sign-in tab order, from the email-or-phone field to "Find yours";
  - a sheet taking focus, keeping it and giving it back;
  - a menu button's menu: focus in on open, the arrows, Home and End, then Escape and Tab out;
  - the sign-in hero pausing and playing (WCAG 2.2.2).

  The menu and hero tests also scan their open and paused states with axe.
- `motion.a11y.spec.ts`: with motion on, walks the busiest states of the app, the demo and the design system and fails on any animation set to repeat forever (WCAG 2.2.2). Loading indicators are exempt.

In the demo, the laptop and phone previews are drawn scaled down, so they are left out of the target-size rule there (every other rule still covers them); the app spec checks the same screens at full size.

Target size is judged with the in-app push banners and toasts hidden. They float over the page for a few seconds and then leave, and while one is up axe counts whatever it covers as an obscured target; every other rule still checks the banners and toasts themselves.

Each test runs in five projects: desktop light and dark (1440), tablet light (820), and phone light and dark (390, touch). Animations are reduced so contrast is measured on settled colours.

## Run

```sh
cd design3/a11y
npm ci
npx playwright install chromium
npm test                      # all five projects
npm run test:desktop          # light and dark at 1440 only
A11Y_FAIL_ON=critical,serious npm test   # fail only on the worst impacts while a backlog is worked down
```

A static server for `design3/` starts on port 8790; the pages load React from unpkg, so the run needs a network connection.

## Results

- The terminal ends with a table of failing rules.
- `results/a11y-report.md`: every failing rule with its WCAG criteria, element count, the states it was seen in, and an example element.
- `results/<project>/<test>.json`: each test's findings, with axe's own explanation for the first few elements (for contrast, the two colours and the measured ratio).
- `npm run report`: the Playwright HTML report; each test carries its findings as `wcag-findings.json`.

axe-core decides only part of WCAG. Alt-text quality, reading order, screen-reader announcements and cognitive load still need a manual pass; the `accessibility-tester` agent covers that half.
