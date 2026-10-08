# SC-79 · Demo controls: the design round

## The request

The maintainer, 8 Oct 2026, wanted a different setup from a demo point of view:

1. "All batch runs should have a trigger which I should be able to control and do instant trigger from console screen
   against each agent for that client."
2. "On console there should a button which will do the reset of of journey at each client level."
3. The Setup fix. After a reset, the workspace's Setup offered "Confirm and start watching" before any export was
   mapped, and backend-api refused it with "The Data agent has not mapped a stock export yet."

The maintainer's answers to two questions:

- **Control:** keep the schedule, add triggers.
- **Triggers:** the scheduled runs and the timers only:
  - the scheduled runs are the Data agent's 08:30 and the Watcher's 09:00;
  - the timers are the offer window closing, the day-7 shelf check and the report due;
  - agents that answer an event keep running on their own.

## How the options were made

- **Context:**
  - `PRODUCT.md` and `DESIGN.md`;
  - the console's surface brief (`.impeccable/surfaces/design3-console.md`): the agents as the stops they work, and
    the gate locked;
  - SC-68 (the journey-day badge, option A);
  - SC-73 (the live workspace, option B, and its `?live` moments).
- **The facts behind the options:**
  - backend-api's timers (`offer.close` 48 h after the offer, `shelf.due` 7 days after it, `report.due` the morning
    after the return window) and when the tick fires them;
  - the reset service (`journey/reset.py`);
  - the console's existing Run now, which does something only for the Data agent and the Watcher.
- **The mockups are the console and the app themselves:**
  - `console/console79.jsx` is a copy of `design3/console/console.jsx`, with every change marked SC-79;
    `?opt=a|b|c` picks the option and `?state=main|fired|reset|sheet` the moment;
  - `setup/setup79.jsx` replaces `SC3_SCREENS.Setup` in the live app (SC-73's `?state=upload-dms` moment, Priya at
    Setup); `?opt=a|b` picks the option and `?moment=waiting|uploading|mapping|mapped` the moment;
  - `./build.sh` compiles them.
- **The stills:** `shoot.mjs` takes them from the 8787 server in light and dark, at 1440 and 390.
- **No imagery** was generated; none was called for.

## The console's options (board `board.html`, platform v3)

- **A · On each agent (recommended):**
  - each trigger hangs under its agent's stop on the Agents tab, and the inspector lists the agent's own;
  - Reset journey… joins Pause every agent in the client's actions menu.
- **B · One journey sheet:**
  - SC-68's badge becomes "Day 1 · Sat 3 Oct 10:15 · Real time" and opens one sheet;
  - the sheet holds the day and its length, Coming up in time order, and Start the journey again.
- **C · A Journey tab:** an eighth tab, with Coming up, Earlier and Start the journey again.

**Shared by all three:**
- Firing is instant, and the schedule does not move.
- A timer that cannot fire yet says why, and its button is disabled.
- Every fire and the reset write an audit line in the staff member's name.
- The reset is behind a confirmation and keeps the day length. Nothing is deleted.

## Setup's options (board `setup-board.html`, app v3)

- **A · Waiting in the export card (recommended):**
  - the card shows "No stock export mapped yet", the eight fields waiting, and Upload an export as the primary
    button;
  - it names when the Data agent's own run will map the day's export;
  - Confirm is disabled until an export is mapped, with its reason beside it.
- **B · Three steps:**
  - steps across the top, the export as a drop zone, and Confirm docked at the foot with the step it is on.

## Open questions on the board

- Should firing a timer early ask first? Closing the kirana offer early cannot be undone for that offer.
- Should the reset offer to set a day length in the same confirmation?

## The pick

Picked by the maintainer on 8 Oct 2026, in four answers:

- **The console: A · On each agent.**
  - Each trigger sits under its agent's stop on the Agents tab, and the inspector lists the agent's own.
  - Reset journey… sits in the client's actions menu.
- **Setup: A · Waiting in the export card.**
- **Timers: they ask first.**
  - A timer fired early asks before it runs, because closing the kirana offer early cannot be undone for that offer.
  - The daily runs still fire at once.
- **The reset offers a day length.**
  - Its confirmation also offers a day length for the journey that starts: Real time, Rehearsal (60 minutes),
    Demo (5 minutes) or Fast (1 minute).
  - It starts on the client's current setting.

The build follows the picked options, with these two answers folded in, design3 first.
