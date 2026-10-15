"""SC-206 cut 3: the effects that tie each person to their live screen.

- screen_quad / track: the blank white screen in a keyframe or an LTX frame, found as a quadrilateral (its four edges
  fitted as lines, so rounded corners and a thumb over an edge do not move it), tracked through a clip and smoothed.
- insert: the live app (a frame of the recording) set into that quad in perspective, under any finger over the screen.
- push / lift: the two ways a device comes into focus. push: the camera flies into the screen until the screen is the
  window (a homography of the whole frame, the room defocusing as it goes). lift: the room racks out of focus while the
  screen rises out of the device and settles as the window, on a spring.
Everything here is float BGR 0..1 at the output size.
"""
import json, math
from pathlib import Path
import cv2
import numpy as np
from kit import W, H, HERE, clamp, smooth, ease_out, ease_in_out, spring, col, over, rrect_alpha, shadow

# ---------------------------------------------------------------- finding the screen

def _order(pts):
    pts = np.asarray(pts, np.float32)
    s, d = pts.sum(1), pts[:, 0] - pts[:, 1]
    return np.float32([pts[np.argmin(s)], pts[np.argmax(d)], pts[np.argmax(s)], pts[np.argmin(d)]])  # tl tr br bl

def _intersect(l1, l2):
    (vx1, vy1, x1, y1), (vx2, vy2, x2, y2) = l1, l2
    a = np.array([[vx1, -vx2], [vy1, -vy2]], np.float64)
    b = np.array([x2 - x1, y2 - y1], np.float64)
    if abs(np.linalg.det(a)) < 1e-9: return None
    t = np.linalg.solve(a, b)[0]
    return (x1 + vx1 * t, y1 + vy1 * t)

def screen_mask(img, near=None):
    """bright, unsaturated pixels: the blank screen. near: a quad; only its neighbourhood is searched"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    v, s = hsv[..., 2].astype(np.int16), hsv[..., 1].astype(np.int16)
    m = ((v > 185) & (s < 42)).astype(np.uint8)
    if near is not None:
        roi = np.zeros_like(m)
        q = np.asarray(near, np.float32)
        c = q.mean(0)
        cv2.fillConvexPoly(roi, np.int32(c + (q - c) * 1.18), 1)
        m &= roi
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m

def _four(hull):
    """the hull simplified to four corners: the smallest tolerance that leaves four"""
    peri = cv2.arcLength(hull, True)
    for eps in np.linspace(0.01, 0.12, 45):
        ap = cv2.approxPolyDP(hull, eps * peri, True)
        if len(ap) == 4: return ap[:, 0, :].astype(np.float32)
    r = cv2.boxPoints(cv2.minAreaRect(hull))
    return r.astype(np.float32)

def _clockwise(c):
    """tl, tr, br, bl for a convex quad in any rotation: sorted round the centre, starting top-left"""
    c = np.asarray(c, np.float32)
    m = c.mean(0)
    ang = np.arctan2(c[:, 1] - m[1], c[:, 0] - m[0])
    c = c[np.argsort(ang)]  # clockwise on screen (y down), starting from the left
    k = np.argmin(c.sum(1))
    return np.roll(c, -k, axis=0)

def screen_quad(img, hint=None, near=None, min_area=900, cut=0):
    """the screen's four corners (tl, tr, br, bl) in image pixels, or None. hint: a point on the screen; near: last quad;
    cut: an opening (px) that breaks thin bridges to bright things touching the screen (a window, a white shirt)"""
    m = screen_mask(img, near)
    if cut: m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (cut, cut)))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(m, 8)
    pick = None
    if hint is not None:
        hx, hy = int(round(hint[0])), int(round(hint[1]))
        if 0 <= hy < lab.shape[0] and 0 <= hx < lab.shape[1] and lab[hy, hx] > 0: pick = lab[hy, hx]
        else:
            d = [np.hypot(*(cent[i] - hint)) if stats[i, cv2.CC_STAT_AREA] >= min_area else 1e9 for i in range(n)]
            d[0] = 1e9; pick = int(np.argmin(d)) if min(d) < 1e8 else None
    else:
        best = 0
        for i in range(1, n):
            a = stats[i, cv2.CC_STAT_AREA]
            if a < min_area: continue
            sc = a / (1 + (np.linalg.norm(cent[i] - np.asarray(near, np.float32).mean(0)) / 40 if near is not None else 0))
            if sc > best: best, pick = sc, i
    if pick is None: return None
    cnt, _ = cv2.findContours((lab == pick).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    best = max(cnt, key=cv2.contourArea)
    return grow(refine(best[:, 0, :].astype(np.float32), _clockwise(_four(cv2.convexHull(best)))), 1.6)


def refine(pts, corners):
    """a rough quad's four sides fitted again as lines to the contour points along each side's middle"""
    lines = []
    for k in range(4):
        a, b = corners[k], corners[(k + 1) % 4]
        ab = b - a; L = np.linalg.norm(ab)
        if L < 8: return np.float32(corners)
        u = ab / L; nrm = np.float32([-u[1], u[0]])
        t = (pts - a) @ u; d = np.abs((pts - a) @ nrm)
        sel = pts[(t > 0.15 * L) & (t < 0.85 * L) & (d < max(4.0, 0.04 * L))]
        if len(sel) < 6: lines.append((u[0], u[1], a[0], a[1])); continue
        vx, vy, x0, y0 = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((vx, vy, x0, y0))
    out = []
    for k in range(4):
        p = _intersect(lines[k - 1], lines[k])
        out.append(p if p is not None else corners[k])
    return _clockwise(out)


def grow(q, px):
    """the quad's edges moved outward by px: the mask stops a pixel or two inside the lit screen's anti-aliased edge"""
    q = np.asarray(q, np.float32)
    c = q.mean(0)
    out = []
    for k in range(4):
        a, b = q[k - 1], q[k]
        d = b - a; d /= max(1e-6, np.linalg.norm(d))
        n = np.float32([d[1], -d[0]])
        if (a - c) @ n < 0: n = -n
        out.append((a + n * px, d))
    res = []
    for k in range(4):
        (p1, d1), (p2, d2) = out[k], out[(k + 1) % 4]
        x = _intersect((d1[0], d1[1], p1[0], p1[1]), (d2[0], d2[1], p2[0], p2[1]))
        res.append(x if x is not None else q[k])
    # out[k] is the edge ending at corner k; the corner k is where edge k and edge k+1 meet
    return np.float32(res)

def track(clip, hint, first_quad=None, every=1, scale=1.0):
    """corners for every frame of a clip (list of 4x2), smoothed over time; frames where the screen is lost keep the
    last good corners"""
    cap = cv2.VideoCapture(str(clip))
    quads, prev, k = [], first_quad, 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        if scale != 1.0: fr = cv2.resize(fr, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
        q = screen_quad(fr, hint=(prev.mean(0) if prev is not None else hint), near=prev) if k % every == 0 else None
        if q is None or (prev is not None and np.abs(q - prev).max() > 0.06 * fr.shape[1]):
            q = prev
        quads.append(np.asarray(q, np.float32) if q is not None else None)
        prev = q if q is not None else prev; k += 1
    cap.release()
    good = next((q for q in quads if q is not None), None)
    quads = [q if q is not None else good for q in quads]
    arr = np.stack(quads).reshape(len(quads), 8)
    # smoothing: a centred 9-frame quadratic fit (Savitzky-Golay), done by hand
    win = 9 if len(arr) >= 9 else (len(arr) // 2) * 2 + 1
    if win >= 5:
        half = win // 2
        x = np.arange(-half, half + 1, dtype=np.float64)
        A = np.vander(x, 3)
        coef = np.linalg.pinv(A)[-1]  # the fitted value at the centre
        pad = np.pad(arr, ((half, half), (0, 0)), mode='edge')
        arr = np.stack([coef @ pad[i:i + win] for i in range(len(arr))])
    return arr.reshape(-1, 4, 2).astype(np.float32)

def save_track(path, quads, size):
    Path(path).write_text(json.dumps({'size': list(size), 'quads': np.round(quads, 2).tolist()}))

def load_track(path):
    d = json.loads(Path(path).read_text())
    return np.asarray(d['quads'], np.float32), tuple(d['size'])

# ---------------------------------------------------------------- setting the app into the screen

def occluders(frame_u8, quad):
    """within the quad, pixels that are not screen (a thumb, a finger), softened: 1 where the screen shows"""
    h, w = frame_u8.shape[:2]
    poly = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(poly, np.int32(np.round(quad * 4)), 255, lineType=cv2.LINE_AA, shift=2)
    hsv = cv2.cvtColor(frame_u8, cv2.COLOR_BGR2HSV)
    inside = poly > 127
    if inside.sum() < 50: return poly.astype(np.float32) / 255
    v, s = hsv[..., 2].astype(np.float32), hsv[..., 1].astype(np.float32)
    mv, ms = np.median(v[inside]), np.median(s[inside])
    scr = ((np.abs(v - mv) < 55) & (s < ms + 34)).astype(np.uint8)
    scr = cv2.morphologyEx(scr, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    scr = cv2.dilate(scr, np.ones((3, 3), np.uint8))
    # keep only occluders that touch the quad's edge (fingers come from outside); tiny islands are screen noise
    occ = ((scr == 0) & inside).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(occ, 8)
    edge = cv2.dilate((poly > 0).astype(np.uint8), np.ones((3, 3), np.uint8)) - cv2.erode((poly > 0).astype(np.uint8), np.ones((7, 7), np.uint8))
    keep = np.zeros_like(occ)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 60: continue
        if (edge[lab == i] > 0).any(): keep[lab == i] = 1
    m = (poly.astype(np.float32) / 255) * (1 - keep.astype(np.float32))
    return cv2.GaussianBlur(m, (0, 0), 0.8)

def warp_into(content, quad, size):
    """content (BGR float 0..1) warped onto quad (output px), at size (w, h); returns the warped image"""
    ch, cw = content.shape[:2]
    qw = max(np.linalg.norm(quad[1] - quad[0]), np.linalg.norm(quad[2] - quad[3]))
    qh = max(np.linalg.norm(quad[3] - quad[0]), np.linalg.norm(quad[2] - quad[1]))
    k = min(1.0, max(qw / cw, qh / ch) * 1.15)
    if k < 0.98:  # area-reduce first, so the perspective warp never minifies with point sampling
        content = cv2.resize(content, (max(2, round(cw * k)), max(2, round(ch * k))), interpolation=cv2.INTER_AREA)
        ch, cw = content.shape[:2]
    src = np.float32([[0, 0], [cw, 0], [cw, ch], [0, ch]])
    M = cv2.getPerspectiveTransform(src, np.float32(quad))
    return cv2.warpPerspective(content, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

def insert(frame, frame_u8, quad, content, glow=0.0):
    """the app set into the screen: frame is float BGR (output size), frame_u8 the same frame as uint8 for the matte;
    quad in output px. A faint share of the screen's own light stays, so reflections and shading carry over"""
    h, w = frame.shape[:2]
    m = occluders(frame_u8, quad)
    wc = warp_into(content, quad, (w, h))
    lum = cv2.cvtColor(frame_u8, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    shade = np.clip(lum / max(1e-3, float(np.median(lum[m > 0.5])) if (m > 0.5).any() else 1.0), 0.75, 1.08)[..., None]
    wc = wc * (0.92 + 0.08 * shade)
    if glow: wc = np.clip(wc * (1 + glow), 0, 1)
    m3 = m[..., None]
    frame *= (1 - m3)
    frame += wc * m3
    return m

# ---------------------------------------------------------------- bringing the device into focus

def rect_corners(x0, y0, x1, y1):
    return np.float32([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])

def push(frame, quad, rect, p, blur=16.0, dim=0.45):
    """the camera flies into the screen: at p=0 the frame as it is; at p=1 the screen fills rect exactly. The room is
    defocused progressively (the screen stays sharp) and dimmed towards the edges"""
    e = ease_in_out(p)
    if e <= 1e-4: return frame
    tgt = quad + (rect_corners(*rect) - quad) * e
    M = cv2.getPerspectiveTransform(np.float32(quad), np.float32(tgt))
    src = frame
    if blur * e > 0.3:
        bl = cv2.GaussianBlur(frame, (0, 0), blur * e)
        m = np.zeros(frame.shape[:2], np.float32)
        cv2.fillConvexPoly(m, np.int32(np.round(quad * 4)), 1.0, lineType=cv2.LINE_AA, shift=2)
        m = cv2.GaussianBlur(m, (0, 0), 1.2)[..., None]
        src = bl * (1 - m) + frame * m
    out = cv2.warpPerspective(src, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    if dim:
        mm = np.zeros((H, W), np.float32)
        cv2.fillConvexPoly(mm, np.int32(np.round(tgt * 4)), 1.0, lineType=cv2.LINE_AA, shift=2)
        mm = cv2.GaussianBlur(mm, (0, 0), 30)[..., None]
        out = out * (1 - dim * e * (1 - mm))
    return out

def lift(frame, quad, rect, content, p, blur=18.0, dim=0.5, r=14):
    """the room racks out of focus and dims while the screen rises out of the device and settles as the window. The
    screen plane follows a spring from the device's quad to rect, with a shadow that grows as it lifts"""
    e = ease_in_out(clamp(p * 1.4))
    out = frame
    if blur * e > 0.3: out = cv2.GaussianBlur(frame, (0, 0), blur * e)
    out = out * (1 - dim * e)
    q = clamp(spring(p * 0.9, zeta=0.82, w=7.5), 0, 1.04)
    tgt = quad + (rect_corners(*rect) - quad) * q
    x0, y0 = tgt[:, 0].min(), tgt[:, 1].min(); x1, y1 = tgt[:, 0].max(), tgt[:, 1].max()
    if q > 0.05: shadow(out, x0, y0, x1, y1, r, alpha=0.55 * min(1, q * 1.5), blur=40 * q + 6, dy=18 * q)
    wc = warp_into(content, tgt, (W, H))
    m = np.zeros((H, W), np.float32)
    cv2.fillConvexPoly(m, np.int32(np.round(tgt * 4)), 1.0, lineType=cv2.LINE_AA, shift=2)
    m = m[..., None]
    return out * (1 - m) + wc * m
