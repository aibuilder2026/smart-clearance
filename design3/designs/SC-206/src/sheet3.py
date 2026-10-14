"""SC-206: a contact sheet of every shot (three moments each), for checking layout and timing.
   .venv/bin/python sheet3.py out.jpg [shot names…]"""
import sys, time
import numpy as np, cv2
import shots4 as S

out = sys.argv[1]; only = set(sys.argv[2:])
rows = []
for sh in S.build():
    if only and sh.name not in only: continue
    L = sh.t1 - sh.t0 - S.XF
    tiles = []
    for fr in (0.2, 0.55, 0.9):
        t = sh.t0 + L * fr
        f = np.zeros((1080, 1920, 3), np.float32)
        t0 = time.time(); sh.draw(f, t)
        im = cv2.resize((np.clip(f, 0, 1) * 255).astype(np.uint8), (640, 360), interpolation=cv2.INTER_AREA)
        cv2.putText(im, f'{sh.name} {t - sh.t0:.1f}s', (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        tiles.append(im)
    rows.append(np.hstack(tiles))
    print(sh.name, flush=True)
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 82])
