"""SC-238: the ring-free stretches of a recording's device screen (ringscan.py's test at 6 frames a second).
   uv run --with numpy --with pillow python cleanspans.py REC DEV T0 T1 [MIN=1.0]"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import plan, ringscan
rec, dev, t0, t1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]); mn = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
fs = ringscan.frames(str(plan.REC[rec]), plan.DEV[dev], t0, t1)
cards = ringscan.chapter_cards(str(plan.REC[rec]))
bad = [ringscan.flagged(f) for f in fs]
runs, s = [], None
for i, b in enumerate(bad + [True]):
    if not b and s is None: s = i
    if b and s is not None: runs.append((t0 + s / 6, t0 + i / 6)); s = None
print(f'{rec} {dev} {t0}-{t1}: rings at', [round(t0 + i / 6, 2) for i, b in enumerate(bad) if b][:60])
print('clean stretches:', [(round(a, 2), round(b, 2)) for a, b in runs if b - a >= mn])
