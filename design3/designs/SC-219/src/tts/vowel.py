"""SC-219 (cut 10): how a take says a word's vowel, from its formants, to tell "live" as in "live on production"
(/laɪv/, a diphthong that starts open, F1 high, and closes) from "live" the verb (/lɪv/, short and close, F1 low
throughout). Each word's span comes from Whisper's read-back of the take (read.json); its voiced middle is analysed
in 20 ms frames by LPC, and F1 and F2 are reported over the word.
   .venv/bin/python tts/vowel.py <take.wav>:<word>[:k] …"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.linalg import solve_toeplitz
from scipy.signal import resample_poly

HERE = Path(__file__).resolve().parent
TAKES = HERE / 'vo3' / 'maya1w-warm'
READ = json.loads((TAKES / 'read.json').read_text())
FS = 11025


def norm(w):
    return ''.join(ch for ch in w.lower() if ch.isalnum())


def formants(frame, order=12):
    x = frame * np.hamming(len(frame))
    x = np.append(x[0], x[1:] - 0.94 * x[:-1])          # pre-emphasis
    r = np.correlate(x, x, 'full')[len(x) - 1:len(x) + order]
    if r[0] <= 1e-9: return []
    a = solve_toeplitz(r[:-1], -r[1:])
    roots = np.roots(np.concatenate([[1.0], a]))
    roots = roots[np.imag(roots) > 0.01]
    f = np.angle(roots) * FS / (2 * np.pi)
    bw = -np.log(np.abs(roots)) * FS / np.pi
    keep = sorted(fi for fi, b in zip(f, bw) if 180 < fi < 4500 and b < 500)
    return keep


def word_span(take, word, k=0):
    words = READ[take]['words']
    hits = [w for w in words if norm(w['w']) == norm(word)] or [w for w in words if norm(w['w']).startswith(norm(word))]
    if not hits: raise KeyError(word)
    w = hits[min(k, len(hits) - 1)]
    return w['s'], w['e']


def analyse(take, word, k=0):
    y, sr = sf.read(TAKES / 'takes' / take, dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, FS, sr)
    s, e = word_span(take, word, k)
    s, e = max(0.0, s - 0.02), e + 0.02
    seg = y[int(s * FS):int(e * FS)]
    n, hop = int(0.02 * FS), int(0.01 * FS)
    rms = np.array([np.sqrt(np.mean(seg[i:i + n] ** 2)) for i in range(0, max(1, len(seg) - n), hop)])
    if not len(rms): return None
    voiced = rms > 0.25 * rms.max()          # the vowel: the loud, voiced middle of the word
    tr = []
    for j, i in enumerate(range(0, max(1, len(seg) - n), hop)):
        if not voiced[j]: continue
        fs_ = formants(seg[i:i + n])
        if len(fs_) >= 2: tr.append((round(s + i / FS, 3), round(fs_[0]), round(fs_[1])))
    return tr


if __name__ == '__main__':
    for arg in sys.argv[1:]:
        parts = arg.split(':')
        take, word, k = parts[0], parts[1], int(parts[2]) if len(parts) > 2 else 0
        try: tr = analyse(take, word, k)
        except KeyError: print(take, word, 'not in the read-back'); continue
        if not tr: print(take, word, 'no voiced frames'); continue
        f1 = np.array([t[1] for t in tr], float)
        sm = np.array([np.median(f1[max(0, i - 1):i + 2]) for i in range(len(f1))])     # a 3-frame median: no lone outliers
        p90 = float(np.percentile(sm, 90))
        print(f"{take:12} {word:10} F1 p90 {p90:5.0f} Hz  ->  {'/aɪ/ (opens)' if p90 >= 720 else '/ɪ/ (stays close)' if p90 <= 660 else 'unclear'}   ({len(tr)} frames)")
