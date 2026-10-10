# SC-149 · Recovered and destroyed · the decision

## The request (10 Oct)

"Console dashboard graph across all clients seems to be duplicating the recovered graph, see if we can add destroyed
food into the graphs too... Agents at work and other sections looks fine dont touch them"

## Found

- The Overview's first figure, **Recovered, 30 days**, and its sparkline draw the recovered series; the **Recovered, by
  day** card draws the same series again under the same total.
- Nothing says what was destroyed: `sc.batches` keeps what a closed batch recovered and its outcome, not the packs no
  channel took. Munchly's journey cases know it (the ledger's `destroyed` and `destroyedKg`); the synthetic world's
  clients close with `recovered` only.

## The options

On one board in platform v3, `SC-149 design review.html`; each mockup is the console on a review world (Munchly and four
fictional clients, 180 days of batches, about 4 in 10 leaving packs destroyed), with only the first figure and the card
changed (`console149.jsx`, `fig.jsx`, `option-*/opt.jsx`).

- **A · Food, by day (recommended):** the first figure stays the money; the card shows each day's kilos kept out of
  landfill above the baseline and the kilos destroyed under it, hatched, on one scale, with the share saved.
- **B · Recovered and written off:** the card keeps the money and adds what the destroyed packs had cost, hatched under
  the baseline; the first figure trades its sparkline for the food split.
- **C · Food, so far:** the first figure stays the money; the card shows the kilos kept out and destroyed as running
  totals over the range, each named at its end.

Colours, validated with the dataviz script against the card's surface: kept out `#167a52` / `#34a571`, destroyed
`#c2410c` / `#e0662c` with a hatch (CVD ΔE 9.1 light, 9.0 dark). The ledger's red failed against the green (protan
ΔE 1.7). The destroyed figure's text: 6.04:1 light, 7.41:1 dark.

## The pick (10 Oct)

**Option A · Food, by day.** The first figure stays the money, Recovered, with its sparkline. The card under Agents at
work becomes Food, by day: each day's kilos kept out of landfill (sold or given) rising from the baseline, and the kilos
destroyed (no channel took them) hatched under it, on one scale, with both totals and the share saved; the tooltip and
the table add the packs destroyed, what the day recovered and the batches closed.

Its other states, for the build:

- **Nothing closed in the range:** the baseline and its axis, the headline at 0 kg, and "Nothing closed in this range".
- **Nothing destroyed:** no bars under the baseline, the space one step deep; "Nothing destroyed in this range".
- **A client's batches closed before this:** they read 0 destroyed until the next hydrate gives them their packs.
