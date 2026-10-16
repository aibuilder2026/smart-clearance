"""SC-219 (cut 13, shots13): render the film's picture, frame by frame, in parallel ranges, then join them.
  .venv/bin/python render11.py [--preview] [--from S] [--to S] [--workers N] [--out build/film13-silent.mp4]
  .venv/bin/python render11.py --stills 12.5,40,96.2 [--dir build/stills13]   (single frames, for checking a layout)
Cut 8's transitions are crisp: a shot hands over by a cut, a push (the next shot slides in over this one, which slips
back and darkens a little, at whole pixels, no blur) or a wipe (a hard edge with a thin light line). Nothing dissolves
between two shots, and nothing is zoom-blurred. Cut 9 adds an iris: the next shot opens inside the brand's own
squircle, growing from the frame's middle, with a thin light rim (the mark opening into a window, as the apps' loaders do). Each worker renders a contiguous range of frames (its own sources, read
forward) to an x264 part at crf 12; the parts are joined without re-encoding. --preview renders 960 x 540."""
import argparse, math, os, subprocess, sys, time
from multiprocessing import Process
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import W, H, FPS, HERE
from parts4 import bezier_ease

PUSH_EASE = bezier_ease(0.65, 0.0, 0.25, 1.0)     # a camera's push: gathers, travels, lands softly
WIPE_EASE = bezier_ease(0.55, 0.0, 0.2, 1.0)
LIGHT = np.array([128 / 255, 211 / 255, 52 / 255], np.float32)   # the ring's green, BGR


def shift_x(img, dx, fill=0.0):
    """the frame moved dx whole pixels sideways (no resampling: crisp)"""
    out = np.full_like(img, fill)
    dx = int(dx)
    if dx >= W or dx <= -W: return out
    if dx >= 0: out[:, dx:] = img[:, :W - dx]
    else: out[:, :W + dx] = img[:, -dx:]
    return out


def shift_y(img, dy, fill=0.0):
    out = np.full_like(img, fill)
    dy = int(dy)
    if dy >= H or dy <= -H: return out
    if dy >= 0: out[dy:] = img[:H - dy]
    else: out[:H + dy] = img[-dy:]
    return out


def compose(kind, a, b, p, d=1):
    """the frame between the outgoing a and the incoming b, p from 0 to 1"""
    if kind == 'push':
        e = PUSH_EASE(p)
        nx = round(d * W * (1 - e))                      # the incoming frame's left edge (d=1: in from the right)
        ox = round(-d * W * 0.30 * e)                   # the outgoing slips back a third, under it
        out = shift_x(a, ox) * (1 - 0.45 * e)
        bb = shift_x(b, nx)
        if d > 0:
            x0 = max(0, nx)
            # a short shadow cast by the incoming frame's edge on the outgoing one
            sw = 60
            if x0 > 0:
                xs = np.arange(max(0, x0 - sw), x0)
                k = ((xs - (x0 - sw)) / sw) ** 2 * 0.55
                out[:, xs] *= (1 - k)[None, :, None]
            out[:, x0:] = bb[:, x0:]
        else:
            x1 = min(W, W + nx)
            sw = 60
            if x1 < W:
                xs = np.arange(x1, min(W, x1 + sw))
                k = ((x1 + sw - xs) / sw) ** 2 * 0.55
                out[:, xs] *= (1 - k)[None, :, None]
            out[:, :x1] = bb[:, :x1]
        return out
    if kind == 'up':                                    # the next shot rises from below over this one
        e = PUSH_EASE(p)
        ny = round(H * (1 - e))
        out = shift_y(a, round(-H * 0.25 * e)) * (1 - 0.45 * e)
        out[ny:] = shift_y(b, ny)[ny:]
        return out
    if kind == 'wipe':
        e = WIPE_EASE(p)
        x = int(round(W * e)) if d > 0 else int(round(W * (1 - e)))
        out = a.copy()
        if d > 0: out[:, :x] = b[:, :x]
        else: out[:, x:] = b[:, x:]
        # the edge: a 3 px light line, bright at the frame's middle, fading to its ends
        if 0 < x < W:
            v = np.linspace(-1, 1, H, dtype=np.float32)
            g = (1 - v * v * 0.6)[:, None]
            x0, x1 = max(0, x - 1), min(W, x + 2)
            out[:, x0:x1] = out[:, x0:x1] * (1 - 0.9 * g[..., None]) + LIGHT * 0.9 * g[..., None] + 0.08
        return np.clip(out, 0, 1)
    if kind == 'iris':
        # the incoming shot inside a rounded square (the mark's squircle) that grows from the middle to past the corners
        e = IRIS_EASE(p)
        s = 1180.0 * e + 1.0                      # half its side: past the frame's half-diagonal (1101) when done
        r = 0.32 * s
        dx = np.maximum(_AX - (s - r), 0.0); dy = np.maximum(_AY - (s - r), 0.0)
        d = np.sqrt(dx * dx + dy * dy) - r         # signed distance to the squircle's edge, in pixels
        m = np.clip(0.5 - d, 0.0, 1.0)[..., None]
        out = a * (1 - 0.35 * e) * (1 - m) + b * m
        rim = np.clip(1.0 - np.abs(d + 1.5) / 2.0, 0.0, 1.0)[..., None] * (1.0 - e) ** 0.5
        out = out * (1 - 0.85 * rim) + LIGHT * 0.95 * rim
        return np.clip(out, 0, 1)
    return b


IRIS_EASE = bezier_ease(0.6, 0.0, 0.2, 1.0)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_AX, _AY = np.abs(_xx - W / 2 + 0.5), np.abs(_yy - H / 2 + 0.5)


def render_frame(shots, t, buf_a, buf_b):
    act = [s for s in shots if s.t0 <= t < s.t1]
    if not act: act = [shots[-1]]
    buf_a[:] = 0
    act[0].draw(buf_a, t)
    if len(act) > 1:
        nxt = act[-1]
        buf_b[:] = 0
        nxt.draw(buf_b, t)
        p = kit.clamp((t - nxt.t0) / max(1e-6, nxt.xd))
        return compose(nxt.xin, buf_a, buf_b, p, nxt.xdir)
    return buf_a


def render_range(a, b, path, preview):
    import shots13 as S_
    shots = S_.build()
    ow, oh = (960, 540) if preview else (W, H)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{ow}x{oh}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium' if not preview else 'veryfast', '-crf', '12' if not preview else '20',
                            '-pix_fmt', 'yuv420p', '-g', str(FPS * 2), '-bf', '0', '-movflags', '+faststart', path], stdin=subprocess.PIPE)
    buf_a = np.zeros((H, W, 3), np.float32)
    buf_b = np.zeros((H, W, 3), np.float32)
    t_start = time.time()
    for n in range(a, b):
        t = n / FPS
        frame = render_frame(shots, t, buf_a, buf_b)
        out = np.clip(frame * 255 + 0.5, 0, 255).astype(np.uint8)
        if preview: out = cv2.resize(out, (ow, oh), interpolation=cv2.INTER_AREA)
        enc.stdin.write(out.tobytes())
        if (n - a) % 125 == 0:
            el = time.time() - t_start
            print(f'[{a}-{b}] {n - a}/{b - a} t={t:.1f}s {el:.0f}s', flush=True)
    enc.stdin.close(); enc.wait()


def stills(times, folder):
    import shots13 as S_
    shots = S_.build()
    os.makedirs(folder, exist_ok=True)
    buf_a = np.zeros((H, W, 3), np.float32)
    buf_b = np.zeros((H, W, 3), np.float32)
    for t in times:
        frame = render_frame(shots, t, buf_a, buf_b)
        out = np.clip(frame * 255 + 0.5, 0, 255).astype(np.uint8)
        p = os.path.join(folder, f'still-{t:07.2f}.jpg')
        cv2.imwrite(p, out, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print(p, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--from', dest='t0', type=float, default=0.0)
    ap.add_argument('--to', dest='t1', type=float, default=None)
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--out', default=None)
    ap.add_argument('--stills', default=None)
    ap.add_argument('--dir', default=str(HERE / 'build' / 'stills13'))
    args = ap.parse_args()
    if args.stills:
        stills([float(x) for x in args.stills.split(',')], args.dir)
        return
    import shots13 as S_
    end = args.t1 if args.t1 is not None else S_.END
    n0, n1 = round(args.t0 * FPS), round(end * FPS)
    parts_dir = HERE / 'build' / ('parts9-preview' if args.preview else 'parts9')
    parts_dir.mkdir(parents=True, exist_ok=True)
    for f_ in parts_dir.glob('*.mp4'): f_.unlink()
    k = args.workers
    step = math.ceil((n1 - n0) / k)
    procs, paths = [], []
    for i in range(k):
        a, b = n0 + i * step, min(n1, n0 + (i + 1) * step)
        if a >= b: break
        p = str(parts_dir / f'part-{i:02d}.mp4'); paths.append(p)
        pr = Process(target=render_range, args=(a, b, p, args.preview)); pr.start(); procs.append(pr)
    for pr in procs: pr.join()
    lst = parts_dir / 'list.txt'
    lst.write_text(''.join(f"file '{p}'\n" for p in paths))
    out = args.out or str(HERE / 'build' / ('film13-preview.mp4' if args.preview else 'film13-silent.mp4'))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', out], check=True)
    print('wrote', out)


if __name__ == '__main__':
    main()
