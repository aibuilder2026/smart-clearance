"""SC-219 cut 12: the architecture scene's sounds (remo12's Arch12, concept B made whole), each on the moment the scene
draws it, from the narration's cues (build/arch11-cues.json, the scene's local seconds). Writes build/arch12/events.json
for the film's mix (mix12.py voices each kind as mix11 does) and remo12/public/audio/arch-sfx.wav for the preview.
  .venv/bin/python events12.py"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mix11 as M
from mix import SR

C = json.loads((HERE / 'build' / 'arch11-cues.json').read_text())
END = 33.64


def events():
    E = []
    add = lambda t, kind, pan=0.5, **kw: E.append({'t': round(t, 3), 'kind': kind, 'pan': pan, **kw})
    add(0.05, 'sparkle', 0.55); add(0.25, 'rise', 0.5); add(0.6, 'descend', 0.5)          # one light, the hall rising, the pull-back
    add(C['t01'] + 0.2, 'title', 0.3)
    add(3.4, 'move', 0.35)                                                                 # to the edge
    for i in range(4): add(C['apps'] + i * 0.13, 'drop', 0.25 + i * 0.05)                  # four apps rise
    add(C['firebase'], 'badge', 0.3); add(C['firebase'] + 0.05, 'card', 0.7)
    add(5.45, 'move', 0.5)                                                                 # to the core
    add(C['api'] + 0.08, 'ping', 0.4); add(C['api'] + 0.95, 'land', 0.5)                   # the call
    add(C['run'], 'thump', 0.5)
    for k in range(8): add(C['run'] + 0.1 + k * 0.07, 'tick', 0.45 + k * 0.01)             # containers
    for k in range(3): add(C['sql'] + k * 0.12, 'stone', 0.6, p=k)                         # disks
    add(C['record'], 'tick', 0.6)   # a short tick: a pen's scratch here ran into "Pub/Sub"
    add(C['step'] + 0.35, 'sweep', 0.6)                                                    # along the spine, once the line's words are said (a whoosh on them masked "Pub/Sub")
    for k in range(int((13.6 - C['scheduler']) / 0.8) + 1): add(C['scheduler'] + k * 0.8, 'clock', 0.7)
    add(13.6, 'move', 0.45)                                                                # to the agents
    for i in range(10):
        t = C['nine'] + 0.1 + i * 0.165
        add(t, 'code' if i == 1 else 'lantern', 0.3 + i * 0.05, p=i)
    add(16.25, 'move', 0.6)                                                                # BigQuery, Cloud Storage
    for i in range(4): add(C['sales'] + 0.15 + i * 0.1, 'tick', 0.65 + i * 0.03)
    add(C['sales'] + 0.6, 'ray', 0.5, p=0); add(C['sales'] + 0.8, 'ray', 0.45, p=2)
    add(C['storage'] - 0.9, 'drawer', 0.75); add(C['photos'] + 0.2, 'whoosh_in', 0.6)
    add(19.85, 'move', 0.4); add(C['gemini'] - 0.1, 'star', 0.45)                          # Gemini
    add(C['pro'] + 0.05, 'chime_pro', 0.45)
    for k in range(3): add(C['pro'] + 0.08 + k * 0.09, 'ray', 0.4 + k * 0.05, p=k + 4)
    add(C['flash'] + 0.05, 'chime_flash', 0.5)
    for k in range(6): add(C['flash'] + 0.08 + k * 0.09, 'ray', 0.35 + k * 0.05, p=k + 2)
    add(26.05, 'move', 0.4)                                                                # the money
    add(C['money'], 'glass', 0.45); add(C['money'] + 0.85, 'zap', 0.5); add(C['money'] + 0.9, 'lock', 0.5)
    add(C['figure'], 'compute', 0.45); add(C['figure'] + 0.9, 'coin', 0.45)
    add(30.95, 'move', 0.55)                                                               # the yes
    add(C['yes'], 'click', 0.55); add(C['yes'] + 0.04, 'gate', 0.5); add(C['yes'] + 0.2, 'impact', 0.5)
    add(C['yes'] + 0.45, 'sparkle', 0.5)
    return sorted(E, key=lambda e: e['t'])


def main():
    E = events()
    out = HERE / 'build' / 'arch12'; out.mkdir(parents=True, exist_ok=True)
    (out / 'events.json').write_text(json.dumps(E, indent=1))
    rnd = np.random.default_rng(12)
    n = int((END + 3) * SR); L = np.zeros(n, np.float32); R_ = np.zeros(n, np.float32)
    for e in E:
        k = e['kind']
        if k == 'land': y = M.land(-29)
        elif k in M.DREAM_SOUND: y = M.DREAM_SOUND[k](rnd, e)
        elif k in M.PAGE_SOUND: y = M.PAGE_SOUND[k](rnd)
        else: print('no sound for', k); continue
        y = np.asarray(y, np.float32); i = int(e['t'] * SR); j = min(n, i + len(y)); p = e.get('pan', 0.5)
        L[i:j] += y[: j - i] * np.cos(p * np.pi / 2) * 1.2; R_[i:j] += y[: j - i] * np.sin(p * np.pi / 2) * 1.2
    sf.write(HERE / 'remo12' / 'public' / 'audio' / 'arch-sfx.wav', np.stack([L, R_], 1)[: int(END * SR)], SR, subtype='PCM_16')
    print(len(E), 'events')


if __name__ == '__main__':
    main()
