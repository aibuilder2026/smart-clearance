"""SC-183's signatures as pen strokes: each signer's specimen scan (system/img/signatures, SC-174) thinned to its centre
line and traced into strokes, as a pad would record them, so the mockups can draw a signature live and replay it.
Every name and signature is fictional.
    uv run --with scikit-image --with pillow python design3/designs/SC-183/tools/strokes.py
writes design3/designs/SC-183/options/strokes.js (window.SC183_STROKES)
"""

import json
import pathlib

import numpy as np
from PIL import Image
from skimage.morphology import skeletonize

HERE = pathlib.Path(__file__).resolve().parent
SIGS = HERE.parents[2] / "system" / "img" / "signatures"
WHO = ["rakesh", "oce", "oce-w1", "oce-w2"]
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    n = np.hypot(*ab) or 1.0
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / n for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def trace(name):
    im = Image.open(SIGS / f"{name}.webp").convert("RGBA")
    a = np.array(im)[:, :, 3] > 90
    sk = skeletonize(a)
    h, w = sk.shape
    on = {(y, x) for y, x in zip(*np.nonzero(sk))}
    deg = {p: sum((p[0] + dy, p[1] + dx) in on for dy, dx in N8) for p in on}
    seen, strokes = set(), []
    # endpoints first, left to right, so a stroke starts where a pen would
    order = sorted(on, key=lambda p: (deg[p] != 1, p[1], p[0]))
    for start in order:
        if start in seen:
            continue
        path, cur, prev = [start], start, None
        seen.add(start)
        while True:
            nxt = [(cur[0] + dy, cur[1] + dx) for dy, dx in N8 if (cur[0] + dy, cur[1] + dx) in on and (cur[0] + dy, cur[1] + dx) not in seen]
            if not nxt:
                break
            if prev is not None:
                vy, vx = cur[0] - prev[0], cur[1] - prev[1]
                nxt.sort(key=lambda q: -((q[0] - cur[0]) * vy + (q[1] - cur[1]) * vx))
            else:
                nxt.sort(key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1]))
            prev, cur = cur, nxt[0]
            seen.add(cur)
            path.append(cur)
        if len(path) >= 6:
            strokes.append(rdp([(int(x), int(y)) for y, x in path], 0.9))
    strokes.sort(key=lambda s: min(p[0] for p in s))
    return {"w": w, "h": h, "strokes": strokes}


out = {n: trace(n) for n in WHO}
dest = HERE.parent / "options" / "strokes.js"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(
    "// SC-183: each signer's signature as pen strokes, traced from the specimen scans by tools/strokes.py (fictional)\n"
    f"window.SC183_STROKES = {json.dumps(out, separators=(',', ':'))};\n"
)
for n, s in out.items():
    print(n, len(s["strokes"]), "strokes", sum(len(x) for x in s["strokes"]), "points")
