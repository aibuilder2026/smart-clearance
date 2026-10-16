"""SC-219 (cuts 10 and 11): their scene pages show cut 9's photographs, so they are copied from the pages prep9.py writes.
  .venv/bin/python prep9.py && .venv/bin/python prep10.py
- saas10/: saas9's godown and the three tiers' photographs;
- arch10/ and arch11/ (cut 11's architecture in 2D): arch9's app screens, the Approve sheet and the label photo;
- cast10/: cast9's portraits, the bay at dawn behind and the two packs, with saas9's packing line for the brand's card.
The copies are not kept in git; each is byte for byte its cut 9 original."""
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
COPY = {'saas10': ['saas9/bg.webp', 'saas9/card-brand.webp', 'saas9/card-dist.webp', 'saas9/card-ret.webp'],
        'arch10': [f'arch9/{n}.webp' for n in ['app-approve', 'app-console', 'app-demo', 'app-landing', 'app-workspace', 'label-photo']],
        'arch11': [f'arch9/{n}.webp' for n in ['app-approve', 'app-console', 'app-demo', 'app-landing', 'app-workspace', 'label-photo']],
        'cast10': ['cast9/bg.webp', 'saas9/card-brand.webp', 'cast9/pack-chips.webp', 'cast9/pack-mango.webp'] +
                  [f'cast9/p-{n}.webp' for n in ['agency', 'agrawal', 'ganesh', 'lakshmi-ganapathi', 'lakshmi', 'meera', 'neha', 'priya', 'rakesh', 'staff']]}

for dst, srcs in COPY.items():
    for rel in srcs:
        src = HERE / rel
        shutil.copyfile(src, HERE / dst / src.name)
        print(f'{rel:28} -> {dst}/{src.name}')
