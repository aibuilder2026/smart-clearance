# SC-152 · Buttons that wait · the decision

## The request (10 Oct)

- "UI/UX glitches, especially on button clicks across all apps when it makes network calls, there should some animation
  on buttons to make the user experience seamless, currently it just becomes blank or hangs for sometime."

## What is wrong today (the survey of 10 Oct)

- **Blank:** the kit's `loading` button (`design3/system/components.css` and `frontend/core/src/styles/components.css`,
  lines 40–43) hides its label with `color: transparent !important` and centres a spinner whose colour is `inherit`. The
  spinner inherits the transparent ink and its rects fill with `currentColor`, so a waiting button is an empty pill.
  `--spin-color` on lines 42–43 is read by nothing. `loading` never sets `disabled`, so Enter or Space can send again,
  and the link form of Button ignores it.
- **Hangs:** about 71 buttons call the network. 45 show nothing until the answer lands.
  - The workspace: 39, of which 24 show nothing (Users' invite, status and role, Rules' save, Pickups' confirm and
    collect, the truck, Paperwork's review, the ExpireSoon bid, accept and chat, Not this time, the destruction review,
    the PDF links, Pause).
  - The console: 30, of which 21 show nothing (every `Console.act` caller: the agents' switches, autonomy and settings,
    the triggers, Rules, the profile, the SKU gates and overrides, People, Go live, Pause every agent, Remind, the
    first export's request).
  - The landing page: 2, both with the blank loading state. The guided demo calls nothing.
- **What follows the press:**
  - the live workspace's `#send` never rethrows, so 13 screens that toast success do so on a refusal too;
  - the stub's `pending` is a plain `Set`, never reactive;
  - `act`'s `feel` delay runs before `pending` is set;
  - the console's `Console.act` awaits `refresh()` (every console query read again) before a button lets go, and its
    Switch and Segmented show the server's value, so they jump back until then;
  - `InviteForm`, the staff invite and New client clear `busy` before their refresh or `goto`, so they can be pressed
    twice;
  - the workspace has no loading line between screens; the console has SC-49's RouteBar;
  - signing out has no error path in either app;
  - core's `Alert` calls its action without awaiting it and closes at once.

## The options

On one board in app v3, `SC-152 design review.html`; each option is the same lab of real buttons from the four apps
(`lab.jsx`), with only how they wait changed (`option-*/opt.jsx`), the network simulated (`?lat=fast|usual|slow|refused`)
and every phase freezable for stills (`?freeze=pending|slow|done|error`). `current/` is today's behaviour on the kit's own
Button.

- **A · Says what it's doing (recommended):** SC-49's Sign in for every button. It keeps its size (every face stacked,
  the widest sets the width), says what it is doing, a spinner turns in the icon's place in the button's own ink, and a
  3 px line creeps along its foot (to 90% in 1.1 s, `[0.3, 0.7, 0.4, 1]`). The answer: a tick (spring 520/22/1, path
  280 ms) and the done word for 1.2 s; a refusal: a 360 ms shake and the reason under the button with Try again. Past
  3 s a line under it says it is still working. Controls take their value at once and say Saving…, Saved, or put it
  back with why.
- **B · The fill:** the button is its own progress bar: words unchanged, the ground fills from the left in a deeper tone
  (lighter behind dark ink), to 90% in 1.4 s, with a sheen over the filled part; the answer completes it and a tick
  takes the icon's place; a refusal drains it with a shake and the reason comes as a toast.
- **C · Act at once:** the press shows its result at once (the done word and tick, the screen's state changed); one chip
  at the foot of the window carries every call in flight and turns to Saved; a refusal puts the screen back and the
  chip turns red with Try again. Sign-in, uploads, the label photo, PDFs, Fire now and Send request wait in the button.

**In every option:** the waiting lives in core's Button and one action helper per app; the button locks while it waits
(keyboard too); nothing shows for an answer under 100 ms and a shown wait stays 400 ms; past 3 s it says so; success
only on success; the console's controls keep their value and its buttons let go once saved; the workspace gets the
console's route line between screens; sign-out says when it fails; reduced motion lands every step at once.

## The pick

Waiting for the maintainer.
