#!/usr/bin/env python3
"""SC-211 · the sales film v2's chapters, captions and YouTube package (SC-216), from the film's own timeline: the
cuts shots11.build() lays out and the film's captions (media/smart-clearance-sales-film-v2.srt, which mix11.py writes
from the placed lines). Writes:
  ../youtube/transcript.json          the chapters, each with its start and the lines spoken in it
  ../youtube/youtube-description.txt  the chapters as YouTube reads them (0:00 first, each at least 10 s), pasted on upload
  ../youtube/captions.srt             the film's captions, uploaded under Subtitles
  design3/site/assets/media/demo-film.json   the landing page's copy, read by the theatre when it first opens (SC-164)

    .venv/bin/python transcript11.py
"""
import json
import re
from pathlib import Path

import shots11

HERE = Path(__file__).resolve().parent
YT = HERE.parent / "youtube"
SITE = HERE.parents[2] / "site" / "assets" / "media" / "demo-film.json"
SRT = HERE.parent / "media" / "smart-clearance-sales-film-v2.srt"
TOTAL = 410.08

# each chapter: its title, its first line, and the shot it opens on, from the start of its hand-over in (None: mid-shot,
# just before its first line)
CHAPTERS = [
    ("The waste", "o1", "godown"),
    ("Smart-Clearance, as a service", "p1", "title"),
    ("Every team, on any device", "p6", "teams"),
    ("Ten agents", "p4", "graphA"),
    ("Guardrails and one yes", "g1", None),
    ("Flagged, read and planned", "j1", "detect"),
    ("The kiranas", "j5", "offer"),
    ("The staff sale and the food bank", "j6", "upi"),
    ("The marketplace", "j8", "market"),
    ("The hardest case", "j9", "proof"),
    ("The paperwork and the money", "m1", "papers"),
    ("The record and the impact", "m4", "record"),
    ("The close", "c1", "integrations"),
]
# who speaks each talking line, for the theatre's words (the captions mark a speaker with a dash); no one is named
SPEAKERS = {
    "t1": "A distributor", "tn": "The platform team", "tb": "The brand's head", "t2": "The supply chain lead",
    "tk": "A kirana owner", "t3": "A shopkeeper", "t4": "A food bank volunteer", "t5": "A wholesale buyer",
    "t6": "A distributor, at the landfill", "tw": "The distributor, weeks later",
}


def clock(t: float) -> str:
    s = int(t)
    return f"{s // 60}:{s % 60:02d}"


def secs(stamp: str) -> float:
    h, m, s = stamp.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


lines = json.loads((HERE / "lines.json").read_text())["lines"]
cues = [b.split("\n", 2) for b in SRT.read_text().strip().split("\n\n")]
assert len(cues) == len(lines), (len(cues), len(lines))
said = []
for line, (_, span, text) in zip(lines, cues):
    talk = line.get("kind") == "talk"
    text = text.replace("\n", " ").strip()
    assert text.removeprefix("— ") == line["text"], (line["id"], text)
    at = secs(span.split(" --> ")[0])
    said.append({"id": line["id"], "at": round(at, 1),
                 "text": f"{SPEAKERS[line['id']]}: “{line['text']}”" if talk else line["text"]})

cuts = {s.name: s.t0 for s in shots11.build()}
first = {s["id"]: i for i, s in enumerate(said)}
starts = []
for n, (title, lid, shot) in enumerate(CHAPTERS):
    at = 0.0 if n == 0 else (cuts[shot] if shot else said[first[lid]]["at"] - 0.5)
    starts.append(round(at, 1))
assert starts == sorted(starts) and starts[0] == 0
assert all(b - a >= 10 for a, b in zip(starts, starts[1:] + [TOTAL])), starts
chapters = []
for n, ((title, lid, _), at) in enumerate(zip(CHAPTERS, starts)):
    i0, i1 = first[lid], first[CHAPTERS[n + 1][1]] if n + 1 < len(CHAPTERS) else len(said)
    words = [{"at": s["at"], "text": s["text"]} for s in said[i0:i1]]
    assert words[0]["at"] >= at - 0.05, (title, words[0], at)   # a chapter holds its own first words
    chapters.append({"id": "opening" if n == 0 else f"ch-{n}", "n": n, "title": title, "at": at, "lines": words})

out = {"film": "SC-211 · the sales film v2", "duration": TOTAL, "runtime": clock(TOTAL),
       "opening": "Near-expiry stock, routed by AI agents. One yes from a person.", "chapters": chapters}
YT.mkdir(exist_ok=True)
for p in (YT / "transcript.json", SITE):
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")

desc = [
    # one paragraph a line: YouTube keeps every line break typed into a description
    ("Every day, good food leaves a warehouse in India and never reaches a single plate: not because it has spoiled, but because it is running out of time. Smart-Clearance finds each near-expiry batch a home before it is written off: kiranas offered it in their own language, a staff sale by UPI, a food bank, a near-expiry marketplace, and, where nothing else can, destruction against evidence and a second yes. Ten AI agents on Google's cloud and Gemini do the legwork inside the brand's own rules, every plan stops at a person, and every step is on the record."),
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
