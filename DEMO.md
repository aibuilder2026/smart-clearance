# Demo

How Smart-Clearance is demoed: the guided demo, the live workspace with two or three journeys, and the film. Also
how Reset journey makes the live demo repeatable. Every company, person and figure is fictional; Munchly Foods is the
story's client.

## Three ways to show it

| Way | Where | Runs on | Best for |
| --- | --- | --- | --- |
| **The guided demo** | [smartclearance-demo.web.app](https://smartclearance-demo.web.app), and the hosted prototype in Claude Design ([guided demo](https://claude.ai/design/p/8294ec70-3e6b-4359-8de6-2a3fd056c3b2?file=Smart-Clearance+demo+v3.html)) | the workspace app's stub and the console's demo world, in the browser; nothing is called, nothing is kept | a judge or a buyer with 5 to 18 minutes; any day, any network; always the same story |
| **The live workspace** | [munchly-smartclearance.web.app](https://munchly-smartclearance.web.app) and the console at [smartclearance-console.web.app](https://smartclearance-console.web.app) | backend-api on Cloud Run, the agents on Gemini, real pushes, real PDFs | showing that it really runs: people signing in on their own devices, agents answering, papers laid out |
| **The demo film** | Watch on [smartclearance.web.app](https://smartclearance.web.app); [youtu.be/EWFLqM3oHYU](https://youtu.be/EWFLqM3oHYU) (unlisted) | YouTube | a 5-minute walkthrough to send ahead, or to play when there is no time to drive |

## The guided demo

The demo opens on a **route map**: four lines into Munchly's workspace, each station a button. Every beat plays on the
real screens: a laptop and a phone for Munchly's people and partners, Neha's laptop for the console.

| Line | Minutes | Stations | Ends at |
| --- | --- | --- | --- |
| **The platform** | 2 | Sign in, Overview, Existing clients, A new client (from Kesari Foods' demo request), Munchly's setup, Agent setup | Munchly's workspace |
| **Masala Chips** | 6 | Connect, Detect, Verify, Value, Decide, Approve, Execute, Settle, Report | ₹21,152 recovered, nothing destroyed |
| **Mango Drink** | 5 | Detect, Verify, Decide, Execute, Settle, Report | ₹16,917: 1,372 with 52 kiranas, 150 at the staff sale, 58 to Feeding India |
| **Masala Chips · a slow week** | 5 | Execute, Settle, Expiry day, The second yes, Report | ₹18,632, with 144 packs destroyed at the godown on Priya's second yes |

### Driving it

- **Play the whole route** on the start rides it all on its own: agents act after a moment, each person's move after a
  pause, and the map shows the batch hopping from one line to the next. Pause stops it.
- **Next** (→) makes the current beat happen and moves on; **Back** (←) goes a beat back. The people's moves can also
  be made inside the devices, as they would on their own phones: sign in, open a push, approve, order, bid, record the
  staff sale, collect, send the photos, give the second yes. The notes tick each beat off.
- **Keys:** 1 to 4 jump to a line's start; M opens the map to jump anywhere; P shows the phone alone; N hides the
  notes, for a bigger stage.
- **The address** keeps the place (`#at=line.station.beat`, `#at=0.0.0` the console's sign-in), so a link opens the
  demo at any station, and a reload stays there.
- **On a phone** the person in focus fills the screen under a slim bar (Back, the station, Next); tapping the station
  opens its notes.

### Why it never needs a reset

Entering any beat puts the stub's store exactly where that beat begins: the line's journey (the chips, the Mango Drink
or the slow week), fast-forwarded to the station's start, then the beats before it. So every station opens the same
way from the map, the address or the strip, every visit starts fresh, and the dates, numbers and figures are the
story's every time (the chips' kirana invoices from RT/26-27/1279, dated 2 October 2026).

### Suggested runs

- **Five minutes:** the Masala Chips line from Approve (press 2, then pick Approve on the strip) to Report.
- **Ten minutes:** the platform line, then the Masala Chips line.
- **The whole story:** Play the whole route, stepping in with Next or a tap where questions come.

## The live demo: two batches, three journeys

Munchly's live workspace starts with two of its batches at risk on **day 0, Friday 2 October 2026**, each running its
own journey:

- **Masala Chips** MF-2409-117 at Rakesh Traders, Nagpur: 1,840 packets, 47 days left.
- **Mango Drink** MF-2410-118 at Lakshmi Agencies, Hyderabad: 22 days left.

| Journey | Who acts | What the audience sees |
| --- | --- | --- |
| **1. The chips sell through** | Priya confirms Setup; Rakesh gives his permission; the Watcher flags the chips; Rakesh sends the label photo; Priya approves the plan (₹21,770); the kiranas order from the Hindi scheme; Agrawal Wholesale bids on ExpireSoon and takes the Negotiator's counter; Rakesh loads the truck, issues the invoice from Tally and runs the van; Priya reviews the papers; expiry day's report posts the ledger | the whole loop with live agents, every paper as a PDF, the ledger's money, GST and Impact |
| **2. The Mango Drink sells through** | Lakshmi Agencies' permission and photo; Priya approves a three-line plan (no ExpireSoon lot); 52 Hyderabad kiranas order; Lakshmi Agencies records the staff sale; Meera at Feeding India collects and issues the receipt | a different plan from the same agents; the food bank and its receipt |
| **3. Food left at the godown** (either batch) | as journey 1 or 2, but some kiranas don't order; Neha closes the offer window early or fires the report; the distributor sends two photos and the agency's certificate number; Vision checks them; Priya gives the second yes | the destruction at the godown: the Expiry credit note, the agency's certificate, what was left and how it settled |

Journeys 1 and 2 run side by side; journey 3 is either batch again after a reset. The journey suites play each of
them on their own (TESTING.md), and `backend-api/scripts/walk.sh --until <stop>` brings a journey to any stop over
HTTP before a demo picks it up from there.

### Signing in

- **Everyone signs in with email and password.** The live sign-in page shows the story's people as chips that fill the
  address. Munchly's people use `@munchly.example` addresses (`priya.deshmukh@munchly.example`). Partners use their
  organisation's on `@google.example` (`rakesh-traders@google.example`, `lakshmi-agencies@google.example`,
  `shree-ganesh-kirana@google.example`, `agrawal-wholesale@google.example`, `feeding-india@google.example`). Staff sign
  in to the console on `@smartclearance.example` (`neha.kulkarni@smartclearance.example`).
- **The password** is the default every account starts on; an operator copies it with
  `backend-api/scripts/default-password.sh --copy`. No email is ever sent.
- **One browser profile (or private window) per person**, so each keeps its own session and pushes.

### The console's controls

Neha runs the demo from the console (Clients, Munchly Foods):

- **The Agents tab** lists each agent's scheduled runs and pending timers, in journey time and real time, each with a
  button to fire it now. Use it to run the Watcher's daily check, the Data agent's load, close a kiranas' offer window,
  end an ExpireSoon listing, or call expiry day ("Expiry day · report"). A timer asks before it fires early.
- **The journey-day badge** in the client's head shows how long a journey day lasts, and opens a sheet to change it:
  Real time (a day is a day), Rehearsal (an hour), Demo (five minutes) or Fast (a minute), or any length from 1 to
  1,440 minutes.
- **Reset journey…**, in the client's actions menu, starts the journey again (below).

## Reset journey

Reset journey puts a demo workspace back to the story's start, keeping everything the client configured. Run it from
the console (Clients, Munchly Foods, the actions menu, Reset journey…, choosing the day length), or locally with
`backend-api/scripts/hydrate.sh --journey-reset munchly`. A reset from the console writes an audit line in the staff
member's name.

**What it puts back:**

- **The clock** to day 0, 2 October 2026, on the day length chosen. A demo workspace replays the story's own calendar,
  so the batches' dates, days left and every figure are the story's.
- **The journey:** the story's batches start again at day 0. Earlier cases are closed as reset, and batches an
  uploaded export brought are removed (or closed, if a case used them). Nothing is deleted from history: the reset
  records when the journey began, and the screens, notifications and quarter views read only what came after it.
- **The people:** members back to their story status; anyone invited during a demo leaves the workspace (the account
  stays), except the approver.
- **The papers' numbering:** every series back to the story's (INV/26-27/0931, CN/0117, RT/26-27/1279 and the rest), so
  a re-run issues the same numbers, dated on the story's calendar. Each PDF is laid out again at the same file name, so
  an earlier journey's link opens the newest PDF.
- **The stock export:** the story's export, mapped again. Setup's confirmation goes back to not given, so Priya
  confirms it again, as in the story.
- **What an older workspace lacks:** number series, food banks' receipt forms and packaging weights are topped up, so a
  workspace built before those features gains them.

**What it keeps:** the client's configuration (gates and overrides, guardrails, the agents' settings, the expiry
policy and destruction settings, the day length), the audit log, Firebase accounts, and the pilot quarter's 12 cleared
batches with their papers, photos and records.

**The clock afterwards** never stops. While a case is open it runs at the chosen day length; between cases it runs in
real time. So a journey left alone keeps aging: a workspace reset on 11 October reads about 29 October on 7 November,
when the Mango Drink is past its best-before and the chips' figures are no longer the story's. **Reset on the morning
of a demo.**

## Before a live demo

1. **Reset journey** that morning (or the night before), on Real time, or on Rehearsal or Demo to show days pass in
   minutes.
2. **Set up before the Watcher looks.** Have Priya confirm Setup and Rakesh (and Lakshmi Agencies) give their
   permission before day 0's 09:00 check, or fire the Watcher from the Agents tab afterwards; it flags a batch only once
   both are done.
3. **Have the photos to hand:** the label photos (`agents/evals/vision/images/story-clean.webp` for the chips,
   `mango.webp` for the Mango Drink) and, for journey 3, the destruction evidence
   (`design3/system/img/evidence/<batch>-before.webp` and `-after.webp`) and an agency's certificate number.
4. **Wake the API.** Cloud Run scales to zero, so open the console a minute before; the first request waits a few
   seconds.
5. **Rehearse if it matters:** the journey suites on production (`E2E_TARGET=prod`, TESTING.md) play a journey end to
   end, then Reset journey again.
6. **After a compressed run,** set the day back to real time in the console (or
   `backend-api/scripts/hydrate.sh --day-minutes munchly=1440` locally).

## Known limits

- The agents' Pro model is a preview with a tight quota: a step can take a few seconds longer while a call retries,
  and falls back safely if it can't get through.
- ExpireSoon, the food banks, Tally and the stock exports are mocked; pushes, papers, photos and Gemini are real.
- The photos, papers and exports buckets delete files 30 days after they are written (`infra/prod/storage.tf`), so the
  pilot quarter's PDFs and photos need laying out again after that (`hydrate.sh --papers munchly --again` and
  `--photos munchly`, or the hydrate job in production).
- The live workspace and local development share one Firebase user pool: the same accounts sign in to both.
