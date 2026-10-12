"""SC-187 cut 2: writes tour.md, one line per recording in tour/ (the file, who, what it shows, its length), from
tour.json and ffprobe, then the shots that could not be made. Run after tour.mjs:  python3 tour-md.py"""

import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOUR = json.loads((HERE / "tour.json").read_text())
OUT = HERE / "tour"
WHO = {
    None: "nobody (signed out)", "neha": "Neha Kulkarni (console)", "priya": "Priya Deshmukh (supply chain)", "rakesh": "Rakesh bhai (Rakesh Traders)",
    "lakshmi-owner": "Lakshmi Agencies", "ganesh": "Ganesh ji (Shree Ganesh Kirana)", "jaidurga": "Jai Durga Stores (kirana)", "agrawal": "Agrawal ji (Agrawal Wholesale)",
    "meera": "Meera (Feeding India)",
}


def seconds(f: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


lines = ["# The working app, recorded for cut 2 (tour.mjs, tour.json)", "",
         "Each recording is an H.264 mp4 at device pixels (desktop 3200×2000 from 1600×1000 @2×; phone 1170×2532 from 390×844 @3×), 25 fps, with the gliding pointer. "
         "The live stages were recorded on the local stack as both batches walked their journeys (director.py, 2-minute days, the day held at 24 hours while each stage was recorded); "
         "the `slow` stage is the stub's slow week (the worktree's workspace build on :4197); `demo` is the live guided demo.", ""]
total = 0.0
count = 0
missing = []
for stage, shots in TOUR.items():
    lines.append(f"## {stage}")
    lines.append("")
    lines.append("| file | who | shows | length |")
    lines.append("| --- | --- | --- | --- |")
    for s in shots:
        f = OUT / f"{stage}--{s['name']}.mp4"
        if not f.exists():
            missing.append((stage, s["name"], s.get("why", "not recorded")))
            continue
        d = seconds(f)
        total += d
        count += 1
        who = WHO.get(s.get("who"), s.get("who"))
        app = s.get("app", "workspace")
        size = s.get("size", "desktop")
        lines.append(f"| `tour/{f.name}` | {who} · {app}{' · ' + size if size != 'desktop' else ''} | {s.get('shows', '')} | {d:.1f} s |")
    lines.append("")
lines.append(f"**{count} recordings, {total:.0f} s ({total / 60:.1f} min) in all.**")
lines.append("")
lines.append("## Not made")
lines.append("")
if missing:
    for stage, name, why in missing:
        lines.append(f"- `{stage}--{name}`: {why}")
else:
    lines.append("Every shot in tour.json was recorded.")
lines.append("")
lines.append("## Notes for the cut")
lines.append("")
lines += [
    "- Three shots did the real thing on the live stack, so the walk took them as done: `plan--route-approve` is Priya's yes on the chips (the Mango's came through the walk), `approve--kirana-order` is Jai Durga Stores' order (Ganesh ji's `approve--kirana-offer` was shot before any order; his order came through the walk), and `approve--agrawal-bid` is Agrawal's message to the Negotiator (answered live by Gemini) and his ₹13 bid; the counter and his acceptance came through the walk.",
    "- `approve--kirana-order` runs 47 s: the order, then Orders, the order's page and its tax invoice sheet; cut as needed.",
    "- `slow--slow-destroy-sign` runs 55 s: the four signatures drawn one after another (the officer, two witnesses, the distributor), ending on Send to Munchly Foods for approval.",
    "- In `slow--slow-scheme-short` the stub's own agents move on during the shot (the truck loads and a 'Document pack ready' toast lands in the top right); the scheme card itself holds.",
    "- The journey clock reads Fri 2 Oct to Sun 4 Oct across the live shots, in order; the console's Overview counts every client's batches, not Munchly's alone.",
    "- A fresh take of any shot: `SC_REPO=/path/to/main node tour.mjs --stage <stage> --only <name>` while the stage holds (the live stages have moved on; the stub and demo stages can be retaken any time, with the stub build served on :4197).",
]
lines.append("")
(HERE / "tour.md").write_text("\n".join(lines))
print(f"tour.md: {count} recordings, {total:.0f} s; {len(missing)} not made")
