"""SC-219 cut 11: the film's sound, on the voice's own clock (parts.T), muxed under cut 11's silent picture (render11.py).
Cut 11 gives the 2D architecture (arch11) its own sounds (DREAM_SOUND: water, woody knocks, a pen, glass bells, a melting
tone, a kalimba for the lanterns, dry blips for the Watcher, rain, a drawer, a star, glass notes for the rays, a coin, a
glass chime) and paces the bin's GST sounds with its stack. Cut 10 adds the architecture's camera moves (a soft whoosh each), the rise into its last shot and the impact as the
whole platform lights, and the use cases' stamp ("imaginary brand"). Cut 9's, below:
Cut 8's sound (below), with cut 9's: the four scene pages' own events (what it is, under the hood, the cast, the
install), the iris's rise and glint, the rise under the hood, the sign-in's press, and a tick as each tracked row lights.


The voice, its chain and the music bed are cut 7's (mix.py: the Maya1 take, SC-187's felt-piano bed looped and ducked,
its lift for the close). The sound design is cut 8's, placed from the cut's own shots (shots8), so a re-timed cut keeps
its sounds on their marks:
- a soft whoosh under each push from one shot to the next, a swish and a tick as a wipe's light line crosses;
- the architecture's own events (the page names them as it is captured: build/arch8/events.json), voiced as the
  7-minute landing film voiced its pages (SC-211's mix11.PAGE_SOUND, with the few this page adds);
- in the walkthrough: a click under each button press the screens show (found frame by frame on the recordings), a
  rising tick as each hop of a step lights, a swoosh as data flies and a soft landing tone where it lands, and cut 7's
  sounds for its panels (the maps, the ladder, the checks, the signatures, the ledger);
- one loudness pass (two-pass loudnorm to -14 LUFS, true peak -1.5 dB), then the mux, and an .srt of the narration.
  .venv/bin/python mix11.py [--preview]"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mix as M
from mix import (SR, N, B, db, run, whoosh, riser, boom, shutter, chime, tick, glint, thud, click, notif, sparkle, Air)
import parts as P_

# confirmed clicks in the recordings (clicks8.py found them, each checked on a 10 fps strip): (recording, device, seconds)
CLICKS = [('mango', 'P', 6.62), ('mango', 'P', 200.3), ('mango', 'P', 209.7), ('mango', 'L', 111.8), ('mango', 'L', 113.16), ('mango', 'L', 749.72),
          ('mango', 'L', 750.92), ('mango', 'H', 246.9), ('mango', 'H', 527.0), ('mango', 'H', 534.34), ('mango', 'H', 541.65),
          ('sad', 'H', 260.04), ('sad', 'H', 433.72), ('sad', 'H', 459.92), ('sad', 'L', 561.18), ('sad', 'L', 573.72),
          ('sad', 'L', 574.94), ('sad', 'L', 578.56), ('sad', 'L', 589.44), ('sad', 'L', 623.08), ('sad', 'P', 721.75),
          ('admin', 'A', 105.04), ('mango', 'P', 599.8), ('sad', 'L', 656.4), ('sad', 'P', 853.8), ('sad', 'P', 863.5),
          ('admin', 'A', 104.3)]
# the pushes the recordings themselves show arriving on a device (the Watcher's alert, the plan ready, expiry day)
RECORDED_PUSHES = [('mango', 'P', 89.7), ('mango', 'P', 161.9), ('sad', 'L', 551.1)]
# the scrolls the screens glide through (clicks8.py, by phase correlation; the ones under a press left out)
SCROLLS = [('admin', 'A', 106.88, 107.24), ('mango', 'P', 171.64, 172.2), ('sad', 'L', 589.24, 589.56),
           ('sad', 'P', 863.44, 863.84), ('sad', 'H', 432.32, 432.84)]


def uiclick(level=-24):
    """a click on a button: a tiny bright tap and a short high tick (SC-211)"""
    c = click(level); t_ = tick(level - 4, 2200.0)
    out = np.zeros(max(len(c), len(t_)), np.float32); out[:len(c)] += c; out[:len(t_)] += t_
    return out


def pop(level=-27):
    """a card opening: a quick upward sine bloop with a soft tail (SC-211)"""
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 520 + 420 * (1 - np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.05)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def clink(level=-28):
    """a lock or a shield landing: two high partials, a metallic clink (SC-211)"""
    n = int(0.5 * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 2637 * t) + 0.7 * np.sin(2 * np.pi * 3951 * t) + 0.3 * np.sin(2 * np.pi * 5274 * t)) * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.09)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def gate(level=-22):
    """a person's yes: a low swell and a warm two-note chime (SC-211)"""
    lo = boom(1.2, level, 92.0, 48.0); ch = chime(level - 3, notes=((783.99, 0.05), (1174.66, 0.16)))
    out = np.zeros(max(len(lo), len(ch)), np.float32); out[:len(lo)] += lo; out[:len(ch)] += ch
    return out


def scroll(rnd, d, level=-33):
    """a screen gliding under a finger: a soft brush of air with the faint ticks of a wheel"""
    d = max(0.25, d); n = int(d * SR); t = np.arange(n) / SR
    from mix import _sweep, PINK_B, PINK_A
    from scipy.signal import lfilter
    pink = lfilter(PINK_B, PINK_A, rnd.standard_normal(n).astype(np.float32))
    y = _sweep(pink, np.full(n, 0.12))
    env = np.clip(t / 0.06, 0, 1) * np.clip((d - t) / 0.12, 0, 1)
    y = y / (np.abs(y).max() + 1e-6) * env
    for k in range(int(d / 0.07)):
        i = int(k * 0.07 * SR); tk = tick(-12, 2600.0)[: n - i]
        y[i:i + len(tk)] += tk * 0.35 * env[i:i + len(tk)]
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def land(level=-29):
    """data arriving where it is kept: a soft low pluck under a short high glint"""
    n = int(0.6 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 392 * t) * (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.12) + 0.45 * np.sin(2 * np.pi * 1568 * t) * np.exp(-t / 0.06)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


# cut 11: the dreamscape's own sounds (arch11), airy and pitched: water, glass, bells, a kalimba's lanterns
PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1568.0, 1760.0, 2093.0]   # C major pentatonic, from C5


def _env(t, a, d):
    return (1 - np.exp(-t / a)) * np.exp(-t / d)


def _norm(y, level):
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def _mixs(*ys):
    out = np.zeros(max(len(y) for y in ys), np.float32)
    for y in ys: out[:len(y)] += y
    return out


def water(p=0, level=-28):
    """something rising out of the lake: a round drop, a sine bending up, and a little splash"""
    n = int(0.5 * SR); t = np.arange(n) / SR; f0 = 380 * 2 ** (p * 2 / 12)
    f = f0 + f0 * 1.6 * (1 - np.exp(-t / 0.035))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(t, 0.002, 0.07)
    nz = np.convolve(np.random.default_rng(int(p) + 5).standard_normal(n), np.ones(8) / 8, 'same') * _env(t, 0.004, 0.05) * 0.5
    return _norm(y + nz, level)


def bell(p=0, level=-29):
    """a paper boat setting off: a soft glass bell, each boat a third above the one before"""
    n = int(1.4 * SR); t = np.arange(n) / SR; f = [783.99, 987.77, 1174.66][int(p) % 3]
    y = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.08)) * _env(t, 0.002, 0.5)
    return _norm(y, level)


def lantern(p=0, level=-28):
    """a lantern rising: a kalimba's note, one step up the pentatonic scale for each lantern"""
    n = int(1.1 * SR); t = np.arange(n) / SR; f = PENTA[int(p) % len(PENTA)]
    y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.06)) * _env(t, 0.0015, 0.35)
    return _norm(y, level)


def code(level=-27):
    """the Watcher, plain code: two dry digital blips, no tail, nothing musical"""
    n = int(0.2 * SR); t = np.arange(n) / SR
    y = np.sign(np.sin(2 * np.pi * 1320 * t)) * 0.5 * (((t < 0.04) | ((t > 0.08) & (t < 0.115))).astype(np.float32)) * np.exp(-t / 0.2)
    return _norm(np.convolve(y, np.ones(6) / 6, 'same'), level)


def stone(p=0, level=-27):
    """a stone tablet settling on the air: a low, woody knock"""
    n = int(0.35 * SR); t = np.arange(n) / SR; f = 180 * 2 ** (p * 3 / 12)
    y = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * _env(t, 0.002, 0.07)
    return _norm(y, level)


def write(level=-31):
    """a line written on the record: a short scratch, a pen's strokes in filtered noise"""
    n = int(0.42 * SR); t = np.arange(n) / SR; nz = np.random.default_rng(23).standard_normal(n)
    y = (M._sweep(nz, 0.08 + 0.25 * t / t[-1]) - M._sweep(nz, 0.02 + 0.06 * t / t[-1])) * _env(t, 0.03, 0.3) * (1 + 0.6 * np.sin(2 * np.pi * 26 * t))
    return _norm(y, level)


def melt(level=-29):
    """the clock melting: a soft tone that sags a fifth, with a slow vibrato"""
    n = int(1.4 * SR); t = np.arange(n) / SR
    k = np.clip(t / 1.2, 0, 1); f = 660 * 2 ** (-7 / 12 * (k * k * (3 - 2 * k))) * (1 + 0.012 * np.sin(2 * np.pi * 5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return _norm((np.sin(ph) + 0.2 * np.sin(2 * ph)) * _env(t, 0.08, 0.8), level)


def rain(level=-31):
    """BigQuery's rain of sales: soft drops, pitched at random, for a second and a half"""
    rnd = np.random.default_rng(29); n = int(1.8 * SR); y = np.zeros(n, np.float32); m = int(0.05 * SR); tt = np.arange(m) / SR
    for _ in range(46):
        at = rnd.uniform(0, 1.5); f = rnd.uniform(1400, 3200); i0 = int(at * SR)
        y[i0:i0 + m] += (np.sin(2 * np.pi * (f + 2000 * tt) * tt) * np.exp(-tt / 0.012) * rnd.uniform(0.3, 1.0))[: n - i0]
    t = np.arange(n) / SR; y *= np.clip(t / 0.15, 0, 1) * np.clip((1.8 - t) / 0.4, 0, 1)
    return _norm(y, level)


def drawer(level=-28):
    """a drawer sliding open: a low wooden rumble, then a soft knock"""
    n = int(0.6 * SR); t = np.arange(n) / SR; nz = np.random.default_rng(31).standard_normal(n)
    y = _norm(M._sweep(nz, 0.01 + 0.03 * t / t[-1]) * np.clip(t / 0.05, 0, 1) * np.clip((0.4 - t) / 0.1, 0, 1), level + 2)
    k = stone(1, level); i = int(0.38 * SR); y[i:i + len(k)] += k[: n - i]
    return y


def star(level=-25):
    """Gemini's star: a bright cluster of bells over a low bloom"""
    n = int(2.2 * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * a * np.exp(-t / d) for f, a, d in [(1046.5, 1, 0.9), (1568, 0.7, 0.7), (2093, 0.5, 0.5), (2637, 0.35, 0.35), (3136, 0.25, 0.25)])
    return _mixs(_norm(y * (1 - np.exp(-t / 0.01)), level), boom(1.6, level - 2, 70.0, 46.0))


def ray(p=0, level=-31):
    """Gemini's light reaching an agent: a short glass note, lower for Pro, higher for Flash"""
    n = int(0.8 * SR); t = np.arange(n) / SR; pro = p < 10
    f = [659.25, 783.99, 987.77][int(p) % 3] if pro else [1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0][int(p - 10) % 6]
    return _norm((np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t)) * _env(t, 0.004, 0.22 if pro else 0.14), level)


def coin(level=-27):
    """the money: a coin's bright ring"""
    n = int(1.0 * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * a * np.exp(-t / d) for f, a, d in [(2489, 1, 0.35), (3729, 0.6, 0.25), (5590, 0.35, 0.12), (1244, 0.3, 0.2)])
    return _norm(y * (1 - np.exp(-t / 0.0015)), level)


def zap(level=-32):
    """the light reaching for the money: a thin, rising shimmer"""
    n = int(0.7 * SR); t = np.arange(n) / SR; f = 900 + 1500 * t / 0.7
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.5 * np.sin(2 * np.pi * 30 * t)) * _env(t, 0.1, 0.4), level)


def glass(level=-27):
    """the glass landing: a high glassy chime, its pairs of partials beating"""
    n = int(1.4 * SR); t = np.arange(n) / SR
    return _norm(sum(np.sin(2 * np.pi * f * t) * a for f, a in [(2793.8, 1), (2801.0, 0.8), (4186, 0.5), (4199, 0.4), (5588, 0.25)]) * _env(t, 0.002, 0.45), level)


def compute(level=-33):
    """the API working out the figure: quick soft ticks, climbing"""
    n = int(0.9 * SR); y = np.zeros(n, np.float32)
    for k in range(12):
        tk = tick(level, 900 * 2 ** (k / 12)); i = int(k * 0.065 * SR); y[i:i + len(tk)] += tk[: n - i]
    return y


DREAM_SOUND = {   # the architecture's events (arch11), each given its event (its pitch step in 'p')
    'descend': lambda r, e: whoosh(r, 2.6, 0.35, -27, 0.03, 0.2).view(Air),
    'water': lambda r, e: water(e.get('p', 0), -28),
    'moon': lambda r, e: _mixs(glint(-31), bell(2, -33)),
    'flame': lambda r, e: boom(0.6, -27, 120.0, 70.0),
    'emerge': lambda r, e: _mixs(boom(1.1, -25, 70.0, 44.0), water(0, -29)),
    'stone': lambda r, e: stone(e.get('p', 0), -28),
    'write': lambda r, e: write(-31),
    'bell': lambda r, e: bell(e.get('p', 0), -29),
    'melt': lambda r, e: melt(-29),
    'lantern': lambda r, e: lantern(e.get('p', 0), -28),
    'code': lambda r, e: code(-28),
    'rain': lambda r, e: rain(-31),
    'drawer': lambda r, e: drawer(-28),
    'swell': lambda r, e: riser(r, 1.2, -31).view(Air),
    'star': lambda r, e: star(-25),
    'ray': lambda r, e: ray(e.get('p', 0), -31),
    'coin': lambda r, e: coin(-28),
    'zap': lambda r, e: zap(-32),
    'glass': lambda r, e: glass(-27),
    'compute': lambda r, e: compute(-33),
}


PAGE_SOUND = {
    'whoosh_in': lambda r: whoosh(r, 0.8, 0.45, -27).view(Air), 'whoosh': lambda r: whoosh(r, 1.1, 0.5, -26).view(Air),
    'sweep': lambda r: whoosh(r, 0.9, 0.55, -29, 0.03, 0.35).view(Air), 'title': lambda r: glint(-31),
    'drop': lambda r: pop(-27), 'thump': lambda r: boom(0.7, -25, 92.0, 54.0), 'ping': lambda r: tick(-31, 1760.0),
    'topic': lambda r: tick(-33, 1318.5), 'clock': lambda r: tick(-31, 659.25), 'tick': lambda r: tick(-32, 1318.5),
    'ignite': lambda r: glint(-35), 'chime_pro': lambda r: chime(-29, ((783.99, 0.0), (1174.66, 0.08))),
    'chime_flash': lambda r: chime(-31, ((1318.5, 0.0), (1975.5, 0.07))), 'boom': lambda r: boom(1.6, -21, 70.0, 40.0),
    'badge': lambda r: chime(-31, ((1567.98, 0.0), (2093.0, 0.08))), 'card': lambda r: pop(-28), 'lock': lambda r: clink(-28),
    'click': lambda r: uiclick(-23), 'gate': lambda r: gate(-23),
    'glint': lambda r: glint(-30), 'pop': lambda r: pop(-27), 'sparkle': lambda r: sparkle(0.6, 12, -34).view(Air),
    'notif': lambda r: notif(-24),
    'move': lambda r: whoosh(r, 0.7, 0.45, -31, 0.03, 0.35).view(Air), 'rise': lambda r: riser(r, 0.8, -29).view(Air),
    'impact': lambda r: boom(1.8, -22, 62.0, 38.0), 'stamp': lambda r: thud(-18),
}


def sfx():
    out = np.zeros((N, 2), dtype=np.float32); air = np.zeros((N, 2), dtype=np.float32); rnd = np.random.default_rng(218)
    import shots11 as S_, parts3 as P3_, parts4 as P4_, parts5 as P5_, parts6 as P6_, parts7 as P7_, parts8 as P8_, parts9 as P9_
    shots = S_.build(); sh = {s.name: s for s in shots}

    def lay(y, t, pan=0.5, anchor=0.0):
        i0 = int((t - anchor) * SR)
        if i0 < 0: y = y[-i0:]; i0 = 0
        seg = np.asarray(y[: max(0, N - i0)])
        bus = air if isinstance(y, Air) else out
        bus[i0:i0 + len(seg), 0] += seg * np.sqrt(1 - pan) * 1.41; bus[i0:i0 + len(seg), 1] += seg * np.sqrt(pan) * 1.41
    W_ = lambda *a, **k: whoosh(*a, **k).view(Air)
    R_ = lambda *a, **k: riser(*a, **k).view(Air)
    SP_ = lambda *a, **k: sparkle(*a, **k).view(Air)

    # the transitions: a push's whoosh peaks as the frame travels fastest; a wipe's swish, and a tick as its line crosses
    for s in shots:
        if s.xin == 'push':
            lay(W_(rnd, 0.95, 0.42, -25, 0.03, 0.4), s.t0 + 0.3, pan=0.7 if s.xdir > 0 else 0.3, anchor=0.4)
        elif s.xin == 'wipe':
            lay(W_(rnd, 0.8, 0.5, -27, 0.05, 0.5), s.t0 + 0.28, pan=0.5, anchor=0.4)
            lay(tick(-31, 1975.5), s.t0 + 0.28, pan=0.5)
        elif s.xin == 'iris':        # the brand's squircle opens: a short rise into it, a glint on its rim
            lay(R_(rnd, 0.7, -29), s.t0 + 0.55, anchor=0.7)
            lay(glint(-30), s.t0 + 0.35, pan=0.5)
        elif s.xin == 'up':          # under the hood: the next shot rises from below
            lay(W_(rnd, 1.0, 0.45, -25, 0.03, 0.4), s.t0 + 0.35, pan=0.5, anchor=0.45)
    # the opening: the swell into the cut, the stamps, the calendar, the statement, the hit on the cut to the label
    og = sh['open-godown']
    lay(R_(rnd, 2.6, -30), og.t1, anchor=2.6)
    for k, (_, u_, kind) in enumerate(getattr(og, 'stamps', [])):
        lay(thud(-16) if kind == 'big' else thud(-27), og.t0 + u_, pan=(0.62 + 0.06 * k) if kind == 'big' else (0.55 + 0.03 * k))
    lay(SP_(1.2, 16, -38, seed=91), og.t0 + 0.35, pan=0.6)
    for it in og.items:
        if isinstance(it, P7_.DateTicker):
            last = 0
            for k in range(1, 600):
                u = it.c0 + (it.c1 - it.c0) * k / 600
                day = int(round(31 * P7_.ease_in_out(min(1.0, max(0.0, (u - it.c0) / (it.c1 - it.c0))))))
                if day != last: lay(tick(-41, 1760 + 8 * day), og.t0 + u, pan=0.2); last = day
            lay(tick(-30, 523), og.t0 + it.c1 + 0.05, pan=0.2)
        if isinstance(it, P7_.Statement):
            for j, ln_ in enumerate(it.lines): lay(thud(-27 + j), og.t0 + ln_[3], pan=0.35)
    lab = sh['open-label']
    lay(boom(0.6, -24, 110.0, 60.0), lab.t0, pan=0.5)
    for it in lab.items:
        if type(it).__name__ == 'Countdown': lay(glint(-31), lab.t0 + it.u0, pan=0.3)
    ol = sh['open-landfill']
    for it in ol.items:
        if isinstance(it, P6_.CostStack):
            for i, (t_, row) in enumerate(zip(it.times, it.ROWS)):
                lay(tick(-30, 659 * 2 ** (i * 2 / 12)), ol.t0 + t_ + 0.02, pan=0.3 + 0.1 * i)
                if row[3]:   # the GST credit struck out, then taken back, at the stack's own pace
                    lay(W_(rnd, 0.45, 0.4, -31, 0.06, 0.3), ol.t0 + t_ + 0.6 * it.k, pan=0.4, anchor=0.15)
                    lay(tick(-28, 440), ol.t0 + t_ + 1.17 * it.k, pan=0.4)
            lay(boom(0.9, -23, 80, 50), ol.t0 + it.u_total)
        if isinstance(it, P7_.ESGPanel):
            for i, r in enumerate(it.rows): lay(tick(-31, 587 * 2 ** (-i * 2 / 12)), ol.t0 + r[3] + 0.02, pan=0.7)
            lay(glint(-34), ol.t0 + it.u_foot + 0.05, pan=0.75)
    # the scene pages: their own events (what it is, under the hood, the live demo's two paths and its people, the install)
    for name, folder in (('saas', S_.SAAS), ('arch', S_.ARCH), ('cast', S_.CAST), ('install', S_.PWA)):
        sp = sh[name]
        for e in json.loads((folder / 'events.json').read_text()):
            kind = e.get('type') or e.get('kind')
            if name == 'arch' and kind in DREAM_SOUND:
                lay(DREAM_SOUND[kind](rnd, e), sp.t0 + e['t'], e.get('pan', 0.5)); continue
            f_ = PAGE_SOUND.get(kind)
            if f_ is not None: lay(f_(rnd), sp.t0 + e['t'], e.get('pan', 0.5))
    # the walkthrough's parts
    for s in shots:
        L = s.t1 - s.t0
        for it in s.items:
            if isinstance(it, P6_.AgentHead):
                for j, (ub, key, calls) in enumerate(it.beats):
                    if j > 0: lay(tick(-31, 1046 + 70 * j), s.t0 + ub, pan=0.25)
                    for i in range(len(calls)): lay(tick(-36, 1568), s.t0 + ub + 0.35 + i * it.call_gap, pan=0.2)
            if isinstance(it, P5_.TechTag): lay(glint(-37), s.t0 + it.u0 + 0.05, pan=0.8)
            if isinstance(it, P4_.Checklist):
                for k, (_, _, u0) in enumerate(it.items): lay(tick(-30, 990 + 120 * k), s.t0 + u0 + 0.12, pan=0.35)
            if isinstance(it, P9_.TrackList):
                for k, t in enumerate(it.times): lay(tick(-31, 784 * 2 ** (k * 2 / 12)), s.t0 + t + 0.02, pan=0.25)
            if isinstance(it, P8_.StepFlow):
                for k, t in enumerate(it.times): lay(tick(-32, 880 * 2 ** (k * 2 / 12)), s.t0 + t, pan=0.75 if it.x > 900 else 0.25)
            if isinstance(it, P8_.DataFly):
                lay(W_(rnd, it.dur + 0.2, 0.55, -27, 0.04, 0.45), s.t0 + it.t0, pan=0.5, anchor=0.05)
                lay(land(-27), s.t0 + it.t_land, pan=0.4)
            if isinstance(it, P8_.ServiceBadge):
                for t in it.lands: lay(clink(-31), s.t0 + t + 0.02, pan=0.3)
            if isinstance(it, P6_.TracePanel): lay(SP_(1.4, 22, -36), s.t0 + it.u_play, pan=0.75)
            if isinstance(it, P6_.LogPanel):
                for i in range(len(it.rows)): lay(tick(-34, 1318), s.t0 + it.u0 + 0.2 + i * it.gap, pan=0.7)
            if isinstance(it, P6_.TraceLink): lay(glint(-33), s.t0 + it.u0 + 0.45, pan=0.65)
            if isinstance(it, P7_.KiranaMap):
                if it.u_offer is not None: lay(W_(rnd, 0.9, 0.5, -30, 0.03, 0.3), s.t0 + it.u_offer, pan=0.3, anchor=0.2)
                for t in sorted(t for (st, t) in it.states.values() if st == 'ordered' and t is not None and t > 0):
                    lay(tick(-38, 1318 * 2 ** (int(rnd.integers(0, 5)) * 2 / 12)), s.t0 + t, pan=0.15 + 0.3 * rnd.random())
                for t in sorted(t for (st, t) in it.states.values() if st == 'declined'): lay(tick(-40, 392), s.t0 + t, pan=0.2)
            if isinstance(it, P7_.InvoiceStack):
                for j in range(8): lay(tick(-40, 2093), s.t0 + it.u0 + 0.05 + j * 0.17, pan=0.25)
            if isinstance(it, P7_.ExpireSoonCard): lay(glint(-33), s.t0 + it.u0 + 0.1, pan=0.3)
            if isinstance(it, P7_.PriceLadder):
                lay(tick(-31, 988), s.t0 + it.ul + 0.05, pan=0.35); lay(tick(-31, 659), s.t0 + it.ub + 0.05, pan=0.3)
                lay(W_(rnd, 0.6, 0.4, -31, 0.05, 0.4), s.t0 + it.uc, pan=0.35, anchor=0.15)
                lay(chime(-27, notes=((1046.5, 0.0), (1318.5, 0.08), (1568.0, 0.16))), s.t0 + it.ud + 0.05, pan=0.35)
                lay(boom(0.9, -26, 80, 50), s.t0 + it.ud + 0.05)
            if isinstance(it, P7_.WindowFunnel):
                for i in range(len(it.ROWS)): lay(tick(-31, 784 * 2 ** (-i * 3 / 12)), s.t0 + it.u0 + 0.3 + i * 0.5, pan=0.3)
                lay(click(-25), s.t0 + it.u0 + 1.0, pan=0.25)
            if isinstance(it, P7_.ProofPlan):
                lay(W_(rnd, 2.2, 0.6, -33, 0.02, 0.2), s.t0 + it.u0 + 0.5, pan=0.65, anchor=0.2)
                for i in range(len(it.STEPS)): lay(tick(-31, 880 + 80 * i), s.t0 + it.u0 + 0.9 + i * 0.55, pan=0.7)
            if isinstance(it, P7_.SignSlots):
                for i in range(len(it.SIGNERS)):
                    t = it.u0 + 0.35 + i * (it.each + 0.12)
                    lay(SP_(it.each, 9, -41, seed=95 + i), s.t0 + t, pan=0.7)
                    lay(tick(-33, 1046), s.t0 + t + it.each + 0.02, pan=0.7)
            if isinstance(it, P7_.ChecksPanel):
                for i in range(len(it.CHECKS)): lay(tick(-31, 988 + 110 * i), s.t0 + it.u0 + 0.25 + i * 0.32, pan=0.5)
                if it.uy < L: lay(chime(-28), s.t0 + it.uy + 0.05, pan=0.3)
            if isinstance(it, P7_.SellThrough):
                lay(tick(-31, 784), s.t0 + it.u0 + 0.3, pan=0.3); lay(tick(-31, 523), s.t0 + it.u0 + 0.8, pan=0.3)
            if isinstance(it, P7_.DonationMeals): lay(SP_(1.6, 26, -39, seed=97), s.t0 + it.u0 + 0.3, pan=0.25)
            if isinstance(it, P7_.KiloBars):
                for i in range(len(it.ROWS)): lay(tick(-31, 784 + 90 * i), s.t0 + it.u0 + 0.3 + i * 0.35, pan=0.25)
                lay(glint(-34), s.t0 + it.u0 + 1.6, pan=0.25)
            if isinstance(it, P3_.Payments):
                for i in range(18): lay(tick(-38, 1568 + 30 * (i % 5)), s.t0 + it.u0 + 0.3 + i * it.every, pan=0.8)
                lay(chime(-28), s.t0 + it.u0 + 0.3 + 18 * it.every + 0.1, pan=0.8)
            if isinstance(it, P8_.Walk) and it.seq is None:
                durs = it.seg_durs(L)
                def fast(rt):   # a press inside a fast-forward is not voiced: it flies past
                    return any(a_ <= rt <= b_ and (b_ - a_) / d_ > 3 for (a_, b_, *_), d_ in zip(it.segs, durs))
                for rec, dev, rt in CLICKS:
                    if rec != it.rec or dev != it.dev or fast(rt): continue
                    try: u = it.u_of(rt, L)
                    except ValueError: continue
                    if 0.05 < u < L - 0.05: lay(uiclick(-22), s.t0 + u, pan=0.6)
                for rec, dev, rt in RECORDED_PUSHES:
                    if rec != it.rec or dev != it.dev: continue
                    try: u = it.u_of(rt, L)
                    except ValueError: continue
                    if 0.0 < u < L - 0.05: lay(notif(-24), s.t0 + u, pan=0.62)
                for rec, dev, ra, rb in SCROLLS:
                    if rec != it.rec or dev != it.dev: continue
                    try: ua, ub = it.u_of(ra, L), it.u_of(rb, L)
                    except ValueError: continue
                    if 0.0 < ua < L - 0.1: lay(scroll(rnd, ub - ua, -31).view(Air), s.t0 + ua, pan=0.6)
            if isinstance(it, P8_.PushOut):
                lay(notif(-24), s.t0 + it.u_drop + (0.05 if it.own else 0.0), pan=0.62)
                lay(W_(rnd, 0.75, 0.5, -29, 0.04, 0.4), s.t0 + it.u_lift, pan=0.4, anchor=0.15)
            if type(it).__name__ == 'Push':
                lay(notif(-24), s.t0 + it.u0 + 0.05, pan=0.62)
        g = s.bg
        if isinstance(g, P5_.SwingResult):
            lay(R_(rnd, 1.0, -30), s.t0 + g.u0 + 0.2, anchor=1.0); lay(boom(level=-21, f0=70, f1=44), s.t0 + g.u0 + 0.25)
            for i, (_, v, kind) in enumerate(g.bars):
                lay(tick(-30, (523 if v < 0 else 784) * (2 ** (i * 2 / 12))), s.t0 + g.u0 + g.t0 + i * g.every + 0.02, pan=0.35 + 0.08 * i)
            ts_ = s.t0 + g.u0 + g.t0 + len(g.bars) * g.every + 0.2
            lay(glint(-28), ts_ + 0.1, pan=0.8); lay(boom(1.2, -24, 80, 50), ts_)
            for k, fa in enumerate(g.fact_at): lay(glint(-33), s.t0 + fa, pan=0.3 + 0.2 * k)
    # the close: the mark lands
    e = sh['end']
    lay(R_(rnd, 1.1, -29), e.t0 + 0.6, anchor=1.1); lay(boom(2.4, -20, 55, 34), e.t0 + 0.6); lay(glint(-31), e.t0 + 0.75, pan=0.4)
    return out, air


def main():
    preview = '--preview' in sys.argv
    vo_raw, vo = M.voice(); env = M.envelope(vo_raw)
    hits, air = sfx()
    mix = vo + M.music(env) + hits * (1 - 0.3 * env)[:, None] + air * (1 - 0.82 * env)[:, None]
    pre = B / 'mix11-pre.wav'; sf.write(pre, mix.astype(np.float32), SR, subtype='FLOAT')
    r = run(['ffmpeg', '-hide_banner', '-y', '-i', str(pre), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    final = B / 'mix11.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(pre), '-af', ln, '-ar', str(SR), '-c:a', 'pcm_s24le', str(final)])
    silent = B / ('film11-preview.mp4' if preview else 'film11-silent.mp4')
    out = B / ('film11-preview-av.mp4' if preview else 'smart-clearance-working-demo-cut11.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(silent), '-i', str(final), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', str(out)])
    M.srt(); print('mixed', out, f"(input {m['input_i']} LUFS)")


if __name__ == '__main__':
    main()
