# SC-215 · Fill a kirana scheme for a demo: the design round

## The request

The maintainer, 15 Oct 2026, on SC-212's finding. A judge can't fill the Mango Drink's scheme alone: each kirana can
order only a few dozen packets, and the scheme goes to 58 shops. In the 13 Oct recording, 50 of them ordered through
the API, which a judge can't do. So DEMO.md has the judge order as two shops and close the window, and the unsold
packets end up destroyed at the godown.

> "Can we take this up and update the DEMO.md with proper screenshots, make sure you locally run the playwright
> automation suite (just for Mango suite) end to end locally for this use case and then raise PR."

## How the options were made

- **Context:**
  - `PRODUCT.md` and `DESIGN.md`;
  - the console's surface brief (`.impeccable/surfaces/design3-console.md`);
  - SC-79, the journey controls on each agent (option A), whose mockup approach this round reuses.
- **The facts behind the options:**
  - backend-api's order path (`steps.order`: each shop capped at 4 × its 14-day sales, its tax invoice in the
    distributor's series, the scheme closing when full);
  - the story's share for each shop (`journey.json` `kiranas[].orders`, from design3 `data.js` HYDERABAD);
  - the console's controls (`services/journey/controls.py`).
- **The mockup is the console itself:**
  - `console/console215.jsx` is a copy of `design3/console/console.jsx`, with every change marked SC-215;
  - `?opt=a|b|c` picks the option, and `?state=main|ask|filled` the moment;
  - `./build.sh` compiles it.
- **The moment:** Munchly's journey where a judge leaves the Mango Drink MF-2410-118. The plan is approved, the scheme
  has gone to 58 shops, and two have ordered 52 packets on the phone. The other 50 shops the story has ordering hold
  1,320 packets.
- **The stills:** `shoot.mjs` takes them from the design3 server in light and dark, at 1440 and 390. The server is
  `frontend/testing/design3-server.py` (the `design3-threaded` launch config), whose deep backlog keeps the console's
  thirty parallel loads from being reset. No imagery was generated.

## The options (board `board.html`, platform v3)

- **A · Beside Close now, on Outreach (recommended):** a row of its own under Outreach's stop and in its inspector,
  "Shops yet to answer · For demos", with Fill now, asked first as a timer is.
- **B · One choice when the scheme ends:** Close now becomes End now…, a sheet with "Fill it as the story has it" or
  "Close it short".
- **C · Stand in for the partners:** a card above the agents for what the story's people would do, starting with the
  kiranas' scheme.

**Shared by all three:**

- **Who orders:** every shop that hasn't answered orders its share as the story has it, each as its own shop, through
  the order path. Each order gets its own tax invoice and PDF, within the shop's cap and the packets left.
- **Topping up:** any packets still left go to the next shops with room, until the scheme is full.
- **Who is left alone:** a shop that said Not this time.
- **When it can be used:** only on a live demo workspace, only while a scheme is open, and only for staff who may
  configure clients.
- **What it leaves:** one audit line in the staff member's name, and the mark For demos wherever it shows.

## The pick

Waiting for the maintainer.
