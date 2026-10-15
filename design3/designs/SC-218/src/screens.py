"""SC-206: the blank screen in each over-the-shoulder keyframe (1920 x 1080), found as the largest bright,
unsaturated, screen-shaped quad (vfx.screen_quad), drawn on an overlay for checking: build/screens.json.
   .venv/bin/python screens.py s-priya s-kirana …"""
import json, sys
from pathlib import Path
import cv2, numpy as np
import vfx

HERE = Path(__file__).resolve().parent
OUT = HERE / 'build' / 'screens.json'
known = json.loads(OUT.read_text()) if OUT.exists() else {}
# where to look, by eye, where the widest bright patch is not the screen (a window, the sky, a van door, a white shirt);
# 's-upi-phone' is the second screen in its frame
BOX = {'s-kirana': (1060, 400, 1420, 850), 's-neha': (830, 300, 1660, 900), 's-agrawal': (1240, 480, 1580, 930),
       's-meera': (930, 520, 1180, 890), 's-landfill-photo': (660, 380, 1150, 800), 's-upi-phone': (650, 500, 880, 840),
       's-landfill-sign': (760, 690, 1060, 990), 's-priya-eve': (960, 380, 1700, 900)}
CUT = {'s-kirana': 15, 's-neha': 21, 's-agrawal': 15}
for k in sys.argv[1:]:
    src = k.replace('-phone', '')
    p = HERE / 'img' / f'{src}-L.png'
    if not p.exists(): p = HERE / 'img' / f'{src}.png'
    im = cv2.imread(str(p))
    if im.shape[1] != 1920: im = cv2.resize(im, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)
    m = vfx.screen_mask(im)
    if CUT.get(k): m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CUT[k], CUT[k])))
    if k in BOX:
        x0, y0, x1, y1 = BOX[k]
        keep = np.zeros_like(m); keep[y0:y1, x0:x1] = 1; m = m & keep
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    best, score = None, 0
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < 4000: continue
        w, h = st[i, cv2.CC_STAT_WIDTH], st[i, cv2.CC_STAT_HEIGHT]
        fill = a / float(w * h)
        s = a * fill ** 2
        if s > score: best, score = i, s
    hint = tuple(map(float, cen[best]))
    q = vfx.screen_quad(im, hint=hint, cut=CUT.get(k, 0), near=None if k not in BOX else np.float32([[BOX[k][0], BOX[k][1]], [BOX[k][2], BOX[k][1]], [BOX[k][2], BOX[k][3]], [BOX[k][0], BOX[k][3]]]))
    known[k] = {'hint': [round(hint[0], 1), round(hint[1], 1)], 'quad': np.round(q, 2).tolist()}
    vis = im.copy(); cv2.polylines(vis, [np.int32(np.round(q))], True, (0, 0, 255), 3)
    cv2.imwrite(str(HERE / 'build' / f'_screen-{k}.jpg'), cv2.resize(vis, (960, 540)))
    print(k, known[k]['hint'])
OUT.write_text(json.dumps(known, indent=1))
