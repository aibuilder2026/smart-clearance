"""SC-205, SC-206 (cut 4, cut 5, cut 6, cut 7: shots7): every frame a window shows, scanned for the stage's green note card (BGR ~ (60, 98, 16))
and its bright green ring (BGR ~ (128, 211, 52)); a segment is scanned on past its end by the 0.3 s it plays on through
the dissolve to the next (cut 4: a card fading in there had shown through)."""
import subprocess, numpy as np, shots7 as S_
from parts import Window
from kit import REC, DEV
hits = []
for sh in S_.build():
    L = sh.t1 - sh.t0
    for it in sh.items:
        win = getattr(it, 'win', None) if not isinstance(it, Window) else it
        if not isinstance(win, Window) or win.seq is not None or win is not it and type(it).__name__ != 'TiltIn': continue
        x, y, w, h = DEV[win.dev]
        for k_, s in enumerate(win.segs):
            a, b = s[0], s[1] + (0.3 if k_ < len(win.segs) - 1 else 0.0)
            p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-i', str(REC[win.rec]), '-t', str(b - a), '-vf', f'fps=10,crop={w}:{h}:{x}:{y},scale={w//2}:{h//2}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
            n = (w // 2) * (h // 2) * 3
            for k in range(len(p) // n):
                f = np.frombuffer(p[k * n:(k + 1) * n], np.uint8).reshape(h // 2, w // 2, 3).astype(int)
                card = ((f[..., 0] > 45) & (f[..., 0] < 75) & (f[..., 1] > 84) & (f[..., 1] < 110) & (f[..., 2] < 34)).mean()
                ring = ((f[..., 0] > 95) & (f[..., 0] < 160) & (f[..., 1] > 185) & (f[..., 2] > 25) & (f[..., 2] < 90)).mean()
                if card > 0.003 or ring > 0.0015: hits.append((sh.name, win.rec, win.dev, round(a + k / 10, 1), round(card, 3), round(ring, 4)))
for h_ in hits: print(h_)
print(len(hits), 'frames with a card or a ring')
