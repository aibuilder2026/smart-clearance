"""SC-207: the voice bake-off scored. For each take in a folder: predicted naturalness (UTMOS22 strong), how much the
pitch moves (the spread of voiced F0 in semitones: a flat, read-out delivery moves little), how often the voice
pauses and the pace (words a second of the sample). Run with the UTMOS venv (SC-200's .venv-kokoro):

   <kokoro venv>/bin/python score5.py bake5/ sample5.txt"""
import sys, json
from pathlib import Path
import numpy as np, librosa, torch

folder, text = Path(sys.argv[1]), Path(sys.argv[2]).read_text()
nwords = len(text.split())
mos = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
rows = {}
for p in sorted(folder.glob('*.wav')):
    y, sr = librosa.load(str(p), sr=16000, mono=True)
    with torch.no_grad():
        m = float(mos(torch.from_numpy(y).unsqueeze(0), sr))
    f0, vf, _ = librosa.pyin(y, fmin=110, fmax=420, sr=sr, frame_length=1024)
    f0 = f0[vf & ~np.isnan(f0)]
    st = 12 * np.log2(f0 / np.median(f0))
    spread = float(np.percentile(st, 90) - np.percentile(st, 10))
    # pauses: runs of quiet frames longer than 120 ms (not counting the sentence breaths, 220 ms)
    rms = librosa.feature.rms(y=y, frame_length=400, hop_length=160)[0]
    quiet = rms < 0.012
    runs, k = [], 0
    for q in quiet:
        if q: k += 1
        else:
            if k: runs.append(k * 0.01); k = 0
    pauses = sum(1 for r in runs if 0.12 <= r < 0.2)
    dur = len(y) / sr
    rows[p.name] = dict(mos=round(m, 3), pitch_spread_st=round(spread, 2), phrase_pauses=pauses, secs=round(dur, 2),
                        wps=round(nwords / dur, 2))
    print(f"{p.name:22} mos {m:.3f}  pitch spread {spread:5.2f} st  pauses {pauses:2d}  {dur:5.2f}s  {nwords / dur:.2f} w/s", flush=True)
(folder / 'score.json').write_text(json.dumps(rows, indent=1))
