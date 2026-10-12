# Admin and console E2E on production: run of 12 Oct 2026

The platform's own side of Smart-Clearance, on production's landing page (smartclearance.web.app), console
(smartclearance-console.web.app) and backend-api on Cloud Run, on three screens at once (SC-191). A prospect books a
demo, Neha Kulkarni (Super admin) sets the company up as a client from the request and configures it, Megha Bava
(Support) is refused a plan change, and Neha monitors the dashboards.

**Passed end to end**, in 8 min 51 s, 38 steps, with no finding but one note on the console.

The maintainer asked for "a journey for Admin landing page and console E2E, how admin can login and create clients,
configure agents and monitor dashboards", with the same highlighting as the earlier runs, then "Proper highlighting
with whatsapp style banners and mouse click pointers". They picked production, and the cast: Neha on the landscape
tablet, a prospect on the portrait tablet, Support on the phone.

It ran on branch `SC-191-admin-console-e2e` (`6352c26`), against production at `b3caf45`.

- **What ran:** `E2E_TARGET=prod corepack pnpm test:journey:admin`, with the monitor window on screen.
- **The screens:**
  - Neha Kulkarni, Super admin, on a tablet in landscape (1180 × 820): she opens smartclearance.web.app, presses
    Console in its bar and signs in on the console's own screen;
  - Ritu Malhotra, a prospect (head of supply chain at Aravalli Snacks, fictional), on a tablet in portrait
    (820 × 1180): she reads the landing page and books a demo; she signs in nowhere;
  - Megha Bava, in Support, on a phone (390 × 844), signed in to the console.

  No password is typed: the password field takes a stand-in and the check is answered with the person's own session.

- **The notes:** 36 places in the suite (and the stage's note on the first sign-in) ring an element, dim the rest of its screen, and bring a WhatsApp-style banner
  onto that screen: the app's mark, "Smart-Clearance" and the note's tag, then the note in a chat bubble with the time
  and ticks, sliding down from the screen's top (or up from its foot when what is read sits under the top). Every
  click shows: the arrow dips and two rings spread where it lands.
- **Production gains a client for good:** Aravalli Snacks (`aravalli-snacks-smartclearance.web.app`), setting up, on
  Growth, with its admin Ritu Malhotra and its approver Arvind Sethi invited (Firebase accounts on the default password,
  in the shared pool), and its demo request. The console cannot delete a client.
- **The recording:** `admin-console-e2e-prod-2026-10-12.mp4` beside this file, 8 min 42 s, H.264, 2560 × 1440, 25 fps,
  63 MB, with a 1080p copy (37 MB) and a lighter one (25 MB). They stay local (git-ignored), with copies in the
  repository root's `playwright-automation-videos/`.
- **The record:** `report.json` and `stills/`, the stage at each of the 38 steps.

## The journey

1. **Sign-ins:** the prospect on the landing page; Neha from the landing page's Console to the console's sign-in and
   its Overview; Megha on her phone.
2. **The landing page:** the statement, the agents at work on the table, Impact's ledger, a workspace of its own, the
   plans.
3. **Book a demo:** "Talk to us about Pilot", the form filled (name, company, work email, what it makes, a note), sent:
   "Thanks, Ritu."
4. **The request in the console:** on Neha's Overview, then on Megha's phone, each after a glance at Clients.
5. **New client from the request**, its seven steps:
   - Company (from the request), Jaipur, snacks, a colour for its mark;
   - its address and staff domain;
   - its supply chain: through distributors, the distributor owns the stock, destroyed at the distributor's godown;
   - its exits;
   - Standard autonomy;
   - its admin (the prospect);
   - Review on Pilot.

   Create workspace opened its Supply chain tab, the first stock export next; Megha's Clients listed it.

6. **Its agents:** the pipeline; the Watcher's Blinkit gate at 60 days; the Lister's reserve at ₹12 a pack; the
   Negotiator on Act; the approval, always on.
7. **Its rules, people and plan:** the exits, the guardrails and the godown destruction's settings; Arvind Sethi invited
   as approver; Pilot moved to Growth.
8. **Support refused:** Megha pressed Enterprise on her phone: "Only a Super admin can change a client's plan. Put back
   as it was."
9. **The audit log:** six lines, each in Neha's name.
10. **The dashboards:** the four figures; Food by day over 90 days, a day's tooltip and the table; Agents at work, the
    Approve stop filtering the batches; every client's batches searched and paged; Needs attention, demo requests and
    agent runs; the Overview on Megha's phone; Munchly Foods' live agents and their scheduled runs (nothing fired).
11. **The close:** Aravalli Snacks among the clients.

## Figures

- **Demo request:** Ritu Malhotra, Aravalli Snacks, ritu@aravalli-snacks.example, Snacks and drinks, Pilot.
- **Client:** Aravalli Snacks, aravalli-snacks-smartclearance.web.app, Jaipur, setting up.
- **Invited:** Arvind Sethi, arvind.sethi@aravalli-snacks.example.
- **Plan:** Pilot, then Growth; Support's Enterprise refused.
- **The audit log, newest first:**
  - Moved Aravalli Snacks from Pilot to Growth;
  - Invited Arvind Sethi as Member;
  - Set the Negotiator agent to Act for Aravalli Snacks (was Ask);
  - Changed the Lister agent for Aravalli Snacks: reserve ₹13.50 to ₹12.00;
  - Changed the Watcher agent for Aravalli Snacks: Blinkit gate 90 days left to 60 days left;
  - Set up Aravalli Snacks from its supply-chain profile, inviting Ritu Malhotra as admin.
- **The Overview:** recovered ₹64,84,415 in 30 days (44× the 30 days before); 39 batches in flight across 5 clients;
  12 waiting for a yes (the oldest 151 h, Vindhya Dairy); 127 agent runs today, 50 agents on.

## Findings

The run's own:

- **The Overview's demo requests are not live.** The Overview reads its figures again every 30 seconds, but not the
  demo requests: a new request shows once the Overview is opened again (the suite glances at Clients and comes back).

Seen in the stills and the recording, not fixed:

- **Set up is clipped** in Demo requests: on a tablet's three columns at 1180 it reads "Set", and on a phone "Set u".
- **"Aravalli Snacks's workspace is set up"**: the toast adds 's to a name ending in s.

Megha's refused plan change answers 403, as it should; the suite does not count it as a finding.
