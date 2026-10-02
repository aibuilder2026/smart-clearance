"""Builds video/walkthrough.html: a 1920x1080 auto-playing animated walkthrough of the
Smart-Clearance story, timed to the narration in narration.json.

  python3 build.py                 -> walkthrough.html (silent; used for headless recording)
  python3 build.py --audio x.m4a   -> walkthrough-with-audio.html (narration embedded, Play button)

Animation model: every element with data-f="0.35" gets the class .go when the scene is 35% through
its narration; CSS decides what .go means for that element (pop in, open, grow, drive, stamp).
Elements with data-until="0.6" get .gone at 60%. Elements with data-count tick numbers in JS.
A journey track across the top shows the carton moving from scene to scene.
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
PAUSE = 2.2
TOTAL = 180.0

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

# ---------- figures and props (CSS drawings, 520x236 stage units) ----------
ART_CSS = """
.fig{width:72px;text-align:center;position:absolute}
.fig .head{width:30px;height:30px;border-radius:50%;background:#d9a97f;margin:0 auto;position:relative;z-index:2}
.fig .body{width:44px;height:50px;border-radius:16px 16px 6px 6px;margin:-5px auto 0;position:relative;z-index:1}
.fig .nm{font-family:var(--mono);font-size:10px;color:#33403a;margin-top:4px;white-space:nowrap}
.fig .hair{position:absolute;left:50%;top:-3px;width:34px;height:20px;margin-left:-17px;border-radius:17px 17px 4px 4px;background:#2b1d14;z-index:1}
.fig .hairl{position:absolute;left:50%;top:-3px;width:36px;height:40px;margin-left:-18px;border-radius:18px 18px 8px 8px;background:#2b1d14;z-index:1}
.fig .cap{position:absolute;left:50%;top:-7px;width:32px;height:13px;margin-left:-16px;border-radius:9px 9px 2px 2px;background:#f0e6d2;border:1.5px solid #9a8a6a;z-index:3}
.fig .spec{position:absolute;left:50%;top:11px;width:22px;height:7px;margin-left:-11px;border:1.5px solid #15201b;border-radius:4px;z-index:3}
.fig .tie{position:absolute;left:50%;top:27px;width:6px;height:22px;margin-left:-3px;background:#c33;z-index:3;border-radius:0 0 3px 3px}
.fig .apron{position:absolute;left:50%;top:36px;width:28px;height:26px;margin-left:-14px;background:#f3f6f2;border-radius:3px;z-index:3;opacity:.9}
.fig .bindi{position:absolute;left:50%;top:9px;width:4px;height:4px;margin-left:-2px;background:#b4232c;border-radius:50%;z-index:3}
.fig .arm{position:absolute;left:50%;top:30px;width:34px;height:7px;margin-left:8px;background:#d9a97f;border-radius:4px;transform-origin:left center;transform:rotate(20deg);z-index:0}
.priya .body{background:#176b4e}.rakesh .body{background:#c56a1f}.rakesh .head{background:#b87a52}.rakesh .arm{background:#b87a52}
.anita .body{background:#6b2d5c}.anita .head{background:#c98e63}.vikram .body{background:#2a5fa8}.vikram .head{background:#a86b48}
.buyer .body{background:#4e5c55}.buyer .head{background:#c98e63}.kirana .body{background:#8a5f05}.kirana .head{background:#b87a52}
.fb .body{background:#0f4d37}
.agentfig{width:72px;text-align:center;position:absolute}
.agentfig .bot{width:46px;height:46px;border-radius:14px;background:#176b4e;color:#fff;margin:8px auto 0;display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:14px;position:relative;box-shadow:0 0 0 4px #dcefe5}
.agentfig .bot i{position:absolute;top:-9px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#e3b74d;animation:blink 1.4s ease-in-out infinite}
.agentfig .nm{font-family:var(--mono);font-size:10px;color:#33403a;margin-top:8px;white-space:nowrap}
.agentfig .ring{position:absolute;left:50%;top:8px;width:46px;height:46px;margin-left:-23px;border-radius:14px;border:2px solid #176b4e;opacity:0}
.agentfig.think .ring{animation:ring 1.6s ease-out infinite}
@keyframes ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.9);opacity:0}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.stage{position:relative;width:520px;height:236px;overflow:hidden;color:#15201b;border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
.stage .floor{position:absolute;left:0;right:0;bottom:0;height:34px}
.office{background:#f7f9f6}.office .floor{background:#e3e9e2}.godown{background:#f5efe6}.godown .floor{background:#d9cbb6}
.doors{background:#eef3ee}.doors .floor{background:#d9e2d9}.screen{background:#f3f6f2}.screen .floor{background:#e1e8e1}
.road{background:linear-gradient(#eef4ff,#dde8fb)}.road .floor{background:#6b7280;height:44px}
.road .lane{position:absolute;left:0;right:0;bottom:20px;height:2px;background:repeating-linear-gradient(90deg,#f3f6f2 0 22px,transparent 22px 44px);background-size:44px 2px}
.scene.on .lane{animation:lanes 1.1s linear infinite}
@keyframes lanes{to{background-position:-44px 0}}
.road .cloud{position:absolute;width:70px;height:22px;border-radius:14px;background:#fff;opacity:.9}
.scene.on .cloud{animation:cloud 14s linear infinite}
@keyframes cloud{from{transform:translateX(0)}to{transform:translateX(-600px)}}
.shop{background:#fff7e8}.shop .floor{background:#e7d4b4}.finance{background:#f7f4f9}.finance .floor{background:#e2dbe8}
.board{background:#eef3f9}.board .floor{background:#d9e3ee}.bank{background:#eef7f0}.bank .floor{background:#cfe3d4}
.say{position:absolute;max-width:210px;background:#fff;border:1.5px solid #15201b;border-radius:10px;padding:6px 9px;font-size:11.5px;line-height:1.35;z-index:5}
.say.ag{border-color:#176b4e;background:#dcefe5}.say.wa{background:#e8f1fb;border-color:#2a5fa8;border-radius:8px}
.say.wa::before{content:"SC";position:absolute;left:-1px;top:-11px;font-family:var(--mono);font-size:8px;background:#2a5fa8;color:#fff;padding:1px 5px;border-radius:4px}
.say small{display:block;font-family:var(--mono);font-size:9.5px;color:#3f4a45;margin-top:2px}
.dots{position:absolute;background:#fff;border:1.5px solid #15201b;border-radius:10px;padding:6px 9px;font-size:12px;letter-spacing:2px;z-index:5}
.dots.go{opacity:1;transform:none;animation:pop .3s forwards}.dots .d{display:inline-block;animation:typing 1s infinite}.dots .d:nth-child(2){animation-delay:.2s}.dots .d:nth-child(3){animation-delay:.4s}
@keyframes typing{0%,100%{opacity:.2}50%{opacity:1}}
.carton{position:absolute;width:54px;height:40px;background:#c9a26b;border:1.5px solid #8a6a3a;border-radius:3px}
.carton i{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;background:#a8824d}
.carton b{position:absolute;left:4px;bottom:3px;font-family:var(--mono);font-size:7.5px;color:#b4232c;font-weight:500;background:#fff;padding:0 2px;border-radius:2px}
.carton.sm{width:36px;height:26px}
.shelf{position:absolute;left:0;right:0;height:5px;background:#8a6a3a}.desk{position:absolute;height:10px;background:#b9a58c;border-radius:3px}
.mon{position:absolute;width:150px;height:96px;background:#15201b;border-radius:6px;padding:6px}
.mon .scr{width:100%;height:100%;background:#f3f6f2;border-radius:3px;padding:6px;font-size:9px;line-height:1.3;color:#15201b;overflow:hidden}
.mon .scr .bar{height:10px;border-radius:2px;display:flex;overflow:hidden;margin-top:4px;background:#e1e8e1}
.mon .scr .bar i{display:block;height:100%;width:0;transition:width 1.6s cubic-bezier(.2,.8,.2,1)}.mon .scr .bar i.go{width:var(--w)}
.phone{position:absolute;width:46px;height:80px;background:#15201b;border-radius:8px;padding:5px 4px}.phone .scr{width:100%;height:100%;background:#e8f1fb;border-radius:4px}
.phone.go{opacity:1;transform:none;animation:buzz .6s ease-in-out}
@keyframes buzz{0%,100%{transform:rotate(0)}20%{transform:rotate(-6deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(4deg)}}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:8;pointer-events:none}
.flash.go{animation:flash .5s ease-out forwards}
@keyframes flash{0%{opacity:0}15%{opacity:.95}100%{opacity:0}}
.scan{position:absolute;left:24px;width:200px;height:3px;background:#2fd27a;box-shadow:0 0 10px #2fd27a;opacity:0;z-index:7}
.scan.go{animation:scan 1.1s linear 2}
@keyframes scan{0%{opacity:1;top:28px}100%{opacity:1;top:190px}}
.door{position:absolute;bottom:34px;width:54px;height:120px;perspective:300px}
.door .leaf{position:absolute;inset:0;border-radius:27px 27px 3px 3px;border:2px solid #15201b;background:#fff;text-align:center;padding-top:10px;transform-origin:left center;transition:transform .8s cubic-bezier(.3,.8,.3,1);backface-visibility:hidden}
.door .back{position:absolute;inset:0;border-radius:27px 27px 3px 3px;background:#1d2a24;z-index:-1}
.door.go .leaf{transform:rotateY(-62deg)}
.door .tag{display:inline-block;font-family:var(--mono);font-size:9.5px;background:#fbefcf;color:#5a3d03;padding:1px 4px;border-radius:3px;margin-top:4px}
.door .dn{font-size:9.5px;font-weight:700;line-height:1.15;padding:0 3px}.door .knob{position:absolute;right:8px;top:70px;width:6px;height:6px;border-radius:50%;background:#15201b}
.door.es .leaf{border-color:#4c2a9c}.door.es .tag{background:#e9e2f7;color:#4c2a9c}.door.sel .leaf{border-color:#176b4e;background:#dcefe5}
.door.bin .leaf{border-color:#b4232c;border-style:dashed;background:#fbe3e4}.door.bin .tag{background:#fff;color:#b4232c}
.door.bin.go .leaf{transform:none;animation:shake .5s 2}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.flyc{position:absolute;left:452px;bottom:120px;z-index:6}
.flyc.go{animation:fly1 1.6s cubic-bezier(.4,0,.3,1) forwards}
.flyc.two.go{animation:fly2 1.6s cubic-bezier(.4,0,.3,1) .5s forwards}
@keyframes fly1{0%{opacity:1;transform:translate(0,0)}50%{opacity:1;transform:translate(-180px,-60px)}100%{transform:translate(-355px,10px) scale(.6);opacity:.2}}
@keyframes fly2{0%{opacity:1;transform:translate(0,0)}50%{opacity:1;transform:translate(-220px,-70px)}100%{transform:translate(-425px,10px) scale(.6);opacity:.2}}
.van{position:absolute;width:96px;height:44px;background:#fff;border:2px solid #15201b;border-radius:8px 14px 4px 4px}
.van .cab{position:absolute;right:-1px;top:8px;width:28px;height:34px;background:#e3b74d;border:2px solid #15201b;border-radius:4px 12px 4px 4px}
.van .wh{position:absolute;bottom:-9px;width:16px;height:16px;border-radius:50%;background:#15201b;border:3px solid #fff}.van .wh.a{left:12px}.van .wh.b{right:10px}
.van .wh::after,.truck .wh::after{content:"";position:absolute;left:50%;top:1px;bottom:1px;width:2px;margin-left:-1px;background:#fff}
.van .txt{position:absolute;left:6px;top:6px;font-family:var(--mono);font-size:8.5px;line-height:1.2;color:#15201b}
.van.go{opacity:1;animation:drive 6.5s cubic-bezier(.4,0,.8,.6) forwards}.van.go .wh,.truck.go .wh{animation:spin .5s linear infinite}
@keyframes drive{0%{transform:translateX(-120px)}100%{transform:translateX(440px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.truck{position:absolute;width:130px;height:52px;background:#fff;border:2px solid #15201b;border-radius:4px}
.truck .cab{position:absolute;right:-24px;bottom:-2px;width:30px;height:36px;background:#4c2a9c;border:2px solid #15201b;border-radius:4px 10px 4px 4px}
.truck .wh{position:absolute;bottom:-10px;width:18px;height:18px;border-radius:50%;background:#15201b;border:3px solid #fff}
.truck .txt{position:absolute;left:8px;top:8px;font-family:var(--mono);font-size:8.5px;line-height:1.25;color:#15201b}
.truck.go{opacity:1;animation:truckin 5.5s cubic-bezier(.3,0,.5,1) forwards}
@keyframes truckin{0%{transform:translateX(-320px)}100%{transform:translateX(40px)}}
.counter{position:absolute;left:0;right:0;bottom:34px;height:46px;background:#d4b483;border-top:4px solid #8a6a3a}
.jar{position:absolute;width:22px;height:28px;background:#fff;border:1.5px solid #8a6a3a;border-radius:4px 4px 6px 6px}
.doc{position:absolute;width:58px;height:74px;background:#fff;border:1.5px solid #15201b;border-radius:3px;padding:6px 5px;font-size:7.5px;line-height:1.3;font-family:var(--mono);color:#15201b}
.doc b{display:block;color:#15201b;font-size:8px;margin-bottom:2px}.doc .ln{height:3px;background:#b9c6bf;margin:3px 0;border-radius:2px}.doc.ok{border-color:#176b4e}
.doc.go{animation:slideup .6s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes slideup{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.stamp{position:absolute;font-family:var(--display);font-weight:800;font-size:16px;color:#176b4e;border:3px solid #176b4e;border-radius:6px;padding:3px 8px;transform:rotate(-12deg) scale(3);opacity:0;z-index:7;background:rgba(255,255,255,.7)}
.stamp.go{animation:stamp .45s cubic-bezier(.2,.9,.3,1.3) forwards}
@keyframes stamp{to{opacity:1;transform:rotate(-12deg) scale(1)}}
.chart{position:absolute;width:190px;height:118px;background:#fff;border:1.5px solid #15201b;border-radius:6px;padding:8px;font-size:9px;color:#15201b}
.chart .ttl{font-weight:700;font-size:10px;margin-bottom:4px}.chart .rw{display:grid;grid-template-columns:62px minmax(0,1fr) 40px;gap:6px;align-items:center;margin:3px 0}
.chart .rw i{display:block;height:9px;border-radius:2px;background:#176b4e;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}.chart .rw i.m{background:#e3b74d}.chart .rw i.go{width:var(--w)}
.chart .rw span:last-child{text-align:right;font-family:var(--mono)}
.crate{position:absolute;width:48px;height:30px;background:#9fcfae;border:1.5px solid #0f4d37;border-radius:3px}
.crate.go{animation:dropin .5s cubic-bezier(.2,.9,.3,1.2) forwards}
.bin{position:absolute;width:70px;height:86px;background:#7d8a83;border-radius:4px 4px 10px 10px;border:2px solid #4e5c55}
.bin .lid{position:absolute;left:-6px;right:-6px;top:-10px;height:10px;background:#4e5c55;border-radius:4px}
.bin .x{position:absolute;left:0;right:0;top:30px;text-align:center;font-family:var(--display);font-weight:800;color:#fff;font-size:13px}
.grid38{position:absolute;display:grid;grid-template-columns:repeat(10,8px);gap:2px}
.grid38 b{width:8px;height:8px;border-radius:50%;background:#e0d2b4;border:1px solid #b9a06a;transition:background .3s,transform .3s}
.grid38 b.lit{background:#176b4e;border-color:#0f4d37;transform:scale(1.25)}
.badge{position:absolute;font-family:var(--mono);font-size:10px;background:#15201b;color:#fff;padding:3px 7px;border-radius:5px;z-index:6}
.badge.red{background:#b4232c}.badge.green{background:#176b4e}
.check{position:absolute;width:34px;height:34px;border-radius:50%;background:#176b4e;color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;z-index:7}
.check.go{animation:popbig .5s cubic-bezier(.2,.9,.3,1.4) forwards}
.check::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #176b4e;opacity:0}
.check.go::after{animation:ring 1.2s ease-out .3s 2}
@keyframes popbig{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
"""

F = lambda cls, f, style, inner, extra="": f'<div class="{cls}" data-f="{f}"{extra} style="{style}">{inner}</div>'
PRIYA = '<div class="hairl"></div><div class="head"><div class="bindi"></div></div><div class="body"></div><div class="nm">Priya</div>'
RAKESH = '<div class="cap"></div><div class="head"></div><div class="body"></div><div class="nm">Rakesh bhai</div>'
RAKESH_PHONE = '<div class="cap"></div><div class="head"></div><div class="body"><div class="arm"></div></div><div class="nm">Rakesh bhai</div>'
ANITA = '<div class="hair"></div><div class="head"><div class="spec"></div></div><div class="body"></div><div class="nm">Anita</div>'
VIKRAM = '<div class="hair"></div><div class="head"></div><div class="body"><div class="tie"></div></div><div class="nm">Vikram</div>'
VENKAT = '<div class="hair"></div><div class="head"></div><div class="body"></div><div class="nm">Venkat</div>'
GANESH = '<div class="hair"></div><div class="head"></div><div class="body"><div class="apron"></div></div><div class="nm">Ganesh ji</div>'
MEERA = '<div class="hairl"></div><div class="head"></div><div class="body"></div><div class="nm">Meera</div>'
AGENT = '<div class="ring"></div><div class="bot">SC<i></i></div><div class="nm">agent</div>'
CARTON = '<i></i><b>BB 18 NOV</b>'
DOTS = '<span class="d">•</span><span class="d">•</span><span class="d">•</span>'
DOOR = lambda cls, f, left, name, tag: f'<div class="door {cls}" data-f="{f}" style="left:{left}px"><div class="back"></div><div class="leaf"><div class="dn">{name}</div><div class="tag">{tag}</div><div class="knob"></div></div></div>'

def cnt(frm, to, f0, f1, fmt, cls="", style=""):
    return f'<span class="{cls}" data-count="{frm}|{to}|{f0}|{f1}|{fmt}" style="{style}">{frm}</span>'

STAGES = {
 "warning": ("office", "The warning", "Day 0 · 09:00 · Priya's desk, Pune", "₹40,800 of chips at risk", "r",
  '<div class="floor"></div><div class="desk" style="left:60px;right:60px;bottom:34px"></div>'
  + F("mon", 0.03, "left:70px;bottom:44px", '<div class="scr"><b>Batches at risk today</b><div style="margin-top:3px">Masala Chips 150 g · Nagpur · ' + cnt(90, 47, 0.12, 0.3, "days") + '</div><div class="bar"><i data-f="0.14" class="q" style="--w:74%;background:#b4232c"></i><i data-f="0.14" class="q" style="--w:26%;background:#9fcfae"></i></div><div style="margin-top:3px">' + cnt(0, 1360, 0.2, 0.42, "int") + ' of 1,840 won\'t sell by 18 Nov</div></div>')
  + F("fig priya", 0.06, "left:250px;bottom:40px", PRIYA) + F("agentfig think", 0.1, "left:400px;bottom:40px", AGENT)
  + F("badge red", 0.3, "left:24px;top:10px", "Blinkit ✕ needs 90 days") + F("badge red", 0.36, "left:24px;top:34px", "Zepto ✕ needs 60% of life") + F("badge red", 0.42, "left:24px;top:58px", "Instamart ✕ needs 60% of life")
  + F("say wa", 0.64, "left:300px;top:14px", 'Priya ji, 1,360 packets of Masala Chips in Nagpur won\'t sell before 18 Nov. The delivery apps won\'t take them now.<small>push notification · 09:00</small>')
  + F("phone", 0.64, "left:338px;bottom:58px", '<div class="scr"></div>')),
 "photo": ("godown", "The photo", "09:05 · Rakesh bhai's warehouse, Nagpur", "Verified from the label in under a minute", "g",
  '<div class="floor"></div><div class="shelf" style="top:70px"></div><div class="shelf" style="top:130px"></div>'
  + "".join(F("carton", 0.02 + i*0.015, f"left:{x}px;top:{y}px", CARTON) for i,(x,y) in enumerate([(30,30),(92,30),(154,30),(30,90),(92,90),(30,150),(92,150),(154,150)]))
  + F("fig rakesh", 0.08, "left:300px;bottom:40px", RAKESH_PHONE) + F("phone", 0.2, "left:352px;bottom:70px", '<div class="scr"></div>')
  + F("say wa", 0.22, "left:240px;top:12px", '<span class="hindi">Ek photo chahiye: MF-2409-117 ka carton label.</span><small>push · tap to open camera · 09:05</small>')
  + F("flash", 0.44, "", "") + F("scan", 0.5, "", "")
  + F("dots", 0.56, "left:330px;top:70px", DOTS, ' data-until="0.66"')
  + F("say ag", 0.66, "left:330px;top:70px;max-width:190px", 'Got it. Batch MF-2409-117, best before 18 Nov, MRP ₹30. Matches our records.<small>Gemini vision · confidence 0.97 · 09:20</small>')
  + F("badge green", 0.74, "left:160px;top:200px", "✓ verified")),
 "doors": ("doors", "Six doors", "09:21 · inside the agent", "Throwing it all away would cost ₹27,717", "r",
  '<div class="floor"></div>'
  + DOOR("es", 0.10, 16, "Online market", "₹15 each") + DOOR("sel", 0.20, 84, "Local shops", "₹18 each") + DOOR("", 0.30, 152, "Brand's own site", "₹12 net")
  + DOOR("", 0.36, 220, "Staff sale", "₹12 each") + DOOR("", 0.42, 288, "Food bank", "₹0, meals") + DOOR("bin", 0.52, 356, "The bin", "−₹20 each")
  + F("agentfig think", 0.02, "left:440px;bottom:40px", AGENT)
  + F("carton sm flyc", 0.7, "", "<i></i>") + F("carton sm flyc two", 0.7, "", "<i></i>")
  + F("badge red", 0.58, "left:330px;top:24px", "stock + GST credit back + disposal + EPR")),
 "plan": ("screen", "The plan, one tap", "09:22 to 09:40 · Priya's phone", "₹49,487 better than the bin · Approved", "g",
  '<div class="floor"></div><div class="desk" style="left:40px;right:200px;bottom:34px"></div>'
  + F("mon", 0.03, "left:50px;bottom:44px;width:220px;height:120px", '<div class="scr"><b>Recommended plan · 1,360 packets</b><div class="bar"><i data-f="0.1" class="q" style="--w:43%;background:#eb6834"></i><i data-f="0.1" class="q" style="--w:57%;background:#4c2a9c"></i></div><div style="margin-top:3px">' + cnt(0, 588, 0.1, 0.3, "int") + ' to local shops at ₹18 · ' + cnt(0, 772, 0.14, 0.34, "int") + ' to online market at ₹15</div><div style="margin-top:4px;font-weight:700">You get ' + cnt(0, 21770, 0.36, 0.56, "inr") + ' instead of losing ₹27,717</div><div style="margin-top:3px;color:#33403a">Other option: all online, ₹20,300</div></div>')
  + F("fig priya", 0.05, "left:300px;bottom:28px", PRIYA) + F("agentfig think", 0.08, "left:430px;bottom:28px", AGENT)
  + F("say wa", 0.44, "left:290px;top:4px;max-width:220px", 'Plan ready: net ₹21,770. GST credit ₹2,611 stays safe. Tap to review and approve.<small>push notification · 09:23</small>')
  + F("phone", 0.44, "left:380px;bottom:120px", '<div class="scr"></div>')
  + F("say", 0.8, "left:300px;top:70px", '<b>Approve</b><small>Priya · one tap · 09:40</small>')
  + F("check", 0.86, "left:402px;top:66px", "✓")),
 "selling": ("shop", "Selling, two ways at once", "09:41 to 11:50 · Hyderabad and Nagpur", "772 sold online at ₹14.20 · 588 ordered by shops", "g",
  '<div class="floor"></div><div class="counter" style="left:300px"></div>'
  + F("jar", 0.02, "left:320px;bottom:84px", "") + F("jar", 0.02, "left:348px;bottom:84px", "") + F("carton sm", 0.02, "left:380px;bottom:82px", "<i></i>")
  + F("fig kirana", 0.05, "left:424px;bottom:40px", GANESH)
  + F("mon", 0.08, "left:20px;bottom:44px;width:160px;height:100px", '<div class="scr"><b style="color:#4c2a9c">ExpireSoon</b><div>Masala Chips 150 g · 772 units</div><div><s>₹30</s> <b>₹15</b> · BB 18 Nov</div><div style="margin-top:3px;background:#4c2a9c;color:#fff;text-align:center;border-radius:2px">Place bid</div></div>')
  + F("say wa", 0.24, "left:330px;top:6px;max-width:180px", '<span class="hindi">आज का ऑफर: 10 पैकेट लो, 2 मुफ़्त. सिर्फ़ 48 घंटे.</span><small>push to 38 shops · 09:41</small>')
  + F("grid38 q", 0.3, "left:300px;top:118px", "".join("<b></b>" for _ in range(38)), ' data-lit="14|0.3|0.9"')
  + F("badge green q", 0.3, "left:300px;top:162px", "orders: " + cnt(0, 588, 0.3, 0.9, "int") + " / 588")
  + F("say", 0.40, "left:400px;top:66px", 'Order: 24 packets<small>Ganesh ji · in the app · 09:52</small>')
  + F("fig buyer", 0.48, "left:190px;bottom:40px", VENKAT)
  + F("dots", 0.52, "left:8px;top:6px", DOTS, ' data-until="0.56"') + F("say", 0.56, "left:8px;top:6px;max-width:135px", '₹13 for all 772?<small>Venkat · 11:02</small>')
  + F("dots", 0.64, "left:150px;top:30px", DOTS, ' data-until="0.70"') + F("say ag", 0.70, "left:150px;top:30px;max-width:170px", '₹14.20, dispatch within 24 h.<small>agent as Rakesh Traders · 11:03</small>')
  + F("dots", 0.84, "left:8px;top:52px", DOTS, ' data-until="0.88"') + F("say", 0.88, "left:8px;top:52px;max-width:135px", 'Done. Token paid.<small>Venkat · 11:09</small>')
  + F("check", 0.92, "left:150px;top:80px", "₹")),
 "road": ("road", "On the road", "Day 1 to 3 · Nagpur, then the highway", "1,360 packets kept out of the bin", "g",
  '<div class="floor"></div><div class="lane"></div><div class="cloud" style="left:420px;top:20px"></div><div class="cloud" style="left:700px;top:50px;width:50px"></div>'
  + F("fig rakesh", 0.03, "left:20px;bottom:50px", RAKESH)
  + F("van", 0.08, "left:120px;bottom:54px", '<div class="txt">588 packets<br>to 14 shops</div><div class="cab"></div><div class="wh a"></div><div class="wh b"></div>')
  + F("truck", 0.5, "left:300px;bottom:56px", '<div class="txt">772 packets<br>Nagpur → Hyderabad<br>after balance paid</div><div class="cab"></div><div class="wh" style="left:14px"></div><div class="wh" style="right:10px"></div>')
  + F("badge green", 0.75, "left:200px;top:14px", "every packet inside its date")),
 "paperwork": ("finance", "The paperwork", "Day 3 · Anita's desk, finance, Pune", "GST credit kept: ₹2,611 · all papers ready on day 3", "m",
  '<div class="floor"></div><div class="desk" style="left:30px;right:30px;bottom:34px"></div>'
  + F("doc ok", 0.12, "left:40px;bottom:50px", '<b>Tax invoice</b>772 × ₹14.20<div class="ln"></div><div class="ln"></div>IGST 12%')
  + F("doc ok", 0.24, "left:106px;bottom:50px", '<b>Credit note</b>shop scheme<div class="ln"></div>₹1,568')
  + F("doc", 0.36, "left:172px;bottom:50px", '<b>E-way bill</b>under ₹50,000<div class="ln"></div>not needed')
  + F("doc ok", 0.48, "left:238px;bottom:50px", '<b>GST memo</b>credit kept<div class="ln"></div>₹2,611')
  + F("stamp", 0.72, "left:150px;top:60px", "KEPT · ₹2,611")
  + F("fig anita", 0.04, "left:340px;bottom:40px", ANITA) + F("agentfig", 0.06, "left:440px;bottom:40px", AGENT)
  + F("say", 0.84, "left:290px;top:12px;max-width:220px", 'Invoice, credit note, and the note showing we don\'t pay the GST credit back. Nothing for me to chase.<small>Anita</small>')),
 "report": ("board", "The report", "Quarter end · boardroom, Pune", "217.6 kg diverted · a line in the BRSR report", "g",
  '<div class="floor"></div>'
  + F("chart", 0.05, "left:30px;top:24px", '<div class="ttl">This quarter · Smart-Clearance</div><div class="rw"><span>Recovered</span><i class="m q" data-f="0.12" style="--w:86%"></i><span>' + cnt(0, 6.3, 0.12, 0.4, "lakh") + '</span></div><div class="rw"><span>GST credit kept</span><i class="m q" data-f="0.2" style="--w:30%"></i><span>' + cnt(0, 79, 0.2, 0.45, "k") + '</span></div><div class="rw"><span>Waste avoided</span><i class="q" data-f="0.28" style="--w:70%"></i><span>' + cnt(0, 5.7, 0.28, 0.5, "t") + '</span></div><div class="rw"><span>Meals</span><i class="q" data-f="0.36" style="--w:40%"></i><span>' + cnt(0, 3700, 0.36, 0.55, "int") + '</span></div><div style="margin-top:4px;color:#33403a">BRSR Principle 6 · evidence attached</div>')
  + F("fig vikram", 0.04, "left:270px;bottom:40px", VIKRAM) + F("fig anita", 0.06, "left:360px;bottom:40px", ANITA)
  + F("stamp", 0.62, "left:250px;top:120px", "BRSR ✓")
  + F("say", 0.5, "left:250px;top:14px;max-width:230px", '5.7 tonnes kept out of landfill, with invoices behind every kilo. That goes straight into the annual report.<small>Vikram</small>')),
 "mango": ("bank", "And the Mango Drink?", "another batch · 22 days left · Hyderabad", "58 packs donated · 1,522 sold · 0 destroyed", "g",
  '<div class="floor"></div>'
  + F("crate", 0.05, "left:40px;bottom:40px", "") + F("crate", 0.1, "left:94px;bottom:40px", "") + F("crate", 0.15, "left:67px;bottom:74px", "")
  + F("fig fb", 0.04, "left:170px;bottom:40px", MEERA) + F("agentfig think", 0.06, "left:290px;bottom:40px", AGENT)
  + F("say ag", 0.22, "left:250px;top:12px;max-width:250px", '2,000 packs with 22 days left. Shops take 1,372, staff 150. The last 58 go to you, with the food-safety checklist. Pickup Tuesday?<small>Smart-Clearance · to Feeding India</small>')
  + F("say", 0.7, "left:60px;top:120px;max-width:170px", 'Tuesday 10 am works. We\'ll serve them this week.<small>Meera</small>')
  + F("badge green", 0.86, "left:40px;top:20px", "0 destroyed")),
}

TRACK = [("warning","Warn"),("photo","Photo"),("doors","Doors"),("plan","Plan"),("selling","Sell"),("road","Road"),("paperwork","Papers"),("report","Report"),("mango","Mango")]

def scene_html(s: dict) -> str:
    sid = s["scene"]
    if sid == "intro":
        return '''<section class="scene intro" data-id="intro">
  <div class="introart">
    <div class="bin big" data-f="0.04"><div class="lid"></div><div class="x" data-f="0.3">−₹27,717</div></div>
    <div class="carton drop" data-f="0.04"><i></i><b>BB 18 NOV</b></div>
  </div>
  <div class="title" data-f="0.58"><div class="brand">Smart-Clearance</div><div class="hi hindi">हर कार्टन को दूसरा मौका</div><div class="tag">Every carton gets a second chance, chosen by AI</div></div>
</section>'''
    if sid == "outro":
        return '''<section class="scene outro" data-id="outro">
  <div class="title"><div class="mark" data-f="0.02">SC</div><div class="brand" data-f="0.08">Smart-Clearance</div><div class="tag" data-f="0.2">Every carton gets a second chance, chosen by AI</div><div class="hi hindi" data-f="0.26">हर कार्टन को दूसरा मौका</div>
  <div class="stack" data-f="0.45">Google Cloud · Gemini on Vertex AI · Agent Development Kit · Firebase · SvelteKit PWA</div>
  <div class="team" data-f="0.7">A Google AI Hackathon prototype · October 2026</div></div>
</section>'''
    bg, title, where, outcome, oc, inner = STAGES[sid]
    n = [k for k, _ in TRACK].index(sid) + 1
    return f'''<section class="scene story bg-{bg}" data-id="{sid}">
  <div class="band"><span class="n">{n}</span><span class="t">{title}</span><span class="w">{where}</span></div>
  <div class="stagewrap"><div class="stage {bg}">{inner}</div></div>
  <div class="outcome {oc}" data-f="0.84">{outcome}</div>
</section>'''

scenes = "\n".join(scene_html(s) for s in segs)
track_nodes = "".join(f'<div class="node" data-id="{k}" style="left:{160 + i*200}px"><b>{i+1}</b><span>{lab}</span></div>' for i, (k, lab) in enumerate(TRACK))
timeline_js = json.dumps([{"id": s["scene"], "start": s["start"], "dur": s["dur"], "audio": s["audio_sec"], "text": s["text"]} for s in segs], ensure_ascii=False)

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Smart-Clearance walkthrough</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@500;700&display=swap">
<style>
:root{{--display:"Bricolage Grotesque","IBM Plex Sans",system-ui,sans-serif;--body:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;--hindi:"Noto Sans Devanagari","IBM Plex Sans",sans-serif;
 --ink:#15201b;--green:#176b4e;--amber:#e3b74d;--red:#b4232c;--purple:#4c2a9c}}
html,body{{margin:0;background:#0b1410;color:var(--ink);font-family:var(--body);overflow:hidden}}
#frame{{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0b1410}}
.hindi{{font-family:var(--hindi)}}
.scene{{position:absolute;inset:0;opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease;pointer-events:none}}
.scene.on{{opacity:1;transform:none}}
.scene.story{{display:grid;grid-template-rows:86px 90px 1fr 70px 200px;background:#f3f6f2}}
.bg-office{{background:linear-gradient(180deg,#eef2ec,#dfe6df)}}.bg-godown{{background:linear-gradient(180deg,#f1e9dc,#e2d3bb)}}.bg-doors{{background:linear-gradient(180deg,#e9f0e9,#d5dfd5)}}
.bg-screen{{background:linear-gradient(180deg,#eef2ee,#dde5dd)}}.bg-road{{background:linear-gradient(180deg,#e6eefc,#cfd9ea)}}.bg-shop{{background:linear-gradient(180deg,#fbf0dc,#eedbb8)}}
.bg-finance{{background:linear-gradient(180deg,#f2eef6,#dfd5e8)}}.bg-board{{background:linear-gradient(180deg,#e9f0f8,#d3dfed)}}.bg-bank{{background:linear-gradient(180deg,#e8f4ea,#cfe3d4)}}
.band{{grid-row:2;display:flex;align-items:baseline;gap:22px;padding:10px 80px 0}}
.band .n{{font-family:var(--display);font-weight:800;font-size:56px;color:var(--green);line-height:1;letter-spacing:-.03em}}
.band .t{{font-family:var(--display);font-weight:800;font-size:40px;letter-spacing:-.02em}}
.band .w{{margin-left:auto;font-family:var(--mono);font-size:19px;color:#33403a}}
.stagewrap{{grid-row:3;display:grid;place-items:center}}
.stage{{transform:scale(2.55);transform-origin:center center}}
.scene.on .stage{{animation:kb 24s linear forwards}}
@keyframes kb{{from{{transform:scale(2.55)}}to{{transform:scale(2.68)}}}}
.outcome{{grid-row:4;justify-self:center;align-self:center;font-family:var(--mono);font-size:26px;padding:12px 22px;border-radius:10px;border:2px solid var(--amber);background:#fbefcf;color:#5a3d03;z-index:9}}
.outcome.g{{border-color:var(--green);background:#dcefe5;color:#0f4d37}}.outcome.r{{border-color:var(--red);background:#fbe3e4;color:var(--red)}}.outcome.m{{border-color:var(--amber);background:#fbefcf;color:#5a3d03}}
/* staged entrances */
[data-f]{{opacity:0;transform:translateY(14px) scale(.98)}}
[data-f].q{{opacity:1;transform:none}}
[data-f].go{{animation:pop .5s cubic-bezier(.2,.8,.2,1) forwards}}
[data-f].q.go{{animation:none}}
.gone{{display:none!important}}
@keyframes pop{{to{{opacity:1;transform:none}}}}
.say.wa.go{{animation:dropin .6s cubic-bezier(.2,.9,.3,1.25) forwards}}
@keyframes dropin{{from{{opacity:0;transform:translateY(-40px)}}to{{opacity:1;transform:none}}}}
.fig.go,.agentfig.go{{animation:pop .5s cubic-bezier(.2,.8,.2,1) forwards,bob 2.8s ease-in-out .6s infinite}}
@keyframes bob{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-3px)}}}}
.outcome.go{{animation:popbig .5s cubic-bezier(.2,.9,.3,1.3) forwards}}
/* journey track */
#track{{position:absolute;left:0;right:0;top:12px;height:74px;z-index:25;opacity:0;transition:opacity .6s}}
#track.show{{opacity:1}}
#track .line{{position:absolute;left:160px;right:160px;top:28px;height:4px;background:#c9d4cd;border-radius:2px}}
#track .fill{{position:absolute;left:160px;top:28px;height:4px;background:var(--green);border-radius:2px;width:0;transition:width .9s cubic-bezier(.2,.8,.2,1)}}
#track .node{{position:absolute;top:16px;width:28px;height:28px;margin-left:-14px;border-radius:50%;background:#fff;border:3px solid #c9d4cd;display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:13px;color:#33403a;transition:all .4s}}
#track .node span{{position:absolute;top:34px;font-family:var(--mono);font-size:12px;color:#33403a;white-space:nowrap}}
#track .node.done{{background:var(--green);border-color:var(--green);color:#fff}}
#track .node.now{{border-color:var(--amber);box-shadow:0 0 0 6px rgba(227,183,77,.35);transform:scale(1.15)}}
#track .mark{{position:absolute;top:-6px;width:36px;height:26px;margin-left:-18px;background:#c9a26b;border:2px solid #8a6a3a;border-radius:3px;transition:left .9s cubic-bezier(.2,.8,.2,1)}}
#track .mark::after{{content:"";position:absolute;left:0;right:0;top:50%;height:3px;margin-top:-1px;background:#a8824d}}
/* captions */
#caption{{position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,rgba(11,20,16,0),rgba(11,20,16,.92) 40%);display:flex;align-items:flex-end;justify-content:center;padding:0 160px 54px;z-index:20}}
#caption p{{margin:0;font-size:32px;line-height:1.35;color:#c8d3cc;text-align:center;text-wrap:balance;max-width:1500px}}
#caption .s{{transition:color .3s}}#caption .s.now{{color:#fff}}
#progress{{position:absolute;left:0;top:0;height:8px;background:var(--amber);width:0;z-index:30}}
#clock{{position:absolute;right:40px;bottom:16px;font-family:var(--mono);font-size:18px;color:#7f8b84;z-index:30}}
#wm{{position:absolute;left:40px;bottom:16px;font-family:var(--mono);font-size:18px;color:#7f8b84;z-index:30}}
/* intro + outro */
.intro,.outro{{background:radial-gradient(1200px 700px at 50% 40%,#1d4a38,#0b1410);color:#fff}}
.introart{{position:absolute;left:0;right:0;top:120px;height:520px}}
.bin.big{{position:absolute;left:50%;top:170px;margin-left:-105px;width:210px;height:258px;border-width:5px;border-radius:12px 12px 30px 30px}}
.bin.big .lid{{top:-30px;height:30px;left:-18px;right:-18px;border-radius:10px}}.bin.big .x{{top:176px;font-size:40px}}
.carton.drop{{left:50%;top:0;margin-left:-81px;width:162px;height:120px;border-width:4px;border-radius:8px;z-index:3}}
.carton.drop i{{height:12px;margin-top:-6px}}.carton.drop b{{font-size:22px;left:12px;bottom:9px;padding:0 6px}}
.scene.on .carton.drop.go{{animation:drop 7.5s cubic-bezier(.4,0,.6,1) forwards}}
@keyframes drop{{0%{{opacity:1;transform:translateY(-60px) rotate(0)}}14%{{opacity:1;transform:translateY(190px) rotate(-16deg)}}18%{{transform:translateY(176px) rotate(-14deg)}}22%{{transform:translateY(190px) rotate(-16deg)}}70%{{opacity:1;transform:translateY(190px) rotate(-16deg)}}100%{{opacity:1;transform:translateY(-120px) rotate(4deg) scale(1.1)}}}}
.scene.on .bin.big.go{{animation:pop .5s forwards,binfade 2s ease 9s forwards}}
@keyframes binfade{{to{{opacity:.25}}}}
.title{{position:absolute;left:0;right:0;top:560px;text-align:center}}
.outro .title{{top:280px}}
.brand{{font-family:var(--display);font-weight:800;font-size:112px;letter-spacing:-.04em;line-height:1}}
.title .hi{{font-size:44px;color:#9fd6b8;margin-top:12px}}
.title .tag{{font-size:36px;color:#dfe8e2;margin-top:18px}}
.mark{{width:120px;height:120px;border-radius:32px;background:var(--green);display:grid;place-items:center;margin:0 auto 26px;font-family:var(--display);font-weight:800;font-size:48px;color:#fff;box-shadow:0 0 0 12px rgba(220,239,229,.25);position:relative}}
.mark.go{{animation:popbig .6s cubic-bezier(.2,.9,.3,1.3) forwards,glow 2.4s ease-in-out .8s infinite}}
@keyframes glow{{0%,100%{{box-shadow:0 0 0 12px rgba(220,239,229,.25)}}50%{{box-shadow:0 0 0 26px rgba(220,239,229,.08)}}}}
.stack{{font-family:var(--mono);font-size:24px;color:#9fb3a8;margin-top:50px}}
.team{{font-family:var(--mono);font-size:20px;color:#6f8578;margin-top:12px}}
#play[hidden]{{display:none}}
#play{{position:absolute;inset:0;display:grid;place-items:center;background:rgba(11,20,16,.85);z-index:50;cursor:pointer}}
#play div{{font-family:var(--display);font-weight:800;font-size:60px;color:#fff;padding:30px 60px;border:4px solid var(--amber);border-radius:24px}}
{ART_CSS}
</style></head>
<body><div id="frame">
{scenes}
<div id="track"><div class="line"></div><div class="fill"></div>{track_nodes}<div class="mark" style="left:160px"></div></div>
<div id="progress"></div>
<div id="caption"><p id="cap"></p></div>
<div id="wm">Smart-Clearance · concept walkthrough · {TOTAL:.0f} s</div>
<div id="clock">0:00</div>
<div id="play" hidden><div>▶ Play (3:00)</div></div>
{audio_tag}
</div>
<script>
const TL = {timeline_js};
const TOTAL = {TOTAL};
const TRACK = {json.dumps([k for k, _ in TRACK])};
const frame = document.getElementById('frame');
function fit(){{const s=Math.min(innerWidth/1920, innerHeight/1080); frame.style.transform='scale('+s+')'; frame.style.transformOrigin='top left'; frame.style.marginLeft=((innerWidth-1920*s)/2)+'px'; frame.style.marginTop=((innerHeight-1080*s)/2)+'px';}}
addEventListener('resize', fit); fit();
for (const seg of TL) {{ const parts = seg.text.match(/[^.!?]+[.!?]+/g) || [seg.text]; const total = parts.reduce((a,p)=>a+p.length,0); let acc=0; seg.chunks = parts.map(p=>{{const st=acc/total; acc+=p.length; return {{t:p.trim(), from:st, to:acc/total}};}}); }}
const scenes = Object.fromEntries([...document.querySelectorAll('.scene')].map(s=>[s.dataset.id, s]));
const cap = document.getElementById('cap'), prog=document.getElementById('progress'), clock=document.getElementById('clock');
const track = document.getElementById('track'), tfill = track.querySelector('.fill'), tmark = track.querySelector('.mark');
const inr = n => {{ n = Math.round(n); const s = String(Math.abs(n)); let out = s.length > 3 ? s.slice(0,-3).replace(/\\B(?=(\\d{{2}})+(?!\\d))/g, ',') + ',' + s.slice(-3) : s; return (n<0?'-':'') + out; }};
const fmt = {{ int: v => inr(v), inr: v => '₹' + inr(v), days: v => Math.round(v) + ' days left', lakh: v => '₹' + v.toFixed(1) + ' L', k: v => '₹' + Math.round(v) + ' k', t: v => v.toFixed(1) + ' t' }};
let startWall = 0, current = null, raf = 0;
window.__startWall = 0;
function enter(seg){{ current = seg; for (const s of Object.values(scenes)) s.classList.remove('on'); const el = scenes[seg.id]; el.classList.add('on');
  el.querySelectorAll('[data-f]').forEach(n=>{{ n.classList.remove('go'); n.classList.remove('gone'); }});
  el.querySelectorAll('[data-count]').forEach(n=>{{ const [a,,,,f] = n.dataset.count.split('|'); n.textContent = fmt[f](parseFloat(a)); }});
  el.querySelectorAll('.grid38 b').forEach(b=>b.classList.remove('lit'));
  cap.innerHTML = seg.chunks.map(c=>'<span class="s">'+c.t+'</span>').join(' ');
  const idx = TRACK.indexOf(seg.id); track.classList.toggle('show', idx >= 0);
  if (idx >= 0) {{ track.querySelectorAll('.node').forEach((n,i)=>{{ n.classList.toggle('done', i < idx); n.classList.toggle('now', i === idx); }}); tmark.style.left = (160 + idx*200) + 'px'; tfill.style.width = (idx*200) + 'px'; }} }}
function tick(){{ const t = (performance.now()-startWall)/1000; const seg = TL.find(s=> t>=s.start && t < s.start+s.dur) || TL[TL.length-1];
  if (seg !== current) enter(seg);
  const rel = (t-seg.start)/seg.dur, relA = (t-seg.start)/seg.audio; const el = scenes[seg.id];
  el.querySelectorAll('[data-f]').forEach(n=>{{ if (rel >= parseFloat(n.dataset.f)) n.classList.add('go'); if (n.dataset.until && rel >= parseFloat(n.dataset.until)) n.classList.add('gone'); }});
  el.querySelectorAll('[data-count]').forEach(n=>{{ const [a,b,f0,f1,f] = n.dataset.count.split('|'); const p = Math.max(0, Math.min(1, (rel-parseFloat(f0))/(parseFloat(f1)-parseFloat(f0)))); const e = 1-Math.pow(1-p,3); n.textContent = fmt[f](parseFloat(a) + (parseFloat(b)-parseFloat(a))*e); }});
  el.querySelectorAll('.grid38').forEach(g=>{{ const [n,f0,f1] = g.dataset.lit.split('|').map(parseFloat); const p = Math.max(0, Math.min(1, (rel-f0)/(f1-f0))); const lit = Math.floor(p*n); g.querySelectorAll('b').forEach((b,i)=>b.classList.toggle('lit', i < lit)); }});
  cap.querySelectorAll('.s').forEach((n,i)=>{{ const c=seg.chunks[i]; n.classList.toggle('now', relA>=c.from && relA<c.to+0.02); }});
  prog.style.width = Math.min(100, t/TOTAL*100)+'%'; clock.textContent = Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  if (t < TOTAL+0.5) raf = requestAnimationFrame(tick); }}
function start(){{ startWall = performance.now(); window.__startWall = Date.now(); const a=document.getElementById('nar'); if(a){{a.currentTime=0; a.play().catch(()=>{{}});}} tick(); }}
window.start = start;
const auto = new URLSearchParams(location.search).get('autoplay');
if (auto) {{ document.fonts.ready.then(()=>setTimeout(start, 400)); }}
else {{ const p=document.getElementById('play'); p.hidden=false; p.addEventListener('click', ()=>{{p.hidden=true; start();}}); }}
</script></body></html>'''
(HERE / out_name).write_text(html)
print(f"wrote {out_name}")
