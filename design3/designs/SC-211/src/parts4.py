"""SC-206 cut 4: the new scenes, in the manner of Spoiler Alert's film (each thing springs in and keeps drifting, one
shot turns into the next, routes draw on with packs flowing along them, words land on the beat, a list ticks as it is
said): the godown that dives into its carton's label; the architecture laid out on a platform in depth, then the dive
into the agents' own walk; the Router's split as routes; a window that swings in and settles; the close, the mark
drawing its own route. Each part draws itself into a float BGR frame at a local time u (seconds), as parts.py's do."""
import math
from functools import lru_cache
import cv2
import numpy as np
from PIL import Image, ImageDraw
from kit import *
from parts import words_sprite, card_sprite, url_line, AGENT_FRAMES, studio, BAR
from parts3 import text_sprite, Footage
import fx


def ease_in(x):
    x = clamp(x)
    return x * x * x


def bezier_ease(x1, y1, x2, y2):
    """a CSS cubic-bezier easing, as Framer Motion's ease arrays"""
    def f(x):
        x = clamp(x)
        lo, hi = 0.0, 1.0
        for _ in range(30):
            t = (lo + hi) / 2
            bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
            if bx < x: lo = t
            else: hi = t
        t = (lo + hi) / 2
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3
    return f


def fm_spring(t, stiffness, damping):
    """Framer Motion's spring (mass 1) from 0 to 1, t seconds after it starts"""
    w0 = math.sqrt(stiffness)
    return spring(t, zeta=damping / (2 * w0), w=w0)


# ---------------------------------------------------------------- 0 · the opening: the godown, then its carton's label

class ClipBG:
    """an LTX clip as the whole frame, frame for frame at the film's 25 fps (holding its last frame after it)"""
    def __init__(self, key):
        self.foot = Footage(key)
    def draw(self, f, u, L=None):
        img, _ = self.foot.frame(u)
        f[:] = img.astype(np.float32) / 255


def _zoom(img, z, pt):
    M = np.float32([[z, 0, (1 - z) * pt[0]], [0, z, (1 - z) * pt[1]]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


class Dive:
    """the camera rushes into a point of what is drawn under it ('in': from 1 to z, easing in) or lands from it ('out':
    from z to 1, easing out), with a zoom blur as long as the travel in one frame: a shot handing over to the next"""
    def __init__(self, base, u0, u1, pt, z=3.0, mode='in'):
        self.base, self.u0, self.u1, self.pt, self.z, self.mode = base, u0, u1, pt, z, mode
    def zoom_at(self, u):
        p = clamp((u - self.u0) / (self.u1 - self.u0))
        if self.mode == 'in': return 1 + (self.z - 1) * ease_in(p)
        return self.z + (1 - self.z) * ease_out(p)
    def draw(self, f, u, L=None):
        self.base.draw(f, u, L)
        if (self.mode == 'in' and u <= self.u0) or (self.mode == 'out' and u >= self.u1): return
        z1 = self.zoom_at(u); z0 = self.zoom_at(u - 0.8 / FPS)     # the shutter open for most of the frame
        travel = abs(z1 - z0) / max(z0, z1) * 1100                 # px at the frame's far corner
        n = int(clamp(math.ceil(travel / 2.5), 1, 28))
        src = f.copy()
        if n == 1:
            f[:] = _zoom(src, z1, self.pt); return
        acc = np.zeros_like(f)
        for k in range(n):
            acc += _zoom(src, z0 + (z1 - z0) * k / (n - 1), self.pt)
        f[:] = acc / n


class Kinetic:
    """words landing on the beat (Spoiler Alert's type): each word rises out of a mask under its line and settles as the
    voice says it. lines: [[(word, u) or (word, u, rgb), …], …]"""
    def __init__(self, x, y, lines, size=64, kind='b', wght=760, rgb=(244, 248, 245), lead=1.12, u1=None, fout=0.35, align='left'):
        self.x, self.y, self.size, self.u1, self.fout = x, y, size, u1, fout
        self.words = []   # (sprite, x, y, u)
        for i, ln in enumerate(lines):
            sprs = [(text_sprite(w[0], kind, size, wght, w[2] if len(w) > 2 else rgb), w[1]) for w in ln]
            sp = size * 0.24
            total = sum(s.shape[1] - size * 0.2 for s, _ in sprs) + sp * (len(sprs) - 1)
            cx = x - (total / 2 if align == 'center' else 0)
            for s, u in sprs:
                self.words.append((s, cx, y + i * size * lead, u))
                cx += s.shape[1] - size * 0.2 + sp
    def draw(self, f, u, L=None):
        a_all = 1.0
        if self.u1 is not None: a_all = 1 - ramp(u, self.u1 - self.fout, self.u1)
        if a_all <= 0: return
        for s, x, y, t in self.words:
            if u < t: continue
            e = ease_out((u - t) / 0.5)
            h = s.shape[0]
            # SC-210: each word slides up into place as it fades in, whole: risen out of a mask, a word's foot came last,
            # and the y of "yes" read as a u until its tail cleared
            dy = (1 - e) * h * 0.4
            blit(f, s, x, y + dy, a_all * clamp((u - t) / 0.22))


class Shade:
    """a soft dark pool behind words laid over a bright picture: an ellipse round (cx, cy), darkest at its centre"""
    def __init__(self, cx, cy, rx, ry, alpha=0.66, u0=0.0, u1=None):
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        self.m = (np.clip(1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2, 0, 1) ** 0.7 * alpha).astype(np.float32)[..., None]
        self.u0, self.u1 = u0, u1
    def draw(self, f, u, L=None):
        a = clamp((u - self.u0) / 0.4) if self.u1 is None else fade(u, self.u0, self.u1, 0.4, 0.4)
        if a <= 0: return
        f *= 1 - self.m * a
        f += self.m * a * col((5, 9, 7))


@lru_cache(maxsize=None)
def days_sprite(n, size=30):
    """the label's countdown: an amber pill, 'n days left'"""
    S = 2
    text = f'{n} days left'
    w = int(text_w(text, 'g', size, 700) + size * 2.6); h = int(size * 2.1)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=(26, 20, 6, 235), outline=(247, 192, 74, 200), width=int(1.6 * S))
    r = size * 0.5; cx, cy = h * 0.5, h * 0.5
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], outline=(247, 192, 74, 255), width=int(2.2 * S))
    d.line([cx * S, cy * S, cx * S, (cy - r * 0.62) * S], fill=(247, 192, 74, 255), width=int(2.2 * S))
    d.line([cx * S, cy * S, (cx + r * 0.45) * S, (cy + r * 0.2) * S], fill=(247, 192, 74, 255), width=int(2.2 * S))
    draw_text(d, ((h * 0.5 + r + size * 0.5) * S, (h / 2 - size * 0.62) * S), text, 'g', size * S, (252, 226, 160, 255), 700)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class Countdown:
    """the days to the best-before, counted down to what is left (an odometer of the pill), then held"""
    def __init__(self, x, y, u0, u1, n0, n1, dur=0.9):
        self.x, self.y, self.u0, self.u1, self.n0, self.n1, self.dur = x, y, u0, u1, n0, n1, dur
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        p = ease_out((u - self.u0 - 0.15) / self.dur)
        n = int(round(self.n0 + (self.n1 - self.n0) * p))
        e = ease_out((u - self.u0) / 0.45)
        blit(f, days_sprite(n), self.x, self.y + 10 * (1 - e), a)


# ---------------------------------------------------------------- 2 · the architecture in depth, and the agents' walk

ORBIT_CROP = (0, 550, 2311, 1300)    # the agents' orbit in the 2x capture (3840 x 2160): no page title, no sign-in card


class Orbit:
    """the captured agents' walk (capture-agents.mjs), cropped to the orbit, at any working size, cached"""
    def __init__(self):
        self.files = sorted(AGENT_FRAMES.glob('f*.jpg'))
        self.cache = {}
    def raw(self, i):
        i = int(clamp(i, 0, len(self.files) - 1))
        if i not in self.cache:
            if len(self.cache) > 14: self.cache.pop(next(iter(self.cache)))
            x, y, w, h = ORBIT_CROP
            self.cache[i] = cv2.imread(str(self.files[i]))[y:y + h, x:x + w]
        return self.cache[i]
    def frame(self, i, size=(W, H), zoom=1.0, centre=(0.5, 0.5)):
        im = self.raw(i)
        if zoom != 1.0:
            h, w = im.shape[:2]; cw, ch = w / zoom, h / zoom
            x0 = clamp(centre[0] * w - cw / 2, 0, w - cw); y0 = clamp(centre[1] * h - ch / 2, 0, h - ch)
            M = np.float32([[size[0] / cw, 0, -x0 * size[0] / cw], [0, size[1] / ch, -y0 * size[1] / ch]])
            return cv2.warpAffine(im, M, size, flags=cv2.INTER_AREA if size[0] < cw else cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return cv2.resize(im, size, interpolation=cv2.INTER_AREA)
    def blended(self, s, span, size=(W, H), zoom=1.0):
        """the walk at fractional frame s, averaged over the `span` frames before it: a time-lapse with its trails"""
        k = max(1, int(round(span)))
        idx = [int(round(s - j * span / k)) for j in range(k)]
        acc = None
        for i in idx:
            fr = self.frame(i, size, zoom).astype(np.float32)
            acc = fr if acc is None else acc + fr
        return acc / (len(idx) * 255.0)


def _cam(T, yaw, pitch, R):
    """a camera looking at T from yaw / pitch (degrees, pitch 90 straight down) at distance R: its position and its
    right, up and forward axes"""
    th, ph = math.radians(yaw), math.radians(pitch)
    F = np.array([-math.cos(ph) * math.sin(th), -math.sin(ph), -math.cos(ph) * math.cos(th)])
    Rv = np.array([math.cos(th), 0.0, -math.sin(th)])
    U = np.array([-math.sin(th) * math.sin(ph), math.cos(ph), -math.cos(th) * math.sin(ph)])
    C = np.asarray(T, float) - R * F
    return C, Rv, U, F


def _proj(P, cam, f=1500.0):
    C, Rv, U, F = cam
    d = np.asarray(P, float) - C
    z = d @ F
    z = np.maximum(z, 1e-3)
    return np.stack([W / 2 + f * (d @ Rv) / z, H / 2 - f * (d @ U) / z], -1), z


@lru_cache(maxsize=None)
def tile_texture(key, title, sub, icon, tw=1120, th=630):
    """a layer's face: dark green glass with a bright edge, its icon, its name and what it runs on (premultiplied BGRA)"""
    im = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    r = 44
    # the glass: a soft vertical gradient
    grad = Image.new('RGBA', (tw, th))
    gd = ImageDraw.Draw(grad)
    for y in range(th):
        k = y / th
        gd.line([(0, y), (tw, y)], fill=(int(16 + 6 * (1 - k)), int(40 + 14 * (1 - k)), int(30 + 9 * (1 - k)), 238))
    mask = Image.new('L', (tw, th), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, tw - 1, th - 1], radius=r, fill=255)
    im.paste(grad, (0, 0), mask)
    d.rounded_rectangle([2, 2, tw - 3, th - 3], radius=r, outline=(63, 176, 123, 230), width=5)
    d.rounded_rectangle([12, 12, tw - 13, th - 13], radius=r - 10, outline=(115, 201, 157, 40), width=2)
    # a faint dot grid
    for gx in range(60, tw - 40, 48):
        for gy in range(60, th - 40, 48):
            d.ellipse([gx - 2, gy - 2, gx + 2, gy + 2], fill=(115, 201, 157, 26))
    # the icon, in a disc
    cx, cy, rr = 150, th / 2, 92
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(23, 107, 78, 255), outline=(115, 201, 157, 255), width=4)
    ink = (236, 243, 239, 255)
    if icon == 'window':
        d.rounded_rectangle([cx - 52, cy - 40, cx + 52, cy + 40], radius=10, outline=ink, width=7)
        d.line([cx - 52, cy - 18, cx + 52, cy - 18], fill=ink, width=6)
        for k in range(3): d.ellipse([cx - 42 + k * 15 - 4, cy - 33, cx - 42 + k * 15 + 4, cy - 25], fill=ink)
    elif icon == 'db':
        for k in range(3):
            y0 = cy - 44 + k * 30
            d.ellipse([cx - 46, y0, cx + 46, y0 + 26], outline=ink, width=6)
        d.line([cx - 46, cy - 31, cx - 46, cy + 29], fill=ink, width=6); d.line([cx + 46, cy - 31, cx + 46, cy + 29], fill=ink, width=6)
    elif icon == 'pubsub':
        pts = [(cx - 44, cy), (cx + 30, cy - 40), (cx + 30, cy + 40), (cx + 48, cy)]
        for p in pts[1:]: d.line([pts[0], p], fill=ink, width=6)
        for p in pts: d.ellipse([p[0] - 13, p[1] - 13, p[0] + 13, p[1] + 13], fill=(23, 107, 78, 255), outline=ink, width=6)
    elif icon == 'orb':
        for k, a in [(60, 60), (44, 120), (28, 255)]:
            d.ellipse([cx - k, cy - k, cx + k, cy + k], outline=(236, 243, 239, a), width=6)
        d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=ink)
    tx = 290
    draw_text(d, (tx, th / 2 - 112), title, 'b', 96, (244, 248, 245, 255), 760)
    draw_text(d, (tx + 2, th / 2 + 14), sub, 'g', 54, (170, 196, 182, 255), 560)
    return to_sprite(im)


@lru_cache(maxsize=None)
def agents_badge():
    """the agents' layer's own name, set on its face"""
    S = 2
    t1, t2 = 'Ten agents', 'Google ADK on Cloud Run'
    w = int(max(text_w(t1, 'b', 40, 760), text_w(t2, 'g', 25, 560)) + 56); h = 108
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=22 * S, fill=(8, 18, 13, 225), outline=(63, 176, 123, 200), width=int(2 * S))
    draw_text(d, (28 * S, 12 * S), t1, 'b', 40 * S, (244, 248, 245, 255), 760)
    draw_text(d, (29 * S, 64 * S), t2, 'g', 25 * S, (115, 201, 157, 255), 560)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


def _warp_sprite(f, spr, dst, alpha=1.0):
    """a premultiplied BGRA sprite onto the quad dst (4 x 2: its corners clockwise from top-left), within its bounds"""
    if alpha <= 0.002: return
    h, w = spr.shape[:2]
    x0, y0 = max(0, int(math.floor(dst[:, 0].min())) - 1), max(0, int(math.floor(dst[:, 1].min())) - 1)
    x1, y1 = min(W, int(math.ceil(dst[:, 0].max())) + 2), min(H, int(math.ceil(dst[:, 1].max())) + 2)
    if x1 <= x0 or y1 <= y0: return
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(dst - [x0, y0]))
    out = cv2.warpPerspective(spr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    roi = f[y0:y1, x0:x1]
    roi *= (1 - out[..., 3:4] * alpha)
    roi += out[..., :3] * alpha


def _poly(f, pts, rgb, alpha):
    """a filled polygon, anti-aliased, at sub-pixel precision"""
    if alpha <= 0.002: return
    x0, y0 = max(0, int(pts[:, 0].min()) - 2), max(0, int(pts[:, 1].min()) - 2)
    x1, y1 = min(W, int(pts[:, 0].max()) + 3), min(H, int(pts[:, 1].max()) + 3)
    if x1 <= x0 or y1 <= y0: return
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.fillPoly(m, [np.round((pts - [x0, y0]) * 16).astype(np.int32)], 1.0, cv2.LINE_AA, shift=4)
    over(f, x0, y0, col(rgb), m * alpha)


def _glow_line(f, pts, rgb, alpha, width=3.0, glow=9.0):
    """a polyline with a soft glow under it"""
    if alpha <= 0.002 or len(pts) < 2: return
    x0, y0 = max(0, int(pts[:, 0].min() - 30)), max(0, int(pts[:, 1].min() - 30))
    x1, y1 = min(W, int(pts[:, 0].max() + 31)), min(H, int(pts[:, 1].max() + 31))
    if x1 <= x0 or y1 <= y0: return
    m = np.zeros((y1 - y0, x1 - x0), np.float32)
    p = np.round((pts - [x0, y0]) * 16).astype(np.int32)
    cv2.polylines(m, [p], False, 1.0, max(1, int(round(width))), cv2.LINE_AA, shift=4)
    g = cv2.GaussianBlur(m, (0, 0), glow) * 2.2
    over(f, x0, y0, col(rgb), np.clip(g, 0, 1) * alpha * 0.55)
    over(f, x0, y0, col(rgb), m * alpha)


def _dot(f, p, r, rgb, alpha, glow=10.0, core=None):
    """a glowing dot: a white core (or `core`) in a halo of rgb"""
    if alpha <= 0.002: return
    x0, y0 = max(0, int(p[0] - r - 3 * glow)), max(0, int(p[1] - r - 3 * glow))
    x1, y1 = min(W, int(p[0] + r + 3 * glow) + 1), min(H, int(p[1] + r + 3 * glow) + 1)
    if x1 <= x0 or y1 <= y0: return
    px, py = grid(x0, y0, x1, y1)
    d = np.hypot(px - p[0], py - p[1])
    cov = np.clip(r + 0.5 - d, 0, 1)
    halo = np.exp(-(np.maximum(d - r, 0) / glow) ** 2) * 0.7
    over(f, x0, y0, col(rgb), np.clip(halo, 0, 1).astype(np.float32) * alpha)
    over(f, x0, y0, np.ones(3, np.float32) if core is None else col(core), (cov * alpha).astype(np.float32))


class ArchScene:
    """The architecture in depth, then the agents at work (g01, about 6 s):
      [0, d0)    five layers rise onto a platform in turn, each on a spring, as the camera drifts round them: the apps on
                 Firebase Hosting, backend-api on Cloud Run with Cloud SQL, the events on Pub/Sub and Cloud Scheduler, the
                 ten agents (Google ADK on Cloud Run, their own walk alive on the layer's face) and Gemini on Vertex AI;
                 routes draw on between them and packets run along them, a batch's path through the system.
      [d0, d1)   the camera dives into the agents' layer: its face turns to the camera and fills the frame.
      [d1, L]    the agents' walk itself, time-lapsed with its trails through the nine stops, landing on the amber yes as
                 the voice says it, then held at its own pace.
    words: [(u, text, rgb)] laid by the caller (Kinetic); u_yes: the local time of 'yes'."""
    TILES = [  # key, centre (x, z), size (w, d), title, what it runs on, icon
        ('apps', (-720, -250), (560, 315), 'The apps', 'Firebase Hosting', 'window'),
        ('api', (0, -250), (560, 315), 'backend-api', 'Cloud Run · Cloud SQL', 'db'),
        ('events', (720, -250), (560, 315), 'Events', 'Pub/Sub · Scheduler', 'pubsub'),
        ('agents', (720, 300), (640, 360), None, None, None),
        ('gemini', (0, 300), (560, 315), 'Gemini', '3.1 Pro · 3.8 Flash · Vertex AI', 'orb'),   # cut 7b: the models named
    ]
    ROUTES = [  # (from, to) world points on the platform, and when they draw
        ('apps-api', [(-440, -250), (-280, -250)]),
        ('api-events', [(280, -250), (440, -250)]),
        ('events-agents', [(720, -92), (720, 120)]),
        ('agents-gemini', [(400, 300), (280, 300)]),
    ]
    THICK = 22.0

    def __init__(self, L, d0, d1, u_yes, glow_at=(), walk=(0, 71, 334, 352)):
        self.L, self.d0, self.d1, self.u_yes, self.glow_at = L, d0, d1, u_yes, dict(glow_at)
        self.orbit = Orbit()
        self.walk = walk
        self.tex = {k: tile_texture(k, t, s, ic) for k, _, _, t, s, ic in self.TILES if t}
        self.bg = None

    def scrim(self):
        if getattr(self, '_scrim', None) is None:
            y, x = np.mgrid[0:H, 0:W].astype(np.float32)
            d = np.sqrt(((x - 935) / 470) ** 2 + ((y - 578) / 150) ** 2)
            self._scrim = (np.clip((1.6 - d) / 0.6, 0, 1) * 0.97).astype(np.float32)
        return self._scrim

    # -- the camera
    def camera(self, u):
        # drifting round the platform, a slow push; then the dive onto the agents' face
        p = clamp(u / max(1e-3, self.d0))
        T0 = np.array([110.0, 0.0, 60.0]); yaw0 = -14 + 7 * ease_in_out(p); pitch0 = 52 + 5 * ease_in_out(p); R0 = 2000 - 220 * ease_in_out(p)
        if u <= self.d0: return _cam(T0, yaw0, pitch0, R0)
        q = ease_in_out((u - self.d0) / (self.d1 - self.d0))
        ax, az = 720.0, 300.0
        T1 = np.array([ax, self.THICK, az])
        R1 = 1500.0 * 640 / W                    # the agents' face exactly fills the frame
        # the distance falls geometrically, so the approach keeps one speed in the frame
        R = R0 * (R1 / R0) ** q
        return _cam(T0 + (T1 - T0) * q, yaw0 * (1 - q), pitch0 + (90 - pitch0) * q, R)

    def walk_index(self, u):
        """the agents' walk: alive at its own pace on the layer, then time-lapsed to the yes, then at its own pace"""
        w0, w1, w2, w3 = self.walk
        if u <= self.d1: return w0 + (w1 - w0) * clamp(u / self.d1), 1.0
        if u <= self.u_yes:
            p = (u - self.d1) / max(1e-3, self.u_yes - self.d1)
            s = w1 + (w2 - w1) * (1 - (1 - p) ** 1.6)          # fast, then slowing into the yes
            speed = (w2 - w1) * 1.6 * (1 - p) ** 0.6 / max(1e-3, (self.u_yes - self.d1) * FPS)
            return s, max(1.0, speed)
        return min(w3, w2 + (u - self.u_yes) * FPS), 1.0

    def draw(self, f, u, L=None):
        if u >= self.d1:   # the walk, full frame
            s, span = self.walk_index(u)
            f[:] = self.orbit.blended(s, min(span, 8.0))
            sa = clamp((u - self.d1) / 0.25)
            m = self.scrim()
            f *= 1 - m[..., None] * sa
            f += m[..., None] * sa * col((5, 9, 7))
            q = (u - self.u_yes) / 0.9
            if 0 <= q < 1:   # the yes: an amber ping round the person's stop
                for k, d_ in enumerate((0.0, 0.22)):
                    qq = (u - self.u_yes - d_) / 0.9
                    if 0 <= qq < 1:
                        rr = 18 + 70 * ease_out(qq)
                        ring(f, 1476 - rr, 480 - rr, 1476 + rr, 480 + rr, rr, 1.0, 0.85 * (1 - qq), color=(247, 192, 74), width=3.0, glow=True)
            return
        if self.bg is None: self.bg = studio().copy()
        f[:] = self.bg
        cam = self.camera(u)
        dive = clamp((u - self.d0) / (self.d1 - self.d0))
        others = 1 - ease_in_out(clamp(dive / 0.6))
        # the platform's grid, in perspective
        if others > 0.01:
            for gx in range(-1400, 1601, 200):
                P = np.array([[gx, 0, -700], [gx, 0, 800]], float); pts, z = _proj(P, cam)
                _glow_line(f, pts.astype(np.float32), (63, 176, 123), 0.07 * others, width=1.2, glow=2)
            for gz in range(-700, 801, 150):
                P = np.array([[-1400, 0, gz], [1600, 0, gz]], float); pts, z = _proj(P, cam)
                _glow_line(f, pts.astype(np.float32), (63, 176, 123), 0.07 * others, width=1.2, glow=2)
        # the layers, far first
        order = sorted(self.TILES, key=lambda t: -(_proj(np.array([t[1][0], 0, t[1][1]], float), cam)[1]))
        for i, (key, (cx, cz), (w, d), title, sub, icon) in enumerate(order):
            k = [t[0] for t in self.TILES].index(key)
            t_in = 0.08 + 0.14 * k
            sp = fm_spring(u - t_in, 220, 20) if u > t_in else 0.0
            a = clamp((u - t_in) / 0.25) * (1.0 if key == 'agents' else others)
            if a <= 0.002: continue
            lift = (1 - sp) * 140                          # it drops onto the platform
            y0, y1 = lift, lift + self.THICK
            x0_, x1_, z0_, z1_ = cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2
            top = np.array([[x0_, y1, z0_], [x1_, y1, z0_], [x1_, y1, z1_], [x0_, y1, z1_]], float)
            bot = top.copy(); bot[:, 1] = y0
            tp, _ = _proj(top, cam); bp, _ = _proj(bot, cam)
            # its shadow on the platform
            sh = top.copy(); sh[:, 1] = 0; sp_, _ = _proj(sh, cam)
            _poly(f, sp_.astype(np.float32), (0, 0, 0), 0.35 * a * (1 - lift / 140))
            # the sides that face the camera
            C = cam[0]
            for j in range(4):
                p0, p1 = top[j], top[(j + 1) % 4]
                mid = (p0 + p1) / 2; nrm = np.array([mid[0] - cx, 0, mid[2] - cz])
                if nrm @ (C - mid) <= 0: continue
                quad = np.array([tp[j], tp[(j + 1) % 4], bp[(j + 1) % 4], bp[j]], np.float32)
                _poly(f, quad, (14, 60, 43), a)
                _glow_line(f, np.array([bp[j], bp[(j + 1) % 4]], np.float32), (63, 176, 123), 0.5 * a, width=1.5, glow=3)
            # the face
            if key == 'agents':
                s, _ = self.walk_index(u)
                fr = self.orbit.frame(int(round(s)), (W, H) if dive > 0 else (1280, 720)).astype(np.float32) / 255
                face = np.dstack([fr, np.ones(fr.shape[:2], np.float32)])
                _warp_sprite(f, face, tp.astype(np.float32), a)
                ba = a * (1 - ease_in_out(clamp(dive / 0.5)))
                if ba > 0.01:   # its name, set on its face
                    b = agents_badge(); bh, bw = b.shape[:2]
                    # the badge in the face's top-left, in the face's own perspective
                    uvs = np.array([[0.035, 0.05], [0.035 + bw / 1280 * 1.15, 0.05], [0.035 + bw / 1280 * 1.15, 0.05 + bh / 720 * 1.15], [0.035, 0.05 + bh / 720 * 1.15]])
                    q = np.array([tp[0] + (tp[1] - tp[0]) * uu + (tp[3] - tp[0]) * vv + (tp[2] - tp[1] - tp[3] + tp[0]) * uu * vv for uu, vv in uvs], np.float32)
                    _warp_sprite(f, b, q, ba)
            else:
                _warp_sprite(f, self.tex[key], tp.astype(np.float32), a)
            # the edge, brighter as the voice names it
            g = 0.0
            if key in self.glow_at:
                g = clamp((u - self.glow_at[key]) / 0.2) * (1 - clamp((u - self.glow_at[key] - 0.9) / 0.6))
            _glow_line(f, np.vstack([tp, tp[:1]]).astype(np.float32), (52, 211, 128), (0.55 + 0.45 * g) * a, width=2.0 + 1.5 * g, glow=6 + 8 * g)
        # the routes, drawn on, and packets running along them
        if others > 0.01:
            for k, (name, pts) in enumerate(self.ROUTES):
                r0 = 0.75 + 0.22 * k
                p = ease_in_out((u - r0) / 0.35)
                if p <= 0: continue
                P = np.array([[x, self.THICK + 2, z] for x, z in pts], float)
                a_, b_ = P[0], P[-1]
                q = a_ + (b_ - a_) * p
                pp, _ = _proj(np.array([a_, q]), cam)
                _glow_line(f, pp.astype(np.float32), (115, 201, 157), 0.9 * others, width=3.2, glow=7)
                if p >= 1:   # packets
                    n = 3; two = name == 'agents-gemini'
                    for m in range(n):
                        ph = ((u - r0 - 0.35) * 1.3 + m / n) % 1.0
                        for back in ([False, True] if two else [False]):
                            t_ = 1 - ph if back else ph
                            Q = a_ + (b_ - a_) * t_
                            qp, _ = _proj(Q[None], cam)
                            _dot(f, qp[0], 6.0, (52, 211, 128) if not back else (247, 192, 74), 0.95 * others * clamp(min(t_, 1 - t_) * 8))


# ---------------------------------------------------------------- the Router's split, as routes

@lru_cache(maxsize=None)
def exit_label(title, sub, n, rgb, width=300):
    S = 2
    t2 = f'{n:,} packs'
    im = Image.new('RGBA', (width * S, 74 * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    draw_text(d, (0, 0), title, 'g', 24 * S, (240, 246, 242, 255), 680)
    draw_text(d, (0, 34 * S), t2, 'b', 30 * S, tuple(rgb) + (255,), 760)
    if sub: draw_text(d, ((text_w(t2, 'b', 30, 760) + 12) * S, 42 * S), sub, 'g', 18 * S, (150, 172, 160, 255), 520)
    return to_sprite(im.resize((width, 74), Image.LANCZOS))


class PlanFlow:
    """The Router's split, drawn as routes: the batch at its source, a route drawn on to each exit with the packs it
    takes running along it (as many dots as its share), each exit's count rolling up as the route arrives.
    exits: [(title, sub, packs, rgb)]"""
    def __init__(self, x, y, u0, u1, src_title, src_n, exits, w=560, h=440):
        self.x, self.y, self.u0, self.u1, self.w, self.h = x, y, u0, u1, w, h
        self.src_title, self.src_n, self.exits = src_title, src_n, exits
        self.src = text_sprite(f'{src_n:,}', 'b', 40, 760)
        self.src2 = text_sprite(src_title, 'g', 20, 560, (170, 196, 182))
    def node(self, i):
        n = len(self.exits)
        return self.x + self.w - 240, self.y + 40 + i * (self.h - 80) / max(1, n - 1)
    def path(self, i, steps=48):
        sx, sy = self.x + 30, self.y + self.h / 2
        ex, ey = self.node(i)
        t = np.linspace(0, 1, steps)[:, None]
        p0, p1, p2, p3 = np.array([sx, sy]), np.array([sx + 150, sy]), np.array([ex - 170, ey]), np.array([ex - 26, ey])
        return ((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3).astype(np.float32)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.35)
        if a <= 0: return
        sx, sy = self.x + 30, self.y + self.h / 2
        sp = fm_spring(u - self.u0, 260, 18)
        _dot(f, (sx, sy), 14 * sp + 0.01, (52, 211, 128), a, glow=14)
        blit(f, self.src, self.x - 4, sy + 26, a * clamp((u - self.u0 - 0.1) / 0.3))
        blit(f, self.src2, self.x - 2, sy + 76, a * clamp((u - self.u0 - 0.15) / 0.3))
        total = sum(e[2] for e in self.exits)
        for i, (title, sub, n, rgb) in enumerate(self.exits):
            r0 = self.u0 + 0.35 + 0.22 * i
            p = ease_in_out((u - r0) / 0.55)
            if p <= 0: continue
            P = self.path(i)
            k = max(2, int(round(p * len(P))))
            _glow_line(f, P[:k], rgb, 0.9 * a, width=4.2, glow=7)
            ex, ey = self.node(i)
            if p >= 1:
                ndots = max(1, int(round(10 * n / total)))
                for m in range(ndots):
                    ph = ((u - r0 - 0.55) * 0.7 + m / ndots) % 1.0
                    q = P[min(len(P) - 1, int(ph * (len(P) - 1)))]
                    _dot(f, q, 4.6, rgb, a * clamp(min(ph, 1 - ph) * 10), glow=7)
            e = clamp((u - r0 - 0.45) / 0.3)
            if e > 0:
                _dot(f, (ex - 14, ey), 9 * fm_spring(u - r0 - 0.45, 400, 20) + 0.01, rgb, a, glow=10)
                cnt = int(round(n * ease_out((u - r0 - 0.45) / 0.9)))
                blit(f, exit_label(title, sub, cnt, rgb), ex + 8, ey - 36, a * e)


# ---------------------------------------------------------------- a window that swings in and settles

class TiltIn:
    """a window's entrance in depth (Spoiler Alert's cards): it swings in from a turn about its vertical axis, a little
    small and faint, and settles flat on its own pixels; drawn through its layer only while it moves"""
    def __init__(self, win, u0, dur=0.85, ang=26.0, dz=0.10, side=1):
        self.win, self.u0, self.dur, self.ang, self.dz, self.side = win, u0, dur, ang, dz, side
        self.win.enter = False
    def draw(self, f, u, L):
        if u < self.u0: return
        if u >= self.u0 + self.dur:
            self.win.draw(f, u, L); return
        p = clamp((u - self.u0) / self.dur)
        e = 1 - fm_spring(u - self.u0, 170, 22)     # what is left of the turn
        A = np.zeros_like(f); B = np.ones_like(f)
        self.win.draw(A, u, L); self.win.draw(B, u, L)
        alpha = np.clip(1 - (B - A).mean(axis=2), 0, 1)
        # the layer's bounds: the window with its bar, its tag and its shadow
        (x0, y0, x1, y1), *_ = self.win.transform(u, L)
        top = y0 - BAR - 70
        rect = np.float32([[x0 - 60, top], [x1 + 60, top], [x1 + 60, y1 + 90], [x0 - 60, y1 + 90]])
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        th = math.radians(self.ang * e * self.side)
        s = 1 - self.dz * e
        fz = 1800.0
        dst = []
        for X, Y in rect:
            x, y = (X - cx) * s, (Y - cy) * s
            xr, zr = x * math.cos(th), x * math.sin(th)
            k = fz / (fz + zr)
            dst.append([cx + xr * k, cy + y * k])
        dst = np.float32(dst)
        M = cv2.getPerspectiveTransform(rect, dst)
        ox, oy = 0, 0
        layer = cv2.warpPerspective(A, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        am = cv2.warpPerspective(alpha, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        fa = clamp(p / 0.3)
        f *= (1 - am[..., None] * fa)
        f += layer * fa


class Checklist:
    """a short list ticked as the voice reaches each line (Spoiler Alert's): the check draws itself in its disc as the
    line slides in. items: [(title, sub, u)]"""
    def __init__(self, x, y, items, u1, gap=92, width=520):
        self.x, self.y, self.items, self.u1, self.gap = x, y, items, u1, gap
        self.spr = [(words_sprite(head=t, width=width, hsize=30), text_sprite(s, 'g', 22, 520, (170, 196, 182)) if s else None, u) for t, s, u in items]
    def draw(self, f, u, L=None):
        for i, (ts, ss, t0) in enumerate(self.spr):
            a = fade(u, t0, self.u1, 0.25, 0.3)
            if a <= 0: continue
            y = self.y + i * self.gap
            e = ease_out((u - t0) / 0.45)
            sp = fm_spring(u - t0, 400, 22)
            _dot(f, (self.x + 22, y + 24), 21 * sp + 0.01, (52, 211, 128), a, glow=6, core=(31, 149, 99))
            # the tick, drawn on
            p = ease_in_out((u - t0 - 0.12) / 0.35)
            if p > 0:
                pts = np.float32([[self.x + 12, y + 25], [self.x + 19, y + 32], [self.x + 33, y + 16]])
                seg = np.linalg.norm(pts[1] - pts[0]); tot = seg + np.linalg.norm(pts[2] - pts[1]); d = p * tot
                if d <= seg: P = np.float32([pts[0], pts[0] + (pts[1] - pts[0]) * d / seg])
                else: P = np.float32([pts[0], pts[1], pts[1] + (pts[2] - pts[1]) * (d - seg) / (tot - seg)])
                _glow_line(f, P, (255, 255, 255), a, width=4.0, glow=1.5)
            blit(f, ts, self.x + 60 + 18 * (1 - e), y - 2, a)
            if ss is not None: blit(f, ss, self.x + 62 + 18 * (1 - e), y + 40, a * clamp((u - t0 - 0.1) / 0.3))


# ---------------------------------------------------------------- the close: the mark draws its route

def _cubic(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def _arc(c, r, a0, a1, n=28):
    t = np.linspace(a0, a1, n)
    return np.stack([c[0] + r * np.cos(t), c[1] + r * np.sin(t)], 1)


# the mark in its 64 x 64 viewBox (design3/system/kit.jsx Mark): the squircle, and the S route from the godown dot
SQUIRCLE = np.vstack([_cubic((32, 2), (9.5, 2), (2, 9.5), (2, 32)), _cubic((2, 32), (2, 54.5), (9.5, 62), (32, 62)),
                      _cubic((32, 62), (54.5, 62), (62, 54.5), (62, 32)), _cubic((62, 32), (62, 9.5), (54.5, 2), (32, 2))])
ROUTE = np.vstack([np.array([[43.5, 19], [27, 19]]), _arc((27, 26), 7, -math.pi / 2, -3 * math.pi / 2)[1:],
                   np.array([[37, 33]]), _arc((37, 40), 7, -math.pi / 2, math.pi / 2)[1:], np.array([[20.5, 47]])])
_seg = np.linalg.norm(np.diff(ROUTE, axis=0), axis=1)
ROUTE_S = np.concatenate([[0], np.cumsum(_seg)])
DRAW_EASE = bezier_ease(0.65, 0, 0.35, 1)


class MarkDraw:
    """the Smart-Clearance mark as the design system plays it (kit.jsx Mark): the squircle springs in, the godown dot
    pops, the S route draws itself from it, the amber pin drops onto its end and pings. Drawn at 4x, then reduced."""
    def __init__(self, cx, cy, size, u0):
        self.cx, self.cy, self.size, self.u0 = cx, cy, size, u0
        S = 4; n = size * S
        y, x = np.mgrid[0:n, 0:n].astype(np.float32) / S * 64 / size
        k = np.clip(((x - 8) * 50 + (y - 4) * 58) / (50 * 50 + 58 * 58), 0, 1)    # the gradient from (8,4) to (58,62)
        c0, c1, c2 = np.array([0x7f, 0xbf, 0x2f]), np.array([0x58, 0x82, 0x17]), np.array([0x3e, 0x5a, 0x0d])  # BGR
        g = np.where(k[..., None] < 0.55, c0 + (c1 - c0) * (k[..., None] / 0.55), c1 + (c2 - c1) * ((k[..., None] - 0.55) / 0.45))
        self.grad = g.astype(np.float32) / 255
        hl = np.clip(1 - (y - 2) / 32, 0, 1) * 0.28
        self.hl = hl.astype(np.float32)
    def draw(self, f, u, L=None):
        t = u - self.u0
        if t <= 0: return
        S = 4; n = self.size * S; sc = n / 64
        layer = np.zeros((n, n, 3), np.float32); alpha = np.zeros((n, n), np.float32)
        # the squircle
        s_sq = 0.55 + 0.45 * fm_spring(t, 260, 18); o_sq = clamp(t / 0.25)
        m = np.zeros((n, n), np.float32)
        pts = ((SQUIRCLE - 32) * s_sq + 32) * sc
        cv2.fillPoly(m, [np.round(pts * 16).astype(np.int32)], 1.0, cv2.LINE_AA, shift=4)
        m *= o_sq
        top = np.zeros((n, n), np.float32)
        cv2.fillPoly(top, [np.round(pts * 16).astype(np.int32)], 1.0, cv2.LINE_AA, shift=4)
        col_ = self.grad * (1 - self.hl[..., None]) + self.hl[..., None]
        layer = col_ * m[..., None]; alpha = m.copy()
        def paint(mask, rgb):
            nonlocal layer, alpha
            layer = layer * (1 - mask[..., None]) + np.asarray(rgb, np.float32) * mask[..., None]
            alpha = alpha * (1 - mask) + mask
        # the S route, drawn on from the godown
        p = DRAW_EASE(clamp((t - 0.25) / 0.75))
        if p > 0.004:
            L_ = p * ROUTE_S[-1]
            k = int(np.searchsorted(ROUTE_S, L_))
            P = ROUTE[:k].tolist()
            if k < len(ROUTE):
                a0, a1 = ROUTE[k - 1], ROUTE[k]; s0, s1 = ROUTE_S[k - 1], ROUTE_S[k]
                P.append((a0 + (a1 - a0) * (L_ - s0) / max(1e-6, s1 - s0)).tolist())
            P = np.array(P) * sc
            mk = np.zeros((n, n), np.float32)
            cv2.polylines(mk, [np.round(P * 16).astype(np.int32)], False, 1.0, int(round(6 * sc)), cv2.LINE_AA, shift=4)
            for q in (P[0], P[-1]):
                cv2.circle(mk, tuple(np.round(q * 16).astype(int)), int(round(3 * sc * 16)), 1.0, -1, cv2.LINE_AA, shift=4)
            paint(mk, (1, 1, 1))
        # the godown dot
        sd = fm_spring(t - 0.18, 500, 20) if t > 0.18 else 0
        if sd > 0:
            c = np.array([43.5, 19]) * sc
            mk = np.zeros((n, n), np.float32); cv2.circle(mk, tuple(np.round(c * 16).astype(int)), int(round((3.4 + 1.3) * sd * sc * 16)), 1.0, -1, cv2.LINE_AA, shift=4)
            paint(mk, (1, 1, 1))
            mk = np.zeros((n, n), np.float32); cv2.circle(mk, tuple(np.round(c * 16).astype(int)), int(round((3.4 - 1.3) * sd * sc * 16)), 1.0, -1, cv2.LINE_AA, shift=4)
            paint(mk, (0x3e / 255, 0x5a / 255, 0x0d / 255))
        # the pin drops onto the route's end, and pings
        sp = fm_spring(t - 0.95, 520, 14) if t > 0.95 else 0
        if sp > 0:
            c = np.array([20.5, 47 - 16 * (1 - sp)]) * sc
            r = 5.2 * (0.6 + 0.4 * sp)
            mk = np.zeros((n, n), np.float32); cv2.circle(mk, tuple(np.round(c * 16).astype(int)), int(round((r + 1.1) * sc * 16)), 1.0, -1, cv2.LINE_AA, shift=4)
            paint(mk * clamp((t - 0.95) / 0.15), (1, 1, 1))
            mk = np.zeros((n, n), np.float32); cv2.circle(mk, tuple(np.round(c * 16).astype(int)), int(round((r - 1.1) * sc * 16)), 1.0, -1, cv2.LINE_AA, shift=4)
            paint(mk * clamp((t - 0.95) / 0.15), (0x4a / 255, 0xc0 / 255, 0xf7 / 255))
        lay = cv2.resize(layer, (self.size, self.size), interpolation=cv2.INTER_AREA)
        al = cv2.resize(alpha, (self.size, self.size), interpolation=cv2.INTER_AREA)
        x0, y0 = int(round(self.cx - self.size / 2)), int(round(self.cy - self.size / 2))
        over(f, x0, y0, lay, al)
        # the ping, round the pin (outside the mark, so drawn in the frame)
        pt = t - 1.1
        if 0 < pt < 0.9:
            q = pt / 0.9
            c = (x0 + 20.5 * self.size / 64, y0 + 47 * self.size / 64)
            rr = 5 * (0.6 + 1.6 * ease_out(q)) * self.size / 64
            ring(f, c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr, rr, 1.0, (0.9 * (1 - q)), color=(247, 192, 74), width=2.0 * self.size / 64, glow=False)


class EndCard4:
    """the close, shorter (cut 4): the mark draws its route, the name slides out from behind it, the line lands word by
    word with the voice, then the four addresses and the stack"""
    def __init__(self, L, words, bg=None):
        self.L = L
        self.mark = MarkDraw(414, 370, 176, 0.25)
        self.name = words_sprite(head='Smart-Clearance', width=1100, hsize=96)
        self.line = Kinetic(544, 470, [words], size=40, kind='g', wght=620, rgb=(200, 222, 210))
        self.urls = [url_line(*x) for x in [('smartclearance.web.app', 'the platform'), ('smartclearance-console.web.app', 'the console'),
                                             ('munchly-smartclearance.web.app', "a client's workspace"), ('smartclearance-demo.web.app', 'the guided demo')]]
        self.foot = words_sprite(kicker='BUILT ON GEMINI · GOOGLE ADK · CLOUD RUN · FIREBASE · GOOGLE AI HACKATHON 2026', width=1500)
        self.bg = bg
    def draw(self, f, u, L=None):
        if self.bg is None:
            o = Orbit().frame(700)
            self.bg = cv2.GaussianBlur(o.astype(np.float32) / 255, (0, 0), 9) * 0.3 + studio() * 0.7
        # the ground drifts in slowly (it is soft, so it moves without a shimmer); the words stay on their pixels
        f[:] = _zoom(self.bg, 1 + 0.05 * ease_in_out(u / max(1e-3, self.L)), (W / 2, H / 2))
        # a soft light that opens behind the mark
        self.mark.draw(f, u)
        # the name, out from behind the mark
        e = ease_out((u - 0.85) / 0.7)
        if e > 0:
            spr = self.name; h, w = spr.shape[:2]
            x_end = 544; x = 414 + (x_end - 414) * e
            vis = int(clamp(x + w - 504, 0, w))        # nothing shows left of the mark's right edge
            cut = w - vis
            if vis > 0: blit(f, spr[:, cut:], x + cut, 302, clamp((u - 0.85) / 0.3))
        self.line.draw(f, u)
        for i, s_ in enumerate(self.urls):
            t0 = 2.9 + i * 0.16
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, 544 + (i % 2) * 440, 590 + (i // 2) * 74 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
        a = clamp((u - 3.6) / 0.6)
        if a > 0: blit(f, self.foot, 548, 770, a)
