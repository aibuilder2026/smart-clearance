#!/usr/bin/env python3
"""Posters and soft previews from a film's frames, with their sidecars.

  uv run frames.py film.mp4 --at 0 --name hero-day --at 11.3 --name hero-night \
      --png ../../designs/SC-154/src/plates --webp ../../site/assets/plates --preview 48

For each --at (seconds) and its --name: a PNG original (src/, gitignored), the WebP poster (q82) and a --preview px
wide blurred WebP (SC-131's soft preview under the film), each with a `.prompt.json` naming the film and the time.
"""
from __future__ import annotations

import argparse
import pathlib
import subprocess

from PIL import Image, ImageFilter

import _vx


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("film"); p.add_argument("--at", action="append", type=float, required=True); p.add_argument("--name", action="append", required=True)
    p.add_argument("--png", required=True); p.add_argument("--webp", required=True); p.add_argument("--preview", type=int, default=48)
    p.add_argument("--quality", type=int, default=82)
    a = p.parse_args()
    assert len(a.at) == len(a.name), "one --name per --at"
    png_dir, webp_dir = pathlib.Path(a.png), pathlib.Path(a.webp)
    png_dir.mkdir(parents=True, exist_ok=True); webp_dir.mkdir(parents=True, exist_ok=True)
    film = pathlib.Path(a.film)
    film_rec = _vx.read_sidecar(film) if _vx.sidecar_path(film).exists() else {}
    for t, name in zip(a.at, a.name):
        png = png_dir / f"{name}.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", str(film), "-frames:v", "1", str(png)], check=True)
        im = Image.open(png).convert("RGB")
        base = {"derived_from": film.name, "film_sidecar": _vx.sidecar_path(film).name, "at_s": t, "model": film_rec.get("model"),
                "created": _vx.today(), "designed_in": film_rec.get("designed_in")}
        wp = webp_dir / f"{name}.webp"
        im.save(wp, "WEBP", quality=a.quality, method=6)
        _vx.write_sidecar(wp, dict(base, name=name, output=f"{wp.name} {im.width}x{im.height}", post_process=f"frame at {t}s, WebP q{a.quality}",
                                    use="the hero film's poster, preloaded for its theme"))
        pv = webp_dir / f"{name}-preview.webp"
        small = im.resize((a.preview, max(1, round(im.height * a.preview / im.width))), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
        small.save(pv, "WEBP", quality=60, method=6)
        _vx.write_sidecar(pv, dict(base, name=f"{name}-preview", output=f"{pv.name} {small.width}x{small.height}",
                                    post_process=f"{a.preview} px copy of {wp.name}, blurred", use="the soft preview under the film until its poster arrives (SC-131)"))
        print(f"{wp} {wp.stat().st_size // 1024} KB; {pv} {pv.stat().st_size} B")


if __name__ == "__main__":
    main()
