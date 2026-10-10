# SC-139 · Destroyed at the godown · the decision

## The request (10 Oct)

- "Lets with 3 point B. Make sure the console client configuration reflects the same."
- "Required documentation like GST and invoice should reflect all the changes as needed. If chips are destroyed at go
  down, ask for a photo and supply chain will need to review and approve it before the entire deal closes, destruction
  certificate, credit note and other stuffs should be properly generated and validated and realistic as much as
  possible."
- "I want the destruction image to be done as much realistic as possible as it is done today, like landfill etc."

## Route B, in every option

- The client's expiry policy gains "Destroyed at the distributor's godown"; Munchly is set to it.
- On expiry day the distributor is asked for the destruction's evidence; Supply Chain approves it before the batch can
  close.
- Munchly issues a financial credit note (no GST): the dealer price, the input GST he reverses (grossed up) and the
  agency's charges. The chips' 144 packs: ₹3,168.00 + ₹158.40 + ₹216.00 = ₹3,542.40.
- The distributor reverses his input credit on the destroyed packs (s.17(5)(h), GSTR-3B Table 4(B)(1)); Munchly keeps
  its own (₹1,224) and its output tax on the sale stands.
- The agency issues the destruction certificate for the distributor: the batch, packs, kilos, the method (slit open
  and buried at the authorised municipal landfill), its authorisation, the evidence and who approved it.

## The options

On one board in app v3, `SC-139 design review.html`
([open](https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=SC-139+design+review.html)).

- **A · On Execution:** one photo; Priya approves in a card on the batch's Execution.
- **B · A second yes (recommended):** two photos (before at the godown with the batch label, after at the landfill with
  a slate), the agency's certificate number, Vision's checks, and Priya's yes in a sheet from the Command Center.
- **C · Witnessed:** a booked slot, Munchly's area sales manager witnesses and photographs; Priya approves after.

## The evidence photos

Qwen-Image renders (`evidence/`, with their sidecars): the packs in a crate at the godown with the carton's batch label,
and the packets slit open in a landfill pit with a JCB and a chalk slate reading "MF-2409-117 144 PKTS 03-10-26"
(picked from two seeds, after the maintainer asked for a destruction as it is done today).

## The pick (10 Oct)

- **Option B, A second yes.** Two photos (before at the godown with the batch label, after at the landfill with the
  slate) and the agency's certificate number; Vision checks them; Priya approves from the Command Center's sheet, and
  the batch closes only on that yes.
- **Route A** ("Taken back by Munchly", a GST credit note under s.34 against Munchly's invoice): offered in the console,
  built later.
- **The credit:** the dealer price, the input GST the distributor reverses (grossed up) and the agency's charges. The
  chips' 144 packs: ₹3,542.40.
- **The history:** "Do A, and for all other distributors of munchly too past destruction should have proper documents
  and pictures and approvals"; asked which, the maintainer chose **restate them under route B**. Munchly's three Q2
  batches left at a godown (Lakshmi Agencies' Masala Oats, 65 packs; Rakesh Traders' Mango Drink, 184, and Peanut
  Chikki, 132) are rebuilt as destroyed at their own distributor's godown, each with its before and after photos,
  Priya's approval on its day, the agency's certificate and the financial credit note.
- **If nothing comes in:** the distributor is asked again after two days, and the batch stays open until he sends it.

## The build (10 Oct)

Option B, built design3 first (`screens/trade.jsx` DestroyScreen, `screens/brand.jsx` DestructionCard and
DestructionSheet, `screens/finance.jsx` the godown papers, `core/money.js`, `core/flow.js`, `core/ledger.js`,
`console/console.jsx`), then ported to core, the console, the contract, backend-api and the agents. Stills of the
build are in `build/` (`shoot.mjs`, headless Playwright on the stub).

- **The distributor:** expiry day puts "Destroy N expired packs at your godown" on his Today, with Send the evidence.
  The screen asks for the two photos (take or upload), the agency from the client's list for his city, and its
  certificate number. Under Send it names the input GST he reverses in GSTR-3B. Sent, it reads "Sent for approval".
- **Priya:** the Command Center's primary action is Review the destruction. Its sheet shows both photos, Vision's
  checks, the agency on Munchly's list with its authorisation, and what her yes issues: the expiry credit note, the
  agency's certificate, and Munchly's input GST kept. Approve · issue the papers takes the design system's amber
  approve variant, as every yes does (DESIGN.md). Ask again takes a reason, and the distributor is asked again.
- **The papers:**
  - the Expiry credit note: three lines (the dealer price, the GST he reverses, the agency's charges), against the
    certificate;
  - the agency's Destruction certificate, for him: the batch, packs and kilos, the method, the authorisation, the
    evidence and who approved it, and the GST he reverses;
  - the ITC memo: the packs destroyed at his godown, as his stock.

  Paperwork lays out both papers as PDFs.
- **The console:** the client profile's fourth policy, "Destroyed at the distributor's godown". The Rules tab adds
  Destroyed at the godown: the photos asked for, Vision's check, the reviewer, the reminder, the gross-up, the charges a
  pack, and the agencies. "Taken back by the client" (route A) is shown as coming.
- **The history, restated:** Lakshmi Agencies' Masala Oats MF-2406-107 (65 packs, Deccan Green Waste Management
  DGW/DC/26-27/0085, CN/0111 ₹3,339.38), and Rakesh Traders' Mango Drink MF-2407-111 (184, Orange City Enviro Services
  OCE/DC/26-27/0217, CN/0115 ₹3,077.40) and Peanut Chikki MF-2407-116 (132, OCE/DC/26-27/0218, CN/0116 ₹2,692.80).
  Each has its two photos (`system/img/evidence/`, Qwen-Image, with sidecars), Priya's approval on its day, and Munchly's
  input GST kept.
- **Found on the way:**
  - the swing was a rupee off where the godown credit was rounded a pack at a time; `realised` now takes the
    settlement's own GST and charges;
  - "Rakesh Traders's" in two sentences; a possessive helper;
  - the review sheet's columns were too narrow at 1440 and its footer overflowed on phones; the sheet stacks, and the
    footer reverses into a column.
