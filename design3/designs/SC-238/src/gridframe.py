"""SC-238: a recording's device screen at a moment, with a coordinate grid (the screen's own pixels), for placing rings.
   uv run --with pillow python gridframe.py REC DEV T [T…]  ->  build/grid/<rec>-<dev>-<t>.png"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, str(Path(__file__).resolve().parent))
import plan
rec, dev, *ts = sys.argv[1:]
x, y, w, h = plan.DEV[dev]
out = Path(__file__).resolve().parent / 'build' / 'grid'; out.mkdir(parents=True, exist_ok=True)
for t in ts:
    p = out / f'{rec}-{dev}-{float(t):.2f}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', str(plan.REC[rec]), '-frames:v', '1', '-vf', f'crop={w}:{h}:{x}:{y}', str(p)], check=True)
    im = Image.open(p).convert('RGB'); sc = 2 if w < 600 else 1
    im = im.resize((w * sc, h * sc), Image.LANCZOS); d = ImageDraw.Draw(im, 'RGBA')
    f = ImageFont.truetype(str(Path(__file__).resolve().parent / 'fonts' / 'Geist.ttf'), 12 * sc)
    step = 50
    for gx in range(0, w, step):
        d.line([(gx * sc, 0), (gx * sc, h * sc)], fill=(255, 0, 80, 70 if gx % 100 else 130), width=1)
        if gx % 100 == 0: d.text((gx * sc + 2, 2), str(gx), font=f, fill=(255, 0, 80, 255))
    for gy in range(0, h, step):
        d.line([(0, gy * sc), (w * sc, gy * sc)], fill=(255, 0, 80, 70 if gy % 100 else 130), width=1)
        if gy % 100 == 0: d.text((2, gy * sc + 2), str(gy), font=f, fill=(255, 0, 80, 255))
    im.save(p); print(p)
