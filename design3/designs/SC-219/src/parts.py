"""SC-205, SC-206 (cut 3: the chosen take's timings, pauses inside a line; cut 4: the shorter close): the film's building blocks: the voice's timeline, backgrounds, browser windows over the recordings, rings,
cards, words and the stop rail. Each part draws itself into a float BGR frame at a local time u (seconds)."""
import json, math, re
from functools import lru_cache
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from kit import *

# ---------------------------------------------------------------- the voice's timeline

LINES = json.loads((HERE / 'lines.json').read_text())['lines']
# the chosen narration take (tts/vo3/<model>-<voice>, named in tts/voice.txt); until it exists, each line's length is
# estimated from its words, so the cut can be laid out and checked before the voice is made
_VOICE = (HERE / 'tts' / 'voice.txt').read_text().strip() if (HERE / 'tts' / 'voice.txt').exists() else ''
TAKE = HERE / 'tts' / 'vo3' / _VOICE
DUR = {l['id']: round(len(l['text'].split()) / 2.35 + 0.3, 3) for l in LINES}   # SC-207: estimates for lines not yet voiced
ASR = {}
if _VOICE and (TAKE / 'durations.json').exists():
    DUR.update({k: v for k, v in json.loads((TAKE / 'durations.json').read_text()).items() if k in DUR})
    ASR = {k: v for k, v in json.loads((TAKE / 'asr.json').read_text()).items() if k in DUR}
def _norm(w):
    return re.sub(r"[^a-z0-9]", '', w.lower())
# a pause inside a line (lines.json "pause": [[word, seconds]]): the take is cut after that word, in the breath before
# the next, and the silence added; the line's length and its later words' times move with it (mix.voice cuts the audio)
# SC-225: a negative pause tightens one: that much of the silence is cut round its middle (never more than the silence)
PAUSE = {}
for _l in LINES:
    for _w, _add in _l.get('pause', []):
        _ws = ASR.get(_l['id'], {}).get('words')
        if _ws:
            _k = next(i for i, w in enumerate(_ws) if _norm(w['w']).startswith(_norm(_w)))
            _cut = (_ws[_k]['e'] + _ws[_k + 1]['s']) / 2 if _k + 1 < len(_ws) else _ws[_k]['e']
            assert _add >= 0 or (_k + 1 < len(_ws) and -_add < _ws[_k + 1]['s'] - _ws[_k]['e'] - 0.04), f"{_l['id']}: a pause can't be cut past its silence"
            ASR[_l['id']] = dict(ASR[_l['id']], words=[dict(w, s=w['s'] + _add, e=w['e'] + _add) if w['s'] >= _cut else w for w in _ws])
        else:
            _cut = None
        PAUSE.setdefault(_l['id'], []).append((_cut, _add))
        DUR[_l['id']] = DUR[_l['id']] + _add
LEAD, HOLD = 0.4, 0.08  # cut 10: the voice starts half a second in (cut 15: 0.4); cut 11: the close condensed; cut 15: the card 1.5 s, its line said over it (the QR code is up from its first)
PRE = {'i03': 0.35, 't01': 0.15, 'x26': 0.15, 'n15': 0.1, 'k01': 0.25, 'q01': 0.5, 'm03': 0.4, 's01': 1.05, 'r01': 0.5}   # cut 9: a beat before the brand, under the hood, the live demo (cut 15: 0.15), the landing page (cut 15), the console, Priya's sign-in, the happy path's first step, the sad path and the record
T = {}
_t = LEAD
for _l in LINES:
    _t += PRE.get(_l['id'], 0)
    T[_l['id']] = (_t, _t + DUR[_l['id']])
    _t += DUR[_l['id']] + _l['gap']
END = round(T[LINES[-1]['id']][1] + HOLD, 2)

def norm(w):
    return re.sub(r"[^a-z0-9]", '', w.lower())

def at(lid, word=None, k=0, edge='s'):
    """the film time a word of a line is spoken (Whisper's word times run ~0.1 s early; nudged). Without the take's
    word times, a word's place in the line's text stands in for its time"""
    s0 = T[lid][0]
    if word is None: return s0
    if lid not in ASR:
        text = next(l['text'] for l in LINES if l['id'] == lid)
        ws = text.split(); hits = [i for i, w in enumerate(ws) if norm(w).startswith(norm(word))]
        if not hits: raise KeyError(f'{lid}: {word}')
        i = hits[min(k, len(hits) - 1)]
        return s0 + (T[lid][1] - s0) * len(' '.join(ws[:i])) / max(1, len(text))
    hits = [w for w in ASR[lid]['words'] if norm(w['w']).startswith(norm(word))]
    exact = [w for w in hits if norm(w['w']) == norm(word)]
    hits = exact or hits          # a word as said before a longer one it begins ('1' before '10', 'food' before 'Foods')
    if not hits: raise KeyError(f'{lid}: {word}')
    return s0 + hits[min(k, len(hits) - 1)][edge] + 0.08

# ---------------------------------------------------------------- backgrounds

@lru_cache(maxsize=None)
def studio():
    """the design system's night ground: a deep green-black with soft glows and a faint dot grid"""
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.zeros((H, W, 3), np.float32) + col(C['bg'])
    g1 = np.exp(-(((x - 260) / 900) ** 2 + ((y - 120) / 620) ** 2))[..., None]
    g2 = np.exp(-(((x - 1700) / 1000) ** 2 + ((y - 1050) / 700) ** 2))[..., None]
    img = base + g1 * (col(C['g900']) - col(C['bg'])) * 0.95 + g2 * (col(C['g950']) - col(C['bg'])) * 0.9
    dots = ((x % 36 < 1.6) & (y % 36 < 1.6)).astype(np.float32)[..., None]
    img = img + dots * 0.035
    vign = (1 - 0.35 * (((x - W / 2) / (W * 0.75)) ** 2 + ((y - H / 2) / (H * 0.8)) ** 2)).clip(0.55, 1)[..., None]
    return np.ascontiguousarray((img * vign).astype(np.float32))

class Studio:
    def draw(self, f, u): f[:] = studio()

class Clip:
    """a video clip as the whole frame: retimed (blending neighbouring frames when slowed), graded, with an optional
    scrim behind words; fps is the clip's own, so a 24 fps clip plays frame for frame"""
    def __init__(self, path, start=0.0, speed=1.0, fps=24, scrim=None, grade=1.0, dim=0.0):
        self.src = FrameSource(path, size=(W, H), fps=fps)
        self.src2 = FrameSource(path, size=(W, H), fps=fps)
        self.start, self.speed, self.fps, self.scrim, self.dim = start, speed, fps, scrim, dim
    def draw(self, f, u):
        t = self.start + u * self.speed
        k = t * self.fps
        k0 = math.floor(k + 1e-6)
        a = self.src.get(k0 / self.fps).astype(np.float32)
        fr = k - k0
        if fr > 0.04 and self.speed < 0.995:
            b = self.src2.get((k0 + 1) / self.fps).astype(np.float32)
            a = a * (1 - fr) + b * fr
        f[:] = a / 255.0
        if self.dim: f *= (1 - self.dim)
        if self.scrim: scrim(f, self.scrim)

@lru_cache(maxsize=None)
def scrim_map(kind):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    if kind == 'left': a = (1 - x / (W * 0.62)).clip(0, 1) ** 1.6 * 0.78
    elif kind == 'bottom': a = ((y - H * 0.42) / (H * 0.58)).clip(0, 1) ** 1.3 * 0.8
    elif kind == 'lowleft': a = np.maximum((1 - x / (W * 0.6)).clip(0, 1) ** 1.5 * 0.6, ((y - H * 0.45) / (H * 0.55)).clip(0, 1) ** 1.4 * 0.75)
    elif kind == 'center': a = np.full((H, W), 0.45, np.float32)
    else: a = np.zeros((H, W), np.float32)
    return a[..., None].astype(np.float32)

def scrim(f, kind):
    a = scrim_map(kind)
    f *= (1 - a)
    f += a * col((6, 12, 9))

# ---------------------------------------------------------------- sprites: bars, tags, cards, words

def _lock(d, x, y, s, fill):
    d.rounded_rectangle([x, y + s * 0.45, x + s * 0.8, y + s], radius=s * 0.12, fill=fill)
    d.arc([x + s * 0.15, y, x + s * 0.65, y + s * 0.85], 180, 360, fill=fill, width=max(2, int(s * 0.13)))

@lru_cache(maxsize=None)
def bar_sprite(width, url, bh=44, r=16, light=False):
    """a browser's bar with the page's production address; a narrow window (a phone) drops the window buttons and
    keeps the whole host, shortening the path with an ellipsis if it must"""
    S = 2
    im = Image.new('RGBA', (width * S, bh * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bg = (236, 241, 238, 255) if light else (26, 34, 30, 255)
    d.rounded_rectangle([0, 0, width * S - 1, bh * S + r * S], radius=r * S, fill=bg)
    narrow = width < 600
    if not narrow:
        for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
            cx, cy = (20 + i * 20) * S, bh * S / 2
            d.ellipse([cx - 6 * S, cy - 6 * S, cx + 6 * S, cy + 6 * S], fill=c + (230,))
    host, _, path = url.partition('/')
    path = '/' + path if path else ''
    fs = 17 if not narrow else 14
    room = (width - (160 if not narrow else 24)) - 34 - 14
    hw = text_w(host, 'g', fs, 520)
    while path and hw + text_w(path, 'g', fs, 400) > room:
        path = path[:-2] + '…' if not path.endswith('…') else path[:-2] + '…'
        if len(path) <= 2: path = ''
    tw = hw + text_w(path, 'g', fs, 400) + 34 + 14
    pw = min(room + 48, max(tw, 200 if narrow else 260))
    px0 = (width - pw) / 2 if narrow else max(84, (width - pw) / 2)
    pill = (16, 22, 19, 255) if not light else (255, 255, 255, 255)
    d.rounded_rectangle([px0 * S, 7 * S, (px0 + pw) * S, (bh - 7) * S], radius=(bh - 14) * S / 2, fill=pill)
    ls = 13 if not narrow else 11
    _lock(d, (px0 + 12) * S, (bh / 2 - ls / 2 - 0.5) * S, ls * S, (115, 201, 157, 255))
    x = draw_text(d, ((px0 + 30) * S, (bh / 2 - fs * 0.65) * S), host, 'g', fs * S, (236, 243, 239, 255) if not light else (20, 30, 25, 255), 520)
    if path: draw_text(d, (x, (bh / 2 - fs * 0.65) * S), path, 'g', fs * S, (150, 170, 160, 255) if not light else (90, 110, 100, 255), 400)
    im = im.resize((width, bh), Image.LANCZOS)
    return to_sprite(im)

@lru_cache(maxsize=None)
def avatar_img(path_or_initials, size):
    S = 3
    if path_or_initials.endswith(('.webp', '.png')):
        src = Image.open(path_or_initials).convert('RGB')
        w_, h_ = src.size; m = min(w_, h_)
        src = src.crop(((w_ - m) // 2, 0, (w_ - m) // 2 + m, m)).resize((size * S, size * S), Image.LANCZOS)
    else:
        src = Image.new('RGB', (size * S, size * S), C['g700'])
        d = ImageDraw.Draw(src)
        t = path_or_initials
        f = font('g', int(size * S * 0.4), 640)
        tw = f.getlength(t)
        d.text(((size * S - tw) / 2, size * S * 0.26), t, font=f, fill=(236, 243, 239))
    mask = Image.new('L', (size * S, size * S), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * S - 1, size * S - 1], fill=255)
    out = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)
    ring_ = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
    ImageDraw.Draw(ring_).ellipse([1, 1, size * S - 2, size * S - 2], outline=(115, 201, 157, 255), width=int(2.2 * S))
    out = Image.alpha_composite(out, ring_)
    return out.resize((size, size), Image.LANCZOS)

PEOPLE = REPO / 'design3' / 'system' / 'img' / 'people'

# each name's face is the app's own portrait (design3/system/img/people, SC-194), the same face the film's keyframes
# were made from (their cast sheets), so a tag always shows the person on screen as the app shows them
FACE_OF = {'Priya Deshmukh': 'p-priya', 'Lakshmi Agencies': 'p-lakshmi', 'Rakesh Traders': 'p-rakesh', 'Neha Kulkarni': 'p-neha',
           'Sri Lakshmi Ganapathi Kirana': 'p-lakshmi-ganapathi', 'Agrawal Wholesale': 'p-agrawal', 'Meera': 'p-meera',
           'Meera · Feeding India': 'p-meera'}
FACES = PEOPLE

@lru_cache(maxsize=None)
def tag_sprite(name, role, avatar=None):
    face = FACES / f'{FACE_OF.get(name, "")}.webp'
    av = avatar_img(str(face) if face.exists() else (avatar or ''.join(p[0] for p in name.split()[:2]).upper()), 46)
    S = 2
    w = int(max(text_w(name, 'g', 22, 620), text_w(role, 'g', 16, 420))) + 46 + 14 + 8
    im = Image.new('RGBA', (w * S, 50 * S), (0, 0, 0, 0))
    im.paste(av.resize((46 * S, 46 * S), Image.LANCZOS), (0, 2 * S), av.resize((46 * S, 46 * S), Image.LANCZOS))
    d = ImageDraw.Draw(im)
    draw_text(d, (60 * S, 0), name, 'g', 22 * S, (240, 246, 242, 255), 620)
    draw_text(d, (60 * S, 27 * S), role, 'g', 16 * S, (160, 180, 170, 255), 420)
    return to_sprite(im.resize((w, 50), Image.LANCZOS))

TAGC = {'demo': ((247, 192, 74), (40, 28, 0)), 'live': ((63, 176, 123), (5, 30, 18)), 'agent': ((115, 201, 157), (5, 30, 18)),
        'proof': ((115, 201, 157), (5, 30, 18)), 'result': ((247, 192, 74), (40, 28, 0))}

@lru_cache(maxsize=None)
def card_sprite(title, body='', tag=None, width=360, accent='g'):
    S = 2
    pad = 18
    tl = wrap(title, 'g', 21, 640, width - 2 * pad)
    bl = wrap(body, 'g', 17, 420, width - 2 * pad) if body else []
    th = 28 if tag else 0
    h = pad + th + len(tl) * 27 + (6 + len(bl) * 23 if bl else 0) + pad
    im = Image.new('RGBA', (width * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    edge = (247, 192, 74) if accent == 'a' else (63, 176, 123)
    d.rounded_rectangle([0, 0, width * S - 1, h * S - 1], radius=14 * S, fill=(11, 26, 19, 244), outline=edge + (170,), width=int(1.4 * S))
    d.rounded_rectangle([0, 0, 5 * S, h * S - 1], radius=3 * S, fill=edge + (255,))
    y = pad
    if tag:
        fg, bgc = TAGC.get(tag[0], TAGC['live'])
        tw = text_w(tag[1], 'g', 13, 700, 0.12) + 18
        d.rounded_rectangle([pad * S, y * S, (pad + tw) * S, (y + 21) * S], radius=10 * S, fill=fg + (255,))
        draw_text(d, ((pad + 9) * S, (y + 3) * S), tag[1], 'g', 13 * S, bgc + (255,), 700, 0.12)
        y += th
    for ln in tl:
        draw_text(d, (pad * S, y * S), ln, 'g', 21 * S, (240, 246, 242, 255), 640); y += 27
    if bl:
        y += 6
        for ln in bl:
            draw_text(d, (pad * S, y * S), ln, 'g', 17 * S, (185, 204, 194, 255), 420); y += 23
    return to_sprite(im.resize((width, h), Image.LANCZOS))

@lru_cache(maxsize=None)
def words_sprite(kicker=None, head=None, sub=None, width=620, hsize=52, kcolor='g', align='left', ssize=23, stop=None):
    S = 2
    kl = [kicker] if kicker else []
    hl = wrap(head, 'b', hsize, 760, width) if head else []
    sl = wrap(sub, 'g', ssize, 400, width) if sub else []
    lh = int(hsize * 1.06)
    h = (34 if kl else 0) + len(hl) * lh + (16 + len(sl) * int(ssize * 1.42) if sl else 0) + 12
    im = Image.new('RGBA', (width * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = 0
    def xo(t, k, s, wg, tr=0.0):
        return 0 if align == 'left' else (width - text_w(t, k, s, wg, tr)) / 2
    if kl:
        c = (247, 192, 74) if kcolor == 'a' else (115, 201, 157)
        x_end = draw_text(d, (xo(kicker, 'g', 17, 640, 0.16) * S, y * S), kicker, 'g', 17 * S, c + (255,), 640, 0.16)
        if stop is not None:  # the nine stops, the batch's lit: a small tracker beside the kicker
            x = x_end + 18 * S
            for i in range(9):
                cx, cy = x + i * 15 * S, (y + 9.5) * S
                if i < 8: d.line([cx + 4 * S, cy, cx + 11 * S, cy], fill=(63, 176, 123, 255) if i < stop else (70, 90, 80, 255), width=int(1.6 * S))
                if i == stop:
                    fc = (247, 192, 74, 255) if i == 5 else (52, 211, 128, 255)
                    d.ellipse([cx - 5 * S, cy - 5 * S, cx + 5 * S, cy + 5 * S], fill=fc)
                elif i < stop: d.ellipse([cx - 3.5 * S, cy - 3.5 * S, cx + 3.5 * S, cy + 3.5 * S], fill=(63, 176, 123, 255))
                else: d.ellipse([cx - 3.5 * S, cy - 3.5 * S, cx + 3.5 * S, cy + 3.5 * S], outline=(110, 130, 120, 255), width=int(1.4 * S))
        y += 34
    for ln in hl:
        draw_text(d, (xo(ln, 'b', hsize, 760) * S, y * S), ln, 'b', hsize * S, (244, 248, 245, 255), 760); y += lh
    if sl:
        y += 16
        for ln in sl:
            draw_text(d, (xo(ln, 'g', ssize, 400) * S, y * S), ln, 'g', ssize * S, (190, 208, 198, 255), 400); y += int(ssize * 1.42)
    return to_sprite(im.resize((width, h), Image.LANCZOS))

class Words:
    """kicker, headline and line of words, rising into place and fading out"""
    def __init__(self, x, y, u0, u1, fin=0.5, fout=0.4, rise=14, **kw):
        self.spr = words_sprite(**kw)
        self.x, self.y, self.u0, self.u1, self.fin, self.fout, self.rise = x, y, u0, u1, fin, fout, rise
    def draw(self, f, u, ctx=None):
        a = fade(u, self.u0, self.u1, self.fin, self.fout)
        if a <= 0: return
        dy = self.rise * (1 - ease_out((u - self.u0) / max(1e-3, self.fin)))
        blit(f, self.spr, self.x, self.y + dy, a)

class Sprite:
    def __init__(self, spr, x, y, u0, u1, fin=0.4, fout=0.35, rise=10, scale_in=1.0):
        self.spr, self.x, self.y, self.u0, self.u1, self.fin, self.fout, self.rise, self.si = spr, x, y, u0, u1, fin, fout, rise, scale_in
    def draw(self, f, u, ctx=None):
        a = fade(u, self.u0, self.u1, self.fin, self.fout)
        if a <= 0: return
        e = ease_out((u - self.u0) / max(1e-3, self.fin))
        blit(f, self.spr, self.x, self.y + self.rise * (1 - e), a)

# ---------------------------------------------------------------- a browser window over a recording

BAR = 44

class Window:
    """one device screen of a recording (or a captured sequence) as a browser window: its production address in the bar,
    who is using it above. segs: [(a, b)] source seconds, laid end to end over [u0, u1] at one speed (or `speed`),
    dissolving 0.24 s at each jump. At rest the screen is drawn at scale s from its own pixels, at an integer place;
    the camera (cam keys: (u, zoom, fx, fy) in screen pixels) moves in float pixels."""
    def __init__(self, rec, dev, segs, x, y, s, url, who=None, u0=0.0, u1=None, speed=None, cam=None, view=None,
                 enter=True, seq=None, seq_fps=FPS, fade_out=None, bar=True, radius=None):
        self.rec, self.dev, self.segs, self.x, self.y, self.s, self.url, self.who = rec, dev, segs, x, y, s, url, who
        self.u0, self.u1, self.speed, self.cam, self.enter, self.fade_out, self.bar = u0, u1, speed, cam or [], enter, fade_out, bar
        if seq is not None:
            self.seq, self.seq_fps = seq, seq_fps
            self.sw, self.sh = seq.get_index(0).shape[1], seq.get_index(0).shape[0]
        else:
            self.seq = None
            r = DEV[dev]
            self.sw, self.sh = r[2], r[3]
            self.srcs = [FrameSource(REC[rec], r), FrameSource(REC[rec], r)]
        self.view = view or (0, 0, self.sw, self.sh)
        self.radius = radius if radius is not None else (RADIUS.get(dev, 12) if dev else 12)
        self.w, self.h = round(self.view[2] * s), round(self.view[3] * s)

    # -- time
    def span(self, shot_len):
        return self.u0, (self.u1 if self.u1 is not None else shot_len)

    def seg_durs(self, shot_len):
        """film seconds each segment takes: a third element fixes it; the rest share what is left by source length
        (or play at `speed`)"""
        u0, u1 = self.span(shot_len)
        segs = self.segs
        if self.speed: return [((s[2] if len(s) > 2 else (s[1] - s[0]) / self.speed)) for s in segs]
        fixed = sum(s[2] for s in segs if len(s) > 2)
        free = sum(s[1] - s[0] for s in segs if len(s) == 2)
        left = max(0.1, (u1 - u0) - fixed)
        return [s[2] if len(s) > 2 else (s[1] - s[0]) / free * left for s in segs]

    def src_time(self, u, shot_len):
        """(segment, source time, (previous segment's source time, dissolve progress) or None)"""
        u0, u1 = self.span(shot_len)
        durs = self.seg_durs(shot_len)
        tau, acc = max(0.0, u - u0), 0.0
        for i, (s, d) in enumerate(zip(self.segs, durs)):
            a, b = s[0], s[1]
            if tau < acc + d or i == len(self.segs) - 1:
                into = tau - acc
                t = min(b + 2.0, a + into * (b - a) / d)
                prev = None
                if i > 0 and into < 0.24:
                    pa, pb = self.segs[i - 1][0], self.segs[i - 1][1]
                    prev = (pb + into * (pb - pa) / durs[i - 1], ease_in_out(into / 0.24))
                return i, t, prev
            acc += d
        return len(self.segs) - 1, self.segs[-1][1], None

    def seg_start(self, i, shot_len):
        u0, _ = self.span(shot_len)
        return u0 + sum(self.seg_durs(shot_len)[:i])

    def frame_at(self, i, t):
        if self.seq is not None:
            return self.seq.get_index(round(t * self.seq_fps))
        return self.srcs[i % 2].get(t)

    # -- geometry
    def anim(self, u, shot_len):
        """the entrance: a fade and a rise of a few pixels, never a scale, so the screen lands on its own pixel grid"""
        u0, u1 = self.span(shot_len)
        if self.enter:
            e = ease_out((u - u0) / 0.6)
            a = clamp((u - u0) / 0.35)
            dy = 18 * (1 - e)
        else:
            a, dy = 1.0, 0.0
        if self.fade_out:
            a *= 1 - ramp(u, u1 - self.fade_out, u1)
        return a, 1.0, dy

    def camera(self, u):
        if not self.cam: return 1.0, self.view[0] + self.view[2] / 2, self.view[1] + self.view[3] / 2
        keys = self.cam
        if u <= keys[0][0]: return keys[0][1:]
        for (ua, za, xa, ya), (ub, zb, xb, yb) in zip(keys, keys[1:]):
            if u <= ub:
                p = ease_in_out((u - ua) / max(1e-6, ub - ua))
                return za + (zb - za) * p, xa + (xb - xa) * p, ya + (yb - ya) * p
        return keys[-1][1:]

    def transform(self, u, shot_len):
        """(out rect x0,y0,x1,y1; scale; tx, ty) mapping screen pixels to output pixels"""
        a, k, dy = self.anim(u, shot_len)
        cx, cy = self.x + self.w / 2, self.y + self.h / 2 + dy
        x0, y0, x1, y1 = cx - self.w * k / 2, cy - self.h * k / 2, cx + self.w * k / 2, cy + self.h * k / 2
        z, fx, fy = self.camera(u)
        vx, vy, vw, vh = self.view
        ww, wh = vw / z, vh / z
        wx0 = clamp(fx - ww / 2, vx, vx + vw - ww)
        wy0 = clamp(fy - wh / 2, vy, vy + vh - wh)
        sc = self.s * z * k
        return (x0, y0, x1, y1), sc, x0 - wx0 * sc, y0 - wy0 * sc, a, k

    def to_out(self, u, shot_len, rect):
        (x0, y0, x1, y1), sc, tx, ty, a, k = self.transform(u, shot_len)
        rx, ry, rw, rh = rect
        return (tx + rx * sc, ty + ry * sc, tx + (rx + rw) * sc, ty + (ry + rh) * sc), (x0, y0, x1, y1), a

    def draw(self, f, u, shot_len):
        u0, u1 = self.span(shot_len)
        if u < u0 or u > u1: return
        (x0, y0, x1, y1), sc, tx, ty, a, k = self.transform(u, shot_len)
        if a <= 0.002: return
        bh = BAR * k if self.bar else 0
        r = self.radius * self.s * k + 2
        shadow(f, x0, y0 - bh, x1, y1, max(r, 14), alpha=0.6 * a)
        i, t, prev = self.src_time(u, shot_len)
        img = self.frame_at(i, t)
        rest = self.s if abs(sc - self.s) < 1e-9 else None
        ix0, iy0, patch = place(img, sc, tx, ty, (x0, y0, x1, y1), rest=rest, view=self.view)
        if patch is None: return
        if prev is not None:
            pimg = self.frame_at(i - 1, prev[0])
            _, _, pp = place(pimg, sc, tx, ty, (x0, y0, x1, y1), rest=rest, view=self.view)
            patch = pp * (1 - prev[1]) + patch * prev[1]
        mx0, my0, m = rrect_alpha(x0, y0, x1, y1, r, pad=0, top_r=0 if self.bar else r)
        hh, ww = patch.shape[:2]
        m = m[iy0 - my0: iy0 - my0 + hh, ix0 - mx0: ix0 - mx0 + ww]
        if m.shape[:2] != patch.shape[:2]:
            m = cv2.resize(m, (ww, hh), interpolation=cv2.INTER_NEAREST)
        over(f, ix0, iy0, patch, m * a)
        if self.bar:
            spr = bar_sprite(self.w, self.url, BAR, max(10, int(self.radius * self.s + 4)))
            blit(f, spr, x0, y0 - bh, a, scale=k)
        if self.who:
            blit(f, tag_sprite(*self.who), x0, y0 - bh - 58 * k, a, scale=k)

class Ring:
    """a ring round part of a window's screen, drawn on, with an optional card joined to it by a line"""
    def __init__(self, win, rect, u0, u1, card=None, at=None, pad=8, accent='g', r=12):
        self.win, self.rect, self.u0, self.u1, self.card, self.at, self.pad, self.accent, self.r = win, rect, u0, u1, card, at, pad, accent, r
    def draw(self, f, u, shot_len):
        if u < self.u0 - 0.01 or u > self.u1 + 0.01: return
        (rx0, ry0, rx1, ry1), win_rect, wa = self.win.to_out(u, shot_len, self.rect)
        p = self.pad
        rx0, ry0, rx1, ry1 = rx0 - p, ry0 - p, rx1 + p, ry1 + p
        prog = ease_out((u - self.u0) / 0.5)
        a = fade(u, self.u0, self.u1, 0.15, 0.3) * wa
        color = C['amber2'] if self.accent == 'a' else C['ring']
        ring(f, rx0, ry0, rx1, ry1, self.r, prog=prog, alpha=a, color=color)
        if self.card is not None:
            spr = self.card
            cx, cy = self.at
            ch, cw = spr.shape[0], spr.shape[1]
            ca = fade(u, self.u0 + 0.25, self.u1, 0.35, 0.3) * wa
            e = ease_out((u - self.u0 - 0.25) / 0.45)
            # the line from the card's nearest edge to the ring's nearest edge
            ccx, ccy = cx + cw / 2, cy + ch / 2
            px = clamp(ccx, rx0, rx1); py = clamp(ccy, ry0, ry1)
            if px in (rx0, rx1) or py in (ry0, ry1): pass
            ex = cx + cw if px > cx + cw else cx if px < cx else ccx
            ey = cy + ch if py > cy + ch else cy if py < cy else ccy
            if ca > 0.01:
                q = e
                line(f, (ex, ey), (ex + (px - ex) * q, ey + (py - ey) * q), color, alpha=ca * 0.95, width=2.2)
                blit(f, spr, cx, cy + 8 * (1 - e), ca)

class Rail:
    """the nine stops, as the app's tracker draws them, with the batch's stop lit"""
    STOPS = ['Connect', 'Detect', 'Verify', 'Value', 'Decide', 'Approve', 'Execute', 'Settle', 'Report']
    def __init__(self, x=1188, y=44, step=78):
        self.x, self.y, self.step = x, y, step
        self.cache = {}
    def sprite(self, k, label):
        key = (k, label)
        if key not in self.cache:
            S = 2
            w, h = self.step * 8 + 80, 74
            im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
            d = ImageDraw.Draw(im)
            y0 = 12
            if label:
                draw_text(d, (0, 0), label, 'g', 13 * S, (150, 172, 160, 255), 600, 0.1)
            for i, name in enumerate(self.STOPS):
                cx = (40 + i * self.step) * S; cy = (y0 + 20) * S
                if i < 8:
                    c = (63, 176, 123, 255) if i < k else (60, 78, 69, 255)
                    d.line([cx + 9 * S, cy, cx + (self.step - 9) * S, cy], fill=c, width=int(2 * S))
                if i == k:
                    d.ellipse([cx - 13 * S, cy - 13 * S, cx + 13 * S, cy + 13 * S], fill=(63, 176, 123, 70))
                    fillc = (247, 192, 74, 255) if name == 'Approve' else (52, 211, 128, 255)
                    d.ellipse([cx - 8 * S, cy - 8 * S, cx + 8 * S, cy + 8 * S], fill=fillc)
                elif i < k:
                    d.ellipse([cx - 6 * S, cy - 6 * S, cx + 6 * S, cy + 6 * S], fill=(63, 176, 123, 255))
                else:
                    d.ellipse([cx - 6 * S, cy - 6 * S, cx + 6 * S, cy + 6 * S], outline=(90, 110, 100, 255), width=int(2 * S), fill=(10, 16, 13, 255))
                tw = text_w(name, 'g', 13, 640 if i == k else 440)
                draw_text(d, (cx - tw * S / 2, (y0 + 36) * S), name, 'g', 13 * S, (240, 246, 242, 255) if i == k else (130, 150, 140, 255), 640 if i == k else 440)
            self.cache[key] = to_sprite(im.resize((w, h), Image.LANCZOS))
        return self.cache[key]
    def draw(self, f, t, k, prev_k, p, label, alpha):
        if alpha <= 0: return
        if prev_k is not None and p < 1:
            blit(f, self.sprite(prev_k, label), self.x, self.y, alpha * (1 - p))
            blit(f, self.sprite(k, label), self.x, self.y, alpha * p)
        else:
            blit(f, self.sprite(k, label), self.x, self.y, alpha)


# ---------------------------------------------------------------- chips, the brand, results, the end

@lru_cache(maxsize=None)
def chip_sprite(text, kind='bad', size=24):
    S = 2
    icon = {'bad': '×', 'good': '✓', 'dot': '•'}[kind]
    ic = (229, 92, 74) if kind == 'bad' else (52, 211, 128)
    w = int(text_w(text, 'g', size, 560) + size * 2.6)
    h = int(size * 2.1)
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=(10, 18, 14, 225), outline=ic + (150,), width=int(1.5 * S))
    r = size * 0.55
    cx, cy = h * 0.5, h * 0.5
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=ic + (255,))
    f = font('s', int(size * 0.95 * S), 700)
    iw = f.getlength(icon)
    d.text((cx * S - iw / 2, (cy - size * 0.62) * S), icon, font=f, fill=(255, 255, 255, 255))
    draw_text(d, ((h * 0.5 + r + size * 0.5) * S, (h / 2 - size * 0.62) * S), text, 'g', size * S, (240, 246, 242, 255), 560)
    return to_sprite(im.resize((w, h), Image.LANCZOS))

@lru_cache(maxsize=None)
def mark_sprite(size):
    im = Image.open(HERE / 'build' / 'mark.png').convert('RGBA').crop((16, 16, 496, 496)).resize((size, size), Image.LANCZOS)
    return to_sprite(im)

class Brand:
    """the mark and the name, arriving on a spring, with a line under them"""
    def __init__(self, x, y, u0, u1, sub=None, msize=104, nsize=78):
        self.x, self.y, self.u0, self.u1, self.msize = x, y, u0, u1, msize
        self.mark = mark_sprite(msize)
        self.name = words_sprite(head='Smart-Clearance', width=900, hsize=nsize)
        self.sub = words_sprite(sub=sub, width=900, ssize=30) if sub else None
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.45, 0.4)
        if a <= 0: return
        sp = spring(u - self.u0, zeta=0.7, w=9)
        blit(f, self.mark, self.x + self.msize / 2, self.y + self.msize / 2, a, scale=0.6 + 0.4 * sp, ox=self.msize / 2, oy=self.msize / 2)
        e = ease_out((u - self.u0 - 0.15) / 0.6)
        blit(f, self.name, self.x + self.msize + 30 + 24 * (1 - e), self.y + self.msize / 2 - 46, a * clamp((u - self.u0 - 0.15) / 0.4))
        if self.sub is not None:
            e2 = ease_out((u - self.u0 - 0.55) / 0.6)
            blit(f, self.sub, self.x + 4, self.y + self.msize + 34 + 10 * (1 - e2), a * clamp((u - self.u0 - 0.55) / 0.45))

class Blackout:
    """fade from or to black"""
    def __init__(self, u0, u1, into=False):
        self.u0, self.u1, self.into = u0, u1, into
    def draw(self, f, u, L=None):
        p = ramp(u, self.u0, self.u1)
        a = p if self.into else 1 - p
        if a > 0: f *= (1 - a)

class Badge:
    """a small pill: the fast-forward on a window"""
    def __init__(self, text, x, y, u0, u1):
        self.spr = chip_sprite(text, 'dot', 18); self.x, self.y, self.u0, self.u1 = x, y, u0, u1
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a > 0: blit(f, self.spr, self.x, self.y, a)

def money(v):
    """₹ in Indian grouping"""
    neg = v < 0; v = abs(int(round(v)))
    s_ = str(v)
    if len(s_) > 3:
        head, tail = s_[:-3], s_[-3:]
        parts_ = []
        while len(head) > 2: parts_.insert(0, head[-2:]); head = head[:-2]
        if head: parts_.insert(0, head)
        s_ = ','.join(parts_ + [tail])
    return ('−' if neg else '') + '₹' + s_

class Result:
    """a batch's result: the figure recovered counting up against the bin's, a swing bar, then three facts"""
    def __init__(self, u0, u1, title, got, bin_, swing, facts, fact_at, x=150, y=170):
        self.u0, self.u1, self.got, self.bin, self.swing, self.facts, self.fact_at, self.x, self.y = u0, u1, got, bin_, swing, facts, fact_at, x, y
        self.title = words_sprite(kicker=title, width=1500)
        self.cache = {}
    def num(self, text, size, colr):
        k = (text, size, colr)
        if k not in self.cache:
            S = 2
            w = int(text_w(text, 'b', size, 760) + 20)
            im = Image.new('RGBA', (w * S, int(size * 1.25) * S), (0, 0, 0, 0))
            draw_text(ImageDraw.Draw(im), (0, 0), text, 'b', size * S, colr + (255,), 760)
            self.cache[k] = to_sprite(im.resize((w, int(size * 1.25)), Image.LANCZOS))
        return self.cache[k]
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.4, 0.4)
        if a <= 0: return
        x, y = self.x, self.y
        blit(f, self.title, x, y, a)
        # the two figures
        p = ease_out((u - self.u0 - 0.2) / 1.1)
        got = self.got * p
        blit(f, self.num(money(got), 120, (52, 211, 128)), x, y + 50, a)
        blit(f, words_sprite(sub='recovered for Munchly', width=600, ssize=26), x + 6, y + 210, a)
        q = clamp((u - self.u0 - 0.5) / 0.4)
        blit(f, self.num(money(self.bin), 120, (229, 92, 74)), x + 860, y + 50, a * q)
        blit(f, words_sprite(sub='if it had gone to the bin', width=600, ssize=26), x + 866, y + 210, a * q)
        # the swing, as a bar from the bin's figure to the plan's
        b = ease_in_out((u - self.u0 - 0.9) / 1.0)
        bx0, bx1, by = x, x + 1560, y + 300
        over_bar(f, bx0, by, bx1, by + 14, (40, 52, 46), a)
        zero = bx0 + (bx1 - bx0) * (-self.bin) / (self.got - self.bin)
        over_bar(f, bx0, by, bx0 + (zero - bx0) * min(1, b * 2), by + 14, (229, 92, 74), a)
        if b > 0.5: over_bar(f, zero, by, zero + (bx1 - zero) * (b - 0.5) * 2, by + 14, (52, 211, 128), a)
        if b > 0.05:
            sw = words_sprite(kicker=f'{money(self.swing)} BETTER THAN DESTROYING IT', width=900)
            blit(f, sw, x, by + 34, a * clamp((b - 0.05) / 0.3))
        for i, (txt, kind) in enumerate(self.facts):
            t0 = self.fact_at[i]
            fa = a * clamp((u - t0) / 0.35)
            if fa > 0:
                e = ease_out((u - t0) / 0.5)
                blit(f, chip_sprite(txt, kind, 26), x + i * 0 + (0 if i == 0 else 0), y + 400 + i * 74 + 14 * (1 - e), fa)

def over_bar(f, x0, y0, x1, y1, rgb, a):
    if x1 <= x0 + 0.5: return
    ix0, iy0, m = rrect_alpha(x0, y0, x1, y1, (y1 - y0) / 2, pad=1)
    over(f, ix0, iy0, col(rgb), m * a)

# ---------------------------------------------------------------- the agents at work, and how they sit

AGENT_FRAMES = HERE / 'build' / 'agents'

class AgentsScene:
    """the console's sign-in captured frame-exact at 2x: first as a browser window on production, then opening into the
    agents' orbit, full-bleed, while the walk is retimed so each agent lights as the voice names it (warp: [(u, frame)])"""
    def __init__(self, warp, open_at=(1.4, 3.4)):
        self.seq = Seqs([AGENT_FRAMES], scale=1.0)
        self.warp, self.open_at = warp, open_at
        self.win_s, self.win_x, self.win_y = 0.42, 154, 112
        # the orbit alone (capture px x 240-2080, y 560-1880), framed under the headline and left of the panel
        self.full_s, self.full_o, self.full_to = 0.70, (240, 560), (30, 128)
    def frame_index(self, u):
        w = self.warp
        if u <= w[0][0]: return w[0][1]
        for (ua, fa), (ub, fb) in zip(w, w[1:]):
            if u <= ub: return fa + (fb - fa) * (u - ua) / max(1e-6, ub - ua)
        ua, fa = w[-1]
        return fa + (u - ua) * FPS
    def draw(self, f, u, L=None):
        f[:] = col((5, 9, 7))
        img = self.seq.get_index(round(self.frame_index(u)))
        p = ease_in_out((u - self.open_at[0]) / (self.open_at[1] - self.open_at[0]))
        # the camera: the window's fit to the orbit's framing, then a slow push about the orbit
        s0, s1 = self.win_s, self.full_s
        tx0, ty0 = self.win_x, self.win_y
        tx1, ty1 = self.full_to[0] - self.full_o[0] * s1, self.full_to[1] - self.full_o[1] * s1
        push = 1 + 0.03 * ease_in_out((u - self.open_at[1]) / 18.0)
        sc = s0 + (s1 - s0) * p
        tx, ty = tx0 + (tx1 - tx0) * p, ty0 + (ty1 - ty0) * p
        if push > 1:  # about the orbit's centre in output pixels
            cx, cy = 680, 594
            sc2 = sc * push
            tx, ty = cx - (cx - tx) * push, cy - (cy - ty) * push
            sc = sc2
        # the clip: the window's rect growing to the whole frame
        wx0, wy0 = self.win_x, self.win_y
        wx1, wy1 = wx0 + 3840 * s0, wy0 + 2160 * s0
        cx0, cy0 = wx0 * (1 - p), wy0 * (1 - p)
        cx1, cy1 = wx1 + (W - wx1) * p, wy1 + (H - wy1) * p
        r = 14 * (1 - p)
        if p < 1:
            shadow(f, cx0, cy0 - BAR * (1 - p), cx1, cy1, 16, alpha=0.6 * (1 - p))
        ix0, iy0, patch = place(img, sc, tx, ty, (cx0, cy0, cx1, cy1))
        if patch is None: return
        mx0, my0, m = rrect_alpha(cx0, cy0, cx1, cy1, max(r, 0.01), pad=0, top_r=0 if p < 1 else r)
        hh, ww = patch.shape[:2]
        m = m[iy0 - my0: iy0 - my0 + hh, ix0 - mx0: ix0 - mx0 + ww]
        if m.shape != patch.shape[:2]: m = cv2.resize(m, (ww, hh), interpolation=cv2.INTER_NEAREST)
        over(f, ix0, iy0, patch, m)
        if p < 1:
            blit(f, bar_sprite(round(3840 * s0), 'smartclearance-console.web.app', BAR, 14), cx0, cy0 - BAR * (1 - p), 1 - p)
        if p > 0:  # the page's own title and text above the orbit give way to the headline
            g = (1 - np.clip((np.arange(H, dtype=np.float32) - 60) / 90, 0, 1))[:, None, None] * 0.96 * p
            f *= (1 - g); f += g * col((5, 9, 7))

@lru_cache(maxsize=None)
def arch_sprite(rows, width=500):
    S = 2
    pad = 26
    h = pad + 46 + sum(30 + 23 * len(wrap(b, 'g', 17, 420, width - 2 * pad - 46)) + 14 for _, b in rows) + pad - 14
    im = Image.new('RGBA', (width * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, width * S - 1, h * S - 1], radius=18 * S, fill=(8, 18, 13, 236), outline=(63, 176, 123, 140), width=int(1.4 * S))
    draw_text(d, (pad * S, pad * S), 'HOW THE AGENTS SIT', 'g', 15 * S, (115, 201, 157, 255), 700, 0.16)
    y = pad + 46
    for i, (t, b) in enumerate(rows):
        cx, cy = pad + 13, y + 13
        d.ellipse([(cx - 13) * S, (cy - 13) * S, (cx + 13) * S, (cy + 13) * S], fill=(23, 107, 78, 255))
        n = str(i + 1); fn = font('g', 15 * S, 700)
        d.text(((cx * S) - fn.getlength(n) / 2, (cy - 10) * S), n, font=fn, fill=(236, 243, 239, 255))
        if i < len(rows) - 1:
            d.line([cx * S, (cy + 16) * S, cx * S, (cy + 30 + 23 * len(wrap(b, 'g', 17, 420, width - 2 * pad - 46)) - 2) * S], fill=(23, 107, 78, 255), width=int(2 * S))
        draw_text(d, ((pad + 40) * S, y * S), t, 'g', 21 * S, (240, 246, 242, 255), 640)
        yy = y + 30
        for ln in wrap(b, 'g', 17, 420, width - 2 * pad - 46):
            draw_text(d, ((pad + 40) * S, yy * S), ln, 'g', 17 * S, (180, 200, 190, 255), 420); yy += 23
        y = yy + 14
    return to_sprite(im.resize((width, h), Image.LANCZOS))

class Arch:
    """the architecture panel beside the orbit: its rows arrive one by one; a dark wash hides the sign-in card under it"""
    ROWS = (("Agents, one job each", "Ten Google ADK pipelines on Cloud Run: Data, Watcher, Vision, Valuer, Router, Outreach, Lister, Negotiator, Paperwork, Impact."),
            ("Events, not polling", "Each step is an event on Pub/Sub; an agent wakes, runs once, and reports back."),
            ("Gemini on Vertex AI", "Pro and Flash read labels and receipts and write the words. They never set a price."),
            ("One system of record", "backend-api on Cloud SQL works out every rupee and keeps the audit log."),
            ("One human yes", "Nothing is listed, messaged or shipped until a person approves."))
    def __init__(self, u0, u1, x=1372, y=168):
        self.u0, self.u1, self.x, self.y = u0, u1, x, y
        self.parts_ = [arch_sprite(self.ROWS[:k]) for k in range(1, len(self.ROWS) + 1)]
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.6, 0.4)
        if a <= 0: return
        # the wash
        ys, xs = slice(0, H), slice(1180, W)
        g = np.clip((np.arange(1180, W, dtype=np.float32) - 1180) / 260, 0, 1)[None, :, None] * 0.9 * a
        f[ys, xs] *= (1 - g)
        f[ys, xs] += g * col((5, 10, 8))
        k = int(clamp((u - self.u0) / 0.75, 0, len(self.parts_) - 1))
        e = ease_out((u - self.u0) / 0.6)
        blit(f, self.parts_[k], self.x + 30 * (1 - e), self.y, a)
        if k + 1 < len(self.parts_):
            q = ((u - self.u0) / 0.75) - k
            if q > 0.55:
                blit(f, self.parts_[k + 1], self.x + 30 * (1 - e), self.y, a * smooth((q - 0.55) / 0.45))

class EndCard:
    def __init__(self, u0, u1):
        self.u0, self.u1 = u0, u1
        self.seq = Seqs([AGENT_FRAMES], scale=0.5)
        self.brand = Brand(560, 300, u0 + 0.2, u1 + 5, sub='Ten agents. One yes. Nothing good goes to waste.', msize=112, nsize=84)
        self.urls = [('smartclearance.web.app', 'the platform'), ('smartclearance-console.web.app', 'the console'),
                     ('munchly-smartclearance.web.app', "a client's workspace"), ('smartclearance-demo.web.app', 'the guided demo')]
        self.spr = [url_line(*x) for x in self.urls]
        self.foot = words_sprite(kicker='BUILT ON GEMINI · GOOGLE ADK · CLOUD RUN · FIREBASE · GOOGLE AI HACKATHON 2026', width=1400)
    def draw(self, f, u, L=None):
        if not hasattr(self, 'bgimg'):
            im = self.seq.get_index(700)[260:950, 100:1327]  # the orbit alone: no page title, no sign-in card
            im = cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255.0
            self.bgimg = cv2.GaussianBlur(im, (0, 0), 7)
        img = self.bgimg
        f[:] = img * 0.32 + col((5, 9, 7)) * 0.68
        self.brand.draw(f, u)
        for i, s_ in enumerate(self.spr):
            t0 = self.u0 + 1.2 + i * 0.22
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, 566 + (i % 2) * 420, 590 + (i // 2) * 74 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
        a = clamp((u - self.u0 - 2.4) / 0.6)
        if a > 0: blit(f, self.foot, 566, 790, a)

@lru_cache(maxsize=None)
def url_line(url, what):
    S = 2
    w = 400
    im = Image.new('RGBA', (w * S, 60 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    _lock(d, 0, 6 * S, 16 * S, (115, 201, 157, 255))
    draw_text(d, (26 * S, 0), url, 'g', 22 * S, (240, 246, 242, 255), 560)
    draw_text(d, (26 * S, 30 * S), what, 'g', 17 * S, (150, 172, 160, 255), 420)
    return to_sprite(im.resize((w, 60), Image.LANCZOS))

# ---------------------------------------------------------------- cut 2: the people at work, and their pushes

CLIPDIR = HERE / 'build' / 'slow'

class Character:
    """a person at work: their LTX clip (retimed to the shot by slow.sh) in a rounded panel at its own pixel size, with
    their name above it; until the clip exists, the keyframe on a slow push"""
    def __init__(self, key, x, y, w, h, name, role, u0=0.0, u1=None, kf=None, enter=True, fade_out=None):
        self.key, self.x, self.y, self.w, self.h, self.u0, self.u1, self.enter, self.fade_out = key, x, y, w, h, u0, u1, enter, fade_out
        clip = CLIPDIR / f'{key}.mp4'
        self.src = FrameSource(clip, size=(w, h)) if clip.exists() else None
        if self.src is None:
            path = HERE / 'img' / f'{kf or key}.png'
            im = cv2.imread(str(path)) if path.exists() else np.full((h, w, 3), 40, np.uint8)
            k = max(w / im.shape[1], h / im.shape[0])
            self.kf, self.kk = im, k
        self.tag = tag_sprite(name, role)
    def draw(self, f, u, L):
        u1 = self.u1 if self.u1 is not None else L
        if u < self.u0 or u > u1: return
        a = clamp((u - self.u0) / 0.35) if self.enter else 1.0
        dy = 18 * (1 - ease_out((u - self.u0) / 0.6)) if self.enter else 0.0
        if self.fade_out: a *= 1 - ramp(u, u1 - self.fade_out, u1)
        x0, y0 = self.x, self.y + dy
        shadow(f, x0, y0, x0 + self.w, y0 + self.h, 18, alpha=0.6 * a)
        if self.src is not None:
            img = self.src.get(max(0.0, u - self.u0))
            ix0, iy0, patch = place(img, 1.0, x0, y0, (x0, y0, x0 + self.w, y0 + self.h), rest=1.0, view=(0, 0, self.w, self.h))
        else:
            z = 1.0 + 0.05 * ease_in_out((u - self.u0) / max(1.0, u1 - self.u0))
            s = self.kk * z
            tx, ty = x0 + self.w / 2 - self.kf.shape[1] * s / 2, y0 + self.h / 2 - self.kf.shape[0] * s / 2
            ix0, iy0, patch = place(self.kf, s, tx, ty, (x0, y0, x0 + self.w, y0 + self.h))
        if patch is None: return
        mx0, my0, m = rrect_alpha(x0, y0, x0 + self.w, y0 + self.h, 18, pad=0)
        hh, ww = patch.shape[:2]
        m = m[iy0 - my0: iy0 - my0 + hh, ix0 - mx0: ix0 - mx0 + ww]
        if m.shape != patch.shape[:2]: m = cv2.resize(m, (ww, hh), interpolation=cv2.INTER_NEAREST)
        over(f, ix0, iy0, patch, m * a)
        blit(f, self.tag, x0, y0 - 62, a)

@lru_cache(maxsize=None)
def push_sprite(key, width):
    """the push banner rendered by render-pushes.mjs at 2x (CSS 380 or 460 wide), area-resized once to `width` px"""
    css = 380 if width <= 400 else 460
    im = cv2.imread(str(HERE / 'build' / 'push' / f'{key}-{css}.png'), cv2.IMREAD_UNCHANGED)
    k = width / (css + 44)
    im = cv2.resize(im, (round(im.shape[1] * k / 2), round(im.shape[0] * k / 2)), interpolation=cv2.INTER_AREA)
    a = im.astype(np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    return np.ascontiguousarray(a)

class Push:
    """a push landing on a device window: it drops in at the top of the screen with a spring, holds, and lifts away"""
    def __init__(self, win, key, u0, u1, width=None, dy=10):
        self.win, self.key, self.u0, self.u1, self.dy = win, key, u0, u1, dy
        self.width = width or min(win.w - 4, 470)
    def draw(self, f, u, L):
        if u < self.u0 or u > self.u1: return
        (x0, y0, x1, y1), sc, tx, ty, wa, k = self.win.transform(u, L)
        spr = push_sprite(self.key, self.width)
        p = spring(u - self.u0, zeta=0.78, w=10)
        a = clamp((u - self.u0) / 0.2) * (1 - ramp(u, self.u1 - 0.35, self.u1)) * wa
        lift = 40 * ramp(u, self.u1 - 0.35, self.u1)
        x = x0 + (x1 - x0) / 2 - spr.shape[1] / 2
        y = y0 + self.dy - 60 * (1 - p) - lift
        blit(f, spr, x, y, a)

class Inset:
    """a sharp still (the label photo as sent) in a rounded frame with a caption, rising in"""
    def __init__(self, path, x, y, w, u0, u1, caption=None):
        im = Image.open(path).convert('RGB')
        h = round(w * im.height / im.width)
        im = im.resize((w, h), Image.LANCZOS)
        S = 1
        card = Image.new('RGBA', (w + 16, h + 16 + (40 if caption else 0)), (0, 0, 0, 0))
        d = ImageDraw.Draw(card)
        d.rounded_rectangle([0, 0, card.width - 1, card.height - 1], radius=14, fill=(250, 252, 251, 255))
        mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=8, fill=255)
        card.paste(im, (8, 8), mask)
        if caption: draw_text(d, (12, h + 18), caption, 'g', 17, (30, 50, 40, 255), 600)
        self.spr, self.x, self.y, self.u0, self.u1 = to_sprite(card), x, y, u0, u1
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.4, 0.3)
        if a <= 0: return
        e = ease_out((u - self.u0) / 0.6)
        shadow(f, self.x, self.y + 14 * (1 - e), self.x + self.spr.shape[1], self.y + self.spr.shape[0] + 14 * (1 - e), 14, alpha=0.55 * a)
        blit(f, self.spr, self.x, self.y + 14 * (1 - e), a)

@lru_cache(maxsize=None)
def live_sprite():
    S = 2
    t = 'LIVE ON PRODUCTION · CLOUD RUN · GEMINI'
    w = int(text_w(t, 'g', 14, 680, 0.12) + 44); h = 32
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=h * S / 2, fill=(8, 20, 14, 225), outline=(63, 176, 123, 150), width=int(1.3 * S))
    d.ellipse([12 * S, 11 * S, 22 * S, 21 * S], fill=(239, 68, 68, 255))
    draw_text(d, (30 * S, 7.5 * S), t, 'g', 14 * S, (225, 240, 232, 255), 680, 0.12)
    return to_sprite(im.resize((w, h), Image.LANCZOS))

class LiveTag:
    """a steady tag in the top-right corner through the live part of the film; it fades only where the live part
    starts and ends (fin/fout), so it stays still through the dissolves between shots"""
    def __init__(self, fin=False, fout=False):
        self.fin, self.fout = fin, fout
    def draw(self, f, u, L):
        a = 1.0
        if self.fin: a *= clamp(u / 0.5)
        if self.fout: a *= 1 - ramp(u, L - 0.9, L - 0.4)
        spr = live_sprite()
        blit(f, spr, W - 40 - spr.shape[1], 36, a)
