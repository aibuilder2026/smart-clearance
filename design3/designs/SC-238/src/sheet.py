"""SC-238: a labelled contact sheet of stills, in time order (t<seconds>.jpg from capture-page.mjs, or any images).
   uv run --with pillow python sheet.py OUT.jpg [--cols 3] [--w 640] IMG…"""
import argparse, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('imgs', nargs='+'); ap.add_argument('--cols', type=int, default=3); ap.add_argument('--w', type=int, default=640)
a = ap.parse_args()
key = lambda p: float(m.group(1)) if (m := re.search(r't([\d.]+)\.\w+$', p)) else 0.0
fs = sorted(a.imgs, key=key) if all(re.search(r't[\d.]+\.\w+$', p) for p in a.imgs) else a.imgs
ims = [Image.open(p).convert('RGB') for p in fs]
w = a.w; h = round(w * ims[0].height / ims[0].width)
rows = (len(ims) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (a.cols * w + (a.cols - 1) * 4, rows * h + (rows - 1) * 4), (0, 0, 0))
try: font = ImageFont.truetype(str(Path(__file__).parent / 'fonts' / 'Geist.ttf'), 22)
except OSError: font = ImageFont.load_default()
for i, (p, im) in enumerate(zip(fs, ims)):
    x, y = (i % a.cols) * (w + 4), (i // a.cols) * (h + 4)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d = ImageDraw.Draw(sheet); label = Path(p).stem
    d.rectangle([x + 6, y + 6, x + 14 + d.textlength(label, font=font), y + 34], fill=(0, 0, 0))
    d.text((x + 10, y + 8), label, fill=(255, 255, 255), font=font)
sheet.save(a.out, quality=88)
print(a.out, len(ims))
