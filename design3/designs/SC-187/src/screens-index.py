"""SC-187: writes screens.md, one line per capture in screens/ (what it shows), from the table below. Run after the walk:
  python3 screens-index.py
"""

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCREENS = HERE / "screens"

WHAT = {
    # quiet: the morning before any batch is flagged (Setup confirmed, the permissions given)
    "quiet--neha-console-overview": "Neha, console Overview: the figures, Recovered and Food by day, Agents at work, every client's batches",
    "quiet--neha-console-clients": "Neha, console Clients: the seven clients, Munchly Foods live",
    "quiet--neha-console-munchly-supply": "Neha, Munchly's Supply chain tab: the client's head with the journey-day badge, the first stock export mapped, distributors, SKUs and batches (taken after the journey, at Real time)",
    "extra--demo-route-map": "Placed by another SC-187 session, not this walk: the guided demo's route map",
    "extra--landing-hero": "Placed by another SC-187 session, not this walk: the landing page's hero",
    "quiet--neha-console-munchly-agents": "Neha, Munchly's Agents tab: the client's head with the journey-day badge (Real time), the nine stops with their triggers (Run now); the full copy was re-taken after the journey, with the whole pipeline",
    "quiet--neha-console-agents": "Neha, console Agents: the platform's agent pipeline",
    "quiet--priya-command": "Priya, Command Center, quiet: nothing at risk, the watchlist with both batches gated, the Impact card",
    "quiet--signin": "The workspace's live sign-in screen, Munchly's branding, email and password, the people in the story",
    "quiet--signin-phone": "The same sign-in on a phone",
    # detect: the Watcher flagged both batches; Vision asked each distributor for the label photo
    "detect--priya-command": "Priya, Command Center: both batches flagged, the Watcher's and Vision's activity",
    "detect--priya-command-phone": "The same on a phone",
    "detect--priya-journey-chips": "Priya, the chips' Journey page: 47 days left, −₹26,330 if destroyed, 1,360 units at risk, the tracker at Verify, the agent activity, the Nagpur cluster",
    "detect--priya-journey-mango": "Priya, the Mango Drink's Journey page, flagged",
    "detect--rakesh-today-phone": "Rakesh, Today on his phone: the chips in a journey, one photo of the carton label asked for",
    "detect--lakshmi-today-phone": "Lakshmi Agencies, Today on her phone: the Mango Drink's label photo asked for",
    # plan: both labels read, both batches priced and planned
    "plan--priya-route-chips": "Priya, the chips' Route Room: Vision's read of the label (batch, dates, MRP, the match), the five channels priced, the Router's split (588 kirana, 784 ExpireSoon) with its reasons, if destroyed vs if routed, the agent timeline",
    "plan--priya-route-mango": "Priya, the Mango Drink's Route Room: 1,372 to the kiranas, 150 staff, 86 to the food bank",
    "plan--priya-approve-sheet": "Priya, the approve sheet open on the chips' plan: ₹21,950 net, what happens on the tap, Approve · release the agents, Reject the plan, Not now",
    "plan--priya-approve-sheet-phone": "The approve sheet on a phone",
    "plan--rakesh-photo-done": "Rakesh, Label photo right after Vision's read: Verified · matches your records, Done, Dhanyavaad (taken at the plan stage)",
    "plan--rakesh-photo-done-phone": "The same on a phone",
    "plan--rakesh-photos": "Rakesh, Label photo: no photo asked for now, then Earlier label photos: every photo he sent with what Vision read (the chips: made 18 May 2026, best before 18 Nov 2026, MRP ₹30, verified); taken after the journey",
    "plan--rakesh-photos-phone": "The same on a phone",
    # approve: the yes; the Lister listed, Outreach sent the schemes, Donation booked Feeding India
    "approve--priya-execution-chips": "Priya, the chips' Execution: the ExpireSoon lot listed (as buyers see it, the reserve, the hidden territories, its stops), the kirana scheme open (as the shops see it, 0 of 38, the 48-hour window, the cluster map), the Negotiator waiting",
    "approve--priya-execution-mango": "Priya, the Mango Drink's Execution: the scheme to 58 kiranas, the staff sale, Feeding India booked",
    "approve--rakesh-today-phone": "Rakesh, Today on his phone: the plan told, Smart-Clearance acts for you with Pause",
    "approve--lakshmi-today": "Lakshmi Agencies, the Mango Drink's deliveries with the Staff sale card open: 150 packs at ₹8, her UPI code, the consolidated receipt to attach",
    "approve--lakshmi-today-phone": "Lakshmi Agencies, Today on her phone",
    "approve--kirana-ganesh-offer-phone": "Ganesh ji (Shree Ganesh Kirana), the Hindi offer on his phone: ₹21.60 a packet, 10 लो 2 मुफ़्त, 48 hours, how many packets, the invoice figures",
    "approve--kirana-hyd-offer-phone": "Sri Lakshmi Ganapathi Kirana, the Mango Drink's Hindi offer on a phone",
    "approve--agrawal-market": "Agrawal Wholesale, the ExpireSoon marketplace: the chips lot",
    "approve--agrawal-listing": "Agrawal Wholesale, lot ES-24117: 784 units at ₹15, the label photo verified, Place a bid (₹13), Chat with the seller",
    "approve--meera-pickups": "Meera, Feeding India's pickups: the Donation agent's request, 86 packs of Mango Drink, Confirm",
    "approve--meera-pickups-phone": "The same on a phone",
    # orders: every ordering kirana ordered (31 of 38 ordered 588; 52 ordered 1,372)
    "orders--kirana-ganesh-offer-ordered-phone": "Ganesh ji, his order placed: ऑर्डर हो गया, 24 packets, on the round",
    "orders--kirana-ganesh-orders-phone": "Ganesh ji, Orders: his order with its margin and tax invoice RT/26-27/1279",
    "orders--kirana-ganesh-order-page-phone": "Ganesh ji, the order's page: before GST, GST, you paid, your margin, the tax invoice",
    "orders--kirana-ganesh-invoice-phone": "Ganesh ji, the tax invoice RT/26-27/1279 in its sheet (Tally's layout, signed)",
    "orders--priya-execution-chips": "Priya, the chips' Execution: the scheme filled, 31 of 38 ordered 588, its stops, the cluster map, the latest orders",
    "orders--priya-execution-mango": "Priya, the Mango Drink's Execution with the scheme filled (52 of 58, 1,372)",
    "orders--rakesh-orders": "Rakesh, Orders: the scheme's orders shop by shop, each with its invoice, the GST he collected",
    # deal: Agrawal bid ₹13, the Negotiator countered ₹14.20, the counter taken
    "deal--agrawal-listing-won": "Agrawal Wholesale, Lot won at ₹14.20: the Lot won bill (784 × ₹14.20, IGST, the total), the chat with the Negotiator's counter",
    "deal--priya-execution-chips": "Priya, the chips' Execution: the ExpireSoon card won (Listed, Bid, Won), the scheme filled",
    "deal--rakesh-deliveries": "Rakesh, Deliveries: the buyer's truck line (Agrawal, ₹14.20, the token, the balance), the van round waiting for the papers",
    # donation: the staff sale recorded on its receipt, Meera collected
    "donation--lakshmi-today": "Lakshmi Agencies, Today: the staff sale recorded (150 packs) on the receipt Vision read (18 UPI payments, ₹1,200), the pickup collected",
    "donation--lakshmi-today-phone": "The same on a phone",
    "donation--priya-execution-mango": "Priya, the Mango Drink's Execution: the staff-sale card with Vision's read of the receipt, the food-bank line collected",
    "donation--meera-pickups": "Meera, Pickups: the Mango Drink collected, its receipt FI/HYD/26-27/0417, 872 meals since July",
    "donation--meera-pickups-phone": "The same on a phone",
    "donation--meera-pickup-page": "Meera, the pickup's page: its tracker (requested, confirmed, collected, served), the receipt, the FSSAI checklist",
    "donation--meera-receipt-sheet": "Meera, the Donation receipt FI/HYD/26-27/0417 in its sheet: 86 packs, 18.5 kg, 86 meals, Download the PDF",
    # settle: the truck loaded, both packs drafted
    "settle--priya-paperwork-chips": "Priya, the chips' Paperwork: the pack drafted (tax invoice, e-way check, credit note, ITC memo, FSSAI not required, destruction not required, the kirana invoices)",
    "settle--paper-chips-invoice-draft": "The chips' tax invoice INV/26-27/0931 as a draft, in Tally's layout (the parties' GSTINs, the lot, IGST, the words)",
    "settle--paper-chips-credit-note": "The chips' price-support credit note CN/0118 (Munchly to Rakesh Traders, against the dispatch invoice)",
    "settle--paper-chips-itc-memo": "The chips' GST ITC memo: input credit kept on every pack sold, s.17(5)(h)",
    "settle--paper-chips-kirana-register": "The chips' sales register: one tax invoice for every kirana order",
    "settle--priya-paperwork-mango": "Priya, the Mango Drink's Paperwork: the pack drafted",
    "settle--paper-mango-credit-note": "The Mango Drink's price-support credit note CN/0117",
    "settle--paper-mango-itc-memo": "The Mango Drink's GST ITC memo: credit kept on the packs sold, reversed on the 86 given away",
    "settle--paper-mango-fssai": "The Mango Drink's FSSAI surplus-food checklist, 86 units",
    "settle--paper-mango-donation-receipt": "The Mango Drink's Donation receipt FI/HYD/26-27/0417 in the pack",
    "settle--paper-mango-staff-receipt": "The staff sale's consolidated receipt LA/SR/26-27/0002 as a paper of the pack, with Vision's read",
    "settle--rakesh-today-phone": "Rakesh, Today on his phone: Issue from Tally offered, the van round next",
    "settle--rakesh-deliveries": "Rakesh, Deliveries: the truck loaded, the van round ready once the papers are drafted",
    # papers: the invoice issued, both packs reviewed, both van rounds run
    "papers--priya-paperwork-chips": "Priya, the chips' Paperwork reviewed: the tax invoice issued",
    "papers--paper-chips-invoice-issued": "The chips' tax invoice ISSUED: ORIGINAL FOR RECIPIENT, its e-invoice (IRN, acknowledgement, the signed QR), Rakesh Traders' signature and stamp",
    "papers--rakesh-batch-papers": "Rakesh, the chips' batch page, Papers: his tax invoice and credit note, each with Download PDF",
    "papers--rakesh-deliveries-done": "Rakesh, Deliveries: the van round run, the truck collected",
    "papers--priya-execution-chips": "Priya, the chips' Execution with every line done",
    "papers--priya-execution-mango": "Priya, the Mango Drink's Execution with every line done",
    # ledger: expiry day called from the console for both; Impact posted both ledgers
    "ledger--priya-execution-chips-cleared": "Priya, the chips' Execution, cleared",
    "ledger--ledger-money": "Priya, the Ledger's Money reading: the period's recovered figure with its working, the batches drawn, by month",
    "ledger--ledger-gst": "Priya, the Ledger's GST reading: credit kept and reversed under s.17(5)(h), the invoices and credit notes",
    "ledger--ledger-impact": "Priya, the Ledger's Impact reading: the tiles against the quarter before, Food by week, Where the kilos went, by distributor or product, BRSR Principle 6",
    "ledger--priya-command-cleared": "Priya, Command Center with both batches cleared and the Impact card",
    "ledger--priya-batches": "Priya, Batches: every batch in view, the cleared ones",
    "ledger--batch-chips-money": "Priya, the chips' page in the ledger, Money: what each channel took and came to, the credit notes and the invoice",
    "ledger--batch-chips-papers": "Priya, the chips' page, Papers: each paper with Download PDF",
    "ledger--batch-chips-impact": "Priya, the chips' page, Impact: the BRSR line with its evidence, where the kilos went",
    "ledger--batch-chips-record": "Priya, the chips' Record: the label photo sent with Vision's read, the audit trail day by day, the yeses",
    "ledger--batch-mango-money": "Priya, the Mango Drink's page, Money",
    "ledger--batch-mango-impact": "Priya, the Mango Drink's page, Impact: the BRSR line (86 meals), the evidence",
    "ledger--rakesh-batches": "Rakesh, Batches: the chips cleared among his batches, how they add up",
    "ledger--rakesh-batch-chips": "Rakesh, the chips' page, What happened: each moment with its day and time",
    "ledger--rakesh-batch-chips-money": "Rakesh, the chips' page, Money: he ends whole at ₹0",
    "ledger--rakesh-batch-chips-papers": "Rakesh, the chips' page, Papers: his papers, each with Download PDF",
    "ledger--rakesh-batch-chips-photos": "Rakesh, the chips' page, Photos: his label photo with Vision's read",
    "ledger--rakesh-orders": "Rakesh, Orders: every batch's orders, the chips' 31 on their invoices",
    "ledger--lakshmi-batches": "Lakshmi Agencies, Batches: the Mango Drink cleared",
    "ledger--lakshmi-batch-mango-papers": "Lakshmi Agencies, the Mango Drink's Papers: her credit note, the copies for her records (the receipt)",
    "ledger--lakshmi-batch-mango-photos": "Lakshmi Agencies, the Mango Drink's Photos: her label photo",
    "ledger--kirana-ganesh-orders-phone": "Ganesh ji, Orders on his phone: the margin at MRP, his order on its invoice",
    "ledger--meera-pickups-phone": "Meera, Pickups on her phone: the meals made, every pickup with its receipt",
    "ledger--neha-console-overview": "Neha, console Overview: Food by day (kept out of landfill and destroyed), Agents at work, the batches",
    "ledger--neha-console-munchly-agents": "Neha, Munchly's Agents tab after the journey: the stops, their triggers",
    # history: a pilot-quarter batch destroyed at the godown (independent of the walk)
    "history--priya-past-record": "Priya, MF-2407-116 (Peanut Chikki, Rakesh Traders) Record: the label photo, the before and after destruction photos with Vision's checks, the audit trail, Priya's approval",
    "history--priya-past-papers": "Priya, MF-2407-116 Papers: the expiry credit note, the certificate of destruction, the ITC memo",
    "history--paper-past-destruction-certificate": "MF-2407-116's certificate of destruction in its sheet: both pages (the certificate signed, the destruction log)",
    "history--paper-past-expiry-credit-note": "MF-2407-116's expiry credit note (the dealer price, the GST reversed, the agency's charges)",
    "history--rakesh-past-photos": "Rakesh, MF-2407-116 Photos: his label photo, the destruction's before and after photos with Vision's checks, Priya's yes",
    "history--rakesh-past-papers": "Rakesh, MF-2407-116 Papers: the expiry credit note, the agency's certificate",
}

def main() -> None:
    files = sorted(SCREENS.glob("*.png"))
    order = ["quiet", "detect", "plan", "approve", "orders", "deal", "donation", "settle", "papers", "ledger", "history"]
    files.sort(key=lambda f: (order.index(f.name.split("--")[0]) if f.name.split("--")[0] in order else 99, f.name))
    lines = ["# SC-187 · the app's screens, captured on the live stack", "",
             "Each capture is `<stage>--<name>.png`: desktop at 1600 × 1000 (2×, so 3200 × 2000), phone at 390 × 844 (3×). A `--full` copy is the whole page.",
             "The walk is `director.sh` (both batches, the day at 2 minutes), the captures `capture.mjs`.", "",
             "| Capture | Size | What it shows |", "| --- | --- | --- |"]
    missing = []
    for f in files:
        key = re.sub(r"(--full|--failed)?\.png$", "", f.name)
        what = WHAT.get(key)
        if not what:
            missing.append(f.name)
            what = "(not described)"
        if f.name.endswith("--full.png"):
            what = "Whole page: " + what
        if f.name.endswith("--failed.png"):
            what = "FAILED: " + what
        kb = f.stat().st_size // 1024
        lines.append(f"| `{f.name}` | {kb} kB | {what} |")
    (HERE / "screens.md").write_text("\n".join(lines) + "\n")
    print(f"{len(files)} captures listed in screens.md" + (f"; not described: {missing}" if missing else ""))

if __name__ == "__main__":
    main()
