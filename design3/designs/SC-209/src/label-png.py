"""SC-206: the story's two carton labels, flat and sharp, from the label maker's own HTML (design3/system/labels,
SC-147): the Mango Drink's (MF-2410-118) and the Masala Chips' (MF-2409-117). label-png.mjs renders each at 4x and
reads every code back.   uv run -q --with segno python label-png.py"""
import json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
LABELS = HERE.parents[2] / 'system' / 'labels'
sys.path.insert(0, str(LABELS))
import label  # noqa: E402
OUT = HERE / 'build' / 'labels'
OUT.mkdir(parents=True, exist_ok=True)
SPECS = {'MF-2410-118': {'sku': 'mango', 'batch': 'MF-2410-118', 'mfg': '2026-04-27', 'bestBefore': '2026-10-24', 'mrp': 20},
         'MF-2409-117': {'sku': 'chips', 'batch': 'MF-2409-117', 'mfg': '2026-05-18', 'bestBefore': '2026-11-18', 'mrp': 30}}
jobs = []
for ref, s in SPECS.items():
    spec = {**s, 'w': 860, 'h': 640, 'pad': 0}
    (OUT / f'{ref}.html').write_text(label.build(spec))
    jobs.append({'html': str(OUT / f'{ref}.html'), 'png': str(OUT / f'{ref}.png'), 'w': 860, 'h': 640, 'expect': label.expect(spec)})
(OUT / 'jobs.json').write_text(json.dumps(jobs, indent=1))
print(json.dumps(jobs, indent=1))
