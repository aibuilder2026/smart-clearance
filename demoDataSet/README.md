# Demo data set

The files you upload, sign with or read while you run Smart-Clearance's live journeys yourself. They are grouped by
journey, and numbered in the order you need them. [DEMO.md](../DEMO.md) walks through each journey step by step and
says which file to use at which step.

Every company, person, batch, number, label, barcode, receipt, photo and signature here is fictional, made for this
prototype. Each generated image has its `.prompt.json` sidecar beside it, giving the model, seed, prompt and
post-processing it was made with. The stamps and seals are drawn, so they have none.

These files are copies. The app, its seed data and its test suites read the originals, named in the tables below.

```text
demoDataSet/
├── 1-mango-drink-happy-path/           Munchly Mango Drink 200 ml · MF-2410-118 · Lakshmi Agencies, Hyderabad
│   ├── 1-label-photo/                  the carton label Vision reads: barcode, QR code, FSSAI licence
│   ├── 2-staff-sale-receipt/           the staff sale's consolidated UPI receipt
│   ├── 3-signatures-on-its-papers/     who signs and stamps the batch's papers
│   └── 4-if-packs-are-left/            evidence and signers, if packets stay at the godown
├── 2-masala-chips-sad-path/            Munchly Masala Chips 150 g · MF-2409-117 · Rakesh Traders, Nagpur
│   ├── 1-label-photo/                  the carton label, and two photos Vision should refuse
│   ├── 2-destruction-evidence/         before at the godown, after at the landfill: 540 packets
│   ├── 3-certificate-signatures/       the four who sign the certificate of destruction
│   └── 4-signatures-on-its-papers/     who signs and stamps the batch's other papers
└── 3-console-new-client/               a first stock export (DMS CSV) for the console
```

## 1. The happy path: the Mango Drink sells through

Batch MF-2410-118 of Munchly Mango Drink 200 ml: 2,000 packs at Lakshmi Agencies' Begum Bazaar godown, Hyderabad,
best before 24 Oct 2026. The plan sends it to the kiranas, a staff sale and a food bank.

| File | Use it when | Original |
| --- | --- | --- |
| `1-label-photo/MF-2410-118-label-photo.webp` | **Journey 1, step 1.** Lakshmi Agencies sends the carton label photo. Vision reads the batch, the MFG and best-before dates and the MRP, and matches them to the stock export. The full statutory sticker also carries the EAN-13 barcode, the batch's QR code and the FSSAI licence. | `design3/system/img/labels/MF-2410-118.webp` (the same file as `agents/evals/vision/images/mango.webp`) |
| `2-staff-sale-receipt/LA-SR-26-27-0002-staff-sale-receipt.webp` | **Journey 1, step 4.** Lakshmi Agencies records the staff sale. The receipt is LA/SR/26-27/0002: 18 staff payments by UPI reference, ₹1,200 for 150 packs at ₹8. Vision reads it, and the sale records only once the payments match the count. | `design3/system/img/receipts/MF-2410-118.webp` |
| `3-signatures-on-its-papers/` | **Journey 1, step 8.** You don't upload these: they are the signatures and stamps printed on the batch's papers and their PDFs. Vinod Patwardhan signs for Munchly Foods (the credit note, the GST memo, the FSSAI checklist), over its round seal. K. Lakshmi Narayana signs for Lakshmi Agencies (the staff sale receipt, the invoices to kiranas), over its stamp. The food bank's receipt is unsigned. | `design3/system/img/signatures/munchly.webp`, `lakshmi.webp`; `design3/system/img/seals/munchly.webp`, `lakshmi.webp` |
| `4-if-packs-are-left/1-before-at-begum-bazaar-godown-248-packs.webp`, `2-after-at-the-landfill-248-packs.webp` | **Journey 1, step 9, only if packets are left.** If you close the scheme before every packet is ordered, expiry day asks Lakshmi Agencies to destroy what is left, as in journey 2. This pair is made for 248 packets left. For any other count, Vision flags the count and the slate, and Priya still decides. | `design3/system/img/evidence/MF-2410-118-before.webp`, `-after.webp` |
| `4-if-packs-are-left/certificate-*.webp`, `deccan-green-waste-management-seal.webp` | **The same case.** The four who sign that certificate: M. Srinivas Reddy, Deccan Green Waste Management's supervising officer; the witnesses Syed Mujeeb and P. Anitha; and K. Lakshmi Narayana for Lakshmi Agencies. You draw or type them on the pad; these show how each signs. | `design3/system/img/signatures/dgw.webp`, `dgw-w1.webp`, `dgw-w2.webp`, `lakshmi.webp`; `design3/system/img/seals/dgw.webp` |

## 2. The sad path: the Masala Chips are destroyed at the godown

Batch MF-2409-117 of Munchly Masala Chips 150 g: 1,840 packs at Rakesh Traders' Kalamna Market godown, Nagpur, best
before 18 Nov 2026. The plan sends 772 packs to the ExpireSoon marketplace and 588 packets to Rakesh's 38 kiranas. In
this journey only two kiranas buy, so 540 packets stay at the godown and are destroyed against evidence.

| File | Use it when | Original |
| --- | --- | --- |
| `1-label-photo/MF-2409-117-label-photo.webp` | **Journey 2, step 1.** Rakesh sends the carton label photo, and Vision matches it to the stock export. | `design3/system/img/labels/MF-2409-117.webp` (the same file as `agents/evals/vision/images/story-clean.webp`) |
| `1-label-photo/try-a-bad-photo/wrong-batch-MF-2409-171.webp` | **Journey 2, step 1, optional, before the right photo.** A carton of batch MF-2409-171. Vision should read it and ask again: the batch is not MF-2409-117. | `agents/evals/vision/images/wrong-batch.webp` |
| `1-label-photo/try-a-bad-photo/batch-number-taped-over.webp` | **The same step, optional.** Tape over the batch number. Vision should ask again: the batch number could not be read. | `agents/evals/vision/images/story-tape.webp` |
| `2-destruction-evidence/1-before-at-kalamna-godown-540-packs.webp` | **Journey 2, step 8.** The "before" photo: five crates heaped with the chips at the godown, the carton labelled BATCH MF-2409-117 in view. Vision reads the batch and counts the packets (about 540). | `frontend/workspace/tests/journey/evidence/MF-2409-117-before-540.webp` |
| `2-destruction-evidence/2-after-at-the-landfill-540-packs.webp` | **Journey 2, step 8.** The "after" photo: the packets slit open in a landfill pit, with a slate reading MF-2409-117 · 540 PKTS · 03-10-26. Vision reads the slate and checks it is a landfill. | `frontend/workspace/tests/journey/evidence/MF-2409-117-after-540.webp` |
| `3-certificate-signatures/1-officer-sachin-bhoyar.webp` to `4-distributor-rakesh-jaiswal.webp` | **Journey 2, step 8.** The four who sign the certificate of destruction on Rakesh's screen: Sachin Bhoyar, Orange City Enviro Services' supervising officer; the witnesses Pradeep Meshram and Asha Kale; and Rakesh Jaiswal for Rakesh Traders. Draw each on the pad, copying these if you like, or type the name. | `design3/system/img/signatures/oce.webp`, `oce-w1.webp`, `oce-w2.webp`, `rakesh.webp` |
| `3-certificate-signatures/orange-city-enviro-services-seal.webp` | **Journey 2, step 10.** The agency's seal, printed beside its officer's signature on the certificate. | `design3/system/img/seals/oce.webp` |
| `4-signatures-on-its-papers/` | **Journey 2, step 10.** Printed on the batch's other papers. Vinod Patwardhan signs for Munchly Foods (the credit notes, the GST memo), over its seal. Rakesh Jaiswal signs for Rakesh Traders (the tax invoice, the invoices to kiranas), over his stamp. | `design3/system/img/signatures/munchly.webp`, `rakesh.webp`; `design3/system/img/seals/munchly.webp`, `rakesh.webp` |

The evidence is made for **540 packets left**: two kiranas order 24 packets each (48 of 588), and the ExpireSoon lot
is sold before the offer window closes. With that count Vision's four checks pass. With another count the count and
the slate checks fail, and Priya still decides.

## 3. The console: a new client's first stock export

| File | Use it when | Original |
| --- | --- | --- |
| `new-client_dms_export_2026-10-01.csv` | **The console, step 3, optional.** A new client's first stock export, in the Bizom-style layout distributors' DMS systems write: three fictional Coimbatore distributors, three SKUs, six batches. Upload it on the new client's Supply chain tab, and the Data agent maps its eight columns. A client you add stays on the platform. | the rows the Admin and console E2E suite writes (`frontend/workspace/tests/journey/admin-console.journey.ts`) |
| `munchly-foods_dms_export_2026-10-01.csv` | **For reference.** Munchly's own export on 1 Oct: its nine story batches as its distributors' closing stock. It is already mapped in Munchly's workspace, as Setup shows. | `design3/designs/SC-84/sample/dms_export_2026-10-01.csv` |

## How they were made

- **The label photos** come from the label maker, `design3/system/labels/` (`python3 design3/system/labels/make.py
  labels`). It prints each batch's statutory sticker onto a Qwen-Image photo of a blank label, then reads every barcode
  and QR code back. Vision's eval set is made by the same maker (`agents/evals/vision/plan.py`).
- **The staff sale's receipt** comes from the receipt maker, `node design3/system/receipts/make.mjs`. It prints the
  batch's own payments onto a Qwen-Image photo of a sheet on a desk.
- **The destruction's evidence** is Qwen-Image photos: one at the godown with the batch label in view, one at the
  landfill with a slate naming the batch, the count and the day.
- **The signatures** are Qwen-Image scans of each name in ballpoint, keyed to their ink
  (`python3 design3/system/signatures/make.py signatures`). The stamps and seals are drawn by
  `node design3/system/signatures/seals.mjs`.
