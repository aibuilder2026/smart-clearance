"""SC-211: each talking clip's lip sync, measured (as SC-210 learned to: a model's verdict on sync contradicts itself):
the faces found by a Haar cascade, the mouth region's frame-to-frame motion against the sound's level, both detrended,
correlated at lags of -8 to +8 frames. In sync, the best lag is 0 or 1 frame and well above the others.
   uv run --with "opencv-python-headless<5" --with numpy python avsync11.py [lid…]"""
import cv2, numpy as np, subprocess, json, sys
only = set(sys.argv[1:])
L = {l['id']: l for l in json.load(open('lines.json'))['lines'] if l.get('kind') == 'talk' and (not only or l['id'] in only)}
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
for lid, l in L.items():
    src = f"{l.get('clip_dir', 'clips/talk11')}/{l['clip']}.mp4"
    import os
    if not os.path.exists(src): print(lid, 'no clip yet'); continue
    cap = cv2.VideoCapture(src); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(cv2.resize(f, (960, 540)), cv2.COLOR_BGR2GRAY))
    n = len(fr)
    # faces in a few frames: the biggest one, held
    boxes = []
    for k in range(0, n, 12):
        fs = casc.detectMultiScale(fr[k], 1.1, 5, minSize=(60, 60))
        boxes += [tuple(b) for b in fs]
    if not boxes: print(lid, 'no face'); continue
    # cluster by x centre: report each face's lag
    boxes.sort(key=lambda b: -b[2] * b[3])
    faces = []
    for b in boxes:
        if all(abs((b[0] + b[2] / 2) - (c[0] + c[2] / 2)) > c[2] * 0.6 for c in faces): faces.append(b)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    env = np.array([np.sqrt((a[k * 1000:(k + 1) * 1000] ** 2).mean() + 1e-12) for k in range(n)])
    env = np.log(env + 1e-4); env = env - np.convolve(env, np.ones(9) / 9, 'same')
    for (x, y, w, h) in faces[:2]:
        y0, y1, x0, x1 = int(y + 0.62 * h), int(y + 1.02 * h), int(x + 0.2 * w), int(x + 0.8 * w)
        mot = np.zeros(n)
        for k in range(1, n):
            mot[k] = np.abs(fr[k][y0:y1, x0:x1].astype(np.int16) - fr[k - 1][y0:y1, x0:x1].astype(np.int16)).mean()
        mot = mot - np.convolve(mot, np.ones(9) / 9, 'same')
        best = []
        for lag in range(-8, 9):    # positive: the mouth moves after the sound
            if lag >= 0: c = np.corrcoef(env[:n - lag], mot[lag:])[0, 1]
            else: c = np.corrcoef(env[-lag:], mot[:n + lag])[0, 1]
            best.append((c, lag))
        best.sort(reverse=True)
        print(f"{lid} face at x={x + w / 2:.0f}: best lag {best[0][1]:+d} frames (r={best[0][0]:.2f}); next {best[1][1]:+d} ({best[1][0]:.2f}); lag0 r={dict((l_, c_) for c_, l_ in best)[0]:.2f}")
