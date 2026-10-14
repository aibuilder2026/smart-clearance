"""SC-209 (cut 7): the shipped copies of the new generated media, each with its .prompt.json: the photoreal Qwen
keyframes as WebP in ../img/ (the landfill with the Mango Drink's real label printed on its cartons' stickers, as the
film shows it; the two other brands' factory lines), and the landfill's clip in ../media/ as the film uses it, composited
(landfill-comp.py), with the LTX generation it came from. Parameters are those of gen-qwen9.sh and gen-ltx9.py.
   .venv/bin/python sidecars7.py"""
import json, shutil
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
P = lambda n: (HERE / 'prompts' / f'{n}.txt').read_text().strip()
STYLE, CART = P('STYLE3'), P('CARTONS')
# key: (seed, carton text in the prompt, where it is used)   as gen-qwen9.sh (16:9, 2048)
KEYS = {
    'w1-landfill': (209001, True, "the bin (i02): the landfill at dusk, the batch's cartons tipped from a dump truck "
                                  "(the clip composited from it, landfill-comp.py), what destroying costs Munchly and the planet beside it"),
    'b2-factory-tea': (209002, False, 'the brand scene (i04): Nilgiri Foods, a tea packing line, its own workspace sliding in (2.5D from its depth map)'),
    'b3-factory-biscuits': (209003, False, 'the brand scene (i04): Kaveri Foods, a biscuit line, its own workspace sliding in (2.5D from its depth map)'),
}
LABEL = ("the Mango Drink's own label (design3/system/labels, the batch's record: batch, dates, MRP, the FSSAI licence, "
         "its EAN-13 and QR code) printed onto 22 carton stickers in perspective, each boxed by eye on a gridded crop "
         "(labels.in_box, prep-keys.py BOXES), lit and softened to the sticker's own focus")


def ship(k, seed, cart, use):
    lab = HERE / 'img' / f'{k}-L.png'
    src = lab if lab.exists() else HERE / 'img' / f'{k}.png'
    if not src.exists(): print('missing', k); return
    im = Image.open(src).convert('RGB')
    w = min(1920, im.width)
    im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    post = f'resized to {w} wide (lanczos), WebP q88'
    if lab.exists(): post = LABEL + '; then ' + post
    orig = Image.open(HERE / 'img' / f'{k}.png')
    meta = {'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'generate', 'seed': seed, 'aspect': '16:9', 'size': 2048,
            'prompt': ' '.join(x for x in (P(k), CART if cart else '', STYLE) if x),
            'original': f'{orig.width}x{orig.height} PNG, local in src/img/', 'post': post, 'in_the_film': use, 'cost_usd': 0}
    (IMG / f'{k}.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('img', k)


for k, v in KEYS.items():
    ship(k, *v)

comp, side = HERE / 'clips' / 'w1-landfill-comp.mp4', HERE / 'clips' / 'w1-landfill.prompt.json'
if comp.exists():
    shutil.copyfile(comp, MEDIA / 'w1-landfill.mp4')
    meta = json.loads(side.read_text()) if side.exists() else {}
    meta['post'] = ("LTX moved the whole heap (it slid down the slope like a river, the printed labels blooming white) and "
                    "drifted the camera, so only the part above the heap is used: the clip locked to its first frame "
                    "(stab.py, tracked on the ridge band), slowed 1.2x by motion interpolation (ffmpeg setpts=1.2*PTS, "
                    "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1), and laid over that first "
                    "frame's heap, which holds still with the labels crisp, through a 36 px feather along the heap's top "
                    "(landfill-comp.py): the kites, the smoke, the excavator and the truck tipping its load move")
    meta['in_the_film'] = ("the bin (i02), frame for frame at 25 fps under a slow push (1.0 to 1.07), with smoke drifting off "
                           "the heap; what destroying costs Munchly and the planet in two panels low either side")
    meta['cost_usd'] = 0
    (MEDIA / 'w1-landfill.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('clip w1-landfill')
