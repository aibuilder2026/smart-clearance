"""SC-211: the sales film v2's own parts, over SC-210's compositor (parts10 and everything under it).

- PageScene: a scene page captured frame-exact (capture-page.mjs) as the whole frame: the agents as a graph (graph11),
  every team's part (teams11), installed as an app (pwa11), the audit trail (audit11), the platform watching itself
  (ops11);
- TalkShot11: a talking scene made by LTX on this machine, the speaker looking into the lens, the voice made with the
  picture: its clip (prep11.py, clips/talk-<id>.mp4) starts `pre` seconds before the line, so the person is seen
  settling before speaking and after the last word, and plays frame for frame at 25 fps;
- ScreenPop: what a person sees on the screen in their hands, springing out of the device: the production app as
  recorded, playing, or a still;
- StreakReveal, Letterbox, ScanBeam: the opening's light: a slit of light that opens on the godown, the bars of a
  wide frame that open as the story begins, a scanner's line passing over the cartons;
- bloom(): the light's own glow on a frame's brightest parts (a shot's `bloom`);
- transition(): how one shot hands over to the next (a shot's `xin`): a dissolve, a cut, a whip pan, a push through,
  a light leak, a white flash, a dip to black, a focus pull."""
import json, math
from pathlib import Path
from functools import lru_cache
from parts10 import *
import parts10 as P10

# ---------------------------------------------------------------- a scene page, captured frame-exact

class PageScene:
    """build/<name>/f%05d.jpg (capture-page.mjs, 25 fps) as the whole frame, its scene time the shot's own"""
    def __init__(self, folder):
        self.dir = Path(folder)
        meta = json.loads((self.dir / 'frames.json').read_text())
        self.n, self.fps = meta['n'], meta['fps']
        self.cache = (None, None)
    def draw(self, f, u, L=None):
        k = int(clamp(round(u * self.fps), 0, self.n - 1))
        if self.cache[0] != k:
            im = cv2.imread(str(self.dir / f'f{k:05d}.jpg'))
            self.cache = (k, im.astype(np.float32) / 255)
        f[:] = self.cache[1]


# ---------------------------------------------------------------- the talking scenes, made here

class TalkShot11:
    """a talking scene (prep11.py: clips/talk11-<lid>.mp4, 24 fps, 1920 x 1080, starting `pre` before the line): played
    frame for frame at 25 fps from u_clip (the shot's time its first frame shows; before it, that frame held), under a
    slow push towards the face; the person's part in the story as a tag once they have begun"""
    def __init__(self, lid, u_clip, role=None, sub=None, icon='users', z=(1.0, 1.04), pt=(W * 0.5, H * 0.42), dur=8.0,
                 tag_at=0.9, tag_for=3.2):
        self.foot = Footage(f'talk11-{lid}', push=0.0)
        self.u_clip, self.z, self.pt, self.dur = u_clip, z, pt, dur
        self.tag = RoleTag(role, sub, u_clip + tag_at, u_clip + tag_at + tag_for, icon) if role else None
    def draw(self, f, u, L=None):
        img, _ = self.foot.frame(max(0.0, u - self.u_clip))
        z = self.z[0] + (self.z[1] - self.z[0]) * ease_in_out(clamp(u / self.dur))
        f[:] = P10._zoom(img.astype(np.float32) / 255, z, self.pt)
        if self.tag: self.tag.draw(f, u)


# ---------------------------------------------------------------- what a person sees on their screen

class ScreenPop:
    """what a person sees on the screen they hold, springing out of the device: two pings off the device, a stem to the
    side, and the screen itself on a glass card (a recording's device screen playing from t_src, or a still image), so
    the viewer sees what the person sees. at: the device in the frame; side: +1 the card to its right, -1 to its left."""
    def __init__(self, at, u0, u1, rec=None, dev=None, t_src=0.0, rate=1.0, img=None, width=330, side=1, rise=-70,
                 kicker=None, crop=None):
        self.at, self.u0, self.u1, self.side, self.rise, self.rate = at, u0, u1, side, rise, rate
        self.t_src, self.crop = t_src, crop
        if img is not None:
            self.still = img.astype(np.float32) / 255 if img.dtype == np.uint8 else img
            sw0, sh0 = self.still.shape[1], self.still.shape[0]
            self.src = None
        else:
            r = DEV[dev]
            self.src = FrameSource(REC[rec], rect=r, fps=25)
            sw0, sh0 = r[2], r[3]
            self.still = None
        if crop: sw0, sh0 = crop[2], crop[3]
        self.w = width; self.h = round(width * sh0 / sw0)
        self.kick = kicker_sprite(kicker, (232, 242, 236), 14) if kicker else None
        self.cache = (None, None)

    def screen(self, u):
        if self.still is not None:
            img = self.still
        else:
            k = round((self.t_src + max(0.0, u - self.u0) * self.rate) * 25)
            if self.cache[0] == k: return self.cache[1]
            img = self.src.get(k / 25).astype(np.float32) / 255
        if self.crop:
            x, y, w, h = self.crop
            img = img[y:y + h, x:x + w]
        out = cv2.resize(img, (self.w, self.h), interpolation=cv2.INTER_AREA)
        if self.still is None: self.cache = (k, out)
        return out

    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u1 + 0.35: return
        ax, ay = self.at
        out_ = clamp((u - self.u1) / 0.35)
        a = clamp((u - self.u0) / 0.15) * (1 - out_)
        for d_ in (0.0, 0.22):
            q = (u - self.u0 - d_) / 0.8
            if 0 <= q < 1:
                rr = 10 + 66 * ease_out(q)
                ring(f, ax - rr, ay - rr, ax + rr, ay + rr, rr, 1.0, 0.8 * (1 - q), color=G, width=2.4, glow=True)
        P10._dot(f, (ax, ay), 5, G, a, glow=8)
        p = fm_spring(u - self.u0 - 0.1, 190, 18)
        bw, bh = self.w + 20, self.h + 20
        ex = ax + self.side * (70 + 50 * p)
        ey = ay + self.rise * p
        x0 = ex if self.side > 0 else ex - bw
        x0 = min(max(x0, 40), W - 40 - bw)
        y0 = min(max(ey - bh / 2, 40), H - 40 - bh)
        sx = x0 if self.side > 0 else x0 + bw
        line(f, (ax, ay), (ax + (sx - ax) * min(1, p * 1.4), ay + (y0 + bh / 2 - ay) * min(1, p * 1.4)), G, alpha=0.9 * a, width=2.2, dot=False)
        k = a * clamp(p * 1.6)
        if k <= 0.01: return
        sc = 0.72 + 0.28 * p
        cx, cy = x0 + bw / 2, y0 + bh / 2
        X0, Y0, X1, Y1 = cx - bw / 2 * sc, cy - bh / 2 * sc, cx + bw / 2 * sc, cy + bh / 2 * sc
        shadow(f, X0, Y0, X1, Y1, 22 * sc, alpha=0.55 * k, blur=40, dy=18)
        ix0, iy0, al = rrect_alpha(X0, Y0, X1, Y1, 22 * sc)
        over(f, ix0, iy0, col((17, 23, 20)), al * k)
        scr = self.screen(u)
        if sc < 0.999: scr = cv2.resize(scr, (max(2, round(self.w * sc)), max(2, round(self.h * sc))), interpolation=cv2.INTER_AREA)
        sx0, sy0 = int(round(X0 + 10 * sc)), int(round(Y0 + 10 * sc))
        jx0, jy0, am = rrect_alpha(sx0, sy0, sx0 + scr.shape[1], sy0 + scr.shape[0], 14 * sc, pad=0)
        am = am[:scr.shape[0], :scr.shape[1]]
        h_, w_ = am.shape
        over(f, sx0, sy0, scr[:h_, :w_], am * k)
        # a soft sheen across the glass as it lands
        sp = (u - self.u0 - 0.15) / 0.7
        if 0 < sp < 1:
            gx = X0 + (X1 - X0) * sp
            jx, jy, gm = rrect_alpha(X0, Y0, X1, Y1, 22 * sc)
            xs = np.arange(gm.shape[1], dtype=np.float32) + jx
            band = np.exp(-((xs - gx) / 40) ** 2)[None, :] * 0.18 * math.sin(math.pi * sp)
            over(f, jx, jy, np.ones(3, np.float32), (gm * band * k).astype(np.float32))
        if self.kick is not None:
            blit(f, self.kick, X0 + 4, Y0 - self.kick.shape[0] - 8, k)


def pop_card(title, body, tag, w=420, accent='g'):
    return card_sprite(title, body, tag, w, accent)


# ---------------------------------------------------------------- the opening's light

class StreakReveal:
    """the film opens on a slit of light: a bright horizontal line in the dark that widens into the picture, its edges
    glowing, with an anamorphic streak through it"""
    def __init__(self, u0=0.15, dur=1.5, tint=(150, 255, 210)):
        self.u0, self.dur, self.tint = u0, dur, np.float32(tint[::-1]) / 255
        self.yy = (np.arange(H, dtype=np.float32) - H / 2)[:, None]
    def draw(self, f, u, L=None):
        p = (u - self.u0) / self.dur
        if p >= 1.0: return
        if p <= 0: f[:] = 0; return
        e = ease_in_out(p) ** 1.15
        hh = 1.5 + (H / 2 + 8) * e
        m = np.clip((hh - np.abs(self.yy)) / (2 + 26 * e), 0, 1)
        f *= m[..., None]
        edge = np.exp(-((np.abs(self.yy) - hh) / (3 + 10 * e)) ** 2) * (1 - e) ** 0.7
        f += (edge * 0.9)[..., None] * self.tint
        k = math.sin(math.pi * clamp(p * 1.15)) * 0.8
        streak = np.exp(-(self.yy / (2 + 3 * e)) ** 2) * k
        f += streak[..., None] * self.tint * (0.6 + 0.4 * np.exp(-((np.arange(W, dtype=np.float32) - W / 2) / (W * 0.45)) ** 2))[None, :, None]


class Letterbox:
    """the wide frame's bars (2.39:1) for the opening, drawn back as the story begins"""
    def __init__(self, u_open, dur=1.2, ratio=2.39, u_close=None):
        self.uo, self.dur, self.bar = u_open, dur, (H - W / ratio) / 2
        self.uc = u_close
    def draw(self, f, u, L=None):
        k = 1 - ease_in_out((u - self.uo) / self.dur)
        if self.uc is not None: k = max(k, ease_in_out((u - self.uc) / self.dur))
        b = self.bar * k
        if b < 0.3: return
        bi = int(b); fr = b - bi
        f[:bi] = 0; f[H - bi:] = 0
        if bi < H // 2:
            f[bi] *= 1 - fr; f[H - bi - 1] *= 1 - fr


class ScanBeam:
    """a scanner's line of light passing over the frame from left to right, a soft green glow on its trailing side"""
    def __init__(self, u0, dur=1.6, x0=-100, x1=W + 100):
        self.u0, self.dur, self.x0, self.x1 = u0, dur, x0, x1
        self.xs = np.arange(W, dtype=np.float32)[None, :]
    def draw(self, f, u, L=None):
        p = (u - self.u0) / self.dur
        if p <= 0 or p >= 1: return
        x = self.x0 + (self.x1 - self.x0) * ease_in_out(p)
        k = math.sin(math.pi * p)
        core = np.exp(-((self.xs - x) / 2.2) ** 2)
        trail = np.exp(-np.clip(x - self.xs, 0, None) / 160) * (self.xs <= x)
        g = (core * 0.85 + trail * 0.10) * k
        f[:] = 1 - (1 - f) * (1 - g[..., None] * np.float32([0.62, 1.0, 0.55]))


# ---------------------------------------------------------------- the light's glow, and the hand-over between shots

def bloom(f, amt, thresh=0.74):
    """the brightest parts of the frame glow: a bright pass, blurred wide at a quarter size, added back as light"""
    if amt <= 0: return f
    small = cv2.resize(f, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    br = np.clip(small - thresh, 0, None)
    br = cv2.GaussianBlur(br, (0, 0), 9) * 0.6 + cv2.GaussianBlur(br, (0, 0), 26) * 0.6
    g = cv2.resize(br, (W, H), interpolation=cv2.INTER_LINEAR)
    return 1 - (1 - f) * (1 - np.clip(g * amt * 1.6, 0, 1))


def _zoom_blur(img, s, spread, cx=W / 2, cy=H / 2, n=4):
    """img scaled by s about (cx, cy), averaged over n scales spread around it: a zoom's blur"""
    acc = np.zeros_like(img)
    for i in range(n):
        si = s * (1 + spread * (i / max(1, n - 1) - 0.5))
        M = np.float32([[si, 0, (1 - si) * cx], [0, si, (1 - si) * cy]])
        acc += cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return acc / n


def _shift_blur(img, dx, k):
    M = np.float32([[1, 0, dx], [0, 1, 0]])
    out = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    k = int(k)
    if k >= 3: out = cv2.blur(out, (k, 1))
    return out


_LEAK = None
def _leak_field(p, side=1):
    global _LEAK
    if _LEAK is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        _LEAK = (xx / W, yy / H)
    xx, yy = _LEAK
    cx = (-0.15 + 1.3 * p) if side > 0 else (1.15 - 1.3 * p)
    d = np.sqrt(((xx - cx) / 0.6) ** 2 + ((yy - 0.4) / 0.95) ** 2)
    return np.clip(1 - d, 0, 1) ** 1.8


def transition(kind, a, b, p, opt=None):
    """the frame between two shots, p 0..1 across the hand-over (a the outgoing, b the incoming)"""
    opt = opt or {}
    if kind == 'cut':
        return b if p >= 0.5 else a
    if kind == 'whip':
        d = opt.get('dir', 1)
        e = ease_in_out(p)
        k = 260 * math.sin(math.pi * p) ** 1.5
        aa = _shift_blur(a, -d * W * 0.45 * e ** 2, k)
        bb = _shift_blur(b, d * W * 0.45 * (1 - e) ** 2, k)
        w = clamp((p - 0.38) / 0.24)
        out = aa * (1 - w) + bb * w
        return out * (1 + 0.10 * math.sin(math.pi * p))
    if kind == 'zoom':
        e = ease_in_out(p)
        cx, cy = opt.get('pt', (W / 2, H / 2))
        sp = 0.10 * math.sin(math.pi * p)
        aa = _zoom_blur(a, 1 + 0.45 * e ** 2, sp, cx, cy)
        bb = _zoom_blur(b, 1.18 - 0.18 * ease_out(p), sp, W / 2, H / 2)
        w = clamp((p - 0.42) / 0.16)   # the switch inside the blur's peak, so two faces never ghost through each other
        out = aa * (1 - w) + bb * w
        return out * (1 + 0.12 * math.sin(math.pi * p))
    if kind == 'leak':
        e = ease_in_out(p)
        out = a * (1 - e) + b * e
        m = _leak_field(p, opt.get('side', 1)) * math.sin(math.pi * p) ** 1.3 * opt.get('power', 0.9)
        tint = np.float32(opt.get('tint', (80, 170, 255))) / 255
        return 1 - (1 - out) * (1 - m[..., None] * tint[None, None, :])
    if kind == 'flash':
        out = b if p >= 0.5 else a
        w = math.exp(-((p - 0.5) / 0.14) ** 2) * opt.get('power', 0.85)
        return out * (1 - w) + w
    if kind == 'dip':
        e = ease_in_out(p)
        return a * clamp(1 - 2 * e) + b * clamp(2 * e - 1)
    if kind == 'blur':
        e = ease_in_out(p)
        s = 1 + 16 * math.sin(math.pi * p)
        aa = cv2.GaussianBlur(a, (0, 0), s); bb = cv2.GaussianBlur(b, (0, 0), s)
        return aa * (1 - e) + bb * e
    e = ease_in_out(p)
    return a * (1 - e) + b * e


class PhonePopAt:
    """PhonePop (parts6) with the card set where the frame is clear (x0, y0: its top-left once landed): the pings off the
    device, a stem drawn from the device to the card's nearest edge, the card springing in from the device's side"""
    def __init__(self, at, u0, u1, card_xy, push=None, card=None, width=420):
        self.at, self.u0, self.u1, self.xy = at, u0, u1, card_xy
        self.spr = push_sprite(push, width) if push else card
    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u1 + 0.3: return
        ax, ay = self.at
        out_ = clamp((u - self.u1) / 0.3)
        a = clamp((u - self.u0) / 0.15) * (1 - out_)
        for d_ in (0.0, 0.25):
            q = (u - self.u0 - d_) / 0.8
            if 0 <= q < 1:
                rr = 10 + 60 * ease_out(q)
                ring(f, ax - rr, ay - rr, ax + rr, ay + rr, rr, 1.0, 0.8 * (1 - q), color=G, width=2.4, glow=True)
        P10._dot(f, (ax, ay), 5, G, a, glow=8)
        p = fm_spring(u - self.u0 - 0.12, 190, 19)
        sw, sh = self.spr.shape[1], self.spr.shape[0]
        x0, y0 = self.xy
        # the card travels out from the device to its place
        cx0 = ax + (x0 - ax) * p if p < 1 else x0
        cy0 = ay - sh / 2 + (y0 - (ay - sh / 2)) * p
        ex = min(max(ax, cx0), cx0 + sw); ey = min(max(ay, cy0), cy0 + sh)
        line(f, (ax, ay), (ax + (ex - ax) * min(1, p * 1.4), ay + (ey - ay) * min(1, p * 1.4)), G, alpha=0.9 * a, width=2.2, dot=False)
        blit(f, self.spr, cx0, cy0, a * clamp(p * 1.6), scale=0.7 + 0.3 * min(1.0, p))
