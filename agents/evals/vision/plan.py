"""The Vision eval's label photos (SC-72): base photos rendered by the local Qwen-Image model, and variants made from
them with Pillow (blur, glare, an angle, compression, darkness, a covered line, an unreadable photo).

    python plan.py gen      # writes src/gen.sh; run it in the background (about 1.5 min a photo at 1024)
    python plan.py build    # src/*.png → images/*.webp, a .prompt.json sidecar each, and cases.jsonl

Each base photo asks Qwen for the label's exact words; its truth is what a person saw on the rendered photo (`SEEN`
records where that differs from what was asked: Qwen printed every figure as asked, misprinted some product names,
and ignored "make it hard", so the hard cases are made by post-processing, where the change and its truth are exact).
The PNG originals stay in src/ (git-ignored); only the WebP ships.

Expectations, which the scorer holds each read to (sc_agents/evals/scorers.py):
- exact: every field of the truth read exactly;
- no-date / no-batch: that field covered, so it must come back empty, with a confidence under 0.9 (a label without its
  date or batch must not verify);
- unreadable: confidence under 0.9 and no field wrong (empty is right).
"""

import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "src"
IMAGES = HERE / "images"
QWEN = "$HOME/qwen-image-bf16/.venv/bin/python"
QWEN_CLI = "$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
MODEL = "Qwen-Image-2.1 (bf16), run locally through the qwen-image-bf16 plugin 0.2.0 (its CLI)"

SKUS = {
    "chips": ("MUNCHLY MASALA CHIPS 150 g", "Munchly Masala Chips 150 g", 30.0),
    "mango": ("MUNCHLY MANGO DRINK 200 ml", "Munchly Mango Drink 200 ml", 20.0),
    "chikki": ("MUNCHLY PEANUT CHIKKI 100 g", "Munchly Peanut Chikki 100 g", 25.0),
    "oats": ("MUNCHLY MASALA OATS 200 g", "Munchly Masala Oats 200 g", 65.0),
    "poha": ("MUNCHLY INSTANT POHA 250 g", "Munchly Instant Poha 250 g", 55.0),
    "biscuits": ("MUNCHLY CHOCO CREAM BISCUITS 200 g", "Munchly Choco Cream Biscuits 200 g", 40.0),
    "facewash": ("GLOWRA ALOE FACE WASH 100 ml", "Glowra Aloe Face Wash 100 ml", 120.0),
    "hairoil": ("GLOWRA COCONUT HAIR OIL 200 ml", "Glowra Coconut Hair Oil 200 ml", 150.0),
}
BATCHES = {
    "MF-2409-117": ("chips", "2026-05-18", "2026-11-18"),
    "MF-2409-171": ("chips", "2026-05-18", "2026-11-18"),  # two digits swapped: the wrong batch
    "MF-2410-118": ("mango", "2026-04-27", "2026-10-24"),
    "MF-2408-209": ("chips", "2026-06-18", "2026-12-15"),
    "MF-2408-311": ("chikki", "2026-06-05", "2026-12-02"),
    "MF-2409-415": ("oats", "2026-03-21", "2026-12-16"),
    "MF-2409-204": ("biscuits", "2026-04-11", "2027-01-06"),
    "MF-2410-402": ("poha", "2026-07-24", "2027-04-20"),
    "GL-2410-044": ("facewash", "2026-01-05", "2028-01-05"),
    "GL-2410-012": ("hairoil", "2026-02-14", "2028-02-14"),
}
MONTHS = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")


def dmy(iso: str, style: str = "slash") -> str:
    y, m, d = iso.split("-")
    if style == "dot":
        return f"{d}.{m}.{y}"
    if style == "short":
        return f"{d}-{m}-{y[2:]}"
    if style == "month":
        return f"{int(d):02d} {MONTHS[int(m) - 1]} {y}"
    return f"{d}/{m}/{y}"


def label_lines(batch: str, style: str = "standard") -> list[str]:
    sku, mfg, best = BATCHES[batch]
    title, _, mrp = SKUS[sku]
    if style == "hindi":
        return [
            title,
            f"बैच नं. / BATCH NO: {batch}",
            f"निर्माण तिथि / MFG: {dmy(mfg)}",
            f"इससे पहले उपयोग करें / BEST BEFORE: {dmy(best)}",
            f"अधिकतम खुदरा मूल्य / MRP ₹{mrp:.2f}",
        ]
    if style == "pkd":
        return [
            title,
            f"B.NO.: {batch}",
            f"PKD: {dmy(mfg, 'dot')}",
            f"USE BY: {dmy(best, 'dot')}",
            f"M.R.P. Rs. {mrp:.0f}/-",
        ]
    if style == "short":
        return [title, f"BATCH {batch}", f"MFD {dmy(mfg, 'short')}", f"BB {dmy(best, 'short')}", f"MRP ₹{mrp:.2f}"]
    if style == "month":
        return [
            title,
            f"LOT NO: {batch}",
            f"MFG DATE: {dmy(mfg, 'month')}",
            f"EXPIRY: {dmy(best, 'month')}",
            f"MRP (INCL. OF ALL TAXES) ₹{mrp:.2f}",
        ]
    return [
        title,
        f"BATCH NO: {batch}",
        f"MFG: {dmy(mfg)}",
        f"BEST BEFORE: {dmy(best)}",
        f"MRP ₹{mrp:.2f} (incl. of all taxes)",
    ]


def scene(lines: list[str], setting: str) -> str:
    quoted = ", ".join(f'"{x}"' for x in lines)
    return (
        "A realistic close-up smartphone photo of a printed white label stuck on the side of a brown corrugated "
        f"cardboard carton. The label is printed in bold black sans-serif type, one line each: {quoted}. {setting} "
        "Photorealistic, natural colours, the label text crisp and legible."
    )


def truth(batch: str) -> dict:
    sku, mfg, best = BATCHES[batch]
    _, pack, mrp = SKUS[sku]
    return {"batch": batch, "mfg": mfg, "bestBefore": best, "mrp": mrp, "pack": pack}


# the base photos, as Qwen was asked for them: id → (batch, label style, setting, seed)
BASES = {
    "story-clean": ("MF-2409-117", "standard", "Even daylight in a distributor's godown, the camera square on.", 11),
    "story-hand": ("MF-2409-117", "standard", "A hand holds the carton up in a warehouse aisle; soft tube light.", 12),
    "story-shelf": (
        "MF-2409-117",
        "standard",
        "The carton sits on a steel godown rack marked B4, other cartons around it; even light.",
        13,
    ),
    "story-glare": (
        "MF-2409-117",
        "standard",
        "The label is glossy and a bright phone-flash glare spot sits over its upper half, but every line can still "
        "be read.",
        14,
    ),
    "story-angle": (
        "MF-2409-117",
        "standard",
        "Photographed at a steep angle from the left, about 45 degrees, the label foreshortened.",
        15,
    ),
    "story-blur": ("MF-2409-117", "standard", "Slight hand-shake motion blur, the text still readable.", 16),
    "story-thumb": (
        "MF-2409-117",
        "standard",
        "A thumb covers the whole BEST BEFORE line, so that date cannot be seen; the other lines are clear.",
        17,
    ),
    "story-hindi": (
        "MF-2409-117",
        "hindi",
        "Even light; the label is bilingual, Hindi in Devanagari above the English on each line.",
        18,
    ),
    "story-low-light": (
        "MF-2409-117",
        "standard",
        "A dim godown corner lit by one weak bulb, grainy, the text still readable.",
        19,
    ),
    "wrong-batch": ("MF-2409-171", "standard", "Even daylight, the camera square on.", 21),
    "other-sku-biscuits": ("MF-2409-204", "standard", "Even daylight, the camera square on.", 22),
    "damaged": (
        "MF-2409-117",
        "standard",
        "The carton is crushed and the label torn through its lower right corner, so the MRP line is torn away; the "
        "batch and dates are intact.",
        23,
    ),
    "story-dim": ("MF-2409-117", "standard", "Badly out of focus and very dark, the text an unreadable smudge.", 24),
    "mango": ("MF-2410-118", "standard", "Even light in a Hyderabad godown.", 31),
    "chikki": ("MF-2408-311", "standard", "Even light on a godown rack.", 32),
    "oats": ("MF-2409-415", "standard", "Even light on a godown rack.", 33),
    "poha": ("MF-2410-402", "standard", "Even light on a godown rack.", 34),
    "facewash": ("GL-2410-044", "standard", "Even light on a shelf.", 35),
    "hairoil": ("GL-2410-012", "standard", "Even light on a shelf.", 36),
    "chips-gupta": ("MF-2408-209", "standard", "Even light in an Indore godown.", 37),
    "mango-hindi": (
        "MF-2410-118",
        "hindi",
        "Even light; bilingual label, Hindi in Devanagari above the English on each line.",
        38,
    ),
    "oats-glare": (
        "MF-2409-415",
        "standard",
        "A strip of reflected tube light crosses the glossy label, every line still readable.",
        39,
    ),
    "poha-angle": (
        "MF-2410-402",
        "standard",
        "Photographed from above at a steep angle, the label foreshortened.",
        40,
    ),
    "story-tape": (
        "MF-2409-117",
        "standard",
        "A strip of brown packing tape covers the BATCH NO line completely, so the batch cannot be read; the other "
        "lines are clear.",
        41,
    ),
    # the second round: the formats cartons in India print (PKD and USE BY, two-digit years, month names, Rs./-)
    "story-pkd": ("MF-2409-117", "pkd", "Even daylight, the camera square on.", 51),
    "story-short": ("MF-2409-117", "short", "Even tube light in a godown, the camera square on.", 52),
    "story-month": ("MF-2409-117", "month", "Even daylight, the camera slightly to the right.", 53),
    "mango-pkd": ("MF-2410-118", "pkd", "Even light in a Hyderabad godown.", 54),
    "chikki-month": ("MF-2408-311", "month", "Even light on a godown rack.", 55),
    "biscuits-hindi": (
        "MF-2409-204",
        "hindi",
        "Even light; bilingual label, Hindi in Devanagari above the English on each line.",
        56,
    ),
    "hairoil-short": ("GL-2410-012", "short", "Even light on a shelf.", 57),
    "chips-gupta-month": ("MF-2408-209", "month", "Even light in an Indore godown.", 58),
}
CLEAN = {
    "story-clean",
    "story-hand",
    "story-shelf",
    "mango",
    "chikki",
    "oats",
    "poha",
    "facewash",
    "hairoil",
    "chips-gupta",
    "other-sku-biscuits",
    "wrong-batch",
}

# what a person saw on each rendered photo where it is not what was asked (each looked at, 7 Oct 2026). `fields`
# corrects the truth; `pack` is the product name as printed (the pack is reported, not scored)
SEEN: dict[str, dict] = {}
SEEN_FILE = HERE / "seen.json"
if SEEN_FILE.exists():
    SEEN = json.loads(SEEN_FILE.read_text())

# Pillow's variants: name → (transform, parameters, expectation, the truth's fields it hides)
VARIANTS = {
    "blur2": ("gaussian_blur", {"radius": 2.0}, "exact", []),
    "jpeg15": ("jpeg", {"quality": 15}, "exact", []),
    "tilt12": ("rotate", {"degrees": 12}, "exact", []),
    "keystone": ("perspective", {"inset": 0.12}, "exact", []),
    "glare": ("glare", {"x": 0.45, "y": 0.42, "radius": 0.34, "strength": 0.85}, "exact", []),
    "dark": ("brightness", {"factor": 0.4}, "exact", []),
    "small": ("downscale", {"width": 600}, "exact", []),
    "unreadable": ("smear", {"radius": 9.0, "factor": 0.3}, "unreadable", ["batch", "mfg", "bestBefore", "mrp"]),
}
# lines covered with packing tape, measured on the base photo: (left, top, right, bottom) as fractions of the frame
COVERS = {
    ("story-clean", "no-date"): ((0.18, 0.592, 0.72, 0.662), "bestBefore"),
    ("story-clean", "no-batch"): ((0.42, 0.425, 0.70, 0.497), "batch"),
    ("story-shelf", "no-date"): ((0.47, 0.566, 0.735, 0.66), "bestBefore"),
}
VARIANT_BASES = {
    "story-clean": ["blur2", "jpeg15", "tilt12", "keystone", "glare", "dark", "small", "unreadable"],
    "story-hand": ["blur2", "tilt12", "glare"],
    "story-shelf": ["jpeg15", "dark", "small", "unreadable"],
    "story-hindi": ["blur2", "jpeg15", "keystone"],
    "wrong-batch": ["blur2", "glare"],
    "other-sku-biscuits": ["tilt12", "dark"],
    "mango": ["blur2", "glare", "small"],
    "chikki": ["jpeg15", "keystone"],
    "oats": ["blur2", "dark"],
    "facewash": ["blur2", "tilt12"],
    "hairoil": ["jpeg15", "glare"],
    "chips-gupta": ["blur2", "keystone"],
    "story-pkd": ["blur2", "dark"],
    "story-short": ["jpeg15"],
}
HELD_OUT_EVERY = 3  # every third case is held out; the rest may be drawn on for the prompt's examples


def gen() -> None:
    SRC.mkdir(exist_ok=True)
    lines = ["#!/usr/bin/env bash", "# generated by plan.py: the Vision eval's base photos, one at a time", "set -u"]
    lines.append(f'cd "{SRC}"')
    for cid, (batch, style, setting, seed) in BASES.items():
        prompt = scene(label_lines(batch, style), setting)
        lines.append(f'if [ ! -f "{cid}.png" ]; then')
        lines.append(f'  echo "$(date +%T) {cid}"')
        lines.append(
            f"  {QWEN} {QWEN_CLI} {json.dumps(prompt, ensure_ascii=False)} --aspect 4:3 --size 1024 "
            f'--seed {seed} --out "{cid}.png" || echo "$(date +%T) {cid} FAILED"'
        )
        lines.append("fi")
    lines.append('echo "$(date +%T) done"')
    (SRC / "gen.sh").write_text("\n".join(lines) + "\n")
    print(f"wrote {SRC / 'gen.sh'}: {len(BASES)} photos")


# --- the variants ---------------------------------------------------------------------------------------------------


def transform(img, kind: str, p: dict):
    from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

    w, h = img.size
    if kind == "gaussian_blur":
        return img.filter(ImageFilter.GaussianBlur(p["radius"]))
    if kind == "rotate":
        return img.rotate(p["degrees"], resample=Image.Resampling.BICUBIC, expand=False, fillcolor=(40, 34, 28))
    if kind == "perspective":
        i = p["inset"]  # the right edge pulled in: a label photographed from the left
        quad = (0, 0, 0, h, w, h * (1 - i), w, h * i)
        return img.transform((w, h), Image.Transform.QUAD, quad, resample=Image.Resampling.BICUBIC)
    if kind == "glare":
        glow = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(glow)
        cx, cy, r = p["x"] * w, p["y"] * h, p["radius"] * w
        for k in range(40, 0, -1):
            rr = r * k / 40
            d.ellipse((cx - rr, cy - rr * 0.6, cx + rr, cy + rr * 0.6), fill=int(255 * p["strength"] * (1 - k / 40)))
        glow = glow.filter(ImageFilter.GaussianBlur(18))
        return Image.composite(Image.new("RGB", (w, h), (255, 255, 250)), img, glow)
    if kind == "brightness":
        return ImageEnhance.Brightness(img).enhance(p["factor"])
    if kind == "downscale":
        return img.resize((p["width"], round(h * p["width"] / w)), Image.Resampling.LANCZOS)
    if kind == "smear":
        return ImageEnhance.Brightness(img.filter(ImageFilter.GaussianBlur(p["radius"]))).enhance(p["factor"])
    if kind == "cover":
        out = img.copy()
        x0, y0, x1, y1 = p["box"]
        ImageDraw.Draw(out).rectangle((x0 * w, y0 * h, x1 * w, y1 * h), fill=(166, 124, 82))  # brown packing tape
        return out.filter(ImageFilter.GaussianBlur(0.6))
    if kind == "jpeg":
        import io

        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=p["quality"])
        return Image.open(io.BytesIO(buf.getvalue())).convert("RGB")
    raise ValueError(kind)


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def build() -> None:
    from PIL import Image

    IMAGES.mkdir(exist_ok=True)
    cases = []

    def emit(cid: str, img, base: str, *, kind: str, expect: str, hides: list[str], post: list[dict]) -> None:
        name = f"{cid}.webp"
        img.save(IMAGES / name, "WEBP", quality=88, method=6)
        batch, style, setting, seed = BASES[base]
        t = truth(batch)
        seen = SEEN.get(base, {})
        t.update(seen.get("fields") or {})
        if seen.get("pack"):
            t["pack"] = seen["pack"]
        for f in hides:
            t[f] = None
        sidecar = {
            "model": MODEL,
            "seed": seed,
            "size": "1024 (4:3, 1184 x 896)",
            "prompt": scene(label_lines(batch, style), setting),
            "postProcessing": [*post, {"step": "convert", "to": "WebP", "quality": 88}],
            "source": f"src/{base}.png (sha256 {_sha(SRC / f'{base}.png')}, kept locally)",
            "seen": seen.get("note"),
        }
        (IMAGES / f"{cid}.prompt.json").write_text(json.dumps(sidecar, ensure_ascii=False, indent=1) + "\n")
        cases.append({"id": cid, "image": f"images/{name}", "kind": kind, "expect": expect, "truth": t})

    for base in BASES:
        src = SRC / f"{base}.png"
        if not src.exists():
            print(f"skipped {base}: no src/{base}.png yet")
            continue
        img = Image.open(src).convert("RGB")
        emit(base, img, base, kind="clean" if base in CLEAN else "hard", expect="exact", hides=[], post=[])
        for v in VARIANT_BASES.get(base, []):
            t, params, expect, hides = VARIANTS[v]
            out = transform(img, t, params)
            emit(f"{base}--{v}", out, base, kind="hard", expect=expect, hides=hides, post=[{"step": t, **params}])
        for (b, expect), (box, field) in COVERS.items():
            if b == base:
                post = [{"step": "cover", "box": list(box), "what": field}]
                out = transform(img, "cover", {"box": box})
                emit(f"{base}--{expect}", out, base, kind="hard", expect=expect, hides=[field], post=post)
    for i, c in enumerate(cases):
        c["split"] = "held-out" if i % HELD_OUT_EVERY == 0 else "train"
    (HERE / "cases.jsonl").write_text("".join(json.dumps(c, ensure_ascii=False) + "\n" for c in cases))
    clean = sum(1 for c in cases if c["kind"] == "clean")
    print(f"wrote {len(cases)} cases ({clean} clean, {len(cases) - clean} hard) and their images")


if __name__ == "__main__":
    if sys.argv[1:] == ["gen"]:
        gen()
    elif sys.argv[1:] == ["build"]:
        build()
    else:
        print(__doc__)
