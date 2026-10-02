"""Builds video/walkthrough.html: a 1920x1080 auto-playing, animated walkthrough of the
Smart-Clearance story, timed to the narration in narration.json.

  python3 build.py                 -> walkthrough.html (silent; used for headless recording)
  python3 build.py --audio x.m4a   -> walkthrough-with-audio.html (narration embedded, Play button)

Visual model (v2): every scene is a full-bleed illustration (img/NN-name.jpg, or a looping motion
clip clips/NN-name.webm when one exists) with a slow camera move, and realistic UI overlays on top:
a phone with push notifications, the Route Room app screen, the ExpireSoon listing and chat,
documents, a chart. Elements with data-f="0.35" get .go when the scene is 35% through; CSS decides
what .go means. data-until="0.6" adds .gone at 60%. data-count ticks numbers. A journey track runs
across the top and a carton tracker sits bottom-right, updated per scene from data-tracker.
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
PAUSE = 1.8
TOTAL = 187.0

segs = json.loads((HERE / "narration.json").read_text())
t = 0.0
for s in segs:
    s["start"] = round(t, 2)
    s["dur"] = round(s["audio_sec"] + PAUSE, 2)
    t += s["dur"]
segs[-1]["dur"] = round(TOTAL - segs[-1]["start"], 2)
(HERE / "timeline.json").write_text(json.dumps(segs, indent=1, ensure_ascii=False))

audio_tag = ""
out_name = "walkthrough.html"
if len(sys.argv) > 2 and sys.argv[1] == "--audio":
    b64 = base64.b64encode(Path(sys.argv[2]).read_bytes()).decode()
    audio_tag = f'<audio id="nar" preload="auto" src="data:audio/mp4;base64,{b64}"></audio>'
    out_name = "walkthrough-with-audio.html"


# ---------- helpers ----------
def bg(name: str, f: float | None = None, until: float | None = None, kb: str = "1.04,1.14,0px,0px,-30px,-10px") -> str:
    """A background layer. Uses clips/<name>.webm when it exists, else img/<name>.jpg.
    kb = scale0, scale1, x0, y0, x1, y1 for the camera move."""
    s0, s1, x0, y0, x1, y1 = kb.split(",")
    attrs = f' data-f="{f}"' if f is not None else ""
    attrs += f' data-until="{until}"' if until is not None else ""
    style = f"--s0:{s0};--s1:{s1};--x0:{x0};--y0:{y0};--x1:{x1};--y1:{y1}"
    clip = HERE / "clips" / f"{name}.webm"
    if clip.exists():
        media = f'<video src="clips/{name}.webm" muted loop playsinline preload="auto"></video>'
    else:
        media = f'<img src="img/{name}.jpg" alt="">'
    return f'<div class="bg"{attrs} style="{style}">{media}</div>'


def el(cls: str, f: float, style: str, inner: str, extra: str = "") -> str:
    return f'<div class="{cls}" data-f="{f}"{extra} style="{style}">{inner}</div>'


def cnt(frm, to, f0, f1, fmt, cls="", style=""):
    return f'<span class="{cls}" data-count="{frm}|{to}|{f0}|{f1}|{fmt}" style="{style}">{frm}</span>'


def lt(n: str, title: str, where: str, f: float = 0.03) -> str:
    return el("lt", f, "", f'<span class="n">{n}</span><span class="tt">{title}</span><span class="w">{where}</span>')


def av(name: str) -> str:
    return f'<img class="av" src="img/p-{name}.jpg" alt="">'


SC_AV = '<span class="av sc">SC</span>'
DOTS = '<span class="d">•</span><span class="d">•</span><span class="d">•</span>'


def phone(f: float, style: str, time: str, date: str, notif: str, nf: float, extra_cls: str = "") -> str:
    return el(f"phone {extra_cls}", f, style,
              f'<div class="scr"><div class="sb"><span>{time}</span><span class="ic"><i class="sig"></i><i class="bat"></i></span></div>'
              f'<div class="lock"><div class="lt2">{time}</div><div class="ld">{date}</div></div>'
              f'<div class="notif" data-f="{nf}"><div class="nh"><span class="appname"><b>SC</b> Smart-Clearance</span><span class="when">now</span></div>{notif}</div></div>')


def push(f: float, style: str, body: str, sub: str, hindi: bool = False) -> str:
    return el("push", f, style, f'<div class="nh"><span class="appname"><b>SC</b> Smart-Clearance</span><span class="when">push notification</span></div><div class="pb{" hindi" if hindi else ""}">{body}</div><div class="ps">{sub}</div>')


def doc(f: float, style: str, title: str, no: str, lines: list[str], total: str, ok: bool = True) -> str:
    rows = "".join(f'<div class="dr">{l}</div>' for l in lines)
    return el(f"doc {'ok' if ok else ''}", f, style, f'<div class="dh"><b>{title}</b><span>{no}</span></div>{rows}<div class="dt">{total}</div>')


# ---------- scenes ----------
SC = {}

SC["intro"] = ('', "", '<section class="scene intro" data-id="intro" data-tracker="">'
  + bg("01-carton", kb="1.0,1.12,0px,0px,-40px,-20px")
  + bg("12-bin", f=0.42, kb="1.08,1.16,20px,0px,-20px,-10px")
  + el("dim", 0.66, "", "")
  + el("hl", 0.03, "left:90px;top:120px;width:1360px", '<div class="k">A Google AI Hackathon prototype · India</div><div class="l1" data-f="0.04">Every year, Indian brands destroy</div><div class="l1" data-f="0.12">crores of rupees of good food,</div><div class="l2" data-f="0.22">because the delivery apps will not take stock that is close to its date.</div>', ' data-until="0.44"')
  + el("loss", 0.46, "left:90px;top:300px", '<div class="k">one batch of chips · 57 cartons · binned</div><div class="big">' + cnt(0, -27717, 0.47, 0.62, "inr") + '</div><div class="k2">stock lost + GST credit paid back + disposal + packaging charge</div>', ' data-until="0.66"')
  + el("brand", 0.68, "", '<div class="mark">SC<i></i></div><div class="bn">Smart-Clearance</div><div class="hi hindi">हर कार्टन को दूसरा मौका</div><div class="tg">Every carton gets a second chance, chosen by AI</div>')
  + '</section>')

SC["warning"] = ("1", "The warning", '<section class="scene" data-id="warning" data-tracker="ok:26|risk:74" data-tlabel="77 cartons · MF-2409-117">'
  + bg("02-range", until=0.2, kb="1.06,1.12,0px,0px,-20px,0px")
  + bg("03-priya", f=0.2, kb="1.04,1.14,0px,0px,-40px,-16px")
  + el("card wide", 0.02, "left:90px;top:120px;width:760px", '<div class="k">Munchly Foods · Pune · listed on the NSE</div><div class="h">Snacks and personal care, sold through 4 distributors and 195 kirana shops</div><div class="chips"><span>Masala Chips 150 g · ₹30</span><span>Choco Biscuits · ₹40</span><span>Instant Poha · ₹55</span><span>Mango Drink · ₹20</span><span>Glowra Face Wash · ₹120</span><span>Glowra Hair Oil · ₹150</span></div>', ' data-until="0.2"')
  + lt("1", "The warning", "Day 0 · Thursday 09:00 · Priya's desk, Pune", 0.22)
  + el("card agent", 0.28, "left:1180px;top:100px;width:660px", '<div class="ah"><span class="pulse"></span>Watcher agent · 09:00 · 4 distributors · 312 batches</div>'
      + '<div class="row no" data-f="0.36"><b>Blinkit</b> needs 90 days · has 47</div><div class="row no" data-f="0.42"><b>Zepto</b> needs 108 days (60% of life)</div><div class="row no" data-f="0.47"><b>Instamart</b> needs 108 days</div><div class="row" data-f="0.53">sell-through 12 / day × 40 days = 480 packets</div><div class="row red" data-f="0.58"><b>At risk</b> ' + cnt(0, 1360, 0.58, 0.68, "int") + ' packets · 57 cartons</div>', ' data-until="0.71"')
  + phone(0.72, "left:1560px;top:90px", "09:00", "Thursday, 2 October", '<div class="nt">Masala Chips 150 g · Nagpur</div><div class="nb">Priya ji, 57 cartons (1,360 packets) won\'t sell before 18 Nov. Blinkit, Zepto and Instamart have all stopped taking the batch. Tap to see the options.</div>', 0.78)
  + '</section>')

SC["photo"] = ("2", "The photo", '<section class="scene" data-id="photo" data-tracker="ok:26|risk:74" data-tlabel="77 cartons · verifying">'
  + bg("04-rakesh", kb="1.04,1.12,0px,0px,-30px,-20px")
  + lt("2", "The photo", "09:05 · Rakesh Traders godown, Kalamna Market, Nagpur")
  + push(0.06, "left:80px;top:100px;width:560px", "Rakesh bhai, ek photo chahiye: Masala Chips 150 g, batch MF-2409-117, carton ka label. Bas ek.", "09:05 · tap to open camera", hindi=True)
  + el("scan", 0.32, "left:1040px;top:380px;width:430px;height:320px", '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="flash" data-f="0.37"></div><div class="line" data-f="0.40"></div>')
  + el("card vis", 0.48, "left:1180px;top:90px;width:660px", '<div class="ah"><span class="pulse"></span>Gemini vision · reading the label</div>'
      + '<div class="row mono" data-f="0.52">BATCH <b>MF-2409-117</b></div><div class="row mono" data-f="0.57">MFG 18 MAY 2026 · <b>BEST BEFORE 18 NOV 2026</b></div><div class="row mono" data-f="0.62">MRP <b>₹30.00</b> · 24 × 150 g</div><div class="row mono" data-f="0.67">pack: sealed, dry · matches records</div><div class="row ok" data-f="0.74">confidence 0.97 · 47 days left · 74% of life used</div>')
  + el("stamp g", 0.82, "left:1120px;top:600px", "VERIFIED")
  + '</section>')

_doors = [("Online marketplace", "₹360", "₹15 a packet · 30+ days", "es"), ("Local kirana shops", "₹420", "₹18 a packet · cap 24½ cartons", "sel"),
          ("Brand's own site", "₹288", "₹15 less courier · cap 6", ""), ("Staff sale", "₹288", "₹12 a packet · cap 6", ""),
          ("Food bank", "−₹12", "freight only · 15+ days", "fb"), ("The bin", "−₹489", "stock + GST back + disposal", "bin")]
SC["doors"] = ("3", "Six doors", '<section class="scene" data-id="doors" data-tracker="ok:26|risk:74" data-tlabel="77 cartons · pricing">'
  + bg("05-doors", kb="1.02,1.08,0px,0px,0px,-10px")
  + lt("3", "Six doors", "09:21 · inside the agent · per carton of 24")
  + "".join(el(f"dl {c}", 0.10 + i * 0.07, f"left:{[163,480,816,1133,1450,1766][i] - 128}px;top:600px", f'<div class="dn">{n}</div><div class="dv">{v}</div><div class="dr">{r}</div>') for i, (n, v, r, c) in enumerate(_doors))
  + el("card total", 0.56, "left:1300px;top:90px;width:540px", '<div class="k">If all 57 cartons go to the bin</div><div class="row" data-f="0.58">stock lost −₹384 · GST credit paid back −₹46</div><div class="row" data-f="0.62">disposal + packaging charge −₹59 · per carton <b>−₹489</b></div><div class="big red">' + cnt(0, -27717, 0.66, 0.80, "inr") + '</div>')
  + '</section>')

SC["plan"] = ("4", "The plan, one tap", '<section class="scene" data-id="plan" data-tracker="ok:26|shops:32|online:42" data-tlabel="77 cartons · plan">'
  + bg("03-priya", kb="1.1,1.16,0px,0px,-20px,0px").replace('class="bg"', 'class="bg blur"')
  + lt("4", "The plan, one tap", "09:22 to 09:40 · Route Room · Priya's phone")
  + el("app", 0.04, "left:600px;top:96px;width:1220px;height:700px",
      '<div class="top"><span class="logo">SC</span><span class="nm">Smart-Clearance</span><span class="tabs"><span>Command Center</span><span class="on">Route Room</span><span>Execution</span><span>Paperwork</span><span>Finance &amp; ESG</span></span>' + av("priya") + '</div>'
      '<div class="body"><div class="bh"><b>MF-2409-117</b> · Masala Chips 150 g · Nagpur · 47 days left <span class="pill red">1,360 packets at risk</span></div>'
      '<div class="k">Recommended split</div><div class="bar"><i class="shops" data-f="0.12" style="--w:43%">588 to shops</i><i class="online" data-f="0.12" style="--w:57%">772 online</i></div>'
      '<div class="row" data-f="0.18"><span class="sw shops"></span><b>588 packets · 24½ cartons</b> → 14 Nagpur kirana shops at ₹18, buy 10 get 2</div>'
      '<div class="row" data-f="0.26"><span class="sw online"></span><b>772 packets · 32 cartons + 4</b> → ExpireSoon marketplace at ₹15, floor ₹14</div>'
      '<div class="tiles"><div class="tile" data-f="0.34"><span>You get</span><b>' + cnt(0, 21770, 0.34, 0.5, "inr") + '</b><small>54% of MRP</small></div><div class="tile" data-f="0.38"><span>Instead of losing</span><b class="red">−₹27,717</b><small>if binned</small></div><div class="tile" data-f="0.44"><span>GST credit stays safe</span><b class="green">' + cnt(0, 2611, 0.44, 0.56, "inr") + '</b><small>not paid back</small></div></div>'
      '<div class="row alt" data-f="0.52">Alternative considered: all 57 cartons online · ₹20,300 · not chosen</div>'
      '<div class="approve" data-f="0.56"><span class="btn">Approve plan</span><span class="ripple" data-f="0.74"></span>' + av("priya") + '<span class="tap" data-f="0.74">Priya · one tap · 09:40</span></div>'
      '<div class="toast" data-f="0.84">✓ Approved · listing going up · 38 shops being notified</div></div>')
  + '</section>')

SC["selling"] = ("5", "Selling, two ways at once", '<section class="scene split" data-id="selling" data-tracker="ok:26|shops:32|online:42" data-tlabel="77 cartons · selling">'
  + '<div class="half l">' + bg("06-kirana", kb="1.04,1.12,0px,0px,-20px,-10px") + '</div><div class="half r">' + bg("07-marketplace", kb="1.04,1.12,0px,0px,20px,-10px") + '</div><div class="divider"></div>'
  + lt("5", "Selling, two ways at once", "09:41 to 11:50 · Nagpur shops · Hyderabad buyer")
  + push(0.08, "left:40px;top:90px;width:520px", "आज का ऑफर: Munchly Masala Chips 150 g, 10 पैकेट लो, 2 मुफ़्त. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें.", "push to 38 shops · 09:41", hindi=True)
  + el("card grid", 0.18, "left:40px;top:330px;width:520px", '<div class="k">38 shops notified · orders by lunch</div><div class="g38" data-lit="14|0.2|0.62">' + "".join("<b></b>" for _ in range(38)) + '</div><div class="row"><b>' + cnt(0, 588, 0.2, 0.62, "int") + '</b> / 588 packets ordered · <b>' + cnt(0, 14, 0.2, 0.62, "int") + '</b> shops</div>')
  + el("bub me", 0.34, "left:40px;top:520px;width:520px", av("ganesh") + '<div class="say">Order: 24 packets (1 carton). Margin today ₹360, usually ₹90.<small>Ganesh ji · in the app · 09:52</small></div>')
  + el("listing", 0.40, "left:1240px;top:90px;width:620px", '<div class="lh"><b>ExpireSoon</b><span>clearance marketplace</span></div><div class="lb"><img src="img/01-carton.jpg" alt=""><div><div class="lt1">Munchly Masala Chips 150 g · 772 packets</div><div class="lp"><b>₹15</b> / packet <s>MRP ₹30</s></div><div class="ld">Best before 18 Nov 2026 · 47 days · label photo verified ✓</div><div class="lbtn">Place bid</div></div></div>')
  + el("bub me", 0.56, "left:1240px;top:430px;width:620px", av("venkat") + '<div class="say">₹13 a packet for all 772?<small>Venkat · Sri Venkateswara Traders · 11:02</small></div>')
  + el("bub", 0.63, "left:1240px;top:540px;width:620px", SC_AV + '<div class="say ag dots" data-until="0.68">' + DOTS + '</div><div class="say ag" data-f="0.68">₹14.20, Nagpur stock, dispatch within 24 hours of the balance.<small>Negotiator agent as Rakesh Traders · 11:03</small></div>')
  + el("bub me", 0.82, "left:1240px;top:660px;width:620px", av("venkat") + '<div class="say">Done. Token paid.<small>Venkat · 11:09</small></div>')
  + el("stamp g sm", 0.9, "left:1470px;top:330px", "TOKEN ₹1,644 RECEIVED")
  + '</section>')

SC["road"] = ("6", "On the road", '<section class="scene" data-id="road" data-tracker="ok:26|shops:32|online:42" data-tlabel="77 cartons · moving">'
  + bg("08-van", kb="1.04,1.12,0px,0px,-30px,-10px")
  + lt("6", "On the road", "Day 1 to 3 · Nagpur rounds, then the Hyderabad highway")
  + el("route", 0.06, "left:240px;top:80px;width:1440px", '<div class="line"></div><div class="fill" data-f="0.1"></div>'
      '<div class="node" style="left:0"><b>Kalamna godown</b><span>Nagpur · 77 cartons</span></div>'
      '<div class="node" style="left:50%"><b>14 kirana shops</b><span>Tuesday round · 24½ cartons</span></div>'
      '<div class="node" style="left:100%"><b>Hyderabad</b><span>500 km · Thursday · 32 cartons + 4</span></div>'
      '<div class="veh van" data-f="0.1"></div><div class="veh truck" data-f="0.5"></div>')
  + el("bub me", 0.3, "left:80px;top:300px;width:560px", av("rakesh") + '<div class="say hindi">Theek hai. Mangalvaar subah nikal jaunga.<small>Rakesh bhai · Monday 18:04</small></div>')
  + el("stamp g sm", 0.86, "left:1260px;top:300px", "EVERY PACKET 40+ DAYS INSIDE ITS DATE")
  + '</section>')

SC["paperwork"] = ("7", "The paperwork", '<section class="scene" data-id="paperwork" data-tracker="ok:26|shops:32|online:42" data-tlabel="77 cartons · invoiced">'
  + bg("09-finance", kb="1.04,1.1,0px,0px,0px,-20px")
  + lt("7", "The paperwork", "Day 3 · Anita's desk, finance, Pune")
  + doc(0.12, "left:110px;top:470px", "TAX INVOICE", "INV/26-27/0931", ["Rakesh Traders, Nagpur → Sri Venkateswara Traders, Hyderabad", "772 × Masala Chips 150 g at ₹14.20 · HSN 2005", "Taxable ₹10,962 · IGST 12% ₹1,315"], "₹12,277")
  + doc(0.24, "left:550px;top:470px", "CREDIT NOTE", "CN/0117", ["Munchly Foods → Rakesh Traders", "Shop scheme: 98 free packets × ₹16", "Against INV 0931, GST adjusted"], "₹1,568")
  + doc(0.36, "left:990px;top:470px", "E-WAY BILL CHECK", "MF-2409-117", ["Consignment value ₹12,277", "Threshold ₹50,000 (inter-state)", "Transporter note filed"], "NOT REQUIRED", ok=False)
  + doc(0.48, "left:1430px;top:470px", "GST ITC MEMO", "s.17(5)(h) · indicative", ["1,360 packets sold, not destroyed", "Input credit on stock retained", "No reversal in GSTR-3B"], "₹2,611 KEPT")
  + el("stamp g", 0.72, "left:1380px;top:280px", "ITC KEPT · ₹2,611")
  + el("bub me", 0.84, "left:80px;top:100px;width:620px", av("anita") + '<div class="say">Invoice, credit note, and the note showing we don\'t pay the GST credit back. First batch this year with nothing for me to chase.<small>Anita · finance</small></div>')
  + '</section>')

SC["report"] = ("8", "The report", '<section class="scene" data-id="report" data-tracker="ok:26|shops:32|online:42" data-tlabel="77 cartons · 0 binned">'
  + bg("10-boardroom", kb="1.04,1.1,0px,0px,-10px,-10px")
  + lt("8", "The report", "Quarter end · boardroom, Pune")
  + el("chart", 0.06, "left:150px;top:140px;width:760px", '<div class="k">Q3 FY27 · Smart-Clearance · BRSR Principle 6 · evidence attached</div>'
      '<div class="cr"><span>Recovered</span><i class="m" data-f="0.12" style="--w:86%"></i><b>' + cnt(0, 6.3, 0.12, 0.4, "lakh") + '</b></div>'
      '<div class="cr"><span>GST credit kept</span><i class="m" data-f="0.2" style="--w:30%"></i><b>' + cnt(0, 79, 0.2, 0.45, "k") + '</b></div>'
      '<div class="cr"><span>Waste avoided</span><i data-f="0.28" style="--w:70%"></i><b>' + cnt(0, 5.7, 0.28, 0.5, "t") + '</b></div>'
      '<div class="cr"><span>Meals served</span><i data-f="0.36" style="--w:40%"></i><b>' + cnt(0, 3700, 0.36, 0.55, "int") + '</b></div>')
  + el("card tile1", 0.5, "left:1180px;top:110px;width:600px", '<div class="k">This batch of chips</div><div class="big green">' + cnt(0, 217.6, 0.5, 0.64, "kg") + '</div><div class="k2">57 cartons × 3.84 kg kept out of landfill</div>')
  + el("stamp g", 0.62, "left:1420px;top:380px", "BRSR ✓")
  + el("bub me", 0.72, "left:1180px;top:520px;width:640px", av("vikram") + '<div class="say">5.7 tonnes kept out of landfill this quarter, with invoices behind every kilo. That goes straight into the annual report.<small>Vikram · sustainability</small></div>')
  + '</section>')

SC["mango"] = ("+", "And the Mango Drink?", '<section class="scene" data-id="mango" data-tracker="shops:69|staff:7.5|ok:20.5|donate:3" data-tlabel="74 cartons of Mango Drink · 22 days">'
  + bg("11-foodbank", kb="1.04,1.12,0px,0px,20px,-10px")
  + lt("+", "And the Mango Drink?", "another batch · 22 days left · Hyderabad")
  + el("bub", 0.1, "left:80px;top:100px;width:620px", SC_AV + '<div class="say ag">58 packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup Tuesday 10 am from Begum Bazaar?<small>Donation agent · to Feeding India, Hyderabad</small></div>')
  + el("bub me", 0.42, "left:80px;top:260px;width:620px", av("meera") + '<div class="say">Tuesday works. We\'ll serve them at the Charminar hunger spot this week.<small>Meera · Feeding India</small></div>')
  + el("card", 0.6, "left:80px;top:400px;width:620px", '<div class="k">2,000 packs · 74 cartons · too few days for the online market</div><div class="row">shops 51 cartons · ₹16,464</div><div class="row">staff sale 150 packs · ₹1,200</div><div class="row green">Feeding India 58 packs · 58 drinks served</div>')
  + el("stamp g", 0.8, "left:1380px;top:120px", "0 DESTROYED")
  + '</section>')

SC["outro"] = ('', "", '<section class="scene outro" data-id="outro" data-tracker="">'
  + bg("02-range", kb="1.1,1.18,0px,0px,-20px,0px").replace('class="bg"', 'class="bg dark"')
  + el("brand top", 0.02, "", '<div class="mark">SC<i></i></div><div class="bn">Smart-Clearance</div><div class="hi hindi" data-f="0.1">हर कार्टन को दूसरा मौका</div><div class="tg" data-f="0.14">Every carton gets a second chance, chosen by AI</div>')
  + el("stats", 0.3, "", '<div class="st" data-f="0.3"><span>Human decisions</span><b>1</b><small>Priya\'s tap at 09:40</small></div><div class="st" data-f="0.36"><span>Recovered</span><b>' + cnt(0, 21770, 0.36, 0.56, "inr") + '</b><small>instead of −₹27,717</small></div><div class="st" data-f="0.42"><span>GST credit kept</span><b>' + cnt(0, 2611, 0.42, 0.6, "inr") + '</b><small>not paid back</small></div><div class="st" data-f="0.48"><span>Out of landfill</span><b>' + cnt(0, 218, 0.48, 0.64, "kgi") + '</b><small>one batch of chips</small></div>')
  + el("stack", 0.68, "", 'Google Cloud · Gemini on Vertex AI · Agent Development Kit · Firebase · SvelteKit PWA')
  + el("team", 0.8, "", 'A Google AI Hackathon prototype · October 2026')
  + '</section>')

TRACK = [("warning", "Warn"), ("photo", "Photo"), ("doors", "Doors"), ("plan", "Plan"), ("selling", "Sell"), ("road", "Road"), ("paperwork", "Papers"), ("report", "Report"), ("mango", "Mango")]

scenes = "\n".join(SC[s["scene"]][2] for s in segs)
track_nodes = "".join(f'<div class="node" data-id="{k}" style="left:{i*96}px"><b>{i+1}</b><span>{lab}</span></div>' for i, (k, lab) in enumerate(TRACK))
timeline_js = json.dumps([{"id": s["scene"], "start": s["start"], "dur": s["dur"], "audio": s["audio_sec"], "text": s["text"]} for s in segs], ensure_ascii=False)

CSS = r"""
:root{--display:"Bricolage Grotesque","IBM Plex Sans",system-ui,sans-serif;--body:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;--hindi:"Noto Sans Devanagari","IBM Plex Sans",sans-serif;
 --ink:#15201b;--green:#176b4e;--green2:#2fd27a;--amber:#e3b74d;--red:#c2262f;--purple:#4c2a9c;--orange:#c56a1f;--blue:#2a5fa8;--donate:#0f8a5f;--idle:#b9c6bf}
html,body{margin:0;background:#070d0a;color:var(--ink);font-family:var(--body);overflow:hidden}
#frame{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070d0a}
.hindi{font-family:var(--hindi)}
/* scenes and backgrounds */
.scene{position:absolute;inset:0;opacity:0;transition:opacity .9s ease;pointer-events:none;overflow:hidden}
.scene.on{opacity:1}
.bg{position:absolute;inset:0;overflow:hidden;transition:opacity 1.1s ease}
.bg[data-f]{opacity:0;transform:none}
.bg[data-f].go{opacity:1;animation:none}
.bg.gone{display:block!important;opacity:0}
.bg img,.bg video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;transform:scale(var(--s0)) translate(var(--x0),var(--y0));will-change:transform}
.scene.on .bg img,.scene.on .bg video{animation:kb 30s linear forwards}
@keyframes kb{from{transform:scale(var(--s0)) translate(var(--x0),var(--y0))}to{transform:scale(var(--s1)) translate(var(--x1),var(--y1))}}
.bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,13,10,.28) 0%,rgba(7,13,10,0) 22%,rgba(7,13,10,0) 62%,rgba(7,13,10,.86) 100%)}
.bg.blur img{filter:blur(7px) brightness(.55)}
.bg.dark img{filter:blur(4px) brightness(.28) saturate(.7)}
.split .half{position:absolute;top:0;bottom:0;width:960px;overflow:hidden}.split .half.l{left:0}.split .half.r{left:960px}
.split .divider{position:absolute;left:958px;top:0;bottom:0;width:4px;background:rgba(255,255,255,.75);z-index:3}
.dim{position:absolute;inset:0;background:rgba(7,13,10,.78);z-index:2}
.dim.go{animation:fadein 1.2s ease forwards}
/* staged entrances */
[data-f]{opacity:0;transform:translateY(18px)}
[data-f].go{animation:pop .55s cubic-bezier(.2,.8,.2,1) forwards}
.gone{opacity:0!important;transition:opacity .6s}
@keyframes pop{to{opacity:1;transform:none}}
@keyframes fadein{to{opacity:1}}
@keyframes popbig{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
/* chrome */
#brandtag{position:absolute;left:40px;top:26px;z-index:30;display:flex;align-items:center;gap:12px;font-family:var(--display);font-weight:800;font-size:22px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
#brandtag b{width:34px;height:34px;border-radius:10px;background:var(--green);display:grid;place-items:center;font-size:15px;box-shadow:0 0 0 3px rgba(220,239,229,.35)}
#track{position:absolute;left:50%;top:22px;width:820px;margin-left:-410px;height:60px;z-index:25;opacity:0;transition:opacity .6s}
#track.show{opacity:1}
#track .line{position:absolute;left:14px;right:14px;top:14px;height:3px;background:rgba(255,255,255,.35);border-radius:2px}
#track .fill{position:absolute;left:14px;top:14px;height:3px;background:var(--amber);border-radius:2px;width:0;transition:width .9s cubic-bezier(.2,.8,.2,1)}
#track .node{position:absolute;top:4px;width:24px;height:24px;border-radius:50%;background:rgba(7,13,10,.6);border:2px solid rgba(255,255,255,.6);display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:12px;color:#fff;transition:all .4s;backdrop-filter:blur(4px)}
#track .node span{position:absolute;top:30px;font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.85);white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.7)}
#track .node.done{background:var(--green);border-color:var(--green)}
#track .node.now{border-color:var(--amber);background:var(--amber);color:#15201b;box-shadow:0 0 0 6px rgba(227,183,77,.3);transform:scale(1.15)}
#progress{position:absolute;left:0;top:0;height:6px;background:var(--amber);width:0;z-index:40}
#caption{position:absolute;left:0;right:0;bottom:0;height:200px;display:flex;align-items:flex-end;justify-content:center;padding:0 200px 50px;z-index:20}
#caption p{margin:0;font-size:31px;line-height:1.4;color:rgba(255,255,255,.55);text-align:center;text-wrap:balance;max-width:1480px;text-shadow:0 2px 12px rgba(0,0,0,.8)}
#caption .s{transition:color .3s}#caption .s.now{color:#fff}
/* lower third */
.lt{position:absolute;left:80px;bottom:225px;display:flex;align-items:baseline;gap:16px;padding:14px 24px 14px 18px;background:rgba(7,13,10,.72);backdrop-filter:blur(10px);border-left:5px solid var(--amber);border-radius:0 14px 14px 0;color:#fff;z-index:12;transform:translateX(-40px)}
.lt.go{animation:ltin .7s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes ltin{to{opacity:1;transform:none}}
.lt .n{font-family:var(--display);font-weight:800;font-size:46px;color:var(--amber);line-height:1;letter-spacing:-.03em}
.lt .tt{font-family:var(--display);font-weight:800;font-size:34px;letter-spacing:-.02em}
.lt .w{font-family:var(--mono);font-size:17px;color:rgba(255,255,255,.75);margin-left:10px}
/* carton tracker */
#tracker{position:absolute;right:80px;bottom:228px;width:420px;padding:12px 16px 12px;background:rgba(7,13,10,.72);backdrop-filter:blur(10px);border-radius:12px;color:#fff;z-index:12;opacity:0;transition:opacity .6s}
#tracker.show{opacity:1}
#tracker .k{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7);display:flex;justify-content:space-between;margin-bottom:8px}
#tracker .bar{display:flex;height:14px;border-radius:5px;overflow:hidden;gap:2px;background:rgba(255,255,255,.12)}
#tracker .bar i{display:block;height:100%;width:0;transition:width 1s cubic-bezier(.2,.8,.2,1)}
#tracker .bar .ok{background:var(--idle)}#tracker .bar .risk{background:var(--red)}#tracker .bar .shops{background:var(--orange)}#tracker .bar .online{background:#8a6cf0}#tracker .bar .donate{background:var(--green2)}#tracker .bar .staff{background:var(--amber)}
#tracker .leg{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;font-size:13px;color:rgba(255,255,255,.85)}
#tracker .leg b{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
/* cards */
.card{position:absolute;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);border-radius:16px;padding:20px 24px;box-shadow:0 24px 60px rgba(0,0,0,.35);z-index:6;color:var(--ink)}
.card .k{font-family:var(--mono);font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#4e5c55;margin-bottom:8px}
.card .k2{font-size:17px;color:#4e5c55;margin-top:4px}
.card .h{font-family:var(--display);font-weight:700;font-size:30px;line-height:1.2;letter-spacing:-.02em}
.card .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.card .chips span{font-family:var(--mono);font-size:15px;padding:6px 12px;border-radius:999px;border:1px solid #d5ded8;color:#33403a}
.card .row{font-size:21px;line-height:1.35;padding:8px 0;border-bottom:1px dashed #d5ded8}.card .row:last-child{border-bottom:none}
.card .row.no{color:var(--red)}.card .row.no b::before{content:"✕ ";font-weight:800}.card .row.ok{color:var(--green);font-weight:600}.card .row.red{color:var(--red)}.card .row.green{color:var(--green)}
.card .row.mono{font-family:var(--mono);font-size:19px}
.card .ah{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:15px;color:var(--green);margin-bottom:6px;letter-spacing:.02em}
.pulse{width:12px;height:12px;border-radius:50%;background:var(--green2);box-shadow:0 0 0 0 rgba(47,210,122,.6);animation:pulse 1.6s ease-out infinite}
@keyframes pulse{to{box-shadow:0 0 0 12px rgba(47,210,122,0)}}
.card .big{font-family:var(--display);font-weight:800;font-size:64px;letter-spacing:-.03em;line-height:1.05;margin-top:6px}.card .big.red{color:var(--red)}.card .big.green{color:var(--green)}
.card.vis{background:rgba(15,25,20,.9);color:#e9f2ec}.card.vis .row{border-color:rgba(255,255,255,.14);color:#dbe6df}.card.vis .row b{color:#fff}.card.vis .row.ok{color:var(--green2)}
/* phone */
.phone{position:absolute;width:300px;height:620px;background:#0a0f0d;border-radius:46px;padding:12px;box-shadow:0 30px 70px rgba(0,0,0,.5),inset 0 0 0 2px #2a332e;z-index:8;transform:translateX(120px) rotate(6deg)}
.phone.go{animation:phonein .9s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes phonein{to{opacity:1;transform:none}}
.phone .scr{position:relative;width:100%;height:100%;border-radius:36px;overflow:hidden;background:radial-gradient(500px 600px at 30% 20%,#1d4a38,#0b1a14 70%)}
.phone .sb{display:flex;justify-content:space-between;padding:14px 22px 0;font-family:var(--mono);font-size:14px;color:#fff;font-weight:500}
.phone .sb .ic{display:flex;gap:6px;align-items:center}.phone .sb .sig{width:16px;height:10px;background:linear-gradient(90deg,#fff 0 3px,transparent 3px 4.5px,#fff 4.5px 7.5px,transparent 7.5px 9px,#fff 9px 12px,transparent 12px 13.5px,#fff 13.5px);clip-path:polygon(0 60%,25% 60%,25% 40%,50% 40%,50% 20%,75% 20%,75% 0,100% 0,100% 100%,0 100%)}
.phone .sb .bat{width:22px;height:11px;border:1.5px solid #fff;border-radius:3px;position:relative}.phone .sb .bat::after{content:"";position:absolute;left:1.5px;top:1.5px;bottom:1.5px;width:70%;background:#fff;border-radius:1px}
.phone .lock{text-align:center;color:#fff;margin-top:34px}.phone .lt2{font-family:var(--display);font-weight:600;font-size:64px;letter-spacing:-.03em;line-height:1}.phone .ld{font-size:16px;opacity:.85;margin-top:4px}
.phone .notif{position:absolute;left:12px;right:12px;top:190px;background:rgba(255,255,255,.96);border-radius:20px;padding:12px 14px;color:var(--ink);transform:translateY(-60px)}
.phone .notif.go{animation:notif .7s cubic-bezier(.2,.9,.3,1.25) forwards}
@keyframes notif{to{opacity:1;transform:none}}
.nh{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:12px;color:#4e5c55;letter-spacing:.04em;text-transform:uppercase}
.nh .appname b{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:6px;background:var(--green);color:#fff;font-family:var(--display);font-size:10px;margin-right:6px;vertical-align:-5px}
.phone .nt{font-weight:600;font-size:16px;margin-top:6px}.phone .nb{font-size:15px;line-height:1.35;margin-top:3px}
.phone .scr::before{content:"";position:absolute;left:50%;top:10px;width:90px;height:24px;margin-left:-45px;background:#0a0f0d;border-radius:14px;z-index:2}
/* push card (notification without the phone) */
.push{position:absolute;background:rgba(255,255,255,.96);border-radius:20px;padding:14px 18px;box-shadow:0 20px 50px rgba(0,0,0,.35);z-index:7;transform:translateY(-50px)}
.push.go{animation:notif .7s cubic-bezier(.2,.9,.3,1.25) forwards}
.push .pb{font-size:22px;line-height:1.35;margin-top:8px}.push .ps{font-family:var(--mono);font-size:14px;color:#4e5c55;margin-top:6px}
/* chat bubbles */
.bub{position:absolute;display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;align-items:start;z-index:7}
.bub.me{grid-template-columns:minmax(0,1fr) 52px}.bub.me .av{order:2}.bub.me .say{justify-self:end;background:#f1f4f1}
.av{width:52px;height:52px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.av.sc{display:grid;place-items:center;background:var(--green);color:#fff;font-family:var(--display);font-weight:800;font-size:17px;border-color:#dcefe5}
.say{background:#fff;border-radius:16px;padding:12px 16px;font-size:21px;line-height:1.35;box-shadow:0 14px 36px rgba(0,0,0,.3);max-width:560px;position:relative}
.say.ag{background:#dcefe5}.say small{display:block;font-family:var(--mono);font-size:13px;color:#4e5c55;margin-top:5px}
.say.dots{letter-spacing:3px;font-size:24px;padding:8px 18px}.say.dots .d{display:inline-block;animation:typing 1s infinite}.say.dots .d:nth-child(2){animation-delay:.2s}.say.dots .d:nth-child(3){animation-delay:.4s}
@keyframes typing{0%,100%{opacity:.2}50%{opacity:1}}
.bub .say[data-f]{position:absolute;left:64px;top:0}
/* intro / outro */
.hl{position:absolute;z-index:4;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.7)}
.hl .k,.loss .k,.brand .k{font-family:var(--mono);font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber);margin-bottom:18px}
.hl .l1{font-family:var(--display);font-weight:800;font-size:76px;line-height:1.05;letter-spacing:-.03em}
.hl .l2{font-size:34px;line-height:1.35;margin-top:22px;color:rgba(255,255,255,.9);max-width:900px}
.loss{position:absolute;z-index:4;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.7)}
.loss .big{font-family:var(--display);font-weight:800;font-size:150px;letter-spacing:-.04em;line-height:1;color:#ff8088}
.loss .k2{font-size:26px;color:rgba(255,255,255,.85);margin-top:14px;max-width:760px}
.brand{position:absolute;left:0;right:0;top:300px;text-align:center;color:#fff;z-index:5}
.brand.top{top:150px}
.mark{width:130px;height:130px;border-radius:34px;background:var(--green);display:grid;place-items:center;margin:0 auto 26px;font-family:var(--display);font-weight:800;font-size:52px;color:#fff;box-shadow:0 0 0 14px rgba(220,239,229,.22);position:relative;animation:glow 2.4s ease-in-out infinite}
.mark i{position:absolute;top:-12px;left:50%;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--amber)}
@keyframes glow{0%,100%{box-shadow:0 0 0 14px rgba(220,239,229,.22)}50%{box-shadow:0 0 0 30px rgba(220,239,229,.07)}}
.bn{font-family:var(--display);font-weight:800;font-size:118px;letter-spacing:-.04em;line-height:1}
.brand .hi{font-size:44px;color:#9fd6b8;margin-top:14px}.brand .tg{font-size:34px;color:#dfe8e2;margin-top:16px}
.stats{position:absolute;left:0;right:0;top:600px;display:flex;justify-content:center;gap:22px;z-index:5}
.st{width:330px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:18px 22px;color:#fff;backdrop-filter:blur(8px)}
.st > span{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7)}.st b{display:block;font-family:var(--display);font-weight:800;font-size:54px;letter-spacing:-.03em;line-height:1.1;margin-top:6px;color:#ffd97a}.st small{display:block;font-size:15px;color:rgba(255,255,255,.75);margin-top:4px}
.stack{position:absolute;left:0;right:0;top:860px;text-align:center;font-family:var(--mono);font-size:22px;color:#9fb3a8;z-index:5}
.team{position:absolute;left:0;right:0;top:905px;text-align:center;font-family:var(--mono);font-size:18px;color:#6f8578;z-index:5}
/* scan */
.scan{position:absolute;z-index:7}
.scan .c{position:absolute;width:44px;height:44px;border:5px solid var(--green2);filter:drop-shadow(0 0 8px rgba(47,210,122,.8))}
.scan .tl{left:0;top:0;border-right:none;border-bottom:none}.scan .tr{right:0;top:0;border-left:none;border-bottom:none}.scan .bl{left:0;bottom:0;border-right:none;border-top:none}.scan .br{right:0;bottom:0;border-left:none;border-top:none}
.scan .flash{position:absolute;inset:-900px;background:#fff;opacity:0;transform:none}.scan .flash.go{animation:flash .6s ease-out forwards}
@keyframes flash{0%{opacity:0}12%{opacity:.95}100%{opacity:0}}
.scan .line{position:absolute;left:8px;right:8px;top:0;height:4px;background:var(--green2);box-shadow:0 0 16px var(--green2);opacity:0;transform:none}.scan .line.go{animation:scan 1.3s linear 2}
@keyframes scan{0%{opacity:1;top:6px}100%{opacity:1;top:calc(100% - 10px)}}
.stamp{position:absolute;font-family:var(--display);font-weight:800;font-size:40px;color:var(--green);border:5px solid var(--green);border-radius:12px;padding:8px 20px;transform:rotate(-10deg) scale(3);background:rgba(255,255,255,.85);z-index:9;letter-spacing:.02em;white-space:nowrap}
.stamp.sm{font-size:26px;border-width:4px}
.stamp.go{animation:stamp .5s cubic-bezier(.2,.9,.3,1.3) forwards}
@keyframes stamp{to{opacity:1;transform:rotate(-10deg) scale(1)}}
/* doors */
.dl{position:absolute;width:256px;text-align:center;background:rgba(255,255,255,.94);border-radius:14px;padding:12px 10px;box-shadow:0 16px 40px rgba(0,0,0,.3);z-index:6;border-top:6px solid #7d8a83}
.dl .dn{font-family:var(--display);font-weight:700;font-size:20px}.dl .dv{font-family:var(--mono);font-size:34px;font-weight:500;color:var(--green);margin:2px 0}.dl .dr{font-size:14px;color:#4e5c55}
.dl.es{border-top-color:var(--purple)}.dl.sel{border-top-color:var(--green)}.dl.fb{border-top-color:var(--donate)}.dl.fb .dv{color:#4e5c55}
.dl.bin{border-top-color:var(--red)}.dl.bin .dv{color:var(--red)}.dl.bin.go{animation:pop .5s forwards,shake .5s .6s 2}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
/* app screen */
.app{position:absolute;background:#f6f8f6;border-radius:18px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6);z-index:6;color:var(--ink);transform:translateY(30px) scale(.98)}
.app.go{animation:pop .7s cubic-bezier(.2,.8,.2,1) forwards}
.app .top{display:flex;align-items:center;gap:14px;height:66px;padding:0 22px;background:#0f1a15;color:#fff}
.app .logo{width:34px;height:34px;border-radius:10px;background:var(--green);display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:15px}
.app .nm{font-family:var(--display);font-weight:800;font-size:20px}
.app .tabs{display:flex;gap:6px;margin-left:30px}.app .tabs span{font-size:16px;padding:8px 14px;border-radius:8px;color:rgba(255,255,255,.7)}.app .tabs span.on{background:rgba(255,255,255,.12);color:#fff;font-weight:600}
.app .top .av{width:38px;height:38px;margin-left:auto;border-width:2px}
.app .body{padding:18px 26px;position:relative;height:calc(100% - 66px);box-sizing:border-box}
.app .bh{font-size:20px;color:#33403a;display:flex;align-items:center;gap:12px;margin-bottom:12px}.app .bh b{font-family:var(--mono)}
.pill{font-family:var(--mono);font-size:14px;padding:5px 12px;border-radius:999px}.pill.red{background:#fbe3e4;color:var(--red);border:1px solid var(--red)}
.app .k{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#4e5c55;margin:6px 0}
.app .bar{display:flex;height:34px;border-radius:8px;overflow:hidden;gap:3px;background:#e9efe9;margin-bottom:10px}
.app .bar i{display:block;height:100%;width:0;transform:none;opacity:1;color:#fff;font-size:15px;font-weight:600;line-height:34px;padding-left:12px;white-space:nowrap;overflow:hidden;transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.app .bar i.go{width:var(--w);animation:none}.app .bar .shops{background:var(--orange)}.app .bar .online{background:var(--purple)}
.app .row{font-size:19px;padding:7px 0;border-bottom:1px dashed #d5ded8;display:flex;align-items:center;gap:10px}.app .row.alt{color:#4e5c55;border:none;font-size:17px}
.sw{display:inline-block;width:14px;height:14px;border-radius:4px}.sw.shops{background:var(--orange)}.sw.online{background:var(--purple)}
.app .tiles{display:flex;gap:14px;margin:14px 0 6px}
.app .tile{flex:1;background:#fff;border:1px solid #d5ded8;border-radius:12px;padding:12px 16px}.app .tile > span{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#4e5c55}.app .tile b{display:block;font-family:var(--display);font-weight:800;font-size:40px;letter-spacing:-.03em;line-height:1.1;margin-top:4px}.app .tile b.red{color:var(--red)}.app .tile b.green{color:var(--green)}.app .tile small{font-size:14px;color:#4e5c55}
.app .approve{display:flex;align-items:center;gap:16px;margin-top:10px;position:relative}
.app .btn{display:inline-block;background:var(--green);color:#fff;font-family:var(--display);font-weight:800;font-size:24px;padding:14px 40px;border-radius:12px;box-shadow:0 10px 24px rgba(23,107,78,.35);position:relative}
.app .ripple{position:absolute;left:120px;top:-4px;width:70px;height:70px;border-radius:50%;border:4px solid var(--amber);opacity:0;transform:none}.app .ripple.go{animation:ripple .9s ease-out forwards}
@keyframes ripple{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(1.8)}}
.app .approve .av{width:44px;height:44px;border-width:2px}
.app .tap{font-family:var(--mono);font-size:15px;color:#4e5c55}
.app .toast{position:absolute;left:26px;right:26px;bottom:16px;background:#0f1a15;color:#dcefe5;border-radius:12px;padding:12px 18px;font-size:19px;transform:translateY(40px)}
.app .toast.go{animation:toast .6s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes toast{to{opacity:1;transform:none}}
/* 38 shops */
.g38{display:grid;grid-template-columns:repeat(19,20px);gap:6px;margin:8px 0 12px}
.g38 b{width:20px;height:20px;border-radius:50%;background:#e0d2b4;border:1.5px solid #b9a06a;transition:background .3s,transform .3s}
.g38 b.lit{background:var(--green);border-color:#0f4d37;transform:scale(1.2)}
/* listing */
.listing{position:absolute;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4);z-index:6}
.listing .lh{display:flex;align-items:baseline;gap:12px;background:var(--purple);color:#fff;padding:12px 18px}.listing .lh b{font-family:var(--display);font-weight:800;font-size:24px}.listing .lh span{font-size:14px;opacity:.85}
.listing .lb{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;padding:16px 18px}.listing .lb img{width:150px;height:150px;object-fit:cover;border-radius:10px}
.listing .lt1{font-weight:600;font-size:21px}.listing .lp{margin-top:6px;font-size:18px}.listing .lp b{font-family:var(--display);font-size:38px;color:var(--purple)}.listing .lp s{color:#7d8a83;margin-left:8px}
.listing .ld{font-size:15px;color:#4e5c55;margin-top:4px}.listing .lbtn{display:inline-block;margin-top:10px;background:var(--purple);color:#fff;font-weight:600;padding:8px 22px;border-radius:8px;font-size:17px}
/* route */
.route{position:absolute;height:150px;z-index:6}
.route .line{position:absolute;left:0;right:0;top:40px;height:6px;background:rgba(255,255,255,.55);border-radius:3px}
.route .fill{position:absolute;left:0;top:40px;height:6px;background:var(--amber);border-radius:3px;width:0;transform:none;opacity:1}.route .fill.go{animation:none;transition:width 12s linear;width:100%}
.route .node{position:absolute;top:22px;width:0}.route .node::before{content:"";position:absolute;left:-14px;top:4px;width:28px;height:28px;border-radius:50%;background:#fff;border:6px solid var(--green);box-sizing:border-box}
.route .node b{position:absolute;left:-150px;width:300px;top:48px;text-align:center;font-family:var(--display);font-weight:800;font-size:22px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.8);white-space:nowrap}
.route .node span{position:absolute;left:-180px;width:360px;top:78px;text-align:center;font-family:var(--mono);font-size:15px;color:rgba(255,255,255,.9);text-shadow:0 2px 10px rgba(0,0,0,.8);white-space:nowrap}
.route .veh{position:absolute;top:8px;width:70px;height:30px;background:#fff;border:3px solid var(--ink);border-radius:8px 12px 4px 4px;opacity:0;transform:none}
.route .veh::after{content:"";position:absolute;right:-3px;top:6px;width:20px;height:20px;background:var(--amber);border:3px solid var(--ink);border-radius:4px 10px 4px 4px}
.route .veh.truck{width:100px;background:#fff}.route .veh.truck::after{background:var(--purple)}
.route .veh.van.go{animation:van 5s cubic-bezier(.4,0,.6,1) forwards}
@keyframes van{0%{opacity:1;left:-40px}100%{opacity:1;left:calc(50% - 40px)}}
.route .veh.truck.go{animation:truck 5s cubic-bezier(.4,0,.6,1) forwards}
@keyframes truck{0%{opacity:1;left:calc(50% - 50px)}100%{opacity:1;left:calc(100% - 60px)}}
/* documents */
.doc{position:absolute;width:380px;background:#fff;border-radius:10px;padding:16px 18px;box-shadow:0 20px 50px rgba(0,0,0,.35);z-index:6;border-top:6px solid #7d8a83;transform:translateY(60px)}
.doc.ok{border-top-color:var(--green)}.doc.go{animation:pop .6s cubic-bezier(.2,.8,.2,1) forwards}
.doc .dh{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--mono);font-size:13px;color:#4e5c55;letter-spacing:.06em}.doc .dh b{font-family:var(--display);font-size:20px;color:var(--ink);letter-spacing:0}
.doc .dr{font-size:15px;line-height:1.35;padding:6px 0;border-bottom:1px dashed #d5ded8;color:#33403a}
.doc .dt{font-family:var(--mono);font-size:24px;font-weight:500;margin-top:10px;color:var(--green)}
/* chart */
.chart{position:absolute;background:rgba(255,255,255,.96);border-radius:14px;padding:18px 22px;box-shadow:0 24px 60px rgba(0,0,0,.35);z-index:6}
.chart .k{font-family:var(--mono);font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#4e5c55;margin-bottom:12px}
.chart .cr{display:grid;grid-template-columns:200px minmax(0,1fr) 120px;gap:14px;align-items:center;margin:12px 0;font-size:20px}
.chart .cr i{display:block;height:26px;border-radius:5px;background:var(--green);width:0;opacity:1;transform:none;transition:width 1.3s cubic-bezier(.2,.8,.2,1)}.chart .cr i.m{background:var(--amber)}.chart .cr i.go{width:var(--w);animation:none}
.chart .cr b{text-align:right;font-family:var(--mono);font-size:24px;font-weight:500}
/* play overlay */
#play[hidden]{display:none}
#play{position:absolute;inset:0;display:grid;place-items:center;background:rgba(7,13,10,.86);z-index:50;cursor:pointer}
#play div{font-family:var(--display);font-weight:800;font-size:60px;color:#fff;padding:30px 60px;border:4px solid var(--amber);border-radius:24px}
"""

JS = r"""
const TL = __TL__;
const TOTAL = __TOTAL__;
const TRACK = __TRACK__;
const frame = document.getElementById('frame');
function fit(){const s=Math.min(innerWidth/1920, innerHeight/1080); frame.style.transform='scale('+s+')'; frame.style.transformOrigin='top left'; frame.style.marginLeft=((innerWidth-1920*s)/2)+'px'; frame.style.marginTop=((innerHeight-1080*s)/2)+'px';}
addEventListener('resize', fit); fit();
for (const seg of TL) { const parts = seg.text.match(/[^.!?]+[.!?]+/g) || [seg.text]; const total = parts.reduce((a,p)=>a+p.length,0); let acc=0; seg.chunks = parts.map(p=>{const st=acc/total; acc+=p.length; return {t:p.trim(), from:st, to:acc/total};}); }
const scenes = Object.fromEntries([...document.querySelectorAll('.scene')].map(s=>[s.dataset.id, s]));
const cap = document.getElementById('cap'), prog=document.getElementById('progress');
const track = document.getElementById('track'), tfill = track.querySelector('.fill');
const tracker = document.getElementById('tracker'), tbar = tracker.querySelector('.bar'), tleg = tracker.querySelector('.leg'), tlab = tracker.querySelector('.k span');
const LEG = {ok:'selling normally', risk:'at risk', shops:'to kirana shops', online:'online marketplace', donate:'to Feeding India', staff:'staff sale'};
const inr = n => { n = Math.round(n); const s = String(Math.abs(n)); let out = s.length > 3 ? s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3) : s; return (n<0?'−':'') + out; };
const fmt = { int: v => inr(v), inr: v => (v<0?'−':'') + '₹' + inr(Math.abs(v)), lakh: v => '₹' + v.toFixed(1) + ' L', k: v => '₹' + Math.round(v) + ' k', t: v => v.toFixed(1) + ' t', kg: v => v.toFixed(1) + ' kg', kgi: v => Math.round(v) + ' kg' };
let startWall = 0, current = null, raf = 0;
window.__startWall = 0;
function setTracker(spec, label){ if(!spec){ tracker.classList.remove('show'); return; } tracker.classList.add('show'); tlab.textContent = label || '';
  const parts = spec.split('|').map(p=>{const [k,v]=p.split(':'); return {k, v:parseFloat(v)};});
  const key = parts.map(p=>p.k).join(',');
  if (tbar.dataset.key !== key) { tbar.innerHTML = parts.map(p=>'<i class="'+p.k+'" style="width:0"></i>').join(''); tbar.dataset.key = key; }
  requestAnimationFrame(()=>{ [...tbar.children].forEach((i,n)=>{ i.style.width = parts[n].v + '%'; }); });
  tleg.innerHTML = parts.map(p=>'<span><b class="'+p.k+'"></b>'+LEG[p.k]+'</span>').join('');
  tleg.querySelectorAll('b').forEach(b=>{ b.style.background = getComputedStyle(tbar.querySelector('.'+b.className)).backgroundColor; }); }
function enter(seg){ current = seg; for (const s of Object.values(scenes)) { s.classList.remove('on'); s.querySelectorAll('video').forEach(v=>v.pause()); }
  const el = scenes[seg.id]; el.classList.add('on'); el.querySelectorAll('video').forEach(v=>{ v.currentTime = 0; v.play().catch(()=>{}); });
  el.querySelectorAll('[data-f]').forEach(n=>{ n.classList.remove('go'); n.classList.remove('gone'); });
  el.querySelectorAll('[data-count]').forEach(n=>{ const [a,,,,f] = n.dataset.count.split('|'); n.textContent = fmt[f](parseFloat(a)); });
  el.querySelectorAll('.g38 b').forEach(b=>b.classList.remove('lit'));
  cap.innerHTML = seg.chunks.map(c=>'<span class="s">'+c.t+'</span>').join(' ');
  const idx = TRACK.indexOf(seg.id); track.classList.toggle('show', idx >= 0);
  if (idx >= 0) { track.querySelectorAll('.node').forEach((n,i)=>{ n.classList.toggle('done', i < idx); n.classList.toggle('now', i === idx); }); tfill.style.width = (idx*96) + 'px'; }
  setTracker(el.dataset.tracker, el.dataset.tlabel); }
function tick(){ const t = (performance.now()-startWall)/1000; const seg = TL.find(s=> t>=s.start && t < s.start+s.dur) || TL[TL.length-1];
  if (seg !== current) enter(seg);
  const rel = (t-seg.start)/seg.dur, relA = (t-seg.start)/seg.audio; const el = scenes[seg.id];
  el.querySelectorAll('[data-f]').forEach(n=>{ if (rel >= parseFloat(n.dataset.f)) n.classList.add('go'); });
  el.querySelectorAll('[data-until]').forEach(n=>{ if (rel >= parseFloat(n.dataset.until)) n.classList.add('gone'); });
  el.querySelectorAll('[data-count]').forEach(n=>{ const [a,b,f0,f1,f] = n.dataset.count.split('|'); const p = Math.max(0, Math.min(1, (rel-parseFloat(f0))/(parseFloat(f1)-parseFloat(f0)))); const e = 1-Math.pow(1-p,3); n.textContent = fmt[f](parseFloat(a) + (parseFloat(b)-parseFloat(a))*e); });
  el.querySelectorAll('.g38').forEach(g=>{ const [n,f0,f1] = g.dataset.lit.split('|').map(parseFloat); const p = Math.max(0, Math.min(1, (rel-f0)/(f1-f0))); const lit = Math.floor(p*n); g.querySelectorAll('b').forEach((b,i)=>b.classList.toggle('lit', i < lit)); });
  cap.querySelectorAll('.s').forEach((n,i)=>{ const c=seg.chunks[i]; n.classList.toggle('now', relA>=c.from && relA<c.to+0.02); });
  prog.style.width = Math.min(100, t/TOTAL*100)+'%';
  if (t < TOTAL+0.5) raf = requestAnimationFrame(tick); }
function start(){ startWall = performance.now(); window.__startWall = Date.now(); const a=document.getElementById('nar'); if(a){a.currentTime=0; a.play().catch(()=>{});} tick(); }
window.start = start;
const auto = new URLSearchParams(location.search).get('autoplay');
const ready = Promise.all([document.fonts.ready, ...[...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r;}))]);
if (auto) { ready.then(()=>setTimeout(start, 500)); }
else { const p=document.getElementById('play'); p.hidden=false; p.addEventListener('click', ()=>{p.hidden=true; start();}); }
"""

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Smart-Clearance walkthrough</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@500;700&display=swap">
<style>{CSS}</style></head>
<body><div id="frame">
{scenes}
<div id="brandtag"><b>SC</b>Smart-Clearance</div>
<div id="track"><div class="line"></div><div class="fill"></div>{track_nodes}</div>
<div id="progress"></div>
<div id="tracker"><div class="k"><span></span><span>where the cartons stand</span></div><div class="bar"></div><div class="leg"></div></div>
<div id="caption"><p id="cap"></p></div>
<div id="play" hidden><div>▶ Play ({int(TOTAL // 60)}:{int(TOTAL % 60):02d})</div></div>
{audio_tag}
</div>
<script>{JS.replace("__TL__", timeline_js).replace("__TOTAL__", str(TOTAL)).replace("__TRACK__", json.dumps([k for k, _ in TRACK]))}</script></body></html>'''
(HERE / out_name).write_text(html)
print(f"wrote {out_name} · {TOTAL:.0f} s · {len(segs)} scenes")
