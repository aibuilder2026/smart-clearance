"""SC-205: the shipped copies of the generated media, each with its .prompt.json: the Qwen keyframes as WebP in ../img/,
the LTX clips in ../media/ (their sidecars written by gen-ltx.py), the agents' and landing page's captures noted."""
import json, shutil
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent
IMG, MEDIA = HERE.parent / 'img', HERE.parent / 'media'
IMG.mkdir(exist_ok=True); MEDIA.mkdir(exist_ok=True)
style = (HERE / 'prompts' / 'STYLE.txt').read_text().strip()
seeds = {'n1-factory-line': 205001, 'n2-mango-godown': 205002, 'n3-chips-godown-dusk': 205003}
for k, seed in seeds.items():
    src = HERE / 'img' / f'{k}.png'
    if not src.exists(): continue
    im = Image.open(src).convert('RGB')
    im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS).save(IMG / f'{k}.webp', quality=88, method=6)
    (IMG / f'{k}.prompt.json').write_text(json.dumps({
        'model': 'Qwen-Image 2.1 (bf16, local)', 'seed': seed, 'aspect': '16:9', 'size': 2048, 'original': f'{im.width}x{im.height} PNG, local in src/img/',
        'prompt': (HERE / 'prompts' / f'{k}.txt').read_text().strip() + ' ' + style,
        'post': 'downscaled to 1920 wide (lanczos), WebP q88', 'cost_usd': 0}, indent=2))
for c in (HERE / 'clips').glob('*.mp4'):
    shutil.copy2(c, MEDIA / c.name)
    side = c.with_suffix('.prompt.json')
    if side.exists():
        d = json.loads(side.read_text()); d['post'] = 'retimed to its shot by src/slow.sh (motion-interpolated to 25 fps) in the cut'
        (MEDIA / side.name).write_text(json.dumps(d, indent=2))
print('sidecars written')
