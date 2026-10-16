"""SC-219 cut 14: tiles14.mjs's screenshots into the architecture's 3D screens (arch13/tiles/), 1280 px wide.
  landing: the page as one strip a screen at a time (its pill taken out of the first screen); it scrolls whole
  console, cmd: the laptop's page as it opens (base) and its scroller unfolded and shot whole (col), so the sidebar stays
               where it is while the column scrolls, as in the app
  demo: the route map and a stage
and tiles.json with each strip's geometry for arch.js.   .venv/bin/python tiles14.py build/tiles14"""
import json, sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1]); out = Path(__file__).resolve().parent / 'arch13' / 'tiles'; out.mkdir(exist_ok=True)
meta = json.loads((src / 'meta.json').read_text())
W = 1280
geo = {}

def save(im, name):
    im.convert('RGB').save(out / f'{name}.webp', quality=92, method=6)

# the landing page: the first screen as it opens with its floating pill painted out from the bare shot, then the rest
base = Image.open(src / 'landing-base.png').convert('RGB'); bare0 = Image.open(src / 'landing-0.png').convert('RGB')
for f in meta.get('landingFixed', []):
    box = tuple(int(round(v)) for v in (f['x'] - 6, f['y'] - 6, f['x'] + f['w'] + 6, f['y'] + f['h'] + 6))
    base.paste(bare0.crop(box), box[:2])
vw, vh = base.size
ys = meta['landing']; H = ys[-1] + vh
strip = Image.new('RGB', (vw, H), 'white')
for i, y in enumerate(ys):
    strip.paste(base if i == 0 else Image.open(src / f'landing-{i}.png').convert('RGB'), (0, y))
k = W / vw
save(strip.resize((W, round(H * k)), Image.LANCZOS), 'landing')
geo['landing'] = {'h': round(H * k), 'view': round(vh * k)}

# the console's Overview and the workspace's Command Center: the page as it opens (base), and its scroller unfolded and
# shot whole (col), so the sidebar stays where it is while the column scrolls, as in the app
for n in ('console', 'cmd'):
    f0 = Image.open(src / f'{n}-base.png').convert('RGB'); pw, ph = f0.size
    col = Image.open(src / f'{n}-col.png').convert('RGB')
    box = meta[n + 'Box']; s = pw / box['W']        # device pixels per css pixel
    k = W / pw
    save(f0.resize((W, round(ph * k)), Image.LANCZOS), f'{n}-base')
    # unfolded, the laptop's own scale (the guided demo shrinks it to fit) is gone: the column is brought back to the base's
    cw = round((box['W'] - box['left']) * s * k); chh = round(col.size[1] * cw / col.size[0])
    save(col.resize((cw, chh), Image.LANCZOS), f'{n}-col')
    geo[n] = {'x0': round(box['left'] * s * k), 'top': round(box['top'] * s * k), 'view': round(box['h'] * s * k), 'h': chh, 'baseH': round(ph * k)}
    if n == 'cmd':      # its right-hand column sticks: only the column left of it scrolls
        geo[n]['mainW'] = round((box['stackLeft'] - box['left'] - 10) * s * k)

for i in (0, 1):
    im = Image.open(src / f'demo-{i}.png').convert('RGB')
    save(im.resize((W, round(im.size[1] * W / im.size[0])), Image.LANCZOS), f'demo-{i}')
(out / 'tiles.json').write_text(json.dumps(geo, indent=1))
print(json.dumps(geo))
