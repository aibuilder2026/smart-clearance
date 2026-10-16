"""SC-219 cut 12's concept round: follow regions of an LTX clip so motion graphics ride it. For every frame, the
similarity (scale, rotation and shift) from the clip's first frame to that frame, fitted on the features tracked
inside each region (Lucas-Kanade with a forward-backward check, RANSAC), as a 3x3 matrix, smoothed over time; written to remo12/public/track/<clip>.json for Remotion's
<Ride> (lib/track.tsx). Regions are drawn in the first frame's 1920 x 1080 pixels.
  .venv/bin/python track12c.py <clip.mp4> <name>"""
import json, sys
from pathlib import Path
import cv2, numpy as np
HERE = Path(__file__).resolve().parent
REGIONS = {
    'dc-a2-aisle': {'run': [[[500, 140], [720, 245], [720, 860], [500, 920]]],
                    'sql': [[[1200, 285], [1410, 205], [1410, 885], [1200, 822]]],
                    'mid': [[[520, 150], [780, 280], [780, 820], [520, 900]], [[1150, 280], [1420, 190], [1420, 890], [1150, 810]]]},
    'dc-c1-fibre': {'fibre': [[[150, 250], [1500, 250], [1500, 1040], [150, 1040]]]},
    'dc-c2-blade': {'sled': [[[300, 80], [1700, 80], [1700, 1000], [300, 1000]]]},
    'dc-a1-pipes': {},
}


def main(clip: str, name: str) -> None:
    cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        if f.shape[1] != 1920 or f.shape[0] != 1080: f = cv2.resize(f, (1920, 1080), interpolation=cv2.INTER_AREA)
        frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))
    out = {'fps': fps, 'w': 1920, 'h': 1080, 'regions': {}}
    lk = dict(winSize=(25, 25), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
    for reg, polys in REGIONS.get(name, {}).items():
        mask = np.zeros((1080, 1920), np.uint8)
        for p in polys: cv2.fillPoly(mask, [np.array(p, np.int32)], 255)
        p0 = cv2.goodFeaturesToTrack(frames[0], maxCorners=600, qualityLevel=0.005, minDistance=7, mask=mask)
        start = p0.reshape(-1, 2).copy(); cur = p0.copy(); alive = np.ones(len(start), bool)
        Hs = [np.eye(3)]
        for k in range(1, len(frames)):
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(frames[k - 1], frames[k], cur, None, **lk)
            back, st2, _ = cv2.calcOpticalFlowPyrLK(frames[k], frames[k - 1], nxt, None, **lk)
            fb = np.linalg.norm((back - cur).reshape(-1, 2), axis=1)
            inb = (nxt[:, 0, 0] > 2) & (nxt[:, 0, 0] < 1918) & (nxt[:, 0, 1] > 2) & (nxt[:, 0, 1] < 1078)
            alive &= (st[:, 0] == 1) & (st2[:, 0] == 1) & (fb < 1.0) & inb
            cur = nxt
            a = alive.nonzero()[0]
            if len(a) >= 8:   # a similarity (scale, rotation, shift): steady on a slow camera move, where a full homography is not
                M, inl = cv2.estimateAffinePartial2D(start[a], cur[a].reshape(-1, 2), method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=4000, confidence=0.995)
                H = np.vstack([M, [0, 0, 1]]) if M is not None else Hs[-1]
            else:
                H = Hs[-1]
            Hs.append(H / H[2, 2])
        A = np.array([h.reshape(-1) for h in Hs])
        # smooth each parameter over time (a light Gaussian, 2 frames), the first frame stays the identity
        g = np.exp(-0.5 * (np.arange(-6, 7) / 2.0) ** 2); g /= g.sum()
        pad = np.pad(A, ((6, 6), (0, 0)), mode='edge')
        S = np.stack([np.convolve(pad[:, j], g, mode='valid') for j in range(9)], 1)
        S[0] = np.eye(3).reshape(-1)
        out['regions'][reg] = [[round(float(v), 7) for v in row] for row in S]
        print(f'{name}/{reg}: {len(start)} features, {int(alive.sum())} alive at the end, {len(frames)} frames')
    dst = HERE / 'remo12' / 'public' / 'track'; dst.mkdir(parents=True, exist_ok=True)
    (dst / f'{name}.json').write_text(json.dumps(out))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
