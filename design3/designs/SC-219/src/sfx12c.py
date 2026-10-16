"""SC-219 cut 12's concept round: the motion tests' sound effects, made with the film's own synths (mix.py, mix11.py),
written to remo12/public/sfx/ for the Remotion compositions to place on their events.
  .venv/bin/python sfx12c.py"""
import sys
from pathlib import Path
import numpy as np, soundfile as sf
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from mix import SR, whoosh, riser, boom, chime, tick, glint, thud, sparkle
from mix11 import uiclick, pop, clink, gate, land, compute

OUT = HERE / 'remo12' / 'public' / 'sfx'
OUT.mkdir(parents=True, exist_ok=True)
rnd = np.random.default_rng(219)


def hum(d=10.4, level=-34):
    """the data hall's air: a low steady drone with the faint whir of fans"""
    n = int(d * SR); t = np.arange(n) / SR
    y = 0.6 * np.sin(2 * np.pi * 55 * t) + 0.3 * np.sin(2 * np.pi * 110.4 * t) + 0.12 * np.sin(2 * np.pi * 165 * t)
    nz = np.convolve(rnd.standard_normal(n), np.ones(60) / 60, 'same') * 0.5
    env = np.clip(t / 1.2, 0, 1) * np.clip((d - t) / 0.6, 0, 1)
    y = (y + nz) * env
    return (y / (np.abs(y).max() + 1e-6) * 10 ** (level / 20)).astype(np.float32)


SOUNDS = {
    'whoosh': whoosh(rnd, 1.4, 0.5, -24), 'whoosh-short': whoosh(rnd, 0.8, 0.45, -26), 'riser': riser(rnd, 1.6, -28),
    'boom': boom(1.8, -21), 'chime': chime(-27), 'tick': tick(-30, 1320.0), 'tick-lo': tick(-31, 880.0),
    'glint': glint(-29), 'thud': thud(-22), 'sparkle': sparkle(0.9, 16, -34), 'click': uiclick(-25), 'pop': pop(-27),
    'clink': clink(-28), 'gate': gate(-23), 'land': land(-28), 'compute': compute(-31), 'hum': hum(),
}
for k, y in SOUNDS.items():
    y = np.asarray(y, np.float32)
    sf.write(OUT / f'{k}.wav', np.stack([y, y], 1), SR, subtype='PCM_16')
    print(f'{k:13} {len(y) / SR:5.2f} s')
