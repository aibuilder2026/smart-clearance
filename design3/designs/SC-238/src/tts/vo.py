"""SC-238: the narration, every line of lines.json in the films' narrator (Maya1, SC-207's 'warm' description: the
same Indian woman telling a story at a conversational pace). Each line is spoken in one pass, several takes; pick.py
keeps the take Whisper reads back best. Maya1 and its SNAC decoder come from SC-209's venv and bake modules.

   $SC209/src/tts/.venv-snac/bin/python vo.py [takes] [ids…]      takes land in vo/maya1w-warm/takes/<id>-<k>.wav"""
import sys, json, time
from pathlib import Path
SC209 = Path('/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-209/src/tts')
sys.path.insert(0, str(SC209))
import numpy as np, soundfile as sf, torch
import bake, bake5

HERE = Path(__file__).resolve().parent
LINES = json.loads((HERE.parent / 'lines.json').read_text())['lines']
SR = 24000
VOICE = 'maya1w-warm'

if __name__ == '__main__':
    takes = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    only = set(sys.argv[2:])
    out = HERE / 'vo' / VOICE / 'takes'
    out.mkdir(parents=True, exist_ok=True)
    m = bake.Maya1()
    for ln in LINES:
        if only and ln['id'] not in only: continue
        text = ln.get('say', ln['text'])
        for k in range(takes):
            p = out / f"{ln['id']}-{k}.wav"
            if p.exists(): continue
            torch.manual_seed(1000 * k + sum(map(ord, ln['id'])) + 238)
            t0 = time.time()
            a = bake5.trim(bake.decode(m.say(text, bake5.DESC['warm'])))
            sf.write(p, a, SR)
            print(ln['id'], k, round(len(a) / SR, 2), 's in', round(time.time() - t0, 1), 's', flush=True)
