# Demo

How to try Smart-Clearance yourself. The **guided demo** plays the whole story in a browser, with no sign-in. The
**live apps** on Google Cloud let you drive two real journeys yourself: the agents run on Gemini, the pushes arrive,
and the papers come out as PDFs.

Every company, person, batch and figure is fictional. Munchly Foods is the story's client, an Indian snacks brand. Its
distributors hold two batches that won't sell before their best-before date.

- [Start here: the demo data set](#start-here-the-demo-data-set)
- [Pick a way in](#pick-a-way-in)
- [The guided demo, in five minutes](#the-guided-demo-in-five-minutes)
- [The live apps: before you start](#the-live-apps-before-you-start)
- [Get ready: one reset, both batches flagged](#get-ready-one-reset-both-batches-flagged)
- [Journey 1 · the happy path: the Mango Drink sells through](#journey-1--the-happy-path-the-mango-drink-sells-through)
- [Journey 2 · the sad path: the Masala Chips are destroyed against evidence](#journey-2--the-sad-path-the-masala-chips-are-destroyed-against-evidence)
- [The console: watch every client, set one up](#the-console-watch-every-client-set-one-up)
- [When you finish](#when-you-finish)
- [Known limits](#known-limits)

## Start here: the demo data set

[`demoDataSet/`](demoDataSet/) holds every file you upload while you drive the journeys, grouped by journey: the
label photos (with their barcodes and QR codes), the staff sale's UPI receipt, the photos at the godown and the
landfill, and the signatures. Download it, or open each file on GitHub as the steps ask for it.
[demoDataSet/README.md](demoDataSet/README.md) describes every file.

| File | Journey and step | Who uses it |
| --- | --- | --- |
| [`1-mango-drink-happy-path/1-label-photo/MF-2410-118-label-photo.webp`](demoDataSet/1-mango-drink-happy-path/1-label-photo/MF-2410-118-label-photo.webp) | Journey 1, step 1: the label photo | Lakshmi Agencies (distributor) |
| [`1-mango-drink-happy-path/2-staff-sale-receipt/LA-SR-26-27-0002-staff-sale-receipt.webp`](demoDataSet/1-mango-drink-happy-path/2-staff-sale-receipt/LA-SR-26-27-0002-staff-sale-receipt.webp) | Journey 1, step 4: the staff sale | Lakshmi Agencies |
| [`1-mango-drink-happy-path/4-if-packs-are-left/`](demoDataSet/1-mango-drink-happy-path/4-if-packs-are-left/) | Journey 1, step 9, only if packets are left at the godown | Lakshmi Agencies |
| [`2-masala-chips-sad-path/1-label-photo/MF-2409-117-label-photo.webp`](demoDataSet/2-masala-chips-sad-path/1-label-photo/MF-2409-117-label-photo.webp) | Journey 2, step 1: the label photo (`try-a-bad-photo/` first, if you like) | Rakesh Traders (distributor) |
| [`2-masala-chips-sad-path/2-destruction-evidence/`](demoDataSet/2-masala-chips-sad-path/2-destruction-evidence/) | Journey 2, step 8: the photos before and after | Rakesh Traders |
| [`2-masala-chips-sad-path/3-certificate-signatures/`](demoDataSet/2-masala-chips-sad-path/3-certificate-signatures/) | Journey 2, step 8: the four signatures on the certificate | Rakesh Traders' screen |
| [`3-console-new-client/new-client_dms_export_2026-10-01.csv`](demoDataSet/3-console-new-client/new-client_dms_export_2026-10-01.csv) | The console, step 3: a new client's first stock export | Neha (console) |

The `signatures-on-its-papers/` folders are for reading, not uploading: the signatures and stamps that every paper and
PDF of the batch prints.

## Pick a way in

| Way | Where | Sign-in | Time |
| --- | --- | --- | --- |
| **The guided demo** | [smartclearance-demo.web.app](https://smartclearance-demo.web.app) | none | 5 to 18 minutes |
| **The live apps** | the console, [smartclearance-console.web.app](https://smartclearance-console.web.app); Munchly's workspace, [munchly-smartclearance.web.app](https://munchly-smartclearance.web.app) | email and password | 20 to 30 minutes a journey |
| **The demo film** | Watch on [smartclearance.web.app](https://smartclearance.web.app), or [youtu.be/5Z9-32Fuwh4](https://youtu.be/5Z9-32Fuwh4) | none | 6 minutes |

The screenshots below are from the recorded runs of the two journeys and the console on production, on 13 Oct 2026.
Each is cropped to the screen of the person acting, on the device they used:

- Priya on a tablet held sideways;
- the distributor on a tablet held upright;
- everyone else on a phone;
- the console on a laptop.

On a computer the same screens are simply wider.

## The guided demo, in five minutes

<img src="docs/demo/guided-demo-route-map.webp" width="720" alt="The guided demo's route map: the platform's line, then the Masala Chips, the slow week and the Mango Drink branching from Munchly's workspace, with what each batch recovered">

The guided demo runs on sample data in your browser: nothing is called and nothing is kept, so there is nothing to
reset. Its route map has four lines: the platform's console, the Masala Chips selling through, the Mango Drink, and
the chips' slow week, which ends in a destruction at the godown on a second yes.

- **Play the whole route** rides it all. Each agent acts after a moment, and each person's move waits a little.
- **Next** (→) makes the current beat happen, and **Back** (←) goes one back. You can also act inside the devices, as
  each person would on their own phone.
- Keys **1** to **4** jump to a line, **M** opens the map, **P** shows the phone alone, and **N** hides the notes.
- **Five minutes:** press 2, pick **Approve** on the strip, then press → to the end. **The whole story:** about 18
  minutes.

## The live apps: before you start

### Who signs in where

The password for every account comes to judges with the submission. It is not in this repository. The workspace's
sign-in page lists the story's people under **People in the story**: click one to fill the email. Type the other
addresses.

| Person | Role | App | Email |
| --- | --- | --- | --- |
| **Neha Kulkarni** | Smart-Clearance staff, Super admin | console | `neha.kulkarni@smartclearance.example` |
| **Priya Deshmukh** | Munchly's supply chain operator: approves plans, reviews papers | workspace | `priya.deshmukh@munchly.example` |
| **Lakshmi Agencies** | Distributor, Hyderabad (journey 1) | workspace | `lakshmi-agencies@google.example` |
| **Rakesh Traders** (Rakesh bhai) | Distributor, Nagpur (journey 2) | workspace | `rakesh-traders@google.example` |
| **Sri Lakshmi Ganapathi Kirana**, **Al-Noor Provision Store** | Kiranas in Hyderabad (journey 1) | workspace | `sri-lakshmi-ganapathi-kirana@google.example`, `al-noor-provision-store@google.example` |
| **Shree Ganesh Kirana** (Ganesh ji), **Jai Durga Stores**, **Om Sai Provision** | Kiranas in Nagpur (journey 2) | workspace | `shree-ganesh-kirana@google.example`, `jai-durga-stores@google.example`, `om-sai-provision@google.example` |
| **Meera**, Feeding India | Food bank, Hyderabad (journey 1) | workspace | `feeding-india@google.example` |
| **Agrawal Wholesale** (Agrawal ji) | Buyer on the ExpireSoon marketplace, Raipur (journey 2) | workspace | `agrawal-wholesale@google.example` |

<img src="docs/demo/ready-1-workspace-sign-in.webp" width="190" alt="The workspace's sign-in on a phone, with the story's people as chips under the form"> <img src="docs/demo/ready-2-console-sign-in.webp" width="560" alt="The console's sign-in, with the agents at work behind the card">

The console's sign-in reads "name@smartclearance.com". Staff sign in on `smartclearance.example`, as in the table.

### Three browser sessions

Each person keeps their own sign-in, so use three:

1. **Your usual window: Priya**, on the workspace. Open **Neha's console** in another tab. It is a different site, so
   both stay signed in.
2. **A private (incognito) window: the distributor.** Lakshmi Agencies for journey 1, Rakesh Traders for journey 2.
   In Chrome all incognito windows share one session, so keep it to one person.
3. **A phone, or a second browser: everyone else, one at a time.** That's the kiranas, Meera and Agrawal Wholesale.
   Before the next person signs in, press your avatar (top right) to open **Profile**, then **Sign out**.

The first sign-in on a device opens on a splash, then on the notifications step. Press **Turn on notifications** to get
the pushes, or **Not now**.

Every date and time in the live apps is the story's own calendar. The batches' best-before dates are fixed, so the
journey starts on day 0, Friday 2 Oct 2026. A **Prototype time** note sits under each clock, and **How to reset or
fast-forward** opens the same steps as this guide.

## Get ready: one reset, both batches flagged

Do this once before journey 1 or 2. After it, both batches wait for their label photos, and you can run the two
journeys one after the other.

**G1. Neha resets the journey.** *Console.* Go to **Clients**, then **Munchly Foods**, then the **⋯** menu, then
**Reset journey…**. Choose **Rehearsal** (a journey day lasts an hour, as in the recordings), then press **Reset
journey**. The story starts again at day 0, 08:00, and Munchly's configuration and history are kept.

<img src="docs/demo/ready-3-reset-journey.webp" width="190" alt="Start Munchly Foods' journey again? with Real time, Rehearsal, Demo and Fast day lengths">

**G2. Priya confirms Setup.** *Your window.* Open **Setup**. The distributors' stock export is already mapped, 8 of 8
fields. Scroll down and press **Confirm and start watching**.

**G3. Rakesh gives his permission.** *Private window, as Rakesh Traders.* On **Today**, the card reads "Let
Smart-Clearance act for Rakesh Traders". Press **Allow**. Lakshmi Agencies has already allowed it in the story.

<img src="docs/demo/ready-4-setup.webp" width="460" alt="Setup: the stock export dms_export_2026-10-01.csv, every field mapped"> <img src="docs/demo/ready-5-permission.webp" width="260" alt="Rakesh's Today: Let Smart-Clearance act for Rakesh Traders, with Allow and Not now">

**G4. Neha runs the Watcher.** *Console.* In **Munchly Foods**, open **Agents**. Under **Watcher**, find **Daily check**
and press **Run now**. On Rehearsal, its own 09:00 check also comes about two and a half minutes after the reset.

**G5. Priya sees both batches at risk.** *Your window.* The **Command Center** flags two batches:

- the Mango Drink: 22 days left, −₹22,657 if destroyed;
- the Masala Chips: 47 days left, −₹26,330 if destroyed.

Each one waits for its label photo.

<img src="docs/demo/ready-6-run-the-watcher.webp" width="190" alt="The console on a phone: the Watcher's Daily check with Run now"> <img src="docs/demo/ready-7-both-flagged.webp" width="460" alt="Priya's Command Center: two flagged batches, the Masala Chips at risk, −₹26,330 if destroyed">

## Journey 1 · the happy path: the Mango Drink sells through

Batch MF-2410-118 of Munchly Mango Drink 200 ml: 2,000 packs at Lakshmi Agencies' Begum Bazaar godown in Hyderabad,
best before 24 Oct 2026. With 22 days left, the quick-commerce apps won't take it. So the agents plan three exits:

- the distributor's own kiranas, under a Hindi scheme;
- a staff sale;
- a food bank.

Priya gives one yes.

**1. Lakshmi Agencies sends the label photo.** *Private window, as Lakshmi Agencies.*

1. On **Today**, the Mango Drink's card asks for one photo of the carton label. Press **Open camera**.
2. Press **Upload a photo** and choose the file below, then press **Send photo**.

Vision (Gemini) reads the batch, both dates and the MRP, and matches them to the stock export: **Verified · matches
your records**.

> **Upload:** `demoDataSet/1-mango-drink-happy-path/1-label-photo/MF-2410-118-label-photo.webp`

<img src="docs/demo/mango-01-label-asked.webp" width="260" alt="Lakshmi Agencies' Today: Send one photo of the carton label, with Open camera"> <img src="docs/demo/mango-02-label-chosen.webp" width="260" alt="The label photo chosen, with Send photo"> <img src="docs/demo/mango-03-label-verified.webp" width="260" alt="Verified, matches your records: batch MF-2410-118, best before 24 Oct 2026, MRP ₹20">

**2. Priya approves the plan.** *Your window.*

1. Within a minute, the Command Center shows the plan: **₹16,917** recovered, ₹22,194 better than destroying the
   batch.
2. Press **Review and approve** to open the Route Room. The Valuer has priced every exit, the bin included, and the
   Router's split waits for a yes.
3. Press **Review and approve** again. The sheet lists the plan:
   - 1,372 packets to Lakshmi Agencies' 58 kiranas at ₹14.40, with 2 free with every 10;
   - 150 packs at the staff sale, at ₹8;
   - 58 packs to a food bank.
4. Press **Approve · release the agents**, then **Watch execution**.

<img src="docs/demo/mango-04-plan-ready.webp" width="460" alt="Command Center: the plan ready, ₹16,917 recovered, Review and approve"> <img src="docs/demo/mango-05-route-room.webp" width="460" alt="Route Room: five channels priced, the write-off included">

<img src="docs/demo/mango-06-approve.webp" width="460" alt="Approve the plan: ₹16,917, what happens the moment you tap, Approve · release the agents"> <img src="docs/demo/mango-07-execution.webp" width="460" alt="Execution: Outreach sent the Hindi scheme to 58 kiranas, its offer window open">

**3. Two kiranas order, live.** *Phone, as Sri Lakshmi Ganapathi Kirana, then Al-Noor Provision Store.*

1. Open the offer in **Offers**.
2. Press **ऑफर देखें** (see the offer). The count is the shop's share: 24 packets for the first shop, 28 for the
   second.
3. Press **ऑर्डर करें** (order), which shows the count. The shop sees its margin.

Each order lands on Priya's Execution within seconds. Each has its own GST tax invoice from Lakshmi Agencies.

<img src="docs/demo/mango-08-kirana-offer.webp" width="190" alt="The kirana's offer in Hindi: ₹14.40 a packet, 24 packets, the order button"> <img src="docs/demo/mango-09-kirana-ordered.webp" width="190" alt="Order placed: 24 packets, ₹302 on delivery, a ₹178 margin"> <img src="docs/demo/mango-10-order-live.webp" width="460" alt="Priya's Execution: 1 of 58 kiranas ordered, 24 packets, as it lands">

The scheme went to 58 shops, and no shop may order more than 4 times its own 14-day sales. So it fills only when most
of them order. In the recording, the other 50 ordered through the API as themselves, which you can't do from the app.
On your own, carry on: the staff sale and the donation don't wait for the scheme.

**4. Lakshmi Agencies records the staff sale.** *Private window.*

1. On **Today**, press **Record what sold**.
2. The staff sale card on **Deliveries** shows the UPI code staff pay to, and the count: 150 packs.
3. Under **Consolidated receipt**, press **Upload** and choose the receipt below.

Vision reads its 18 UPI payments, ₹1,200, and checks them against 150 × ₹8: **matches your count**. Press **Record the
sale**. Priya sees the receipt on Execution, every UPI reference with it.

> **Upload:** `demoDataSet/1-mango-drink-happy-path/2-staff-sale-receipt/LA-SR-26-27-0002-staff-sale-receipt.webp`

<img src="docs/demo/mango-11-staff-sale.webp" width="260" alt="The staff sale: the UPI code, 150 of 150 packs, Consolidated receipt with Take a photo and Upload"> <img src="docs/demo/mango-12-receipt-matched.webp" width="260" alt="Vision read LA/SR/26-27/0002: 18 UPI payments, ₹1,200, 150 packs × ₹8 matches your count"> <img src="docs/demo/mango-13-receipt-on-execution.webp" width="460" alt="Priya's Execution: the staff sale recorded, with the receipt's 18 UPI references">

**5. Feeding India collects the donation.** *Phone, as Meera.*

1. **Pickups** shows the request: 58 packs of Mango Drink, with the FSSAI checklist.
2. Press **Confirm** with its day and time, then **Mark collected**.

The app issues Feeding India's donation receipt, FI/HYD/26-27/0417 (58 packs, 58 meals). Press **View** to read it.

<img src="docs/demo/mango-14-pickup.webp" width="190" alt="Meera's Pickups: 58 packs of Mango Drink, pickup Saturday 10 am"> <img src="docs/demo/mango-15-donation-receipt.webp" width="190" alt="Pickup collected: donation receipt FI/HYD/26-27/0417, 58 packs, 58 meals">

**6. Neha closes the offer window.** *Console.* Do this once you've seen your orders land.

1. Under **Agents**, find **Outreach**. On its row **Offer window closes · MF-2410-118**, press **Close now**.
2. Confirm with **Close now**.

Every line is now done, so the Paperwork agent drafts the batch's papers. In the recording the scheme filled before
its window closed, so nothing was left. With only your orders, the packets no shop took stay at Lakshmi Agencies'
godown (step 9).

**7. Lakshmi Agencies runs the van round.** *Private window.* On **Today**, press **Start the round**. The van delivers
every shop that ordered.

<img src="docs/demo/mango-16-van-round.webp" width="260" alt="Lakshmi Agencies' Today: Run the Saturday van round, with Start the round">

**8. Priya reviews the papers.** *Your window.* Open the batch's **Paperwork** tab. Each paper opens with **Download
PDF**, signed and stamped (see `3-signatures-on-its-papers/`):

- the price-support credit note CN/0117;
- the staff sale receipt;
- the donation receipt;
- the GST ITC memo;
- the FSSAI checklist;
- a tax invoice for every kirana order.

Press **Mark reviewed**.

<img src="docs/demo/mango-17-paper.webp" width="460" alt="Paperwork: the price-support credit note CN/0117, signed for Munchly Foods, and Who keeps what"> <img src="docs/demo/mango-18-reviewed.webp" width="460" alt="Paperwork: the document pack reviewed">

**9. Neha calls expiry day.** *Console.* Under **Agents**, find **Impact**. On its row **Expiry day · report ·
MF-2410-118**, press **Report now**, then confirm with **Report now**. Impact posts the ledger, and the batch clears.

If packets are left at the godown, expiry day first asks Lakshmi Agencies to destroy them against evidence. That's
journey 2's steps 8 and 9, with Deccan Green Waste Management as the agency.

> **Upload, only if packets are left:** the pair in `demoDataSet/1-mango-drink-happy-path/4-if-packs-are-left/`. It is
> made for 248 packets left, so for any other count Vision flags the count and the slate, and Priya still decides.

<img src="docs/demo/mango-19-report-now.webp" width="190" alt="Expire it and report now? with Report now">

**10. Priya reads the ledger, the impact and the swing.** *Your window.*

- The **Ledger** reads the year so far three ways: **Money**, **GST** (the input credit kept and reversed) and
  **Impact** (kilos kept out of landfill, CO₂e, meals).
- On the batch's page, **How it adds up** works out the swing: ₹22,194.30 better than the bin, line by line.

<img src="docs/demo/mango-20-ledger.webp" width="460" alt="Ledger: ₹2.37 lakh recovered this year, batch by batch"> <img src="docs/demo/mango-21-impact.webp" width="460" alt="Impact: 2.30 t kept out of landfill, 68 kg destroyed, 5.75 t CO₂e avoided">

<img src="docs/demo/mango-23-swing.webp" width="460" alt="How the swing adds up: ₹22,194.30, the bridge from the bin's P&L to the plan's">

**11. Lakshmi Agencies ends whole.** *Private window.* Open **Batches**, then the Mango Drink.

- **Money** shows it ends at ₹0, neither gaining nor losing.
- **Papers** holds its credit note, staff sale receipt and invoices.
- **Photos** shows the label photo, with what Vision read from it.

<img src="docs/demo/mango-22-ends-whole.webp" width="260" alt="Lakshmi Agencies' Money: you end whole, ₹0">

## Journey 2 · the sad path: the Masala Chips are destroyed against evidence

Batch MF-2409-117 of Munchly Masala Chips 150 g: 1,840 packs at Rakesh Traders' Kalamna Market godown in Nagpur, best
before 18 Nov 2026. The plan has two lines: 772 packs on the ExpireSoon marketplace and 588 packets to Rakesh's 38
kiranas. This time only two kiranas buy, so 540 packets are left. On expiry day they're destroyed at an authorised
landfill, against photos, a signed certificate and Priya's second yes.

**1. Rakesh sends the label photo.** *Private window, as Rakesh Traders.* As in journey 1: on **Today**, press **Open
camera**, then **Upload a photo**, then **Send photo**.

> **Upload:** `demoDataSet/2-masala-chips-sad-path/1-label-photo/MF-2409-117-label-photo.webp`
>
> **Optional, first:** send `try-a-bad-photo/wrong-batch-MF-2409-171.webp` or `batch-number-taped-over.webp`. Vision
> should ask for another photo and say why. Then send the right one.

<img src="docs/demo/chips-01-label-chosen.webp" width="260" alt="Rakesh's label photo chosen: Munchly Masala Chips, batch MF-2409-117, with its barcode and QR code"> <img src="docs/demo/chips-02-label-verified.webp" width="260" alt="Verified: batch MF-2409-117, best before 18 Nov 2026, MRP ₹30">

**2. Priya approves the plan.** *Your window.* The plan is ₹21,770, ₹26,340 better than the bin.

- The Lister posts 772 packs on ExpireSoon at ₹15. Munchly's reserve, ₹13.50, is never shown to buyers.
- Outreach sends 588 packets to 38 kiranas at ₹21.60, with 2 free with every 10.

As in journey 1, press **Review and approve** on the Command Center, then again in the Route Room. Then press
**Approve · release the agents**.

<img src="docs/demo/chips-03-approve.webp" width="460" alt="Approve the plan: ₹21,770, the ExpireSoon lot and the kirana scheme">

**3. Two kiranas order 24 packets each, and a third says no.** *Phone.*

1. As **Shree Ganesh Kirana**, then as **Jai Durga Stores**: open **Offers**, press **ऑफर देखें**, keep 24 packets,
   and press **ऑर्डर करें · 24 packets**.
2. As **Om Sai Provision**: press **Not this time**.

Order exactly 48 packets in all. That leaves 540 at the godown, the count the evidence photos are made for.

<img src="docs/demo/chips-04-kirana-offer.webp" width="190" alt="Shree Ganesh Kirana's Offers: the Hindi offer, ₹21.60 a packet, with Not this time"> <img src="docs/demo/chips-05-kirana-order.webp" width="190" alt="24 packets, ₹454 to pay, a ₹266 margin, the order button"> <img src="docs/demo/chips-07-not-this-time.webp" width="190" alt="Om Sai Provision: You said not this time, with Order after all">

<img src="docs/demo/chips-06-order-live.webp" width="460" alt="Priya's Execution: the ExpireSoon lot live, 1 of 38 kiranas ordered">

**4. Agrawal Wholesale wins the ExpireSoon lot.** *Phone, as Agrawal Wholesale.*

1. Open lot ES-24117 in **Market**.
2. Under **Place a bid**, keep ₹13.00 and press **Bid ₹13.00 for 772**.
3. The Negotiator agent counters at ₹14.20, never below the reserve. Press **Accept ₹14.20 · pay ₹1,644 token**.

Priya's Execution shows the lot won.

<img src="docs/demo/chips-08-bid.webp" width="190" alt="Lot ES-24117: Place a bid, ₹13.00, Bid ₹13.00 for 772"> <img src="docs/demo/chips-09-counter.webp" width="190" alt="Countered at ₹14.20: Accept ₹14.20 · pay ₹1,644 token, and the Negotiator's reply"> <img src="docs/demo/chips-10-lot-won.webp" width="460" alt="Priya's Execution: the lot won by Agrawal Wholesale at ₹14.20">

**5. Neha closes the offer window, after the lot is won.** *Console.*

1. Under **Agents**, find **Outreach**. On its row **Offer window closes · MF-2409-117**, press **Close now**.
2. Confirm with **Close now**.

The 540 packets no shop ordered stay at Kalamna Market godown.

Close the window after Agrawal accepts. While the lot is still open, closing the window moves the unordered packets
onto it. Then nothing is left to destroy.

<img src="docs/demo/chips-11-close-window.webp" width="190" alt="Close the offer window now? with Close now"> <img src="docs/demo/chips-12-left-at-godown.webp" width="460" alt="Execution: the window ended with 2 of 38 shops ordering 48, the 540 left at Rakesh Traders' godown">

**6. Rakesh loads the truck, issues the invoice and runs the van.** *Private window.*

1. On **Deliveries**, press **Load the buyer's truck**.
2. On **Orders**, press **Issue from Tally** for invoice INV/26-27/0931, which carries its e-invoice.
3. On **Today**, press **Start the round** for the two shops.

<img src="docs/demo/chips-13-truck.webp" width="260" alt="Deliveries: the buyer's truck, Load the buyer's truck"> <img src="docs/demo/chips-14-tally.webp" width="260" alt="Orders: the lot's invoice INV/26-27/0931 drafted, Issue from Tally"> <img src="docs/demo/chips-15-van-round.webp" width="260" alt="The Saturday van round delivered: 2 shops, 48 packets">

**7. Neha calls expiry day.** *Console.* Under **Agents**, find **Impact**. On its row **Expiry day · report ·
MF-2409-117**, press **Report now**, then confirm with **Report now**. The 540 packets have expired. Munchly's
policy is that they are destroyed at the distributor's godown, so Rakesh is asked for the evidence.

<img src="docs/demo/chips-16-report-now.webp" width="190" alt="Expire it and report now? with Report now">

**8. Rakesh destroys the packets against evidence.** *Private window.* On **Today**, the card reads "Destroy 540
expired packs at your godown". Press **Send the evidence**.

1. **Before:** press **Upload** and choose the godown photo.
2. **After:** press **Upload** and choose the landfill photo.
3. **Agency:** Orange City Enviro Services. In **Agency's certificate number**, type `OCE/DC/26-27/0219` (any 4 to 40
   characters will do).
4. **Destroyed from**, **To** and the **two independent witnesses** come filled in.
5. **Sign the certificate.** It has four **Sign here** places:
   - Sachin Bhoyar, the agency's supervising officer;
   - Pradeep Meshram, witness;
   - Asha Kale, witness;
   - Rakesh Jaiswal, for Rakesh Traders.

   For each, draw a signature on the pad (the specimens show how each one signs), or press **Type the name instead**
   and type the name the sheet shows. The counter reads **4 of 4 signed**.
6. Press **Send to Munchly for approval**.

Vision then checks four things:

- the batch on the carton label;
- about 540 packs in view;
- the slate reads MF-2409-117 · 540;
- the after photo shows a landfill.

> **Upload:** `demoDataSet/2-masala-chips-sad-path/2-destruction-evidence/1-before-at-kalamna-godown-540-packs.webp`
> (before) and `2-after-at-the-landfill-540-packs.webp` (after)
>
> **Sign:** the four specimens in `demoDataSet/2-masala-chips-sad-path/3-certificate-signatures/`

<img src="docs/demo/chips-17-destroy-asked.webp" width="260" alt="Rakesh's Today: Destroy 540 expired packs at your godown, Send the evidence"> <img src="docs/demo/chips-18-evidence-empty.webp" width="260" alt="Destroy expired packs: Take or Upload for each photo, the agency, the certificate number, the window and the witnesses"> <img src="docs/demo/chips-19-evidence-sent.webp" width="260" alt="Both photos uploaded, Orange City Enviro Services, certificate OCE/DC/26-27/0219">

<img src="docs/demo/chips-20-sign.webp" width="260" alt="Sign the certificate: the certificate of destruction signed by the officer, both witnesses and Rakesh, 4 of 4 signed, Send to Munchly for approval"> <img src="docs/demo/chips-21-sent.webp" width="260" alt="Sent for approval: Priya at Munchly is reviewing your evidence">

**9. Priya gives the second yes.** *Your window.*

1. On **Execution**, the **Destruction at the godown** card waits for her. Press **Review and approve**.
2. The sheet shows both photos, Vision's checks one by one, the agency on Munchly's list, and the certificate as
   signed.
3. Press **Approve · issue the papers**. Press **Ask again** instead to send the evidence back with a reason.

On her yes, Impact issues:

- the Expiry credit note CN/0118, ₹13,284: the dealer price, the GST Rakesh reverses, and the agency's charges;
- the certificate OCE/DC/26-27/0219.

The chips clear.

<img src="docs/demo/chips-22-review.webp" width="460" alt="Approve the destruction: Vision's checks passed, the expiry credit note on her yes, Approve · issue the papers"> <img src="docs/demo/chips-23-settled.webp" width="460" alt="Execution: the expiry settlement, ₹13,284 credited to Rakesh Traders, the destruction approved">

**10. The papers.** *Your window.* On the batch's **Paperwork**, each paper has its **Download PDF**:

- the certificate of destruction: page 1 with the four signatures and the agency's seal, page 2 the destruction log;
- the Expiry credit note CN/0118;
- the tax invoice INV/26-27/0931, with its e-invoice (IRN and signed QR code);
- the price-support credit note CN/0117;
- the GST ITC memo;
- the two kiranas' tax invoices.

<img src="docs/demo/chips-24-certificate.webp" width="460" alt="The certificate of destruction OCE/DC/26-27/0219: 540 packs, 86.4 kg, the facility, the date and time, signed at the facility"> <img src="docs/demo/chips-25-credit-note.webp" width="460" alt="The Expiry credit note CN/0118: 540 packs at ₹22, the GST reversed, the agency's charges, ₹13,284, signed for Munchly Foods">

<img src="docs/demo/chips-26-tax-invoice.webp" width="460" alt="Rakesh Traders' tax invoice INV/26-27/0931 with its e-invoice: IRN, acknowledgement and signed QR code">

**11. Rakesh ends whole, and a kirana reads its invoice.**

- *Private window.* On **Batches**, open the Masala Chips. **Money** ends at ₹0, the expiry credit included.
  **Photos** shows every photo he sent, with what Vision read from each.
- *Phone, as Shree Ganesh Kirana.* **Orders** shows his order and its tax invoice, RT/26-27/1279: ₹454, GST included.

<img src="docs/demo/chips-27-ends-whole.webp" width="260" alt="Rakesh's Money: from 2 kiranas, from Agrawal Wholesale, both credit notes; you end whole, ₹0"> <img src="docs/demo/chips-28-photos.webp" width="260" alt="Rakesh's Photos: the label, before at the godown and after at the landfill, each with what Vision read"> <img src="docs/demo/chips-29-kirana-invoice.webp" width="190" alt="Shree Ganesh Kirana's order: 24 packets, ₹454 paid, tax invoice RT/26-27/1279">

**12. The swing.** *Your window.* Even with 540 packets destroyed, the plan left Munchly ₹14,868 better off than the
bin. **How it adds up** on the batch's page works it out line by line. The Ledger's GST and Impact readings count the
kilos destroyed beside the kilos saved.

<img src="docs/demo/chips-30-swing.webp" width="460" alt="How the swing adds up: ₹14,868 better than destroying the batch">

## The console: watch every client, set one up

Neha runs Smart-Clearance itself from the console: every client, every agent, every batch in flight. Sign in as Neha.
Nothing here changes Munchly's journey, except step 3 when you add a new client.

**1. The Overview.** The figures across every client are read again every 30 seconds:

- what was recovered;
- the batches in flight;
- the batches waiting for a yes;
- the agent runs today.

**Agents at work** shows each batch at its stop. **Food, by day** shows the kilos kept out of landfill and the kilos
destroyed.

<img src="docs/demo/console-1-overview.webp" width="560" alt="The console's Overview: ₹64,79,201 recovered in 30 days, 39 batches in flight, 12 waiting for a yes, Agents at work">

**2. Clients.** The clients list shows every client with its workspace address, plan and status. **New client** sets one
up in seven steps, often from a **Book a demo** request on the landing page.

<img src="docs/demo/console-2-clients.webp" width="560" alt="Clients: every manufacturer's workspace, with New client">

**3. A new client's first stock export, optional.** At the end of **New client**, the client opens on its **Supply
chain** tab. Under **First stock export**, upload the CSV below. The Data agent maps its columns to Smart-Clearance's
fields, and brings in the client's distributors, SKUs and batches. A client you add stays on the platform.

> **Upload:** `demoDataSet/3-console-new-client/new-client_dms_export_2026-10-01.csv`

<img src="docs/demo/console-3-first-export.webp" width="560" alt="A client's first stock export: every field mapped by the Data agent, and its supply chain">

**4. Quick-commerce gates by SKU and batch.** In **Munchly Foods**, **Supply chain** lists every SKU with its Blinkit and
Zepto/Instamart gates. Open a SKU to give it its own gates, or to override them for one batch, with a reason. Each
change writes its audit line.

<img src="docs/demo/console-4-sku-gates.webp" width="560" alt="The Mango Drink's own gates: Blinkit 45 days, Zepto and Instamart 50% of life, its batch checked against them">

**5. A client's agents.** **Agents** lists the client's agents, from the Data agent to Impact, with the approval among
them. For each agent you can set:

- **Suggest**, **Ask** or **Act**;
- its settings, such as the Watcher's gates or the Negotiator's floor.

The approval is always on. On a live client, the same tab holds the journey's controls you used above: **Run now**,
**Close now** and **Report now**.

<img src="docs/demo/console-5-agents.webp" width="560" alt="A client's agents: each with Suggest, Ask or Act, the Watcher's settings saved">

## When you finish

- **Leave it for the next person.** In the console, open the journey-day badge in Munchly Foods' header and set it back
  to **Real time**. Or press **Reset journey…** with Real time.
- **Reset journey puts back:**
  - the clock, to day 0, 08:00;
  - the two batches, back at day 0;
  - the people, as the story has them;
  - the papers' numbering;
  - the story's stock export, mapped, with Setup waiting for Priya's confirmation.

  Earlier cases close as reset; nothing is deleted.
- **It keeps:**
  - Munchly's configuration: gates, overrides, guardrails, the agents' settings, the expiry policy;
  - the audit log;
  - the accounts;
  - the pilot quarter's 12 cleared batches, with their papers and photos.

  You can browse those batches at any time, without running a journey. As Priya, open **Batches** and scroll past the
  batches in view, or open the **Ledger**.

## Known limits

- **One workspace for everyone.** Production holds one Munchly workspace. If someone else is mid-journey, finish theirs
  or reset it, and the reset restarts it for everyone.
- **The kiranas order by hand.** Each shop is capped, so the Mango Drink's scheme fills only when most of its 58 shops
  order. Alone, you'll order as a few shops and close the window (journey 1, steps 3 and 6).
- **Your figures may differ.** Every figure is worked out live: the plan from the days left, the money from what each
  exit took. Run soon after a reset on Rehearsal, the journeys match the recordings.
- **What is mocked:** ExpireSoon, the food banks' systems, Tally and the distributors' stock exports. The pushes, the
  papers and their PDFs, the photos and Gemini are real.
- **Cold starts:** the API on Cloud Run scales to zero, so the first request after a quiet spell can wait a few seconds.
- **Retries:** the agents' Pro model is a preview with a tight quota, so a step can take a few seconds longer while a
  call retries.

For running the journeys as recorded test suites, see [TESTING.md](TESTING.md). The figures come from the Journey Map,
`docs/dobara-journey-map.html`.
