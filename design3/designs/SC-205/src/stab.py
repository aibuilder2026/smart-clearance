"""SC-205: lock a clip's camera to its first frame: track the background with optical flow, fit a similarity per frame
(RANSAC keeps moving people out), warp each frame onto the first with a small zoom to hide the edges.
  stab.py in.mp4 out.mp4 [zoom=1.06]"""
import sys, subprocess, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]; zoom = float(sys.argv[3]) if len(sys.argv) > 3 else 1.06
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
h, w = frames[0].shape[:2]
g0 = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
p0 = cv2.goodFeaturesToTrack(g0, 1500, 0.01, 8)
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
    pprev = cv2.goodFeaturesToTrack(g, 1500, 0.01, 8)
Z = np.array([[zoom, 0, (1 - zoom) * w / 2], [0, zoom, (1 - zoom) * h / 2], [0, 0, 1]])
ref = int(sys.argv[4]) if len(sys.argv) > 4 else len(Ms) - 1  # lock to this frame (a push-in: the last, so no edges show)
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
