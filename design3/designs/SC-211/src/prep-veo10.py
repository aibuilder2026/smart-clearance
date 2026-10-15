"""SC-210: the Veo clips the sales film reuses (SC-187's and SC-154's, each reviewed there by eyes.py and cut to its clean
seconds), prepared as the compositor's clips: from `seek`, slowed to `speed` by motion interpolation (ffmpeg
minterpolate, as SC-187 slowed them) where a shot needs more seconds than the source has, scaled to cover 1920 x 1080
(the 1280 x 704 clips by lanczos, with a light unsharp) and kept at 24 fps, so Footage plays them frame for frame at the
film's 25. The talking scenes (clips/talk, Veo 3.1 with sound) are cut to their windows (lines.json clip_in, clip_out)
the same way, and their sound taken out for the mix, sped up by 25/24 with the picture (atempo keeps the pitch), so the
lips stay on the words.
   .venv/bin/python prep-veo10.py"""
import json, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
D = HERE.parent.parent
CLIPS = {   # name: (source, seek s, speed, seconds of output at 24 fps)
    'v-hold': (D / 'SC-187/media/c53-qc-dock.mp4', 0.0, 0.85, 5.2),
    'v-landfill': (D / 'SC-187/media/c54-write-off.mp4', 0.0, 0.85, 6.6),
    'v-factory': (D / 'SC-187/media/c56-factory-dawn.mp4', 0.0, 0.6, 3.0),
    'v-dawn': (D / 'SC-154/media/final-1-bay-dawn-v3.mp4', 0.0, 0.85, 7.4),
    'v-photo': (D / 'SC-187/media/c57-label-photo.mp4', 0.0, 0.8, 4.0),
    'v-kirana': (D / 'SC-187/media/c25-kirana-offer.mp4', 0.0, 0.6, 5.0),
    'v-foodbank': (D / 'SC-187/media/c32-foodbank-store.mp4', 0.0, 0.6, 6.4),
    'v-buyer': (D / 'SC-187/media/c26-agrawal-tablet.mp4', 0.0, 0.65, 3.6),
    'v-paper': (D / 'SC-187/media/c52-dist-office.mp4', 0.0, 0.55, 3.6),
    'v-office': (D / 'SC-187/media/c51-brand-office.mp4', 0.0, 0.8, 3.8),
    'v-evening': (D / 'SC-154/media/final-4-office-dashboard.mp4', 0.0, 0.85, 7.6),
}
MI = 'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'


def run(cmd):
    subprocess.run(cmd, check=True)


def prep(name, src, seek, speed, secs):
    out = HERE / 'clips' / f'{name}.mp4'
    if out.exists(): print('kept', name); return
    need = secs * speed + 0.4
    vf = []
    if speed < 0.999: vf += [f'setpts=PTS/{speed}', MI]
    else: vf += ['fps=24']
    vf += ['scale=-2:1080:flags=lanczos', 'crop=1920:1080', 'unsharp=5:5:0.35:5:5:0.0']
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{seek:.3f}', '-t', f'{need:.3f}', '-i', str(src), '-an', '-vf', ','.join(vf),
         '-t', f'{secs:.3f}', '-r', '24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', str(out)])
    side = {'source': str(src.relative_to(D.parent.parent)), 'seek_s': seek, 'speed': speed, 'seconds': secs,
            'post': ('slowed by motion interpolation (' + MI + '), ' if speed < 0.999 else '') +
                    'scaled to cover 1920 x 1080 (lanczos), unsharp 0.35, 24 fps (played frame for frame at the film\'s 25)',
            'model': 'Veo 3.1 (reused from ' + src.parent.parent.name + ')', 'cost_usd': 0}
    (HERE / 'clips' / f'{name}.prompt.json').write_text(json.dumps(side, indent=1))
    print('made', name)


def talk():
    L = {l['id']: l for l in json.loads((HERE / 'lines.json').read_text())['lines']}
    (HERE / 'build' / 'talk').mkdir(parents=True, exist_ok=True)
    for lid, l in L.items():
        if l.get('kind') != 'talk': continue
        src = HERE / 'clips' / 'talk' / f"{l['clip']}.mp4"
        a, b = l['clip_in'], l['clip_out']
        out = HERE / 'clips' / f"talk-{lid}.mp4"
        if not out.exists():
            run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-i', str(src), '-t', f'{b - a:.3f}', '-an', '-vf', 'fps=24',
                 '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', str(out)])
        wav = HERE / 'build' / 'talk' / f'{lid}.wav'
        if not wav.exists():   # the clip's own sound, at the pace the picture plays (25/24)
            # the window cut on the input (-t before -i), so the sound ends with the line: as an output option it capped
            # the sped-up output instead, and took in 0.3 s of the clip after the line
            run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', str(src), '-vn',
                 '-af', 'atempo=1.0416667', '-ar', '48000', '-ac', '2', str(wav)])
        print('talk', lid)


if __name__ == '__main__':
    for k, v in CLIPS.items():
        prep(k, *v)
    talk()
