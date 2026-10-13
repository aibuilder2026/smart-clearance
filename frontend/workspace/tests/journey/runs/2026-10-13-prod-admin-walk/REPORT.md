# Admin and console walkthrough, on production: run of 13 Oct 2026

The platform's own side in 3 min 40 s on one laptop (SC-204): the landing page to the console, monitoring, a SaaS
client's data and users, quick-commerce gates by SKU and by batch, and a client's agents configured. It ran on
production's apps (smartclearance.web.app, smartclearance-console.web.app) and backend-api on Cloud Run.

**Passed**, 15 steps, with no finding.

The maintainer asked for an Admin and console journey on production that starts on the landing page, scrolls over it
quickly, then highlights and clicks Console; signs in as a Super admin; and shows, brief and high level, how admins track
the Overview's dashboards and the agents at work, how SaaS clients are configured with their data and user setup, and
how agents are configured per client, with the green notes of the other journeys. Then: nothing highlighted on the
landing page but the Console button; and the Blinkit and Zepto gates customised by SKU and by batch, shown too.

It ran on branch `SC-204-admin-console-walk`, against production at `730f90c0` (SC-203 deployed).

- **What ran:** `E2E_TARGET=prod E2E_KEEP='…/playwright-automation-videos/admin-console-walk-prod-{stamp}.mp4'
corepack pnpm test:journey:admin-walk`, with the monitor window on screen.
- **The recording:** `playwright-automation-videos/admin-console-walk-prod-2026-10-13_12-16-11.mp4` (2560 × 1440,
  36.8 MiB), its 720p copy (9.8 MiB) and `….chapters.json`, local and git-ignored. The stage's bar reads "recorded 13
  Oct 2026, 12:16 BST".

## Chapters

| #   | Chapter                                   | From | To   |
| --- | ----------------------------------------- | ---- | ---- |
| 1   | The landing page, then the console        | 0:00 | 0:27 |
| 2   | A Super admin signs in                    | 0:27 | 0:44 |
| 3   | Monitoring the platform                   | 0:44 | 1:31 |
| 4   | A SaaS client: Kaveri Foods               | 1:31 | 2:14 |
| 5   | Blinkit and Zepto gates, by SKU and batch | 2:14 | 3:04 |
| 6   | Kaveri Foods' agents, configured          | 3:04 | 3:40 |

## What it showed

- **The landing page,** scrolled over with nothing on it ringed, then the bar's Console, ringed and pressed.
- **Neha Kulkarni, a Super admin,** signing in on the console's own screen.
- **Monitoring:** the Overview's four figures, read live; Agents at work, every batch at its stop, one stop listed;
  Needs attention, demo requests and the runs today; the platform's agents across every client.
- **A SaaS client:** every client and where New client starts; Kaveri Foods' first stock export mapped by the Data
  agent and its supply chain (its data), and its people with the invitation (its users).
- **Gates by SKU and batch,** on Munchly Foods, read and left unchanged: the SKU table (the default, Blinkit 90 days,
  Zepto and Instamart 60% of life); the Mango Drink's own gates (45 days, 50%) and its batch checked against them;
  Choco Cream Biscuits' batch MF-2409-204 overridden for Zepto and Instamart to 30%, with its reason; the override's form
  opened, then cancelled. Read back afterwards, Munchly's gates and the override are as they were.
- **Kaveri Foods' agents:** the pipeline; the Watcher's Blinkit gate changed and saved (65 days); the Negotiator on Act;
  the approval always on.

## What it changed on production

Kaveri Foods' Watcher gate (now 65 days) and its audit line, as the tour does; the gate moves between 60 and 65 days
each run. Nothing else.

## Before it

Two earlier takes the same morning passed too. They are kept local as `…-superseded.mp4`:

- the first showed where a note card had no room beside what it read: it went past the screen's edge, cut off. The
  stage now puts such a card inside the screen at its foot's right corner;
- the second still ringed the landing page's heading, and its narrator said Neha was signing in through Monitoring.
