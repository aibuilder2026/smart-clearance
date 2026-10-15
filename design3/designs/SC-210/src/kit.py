"""SC-205: the compositor's parts. Everything is placed in float output pixels and drawn anti-aliased, so a camera
move is smooth to the sub-pixel and a still frame is pixel-exact: no integer rounding of sizes from frame to frame
(SC-200's shake), and no screen is drawn larger than its source's pixels (SC-200's blur)."""
import math, os, subprocess
from functools import lru_cache
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REPO = Path('/Users/arundutta/projects/smart-clearance')
VIDS = REPO / 'playwright-automation-videos'
W, H, FPS = 1920, 1080, 25
REC = {
    'mango': VIDS / 'munchly-mango-e2e-prod-2026-10-13_09-09-12.mp4',
    'sad': VIDS / 'munchly-chips-sad-e2e-prod-2026-10-13_11-07-40.mp4',
    'admin': VIDS / 'admin-console-walk-prod-2026-10-13_12-16-11.mp4',
}
# the device screens on the 2560 x 1440 stage, measured by brightness (measure.py), inset 2 px off their edges
DEV = {'P': (40, 182, 1078, 746), 'L': (1176, 182, 846, 1218), 'H': (2076, 180, 448, 974), 'A': (40, 182, 1928, 1202)}
RADIUS = {'P': 14, 'L': 14, 'H': 28, 'A': 10}

# design system v3 (system/tokens.css), night
C = dict(bg=(7, 11, 9), surface=(16, 22, 19), surface2=(20, 27, 23), line=(38, 52, 45), ink=(236, 243, 239),
         ink2=(170, 188, 178), ink3=(122, 140, 130), g300=(115, 201, 157), g400=(63, 176, 123), g500=(31, 149, 99),
         g600=(23, 124, 82), g700=(23, 107, 78), g800=(18, 81, 58), g900=(14, 60, 43), g950=(7, 38, 26),
         amber=(242, 180, 55), amber2=(247, 192, 74), red=(229, 92, 74), ring=(52, 211, 128))

# ---------------------------------------------------------------- easing

def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def smooth(x):  # smootherstep
    x = clamp(x)
    return x * x * x * (x * (x * 6 - 15) + 10)

def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3

def ease_in_out(x):
    return smooth(x)

def spring(x, zeta=0.72, w=11.0):
    """a critically-damped-ish spring from 0 to 1 over x seconds"""
    if x <= 0: return 0.0
    wd = w * math.sqrt(max(1e-6, 1 - zeta * zeta))
    return 1 - math.exp(-zeta * w * x) * (math.cos(wd * x) + zeta * w / wd * math.sin(wd * x))

def ramp(t, a, b):  # 0 before a, 1 after b, smooth between
    return smooth((t - a) / max(1e-6, b - a))

def fade(t, t0, t1, fin=0.35, fout=0.35):
    return min(ramp(t, t0, t0 + fin) if fin else 1.0, 1 - ramp(t, t1 - fout, t1) if fout else 1.0)

# ---------------------------------------------------------------- fonts and text

FB, FG = str(HERE / 'fonts' / 'Bricolage.ttf'), str(HERE / 'fonts' / 'Geist.ttf')
FS = '/System/Library/Fonts/SFNS.ttf'
MISSING = set('₹→−✓×·₂')

@lru_cache(maxsize=None)
def font(kind, size, wght=400):
    f = ImageFont.truetype({'b': FB, 'g': FG, 's': FS}[kind], size)
    try:
        if kind == 'b': f.set_variation_by_axes([min(96, max(12, size)), wght, 100])
        elif kind == 'g': f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f

def _runs(text, kind):
    """split text into runs the font has, and runs drawn in SF Pro (₹, →, − are not in the design system's subsets)"""
    out, cur, cur_k = [], '', None
    for ch in text:
        k = 's' if ch in MISSING and kind != 's' else kind
        if k != cur_k and cur:
            out.append((cur, cur_k)); cur = ''
        cur += ch; cur_k = k
    if cur: out.append((cur, cur_k))
    return out

def text_w(text, kind, size, wght=400, track=0.0):
    w = 0.0
    for run, k in _runs(text, kind):
        f = font(k, size, wght if k != 's' else min(wght, 700))
        w += f.getlength(run) + track * size * len(run)
    return w

def draw_text(d, xy, text, kind, size, fill, wght=400, track=0.0):
    x, y = xy
    for run, k in _runs(text, kind):
        f = font(k, size, wght if k != 's' else min(wght, 700))
        if track:
            for ch in run:
                d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch) + track * size
        else:
            d.text((x, y), run, font=f, fill=fill); x += f.getlength(run)
    return x

def wrap(text, kind, size, wght, width):
    words, lines, cur = text.split(' '), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if text_w(t, kind, size, wght) <= width or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

# ---------------------------------------------------------------- sprites (premultiplied float32 RGBA, 0..1)

def to_sprite(im):
    a = np.asarray(im.convert('RGBA'), dtype=np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    return np.ascontiguousarray(a[..., [2, 1, 0, 3]])  # BGRA premultiplied

def blit(frame, spr, x, y, alpha=1.0, scale=1.0, ox=0.0, oy=0.0):
    """composite a premultiplied BGRA sprite at float (x, y) (its point (ox, oy) lands there), scaled about that point"""
    if alpha <= 0.002: return
    h, w = spr.shape[:2]
    sx, sy = x - ox * scale, y - oy * scale
    x0, y0 = max(0, int(math.floor(sx)) - 1), max(0, int(math.floor(sy)) - 1)
    x1, y1 = min(W, int(math.ceil(sx + w * scale)) + 1), min(H, int(math.ceil(sy + h * scale)) + 1)
    if x1 <= x0 or y1 <= y0: return
    if scale == 1.0 and sx == int(sx) and sy == int(sy):
        ix, iy = int(sx), int(sy)
        a0, b0 = max(0, -ix), max(0, -iy)
        sub = spr[b0:b0 + (y1 - max(0, iy)), a0:a0 + (x1 - max(0, ix))]
        roi = frame[max(0, iy):max(0, iy) + sub.shape[0], max(0, ix):max(0, ix) + sub.shape[1]]
    else:
        M = np.float32([[scale, 0, sx - x0], [0, scale, sy - y0]])
        sub = cv2.warpAffine(spr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR if scale >= 0.999 else cv2.INTER_AREA,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        roi = frame[y0:y1, x0:x1]
    if sub.size == 0: return
    roi *= (1 - sub[..., 3:4] * alpha)
    roi += sub[..., :3] * alpha

def over(frame, x0, y0, rgb, a):
    """composite a straight-alpha patch (rgb float 0..1 BGR, a 0..1) at integer (x0, y0)"""
    h, w = a.shape
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if cx1 <= cx0 or cy1 <= cy0: return
    a_ = a[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0, None]
    rgb_ = rgb if np.ndim(rgb) == 1 else rgb[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
    roi = frame[cy0:cy1, cx0:cx1]
    roi *= (1 - a_)
    roi += np.asarray(rgb_, dtype=np.float32) * a_

def col(rgb):
    r, g, b = rgb
    return np.array([b / 255, g / 255, r / 255], dtype=np.float32)

# ---------------------------------------------------------------- signed distances

def sdf_rrect(px, py, x0, y0, x1, y1, r):
    cx, cy, hx, hy = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    qx, qy = np.abs(px - cx) - hx + r, np.abs(py - cy) - hy + r
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r

def grid(x0, y0, x1, y1):
    xs = np.arange(x0, x1, dtype=np.float32) + 0.5
    ys = np.arange(y0, y1, dtype=np.float32) + 0.5
    return np.meshgrid(xs, ys)

def rrect_alpha(x0, y0, x1, y1, r, pad=2, top_r=None):
    """anti-aliased coverage of a rounded rect in output space; returns (ix0, iy0, alpha). top_r: radius of the top corners"""
    ix0, iy0 = int(math.floor(x0)) - pad, int(math.floor(y0)) - pad
    ix1, iy1 = int(math.ceil(x1)) + pad, int(math.ceil(y1)) + pad
    px, py = grid(ix0, iy0, ix1, iy1)
    d = sdf_rrect(px, py, x0, y0, x1, y1, r)
    if top_r is not None and top_r != r:
        d2 = sdf_rrect(px, py, x0, y0, x1, y1, top_r)
        d = np.where(py < (y0 + y1) / 2, d2, d)
    return ix0, iy0, np.clip(0.5 - d, 0, 1).astype(np.float32)

def shadow(frame, x0, y0, x1, y1, r, alpha=0.55, blur=46, dy=22):
    ix0, iy0 = int(x0 - blur * 1.6), int(y0 - blur * 1.6 + dy)
    ix1, iy1 = int(x1 + blur * 1.6), int(y1 + blur * 1.6 + dy)
    px, py = grid(max(0, ix0), max(0, iy0), min(W, ix1), min(H, iy1))
    if px.size == 0: return
    d = sdf_rrect(px, py, x0 + 6, y0 + dy, x1 - 6, y1 + dy, r)
    a = alpha * (1 - np.clip((d + blur * 0.25) / blur, 0, 1)) ** 2
    over(frame, max(0, ix0), max(0, iy0), np.zeros(3, np.float32), a.astype(np.float32))

def ring(frame, x0, y0, x1, y1, r, prog=1.0, alpha=1.0, color=None, width=3.2, glow=True):
    """a highlight ring drawn on from its top-left corner clockwise (prog 0..1), with a soft glow"""
    if alpha <= 0.002 or prog <= 0: return
    color = col(color or C['ring'])
    pad = 18
    ix0, iy0, ix1, iy1 = int(x0) - pad, int(y0) - pad, int(x1) + pad + 1, int(y1) + pad + 1
    cx0, cy0, cx1, cy1 = max(0, ix0), max(0, iy0), min(W, ix1), min(H, iy1)
    px, py = grid(cx0, cy0, cx1, cy1)
    d = np.abs(sdf_rrect(px, py, x0, y0, x1, y1, r))
    a = np.clip(width / 2 + 0.5 - d, 0, 1)
    if glow: a = np.maximum(a, 0.38 * np.exp(-((d / 7.0) ** 2)))
    if prog < 1:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ang = (np.arctan2(py - cy, px - cx) - math.atan2(y0 - cy, x0 - cx)) % (2 * math.pi)
        a = a * np.clip((prog * 2 * math.pi - ang) / 0.08, 0, 1)
    halo = np.clip(width / 2 + 2.5 - d, 0, 1) * 0.55  # a white halo under the ring so it reads on any screen
    over(frame, cx0, cy0, np.ones(3, np.float32), (halo * alpha * (a > 0)).astype(np.float32))
    over(frame, cx0, cy0, color, (a * alpha).astype(np.float32))

def line(frame, p0, p1, color, alpha=1.0, width=2.0, dot=True):
    if alpha <= 0.002: return
    x0, y0 = min(p0[0], p1[0]) - 8, min(p0[1], p1[1]) - 8
    x1, y1 = max(p0[0], p1[0]) + 8, max(p0[1], p1[1]) + 8
    ix0, iy0, ix1, iy1 = max(0, int(x0)), max(0, int(y0)), min(W, int(x1) + 1), min(H, int(y1) + 1)
    px, py = grid(ix0, iy0, ix1, iy1)
    ax, ay, bx, by = *p0, *p1
    vx, vy = bx - ax, by - ay
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / max(1e-6, vx * vx + vy * vy), 0, 1)
    d = np.hypot(px - (ax + t * vx), py - (ay + t * vy))
    a = np.clip(width / 2 + 0.5 - d, 0, 1)
    if dot:
        a = np.maximum(a, np.clip(5.0 - np.hypot(px - bx, py - by), 0, 1))
    over(frame, ix0, iy0, col(color), (a * alpha).astype(np.float32))

# ---------------------------------------------------------------- frame sources

# cut 5: a recording's frames retouched over a span, (path, crop) -> [(t0, t1, fn(frame, t) -> frame)], for a mark the
# journey stage drew that the film must not carry (set by parts5)
RETOUCH = {}


class FrameSource:
    """frames of a crop of a video, read forward from an ffmpeg pipe; get(t) returns the frame shown at t (BGR uint8)"""
    def __init__(self, path, rect=None, size=None, fps=FPS, vf_extra=''):
        self.path, self.rect, self.size, self.fps, self.vf_extra = str(path), rect, size, fps, vf_extra
        self.p, self.k, self.frame = None, None, None
        if rect: self.w, self.h = rect[2], rect[3]
        else: self.w, self.h = size

    def _open(self, k):
        self.close()
        vf = []
        if self.rect: x, y, w, h = self.rect; vf.append(f'crop={w}:{h}:{x}:{y}')
        if self.size: vf.append(f'scale={self.size[0]}:{self.size[1]}:force_original_aspect_ratio=increase:flags=lanczos,crop={self.size[0]}:{self.size[1]}')
        if self.vf_extra: vf.append(self.vf_extra)
        t = k / self.fps
        cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t:.4f}', '-i', self.path, '-vf', ','.join(vf), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
        self.p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=self.w * self.h * 3 * 2)
        self.k, self.frame = k - 1, None

    def _read(self):
        n = self.w * self.h * 3
        buf = self.p.stdout.read(n)
        if len(buf) < n: return False
        self.frame = np.frombuffer(buf, np.uint8).reshape(self.h, self.w, 3)
        self.k += 1
        return True

    def get(self, t):
        k = max(0, int(round(t * self.fps)))
        if self.p is None or k < self.k or k > self.k + 75: self._open(k)
        while self.k < k:
            if not self._read(): break
        if self.frame is None: self._read()
        fr = self.frame
        for (a, b, fn) in RETOUCH.get((self.path, tuple(self.rect) if self.rect else None), ()):
            if fr is not None and a <= k / self.fps <= b: fr = fn(fr, k / self.fps)
        return fr

    def close(self):
        if self.p:
            try: self.p.stdout.close(); self.p.kill(); self.p.wait()
            except Exception: pass
        self.p = None

class SeqSource:
    """a numbered JPEG sequence (the frame-exact captures), downscaled once to a working size"""
    def __init__(self, folder, scale=0.5):
        self.files = sorted(Path(folder).glob('f*.jpg'))
        self.scale, self.cache = scale, {}
    def __len__(self): return len(self.files)
    def get_index(self, i):
        i = int(clamp(i, 0, len(self.files) - 1))
        if i not in self.cache:
            if len(self.cache) > 6: self.cache.pop(next(iter(self.cache)))
            im = cv2.imread(str(self.files[i]))
            if self.scale != 1: im = cv2.resize(im, None, fx=self.scale, fy=self.scale, interpolation=cv2.INTER_AREA)
            self.cache[i] = im
        return self.cache[i]

# ---------------------------------------------------------------- placing a source image with a float camera

def place(img, sc, tx, ty, out_rect, rest=None, view=None):
    """img (BGR uint8, screen pixels) by scale sc and translation (tx, ty) into output pixels, clipped to out_rect.
    At rest (rest = the window's own scale) the view is area-resized once to the window's integer size, then placed at
    its float position: at an integer position that is a pixel-exact paste, and a sub-pixel offset (a rise easing in)
    converges to it exactly. Otherwise (the agents' camera) the image is area-resized to just above the wanted size,
    which changes smoothly with the scale (no switching between fixed levels), and the small rest of the scale and the
    float translation go through one cubic warp. Returns (ix0, iy0, patch float32 BGR 0..1)."""
    x0, y0, x1, y1 = out_rect
    if rest is not None and view is not None:
        vx, vy, vw, vh = [int(v) for v in view]
        w, h = int(round(x1 - x0)), int(round(y1 - y0))
        crop = img[vy:vy + vh, vx:vx + vw]
        if (w, h) != (vw, vh):
            crop = cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA if w < vw else cv2.INTER_CUBIC)
        ix0, iy0 = int(math.floor(x0 + 1e-6)), int(math.floor(y0 + 1e-6))
        fx, fy = x0 - ix0, y0 - iy0
        if fx > 1e-3 or fy > 1e-3:
            M = np.float32([[1, 0, fx], [0, 1, fy]])
            crop = cv2.warpAffine(crop, M, (w + 1, h + 1), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        ch, cw = crop.shape[:2]
        cx0, cy0, cx1, cy1 = max(0, ix0), max(0, iy0), min(W, ix0 + cw), min(H, iy0 + ch)
        if cx1 <= cx0 or cy1 <= cy0: return cx0, cy0, None
        return cx0, cy0, np.clip(crop[cy0 - iy0:cy1 - iy0, cx0 - ix0:cx1 - ix0].astype(np.float32) / 255.0, 0, 1)
    ix0, iy0 = max(0, int(math.floor(x0))), max(0, int(math.floor(y0)))
    ix1, iy1 = min(W, int(math.ceil(x1))), min(H, int(math.ceil(y1)))
    if ix1 <= ix0 or iy1 <= iy0: return ix0, iy0, None
    src, kx, ky = img, 1.0, 1.0
    if sc < 0.999:
        pw, ph = math.ceil(img.shape[1] * sc), math.ceil(img.shape[0] * sc)
        src = cv2.resize(img, (pw, ph), interpolation=cv2.INTER_AREA)
        kx, ky = pw / img.shape[1], ph / img.shape[0]
    M = np.float32([[sc / kx, 0, tx - ix0], [0, sc / ky, ty - iy0]])
    patch = cv2.warpAffine(src, M, (ix1 - ix0, iy1 - iy0), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return ix0, iy0, np.clip(patch.astype(np.float32) / 255.0, 0, 1)

class Seqs:
    """several numbered JPEG sequences end to end, as one 25 fps source (index i -> file)"""
    def __init__(self, folders, scale=0.5):
        self.files = [f for d in folders for f in sorted(Path(d).glob('f*.jpg'))]
        self.scale, self.cache = scale, {}
    def __len__(self): return len(self.files)
    def get_index(self, i):
        i = int(clamp(i, 0, len(self.files) - 1))
        if i not in self.cache:
            if len(self.cache) > 4: self.cache.pop(next(iter(self.cache)))
            im = cv2.imread(str(self.files[i]))
            if self.scale != 1: im = cv2.resize(im, None, fx=self.scale, fy=self.scale, interpolation=cv2.INTER_AREA)
            self.cache[i] = im
        return self.cache[i]
