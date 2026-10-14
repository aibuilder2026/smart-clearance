"""SC-207 cut 5: the new scenes. The opening's words printed on a shipping label as the voice says them, and stamped
WRITTEN OFF; Munchly's supply chain laid out in depth, then the two batches the film follows; the agents' walk in full,
each stop lit as it works, with its sound; the workspace installed as an app on every device; how the swing adds up,
batch by batch; the roadmap and the guided demo; the close, aligned to one edge. Each part draws itself into a float
BGR frame at a local time u (seconds), as parts.py's do."""
import math
from functools import lru_cache
import cv2
import numpy as np
from PIL import Image, ImageDraw
from kit import *
import kit
from parts import words_sprite, card_sprite, chip_sprite, url_line, AGENT_FRAMES, studio, BAR, money, over_bar, tag_sprite, PEOPLE, avatar_img
from parts3 import text_sprite, pack_sprite, glow_sprite, Footage
from parts4 import _cam, _proj, _poly, _glow_line, _dot, _warp_sprite, fm_spring, ease_in, bezier_ease, Orbit, MarkDraw, Kinetic, _zoom
import fx


# ---------------------------------------------------------------- 0 · the opening's words, printed on a label

INK = (24, 20, 16)


@lru_cache(maxsize=None)
def paper(w, h, seed=7):
    """thermal label stock: a warm white with a faint grain (float RGB 0..1)"""
    rng = np.random.default_rng(seed)
    g = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 0.8) * 0.010
    base = np.array([0.975, 0.968, 0.948], np.float32)
    return np.clip(base[None, None, :] + g[..., None], 0, 1)


class LabelPrint:
    """The opening's sentence printed on a shipping label as the voice says it, as a carton's label is: the label feeds
    up out of a print line glowing in the air, row by row, each row printed as it passes the line, then stops; at the
    sentence's end a red WRITTEN OFF stamp thumps onto it. The label floats a little turned towards the light, drifting
    with the camera, and lifts away before the dive. rows: [(text, kind, size, wght, track, u, rgb)], each fed out and
    printed at its u; u_stamp; u_out."""
    S = 2

    def __init__(self, x, y_line, width, rows, u_stamp, u_out, stamp='WRITTEN OFF'):
        self.x, self.y_line, self.w = x, y_line, width
        self.u_stamp, self.u_out = u_stamp, u_out
        S = self.S
        pad, y = 34, 30
        laid = []
        for text, kind, size, wght, track, u, rgb in rows:
            laid.append((y, text, kind, size, wght, track, u, rgb))
            y += int(size * (1.18 if kind == 'b' else 1.55))
        # the barcode under the words, as a shipper label has
        y += 10
        self.bar_y = y; y += 64
        self.h = y + 28
        w, h = self.w, self.h
        im = Image.fromarray((paper(w * S, h * S) * 255).astype(np.uint8), 'RGB').convert('RGBA')
        d = ImageDraw.Draw(im)
        self.rows = []
        for (yy, text, kind, size, wght, track, u, rgb) in laid:
            draw_text(d, (pad * S, yy * S), text, kind, size * S, (rgb or INK) + (255,), wght, track)
            self.rows.append((yy, yy + int(size * (1.18 if kind == 'b' else 1.55)), u))
        # a thin rule, then the barcode's bars (an ITF-14 pattern) and its number
        d.line([pad * S, (self.bar_y - 6) * S, (w - pad) * S, (self.bar_y - 6) * S], fill=INK + (255,), width=int(1.5 * S))
        rng = np.random.default_rng(118)
        bx = pad
        while bx < w * 0.56:
            bw = rng.choice([2.2, 2.2, 5.5])
            d.rectangle([bx * S, (self.bar_y + 6) * S, (bx + bw) * S, (self.bar_y + 46) * S], fill=INK + (255,))
            bx += bw + rng.choice([2.2, 2.2, 5.5])
        draw_text(d, ((w * 0.6) * S, (self.bar_y + 8) * S), 'BATCH  MF-2410-118', 'g', 17 * S, INK + (255,), 640, 0.06)
        draw_text(d, ((w * 0.6) * S, (self.bar_y + 30) * S), 'BEST BEFORE  24 OCT 2026', 'g', 17 * S, INK + (255,), 640, 0.06)
        self.rows.append((self.bar_y - 10, self.h, rows[-1][5] + 0.35))
        self.label = to_sprite(im.resize((w, h), Image.LANCZOS))
        self.stamp = self._stamp(stamp)
        # where the label rests between rows: half way between one row's ink and the next's, so a row waiting to be
        # printed never shows its tops at the line (the barcode's field last, the label's foot)
        ink = (self.label[..., :3].mean(axis=2) < 0.6).any(axis=1)
        def extent(y0, y1):
            ys = np.nonzero(ink[y0:y1])[0]
            return (y0 + ys[0], y0 + ys[-1]) if len(ys) else (y0, y1)
        ext = [extent(y0, y1) for (y0, y1, _) in self.rows]
        self.rest = [(ext[i][1] + ext[i + 1][0]) / 2 + 1 for i in range(len(ext) - 1)] + [self.h]

    @staticmethod
    def _stamp(text):
        """a red rubber stamp: two borders and the word, in ink that did not take everywhere"""
        S = 2; size = 46
        tw = text_w(text, 'b', size, 800, 0.04)
        w, h = int(tw + 64), int(size * 1.9)
        im = Image.new('L', (w * S, h * S), 0); d = ImageDraw.Draw(im)
        d.rounded_rectangle([3 * S, 3 * S, (w - 3) * S, (h - 3) * S], radius=10 * S, outline=255, width=int(5 * S))
        d.rounded_rectangle([11 * S, 11 * S, (w - 11) * S, (h - 11) * S], radius=6 * S, outline=255, width=int(2 * S))
        draw_text(d, (32 * S, (h / 2 - size * 0.62) * S), text, 'b', size * S, 255, 800, 0.04)
        a = np.asarray(im, np.float32) / 255
        rng = np.random.default_rng(5)
        grain = cv2.GaussianBlur(rng.random(a.shape).astype(np.float32), (0, 0), 2.2 * S)
        grain = (grain - grain.min()) / (grain.max() - grain.min())
        a = a * np.clip(0.55 + grain * 0.9, 0, 1)        # the ink takes unevenly
        a = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
        return a

    def fed(self, u):
        """how much of the label has come out of the printer (px): each row feeds out over 0.34 s from its u, from where
        the label rested to where it rests after that row"""
        out, prev = 0.0, 0.0
        for (y0, y1, t), rest in zip(self.rows, self.rest):
            if u >= t: out = prev + (rest - prev) * ease_in_out(clamp((u - t) / 0.34))
            prev = rest
        return min(self.h, out)

    def draw(self, f, u, L=None):
        e = int(round(self.fed(u)))
        if e <= 0: return
        lift = ease_in(clamp((u - self.u_out) / 0.45))
        a = 1 - lift
        if a <= 0.002: return
        w, h, P = self.w, self.h, 40
        lab = self.label.copy()
        if u >= self.u_stamp:   # the stamp thumps down: a little large, then flat on the paper, its ink multiplied in
            p = clamp((u - self.u_stamp) / 0.12)
            sc = 1.5 - 0.5 * ease_out(p)
            st = self.stamp
            M = cv2.getRotationMatrix2D((st.shape[1] / 2, st.shape[0] / 2), -11, sc)
            cx, cy = w * 0.735, self.rows[2][0] + 44         # over the second big line's end, its words still read through
            M[0, 2] += cx - st.shape[1] / 2; M[1, 2] += cy - st.shape[0] / 2
            ink = cv2.warpAffine(st, M, (w, h), flags=cv2.INTER_LINEAR) * 0.9 * clamp(p * 3)
            red = np.array([0.19, 0.21, 0.84], np.float32)     # BGR of the ink
            lab[..., :3] = lab[..., :3] * (1 - ink[..., None]) + lab[..., 3:4] * red * ink[..., None]
        # the label's layer: what has come out of the printer, its last printed row on the line
        lay = np.zeros((h + 2 * P, w + 2 * P, 4), np.float32)
        lay[P + h - e: P + h, P:P + w] = lab[0:e]
        drift = 6 * ease_in_out(u / 6.0)
        line_y = self.y_line - drift
        yl = line_y - 60 * lift                     # the label lifts away from the line at the end
        X0, Y0 = self.x - P, yl - (P + h)
        ys, xs = lay.shape[:2]
        k = 0.035   # turned a little: its right edge farther away
        src = np.float32([[0, 0], [xs, 0], [xs, ys], [0, ys]])
        dst = np.float32([[X0, Y0], [X0 + xs * (1 - k), Y0 + ys * k * 0.5], [X0 + xs * (1 - k), Y0 + ys * (1 - k * 0.5)], [X0, Y0 + ys]])
        # its soft shadow on the scene
        sh = np.zeros((H, W), np.float32)
        cv2.rectangle(sh, (int(self.x + 16), int(yl - e + 24)), (int(self.x + w + 10), int(yl + 20)), 1.0, -1)
        sh = cv2.GaussianBlur(sh, (0, 0), 16) * 0.42 * a
        f *= (1 - sh[..., None])
        M = cv2.getPerspectiveTransform(src, dst)
        out = cv2.warpPerspective(lay, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        f *= (1 - out[..., 3:4] * a)
        f += out[..., :3] * a
        # the print line: a thin warm light where the label comes out, brighter while a row is printing
        feeding = any(0 <= u - t < 0.4 for (_, _, t) in self.rows)
        la = (0.5 + (0.5 if feeding else 0.0)) * (1 - ramp(u, self.u_out - 0.2, self.u_out + 0.2)) * clamp(e / 30)
        if la > 0.01:   # along the label's own foot as it is turned, a little wider than the label
            ends = cv2.perspectiveTransform(np.float32([[[P, P + h], [P + w, P + h]]]), M)[0]
            d = (ends[1] - ends[0]) / np.linalg.norm(ends[1] - ends[0])
            pts = np.float32([ends[0] - d * 26, ends[1] + d * 22]) + np.float32([0, 60 * lift])   # the line stays as the label lifts
            _glow_line(f, pts, (255, 232, 190), la, width=1.6, glow=5)


# ---------------------------------------------------------------- 2 · the architecture, then the agents' walk in full

from parts4 import ArchScene, ORBIT_CROP

# the walk as captured (capture-agents.mjs: the console's sign-in at 1920 x 1080, at 2x, a third of real speed): each
# stop's first frame, and where its agents sit in the film's frame (their buttons on the live page, through ORBIT_CROP)
_K = 1920 / ORBIT_CROP[2]
def _at(x, y): return (2 * x * _K, (2 * y - ORBIT_CROP[1]) * _K)
WALK = [   # (first frame, stop, agents at work, their places)
    (71, 'Connect', 'Data', [_at(196.8, 529.5)]),
    (124, 'Detect', 'Watcher', [_at(282.3, 415.8)]),
    (176, 'Verify', 'Vision', [_at(497.5, 327.7)]),
    (229, 'Value', 'Valuer', [_at(723.2, 364.7)]),
    (281, 'Decide', 'Router', [_at(866.9, 440.6)]),
    (334, 'Approve', 'You', [_at(935.1, 563.7)]),
    (434, 'Execute', 'Outreach, Lister and Negotiator', [_at(947.1, 701.0), _at(846.0, 818.7), _at(712.1, 885.3)]),
    (546, 'Settle', 'Paperwork', [_at(402.6, 884.4)]),
    (599, 'Report', 'Impact', [_at(267.5, 814.7)]),
    (651, 'Report', 'Sold, not binned.', []),
]
CAPTION = _at(561.3, 622.5)     # the walk's own caption card, in the middle of the orbit


class AgentsWalk(ArchScene):
    """The architecture in depth and the dive into the agents' layer (cut 4's ArchScene), then the agents' walk in full
    (cut 5): every stop lit as it works, at about its own pace, a soft light on the agents at work, the camera easing in
    on the walk's own caption so it can be read, and the nine stops lit on a tracker. starts: the local time each of
    WALK's ten moments begins (the last, 'Sold, not binned.'), laid on the voice by the caller."""
    def __init__(self, L, d0, d1, starts, glow_at=()):
        super().__init__(L, d0, d1, u_yes=starts[5], glow_at=glow_at, walk=(0, WALK[0][0], WALK[5][0], WALK[5][0] + 18))
        self.starts = starts
        self.kick = {k: words_sprite(kicker='NINE STOPS · ONE HUMAN YES', width=760, stop=k) for k in range(9)}

    def walk_frame(self, u):
        """(capture frame, frames per film frame): each moment's frames spread over its time, held at the end"""
        st, fr = self.starts, [w[0] for w in WALK]
        if u <= st[0]: return fr[0], 1.0
        for i in range(len(st) - 1):
            if u < st[i + 1]:
                rate = (fr[i + 1] - fr[i]) / max(1e-3, (st[i + 1] - st[i]) * FPS)
                return fr[i] + (fr[i + 1] - fr[i]) * (u - st[i]) / (st[i + 1] - st[i]), rate
        return min(fr[-1] + (u - st[-1]) * FPS * 1.2, 1000), 1.2

    def stop_at(self, u):
        k = 0
        for i, t in enumerate(self.starts):
            if u >= t: k = i
        return k

    def draw(self, f, u, L=None):
        if u < self.d1:
            return super().draw(f, u, L)
        s, rate = self.walk_frame(u)
        # the camera: a slow push about the walk's caption, so its words grow legible as it plays
        z = 1 + 0.10 * ease_in_out((u - self.d1) / max(1e-3, self.starts[-1] - self.d1 + 0.8))
        cx, cy = CAPTION
        n = max(1, min(6, int(round(rate))))
        acc = None
        first = WALK[self.stop_at(u)][0] if u >= self.starts[0] else 0
        for j in range(n):   # the frames between two of ours, averaged: motion keeps its blur at any pace (never
            # back across the stop's first frame, where the caption changes: its words would ghost)
            fr = self.orbit.frame(max(first, int(round(s - j * rate / n))), (W, H)).astype(np.float32)
            acc = fr if acc is None else acc + fr
        img = acc / (n * 255.0)
        f[:] = _zoom(img, z, (cx, cy)) if z > 1.0005 else img
        # a soft light on the agents at work
        k = self.stop_at(u)
        pts = WALK[k][3]
        if pts:
            e = ease_out((u - self.starts[k]) / 0.35)
            sp = np.zeros((H // 4, W // 4), np.float32)
            for (px, py) in pts:
                qx, qy = cx + (px - cx) * z, cy + (py - cy) * z
                cv2.circle(sp, (int(qx / 4), int(qy / 4)), 1, 1.0, -1)
            sp = cv2.GaussianBlur(sp, (0, 0), 36)
            sp = cv2.resize(sp / max(1e-6, sp.max()), (W, H), interpolation=cv2.INTER_LINEAR)
            f *= (1 - 0.22 * e * (1 - sp))[..., None]
            f += (0.06 * e * sp)[..., None] * col((52, 211, 128))
        # the yes: an amber ping round the person's stop
        for d_ in (0.0, 0.22):
            q = (u - self.starts[5] - d_) / 0.9
            if 0 <= q < 1:
                px, py = WALK[5][3][0]
                px, py = cx + (px - 56 - cx) * z, cy + (py - cy) * z
                rr = 18 + 74 * ease_out(q)
                ring(f, px - rr, py - rr, px + rr, py + rr, rr, 1.0, 0.85 * (1 - q), color=(247, 192, 74), width=3.0, glow=True)
        # the nine stops, lit on the tracker
        ka = clamp((u - self.d1) / 0.4)
        stop = min(8, k if k < 9 else 8)
        blit(f, self.kick[stop], 64, 52, ka)


# ---------------------------------------------------------------- 3 · Munchly's supply chain, then the two batches

@lru_cache(maxsize=None)
def munchly_badge(size=96):
    """Munchly's mark (its workspace mark, cartons.munchly_mark) as a premultiplied sprite"""
    import cartons
    return to_sprite(cartons.munchly_mark(size))


@lru_cache(maxsize=None)
def node_label(title, sub, align='center', tsize=26, ssize=18, rgb=(240, 246, 242), srgb=(160, 186, 172), width=None):
    S = 2
    tw, sw = text_w(title, 'g', tsize, 680), text_w(sub, 'g', ssize, 480) if sub else 0
    w = int(width or max(tw, sw) + 8); h = int(tsize * 1.3 + (ssize * 1.45 if sub else 0) + 4)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    def x_(t_w): return 0 if align == 'left' else (w - t_w) / 2
    draw_text(d, (x_(tw) * S, 0), title, 'g', tsize * S, rgb + (255,), 680)
    if sub: draw_text(d, (x_(sw) * S, tsize * 1.3 * S), sub, 'g', ssize * S, srgb + (255,), 480)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def path_tag(text, rgb, size=20):
    """a path's tag: a pill in its colour"""
    S = 2
    tw = text_w(text, 'g', size, 760, 0.1)
    w, h = int(tw + 30), int(size * 1.7)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=tuple(rgb) + (255,))
    draw_text(d, (15 * S, (h / 2 - size * 0.62) * S), text, 'g', size * S, (8, 14, 11, 255), 760, 0.1)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def exit_icon(kind, size=56):
    """a round icon for an exit: the food bank's heart in a box, the marketplace's tag, the staff's UPI, the bin"""
    S = 4; n = size * S
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fill = {'food': (23, 107, 78), 'market': (23, 107, 78), 'staff': (23, 107, 78), 'bin': (90, 36, 28)}[kind]
    edge = {'food': (115, 201, 157), 'market': (115, 201, 157), 'staff': (115, 201, 157), 'bin': (229, 92, 74)}[kind]
    d.ellipse([2, 2, n - 3, n - 3], fill=fill + (255,), outline=edge + (255,), width=int(2.4 * S))
    ink = (236, 243, 239, 255); c = n / 2; u = n / 56
    if kind == 'food':     # a box with a heart
        d.rectangle([c - 13 * u, c - 4 * u, c + 13 * u, c + 14 * u], outline=ink, width=int(2.6 * u))
        d.line([c - 13 * u, c - 4 * u, c - 9 * u, c - 11 * u, c + 9 * u, c - 11 * u, c + 13 * u, c - 4 * u], fill=ink, width=int(2.6 * u))
        d.ellipse([c - 6 * u, c + 0 * u, c - 0 * u, c + 6 * u], fill=ink); d.ellipse([c + 0 * u, c + 0 * u, c + 6 * u, c + 6 * u], fill=ink)
        d.polygon([(c - 6 * u, c + 3.6 * u), (c + 6 * u, c + 3.6 * u), (c, c + 10 * u)], fill=ink)
    elif kind == 'market':  # a price tag
        d.polygon([(c - 12 * u, c - 12 * u), (c + 2 * u, c - 12 * u), (c + 14 * u, c), (c + 2 * u, c + 12 * u), (c - 12 * u, c + 12 * u)], outline=ink, width=int(2.6 * u))
        d.ellipse([c - 7 * u, c - 4 * u, c - 1 * u, c + 2 * u], fill=ink)
    elif kind == 'staff':   # people
        for dx in (-7, 7):
            d.ellipse([c + (dx - 4) * u, c - 12 * u, c + (dx + 4) * u, c - 4 * u], fill=ink)
            d.pieslice([c + (dx - 8) * u, c - 2 * u, c + (dx + 8) * u, c + 14 * u], 180, 360, fill=ink)
    else:                   # the bin
        d.rectangle([c - 10 * u, c - 6 * u, c + 10 * u, c + 13 * u], outline=ink, width=int(2.6 * u))
        d.line([c - 13 * u, c - 9 * u, c + 13 * u, c - 9 * u], fill=ink, width=int(2.6 * u))
        d.line([c - 4 * u, c - 13 * u, c + 4 * u, c - 13 * u], fill=ink, width=int(2.6 * u))
    return to_sprite(im.resize((size, size), Image.LANCZOS))


class MunchlyMap:
    """Munchly Foods' supply chain, laid out on a ground in depth as the voice names it: the brand; its four
    distributors, each its own route from the brand; the kiranas round each one (38, 58, 52 and 47, as the workspace has
    them); the other exits (food banks, the ExpireSoon marketplace, the staff sale, and destruction as the last resort).
    Then the two batches the film follows light their own branches: the Mango Drink at Lakshmi Agencies (the happy
    path, green) and the Masala Chips at Rakesh Traders (the sad path, amber). t: the local times of each beat."""
    DIST = [  # key, name, city, kiranas, x, portrait
        ('patil', 'Patil Distributors', 'Pune', 52, -980, None),
        ('rakesh', 'Rakesh Traders', 'Nagpur', 38, -280, 'p-rakesh'),
        ('lakshmi', 'Lakshmi Agencies', 'Hyderabad', 58, 280, 'p-lakshmi'),
        ('gupta', 'Gupta & Sons', 'Indore', 47, 980, None),
    ]
    EXITS = [('bin', 'Destroyed', 'the last resort, on evidence', -660), ('market', 'ExpireSoon', 'a clearance marketplace', -230),
             ('staff', 'Staff sale', "at the distributor's godown", 230), ('food', 'Food banks', 'Feeding India, IFBN', 660)]
    HQ = (0.0, -470.0)
    DZ, KZ, EZ = -60.0, 210.0, 560.0

    def __init__(self, L, t_brand, t_dist, t_kir, t_exit, t_two, t_happy, t_sad):
        self.L = L
        self.t = dict(brand=t_brand, dist=t_dist, kir=t_kir, exit=t_exit, two=t_two, happy=t_happy, sad=t_sad)
        rng = np.random.default_rng(2071)
        self.kir = {}
        for key, _, _, n, x, _ in self.DIST:
            pts = []
            for i in range(n):   # a fan in front of the distributor, denser near it
                a = rng.uniform(-1.0, 1.0); r = 170 + 150 * math.sqrt(rng.uniform(0.05, 1.0))
                pts.append((x + math.sin(a * 0.85) * r * 0.78, self.DZ + math.cos(a * 0.85) * r * 0.75 + 60, rng.uniform(0, 0.5)))
            self.kir[key] = pts
        self.hq_lab = node_label('Munchly Foods', 'our imaginary client · 7 SKUs', tsize=34, ssize=20)
        self.d_lab = {k: node_label(n, f'{c} · {kk} kiranas', tsize=24, ssize=17) for k, n, c, kk, _, _ in self.DIST}
        self.e_lab = {k: node_label(n, s, tsize=22, ssize=16) for k, n, s, _ in self.EXITS}
        self.faces = {k: to_sprite(avatar_img(str(PEOPLE / f'{p}.webp'), 66)) for k, _, _, _, _, p in self.DIST if p}
        self.inits = {k: to_sprite(avatar_img(''.join(w[0] for w in n.replace('&', '').split()[:2]).upper(), 66)) for k, n, _, _, _, p in self.DIST if not p}
        self.happy = path_tag('HAPPY PATH · MANGO DRINK', (52, 211, 128))
        self.sad = path_tag('SAD PATH · MASALA CHIPS', (247, 192, 74))
        self.mango, self.chips = pack_sprite('mango', 132), pack_sprite('chips', 132)
        self.dust = fx.Dust(n=80, seed=2072, strength=0.3)

    def camera(self, u):
        p = ease_in_out(u / max(1e-3, self.L))
        q = ease_in_out((u - self.t['two']) / 1.6)
        T = np.array([0.0, 0.0, 90.0 + 40 * q])
        return _cam(T, -6 + 8 * p, 58 - 6 * p - 4 * q, 2250 - 230 * p - 240 * q)

    def P(self, cam, x, z, y=0.0):
        pt, zz = _proj(np.array([[x, y, z]], float), cam)
        return pt[0], zz[0]

    def draw(self, f, u, L=None):
        f[:] = studio()
        self.dust.draw(f, u, 0.6)
        cam = self.camera(u)
        t = self.t
        ga = clamp(u / 0.6)
        for gx in range(-1200, 1201, 150):   # the ground's grid
            P = np.array([[gx, 0, -700], [gx, 0, 800]], float); pts, _ = _proj(P, cam)
            _glow_line(f, pts.astype(np.float32), (63, 176, 123), 0.06 * ga, width=1.1, glow=2)
        for gz in range(-700, 801, 150):
            P = np.array([[-1200, 0, gz], [1200, 0, gz]], float); pts, _ = _proj(P, cam)
            _glow_line(f, pts.astype(np.float32), (63, 176, 123), 0.06 * ga, width=1.1, glow=2)
        focus = ease_in_out((u - t['two']) / 0.8)           # the two batches' branches stand out; the rest steps back
        def dim(key): return 1.0 - 0.72 * focus if key not in ('rakesh', 'lakshmi') else 1.0
        hq, _ = self.P(cam, *self.HQ)
        # the routes from the brand to its distributors, drawn on, with packs running along them
        for i, (key, name, city, n, x, face) in enumerate(self.DIST):
            r0 = t['dist'] + 0.12 * i
            p = ease_in_out((u - r0) / 0.6)
            if p <= 0: continue
            path = np.array([self.P(cam, self.HQ[0] + (x - self.HQ[0]) * s, self.HQ[1] + (self.DZ - self.HQ[1]) * s)[0] for s in np.linspace(0, 1, 40)], np.float32)
            k = max(2, int(round(p * len(path))))
            rgb = (63, 176, 123)
            if key == 'lakshmi': rgb = tuple(int(a + (b - a) * ease_in_out((u - t['happy']) / 0.5)) for a, b in zip(rgb, (52, 211, 128)))
            if key == 'rakesh': rgb = tuple(int(a + (b - a) * ease_in_out((u - t['sad']) / 0.5)) for a, b in zip(rgb, (247, 192, 74)))
            _glow_line(f, path[:k], rgb, 0.85 * dim(key), width=3.0, glow=6)
            if p >= 1:
                for m in range(3):
                    ph = ((u - r0 - 0.6) * 0.55 + m / 3) % 1.0
                    _dot(f, path[int(ph * (len(path) - 1))], 4.5, rgb, 0.9 * dim(key) * clamp(min(ph, 1 - ph) * 8), glow=6)
        # the kiranas round each distributor, bursting in, the batch's own lighting up when its path does
        for i, (key, name, city, n, x, face) in enumerate(self.DIST):
            k0 = t['kir'] + 0.1 * i
            if u < k0: continue
            lit_n = 0; lit_rgb = None
            if key == 'lakshmi' and u > t['happy']: lit_n, lit_rgb = int(52 * ease_out((u - t['happy']) / 1.0)), (52, 211, 128)
            if key == 'rakesh' and u > t['sad']: lit_n, lit_rgb = 2, (247, 192, 74)
            dp, _ = self.P(cam, x, self.DZ)
            for j, (kx, kz, dl) in enumerate(self.kir[key]):
                sp = fm_spring(u - k0 - dl * 0.6, 420, 20) if u > k0 + dl * 0.6 else 0
                if sp <= 0: continue
                q, _ = self.P(cam, kx, kz)
                pos = dp + (q - dp) * sp
                lit = j < lit_n
                _dot(f, pos, 3.4 if not lit else 4.2, lit_rgb if lit else (115, 201, 157), (0.85 if lit else 0.5) * dim(key), glow=4 if not lit else 7,
                     core=None if lit else (150, 190, 170))
        # the exits, and the dashed ways to them
        for i, (kind, name, sub, x) in enumerate(self.EXITS):
            e0 = t['exit'] + 0.14 * i
            if u < e0: continue
            ep, _ = self.P(cam, x, self.EZ)
            sp = fm_spring(u - e0, 300, 20)
            on_h = kind in ('food', 'staff') and u > t['happy']
            on_s = kind in ('market', 'bin') and u > t['sad']
            for key, _, _, _, dx, _ in self.DIST:
                if key not in ('rakesh', 'lakshmi'): continue
                go = (key == 'lakshmi' and on_h) or (key == 'rakesh' and on_s)
                a0, _ = self.P(cam, dx, self.DZ + 30)
                seg = np.array([a0 + (ep - a0) * s for s in np.linspace(0, 1, 30)], np.float32)
                rgb = ((52, 211, 128) if key == 'lakshmi' else (247, 192, 74)) if go else (63, 176, 123)
                if kind == 'bin' and go: rgb = (229, 92, 74)
                da = (0.9 if go else 0.18 * (1 - focus)) * clamp((u - e0) / 0.4)
                for m in range(0, 30, 3):   # dashed
                    _glow_line(f, seg[m:m + 2], rgb, da, width=2.0 if go else 1.4, glow=3)
            ic = exit_icon(kind)
            blit(f, ic, ep[0], ep[1], clamp((u - e0) / 0.25) * (1 - 0.5 * focus * (0 if (on_h or on_s) else 1)), scale=0.6 + 0.4 * sp, ox=ic.shape[1] / 2, oy=ic.shape[0] / 2)
            lab = self.e_lab[kind]
            blit(f, lab, ep[0] - lab.shape[1] / 2, ep[1] + 34, clamp((u - e0 - 0.1) / 0.3) * (1 - 0.6 * focus * (0 if (on_h or on_s) else 1)))
        # the distributors
        for i, (key, name, city, n, x, face) in enumerate(self.DIST):
            r0 = t['dist'] + 0.12 * i + 0.45
            if u < r0: continue
            dp, _ = self.P(cam, x, self.DZ)
            sp = fm_spring(u - r0, 320, 20)
            spr = self.faces.get(key, self.inits.get(key))
            a = clamp((u - r0) / 0.25) * dim(key)
            blit(f, spr, dp[0], dp[1], a, scale=0.55 + 0.45 * sp, ox=spr.shape[1] / 2, oy=spr.shape[0] / 2)
            lab = self.d_lab[key]
            blit(f, lab, dp[0] - lab.shape[1] / 2, dp[1] + 40, clamp((u - r0 - 0.1) / 0.3) * dim(key))
        # the brand
        if u > t['brand']:
            sp = fm_spring(u - t['brand'], 260, 18)
            mk = munchly_badge(104)
            blit(f, mk, hq[0], hq[1], clamp((u - t['brand']) / 0.25), scale=0.55 + 0.45 * sp, ox=52, oy=52)
            blit(f, self.hq_lab, hq[0] - self.hq_lab.shape[1] / 2, hq[1] - 128, clamp((u - t['brand'] - 0.15) / 0.35))
        # the two paths' tags and their packs
        for key, tt, tag, pk in (('lakshmi', t['happy'], self.happy, self.mango), ('rakesh', t['sad'], self.sad, self.chips)):
            if u < tt: continue
            dp, _ = self.P(cam, [d[4] for d in self.DIST if d[0] == key][0], self.DZ)
            a = clamp((u - tt) / 0.3)
            e = ease_out((u - tt) / 0.5)
            side = 1 if key == 'lakshmi' else -1
            tx = dp[0] + 34 if side > 0 else dp[0] - 34 - tag.shape[1]     # above the node, away from the brand's route
            blit(f, tag, tx + side * 14 * (1 - e), dp[1] - 78, a)
            px = tx + tag.shape[1] - 30 if side > 0 else tx - pk.shape[1] + 30
            blit(f, pk, px, dp[1] - 78 - pk.shape[0] + 26 + 5 * math.sin((u - tt) * 1.6), a)


# ---------------------------------------------------------------- 5 · the workspace, installed as an app on every device

from parts import FrameSource, push_sprite, bar_sprite
from kit import REC, DEV, RADIUS
INSTALL_SHOT = HERE / 'build' / 'install-dialog.png'   # Chrome's own install prompt for the live workspace (a screenshot)


@lru_cache(maxsize=None)
def install_dialog(width):
    """Chrome's install prompt for munchly-smartclearance.web.app, as the maintainer's screenshot shows it, with its
    rounded corners and at `width` px"""
    im = cv2.imread(str(INSTALL_SHOT), cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3: im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    h0, w0 = im.shape[:2]
    m = Image.new('L', (w0 * 4, h0 * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w0 * 4 - 1, h0 * 4 - 1], radius=11 * 4, fill=255)
    a = np.asarray(m.resize((w0, h0), Image.LANCZOS), np.float32) / 255
    pm = np.dstack([im[..., :3].astype(np.float32) / 255 * a[..., None], a])
    h = round(h0 * width / w0)
    return np.ascontiguousarray(cv2.resize(pm, (width, h), interpolation=cv2.INTER_AREA))


@lru_cache(maxsize=None)
def app_bar_sprite(width, title='Munchly · Smart-Clearance', bh=44, r=16):
    """an installed app's own window bar: the window's buttons, the app's icon and its name, no address"""
    S = 2
    im = Image.new('RGBA', (width * S, bh * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, width * S - 1, bh * S + r * S], radius=r * S, fill=(30, 38, 34, 255))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        cx, cy = (20 + i * 20) * S, bh * S / 2
        d.ellipse([cx - 6 * S, cy - 6 * S, cx + 6 * S, cy + 6 * S], fill=c + (230,))
    tw = text_w(title, 'g', 17, 600)
    x0 = (width - tw - 30) / 2
    ic = Image.open(HERE / 'build' / 'mark.png').convert('RGBA').crop((16, 16, 496, 496)).resize((22 * S, 22 * S), Image.LANCZOS)
    im.paste(ic, (int(x0 * S), int((bh / 2 - 11) * S)), ic)
    draw_text(d, ((x0 + 30) * S, (bh / 2 - 17 * 0.65) * S), title, 'g', 17 * S, (236, 243, 239, 255), 600)
    return to_sprite(im.resize((width, bh), Image.LANCZOS))


@lru_cache(maxsize=None)
def pointer_sprite(size=30):
    """the pointer: a dark arrow with a white edge"""
    S = 4; n = size * S
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(0.08, 0.04), (0.08, 0.80), (0.27, 0.62), (0.40, 0.92), (0.52, 0.87), (0.39, 0.58), (0.64, 0.58)]
    P = [(x * n, y * n) for x, y in pts]
    d.polygon(P, fill=(255, 255, 255, 255))
    Q = [(x * n + (0.5 - x) * n * 0.08, y * n + (0.45 - y) * n * 0.08) for x, y in pts]
    d.polygon(Q, fill=(20, 24, 22, 255))
    return to_sprite(im.resize((size, size), Image.LANCZOS))


class Device:
    """a device's screen from a recording at a rect that moves (x, y, scale over time): a laptop's window with its bar
    (a browser's, or the installed app's), or a tablet's or a phone's screen in its body"""
    def __init__(self, rec, dev, t_src, kind, url=None):
        r = DEV[dev]
        self.src, self.t_src, self.kind, self.url = FrameSource(REC[rec], r), t_src, kind, url
        self.sw, self.sh, self.rad = r[2], r[3], RADIUS[dev]
    def rect(self, x, y, s):
        return x, y, x + self.sw * s, y + self.sh * s
    def draw(self, f, u, x, y, s, a=1.0, app=0.0):
        if a <= 0.002: return
        if getattr(self, 'still', None) is None:       # a still of the app at work, without the stage's own pointer
            self.still = unpoint(self.src.get(self.t_src))
        img = self.still
        x0, y0, x1, y1 = self.rect(x, y, s)
        if self.kind == 'laptop':
            shadow(f, x0, y0 - BAR, x1, y1, 16, alpha=0.6 * a)
        else:   # the device's body round its screen
            pad = 14 * s / 0.5
            shadow(f, x0 - pad, y0 - pad, x1 + pad, y1 + pad, 30, alpha=0.6 * a)
            ix0, iy0, m = rrect_alpha(x0 - pad, y0 - pad, x1 + pad, y1 + pad, (self.rad + 14) * s / 0.5 * 0.9, pad=2)
            over(f, ix0, iy0, col((16, 18, 20)), m * a)
        ix0, iy0, patch = place(img, s, x0, y0, (x0, y0, x1, y1))
        if patch is None: return
        mx0, my0, m = rrect_alpha(x0, y0, x1, y1, max(4, self.rad * s), pad=0, top_r=0.01 if self.kind == 'laptop' else None)
        hh, ww = patch.shape[:2]
        m = m[iy0 - my0: iy0 - my0 + hh, ix0 - mx0: ix0 - mx0 + ww]
        if m.shape != patch.shape[:2]: m = cv2.resize(m, (ww, hh), interpolation=cv2.INTER_NEAREST)
        over(f, ix0, iy0, patch, m * a)
        if self.kind == 'laptop':
            w = int(round(x1 - x0))
            if app < 1: blit(f, bar_sprite(w, self.url, BAR, 16), x0, y0 - BAR, a * (1 - app))
            if app > 0: blit(f, app_bar_sprite(w), x0, y0 - BAR, a * app)


class InstallScene:
    """The workspace is a progressive web app: on Priya's laptop Chrome offers to install it and she takes it; her
    window becomes the app's own (no address bar, its icon and name); then the camera draws back to her laptop beside
    Lakshmi Agencies' tablet and a kirana's phone, each with the app installed, and the app's own alerts land on all
    three at once, live. t_click, t_back, t_push: the local times of the beats."""
    def __init__(self, L, t_offer, t_click, t_back, t_push):
        self.L, self.t_offer, self.t_click, self.t_back, self.t_push = L, t_offer, t_click, t_back, t_push
        self.lap = Device('mango', 'P', 88.4, 'laptop', 'munchly-smartclearance.web.app/command')
        self.tab = Device('mango', 'L', 110.4, 'tablet')
        self.phone = Device('mango', 'H', 245.4, 'phone')
        self.dialog = install_dialog(430)
        self.ptr = pointer_sprite(30)
        self.head = words_sprite(kicker='A PROGRESSIVE WEB APP', head='Installed on every device.', sub='Its alerts arrive live, through Firebase Cloud Messaging.', width=760, hsize=44)
        self.labels = [text_sprite(t, 'g', 20, 600, (190, 210, 200)) for t in ('Laptop · Priya', 'Tablet · Lakshmi Agencies', 'Phone · a kirana')]
        self.pushes = [('detect', 400), ('verify', 380), ('offer', 300)]

    def layout(self, u):
        """each device's (x, y, scale, alpha): the laptop alone and large, then three in a row"""
        p = ease_in_out((u - self.t_back) / 1.0)
        lx, ly, ls = 330 + (60 - 330) * p, 186 + (300 - 186) * p, 1.16 + (0.70 - 1.16) * p
        tin = fm_spring(u - self.t_back - 0.25, 170, 22) if u > self.t_back + 0.25 else 0
        pin = fm_spring(u - self.t_back - 0.4, 170, 22) if u > self.t_back + 0.4 else 0
        # the tablet and the phone slide in from the right as the laptop makes room for them, never over it
        tx = max(900 + 1060 * (1 - tin), lx + self.lap.sw * ls + 36)
        px = max(1500 + 560 * (1 - pin), tx + self.tab.sw * 0.52 + 36)
        tab = (tx, 236, 0.52, clamp((u - self.t_back - 0.25) / 0.12))
        ph = (px, 196, 0.66, clamp((u - self.t_back - 0.4) / 0.12))
        return (lx, ly, ls, 1.0), tab, ph

    def draw(self, f, u, L=None):
        f[:] = studio()
        app = ease_in_out((u - self.t_click - 0.25) / 0.45)
        (lx, ly, ls, la), tab, ph = self.layout(u)
        self.lap.draw(f, u, lx, ly, ls, la, app=app)
        for dev, (x, y, s, a) in ((self.tab, tab), (self.phone, ph)):
            dev.draw(f, u, x, y, s, a)
        # the install prompt, under the laptop's bar, and the pointer that takes it
        if self.t_offer <= u < self.t_click + 0.35:
            sp = fm_spring(u - self.t_offer, 300, 24)
            da = clamp((u - self.t_offer) / 0.2) * (1 - ramp(u, self.t_click + 0.1, self.t_click + 0.35))
            dw = self.dialog.shape[1]
            dx = lx + (self.lap.sw * ls) / 2 - dw / 2 + 60
            dy = ly + 8
            blit(f, self.dialog, dx + dw / 2, dy + 10 * (1 - sp), da, scale=0.96 + 0.04 * sp, ox=dw / 2, oy=0)
            nx, ny = dx + dw * (824 - 449) / 448, dy + self.dialog.shape[0] * (324 - 42) / 320   # its Next button
            p = ease_in_out((u - self.t_offer - 0.5) / max(0.2, self.t_click - self.t_offer - 0.6))
            sx, sy = dx - 120, dy + 420
            px, py = sx + (nx - sx) * p, sy + (ny - sy) * p
            if u >= self.t_click:
                q = (u - self.t_click) / 0.35
                rr = 6 + 22 * ease_out(q)
                ring(f, px - rr, py - rr, px + rr, py + rr, rr, 1.0, 0.8 * (1 - q), color=(52, 211, 128), width=2.4, glow=False)
            blit(f, self.ptr, px - 3, py - 2, da)
        # the heading, once the three are in a row
        ha = clamp((u - self.t_back - 0.55) / 0.4)          # once the laptop has drawn back from under it
        blit(f, self.head, 64, 60 + 10 * (1 - ease_out((u - self.t_back - 0.55) / 0.5)), ha)
        # each device's name under it
        for i, ((x, y, s, a), dev) in enumerate(zip(((lx, ly, ls, la), tab, ph), (self.lap, self.tab, self.phone))):
            if u < self.t_back + 0.5: continue
            lab = self.labels[i]
            blit(f, lab, x + dev.sw * s / 2 - lab.shape[1] / 2, y + dev.sh * s + (14 if i == 0 else 30), a * clamp((u - self.t_back - 0.6) / 0.3))
        # the app's own alerts, landing on all three
        for i, ((x, y, s, a), dev, (key, w)) in enumerate(zip(((lx, ly, ls, la), tab, ph), (self.lap, self.tab, self.phone), self.pushes)):
            t0 = self.t_push + 0.18 * i
            if u < t0: continue
            spr = push_sprite(key, int(min(w, dev.sw * s - 16)))
            sp = fm_spring(u - t0, 260, 20)
            pa = clamp((u - t0) / 0.2) * a
            blit(f, spr, x + dev.sw * s / 2 - spr.shape[1] / 2, y + 8 - 50 * (1 - sp), pa)


def _unring(rec, dev, t_clean, t0, t1, box):
    """the journey stage's own highlight ring (and its ripple) painted out of a recording over [t0, t1]: inside box, every
    green pixel of the stage's takes the clean frame's (from t_clean, just before the ring); the pointer, black and
    white, is kept"""
    x0, y0, x1, y1 = box
    clean = {}
    def fn(fr, t):
        if 'f' not in clean: clean['f'] = FrameSource(REC[rec], DEV[dev]).get(t_clean).copy()
        c = clean['f']
        sub = fr[y0:y1, x0:x1].astype(np.int16)
        g = ((sub[..., 1] > sub[..., 2] + 25) & (sub[..., 1] > sub[..., 0] + 8)).astype(np.uint8)
        g = cv2.dilate(g, np.ones((3, 3), np.uint8)).astype(bool)
        out = fr.copy(); out[y0:y1, x0:x1][g] = c[y0:y1, x0:x1][g]
        return out
    kit.RETOUCH.setdefault((str(REC[rec]), tuple(DEV[dev])), []).append((t0, t1, fn))


# the stage ringed the offer's price on the kirana's phone (246.0 to 246.6) inside the film's own ring round the offer
_unring('mango', 'H', 245.70, 245.74, 246.64, (70, 336, 300, 456))


POINTER_TPL = HERE / 'build' / 'pointer-template.png'   # the journey stage's own pointer, cut from a recording


def unpoint(img, thresh=0.035):
    """a recording's still with the journey stage's own pointer painted out (it is drawn on every screen, and a still
    must not carry one while the film draws its own): found by its template, its dark pixels and their soft shadow
    filled from round them"""
    tpl = cv2.imread(str(POINTER_TPL), cv2.IMREAD_GRAYSCALE)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    r = cv2.matchTemplate(g, tpl, cv2.TM_SQDIFF_NORMED)
    mn, _, (x, y), _ = cv2.minMaxLoc(r)
    if mn > thresh: return img
    h, w = tpl.shape
    # the pointer's own shape (the template's dark arrow), grown to take its white edge and soft shadow: never the text
    # round it
    arrow = (tpl < 110).astype(np.uint8) * 255
    arrow = np.maximum(arrow, np.roll(np.roll(arrow, 2, 0), 2, 1))          # its shadow falls down and to the right
    arrow = cv2.dilate(arrow, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    m = np.zeros(g.shape, np.uint8)
    m[y:y + h, x:x + w] = arrow[:min(h, g.shape[0] - y), :min(w, g.shape[1] - x)]
    return cv2.inpaint(img, m, 4, cv2.INPAINT_TELEA)


# ---------------------------------------------------------------- 6 · how the swing adds up, batch by batch

# the inks of the app's own bridge in the dark theme (SC-149's, validated with the dataviz script there)
GAIN, LOSS, PLAN = (52, 165, 113), (224, 102, 44), (64, 84, 76)


@lru_cache(maxsize=None)
def hatch_patch(w, h, rgb):
    """a hatched bar (what destroying would have cost that nobody paid), as the app draws it"""
    S = 3
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=6 * S, fill=tuple(int(c * 0.55) for c in rgb) + (230,), outline=tuple(rgb) + (255,), width=int(2 * S))
    m = Image.new('L', (w * S, h * S), 0); dm = ImageDraw.Draw(m)
    for x in range(-h * S, w * S, 9 * S):
        dm.line([x, h * S, x + h * S, 0], fill=255, width=int(2.4 * S))
    mask = Image.new('L', (w * S, h * S), 0)
    x1, y1 = max(2 * S, w * S - 3 * S), max(2 * S, h * S - 3 * S)          # a bar only a few px tall as it starts to grow
    ImageDraw.Draw(mask).rounded_rectangle([2 * S, 2 * S, x1, y1], radius=max(0, min(5 * S, (y1 - 2 * S) // 2, (x1 - 2 * S) // 2)), fill=255)
    stripes = Image.new('RGBA', (w * S, h * S), tuple(rgb) + (255,))
    from PIL import ImageChops
    im.paste(stripes, (0, 0), ImageChops.multiply(m, mask))
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class SwingResult:
    """A batch's result as the app works it out (How the swing adds up): the pack and what it recovered, then the bridge
    from what the bin would have cost to the P&L with the plan, bar by bar, each landing with its figure, and the swing
    between them; beside it, the app's own sheet as Priya opened it. bars: [(label, value ₹, kind)] with kind 'bin',
    'gain', 'loss', 'saved' or 'plan'; t0: when the bars start; every: their spacing."""
    def __init__(self, u0, u1, kicker, pack, ref, got, swing, bars, facts, fact_at, sheet, bg=None, t0=1.0, every=0.42):
        self.u0, self.u1, self.ref, self.got, self.swing, self.bars = u0, u1, ref, got, swing, bars
        self.facts, self.fact_at, self.bg, self.t0, self.every = facts, fact_at, bg, t0, every
        self.title = words_sprite(kicker=kicker, width=1400)
        self.ps = pack_sprite(pack, 200)
        self.pglow, self.ppad = glow_sprite(self.ps, 22, 0.5, (52, 211, 128))
        self.dust = fx.Dust(n=100, seed=2075, strength=0.4)
        rec, t_sheet = sheet
        img = unpoint(FrameSource(REC[rec], DEV['P']).get(t_sheet))
        self.sheet = img[0:400, 636:1078]          # the sheet's own head and bridge, on Priya's laptop
        self.sheet_cap = text_sprite('In the app · How the swing adds up', 'g', 18, 600, (170, 196, 182))
        # the bridge's geometry
        self.cx0, self.cw, self.gap = 760, 132, 46
        lo = min(min(0, sum(v for _, v, k in bars[:i + 1] if k != 'plan')) for i in range(len(bars)))
        self.y0, self.k = 250, 470 / max(1, -lo)      # ₹0 at y0, px a rupee
        self.lab = {}

    def ylv(self, v): return self.y0 - v * self.k

    def draw(self, f, u, L=None):
        if self.bg is not None: f[:] = self.bg(u) if callable(self.bg) else self.bg
        else: f[:] = studio()
        f *= fx.vignette(0.5)
        self.dust.draw(f, u, 0.7)
        a = fade(u, self.u0, self.u1, 0.4, 0.4)
        if a <= 0: return
        e0 = ease_out((u - self.u0) / 0.7)
        blit(f, self.title, 110, 64 + 10 * (1 - e0), a)
        # the pack and what it recovered
        bob = 5 * math.sin((u - self.u0) * 1.4)
        px, py = 104, 132 + bob + 16 * (1 - e0)
        blit(f, self.pglow, px - self.ppad, py - self.ppad, a * 0.8)
        blit(f, self.ps, px, py, a)
        for j, part in enumerate(self.ref.split(' · ')):
            blit(f, text_sprite(part, 'g', 22 if j else 24, 520 if j else 680, (190, 210, 200) if j else (236, 243, 239)), 318, 196 + j * 32, a)
        p = ease_out((u - self.u0 - 0.3) / 1.3)
        blit(f, text_sprite(money(self.got * p), 'b', 92, 780, (52, 211, 128)), 104, 352, a)
        blit(f, text_sprite('recovered for Munchly', 'g', 24, 520, (190, 210, 200)), 112, 470, a * clamp((u - self.u0 - 0.5) / 0.4))
        # the app's own sheet, as Priya opened it
        sa = a * clamp((u - self.u0 - 0.6) / 0.4)
        if sa > 0:
            sh = self.sheet.astype(np.float32) / 255
            s = 0.74; h_, w_ = int(sh.shape[0] * s), int(sh.shape[1] * s)
            sx, sy = 104, 560 + 12 * (1 - ease_out((u - self.u0 - 0.6) / 0.5))
            shadow(f, sx, sy, sx + w_, sy + h_, 14, alpha=0.55 * sa)
            sm = cv2.resize(sh, (w_, h_), interpolation=cv2.INTER_AREA)
            ix0, iy0, m = rrect_alpha(sx, sy, sx + w_, sy + h_, 12, pad=0)
            over(f, int(sx), int(sy), sm, m[:h_, :w_] * sa)
            blit(f, self.sheet_cap, sx, sy + h_ + 12, sa)
        # the bridge, bar by bar
        run = 0.0
        prev_end = None
        for i, (label, v, kind) in enumerate(self.bars):
            ti = self.u0 + self.t0 + i * self.every
            if kind == 'plan': top, bot = 0.0, v
            else: top, bot = run, run + v
            if kind != 'plan': run += v
            x = self.cx0 + i * (self.cw + self.gap)
            if u >= ti:
                g = ease_out((u - ti) / 0.45)
                y_from = self.ylv(top)
                y_to = y_from + (self.ylv(bot) - y_from) * g
                ya, yb = min(y_from, y_to), max(y_from, y_to)
                if yb - ya < 4: yb = ya + 4
                rgb = {'bin': LOSS, 'gain': GAIN, 'loss': LOSS, 'saved': GAIN, 'plan': PLAN}[kind]
                if kind == 'saved':
                    hp = hatch_patch(self.cw, max(4, int(round(yb - ya))), GAIN)
                    blit(f, hp, x, ya, a)
                else:
                    ix0, iy0, m = rrect_alpha(x, ya, x + self.cw, yb, 6, pad=1)
                    over(f, ix0, iy0, col(rgb), m * a)
                # its figure, once it has landed
                fa = a * clamp((u - ti - 0.3) / 0.3)
                if fa > 0:
                    sgn = '+' if v > 0 else ''
                    txt = (sgn + money(v)) if kind not in ('bin', 'plan') else money(v)
                    tc = (240, 246, 242) if kind in ('gain', 'saved') else ((247, 140, 100) if kind in ('bin', 'loss') else (220, 232, 226))
                    ts = text_sprite(txt, 'g', 24, 700, tc)
                    if kind == 'bin':   # the bin's own figure inside its bar's foot, clear of the names under the chart
                        ts = text_sprite(txt, 'g', 24, 760, (255, 240, 232)); ty = yb - 44
                    else:
                        ty = (ya - 36) if (v > 0 or kind == 'plan') else (yb + 8)
                    blit(f, ts, x + self.cw / 2 - ts.shape[1] / 2, ty, fa)
                # the dotted level from the bar before
                if prev_end is not None:
                    lx0 = x - self.gap; yl = self.ylv(top) if kind != 'plan' else self.ylv(prev_end)
                    for dx in range(0, self.gap, 8):
                        line(f, (lx0 + dx, yl), (lx0 + dx + 4, yl), (150, 172, 160), alpha=0.6 * a * g, width=1.4, dot=False)
            prev_end = run
            # the bar's name under the chart
            la = a * clamp((u - self.u0 - 0.5) / 0.4)
            nm = self.lab.get(label)
            if nm is None: nm = self.lab[label] = node_label(label.split('|')[0], label.split('|')[1] if '|' in label else '', tsize=20, ssize=16, width=self.cw + 30)
            blit(f, nm, x + self.cw / 2 - nm.shape[1] / 2, self.ylv(min(0, min(sum(b[1] for b in self.bars[:j + 1] if b[2] != 'plan') for j in range(len(self.bars))))) + 24, la)
        # ₹0
        za = a * clamp((u - self.u0 - 0.6) / 0.4)
        line(f, (self.cx0 - 20, self.y0), (self.cx0 + len(self.bars) * (self.cw + self.gap) - self.gap + 20, self.y0), (110, 130, 120), alpha=0.5 * za, width=1.2, dot=False)
        blit(f, text_sprite('₹0', 'g', 18, 600, (150, 172, 160)), self.cx0 - 64, self.y0 - 13, za)
        # the swing: the plan's P&L less the bin's, bracketed between the first bar's foot and the last's
        ts = self.u0 + self.t0 + len(self.bars) * self.every + 0.2
        if u >= ts:
            g = ease_out((u - ts) / 0.5)
            xb = self.cx0 + len(self.bars) * (self.cw + self.gap) - self.gap + 34
            y_bin = self.ylv(self.bars[0][1]); y_plan = self.ylv(self.bars[-1][1])
            yb_ = y_bin + (y_plan - y_bin) * g
            line(f, (xb, y_bin), (xb, yb_), (52, 211, 128), alpha=a, width=3.2, dot=False)
            line(f, (xb - 10, y_bin), (xb + 2, y_bin), (52, 211, 128), alpha=a, width=3.2, dot=False)
            if g > 0.98: line(f, (xb - 10, y_plan), (xb + 2, y_plan), (52, 211, 128), alpha=a, width=3.2, dot=False)
            sw = node_label(money(self.swing) + ' swing', 'better than destroying it', align='left', tsize=30, ssize=18, rgb=(52, 211, 128))
            blit(f, sw, xb - sw.shape[1] - 10, (y_bin + y_plan) / 2 - sw.shape[0] / 2 + 10 * (1 - g), a * clamp((u - ts - 0.2) / 0.35))
        # the proof points, in a row
        xs = 760
        for i, (txt, kind) in enumerate(self.facts):
            t0 = self.fact_at[i]
            fa = a * clamp((u - t0) / 0.35)
            chip = chip_sprite(txt, kind, 21)
            if fa > 0:
                e = ease_out((u - t0) / 0.5)
                blit(f, chip, xs, 884 + 10 * (1 - e), fa)       # under the bars' names, clear of a service named in the foot
            xs += chip.shape[1] + 16


# ---------------------------------------------------------------- 7 · what comes next, and the guided demo to try

GREET = HERE / 'build' / 'greet'
DEMO = HERE / 'build' / 'demo-landing'


@lru_cache(maxsize=None)
def greet_sprite(code, height=58):
    im = cv2.imread(str(GREET / f'{code}.png'), cv2.IMREAD_UNCHANGED)
    k = height / im.shape[0] * 1.0
    im = cv2.resize(im, (round(im.shape[1] * k), round(im.shape[0] * k)), interpolation=cv2.INTER_AREA)
    a = im[..., 3:4].astype(np.float32) / 255
    return np.ascontiguousarray(np.dstack([im[..., :3].astype(np.float32) / 255 * a, a]))


@lru_cache(maxsize=None)
def road_card(title, sub, w=500, h=330):
    """a roadmap card: dark glass with a bright edge, its title and line (its picture drawn over it live)"""
    S = 2
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=24 * S, fill=(10, 24, 18, 236), outline=(63, 176, 123, 170), width=int(1.6 * S))
    draw_text(d, (30 * S, (h - 104) * S), title, 'b', 34 * S, (244, 248, 245, 255), 760)
    for i, ln in enumerate(wrap(sub, 'g', 20, 460, w - 60)):
        draw_text(d, (30 * S, (h - 58 + i * 26) * S), ln, 'g', 20 * S, (170, 196, 182, 255), 460)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def chat_bubble(text, w=380, mine=False):
    S = 2
    lines = wrap(text, 'g', 19, 460, w - 46)
    h = 22 + len(lines) * 25 + 16
    im = Image.new('RGBA', ((w + 12) * S, (h + 6) * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fill = (37, 99, 74, 255) if mine else (236, 243, 239, 255)
    ink = (240, 246, 242, 255) if mine else (24, 32, 28, 255)
    x0 = 0 if not mine else 12
    d.rounded_rectangle([x0 * S, 0, (x0 + w) * S, h * S], radius=16 * S, fill=fill)
    tail = [(x0 + 4, h - 16), (x0 - 6 if not mine else x0 + w + 6, h + 4), (x0 + 22, h - 4)] if not mine else [(x0 + w - 4, h - 16), (x0 + w + 8, h + 4), (x0 + w - 22, h - 4)]
    d.polygon([(px * S, py * S) for px, py in tail], fill=fill)
    for i, ln in enumerate(lines):
        draw_text(d, ((x0 + 22) * S, (14 + i * 25) * S), ln, 'g', 19 * S, ink, 460)
    return to_sprite(im.resize((w + 12, h + 6), Image.LANCZOS))


@lru_cache(maxsize=None)
def phone_outline(w, h, label):
    S = 3
    im = Image.new('RGBA', (w * S, (h + 40) * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([2 * S, 2 * S, (w - 2) * S, (h - 2) * S], radius=22 * S, outline=(115, 201, 157, 255), width=int(3 * S), fill=(12, 30, 22, 255))
    d.rounded_rectangle([(w / 2 - 18) * S, 10 * S, (w / 2 + 18) * S, 18 * S], radius=4 * S, fill=(115, 201, 157, 160))
    mk = Image.open(HERE / 'build' / 'mark.png').convert('RGBA').crop((16, 16, 496, 496)).resize((int(w * 0.42) * S, int(w * 0.42) * S), Image.LANCZOS)
    im.paste(mk, (int((w - w * 0.42) / 2 * S), int((h * 0.42 - w * 0.21) * S)), mk)
    tw = text_w(label, 'g', 22, 680)
    draw_text(d, ((w - tw) / 2 * S, (h + 8) * S), label, 'g', 22 * S, (236, 243, 239, 255), 680)
    return to_sprite(im.resize((w, h + 40), Image.LANCZOS))


@lru_cache(maxsize=None)
def qr_sprite(size, data_png='qr-demo.png'):
    """the guided demo's address as a QR code, on white with its quiet zone, its modules crisp"""
    m = cv2.imread(str(HERE / 'build' / data_png), cv2.IMREAD_GRAYSCALE)
    n = m.shape[0] + 8
    k = size // n
    s = k * n
    img = np.full((s, s, 3), 255, np.uint8)
    big = cv2.resize(m, (m.shape[1] * k, m.shape[0] * k), interpolation=cv2.INTER_NEAREST)
    img[4 * k:4 * k + big.shape[0], 4 * k:4 * k + big.shape[1]] = big[..., None]
    pm = Image.fromarray(img[..., ::-1]).convert('RGBA')
    mask = Image.new('L', (s, s), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=max(6, k * 2), fill=255)
    pm.putalpha(mask)
    return to_sprite(pm)


class NextScene:
    """What comes next, then the guided demo to try. The roadmap (f01): three cards rise as the voice names them,
    each alive: WhatsApp (a kirana's offer arriving as a chat, and the order back), more Indian languages ('hello' in
    seven scripts in turn), native iOS and Android apps (two phones, the app's icon on each). Then (d01) the guided
    demo's own landing page swings in as a window, the pointer presses Play the whole route and the demo sets off,
    beside its address, big, and its QR code. t: the local times of the beats."""
    LANGS = ['hi', 'ta', 'te', 'bn', 'kn', 'gu', 'mr']

    def __init__(self, L, t_whats, t_lang, t_native, t_demo, t_out, t_kick=None):
        self.L, self.t = L, dict(whats=t_whats, lang=t_lang, native=t_native, demo=t_demo, out=t_out,
                                 kick=t_whats - 0.3 if t_kick is None else t_kick)
        self.kick = words_sprite(kicker='NEXT ON OUR ROADMAP', head='What comes next.', width=900, hsize=56)
        self.cards = [road_card('WhatsApp', 'Offers and orders where the kiranas already chat.'),
                      road_card('More Indian languages', 'Every offer in the shopkeeper’s own language.'),
                      road_card('Native iOS and Android', 'Apps for every phone, beside the web app.')]
        self.b1 = chat_bubble('Munchly Mango Drink: 10 packets, 2 free. Best before 24 Oct. Order?')
        self.b2 = chat_bubble('Haan, 24 bhej do', 200, mine=True)
        self.ios, self.andr = phone_outline(92, 160, 'iOS'), phone_outline(92, 160, 'Android')
        self.seq = Seqs([DEMO], scale=0.5)        # the landing page at 1600 x 900
        import json as _j
        self.moves = _j.loads((DEMO / 'moves.json').read_text())
        self.head = words_sprite(kicker='SEE IT FOR YOURSELF', head='Try the guided demo.', width=640, hsize=56)
        self.url = text_sprite('smartclearance-demo.web.app', 'g', 40, 700, (52, 211, 128))
        self.qr = qr_sprite(232)
        self.qcap = text_sprite('Scan to open it', 'g', 20, 560, (170, 196, 182))
        self.ptr = pointer_sprite(30)
        self.dust = fx.Dust(n=90, seed=2077, strength=0.35)

    def draw(self, f, u, L=None):
        f[:] = studio()
        self.dust.draw(f, u, 0.7)
        t = self.t
        out = ease_in_out((u - t['out']) / 0.6)     # the roadmap gives way to the demo
        # -------- the roadmap
        ra = 1 - out
        if ra > 0.002:
            blit(f, self.kick, 120, 196 - 40 * out, ra * clamp((u - t['kick']) / 0.4))   # as the voice says it
            for i, (key, card) in enumerate(zip(('whats', 'lang', 'native'), self.cards)):
                t0 = t[key]
                if u < t0: continue
                sp = fm_spring(u - t0, 200, 20)
                x, y = 120 + i * 560, 400 + 60 * (1 - sp) - 120 * out
                a = clamp((u - t0) / 0.3) * ra
                blit(f, card, x, y, a)
                cu = u - t0
                if key == 'whats':      # the offer arrives as a chat, and the shop answers
                    blit(f, self.b1, x + 26, y + 26 + 10 * (1 - ease_out(cu / 0.4)), a * clamp((cu - 0.2) / 0.3))
                    if cu > 1.1: blit(f, self.b2, x + 500 - 26 - self.b2.shape[1], y + 128 + 8 * (1 - ease_out((cu - 1.1) / 0.4)), a * clamp((cu - 1.1) / 0.3))
                elif key == 'lang':     # hello, in seven scripts in turn
                    k = int(cu / 0.42) % len(self.LANGS); q = (cu / 0.42) % 1.0
                    g = greet_sprite(self.LANGS[k], 62)
                    ga = a * min(clamp(q / 0.25), 1 - clamp((q - 0.75) / 0.25)) if cu > 0.42 else a * clamp(q / 0.25)
                    blit(f, g, x + 250 - g.shape[1] / 2, y + 70 + 8 * (1 - ease_out(q / 0.3)), ga)
                else:                   # two phones, the app's icon on each
                    s1 = fm_spring(cu - 0.15, 260, 18) if cu > 0.15 else 0
                    s2 = fm_spring(cu - 0.32, 260, 18) if cu > 0.32 else 0
                    blit(f, self.ios, x + 150, y + 16 + 30 * (1 - s1), a * clamp((cu - 0.15) / 0.25))
                    blit(f, self.andr, x + 262, y + 16 + 30 * (1 - s2), a * clamp((cu - 0.32) / 0.25))
        # -------- the guided demo
        if u >= t['demo'] - 0.05:
            du = u - t['demo']
            k = int(clamp(30 + du * FPS, 0, len(self.seq) - 1))          # the landing at rest, then the press, and the demo sets off
            img = self.seq.get_index(k)
            s = 0.62; w_, h_ = 1600 * s, 900 * s
            sp = fm_spring(du, 170, 22)
            x0, y0 = 860 + 260 * (1 - sp), 230
            ang = 1 - sp
            a = clamp(du / 0.3)
            shadow(f, x0, y0 - BAR, x0 + w_, y0 + h_, 16, alpha=0.6 * a)
            sm = cv2.resize(img, (int(w_), int(h_)), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            ix0, iy0, m = rrect_alpha(x0, y0, x0 + int(w_), y0 + int(h_), 14, pad=0, top_r=0.01)
            over(f, int(x0), int(y0), sm, m[:sm.shape[0], :sm.shape[1]] * a)
            blit(f, bar_sprite(int(w_), 'smartclearance-demo.web.app', BAR, 16), x0, y0 - BAR, a)
            # the pointer: in from the left, on the button by the hover, and the press
            tx, ty = self.moves['target']
            px, py = x0 + tx * s, y0 + ty * s
            fh, fc = self.moves['hover'], self.moves['click']
            kk = 30 + du * FPS
            q = ease_in_out((kk - (fh - 20)) / 20)
            sx, sy = x0 + 120, y0 + h_ - 60
            cx, cy = sx + (px - sx) * q, sy + (py - sy) * q
            if kk >= fc:
                qq = (kk - fc) / 9
                if qq < 1:
                    rr = 6 + 22 * ease_out(qq)
                    ring(f, cx - rr, cy - rr, cx + rr, cy + rr, rr, 1.0, 0.8 * (1 - qq), color=(52, 211, 128), width=2.4, glow=False)
            if kk < fc + 30: blit(f, self.ptr, cx - 3, cy - 2, a * (1 - clamp((kk - fc - 20) / 10)))
            # its address, big, and its QR code
            ha = clamp((du - 0.2) / 0.4)
            e = ease_out((du - 0.2) / 0.5)
            blit(f, self.head, 120, 236 + 12 * (1 - e), ha)
            blit(f, self.url, 120, 420 + 12 * (1 - e), clamp((du - 0.45) / 0.4))
            qa = clamp((du - 0.8) / 0.4)
            if qa > 0:
                sq = fm_spring(du - 0.8, 260, 20)
                shadow(f, 120, 520, 120 + self.qr.shape[1], 520 + self.qr.shape[0], 14, alpha=0.5 * qa)
                blit(f, self.qr, 120 + self.qr.shape[1] / 2, 520 + self.qr.shape[0] / 2, qa, scale=0.8 + 0.2 * sq, ox=self.qr.shape[1] / 2, oy=self.qr.shape[0] / 2)
                blit(f, self.qcap, 120, 520 + self.qr.shape[0] + 14, qa)


# ---------------------------------------------------------------- 8 · the close, every line on one edge

def ink_left(spr, thresh=0.35):
    """how far into a sprite its first ink starts (px): so lines of different sizes can share one optical edge"""
    cols = np.where(spr[..., 3].max(axis=0) > thresh)[0]
    return float(cols[0]) if len(cols) else 0.0


class EndCard5:
    """The close (cut 5): the mark draws its route; the name slides out from behind it; the line lands word by word with
    the voice; then the four addresses and the stack. Everything right of the mark hangs from one edge (X), measured on
    each line's own ink, so the name, the line, the addresses' locks and the stack's first letter stand in one column."""
    X = 560

    def __init__(self, L, words):
        self.L = L
        self.mark = MarkDraw(420, 372, 176, 0.25)
        self.name = words_sprite(head='Smart-Clearance', width=1100, hsize=96)
        self.name_dx = ink_left(self.name)
        self.line = Kinetic(0, 470, [words], size=40, kind='g', wght=620, rgb=(200, 222, 210))
        dx = ink_left(text_sprite(words[0][0], 'g', 40, 620, (200, 222, 210)))
        for i, (s, x, y, t) in enumerate(self.line.words):
            self.line.words[i] = (s, x + self.X - dx, y, t)
        self.urls = [url_line(*x) for x in [('smartclearance.web.app', 'the platform'), ('smartclearance-console.web.app', 'the console'),
                                             ('munchly-smartclearance.web.app', "a client's workspace"), ('smartclearance-demo.web.app', 'the guided demo')]]
        self.url_dx = ink_left(self.urls[0])
        self.foot = words_sprite(kicker='BUILT ON GEMINI · GOOGLE ADK · CLOUD RUN · FIREBASE · GOOGLE AI HACKATHON 2026', width=1500)
        self.foot_dx = ink_left(self.foot)
        self.bg = None

    def draw(self, f, u, L=None):
        if self.bg is None:
            o = Orbit().frame(700)
            self.bg = cv2.GaussianBlur(o.astype(np.float32) / 255, (0, 0), 9) * 0.3 + studio() * 0.7
        f[:] = _zoom(self.bg, 1 + 0.05 * ease_in_out(u / max(1e-3, self.L)), (W / 2, H / 2))
        self.mark.draw(f, u)
        e = ease_out((u - 0.85) / 0.7)
        if e > 0:
            spr = self.name; h, w = spr.shape[:2]
            x_end = self.X - self.name_dx; x = 420 + (x_end - 420) * e
            vis = int(clamp(x + w - 510, 0, w))        # nothing shows left of the mark's right edge
            cut = w - vis
            if vis > 0: blit(f, spr[:, cut:], x + cut, 304, clamp((u - 0.85) / 0.3))
        self.line.draw(f, u)
        for i, s_ in enumerate(self.urls):
            t0 = 2.9 + i * 0.16
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, self.X - self.url_dx + (i % 2) * 470, 590 + (i // 2) * 76 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
        a = clamp((u - 3.6) / 0.6)
        if a > 0: blit(f, self.foot, self.X - self.foot_dx, 774, a)


# ---------------------------------------------------------------- the pointer on a window, and the stack, named in passing

class Pointer:
    """the film's own pointer on a window whose recording has none (a capture): keys [(source s, x, y, click)] in the
    screen's own pixels; it glides from one to the next (arriving at each key's time) and ripples on a click"""
    def __init__(self, win, keys, u0=0.0, u1=None):
        self.win, self.keys, self.u0, self.u1 = win, keys, u0, u1
        self.spr = pointer_sprite(28)
    def draw(self, f, u, L):
        u1 = self.u1 if self.u1 is not None else L
        if u < self.u0 or u > u1: return
        i, t, _ = self.win.src_time(u, L)
        ks = self.keys
        if t <= ks[0][0]: x, y = ks[0][1], ks[0][2]
        else:
            x, y = ks[-1][1], ks[-1][2]
            for (ta, xa, ya, _), (tb, xb, yb, _) in zip(ks, ks[1:]):
                if t <= tb:
                    p = ease_in_out((t - max(ta, tb - 0.7)) / max(1e-3, min(0.7, tb - ta)))
                    x, y = xa + (xb - xa) * p, ya + (yb - ya) * p
                    break
        (ox0, oy0, ox1, oy1), _, a = self.win.to_out(u, L, (x, y, 0, 0))
        a *= fade(u, self.u0, u1, 0.3, 0.3)
        for (tk, xk, yk, click) in ks:
            if click and 0 <= t - tk < 0.4:
                q = (t - tk) / 0.4; rr = 5 + 18 * ease_out(q)
                ring(f, ox0 - rr, oy0 - rr, ox0 + rr, oy0 + rr, rr, 1.0, 0.8 * (1 - q) * a, color=(52, 211, 128), width=2.2, glow=False)
        blit(f, self.spr, ox0 - 3, oy0 - 2, a)


@lru_cache(maxsize=None)
def tech_sprite(name, what):
    """a Google Cloud service named in passing: a small glass pill, the service's name and what it does here"""
    S = 2
    tw = text_w(name, 'g', 17, 700) + text_w('  ·  ' + what, 'g', 17, 460)
    w, h = int(tw + 54), 36
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=(8, 20, 14, 220), outline=(115, 201, 157, 140), width=int(1.2 * S))
    # a small cloud
    cx, cy = 22, h / 2 + 1
    for (dx, dy, r) in ((-5, 1, 5), (1, -3, 6.5), (7, 1, 5)):
        d.ellipse([(cx + dx - r) * S, (cy + dy - r) * S, (cx + dx + r) * S, (cy + dy + r) * S], fill=(115, 201, 157, 255))
    d.rectangle([(cx - 10) * S, (cy + 1) * S, (cx + 12) * S, (cy + 6) * S], fill=(115, 201, 157, 255))
    x = draw_text(d, (40 * S, (h / 2 - 17 * 0.66) * S), name, 'g', 17 * S, (236, 243, 239, 255), 700)
    draw_text(d, (x, (h / 2 - 17 * 0.66) * S), '  ·  ' + what, 'g', 17 * S, (170, 196, 182, 255), 460)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class TechTag:
    """a Google Cloud service named as the voice names it, in the frame's foot, right: it rises in and keeps still"""
    def __init__(self, name, what, u0, u1, x=None, y=None):
        self.spr, self.u0, self.u1 = tech_sprite(name, what), u0, u1
        self.x = x if x is not None else W - 48 - self.spr.shape[1]
        self.y = y if y is not None else H - 74
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        blit(f, self.spr, self.x, self.y + 10 * (1 - ease_out((u - self.u0) / 0.5)), a)
