"""SC-207: a warmer, more human Maya1 for cut 5. The same Indian woman's voice described a few ways (cut 4's brisk
corporate explainer, and warmer, story-telling or podcast-host deliveries), each reading the same sample of cut 5's
script in two seeds. score5.py measures them: predicted naturalness (UTMOS), how much the pitch moves (a flat,
announcer-like read moves little), the pace, and Whisper's read-back.

   .venv-snac/bin/python bake5.py sample5.txt bake5/"""
import sys, re, gc, time
from pathlib import Path
import numpy as np, soundfile as sf, torch
import bake

BASE = 'Realistic female voice in the 30s age with an indian accent. Normal pitch, {timbre} timbre, {pace} pacing, {tone} tone delivery at med intensity, {domain} domain, {role} role, {delivery} delivery'
DESC = {
    'cut4': bake.VOICES['maya1b'][1]['brisk'],
    'story': BASE.format(timbre='warm', pace='conversational', tone='friendly', domain='storytelling', role='narrator', delivery='natural'),
    'story-brisk': BASE.format(timbre='warm', pace='brisk', tone='friendly', domain='storytelling', role='narrator', delivery='natural'),
    'host': BASE.format(timbre='warm', pace='brisk', tone='happy', domain='podcast', role='host', delivery='casual'),
    'doc': BASE.format(timbre='smooth', pace='conversational', tone='warm', domain='documentary', role='narrator', delivery='expressive'),
    'friend': BASE.format(timbre='warm', pace='brisk', tone='curious', domain='conversation', role='friend', delivery='expressive'),
    'warm': BASE.format(timbre='warm', pace='conversational', tone='warm', domain='storytelling', role='narrator', delivery='expressive'),
    'doc-brisk': BASE.format(timbre='smooth', pace='brisk', tone='warm', domain='documentary', role='narrator', delivery='expressive'),
}
WHOLE = '--whole' in __import__('sys').argv   # each paragraph spoken in one pass, so its sentences flow into each other


def trim(a, thr=0.012, sr=24000):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0: return a
    k = int(0.04 * sr)
    return a[max(0, idx[0] - k): min(len(a), idx[-1] + k)]


if __name__ == '__main__':
    text = Path(sys.argv[1]).read_text().strip()
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    only = sys.argv[3].split(',') if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else list(DESC)
    sents = [s.strip() for s in re.split(r'(?<=[.!?:])\s+', text) if s.strip()]
    if WHOLE: sents = [p.strip() for p in text.split('\n') if p.strip()]
    breath = np.zeros(int(0.22 * 24000), np.float32)
    t0 = time.time(); m = bake.Maya1(); print('loaded', round(time.time() - t0, 1), 's', flush=True)
    for name in only:
        for seed in (1, 2):
            p = out / f'{name}-{seed}.wav'
            if p.exists(): continue
            torch.manual_seed(seed * 7919)
            t0 = time.time(); parts = []
            for s in sents:
                parts += [trim(bake.decode(m.say(s, DESC[name]))), breath]
            a = np.concatenate(parts[:-1])
            sf.write(p, a, 24000)
            print(name, seed, round(len(a) / 24000, 2), 's in', round(time.time() - t0, 1), 's', flush=True)
    del m; gc.collect(); torch.mps.empty_cache()
