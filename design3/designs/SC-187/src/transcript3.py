#!/usr/bin/env python3
"""SC-187 cut 3 · the demo film's chapters, captions and YouTube package, from the film's own timeline (src/film.json,
as film3.py laid it out, and src/lines.json). Writes:
  youtube/transcript.json          the ten chapters with their start and the narration lines in each
  youtube/youtube-description.txt  the chapters as YouTube reads them (0:00 first, each at least 10 s), to paste on upload
  youtube/captions.srt             the narration as closed captions, to upload under Subtitles
  design3/site/assets/media/demo-film.json   the landing page's copy, read by the theatre when it first opens (SC-164)

    python3 design3/designs/SC-187/src/transcript3.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
FILM = json.loads((HERE / "film.json").read_text())
LINES = json.loads((HERE / "lines.json").read_text())
TEXT = {b["id"]: b["text"] for ln in LINES["lines"] for b in ln["beats"]}
TITLES = ["Smart-Clearance", "The platform", "Connect and detect", "Verify", "Value, decide, approve", "Five exits",
          "The paperwork", "When it does not go as planned", "The ledger", "The close"]
assert len(TITLES) == len(FILM["scenes"])


def clock(t: float) -> str:
    s = int(t)
    return f"{s // 60}:{s % 60:02d}"


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


beats = {b["id"]: b for b in FILM["vo"]}
chapters = []
for i, (sc, title) in enumerate(zip(FILM["scenes"], TITLES)):
    lines = [{"at": round(beats[b]["at"], 1), "text": TEXT[b]} for b in sc["beats"]]
    chapters.append({"id": "opening" if i == 0 else f"ch-{i}", "n": i, "title": title, "at": round(sc["start"], 1), "lines": lines})
total = round(FILM["total"], 1)
out = {"film": "SC-187 · the demo film, cut 3", "duration": total, "runtime": clock(total),
       "opening": "Near-expiry stock, routed by AI agents. One yes from a person.", "chapters": chapters}
(HERE.parent / "youtube" / "transcript.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
(HERE.parent.parent.parent / "site" / "assets" / "media" / "demo-film.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")

starts = [c["at"] for c in chapters]
assert starts[0] == 0 and all(b - a >= 10 for a, b in zip(starts, starts[1:] + [total]))
desc = [
    "Smart-Clearance routes near-expiry FMCG stock to kiranas, a marketplace, a staff sale and a food bank before it reaches the bin,",
    "and settles the paperwork, the GST and the ledger. Ten AI agents on Gemini do the running around; a person says yes once.",
    "Two batches through five exits, and the week that does not go to plan.",
    "",
    *[f"{clock(c['at'])} {c['title']}" for c in chapters],
    "",
    "Every company, person and figure in this film is fictional. Google AI Hackathon 2026.",
    "https://smartclearance.web.app",
]
(HERE.parent / "youtube" / "youtube-description.txt").write_text("\n".join(desc) + "\n")
srt = []
for n, b in enumerate(FILM["vo"], 1):
    srt += [str(n), f"{srt_time(b['at'])} --> {srt_time(b['at'] + b['len'])}", TEXT[b["id"]], ""]
(HERE.parent / "youtube" / "captions.srt").write_text("\n".join(srt))
print(f"{len(chapters)} chapters, {sum(len(c['lines']) for c in chapters)} captions, {clock(total)}")
for c in chapters:
    print(f"  '{clock(c['at'])} {c['title']}',")
