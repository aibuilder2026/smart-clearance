"""SC-206 cut 3: each over-the-shoulder LTX clip's screen, followed frame by frame, into build/track/<name>.json.

The keyframe's corners (build/screens.json, measured or set by eye) start it, and only the motion comes from the
frames (follow() can settle a few pixels off corners set by eye); in each frame every edge of the last quad is looked
for again along its own normal, where the blank white screen ends, over the middle of the edge only,
and fitted as a line, so a thumb over an edge or a corner does not move it (an edge with too few clean points keeps
its last place, moved with the others). The corners are then smoothed over time. The clip is the keyframe cropped to
16:9 by frame_image (a few pixels off each side), so the keyframe's corners are mapped into the clip's frame first.

   .venv/bin/python track3.py [clips…]        (default: every over-the-shoulder clip that exists and has no track)
"""
import json, sys
from pathlib import Path
import cv2, numpy as np
import vfx
from kit import W, H, HERE

CLIPS = {   # clip -> the screens in it (screens.json keys, also the tracks' names)
    's-upi': ['s-upi', 's-upi-phone'], 's-landfill-photo': ['s-landfill-photo'], 's-landfill-sign': ['s-landfill-sign'],
    's-lakshmi-label': ['s-lakshmi-label'], 's-priya': ['s-priya'], 's-kirana': ['s-kirana'], 's-neha': ['s-neha'],
    's-rakesh': ['s-rakesh'], 's-agrawal': ['s-agrawal'], 's-meera': ['s-meera'], 's-priya-eve': ['s-priya-eve'],
}
SCREENS = json.loads((HERE / 'build' / 'screens.json').read_text())
HIDDEN = {'s-lakshmi-label': 1}   # screens one of whose edges a hand keeps covering (0 top, 1 right, 2 bottom, 3 left)
OUT = HERE / 'build' / 'track'


def key_to_clip(q, key_w, key_h):
    """corners measured on the keyframe stretched to W x H, into the clip's frame (the keyframe cropped to 16:9)"""
    q = np.asarray(q, np.float32)
    kx, ky = q[:, 0] / W * key_w, q[:, 1] / H * key_h
    cw = min(key_w, key_h * 16 / 9); ch = cw * 9 / 16
    ox, oy = (key_w - cw) / 2, (key_h - ch) / 2
    return np.stack([(kx - ox) / cw * W, (ky - oy) / ch * H], 1).astype(np.float32)


def _edge(m, prev, k, c, search=16, n=48):
    """edge k of prev (k: 0 top, 1 right, 2 bottom, 3 left) found again in the mask m, where the white screen ends
    along its outward normal over the middle of the edge: (line (vx, vy, x0, y0), median shift) or None"""
    h, w = m.shape
    a, b = prev[k], prev[(k + 1) % 4]
    ab = b - a; L = float(np.linalg.norm(ab)); u = ab / max(L, 1e-6)
    nr = np.float32([-u[1], u[0]])
    if (a + ab / 2 - c) @ nr < 0: nr = -nr          # outward
    found = []
    for t in np.linspace(0.14, 0.86, n):
        p = a + ab * t
        ss = np.arange(-search, search + 1)
        xy = np.round(p[None] + ss[:, None] * nr[None]).astype(int)
        ok = (xy[:, 0] >= 0) & (xy[:, 0] < w) & (xy[:, 1] >= 0) & (xy[:, 1] < h)
        if not ok.all(): continue
        prof = m[xy[:, 1], xy[:, 0]]
        # the boundary: the last white sample, walking outward, before the first run of three non-white ones
        last = None
        for i in range(len(prof)):
            if prof[i]: last = i
            elif last is not None and i + 2 < len(prof) and not prof[i + 1] and not prof[i + 2]: break
        if last is None or last == len(prof) - 1: continue
        found.append((p + nr * (ss[last] + 0.5), ss[last] + 0.5))
    if len(found) < 10: return None
    off = np.float32([f[1] for f in found]); med = float(np.median(off))
    sel = np.float32([f[0] for f in found if abs(f[1] - med) <= 2.5])
    if len(sel) < 8: return None
    vx, vy, x0, y0 = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    return (vx, vy, x0, y0), med


def _corners(lines, prev):
    out = []
    for k in range(4):
        p = vfx._intersect(lines[k - 1], lines[k])
        out.append(p if p is not None else prev[k])
    return np.float32(out)


def _line_of(prev, k):
    a, b = prev[k], prev[(k + 1) % 4]; ab = b - a; u = ab / max(1e-6, float(np.linalg.norm(ab)))
    return (u[0], u[1], a[0], a[1])


def follow(img, prev, search=16, n=48):
    """the quad's edges found again in img, near prev"""
    m = vfx.screen_mask(img, near=prev)
    c = prev.mean(0)
    got = [_edge(m, prev, k, c, search, n) for k in range(4)]
    if sum(g is not None for g in got) < 2: return prev
    lines = [g[0] if g is not None else _line_of(prev, k) for k, g in enumerate(got)]   # a hidden edge keeps its place
    q = _corners(lines, prev)
    if np.abs(q - prev).max() > 0.04 * m.shape[1]: return prev     # a jump: keep the last
    return q


def follow_hidden(img, prev, q0, hidden=1, search=16, n=48):
    """as follow(), for a screen one of whose edges a hand keeps covering: the other three are found, and the hidden
    one is put back from the screen's own shape (q0's sides, scaled with the side opposite it), so a hand never pulls it in"""
    m = vfx.screen_mask(img, near=prev)
    c = prev.mean(0)
    lines = []
    for k in range(4):
        g = None if k == hidden else _edge(m, prev, k, c, search, n)
        lines.append(g[0] if g is not None else _line_of(prev, k))
    q = _corners(lines, prev)
    if hidden == 1:    # the right edge: from the left side's length, the top and bottom keep their proportion
        s = np.linalg.norm(q[3] - q[0]) / max(1e-6, np.linalg.norm(q0[3] - q0[0]))
        dt = (q[1] - q[0]) / max(1e-6, np.linalg.norm(q[1] - q[0])); db = (q[2] - q[3]) / max(1e-6, np.linalg.norm(q[2] - q[3]))
        q[1] = q[0] + dt * np.linalg.norm(q0[1] - q0[0]) * s
        q[2] = q[3] + db * np.linalg.norm(q0[2] - q0[3]) * s
    if np.abs(q - prev).max() > 0.04 * m.shape[1]: return prev
    return q


def smooth(arr, win=9):
    arr = arr.reshape(len(arr), 8)
    win = win if len(arr) >= win else (len(arr) // 2) * 2 + 1
    if win < 5: return arr.reshape(-1, 4, 2)
    half = win // 2
    x = np.arange(-half, half + 1, dtype=np.float64)
    coef = np.linalg.pinv(np.vander(x, 3))[-1]
    pad = np.pad(arr, ((half, half), (0, 0)), mode='edge')
    return np.stack([coef @ pad[i:i + win] for i in range(len(arr))]).reshape(-1, 4, 2).astype(np.float32)


def run(clip):
    src = HERE / 'clips' / f'{clip}.mp4'
    key = HERE / 'img' / f'{clip}-L.png'
    if not key.exists(): key = HERE / 'img' / f'{clip}.png'
    kh, kw = cv2.imread(str(key)).shape[:2]
    cap = cv2.VideoCapture(str(src)); frames = []
    while True:
        ok, fr = cap.read()
        if not ok: break
        frames.append(cv2.resize(fr, (W, H), interpolation=cv2.INTER_AREA))
    cap.release()
    for name in CLIPS[clip]:
        # only the motion is taken from the frames: where follow() settles on the first frame can sit a few pixels off
        # the corners measured by eye (a status bar, a thumb), so each frame's corners are the measured ones plus how
        # far follow()'s have moved since the first frame
        q0 = key_to_clip(SCREENS[name]['quad'], kw, kh)
        if name in HIDDEN:   # a hand keeps covering one edge: the other three, and the screen's own shape
            q = q0.copy(); qs = []
            for fr in frames:
                q = follow_hidden(fr, q, q0, HIDDEN[name]); qs.append(q)
        else:
            f = q0.copy()
            for _ in range(6): f = follow(frames[0], f)
            f0 = f.copy(); qs = []
            for fr in frames:
                f = follow(fr, f); qs.append(q0 + (f - f0))
        qs = smooth(np.stack(qs))
        vfx.save_track(OUT / f'{name}.json', qs, (W, H))
        d = np.abs(qs - qs[0]).max()
        print(f'{name}: {len(qs)} frames, the corners move up to {d:.1f} px', flush=True)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or [c for c in CLIPS if (HERE / 'clips' / f'{c}.mp4').exists()]
    for c in names:
        if not (HERE / 'clips' / f'{c}.mp4').exists(): print('no clip yet', c); continue
        run(c)
