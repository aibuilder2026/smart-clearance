"""SC-211: a .prompt.json beside every image this film made (the talking scenes' keyframes, Qwen-Image 2.1 on this Mac;
the biscuit factory's tablet screen, painted by tablet11.py), and the keyframes the film uses as WebP with their sidecars
in ../media/keyframes/ (the PNG originals stay local). The talking clips' sidecars are gen-ltx11.py's own.
   .venv/bin/python sidecars11.py"""
import json, re
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'media' / 'keyframes'
MODEL = 'Qwen-Image 2.1 (bf16, local, qwen-image-bf16 plugin 0.2.0)'


def jobs():
    """each keyframe's job, read from the scripts that made it: (key, source or None, seed, prompt file)"""
    out = {}
    for sh in ('gen-qwen11.sh', 'gen-qwen11b.sh'):
        for m in re.finditer(r'^(edit|make) (\S+) (\S+)(?: (\S+))?(?: (\S+))?$', (HERE / sh).read_text(), re.M):
            kind, k = m.group(1), m.group(2)
            if kind == 'make':
                out[k] = dict(mode='generate', source=None, seed=int(m.group(3)), prompt_file=f'prompts/talk11/{k}.txt', style='prompts/STYLE3.txt', script=sh)
            else:
                src = m.group(3)
                src = src if '/' in src else f'img/{src}.png'
                out[k] = dict(mode='edit', source=src, seed=int(m.group(4)), prompt_file=f"prompts/talk11/{m.group(5) or k}.txt", script=sh)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    used = {l['clip'].replace('-b', '').replace('-c', '') for l in json.loads((HERE / 'lines.json').read_text())['lines'] if l.get('kind') == 'talk'}
    images = {j['image'].split('/')[-1][:-4]: j['name'] for f in ('ltx-talk.json', 'ltx-retake.json') if (HERE / f).exists()
              for j in json.loads((HERE / f).read_text())}
    for k, j in jobs().items():
        p = HERE / 'img11' / f'{k}.png'
        if not p.exists(): continue
        prompt = (HERE / j['prompt_file']).read_text().strip()
        if j.get('style'): prompt += ' ' + (HERE / j['style']).read_text().strip()
        im = Image.open(p)
        side = {'model': MODEL, 'mode': j['mode'], 'source': j['source'], 'seed': j['seed'], 'size': 1024, 'output': list(im.size),
                'prompt': prompt, 'script': j['script'], 'cost_usd': 0,
                'use': f"SC-211: the keyframe LTX animates for {images[k]}" if k in images else 'SC-211: an intermediate (another edit starts from it)'}
        if k == 't3-shopkeeper-crop': side.update(mode='crop', post='a 786 x 442 crop of t3-shopkeeper.png around the shopkeeper, lanczos to 1376 x 774')
        p.with_suffix('.prompt.json').write_text(json.dumps(side, indent=1))
        if k in images:
            im.convert('RGB').save(OUT / f'{k}.webp', quality=90, method=6)
            (OUT / f'{k}.prompt.json').write_text(json.dumps({**side, 'shipped': 'WebP q90; the PNG stays in src/img11/'}, indent=1))
    crop = HERE / 'img11' / 't3-shopkeeper-crop.png'
    if crop.exists():
        crop.with_suffix('.prompt.json').write_text(json.dumps({'derived_from': 'img11/t3-shopkeeper.png', 'post': 'a 786 x 442 crop around the shopkeeper, lanczos to 1376 x 774, so his face is large enough for a talking clip at 720p', 'cost_usd': 0}, indent=1))
    tab = HERE / 'img' / 'b3-factory-biscuits-L.png'
    if tab.exists():
        side = {'derived_from': 'img/b3-factory-biscuits.png', 'model': 'none (drawn)', 'post': "tablet11.py: the tablet's blank white screen painted with the brand's workspace watchlist (generic: three batches, their days to the date), only over the screen's own white pixels so the gloved finger stays in front", 'cost_usd': 0, 'use': 'SC-211: the brands scene and the weeks montage'}
        tab.with_suffix('.prompt.json').write_text(json.dumps(side, indent=1))
        Image.open(tab).convert('RGB').save(OUT / 'b3-factory-biscuits-L.webp', quality=90, method=6)
        (OUT / 'b3-factory-biscuits-L.prompt.json').write_text(json.dumps({**side, 'shipped': 'WebP q90'}, indent=1))
    print(sorted(p.name for p in OUT.iterdir()))


if __name__ == '__main__':
    main()
