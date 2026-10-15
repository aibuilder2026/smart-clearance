"""SC-209 cut 7 (from SC-208's cut 6): the film's shots, laid on the voice. Times come from the voice-over's own word timings (at()), so each
person, screen, ring and paper lands on the words that name it. Screen rects are in the device's own pixels (measured on
the production recordings, cut 2's, unchanged). Cut 5, on the maintainer's notes on cut 4: the godown's cartons carry
printed labels and the opening's words are printed on a shipping label and stamped; the agents' walk plays in full;
Munchly's supply chain is laid out before the journeys; Priya signs in in dark mode and the workspace is installed as
an app on every device; each batch's swing is worked out bar by bar; the roadmap and the guided demo close the film;
the Google Cloud services are named as they are used. Cut 6, on the maintainer's notes on cut 5: the write-off stamped
on the godown's own cartons and its cost worked line by line at the bin, the GST credit taken back; the people of the
demo at their posts on the map; an agent's orb and its tool calls wherever an agent works; a pop-up out of every phone
held back to the camera; the split worked from the sales history and the rules; the deliveries; every step on the
record, with one real trace; the future scope in photographs; the sign-ins and the sample data at the close. Cut 7,
on the maintainer's notes on cut 6: the opening over the same godown made a statement (a scan of the days left, the
month running out, the stamps, the figures); the bin's food waste and its ESG cost; the brand scene's recovery, three
brands' factories and the best exit for every pack; motion wherever the frame stood empty (the kirana maps, the
invoices, ExpireSoon explained and the Negotiator's ladder, the window closing, the proof, the signatures, Vision's
checks, the sell-through)."""
import json
from parts import *
from parts3 import *
from parts4 import *
from parts5 import *
from parts6 import *
from parts7 import *
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
    ALT = {'10': ['ten'], 'ten': ['10'], '1': ['one'], 'one': ['1'], '9': ['nine'], 'BigQuery': ['big'], 'ExpireSoon': ['expire'],
           'Firebase': ['fire'], 'ADK': ['a', 'adk']}
    def a(lid, word=None, k=0, edge='s'):
        # a word as Whisper wrote it: a figure as digits or words, a product's name in one word or two
        for w_ in [word] + ALT.get(word, []):
            try: return at(lid, w_, k, edge)
            except KeyError: pass
        raise KeyError(f'{lid}: {word}')

    # ======================================================== 0 · the problem: a distributor's godown, a carton's date, the bin
    t0, t1 = 0.0, a('i02') - 0.6
    L_ = t1 - t0
    PT = (1772, 577)   # a carton's label on the near stack, in the clip's last frames: the camera rushes into it
    # cut 5: the clip with every carton's label printed (cartons.py), the words printed on a shipping label as said
    # cut 6: the write-off, stamped on the Mango Drink's own cartons one after another (their labels tracked by
    # cartons.py), the rupees adding up; the carton the camera dives into (track 77) keeps its label clean
    u_w, u_o = a('i01', 'write') - t0 + 0.02, a('i01', 'off') - t0 + 0.02
    u_k, u_s = a('i01', 'stock') - t0 + 0.05, a('i01', 'slowly') - t0 + 0.1
    side = [u_k + (u_s - u_k) * (i / (len(STAMP_SIDE) - 1)) ** 0.8 for i in range(len(STAMP_SIDE))]
    stamps = list(zip(STAMP_BIG, [u_w, u_o], ['big'] * 2)) + list(zip(STAMP_SIDE, side, ['side'] * len(STAMP_SIDE)))
    times = [u for _, u, _ in stamps]
    # cut 7: over the same clip, a scan finds each carton's days to its best-before, the month runs out to day 0, the
    # big stamps land with a red flush, and the statement slams in: the packs, the days, the rupees written off
    u_sl = a('i01', 'sells') - t0
    scan, count = (0.35, 1.55), (a('i01', 'Every') - t0, u_w - 0.25)
    gone = {tid: u_ for tid, u_, _ in stamps}
    gone.update({'57': u_w - 0.2, '72': u_w - 0.2, '89': u_w - 0.2, '84': u_w - 0.1, '90': u_w - 0.1, '59': u_k, '99': u_k})
    god = Dive(StampedGodown7(stamps, TAGS, scan, count, gone, L_ - 0.5), L_ - 0.45, L_ + XF, PT, z=3.4, mode='in')
    add('open-godown', t0, t1, Layered(god, [], vign=0.22), [
        Blackout(0.0, 1.0),
        RedPulse([u_w, u_o]),
        DateTicker(64, 52, 0.5, L_ - 0.45, count[0], count[1]),
        Statement(72, 580, [('1,580 packs.', 96, INK, u_k), ('22 days left.', 96, AMBER, u_sl),
                            (lambda u, u_s=u_s: money(roll(u, u_s - 0.05, u_s + 0.45, 0, 22657.2)) + ' written off.', 96, RED, u_s - 0.05)],
                  'Munchly Mango Drink · one batch, MF-2410-118 · if nothing changes', u_sl + 0.2, L_ - 0.45, gap=108)])
    S[-1].stamps = stamps                                    # for the sound: a thud as each lands

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
    # cut 7: the landfill re-shot at dusk (a photoreal clip of the batch's cartons sliding off a dump truck, kites and
    # smoke), with what the bin costs the planet beside what it costs Munchly
    # cut 7b: the maintainer found the composite's motion unrealistic. One real camera glide over a still heap now, its
    # stickers printed with the Mango Drink's shipper label through the move (landfill-labels.py), with no push of our own
    # then the maintainer asked for "something unique and aesthetic" and picked, from three concepts, A: the batch's
    # cartons in one long curving trail across dark earth, seen straight down at golden hour, the drone slowly descending
    # (gen-ltx9.py w2-aerial)
    if (HERE / 'img' / 'w2-aerial.png').exists():
        bin_ = ClipPush('w2-aerial-slow' if (HERE / 'clips' / 'w2-aerial-slow.mp4').exists() else 'w2-aerial', z=(1.0, 1.0), pt=(W * 0.5, H * 0.5), dur=L_ + XF)
    elif (HERE / 'clips' / 'w1-landfill-b-labelled.mp4').exists():
        bin_ = ClipPush('w1-landfill-b-labelled', z=(1.0, 1.0), pt=(W * 0.5, H * 0.5), dur=L_ + XF)
    else:
        bin_ = Still25D('i3-landfill', z=(1.0, 1.10), pan=((0, 0), (-30, 6)), dur=L_ + XF, focus=(0.55, 0.55), depth_k=0.9)
    u_d, u_g = a('i02', 'destroyed') - t0, a('i02', 'GST') - t0
    e0 = u_d + 0.3
    add('open-landfill', t0, t1, Layered(bin_, [], vign=0.22), [   # cut 7b: the clip's own smoke and air, nothing laid over them
        # the panels on the bare earth either side of the trail: the cost to Munchly above its loop, the planet's below
        # its far bend, so the trail itself stays in view
        CostStack(64, 64, [max(0.15, u_d + 0.05), u_g - 0.1, u_g + 0.55, u_g + 0.8], u_g + 1.05, L_ + 0.3, w=560),
        ESGPanel(1300, 560, [('trash-2', lambda u, e0=e0: f'{roll(u, e0, e0 + 0.6, 0, 339.7):.1f} kg', 'of food, buried in landfill', e0),
                             ('cloud', lambda u, e0=e0: f'{roll(u, e0 + 0.4, e0 + 1.0, 0, 849.25):,.0f} kg CO₂e', 'for food no one eats (indicative)', e0 + 0.4),
                             ('recycle', '3.2 kg', 'of plastic packaging, to EPR', e0 + 0.8),
                             ('ban', '1,580 packs', 'that never reach anyone', e0 + 1.2)],
                 e0 + 1.7, L_ + 0.3, w=560)])

    # ======================================================== 1 · the brand, over the live landing page
    t0, t1 = t1, a('g01') - 0.4
    L_ = t1 - t0
    t_fly = T['i03'][1] - t0 + 0.4   # cut 7: the recovery rolls in on 'into' and holds a moment before the whip
    base = BrandScene(t_strike=a('i03', 'write') - t0, t_recovery=a('i03', 'recovery') - t0, t_fly=t_fly + 100,
                      t_teams=a('i04', 'each') - t0 + 100, L=L_)
    # cut 7: under the line the write-off rolls into what the plan recovered; then three brands' factories, each with its
    # own workspace, and the best exit for every pack, flowing
    morph = RecoveryMorph(636, 560, a('i03', 'write') - t0, a('i03', 'into') - t0, t_fly)
    # cut 7b: the maintainer found the factories rushed (0.7 s each): 1.75 s each now, cross-faded, the best exit
    # coming in as the voice reaches 'exit' (the brand's line has 2 s more after it, given from small pauses elsewhere)
    brand = BrandScene7(base, t_fly, a('i04', 'every') - t0 - 0.25, L_, morph)
    add('brand', t0, t1, brand, [])

    # ======================================================== 2 · the architecture in depth, then the agents' walk in full
    t0, t1 = t1, a('a01') - 0.45
    L_ = t1 - t0
    def u(lid, word=None, k=0): return a(lid, word, k) - t0
    d0 = u('g01', 'They') - 0.55; d1 = d0 + 0.7
    y_ = u('g01', 'yes') - 0.1
    st = [d1 + (y_ - d1) * k / 5 for k in range(5)] + [y_, y_ + 0.85, y_ + 1.5, y_ + 1.95, y_ + 2.4]
    walk = AgentsWalk(L_, d0, d1, st, glow_at=[('agents', u('g01', 'ADK')), ('api', u('g01', 'Cloud')), ('gemini', u('g01', 'Gemini'))])
    add('agents', t0, t1, walk, [
        Sprite(words_sprite(kicker='UNDER THE HOOD', width=600), 64, 60, 0.15, d0 + 0.1),
        Kinetic(64, 100, [[('Ten', u('g01', '10')), ('agents', u('g01', 'agents'))], [('on', u('g01', 'Google')), ('Google', u('g01', 'Google')), ('Cloud.', u('g01', 'Cloud'))]], size=64, u1=d0 + 0.1),
        TechTag('Google ADK', 'ten agents, one job each', u('g01', 'ADK') - 0.1, d0 + 0.2),
        TechTag('Gemini 3.1 Pro · Gemini 3.8 Flash', 'on Vertex AI: Pro decides, Flash reads', u('g01', 'Gemini') - 0.1, d0 + 0.2, y=H - 122)])

    # ======================================================== 3 · Munchly Foods, its supply chain, and the two batches
    t0, t1 = t1, T['k01'][0] - PRE['k01'] - 0.2
    L_ = t1 - t0
    mm = MunchlyCast(L_, u('a01', 'Meet') + 0.2, u('a01', 'distributors'), u('a01', 'kiranas'), u('a01', 'food'), u('a02', 'two'),
                     u('a02', 'happy'), u('a02', 'sad'), t_cast=u('a02', 'people') - 0.2, t_cast_out=u('a02', 'two') - 0.3)
    add('munchly', t0, t1, mm, [
        Sprite(words_sprite(kicker='THE DEMO CLIENT · IMAGINARY', width=600), 64, 52, 0.3, L_ + 0.3)])

    # ======================================================== 4 · the console: a brand set up in minutes, then every client live
    t0, t1 = t1, a('l01') - 0.3
    L_ = t1 - t0
    segs = [(103.0, 104.6), (113.8, 115.2), (130.8, 132.4), (143.9, 145.6), (199.6, 201.4)]
    go = 2.0
    cw = A3(segs, 'smartclearance-console.web.app/clients', u0=go + 1.15, enter=False)
    st = [cw.seg_start(i, L_ + XF) for i in range(len(segs))]
    neha = DeviceShot(StillFace('f-neha', focus=(0.45, 0.40)), Footage('s-neha'), cw, t_whip=1.2, t_go=go, mode='push', who=NEHA)
    add('console', t0, t1, neha, [
        cw,
        head(64, 60, go + 1.3, L_ + 0.3, '01 · THE CONSOLE', 'A brand, set up in minutes.', width=500, hsize=44),
        Steps(['Every client, one console', 'Stock export, mapped', 'People, invited', 'SKU gates, per SKU', 'Agents, tuned'],
              [go + 1.3, st[1], st[2], st[3], st[4]], 64, 330, u0=go + 1.3),
        Ring(cw, (365, 650, 1545, 78), go + 1.5, st[1] - 0.05),
        Ring(cw, (365, 235, 1540, 690), st[1] + 0.1, st[2] - 0.05),
        Ring(cw, (360, 495, 1090, 225), st[2] + 0.1, st[3] - 0.05),
        Ring(cw, (360, 812, 1545, 72), st[3] + 0.1, st[4] - 0.05),
        Ring(cw, (1450, 540, 440, 230), st[4] + 0.1, L_ + 0.3),
        TechTag('Cloud SQL', 'every client, every rule, on the record', go + 1.5, L_ + 0.3)])

    # ======================================================== 5 · live: everyone signs in (Priya in dark mode), and the app installed
    t0, t1 = t1, a('p01') - 0.3
    L_ = t1 - t0
    dark = Seqs([HERE / 'build' / 'signin-dark'], scale=0.5)          # 1180 x 820, her tablet's own pixels
    mv = json.loads((HERE / 'build' / 'signin-dark' / 'moves.json').read_text())
    sp = Window(None, None, [(0.8, 6.4)], 150, 380, 0.6, WS, who=who(PRIYA), seq=dark)
    keys = [(0.8, 420, 660, False)] + [(f / 25, x, y, True) for f, _, (x, y) in mv['clicks']]
    sl = Window('mango', 'L', [(23.4, 25.6), (29.4, 31.6)], 930, 330, 0.50, WS, who=who(LAKSHMI))
    sh = Window('mango', 'H', [(36.4, 39.4), (40.6, 42.4)], 1430, 330, 0.62, 'smartclearance-console.web.app', who=who(NEHA))
    add('signins', t0, t1, Split(Room('f-priya', 18, 0.6), Room('f-lakshmi-L', 18, 0.6)), [
        head(84, 60, 0.2, L_ + 0.3, 'LIVE ON PRODUCTION', 'Everyone signs in, on their own device.', width=1500, hsize=46),
        sp, sl, sh, Pointer(sp, keys, 0.3),
        TechTag('Firebase Authentication', 'email and password, one user pool', a('l01', 'Firebase') - t0 - 0.1, L_ + 0.3)])

    t0, t1 = t1, T['m02'][0] - PRE['m02'] - 0.2
    L_ = t1 - t0
    ins = InstallScene(L_, 0.25, max(1.5, a('p01', 'app') - t0 + 0.2), a('p01', 'phone') - t0 - 0.2, a('p01', 'alerts') - t0)
    add('install', t0, t1, ins, [])

    # ======================================================== 6 · the happy path: Munchly Mango Drink, Lakshmi Agencies
    t0, t1 = t1, a('m03') - 0.3
    L_ = t1 - t0
    go = 2.4 + 1.0
    pw = P3('mango', [(89.9, 96.5)], WS + '/command', u0=go + 1.15, enter=False)   # cut 6, 7b: trimmed so it plays under 1.3x
    add('detect', t0, t1, DeviceShot(Footage('f-priya'), Footage('s-priya'), pw, t_whip=1.5 + 1.0, t_go=go, mode='push', who=PRIYA), [
        pw,
        Sprite(words_sprite(kicker='02 · HAPPY PATH', head='Munchly Mango Drink 200 ml', width=900, hsize=40, kcolor='a'), 64, 64, 0.25, 1.5 + 1.0),
        AgentHead(64, 52, go + 1.2, L_ + 0.3, [(go + 1.2, 'watcher', [('gates.check', '22 days: fails Blinkit, Zepto, Instamart', 'bad'),
                                                                   ('sellthrough.project', '28/day × 15 days = 420 of 2,000', ''),
                                                                   ('pubsub.publish', 'batch.at_risk', 'ok')])],
                  "Priya gets the Watcher's alert.", calls_at=None, call_gap=1.1),
        PhonePop((470, 640), 0.45, 1.5 + 1.0 - 0.05, push='detect', width=420, side=-1, rise=-260),
        TechTag('BigQuery', '28 days of sell-through, every morning', a('m02', 'BigQuery') - t0 - 0.1, go + 1.1),
        SellThrough(64, 296, go + 1.5, L_ + 0.3, w=600),
        Ring(pw, (714, 56, 350, 112), go + 1.5, go + 3.4, card=card('A push, from the Watcher', 'MF-2410-118: 1,580 units will not sell before 24 Oct.', ('agent', 'WATCHER'), 400), at=(64, 600)),
        Ring(pw, (268, 420, 222, 68), go + 3.6, L_ + 0.3, card=card('₹22,657 at stake', '22 days left: too close for Blinkit, Zepto and Instamart.', ('live', 'WATCHER'), 400), at=(64, 600))])

    t0, t1 = t1, a('m04') - 0.3
    L_ = t1 - t0
    go = 2.4
    lw = L3('mango', [(111.3, 112.4), (114.9, 116.1), (122.3, 123.6), (141.5, 142.8)], WS + '/home', LAKSHMI, u0=go + 1.15, enter=False)   # each beat's own moment; 142.85: the stage's chapter card
    lab_inset = Inset(LABEL_PHOTO, 500, 236, 560, a('m03', 'Vision') - t0, L_ + 0.3, caption='The photo Lakshmi Agencies sent: batch, dates, MRP, FSSAI licence, barcode, QR')
    add('verify', t0, t1, DeviceShot(Footage('f-lakshmi'), Footage('s-lakshmi-label'), lw, t_whip=1.5, t_go=go, mode='lift', who=LAKSHMI), [
        lw,
        AgentHead(64, 52, go + 1.2, L_ + 0.3, [(go + 1.2, 'vision', [('gemini.read_label', 'MF-2410-118 · 24 Oct 2026 · ₹20 · 0.97', 'ok'),
                                                                  ('dms.reconcile', 'matches the stock export', 'ok')])],
                  'One photo of the label.', width=420, call_gap=1.2),
        PhonePop((500, 640), 0.35, 1.5 - 0.05, push='verify', width=420, side=-1, rise=-200),
        lab_inset,
        TechTag('Gemini 3.8 Flash', 'reads the printed label', a('m03', 'Gemini') - t0 - 0.1, L_ + 0.3, x=64),   # her tablet fills the right
        Ring(lw, (190, 760, 550, 160), lw.seg_start(3, L_ + XF) + 0.1, L_ + 0.3, card=card('Vision: it matches the export', 'MF-2410-118 · best before 24 Oct 2026 · MRP ₹20', ('agent', 'VISION'), 400), at=(64, 860))])

    t0, t1 = t1, a('m05') - 0.3
    L_ = t1 - t0
    pw = P3('mango', [(176.2, 178.8), (201.0, 202.15), (209.2, 212.0)], WS + '/route/MF-2410-118')   # 202.15: the stage's note card fades in from 202.4
    r_split, r_yes = a('m04', 'router') - t0 - 0.15, a('m04', 'approves') - t0 - 0.2
    r_rules, r_hist = a('m04', 'rules') - t0 - 0.2, a('m04', 'history') - t0 - 0.2
    # the yes: the Approve button until the sheet turns to "Plan placed" (211.3 in the recording), then that state
    s3, d3 = pw.seg_start(2, L_ + XF), pw.seg_durs(L_ + XF)[2]
    u_placed = s3 + (211.3 - 209.2) / (212.0 - 209.2) * d3
    add('approve', t0, t1, Room('s-priya', 16, 0.5), [
        AgentHead(64, 52, 0.2, L_ + 0.3, [(0.2, 'valuer', [('bigquery.price_history', 'beverages · 28 days of sell-through', ''),
                                                          ('cost_sheet.input_gst', '₹0.55 a pack', ''), ('writeoff.cost', '−₹14.34 a pack', 'bad')]),
                                          (r_split, 'router', [('allocate.greedy', '1,580 units → net ₹16,917', 'ok')]),
                                          (r_yes - 0.1, 'you', [])],
                  'Every exit priced. One yes.', call_gap=0.9),
        pw, Push(pw, 'plan', 0.2, 2.6),
        SplitWhy(70, 300, r_hist, r_rules, r_split),
        PlanFlow(70, 268, r_split, L_ + 0.3, 'packs at risk', 1580,
                 [('52 kiranas', 'the scheme', 1372, (52, 211, 128)), ('Staff sale', 'at the godown', 150, (115, 201, 157)),
                  ('Feeding India', 'donated', 58, (247, 192, 74))], w=640, h=400),
        TechTag('Gemini Pro', 'the Router explains its split in plain words', r_split + 0.3, r_yes - 0.1),
        Ring(pw, (660, 574, 398, 52), r_yes, u_placed - 0.05, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 400, 'a'), at=(64, 790)),
        Ring(pw, (662, 150, 394, 590), u_placed + 0.05, L_ + 0.3, card=card('Plan placed', '₹22,194 better than the bin. The agents set off.', ('result', 'APPROVED'), 400), at=(64, 790))])

    t0, t1 = t1, a('m05', 'each') - 0.3
    L_ = t1 - t0
    go = 2.2
    kw_ = H3('mango', [(245.4, 247.5)], WS + '/offer/MF-2410-118', KIRANA, u0=go + 1.15, enter=False)
    add('offer', t0, t1, DeviceShot(Footage('f-kirana'), Footage('s-kirana'), kw_, t_whip=1.4, t_go=go, mode='push', who=KIRANA), [
        kw_,
        AgentHead(64, 52, go + 1.2, L_ + 0.3, [(go + 1.2, 'outreach', [('fcm.send', '58 kiranas · Hindi', 'ok')])],
                  'The offer, in her own language.', width=700),
        PhonePop((600, 470), 0.3, 1.4 - 0.05, push='offer', width=420, side=-1, rise=-150),
        KiranaMap(64, 262, 600, 300, 'hyderabad', "LAKSHMI AGENCIES' KIRANAS · HYDERABAD", 'Begum Bazaar godown', go + 1.2, L_ + 0.3, go + 1.45, {},
                  [(lambda u: '58 kiranas · the offer in Hindi', AMBER)], seed=31),
        Ring(kw_, (18, 236, 396, 350), go + 1.6, L_ + 0.3, card=card('Hindi, here', "Outreach writes each offer in the shopkeeper's own language.", ('agent', 'OUTREACH'), 400), at=(64, 700))])

    t0, t1 = t1, a('m06') - 0.3
    L_ = t1 - t0
    h = Window('mango', 'H', [(249.4, 249.4 + L_ + XF)], 262, 300, 0.70, WS + '/offer/MF-2410-118', who=who(KIRANA), speed=1.0)   # under the agent's line
    p = Window('mango', 'P', [(249.4, 251.9), (259.6, 259.6 + max(0.5, L_ + XF - 2.5))], 760, 316, 0.98, WS + '/execution/MF-2410-118', who=who(PRIYA))
    add('orders', t0, t1, Split(Room('s-kirana', 18, 0.55), Room('s-priya', 18, 0.55), seam=0.36), [
        AgentHead(64, 30, 0.2, L_ + 0.3, [(0.2, 'outreach', [])], "An order on her phone. Live on Priya's screen.", width=1500),
        h, p,
        Ring(h, (22, 440, 404, 410), 0.25, 1.9),
        Ring(p, (258, 322, 200, 66), 2.0, L_ + 0.3, card=card("Live on Priya's screen", 'The order lands the moment the shop taps: 24 packets.', ('live', 'EXECUTION'), 400), at=(1460, 108)),
        TechTag('Pub/Sub', 'each order an event, to the screen at once', 2.0, L_ + 0.3, x=64)])   # under her phone: Priya's window fills the right

    t0, t1 = t1, a('m07') - 0.3
    L_ = t1 - t0
    split = a('m06', 'each') - t0 - 0.2
    pw = Window('mango', 'P', [(296.0, 437.0), (446.4, 448.4, 2.0)], 770, 250, 1.0, WS + '/execution/MF-2410-118', who=who(PRIYA), u1=split + 0.4)
    pw.fade_out = 0.4
    ff = (437.0 - 296.0) / max(0.5, split + 0.4 - 2.0)   # cut 7: the span the window plays it in (to split + 0.4), so the badge reads 52x
    inv = Paper('mango-kirana-h0-p0.png', [((260, 330, 560, 368), 'CGST and SGST, 2.5% each', 'B2C, within Telangana'),
                                          ((470, 386, 560, 404), '₹302 for 24 packets', 'Sri Lakshmi Ganapathi Kirana · LA/26-27/0972')], split, L_ + XF)
    # the map keeps pace with Priya's live screen beside it: its counts as the recording shows them (read frame by frame
    # off the fast-forward: 9 shops at 0.3 s … 51 at 2.7 s, then 'Filled at 10:32: 52 of 58'), first through the
    # fast-forward (a share of it), then at the recording's own pace once it slows
    ffw = split - 2.0
    def cu(fr=None, after=None): return fr * ffw if fr is not None else ffw + after
    cnt = [(0.25, 8), (cu(0.1302), 9), (cu(0.2604), 14), (cu(0.3906), 19), (cu(0.5208), 23), (cu(0.651), 29),
           (cu(0.7813), 34), (cu(0.9115), 41), (cu(1.0), 44), (cu(after=0.096), 45), (cu(after=0.396), 51), (cu(after=0.546), 52)]
    pks = [(0.25, 210), (cu(0.1302), 236), (cu(0.2604), 372), (cu(0.3906), 508), (cu(0.5208), 620), (cu(0.651), 776),
           (cu(0.7813), 908), (cu(0.9115), 1100), (cu(1.0), 1180), (cu(after=0.096), 1212), (cu(after=0.396), 1356), (cu(after=0.546), 1372)]
    ords = curve_states('hyderabad', cnt, seed=52, first='h0')
    pk_u, pk_v = [p_[0] for p_ in pks], [p_[1] for p_ in pks]
    add('fill', t0, t1, Room('s-priya', 16, 0.5), [
        AgentHead(64, 52, 0.2, split + 0.2, [(0.2, 'outreach', [('orders.sum', '1,372 units · 52 shops', 'ok')])], 'The scheme fills.', width=600),
        KiranaMap(64, 262, 600, 330, 'hyderabad', "LAKSHMI AGENCIES' KIRANAS · HYDERABAD", 'Begum Bazaar godown', 0.25, L_ + 0.3, None, ords,
                  [(lambda u, a_=pk_u, b_=pk_v: f"{n0(round(float(np.interp(u, a_, b_))))} of 1,372 packets", G),
                   (lambda u, o=ords: f"{sum(1 for st, t in o.values() if u >= t)} of 58 shops ordered", INK)], seed=31),
        InvoiceStack(64, 742, a('m06', 'each') - t0 - 0.9, L_ + 0.3),
        pw, Badge(f'Fast-forward {ff:.0f}×', 1640, 120, 0.3, split - 0.1),
        Ring(pw, (258, 668, 420, 46), split - 1.9, split + 0.1),
        PaperShow([inv], cx=1040, zx=1030)])

    t0, t1 = t1, a('m08') - 0.3
    L_ = t1 - t0
    vis = a('m07', 'receipt') - t0 - 0.3   # Vision's read once the payments have added up, as the voice reaches the receipt
    lw = L3('mango', [(470.6, 470.6 + 6.0)], WS + '/home', LAKSHMI, u0=vis, speed=1.0)
    sc = a('m07', 'packs') - t0
    upi = UpiScene(t_lift=1.44, t_pay=sc + 0.3, t_paid=a('m07', 'UPI') - t0 + 0.2, t_list=sc + 0.4,   # cut 7: the list fills as the phone pays
                   t_vision=vis, lwin=lw, L=L_)
    add('upi', t0, t1, upi, [
        head(64, 60, 0.2, vis, 'EXECUTE · STAFF SALE', 'Paid by UPI, one scan each.', width=900, hsize=44, stop=6),
        lw, Ring(lw, (110, 468, 705, 160), vis + 0.7, L_ + 0.3, card=card('18 UPI payments · ₹1,200', 'Vision read the receipt: it matches 150 packs at ₹8.', ('agent', 'VISION'), 400), at=(120, 880)),
        AgentHead(64, 52, vis, L_ + 0.3, [(vis, 'vision', [('gemini.read_receipt', '18 UPI payments · ₹1,200 = 150 × ₹8', 'ok')])], None)])

    t0, t1 = t1, a('m09', 'and') - 0.25
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
        PhonePop((960, 510), 0.3, 1.4 - 0.05, push='pickup', width=420, side=-1, rise=-330),
        head(64, 60, go + 1.2, rec_t, 'EXECUTE', 'Feeding India collects.', width=640, hsize=44, stop=6),
        PaperShow([rcpt, cn], cx=1040, zx=1030),
        DonationMeals(64, 250, rec_t + 0.2, cn_t + 0.1),   # cut 7: the left beside the receipt, the meals lighting
        AgentHead(64, 52, cn_t + 0.5, L_ + 0.3, [(cn_t + 0.5, 'paperwork', [('docs.credit_note', 'CN/0117 · ₹5,932', 'ok'), ('itc.memo', '₹837 kept', 'ok')])],
                  'Every paper, drafted and signed.', width=520),   # once the receipt has gone
        TechTag('Cloud Storage', 'every PDF, kept for good', a('m09', 'Cloud') - t0 - 0.1, L_ + 0.3)])

    t0, t1 = t1, T['s01'][0] - PRE['s01']
    L_ = t1 - t0
    ends = a('m09', 'Lakshmi') - t0
    res = SwingResult(0.15, L_ + 0.4, 'THE MANGO DRINK · HOW THE SWING ADDS UP', 'mango', 'MF-2410-118 · Lakshmi Agencies, Hyderabad',
                      16917.10, 22194.30,
                      [('If|destroyed', -22657.20, 'bin'), ('Kirana|scheme', 15778.00, 'gain'), ('Staff|sale', 1200.00, 'gain'),
                       ('Food|bank', -60.90, 'loss'), ('Not|paid', 5277.20, 'saved'), ('With|the plan', -462.90, 'plan')],
                      [('Lakshmi Agencies ends whole · ₹0', 'good'), ('339.7 kg kept out of landfill', 'good'), ('Every paper signed', 'good')],
                      [ends, ends + 0.5, ends + 1.0], ('mango', 814.0), bg=Room('f-lakshmi-L', 14, 0.62).img, t0=0.35, every=0.26)   # cut 6: a shorter shot
    add('mango-result', t0, t1, res, [TechTag('Cloud SQL', 'every rupee, worked out on the record', 0.4, ends - 0.05)])

    # ======================================================== 7 · the sad path: Munchly Masala Chips, Rakesh Traders
    t0, t1 = t1, a('s02') - 0.3
    L_ = t1 - t0
    go = 2.6
    rw = L3('sad', [(440.0, 440.0 + 6.0)], WS + '/deliveries/MF-2409-117', RAKESH, u0=go + 1.15, enter=False, speed=1.0)
    add('chips', t0, t1, DeviceShot(Footage('f-rakesh'), Footage('s-rakesh'), rw, t_whip=1.8, t_go=go, mode='lift', who=RAKESH), [
        rw,
        head(64, 60, 0.4, L_ + 0.3, '03 · SAD PATH · MUNCHLY MASALA CHIPS 150 G', 'Not every batch sells.', width=640, hsize=44, kcolor='a'),
        PhonePop((1480, 600), 0.45, 1.8 - 0.05, card=action_card('Outreach · the scheme is out', '38 kiranas in Nagpur: 10 packets, 2 free, 48 hours to order.', 'send', 420), side=1, rise=-300),
        KiranaMap(64, 206, 600, 300, 'nagpur', "RAKESH TRADERS' KIRANAS · NAGPUR", 'Kalamna Market godown', go + 1.15, L_ + 0.3, go + 1.35, sad_states(go + 2.0, go + 3.3),
                  [(lambda u, g=go: '2 ordered · 48 packets' if u >= g + 2.3 else ' ', G), (lambda u, g=go: f"{max(1, int(round(35 * clamp((u - g - 2.0) / 1.3))))} said not this time" if u >= g + 2.05 else ' ', RED),
                   (lambda u, g=go: '1 never answered' if u >= g + 3.3 else ' ', (160, 170, 166))], seed=7),
        Ring(rw, (530, 668, 283, 58), go + 1.5, go + 3.4),
        Ring(rw, (92, 858, 740, 118), go + 3.6, L_ + 0.3, card=card('Two shops, 48 packets', 'Shree Ganesh Kirana and Jai Durga Stores, 24 each, on the van round.', ('live', 'DELIVERIES'), 400), at=(64, 840))])

    t0, t1 = t1, a('s03') - 0.3
    L_ = t1 - t0
    go = 2.2
    d0 = a('s02', 'counters') - 0.3 - t0 - (go + 1.15)   # the counter on screen as the voice says it
    aw = H3('sad', [(441.0, 441.0 + max(0.6, d0), max(0.6, d0)), (449.3, 451.1), (460.0, 462.6)], WS + '/market/ES-24117', AGRAWAL, u0=go + 1.15, enter=False)   # the bid held at 1x
    q1, q2 = aw.seg_start(1, L_ + XF), aw.seg_start(2, L_ + XF)
    add('lot', t0, t1, DeviceShot(StillFace('f-agrawal'), Footage('s-agrawal'), aw, t_whip=1.4, t_go=go, mode='push', who=AGRAWAL), [
        aw,
        AgentHead(64, 52, go + 1.2, L_ + 0.3, [(go + 1.2, 'negotiator', [('listing.bid', 'Agrawal Wholesale · ₹13.00 for 772', ''),
                                                                        ('listing.counter', '₹13.00 → ₹14.20, 24-hour dispatch', 'ok')])],
                  'The Negotiator sells the lot.', call_gap=1.0),
        PhonePop((520, 560), 0.3, 1.4 - 0.05, push='counter', width=420, side=-1, rise=-260),
        ExpireSoonCard(64, 236, go + 1.2, L_ + 0.3),
        PriceLadder(64, 440, go + 1.5, go + 1.75, q1 + 0.1, q2 + 0.15, L_ + 0.3),
        Ring(aw, (16, 400, 418, 152), go + 1.4, q1 - 0.05),
        Push(aw, 'counter', q1 + 0.1, q2 - 0.1),
        Ring(aw, (14, 364, 422, 220), q2 + 0.1, L_ + 0.3)])

    t0, t1 = t1, T['v01'][0] - PRE['v01']
    L_ = t1 - t0
    pw = P3('sad', [(501.6, 505.6)], WS + '/execution/MF-2409-117')
    add('window', t0, t1, Room('s-priya-eve', 16, 0.5), [
        head(64, 60, 0.2, L_ + 0.3, 'EXECUTE', 'The offer window closes.', width=640, hsize=48, stop=6),
        WindowFunnel(64, 210, 0.35, L_ + 0.3),
        pw, Ring(pw, (265, 348, 438, 52), 0.6, 2.4), Ring(pw, (262, 418, 200, 66), 2.6, L_ + 0.3)])

    t0, t1 = t1, a('s04') - 0.3
    L_ = t1 - t0
    t_cut = a('v01', 'truck') - t0 - 0.9     # the van at the kirana, then the buyer's truck at the godown
    add('deliveries', t0, t1, TwoClips('dl-kirana', 'dl-truck', t_cut, DL_OFF[0], DL_OFF[1]), [
        head(64, 60, 0.3, L_ + 0.3, 'EXECUTE · DELIVERIES', 'The van round. The lot collected.', width=760, hsize=44, stop=6),
        RouteInset(1386, 104, 0.4, 0.6, t_cut + 0.2, L_ + 0.3),   # under the live tag
        Sprite(card('Rakesh Traders\' Saturday van round', 'Shree Ganesh Kirana and Jai Durga Stores: 24 packets each, with the invoice.', ('live', 'DELIVERIES'), 420), 64, 820, 0.6, t_cut + 0.2),
        Sprite(card('Agrawal Wholesale\'s truck', 'Lot ES-24117: 772 packs at ₹14.20, back to Raipur.', ('result', 'EXPIRESOON'), 420, 'a'), 64, 820, t_cut + 0.5, L_ + 0.3)])

    t0, t1 = t1, a('s05') - 1.3
    L_ = t1 - t0
    rw = L3('sad', [(562.6, 563.9), (574.4, 576.6)], WS + '/home', RAKESH)   # 562.6: past the stage's chapter card
    add('destroy-ask', t0, t1, Room('f-rakesh-L', 16, 0.55), [
        head(64, 60, 0.2, L_ + 0.3, 'EXPIRY DAY', 'Destroy them, and prove it.', width=700, hsize=48, stop=7),
        ProofPlan(64, 214, 0.35, L_ + 0.3),
        rw, Push(rw, 'destroy', 0.2, 3.0)])

    t0, t1 = t1, a('s05', 'and') - 0.25
    L_ = t1 - t0
    shot_at = 1.9 * 24 / 25    # the clip's own 1.9 s, played at 25 fps
    after = cv2.imread(str(EVID / 'destruction-after-540-packs.webp'))
    ins_b = Inset(EVID / 'destruction-before-540-packs.webp', 360, 250, 580, shot_at + 0.7, L_ + 0.3, caption='Before: 540 packs at the godown, the batch slip in view')
    ins_a = Inset(EVID / 'destruction-after-540-packs.webp', 1000, 250, 580, shot_at + 1.1, L_ + 0.3, caption='After: buried at the landfill, with the slate')
    add('landfill', t0, t1, CamView('s-landfill-photo', screen_of('s-landfill-photo'), shot_at, photo=after, hold=shot_at + 0.6), [
        Flash(shot_at), ins_b, ins_a,
        # cut 7: Vision reads each photo as it lands, its checks as the review lists them
        VisionScan([ins_b, ins_a], [shot_at + 0.75, shot_at + 1.1],
                   [['Batch MF-2409-117 on the slip', 'About 540 packs in view'], ['Slate: MF-2409-117 · 540 · 03-10', 'Taken today, at the landfill']], L_ + 0.3),
        head(64, 60, 0.2, L_ + 0.3, 'SETTLE', 'Destroyed, against evidence.', width=640, hsize=44, stop=7)])

    t0, t1 = t1, a('s06') - 0.3
    L_ = t1 - t0
    go = 1.1
    rw = L3('sad', [(621.2, 624.4), (661.6, 662.9)], WS + '/destroy/MF-2409-117', RAKESH, u0=go + 1.15, enter=False)
    add('sign', t0, t1, DeviceShot(None, Footage('s-landfill-sign'), rw, t_whip=0.0, t_go=go, mode='lift', who=None), [
        rw,
        head(64, 60, go + 1.0, L_ + 0.3, 'SETTLE', 'The certificate, signed in place.', width=640, hsize=44, stop=7),
        SignSlots(64, 236, go + 1.0, L_ + 0.3),
        Ring(rw, (146, 728, 634, 280), rw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, card=card('4 of 4 signatures', 'The officer, two witnesses and Rakesh · OCE/DC/26-27/0219', ('proof', 'CERTIFICATE'), 400), at=(64, 620))])

    t0, t1 = t1, T['r01'][0] - PRE['r01'] - 0.1          # cut 6: the papers issued, then the record just before its line
    L_ = t1 - t0
    go = 1.1
    pw = P3('sad', [(697.0, 697.9), (721.1, 722.4), (751.3, 754.3)], WS + '/execution/MF-2409-117', u0=go + 1.15, enter=False)   # 697.0: past the stage's own ring on Vision's checks; 754.4: the stage rings a signature
    y1, y2 = pw.seg_start(1, L_ + XF), pw.seg_start(2, L_ + XF)
    add('second-yes', t0, t1, DeviceShot(None, Footage('s-priya-eve'), pw, t_whip=0.0, t_go=go, mode='push', who=None), [
        pw,
        AgentHead(64, 52, go + 1.0, L_ + 0.3, [(go + 1.0, 'vision', [('gemini.read_destruction', '4 of 4 checks · 540 packs', 'ok')]),
                                                (y1, 'you', []),
                                                (y2, 'paperwork', [('docs.certificate', 'OCE/DC/26-27/0219', 'ok'), ('docs.expiry_credit', 'CN/0118 · ₹13,284', 'ok')])],
                  "Priya's second yes.", call_gap=0.6),
        ChecksPanel(64, 268, go + 1.2, y1 + 0.1, L_ + 0.3),
        Ring(pw, (655, 325, 405, 195), go + 1.3, y1 - 0.1),
        Ring(pw, (790, 676, 262, 50), y1 + 0.1, y1 + 1.05, accent='a'),
        Ring(pw, (650, 160, 400, 560), y2 + 0.1, L_ + 0.3, card=card('Certificate and expiry credit note', 'OCE/DC/26-27/0219 · CN/0118 ₹13,284', ('proof', 'PAPERWORK'), 400), at=(64, 620))])

    t0, t1 = t1, a('s07') - 0.3
    L_ = t1 - t0
    rec = Seqs([HERE / 'build' / 'record2'], scale=0.5)         # 1180 x 820, her tablet's own pixels: the photos, then
    rw_ = Window(None, None, [(1.9, 4.88, 2.4), (4.88, 11.28)], 96, 214, 0.78, WS + '/record/MF-2409-117', seq=rec)   # the audit trail, held
    u_sql, u_tr = a('r01', 'Cloud') - t0 - 0.1, a('r01', 'requests') - t0 - 0.25
    u_rest = 2.4 + 0.1                                     # the scroll comes to rest on the audit trail
    ua = max(u_sql - 1.0, u_rest)
    add('audit', t0, t1, Room('s-priya-eve', 18, 0.62), [
        head(64, 60, 0.2, L_ + 0.3, 'ON THE RECORD', 'Every step, every yes.', width=700, hsize=44),
        TiltIn(rw_, 0.1),
        Ring(rw_, (272, 120, 892, 700), ua, u_tr - 0.15, card=card('63 steps · 3 yeses, in their names', "Every agent's run, every person's step and every yes, append-only, in Cloud SQL.", ('proof', 'AUDIT TRAIL'), 420), at=(1100, 420)),
        Ring(rw_, (290, 436, 500, 52), u_tr - 0.1, L_ + 0.3),
        TraceLink(rw_, (790, 462), u_tr + 0.1, L_ + 0.3, (1080, 300), elbow=1048),
        TracePanel(1100, 176, u_tr, u_tr + 0.4, L_ + 0.3, w=760),
        LogPanel(1100, 786, u_tr + 2.4, L_ + 0.3, w=760),
        TechTag('Cloud SQL', 'an append-only audit trail', u_sql, u_tr),
        TechTag('Cloud Trace', 'OpenTelemetry, from the tap to the model', u_tr + 0.3, L_ + 0.3)])

    t0, t1 = t1, a('m10') - 0.3
    L_ = t1 - t0
    ends = a('s07', 'Rakesh') - t0
    res = SwingResult(0.15, L_ + 0.4, 'THE MASALA CHIPS · HOW THE SWING ADDS UP', 'chips', 'MF-2409-117 · Rakesh Traders, Nagpur',
                      11702.40, 14868.00,
                      [('If|destroyed', -26329.60, 'bin'), ('Kirana|scheme', 840.00, 'gain'), ('ExpireSoon|lot', 10862.40, 'gain'),
                       ('Not|paid', 3165.60, 'saved'), ('With|the plan', -11461.60, 'plan')],
                      [('Rakesh Traders ends whole · ₹0', 'good'), ('Certificate signed by four', 'good'), ('Every rupee on the record', 'good')],
                      [ends, ends + 0.5, ends + 1.0], ('sad', 1009.0), bg=Room('f-rakesh-L', 14, 0.62).img, t0=0.8, every=0.42)
    add('chips-result', t0, t1, res, [])

    # ======================================================== 8 · Impact's ledger: the year so far, then the batch's BRSR line
    t0, t1 = t1, a('f01') - 0.35
    L_ = t1 - t0
    u_br = a('m10', 'ready') - t0 - 0.25
    # the headline (720.05), the dashboard scrolled (three clean spans between the stage's rings), the batch's BRSR line (734.0)
    iw = Window('mango', 'P', [(720.05, 721.45, 2.95), (721.95, 722.6), (724.8, 725.3), (728.6, 730.0), (734.0, 735.8, L_ + XF - u_br)],
                770, 250, 1.0, WS + '/report', who=who(PRIYA))
    add('impact', t0, t1, Room('s-priya-eve', 16, 0.55), [
        TiltIn(iw, 0.1),
        AgentHead(64, 52, 0.25, L_ + 0.3, [(0.25, 'impact', [('ledger.post', 'MF-2410-118 · ₹16,917', 'ok'), ('brsr.rows', 'Principle 6', 'ok')])],
                  'The ledger, the year so far.', call_gap=1.2),
        Ring(iw, (240, 248, 420, 74), 0.95, 3.1,
             card=card('2.30 t kept out of landfill', 'FY 2026-27 so far: 2.07 t resold, 224.6 kg donated, 930 meals.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (265, 74, 783, 112), 3.3, u_br - 0.1,
             card=card('68 kg destroyed · 5.75 t CO₂e avoided', '97.1% of the food saved, every batch on the record.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (252, 237, 765, 186), u_br + 0.15, L_ + 0.3, accent='a',
             card=card('Ready for BRSR', "The batch's own BRSR line: 339.7 kg diverted, 58 meals, with its evidence.", ('proof', 'BRSR'), 420, 'a'), at=(64, 330)),
        KiloBars(64, 560, 0.9, L_ + 0.3),   # cut 7: the left under the cards, the year's kilos growing on one scale
        TechTag('BigQuery', 'the impact ledger, one row an exit', a('m10', 'BigQuery') - t0 - 0.1, L_ + 0.3)])

    live = [x.name for x in S]
    a0, a1 = live.index('signins'), live.index('impact')
    for i in range(a0, a1 + 1):
        S[i].items.append(LiveTag(fin=(i == a0), fout=(i == a1)))

    # ======================================================== 9 · what comes next, and the guided demo to try
    t0, t1 = t1, T['d01'][1] + 0.15
    L_ = t1 - t0
    nx = NextScene6(L_, a('f01', 'WhatsApp') - t0, a('f01', 'more') - t0, a('f01', 'native') - t0,
                    a('d01') - t0 - 0.15, a('d01') - t0 - 0.55, t_kick=a('f01') - t0 - 0.1, phones=native_phones())
    add('next', t0, t1, nx, [])

    # ======================================================== 10 · the close: the line on the card, not said (cut 6
    # condenses the close); the voice says where the live app's sign-ins and the sample data are
    t0, t1 = t1, END
    tag = ['Ten', 'agents,', 'one', 'yes,', 'and', 'nothing', 'good', 'goes', 'to', 'waste.']
    words = [(w, 1.25 + 0.075 * i) + (((247, 192, 74),) if w == 'yes,' else ()) for i, w in enumerate(tag)]
    add('end', t0, t1 - XF, EndCard6(t1 - t0, words, [a('c01') - t0 - 0.1, a('c01', 'sample') - t0 - 0.1]),
        [Blackout(t1 - t0 - 1.0, t1 - t0 - 0.05, into=True)])
    S[-1].t1 = END
    return S

if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s')
    print('END', END)
