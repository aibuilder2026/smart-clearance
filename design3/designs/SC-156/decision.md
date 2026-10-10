# SC-156 · The Outreach card

## The request

The maintainer, on 10 Oct, with two screenshots of the Masala Chips' Execution (the second with the Hindi bubble circled):

> "In supply chain command center outreach looks weird in command center, messages are sent to multiple kiranas, no
> need to show them here"
> "Also this block should show something like offer window over like other channels."
> "Dont change anything with the VAN delivery map"

## Now

The Outreach · 38 kiranas card on a batch's Execution (design3 `brand.jsx`, core `Execution.svelte`) opens with the
push as Shree Ganesh Kirana received it, though the same scheme went to every kirana of the distributor, each with its
own name. Its only state is the "push · Hindi" badge; the Lister card (SC-151) and the Negotiator say where their
channel stands, this card does not. The cluster map with the van route stays exactly as it is in every option.

## The options

All three are mocked on the real kit (`options/mockup.html`, `options/sc156.jsx`, `options/sc156.css`), each in five
states: queued, open, filled, window over, delivered. Each keeps the figures, the progress line, the map and the latest
orders, and puts the one message every shop got behind **The push, as sent**, closed.

- **A, the scheme's stops (recommended):** the scheme as the shops see it; the offer window as one line that fills with
  the time gone; four stops with their times (Sent, First order, Closed, Van round).
- **B, the window first:** one sentence leads; the 48 hours as a timeline of the orders, the packets climbing step by
  step.
- **C, the shops:** every one of the 38 shops as a cell (ordered, not this time, waiting, no answer).

The question on the board: when the window ends with packets left, should the Lister card also say its lot grew by
them?

## The pick

10 Oct: the maintainer picked **A, the scheme's stops**. On the board's question (should the Lister card also say its
lot grew by the shortfall) they asked for more explanation; the build keeps the Lister card as it is, and the question
stays open.

## What was built (option A)

- **The card** (design3 `brand.jsx` `SchemeCard`, core `screens/brand/SchemeCard.svelte`), on Execution in place of
  the Outreach card:
  - the scheme as the shops see it: the pack and the packets, the pack price with the free packs and the effective
    price, best before, the distributor and each shop's cap;
  - the two figures as before; the sample push is gone;
  - the offer window as one line: its hours, when it closes, filled or ended, filled by the share of the window gone
    (the live source's clock; the stub reads it from the push and the fill times);
  - four stops with their times: Sent, First order, Closed, Van round;
  - the cluster map with the van route, called exactly as before, and the latest three orders;
  - **The push, as sent** (`aria-expanded`, 44 px, closed): the one message every shop got, with `{shop}` where its
    own name goes, and its English.
- **The badge** follows the scheme: queued, open, filled, window over, delivered.
- **The offer's close times:** the stub's offer carries `closesAt` (design3 `flow.js`, core `flow.ts`); backend-api's
  case view and the contract carry `closedAt`; the live projection carries both and `elapsed`, the share of the window
  gone on the journey clock.
- **Styles:** `screens.css`'s `.ks`, `.kwin`, `.esl-steps.green` and `.kpush`, copied verbatim into core.
- **Specs:** the e2e flow polls the scheme's stops instead of the progress bar it replaced; the a11y scan of Execution
  opens the push; two live tests draw the card on the executing and cleared moments.

## Checks

- backend-api 554 passed, 1 skipped; the live fixtures regenerated.
- The frontend gate passes: core 273 (9 goldens of Execution updated), api 79, workspace 95 (2 new), admin 17,
  demo 5, console 3.
- design3's Execution and the port's stub build were shot at 1440 and 390, light and dark (`build/`).
- The browser suites were not run (SC-55).
