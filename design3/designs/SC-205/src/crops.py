# crops of one device at given times: crops.py <rec> <device> <out.jpg> <width> t1 t2 ...
import subprocess, sys, os, tempfile
from PIL import Image, ImageDraw, ImageFont
DEV = {'P': (37, 180, 1082, 751), 'L': (1173, 180, 850, 1223), 'H': (2073, 177, 453, 979), 'A': (37, 180, 1933, 1206),
       'PL': (37, 180, 1986, 1223), 'ALL': (0, 0, 2560, 1440)}
rec, dev, out, tw, *ts = sys.argv[1:]
x, y, w, h = DEV[dev]; tw = int(tw); th = round(h * tw / w)
cols = max(1, min(len(ts), 2400 // tw)); rows = (len(ts) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols, th * rows), (20, 20, 20))
f = ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts/Geist.ttf'), 20)
with tempfile.TemporaryDirectory() as d:
    for i, t in enumerate(ts):
        p = f'{d}/{i}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', rec, '-frames:v', '1', '-vf', f'crop={w}:{h}:{x}:{y},scale={tw}:{th}:flags=lanczos', p], check=True)
        X, Y = (i % cols) * tw, (i // cols) * th
        sheet.paste(Image.open(p), (X, Y))
        dr = ImageDraw.Draw(sheet); dr.rectangle([X, Y + th - 26, X + 90, Y + th], fill=(0, 0, 0)); dr.text((X + 5, Y + th - 25), t, fill=(255, 220, 80), font=f)
sheet.save(out, quality=88)
