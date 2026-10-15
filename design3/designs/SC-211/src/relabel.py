"""SC-210: the real batch label printed onto the cartons of four reused Veo clips. Veo drew each carton's label from the
label maker's reference but garbled its fine print ("BATCH NO MF 0168-117", "BEST BEFORE 18/11/0005"), so each label is
found in a clean reference frame, followed through the clip by its plane (SIFT matches to the reference, a RANSAC
homography, the corners smoothed over time) and the batch's own label, as the label maker prints it, laid over it: its
ink multiplied into the original paper's own light (a normalized convolution over the paper's pixels), softened to the
clip's focus and given its grain, and kept off anything in front of it (the inspector's finger in v-hold: what differs
from the clean reference and reads as skin).

   .venv/bin/python relabel.py quads          the reference frames' labels found, build/relabel/ref-*.jpg
   .venv/bin/python relabel.py flat           the flat labels at each carton's own shape (label.py, relabel/flat.mjs)
   .venv/bin/python relabel.py run [name …]   clips/<name>-L.mp4 and build/relabel/check-<name>-*.jpg"""
import json, subprocess, sys
from pathlib import Path
import cv2, numpy as np
from scipy.signal import savgol_filter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
LABELS = ROOT / 'design3' / 'system' / 'labels'
OUT = HERE / 'build' / 'relabel'
UV = ['uv', 'run', '-q', '--with', 'segno', 'python']

# the story's two batches as their records have them (backend-api reference journey.json, skus)
BATCH = {'chips': {'sku': 'chips', 'batch': 'MF-2409-117', 'mfg': '2026-05-18', 'bestBefore': '2026-11-18', 'mrp': 30},
         'mango': {'sku': 'mango', 'batch': 'MF-2410-118', 'mfg': '2026-04-27', 'bestBefore': '2026-10-24', 'mrp': 20}}
# each clip: its batch, the frame its label is cleanest in, a point inside the label there, whether a hand can cover it,
# and the softness of the clip's focus on the label (Gaussian sigma, output px)
CLIPS = {'v-hold': dict(batch='chips', ref=-1, hint=(460, 760), occlude=True, soft=1.05,
                        quad=[(168, 452), (742, 468), (755, 975), (175, 997)]),
         'v-photo': dict(batch='chips', ref=0, hint=(707, 560), occlude=False, soft=1.0),
         'v-foodbank': dict(batch='mango', ref=0, hint=(1130, 830), occlude=False, soft=0.55),
         'v-paper': dict(batch='chips', ref=0, hint=(1640, 640), occlude=False, soft=1.1,
                         quad=[(1472, 486), (1815, 502), (1803, 795), (1468, 772)])}
# (v-hold's label sits under the pallet's cling film and v-paper's against a laptop's white screen, so their paper does
# not stand apart by colour: their corners are read off the reference frame by eye and each side snapped to its edge)


def frames(path):
    cap = cv2.VideoCapture(str(path)); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(f)
    return out


def order(p):
    s, d = p.sum(1), p[:, 0] - p[:, 1]
    return np.float32([p[np.argmin(s)], p[np.argmax(d)], p[np.argmax(s)], p[np.argmin(d)]])


def line_fit(pts):
    vx, vy, x0, y0 = cv2.fitLine(pts.astype(np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    return np.array([x0, y0]), np.array([vx, vy])


def meet(a, b):
    (p, d), (q, e) = a, b
    m = np.array([[d[0], -e[0]], [d[1], -e[1]]])
    t = np.linalg.solve(m, q - p)
    return p + t[0] * d


def find_quad(im, hint):
    """the label's paper as a quad (TL TR BR BL): the pale, unsaturated component round the hint, its holes (the ink, the
    bands) filled, each side refitted as a line through its own edge points"""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    S, V = hsv[..., 1].astype(np.int32), hsv[..., 2].astype(np.int32)
    x, y = hint
    v_ref = np.percentile(V[max(0, y - 150):y + 150, max(0, x - 250):x + 250], 92)
    paper = ((S < 60) & (V > 0.62 * v_ref)).astype(np.uint8)
    paper = cv2.morphologyEx(paper, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    cnts, _ = cv2.findContours(paper, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    best = None
    for c in cnts:
        if cv2.contourArea(c) < 3000: continue
        if cv2.pointPolygonTest(c, (float(x), float(y)), False) >= 0:
            if best is None or cv2.contourArea(c) > cv2.contourArea(best): best = c
    if best is None: raise SystemExit(f'no label round {hint}')
    c = best[:, 0].astype(np.float32)
    peri = cv2.arcLength(best, True)
    ap = None
    for eps in (0.02, 0.03, 0.045, 0.06, 0.08):
        a = cv2.approxPolyDP(best, eps * peri, True)
        if len(a) == 4: ap = order(a[:, 0].astype(np.float32)); break
    if ap is None: ap = order(cv2.boxPoints(cv2.minAreaRect(best)).astype(np.float32))
    # refit each side through the contour points near it
    lines = []
    for i in range(4):
        p0, p1 = ap[i], ap[(i + 1) % 4]
        d = p1 - p0; n = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-6)
        t = ((c - p0) @ d) / (d @ d)
        dist = np.abs((c - p0) @ n)
        sel = c[(t > 0.12) & (t < 0.88) & (dist < 6)]
        lines.append(line_fit(sel) if len(sel) > 10 else (p0, d / np.linalg.norm(d)))
    q = np.float32([meet(lines[3], lines[0]), meet(lines[0], lines[1]), meet(lines[1], lines[2]), meet(lines[2], lines[3])])
    return q


def refine_quad(im, q0, search=9):
    """each side of a quad read by eye snapped to the label's own edge: along the side, the strongest step from the
    paper (inside, brighter) to what is round it, within a few pixels of the line; a line fitted through them"""
    g = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.0)
    c = q0.mean(0)
    lines = []
    for i in range(4):
        p0, p1 = q0[i], q0[(i + 1) % 4]
        d = (p1 - p0) / np.linalg.norm(p1 - p0)
        n = np.array([-d[1], d[0]])
        if (c - p0) @ n < 0: n = -n            # n points into the label
        pts = []
        for t in np.linspace(0.1, 0.9, 40):
            b = p0 + t * (p1 - p0)
            offs = np.arange(-search, search + 1, 0.5)
            xs, ys = b[0] + offs * n[0], b[1] + offs * n[1]
            v = cv2.remap(g, xs.astype(np.float32)[None], ys.astype(np.float32)[None], cv2.INTER_LINEAR)[0]
            step = v[2:] - v[:-2]                  # brighter going inward
            j = int(np.argmax(step))
            if step[j] > 6: pts.append(b + offs[j + 1] * n)
        lines.append(line_fit(np.float32(pts)) if len(pts) > 8 else (p0, d))
    return np.float32([meet(lines[3], lines[0]), meet(lines[0], lines[1]), meet(lines[1], lines[2]), meet(lines[2], lines[3])])


def poly_mask(shape, q, grow=0.0):
    m = np.zeros(shape[:2], np.uint8)
    c = q.mean(0)
    cv2.fillPoly(m, [np.round(c + (q - c) * (1 + grow)).astype(np.int32)], 255)
    return m


def track(fr, r, q_r):
    """every frame's quad: the reference label's SIFT features matched in each frame (inside the last quad, grown), a
    RANSAC homography from the reference, refined by ECC on the label's own pixels; outliers bridged, corners smoothed"""
    sift = cv2.SIFT_create(nfeatures=6000, contrastThreshold=0.015)
    g_r = cv2.cvtColor(fr[r], cv2.COLOR_BGR2GRAY)
    kp_r, des_r = sift.detectAndCompute(g_r, poly_mask(g_r.shape, q_r, 0.06))
    pts_r = np.float32([k.pt for k in kp_r])
    bf = cv2.BFMatcher(cv2.NORM_L2)
    n = len(fr)
    Hs, inl = [None] * n, np.zeros(n)
    order_k = list(range(r, n)) + list(range(r - 1, -1, -1)) if r >= 0 else list(range(n))
    r = r % n
    order_k = list(range(r, n)) + list(range(r - 1, -1, -1))
    prev = {}
    for k in order_k:
        near = k - 1 if k > r else k + 1
        q_prev = q_r if k == r else cv2.perspectiveTransform(q_r[None], Hs[near])[0] if Hs[near] is not None else q_r
        g = cv2.cvtColor(fr[k], cv2.COLOR_BGR2GRAY)
        kp, des = sift.detectAndCompute(g, poly_mask(g.shape, q_prev, 0.25))
        if des is None or len(kp) < 12:
            continue
        mt = bf.knnMatch(des_r, des, k=2)
        good = [m for m, *rest in mt if rest and m.distance < 0.78 * rest[0].distance]
        if len(good) < 12: continue
        a = pts_r[[m.queryIdx for m in good]]
        b = np.float32([kp[m.trainIdx].pt for m in good])
        H, ok = cv2.findHomography(a, b, cv2.RANSAC, 2.0, maxIters=8000, confidence=0.999)
        if H is None: continue
        # ECC on the label's own pixels, from the SIFT estimate (sub-pixel)
        try:
            warp = H.astype(np.float32)
            crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-5)
            tmpl = cv2.GaussianBlur(g_r, (0, 0), 1.0).astype(np.float32)
            img = cv2.GaussianBlur(g, (0, 0), 1.0).astype(np.float32)
            # ECC maps template coordinates through the warp into the image: the reference into this frame
            _, warp = cv2.findTransformECC(tmpl, img, warp, cv2.MOTION_HOMOGRAPHY, crit, poly_mask(g_r.shape, q_r, 0.02), 3)
            H = warp.astype(np.float64)
        except cv2.error:
            pass
        Hs[k], inl[k] = H, ok.sum()
    q = np.full((n, 4, 2), np.nan, np.float32)
    for k in range(n):
        if Hs[k] is not None: q[k] = cv2.perspectiveTransform(q_r[None], Hs[k])[0]
    # bridge frames that failed or jumped, then smooth each corner over time
    ok = ~np.isnan(q[:, 0, 0])
    med = np.nanmedian(np.linalg.norm(np.diff(q, axis=0), axis=2).max(1)) if ok.sum() > 2 else 0
    for k in range(1, n - 1):
        if ok[k] and ok[k - 1] and ok[k + 1]:
            jump = np.linalg.norm(q[k] - (q[k - 1] + q[k + 1]) / 2, axis=1).max()
            if jump > max(2.5, 4 * med): ok[k] = False
    ks = np.arange(n)
    for c in range(4):
        for a in range(2):
            q[:, c, a] = np.interp(ks, ks[ok], q[ok, c, a])
    w = min(11, n - (1 - n % 2))
    if w >= 5:
        q = savgol_filter(q, w, 2, axis=0).astype(np.float32)
    return q, inl, ok


def flat_label(batch, aspect):
    """the batch's label as the label maker prints it, at this carton's own shape: BGR, the paper 1.0"""
    OUT.mkdir(parents=True, exist_ok=True)
    # the label's type is set in CSS pixels (label.py): a narrow carton's label is laid out wider than 880 px so its two
    # columns still fit, and a wide one shorter, so its middle doesn't open into an empty band
    h = 612 if aspect >= 1.6 else 640
    w = int(round(h * aspect))
    if w < 880: w, h = 880, int(round(880 / aspect))
    key = f'{batch}-{w}x{h}'
    png = OUT / f'flat-{key}.png'
    if not png.exists():
        spec = {**BATCH[batch], 'w': w, 'h': h, 'pad': 22}
        sp, html = OUT / f'flat-{key}.json', OUT / f'flat-{key}.html'
        sp.write_text(json.dumps(spec))
        subprocess.run([*UV, str(LABELS / 'label.py'), str(sp), str(html)], check=True)
        jobs = OUT / f'flat-{key}-jobs.json'
        jobs.write_text(json.dumps([{'html': str(html), 'png': str(png), 'w': w, 'h': h}]))
        subprocess.run(['node', str(HERE / 'relabel' / 'flat.mjs'), str(jobs)], check=True)
    im = cv2.imread(str(png)).astype(np.float32) / 255
    return im


def occluder(fr_k, ref_warped, lab_mask):
    """what stands in front of the label in this frame: far from the clean reference there, and skin-coloured, in blobs
    big enough to be a hand; grown a little and feathered"""
    d = np.abs(fr_k.astype(np.int16) - ref_warped.astype(np.int16)).max(2)
    hsv = cv2.cvtColor(fr_k, cv2.COLOR_BGR2HSV)
    Hh, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    skin = (Hh >= 4) & (Hh <= 24) & (S >= 45) & (S <= 190) & (V >= 60)
    m = ((d > 40) & skin & (lab_mask > 0)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 120: keep[lab == i] = 1
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    keep = cv2.dilate(keep, np.ones((5, 5), np.uint8))
    return cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 1.6)


def composite(fr, q, F, soft, occ=None, rng=None):
    """the flat label F into the quad q of frame fr: its ink multiplied into the original paper's light, softened to the
    clip's focus, given the clip's grain, kept off anything in front"""
    Hh, Ww = fr.shape[:2]
    x0, y0 = np.floor(q.min(0)).astype(int) - 6
    x1, y1 = np.ceil(q.max(0)).astype(int) + 6
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(Ww, x1), min(Hh, y1)
    if x1 <= x0 or y1 <= y0: return fr
    qw = max(np.linalg.norm(q[1] - q[0]), np.linalg.norm(q[2] - q[3]))
    qh = max(np.linalg.norm(q[3] - q[0]), np.linalg.norm(q[2] - q[1]))
    fh, fw = F.shape[:2]
    s = min(1.0, 1.6 * qw / fw)
    Fs = cv2.resize(F, (max(8, int(fw * s)), max(8, int(fh * s))), interpolation=cv2.INTER_AREA) if s < 1 else F
    sh, sw = Fs.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), (q - [x0, y0]).astype(np.float32))
    bw, bh = x1 - x0, y1 - y0
    lab = cv2.warpPerspective(Fs, M, (bw, bh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1, 1))
    msk = cv2.warpPerspective(np.ones((sh, sw), np.float32), M, (bw, bh), flags=cv2.INTER_LINEAR)
    lab = cv2.GaussianBlur(lab, (0, 0), soft)
    msk = cv2.GaussianBlur(msk, (0, 0), 0.45)
    patch = fr[y0:y1, x0:x1].astype(np.float32) / 255
    hsv = cv2.cvtColor(fr[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    inside = cv2.erode((msk > 0.98).astype(np.uint8), np.ones((5, 5), np.uint8))
    vv = hsv[..., 2][inside > 0]
    v_ref = np.percentile(vv, 90) if vv.size else 200
    paper = ((hsv[..., 1] < 60) & (hsv[..., 2] > 0.72 * v_ref) & (inside > 0)).astype(np.uint8)
    paper = cv2.erode(paper, np.ones((3, 3), np.uint8)).astype(np.float32)
    sig = max(4.0, qh / 9)
    num = cv2.GaussianBlur(patch * paper[..., None], (0, 0), sig)
    den = cv2.GaussianBlur(paper, (0, 0), sig)[..., None]
    pm = (patch * paper[..., None]).sum((0, 1)) / max(1.0, paper.sum())
    P = num / np.maximum(den, 1e-5)
    wgt = np.clip(den / 0.2, 0, 1)
    P = P * wgt + pm * (1 - wgt)
    new = lab * P
    # the clip's grain, measured on its own paper
    hp = patch - cv2.GaussianBlur(patch, (0, 0), 1.2)
    g = float(np.sqrt((hp ** 2 * paper[..., None]).sum() / max(1.0, 3 * paper.sum())))
    if rng is not None and g > 0:
        new = new + rng.normal(0, g, new.shape[:2])[..., None].astype(np.float32) * 0.35
    a = msk[..., None]
    if occ is not None: a = a * (1 - occ[y0:y1, x0:x1][..., None])
    out = patch * (1 - a) + new * a
    fr = fr.copy()
    fr[y0:y1, x0:x1] = np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)
    return fr


def draw_quad(im, q, col=(0, 255, 255)):
    im = im.copy()
    cv2.polylines(im, [np.round(q).astype(np.int32)], True, col, 1, cv2.LINE_AA)
    for p in q: cv2.circle(im, tuple(np.round(p).astype(int)), 3, (0, 0, 255), -1)
    return im


def quads():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {}
    for name, cf in CLIPS.items():
        fr = frames(HERE / 'clips' / f'{name}.mp4')
        r = cf['ref'] % len(fr)
        q = refine_quad(fr[r], np.float32(cf['quad'])) if 'quad' in cf else find_quad(fr[r], cf['hint'])
        w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
        h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
        res[name] = {'ref': int(r), 'quad': q.astype(float).round(2).tolist(), 'aspect': round(float(w / h), 3)}
        cv2.imwrite(str(OUT / f'ref-{name}.jpg'), draw_quad(fr[r], q))
        print(name, 'frame', r, 'aspect', round(w / h, 3), q.round(1).tolist())
    (OUT / 'quads.json').write_text(json.dumps(res, indent=1))


def run(names):
    Q = json.loads((OUT / 'quads.json').read_text())
    for name in names:
        cf, qd = CLIPS[name], Q[name]
        fr = frames(HERE / 'clips' / f'{name}.mp4')
        r, q_r = qd['ref'], np.float32(qd['quad'])
        q, inl, ok = track(fr, r, q_r)
        print(name, len(fr), 'frames; inliers min', int(inl[ok].min()) if ok.any() else 0, 'median', int(np.median(inl)), 'bridged', int((~ok).sum()))
        (OUT / f'track-{name}.json').write_text(json.dumps(q.astype(float).round(3).tolist()))
        F = flat_label(cf['batch'], qd['aspect'])
        rng = np.random.default_rng(210)
        out = HERE / 'clips' / f'{name}-L.mp4'
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{fr[0].shape[1]}x{fr[0].shape[0]}',
                              '-r', '24', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', str(out)],
                             stdin=subprocess.PIPE)
        g_r = fr[r]
        checks = {0, len(fr) // 3, 2 * len(fr) // 3, len(fr) - 1}
        for k, f in enumerate(fr):
            occ = None
            if cf['occlude']:
                Hk = cv2.getPerspectiveTransform(q_r, q[k])
                ref_w = cv2.warpPerspective(g_r, Hk, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR)
                occ = occluder(f, ref_w, poly_mask(f.shape, q[k], 0.0))
            g = composite(f, q[k], F, cf['soft'], occ, rng)
            p.stdin.write(g.tobytes())
            if k in checks:
                x0, y0 = np.floor(q[k].min(0)).astype(int) - 60
                x1, y1 = np.ceil(q[k].max(0)).astype(int) + 60
                x0, y0 = max(0, x0), max(0, y0)
                crop = np.hstack([f[y0:y1, x0:x1], g[y0:y1, x0:x1]])
                cv2.imwrite(str(OUT / f'check-{name}-{k:03d}.jpg'), crop)
        p.stdin.close(); p.wait()
        side = {'source': f'clips/{name}.mp4 (see its own sidecar)', 'post': (
            'relabel.py: the label Veo drew with garbled fine print replaced by the batch\'s own label as the label maker prints it '
            '(design3/system/labels/label.py), tracked through the clip by SIFT matches to a clean reference frame, a RANSAC homography '
            'refined by ECC and smoothed over time; the ink multiplied into the original paper\'s light, softened to the clip\'s focus '
            f'(sigma {cf["soft"]} px) and given its grain' + ('; kept off the hand in front of it' if cf['occlude'] else '')),
            'batch': BATCH[cf['batch']], 'model': 'none (compositing)', 'cost_usd': 0}
        (HERE / 'clips' / f'{name}-L.prompt.json').write_text(json.dumps(side, indent=1))
        print('made', out.name)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'quads': quads()
    elif cmd == 'flat':
        Q = json.loads((OUT / 'quads.json').read_text())
        for name, cf in CLIPS.items(): flat_label(cf['batch'], Q[name]['aspect'])
    elif cmd == 'run': run(sys.argv[2:] or list(CLIPS))
    else: print(__doc__)
