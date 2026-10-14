"""SC-205, SC-206 (cut 3, shots3): every frame a window shows, scanned for the stage's green note card (BGR ~ (60, 98, 16))."""
import subprocess, numpy as np, shots3 as S_
from parts import Window
from kit import REC, DEV
hits = []
for sh in S_.build():
    L = sh.t1 - sh.t0
    for it in sh.items:
        if not isinstance(it, Window) or it.seq is not None: continue
        x, y, w, h = DEV[it.dev]
        for s in it.segs:
            a, b = s[0], s[1]
            p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-i', str(REC[it.rec]), '-t', str(b - a), '-vf', f'fps=10,crop={w}:{h}:{x}:{y},scale={w//2}:{h//2}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
            n = (w // 2) * (h // 2) * 3
            for k in range(len(p) // n):
                f = np.frombuffer(p[k * n:(k + 1) * n], np.uint8).reshape(h // 2, w // 2, 3).astype(int)
                m = (f[..., 0] > 45) & (f[..., 0] < 75) & (f[..., 1] > 84) & (f[..., 1] < 110) & (f[..., 2] < 34)
                fr = m.mean()
                if fr > 0.003: hits.append((sh.name, it.rec, it.dev, round(a + k / 10, 1), round(fr, 3)))
for h_ in hits: print(h_)
print(len(hits), 'frames with a card')
