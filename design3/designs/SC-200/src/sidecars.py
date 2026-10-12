"""SC-200: what ships beside the film. Each Qwen keyframe as WebP with its .prompt.json in ../img/, each LTX clip with its
sidecar in ../media/ (the PNG originals and the build stay local in src/, git-ignored)."""
import datetime, json, re, shutil
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent; D = HERE.parent
(D / "img").mkdir(exist_ok=True); (D / "media").mkdir(exist_ok=True)
STYLE = (HERE / "prompts" / "STYLE.txt").read_text().strip()
q1, q2 = (HERE / "gen-qwen.sh").read_text(), (HERE / "gen-qwen2.sh").read_text()
seeds = dict(re.findall(r"^gen (\S+) (\d+)", q1, re.M))
conds = {"g06-mango": ["system/img/pack-mango.webp"], "g07-chips": ["system/img/pack-chips.webp"], "g08-town-sunrise": ["g04-town-network"],
         "g06w-mango": ["g06-mango, centred on a blurred 16:9 canvas of itself"], "g07w-chips": ["g07-chips, centred on a blurred 16:9 canvas of itself"]}
use = {"g01-hourglass": "the problem: an hourglass of snack packets", "g02-calendar-aisle": "the problem: blank pages drifting down a godown aisle",
       "g03-landfill": "the problem: the landfill", "g04-town-network": "Smart-Clearance: the town and its agents' network; the intro's plate",
       "g05-backdrop": "the console section's plate", "g06-mango": "condition image for g06w", "g06w-mango": "the Mango Drink chapter; its plate",
       "g07-chips": "condition image for g07w", "g07w-chips": "the Masala Chips chapter; its plate", "g08-town-sunrise": "the close; its plate"}
for png in sorted((HERE / "img").glob("*.png")):
    k = png.stem; im = Image.open(png)
    im.convert("RGB").save(D / "img" / f"{k}.webp", "WEBP", quality=88)
    style = STYLE if k[:4] not in ("g06w", "g07w") else STYLE.replace("No text, no numbers, no lettering, no logos, no signs anywhere in the picture.",
                                                                    "Only the product keeps its printed label; nothing else carries text.")
    seed = int(seeds.get(k) or ("200006" if k == "g06w-mango" else "200007"))
    side = {"name": k, "model": "Qwen-Image-2.1 (bf16, local)", "prompt": (HERE / "prompts" / f"{k}.txt").read_text().strip() + " " + style,
            "condition_images": conds.get(k, []), "seed": seed, "size": list(im.size), "aspect": "16:9" if im.size[0] > im.size[1] else "1:1",
            "created": datetime.date.today().isoformat(), "use": f"SC-200 film: {use.get(k, '')}", "cost_usd": 0, "postprocess": "webp q88"}
    (D / "img" / f"{k}.prompt.json").write_text(json.dumps(side, indent=2, ensure_ascii=False) + "\n")
for mp4 in sorted((HERE / "clips").glob("*.mp4")):
    shutil.copy2(mp4, D / "media" / mp4.name)
    side = json.loads(mp4.with_suffix(".prompt.json").read_text()); side["use"] = "SC-200 film"
    (D / "media" / f"{mp4.stem}.prompt.json").write_text(json.dumps(side, indent=2, ensure_ascii=False) + "\n")
print("img", len(list((D / "img").glob("*.webp"))), "media", len(list((D / "media").glob("l*.mp4"))))
