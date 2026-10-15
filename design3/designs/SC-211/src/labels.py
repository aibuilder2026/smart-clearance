"""SC-206 cut 3: the real carton labels on the film's cartons. The keyframes give every carton a blank white sticker;
this finds each sticker (a bright, unsaturated quadrilateral of a label's proportions) and prints the batch's own label
(the label maker's, design3/system/labels, rendered by label-png.mjs and read back) onto it in perspective, multiplied
into the sticker so the carton's light, shade and grain carry over.   .venv/bin/python labels.py img/o1b-carton-macro.png"""
import sys
from pathlib import Path
import cv2
import numpy as np
import vfx

HERE = Path(__file__).resolve().parent
LABEL = {'mango': HERE / 'build' / 'labels' / 'MF-2410-118.png', 'chips': HERE / 'build' / 'labels' / 'MF-2409-117.png'}


def stickers(img, min_area=250, max_area=None, aspect=(1.05, 2.6), avoid=()):
    """every blank sticker in the image: [(quad tl tr br bl, area)], largest first"""
    # white-balanced first (the brightest tenth made neutral), so a sticker under dusk or warm light still reads white
    f = img.astype(np.float32)
    lum = f.mean(2)
    top = lum >= np.percentile(lum, 90)
    gain = f[top].mean(0)
    wb = np.clip(f * (gain.mean() / np.maximum(gain, 1)), 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(wb, cv2.COLOR_BGR2HSV)
    v, s = hsv[..., 2].astype(np.int16), hsv[..., 1].astype(np.int16)
    # whiteness: bright and unsaturated, against the warm brown of the carton around it (shade and warm light vary,
    # so it is judged against its own neighbourhood)
    wh = np.clip(v - 2.2 * s, 0, 255).astype(np.uint8)
    m = cv2.adaptiveThreshold(wh, 1, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 61, -24) & (wh > 70).astype(np.uint8)
    m |= ((v > 150) & (s < 46)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    hue = hsv[..., 0].astype(np.int16)
    brown = ((hue >= 4) & (hue <= 28) & (s > 38) & (v > 40)).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    out = []
    max_area = max_area or img.shape[0] * img.shape[1] * 0.25
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < min_area or a > max_area: continue
        cnt, _ = cv2.findContours((lab == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cnt, key=cv2.contourArea)
        hull = cv2.convexHull(c)
        if cv2.contourArea(c) / max(1.0, cv2.contourArea(hull)) < 0.85: continue
        q = vfx.refine(c[:, 0, :].astype(np.float32), vfx._clockwise(vfx._four(hull)))
        w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
        h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
        r = max(w, h) / max(1.0, min(w, h))
        if not (aspect[0] <= r <= aspect[1]) or min(w, h) < 16: continue
        if abs(cv2.contourArea(q) - a) / a > 0.2: continue
        # a sticker sits on a carton: most of a thin ring round it is brown cardboard
        # a sticker sits on a carton: the band just outside it is cardboard all round, darker than the sticker but not
        # black, and not a saturated blue (a screen's bezel is black, a shirt is as light as the sticker, a sky is blue)
        c0 = q.mean(0)
        inner = np.zeros_like(m); cv2.fillConvexPoly(inner, np.int32(c0 + (q - c0) * 0.8), 1)
        vs = float(np.median(v[inner > 0])) if inner.any() else 255.0
        pad = max(4.0, 0.08 * min(w, h))
        ok = True
        for k in range(4):
            a_, b_ = q[k], q[(k + 1) % 4]
            mid = (a_ + b_) / 2
            nrm = mid - c0; nrm /= max(1e-6, np.linalg.norm(nrm))
            band = np.zeros_like(m)
            p0, p1 = a_ + (a_ - c0) * 0.02, b_ + (b_ - c0) * 0.02
            cv2.fillConvexPoly(band, np.int32([p0 + nrm * 3, p1 + nrm * 3, p1 + nrm * (3 + pad), p0 + nrm * (3 + pad)]), 1)
            if band.sum() == 0: ok = False; break
            vb, sb, hb = (float(np.median(x[band > 0])) for x in (v, s, hue))
            if not (0.28 * vs < vb < 0.93 * vs): ok = False; break
        if not ok: continue
        cx_, cy_ = q.mean(0)
        if any(x0 - 8 <= cx_ <= x1 + 8 and y0 - 8 <= cy_ <= y1 + 8 for x0, y0, x1, y1 in avoid): continue
        out.append((q, a))
    out.sort(key=lambda x: -x[1])
    return out


def print_label(img, quad, which='mango', margin=0.06, blur=None, upright=False):
    """the label printed onto the sticker's quad, inset by a margin, multiplied into the sticker's own light.
    upright: on a sticker standing taller than wide, the label stays the right way up, centred on the white sticker"""
    lab = cv2.imread(str(LABEL[which])).astype(np.float32) / 255
    q = np.asarray(quad, np.float32)
    w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
    h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    if h > w * 1.05 and upright:   # the label the right way up, on the sticker's white above and below it
        ch_ = int(round(lab.shape[1] * h / w))
        canvas = np.ones((ch_, lab.shape[1], 3), np.float32)
        y0_ = (ch_ - lab.shape[0]) // 2
        canvas[y0_:y0_ + lab.shape[0]] = lab
        lab = canvas
    elif h > w * 1.05:  # a sticker standing upright: the label turned to fit it
        lab = cv2.rotate(lab, cv2.ROTATE_90_CLOCKWISE)
    c = q.mean(0)
    qi = c + (q - c) * (1 - margin)
    hh, ww = img.shape[:2]
    k = min(1.0, max(w / lab.shape[1], h / lab.shape[0]) * 1.4)
    small = cv2.resize(lab, (max(2, int(lab.shape[1] * k)), max(2, int(lab.shape[0] * k))), interpolation=cv2.INTER_AREA)
    src = np.float32([[0, 0], [small.shape[1], 0], [small.shape[1], small.shape[0]], [0, small.shape[0]]])
    M = cv2.getPerspectiveTransform(src, qi)
    warped = cv2.warpPerspective(small, M, (ww, hh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1, 1))
    mask = np.zeros((hh, ww), np.float32)
    cv2.fillConvexPoly(mask, np.int32(np.round(qi * 4)), 1.0, lineType=cv2.LINE_AA, shift=2)
    base = img.astype(np.float32) / 255
    # the sticker's light: its own luminance relative to its brightest, so shading and texture stay
    lum = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
    inside = mask > 0.5
    ref = np.percentile(lum[inside], 92) if inside.any() else 1.0
    light = np.clip(lum / max(1e-3, ref), 0.55, 1.05)[..., None]
    if blur is None:
        # the label takes the focus of the carton it is on, measured on the sticker's own edge: the brightness step
        # across it over its steepest slope is the edge's width (an ideal step is ~1 px; a defocused one 2.5 sigma)
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        full = np.zeros((hh, ww), np.uint8)
        cv2.fillConvexPoly(full, np.int32(np.round(q)), 1)
        k_ = max(3, int(min(w, h) * 0.12)) | 1
        inner = cv2.erode(full, np.ones((k_, k_), np.uint8)); outer = cv2.dilate(full, np.ones((k_, k_), np.uint8)) - full
        edge = cv2.dilate(full, np.ones((5, 5), np.uint8)) - cv2.erode(full, np.ones((5, 5), np.uint8))
        if inner.any() and outer.any() and edge.any():
            step = max(8.0, float(np.median(g[inner > 0]) - np.median(g[outer > 0])))
            gm = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1)) / 4.0
            peak = max(1.0, float(np.percentile(gm[edge > 0], 85)))
            width = step / peak
        else:
            width = 1.0
        sharp = float(np.clip((width - 0.8) / 2.5, 0.35, 5.0))
    else:
        sharp = blur
    warped = cv2.GaussianBlur(warped, (0, 0), sharp)
    out = base * (1 - mask[..., None]) + (warped * light) * mask[..., None]
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)


def label_all(img, which="mango", limit=40, min_area=250, avoid=()):
    for q, a in stickers(img, min_area=min_area, avoid=avoid)[:limit]:
        img = print_label(img, q, which)
    return img


if __name__ == '__main__':
    p = Path(sys.argv[1]); which = sys.argv[2] if len(sys.argv) > 2 else 'mango'
    img = cv2.imread(str(p))
    st = stickers(img)
    print(len(st), 'stickers', [round(a) for _, a in st[:12]])
    vis = img.copy()
    for q, a in st[:12]: cv2.polylines(vis, [np.int32(q)], True, (0, 0, 255), 2)
    cv2.imwrite(str(HERE / 'build' / f'_stickers-{p.stem}.jpg'), vis)
    cv2.imwrite(str(HERE / 'build' / f'_labelled-{p.stem}.jpg'), label_all(img, which))


def candidates(img, min_area=150):
    """every sticker-like shape (loose: no cardboard test), for picking by eye: [(quad, area)] in reading order"""
    f = img.astype(np.float32)
    lum = f.mean(2)
    top = lum >= np.percentile(lum, 90)
    gain = f[top].mean(0)
    wb = np.clip(f * (gain.mean() / np.maximum(gain, 1)), 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(wb, cv2.COLOR_BGR2HSV)
    v, s = hsv[..., 2].astype(np.int16), hsv[..., 1].astype(np.int16)
    wh = np.clip(v - 2.0 * s, 0, 255).astype(np.uint8)
    m = cv2.adaptiveThreshold(wh, 1, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 81, -16) & (wh > 55).astype(np.uint8)
    m |= ((v > 140) & (s < 52)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < min_area or a > img.shape[0] * img.shape[1] * 0.06: continue
        cnt, _ = cv2.findContours((lab == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cnt, key=cv2.contourArea)
        hull = cv2.convexHull(c)
        if cv2.contourArea(c) / max(1.0, cv2.contourArea(hull)) < 0.8: continue
        q = vfx.refine(c[:, 0, :].astype(np.float32), vfx._clockwise(vfx._four(hull)))
        w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
        h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
        if max(w, h) / max(1.0, min(w, h)) > 3.2 or min(w, h) < 12: continue
        if abs(cv2.contourArea(q) - a) / a > 0.3: continue
        out.append((q, a))
    out.sort(key=lambda x: (round(x[0].mean(0)[1] / 120), x[0].mean(0)[0]))
    return out


def show_candidates(img, path):
    vis = img.copy()
    cs = candidates(img)
    for i, (q, a) in enumerate(cs):
        cv2.polylines(vis, [np.int32(q)], True, (0, 0, 255), 2)
        c = q.mean(0)
        cv2.putText(vis, str(i), (int(c[0]) - 10, int(c[1]) + 8), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
    cv2.imwrite(str(path), vis)
    return cs


def in_box(img, box):
    """the sticker inside a hand-drawn box (x0, y0, x1, y1): the box's brightest, least saturated blob, Otsu-split"""
    x0, y0, x1, y1 = box
    crop = img[y0:y1, x0:x1].astype(np.float32)
    hsv = cv2.cvtColor(crop.astype(np.uint8), cv2.COLOR_BGR2HSV)
    wh = np.clip(hsv[..., 2].astype(np.float32) - 1.6 * hsv[..., 1], 0, 255).astype(np.uint8)
    _, m = cv2.threshold(wh, 0, 1, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n < 2: return None
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    cnt, _ = cv2.findContours((lab == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnt, key=cv2.contourArea)
    q = vfx.refine(c[:, 0, :].astype(np.float32), vfx._clockwise(vfx._four(cv2.convexHull(c))))
    return q + np.float32([x0, y0])


def label_map(quad, margin=0.06):
    """the homography from the label's own layout (CSS px, 860 x 640) to the image, for a landscape sticker"""
    q = np.asarray(quad, np.float32)
    c = q.mean(0)
    qi = c + (q - c) * (1 - margin)
    return cv2.getPerspectiveTransform(np.float32([[0, 0], [860, 0], [860, 640], [0, 640]]), qi)
