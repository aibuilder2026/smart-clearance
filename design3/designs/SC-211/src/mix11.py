"""SC-211: the sales film v2's sound, on the voice's own clock (parts.T), mixed the way the stitch-videos-ffmpeg skill's
montage.py mixes (measured static gains, sidechain ducking, amix without normalising, a two-pass loudnorm), then muxed
under the silent cut.

- the narrator: each line's chosen Maya1 take (tts/vo3/maya1w-warm, made here) at its start, through the voice chain the
  working demo's cuts use (a high-pass, warmth and presence, gentle compression, a faint short room);
- the talking scenes: each clip's own sound (LTX, made with the picture here; the food bank's Veo take from SC-210),
  sped 25/24 with its picture and laid where its first frame plays (shots11.TALK_AT), in its own space, over its own
  room tone for the whole shot; with the narrator, the voice stem, set to -16 LUFS from a measured pass;
- the score: SC-210's six Lyria cues (music10/, made before; nothing generated now), one an act, looped through
  equal-power crossfades and crossfaded into the next, the bed set to -24 LUFS from a measured pass, then ducked in
  ffmpeg by sidechaincompress keyed on the voice's smoothed envelope (held through each talking scene, so the bed never
  swells into a pause): about 20 dB in the voice's presence band (1.2-5 kHz, ratio 20) and 12 dB under it (ratio 2.3);
- sound design, synthesised here from noise and sine tones: a sound for every hand-over by its kind (a whip's whoosh, a
  push through's riser and thump, a light leak's shimmer, a flash's hit, a dip's low swell), every event the scene
  pages report (an agent igniting, a card opening, a click on a button, a gate opening, a shield landing, an audit line,
  the seal, an alert), every stamp, pop-up and shutter, and the clicks on Approve and on the second yes;
- amix (normalize=0), then two-pass loudnorm to -14 LUFS, -1 dBTP, LRA 11, at 48 kHz; the mux; the .srt.
   .venv/bin/python mix11.py [--preview]"""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfiltfilt, fftconvolve
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mix as M
import parts as P_
from mix import SR, B, run, decode, db, xfade_loop, whoosh, riser, boom, shutter, chime, tick, glint, thud, click, notif, sparkle, _sweep
import mix10 as M10

END = P_.END
N = int((END + 0.5) * SR)
LINES = {l['id']: l for l in P_.LINES}
TALK = [lid for lid, l in LINES.items() if l.get('kind') == 'talk']
# each talking scene's space (its prompt's setting): the room's decay (RT60, s), how much of it is heard, and how far its
# own room tone is lifted (dB)
ACOUSTICS = {'t1': (0.9, 0.22, 0.0), 'tn': (0.45, 0.15, 0.0), 'tb': (0.5, 0.15, 0.0), 't2': (0.4, 0.16, 0.0),
             'tk': (0.35, 0.12, 4.0), 't3': (0.35, 0.14, 7.0), 't4': (0.3, 0.10, 3.0), 't5': (0.8, 0.20, 0.0),
             't6': (0.2, 0.08, 7.0), 'tw': (0.9, 0.22, 0.0)}


def measure(path):
    r = run(['ffmpeg', '-hide_banner', '-y', '-i', str(path), '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'])
    return json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])


def gain_to(path, target):
    m = measure(path)
    return target - float(m['input_i'])


# ---------------------------------------------------------------- the voices

def narration():
    vo = np.zeros(N, dtype=np.float32)
    for lid, (t0, t1) in P_.T.items():
        if lid in TALK: continue
        x, sr = sf.read(P_.TAKE / f'{lid}.wav', dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        for cut, add in sorted(P_.PAUSE.get(lid, []), key=lambda c: -(c[0] or 0)):
            i = int((cut if cut is not None else len(x) / sr) * sr)
            x = np.concatenate([x[:i], np.zeros(int(add * sr), np.float32), x[i:]])
        x = resample_poly(x, SR // 8000, sr // 8000).astype(np.float32)
        i = int(t0 * SR); vo[i:i + len(x)] += x[: N - i]
    raw = B / 'vo11-raw.wav'; sf.write(raw, vo, SR, subtype='FLOAT')
    fx_ = B / 'vo11-fx.wav'
    chain = ('highpass=f=75,equalizer=f=190:t=q:w=1.0:g=1.6,equalizer=f=3300:t=q:w=1.3:g=1.8,'
             'equalizer=f=7600:t=q:w=1.6:g=-1.6,acompressor=threshold=-21dB:ratio=2.4:attack=6:release=140:makeup=2.2,'
             'aecho=0.88:0.6:23|41:0.07|0.045,pan=stereo|c0=c0|c1=c0')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', chain, '-c:a', 'pcm_f32le', str(fx_)])
    nar, _ = sf.read(fx_, dtype='float32')
    return vo, nar[:N]


def talking(spans, at):
    talk = np.zeros((N, 2), np.float32); mono = np.zeros(N, np.float32)
    for lid in TALK:
        src = B / 'talk11' / f'{lid}.wav'
        if not src.exists():
            print('no sound yet for', lid); continue
        lv = B / 'talk11' / f'{lid}-lev.wav'
        run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af',
             'highpass=f=70,acompressor=threshold=-22dB:ratio=2.0:attack=8:release=160:makeup=1.5,loudnorm=I=-18:TP=-2:LRA=7',
             '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', str(lv)])
        x, _ = sf.read(lv, dtype='float32')
        rt60, mix_, lift = ACOUSTICS.get(lid, (0.4, 0.14, 0.0))
        ir = M10.room_ir(rt60, pre=0.008 + 0.01 * rt60, seed=sum(map(ord, lid)))
        wet = np.stack([fftconvolve(x[:, c], ir)[: len(x)] for c in range(2)], 1).astype(np.float32)
        x = x + mix_ * wet
        i = int(at[lid] * SR)
        n = min(len(x), N - i)
        fade = np.ones(n, np.float32); k = int(0.06 * SR); fade[:k] = np.linspace(0, 1, k); fade[-k:] = np.linspace(1, 0, k)
        talk[i:i + n] += x[:n] * fade[:, None]
        mono[i:i + n] += x[:n].mean(axis=1) * fade
        s0, s1 = spans[lid]
        j0, j1 = int(s0 * SR), min(N, int(s1 * SR))
        bed = M10.room_tone(x, j1 - j0, seed=sum(map(ord, lid)) * 7)
        fb = np.ones(j1 - j0, np.float32); kb = int(0.35 * SR); fb[:kb] = np.linspace(0, 1, kb); fb[-kb:] = np.linspace(1, 0, kb)
        talk[j0:j1] += bed * fb[:, None] * 0.85 * db(lift)
    return talk, mono


def key_env(nar_dry, talk_mono, spans):
    """the duck's key: the voice's envelope (quick to rise, slow to fall, a little ahead of each line), held through the
    talking scenes and through any pause under 0.7 s, so the bed rests under the speech instead of pumping"""
    env = M.envelope(nar_dry + talk_mono)
    hop = 480
    on = env.reshape(-1)[: N // hop * hop].reshape(-1, hop).max(axis=1)
    gap = int(0.7 * SR / hop); last = -10 ** 9
    held = on.copy()
    for i, v in enumerate(on):
        if v > 0.5: last = i
        elif i - last < gap: held[i] = max(held[i], 0.85)
    e = np.repeat(held, hop); e = np.pad(e, (0, N - len(e)), mode='edge')[:N]
    for lid in TALK:
        a, b = spans[lid]
        e[int(a * SR):int(min(END, b) * SR)] = np.maximum(e[int(a * SR):int(min(END, b) * SR)], 0.9)
    # smoothed, so the compressor never sees an edge
    k = int(0.05 * SR); ker = np.ones(k, np.float32) / k
    e = np.convolve(e, ker, mode='same').astype(np.float32)
    return e


# ---------------------------------------------------------------- the score

CUES = [('waste', 'waste-2102'), ('reveal', 'reveal-2101'), ('eco', 'eco-2102'),
        ('journey', ['journey-2101', 'journey-2102', 'journey-2101', 'journey-2102', 'journey-2101']),
        ('papers', 'papers-2101'), ('close', 'close-2102')]


def score(shots):
    starts = {'waste': 0.0, 'reveal': shots['title'][0] - 1.0, 'eco': shots['graphA'][0] - 0.5, 'journey': shots['detect'][0] - 0.8,
              'papers': shots['papers'][0] - 0.8, 'close': shots['integrations'][0] - 1.0}
    acts = list(starts)
    F = int(3.0 * SR)
    track = np.zeros((N, 2), np.float32)
    for k, (act, key) in enumerate(CUES):
        a = int(starts[act] * SR)
        b = int(starts[acts[k + 1]] * SR) + F if k + 1 < len(acts) else N
        need = b - a
        if isinstance(key, list):
            parts = [decode(HERE / 'music10' / f'{kk}.wav') for kk in key]
            x = parts[0]
            for p in parts[1:]:
                w = np.linspace(0, 1, F, dtype=np.float32)[:, None]
                x = np.concatenate([x[:-F], x[-F:] * np.cos(w * np.pi / 2) + p[:F] * np.sin(w * np.pi / 2), p[F:]])
            seg = xfade_loop(x, need, F)
        else:
            seg = xfade_loop(decode(HERE / 'music10' / f'{key}.wav'), need, F)
        seg = seg / max(1e-6, np.sqrt(np.mean(seg ** 2))) * db(-22)   # each act levelled on its own
        w = np.ones((need, 1), np.float32)
        if k > 0: w[:F, 0] = np.sin(np.linspace(0, 1, F) * np.pi / 2)
        if k + 1 < len(acts): w[-F:, 0] = np.cos(np.linspace(0, 1, F) * np.pi / 2)
        track[a:b] += seg[:need] * w
    head = np.linspace(0, 1, int(1.8 * SR))[:, None]; track[: len(head)] *= head
    t_end = int((END - 3.2) * SR); tail = np.linspace(1, 0, N - t_end)[:, None] ** 1.5; track[t_end:] *= tail
    band = sosfiltfilt(butter(2, [1200, 5000], btype='bandpass', fs=SR, output='sos'), track, axis=0).astype(np.float32)
    return track - band, band


# ---------------------------------------------------------------- the sound design

def uiclick(level=-24):
    """a click on a button: a tiny bright tap and a short high tick"""
    c = click(level)
    t_ = tick(level - 4, 2200.0)
    out = np.zeros(max(len(c), len(t_)), np.float32); out[:len(c)] += c; out[:len(t_)] += t_
    return out


def pop(level=-27):
    """a card opening: a quick upward sine bloop with a soft tail"""
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 520 + 420 * (1 - np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.05)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def clink(level=-28):
    """a shield landing: two high partials, a metallic clink"""
    n = int(0.5 * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 2637 * t) + 0.7 * np.sin(2 * np.pi * 3951 * t) + 0.3 * np.sin(2 * np.pi * 5274 * t)) * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.09)
    return (y / (np.abs(y).max() + 1e-6) * db(level)).astype(np.float32)


def alarm(level=-26):
    """an alert: two soft two-tone beeps"""
    out = np.zeros(int(0.9 * SR), np.float32)
    for k, f in enumerate([880.0, 660.0, 880.0, 660.0]):
        n = int(0.14 * SR); t = np.arange(n) / SR
        y = np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / t[-1]) ** 0.6
        i = int(k * 0.19 * SR); out[i:i + n] += y
    return (out / (np.abs(out).max() + 1e-6) * db(level)).astype(np.float32)


def gate(level=-22):
    """a human gate opening: a low swell and a warm two-note chime"""
    lo = boom(1.2, level, 92.0, 48.0)
    ch = chime(level - 3, notes=((783.99, 0.05), (1174.66, 0.16)))
    out = np.zeros(max(len(lo), len(ch)), np.float32); out[:len(lo)] += lo; out[:len(ch)] += ch
    return out


def whip(rnd, level=-23):
    return whoosh(rnd, 0.55, 0.42, level, lo=0.03, hi=0.4)


def soft_air(rnd, level=-29):
    return whoosh(rnd, 1.3, 0.55, level, lo=0.015, hi=0.18)


PAGE_SOUND = {
    'ignite': lambda r: glint(-33), 'whoosh_in': lambda r: whoosh(r, 0.8, 0.45, -27), 'whoosh': lambda r: whoosh(r, 1.1, 0.5, -26),
    'hit': lambda r: boom(1.6, -20, 70.0, 40.0), 'badge': lambda r: chime(-31, ((1567.98, 0.0), (2093.0, 0.08))),
    'sparkle': lambda r: sparkle(0.6, 12, -34), 'click': lambda r: uiclick(-23), 'card': lambda r: pop(-28),
    'edge': lambda r: tick(-37, 1320.0), 'rails': lambda r: riser(r, 0.9, -29), 'panel': lambda r: whoosh(r, 0.7, 0.4, -29),
    'rule': lambda r: tick(-30, 1046.5), 'shield': lambda r: clink(-29), 'gate': lambda r: gate(-23),
    'log': lambda r: tick(-35, 1760.0), 'logyes': lambda r: chime(-30, ((1174.66, 0.0), (1567.98, 0.07))),
    'stamp': lambda r: thud(-19), 'pop': lambda r: pop(-27), 'tick': lambda r: tick(-31, 1318.5), 'glint': lambda r: glint(-30),
    'riser': lambda r: riser(r, 1.0, -30), 'alarm': lambda r: alarm(-25), 'chime': lambda r: chime(-27), 'notif': lambda r: notif(-26),
}


def sfx(S, spans_all):
    import parts10 as P10
    import parts11 as P11
    import shots11
    from parts6 import PhonePop
    from shots7 import Flash
    hits = np.zeros((N, 2), np.float32); air = np.zeros((N, 2), np.float32)
    rnd = np.random.default_rng(211)
    def lay(buf, y, t, pan=0.5, anchor=0.0):
        i = int((t - anchor) * SR)
        if i < 0: y = y[-i:]; i = 0
        n = min(len(y), N - i)
        if n <= 0: return
        l, r = np.cos(pan * np.pi / 2), np.sin(pan * np.pi / 2)
        buf[i:i + n, 0] += y[:n] * l * 1.414; buf[i:i + n, 1] += y[:n] * r * 1.414
    speech = sorted(P_.T.values())
    def speaking(a, b): return any(x < b and y > a for x, y in speech)
    for k, s in enumerate(S):
        mid = s.t0 + shots11.XF / 2
        if k > 0:
            kind = getattr(s, 'xin', 'dissolve')
            quiet = -6 if speaking(mid - 0.4, mid + 0.4) else 0
            if kind == 'whip': lay(air, whip(rnd, -23 + quiet), mid, 0.3 + 0.4 * (k % 2), anchor=0.24)
            elif kind == 'zoom':
                lay(air, riser(rnd, 0.5, -28 + quiet), mid, 0.5, anchor=0.5)
                lay(hits, boom(0.7, -27 + quiet, 96.0, 52.0), mid, 0.5)
            elif kind == 'leak':
                lay(air, soft_air(rnd, -29 + quiet), mid, 0.5, anchor=0.6)
                lay(hits, glint(-35 + quiet), mid, 0.6)
            elif kind == 'flash': lay(hits, boom(0.9, -22 + quiet, 80.0, 45.0), mid, 0.5)
            elif kind == 'dip': lay(hits, boom(1.6, -30 + quiet, 58.0, 36.0), mid, 0.5)
            elif kind == 'dissolve': lay(air, whoosh(rnd, 1.1, 0.6, -30 + quiet), mid, 0.4, anchor=0.55)
        for it in s.items:
            if isinstance(it, P10.StampSlam): lay(hits, thud(-17), s.t0 + it.u0, 0.55)
            elif isinstance(it, (PhonePop, P11.PhonePopAt)): lay(hits, notif(-27), s.t0 + it.u0 + 0.05, 0.4)
            elif isinstance(it, P11.ScreenPop): lay(hits, pop(-28), s.t0 + it.u0 + 0.1, 0.45)
            elif isinstance(it, Flash): lay(hits, shutter(-20), s.t0 + it.u0, 0.5)
        if s.name == 'title':
            lay(air, riser(rnd, 1.6, -26), s.t0 + 0.2, 0.5)
            lay(hits, boom(2.0, -18), s.t0 + 0.2 + 1.55, 0.5)
            lay(hits, glint(-28), s.t0 + 1.2, 0.6)
        if s.name == 'godown':
            lay(air, riser(rnd, 1.5, -30), 0.1, 0.5)
            lay(hits, boom(2.2, -24, 52.0, 34.0), 1.5, 0.5)
        if s.name == 'end':
            lay(air, riser(rnd, 1.2, -28), s.t0 - 0.9, 0.5)
            lay(hits, boom(2.2, -19), s.t0 + 0.3, 0.5)
        if s.name == 'upi':
            lay(hits, chime(-25), s.t0 + getattr(s.bg, 't_paid', 2.5), 0.6)
        # the scene pages' own events
        pg = getattr(s.bg, 'dir', None)
        if pg is not None and (Path(pg) / 'events.json').exists():
            for e in json.loads((Path(pg) / 'events.json').read_text()):
                kind = e.get('kind') or e.get('type')   # the graph names it 'type', the other pages 'kind'
                f_ = PAGE_SOUND.get(kind)
                if f_ is None: continue
                lay(hits if kind not in ('whoosh', 'whoosh_in', 'rails', 'panel', 'riser') else air, f_(rnd), s.t0 + e['t'], e.get('pan', 0.5))
    for t in shots11.CLICKS:
        lay(hits, uiclick(-22), t, 0.55)
        lay(hits, chime(-28, ((783.99, 0.05), (1174.66, 0.15))), t + 0.02, 0.55)
    return hits, air


def srt(S):
    def ts(x):
        h = int(x // 3600); m_ = int(x % 3600 // 60); s_ = x % 60
        return f'{h:02d}:{m_:02d}:{int(s_):02d},{int(round((s_ - int(s_)) * 1000)):03d}'
    out = []
    for i, l in enumerate(P_.LINES):
        t0, t1 = P_.T[l['id']]
        txt = l['text']
        if l.get('kind') == 'talk': txt = f'— {txt}'
        out.append(f"{i + 1}\n{ts(t0)} --> {ts(t1 + 0.2)}\n{txt}\n")
    (B / 'smart-clearance-sales-film-v2.srt').write_text('\n'.join(out))


def main():
    preview = '--preview' in sys.argv
    import shots11
    S = shots11.build()
    spans = {s.name: (s.t0, s.t1) for s in S}
    nar_dry, nar = narration()
    talk, talk_mono = talking(spans, shots11.TALK_AT)
    voice = nar + talk
    vw = B / 'mix11-voice.wav'; sf.write(vw, voice, SR, subtype='FLOAT')
    g_v = gain_to(vw, -16.0)                      # the voice to -16 LUFS (measured)
    sf.write(vw, voice * db(g_v), SR, subtype='FLOAT')
    rest, band = score(spans)
    bw = B / 'mix11-bed.wav'; sf.write(bw, rest + band, SR, subtype='FLOAT')
    g_m = gain_to(bw, -24.0)                      # the bed to -24 LUFS (measured), before ducking
    sf.write(B / 'mix11-bed-rest.wav', rest * db(g_m), SR, subtype='FLOAT')
    sf.write(B / 'mix11-bed-band.wav', band * db(g_m), SR, subtype='FLOAT')
    env = key_env(nar_dry, talk_mono, spans)
    key = np.stack([env, env], 1) * 0.224         # at a line, 21 dB over the threshold: ~20 dB of duck at ratio 20, ~12 at 2.3
    sf.write(B / 'mix11-key.wav', key.astype(np.float32), SR, subtype='FLOAT')
    hits, air = sfx(S, spans)
    fxs = (hits * (1 - 0.3 * env)[:, None] + air * (1 - 0.82 * env)[:, None]) * db(g_v)   # held to the voice's balance
    sf.write(B / 'mix11-sfx.wav', fxs.astype(np.float32), SR, subtype='FLOAT')
    graph = ('[3:a]asplit=2[k1][k2];'
             '[2:a][k1]sidechaincompress=threshold=0.02:ratio=20:attack=20:release=400[bd];'
             '[1:a][k2]sidechaincompress=threshold=0.02:ratio=2.3:attack=20:release=400[rd];'
             '[0:a][bd][rd][4:a]amix=inputs=4:duration=first:normalize=0[mix]')
    pre = B / 'mix11-pre.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(vw), '-i', str(B / 'mix11-bed-rest.wav'), '-i', str(B / 'mix11-bed-band.wav'),
         '-i', str(B / 'mix11-key.wav'), '-i', str(B / 'mix11-sfx.wav'), '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_f32le', str(pre)])
    m = measure(pre)
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
    final = B / 'mix11.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(pre), '-af', ln, '-ar', '48000', '-c:a', 'pcm_s24le', str(final)])
    silent = B / ('film11-preview.mp4' if preview else 'film11-silent.mp4')
    out = B / ('film11-preview-av.mp4' if preview else 'smart-clearance-sales-film-v2.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(silent), '-i', str(final), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', str(out)])
    srt(S)
    mo = measure(out)
    print('mixed', out, f"voice {g_v:+.1f} dB, bed {g_m:+.1f} dB; pre {m['input_i']} LUFS -> out {mo['input_i']} LUFS, TP {mo['input_tp']}")


if __name__ == '__main__':
    main()
