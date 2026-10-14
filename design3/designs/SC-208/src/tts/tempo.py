"""SC-206: the chosen takes (pick.py) sped up a touch with ffmpeg's atempo (WSOLA: the pitch and the voice kept), into
a sibling folder with durations.json and asr.json scaled to match, for when the narration runs longer than the cut
allows. Optionally the pauses between a line's sentences are shortened first (anything quieter than -40 dB for longer
than `gap` seconds is cut down to `gap`).

   python3 tempo.py vo3/maya1b-brisk 1.10 [gap]      -> vo3/maya1b-brisk-x110
"""
import sys, json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

root = Path(sys.argv[1]); k = float(sys.argv[2]); gap = float(sys.argv[3]) if len(sys.argv) > 3 else None
out = root.parent / f'{root.name}-x{round(k * 100):d}'
out.mkdir(exist_ok=True)
durs = json.loads((root / 'durations.json').read_text())
asr = json.loads((root / 'asr.json').read_text())


def shorten(a, sr, gap):
    """pauses inside the line longer than gap cut to gap; returns the audio and a map from old time to new"""
    hop = int(0.01 * sr)
    e = np.abs(a[: len(a) // hop * hop]).reshape(-1, hop).max(1)
    quiet = e < 10 ** (-40 / 20)
    keep = np.ones(len(a), bool); cuts = []
    i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            if 0 < i and j < len(quiet) and (j - i) * hop > gap * sr:
                c0 = i * hop + int(gap * sr / 2); c1 = j * hop - int(gap * sr / 2)
                keep[c0:c1] = False; cuts.append((c0 / sr, (c1 - c0) / sr))
            i = j
        else: i += 1
    def tmap(t):
        return t - sum(d for c, d in cuts if c < t)
    return a[keep], tmap


for lid in durs:
    src = root / f'{lid}.wav'
    a, sr = sf.read(src, dtype='float32')
    tmap = lambda t: t
    if gap is not None:
        a, tmap = shorten(a, sr, gap)
    mid = out / f'_{lid}.wav'; sf.write(mid, a, sr)
    dst = out / f'{lid}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mid), '-af', f'atempo={k}', '-ar', str(sr), str(dst)], check=True)
    mid.unlink()
    durs[lid] = round(sf.info(dst).duration, 3)
    asr[lid] = {'text': asr[lid]['text'],
                'words': [{'w': w['w'], 's': round(tmap(w['s']) / k, 3), 'e': round(tmap(w['e']) / k, 3)} for w in asr[lid]['words']]}
(out / 'durations.json').write_text(json.dumps(durs, indent=2))
(out / 'asr.json').write_text(json.dumps(asr, indent=1))
print(out.name, 'total', round(sum(durs.values()), 1), 's')
