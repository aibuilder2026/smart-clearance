"""SC-158: what ships beside the film. Every keyframe and cast sheet as WebP in ../img/ with its .prompt.json (the
model, seed, prompt and inputs, read from gen-qwen.sh), every clip copied into ../media/ with its .prompt.json (from
gen-ltx.py's sidecars), and the film's own sidecar composed from both. PNG originals stay in src/ (gitignored).

  uv run --with pillow python sidecars.py
"""

import hashlib
import json
import re
import subprocess
from datetime import date
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
DESIGN = HERE.parent
IMG_OUT, MEDIA = DESIGN / "img", DESIGN / "media"
IMG_OUT.mkdir(exist_ok=True)
MEDIA.mkdir(exist_ok=True)
TODAY = date.today().isoformat()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def qwen_prompts() -> dict[str, dict]:
    """each gen call of gen-qwen.sh, with its variables expanded, by running the script with gen() replaced"""
    script = (HERE / "gen-qwen.sh").read_text()
    body = re.sub(r"gen\(\) \{.*?\n\}\n", "", script, flags=re.S)
    body = body.replace("set +u", "")
    stub = '''gen() { python3 -c "import json,sys; print(json.dumps({'name': sys.argv[1], 'seed': int(sys.argv[2]), 'aspect': sys.argv[3], 'prompt': sys.argv[4], 'inputs': sys.argv[5:]}))" "$@"; }\n'''
    out = subprocess.run(["bash", "-c", stub + body], text=True, capture_output=True, cwd=HERE)
    found = {}
    for line in out.stdout.splitlines():
        if line.startswith("{"):
            d = json.loads(line)
            found[d["name"]] = d
    return found


def images() -> None:
    prompts = qwen_prompts()
    for png in sorted((HERE / "img").glob("*.png")):
        name = png.stem
        p = prompts.get(name)
        if not p:
            print(f"no prompt for {name}")
            continue
        webp = IMG_OUT / f"{name}.webp"
        im = Image.open(png).convert("RGB")
        im.save(webp, "WEBP", quality=82, method=6)
        kind = "sheet" if name.startswith("cast-") else "keyframe"
        sidecar = {
            "name": name, "model": "Qwen-Image-2.1 (bf16, local)", "plugin": "qwen-image-bf16 0.2.0", "kind": kind,
            "prompt": p["prompt"], "seed": p["seed"], "aspect": p["aspect"], "size": 1024, "steps": 40,
            "inputs": [{"role": "reference sheet", "file": Path(x).name, "sha256": sha(Path(x))} for x in p["inputs"] if Path(x).exists()],
            "output": f"{name}.png {im.width}x{im.height}", "postprocess": f"WebP q82 from {name}.png", "created": TODAY,
            "use": ("SC-158 cast: a fictional person, the reference for every keyframe they are in" if kind == "sheet"
                    else "SC-158 keyframe: the first frame of one of the demo film's clips, and the still behind its screens"),
            "fictional": "every person is fictional; no brand or lettering",
        }
        (IMG_OUT / f"{name}.prompt.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False))
        print(f"img {name}: {webp.stat().st_size // 1024} KB")


def clips() -> list[dict]:
    done = []
    for mp4 in sorted((HERE / "clips").glob("*.mp4")):
        meta = json.loads(mp4.with_suffix(".json").read_text())
        out = MEDIA / mp4.name
        out.write_bytes(mp4.read_bytes())
        sidecar = {
            "name": mp4.stem, "model": meta.get("model"), "plugin": "ltx-video 0.2.0", "ltx_desktop": meta.get("ltx_desktop"),
            "kind": "clip", "prompt": meta["prompt"], "seed": meta["seed"], "resolution": meta["resolution"], "duration_s": meta["duration"],
            "fps": meta["fps"], "camera": meta["cameraMotion"], "audio": meta["audio"],
            "inputs": [{"role": "first frame", "file": Path(meta["image"]).name, "sha256": sha(Path(meta["image"]))}] if meta.get("image") and Path(meta["image"]).exists() else [],
            "minutes": meta.get("minutes"), "created": TODAY, "use": "SC-158: one shot of the demo film, image to video from its keyframe",
        }
        (MEDIA / f"{mp4.stem}.prompt.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False))
        done.append(sidecar)
        print(f"clip {mp4.stem}: {out.stat().st_size // 1024} KB")
    return done


def film(done: list[dict]) -> None:
    out = MEDIA / "mango-drink-demo.mp4"
    if not out.exists():
        return
    spec = json.loads((HERE / "film.json").read_text())
    sidecar = {
        "name": "mango-drink-demo", "kind": "film", "created": TODAY,
        "made_with": ["Qwen-Image-2.1 bf16 (local) for the cast and keyframes", "LTX 2.5 Fast (local) for the clips, image to video",
                      "the workspace and console apps on the live stack for the screens (capture.mjs)", "numpy for the music (music.py)", "ffmpeg for the cut (assemble.py)"],
        "segments": len(spec["segments"]), "clips": [c["name"] for c in done], "music": "music.py, seed 158, D major at 76 bpm",
        "postprocess": "libx264 crf 18, aac 192k, loudnorm I=-16", "fictional": "every person, company and figure is fictional; the figures are the journey's own",
    }
    (MEDIA / "mango-drink-demo.prompt.json").write_text(json.dumps(sidecar, indent=2, ensure_ascii=False))
    print(f"film sidecar: {len(done)} clips")


if __name__ == "__main__":
    images()
    film(clips())
