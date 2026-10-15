"""SC-205: clean spans (no stage note card, no stage dim) of a device over a range: clean.py rec dev t0 t1"""
import subprocess, sys, numpy as np
from kit import REC, DEV
rec, dev, t0, t1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
x, y, w, h = DEV[dev]
p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t0), '-i', str(REC[rec]), '-t', str(t1 - t0), '-vf', f'fps=10,crop={w}:{h}:{x}:{y},scale={w//4}:{h//4}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
n = (w // 4) * (h // 4) * 3
card, bright = [], []
for k in range(len(p) // n):
    f = np.frombuffer(p[k * n:(k + 1) * n], np.uint8).reshape(h // 4, w // 4, 3).astype(int)
    card.append(((f[..., 0] > 45) & (f[..., 0] < 75) & (f[..., 1] > 84) & (f[..., 1] < 110) & (f[..., 2] < 34)).mean())
    bright.append(f.mean())
card, bright = np.array(card), np.array(bright)
ref = np.percentile(bright, 90)
bad = (card > 0.012) | ((bright < ref * 0.85) & (len(sys.argv) < 6))
spans, s = [], None
for i, b in enumerate(bad):
    if not b and s is None: s = i
    if b and s is not None: spans.append((t0 + s / 10, t0 + i / 10)); s = None
if s is not None: spans.append((t0 + s / 10, t0 + len(bad) / 10))
print(' '.join(f'{a:.1f}-{b:.1f}({b-a:.1f})' for a, b in spans if b - a >= 0.8))
