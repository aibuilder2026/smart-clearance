# SC-148 · GST papers · the decision

## The request (10 Oct)

- "Same for GST bills and invoices, they should be proper with GST number and realistic as much as possible."
- "I need you to update all images and invoices as needed for all past and present batches."

The carton labels, the request's first part, are SC-147.

## Today

- No GSTIN on the papers passes its check character: Munchly's `27AABCM1234F1Z5`, Rakesh Traders' `27AABCR1234F1Z5`,
  Agrawal Wholesale's `22AAGFA4821M1Z3`. Lakshmi Agencies, Patil Distributors and Gupta & Sons have none, so a history
  invoice with Lakshmi Agencies as seller prints "GSTIN undefined" (design3 `finance.jsx`).
- backend-api passes Paperwork the client as its name only (`steps.py`), so Munchly's own PDFs carry no GSTIN.
- The tax invoice lacks what CGST rule 46 asks: the seller's address and state code, the place of supply, reverse
  charge, the HSN summary, the amount in words, the signatory. The credit notes name no invoice they are against.

## In every option

- Valid, fictional GSTINs (`papers.py`, with `SC-147/codes/codes.py`'s `gstin`): every PAN's digits are 0000, which are
  never issued.

  | Party | GSTIN |
  | --- | --- |
  | Munchly Foods Ltd | `27AAKCM0000M1ZN` (CIN `L15400MH2011PLC000117`) |
  | Rakesh Traders | `27ABHPR0000K1ZW` |
  | Lakshmi Agencies | `36AAJFL0000L1ZM` |
  | Patil Distributors | `27AAKFP0000P1Z8` |
  | Gupta & Sons | `23AAHFG0000G1ZB` |
  | Agrawal Wholesale | `22AAGFA0000A1ZW` |

- Every paper of every batch (the tax invoices, the credit notes, the ITC memo, the destruction certificate, the
  receipts), in the app's sheet and Paperwork's PDF; then every PDF laid out again.
- The figures stay money.js's. A price-support credit note stays a financial note, not under section 34.
- A new fictional field: the invoice Munchly billed the batch to the distributor on (the chips: `MFL/26-27/02417`,
  21/05/2026), which each credit note is against.

## The options

On one board in app v3, `SC-148 design review.html`, each with the story's tax invoice and price-support credit note.

- **A · As Tally prints it:** Tally's tax invoice and the same layout for Munchly's credit note.
- **B · The e-invoice (recommended):** A, with the IRN (SHA-256, as the portal works it out), the acknowledgement and the
  signed QR code (its signature illustrative) on the tax invoice.
- **C · The app's paper, completed:** today's look, with every missing field added.

## Open question

Whether each kirana's order also gets its own tax invoice from the distributor (intra-state CGST and SGST), or stays an
order log on the scheme.

## The pick

Pending.
