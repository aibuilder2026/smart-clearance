"""SC-228 (cut 17): the chosen Gemini-TTS takes fitted to the film. Each take is trimmed to a breath at its edges (40 ms
before its first sound, 80 ms after its last: Gemini leaves about a tenth of a second either side) and played a little
quicker, one tempo for the script (ffmpeg's atempo, which keeps the pitch), so the presenter's script fits the
maintainer's 238 to 240 s. Its word timings (pick.py's read-back) move with it, and durations.json follows.
Reads the takes themselves (takes/<chosen>), so it can run again after any pick.

   python3 fit17.py vo3/gemini-Gacrux-demo 1.035"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
import soundfile as sf

PRE, POST = 0.04, 0.08


def edges(x, sr, db=-45):
    f = int(sr * 0.01)
    e = np.sqrt(np.convolve(x ** 2, np.ones(f) / f, 'same'))
    on = np.where(e > 10 ** (db / 20))[0]
    return on[0] / sr, on[-1] / sr


if __name__ == '__main__':
    root, TEMPO = Path(sys.argv[1]), float(sys.argv[2])
    # a line may keep its own tempo (lines.json "tempo"): the architecture's six lines are read at 1.0, its scene
    # timed to the voice word by word (cut 14's labels pinned to it), while the rest of the script takes TEMPO
    OWN = {l['id']: l['tempo'] for l in json.loads((Path(__file__).resolve().parent.parent / 'lines.json').read_text())['lines'] if 'tempo' in l}
    chosen = json.loads((root / 'chosen.json').read_text())
    read = json.loads((root / 'read.json').read_text())
    durs, asr, fit = {}, {}, {}
    for lid, name in chosen.items():
        tempo = OWN.get(lid, TEMPO)
        x, sr = sf.read(root / 'takes' / name)
        x = x if x.ndim == 1 else x.mean(1)
        a, b = edges(x, sr)
        c0, c1 = max(0.0, a - PRE), min(len(x) / sr, b + POST)
        # padded with 0.2 s of silence before the tempo change, then cut back: a take that ends on its last consonant (x26's
        # "sad") lost it to atempo, which drops what falls in its last window ("sack" in the read-back)
        cut = np.concatenate([x[int(c0 * sr):int(c1 * sr)], np.zeros(int(0.2 * sr), x.dtype)])
        with tempfile.TemporaryDirectory() as td:
            src, dst = Path(td) / 'a.wav', Path(td) / 'b.wav'
            sf.write(src, cut, sr, subtype='PCM_16')
            if abs(tempo - 1) > 1e-4:
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af', f'atempo={tempo}', '-ar', str(sr), str(dst)], check=True)
            else:
                dst = src
            y, _ = sf.read(dst)
        y = y[:int(round((c1 - c0) / tempo * sr))]
        sf.write(root / f'{lid}.wav', y, sr, subtype='PCM_16')
        durs[lid] = round(len(y) / sr, 3)
        d = len(y) / sr
        ws = [dict(w, s=round(min(d, max(0.0, (w['s'] - c0) / tempo)), 3), e=round(min(d, max(0.0, (w['e'] - c0) / tempo)), 3)) for w in read[name]['words']]
        asr[lid] = dict(read[name], words=ws)
        fit[lid] = {'take': name, 'trim': [round(c0, 3), round(c1, 3)], 'tempo': tempo}
    (root / 'durations.json').write_text(json.dumps(durs, indent=2))
    (root / 'asr.json').write_text(json.dumps(asr, indent=1))
    (root / 'fit.json').write_text(json.dumps(fit, indent=1))
    print('fitted', len(durs), 'lines at', TEMPO, '(own:', OWN, ')', '·', round(sum(durs.values()), 2), 's of voice')
