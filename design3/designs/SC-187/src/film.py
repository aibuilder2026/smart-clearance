"""SC-187: the film's timeline, scene by scene, written to film.json for overlays.mjs (the overlays it renders) and
assemble.py (the cut). The voice-over leads: every scene is laid out on its spoken beats (vo/lines.json, the durations
in vo/durations.json), so each visual lands as its sentence is said, and the cut's length follows the narration.
Every figure is the two journeys' own (figures.json from the walk, the story's as the fallback); every pop-up is one
of backend-api's own pushes for the batches (pushes.json).

  python3 film.py [--voice kore]
"""

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ap = argparse.ArgumentParser()
ap.add_argument("--voice", default="en-IN-Chirp3-HD-Kore", help="the vo/<voice>/ folder whose beats time the cut")
ap.add_argument("--gap", type=float, default=0.35, help="seconds between two beats of one line")
ap.add_argument("--take", default="take", help="which take of each beat: take, fast108, fast115")
ap.add_argument("--tail", type=float, default=1.0, help="scales every scene's tail (the breath after its last beat)")
A = ap.parse_args()

pushes = json.loads((HERE / "pushes.json").read_text()) if (HERE / "pushes.json").exists() else {}
figures = json.loads((HERE / "figures.json").read_text()) if (HERE / "figures.json").exists() else {}
durations = json.loads((HERE / "vo" / "durations.json").read_text()) if (HERE / "vo" / "durations.json").exists() else {}
_lp = HERE / "lines.json" if (HERE / "lines.json").exists() else HERE / "vo" / "lines.json"
_lines_raw = json.loads(_lp.read_text()) if _lp.exists() else []
lines = _lines_raw if isinstance(_lines_raw, list) else _lines_raw.get("lines", [])

# ---- the voice's beats --------------------------------------------------------------------------------------------

BEATS: dict[str, dict] = {}
for ln in lines:
    for b in ln.get("beats", []):
        BEATS[b["id"]] = b


TAKES: dict[str, dict] = {}
_v = (durations.get("voices") or {}).get(A.voice) or {}
for _ln in _v.get("lines", []):
    for _b in _ln.get("beats", []):
        TAKES[_b["id"]] = _b.get(A.take) or _b.get("take") or {}


def _probe(path: Path) -> float:
    import subprocess
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], text=True, capture_output=True).stdout.strip()
    return float(out or 0)


def beat_len(bid: str) -> float:
    """a beat's spoken length: the chosen voice's take, trimmed of silence (durations.json, else the file itself), else
    an estimate from its words"""
    t = TAKES.get(bid)
    if t and t.get("trimmed"):
        return float(t["trimmed"])
    f = HERE / "vo" / A.voice / f"{bid}-trim.wav"
    if f.exists():
        return _probe(f)
    words = len(BEATS.get(bid, {}).get("text", "x " * 12).split())
    return words / 2.45


def beat_file(bid: str) -> str:
    t = TAKES.get(bid) or {}
    f = t.get("file")
    if f:
        trimmed = f.replace(".wav", "-trim.wav")
        return trimmed if (HERE / trimmed).exists() else f
    return f"vo/{A.voice}/{bid}-trim.wav"


# ---- the figures ---------------------------------------------------------------------------------------------------

def inr(x: float) -> str:
    return "₹" + f"{round(x):,}"


_cases = figures.get("cases") or {}
_chips = _cases.get("MF-2409-117") or {}
_mango = _cases.get("MF-2410-118") or {}
_rows = figures.get("rows") or {}
_cr = (_rows.get("MF-2409-117") or {}).get("figures") or {}
_mr = (_rows.get("MF-2410-118") or {}).get("figures") or {}
_cplan, _mplan = _chips.get("plan") or {}, _mango.get("plan") or {}
_clines = {x["id"]: x for x in _cplan.get("lines", [])}
_mlines = {x["id"]: x for x in _mplan.get("lines", [])}
_cdocs = {d.get("id"): d for d in _chips.get("docs", [])}
_mdocs = {d.get("id"): d for d in _mango.get("docs", [])}
import re as _re
CHIPS, MANGO = "MF-2409-117", "MF-2410-118"
F = {
    # the Watcher's reading at Detect, as the Detect screens and push say (the plan a day on reads 1,372 / ₹26,562)
    "atRisk": "1,360",
    "writeOff": "₹26,330",
    "net": inr(_cplan.get("net", 21770)),
    "swing": inr(_cplan.get("swing", 26330)),
    "mnet": inr(_mplan.get("net", 16917.1)),
    "kirana": f"{_clines.get('kirana', {}).get('units', 588):,}",
    "shops": str(((_chips.get("journey") or {}).get("offer") or {}).get("ordered", 31)),
    "lot": f"{_clines.get('expiresoon', {}).get('units', 772):,}",
    "counter": f"₹{float(((_chips.get('award') or {}).get('price') or 14.20)):.2f}",
    "staff": f"{_mlines.get('staff', {}).get('units', 150):,}",
    "staffPrice": f"₹{_mlines.get('staff', {}).get('price', 8):g}",
    "foodbank": f"{_mlines.get('foodbank', {}).get('units', 58):,}",
    "meals": f"{_mr.get('meals', 58)}",
    "actual": inr((_chips.get("actual") or {}).get("net", 21152.4)),
    "mactual": inr((_mango.get("actual") or {}).get("net", 16917.1)),
    "itcKept": inr(_cr.get("itcKept", 1224)),
    "kg": f"{round(_cr.get('kg', 217.6)):,} kg",
    "co2": f"{round(_cr.get('co2', 544))} kg",
    "bothKg": f"{round(_cr.get('kg', 217.6) + _mr.get('kg', 345.7)):,} kg",
    "bothCo2": f"{(_cr.get('co2', 544) + _mr.get('co2', 864)) / 1000:.1f} t",
    "inv": (_cdocs.get("invoice") or {}).get("no") or "INV/26-27/0931",
    "cn": (_cdocs.get("support") or {}).get("no") or "CN/0117",
    "mcn": (_mdocs.get("support") or {}).get("no") or "CN/0118",
    "receipt": (_mdocs.get("receipt") or {}).get("no") or "FI/HYD/26-27/0417",
}


def push(ref: str, key: str, to: str, title: str, body: str, left: bool = False) -> dict:
    p = (pushes.get(ref) or {}).get(key) or pushes.get(key) or {}
    return {"kind": "push", "to": to, "title": p.get("title") or title, "body": p.get("body") or body, "left": left}


_m = _re.search(r"ki ([\d,]+) units", ((pushes.get(CHIPS) or {}).get("detect") or {}).get("body", ""))
if _m:
    F["atRisk"] = _m.group(1)
PUSH = {
    "detect": push(CHIPS, "detect", "To Priya · Munchly Foods", "Masala Chips 50 g · Nagpur",
                   "Priya ji, Nagpur godown mein Masala Chips 50g (batch MF-2409-117) ki 1,360 units 18 Nov se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein."),
    "verify": push(CHIPS, "verify", "To Rakesh Traders · distributor", "Ek photo chahiye",
                   "Rakesh bhai, Masala Chips 50g ka ek carton ka label photo bhej dein (batch MF-2409-117). Bas ek photo, baaki hum kar lenge."),
    "plan": push(CHIPS, "plan", "To Priya · Munchly Foods", "Plan ready · MF-2409-117",
                 "Plan for MF-2409-117: 588 units kirana (₹18), 772 units ExpireSoon (₹14.20). Net ₹21,770, ₹26,330 better than write-off. GST ITC ₹1,224 safe. Tap to review and approve."),
    "approved": push(CHIPS, "approved", "To Rakesh Traders · distributor", "Plan approved · Masala Chips",
                     "Rakesh bhai, Munchly ne MF-2409-117 ka plan approve kiya: 588 packets aapke kiranas ko scheme par, 772 ExpireSoon par. Kuch rokna ho to app mein Pause dabayein."),
    "offer": push(CHIPS, "offer", "To Shree Sai Kirana · Nagpur", "आज का खास ऑफर",
                  "नमस्ते Shree Sai Kirana! Munchly Masala Chips 50g पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before 18 Nov 2026. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें — Rakesh Traders"),
    "staff": push(MANGO, "staff.open", "To Lakshmi Agencies · distributor", "Staff sale · Mango Drink",
                  "150 packs of Mango Drink for your staff at ₹8 a pack, at Begum Bazaar godown. Record what sold when the sale is over."),
    "pickup": push(MANGO, "pickup", "To Meera · Feeding India", "Pickup request · Mango Drink",
                   "58 packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup from Begum Bazaar godown?"),
    "papers": push(CHIPS, "papers", "To Priya · Munchly Foods", "Document pack ready · MF-2409-117",
                   "Papers ready for MF-2409-117: tax invoice, price-support credit note, GST memo. Nothing to chase."),
    "closed": push(CHIPS, "closed", "To Priya · Munchly Foods", "Batch closed · 0 packs left at the godown",
                   "₹21,152 recovered, ₹1,224 GST credit kept, 217.6 kg kept out of landfill."),
}

# ---- the segments --------------------------------------------------------------------------------------------------

overlays: dict[str, dict] = {}
segments: list[dict] = []
scenes: list[dict] = []
XF = 0.5


def scene(*beat_ids: str, at: float = 0.4, tail: float = 0.7) -> dict:
    """a scene carries the voice's beats, spoken from `at` seconds into its first segment; its segments share its length"""
    sc = {"beats": [{"id": b} for b in beat_ids], "voAt": at, "tail": round(tail * A.tail, 3), "segs": []}
    scenes.append(sc)
    return sc


def ov(id_: str, spec: dict) -> str:
    overlays[id_] = {"id": id_, **spec}
    return id_


def add(seg: dict) -> dict:
    seg.setdefault("overlays", [])
    seg.setdefault("weight", 1.0)
    if not scenes:
        scene()
    scenes[-1]["segs"].append(seg)
    segments.append(seg)
    return seg


def clip(name: str, *, speed: float = 0.85, min_: float = 4.5, max_: float = 0, **kw) -> dict:
    """a Veo clip (its keyframe while it renders): played at `speed`, cut to its share of the scene (at most 8 s of
    source, then held on its last frame)"""
    return add({"kind": "clip", "name": name, "key": "k" + name[1:], "speed": speed, "min": min_, "max": max_ or 8.0 / speed, **kw})


def screen(shot: str, *, bg: str, phone: bool = False, scroll: bool = False, zoom: float = 1.0, focus=None, min_: float = 3.5, **kw) -> dict:
    """one of the app's screens in a window (or a phone) on a blurred keyframe; `focus` closes in on a rectangle of the
    screenshot (x, y, w, h in the screenshot's own pixels), from `focusAt` for `focusFor` seconds"""
    return add({"kind": "screen", "shot": shot, "bg": bg, "phone": phone, "scroll": scroll, "zoom": zoom, "focus": focus, "min": min_, **kw})


def video(name: str, *, bg: str, phone: bool = False, speed: float = 1.0, min_: float = 3.5, **kw) -> dict:
    """a recorded interaction, played in the window"""
    return add({"kind": "video", "name": name, "bg": bg, "phone": phone, "speed": speed, "min": min_, **kw})


def still(name: str, *, zoom: float = 1.08, min_: float = 3.5, **kw) -> dict:
    """a full-frame picture (a diagram) with a slow drift"""
    return add({"kind": "still", "name": name, "zoom": zoom, "min": min_, **kw})


def beats(seg: dict, *ids: str, at: float = 0.4) -> None:
    """(kept for the scene form) the voice's beats start a new scene at this segment"""
    sc = scene(*ids, at=at)
    sc["segs"].append(scenes[-2]["segs"].pop()) if len(scenes) > 1 and scenes[-2]["segs"] and scenes[-2]["segs"][-1] is seg else None


def on(seg: dict, id_: str, spec: dict, at="start", until="end", slide: bool = False) -> None:
    """an overlay on the segment, timed in seconds or on a beat id ("6b" = when that beat starts, "6b:end" = when it ends)"""
    seg["overlays"].append({"id": ov(id_, spec), "at": at, "until": until, "slide": slide})


def caption(seg: dict, text: str, *, label: str | None = None, tone: str = "", at="start", until="end", right: bool = False) -> None:
    n = len(overlays)
    on(seg, f"cap-{n:03d}", {"kind": "caption", "text": text.format(F=F), "label": label, "tone": tone, "right": right}, at, until)


def lower(seg: dict, name: str, role: str, place: str = "", at=0.6, until=5.2) -> None:
    on(seg, f"lower-{name.split()[0].lower()}", {"kind": "lower", "name": name, "role": role, "place": place}, at, until)


def callout(seg: dict, id_: str, fig: str, what: str = "", *, x: int, y: int, w: int = 0, pill: str = "", tone: str = "", card: bool = True, ring=None, at="start", until="end") -> None:
    on(seg, id_, {"kind": "callout", "fig": fig.format(F=F), "what": what.format(F=F), "x": x, "y": y, "w": w, "pill": pill, "tone": tone, "card": card, "ring": ring}, at, until)


def chapter(seg: dict, n: str, text: str) -> None:
    seg["chapter"] = ov(f"ch-{n}", {"kind": "chapter", "n": n, "text": text})


# ---- the scenes ----------------------------------------------------------------------------------------------------
# The screenshots' names follow capture.mjs (src/screens/<stage>--<name>.png); SHOT maps the film's names to them so a
# renamed capture changes one line.
SHOT = {
    "console-overview": "quiet--neha-console-overview",
    "console-agents": "quiet--neha-console-munchly-agents",
    "command-at-risk": "detect--priya-command",
    "journey-flagged": "detect--priya-journey-chips",
    "rakesh-today-photo": "detect--rakesh-today-phone",
    "route-vision": "plan--priya-route-chips",
    "rakesh-photos": "plan--rakesh-photos",
    "route-plan": "plan--priya-route-chips",
    "approve-sheet": "plan--priya-approve-sheet",
    "execution-sent": "approve--priya-execution-chips",
    "kirana-offer": "approve--kirana-ganesh-offer-phone",
    "kirana-ordered": "orders--kirana-ganesh-offer-ordered-phone",
    "kirana-invoice": "orders--kirana-ganesh-invoice-phone",
    "execution-ordered": "orders--priya-execution-chips",
    "listing-live": "approve--agrawal-listing",
    "lot-won": "deal--agrawal-listing-won",
    "staff-recorded": "donation--lakshmi-today",
    "execution-won": "deal--priya-execution-chips",
    "execution-mango": "donation--priya-execution-mango",
    "meera-pickup": "approve--meera-pickups-phone",
    "meera-receipt": "donation--meera-receipt-sheet",
    "deliveries": "papers--rakesh-deliveries-done",
    "invoice-issued": "papers--paper-chips-invoice-issued",
    "credit-note": "settle--paper-chips-credit-note",
    "itc-memo": "settle--paper-chips-itc-memo",
    "record-destroyed": "history--priya-past-record",
    "certificate": "history--priya-past-papers",
    "execution-cleared": "ledger--priya-execution-chips-cleared",
    "ledger-money": "ledger--ledger-money",
    "ledger-gst": "ledger--ledger-gst",
    "ledger-impact": "ledger--ledger-impact",
    "batch-impact": "ledger--batch-chips-impact",
    "console-food": "ledger--neha-console-overview",
    "demo-map": "extra--demo-route-map",
    "signin": "quiet--signin",
}


def S(k: str) -> str:
    return SHOT[k]


# 1. the problem
scene("1a", "1b", "1c", at=0.9, tail=0.5)
s = clip("c01-godown-date", speed=0.8, min_=4.5, weight=2)
on(s, "st-1", {"kind": "statement", "text": "Stock going __short-dated__."}, at="1a", until="1b")
on(s, "st-2", {"kind": "statement", "text": "The quick-commerce gates close. {{Nobody wants it.}}"}, at="1b", until="end")
lower(s, "Rakesh bhai", "Rakesh Traders · the chips' distributor", "Nagpur", at=0.8, until=4.6)
s = clip("c13-lakshmi-godown", speed=0.8, min_=4.5, weight=1)
on(s, "st-3", {"kind": "statement", "text": "Written off. {{GST credit reversed.}} Landfill."}, at="1c", until="end")
lower(s, "Lakshmi", "Lakshmi Agencies · the Mango Drink's distributor", "Begum Bazaar, Hyderabad", at=0.4, until=4.6)

# 2. Smart-Clearance
scene("2a", "2b", "2c", at=1.0, tail=0.5)
s = clip("r1-bay-dawn", speed=0.9, min_=5, weight=1.2)
on(s, "title", {"kind": "title", "title": "Smart-Clearance", "text": "Near-expiry stock, routed by AI agents. **One yes** from a person.", "sub": "Software as a service · for manufacturers"}, at=0.4, until="end")
s = screen(S("console-overview"), bg="k11-neha-console", scroll=True, min_=4, weight=1)
chapter(s, "1", "A SaaS, run by agents")
caption(s, "One workspace per brand, set up and watched by Smart-Clearance's staff in the **console**.", label="The staff console")
s = still("agents-nine-stops", zoom=1.3, anchor=0.3, min_=4, weight=1.2)
chapter(s, "1", "A SaaS, run by agents")
caption(s, "**Ten agents on Gemini** along nine stops: Data, Watcher, Vision, Valuer, Router, Lister, Outreach, Negotiator, Paperwork, Impact. Nothing executes before a person's yes.", label="Agentic by design", tone="amber")

# 3. detect
scene("3a", "3b", "3c", at=0.5, tail=0.5)
s = clip("c02-priya-phone", speed=0.85, min_=4.5, weight=1.2)
chapter(s, "2", "Detect")
lower(s, "Priya Deshmukh", "Munchly Foods · supply chain, the one yes", "Pune", at=0.5, until=4.8)
on(s, "push-detect", PUSH["detect"], at=2.0, until="end", slide=True)
s = screen(S("command-at-risk"), bg="k02-priya-phone", focus=[544, 448, 1856, 1150], min_=4, weight=1)
chapter(s, "2", "Detect")
caption(s, "Every morning the **Watcher** checks every batch at every distributor against sell-through and the quick-commerce gates.", label="Watcher")
s = screen(S("journey-flagged"), bg="k02-priya-phone", scroll=True, min_=4, weight=1)
chapter(s, "2", "Detect")
callout(s, "co-risk", "{F[atRisk]} packs at risk", "**{F[writeOff]}** if destroyed", x=96, y=520, pill="Masala Chips · MF-2409-117", tone="red")

# 4. verify
scene("4a", at=0.5, tail=0.5)
s = clip("c03-rakesh-label-photo", speed=0.85, min_=4.5, weight=1)
chapter(s, "3", "Verify")
on(s, "push-verify", PUSH["verify"], at=1.2, until="end", slide=True)
s = screen(S("route-vision"), bg="k03-rakesh-label-photo", focus=[540, 1230, 1870, 760], min_=5, weight=1.4)
chapter(s, "3", "Verify")
caption(s, "**Vision** reads the label and matches the batch, the dates and the MRP to the DMS export: the barcode, the QR code and the FSSAI licence on the carton.", label="Vision · Gemini")

# 5. value, decide, approve
scene("5a", "5b", "5c", "5d", at=0.4, tail=0.5)
s = screen(S("route-plan"), bg="k02-priya-phone", focus=[540, 2080, 1870, 720], min_=4.5, weight=1.2)
chapter(s, "4", "Value, decide, approve")
on(s, "push-plan", PUSH["plan"], at=0.4, until=4.5, slide=True)
caption(s, "The **Valuer** prices every exit against the bin, per unit, after costs and GST.", label="Valuer")
s = screen(S("route-plan"), bg="k02-priya-phone", focus=[540, 2890, 1870, 640], min_=4, weight=1)
chapter(s, "4", "Value, decide, approve")
caption(s, "The **Router** splits the batch and says why: **{F[kirana]}** to the kiranas, **{F[lot]}** to ExpireSoon. Net **{F[net]}**, **{F[swing]}** better than the bin.", label="Router")
s = clip("c04-priya-approve", speed=0.8, min_=4, weight=1)
chapter(s, "4", "Value, decide, approve")
callout(s, "co-yes", "One yes", "logged with who, when and the device", x=110, y=120, pill="The human in the loop", tone="amber", card=True)
s = video("ui-approve", bg="k04-priya-approve", min_=4, weight=1, speed=1.3, seek=5, fallback=S("approve-sheet"))
chapter(s, "4", "Value, decide, approve")
on(s, "push-approved", PUSH["approved"], at=1.5, until="end", slide=True)
caption(s, "Approved. The distributor is told, with a Pause, and the agents set off.", label="Approve", tone="amber")

# 6. execute: the five channels
scene("6a", "6b", "6c", "6d", "6e", "6f", at=0.5, tail=0.5)
s = clip("c05-kirana-nagpur-offer", speed=0.85, min_=4, weight=1)
chapter(s, "5", "Execute · five channels")
lower(s, "Ganesh ji", "Shree Sai Kirana · one of 38 shops offered", "Nagpur", at=0.4, until=4.0)
on(s, "push-offer", PUSH["offer"], at=1.0, until="end", slide=True)
s = video("ui-order", bg="k05-kirana-nagpur-offer", phone=True, min_=4, weight=1, speed=1.3, seek=2, fallback=S("kirana-ordered"))
chapter(s, "5", "Execute · five channels")
callout(s, "co-shops", "{F[shops]} shops · {F[kirana]} packets", "each order with its own tax invoice", x=110, y=120, pill="Outreach · the kirana scheme")
s = screen(S("lot-won"), bg="k06-agrawal-raipur", focus=[1968, 584, 1152, 650], min_=3.5, weight=1)
chapter(s, "5", "Execute · five channels")
callout(s, "co-lot", "{F[lot]} packs at {F[counter]}", "listed by the **Lister**, countered by the **Negotiator**, won by Agrawal Wholesale", x=110, y=120, pill="ExpireSoon", tone="violet")
s = clip("c06-agrawal-raipur", speed=0.9, min_=3.5, weight=1)
chapter(s, "5", "Execute · five channels")
lower(s, "Agrawal ji", "Agrawal Wholesale · the ExpireSoon buyer", "Raipur", at=0.3, until=3.6)
s = clip("c07-staff-sale-gate", speed=0.85, min_=4, weight=1)
chapter(s, "5", "Execute · five channels")
on(s, "push-staff", PUSH["staff"], at=0.6, until=5.5, slide=True)
s = screen(S("staff-recorded"), bg="k07-staff-sale-gate", focus=[544, 1120, 1920, 390], min_=3.5, weight=1)
chapter(s, "5", "Execute · five channels")
callout(s, "co-staff", "{F[staff]} packs at {F[staffPrice]}", "recorded on the consolidated UPI receipt, read by **Vision**", x=110, y=120, pill="The staff sale")
s = clip("c08-feeding-india-van", speed=0.85, min_=4, weight=1)
chapter(s, "5", "Execute · five channels")
lower(s, "Meera", "Feeding India · city lead", "Hyderabad", at=0.3, until=3.8)
on(s, "push-pickup", PUSH["pickup"], at=0.8, until="end", slide=True)
s = screen(S("meera-receipt"), bg="k08-feeding-india-van", focus=[2700, 40, 460, 560], min_=3.5, weight=1)
chapter(s, "5", "Execute · five channels")
callout(s, "co-meals", "{F[foodbank]} packs · {F[meals]} meals", "receipt **{F[receipt]}**, in the food bank's own series", x=110, y=120, pill="The donation")
s = screen(S("deliveries"), bg="k05-kirana-nagpur-offer", scroll=True, min_=3.5, weight=1)
chapter(s, "5", "Execute · five channels")
caption(s, "The Saturday **van round** delivers the scheme to every shop that ordered.", label="Delivery")

# 7. the papers, GST, and the second yes
scene("7a", "7b", "7c", "7d", "7e", at=0.4, tail=0.5)
s = clip("c09-rakesh-tally-desk", speed=0.85, min_=4, weight=1)
chapter(s, "6", "The papers")
on(s, "push-papers", PUSH["papers"], at=0.7, until="end", slide=True)
s = screen(S("invoice-issued"), bg="k09-rakesh-tally-desk", focus=[2200, 1050, 920, 440], min_=4.5, weight=1.2)
chapter(s, "6", "The papers")
caption(s, "The distributor's **tax invoice** {F[inv]}, issued from Tally: its e-invoice IRN, acknowledgement and signed QR code.", label="Paperwork · the tax invoice")
s = screen(S("invoice-issued"), bg="k09-rakesh-tally-desk", focus=[2200, 3700, 920, 380], min_=3.5, weight=0.8)
chapter(s, "6", "The papers")
caption(s, "Signed by the proprietor over the firm's stamp. Every paper is.", label="Signed and stamped")
s = screen(S("credit-note"), bg="k09-rakesh-tally-desk", scroll=True, min_=4, weight=1)
chapter(s, "6", "The papers")
caption(s, "The **price-support credit note** {F[cn]}: Munchly makes the distributor whole. A financial note, no GST adjustment.", label="Credit note")
s = screen(S("itc-memo"), bg="k09-rakesh-tally-desk", focus=[2200, 1100, 920, 720], min_=5, weight=1.3)
chapter(s, "6", "The papers")
callout(s, "co-itc", "{F[itcKept]} of input GST kept", "reversed only on packs given away or destroyed · s.17(5)(h)", x=110, y=120, pill="The GST ITC memo")
s = screen(S("record-destroyed"), bg="k10-landfill-certificate", focus=[583, 614, 2500, 870], min_=4, weight=1)
chapter(s, "6", "When packs cannot sell")
caption(s, "Destroyed at the godown, against evidence: the label, the before and the after photos, each checked by **Vision**, on the batch's record.", label="The second yes", tone="amber")
s = clip("c10-landfill-certificate", speed=0.85, min_=3.5, weight=0.8)
chapter(s, "6", "When packs cannot sell")
s = video("ui-sign", bg="k10-landfill-certificate", min_=4.5, weight=1.2, speed=1.5, seek=22, fallback=S("certificate"))
chapter(s, "6", "When packs cannot sell")
caption(s, "The **certificate of destruction** is signed in place, on the distributor's screen: the agency's officer, two witnesses, the distributor.", label="Signed in place", tone="amber")
s = screen(S("certificate"), bg="k10-landfill-certificate", focus=[2160, 888, 896, 1190], min_=4, weight=1)
chapter(s, "6", "When packs cannot sell")
caption(s, "On Priya's second yes: the **expiry credit note** makes the distributor whole, and the batch closes.", label="The second yes", tone="amber")

# 8. the ledger, GST, ESG
scene("8a", "8b", "8c", "8d", at=0.4, tail=0.5)
s = screen(S("execution-cleared"), bg="k14-office-dashboard", min_=3.5, weight=1)
chapter(s, "7", "The ledger")
on(s, "push-closed", PUSH["closed"], at=0.5, until="end", slide=True)
s = screen(S("ledger-money"), bg="k14-office-dashboard", focus=[544, 560, 2576, 540], min_=4, weight=1.2)
chapter(s, "7", "The ledger")
callout(s, "co-money", "{F[actual]} · {F[mactual]}", "recovered on the chips and the Mango Drink, against the write-off", x=110, y=120, pill="Money")
s = screen(S("ledger-gst"), bg="k14-office-dashboard", scroll=True, min_=3.5, weight=1)
chapter(s, "7", "The ledger")
caption(s, "GST: input credit kept and reversed under s.17(5)(h), invoice by invoice, exported as the CA receives it.", label="GST")
s = screen(S("ledger-impact"), bg="k14-office-dashboard", focus=[545, 572, 2567, 1343], min_=4.5, weight=1.3)
chapter(s, "7", "The ledger")
callout(s, "co-impact", "{F[bothKg]} · {F[bothCo2]} CO₂e · {F[meals]} meals", "the two batches: kept out of landfill, the CO₂e avoided, the meals served; BRSR Principle 6 with its evidence", x=110, y=120, pill="Impact · ESG")
s = screen(S("batch-impact"), bg="k14-office-dashboard", focus=[544, 512, 1776, 336], min_=3.5, weight=1)
chapter(s, "7", "The ledger")
caption(s, "The batch's own **BRSR line** and its evidence: {F[inv]} · the kirana order logs · {F[cn]}; the BRSR table and the GST summary export in a click.", label="BRSR")

# 9. everyone ends whole
scene("9a", "9b", at=0.5, tail=1.0)
s = clip("r4-office-dashboard", speed=0.9, min_=5, weight=1.2)
chapter(s, "8", "Everyone ends whole")
on(s, "end-cards", {"kind": "end", "cards": [
    {"who": "Munchly Foods", "fig": F["actual"], "what": f"recovered on the chips, against a {F['writeOff']} write-off"},
    {"who": "The distributors", "fig": "end whole", "what": "the price support makes up the difference"},
    {"who": f"{F['shops']} kiranas", "fig": "earn", "what": f"on {F['kirana']} packets at a scheme price, invoice in hand"},
    {"who": "Feeding India", "fig": f"{F['meals']} meals", "what": "with the receipt that proves it"}],
    "links": [], "built": ""}, at=0.5, until="end")
s = screen(S("demo-map"), bg="k12-close-lane", zoom=1.04, min_=4, weight=1)
chapter(s, "8", "Everyone ends whole")
caption(s, "**The guided demo:** the console's line and three journeys, on real screens. **The live prototype:** sign in with the credentials and steps in the deck.", label="Try it", tone="amber")
s = clip("c12-close-lane", speed=0.8, min_=5, weight=1)
on(s, "end-brand", {"kind": "end", "cards": [], "links": [{"label": "smartclearance.web.app", "text": ""}, {"label": "Guided demo", "text": "smartclearance-demo.web.app"}, {"label": "Live prototype", "text": "credentials in the deck", "amber": True}],
    "built": "Built on Google Cloud: Gemini on Vertex AI · ADK · Cloud Run · Cloud SQL · Pub/Sub · BigQuery · Firebase"}, at=0.6, until="end")

# ---- the timing ----------------------------------------------------------------------------------------------------

FPS = 24


def lay_out(sc: dict) -> None:
    """the scene's length from its beats, shared among its segments by weight over their minimums; every overlay's
    seconds from its beat references (a beat is a moment on the scene's own clock)"""
    segs = sc["segs"]
    if not segs:
        return
    t = sc["voAt"]
    marks: dict[str, float] = {}
    for b in sc["beats"]:
        b["at"], b["len"], b["file"] = round(t, 3), round(beat_len(b["id"]), 3), beat_file(b["id"])
        marks[b["id"]], marks[b["id"] + ":end"] = b["at"], b["at"] + b["len"]
        t += b["len"] + A.gap
    need = (t - A.gap + sc["tail"]) if sc["beats"] else 0.0
    mins = [x["min"] for x in segs]
    visible = max(sum(mins) - XF * (len(segs) - 1), need)  # what the viewer sees, the crossfades overlapping
    extra = visible - (sum(mins) - XF * (len(segs) - 1))
    weights = [x["weight"] for x in segs]
    for x, m, w in zip(segs, mins, weights):
        x["seconds"] = round(m + extra * w / sum(weights), 3)
    # a clip longer than its source holds its last frame
    for x in segs:
        if x["kind"] == "clip":
            x["hold"] = round(max(0.0, x["seconds"] - x["max"]), 3)
    # each segment's offset on the scene's clock, and its overlays
    off = 0.0
    for x in segs:
        x["sceneOffset"] = round(off, 3)
        m2 = {"start": 0.0, "end": x["seconds"], **{k: v - off for k, v in marks.items()}}
        for o in x["overlays"]:
            for k in ("at", "until"):
                v = o[k]
                if isinstance(v, str):
                    if v not in m2:
                        raise SystemExit(f"{x.get('shot') or x.get('name')}: overlay {o['id']} refers to {v}, which the scene does not carry")
                    v = m2[v] + (-0.15 if k == "at" and v not in ("start", "end") else 0)
                o[k] = round(max(0.0, min(v, x["seconds"])), 3)
            if o["until"] <= o["at"]:
                o["until"] = x["seconds"]
        off += x["seconds"] - XF


for sc in scenes:
    lay_out(sc)

# absolute times: each segment starts a crossfade before the last ends; the beats on the film's clock
t = 0.0
vo_track = []
for sc in scenes:
    sc["start"] = round(t, 3)
    for b in sc["beats"]:
        vo_track.append({"id": b["id"], "file": b["file"], "at": round(t + b["at"], 3), "len": b["len"]})
    for x in sc["segs"]:
        x["start"] = round(t, 3)
        t += x["seconds"] - XF
total = t + XF
film = {"fps": FPS, "width": 1920, "height": 1080, "xfade": XF, "voice": A.voice, "total": round(total, 3), "segments": segments, "overlays": list(overlays.values()), "vo": vo_track,
        "scenes": [{"start": sc["start"], "beats": [b["id"] for b in sc["beats"]], "segs": len(sc["segs"])} for sc in scenes]}
(HERE / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False))
vo_len = sum(b["len"] for b in vo_track)
print(f"film.json: {len(scenes)} scenes, {len(segments)} segments, {len(overlays)} overlays, {len(vo_track)} beats ({vo_len:.0f} s of voice), {total:.1f} s ({total/60:.2f} min)")
if total > 180:
    print(f"OVER 180 s by {total-180:.1f} s")
