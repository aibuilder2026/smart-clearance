"""The Vision eval's label photos (SC-72, relabelled in SC-147): every case is a carton label in the full statutory
sticker's layout (design3/system/labels, option A of SC-147), printed onto a Qwen-Image base photo's blank sticker, in one
of the print styles cartons in India carry (standard, bilingual Hindi, PKD and USE BY, two-digit years, month names).

A hard case is made hard exactly, so its truth is exact too:
- a cover over one line, in the label's own pixels (packing tape, a thumb, a tear), so that field is gone;
- a change to the finished photo with Pillow (blur, glare, darkness, an angle, compression, a small photo, a smear).

The story's own photos (story-clean, mango) are the label photos design3 keeps for MF-2409-117 and MF-2410-118, byte for
byte, so what Rakesh and Lakshmi send in a walk or a journey suite is what the workspace shows.

    python plan.py build    # the photos (design3/system/labels/make.py), images/*.webp, a sidecar each, cases.jsonl

The PNGs it works on stay in src/ (git-ignored); only the WebP ships.

Expectations, which the scorer holds each read to (sc_agents/evals/scorers.py):
- exact: every field of the truth read exactly (a field a tear took away is null in the truth);
- no-date / no-batch: that field covered, so it must come back empty, with a confidence under 0.9 (a label without its
  date or batch must not verify);
- unreadable: confidence under 0.9 and no field wrong (empty is right).
"""

import hashlib
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SRC = HERE / "src"
IMAGES = HERE / "images"
MAKER = ROOT / "design3" / "system" / "labels"
STORY = ROOT / "design3" / "system" / "img" / "labels"
MODEL = "Qwen-Image 2.1 (bf16), text to image, run locally (qwen-image-bf16 0.2.0): the blank base photo"

SKUS = {
    "chips": ("Munchly Masala Chips 150 g", 30.0),
    "mango": ("Munchly Mango Drink 200 ml", 20.0),
    "chikki": ("Munchly Peanut Chikki 100 g", 25.0),
    "oats": ("Munchly Masala Oats 200 g", 65.0),
    "poha": ("Munchly Instant Poha 250 g", 55.0),
    "biscuits": ("Munchly Choco Cream Biscuits 200 g", 40.0),
    "facewash": ("Glowra Aloe Face Wash 100 ml", 120.0),
    "hairoil": ("Glowra Coconut Hair Oil 200 ml", 150.0),
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

# the base cases: id → batch, print style, the base photo (design3/system/labels/bases.json), and what makes it hard:
# `covers` over a line in the label's pixels, `prep` Pillow steps on the finished photo, `expect` and the fields it
# `hides`. `story` takes design3's own label photo for the batch, byte for byte.
BASES = {
    "story-clean": {"batch": "MF-2409-117", "base": 14701, "story": True},
    "story-hand": {"batch": "MF-2409-117", "base": 14720},
    "story-shelf": {"batch": "MF-2409-117", "base": 14721},
    "story-glare": {
        "batch": "MF-2409-117",
        "base": 14714,
        "prep": [("glare", {"x": 0.52, "y": 0.36, "radius": 0.26, "strength": 0.62})],
    },
    "story-angle": {"batch": "MF-2409-117", "base": 14722},
    "story-blur": {"batch": "MF-2409-117", "base": 14716, "prep": [("gaussian_blur", {"radius": 1.4})]},
    "story-thumb": {
        "batch": "MF-2409-117",
        "base": 14711,
        "covers": [{"on": ["mfg", "bb"], "kind": "thumb"}],
        "expect": "no-date",
        "hides": ["mfg", "bestBefore"],
    },
    "story-hindi": {"batch": "MF-2409-117", "base": 14710, "style": "hindi"},
    "story-low-light": {
        "batch": "MF-2409-117",
        "base": 14724,
        "prep": [("brightness", {"factor": 0.62}), ("noise", {"amount": 14})],
    },
    "wrong-batch": {"batch": "MF-2409-171", "base": 14717},
    "other-sku-biscuits": {"batch": "MF-2409-204", "base": 14715},
    "damaged": {"batch": "MF-2409-117", "base": 14723, "covers": [{"on": "mrp", "kind": "tear"}], "hides": ["mrp"]},
    "story-dim": {
        "batch": "MF-2409-117",
        "base": 14713,
        "prep": [("smear", {"radius": 7.0, "factor": 0.32})],
        "expect": "unreadable",
        "hides": ["batch", "mfg", "bestBefore", "mrp"],
    },
    "mango": {"batch": "MF-2410-118", "base": 14725, "story": True},
    "chikki": {"batch": "MF-2408-311", "base": 14710},
    "oats": {"batch": "MF-2409-415", "base": 14712},
    "poha": {"batch": "MF-2410-402", "base": 14714},
    "facewash": {"batch": "GL-2410-044", "base": 14726},
    "hairoil": {"batch": "GL-2410-012", "base": 14717},
    "chips-gupta": {"batch": "MF-2408-209", "base": 14711},
    "mango-hindi": {"batch": "MF-2410-118", "base": 14701, "style": "hindi"},
    "oats-glare": {
        "batch": "MF-2409-415",
        "base": 14726,
        "prep": [("glare", {"x": 0.62, "y": 0.5, "radius": 0.3, "strength": 0.55})],
    },
    "poha-angle": {"batch": "MF-2410-402", "base": 14712, "prep": [("perspective", {"inset": 0.14})]},
    "story-tape": {
        "batch": "MF-2409-117",
        "base": 14716,
        "covers": [{"on": "batch", "kind": "tape"}],
        "expect": "no-batch",
        "hides": ["batch"],
    },
    # the formats cartons in India print: PKD and USE BY, two-digit years, month names, Rs./-
    "story-pkd": {"batch": "MF-2409-117", "base": 14701, "style": "pkd"},
    "story-short": {"batch": "MF-2409-117", "base": 14710, "style": "short"},
    "story-month": {"batch": "MF-2409-117", "base": 14711, "style": "month"},
    "mango-pkd": {"batch": "MF-2410-118", "base": 14725, "style": "pkd"},
    "chikki-month": {"batch": "MF-2408-311", "base": 14714, "style": "month"},
    "biscuits-hindi": {"batch": "MF-2409-204", "base": 14717, "style": "hindi"},
    "hairoil-short": {"batch": "GL-2410-012", "base": 14712, "style": "short"},
    "chips-gupta-month": {"batch": "MF-2408-209", "base": 14713, "style": "month"},
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
# a line covered, in the label's own pixels: (base, expectation) → the cover and the fields it hides (a thumb holding
# the carton covers both dates' figures)
COVERS = {
    ("story-clean", "no-date"): ({"on": "bb", "kind": "tape"}, ["bestBefore"]),
    ("story-clean", "no-batch"): ({"on": "batch", "kind": "tape"}, ["batch"]),
    ("story-shelf", "no-date"): ({"on": ["mfg", "bb"], "kind": "thumb"}, ["mfg", "bestBefore"]),
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


def truth(batch: str) -> dict:
    sku, mfg, best = BATCHES[batch]
    pack, mrp = SKUS[sku]
    return {"batch": batch, "mfg": mfg, "bestBefore": best, "mrp": mrp, "pack": pack}


def spec(batch: str, style: str) -> dict:
    sku, mfg, best = BATCHES[batch]
    return {"sku": sku, "batch": batch, "mfg": mfg, "bestBefore": best, "mrp": SKUS[sku][1], "style": style}


# --- the photos -----------------------------------------------------------------------------------------------------


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
    if kind == "noise":
        grain = Image.effect_noise((w, h), p["amount"]).convert("RGB")
        return Image.blend(img, Image.composite(grain, img, Image.new("L", (w, h), 255)), 0.18)
    if kind == "downscale":
        return img.resize((p["width"], round(h * p["width"] / w)), Image.Resampling.LANCZOS)
    if kind == "smear":
        return ImageEnhance.Brightness(img.filter(ImageFilter.GaussianBlur(p["radius"]))).enhance(p["factor"])
    if kind == "jpeg":
        import io

        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=p["quality"])
        return Image.open(io.BytesIO(buf.getvalue())).convert("RGB")
    raise ValueError(kind)


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def compose() -> dict[str, Path]:
    """every label photo a case starts from: the base cases and the covered ones, printed by the label maker"""
    sys.path.insert(0, str(MAKER))
    import make

    SRC.mkdir(exist_ok=True)
    jobs, names = [], []
    for cid, b in BASES.items():
        if b.get("story"):
            continue
        jobs.append(
            {
                "out": SRC / f"{cid}.png",
                "png": SRC / f"{cid}.png",
                "base": b["base"],
                "spec": spec(b["batch"], b.get("style", "standard")),
                "covers": b.get("covers", []),
                "scan": not b.get("covers"),
            }
        )
        names.append(cid)
    for (cid, expect), (cover, _) in COVERS.items():
        b = BASES[cid]
        jobs.append(
            {
                "out": SRC / f"{cid}--{expect}.png",
                "png": SRC / f"{cid}--{expect}.png",
                "base": b["base"],
                "spec": spec(b["batch"], b.get("style", "standard")),
                "covers": [cover],
                "scan": False,
            }
        )
        names.append(f"{cid}--{expect}")
    for line in make.photos(jobs, SRC / "work"):
        print(line.replace(str(SRC) + "/", ""))
    return {n: SRC / f"{n}.png" for n in names}


def build() -> None:
    from PIL import Image

    try:
        import segno  # noqa: F401
    except ImportError:
        raise SystemExit(
            "run it as: uv run --with segno --with pillow --with numpy --with scipy python plan.py build"
        ) from None
    made = compose()
    bases = json.loads((MAKER / "bases.json").read_text())
    IMAGES.mkdir(exist_ok=True)
    for old in IMAGES.glob("*"):
        old.unlink()
    cases = []

    def emit(cid: str, img, base: str, *, kind: str, expect: str, hides: list[str], post: list[dict], copy=None):
        name = f"{cid}.webp"
        if copy:
            shutil.copyfile(copy, IMAGES / name)
        else:
            img.save(IMAGES / name, "WEBP", quality=88, method=6)
        b = BASES[base]
        seed = b["base"]
        t = truth(b["batch"])
        for f in hides:
            t[f] = None
        source = copy or MAKER / bases[str(seed)]["file"]
        sidecar = {
            "model": MODEL,
            "seed": seed,
            "size": "1024 (4:3, 1184 x 896)",
            "prompt": bases[str(seed)]["prompt"],
            "postProcessing": [
                {
                    "step": "label",
                    "by": "design3/system/labels/label.py (SC-147, the full statutory sticker)",
                    "batch": b["batch"],
                    "style": b.get("style", "standard"),
                },
                {"step": "print", "by": "design3/system/labels/compose.mjs", "onto": bases[str(seed)]["file"]},
                *post,
                {"step": "convert", "to": "WebP", "quality": 86 if copy else 88},
            ],
            "source": f"{Path(source).relative_to(ROOT)} (sha256 {_sha(Path(source))})",
        }
        (IMAGES / f"{cid}.prompt.json").write_text(json.dumps(sidecar, ensure_ascii=False, indent=1) + "\n")
        cases.append({"id": cid, "image": f"images/{name}", "kind": kind, "expect": expect, "truth": t})

    for cid, b in BASES.items():
        copy = STORY / f"{b['batch']}.webp" if b.get("story") else None
        img = Image.open(copy or made[cid]).convert("RGB")
        post = [{"step": "cover", **c} for c in b.get("covers", [])]
        for step, params in b.get("prep", []):
            img = transform(img, step, params)
            post.append({"step": step, **params})
        emit(
            cid,
            img,
            cid,
            kind="clean" if cid in CLEAN else "hard",
            expect=b.get("expect", "exact"),
            hides=b.get("hides", []),
            post=post,
            copy=copy if not post else None,
        )
        for v in VARIANT_BASES.get(cid, []):
            t, params, expect, hides = VARIANTS[v]
            out = transform(img, t, params)
            emit(f"{cid}--{v}", out, cid, kind="hard", expect=expect, hides=hides, post=[{"step": t, **params}])
        for (base, expect), (cover, fields) in COVERS.items():
            if base == cid:
                out = Image.open(made[f"{cid}--{expect}"]).convert("RGB")
                emit(
                    f"{cid}--{expect}",
                    out,
                    cid,
                    kind="hard",
                    expect=expect,
                    hides=fields,
                    post=[{"step": "cover", **cover}],
                )
    for i, c in enumerate(cases):
        c["split"] = "held-out" if i % HELD_OUT_EVERY == 0 else "train"
    (HERE / "cases.jsonl").write_text("".join(json.dumps(c, ensure_ascii=False) + "\n" for c in cases))
    clean = sum(1 for c in cases if c["kind"] == "clean")
    print(f"wrote {len(cases)} cases ({clean} clean, {len(cases) - clean} hard) and their images")


if __name__ == "__main__":
    if sys.argv[1:] == ["build"]:
        build()
    else:
        print(__doc__)
