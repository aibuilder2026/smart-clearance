"""SC-238: the film's media, from build/media.json (plan.py). Every clip, talking clip and app window is made at 60 fps
to exactly its shot's length, so Remotion plays everything at its own rate and nothing judders.

  clip  a generated clip's span (24 fps), interpolated to 60 fps over the time the cut gives it (a slow drift where
        the shot is longer than the span), cover-scaled to 1920 × 1080 (lanczos, a light unsharp)
  talk  a talking clip's span, at its own pace (24 → 60 fps), with its own sound cut on the same frames (a WAV beside it)
  win   a device's screen cropped from a production recording (25 fps, 2560 × 1440), each span in turn:
          - near its own pace (0.85× to 2.2×): interpolated to 60 fps;
          - longer than its span (under 0.85×): played at 0.9× and held on its last frame (a person reading);
          - a fast-forward (2.2× and up): sampled straight from the recording, no interpolation;
        at the device's own size (Remotion places and scales it)

The interpolator is RIFE 4.26 (rife-ncnn-vulkan, the Apple GPU) or Apple's VideoToolbox frame-rate conversion, whichever
rebuilds the source's own dropped frames better (frc.py's bench, once per source, kept in build/frc-picks.json).

   uv run --with numpy --with pillow python media.py sheets [names…]     contact sheets of every window's spans, for review (CPU)
   python3 media.py audio               the talking clips' sound (CPU)
   python3 media.py ff                  the fast-forward spans (CPU, no interpolation)
   python3 media.py make [names…]       everything else (the GPU: run it once LTX and Qwen are done)
   python3 media.py list                what is made and what is missing

Out: film/public/media/<name>.mp4 (H.264, 60 fps; windows 4:4:4) and <name>.wav for talking clips."""
import json, math, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import frc  # noqa: E402

MEDIA = json.loads((HERE / 'build' / 'media.json').read_text())
OUT = HERE / 'film' / 'public' / 'media'
SHEETS = HERE / 'build' / 'sheets'
FF_DIR = HERE / 'build' / 'ff'
PICKS = HERE / 'build' / 'frc-picks.json'
FPS = 60
W, H = 1920, 1080


def run(cmd, **kw):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f'failed: {" ".join(map(str, cmd))}\n{r.stderr[-2500:]}')
    return r


def spans(m):
    """(a, b, d) spans in the source's seconds, each played over d seconds"""
    if m['kind'] == 'win': return [tuple(s) for s in m['segs']]
    return [(m['in'], m['out'], m['dur'])]


def bounds(m):
    """each span's output frames [f0, f1): cumulative times rounded once, so the window's total is exact"""
    out, u = [], 0.0
    for a, b, d in spans(m):
        out.append((round(u * FPS), round((u + d) * FPS))); u += d
    return out


def mode(m, a, b, d):
    s = (b - a) / d
    if m['kind'] == 'win':
        if s >= 2.2: return 'ff'
        if s < 0.85: return 'hold'
    return 'interp'


def crop_vf(m):
    if m['kind'] != 'win': return []
    x, y, w, h = m['rect']
    return [f'crop={w}:{h}:{x}:{y}']


def cover_vf():
    return [f'scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos', f'crop={W}:{H}', 'unsharp=5:5:0.12:5:5:0.0']


def native_frames(m, a, b, out):
    """the span's own frames at the source's rate, cropped for a window"""
    out.mkdir(parents=True, exist_ok=True)
    vf = crop_vf(m)
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, a - 1.0):.4f}', '-i', m['src'], '-ss', f'{min(a, 1.0):.4f}', '-t', f'{b - a:.4f}']
        + (['-vf', ','.join(vf)] if vf else []) + ['-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', out / '%08d.png'])
    return sorted(out.glob('*.png'))


def sampled_frames(m, a, b, n, out):
    """n frames straight from the recording, evenly over (a, b): a fast-forward"""
    out.mkdir(parents=True, exist_ok=True)
    s = (b - a) / (n / FPS)
    vf = crop_vf(m) + [f'setpts=(PTS-STARTPTS)/{s:.6f}', f'fps={FPS}']
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, a - 1.0):.4f}', '-i', m['src'], '-ss', f'{min(a, 1.0):.4f}', '-t', f'{b - a:.4f}',
         '-vf', ','.join(vf), '-frames:v', str(n), '-pix_fmt', 'rgb24', out / '%08d.png'])
    fs = sorted(out.glob('*.png'))
    for i in range(len(fs), n): shutil.copy(fs[-1], out / f'{i + 1:08d}.png')
    return sorted(out.glob('*.png'))[:n]


def method_for(src, fs, fps_in, tmp):
    picks = json.loads(PICKS.read_text()) if PICKS.exists() else {}
    key = f'source:{src}'
    if key not in picks:
        meth, scores = frc.bench(fs, fps_in, tmp)
        picks[key] = {'method': meth, 'scores': {k: round(v, 2) for k, v in scores.items()}}
        PICKS.write_text(json.dumps(picks, indent=1))
        print(f'  bench {Path(src).name}: {picks[key]}')
    return picks[key]['method']


def interp(fs, n_out, fps_in, meth, tmp, out):
    """the frames rebuilt at n_out evenly spaced times over the span (RIFE's -n, or VT at the needed rate)"""
    out.mkdir(parents=True, exist_ok=True)
    if len(fs) < 2:
        for i in range(n_out): shutil.copy(fs[0], out / f'{i + 1:08d}.png')
        return sorted(out.glob('*.png'))
    if meth == 'rife':
        src = fs[0].parent
        frc.rife(src, out, n_out)
    else:
        enc = tmp / 'vt-in.mov'
        run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps_in), '-i', fs[0].parent / '%08d.png', '-c:v', 'prores_ks', '-profile:v', '3', enc])
        rate = n_out / (len(fs) / fps_in)          # the output rate that puts n_out frames over the span
        vo = tmp / 'vt-out.mov'; frc.vt(enc, vo, round(rate, 4))
        run(['ffmpeg', '-v', 'error', '-y', '-i', vo, '-frames:v', str(n_out), out / '%08d.png'])
    got = sorted(out.glob('*.png'))
    for i in range(len(got), n_out): shutil.copy(got[-1], out / f'{i + 1:08d}.png')
    for f in sorted(out.glob('*.png'))[n_out:]: f.unlink()
    return sorted(out.glob('*.png'))


def encode(seq_dir, out, m):
    vf = [] if m['kind'] == 'win' else cover_vf()
    pix = 'yuv444p' if m['kind'] == 'win' else 'yuv420p'
    prof = ['-profile:v', 'high444'] if pix == 'yuv444p' else ['-profile:v', 'high']
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', seq_dir / '%08d.png'] + (['-vf', ','.join(vf)] if vf else [])
        + ['-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-g', '60', '-bf', '2', '-pix_fmt', pix] + prof
        + ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out])


def make(name, only_ff=False):
    m = MEDIA[name]
    out = OUT / f'{name}.mp4'
    drafts = json.loads(DRAFTS.read_text()) if DRAFTS.exists() else {}
    if out.exists() and name not in drafts and out.stat().st_mtime > (HERE / 'build' / 'media.json').stat().st_mtime and not only_ff:
        return print(f'{name}: made')
    if not Path(m['src']).exists(): return print(f'{name}: SOURCE MISSING {m["src"]}')
    w, h, fps_in, _ = frc.probe(m['src'])
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        tmp = Path(td); seq = tmp / 'seq'; seq.mkdir()
        k = 0
        for i, ((a, b, d), (f0, f1)) in enumerate(zip(spans(m), bounds(m))):
            n = f1 - f0
            if n <= 0: continue
            md = mode(m, a, b, d)
            cache = FF_DIR / name / f'{i:02d}'
            if md == 'ff':
                if cache.exists() and len(list(cache.glob('*.png'))) == n: fs = sorted(cache.glob('*.png'))
                else:
                    if cache.exists(): shutil.rmtree(cache)
                    fs = sampled_frames(m, a, b, n, cache)
            elif only_ff:
                continue
            else:
                src_fs = native_frames(m, a, b, tmp / f'in{i}')
                meth = method_for(m['src'], src_fs, fps_in, tmp / f'b{i}') if len(src_fs) > 2 * fps_in + 1 else 'rife'
                if md == 'hold':
                    n_play = min(n, round((b - a) / 0.9 * FPS))
                    fs = interp(src_fs, n_play, fps_in, meth, tmp, tmp / f'out{i}')
                    fs = fs + [fs[-1]] * (n - n_play)
                else:
                    fs = interp(src_fs, n, fps_in, meth, tmp, tmp / f'out{i}')
            for f in fs:
                k += 1
                dst = seq / f'{k:08d}.png'
                try: dst.hardlink_to(f)
                except OSError: shutil.copy(f, dst)
        if only_ff: return
        total = bounds(m)[-1][1]
        assert k == total, (name, k, total)
        OUT.mkdir(parents=True, exist_ok=True)
        encode(seq, out, m)
    drafts = json.loads(DRAFTS.read_text()) if DRAFTS.exists() else {}
    if drafts.pop(name, None) is not None: DRAFTS.write_text(json.dumps(drafts, indent=1))
    if m['kind'] == 'talk': audio(name)
    print(f'{name}: {total} frames ({total / FPS:.3f} s)')


def audio(name):
    m = MEDIA[name]
    if m['kind'] != 'talk': return
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f'{name}.wav'
    if not Path(m['src']).exists(): return print(f'{name}: SOURCE MISSING')
    n = bounds(m)[-1][1]
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{m["in"]:.4f}', '-i', m['src'], '-t', f'{n / FPS:.4f}', '-vn', '-ac', '2', '-ar', '48000',
         '-c:a', 'pcm_s24le', out])
    print(f'{name}.wav: {n / FPS:.3f} s')


DRAFTS = HERE / 'build' / 'drafts.json'


def draft(name):
    """a quick stand-in at the same frames, for building the cut while the GPU is busy: each span sampled straight at
    60 fps (no interpolation; a hold played at 0.9× and its last frame cloned), encoded fast. make() replaces it."""
    m = MEDIA[name]
    out = OUT / f'{name}.mp4'
    if not Path(m['src']).exists(): return print(f'{name}: SOURCE MISSING (no draft)')
    drafts = json.loads(DRAFTS.read_text()) if DRAFTS.exists() else {}
    key = json.dumps(m, sort_keys=True)
    if out.exists() and drafts.get(name) == key: return print(f'{name}: draft made')
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        tmp = Path(td); parts = []
        for i, ((a, b, d), (f0, f1)) in enumerate(zip(spans(m), bounds(m))):
            n = f1 - f0
            if n <= 0: continue
            md = mode(m, a, b, d)
            sp = 0.9 if md == 'hold' else (b - a) / (n / FPS)
            vf = crop_vf(m) + [f'setpts=(PTS-STARTPTS)/{sp:.6f}', f'fps={FPS}', 'tpad=stop_mode=clone:stop_duration=30'] + ([] if m['kind'] == 'win' else cover_vf())
            part = tmp / f'p{i:02d}.mp4'
            # (the span read as an input option: as an output option -t would cap the slowed span at its source length)
            run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, a - 1.0):.4f}', '-t', f'{min(a, 1.0) + b - a + 0.2:.4f}', '-i', m['src'], '-ss', f'{min(a, 1.0):.4f}',
                 '-vf', ','.join(vf), '-frames:v', str(n), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', str(FPS), part])
            parts.append(part)
        lst = tmp / 'list.txt'; lst.write_text(''.join(f"file '{p}'\n" for p in parts))
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', out])
    n_got = int(run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out]).stdout.strip() or 0)
    want = bounds(m)[-1][1]
    if m['kind'] == 'talk': audio(name)
    drafts[name] = key; DRAFTS.write_text(json.dumps(drafts, indent=1))
    print(f'{name}: draft {n_got} frames (want {want}){"" if n_got == want else "  MISMATCH"}')


def sheets(names):
    """three frames a span (start, middle, end; five on a fast-forward), labelled, one sheet a window"""
    SHEETS.mkdir(parents=True, exist_ok=True)
    for name in names:
        m = MEDIA[name]
        if m['kind'] != 'win': continue
        tmp = Path(tempfile.mkdtemp(dir=str(HERE / 'build')))
        imgs = []
        for i, (a, b, d) in enumerate(spans(m)):
            md = mode(m, a, b, d)
            ts = [a + (b - a) * f for f in ([0.02, 0.25, 0.5, 0.75, 0.98] if md == 'ff' else [0.02, 0.5, 0.98])]
            for j, t in enumerate(ts):
                p = tmp / f's{i} {md} {(b - a) / d:.2f}x at {t:.1f}s ({i:02d}{j}).jpg'
                run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', m['src'], '-frames:v', '1', '-vf', ','.join(crop_vf(m)), '-q:v', '3', p])
                imgs.append(p)
        cols = 5 if m['dev'] in ('H', 'L') else 3
        width = 260 if m['dev'] in ('H', 'L') else 520
        run([sys.executable, HERE / 'sheet.py', SHEETS / f'{name}.jpg'] + imgs + ['--cols', str(cols), '--w', str(width)])
        shutil.rmtree(tmp)
        print(f'sheet {name}: {len(imgs)} frames')


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
    names = sys.argv[2:] or [k for k, m in MEDIA.items() if m['kind'] != 'ots']   # screens.py makes the over-the-shoulder shots
    if cmd == 'sheets': sheets(names)
    elif cmd == 'audio':
        for n in names: audio(n)
    elif cmd == 'ff':
        for n in names:
            m = MEDIA[n]
            if m['kind'] == 'win' and any(mode(m, *s) == 'ff' for s in spans(m)): make(n, only_ff=True); print(f'{n}: fast-forward frames')
    elif cmd == 'make':
        for n in names: make(n)
    elif cmd == 'peek':
        peek(sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6]))
    elif cmd == 'draft':
        for n in names: draft(n)
    elif cmd == 'list':
        for n, m in MEDIA.items():
            out = OUT / f'{n}.mp4'
            st = 'made' if out.exists() else ('source missing' if not Path(m['src']).exists() else 'to make')
            print(f'{n:16s} {m["kind"]:5s} {m["dur"]:6.2f}s  {st}')



def peek(rec, dev, t0, t1, step, out=None):
    """frames of a recording's device screen from t0 to t1 every step seconds, on one sheet (build/sheets/peek-…)"""
    sys.path.insert(0, str(HERE)); import plan
    m = {'kind': 'win', 'rect': plan.DEV[dev], 'src': str(plan.REC[rec])}
    tmp = Path(tempfile.mkdtemp(dir=str(HERE / 'build')))
    imgs, t = [], t0
    while t <= t1 + 1e-6:
        p = tmp / f'{rec} {dev} at {t:.2f}s.jpg'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', m['src'], '-frames:v', '1', '-vf', ','.join(crop_vf(m)), '-q:v', '3', p])
        imgs.append(p); t += step
    out = out or SHEETS / f'peek-{rec}-{dev}-{t0:.1f}.jpg'
    cols = 6 if dev in ('H', 'L') else 4
    run([sys.executable, HERE / 'sheet.py', out] + imgs + ['--cols', str(cols), '--w', 260 if dev in ('H', 'L') else 420])
    shutil.rmtree(tmp)
    print(out)


if __name__ == '__main__':
    main()
