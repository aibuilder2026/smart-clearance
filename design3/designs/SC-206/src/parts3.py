"""SC-206 cut 3: the new scenes. The brand over the live landing page; the agenda as a route map; each person at work
with the live app in their hands, brought into focus as a window; the papers, highlighted; the UPI scan; the results.
Each part draws itself into a float BGR frame at a local time u (seconds), as parts.py's do."""
import math
from functools import lru_cache
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw
from kit import *
from parts import (words_sprite, card_sprite, chip_sprite, mark_sprite, bar_sprite, tag_sprite, avatar_img, Seqs, Window, FrameSource,
                   BAR, money, over_bar, url_line, PEOPLE)
import fx
import json as _json

LANDING = HERE / 'build' / 'landing'

# ---------------------------------------------------------------- small sprites

@lru_cache(maxsize=None)
def text_sprite(text, kind='b', size=96, wght=760, rgb=(244, 248, 245), track=0.0):
    S = 2
    w = int(text_w(text, kind, size, wght, track) + size * 0.2)
    h = int(size * 1.3)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    draw_text(ImageDraw.Draw(im), (0, int(size * 0.05) * S), text, kind, size * S, rgb + (255,), wght, track)
    return to_sprite(im.resize((w, h), Image.LANCZOS))

def wipe(spr, p, soft=0.08):
    """a copy of a sprite revealed left to right to p (0..1), with a soft edge"""
    h, w = spr.shape[:2]
    x = np.linspace(0, 1, w, dtype=np.float32)
    m = np.clip((p * (1 + soft) - x) / soft, 0, 1)
    return spr * m[None, :, None]

def glow_sprite(spr, sigma=10, power=0.9, rgb=(52, 211, 128)):
    """the sprite's own shape, blurred and tinted: a glow to lay under it"""
    a = spr[..., 3]
    pad = int(sigma * 3)
    a = cv2.copyMakeBorder(a, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    g = cv2.GaussianBlur(a, (0, 0), sigma) * power
    c = col(rgb)
    out = np.zeros(g.shape + (4,), np.float32)
    out[..., :3] = g[..., None] * c
    out[..., 3] = g
    return out, pad

# ---------------------------------------------------------------- 1 · the brand over the live landing page

class BrandScene:
    """From black, a green route draws across the frame and the live landing page appears behind it, out of focus and
    in shadow, with light turning through it and dust in the air. The mark springs in, the name is wiped on with a sweep
    of light, and the line under it strikes 'write-offs' out and lights 'recovery' as the voice says them. Then the
    page comes into focus as the camera pulls back: it becomes a browser window at smartclearance.web.app, and the
    mark flies home to the page's own logo. The window then plays the page (hero, then the workspace section)."""
    WIN = (160, 150, 1760, 1050)   # the page at rest: 1600 x 900, one output pixel a CSS pixel

    def __init__(self, t_strike, t_recovery, t_fly, t_teams, L):
        self.t_strike, self.t_recovery, self.t_fly, self.t_teams, self.L = t_strike, t_recovery, t_fly, t_teams, L
        self.full = Seqs([LANDING / 'hero', LANDING / 'teams'], scale=0.6)     # 1920 x 1080
        self.page = Seqs([LANDING / 'hero', LANDING / 'teams'], scale=0.5)     # 1600 x 900, the window's own pixels
        self.dust = fx.Dust(n=170, seed=2061, strength=0.5)
        self.rays = fx.Rays(1780, -120, strength=0.30, turn=0.03, reach=1900)
        self.route = fx.bezier((-60, 760), (420, 980), (900, 300), (1980, 520))
        self.mark = mark_sprite(132)
        self.name = text_sprite('Smart-Clearance', 'b', 104, 760)
        self.parts = [('turns ', (170, 188, 178)), ('write-offs', (236, 243, 239)), (' into ', (170, 188, 178)), ('recovery.', (236, 243, 239))]
        self.tag = [text_sprite(t, 'g', 44, 460, rgb) for t, rgb in self.parts]
        self.tag_green = text_sprite('recovery.', 'g', 44, 620, (52, 211, 128))
        self.glow_rec, self.glow_pad = glow_sprite(self.tag_green, 12, 1.2)
        self.tagw = [text_w(t, 'g', 44, 460) for t, _ in self.parts]
        self.page_idx0 = 0
        self.fly_len = 1.35
        self.win = Window(None, None, [(0.0, 6.0), (6.0, 13.0)], self.WIN[0], self.WIN[1], 1.0, 'smartclearance.web.app',
                          seq=self.page, radius=14, enter=False)
        self.chip = card_sprite('Every brand, its own workspace', '<brand>-smartclearance.web.app · its own people, rules and agents',
                                ('live', 'SOFTWARE AS A SERVICE'), 470)

    def frame_index(self, u):
        """the page's frame at u: the hero plays from the start; the workspace section from t_teams"""
        if u < self.t_teams: return min(149, int(u * FPS * 0.9))
        return 150 + min(174, int((u - self.t_teams) * FPS))

    def brand_xy(self, u):
        """the mark's top-left and scale: centre stage, then flying to the page's own logo"""
        x0, y0, s0 = 470, 360, 1.0
        x1, y1, s1 = self.WIN[0] + 103, self.WIN[1] + 18, 28 / 132
        p = ease_in_out((u - self.t_fly) / self.fly_len)
        return x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, s0 + (s1 - s0) * p, p

    def draw(self, f, u, L=None):
        L = L or self.L
        p = ease_in_out((u - self.t_fly) / self.fly_len)     # 0: the stage; 1: the window at rest
        # -- the page behind: full-bleed, defocused and in shadow; then pulled back into its window and sharpened
        k = self.frame_index(u)
        if p < 1:
            img = self.full.get_index(k).astype(np.float32) / 255
            z = 1.0 + 0.07 * ease_in_out(u / max(1e-3, self.t_fly + self.fly_len)) * (1 - p)  # a slow push while it waits
            if z > 1.0005:
                M = np.float32([[z, 0, (1 - z) * W * 0.42], [0, z, (1 - z) * H * 0.45]])
                img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            sig = 13 * (1 - p) ** 1.3
            img = fx.defocus(img, sig)
            gain = 0.50 + 0.50 * p
            img = img * gain
            g = (1 - p) * 0.35
            img = img * (1 - g) + g * img.mean(2, keepdims=True) * col((40, 120, 80)) * 2.4
            rx0, ry0, rx1, ry1 = [a + (b - a) * p for a, b in zip((0, 0, W, H), self.WIN)]
            reveal = ramp(u, 0.35, 1.3)
            if p <= 0.001:
                f[:] = img * reveal
            else:
                f[:] = col((5, 9, 7))
                if p > 0.05: shadow(f, rx0, ry0 - BAR * p, rx1, ry1, 16, alpha=0.6 * p)
                w_, h_ = int(round(rx1 - rx0)), int(round(ry1 - ry0))
                sm = cv2.resize(img, (w_, h_), interpolation=cv2.INTER_AREA)
                ix, iy = int(round(rx0)), int(round(ry0))
                mx0, my0, m = rrect_alpha(ix, iy, ix + w_, iy + h_, 14 * p + 0.01, pad=0, top_r=0.01)
                m = m[:h_, :w_]
                over(f, ix, iy, sm[:m.shape[0], :m.shape[1]], m)
                if p > 0.35:
                    blit(f, bar_sprite(w_, 'smartclearance.web.app', BAR, 14), ix, iy - BAR, ramp(p, 0.35, 0.9))
            if p < 0.9:
                fv = fx.vignette(0.5)
                f *= fv * (1 - p) + p
                self.rays.draw(f, u, alpha=(1 - p) * ramp(u, 0.6, 2.2))
                self.dust.draw(f, u, alpha=(1 - p) * ramp(u, 0.4, 1.6))
        else:
            f[:] = col((5, 9, 7))
            # the window at rest, the page's own pixels; the dissolve from the pull-back lasts one more beat
            self.win.segs = [(self.frame_index(u) / FPS, self.frame_index(u) / FPS + 0.04)]
            self.win.u0, self.win.u1 = 0.0, 1e9
            self._win_draw(f, u)
            self.dust.draw(f, u, alpha=0.18)
        # -- the route, drawn across the dark
        rp = ramp(u, 0.05, 1.25)
        if rp > 0 and p < 1:
            fx.stroke(f, self.route, rp, (52, 211, 128), width=3.0, glow=12, alpha=(1 - ramp(u, 1.6, 2.6)) * (1 - p))
        # -- the mark, the name and the line under them
        bx, by, bs, bp = self.brand_xy(u)
        if u > 0.6 and bp < 1:
            a = clamp((u - 0.6) / 0.35) * (1 - ramp(bp, 0.75, 1.0))
            sp = spring(u - 0.6, zeta=0.62, w=9)
            sc = (0.55 + 0.45 * sp) * bs
            blit(f, self.mark, bx + 66 * bs, by + 66 * bs, a, scale=sc, ox=66, oy=66)
            nw = clamp((u - 0.95) / 0.75)
            na = a * (1 - ramp(bp, 0.12, 0.5))
            if nw > 0 and na > 0:
                nm = wipe(self.name, nw)
                if 0.2 < (u - 1.1) / 1.2 < 1.2: nm = fx.sweep(nm, (u - 1.1) / 1.2, 0.1, 0.8)
                blit(f, nm, bx + (132 + 30) * bs, by + 4 * bs, na, scale=bs)
            ta = clamp((u - 1.5) / 0.5) * a * (1 - ramp(bp, 0.0, 0.35))
            if ta > 0:
                x = bx + (132 + 34) * bs; y = by + 128 * bs
                for i, (spr, w_) in enumerate(zip(self.tag, self.tagw)):
                    if i == 3 and u >= self.t_recovery:
                        g = clamp((u - self.t_recovery) / 0.35)
                        pulse = 1 + 0.6 * math.exp(-((u - self.t_recovery - 0.25) / 0.35) ** 2)
                        blit(f, self.glow_rec, x - self.glow_pad, y - self.glow_pad, ta * g * 0.9 * pulse)
                        blit(f, spr, x, y, ta * (1 - g)); blit(f, self.tag_green, x, y, ta * g)
                    else:
                        blit(f, spr, x, y, ta * (0.55 if (i == 1 and u >= self.t_strike + 0.4) else 1.0))
                    if i == 1 and u >= self.t_strike:
                        s_ = clamp((u - self.t_strike) / 0.4)
                        yy = y + 44 * 0.68
                        over_bar(f, x - 4, yy - 2.5, x - 4 + (w_ + 8) * s_, yy + 2.5, (229, 92, 74), ta)
                    x += w_
        # -- the card on the window, as the voice reaches the workspace
        if u > self.t_teams + 0.6:
            ca = clamp((u - self.t_teams - 0.6) / 0.4)
            e = ease_out((u - self.t_teams - 0.6) / 0.5)
            blit(f, self.chip, self.WIN[2] - 470 - 34, self.WIN[3] - self.chip.shape[0] - 34 + 12 * (1 - e), ca)

    def _win_draw(self, f, u):
        w = self.win
        x0, y0 = w.x, w.y
        x1, y1 = x0 + w.w, y0 + w.h
        shadow(f, x0, y0 - BAR, x1, y1, 16, alpha=0.6)
        img = self.page.get_index(self.frame_index(u))
        ix0, iy0, patch = place(img, 1.0, x0, y0, (x0, y0, x1, y1), rest=1.0, view=(0, 0, img.shape[1], img.shape[0]))
        mx0, my0, m = rrect_alpha(x0, y0, x1, y1, 14, pad=0, top_r=0.01)
        hh, ww = patch.shape[:2]
        m = m[iy0 - my0: iy0 - my0 + hh, ix0 - mx0: ix0 - mx0 + ww]
        over(f, ix0, iy0, patch, m)
        blit(f, bar_sprite(w.w, 'smartclearance.web.app', BAR, 14), x0, y0 - BAR, 1.0)

# ---------------------------------------------------------------- 2 · footage: an LTX clip at its own speed, or a still

import vfx
TRACK = HERE / 'build' / 'track'

class Footage:
    """a person's shot as the whole frame: their LTX clip played frame for frame at its own 24 fps (never slowed,
    reversed or looped while it is seen sharp; behind a blur it may hold its last frame), or, until the clip exists,
    the keyframe on a slow push. Knows where its screen is in every frame (build/track/<key>.json, or the keyframe's)."""
    def __init__(self, key, hint=None, push=0.025):
        self.key, self.push = key, push
        clip = HERE / 'clips' / f'{key}.mp4'
        self.clip = clip if clip.exists() else None
        self.src = FrameSource(clip, size=(W, H), fps=24) if self.clip else None
        if self.clip:
            self.n = int(round(float(__import__('subprocess').run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0',
                         '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', str(clip)], capture_output=True, text=True).stdout or 120)))
        p = HERE / 'img' / f'{key}-L.png'
        if not p.exists(): p = HERE / 'img' / f'{key}.png'
        img = cv2.imread(str(p))
        self.still = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA if img.shape[1] > W else cv2.INTER_CUBIC) if img is not None else np.zeros((H, W, 3), np.uint8)
        self.quads = None
        tj = TRACK / f'{key}.json'
        sj = HERE / 'build' / 'screens.json'
        known = _json.loads(sj.read_text()) if sj.exists() else {}
        if tj.exists():
            q, size = vfx.load_track(tj)
            self.quads = q * np.float32([W / size[0], H / size[1]])
        elif key in known:   # a still: the screen's corners as measured on the keyframe (screens.py)
            self.quads = np.float32(known[key]['quad'])[None]
        elif hint is not None:
            q = vfx.screen_quad(self.still, hint=hint)
            self.quads = None if q is None else q[None]
        self.cache = (None, None)

    def index(self, u):
        if not self.clip: return 0
        return int(clamp(math.floor(max(0.0, u) * 24 + 1e-6), 0, self.n - 1))

    def frame(self, u):
        """(uint8 BGR frame, its screen quad or None) at local time u"""
        if self.cache[0] == round(u, 4): return self.cache[1]
        if self.clip:
            k = self.index(u)
            img = self.src.get(k / 24.0)
            q = None if self.quads is None else self.quads[min(k, len(self.quads) - 1)]
        else:
            z = 1 + self.push * ease_in_out(u / 6.0)
            M = np.float32([[z, 0, (1 - z) * W / 2], [0, z, (1 - z) * H / 2]])
            img = cv2.warpAffine(self.still, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            q = None if self.quads is None else (self.quads[0] - [W / 2, H / 2]) * z + [W / 2, H / 2]
        self.cache = (round(u, 4), (img, q))
        return img, q

@lru_cache(maxsize=None)
def lower_third(name, role, face):
    """the person's name, as the app shows them: their portrait, name and role, on a dark glass strip"""
    S = 2
    av = avatar_img(str(PEOPLE / f'{face}.webp'), 64)
    w = int(max(text_w(name, 'g', 30, 640), text_w(role, 'g', 20, 440))) + 64 + 22 + 40
    h = 88
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=18 * S, fill=(8, 16, 12, 200), outline=(63, 176, 123, 120), width=int(1.3 * S))
    av2 = av.resize((64 * S, 64 * S), Image.LANCZOS)
    im.paste(av2, (12 * S, 12 * S), av2)
    draw_text(d, ((12 + 64 + 18) * S, 13 * S), name, 'g', 30 * S, (244, 248, 245, 255), 640)
    draw_text(d, ((12 + 64 + 18) * S, 52 * S), role, 'g', 20 * S, (170, 196, 182, 255), 440)
    return to_sprite(im.resize((w, h), Image.LANCZOS))

class DeviceShot:
    """A person at work, then their device brought into focus as the live app's window:
      [0, t_whip)            the face shot (the device's back to us), the person's name and role from the app;
      [t_whip, t_whip+0.4)   a whip pan to the over-the-shoulder shot;
      [.., t_go)             over the shoulder, the live app on their screen (the recording, running into the window);
      [t_go, t_go+go_len)    'push': the camera flies into the screen until it is the window; 'lift': the room racks
                             out of focus while the screen rises out of the device and settles as the window;
      then                   the window at rest, pixel-exact, over the room out of focus.
    face may be None (start over the shoulder); win is a parts.Window whose first segment the screen runs into."""
    def __init__(self, face, ots, win, t_whip, t_go, go_len=1.15, mode='push', who=None, blur=16, dim=0.5, whip_dir=1):
        self.face, self.ots, self.win = face, ots, win
        self.t_whip, self.t_go, self.go_len, self.mode = t_whip, t_go, go_len, mode
        self.who, self.blur, self.dim, self.whip_dir = who, blur, dim, whip_dir
        self.whip_len = 0.42 if face is not None else 0.0
        self.bgcache = {}

    def rect(self, L):
        (x0, y0, x1, y1), sc, tx, ty, a, k = self.win.transform(self.win.u0 + 5.0, L)  # at rest
        return (x0, y0, x1, y1)

    def screen_content(self, u, L):
        """the recording at the window's first frame, held while the person is seen and while the device comes into
        focus (earlier frames of a recording can show another screen: a lock screen, a sign-in), so the window takes over
        on the very frame the device showed"""
        seg0 = self.win.segs[0][0]
        t = seg0
        img = self.win.frame_at(0, max(0.0, t))
        v = self.win.view
        img = img[int(v[1]):int(v[1] + v[3]), int(v[0]):int(v[0] + v[2])]
        return img.astype(np.float32) / 255

    def ots_frame(self, u, L, insert=True):
        img, q = self.ots.frame(u - self.t_whip)
        f = img.astype(np.float32) / 255
        if insert and q is not None:
            vfx.insert(f, img, q, self.screen_content(u, L))
        return f, q, img

    def draw(self, f, u, L):
        tw0, tw1 = self.t_whip, self.t_whip + self.whip_len
        if self.face is not None and u < tw0:
            fimg, _ = self.face.frame(u)
            f[:] = fimg.astype(np.float32) / 255
        elif self.face is not None and u < tw1:
            a = self.face.frame(u)[0].astype(np.float32) / 255
            b, _, _ = self.ots_frame(u, L)
            f[:] = fx.whip(a, b, (u - tw0) / self.whip_len, self.whip_dir)
        elif u < self.t_go:
            b, _, _ = self.ots_frame(u, L)
            f[:] = b
        else:
            p = (u - self.t_go) / self.go_len
            rect = self.rect(L)
            if p < 1:
                b, q, raw = self.ots_frame(min(u, self.t_go + self.go_len), L)
                if q is None:
                    f[:] = fx.defocus(b, self.blur * ease_in_out(p)) * (1 - self.dim * ease_in_out(p))
                elif self.mode == 'push':
                    f[:] = vfx.push(b, q, rect, p, blur=self.blur, dim=self.dim)
                else:   # the device keeps its app while the screen rises out of it (a blank screen left behind read wrong)
                    f[:] = vfx.lift(b, q, rect, self.screen_content(u, L), p, blur=self.blur, dim=self.dim)
            else:
                # the room behind, out of focus: the over-the-shoulder shot's last frame, held (no loop shows through a blur)
                key = 'bg'
                if key not in self.bgcache:
                    b, q, raw = self.ots_frame(self.t_go + self.go_len, L, insert=False)
                    self.bgcache[key] = fx.defocus(b, self.blur) * (1 - self.dim)
                f[:] = self.bgcache[key]
        # the name, as the app shows it, while the face is on screen
        if self.who and self.face is not None:
            a = fade(u, 0.35, tw0 + 0.1, 0.4, 0.3)
            if a > 0:
                spr = lower_third(*self.who)
                e = ease_out((u - 0.35) / 0.5)
                blit(f, spr, 64 - 18 * (1 - e), H - spr.shape[0] - 70, a)

# ---------------------------------------------------------------- 3 · the agenda: three lines on a route map

IMG = REPO / 'design3' / 'system' / 'img'

@lru_cache(maxsize=None)
def pack_sprite(name, size):
    """a product render (design3/system/img/pack-*.webp, on black) as a sprite: its black lifted to transparent"""
    im = cv2.imread(str(IMG / f'pack-{name}.webp'))
    im = cv2.resize(im, (size, size), interpolation=cv2.INTER_AREA)
    a = np.clip((im.max(2).astype(np.float32) - 10) / 30, 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 0.6)
    out = np.zeros((size, size, 4), np.float32)
    out[..., :3] = im.astype(np.float32) / 255 * a[..., None]
    out[..., 3] = a
    return out

@lru_cache(maxsize=None)
def line_label(num, title, sub, rgb, width=760):
    S = 2
    h = 92
    im = Image.new('RGBA', (width * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 4 * S, 44 * S, 48 * S], fill=rgb + (255,))
    fn = font('g', 20 * S, 760); tw = fn.getlength(num)
    d.text(((22 * S) - tw / 2, 13 * S), num, font=fn, fill=(8, 14, 11, 255))
    draw_text(d, (60 * S, 2 * S), title, 'g', 30 * S, (244, 248, 245, 255), 680)
    draw_text(d, (60 * S, 44 * S), sub, 'g', 19 * S, (170, 196, 182, 255), 420)
    return to_sprite(im.resize((width, h), Image.LANCZOS))

class Agenda:
    """What the film shows, as a route map: three lines drawn on as the voice names them, a token running each, its
    stations lighting in turn; the two batches' packs where their lines begin"""
    LINES = [
        ('01', 'The SaaS console', 'smartclearance-console.web.app · a brand set up in minutes', (247, 192, 74),
         ['Clients', 'Stock data', 'People', 'SKU gates', 'Agents'], None),
        ('02', 'Happy path · Munchly Mango Drink', 'Lakshmi Agencies, Hyderabad · kiranas, staff sale, food bank', (52, 211, 128),
         ['Detect', 'Verify', 'Approve', 'Kiranas', 'Staff sale', 'Food bank', 'Papers'], 'mango'),
        ('03', 'Sad path · Munchly Masala Chips', 'Rakesh Traders, Nagpur · when the stock will not sell', (240, 120, 96),
         ['Detect', 'Kiranas', 'ExpireSoon', 'Window shut', 'Destroyed', 'Second yes', 'Papers'], 'chips'),
    ]
    X0, X1, Y0, DY = 470, 1780, 330, 228

    def __init__(self, starts, L, bg=None):
        self.starts, self.L = starts, L
        self.bg = bg
        self.head = words_sprite(kicker='LIVE ON PRODUCTION · WHAT YOU WILL SEE', head='Three journeys on one platform.', width=1300, hsize=52)
        self.labels = [line_label(n, t, s, c) for n, t, s, c, _, _ in self.LINES]
        self.dust = fx.Dust(n=90, seed=2063, strength=0.35)

    def draw(self, f, u, L=None):
        if self.bg is None:
            seq = Seqs([HERE / 'build' / 'agents'], scale=0.5)
            im = seq.get_index(700)[260:950, 100:1327]   # the agents' orbit alone, as the end card has it
            im = cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
            self.bg = cv2.GaussianBlur(im, (0, 0), 9) * 0.26 + col((5, 9, 7)) * 0.74
        f[:] = self.bg
        self.dust.draw(f, u, 0.8)
        blit(f, self.head, 150, 92 + 10 * (1 - ease_out(u / 0.6)), clamp(u / 0.5))
        for i, (num, title, sub, rgb, stations, pack) in enumerate(self.LINES):
            t0 = self.starts[i]
            if u < t0 - 0.05: continue
            y = self.Y0 + i * self.DY
            a = clamp((u - t0) / 0.35)
            blit(f, self.labels[i], 150, y - 88 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
            # the line, drawn on, then the token riding it
            prog = ease_in_out((u - t0) / 1.1)
            x0, x1 = self.X0 - 320 + 40, self.X1
            yl = y + 52
            pts = np.float32([[x0 + (x1 - x0) * t, yl] for t in np.linspace(0, 1, 200)])
            fx.stroke(f, pts, prog, rgb, width=4.0, glow=5, alpha=a * 0.9, head=False)
            n = len(stations)
            for k, st in enumerate(stations):
                sx = self.X0 + (x1 - self.X0) * (k + 0.5) / n
                ts = t0 + 0.15 + 1.1 * ((sx - x0) / (x1 - x0))
                if u < ts: continue
                sp = clamp(spring(u - ts, zeta=0.55, w=14), 0, 1.3)
                r = 13 * sp
                ix0, iy0, m = rrect_alpha(sx - r, yl - r, sx + r, yl + r, r, pad=2)
                over(f, ix0, iy0, col(rgb), m * a)
                ri = r * 0.55
                ix0, iy0, m = rrect_alpha(sx - ri, yl - ri, sx + ri, yl + ri, ri, pad=2)
                over(f, ix0, iy0, col((10, 18, 14)), m * a)
                lab = text_sprite(st, 'g', 19, 520, (205, 222, 213))
                blit(f, lab, sx - lab.shape[1] / 2, yl + 18, a * clamp((u - ts) / 0.3))
            # the token: a bright dot with a short trail, once along the line
            tk = (u - t0 - 0.2) / 1.5
            if 0 < tk < 1.15:
                tx = x0 + (x1 - x0) * ease_in_out(min(1, tk))
                fx.flare(f, tx, yl, power=0.7 * (1 - ramp(tk, 0.95, 1.15)), color=(230, 255, 240), streak=140)
            if pack:
                ps = pack_sprite(pack, 150)
                pa = a * clamp((u - t0 - 0.2) / 0.4)
                bob = 4 * math.sin((u - t0) * 1.6 + i)
                blit(f, ps, 1760 - 10, y - 92 + bob + 14 * (1 - ease_out((u - t0) / 0.6)), pa)

# ---------------------------------------------------------------- 4 · the result, with punch

@lru_cache(maxsize=None)
def big_num(text, size, rgb):
    return text_sprite(text, 'b', size, 780, rgb)

@lru_cache(maxsize=None)
def flow_label(title, sub, rgb, width=520):
    S = 2
    im = Image.new('RGBA', (width * S, 64 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    draw_text(d, (0, 0), title, 'g', 26 * S, rgb + (255,), 680)
    draw_text(d, (0, 34 * S), sub, 'g', 19 * S, (178, 200, 188, 255), 420)
    return to_sprite(im.resize((width, 64), Image.LANCZOS))

class ResultPunch:
    """A batch's result over its own place, out of focus: the pack, the money recovered counting up against what the
    bin would have cost (struck through), the packs flowing out to each exit as bars sized by their packs, then the
    proof points arriving one by one. bg: an (H, W, 3) float frame (the place), or a callable u -> frame."""
    def __init__(self, u0, u1, kicker, pack, ref, got, bin_, swing, flows, facts, fact_at, bg=None, accent=(52, 211, 128)):
        self.u0, self.u1, self.kicker, self.pack, self.ref = u0, u1, kicker, pack, ref
        self.got, self.bin, self.swing, self.flows, self.facts, self.fact_at = got, bin_, swing, flows, facts, fact_at
        self.bg, self.accent = bg, accent
        self.title = words_sprite(kicker=kicker, width=1400)
        self.ps = pack_sprite(pack, 300)
        self.pglow, self.ppad = glow_sprite(self.ps, 26, 0.55, accent)
        self.dust = fx.Dust(n=120, seed=2065, strength=0.45)
        total = sum(n for _, _, n, _ in flows)
        self.total = total

    def draw(self, f, u, L=None):
        if self.bg is not None:
            f[:] = self.bg(u) if callable(self.bg) else self.bg
        else:
            f[:] = col((6, 11, 9))
        f *= fx.vignette(0.55)
        self.dust.draw(f, u, 0.8)
        a = fade(u, self.u0, self.u1, 0.45, 0.4)
        if a <= 0: return
        e0 = ease_out((u - self.u0) / 0.7)
        blit(f, self.title, 140, 70 + 10 * (1 - e0), a)
        # the pack, floating, with a soft glow
        bob = 6 * math.sin((u - self.u0) * 1.4)
        px, py = 120, 230 + bob + 20 * (1 - e0)
        blit(f, self.pglow, px - self.ppad, py - self.ppad, a * 0.9)
        blit(f, self.ps, px, py, a)
        for j, part in enumerate(self.ref.split(' · ')):
            blit(f, text_sprite(part, 'g', 22 if j else 24, 520 if j else 680, (190, 210, 200) if j else (236, 243, 239)), px + 20, py + 312 + j * 32, a)
        # the money: recovered counting up; the bin's figure struck through
        p = ease_out((u - self.u0 - 0.3) / 1.4)
        g = big_num(money(self.got * p), 132, (52, 211, 128))
        blit(f, g, 520, 170 + 12 * (1 - e0), a)
        blit(f, words_sprite(sub='recovered for Munchly', width=500, ssize=28), 528, 340, a * clamp((u - self.u0 - 0.5) / 0.4))
        q = clamp((u - self.u0 - 0.7) / 0.4)
        bn = big_num(money(self.bin), 76, (229, 92, 74))
        bx, by = 1200, 214
        blit(f, bn, bx, by, a * q * 0.85)
        blit(f, words_sprite(sub='if it had gone to the bin', width=480, ssize=24), bx + 6, by + 104, a * q)
        st = clamp((u - self.u0 - 1.2) / 0.35)
        if st > 0: over_bar(f, bx - 6, by + 52, bx - 6 + (bn.shape[1] - 10) * st, by + 59, (229, 92, 74), a)
        sw = clamp((u - self.u0 - 1.6) / 0.4)
        if sw > 0:
            chip = chip_sprite(f'{money(self.swing)} better than destroying it', 'good', 26)
            blit(f, chip, bx, by + 158 + 10 * (1 - ease_out((u - self.u0 - 1.6) / 0.5)), a * sw)
        # where the packs went: one bar per exit, sized by its packs, growing in turn
        y = 560
        x0 = 600
        span = 1160
        for i, (title, sub, n, rgb) in enumerate(self.flows):
            t0 = self.u0 + 1.0 + i * 0.35
            fa = a * clamp((u - t0) / 0.35)
            if fa <= 0: continue
            w_ = span * n / self.total
            gp = ease_in_out((u - t0) / 0.9)
            yy = y + i * 92
            over_bar(f, x0, yy, x0 + span, yy + 10, (32, 44, 38), fa)
            over_bar(f, x0, yy, x0 + max(12, w_) * gp, yy + 10, rgb, fa)
            blit(f, flow_label(title, sub, rgb), x0, yy + 20, fa)
            blit(f, text_sprite(f'{int(round(n * gp)):,} packs', 'g', 24, 640, (236, 243, 239)), x0 + span - 170, yy + 20, fa)
        # the proof points
        for i, (txt, kind) in enumerate(self.facts):
            t0 = self.fact_at[i]
            fa = a * clamp((u - t0) / 0.35)
            if fa <= 0: continue
            e = ease_out((u - t0) / 0.5)
            chip = chip_sprite(txt, kind, 22)
            blit(f, chip, 120 + (i % 2) * 560 if False else 120, 868 + i * 58 + 10 * (1 - e) if False else 0, 0)
        # laid out in a row under the flows
        xs = 120
        for i, (txt, kind) in enumerate(self.facts):
            t0 = self.fact_at[i]
            fa = a * clamp((u - t0) / 0.35)
            chip = chip_sprite(txt, kind, 21)
            if fa > 0:
                e = ease_out((u - t0) / 0.5)
                blit(f, chip, xs, 940 + 10 * (1 - e), fa)
            xs += chip.shape[1] + 18

# ---------------------------------------------------------------- 5 · the papers, highlighted

PAPERS = HERE / 'build' / 'papers'
PX_PER_PT = 2.6   # build/papers/png/* were laid out from the production PDFs at this scale (pymupdf)

class Paper:
    """one production paper (a page of a PDF the Paperwork agent laid out), with its focus points: (rect in PDF points,
    label, body) — the camera eases in on each and a marker sweeps across it"""
    def __init__(self, png, focus, t0, t1, tag=('agent', 'PAPERWORK')):
        im = cv2.imread(str(PAPERS / 'png' / png))
        self.mips = [im.astype(np.float32) / 255]
        while self.mips[-1].shape[1] > 500:
            m = self.mips[-1]
            self.mips.append(cv2.resize(m, (m.shape[1] // 2, m.shape[0] // 2), interpolation=cv2.INTER_AREA))
        self.ph, self.pw = im.shape[:2]
        self.focus, self.t0, self.t1, self.tag = focus, t0, t1, tag

    def warp(self, s, ang, cx, cy):
        """the page drawn at scale s (output px per page px), rotated ang, its centre at (cx, cy): (BGR, alpha)"""
        k = 0
        while k + 1 < len(self.mips) and self.mips[k + 1].shape[1] / self.pw >= s: k += 1
        src = self.mips[k]
        ks = src.shape[1] / self.pw
        sc = s / ks
        c, sn = math.cos(ang) * sc, math.sin(ang) * sc
        h, w = src.shape[:2]
        M = np.float32([[c, -sn, cx - (c * w / 2 - sn * h / 2)], [sn, c, cy - (sn * w / 2 + c * h / 2)]])
        img = cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0))
        a = cv2.warpAffine(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        return img, a, M, ks

class PaperShow:
    """the papers landing one after another on a soft ground: each flies in and settles, the camera eases in on its
    focus points in turn (a marker sweeping across each, its label beside it), then it slides away for the next"""
    REST_H = 960

    def __init__(self, papers, bg=None, cx=760, zx=720):
        self.papers, self.bg, self.cx, self.zx = papers, bg, cx, zx
        self.cards = {}

    def card(self, label, body, tag):
        k = (label, body, tag)
        if k not in self.cards: self.cards[k] = card_sprite(label, body, tag, 420)
        return self.cards[k]

    def camera(self, p, u):
        """(zoom, focus x, focus y in page px, active focus index, its progress) for paper p at time u"""
        s0 = self.REST_H / p.ph
        n = len(p.focus)
        span = (p.t1 - p.t0) - 0.9
        if n == 0: return s0, p.pw / 2, p.ph / 2, -1, 0
        seg = span / n
        rel = u - p.t0 - 0.85
        i = int(clamp(rel // seg, 0, n - 1)) if rel > 0 else -1
        def target(j):
            if j < 0: return s0, p.pw / 2, p.ph / 2
            (x0, y0, x1, y1) = [v * PX_PER_PT for v in p.focus[j][0]]
            w_, h_ = x1 - x0 + 240, y1 - y0 + 200
            z = min(2.1 * s0 * 1.0, min(1050 / w_, 560 / h_))
            z = max(z, s0 * 1.15)
            return z, (x0 + x1) / 2, (y0 + y1) / 2
        a = target(i - 1 if i >= 0 else -1) if i >= 0 else target(-1)
        b = target(i)
        q = ease_in_out(((rel - max(0, i) * seg) / 0.7)) if i >= 0 else 0
        z = a[0] + (b[0] - a[0]) * q
        fxp = a[1] + (b[1] - a[1]) * q; fyp = a[2] + (b[2] - a[2]) * q
        # the last beat eases back out to the whole page before it leaves
        back = ramp(u, p.t1 - 0.55, p.t1 - 0.05)
        z = z + (s0 - z) * back; fxp += (p.pw / 2 - fxp) * back; fyp += (p.ph / 2 - fyp) * back
        prog = (rel - max(0, i) * seg) if i >= 0 else 0
        return z, fxp, fyp, i, prog

    def draw(self, f, u, L=None):
        # over whatever is beneath (a room, a window): dimmed while a paper is up, untouched otherwise
        if self.bg is not None: f[:] = self.bg(u) if callable(self.bg) else self.bg
        up = max((clamp((u - p.t0) / 0.5) * (1 - ramp(u, p.t1, p.t1 + 0.5)) for p in self.papers), default=0)
        if up > 0: f *= (1 - 0.62 * up)
        for p in self.papers:
            if u < p.t0 - 0.05 or u > p.t1 + 0.6: continue
            fin = clamp((u - p.t0) / 0.55)
            fout = ramp(u, p.t1, p.t1 + 0.55)
            z, fxp, fyp, i, prog = self.camera(p, u)
            sp = spring(u - p.t0, zeta=0.78, w=9)
            ang = math.radians(7) * (1 - clamp(sp)) - math.radians(5) * fout
            # place the focus point at the frame's centre when zoomed; the page's centre at cx when at rest
            s0 = self.REST_H / p.ph
            zoomed = clamp((z - s0) / max(1e-6, s0 * 0.4))
            ccx = self.cx + (self.zx - self.cx) * zoomed   # zx: where the focus sits when zoomed (clear of a heading)
            cx = ccx - (fxp - p.pw / 2) * z
            cy = H / 2 - (fyp - p.ph / 2) * z
            cx += 380 * (1 - clamp(sp)) - 900 * ease_in_out(fout)
            cy += 260 * (1 - clamp(sp))
            img, al, M, ks = p.warp(z, ang, cx, cy)
            a = fin * (1 - fout)
            # its shadow, then the page
            sh = cv2.GaussianBlur(al, (0, 0), 22)
            sh = np.roll(np.roll(sh, 24, axis=0), 10, axis=1) * 0.55 * a
            f *= (1 - sh[..., None])
            # the marker on the active focus: a highlighter's yellow, multiplied into the paper
            if i >= 0:
                (x0, y0, x1, y1) = [v * PX_PER_PT for v in p.focus[i][0]]
                sw = clamp((prog - 0.45) / 0.45)
                if sw > 0:
                    pad = 10
                    xs = np.float32([[x0 - pad, y0 - pad * 0.6], [x0 - pad + (x1 - x0 + 2 * pad) * sw, y0 - pad * 0.6],
                                     [x0 - pad + (x1 - x0 + 2 * pad) * sw, y1 + pad * 0.6], [x0 - pad, y1 + pad * 0.6]])
                    pts = cv2.transform((xs * ks)[None], M)[0]
                    mk = np.zeros((H, W), np.float32)
                    cv2.fillConvexPoly(mk, np.int32(np.round(pts * 4)), 1.0, lineType=cv2.LINE_AA, shift=2)
                    hl = col((255, 226, 92))
                    # a spotlight: the rest of the page dims a little while the line is marked
                    spot = cv2.GaussianBlur(mk, (0, 0), 18)
                    dimv = 0.22 * sw * zoomed
                    img = img * (1 - dimv * (1 - np.clip(spot * 1.6, 0, 1)))[..., None]
                    img = img * (1 - mk[..., None] * 0.55) + img * hl * mk[..., None] * 0.55
            f *= (1 - al[..., None] * a)
            f += img * al[..., None] * a
            # the label, beside the marked line, joined to it
            if i >= 0 and len(p.focus[i]) > 1:
                ca = clamp((prog - 0.6) / 0.35) * a * (1 - ramp(u, p.t1 - 0.6, p.t1 - 0.3))
                if ca > 0:
                    spr = self.card(p.focus[i][1], p.focus[i][2] if len(p.focus[i]) > 2 else '', p.tag)
                    (x0, y0, x1, y1) = [v * PX_PER_PT for v in p.focus[i][0]]
                    anchor = cv2.transform(np.float32([[[x1 * ks, (y0 + y1) / 2 * ks]]]), M)[0][0]
                    lx = W - spr.shape[1] - 50
                    ly = clamp(anchor[1] - spr.shape[0] / 2, 70, H - spr.shape[0] - 70)
                    line(f, (lx, ly + spr.shape[0] / 2), (anchor[0] + 12, anchor[1]), C['ring'], alpha=ca * 0.9, width=2.2)
                    blit(f, spr, lx, ly + 8 * (1 - ease_out((prog - 0.6) / 0.4)), ca)

# ---------------------------------------------------------------- 6 · the staff sale, paid by UPI

UPI = 'lakshmi-agencies@exampleupi'
# the 18 staff payments on Lakshmi Agencies' consolidated receipt LA/SR/26-27/0002 (the production run's), as printed
PAYMENTS = [('627516578395', '02/10 16:42', 'Ayesha Sultana', 12), ('627517019023', '02/10 17:22', 'D. Ramya', 8),
            ('627517767110', '02/10 17:53', 'Shaik Imran', 12), ('627518084744', '02/10 18:25', 'B. Yadagiri', 2),
            ('627518883577', '02/10 18:52', 'Syed Ameer', 5), ('627519441220', '02/10 19:19', 'T. Rajesh', 10),
            ('627609657239', '03/10 09:11', 'M. Anil', 9), ('627609021474', '03/10 09:35', 'S. Haritha', 5),
            ('627610118786', '03/10 10:23', 'P. Swathi', 11), ('627610387873', '03/10 10:50', 'K. Divya', 12),
            ('627611175053', '03/10 11:05', 'G. Srinivas', 9), ('627611564343', '03/10 11:40', 'S. Ravi Kumar', 6),
            ('627612210268', '03/10 12:13', 'Md Saleem', 10), ('627612137140', '03/10 12:43', 'Mohd Irfan', 6),
            ('627613385560', '03/10 13:24', 'Fatima Begum', 5), ('627613171045', '03/10 13:37', 'J. Suresh', 12),
            ('627614058571', '03/10 14:18', 'N. Mahesh', 12), ('627614237871', '03/10 14:41', 'R. Kavya', 4)]

def pay_cells(upi, n=21):
    """the code the app draws beside the distributor's UPI address (design3 trade.jsx payCells, SC-87): an illustration
    drawn from the address, the same cells here as in the app"""
    seed = 7
    for ch in upi: seed = (seed * 31 + ord(ch)) & 0xFFFFFFFF
    def r():
        nonlocal seed
        seed = (seed * 1103515245 + 12345) & 0xFFFFFFFF
        return seed / 2 ** 32
    def corner(x, y):
        for a, b in ((0, 0), (n - 7, 0), (0, n - 7)):
            if a <= x < a + 7 and b <= y < b + 7: return (a, b)
        return None
    cells = []
    for y in range(n):
        for x in range(n):
            f = corner(x, y)
            if f:
                if max(abs(x - f[0] - 3), abs(y - f[1] - 3)) != 2: cells.append((x, y))
            elif r() < 0.47: cells.append((x, y))
    return cells

@lru_cache(maxsize=None)
def pay_code(size, dark=(16, 22, 19)):
    """the app's code at size px, crisp (whole-pixel cells), on white with a quiet zone"""
    n = 23
    k = size // n
    s = k * n
    im = np.full((s, s, 3), 255, np.uint8)
    for x, y in pay_cells(UPI):
        im[(y + 1) * k:(y + 2) * k, (x + 1) * k:(x + 2) * k] = dark[::-1]
    return im

def phone_screen(state, p, w=390, h=844):
    """the staff member's own UPI app (a generic payer's app, no real brand): 'scan' (the viewfinder on the
    distributor's code, a scan line sweeping), 'pay' (to Lakshmi Agencies, ₹96 for 12 packs), 'paid' (the UPI reference).
    p: progress within the state, 0..1. Returns BGR uint8 at 2x."""
    S = 2
    ref, when, who, n = PAYMENTS[2]
    amount = n * 8
    if state == 'scan':
        im = Image.new('RGB', (w * S, h * S), (18, 20, 22))
        d = ImageDraw.Draw(im)
        # the tablet in the viewfinder: its white card with the code, slightly soft, a little off-square
        cw = 300
        x0, y0 = (w - cw) // 2, 250
        d.rounded_rectangle([(x0 - 26) * S, (y0 - 70) * S, (x0 + cw + 26) * S, (y0 + cw + 90) * S], radius=28 * S, fill=(232, 238, 235))
        draw_text(d, ((x0 - 6) * S, (y0 - 52) * S), 'Staff sale · Mango Drink', 'g', 17 * S, (40, 60, 50), 640)
        code = Image.fromarray(pay_code(cw * S - (cw * S) % 23)[..., ::-1])
        im.paste(code, (x0 * S, y0 * S))
        draw_text(d, ((x0 - 6) * S, (y0 + cw + 18) * S), UPI, 'g', 15 * S, (40, 60, 50), 560)
        im = im.filter(__import__('PIL.ImageFilter', fromlist=['GaussianBlur']).GaussianBlur(1.2 * S))
        d = ImageDraw.Draw(im)
        # the scan frame's corners and a line sweeping
        fx0, fy0, fx1, fy1 = x0 - 14, y0 - 14, x0 + cw + 14, y0 + cw + 14
        L_ = 46
        for (cx, cy, dx, dy) in ((fx0, fy0, 1, 1), (fx1, fy0, -1, 1), (fx0, fy1, 1, -1), (fx1, fy1, -1, -1)):
            d.line([cx * S, cy * S, (cx + dx * L_) * S, cy * S], fill=(52, 211, 128), width=6 * S)
            d.line([cx * S, cy * S, cx * S, (cy + dy * L_) * S], fill=(52, 211, 128), width=6 * S)
        sy = fy0 + (fy1 - fy0) * (0.5 - 0.5 * math.cos(p * math.pi * 2))
        d.rectangle([(fx0 + 8) * S, (sy - 1.5) * S, (fx1 - 8) * S, (sy + 1.5) * S], fill=(52, 211, 128))
        draw_text(d, (34 * S, 90 * S), 'Scan to pay', 'g', 30 * S, (244, 248, 245), 680)
        draw_text(d, (34 * S, 134 * S), 'Point at a UPI QR code', 'g', 19 * S, (170, 186, 178), 440)
        d.rounded_rectangle([34 * S, (h - 118) * S, (w - 34) * S, (h - 62) * S], radius=28 * S, fill=(40, 44, 48))
        draw_text(d, (80 * S, (h - 102) * S), 'Paying from Shaik Imran’s UPI', 'g', 17 * S, (200, 210, 205), 520)
    else:
        im = Image.new('RGB', (w * S, h * S), (246, 248, 247))
        d = ImageDraw.Draw(im)
        if state == 'pay':
            draw_text(d, (34 * S, 84 * S), 'Paying', 'g', 20 * S, (90, 104, 98), 520)
            d.ellipse([34 * S, 128 * S, 98 * S, 192 * S], fill=(23, 107, 78))
            draw_text(d, (47 * S, 145 * S), 'LA', 'g', 26 * S, (236, 243, 239), 700)
            draw_text(d, (114 * S, 132 * S), 'Lakshmi Agencies', 'g', 25 * S, (16, 24, 20), 680)
            draw_text(d, (114 * S, 166 * S), UPI, 'g', 16 * S, (90, 104, 98), 460)
            draw_text(d, (34 * S, 262 * S), '₹' + f'{amount}', 'b', 86 * S, (16, 24, 20), 760)
            draw_text(d, (34 * S, 380 * S), f'{n} packs · Munchly Mango Drink 200 ml', 'g', 18 * S, (60, 74, 68), 520)
            draw_text(d, (34 * S, 408 * S), 'Staff sale at Begum Bazaar godown, ₹8 a pack', 'g', 16 * S, (100, 114, 108), 420)
            g = clamp(p * 1.6)
            d.rounded_rectangle([34 * S, (h - 140) * S, (w - 34) * S, (h - 76) * S], radius=32 * S,
                                fill=tuple(int(a + (b - a) * g) for a, b in zip((23, 124, 82), (31, 149, 99))))
            draw_text(d, ((w / 2 - 52) * S, (h - 122) * S), f'Pay ₹{amount}', 'g', 24 * S, (255, 255, 255), 680)
        else:
            e = clamp(spring(p * 1.4, zeta=0.6, w=10), 0, 1.15)
            r = 64 * e
            cx, cy = w / 2, 230
            d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=(31, 149, 99))
            if e > 0.5:
                d.line([(cx - 26) * S, (cy + 2) * S, (cx - 6) * S, (cy + 22) * S, (cx + 30) * S, (cy - 20) * S], fill=(255, 255, 255), width=int(9 * S), joint='curve')
            draw_text(d, ((w / 2 - text_w(f'₹{amount}.00 paid', 'b', 46, 760) / 2) * S, 330 * S), f'₹{amount}.00 paid', 'b', 46 * S, (16, 24, 20), 760)
            draw_text(d, ((w / 2 - text_w('to Lakshmi Agencies', 'g', 21, 520) / 2) * S, 398 * S), 'to Lakshmi Agencies', 'g', 21 * S, (60, 74, 68), 520)
            d.rounded_rectangle([34 * S, 470 * S, (w - 34) * S, 640 * S], radius=20 * S, fill=(234, 240, 237))
            for k_, (a_, b_) in enumerate([('UPI Ref. No.', ref), ('Date', '02 Oct 2026, 17:53'), ('From', who)]):
                draw_text(d, (54 * S, (490 + k_ * 50) * S), a_, 'g', 16 * S, (100, 114, 108), 440)
                draw_text(d, (54 * S, (510 + k_ * 50) * S), b_, 'g', 20 * S, (16, 24, 20), 600)
    return cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)

@lru_cache(maxsize=None)
def payment_row(i, w=520):
    S = 2
    ref, when, who, n = PAYMENTS[i]
    im = Image.new('RGBA', (w * S, 44 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, 40 * S], radius=10 * S, fill=(12, 26, 19, 230), outline=(63, 176, 123, 90), width=int(1 * S))
    draw_text(d, (14 * S, 9 * S), f'{i + 1:>2}', 'g', 17 * S, (115, 201, 157), 700)
    draw_text(d, (52 * S, 9 * S), who, 'g', 18 * S, (236, 243, 239), 600)
    draw_text(d, (230 * S, 11 * S), f'UPI {ref}', 'g', 14 * S, (150, 172, 160), 440)
    t = f'{n} × ₹8 = ₹{n * 8}'
    draw_text(d, ((w - 14 - text_w(t, 'g', 17, 620)) * S, 9 * S), t, 'g', 17 * S, (236, 243, 239), 620)
    return to_sprite(im.resize((w, 44), Image.LANCZOS))

class Payments:
    """the 18 staff payments arriving one by one into a column, the running total counting up to the receipt's own
    ₹1,200 for 150 packs; older rows scroll up out of the column"""
    def __init__(self, x, y, u0, u1, rows=7, every=0.16):
        self.x, self.y, self.u0, self.u1, self.rows, self.every = x, y, u0, u1, rows, every
        self.head = words_sprite(kicker='EVERY STAFF PAYMENT, BY ITS UPI REFERENCE', width=600)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        blit(f, self.head, self.x, self.y, a)
        k = int(clamp((u - self.u0 - 0.3) / self.every, 0, len(PAYMENTS)))
        first = max(0, k - self.rows)
        for j, i in enumerate(range(first, k)):
            t_in = self.u0 + 0.3 + i * self.every
            e = ease_out((u - t_in) / 0.3)
            blit(f, payment_row(i), self.x + 30 * (1 - e), self.y + 46 + j * 48, a * clamp((u - t_in) / 0.2))
        packs = sum(p[3] for p in PAYMENTS[:k]); paid = packs * 8
        tot = text_sprite(f'{k} payments · {packs} packs · ₹{paid:,}', 'g', 28, 680, (52, 211, 128) if k == 18 else (236, 243, 239))
        blit(f, tot, self.x, self.y + 46 + self.rows * 48 + 14, a)

# ---------------------------------------------------------------- 7 · stills moved through in 2.5D

DEPTH = HERE / 'build' / 'depth'

class Still25D:
    """a still as the whole frame, moved through with depth: its depth map (depth.py) gives near things a larger share
    of the dolly than far ones, so a slow push or drift opens up like a real camera move. z: (start, end) zoom; pan:
    ((x0, y0), (x1, y1)) output px the near plane slides; focus: the point the push heads for (0..1)"""
    def __init__(self, key, z=(1.0, 1.08), pan=((0, 0), (0, 0)), dur=5.0, focus=(0.5, 0.5), depth_k=0.9, grade=None):
        p = HERE / 'img' / f'{key}-L.png'
        if not p.exists(): p = HERE / 'img' / f'{key}.png'
        img = cv2.imread(str(p))
        if img is None: img = np.full((H, W, 3), 24, np.uint8)   # until the keyframe exists
        d = cv2.imread(str(DEPTH / f'{p.stem}.png'), cv2.IMREAD_UNCHANGED)
        # a little larger than the frame, so the move never runs out of picture
        self.S = 1.08
        cw, ch = int(W * self.S), int(H * self.S)
        k = max(cw / img.shape[1], ch / img.shape[0])
        img = cv2.resize(img, (int(img.shape[1] * k), int(img.shape[0] * k)), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
        ox, oy = (img.shape[1] - cw) // 2, (img.shape[0] - ch) // 2
        self.k0, self.ox, self.oy = k, ox, oy   # the keyframe's own pixels to the working image's
        self.img = img[oy:oy + ch, ox:ox + cw].astype(np.float32) / 255
        if d is None: d = np.full(img.shape[:2], 32768, np.uint16)
        d = cv2.resize(d, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR)[oy:oy + ch, ox:ox + cw]
        self.depth = cv2.GaussianBlur(d.astype(np.float32) / 65535, (0, 0), 6)
        self.z, self.pan, self.dur, self.focus, self.k, self.grade = z, pan, dur, focus, depth_k, grade
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        self.X, self.Y = xs, ys

    def maps(self, u):
        e = ease_in_out(u / max(1e-3, self.dur))
        z = self.z[0] + (self.z[1] - self.z[0]) * e
        px = self.pan[0][0] + (self.pan[1][0] - self.pan[0][0]) * e
        py = self.pan[0][1] + (self.pan[1][1] - self.pan[0][1]) * e
        fx, fy = self.focus[0] * W, self.focus[1] * H
        # the source pixel under each output pixel: first by the mean zoom, then corrected by the depth found there
        off = (self.S - 1) / 2
        sx0 = fx + (self.X - fx) / z + W * off
        sy0 = fy + (self.Y - fy) / z + H * off
        D = cv2.remap(self.depth, sx0, sy0, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        zz = z ** (1 - self.k * 0.5 + self.k * D)        # near (D=1) grows faster than far (D=0)
        mx = fx + (self.X - fx - px * (0.4 + D)) / zz + W * off
        my = fy + (self.Y - fy - py * (0.4 + D)) / zz + H * off
        return mx, my, zz

    def draw(self, f, u, L=None):
        mx, my, _ = self.maps(u)
        f[:] = cv2.remap(self.img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        if self.grade: f[:] = fx.grade(f, **self.grade)

    def src_out(self, pt, u):
        """where a point in the keyframe's own pixels lands in the frame at u, at its own depth"""
        return self.to_out(((pt[0] * self.k0 - self.ox) / self.S, (pt[1] * self.k0 - self.oy) / self.S), u)

    def to_out(self, pt, u):
        """where a source point (in the 1920 x 1080 keyframe) lands in the frame at u, at its own depth"""
        e = ease_in_out(u / max(1e-3, self.dur))
        z = self.z[0] + (self.z[1] - self.z[0]) * e
        px = self.pan[0][0] + (self.pan[1][0] - self.pan[0][0]) * e
        py = self.pan[0][1] + (self.pan[1][1] - self.pan[0][1]) * e
        fx_, fy_ = self.focus[0] * W, self.focus[1] * H
        off = (self.S - 1) / 2
        sx, sy = pt[0] * self.S, pt[1] * self.S
        D = float(self.depth[int(clamp(sy, 0, self.depth.shape[0] - 1)), int(clamp(sx, 0, self.depth.shape[1] - 1))])
        zz = z ** (1 - self.k * 0.5 + self.k * D)
        return fx_ + (sx - W * off - fx_) * zz + px * (0.4 + D), fy_ + (sy - H * off - fy_) * zz + py * (0.4 + D)

class StillFace:
    """a face shot from its keyframe, moved through in 2.5D (Still25D), where no clip kept the device the right way
    round (LTX kept turning the phone's screen to the camera): frame(u) as Footage's, for DeviceShot"""
    def __init__(self, key, z=(1.0, 1.06), pan=((0, 0), (-16, -4)), dur=3.0, focus=(0.42, 0.42), depth_k=0.85):
        self.s = Still25D(key, z=z, pan=pan, dur=dur, focus=focus, depth_k=depth_k)
        self.buf = np.zeros((H, W, 3), np.float32)
        self.cache = (None, None)
    def frame(self, u):
        if self.cache[0] == round(u, 4): return self.cache[1]
        self.buf[:] = 0
        self.s.draw(self.buf, u)
        out = ((np.clip(self.buf, 0, 1) * 255 + 0.5).astype(np.uint8), None)
        self.cache = (round(u, 4), out)
        return out

class Layered:
    """a background part, then light layers over it (fx.Rays, fx.Dust …): items are (layer, alpha)"""
    def __init__(self, base, layers=(), vign=0.0):
        self.base, self.layers, self.vign = base, layers, vign
    def draw(self, f, u, L=None):
        self.base.draw(f, u, L)
        if self.vign: f *= fx.vignette(self.vign)
        for lay, a in self.layers:
            lay.draw(f, u, a(u) if callable(a) else a)

# ---------------------------------------------------------------- 8 · the staff sale, as one scene

import json as _json
SCREENS = _json.loads((HERE / 'build' / 'screens.json').read_text()) if (HERE / 'build' / 'screens.json').exists() else {}

def screen_of(key):
    return np.float32(SCREENS[key]['quad']) if key in SCREENS else None

@lru_cache(maxsize=None)
def phone_frame(w, h, r=46):
    """a phone's black body round a w x h screen: (sprite, screen offset)"""
    S = 2; pad = 12
    im = Image.new('RGBA', ((w + 2 * pad) * S, (h + 2 * pad) * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=(r + pad) * S, fill=(14, 16, 18, 255))
    d.rounded_rectangle([pad * S, pad * S, (pad + w) * S, (pad + h) * S], radius=r * S, fill=(0, 0, 0, 0))
    d.rounded_rectangle([(pad + w / 2 - 60) * S, (pad + 10) * S, (pad + w / 2 + 60) * S, (pad + 38) * S], radius=14 * S, fill=(14, 16, 18, 255))
    return to_sprite(im.resize((w + 2 * pad, h + 2 * pad), Image.LANCZOS)), pad

class UpiScene:
    """The staff sale, so a viewer can follow it: over a staff member's shoulder he points his phone at the code on
    Lakshmi Agencies' tablet (the app's own Staff sale card, live); his phone's screen rises out of his hand and he pays
    ₹96 for 12 packs, the UPI reference on screen; then all 18 staff payments arrive and add up to the receipt's own
    ₹1,200 for 150 packs; and Lakshmi Agencies' app shows Vision's check of that receipt against the count.
    t_pay, t_paid, t_list, t_vision: local times of the beats; lwin: her app's window (Vision's read)."""
    PH = (1330, 150, 1330 + 351, 150 + 760)   # the phone window at rest (a 390 x 844 screen at 0.9)

    def __init__(self, t_lift, t_pay, t_paid, t_list, t_vision, lwin, L):
        self.ots = Footage('s-upi')
        self.tq, self.pq = screen_of('s-upi'), screen_of('s-upi-phone')
        tp = TRACK / 's-upi-phone.json'   # the phone's screen through the clip (track3.py); the tablet's is the footage's own
        self.pqs = vfx.load_track(tp)[0] if (tp.exists() and self.ots.clip) else None
        self.t_lift, self.t_pay, self.t_paid, self.t_list, self.t_vision, self.L = t_lift, t_pay, t_paid, t_list, t_vision, L
        self.lwin = lwin
        self.tab = FrameSource(REC['mango'], DEV['L'])
        self.pay = Payments(120, 180, t_list, L + 1.0, rows=12, every=0.075)   # all 18 in before Vision's check, then kept beside it
        self.frame_spr, self.pad = phone_frame(351, 760)
        self.card = card_sprite('₹96 paid by UPI', 'Shaik Imran, 12 packs at ₹8 · UPI ref 627517767110', ('live', 'STAFF SALE'), 420)
        self.bg = None

    def phone_ui(self, u):
        if u < self.t_pay: return phone_screen('scan', (u % 1.6) / 1.6)
        if u < self.t_paid: return phone_screen('pay', clamp((u - self.t_pay) / max(0.1, self.t_paid - self.t_pay)))
        return phone_screen('paid', clamp((u - self.t_paid) / 0.8))

    def draw(self, f, u, L=None):
        uo = min(u, self.t_lift)   # the clip holds the scan only so long: from the lift, behind the rack, its frame is held
        img, tq = self.ots.frame(uo)
        if tq is None: tq = self.tq
        pq = self.pq if self.pqs is None else self.pqs[min(self.ots.index(uo), len(self.pqs) - 1)]
        base = img.astype(np.float32) / 255
        tab = self.tab.get(457.4).astype(np.float32) / 255
        vfx.insert(base, img, tq, tab)
        ui = cv2.resize(self.phone_ui(u), (390, 844), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        p = (u - self.t_lift) / 1.1
        vfx.insert(base, img, pq, ui)   # the phone keeps its screen as the screen rises out of it
        if p <= 0:
            f[:] = base
        else:
            # the room racks out while the phone's screen rises to the window
            if self.bg is None:
                self.bg = fx.defocus(base, 16) * 0.5
            x0, y0, x1, y1 = self.PH
            if p < 1:
                f[:] = vfx.lift(base, pq, (x0, y0, x1, y1), ui, p, blur=16, dim=0.5, r=40)
            else:
                f[:] = self.bg
                blit(f, self.frame_spr, x0 - self.pad, y0 - self.pad, 1.0)
                sc = cv2.resize(ui, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
                ix0, iy0, m = rrect_alpha(x0, y0, x1, y1, 40, pad=0)
                over(f, x0, y0, sc, m[:sc.shape[0], :sc.shape[1]])
                if u > self.t_paid + 0.4:
                    ca = clamp((u - self.t_paid - 0.4) / 0.35) * (1 - ramp(u, self.t_vision - 0.4, self.t_vision))
                    blit(f, self.card, x0 - self.card.shape[1] - 40, y0 + 560 + 8 * (1 - ease_out((u - self.t_paid - 0.4) / 0.4)), ca)
            self.pay.draw(f, u)
