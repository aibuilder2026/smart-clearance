#!/usr/bin/env python3
"""SC-238 · the landing film v3's chapters, captions and YouTube package (SC-242), from the film's own timeline: its
scenes (film/src/film.json, plan.py), its placed lines and the captions mix.py writes from them
(media/smart-clearance-sales-film-v3.srt). Writes:
  ../youtube/transcript.json          the chapters, each with its start and the lines spoken in it
  ../youtube/youtube-description.txt  the chapters as YouTube reads them (0:00 first, each at least 10 s), pasted on upload
  ../youtube/captions.srt             the film's captions, uploaded under Subtitles
  design3/site/assets/media/demo-film.json   the landing page's copy, read by the theatre when it first opens (SC-164)

    python3 transcript12.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
YT = HERE.parent / "youtube"
SITE = HERE.parents[2] / "site" / "assets" / "media" / "demo-film.json"
SRT = HERE.parent / "media" / "smart-clearance-sales-film-v3.srt"
FILM = json.loads((HERE / "film" / "src" / "film.json").read_text())
TOTAL = 470.4                                   # the master's own length (11,760 frames at 25 fps)

# each chapter: its title and the scene it opens on (a scene under 10 s rides with the one before it)
CHAPTERS = [
    ("Twenty-two days left", "cold"),
    ("The rule", "rule"),
    ("The cost of the bin", "bin"),
    ("Smart-Clearance, as a service", "platform"),
    ("Ten agents and one yes", "agents"),
    ("The happy path", "mango"),
    ("The hard case", "chips"),
    ("Every paper and every rupee", "record"),
    ("The close", "call"),
]
# who speaks each line to the camera or on the phone, as the theatre's words give them; no one is named
WHO = {"the distributor": "The distributor", "the supply chain lead": "The supply chain lead",
       "the brand's head": "The brand's head", "the kirana owner": "A kirana owner",
       "the food bank volunteer": "A food bank volunteer", "the shopkeeper": "A shopkeeper",
       "the wholesale buyer": "A wholesale buyer", "the Nagpur distributor": "The distributor, at the landfill"}


def clock(t: float) -> str:
    s = int(t)
    return f"{s // 60}:{s % 60:02d}"


def secs(stamp: str) -> float:
    h, m, s = stamp.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


dlg = json.loads((HERE / "lines.json").read_text())["dialogue"]
who = {d["id"]: d["who"] for d in dlg}
spoken = sorted((d["t"], who[d["id"]]) for d in FILM["dlg"])
cues = [b.split("\n", 2) for b in SRT.read_text().strip().split("\n\n")]
said = []
for _, span, text in cues:
    at = secs(span.split(" --> ")[0])
    text = text.replace("\n", " ").strip()
    if text.startswith("— "):                     # a person's own line: who says it, by its place in the film
        t, w = min(spoken, key=lambda x: abs(x[0] - at))
        assert abs(t - at) < 0.6, (text, at, t)
        text = f"{WHO[w]}: “{text[2:]}”"
    if said and said[-1]["text"] == text: continue   # (a line placed in two parts is captioned twice)
    said.append({"at": round(at, 1), "text": text})
assert len([c for c in cues if c[2].startswith("— ")]) == len(FILM["dlg"]) == 13

scene = {s["id"]: s["t0"] for s in FILM["scenes"]}
starts = [0.0] + [round(scene[sid], 1) for _, sid in CHAPTERS[1:]]
assert starts == sorted(starts)
assert all(b - a >= 10 for a, b in zip(starts, starts[1:] + [TOTAL])), starts
chapters = []
for n, ((title, _), at) in enumerate(zip(CHAPTERS, starts)):
    end = starts[n + 1] if n + 1 < len(starts) else TOTAL + 1
    words = [s for s in said if at - 0.05 <= s["at"] < end - 0.05]
    assert words, title
    chapters.append({"id": "opening" if n == 0 else f"ch-{n}", "n": n, "title": title, "at": at, "lines": words})
assert sum(len(c["lines"]) for c in chapters) == len(said)

out = {"film": "SC-238 · the landing film v3, Twenty-Two Days", "duration": TOTAL, "runtime": clock(TOTAL),
       "opening": "Near-expiry stock, routed by AI agents. One yes from a person.", "chapters": chapters}
YT.mkdir(exist_ok=True)
for p in (YT / "transcript.json", SITE):
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")

desc = [
    # one paragraph a line: YouTube keeps every line break typed into a description
    ("A batch of mango drink has twenty-two days left, and no app will take it. Every morning in India, good food runs out of time like this, and the bin is the easy answer. Smart-Clearance is agentic software that finds each near-expiry batch a home before it is written off: kiranas offered it in their own language, a staff sale by UPI, a food bank, a near-expiry marketplace, and, where nothing else can, destruction against evidence and a second yes. Ten AI agents, nine of them thinking with Gemini on Google's Agent Platform, do the legwork inside the brand's own rules, every plan stops at a person, and every step is on the record."),
    "",
    *[f"{clock(c['at'])} {c['title']}" for c in chapters],
    "",
    "Every company, person and figure in this film is fictional, and its people and scenes are AI-generated.",
    "Google AI Hackathon 2026.",
    "Try the guided demo: https://smartclearance-demo.web.app",
    "https://smartclearance.web.app",
]
(YT / "youtube-description.txt").write_text("\n".join(desc) + "\n")
(YT / "captions.srt").write_text(SRT.read_text())
print(f"{len(chapters)} chapters, {len(said)} lines, {clock(TOTAL)}")
for c in chapters:
    print(f"  {clock(c['at'])} ({c['at']:6.1f}) {c['title']}: {len(c['lines'])} lines, from {c['lines'][0]['at']}")
