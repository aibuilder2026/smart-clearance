"""SC-205: each person's face cut from their keyframe, for every name tag in the film (so a tag always shows the
person the film shows). Each box placed by hand on the gridded keyframe.
  faces.py [--sheet out.jpg]"""
import sys, cv2, numpy as np
from pathlib import Path
HERE = Path(__file__).resolve().parent
WHO = {'priya': 'm1-priya-desk', 'lakshmi': 'n2-mango-godown', 'rakesh': 'n3-chips-godown-dusk', 'neha': 'n1-neha-console',
       'lakshmi-ganapathi': 'm4-kirana-phone', 'agrawal': 'c2-agrawal-tablet', 'meera': 'm6-meera-van'}
HAND = {'priya': (765, 105, 205), 'lakshmi': (1215, 440, 280), 'rakesh': (2160, 520, 300), 'neha': (715, 85, 210),
        'lakshmi-ganapathi': (625, 125, 200), 'agrawal': (350, 95, 220), 'meera': (425, 140, 190)}  # who: (x, y, size) in keyframe pixels
out = []
for who, kf in WHO.items():
    im = cv2.imread(str(HERE / 'img' / f'{kf}.png'))
    if im is None: print('missing', kf); continue
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    x, y, s = HAND[who]
    x, y = max(0, x), max(0, y)
    crop = im[y:y + s, x:x + s]
    crop = cv2.resize(crop, (256, 256), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(HERE / 'build' / 'faces' / f'{who}.png'), crop)
    out.append(crop); print(who, (x, y, s))
if '--sheet' in sys.argv and out:
    cv2.imwrite(sys.argv[sys.argv.index('--sheet') + 1], np.hstack(out))
