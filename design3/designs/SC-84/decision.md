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

Waiting for the maintainer.
