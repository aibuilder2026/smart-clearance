#!/usr/bin/env python3
"""Cut a film from clips with ffmpeg: trims, dissolves, a loop that closes on itself, grade, encode.

  uv run assemble.py --out film.mp4 --xfade 0.5 --loop 0.5 --size 1920x1080 \
      a-1.mp4:in=0.4:out=4.3  a-2.mp4:in=0.8:out=4.7  a-3.mp4:out=3.9  a-4.mp4:in=1:out=4.9

The clips are trimmed, set to --fps, scaled to --size, and chained with `xfade` dissolves of --xfade seconds. The loop
(SC-111's cut): the tail dissolves over --loop seconds into a copy of the first clip's head, and the first --loop
seconds are then cut, so the file's last frame runs straight into its first. --speed > 1 shortens by dropping no
frames (setpts), --fps resamples. Writes `<film>.cut.json` beside the film for sidecar.py, and refuses a file over
--max-mb.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys


def probe(path: str) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate",
                          "-of", "json", path], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return {"duration": float(d["format"]["duration"]), "stream": d["streams"][0]}


def parse_clip(spec: str) -> dict:
    parts = spec.split(":")
    path, opts = parts[0], parts[1:]
    c = {"file": path, "in": 0.0, "out": None}
    for o in opts:
        k, v = o.split("=")
        c[k] = float(v)
    return c


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("clips", nargs="+", help="path[:in=S][:out=S]")
    p.add_argument("--out", required=True)
    p.add_argument("--xfade", type=float, default=0.5)
    p.add_argument("--loop", type=float, default=0.5, help="0 for no loop dissolve")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--size", default="1920x1080")
    p.add_argument("--eq", default="contrast=1.03:saturation=1.06")
    p.add_argument("--crf", type=int, default=24)
    p.add_argument("--max-mb", type=float, default=8.0)
    a = p.parse_args()

    clips = [parse_clip(s) for s in a.clips]
    for c in clips:
        pr = probe(c["file"])
        c["source_duration"] = pr["duration"]
        if c["out"] is None:
            c["out"] = pr["duration"]
        c["len"] = round(c["out"] - c["in"], 3)
        c["sha256"] = __import__("_vx").sha256(c["file"])
    W, H = a.size.split("x")
    X, L = a.xfade, a.loop
    n = len(clips)
    f = []
    for i, c in enumerate(clips):
        f.append(f"[{i}:v]trim=start={c['in']}:end={c['out']},setpts=PTS-STARTPTS,fps={a.fps},"
                 f"scale={W}:{H}:flags=lanczos:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[v{i}]")
    # chain
    cur = "[v0]"; total = clips[0]["len"]; joins = []
    for i in range(1, n):
        off = round(total - X, 3)
        f.append(f"{cur}[v{i}]xfade=transition=fade:duration={X}:offset={off}[x{i}]")
        joins.append(off)
        cur = f"[x{i}]"; total = round(total + clips[i]["len"] - X, 3)
    if L > 0:
        c0 = clips[0]
        f.append(f"[0:v]trim=start={c0['in']}:end={round(c0['in'] + L + X, 3)},setpts=PTS-STARTPTS,fps={a.fps},"
                 f"scale={W}:{H}:flags=lanczos:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[head]")
        f.append(f"{cur}[head]xfade=transition=fade:duration={L}:offset={round(total - L, 3)}[lp]")
        # the loop dissolve lands on the head at time L; cut the first L seconds so frame 0 is that same frame
        f.append(f"[lp]trim=start={L},setpts=PTS-STARTPTS[cut]")
        cur = "[cut]"; total = round(total - L, 3)
    tail = []
    if a.speed != 1.0:
        tail.append(f"setpts=PTS/{a.speed}"); total = round(total / a.speed, 3)
    tail.append(f"fps={a.fps}")
    if a.eq:
        tail.append(f"eq={a.eq}")
    tail.append("format=yuv420p")
    f.append(f"{cur}{','.join(tail)}[out]")
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    for c in clips:
        cmd += ["-i", c["file"]]
    cmd += ["-filter_complex", ";".join(f), "-map", "[out]", "-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high",
            "-crf", str(a.crf), "-movflags", "+faststart", a.out]
    print(" ".join(cmd), file=sys.stderr)
    subprocess.run(cmd, check=True)
    out = pathlib.Path(a.out)
    mb = out.stat().st_size / 1e6
    pr = probe(a.out)
    cut = {
        "film": out.name, "clips": clips, "xfade_s": X, "loop_s": L, "speed": a.speed, "fps": a.fps, "size": a.size,
        "eq": a.eq, "crf": a.crf, "joins_s": joins, "expected_duration_s": total, "duration_s": round(pr["duration"], 3),
        "mb": round(mb, 2), "command": " ".join(cmd),
    }
    out.with_name(out.stem + ".cut.json").write_text(json.dumps(cut, indent=2) + "\n")
    print(f"{out}: {pr['duration']:.2f}s {pr['stream']['width']}x{pr['stream']['height']} {mb:.2f} MB; joins at {joins}", file=sys.stderr)
    if mb > a.max_mb:
        sys.exit(f"over --max-mb {a.max_mb}: raise --crf or shorten")


if __name__ == "__main__":
    main()
