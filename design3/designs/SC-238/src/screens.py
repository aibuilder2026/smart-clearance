"""SC-238: the person and their own screen. Each over-the-shoulder clip (SC-206's, its blank screen tracked frame by frame
by SC-207's track3.py) gets the app's real screen set into the device's glass in perspective, under any finger or thumb
over it, for as long as its shot: the same window frames the lift-out then carries on in (media.py's window), so the
screen the person watches is the screen the film shows. Once the screen has lifted out, the clip goes on behind it at
half speed, back and forth (it is out of focus by then), so a long window keeps its person.

The insert is SC-206's (vfx.py: occluders, warp_into, insert), here as it was: within the screen's quad, only pixels the
colour of the blank screen are replaced, and an occluder that reaches in from the quad's edge (a finger) stays in front.

Out: film/public/media/<name>.mp4 (60 fps, 1920 × 1080: the clip's 1088 rows cropped 4 off each edge) and
film/public/track/<name>.json (the screen's quad for every frame, in film pixels, for the Remotion lift-out).

   uv run --with numpy --with opencv-python-headless --with pillow python screens.py [--draft] [names…]
   --draft: the clip's frames sampled (nearest), no RIFE; for building the cut while the GPU is busy"""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import frc  # noqa: E402

MEDIA = json.loads((HERE / 'build' / 'media.json').read_text())
OUT = HERE / 'film' / 'public' / 'media'
TRK = HERE / 'film' / 'public' / 'track'
FPS = 60
W, H = 1920, 1080


# ---------------------------------------------------------------- SC-206's insert (vfx.py), as it was

def occluders(frame_u8, quad):
    """within the quad, pixels that are not screen (a thumb, a finger), softened: 1 where the screen shows"""
    h, w = frame_u8.shape[:2]
    poly = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(poly, np.int32(np.round(quad * 4)), 255, lineType=cv2.LINE_AA, shift=2)
    hsv = cv2.cvtColor(frame_u8, cv2.COLOR_BGR2HSV)
    inside = poly > 127
    if inside.sum() < 50: return poly.astype(np.float32) / 255
    v, s = hsv[..., 2].astype(np.float32), hsv[..., 1].astype(np.float32)
    mv, ms = np.median(v[inside]), np.median(s[inside])
    scr = ((np.abs(v - mv) < 55) & (s < ms + 34)).astype(np.uint8)
    scr = cv2.morphologyEx(scr, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    scr = cv2.dilate(scr, np.ones((3, 3), np.uint8))
    occ = ((scr == 0) & inside).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(occ, 8)
    edge = cv2.dilate((poly > 0).astype(np.uint8), np.ones((3, 3), np.uint8)) - cv2.erode((poly > 0).astype(np.uint8), np.ones((7, 7), np.uint8))
    keep = np.zeros_like(occ)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 60: continue
        if (edge[lab == i] > 0).any(): keep[lab == i] = 1
    m = (poly.astype(np.float32) / 255) * (1 - keep.astype(np.float32))
    return cv2.GaussianBlur(m, (0, 0), 0.8)


def warp_into(content, quad, size):
    ch, cw = content.shape[:2]
    qw = max(np.linalg.norm(quad[1] - quad[0]), np.linalg.norm(quad[2] - quad[3]))
    qh = max(np.linalg.norm(quad[3] - quad[0]), np.linalg.norm(quad[2] - quad[1]))
    k = min(1.0, max(qw / cw, qh / ch) * 1.15)
    if k < 0.98:
        content = cv2.resize(content, (max(2, round(cw * k)), max(2, round(ch * k))), interpolation=cv2.INTER_AREA)
        ch, cw = content.shape[:2]
    src = np.float32([[0, 0], [cw, 0], [cw, ch], [0, ch]])
    M = cv2.getPerspectiveTransform(src, np.float32(quad))
    return cv2.warpPerspective(content, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


def insert(frame, frame_u8, quad, content):
    h, w = frame.shape[:2]
    m = occluders(frame_u8, quad)
    wc = warp_into(content, quad, (w, h))
    lum = cv2.cvtColor(frame_u8, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    shade = np.clip(lum / max(1e-3, float(np.median(lum[m > 0.5])) if (m > 0.5).any() else 1.0), 0.75, 1.08)[..., None]
    wc = wc * (0.92 + 0.08 * shade)
    m3 = m[..., None]
    frame *= (1 - m3)
    frame += wc * m3
    return m


def dehalo(fr, quad=None, ring=24, strength=1.0):
    """the relabelled cartons' bright fringe (SC-206's clips: each label pasted with a glow round it) taken back to the
    background around it. Labels are small, bright, near-white rectangles carrying print (text, a barcode, a QR; a
    highlight carries none), never the device's screen: each keeps its own pixels, a touch under the scene's light, and in
    a ring round it the excess over the local background is taken out, feathered from its edge"""
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    lab = ((hsv[..., 2] > 200) & (hsv[..., 1] < 45)).astype(np.uint8)
    h, w = lab.shape
    if quad is not None:
        poly = np.zeros((h, w), np.uint8); cv2.fillConvexPoly(poly, np.int32(np.round(quad)), 1)
        lab[cv2.dilate(poly, np.ones((61, 61), np.uint8)) > 0] = 0
    lab = cv2.morphologyEx(lab, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    n, cc, st, _ = cv2.connectedComponentsWithStats(lab, 8)
    L = np.zeros((h, w), np.uint8)
    for i in range(1, n):
        x, y, bw, bh, a = st[i]
        if not (700 <= a <= 60000): continue
        if a / float(bw * bh) < 0.6 or not (0.6 <= bw / float(bh) <= 3.6): continue
        if (hsv[y:y + bh, x:x + bw, 2] < 150).mean() < 0.03: continue
        L[y:y + bh, x:x + bw] = 1
    if not L.any(): return fr
    far = cv2.dilate(L, np.ones((2 * ring + 7, 2 * ring + 7), np.uint8))
    wgt = (1 - far).astype(np.float32)
    f = fr.astype(np.float32)
    bg = cv2.blur(f * wgt[..., None], (81, 81)) / np.maximum(cv2.blur(wgt, (81, 81))[..., None], 1e-3)
    d = cv2.distanceTransform((1 - L).astype(np.uint8), cv2.DIST_L2, 5)
    fe = np.clip(1 - (d - 1.5) / ring, 0, 1) * (d > 1.5)
    f = f - np.clip(f - bg, 0, None) * (strength * fe)[..., None]
    f[L > 0] *= 0.93
    return np.clip(f + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- the shot

def clip_time(u, a, lift, b_max, after=0.5):
    """the clip's own second for shot second u: at its own pace until the lift is done, then half pace, back and forth
    over what is left of it. A shot longer than its clip (no lift before the clip runs out) turns at the clip's end and
    plays back over its last two seconds, then forth again, at half pace: it never holds a last frame"""
    t_lift = min(lift + 0.7, b_max - a - 0.04)
    if u <= t_lift: return a + u
    x = (u - t_lift) * after
    lo, hi = a + t_lift, b_max
    if hi - lo < 0.5:
        lo = max(a, hi - 2.0); span = max(0.04, hi - lo); p = x % (2 * span)
        return hi - p if p <= span else lo + (p - span)
    span = hi - lo; p = x % (2 * span)
    return lo + (p if p <= span else 2 * span - p)


def quad_at(quads, fps, tc):
    f = tc * fps; i = int(np.clip(np.floor(f), 0, len(quads) - 1)); j = min(len(quads) - 1, i + 1); k = float(np.clip(f - np.floor(f), 0, 1))
    return quads[i] * (1 - k) + quads[j] * k


def read_frames(path):
    cap = cv2.VideoCapture(str(path)); fs = []
    while True:
        ok, fr = cap.read()
        if not ok: break
        fs.append(fr)
    cap.release()
    return fs


def make(name, draft):
    m = MEDIA[name]
    src, trk = Path(m['src']), Path(m['track'])
    win = OUT / f"{m['win']}.mp4" if m.get('win') else None
    still = Path(m['still']) if m.get('still') else None
    n = round(m['dur'] * FPS)
    tj = json.loads(trk.read_text()); quads = np.asarray(tj['quads'], np.float32)
    cw, chh = tj['size']
    _, _, fin, dur = frc.probe(src)
    b_max = dur - 0.06
    times = [clip_time(i / FPS, m['in'], m['lift'], b_max) for i in range(n)]
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        tmp = Path(td)
        # the clip at 60 fps over its times: RIFE at the needed instants (one pass over the span it covers), or nearest
        lo, hi = min(times), max(times)
        if draft:
            cfr = read_frames(src)
            frame_at = lambda tc: cfr[int(np.clip(round(tc * fin), 0, len(cfr) - 1))]
        else:
            ins = frc.frames(src, 0, 0, tmp / 'in', fin)
            dense = len(ins) * 5                       # 5× the clip's rate (120 fps): every shot time is within 1/240 s
            frc.rife(tmp / 'in', tmp / 'dense', dense)
            dfr = sorted((tmp / 'dense').glob('*.png'))
            frame_at = lambda tc: cv2.imread(str(dfr[int(np.clip(round(tc / dur * len(dfr)), 0, len(dfr) - 1))]))
        wcap = cv2.VideoCapture(str(win)) if win else None      # the window's frames, read as they are needed
        last_w = [None]
        def next_win():
            ok, fr = wcap.read()
            if ok: last_w[0] = fr
            return last_w[0]
        stl = cv2.imread(str(still)) if still else None
        # a second device in the shot (the staff member's phone in front of the distributor's tablet), with its own still
        q2s = np.asarray(json.loads(Path(m['track2']).read_text())['quads'], np.float32) if m.get('track2') else None
        st2 = cv2.imread(m['still2']).astype(np.float32) / 255 if m.get('still2') else None
        seq = tmp / 'seq'; seq.mkdir()
        out_q = []
        for i, tc in enumerate(times):
            fr = frame_at(tc)
            if fr.shape[1] != cw or fr.shape[0] != chh: fr = cv2.resize(fr, (cw, chh), interpolation=cv2.INTER_AREA)
            q = quad_at(quads, fin, tc)
            if m.get('dehalo'): fr = dehalo(fr, q)          # (the relabelled cartons' glow taken out, before the screen goes in)
            content = (next_win() if wcap is not None else stl).astype(np.float32) / 255
            f32 = fr.astype(np.float32) / 255
            insert(f32, fr, q, content)
            if q2s is not None: insert(f32, fr, quad_at(q2s, fin, tc), st2)
            out = np.clip(f32 * 255 + 0.5, 0, 255).astype(np.uint8)
            y0 = (chh - H) // 2
            cv2.imwrite(str(seq / f'{i + 1:08d}.png'), out[y0:y0 + H, :W] if cw == W else cv2.resize(out, (W, int(chh * W / cw)))[y0:y0 + H])
            out_q.append(np.round(q - np.float32([0, y0]), 2).tolist())
        OUT.mkdir(parents=True, exist_ok=True); TRK.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', str(seq / '%08d.png'), '-vf', 'tpad=stop_mode=clone:stop=3',   # (3 frames held past the shot)
                        '-c:v', 'libx264', '-preset', 'slow' if not draft else 'veryfast',
                        '-crf', '12' if not draft else '16', '-g', '60', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
                        '-movflags', '+faststart', str(OUT / f'{name}.mp4')], check=True)
        (TRK / f'{name}.json').write_text(json.dumps({'fps': FPS, 'n': n, 'quads': out_q}))
    print(f'{name}: {n} frames ({"draft" if draft else "RIFE"}), {src.name} with {m.get("win") or still.name}')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--draft', action='store_true'); ap.add_argument('names', nargs='*')
    a = ap.parse_args()
    names = a.names or [k for k, m in MEDIA.items() if m['kind'] == 'ots']
    for n in names:
        m = MEDIA[n]
        if m.get('win') and not (OUT / f"{m['win']}.mp4").exists(): print(f'{n}: window {m["win"]} not made yet'); continue
        make(n, a.draft)


if __name__ == '__main__':
    main()
