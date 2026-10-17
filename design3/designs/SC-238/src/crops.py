"""SC-238: each talking keyframe cropped to a medium close-up for lip sync (a face small in frame syncs badly): the face
found by OpenCV's Haar cascade, the crop 16:9 at about 2.9 face-heights tall, the face on the third that leaves room for
the eyeline (a speaker looking left sits on the right third), scaled back to 1376 x 768 for the detail pass.
   uv run --with "opencv-python-headless<5" --with numpy python crops.py"""
import cv2, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
LOOK = {'d-dawn-call': 'l', 'l-dawn-call': 'r', 'b-approve': 'l', 'l-approve': 'r', 'k-order': 'r', 'v-dock': 'l', 's-shop': 'l',
        'w-buyer': 'l', 'o-landfill': 'r', 'd-eve-call': 'l', 'l-eve-call': 'r'}
MIRROR = {'l-dawn-call', 'l-eve-call'}   # the lead faces right on the calls, across the cut from the distributor who faces left
TIGHT = {'o-landfill': 3.4, 'k-order': 3.3}   # face-heights tall: wider where the source face is small
FACE = {'k-order': (618, 113, 118, 118), 'o-landfill': (545, 100, 115, 115)}   # the detector latched onto clutter in these two
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
prof = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
out = {}
for k, look in LOOK.items():
    p = HERE / 'img' / f'{k}.png'
    if not p.exists(): print('missing', k); continue
    im = cv2.imread(str(p)); H, W = im.shape[:2]
    if k in MIRROR: im = cv2.flip(im, 1)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    f = [FACE[k]] if k in FACE and k not in MIRROR else list(casc.detectMultiScale(g, 1.08, 5, minSize=(50, 50)))
    if not f:
        f = list(prof.detectMultiScale(g, 1.08, 4, minSize=(50, 50))) + [(W - x - w, y, w, h) for (x, y, w, h) in prof.detectMultiScale(cv2.flip(g, 1), 1.08, 4, minSize=(50, 50))]
    if not f: print('no face', k); continue
    x, y, w, h = max(f, key=lambda r: r[2] * r[3])
    ch = min(H, int(h * TIGHT.get(k, 2.9))); cw = int(ch * 16 / 9)
    if cw > W: cw = W; ch = int(cw * 9 / 16)
    fx = x + w / 2; fy = y + h / 2
    cx = fx - cw / 6 if look == 'l' else fx + cw / 6       # looking left: the face on the right third, the room on the left
    cy = fy + ch * 0.12                                     # a little headroom: the eyes near the top third
    x0 = int(min(max(cx - cw / 2, 0), W - cw)); y0 = int(min(max(cy - ch / 2, 0), H - ch))
    crop = cv2.resize(im[y0:y0 + ch, x0:x0 + cw], (1376, 768), interpolation=cv2.INTER_LANCZOS4)
    cv2.imwrite(str(HERE / 'img' / 'crop' / f'{k}.png'), crop)
    out[k] = {'face': [int(x), int(y), int(w), int(h)], 'crop': [x0, y0, cw, ch], 'scale': round(1376 / cw, 3)}
    print(k, out[k])
(HERE / 'img' / 'crop' / 'crops.json').write_text(json.dumps(out, indent=1))
