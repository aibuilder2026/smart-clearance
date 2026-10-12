# Admin and console E2E in detail, on production: run of 12 Oct 2026

The platform's own side of Smart-Clearance, told in detail for the final demo walkthrough (SC-197). It covers how a
visitor reaches the landing page and the console, how a client is created, and how its agents are configured and
customised. It ran on production's landing page (smartclearance.web.app), console (smartclearance-console.web.app) and
workspace (munchly-smartclearance.web.app), with backend-api and the agents on Cloud Run.

**Passed end to end**, in 25 min 3 s: 20 chapters and 67 steps, with no finding but the known note on the Overview.

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:admin`, branch `SC-197-admin-console-detail`, against production at `6e9aa43` (SC-198's sign-in map, deployed nine minutes before the run), with the
  monitor window on screen.
- **The screens:** a laptop (1440 × 900), Neha Kulkarni, a Super admin; and a tablet in portrait (820 × 1180), first
  Munchly Foods' workspace opened from the landing page, then Megha Bava, in Support, signed in to the console.
- **The highlights:**
  - The notes arrive as banners on the screen being read, in the manner of a phone's notification and not a chat:
    there is no time and no ticks. Each banner carries the mark and its tag, then a quoted line naming whose screen it
    is and its address, then the note itself.
  - What is read is ringed: four corner brackets close in, one sweep of light crosses it, and it pulses.
  - Several parts of one screen are marked with numbers, each in its own bright cut-out in the dim, and one banner
    lists what each number is.
  - Every click shows.
  - Each chapter opens with a title card.
- **The recording:** `admin-console-detail-e2e-prod-2026-10-12.mp4`, 24 min 57 s, H.264, 2560 × 1440, 25 fps,
  186 MB, with a 1080p copy. It is cut into one 1080p clip per chapter (`…-chapters/`, with `chapters.txt` in
  YouTube's form and `chapters.csv`). They stay local (git-ignored), in the repository root's
  `playwright-automation-videos/`.
- **The record:** `report.json`, `chapters.json` (each chapter's start and end in the recording) and `stills/`, the
  stage at each of the 67 steps.

## Chapters

| #   | Starts | Length | Chapter                                                                                                                          |
| --- | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0:00   | 70 s   | Neha opens the platform's landing page: the hero, its film of one day, and the demo film                                         |
| 2   | 1:10   | 187 s  | The landing page, section by section: the statement, the agents at work, the four chapters, the ledger, the workspace, the plans |
| 3   | 4:17   | 32 s   | Neha books a demo as a prospect would, from a plan                                                                               |
| 4   | 4:49   | 60 s   | The ways in: Find your workspace, a client's workspace on the tablet, and the console, where Neha signs in                       |
| 5   | 5:49   | 97 s   | Neha signs in to the console, after the agents at work behind its sign-in                                                        |
| 6   | 7:26   | 87 s   | Megha, in Support, signs in to the console on the tablet                                                                         |
| 7   | 8:53   | 13 s   | The demo request reaches the console                                                                                             |
| 8   | 9:06   | 161 s  | Neha sets the company up as a client from its request, in seven steps                                                            |
| 9   | 11:47  | 101 s  | Neha uploads the client's first stock export, and the Data agent maps it                                                         |
| 10  | 13:28  | 40 s   | Neha invites the client's approver, and reads its people                                                                         |
| 11  | 14:08  | 224 s  | Neha configures the new client's eleven agents, one by one                                                                       |
| 12  | 17:52  | 54 s   | Neha sets the client's channels and rules, and how packs are destroyed at the godown                                             |
| 13  | 18:46  | 19 s   | Neha reads the client's integrations and moves its plan                                                                          |
| 14  | 19:05  | 13 s   | Megha, in Support, tries to change the client's plan on the tablet and is refused                                                |
| 15  | 19:18  | 25 s   | Neha reads the new client's audit log                                                                                            |
| 16  | 19:43  | 74 s   | Neha monitors the dashboards; Megha follows them on the tablet                                                                   |
| 17  | 20:57  | 99 s   | A live client, Munchly Foods: its journey clock, its agents' runs and timers, its SKUs and their gates                           |
| 18  | 22:36  | 104 s  | The platform's own screens: Clients, Agents, Connectors, Plans, Staff and the audit log                                          |
| 19  | 24:20  | 13 s   | Neha sees the new client among the clients                                                                                       |
| 20  | 24:33  | 24 s   | Neha reads her account and signs out of the console                                                                              |

## What each chapter shows

1. **The hero:** the film of one day, its four chapters marked one by one, then Pause and Play. Watch the 6-minute
   demo opens its theatre: the chapters, one jumped to, and Read the film instead, before it is closed.
2. **The landing page, section by section:**
   - the statement filling in;
   - the agents at work on the table: the centre card, three agents picked on the rail, and the result;
   - the four chapters, each card marked;
   - Impact's ledger;
   - the workspace section: the four teams played through, then its addresses and integrations;
   - the three plans.
3. **A demo booked** from a plan, for Shivalik Snacks.
4. **The ways in:**
   - the footer, and Find your workspace naming Munchly Foods;
   - the bar's sections, Console and Workspace, marked;
   - Workspace opens Munchly Foods' sign-in on the tablet, and Console takes the laptop to the console's sign-in.
5. **The console's sign-in, in detail:**
   - the agents network swept by the cursor;
   - Watcher, Valuer, You, Negotiator and Impact picked in turn, each saying what it did;
   - a ripple on the field, then Pause and Play;
   - the form's three parts marked, and Neha signing in.
6. **Megha's sign-in on the tablet:** the agents round the card, and five of the nine stops picked on the pill's rail.
7. The demo request on the Overview.
8. **New client, in seven steps,** each step's fields or options marked and explained: the company, the address and
   sign-in, the supply chain, the exits, the agents' presets, the admin, and the review. Then the client's head and
   tabs, and Megha's Clients.
9. **The first stock export:** a CSV of the client's own, with three fictional Coimbatore distributors and six
   batches. It is uploaded, the Data agent maps it live (Mapping, then Mapped, 8 of 8 fields), and the mapping is read.
   Then the supply chain drawn, and the profile sheet.
10. **People:** Arvind Sethi invited as Approver, the people table, and a row's menu.
11. **The eleven agents, one by one:**
    - the autonomy legend and the pipeline;
    - the Data agent at 08:00 with 180 days of history, then Run now;
    - the Watcher's gates: Blinkit at 60 days, Zepto and Instamart at 55% of life;
    - Vision asks again below 0.92;
    - the Valuer's locked estimates;
    - the Router aims for the most money;
    - the approval, always on;
    - the Lister's reserve at ₹12, hidden in the client's territories;
    - Outreach in English with 2 free with every 10, switched off and on;
    - the Negotiator never below ₹11.50, with three counters and a 20% token, on Act;
    - Paperwork's drafts only;
    - Impact after a 21-day return window.

    Then the pipeline after, and the client's actions menu, read and not pressed.

12. **Channels and rules:** each exit; the staff-sale cap and the offer window raised; the destruction at the godown
    marked row by row (the agency's charges up, the reminder sooner) and saved.
13. Integrations, and the plan moved from Pilot to Growth. Go live is left alone.
14. Megha presses Enterprise on the tablet and is refused: "Only a Super admin can change a client's plan."
15. The client's audit log: 16 lines, each in Neha's name.
16. **The Overview's dashboards:** the four figures, Food by day, Agents at work filtering the batches, the batches
    searched and paged, and Needs attention. Megha follows on the tablet.
17. **A live client, Munchly Foods:**
    - Live, the journey-day badge and the clock note, marked;
    - the clock's guide, and the journey day's sheet, read and cancelled;
    - its runs and timers (nothing fired), and its actions menu (not pressed);
    - its distributors, its SKUs and their gates, and a batch's override form, cancelled.
18. **The platform:** the clients searched by city, the agents' catalog with the new client's chip, a connector's
    sheet, the plans marked, the staff table and the invite form (closed), and the audit log filtered to the new client.
19. The new client among the clients.
20. **Neha's account,** marked, then Sign out: the splash, and back at the sign-in.

## Figures

- **Demo request:** Ritu Malhotra, Shivalik Snacks, ritu@shivalik-snacks.example, Snacks and drinks.
- **Client:** Shivalik Snacks, shivalik-snacks-smartclearance.web.app, Dehradun, setting up.
- **First export:** `dms_export_shivalik-snacks_2026-10-01.csv`, 6 rows, mapped by the Data agent (8 of 8 fields).
  The client has no SKUs or distributors yet, so it brings no batches; the mapping is kept for its daily exports.
- **Invited:** Arvind Sethi, arvind.sethi@shivalik-snacks.example, Approver.
- **The approval:** goes to Ritu Malhotra, the workspace's admin. The approver list offers only people who have signed
  in, so Arvind joins it once he signs in.
- **The rules, as the audit log has them:** the staff-sale cap 70, the offer window 60 hours, asked again after 1
  day, and the agency's charges ₹2 a pack.
- **The Negotiator, as the audit log has it:** the floor ₹13.50 to ₹11.50, counter offers 2 to 3, and the token 15% to
  20%; then Act (was Ask).
- **Plan:** Pilot, then Growth; Support's Enterprise refused.
- **The audit log:** 16 lines in Neha's name, among them:
  - the set-up and the export;
  - the Data agent run on request;
  - each agent's settings, and the Negotiator on Act;
  - Outreach off and on;
  - the rules;
  - Arvind Sethi invited;
  - Pilot to Growth.
- **The Overview:**
  - ₹64,67,498 recovered in 30 days, 52× the 30 days before;
  - 40 batches in flight across 5 clients;
  - 12 waiting for a yes, the oldest 161 h (Vindhya Dairy);
  - 2 agent runs today, 50 agents on.

## Production gains

Shivalik Snacks is now a client for good, since the console cannot delete one. With it come:

- its admin Ritu Malhotra and its approver Arvind Sethi, as Firebase accounts on the default password in the shared
  pool;
- its demo request;
- its first export, in production's exports bucket;
- one Data agent run on it, on its saved map for the layout, with no model call.

Aravalli Snacks and Nilgiri Foods, from SC-191's runs, stay.

## Findings

- **The Overview's demo requests are not live** (known since SC-191). They are not part of its 30-second reading, so a
  new request shows once the Overview is opened again. The suite glances at Clients and comes back.

- **A name ending in s takes 's** in the console's own words, as SC-191 noted for the set-up toast: the audit log
  reads "Changed Shivalik Snacks's channels and rules", and the agents' pipeline is named "Shivalik Snacks's agents".
  Not fixed.

Found by the trials and fixed in the suite before this run:

- the cursor's script ran inside YouTube's player frame, which refuses markup;
- the first export's card was found by its Choose button, which goes once the upload starts;
- a marked list dimmed every part but the first;
- the approver step named someone the select had not chosen.

## Steps

| #   | Who                      | Role                            | What                                                                                | Took   |
| --- | ------------------------ | ------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| 1   | Neha Kulkarni            | Smart-Clearance staff · console | The landing page's hero: one day of the journey on film                             | 43.4 s |
| 2   | Neha Kulkarni            | Smart-Clearance staff · console | The demo film, in its theatre: its chapters and its words                           | 34.9 s |
| 3   | Neha Kulkarni            | Smart-Clearance staff · console | The statement                                                                       | 12.1 s |
| 4   | Neha Kulkarni            | Smart-Clearance staff · console | The agents at work on the table, one in focus at a time                             | 70.5 s |
| 5   | Neha Kulkarni            | Smart-Clearance staff · console | The four chapters: the Watcher's alert, the prices, the one yes, the agents at work | 43.1 s |
| 6   | Neha Kulkarni            | Smart-Clearance staff · console | Impact's ledger: every rupee worked out                                             | 13.8 s |
| 7   | Neha Kulkarni            | Smart-Clearance staff · console | The workspace: each team's own view, at the client's own address                    | 34.8 s |
| 8   | Neha Kulkarni            | Smart-Clearance staff · console | The plans: Pilot, Growth, Enterprise                                                | 13.2 s |
| 9   | Neha Kulkarni            | Smart-Clearance staff · console | A demo booked for Shivalik Snacks                                                   | 31.5 s |
| 10  | Neha Kulkarni            | Smart-Clearance staff · console | Find your workspace names it                                                        | 23.2 s |
| 11  | Munchly Foods' workspace | A client's own address          | Workspace: Munchly Foods' own workspace, on the tablet                              | 31.3 s |
| 12  | Neha Kulkarni            | Smart-Clearance staff · console | The console's sign-in                                                               | 5.8 s  |
| 13  | Neha Kulkarni            | Smart-Clearance staff · console | The sign-in's agents: picked, paused, played                                        | 67.2 s |
| 14  | Neha Kulkarni            | Smart-Clearance staff · console | Neha signed in to the console: the Overview                                         | 29.7 s |
| 15  | Megha Bava               | Smart-Clearance staff · Support | The tablet's sign-in: the agents round the card                                     | 68.3 s |
| 16  | Megha Bava               | Smart-Clearance staff · Support | Megha signed in on the tablet: the same Overview                                    | 18.3 s |
| 17  | Neha Kulkarni            | Smart-Clearance staff · console | The request on the Overview: Shivalik Snacks                                        | 12.8 s |
| 18  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 1 Company                                                              | 28.7 s |
| 19  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 2 Workspace: its address and sign-in                                   | 18.2 s |
| 20  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 3 Supply chain                                                         | 20.9 s |
| 21  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 4 Exits                                                                | 19.1 s |
| 22  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 5 Agents: Standard                                                     | 18.6 s |
| 23  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 6 People: the workspace's admin                                        | 9.7 s  |
| 24  | Neha Kulkarni            | Smart-Clearance staff · console | New client · 7 Review                                                               | 18.3 s |
| 25  | Neha Kulkarni            | Smart-Clearance staff · console | Shivalik Snacks' workspace set up: its Supply chain tab                             | 22.5 s |
| 26  | Megha Bava               | Smart-Clearance staff · Support | Shivalik Snacks in Megha's Clients                                                  | 5.3 s  |
| 27  | Neha Kulkarni            | Smart-Clearance staff · console | The first stock export, mapped by the Data agent                                    | 78.6 s |
| 28  | Neha Kulkarni            | Smart-Clearance staff · console | The supply-chain profile                                                            | 22.7 s |
| 29  | Neha Kulkarni            | Smart-Clearance staff · console | Arvind Sethi invited as approver                                                    | 40.0 s |
| 30  | Neha Kulkarni            | Smart-Clearance staff · console | The agents, in the order they work                                                  | 17.7 s |
| 31  | Neha Kulkarni            | Smart-Clearance staff · console | The Data agent: loads at 08:00, 180 days of history                                 | 18.1 s |
| 32  | Neha Kulkarni            | Smart-Clearance staff · console | The Data agent, run on request                                                      | 10.6 s |
| 33  | Neha Kulkarni            | Smart-Clearance staff · console | The Watcher's gates: Blinkit at 60 days, Zepto and Instamart at 55% of life         | 16.6 s |
| 34  | Neha Kulkarni            | Smart-Clearance staff · console | Vision: asks for another photo below 0.92 confidence                                | 15.7 s |
| 35  | Neha Kulkarni            | Smart-Clearance staff · console | The Valuer: every exit priced, the bin included                                     | 10.8 s |
| 36  | Neha Kulkarni            | Smart-Clearance staff · console | The Router: aims for the most money recovered                                       | 12.0 s |
| 37  | Neha Kulkarni            | Smart-Clearance staff · console | The approval: always on, to the workspace admin                                     | 12.3 s |
| 38  | Neha Kulkarni            | Smart-Clearance staff · console | The Lister's reserve: ₹12 a pack, hidden in the client's territories                | 16.4 s |
| 39  | Neha Kulkarni            | Smart-Clearance staff · console | Outreach: English first, 2 free with every 10; off and on again                     | 24.8 s |
| 40  | Neha Kulkarni            | Smart-Clearance staff · console | The Negotiator: never below ₹11.50, a 20% token, on Act                             | 26.5 s |
| 41  | Neha Kulkarni            | Smart-Clearance staff · console | Paperwork: drafts only; people send them                                            | 11.0 s |
| 42  | Neha Kulkarni            | Smart-Clearance staff · console | Impact: posts after a 21-day return window                                          | 14.6 s |
| 43  | Neha Kulkarni            | Smart-Clearance staff · console | The client's actions: Go live, Pause every agent                                    | 17.3 s |
| 44  | Neha Kulkarni            | Smart-Clearance staff · console | Channels and guardrails                                                             | 28.2 s |
| 45  | Neha Kulkarni            | Smart-Clearance staff · console | Destroyed at the godown: evidence, checks, credit                                   | 25.4 s |
| 46  | Neha Kulkarni            | Smart-Clearance staff · console | Integrations                                                                        | 3.1 s  |
| 47  | Neha Kulkarni            | Smart-Clearance staff · console | Shivalik Snacks on Growth                                                           | 16.0 s |
| 48  | Megha Bava               | Smart-Clearance staff · Support | Megha refused: only a Super admin changes a plan                                    | 13.5 s |
| 49  | Neha Kulkarni            | Smart-Clearance staff · console | 16 audit lines, each in Neha's name                                                 | 24.9 s |
| 50  | Neha Kulkarni            | Smart-Clearance staff · console | The figures: recovered, in flight, waiting, runs                                    | 12.9 s |
| 51  | Neha Kulkarni            | Smart-Clearance staff · console | Food, by day: kept and destroyed                                                    | 16.2 s |
| 52  | Neha Kulkarni            | Smart-Clearance staff · console | Agents at work, a stop filtering the batches                                        | 13.7 s |
| 53  | Neha Kulkarni            | Smart-Clearance staff · console | Every client's batches, searched and paged                                          | 16.7 s |
| 54  | Neha Kulkarni            | Smart-Clearance staff · console | Needs attention, demo requests and agent runs                                       | 8.6 s  |
| 55  | Megha Bava               | Smart-Clearance staff · Support | The Overview on the tablet                                                          | 6.2 s  |
| 56  | Neha Kulkarni            | Smart-Clearance staff · console | Munchly Foods' journey clock, read and left at real time                            | 44.5 s |
| 57  | Neha Kulkarni            | Smart-Clearance staff · console | Munchly Foods' scheduled runs and timers (nothing fired)                            | 10.0 s |
| 58  | Neha Kulkarni            | Smart-Clearance staff · console | A live client's actions: open its workspace, pause, reset                           | 9.0 s  |
| 59  | Neha Kulkarni            | Smart-Clearance staff · console | Munchly Foods' SKUs, their gates and a batch's override                             | 35.3 s |
| 60  | Neha Kulkarni            | Smart-Clearance staff · console | Every client, in one table                                                          | 18.5 s |
| 61  | Neha Kulkarni            | Smart-Clearance staff · console | The agents, across every client                                                     | 19.8 s |
| 62  | Neha Kulkarni            | Smart-Clearance staff · console | What the platform connects to                                                       | 15.6 s |
| 63  | Neha Kulkarni            | Smart-Clearance staff · console | Pilot, Growth, Enterprise                                                           | 10.7 s |
| 64  | Neha Kulkarni            | Smart-Clearance staff · console | Smart-Clearance's own team                                                          | 20.9 s |
| 65  | Neha Kulkarni            | Smart-Clearance staff · console | Everything staff did, everywhere                                                    | 18.3 s |
| 66  | Neha Kulkarni            | Smart-Clearance staff · console | Shivalik Snacks among the clients                                                   | 13.0 s |
| 67  | Neha Kulkarni            | Smart-Clearance staff · console | Signed out: back at the sign-in                                                     | 21.4 s |
