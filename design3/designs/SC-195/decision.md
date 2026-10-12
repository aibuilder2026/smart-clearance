# SC-195 · the sign-in's backdrop and products, and the swing explained

## The request (12 Oct 2026)

From the maintainer's list of small UX changes, the two that change a design (the rest is SC-194):

> 4. For workspace login, I need a better background, may something with blurry effect --> product showcased should
>    be done in much better way
>
> 8. See image 6, there should a note added, clicking which I should see the detailed calculation how swing is
>    calculated and loss is minimized .

Image 6 was the Mango Drink's Journey card: "₹16,917 recovered, every line done · swing ₹22,194".

## The options

The board, `board.html` (published to app v3 as `SC-195 design review.html`), has two parts, three options each. Every
option is the workspace itself with only that part changed (`pages.py`, `mockup.tmpl.html`).

**The sign-in** (the live workspace's sign-in, `?state=signin`; each option replaces the desktop stage and the ground):

- **A, In focus** (recommended): one photograph, Munchly's chips and mango drink crisp on a kirana counter, the shop
  soft behind them, under the frosted card; a band at the top on phones. The plate is a local Qwen-Image render from
  the packs' renders, extended to 16:9 (`signin-a/plate.prompt.json`).
- **B, The range, behind glass**: SC-187's depot still far out of focus behind everything; Munchly's six food packs on
  a glass shelf with name, size and MRP, rising once (spring 260 / 26 / 1).
- **C, The brand's own light**: no photograph; a soft-focus field in the system's inks, drifting in once (2.4 s); the
  three packs composed large on a glass floor with reflections and name tags (spring 240 / 22 / 1).

**The swing** (Priya on the Mango Drink's page once it has cleared, on the stub; `?story=chips` for the chips, whose
counter moved the swing; every figure from money.js through `swing.jsx`):

- **A, How it adds up** (recommended): a note, "₹22,194 better than destroying it · How it adds up", opens a sheet: the
  swing, a bridge from the P&L if destroyed (−₹22,657.20) to the P&L with the plan (−₹462.90), the bin's lines, each
  exit's line, the swing as a sum, and how the loss was kept small.
- **B, Beside the figure**: "Show the working" opens two columns on the card: destroyed against the plan, line by line.
- **C, Pack by pack**: an ⓘ opens where the swing came from: each exit's share, and a pack against the bin.

The charts take SC-149's validated inks (#167a52 / #c2410c light, #34a571 / #e0662c dark), every bar labelled.

## The pick

Waiting for the maintainer.
