"""SC-206: the narration, every line of lines.json in the chosen Indian English voice (bake.py's models), in several
takes: an autoregressive voice can drop or repeat a word, so pick.py keeps the take Whisper reads back best.
A line is spoken sentence by sentence and joined with a short breath, as a narrator would.

   .venv-snac/bin/python vo3.py <model> <voice> [takes] [ids…]     e.g. vo3.py veena kavya 3
Takes land in vo3/<model>-<voice>/takes/<id>-<k>.wav."""
import sys, re, json, time
from pathlib import Path
import numpy as np, soundfile as sf, torch
import bake

HERE = Path(__file__).resolve().parent
LINES = json.loads((HERE.parent / 'lines.json').read_text())['lines']
SR = 24000


def sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.!?:])\s+', text) if s.strip()]


def trim(a, thr=0.012):
    """silence trimmed from both ends, keeping 40 ms either side"""
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0: return a
    k = int(0.04 * SR)
    return a[max(0, idx[0] - k): min(len(a), idx[-1] + k)]


if __name__ == '__main__':
    model, voice = sys.argv[1], sys.argv[2]
    takes = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    only = set(sys.argv[4:])
    cls, voices = bake.VOICES[model]
    out = HERE / 'vo3' / f'{model}-{voice}' / 'takes'
    out.mkdir(parents=True, exist_ok=True)
    m = cls()
    breath = np.zeros(int(0.22 * SR), np.float32)
    for ln in LINES:
        if only and ln['id'] not in only: continue
        text = ln.get('say', ln['text'])
        for k in range(takes):
            p = out / f"{ln['id']}-{k}.wav"
            if p.exists(): continue
            torch.manual_seed(1000 * k + sum(map(ord, ln['id'])))
            t0 = time.time(); parts = []
            for s in sentences(text):
                parts += [trim(bake.decode(m.say(s, voices[voice]))), breath]
            a = np.concatenate(parts[:-1])
            sf.write(p, a, SR)
            print(ln['id'], k, round(len(a) / SR, 2), 's in', round(time.time() - t0, 1), 's', flush=True)
