#!/usr/bin/env python3
"""Measure a film's seams: the loop (last frame against the first) and each join, on a 0–255 grey scale.

  uv run seams.py film.mp4 [--joins 3.9,7.6,11.3] [--sheet contact.webp]

Reports the median and the largest frame-to-frame change, the loop step, and the step across each join. SC-111's
accepted film had a loop step of 4.1 against a median step of 1.4; a loop step under about twice the median reads as
continuous. Not a gate: a report for decision.md.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys

import numpy as np

W, H = 320, 180


def frames(path: str) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         capture_output=True, check=True).stdout
    n = len(raw) // (W * H)
    return np.frombuffer(raw[: n * W * H], dtype=np.uint8).reshape(n, H, W).astype(np.float32)


def fps_of(path: str) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True).stdout.strip()
    a, b = r.split("/")
    return float(a) / float(b)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("film"); p.add_argument("--joins", default="", help="seconds, comma separated (assemble.py prints them)")
    p.add_argument("--sheet", help="write a contact sheet (2 frames a second) here")
    p.add_argument("--json", action="store_true")
    a = p.parse_args()
    F = frames(a.film); fps = fps_of(a.film)
    steps = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))
    loop = float(np.abs(F[-1] - F[0]).mean())
    report = {"frames": int(F.shape[0]), "fps": round(fps, 3), "duration_s": round(F.shape[0] / fps, 2),
              "median_step": round(float(np.median(steps)), 2), "max_step": round(float(steps.max()), 2),
              "max_step_at_s": round(float(steps.argmax() / fps), 2), "loop_step": round(loop, 2), "joins": []}
    for j in [float(x) for x in a.joins.split(",") if x.strip()]:
        i = int(round(j * fps)); lo, hi = max(1, i - int(fps * 0.6)), min(len(steps), i + int(fps * 0.6))
        report["joins"].append({"at_s": j, "max_step_near": round(float(steps[lo:hi].max()), 2)})
    report["verdict"] = "continuous" if loop <= 2 * report["median_step"] else "a visible step at the loop"
    if a.sheet:
        import tempfile
        from PIL import Image
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.film, "-vf", f"fps=2,scale=240:-1,tile=8x{max(1, int(np.ceil(F.shape[0] / fps * 2 / 8)))}",
                        "-frames:v", "1", tmp], check=True)
        Image.open(tmp).convert("RGB").save(a.sheet, quality=80)
        report["sheet"] = a.sheet
    print(json.dumps(report, indent=2) if a.json else "\n".join(f"{k}: {v}" for k, v in report.items()))


if __name__ == "__main__":
    main()
