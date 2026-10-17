"""SC-238: the motion check. Each named media's frame-to-frame shift, by phase correlation on the middle of the frame
(sub-pixel, where optical flow on a near-still shot reads its own noise), and a judder flag where the steps alternate:
a shot interpolated by picking the nearest of a denser set steps 1, 2, 2, 1, 2 (pass 11's first over-the-shoulder
shots), RIFE on a boiling texture 0, 2 (r3, r4). Exits 1 if any is flagged.
   python cadence.py [names…]          (default: every clip, talking take and over-the-shoulder shot; name@62 starts
                                       at 62 s, as the agents scene's held shots over the town's footage)
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE / 'film' / 'public' / 'media'


TILES = [(0, 270, 0, 480), (0, 270, 480, 960), (270, 540, 0, 480), (270, 540, 480, 960)]


def shifts(path, n_max=420, start=None):
    """the shifts of the quarter of the frame that moves most (an over-the-shoulder shot's screen holds still while
    the room and the hands move round it, and a whole-frame correlation locks on to it)"""
    cap = cv2.VideoCapture(str(path)); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    a = max(0, n // 2 - n_max // 2) if start is None else int(start * cap.get(cv2.CAP_PROP_FPS)); cap.set(cv2.CAP_PROP_POS_FRAMES, a)
    prev, win, d = None, None, [[] for _ in TILES]
    for _ in range(min(n_max, n - a)):
        ok, fr = cap.read()
        if not ok: break
        g = cv2.cvtColor(cv2.resize(fr, (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
        if win is None: win = cv2.createHanningWindow((480, 270), cv2.CV_32F)
        if prev is not None:
            for k, (y0, y1, x0, x1) in enumerate(TILES):
                (dx, dy), _ = cv2.phaseCorrelate(prev[y0:y1, x0:x1], g[y0:y1, x0:x1], win); d[k].append(float(np.hypot(dx, dy)))
        prev = g
    d = [np.array(x) for x in d]
    return max(d, key=lambda x: float(np.median(x)) if len(x) else 0.0)


def main():
    M = json.loads((HERE / 'build' / 'media.json').read_text())
    names = sys.argv[1:] or [k for k, m in M.items() if m['kind'] in ('clip', 'talk', 'ots')]
    bad = []
    for name in names:
        name, _, at = name.partition('@')
        p = OUT / f'{name}.mp4'
        if not p.exists(): print(f'{name:16s} missing'); continue
        d = shifts(p, start=float(at) if at else None); med = float(np.median(d)) if len(d) else 0.0
        if med < 0.08: print(f'{name:16s} near still (median shift {med:.3f} px at 960 wide)'); continue
        # each step against its own neighbourhood (the median of the nine round it), since a shot may slow or speed up:
        # how far it strays from the mean of its two neighbours (a smooth move a few percent, a face or a hand moving on
        # its own about a fifth, a cadence of 1, 2, 1, 2 or 0, 2 half or more), and how often it all but stops
        loc = np.array([np.median(d[max(0, i - 4): i + 5]) for i in range(len(d))])
        mv = loc > 0.08
        alt = float(np.median((np.abs(d[1:-1] - (d[:-2] + d[2:]) / 2) / np.maximum(loc[1:-1], 1e-6))[mv[1:-1]])) if mv[1:-1].sum() > 3 else 0.0
        still = float(np.mean((d < 0.3 * loc)[mv])) if mv.any() else 0.0
        flag = alt > 0.4 or still > 0.12
        print(f'{name:16s} median shift {med:.3f} px; strays {alt:.2f}; near-still {still:.2f}' + ('   JUDDER' if flag else ''))
        if flag: bad.append(name)
    if bad: print('judder in:', ' '.join(bad)); sys.exit(1)


if __name__ == '__main__':
    main()
