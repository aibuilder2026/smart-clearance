"""SC-219 cut 11 (as cut 9): every frame a walkthrough window shows, scanned for the journey stage's own marks: its green note card
(BGR ~ (60, 98, 16)), its dimming spotlight, and its dark chapter chip in a screen's bottom-left corner.
  .venv/bin/python cardscan11.py"""
import subprocess, numpy as np
import shots12 as S_
from parts8 import Walk
from kit import REC, DEV
hits = []
for sh in S_.build():
    for it in sh.items:
        if not isinstance(it, Walk) or it.seq is not None: continue
        x, y, w, h = DEV[it.dev]
        for s in it.segs:
            a, b = s[0], s[1]
            p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-i', str(REC[it.rec]), '-t', str(b - a), '-vf',
                                f'fps=10,crop={w}:{h}:{x}:{y},scale={w//2}:{h//2}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
            n = (w // 2) * (h // 2) * 3
            for k in range(len(p) // n):
                f = np.frombuffer(p[k * n:(k + 1) * n], np.uint8).reshape(h // 2, w // 2, 3).astype(int)
                card = ((f[..., 0] > 45) & (f[..., 0] < 80) & (f[..., 1] > 84) & (f[..., 1] < 120) & (f[..., 2] < 40)).mean()
                corner = f[-40:, :140]                 # the chapter chip sits in the screen's bottom-left corner
                chip = ((corner.mean(axis=2) < 45)).mean()
                luma = f.mean()
                if card > 0.003 or chip > 0.25 or luma < 120:
                    hits.append((sh.name, it.rec, it.dev, round(a + k / 10, 1), round(card, 3), round(chip, 2), round(luma)))
for h_ in hits: print(h_)
print(len(hits), 'frames to look at')
