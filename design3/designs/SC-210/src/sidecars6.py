"""SC-208 (cut 6): the shipped copies of the new generated media, each with its .prompt.json: the photoreal Qwen
keyframes as WebP in ../img/ (where a batch's real label was printed on the cartons, the labelled frame, as the film
shows it), the LTX clips in ../media/ (their sidecars written by gen-ltx6.py, the use in the cut added). Parameters are
those of gen-qwen6.sh; Agrawal's cast sheet is SC-187's. The clay-illustration first try (prompts/rejected/) was never
used: the maintainer asked for "realistic photos and videos, not cartoon".   .venv/bin/python sidecars6.py"""
import json, shutil
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
P = lambda n: (HERE / 'prompts' / f'{n}.txt').read_text().strip()
STYLE, ID, CART = P('STYLE3'), P('ID'), P('CARTONS')
# key: (seed, aspect, size, cast sheet or None, where it is used)   as gen-qwen6.sh
KEYS = {
    'dl-kirana': (208201, '16:9', 2048, None, "the deliveries: Rakesh Traders' van round at a Nagpur kirana (an LTX clip from it)"),
    'dl-truck': (208202, '16:9', 1024, 'SC-187/img/cast-agrawal.webp', "the deliveries: Agrawal Wholesale's truck loading the lot (an LTX clip from it)"),
    'fs-whatsapp': (208211, '16:9', 2048, None, "what comes next: WhatsApp, a shopkeeper reading his phone (an LTX clip from it)"),
    'fs-native': (208212, '16:9', 2048, None, "what comes next: native iOS and Android apps, the app set into the two phones' screens"),
    'fs-lang-ta': (208213, '1:1', 1024, None, 'what comes next: more Indian languages, a Tamil shopkeeper (a round portrait)'),
    'fs-lang-bn': (208214, '1:1', 1024, None, 'what comes next: more Indian languages, a Bengali shopkeeper (a round portrait)'),
    'fs-lang-gu': (208215, '1:1', 1024, None, 'what comes next: more Indian languages, a Gujarati shopkeeper (a round portrait)'),
}
LABEL = ("the Mango Drink's or the Masala Chips' own label (design3/system/labels, the batch's record: batch, dates, MRP, "
         "the FSSAI licence, its EAN-13 and QR code) printed onto each carton's blank sticker in perspective, lit and "
         "softened to the sticker's own focus (labels.py, prep-keys.py; on a shop's taller stickers kept the right way "
         "up, centred on the sticker's white)")
NATIVE = ("the two phones' blank screens found (vfx.screen_quad) and the live workspace set into them from the Mango "
          "Drink's production recording: the kirana's offer in Hindi (245.5 s) and the order placed (249.6 s)")
CLIPS = {
    'dl-kirana': "the deliveries (v01), its first part: the van's carton handed over the counter, frame for frame at 25 fps",
    'dl-truck': "the deliveries (v01), its second part: the lot loaded into the buyer's truck, frame for frame at 25 fps",
    'fs-whatsapp': 'what comes next (f01): the WhatsApp card, with the offer and the reply as chat bubbles over it',
}


def ship(k, seed, aspect, size, cast, use):
    lab = HERE / 'img' / f'{k}-L.png'
    src = lab if lab.exists() else HERE / 'img' / f'{k}.png'
    if not src.exists(): print('missing', k); return
    im = Image.open(src).convert('RGB')
    w = min(1920, im.width)
    im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    post = f'resized to {w} wide (lanczos), WebP q88'
    if lab.exists(): post = LABEL + '; then ' + post
    meta = {'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'edit' if cast else 'generate', 'seed': seed, 'aspect': aspect,
            'size': size}
    if cast:
        meta['condition_images'] = [f'design3/designs/{cast} (the cast sheet the app\'s portrait was cut from, SC-194)']
        meta['prompt'] = ' '.join(x for x in (ID, P(k), CART, STYLE) if x)
    else:
        meta['prompt'] = ' '.join(x for x in (P(k), CART, STYLE) if x)
    meta.update({'original': f'{Image.open(HERE / "img" / f"{k}.png").width}x{Image.open(HERE / "img" / f"{k}.png").height} PNG, local in src/img/',
                 'post': post, 'in_the_film': use + (f'; {NATIVE}' if k == 'fs-native' else ''), 'cost_usd': 0})
    (IMG / f'{k}.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('img', k)


for k, v in KEYS.items():
    ship(k, *v)
for k, use in CLIPS.items():
    clip = HERE / 'clips' / f'{k}.mp4'
    side = clip.with_suffix('.prompt.json')
    if not clip.exists(): print('missing clip', k); continue
    shutil.copyfile(clip, MEDIA / f'{k}.mp4')
    meta = json.loads(side.read_text()) if side.exists() else {}
    meta['in_the_film'] = use
    meta['cost_usd'] = 0
    (MEDIA / f'{k}.prompt.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print('clip', k)
