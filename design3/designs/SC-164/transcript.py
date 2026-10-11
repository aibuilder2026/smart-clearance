#!/usr/bin/env python3
"""SC-164 · the demo film's transcript and chapters, from SC-158's timeline (no ffmpeg, no guessing).

Reads design3/designs/SC-158/src/film.json, works out when each chapter and caption appears the way assemble.py cuts
the film (each segment's length, less the cross-fade), and writes:
  transcript.json         the chapters with their start, and the captions in each, for the "Read the film" disclosure
  youtube-description.txt the chapters as YouTube reads them (0:00 first, each at least 10 s), to paste on upload

    python3 design3/designs/SC-164/transcript.py
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
FILM = json.loads((HERE.parent / "SC-158" / "src" / "film.json").read_text())
XF = FILM["xfade"]


def length(seg: dict) -> float:
    # as assemble.py's duration(): a clip is slowed by its speed and held; a screen runs its seconds
    if seg["kind"] == "clip":
        return seg["seconds"] / seg.get("speed", 1) + seg.get("hold", 0)
    return seg["seconds"]


def plain(text: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", text)


def clock(t: float) -> str:
    s = int(t)
    return f"{s // 60}:{s % 60:02d}"


overlays = {o["id"]: o for o in FILM["overlays"]}
# the opening, before chapter 1: the title card and the first caption
chapters, t = [{"id": "opening", "n": 0, "title": "Smart-Clearance", "at": 0.0, "lines": []}], 0.0
for seg in FILM["segments"]:
    ch = seg.get("chapter")
    if ch and chapters[-1]["id"] != ch:
        o = overlays[ch]
        chapters.append({"id": ch, "n": int(o["n"]), "title": o["text"], "at": round(t, 1), "lines": []})
    for item in seg.get("overlays", []):
        o = overlays[item["id"]]
        if o["kind"] == "caption":
            chapters[-1]["lines"].append({"at": round(t + item["at"], 1), "text": plain(o["text"])})
    t += length(seg) - XF
total = round(t + XF, 1)

out = {
    "film": "SC-158 · the Mango Drink demo film",
    "duration": total,
    "runtime": clock(total),
    "opening": plain(overlays["title"]["text"]),
    "chapters": chapters,
}
(HERE / "transcript.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")

# YouTube makes chapters of a description's timestamps when the first is 0:00, there are three or more, and each
# runs at least 10 s
marks = [(clock(c["at"]), c["title"]) for c in chapters]
starts = [c["at"] for c in chapters]
assert starts[0] == 0 and all(b - a >= 10 for a, b in zip(starts, starts[1:] + [total]))
desc = [
    "Smart-Clearance routes near-expiry FMCG stock to kiranas, a staff sale and a food bank before it reaches the bin.",
    "AI agents on Gemini do the running around; a person says yes once. One batch, start to finish.",
    "",
    *[f"{at} {title}" for at, title in marks],
    "",
    "Every company, person and figure in this film is fictional. Google AI Hackathon 2026.",
    "https://smartclearance.web.app",
]
(HERE / "youtube-description.txt").write_text("\n".join(desc) + "\n")
print(f"{len(chapters) - 1} chapters and the opening, {sum(len(c['lines']) for c in chapters)} captions, {clock(total)}")
