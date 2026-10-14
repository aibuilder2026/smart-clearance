"""SC-206 cut 4: the film's shots, laid on the voice. Times come from the voice-over's own word timings (at()), so each
person, screen, ring and paper lands on the words that name it. Screen rects are in the device's own pixels (measured on
the production recordings, cut 2's, unchanged). Cut 4 opens in a distributor's godown that dives into its carton's
label, condenses the agents into six seconds of architecture in depth, drops Rehearsal, adds the console's live view,
the Router's split as routes, the distributor's own portal and Impact's ledger, and closes shorter."""
import json
from parts import *
from parts3 import *
from parts4 import *
import fx, labels as LB

XF = 0.45  # the dissolve between shots

class Shot:
    def __init__(self, name, t0, t1, bg, items=()):
        self.name, self.t0, self.t1, self.bg, self.items = name, t0, t1, bg, list(items)
    def draw(self, f, t):
        u, L = t - self.t0, self.t1 - self.t0
        self.bg.draw(f, u, L) if _takes_L(self.bg) else self.bg.draw(f, u)
        for it in self.items:
            it.draw(f, u, L)

def _takes_L(obj):
    try:
        import inspect
        return len(inspect.signature(obj.draw).parameters) >= 3
    except Exception:
        return False

class Room:
    """a person's place, out of focus and in shadow, as the ground under their screens (a still: nothing moves behind
    a blur that could show a loop)"""
    def __init__(self, key, blur=16, dim=0.5):
        p = HERE / 'img' / f'{key}-L.png'
        if not p.exists(): p = HERE / 'img' / f'{key}.png'
        im = cv2.resize(cv2.imread(str(p)), (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        self.img = fx.defocus(im, blur) * (1 - dim)
    def draw(self, f, u, L=None):
        f[:] = self.img

class Split:
    """two rooms side by side, joined by a soft seam: two people, one moment"""
    def __init__(self, left, right, seam=0.5):
        self.l, self.r, self.seam = left, right, seam
        x = np.linspace(0, 1, W, dtype=np.float32)
        self.m = np.clip((x - (seam - 0.06)) / 0.12, 0, 1)[None, :, None]
    def draw(self, f, u, L=None):
        self.l.draw(f, u); a = f.copy(); self.r.draw(f, u)
        f[:] = a * (1 - self.m) + f * self.m

class Stack:
    def __init__(self, *items): self.items = items
    def draw(self, f, u, L=None):
        for it in self.items: it.draw(f, u, L)

class Steps:
    """the console's setup as steps in the left column, each lit as its screen plays"""
    def __init__(self, names, starts, x, y, u0=0.3):
        self.names, self.starts, self.x, self.y, self.u0 = names, starts, x, y, u0
    def draw(self, f, u, L=None):
        a = clamp((u - self.u0) / 0.4)
        if a <= 0: return
        for i, (n, t0) in enumerate(zip(self.names, self.starts)):
            on = u >= t0
            blit(f, chip_sprite(n, 'good' if on else 'dot', 22), self.x, self.y + i * 58, a * (1.0 if on else 0.45))

class LabelRings:
    """rings on parts of a carton's real label (its layout's boxes, label-boxes.mjs), following the 2.5D camera: each
    (box name, u0, u1, card or None)"""
    def __init__(self, still, H_, boxes, items, card_at=(64, 640)):
        self.still, self.H, self.boxes, self.items, self.card_at = still, H_, boxes, items, card_at
    def draw(self, f, u, L=None):
        for name, u0, u1, spr in self.items:
            if u < u0 or u > u1: continue
            x0, y0, x1, y1 = self.boxes[name]
            pts = cv2.perspectiveTransform(np.float32([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]), self.H)[0]
            out = np.float32([self.still.src_out((float(px), float(py)), u) for px, py in pts])
            rx0, ry0, rx1, ry1 = out[:, 0].min() - 8, out[:, 1].min() - 6, out[:, 0].max() + 8, out[:, 1].max() + 6
            a = fade(u, u0, u1, 0.15, 0.3)
            ring(f, rx0, ry0, rx1, ry1, 10, prog=ease_out((u - u0) / 0.5), alpha=a, color=C['amber2'])
            if spr is not None:
                cx, cy = self.card_at
                ca = fade(u, u0 + 0.25, u1, 0.35, 0.3)
                e = ease_out((u - u0 - 0.25) / 0.45)
                line(f, (cx + spr.shape[1], cy + spr.shape[0] / 2), (rx0, (ry0 + ry1) / 2), C['amber2'], alpha=ca * 0.9, width=2.2)
                blit(f, spr, cx, cy + 8 * (1 - e), ca)

class Flash:
    """a camera's shutter: a quick white flash at u0"""
    def __init__(self, u0, dur=0.22): self.u0, self.dur = u0, dur
    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u0 + self.dur: return
        p = (u - self.u0) / self.dur
        a = (1 - p) ** 2 * 0.85
        f *= (1 - a); f += a

class CamView:
    """the over-the-shoulder shot of a tablet used as a camera: its screen is the viewfinder, showing what its lens is
    aimed at (the worker and the opened cartons in the pit, a region of the same frame, so it moves with the clip), with
    a shutter button; at u_shot the photo is taken (a flash), and the screen then holds the photo that was sent"""
    def __init__(self, key, quad, u_shot, photo=None, aim=(1100, 470, 1700, 970), hold=None):
        self.foot = Footage(key)
        self.q, self.u_shot, self.photo, self.aim, self.hold = quad, u_shot, photo, aim, hold
        S = 2
        im = Image.new('RGBA', (400 * S, 300 * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.ellipse([(200 - 24) * S, (300 - 62) * S, (200 + 24) * S, (300 - 14) * S], outline=(255, 255, 255, 255), width=int(4 * S))
        d.ellipse([(200 - 17) * S, (300 - 55) * S, (200 + 17) * S, (300 - 21) * S], fill=(255, 255, 255, 235))
        for (x, y), (dx, dy) in [((60, 40), (1, 1)), ((340, 40), (-1, 1)), ((60, 220), (1, -1)), ((340, 220), (-1, -1))]:
            d.line([x * S, y * S, (x + 26 * dx) * S, y * S], fill=(255, 255, 255, 220), width=int(3 * S))
            d.line([x * S, y * S, x * S, (y + 26 * dy) * S], fill=(255, 255, 255, 220), width=int(3 * S))
        self.ui = cv2.cvtColor(np.asarray(im.resize((400, 300), Image.LANCZOS)), cv2.COLOR_RGBA2BGRA).astype(np.float32) / 255
    def draw(self, f, u, L=None):
        # hold: the clip's frame is held from there (LTX pushes in after a while) and the room racks out of focus for
        # what comes over it
        uo = u if self.hold is None else min(u, self.hold)
        img, q = self.foot.frame(uo)
        base = img.astype(np.float32) / 255
        if q is None: q = self.q
        x0, y0, x1, y1 = int(q[:, 0].min()), int(q[:, 1].min()), int(q[:, 0].max()), int(q[:, 1].max())
        w, h = x1 - x0, y1 - y0
        ax0, ay0, ax1, ay1 = self.aim
        # the lens's view: the aimed region, cropped to the screen's own shape and very slightly softened
        aw = ax1 - ax0; ah = aw * h / w
        cy = (ay0 + ay1) / 2
        crop = base[int(cy - ah / 2):int(cy + ah / 2), ax0:ax1]
        content = cv2.GaussianBlur(cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA), (0, 0), 0.6)
        if self.photo is not None and u > self.u_shot + 0.25:
            ph = self.photo.astype(np.float32) / 255 if self.photo.dtype == np.uint8 else self.photo
            # the photo whole, centre-cropped to the screen's shape
            pa = ph.shape[1] / ph.shape[0]; sa = w / h
            if pa > sa:
                cw = int(ph.shape[0] * sa); ox = (ph.shape[1] - cw) // 2; ph = ph[:, ox:ox + cw]
            else:
                ch = int(ph.shape[1] / sa); oy = (ph.shape[0] - ch) // 2; ph = ph[oy:oy + ch]
            content = cv2.resize(ph, (w, h), interpolation=cv2.INTER_AREA)
        else:
            ui = cv2.resize(self.ui, (w, h), interpolation=cv2.INTER_AREA)
            content = content * (1 - ui[..., 3:4]) + ui[..., :3] * ui[..., 3:4]
        vfx.insert(base, img, q, content)
        if self.hold is not None and u > self.hold:
            e = ease_in_out(clamp((u - self.hold) / 0.5))
            base = fx.defocus(base, 14 * e) * (1 - 0.55 * e)
        f[:] = base

def card(title, body='', tag=None, w=400, accent='g'):
    return card_sprite(title, body, tag, w, accent)

def head(x, y, u0, u1, kicker, headline, sub=None, width=640, hsize=46, kcolor='g', stop=None):
    return Words(x, y, u0, u1, kicker=kicker, head=headline, sub=sub, width=width, hsize=hsize, kcolor=kcolor, stop=stop)

# ---------------------------------------------------------------- the people and their windows

PRIYA = ('Priya Deshmukh', 'Supply chain · Munchly Foods', 'p-priya')
LAKSHMI = ('Lakshmi Agencies', 'Distributor · Hyderabad', 'p-lakshmi')
RAKESH = ('Rakesh Traders', 'Distributor · Nagpur', 'p-rakesh')
NEHA = ('Neha Kulkarni', 'Smart-Clearance staff · console', 'p-neha')
KIRANA = ('Sri Lakshmi Ganapathi Kirana', 'Kirana · Hyderabad', 'p-lakshmi-ganapathi')
AGRAWAL = ('Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur', 'p-agrawal')
MEERA = ('Meera · Feeding India', 'Food bank · Hyderabad', 'p-meera')
CON = 'smartclearance-console.web.app/clients/munchly'
WS = 'munchly-smartclearance.web.app'

def who(t): return (t[0], t[1], t[2])

def P3(rec, segs, url, **kw): return Window(rec, 'P', segs, 770, 250, 1.0, url, who=who(PRIYA), **kw)
def L3(rec, segs, url, w, **kw): return Window(rec, 'L', segs, 1200, 196, 0.68, url, who=who(w), **kw)
def H3(rec, segs, url, w, **kw): return Window(rec, 'H', segs, 1300, 176, 0.86, url, who=who(w), **kw)
def A3(segs, url, **kw): return Window('admin', 'A', segs, 584, 236, 0.66, url, who=who(NEHA), **kw)

LABEL_PHOTO = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-mango-drink-MF-2410-118' / 'label-photo.webp'
EVID = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-masala-chips-MF-2409-117'

def build():
    S = []
    def add(name, t0, t1, bg, items=()):
        S.append(Shot(name, t0, t1 + XF, bg, items))
    def a(lid, word=None, k=0): return at(lid, word, k)

    # ======================================================== 0 · the problem: a distributor's godown, a carton's date, the bin
    t0, t1 = 0.0, a('i02') - 0.6
    L_ = t1 - t0
    PT = (1772, 577)   # a carton's label on the near stack, in the clip's last frames: the camera rushes into it
    # the clip stretched 1.2x by motion interpolation (o0-godown-aisle-slow.mp4, ffmpeg minterpolate), so it keeps moving
    # until the dive instead of holding its last frame
    god = Dive(ClipBG('o0-godown-aisle-slow'), L_ - 0.45, L_ + XF, PT, z=3.4, mode='in')
    add('open-godown', t0, t1, Layered(god, [], vign=0.22), [
        Shade(0, 0, 1500, 560, 0.68, u0=0.5),
        Blackout(0.0, 1.0),
        Kinetic(64, 66, [[(w_, a('i01', k_) - t0) for w_, k_ in [('Every', 'Every'), ('day,', 'day'), ("India's", 'India'), ('food', 'food'),
                                                                   ('brands', 'brands'), ('write', 'write'), ('off', 'off')]]],
                size=40, kind='g', wght=600, rgb=(214, 228, 220)),
        Kinetic(64, 122, [[(w_, a('i01', k_) - t0) for w_, k_ in [('stock', 'stock'), ('that', 'that'), ('sells', 'sells'), ('too', 'too'), ('slowly.', 'slowly')]]],
                size=78)])

    t0, t1 = t1, a('i02', 'destroyed') - 0.2
    L_ = t1 - t0
    lab = Still25D('o1b-carton-macro', z=(1.0, 1.28), pan=((0, 0), (0, 0)), dur=L_ + XF, focus=(0.49, 0.47), depth_k=0.35)
    boxes = json.loads((HERE / 'build' / 'labels' / 'MF-2410-118.boxes.json').read_text())
    LM = np.float32(json.loads((HERE / 'build' / 'labels' / 'o1b.json').read_text())['H']) if (HERE / 'build' / 'labels' / 'o1b.json').exists() else None
    u_bb = a('i02', 'date') - t0 - 0.35
    items = []
    if LM is not None:
        items.append(LabelRings(lab, LM, boxes, [
            ('bb', u_bb, L_ + 0.2, card('Best before 24 Oct 2026', 'Every carton carries its batch and its date.', ('proof', 'THE LABEL'), 400, 'a'))], card_at=(64, 560)))
    add('open-label', t0, t1, Dive(Layered(lab, [(fx.Dust(n=120, seed=21, strength=0.45), 0.8), (fx.Rays(1700, -140, strength=0.22, turn=0.015), 0.9)], vign=0.3),
                                   0.0, 0.85, (W * 0.49, H * 0.47), z=2.3, mode='out'), items + [
        Countdown(64, 712, u_bb + 0.55, L_ + 0.3, 60, 22),
        Sprite(chip_sprite('Too close for Blinkit, Zepto and Instamart', 'bad', 26), 64, 800, a('i02', 'quick') - t0, L_ + 0.3)])

    t0, t1 = t1, T['i03'][0] - 1.15
    L_ = t1 - t0
    bin_ = Still25D('i3-landfill', z=(1.0, 1.10), pan=((0, 0), (-30, 6)), dur=L_ + XF, focus=(0.55, 0.55), depth_k=0.9)
    add('open-landfill', t0, t1, Layered(bin_, [(fx.Dust(n=140, seed=23, color=(220, 210, 190), strength=0.45), 0.9)], vign=0.35), [
        Sprite(chip_sprite('Destroyed', 'bad', 28), 64, 804, 0.1, L_ + 0.3),
        Sprite(chip_sprite('GST input credit reversed', 'bad', 28), 64, 880, a('i02', 'GST') - t0, L_ + 0.3)])

    # ======================================================== 1 · the brand, over the live landing page
    t0, t1 = t1, a('g01') - 0.4
    L_ = t1 - t0
    brand = BrandScene(t_strike=a('i03', 'write') - t0, t_recovery=a('i03', 'recovery') - t0, t_fly=T['i03'][1] - t0 + 0.25,
                       t_teams=a('i04', 'each') - t0, L=L_)
    add('brand', t0, t1, brand, [])

    # ======================================================== 2 · the architecture in depth, then the agents' own walk (6 s)
    t0, t1 = t1, a('a01') - 0.45
    L_ = t1 - t0
    def u(lid, word=None): return a(lid, word) - t0
    arch = ArchScene(L_, d0=u('g01', 'batch'), d1=u('g01', '9'), u_yes=u('g01', 'yes'), glow_at=[('agents', u('g01', 'agents')), ('gemini', u('g01', 'Gemini'))])
    add('agents', t0, t1, arch, [
        Sprite(words_sprite(kicker='THE ARCHITECTURE', width=600), 64, 60, 0.15, arch.d0 + 0.1),
        Kinetic(64, 100, [[('Ten', u('g01', '10')), ('agents', u('g01', 'agents'))], [('on', u('g01', 'on')), ('Gemini.', u('g01', 'Gemini'))]], size=64, u1=arch.d0 + 0.1),
        Kinetic(935, 534, [[('Nine', u('g01', '9')), ('stops.', u('g01', 'stops'))]], size=76, align='center', u1=u('g01', 'one') - 0.02, fout=0.22),
        Kinetic(935, 534, [[('One', u('g01', 'one')), ('human', u('g01', 'human')), ('yes.', u('g01', 'yes'), (247, 192, 74))]], size=76, align='center')])

    # ======================================================== 3 · the agenda
    t0, t1 = t1, T['k01'][0] - PRE['k01'] - 0.2
    L_ = t1 - t0
    add('agenda', t0, t1, Agenda([a('a01', 'SaaS') - t0 - 0.6, a('a01', 'happy') - t0 - 0.6, a('a01', 'sad') - t0 - 0.6], L_), [])

    # ======================================================== 4 · the console: a brand set up in minutes, then every client live
    # (a segment plays on 0.3 s into the dissolve to the next: each ends that much before a stage card fades in, cardscan.py)
    t0, t1 = t1, a('k03') - 0.3
    L_ = t1 - t0
    segs = [(103.0, 104.6), (107.2, 107.8), (113.8, 115.2), (130.8, 132.4), (143.9, 145.6), (154.2, 156.3), (199.6, 202.0), (214.0, 216.1)]
    go = 2.5
    cw = A3(segs, 'smartclearance-console.web.app/clients', u0=go + 1.15, enter=False)
    st = [cw.seg_start(i, L_ + XF) for i in range(len(segs))]
    neha = DeviceShot(StillFace('f-neha', focus=(0.45, 0.40)), Footage('s-neha'), cw, t_whip=1.6, t_go=go, mode='push', who=NEHA)
    add('console', t0, t1, neha, [
        cw,
        head(64, 60, go + 1.3, L_ + 0.3, '01 · THE CONSOLE', 'A brand, set up in minutes.', width=500, hsize=44),
        Steps(['Every client, one console', 'Stock export, mapped', 'People, invited', 'SKU gates, per SKU', 'Agents, tuned'],
              [go + 1.3, st[1], st[3], st[4], st[6]], 64, 330, u0=go + 1.3),
        Ring(cw, (365, 650, 1545, 78), go + 1.5, st[1] - 0.05),
        Ring(cw, (365, 235, 1540, 690), st[1] + 0.1, st[3] - 0.05),
        Ring(cw, (360, 495, 1090, 225), st[3] + 0.1, st[4] - 0.05),
        Ring(cw, (360, 812, 1545, 72), st[4] + 0.1, st[5] - 0.05),
        Ring(cw, (1320, 150, 575, 340), st[5] + 0.1, st[6] - 0.05),
        Ring(cw, (1450, 540, 440, 230), st[6] + 0.1, st[7] - 0.05),
        Ring(cw, (1450, 355, 440, 235), st[7] + 0.1, L_ + 0.3)])

    t0, t1 = t1, a('l01') - 0.3
    L_ = t1 - t0
    # three clean spans of the Overview (no stage note, ring or chapter card), at about half speed
    ow = Window('admin', 'A', [(56.8, 58.2), (63.4, 65.0), (43.0, 44.0)], 584, 236, 0.66, 'smartclearance-console.web.app', who=who(NEHA), enter=False)
    add('monitor', t0, t1, Room('f-neha', 16, 0.55), [
        ow,
        head(64, 60, 0.2, L_ + 0.3, '01 · THE CONSOLE · LIVE', 'Every client, live.', width=500, hsize=44),
        Ring(ow, (755, 268, 370, 202), a('k03', 'batches') - t0 - 0.1, a('k03', 'agents') - t0 - 0.15,
             card=card('39 batches in flight', 'Across 5 live clients, read again every 30 seconds.', ('live', 'OVERVIEW'), 420), at=(64, 330)),
        Ring(ow, (380, 585, 1510, 305), a('k03', 'agents') - t0 - 0.05, a('k03', 'recover') - t0 - 0.2,
             card=card('Agents at work', "Each mark is a client's batch, moving along the nine stops as the agents finish.", ('agent', 'NINE STOPS'), 420), at=(64, 330)),
        Ring(ow, (365, 268, 370, 202), a('k03', 'recover') - t0 - 0.1, L_ + 0.3, accent='a',
             card=card('₹64,79,201 recovered', 'In 30 days, across every client: 52 times the 30 days before.', ('result', 'RECOVERED'), 420, 'a'), at=(64, 330))])

    # ======================================================== 5 · live: everyone signs in
    t0, t1 = t1, T['m02'][0] - PRE['m02'] - 0.2
    L_ = t1 - t0
    sp = Window('mango', 'P', [(2.6, 5.4), (8.4, 13.0), (15.6, 18.6)], 150, 380, 0.66, WS, who=who(PRIYA))
    sl = Window('mango', 'L', [(19.6, 21.6), (23.4, 25.6), (29.4, 31.6), (35.6, 38.0)], 930, 330, 0.50, WS, who=who(LAKSHMI))
    sh = Window('mango', 'H', [(36.4, 39.4), (40.6, 44.0), (44.4, 46.2)], 1430, 330, 0.62, 'smartclearance-console.web.app', who=who(NEHA))
    add('signins', t0, t1, Split(Room('f-priya', 18, 0.6), Room('f-lakshmi-L', 18, 0.6)), [
        head(84, 60, 0.2, L_ + 0.3, 'LIVE ON PRODUCTION', 'Everyone signs in, on their own device.', width=1500, hsize=46),
        sp, sl, sh])

    # ======================================================== 6 · the happy path: Munchly Mango Drink, Lakshmi Agencies
    t0, t1 = t1, a('m03') - 0.3
    L_ = t1 - t0
    go = 2.6 + 1.1
    pw = P3('mango', [(88.4, 97.2)], WS + '/command', u0=go + 1.15, enter=False)
    add('detect', t0, t1, DeviceShot(Footage('f-priya'), Footage('s-priya'), pw, t_whip=1.7 + 1.1, t_go=go, mode='push', who=PRIYA), [
        pw,
        Sprite(words_sprite(kicker='02 · HAPPY PATH', head='Munchly Mango Drink 200 ml', width=900, hsize=40, kcolor='a'), 64, 64, 0.25, 1.7 + 1.1),
        head(64, 60, go + 1.2, L_ + 0.3, 'DETECT', "Priya gets the Watcher's alert.", width=640, hsize=44, stop=1),
        Ring(pw, (714, 56, 350, 112), go + 1.5, go + 3.6, card=card('A push, from the Watcher', 'MF-2410-118: 1,580 units will not sell before 24 Oct.', ('agent', 'WATCHER'), 400), at=(64, 600)),
        Ring(pw, (268, 420, 222, 68), go + 3.8, L_ + 0.3, card=card('₹22,657 at stake', '22 days left: too close for Blinkit, Zepto and Instamart.', ('live', 'WATCHER'), 400), at=(64, 600))])

    t0, t1 = t1, a('m04') - 0.3
    L_ = t1 - t0
    go = 2.4
    lw = L3('mango', [(110.4, 112.4), (114.4, 116.6), (122.0, 124.4), (141.4, 143.9)], WS + '/home', LAKSHMI, u0=go + 1.15, enter=False)
    lab_inset = Inset(LABEL_PHOTO, 500, 236, 560, a('m03', 'Vision') - t0, L_ + 0.3, caption='The photo Lakshmi Agencies sent: batch, dates, MRP, FSSAI licence, barcode, QR')
    add('verify', t0, t1, DeviceShot(Footage('f-lakshmi'), Footage('s-lakshmi-label'), lw, t_whip=1.5, t_go=go, mode='lift', who=LAKSHMI), [
        lw,
        head(64, 60, go + 1.2, L_ + 0.3, 'VERIFY', 'One photo of the label.', width=420, hsize=44, stop=2),
        lab_inset,
        Ring(lw, (190, 760, 550, 160), lw.seg_start(3, L_ + XF) + 0.1, L_ + 0.3, card=card('Vision: it matches the export', 'MF-2410-118 · best before 24 Oct 2026 · MRP ₹20', ('agent', 'VISION'), 400), at=(64, 860))])

    t0, t1 = t1, a('m05') - 0.3
    L_ = t1 - t0
    pw = P3('mango', [(176.2, 178.8), (201.0, 202.15), (209.2, 212.0)], WS + '/route/MF-2410-118')   # 202.15: the stage's note card fades in from 202.4
    r_split, r_yes = a('m04', 'router') - t0 - 0.15, a('m04', 'approves') - t0 - 0.2
    add('approve', t0, t1, Room('s-priya', 16, 0.5), [
        head(64, 60, 0.2, L_ + 0.3, 'VALUE · APPROVE', 'Every exit priced. One yes.', width=640, hsize=44, stop=5),
        pw, Push(pw, 'plan', 0.2, 2.6),
        Ring(pw, (245, 196, 495, 300), 0.4, r_split + 0.6),
        PlanFlow(70, 268, r_split, L_ + 0.3, 'packs at risk', 1580,
                 [('52 kiranas', 'the scheme', 1372, (52, 211, 128)), ('Staff sale', 'at the godown', 150, (115, 201, 157)),
                  ('Feeding India', 'donated', 58, (247, 192, 74))], w=640, h=400),
        Ring(pw, (660, 574, 398, 52), r_yes, L_ + 0.3, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 400, 'a'), at=(64, 790))])

    t0, t1 = t1, a('m05', 'A') - 0.3
    L_ = t1 - t0
    go = 2.2
    kw_ = H3('mango', [(245.4, 247.5)], WS + '/offer/MF-2410-118', KIRANA, u0=go + 1.15, enter=False)
    add('offer', t0, t1, DeviceShot(Footage('f-kirana'), Footage('s-kirana'), kw_, t_whip=1.4, t_go=go, mode='push', who=KIRANA), [
        kw_,
        head(64, 60, go + 1.2, L_ + 0.3, 'EXECUTE', 'The offer, in her own language.', width=700, hsize=44, stop=6),
        Ring(kw_, (18, 236, 396, 350), go + 1.6, L_ + 0.3, card=card('Hindi, here', "Outreach writes each offer in the shopkeeper's own language.", ('agent', 'OUTREACH'), 400), at=(64, 600))])

    t0, t1 = t1, a('m06') - 0.3
    L_ = t1 - t0
    h = Window('mango', 'H', [(249.4, 249.4 + L_ + XF)], 250, 236, 0.76, WS + '/offer/MF-2410-118', who=who(KIRANA), speed=1.0)
    p = Window('mango', 'P', [(249.4, 251.9), (259.6, 259.6 + L_ + XF - 2.5)], 760, 316, 0.98, WS + '/execution/MF-2410-118', who=who(PRIYA))
    nx = a('m05b') - t0
    add('orders', t0, t1, Split(Room('s-kirana', 18, 0.55), Room('s-priya', 18, 0.55), seam=0.36), [
        head(64, 40, 0.2, L_ + 0.3, 'EXECUTE', "An order on her phone. Live on Priya's screen.", width=1500, hsize=44, stop=6),
        h, p,
        Ring(h, (22, 440, 404, 410), 0.25, 1.9),
        Ring(p, (258, 322, 200, 66), 2.0, nx - 0.1, card=card("Live on Priya's screen", 'The order lands the moment the shop taps: 24 packets.', ('live', 'EXECUTION'), 400), at=(1460, 108)),
        Sprite(card_sprite('More Indian languages · WhatsApp', 'To reach kiranas in every region. Hindi is live today.', ('demo', 'NEXT ON THE ROADMAP'), 440, 'a'), 1440, 100, nx + 0.1, L_ + 0.3)])

    t0, t1 = t1, a('m07') - 0.3
    L_ = t1 - t0
    split = a('m06', 'every') - t0 - 0.2
    pw = Window('mango', 'P', [(296.0, 437.0), (445.6, 449.6, 2.0)], 770, 250, 1.0, WS + '/execution/MF-2410-118', who=who(PRIYA), u1=split + 0.4)
    pw.fade_out = 0.4
    ff = (437.0 - 296.0) / max(0.5, split - 2.0)
    inv = Paper('mango-kirana-h0-p0.png', [((260, 330, 560, 368), 'CGST and SGST, 2.5% each', 'B2C, within Telangana'),
                                          ((470, 386, 560, 404), '₹302 for 24 packets', 'Sri Lakshmi Ganapathi Kirana · LA/26-27/0972')], split, L_ + XF)
    add('fill', t0, t1, Room('s-priya', 16, 0.5), [
        head(64, 60, 0.2, split + 0.2, 'EXECUTE', 'The scheme fills.', sub='52 shops, 1,372 packets.', width=600, hsize=52, stop=6),
        pw, Badge(f'Fast-forward {ff:.0f}×', 1640, 120, 0.3, split - 0.1),
        Ring(pw, (258, 668, 420, 46), split - 1.9, split + 0.1),
        PaperShow([inv], cx=1040, zx=1030)])

    t0, t1 = t1, a('m08') - 0.3
    L_ = t1 - t0
    vis = a('m07', 'receipt') - t0 - 0.3   # Vision's read once the payments have added up, as the voice reaches the receipt
    lw = L3('mango', [(470.6, 470.6 + 6.0)], WS + '/home', LAKSHMI, u0=vis, speed=1.0)
    sc = a('m07', 'scanning') - t0
    # the clip holds the scan for 1.5 s (1.44 s of film, played at 25 fps), then he lowers the phone to pay: its screen
    # rises out while it is still up, and the phone's window scans until the voice says it, then pays
    upi = UpiScene(t_lift=1.44, t_pay=sc + 0.3, t_paid=a('m07', 'UPI') - t0 + 0.2, t_list=a('m07', 'UPI') - t0 + 0.6,
                   t_vision=vis, lwin=lw, L=L_)
    add('upi', t0, t1, upi, [
        head(64, 60, 0.2, vis, 'EXECUTE · STAFF SALE', 'Paid by UPI, one scan each.', width=900, hsize=44, stop=6),
        lw, Ring(lw, (110, 468, 705, 160), vis + 0.7, L_ + 0.3, card=card('18 UPI payments · ₹1,200', 'Vision read the receipt: it matches 150 packs at ₹8.', ('agent', 'VISION'), 400), at=(120, 880))])

    t0, t1 = t1, a('m09', 'Munchly') - 0.25
    L_ = t1 - t0
    go = 2.2
    rec_t = a('m08', 'and') - t0   # the receipt, from 'and issues a donation receipt'
    cn_t = a('m09') - t0 + 0.2
    mw = H3('mango', [(526.0, 526.0 + 6.0)], WS + '/pickups', MEERA, u0=go + 1.15, u1=rec_t + 0.4, enter=False, speed=1.0)
    mw.fade_out = 0.4
    rcpt = Paper('mango-receipt-p0.png', [((40, 50, 545, 100), 'Donation receipt FI/HYD/26-27/0417',
                                           "Feeding India received 58 packs, 12.47 kg · 58 meals · the donor's evidence for BRSR")],
                 rec_t, cn_t, tag=('proof', 'DONATION RECEIPT'))
    cn = Paper('mango-support-p0.png', [((300, 70, 560, 96), 'Credit note CN/0117', 'Munchly to Lakshmi Agencies · price support, signed')], cn_t, L_ + XF)
    add('donation', t0, t1, DeviceShot(Footage('f-meera'), Footage('s-meera'), mw, t_whip=1.4, t_go=go, mode='push', who=MEERA), [
        mw, Push(mw, 'pickup', go + 1.3, rec_t),
        head(64, 60, go + 1.2, rec_t, 'EXECUTE', 'Feeding India collects.', width=640, hsize=44, stop=6),
        PaperShow([rcpt, cn], cx=1040, zx=1030),
        head(64, 60, cn_t, L_ + 0.3, 'SETTLE', 'Every paper, drafted and signed.', width=520, hsize=44, stop=7)])

    t0, t1 = t1, a('m09b') - 0.3
    L_ = t1 - t0
    res = ResultPunch(0.15, L_ + 0.4, 'THE MANGO DRINK · THE RESULT', 'mango', 'MF-2410-118 · Lakshmi Agencies, Hyderabad',
                      16917.10, -22657.20, 22194.30,
                      [('52 kiranas', '1,372 packets · a GST invoice for every order', 1372, (52, 211, 128)),
                       ('Staff sale', '150 packs · 18 UPI payments · ₹1,200', 150, (115, 201, 157)),
                       ('Feeding India', '58 packs · 58 meals · receipt FI/HYD/26-27/0417', 58, (247, 192, 74))],
                      [('Lakshmi Agencies ends whole · ₹0', 'good'), ('339.7 kg kept out of landfill', 'good'), ('Every paper signed', 'good')],
                      [a('m09', 'Lakshmi') - t0, a('m09', 'Lakshmi') - t0 + 0.6, a('m09', 'Lakshmi') - t0 + 1.2],
                      bg=Room('f-lakshmi-L', 14, 0.6).img)
    add('mango-result', t0, t1, res, [])

    # her own portal: that she ends whole, what happened step by step, and her papers
    t0, t1 = t1, T['s01'][0] - PRE['s01']
    L_ = t1 - t0
    u_step, u_paper = a('m09b', 'step') - t0, a('m09b', 'paper') - t0
    dA = u_step - 0.35; dB = (u_paper - 0.3) - dA
    # Money once the stage's note has gone (747.4), What happened before the stage clicks Money (740.7), then Papers
    lw = Window('mango', 'L', [(747.6, 750.6, dA), (738.7, 740.3, dB), (765.95, 768.2)], 1170, 150, 0.74, WS + '/batches/MF-2410-118', who=who(LAKSHMI))
    add('portal', t0, t1, Room('f-lakshmi-L', 16, 0.55), [
        TiltIn(lw, 0.15, side=-1),
        head(64, 60, 0.25, L_ + 0.3, "THE DISTRIBUTOR'S PORTAL", 'Her own view of the batch.', width=760, hsize=44),
        Checklist(70, 330, [('She ends whole', 'what she paid, all back: ₹0 gained or lost', 1.05),
                            ('What happened', 'every step, as it was done: 2 Oct, 08:14 to 12:11', u_step - 0.2),
                            ('Every paper', 'the credit note, the staff receipt, 52 tax invoices', u_paper - 0.2)], L_ + 0.3),
        Ring(lw, (95, 262, 735, 336), 1.1, dA - 0.05),
        Ring(lw, (100, 268, 728, 728), dA + 0.1, dA + dB - 0.05),
        Ring(lw, (95, 255, 735, 520), dA + dB + 0.15, dA + dB + (767.15 - 765.95) * (L_ + XF - dA - dB) / (768.2 - 765.95))])   # until the register's sheet opens

    # ======================================================== 7 · the sad path: Munchly Masala Chips, Rakesh Traders
    t0, t1 = t1, a('s02') - 0.3
    L_ = t1 - t0
    go = 2.6
    rw = L3('sad', [(440.0, 440.0 + 6.0)], WS + '/deliveries/MF-2409-117', RAKESH, u0=go + 1.15, enter=False, speed=1.0)
    add('chips', t0, t1, DeviceShot(Footage('f-rakesh'), Footage('s-rakesh'), rw, t_whip=1.8, t_go=go, mode='lift', who=RAKESH), [
        rw,
        head(64, 60, 0.4, L_ + 0.3, '03 · SAD PATH · MUNCHLY MASALA CHIPS 150 G', 'Not every batch sells.', width=640, hsize=44, kcolor='a', stop=6),
        Ring(rw, (530, 668, 283, 58), go + 1.5, go + 3.6, card=card('2 of 38 kiranas ordered', '35 said not this time. A no is an answer too.', ('live', 'OUTREACH'), 400), at=(64, 600)),
        Ring(rw, (92, 858, 740, 118), go + 3.8, L_ + 0.3, card=card('Two shops, 48 packets', 'Shree Ganesh Kirana and Jai Durga Stores, 24 each, on the van round.', ('live', 'DELIVERIES'), 400), at=(64, 600))])

    t0, t1 = t1, a('s03') - 0.3
    L_ = t1 - t0
    go = 2.2
    d0 = a('s02', 'counters') - 0.3 - t0 - (go + 1.15)   # the counter on screen as the voice says it
    aw = H3('sad', [(441.0, 444.2, d0), (448.6, 451.1), (460.0, 463.4)], WS + '/market/ES-24117', AGRAWAL, u0=go + 1.15, enter=False)
    q1, q2 = aw.seg_start(1, L_ + XF), aw.seg_start(2, L_ + XF)
    add('lot', t0, t1, DeviceShot(StillFace('f-agrawal'), Footage('s-agrawal'), aw, t_whip=1.4, t_go=go, mode='push', who=AGRAWAL), [
        aw,
        head(64, 60, go + 1.2, L_ + 0.3, 'EXECUTE', 'The Negotiator sells the lot.', width=640, hsize=44, stop=6),
        Ring(aw, (16, 400, 418, 152), go + 1.4, q1 - 0.05, card=card('A bid of ₹13', 'Under the reserve the buyer never sees.', ('live', 'EXPIRESOON'), 400), at=(64, 600)),
        Push(aw, 'counter', q1 + 0.1, q2 - 0.1),
        Ring(aw, (14, 364, 422, 220), q2 + 0.1, L_ + 0.3, card=card('Countered at ₹14.20, accepted', '772 packs sold, with a ₹1,644 token.', ('agent', 'NEGOTIATOR'), 400), at=(64, 600))])

    t0, t1 = t1, a('s04') - 0.3
    L_ = t1 - t0
    pw = P3('sad', [(501.6, 505.6)], WS + '/execution/MF-2409-117')
    add('window', t0, t1, Room('s-priya-eve', 16, 0.5), [
        head(64, 60, 0.2, L_ + 0.3, 'EXECUTE', 'The offer window closes.', sub='540 packets are left at the godown.', width=640, hsize=48, stop=6),
        pw, Ring(pw, (265, 348, 438, 52), 0.6, 2.4), Ring(pw, (262, 418, 200, 66), 2.6, L_ + 0.3)])

    t0, t1 = t1, a('s05') - 1.3
    L_ = t1 - t0
    rw = L3('sad', [(561.6, 563.9), (574.4, 576.6)], WS + '/home', RAKESH)
    add('destroy-ask', t0, t1, Room('f-rakesh-L', 16, 0.55), [
        head(64, 60, 0.2, L_ + 0.3, 'EXPIRY DAY', 'Destroy them, and prove it.', width=700, hsize=48, stop=7),
        rw, Push(rw, 'destroy', 0.2, 3.0)])

    t0, t1 = t1, a('s05', 'and') - 0.25
    L_ = t1 - t0
    shot_at = 1.9 * 24 / 25    # the clip's own 1.9 s, played at 25 fps
    after = cv2.imread(str(EVID / 'destruction-after-540-packs.webp'))
    add('landfill', t0, t1, CamView('s-landfill-photo', screen_of('s-landfill-photo'), shot_at, photo=after, hold=shot_at + 0.6), [
        Flash(shot_at),
        Inset(EVID / 'destruction-before-540-packs.webp', 360, 250, 580, shot_at + 0.7, L_ + 0.3, caption='Before: 540 packs at the godown, the batch slip in view'),
        Inset(EVID / 'destruction-after-540-packs.webp', 1000, 250, 580, shot_at + 1.1, L_ + 0.3, caption='After: buried at the landfill, with the slate'),
        head(64, 60, 0.2, L_ + 0.3, 'SETTLE', 'Destroyed, against evidence.', width=640, hsize=44, stop=7)])

    t0, t1 = t1, a('s06') - 0.3
    L_ = t1 - t0
    go = 1.1
    rw = L3('sad', [(621.0, 625.0), (661.6, 663.8)], WS + '/destroy/MF-2409-117', RAKESH, u0=go + 1.15, enter=False)
    add('sign', t0, t1, DeviceShot(None, Footage('s-landfill-sign'), rw, t_whip=0.0, t_go=go, mode='lift', who=None), [
        rw,
        head(64, 60, go + 1.0, L_ + 0.3, 'SETTLE', 'The certificate, signed in place.', width=640, hsize=44, stop=7),
        Ring(rw, (146, 728, 634, 280), rw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, card=card('4 of 4 signatures', 'The officer, two witnesses and Rakesh · OCE/DC/26-27/0219', ('proof', 'CERTIFICATE'), 400), at=(64, 600))])

    t0, t1 = t1, a('s06', 'Every') - 0.2
    L_ = t1 - t0
    go = 1.1
    pw = P3('sad', [(696.8, 698.4), (720.8, 722.8), (751.0, 752.6)], WS + '/execution/MF-2409-117', u0=go + 1.15, enter=False)   # 696.8: past the stage's own ring on Vision's checks
    y1, y2 = pw.seg_start(1, L_ + XF), pw.seg_start(2, L_ + XF)
    add('second-yes', t0, t1, DeviceShot(None, Footage('s-priya-eve'), pw, t_whip=0.0, t_go=go, mode='push', who=None), [
        pw,
        head(64, 60, go + 1.0, L_ + 0.3, 'APPROVE', "Priya's second yes.", width=640, hsize=44, stop=5),
        Ring(pw, (655, 325, 405, 195), go + 1.3, y1 - 0.1, card=card("Vision's checks · 4 of 4", 'The batch label, about 540 packs, the slate, both photos today.', ('agent', 'VISION'), 400), at=(64, 600)),
        Ring(pw, (790, 676, 262, 50), y1 + 0.1, y1 + 1.05, accent='a'),
        Ring(pw, (650, 160, 400, 560), y2 + 0.1, L_ + 0.3, card=card('Certificate and expiry credit note', 'OCE/DC/26-27/0219 · CN/0118 ₹13,284', ('proof', 'PAPERWORK'), 400), at=(64, 600))])

    t0, t1 = t1, a('s07') - 0.3
    L_ = t1 - t0
    half = L_ / 2   # two papers, one highlight each (the expiry credit note is ringed in the second yes just before)
    cert = Paper('chips-destruction-p0.png', [((40, 455, 560, 600), '540 packs destroyed, signed in place',
                                               "The agency's officer, two witnesses and Rakesh · OCE/DC/26-27/0219")], 0.0, half + 0.3, tag=('proof', 'CERTIFICATE'))
    inv = Paper('chips-invoice-p0.png', [((36.4, 52, 545, 118), 'GST e-invoice: its IRN and signed QR',
                                         'INV/26-27/0931 · ₹11,510 to Agrawal Wholesale · issued from Tally')], half + 0.3, L_ + XF, tag=('proof', 'GST INVOICE'))
    add('chips-papers', t0, t1, Room('s-priya-eve', 18, 0.6), [PaperShow([cert, inv], cx=1040, zx=1030),
        head(64, 60, 0.2, L_ + 0.3, 'SETTLE', 'Every paper, signed.', width=520, hsize=44, stop=7)])

    t0, t1 = t1, a('m10') - 0.3
    L_ = t1 - t0
    res = ResultPunch(0.15, L_ + 0.4, 'THE MASALA CHIPS · THE RESULT', 'chips', 'MF-2409-117 · Rakesh Traders, Nagpur',
                      11702.40, -26329.60, 14868.00,
                      [('ExpireSoon', '772 packs to Agrawal Wholesale at ₹14.20', 772, (52, 211, 128)),
                       ('2 kiranas', '48 packets, each with its GST invoice', 48, (115, 201, 157)),
                       ('Destroyed on evidence', '540 packs · credit note CN/0118 ₹13,284', 540, (229, 92, 74))],
                      [('Rakesh Traders ends whole · ₹0', 'good'), ('Certificate signed by four', 'good'), ('Every rupee on the record', 'good')],
                      [a('s07', 'Rakesh') - t0, a('s07', 'Rakesh') - t0 + 0.6, a('s07', 'Rakesh') - t0 + 1.2],
                      bg=Room('f-rakesh-L', 14, 0.6).img, accent=(247, 192, 74))
    add('chips-result', t0, t1, res, [])

    # ======================================================== 8 · Impact's ledger: the year so far, then the batch's BRSR line
    t0, t1 = t1, T['e02'][0] - 0.35
    L_ = t1 - t0
    u_br = a('m10', 'ready') - t0 - 0.25
    # the headline (720.05), the dashboard scrolled (three clean spans between the stage's rings), the batch's BRSR line (734.0)
    iw = Window('mango', 'P', [(720.05, 721.45, 3.05), (721.95, 722.6), (724.8, 725.3), (728.6, 730.0), (734.0, 735.8, L_ + XF - u_br)],
                770, 250, 1.0, WS + '/report', who=who(PRIYA))
    add('impact', t0, t1, Room('s-priya-eve', 16, 0.55), [
        TiltIn(iw, 0.1),
        head(64, 60, 0.25, L_ + 0.3, 'REPORT · IMPACT', 'The ledger, the year so far.', width=640, hsize=44, stop=8),
        Ring(iw, (240, 248, 420, 74), 0.95, 3.1,
             card=card('2.30 t kept out of landfill', 'FY 2026-27 so far: 2.07 t resold, 224.6 kg donated, 930 meals.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (265, 74, 783, 112), 3.3, u_br - 0.1,
             card=card('68 kg destroyed · 5.75 t CO₂e avoided', '97.1% of the food saved, every batch on the record.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (252, 237, 765, 186), u_br + 0.15, L_ + 0.3, accent='a',
             card=card('Ready for BRSR', "The batch's own BRSR line: 339.7 kg diverted, 58 meals, with its evidence.", ('proof', 'BRSR'), 420, 'a'), at=(64, 330))])

    live = [x.name for x in S]
    a0, a1 = live.index('signins'), live.index('impact')
    for i in range(a0, a1 + 1):
        S[i].items.append(LiveTag(fin=(i == a0), fout=(i == a1)))

    # ======================================================== 9 · the close
    t0, t1 = t1, END
    words = [('Ten', a('e02', '10') - t0), ('agents,', a('e02', 'agents') - t0), ('one', a('e02', '1') - t0), ('yes,', a('e02', 'yes') - t0, (247, 192, 74)),
             ('and', a('e02', 'and') - t0), ('nothing', a('e02', 'nothing') - t0), ('good', a('e02', 'good') - t0), ('goes', a('e02', 'goes') - t0),
             ('to', a('e02', 'to') - t0), ('waste.', a('e02', 'waste') - t0)]
    add('end', t0, t1 - XF, EndCard4(t1 - t0, words), [Blackout(t1 - t0 - 1.0, t1 - t0 - 0.05, into=True)])
    S[-1].t1 = END
    return S

if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s')
    print('END', END)
