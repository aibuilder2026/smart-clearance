"""SC-209 cut 7: the bin's ground. LTX moved the whole heap of cartons (it slid down the slope like a river, the printed
labels blooming white) and drifted the camera, so the clip is used only above the heap: its sky, kites, smoke, the
excavator and the truck tipping its load, locked to the first frame (stab.py), slowed 1.2x by motion interpolation so
it fills the shot, and laid over that first frame's heap, which holds still with its labels crisp.
   .venv/bin/python landfill-comp.py   ->  clips/w1-landfill-comp.mp4"""
import subprocess
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
STAB, SLOW, OUT = HERE / 'build' / 'w1-landfill-stab.mp4', HERE / 'build' / 'w1-landfill-slow.mp4', HERE / 'clips' / 'w1-landfill-comp.mp4'
if not STAB.exists():
    subprocess.run(['.venv/bin/python', 'stab.py', 'clips/w1-landfill.mp4', str(STAB), '1.04', '0', '99', '0,0.26,1,0.46'], cwd=HERE, check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(STAB), '-vf',
                'setpts=1.2*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1',
                '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', str(SLOW)], check=True)


def frames(p):
    cap = cv2.VideoCapture(str(p))
    while True:
        ok, f = cap.read()
        if not ok: return
        yield f


cap = cv2.VideoCapture(str(STAB)); ok, still = cap.read(); cap.release()
h, w = still.shape[:2]
# where the heap begins, x by x (the clip's own 1920 x 1088): above it the clip moves, below it the first frame holds
xs = [0, 560, 600, 820, 860, 1100, 1140, 1480, 1520, 1920]
ys = [470, 470, 486, 486, 472, 472, 458, 458, 432, 432]
yb = np.interp(np.arange(w), xs, ys).astype(np.float32) * h / 1088
yy = np.arange(h, dtype=np.float32)[:, None]
m = np.clip((yb[None, :] + 18 - yy) / 36, 0, 1)                       # 1 above the line, a 36 px feather across it
m = cv2.GaussianBlur(m, (0, 0), 6)[..., None]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', '24', '-i', '-',
                      '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', str(OUT)], stdin=subprocess.PIPE)
base = still.astype(np.float32)
n = 0
for f in frames(SLOW):
    out = f.astype(np.float32) * m + base * (1 - m)
    p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes()); n += 1
p.stdin.close(); p.wait()
print('w1-landfill-comp', n, 'frames')
