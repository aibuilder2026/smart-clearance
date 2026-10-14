"""SC-207: cut 5's narration, every line of lines.json in the warmer Maya1 voice the bake-off chose (bake5.py 'warm':
the same Indian woman, as a story-telling narrator at a conversational pace, warm and expressive, where cut 4's was a
neutral corporate explainer). Each line is spoken in one pass, so its sentences flow into each other as a person's
would, in several takes: an autoregressive voice can drop or repeat a word, so pick.py keeps the take Whisper reads
back best.

   .venv-snac/bin/python vo5.py [takes] [ids…]       takes land in vo3/maya1w-warm/takes/<id>-<k>.wav"""
import sys, json, time
from pathlib import Path
import numpy as np, soundfile as sf, torch
import bake, bake5

HERE = Path(__file__).resolve().parent
LINES = json.loads((HERE.parent / 'lines.json').read_text())['lines']
SR = 24000
VOICE = 'maya1w-warm'

if __name__ == '__main__':
    takes = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    only = set(sys.argv[2:])
    out = HERE / 'vo3' / VOICE / 'takes'
    out.mkdir(parents=True, exist_ok=True)
    m = bake.Maya1()
    for ln in LINES:
        if only and ln['id'] not in only: continue
        text = ln.get('say', ln['text'])
        for k in range(takes):
            p = out / f"{ln['id']}-{k}.wav"
            if p.exists(): continue
            torch.manual_seed(1000 * k + sum(map(ord, ln['id'])))
            t0 = time.time()
            a = bake5.trim(bake.decode(m.say(text, bake5.DESC['warm'])))
            sf.write(p, a, SR)
            print(ln['id'], k, round(len(a) / SR, 2), 's in', round(time.time() - t0, 1), 's', flush=True)
