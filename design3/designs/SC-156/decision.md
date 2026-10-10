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

Pending.
