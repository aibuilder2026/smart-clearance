"""SC-219 cut 12's concept round: the board's media from the Remotion renders, into design3/designs/SC-219/round-cut12/:
each option's motion test (H.264 for the web, with its sound), a poster from it, its two stills (WebP), and the Qwen
plates it is built on (WebP, with the .prompt.json sidecars written from gen-qwen12c.sh's prompts).
  .venv/bin/python board12c.py"""
import json, subprocess
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent
R = HERE.parent / 'round-cut12'
B = HERE / 'build' / 'remo12'
OPT = {'a': ('a-motion.mp4', 7.3, ['A-still-gemini', 'A-still-yes'], ['still-gemini', 'still-yes'], ['dc-a1-pipes', 'dc-a2-aisle', 'dc-a3-tpu', 'dc-a4-cage']),
       'b': ('b-motion.mp4', 2.9, ['B-still-agents', 'B-still-yes'], ['still-agents', 'still-yes'], []),
       'c': ('c-motion.mp4', 7.4, ['C-still-gemini', 'C-still-yes'], ['still-gemini', 'still-yes'], ['dc-c1-fibre', 'dc-c2-blade', 'dc-c3-tpu', 'dc-c4-vault'])}
STYLE = (HERE / 'prompts' / 'DC.txt').read_text().strip()
SEEDS = {l.split()[1]: (int(l.split()[2]), int(l.split()[3])) for l in (HERE / 'gen-qwen12c.sh').read_text().splitlines() if l.startswith('place dc-')}
for o, (mp4, poster_t, stills, names, plates) in OPT.items():
    d = R / f'option-{o}'; d.mkdir(parents=True, exist_ok=True)
    src = B / 'out' / mp4
    if src.exists():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', str(d / 'motion.mp4')], check=True)
        tmp = B / f'_poster-{o}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(poster_t), '-i', str(src), '-frames:v', '1', str(tmp)], check=True)
        Image.open(tmp).convert('RGB').save(d / 'poster.webp', quality=84); tmp.unlink()
        print(o, 'motion', round((d / 'motion.mp4').stat().st_size / 1e6, 1), 'MB')
    for s, n in zip(stills, names):
        p = B / f'{s}.jpg'
        if p.exists(): Image.open(p).convert('RGB').save(d / f'{n}.webp', quality=86)
    for k in plates:
        p = HERE / 'img' / f'{k}.png'
        if not p.exists(): continue
        Image.open(p).convert('RGB').save(d / f'{k}.webp', quality=86)
        seed, size = SEEDS.get(k, (None, None))
        (d / f'{k}.prompt.json').write_text(json.dumps({'model': 'Qwen-Image 2.1 bf16 (local)', 'seed': seed, 'size': size, 'aspect': '16:9',
            'prompt': (HERE / 'prompts' / f'{k}.txt').read_text().strip() + ' ' + STYLE, 'post': 'saved as WebP q86 from the PNG original (src/img/, local)'}, indent=2))
print('board media written')
