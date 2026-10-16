"""SC-219 cut 13: the screens screens13.mjs captured (PNG, 2x), as the WebPs arch13/arch.html loads (arch13/scr/); the
console's agent pipeline is stitched from its two scroll positions (the second scrolled 1,109 px further).
  .venv/bin/python screens13.py <pngdir>"""
import sys
from pathlib import Path
from PIL import Image
src = Path(sys.argv[1]); out = Path(__file__).resolve().parent / 'arch13' / 'scr'; out.mkdir(parents=True, exist_ok=True)
NAMES = ['landing-0', 'console-0', 'cmd-0', 'demo-0', 'wsignin-0', 'record2-0', 'lockpc-0', 'lockpc-note', 'locklc-0', 'locklc-note',
         'vision-0', 'vision-1', 'sched2-0', 'sched2-1', 'sched2-3', 'photo2-0', 'photo2-1', 'photo2-2', 'photo2-4', 'neg-0', 'neg-1', 'neg-3',
         'kir0-0', 'lister-0', 'sheet-0', 'yes-0', 'yes-1', 'yes-2', 'yes-3', 'yes-4']
for n in NAMES:
    Image.open(src / f'{n}.png').convert('RGB').save(out / f'{n}.webp', quality=90, method=6)
a = Image.open(src / 'agents2-0.png').convert('RGB'); b = Image.open(src / 'agents2-1.png').convert('RGB')
d = 1109; S = Image.new('RGB', (a.width, a.height + d)); S.paste(a, (0, 0)); S.paste(b.crop((0, a.height - d, b.width, b.height)), (0, a.height))
S.save(out / 'agents.webp', quality=90, method=6)
print('wrote', len(NAMES) + 1, 'screens to', out)
