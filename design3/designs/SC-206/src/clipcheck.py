"""SC-205: how long a clip stays steady. Tracks the background frame to frame (optical flow, a similarity fitted with
RANSAC, so people moving are left out), accumulates the camera's zoom and pan against the first frame, and reports the
first moment the camera has pushed in more than 12%, panned more than 5% of the width, or jumped more than 7 px in
one frame (a gentle push is fine; a lunge, a whip or a cut is not). clipcheck.py <clip>... -> prints, and writes build/steady.json {name: seconds}"""
import json, sys, numpy as np, cv2
from pathlib import Path
HERE = Path(__file__).resolve().parent
out = HERE / 'build' / 'steady.json'
res = json.loads(out.read_text()) if out.exists() else {}
ZLIM = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--zoom=')), '0.12'))
PLIM = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--pan=')), '0.05'))
for path in [a for a in sys.argv[1:] if not a.startswith('-')]:
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS)
    ok, f = cap.read(); prev = cv2.cvtColor(cv2.resize(f, (640, 360)), cv2.COLOR_BGR2GRAY)
    acc = np.eye(3); i = 0; steady = None; why = ''
    while True:
        ok, f = cap.read()
        if not ok: break
        i += 1
        g = cv2.cvtColor(cv2.resize(f, (640, 360)), cv2.COLOR_BGR2GRAY)
        p0 = cv2.goodFeaturesToTrack(prev, 600, 0.01, 7)
        p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None, winSize=(21, 21), maxLevel=3)
        M, _ = cv2.estimateAffinePartial2D(p0[st == 1], p1[st == 1], method=cv2.RANSAC, ransacReprojThreshold=1.0)
        if M is None: prev = g; continue
        jump = float(np.hypot(M[0, 2], M[1, 2])) * 3  # in 1920 px
        acc = np.vstack([M, [0, 0, 1]]) @ acc
        zoom = float(np.sqrt(abs(np.linalg.det(acc[:2, :2]))))
        pan = float(np.hypot(acc[0, 2] - (1 - zoom) * 320, acc[1, 2] - (1 - zoom) * 180)) / 640
        if '-v' in sys.argv and i % 12 == 0: print(f'  {i / fps:4.1f}s zoom {zoom:.3f} pan {pan:.3f} jump {jump:.1f}')
        if steady is None and (abs(zoom - 1) > ZLIM or pan > PLIM or jump > 7):
            steady = i / fps; why = f'zoom {zoom:.3f} pan {pan:.3f} jump {jump:.1f}px'
        prev = g
    total = i / fps
    s = round(steady if steady is not None else total, 2)
    res[Path(path).stem] = s
    print(f'{Path(path).name}: steady {s:.2f}s of {total:.2f}s {why}')
out.write_text(json.dumps(res, indent=1))
