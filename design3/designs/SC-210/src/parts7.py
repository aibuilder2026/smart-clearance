"""SC-209 cut 7: the pieces the maintainer's notes on cut 6 asked for. Motion where the frame stood empty, every
figure from the model (money.js, ledger.js, design3's data) or the production recordings:

- the opening, over the same godown: a scan finds each carton's days left, the days run out, the write-off is stamped,
  and the statement lands;
- the bin: what destroying it costs the planet, beside what it costs Munchly;
- the brand: the write-off turned into recovery, three brands' factories with their own workspaces, and the best exit
  for every pack drawn as it flows;
- the kirana clusters as maps (the offer going out, the scheme filling, the sad path's no's), the invoices stacking;
- ExpireSoon explained as an imaginary marketplace, and the Negotiator's counter on a price ladder;
- the offer window closing on its packets, the proof the destruction needs, the certificate signed in place, Vision's
  checks, the Watcher's sell-through."""
import json, math
from functools import lru_cache
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from kit import *
import kit
from parts import words_sprite, card_sprite, chip_sprite, studio, money, avatar_img, PEOPLE, mark_sprite
from parts3 import text_sprite, pack_sprite, glow_sprite, Footage, Still25D
from parts4 import ClipBG, _glow_line, _dot, fm_spring, ease_in, _zoom
from parts5 import munchly_badge
from parts6 import G, G2, AMBER, RED, MUTED, MONO, icon_sprite, kicker_sprite, StampedGodown
import parts3
import fx

INK = (240, 246, 242)
GLASS = (11, 26, 19)


# ---------------------------------------------------------------- shared

@lru_cache(maxsize=None)
def TX(text, kind='g', size=24, wght=600, rgb=INK, track=0.0):
    """a line of text as a sprite (cached)"""
    return text_sprite(text, kind, size, wght, rgb, track)


@lru_cache(maxsize=None)
def ICON(name, size, rgb=INK):
    return icon_sprite(name, size, rgb)


def panel(f, x0, y0, x1, y1, a, r=18, fill=GLASS, alpha=0.88, edge=G2, edge_a=0.45, shade=0.45):
    """a dark glass panel: its shadow, its fill and a thin edge"""
    if a <= 0.002: return
    if shade: shadow(f, x0, y0, x1, y1, r, alpha=shade * a)
    ix, iy, al = rrect_alpha(x0, y0, x1, y1, r)
    over(f, ix, iy, col(fill), al * alpha * a)
    if edge is not None: ring(f, x0, y0, x1, y1, r, 1.0, edge_a * a, color=edge, width=1.2, glow=False)


def roll(u, t0, t1, v0, v1):
    """a figure rolling from v0 to v1 between t0 and t1"""
    return v0 + (v1 - v0) * ease_out(clamp((u - t0) / max(1e-6, t1 - t0)))


def n0(v):
    """an integer in Indian grouping, no symbol"""
    return money(v).replace('₹', '')


def slam(u, t0):
    """(alpha, scale) of something slammed in at t0: in fast from a little large, settling on a spring"""
    if u < t0: return 0.0, 1.0
    a = clamp((u - t0) / 0.07)
    sp = fm_spring(u - t0, 520, 26)
    return a, 1.32 - 0.32 * sp


class Group:
    """items drawn together"""
    def __init__(self, *items): self.items = items
    def draw(self, f, u, L=None):
        for it in self.items: it.draw(f, u, L)


# ---------------------------------------------------------------- 0 · the opening: a scan, the days running out, the stamps

# the godown's cartons the scan finds (cartons.py's label tracks), the Instant Poha on the left of the aisle and the Mango
# Drink on the right, as cut 5 labelled them; the Mango's front three (60, 77, 102) are the carton the camera dives into
# (77) and the two the big stamps land on
TAGS = [('57', 'poha'), ('72', 'poha'), ('89', 'poha'), ('84', 'poha'), ('90', 'poha'),
        ('60', 'mango'), ('77', 'mango'), ('102', 'mango'), ('59', 'mango'), ('99', 'mango'), ('141', 'mango'), ('694', 'mango')]
# days to the best-before: the Mango Drink MF-2410-118 has 22 left on day 0 (2 Oct), the Instant Poha MF-2410-402 200
# (design3's data); the scan runs the month before day 0 out, so each counts down 31 days
DAYS = {'mango': (53, 22), 'poha': (231, 200)}
PROD = {'mango': 'MANGO DRINK', 'poha': 'INSTANT POHA'}


@lru_cache(maxsize=None)
def tag_sprite(days, kind, scale_key):
    """a carton's tag: its days to the best-before, coloured by what they allow (the Poha green; the Mango amber while
    a clearance marketplace would still take it, red under its 30 days)"""
    s = scale_key / 100
    S = 2
    rgb = G if kind == 'poha' else (AMBER if days >= 30 else RED)
    big = f'{days} DAYS'
    sm = PROD[kind]
    fb, fs = int(30 * s), int(13 * s)
    w = int(max(text_w(big, 'b', fb, 780), text_w(sm, 'g', fs, 700, 0.12)) + 44 * s)
    h = int(66 * s)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=12 * s * S, fill=(9, 16, 12, 228), outline=rgb + (230,), width=max(1, int(2 * s * S)))
    d.ellipse([12 * s * S, 14 * s * S, 22 * s * S, 24 * s * S], fill=rgb + (255,))
    draw_text(d, (30 * s * S, 8 * s * S), sm, 'g', fs * S, rgb + (255,), 700, 0.12)
    draw_text(d, (12 * s * S, 26 * s * S), big, 'b', fb * S, (244, 248, 245, 255), 780)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class StampedGodown7(StampedGodown):
    """cut 6's godown (the clip with every label printed, the WRITTEN OFF stamps), and over it a scan: a line of light
    sweeps the aisle, and each carton it crosses gets a tag with its days to the best-before. The days run down the
    month to day 0 (the Poha's stay green, the Mango's run amber, then red), and a carton's tag gives way to its stamp.
    tags: [(track, kind)]; scan: (u0, u1) of the sweep; count: (u0, u1) of the days running out; gone: {track: u}"""
    def __init__(self, stamps, tags, scan, count, gone, out):
        super().__init__(stamps)
        self.tags, self.scan, self.count, self.gone, self.out = tags, scan, count, gone, out

    def scan_x(self, u):
        s0, s1 = self.scan
        return -260 + (W + 520) * ease_in_out(clamp((u - s0) / (s1 - s0)))

    def draw(self, f, u, L=None):
        super().draw(f, u, L)
        k = self.bg.foot.index(u)
        s0, s1 = self.scan
        # the line of light
        if s0 <= u <= s1 + 0.1:
            x = self.scan_x(u)
            band = np.clip(1 - np.abs(np.arange(W, dtype=np.float32) - x) / 150, 0, 1) ** 2
            trail = np.clip((x - np.arange(W, dtype=np.float32)) / 420, 0, 1) * np.clip(1 - (x - np.arange(W, dtype=np.float32)) / 420, 0, 1)
            a = fade(u, s0, s1 + 0.1, 0.15, 0.25)
            glowv = (band * 0.22 + trail * 0.05)[None, :, None] * a
            f += glowv * col(G)
            x0, x1 = int(max(0, x - 2)), int(min(W, x + 2))
            if x1 > x0: f[:, x0:x1] = f[:, x0:x1] * (1 - 0.7 * a) + col((150, 255, 200)) * 0.7 * a
        # the tags
        c0, c1 = self.count
        for tid, kind in self.tags:
            q = self.quad(tid, k)
            if q is None: continue
            cx = float(q[:, 0].mean())
            x_hit = cx
            # when the line crossed it
            p = clamp((x_hit + 260) / (W + 520))
            # invert the ease: find the time the line reached x (bisection)
            lo, hi = s0, s1
            for _ in range(18):
                mid = (lo + hi) / 2
                if self.scan_x(mid) < x_hit: lo = mid
                else: hi = mid
            t_on = lo
            if u < t_on: continue
            gone = self.gone.get(tid, self.out)
            a = clamp((u - t_on) / 0.12) * (1 - clamp((u - gone) / 0.18))
            if a <= 0: continue
            d0, d1 = DAYS[kind]
            days = int(round(d0 + (d1 - d0) * ease_in_out(clamp((u - c0) / (c1 - c0)))))
            wq = max(np.linalg.norm(q[1] - q[0]), np.linalg.norm(q[2] - q[3]))
            sc = clamp(wq / 70, 0.52, 1.0)
            spr = tag_sprite(days, kind, int(round(sc * 100)))
            sp = fm_spring(u - t_on, 380, 22)
            top = float(q[:, 1].min())
            # the near-left stack leaves the frame: its tags sit to the right of their labels
            if kind == 'poha' and cx < 160:
                tx, ty = float(q[:, 0].max()) + 10, float(q[:, 1].mean()) - spr.shape[0] / 2
                line(f, (float(q[:, 0].max()), float(q[:, 1].mean())), (tx, float(q[:, 1].mean())), G if kind == 'poha' else RED, alpha=0.8 * a, width=1.6, dot=False)
            else:
                tx, ty = cx - spr.shape[1] / 2, top - 12 * sc - spr.shape[0]
                line(f, (cx, top - 2), (cx, top - 12 * sc), (230, 240, 235), alpha=0.7 * a, width=1.4, dot=False)
            # the label it belongs to, bracketed as the line finds it
            if u - t_on < 0.5:
                qa = (1 - (u - t_on) / 0.5) * a
                x0, y0, x1, y1 = q[:, 0].min() - 4, q[:, 1].min() - 4, q[:, 0].max() + 4, q[:, 1].max() + 4
                ring(f, x0, y0, x1, y1, 4, 1.0, qa, color=G, width=2.0, glow=True)
            blit(f, spr, tx + spr.shape[1] / 2, ty + spr.shape[0], a, scale=0.6 + 0.4 * sp, ox=spr.shape[1] / 2, oy=spr.shape[0])


class DateTicker:
    """the godown and its date in the corner, the month running out to day 0 (1 Sep to Fri 2 Oct 2026)"""
    def __init__(self, x, y, u0, u1, c0, c1):
        self.x, self.y, self.u0, self.u1, self.c0, self.c1 = x, y, u0, u1, c0, c1
        self.kick = kicker_sprite("A DISTRIBUTOR'S GODOWN", (232, 242, 236), 17)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        day = int(round(31 * ease_in_out(clamp((u - self.c0) / (self.c1 - self.c0)))))   # 0 = 1 Sep, 31 = 2 Oct
        d, mon = (day + 1, 'SEP') if day < 30 else (day - 29, 'OCT')
        date = f'{d} {mon} 2026'
        big = TX(date, 'b', 54, 780)
        w = max(self.kick.shape[1], big.shape[1]) + 44
        panel(f, self.x, self.y, self.x + w, self.y + 116, a, r=16, alpha=0.72)
        blit(f, self.kick, self.x + 22, self.y + 16, a)
        blit(f, big, self.x + 22, self.y + 42, a)
        if day >= 31 and u > self.c1:
            blit(f, TX('DAY 0', 'g', 15, 700, RED, 0.14), self.x + 22 + big.shape[1] + 14, self.y + 70, a * clamp((u - self.c1) / 0.3))


class Statement:
    """the opening's statement, slammed in line by line over the left of the godown, the rupees rolling up as the
    stamps land: lines [(text or callable(u), size, rgb, u)]; a caption under them"""
    def __init__(self, x, y, lines, caption, u_cap, u1, gap=104):
        self.x, self.y, self.lines, self.caption, self.u_cap, self.u1, self.gap = x, y, lines, caption, u_cap, u1, gap
        self.cap = TX(caption, 'g', 22, 520, (205, 220, 212))
        g = np.linspace(1, 0, 1100, dtype=np.float32) ** 1.6
        self.shade = np.zeros((H, W), np.float32)
        self.shade[:, :1100] = g[None, :]
        yy = np.clip((np.arange(H, dtype=np.float32) - (y - 120)) / 260, 0, 1)
        self.shade *= yy[:, None]
    def draw(self, f, u, L=None):
        t_first = self.lines[0][3]
        out = 1 - clamp((u - self.u1) / 0.25)
        sa = clamp((u - t_first + 0.15) / 0.4) * out
        if sa > 0:
            f *= (1 - 0.5 * sa * self.shade)[..., None]
        for i, (txt, size, rgb, t0) in enumerate(self.lines):
            a, sc = slam(u, t0)
            a *= out
            if a <= 0: continue
            s = txt(u) if callable(txt) else txt
            spr = TX(s, 'b', size, 800, rgb)
            y = self.y + i * self.gap
            blit(f, spr, self.x, y + spr.shape[0] / 2, a, scale=sc, ox=0, oy=spr.shape[0] / 2)
        ca = clamp((u - self.u_cap) / 0.3) * out
        if ca > 0: blit(f, self.cap, self.x + 4, self.y + len(self.lines) * self.gap + 4, ca)


class RedPulse:
    """a red flush at the frame's edges as each big stamp lands"""
    def __init__(self, times):
        self.times = times
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
        self.m = np.clip((d - 0.55) / 0.75, 0, 1) ** 1.5
    def draw(self, f, u, L=None):
        a = 0.0
        for t in self.times:
            if u >= t: a = max(a, math.exp(-(u - t) / 0.16) * 0.42)
        if a > 0.01:
            m = (self.m * a)[..., None]
            f[:] = f * (1 - m) + col((200, 30, 24)) * m


# ---------------------------------------------------------------- 0 · the bin: what destroying it costs the planet

class ClipPush:
    """a clip as the whole frame, frame for frame, under a slow push (or the keyframe on its own push until the clip
    exists): the bin's ground"""
    def __init__(self, key, z=(1.0, 1.07), pt=(W * 0.55, H * 0.55), dur=5.0):
        self.foot = Footage(key, push=0.0)
        self.z, self.pt, self.dur = z, pt, dur
    def draw(self, f, u, L=None):
        img, _ = self.foot.frame(u)
        z = self.z[0] + (self.z[1] - self.z[0]) * ease_in_out(clamp(u / self.dur))
        f[:] = _zoom(img.astype(np.float32) / 255, z, self.pt)


@lru_cache(maxsize=None)
def esg_row(icon, big, label, w=560):
    """one of the bin's costs to the planet: an icon in its red disc, the figure, what it is"""
    S = 2; h = 86
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([4 * S, 12 * S, 64 * S, 72 * S], fill=(58, 20, 16, 235), outline=(229, 92, 74, 230), width=int(1.6 * S))
    draw_text(d, (82 * S, 6 * S), big, 'b', 40 * S, (255, 150, 128, 255), 780)
    draw_text(d, (84 * S, 54 * S), label, 'g', 18 * S, (214, 200, 194, 255), 480)
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    ic = ICON(icon, 30, (255, 170, 150))
    a_ = ic[..., 3:4]; spr[27:57, 19:49] = spr[27:57, 19:49] * (1 - a_) + ic
    return spr


class ESGPanel:
    """what the bin costs the planet, row by row as the voice reaches the destruction: the kilos of food buried, their
    CO₂e (money.js's 2.5 kg a kg, indicative), the plastic packaging, the packs no one will eat, and that it is reported
    as waste under BRSR. rows: [(icon, figure(u) or text, label, u)]"""
    def __init__(self, x, y, rows, u_foot, u1, w=600):
        self.x, self.y, self.rows, self.u_foot, self.u1, self.w = x, y, rows, u_foot, u1, w
        self.kick = kicker_sprite('WHAT THE BIN COSTS THE PLANET', (255, 150, 128), 17)
        self.foot = chip_sprite('Reported as waste · BRSR Principle 6', 'dot', 20)
    def draw(self, f, u, L=None):
        t0 = self.rows[0][3]
        a = fade(u, t0 - 0.3, self.u1, 0.35, 0.35)
        if a <= 0: return
        n = sum(1 for r in self.rows if u >= r[3])
        rh = 92
        grow = sum(rh * ease_out(clamp((u - r[3]) / 0.35)) for r in self.rows)
        fh = 64 * ease_out(clamp((u - self.u_foot) / 0.35))
        panel(f, self.x - 18, self.y - 18, self.x + self.w + 18, self.y + 46 + grow + fh, a, fill=(20, 9, 7), alpha=0.82, edge=RED, edge_a=0.4)
        blit(f, self.kick, self.x, self.y, a)
        for i, (icon, fig, label, t) in enumerate(self.rows):
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.35))
            big = fig(u) if callable(fig) else fig
            spr = esg_row(icon, big, label, self.w)
            blit(f, spr, self.x + 24 * (1 - e), self.y + 40 + i * rh, a * e)
        if u >= self.u_foot:
            e = ease_out(clamp((u - self.u_foot) / 0.35))
            blit(f, self.foot, self.x, self.y + 46 + len(self.rows) * rh + 8 * (1 - e), a * e)


# ---------------------------------------------------------------- 1 · the brand: recovery, three brands, the best exit

class RecoveryMorph:
    """under the brand's line: the batch's write-off in red as 'write-offs' is struck, then rolling over into what the
    plan recovered, in green, as 'recovery' lights (money.js: −₹22,657 if destroyed, ₹16,917 recovered, a ₹22,194
    swing)"""
    def __init__(self, x, y, u_strike, u_rec, u1):
        self.x, self.y, self.u0, self.ur, self.u1 = x, y, u_strike + 0.15, u_rec, u1
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.25, 0.3)
        if a <= 0: return
        p = ease_in_out(clamp((u - self.ur) / 0.75))
        v = -22657.2 + (16917.1 + 22657.2) * p
        rgb = tuple(int(r0 + (r1 - r0) * p) for r0, r1 in zip((255, 120, 100), (52, 211, 128)))
        num = TX(money(v), 'b', 66, 800, rgb)
        al, sc = slam(u, self.u0)
        blit(f, num, self.x, self.y + num.shape[0] / 2, a * al, scale=sc, ox=0, oy=num.shape[0] / 2)
        lab = 'if this batch is destroyed' if p < 0.5 else 'recovered from the same batch'
        blit(f, TX(lab, 'g', 22, 520, (190, 208, 198)), self.x + 4, self.y + num.shape[0] + 4, a * clamp((u - self.u0 - 0.2) / 0.3))
        if p >= 1:
            sw = TX('+₹22,194 better than the bin', 'g', 24, 680, G)
            blit(f, sw, self.x + num.shape[1] + 24, self.y + num.shape[0] / 2 - 4, a * clamp((u - self.ur - 0.7) / 0.2))


BRANDS = [   # the brands the film shows as clients, each in its own workspace (all fictional; the console's clients)
    ('n1-factory-line', 'Snacks & Drinks Co.', 'snacks', 'snacks and drinks', (52, 160, 110)),
    ('b2-factory-tea', 'Tea Co.', 'tea', 'tea', (34, 150, 140)),
    ('b3-factory-biscuits', 'Biscuits Co.', 'biscuits', 'biscuits', (96, 110, 224)),
]


@lru_cache(maxsize=None)
def workspace_card(name, slug, what, tile, w=600):
    """a brand's workspace, as a small browser window: its own address, its mark, and its own people, rules and agents"""
    S = 2; h = 250
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=18 * S, fill=(246, 249, 247, 252))
    d.rounded_rectangle([0, 0, w * S - 1, 46 * S], radius=18 * S, fill=(22, 34, 28, 255))
    d.rectangle([0, 28 * S, w * S - 1, 46 * S], fill=(22, 34, 28, 255))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse([(18 + i * 18) * S, 17 * S, (29 + i * 18) * S, 28 * S], fill=c + (255,))
    url = f'{slug}-smartclearance.web.app'
    uw = text_w(url, 'g', 17, 560) + 46
    ux = (w - uw) / 2
    d.rounded_rectangle([ux * S, 9 * S, (ux + uw) * S, 37 * S], radius=14 * S, fill=(44, 58, 51, 255))
    draw_text(d, ((ux + 30) * S, 13 * S), url, 'g', 17 * S, (232, 242, 236, 255), 560)
    d.rounded_rectangle([(ux + 11) * S, 18 * S, (ux + 21) * S, 28 * S], radius=2 * S, fill=(140, 200, 170, 255))
    if tile != 'munchly':
        d.rounded_rectangle([28 * S, 70 * S, 104 * S, 146 * S], radius=20 * S, fill=tuple(tile) + (255,))
        lw = text_w(name[0], 'b', 46, 800)
        draw_text(d, ((66 - lw / 2) * S, 78 * S), name[0], 'b', 46 * S, (255, 255, 255, 255), 800)
    draw_text(d, (124 * S, 70 * S), name, 'b', 38 * S, (16, 32, 24, 255), 780)
    draw_text(d, (126 * S, 118 * S), f'its {what} · its own workspace', 'g', 19 * S, (90, 110, 100, 255), 500)
    x = 28
    for label in ('its people', 'its rules', 'its agents'):
        tw = text_w(label, 'g', 18, 640) + 34
        d.rounded_rectangle([x * S, 176 * S, (x + tw) * S, 212 * S], radius=18 * S, fill=(226, 242, 233, 255), outline=(63, 176, 123, 255), width=int(1.4 * S))
        d.ellipse([(x + 12) * S, 190 * S, (x + 20) * S, 198 * S], fill=(52, 180, 110, 255))
        draw_text(d, ((x + 26) * S, 183 * S), label, 'g', 18 * S, (22, 70, 48, 255), 640)
        x += tw + 12
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    if tile == 'munchly':
        b = munchly_badge(76)
        spr[70:146, 28:104] = spr[70:146, 28:104] * (1 - b[..., 3:4]) + b
    return spr


class ExitFlow:
    """the best exit for every pack: the batch's packs at risk on the left; the ten agents at its centre, turning; five
    exits on the right, the packs streaming to the three the plan uses, each counting up to its share (the Mango Drink's
    plan: 1,372 to the kiranas, 150 to the staff sale, 58 to the food bank; ExpireSoon not this time, needing 30 days, and
    destruction not needed, the last resort)"""
    EXITS = [('store', 'Kiranas', 'a scheme in their language', 1372), ('users', 'Staff sale', "at the distributor's godown", 150),
             ('heart-handshake', 'Food bank', 'donated, with a receipt', 58),
             ('shopping-bag', 'ExpireSoon', 'not this time: needs 30+ days', 0), ('trash-2', 'Destroyed', 'the last resort', 0)]
    AGENTS = ['database', 'radar', 'scan-line', 'scale', 'split', 'hand', 'send', 'shopping-bag', 'messages-square', 'file-check', 'leaf']
    def __init__(self, u0):
        self.u0 = u0
        self.src = (300, 560); self.hub = (840, 560)
        self.ex = [(1250, 250 + i * 150) for i in range(5)]
        self.pack = pack_sprite('mango', 170)
        self.paths = [fx.bezier(self.hub, (self.hub[0] + 220, self.hub[1]), (ex[0] - 260, ex[1]), (ex[0] - 40, ex[1]), 120) for ex in self.ex]
        self.in_path = fx.bezier((self.src[0] + 110, self.src[1]), (560, 560), (700, 560), (self.hub[0] - 110, self.hub[1]), 80)
        self.head = words_sprite(kicker='AI AGENTS · ONE PLAN A BATCH', head='The best exit for every pack.', width=1100, hsize=54)
        rng = np.random.default_rng(2091)
        self.jit = rng.uniform(0, 1, 400)
    def draw(self, f, u, L=None):
        u = u - self.u0
        if u < 0: return
        a = clamp(u / 0.35)
        blit(f, self.head, 96, 70, a)
        # the source: the batch's packs at risk
        sp = fm_spring(u, 300, 22)
        blit(f, self.pack, self.src[0], self.src[1], a, scale=0.6 + 0.4 * sp, ox=85, oy=85)
        blit(f, TX('1,580 packs at risk', 'b', 34, 780, INK), self.src[0] - 150, self.src[1] + 110, a)
        blit(f, TX('Mango drink · 22 days left', 'g', 19, 500, MUTED), self.src[0] - 150, self.src[1] + 156, a)
        # the stream into the agents
        fa = clamp((u - 0.4) / 0.3)
        _glow_line(f, np.float32(self.in_path), G2, 0.35 * fa, width=2.0, glow=6)
        for k in range(14):
            ph = ((u - 0.4) * 0.9 + k / 14) % 1.0
            if u < 0.4 + k * 0.04: continue
            p = self.in_path[int(ph * (len(self.in_path) - 1))]
            _dot(f, p, 3.6, AMBER, 0.85 * fa, glow=5)
        # the agents, turning round their plan
        ha = clamp((u - 0.3) / 0.35)
        if ha > 0:
            _dot(f, self.hub, 46, G2, 0.45 * ha, glow=26, core=(16, 40, 28))
            blit(f, TX('10 AGENTS', 'g', 15, 700, G, 0.14), self.hub[0] - 46, self.hub[1] - 10, ha)
            for i, ic in enumerate(self.AGENTS):
                ang = (u * 0.55) + i * 2 * math.pi / len(self.AGENTS)
                px, py = self.hub[0] + 118 * math.cos(ang), self.hub[1] + 118 * math.sin(ang) * 0.92
                _dot(f, (px, py), 19, (20, 60, 40), 0.9 * ha, glow=8, core=(18, 44, 31))
                s_ = ICON(ic, 22, (200, 240, 220))
                blit(f, s_, px - 11, py - 11, ha)
        # the exits, and the packs streaming to the plan's three
        for i, (ic, name, sub, units) in enumerate(self.EXITS):
            ta = 0.55 + 0.12 * i
            ea = clamp((u - ta) / 0.3)
            if ea <= 0: continue
            on = units > 0
            ex, ey = self.ex[i]
            pa = np.float32(self.paths[i])
            if on:
                _glow_line(f, pa, G2, 0.35 * ea, width=2.0, glow=6)
            else:
                for m in range(0, len(pa) - 1, 6):
                    _glow_line(f, pa[m:m + 3], (110, 120, 116), 0.35 * ea, width=1.4, glow=2)
            rgb = G if on else (130, 140, 136)
            _dot(f, (ex, ey), 30, rgb, (0.6 if on else 0.3) * ea, glow=12, core=(14, 30, 22))
            blit(f, ICON(ic, 30, INK if on else (150, 160, 156)), ex - 15, ey - 15, ea)
            blit(f, TX(name, 'b', 30, 760, INK if on else (150, 160, 156)), ex + 50, ey - 34, ea)
            blit(f, TX(sub, 'g', 18, 500, MUTED if on else (130, 140, 136)), ex + 52, ey + 4, ea)
            if on:
                # its packs: dots flowing at a rate with its share, the count rolling up
                share = units / 1580
                nd = max(3, int(round(24 * share ** 0.5)))
                for k in range(nd):
                    ph = ((u - 1.0) * 0.8 + k / nd + self.jit[k + 20 * i] * 0.05) % 1.0
                    if u < 1.0 + k * 0.05: continue
                    p = pa[int(ph * (len(pa) - 1))]
                    _dot(f, p, 3.4, G, 0.9 * ea * clamp(min(ph, 1 - ph) * 10), glow=5)
                c = units * ease_out(clamp((u - 1.1) / 1.6))   # cut 7b: landed sooner, so it holds before the cut
                blit(f, TX(f'{n0(c)} packs', 'b', 30, 780, G), ex + 330, ey - 34, ea * clamp((u - 1.1) / 0.3))


class BrandScene7:
    """cut 6's brand scene up to the line, then: three brands' factories, each with its own workspace sliding in (the
    cards stacking as the next arrives), and the best exit for every pack, flowing. The opening's write-off rolls into
    what the plan recovered under the line."""
    def __init__(self, base, t_fly, t_where, L, morph):
        self.base, self.t_fly, self.t_where, self.L, self.morph = base, t_fly, t_where, L, morph
        n = len(BRANDS)
        self.cut = [t_fly + (t_where - t_fly) * i / n for i in range(n)] + [t_where]
        # cut 7b: a slow, gentle push on each (less depth, less travel), each held 1.75 s
        self.stills = [Still25D(k, z=(1.0, 1.06), pan=((0, 0), (-14 + 14 * i, -4)), dur=(t_where - t_fly) / n + 0.8, focus=(0.5, 0.55), depth_k=0.45) for i, (k, *_r) in enumerate(BRANDS)]
        self.cards = [workspace_card(name, slug, what, tile) for _, name, slug, what, tile in BRANDS]
        self.flow = ExitFlow(t_where + 0.4)   # cut 7b: after the cross-fade from the last factory, never over it
        self.studio = studio()
        self.kick = kicker_sprite('SOFTWARE AS A SERVICE · EVERY BRAND, ITS OWN WORKSPACE', (232, 242, 236), 17)
        self.top = (0.42 + 0.58 * np.linspace(0, 1, 190, dtype=np.float32) ** 1.4)[:, None, None]
        self.frozen = None
    def stage(self, i, f, u):
        s = self.stills[i]
        s.draw(f, u - self.cut[i])
        f *= 0.86
        f[:190] *= self.top   # a shade at the top, so the kicker reads over a bright factory
    def draw(self, f, u, L=None):
        if u < self.t_fly:
            self.base.draw(f, u, L)
            self.morph.draw(f, u, L)
            return
        # the scenes after the line, each cross-faded in (cut 7b; cut 7 whipped)
        i = min(len(BRANDS), int(sum(1 for c in self.cut[1:] if u >= c)))
        if i < len(BRANDS):
            self.stage(i, f, u)
        else:
            f[:] = self.studio
        t_in = self.cut[i] if i < len(self.cut) else self.t_where
        XD = 0.6 if i == 0 else 0.5   # cut 7b: a soft cross-fade from one to the next, where cut 7 whipped
        if u - t_in < XD:
            prev = np.empty_like(f)
            if i == 0:
                self.base.draw(prev, u, L); self.morph.draw(prev, u, L)
            else:
                self.stage(i - 1, prev, u)
            e = ease_in_out(clamp((u - t_in) / XD))
            f[:] = prev * (1 - e) + f * e
        # the workspace cards: the brand's own sliding in; the earlier ones stacked to the left, smaller
        if i < len(BRANDS) or u < self.t_where + 0.3:
            out = 1 - clamp((u - self.t_where) / 0.3)
            ka = clamp((u - self.t_fly - 0.2) / 0.3) * out
            kh, kw = self.kick.shape[:2]
            panel(f, 80, 58, 112 + kw, 82 + kh, ka, r=14, alpha=0.82, shade=0.3)
            blit(f, self.kick, 96, 70, ka)
            for j in range(min(i, len(BRANDS) - 1) + 1):
                c = self.cards[j]
                tj = self.cut[j] + 0.35
                if u < tj: continue
                sp = fm_spring(u - tj, 150, 22)   # cut 7b: a gentler slide
                if j < i:   # stacked
                    k = i - j
                    x, y, sc = 96 + 40 * (k - 1), 860 - 40 * (k - 1), 0.5
                    blit(f, c, x, y, out * 0.85, scale=sc)
                else:
                    x = 1220 + 160 * (1 - sp)
                    blit(f, c, x, 640, out * clamp((u - tj) / 0.35), scale=0.95 + 0.05 * sp)
        if u >= self.t_where + 0.05:
            self.flow.draw(f, u)


# ---------------------------------------------------------------- the kirana clusters as maps

KIRANAS = json.loads((HERE / 'kiranas.json').read_text())
# the production run of 13 Oct (SC-201) placed two of the Mango's orders in the offer screen's twelves: Saraswathi
# Kirana and Bilal Stores ordered 16 each (28 and 4 in the story), the total unchanged
for k_ in KIRANAS['hyderabad']:
    if k_['name'] in ('Saraswathi Kirana', 'Bilal Stores'): k_['orders'] = 16


class KiranaMap:
    """a distributor's kiranas as a map: its godown at the centre, its areas round it (design3's own areas), each shop a
    dot in its area. states: {shop id: (state, u)} where state is 'ordered' (green, '+N' rising), 'declined' (a red
    cross), 'silent' (grey); every shop is offered first, a ring travelling out from the godown (u_offer). counters:
    [(callable(u) -> text, rgb)] under the map"""
    def __init__(self, x, y, w, h, cluster, title, hub, u0, u1, u_offer, states, counters=(), seed=7, scale=1.0):
        self.x, self.y, self.w, self.h, self.u0, self.u1, self.u_offer = x, y, w, h, u0, u1, u_offer
        self.shops = KIRANAS[cluster]
        self.states, self.counters = states, counters
        self.kick = kicker_sprite(title, (232, 242, 236), 15)
        self.hub_lab = TX(hub, 'g', 15, 600, MUTED)
        areas = []
        for k_ in self.shops:
            if k_['area'] not in areas: areas.append(k_['area'])
        cx, cy = x + w / 2, y + 40 + (h - 40) / 2
        rx, ry = w * 0.36, (h - 40) * 0.34
        rng = np.random.default_rng(seed)
        self.hub = (cx, cy)
        self.area_xy = {}
        for i, ar in enumerate(areas):
            ang = -math.pi / 2 + i * 2 * math.pi / len(areas) + rng.uniform(-0.12, 0.12)
            self.area_xy[ar] = (cx + rx * math.cos(ang), cy + ry * math.sin(ang))
        self.pos = {}
        for ar in areas:
            ks = [k_ for k_ in self.shops if k_['area'] == ar]
            ax, ay = self.area_xy[ar]
            for j, k_ in enumerate(ks):
                a2 = j * 2.39996
                r2 = 9 * scale * math.sqrt(j + 0.6)
                self.pos[k_['id']] = (ax + r2 * math.cos(a2), ay + r2 * math.sin(a2))
        self.area_lab = {ar: TX(ar, 'g', 13, 600, (150, 175, 162)) for ar in areas}
        self.dist = {k_['id']: math.hypot(self.pos[k_['id']][0] - cx, self.pos[k_['id']][1] - cy) for k_ in self.shops}
        self.maxd = max(self.dist.values())
        self.scale = scale
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        x, y, w, h = self.x, self.y, self.w, self.h
        nh = 46 * len(self.counters)
        panel(f, x, y, x + w, y + h + nh + 10, a, alpha=0.84)
        blit(f, self.kick, x + 22, y + 18, a)
        cx, cy = self.hub
        # the routes out to the areas
        for ar, (ax, ay) in self.area_xy.items():
            line(f, (cx, cy), (ax, ay), (60, 90, 75), alpha=0.5 * a, width=1.2, dot=False)
            lab = self.area_lab[ar]
            lx = ax - lab.shape[1] / 2
            ly = ay + (22 if ay >= cy else -38) * self.scale
            blit(f, lab, lx, ly, a * 0.9)
        # the godown
        _dot(f, (cx, cy), 15, AMBER, 0.75 * a, glow=10, core=(40, 30, 10))
        blit(f, ICON('warehouse', 18, (255, 230, 170)), cx - 9, cy - 9, a)
        blit(f, self.hub_lab, cx - self.hub_lab.shape[1] / 2, cy + 18, a)
        # the offer going out: a ring from the godown, each shop lit amber as it reaches it
        if self.u_offer is not None and u >= self.u_offer:
            rr = (u - self.u_offer) / 0.9 * self.maxd
            if rr < self.maxd * 1.15:
                ring(f, cx - rr, cy - rr * 0.92, cx + rr, cy + rr * 0.92, rr * 0.92, 1.0, a * 0.6 * (1 - clamp(rr / (self.maxd * 1.15))), color=AMBER, width=2.0, glow=True)
        for k_ in self.shops:
            px, py = self.pos[k_['id']]
            t_reach = None if self.u_offer is None else self.u_offer + 0.9 * self.dist[k_['id']] / self.maxd
            st, ts = self.states.get(k_['id'], (None, None))
            r = 4.6 * self.scale
            if st is not None and u >= ts:
                e = clamp((u - ts) / 0.2)
                if st == 'ordered':
                    _dot(f, (px, py), r + 0.8, G, a * (0.6 + 0.4 * e), glow=6 + 6 * (1 - e))
                    if u - ts < 0.9:
                        q = (u - ts) / 0.9
                        blit(f, TX(f'+{k_["orders"]}', 'g', 15, 700, G), px + 6, py - 14 - 22 * q, a * math.sin(math.pi * min(1.0, q * 1.2)))
                elif st == 'declined':
                    _dot(f, (px, py), r, (90, 40, 34), a * 0.9, glow=2, core=(120, 50, 44))
                    k2 = 3.2 * self.scale
                    line(f, (px - k2, py - k2), (px + k2, py + k2), RED, alpha=a * e, width=1.8, dot=False)
                    line(f, (px - k2, py + k2), (px + k2, py - k2), RED, alpha=a * e, width=1.8, dot=False)
                else:
                    _dot(f, (px, py), r, (110, 120, 116), a * 0.8, glow=2, core=(120, 128, 124))
            elif t_reach is not None and u >= t_reach:
                e = clamp((u - t_reach) / 0.25)
                _dot(f, (px, py), r, AMBER, a * (0.45 + 0.4 * (1 - e)), glow=3 + 6 * (1 - e), core=(60, 48, 20))
            else:
                _dot(f, (px, py), r * 0.8, (90, 105, 98), a * 0.55, glow=1.5, core=(70, 84, 78))
        for i, (fn, rgb) in enumerate(self.counters):
            blit(f, TX(fn(u), 'b', 26, 760, rgb), x + 22, y + h + 6 + i * 46, a)


def order_times(cluster, t0, t1, seed=11, only=None):
    """each ordering shop's moment, spread over [t0, t1] (more early than late, as the scheme filled), in a seeded order"""
    shops = [k_ for k_ in KIRANAS[cluster] if k_['orders'] > 0 and (only is None or k_['id'] in only)]
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(shops))
    out = {}
    for rank, i in enumerate(order):
        p = (rank + rng.uniform(0, 0.6)) / len(shops)
        out[shops[i]['id']] = ('ordered', t0 + (t1 - t0) * (1 - (1 - p) ** 1.6))
    return out


def curve_states(cluster, pts, seed=11, first=None):
    """each ordering shop's moment, following the live app's own counter beside the map (read off the recording):
    pts [(u, shops ordered by u)], rising; the shops counted at the first point had ordered already. first: the shop that
    ordered first (the one the film watched order)"""
    shops = [k_ for k_ in KIRANAS[cluster] if k_['orders'] > 0]
    rng = np.random.default_rng(seed)
    order = [int(i) for i in rng.permutation(len(shops))]
    if first is not None:
        j = next(i for i, k_ in enumerate(shops) if k_['id'] == first)
        order.remove(j); order.insert(0, j)
    us = np.float32([p[0] for p in pts]); ns = np.float32([p[1] for p in pts])
    return {shops[i]['id']: ('ordered', -1.0 if rank + 1 <= ns[0] else float(np.interp(rank + 1, ns, us))) for rank, i in enumerate(order)}


def packets_by(states, cluster, u):
    """the packets ordered by u"""
    by = {k_['id']: k_['orders'] for k_ in KIRANAS[cluster]}
    return sum(by[i] for i, (st, t) in states.items() if st == 'ordered' and u >= t)


@lru_cache(maxsize=None)
def mini_invoice(no, total, w=170):
    """a kirana's tax invoice in miniature: the distributor's series number and the total"""
    S = 2; h = 108
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=8 * S, fill=(250, 250, 247, 252), outline=(200, 205, 200, 255), width=int(1 * S))
    draw_text(d, (10 * S, 8 * S), 'TAX INVOICE', 'g', 11 * S, (40, 60, 50, 255), 760, 0.1)
    draw_text(d, (10 * S, 24 * S), no, 'g', 13 * S, (20, 30, 25, 255), 640)
    for k in range(3):
        d.rectangle([10 * S, (48 + k * 10) * S, (10 + 110 - k * 26) * S, (52 + k * 10) * S], fill=(205, 212, 208, 255))
    draw_text(d, (10 * S, 80 * S), 'CGST + SGST 2.5%', 'g', 10 * S, (90, 100, 95, 255), 560)
    tw = text_w(total, 'g', 13, 700)
    draw_text(d, ((w - 10 - tw) * S, 78 * S), total, 'g', 13 * S, (20, 120, 70, 255), 700)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class InvoiceStack:
    """one tax invoice for every kirana order: invoices dealt onto a stack as the orders land, the count with them
    (Lakshmi Agencies' series from LA/26-27/0972, as the production run issued them)"""
    def __init__(self, x, y, u0, u1, n=52, first=972, series='LA/26-27/'):
        self.x, self.y, self.u0, self.u1, self.n, self.first, self.series = x, y, u0, u1, n, first, series
        self.kick = kicker_sprite('ONE GST INVOICE PER ORDER', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.35)
        if a <= 0: return
        k = int(clamp((u - self.u0) / 1.4) * self.n)
        panel(f, self.x, self.y, self.x + 600, self.y + 190, a, alpha=0.84)
        blit(f, self.kick, self.x + 22, self.y + 16, a)
        shown = min(k, 6)
        for j in range(shown):
            no = f'{self.series}{self.first + max(0, k - shown) + j:04d}'
            spr = mini_invoice(no, '')
            blit(f, spr, self.x + 22 + j * 26, self.y + 50 + (shown - j) * 2, a * 0.95)
        blit(f, TX(f'{k} of {self.n}', 'b', 44, 800, G), self.x + 22 + shown * 26 + 190, self.y + 56, a)
        blit(f, TX('kirana orders, each with its own invoice', 'g', 18, 500, MUTED), self.x + 22 + shown * 26 + 192, self.y + 112, a)
        blit(f, TX(f'{self.series}{self.first:04d} on', 'g', 16, 600, (190, 208, 198)), self.x + 22 + shown * 26 + 192, self.y + 140, a)


# ---------------------------------------------------------------- ExpireSoon, explained, and the Negotiator's ladder

class ExpireSoonCard:
    """what ExpireSoon is: an imaginary marketplace, made up for this demo, where brands list near-expiry food and bulk
    buyers bid; and the lot listed on it"""
    def __init__(self, x, y, u0, u1, w=640):
        self.x, self.y, self.u0, self.u1, self.w = x, y, u0, u1, w
        S = 2; h = 176
        im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=18 * S, fill=(24, 14, 46, 238), outline=(150, 120, 240, 200), width=int(1.4 * S))
        d.ellipse([20 * S, 20 * S, 72 * S, 72 * S], fill=(110, 80, 220, 255))
        draw_text(d, (88 * S, 18 * S), 'ExpireSoon', 'b', 36 * S, (244, 240, 255, 255), 800)
        bx = 88 + text_w('ExpireSoon', 'b', 36, 800) + 16
        bt = 'AN IMAGINARY MARKETPLACE'
        bw = text_w(bt, 'g', 13, 760, 0.12) + 22
        d.rounded_rectangle([bx * S, 28 * S, (bx + bw) * S, 52 * S], radius=12 * S, fill=(247, 192, 74, 255))
        draw_text(d, ((bx + 11) * S, 32 * S), bt, 'g', 13 * S, (40, 26, 6, 255), 760, 0.12)
        draw_text(d, (90 * S, 64 * S), 'Made up for this demo: brands list near-expiry food,', 'g', 19 * S, (214, 206, 240, 255), 480)
        draw_text(d, (90 * S, 90 * S), 'and bulk buyers bid on the lots.', 'g', 19 * S, (214, 206, 240, 255), 480)
        lt = 'Lot ES-24117 · 772 packs of Masala Chips · listed at ₹15.00'
        lw = text_w(lt, 'g', 17, 640) + 28
        d.rounded_rectangle([20 * S, 128 * S, (20 + lw) * S, 160 * S], radius=16 * S, fill=(52, 36, 96, 255))
        draw_text(d, (34 * S, 134 * S), lt, 'g', 17 * S, (236, 230, 255, 255), 640)
        self.spr = to_sprite(im.resize((w, h), Image.LANCZOS))
        ic = ICON('shopping-bag', 28, (255, 255, 255))
        a_ = ic[..., 3:4]; self.spr[32:60, 32:60] = self.spr[32:60, 32:60] * (1 - a_) + ic
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        e = ease_out(clamp((u - self.u0) / 0.45))
        shadow(f, self.x, self.y, self.x + self.w, self.y + 176, 18, alpha=0.4 * a)
        blit(f, self.spr, self.x - 30 * (1 - e), self.y, a)


class PriceLadder:
    """the negotiation on one price line, ₹12 to ₹16 a pack: the listed price, the bid under Munchly's reserve (which no
    buyer and no model sees), the Negotiator's counter, and the deal (772 at ₹14.20, ₹10,962.40, a ₹1,644 token)"""
    LO, HI = 12.0, 16.0
    def __init__(self, x, y, u_list, u_bid, u_counter, u_deal, u1, w=640):
        self.x, self.y, self.ul, self.ub, self.uc, self.ud, self.u1, self.w = x, y, u_list, u_bid, u_counter, u_deal, u1, w
        self.kick = kicker_sprite('THE NEGOTIATION · ₹ A PACK', (232, 242, 236), 15)
    def px(self, v): return self.x + 40 + (self.w - 80) * (v - self.LO) / (self.HI - self.LO)
    def pin(self, f, v, label, sub, rgb, t, a, above=True, dashed=False, icon=None, align='c'):
        if t is None or (isinstance(t, (int, float)) and False): return
        e = ease_out(clamp((t) / 0.35))
        if e <= 0: return
        x = self.px(v); y0 = self.y + 130
        if dashed:
            for k in range(6):
                line(f, (x, y0 - 40 + k * 14), (x, y0 - 34 + k * 14), rgb, alpha=a * e, width=2.0, dot=False)
        else:
            line(f, (x, y0 - 40), (x, y0 + 36), rgb, alpha=a * e, width=2.6, dot=False)
        _dot(f, (x, y0), 7, rgb, a * e, glow=8)
        lab = TX(label, 'b', 22, 760, rgb)
        sb = TX(sub, 'g', 14, 520, MUTED)
        ly = y0 - 92 if above else y0 + 44
        # under the line the reserve and the counter sit close: the reserve's words end at its pin, the counter's begin
        # at its pin, so the two never meet
        def at_(spr): return {'c': x - spr.shape[1] / 2, 'r': x + 12 - spr.shape[1], 'l': x - 12}[align]
        lx = clamp(at_(lab), self.x + 10, self.x + self.w - lab.shape[1] - 10)
        sx = clamp(at_(sb), self.x + 10, self.x + self.w - sb.shape[1] - 10)
        blit(f, lab, lx, ly + 8 * (1 - e), a * e)
        blit(f, sb, sx, ly + 30 + 8 * (1 - e), a * e)
        if icon:
            blit(f, ICON(icon, 16, rgb), x - 8, y0 - 8 - 22, a * e)
    def draw(self, f, u, L=None):
        a = fade(u, self.ul - 0.2, self.u1, 0.3, 0.3)
        if a <= 0: return
        panel(f, self.x, self.y, self.x + self.w, self.y + 290, a, alpha=0.86)
        blit(f, self.kick, self.x + 22, self.y + 16, a)
        y0 = self.y + 130
        _glow_line(f, np.float32([[self.px(self.LO), y0], [self.px(self.HI), y0]]), (90, 110, 100), 0.8 * a, width=2.0, glow=2)
        for v in ((12, 14, 16) if u < self.ud else (12, 16)):   # the scale just under the line, clear of the pins (₹13 and ₹15 are the bid and the ask; the deal's ring takes ₹14's place)
            tk = TX(f'₹{v}', 'g', 13, 600, (120, 140, 130))
            blit(f, tk, self.px(v) - tk.shape[1] / 2, y0 + 10, a)
        self.pin(f, 15.0, 'Listed ₹15.00', 'the ask', INK, u - self.ul, a, above=True)
        if u >= self.ub:
            self.pin(f, 13.0, 'Bid ₹13.00', 'a wholesale buyer', RED, u - self.ub, a, above=True)
            self.pin(f, 13.5, 'Reserve ₹13.50', "the brand's, never shown", AMBER, u - self.ub - 0.35, a, above=False, dashed=True, align='r')
        if u >= self.uc:
            # the counter slides down from the ask
            p = ease_out(clamp((u - self.uc) / 0.6))
            v = 15.0 + (14.2 - 15.0) * p
            if u < self.ud:
                self.pin(f, v, f'Counter ₹{v:.2f}', 'the Negotiator', G, u - self.uc, a, above=False, align='l')
        if u >= self.ud:
            e = ease_out(clamp((u - self.ud) / 0.4))
            x = self.px(14.2)
            ring(f, x - 28, y0 - 28, x + 28, y0 + 28, 28, 1.0, a * e, color=G, width=2.6, glow=True)
            self.pin(f, 14.2, 'Deal ₹14.20', '772 packs · ₹10,962.40', G, u - self.ud, a, above=False, icon='handshake', align='l')
            blit(f, TX('a ₹1,644 token, the rest on dispatch', 'g', 17, 560, G), self.x + 22, self.y + 250, a * e)


# ---------------------------------------------------------------- the offer window, closed on its packets

class WindowFunnel:
    """the offer window closing on the chips' scheme: what was offered, what the shops ordered, what is left at the
    godown (588 to 38 kiranas, 48 by 2 of them, 540 left), each bar growing with its count"""
    ROWS = [('588 packets offered', 'to 38 kiranas', 588, AMBER), ('48 ordered', 'two kiranas, 24 each', 48, G),
            ('540 left', "at the distributor's godown", 540, RED)]
    def __init__(self, x, y, u0, u1, w=620):
        self.x, self.y, self.u0, self.u1, self.w = x, y, u0, u1, w
        self.kick = kicker_sprite('THE OFFER WINDOW · CLOSED', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 440, a, alpha=0.86)
        blit(f, self.kick, x + 74, y + 26, a)
        # the window's clock running out, then locked
        cx, cy, r = x + 40, y + 34, 18
        p = clamp((u - self.u0) / 1.0)
        m = np.zeros((2 * r + 8, 2 * r + 8), np.float32)
        cv2.ellipse(m, (r + 4, r + 4), (r, r), -90, 0, 360 * (1 - p), 1.0, 3, cv2.LINE_AA)
        over(f, int(cx - r - 4), int(cy - r - 4), col(AMBER if p < 1 else RED), m * a)
        if p >= 1: blit(f, ICON('lock', 18, RED), cx - 9, cy - 9, a)
        for i, (big, sub, v, rgb) in enumerate(self.ROWS):
            t = self.u0 + 0.3 + i * 0.5
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.6))
            yy = y + 84 + i * 118
            blit(f, TX(big, 'b', 34, 780, rgb), x + 26, yy, a * clamp((u - t) / 0.2))
            blit(f, TX(sub, 'g', 17, 500, MUTED), x + 28, yy + 44, a * clamp((u - t) / 0.2))
            bw = (w - 52) * v / 588 * e
            ix, iy, al = rrect_alpha(x + 26, yy + 74, x + 26 + max(6, bw), yy + 90, 8)
            over(f, ix, iy, col(rgb), al * a * 0.9)
            ix, iy, al = rrect_alpha(x + 26, yy + 74, x + w - 26, yy + 90, 8)
            over(f, ix, iy, col((60, 80, 70)), al * a * 0.35)


# ---------------------------------------------------------------- expiry day: what the destruction must prove

class ProofPlan:
    """expiry day for the chips' packets left: the route from the godown to the authorised landfill, and the proof
    Munchly asks for before it credits anything (two photos, the agency's certificate signed in place, Vision's checks and
    Priya's second yes)"""
    STEPS = [('camera', 'Before: the packs at the godown,', 'the batch label in view'),
             ('camera', 'After: at the landfill,', 'the slate in view'),
             ('signature', "The agency's certificate, signed", 'by its officer, two witnesses and the distributor'),
             ('shield-check', 'Vision checks it all;', 'the brand gives a second yes')]
    def __init__(self, x, y, u0, u1, w=640):
        self.x, self.y, self.u0, self.u1, self.w = x, y, u0, u1, w
        self.kick = kicker_sprite('540 PACKETS · THE PROOF THE BRAND NEEDS', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 640, a, alpha=0.86)
        blit(f, self.kick, x + 24, y + 22, a)
        # the route: the godown to the authorised landfill, the agency's truck on its way
        ra = clamp((u - self.u0 - 0.2) / 0.3)
        g0, g1 = (x + 60, y + 104), (x + w - 70, y + 104)
        for k in range(0, 40, 2):
            p0 = g0[0] + (g1[0] - g0[0]) * k / 40; p1 = g0[0] + (g1[0] - g0[0]) * (k + 1) / 40
            line(f, (p0, g0[1]), (p1, g0[1]), (120, 140, 130), alpha=0.8 * a * ra, width=2.0, dot=False)
        _dot(f, g0, 16, AMBER, 0.7 * a * ra, glow=8, core=(40, 30, 10)); blit(f, ICON('warehouse', 18, (255, 230, 170)), g0[0] - 9, g0[1] - 9, a * ra)
        _dot(f, g1, 16, RED, 0.7 * a * ra, glow=8, core=(50, 18, 14)); blit(f, ICON('map-pin', 18, (255, 200, 190)), g1[0] - 9, g1[1] - 9, a * ra)
        blit(f, TX('The godown', 'g', 15, 600, MUTED), g0[0] - 40, g0[1] + 24, a * ra)
        lab = TX('A sanitary landfill', 'g', 15, 600, MUTED)
        blit(f, lab, g1[0] + 30 - lab.shape[1], g1[1] + 24, a * ra)
        tp = ease_in_out(clamp((u - self.u0 - 0.5) / 2.2))
        tx = g0[0] + 30 + (g1[0] - g0[0] - 60) * tp
        blit(f, ICON('truck', 30, INK), tx - 15, g0[1] - 34, a * ra)
        blit(f, TX('An authorised waste agency', 'g', 15, 600, (190, 208, 198)), x + 24, y + 160, a * ra)
        # the proof, step by step
        for i, (ic, l1, l2) in enumerate(self.STEPS):
            t = self.u0 + 0.9 + i * 0.55
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.35))
            yy = y + 210 + i * 104
            _dot(f, (x + 52, yy + 30), 24, (20, 60, 40), a * e, glow=6, core=(16, 44, 30))
            blit(f, ICON(ic, 24, G), x + 40, yy + 18, a * e)
            blit(f, TX(l1, 'g', 21, 640, INK), x + 92 + 16 * (1 - e), yy + 4, a * e)
            blit(f, TX(l2, 'g', 18, 480, MUTED), x + 92 + 16 * (1 - e), yy + 34, a * e)
            if u - t > 0.4:
                blit(f, ICON('circle-check', 22, G), x + w - 52, yy + 18, a * clamp((u - t - 0.4) / 0.2))


# ---------------------------------------------------------------- the certificate, signed in place

STROKES = None


def _strokes():
    global STROKES
    if STROKES is None:
        import subprocess as _sp
        js = (HERE.parent.parent.parent / 'core' / 'data.js').read_text()
        i = js.index('const STROKES = ') + len('const STROKES = ')
        j = js.index(';\n', i)
        STROKES = json.loads(js[i:j])
    return STROKES


class SignSlots:
    """the certificate of destruction's four signatures, drawn in place as they were signed on Rakesh's tablet (the
    pen strokes design3 keeps for each signer): the agency's officer, the two witnesses, Rakesh"""
    SIGNERS = [('oce', 'Supervising officer', 'the authorised agency'), ('oce-w1', 'Witness one', 'independent'),
               ('oce-w2', 'Witness two', 'independent'), ('rakesh', 'The distributor', 'hands the packs over')]
    def __init__(self, x, y, u0, u1, w=640, each=0.62):
        self.x, self.y, self.u0, self.u1, self.w, self.each = x, y, u0, u1, w, each
        self.st = _strokes()
        self.kick = TX('CERTIFICATE OF DESTRUCTION · OCE/DC/26-27/0219', 'g', 14, 760, (60, 70, 66), 0.1)
    def ink(self, key, p, bw, bh):
        """the signature's strokes drawn to p (0..1 of their length), dark blue ink on a transparent sprite"""
        s = self.st[key]
        bx, by = s['box']
        strokes = s['strokes']
        lens = [sum(math.hypot(b[0] - a_[0], b[1] - a_[1]) for a_, b in zip(st, st[1:])) for st in strokes]
        tot = sum(lens) * p
        S = 3
        m = np.zeros((bh * S, bw * S), np.float32)
        kx, ky = bw * S / bx, bh * S / by
        for st, ln in zip(strokes, lens):
            if tot <= 0: break
            pts = []
            acc = 0.0
            for a_, b in zip(st, st[1:]):
                seg = math.hypot(b[0] - a_[0], b[1] - a_[1])
                if acc + seg <= tot:
                    pts += [a_, b]; acc += seg
                else:
                    t = (tot - acc) / max(1e-6, seg)
                    pts += [a_, (a_[0] + (b[0] - a_[0]) * t, a_[1] + (b[1] - a_[1]) * t)]; acc = tot; break
            tot -= ln
            if len(pts) >= 2:
                arr = np.int32(np.round(np.float32(pts) * [kx, ky] * 16))
                cv2.polylines(m, [arr], False, 1.0, max(1, int(2.2 * S)), cv2.LINE_AA, shift=4)
        m = cv2.resize(m, (bw, bh), interpolation=cv2.INTER_AREA)
        spr = np.zeros((bh, bw, 4), np.float32)
        c = col((28, 44, 120))
        spr[..., :3] = c * m[..., None]; spr[..., 3] = m
        return spr
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        hgt = 330
        shadow(f, x, y, x + w, y + hgt, 10, alpha=0.5 * a)
        ix, iy, al = rrect_alpha(x, y, x + w, y + hgt, 10)
        over(f, ix, iy, col((246, 243, 236)), al * a)
        blit(f, self.kick, x + 22, y + 18, a)
        cw, ch = (w - 66) // 2, 96
        for i, (key, name, role) in enumerate(self.SIGNERS):
            cx = x + 22 + (i % 2) * (cw + 22)
            cy = y + 54 + (i // 2) * (ch + 42)
            t = self.u0 + 0.35 + i * (self.each + 0.12)
            p = clamp((u - t) / self.each)
            line(f, (cx, cy + ch - 10), (cx + cw, cy + ch - 10), (150, 150, 140), alpha=a, width=1.2, dot=False)
            if p > 0:
                spr = self.ink(key, ease_in_out(p), cw, ch - 12)
                blit(f, spr, cx, cy, a)
            blit(f, TX(name, 'g', 16, 700, (30, 40, 36)), cx, cy + ch - 4, a)
            blit(f, TX(role, 'g', 13, 500, (100, 110, 105)), cx, cy + ch + 16, a)
            if p >= 1:
                blit(f, ICON('circle-check', 18, (30, 150, 90)), cx + cw - 18, cy + ch - 2, a * clamp((u - t - self.each) / 0.2))


# ---------------------------------------------------------------- Vision's checks, then the second yes

class ChecksPanel:
    """Vision's checks on the destruction's two photos, ticked one by one; then Priya's second yes"""
    CHECKS = ['The batch label MF-2409-117, in view', 'About 540 packs at the godown', 'The slate: MF-2409-117 · 540 · today',
              'Both photos taken today']
    def __init__(self, x, y, u0, u_yes, u1, w=600):
        self.x, self.y, self.u0, self.uy, self.u1, self.w = x, y, u0, u_yes, u1, w
        self.kick = kicker_sprite("VISION'S CHECKS ON THE TWO PHOTOS", (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 290, a, alpha=0.86)
        blit(f, self.kick, x + 22, y + 18, a)
        for i, c in enumerate(self.CHECKS):
            t = self.u0 + 0.25 + i * 0.32
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.3))
            yy = y + 54 + i * 44
            blit(f, ICON('circle-check', 24, G), x + 22, yy + 2, a * e)
            blit(f, TX(c, 'g', 21, 560, INK), x + 58 + 12 * (1 - e), yy, a * e)
        if u >= self.uy:
            e = ease_out(clamp((u - self.uy) / 0.35))
            chip = chip_sprite("The second yes · the papers issued", 'good', 21)
            blit(f, chip, x + 22, y + 236 + 8 * (1 - e), a * e)


# ---------------------------------------------------------------- the Watcher's sell-through

class SellThrough:
    """the Watcher's projection from BigQuery's sell-through: 28 packs a day for the 15 selling days left (retailers stop
    a week before the date) sells 420 of 2,000; 1,580 will not"""
    def __init__(self, x, y, u0, u1, w=600):
        self.x, self.y, self.u0, self.u1, self.w = x, y, u0, u1, w
        self.kick = kicker_sprite('SELL-THROUGH · FROM BIGQUERY', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 250, a, alpha=0.86)
        blit(f, self.kick, x + 22, y + 18, a)
        bx0, bx1, by = x + 22, x + w - 22, y + 104
        bw = bx1 - bx0
        ix, iy, al = rrect_alpha(bx0, by, bx1, by + 34, 8)
        over(f, ix, iy, col((60, 80, 70)), al * a * 0.5)
        p = ease_in_out(clamp((u - self.u0 - 0.3) / 1.0))
        gw = bw * 420 / 2000 * p
        ix, iy, al = rrect_alpha(bx0, by, bx0 + max(6, gw), by + 34, 8)
        over(f, ix, iy, col(G), al * a)
        d = clamp(15 * p)
        blit(f, TX(f'{int(round(28 * d)):,} sell in time', 'b', 26, 760, G), bx0, y + 52, a)
        blit(f, TX(f'28 a day × {int(round(d))} selling days', 'g', 16, 500, MUTED), bx0, by + 44, a)
        if p >= 1:
            e = ease_out(clamp((u - self.u0 - 1.3) / 0.4))
            rx0 = bx0 + gw + 3
            ix, iy, al = rrect_alpha(rx0, by, bx1, by + 34, 8)
            pulse = 0.75 + 0.25 * math.sin((u - self.u0) * 7)
            over(f, ix, iy, col(RED), al * a * e * pulse)
            lab = TX('1,580 will not', 'b', 26, 760, RED)
            blit(f, lab, bx1 - lab.shape[1], y + 52, a * e)
            blit(f, TX('of 2,000 · 22 days left, retailers stop 7 days before', 'g', 16, 500, (214, 190, 184)), bx0, by + 72, a * e)


def sad_states(t0, t1):
    """the chips' scheme in the sad path's production run: Shree Ganesh Kirana and Jai Durga Stores ordered 24 each,
    Shree Sai Kirana (only invited) never answered, and the other 35 said not this time, over [t0, t1]"""
    out = {}
    rng = np.random.default_rng(38)
    others = [k_ for k_ in KIRANAS['nagpur'] if k_['name'] not in ('Shree Ganesh Kirana', 'Jai Durga Stores', 'Shree Sai Kirana')]
    for j, k_ in enumerate(rng.permutation(len(others))):
        out[others[k_]['id']] = ('declined', t0 + (t1 - t0) * (j + rng.uniform(0, 0.8)) / len(others))
    for k_ in KIRANAS['nagpur']:
        if k_['name'] == 'Shree Ganesh Kirana': out[k_['id']] = ('ordered', t0 + 0.15)
        if k_['name'] == 'Jai Durga Stores': out[k_['id']] = ('ordered', t0 + 0.3)
        if k_['name'] == 'Shree Sai Kirana': out[k_['id']] = ('silent', t1)
    return out


# ---------------------------------------------------------------- the blank parts, filled with what the moment means

class VisionScan:
    """Vision reading the destruction's two photos: a scan line sweeps each photo as it lands, then its checks tick in
    under it, as the app's review lists them (the batch slip, the count, the slate, the day)"""
    def __init__(self, insets, u_scans, checks, u1):
        self.insets, self.u_scans, self.checks, self.u1 = insets, u_scans, checks, u1
    def draw(self, f, u, L=None):
        for ins, us, cks in zip(self.insets, self.u_scans, self.checks):
            if u < us: continue
            a = fade(u, us, self.u1, 0.2, 0.3)
            ph, pw = ins.spr.shape[0] - 16 - 40, ins.spr.shape[1] - 16
            x0, y0 = ins.x + 8, ins.y + 8
            p = (u - us) / 0.55
            if p < 1:   # the sweep: a bright line and a faint green wash over what it has read
                yy = y0 + ph * ease_in_out(clamp(p))
                over(f, int(x0), int(y0), col(G), np.full((max(1, int(yy - y0)), pw), 0.10 * a, np.float32))
                line(f, (x0, yy), (x0 + pw, yy), G, alpha=0.95 * a, width=2.4, dot=False)
            for j, c in enumerate(cks):
                t = us + 0.55 + j * 0.2
                if u < t: continue
                e = ease_out(clamp((u - t) / 0.3))
                cy = ins.y + ins.spr.shape[0] + 18 + j * 46
                chip = TX(c, 'g', 20, 640, INK)
                panel(f, ins.x, cy, ins.x + chip.shape[1] + 64, cy + 38, a * e, r=19, alpha=0.84, shade=0.25)
                blit(f, ICON('circle-check', 20, G), ins.x + 14, cy + 9, a * e)
                blit(f, chip, ins.x + 44 + 10 * (1 - e), cy + 7, a * e)


class DonationMeals:
    """what Feeding India received for the Mango Drink: 58 packs, a meal for each pack served (its own rule), the 58 meals
    lighting one by one, and the 12.47 kg kept out of landfill, the donor's evidence for BRSR"""
    def __init__(self, x, y, u0, u1, n=58, w=470):
        self.x, self.y, self.u0, self.u1, self.n, self.w = x, y, u0, u1, n, w
        self.kick = kicker_sprite('WHAT THE FOOD BANK RECEIVED', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 400, a, alpha=0.86)
        blit(f, self.kick, x + 24, y + 22, a)
        k = int(round(self.n * ease_out(clamp((u - self.u0 - 0.3) / 1.6))))
        blit(f, TX(f'{k} meals', 'b', 52, 800, G), x + 24, y + 54, a)
        blit(f, TX('a meal for each pack served', 'g', 18, 520, MUTED), x + 26, y + 124, a)
        cols, r, gap = 10, 9, 41
        for i in range(self.n):
            cx, cy = x + 38 + (i % cols) * gap, y + 178 + (i // cols) * 30
            on = i < k
            if on:
                pop = 1 + 0.5 * math.exp(-max(0.0, (u - self.u0 - 0.3 - 1.6 * (i / self.n))) * 9)
                _dot(f, (cx, cy), r * pop, G, 0.9 * a, glow=5)
            else:
                _dot(f, (cx, cy), r * 0.7, (70, 90, 80), 0.6 * a, glow=1)
        e = ease_out(clamp((u - self.u0 - 1.4) / 0.4))
        blit(f, TX('12.47 kg of food kept out of landfill', 'g', 19, 640, INK), x + 24, y + 350 + 6 * (1 - e), a * e)


class KiloBars:
    """where the year's food went, from the ledger (FY 2026-27 so far): 2.07 t resold, 224.6 kg donated, 68.4 kg destroyed,
    each bar growing to its kilos on one scale, then 930 meals and the 97.1% saved"""
    ROWS = [('Resold', 'kiranas, ExpireSoon and staff', 2070.0, '2.07 t', (52, 211, 128)),
            ('Donated', 'to food banks, with receipts', 224.6, '224.6 kg', (120, 170, 255)),
            ('Destroyed', 'at the godown, on evidence', 68.4, '68.4 kg', (229, 102, 60))]
    def __init__(self, x, y, u0, u1, w=600):
        self.x, self.y, self.u0, self.u1, self.w = x, y, u0, u1, w
        self.kick = kicker_sprite('WHERE THE FOOD WENT · FY 2026-27 SO FAR', (232, 242, 236), 15)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        panel(f, x, y, x + w, y + 380, a, alpha=0.86)
        blit(f, self.kick, x + 24, y + 22, a)
        bx, bw = x + 24, w - 48
        for i, (lab, sub, kg, txt, rgb) in enumerate(self.ROWS):
            t = self.u0 + 0.3 + i * 0.35
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.7))
            yy = y + 62 + i * 92
            blit(f, TX(lab, 'b', 24, 760, INK), bx, yy, a)
            blit(f, TX(sub, 'g', 16, 500, MUTED), bx + 130, yy + 6, a)
            vt = TX(txt, 'b', 24, 780, rgb)
            blit(f, vt, x + w - 24 - vt.shape[1], yy, a * clamp((u - t - 0.3) / 0.3))
            ix, iy, al = rrect_alpha(bx, yy + 38, bx + bw, yy + 56, 9)
            over(f, ix, iy, col((60, 80, 70)), al * a * 0.35)
            ix, iy, al = rrect_alpha(bx, yy + 38, bx + max(10, bw * kg / 2070.0 * e), yy + 56, 9)
            over(f, ix, iy, col(rgb), al * a * 0.95)
        e = ease_out(clamp((u - self.u0 - 1.6) / 0.4))
        blit(f, chip_sprite('930 meals · 97.1% of the food saved', 'good', 21), x + 24, y + 330 + 6 * (1 - e), a * e)
