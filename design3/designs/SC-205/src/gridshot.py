# device frames with a 50 px grid in the device's own pixels: gridshot.py <out.jpg> <scale> rec:dev:t ...
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont
from kit import DEV, REC
out, sc, *specs = sys.argv[1:]; sc = float(sc)
f = ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts/Geist.ttf'), 15)
tiles = []
with tempfile.TemporaryDirectory() as d:
    for i, sp in enumerate(specs):
        rec, dev, t = sp.split(':')
        x, y, w, h = DEV[dev]
        p = f'{d}/{i}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', str(REC[rec]), '-frames:v', '1', '-vf', f'crop={w}:{h}:{x}:{y}', p], check=True)
        im = Image.open(p).convert('RGB')
        im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        dr = ImageDraw.Draw(im, 'RGBA')
        for gx in range(0, w, 50):
            dr.line([(gx * sc, 0), (gx * sc, h * sc)], fill=(255, 0, 80, 110 if gx % 100 == 0 else 45), width=1)
            if gx % 100 == 0: dr.text((gx * sc + 2, 2), str(gx), fill=(220, 0, 60, 255), font=f)
        for gy in range(0, h, 50):
            dr.line([(0, gy * sc), (w * sc, gy * sc)], fill=(255, 0, 80, 110 if gy % 100 == 0 else 45), width=1)
            if gy % 100 == 0: dr.text((2, gy * sc + 2), str(gy), fill=(220, 0, 60, 255), font=f)
        dr.rectangle([0, h * sc - 22, 220, h * sc], fill=(0, 0, 0, 200)); dr.text((4, h * sc - 20), sp, fill=(255, 220, 80, 255), font=f)
        tiles.append(im)
Wd = sum(t.width for t in tiles) + 10 * (len(tiles) - 1); Ht = max(t.height for t in tiles)
sheet = Image.new('RGB', (Wd, Ht), (30, 30, 30)); x = 0
for t in tiles: sheet.paste(t, (x, 0)); x += t.width + 10
sheet.save(out, quality=90)
