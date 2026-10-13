# contact sheets of a recording at given times: grab.py <rec> <out.jpg> t1 t2 ... (rec time, s)
import subprocess, sys, os, tempfile
from PIL import Image, ImageDraw, ImageFont
rec, out, *ts = sys.argv[1:]
ts = [float(t) for t in ts]
tw, th, cols = 640, 360, 4
rows = (len(ts) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols, th * rows), (20, 20, 20))
f = ImageFont.truetype(os.path.join(os.path.dirname(__file__), 'fonts/Geist.ttf'), 22)
with tempfile.TemporaryDirectory() as d:
    for i, t in enumerate(ts):
        p = f'{d}/{i}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', rec, '-frames:v', '1', '-vf', f'scale={tw}:{th}', p], check=True)
        im = Image.open(p)
        x, y = (i % cols) * tw, (i // cols) * th
        sheet.paste(im, (x, y))
        dr = ImageDraw.Draw(sheet)
        dr.rectangle([x, y + th - 30, x + 110, y + th], fill=(0, 0, 0))
        dr.text((x + 6, y + th - 28), f'{t:.1f}', fill=(255, 220, 80), font=f)
sheet.save(out, quality=85)
