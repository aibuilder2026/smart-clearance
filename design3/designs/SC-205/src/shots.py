"""SC-205: the film's shots, laid on the voice. Times come from the voice-over's own word timings (at()), so each
screen, ring and card lands on the words that name it. Screen rects are in the device's own pixels (measured on the
frames with gridshot.py)."""
from parts import *

D3 = REPO / 'design3'
CLIP = {
    'n1': HERE / 'clips' / 'n1-factory-line.mp4', 'n2': HERE / 'clips' / 'n2-mango-godown.mp4', 'n3': HERE / 'clips' / 'n3-chips-godown-dusk.mp4',
    'c53': D3 / 'designs' / 'SC-187' / 'media' / 'c53-qc-dock.mp4', 'c54': D3 / 'designs' / 'SC-187' / 'media' / 'c54-write-off.mp4',
    'f1': D3 / 'designs' / 'SC-154' / 'media' / 'final-1-bay-dawn-v3.mp4',
}
# each clip retimed to its shot by slow.sh (motion-interpolated to 25 fps): speed, and whether it is a 720p source.
# n2 keeps its first 4 s, before its push speeds up; the chips' title is its keyframe on a slow push (both LTX takes
# of it jolted and changed perspective mid-clip)
SLOW = {'n1': (0.78, ''), 'n2': (0.68, ''), 'c53': (0.9, '720'), 'c54': (0.9, '720'), 'f1': (0.95, '')}
STILL = {k: HERE / 'img' / f'{v}.png' for k, v in {'n1': 'n1-factory-line', 'i2': 'i2-hold', 'i3': 'i3-landfill'}.items()}
XF = 0.45  # the dissolve between shots

class Still:
    """a keyframe as the frame, pushed in slowly about a focus point, in float pixels"""
    def __init__(self, path, z0=1.0, z1=1.06, dur=6.0, scrim=None, focus=(0.5, 0.5)):
        im = cv2.imread(str(path))
        k = max(W / im.shape[1], H / im.shape[0])
        self.img, self.k, self.z0, self.z1, self.dur, self.scrim, self.focus = im, k, z0, z1, dur, scrim, focus
    def draw(self, f, u, L=None):
        z = self.z0 + (self.z1 - self.z0) * ease_in_out(u / self.dur)
        s = self.k * z
        fx, fy = self.focus[0] * W, self.focus[1] * H
        # the focus point stays where the fitted image puts it; everything else grows away from it
        bx, by = W / 2 - self.img.shape[1] * self.k / 2, H / 2 - self.img.shape[0] * self.k / 2
        tx, ty = fx - (fx - bx) * z, fy - (fy - by) * z
        _, _, p = place(self.img, s, tx, ty, (0, 0, W, H))
        f[:] = p
        if self.scrim: scrim(f, self.scrim)

def clip_or_still(key, start=0.0, scrim=None, dur=6.0):
    slow = HERE / 'build' / 'slow' / f'{key}.mp4'
    if slow.exists(): return Clip(slow, start=start, speed=1.0, fps=FPS, scrim=scrim)
    if key in STILL and STILL[key].exists(): return Still(STILL[key], dur=dur + XF, scrim=scrim, focus=(0.8, 0.42))
    if key in STILL: return Studio()
    return Clip(CLIP[key], start=start, speed=SLOW[key][0], fps=24, scrim=scrim)

class Shot:
    def __init__(self, name, t0, t1, bg, items=()):
        self.name, self.t0, self.t1, self.bg, self.items = name, t0, t1, bg, list(items)
    def draw(self, f, t):
        u, L = t - self.t0, self.t1 - self.t0
        self.bg.draw(f, u)
        for it in self.items:
            it.draw(f, u, L)

class Stack:
    def __init__(self, *items): self.items = items
    def draw(self, f, u, L=None):
        for it in self.items: it.draw(f, u, L)

class Late:
    """an item shown from u0 on (a second background over the first, faded in)"""
    def __init__(self, item, u0, fin=0.45):
        self.item, self.u0, self.fin = item, u0, fin
        self.buf = None
    def draw(self, f, u, L=None):
        if u < self.u0: return
        a = ease_in_out((u - self.u0) / self.fin)
        if a >= 1: self.item.draw(f, u - self.u0, L); return
        if self.buf is None: self.buf = np.zeros_like(f)
        self.item.draw(self.buf, u - self.u0, L)
        f *= (1 - a); f += self.buf * a

# ---------------------------------------------------------------- layouts (rest places, integer pixels)

def P1(rec, segs, url, **kw):   # Priya's landscape tablet alone, at its own pixels
    return Window(rec, 'P', segs, 780, 196, 1.0, url, who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'priya'), **kw)
def L1(rec, segs, url, who, **kw):
    return Window(rec, 'L', segs, 1170, 170, 0.70, url, who=who, **kw)
def H1(rec, segs, url, who, **kw):
    return Window(rec, 'H', segs, 1240, 180, 0.86, url, who=who, **kw)
def A1(segs, url, **kw):
    return Window('admin', 'A', segs, 500, 184, 0.70, url, who=('Neha Kulkarni', 'Smart-Clearance staff · console', 'neha'), **kw)
def HP(rec, hsegs, psegs, hurl, purl, hwho, **kw):
    h = Window(rec, 'H', hsegs, 284, 281, 0.76, hurl, who=hwho)
    p = Window(rec, 'P', psegs, 695, 365, 0.88, purl, who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'priya'))
    return h, p
def LP(rec, lsegs, psegs, lurl, purl, lwho):
    l = Window(rec, 'L', lsegs, 210, 315, 0.58, lurl, who=lwho)
    p = Window(rec, 'P', psegs, 771, 365, 0.88, purl, who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'priya'))
    return l, p

NEHA = ('Neha Kulkarni', 'Smart-Clearance staff · console', 'neha')
LAKSHMI = ('Lakshmi Agencies', 'Distributor · Hyderabad', 'lakshmi')
RAKESH = ('Rakesh Traders', 'Distributor · Nagpur', 'rakesh')
CON = 'smartclearance-console.web.app/clients/munchly'
WS = 'munchly-smartclearance.web.app'

def card(title, body='', tag=None, w=380, accent='g'):
    return card_sprite(title, body, tag, w, accent)

def head(x, y, u0, u1, kicker, headline, sub=None, width=640, hsize=50, kcolor='g', stop=None):
    return Words(x, y, u0, u1, kicker=kicker, head=headline, sub=sub, width=width, hsize=hsize, kcolor=kcolor, stop=stop)

# cut 2 layouts: a person's panel on the left, their own device's live screen on the right
PX, PY, PW, PH = 64, 330, 800, 450          # the person's panel
def CP(rec, segs, url, **kw):   # with a landscape tablet (Priya)
    return Window(rec, 'P', segs, 920, 330, 0.86, url, **kw)
def CL(rec, segs, url, **kw):   # with a portrait tablet (a distributor)
    return Window(rec, 'L', segs, 920, 252, 0.62, url, **kw)
def CH(rec, segs, url, **kw):   # with a phone
    return Window(rec, 'H', segs, 920, 250, 0.78, url, **kw)
def person(key, name, role, **kw):
    return Character(key, PX, PY, PW, PH, name, role, **kw)
PRIYA = ('Priya Deshmukh', 'Supply chain · Munchly Foods')
LAK = ('Lakshmi Agencies', 'Distributor · Hyderabad')
RAK = ('Rakesh Traders', 'Distributor · Nagpur')
LABEL = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-mango-drink-MF-2410-118' / 'label-photo.webp'

class Steps:
    """the console's setup as five steps under Neha's panel, each lit as its screen plays"""
    def __init__(self, names, starts, x, y):
        self.names, self.starts, self.x, self.y = names, starts, x, y
    def draw(self, f, u, L=None):
        for i, (n, t0) in enumerate(zip(self.names, self.starts)):
            on = u >= t0
            a = clamp((u - 0.3) / 0.4)
            blit(f, chip_sprite(n, 'good' if on else 'dot', 22), self.x, self.y + i * 58, a * (1.0 if on else 0.45))

def build():
    S = []
    def add(name, t0, t1, bg, items=()):
        S.append(Shot(name, t0, t1 + XF, bg, items))
    def a(lid, word=None, k=0): return at(lid, word, k)

    # ======================================================== 1 · the problem, condensed; the product; the agents
    t0, t1 = 0.0, a('i01', 'write') - 0.1
    add('factory', t0, t1, clip_or_still('n1', scrim='lowleft', dur=t1), [
        head(84, 860, 0.5, t1 + 0.3, "INDIA'S FMCG SUPPLY CHAIN", 'Millions of packs, every day.', width=900, hsize=50), Blackout(0.0, 0.7)])

    t0, t1 = t1, a('i02') - 0.15
    L_ = t1 - t0
    add('hold', t0, t1, clip_or_still('i2', scrim='lowleft', dur=L_), [
        head(84, 860, 0.25, L_ + 0.3, 'NEAR EXPIRY', "Some batches don't sell in time.", width=900, hsize=50)])

    t0, t1 = t1, a('i04') - 0.2
    L_ = t1 - t0
    add('landfill', t0, t1, clip_or_still('i3', scrim='lowleft', dur=L_), [
        Sprite(chip_sprite('Too close to expiry for quick commerce', 'bad', 28), 84, 700, a('i02', 'Too') - t0, L_ + 0.3),
        Sprite(chip_sprite('Destroyed', 'bad', 28), 84, 776, a('i02', 'destroyed') - t0, L_ + 0.3),
        Sprite(chip_sprite('GST input credit reversed', 'bad', 28), 84, 852, a('i02', 'GST') - t0, L_ + 0.3)])

    t0, t1 = t1, a('i05') - 0.3
    L_ = t1 - t0
    add('brand', t0, t1, Studio(), [Brand(520, 420, 0.15, L_ + 0.5, sub='turns write-offs into recovery.')])

    t0, t1 = t1, a('i06') - 0.35
    L_ = t1 - t0
    land = Seqs([HERE / 'build' / 'landing' / s_ for s_ in ('hero', 'teams', 'agents', 'yes')], scale=0.5)
    win = Window(None, None, [(0.3, 3.4), (6.5, 9.6), (15.0, 19.0)], 600, 230, 0.78, 'smartclearance.web.app', seq=land, radius=14)
    add('landing', t0, t1, Studio(), [
        head(84, 330, 0.2, L_ + 0.3, 'SOFTWARE AS A SERVICE', 'A workspace for every brand.',
             sub='AI agents find the best exit for every pack at risk, before anything is destroyed.', width=470, hsize=50),
        win])

    t0, t1 = t1, a('k01') - 0.3
    L_ = t1 - t0
    s0 = t0
    def u(lid, word=None, k=0): return a(lid, word, k) - s0
    warp = [(0.0, 0), (u('i06', 'walk'), 71), (u('i07', 'Watcher'), 124), (u('i07', 'Vision'), 176), (u('i07', 'Valuer'), 229),
            (u('i07', 'Router'), 281), (u('i08', 'one'), 334), (u('i09', 'Outreach'), 434), (u('i09', 'Paperwork'), 546),
            (u('i09', 'Impact'), 599), (T['i09'][1] - s0 + 0.3, 651)]
    add('agents', t0, t1, AgentsScene(warp, open_at=(1.5, 3.5)), [
        head(60, 34, 2.9, L_ + 0.3, 'AGENTIC ARCHITECTURE', 'Ten agents. Nine stops. One human yes.', width=1200, hsize=42),
        Arch(3.6, L_ + 0.3)])

    # ======================================================== 2 · the console: a brand set up in minutes
    t0, t1 = t1, a('l01') - 0.3
    L_ = t1 - t0
    segs = [(55.4, 57.4), (107.2, 108.1), (113.8, 115.4), (130.8, 132.6), (143.9, 146.0), (154.2, 156.8), (199.6, 202.6), (214.0, 216.6)]
    cw = Window('admin', 'A', segs, 670, 290, 0.62, 'smartclearance-console.web.app')
    st = [cw.seg_start(i, L_ + XF) for i in range(len(segs))]
    neha = Character('n1-neha-console', 64, 300, 560, 315, 'Neha Kulkarni', 'Smart-Clearance staff · console')
    add('console', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, 'THE CONSOLE · A BRAND IN MINUTES', 'Set up, tuned, watched live.', width=1100, hsize=46),
        neha, cw,
        Steps(['Every client, live', 'Stock export, mapped', 'People, invited', 'SKU gates, per SKU', 'Agents, tuned'],
              [0.0, st[1], st[3], st[4], st[6]], 64, 680),
        Ring(cw, (360, 265, 1545, 205), 0.4, st[1] - 0.05),
        Ring(cw, (365, 235, 1540, 690), st[1] + 0.1, st[3] - 0.05),
        Ring(cw, (360, 495, 1090, 225), st[3] + 0.1, st[4] - 0.05),
        Ring(cw, (360, 812, 1545, 72), st[4] + 0.1, st[5] - 0.05),
        Ring(cw, (1320, 150, 575, 340), st[5] + 0.1, st[6] - 0.05),
        Ring(cw, (1450, 540, 440, 230), st[6] + 0.1, st[7] - 0.05),
        Ring(cw, (1450, 355, 440, 235), st[7] + 0.1, L_ + 0.3)])

    # ======================================================== 3 · live: the sign-ins
    t0, t1 = t1, a('m01') - 0.35
    L_ = t1 - t0
    sp = Window('mango', 'P', [(2.6, 5.4), (8.4, 13.6), (15.6, 18.6)], 182, 360, 0.70, 'munchly-smartclearance.web.app',
                who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'priya'))
    sl = Window('mango', 'L', [(19.6, 21.6), (23.4, 25.6), (29.4, 31.6), (35.6, 38.0)], 987, 320, 0.50, 'munchly-smartclearance.web.app',
                who=('Lakshmi Agencies', 'Distributor · Hyderabad', 'lakshmi'))
    sh = Window('mango', 'H', [(36.4, 39.4), (40.6, 44.0), (44.4, 46.2)], 1460, 320, 0.62, 'smartclearance-console.web.app',
                who=('Neha Kulkarni', 'Smart-Clearance staff', 'neha'))
    add('signins', t0, t1, Studio(), [
        head(84, 60, 0.2, L_ + 0.3, '01 · THE APPS, LIVE', 'Everyone signs in, on their own device.', width=1500, hsize=46),
        sp, sl, sh])

    # ======================================================== 4 · the happy path: Munchly Mango Drink, Lakshmi Agencies
    t0, t1 = t1, a('m02') - 0.3
    L_ = t1 - t0
    ph = H1('mango', [(47.9, 47.9 + L_ + XF)], CON, NEHA, speed=1.0)
    add('rehearsal', t0, t1, Studio(), [
        head(84, 250, 0.2, L_ + 0.3, '02 · MUNCHLY MANGO DRINK 200 ML · DEMO SETUP', 'Rehearsal: one journey day passes in an hour.',
             sub="Munchly's batches keep their real best-before dates, so the whole journey plays in minutes.", width=760, hsize=50, kcolor='a'),
        ph,
        Ring(ph, (18, 367, 416, 80), a('m01', 'Rehearsal') - t0, 6.45, accent='a',
             card=card('Rehearsal · 1 day = 1 hour', "Real time, Rehearsal, Demo or Fast: the journey clock is the console's to set.", ('demo', 'DEMO SETUP'), 400, 'a'), at=(760, 560)),
        Ring(ph, (14, 814, 424, 74), 6.65, L_ + 0.3, card=card('Journey reset to day 0', "Every open batch starts again from the story's first morning.", None, 400), at=(760, 860))])

    t0, t1 = t1, a('m03') - 0.3
    L_ = t1 - t0
    pw = CP('mango', [(88.4, 98.2)], WS + '/command')
    add('detect', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · DETECT', "Priya gets the Watcher's alert.", width=1500, hsize=46, stop=1),
        person('m1-priya-desk', *PRIYA), pw,
        Ring(pw, (714, 56, 350, 112), 1.5, 3.8, card=card('A push, from the Watcher', 'MF-2410-118: 1,580 units will not sell before 24 Oct.', ('agent', 'WATCHER'), 380), at=(PX + 20, PY + PH + 40)),
        Ring(pw, (268, 420, 222, 68), 4.0, L_ + 0.3, card=card('₹22,657 at stake', '22 days left: too close for Blinkit, Zepto and Instamart.', ('live', 'WATCHER'), 380), at=(PX + 20, PY + PH + 40))])

    t0, t1 = t1, a('m04') - 0.3
    L_ = t1 - t0
    lw = CL('mango', [(110.4, 112.4), (114.4, 116.6), (122.0, 124.4), (141.4, 143.9)], WS + '/home')
    add('verify', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · VERIFY', 'One photo of the label. Vision checks it.', width=1500, hsize=46, stop=2),
        person('m2-lakshmi-photo', *LAK, kf='m2-lakshmi-photo'), lw,
        Push(lw, 'verify', 0.25, 2.9),
        Inset(LABEL, 1490, 300, 380, lw.seg_start(1, L_ + XF), L_ + 0.3, caption='The photo Lakshmi Agencies sent'),
        Ring(lw, (190, 760, 550, 160), lw.seg_start(3, L_ + XF) + 0.1, L_ + 0.3, card=card('Matches the export', 'MF-2410-118 · best before 24 Oct 2026 · MRP ₹20', ('agent', 'VISION'), 380), at=(1490, 640))])

    t0, t1 = t1, a('m05') - 0.3
    L_ = t1 - t0
    pw = CP('mango', [(176.2, 178.8), (201.0, 202.5), (209.2, 212.0)], WS + '/route/MF-2410-118')
    add('approve', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · VALUE · APPROVE', 'Every exit priced. One yes.', width=1500, hsize=46, stop=5),
        person('m3-priya-approve', *PRIYA, kf='m3-priya-approve'), pw,
        Push(pw, 'plan', 0.2, 2.6),
        Ring(pw, (245, 196, 495, 300), 0.4, pw.seg_start(1, L_ + XF) - 0.05),
        Ring(pw, (660, 574, 398, 52), pw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 380, 'a'), at=(PX + 20, PY + PH + 40))])

    t0, t1 = t1, a('m05', 'A') - 0.3
    L_ = t1 - t0
    kw_ = CH('mango', [(245.4, 249.4)], WS + '/offer/MF-2410-118')
    add('offer', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'The offer, in their own language.', width=1500, hsize=46, stop=6),
        person('m4-kirana-phone', 'Sri Lakshmi Ganapathi Kirana', 'Kirana · Hyderabad'), kw_,
        Push(kw_, 'offer', 0.1, 2.9),
        Ring(kw_, (18, 236, 396, 350), 3.0, L_ + 0.3, card=card('Hindi, here', 'Outreach writes each offer in the shopkeeper\'s own language.', ('agent', 'OUTREACH'), 380), at=(1330, 330))])

    t0, t1 = t1, a('m06') - 0.3
    L_ = t1 - t0
    h, p = HP('mango', [(249.4, 249.4 + L_ + XF)], [(249.4, 252.1), (259.6, 259.6 + L_ + XF - 2.7)], WS + '/offer/MF-2410-118', WS + '/execution/MF-2410-118',
              ('Sri Lakshmi Ganapathi Kirana', 'Kirana · Hyderabad', 'lakshmi-ganapathi'))
    h.speed = p.speed = 1.0
    nx = a('m05b') - t0
    add('orders', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'An order on her phone. Live on Priya\'s screen.', width=1500, hsize=46, stop=6),
        h, p,
        Ring(h, (22, 440, 404, 410), 0.25, 1.9, card=card('Ordered on the phone', '24 packets · ₹178 margin at MRP', ('live', 'KIRANA'), 250), at=(18, 300)),
        Ring(h, (22, 300, 404, 160), 2.5, 4.2, card=card('Its tax invoice, at once', 'LA/26-27/0972 · ₹302, GST included', ('agent', 'PAPERWORK'), 250), at=(18, 300)),
        Ring(p, (258, 322, 200, 66), 4.3, nx - 0.1, card=card("Live on Priya's screen", 'The order lands the moment the shop taps: 1 of 58 kiranas, 24 packets.', ('live', 'EXECUTION'), 400), at=(1250, 112)),
        Sprite(card_sprite('More Indian languages · WhatsApp', 'To reach kiranas in every remote region. Hindi is live today.', ('demo', 'NEXT ON THE ROADMAP'), 440, 'a'), 1250, 112, nx + 0.1, L_ + 0.3)])

    t0, t1 = t1, a('m07') - 0.3
    L_ = t1 - t0
    pw = P1('mango', [(296.0, 437.0), (445.6, 449.6, 3.0)], WS + '/execution/MF-2410-118')
    ff = (437.0 - 296.0) / (L_ + XF - 3.0)
    add('fill', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'The scheme fills.',
             sub='Every other shop orders from its own phone: 52 shops, 1,372 packets, an invoice each.', width=640, hsize=56, stop=6),
        pw, Badge(f'Fast-forward {ff:.0f}×', 1660, 120, 0.3, L_ + XF - 3.0),
        Ring(pw, (258, 668, 420, 46), L_ + XF - 2.8, L_ + 0.3, card=card('1,372 packets, every one placed', '52 of 58 shops ordered inside the window.', ('live', 'OUTREACH'), 380), at=(84, 640))])

    t0, t1 = t1, a('m08') - 0.3
    L_ = t1 - t0
    lw = CL('mango', [(457.0, 459.0), (470.6, 470.6 + L_ + XF - 2.0)], WS + '/home')
    add('staff', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'A staff sale, paid by UPI.', width=1500, hsize=46, stop=6),
        person('m5-staff-upi', 'Lakshmi Agencies', 'Staff sale at Begum Bazaar godown', kf='m5c-staff-upi'), lw,
        Push(lw, 'staff', 0.15, 2.4),
        Ring(lw, (110, 468, 705, 160), lw.seg_start(1, L_ + XF) + 1.6, L_ + 0.3, card=card('18 UPI payments · ₹1,200', 'Vision read the receipt: it matches 150 packs at ₹8.', ('agent', 'VISION'), 380), at=(1490, 600))])

    t0, t1 = t1, a('m08', 'Saturday') - 0.3
    L_ = t1 - t0
    mw = CH('mango', [(516.4, 520.4), (526.0, 526.0 + L_ + XF - 4.0)], WS + '/pickups')
    add('pickup', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'Feeding India picks up.', width=1500, hsize=46, stop=6),
        person('m6-meera-van', 'Meera', 'Feeding India · food bank'), mw,
        Push(mw, 'pickup', mw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3)])

    t0, t1 = t1, a('m09') - 0.3
    L_ = t1 - t0
    vw = CL('mango', [(571.4, 571.4 + L_ + XF)], WS + '/deliveries/MF-2410-118', speed=1.0)
    add('van', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'The Saturday van round.', width=1500, hsize=46, stop=6),
        person('m7-kirana-delivery', 'Sri Lakshmi Ganapathi Kirana', 'The Saturday van round delivers'), vw,
        Push(vw, 'van', 0.15, 2.4)])

    t0, t1 = t1, a('m09', 'Munchly') - 0.25
    L_ = t1 - t0
    pw = P1('mango', [(577.6, 577.6 + L_ + XF)], WS + '/paperwork/MF-2410-118', speed=1.0)
    add('papers', t0, t1, Studio(), [
        head(84, 200, 0.2, L_ + 0.3, '02 · HAPPY PATH · SETTLE', 'Every paper, drafted.', width=640, hsize=56, stop=7),
        pw,
        Ring(pw, (656, 139, 397, 200), 0.2, L_ + 0.3, card=card('The document pack', 'Credit note CN/0117, the GST memo, an invoice for every shop.', ('agent', 'PAPERWORK'), 380), at=(84, 430))])

    t0, t1 = t1, T['s01'][0] - PRE['s01']
    L_ = t1 - t0
    res = Result(0.15, L_ + 0.4, 'THE MANGO DRINK · THE RESULT', 16917.10, -22657.20, 22194.30,
                 [('Lakshmi Agencies ends whole: ₹0 gained or lost', 'good'), ('339.7 kg kept out of landfill · 58 meals', 'good'), ('Every paper drafted, signed and filed', 'good')],
                 [a('m09', 'Lakshmi') - t0, a('m09', 'Lakshmi') - t0 + 0.9, a('m09', 'Lakshmi') - t0 + 1.8], x=180, y=190)
    add('mango-result', t0, t1, Studio(), [res])

    # ======================================================== 5 · the sad path: Munchly Masala Chips, Rakesh Traders
    t0, t1 = t1, a('s01', 'go') - 0.3
    L_ = t1 - t0
    pw = CP('sad', [(187.6, 190.2), (229.4, 229.4 + L_ + XF - 2.6)], WS + '/route/MF-2409-117')
    add('chips', t0, t1, Studio(), [
        head(64, 60, 0.5, L_ + 0.3, '03 · WHEN NOT EVERYTHING SELLS · MUNCHLY MASALA CHIPS 150 G', 'Not every batch sells.', width=1600, hsize=46, stop=4),
        person('n3-chips-godown-dusk', *RAK), pw])

    t0, t1 = t1, a('s02') - 0.3
    L_ = t1 - t0
    h, p = HP('sad', [(328.6, 333.6)], [(400.8, 400.8 + L_ + XF)], WS + '/home', WS + '/execution/MF-2409-117', ('Om Sai Provision', 'Kirana · Nagpur'))
    p.speed = 1.0
    add('no', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '03 · SAD PATH · EXECUTE', 'Just two kiranas order.', width=1000, hsize=48, stop=6),
        h, p,
        Ring(p, (355, 118, 225, 30), 0.6, L_ + 0.3, card=card('2 of 38 kiranas ordered', '35 said not this time. A no is an answer too.', ('live', 'OUTREACH'), 400), at=(1240, 110))])

    t0, t1 = t1, a('s03') - 0.3
    L_ = t1 - t0
    aw = CH('sad', [(441.0, 444.6), (448.6, 451.4), (460.0, 463.4)], WS + '/market/ES-24117')
    q1, q2 = aw.seg_start(1, L_ + XF), aw.seg_start(2, L_ + XF)
    add('lot', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '03 · SAD PATH · EXECUTE', 'The Negotiator sells the lot.', width=1500, hsize=46, stop=6),
        person('c2-agrawal-tablet', 'Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur'), aw,
        Ring(aw, (16, 400, 418, 152), 0.3, q1 - 0.05, card=card('A bid of ₹13', 'Under the reserve the buyer never sees.', ('live', 'EXPIRESOON'), 380), at=(1330, 330)),
        Push(aw, 'counter', q1 + 0.1, q2 - 0.1),
        Ring(aw, (14, 364, 422, 220), q2 + 0.1, L_ + 0.3, card=card('Countered at ₹14.20, accepted', '772 packs sold, with a ₹1,644 token.', ('agent', 'NEGOTIATOR'), 380), at=(1330, 330))])

    t0, t1 = t1, a('s04') - 0.3
    L_ = t1 - t0
    pw = P1('sad', [(501.6, 505.6)], WS + '/execution/MF-2409-117')
    add('window', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '03 · SAD PATH · EXECUTE', 'The offer window closes.', sub='540 packets are left at the godown.', width=640, hsize=56, stop=6),
        pw, Ring(pw, (265, 348, 438, 52), 0.6, 2.6), Ring(pw, (262, 418, 200, 66), 2.8, L_ + 0.3)])

    t0, t1 = t1, a('s05') - 0.3
    L_ = t1 - t0
    rw = CL('sad', [(561.6, 563.9), (574.4, 576.6)], WS + '/home')
    add('destroy-ask', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '03 · SAD PATH · EXPIRY DAY', 'Destroy them, and prove it.', width=1500, hsize=46, stop=7),
        person('n3-chips-godown-dusk', *RAK), rw,
        Push(rw, 'destroy', 0.2, 3.0)])

    t0, t1 = t1, a('s05', 'Then') - 0.25
    L_ = t1 - t0
    rw = CL('sad', [(577.0, 580.6)], WS + '/destroy/MF-2409-117')
    add('evidence', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '03 · SAD PATH · SETTLE', 'Destroyed, against evidence.', width=1500, hsize=46, stop=7),
        person('c3-landfill-evidence', 'Rakesh Traders', 'At the authorised landfill, Nagpur', kf='c3b-landfill-evidence'), rw,
        Ring(rw, (108, 384, 708, 266), 0.4, L_ + 0.3, card=card('Before and after', 'At the godown with the batch label; at the landfill with the slate.', ('proof', 'EVIDENCE'), 380), at=(1490, 560))])

    t0, t1 = t1, a('s06') - 0.3
    L_ = t1 - t0
    rw = CL('sad', [(621.0, 625.6), (661.6, 663.8)], WS + '/destroy/MF-2409-117')
    add('sign', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '03 · SAD PATH · SETTLE', 'The certificate, signed in place.', width=1500, hsize=46, stop=7),
        person('c4-landfill-sign', 'Rakesh Traders', 'With the agency officer and two witnesses', kf='c4b-landfill-sign'), rw,
        Ring(rw, (146, 728, 634, 280), rw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, card=card('4 of 4 signatures', 'OCE/DC/26-27/0219 · 540 packs', ('proof', 'CERTIFICATE'), 380), at=(1490, 640))])

    t0, t1 = t1, a('s07') - 0.3
    L_ = t1 - t0
    pw = CP('sad', [(695.0, 697.8), (720.8, 723.4), (751.0, 752.8)], WS + '/execution/MF-2409-117')
    y1, y2 = pw.seg_start(1, L_ + XF), pw.seg_start(2, L_ + XF)
    add('second-yes', t0, t1, Studio(), [
        head(64, 60, 0.2, L_ + 0.3, '03 · SAD PATH · APPROVE', "Priya's second yes, on the evidence.", width=1500, hsize=46, stop=5),
        person('c5-priya-evening', *PRIYA, kf='c5-priya-evening'), pw,
        Push(pw, 'review', 0.2, 2.6),
        Ring(pw, (655, 325, 405, 195), 0.3, y1 - 0.1, card=card("Vision's checks · 4 of 4", 'The batch label, about 540 packs, the slate, both photos today.', ('agent', 'VISION'), 380), at=(PX + 20, PY + PH + 40)),
        Ring(pw, (790, 676, 262, 50), y1 + 0.1, y1 + 1.05, accent='a'),
        Ring(pw, (245, 425, 488, 280), y1 + 1.5, y2 - 0.1),
        Ring(pw, (650, 160, 400, 560), y2 + 0.1, L_ + 0.3, card=card('Certificate and expiry credit note', 'OCE/DC/26-27/0219 · CN/0118 ₹13,284', ('proof', 'PAPERWORK'), 380), at=(PX + 20, PY + PH + 40))])

    t0, t1 = t1, T['e01'][0] - 0.35
    L_ = t1 - t0
    split = a('s07', 'against') - t0 - 0.25
    l, p = LP('sad', [(890.3, 893.2)], [(1018.0, 1021.5)], WS + '/batches/MF-2409-117', WS + '/journey/MF-2409-117', RAKESH)
    l.u1 = p.u1 = split + 0.3
    l.fade_out = p.fade_out = 0.45
    res = Result(split + 0.2, L_ + 0.4, 'THE MASALA CHIPS · THE RESULT', 11702.40, -26329.60, 14868.00,
                 [('Rakesh Traders ends whole: ₹0 gained or lost', 'good'), ('540 packs destroyed on evidence, by an authorised agency', 'dot'), ('Expiry credit note and certificate issued', 'good')],
                 [a('s07', 'Rakesh') - t0, a('s07', 'Rakesh') - t0 + 0.8, a('s07', 'Rakesh') - t0 + 1.6], x=180, y=190)
    add('chips-result', t0, t1, Studio(), [
        head(84, 40, 0.2, split + 0.3, '03 · SAD PATH · REPORT', 'Still a swing of ₹14,868.', width=1000, hsize=48, stop=8),
        l, p, res])

    live = [x.name for x in S]
    a0, a1 = live.index('signins'), live.index('chips-result')
    for i in range(a0, a1 + 1):
        S[i].items.append(LiveTag(fin=(i == a0), fout=(i == a1)))

    t0, t1 = t1, END
    add('end', t0, t1 - XF, EndCard(0.0, t1 - t0), [Blackout(t1 - t0 - 1.2, t1 - t0 - 0.05, into=True)])
    S[-1].t1 = END
    return S

if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s')
    print('END', END)
