# SC-84 · The client's first stock export, set up in the console

## The request

The maintainer, 8 Oct 2026, on the workspace's first screen ("Connect your stock data to start · Upload the distributor
export once and set the guardrails…"):

> "I want this export to be already done by default first time, as from console when the client is being configured
> this first time export will be configured already, and then later daily syncs can be done or uploaded from UI as
> needed."

The maintainer's answers:

- **What is done in the console: the export mapped.**
  - Staff upload the client's first stock export, and the Data agent maps its columns there.
  - The workspace's Setup opens mapped. The client's operator reviews the guardrails and confirms, and the Watcher
    starts.
- **On a journey reset: keep it.** The reset keeps the console's export and its mapping, so Setup starts mapped again.
- **Later syncs, as now:** the Data agent's daily load at 08:30 (fired at once from the console, SC-79), and uploads
  from the workspace's Setup.

## Now (`current/`)

- The console's New client flow has no step for the data: Company, Workspace, Supply chain, Exits, Agents, People,
  Review.
- A client's Integrations tab only asks the distributors for the first export.
- The workspace opens on "Connect your stock data to start", and Setup maps the export itself (SC-79's waiting state).
- `journey/reset.py` sets `setup_mapped` back to 0.

## How the options were made

- **Context:**
  - `PRODUCT.md` and `DESIGN.md`;
  - the console's surface brief (`.impeccable/surfaces/design3-console.md`);
  - SC-79's Setup (the export card, its waiting and mapped states) and SC-73 (Setup mapped, as designed).
- **The mockups:**
  - `console/console84.jsx` is a copy of `design3/console/console.jsx`, with every change marked SC-84. `?opt=a|b|c`
    picks the option; `?moment=waiting|uploading|mapping|mapped`, `?step=` and `?sheet=1` hold a moment.
  - A fictional client without an export, Kesari Foods, is seeded for B and C, and A's flow starts filled in with it.
    Munchly shows a client already live.
  - `workspace/sc84ws.jsx` wraps the kit's `Empty`, so the Command Center's first card says what is left.
- **The stills:** `shoot.mjs` takes them from the worktree's design3 server (8788), with the workspace's stub at stage 0
  and Priya signed in (design3's own core scripts, as the frontend's tests do).
- **No imagery** was generated.

## The options (board `board.html`, platform v3)

- **A · A step in New client (recommended):**
  - a Stock data step after Supply chain: drop the export, the Data agent maps its eight fields, and Review lists it;
  - it can wait;
  - a client already set up keeps the card on its Integrations tab, to replace the export.
- **B · On the Supply chain tab:**
  - the card at the top of Supply chain, above the distributors, SKUs and batches it brings;
  - New client ends there.
- **C · As a connector:**
  - "Distributor stock exports" is the first row of Integrations;
  - it opens a sheet with the first export, its mapping, the daily load at 08:30, uploads from Setup, and the
    distributors' upload link.

**Shared:**

- One export card in every option: drop or choose, upload, mapping, mapped, with what the file brought and who
  uploaded it.
- The daily load and the uploads from Setup are as now, and a reset keeps the export.
- The workspace's first card reads "Confirm Setup to start watching", with the export's batches and distributors, and
  "Review and confirm".

## The pick

Picked by the maintainer on 8 Oct 2026: **B · On the Supply chain tab**.

What the build carries:

- **The console** (design3 first, then `frontend/console`):
  - The client's Supply chain tab opens with the **First stock export** card, above the distributors, SKUs and
    batches it brings. Its moments: waiting (drop or choose a CSV), uploading, the Data agent mapping, and mapped
    (the file, its batches and distributors, who uploaded it, and Replace).
  - New client's Review says the export comes next, on Supply chain, and the new client opens on that tab.
- **backend-api:**
  - Staff upload a client's export through the console's own routes.
  - It takes the path the workspace's Setup upload takes (a signed link to the exports bucket, then the Data agent),
    with the audit line in the staff member's name.
  - The client carries its first export (file, who, when) and its mapping state.
- **The reset keeps the mapping:**
  - `journey/reset.py` no longer sets `setup_mapped` back to 0, so Setup opens mapped after a reset.
  - Setup's confirmation still goes back to not given, and the journey still starts from day 0.
- **The workspace's first card:** while Setup is not confirmed and the export is mapped, it reads "Confirm Setup to
  start watching", with the export's batches and distributors, and "Review and confirm". With nothing mapped, it
  reads as before.

## The build (8 Oct 2026)

- **The mapping is data, not copy.** design3 drew the field table from the story's Setup. The port may hold no business
  data, so the export carries its own map: `FirstExport.columns`, each Smart-Clearance field with the file's column
  (none while the Data agent reads it).
  - The Data agent reports the map it used for the stock file, field by field (`data.FIELD`).
  - backend-api keeps it with the client (`exportColumns`). The story's export is recorded with its own map.
  - The card's "90 days of sell-through" and "at 08:30" come from the Data agent's settings (`backfillDays`, `time`).
- **The mock** maps the upload 1.8 s after it lands when it has latency, as the prototype does, and at once without.
  The card reads the client again every 1.5 s while it is mapping.
- **Infrastructure:** the console uploads straight to the exports bucket through the signed link, so the exports
  buckets' CORS gains the console's origins (prod: its two Hosting addresses; local: its dev and preview ports). The
  photos buckets are unchanged. Planned, read in full: 0 to add, 2 to change in place, 0 to destroy; free. Applied on
  the maintainer's yes; a fresh plan shows no changes.
- **Stills** in `built/`: design3's card (`supply-munchly-*`), the port's (`port-*`), New client's Review row, a new
  client waiting for its export, and the same client mapped after an upload.
- **The demo's sample** (`sample/dms_export_2026-10-01.csv`, asked for by the maintainer): Munchly's nine story batches as
  each distributor's closing stock on 1 Oct, in the Bizom-style layout of backend-api's synthetic exports
  (`services/journey/dms.py`). The Data agent's parser maps it from its saved layout: 8 of 8 fields, 9 rows, none
  unread. It re-states the batches the workspace holds, so an upload adds none.
