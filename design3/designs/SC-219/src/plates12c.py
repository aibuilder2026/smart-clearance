"""SC-219 cut 12's concept round: the Qwen plates (img/dc-*.png) as the Remotion project's 1920 x 1080 stills, cropped to
16:9 about their centre as LTX's frame_image crops them, so a plate and its clip's first frame line up.
  python3 plates12c.py"""
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent
OUT = HERE / 'remo12' / 'public' / 'plates'; OUT.mkdir(parents=True, exist_ok=True)
for p in sorted((HERE / 'img').glob('dc-*.png')):
    im = Image.open(p).convert('RGB'); w, h = im.size
    if w / h > 16 / 9: nw = round(h * 16 / 9); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w * 9 / 16); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((1920, 1080), Image.LANCZOS).save(OUT / f'{p.stem}.jpg', quality=92)
    print(p.stem, im.size)
