# SC-68 · Munchly's workspace, live: the design round

Part of epic SC-66, "Workspace v1: Munchly's journey live". The workspace app (`design3/app`, ported to `frontend/`)
moves from the in-browser stub to backend-api.

## The request

The maintainer's decisions for Workspace v1:

- **Sign-in:** email and password only, the same approach as the console. Phone with a one-time code and Google sign-in
  go away. Munchly's people use `@munchly.example`; everyone else (distributors, kiranas, the Raipur buyer, food banks)
  uses `@google.example`. Accounts are made by invitation on a default password; no email is ever sent, so there is no
  forgot-password flow. One message covers any wrong sign-in, because email enumeration protection is on.
- **Live data:** updates over SSE, push notifications through FCM, and a journey clock that can be compressed. A client
  setting makes one journey day last 1 to 1,440 minutes, and screens show journey time.
- **Partners** act only by signing in themselves; there are no stand-ins.

The round asked for 2 or 3 options, each a coherent answer to five things in the workspace app: the sign-in (with a
wrong sign-in, signing in, and a signed-in person who is not a member); the push-permission ask (ask, install first on
an iPhone, denied), after the first sign-in and never on top of a task; the live states (the first load, reconnecting or
offline, a day with nothing at risk for the Command Center and the partners, an action that failed with Retry, upload
progress for the label photo and Setup's DMS export); the journey clock with a cue when days are compressed; and how a
person sees and switches the batch in focus when the Watcher flags several, now that each batch has its own Route Room
(`/route/<batch ref>`). And a short console board: where the new client setting "Length of a journey day" lives and how
it is entered, and the invitation taking an email only.

## How the options were made

- **Context:** `PRODUCT.md`, `DESIGN.md`, `design3/README.md`, the app prototype (`design3/app`, `design3/screens`), and
  the earlier rounds SC-24 (Munchly's sign-in branding), SC-46 (the console's email and password, picked A), SC-49 (the
  console's loaders, picked A) and SC-51 (the console's splash, picked A).
- **Tools:** impeccable (Operate mode: shape, layout, critique; its craft floor and detector) and ui-ux-pro-max's UX rules
  (password visibility, announced errors, submit feedback, empty states that guide, focusable error summaries, progress
  for multi-step work, contextual live status). ui-ux-pro-max has no rule for when to ask for notification permission; the
  options follow the platforms' own guidance instead: ask after sign-in, in context, never on load, and say how to undo a
  block. No imagery was generated: the round reuses the v3 renders.
- **The mockups** are the app itself. `sc68-pre.jsx` loads after `screens/common.js` and replaces `Screen` with one that
  takes each option's chrome; `sc68.jsx` forks the screens that change (the Command Center and Route Room for any batch,
  the approve sheet, the label photo, Setup's upload, a partner's quiet day), the sign-in, the shell and the scenarios;
  `option-x/opt.jsx` holds each option's own pieces. `?state=` picks one of 18 states and `?shot=1` holds it still; outside
  a still the first load finishes, a dropped stream comes back and uploads progress, and the button at the bottom left
  lists every state. `./build.sh` compiles the `.jsx`.
- **Interviews:** the orchestrator ran this round without questions to the maintainer, so impeccable's discovery
  questions were answered from the brief.

## The options

- **A · In the shell** (recommended). The journey clock and the connection live in the shell: a block at the foot of the
  sidebar (Live, Fri 2 Oct 09:31, Journey time, 1 day = 5 min), a chip by the bell on phones; both open a sheet that
  explains the pace. The first load draws the shell at once over the screen's own shape. The push ask is a card at the
  top of home after the first sign-in. The batch that needs a person leads the Command Center as the tracker card, the
  other flagged batches sit under it as rows, and the Route Room's batch name is a switcher (a menu of the flagged
  batches, previous and next). The label photo shows its progress on the photo, as messaging apps do.
- **B · In the header, batch by batch.** A live line under every page title (Live · Fri 2 Oct 09:31 · 1 day = 5 min), a
  band across the page while the stream is down, the console's splash (SC-51) for the first load, one first-run step that
  asks for notifications with a preview of the push itself, and the flagged batches as tabs over the tracker card and
  under the Route Room's title. The Send button fills as the photo goes.
- **C · On the tracker.** The tracker docks at the foot of every screen as a live order bar: the batch in focus, its stop,
  journey time, the connection and a pager across the flagged batches. The first load, the push ask, a failed approval
  and uploads all use the bar; in the Route Room it takes over the approve bar. The Command Center's tracker cards are a
  deck with a pager, and the tracker card's head carries the clock.

**Shared by all three:** the console's sign-in form in Munchly's card, with one message for any wrong sign-in and no
forgot-password; "Signed in as Neha Kulkarni … isn't a member of Munchly Foods' workspace" (B adds where the account does
sign in); no stand-ins anywhere (the account chips, Explore as someone in the story, Switch person and every "Continue as
…" go); a failed Approve said in the sheet with an amber Retry, and Approve unavailable offline with its reason; the
second flagged batch, Mango Drink MF-2410-118 (22 days left, 1,580 of 2,000 at risk, −₹22,657 if destroyed, at Verify,
waiting for Lakshmi Agencies' photo from her own phone); grey marks for reconnecting and offline, never red or amber.

**Why A:** the clock and the connection are app-wide facts, so they belong to the one place every role has on every
screen, and the shell carries them without adding anything over a task. A changes the approved screens the least and is
the smallest build. B suits a maintainer who wants every flagged batch in view; C is the boldest and most on-brand, at
the price of chrome on every phone screen.

## The console options

- **A · In the client's head, presets and a number** (recommended). A badge beside Live, the plan and the agents says
  "1 day = 5 min" (or Real time) on every tab, and opens a sheet: Real time (1,440), Rehearsal (60), Demo (5), Fast (1),
  or any number of minutes, with what it means for the agents (the Watcher's 09:00 check every 5 minutes, a 48-hour offer
  open 10 minutes, a 47-day journey about 3.9 hours) and a note for a live client.
- **B · On the Agents tab, a number only.** A card over the pipeline with a minutes field, Save and the same readouts.

**Both:** the invitation asks for an email only (Munchly's staff on `munchly.example`, partners on any address), says
they sign in with the default password you hand over and that nothing is emailed, and its button is Invite.

**Why A:** a client left on a five-minute day runs its Watcher every five minutes, so the setting should show on every
tab; presets make real time unmistakable and the usual values one tap.

## Open questions on the board

1. Judges' accounts: a printed list with the default password, or chips on the sign-in that fill the email only?
2. Should the workspace admin's Users screen, which still invites by "Email or mobile number", follow the console?
3. The Raipur buyer signs in at munchly.smartclearance.com with a google.example address: he keeps ExpireSoon's look?
4. The journey clock under WCAG 2.2.2: treated as essential, stepping a quarter hour at a time and never announced.
   Agreed, or should a person be able to pause it?

## Found on the way

- The sidebar's foot (`.sb-foot`) sized its one column to the person's nowrap role line, so it ran past the 256 px
  sidebar (the person's line was cut at the sidebar's edge). The mockups give it `minmax(0, 1fr)`; the build should too.
- The icon set lacks `bell-off`, `square-plus`, `fast-forward`, `share-ios` and `book-open` (Lucide); the mockups add
  them, and the build adds them to `system/icons.js`.
- impeccable's detector flags two incumbent values on these pages: the 2 px Route Green state ring (DESIGN.md's
  One-Pixel Rule) and the lock screen's radial wallpaper (`screens/screens.css`). Both are file-scoped ignores for the
  SC-68 mockups in the local `.impeccable/config.json`.

## Published

- The workspace board: app v3, `SC-68 design review.html`, with `SC-68 option A.html`, `SC-68 option B.html` and
  `SC-68 option C.html`.
- The console board: platform v3, `SC-68 console review.html`, with `SC-68 console option A.html` and
  `SC-68 console option B.html`.

## The pick

Pick pending.
