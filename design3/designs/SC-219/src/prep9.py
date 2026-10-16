"""SC-219 (cut 9): the photographs cut 9's scene pages show, cut from their sources and written beside each page as WebP.
  .venv/bin/python prep9.py
- saas9/: the godown behind, and the supply chain's three tiers (the packing line, a distributor's counter from SC-154's
  hero film, a delivery at a kirana's counter);
- cast9/: the people's portraits (design3/system/img/people), the godown's staff and the agency's officer from their
  scenes, the hero film's bay at dawn behind, the two packs;
- arch9/: the apps' own screens from the production recordings of 13 Oct and the guided demo's route map, the plan's
  Approve sheet, and the Mango Drink's label photo.
The keyframes are read from img/ (their PNG originals, kept local), else from the WebP an earlier cut shipped with its
sidecar, brought back to the original's size. The recordings are read from the main checkout (kit.REC)."""
import shutil
from pathlib import Path
import cv2
from PIL import Image
from kit import REC

HERE = Path(__file__).resolve().parent
D3 = HERE.parents[2]
FILM = D3 / 'site' / 'assets' / 'media' / 'one-journey.mp4'
# each keyframe's original size, and the cut that shipped it as WebP with its sidecar
KEYS = {'n1-factory-line': ((2752, 1536), 'SC-205'), 'o0-godown-aisle': ((2752, 1536), 'SC-206'),
        's-upi': ((1376, 768), 'SC-206'), 's-landfill-sign': ((1376, 768), 'SC-206'), 'dl-kirana': ((2752, 1536), 'SC-208')}
DEV = {'P': (40, 182, 1078, 746), 'A': (40, 182, 1928, 1202)}   # Priya's tablet and the laptop on the 2560 x 1440 stage


def keyframe(name):
    png = HERE / 'img' / f'{name}.png'
    if png.exists():
        return Image.open(png).convert('RGB')
    size, cut = KEYS[name]
    return Image.open(D3 / 'designs' / cut / 'img' / f'{name}.webp').convert('RGB').resize(size, Image.LANCZOS)


def crop(im, cx, cy, w, h, size):
    W, H = im.size
    x0, y0 = max(0, min(W - w, int(cx - w / 2))), max(0, min(H - h, int(cy - h / 2)))
    return im.crop((x0, y0, x0 + w, y0 + h)).resize(size, Image.LANCZOS)


def frame(video, t):
    cap = cv2.VideoCapture(str(video))
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, f = cap.read()
    assert ok, (video, t)
    return f


def screen(rec, dev, t, w):
    """a device's screen in a recording at t, at w pixels wide"""
    x, y, ww, hh = DEV[dev]
    f = frame(REC[rec], t)[y:y + hh, x:x + ww]
    f = cv2.resize(f, (w, int(w * f.shape[0] / f.shape[1])), interpolation=cv2.INTER_AREA)
    return Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))


def save(im, rel, q=92):
    p = HERE / rel
    im.save(p, 'WEBP', quality=q, method=6)
    print(f'{rel:24} {im.size[0]:5} x {im.size[1]:<5} {p.stat().st_size // 1024:5} kB')


# what it is
save(keyframe('o0-godown-aisle').resize((1920, 1080), Image.LANCZOS), 'saas9/bg.webp', 90)
save(crop(keyframe('n1-factory-line'), 1900, 800, 1500, 1356, (1040, 940)), 'saas9/card-brand.webp')
dist = Image.fromarray(cv2.cvtColor(frame(FILM, 6.3), cv2.COLOR_BGR2RGB))
save(crop(dist, 1180, 560, 1060, 960, (1040, 940)), 'saas9/card-dist.webp')
save(crop(keyframe('dl-kirana'), 1450, 768, 1699, 1536, (1040, 940)), 'saas9/card-ret.webp')

# the cast
for n in ['priya', 'lakshmi', 'lakshmi-ganapathi', 'meera', 'rakesh', 'ganesh', 'agrawal', 'neha']:
    save(Image.open(D3 / 'system' / 'img' / 'people' / f'p-{n}.webp').convert('RGB'), f'cast9/p-{n}.webp', 94)
save(crop(keyframe('s-upi'), 560, 384, 760, 760, (512, 512)), 'cast9/p-staff.webp')
save(crop(keyframe('s-landfill-sign'), 1000, 430, 700, 700, (512, 512)), 'cast9/p-agency.webp')
save(Image.fromarray(cv2.cvtColor(frame(FILM, 1.2), cv2.COLOR_BGR2RGB)), 'cast9/bg.webp', 90)
for n in ['mango', 'chips']:
    shutil.copy(D3 / 'system' / 'img' / f'pack-{n}.webp', HERE / 'cast9' / f'pack-{n}.webp')

# the architecture: each app's own screen, the Approve sheet, the label photo
landing = screen('admin', 'A', 3.0, 1600)
save(landing.crop((0, 0, landing.width, int(landing.height * 0.905))), 'arch9/app-landing.webp')
save(screen('admin', 'A', 57.0, 1600), 'arch9/app-console.webp')
save(screen('sad', 'P', 109.5, 1078), 'arch9/app-workspace.webp')
save(Image.open(D3.parent / 'docs' / 'demo' / 'guided-demo-route-map.webp').convert('RGB'), 'arch9/app-demo.webp')
save(screen('mango', 'P', 209.0, 1078), 'arch9/app-approve.webp')
label = Image.open(D3 / 'system' / 'img' / 'labels' / 'MF-2410-118.webp').convert('RGB')
label.thumbnail((900, 900))
save(label, 'arch9/label-photo.webp', 90)
