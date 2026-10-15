"""SC-211: the talking scenes as the compositor plays them. Each clip (LTX, made here: clips/talk11/<clip>.mp4, 1280 x
704; the food bank's from SC-210: clips/talk/<clip>.mp4) is cut to its spoken window (lines.json clip_in, clip_out, from
talkwin11.py) with up to half a second of the person before the first word and after the last (pre_avail, post_avail),
scaled to cover 1920 x 1080 by lanczos with the light sharpening the stitch-videos-ffmpeg skill measured as the most
generated video takes (unsharp 0.12; more adds the artefact it means to hide), kept at 24 fps (played frame for frame at
the film's 25), into clips/talk11-<lid>.mp4. Its own sound is cut on the input over the same window (an output -t after
atempo caps the output, SC-210's lesson) and sped up 25/24 with the picture, so the lips stay on the words:
build/talk11/<lid>.wav, its length checked.
   .venv/bin/python prep11.py [lid…]"""
import json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'build' / 'talk11'
TEMPO = 25 / 24


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: raise SystemExit(f"ffmpeg failed: {' '.join(cmd)}\n{r.stderr[-800:]}")
    return r


def dur_of(p):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).stdout)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    for l in json.loads((HERE / 'lines.json').read_text())['lines']:
        if l.get('kind') != 'talk' or (only and l['id'] not in only): continue
        if 'clip_in' not in l: print('no window yet', l['id']); continue
        src = HERE / l.get('clip_dir', 'clips/talk11') / f"{l['clip']}.mp4"
        pre, post = l.get('pre_avail', 0.0), l.get('post_avail', 0.0)
        a, b = l['clip_in'] - pre, l['clip_out'] + post
        d = b - a
        out = HERE / 'clips' / f"talk11-{l['id']}.mp4"
        out.unlink(missing_ok=True)     # never written in place (a hard link would change SC-210's copy too)
        vf = 'fps=24,scale=-2:1080:flags=lanczos,crop=1920:1080,unsharp=5:5:0.12:5:5:0.0,format=yuv420p'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{d:.3f}', '-i', str(src), '-an', '-vf', vf,
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', str(out)])
        wav = OUT / f"{l['id']}.wav"
        wav.unlink(missing_ok=True)
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{d:.3f}', '-i', str(src), '-vn',
             '-af', f'atempo={TEMPO:.7f}', '-ar', '48000', '-ac', '2', str(wav)])
        want = d / TEMPO
        got_a, got_v = dur_of(wav), dur_of(out)
        flag = '' if abs(got_a - want) < 0.03 and abs(got_v - d) < 0.06 else '  <-- CHECK'
        print(f"{l['id']:3} {a:5.2f}-{b:5.2f} (pre {pre:.2f}, post {post:.2f})  video {got_v:.3f} s  sound {got_a:.3f} s (want {want:.3f}){flag}")


if __name__ == '__main__':
    main()
