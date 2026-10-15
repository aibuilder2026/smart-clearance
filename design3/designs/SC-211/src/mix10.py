"""SC-210: the sales film's sound, on the voice's own clock (parts.T), muxed under the silent cut.

- the narrator: each line's chosen Gemini-TTS take (tts/vo3/gemini-Sulafat) at its start, through mix.py's voice chain;
- the talking scenes: each clip's own sound (Veo 3.1, build/talk/<id>.wav, sped up 25/24 with its picture) at its
  line's start, with the same gentle high-pass and compression, so a person in the scene sits with the narrator;
- the score: six Lyria 2 cues (music10/, picked by Gemini as ears), one per act, each looped through equal-power
  cross-fades to its act's length and cross-faded into the next over 3 s, ducked about 12 dB under every voice (20 in
  the voice's presence band), faded in from the black and out on the end card;
- sound design, synthesised (mix.py's whoosh, riser, boom, thud, shutter, chime, tick, glint, notif, sparkle), laid
  where the shots put their motion: a whoosh under each cut, a thud for each stamp, a notification for each push, a
  shutter for the camera, a chime as the UPI payment goes through, a glint as each agent is named in the ecosystem and
  a sparkle on the yes, a riser and a low hit on the title and the end card;
- one loudness pass (two-pass loudnorm to -14 LUFS, true peak -1.5 dB), then the mux, and the .srt.
   .venv/bin/python mix10.py [--preview]"""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mix as M
import parts as P_
from mix import SR, N, END, B, run, decode, db, envelope, xfade_loop, whoosh, riser, boom, thud, shutter, chime, tick, glint, notif, sparkle

LINES = {l['id']: l for l in P_.LINES}
TALK = [lid for lid, l in LINES.items() if l.get('kind') == 'talk']
# each talking scene's space (its prompt's setting): the room's decay (RT60, s), how much of it is heard, and how far its
# own room tone is lifted (dB): a godown and a wholesale warehouse ring, an office is small, a lane, a yard and a
# landfill's edge are open air, with their ambience up
ACOUSTICS = {'t1': (0.9, 0.22, 0.0), 't2': (0.4, 0.16, 0.0), 't3': (0.35, 0.14, 7.0),
             't4': (0.3, 0.10, 3.0), 't5': (0.8, 0.20, 0.0), 't6': (0.2, 0.08, 7.0)}


def room_ir(rt60=0.42, pre=0.008, seed=210):
    """a small room's impulse response: a few early reflections, then a tail of noise decaying to -60 dB in rt60,
    darker as it decays (air and soft furnishing)"""
    n = int((pre + rt60 * 1.1) * SR)
    rng = np.random.default_rng(seed)
    t = np.arange(n) / SR
    tail = rng.standard_normal(n).astype(np.float32) * np.exp(-6.91 * np.maximum(0, t - pre) / rt60)
    tail[: int(pre * SR)] = 0
    y = np.zeros(n, np.float32); a = 0.0
    k = np.exp(-2 * np.pi * 2800 / SR)          # a one-pole low-pass, darkening the tail
    for i in range(n):
        a = (1 - k) * tail[i] + k * a; y[i] = a
    for d, g in ((0.007, 0.5), (0.013, 0.35), (0.021, 0.25), (0.029, 0.18)):
        y[int(d * SR)] += g * 0.05
    return y / np.sqrt((y ** 2).sum())


def room_tone(x, n_out, seed):
    """a bed of the scene's own room tone, as long as its shot: the spectrum of the clip's quietest moments, with new
    phases (so nothing loops)"""
    from scipy.signal import stft, istft
    m = x.mean(axis=1) if x.ndim > 1 else x
    nfft, hop = 2048, 512
    f, _, Z = stft(m, SR, nperseg=nfft, noverlap=nfft - hop)
    e = (np.abs(Z) ** 2).sum(0)
    quiet = e <= np.percentile(e, 12)
    mag = np.sqrt((np.abs(Z[:, quiet]) ** 2).mean(1))
    out = []
    for sd in (seed, seed + 1):
        rng = np.random.default_rng(sd)
        nfr = int(np.ceil(n_out / hop)) + 6
        Zs = mag[:, None] * np.exp(1j * rng.uniform(0, 2 * np.pi, (len(f), nfr)))
        _, y = istft(Zs, SR, nperseg=nfft, noverlap=nfft - hop)
        out.append(np.asarray(y[:n_out], np.float32))
    c = 0.75 * out[0] + 0.25 * out[1]; d = 0.75 * out[1] + 0.25 * out[0]
    return np.stack([c, d], 1)


def voices(shots):
    """the narrator (with its chain) and the talking scenes (their own sound, in their own space, over their own room
    tone for the whole shot), and the envelope the score ducks under"""
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
    raw = B / 'vo10-raw.wav'; sf.write(raw, vo, SR, subtype='FLOAT')
    fx = B / 'vo10-fx.wav'
    chain = ('highpass=f=75,equalizer=f=190:t=q:w=1.0:g=1.6,equalizer=f=3300:t=q:w=1.3:g=1.8,'
             'equalizer=f=7600:t=q:w=1.6:g=-1.6,acompressor=threshold=-21dB:ratio=2.4:attack=6:release=140:makeup=2.2,'
             'aecho=0.88:0.6:23|41:0.07|0.045,pan=stereo|c0=c0|c1=c0')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', chain, '-c:a', 'pcm_f32le', str(fx)])
    nar, _ = sf.read(fx, dtype='float32'); nar = nar[:N]
    # the talking scenes: their own sound, levelled to the narrator's, a light high-pass and compression
    talk = np.zeros((N, 2), dtype=np.float32); talk_mono = np.zeros(N, dtype=np.float32)
    for lid in TALK:
        src = B / 'talk' / f'{lid}.wav'
        lv = B / 'talk' / f'{lid}-lev.wav'
        run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af',
             'highpass=f=70,acompressor=threshold=-22dB:ratio=2.0:attack=8:release=160:makeup=1.5,loudnorm=I=-18:TP=-2:LRA=7',
             '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', str(lv)])
        x, _ = sf.read(lv, dtype='float32')
        from scipy.signal import fftconvolve
        rt60, mix_, lift = ACOUSTICS[lid]
        ir = room_ir(rt60, pre=0.008 + 0.01 * rt60, seed=int(lid[1:]))
        wet = np.stack([fftconvolve(x[:, c], ir)[: len(x)] for c in range(2)], 1).astype(np.float32)
        x = x + mix_ * wet                                    # the speech in the scene's own space
        i = int(P_.T[lid][0] * SR)
        n = min(len(x), N - i)
        fade = np.ones(n, np.float32); k = int(0.04 * SR); fade[:k] = np.linspace(0, 1, k); fade[-k:] = np.linspace(1, 0, k)
        talk[i:i + n] += x[:n] * fade[:, None]
        talk_mono[i:i + n] += x[:n].mean(axis=1) * fade
        # the room tone under the whole shot, faded at its edges
        s0, s1 = shots[lid]
        j0, j1 = int(s0 * SR), min(N, int(s1 * SR))
        bed = room_tone(x, j1 - j0, seed=int(lid[1:]) * 7)
        fb = np.ones(j1 - j0, np.float32); kb = int(0.35 * SR); fb[:kb] = np.linspace(0, 1, kb); fb[-kb:] = np.linspace(1, 0, kb)
        talk[j0:j1] += bed * fb[:, None] * 0.85 * db(lift)
    # the score stays down through a talking scene, its pauses and its change of speaker included, instead of swelling
    # into each gap
    hold = np.zeros(N, np.float32)
    for lid in TALK:
        i0, i1 = int(P_.T[lid][0] * SR), min(N, int((P_.T[lid][1] + 0.2) * SR))
        hold[i0:i1] = 0.03
    duck = vo + talk_mono
    return np.where(hold > 0, np.maximum(np.abs(duck), hold), duck), nar, talk


CUES = [  # act, the cue, where it starts (film seconds), the offset into the clip it starts from
    ('waste', 'waste-2102', 0.0, 0.0),
    ('reveal', 'reveal-2101', None, 0.0),
    ('eco', 'eco-2102', None, 0.0),
    ('journey', ['journey-2101', 'journey-2102', 'journey-2101', 'journey-2102'], None, 0.0),
    ('papers', 'papers-2101', None, 0.0),
    ('close', 'close-2102', None, 0.0),
]


def score(env, shots):
    starts = {'waste': 0.0, 'reveal': shots['title'][0] - 1.0, 'eco': shots['eco'][0] - 0.5, 'journey': shots['detect'][0] - 0.8,
              'papers': shots['papers'][0] - 0.8, 'close': shots['integrations'][0] - 1.0}
    acts = list(starts)
    F = int(3.0 * SR)
    track = np.zeros((N, 2), np.float32)
    for k, (act, key, _, _) in enumerate(CUES):
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
        # each cue levelled on its own, so one act is not louder than the next
        seg = seg / max(1e-6, np.sqrt(np.mean(seg ** 2))) * db(-22)
        w = np.ones((need, 1), np.float32)
        if k > 0: w[:F, 0] = np.sin(np.linspace(0, 1, F) * np.pi / 2)
        if k + 1 < len(acts): w[-F:, 0] = np.cos(np.linspace(0, 1, F) * np.pi / 2)
        track[a:b] += seg[:need] * w
    head = np.linspace(0, 1, int(1.8 * SR))[:, None]; track[: len(head)] *= head
    t_end = int((END - 3.2) * SR); tail = np.linspace(1, 0, N - t_end)[:, None] ** 1.5; track[t_end:] *= tail
    from scipy.signal import butter, sosfiltfilt
    band = sosfiltfilt(butter(2, [1200, 5000], btype='bandpass', fs=SR, output='sos'), track, axis=0).astype(np.float32)
    gain = (1 - 0.75 * env)[:, None]
    return (track - band) * gain + band * (1 - 0.9 * env)[:, None]


def sfx(S):
    """the sound design, from the shots' own motion"""
    import parts10 as P10
    from parts6 import PhonePop
    from shots7 import Flash
    hits = np.zeros((N, 2), np.float32); air = np.zeros((N, 2), np.float32)
    rnd = np.random.default_rng(210)
    def lay(buf, y, t, pan=0.5, anchor=0.0):
        i = int((t - anchor) * SR)
        if i < 0: y = y[-i:]; i = 0
        n = min(len(y), N - i)
        if n <= 0: return
        l, r = np.cos(pan * np.pi / 2), np.sin(pan * np.pi / 2)
        buf[i:i + n, 0] += y[:n] * l * 1.414; buf[i:i + n, 1] += y[:n] * r * 1.414
    talky = {nm for nm in ('t1', 't2', 't3', 't4', 't5', 't6')}
    spans = sorted(P_.T.values())          # every voice, the narrator's and the people's
    for k, s in enumerate(S):
        name = s.name
        if k > 0:   # a soft whoosh under each cut (quieter into and out of the talking scenes), never over a last word
            lvl = -31 if (name in talky or S[k - 1].name in talky) else -27
            start = s.t0 - 0.52
            ended = [b for a, b in spans if b <= s.t0 + 0.4 and b > start - 0.02]
            if ended: start = max(ended) + 0.06
            across = any(a < start + 0.9 and b > start for a, b in spans)
            if start > s.t0 + 0.3: continue
            y = whoosh(rnd, 1.2, 0.6, lvl - (6 if across else 0))
            lay(air, y, start, 0.3 + 0.4 * (k % 2))
        for it in s.items:
            u0 = getattr(it, 'u0', None)
            if isinstance(it, P10.StampSlam): lay(hits, thud(-16), s.t0 + it.u0, 0.55)
            elif isinstance(it, PhonePop): lay(hits, notif(-27), s.t0 + it.u0 + 0.05, 0.4)
            elif isinstance(it, Flash): lay(hits, shutter(-20), s.t0 + it.u0, 0.5)
        if name == 'title':
            lay(air, riser(rnd, 1.6, -26), s.t0 + 0.2, 0.5)
            lay(hits, boom(2.0, -18), s.t0 + 0.2 + 1.55, 0.5)
            lay(hits, glint(-28), s.t0 + 1.2, 0.6)
        if name == 'end':
            lay(air, riser(rnd, 1.2, -28), s.t0 - 0.9, 0.5)
            lay(hits, boom(2.2, -19), s.t0 + 0.3, 0.5)
        if name == 'eco':
            cues = json.loads((HERE / 'build' / 'eco-cues.json').read_text())
            lay(hits, boom(2.4, -20, 55, 34), s.t0 + cues['ten'], 0.5)
            for i, key in enumerate(['data', 'watcher', 'vision', 'valuer', 'router', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact']):
                lay(hits, glint(-31), s.t0 + cues[key], 0.25 + 0.5 * (i % 2))
            lay(hits, sparkle(0.9, 18, -30), s.t0 + cues['yes'] - 0.05, 0.5)
            lay(air, whoosh(rnd, 1.6, 0.7, -29), s.t0 + cues['pubsub'], 0.5, anchor=0.4)
        if name == 'upi':
            lay(hits, chime(-25), s.t0 + getattr(s.bg, 't_paid', 2.5), 0.6)
        if name in ('tap', 'second-yes'):
            lay(hits, tick(-27, 660), s.t0 + 0.35, 0.5)
    return hits, air


def srt(S):
    def ts(x):
        h = int(x // 3600); m_ = int(x % 3600 // 60); s_ = x % 60
        return f'{h:02d}:{m_:02d}:{int(s_):02d},{int(round((s_ - int(s_)) * 1000)):03d}'
    out = []
    for i, l in enumerate(P_.LINES):
        t0, t1 = P_.T[l['id']]
        txt = l['text'].replace(' / ', '\n')
        if l.get('kind') == 'talk':
            txt = f"— {txt}"
        out.append(f"{i + 1}\n{ts(t0)} --> {ts(t1 + 0.2)}\n{txt}\n")
    (B / 'smart-clearance-sales-film.srt').write_text('\n'.join(out))


def main():
    preview = '--preview' in sys.argv
    import shots10
    S = shots10.build()
    shots = {s.name: (s.t0, s.t1) for s in S}
    ducker, nar, talk = voices(shots)
    env = envelope(ducker)
    hits, air = sfx(S)
    mus = score(env, shots)
    mix = nar + talk + mus + hits * (1 - 0.3 * env)[:, None] + air * (1 - 0.82 * env)[:, None]
    pre = B / 'mix10-pre.wav'; sf.write(pre, mix.astype(np.float32), SR, subtype='FLOAT')
    r = run(['ffmpeg', '-hide_banner', '-y', '-i', str(pre), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    final = B / 'mix10.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(pre), '-af', ln, '-ar', str(SR), '-c:a', 'pcm_s24le', str(final)])
    silent = B / ('film-preview.mp4' if preview else 'film-silent.mp4')
    out = B / ('film-preview-av.mp4' if preview else 'smart-clearance-sales-film.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(silent), '-i', str(final), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', str(out)])
    srt(S); print('mixed', out, f"(input {m['input_i']} LUFS)")


if __name__ == '__main__':
    main()
