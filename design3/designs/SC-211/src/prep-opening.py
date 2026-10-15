"""SC-206: the opening's two stills at their full 2752 x 1536, with the Mango Drink's real label printed on their
stickers: the carton macro (its one big sticker; the label's layout-to-image map saved for the rings,
build/labels/o1b.json) and the godown stack (the stickers picked by eye on build/_cand-o1-godown-stack.jpg).
   .venv/bin/python prep-opening.py [o1b|o1] [picks…]"""
import json, sys
from pathlib import Path
import cv2, numpy as np
import labels

HERE = Path(__file__).resolve().parent
which = sys.argv[1]
if which == 'o1b':
    im = cv2.imread(str(HERE / 'img' / 'o1b-carton-macro.png'))
    cs = labels.show_candidates(im, HERE / 'build' / '_cand-o1b-carton-macro.jpg')
    side = max(cs, key=lambda c: c[1])[0]        # the next carton's sticker, standing upright
    q = labels.in_box(im, (1000, 480, 1690, 1020))   # the macro's own big sticker, square to the camera
    out = labels.print_label(labels.print_label(im, q, 'mango', blur=0.4), side, 'mango')
    cv2.imwrite(str(HERE / 'img' / 'o1b-carton-macro-L.png'), out)
    Hm = labels.label_map(q)
    (HERE / 'build' / 'labels' / 'o1b.json').write_text(json.dumps({'quad': np.round(q, 2).tolist(), 'H': Hm.tolist()}))
    print('o1b: sticker', np.round(q).tolist())
else:
    im = cv2.imread(str(HERE / 'img' / 'o1-godown-stack.png'))
    cs = labels.show_candidates(im, HERE / 'build' / '_cand-o1-godown-stack.jpg')
    picks = [int(x) for x in sys.argv[2:]]
    if not picks: print(len(cs), 'candidates: pick them on build/_cand-o1-godown-stack.jpg'); raise SystemExit
    out = im
    for i in picks: out = labels.print_label(out, cs[i][0], 'mango')
    cv2.imwrite(str(HERE / 'img' / 'o1-godown-stack-L.png'), out)
    print('o1:', len(picks), 'labels')
