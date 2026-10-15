"""SC-205: the stage's spotlights (the screen dimmed under a note) in each recording, per device, by brightness:
spots.py -> build/spots.json {rec: {dev: [[t0, t1], ...]}}"""
import json, subprocess, numpy as np
from kit import REC, DEV, HERE
out = {}
for rec in ('mango', 'sad'):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(REC[rec]), '-vf', 'fps=5,scale=640:360', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    series = {d: [] for d in 'PLH'}
    while True:
        b = p.stdout.read(640 * 360)
        if len(b) < 640 * 360: break
        g = np.frombuffer(b, np.uint8).reshape(360, 640).astype(np.float32)
        for d in 'PLH':
            x, y, w, h = [v // 4 for v in DEV[d]]
            series[d].append(g[y:y + h, x:x + w].mean())
    out[rec] = {}
    for d, s in series.items():
        s = np.array(s)
        # a light app screen: the spotlight dims it by ~40%; flag frames well under the screen's local bright level
        ref = np.array([np.percentile(s[max(0, i - 50):i + 50], 80) for i in range(len(s))])
        dim = s < ref * 0.82
        iv, start = [], None
        for i, v in enumerate(dim):
            if v and start is None: start = i
            if not v and start is not None:
                if i - start >= 3: iv.append([round(start / 5, 1), round(i / 5, 1)])
                start = None
        out[rec][d] = iv
        print(rec, d, iv)
(HERE / 'build' / 'spots.json').write_text(json.dumps(out))
