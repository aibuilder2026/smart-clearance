"""SC-206 cut 3: light and motion layers, drawn in the compositor so they stay off the app's screens unless asked:
dust drifting at three depths, god rays turning slowly out of a light, a flare running along a path, a light sweep
across a sprite, and a fast blur between two shots (a whip). All float BGR 0..1, 1920 x 1080."""
import math
from functools import lru_cache
import cv2
import numpy as np
from kit import W, H, clamp, smooth, ease_out, ease_in_out, col

# ---------------------------------------------------------------- dust

class Dust:
    """motes drifting at three depths (near ones larger, softer and faster), each twinkling slowly; screened over"""
    def __init__(self, n=150, seed=206, color=(255, 236, 205), strength=0.55, area=(0, 0, W, H), wind=(14, -6)):
        rng = np.random.default_rng(seed)
        self.n = n
        self.x = rng.uniform(area[0], area[2], n); self.y = rng.uniform(area[1], area[3], n)
        self.z = rng.choice([0.35, 0.65, 1.0], n, p=[0.55, 0.3, 0.15])
        self.ph = rng.uniform(0, 2 * math.pi, n); self.sp = rng.uniform(0.4, 1.2, n)
        self.dx = rng.normal(0, 4, n); self.dy = rng.normal(0, 3, n)
        self.col = col(color); self.strength, self.area, self.wind = strength, area, wind
        self.spr = {z: self._mote(z) for z in (0.35, 0.65, 1.0)}

    @staticmethod
    def _mote(z):
        r = 2.0 + 9.0 * z ** 2
        s = int(r * 4) | 1
        y, x = np.mgrid[0:s, 0:s].astype(np.float32) - s // 2
        d = np.hypot(x, y) / r
        a = np.exp(-d * d * (2.6 if z < 0.9 else 1.2)) * (1.0 if z < 0.9 else 0.55)
        return a.astype(np.float32)

    def draw(self, f, u, alpha=1.0):
        if alpha <= 0.01: return
        x0, y0, x1, y1 = self.area
        wx, wy = self.wind
        add = np.zeros((H, W), np.float32)
        xs = (self.x + (wx * self.z + self.dx) * u - x0) % (x1 - x0) + x0
        ys = (self.y + (wy * self.z + self.dy) * u + 6 * np.sin(u * 0.7 + self.ph) - y0) % (y1 - y0) + y0
        tw = 0.55 + 0.45 * np.sin(u * self.sp * 2.2 + self.ph)
        for i in range(self.n):
            m = self.spr[self.z[i]]
            s = m.shape[0]; h = s // 2
            cx, cy = int(xs[i]), int(ys[i])
            ax0, ay0 = cx - h, cy - h
            bx0, by0 = max(0, ax0), max(0, ay0)
            bx1, by1 = min(W, ax0 + s), min(H, ay0 + s)
            if bx1 <= bx0 or by1 <= by0: continue
            add[by0:by1, bx0:bx1] += m[by0 - ay0:by1 - ay0, bx0 - ax0:bx1 - ax0] * tw[i] * (0.5 + 0.5 * self.z[i])
        a = np.clip(add * self.strength * alpha, 0, 1)[..., None]
        f[:] = 1 - (1 - f) * (1 - a * self.col)

# ---------------------------------------------------------------- god rays

@lru_cache(maxsize=4)
def _ray_angles(seed, n=2048):
    rng = np.random.default_rng(seed)
    a = np.zeros(n, np.float32)
    for k, w in ((7, 1.0), (13, 0.7), (29, 0.45), (61, 0.25)):
        ph = rng.uniform(0, 2 * math.pi)
        a += w * np.maximum(0, np.sin(np.linspace(0, 2 * math.pi * k, n, endpoint=False) + ph)) ** 3
    a /= a.max()
    return a

class Rays:
    """light shafts out of a point (x, y), turning slowly; screened over, strongest near the light"""
    def __init__(self, x, y, color=(255, 214, 160), strength=0.32, turn=0.02, reach=1500, seed=7):
        self.x, self.y, self.c, self.s, self.turn, self.reach = x, y, col(color), strength, turn, reach
        self.tex = _ray_angles(seed)
        yy, xx = np.mgrid[0:H // 2, 0:W // 2].astype(np.float32) * 2
        self.ang = np.arctan2(yy - y, xx - x)
        self.fall = np.clip(1 - np.hypot(xx - x, yy - y) / reach, 0, 1) ** 1.6

    def draw(self, f, u, alpha=1.0):
        if alpha <= 0.01: return
        n = len(self.tex)
        idx = ((self.ang + u * self.turn) % (2 * math.pi)) / (2 * math.pi) * n
        r = self.tex[idx.astype(np.int32) % n] * self.fall
        r = cv2.GaussianBlur(r, (0, 0), 3)
        r = cv2.resize(r, (W, H), interpolation=cv2.INTER_LINEAR)
        a = np.clip(r * self.s * alpha, 0, 1)[..., None]
        f[:] = 1 - (1 - f) * (1 - a * self.c)

# ---------------------------------------------------------------- flare and route

def flare(f, x, y, power=1.0, color=(255, 236, 200), streak=520):
    """a bright point with a soft halo and a thin anamorphic streak, screened"""
    if power <= 0.01: return
    rx, ry = int(max(streak, 240)), 240   # far enough that the halo (sigma 70) has faded to nothing at the edge
    x0, y0, x1, y1 = max(0, int(x) - rx), max(0, int(y) - ry), min(W, int(x) + rx), min(H, int(y) + ry)
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx, dy = xx - x, yy - y
    core = np.exp(-(dx * dx + dy * dy) / (2 * 9.0 ** 2))
    halo = np.exp(-(dx * dx + dy * dy) / (2 * 70.0 ** 2)) * 0.35
    st = np.exp(-(dy * dy) / (2 * 2.2 ** 2)) * np.exp(-np.abs(dx) / (streak * 0.35)) * 0.8
    a = np.clip((core + halo + st) * power, 0, 1)[..., None]
    f[y0:y1, x0:x1] = 1 - (1 - f[y0:y1, x0:x1]) * (1 - a * col(color))

def bezier(p0, p1, p2, p3, n=400):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.float32, (p0, p1, p2, p3))
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3

def stroke(f, pts, prog, color, width=3.0, glow=14.0, alpha=1.0, head=True):
    """a path drawn on to prog (0..1), with a glow, and a flare at its head"""
    if prog <= 0 or alpha <= 0: return
    k = max(2, int(len(pts) * clamp(prog)))
    p = pts[:k]
    x0, y0 = int(max(0, p[:, 0].min() - glow * 3)), int(max(0, p[:, 1].min() - glow * 3))
    x1, y1 = int(min(W, p[:, 0].max() + glow * 3)), int(min(H, p[:, 1].max() + glow * 3))
    if x1 <= x0 or y1 <= y0: return
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.polylines(m, [np.int32(np.round((p - [x0, y0]) * 4))], False, 1.0, thickness=max(1, int(width * 4)), lineType=cv2.LINE_AA, shift=2)
    g = cv2.GaussianBlur(m, (0, 0), glow) * 2.2
    a = np.clip(m + g * 0.6, 0, 1) * alpha
    roi = f[y0:y1, x0:x1]
    roi[:] = 1 - (1 - roi) * (1 - a[..., None] * col(color))
    if head and prog < 1: flare(f, p[-1][0], p[-1][1], power=0.9 * alpha, color=(220, 255, 230), streak=300)

# ---------------------------------------------------------------- sweeps and whips

def sweep(spr, p, width=0.12, power=0.9, angle=0.35):
    """a copy of a premultiplied sprite with a diagonal band of light across it at position p (0..1)"""
    h, w = spr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    s = (xx / w + (yy / h) * angle) / (1 + angle)
    band = np.exp(-((s - (p * (1 + 2 * width) - width)) / width) ** 2) * power
    out = spr.copy()
    out[..., :3] = np.clip(out[..., :3] + band[..., None] * out[..., 3:4], 0, 1)
    return out

def whip(a, b, p, dir=1):
    """a fast pan from frame a to frame b: a slides out and b in, both smeared along the move; p 0..1"""
    e = ease_in_out(p)
    out = np.empty_like(a)
    shift = int(W * e)
    k = int(2 + 120 * math.sin(math.pi * clamp(p)))
    ker = np.zeros((1, k), np.float32); ker[0] = 1.0 / k
    sa = cv2.filter2D(a, -1, ker) if k > 2 else a
    sb = cv2.filter2D(b, -1, ker) if k > 2 else b
    if dir > 0:
        out[:, :W - shift] = sa[:, shift:]
        out[:, W - shift:] = sb[:, :shift]
    else:
        out[:, shift:] = sa[:, :W - shift]
        out[:, :shift] = sb[:, W - shift:]
    return out

def defocus(img, sigma):
    """a large blur, done at a quarter size when it is large (the same look, a sixteenth of the work)"""
    if sigma < 0.4: return img
    if sigma < 6: return cv2.GaussianBlur(img, (0, 0), sigma)
    sm = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    sm = cv2.GaussianBlur(sm, (0, 0), sigma / 4)
    return cv2.resize(sm, (W, H), interpolation=cv2.INTER_LINEAR)

def grade(img, lift=0.0, gain=1.0, tint=None, amount=0.0):
    out = img * gain + lift
    if tint is not None and amount: out = out * (1 - amount) + col(tint) * amount * out.mean(2, keepdims=True) * 2.2
    return np.clip(out, 0, 1)

@lru_cache(maxsize=4)
def vignette(strength=0.45, round_=0.75):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((x - W / 2) / (W * round_)) ** 2 + ((y - H / 2) / (H * round_)) ** 2
    return (1 - strength * np.clip(d, 0, 1.6) / 1.6)[..., None].astype(np.float32)
