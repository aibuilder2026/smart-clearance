"""SC-205: frame-to-frame shift of a region of the film, by phase correlation: jitter.py <video> <x0> <y0> <x1> <y1> [t0 t1]"""
import subprocess, sys, numpy as np, cv2
v, x0, y0, x1, y1 = sys.argv[1], *map(int, sys.argv[2:6])
t0, t1 = (float(sys.argv[6]), float(sys.argv[7])) if len(sys.argv) > 7 else (0, 1e9)
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(t0), '-i', v, '-t', str(t1 - t0), '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
prev, shifts, i = None, [], 0
win = cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_32F)
while True:
    b = p.stdout.read(1920 * 1080)
    if len(b) < 1920 * 1080: break
    g = np.frombuffer(b, np.uint8).reshape(1080, 1920)[y0:y1, x0:x1].astype(np.float32)
    if prev is not None:
        (dx, dy), r = cv2.phaseCorrelate(prev, g, win)
        shifts.append((i, dx, dy, r))
    prev, i = g, i + 1
s = np.array(shifts)
big = s[(np.abs(s[:, 1]) > 0.05) | (np.abs(s[:, 2]) > 0.05)]
print(f'{len(s)} pairs; |dx| max {np.abs(s[:,1]).max():.3f} mean {np.abs(s[:,1]).mean():.4f}; |dy| max {np.abs(s[:,2]).max():.3f} mean {np.abs(s[:,2]).mean():.4f}; moving pairs {len(big)}')
for row in big[:12]: print('  frame %d dx %.3f dy %.3f resp %.2f' % tuple(row))
