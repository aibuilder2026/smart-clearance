"""The label maker (SC-147): find the blank sticker in a base photo, as the four corners of its quadrilateral, so compose.mjs can warp a
label onto it in perspective. The sticker is the largest bright, low-saturation region; its corners are the region's
extreme points along the two diagonals, refined to the hull.

    uv run --with numpy --with pillow --with scipy python design3/system/labels/quad.py <base.png> [...]
prints one JSON line per photo: {"base", "w", "h", "quad": [[x, y] top-left, top-right, bottom-right, bottom-left],
"aspect"}
"""

from __future__ import annotations

import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def sticker(path: str) -> dict:
    img = Image.open(path).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255
    mx, mn = a.max(axis=2), a.min(axis=2)
    lum = a.mean(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    # bright and nearly grey: the sticker, not the brown board (board ~0.45 saturation, paper ~0.03)
    mask = (lum > 0.4) & (sat < 0.15)
    mask = ndimage.binary_opening(mask, iterations=3)
    # eroded, so a bright window or a white wall behind the carton no longer bridges onto the sticker; a region that
    # touches the frame's edge is background, never the sticker
    core = ndimage.binary_erosion(mask, iterations=10, border_value=1)
    lab, n = ndimage.label(core)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    keep = [(sizes[i - 1], i) for i in range(1, n + 1) if i not in border]
    if not keep:
        raise SystemExit(f"{path}: no sticker found")
    region = ndimage.binary_fill_holes(ndimage.binary_dilation(lab == max(keep)[1], iterations=10) & mask)
    ys, xs = np.nonzero(region)
    pts = np.stack([xs, ys], axis=1).astype(np.float64)
    s, d = pts.sum(axis=1), pts[:, 0] - pts[:, 1]
    tl, br = pts[np.argmin(s)], pts[np.argmax(s)]
    tr, bl = pts[np.argmax(d)], pts[np.argmin(d)]
    quad = [tl, tr, br, bl]
    width = (np.linalg.norm(tr - tl) + np.linalg.norm(br - bl)) / 2
    height = (np.linalg.norm(bl - tl) + np.linalg.norm(br - tr)) / 2
    share = region.sum() / region.size
    return {
        "base": path,
        "w": img.width,
        "h": img.height,
        "quad": [[round(float(x), 1), round(float(y), 1)] for x, y in quad],
        "aspect": round(float(width / height), 3),
        "share": round(float(share), 3),
    }


if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(json.dumps(sticker(p)))
