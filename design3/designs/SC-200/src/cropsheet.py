"""Every screen shot's device crops at the start, middle and end of its window, to catch stage notes cut at a device's edge."""
import io, json, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
F = json.loads(open("film.json").read()); f = ImageFont.truetype("fonts/Geist.ttf", 22)
only = {int(a) for a in sys.argv[2:]}
rows = []
for s in F["shots"]:
    if s["type"] != "screen" or (only and s["n"] not in only): continue
    tiles = []
    for dev in F["layout"][s["layout"]]:
        x, y, w, h = F["dev"][dev]
        for u in (0.0, 0.5, 1.0):
            t = s["t0"] + u * s["dur"] * s["speed"]
            png = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", F["src"][s["src"]], "-frames:v", "1", "-vf",
                                  f"crop={w}:{h}:{x}:{y},scale=-2:260", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
            im = Image.open(io.BytesIO(png)).convert("RGB"); ImageDraw.Draw(im).text((4, 2), f"{s['n']} {dev} {t:.1f}", fill=(255, 0, 0), font=f)
            tiles.append(im)
    row = Image.new("RGB", (sum(t.width for t in tiles) + 8 * len(tiles), 264), (30, 30, 30)); x0 = 0
    for t in tiles: row.paste(t, (x0, 2)); x0 += t.width + 8
    rows.append(row)
Wd = max(r.width for r in rows); sheet = Image.new("RGB", (Wd, 268 * len(rows)), (0, 0, 0))
for i, r in enumerate(rows): sheet.paste(r, (0, i * 268))
sheet.save(sys.argv[1], quality=82)
