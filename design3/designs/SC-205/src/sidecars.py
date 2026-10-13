"""SC-205: the shipped copies of the generated media, each with its .prompt.json: the Qwen keyframes as WebP in ../img/,
the LTX clips in ../media/ (their sidecars written by gen-ltx.py and gen-ltx2.py)."""
import json, shutil
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
style = (HERE / 'prompts' / 'STYLE.txt').read_text().strip()
nodev = (HERE / 'prompts' / 'STYLE-nodevice.txt').read_text().strip()
EDIT_TAIL = 'Keep the same woman, her face, hair and clothes, and the same room exactly.'
# key: (seed, size, style, condition images); every keyframe the film uses
KF = {
    'n1-factory-line': (205001, 2048, style, []), 'n2-mango-godown': (205002, 2048, style, []), 'n3-chips-godown-dusk': (205003, 2048, style, []),
    'i2-hold': (205002, 2048, style, []), 'n1-neha-console': (205100, 1024, style, []), 'm1-priya-desk': (205101, 1024, style, []),
    'm4-kirana-phone': (205104, 1024, style, []), 'm6-meera-van': (205106, 1024, style, []), 'c2-agrawal-tablet': (205202, 1024, style, []),
    'c3-landfill-evidence': (205203, 1024, style, []), 'c4-landfill-sign': (205204, 1024, style, []),
    'm3-priya-approve': (205103, 1024, f'{EDIT_TAIL} {style}', ['m1-priya-desk']),
    'm7-kirana-delivery': (205107, 1024, f'{EDIT_TAIL} {style}', ['m4-kirana-phone']),
    'c5-priya-evening': (205205, 1024, f'{EDIT_TAIL} {style}', ['m1-priya-desk']),
    'm2-lakshmi-photo': (205102, 1024, style, ['n2-mango-godown']),
    'm5b-staff-upi': (205125, 1024, style, []), 'm5c-staff-upi': (205116, 1024, style, ['m5b-staff-upi', 'n2-mango-godown']),
    'c3b-landfill-evidence': (20531, 1024, style, ['c3-landfill-evidence', 'n3-chips-godown-dusk']),
    'c4b-landfill-sign': (20532, 1024, style, ['c4-landfill-sign', 'n3-chips-godown-dusk']),
    'i3-landfill': (205014, 1024, nodev, ['i3-landfill (a 2048 render, seed 205013, whose lettering this edit removed)']),
}
PROMPT = {'i3-landfill': 'i3b-landfill'}
for k, (seed, size, sty, cond) in KF.items():
    src = HERE / 'img' / f'{k}.png'
    if not src.exists(): print('missing', k); continue
    im = Image.open(src).convert('RGB')
    w = min(1920, im.width)
    im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    (IMG / f'{k}.prompt.json').write_text(json.dumps({
        'model': 'Qwen-Image 2.1 (bf16, local)', 'mode': 'edit' if cond else 'text-to-image', 'condition_images': cond,
        'seed': seed, 'aspect': '16:9', 'size': size, 'original': f'{im.width}x{im.height} PNG, local in src/img/',
        'prompt': (HERE / 'prompts' / f'{PROMPT.get(k, k)}.txt').read_text().strip() + ' ' + sty,
        'post': f'resized to {w} wide (lanczos), WebP q88', 'cost_usd': 0}, indent=2))
for c in (HERE / 'clips').glob('*.mp4'):
    shutil.copy2(c, MEDIA / c.name)
    side = c.with_suffix('.prompt.json')
    if side.exists():
        d = json.loads(side.read_text())
        d['post'] = ('in the cut: the gentle stretch kept (clipcheck.py), a person\'s clip locked to a tripod frame (stab.py), '
                     'then retimed to its shot (slow.sh, motion-interpolated to 25 fps)')
        (MEDIA / side.name).write_text(json.dumps(d, indent=2))
print('sidecars written')
