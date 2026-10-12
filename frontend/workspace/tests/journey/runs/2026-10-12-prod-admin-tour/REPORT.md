# Admin and console tour on production: run of 12 Oct 2026

The platform's own side of Smart-Clearance in about a minute, on one laptop, as raw footage for the final demo
walkthrough (SC-199). It ran on production's landing page (smartclearance.web.app) and console
(smartclearance-console.web.app), with backend-api on Cloud Run, against production at `6e9aa43`.

**Passed**, in 1 min 5 s of recording: 3 chapters and 4 steps, with no finding.

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:admin-tour`, branch `SC-199-admin-console-tour`, with the
  monitor window on screen.
- **The screen:** one laptop (1440 × 900), with Neha Kulkarni, a Super admin, and the narrator in a column beside it.
- **The notes:** green cards beside what is read, the tag and the title on one line, the note under them, and a caret
  pointing at it, as the maintainer's reference still has them but in green. The rings, clicks and the screen's outline
  are green too.
- **The recording:** `admin-console-tour-prod-2026-10-12.mp4`, 64.6 s, H.264, 2560 × 1440, 25 fps, 14 MB, with a 1080p
  copy (9 MB). They stay local (git-ignored), in the repository root's `playwright-automation-videos/`.
- **The record:** `report.json`, `chapters.json` and `stills/`, the screen at each of the 4 steps.

## Chapters

| #   | Starts | Length | Chapter                          |
| --- | ------ | ------ | -------------------------------- |
| 1   | 0:00   | 13 s   | The landing page, briefly        |
| 2   | 0:13   | 23 s   | Into the console                 |
| 3   | 0:36   | 29 s   | Kaveri Foods' agents, configured |

## What it shows

1. **The landing page:** its heading, then the bar's Console, to the console's sign-in.
2. **Into the console:**
   - the sign-in's agents, the approval picked, its card saying what it did;
   - Neha signs in;
   - the Overview's four figures, every client at a glance, read live every 30 s.
3. **Kaveri Foods' agents, configured:**
   - the client opened from Clients;
   - the eleven agents in the order they work;
   - the Watcher's Blinkit gate, changed and saved;
   - the Negotiator trusted to act (on Act);
   - the approval, always on.

## Figures

- **The client:** Kaveri Foods, set up by SC-197's run. No client is set up.
- **The Watcher:** Blinkit takes stock with at least 60 days. The gate moves between 60 and 65 on each run, so every
  run saves a change.
- **The Negotiator:** Act.

## Changed on production

Two audit lines on Kaveri Foods in Neha's name: the Watcher's gate, and the Negotiator to Act. An earlier attempt of the tour on
production (72.7 s, before it was trimmed to a minute) left the gate at 65 days, the reserve at ₹12.50 and the Negotiator on Ask, with their own audit
lines. This run put the Negotiator back on Act and the gate at 60; the reserve stays at ₹12.50.

## Findings

None.
