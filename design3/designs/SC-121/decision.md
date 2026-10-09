# SC-121 · Finance & ESG on real data

## The request (9 Oct 2026)

> I want to redesign the finance and ESG view. It should be batch based, calculations looks off for ITC and others,
> the dashboard for ESG and finance should live and based on real data.
>
> Create some actual data if needed for batches that cleared in the past for munchly with mixed things, like all units
> sold, vs some were not sold like the left over scenario.
>
> Same for GST and tax things, some previous batches should be shown with completed so that when anita and others log
> in they see proper data for Finance Esg and other tax calculations.

The epic is SC-120. Its stories:
- SC-121: this design, then the pick's build;
- SC-122: the figures (realised, ITC, costs, papers);
- SC-123: the history;
- SC-124: the live figures.

## The maintainer's answers (9 Oct)

- **The history's period:** Munchly has been live since **1 Jul 2026**. Its pilot quarter, Q2 FY27 (Jul to Sep), holds the cleared batches, and the story's batches on 2 Oct are the next ones.
- **The batches:** **12 batches**. 7 sold through, 3 with packs left at the godown and settled at expiry (full credit), and 2 with a donation, across Rakesh Traders and Lakshmi Agencies, their papers issued and reviewed.
- **The SKUs:** **price all six others** at the chips' ratios, all fictional:
  - a dealer price of 22/30 of the MRP, to the ₹0.50 below, as the Mango Drink's ₹14.50;
  - input GST of the chips' ₹0.90 on ₹16 of cost, at the SKU's own GST rate.
- **The full-credit expiry credit note:** stays **without GST**, a financial credit note.

## What the audit found

- **The quarter is a sample.** Its weekly split, channel mix and BRSR rows are story constants. Its CO₂e is frozen, and it counts the story's chips batch twice.
- **A batch's figures read the plan, not what happened.** After the leftover run the screens showed:
  - ₹1,224 kept and 217.6 kg, where the ledger has ₹1,094.40 and 194.56 kg;
  - an ITC memo stamped "ITC KEPT" with nothing reversed, where ₹129.60 was;
  - a destruction certificate of 0;
  - a money panel whose lines do not add up to its net.
- **`realised` misses the packs left at the godown.** It leaves them out of the ITC reversal, and it keeps the plan's costs avoided.

## The options

| Option | What it is |
| --- | --- |
| **A · One ledger** (recommended) | Finance and ESG share one page: the period, a reading (Money, GST, Impact), the period's figure with its working, the period drawn as its batches, and the batches by month. Each opens its own page. |
| **B · Close the quarter** | Each role gets its own home. Anita's is the quarter's close (four stops, things to chase, the GST return's figures, batch cards). Vikram's is the BRSR builder, Principle 6's rows from the batches. |
| **C · The year as a timeline** | One chart: every cleared batch a bar on the day it cleared, in the chosen reading, with the batch beside it and the months summed under it. |

All three share:
- **The batch's own page:** SC-112's head, with Money, Papers and Impact as tabs. Paperwork becomes its Papers tab.
- **The history**, worked out by money.js, with SC-122's `realised`.

## The pick

Waiting for the maintainer.
