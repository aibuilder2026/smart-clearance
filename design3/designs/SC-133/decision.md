# SC-133 · The distributor's portal, batch by batch: the decision

## The request (9 Oct 2026, the maintainer)

- "Van route page seems odd, The Raipur lot seems stubbed... This should also be per batch"
- "for Distributors, it should show past orders in the order section"
- "For destruction. ITC should be reversed, but shows 0." (a data bug: SC-132)
- "The order section does not look logical, I cannot understand what is for what"
- "Today section seems misleading, the batch is all that is tracked for disributors in the app"
- "Think of proper design for Distributors"
- "The batches section of distributor is fine"

## The options

The board is `board.html`, published to app v3 as `SC-133 design review.html`. Each option runs the app prototype with the distributor's Today, van route and Orders replaced (`dk.jsx`, `option-*/opt.jsx`).

- **A · A card for each batch** (recommended): Today is a card per batch in a journey (its next step, its lines); Deliveries is per batch; Orders is grouped by batch, past included.
- **B · One job list:** Jobs (now, waiting, done) across batches; Rounds, a dated schedule; Orders, one ledger filterable by batch.
- **C · A batch in focus:** a switcher scopes Today (the batch's run sheet), Deliveries and Orders to one batch.

## Shared by every option

- Batches (SC-130) stays as it is.
- A batch shows only the lines its plan has: no lot or truck without an ExpireSoon line; the van round on the distributor's own cluster.
- Orders carries every batch since July, each order with its buyer, packs, price and paper.

## The pick (9 Oct 2026)

- **A · A card for each batch**, the recommended option, with the maintainer's additions:
  - "deliveries, label photo should show current and past": Deliveries shows the batch in a journey's van round, truck, staff sale and pickup, then every earlier delivery; the label photo shows the one asked for now, then every earlier label photo with what Vision read;
  - "today I can have 1 or more batch in process, UI should take care": Today lays out one card per batch in a journey, the one asking most first, with an index of the batches when there is more than one.
- **The label photo** stays in the laptop sidebar (off the phone's tabs).

Only option A is built: design3 first, then core and the live workspace.
