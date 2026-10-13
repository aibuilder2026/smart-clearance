"""SC-205: a short clip made to fill a long shot without a visible bounce: it plays forward and back with eased turns
(source time follows a cosine, so the camera slows to a stop before it reverses), blending neighbouring frames for
fractional times. breathe.py in.mp4 out.mp4 <seconds> [peak speed=0.9]"""
import sys, subprocess, math, numpy as np, cv2
src, dst, length = sys.argv[1], sys.argv[2], float(sys.argv[3])
peak = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f.astype(np.float32))
N = len(frames); span = (N - 1) / fps            # seconds of source
P = 2 * math.pi * span / (2 * peak) * 2 / math.pi  # period so the speed at the middle of a pass is `peak`
P = math.pi * span / peak
h, w = frames[0].shape[:2]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', '25', '-i', '-',
                      '-c:v', 'libx264', '-crf', '10', '-pix_fmt', 'yuv420p', dst], stdin=subprocess.PIPE)
for k in range(int(round(length * 25))):
    t = k / 25
    s = span * (1 - math.cos(2 * math.pi * t / P)) / 2 * fps
    i = int(s); fr = s - i
    a = frames[min(i, N - 1)]; b = frames[min(i + 1, N - 1)]
    p.stdin.write(np.clip(a * (1 - fr) + b * fr + 0.5, 0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
print(f'{N} frames ({span:.1f}s) breathing over {length:.1f}s, period {P:.1f}s')
