# Admin and console E2E on one laptop, on production: run of 12 Oct 2026

The platform's own side of Smart-Clearance on one laptop, raw footage for the final demo walkthrough (SC-197). It goes
from the landing page, briefly, to the console. There it covers monitoring the dashboards, creating a client, and
configuring and customising its agents. It ran on production's landing page (smartclearance.web.app) and console
(smartclearance-console.web.app), with backend-api and the agents on Cloud Run, against production at `6e9aa43`.

**Passed end to end**, in 18 min 36 s: 14 chapters and 54 steps, with no finding but the known note on the Overview.

The maintainer asked for a redo of the two-screen run (`runs/2026-10-12-prod-admin-detail/`):

- one screen, a laptop, moving from the landing page to the console;
- the landing page shown briefly;
- the major flows in the console, the dashboards among them;
- the notes as chat bubbles beside what they highlight, never over it, with a tail pointing at it, as WhatsApp's do,
  without the time and ticks;
- the flicker gone.

**The run:**

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:admin`, branch `SC-197-admin-console-detail`, with the
  monitor window on screen.
- **The screen:** one laptop (1440 × 900), with Neha Kulkarni, a Super admin, and the narrator in a column beside it.
- **The demo request:** sent before the recording through the landing page's own Book a demo endpoint
  (`POST /v1/demo-requests`), so the landing page is shown only briefly. Ritu Malhotra asks for Kaveri Foods on Pilot.

**The notes:** each is a bubble beside what is read, taking the side with room in the order right, left, below, above,
its tail pointing at the middle of what it describes. It carries the mark and its tag, a quoted line naming whose screen
it is and its address, then the note. While it shows, the rest of the screen dims and the ring closes in with corner
brackets, a sweep of light and a pulse. Several parts of one screen are numbered, each in its own bright cut-out, and
one bubble beside them all lists what each number is.

**The flicker, and its fix:** the screens' frames used to reach the stage on a 50 ms tick, 20 a second, and the 25 fps
recording repeated about one frame in five while anything moved. Long smooth scrolls also strobed. Now:

- frames reach the stage as they arrive;
- a short scroll glides at a readable pace, and a long one dips to dark and cuts.

On this run, repeated frames inside motion are 4% (36 of 875 changing frames), against 20% before.

**The recording:** `admin-console-laptop-e2e-prod-2026-10-12.mp4`, 18 min 33 s, H.264, 2560 × 1440, 25 fps, 128 MB,
with a 1080p copy and one 1080p clip per chapter (`…-chapters/`, with `chapters.txt` in YouTube's form and
`chapters.csv`). They stay local (git-ignored), in the repository root's `playwright-automation-videos/`.

**The record:** `report.json`, `chapters.json` and `stills/`, the screen at each of the 54 steps.

## Chapters

| #   | Starts | Length | Chapter                                                                                                |
| --- | ------ | ------ | ------------------------------------------------------------------------------------------------------ |
| 1   | 0:00   | 75 s   | The platform's landing page, briefly, and the way into the console                                     |
| 2   | 1:14   | 90 s   | Neha signs in to the console, after the agents at work behind its sign-in                              |
| 3   | 2:44   | 132 s  | Monitoring the platform: the Overview's dashboards, live                                               |
| 4   | 4:56   | 148 s  | Neha sets the company up as a client from its request, in seven steps                                  |
| 5   | 7:24   | 96 s   | Neha uploads the client's first stock export, and the Data agent maps it                               |
| 6   | 9:00   | 37 s   | Neha invites the client's approver, and reads its people                                               |
| 7   | 9:37   | 214 s  | Neha configures the new client's eleven agents, one by one                                             |
| 8   | 13:11  | 51 s   | Neha sets the client's channels and rules, and how packs are destroyed at the godown                   |
| 9   | 14:02  | 18 s   | Neha reads the client's integrations and moves its plan                                                |
| 10  | 14:20  | 23 s   | Neha reads the new client's audit log                                                                  |
| 11  | 14:43  | 95 s   | A live client, Munchly Foods: its journey clock, its agents' runs and timers, its SKUs and their gates |
| 12  | 16:18  | 98 s   | The platform's own screens: Clients, Agents, Connectors, Plans, Staff and the audit log                |
| 13  | 17:57  | 12 s   | Neha sees the new client among the clients                                                             |
| 14  | 18:09  | 24 s   | Neha reads her account and signs out of the console                                                    |

## Figures

- **Demo request:** Ritu Malhotra, Kaveri Foods, ritu@kaveri-foods.example, Snacks and drinks, Pilot.
- **The Overview:**
  - ₹64,67,498 recovered in 30 days, 52× the 30 days before;
  - 40 batches in flight across 5 clients;
  - 12 waiting for a yes, the oldest 162 h (Vindhya Dairy);
  - 2 agent runs today, 50 agents on.
- **Client:** Kaveri Foods, kaveri-smartclearance.web.app, Mysuru, setting up.
- **First export:** `dms_export_kaveri_2026-10-01.csv`, 6 rows, mapped by the Data agent, 8 of 8 fields.
- **Invited:** Arvind Sethi, arvind.sethi@kaveri-foods.example, Approver. The approval goes to Ritu Malhotra, the
  workspace's admin, until he has signed in.
- **Plan:** Pilot, then Growth.
- **The audit log:** 16 lines in Neha's name.

## Production gains

Kaveri Foods is now a client for good, since the console cannot delete one. With it come its admin and its approver
(Firebase accounts on the default password in the shared pool), its demo request, its first export in production's
exports bucket, and one Data agent run on it. Aravalli Snacks, Nilgiri Foods and Shivalik Snacks, from the earlier
runs, stay.

## Findings

- **The Overview's demo requests are not live** (known since SC-191). They are not part of its 30-second reading, so a
  new request shows once the Overview is opened again. The suite opens it again when the request is not there.
- **Set up is clipped** in Demo requests at 1440 (known since SC-191).
- **A name ending in s takes 's** in the console's own words, as the two-screen run found: the audit log reads "Kaveri Foods's channels and rules", and the agents' pipeline is named "Kaveri Foods's agents".

## Steps

| #   | Who           | Role                            | What                                                                        | Took   |
| --- | ------------- | ------------------------------- | --------------------------------------------------------------------------- | ------ |
| 1   | Neha Kulkarni | Smart-Clearance staff · console | The landing page's hero: one day of the journey on film                     | 32.1 s |
| 2   | Neha Kulkarni | Smart-Clearance staff · console | A glance down the page: the agents, the one yes, the plans                  | 30.7 s |
| 3   | Neha Kulkarni | Smart-Clearance staff · console | The bar's Console: the console's sign-in                                    | 17.0 s |
| 4   | Neha Kulkarni | Smart-Clearance staff · console | The sign-in's agents: picked, paused, played                                | 61.4 s |
| 5   | Neha Kulkarni | Smart-Clearance staff · console | Neha signed in to the console: the Overview                                 | 28.5 s |
| 6   | Neha Kulkarni | Smart-Clearance staff · console | The figures: recovered, in flight, waiting, runs                            | 18.1 s |
| 7   | Neha Kulkarni | Smart-Clearance staff · console | Live every 30 seconds, with Pause                                           | 14.4 s |
| 8   | Neha Kulkarni | Smart-Clearance staff · console | Food, by day: kept and destroyed, over 7 and 90 days                        | 17.4 s |
| 9   | Neha Kulkarni | Smart-Clearance staff · console | Agents at work, a stop filtering the batches                                | 16.9 s |
| 10  | Neha Kulkarni | Smart-Clearance staff · console | Every client's batches: searched, filtered, sorted and paged                | 39.9 s |
| 11  | Neha Kulkarni | Smart-Clearance staff · console | Needs attention, demo requests and agent runs                               | 16.2 s |
| 12  | Neha Kulkarni | Smart-Clearance staff · console | The request on the Overview: Kaveri Foods                                   | 8.8 s  |
| 13  | Neha Kulkarni | Smart-Clearance staff · console | New client · 1 Company                                                      | 27.4 s |
| 14  | Neha Kulkarni | Smart-Clearance staff · console | New client · 2 Workspace: its address and sign-in                           | 17.7 s |
| 15  | Neha Kulkarni | Smart-Clearance staff · console | New client · 3 Supply chain                                                 | 20.0 s |
| 16  | Neha Kulkarni | Smart-Clearance staff · console | New client · 4 Exits                                                        | 18.3 s |
| 17  | Neha Kulkarni | Smart-Clearance staff · console | New client · 5 Agents: Standard                                             | 18.0 s |
| 18  | Neha Kulkarni | Smart-Clearance staff · console | New client · 6 People: the workspace's admin                                | 9.4 s  |
| 19  | Neha Kulkarni | Smart-Clearance staff · console | New client · 7 Review                                                       | 16.8 s |
| 20  | Neha Kulkarni | Smart-Clearance staff · console | Kaveri Foods' workspace set up: its Supply chain tab                        | 21.0 s |
| 21  | Neha Kulkarni | Smart-Clearance staff · console | The first stock export, mapped by the Data agent                            | 73.6 s |
| 22  | Neha Kulkarni | Smart-Clearance staff · console | The supply-chain profile                                                    | 22.2 s |
| 23  | Neha Kulkarni | Smart-Clearance staff · console | Arvind Sethi invited as approver                                            | 37.2 s |
| 24  | Neha Kulkarni | Smart-Clearance staff · console | The agents, in the order they work                                          | 17.4 s |
| 25  | Neha Kulkarni | Smart-Clearance staff · console | The Data agent: loads at 08:00, 180 days of history                         | 16.0 s |
| 26  | Neha Kulkarni | Smart-Clearance staff · console | The Data agent, run on request                                              | 10.3 s |
| 27  | Neha Kulkarni | Smart-Clearance staff · console | The Watcher's gates: Blinkit at 60 days, Zepto and Instamart at 55% of life | 15.9 s |
| 28  | Neha Kulkarni | Smart-Clearance staff · console | Vision: asks for another photo below 0.92 confidence                        | 14.9 s |
| 29  | Neha Kulkarni | Smart-Clearance staff · console | The Valuer: every exit priced, the bin included                             | 10.6 s |
| 30  | Neha Kulkarni | Smart-Clearance staff · console | The Router: aims for the most money recovered                               | 11.6 s |
| 31  | Neha Kulkarni | Smart-Clearance staff · console | The approval: always on, to the workspace admin                             | 12.0 s |
| 32  | Neha Kulkarni | Smart-Clearance staff · console | The Lister's reserve: ₹12 a pack, hidden in the client's territories        | 15.2 s |
| 33  | Neha Kulkarni | Smart-Clearance staff · console | Outreach: English first, 2 free with every 10; off and on again             | 24.0 s |
| 34  | Neha Kulkarni | Smart-Clearance staff · console | The Negotiator: never below ₹11.50, a 20% token, on Act                     | 24.2 s |
| 35  | Neha Kulkarni | Smart-Clearance staff · console | Paperwork: drafts only; people send them                                    | 10.6 s |
| 36  | Neha Kulkarni | Smart-Clearance staff · console | Impact: posts after a 21-day return window                                  | 13.6 s |
| 37  | Neha Kulkarni | Smart-Clearance staff · console | The client's actions: Go live, Pause every agent                            | 17.5 s |
| 38  | Neha Kulkarni | Smart-Clearance staff · console | Channels and guardrails                                                     | 26.2 s |
| 39  | Neha Kulkarni | Smart-Clearance staff · console | Destroyed at the godown: evidence, checks, credit                           | 24.6 s |
| 40  | Neha Kulkarni | Smart-Clearance staff · console | Integrations                                                                | 3.0 s  |
| 41  | Neha Kulkarni | Smart-Clearance staff · console | Kaveri Foods on Growth                                                      | 15.1 s |
| 42  | Neha Kulkarni | Smart-Clearance staff · console | 16 audit lines, each in Neha's name                                         | 23.5 s |
| 43  | Neha Kulkarni | Smart-Clearance staff · console | Munchly Foods' journey clock, read and left at real time                    | 42.5 s |
| 44  | Neha Kulkarni | Smart-Clearance staff · console | Munchly Foods' scheduled runs and timers (nothing fired)                    | 9.6 s  |
| 45  | Neha Kulkarni | Smart-Clearance staff · console | A live client's actions: open its workspace, pause, reset                   | 8.7 s  |
| 46  | Neha Kulkarni | Smart-Clearance staff · console | Munchly Foods' SKUs, their gates and a batch's override                     | 34.3 s |
| 47  | Neha Kulkarni | Smart-Clearance staff · console | Every client, in one table                                                  | 18.3 s |
| 48  | Neha Kulkarni | Smart-Clearance staff · console | The agents, across every client                                             | 18.6 s |
| 49  | Neha Kulkarni | Smart-Clearance staff · console | What the platform connects to                                               | 14.9 s |
| 50  | Neha Kulkarni | Smart-Clearance staff · console | Pilot, Growth, Enterprise                                                   | 10.1 s |
| 51  | Neha Kulkarni | Smart-Clearance staff · console | Smart-Clearance's own team                                                  | 19.3 s |
| 52  | Neha Kulkarni | Smart-Clearance staff · console | Everything staff did, everywhere                                            | 17.0 s |
| 53  | Neha Kulkarni | Smart-Clearance staff · console | Kaveri Foods among the clients                                              | 12.4 s |
| 54  | Neha Kulkarni | Smart-Clearance staff · console | Signed out: back at the sign-in                                             | 21.1 s |
