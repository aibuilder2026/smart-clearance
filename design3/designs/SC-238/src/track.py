"""SC-238: a new over-the-shoulder clip's blank screen, followed frame by frame, as SC-207's track3.py follows SC-206's
clips. In the first frame the screen is the largest bright, low-saturation, nearly rectangular region that does not
touch the frame's top (the overcast sky is bright too); in every later frame each of its four edges is fitted again as
a line through the region's boundary near where that edge was, over the middle of the edge only, so a thumb on an edge
or a corner does not move it; the corners are where the lines meet, then smoothed over time.

Out: build/track/<name>.json {size: [w, h], fps, quads: [[[x, y] × 4] a frame, clockwise from top-left]}, the format
screens.py reads.

   uv run --with numpy --with opencv-python-headless python track.py clips/x-film.mp4 [name] [--check]"""
import json, sys
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).resolve().parent


def order(p):
    """four points clockwise from the top-left"""
    p = np.asarray(p, np.float32).reshape(-1, 2)
    c = p.mean(0); ang = np.arctan2(p[:, 1] - c[1], p[:, 0] - c[0])
    p = p[np.argsort(ang)]                          # from the left, clockwise in image coordinates (y down)
    k = np.argmin(p.sum(1))                         # the top-left has the smallest x + y
    return np.roll(p, -k, axis=0)


def screen_mask(fr, v_min, s_max):
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] >= v_min) & (hsv[..., 1] <= s_max)).astype(np.uint8)
    return cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))


def first_quad(fr):
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    best = None
    for v_min in (225, 210, 195):
        m = screen_mask(fr, v_min, 40)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, n):
            x, y, w, h, a = st[i]
            if y <= 3 or a < 1500 or a / float(w * h) < 0.78: continue
            if best is None or a > best[1]: best = (lab == i, a)
        if best: break
    if best is None: raise SystemExit('no screen found in the first frame')
    cnt, _ = cv2.findContours(best[0].astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnt, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
    q = order(ap if len(ap) == 4 else cv2.boxPoints(cv2.minAreaRect(c)))
    vals = hsv[..., 2][best[0]]
    return q, float(np.percentile(vals, 5))


def refit(fr, q, v_min, band=14):
    """each edge again: the boundary points of the bright region within `band` px of the old edge, over the edge's middle
    60%, fitted as a line; the corners where neighbouring lines meet"""
    m = screen_mask(fr, v_min, 50)
    poly = np.zeros_like(m); cv2.fillConvexPoly(poly, np.int32(np.round(q)), 1)
    roi = cv2.dilate(poly, np.ones((2 * band + 1, 2 * band + 1), np.uint8))
    m = m & roi
    cnt, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnt: return q
    pts = max(cnt, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)
    lines = []
    for k in range(4):
        a, b = q[k], q[(k + 1) % 4]
        d = b - a; L = np.linalg.norm(d) + 1e-6; u = d / L; nrm = np.array([-u[1], u[0]])
        rel = pts - a; s = rel @ u; o = rel @ nrm
        sel = (s > 0.2 * L) & (s < 0.8 * L) & (np.abs(o) < band)
        if sel.sum() < 12: lines.append((a, u)); continue
        vx, vy, x0, y0 = cv2.fitLine(pts[sel], cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((np.array([x0, y0], np.float32), np.array([vx, vy], np.float32)))
    out = []
    for k in range(4):
        (p1, d1), (p2, d2) = lines[(k - 1) % 4], lines[k]
        A = np.array([d1, -d2]).T
        if abs(np.linalg.det(A)) < 1e-6: out.append(q[k]); continue
        t = np.linalg.solve(A, p2 - p1)
        out.append(p1 + t[0] * d1)
    nq = np.asarray(out, np.float32)
    if np.abs(nq - q).max() > 3 * band: return q        # (a bad fit: keep the last quad)
    return nq


def smooth(qs, r=3):
    qs = np.asarray(qs, np.float32); out = qs.copy()
    for i in range(len(qs)):
        a, b = max(0, i - r), min(len(qs), i + r + 1)
        w = np.exp(-0.5 * ((np.arange(a, b) - i) / (r / 1.5)) ** 2)
        out[i] = (qs[a:b] * w[:, None, None]).sum(0) / w.sum()
    return out


def main():
    src = Path(sys.argv[1]); name = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else src.stem
    cap = cv2.VideoCapture(str(src)); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
    while True:
        ok, fr = cap.read()
        if not ok: break
        frames.append(fr)
    q, v5 = first_quad(frames[0])
    v_min = max(150.0, v5 - 25)
    qs = [q]
    for fr in frames[1:]:
        q = refit(fr, q, v_min); qs.append(q)
    qs = smooth(qs)
    h, w = frames[0].shape[:2]
    out = HERE / 'build' / 'track' / f'{name}.json'; out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({'size': [w, h], 'fps': fps, 'quads': np.round(qs, 2).tolist()}))
    span = np.abs(qs - qs[0]).max(axis=(1, 2))
    print(f'{name}: {len(qs)} frames at {fps:.2f} fps, {w}×{h}; screen {np.round(qs[0]).astype(int).tolist()}; moves up to {span.max():.1f} px')
    if '--check' in sys.argv:          # every 12th frame with its quad drawn, for the eye
        sheet = []
        for i in range(0, len(frames), 12):
            f = frames[i].copy(); cv2.polylines(f, [np.int32(np.round(qs[i]))], True, (0, 0, 255), 2)
            sheet.append(cv2.resize(f, (w // 3, h // 3)))
        rows = [np.hstack(sheet[i:i + 4] + [np.zeros_like(sheet[0])] * (4 - len(sheet[i:i + 4]))) for i in range(0, len(sheet), 4)]
        cv2.imwrite(str(HERE / 'build' / 'track' / f'{name}-check.jpg'), np.vstack(rows))


if __name__ == '__main__':
    main()
