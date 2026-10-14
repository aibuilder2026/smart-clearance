"""SC-205: a frame much brighter than the frames around it (a one-frame flash LTX sometimes adds) replaced by the
average of its neighbours. deflash.py in.mp4 out.mp4 -> prints the frames replaced; exit 1 if none (out not written)"""
import sys, subprocess, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
lum = np.array([f.mean() for f in frames])
bad = [i for i in range(1, len(frames) - 1) if lum[i] > max(lum[i - 1], lum[i + 1]) + 12]
if not bad: sys.exit(1)
for i in bad:
    frames[i] = ((frames[i - 1].astype(np.uint16) + frames[i + 1]) // 2).astype(np.uint8)
h, w = frames[0].shape[:2]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
                      '-c:v', 'libx264', '-crf', '10', '-pix_fmt', 'yuv420p', dst], stdin=subprocess.PIPE)
for f in frames: p.stdin.write(f.tobytes())
p.stdin.close(); p.wait()
print('replaced frames', [round(i / fps, 2) for i in bad])
