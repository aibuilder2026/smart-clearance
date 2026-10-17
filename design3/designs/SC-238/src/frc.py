"""SC-238: a clip's window at 60 fps, smooth and in sync. The maintainer asked for 60 fps, smooth and never laggy, and for
RIFE. Every generated clip (24 fps) and recording (25 fps) is cut to its window, then interpolated to 60 fps by the
better of two local interpolators, measured on the clip's own frames: RIFE 4.26 (rife-ncnn-vulkan on the Apple GPU,
TNTwise's build, the default: it keeps lip shapes truest) or Apple's VideoToolbox frame-rate conversion (vtfx; it held
fine text steadier on one camera move). The test drops every other frame of the window's first second or two, has each
method rebuild them, and scores the rebuilt frames against the real ones (PSNR); the winner makes the clip. Every
source frame stays where a 60 fps frame lands on it. The clip's own audio is copied back, cut on the same window, so a
lip-synced line stays on its lips. Out: ProRes 422 HQ, BT.709, with PCM audio.

   python frc.py SRC OUT.mov [--start S] [--dur D] [--method auto|rife|vt] [--size 1920x1080] [--fps 60]

--size scales after the interpolation (lanczos, a light unsharp) and pads nothing: give it the clip's own aspect."""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
RIFE_DIR = Path('/private/tmp/claude-501/-Users-arundutta-projects-smart-clearance/1028bcff-359d-42a3-b26d-2ba8eeb01062/scratchpad/dl-rife/x/macos')
RIFE = RIFE_DIR / 'rife-ncnn-vulkan'
VTFX = HERE / 'vtfx' / 'vtfx'
PICKS = HERE / 'build' / 'frc-picks.json'


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f'failed: {" ".join(map(str, cmd))}\n{r.stderr[-2000:]}')
    return r


def probe(p):
    j = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                        '-show_entries', 'format=duration', '-of', 'json', str(p)]).stdout)
    s = j['streams'][0]; n, d = map(int, s['r_frame_rate'].split('/'))
    return s['width'], s['height'], round(n / d), float(j['format']['duration'])


def has_audio(p):
    return bool(run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', str(p)]).stdout.strip())


def frames(src, start, dur, out, fps_in):
    out.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-v', 'error', '-y'] + (['-ss', f'{start:.4f}'] if start else []) + ['-i', str(src)] + (['-t', f'{dur:.4f}'] if dur else [])
        + ['-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', str(out / '%08d.png')])
    return sorted(out.glob('*.png'))


def keep_multiple(fs, k):
    """trim the frame list so its count times out/in is whole (24→60: an even count; 25→60: a multiple of five)"""
    n = len(fs) - (len(fs) % k)
    for f in fs[n:]: f.unlink()
    return fs[:n]


def rife(indir, outdir, n_out, model='rife-v4.26'):
    outdir.mkdir(parents=True, exist_ok=True)
    run([str(RIFE), '-i', str(indir), '-o', str(outdir), '-n', str(n_out), '-m', model, '-f', '%08d.png', '-j', '2:2:2'], cwd=str(RIFE_DIR))
    return sorted(outdir.glob('*.png'))


def encode(pngdir, fps, out, size=None):
    vf = []
    if size:
        w, h = size
        vf.append(f'scale={w}:{h}:flags=lanczos,unsharp=5:5:0.12:5:5:0.0')
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', str(pngdir / '%08d.png')] + (['-vf', ','.join(vf)] if vf else [])
        + ['-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', '-pix_fmt', 'yuv422p10le',
           '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', str(out)])


def vt(src_mov, out_mov, fps):
    run([str(VTFX), 'frc', str(src_mov), str(out_mov), '--fps', str(fps)])


def psnr(a, b):
    m = ((a.astype(np.float32) - b.astype(np.float32)) ** 2).mean()
    return 10 * np.log10(255 ** 2 / max(m, 1e-9))


def bench(fs, fps_in, tmp):
    """drop every other frame of the first second or two, rebuild them with each method, score against the real ones"""
    use = fs[:min(len(fs), 2 * fps_in + 1)]
    if len(use) < 9: return 'rife', {}
    half = tmp / 'b-half'; half.mkdir()
    real = []
    for i, f in enumerate(use):
        if i % 2 == 0: shutil.copy(f, half / f'{i // 2 + 1:08d}.png')
        else: real.append((i, f))
    m = len(list(half.glob('*.png')))
    small = lambda p: np.asarray(Image.open(p).convert('RGB'))
    scores = {}
    # RIFE: m frames -> 2m (output i at i/2 of the input: odd outputs are the rebuilt ones)
    r = rife(half, tmp / 'b-rife', 2 * m)
    scores['rife'] = float(np.mean([psnr(small(f), small(r[i])) for i, f in real if i < len(r)]))
    # VT: the half at half the rate, doubled
    hm = tmp / 'b-half.mov'
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps_in / 2), '-i', str(half / '%08d.png'), '-c:v', 'prores_ks', '-profile:v', '3', str(hm)])
    vo = tmp / 'b-vt.mov'; vt(hm, vo, fps_in)
    vd = tmp / 'b-vt'; vd.mkdir(); run(['ffmpeg', '-v', 'error', '-y', '-i', str(vo), str(vd / '%08d.png')])
    v = sorted(vd.glob('*.png'))
    # (VideoToolbox can hand back a frame a pixel narrower than an odd-sized screen crop: it cannot make that source,
    # since resizing the app's text by a pixel would soften every glyph)
    if not v or small(v[0]).shape != small(use[0]).shape: scores['vt'] = 0.0
    else: scores['vt'] = float(np.mean([psnr(small(f), small(v[i])) for i, f in real if i < len(v)]))
    return max(scores, key=scores.get), scores


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--start', type=float, default=0); ap.add_argument('--dur', type=float, default=0)
    ap.add_argument('--method', default='auto'); ap.add_argument('--size', default=''); ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--model', default='rife-v4.26')
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    w, h, fin, dur = probe(src)
    size = tuple(map(int, a.size.split('x'))) if a.size else None
    step = {24: 2, 25: 5, 30: 1, 12: 1}.get(fin, 1)
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        tmp = Path(td)
        fs = keep_multiple(frames(src, a.start, a.dur, tmp / 'in', fin), step)
        n = len(fs); n_out = n * a.fps // fin
        method, scores = (a.method, {}) if a.method != 'auto' else bench(fs, fin, tmp)
        if method == 'rife':
            rife(tmp / 'in', tmp / 'out', n_out, a.model)
            encode(tmp / 'out', a.fps, tmp / 'v.mov', size)
        else:
            enc = tmp / 'win.mov'; run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fin), '-i', str(tmp / 'in' / '%08d.png'), '-c:v', 'prores_ks', '-profile:v', '3', str(enc)])
            vt(enc, tmp / 'vt.mov', a.fps)
            if size:
                run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp / 'vt.mov'), '-vf', f'scale={size[0]}:{size[1]}:flags=lanczos,unsharp=5:5:0.12:5:5:0.0',
                     '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', str(tmp / 'v.mov')])
            else: shutil.move(str(tmp / 'vt.mov'), str(tmp / 'v.mov'))
        secs = n / fin
        if has_audio(src):
            run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp / 'v.mov')] + (['-ss', f'{a.start:.4f}'] if a.start else []) + ['-t', f'{secs:.4f}', '-i', str(src),
                 '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'pcm_s24le', '-ar', '48000', '-shortest', str(out)])
        else:
            shutil.move(str(tmp / 'v.mov'), str(out))
    picks = json.loads(PICKS.read_text()) if PICKS.exists() else {}
    picks[out.name] = {'src': str(src), 'start': a.start, 'frames_in': n, 'fps_in': fin, 'frames_out': n_out, 'method': method,
                       'scores': {k: round(v, 2) for k, v in scores.items()}}
    PICKS.write_text(json.dumps(picks, indent=1))
    print(f'{out.name}: {n} frames at {fin} → {n_out} at {a.fps} by {method} {picks[out.name]["scores"]}')


if __name__ == '__main__':
    main()
