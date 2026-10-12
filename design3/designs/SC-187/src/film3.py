"""SC-187 cut 3 (cut 2's timeline, revised on the maintainer's notes of 12 Oct): the film's timeline, scene by scene, written to film.json for overlays.mjs (the overlays it renders) and
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
ap.add_argument("--voice", default="cut2-Kore", help="the vo/<voice>/ folder whose beats time the cut")
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



# ---- the pop-ups: backend-api's own pushes for the batches, as cut 1 kept them (pushes.json) -----------------------------
CHIPS, MANGO = "MF-2409-117", "MF-2410-118"


def push(ref: str, key: str, to: str, title: str, body: str, left: bool = False) -> dict:
    p = (pushes.get(ref) or {}).get(key) or {}
    return {"kind": "push", "to": to, "title": p.get("title") or title, "body": p.get("body") or body, "left": left}


PUSH = {
    "detect": push(CHIPS, "detect", "To the supply planner", "A batch at risk", "A batch at a distributor's godown will not sell before its date. Tap to see the route."),
    "verify": push(CHIPS, "verify", "To the distributor", "Ek photo chahiye", "Bas ek photo of the carton label, baaki hum kar lenge."),
    "approved": push(CHIPS, "approved", "To the distributor", "Plan approved", "The brand approved the plan. Kuch rokna ho to app mein Pause dabayein."),
    "offer": push(CHIPS, "offer", "To a kirana", "आज का खास ऑफर", "10 पैकेट लो, 2 मुफ़्त. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें"),
    "staff": push(MANGO, "staff.open", "To the distributor", "Staff sale", "Packs for your staff at the godown. Record what sold when the sale is over."),
    "pickup": push(MANGO, "pickup", "To the food bank", "Pickup request", "Packs with days left, with the FSSAI checklist. Pickup from the godown?"),
    "papers": push(CHIPS, "papers", "To the supply planner", "Document pack ready", "Papers ready: tax invoice, price-support credit note, GST memo. Nothing to chase."),
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


def clip(name: str, *, speed: float = 0.85, min_: float = 4.5, max_: float = 0, seek: float = 0, **kw) -> dict:
    """a Veo clip (its keyframe while it renders): played at `speed` from `seek` seconds in, cut to its share of the
    scene (at most what is left of its 8 s of source, then held on its last frame). The review (src/eyes.py) sets each
    clip's clean window."""
    return add({"kind": "clip", "name": name, "key": "k" + name[1:], "speed": speed, "seek": seek, "min": min_, "max": max_ or (8.0 - seek) / speed, **kw})


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


def on(seg: dict, id_: str, spec: dict, at="start", until="end", slide: bool = False, motion: str = "") -> None:
    """an overlay on the segment, timed in seconds or on a beat id ("6b" = when that beat starts, "6b:end" = when it ends);
    its motion: "rise" (a label into place), "banner" (a notification springing down), "slide" (cut 2's pop-up)"""
    seg["overlays"].append({"id": ov(id_, spec), "at": at, "until": until, "slide": slide, "motion": motion or ("slide" if slide else ""), "anim": spec.get("kind") == "anim"})


def banner(seg: dict, key: str, *, at=1.0, until="end") -> None:
    """a push as the phone shows it: inside the phone's screen on a phone segment, at the frame's top right elsewhere"""
    n = len(overlays)
    on(seg, f"bn-{n:03d}", {**PUSH[key], "kind": "banner", "phone": bool(seg.get("phone")) and seg["kind"] == "video"}, at, until, motion="banner")


_bg = ""


def set_bg(key: str) -> None:
    """the keyframe behind the app's screens from here on: the chapter's own scene, out of focus"""
    global _bg
    _bg = key


def anim(name: str, *, min_: float = 5, weight: float = 1, at: float = 0.3) -> dict:
    """an animation (src/anim/<name>/) on the ground, in the window's place"""
    s = card(min_=min_, weight=weight)
    on(s, name, {"kind": "anim"}, at=at, until="end")
    return s


def chapter_open(seg: dict, n: str, title: str, text: str, stops: list, *, dark: bool = False) -> None:
    """the chapter opens over the scene it starts on: a veil, the name, one line and the nine stops, then the screen comes clear"""
    seg["open"] = True
    on(seg, f"co-{n.split()[-1]}", {"kind": "chapter-open", "n": n, "title": title, "text": text, "on": stops, "dark": dark}, at=0.2, until=3.6, motion="rise")


def caption(seg: dict, text: str, *, label: str | None = None, tone: str = "", at="start", until="end", right: bool = False) -> None:
    n = len(overlays)
    on(seg, f"cap-{n:03d}", {"kind": "caption", "text": text.format(F=F), "label": label, "tone": tone, "right": right}, at, until)


def lower(seg: dict, name: str, role: str, place: str = "", at=0.6, until=5.2) -> None:
    on(seg, f"lower-{name.split()[0].lower()}", {"kind": "lower", "name": name, "role": role, "place": place}, at, until)


def callout(seg: dict, id_: str, fig: str, what: str = "", *, x: int, y: int, w: int = 0, pill: str = "", tone: str = "", card: bool = True, ring=None, at="start", until="end") -> None:
    on(seg, id_, {"kind": "callout", "fig": fig.format(F=F), "what": what.format(F=F), "x": x, "y": y, "w": w, "pill": pill, "tone": tone, "card": card, "ring": ring}, at, until)


def chapter(seg: dict, n: str, text: str) -> None:
    seg["chapter"] = ov(f"ch-{n}", {"kind": "chapter", "n": n, "text": text})



# ---- cut 2: generic, no names and no figures; the app recorded; pointers and feature labels ----------------------------
# The window's geometry (assemble.py, layout "right"), so a pointer given in a screen's CSS pixels lands beside its element.
DESK = {"x0": 650, "y0": 110, "k": 1230 / 1600}
PHONE = {"x0": 692, "y0": 40, "k": 416 / 390}


def pt(seg: dict, id_: str, cx: float, cy: float, text: str, *, at=0.7, until=3.2, tone: str = "", phone: bool = False) -> None:
    """a pointer beside the element at (cx, cy) CSS pixels of the screen, with its label; the label goes left of a
    point in the right half of the frame"""
    g = PHONE if (phone or seg.get("phone")) else DESK
    x, y = round(g["x0"] + cx * g["k"]), round(g["y0"] + cy * g["k"])
    on(seg, id_, {"kind": "pointer", "x": x, "y": y, "text": text, "left": x > 1150, "tone": tone}, at, until, motion="rise")


def feature(seg: dict, eyebrow: str, text: str, *, at="start", until="end", dark: bool = False) -> None:
    n = len(overlays)
    on(seg, f"ft-{n:03d}", {"kind": "feature", "eyebrow": eyebrow, "text": text, "dark": dark}, at, until, motion="rise")


def role(seg: dict, who: str, where: str = "", at=0.6, until=4.6) -> None:
    n = len(overlays)
    on(seg, f"role-{n:03d}", {"kind": "role", "who": who, "where": where}, at, until, motion="rise")


def rec(name: str, *, phone: bool = False, min_: float = 5, weight: float = 1, speed: float = 1.0, seek: float = 0, fallback: str | None = None, **kw) -> dict:
    """a recording of the working app (src/tour/<name>.mp4), in the window on the studio ground"""
    return add({"kind": "video", "name": name, "phone": phone, "min": min_, "weight": weight, "speed": speed, "seek": seek, "fallback": fallback or "", "layout": "right", "bg": _bg, **kw})


def card(min_: float = 3.0, weight: float = 0.6, **kw) -> dict:
    """the ground alone, for the overlays on it"""
    return add({"kind": "card", "min": min_, "weight": weight, "bg": _bg, **kw})




# 1. the problem: the brand, the distributor and the trade looking at stock, before anything is routed
scene("1a", "1b", "1c", "1d", "1e", at=1.0, tail=0.6)
s = clip("c51-brand-office", speed=0.8, max_=7.5, min_=5, weight=1.1)
on(s, "st-1", {"kind": "statement", "text": "Good products, __out of time__."}, at="1a", until="1b")
role(s, "A brand's supply planning team", "the morning stock review", at=0.6, until=4.6)
s = clip("c52-dist-office", speed=0.55, max_=7.3, min_=4.5, weight=1)
on(s, "st-2", {"kind": "statement", "text": "A batch, waiting, as its date draws closer."}, at="1b", until="1c")
role(s, "A distributor", "his office, by the godown", at=0.4, until=4.2)
s = clip("c53-qc-dock", speed=0.85, max_=7.0, min_=4.5, weight=1)
on(s, "st-3", {"kind": "statement", "text": "The quick-commerce gates close. {{The shelves close.}}"}, at="1c", until="1d")
role(s, "A quick-commerce receiving dock", "the batch on hold", at=0.4, until=4.0)
s = clip("c54-write-off", speed=0.85, max_=7.0, min_=4.5, weight=1)
on(s, "st-4", {"kind": "statement", "text": "Written off. {{GST credit reversed.}} Landfill."}, at="1d", until="1e")
s = clip("c55-kirana-empty", speed=0.85, max_=7.0, min_=4.5, weight=1)
on(s, "st-5", {"kind": "statement", "text": "Everyone loses."}, at="1e", until="end")
role(s, "A kirana", "the shelf that stayed empty", at=0.4, until=4.0)

# 2. Smart-Clearance
scene("2a", "2b", "2c", "2d", "2e", "2f", "2g", at=1.4, tail=0.6)
set_bg("k56-factory-dawn")
s = clip("c56-factory-dawn", speed=0.6, max_=6.7, min_=6, weight=1.2)
on(s, "title", {"kind": "title", "title": "Smart-Clearance", "text": "Near-expiry stock, routed by AI agents. **One yes** from a person.", "sub": "Software as a service · for manufacturers"}, at=0.4, until="end")
s = rec("quiet--site-hero", min_=6, weight=1.1, fallback="extra--landing-hero")
chapter(s, "1", "Smart-Clearance")
feature(s, "Software as a service", "One platform for manufacturers, built around an **ecosystem of AI agents**.")
s = rec("quiet--console-supply", min_=6, weight=1.1, fallback="quiet--neha-console-munchly-supply")
chapter(s, "1", "Smart-Clearance")
feature(s, "A workspace per brand", "Set up for its supply chain: its **distributors and super stockists**, its gates, its exits, its rules.")
pt(s, "p-supply", 1180, 330, "The brand's distributors and their godowns", at=1.0, until=4.5)
s = anim("agents-ring", min_=5.5, weight=1.1)
chapter(s, "1", "Smart-Clearance")
feature(s, "Agentic by design", "**Ten agents**, working together along **nine stops**, on Gemini.")
s = anim("nine-stops", min_=5.5, weight=1.2)
chapter(s, "1", "Smart-Clearance")
feature(s, "Nine stops", "Detect, verify, value, decide, execute, settle, report. Then the **one yes**.")
s = rec("quiet--console-overview", min_=6, weight=1.2, fallback="quiet--neha-console-overview")
chapter(s, "1", "Smart-Clearance")
feature(s, "The human in the loop", "Nothing moves before a person's **yes**. The staff console watches every client's batches and agents at work.")
pt(s, "p-agents-at-work", 900, 420, "The agents at work, stop by stop", at=1.0, until=4.5)
s = clip("c58-depot", speed=0.4, max_=5.5, min_=5, weight=1.1)
chapter(s, "1", "Smart-Clearance")
feature(s, "The whole chain", "The manufacturer, the distributor, the super stockist, the kirana, the buyer, the staff, the food bank: **each on their own screen, acting in their own name**.", dark=True)
role(s, "A super stockist", "the depot", at=0.4, until=4.2)
s = rec("quiet--console-people", min_=4.5, weight=0.9, fallback="quiet--neha-console-munchly")
chapter(s, "1", "Smart-Clearance")
feature(s, "Every party, their own sign-in", "Partners act through their own accounts; **nobody stands in for anyone**.")

# 3. connect and detect
set_bg("k51-brand-office")
scene("3a", "3b", "3c", "3d", "3e", at=0.9, tail=0.6)
s = rec("quiet--setup", min_=8, weight=1.3, fallback="quiet--priya-command")
chapter_open(s, "Chapter 1", "Connect and detect", "The stock data the distributor already has, and the morning check.", ["Connect", "Detect"])
chapter(s, "2", "Connect and detect")
feature(s, "The Data agent", "The stock export **mapped field by field**, and the sell-through loaded. Nothing keyed in twice.", at=3.6)
pt(s, "p-export", 700, 420, "The export, mapped by the Data agent", at=1.0, until=4.8)
s = rec("detect--command-flagged", min_=7, weight=1.3, fallback="detect--priya-command")
chapter(s, "2", "Connect and detect")
feature(s, "The Watcher", "Every morning, **every batch at every distributor**, checked against its sell-through and the quick-commerce gates.")
pt(s, "p-flag", 420, 360, "Flagged: it will not sell in time", at=1.2, until=5.0)
pt(s, "p-activity", 1284, 240, "Every hand-off, as it happens", at=3.0, until=6.5, tone="green")
s = clip("c22-priya-phone", speed=0.6, seek=2.6, min_=6, weight=1.2)
chapter(s, "2", "Connect and detect")
banner(s, "detect", at=1.6)
role(s, "The brand's supply planner", "at her desk", at=0.5, until=4.6)
s = rec("detect--journey-flagged", min_=6, weight=1.2, fallback="detect--priya-journey-chips")
chapter(s, "2", "Connect and detect")
feature(s, "A page for every batch", "Where it stands, **what each agent has done**, and what comes next.")
pt(s, "p-tracker", 800, 300, "The nine stops, as the batch moves", at=1.0, until=4.5)

# 4. verify
set_bg("k57-label-photo")
scene("4a", "4b", "4c", "4d", at=0.9, tail=0.6)
s = rec("detect--rakesh-today-request", phone=True, min_=7.5, weight=1.3, fallback="detect--rakesh-today-phone")
chapter_open(s, "Chapter 2", "Verify", "One photo from a phone, and the batch is real.", ["Verify"])
chapter(s, "3", "Verify")
feature(s, "The distributor's Today", "What each batch needs from him, with **one button each**.", at=3.6)
banner(s, "verify", at=4.2)
s = clip("c57-label-photo", speed=0.8, max_=5.0, min_=5, weight=1.1)
chapter(s, "3", "Verify")
role(s, "The distributor", "at the shelf", at=0.4, until=4.2)
s = rec("detect--rakesh-camera", phone=True, min_=4.5, weight=0.9, fallback="plan--rakesh-photos-phone")
chapter(s, "3", "Verify")
feature(s, "Take a photo, or upload one", "The phone's camera, or a photo already taken.")
s = rec("plan--route-vision", min_=8, weight=1.5, fallback="plan--priya-route-chips")
chapter(s, "3", "Verify")
feature(s, "Vision, on Gemini", "The batch, the dates and the MRP read from the label; the **barcode, the QR code and the FSSAI licence** checked; matched to the stock record.")
pt(s, "p-label", 560, 640, "Read from the carton's label", at=1.0, until=4.0)
pt(s, "p-match", 1240, 540, "Matches the stock record", at=3.5, until=7.0, tone="green")

# 5. value, decide, approve
set_bg("k24-priya-approve")
scene("5a", "5b", "5c", "5d", "5e", "5f", at=0.9, tail=0.6)
s = anim("five-exits", min_=8.5, weight=1.5, at=3.4)
chapter_open(s, "Chapter 3", "Value, decide, approve", "Every exit priced. The split explained. One yes.", ["Value", "Decide", "Approve"])
chapter(s, "4", "Value, decide, approve")
feature(s, "The Valuer", "**Every exit priced per unit**, after costs and GST, against what destroying the stock would cost.", at=3.6)
s = rec("plan--route-channels", min_=7, weight=1.2, fallback="plan--priya-route-chips")
chapter(s, "4", "Value, decide, approve")
feature(s, "The Valuer", "Five exits, and the **write-off they are measured against**.")
pt(s, "p-channels", 700, 300, "Five channels, priced", at=1.0, until=4.5)
pt(s, "p-writeoff", 700, 560, "What the write-off would cost", at=4.0, until=7.5, tone="green")
s = rec("plan--route-split", min_=8, weight=1.3, fallback="plan--priya-route-chips")
chapter(s, "4", "Value, decide, approve")
feature(s, "The Router", "The batch **split across the exits**, with its reasoning in plain language, and the alternatives it considered.")
pt(s, "p-split", 700, 300, "The recommended split, and why", at=1.0, until=4.5)
s = clip("c24-priya-approve", speed=0.8, min_=5, weight=1)
chapter(s, "4", "Value, decide, approve")
role(s, "The brand's supply planner", "the one yes", at=0.4, until=4.2)
s = rec("plan--route-approve", min_=8, weight=1.4, speed=1.15, fallback="plan--priya-approve-sheet")
chapter(s, "4", "Value, decide, approve")
feature(s, "One yes", "The approval is **logged with who, when and the device**. Nothing executes before it.")
s = rec("approve--rakesh-today-plan", phone=True, min_=5, weight=1, fallback="approve--rakesh-today-phone")
chapter(s, "4", "Value, decide, approve")
feature(s, "The distributor is told", "The plan in his own language, with a **pause button**.")
banner(s, "approved", at=1.0)

# 6. execute: five exits
set_bg("k25-kirana-offer")
scene("6a", "6b", "6c", "6d", "6e", "6f", "6g", at=0.9, tail=0.6)
s = clip("c25-kirana-offer", speed=0.5, min_=7.5, weight=1.4)
chapter_open(s, "Chapter 4", "Execute: five exits", "The kiranas, the marketplace, the staff sale, the food bank, the van round.", ["Execute"], dark=True)
chapter(s, "5", "Five exits")
role(s, "A kirana owner", "his shop", at=3.7, until=6.5)
banner(s, "offer", at=4.2)
s = rec("approve--kirana-offer", phone=True, min_=5, weight=1, fallback="approve--kirana-ganesh-offer-phone")
chapter(s, "5", "Five exits")
feature(s, "Outreach", "The scheme on each shop's phone, **in Hindi**, with its margin and its share.")
s = rec("approve--kirana-order", phone=True, min_=7, weight=1.3, speed=1.15, fallback="orders--kirana-ganesh-offer-ordered-phone")
chapter(s, "5", "Five exits")
feature(s, "Ordered in a tap", "Each order gets **its own tax invoice**, issued in the distributor's name.")
s = rec("orders--execution-scheme", min_=6, weight=1.1, fallback="orders--priya-execution-chips")
chapter(s, "5", "Five exits")
feature(s, "The scheme, as the shops see it", "Sent, first order, closed, van round: **every stop with its time**, and the cluster on the map.")
s = rec("approve--agrawal-listing", min_=5, weight=1, fallback="approve--agrawal-listing")
chapter(s, "5", "Five exits")
feature(s, "The Lister", "The rest of the batch on the near-expiry marketplace, **hidden from the brand's own territories**, with the label photo and the dates.")
s = clip("c26-agrawal-tablet", speed=0.65, min_=4.5, weight=0.9)
chapter(s, "5", "Five exits")
role(s, "A marketplace buyer", "another city", at=0.4, until=4.0)
s = rec("deal--agrawal-won", min_=7, weight=1.3, fallback="deal--agrawal-listing-won")
chapter(s, "5", "Five exits")
feature(s, "The Negotiator", "Answers the buyer **in the distributor's name**, holds the reserve, closes the deal. The token is paid, the truck is loaded.")
pt(s, "p-chat", 1240, 760, "The Negotiator, in the chat", at=1.2, until=5.0)
s = clip("c27-staff-sale", speed=0.6, min_=5, weight=1)
chapter(s, "5", "Five exits")
role(s, "The distributor and her staff", "the godown gate", at=0.4, until=4.2)
banner(s, "staff", at=1.0)
s = rec("donation--lakshmi-staff-receipt", min_=7, weight=1.3, fallback="donation--lakshmi-today")
chapter(s, "5", "Five exits")
feature(s, "The staff sale", "Recorded on **one consolidated UPI receipt**, which Vision reads and reconciles with the count.")
s = clip("c28-foodbank-van", speed=0.85, min_=5, weight=1)
chapter(s, "5", "Five exits")
role(s, "A food bank's city lead", "the pickup", at=0.4, until=4.2)
banner(s, "pickup", at=1.0)
s = rec("donation--meera-collected", phone=True, min_=7, weight=1.3, fallback="donation--meera-pickups-phone")
chapter(s, "5", "Five exits")
feature(s, "The Donation agent", "Packs with enough shelf life go to a food bank: the pickup booked, the **FSSAI checklist** drafted, the food bank's **own receipt** issued.")
s = rec("papers--rakesh-deliveries-van", min_=5, weight=1, fallback="papers--rakesh-deliveries-done")
chapter(s, "5", "Five exits")
feature(s, "The van round", "Every shop that ordered, **on the distributor's own route**.")
s = clip("r2-godown-noon", speed=0.9, max_=4.4, min_=4.0, weight=0.9)
chapter(s, "5", "Five exits")
role(s, "A kirana owner", "collecting her stock", at=0.4, until=4.0)

# 7. settle: the paperwork
set_bg("k09-rakesh-tally-desk")
scene("7a", "7b", "7c", "7d", at=0.9, tail=0.6)
s = clip("c09-rakesh-tally-desk", speed=0.4, max_=5.0, min_=7, weight=1.3)
chapter_open(s, "Chapter 5", "The paperwork", "Where most clearances fall apart. Here, it is automatic.", ["Settle"], dark=True)
chapter(s, "6", "The paperwork")
role(s, "The distributor", "his office", at=3.7, until=6.4)
banner(s, "papers", at=4.2)
s = rec("settle--paperwork-pack", min_=7, weight=1.2, fallback="settle--priya-paperwork-chips")
chapter(s, "6", "The paperwork")
feature(s, "The Paperwork agent", "The whole pack drafted: **generated, drafted or not required**, each with its reason.")
s = rec("papers--paper-invoice-issued", min_=8, weight=1.3, fallback="papers--paper-chips-invoice-issued")
chapter(s, "6", "The paperwork")
feature(s, "The tax invoice", "Ready to issue from Tally, with its **e-invoice IRN and signed QR code**.")
pt(s, "p-irn", 1240, 560, "The e-invoice, as the portal returns it", at=1.0, until=4.5)
s = rec("settle--paper-credit-note", min_=5, weight=1, fallback="settle--paper-chips-credit-note")
chapter(s, "6", "The paperwork")
feature(s, "The credit note", "The brand's price support, so the **distributor ends whole**.")
s = rec("settle--paper-itc", min_=7, weight=1.2, fallback="settle--paper-chips-itc-memo")
chapter(s, "6", "The paperwork")
feature(s, "The GST memo", "Input credit **kept on every pack sold, reversed only on what was given away**, under section 17(5)(h).")
pt(s, "p-itc", 1240, 560, "Kept, reversed, and why", at=1.0, until=4.5)
s = rec("settle--paper-fssai", min_=5, weight=0.9, fallback="papers--paper-chips-invoice-issued")
chapter(s, "6", "The paperwork")
feature(s, "The FSSAI checklist", "Drafted from the batch's own dates and the food bank's rules.")
s = rec("settle--paper-kiranas", min_=5, weight=0.9, fallback="settle--priya-paperwork-chips")
chapter(s, "6", "The paperwork")
feature(s, "The invoices to every kirana", "One tax invoice an order, numbered in the distributor's own series.")
s = rec("papers--paperwork-reviewed", min_=5, weight=1, fallback="papers--priya-paperwork-chips")
chapter(s, "6", "The paperwork")
feature(s, "Signed, stamped, reviewed", "Every paper a **signed PDF with the firm's stamp**, reviewed by the planner.")
s = rec("papers--rakesh-batch-papers", min_=7, weight=1.2, fallback="papers--rakesh-batch-papers")
chapter(s, "6", "The paperwork")
feature(s, "The distributor's portal", "His own papers, his **copies of the receipts**, ready to download.")
pt(s, "p-download", 1240, 420, "Download PDF", at=1.2, until=4.5, tone="green")

# 8. when it does not go as planned
set_bg("k10-landfill-certificate")
scene("8a", "8b", "8c", "8d", "8e", "8f", at=0.9, tail=0.6)
s = rec("slow--slow-scheme-short", min_=8, weight=1.4, fallback="orders--priya-execution-chips")
chapter_open(s, "Chapter 6", "When it does not go as planned", "Some shops do not order. Stock is left on expiry day.", ["Execute", "Settle"])
chapter(s, "7", "Not as planned")
feature(s, "The window closes short", "What no shop took **stays at the godown**.", at=3.6)
s = rec("slow--slow-left-at-godown", min_=6, weight=1.1, fallback="orders--priya-execution-chips")
chapter(s, "7", "Not as planned")
feature(s, "Expiry day", "What is left is settled by the **brand's own expiry policy**, fully automated.")
s = rec("slow--slow-rakesh-today-destroy", phone=True, min_=5, weight=1, fallback="detect--rakesh-today-phone")
chapter(s, "7", "Not as planned")
feature(s, "The distributor is asked", "To destroy the expired packs through an **authorised agency**, and to send the evidence.")
s = rec("slow--slow-destroy-photos", min_=7, weight=1.3, fallback="history--priya-past-record")
chapter(s, "7", "Not as planned")
feature(s, "The evidence", "A photo before, a photo after, the agency and its certificate, two witnesses.")
s = clip("c10-landfill-certificate", speed=0.8, min_=5, weight=1)
chapter(s, "7", "Not as planned")
role(s, "The agency's officer, two witnesses, the distributor", "the landfill", at=0.4, until=4.4)
s = rec("slow--slow-destroy-sign", min_=8, weight=1.4, speed=1.2, fallback="history--priya-past-papers")
chapter(s, "7", "Not as planned")
feature(s, "Signed in place", "The **certificate of destruction**, signed on the distributor's screen by each of them.")
s = rec("slow--slow-review", min_=7, weight=1.2, fallback="history--priya-past-record")
chapter(s, "7", "Not as planned")
feature(s, "The second yes", "Vision's checks on the photos, the agency on the brand's list, and the planner's **second yes**.")
s = rec("slow--slow-papers", min_=6, weight=1.1, fallback="history--priya-past-papers")
chapter(s, "7", "Not as planned")
feature(s, "Closed, with its record complete", "The **expiry credit note** and the destruction certificate issued; the batch closes.")

# 9. report
set_bg("k51-brand-office")
scene("9a", "9b", "9c", "9d", "9e", at=0.9, tail=0.6)
s = anim("ledger", min_=8.5, weight=1.6, at=3.4)
chapter_open(s, "Chapter 7", "Report", "One ledger, three readings, and every batch's record.", ["Report"])
chapter(s, "8", "Report")
feature(s, "Impact", "When a batch closes, Impact **posts the ledger**: money, GST and impact.", at=3.6)
s = rec("ledger--execution-cleared", min_=5, weight=1, fallback="ledger--priya-execution-chips-cleared")
chapter(s, "8", "Report")
feature(s, "The batch closes", "Impact posts the ledger the moment the batch clears.")
s = rec("ledger--ledger-money", min_=7, weight=1.2, fallback="ledger--ledger-money")
chapter(s, "8", "Report")
feature(s, "Money", "What was recovered against the write-off, **batch by batch, quarter by quarter**.")
s = rec("ledger--ledger-gst", min_=6, weight=1.1, fallback="ledger--ledger-gst")
chapter(s, "8", "Report")
feature(s, "GST", "Input credit kept and reversed, **invoice by invoice**, ready for the accountant.")
s = rec("ledger--ledger-impact", min_=8, weight=1.3, fallback="ledger--ledger-impact")
chapter(s, "8", "Report")
feature(s, "Impact", "Food kept out of landfill, CO₂e avoided, meals served, and the **BRSR line with its evidence**.")
s = rec("ledger--batch-record", min_=8, weight=1.3, fallback="ledger--batch-chips-record")
chapter(s, "8", "Report")
feature(s, "Every batch keeps its record", "The photos, the yeses, and an **audit trail of every agent and every person**.")
s = rec("ledger--rakesh-batches", min_=5, weight=1, fallback="ledger--rakesh-batches")
chapter(s, "8", "Report")
feature(s, "The partners' own history", "A distributor's batches and papers; a kirana's offers and orders; a food bank's pickups and receipts.")
s = clip("r4-office-dashboard", speed=0.7, max_=4.3, min_=4, weight=1)
chapter(s, "8", "Report")
role(s, "The brand and its distributor", "the quarter, read together", at=0.4, until=4.2)

# 10. the close
set_bg("k32-foodbank-store")
scene("10a", "10b", "10c", at=0.6, tail=1.2)
s = clip("c32-foodbank-store", speed=0.6, min_=5, weight=1.1)
role(s, "A food bank's storeroom", "the cartons received", at=0.4, until=4.2)
s = clip("c12-close-lane", speed=0.45, max_=4.4, min_=4.4, weight=1)
on(s, "end-cards", {"kind": "end", "cards": [
    {"who": "The brand", "fig": "recovers", "what": "what the bin would have taken, with its GST credit kept"},
    {"who": "The distributor", "fig": "ends whole", "what": "the price support makes up the difference"},
    {"who": "The kiranas", "fig": "earn", "what": "fresh stock at a scheme price, invoice in hand"},
    {"who": "The food bank", "fig": "serves", "what": "with the receipt that proves it"}],
    "links": [], "built": ""}, at=0.6, until="end")
s = card(min_=4, weight=0.9)
on(s, "one-line", {"kind": "statement", "text": "One platform. __Ten agents.__ One yes."}, at=0.2, until="end")
s = rec("demo--demo-map", min_=6, weight=1.1, fallback="extra--demo-route-map")
feature(s, "Try it", "**The guided demo**: the console's line and three journeys, on real screens. **The live prototype**: sign in with the credentials and steps in the deck.")
s = card(min_=6, weight=1.0)
on(s, "end-brand", {"kind": "end", "cards": [], "links": [{"label": "smartclearance.web.app", "text": ""}, {"label": "Guided demo", "text": "smartclearance-demo.web.app"}, {"label": "Live prototype", "text": "credentials in the deck", "amber": True}],
    "built": "Built on Google Cloud: Gemini on Vertex AI · ADK · Cloud Run · Cloud SQL · Pub/Sub · BigQuery · Firebase"}, at=0.4, until="end")

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
    # the voice leads: where the segments' minimums would outrun the narration, they shrink in proportion, down to a
    # floor each, so no visual lingers past its sentence (the close keeps its own length for the end card)
    FLOOR = {"card": 3.6, "clip": 4.0}
    if need and sc is not scenes[-1] and sum(mins) - XF * (len(segs) - 1) > need:
        k = (need + XF * (len(segs) - 1)) / sum(mins)
        mins = [max(FLOOR.get(x["kind"], 3.6), m * k) for x, m in zip(segs, mins)]
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
            if x.get("open") and not o["id"].startswith("co-") and o["at"] == "start":
                o["at"] = 3.8  # a chapter's own labels wait for the opening to leave
            for k in ("at", "until"):
                v = o[k]
                if isinstance(v, str):
                    if v not in m2:
                        raise SystemExit(f"{x.get('shot') or x.get('name')}: overlay {o['id']} refers to {v}, which the scene does not carry")
                    v = m2[v] + (-0.15 if k == "at" and v not in ("start", "end") else 0)
                o[k] = round(max(0.0, min(v, x["seconds"])), 3)
            if x.get("open") and not o["id"].startswith("co-") and o["at"] < 3.8:
                o["at"] = 3.8
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
film = {"fps": FPS, "width": 1920, "height": 1080, "xfade": XF, "voice": A.voice, "transitions": "cut3", "cut": 3, "total": round(total, 3), "segments": segments, "overlays": list(overlays.values()), "vo": vo_track,
        "scenes": [{"start": sc["start"], "beats": [b["id"] for b in sc["beats"]], "segs": len(sc["segs"])} for sc in scenes]}
(HERE / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False))
vo_len = sum(b["len"] for b in vo_track)
print(f"film.json: {len(scenes)} scenes, {len(segments)} segments, {len(overlays)} overlays, {len(vo_track)} beats ({vo_len:.0f} s of voice), {total:.1f} s ({total/60:.2f} min)")
if total > 360:
    print(f"OVER 360 s by {total-360:.1f} s")
