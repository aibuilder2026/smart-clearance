"""SC-219 (cut 11, as cut 9): every frame of the film scanned for a one-frame flash, a frame that differs from both its neighbours
while they match each other (a glitch a cut or a recording's jump can leave), and every walkthrough window's speed.
  .venv/bin/python flash11.py build/film11-silent.mp4"""
import subprocess, sys
import numpy as np
film = sys.argv[1] if len(sys.argv) > 1 else 'build/film11-silent.mp4'
w, h = 480, 270
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', film, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
n = len(raw) // (w * h)
fr = np.frombuffer(raw[:n * w * h], np.uint8).reshape(n, h, w).astype(np.float32)
d = lambda a, b: float(np.abs(fr[a] - fr[b]).mean())
hits = []
for i in range(1, n - 1):
    a, b, c = d(i, i - 1), d(i, i + 1), d(i - 1, i + 1)
    if a > 6 and b > 6 and c < min(a, b) / 3:
        hits.append((i, round(i / 25, 2), round(a, 1), round(b, 1), round(c, 1)))
print(n, 'frames;', len(hits), 'one-frame flashes')
for x in hits: print(x)

# every walkthrough window's playback speed, segment by segment
import shots11 as S_
from parts8 import Walk
for s in S_.build():
    L = s.t1 - s.t0
    for it in s.items:
        if isinstance(it, Walk) and it.seq is None:
            for (seg, dur) in zip(it.segs, it.seg_durs(L)):
                sp = (seg[1] - seg[0]) / dur
                if sp < 0.55 or sp > 1.4:
                    print(f'{s.name:12} {it.rec}:{it.dev} {seg[0]:7.2f}-{seg[1]:7.2f} over {dur:5.2f}s = {sp:5.2f}x')
