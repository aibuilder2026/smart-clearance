"""SC-211: each talking clip's lip sync, measured frame by frame (the camera may push in, so the face is found in every
frame): the mouth's open interior (its share of dark pixels, under the face's lower third) against the sound's level in
the same 1/24 s, over the spoken window, correlated at lags of -6 to +6 frames. In sync, the best lag is 0 or +-1 frame
and the correlation clearly positive; a printout of both per frame (--bars) shows where they part.
   ~/.local/bin/uv run --with "opencv-python-headless<5" --with "numpy<2.4" python lipsync11.py [lid…] [--bars]"""
import json, subprocess, sys
import cv2, numpy as np

args = [a for a in sys.argv[1:] if not a.startswith('--')]
bars = '--bars' in sys.argv
L = [l for l in json.load(open('lines.json'))['lines'] if l.get('kind') == 'talk' and (not args or l['id'] in args)]
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
for l in L:
    src = f"{l.get('clip_dir', 'clips/talk11')}/{l['clip']}.mp4"
    try: open(src).close()
    except OSError: print(l['id'], 'no clip yet'); continue
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    t0, t1 = l.get('clip_in', 0.0), l.get('clip_out', 1e9)
    mouth, snd, last = [], [], None
    k = 0
    while True:
        ok, f = cap.read()
        if not ok: break
        t = k / fps; k += 1
        if t < t0 or t > t1: continue
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        fs = casc.detectMultiScale(g, 1.1, 4, minSize=(90, 90))
        if len(fs):
            b = max(fs, key=lambda b: b[2] * b[3])
            last = b if last is None else (0.6 * np.float32(last) + 0.4 * np.float32(b)).astype(int)   # steadied
        if last is None: mouth.append(np.nan); snd.append(np.nan); continue
        x, y, w, h = last
        m = g[int(y + 0.66 * h):int(y + 0.94 * h), int(x + 0.28 * w):int(x + 0.72 * w)].astype(np.float32)
        mouth.append((m < np.percentile(m, 50) * 0.62).mean() if m.size else np.nan)
        seg = a[int(t * 24000):int((t + 1 / fps) * 24000)]
        snd.append(20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9) if seg.size else np.nan)
    mo, so = np.array(mouth), np.array(snd)
    ok = ~(np.isnan(mo) | np.isnan(so))
    mo, so = mo[ok], so[ok]
    if len(mo) < 20: print(l['id'], 'too few frames with a face'); continue
    sm = lambda x: x - np.convolve(x, np.ones(11) / 11, 'same')   # each detrended, so only the syllables count
    md, sd = sm(mo), sm(so)
    res = []
    for lag in range(-6, 7):   # positive: the mouth moves after the sound
        if lag >= 0: c = np.corrcoef(sd[:len(sd) - lag], md[lag:])[0, 1]
        else: c = np.corrcoef(sd[-lag:], md[:len(md) + lag])[0, 1]
        res.append((c, lag))
    best = max(res)
    r0 = dict((lg, c) for c, lg in res)[0]
    verdict = 'in sync' if abs(best[1]) <= 1 and best[0] > 0.25 else 'CHECK'
    print(f"{l['id']:3} {len(mo):3d} frames: best lag {best[1]:+d} (r={best[0]:.2f}), lag 0 r={r0:.2f}  {verdict}")
    if bars:
        for i in range(len(mo)):
            print(f"   {i / fps:5.2f} sound {so[i]:6.1f} {'#' * int(max(0, (so[i] + 50) / 2)):25s} mouth {mo[i]:.2f} {'*' * int(mo[i] * 60)}")
