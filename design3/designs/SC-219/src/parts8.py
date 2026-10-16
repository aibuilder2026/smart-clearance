"""SC-218 cut 8: the parts cut 8 adds to cut 7's (parts … parts7).

- WalkBG: the person at work, behind their own screen: their clip played back and forth with eased turns (no loop, no
  held frame), framed on the person so they sit beside the screen, not under it, softly out of focus, with a slow push.
- PageSeq: a scene page captured frame by frame (arch8), played as the shot's whole frame.
- EndCard8: the close in one card: the mark, the line, the stack, the guided demo with its QR code, the sign-ins and the
  sample data (cut 7's two closing scenes in one)."""
import math
from functools import lru_cache
import cv2
import numpy as np
from kit import *
import fx
from parts import words_sprite
from parts5 import qr_sprite, EndCard5, MarkDraw, ink_left
from parts6 import EndCard6, access_line

CLIPS = HERE / 'clips'
_CACHE = {}


def clip_frames(key, scale=0.5):
    """every frame of a person's clip, decoded once at half size (a background is softened anyway): (n, h, w, 3) uint8"""
    k = (key, scale)
    if k not in _CACHE:
        path = CLIPS / f'{key}.mp4'
        w, h = int(1920 * scale), int(1088 * scale)
        import subprocess
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'scale={w}:{h}:flags=lanczos', '-f', 'rawvideo',
                              '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
        _CACHE[k] = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    return _CACHE[k]


class WalkBG:
    """The person behind their screen. px, py: where the person is in the clip (1920 x 1088 pixels); X: where they
    should sit in the frame, beside the screen; the crop's zoom is the least that puts them there (or `zoom`).
    The clip plays forward then back, each turn eased (its speed falls to nothing and rises again), at most ~1.1x
    its own pace in between; never held, never looped with a jump. blur and dim keep it behind the screen; a shade
    darkens the side the screen is on, so the screen stands out."""
    def __init__(self, key, px, X, py=None, zoom=None, blur=2.6, dim=0.26, push=0.035, shade='right', still=None):
        self.key, self.blur, self.dim, self.push, self.shade = key, blur, dim, push, shade
        self.still = still
        need = (1920 - X) / max(1.0, 1920 - px) if X < px else (X / max(1.0, px) if X > px else 1.0)
        self.zoom = max(1.0, zoom if zoom is not None else need * 1.02)
        self.px, self.X = px, X
        self.py = py if py is not None else 1088 * 0.42
        self._shade = None

    def _frame(self, u):
        if self.still is not None:
            return self.still
        fr = clip_frames(self.key)
        n = len(fr)
        per = 1.4 * (n - 1) / 25.0                       # a sweep's length: the peak speed ~1.1x the clip's own
        x = (u / per) % 2.0
        tri = x if x <= 1 else 2 - x
        e = 0.5 - 0.5 * math.cos(math.pi * tri)
        return fr[int(round(e * (n - 1)))]

    def draw(self, f, u, L=None):
        img = self._frame(u)
        h, w = img.shape[:2]
        k = w / 1920.0
        z = self.zoom * (1 + self.push * ease_in_out(u / max(1.0, (L or 6.0))))
        cw, ch = w / z, h / z * (1080 / 1088)
        x0 = clamp(self.px * k - self.X * k / z, 0, w - cw)
        y0 = clamp(self.py * k - (540 * k) / z, 0, h - ch)
        M = np.float32([[1920 / cw, 0, -x0 * 1920 / cw], [0, 1080 / ch, -y0 * 1080 / ch]])
        out = cv2.warpAffine(img, M, (1920, 1080), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        out = out.astype(np.float32) / 255
        if self.blur > 0.3:
            out = cv2.GaussianBlur(out, (0, 0), self.blur)
        out *= (1 - self.dim)
        if self.shade:
            if self._shade is None:
                x = np.linspace(0, 1, 1920, dtype=np.float32)
                g = (np.clip((x - 0.30) / 0.45, 0, 1) if self.shade == 'right' else np.clip((0.70 - x) / 0.45, 0, 1))
                v = np.linspace(0, 1, 1080, dtype=np.float32)[:, None]
                top = np.clip((0.34 - v) / 0.34, 0, 1) * 0.55    # the header's ground: a little darker at the top
                self._shade = (1 - 0.5 * g[None, :] ** 1.4) * (1 - top)
                self._shade = self._shade[..., None]
            out *= self._shade
        f[:] = out


class PageSeq:
    """a scene page's frames (capture-page.mjs), at the film's own rate, as the whole frame"""
    def __init__(self, folder):
        from kit import SeqSource
        self.seq = SeqSource(folder, scale=1.0)
    def draw(self, f, u, L=None):
        img = self.seq.get_index(int(round(u * FPS)))
        f[:] = img.astype(np.float32) / 255


class EndCard8(EndCard6):
    """the close, condensed (cut 8): cut 7's card (the mark, the name, the line, the four addresses, the stack, the
    sign-ins and the sample data) with the guided demo's QR code at its right, as the voice names it"""
    URL_AT, URL_STEP, FOOT_AT = 1.6, 0.1, 2.0
    def __init__(self, L, words, t_access, t_demo):
        super().__init__(L, words, t_access)
        self.t_demo = t_demo
        self.qr = qr_sprite(300)                       # a premultiplied sprite, on its white tile
        self.qr_k = words_sprite(kicker='TRY THE GUIDED DEMO', width=420)

    def draw(self, f, u, L=None):
        super().draw(f, u, L)
        a = clamp((u - self.t_demo) / 0.4)
        if a <= 0: return
        e = ease_out((u - self.t_demo) / 0.6)
        # the kicker over the code, the code rising a little into place, clear of the addresses below it
        blit(f, self.qr_k, 1500, 226, a)
        blit(f, self.qr, 1500, 276 + 14 * (1 - e), a)


# ---------------------------------------------------------------- cut 8: the walkthrough's window and its person

from parts import Window


class Walk(Window):
    """a device's screen as the walkthrough plays it: its recording's segments end to end, cut hard from one to the next
    (cut 7 dissolved them for 0.24 s, which read soft); at rest pixel-exact. The window comes in with its shot's push,
    so it has no entrance of its own."""
    def __init__(self, *a, **k):
        k.setdefault('enter', False)
        super().__init__(*a, **k)

    def src_time(self, u, shot_len):
        i, t, prev = super().src_time(u, shot_len)
        return i, t, None

    who_at = ()        # [(u, who)]: the person using the screen changes with a segment (one phone, two kiranas)

    def draw(self, f, u, shot_len):
        for u_, w_ in self.who_at:
            if u >= u_ and not hasattr(self, '_who0'): self._who0 = self.who
        if self.who_at:
            w0 = getattr(self, '_who0', self.who)
            self.who = w0
            for u_, w_ in self.who_at:
                if u >= u_: self.who = w_
        super().draw(f, u, shot_len)

    def u_of(self, rec_t, shot_len):
        """the shot time at which the recording reaches rec_t (in whichever segment holds it)"""
        durs = self.seg_durs(shot_len)
        acc = self.span(shot_len)[0]
        for s, d in zip(self.segs, durs):
            a, b = s[0], s[1]
            if a <= rec_t <= b:
                return acc + (rec_t - a) * d / (b - a)
            acc += d
        raise ValueError(f'{rec_t} is in no segment of {self.segs}')


class At:
    """a background drawn on its own clock: u + offset, so a person's clip runs on unbroken from shot to shot"""
    def __init__(self, bg, offset):
        self.bg, self.offset = bg, offset
    def draw(self, f, u, L=None):
        self.bg.draw(f, u + self.offset, L)


class Breathe(WalkBG):
    """The person behind their screen, out of focus (cut 8b, on the maintainer's note: "blur it more, or else text is
    not clear"): their clip, played to and fro with eased turns, framed so they sit beside the screen, defocused hard
    (a soft shape and its colours, never detail that competes with the words), graded down and a little desaturated,
    with a scrim under the text column, the title band and the foot. The camera breathes instead of pushing once: a
    slow drift of the zoom and a few pixels of pan on the film's own clock, so the person's room moves the same from
    one of their shots to the next."""
    QW, QH = 480, 270      # the room is drawn at a quarter size, defocused there, and scaled up: the same look, cheap

    def __init__(self, *a, period=14.0, amp=0.025, pan=10.0, desat=0.3, **k):
        k.setdefault('blur', 20.0)
        k.setdefault('dim', 0.40)
        super().__init__(*a, **k)
        self.period, self.amp, self.pan, self.desat = period, amp, pan, desat

    def _scrim(self):
        if self._shade is None:
            x = np.linspace(0, 1, W, dtype=np.float32)[None, :]
            y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
            col_ = 0.58 + 0.42 * np.clip((x - 0.16) / 0.30, 0, 1) ** 1.2          # the text column, left
            top = 0.72 + 0.28 * np.clip(y / 0.26, 0, 1)                            # the title band
            foot = 1 - 0.32 * np.clip((y - 0.84) / 0.16, 0, 1)                     # the foot (tags)
            d = ((x - 0.5) / 0.8) ** 2 + ((y - 0.5) / 0.8) ** 2
            vig = 1 - 0.30 * np.clip(d, 0, 1)
            self._shade = (col_ * top * foot * vig)[..., None].astype(np.float32)
        return self._shade

    def draw(self, f, u, L=None):
        img = self._frame(u)
        h, w = img.shape[:2]
        k = w / 1920.0
        ph = 2 * math.pi * u / self.period
        z = self.zoom * (1 + self.amp * (0.5 - 0.5 * math.cos(ph)))
        dx = self.pan * math.sin(ph * 0.5)
        cw, ch = w / z, h / z * (1080 / 1088)
        x0 = clamp(self.px * k - (self.X + dx) * k / z, 0, w - cw)
        y0 = clamp(self.py * k - (540 * k) / z, 0, h - ch)
        QW, QH = self.QW, self.QH
        M = np.float32([[QW / cw, 0, -x0 * QW / cw], [0, QH / ch, -y0 * QH / ch]])
        sm = cv2.warpAffine(img, M, (QW, QH), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REFLECT).astype(np.float32) / 255
        sm = cv2.GaussianBlur(sm, (0, 0), self.blur / 4)
        lum = sm @ np.float32([0.114, 0.587, 0.299])
        sm = sm * (1 - self.desat) + lum[..., None] * self.desat
        sm *= (1 - self.dim)
        out = cv2.resize(sm, (W, H), interpolation=cv2.INTER_CUBIC)
        out *= self._scrim()
        np.clip(out, 0, 1, out=out)
        f[:] = out


# ---------------------------------------------------------------- cut 8b: the step under the hood

from parts4 import _dot
from parts6 import icon_sprite, kicker_sprite
from parts7 import panel, TX, ICON, G, MUTED, INK

KIND_INK = {'device': (214, 226, 220), 'gcp': (52, 211, 128), 'agent': (115, 201, 157), 'model': (176, 150, 255),
            'data': (110, 186, 255)}


def circle_ring(f, cx, cy, r, ink, alpha, width=2.0):
    """a crisp anti-aliased circle outline (no halo)"""
    if alpha <= 0.002: return
    pad = int(r + width + 3)
    x0, y0 = int(cx) - pad, int(cy) - pad
    px, py = grid(max(0, x0), max(0, y0), min(W, x0 + 2 * pad + 1), min(H, y0 + 2 * pad + 1))
    if px.size == 0: return
    d = np.abs(np.hypot(px - cx, py - cy) - r)
    al = np.clip(width / 2 + 0.5 - d, 0, 1).astype(np.float32)
    over(f, max(0, x0), max(0, y0), col(ink), al * alpha)


class StepFlow:
    """The step under the hood (cut 8b, on the maintainer's notes: more on the technology, no part of the frame empty):
    the hops a step takes through the platform, top to bottom, the whole chain shown faint from the start and lit hop by
    hop as the screen beside it shows it happen: a packet runs down each link, the hop's disc pulses once, its name
    brightens and a tick lands. hops: [(icon, name, detail, kind)], kind: device, gcp, agent, model or data."""
    ROW = 84

    def __init__(self, x, y, w, hops, times, u0, u1, title='UNDER THE HOOD · THIS STEP'):
        self.x, self.y, self.w, self.times, self.u0, self.u1 = x, y, w, times, u0, u1
        self.title = kicker_sprite(title, (232, 242, 236), 15)
        self.rows = []
        for icon, name, detail, kind in hops:
            ink = KIND_INK[kind]
            self.rows.append((icon_sprite(icon, 22), TX(name, 'g', 20, 640, INK), TX(detail, 'g', 15, 480, MUTED) if detail else None, ink))
        self.h = 58 + len(hops) * self.ROW
        self.tick = ICON('circle-check', 22, G)

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        e_in = ease_out((u - self.u0) / 0.5)
        y += 10 * (1 - e_in)
        panel(f, x, y, x + w, y + self.h, a, alpha=0.86)
        blit(f, self.title, x + 22, y + 18, a)
        n = len(self.rows)
        R = 21
        cx = x + 22 + R
        for i, (ic, nm, dt, ink) in enumerate(self.rows):
            cy = y + 58 + i * self.ROW + 26
            t = self.times[i]
            lit = clamp((u - t) / 0.25)
            ra = a * (0.36 + 0.64 * lit)
            # the link down to the next hop: faint, then filled as a packet runs it, just before the next hop lights
            if i < n - 1:
                y0c, y1c = cy + R + 4, cy + self.ROW - R - 4
                line(f, (cx, y0c), (cx, y1c), (60, 84, 72), alpha=0.8 * a, width=2.0, dot=False)
                t1 = self.times[i + 1]
                p = clamp((u - (t1 - 0.35)) / 0.35)
                if p > 0:
                    line(f, (cx, y0c), (cx, y0c + (y1c - y0c) * p), self.rows[i + 1][3], alpha=a, width=2.4, dot=False)
                if 0 < p < 1:
                    _dot(f, (cx, y0c + (y1c - y0c) * p), 4.2, self.rows[i + 1][3], a, glow=9)
            # the hop's disc: dark in its ink, ringed once lit, a pulse as it lights
            dark = tuple(int(c * 0.22) for c in ink)
            _dot(f, (cx, cy), R, dark, ra, glow=0.1, core=dark)
            circle_ring(f, cx, cy, R, ink, ra * (0.45 + 0.55 * lit), 2.0)
            q = (u - t) / 0.7
            if 0 <= q < 1:
                circle_ring(f, cx, cy, R + 16 * ease_out(q), ink, (1 - q) * 0.8 * a, 2.0)
            blit(f, ic, cx - 11, cy - 11, ra)
            dx = 14 * (1 - ease_out(clamp((u - t) / 0.4)))
            blit(f, nm, cx + R + 16 + dx * lit, cy - (24 if dt is not None else 12), ra)
            if dt is not None: blit(f, dt, cx + R + 16 + dx * lit, cy + 2, ra * 0.95)
            if lit > 0: blit(f, self.tick, x + w - 22 - 22, cy - 11, a * lit)


# ---------------------------------------------------------------- cut 8b: data in motion

from parts4 import bezier_ease
FLY_EASE = bezier_ease(0.45, 0.0, 0.2, 1.0)


@lru_cache(maxsize=None)
def token_card(icon, title, sub=None, width=None):
    """what moves, as a small glass chip: an icon in a disc, a line in bold, a line in mono"""
    S = 2
    MONO_ = '/System/Library/Fonts/SFNSMono.ttf'
    from PIL import Image, ImageDraw, ImageFont
    fm = ImageFont.truetype(MONO_, 14 * S)
    tw = max(text_w(title, 'g', 18, 680), (fm.getlength(sub) / S if sub else 0))
    w = int(width or (tw + 74 + 22)); h = 64 if sub else 46
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=14 * S, fill=(14, 30, 22, 240), outline=(52, 211, 128, 200), width=int(1.4 * S))
    cy = h / 2
    d.ellipse([12 * S, (cy - 17) * S, 46 * S, (cy + 17) * S], fill=(23, 107, 78, 255))
    draw_text(d, (60 * S, (10 if sub else 12) * S), title, 'g', 18 * S, (240, 246, 242, 255), 680)
    if sub: d.text((60 * S, 36 * S), sub, font=fm, fill=(140, 214, 176, 255))
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    ic = icon_sprite(icon, 18)
    oy, ox = int(cy - 9), 20
    a_ = ic[..., 3:4]
    spr[oy:oy + 18, ox:ox + 18] = spr[oy:oy + 18, ox:ox + 18] * (1 - a_) + ic
    return spr


def photo_token(path, w=150, h=112):
    from parts6 import photo_card
    p = photo_card(path, w, h, 12)
    # a thin light edge, so the photo reads as a thing in flight
    out = np.zeros((h + 6, w + 6, 4), np.float32)
    ix0, iy0, al = rrect_alpha(0, 0, w + 6, h + 6, 15, pad=0)
    al = al[:h + 6, :w + 6]
    out[..., :3] = 0.92 * al[..., None]; out[..., 3] = al
    out[3:3 + h, 3:3 + w] = out[3:3 + h, 3:3 + w] * (1 - p[..., 3:4]) + p
    return out


class DataFly:
    """Data in motion: a token (a photo, a paper, a row, an event) lifts off where it is made and flies along an arc into
    the service that keeps it, shrinking as it goes in, a short trail behind it; where it lands, a ring bursts. src and
    dst: (x, y), or a callable (u, L) -> (x, y) (a point on a window as it moves)."""
    def __init__(self, token, src, dst, t0, dur=0.9, arc=-150, scale_end=0.42):
        self.token, self.src, self.dst, self.t0, self.dur, self.arc, self.se = token, src, dst, t0, dur, arc, scale_end
        self.t_land = t0 + dur

    def _pt(self, p, u, L):
        sx, sy = self.src(u, L) if callable(self.src) else self.src
        dx, dy = self.dst(u, L) if callable(self.dst) else self.dst
        cx, cy = (sx + dx) / 2, min(sy, dy) + self.arc
        x = (1 - p) ** 2 * sx + 2 * (1 - p) * p * cx + p * p * dx
        y = (1 - p) ** 2 * sy + 2 * (1 - p) * p * cy + p * p * dy
        return x, y

    def draw(self, f, u, L=None):
        h, w = self.token.shape[:2]
        if self.t0 <= u <= self.t_land:
            q = (u - self.t0) / self.dur
            lift = clamp(q / 0.2)
            p = FLY_EASE(clamp((q - 0.12) / 0.88))
            sc = (0.86 + 0.14 * ease_out(lift)) * (1 - (1 - self.se) * p)
            a = clamp(q / 0.08) * (1 - clamp((q - 0.9) / 0.1))
            for k in (3, 2, 1):                      # the trail
                pk = FLY_EASE(clamp((q - 0.12 - 0.035 * k) / 0.88))
                if pk <= 0 or pk >= p: continue
                x, y = self._pt(pk, u, L)
                blit(f, self.token, x, y, a * 0.16 * (4 - k) / 3, scale=sc * (1 - 0.06 * k), ox=w / 2, oy=h / 2)
            x, y = self._pt(p, u, L)
            shadow(f, x - w * sc / 2, y - h * sc / 2, x + w * sc / 2, y + h * sc / 2, 12, alpha=0.45 * a, blur=22, dy=12)
            blit(f, self.token, x, y, a, scale=sc, ox=w / 2, oy=h / 2)
        q = (u - self.t_land) / 0.6
        if 0 <= q < 1:
            dx, dy = self.dst(u, L) if callable(self.dst) else self.dst
            circle_ring(f, dx, dy, 12 + 34 * ease_out(q), G, (1 - q) * 0.9, 2.4)


class ServiceBadge:
    """the Google Cloud service that keeps what flies in: its icon, its name and the place (a bucket, a table), mono;
    it pulses as each token lands"""
    def __init__(self, x, y, icon, name, place, u0, u1, lands=(), w=600):
        self.x, self.y, self.u0, self.u1, self.lands, self.w = x, y, u0, u1, lands, w
        self.icon, self.name = icon_sprite(icon, 24), TX(name, 'g', 21, 680, INK)
        from parts6 import mono_w
        size = 15
        while size > 11 and mono_w(place, size) > w - 92: size -= 1
        self.place = _mono_sprite(place, size)

    def at(self):
        return (self.x + 40, self.y + 38)

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        hit = max([1 - clamp((u - t) / 0.5) for t in self.lands if u >= t] + [0.0])
        panel(f, x, y, x + w, y + 76, a, alpha=0.88, edge_a=0.45 + 0.5 * hit)
        _dot(f, (x + 40, y + 38), 22 + 4 * hit, (14, 60, 43), a, glow=0.1 + 8 * hit, core=(14, 60, 43))
        circle_ring(f, x + 40, y + 38, 22 + 4 * hit, G, a * (0.6 + 0.4 * hit), 2.0)
        blit(f, self.icon, x + 28, y + 26, a)
        blit(f, self.name, x + 76, y + 12, a)
        blit(f, self.place, x + 77, y + 44, a)


@lru_cache(maxsize=None)
def _mono_sprite(text, size, rgb=(140, 214, 176)):
    from PIL import Image, ImageDraw, ImageFont
    S = 2
    fm = ImageFont.truetype('/System/Library/Fonts/SFNSMono.ttf', size * S)
    w = int(fm.getlength(text) / S) + 4; h = int(size * 1.5)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((0, 0), text, font=fm, fill=rgb + (255,))
    return to_sprite(im.resize((w, h), Image.LANCZOS))


def win_pt(win, rect):
    """a callable: the centre of a rect on a window's screen (device pixels), in the frame, as the window moves"""
    def f(u, L):
        (x0, y0, x1, y1), _, _ = win.to_out(u, L, rect)
        return ((x0 + x1) / 2, (y0 + y1) / 2)
    return f


def hop_pt(flow, i):
    """a callable: the centre of a StepFlow hop's disc"""
    def f(u, L):
        e = ease_out((u - flow.u0) / 0.5)
        return (flow.x + 22 + 21, flow.y + 10 * (1 - e) + 58 + i * flow.ROW + 26)
    return f


# ---------------------------------------------------------------- cut 8b: a notification, seen on the device first

from parts import push_sprite


class PushOut:
    """A notification as the device shows it, then held up to read (cut 8b, on the maintainer's note: the pop-ups seen
    first in the application window, so it reads as the live app). It drops in at the top of the app's own screen with
    a spring and holds there, so it is seen arriving on the device; then it lifts out of the window along a short arc and
    settles, larger, beside it, until u1. own=False: the recording already shows the push on the device (src: its rect,
    device pixels), and the copy lifts out from there."""
    def __init__(self, win, key, u_drop, u_lift, dst, w_dst, u1, own=True, src=None, dur=0.7):
        self.win, self.key, self.u_drop, self.u_lift, self.dst, self.w_dst, self.u1 = win, key, u_drop, u_lift, dst, w_dst, u1
        self.own, self.src, self.dur = own, src, dur
        self.spr = push_sprite(key, w_dst)

    def _in_window(self, u, L):
        """the banner's rect in the frame while it is on the device: (x, y, w)"""
        if self.own:
            (x0, y0, x1, y1), sc, tx, ty, wa, k = self.win.transform(u, L)
            w_in = min(x1 - x0 - 16, 470 * self.win.s * 1.9)
            p = spring(u - self.u_drop, zeta=0.78, w=10)
            return (x0 + (x1 - x0) / 2 - w_in / 2, y0 + 10 - 60 * (1 - p), w_in)
        (rx0, ry0, rx1, ry1), _, _ = self.win.to_out(u, L, self.src)
        return (rx0, ry0, rx1 - rx0)

    def draw(self, f, u, L=None):
        if u < self.u_drop or u > self.u1 + 0.35: return
        h_dst = self.spr.shape[0] * 1.0
        if u < self.u_lift:
            if not self.own: return
            x, y, w = self._in_window(u, L)
            a = clamp((u - self.u_drop) / 0.2)
            blit(f, self.spr, x, y, a, scale=w / self.w_dst)
            return
        q = clamp((u - self.u_lift) / self.dur)
        e = FLY_EASE(q)
        x0, y0, w0 = self._in_window(min(u, self.u_lift + 1e-3) if self.own else u, L)
        dx, dy = self.dst
        s0 = w0 / self.w_dst
        s = s0 + (1 - s0) * e
        # an arc: up and over, as if lifted off the screen
        cx = x0 + (dx - x0) * e
        cy = y0 + (dy - y0) * e - 70 * math.sin(math.pi * e)
        a = (1.0 if self.own else clamp(q / 0.15)) * (1 - clamp((u - self.u1) / 0.35))
        if e < 1:
            shadow(f, cx, cy, cx + self.w_dst * s, cy + h_dst * s, 20, alpha=0.5 * a, blur=26, dy=16)
        blit(f, self.spr, cx, cy, a, scale=s)


# ---------------------------------------------------------------- cut 8b: SaaS and the progressive web app, said plainly

from parts5 import InstallScene
from parts4 import fm_spring
from parts import words_sprite as _ws


class InstallScene8(InstallScene):
    """cut 7's install scene, with the point made in words while it happens (cut 8b, on the maintainer's note: show that
    Smart-Clearance is SaaS and a progressive web app that installs on any laptop, tablet or phone): the laptop takes the
    right while Chrome offers the install, and the left says what it means, a line at a time; then, as before, the three
    devices in a row and the alerts landing on all three"""
    POINTS = [('globe', 'One address per brand', 'munchly-smartclearance.web.app'),
              ('laptop', 'Installs from the browser', 'no app store, nothing to download'),
              ('bell-ring', 'Alerts on every device', 'by Firebase Cloud Messaging')]

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.lead = _ws(kicker='SOFTWARE AS A SERVICE · A PROGRESSIVE WEB APP', head='Installed in one click.', width=640, hsize=46)
        self.rows = [(icon_sprite(i, 24), TX(t, 'g', 23, 680, INK), TX(s, 'g', 17, 480, MUTED)) for i, t, s in self.POINTS]

    def layout(self, u):
        p = ease_in_out((u - self.t_back) / 1.0)
        lx, ly, ls = 760 + (60 - 760) * p, 214 + (300 - 214) * p, 1.0 + (0.70 - 1.0) * p
        tin = fm_spring(u - self.t_back - 0.25, 170, 22) if u > self.t_back + 0.25 else 0
        pin = fm_spring(u - self.t_back - 0.4, 170, 22) if u > self.t_back + 0.4 else 0
        tx = max(900 + 1060 * (1 - tin), lx + self.lap.sw * ls + 36)
        px = max(1500 + 560 * (1 - pin), tx + self.tab.sw * 0.52 + 36)
        tab = (tx, 236, 0.52, clamp((u - self.t_back - 0.25) / 0.12))
        ph = (px, 196, 0.66, clamp((u - self.t_back - 0.4) / 0.12))
        return (lx, ly, ls, 1.0), tab, ph

    def _row(self, f, i, x, y, w, ra, e):
        ic, tt, ss = self.rows[i]
        panel(f, x, y, x + w, y + 96, ra, alpha=0.86)
        _dot(f, (x + 46, y + 48), 24, (14, 60, 43), ra, glow=0.1, core=(14, 60, 43))
        circle_ring(f, x + 46, y + 48, 24, (52, 211, 128), ra, 2.0)
        blit(f, ic, x + 34, y + 36, ra)
        blit(f, tt, x + 88 + 14 * (1 - e), y + 18, ra)
        blit(f, ss, x + 89 + 14 * (1 - e), y + 56, ra)

    def draw(self, f, u, L=None):
        super().draw(f, u, L)
        # beside the install: what it is, and the first two points, a line at a time
        out = 1 - ramp(u, self.t_back - 0.1, self.t_back + 0.35)
        a = clamp((u - 0.15) / 0.4) * out
        if a > 0:
            blit(f, self.lead, 64, 120 + 10 * (1 - ease_out((u - 0.15) / 0.5)), a)
            for i, t in enumerate([0.55, 1.25]):
                ra = a * clamp((u - t) / 0.3)
                if ra > 0: self._row(f, i, 64, 330 + i * 120, 600, ra, ease_out((u - t) / 0.45))
        # under the three devices: all three points, a card each
        for i in range(3):
            t = self.t_back + 0.9 + 0.22 * i
            ra = clamp((u - t) / 0.3) * (1 - clamp((u - self.L) / 0.3))
            if ra > 0: self._row(f, i, 60 + i * 610, 944 + 12 * (1 - ease_out((u - t) / 0.45)), 580, ra, ease_out((u - t) / 0.45))
