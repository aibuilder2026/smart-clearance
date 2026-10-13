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
# each clip retimed to its shot by slow.sh (motion-interpolated to 25 fps): speed, and whether it is a 720p source
SLOW = {'n1': (0.78, ''), 'n2': (0.85, ''), 'n3': (0.77, ''), 'c53': (0.9, '720'), 'c54': (0.9, '720'), 'f1': (0.95, '')}
STILL = {'n1': HERE / 'img' / 'n1-factory-line.png', 'n2': HERE / 'img' / 'n2-mango-godown.png', 'n3': HERE / 'img' / 'n3-chips-godown-dusk.png'}
XF = 0.45  # the dissolve between shots

class Still:
    """a keyframe as the frame, pushed in slowly in float pixels (a stand-in until its clip lands)"""
    def __init__(self, path, z0=1.0, z1=1.05, dur=6.0, scrim=None):
        im = cv2.imread(str(path))
        k = max(W / im.shape[1], H / im.shape[0])
        self.img, self.k, self.z0, self.z1, self.dur, self.scrim = im, k, z0, z1, dur, scrim
    def draw(self, f, u, L=None):
        z = self.z0 + (self.z1 - self.z0) * ease_in_out(u / self.dur)
        s = self.k * z
        tx, ty = W / 2 - self.img.shape[1] * s / 2, H / 2 - self.img.shape[0] * s / 2
        _, _, p = place(self.img, s, tx, ty, (0, 0, W, H))
        f[:] = p
        if self.scrim: scrim(f, self.scrim)

def clip_or_still(key, start=0.0, scrim=None, dur=6.0):
    slow = HERE / 'build' / 'slow' / f'{key}.mp4'
    if slow.exists(): return Clip(slow, start=start, speed=1.0, fps=FPS, scrim=scrim)
    if key in STILL: return Still(STILL[key], dur=dur, scrim=scrim)
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

def build():
    S = []
    def add(name, t0, t1, bg, items=()):
        S.append(Shot(name, t0, t1 + XF, bg, items))
    def a(lid, word=None, k=0): return at(lid, word, k)

    # ======================================================== 1 · the problem, the product, the architecture
    t0, t1 = 0.0, a('i02') - 0.25
    L_ = t1 - t0
    add('factory', t0, t1, clip_or_still('n1', scrim='lowleft', dur=L_), [
        head(84, 820, 0.9, L_ + 0.3, "INDIA'S FMCG SUPPLY CHAIN", 'Millions of packs, every day.', width=900, hsize=54),
        Blackout(0.0, 0.9)])

    t0, t1 = t1, a('i03', 'stock') - 0.3
    L_ = t1 - t0
    add('hold', t0, t1, clip_or_still('c53', scrim='lowleft'), [
        head(84, 800, 0.35, L_ + 0.3, 'NEAR EXPIRY', "Some batches don't sell in time.", width=900, hsize=54),
        Sprite(chip_sprite('Quick commerce: too close to expiry', 'bad', 26), 84, 990 - 40, a('i03', 'quick') - t0, L_ + 0.3)])

    t0, t1 = t1, a('i04') - 0.25
    L_ = t1 - t0
    add('landfill', t0, t1, clip_or_still('c54', scrim='lowleft'), [
        Sprite(chip_sprite('Stock written off', 'bad', 28), 84, 700, a('i03', 'written') - t0, L_ + 0.3),
        Sprite(chip_sprite('GST input credit reversed', 'bad', 28), 84, 776, a('i03', 'GST') - t0, L_ + 0.3),
        Sprite(chip_sprite('Good food to landfill', 'bad', 28), 84, 852, a('i03', 'landfill') - t0, L_ + 0.3)])

    t0, t1 = t1, a('i05') - 0.3
    L_ = t1 - t0
    add('brand', t0, t1, clip_or_still('f1', start=0.42, scrim='left'), [
        Brand(96, 400, 0.25, L_ + 0.5, sub='turns write-offs into recovery.')])

    t0, t1 = t1, a('i06') - 0.35
    L_ = t1 - t0
    land = Seqs([HERE / 'build' / 'landing' / s_ for s_ in ('hero', 'teams', 'agents', 'yes')], scale=0.5)
    # hero 0-6 s, teams 6-13 s, agents (the table) 13-22 s, yes 22-26 s
    win = Window(None, None, [(0.3, 3.4), (6.5, 9.6), (15.0, 19.0)], 600, 230, 0.78, 'smartclearance.web.app', seq=land, radius=14)
    add('landing', t0, t1, Studio(), [
        head(84, 330, 0.2, L_ + 0.3, 'SOFTWARE AS A SERVICE', 'A workspace for every brand.',
             sub='AI agents find the best exit for every pack at risk, before anything is destroyed.', width=470, hsize=50),
        win])

    t0, t1 = t1, a('i10') - 0.3
    L_ = t1 - t0
    s0 = t0
    def u(lid, word=None, k=0): return a(lid, word, k) - s0
    warp = [(0.0, 0), (u('i06', 'walk'), 71), (u('i07', 'Watcher'), 124), (u('i07', 'Vision'), 176), (u('i07', 'Valuer'), 229),
            (u('i07', 'Router'), 281), (u('i08', 'one'), 334), (u('i09', 'Outreach'), 434), (u('i09', 'Paperwork'), 546),
            (u('i09', 'Impact'), 599), (T['i09'][1] - s0 + 0.3, 651)]
    add('agents', t0, t1, AgentsScene(warp, open_at=(1.5, 3.5)), [
        head(60, 34, 2.9, L_ + 0.3, 'AGENTIC ARCHITECTURE', 'Ten agents. Nine stops. One human yes.', width=1200, hsize=42),
        Arch(3.6, L_ + 0.3)])

    t0, t1 = t1, T['m01'][0] - PRE['m01']
    L_ = t1 - t0
    ov = A1([(55.0, 58.4), (63.6, 65.4), (85.6, 88.6)], 'smartclearance-console.web.app')
    q1, q2 = ov.seg_start(1, L_ + XF), ov.seg_start(2, L_ + XF)
    add('console', t0, t1, Studio(), [
        head(84, 300, 0.2, L_ + 0.3, 'THE CONSOLE', 'Every client, watched live.', sub='Batches in flight, agents at work, the yeses waiting.', width=380, hsize=46),
        ov,
        Ring(ov, (361, 266, 1540, 196), 0.5, q1 - 0.05),
        Ring(ov, (380, 580, 1515, 320), q1 + 0.15, q2 - 0.05),
        Ring(ov, (760, 200, 600, 330), q2 + 0.2, L_ + 0.3, card=card("Each client's agents, tuned", 'Act, Ask or Suggest, set client by client.', ('live', 'CONSOLE'), 360), at=(84, 640))])

    # ======================================================== 2 · the happy path: Munchly Mango Drink, Lakshmi Agencies
    t0, t1 = t1, a('m02') - 0.3
    L_ = t1 - t0
    add('mango-title', t0, t1, clip_or_still('n2', scrim='lowleft', dur=L_), [
        head(84, 700, 0.5, L_ + 0.3, '02 · THE HAPPY PATH · LIVE ON PRODUCTION', 'Munchly Mango Drink 200 ml',
             sub='Lakshmi Agencies, Hyderabad · 22 days left · recorded 13 Oct 2026', width=1100, hsize=64)])

    t0, t1 = t1, a('m03') - 0.3
    L_ = t1 - t0
    ph = H1('mango', [(47.4, 47.4 + L_ + XF)], CON, NEHA, speed=1.0)
    add('rehearsal', t0, t1, Studio(), [
        head(84, 250, 0.2, L_ + 0.3, 'DEMO SETUP · IN THE CONSOLE', 'Rehearsal: one journey day passes in an hour.',
             sub="Munchly's batches keep their real best-before dates, so the whole journey plays in minutes.", width=760, hsize=52, kcolor='a'),
        ph,
        Ring(ph, (18, 367, 416, 80), a('m02', 'Rehearsal') - t0, 7.3, accent='a',
             card=card('Rehearsal · 1 day = 1 hour', 'Real time, Rehearsal, Demo or Fast: the journey clock is the console\'s to set.', ('demo', 'DEMO SETUP'), 400, 'a'), at=(760, 560)),
        Ring(ph, (14, 814, 424, 74), 7.6, L_ + 0.3, card=card('Journey reset to day 0', 'Every open batch starts again from the story\'s first morning.', None, 400), at=(760, 860))])

    t0, t1 = t1, a('m04') - 0.3
    L_ = t1 - t0
    h, p = HP('mango', [(84.4, 84.4 + L_ + XF)], [(84.4, 84.4 + L_ + XF)], CON, WS + '/command', NEHA)
    add('detect', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '02 · HAPPY PATH · DETECT', 'The Watcher flags it, live.', width=900, hsize=48, stop=1),
        h, p,
        Ring(h, (58, 470, 124, 40), 1.4, 4.6, accent='a', card=card('Run any agent by hand', "In the demo, the Watcher's 09:00 check runs now.", ('demo', 'DEMO CONTROL'), 250, 'a'), at=(18, 600)),
        Ring(p, (268, 300, 270, 192), 8.3, L_ + 0.3,
             card=card('₹22,657 at stake', '22 days left: too close for Blinkit, Zepto and Instamart.', ('live', 'WATCHER'), 400), at=(1260, 112))])

    t0, t1 = t1, a('m05') - 0.3
    L_ = t1 - t0
    lw = L1('mango', [(113.9, 117.1), (123.6, 124.8), (141.4, 143.9)], WS + '/home', LAKSHMI)
    add('verify', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '02 · HAPPY PATH · VERIFY', 'Vision reads the label.',
             sub='One photo of the carton: batch, dates and MRP checked against the stock export.', width=900, hsize=56, stop=2),
        lw,
        Ring(lw, (190, 760, 550, 160), L_ - 2.2, L_ + 0.3, card=card('Matches the export', 'MF-2410-118 · best before 24 Oct 2026 · MRP ₹20', ('agent', 'VISION'), 400), at=(700, 780))])

    t0, t1 = t1, a('m06') - 0.3
    L_ = t1 - t0
    pw = P1('mango', [(175.6, 175.6 + L_ + XF)], WS + '/route/MF-2410-118', speed=1.0)
    add('value', t0, t1, Studio(), [
        head(84, 230, 0.2, L_ + 0.3, '02 · HAPPY PATH · VALUE · DECIDE', 'Five exits, priced.', width=640, hsize=56, stop=3),
        pw,
        Ring(pw, (245, 196, 495, 300), 0.5, L_ + 0.3, card=card('Every exit priced', 'Kiranas, ExpireSoon, a staff sale, a food bank, and the bin itself.', ('agent', 'VALUER'), 380), at=(84, 470)),
        Ring(pw, (225, 578, 430, 52), a('m05', 'Router') - t0, L_ + 0.3, card=card('The split', 'Kiranas, a staff sale and a food bank.', ('agent', 'ROUTER'), 380), at=(84, 720))])

    t0, t1 = t1, a('m07') - 0.3
    L_ = t1 - t0
    pw = P1('mango', [(201.0, 202.5), (209.2, 212.9)], WS + '/route/MF-2410-118')
    add('approve', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '02 · HAPPY PATH · APPROVE', 'One yes from Priya.', sub='Nothing moves before it.', width=640, hsize=56, stop=5),
        pw,
        Ring(pw, (660, 574, 398, 52), 0.3, L_ - 0.2, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 380, 'a'), at=(84, 560))])

    t0, t1 = t1, a('m08') - 0.3
    L_ = t1 - t0
    h, p = HP('mango', [(245.2, 245.2 + L_ + XF)], [(245.2, 252.0), (259.6, 259.6 + L_ + XF - 6.8)], WS + '/offer/MF-2410-118', WS + '/execution/MF-2410-118',
              ('Sri Lakshmi Ganapathi Kirana', 'Kirana · Hyderabad', 'lakshmi-ganapathi'))
    h.speed = p.speed = 1.0
    add('orders', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'A Hindi offer. Orders land live.', width=1000, hsize=48, stop=6),
        h, p,
        Ring(h, (18, 236, 396, 350), 0.2, 2.6, card=card('The offer, in Hindi', '₹14.40 a pack, 2 free with every 10, for 48 hours.', ('agent', 'OUTREACH'), 250), at=(18, 560)),
        Ring(h, (18, 560, 396, 300), 3.6, 6.0, card=card('Ordered on the phone', '24 packets · its tax invoice issued at once', ('live', 'KIRANA'), 250), at=(18, 300)),
        Ring(p, (258, 322, 200, 66), 6.45, L_ + 0.3, card=card('Live on Priya\'s screen', 'The order lands the moment the shop taps: 1 of 58 kiranas, 24 packets.', ('live', 'EXECUTION'), 400), at=(1250, 112))])

    t0, t1 = t1, a('m09') - 0.3
    L_ = t1 - t0
    pw = P1('mango', [(296.0, 437.0), (445.6, 449.6, 3.0)], WS + '/execution/MF-2410-118')
    ff = (437.0 - 296.0) / (L_ + XF - 3.0)
    add('fill', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'The scheme fills.',
             sub='Every other shop orders from its own phone: 52 shops, 1,372 packets, an invoice each.', width=640, hsize=56, stop=6),
        pw, Badge(f'Fast-forward {ff:.0f}×', 1660, 120, 0.3, L_ + XF - 3.0),
        Ring(pw, (258, 668, 420, 46), L_ + XF - 2.8, L_ + 0.3, card=card('1,372 packets, every one placed', '52 of 58 shops ordered inside the window.', ('live', 'OUTREACH'), 380), at=(84, 640))])

    t0, t1 = t1, a('m10') - 0.3
    L_ = t1 - t0
    l, p = LP('mango', [(470.6, 470.6 + L_ + XF)], [(492.4, 497.0), (503.6, 503.6 + L_ + XF - 4.6)], WS + '/home', WS + '/execution/MF-2410-118', LAKSHMI)
    l.speed = p.speed = 1.0
    add('staff', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', 'A staff sale, proven by UPI.',
             sub='Vision read the receipt: 18 UPI payments, ₹1,200, matching 150 packs at ₹8.', width=1500, hsize=48, stop=6),
        l, p,
        Ring(l, (110, 468, 705, 160), 3.5, L_ + 0.3),
        Ring(p, (267, 347, 450, 97), 3.6, L_ + 0.3)])

    t0, t1 = t1, a('m11') - 0.3
    L_ = t1 - t0
    h, p = HP('mango', [(532.6, 534.4), (537.0, 539.6)], [(531.0, 531.0 + L_ + XF)], WS + '/pickups', WS + '/execution/MF-2410-118', ('Meera', 'Feeding India · food bank', 'meera'))
    p.speed = 1.0
    add('donate', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '02 · HAPPY PATH · EXECUTE', '58 packs to a food bank.', width=1000, hsize=48, stop=6),
        h, p,
        Ring(h, (36, 458, 378, 130), 2.0, L_ + 0.3, card=card('Donation receipt', 'FI/HYD/26-27/0417 · 58 packs · 58 meals', ('live', 'FOOD BANK'), 250), at=(18, 640))])

    t0, t1 = t1, a('m12') - 0.3
    L_ = t1 - t0
    pw = P1('mango', [(577.6, 580.0), (611.4, 613.8), (639.8, 642.2)], WS + '/paperwork/MF-2410-118')
    third = L_ / 3
    add('papers', t0, t1, Studio(), [
        head(84, 200, 0.2, L_ + 0.3, '02 · HAPPY PATH · SETTLE', 'Every paper, drafted.', width=640, hsize=56, stop=7),
        pw,
        Ring(pw, (656, 139, 397, 200), 0.3, third, card=card('Price-support credit note', 'CN/0117 · ₹5,932 to Lakshmi Agencies', ('agent', 'PAPERWORK'), 380), at=(84, 430)),
        Ring(pw, (800, 505, 246, 95), third + 0.2, 2 * third, card=card('GST ITC memo, signed', 'Input credit kept on every pack sold, s.17(5)(h).', ('agent', 'PAPERWORK'), 380), at=(84, 600)),
        Ring(pw, (652, 268, 405, 300), 2 * third + 0.2, L_ + 0.3, card=card('An invoice for every shop', '52 tax invoices in the sales register.', ('agent', 'PAPERWORK'), 380), at=(84, 770))])

    t0, t1 = t1, T['s01'][0] - PRE['s01']
    L_ = t1 - t0
    split = a('m12', 'instead') - t0 - 0.25
    l, p = LP('mango', [(747.6, 750.0)], [(809.0, 812.0)], WS + '/batches/MF-2410-118', WS + '/journey/MF-2410-118', LAKSHMI)
    l.u1 = p.u1 = split + 0.3
    l.fade_out = p.fade_out = 0.45
    res = Result(split + 0.2, L_ + 0.4, 'THE MANGO DRINK · THE RESULT', 16917.10, -22657.20, 22194.30,
                 [('Lakshmi Agencies ends whole: ₹0 gained or lost', 'good'), ('339.7 kg kept out of landfill · 58 meals', 'good'), ('Every paper drafted, signed and filed', 'good')],
                 [a('m12', 'Lakshmi') - t0, a('m12', '340') - t0, a('m12', 'landfill') - t0 + 0.5], x=180, y=190)
    add('mango-result', t0, t1, Studio(), [
        head(84, 40, 0.2, split + 0.3, '02 · HAPPY PATH · REPORT', 'The swing, worked out.', width=1000, hsize=48, stop=8),
        l, p, res])

    # ======================================================== 3 · the sad path: Munchly Masala Chips, Rakesh Traders
    t0, t1 = t1, a('s01', 'go') - 0.3
    L_ = t1 - t0
    add('chips-title', t0, t1, clip_or_still('n3', scrim='lowleft', dur=L_), [
        head(84, 700, 0.5, L_ + 0.3, '03 · WHEN NOT EVERYTHING SELLS · LIVE ON PRODUCTION', 'Munchly Masala Chips 150 g',
             sub='Rakesh Traders, Nagpur · 47 days left · recorded 13 Oct 2026', width=1200, hsize=64)])

    t0, t1 = t1, a('s02') - 0.3
    L_ = t1 - t0
    pw = P1('sad', [(187.6, 190.2)], WS + '/route/MF-2409-117')
    add('chips-plan', t0, t1, Studio(), [
        head(84, 300, 0.1, L_ + 0.3, '03 · SAD PATH · DECIDE', 'The plan: ₹21,770.', sub='588 packets to 38 kiranas, 772 to ExpireSoon.', width=640, hsize=56, stop=4),
        pw])

    t0, t1 = t1, a('s03') - 0.3
    L_ = t1 - t0
    h, p = HP('sad', [(328.6, 333.6)], [(400.8, 400.8 + L_ + XF)], WS + '/home', WS + '/execution/MF-2409-117', ('Om Sai Provision', 'Kirana · Nagpur', 'OS'))
    add('no', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '03 · SAD PATH · EXECUTE', 'Just two kiranas order.', width=1000, hsize=48, stop=6),
        h, p,
        Ring(p, (355, 118, 225, 30), 0.8, L_ + 0.3, card=card('2 of 38 kiranas ordered', '35 said not this time. A no is an answer too.', ('live', 'OUTREACH'), 400), at=(1240, 110))])

    t0, t1 = t1, a('s04') - 0.3
    L_ = t1 - t0
    h, p = HP('sad', [(441.0, 444.6), (448.6, 451.4), (460.0, 463.4)], [(441.0, 444.6), (448.6, 451.4), (476.8, 480.2)],
              WS + '/market', WS + '/execution/MF-2409-117', ('Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur', 'agrawal'))
    third = L_ / 3
    add('lot', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, '03 · SAD PATH · EXECUTE', 'The Negotiator sells the lot.', width=1000, hsize=48, stop=6),
        h, p,
        Ring(h, (16, 400, 418, 152), 0.3, h.seg_start(1, L_ + XF), card=card('A bid of ₹13', 'Under the reserve the buyer never sees.', ('live', 'EXPIRESOON'), 250), at=(18, 600)),
        Ring(h, (14, 364, 422, 220), h.seg_start(1, L_ + XF) + 0.1, h.seg_start(2, L_ + XF), card=card('Countered at ₹14.20', 'Accepted, with a ₹1,644 token.', ('agent', 'NEGOTIATOR'), 250), at=(18, 640)),
        Ring(p, (272, 272, 408, 30), p.seg_start(2, L_ + XF) + 0.3, L_ + 0.3, card=card('772 packs sold', 'Awarded to Agrawal Wholesale, Raipur.', ('live', 'LISTER'), 400), at=(1240, 96))])

    t0, t1 = t1, a('s05') - 0.3
    L_ = t1 - t0
    h, p = HP('sad', [(485.2, 486.2), (495.0, 495.0 + L_ + XF - 1.0)], [(496.6, 496.6 + L_ + XF)], CON, WS + '/execution/MF-2409-117', NEHA)
    h.speed = p.speed = 1.0
    add('close', t0, t1, Studio(), [
        head(84, 40, 0.2, L_ + 0.3, 'DEMO CONTROL · IN THE CONSOLE', 'The offer window closes early.', width=1000, hsize=48, kcolor='a'),
        h, p,
        Ring(h, (38, 362, 374, 256), 1.5, 4.4, accent='a', card=card('Close now', 'The 48-hour window, closed on demand.', ('demo', 'DEMO CONTROL'), 250, 'a'), at=(18, 760)),
        Ring(p, (262, 418, 192, 64), a('s04', '540') - t0, L_ + 0.3, card=card('540 packets left at the godown', 'No channel took them before expiry.', ('result', 'SHORTFALL'), 420, 'a'), at=(1230, 110))])

    t0, t1 = t1, a('s05', 'Rakesh') - 0.3
    L_ = t1 - t0
    ph = H1('sad', [(546.8, 546.8 + L_ + XF)], CON, NEHA, speed=1.0)
    add('expiry', t0, t1, Studio(), [
        head(84, 300, 0.1, L_ + 0.3, 'DEMO CONTROL · EXPIRY DAY', 'Expiry day, called.', sub='Report now treats the batch as expired, as it stands.', width=900, hsize=56, kcolor='a'),
        ph, Ring(ph, (38, 348, 375, 280), 0.9, L_ + 0.3, accent='a')])

    t0, t1 = t1, a('s06') - 0.3
    L_ = t1 - t0
    lw = L1('sad', [(576.6, 580.4), (606.4, 609.9), (661.6, 663.8)], WS + '/destroy/MF-2409-117', RAKESH)
    tot = 3.8 + 3.5 + 2.2; k_ = L_ / tot
    add('destroy', t0, t1, Studio(), [
        head(84, 260, 0.2, L_ + 0.3, '03 · SAD PATH · SETTLE', 'Destroyed, against evidence.', sub='An authorised agency, two photos, and a certificate signed in place.', width=900, hsize=56, stop=7),
        lw,
        Ring(lw, (108, 384, 708, 266), 0.3, 3.8 * k_, card=card('Before and after', 'At the godown with the batch label; at the landfill with the slate.', ('proof', 'EVIDENCE'), 400), at=(700, 560)),
        Ring(lw, (358, 288, 468, 158), 3.8 * k_ + 0.2, 7.3 * k_, card=card('Signed in place', 'The officer, two witnesses and Rakesh, on his tablet.', ('proof', 'CERTIFICATE'), 400), at=(700, 560)),
        Ring(lw, (146, 728, 634, 280), 7.3 * k_ + 0.2, L_ + 0.3, card=card('4 of 4 signatures', 'OCE/DC/26-27/0219 · 540 packs', ('proof', 'CERTIFICATE'), 400), at=(700, 760))])

    t0, t1 = t1, a('s07') - 0.3
    L_ = t1 - t0
    pw = P1('sad', [(694.6, 698.4), (720.6, 724.2)], WS + '/execution/MF-2409-117')
    y2 = pw.seg_start(1, L_ + XF)
    add('second-yes', t0, t1, Studio(), [
        head(84, 230, 0.2, L_ + 0.3, '03 · SAD PATH · APPROVE', 'A second yes.', sub='Money moves only on proof.', width=640, hsize=56, stop=5),
        pw,
        Ring(pw, (655, 325, 405, 195), 0.3, y2 - 0.1, card=card("Vision's checks · 4 of 4", 'The batch label, about 540 packs, the slate, both photos today.', ('agent', 'VISION'), 380), at=(84, 560)),
        Ring(pw, (782, 676, 256, 50), y2 + 0.15, y2 + 2.0, accent='a', card=card('Approve · issue the papers', 'Priya\'s second yes, on the evidence.', ('result', 'SECOND YES'), 380, 'a'), at=(84, 740))])

    t0, t1 = t1, a('s08') - 0.3
    L_ = t1 - t0
    pw = P1('sad', [(750.6, 753.8), (775.0, 776.6)], WS + '/paperwork/MF-2409-117')
    y2 = pw.seg_start(1, L_ + XF)
    add('issued', t0, t1, Studio(), [
        head(84, 230, 0.2, L_ + 0.3, '03 · SAD PATH · SETTLE', 'Only then, the papers.', width=640, hsize=56, stop=7),
        pw,
        Ring(pw, (650, 160, 400, 560), 0.3, y2 - 0.05, card=card('Certificate of destruction', 'OCE/DC/26-27/0219 · signed by four', ('proof', 'PAPERWORK'), 380), at=(84, 470)),
        Ring(pw, (250, 264, 372, 140), y2 + 0.15, L_ + 0.3, card=card('Expiry credit note', 'CN/0118 · ₹13,284 to Rakesh Traders', ('agent', 'PAPERWORK'), 380), at=(84, 650))])

    t0, t1 = t1, T['e01'][0] - 0.35
    L_ = t1 - t0
    split = a('s08', 'against') - t0 - 0.25
    l, p = LP('sad', [(890.4, 892.6)], [(1018.0, 1021.5)], WS + '/batches/MF-2409-117', WS + '/journey/MF-2409-117', RAKESH)
    l.u1 = p.u1 = split + 0.3
    l.fade_out = p.fade_out = 0.45
    res = Result(split + 0.2, L_ + 0.4, 'THE MASALA CHIPS · THE RESULT', 11702.40, -26329.60, 14868.00,
                 [('Rakesh Traders ends whole: ₹0 gained or lost', 'good'), ('540 packs destroyed on evidence, by an authorised agency', 'dot'), ('Expiry credit note and certificate issued', 'good')],
                 [a('s08', 'Rakesh') - t0, a('s08', 'Rakesh') - t0 + 0.8, a('s08', 'Rakesh') - t0 + 1.6], x=180, y=190)
    add('chips-result', t0, t1, Studio(), [
        head(84, 40, 0.2, split + 0.3, '03 · SAD PATH · REPORT', 'Still a swing of ₹14,868.', width=1000, hsize=48, stop=8),
        l, p, res])

    t0, t1 = t1, END
    add('end', t0, t1 - XF, EndCard(0.0, t1 - t0), [Blackout(t1 - t0 - 1.2, t1 - t0 - 0.05, into=True)])
    S[-1].t1 = END
    return S

if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s')
    print('END', END)
