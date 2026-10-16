"""SC-228 (cut 17): every ring in the walkthrough, checked by eye. For each Ring (and RingCard) in each shot, a still at
the middle of its window (and at its start), labelled with the shot, the ring's index, its card's title, and the
window's source time, laid out on contact sheets in build/rings17/: a ring that lands on the wrong thing, overlaps
another, or crosses what it isn't about shows there.

   .venv/bin/python rings17.py [shot …]"""
import sys, cv2, numpy as np
from pathlib import Path
import shots13 as S_
from render13 import render_frame
from kit import W, H

OUT = S_.HERE / 'build' / 'rings17'
OUT.mkdir(parents=True, exist_ok=True)
shots = S_.build()
only = set(sys.argv[1:])
buf_a = np.zeros((H, W, 3), np.float32); buf_b = np.zeros((H, W, 3), np.float32)
tiles, rows = [], []
for s in shots:
    if only and s.name not in only: continue
    rings = [it for it in s.items if type(it).__name__ in ('Ring', 'RingCard')]
    for k, r in enumerate(rings):
        L = s.t1 - s.t0
        u1 = min(r.u1, L)
        for tag, u in (('start', r.u0 + 0.5), ('mid', (r.u0 + u1) / 2)):
            if u > u1: continue
            t = s.t0 + u
            fr = render_frame(shots, t, buf_a, buf_b)
            img = np.clip(fr * 255 + 0.5, 0, 255).astype(np.uint8)
            try:
                seg, src, _ = r.win.src_time(u, L) if hasattr(r.win, 'src_time') else (None, None, None)
            except Exception:
                seg, src = None, None
            lab = f'{s.name} #{k} {tag} t={t:.2f} u={u:.2f} [{r.u0:.2f}-{r.u1:.2f}] src={src if src is None else round(src, 2)}'
            small = cv2.resize(img, (960, 540), interpolation=cv2.INTER_AREA)
            cv2.rectangle(small, (0, 0), (960, 26), (0, 0, 0), -1)
            cv2.putText(small, lab, (8, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            tiles.append(small); rows.append(lab)
            print(lab, flush=True)
for i in range(0, len(tiles), 6):
    g = tiles[i:i + 6]
    while len(g) < 6: g.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(g[0:2]), np.hstack(g[2:4]), np.hstack(g[4:6])])
    cv2.imwrite(str(OUT / f'sheet-{i // 6:02d}.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
print(len(tiles), 'stills on', (len(tiles) + 5) // 6, 'sheets in', OUT)
