# SC-112 · Batch first

## The request

The maintainer, on 9 Oct, about the workspace app:

> "Now for the workspace app.. I need you to think a bit on the design and navigation of command center, route room and execution.
> 1. The design of the individual pages are perfect, no change is needed
> 2. The navigability seems a bit odd, everything starts from monitoring of a batch which can be in different states.
>
> I need a top down approach starting with batch as the 1st point, think hard and come up with aesthetically pleasing approach"

## Why it feels odd today

- **Two kinds of place in one list:** the operator's sidebar puts Route Room and Execution beside the Command Center and Batches, though each is a screen of one batch.
- **The batch is hidden:** Route Room and Execution open the "batch in focus", whichever was opened last (SC-91 had to keep it). On a phone, Route and Live in the tab bar work the same way.
- **The state picks the screen:** the Command Center's button is Open Route Room, Review and approve or Watch execution, by the batch's state.
- **Switching batch half works:** the batch tabs (SC-68 B) are on the Command Center and the Route Room, not on Execution; Paperwork is not in the operator's menu.
- **Back is fixed by stage:** Execution goes back to the Route Room, the Route Room to the Command Center.

Captured in `current/` (live mode, Priya, the chips at Approve and the Mango Drink at Verify).

## What all three options share

- Workspace, then batch, then the batch's screens: Journey, Route Room, Execution, Paperwork.
- Route Room and Execution leave the sidebar; the phone's tab bar is Today, Batches, Reports.
- Every screen of a batch names its batch in its address. Back goes to where the batch was opened from.
- A batch opens on the screen for where it stands: before Verify its journey, Verify to Approve the Route Room, Execute its Execution, Settle its papers, cleared its journey.
- The Command Center, Batches, Setup, Finance & ESG and every screen's body are as today. A batch not in a journey keeps its sheet.

## The options

Each is the app itself (`option-x/mockup.html`): the app's scripts, with `sc112-pre.jsx` (a Screen that takes a batch frame's title, line, back and the row under the title), `sc112.jsx` (the batches in a journey, the parts of a batch, the Journey view, the shell) and `option-x/opt.jsx` (the operator's RoleApp). Every other role is the app's own. `?stage=` moves the chips (5 Approve, 6 Execute, 7 Settle, 9 Cleared); the pill at the bottom left does the same. `./build.sh` compiles the `.jsx`; `shoot.mjs shots.json` takes the stills; `record.mjs` the clips.

- **A, the batch page (recommended):** a batch is a page with one head (its product, name, id, distributor, state) and its screens as tabs under it; the batches in a journey sit in the sidebar by name and stop. Phone: the tabs as a pill row (Journey, Route, Execution, Papers). Motion: the tab thumb slides (500/40), the screen under the head rises 6 px in 220 ms.
- **B, the batch rail:** opening Batches, or any batch, turns the sidebar into the batch rail, every batch grouped by where it stands (Needs your yes, In a journey, Watching), the open batch unfolding its screens; the page keeps its own title with the batch under it. Phone: a stack, Batches, then the batch with its screens as rows, then the screen. Motion: the sidebar drills in and out (28 px, 240 ms), the open batch unfolds on the sheet spring (420/40/0.9).
- **C, the stops lead:** a batch is headed by its own tracker (the Route Room's first card, moved into the frame); each stop is a button (Detect the journey; Verify, Value, Decide and Approve the Route Room at that part; Execute, Settle, Report their screens); a pill marks the stop in view and follows the Route Room as it scrolls; the stops stay under the bar once the card scrolls away; the batch's name switches batch. Phone: the stops as chips. Motion: the pill slides (500/40); going on, the screen rises from below (26 px, 280 ms), going back it drops from above.

**Why A:** the plainest top-down shape, with nothing new to learn: a batch gets a head and an address, its screens are tabs, and the batches in a journey come first in the sidebar after the workspace's own places. Every screen keeps its design and width, it is the smallest build, and it carries over to other roles. B is the better switcher when many batches run at once, at the price of a sidebar with two modes; C is the most our own, but the tracker shows two things at once and its stops crowd a phone.

**Checked:** the new text measured on the pixels behind it, light and dark: 4.74:1 at the lowest (the rail's "d" after days left, dark), 5.13:1 or more elsewhere. The quieter tabs and rail rows keep the secondary ink and dim only their icon. Targets are 44 px on touch screens.

## Open questions on the board

1. Should a batch not in a journey open a page (its Journey only) instead of its sheet?
2. Should Finance and Sustainability get the same batch page, their screens as its tabs (SC-103)? Rakesh's batch screens later?
3. The build's addresses: `/batch/<ref>/<screen>`, with `/route/<ref>` and `/execution/<ref>` sent there.

## The pick

9 Oct: the maintainer picked **A, the batch page**, with two answers:

- **Other roles:** operator only for now. Finance and Sustainability keep today's navigation (SC-103's screens), and can follow in a later story.
- **A batch not in a journey:** opens its own page, with only its Journey until the Watcher flags it (the sheet goes, on the Command Center's watchlist and on Batches).

## What was built (option A)

design3 first (`system/kit.jsx`, `system/components.css`, `screens/common.jsx`, `screens/brand.jsx`, `screens/live.jsx`, `screens/roles.jsx`, `screens/screens.css`), then the port (`frontend/core`):

- **The operator's sidebar:** Command Center, Batches, Setup, then **In a journey · n**: each batch still in a journey with its pack, short name and stop (amber while it waits for a yes), at most five and then "n more in Batches", then Reports. The kit's `Shell` draws a nav item with a `product` as a batch (core `Shell.svelte`, `NavItem.product`, `stop`, `human`, `aria`). On phones the tab bar is Today, Batches, Reports.
- **The batch's page:** one head for every screen of the batch (`BatchHead`): the pack, the product's name, the batch id and distributor, the batch's state and the live line; then its screens as tabs (Journey, Route Room, Execution, Paperwork) with the dot where it stands. `Screen` takes the head from the batch frame (design3 `BatchCtx`, core `provideBatchFrame`) in place of its own title and the row under it, and keeps its own line under the tabs: Execution's "day 0 to 14 · four agents", Paperwork's "prepared by the Paperwork agent at the award". The Route Room's line was only the batch's identity, which the head now carries, so it gives way.
- **Journey:** a new screen, the Command Center's pieces for one batch (`BatchJourney`): its tracker card, its cluster and its agents; for a batch in no journey, what the Watcher sees of it (`BatchFacts`, the sheet's body, now shared with the sheet).
- **Where a batch opens:** on the screen for the stop it is at (`partAt`): its Journey before Verify and once cleared, the Route Room from Verify to Approve, Execution at Execute, Paperwork at Settle. The Command Center's watchlist (busy and quiet) and the operator's Batches open every batch this way, a batch in no journey on its Journey (the maintainer's answer); Finance and Sustainability keep their screens and the sheet.
- **The back link** goes to where the batch was opened from (Command Center, Batches, Inbox, Finance & ESG, Setup, Profile); tabs replace the history entry.
- **Addresses** stay `/<screen>/<batch>` (`/route/MF-2409-117`, `/execution/…`, the new `/journey/…`), so every link and the journey suites keep working; the board's open question on `/batch/<ref>/<screen>` was not answered, so it is left for later.
- **The guided demo** shares these screens: Priya's laptop and phone show the new sidebar and head.

Stills of the build are in `build/` (design3 at 1440, 820 and 390, light and dark; the demo at stage 6; the port on the stub).
