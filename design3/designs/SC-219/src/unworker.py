"""SC-239: one worker in the opening godown. In the labelled clip (cartons.py) two workers walk side by side behind the
forklift's pallet; from about frame 30 the left one's arm fuses into the other's and he melts into the pallet's edge as
the dolly carries it over him. He is painted out, so one worker walks the aisle throughout.

The fill is a clean plate of the empty aisle: a local Qwen-Image edit of frame 0 with no workers
(../../SC-239/o0-godown-plate.webp, its input and sidecar beside it), aligned to each frame by a similarity fitted on
the static racks and the aisle above the heads, its light matched to the frame around the band. It fills the band
between the pallet's right edge (measured each frame on the top carton's saturation, smoothed by a quadratic) and a
line just left of the remaining worker, from above the heads to the floor's reflections, feathered (wider on the glossy
floor, where the pallet's foot ends).

   .venv/bin/python unworker.py          clips/o0-godown-aisle-labelled.mp4, the two-worker clip kept beside it as
                                         clips/o0-godown-aisle-labelled-two.mp4 (cartons.py writes the two-worker
                                         clip; run this after it)"""
import shutil, subprocess
import cv2, numpy as np
from kit import HERE

CLIP = HERE / 'clips' / 'o0-godown-aisle-labelled.mp4'
TWO = HERE / 'clips' / 'o0-godown-aisle-labelled-two.mp4'
PLATE = HERE.parents[1] / 'SC-239' / 'o0-godown-plate.webp'
FW, FH = 1920, 1088
X0, Y0, S = 988, 488, 384          # the plate's crop of the frame
T_END = 70                         # the pallet has covered the band by frame 64
DIV0, DIV1 = 1181.0, 1193.0        # the line left of the remaining worker, frame 0 and from frame 52


def frames(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(FW * FH * 3)
        if len(b) < FW * FH * 3:
            break
        yield np.frombuffer(b, np.uint8).reshape(FH, FW, 3)
    p.wait()


def pallet_edge(f):
    """the first column, from x 1218 leftward, of the top carton (row 575): its saturation is the pallet's"""
    s = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)[569:582, 1100:1260, 1].astype(np.float32).mean(0)
    s = cv2.GaussianBlur(s[None], (5, 1), 0)[0]
    j = next((j for j in range(118, 5, -1) if s[j] > 85), None)
    return 1100 + j + 1 if j is not None else np.nan


def main():
    if not TWO.exists():
        shutil.copy2(CLIP, TWO)
    src = list(frames(TWO))
    n = len(src)
    e = np.array([pallet_edge(f) for f in src[:80]])
    ok = ~np.isnan(e)
    fit = np.polyfit(np.arange(80)[ok], e[ok], 2)
    edge = np.polyval(fit, np.arange(n))

    plate0 = cv2.resize(cv2.imread(str(PLATE)), (S, S), interpolation=cv2.INTER_AREA).astype(np.float32)
    g0 = cv2.cvtColor(src[0][Y0:Y0 + S, X0:X0 + S], cv2.COLOR_BGR2GRAY)
    stat = np.zeros((S, S), np.uint8)
    stat[0:110, 200:S] = 255          # the aisle above the heads, right of the pallet
    stat[:, 270:S] = 255              # the racks and pallets on the right
    pts0 = cv2.goodFeaturesToTrack(g0, 400, 0.01, 4, mask=stat)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    xx += X0
    yy += Y0

    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{FW}x{FH}',
                            '-r', '24', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt',
                            'yuv420p', str(CLIP)], stdin=subprocess.PIPE)
    for t, f in enumerate(src):
        dv = DIV0 + (DIV1 - DIV0) * min(t, 52) / 52
        if t <= T_END and dv - edge[t] > 0.5:
            g = cv2.cvtColor(f[Y0:Y0 + S, X0:X0 + S], cv2.COLOR_BGR2GRAY)
            p1, st, _ = cv2.calcOpticalFlowPyrLK(g0, g, pts0, None, winSize=(21, 21), maxLevel=3)
            good = st[:, 0] == 1
            M, _ = cv2.estimateAffinePartial2D(pts0[good], p1[good], method=cv2.RANSAC, ransacReprojThreshold=1.5)
            plate = cv2.warpAffine(plate0, M, (S, S), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            fl = 2.0 + 14.0 * np.clip((yy - 750) / 40.0, 0, 1)
            a = np.clip((xx - (edge[t] + 0.5)) / fl, 0, 1) * np.clip((dv - xx) / 2.0, 0, 1)
            a *= np.clip((yy - 596) / 8.0, 0, 1) * np.clip((806 - yy) / 16.0, 0, 1)
            crop = f[Y0:Y0 + S, X0:X0 + S].astype(np.float32)
            ring = (a == 0) & (((xx > edge[t] + 4) & (xx < dv + 30) & (yy > 560) & (yy < 600)) |
                               ((xx > edge[t] - 42) & (xx < dv + 40) & (yy > 800) & (yy < 830)))
            if ring.sum() > 50:
                plate = plate + (crop[ring].mean(0) - plate[ring].mean(0))
            f = f.copy()
            f[Y0:Y0 + S, X0:X0 + S] = np.clip(crop * (1 - a[..., None]) + plate * a[..., None], 0, 255).astype(np.uint8)
        enc.stdin.write(f.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f'{CLIP.name}: {n} frames, the second worker painted out of 0 to {T_END}')


if __name__ == '__main__':
    main()
