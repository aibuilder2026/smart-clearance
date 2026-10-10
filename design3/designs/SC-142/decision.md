# SC-142 · A batch's record · the decision

## The request (10 Oct)

- "Both supply chain operator and distributor should be able to see the photos they have sent for batch and destruction
  evidence pictures."
- "Supply chain operator should be able to see past batches under Batches section with details like what picture was
  sent, audit log of the everything that happened in that batch, photos of destruction and approval sent etc."

## Today

- Priya's Batches lists the nine batches in view; a cleared batch past its best-before is in the Ledger only (SC-126).
- A past batch's page (from the Ledger) has Money, Papers and Impact: no photo, no record of its steps.
- Rakesh's Label photo lists what Vision read from each earlier photo, as text, without the photo; his destruction
  photos show only on the Destroy screen while that batch is open.

Shots of today are in `current/`.

## In every option

- Every cleared batch joins Priya's Batches, each opening its page.
- The photos as they were sent: the label photo, with what Vision read from it and that it matched the export; destroyed
  at the godown, the before and after photos with Vision's four checks. Each opens whole.
- The yeses (the plan, the papers' review, the destruction) and the audit trail: every step, day by day, by the agent
  or the person who took it; a person's step is their audit line, in their name.
- The distributor sees his own photos and moments only, never Munchly's audit log.
- The history's label photos: the twelve pilot-quarter batches had none, so each has one printed with its own batch and
  dates (`photos/`, Qwen-Image, with sidecars): Rakesh Traders' as edits of the Vision eval set's clean label for the
  product, Lakshmi Agencies' rendered afresh in the eval set's words.

## The options

On one board in app v3, `SC-142 design review.html`.

- **A · The Record tab (recommended):** Batches adds every cleared batch below the batches in view, by month, with its
  photos counted and what it recovered. A batch's page gains a Record tab: the photos together, the yeses in a card of
  their own, and the audit trail filtered to people or agents, with a CSV. Rakesh's batch page gains a Photos tab.
- **B · Evidence on the timeline:** Batches is one table, In view or Cleared, with a cleared row's photos as thumbnails.
  A batch's page opens on its Timeline, every photo and yes at the moment it happened; Audit lines shows each person's
  step as the audit log keeps it. Rakesh's What happened carries his photos at his moments.
- **C · The batch file:** Batches switches to cleared batches as files, the label photo on each cover. A batch's page
  leads with its evidence (every photo and yes) and gains an Audit log table, exported as CSV. Rakesh's Label photo
  becomes Photos, every photo he sent, batch by batch.

## The pick

Waiting for the maintainer.
