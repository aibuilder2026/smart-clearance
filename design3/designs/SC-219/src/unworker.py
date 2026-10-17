"""SC-239: the opening godown without its walking workers. In the labelled clip (cartons.py) two workers walk down the
aisle beside the forklift's load. From about frame 30 the left one's arm fuses into the other's and the load's edge
swallows him; from about frame 80 the other walks in front of the load, his left hand melting into its cartons (the
frame the film holds before it rushes into the label is one of these). Both are painted out, so the forklift works the
aisle alone, its driver kept.

The fill is the scene behind them, in two layers, each from a local Qwen-Image edit with no workers:
- what stands still (the haze down the aisle, the racks, the far stacks): the clip's frame 0 edited
  (../../SC-239/o0-godown-plate.webp), aligned to each frame by a similarity chained frame to frame on the racks and
  stacks to the right and the shelving above the load;
- the forklift's load, which drives right through the shot: the clip's last frame edited (o0-godown-load.webp),
  aligned to each frame by a similarity chained back from the last frame on the load's own cartons.
Left of the load's right edge (the plate's edge carried by the load's motion; before frame 60, where the load still
passes in front of the left worker, the edge as measured on the top carton) the fill is the load, right of it the still
scene. It covers each worker's box, keyed on the frames and interpolated, from above the head down through the floor's
reflection, feathered (wider on the glossy floor), its light matched to the frame round it.

   .venv/bin/python unworker.py          clips/o0-godown-aisle-labelled.mp4, the clip with its workers kept beside it as
                                         clips/o0-godown-aisle-labelled-two.mp4 (cartons.py writes that clip; run this
                                         after it)"""
import shutil, subprocess
import cv2, numpy as np
from kit import HERE

CLIP = HERE / 'clips' / 'o0-godown-aisle-labelled.mp4'
TWO = HERE / 'clips' / 'o0-godown-aisle-labelled-two.mp4'
SC = HERE.parents[1] / 'SC-239'
FW, FH = 1920, 1088
STILL = (SC / 'o0-godown-plate.webp', 988, 488, 384)      # the plate, where its crop sat in frame 0
LOAD = (SC / 'o0-godown-load.webp', 1100, 470, 384)       # and in the last frame
LOAD_EDGE = 1250.5                                         # the load's right edge in the last frame
HANDOVER = 60                                              # from here the worker is in front of the load

# the workers' box on the frames (x0, top, x1, feet): both of them to frame 46, then the one left
KEYS = {0: (1138, 612, 1242, 760), 12: (1146, 608, 1244, 762), 24: (1153, 604, 1250, 765), 32: (1158, 602, 1253, 765),
        40: (1165, 600, 1254, 766), 46: (1170, 598, 1256, 768), 52: (1176, 597, 1257, 768), 58: (1180, 597, 1258, 768),
        64: (1178, 596, 1254, 766), 76: (1192, 596, 1266, 764), 88: (1206, 594, 1270, 764), 100: (1218, 590, 1280, 766),
        112: (1222, 584, 1292, 770), 124: (1227, 581, 1296, 772), 136: (1232, 578, 1304, 774), 142: (1234, 577, 1308, 775)}


def frames(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(FW * FH * 3)
        if len(b) < FW * FH * 3:
            break
        yield np.frombuffer(b, np.uint8).reshape(FH, FW, 3)
    p.wait()


def box(t):
    ks = sorted(KEYS)
    k1 = next(k for k in ks if k >= t)
    k0 = max(k for k in ks if k <= t)
    w = 0 if k1 == k0 else (t - k0) / (k1 - k0)
    return [a + (b - a) * w for a, b in zip(KEYS[k0], KEYS[k1])]


def canvas(plate):
    path, x, y, s = plate
    c = np.zeros((FH, FW, 3), np.float32)
    c[y:y + s, x:x + s] = cv2.resize(cv2.imread(str(path)), (s, s), interpolation=cv2.INTER_AREA)
    v = np.zeros((FH, FW), np.float32)
    v[y:y + s, x:x + s] = 1
    return c, v


def step(a, b, zone):
    """the similarity taking frame a to frame b, fitted on features inside zone (a mask in a's pixels)"""
    ga, gb = (cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in (a, b))
    p0 = cv2.goodFeaturesToTrack(ga, 500, 0.01, 5, mask=zone)
    p1, st, _ = cv2.calcOpticalFlowPyrLK(ga, gb, p0, None, winSize=(21, 21), maxLevel=3)
    ok = st[:, 0] == 1
    M, _ = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.0)
    return np.vstack([M, [0, 0, 1]])


def top_edge(f):
    """the load's right edge as the first column of its top carton (row 575) left of the workers"""
    s = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)[569:582, 1100:1260, 1].astype(np.float32).mean(0)
    s = cv2.GaussianBlur(s[None], (5, 1), 0)[0]
    j = next((j for j in range(118, 5, -1) if s[j] > 85), None)
    return 1100 + j + 1 if j is not None else np.nan


def main():
    if not TWO.exists():
        shutil.copy2(CLIP, TWO)
    src = list(frames(TWO))
    n = len(src)
    yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
    meas = np.array([top_edge(f) for f in src[:HANDOVER + 6]])
    ok = ~np.isnan(meas)
    fit = np.polyfit(np.arange(len(meas))[ok], meas[ok], 2)
    # the load's edge, for keeping the load out of the still scene's features: measured early, then a straight run to
    # where it ends in the last frame
    e60 = float(np.polyval(fit, HANDOVER))
    meas_edge = lambda t: float(np.polyval(fit, t)) if t <= HANDOVER else e60 + (LOAD_EDGE - e60) * (t - HANDOVER) / (n - 1 - HANDOVER)

    # the still scene: chained forward from frame 0 on what stands still round the workers' box (the stacks either
    # side of it, the shelving above, the floor), never the box itself or the load
    Ms = [np.eye(3)]
    for t in range(1, n):
        x0, top, x1, feet = box(t - 1)
        zone = np.zeros((FH, FW), np.uint8)
        zone[int(top) - 60:int(feet) + 70, int(x0) - 70:int(x1) + 90] = 255
        zone[int(top) - 12:int(feet) + 54, int(x0) - 8:int(x1) + 9] = 0
        zone[:, :int(np.nanmax([meas_edge(t - 1), 0])) + 6] = 0
        Ms.append(step(src[t - 1], src[t], zone) @ Ms[-1])

    # the load: chained back from the last frame on its cartons, left of its edge and of the worker
    edge = [np.nan] * n
    Ml = [None] * n
    Ml[n - 1] = np.eye(3)
    edge[n - 1] = LOAD_EDGE
    for t in range(n - 2, HANDOVER - 8, -1):
        zone = np.zeros((FH, FW), np.uint8)
        x0 = int(min(edge[t + 1], box(t + 1)[0])) - 6
        zone[560:760, max(0, x0 - 130):x0] = 255
        Ml[t] = step(src[t + 1], src[t], zone) @ Ml[t + 1]
        edge[t] = (Ml[t] @ [LOAD_EDGE, 680, 1])[0]
    for t in range(HANDOVER):
        edge[t] = float(np.polyval(fit, t))
    print('load edge: measured', round(float(np.polyval(fit, HANDOVER)), 1), 'tracked', round(edge[HANDOVER], 1),
          'last', LOAD_EDGE)

    sc, sv = canvas(STILL)
    lc, lv = canvas(LOAD)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{FW}x{FH}',
                            '-r', '24', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt',
                            'yuv420p', str(CLIP)], stdin=subprocess.PIPE)
    def fill(t, behind):
        """frame t with the workers' box filled; behind: the worker passes in front of the load (else the load's
        edge bounds the box, as it passes in front of the left worker)"""
        x0, top, x1, feet = box(t)
        x0, x1 = x0 - 6, x1 + 7
        y0, y1 = top - 10, feet + 52
        bx, by, bw, bh = int(x0) - 20, int(y0) - 16, int(x1 - x0) + 40, int(y1 - y0) + 40
        sl = (slice(by, by + bh), slice(bx, bx + bw))
        X, Y = xx[sl], yy[sl]
        fl = 2.0 + 12.0 * np.clip((Y - feet) / 30.0, 0, 1)
        left = x0 if behind else max(x0, edge[t] + 0.5)
        a = np.clip((X - left) / fl, 0, 1) * np.clip((x1 - X) / fl, 0, 1)
        a *= np.clip((Y - y0) / 8.0, 0, 1) * np.clip((y1 - Y) / 18.0, 0, 1)
        bg = cv2.warpAffine(sc, Ms[t][:2], (FW, FH), flags=cv2.INTER_CUBIC)[sl]
        if behind:
            bl = cv2.warpAffine(lc, Ml[t][:2], (FW, FH), flags=cv2.INTER_CUBIC)[sl]
            el = (Ml[t] @ [LOAD_EDGE, 680, 1])[0]
            k = np.clip((el - X) / 1.5 + 0.5, 0, 1)[..., None]      # left of the load's edge: the load
            bg = bl * k + bg * (1 - k)
        crop = src[t][sl].astype(np.float32)
        ring = (a == 0) & (((X > left + 3) & (Y < y0) & (Y > y0 - 14)) | ((Y > y1) & (X > x0 - 10) & (X < x1 + 10)))
        if ring.sum() > 40:
            bg = bg + (crop[ring].mean(0) - bg[ring].mean(0))
        out = src[t].astype(np.float32)
        out[sl] = crop * (1 - a[..., None]) + bg * a[..., None]
        return out

    for t in range(n):
        w = np.clip((t - (HANDOVER - 6)) / 12.0, 0, 1)            # the two fills crossfade over half a second
        out = fill(t, True) if w >= 1 else fill(t, False) if w <= 0 else fill(t, True) * w + fill(t, False) * (1 - w)
        out = np.clip(out + 0.5, 0, 255).astype(np.uint8)
        enc.stdin.write(out.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f'{CLIP.name}: {n} frames, the workers painted out')


if __name__ == '__main__':
    main()
