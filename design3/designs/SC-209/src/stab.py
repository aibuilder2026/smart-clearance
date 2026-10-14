"""SC-205: lock a clip's camera, as on a tripod: track the background with optical flow, fit a similarity per frame
(RANSAC keeps moving people out), and warp every frame onto one reference frame. For a push-in the reference is the
last frame kept, the tightest, so every earlier frame covers it and no edge shows.
  stab.py in.mp4 out.mp4 [zoom=1.0] [ref=last] [until=seconds] [mask=x0,y0,x1,y1 (fractions: track only there)]"""
import sys, subprocess, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]; zoom = float(sys.argv[3]) if len(sys.argv) > 3 else 1.06
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
until = float(sys.argv[5]) if len(sys.argv) > 5 else 1e9
box = [float(v) for v in sys.argv[6].split(',')] if len(sys.argv) > 6 and sys.argv[6] else None
frames = []
while True:
    ok, f = cap.read()
    if not ok or len(frames) >= round(until * fps): break
    frames.append(f)
h, w = frames[0].shape[:2]
g0 = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
MASK = None
if box:
    MASK = np.zeros_like(g0); MASK[int(box[1] * h):int(box[3] * h), int(box[0] * w):int(box[2] * w)] = 255
p0 = cv2.goodFeaturesToTrack(g0, 1500, 0.005, 6, mask=MASK)
Ms, prev, pprev, acc = [np.eye(3)], g0, p0, np.eye(3)
for f in frames[1:]:
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pprev, None, winSize=(31, 31), maxLevel=4)
    good0, good1 = pprev[st == 1], p1[st == 1]
    M, inl = cv2.estimateAffinePartial2D(good1, good0, method=cv2.RANSAC, ransacReprojThreshold=1.5)
    M3 = np.vstack([M, [0, 0, 1]])
    acc = acc @ M3  # maps this frame into frame 0's view
    Ms.append(acc.copy())
    prev = g
    pprev = cv2.goodFeaturesToTrack(g, 1500, 0.005, 6, mask=MASK)
Z = np.array([[zoom, 0, (1 - zoom) * w / 2], [0, zoom, (1 - zoom) * h / 2], [0, 0, 1]])
ref = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != 'last' else len(Ms) - 1  # lock to this frame (a push-in: the last, so no edges show)
Rinv = np.linalg.inv(Ms[ref])
Ms = [Rinv @ m for m in Ms]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
                      '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', dst], stdin=subprocess.PIPE)
for f, M in zip(frames, Ms):
    A = (Z @ M)[:2]
    p.stdin.write(cv2.warpAffine(f, A, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).tobytes())
p.stdin.close(); p.wait()
sc = [np.sqrt(abs(np.linalg.det(m[:2, :2]))) for m in Ms]; tx = [m[0, 2] for m in Ms]; ty = [m[1, 2] for m in Ms]
print(f'scale {min(sc):.3f}..{max(sc):.3f}  tx {min(tx):.1f}..{max(tx):.1f}  ty {min(ty):.1f}..{max(ty):.1f}')
