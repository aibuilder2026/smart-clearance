# Admin and console E2E on production: run of 12 Oct 2026

The platform's own side of Smart-Clearance on a laptop and a tablet side by side (SC-191). It ran on production's
landing page (smartclearance.web.app), console (smartclearance-console.web.app) and workspace
(munchly-smartclearance.web.app), with backend-api on Cloud Run.

**Passed end to end**, in 9 min 30 s, 42 steps, with no finding but one note on the console.

The maintainer asked for a redo of the first run (three screens, its record replaced here):

- the landing page opens only once, gone over briefly, then shows how the console and a workspace are reached;
- the notes as banners in the manner of a WhatsApp notification, without a chat's time and ticks;
- then the console, showing everything;
- a laptop and a tablet side by side, no phone;
- direct on production.

It ran on branch `SC-191-admin-console-e2e`, against production at `b3caf45`.

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:admin`, with the monitor window on screen.
- **The screens:**
  - a laptop (1440 × 900): Neha Kulkarni, a Super admin;
  - a tablet in portrait (820 × 1180): first a client's workspace, opened from the landing page, then Megha Bava, in
    Support, signed in to the console.

  Everyone signs in on the app's own screen. The password field takes a stand-in, and the check is answered with the
  person's own session, so no password is typed.

- **The notes:** at each moment a viewer would ask about, the rest of that screen dims, a ring lights what is read,
  and a banner slides onto the screen. The banner carries the Smart-Clearance mark, its name and the note's tag, then
  the note's title and a sentence or two in business terms. Every click shows: the arrow dips and two rings spread.
- **Production gains a client for good:** Nilgiri Foods (`nilgiri-smartclearance.web.app`), setting up, on Growth,
  with its admin Ritu Malhotra and its approver Arvind Sethi invited (Firebase accounts on the default password, in the
  shared pool), and its demo request. The console cannot delete a client. Aravalli Snacks, from the first run, stays
  too.
- **The recording:** `admin-console-e2e-prod-2026-10-12.mp4` beside this file, 9 min 25 s, H.264, 2560 × 1440, 25 fps,
  62 MB, with a 1080p copy (37 MB) and a lighter one (25 MB). They stay local (git-ignored), with copies in the
  repository root's `playwright-automation-videos/`. The first run's videos there are kept as `…-three-screens.mp4`.
- **The record:** `report.json` and `stills/`, the stage at each of the 42 steps.

## The journey

1. **The landing page, once, on the laptop:**
   - the hero, then a brief tour: the statement, the agents at work on the table, the chapters, Impact's ledger, the
     workspace section;
   - how a prospect asks: "Talk to us about Pilot", the form filled in as Ritu Malhotra of Nilgiri Foods, and sent;
   - the ways in:
     - Find your workspace, in the footer: Priya's email names Munchly Foods' workspace;
     - the bar's Workspace and Console;
     - Workspace opens Munchly Foods' own sign-in on the tablet;
     - Console takes the laptop to the console's sign-in, and Neha signs in.
2. **Megha signs in** to the console on the tablet.
3. **The demo request** on Neha's Overview, after a glance at Clients.
4. **New client from the request**, its seven steps:
   - the company, Coimbatore, snacks, a colour;
   - its address and staff domain;
   - its supply chain: through distributors, the distributor owns the stock, destroyed at the distributor's godown;
   - its exits;
   - Standard autonomy;
   - its admin;
   - Review on Pilot.

   Create workspace opens its Supply chain tab, with the first stock export next, and Megha's Clients lists it.

5. **Its agents:** the pipeline; the Watcher's Blinkit gate at 60 days; the Lister's reserve at ₹12 a pack; the
   Negotiator on Act; the approval, always on.
6. **Its tabs:** Channels & rules; Arvind Sethi invited as approver; Integrations; Pilot moved to Growth.
7. **Support refused:** Megha pressed Enterprise on the tablet: "Only a Super admin can change a client's plan. Put back
   as it was."
8. **The audit log:** six lines, each in Neha's name.
9. **The Overview:**
   - the four figures;
   - Food by day over 90 days, with a day's tooltip and the table;
   - Agents at work, the Approve stop filtering the batches;
   - every client's batches, searched and paged;
   - Needs attention, demo requests and agent runs.

   Megha follows the Overview on the tablet.

10. **A live client, Munchly Foods:**
    - the prototype's clock and its note;
    - its agents' scheduled runs and timers (nothing fired);
    - its SKUs with their quick-commerce gates, and the Masala Chips' sheet.
11. **The platform's own screens:** Agents, Connectors, Plans, Staff and the audit log across the platform.
12. **The close:** Nilgiri Foods among the clients.

## Figures

- **Demo request:** Ritu Malhotra, Nilgiri Foods, ritu@nilgiri-foods.example, Snacks and drinks, Pilot.
- **Client:** Nilgiri Foods, nilgiri-smartclearance.web.app (the console's own rule drops "Foods"), Coimbatore,
  setting up.
- **Invited:** Arvind Sethi, arvind.sethi@nilgiri-foods.example.
- **Plan:** Pilot, then Growth; Support's Enterprise refused.
- **The audit log:** six lines in Neha's name: the set-up, the Watcher's gate, the Lister's reserve, the Negotiator on
  Act, Arvind Sethi invited, Pilot to Growth.
- **The Overview:** recovered ₹64,84,415 in 30 days (44× the 30 days before); 39 batches in flight across 5 clients;
  12 waiting for a yes (the oldest 153 h, Vindhya Dairy); 127 agent runs today, 50 agents on.

## Findings

The run's own:

- **The Overview's demo requests are not live.** The Overview reads its figures again every 30 seconds, but not the
  demo requests. A new request shows only once the Overview is opened again, so the suite glances at Clients and comes
  back.

Seen in the first run's stills and recording, still there, not fixed:

- Set up is clipped in Demo requests on a tablet and a phone.
- A name ending in s takes 's in the set-up toast ("Aravalli Snacks's workspace is set up").

Megha's refused plan change answers 403, as it should; the suite does not count it as a finding.
