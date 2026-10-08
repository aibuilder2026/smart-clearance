"""Every sentence the live journey writes: the agents' timeline, the pushes, the listing's chat and the audit lines,
in design3's words (reference/journey.json's copy), filled with the journey's own figures.

These are the templates. A model may write some of the words instead (the Router's reasoning, Outreach's offer, the
Negotiator's reply, the Lister's listing), and `check_numbers` holds it to the computed figures; whatever it leaves
out, or gets wrong, is written from here. tests/test_copy.py renders the story's inputs and compares them with
design3's own sentences.
"""

import math
import re
from datetime import date, datetime
from typing import Any

from sc_api.domain.clock import IST
from sc_api.domain.money import fmt

WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
LINE_WORDS = {"kirana": "kirana", "expiresoon": "ExpireSoon", "staff": "staff sale", "foodbank": "food bank"}


# --- names ---------------------------------------------------------------------------------------------------------


def compact(name: str) -> str:
    """Masala Chips 150 g → Masala Chips 150g, as the Hindi copy writes a pack"""
    return re.sub(r"(\d) (g|ml|kg|l)\b", r"\1\2", name)


def base(name: str) -> str:
    """Masala Chips 150 g → Masala Chips"""
    return re.sub(r"\s+\d+(\.\d+)?\s*(g|ml|kg|l)$", "", name)


def possessive(name: str) -> str:
    """Rakesh Traders → Rakesh Traders'; Agrawal Wholesale → Agrawal Wholesale's"""
    return name + ("'" if name.endswith("s") else "'s")


def first(name: str) -> str:
    """Rakesh bhai → Rakesh; Priya Deshmukh → Priya"""
    return name.split()[0]


def price(p: float) -> str:
    """₹18 for a whole rupee, ₹14.20 otherwise"""
    return f"₹{p:.0f}" if float(p).is_integer() else f"₹{p:.2f}"


def bid_price(p: float) -> str:
    """the buyer's own figure: 13, or 13.50"""
    return f"{p:.0f}" if float(p).is_integer() else f"{p:.2f}"


def ist(at: datetime) -> datetime:
    return at.astimezone(IST)


def weekday(at: datetime | date) -> str:
    d = at.astimezone(IST).date() if isinstance(at, datetime) else at
    return WEEKDAYS[d.weekday()]


def hours_phrase(hours: float) -> str:
    """about two hours, about an hour, about 20 minutes, about three days"""
    words = {1: "an", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six"}
    if hours < 1:
        return f"about {max(1, round(hours * 60))} minutes"
    if hours < 36:
        n = round(hours)
        return f"about {words.get(n, str(n))} hour{'s' if n != 1 else ''}" if n != 1 else "about an hour"
    d = round(hours / 24)
    return f"about {words.get(d, str(d))} days"


# --- money and the plan ---------------------------------------------------------------------------------------------


def line(plan: dict[str, Any], channel: str) -> dict[str, Any] | None:
    return next((x for x in plan.get("lines", []) if x["id"] == channel), None)


def gate_line(gates: list[dict[str, Any]]) -> str:
    """Blinkit 47/90 · Zepto 47/110 · Instamart 47/110"""
    return " · ".join(f"{g['app']} {g['has']}/{g['need']}" for g in gates)


def check_numbers(text: str, allowed: list[float]) -> bool:
    """whether every figure in a model's sentence is one of the computed ones: rupees, units and percentages it may
    quote. Small counting words (a day, two options) are not figures, unless written as money (₹5, Rs 5); anything
    else is refused"""
    found = re.findall(r"(₹\s?|Rs\.?\s?|INR\s?)?(?<![\w.])(\d[\d,]*(?:\.\d+)?)", text)
    # a figure as written: to the paisa, or rounded to the rupee as the app shows money (fmt.inr)
    pool = {round(float(a), 2) for a in allowed} | {float(math.floor(float(a) + 0.5)) for a in allowed}
    for money_, raw in found:
        n = round(float(raw.replace(",", "").rstrip(".")), 2)
        if n in pool or (not money_ and n < 10 and float(n).is_integer()):
            continue
        return False
    return True


def reply_ok(text: str, *, decided: float, others: list[float], reserve: float) -> bool:
    """a model's reply to a bid: it states the price money.py decided, quotes no figure but the lot's own, and never
    gives the reserve away"""
    states = f"{decided:.2f}" in text or (float(decided).is_integer() and f"₹{decided:.0f}" in text)
    shows_reserve = reserve != decided and (f"{reserve:.2f}" in text or f"{reserve:g}" in re.findall(r"[\d.]+", text))
    return states and not shows_reserve and check_numbers(text, [decided, *others])


# --- the timeline (feed) ----------------------------------------------------------------------------------------------


def connect_event(*, mapped: int, batches: int, distributors: int, days: int) -> dict[str, Any]:
    return {
        "text": f"Mapped {mapped} DMS columns, loaded {fmt.num(batches)} batches from {distributors} distributors and "
        f"back-filled {days} days of sell-through by pincode and by shop into BigQuery.",
        "calls": [
            ["bigquery.load", f"{fmt.num(batches)} batches", "ok"],
            ["sellthrough.backfill", f"{days} days · by pincode, by shop", "ok"],
        ],
    }


def permit_event(*, platform: str, client: str) -> str:
    return (
        f"Gave {platform} a one-time permission to list his {client} stock, offer schemes to his kiranas, draft his "
        f"invoices and book dispatch slots, inside {possessive(client)} floors."
    )


def watch_event(
    *, checked: int, distributors: int, ref: str, assess: dict[str, Any], units: int, sell_per_day: float
) -> dict[str, Any]:
    gates = assess["gates"]
    failing = [g for g in gates if not g["pass"]]
    fails = (
        "fails all three quick-commerce gates"
        if len(failing) == len(gates)
        else (f"fails {len(failing)} of the quick-commerce gates")
    )
    return {
        "text": f"Checked {fmt.num(checked)} batches across {distributors} distributors. {ref} {fails} and will not "
        f"sell through.",
        "calls": [
            ["gates.check", gate_line(gates), "bad"],
            [
                "sellthrough.project",
                f"{fmt.num(sell_per_day)}/day × {assess['usableDays']} days = {fmt.num(assess['willSell'])} of "
                f"{fmt.num(units)}",
                "",
            ],
            ["pubsub.publish", "batch.at_risk", "ok"],
        ],
    }


def ask_event(*, distributor: str, person: str, hindi: bool) -> dict[str, Any]:
    return {
        "text": f"Asked {distributor} for one label photo before quoting any price.",
        "calls": [["fcm.send", f"{person} · {'Hindi' if hindi else 'English'}", "ok"]],
    }


def photo_event(*, shelf: str | None) -> str:
    return "Sent one photo of the carton label" + (f" from shelf {shelf}." if shelf else ".")


def read_event(read: dict[str, Any], *, matches: bool, mismatches: list[str]) -> dict[str, Any]:
    conf = f"{read['confidence']:.2f}"
    parts = []
    if read.get("batch"):
        parts.append(f"batch {read['batch']}")
    if read.get("mfg"):
        parts.append(f"MFG {fmt.date(read['mfg'])}")
    if read.get("bestBefore"):
        parts.append(f"best before {fmt.date(read['bestBefore'])}")
    if read.get("mrp") is not None:
        parts.append(f"MRP ₹{read['mrp']:.2f}")
    if not parts:  # nothing on the label could be read: there is nothing to hold to the record
        return {
            "text": f"Could not read the label, confidence {conf}. Asked for another photo.",
            "calls": [
                ["gemini.vision.read_label", f"confidence {conf}", "bad"],
                ["dms.reconcile", "nothing to match", "bad"],
            ],
        }
    verdict = "Matches the DMS record." if matches else f"Does not match the DMS record: {', '.join(mismatches)}."
    return {
        "text": f"Read the label: {', '.join(parts)}, confidence {conf}. {verdict}",
        "calls": [
            ["gemini.vision.read_label", f"confidence {conf}", "ok"],
            ["dms.reconcile", "match" if matches else "mismatch", "ok" if matches else "bad"],
        ],
    }


def value_event(*, days_left: int, write_off: dict[str, Any], sku: dict[str, Any], rules: dict[str, Any]) -> dict:
    channels = "five channels"
    return {
        "text": f"Priced {channels} against {days_left} days left. Destroying costs "
        f"{fmt.inr2(-write_off['perUnit'])} a unit, {fmt.inr(-write_off['total'])} for the batch.",
        "calls": [
            ["bigquery.price_history", f"{sku['category']} · {days_left} days", ""],
            ["gst.rate", f"HSN {sku['hsn']} → {round(sku['gst'] * 100)}%", ""],
            ["cost_sheet.input_gst", f"{fmt.rate(write_off['itcPerUnit'])} a pack", ""],
            ["epr.factor", f"₹{fmt.num(rules['eprPerKg'])} / kg", ""],
        ],
    }


def route_text(plan: dict[str, Any], *, offered: int, window_days: int) -> str:
    """the Router's reasoning, when the model's is not used: each line of the split, then the best exit left out"""
    parts = []
    for ln in plan["lines"]:
        if ln["id"] == "kirana":
            parts.append(
                f"{fmt.num(ln['units'])} units to the kirana cluster at {price(ln['price'])} effective, capped by what "
                f"{offered} kiranas can move in {window_days} days"
            )
        elif ln["id"] == "expiresoon":
            parts.append(f"{fmt.num(ln['units'])} to ExpireSoon at {price(ln['price'])}")
        elif ln["id"] == "staff":
            parts.append(f"{fmt.num(ln['units'])} to the {ln['name']} at {price(ln['price'])}")
        elif ln["id"] == "foodbank":
            parts.append(f"{fmt.num(ln['units'])} to a food bank")
        else:
            parts.append(f"{fmt.num(ln['units'])} written off")
    text = "; ".join(parts) + "."
    used = {ln["id"] for ln in plan["lines"]}
    left = next(
        (r for r in plan["rows"] if r["eligible"] and not r.get("baseline") and r["id"] not in used and r["net"] > 0),
        None,
    )
    if left is not None:
        text += f" The {left['name']} pays less a unit, so it gets nothing this time."
    return text[0].upper() + text[1:] if text and text[0].isalpha() else text


def route_event(plan: dict[str, Any], *, offered: int, window_days: int, explanation: str | None) -> dict[str, Any]:
    return {
        "text": explanation or route_text(plan, offered=offered, window_days=window_days),
        "calls": [["allocate.greedy", f"{fmt.num(plan['units'])} units → net {fmt.inr(plan['net'])}", "ok"]],
    }


def notify_event(*, approver: str, distributor_person: str) -> str:
    return f"Sent {approver} the plan to review, and {distributor_person} the same plan with a pause button."


def approved_event(*, device: str) -> str:
    return f"Approved the plan from the {'phone' if device == 'phone' else 'laptop'}."


def list_event(
    *, units: int, distributor: str, ask: float, reserve: float, client: str, listing_id: str, territory_guard: bool
) -> dict[str, Any]:
    hidden = f"; hidden from buyers inside {possessive(client)} territories" if territory_guard else ""
    return {
        "text": f"Posted {fmt.num(units)} units on ExpireSoon in {possessive(distributor)} name at {price(ask)}, with "
        f"the label photo and dates. Reserve ₹{reserve:.2f}{hidden}.",
        "calls": [["POST /v1/listings", f"201 · {listing_id}", "ok"]],
    }


def outreach_event(
    *, offered: int, city: str, scheme: dict[str, int], hours: int, cap_times: int, hindi: bool
) -> dict[str, Any]:
    lang = "Hindi" if hindi else "English"
    return {
        "text": f"Pushed the {lang} scheme to {offered} kiranas in the {city} cluster: buy {scheme['buy']} get "
        f"{scheme['free']} for {hours} hours, no shop over {cap_times}× its own 14-day sales.",
        "calls": [["fcm.send", f"{offered} kiranas · {lang}", "ok"]],
    }


def counter_event(
    *, buyer: str, bid: float, units: int, counter: float, reserve: float, distributor_person: str
) -> dict[str, Any]:
    below = ", below the reserve" if bid < reserve else ""
    return {
        "text": f"{buyer} bid ₹{bid_price(bid)} for all {fmt.num(units)}{below}. Countered at ₹{counter:.2f} with "
        f"24-hour dispatch from {possessive(distributor_person)} calendar.",
        "calls": [["listing.counter", f"₹{bid:.2f} → ₹{counter:.2f}", ""]],
    }


def accepted_event(*, price_: float, token: float) -> str:
    return f"Accepted ₹{price_:.2f} and paid the {fmt.inr(token)} token."


def orders_event(*, shops: int, offered: int, units: int, line_units: int, hours: float) -> dict[str, Any]:
    all_ = "all " if units >= line_units else ""
    return {
        "text": f"{shops} of {offered} kiranas ordered {all_}{fmt.num(units)} units in {hours_phrase(hours)}, each "
        f"under its cap.",
        "calls": [["orders.sum", f"{fmt.num(units)} units · {shops} shops", "ok"]],
    }


def donate_event(*, sku_name: str, partner: str, units: int, others: list[dict[str, Any]]) -> dict[str, Any]:
    tail = "".join(f" {o['name']} needs {o['minDays']}+ days and {o['minUnits']}+ units." for o in others)
    return {
        "text": f"{base(sku_name)} batch: booked {partner} for {fmt.num(units)} units.{tail}",
        "calls": [["foodbank.match", f"{partner} · {fmt.num(units)} units", "ok"]],
    }


def dispatch_event(*, buyer: str, city: str) -> str:
    return f"Loaded {possessive(buyer)} truck for {city} once the balance landed."


def papers_event(
    *, distributor_person: str, invoice: dict[str, Any] | None, support: dict[str, Any] | None, itc: float
) -> dict[str, Any]:
    who = first(distributor_person)
    calls: list[list[str]] = []
    said = []
    if invoice is not None:
        said.append(
            f"Drafted {possessive(who)} invoice {invoice['no']} for {who} to issue, checked the e-way bill rule"
        )
        calls.append(["docs.invoice", f"{fmt.inr(invoice['total'])} · draft", "ok"])
        calls.append(["eway.check", "below ₹50,000" if invoice["total"] < 50000 else "generated", ""])
    if support is not None:
        said.append(f"issued the price-support credit note {support['no']}")
        calls.append(["docs.credit_note", fmt.inr(support["amount"]), "ok"])
    said.append("wrote the ITC memo")
    calls.append(["itc.memo", f"{fmt.inr(itc)} retained", "ok"])
    text = ", ".join(said[:-1]) + " and " + said[-1] + "."
    return {"text": text[0].upper() + text[1:], "calls": calls}


def van_event(*, day: str, shops: int, units: int) -> str:
    return f"Ran the {day} round: {shops} drops, {fmt.num(units)} packets."


def shelf_event(shelf: dict[str, Any]) -> dict[str, Any]:
    return {
        "text": f"Shelf check: the salesman counted the scheme packs at {shelf['counted']} shops. {shelf['shop']}, "
        f"{shelf['area']}, has {shelf['left']} of {shelf['took']} left: pick up {shelf['pickUp']} on "
        f"{shelf['round']} and leave {shelf['leave']}.",
        "calls": [["shelf.check", f"{shelf['counted']} shops counted", "ok"]],
    }


def ledger_event(*, return_by: str, kg: float, co2: float, meals: int, net: float) -> dict[str, Any]:
    return {
        "text": f"The return window closed on {fmt.day(return_by)}. Posted the ledger: {fmt.kg(kg)} diverted, "
        f"{fmt.kg(co2)} CO₂e avoided (indicative), {meals} meals. BRSR row written.",
        "calls": [["ledger.post", fmt.inr(net), "ok"], ["brsr.rows", "Principle 6", "ok"]],
    }


# --- the pushes -------------------------------------------------------------------------------------------------------


def push_detect(*, person: str, sku_name: str, city: str, ref: str, at_risk: int, best_before: str) -> dict[str, Any]:
    return {
        "title": f"{sku_name} · {city}",
        "body": f"{first(person)} ji, {city} godown mein {compact(sku_name)} (batch {ref}) ki {fmt.num(at_risk)} units "
        f"{fmt.day(best_before)} se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein.",
    }


def push_verify(*, person: str, sku_name: str, ref: str) -> dict[str, Any]:
    return {
        "title": "Ek photo chahiye",
        "body": f"{person}, {compact(sku_name)} ka ek carton ka label photo bhej dein (batch {ref}). Bas ek photo, "
        f"baaki hum kar lenge.",
    }


def push_retake(*, person: str, sku_name: str, ref: str, why: str) -> dict[str, Any]:
    return {
        "title": "Ek aur photo chahiye",
        "body": f"{person}, {compact(sku_name)} (batch {ref}) ka label saaf nahi padha gaya: {why}. Ek aur photo bhej "
        f"dein.",
    }


def push_plan(plan: dict[str, Any], *, ref: str) -> dict[str, Any]:
    parts = [
        f"{fmt.num(ln['units'])} units {LINE_WORDS[ln['id']]} ({price(ln['price'])})"
        for ln in plan["lines"]
        if ln["id"] in LINE_WORDS
    ]
    return {
        "title": f"Plan ready · {ref}",
        "body": f"Plan for {ref}: {', '.join(parts)}. Net {fmt.inr(plan['net'])}, {fmt.inr(plan['swing'])} better than "
        f"write-off. GST ITC {fmt.inr(plan['itcRetained'])} safe. Tap to review and approve.",
    }


def push_approved(plan: dict[str, Any], *, person: str, client: str, sku_name: str, ref: str) -> dict[str, Any]:
    said = {
        "kirana": lambda n: f"{fmt.num(n)} packets aapke kiranas ko scheme par",
        "expiresoon": lambda n: f"{fmt.num(n)} aapke naam se ExpireSoon par",
        "staff": lambda n: f"{fmt.num(n)} godown ki staff sale mein",
        "foodbank": lambda n: f"{fmt.num(n)} food bank ko",
    }
    parts = [said[ln["id"]](ln["units"]) for ln in plan["lines"] if ln["id"] in said]
    return {
        "title": f"Plan approved · {base(sku_name)}",
        "body": f"{person}, {client} ne {ref} ka plan approve kiya: {', '.join(parts)}. Kuch rokna ho to app mein "
        f"Pause dabayein.",
    }


def push_offer(
    *, shop: str, brand: str, sku_name: str, best_before: str, scheme: dict[str, int], hours: int, distributor: str
) -> dict[str, Any]:
    return {
        "title": "आज का खास ऑफर",
        "hindi": True,
        "body": f"नमस्ते {shop}! {brand} {compact(sku_name)} पर आज खास ऑफर: {scheme['buy']} पैकेट लो, "
        f"{scheme['free']} मुफ़्त. Best before {fmt.date(best_before)}. सिर्फ़ {hours} घंटे. ऑर्डर के लिए टैप करें — {distributor}",
        "en": f"Today's offer on {brand} {sku_name}: buy {scheme['buy']} packets, get {scheme['free']} free. Best "
        f"before {fmt.date(best_before)}. {hours} hours only. Tap to order. {distributor}",
    }


def push_award(*, units: int, price_: float, buyer: str, city: str, token: float, balance: float) -> dict[str, Any]:
    return {
        "title": "Awarded on ExpireSoon",
        "body": f"{fmt.num(units)} units at ₹{price_:.2f} to {buyer}, {city}. Token {fmt.inr(token)} received; balance "
        f"{fmt.inr(balance)} due in 48 h.",
    }


def push_won(*, person: str, buyer: str, city: str, units: int, price_: float, token: float) -> dict[str, Any]:
    return {
        "title": "Buyer mil gaya · ExpireSoon",
        "body": f"{person}, {buyer} ({city}) ne {fmt.num(units)} packets ₹{price_:.2f} par le liye. Token "
        f"{fmt.inr(token)} aa gaya.",
    }


def push_van(*, day: str, shops: int, units: int, city: str, lot: int) -> dict[str, Any]:
    tail = f" The {city} lot ({fmt.num(lot)}) is collected by the buyer's truck once the balance lands." if lot else ""
    return {
        "title": f"Van route for {day}",
        "body": f"Van route for {day} updated: {shops} kiranas, {fmt.num(units)} packets.{tail}",
    }


def push_papers(*, ref: str, distributor_person: str, invoice: bool) -> dict[str, Any]:
    what = (f"{possessive(first(distributor_person))} invoice draft, e-way bill check, " if invoice else "") + (
        "price-support credit note, GST memo"
    )
    return {"title": f"Document pack ready · {ref}", "body": f"Papers ready for {ref}: {what}. Nothing to chase."}


def push_invoice(
    *, buyer: str, city: str, units: int, price_: float, gst_pct: int, total: float, client: str, support: float
) -> dict[str, Any]:
    return {
        "title": "Invoice draft ready",
        "body": f"Invoice draft to {buyer}, {city}: {fmt.num(units)} × ₹{price_:.2f}, IGST {gst_pct}%, "
        f"{fmt.inr(total)}. Issue it from Tally. {possessive(client)} price support of {fmt.inr(support)} is on "
        f"its way.",
    }


def push_shelf(shelf: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": "Shelf check · one pick-up",
        "body": f"{shelf['shop']}, {shelf['area']} has {shelf['left']} of {shelf['took']} scheme packs left. Pick up "
        f"{shelf['pickUp']} on {shelf['round']}; leave {shelf['leave']}.",
    }


def push_report(*, ref: str, kg: float) -> dict[str, Any]:
    return {
        "title": f"Ledger posted · {ref}",
        "body": f"{fmt.kg(kg)} diverted from disposal with invoices behind every kilo. The BRSR row is ready.",
    }


def push_closed(*, net: float, itc: float, kg: float, cartons: int) -> dict[str, Any]:
    return {
        "title": f"Batch closed · {cartons} cartons destroyed",
        "body": f"{fmt.inr(net)} recovered, {fmt.inr(itc)} GST credit kept, {fmt.kg(kg)} kept out of landfill.",
    }


def push_pickup(*, sku_name: str, units: int, days_left: int, godown: str) -> dict[str, Any]:
    return {
        "title": f"Pickup request · {base(sku_name)}",
        "body": f"{fmt.num(units)} packs of {base(sku_name)}, {days_left} days left, with the FSSAI checklist. Pickup "
        f"from {godown}?",
    }


def pickup_reply(*, day: str, spot: str) -> str:
    """the food bank's answer as it confirms the pickup (design3 JOURNEY.donation.reply)"""
    return f"{day} works. We'll serve them at {spot} this week."


def serving_spot(*, partner: str, city: str, spots: dict[str, dict[str, str]]) -> str:
    """where a food bank serves a donation: the one the data names for its city, else its own in that city"""
    return (spots.get(partner) or {}).get(city) or f"{possessive(partner)} serving point in {city}"


def push_pickup_confirmed(*, partner: str, units: int, sku_name: str, when: str, godown: str) -> dict[str, Any]:
    return {
        "title": f"{partner} confirmed",
        "body": f"{fmt.num(units)} packs of {base(sku_name)}, pickup {when} from {godown}.",
    }


def push_staff_open(*, sku_name: str, units: int, price_: float, godown: str) -> dict[str, Any]:
    """the plan's staff sale, open at the distributor's godown once the plan is approved (SC-86)"""
    return {
        "title": f"Staff sale · {base(sku_name)}",
        "body": f"{fmt.num(units)} packs of {base(sku_name)} for your staff at {price(price_)} a pack, at {godown}. "
        "Record what sold when the sale is over.",
    }


def staff_event(*, sold: int, units: int, godown: str) -> str:
    return f"Recorded the staff sale at {godown}: {fmt.num(sold)} of {fmt.num(units)} packs sold."


def push_staff_recorded(*, distributor: str, sku_name: str, sold: int, units: int) -> dict[str, Any]:
    return {
        "title": f"Staff sale recorded · {base(sku_name)}",
        "body": f"{distributor} sold {fmt.num(sold)} of {fmt.num(units)} packs to staff.",
    }


def declined_event(*, sku_name: str, units: int, reason: str) -> str:
    """the food-bank line that no partner takes, or that the partner turns down (SC-86)"""
    return f"No food bank takes the {fmt.num(units)} packs of {base(sku_name)}: {reason}."


def push_declined(*, sku_name: str, units: int, reason: str) -> dict[str, Any]:
    return {
        "title": f"Donation not taken · {base(sku_name)}",
        "body": f"{fmt.num(units)} packs stay at the godown: {reason}.",
    }


def listing_ended_event(*, listing_id: str, units: int) -> str:
    """the ExpireSoon lot that closed with no buyer (SC-86)"""
    return f"Lot {listing_id} closed unsold: {fmt.num(units)} packs stay at the godown."


def push_escalated(*, buyer: str, bid: float, ref: str, reserve: float) -> dict[str, Any]:
    return {
        "title": f"A bid needs you · {ref}",
        "body": f"{buyer} keeps bidding below the reserve (last ₹{bid:.2f}, reserve ₹{reserve:.2f}). The agent has "
        f"stopped countering; decide in the listing.",
    }


# --- the listing's chat ----------------------------------------------------------------------------------------------


def chat_bid(*, bid: float, units: int) -> str:
    return f"Can you do ₹{bid_price(bid)} for all {fmt.num(units)}?"


def chat_counter(*, counter: float, units: int, city: str) -> str:
    return f"₹{counter:.2f} for {fmt.num(units)}, {city} stock, dispatch within 24 h of balance."


def chat_accept(*, price_: float) -> str:
    return f"Ok, ₹{price_:.2f}. Token paid."


def chat_accepted_bid(*, price_: float, units: int) -> str:
    return f"₹{price_:.2f} for {fmt.num(units)} is accepted. Pay the token to confirm."


def chat_reply(*, units: int, city: str, best_before: str, ask: float) -> str:
    """the Negotiator's answer to a question, when the model's is not used"""
    return (
        f"{fmt.num(units)} packets in {city}, best before {fmt.date(best_before)}, at ₹{ask:.2f} a packet. Place a bid "
        f"to make an offer."
    )


def chat_price_nudge(*, figure: float) -> str:
    return f"To offer ₹{figure:.2f}, place it as a bid and I will answer it."
