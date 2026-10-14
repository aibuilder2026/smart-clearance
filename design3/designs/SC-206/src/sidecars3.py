"""SC-206 (cut 3): the shipped copies of the generated media, each with its .prompt.json: the Qwen keyframes the film
uses as WebP in ../img/ (where a batch's real label was printed on the cartons, the labelled frame, as the film shows
it), the LTX clips in ../media/ (their sidecars written by gen-ltx.py, the use in the cut added). Parameters are those
of gen-qwen.sh and gen-qwen2.sh; the cast sheets are SC-154's, SC-158's and SC-187's.   .venv/bin/python sidecars3.py"""
import json, shutil
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
P = lambda n: (HERE / 'prompts' / f'{n}.txt').read_text().strip()
STYLE, ID, CART, OFF = P('STYLE3'), P('ID'), P('CARTONS'), P('OFFICE')
CAST = {'neha': 'SC-158/img/cast-neha.webp', 'priya': 'SC-154/img/cast-planner.webp', 'lakshmi': 'SC-158/img/cast-lakshmi.webp',
        'kirana': 'SC-154/img/cast-kirana.webp', 'meera': 'SC-158/img/cast-meera.webp', 'rakesh': 'SC-154/img/cast-distributor.webp',
        'agrawal': 'SC-187/img/cast-agrawal.webp'}
# key: (cast, seed, the setting's words)   as gen-qwen.sh; f-kirana retaken in gen-qwen2.sh (its first take held the
# phone's screen to the camera: img/rejected/)
PEOPLE = {
    's-priya': ('priya', 206301, OFF), 'f-priya': ('priya', 206302, OFF), 's-lakshmi-label': ('lakshmi', 206303, CART),
    'f-lakshmi': ('lakshmi', 206304, CART), 's-kirana': ('kirana', 206305, ''), 'f-kirana': ('kirana', 206406, ''),
    's-neha': ('neha', 206307, OFF), 'f-neha': ('neha', 206308, OFF), 's-rakesh': ('rakesh', 206309, CART),
    'f-rakesh': ('rakesh', 206310, CART), 's-agrawal': ('agrawal', 206311, CART), 'f-agrawal': ('agrawal', 206312, CART),
    's-meera': ('meera', 206313, CART), 'f-meera': ('meera', 206314, CART), 's-upi': ('lakshmi', 206315, CART),
    's-landfill-photo': ('rakesh', 206316, ''), 's-landfill-sign': ('rakesh', 206317, ''), 's-priya-eve': ('priya', 206318, OFF),
}
PLACES = {'o1b-carton-macro': 206012, 'o1-godown-stack': 206011}
# faces the film moves through in 2.5D (parts3.StillFace: Still25D on depth.py's map) instead of a clip, since no clip
# held: LTX turned Agrawal's phone to the camera (two takes) and had Neha look into the lens (two takes)
STILL = {'f-agrawal': 'the face shot, the keyframe moved through in 2.5D (StillFace), as both LTX takes turned the phone to the camera',
         'f-neha': 'the face shot, the keyframe moved through in 2.5D (StillFace), as both LTX takes had her look into the lens'}
LABEL = ("the Mango Drink's or the Masala Chips' own label (design3/system/labels, the batch's record: batch, dates, MRP, "
         "the FSSAI licence, its EAN-13 and QR code) printed onto each carton's blank sticker in perspective, lit and "
         "softened to the sticker's own focus (labels.py, prep-keys.py / prep-opening.py); every code read back")


def ship(k, meta):
    lab = HERE / 'img' / f'{k}-L.png'
    src = lab if lab.exists() else HERE / 'img' / f'{k}.png'
    if not src.exists(): print('missing', k); return
    im = Image.open(src).convert('RGB')
    w = min(1920, im.width)
    im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    post = f'resized to {w} wide (lanczos), WebP q88'
    if lab.exists(): post = LABEL + '; then ' + post
    meta.update({'original': f'{im.width}x{im.height} PNG, local in src/img/', 'post': post, 'cost_usd': 0})
    if k in STILL: meta['in_the_film'] = STILL[k]
    (IMG / f'{k}.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))


for k, (who, seed, setting) in PEOPLE.items():
    ship(k, {'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'edit',
             'condition_images': [f'design3/designs/{CAST[who]} (the cast sheet the app\'s portrait was cut from, SC-194)'],
             'seed': seed, 'size': 1024, 'prompt': ' '.join(x for x in (ID, P(k), setting, STYLE) if x)})
for k, seed in PLACES.items():
    ship(k, {'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'text-to-image', 'condition_images': [], 'seed': seed,
             'aspect': '16:9', 'size': 2048, 'prompt': ' '.join((P(k), CART, STYLE))})

USED = json.loads((HERE / 'build' / 'clips-used.json').read_text()) if (HERE / 'build' / 'clips-used.json').exists() else None
for c in sorted((HERE / 'clips').glob('*.mp4')):
    if USED is not None and c.stem not in USED: continue
    shutil.copy2(c, MEDIA / c.name)
    side = c.with_suffix('.prompt.json')
    if side.exists():
        d = json.loads(side.read_text())
        d['post'] = (("the face shot: played at its own speed from its first frame until the whip pan" if c.stem.startswith('f-') else
                      "over the shoulder: played at its own speed from its first frame, the live app set into its screen frame "
                      "by frame (track3.py follows the screen; vfx.insert keeps any finger over it), until the device comes "
                      "into focus") + "; measured steady first (clipcheck.py), with no one-frame flash (deflash.py)")
        (MEDIA / side.name).write_text(json.dumps(d, indent=2, ensure_ascii=False))
print('sidecars written')
