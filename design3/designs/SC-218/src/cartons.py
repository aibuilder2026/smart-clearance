"""SC-207: printed labels on the opening godown's cartons. The LTX clip (cut 4's o0-godown-aisle, stretched 1.2x) left
every carton's label blank: a pale, unsaturated rectangle set in cardboard. Each one is found in every frame, followed
through the dolly (and with the forklift's pallet), its corners smoothed over time and carried past the frame's edge,
and a Munchly shipper label is printed onto it: the brand's band and mark, the product, the batch and its best-before,
the carton's ITF-14. The label's ink is multiplied into the patch, so it takes the patch's own light, haze and softness,
and only lands on the patch's own pale pixels (a worker passing in front keeps his vest).

   .venv/bin/python cartons.py [--check]     writes clips/o0-godown-aisle-labelled.mp4 (and build/godown/check-*.jpg)"""
import sys, json, math, subprocess
from pathlib import Path
import cv2, numpy as np
from PIL import Image, ImageDraw
from scipy.signal import savgol_filter
from kit import HERE, font, draw_text, text_w

sys.path.insert(0, str(HERE.parents[2] / 'system' / 'labels'))
import codes   # design3/system/labels/codes.py: the GTINs and the ITF-14

SRC = HERE / 'clips' / 'o0-godown-aisle-slow.mp4'
OUT = HERE / 'clips' / 'o0-godown-aisle-labelled.mp4'
FR = HERE / 'build' / 'godown'
FW, FH = 1920, 1088

# the distributor's godown is Lakshmi Agencies' in Hyderabad: its two batches in the story (core/data.js)
BATCHES = {
    'mango': ('Mango Drink', '200 ml', 27, 'MF-2410-118', '24 OCT 2026', (226, 160, 22)),
    'poha': ('Instant Poha', '250 g', 20, 'MF-2410-402', '20 APR 2027', (96, 150, 64)),
}


# ---------------------------------------------------------------- the label

def munchly_mark(size):
    """Munchly's workspace mark (design3 kit.jsx WorkspaceMark): the orange squircle with a bite out of its corner, the
    white m; RGBA"""
    S = 4; n = size * S
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / S * 64 / size
    k = np.clip(((x - 6) * 52 + (y - 2) * 60) / (52 * 52 + 60 * 60), 0, 1)[..., None]
    c0, c1 = np.array([0xf6, 0x8d, 0x3e], np.float32), np.array([0xd6, 0x46, 0x1e], np.float32)
    rgb = c0 + (c1 - c0) * k
    m = Image.new('L', (n, n), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle([2 * n / 64, 2 * n / 64, 62 * n / 64, 62 * n / 64], radius=22 * n / 64, fill=255)
    for cx, cy, r in ((59, 5, 9), (47, 2.5, 5.5), (61.5, 17, 5.5)):
        d.ellipse([(cx - r) * n / 64, (cy - r) * n / 64, (cx + r) * n / 64, (cy + r) * n / 64], fill=0)
    ink = Image.new('L', (n, n), 0); di = ImageDraw.Draw(ink)
    w = int(6.6 * n / 64)
    for x0 in (18, 32):   # the m: two arches
        di.arc([x0 * n / 64, 26.5 * n / 64, (x0 + 14) * n / 64, 40.5 * n / 64], 180, 360, fill=255, width=w)
        di.line([x0 * n / 64, 33.5 * n / 64, x0 * n / 64, 45 * n / 64], fill=255, width=w)
        di.line([(x0 + 14) * n / 64, 33.5 * n / 64, (x0 + 14) * n / 64, 45 * n / 64], fill=255, width=w)
    for xx in (18, 46):
        di.ellipse([(xx - 3.3) * n / 64, (45 - 3.3) * n / 64, (xx + 3.3) * n / 64, (45 + 3.3) * n / 64], fill=255)
    a = np.asarray(m, np.float32) / 255
    i = np.asarray(ink, np.float32)[..., None] / 255
    out = np.dstack([rgb * (1 - i) + 255 * i, a * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA').resize((size, size), Image.LANCZOS)


def itf_bars(code):
    """the ITF-14's bars as (x, width) in its own units, and its total width, from codes.itf14_svg"""
    import re
    svg = codes.itf14_svg(code)
    bars = [(float(a), float(b)) for a, b in re.findall(r'<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height=', svg)
            if float(b) < 20]   # the bars, not the bearer frame round them
    width = float(re.search(r'viewBox="0 0 ([\d.]+)', svg).group(1))
    return bars, width


def shipper_label(sku, w=900, h=600):
    """a shipper carton's label as printed (RGB, the paper white): the brand's band with its mark, the product and the
    pack count, the batch and its best-before in a box, the carton's ITF-14 under them"""
    name, size, per, batch, bb, tint = BATCHES[sku]
    im = Image.new('RGB', (w, h), (255, 255, 255)); d = ImageDraw.Draw(im)
    band = 150
    d.rectangle([0, 0, w, band], fill=(226, 104, 34))
    mk = munchly_mark(112); im.paste(mk, (30, 19), mk)
    draw_text(d, (160, 22), 'MUNCHLY', 'b', 92, (255, 255, 255), 800)
    draw_text(d, (w - 30 - text_w('FOODS LTD', 'g', 30, 640, 0.08), 58), 'FOODS LTD', 'g', 30, (255, 236, 220), 640, 0.08)
    d.rectangle([0, band, w, band + 16], fill=tint)
    draw_text(d, (34, band + 34), name.upper(), 'b', 72, (24, 20, 16), 800)
    draw_text(d, (36, band + 122), f'{per} packs  ×  {size}', 'g', 40, (40, 34, 28), 560)
    # the batch and its date, boxed
    bx0, by0, bx1, by1 = 30, band + 190, 476, h - 28
    d.rectangle([bx0, by0, bx1, by1], outline=(24, 20, 16), width=6)
    draw_text(d, (bx0 + 22, by0 + 20), 'BATCH', 'g', 28, (60, 52, 44), 640, 0.06)
    draw_text(d, (bx0 + 22, by0 + 54), batch, 'g', 44, (20, 16, 12), 760)
    draw_text(d, (bx0 + 22, by0 + 120), 'BEST BEFORE ' + bb, 'g', 28, (20, 16, 12), 720)
    # the carton's ITF-14
    bars, bw = itf_bars(codes.gtin14(sku))
    gx0, gy0, gw, gh = 500, band + 196, w - 530, h - 28 - (band + 196) - 34
    k = gw / bw
    d.rectangle([gx0, gy0, gx0 + gw, gy0 + gh], outline=(20, 16, 12), width=7)
    for x, bwid in bars:
        d.rectangle([gx0 + x * k, gy0 + 9, gx0 + (x + bwid) * k, gy0 + gh - 9], fill=(20, 16, 12))
    code = codes.gtin14(sku)
    hum = f'{code[0]} {code[1:3]} {code[3:8]} {code[8:13]} {code[13]}'
    draw_text(d, (gx0 + gw / 2 - text_w(hum, 'g', 26, 600) / 2, gy0 + gh + 2), hum, 'g', 26, (20, 16, 12), 600)
    return np.asarray(im, np.float32)[..., ::-1] / 255   # BGR transmittance, 1 = paper


# ---------------------------------------------------------------- finding the blank labels

def detect(im):
    """[(quad 4x2 TL TR BR BL, centre, (w, h))] of the blank labels in a frame"""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    Hh, S, V = [hsv[..., i].astype(np.int32) for i in range(3)]
    # pale against its own cardboard: the haze and the dawn light warm the farther labels, so the test is relative
    Sl = cv2.blur(S.astype(np.float32), (41, 41))
    low = (((S < 62) | (S < np.minimum(80, Sl - 26))) & (V > 60)).astype(np.uint8)   # pale outright, or against it
    low = cv2.morphologyEx(low, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    card = ((S > np.minimum(75, Sl - 4)) & (S > 60) & (Hh >= 5) & (Hh <= 27)).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(low, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 20 or w < 5 or h < 5 or w > 260 or h > 200: continue
        if w / h < 0.28 or w / h > 2.8: continue
        comp = (lab[y:y + h, x:x + w] == i).astype(np.uint8)
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = (max(cnts, key=cv2.contourArea) + [x, y]).astype(np.float32)
        rect = cv2.minAreaRect(c)
        ra = rect[1][0] * rect[1][1]
        if ra <= 0 or a / ra < 0.70: continue
        pad = max(3, int(0.3 * min(w, h)))
        x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(im.shape[1], x + w + pad), min(im.shape[0], y + h + pad)
        ring = np.ones((y1 - y0, x1 - x0), np.uint8); ring[y - y0:y - y0 + h, x - x0:x - x0 + w] = 0
        if card[y0:y1, x0:x1][ring > 0].mean() < 0.45: continue
        q = quad_of(c, rect)
        out.append((q, q.mean(0), (w, h)))
    return out


def order(p):
    """four points as TL, TR, BR, BL"""
    s, d = p.sum(1), p[:, 0] - p[:, 1]
    return np.float32([p[np.argmin(s)], p[np.argmax(d)], p[np.argmax(s)], p[np.argmin(d)]])


def quad_of(c, rect):
    peri = cv2.arcLength(c, True)
    for eps in (0.04, 0.06, 0.09):
        ap = cv2.approxPolyDP(c, eps * peri, True)
        if len(ap) == 4: return order(ap[:, 0].astype(np.float32))
    return order(cv2.boxPoints(rect).astype(np.float32))


# ---------------------------------------------------------------- following them

def track(dets):
    """detections per frame into tracks: {id: {frame: quad}}, matched to each track's predicted centre"""
    tracks, active, nid = {}, {}, 0
    for k, ds in enumerate(dets):
        used = set()
        cand = []
        for tid, tr in active.items():
            fr = sorted(tr)
            last = tr[fr[-1]].mean(0)
            v = (last - tr[fr[-3]].mean(0)) / (fr[-1] - fr[-3]) if len(fr) >= 3 else np.zeros(2)
            pred = last + v * (k - fr[-1])
            size = np.ptp(tr[fr[-1]], axis=0).max()
            for j, (q, c, wh) in enumerate(ds):
                dist = np.linalg.norm(c - pred)
                if dist < max(5.0, 0.55 * size) and abs(max(wh) - size) < 0.45 * size + 4:
                    cand.append((dist, tid, j))
        taken = set()
        for dist, tid, j in sorted(cand):
            if tid in taken or j in used: continue
            active[tid][k] = ds[j][0]; taken.add(tid); used.add(j)
        for j, (q, c, wh) in enumerate(ds):
            if j in used: continue
            active[nid] = {k: q}; nid += 1
        for tid in list(active):
            if k - max(active[tid]) > 8:
                tracks[tid] = active.pop(tid)
    tracks.update(active)
    return tracks


def smooth(tr, n_frames):
    """a track's corners for every frame it is seen in or near: gaps filled, smoothed over time, and carried on past
    the frame's edge (or a lost detection) by the motion of its last frames"""
    fr = np.array(sorted(tr)); q = np.stack([tr[f] for f in fr])        # (n, 4, 2)
    k0, k1 = fr[0], fr[-1]
    ks = np.arange(k0, k1 + 1)
    # the dolly is one smooth move, so each corner's path is a low-order curve over the whole track: fitted, the frames
    # where a rack upright or the frame's edge clipped the label dropped as outliers, and fitted again
    deg = 1 if len(fr) < 8 else 2 if len(fr) < 30 else 3 if len(fr) < 80 else 4
    t = (fr - fr.mean()) / max(1.0, np.ptp(fr))
    good = np.ones(len(fr), bool)
    for _ in range(3):
        coef = [np.polyfit(t[good], q[good, c, a], deg) for c in range(4) for a in range(2)]
        fit = np.stack([np.polyval(cf, t) for cf in coef], 1).reshape(-1, 4, 2)
        res = np.linalg.norm(fit - q, axis=2).max(1)
        good = res <= max(1.2, 2.5 * np.median(res[good]))
        if good.sum() < deg + 3: good[:] = True; break
    tk = (ks - fr.mean()) / max(1.0, np.ptp(fr))
    full = np.stack([np.polyval(cf, tk) for cf in coef], 1).reshape(-1, 4, 2)
    def carry(ends, direction):
        nonlocal full, ks
        # on along its own tangent, so the path keeps its speed where the detections stop
        end, v = (full[-1], full[-1] - full[-2]) if direction > 0 else (full[0], full[0] - full[1])
        ext = []
        for j in range(1, 40):
            qq = end + v * j
            ext.append(qq)
            if direction > 0 and ks[-1] + j >= n_frames - 1: break
            if direction < 0 and ks[0] - j <= 0: break
            x0, y0 = qq.min(0); x1, y1 = qq.max(0)
            if x1 < 0 or y1 < 0 or x0 > FW or y0 > FH: break
        if direction > 0:
            full = np.concatenate([full, np.stack(ext)]); ks = np.arange(ks[0], ks[0] + len(full))
        else:
            full = np.concatenate([np.stack(ext[::-1]), full]); ks = np.arange(ks[0] - len(ext), ks[-1] + 1)
    if k1 < n_frames - 1: carry(k1, 1)
    if k0 > 0: carry(k0, -1)
    return dict(zip(ks.tolist(), full))


# ---------------------------------------------------------------- printing

def pale_mask(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    S, V = hsv[..., 1].astype(np.float32), hsv[..., 2].astype(np.float32)
    Sl = cv2.blur(S, (41, 41))
    m = np.maximum(np.clip((70 - S) / 14, 0, 1), np.clip((np.minimum(84, Sl - 20) - S) / 14, 0, 1)) * np.clip((V - 55) / 20, 0, 1)
    return cv2.GaussianBlur(m, (0, 0), 0.7)


def mips(tex):
    out = [tex]
    while out[-1].shape[1] > 40:
        t = out[-1]; out.append(cv2.resize(t, (t.shape[1] // 2, t.shape[0] // 2), interpolation=cv2.INTER_AREA))
    return out


def print_label(f, pale, q, levels):
    """the label's ink multiplied into frame f (float BGR) over the quad q, on the patch's own pale pixels"""
    x0, y0 = np.floor(q.min(0)).astype(int) - 2; x1, y1 = np.ceil(q.max(0)).astype(int) + 3
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(FW, x1), min(FH, y1)
    if x1 - x0 < 3 or y1 - y0 < 3: return
    size = np.ptp(q, axis=0).max()
    tex = levels[0]
    for t in levels:
        if t.shape[1] >= 2.2 * size: tex = t
    th, tw = tex.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [tw, 0], [tw, th], [0, th]]), (q - [x0, y0]).astype(np.float32))
    T = cv2.warpPerspective(tex, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1, 1))
    cov = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.fillConvexPoly(cov, np.round((q - [x0, y0]) * 16).astype(np.int32), 1.0, cv2.LINE_AA, shift=4)
    T = cv2.GaussianBlur(T, (0, 0), 0.55 if size > 40 else 0.75)
    # far labels sit in the haze: their ink is lighter
    k = 0.55 + 0.4 * min(1.0, size / 70)
    T = 1 - k * (1 - T)
    m = (cov * pale[y0:y1, x0:x1])[..., None]
    roi = f[y0:y1, x0:x1]
    roi *= (1 - m) + m * T


def main():
    check = '--check' in sys.argv
    if not (FR / 'f0000.png').exists():
        FR.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(SRC), '-start_number', '0', str(FR / 'f%04d.png')], check=True)
    files = sorted(FR.glob('f*.png'))
    n = len(files)
    frames = [cv2.imread(str(p)) for p in files]
    dets = [detect(im) for im in frames]
    tracks = track(dets)
    keep = {tid: tr for tid, tr in tracks.items() if len(tr) >= 10 or (len(tr) >= 6 and np.ptp(next(iter(tr.values())), axis=0).max() > 24)}
    def on_floor(tr):   # a pale reflection on the floor between the stacks is no label
        return any(c[1] > 0.74 * FH and 250 < c[0] < 1500 for c in (q.mean(0) for q in tr.values()))
    keep = {tid: tr for tid, tr in keep.items() if not on_floor(tr)}
    paths = {tid: smooth(tr, n) for tid, tr in keep.items()}
    # which label each carton carries: the pallet the camera dives into (its middle label at (1772, 577) in the film's
    # 1920 x 1080 frame, the clip's last frames) is the Mango Drink; a stack carries one batch
    last = {tid: p[max(p)] for tid, p in paths.items() if max(p) == n - 1}
    def sku_of(tid):   # one product a side of the aisle (the dolly never carries a label across it), so a carton whose
        # track was split keeps its label: the Mango Drink on the right, where the camera dives, the Poha on the left
        return 'mango' if paths[tid][min(paths[tid])].mean(0)[0] > FW / 2 else 'poha'
    seen = {tid: len(keep[tid]) for tid in paths}   # how many real detections each track has: the surer one prints
    labels = {s: mips(shipper_label(s)) for s in BATCHES}
    print(f'{n} frames, {sum(len(d) for d in dets)} detections, {len(tracks)} tracks, {len(keep)} kept', flush=True)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{FW}x{FH}', '-r', '24', '-i', '-',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt', 'yuv420p', str(OUT)], stdin=subprocess.PIPE)
    for k, im in enumerate(frames):
        f = im.astype(np.float32) / 255
        pale = pale_mask(im)
        done = []   # a label printed once: two tracks of one carton (split where it was lost) never both print
        for tid in sorted(paths, key=lambda t: -seen[t]):
            p = paths[tid]
            if k not in p: continue
            q = p[k]; c = q.mean(0); r = 0.5 * np.ptp(q, axis=0).max()
            if any(np.linalg.norm(c - c2) < 0.6 * max(r, r2) for c2, r2 in done): continue
            print_label(f, pale, q, labels[sku_of(tid)]); done.append((c, r))
        out = np.clip(f * 255 + 0.5, 0, 255).astype(np.uint8)
        enc.stdin.write(out.tobytes())
        if check and k in (0, 70, n - 1):
            cv2.imwrite(str(FR / f'check-{k:03d}.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 92])
    enc.stdin.close(); enc.wait()
    json.dump({str(t): {str(k): q.round(2).tolist() for k, q in p.items()} for t, p in paths.items()}, open(FR / 'tracks.json', 'w'))
    print('wrote', OUT)


if __name__ == '__main__':
    main()
