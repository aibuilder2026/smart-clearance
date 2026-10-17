"""SC-238: the film's sound, on the plan's own clock (film/src/film.json), mixed the way the stitch-videos-ffmpeg skill's
montage.py mixes (measured static gains, sidechain ducking, amix without normalising, two-pass loudnorm).

- the narrator: each line's chosen Maya1 take (tts/vo/maya1w-warm/<id>.wav), or the part of it the plan places, at its
  time, through one voice chain (a high-pass, warmth and presence, gentle compression, a faint short room);
- the people: each talking clip's own sound (LTX made the voice with the picture), cut on the same frames as its
  picture (media.py), levelled, in its own space (a short room), over its own room tone for the whole shot;
- the places: one continuous room tone for each place, made from its clip's quietest moments with new phases (so no
  voice or event from a generated clip leaks in), carried across the cuts within a place and crossfaded between places;
- the score: SC-210's Lyria cues in D (music10/, made before; nothing generated here), one an act, looped through
  equal-power crossfades and crossfaded into the next, the bed set to -24 LUFS from a measured pass, then ducked by
  sidechaincompress keyed on the voices' envelope (about 10 dB from the presence band up through the sibilants, 1 to
  9.5 kHz, 4 elsewhere, released over 0.65 s);
- sound design: the editing-videos library's CC0 sounds for real actions (a click, a tap, paper handled, a notification,
  a stamp) and sounds synthesised from noise and sine tones (sfxkit.py) for the rest: every window lifting out of its
  device, every ring, card, agent at work and the calls it types, every tap on Approve, the clock turning, the
  fast-forwards, the shutter, the stamps, the phone rings, each scene's way in, and the events the captured pages
  report (the agents in 3D, the install, the audit trail);
- amix (normalize=0), then two-pass loudnorm to -14 LUFS, -1.5 dBTP (headroom for the AAC encode), LRA 11, at 48 kHz.

   uv run --with numpy --with scipy --with soundfile python mix.py [--film path.mov] [--out path.mp4]"""
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfiltfilt

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sfxkit as K  # noqa: E402

SR = K.SR
B = HERE / 'build'; B.mkdir(exist_ok=True)
FILM = json.loads((HERE / 'film' / 'src' / 'film.json').read_text())
MEDIA = json.loads((B / 'media.json').read_text())
END = FILM['end']
N = int((END + 0.5) * SR)
VO = HERE / 'tts' / 'vo' / 'maya1w-warm'
MUS = Path('/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-210/src/music10')
LIB = Path.home() / '.claude' / 'skills' / 'editing-videos' / 'library' / 'sfx'
SC = {s['id']: s for s in FILM['scenes']}


def run(cmd):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if r.returncode: sys.stderr.write(r.stderr[-3000:]); raise SystemExit('ffmpeg failed')
    return r


def db(v): return 10 ** (v / 20)


def measure(path):
    r = run(['ffmpeg', '-hide_banner', '-y', '-i', path, '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'])
    return json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])


def stable(text):
    """a number from a name that is the same in every run (Python's own hash is salted per process)"""
    return int(hashlib.md5(str(text).encode()).hexdigest()[:8], 16)


def load(path, mono=False):
    tmp = B / 'mixtmp' / f'{Path(path).stem}-{stable(path) % 10 ** 8}{"-m" if mono else ""}.wav'
    tmp.parent.mkdir(exist_ok=True)
    if not tmp.exists():
        run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-ar', str(SR), '-ac', '1' if mono else '2', '-c:a', 'pcm_f32le', tmp])
    x, _ = sf.read(tmp, dtype='float32')
    return x


def lay(buf, y, t, pan=0.5, gain=1.0):
    """y (mono or stereo) into buf at film second t, panned (equal power) when mono"""
    i = int(round(t * SR))
    if i < 0: y = y[-i:]; i = 0
    n = min(len(y), len(buf) - i)
    if n <= 0: return
    if y.ndim == 1:
        l, r = np.cos(pan * np.pi / 2) * 1.414, np.sin(pan * np.pi / 2) * 1.414
        buf[i:i + n, 0] += y[:n] * l * gain; buf[i:i + n, 1] += y[:n] * r * gain
    else:
        buf[i:i + n] += y[:n] * gain


def fades(n, fi, fo):
    w = np.ones(n, np.float32)
    a, b = min(n, int(fi * SR)), min(n, int(fo * SR))
    if a: w[:a] = np.sin(np.linspace(0, 1, a) * np.pi / 2) ** 2
    if b: w[-b:] = np.minimum(w[-b:], np.cos(np.linspace(0, 1, b) * np.pi / 2) ** 2)
    return w


# ---------------------------------------------------------------- the voices

def narration():
    vo = np.zeros(N, np.float32)
    for v in FILM['vo']:
        x, sr = sf.read(VO / f"{v['id']}.wav", dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        a, b = int(v['from'] * sr), int((v['from'] + v['dur']) * sr)
        x = x[a:b]
        k = int(0.012 * sr)                              # a part cut from a take: no click at its edges
        if v['from'] > 0: x[:k] *= np.linspace(0, 1, k)
        x[-k:] *= np.linspace(1, 0, k)
        x = resample_poly(x, SR // 1000, sr // 1000).astype(np.float32) if sr != SR else x
        i = int(v['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]
    raw = B / 'mix-vo-raw.wav'; sf.write(raw, vo, SR, subtype='FLOAT')
    fx = B / 'mix-vo-fx.wav'
    chain = ('highpass=f=75,equalizer=f=190:t=q:w=1.0:g=1.6,equalizer=f=3300:t=q:w=1.3:g=1.8,'
             'equalizer=f=7600:t=q:w=1.6:g=-1.6,acompressor=threshold=-21dB:ratio=2.4:attack=6:release=140:makeup=2.2,'
             'aecho=0.88:0.6:23|41:0.07|0.045,pan=stereo|c0=c0|c1=c0')
    run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', chain, '-c:a', 'pcm_f32le', fx])
    nar, _ = sf.read(fx, dtype='float32')
    out = np.zeros((N, 2), np.float32); n = min(N, len(nar)); out[:n] = nar[:n]
    return vo, out


# each talking clip's space: the room's decay (RT60, s) and how much of it is heard
ACOUSTICS = {'d-dawn-call': (0.9, 0.2), 'l-dawn-call': (0.4, 0.12), 'b-approve': (0.45, 0.14), 'l-approve': (0.45, 0.14), 'k-order-b': (0.35, 0.12),
             'v-dock': (0.6, 0.15), 's-shop-b': (0.35, 0.12), 'w-buyer': (0.8, 0.18), 'o-landfill': (0.25, 0.06), 'd-eve-call': (0.9, 0.2),
             'l-eve-call-b': (0.45, 0.13), 'l-dawn-call-b': (0.4, 0.12), 'v-dock-b': (0.6, 0.15),
             # the takes to the lens (r4): the shop, the dock, the van's shop, the warehouse (the buyer calm, so a drier room), the
             # landfill in the open, the brand's office
             'k-order-c': (0.35, 0.12), 'v-dock-c': (0.6, 0.14), 's-shop-d': (0.35, 0.12), 'w-buyer-c': (0.7, 0.11), 'r-say-c': (0.25, 0.05),
             'b-approve-c': (0.45, 0.14), 'b-approve-d': (0.45, 0.14)}


# a take whose words themselves carry a wash of noise from 5 kHz up, generated with the voice (so the denoiser, which
# learns the noise between the words, leaves it): shelved and its top rolled off. The kirana's hissed (r4: its 6 kHz band
# 19 dB under the voice's body, the others 26-37); the volunteer's was next
TALK_EQ = {'k-order-c': ',highshelf=f=5000:g=-9:t=q:w=0.7,lowpass=f=10000:p=2', 'v-dock-c': ',highshelf=f=5500:g=-4:t=q:w=0.7'}


def air_ratio(path):
    """how far a talking clip's band from 6 kHz up sits under its 0-1.5 kHz band in its voiced frames, in dB (the narrator
    about 50; a take whose words hiss, under 30)"""
    x = load(path, mono=True)
    from scipy.signal import stft
    f, _, Z = stft(x, SR, nperseg=2048, noverlap=1536)
    P = np.abs(Z) ** 2; e = P.sum(0); v = e > np.percentile(e, 60)
    lo, hi = P[(f < 1500)][:, v].sum(), P[(f >= 6000)][:, v].sum()
    return float(10 * np.log10(lo / (hi + 1e-12) + 1e-12))


def talking():
    talk = np.zeros((N, 2), np.float32); mono = np.zeros(N, np.float32)
    for sc in FILM['scenes']:
        for sh in sc['shots']:
            if sh['kind'] != 'talk': continue
            src = HERE / 'film' / 'public' / 'media' / f"{sh['media']}.wav"
            if not src.exists(): print('no sound yet for', sh['media']); continue
            lv = B / 'mixtmp' / f"{sh['media']}-lev.wav"; lv.parent.mkdir(exist_ok=True)
            # the generated voice's hiss taken out first (a spectral denoiser that tracks the noise, about 20 dB off the
            # floor, the voice itself untouched), then levelled by a measured static gain, not a dynamic loudnorm, which
            # raised the floor between the words
            eq = TALK_EQ.get(Path(MEDIA[sh['media']]['src']).stem, '')
            run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', f'afftdn=nr=24:nf=-58:tn=1,highpass=f=70{eq},acompressor=threshold=-22dB:ratio=2.0:attack=8:release=160:makeup=1.5',
                 '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', lv])
            x, _ = sf.read(lv, dtype='float32')
            x = x * db(-18.0 - float(measure(lv)['input_i']))
            clip = Path(MEDIA[sh['media']]['src']).stem
            rt60, wetk = ACOUSTICS.get(clip, (0.4, 0.12))
            ir = K.room_ir(rt60, pre=0.008 + 0.01 * rt60, seed=sum(map(ord, clip)))
            wet = np.stack([fftconvolve(x[:, c], ir)[: len(x)] for c in range(2)], 1).astype(np.float32)
            x = x + wetk * wet
            x *= fades(len(x), 0.05, 0.08)[:, None]
            t0 = sc['t0'] + sh['t0']
            lay(talk, x, t0); i = int(t0 * SR); n = min(len(x), N - i); mono[i:i + n] += x[:n].mean(axis=1)
    return talk, mono


def key_env(nar_dry, talk_mono):
    """the duck's key: the voices' envelope, quick to rise, slow to fall, a little ahead of each line, held through any
    pause under 1.2 s, so the bed rests under speech instead of pumping (the first critic heard it pump at 0.7 s)"""
    a = np.abs(nar_dry + talk_mono); hop = 480
    fr = a[: len(a) // hop * hop].reshape(-1, hop).max(axis=1)
    on = (fr > 0.02).astype(np.float32)
    gap = int(1.2 * SR / hop); last = -10 ** 9; held = on.copy()
    for i, v in enumerate(on):
        if v > 0.5: last = i
        elif i - last < gap: held[i] = 1.0
    env, g = np.zeros_like(held), 0.0
    up, down = 1 - np.exp(-1 / (0.06 * SR / hop)), 1 - np.exp(-1 / (0.6 * SR / hop))
    for i, v in enumerate(held):
        g += (v - g) * (up if v > g else down); env[i] = g
    e = np.repeat(env, hop); e = np.pad(e, (0, N - len(e)), mode='edge')[:N]
    la = int(0.25 * SR); e = np.maximum(e, np.concatenate([e[la:], np.full(la, e[-1], np.float32)]))
    k = int(0.05 * SR); return np.convolve(e, np.ones(k, np.float32) / k, mode='same').astype(np.float32)


# ---------------------------------------------------------------- the places

# the clips made without sound (SC-207's labelled aisle; SC-210's Veo backgrounds, made silent) take their place's room
# tone from a sister clip of the same place: the same aisle as first made, the lead's office by day and at dusk, the food bank
TONE_FROM = {'o0-godown-aisle-labelled.mp4': 'SC-206/src/clips/o0-godown-aisle.mp4', 'v-office.mp4': 'SC-205/src/clips/m1-priya-desk.mp4',
             'v-evening.mp4': 'SC-206/src/clips/s-priya-eve.mp4', 'v-foodbank.mp4': 'SC-206/src/clips/s-meera.mp4',
             'x-film.mov': 'src/clips/x-film.mp4'}   # (the filming shot's super-resolved copy carries no sound: its own take's room)


def drawn_footage():
    """footage a scene draws itself rather than as a plan shot, as (film start, film end, media): the carton's label
    under the cold open's last line (in the distributor's godown at dawn), the mark over the sunrise, the teams, Vision's
    check over the landfill, the issued papers over the distributor's stack, the record's papers over what each records,
    and its audit trail over the office: each gets its place's room tone, as a shot does"""
    out = []
    c = SC['cold']; d4 = next(d for d in FILM['dlg'] if d['id'] == 'd04')
    out.append((d4['t'] + 0.52, c['t0'] + c['dur'], 'cold-d01'))
    p = SC['platform']; tb = next(x for x in p['shots'] if x.get('media') == 'team-brand')
    out.append((p['t0'], p['t0'] + p['marks']['console'] + 0.4, 'p-town'))
    out.append((p['t0'] + p['marks']['teams'] - 0.15, p['t0'] + tb['t1'], 'team-bg'))
    ch = SC['chips']; ev = next(x for x in ch['shots'] if x['kind'] == 'evidence')
    out.append((ch['t0'] + ev['t0'], ch['t0'] + ev['t1'], 'c-evidence-bg'))
    out.append((ch['t0'] + ch['marks']['issued'], ch['t0'] + ch['dur'], 'c-issued-bg'))
    r = SC['record']; R = r['marks']          # (Record.tsx: each paper's footage cuts mid-slide, 0.12 s after its word)
    cuts = [(0.0, 'r-truck'), (R['credit'] + 0.12, 'r-godown'), (R['memo'] + 0.12, 'r-office'), (R['receipts'] + 0.12, 'r-foodbank'), (R['certs'] + 0.12, 'r-landfill')]
    for (a, m), (b, _) in zip(cuts, cuts[1:] + [(R['audit'] + 0.3, None)]): out.append((r['t0'] + a, r['t0'] + b, m))
    out.append((r['t0'] + R['audit'], r['t0'] + R['swing'], 'r-office'))
    return out


def places():
    """one room tone a place: each footage shot's clip gives its room tone (its quietest moments, new phases); a place
    carries on across the cuts that stay in it, and crossfades to the next place over 0.35 s"""
    amb = np.zeros((N, 2), np.float32)
    tones = {}
    def tone_of(src):
        if src not in tones:
            try: x = load(src)
            except SystemExit: x = np.zeros((0, 2), np.float32)
            if (len(x) < SR // 2 or np.sqrt(np.mean(x ** 2)) < 1e-5) and Path(src).name in TONE_FROM:
                try: x = load(str(Path(src).parents[3] / TONE_FROM[Path(src).name]))   # a silent clip: its place's tone from a sister clip
                except SystemExit: x = np.zeros((0, 2), np.float32)
            if len(x) < SR // 2 or np.sqrt(np.mean(x ** 2)) < 1e-5: tones[src] = None; return None
            y = K.room_tone(x, int(12 * SR), seed=stable(src) % 1000)
            rms = np.sqrt(np.mean(y ** 2)) + 1e-9
            tones[src] = (y / rms * db(-54)).astype(np.float32)     # (a bed under the scene, never heard as itself; pass 12: 7 dB under -47, the maintainer asked for less background noise)
        return tones[src]
    for sc in FILM['scenes']:
        for sh in sc['shots']:
            if sh['kind'] not in ('clip', 'ots', 'talk'): continue
            m = MEDIA.get(sh.get('media', ''))
            if not m: continue
            src = m['src']
            y = tone_of(src)
            if y is None: continue
            g = 0.45 if sh['kind'] == 'talk' else 1.0         # under a talking clip's own sound, its room lower still
            t0, t1 = sc['t0'] + sh['t0'] - 0.04, sc['t0'] + sh['t1'] + 0.04
            n = int((t1 - t0) * SR)
            seg = np.tile(y, (n // len(y) + 1, 1))[:n] * fades(n, 0.04, 0.04)[:, None] * g
            lay(amb, seg, t0)
    for t0, t1, name in drawn_footage():
        m = MEDIA.get(name)
        y = tone_of(m['src']) if m else None
        if y is None: print('no room tone for', name); continue
        n = int((t1 - t0 + 0.3) * SR)
        lay(amb, np.tile(y, (n // len(y) + 1, 1))[:n] * fades(n, 0.15, 0.15)[:, None], t0 - 0.15)
    return amb


# ---------------------------------------------------------------- the score

# each act's cue, its two takes alternating so a long act never loops one take on itself
ACTS = [('waste', ['waste-2102', 'waste-2101'], 'cold', 'label'), ('reveal', ['reveal-2101', 'reveal-2102'], 'turn', None),
        ('eco', ['eco-2102', 'eco-2101', 'eco-2102'], 'agents', None),
        ('journey', ['journey-2101', 'journey-2102', 'journey-2101', 'journey-2102', 'journey-2101', 'journey-2102'], 'mango', None),
        ('papers', ['papers-2101', 'papers-2102'], 'record', None), ('close', ['close-2102'], 'call', None)]


def score():
    F = int(3.0 * SR)
    starts = []
    for act, keys, sid, mark in ACTS:
        t = SC[sid]['t0'] + (SC[sid]['marks'][mark] if mark else 0.0) - (0.0 if mark else 0.8)
        starts.append(max(0.0, t))
    track = np.zeros((N, 2), np.float32)
    for k, (act, keys, sid, mark) in enumerate(ACTS):
        a = int(starts[k] * SR)
        b = int(starts[k + 1] * SR) + F if k + 1 < len(ACTS) else N
        need = b - a
        parts = [load(MUS / f'{kk}.wav') for kk in keys]
        x = parts[0]
        for p in parts[1:]:
            w = np.linspace(0, 1, F, dtype=np.float32)[:, None]
            x = np.concatenate([x[:-F], x[-F:] * np.cos(w * np.pi / 2) + p[:F] * np.sin(w * np.pi / 2), p[F:]])
        seg = K.xfade_loop(x, need, F)
        seg = seg / max(1e-6, np.sqrt(np.mean(seg ** 2))) * db(-22)
        w = np.ones((need, 1), np.float32)
        fi = int((2.2 if k == 0 else 3.0) * SR)
        if k == 0: w[:fi, 0] = np.sin(np.linspace(0, 1, fi) * np.pi / 2) ** 2
        else: w[:F, 0] = np.sin(np.linspace(0, 1, F) * np.pi / 2)
        if k + 1 < len(ACTS): w[-F:, 0] = np.cos(np.linspace(0, 1, F) * np.pi / 2)
        track[a:b] += seg[:need] * w
    # the eight frames of silence after the bin, and the score's end on the card
    b0 = SC['bin']['t0'] + SC['bin']['dur'] - 0.14; i0, i1 = int((b0 - 0.25) * SR), int((b0 + 0.14) * SR)
    track[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 2
    t_end = int((END - 3.0) * SR); track[t_end:] *= (np.linspace(1, 0, N - t_end) ** 1.5)[:, None]
    # (the band ducked hard runs from the presence range up through the sibilants, so no shimmer in the score masks an s)
    band = sosfiltfilt(butter(2, [1000, 9500], btype='bandpass', fs=SR, output='sos'), track, axis=0).astype(np.float32)
    return track - band, band


# ---------------------------------------------------------------- the sound design

_LIB = {}
def lib(name, level=None):
    if name not in _LIB:
        x = load(LIB / f'{name}.wav', mono=True)
        _LIB[name] = x / (np.abs(x).max() + 1e-9)
    y = _LIB[name]
    return y * db(level) if level is not None else y


def pop(level=-27):
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 520 + 420 * (1 - np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.05)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def stop_hit():
    """an agent's stop arriving: a soft low thump with a bright tick on it"""
    b, tk = K.boom(0.9, -28, 96.0, 56.0), K.tick(-29, 1046.5)
    st = lambda x: x if x.ndim == 2 else np.stack([x, x], 1)
    b, tk = st(b), st(tk)
    n = max(len(b), len(tk)); y = np.zeros((n, 2), np.float32); y[:len(b)] += b; y[:len(tk)] += tk
    return y


def air_bed(d, level=-33):
    """a slow, wide air under the 3D scene: pink noise through a low band, moving gently, with a soft fifth on top"""
    n = int(d * SR); rng = np.random.default_rng(3238)
    w = rng.standard_normal((n, 2)).astype(np.float32)
    w = sosfiltfilt(butter(2, [70, 900], btype='band', fs=SR, output='sos'), w, axis=0).astype(np.float32)
    tt = np.arange(n) / SR
    mod = (0.75 + 0.25 * np.sin(2 * np.pi * tt / 11.0))[:, None]
    tone = (0.18 * np.sin(2 * np.pi * 110.0 * tt) + 0.12 * np.sin(2 * np.pi * 164.8 * tt))[:, None] * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 7.0))[:, None]
    y = (w / (np.sqrt(np.mean(w ** 2)) + 1e-9) * 0.5 + tone) * mod
    y = y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * db(level)
    return (y * fades(n, 1.2, 1.5)[:, None]).astype(np.float32)


def ringtone(level=-24):
    """a phone's ringtone, twice: a soft marimba figure (generic, no brand's)"""
    out = np.zeros(int(1.9 * SR), np.float32)
    notes = [(0.0, 880.0), (0.12, 1174.66), (0.24, 1318.51), (0.36, 1174.66)]
    for rep in (0.0, 0.95):
        for dt, f in notes:
            n = int(0.42 * SR); t = np.arange(n) / SR
            y = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.02)) * np.exp(-t / 0.13) * (1 - np.exp(-t / 0.002))
            i = int((rep + dt) * SR); out[i:i + n] += y[: len(out) - i]
    return (out / (np.abs(out).max() + 1e-6) * db(level)).astype(np.float32)


def whir(d, level=-30):
    """a fast-forward: a soft rising whir with a flutter"""
    n = int(d * SR); t = np.arange(n) / SR
    rnd = np.random.default_rng(int(d * 1000))
    noise = rnd.standard_normal(n).astype(np.float32)
    sos = butter(2, [700, 3200], btype='bandpass', fs=SR, output='sos')
    y = sosfiltfilt(sos, noise) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)) * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.2)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def typing(chars, level=-34, cps=48, seed=1):
    """the calls an agent types: soft key ticks at the typing rate"""
    rnd = np.random.default_rng(seed)
    d = chars / cps; out = np.zeros(int((d + 0.1) * SR), np.float32)
    k = lib('keyboard-key-1'); k2 = lib('keyboard-key-2')
    t = 0.0
    while t < d:
        y = (k if rnd.random() < 0.5 else k2) * db(level + rnd.uniform(-3, 2))
        i = int(t * SR); n = min(len(y), len(out) - i); out[i:i + n] += y[:n]
        t += 1 / cps * rnd.uniform(1.4, 2.6)              # not every character: a soft run of keys
    return out


def events():
    """every sound the picture calls for, as (film second, layer, sound, pan)"""
    ev = []
    def add(t, y, pan=0.5, layer='hits'): ev.append((t, layer, y, pan))
    chip_ticks = []                     # (the clock chip's tick, 0.18 s after its cut: it marks the chip, not the cut)
    rnd = np.random.default_rng(238)
    for sc in FILM['scenes']:
        T, M = sc['t0'], sc['marks']
        # each scene's way in
        sid = sc['id']
        if sid == 'godown': add(T - 0.05, K.whoosh(rnd, 0.9, 0.5, -27), 0.5, 'air')
        if sid == 'rule': add(T - 0.4, K.whoosh(rnd, 0.9, 0.5, -28), 0.5, 'air')
        if sid == 'bin': add(T - 0.2, K.boom(1.4, -27, 58.0, 36.0), 0.5)
        if sid == 'turn':
            add(T + sc['dur'] - 1.4, K.riser(rnd, 1.3, -27), 0.5, 'air')
            add(T + sc['dur'] - 0.05, K.boom(2.0, -20), 0.5)
        if sid == 'platform':
            add(T + 0.1, K.sparkle(1.2, 16, -30), 0.5); add(T + 1.5, K.glint(-28), 0.55)
            if 'console' in M: add(T + M['console'] - 0.3, K.whoosh(rnd, 0.8, 0.45, -28, lo=0.03, hi=0.3), 0.5)   # (into the console: it cut in silence)
        if sid == 'agents':
            add(T - 0.4, K.whoosh(rnd, 1.2, 0.5, -26), 0.5, 'air')
            add(T, air_bed(sc['dur'], -40), 0.5, 'hits')   # (pass 12: 7 dB lower, less background noise)
        if sid == 'mango': add(T - 0.2, K.whoosh(rnd, 0.8, 0.45, -28), 0.5, 'air')
        if sid == 'chips': add(T, K.boom(1.6, -26, 52.0, 34.0), 0.5)
        if sid == 'record': add(T - 0.5, K.riser(rnd, 0.9, -29), 0.5, 'air')
        if sid == 'close': add(T - 0.3, K.riser(rnd, 1.2, -28), 0.5, 'air'); add(T + 1.3, K.boom(2.2, -21), 0.5)
        # phones ring at the two calls
        if sid in ('cold', 'call'): add(T + M.get('ring', 0.12), ringtone(-26), 0.62)
        # the stamps
        for k_ in ('stamp', 'st1', 'st2', 'st3'):
            if k_ in M: add(T + M[k_] - 0.02, lib('stamp-thud', -16), 0.5); add(T + M[k_], K.thud(-22), 0.5)
        if sid == 'cold' and 'ringbb' in M: add(T + M['ringbb'], K.tick(-30, 1318.5), 0.55)
        if sid == 'cold' and 'card' in M:                 # the call's card in, the call ending, the batch's card
            add(T + M['card'], K.glint(-30), 0.22); add(T + M['cut'] + 0.02, K.tick(-30, 659.25), 0.25); add(T + M['batch'], pop(-28), 0.22)
        # the bin's bill: each line lands, the total rolls
        if sid == 'bin':
            for k_ in ('stock', 'credit', 'destroy'):
                add(T + M[k_], lib('impact-wood-light', -30), 0.62)
            add(T + M['destroy'] + 0.35, lib('impact-wood-light', -30), 0.62)
            add(T + M['total'], K.boom(1.2, -26, 70.0, 42.0), 0.6)
        # the rule's figures
        if sid == 'rule':
            for w_ in (('n03', 'thirty'), ('n03', 'fortyfive'), ('n04', 'sixty'), ('n04', 'ninety')):
                ws = [x for x in sc['words'][w_[0]] if x['w'] == w_[1]]
                if ws: add(T + ws[0]['t'] - 0.08, pop(-27), 0.35 if w_[0] == 'n03' else 0.65)
            for mk in ('fssai', 'gates'): add(T + M[mk] + 0.3, K.whoosh(rnd, 0.6, 0.4, -31), 0.5, 'air')
            ws = [x for x in sc['words']['n05'] if x['w'] == 'twentytwo']
            if ws: add(T + ws[0]['t'] - 0.25, K.whoosh(rnd, 1.0, 0.45, -30, lo=0.01, hi=0.12), 0.45, 'air')
            ws = [x for x in sc['words']['n05'] if x['w'] == 'below']
            if ws: add(T + ws[0]['t'] - 0.05, lib('error-buzz-soft', -28), 0.6)
        # the godown's scan and its days running out
        if sid == 'godown':
            add(T + 0.55, K.whoosh(rnd, 2.2, 0.5, -31, lo=0.01, hi=0.2), 0.5, 'air')
            for k_ in range(6): add(T + 3.7 + k_ * 0.56, lib('clock-tick', -33), 0.5)
        # every shot's own marks
        for sh in sc['shots']:
            t0 = T + sh['t0']
            if sh['kind'] == 'win':
                if sh.get('enter') != 'none':      # (on the hits layer: the air layer is ducked away under the voice)
                    lt = t0 + (sh.get('lift') or 0)
                    add(lt, K.whoosh(rnd, 0.6, 0.3, -27, lo=0.03, hi=0.35), 0.58); add(lt + 0.32, K.glint(-31), 0.6)
                for r in sh.get('rings', []): add(T + r['t0'] + 0.05, K.tick(-33, 1760.0 if r.get('tone') != 'red' else 880.0), 0.58)
                for c in sh.get('cards', []): add(T + c['t0'], pop(-29), 0.3 if c.get('side', 'l') == 'l' else 0.7)
                for h in sh.get('heads', []):
                    add(T + h['t0'], K.glint(-31), 0.2)
                    for ct, line in h.get('calls', []): add(T + ct, typing(len(line), -36, seed=int(ct * 100)), 0.22)
                    if 'done' in h: add(T + h['done'], K.chime(-31, ((1567.98, 0.0), (2093.0, 0.07))), 0.25)
                for tp in sh.get('taps', []):
                    add(T + tp, lib('click-mouse', -22), 0.6); add(T + tp + 0.03, K.chime(-27, ((783.99, 0.05), (1174.66, 0.15))), 0.6)
                if sh.get('badge'):
                    b = sh['badge']; add(T + b['t0'], whir(b['t1'] - b['t0'], -31), 0.5, 'air')
            if sh['kind'] == 'viewfinder':
                add(t0 + 0.45, K.tick(-32, 2637.0), 0.5); add(T + sh['shutter'], K.shutter(-19), 0.5)
            elif sh.get('shutter') is not None:
                add(T + sh['shutter'], K.shutter(-20), 0.55)
            if sh['kind'] == 'evidence':
                # (the photos land just after the voice's "and Vision", which a paper sound on the cut had covered)
                add(t0 + 0.75, K.whoosh(rnd, 1.9, 0.5, -32, lo=0.02, hi=0.3), 0.5, 'air')
                for k_ in range(4): add(t0 + 0.9 + 0.5 * k_, K.tick(-26, 1760.0), 0.62); add(t0 + 0.92 + 0.5 * k_, pop(-29), 0.62)
                add(t0 + 0.55, lib('paper-handle-1', -31), 0.3); add(t0 + 0.8, lib('paper-handle-2', -31), 0.7)
            if sh['kind'] == 'ots' and sh.get('media') == 'l-photo':
                add(t0 + 1.0, K.shutter(-22), 0.5)
        # the clock chip turning over
        prev = None
        for sh in sorted([x for x in sc['shots'] if x.get('clock')], key=lambda x: x['t0']):
            if sh['clock'][0] != prev: add(T + sh['t0'] + 0.18, lib('clock-tick', -34), 0.85); chip_ticks.append(T + sh['t0'] + 0.18)
            prev = sh['clock'][0]
        # the record's papers landing, and the review's stamp
        if sid == 'record':
            for k_, at in enumerate([x for x in ('gst', 'einv', 'credit', 'memo', 'receipts', 'certs') if x in M]):
                add(T + M[at] - 0.3, lib('paper-handle-1' if k_ % 2 else 'paper-handle-2', -27), 0.5)
            add(T + M['gst'] - 1.3, lib('stamp-thud', -22), 0.7)
        if sid == 'chips' and 'signed' in M:                # the signed certificate's window leaving on the cut to his face
            add(T + M['signed'] - 0.22, K.whoosh(rnd, 0.5, 0.6, -29, lo=0.03, hi=0.35), 0.4)
        if sid == 'chips' and 'issued' in M:
            add(T + M['issued'] + 0.2, lib('paper-shuffle', -27), 0.5)
        # the four teams' devices rising asleep together, then each screen waking on its word
        if sid == 'platform' and 'teams' in M:
            add(T + M['teams'] + 0.05, K.whoosh(rnd, 0.9, 0.45, -30, lo=0.02, hi=0.25), 0.5, 'air')
            for k_, x in enumerate(sorted([x for x in sc['shots'] if str(x.get('media', '')).startswith('team-') and x['kind'] == 'win'], key=lambda x: x['t0'])):
                hi = x.get('hi', x['t0']); pan = [0.2, 0.42, 0.62, 0.82][k_ % 4]
                add(T + x['t0'] + 0.03, K.tick(-38, 1318.5), pan)                       # (each device landing)
                add(T + hi + 0.02, K.glint(-30), pan); add(T + hi + 0.04, K.tick(-34, 1567.98), pan)   # (lit on its word)
    # a cut into new footage that no other sound marks (r3 counted four silent ones): a soft whoosh under it, unless a
    # sound already lands within a third of a second (a talking clip's own room is its cut's sound)
    # (the chip's tick does not count: on its own it reached the cut into the window closing 0.22 s late, r4)
    marked = sorted(t for t, *_ in ev if not any(abs(t - c) < 1e-6 for c in chip_ticks))
    for sc in FILM['scenes']:
        prev = None
        for sh in sorted([x for x in sc['shots'] if x['kind'] in ('clip', 'ots', 'evidence', 'talk')], key=lambda x: x['t0']):
            c = sc['t0'] + sh['t0']
            if prev is not None and sh['kind'] != 'talk' and sh.get('media') != prev.get('media') and abs(prev['t1'] - sh['t0']) < 0.08:
                i = np.searchsorted(marked, c - 0.35)
                if not (i < len(marked) and marked[i] <= c + 0.35):
                    add(c - 0.18, K.whoosh(rnd, 0.55, 0.45, -31, lo=0.03, hi=0.3), 0.5)
            prev = sh
    # the captured pages' own events (the agents in 3D, the install, the audit trail)
    pages = [('agents3d', SC['agents']['t0']), ('pwa', SC['platform']['t0'] + [x for x in SC['platform']['shots'] if x.get('media') == 'team-brand'][0]['t1']),
             ('audit', SC['record']['t0'] + SC['record']['marks']['audit'])]
    page_sound = {
        'ignite': lambda: K.glint(-31), 'whoosh_in': lambda: K.whoosh(rnd, 0.8, 0.45, -28), 'whoosh': lambda: K.whoosh(rnd, 1.1, 0.5, -27),
        'hit': lambda: K.boom(1.6, -21, 70.0, 40.0), 'badge': lambda: K.chime(-31, ((1567.98, 0.0), (2093.0, 0.08))), 'sparkle': lambda: K.sparkle(0.6, 12, -33),
        'click': lambda: lib('click-mouse', -23), 'card': lambda: pop(-29), 'edge': lambda: K.tick(-37, 1320.0), 'rails': lambda: K.riser(rnd, 0.9, -30),
        'panel': lambda: K.whoosh(rnd, 0.7, 0.4, -30), 'rule': lambda: K.tick(-31, 1046.5), 'shield': lambda: lib('impact-wood-light', -27),
        'gate': lambda: K.chime(-25, ((783.99, 0.05), (1174.66, 0.16))), 'log': lambda: K.tick(-35, 1760.0), 'logyes': lambda: K.chime(-30, ((1174.66, 0.0), (1567.98, 0.07))),
        'stamp': lambda: lib('stamp-thud', -20), 'pop': lambda: pop(-28), 'tick': lambda: K.tick(-31, 1318.5), 'glint': lambda: K.glint(-30),
        'riser': lambda: K.riser(rnd, 1.0, -30), 'chime': lambda: K.chime(-27), 'notif': lambda: lib('notification-1', -27),
        'stop': lambda: stop_hit(),
        'gate-up': lambda: K.riser(rnd, 0.8, -29), 'tap': lambda: lib('click-mouse', -22), 'rise': lambda: K.whoosh(rnd, 1.4, 0.55, -27), 'resolve': lambda: K.chime(-25),
        'spark': lambda: K.glint(-32), 'beam': lambda: K.whoosh(rnd, 0.5, 0.35, -33, lo=0.05, hi=0.4), 'land': lambda: lib('impact-soft-3', -30),
        'packs': lambda: K.sparkle(0.5, 8, -35), 'paper': lambda: lib('paper-handle-1', -30), 'coin': lambda: lib('coin-clink', -30), 'mark': lambda: K.boom(2.0, -22),
        # the agents in 3D: the opening swell, the route drawn, Gemini's orb and its beams, the Watcher's chip, the camera's
        # chases and its dive to the first stop, and the work at each stop
        'swell': lambda: K.riser(rnd, 1.2, -30), 'draw': lambda: K.sparkle(1.0, 10, -32), 'orb': lambda: K.boom(1.8, -24, 96.0, 48.0),
        'beams': lambda: K.whoosh(rnd, 0.7, 0.4, -28, lo=0.05, hi=0.45), 'chip': lambda: pop(-27), 'whoosh-chase': lambda: K.whoosh(rnd, 0.9, 0.5, -27),
        'rows': lambda: K.tick(-30, 1318.5), 'risk': lambda: lib('error-buzz-soft', -30), 'scan': lambda: K.whoosh(rnd, 0.8, 0.45, -30, lo=0.04, hi=0.3),
        'bars': lambda: K.tick(-29, 1567.98), 'split': lambda: K.whoosh(rnd, 0.6, 0.35, -28, lo=0.03, hi=0.35), 'fan': lambda: K.sparkle(0.8, 12, -30),
        'sign': lambda: lib('paper-handle-2', -28), 'ledger': lambda: K.chime(-28, ((1174.66, 0.0), (1567.98, 0.07))),
    }
    for name, t0 in pages:
        p = B / f'cap-{name}' / 'events.json'
        if not p.exists(): print('no events yet for', name); continue
        for e in json.loads(p.read_text()):
            kind = e.get('kind') or e.get('type'); f = page_sound.get(kind)
            if f is None: continue
            add(t0 + e['t'], f(), e.get('pan', 0.5), 'air' if kind in ('whoosh_in', 'rails', 'panel', 'riser', 'beam') else 'hits')
    return ev


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--film', default=str(B / 'render' / 'Film.mov')); ap.add_argument('--out', default=str(B / 'film-av.mp4'))
    ap.add_argument('--audio-only', action='store_true')
    a = ap.parse_args()
    nar_dry, nar = narration()
    talk, talk_mono = talking()
    voice = nar + talk
    vw = B / 'mix-voice.wav'; sf.write(vw, voice, SR, subtype='FLOAT')
    g_v = -16.0 - float(measure(vw)['input_i'])
    sf.write(vw, voice * db(g_v), SR, subtype='FLOAT')
    rest, band = score()
    bw = B / 'mix-bed.wav'; sf.write(bw, rest + band, SR, subtype='FLOAT')
    g_m = -24.0 - float(measure(bw)['input_i'])
    sf.write(B / 'mix-bed-rest.wav', rest * db(g_m), SR, subtype='FLOAT')
    sf.write(B / 'mix-bed-band.wav', band * db(g_m), SR, subtype='FLOAT')
    env = key_env(nar_dry, talk_mono)
    sf.write(B / 'mix-key.wav', (np.stack([env, env], 1) * 0.224).astype(np.float32), SR, subtype='FLOAT')
    hits = np.zeros((N, 2), np.float32); air = np.zeros((N, 2), np.float32)
    for t, layer, y, pan in events(): lay(hits if layer == 'hits' else air, y, t, pan)
    amb = places()
    fxs = (hits * (1 - 0.3 * env)[:, None] + air * (1 - 0.75 * env)[:, None] + amb * (1 - 0.35 * env)[:, None]) * db(g_v)
    sf.write(B / 'mix-sfx.wav', fxs.astype(np.float32), SR, subtype='FLOAT')
    graph = ('[3:a]asplit=2[k1][k2];'
             '[2:a][k1]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=650[bd];'
             '[1:a][k2]sidechaincompress=threshold=0.02:ratio=1.8:attack=30:release=650[rd];'
             '[0:a][bd][rd][4:a]amix=inputs=4:duration=first:normalize=0[mix]')
    pre = B / 'mix-pre.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', vw, '-i', B / 'mix-bed-rest.wav', '-i', B / 'mix-bed-band.wav', '-i', B / 'mix-key.wav', '-i', B / 'mix-sfx.wav',
         '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_f32le', pre])
    m = measure(pre)
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000,"
          f"afade=t=out:st={END - 1.8:.3f}:d=1.8:curve=qsin")   # (the film ends in silence: the card's room and the score tail out)
    final = B / 'mix.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', ln, '-ar', '48000', '-c:a', 'pcm_s24le', final])
    mo = measure(final)
    print(f"mixed: voice {g_v:+.1f} dB, bed {g_m:+.1f} dB; pre {m['input_i']} LUFS -> {mo['input_i']} LUFS, TP {mo['input_tp']}")
    if a.audio_only or not Path(a.film).exists(): return
    out = Path(a.out).with_suffix('.mov') if Path(a.film).suffix == '.mov' else Path(a.out)   # (a ProRes master goes in a .mov: mp4 cannot hold it)
    run(['ffmpeg', '-v', 'error', '-y', '-i', a.film, '-i', final, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'pcm_s24le', '-shortest', out])
    print('muxed', out)


if __name__ == '__main__':
    main()
