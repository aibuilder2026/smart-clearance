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

Waiting for the maintainer.
