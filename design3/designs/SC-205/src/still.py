"""render single frames of the film to PNG: still.py <out_dir> t1 t2 ..."""
import sys, os, time
import numpy as np, cv2
import kit, shots as S_
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
shots = S_.build()
for ts in sys.argv[2:]:
    t = float(ts); t0 = time.time()
    act = [s for s in shots if s.t0 <= t < s.t1] or [shots[-1]]
    a = np.zeros((kit.H, kit.W, 3), np.float32); act[0].draw(a, t)
    if len(act) > 1:
        b = np.zeros_like(a); act[-1].draw(b, t); p = kit.ease_in_out((t - act[-1].t0) / S_.XF); a = a * (1 - p) + b * p
    cv2.imwrite(f'{out}/t{t:07.2f}.png', np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8))
    print(ts, [s.name for s in act], f'{time.time() - t0:.2f}s', flush=True)
