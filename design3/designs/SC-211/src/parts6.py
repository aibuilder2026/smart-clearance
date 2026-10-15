"""SC-208 cut 6: the new scenes, on the maintainer's notes on cut 5. Each part draws itself into a float BGR frame at a
local time u (seconds), as the earlier parts do.

- AgentHead: the agent at work where the stop tracker stood: its orb (the agent's own icon, a turning ring, a pulse
  while it works), its name and stop, and its tool calls typed one by one, as the app's own feed records them.
- PhonePop: a pop-up springing out of the phone or tablet a person holds with its back to the camera: the push it got,
  or what they are doing.
- StampedGodown and WriteOffTally: the opening's write-off as the godown's own cartons stamped WRITTEN OFF one after
  another, the Mango Drink's on the right of the aisle (their labels tracked by cartons.py), and the rupees adding up.
- CostStack: what destroying the Mango Drink's 1,580 packs costs, line by line (money.js writeOff), the input GST
  credit taken back as the voice says it.
- MunchlyCast: Munchly's supply chain (cut 5's map) with the people the film follows, each at their post, by name and
  role.
- SplitWhy: what the Valuer and the Router decide the split from: the batch's sales history (BigQuery) and Munchly's
  own rules (the console), each worked through, feeding the split."""
import json, math
from functools import lru_cache
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from kit import *
import kit
from parts import words_sprite, card_sprite, chip_sprite, studio, money, avatar_img, PEOPLE, push_sprite
from parts3 import text_sprite, pack_sprite, glow_sprite, Footage
from parts4 import ClipBG, _cam, _proj, _glow_line, _dot, fm_spring, ease_in, _zoom
from parts5 import LabelPrint, MunchlyMap, node_label, path_tag
import fx

G, G2, AMBER, RED, MUTED = (52, 211, 128), (63, 176, 123), (247, 192, 74), (229, 92, 74), (160, 186, 172)
MONO = '/System/Library/Fonts/SFNSMono.ttf'
ICONS = HERE / 'build' / 'icons'


def mono_w(text, size):
    return ImageFont.truetype(MONO, size).getlength(text)


@lru_cache(maxsize=None)
def icon_sprite(name, size, rgb=(255, 255, 255)):
    """a Lucide icon (icons.mjs), white strokes recoloured, at `size` px, premultiplied BGRA"""
    im = cv2.imread(str(ICONS / f'{name}.png'), cv2.IMREAD_UNCHANGED)
    im = cv2.resize(im, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    a = im[..., 3:4]
    out = np.zeros_like(im)
    out[..., :3] = np.float32([rgb[2], rgb[1], rgb[0]]) / 255 * a
    out[..., 3:4] = a
    return out


# ---------------------------------------------------------------- the agents at work

STOPS = ['Connect', 'Detect', 'Verify', 'Value', 'Decide', 'Approve', 'Execute', 'Settle', 'Report']
AGENT = {   # name, icon, its stop (0-based), ink
    'data': ('Data', 'database', 0, G), 'watcher': ('Watcher', 'radar', 1, G), 'vision': ('Vision', 'scan-line', 2, G),
    'valuer': ('Valuer', 'scale', 3, G), 'router': ('Router', 'split', 4, G), 'you': ('You', 'hand', 5, AMBER),
    'outreach': ('Outreach', 'send', 6, G), 'lister': ('Lister', 'shopping-bag', 6, G), 'negotiator': ('Negotiator', 'messages-square', 6, G),
    'paperwork': ('Paperwork', 'file-check', 7, G), 'impact': ('Impact', 'leaf', 8, G),
}


# SC-209 cut 7b: the Google model each agent thinks with, as agents/src/sc_agents/agents/*.py set its tier and
# infra/prod/variables.tf names the tiers (gemini-3.1-pro-preview, gemini-3.8-flash); the Watcher runs rules on
# BigQuery's sell-through and calls no model
MODEL = {'data': 'Gemini 3.8 Flash', 'watcher': 'rules on BigQuery', 'vision': 'Gemini 3.8 Flash', 'valuer': 'Gemini 3.1 Pro',
         'router': 'Gemini 3.1 Pro', 'outreach': 'Gemini 3.8 Flash', 'lister': 'Gemini 3.8 Flash', 'negotiator': 'Gemini 3.1 Pro',
         'paperwork': 'Gemini 3.8 Flash', 'impact': 'Gemini 3.8 Flash'}


@lru_cache(maxsize=None)
def agent_label(key, size=21):
    """'VISION · agent · Gemini 3.8 Flash' over 'Verify · stop 3 of 9' and the nine stops, lit to this one"""
    name, _, stop, ink = AGENT[key]
    S = 2; w, h = 620, 62
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x = draw_text(d, (0, 2 * S), name.upper(), 'g', size * S, ink + (255,), 720, 0.14)
    if key == 'you':
        draw_text(d, (x + 12 * S, 5 * S), 'person', 'g', 16 * S, MUTED + (255,), 520, 0.06)
    else:
        x2 = draw_text(d, (x + 12 * S, 5 * S), 'agent ·', 'g', 16 * S, MUTED + (255,), 520, 0.06)
        draw_text(d, (x2 + 8 * S, 5 * S), MODEL[key], 'g', 16 * S, (255, 214, 140, 255) if 'Pro' in MODEL[key] else (170, 236, 200, 255), 680, 0.02)
    sx = draw_text(d, (0, 34 * S), f'{STOPS[stop]} · stop {stop + 1} of 9', 'g', 16 * S, (190, 208, 198, 255), 520)
    x0, cy = sx + 16 * S, (34 + 10) * S
    for i in range(9):
        cx = x0 + i * 15 * S
        if i < 8: d.line([cx + 4 * S, cy, cx + 11 * S, cy], fill=(63, 176, 123, 255) if i < stop else (70, 90, 80, 255), width=int(1.6 * S))
        if i == stop:
            d.ellipse([cx - 5 * S, cy - 5 * S, cx + 5 * S, cy + 5 * S], fill=(AMBER if i == 5 else G) + (255,))
        elif i < stop: d.ellipse([cx - 3.5 * S, cy - 3.5 * S, cx + 3.5 * S, cy + 3.5 * S], fill=(63, 176, 123, 255))
        else: d.ellipse([cx - 3.5 * S, cy - 3.5 * S, cx + 3.5 * S, cy + 3.5 * S], outline=(110, 130, 120, 255), width=int(1.4 * S))
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def call_sprite(fn, result, kind, n_chars=None, width=600, wrap=None):
    """one tool call as the app's feed shows it: '> fn  result', typed to n_chars; ok green, bad coral. Wider than wrap,
    the result goes on a line of its own under the call's name"""
    S = 2; size = 17
    full = f'{fn}  {result}'
    shown = full if n_chars is None else full[:n_chars]
    f = ImageFont.truetype(MONO, size * S)
    two = wrap is not None and 18 + f.getlength(full) / S + 10 > wrap
    need = (18 + max(f.getlength(fn), f.getlength(result)) / S + 10) if two else (18 + f.getlength(full) / S + 10)
    w, h = max(width if not two else 0, int(need)), (56 if two else 30)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((0, 5 * S), '›', font=f, fill=G2 + (255,))
    x = 18 * S
    fn_s = shown[:len(fn)]; rest = shown[len(fn):]
    d.text((x, 5 * S), fn_s, font=f, fill=(226, 236, 230, 255))
    rc = {'ok': (115, 201, 157), 'bad': (240, 140, 120)}.get(kind, (190, 208, 198))
    if two:
        d.text((x, 31 * S), rest.lstrip(), font=f, fill=rc + (255,))
    else:
        d.text((x + f.getlength(fn_s), 5 * S), rest, font=f, fill=rc + (255,))
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def orb_sprite(icon, size, ink):
    """the agent's orb: a deep disc in its ink with the icon in white"""
    S = 3
    im = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    dark = tuple(int(c * 0.32) for c in ink)
    d.ellipse([0, 0, size * S - 1, size * S - 1], fill=dark + (255,), outline=ink + (255,), width=int(2.2 * S))
    spr = to_sprite(im.resize((size, size), Image.LANCZOS))
    ic = icon_sprite(icon, int(size * 0.5))
    o = (size - ic.shape[0]) // 2
    a = ic[..., 3:4]
    spr[o:o + ic.shape[0], o:o + ic.shape[1]] = spr[o:o + ic.shape[0], o:o + ic.shape[1]] * (1 - a) + ic
    return spr


class AgentHead:
    """The agent at work, where the stop tracker stood, then the headline under it, then its tool calls typed one by one.
    beats: [(u, agent key, [(fn, result, kind), ...])]: from u that agent is at work (its orb flips in) and types its
    calls; headline: the line under it (as Words draws it). The orb turns its ring and pulses while a call types."""
    def __init__(self, x, y, u0, u1, beats, headline, hsize=44, width=700, calls_at=None, call_gap=1.0, call_w=None):
        self.x, self.y, self.u0, self.u1, self.beats = x, y, u0, u1, beats
        self.call_w = call_w if call_w is not None else width     # the calls keep to the headline's column
        self.head = words_sprite(head=headline, width=width, hsize=hsize) if headline else None
        self.calls_y = calls_at
        self.call_gap = call_gap

    def beat(self, u):
        k = 0
        for i, b in enumerate(self.beats):
            if u >= b[0]: k = i
        return k

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.4, 0.35)
        if a <= 0: return
        k = self.beat(u); ub, key, calls = self.beats[k]
        name, icon, stop, ink = AGENT[key]
        R = 30; cx, cy = self.x + R, self.y + R
        # the orb flips in for each new agent: shrinks, swaps, springs back
        flip = clamp((u - ub) / 0.18) if k > 0 else 1.0
        sp = fm_spring(u - ub, 320, 18) if k > 0 else fm_spring(u - self.u0, 260, 18)
        sc = 0.55 + 0.45 * sp
        # working: a call is typing
        typing = any(0 <= u - (ub + 0.35 + i * self.call_gap) < 0.9 for i in range(len(calls)))
        pulse = 0.5 + 0.5 * math.sin((u - ub) * 9) if typing else 0.0
        glow = np.zeros((4 * R, 4 * R), np.float32)
        cv2.circle(glow, (2 * R, 2 * R), int(R * 1.05), 1.0, -1)
        glow = cv2.GaussianBlur(glow, (0, 0), R * 0.45) * (0.35 + 0.35 * pulse) * a
        x0, y0 = int(cx - 2 * R), int(cy - 2 * R)
        gs = f[max(0, y0):y0 + 4 * R, max(0, x0):x0 + 4 * R]
        gg = glow[max(0, -y0):max(0, -y0) + gs.shape[0], max(0, -x0):max(0, -x0) + gs.shape[1]]
        gs += gg[..., None] * col(ink) * 0.8
        # the turning ring: dashes round the orb
        rot = (u - self.u0) * (2.6 if typing else 0.9)
        for j in range(14):
            t0 = rot + j * 2 * math.pi / 14
            p0 = (cx + math.cos(t0) * (R + 7) * sc, cy + math.sin(t0) * (R + 7) * sc)
            p1 = (cx + math.cos(t0 + 0.22) * (R + 7) * sc, cy + math.sin(t0 + 0.22) * (R + 7) * sc)
            line(f, p0, p1, ink, alpha=0.75 * a, width=2.2, dot=False)
        orb = orb_sprite(icon, 2 * R, ink)
        blit(f, orb, cx, cy, a, scale=sc, ox=R, oy=R)
        # sparks running into the orb while it works: data in
        if typing:
            for j in range(5):
                ph = ((u - ub) * 1.6 + j / 5) % 1.0
                ang = -0.6 + j * 0.3
                r0 = R + 70 * (1 - ph)
                _dot(f, (cx + math.cos(ang) * r0, cy + math.sin(ang) * r0 * 0.6), 2.6, ink, 0.8 * a * math.sin(ph * math.pi), glow=4)
        lab = agent_label(key)
        la = a * (clamp((u - ub) / 0.25) if k > 0 else 1.0)
        blit(f, lab, self.x + 2 * R + 18, self.y + 2 + 6 * (1 - ease_out(clamp((u - ub) / 0.35))), la)
        if self.head is not None:
            blit(f, self.head, self.x, self.y + 2 * R + 22 + 8 * (1 - ease_out((u - self.u0) / 0.5)), a)
        # the calls, typed one by one under the headline (at most two in view)
        cyy = self.calls_y if self.calls_y is not None else self.y + 2 * R + 22 + (self.head.shape[0] if self.head is not None else 0) + 8
        shown = []
        for i, (fn, res, kind) in enumerate(calls):
            ts = ub + 0.35 + i * self.call_gap
            if u < ts: break
            full = len(f'{fn}  {res}')
            n = int(clamp((u - ts) / 0.55) * full)
            shown.append((call_sprite(fn, res, kind, n if n < full else None, wrap=self.call_w), ts))
        yy = cyy
        for spr, ts in shown[-2:]:
            ca = a * clamp((u - ts) / 0.12)
            blit(f, spr, self.x + 4, yy, ca)
            yy += spr.shape[0]


# ---------------------------------------------------------------- a pop-up out of a device held back to the camera

@lru_cache(maxsize=None)
def action_card(title, body, icon='activity', width=380, ink=G):
    """what a person is doing, as a small glass card: an icon, a line in bold and a line of detail"""
    S = 2; pad = 16
    bl = wrap(body, 'g', 16, 420, width - 2 * pad - 52) if body else []
    h = pad + 26 + len(bl) * 22 + pad
    im = Image.new('RGBA', (width * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, width * S - 1, h * S - 1], radius=18 * S, fill=(245, 248, 246, 246), outline=ink + (200,), width=int(1.6 * S))
    d.ellipse([pad * S, pad * S, (pad + 38) * S, (pad + 38) * S], fill=tuple(int(c * 0.85) for c in ink) + (255,))
    draw_text(d, ((pad + 52) * S, (pad + 1) * S), title, 'g', 19 * S, (16, 28, 22, 255), 700)
    y = pad + 28
    for ln in bl:
        draw_text(d, ((pad + 52) * S, y * S), ln, 'g', 16 * S, (60, 80, 70, 255), 440); y += 22
    spr = to_sprite(im.resize((width, h), Image.LANCZOS))
    ic = icon_sprite(icon, 22)
    o = pad + 8
    a_ = ic[..., 3:4]
    spr[o:o + 22, o:o + 22] = spr[o:o + 22, o:o + 22] * (1 - a_) + ic
    return spr


class PhonePop:
    """A pop-up springing out of a device that someone holds with its back to the camera: a ping where the device is, a
    stem growing out to the side, and on it the push the person got (push key) or what they are doing (an action card).
    at: the device's place in the frame; side: +1 the card to its right, -1 to its left."""
    def __init__(self, at, u0, u1, push=None, card=None, side=1, width=400, rise=-60):
        self.at, self.u0, self.u1, self.side, self.rise = at, u0, u1, side, rise
        self.spr = push_sprite(push, width) if push else card

    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u1 + 0.3: return
        ax, ay = self.at
        out_ = clamp((u - self.u1) / 0.3)
        a = clamp((u - self.u0) / 0.15) * (1 - out_)
        # the ping: two rings off the device
        for d_ in (0.0, 0.25):
            q = (u - self.u0 - d_) / 0.8
            if 0 <= q < 1:
                rr = 10 + 60 * ease_out(q)
                ring(f, ax - rr, ay - rr, ax + rr, ay + rr, rr, 1.0, 0.8 * (1 - q), color=G, width=2.4, glow=True)
        _dot(f, (ax, ay), 5, G, a, glow=8)
        # the stem, then the card on its end
        p = fm_spring(u - self.u0 - 0.12, 210, 19)
        sw, sh = self.spr.shape[1], self.spr.shape[0]
        ex = ax + self.side * (60 + 40 * p)
        ey = ay + self.rise * p
        # the card kept inside the frame, the stem meeting its near edge
        cx0 = ex if self.side > 0 else ex - sw
        cx0 = min(max(cx0, 48), W - 48 - sw)
        cy0 = min(max(ey - sh / 2, 48), H - 48 - sh)
        ex = cx0 if self.side > 0 else cx0 + sw
        ey = cy0 + sh / 2
        line(f, (ax, ay), (ax + (ex - ax) * min(1, p * 1.4), ay + (ey - ay) * min(1, p * 1.4)), G, alpha=0.9 * a, width=2.2, dot=False)
        sc = 0.7 + 0.3 * p
        blit(f, self.spr, cx0 + (0 if self.side > 0 else sw), cy0 + sh / 2, a * clamp(p * 1.6), scale=sc,
             ox=(0 if self.side > 0 else sw), oy=sh / 2)


# ---------------------------------------------------------------- 0 · the opening: the write-off, stamped on the cartons

class StampedGodown:
    """cut 5's godown clip (every carton labelled), with the Mango Drink's cartons stamped WRITTEN OFF: two big stamps
    thump across the near pallet's front cartons as the voice says "write off" (the frame jolts with each), then a run
    of stamps down the stack's side, foreshortened as the cartons' faces are. Each is tracked through the dolly
    (cartons.py's label paths), its ink taking the carton's light. stamps: [(track id, u, kind)], kind 'big' or 'side'."""
    FH = 1088
    # where a stamp sits on its carton, in the label's own axes (its width, its height) from the label's centre, and its
    # size against the label's: the front cartons' faces run well left of their labels, so the stamp sits across the face
    PLACE = {'big': ((-0.55, 0.42), 3.9), 'side': ((0.0, 0.9), 2.7)}

    def __init__(self, stamps):
        self.bg = ClipBG('o0-godown-aisle-labelled')
        self.paths = {t: {int(k): np.float32(q) for k, q in p.items()}
                      for t, p in json.loads((HERE / 'build' / 'godown' / 'tracks.json').read_text()).items()}
        self.stamps = [(str(t), u, kind) for t, u, kind in stamps]
        st = LabelPrint._stamp('WRITTEN OFF')                     # its alpha (the ink), in its own px
        cw, ch = 900, 600                                          # a label-sized canvas, as cartons.shipper_label is
        s = 0.78 * cw / st.shape[1]
        M = cv2.getRotationMatrix2D((st.shape[1] / 2, st.shape[0] / 2), 11, s)
        M[0, 2] += cw * 0.5 - st.shape[1] / 2; M[1, 2] += ch * 0.5 - st.shape[0] / 2
        self.tex = cv2.warpAffine(st, M, (cw, ch), flags=cv2.INTER_LINEAR)
        self.cw, self.ch = cw, ch
        self.n = self.bg.foot.n

    def quad(self, tid, k):
        p = self.paths.get(tid)
        if not p or k not in p: return None
        return p[k] - np.float32([0, (self.FH - H) / 2])            # the clip's 1088 rows, centred in the film's 1080

    def _stamp(self, f, q, u, us, kind):
        (ox, oy), sc0 = self.PLACE[kind]
        p = clamp((u - us) / 0.12)
        sc = sc0 * (1.35 - 0.35 * ease_out(p))                    # it lands from a little large
        ax, ay = q[1] - q[0], q[3] - q[0]
        c = q.mean(0) + ax * ox + ay * oy
        qq = c + (q - q.mean(0)) * sc
        x0, y0 = np.floor(qq.min(0)).astype(int) - 2; x1, y1 = np.ceil(qq.max(0)).astype(int) + 3
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if x1 - x0 < 3 or y1 - y0 < 3: return None
        M = cv2.getPerspectiveTransform(np.float32([[0, 0], [self.cw, 0], [self.cw, self.ch], [0, self.ch]]), (qq - [x0, y0]).astype(np.float32))
        ink = cv2.warpPerspective(self.tex, M, (x1 - x0, y1 - y0), flags=cv2.INTER_AREA if np.ptp(qq, axis=0).max() < 200 else cv2.INTER_LINEAR)
        k_ = (0.95 if kind == 'big' else 0.85) * clamp(p * 3.0)
        m = (ink * k_)[..., None]
        roi = f[y0:y1, x0:x1]
        lum = roi.mean(axis=2, keepdims=True)
        red = np.float32([0.11, 0.12, 0.78])
        roi[:] = roi * (1 - m) + (red * (0.42 + 0.62 * lum)) * m       # the ink takes the carton's light
        return qq

    def draw(self, f, u, L=None):
        self.bg.draw(f, u, L)
        k = self.bg.foot.index(u)
        jolt = 0.0
        for tid, us, kind in self.stamps:
            if u < us: continue
            q = self.quad(tid, k)
            if q is None: continue
            qq = self._stamp(f, q, u, us, kind)
            if qq is None: continue
            if kind == 'big' and u - us < 0.4:      # it lands: a quick ring off it, and the frame jolts
                q_ = (u - us) / 0.4; cc = qq.mean(0); rr = (0.42 + 0.3 * ease_out(q_)) * np.ptp(qq, axis=0).max()
                ring(f, cc[0] - rr, cc[1] - rr * 0.7, cc[0] + rr, cc[1] + rr * 0.7, rr * 0.7, 1.0, 0.55 * (1 - q_), color=(229, 72, 60), width=2.4, glow=True)
                jolt = max(jolt, math.exp(-(u - us) / 0.05) * math.cos((u - us) * 70))
        if abs(jolt) > 0.02:
            M = np.float32([[1, 0, 0], [0, 1, 4.0 * jolt]])
            f[:] = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


# the Mango Drink's cartons stamped: the near pallet's top and bottom front cartons (the middle one, track 77, is the
# carton the camera dives into, so its label stays clean), then the cartons down the pallet's side, near to far, as
# tracked steadily by cartons.py (the tracks on the shelf's beam are not cartons, so they are left out)
STAMP_BIG = ['60', '102']
STAMP_SIDE = ['694', '104', '685', '141', '1623', '460']


@lru_cache(maxsize=None)
def tally_sprite(rupees, packs):
    S = 2; w, h = 430, 128
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=18 * S, fill=(26, 10, 8, 214), outline=(229, 92, 74, 210), width=int(1.6 * S))
    d.ellipse([20 * S, 22 * S, 32 * S, 34 * S], fill=(229, 92, 74, 255))
    draw_text(d, (42 * S, 18 * S), 'WRITTEN OFF', 'g', 16 * S, (240, 140, 120, 255), 720, 0.16)
    draw_text(d, (20 * S, 42 * S), money(-rupees) if rupees else '₹0', 'b', 46 * S, (255, 236, 230, 255), 780)
    draw_text(d, (22 * S, 98 * S), f'{packs:,} packs of Mango Drink · MF-2410-118', 'g', 15 * S, (220, 180, 170, 255), 480)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class WriteOffTally:
    """the rupees written off, rolling up from the first stamp to the last, a bump as each lands, then leaving before
    the dive"""
    def __init__(self, x, y, times, total, packs, u1):
        self.x, self.y, self.times, self.total, self.packs, self.u1 = x, y, sorted(times), total, packs, u1

    def draw(self, f, u, L=None):
        if not self.times or u < self.times[0] - 0.2: return
        a = clamp((u - self.times[0] + 0.2) / 0.3) * (1 - clamp((u - self.u1) / 0.35))
        if a <= 0: return
        t0, t1 = self.times[0], self.times[-1] + 0.35
        q = ease_in_out(clamp((u - t0) / (t1 - t0)))
        rup = round(self.total * q / 10) * 10 if q < 1 else round(self.total)
        pk = round(self.packs * q / 10) * 10 if q < 1 else self.packs
        spr = tally_sprite(int(rup), int(pk))
        last = max((t for t in self.times if u >= t), default=None)
        bump = 1 + 0.04 * max(0.0, 1 - (u - last) / 0.12) if last is not None else 1
        blit(f, spr, self.x, self.y + 12 * (1 - ease_out(clamp((u - self.times[0] + 0.2) / 0.4))), a, scale=bump, ox=0, oy=spr.shape[0] / 2)


# ---------------------------------------------------------------- 0 · the bin: what destroying costs, the GST credit taken back

@lru_cache(maxsize=None)
def cost_row(label, sub, value, w=600, hot=False):
    S = 2; h = 64
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if hot: d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=12 * S, fill=(229, 92, 74, 48))
    draw_text(d, (16 * S, 9 * S), label, 'g', 21 * S, (240, 244, 242, 255), 640)
    draw_text(d, (16 * S, 36 * S), sub, 'g', 15 * S, (190, 170, 162, 255), 440)
    vw = text_w(value, 'g', 24, 700)
    draw_text(d, ((w - 18) * S - vw * S, 16 * S), value, 'g', 24 * S, (255, 150, 130, 255), 700)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def itc_pill(state):
    """the input GST on the packs: kept (green), then reversed (red)"""
    S = 2; w, h = 176, 32
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    ok = state == 'kept'
    ink = (52, 211, 128) if ok else (229, 92, 74)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=16 * S, fill=tuple(int(c * 0.22) for c in ink) + (240,), outline=ink + (255,), width=int(1.6 * S))
    t = 'ITC ₹869 · kept' if ok else 'ITC ₹869 · reversed'
    tw = text_w(t, 'g', 14, 700)
    draw_text(d, ((w - tw) / 2 * S, 7 * S), t, 'g', 14 * S, (226, 248, 236, 255) if ok else (255, 214, 206, 255), 700)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class CostStack:
    """What destroying the Mango Drink's 1,580 packs costs Munchly, as money.js works it out (writeOff): the stock at
    cost, the input GST credit reversed, disposal, EPR on the kilos, each landing as the voice reaches it, the total
    rolling up. The GST line's credit is shown kept, then taken back (s.17(5)(h): no input credit on goods destroyed)."""
    ROWS = [('Stock written off at cost', '1,580 packs × ₹11.00', -17380.0, False),
            ('GST input credit reversed', '1,580 × ₹0.55 · s.17(5)(h)', -869.0, True),
            ('Disposal', '1,580 packs × ₹1.50', -2370.0, False),
            ('EPR on the waste', '339.7 kg × ₹6', -2038.2, False)]

    def __init__(self, x, y, times, u_total, u1, w=640):
        self.x, self.y, self.times, self.u_total, self.u1, self.w = x, y, times, u_total, u1, w
        self.title = words_sprite(kicker='IF IT IS DESTROYED · MANGO DRINK, 1,580 PACKS', width=w, kcolor='a')

    def draw(self, f, u, L=None):
        a = fade(u, self.times[0] - 0.3, self.u1, 0.35, 0.35)
        if a <= 0: return
        n = len(self.ROWS); rh = 70
        # the panel grows with its rows, so it never stands empty
        rows_h = sum(rh * ease_out(clamp((u - t) / 0.35)) for t in self.times)
        tot_h = 92 * ease_out(clamp((u - self.u_total) / 0.4))
        x0, y0, x1, y1 = self.x - 18, self.y - 18, self.x + self.w + 18, self.y + 52 + rows_h + tot_h
        shadow(f, x0, y0, x1, int(y1), 18, alpha=0.45 * a)
        ix0, iy0, al = rrect_alpha(x0, y0, x1, int(y1), 18)
        over(f, ix0, iy0, col((14, 8, 7)), al * 0.8 * a)
        blit(f, self.title, self.x, self.y, a)
        for i, ((lab, sub, v, hot), t) in enumerate(zip(self.ROWS, self.times)):
            if u < t: continue
            e = ease_out(clamp((u - t) / 0.35))
            vv = v * clamp((u - t) / 0.6)
            spr = cost_row(lab, sub, money(v) if (u - t) > 0.6 else money(round(vv)), self.w, hot and u - t < 1.8)
            yy = self.y + 46 + i * rh
            blit(f, spr, self.x + 20 * (1 - e), yy, a * e)
            if hot:   # the credit Munchly kept on these packs, struck out, then taken back
                px, py = self.x + 300, yy + 16
                k_in = clamp((u - t - 0.2) / 0.25)
                strike = ease_in_out(clamp((u - t - 0.6) / 0.4))
                swap = ease_out(clamp((u - t - 1.15) / 0.35))
                if swap < 1:
                    blit(f, itc_pill('kept'), px, py, a * k_in * (1 - swap))
                    if strike > 0:
                        line(f, (px + 10, py + 16), (px + 10 + (176 - 20) * strike, py + 16), (229, 92, 74), alpha=a * (1 - swap), width=2.6, dot=False)
                if swap > 0:
                    blit(f, itc_pill('reversed'), px + 18 * (1 - swap), py, a * swap)
        # the total
        if u >= self.u_total:
            e = ease_out(clamp((u - self.u_total) / 0.4))
            yy = self.y + 46 + n * rh + 10
            line(f, (self.x + 16, yy), (self.x + self.w - 16, yy), (229, 92, 74), alpha=a * e, width=1.6, dot=False)
            tot = money(-22657.2) if u - self.u_total > 0.5 else money(round(-22657.2 * clamp((u - self.u_total) / 0.5)))
            blit(f, text_sprite('Lost if destroyed', 'g', 24, 680, (255, 220, 210)), self.x + 16, yy + 18, a * e)
            ts = text_sprite(tot, 'b', 44, 800, (255, 120, 100))
            blit(f, ts, self.x + self.w - 16 - ts.shape[1], yy + 6, a * e)


# ---------------------------------------------------------------- 3 · the cast: Munchly's people, each at their post

CAST = [   # the people the film follows: group, portrait, name, role
    ('all', 'p-neha', 'Neha Kulkarni', 'Smart-Clearance · sets Munchly up in the console'),
    ('all', 'p-priya', 'Priya Deshmukh', 'Supply chain, Munchly · gives each plan its yes'),
    ('happy', 'p-lakshmi', 'Lakshmi Agencies', 'Distributor · Hyderabad'),
    ('happy', 'p-lakshmi-ganapathi', 'Sri Lakshmi Ganapathi Kirana', 'One of its 58 kiranas'),
    ('happy', 'p-meera', 'Meera · Feeding India', 'Food bank · Hyderabad'),
    ('sad', 'p-rakesh', 'Rakesh Traders', 'Distributor · Nagpur'),
    ('sad', 'p-agrawal', 'Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur'),
]
CAST_GROUPS = {'all': ('EVERY BATCH', (115, 201, 157)), 'happy': ('HAPPY PATH · MANGO DRINK', (52, 211, 128)),
               'sad': ('SAD PATH · MASALA CHIPS', (247, 192, 74))}


@lru_cache(maxsize=None)
def kicker_sprite(text, rgb, size=17, track=0.14):
    """a spaced capitals kicker, with room to spare (the middle dot falls back to another face, wider than measured)"""
    S = 2; w = int(text_w(text, 'g', size, 700, track) + size * 2.5); h = int(size * 1.4)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    draw_text(ImageDraw.Draw(im), (0, int(size * 0.08) * S), text, 'g', size * S, rgb + (255,), 700, track)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


@lru_cache(maxsize=None)
def cast_row(portrait, name, role, w=600):
    S = 2; h = 70
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    av = avatar_img(str(PEOPLE / f'{portrait}.webp'), 58 * S)
    im.alpha_composite(av, (2 * S, 6 * S))
    draw_text(d, (76 * S, 9 * S), name, 'g', 22 * S, (240, 246, 242, 255), 680)
    draw_text(d, (76 * S, 39 * S), role, 'g', 16 * S, MUTED + (255,), 480)
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class MunchlyCast(MunchlyMap):
    """cut 5's map of Munchly's supply chain, then, as the voice turns to the people, the map docks into a card on the
    left and the cast stands beside it: everyone the film follows, with their role, grouped by the batch they belong
    to. As the two batches light their paths on the map, their groups light with them."""
    DOCK = (40, 224, 0.585)          # the docked map: its left, its top, its scale
    PX, PY, PW = 1196, 166, 664      # the cast panel

    def __init__(self, *a, t_cast=None, t_cast_out=None, **k):
        super().__init__(*a, **k)
        self.t_cast = t_cast
        self.rows = [(g, cast_row(p, n, r, self.PW - 56)) for g, p, n, r in CAST]
        self.kick = {g: kicker_sprite(t, c) for g, (t, c) in CAST_GROUPS.items()}
        self.head = kicker_sprite("THE PEOPLE YOU'LL MEET", (232, 242, 236), 18)
        # the panel's layout, top down: its heading, then each group's kicker and its people
        y = self.PY + 76; self.at = []
        for g in ('all', 'happy', 'sad'):
            self.at.append(('k', g, y)); y += 32
            for i, (gg, _) in enumerate(self.rows):
                if gg == g: self.at.append(('r', i, y)); y += 76
            y += 14
        self.PH = y - self.PY + 6
        self.tmp = np.zeros((H, W, 3), np.float32)

    def draw(self, f, u, L=None):
        if self.t_cast is None or u < self.t_cast:
            return super().draw(f, u, L)
        super().draw(self.tmp, u, L)
        q = ease_in_out(clamp((u - self.t_cast) / 0.75))
        x0, y0, s = self.DOCK
        sc = 1 - (1 - s) * q
        ox, oy = x0 * q, y0 * q
        # behind the docked map, the map itself, deep in shadow and out of focus
        small = cv2.resize(self.tmp, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
        f[:] = cv2.resize(cv2.GaussianBlur(small, (0, 0), 4), (W, H), interpolation=cv2.INTER_LINEAR) * (1 - 0.74 * q)
        mw, mh = int(round(W * sc)), int(round(H * sc))
        m = cv2.resize(self.tmp, (mw, mh), interpolation=cv2.INTER_AREA)
        ix, iy = int(round(ox)), int(round(oy))
        r = max(1.0, 26 * q)
        if q > 0.02: shadow(f, ix, iy, ix + mw, iy + mh, r, alpha=0.5 * q)
        _, _, al = rrect_alpha(ix, iy, ix + mw, iy + mh, r, pad=0)
        over(f, ix, iy, m, al[:mh, :mw])
        if q > 0.02: ring(f, ix, iy, ix + mw, iy + mh, r, 1.0, 0.5 * q, color=(63, 176, 123), width=1.4, glow=False)
        # the cast panel
        pa = clamp((u - self.t_cast - 0.45) / 0.4)
        if pa <= 0: return
        px = self.PX + 90 * (1 - ease_out(pa))
        shadow(f, px, self.PY, px + self.PW, self.PY + self.PH, 22, alpha=0.5 * pa)
        bx, by, bal = rrect_alpha(px, self.PY, px + self.PW, self.PY + self.PH, 22)
        over(f, bx, by, col((12, 24, 18)), bal * 0.9 * pa)
        ring(f, px, self.PY, px + self.PW, self.PY + self.PH, 22, 1.0, 0.45 * pa, color=(63, 176, 123), width=1.2, glow=False)
        blit(f, self.head, px + 28, self.PY + 28, pa)
        t = self.t
        lit = {'happy': t['happy'], 'sad': t['sad']}
        for j, (kind, key, y) in enumerate(self.at):
            tj = self.t_cast + 0.6 + 0.1 * j
            a = clamp((u - tj) / 0.3) * pa
            if a <= 0: continue
            e = ease_out(clamp((u - tj) / 0.4))
            g = key if kind == 'k' else self.rows[key][0]
            if g in lit and u > lit[g]:   # the group's path lights: a bar down its side
                la = clamp((u - lit[g]) / 0.4)
                rgb = CAST_GROUPS[g][1]
                if kind == 'r':
                    over(f, int(px + 14), int(y + 8), col(rgb), np.ones((54, 4), np.float32) * la * a)
            if kind == 'k':
                blit(f, self.kick[key], px + 28 + 24 * (1 - e), y, a)
            else:
                blit(f, self.rows[key][1], px + 28 + 24 * (1 - e), y, a)


# ---------------------------------------------------------------- 6 · how the split is decided: the sales history and the rules

@lru_cache(maxsize=None)
def why_card(kind):
    """the two things the Valuer and the Router decide from, each worked through for the Mango Drink (money.js)"""
    S = 2; w = 560
    if kind == 'history':
        title, tag, rows = 'Its sales history', 'BIGQUERY · 28 DAYS OF SELL-THROUGH', [
            ('Sells 28 packs a day', ''),
            ('15 selling days left (retailers stop a week before)', ''),
            ('420 will sell; 1,580 will not', 'bad')]
    else:
        title, tag, rows = "The brand's own rules", 'SET IN THE CONSOLE', [
            ('Blinkit 90 days · Zepto, Instamart 60% of life', 'bad'),
            ('ExpireSoon needs 30+ days: it has 22', 'bad'),
            ('Kiranas: 28 a day × 14 days × 3.5 = 1,372', 'ok'),
            ('Staff sale: up to 150 at the godown', 'ok'),
            ('Food bank: 15+ days, the rest', 'ok')]
    h = 24 + 26 + 30 + len(rows) * 30 + 18
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=16 * S, fill=(11, 26, 19, 240), outline=(63, 176, 123, 170), width=int(1.4 * S))
    draw_text(d, (20 * S, 18 * S), tag, 'g', 13 * S, (115, 201, 157, 255), 700, 0.14)
    draw_text(d, (20 * S, 38 * S), title, 'g', 23 * S, (240, 246, 242, 255), 700)
    y = 78
    for t, k in rows:
        c = {'ok': (52, 211, 128), 'bad': (240, 120, 100)}.get(k, (190, 208, 198))
        mark = {'ok': '✓', 'bad': '×'}.get(k, '·')
        draw_text(d, (22 * S, y * S), mark, 's', 17 * S, c + (255,), 700)
        draw_text(d, (44 * S, y * S), t, 'g', 17 * S, (220, 232, 226, 255), 460)
        y += 30
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class SplitWhy:
    """the sales history and Munchly's rules, each card landing as the voice names it, a sparkline of the 28 days on
    the history card, then both flowing into the split (drawn by PlanFlow) as it begins; they step aside for it"""
    def __init__(self, x, y, u_hist, u_rules, u_split):
        self.x, self.y, self.u_hist, self.u_rules, self.u_split = x, y, u_hist, u_rules, u_split
        self.hist, self.rules = why_card('history'), why_card('rules')
        rng = np.random.default_rng(118)
        self.days = 28 + rng.normal(0, 3.5, 28)

    def draw(self, f, u, L=None):
        out = clamp((u - self.u_split) / 0.5)
        for spr, t0, yy in ((self.hist, self.u_hist, self.y), (self.rules, self.u_rules, self.y + self.hist.shape[0] + 18)):
            if u < t0: continue
            e = fm_spring(u - t0, 220, 20)
            a = clamp((u - t0) / 0.25) * (1 - out)
            if a <= 0: continue
            blit(f, spr, self.x - 40 * (1 - e) - 120 * ease_in(out), yy, a)
            if spr is self.hist:   # the sparkline of 28 days, drawn on
                q = clamp((u - t0 - 0.2) / 0.8)
                px0, py0, pw, ph = self.x + spr.shape[1] - 200, yy + 22, 170, 44
                pts = [(px0 + pw * i / 27, py0 + ph - (v - 18) / 20 * ph) for i, v in enumerate(self.days)]
                k = max(2, int(q * len(pts)))
                _glow_line(f, np.float32(pts[:k]), G, 0.9 * a, width=2.0, glow=4)


# ---------------------------------------------------------------- 7 · the deliveries: Rakesh's van round, Agrawal's truck

from parts5 import (greet_sprite, chat_bubble, bar_sprite, qr_sprite, pointer_sprite, NextScene, EndCard5, DEMO,
                    ink_left, Kinetic as _Kin)
from parts import url_line, BAR, Window
from parts3 import lower_third


class TwoClips:
    """two clips in turn, frame for frame at 25 fps, each from its own start (off), the second dissolving in at t_cut;
    a soft shade over the top left, so the heading reads on a bright sky"""
    def __init__(self, a, b, t_cut, off_a=0.0, off_b=0.0, xf=0.4):
        self.a, self.b, self.t_cut, self.oa, self.ob, self.xf = Footage(a), Footage(b), t_cut, off_a, off_b, xf
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        g = np.clip(1 - yy / 360, 0, 1) ** 1.4 * np.clip(1 - xx / 1250, 0, 1) ** 0.7
        self.shade = (1 - 0.62 * g)[..., None].astype(np.float32)
    def draw(self, f, u, L=None):
        if u < self.t_cut:
            f[:] = self.a.frame(u + self.oa)[0].astype(np.float32) / 255
        else:
            fb = self.b.frame(u - self.t_cut + self.ob)[0].astype(np.float32) / 255
            p = clamp((u - self.t_cut) / self.xf)
            if p < 1:
                fa = self.a.frame(u + self.oa)[0].astype(np.float32) / 255
                f[:] = fa * (1 - ease_in_out(p)) + fb * ease_in_out(p)
            else:
                f[:] = fb
        f *= self.shade


@lru_cache(maxsize=None)
def route_node(icon, label, sub, ink=G):
    S = 2; w, h = 200, 74
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([(w / 2 - 17) * S, 0, (w / 2 + 17) * S, 34 * S], fill=tuple(int(c * 0.3) for c in ink) + (255,), outline=ink + (255,), width=int(1.8 * S))
    tw = text_w(label, 'g', 15, 680); sw = text_w(sub, 'g', 12, 460)
    draw_text(d, ((w - tw) / 2 * S, 40 * S), label, 'g', 15 * S, (236, 243, 239, 255), 680)
    draw_text(d, ((w - sw) / 2 * S, 58 * S), sub, 'g', 12 * S, MUTED + (255,), 460)
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    ic = icon_sprite(icon, 18); o = (w - 18) // 2
    a_ = ic[..., 3:4]; spr[8:26, o:o + 18] = spr[8:26, o:o + 18] * (1 - a_) + ic
    return spr


class RouteInset:
    """the round on a small map, in the corner: the godown, the two shops and the road to Raipur; the van's dot runs the
    round (dropping 24 packets at each shop) while the first clip plays, then the truck's dot comes in from Raipur to
    the godown and goes back with the lot"""
    def __init__(self, x, y, u0, t_van, t_truck, u1, w=470, h=250):
        self.x, self.y, self.u0, self.t_van, self.t_truck, self.u1, self.w, self.h = x, y, u0, t_van, t_truck, u1, w, h
        self.nodes = {'godown': (0.20, 0.55), 'shop1': (0.46, 0.25), 'shop2': (0.62, 0.70), 'raipur': (0.93, 0.32)}
        self.spr = {'godown': route_node('warehouse', 'The godown', 'the distributor'),
                    'shop1': route_node('store', 'A kirana', '24 packets'),
                    'shop2': route_node('store', 'Another kirana', '24 packets'),
                    'raipur': route_node('truck', 'The buyer', 'a wholesaler', AMBER)}
        self.title = text_sprite('THE SATURDAY ROUND · THE LOT COLLECTED', 'g', 13, 700, (115, 201, 157))

    def P(self, k):
        nx, ny = self.nodes[k]; return (self.x + nx * self.w, self.y + 30 + ny * (self.h - 60))

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        x0, y0, x1, y1 = self.x - 14, self.y - 14, self.x + self.w + 14, self.y + self.h + 14
        shadow(f, x0, y0, x1, y1, 16, alpha=0.4 * a)
        ix0, iy0, al = rrect_alpha(x0, y0, x1, y1, 16)
        over(f, ix0, iy0, col((10, 22, 16)), al * 0.86 * a)
        blit(f, self.title, self.x, self.y - 4, a)
        g, s1, s2, rp = self.P('godown'), self.P('shop1'), self.P('shop2'), self.P('raipur')
        # the roads, faint
        for p, q in ((g, s1), (s1, s2), (g, rp)):
            line(f, p, q, (70, 100, 85), alpha=0.6 * a, width=2.0, dot=False)
        # the van's round: godown, shop 1, shop 2, back
        if u >= self.t_van:
            q = clamp((u - self.t_van) / max(0.5, self.t_truck - self.t_van - 0.2))
            legs = [(g, s1), (s1, s2), (s2, g)]
            k = min(2, int(q * 3)); r = q * 3 - k
            for j in range(k + 1):
                p0, p1 = legs[j]; rr = 1.0 if j < k else r
                _glow_line(f, np.float32([p0, (p0[0] + (p1[0] - p0[0]) * rr, p0[1] + (p1[1] - p0[1]) * rr)]), G, 0.9 * a, width=3.0, glow=5)
            p0, p1 = legs[k]
            _dot(f, (p0[0] + (p1[0] - p0[0]) * r, p0[1] + (p1[1] - p0[1]) * r), 6, G, a, glow=8)
        # the truck: in from Raipur, a beat at the godown, back with the lot
        if u >= self.t_truck:
            q = clamp((u - self.t_truck) / max(0.6, self.u1 - self.t_truck - 0.4))
            if q < 0.45: r = ease_in_out(q / 0.45); pos = (rp[0] + (g[0] - rp[0]) * r, rp[1] + (g[1] - rp[1]) * r)
            elif q < 0.6: pos = g
            else: r = ease_in_out((q - 0.6) / 0.4); pos = (g[0] + (rp[0] - g[0]) * r, g[1] + (rp[1] - g[1]) * r)
            _glow_line(f, np.float32([rp, pos]) if q < 0.45 else np.float32([rp, g]), AMBER, 0.85 * a, width=3.0, glow=5)
            _dot(f, pos, 7, AMBER, a, glow=9)
        for k, spr in self.spr.items():
            p = self.P(k)
            blit(f, spr, p[0] - spr.shape[1] / 2, p[1] - 17, a)


# ---------------------------------------------------------------- 8 · every step on the record: the audit trail and one trace

SVC = {'backend-api': (G, 'backend-api · Cloud Run'), 'agents': ((168, 140, 245), 'agents · Cloud Run'),
       'gemini': (AMBER, 'Gemini · Vertex AI'), 'bigquery': ((92, 172, 242), 'BigQuery'), 'sql': ((72, 196, 196), 'Cloud SQL')}


def trace_rows(path):
    """the trace's spans folded into the rows the film shows: the request, its writes to Cloud SQL, the agents' run, each
    agent's own spans with its model call or BigQuery job, and each report back to backend-api; [(label, service,
    start s, end s)] in the trace's own time"""
    from datetime import datetime
    t = json.loads(Path(path).read_text())
    sp = t['spans']
    ts = lambda x: datetime.fromisoformat(x.replace('Z', '+00:00')).timestamp()
    t0 = min(ts(s['startTime']) for s in sp)
    by = lambda name: [s for s in sp if s['name'] == name]
    def one(name, i=0):
        s = by(name)[i]; return ts(s['startTime']) - t0, ts(s['endTime']) - t0
    root = one('POST /v1/workspaces/{ws}/cases/{ref}/photos/{photo_id}')
    sql = [s for s in sp if s['name'] in ('SELECT', 'INSERT', 'UPDATE') and ts(s['startTime']) - t0 < root[1]]
    rows = [('POST …/cases/MF-2409-117/photos  (the label photo)', 'backend-api', *root),
            (f'{len(sql)} queries · the case, the photo, the outbox', 'sql', ts(sql[0]['startTime']) - t0, max(ts(s['endTime']) for s in sql) - t0),
            ('agents decide  (from Pub/Sub)', 'agents', *one('agents decide')),
            ('Vision reads the label · gemini-3.8-flash', 'gemini', *one('generate_content gemini-3.8-flash')),
            ('POST /internal/…/photo-read', 'backend-api', *one('POST /internal/clients/{client_id}/cases/{ref}/photo-read')),
            ('Valuer: the sales history · BigQuery', 'bigquery', *one('BigQuery.job.begin')),
            ('Valuer prices the exits · gemini-3.1-pro', 'gemini', *one('generate_content gemini-3.1-pro-preview', 0)),
            ('POST /internal/…/valuation', 'backend-api', *one('POST /internal/clients/{client_id}/cases/{ref}/valuation')),
            ('Router splits the batch · gemini-3.1-pro', 'gemini', *one('generate_content gemini-3.1-pro-preview', 1)),
            ('POST /internal/…/plan', 'backend-api', *one('POST /internal/clients/{client_id}/cases/{ref}/plan')),
            ("the run's row · BigQuery", 'bigquery', *one('BigQuery.insertRowsJson'))]
    end = max(ts(s['endTime']) for s in sp) - t0
    return rows, len(sp), end, t['traceId']


class TracePanel:
    """one real trace from production, drawn as Cloud Trace shows it: a waterfall, the trace's 34 s played over a few
    seconds of film, each span growing as its time comes, coloured by where it ran; the trace id and the span count over
    it, and the services' key under it"""
    def __init__(self, x, y, u0, u_play, u1, w=1000):
        self.x, self.y, self.u0, self.u_play, self.u1, self.w = x, y, u0, u_play, u1, w
        self.rows, self.n, self.end, self.tid = trace_rows(HERE / 'build' / 'trace' / 'trace.json')
        self.title = words_sprite(kicker='CLOUD TRACE · OPENTELEMETRY', head='One trace, from his tap to the agents’ plan.', width=w, hsize=30)
        self.meta = text_sprite(f'trace {self.tid[:12]}…  ·  {self.n} spans  ·  {self.end:.1f} s  ·  13 Oct, 10:10', 'g', 16, 520, MUTED)
        self.labels = [text_sprite(r[0], 'g', 16, 540, (220, 232, 226)) for r in self.rows]
        self.key = [(text_sprite(v[1], 'g', 14, 560, (200, 214, 206)), v[0]) for v in SVC.values()]

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.4, 0.35)
        if a <= 0: return
        rh = 31; lw = 430; bw = self.w - lw - 20
        top = self.y + self.title.shape[0] + 34
        x0, y0, x1, y1 = self.x - 20, self.y - 20, self.x + self.w + 20, top + len(self.rows) * rh + 64
        shadow(f, x0, y0, x1, y1, 18, alpha=0.5 * a)
        ix0, iy0, al = rrect_alpha(x0, y0, x1, y1, 18)
        over(f, ix0, iy0, col((9, 18, 14)), al * 0.9 * a)
        blit(f, self.title, self.x, self.y, a)
        blit(f, self.meta, self.x, self.y + self.title.shape[0] + 4, a)
        # the time axis
        for s in range(0, 35, 5):
            xx = self.x + lw + bw * s / self.end
            line(f, (xx, top - 6), (xx, top + len(self.rows) * rh), (40, 60, 50), alpha=0.7 * a, width=1.0, dot=False)
            if s % 10 == 0: blit(f, text_sprite(f'{s} s', 'g', 12, 480, (120, 140, 130)), xx - 8, top + len(self.rows) * rh + 4, a)
        now = self.end * clamp((u - self.u_play) / 3.6)          # the trace's time, played on
        for i, ((lab, svc, s0, s1), ls) in enumerate(zip(self.rows, self.labels)):
            if now < s0: continue
            ra = a * clamp((now - s0) / 0.8 + 0.3)
            yy = top + i * rh
            blit(f, ls, self.x, yy + 6, ra)
            bx0 = self.x + lw + bw * s0 / self.end
            bx1 = self.x + lw + bw * max(s0 + 0.12, min(s1, now)) / self.end
            rgb = SVC[svc][0]
            ix0, iy0, al = rrect_alpha(bx0, yy + 7, max(bx0 + 4, bx1), yy + 23, 5)
            over(f, ix0, iy0, col(rgb), al * 0.95 * ra)
            if now >= s1 and s1 - s0 > 0.9:
                d = text_sprite(f'{s1 - s0:.1f} s', 'g', 13, 600, (210, 222, 216))
                blit(f, d, min(bx1 + 6, self.x + self.w - d.shape[1]), yy + 6, ra * clamp((now - s1) / 0.5))
        kx = self.x; ky = top + len(self.rows) * rh + 28
        for spr, rgb in self.key:
            ix0, iy0, al = rrect_alpha(kx, ky + 3, kx + 12, ky + 15, 3)
            over(f, ix0, iy0, col(rgb), al * a)
            blit(f, spr, kx + 18, ky, a); kx += 18 + spr.shape[1] + 22


class TraceLink:
    """a step in the audit trail joined to its trace: a line drawn from the step's row in the window to the trace's first
    row, a spark running along it (the row's request, followed into Cloud Trace)"""
    def __init__(self, win, pt, u0, u1, to, elbow=None):
        self.win, self.pt, self.u0, self.u1, self.to, self.elbow = win, pt, u0, u1, to, elbow

    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u1 + 0.3: return
        (x0, y0, _, _), _, wa = self.win.to_out(u, L, (self.pt[0], self.pt[1], 0, 0))
        a = fade(u, self.u0, self.u1, 0.2, 0.3) * wa
        p = ease_out(clamp((u - self.u0) / 0.5))
        tx, ty = self.to
        mx = self.elbow if self.elbow is not None else (x0 + tx) / 2
        pts = [(x0, y0), (mx, y0), (mx, ty), (tx, ty)]
        seg = np.array([pts[0]] + [pts[1]] + [pts[2]] + [pts[3]], np.float32)
        # the elbow drawn on, then a spark running its length every second
        lens = np.linalg.norm(np.diff(seg, axis=0), axis=1); tot = lens.sum()
        def along(d):
            for k in range(3):
                if d <= lens[k] or k == 2: return seg[k] + (seg[k + 1] - seg[k]) * min(1, d / max(1e-6, lens[k]))
                d -= lens[k]
        dn = p * tot; acc = 0.0
        for k in range(3):
            if dn <= acc: break
            e = along(min(dn, acc + lens[k]))
            line(f, tuple(seg[k]), tuple(e), G, alpha=0.9 * a, width=2.2, dot=False)
            acc += lens[k]
        _dot(f, (x0, y0), 5, G, a, glow=8)
        if p >= 1:
            ph = ((u - self.u0 - 0.5) * 0.9) % 1.0
            _dot(f, tuple(along(ph * tot)), 4.5, G, a * math.sin(ph * math.pi), glow=8)
            _dot(f, (tx, ty), 5, G, a, glow=8)


def log_rows(path):
    """the log lines that carry the trace (Cloud Logging): the photo's request, then each agent's run, done"""
    rows = []
    for e in json.loads(Path(path).read_text()):
        h = e.get('httpRequest') or {}
        msg = (e.get('jsonPayload') or {}).get('message') or e.get('textPayload') or ''
        svc = e.get('resource', {}).get('labels', {}).get('service_name', '')
        tm = e.get('timestamp', '')[11:19]
        if h.get('requestMethod') == 'POST' and '/photos/' in (h.get('requestUrl') or ''):
            rows.append((tm, 'INFO', svc, 'POST …/cases/MF-2409-117/photos  200  0.98 s'))
        elif msg.startswith('run run_'):   # its run, by the id's first six, then what it did
            rid, _, what = msg[4:].partition(': ')
            rows.append((tm, 'INFO', svc, f'{rid[:10]} · {what}'))
    return rows[:4]


@lru_cache(maxsize=None)
def log_sprite(tm, sev, svc, msg, w=1000, tid=''):
    S = 2; h = 26
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fnt = ImageFont.truetype(MONO, 15 * S)
    x = 0
    for txt, rgb in ((tm, (150, 170, 160)), (svc, (168, 140, 245) if svc == 'agents' else (52, 211, 128)), (msg, (226, 236, 230))):
        d.text((x, 4 * S), txt, font=fnt, fill=rgb + (255,)); x += fnt.getlength(txt) + 16 * S
    if tid:   # the trace each line carries, at the line's end
        t = f'trace {tid[:6]}…'
        d.text((w * S - fnt.getlength(t), 4 * S), t, font=fnt, fill=(115, 160, 140, 255))
    return to_sprite(im.resize((w, h), Image.LANCZOS))


class LogPanel:
    """the same trace in Cloud Logging: its lines typed in, each tagged with the trace"""
    def __init__(self, x, y, u0, u1, w=1000, gap=0.45):
        self.x, self.y, self.u0, self.u1, self.w, self.gap = x, y, u0, u1, w, gap
        self.rows = log_rows(HERE / 'build' / 'trace' / 'logs.json')
        self.tid = trace_rows(HERE / 'build' / 'trace' / 'trace.json')[3]
        self.head = kicker_sprite('CLOUD LOGGING · EVERY LINE CARRIES THE TRACE', (115, 201, 157), 13)
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.35)
        if a <= 0: return
        x0, y0, x1, y1 = self.x - 20, self.y - 18, self.x + self.w + 20, self.y + 34 + len(self.rows) * 28 + 14
        ix0, iy0, al = rrect_alpha(x0, y0, x1, y1, 16)
        over(f, ix0, iy0, col((9, 18, 14)), al * 0.9 * a)
        blit(f, self.head, self.x, self.y - 4, a)
        for i, r in enumerate(self.rows):
            t0 = self.u0 + 0.2 + i * self.gap
            if u < t0: continue
            blit(f, log_sprite(*r, w=self.w, tid=self.tid), self.x, self.y + 24 + i * 28, a * clamp((u - t0) / 0.2))


# ---------------------------------------------------------------- 9 · what comes next, in photographs, then the guided demo

@lru_cache(maxsize=None)
def photo_card(path, w, h, r=22):
    """a photograph cropped to w x h with rounded corners, as a premultiplied sprite"""
    im = cv2.imread(str(path))
    ih, iw = im.shape[:2]; s = max(w / iw, h / ih)
    im = cv2.resize(im, (int(iw * s + 0.5), int(ih * s + 0.5)), interpolation=cv2.INTER_AREA)
    y0 = (im.shape[0] - h) // 2; x0 = (im.shape[1] - w) // 2
    im = im[y0:y0 + h, x0:x0 + w].astype(np.float32) / 255
    _, _, al = rrect_alpha(0, 0, w, h, r, pad=0)
    al = al[:h, :w]
    return np.dstack([im * al[..., None], al]).astype(np.float32)


@lru_cache(maxsize=None)
def bubble(text, rgb, size=30, kind='g'):
    """a speech bubble in a bright colour, its words in white (an Indic greeting comes from greet_sprite)"""
    S = 2; pad = 18
    tw = text_w(text, kind, size, 700) if text else 0
    w, h = int(tw + 2 * pad), int(size * 1.6 + 2 * 10)
    im = Image.new('RGBA', (w * S, (h + 12) * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=rgb + (255,))
    d.polygon([(22 * S, (h - 2) * S), (40 * S, (h - 2) * S), (24 * S, (h + 12) * S)], fill=rgb + (255,))
    if text: draw_text(d, (pad * S, 9 * S), text, kind, size * S, (255, 255, 255, 255), 700)
    return to_sprite(im.resize((w, h + 12), Image.LANCZOS))


def festive_bg(w=W, h=H, seed=208):
    """a colourful ground for the future scope: emerald into marigold, with soft bokeh"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip((xx / w) * 0.6 + (yy / h) * 0.4, 0, 1)[..., None]
    a = np.float32([0.30, 0.42, 0.06])[None, None]      # BGR deep emerald
    b = np.float32([0.10, 0.52, 0.86])[None, None]      # BGR marigold
    img = a * (1 - t) + b * t
    rng = np.random.default_rng(seed)
    bok = np.zeros((h, w), np.float32)
    for _ in range(60):
        cx, cy, r = rng.uniform(0, w), rng.uniform(0, h), rng.uniform(10, 60)
        cv2.circle(bok, (int(cx), int(cy)), int(r), float(rng.uniform(0.15, 0.5)), -1)
    bok = cv2.GaussianBlur(bok, (0, 0), 14)[..., None]
    return np.clip(img * 0.85 + bok * np.float32([0.75, 0.9, 1.0]) * 0.35, 0, 1)


LANG_CAST = [('fs-lang-ta', 'ta', 'Chennai', (231, 98, 74)), ('p-lakshmi-ganapathi', 'te', 'Hyderabad', (52, 170, 120)),
             ('p-rakesh', 'mr', 'Nagpur', (226, 150, 40)), ('p-agrawal', 'hi', 'Raipur', (120, 96, 220)),
             ('fs-lang-bn', 'bn', 'Kolkata', (40, 140, 210)), ('fs-lang-gu', 'gu', 'Ahmedabad', (210, 70, 140))]


def portrait_path(key):
    p = PEOPLE / f'{key}.webp'
    return p if p.exists() else HERE / 'img' / f'{key}.png'


@lru_cache(maxsize=None)
def round_photo(key, size):
    im = cv2.imread(str(portrait_path(key)))
    ih, iw = im.shape[:2]; m = min(ih, iw)
    im = im[(ih - m) // 2 if ih > iw else 0:((ih - m) // 2 if ih > iw else 0) + m, (iw - m) // 2:(iw - m) // 2 + m]
    im = cv2.resize(im, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    mk = np.zeros((size * 4, size * 4), np.uint8); cv2.circle(mk, (size * 2, size * 2), size * 2 - 6, 255, -1, cv2.LINE_AA)
    al = cv2.resize(mk, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    ring_ = np.zeros((size * 4, size * 4), np.uint8); cv2.circle(ring_, (size * 2, size * 2), size * 2 - 6, 255, 14, cv2.LINE_AA)
    rl = cv2.resize(ring_, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    rgb = im * (1 - rl[..., None]) + rl[..., None]
    return np.dstack([rgb * al[..., None], al]).astype(np.float32)


@lru_cache(maxsize=None)
def greet_bubble(code, rgb, height=40):
    g = greet_sprite(code, height)
    S = 1; pad = 16
    w, h = g.shape[1] + 2 * pad, g.shape[0] + 16
    im = Image.new('RGBA', (w * 2, (h + 12) * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * 2 - 1, h * 2 - 1], radius=h, fill=rgb + (255,))
    d.polygon([(20 * 2, (h - 2) * 2), (36 * 2, (h - 2) * 2), (22 * 2, (h + 12) * 2)], fill=rgb + (255,))
    spr = to_sprite(im.resize((w, h + 12), Image.LANCZOS))
    gg = g.copy()
    gg[..., :3] = gg[..., 3:4]          # the greeting in white
    a_ = gg[..., 3:4]
    spr[8:8 + g.shape[0], pad:pad + g.shape[1]] = spr[8:8 + g.shape[0], pad:pad + g.shape[1]] * (1 - a_) + gg
    return spr


@lru_cache(maxsize=None)
def scope_caption(title, sub, w=540):
    return words_sprite(head=title, sub=sub, width=w, hsize=34, ssize=19)


class NextScene6(NextScene):
    """What comes next, in photographs (cut 6): a shopkeeper answering an offer on his phone (WhatsApp), six shopkeepers
    from six states greeting in their own scripts (more Indian languages), two phones with the app (native iOS and
    Android), on a colourful ground, each landing as the voice names it; then the guided demo, as in cut 5."""
    def __init__(self, *a, phones=None, **k):
        super().__init__(*a, **k)
        self.ground = festive_bg()
        self.whats = Footage('fs-whatsapp')
        self.native = phones          # the two phones with the app set into their screens (a still, or None)
        self.caps = [scope_caption('WhatsApp', 'Offers and orders where kiranas already chat.'),
                     scope_caption('More Indian languages', 'Every offer in the shopkeeper’s own language.'),
                     scope_caption('Native iOS and Android', 'Apps on every phone, beside the web app.')]
        self.kick = words_sprite(kicker='NEXT ON OUR ROADMAP', head='What comes next.', width=900, hsize=56)
        self.b1 = chat_bubble('Mango Drink: 10 packets, 2 free. Order?', 330)
        self.b2 = chat_bubble('Haan, 24 bhej do', 220, mine=True)

    def card_frame(self, f, x, y, w, h, a, tilt=0.0):
        shadow(f, x, y, x + w, y + h, 22, alpha=0.45 * a, blur=40, dy=18)
        ix0, iy0, al = rrect_alpha(x - 8, y - 8, x + w + 8, y + h + 8, 26)
        over(f, ix0, iy0, np.float32([1, 1, 1]), al * a)

    def draw(self, f, u, L=None):
        f[:] = self.ground
        t = self.t
        out = ease_in_out((u - t['out']) / 0.55)
        ra = 1 - out
        if ra > 0.002:
            blit(f, self.kick, 110, 70 - 30 * out, ra * clamp((u - t['kick']) / 0.4))
            W_, H_ = 540, 400
            for i, key in enumerate(('whats', 'lang', 'native')):
                t0 = t[key]
                if u < t0: continue
                sp = fm_spring(u - t0, 190, 19)
                x, y = 110 + i * 590, 250 + 70 * (1 - sp) - 140 * out
                a = clamp((u - t0) / 0.3) * ra
                cu = u - t0
                self.card_frame(f, x, y, W_, H_, a)
                if key == 'whats':
                    img = self.whats.frame(cu)[0]
                    blit(f, photo_card_img(img, W_, H_), x, y, a)
                    blit(f, self.b1, x + W_ - self.b1.shape[1] - 18, y + 30 + 10 * (1 - ease_out(cu / 0.4)), a * clamp((cu - 0.25) / 0.3))
                    if cu > 1.0: blit(f, self.b2, x + W_ - self.b2.shape[1] - 18, y + 130 + 8 * (1 - ease_out((cu - 1.0) / 0.4)), a * clamp((cu - 1.0) / 0.3))
                elif key == 'lang':
                    ix0, iy0, al = rrect_alpha(x, y, x + W_, y + H_, 20)
                    over(f, ix0, iy0, np.float32([0.93, 0.95, 0.96]), al * a)
                    for j, (pk, code, city, rgb) in enumerate(LANG_CAST):
                        tj = 0.12 * j
                        if cu < tj: continue
                        sj = fm_spring(cu - tj, 240, 18)
                        px, py = x + 48 + (j % 3) * 168, y + 86 + (j // 3) * 170     # two rows, inside the card
                        ph = round_photo(pk, 104)
                        blit(f, ph, px + 52, py + 52, a * clamp((cu - tj) / 0.2), scale=0.6 + 0.4 * sj, ox=52, oy=52)
                        gb = greet_bubble(code, rgb)
                        ga = a * clamp((cu - tj - 0.2) / 0.25)
                        blit(f, gb, px + 58, py - gb.shape[0] + 12 + 10 * (1 - ease_out((cu - tj - 0.2) / 0.3)), ga)
                else:
                    if self.native is not None:
                        blit(f, photo_card_img(self.native, W_, H_), x, y, a)
                blit(f, self.caps[i], x, y + H_ + 26, a)
        if u >= t['demo'] - 0.05:
            self.draw_demo(f, u)

    def draw_demo(self, f, u):
        """cut 5's guided demo (as NextScene draws it): the landing page swings in, the pointer presses Play, and its
        address, big, with its QR code, on this ground"""
        t = self.t
        du = u - t['demo']
        k = int(clamp(30 + du * FPS, 0, len(self.seq) - 1))
        img = self.seq.get_index(k)
        s = 0.62; w_, h_ = 1600 * s, 900 * s
        sp = fm_spring(du, 170, 22)
        x0, y0 = 860 + 260 * (1 - sp), 230
        a = clamp(du / 0.3)
        shadow(f, x0, y0 - BAR, x0 + w_, y0 + h_, 16, alpha=0.6 * a)
        sm = cv2.resize(img, (int(w_), int(h_)), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        ix0, iy0, m = rrect_alpha(x0, y0, x0 + int(w_), y0 + int(h_), 14, pad=0, top_r=0.01)
        over(f, int(x0), int(y0), sm, m[:sm.shape[0], :sm.shape[1]] * a)
        blit(f, bar_sprite(int(w_), 'smartclearance-demo.web.app', BAR, 16), x0, y0 - BAR, a)
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


@lru_cache(maxsize=8)
def _photo_card_cached(key, w, h):
    return None


def photo_card_img(img, w, h, r=20):
    """a frame (uint8 BGR or float) cropped to w x h with rounded corners, premultiplied"""
    im = img if img.dtype == np.float32 else img.astype(np.float32) / 255
    ih, iw = im.shape[:2]; s = max(w / iw, h / ih)
    im = cv2.resize(im, (int(iw * s + 0.5), int(ih * s + 0.5)), interpolation=cv2.INTER_AREA)
    y0 = (im.shape[0] - h) // 2; x0 = (im.shape[1] - w) // 2
    im = im[y0:y0 + h, x0:x0 + w]
    _, _, al = rrect_alpha(0, 0, w, h, r, pad=0)
    al = al[:h, :w]
    return np.dstack([im * al[..., None], al]).astype(np.float32)


# ---------------------------------------------------------------- 10 · the close, with where to find the sign-ins and the data

@lru_cache(maxsize=None)
def access_line(icon, text, sub):
    """where to find something, on a pill of the card's glass: an icon, what it is, and where (in green)"""
    S = 2; h = 52
    tw = text_w(text, 'g', 24, 640); sw = text_w(sub, 'g', 21, 600)
    w = int(56 + tw + 16 + sw + 26)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=26 * S, fill=(10, 30, 21, 220), outline=(52, 211, 128, 150), width=int(1.4 * S))
    x = draw_text(d, (52 * S, 11 * S), text, 'g', 24 * S, (240, 246, 242, 255), 640)
    draw_text(d, (x + 16 * S, 14 * S), sub, 'g', 21 * S, (52, 211, 128, 255), 600)
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    ic = icon_sprite(icon, 24, (52, 211, 128))
    a_ = ic[..., 3:4]; spr[14:38, 18:42] = spr[14:38, 18:42] * (1 - a_) + ic
    return spr


class EndCard6(EndCard5):
    """cut 5's close, and under it where to find the live app's sign-ins (the deck) and the sample data (GitHub), as the
    voice says it (c01). The line is not said in cut 6, so the addresses and the stack follow it sooner, and each of
    the two lines lands no earlier than the stack above it"""
    URL_AT, URL_STEP, FOOT_AT = 2.0, 0.12, 2.45
    def __init__(self, L, words, t_access):
        super().__init__(L, words)
        self.t_access = t_access                                   # when each line lands, as the voice names it
        self.access = [access_line('shield-check', 'Sign-ins for the live app on Google Cloud', 'in our deck'),
                       access_line('package', 'Sample data to run the demo', 'github.com/aibuilder2026/smart-clearance')]

    def draw(self, f, u, L=None):
        super().draw(f, u, L)
        for i, s_ in enumerate(self.access):
            t0 = max(self.t_access[i], self.FOOT_AT + 0.3 + 0.5 * i)
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, self.X - 6, 836 + i * 64 + 10 * (1 - ease_out((u - t0) / 0.5)), a)


# where each delivery clip's chosen seconds start (set once the clips are reviewed)
DL_OFF = (0.0, 0.4)   # the van: from the handover; the truck: set once its clip is reviewed


def native_phones():
    """the two phones on the shop counter (fs-native) with the app set into their screens: the kirana's offer in
    Hindi on the one (the recording, 245.5 s) and the order placed on the other (249.6 s); None until the photo exists"""
    p = HERE / 'img' / 'fs-native-L.png'                    # the boxes on the counter labelled (prep-keys.py)
    if not p.exists(): p = HERE / 'img' / 'fs-native.png'
    if not p.exists(): return None
    import vfx
    from kit import REC, DEV, FrameSource
    im = cv2.resize(cv2.imread(str(p)), (W, H), interpolation=cv2.INTER_AREA)
    f = im.astype(np.float32) / 255
    fs = FrameSource(REC['mango'], DEV['H'])
    for hint, t in (((W * 0.40, H * 0.50), 245.5), ((W * 0.60, H * 0.50), 249.6)):
        q = vfx.screen_quad(im, hint=hint)
        if q is None: continue
        content = fs.get(t).astype(np.float32) / 255
        vfx.insert(f, im, q, content)
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)
