"""SC-237: the workspace app's real Command Center on the office monitor of the hero film's chapter 4.

Veo drew the monitor in final-4-office-dashboard.mp4 (SC-154) with a generic green dashboard. Its screen is found in
every frame (the pale and green pixels inside the black bezel, the component round the last frame's centre, its convex
hull cut to four corners, each side refitted through its own edge points), the corners are smoothed over time, and the
capture of the Command Center (capture.mjs, src/cc-<stage>.png) is warped onto it. The screen keeps the photo's own light
(its white balance and its falloff across the glass) and the clip's grain, and anything in front of the glass stays in
front: her pen and fingers are what is dark or skin-coloured inside the screen and reaches in from beyond its edge.

   uv run --with opencv-python-headless --with numpy --with scipy python tools/screen.py track
   uv run --with opencv-python-headless --with numpy --with scipy python tools/screen.py comp [stage]

track writes src/quads.json and src/track-*.jpg (the quad drawn on the frame); comp writes
media/final-4-office-command-center.mp4 and src/comp-*.jpg."""
import json, subprocess, sys
from pathlib import Path
import cv2, numpy as np

HERE = Path(__file__).resolve().parents[1]
CLIP = HERE.parent / 'SC-154' / 'media' / 'final-4-office-dashboard.mp4'
SRC = HERE / 'src'
OUT = HERE / 'media' / 'final-4-office-command-center.mp4'
ROI = (360, 330, 1060, 900)          # x0 y0 x1 y1: where the monitor is, over the whole clip
SEED = (745, 600)                    # inside the screen on the first frame


def frames():
    cap = cv2.VideoCapture(str(CLIP)); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(f)
    return out


def order(p):
    s, d = p.sum(1), p[:, 0] - p[:, 1]
    return np.float32([p[np.argmin(s)], p[np.argmax(d)], p[np.argmax(s)], p[np.argmin(d)]])


def screen_mask(f):
    """the glass: pale and unsaturated, or the dashboard's greens, and bright enough to be lit from behind"""
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).astype(np.int32)
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    pale = (S < 60) & (V > 150)
    green = (H > 30) & (H < 95) & (V > 90)
    return (pale | green).astype(np.uint8)


def side_fit(pts, a, b):
    """the line through the hull's points that lie along the side a→b"""
    d = b - a; L = np.linalg.norm(d); n = np.array([-d[1], d[0]]) / L
    t = ((pts - a) @ d) / L ** 2
    dist = np.abs((pts - a) @ n)
    sel = pts[(t > 0.08) & (t < 0.92) & (dist < 5)]
    if len(sel) < 6: return a, d / L
    vx, vy, x0, y0 = cv2.fitLine(sel.astype(np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    return np.array([x0, y0]), np.array([vx, vy])


def meet(l1, l2):
    (p, d), (q, e) = l1, l2
    m = np.array([[d[0], -e[0]], [d[1], -e[1]]])
    t = np.linalg.solve(m, q - p)
    return p + t[0] * d


def find_quad(f, seed):
    x0, y0, x1, y1 = ROI
    m = screen_mask(f)[y0:y1, x0:x1]
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    sx, sy = int(seed[0] - x0), int(seed[1] - y0)
    i = lab[sy, sx]
    if i == 0:   # the seed fell on something dark: the largest component near it
        cand = [(st[k, cv2.CC_STAT_AREA], k) for k in range(1, n)]
        i = max(cand)[1]
    comp = (lab == i).astype(np.uint8)
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    hull = cv2.convexHull(c)
    ap = None
    for eps in (0.01, 0.015, 0.02, 0.03, 0.045, 0.06):
        a = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)[:, 0].astype(np.float32)
        if len(a) == 4: ap = a; break
    if ap is None: ap = cv2.boxPoints(cv2.minAreaRect(hull)).astype(np.float32)
    q = order(ap)
    pts = hull[:, 0].astype(np.float32)
    # densify the hull's sides so each side has points to fit
    dense = []
    for k in range(len(pts)):
        a, b = pts[k], pts[(k + 1) % len(pts)]
        for t in np.linspace(0, 1, max(2, int(np.linalg.norm(b - a) / 2))): dense.append(a + (b - a) * t)
    dense = np.float32(dense)
    lines = [side_fit(dense, q[k], q[(k + 1) % 4]) for k in range(4)]
    q2 = np.float32([meet(lines[(k - 1) % 4], lines[k]) for k in range(4)])
    if np.abs(q2 - q).max() > 12: q2 = q
    return q2 + np.float32([x0, y0]), int(comp.sum())


GLARE = dict(u=0.97, v=0.11, r=0.11, a=0.17, bgr=(0.62, 0.86, 1.0))   # where, how wide, how strong, how warm
CLEAR = 64   # from this frame on her hand and pen are away from the glass


def robust_fit(y, deg=5):
    """a polynomial over time, refitted with the frames that stray from it weighted down"""
    t = np.arange(len(y)); w = np.ones(len(y))
    for _ in range(6):
        p = np.polyfit(t, y, deg, w=w); res = y - np.polyval(p, t)
        sd = np.median(np.abs(res)) * 1.5 + 1e-6; w = 1 / (1 + (res / (2 * sd)) ** 2)
    return np.polyval(p, t)


def settle(raw):
    """the corners over time. The left edge is never covered, so its corners are fitted as they are; the screen's width
    and slope change only with where the camera is, so each right corner is its left corner plus an offset fitted against
    that corner's position on the frames where nothing covers the glass, carried back through the frames her hand does"""
    q = np.zeros_like(raw)
    for c in (0, 3):
        for j in (0, 1): q[:, c, j] = robust_fit(raw[:, c, j])
    for right, left in ((1, 0), (2, 3)):
        x = q[CLEAR:, left, 0]
        for j in (0, 1):
            off = raw[CLEAR:, right, j] - raw[CLEAR:, left, j]
            a, b = np.polyfit(x, off, 1)
            q[:, right, j] = q[:, left, j] + a * q[:, left, 0] + b
    return q


def track():
    fs = frames()
    seed = SEED; raw = []; areas = []
    for f in fs:
        q, a = find_quad(f, seed)
        raw.append(q); areas.append(a)
        seed = tuple(q.mean(0))
    raw = np.float32(raw)
    sm = settle(raw)
    dev = np.abs(sm - raw).max(axis=(1, 2))
    SRC.mkdir(exist_ok=True)
    (SRC / 'quads.json').write_text(json.dumps({'raw': raw.round(2).tolist(), 'smooth': sm.round(2).tolist(),
                                                 'dev': dev.round(2).tolist(), 'area': areas}))
    print('frames', len(fs), 'max dev from smooth', round(float(dev.max()), 2), 'at', int(dev.argmax()))
    for k in (8, 30, 55, 80, 110, 140, 170):
        im = fs[k].copy()
        cv2.polylines(im, [raw[k].astype(np.int32)], True, (0, 0, 255), 1)
        cv2.polylines(im, [sm[k].astype(np.int32)], True, (0, 255, 0), 1)
        x0, y0, x1, y1 = ROI
        cv2.imwrite(str(SRC / f'track-{k:03d}.jpg'), cv2.resize(im[y0:y1, x0:x1], None, fx=1.5, fy=1.5))


def occluders(f, q):
    """what is in front of the glass: dark, skin or the sleeve's navy, inside the screen, reaching in from beyond it"""
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).astype(np.int32)
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    skin = ((H < 22) | (H > 165)) & (S > 70) & (V > 40)
    dark = V < 40                      # her pen is near black (its hue reads green)
    navy = (H > 100) & (H < 135) & (S > 50) & (V < 120)
    occ = (skin | dark | navy).astype(np.uint8)
    hgt, wid = occ.shape
    inside = np.zeros((hgt, wid), np.uint8)
    cv2.fillConvexPoly(inside, q.astype(np.int32), 1)
    core = cv2.erode(inside, np.ones((9, 9), np.uint8))
    near = cv2.dilate(inside, np.ones((41, 41), np.uint8))
    beyond = near & (1 - cv2.dilate(inside, np.ones((7, 7), np.uint8)))
    n, lab = cv2.connectedComponents(occ & near, 8)
    keep = np.zeros(n, bool)
    hit_core = np.unique(lab[(core > 0) & (lab > 0)])
    hit_out = set(np.unique(lab[(beyond > 0) & (lab > 0)]).tolist())
    for k in hit_core:
        if k in hit_out: keep[k] = True
    m = keep[lab].astype(np.float32) * inside
    # the pen's and fingers' edges, a pixel soft
    m = cv2.GaussianBlur(cv2.dilate(m, np.ones((3, 3), np.uint8)), (0, 0), 0.9)
    return np.clip(m, 0, 1), inside


def light_of(f, q, inside):
    """the glass's own light: its white (the brightest pale pixels) and a plane fitted to their brightness"""
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).astype(np.int32)
    core = cv2.erode(inside, np.ones((11, 11), np.uint8)) > 0
    pale = core & (hsv[..., 1] < 40) & (hsv[..., 2] > 170)
    ys, xs = np.nonzero(pale)
    if len(xs) < 200: return None, None
    px = f[ys, xs].astype(np.float32)
    white = np.percentile(px, 75, axis=0)
    lum = px.mean(1)
    A = np.c_[xs, ys, np.ones_like(xs)].astype(np.float32)
    coef, *_ = np.linalg.lstsq(A, lum, rcond=None)
    return white, coef


def comp(stage='8'):
    fs = frames()
    Q = np.float32(json.loads((SRC / 'quads.json').read_text())['smooth'])
    ui = cv2.imread(str(SRC / f'cc-{stage}.png')).astype(np.float32) / 255
    h, w = ui.shape[:2]
    # the desk lamp's warm reflection on the glass, in its top-right corner, as Veo lit the screen it drew
    vv, uu = np.mgrid[0:h, 0:w].astype(np.float32)
    d2 = ((uu / w - GLARE['u']) ** 2 + ((vv / h - GLARE['v']) * h / w) ** 2) / (2 * GLARE['r'] ** 2)
    glare = np.exp(-d2)[..., None] * np.float32(GLARE['bgr'])[None, None, :] * GLARE['a']
    rect = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    # one white balance and falloff for the whole shot (the light does not change), from the frames the pen is away
    whites, coefs = [], []
    for k in range(70, min(190, len(fs)), 6):
        mk = np.zeros(fs[k].shape[:2], np.uint8); cv2.fillConvexPoly(mk, Q[k].astype(np.int32), 1)
        wv, cf = light_of(fs[k], Q[k], mk)
        if wv is not None: whites.append(wv); coefs.append(cf)
    white = np.median(np.float32(whites), axis=0) / 255
    print('glass white (BGR)', (white * 255).round(1).tolist())
    rng = np.random.default_rng(237)
    tmp = SRC / 'comp'; tmp.mkdir(exist_ok=True)
    enc = subprocess.Popen(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                            '-s', f'{fs[0].shape[1]}x{fs[0].shape[0]}', '-r', '24', '-i', '-', '-c:v', 'libx264', '-preset',
                            'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUT)],
                           stdin=subprocess.PIPE)
    OUT.parent.mkdir(exist_ok=True)
    for k, f in enumerate(fs):
        q = Q[k]
        base = f.astype(np.float32) / 255
        M = cv2.getPerspectiveTransform(rect, q)
        warped = cv2.warpPerspective(ui, M, (f.shape[1], f.shape[0]), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
        cover = cv2.warpPerspective(np.ones((h, w), np.float32), M, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR)
        occ, inside = occluders(f, q)
        # the screen in the photo's light: its white balance, its falloff across the glass, a touch of glow and softness
        hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).astype(np.int32)
        yy, xx = np.mgrid[0:f.shape[0], 0:f.shape[1]].astype(np.float32)
        cf = np.median(np.float32(coefs), axis=0)
        cx, cy = q.mean(0)
        fall = (cf[0] * xx + cf[1] * yy + cf[2]) / (cf[0] * cx + cf[1] * cy + cf[2])
        fall = np.clip(fall, 0.82, 1.12)[..., None]
        gl = cv2.warpPerspective(glare, M, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR)
        scr = warped * white[None, None, :] * fall + gl
        scr = cv2.GaussianBlur(scr, (0, 0), 0.4)
        glow = cv2.GaussianBlur(scr * cover[..., None], (0, 0), 6) * 0.06
        grain = rng.normal(0, 1.6 / 255, scr.shape).astype(np.float32)
        a = (cover * (1 - occ))[..., None]
        out = base * (1 - a) + np.clip(scr + grain, 0, 1) * a
        out = np.clip(out + glow * (1 - a) * cv2.dilate(cover, np.ones((25, 25), np.uint8))[..., None], 0, 1)
        o8 = np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)
        enc.stdin.write(o8.tobytes())
        if k in (8, 20, 35, 50, 64, 90, 120, 142):
            x0, y0, x1, y1 = ROI
            cv2.imwrite(str(tmp / f'comp-{k:03d}.jpg'), np.hstack([f[y0:y1, x0:x1], o8[y0:y1, x0:x1]]), [cv2.IMWRITE_JPEG_QUALITY, 92])
            cv2.imwrite(str(tmp / f'occ-{k:03d}.png'), (occ[y0:y1, x0:x1] * 255).astype(np.uint8))
    enc.stdin.close(); enc.wait()
    print('wrote', OUT)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'track'
    if cmd == 'track': track()
    elif cmd == 'comp': comp(*(sys.argv[2:3] or ['8']))
    else: sys.exit(__doc__)
