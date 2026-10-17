"""SC-238: the story's two batches' labels printed flat, as the label maker prints them, for the 3D carton and the
film's inserts (build/label/flat-<batch>-<w>x<h>.png, and agents3d/label.webp: the mango's, at the carton face's shape).

   python3 flat-label.py"""
import json, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
LABELS = HERE.parents[2] / 'system' / 'labels'
OUT = HERE / 'build' / 'label'
UV = ['uv', 'run', '-q', '--with', 'segno', 'python']
# the story's two batches as their records have them (backend-api reference journey.json, skus), as SC-210's relabel.py
BATCH = {'chips': {'sku': 'chips', 'batch': 'MF-2409-117', 'mfg': '2026-05-18', 'bestBefore': '2026-11-18', 'mrp': 30},
         'mango': {'sku': 'mango', 'batch': 'MF-2410-118', 'mfg': '2026-04-27', 'bestBefore': '2026-10-24', 'mrp': 20}}


def flat(batch, aspect):
    OUT.mkdir(parents=True, exist_ok=True)
    h = 612 if aspect >= 1.6 else 640
    w = int(round(h * aspect))
    if w < 880: w, h = 880, int(round(880 / aspect))
    key = f'{batch}-{w}x{h}'
    png = OUT / f'flat-{key}.png'
    if not png.exists():
        spec = {**BATCH[batch], 'w': w, 'h': h, 'pad': 22}
        sp, html = OUT / f'flat-{key}.json', OUT / f'flat-{key}.html'
        sp.write_text(json.dumps(spec))
        subprocess.run([*UV, str(LABELS / 'label.py'), str(sp), str(html)], check=True)
        jobs = OUT / f'flat-{key}-jobs.json'
        jobs.write_text(json.dumps([{'html': str(html), 'png': str(png), 'w': w, 'h': h}]))
        subprocess.run(['node', str(HERE / 'flat-label.mjs'), str(jobs)], check=True)
    return png


if __name__ == '__main__':
    m = flat('mango', 0.95 / 0.66)
    subprocess.run(['cwebp', '-quiet', '-q', '92', str(m), '-o', str(HERE / 'agents3d' / 'label.webp')], check=True)
    for b in BATCH: print(flat(b, 1.5))
