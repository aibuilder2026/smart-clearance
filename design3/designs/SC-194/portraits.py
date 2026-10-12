"""SC-194: every person who signs in, as the films cast them. Each portrait is the front view of the person's cast
sheet (SC-154, SC-158, SC-187), cut square round the face macOS Vision found, kept inside the sheet's first panel and
scaled to 256 px; Arjun and Sameer, whom the films never cast, are local Qwen-Image renders in the sheets' studio style
(src/gen.sh, gitignored). Run from the repository root: python3 design3/designs/SC-194/portraits.py"""
import json
from datetime import datetime, timezone
from PIL import Image

D = "design3/designs/"
OUT = "design3/system/img/people/"
# person file -> (source, front face x, y, w, h as macOS Vision found it, where it came from)
CAST = {
    "p-priya": (D + "SC-154/img/cast-planner.webp", (318, 252, 324, 324), "SC-154's cast sheet of the brand's supply planner (Nano Banana 2)"),
    "p-rakesh": (D + "SC-154/img/cast-distributor.webp", (275, 344, 400, 400), "SC-154's cast sheet of the distributor (Nano Banana 2)"),
    "p-lakshmi": (D + "SC-158/img/cast-lakshmi.webp", (163, 134, 171, 171), "SC-158's cast sheet of Lakshmi, Lakshmi Agencies (Qwen-Image)"),
    "p-ganesh": (D + "SC-187/img/cast-ganesh.webp", (300, 275, 380, 380), "SC-187's cast sheet of Ganesh ji (Nano Banana 2)"),
    "p-lakshmi-ganapathi": (D + "SC-154/img/cast-kirana.webp", (331, 332, 324, 324), "SC-154's cast sheet of the Hyderabad kirana owner, Sri Lakshmi Ganapathi Kirana (Nano Banana 2)"),
    "p-agrawal": (D + "SC-187/img/cast-agrawal.webp", (238, 304, 438, 438), "SC-187's cast sheet of Agrawal ji (Nano Banana 2)"),
    "p-meera": (D + "SC-158/img/cast-meera.webp", (194, 123, 137, 137), "SC-158's cast sheet of Meera, Feeding India (Qwen-Image)"),
    "p-neha": (D + "SC-158/img/cast-neha.webp", (161, 135, 166, 166), "SC-158's cast sheet of Neha Kulkarni, Smart-Clearance (Qwen-Image)"),
    "p-arjun": (D + "SC-194/src/arjun.png", (391, 179, 246, 246), "a local Qwen-Image 2.1 render, seed 194001 (SC-194/src/gen.sh)"),
    "p-sameer": (D + "SC-194/src/sameer.png", (348, 239, 360, 360), "a local Qwen-Image 2.1 render, seed 194002 (SC-194/src/gen.sh)"),
}
SCALE, DROP = 2.45, 0.16  # the square's side in face widths, and how far below the face's centre it is centred

for name, (src, (x, y, w, h), origin) in CAST.items():
    im = Image.open(src).convert("RGB")
    sheet = im.width > im.height  # a sheet is three panels; a render is one
    panel = im.width / 3 if sheet else im.width
    cx, cy = x + w / 2, y + h / 2 + w * DROP
    edge = panel - (im.width * 0.012 if sheet else 0)
    side = min(w * SCALE, 2 * min(cx, edge - cx), im.height)
    top = max(0, min(cy - side / 2, im.height - side))
    out = im.crop((round(cx - side / 2), round(top), round(cx + side / 2), round(top + side))).resize((256, 256), Image.LANCZOS)
    out.save(OUT + name + ".webp", "WEBP", quality=86, method=6)
    json.dump({
        "prompt": f"Origin: the front view of {origin}, cut square round the face and scaled to 256 px by design3/designs/SC-194/portraits.py; fictional person.",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }, open(OUT + name + ".webp.json", "w"), indent=2)
    print(name, out.size)
