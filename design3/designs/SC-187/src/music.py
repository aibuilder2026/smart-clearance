"""SC-187: the demo film's music, a very light generative bed for a voice-over, in numpy. Reworked from SC-158's
score (a warm pad on D A Bm G at 76 bpm, a pentatonic pluck, a sub, a shaker and a tak): here a felt-piano-like
pluck with a slow attack, a warm pad under a slow filter sweep, a very quiet sub, a soft shaker, through a gentle
reverb, everything kept under the voice's band (the pad low-passed at 1.8 kHz at the fullest, no melody note above
F#5, no harsh partials) and never a beat the voice fights. Deterministic (seed 187).

The arrangement follows the storyboard (184 s, 48 kHz stereo, peak -8 dBFS):
  0:00 the pad and a sparse pluck (the problem, the title)
  0:28 the sub and a soft tak enter, the pluck grows a little (Detect)
  1:17 a gentle lift: the shaker enters, the pluck opens up (the five channels)
  2:22 a warmer, fuller lift: a sub-octave under the pad, the filter opens (the ledger)
  2:46 everything but the pad thins away and the level settles (the close)
  2:58 to 3:03 the fade; silent to 3:04

  uv run --with numpy --with scipy python music.py --out music.wav
"""

import argparse
import wave

import numpy as np
from scipy.signal import butter, lfilter, lfilter_zi

SR = 48000
BPM = 76
BEAT = 60 / BPM
rng = np.random.default_rng(187)

# the storyboard's marks, in seconds
DETECT, CHANNELS, LEDGER, CLOSE, FADE_FROM, FADE_TO = 28.0, 77.0, 142.0, 166.0, 178.0, 183.0


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


# D major: D A Bm G (I V vi IV), four beats a chord, voiced low and close so the pad sits under the voice
CHORDS = [[50, 57, 62, 66], [45, 52, 57, 61], [47, 54, 59, 62], [43, 50, 55, 59]]
ROOTS = [38, 45, 47, 43]
PENTA = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78]  # D3 to F#5 (740 Hz at most)


def env(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    """an ADSR over n samples (attack, decay, release in seconds, sustain level)"""
    a_, d_, r_ = int(a * SR), int(d * SR), int(r * SR)
    out = np.ones(n) * s
    out[:a_] = np.linspace(0, 1, a_)[:n]
    if a_ < n:
        out[a_ : a_ + d_] = np.linspace(1, s, d_)[: max(0, n - a_)]
    if r_ < n:
        out[n - r_ :] *= np.linspace(1, 0, r_)
    return out


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, cutoff / (SR / 2))
    return lfilter(b, a, x)


def highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    b, a = butter(2, cutoff / (SR / 2), btype="high")
    return lfilter(b, a, x)


def sweep(x: np.ndarray, cutoff_at, block: int = 2048) -> np.ndarray:
    """a second-order lowpass whose cutoff follows cutoff_at(t), block by block, the state carried over"""
    out = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        c = float(cutoff_at((s + block / 2) / SR))
        b, a = butter(2, min(c, SR * 0.45) / (SR / 2))
        if zi is None:
            zi = lfilter_zi(b, a) * x[0]
        out[s : s + block], zi = lfilter(b, a, x[s : s + block], zi=zi)
    return out


def ramp(t: np.ndarray, at: float, over: float = 6.0) -> np.ndarray:
    """0 before `at`, 1 after `at + over`, a smooth (cosine) curve between"""
    x = np.clip((t - at) / over, 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * x)


def pad_note(freq: float, n: int, t: np.ndarray) -> np.ndarray:
    """three slightly detuned saws, softened hard, with a slow vibrato: the pad's raw voice"""
    out = np.zeros(n)
    for det in (-0.5, 0.0, 0.5):
        f = freq * 2 ** (det / 1200) * (1 + 0.0012 * np.sin(2 * np.pi * 0.16 * t + det))
        ph = np.cumsum(f) / SR
        saw = 2 * (ph - np.floor(ph + 0.5))
        out += saw
    return lowpass(out / 3, 700, 2)


def felt(freq: float, n: int) -> np.ndarray:
    """a felt-piano-like note: a slow attack, a dark tone (the fundamental and three soft partials, each dying
    sooner than the last), a muffled touch of noise, no partial above 2.2 kHz"""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, (amp, decay) in enumerate(((1.0, 2.6), (0.28, 1.1), (0.10, 0.55), (0.04, 0.3)), start=1):
        f = freq * k
        if f > 2200:
            break
        out += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, np.pi)) * np.exp(-t / decay)
    touch = lowpass(rng.uniform(-1, 1, n), 420, 2) * np.exp(-t / 0.018) * 0.35
    out += touch
    attack = min(n, int(0.028 * SR))
    out[:attack] *= 0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, attack))
    out = lowpass(out, 2200, 1)
    return out * 0.55


def shaker(n: int) -> np.ndarray:
    """a soft shaker: a short brush of noise, kept between 5 and 9 kHz, above the voice"""
    noise = rng.uniform(-1, 1, n)
    x = lowpass(highpass(noise, 5000), 9000, 2) * np.exp(-np.arange(n) / (0.035 * SR))
    return x * 0.5


def tak(n: int) -> np.ndarray:
    """a round, muted thump, no click"""
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (150 * np.exp(-t * 20) + 64) * t) * np.exp(-t / 0.08)
    return lowpass(thump, 300, 1) * 0.9


def reverb(x: np.ndarray, mix: float = 0.22) -> np.ndarray:
    """a Schroeder reverb with a gentle, dark tail: four combs in parallel, two allpasses in series"""
    out = np.zeros_like(x)
    for delay, g in ((1557, 0.86), (1617, 0.85), (1491, 0.87), (1422, 0.84)):
        a = np.zeros(delay + 1)
        a[0], a[-1] = 1, -g
        out += lfilter([1.0], a, x)
    out /= 4
    for delay, g in ((225, 0.7), (556, 0.7)):
        b = np.zeros(delay + 1)
        b[0], b[-1] = -g, 1
        a = np.zeros(delay + 1)
        a[0], a[-1] = 1, -g
        out = lfilter(b, a, out)
    out = lowpass(out, 3200, 1)
    return x * (1 - mix) + out * mix


def compose(length: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    left, right = np.zeros(n), np.zeros(n)
    chord_len = 4 * BEAT

    # the pad: every chord, overlapping by a beat, then a slow filter sweep that opens a little at each lift
    pad = np.zeros(n)
    i = 0
    while i * chord_len < length:
        ch = CHORDS[i % 4]
        s = int(i * chord_len * SR)
        m = min(n - s, int((chord_len + BEAT) * SR))
        if m <= 0:
            break
        tt = np.arange(m) / SR
        note = sum(pad_note(hz(p), m, tt) * (0.9 if j == 0 else 0.55) for j, p in enumerate(ch))
        pad[s : s + m] += note * env(m, 1.8, 0.4, 0.8, 1.4)
        i += 1

    def pad_cutoff(tc: float) -> float:
        base = 1000 + 250 * np.sin(2 * np.pi * tc / 46)  # a slow breath, 46 s a cycle
        opening = 150 * ramp(np.array(tc), CHANNELS - 3, 8) + 400 * ramp(np.array(tc), LEDGER - 4, 8)
        return min(1800.0, float(base + opening))

    pad = sweep(pad, pad_cutoff) * 0.16
    pad_gain = 1.0 + 0.10 * ramp(t, LEDGER - 4, 8)
    left += pad * pad_gain * (1 + 0.06 * np.sin(2 * np.pi * 0.05 * t))
    right += pad * pad_gain * (1 + 0.06 * np.sin(2 * np.pi * 0.05 * t + 1.3))

    # the ledger's warmth: a sub-octave under the pad, a soft triangle, only from the second lift
    warm = np.zeros(n)
    i = 0
    while i * chord_len < length:
        s = int(i * chord_len * SR)
        m = min(n - s, int((chord_len + BEAT) * SR))
        if m <= 0:
            break
        tt = np.arange(m) / SR
        f = hz(CHORDS[i % 4][0] - 12)
        ph = (f * tt) % 1.0
        tri = 2 * np.abs(2 * ph - 1) - 1
        warm[s : s + m] += tri * env(m, 2.0, 0.4, 0.8, 1.4)
        i += 1
    warm = lowpass(warm, 260, 2) * 0.08 * ramp(t, LEDGER - 2, 8) * (1 - 0.5 * ramp(t, CLOSE, 6))
    left += warm
    right += warm

    # the sub: the chord's root, breathing in on beats 1 and 3, very quiet, from Detect
    bass = np.zeros(n)
    i = 0
    while i * chord_len < length:
        s = int(i * chord_len * SR)
        m = min(n - s, int(chord_len * SR))
        tt = np.arange(m) / SR
        f = hz(ROOTS[i % 4])
        pulse = 0.6 + 0.4 * (np.cos(2 * np.pi * tt / (2 * BEAT)) * 0.5 + 0.5)
        bass[s : s + m] += np.sin(2 * np.pi * f * tt) * pulse * env(m, 0.4, 0.1, 1, 0.6)
        i += 1
    bass_gain = 0.06 * ramp(t, DETECT, 5) + 0.02 * ramp(t, CHANNELS, 6) + 0.02 * ramp(t, LEDGER, 6)
    bass = lowpass(bass, 120, 2) * bass_gain
    left += bass
    right += bass

    # the felt piano: a seeded walk on the pentatonic in eighth notes, sparse until Detect, a little fuller at
    # each lift, silent from the close; every note held long, its decay doing the phrasing
    mel_l, mel_r = np.zeros(n), np.zeros(n)
    step = BEAT / 2
    idx = 5
    k = 0
    while k * step < CLOSE:
        tk = k * step
        bar_pos = k % 8
        chord = CHORDS[(k // 8) % 4]
        strong = bar_pos in (0, 4)
        if tk < DETECT:
            p = 0.5 if bar_pos == 0 else (0.3 if bar_pos == 4 else 0.0)
        elif tk < CHANNELS:
            p = 0.55 if strong else (0.28 if bar_pos in (2, 6) else 0.12)
        elif tk < LEDGER:
            p = 0.7 if strong else (0.4 if bar_pos in (2, 6) else 0.2)
        else:
            p = 0.75 if strong else (0.45 if bar_pos in (2, 6) else 0.25)
        if bar_pos == 0 and rng.random() < 0.35:
            idx = PENTA.index(min(PENTA, key=lambda q: abs(q - (chord[0] + 12)))) if rng.random() < 0.5 else idx
        if rng.random() < p:
            idx = int(np.clip(idx + rng.choice([-2, -1, -1, 0, 1, 1, 2, 3]), 0, len(PENTA) - 1))
            dur = int(SR * step * (4.0 if strong else 2.6))
            s = int(tk * SR)
            m = min(n - s, dur)
            if m > 0:
                vel = rng.uniform(0.55, 1.0) * (1.0 if strong else 0.8)
                note = felt(hz(PENTA[idx]), m) * vel
                pan = 0.5 + 0.3 * np.sin(k * 0.9)
                mel_l[s : s + m] += note * (1 - pan)
                mel_r[s : s + m] += note * pan
        k += 1
    mel_gain = 0.20 + 0.06 * ramp(t, DETECT, 4) + 0.05 * ramp(t, CHANNELS, 6) + 0.05 * ramp(t, LEDGER, 6)
    mel_gain *= 1 - ramp(t, CLOSE, 4)
    left += mel_l * mel_gain
    right += mel_r * mel_gain

    # the pulse: a soft tak on 1 (and sometimes the 'and' of 3) from Detect, the shaker on the off-beats only
    # from the five channels; both quiet, both gone at the close
    taks, shk = np.zeros(n), np.zeros(n)
    beats = int(CLOSE / BEAT) + 1
    for b in range(beats):
        s = int((b + 0.5) * BEAT * SR)
        m = min(n - s, int(0.1 * SR))
        if m > 0:
            shk[s : s + m] += shaker(m) * rng.uniform(0.35, 0.6)
        if b % 4 == 0 or (b % 4 == 2 and rng.random() < 0.6):
            s = int(b * BEAT * SR + (0 if b % 4 == 0 else 0.5 * BEAT * SR))
            m = min(n - s, int(0.2 * SR))
            if m > 0:
                taks[s : s + m] += tak(m) * (0.9 if b % 4 == 0 else 0.55)
    tak_gain = (0.08 * ramp(t, DETECT, 5) + 0.025 * ramp(t, CHANNELS, 6) + 0.015 * ramp(t, LEDGER, 6)) * (1 - ramp(t, CLOSE, 3))
    shk_gain = (0.18 * ramp(t, CHANNELS, 6) + 0.05 * ramp(t, LEDGER, 6)) * (1 - ramp(t, CLOSE, 3))
    perc = taks * tak_gain + shk * shk_gain
    left += perc * 0.95
    right += perc * 1.05

    mix = np.stack([left, right], axis=1)
    # the arrangement: two lifts, the thinning at the close (the pad stays), the fade, silence after it
    curve = 0.80 + 0.07 * ramp(t, CHANNELS - 3, 8) + 0.13 * ramp(t, LEDGER - 4, 8) - 0.10 * ramp(t, CLOSE, 6)
    curve *= ramp(t, 0, 2.5)
    curve *= 1 - ramp(t, FADE_FROM, FADE_TO - FADE_FROM)
    mix *= curve[:, None]
    mix[:, 0] = reverb(mix[:, 0], 0.22)
    mix[:, 1] = reverb(mix[:, 1], 0.22)
    mix = np.stack([highpass(mix[:, 0], 36), highpass(mix[:, 1], 36)], axis=1)
    mix[t >= FADE_TO] = 0
    peak = np.max(np.abs(mix))
    mix = mix / peak * 10 ** (-8 / 20)  # -8 dBFS peak
    return mix


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--length", type=float, default=184)
    p.add_argument("--out", default="music.wav")
    a = p.parse_args()
    mix = compose(a.length)
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {a.out}: {a.length:.0f} s, peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS")


if __name__ == "__main__":
    main()
