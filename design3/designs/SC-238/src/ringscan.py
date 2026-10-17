"""SC-238: the recording stage's own green rings in a window's spans. The stage (SC-201, SC-202, SC-226) rings what it
reads in a light mint line (about rgb 120-155, 200-215, 158-178) with a soft glow; the app's own greens are darker or
fill shapes. A frame is flagged when a straight run of ring-coloured pixels at least `RUN` long lies along a row or a
column of the device's screen. Every window span is sampled at 6 frames a second.

   uv run --with numpy --with pillow python ringscan.py [names…]   ->  build/ringscan.json and a line per flagged span"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
MEDIA = json.loads((HERE / 'build' / 'media.json').read_text())
RUN = 90


def ring_mask(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r >= 95) & (r <= 165) & (g >= 192) & (g <= 222) & (b >= 145) & (b <= 190) & (g - r >= 48) & (g - b >= 22)


def dark_mask(a):
    """the admin run's rings (SC-226): a thin dark green line, about rgb 40-60, 80-115, 65-95"""
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r >= 30) & (r <= 70) & (g >= 78) & (g <= 120) & (b >= 60) & (b <= 100) & (g - r >= 35)


def thin_runs(m, f=None, light=380):
    """the longest thin run: horizontal pixels with no mask 5 px above and below, vertical with none 5 px either side;
    with the frame, the pixels 5 px off on both sides must also be light (a ring is a line drawn on the light app, not
    the edge of a filled button)"""
    up, dn = np.zeros_like(m), np.zeros_like(m); up[5:] = m[:-5]; dn[:-5] = m[5:]
    lf, rt = np.zeros_like(m), np.zeros_like(m); lf[:, 5:] = m[:, :-5]; rt[:, :-5] = m[:, 5:]
    hz = m & ~up & ~dn; vt = m & ~lf & ~rt
    if f is not None:
        L = f.astype(np.int32).sum(2) > light
        lu, ld = np.zeros_like(L), np.zeros_like(L); lu[5:] = L[:-5]; ld[:-5] = L[5:]
        ll, lr = np.zeros_like(L), np.zeros_like(L); ll[:, 5:] = L[:, :-5]; lr[:, :-5] = L[:, 5:]
        hz &= lu & ld; vt &= ll & lr
    return longest_rows(hz), longest_rows(vt.T)


def longest_rows(arr):
    best = 0
    d = np.diff(np.concatenate([np.zeros((arr.shape[0], 1), bool), arr, np.zeros((arr.shape[0], 1), bool)], axis=1).astype(np.int8), axis=1)
    for row in range(arr.shape[0]):
        s = np.flatnonzero(d[row] == 1); e = np.flatnonzero(d[row] == -1)
        if len(s): best = max(best, int((e - s).max()))
    return best


def amber_mask(a):
    """the stage's lit ring with a note (SC-226): an amber line, about rgb 220-250, 185-205, 70-90"""
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r >= 200) & (g >= 170) & (g <= 215) & (b >= 50) & (b <= 110) & (r - b >= 110)


CHAPTERS = {}


def chapter_cards(src):
    """the stage's title card for each chapter (its foot, 3.6 s from the chapter's start): from the run's chapters.json"""
    if src not in CHAPTERS:
        p = Path(src).with_suffix('.chapters.json')
        CHAPTERS[src] = [(c['start'] - 0.3, c['start'] + 4.4) for c in json.loads(p.read_text())] if p.exists() else []
    return CHAPTERS[src]


def flagged(f):
    """the stage's ring in a frame: a long mint run (SC-201, SC-202), or a long thin dark green line (SC-226)"""
    if longest(ring_mask(f)) >= RUN: return True
    for mask in (dark_mask(f), amber_mask(f)):
        h, v = thin_runs(mask, f)
        if h >= 220 and v >= 24: return True   # a ring is a rectangle: long thin edges both ways (a chart's bars have only one)
    return False


def longest(m):
    """the longest run of True along any row or column"""
    best = 0
    for arr in (m, m.T):
        d = np.diff(np.concatenate([np.zeros((arr.shape[0], 1), bool), arr, np.zeros((arr.shape[0], 1), bool)], axis=1).astype(np.int8), axis=1)
        for row in range(arr.shape[0]):
            s = np.flatnonzero(d[row] == 1); e = np.flatnonzero(d[row] == -1)
            if len(s): best = max(best, int((e - s).max()))
    return best


def frames(src, rect, a, b, fps=6):
    x, y, w, h = rect
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{max(0, a - 1):.3f}', '-i', src, '-ss', f'{min(a, 1):.3f}', '-t', f'{b - a:.3f}',
           '-vf', f'crop={w}:{h}:{x}:{y},fps={fps}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (w * h * 3)
    return np.frombuffer(raw[:n * w * h * 3], np.uint8).reshape(n, h, w, 3)


def main():
    names = sys.argv[1:] or [k for k, m in MEDIA.items() if m['kind'] == 'win']
    out = {}
    for name in names:
        m = MEDIA[name]; hits = []
        for i, (a, b, d) in enumerate(m['segs']):
            if (b - a) / d >= 2.2: continue          # a fast-forward: frames flash past
            fs = frames(m['src'], m['rect'], a, b)
            cards = chapter_cards(m['src'])
            for j, f in enumerate(fs):
                tt = a + j / 6
                # (the title card sits at the stage's foot: over the portrait tablet's foot, or the laptop's in a one-screen run)
                if m['dev'] in ('L', 'A') and any(c0 <= tt <= c1 for c0, c1 in cards): hits.append((i, round(tt, 2), -1)); continue
                if flagged(f): hits.append((i, round(tt, 2), longest(ring_mask(f))))
        out[name] = hits
        if hits:
            by = {}
            for i, t, L in hits: by.setdefault(i, []).append((t, L))
            for i, v in by.items(): print(f'{name} span {i} {m["segs"][i][:2]}: ring at {v[0][0]}..{v[-1][0]} (longest {max(L for _, L in v)} px, {len(v)} frames)')
        else:
            print(f'{name}: clean')
    (HERE / 'build' / 'ringscan.json').write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
