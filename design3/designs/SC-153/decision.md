# SC-153 · Kirana invoices · the decision

## The request (10 Oct)

On the SC-148 board, the maintainer answered its open question, whether each kirana's order should get its own tax
invoice from the distributor, with **"An invoice per order"**. Two answers followed:

- **Before GST**, as the ExpireSoon invoice is: ₹18.00 effective + CGST 2.5% + SGST 2.5%, and the shop pays the total.
  Munchly's and the distributor's figures stay; a kirana's paid and margin follow the invoice.
- **Scheme discount:** quantity × ₹21.60 less a 16.67% scheme discount, so every invoice equals what the ledger counts.

The invoice's layout is SC-148's pick, option B, Tally's. This round is where the invoices show.

## Today

- A shop's order has no paper: Shree Ganesh Kirana pays ₹432 for 24 packets on a line of the order page, with no GST.
- The order page counts 2 free in every 12, so an order not in twelves pays more than the ledger counts: Mauli
  Kirana's 10 packets of MF-2406-105 read ₹288 paid against the ledger's ₹240. 73 of the history's orders are like it.

## In every option

- Tally's tax invoice for a B2C supply within the state: the distributor's identity, the shop as buyer (Unregistered),
  the place of supply, CGST and SGST, the HSN summary, the amounts in words; no IRN.
- The figures: 24 × ₹21.60 = ₹518.40, less ₹86.40 (16.67%) = ₹432.00 taxable, CGST ₹10.80, SGST ₹10.80, round off
  ₹0.40, total ₹454; his margin ₹720 − ₹454 = ₹266 (₹288 today).
- Each distributor's own series, history first: Rakesh Traders `RT/26-27/1164` on (115 in the history; the chips' 31
  are 1279 to 1309), Lakshmi Agencies `LA/26-27/0873` on (99, then the Mango Drink's 52).
- Issued as the shop orders, dated then, with the Paperwork agent's PDF.

## The options

On one board in app v3, `SC-153 design review.html`, each the app on its stub with only its screens changed.

- **A · With each order (recommended):** the invoice opens in a sheet from the order it bills, for the kirana, each of
  the distributor's shops, and the register among his papers and in Priya's pack.
- **B · The bill book:** the kirana's Orders becomes Orders and bills, an order's page shows its invoice in full; the
  distributor's batch gains an Invoices tab; the register in the pack.
- **C · As PDFs:** each invoice named where its order is, as a PDF to download; nothing drawn in the app.

## The pick (10 Oct)

**Option A · With each order**, the recommended one: each invoice opens in a sheet from the order it bills (the kirana's
order page, each shop on the distributor's Orders), the batch's sales register among the distributor's papers and as one
card in Priya's pack, each number opening its invoice; the kirana's figures follow the invoice.

## The build (10–11 Oct)

- design3 first: `core/money.js` `kiranaInvoice`, each distributor's `series` in `data.js` and `world.js` `NUMBERS`,
  `core/ledger.js` (the history's invoices numbered as placed, the story's from the series' next, the shop's figures
  and the distributor's orders following them), `screens/finance.jsx` KiranaInvoice and KiranaRegister and the pack's
  card, `screens/trade.jsx` (the order page, the ordering screen, Orders, the shops, the batch's papers), `screens.css`.
  Stills in `build/`.
- core: `model.ts` `kiranaInvoice`, `journeyInvoices`, `invoicesOfCase`; `partners.ts`, `dist.ts`, `record.ts`; the
  screens; `screens.css` verbatim.
- backend-api, the agents and the live workspace: the invoice issued as the shop orders, its PDF laid out by Paperwork.
- Found on the way, fixed on SC-148: the Tally papers ran past their right edge on a phone. On the invoice, the
  discount, the taxes and the round-off became rows of their own, so a long label keeps its amount beside it; a narrow
  register leaves out the CGST and SGST columns.

