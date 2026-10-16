"""SC-228 (cut 17): a ring's own screen, as recorded. For a shot's ring (by index), the window's raw frame at a film
time u (default: the ring's start + 0.5 and its middle), with the ring's rect drawn and a 100-px grid labelled in the
screen's own pixels, so a rect can be measured where the content is. Writes build/ringsrc17/<shot>-<k>-<u>.jpg.

   .venv/bin/python ringsrc17.py <shot> <k> [u …] [--rect x,y,w,h]   (--rect: a rect to try instead of the ring's)"""
import sys, cv2, numpy as np
import shots13 as S_

OUT = S_.HERE / 'build' / 'ringsrc17'
OUT.mkdir(parents=True, exist_ok=True)
args = sys.argv[1:]
rect_over = None
if '--rect' in args:
    i = args.index('--rect'); rect_over = tuple(float(v) for v in args[i + 1].split(',')); del args[i:i + 2]
name, k = args[0], int(args[1])
us = [float(x) for x in args[2:]]
s = next(s for s in S_.build() if s.name == name)
L = s.t1 - s.t0
rings = [it for it in s.items if type(it).__name__ in ('Ring', 'RingCard')]
r = rings[k]
win = r.win
if not us: us = [r.u0 + 0.5, (r.u0 + min(r.u1, L)) / 2]
for u in us:
    i, t, _ = win.src_time(u, L)
    img = win.frame_at(i, t)
    img = (np.clip(img, 0, 1) * 255).astype(np.uint8) if img.dtype != np.uint8 else img.copy()
    if img.shape[2] == 4: img = img[..., :3]
    img = np.ascontiguousarray(img)
    h, w = img.shape[:2]
    for x in range(0, w, 100):
        cv2.line(img, (x, 0), (x, h), (0, 200, 255) if x % 500 else (0, 0, 255), 1)
        cv2.putText(img, str(x), (x + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 0, 255), 1, cv2.LINE_AA)
    for y in range(0, h, 100):
        cv2.line(img, (0, y), (w, y), (0, 200, 255) if y % 500 else (0, 0, 255), 1)
        cv2.putText(img, str(y), (2, y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 0, 255), 1, cv2.LINE_AA)
    x, y, rw, rh = rect_over or r.rect
    cv2.rectangle(img, (int(x), int(y)), (int(x + rw), int(y + rh)), (60, 220, 60), 3)
    p = OUT / f'{name}-{k}-{u:.2f}.jpg'
    cv2.imwrite(str(p), img, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(p.name, 'src', round(t, 2), 'seg', i, 'frame', w, 'x', h)
