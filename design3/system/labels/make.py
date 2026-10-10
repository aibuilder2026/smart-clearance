"""The label maker (SC-147): every carton label photo in Smart-Clearance, printed onto a base photo's blank sticker.

    python3 make.py bases [dir]   # each src/base-<seed>.png (or dir's): its sticker found, bases/<seed>.webp, bases.json
    python3 make.py labels        # every Munchly batch's label photo, into design3/system/img/labels/ with its sidecar

`photos()` is what the label photos and Vision's eval set (agents/evals/vision/plan.py) are both made by: a label for
each spec (label.py), warped onto its base's sticker with any cover (compose.mjs), each code read back from the finished
photo. Needs uv (segno, numpy, pillow and scipy, run through `uv run --with`), node and cwebp. Every company, person,
number and code is fictional.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BASES = HERE / "bases"
BASES_JSON = HERE / "bases.json"
SRC = HERE / "src"
LABELS = HERE.parent / "img" / "labels"
JOURNEY = ROOT / "backend-api" / "src" / "sc_api" / "reference" / "journey.json"
UV = ["uv", "run", "-q", "--with", "segno", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python"]
MODEL = "Qwen-Image 2.1 (bf16), text to image, run locally (qwen-image-bf16 0.2.0): the blank base photo"
H, PAD = 640, 22  # the label's print size in CSS px, and the sticker's own margin round the print

# each Munchly batch's label photo, on a base of its own look (the history's batches, the story's chips and Mango Drink)
LABEL_BASE = {
    "MF-2406-105": 14711, "MF-2406-106": 14713, "MF-2406-107": 14714, "MF-2406-108": 14715,
    "MF-2406-109": 14716, "MF-2407-110": 14717, "MF-2407-111": 14710, "MF-2407-112": 14712,
    "MF-2407-113": 14720, "MF-2407-114": 14721, "MF-2407-115": 14723, "MF-2407-116": 14724,
    "MF-2409-117": 14701, "MF-2410-118": 14725,
}


def prompts() -> dict[int, str]:
    """each base's seed and prompt, as bases.sh asked Qwen for it"""
    out = {}
    for seed, prompt in re.findall(r'^gen (\d+) "([^"]*)"', (HERE / "bases.sh").read_text(), re.M):
        out[int(seed)] = prompt
    return out


def bases(src: Path) -> None:
    """find each base photo's sticker, and keep the base as WebP with its quad, seed and prompt"""
    BASES.mkdir(exist_ok=True)
    asked = prompts()
    found = {}
    pngs = sorted(src.glob("base-*.png"))
    out = subprocess.run([*UV, str(HERE / "quad.py"), *map(str, pngs)], check=True, capture_output=True, text=True)
    for line in out.stdout.splitlines():
        q = json.loads(line)
        seed = int(re.search(r"base-(\d+)\.png", q["base"]).group(1))
        if seed not in asked:
            continue
        webp = BASES / f"{seed}.webp"
        subprocess.run(["cwebp", "-quiet", "-q", "90", q["base"], "-o", str(webp)], check=True)
        found[str(seed)] = {"file": f"bases/{seed}.webp", "seed": seed, "size": [q["w"], q["h"]], "quad": q["quad"],
                            "aspect": q["aspect"], "share": q["share"], "prompt": asked[seed]}
    known = json.loads(BASES_JSON.read_text()) if BASES_JSON.exists() else {}
    known.update(found)
    BASES_JSON.write_text(json.dumps(dict(sorted(known.items())), ensure_ascii=False, indent=1) + "\n")
    print(f"{len(found)} bases: " + ", ".join(f"{k} ({v['aspect']}, {v['share']})" for k, v in sorted(found.items())))


def base(seed: int) -> dict:
    return json.loads(BASES_JSON.read_text())[str(seed)]


def photos(jobs: list[dict], work: Path) -> list[str]:
    """jobs: [{out, png?, base: seed, spec: {sku, batch, mfg, bestBefore, mrp, style?}, covers?: [...], scan?}]; returns
    compose.mjs's line for each (ok or FAIL, the codes read back)"""
    work.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(HERE))
    import label  # noqa: PLC0415

    compose = []
    for i, j in enumerate(jobs):
        b = base(j["base"])
        w = round(H * min(1.85, max(1.3, b["aspect"])))
        spec = {**j["spec"], "w": w, "h": H, "pad": PAD}
        html = work / f"label-{i:03d}.html"
        html.write_text(label.build(spec))
        compose.append({"base": str(HERE / b["file"]), "label": str(html), "out": str(j["out"]),
                        "png": str(j.get("png") or work / f"photo-{i:03d}.png"), "quad": b["quad"],
                        "size": {"w": w, "h": H}, "covers": j.get("covers", []), "expect": label.expect(spec),
                        "scan": j.get("scan", True), "quality": j.get("quality", 86)})
    (work / "jobs.json").write_text(json.dumps(compose, indent=1))
    run = subprocess.run(["node", str(HERE / "compose.mjs"), str(work / "jobs.json")], capture_output=True, text=True)
    lines = run.stdout.strip().splitlines()
    if run.returncode:
        raise SystemExit("compose.mjs failed:\n" + run.stdout + run.stderr)
    return lines


def _uv_label():
    """label.py needs segno: rerun this script under uv when it is missing"""
    try:
        import segno  # noqa: F401, PLC0415
    except ImportError:
        raise SystemExit(subprocess.run([*UV, *sys.argv]).returncode) from None


def labels() -> None:
    """every Munchly batch that has a label photo: the history's twelve, and the story's chips and Mango Drink"""
    _uv_label()
    sys.path.insert(0, str(HERE))
    import label  # noqa: PLC0415
    import skus  # noqa: PLC0415

    j = json.loads(JOURNEY.read_text())
    mrp = {s["id"]: s["mrp"] for s in (j["skus"] if isinstance(j["skus"], list) else j["skus"].values())}
    dists = j["distributors"] if isinstance(j["distributors"], dict) else {d["id"]: d for d in j["distributors"]}
    rows = [b | {"ref": b["ref"]} for b in j["history"]["batches"]]
    rows += [{"ref": b.get("ref") or b.get("id"), **b} for b in j["batches"] if (b.get("ref") or b.get("id")) in LABEL_BASE]
    jobs, meta = [], []
    for b in rows:
        ref = b["ref"]
        spec = {"sku": b["sku"], "batch": ref, "mfg": b["mfg"], "bestBefore": b["bestBefore"], "mrp": mrp[b["sku"]]}
        jobs.append({"out": LABELS / f"{ref}.webp", "png": SRC / "labels" / f"{ref}.png", "base": LABEL_BASE[ref], "spec": spec})
        meta.append((b, spec))
    lines = photos(jobs, SRC / "work-labels")
    print("\n".join(lines))
    for (b, spec), line in zip(meta, lines, strict=True):
        bb = b["bestBefore"].split("-")
        sku, d = skus.SKUS[b["sku"]], dists.get(b["distributor"], {})
        seed = LABEL_BASE[b["ref"]]
        side = {
            "model": MODEL,
            "seed": seed,
            "size": "1024 (4:3, 1184 x 896)",
            "prompt": base(seed)["prompt"],
            "postProcessing": [
                "design3/system/labels/label.py: the full statutory sticker (SC-147, option A) for the batch, as HTML",
                "design3/system/labels/compose.mjs: rendered at twice its size, warped onto the base's sticker "
                "(bases.json quad), multiplied with a 0.55 px blur, each code read back with Chromium's BarcodeDetector",
                "cwebp -q 86",
            ],
            "codes": label.expect(spec),
            "read": line.split("  ", 1)[0].strip(),
            "purpose": f"SC-147: the label photo {d.get('name', b['distributor'])} sent for batch {b['ref']} "
            f"({sku.get('brand', 'Munchly').title()} {sku['name']} {sku['size']}, best before {bb[2]}/{bb[1]}/{bb[0]}); "
            "every company, number and code fictional",
        }
        (LABELS / f"{b['ref']}.prompt.json").write_text(json.dumps(side, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(rows)} label photos in {LABELS.relative_to(ROOT)}")


if __name__ == "__main__":
    if sys.argv[1:2] == ["bases"]:
        bases(Path(sys.argv[2]) if len(sys.argv) > 2 else SRC)
    elif sys.argv[1:] == ["labels"]:
        labels()
    else:
        print(__doc__)
