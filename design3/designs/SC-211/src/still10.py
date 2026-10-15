"""SC-210: full-resolution stills of the film at given times, to review: .venv/bin/python still10.py out_dir t1 t2 …"""
import sys
from pathlib import Path
import numpy as np, cv2
import kit, shots10 as S_
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
shots = S_.build()
for ts in sys.argv[2:]:
    t = float(ts)
    act = [s for s in shots if s.t0 <= t < s.t1] or [shots[-1]]
    a = np.zeros((kit.H, kit.W, 3), np.float32); act[0].draw(a, t)
    if len(act) > 1:
        b = np.zeros_like(a); act[-1].draw(b, t)
        p = kit.ease_in_out((t - act[-1].t0) / S_.XF); a = a * (1 - p) + b * p
    cv2.imwrite(str(out / f't{t:07.2f}.jpg'), np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(t, act[0].name)
