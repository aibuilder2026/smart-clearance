"""SC-238: the film's deliverables from the silent master (Remotion, ProRes 422 HQ, 1920 × 1080, 25 fps) and its mix
(mix.py, 48 kHz, -14 LUFS): the master MP4 (H.264 High, crf 17, 25 fps, BT.709, AAC 320 kb/s), a 720p copy, a phone
preview, and the captions (.srt, the narration and the people's lines, from film.json), stamped with the time made.
The stitch-videos-ffmpeg skill's export notes hold: yuv420p for players, faststart, no sharpen on generated footage.

   python3 export.py [master.mov] [mix.wav]"""
import datetime as dt, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
B = HERE / 'build'
REPO = HERE.parents[3]
OUT = REPO / 'landing-demo' / 'sales-film'
MEDIA_DIR = HERE.parent / 'media'
FILM = json.loads((HERE / 'film' / 'src' / 'film.json').read_text())
LINES = json.loads((HERE / 'lines.json').read_text())
TEXT = {l['id']: l['text'] for l in LINES['lines']} | {d['id']: d['text'] for d in LINES['dialogue']}


def run(cmd):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if r.returncode: sys.stderr.write(r.stderr[-3000:]); raise SystemExit('ffmpeg failed')
    return r


def srt(path):
    def ts(x):
        h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
        return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
    cues = []
    for v in FILM['vo']:
        txt = TEXT[v['id']]
        if v['key'] != v['id']:
            # a line said in parts: each part takes as many of the line's words as the take says in it (film.json's
            # words for the part, less the spoken-number aliases plan.py adds at the same instant)
            sc = next(s for s in FILM['scenes'] if any(x['key'] == v['key'] for x in s['vo']))
            parts = [x for x in sc['vo'] if x['id'] == v['id']]
            counts = []
            for pv in parts:
                ws = sc['words'][pv['key']]
                counts.append(sum(1 for i, w in enumerate(ws) if not (i and abs(w['t'] - ws[i - 1]['t']) < 1e-6)))
            words = txt.split(); k = parts.index(next(x for x in parts if x['key'] == v['key']))
            a0 = sum(counts[:k]); txt = ' '.join(words[a0:a0 + counts[k]] if k < len(parts) - 1 else words[a0:])
        cues.append((v['t'], v['t'] + v['dur'], txt))
    for d in FILM['dlg']:
        cues.append((d['t'], d['t'] + (d['e'] - d['s']), f"— {TEXT[d['id']]}"))
    cues.sort()
    out = []
    for i, (a, b, txt) in enumerate(cues):
        out.append(f'{i + 1}\n{ts(a)} --> {ts(b + 0.25)}\n{txt}\n')
    Path(path).write_text('\n'.join(out))


def main():
    master = Path(sys.argv[1]) if len(sys.argv) > 1 else B / 'render' / 'Film.mov'
    mix = Path(sys.argv[2]) if len(sys.argv) > 2 else B / 'mix.wav'
    stamp = dt.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    OUT.mkdir(parents=True, exist_ok=True); MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    name = f'smart-clearance-sales-film-v3-{stamp}'
    color = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']
    full = OUT / f'{name}.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-i', mix, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
         '-pix_fmt', 'yuv420p', '-r', '25', *color, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest', full])
    p720 = OUT / f'{name}-720p.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', full, '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', *color,
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', p720])
    phone = OUT / f'{name}-phone.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', full, '-vf', 'scale=960:540:flags=lanczos,fps=25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', *color,
         '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', phone])
    srt(OUT / f'{name}.srt')
    # the design record keeps a 1080p copy at a size git can hold, its 720p and its captions
    rec = MEDIA_DIR / 'smart-clearance-sales-film-v3.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', full, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', *color, '-c:a', 'aac', '-b:a', '192k',
         '-movflags', '+faststart', rec])
    run(['cp', p720, MEDIA_DIR / 'smart-clearance-sales-film-v3-720p.mp4'])
    run(['cp', OUT / f'{name}.srt', MEDIA_DIR / 'smart-clearance-sales-film-v3.srt'])
    for p in (full, p720, phone, rec):
        d = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', p]).stdout
        j = json.loads(d)['format']; print(f"{p.name}: {float(j['duration']):.2f} s, {int(j['size']) / 1e6:.1f} MB")


if __name__ == '__main__':
    main()
