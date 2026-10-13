"""SC-200: the film's timeline, laid on the voice.

Each voice line starts where the one before ended plus its gap (lines.json), with a breath before each section. Every
shot is anchored to a line (its start, plus an offset) and lasts until the next shot's anchor, so the cut lands on the
words. A shot is an LTX clip, a stretch of one of the three production recordings shown as floating device screens
(with a camera inside the screen: zoom and pan to what the voice names), or a title over a backdrop. Writes film.json
for overlays.py and assemble.py.

  .venv-tools/bin/python film.py
"""
import json, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
VO = HERE / "tts" / "vo" / "af_heart-0.94"
FPS, W, H = 25, 1920, 1080
XF = 0.5  # the default dissolve between shots

# the recordings are git-ignored, so they live in the main checkout (a worktree's git common dir's parent)
MAIN = Path(subprocess.run(["git", "-C", str(HERE), "rev-parse", "--path-format=absolute", "--git-common-dir"],
                           capture_output=True, text=True).stdout.strip()).parent
RUNS = MAIN / "frontend/workspace/tests/journey/runs"
SRC = {
    "admin": str(MAIN / "playwright-automation-videos/admin-console-tour-prod-2026-10-12.mp4"),       # SC-199
    "mango": str(RUNS / "2026-10-12-prod-mango/munchly-mango-e2e-prod-2026-10-12.mp4"),               # SC-190
    "chips": str(RUNS / "2026-10-12-prod-sad/munchly-chips-sad-path-e2e-prod-2026-10-12.mp4"),        # SC-188
}
assert all(Path(p).exists() for p in SRC.values()), SRC
# device screens in the 2560 x 1440 stage recordings (measured, inset 3 px inside the frame)
DEV = {
    "priya": (41, 183, 1075, 745),     # tablet, landscape (Priya, supply chain)
    "dist": (1176, 183, 843, 1216),    # tablet, portrait (Lakshmi Agencies / Rakesh Traders)
    "phone": (2077, 180, 445, 973),    # phone (Neha, the kiranas, Agrawal, Meera)
    "laptop": (41, 183, 1926, 1202),   # the admin tour's laptop
}
# where each device sits on the 1920 x 1080 frame, per layout
LAYOUT = {
    "L": {"priya": (620, 121, 1206)},
    "P": {"dist": (1060, 72, 649)},
    "PH": {"phone": (1170, 70, 430)},
    "LP": {"priya": (96, 206, 1100), "phone": (1290, 76, 430)},
    "LT": {"laptop": (500, 122, 1340)},
}
# section backdrops (blurred plates) and the left column for words
BACK = {"console": "g05-backdrop", "intro": "g04-town-network", "mango": "g06w-mango", "chips": "g07w-chips", "close": "g08-town-sunrise"}

lines = json.loads((HERE / "lines.json").read_text())["lines"]
durs = json.loads((VO / "durations.json").read_text())
PAD = {"intro": 1.0, "console": 3.0, "mango": 2.4, "chips": 2.6, "close": 1.6}
LEAD = 2.2

t, sec, at = LEAD, None, {}
for ln in lines:
    if ln["sec"] != sec and sec is not None:
        t += PAD.get(ln["sec"], 0)
    sec = ln["sec"]
    at[ln["id"]] = (round(t, 3), durs[ln["id"]])
    t += durs[ln["id"]] + ln["gap"] + {"mango": 0.35, "chips": 0.35, "console": 0.2}.get(ln["sec"], 0)
END = t + 6.0  # the end card holds after the last word

def a(line, off=0.0):
    return round(at[line][0] + off, 3)

def e(line, off=0.0):  # a line's end
    return round(at[line][0] + at[line][1] + off, 3)

# camera keyframes inside a device: (t in the shot, zoom, x, y), x and y the point of the device to centre (0..1)
def cam(*keys):
    return [list(k) for k in keys]

STILL = cam((0, 1.0, 0.5, 0.5), (99, 1.06, 0.5, 0.5))

shots = []
def clip(start, name, speed=1.0, seek=0.0, zoom=(1.0, 1.08), focus=(0.5, 0.5), ov=(), xf=XF, kind="fade", grade="warm"):
    shots.append({"type": "clip", "start": start, "clip": name, "speed": speed, "seek": seek, "zoom": list(zoom),
                  "focus": list(focus), "ov": list(ov), "xf": xf, "kind": kind, "grade": grade})

def screen(start, src, t0, layout, back, cams=None, speed=1.0, ov=(), xf=XF, kind="fade", enter=False):
    shots.append({"type": "screen", "start": start, "src": src, "t0": t0, "layout": layout, "back": back, "speed": speed,
                  "cams": cams or {d: STILL for d in LAYOUT[layout]}, "ov": list(ov), "xf": xf, "kind": kind, "enter": enter})

def title(start, back, ov=(), xf=XF, kind="fade", clipname=None):
    shots.append({"type": "title", "start": start, "back": back, "clip": clipname, "ov": list(ov), "xf": xf, "kind": kind})

# an overlay: (id, from, to) in the shot's own time; ids name overlays.json entries
O = []
def ov(oid, kind, **props):
    O.append({"id": oid, "kind": kind, **props})
    return oid

# ---------------------------------------------------------------------------------------------------------------
# 1 · The problem: good food runs out of time
ov("st-1", "statement", kicker="EVERY DAY, ACROSS INDIA", lines=["Good food,", "running out of time."])
ov("st-2", "statement", kicker="THE PROBLEM", lines=["Short-dated.", "Not spoiled."])
ov("st-3", "statement", kicker="THE QUICK-COMMERCE CUT-OFF", lines=["Past it,", "nobody takes it."])
ov("ch-loss", "chips", items=["Written off", "Tax credit reversed", "Landfill"], y=760, tone="clay")
clip(0.0, "l01-hourglass", speed=0.72, zoom=(1.0, 1.10), focus=(0.52, 0.5), kind="fadeblack",
     ov=[("st-1", a("p1", -0.3), e("p2", -0.6))])
clip(a("p2", 1.6), "l02-pages", speed=0.75, zoom=(1.02, 1.12), ov=[("st-2", 0.0, 2.4), ("st-3", a("p3", -0.2) - a("p2", 1.6), 99)])
clip(a("p4", -0.4), "l03-landfill", speed=0.7, zoom=(1.0, 1.06), focus=(0.4, 0.9), grade="muted",
     ov=[("ch-loss#0", 1.6, 99), ("ch-loss#1", 2.6, 99), ("ch-loss#2", 3.9, 99)])

# 2 · Smart-Clearance
ov("title", "title", tagline="Every near-expiry carton, a second chance.")
ov("pillars", "chips", items=["Software as a service", "Ten AI agents on Gemini", "One human yes"], y=880, tone="glass", center=True)
clip(a("i1", -0.6), "l04-town", speed=0.62, zoom=(1.0, 1.1), kind="fade", xf=0.8,
     ov=[("title", 0.5, a("i2", 4.2) - a("i1", -0.6)), ("pillars#0", a("i2", 1.0) - a("i1", -0.6), 99),
         ("pillars#1", a("i2", 3.0) - a("i1", -0.6), 99), ("pillars#2", a("i2", 5.4) - a("i1", -0.6), 99)])
ov("k-agents", "kicker", kicker="BEFORE ANYONE SIGNS IN", head="Ten agents. Nine stops.", x=96, y=360, w=360, hs=50)
ov("k-yes", "kicker", kicker="STOP 6 OF 9", head="One person says yes.", x=96, y=360, w=360, hs=50, accent="amber")
screen(a("i2", 6.6), "admin", 13.6, "LT", "intro", enter=True,
       cams={"laptop": cam((0, 1.0, 0.5, 0.5), (1.4, 1.0, 0.5, 0.5), (3.4, 1.55, 0.3, 0.55), (9, 1.62, 0.3, 0.57))},
       ov=[("k-agents", 0.3, 4.6), ("k-yes", 4.9, 99)])

# 3 · The console: Smart-Clearance as software as a service
ov("chap-1", "chapter", num="01", label="THE PLATFORM", head="Admin and console", sub="smartclearance-console.web.app  ·  live in production")
ov("tag-neha", "tag", person="p-neha", name="Neha Kulkarni", role="Smart-Clearance staff", x=96, y=96)
ov("k-land", "kicker", kicker="THE LANDING PAGE", head="One platform, every brand.", x=96, y=360, w=360, hs=50)
ov("k-sign", "kicker", kicker="STAFF SIGN-IN", head="Into the console.", x=96, y=360, w=360, hs=50)
ov("k-over", "kicker", kicker="THE OVERVIEW", head="Every client, live.", x=96, y=360, w=360, hs=50)
ov("k-cfg", "kicker", kicker="PER CLIENT", head="Tuned to each supply chain.", x=96, y=360, w=360, hs=50)
ov("k-gate", "callout", kicker="THE WATCHER", fig="60 days", cap="quick-commerce gate", x=96, y=670, w=360, fs=70)
ov("k-neg", "callout", kicker="THE NEGOTIATOR", fig="Act", cap="answers bids in its limits", x=96, y=670, w=360, fs=70)
ov("k-appr", "callout", kicker="THE APPROVAL", fig="Always on", cap="nothing moves without a yes", x=96, y=670, w=360, fs=70, accent="amber")
title(a("c1", -2.6), "console", ov=[("chap-1", 0.25, 99)], xf=0.8)
screen(a("c1", 0.1), "admin", 1.2, "LT", "console", speed=1.0, kind="fade", enter=True,
       cams={"laptop": cam((0, 1.0, 0.5, 0.5), (3.4, 1.18, 0.32, 0.42))},
       ov=[("k-land", 0.3, 99)])
screen(a("c1", 3.0), "admin", 22.6, "LT", "console", speed=1.6,
       cams={"laptop": cam((0, 1.25, 0.72, 0.48), (2.2, 1.25, 0.72, 0.48), (3.2, 1.0, 0.5, 0.5))},
       ov=[("k-sign", 0.2, 99), ("tag-neha", 0.2, 99)])
screen(a("c2", -0.3), "admin", 30.4, "LT", "console", speed=1.12,
       cams={"laptop": cam((0, 1.0, 0.5, 0.5), (1.2, 1.0, 0.5, 0.5), (2.8, 1.5, 0.6, 0.27), (5.6, 1.5, 0.6, 0.27), (7.0, 1.3, 0.55, 0.55))},
       ov=[("k-over", 0.2, 99), ("tag-neha", 0.0, 99)])
screen(a("c3", -0.3), "admin", 41.6, "LT", "console", speed=1.85,
       cams={"laptop": cam((0, 1.0, 0.5, 0.5), (1.6, 1.0, 0.5, 0.5), (3.0, 1.45, 0.72, 0.42), (5.4, 1.45, 0.72, 0.42),
                           (6.6, 1.4, 0.68, 0.45), (8.6, 1.4, 0.6, 0.62), (10.0, 1.45, 0.5, 0.62))},
       ov=[("k-cfg", 0.2, 99), ("tag-neha", 0.0, 99), ("k-gate", 2.6, 5.6), ("k-neg", 5.9, 8.4), ("k-appr", 8.7, 99)])

# 4 · Munchly Mango Drink, the happy path (Lakshmi Agencies, Hyderabad)
ov("chap-2", "chapter", num="02", label="THE HAPPY PATH", head="Munchly Mango Drink", sub="MF-2410-118  ·  Lakshmi Agencies, Hyderabad  ·  live in production")
ov("tag-priya", "tag", person="p-priya", name="Priya Deshmukh", role="Supply chain · Munchly Foods", x=96, y=96)
ov("tag-lak", "tag", person="p-lakshmi", name="Lakshmi Agencies", role="Distributor · Begum Bazaar", x=96, y=96)
ov("tag-meera", "tag", person="p-meera", name="Meera", role="Feeding India · Hyderabad", x=96, y=96)
ov("m-risk", "kicker", kicker="DETECT · THE WATCHER", head="22 days left. ₹22,657 at stake.", x=96, y=360, w=440)
ov("m-label", "kicker", kicker="VERIFY · VISION", head="One photo. The label read and matched.", x=96, y=360, w=860)
ov("m-price", "kicker", kicker="VALUE · DECIDE", head="Every exit priced. The batch split.", x=96, y=360, w=440)
ov("m-plan", "callout", kicker="THE PLAN", fig="₹16,917", cap="instead of a ₹22,657 write-off", x=96, y=670, w=440)
ov("m-yes", "kicker", kicker="APPROVE", head="One yes releases the agents.", x=96, y=360, w=440, accent="amber")
ov("m-kir", "kicker", kicker="EXECUTE · OUTREACH", head="The offer, in Hindi. Orders land live.", x=96, y=78, w=1100)
ov("m-live", "kicker", kicker="EVERY ORDER, LIVE", head="Each order lands on her screen.", x=96, y=360, w=440)
ov("m-fill", "callout", kicker="THE KIRANA SCHEME", fig="52 shops", cap="1,372 packets, each invoiced", x=96, y=670, w=440)
ov("m-staff", "kicker", kicker="STAFF SALE", head="Checked against one UPI receipt.", x=96, y=360, w=860)
ov("m-upi", "callout", kicker="VISION READ", fig="18 payments", cap="₹1,200 — matches the count", x=96, y=670, w=860)
ov("m-donate", "kicker", kicker="DONATION", head="58 packs to Feeding India, receipted.", x=96, y=360, w=860)
ov("m-paper", "kicker", kicker="SETTLE · PAPERWORK", head="Every paper prepared, signed and stamped.", x=96, y=360, w=440)
ov("m-ledger", "kicker", kicker="REPORT · IMPACT", head="The ledger, posted.", x=96, y=360, w=440)
ov("m-whole", "callout", kicker="RECOVERED", fig="₹16,917", cap="distributor ends whole: ₹0 loss", x=96, y=670, w=860)
CAMS_DIST = lambda *k: {"dist": cam(*k)}  # noqa: E731
CAMS_P = lambda *k: {"priya": cam(*k)}  # noqa: E731
clip(a("m1", -1.4), "l06-mango", speed=0.66, zoom=(1.0, 1.12), focus=(0.45, 0.42), kind="fadeblack", xf=0.9,
     ov=[("chap-2", 0.9, 99)])
screen(a("m2", 3.6), "mango", 149.6, "L", "mango", speed=0.85, enter=True,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (1.0, 1.0, 0.5, 0.5), (2.6, 1.55, 0.3, 0.52), (9, 1.6, 0.3, 0.52)),
       ov=[("tag-priya", 0.2, 99), ("m-risk", 0.4, 99)])
screen(a("m3", -0.3), "mango", 164.2, "P", "mango", speed=1.0, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (2.2, 1.18, 0.5, 0.32)),
       ov=[("tag-lak", 0.2, 99), ("m-label", 0.4, 99)])
screen(a("m3", 2.0), "mango", 185.3, "P", "mango", speed=1.0,
       cams=CAMS_DIST((0, 1.18, 0.55, 0.36), (3, 1.25, 0.55, 0.38)),
       ov=[("tag-lak", 0.0, 99), ("m-label", 0.0, 99)])
screen(a("m4", -0.3), "mango", 248.6, "L", "mango", speed=1.0,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.8, 1.0, 0.5, 0.5), (2.2, 1.55, 0.35, 0.55)),
       ov=[("tag-priya", 0.0, 99), ("m-price", 0.2, 99)])
screen(a("m4", 2.4), "mango", 271.2, "L", "mango", speed=1.0,
       cams=CAMS_P((0, 1.1, 0.38, 0.62), (2.6, 1.2, 0.36, 0.62)),
       ov=[("tag-priya", 0.0, 99), ("m-price", 0.0, 99), ("m-plan", 0.3, 99)])
screen(a("m4", 4.8), "mango", 288.6, "L", "mango", speed=1.0,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.0, 1.4, 0.78, 0.45)),
       ov=[("tag-priya", 0.0, 99), ("m-yes", 0.1, 99)])
screen(a("m5", -0.3), "mango", 331.4, "LP", "mango", speed=1.3, enter=True,
       cams={"priya": STILL, "phone": cam((0, 1.0, 0.5, 0.5), (1.4, 1.0, 0.5, 0.5), (2.6, 1.3, 0.5, 0.3))},
       ov=[("m-kir", 0.2, 99)])
screen(a("m5", 3.6), "mango", 347.0, "L", "mango", speed=1.0, enter=True,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.5, 1.0, 0.5, 0.5), (2.0, 1.4, 0.32, 0.62)),
       ov=[("tag-priya", 0.2, 99), ("m-live", 0.2, 99), ("m-fill", 0.6, 99)])
screen(a("m6", -0.3), "mango", 578.2, "P", "mango", speed=1.0, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (0.8, 1.0, 0.5, 0.5), (2.2, 1.35, 0.5, 0.6)),
       ov=[("tag-lak", 0.2, 99), ("m-staff", 0.3, 99)])
screen(a("m6", 2.5), "mango", 593.4, "P", "mango", speed=1.0,
       cams=CAMS_DIST((0, 1.35, 0.5, 0.6), (2.2, 1.4, 0.5, 0.6)),
       ov=[("tag-lak", 0.0, 99), ("m-staff", 0.0, 99), ("m-upi", 0.2, 99)])
screen(a("m6", 4.6), "mango", 628.6, "PH", "mango", speed=1.0, enter=True,
       cams={"phone": cam((0, 1.0, 0.5, 0.5), (1.6, 1.0, 0.5, 0.5), (3.0, 1.2, 0.5, 0.42))},
       ov=[("tag-meera", 0.2, 99), ("m-donate", 0.3, 99)])
screen(a("m7", -0.3), "mango", 685.6, "L", "mango", speed=0.5,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.0, 1.55, 0.7, 0.45)),
       ov=[("tag-priya", 0.2, 99), ("m-paper", 0.2, 99)])
screen(a("m7", 2.6), "mango", 755.4, "L", "mango", speed=1.0,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.4, 1.0, 0.5, 0.5), (1.8, 1.5, 0.4, 0.4)),
       ov=[("tag-priya", 0.0, 99), ("m-ledger", 0.1, 99)])
screen(a("m7", 5.6), "mango", 765.5, "P", "mango", speed=0.75, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.2, 1.22, 0.45, 0.32), (9, 1.25, 0.45, 0.33)),
       ov=[("tag-lak", 0.2, 99), ("m-whole", 0.6, 99)])

# 5 · Munchly Masala Chips, the sad path (Rakesh Traders, Nagpur)
ov("chap-3", "chapter", num="03", label="THE SAD PATH", head="Munchly Masala Chips", sub="MF-2409-117  ·  Rakesh Traders, Nagpur  ·  live in production")
ov("tag-rakesh", "tag", person="p-rakesh", name="Rakesh bhai", role="Distributor · Rakesh Traders", x=96, y=96)
ov("tag-agr", "tag", person="p-agrawal", name="Agrawal Wholesale", role="Buyer on ExpireSoon · Raipur", x=96, y=96)
ov("tag-neha2", "tag", person="p-neha", name="Neha Kulkarni", role="Smart-Clearance console", x=96, y=96)
ov("k-two", "kicker", kicker="38 KIRANAS OFFERED", head="Only two of them buy.", x=96, y=360, w=440)
ov("k-two-c", "callout", kicker="THE SCHEME", fig="2 of 38", cap="48 packets ordered", x=96, y=670, w=860)
ov("k-bid", "kicker", kicker="EXPIRESOON · THE NEGOTIATOR", head="A bid of ₹13. Countered at ₹14.20.", x=96, y=360, w=860)
ov("k-won", "callout", kicker="SOLD", fig="772 packs", cap="at ₹14.20, token paid", x=96, y=670, w=860)
ov("k-close", "kicker", kicker="THE WINDOW CLOSES", head="540 packets left at the godown.", x=96, y=360, w=860)
ov("k-close-L", "kicker", kicker="THE WINDOW CLOSES", head="540 packets left at the godown.", x=96, y=360, w=440)
ov("k-left", "callout", kicker="LEFT AT THE GODOWN", fig="540", cap="packets no channel took", x=96, y=670, w=440, accent="clay")
ov("k-expiry", "kicker", kicker="EXPIRY DAY", head="Nothing is hidden.", x=96, y=360, w=860)
ov("k-photos", "callout", kicker="THE EVIDENCE", fig="2 photos", cap="before, at the godown · after, at the landfill", x=96, y=670, w=860)
ov("k-vision", "callout", kicker="VISION'S CHECKS", fig="4 of 4", cap="label · count · slate · landfill", x=96, y=670, w=860)
ov("k-signed", "kicker", kicker="SIGNED IN PLACE", head="The officer, two witnesses and Rakesh.", x=96, y=360, w=860)
ov("k-second", "kicker", kicker="THE SECOND YES", head="Money moves only on proof.", x=96, y=360, w=440, accent="amber")
ov("k-cn", "callout", kicker="EXPIRY CREDIT NOTE", fig="₹13,284", cap="CN/0118, issued on her yes", x=96, y=670, w=440)
ov("k-whole", "callout", kicker="STILL RECOVERED", fig="₹11,702", cap="distributor ends whole: ₹0 loss", x=96, y=670, w=860)
clip(a("k1", -1.6), "l07-chips", speed=0.66, zoom=(1.0, 1.12), focus=(0.6, 0.45), kind="fadeblack", xf=0.9, grade="cool",
     ov=[("chap-3", 0.9, 99)])
screen(a("k2", 0.4), "chips", 325.0, "L", "chips", speed=0.6, enter=True,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.0, 1.5, 0.35, 0.68)),
       ov=[("tag-priya", 0.2, 99), ("k-two", 0.2, 99)])
screen(a("k2", 3.2), "chips", 372.0, "P", "chips", speed=1.0, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (0.5, 1.0, 0.5, 0.5), (1.8, 1.35, 0.4, 0.52)),
       ov=[("tag-rakesh", 0.2, 99), ("k-two", 0.0, 99), ("k-two-c", 0.4, 99)])
screen(a("k3", -0.3), "chips", 395.4, "PH", "chips", speed=1.0, enter=True,
       cams={"phone": cam((0, 1.0, 0.5, 0.5), (1.0, 1.0, 0.5, 0.5), (2.2, 1.25, 0.5, 0.6))},
       ov=[("tag-agr", 0.2, 99), ("k-bid", 0.3, 99)])
screen(a("k3", 3.0), "chips", 414.5, "PH", "chips", speed=0.65,
       cams={"phone": cam((0, 1.0, 0.5, 0.5), (3.6, 1.06, 0.5, 0.55))},
       ov=[("tag-agr", 0.0, 99), ("k-bid", 0.0, 99)])
screen(a("k3", 6.8), "chips", 428.4, "PH", "chips", speed=0.6,
       cams={"phone": cam((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.0, 1.3, 0.5, 0.42))},
       ov=[("tag-agr", 0.0, 99), ("k-bid", 0.0, 99), ("k-won", 0.3, 99)])
screen(a("k4", -0.3), "chips", 459.4, "PH", "chips", speed=1.0,
       cams={"phone": cam((0, 1.0, 0.5, 0.5), (1.6, 1.2, 0.5, 0.45))},
       ov=[("tag-neha2", 0.2, 99), ("k-close", 0.2, 99)])
screen(a("k4", 2.0), "chips", 467.4, "L", "chips", speed=1.0, enter=True,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.4, 1.0, 0.5, 0.5), (1.8, 1.55, 0.36, 0.48)),
       ov=[("tag-priya", 0.2, 99), ("k-close-L", 0.0, 99), ("k-left", 0.6, 99)])
screen(a("k5", -0.3), "chips", 518.6, "P", "chips", speed=1.0, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (2.4, 1.1, 0.5, 0.3)),
       ov=[("tag-rakesh", 0.2, 99), ("k-expiry", 0.2, 99)])
screen(a("k5", 2.3), "chips", 532.6, "P", "chips", speed=1.0,
       cams=CAMS_DIST((0, 1.1, 0.5, 0.3), (1.2, 1.5, 0.5, 0.3), (3.4, 1.55, 0.5, 0.31)),
       ov=[("tag-rakesh", 0.0, 99), ("k-expiry", 0.0, 99), ("k-photos", 0.3, 99)])
screen(a("k5", 5.8), "chips", 630.4, "P", "chips", speed=1.0,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (1.0, 1.4, 0.5, 0.3)),
       ov=[("tag-rakesh", 0.0, 99), ("k-expiry", 0.0, 99), ("k-vision", 0.3, 99)])
screen(a("k6", -0.3), "chips", 555.6, "P", "chips", speed=1.4,
       cams=CAMS_DIST((0, 1.35, 0.72, 0.18), (2.0, 1.4, 0.72, 0.18)),
       ov=[("tag-rakesh", 0.0, 99), ("k-signed", 0.2, 99)])
screen(a("k6", 1.9), "chips", 578.0, "P", "chips", speed=1.4,
       cams=CAMS_DIST((0, 1.35, 0.72, 0.2), (2.0, 1.4, 0.72, 0.2)),
       ov=[("tag-rakesh", 0.0, 99), ("k-signed", 0.0, 99)])
screen(a("k6", 3.8), "chips", 616.4, "P", "chips", speed=1.0,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (0.4, 1.0, 0.5, 0.5), (1.8, 1.4, 0.5, 0.52)),
       ov=[("tag-rakesh", 0.0, 99), ("k-signed", 0.0, 99)])
screen(a("k7", -0.3), "chips", 664.6, "L", "chips", speed=0.42, enter=True,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.6, 1.0, 0.5, 0.5), (2.2, 1.35, 0.72, 0.62)),
       ov=[("tag-priya", 0.2, 99), ("k-second", 0.2, 99)])
screen(a("k7", 3.3), "chips", 686.0, "L", "chips", speed=0.35,
       cams=CAMS_P((0, 1.0, 0.5, 0.5), (0.4, 1.0, 0.5, 0.5), (1.8, 1.3, 0.56, 0.62)),
       ov=[("tag-priya", 0.0, 99), ("k-second", 0.0, 99), ("k-cn", 0.3, 99)])
screen(a("k7", 6.4), "chips", 806.4, "P", "chips", speed=0.9, enter=True,
       cams=CAMS_DIST((0, 1.0, 0.5, 0.5), (0.8, 1.0, 0.5, 0.5), (2.4, 1.4, 0.5, 0.36), (9, 1.45, 0.5, 0.38)),
       ov=[("tag-rakesh", 0.2, 99), ("k-whole", 0.5, 99)])

# 6 · Everyone ends whole
ov("cl-1", "line", text="The brand recovers.", y=330)
ov("cl-2", "line", text="The distributor ends whole.", y=430)
ov("cl-3", "line", text="Kiranas earn. Food banks receive.", y=530)
ov("cl-4", "line", text="Less food goes to waste.", y=630, accent="amber")
ov("end", "end", url="smartclearance.web.app", demo="smartclearance-demo.web.app")
clip(a("f1", -0.6), "l08-sunrise", speed=0.6, zoom=(1.12, 1.0), kind="fadeblack", xf=0.9,
     ov=[("cl-1", 0.6, 99), ("cl-2", 0.6 + 1.25, 99), ("cl-3", 0.6 + 2.6, 99), ("cl-4", 0.6 + 4.9, 99)])
title(a("f2", -0.4), "close", kind="fade", xf=0.9, ov=[("end", 0.2, 99)])

# ---------------------------------------------------------------------------------------------------------------
shots.sort(key=lambda s: s["start"])
for i, s in enumerate(shots):
    s["n"] = i + 1
    nxt = shots[i + 1]["start"] if i + 1 < len(shots) else END
    s["dur"] = round(nxt - s["start"], 3)
    assert s["dur"] > 0.8, (i, s)
    s["ov"] = [{"id": o, "from": round(f, 3), "to": round(min(t2, s["dur"] + (shots[i + 1]["xf"] if i + 1 < len(shots) else 0)), 3)}
               for o, f, t2 in s["ov"]]

film = {"fps": FPS, "width": W, "height": H, "end": round(END, 3), "src": SRC, "dev": DEV, "layout": LAYOUT, "back": BACK,
        "vo": {ln["id"]: {"at": at[ln["id"]][0], "dur": at[ln["id"]][1], "text": ln["text"]} for ln in lines},
        "shots": shots, "overlays": O}
(HERE / "film.json").write_text(json.dumps(film, indent=1, ensure_ascii=False))
print(f"{len(shots)} shots, {len(O)} overlays, {END:.1f} s")
for s in shots:
    print(f"{s['n']:2} {s['start']:7.2f} {s['dur']:5.2f} {s['type']:6} {s.get('clip') or s.get('src') or ''} {s.get('t0', '')} {s.get('layout', '')}")
