# SC-147 · Carton labels · the decision

## The request (10 Oct)

With a photo of a real snack label for reference (ingredients, net weight and MRP, the packed date, batch and best
before, an EAN barcode, the FSSAI mark and licence number, the address and customer care, a storage line):

- "Food labels uploaded should have FSSAI approved bar code and QR code on the cartons. This should updated for all past
  batches and orders on Munchly."
- "I need you to update all images and invoices as needed for all past and present batches."

The GST bills and invoices, the request's second part, are SC-148.

## Today

Every label photo in Munchly's workspace reads five lines: the product, the batch, the made and best-before dates, the
MRP. No barcode, QR code, FSSAI licence or maker. The 12 history batches and the Masala Chips have one
(`design3/system/img/labels/`); the Mango Drink's journey uploads the Vision eval set's `mango.webp`.

## In every option

- The codes (`codes/codes.py`): the pack's GS1 EAN-13 or the carton's ITF-14, under GS1 India's 890 with a company number
  no business holds (8900000, an item number per SKU); the QR code is the batch's GS1 Digital Link on a reserved
  `.example` domain (GTIN, batch, best-before). Every code is read back from the finished photo with Chromium's
  BarcodeDetector (`codes/compose.mjs`), so nothing ships that does not scan.
- FSSAI does not issue barcodes: it asks for its logo and the maker's 14-digit licence on the label. The fssai mark is
  drawn here, not the authority's artwork. Munchly's licence is `10019022001234` (fictional, as in `data.js`).
- The batch, made date, best-before and MRP print as each batch's record has them, so Vision's check still matches.
- The label is printed onto a Qwen-Image base photo (`codes/gen.sh`, seeds 14701 and 14702) as ink: rendered at twice
  its size, multiplied into the print box with a light blur.

## The options

On one board in app v3, `SC-147 design review.html`.

- **A · The full statutory sticker (recommended):** the reference's layout, with the EAN-13, the QR code and the FSSAI
  licence; the batch and its dates boxed and large. Shown for the chips and the Mango Drink.
- **B · The printed shipper carton:** the carton printed in one colour with the ITF-14, the QR code and the FSSAI
  licence, the batch and its dates inkjet-coded.
- **C · Today's label with a coded foot:** today's five lines, and a foot with the EAN-13, the FSSAI licence and the QR
  code.

## The pick (10 Oct)

**Option A · The full statutory sticker**, on every label photo, past and present. The maintainer's answer on the eval
set: "Relabel all 73, everything in past and present to new format", so Vision's whole eval set, its hard cases
included, carries the new label too.
