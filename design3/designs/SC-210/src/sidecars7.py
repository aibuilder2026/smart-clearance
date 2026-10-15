"""SC-209 (cut 7): the shipped copies of the new generated media, each with its .prompt.json: the photoreal Qwen
keyframes as WebP in ../img/ (the two other brands' factory lines; the bin's background, the pick of three concepts, with
the two not picked kept as the record of the choice), and the bin's clip in ../media/ as the film uses it, with the LTX
generation it came from. Parameters are those of gen-qwen9.sh, gen-qwen9c.sh and gen-ltx9.py.
   .venv/bin/python sidecars7.py"""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
P = lambda n: (HERE / 'prompts' / f'{n}.txt').read_text().strip()
STYLE, CART = P('STYLE3'), P('CARTONS')
# key: (seed, carton text in the prompt, size, the PNG, where it is used)   as gen-qwen9.sh and gen-qwen9c.sh (16:9)
KEYS = {
    'b2-factory-tea': (209002, False, 2048, 'b2-factory-tea.png',
                       'the brand scene (i04): Nilgiri Foods, a tea packing line, its own workspace sliding in (2.5D from its depth map)'),
    'b3-factory-biscuits': (209003, False, 2048, 'b3-factory-biscuits.png',
                            'the brand scene (i04): Kaveri Foods, a biscuit line, its own workspace sliding in (2.5D from its depth map)'),
    'w2-aerial': (209011, True, 1024, 'w2-aerial-p.png',
                  "the bin (i02): the maintainer's pick (A) of three concepts for a background \"unique and aesthetic\" in place "
                  "of the landfill; its clip, the drone slowly descending over the trail, is made from this preview as picked"),
    'w2-burial': (209012, True, 1024, 'w2-burial-p.png', 'a concept for the bin (B, one carton half buried in light), not picked'),
    'w2-rows': (209013, False, 1024, 'w2-rows-p.png', 'a concept for the bin (C, the packs in rows on cracked earth), not picked'),
}


def ship(k, seed, cart, size, png, use):
    src = HERE / 'img' / png
    if not src.exists(): print('missing', k); return
    im = Image.open(src).convert('RGB')
    w = min(1920, im.width)
    im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    meta = {'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'generate', 'seed': seed, 'aspect': '16:9', 'size': size,
            'prompt': ' '.join(x for x in (P(k), CART if cart else '', STYLE) if x),
            'original': f'{im.width}x{im.height} PNG, local in src/img/', 'post': f'resized to {w} wide (lanczos), WebP q88' if w != im.width else 'WebP q88',
            'in_the_film': use, 'cost_usd': 0}
    (IMG / f'{k}.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('img', k)


for k, v in KEYS.items():
    ship(k, *v)

slow = HERE / 'clips' / 'w2-aerial-slow.mp4'
clip, side = (slow if slow.exists() else HERE / 'clips' / 'w2-aerial.mp4'), HERE / 'clips' / 'w2-aerial.prompt.json'
if clip.exists():
    import subprocess   # the shipped copy at crf 18 (the working one is crf 10)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(clip), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(MEDIA / 'w2-aerial.mp4')], check=True)
    meta = json.loads(side.read_text()) if side.exists() else {}
    meta['image'] = 'w2-aerial-p.png (the preview as picked)'
    if clip == slow:
        meta['post'] = ('eased 1.3x by motion interpolation (ffmpeg setpts=1.3*PTS, minterpolate=fps=24:mi_mode=mci:'
                        'mc_mode=aobmc:me_mode=bidir:vsbmc=1), so the descent is gentler; played frame for frame at 25 fps; '
                        'shipped at crf 18')
    else:
        meta['post'] = 'played frame for frame at 25 fps'
    meta['in_the_film'] = ("the bin (i02), with no push of its own; what destroying costs Munchly and the planet in two "
                           "panels on the bare earth either side of the trail")
    meta['cost_usd'] = 0
    (MEDIA / 'w2-aerial.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('clip w2-aerial')
