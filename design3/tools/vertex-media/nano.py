#!/usr/bin/env python3
"""Nano Banana (Gemini image models) on Vertex AI: character sheets, keyframes, edits.

  uv run nano.py sheet --name anil --desc "a distributor in his fifties, ..." --out ../../designs/SC-154/src/cast/anil.png
  uv run nano.py still --prompt-file k0.txt --ref ../../designs/SC-154/src/cast/anil.png --out .../src/k0-bay.png --webp .../img/
  uv run nano.py edit --image k0.png --prompt "remove every letter and logo from the cartons; keep everything else" --out k0-clean.png

PNG originals go to a `src/` folder (gitignored); `--webp DIR` also writes the WebP that ships, with its sidecar.
Default model: gemini-3.1-flash-image (Nano Banana 2) at 2K, 16:9; `--pro` uses gemini-3-pro-image. Both serve on
the global endpoint only.
"""
from __future__ import annotations

import argparse
import io
import pathlib
import sys
import time

import _vx

NB2 = "gemini-3.1-flash-image"
PRO = "gemini-3-pro-image"
SIZE = {"512": "512", "1K": "1K", "2K": "2K", "4K": "4K"}
SHEET = ("A character reference sheet on a plain neutral grey studio background, soft even light, photographic, "
         "realistic skin and fabric: the same person three times side by side, full face front view, three-quarter view "
         "and profile, head and shoulders, the same clothes in every view, no text, no labels, no logos. The person: {desc}")


def _gen(a, prompt: str, refs: list[str], out: pathlib.Path, kind: str):
    from PIL import Image
    from google.genai import types

    model = PRO if a.pro else a.model
    loc = _vx.location_for(model, a.location)
    cost = _vx.price_image(model, a.size)
    _vx.say(f"{model} @ {loc} {a.size} {a.aspect}: ${cost:.3f}")
    contents = [prompt] + [Image.open(r) for r in refs]
    cfg = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio=a.aspect, image_size=SIZE[a.size]),
        seed=a.seed,
    )
    t0 = time.time()
    cl = _vx.client(loc)  # keep the client alive: a temporary is collected and closes its httpx session mid-request
    r = _vx.retry(lambda: cl.models.generate_content(model=model, contents=contents, config=cfg))
    parts = [p for c in (r.candidates or []) for p in (c.content.parts or []) if getattr(p, "inline_data", None) and p.inline_data.data]
    text = " ".join(p.text for c in (r.candidates or []) for p in (c.content.parts or []) if getattr(p, "text", None)) or None
    record = {
        "name": out.stem, "model": model, "location": loc, "service": "Vertex AI", "kind": kind, "prompt": prompt,
        "seed": a.seed, "aspect": a.aspect, "size": a.size,
        "inputs": [_vx.input_record("reference" if kind != "edit" else "source", r) for r in refs],
        "watermark": "SynthID", "cost_usd": cost, "price_table_date": _vx.PRICE_DATE, "created": _vx.today(),
        "latency_s": round(time.time() - t0, 1), "use": a.use, "model_text": text,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    if not parts:
        record["status"] = "no image"
        _vx.write_sidecar(out, record)
        sys.exit(f"no image returned; the model said: {text!r}; finish reason: {[c.finish_reason for c in (r.candidates or [])]}")
    im = Image.open(io.BytesIO(parts[0].inline_data.data))
    im.save(out, "PNG")
    record["status"] = "done"; record["output"] = f"{out.name} {im.width}x{im.height}"
    _vx.write_sidecar(out, record)
    _vx.say(f"saved {out} {im.width}x{im.height} in {record['latency_s']}s")
    if a.webp:
        wd = pathlib.Path(a.webp); wd.mkdir(parents=True, exist_ok=True)
        wp = wd / (out.stem + ".webp")
        im.convert("RGB").save(wp, "WEBP", quality=a.quality, method=6)
        rec = dict(record); rec["output"] = f"{wp.name} {im.width}x{im.height}"; rec["postprocess"] = f"WebP q{a.quality} from {out.name}"; rec["derived_from"] = out.name  # the PNG carries the cost
        _vx.write_sidecar(wp, rec)
        _vx.say(f"saved {wp} ({wp.stat().st_size // 1024} KB)")


def still(a):
    prompt = pathlib.Path(a.prompt_file).read_text().strip() if a.prompt_file else a.prompt
    if not prompt:
        sys.exit("a prompt is needed")
    _gen(a, prompt, a.ref or [], pathlib.Path(a.out), "still")


def sheet(a):
    _gen(a, SHEET.format(desc=a.desc), a.ref or [], pathlib.Path(a.out), "sheet")


def edit(a):
    prompt = pathlib.Path(a.prompt_file).read_text().strip() if a.prompt_file else a.prompt
    if not prompt:
        sys.exit("a prompt is needed")
    _gen(a, prompt, [a.image] + (a.ref or []), pathlib.Path(a.out), "edit")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(s):
        s.add_argument("--model", default=NB2); s.add_argument("--pro", action="store_true"); s.add_argument("--location")
        s.add_argument("--aspect", default="16:9"); s.add_argument("--size", default="2K", choices=list(SIZE))
        s.add_argument("--seed", type=int); s.add_argument("--ref", action="append", help="reference image(s)")
        s.add_argument("--out", required=True); s.add_argument("--webp", help="also write the WebP that ships, into this folder")
        s.add_argument("--quality", type=int, default=82); s.add_argument("--use", default="")

    s = sub.add_parser("still"); common(s); s.add_argument("--prompt"); s.add_argument("--prompt-file"); s.set_defaults(f=still)
    s = sub.add_parser("sheet"); common(s); s.add_argument("--name", required=True); s.add_argument("--desc", required=True); s.set_defaults(f=sheet)
    s = sub.add_parser("edit"); common(s); s.add_argument("--image", required=True); s.add_argument("--prompt"); s.add_argument("--prompt-file"); s.set_defaults(f=edit)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
