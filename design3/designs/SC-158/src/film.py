"""SC-158: the film's timeline, scene by scene, written to film.json for overlays.mjs (the overlays it renders) and
assemble.py (the cut). Every figure is the Mango Drink journey's own, as backend-api computed it; every pop-up is one
of backend-api's own pushes for the batch (pushes.json, kept by director.py), never written for the film.

  python3 film.py
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
pushes = json.loads((HERE / "pushes.json").read_text()) if (HERE / "pushes.json").exists() else {}
figures = json.loads((HERE / "figures.json").read_text()) if (HERE / "figures.json").exists() else {}

# the run's own figures (director.py --dump-only), with the story's as the fallback
_case = figures.get("case") or {}
_plan = _case.get("plan") or {}
_row = (figures.get("ledgerRow") or {}).get("figures") or {}
_lines = {ln["id"]: ln for ln in _plan.get("lines", [])}


def inr(x: float) -> str:
    return "₹" + f"{round(x):,}"


F = {
    "atRisk": f"{(_case.get('writeOff') or {}).get('units', 1580):,}",
    "writeOff": inr((_case.get("writeOff") or {}).get("total", 22657.2)),
    "net": inr(_plan.get("net", 16917.1)),
    "swing": inr(_plan.get("swing", 22194)),
    "kirana": f"{_lines.get('kirana', {}).get('units', 1372):,}",
    "staff": f"{_lines.get('staff', {}).get('units', 150):,}",
    "foodbank": f"{_lines.get('foodbank', {}).get('units', 58):,}",
    "kiranaPrice": f"₹{_lines.get('kirana', {}).get('price', 12):g}",
    "staffPrice": f"₹{_lines.get('staff', {}).get('price', 8):g}",
    "margin": f"₹{20 - _lines.get('kirana', {}).get('price', 12):g}",
    "itcKept": inr(_row.get("itcKept", _plan.get("itcRetained", 837.1))),
    "kg": f"{round(_row.get('kg', _plan.get('kg', 339.7)))} kg",
    "meals": f"{_row.get('meals', _plan.get('meals', 58))}",
    "co2": f"{round(_row.get('co2', _plan.get('co2', 849)))} kg",
    "support": inr(_row.get("support", 5932)),
    "ordered": "52",
    "cn": next((d["no"] for d in _case.get("docs", []) if d.get("id") == "support"), "CN/0117"),
    "receipt": next((d["no"] for d in _case.get("docs", []) if d.get("id") == "receipt"), "FI/HYD/26-27/0417"),
}


def push(key: str, to: str, fallback_title: str, fallback_body: str) -> dict:
    p = pushes.get(key) or {}
    return {"kind": "push", "to": to, "title": p.get("title") or fallback_title, "body": p.get("body") or fallback_body}


# the pop-ups: backend-api's texts for this batch, with the recorded ones as the fallback
PUSH = {
    "detect": push("detect", "To Priya · Munchly Foods", "Mango Drink 200 ml · Hyderabad",
                   "Priya ji, Hyderabad godown mein Mango Drink 200ml (batch MF-2410-118) ki 1,580 units 24 Oct se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein."),
    "verify": push("verify", "To Lakshmi Agencies · distributor", "Ek photo chahiye",
                   "Lakshmi Agencies, Mango Drink 200ml ka ek carton ka label photo bhej dein (batch MF-2410-118). Bas ek photo, baaki hum kar lenge."),
    "plan": push("plan", "To Priya · Munchly Foods", "Plan ready · MF-2410-118",
                 "Plan for MF-2410-118: 1,372 units kirana (₹12), 150 units staff sale (₹8), 58 units food bank (₹0). Net ₹16,917, ₹22,194 better than write-off. GST ITC ₹837 safe. Tap to review and approve."),
    "approved": push("approved", "To Lakshmi Agencies · distributor", "Plan approved · Mango Drink",
                     "Lakshmi Agencies, Munchly ne MF-2410-118 ka plan approve kiya: 1,372 packets aapke kiranas ko scheme par, 150 godown ki staff sale mein, 58 food bank ko. Kuch rokna ho to app mein Pause dabayein."),
    "offer": push("offer", "To Sri Lakshmi Ganapathi Kirana · Begum Bazaar", "आज का खास ऑफर",
                  "नमस्ते Sri Lakshmi Ganapathi Kirana! Munchly Mango Drink 200ml पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before 24 Oct 2026. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें — Lakshmi Agencies"),
    "staff": push("staff.open", "To Lakshmi Agencies · distributor", "Staff sale · Mango Drink",
                  "150 packs of Mango Drink for your staff at ₹8 a pack, at Begum Bazaar godown. Record what sold when the sale is over."),
    "pickup": push("pickup", "To Meera · Feeding India", "Pickup request · Mango Drink",
                   "58 packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup from Begum Bazaar godown?"),
    "confirmed": push("pickup.confirmed", "To Priya · Munchly Foods", "Feeding India confirmed",
                      "58 packs of Mango Drink, pickup Saturday 10:00 from Begum Bazaar godown."),
    "van": push("van", "To Lakshmi Agencies · distributor", "Van route for Saturday",
                "Van route for Saturday updated: 52 kiranas, 1,372 packets."),
    "papers": push("papers", "To Priya · Munchly Foods", "Document pack ready · MF-2410-118",
                   "Papers ready for MF-2410-118: price-support credit note, GST memo. Nothing to chase."),
    "closed": push("closed", "To Priya · Munchly Foods", "Batch closed · 0 packs left at the godown",
                   "₹16,917 recovered, ₹837 GST credit kept, 339.7 kg kept out of landfill."),
}

overlays: dict[str, dict] = {}
segments: list[dict] = []


def ov(id_: str, spec: dict) -> str:
    overlays[id_] = {"id": id_, **spec}
    return id_


def clip(name: str, seconds: float, *, speed: float = 0.85, caption: str | None = None, label: str | None = None,
         amber: bool = False, push_: str | None = None, push_at: float = 0.8, chapter: str | None = None, hold: float = 0) -> None:
    """an LTX clip (its keyframe while it renders), slowed to `speed`, with its overlays"""
    seg = {"kind": "clip", "name": name, "key": "k" + name[1:], "seconds": seconds, "speed": speed, "hold": hold, "overlays": []}
    _attach(seg, caption, label, amber, push_, push_at, chapter)
    segments.append(seg)


def screen(shot: str, seconds: float, *, bg: str, phone: bool = False, scroll: bool = False, zoom: float = 1.03,
           caption: str | None = None, label: str | None = None, amber: bool = False, push_: str | None = None,
           push_at: float = 0.6, chapter: str | None = None) -> None:
    """one of the app's screens in a window (or a phone), on a blurred keyframe"""
    seg = {"kind": "screen", "shot": shot, "seconds": seconds, "bg": bg, "phone": phone, "scroll": scroll, "zoom": zoom, "overlays": []}
    _attach(seg, caption, label, amber, push_, push_at, chapter)
    segments.append(seg)


def _attach(seg, caption, label, amber, push_, push_at, chapter):
    n = len(segments)
    if chapter:
        num, text = chapter.split(" · ", 1)
        seg["chapter"] = ov(f"ch-{num}", {"kind": "chapter", "n": num, "text": text})
    if caption:
        caption = caption.format(F=F)
        seg["overlays"].append({"id": ov(f"cap-{n:02d}", {"kind": "caption", "text": caption, "label": label, "amber": amber}), "at": 0.4, "until": -0.3})
    if push_:
        seg["overlays"].append({"id": ov(f"push-{push_}", PUSH[push_]), "at": push_at, "until": push_at + 6.0})


# ---- the scenes -----------------------------------------------------------------------------------------------------

# 1. the title
clip("c01-factory-dawn", 6, speed=0.8)
segments[-1]["overlays"].append({"id": ov("title", {"kind": "title", "title": "Smart-Clearance", "text": "Near-expiry stock, routed by AI agents. One yes from a person.", "sub": "Munchly Foods · the Mango Drink batch · Hyderabad"}), "at": 0.6, "until": 12.5})
clip("c16-factory-line", 5, speed=0.85, caption="Munchly Foods makes it. By the time a batch reaches a distributor's godown, the clock on its best-before is already running.")

# 2. the batch
clip("c02-godown-lakshmi", 6, speed=0.8, chapter="1 · The batch", label="Begum Bazaar godown · Hyderabad",
     caption="Lakshmi Agencies holds **2,000 packs** of Mango Drink 200 ml, batch MF-2410-118, with **22 days** to best-before.")
screen("detect--priya-command-at-risk", 9, bg="k03-priya-office", chapter="1 · The batch", label="The quick-commerce gates", amber=True,
       caption="Blinkit, Zepto and Instamart stop taking a pack this close to its date: **three gates, all crossed**. Destroying it would cost **{F[writeOff]}**.")

# 3. the platform
clip("c04-neha-console", 5, speed=0.85, chapter="2 · A SaaS, run by agents", label="Smart-Clearance · the staff console",
     caption="Smart-Clearance is software as a service: Munchly's workspace is one of many, set up and watched by the platform's staff in the console.")
screen("console--console-overview", 9, bg="k04-neha-console", scroll=True, chapter="2 · A SaaS, run by agents", label="The console · Overview",
       caption="Every client's batches in flight, the agents at work on each stop, what was recovered, and the food kept out of landfill, day by day.")
screen("console--console-munchly-agents", 9, bg="k04-neha-console", scroll=True, chapter="2 · A SaaS, run by agents", label="Munchly Foods · Agents",
       caption="**Ten agents on Gemini** work a batch: Watcher, Vision, Valuer, Router, Lister, Negotiator, Outreach, Donation, Paperwork and Impact. A person says yes once.")
screen("console--console-munchly-rules", 7, bg="k04-neha-console", scroll=True, chapter="2 · A SaaS, run by agents", label="Munchly Foods · Channels & rules",
       caption="Each client's own rules: the quick-commerce gates, the exits and their prices, the kirana scheme, the expiry policy.")

# 4. detect
clip("c03-priya-office", 5, speed=0.85, chapter="3 · Detect", label="09:00 · Pune",
     caption="Every morning the Watcher checks every batch at every distributor against sell-through and the gates.")
clip("c05-priya-phone", 5, speed=0.8, chapter="3 · Detect", push_="detect", push_at=0.6, label="The Watcher",
     caption="**{F[atRisk]} packs** will not sell before 24 Oct. Priya is told on her phone, in the words she reads.")
screen("detect--priya-journey-flagged", 8, bg="k05-priya-phone", chapter="3 · Detect", label="The batch's page",
       caption="The batch has its own page: flagged, at risk, and what each agent does next. Nothing is hidden from the operator.")

# 5. verify
clip("c06-lakshmi-label", 5, speed=0.8, chapter="4 · Verify", push_="verify", push_at=0.5, label="Vision",
     caption="One photo of the carton's label is all Vision asks of the distributor. Bas ek photo.")
screen("detect--lakshmi-today-photo-asked-phone", 6, bg="k06-lakshmi-label", phone=True, chapter="4 · Verify", label="Lakshmi Agencies · Today",
       caption="Her Today card asks for it: take a photo, or upload one.")
screen("verified--priya-route-vision", 9, bg="k06-lakshmi-label", scroll=True, chapter="4 · Verify", label="Vision · Gemini",
       caption="Vision reads the batch, MFG, best-before and MRP from the label and matches them to the DMS export. The batch is real, and it is this one.")

# 6. value, decide, approve
screen("planned--priya-route-plan", 11, bg="k03-priya-office", scroll=True, chapter="5 · Value, decide, approve", push_="plan", push_at=0.6, label="Valuer · Router",
       caption="The Valuer prices five exits. The Router splits the batch: **{F[kirana]}** to the kiranas, **{F[staff]}** to the staff sale, **{F[foodbank]}** to Feeding India. Net **{F[net]}**, **{F[swing]}** better than the bin.")
clip("c07-priya-approve", 5, speed=0.8, chapter="5 · Value, decide, approve", label="One yes", amber=True,
     caption="Priya says yes once, from her phone. The approval is logged with who, when and device.")
screen("approved--priya-execution-sent", 9, bg="k07-priya-approve", scroll=True, chapter="5 · Value, decide, approve", push_="approved", push_at=0.6, label="Execution",
       caption="The distributor is told the plan, with a Pause. The agents set off: Outreach to the shops, Donation to the food bank, the staff sale opened.")

# 7. the kiranas
clip("c08-kirana-phone", 5, speed=0.8, chapter="6 · The kiranas", push_="offer", push_at=0.5, label="Outreach · in Hindi",
     caption="58 shops in the old city get the offer in their own language: **buy 10, get 2 free**, for 48 hours.")
screen("approved--kirana-offer-phone", 7, bg="k08-kirana-phone", phone=True, chapter="6 · The kiranas", label="Sri Lakshmi Ganapathi Kirana · the offer",
       caption="In her app: the scheme, her cap (what she sells in two weeks, times four) and her margin. She orders in a tap.")
screen("ordered--kirana-orders-phone", 7, bg="k09-kirana-sale", phone=True, chapter="6 · The kiranas", label="What a kirana gains",
       caption="**₹20 MRP packs at {F[kiranaPrice]} effective**: with 2 free in every 12, **{F[margin]} a pack** stays with the shop. Fresh stock at a scheme price, with no haggling.")
clip("c09-kirana-sale", 5, speed=0.85, chapter="6 · The kiranas", label="The shop",
     caption="A fair price for the shop, a fair price for the customer, and a brand that keeps its shelf.")
screen("ordered--priya-execution-ordered", 8, bg="k08-kirana-phone", scroll=True, chapter="6 · The kiranas", label="Execution",
       caption="**{F[ordered]} shops order {F[kirana]} packets** inside the window, each under its cap. Every order is a line in the audit trail.")

# 8. the staff sale
clip("c10-staff-sale", 8, speed=0.85, chapter="7 · The staff sale", push_="staff", push_at=0.6, label="Begum Bazaar godown · dusk",
     caption="{F[staff]} packs for the godown's own staff at {F[staffPrice]}, paid on UPI at the gate, recorded once by the distributor.")
screen("staff--lakshmi-today-staff-recorded-phone", 6, bg="k10-staff-sale", phone=True, chapter="7 · The staff sale", label="Lakshmi Agencies · Today",
       caption="Recorded: {F[staff]} of {F[staff]} sold. What sold is what counts; nothing is assumed.")

# 9. the food bank
screen("approved--meera-pickup-request-phone", 6, bg="k11-foodbank-van", phone=True, chapter="8 · The food bank", push_="pickup", push_at=0.5, label="Donation",
       caption="Packs with 15 or more days left go to a food bank, with the FSSAI surplus-food checklist drafted for them.")
clip("c11-foodbank-van", 8, speed=0.85, chapter="8 · The food bank", label="Feeding India · Hyderabad",
     caption="Feeding India collects {F[foodbank]} packs at the godown: **{F[meals]} meals** served, instead of {F[foodbank]} packs in a landfill.")
screen("collected--meera-pickup-page", 8, bg="k11-foodbank-van", scroll=True, chapter="8 · The food bank", push_="confirmed", push_at=0.6, label="Meera · Pickups",
       caption="Feeding India issues its own donation receipt, numbered in its own series, with its PDF. Munchly and the distributor each keep a copy.")

# 10. the delivery and the papers
clip("c12-van-round", 6, speed=0.85, chapter="9 · Delivery and the papers", push_="van", push_at=0.5, label="Saturday · the van round",
     caption="The Saturday round delivers the scheme to every shop that ordered.")
screen("papers--lakshmi-deliveries", 7, bg="k12-van-round", scroll=True, chapter="9 · Delivery and the papers", label="Lakshmi Agencies · Deliveries",
       caption="Her deliveries, batch by batch: the round to the shops, the staff sale, the food bank's pickup.")
clip("c13-priya-papers", 5, speed=0.8, chapter="9 · Delivery and the papers", push_="papers", push_at=0.5, label="Paperwork",
     caption="Paperwork drafts the pack and lays each paper out as a PDF: the credit note, the GST memo, the FSSAI checklist, the receipt.")
screen("papers--paper-credit-note", 8, bg="k13-priya-papers", scroll=True, chapter="9 · Delivery and the papers", label="Price-support credit note",
       caption="The credit note: Munchly's price support to Lakshmi Agencies, so the distributor **ends whole** on the batch. A financial note, with no GST adjustment.")
screen("papers--paper-itc-memo", 8, bg="k13-priya-papers", scroll=True, chapter="9 · Delivery and the papers", label="GST ITC memo · s.17(5)(h)",
       caption="The GST memo: input credit **kept on every pack sold**, reversed only on the {F[foodbank]} given away. **{F[itcKept]} of credit stays with Munchly**.")
screen("papers--paper-fssai", 6, bg="k13-priya-papers", scroll=True, chapter="9 · Delivery and the papers", label="FSSAI surplus-food checklist",
       caption="The FSSAI checklist for the donation, drafted from the batch's own dates and the food bank's rules.")

# 11. the ledger
screen("ledger--priya-execution-cleared", 7, bg="k14-office-dashboard", scroll=True, chapter="10 · The ledger", push_="closed", push_at=0.6, label="Expiry day · Impact",
       caption="On expiry day nothing is left at the godown. Impact posts the ledger, and the batch is cleared.")
clip("c14-office-dashboard", 6, speed=0.85, chapter="10 · The ledger", label="Munchly Foods · Pune",
     caption="**{F[net]} recovered** on a batch that was headed for a **{F[writeOff]}** write-off.")
screen("ledger--ledger-money", 8, bg="k14-office-dashboard", scroll=True, chapter="10 · The ledger", label="Ledger · Money",
       caption="One ledger, three readings. Money: what was recovered against the would-be write-off, every batch a segment, by quarter and by year.")
screen("ledger--ledger-gst", 8, bg="k14-office-dashboard", scroll=True, chapter="10 · The ledger", label="Ledger · GST",
       caption="GST: input credit kept and reversed under s.17(5)(h), the invoices and the credit notes, exported as the CA receives them.")
screen("ledger--ledger-impact", 8, bg="k14-office-dashboard", scroll=True, chapter="10 · The ledger", label="Ledger · Impact",
       caption="Impact: **{F[kg]}** of food kept out of landfill, **{F[co2]}** of CO₂e avoided, **{F[meals]} meals**, and BRSR Principle 6's food-waste row with its evidence.")
screen("ledger--batch-impact", 7, bg="k14-office-dashboard", scroll=True, chapter="10 · The ledger", label="The batch's BRSR line",
       caption="The batch's own BRSR line and its evidence: {F[ordered]} kirana order logs, {F[cn]}, the FSSAI checklist, receipt {F[receipt]}.")
screen("console--console-overview", 6, bg="k04-neha-console", scroll=False, zoom=1.08, chapter="10 · The ledger", label="The console",
       caption="And in the console, across every client: food kept out of landfill by day, and what was destroyed, on one scale.")

# 12. the close
clip("c09-kirana-sale", 5, speed=0.8, chapter="11 · Everyone ends whole", label="Hyderabad",
     caption="The brand recovers. The distributor ends whole. The kiranas earn. The food bank serves.")
clip("c15-lane-golden", 6, speed=0.75, hold=8)
segments[-1]["overlays"].append({"id": ov("end", {"kind": "end", "url": "smartclearance.web.app · munchly-smartclearance.web.app", "built": "Built on Google Cloud: Gemini on Vertex AI · ADK · Cloud Run · Cloud SQL · Pub/Sub · BigQuery · Firebase",
                                                    "cards": [{"who": "Munchly Foods", "fig": F["net"], "what": f"recovered, against a {F['writeOff']} write-off"},
                                                              {"who": "Lakshmi Agencies", "fig": "ends whole", "what": "the price support makes up the difference"},
                                                              {"who": f"{F['ordered']} kiranas", "fig": f"{F['margin']} a pack", "what": f"on {F['kirana']} packs, at a scheme price"},
                                                              {"who": "Feeding India", "fig": f"{F['meals']} meals", "what": "and the receipt that proves it"}]}),
                                 "at": 1.2, "until": 15.0})

film = {"fps": 24, "width": 1920, "height": 1080, "xfade": 0.5, "segments": segments, "overlays": list(overlays.values())}
(HERE / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False))
total = sum((s["seconds"] / s.get("speed", 1) + s.get("hold", 0)) if s["kind"] == "clip" else s["seconds"] for s in segments) - 0.5 * (len(segments) - 1)
print(f"film.json: {len(segments)} segments, {len(overlays)} overlays, about {total / 60:.1f} min")
