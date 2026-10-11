"""SC-158: the film's music, a generative ambient piece in numpy: a warm pad on a four-chord progression in D, a
plucked pentatonic melody, a soft sub bass, a light shaker and a muted tabla-like pulse, through a Schroeder reverb.
It grows with the film (the pluck from 0:15, the bass from 0:35, the pulse from 1:05), lifts at the ledger and fades
out at the end. Deterministic (seed 158).

  uv run --with numpy --with scipy python music.py --length 330 --out music.wav
"""

import argparse
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
BPM = 76
BEAT = 60 / BPM
rng = np.random.default_rng(158)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


# D major: D A Bm G (I V vi IV), four beats a chord
CHORDS = [[62, 66, 69, 74], [57, 61, 64, 69], [59, 62, 66, 71], [55, 59, 62, 67]]
ROOTS = [38, 45, 47, 43]
PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83]  # D E F# A B over two octaves


def env(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    """an ADSR over n samples (attack, decay, release in seconds, sustain level)"""
    a_, d_, r_ = int(a * SR), int(d * SR), int(r * SR)
    out = np.ones(n) * s
    out[:a_] = np.linspace(0, 1, a_)[: n]
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


def pad_note(freq: float, n: int, t: np.ndarray) -> np.ndarray:
    """three slightly detuned saws, softened, with a slow vibrato"""
    out = np.zeros(n)
    for det in (-0.4, 0.0, 0.4):
        f = freq * 2 ** (det / 1200) * (1 + 0.0015 * np.sin(2 * np.pi * 0.18 * t))
        ph = np.cumsum(f) / SR
        saw = 2 * (ph - np.floor(ph + 0.5))
        out += saw
    return lowpass(out / 3, 900, 2)


def pluck(freq: float, n: int, bright: float = 0.5) -> np.ndarray:
    """Karplus-Strong: a burst of noise through a tuned delay line with a soft lowpass in the loop"""
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period)
    buf = lowpass(buf, 4000 + 6000 * bright, 1)
    out = np.zeros(n)
    damp = 0.996
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = damp * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    return out


def pluck_fast(freq: float, n: int, bright: float = 0.5) -> np.ndarray:
    """the same pluck in blocks (the loop above is too slow for a six-minute piece): decaying harmonics"""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        f = freq * k
        if f > SR / 2.2:
            break
        amp = (1 / k) ** (1.1 + (1 - bright)) * (1 if k == 1 else 0.7)
        decay = 2.2 / (k**0.8)
        out += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, np.pi)) * np.exp(-t / decay)
    attack = min(n, int(0.004 * SR))
    out[:attack] *= np.linspace(0, 1, attack)
    return out * 0.6


def shaker(n: int) -> np.ndarray:
    noise = rng.uniform(-1, 1, n)
    x = highpass(noise, 5000) * np.exp(-np.arange(n) / (0.045 * SR))
    return x * 0.5


def tak(n: int) -> np.ndarray:
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (180 * np.exp(-t * 18) + 70) * t) * np.exp(-t / 0.09)
    click = highpass(rng.uniform(-1, 1, n), 2500) * np.exp(-t / 0.012)
    return thump * 0.9 + click * 0.35


def reverb(x: np.ndarray, mix: float = 0.3) -> np.ndarray:
    """a Schroeder reverb: four combs in parallel, two allpasses in series"""
    out = np.zeros_like(x)
    for delay, g in ((1557, 0.84), (1617, 0.83), (1491, 0.85), (1422, 0.82)):
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
    out = lowpass(out, 5000, 1)
    return x * (1 - mix) + out * mix


def ramp(t: np.ndarray, at: float, over: float = 6.0) -> np.ndarray:
    return np.clip((t - at) / over, 0, 1)


def compose(length: float, lift_at: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    left, right = np.zeros(n), np.zeros(n)
    chord_len = 4 * BEAT

    # the pad: every chord, overlapping by a beat
    pad = np.zeros(n)
    i = 0
    while i * chord_len < length:
        ch = CHORDS[i % 4]
        s = int(i * chord_len * SR)
        m = min(n - s, int((chord_len + BEAT) * SR))
        if m <= 0:
            break
        tt = np.arange(m) / SR
        note = sum(pad_note(hz(p), m, tt) * (0.9 if j == 0 else 0.6) for j, p in enumerate(ch))
        pad[s : s + m] += note * env(m, 1.6, 0.4, 0.8, 1.2)
        i += 1
    pad = lowpass(pad, 1400, 2) * 0.16
    left += pad * (1 + 0.08 * np.sin(2 * np.pi * 0.07 * t))
    right += pad * (1 + 0.08 * np.sin(2 * np.pi * 0.07 * t + 1.3))

    # the sub bass: the chord's root, breathing in on beats 1 and 3
    bass = np.zeros(n)
    i = 0
    while i * chord_len < length:
        s = int(i * chord_len * SR)
        m = min(n - s, int(chord_len * SR))
        tt = np.arange(m) / SR
        f = hz(ROOTS[i % 4])
        pulse = 0.55 + 0.45 * (np.cos(2 * np.pi * tt / (2 * BEAT)) * 0.5 + 0.5)
        bass[s : s + m] += np.sin(2 * np.pi * f * tt) * pulse * env(m, 0.3, 0.1, 1, 0.5)
        i += 1
    bass = lowpass(bass, 160, 2) * 0.22 * ramp(t, 35, 10)
    left += bass
    right += bass

    # the pluck melody: a seeded walk on the pentatonic, eighth notes with rests, in phrases
    mel_l, mel_r = np.zeros(n), np.zeros(n)
    step = BEAT / 2
    idx = 3
    k = 0
    while k * step < length - 1:
        bar_pos = k % 8
        chord = CHORDS[(k // 8) % 4]
        if bar_pos == 0 and rng.random() < 0.35:
            idx = PENTA.index(min(PENTA, key=lambda p: abs(p - (chord[0] + 12)))) if rng.random() < 0.5 else idx
        play = rng.random() < (0.62 if bar_pos in (0, 2, 4, 6) else 0.45)
        if bar_pos == 0:
            play = True
        if play:
            idx = int(np.clip(idx + rng.choice([-2, -1, -1, 0, 1, 1, 2, 3]), 0, len(PENTA) - 1))
            dur = int(SR * step * (2.2 if bar_pos in (0, 4) else 1.4))
            s = int(k * step * SR)
            m = min(n - s, dur)
            if m > 0:
                vel = rng.uniform(0.5, 1.0) * (1.0 if bar_pos in (0, 4) else 0.8)
                note = pluck_fast(hz(PENTA[idx]), m, 0.55) * vel
                pan = 0.5 + 0.35 * np.sin(k * 0.9)
                mel_l[s : s + m] += note * (1 - pan)
                mel_r[s : s + m] += note * pan
        k += 1
    gain = 0.26 * ramp(t, 14, 8)
    left += mel_l * gain
    right += mel_r * gain

    # the shaker on the off-beats and the tak on 1 and the 'and' of 3, from the pulse's start
    perc = np.zeros(n)
    beats = int(length / BEAT)
    for b in range(beats):
        s = int((b + 0.5) * BEAT * SR)
        m = min(n - s, int(0.12 * SR))
        if m > 0:
            perc[s : s + m] += shaker(m) * rng.uniform(0.4, 0.7)
        if b % 4 == 0 or b % 4 == 2 and rng.random() < 0.7:
            s = int(b * BEAT * SR + (0 if b % 4 == 0 else 0.5 * BEAT * SR))
            m = min(n - s, int(0.2 * SR))
            if m > 0:
                perc[s : s + m] += tak(m) * (0.9 if b % 4 == 0 else 0.6)
    perc *= 0.17 * ramp(t, 64, 6)
    left += perc * 0.95
    right += perc * 1.05

    mix = np.stack([left, right], axis=1)
    # the arrangement: a gentle lift at the ledger, a fade at the end
    curve = 0.82 + 0.18 * ramp(t, lift_at - 4, 8)
    curve *= 1 - ramp(t, length - 9, 8) * 0.96
    curve *= ramp(t, 0, 2.5)
    mix *= curve[:, None]
    mix[:, 0] = reverb(mix[:, 0], 0.28)
    mix[:, 1] = reverb(mix[:, 1], 0.28)
    mix = np.stack([highpass(mix[:, 0], 40), highpass(mix[:, 1], 40)], axis=1)
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.5  # about -6 dBFS peak; the cut ducks it under the clips' ambience
    return mix


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--length", type=float, default=330)
    p.add_argument("--lift", type=float, default=280, help="where the arrangement lifts (the ledger)")
    p.add_argument("--out", default="music.wav")
    a = p.parse_args()
    mix = compose(a.length, a.lift)
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {a.out}: {a.length:.0f} s, peak {np.max(np.abs(mix)):.2f}")


if __name__ == "__main__":
    main()
