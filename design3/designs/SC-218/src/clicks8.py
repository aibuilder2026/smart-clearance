"""SC-218 cut 8: find the clicks and the scrolls in the production recordings, so the mix can put a click under each press
the film shows and a soft scroll under each glide.

Clicks: the journey stage (stage.ts) draws a press as two rings of #22c26e spreading from where it lands (52 px, scale
.3 to 1.6 over .55 s, fading). On any background the press shows in the frame-to-frame difference as a small round blob
that grows on the same centre over the next few frames; nothing else on the screens grows concentrically. A click is the
first frame of such a growth.
Scrolls: the content shifts vertically between frames; phase correlation on the screen finds the shift, and a run of
frames moving more than a pixel and a half is a scroll.
  .venv/bin/python clicks8.py            (writes build/clicks8.json: {"<rec> <dev>": {"clicks": [...], "scrolls": [[a, b], ...]}})"""
import json, subprocess
import numpy as np, cv2
from kit import REC, DEV, HERE

FPS = 25


def frames(rec, dev, a, b, scale=2):
    x, y, w, h = DEV[dev]
    sw, sh = w // scale, h // scale
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{a:.3f}', '-i', str(REC[rec]), '-t', f'{b - a:.3f}', '-vf',
                        f'fps={FPS},crop={w}:{h}:{x}:{y},scale={sw}:{sh}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                       capture_output=True).stdout
    n = sw * sh * 3
    return [np.frombuffer(p[k * n:(k + 1) * n], np.uint8).reshape(sh, sw, 3) for k in range(len(p) // n)]


def blobs_of(d):
    m = (d > 22).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    cnt, lab, stats, cen = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, cnt):
        bx, by, bw, bh, area = stats[i]
        if area >= 12 and 4 <= bw <= 60 and 4 <= bh <= 60 and 0.7 <= bw / bh <= 1.43:
            out.append((bx + bw / 2, by + bh / 2, (bw + bh) / 2))
    return out


def clicks(fr, a):
    g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.int16) for f in fr]
    bl = [[]] + [blobs_of(np.abs(g[k] - g[k - 1])) for k in range(1, len(g))]
    hits, last = [], -9.0
    for k in range(len(bl)):
        t = a + k / FPS
        if t - last < 0.45: continue
        for cx, cy, sz in bl[k]:
            if sz > 18: continue
            seq = [sz]
            for j in range(k + 1, min(len(bl), k + 9)):
                nxt = [s for (x2, y2, s) in bl[j] if abs(x2 - cx) < 5 and abs(y2 - cy) < 5 and s > seq[-1] + 0.5]
                if not nxt: break
                seq.append(min(nxt))
            if len(seq) >= 4 and seq[-1] >= 2.0 * seq[0]:
                hits.append(round(t - 1 / FPS, 2)); last = t
                break
    return hits


def scrolls(fr, a):
    g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in fr]
    win = cv2.createHanningWindow((g[0].shape[1], g[0].shape[0]), cv2.CV_32F) if g else None
    moving = []
    for k in range(1, len(g)):
        (dx, dy), resp = cv2.phaseCorrelate(g[k - 1], g[k], win)
        moving.append(abs(dy) > 1.5 and abs(dx) < 1.0 and resp > 0.08)
    runs, s = [], None
    for k, m in enumerate(moving + [False]):
        if m and s is None: s = k
        if not m and s is not None:
            if k - s >= 3: runs.append([round(a + (s + 1) / FPS, 2), round(a + (k + 1) / FPS, 2)])
            s = None
    return runs


def main():
    import shots8 as S_
    from parts8 import Walk
    found = {}
    seen = set()
    for s in S_.build():
        for it in s.items:
            if not isinstance(it, Walk) or it.seq is not None: continue
            key = f'{it.rec} {it.dev}'
            for seg in it.segs:
                a, b = seg[0], seg[1]
                if (key, a, b) in seen: continue
                seen.add((key, a, b))
                fr = frames(it.rec, it.dev, a - 0.2, b + 0.2)
                d = found.setdefault(key, {'clicks': set(), 'scrolls': []})
                d['clicks'].update(clicks(fr, a - 0.2))
                d['scrolls'] += scrolls(fr, a - 0.2)
    out = {k: {'clicks': sorted(v['clicks']), 'scrolls': sorted(v['scrolls'])} for k, v in found.items()}
    (HERE / 'build' / 'clicks8.json').write_text(json.dumps(out, indent=1))
    for k, v in out.items(): print(k, 'clicks', v['clicks'], '\n   scrolls', v['scrolls'])


if __name__ == '__main__':
    main()
