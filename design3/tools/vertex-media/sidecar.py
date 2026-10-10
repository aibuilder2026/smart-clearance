#!/usr/bin/env python3
"""Compose a film's `<film>.prompt.json` from its clips' sidecars and its `<film>.cut.json` (assemble.py).

  uv run sidecar.py film.mp4 --use "smartclearance.web.app's hero film (SC-154): ..." --designed-in design3/designs/SC-154
"""
from __future__ import annotations

import argparse
import json
import pathlib

import _vx


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("film"); p.add_argument("--use", default=""); p.add_argument("--designed-in", default="")
    p.add_argument("--name")
    a = p.parse_args()
    film = pathlib.Path(a.film)
    cut = json.loads(film.with_name(film.stem + ".cut.json").read_text())
    clips, total = [], 0.0
    for c in cut["clips"]:
        src = pathlib.Path(c["file"])
        if not src.is_absolute():
            src = pathlib.Path.cwd() / src
        sc = _vx.read_sidecar(src) if _vx.sidecar_path(src).exists() else {"name": src.stem}
        total += sc.get("cost_usd", 0) or 0
        clips.append({
            "name": sc.get("name", src.stem), "model": sc.get("model"), "prompt": sc.get("prompt"), "negative_prompt": sc.get("negative_prompt"),
            "seed": sc.get("seed"), "resolution": sc.get("resolution"), "duration_s": sc.get("duration_s"), "fps": sc.get("fps", 24),
            "inputs": sc.get("inputs", []), "trim_s": [c["in"], c["out"]], "cost_usd": sc.get("cost_usd"), "latency_s": sc.get("latency_s"),
        })
    record = {
        "name": a.name or film.stem, "model": "Veo 3.1 on Vertex AI (clips), Gemini image models (keyframes)", "service": "Vertex AI",
        "duration_s": cut["duration_s"], "frame": cut["size"], "fps": cut["fps"], "clips": clips,
        "cut": (f"{len(clips)} clips trimmed and chained through {cut['xfade_s']} s dissolves" +
                (f", the tail dissolving over {cut['loop_s']} s into the first clip's head, which is then cut, so the film loops without a seam" if cut["loop_s"] else "") +
                (f"; retimed ×{cut['speed']}" if cut["speed"] != 1 else "") + (f"; eq {cut['eq']}" if cut["eq"] else "")),
        "encode": f"ffmpeg -an -c:v libx264 -preset slow -profile:v high -crf {cut['crf']} -pix_fmt yuv420p -movflags +faststart",
        "audio": False, "watermark": "SynthID", "cost_usd_clips": round(total, 4), "price_table_date": _vx.PRICE_DATE,
        "created": _vx.today(), "use": a.use, "designed_in": a.designed_in,
    }
    print(_vx.write_sidecar(film, record))


if __name__ == "__main__":
    main()
