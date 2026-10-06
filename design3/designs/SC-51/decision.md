# SC-51 · The console's splash for signing in and signing out

## The request

The maintainer, 6 Oct 2026:

> I need a splash screen for login and logout on console UI, to mask the API calls load delays. Can you think something
> really awsome that goes with the console theme? for https://smartclearance-console.web.app

## What was wrong

Measured on 6 Oct against the live console (backend-api on Cloud Run, which scales to zero):

- **The first load:** nothing draws until the session, the platform's config and its catalog have answered
  (`+layout.ts`). With the API warm the page is blank for about 1.5 s (DOM at 0.2 s, the sign-in card at 1.5 s); after a
  quiet spell, several seconds.
- **Signing in:** the button says "Signing in…", then "Welcome, <name>" (SC-49), and then holds there while the console's
  first reads come in (`refreshAll`: the clients, the dashboard, the batches, the runs). Then the console appears at once.
- **Signing out:** the account sheet closes and the console stays on screen, apparently live, until the platform and
  Firebase have signed the person out; then it cuts to the sign-in.

## The options

Each option is the console itself (`console51.jsx`, a fork of `design3/console/console.jsx` with one hook, the Stage),
with its own `option-x/splash.jsx` and `splash.css`. `sc51-shared.jsx` holds the three waits as a flow (boot, enter,
leave), each a set of simulated reads (`?boot=`, `?enter=`, `?leave=` set how long they take; `?moment=` starts at a
moment), a progress that follows them and never goes backwards, the mark drawn at any fraction, and the squircle window.

- **A · The shift** (recommended): one surface for every wait. The mark draws its route as the reads land; the reads are
  the stops of a short tracker, each landing with the time it took; the mark then flies to where the page keeps its mark
  and opens into a window onto the console (the landing page's loader, SC-35). Signing out is the same surface the other
  way. 0.9 s at the least (1.25 s on a first load), 8 s at the most.
- **B · The handover:** no curtain. The console assembles as its reads land: the card's mark travels to the sidebar, the
  sidebar slides in with its items arriving, and the Overview stands as its shape (SC-49's placeholders) under the route,
  each block taking its heading as its read lands, until the content rises. Signing out folds it back. Signed out, the
  first load holds the sign-in's form as bones under the route.
- **C · The roll-call:** the ten agents and the approval gate in a ring round the mark, waking one by one with the
  progress, each saying what it brought once its read is in (clients connected, batches in flight, plans waiting for a
  yes, runs today); the ring opens outward onto the console. Signing out, every agent stays lit: "The agents keep working
  while you're away."

All three: screen readers hear each phase once, the page behind is inert and `aria-busy`, only the loader moves and only
while something loads, and under reduced motion each is a still frame that leaves when the reads are in.

Recommended: A, because it answers all three waits with one surface in the platform's own loading language, its
progress is the real reads, it works inline before the app's scripts as well as inside them, and it is quick enough to
meet every morning.

Open question on the board: should the first load's splash play on every load, or only when the platform is slow to
answer?

## The pick

**A · The shift**, picked by the maintainer on 6 Oct 2026 from the board (`SC-51 design review.html` in platform v3).
The open question was answered **every load**: the first load's splash plays on every load of the console, at least
1.25 s, as the landing page's loader does.

What the build carries:

- **One surface for the three waits.** The mark draws its route as the reads land, the reads are the stops of a short
  tracker (one stop per read, each landing with the time it took, the current one ringed), and the words say what is
  happening: "Opening the console", the hour's greeting by name when signing in, "Signing you out" then "Signed out".
  "Waking the platform up…" takes over on a first load that runs past 2.6 s.
- **Continuity.** Signing in, the card's mark grows into the splash's; opening, the splash's mark flies to where the
  page keeps its mark (the sidebar's brand, or the sign-in card's) and its squircle opens into a window onto the page,
  which comes into focus as it opens.
- **Pace.** At least 1.25 s on a first load and 0.9 s otherwise; the progress never goes backwards; after 8 s it
  proceeds, and the build says what did not answer, with Try again.
- **Access.** One status line per phase for screen readers, the page `aria-busy` and inert behind the cover, and a still
  frame under reduced motion that leaves when the reads are in.
- **The build.** In design3, the console's flow and the splash in `console.jsx` and `console.css`; a first-load splash
  in plain script before React, as the landing page's loader. In `frontend/console`, the same plain splash inlined into
  the page, driven by the layout's loads, `refreshAll` and the sign-out.
