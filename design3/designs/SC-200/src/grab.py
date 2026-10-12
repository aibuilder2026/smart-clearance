"""Contact sheet of a recording at given times (labelled), for picking the cut's moments: grab.py SRC out.jpg t1 t2 …"""
import subprocess, sys, io
from PIL import Image, ImageDraw, ImageFont
src, out, times = sys.argv[1], sys.argv[2], [float(t) for t in sys.argv[3:]]
W = 960; tiles = []
for t in times:
    png = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", src, "-frames:v", "1", "-vf", f"scale={W}:-1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    im = Image.open(io.BytesIO(png)).convert("RGB"); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 110, 34], fill=(0, 0, 0)); d.text((8, 4), f"{t:.1f}", fill=(255, 230, 0), font=ImageFont.truetype("fonts/Geist.ttf", 26))
    tiles.append(im)
cols = 2; rows = (len(tiles) + cols - 1) // cols; h = tiles[0].height
sheet = Image.new("RGB", (W * cols, h * rows), (20, 20, 20))
for i, im in enumerate(tiles): sheet.paste(im, ((i % cols) * W, (i // cols) * h))
sheet.save(out, quality=85)
