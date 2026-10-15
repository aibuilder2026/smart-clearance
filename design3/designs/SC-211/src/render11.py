"""SC-211 (the sales film v2, shots11): render the film's picture, frame by frame, in parallel ranges, then join them.
  .venv/bin/python render11.py [--preview] [--from S] [--to S] [--workers N] [--out build/film-silent.mp4]
As SC-210's render10.py, with the hand-over between shots chosen per shot (its `xin`: a dissolve, a cut, a whip pan, a
push through, a light leak, a white flash, a dip to black, a focus pull; parts11.transition) and the light's glow on a
shot's brightest parts (its `bloom`). Each worker renders a contiguous range of frames to an x264 part at crf 12; the
parts are joined without re-encoding. --preview renders 960 x 540 for a quick look."""
import argparse, math, os, subprocess, sys, time
from multiprocessing import Process
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit
from kit import W, H, FPS, HERE


def render_range(a, b, path, preview):
    import shots11 as S_
    import parts11 as P11
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
        act = [s for s in shots if s.t0 <= t < s.t1]
        if not act: act = [shots[-1]]
        buf_a[:] = 0
        act[0].draw(buf_a, t)
        fa = P11.bloom(buf_a, getattr(act[0], 'bloom', 0.0))
        if len(act) > 1:
            nxt = act[-1]
            p = min(1.0, max(0.0, (t - nxt.t0) / S_.XF))
            buf_b[:] = 0
            nxt.draw(buf_b, t)
            fb = P11.bloom(buf_b, getattr(nxt, 'bloom', 0.0))
            kind = getattr(nxt, 'xin', 'cut' if getattr(nxt, 'cut', False) else 'dissolve')
            frame = P11.transition(kind, fa, fb, p, getattr(nxt, 'xopt', None))
        else:
            frame = fa
        out = np.clip(frame * 255 + 0.5, 0, 255).astype(np.uint8)
        if preview: out = cv2.resize(out, (ow, oh), interpolation=cv2.INTER_AREA)
        enc.stdin.write(out.tobytes())
        if (n - a) % 125 == 0:
            el = time.time() - t_start
            print(f'[{a}-{b}] {n - a}/{b - a} t={t:.1f}s {el:.0f}s', flush=True)
    enc.stdin.close(); enc.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--from', dest='t0', type=float, default=0.0)
    ap.add_argument('--to', dest='t1', type=float, default=None)
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    import shots11 as S_
    end = args.t1 if args.t1 is not None else S_.END
    n0, n1 = round(args.t0 * FPS), round(end * FPS)
    parts_dir = HERE / 'build' / (('parts11-preview' if args.preview else 'parts11') + (f'-{args.t0:g}' if args.t0 else ''))
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
    out = args.out or str(HERE / 'build' / ('film11-preview.mp4' if args.preview else 'film11-silent.mp4'))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', out], check=True)
    print('wrote', out, flush=True)


if __name__ == '__main__':
    main()
