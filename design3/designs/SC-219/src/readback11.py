"""SC-219 (cut 11, as cut 9): every line read back from the final mix by Whisper (large-v3-turbo, mlx), each against its own text with
pick.py's word compare; a line is heard in its own window of the mix (its start to its end, a little either side)."""
import json, sys, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
import mlx_whisper
sys.path.insert(0, str(Path(__file__).resolve().parent / 'tts'))
import pick
import parts as P
mix = Path(__file__).resolve().parent / 'build' / 'mix11.wav'
x, sr = sf.read(mix, dtype='float32')
x = x.mean(axis=1) if x.ndim > 1 else x
ok, rep = 0, []
for l in P.LINES:
    t0, t1 = P.T[l['id']]
    a, b = max(0, int((t0 - 0.25) * sr)), int((t1 + 0.45) * sr)
    seg = x[a:b]
    tmp = Path(__file__).resolve().parent / 'build' / f"rb8-{l['id']}.wav"; sf.write(tmp, seg, sr)
    r = mlx_whisper.transcribe(str(tmp), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en')
    heard = r['text'].strip()
    ref = l['text'].replace(' / ', ' ')
    e = pick.wer(ref, heard)
    ok += e == 0
    rep.append((l['id'], round(e, 3), heard))
    print(f"{l['id']:4} {e:.3f} | {heard}", flush=True)
print(f'{ok} of {len(P.LINES)} word for word')
json.dump(rep, open(Path(__file__).resolve().parent / 'build' / 'readback9.json', 'w'), indent=1)
