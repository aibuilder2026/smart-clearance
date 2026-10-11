# SC-176 · The journey clock explained · the decision

## The request (11 Oct)

"Wherever on UI we see date and time I want an info note to be added that this was done as part of the prototype to be
able to run it with defined dataset of SKU with best before dates. And show them steps how journey can be reset fast
forwarded." With a screenshot of the live Command Center's line, "Live · Fri 2 Oct 08:00".

## Why the workspace has its own clock

A synthetic workspace replays the story's calendar from Fri 2 Oct 2026, day 0 (SC-73, SC-81), so Munchly's nine
batches of eight SKUs keep their best-before dates and every figure holds. A journey day lasts 1 to 1,440 minutes
(SC-66, the console's badge, SC-68). Staff reset the journey and fire runs and timers in the console (SC-79, SC-88,
SC-94).

## The options

On one board in app v3, `SC-176 design review.html`; the mockups are the workspace in its live mode, overriding only
the clock's line (`option-*/opt.jsx`), with one shared guide (`guide.jsx`, `guide.css`): why, the journey time now,
Start the journey again, Move it forward, afterwards, Open the console.

- **A · At the clock (recommended):** an "ⓘ Prototype time" button after the date, the time and the pace, opening the
  guide; the icon alone under the bar's collapsed title.
- **B · A note under the clock:** a line under the clock, "Prototype time: the story's own calendar, so its batches'
  best-before dates hold", with "How to reset or fast-forward".
- **C · Every date marked:** every journey date and time on the page dotted-underlined, with a tooltip, each opening the
  guide; a Prototype tag on the clock.

In each, the console's journey-day badge gets the same note.

## The pick

Pending.
