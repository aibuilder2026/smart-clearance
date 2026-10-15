"""SC-211: full-resolution stills of the v2 film at given times, with each shot's hand-over and glow as the render
draws them, to review: .venv/bin/python still11.py out_dir t1 t2 … (a contact sheet sheet.jpg beside them)"""
import sys
from pathlib import Path
import numpy as np, cv2
import kit, shots11 as S_, parts11 as P11
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
shots = S_.build()
names = []
for ts in sys.argv[2:]:
    t = float(ts)
    act = [s for s in shots if s.t0 <= t < s.t1] or [shots[-1]]
    a = np.zeros((kit.H, kit.W, 3), np.float32); act[0].draw(a, t)
    fa = P11.bloom(a, getattr(act[0], 'bloom', 0.0))
    if len(act) > 1:
        nxt = act[-1]
        b = np.zeros_like(a); nxt.draw(b, t)
        fb = P11.bloom(b, getattr(nxt, 'bloom', 0.0))
        p = min(1.0, max(0.0, (t - nxt.t0) / S_.XF))
        fa = P11.transition(getattr(nxt, 'xin', 'dissolve'), fa, fb, p, getattr(nxt, 'xopt', None))
    p_ = out / f't{t:07.2f}.jpg'
    cv2.imwrite(str(p_), np.clip(fa * 255 + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    names.append(p_)
    print(t, act[0].name, '->', act[-1].name if len(act) > 1 else '')
ims = [cv2.resize(cv2.imread(str(p)), (640, 360), interpolation=cv2.INTER_AREA) for p in names]
for p, im in zip(names, ims): cv2.putText(im, p.stem[1:], (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 220, 255), 2)
cols = 3
rows = [np.hstack(ims[i:i + cols] + [np.zeros_like(ims[0])] * (cols - len(ims[i:i + cols]))) for i in range(0, len(ims), cols)]
cv2.imwrite(str(out / 'sheet.jpg'), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
