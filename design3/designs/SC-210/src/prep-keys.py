"""SC-206: the keyframes LTX animates, at 1920 x 1080 with the batch's real label printed on every carton sticker
(labels.py): img/<key>-L.png. The Hyderabad scenes carry the Mango Drink's label, the Nagpur ones the Masala Chips'.
   .venv/bin/python prep-keys.py [keys…]"""
import sys
from pathlib import Path
import cv2
import numpy as np
import labels

HERE = Path(__file__).resolve().parent
WHICH = {'f-lakshmi': 'mango', 's-lakshmi-label': 'mango', 's-upi': 'mango', 'f-meera': 'mango', 's-meera': 'mango',
         'f-rakesh': 'chips', 's-rakesh': 'chips', 'f-agrawal': 'chips', 's-agrawal': 'chips', 's-landfill-photo': 'chips',
         'o1-godown-stack': 'mango', 'o1b-carton-macro': 'mango',
         'dl-kirana': 'chips', 'dl-truck': 'chips', 'fs-whatsapp': 'mango', 'fs-native': 'mango',
         'w1-landfill': 'mango'}   # cut 7: the batch's cartons tipped at the landfill   # cut 6: Rakesh's van at a Nagpur kirana, Agrawal's truck at Raipur
# which of labels.candidates() are real stickers, picked by eye on the numbered overlays (build/_cand-<key>.jpg), and
# hand-drawn boxes for stickers the candidates missed (labels.in_box finds the sticker inside)
PICK = {'f-lakshmi': [1, 2, 5, 9, 10, 11, 12, 21, 22, 25, 27], 'f-rakesh': [3, 4, 6, 7, 8, 10],
        'f-agrawal': [7, 8, 9, 10, 11, 12, 14, 22], 's-lakshmi-label': [0, 1, 2, 3], 's-rakesh': [1, 2, 3], 's-agrawal': [6, 7, 8],
        'f-meera': [11, 14, 15, 16], 's-meera': [4, 6], 's-upi': [4, 11, 12, 13],
        'dl-kirana': [1], 'dl-truck': [6, 7, 10, 11, 12, 13, 15, 16, 17, 18],
        'fs-whatsapp': [11, 16, 17, 18, 19, 20, 21, 22, 23, 24], 'fs-native': [], 'w1-landfill': []}
BOXES = {'s-lakshmi-label': [(1250, 590, 1470, 820)],
         # cut 7: the landfill's cartons, each sticker boxed by eye on a gridded crop (the candidates found few of them)
         'w1-landfill': [(621, 869, 698, 926), (814, 967, 893, 1028), (933, 652, 988, 700), (542, 747, 605, 790),
                         (638, 695, 682, 740), (1182, 744, 1263, 810), (1349, 877, 1420, 930), (1042, 812, 1105, 865),
                         (1308, 662, 1352, 710), (1222, 577, 1270, 620), (1220, 612, 1283, 650), (1034, 632, 1085, 665),
                         (1074, 519, 1130, 558), (1022, 714, 1080, 745), (802, 745, 848, 800), (1000, 745, 1047, 812),
                         (1092, 615, 1130, 652), (1082, 898, 1148, 942), (962, 696, 1006, 745), (252, 948, 300, 988),
                         (284, 963, 330, 999), (402, 936, 446, 968)],
         'fs-whatsapp': [(1798, 712, 1868, 788)],
         'dl-truck': [(1188, 398, 1240, 450), (1181, 503, 1232, 552), (1196, 603, 1247, 654), (1278, 603, 1330, 654)]}
UPRIGHT = {'fs-whatsapp', 'fs-native'}   # a shop's cartons: their labels the right way up on the taller stickers
# a sticker in_box reads wrong (its edge lost against the dark cargo), given by its corners
QUADS = {'dl-truck': [[(1284, 521), (1320, 520), (1320, 555), (1284, 556)]],
         'fs-native': [[(88, 600), (416, 606), (414, 904), (88, 882)], [(1450, 601), (1694, 610), (1698, 934), (1452, 902)]]}
for k in (sys.argv[1:] or WHICH):
    src = HERE / 'img' / f'{k}.png'
    if not src.exists(): print('waiting', k); continue
    im = cv2.imread(str(src))
    if im.shape[1] != 1920: im = cv2.resize(im, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)
    cs = labels.show_candidates(im, HERE / 'build' / f'_cand-{k}.jpg')
    if k not in PICK: print('pick stickers for', k, '(see build/_cand)', len(cs)); continue
    quads = [cs[i][0] for i in PICK[k]] + [q for q in (labels.in_box(im, b) for b in BOXES.get(k, [])) if q is not None] + [np.float32(q) for q in QUADS.get(k, [])]
    out = im
    for q in quads: out = labels.print_label(out, q, WHICH[k], upright=k in UPRIGHT)
    print(k, len(quads), "labels", WHICH[k])
    cv2.imwrite(str(HERE / 'img' / f'{k}-L.png'), out)
