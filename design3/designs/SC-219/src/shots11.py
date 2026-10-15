"""SC-219 cut 11 (from cut 10): the film's shots, laid on the voice. On the maintainer's notes on cut 10: the bin's scene
given time to read (a pause after "it's destroyed": its costs and the planet's figures land a beat apart, then hold);
under the hood drawn again in 2D (arch11): a surreal dreamscape on the green, the same story, parts, screens and notes,
each part a surreal object with its own sound, the camera's long moves eased out wide; the close condensed (its card
held 1.2 s after the last word); 238 to 239 s.

Cut 10's notes (kept): On the maintainer's notes on cut 9: the first 15
seconds told in 10 (the godown, the label, the bin, then the brand by 0:10); under the hood refined into a film (arch10:
letterboxed, each part framed, lit and called out as the voice names it, depth of field, motion blur, streaks, grain);
the use cases told: Munchly Foods, an imaginary brand, two batches at two different distributors, in about 10 seconds
(cast10); "live" said as in "live on production"; nine AI agents, and the Watcher shown as plain code (no model); the
6 seconds the opening gave back, to the walkthrough (the console, the kiranas' offer, the donation, the lot, the
signing, the papers); 238 to 239 s.

Cut 9's notes (kept):  On the maintainer's notes on cut 8: the
install scene a little faster; before the demo, the two paths and everyone in them, animated (cast9); what the product
is, condensed: agentic software as a service for the FMCG supply chain (saas9, on photographs of the work); the
architecture rebuilt as a lit 3D scene the camera flies through, between 30 and 60 seconds long and over before 1:00
(arch9); how Supply Chain tracks the batches at risk from the Command Center, after Priya's live sign-in; the impact
shot's overlap fixed; the close's QR code in its own column at the right; 235 to 238 s; transitions chosen per cut
(an iris on the brand, a rise under the hood, pushes between people, a cut where the same screen goes on); and only
realistic photographs and footage.

Each walkthrough beat (cut 8's): the person's own clip behind (Breathe), their device's screen as a window over the
recording (Walk), the agent at work with its tool calls (AgentHead), rings and cards on what the voice names, and the
Google Cloud service it uses (TechTag)."""
import json
from parts import *
from parts3 import *
from parts4 import *
from parts5 import *
from parts6 import *
from parts7 import *
from parts8 import *
from parts9 import *
import parts as _P
import fx
import shots7 as S7
import parts6 as _P6
_P6.MODEL['watcher'] = 'plain code · no AI model'      # cut 10: the Watcher is code, not one of the nine AI agents

_P.FACE_OF.update({'Shree Ganesh Kirana': 'p-ganesh', 'Rakesh Traders · landfill': 'p-rakesh'})


class Shot:
    """a shot over [t0, t1): its background and items, drawn at local time u. xin: how it comes in over the shot before
    it ('cut', 'push', 'up' or 'wipe'), over xd seconds, from the right (xdir 1) or the left (-1)"""
    def __init__(self, name, t0, t1, bg, items=(), xin='cut', xd=0.0, xdir=1):
        self.name, self.t0, self.t1, self.bg, self.items = name, t0, t1, bg, list(items)
        self.xin, self.xd, self.xdir = xin, xd, xdir
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


class Stack:
    def __init__(self, *items): self.items = items
    def draw(self, f, u, L=None):
        for it in self.items: it.draw(f, u, L)


class Steps:
    """the console's setup as steps in the left column, each lit as its screen plays"""
    def __init__(self, names, starts, x, y, u0=0.3, gap=58):
        self.names, self.starts, self.x, self.y, self.u0, self.gap = names, starts, x, y, u0, gap
    def draw(self, f, u, L=None):
        a = clamp((u - self.u0) / 0.4)
        if a <= 0: return
        for i, (n, t0) in enumerate(zip(self.names, self.starts)):
            on = u >= t0
            blit(f, chip_sprite(n, 'good' if on else 'dot', 22), self.x, self.y + i * self.gap, a * (1.0 if on else 0.45))


class Flash:
    """a camera's shutter: a quick white flash at u0"""
    def __init__(self, u0, dur=0.22): self.u0, self.dur = u0, dur
    def draw(self, f, u, L=None):
        if u < self.u0 or u > self.u0 + self.dur: return
        p = (u - self.u0) / self.dur
        a = (1 - p) ** 2 * 0.85
        f *= (1 - a); f += a


class Hold:
    """an item shown only over [u0, u1) of its shot (no fade: the shot's cut does the work)"""
    def __init__(self, item, u0, u1): self.item, self.u0, self.u1 = item, u0, u1
    def draw(self, f, u, L=None):
        if self.u0 <= u < self.u1: self.item.draw(f, u, L)


def card(title, body='', tag=None, w=400, accent='g'):
    return card_sprite(title, body, tag, w, accent)


def head(x, y, u0, u1, kicker, headline, sub=None, width=640, hsize=46, kcolor='g', stop=None):
    return Words(x, y, u0, u1, kicker=kicker, head=headline, sub=sub, width=width, hsize=hsize, kcolor=kcolor, stop=stop)


# ---------------------------------------------------------------- the people, their screens and their rooms

PRIYA = ('Priya Deshmukh', 'Supply chain · Munchly Foods', 'p-priya')
LAKSHMI = ('Lakshmi Agencies', 'Distributor · Hyderabad', 'p-lakshmi')
RAKESH = ('Rakesh Traders', 'Distributor · Nagpur', 'p-rakesh')
NEHA = ('Neha Kulkarni', 'Smart-Clearance staff · console', 'p-neha')
KIRANA = ('Sri Lakshmi Ganapathi Kirana', 'Kirana · Hyderabad', 'p-lakshmi-ganapathi')
GANESH = ('Shree Ganesh Kirana', 'Kirana · Nagpur', 'p-ganesh')
AGRAWAL = ('Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur', 'p-agrawal')
MEERA = ('Meera · Feeding India', 'Food bank · Hyderabad', 'p-meera')
CON = 'smartclearance-console.web.app/clients/munchly'
WS = 'munchly-smartclearance.web.app'


def who(t): return (t[0], t[1], t[2])


# where each screen sits: a landscape tablet on the right; a portrait tablet or a phone right of centre; the console
def PW(rec, segs, url, person=PRIYA, **kw): return Walk(rec, 'P', segs, 800, 252, 1.0, url, who=who(person), **kw)
def LW(rec, segs, url, person, **kw): return Walk(rec, 'L', segs, 738, 210, 0.68, url, who=who(person), **kw)
def HW(rec, segs, url, person, **kw): return Walk(rec, 'H', segs, 833, 186, 0.86, url, who=who(person), **kw)


def Flow(hops, times, u1, u0=0.2): return StepFlow(1370, 150, 510, hops, times, u0, u1)

RX, RW = 1370, 510      # the right column, beside a portrait screen


class BigFigure:
    """one figure that is the point of a moment, large, on a glass panel, with what it means under it"""
    def __init__(self, x, y, w, kicker, figure, lines, u0, u1, rgb=(52, 211, 128)):
        self.x, self.y, self.w, self.u0, self.u1 = x, y, w, u0, u1
        self.kick = kicker_sprite(kicker, (232, 242, 236), 15)
        self.fig = TX(figure, 'b', 150, 800, rgb)
        self.lines = [TX(l, 'g', 21, 560, (214, 226, 220)) for l in lines]
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y, self.w
        h = 300 + 36 * len(self.lines)
        panel(f, x, y, x + w, y + h, a, alpha=0.86)
        blit(f, self.kick, x + 26, y + 24, a)
        e = fm_spring(u - self.u0 - 0.15, 260, 18)
        blit(f, self.fig, x + 26, y + 70 + 30 * (1 - e), a * clamp((u - self.u0 - 0.15) / 0.2))
        for i, l in enumerate(self.lines):
            t = self.u0 + 0.6 + 0.25 * i
            blit(f, l, x + 28, y + 270 + 36 * i, a * clamp((u - t) / 0.3))
def AW(segs, url, **kw): return Walk('admin', 'A', segs, 600, 246, 0.66, url, who=who(NEHA), **kw)


# each person's clip, framed so they sit left of their screen (px, py: where they are in the clip, 1920 x 1088)
ROOMS = {
    'priya': dict(key='f-priya', px=1000, py=420, X=420),
    'priya-eve': dict(key='s-priya-eve', px=330, py=470, X=380),
    'lakshmi': dict(key='f-lakshmi', px=1190, py=420, X=640),
    'kirana': dict(key='f-kirana', px=1000, py=400, X=700),
    'meera': dict(key='f-meera', px=1250, py=420, X=720),
    'rakesh': dict(key='f-rakesh', px=1010, py=430, X=640),
    'neha': dict(key='s-neha', px=420, py=470, X=300),
    'agrawal': dict(key='s-agrawal', px=380, py=470, X=420),
    'upi': dict(key='s-upi', px=1220, py=440, X=700),
    'sign': dict(key='s-landfill-sign', px=880, py=500, X=640),
    'photo': dict(key='s-landfill-photo', px=760, py=520, X=640),
}
_BG = {}


def room(name, t_abs):
    """the person's room for a shot that starts at film time t_abs: one Breathe per person, on the film's clock (its
    clip starts the first time the person is seen and runs on, unbroken, through their later shots)"""
    if name not in _BG:
        r = dict(ROOMS[name])
        _BG[name] = (Breathe(r.pop('key'), r.pop('px'), r.pop('X'), py=r.pop('py'), **r), t_abs)
    bg, base = _BG[name]
    return At(bg, t_abs - base)


LABEL_PHOTO = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-mango-drink-MF-2410-118' / 'label-photo.webp'
EVID = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-masala-chips-MF-2409-117'
RECEIPT_PHOTO = REPO / 'playwright-automation-videos' / 'sampleData' / 'munchly-mango-drink-MF-2410-118' / 'staff-sale-receipt.webp'
ARCH = HERE / 'build' / 'arch11'
PWA = HERE / 'build' / 'pwa9'
SAAS = HERE / 'build' / 'saas10'
CAST = HERE / 'build' / 'cast10'

PUSH = 0.6     # a push between two people's shots
WIPE = 0.55
IRIS = 0.85    # the brand's squircle opening onto what it is
UP = 0.7       # under the hood: the next shot rises from below


def build():
    S = []
    _BG.clear()
    def add(name, t0, t1, bg, items=(), xin='cut', xd=0.0, xdir=1):
        if S and xd > 0: S[-1].t1 = max(S[-1].t1, t0 + xd)     # the shot before keeps drawing under the transition
        S.append(Shot(name, t0, t1, bg, items, xin, xd, xdir))
    ALT = {'10': ['ten'], 'ten': ['10'], '1': ['one'], 'one': ['1'], '9': ['nine'], 'BigQuery': ['big'], 'ExpireSoon': ['expire'],
           'Firebase': ['fire'], 'ADK': ['a', 'adk'], 'Pub': ['PubSub', 'Pub-Sub'], 'Munchly': ['Manchli', "Munchly's"], 'Agencies': ['agencies', "Agency's"],
           'storage': ['Storage'], 'Storage': ['storage'], 'sell': ['sellthrough', 'sell-through'], 'Nine': ['9', 'nine'],
           'Platform': ['platform'], 'Live': ['live']}
    def a(lid, word=None, k=0, edge='s'):
        for w_ in [word] + ALT.get(word, []):
            try: return at(lid, w_, k, edge)
            except KeyError: pass
        raise KeyError(f'{lid}: {word}')

    # ======================================================== 0 · the problem: a distributor's godown, a carton's date, the bin (cut 10: in 10 s)
    t0, t1 = 0.0, a('i13', 'close') - 0.3
    L_ = t1 - t0
    u_w, u_o = a('i01', 'write') - t0 + 0.02, a('i01', 'off') - t0 + 0.02
    u_k, u_s = a('i01', 'stock') - t0 + 0.05, a('i01', 'slowly') - t0 + 0.1
    side = [u_k + (u_s - u_k) * (i / (len(STAMP_SIDE) - 1)) ** 0.8 for i in range(len(STAMP_SIDE))]
    stamps = list(zip(STAMP_BIG, [u_w, u_o], ['big'] * 2)) + list(zip(STAMP_SIDE, side, ['side'] * len(STAMP_SIDE)))
    u_sl = a('i01', 'sells') - t0
    u_t = a('i01', 'too') - t0 - 0.05        # the write-off rolls in on "too", so it holds before the cut
    scan, count = (0.3, 1.3), (a('i01', 'Every') - t0, u_w - 0.25)
    gone = {tid: u_ for tid, u_, _ in stamps}
    gone.update({'57': u_w - 0.2, '72': u_w - 0.2, '89': u_w - 0.2, '84': u_w - 0.1, '90': u_w - 0.1, '59': u_k, '99': u_k})
    god = StampedGodown7(stamps, TAGS, scan, count, gone, L_ + 1.0)
    add('open-godown', t0, t1, Layered(god, [], vign=0.22), [
        Blackout(0.0, 0.7),
        RedPulse([u_w, u_o]),
        DateTicker(64, 52, 0.35, L_ + 0.3, count[0], count[1]),
        Statement(72, 580, [('1,580 packs.', 96, INK, u_k), ('22 days left.', 96, AMBER, u_sl),
                            (lambda u, u_t=u_t: money(roll(u, u_t, u_t + 0.4, 0, 22657.2)) + ' written off.', 96, RED, u_t)],
                  'Munchly Mango Drink · one batch, MF-2410-118 · if nothing changes', u_sl + 0.2, L_ + 0.3, gap=108)])
    S[-1].stamps = stamps

    t0, t1 = t1, a('i13', 'destroyed') - 0.35
    L_ = t1 - t0
    lab = Still25D('o1b-carton-macro', z=(1.06, 1.2), pan=((0, 0), (0, 0)), dur=L_, focus=(0.49, 0.47), depth_k=0.35)
    boxes = json.loads((HERE / 'build' / 'labels' / 'MF-2410-118.boxes.json').read_text())
    LM = np.float32(json.loads((HERE / 'build' / 'labels' / 'o1b.json').read_text())['H'])
    u_bb = max(0.15, a('i13', 'date') - t0 - 0.3)
    add('open-label', t0, t1, Layered(lab, [(fx.Dust(n=120, seed=21, strength=0.45), 0.8), (fx.Rays(1700, -140, strength=0.22, turn=0.015), 0.9)], vign=0.3), [
        S7.LabelRings(lab, LM, boxes, [('bb', u_bb, L_ + 0.2, card('Best before 24 Oct 2026', 'Every carton carries its batch and its date.', ('proof', 'THE LABEL'), 400, 'a'))], card_at=(64, 560)),
        Countdown(64, 712, u_bb + 0.05, L_ + 0.3, 60, 22, dur=0.7),
        Sprite(chip_sprite('Too close for Blinkit, Zepto and Instamart', 'bad', 26), 64, 800, a('i13', 'quick') - t0 - 0.05, L_ + 0.3)])

    t0, t1 = t1, T['i03'][0] - 0.45        # the iris opens on the lockup as the voice says its name
    L_ = t1 - t0
    bin_ = ClipPush('w2-aerial-slow', z=(1.0, 1.0), pt=(W * 0.5, H * 0.5), dur=L_ + 1.4)
    u_d = a('i13', 'destroyed') - t0
    e0 = max(1.3, u_d + 0.1)
    add('open-landfill', t0, t1, Layered(bin_, [], vign=0.22), [
        CostStack(64, 64, [0.15, 0.5, 0.85, 1.2], 1.6, L_ + IRIS, w=560, pace=0.85),     # cut 11: a beat to read the bin
        ESGPanel(1300, 560, [('trash-2', lambda u, e0=e0: f'{roll(u, e0, e0 + 0.6, 0, 339.7):.1f} kg', 'of food, buried in landfill', e0),
                             ('cloud', lambda u, e0=e0: f'{roll(u, e0 + 0.3, e0 + 0.9, 0, 849.25):,.0f} kg CO₂e', 'for food no one eats (indicative)', e0 + 0.3),
                             ('recycle', '3.2 kg', 'of plastic packaging, to EPR', e0 + 0.6),
                             ('ban', '1,580 packs', 'that never reach anyone', e0 + 0.9)],
                 e0 + 1.25, L_ + IRIS, w=560)])

    # ======================================================== 1 · what it is: agentic software as a service (cut 9: condensed)
    tA = T['t01'][0] - 0.9            # the architecture starts a beat before its line
    t0, t1 = t1, tA
    L_ = t1 - t0
    add('saas', t0, t1, PageSeq(SAAS), [], xin='iris', xd=IRIS)
    S[-1].cues = {'i03': a('i03') - t0, 'turns': a('i03', 'turns') - t0, 'write': a('i03', 'write') - t0, 'recovery': a('i03', 'recovery') - t0,
                  'b91': a('b91') - t0, 'agentic': a('b91', 'Agentic') - t0, 'service': a('b91', 'service') - t0, 'fmcg': a('b91', 'FMCG') - t0,
                  'supply': a('b91', 'supply') - t0, 'brands': a('b91', 'brands') - t0, 'distributors': a('b91', 'distributors') - t0,
                  'retailers': a('b91', 'retailers') - t0, 'end': round(L_ + UP + 0.2, 3)}

    # ======================================================== 2 · under the hood: the architecture and the Google models, in depth
    t0, t1 = tA, T['x24'][0] - PRE['x24']
    L_ = t1 - t0
    add('arch', t0, t1, PageSeq(ARCH), [], xin='up', xd=UP)
    S[-1].cues = arch_cues(a, t0, L_)

    # ======================================================== 3 · the live demo: two batches, two paths, and the people in them
    t0, t1 = t1, T['k01'][0] - PRE['k01']
    L_ = t1 - t0
    add('cast', t0, t1, PageSeq(CAST), [], xin='push', xd=PUSH)
    S[-1].cues = {'x': a('x24') - t0, 'live': a('x24', 'Live') - t0, 'production': a('x24', 'production') - t0, 'munchly': a('x24', 'Munchly') - t0,
                  'imaginary': a('x24', 'imaginary') - t0, 'brand': a('x24', 'brand') - t0, 'two': a('x24', 'two') - t0, 'batches': a('x24', 'batches') - t0,
                  'different': a('x24', 'different') - t0, 'distributors': a('x24', 'distributors') - t0, 'one': a('x24', 'One') - t0,
                  'happy': a('x24', 'happy') - t0, 'sad': a('x24', 'sad') - t0, 'end': round(L_ + PUSH + 0.2, 3)}

    # ======================================================== 4 · the console: a brand set up in minutes
    t0, t1 = t1, T['p02'][0] - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    b_ = [a('k01', 'stock') - t0 - 0.25, a('k01', 'people') - t0 - 0.25, a('k01', 'gates') - t0 - 0.25, a('k01', 'agents') - t0 - 0.25]
    # the clients (103.0), Kaveri Foods opened (104.4), its first stock export mapped (114.0), its people (130.8), the
    # SKUs' quick-commerce gates (144.6), its agents (199.0): each span of the walk with no stage card or chapter chip
    segs = [(103.0, 104.4, 1.4), (104.4, 104.4 + b_[0] - 1.4, b_[0] - 1.4), (114.0, 114.0 + b_[1] - b_[0], b_[1] - b_[0]),
            (130.8, 130.8 + b_[2] - b_[1], b_[2] - b_[1]), (144.6, 144.6 + b_[3] - b_[2], b_[3] - b_[2]), (199.0, 199.0 + Lx - b_[3], Lx - b_[3])]
    cw = AW(segs, 'smartclearance-console.web.app/clients')
    st = [cw.seg_start(i, Lx) for i in range(len(segs))]
    add('console', t0, t1, room('neha', t0), [
        cw,
        head(64, 60, 0.3, L_ + 0.3, '01 · THE CONSOLE', 'A brand, set up in minutes.', width=500, hsize=44),
        Steps(['Every client, one console', 'Stock export, mapped', 'People, invited', 'SKU gates, per SKU', 'Agents, tuned'],
              [0.3, st[2], st[3], st[4], st[5]], 64, 330, u0=0.3),
        Ring(cw, (365, 235, 1540, 690), st[2] + 0.15, st[3] - 0.05),
        Ring(cw, (360, 495, 1090, 225), st[3] + 0.15, st[4] - 0.05),
        Ring(cw, (360, 812, 1545, 72), st[4] + 0.15, st[5] - 0.05),
        Ring(cw, (1450, 540, 440, 230), st[5] + 0.15, L_ + 0.3),
        Sprite(card('Software as a service', 'Every brand its own workspace, on its own address: kaveri-smartclearance.web.app', ('result', 'SAAS'), 470), 64, 660, 0.7, L_ + 0.3),
        TechTag('Cloud SQL', 'every client, every rule, on the record', 0.6, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # ======================================================== 5 · the workspace, installed as an app on every device (cut 9: faster)
    t0, t1 = t1, T['q01'][0] - PRE['q01']
    L_ = t1 - t0
    add('install', t0, t1, PageSeq(PWA), [], xin='push', xd=PUSH)
    ph = a('p02', 'phone') - t0
    S[-1].cues = {'progressive': max(0.35, a('p02') - t0 + 0.05), 'install': a('p02', 'installs') - t0, 'browser': a('p02', 'app') - t0,
                  'laptop': a('p02', 'laptop') - t0, 'tablet': a('p02', 'tablet') - t0, 'phone': ph,
                  'alert': ph + 0.7, 'notification': ph + 1.2, 'end': round(L_ + PUSH + 0.2, 3)}

    # ======================================================== 6 · Priya signs in, live; her Command Center tracks the batches at risk
    t0, t1 = t1, T['q02'][0] - 0.3
    L_ = t1 - t0
    # the mango recording's own sign-in on her tablet: her email typed, the password, Sign in pressed (6.62), the
    # button's S lapping while it signs in, "Welcome, Priya", then "Good afternoon, Priya" as her workspace opens
    pw = PW('mango', [(3.0, 6.8), (9.0, 9.5), (11.0, 11.55), (12.05, 12.95)], WS)
    q = [pw.seg_start(i, L_) for i in range(4)]
    u_press = pw.u_of(6.62, L_)
    add('signin', t0, t1, room('priya', t0), [
        pw,
        head(64, 60, 0.3, L_ + 0.3, '02 · LIVE · SUPPLY CHAIN', 'Priya signs in.', width=600, hsize=46),
        StepFlow(64, 236, 600, [('tablet', "Priya's tablet", 'the workspace, installed as an app', 'device'),
                                ('key', 'Firebase Authentication', 'her email and password', 'gcp'),
                                ('badge-check', 'An ID token', 'checked on every request', 'gcp'),
                                ('server', 'backend-api', 'her role: supply chain operator', 'gcp'),
                                ('layout-dashboard', 'Her Command Center', 'live, over server-sent events', 'device')],
                 [0.3, u_press + 0.1, q[1] + 0.15, q[2] + 0.1, q[3] + 0.25], 0.2, L_ + 0.3, title='UNDER THE HOOD · SIGNING IN'),
        Ring(pw, (668, 304, 340, 42), 0.35, u_press - 0.55),
        Ring(pw, (668, 431, 340, 44), u_press - 0.45, q[2] - 0.05, accent='a'),
        TechTag('Firebase Authentication', 'one sign-in for every app', 0.6, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    t0, t1 = t1, a('m03') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    u_days, u_sell, u_cost = a('q02', 'days') - t0, a('q02', 'sell') - t0, a('q02', 'cost') - t0
    u_fl, u_two, u_mg, u_ms = a('q03', 'flags') - t0, a('q03', 'two') - t0, a('q03', 'Mango') - t0, a('q03', 'Masala') - t0
    # the sad recording's Command Center: the watchlist (98.5, after an earlier push has gone), the Watcher's two pushes
    # landing (104.8), the flagged batches and the Mango Drink's card (106.9), then the Masala Chips' card, held: it is on
    # screen clean only from 115.95 to 116.1, before the stage's own card dims it
    d1 = u_fl - 1.0                        # the pushes start to land as the voice reaches the Watcher
    d2 = (u_two + 0.75) - d1               # they land at their own pace (about 1x); the page turns to its flagged batches at 107.05
    d3 = (u_ms - 0.15) - (d1 + d2)
    d4 = Lx - (d1 + d2 + d3)
    pw = PW('sad', [(98.5, 104.8, d1), (104.8, 107.05, d2), (107.05, 107.05 + min(4.0, d3), d3), (115.95, 116.08, d4)], WS + '/command')
    c1 = d1 + d2 + d3
    add('command', t0, t1, room('priya', t0), [
        pw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'watcher', [('bigquery.sellthrough', '28 days · every batch, every morning', ''),
                                                          ('gates.check', 'Blinkit · Zepto · Instamart: both fail', 'bad'),
                                                          ('pubsub.publish', 'batch.at_risk → Priya · 2 batches', 'ok')])],
                  'Every batch at risk, tracked.', width=640, call_gap=max(0.8, (d1 - 0.95) / 2)),
        TrackList(64, 330, 600, [u_days - 0.1, u_sell - 0.1, u_sell + 0.55, u_cost - 0.1], 0.4, d1 + 0.15),
        Ring(pw, (262, 425, 470, 162), 0.6, u_sell - 0.15, card=card('Two batches at risk', 'Mango Drink: 22 days left, 1,580 packs. Masala Chips: 47 days, 1,360.', ('live', 'WATCHLIST'), 600), at=(64, 740)),
        Ring(pw, (262, 588, 470, 158), u_sell, u_cost - 0.15, card=card('Gated, but selling through', 'Peanut Chikki sells out six days before retailers stop: nothing to do.', ('result', 'WATCHLIST'), 600), at=(64, 740)),
        Ring(pw, (262, 425, 470, 162), u_cost, d1 - 0.05, accent='a', card=card('₹48,987 at stake, if both are destroyed', 'The stock, the disposal, EPR and the GST credit reversed.', ('live', 'THE BIN'), 600, 'a'), at=(64, 740)),
        PushOut(pw, 'detect', d1 + 0.15, d1 + 0.85, (64, 340), 600, d1 + d2 - 0.05, own=False, src=(716, 60, 348, 108)),
        PushOut(pw, 'detect-chips', d1 + 0.5, d1 + 1.15, (64, 520), 600, d1 + d2 - 0.05, own=False, src=(716, 176, 348, 108)),
        Ring(pw, (246, 226, 488, 52), d1 + d2 + 0.1, min(u_mg - 0.15, d1 + d2 + 1.2)),
        Ring(pw, (272, 386, 270, 190), min(u_mg - 0.05, d1 + d2 + 1.25), c1 - 0.05, accent='a', card=card('₹22,657 at stake · 22 days left', 'Munchly Mango Drink: blocked from Blinkit, Zepto and Instamart.', ('live', 'FLAGGED'), 600, 'a'), at=(64, 360)),
        Ring(pw, (272, 386, 270, 190), c1 + 0.05, L_ + 0.3, accent='a', card=card('₹26,330 at stake · 47 days left', 'Munchly Masala Chips: blocked from quick commerce too.', ('live', 'FLAGGED'), 600, 'a'), at=(64, 360)),
        TechTag('BigQuery', '28 days of sell-through, every morning', 0.6, d1),
        TechTag('Firebase Cloud Messaging', "each flag, a push to Priya's devices", d1 + 0.2, L_ + 0.3)], xin='cut')

    # ======================================================== 7 · the happy path: Munchly Mango Drink, Lakshmi Agencies
    # -- verify: Lakshmi Agencies photographs the label, Vision reads it
    t0, t1 = t1, a('m04') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    lw = LW('mango', [(104.8, 106.2), (112.0, 113.4), (115.8, 116.8), (120.6, 122.2), (133.8, 134.9), (141.0, 142.4)], WS + '/home', LAKSHMI)
    sg = [lw.seg_start(i, Lx) for i in range(6)]
    v_read, v_ok = sg[3], sg[4]
    t_fly = sg[2] + 0.05
    fl = Flow([('tablet', "Lakshmi Agencies' tablet", 'the workspace, installed as an app', 'device'),
               ('cloud-upload', 'Cloud Storage', 'sc-photos-prod · by a signed link', 'data'),
               ('radio', 'Pub/Sub', 'journey.step · the photo is in', 'gcp'),
               ('scan-line', 'Vision agent', 'ADK, on Cloud Run', 'agent'),
               ('sparkles', 'Gemini 3.8 Flash', 'reads batch, dates and MRP', 'model'),
               ('server', 'backend-api', 'matches the stock export · Cloud SQL', 'gcp'),
               ('monitor', "Priya's screen", 'verified, live', 'device')],
              [0.4, t_fly + 0.9, t_fly + 1.25, t_fly + 1.6, t_fly + 2.0, sg[4], sg[4] + 0.45], L_ + 0.3)
    add('verify', t0, t1, room('lakshmi', t0), [
        lw,
        Sprite(words_sprite(kicker='03 · HAPPY PATH · MUNCHLY MANGO DRINK 200 ML', width=900, kcolor='a'), 64, 24, 0.2, L_ + 0.3),
        AgentHead(64, 66, 0.3, L_ + 0.3, [(0.3, 'vision', [('fcm.send', 'Lakshmi Agencies · one photo of the label', 'ok'),
                                                         ('gemini.read_label', 'MF-2410-118 · 24 Oct 2026 · ₹20 · 0.97', 'ok'),
                                                         ('dms.reconcile', 'matches the stock export', 'ok')])],
                  'One photo of the label.', width=640, call_gap=max(0.8, v_read - 0.75)),
        PushOut(lw, 'verify', 0.3, 0.95, (64, 330), 600, sg[1] + 0.05),
        Inset(LABEL_PHOTO, 64, 330, 600, sg[1] + 0.25, v_ok + 0.35, caption='The photo she sent: batch, dates, MRP, FSSAI licence'),
        Ring(lw, (190, 760, 550, 160), v_ok + 0.05, L_ + 0.3, card=card('Vision: it matches the export', 'MF-2410-118 · best before 24 Oct 2026 · MRP ₹20', ('agent', 'VISION'), 440), at=(64, 380)),
        fl, DataFly(photo_token(LABEL_PHOTO), win_pt(lw, (172, 228, 406, 434)), hop_pt(fl, 1), t_fly, 0.9),
        TechTag('Gemini 3.8 Flash', 'reads the printed label', a('m03', 'Gemini') - t0 - 0.1, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- approve: the Valuer prices each exit, the Router splits it, Priya's one tap
    t0, t1 = t1, a('m05') - 0.3
    L_ = t1 - t0
    pw = PW('mango', [(162.0, 165.4), (171.8, 173.0), (177.2, 178.6), (180.2, 182.6), (199.4, 200.9), (209.4, 212.4)], WS + '/route/MF-2410-118')
    q = [pw.seg_start(i, L_ + PUSH) for i in range(6)]
    u_placed = pw.u_of(211.3, L_ + PUSH)
    r_split, r_yes = a('m04', 'router') - t0 - 0.15, a('m04', 'approves') - t0 - 0.2
    add('approve', t0, t1, room('priya', t0), [
        pw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'valuer', [('bigquery.price_history', 'beverages · 28 days of sell-through', ''),
                                                         ('writeoff.cost', '−₹14.34 a pack', 'bad')]),
                                        (r_split, 'router', [('allocate.greedy', '1,580 units → net ₹16,917', 'ok')]),
                                        (r_yes - 0.1, 'you', [])],
                  'Every exit priced. One yes.', width=640, call_gap=0.9),
        SplitWhy(70, 330, a('m04', 'history') - t0 - 0.2, a('m04', 'rules') - t0 - 0.2, r_split),
        PlanFlow(64, 330, r_split, L_ + 0.3, 'packs at risk', 1580,
                 [('52 kiranas', 'the scheme', 1372, (52, 211, 128)), ('Staff sale', 'at the godown', 150, (115, 201, 157)),
                  ('Feeding India', 'donated', 58, (247, 192, 74))], w=640, h=360),
        Ring(pw, (240, 150, 560, 160), q[0] + 1.4, q[1] - 0.05, card=card('The plan is ready', 'Priced by the Valuer, split by the Router: net ₹16,917.', ('agent', 'ROUTER'), 400), at=(64, 830)),
        Ring(pw, (660, 574, 398, 52), q[4] + 0.2, u_placed - 0.05, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 400, 'a'), at=(64, 830)),
        Ring(pw, (662, 150, 394, 590), u_placed + 0.05, L_ + 0.3, card=card('Plan placed', '₹22,194 better than the bin. The agents set off.', ('result', 'APPROVED'), 400), at=(64, 830)),
        TechTag('Gemini 3.1 Pro', 'prices, splits and explains', r_split - 0.2, L_ + 0.3, x=64, y=H - 74)], xin='push', xd=PUSH)

    # -- offer: the kirana gets the offer in Hindi and orders on her phone
    t0, t1 = t1, a('m05', 'each') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    kw_ = HW('mango', [(240.4, 241.6), (244.9, 246.6), (246.8, 248.6), (249.2, 250.6)], WS + '/offer/MF-2410-118', KIRANA)
    sg = [kw_.seg_start(i, Lx) for i in range(4)]
    add('offer', t0, t1, room('kirana', t0), [
        kw_,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'outreach', [('gemini.write_offer', 'Hindi · ₹14.40 a packet', 'ok'), ('fcm.send', '58 kiranas', 'ok')])],
                  'The offer, in her own language.', width=600, call_gap=1.0),
        PushOut(kw_, 'offer', 0.3, 1.15, (64, 300), 600, L_ + 0.3),
        Sprite(card('The same offer, in English', "Namaste! Today's offer on Munchly Mango Drink 200 ml: take 10 packets, get 2 free. Best before 24 Oct 2026. 48 hours only. Tap to order.", ('agent', 'WRITTEN BY OUTREACH'), 600), 64, 500, 1.75, L_ + 0.3),
        Ring(kw_, (18, 236, 396, 350), sg[1] + 0.1, sg[3] - 0.05),
        Ring(kw_, (18, 560, 396, 200), sg[3] + 0.05, L_ + 0.3,
             card=card('Ordered: 24 packets', 'Her tax invoice LA/26-27/0972 comes with it: ₹302.', ('live', 'ORDER'), 600), at=(64, 660)),
        KiranaMap(RX, 200, RW, 420, 'hyderabad', "LAKSHMI AGENCIES' KIRANAS · HYDERABAD", 'Begum Bazaar godown', 0.3, L_ + 0.3, 0.55, {},
                  [(lambda u: '58 kiranas · the offer in Hindi', AMBER)], seed=31),
        TechTag('Firebase Cloud Messaging', 'the offer as a push, to every phone', 0.8, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- orders: each order lands on Priya's screen, live
    t0, t1 = t1, a('m06') - 0.3
    L_ = t1 - t0
    pw = PW('mango', [(248.5, 248.5 + L_)], WS + '/execution/MF-2410-118', speed=1.0)   # the stage dims it from 252.2
    land = pw.u_of(251.0, L_)
    add('orders', t0, t1, room('priya', t0), [
        pw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'outreach', [('pubsub.publish', 'offer.received · 24 packets', 'ok'), ('sse.push', "Priya's screen, at once", 'ok')])],
                  "Live on Priya's screen.", width=640, call_gap=0.9),
        ofl := StepFlow(64, 300, 600, [('smartphone', "The kirana's phone", 'orders 24 packets', 'device'),
                                ('server', 'backend-api', 'the order and its GST invoice · Cloud SQL', 'gcp'),
                                ('radio', 'Pub/Sub', 'offer.received', 'gcp'),
                                ('monitor', "Priya's screen", 'live, over server-sent events', 'device')],
                 [0.25, land - 1.3, land - 0.85, land], 0.15, L_ + 0.3),
        DataFly(token_card('radio', 'offer.received', 'Sri Lakshmi Ganapathi Kirana · 24'), hop_pt(ofl, 2), win_pt(pw, (258, 322, 200, 66)), land - 0.8, 0.8, arc=-60),
        Ring(pw, (258, 322, 200, 66), land - 0.1, L_ + 0.3, card=card("Live on Priya's screen", 'The order lands the moment the shop taps: 24 packets.', ('live', 'EXECUTION'), 440), at=(64, 730)),
        TechTag('Pub/Sub', 'each order an event, to the screen at once', 0.6, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- fill: fifty-two shops, each with its own GST invoice
    t0, t1 = t1, a('m07') - 0.3
    L_ = t1 - t0
    split = a('m06', 'each') - t0 - 0.2
    pw = PW('mango', [(296.0, 437.0, split - 0.2), (446.4, 446.4 + max(0.6, L_ + PUSH - split + 0.2), max(0.6, L_ + PUSH - split + 0.2))], WS + '/execution/MF-2410-118')
    ff = (437.0 - 296.0) / (split - 0.2)
    inv = Paper('mango-kirana-h0-p0.png', [((260, 330, 560, 368), 'CGST and SGST, 2.5% each', 'B2C, within Telangana'),
                                          ((470, 386, 560, 404), '₹302 for 24 packets', 'Sri Lakshmi Ganapathi Kirana · LA/26-27/0972')], split + 0.3, L_ + PUSH)
    ffw = split - 0.2
    # the scheme's counts as Priya's screen shows them through the fast-forward (read off the recording every few
    # seconds: shops, packets), so the map beside it keeps pace with the window
    READ = [(296, 3, 84), (300, 5, 120), (306, 7, 192), (312, 10, 248), (320, 12, 320), (330, 15, 408), (340, 18, 476),
            (350, 21, 560), (360, 24, 640), (370, 28, 744), (380, 31, 820), (390, 34, 908), (400, 37, 996), (410, 41, 1096),
            (420, 45, 1212), (430, 48, 1280), (436, 51, 1356)]
    def ur(rt): return (rt - 296.0) / 141.0 * ffw
    cnt = [(max(0.05, ur(rt)), n) for rt, n, _ in READ] + [(pw.u_of(446.6, L_ + PUSH), 52)]
    pks = [(max(0.05, ur(rt)), k) for rt, _, k in READ] + [(pw.u_of(446.6, L_ + PUSH), 1372)]
    ords = curve_states('hyderabad', cnt, seed=52, first='h0')
    pk_u, pk_v = [p_[0] for p_ in pks], [p_[1] for p_ in pks]
    add('fill', t0, t1, room('priya', t0), [
        pw, Badge(f'Fast-forward {ff:.0f}×', 1660, 270, 0.2, split - 0.4),
        AgentHead(64, 52, 0.2, L_ + 0.3, [(0.2, 'outreach', [('orders.sum', '1,372 units · 52 shops', 'ok')]),
                                         (split - 0.2, 'paperwork', [('docs.kirana_invoice', 'LA/26-27/0972 … one per order', 'ok')])],
                  'The scheme fills.', width=600, call_gap=0.8),
        KiranaMap(64, 300, 600, 300, 'hyderabad', "LAKSHMI AGENCIES' KIRANAS · HYDERABAD", 'Begum Bazaar godown', 0.05, L_ + 0.3, None, ords,
                  [(lambda u, a_=pk_u, b_=pk_v: f"{n0(round(float(np.interp(u, a_, b_))))} of 1,372 packets", G),
                   (lambda u, o=ords: f"{sum(1 for st, t in o.values() if u >= t)} of 58 shops ordered", INK)], seed=31),
        InvoiceStack(64, 742, split - 0.5, L_ + 0.3),
        Ring(pw, (258, 668, 420, 46), 0.4, split - 0.2),
        PaperShow([inv], cx=1040, zx=1030)])

    # -- the staff sale by UPI, and Vision's check of the receipt
    t0, t1 = t1, a('m08') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    lw = LW('mango', [(456.0, 456.9), (459.6, 461.0), (473.2, 476.4), (477.6, 480.6)], WS + '/deliveries/MF-2410-118', LAKSHMI)
    sg = [lw.seg_start(i, Lx) for i in range(4)]
    add('upi', t0, t1, room('upi', t0), [
        lw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'vision', [('fcm.send', 'Lakshmi Agencies · staff sale, 150 packs at ₹8', 'ok'),
                                                         ('gemini.read_receipt', '18 UPI payments · ₹1,200 = 150 × ₹8', 'ok')])],
                  'Paid by UPI, one scan each.', width=600, call_gap=max(0.8, sg[2] - 0.65)),
        PushOut(lw, 'staff', 0.3, 0.95, (64, 300), 600, sg[1] + 0.05),
        Inset(RECEIPT_PHOTO, 64, 300, 340, sg[1] + 0.25, L_ + 0.3, caption='The receipt, as sent'),
        Payments(RX - 10, 190, 0.5, L_ + 0.3, rows=12, every=0.12),
        Ring(lw, (110, 468, 705, 160), sg[2] + 0.1, sg[3] - 0.05,
             card=card('Vision read the receipt', '18 UPI payments, ₹1,200: it matches 150 packs at ₹8.', ('agent', 'VISION'), 600), at=(64, 820)),
        Ring(lw, (40, 300, 780, 320), sg[3] + 0.3, L_ + 0.3)], xin='push', xd=PUSH)

    # -- the donation: Feeding India collects, and its receipt
    t0, t1 = t1, a('m09') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    mw = HW('mango', [(526.4, 528.2), (534.3, 536.4), (541.7, 542.5), (550.1, 551.8)], WS + '/pickups', MEERA)
    sg = [mw.seg_start(i, Lx) for i in range(4)]
    add('donation', t0, t1, room('meera', t0), [
        mw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'impact', [('pickup.confirm', 'Saturday 10:00 · 58 packs', 'ok'), ('docs.receipt', 'FI/HYD/26-27/0417 · 58 meals', 'ok')])],
                  'Feeding India collects.', width=600, call_gap=1.1),
        DonationMeals(64, 330, 0.6, L_ + 0.3, w=600),
        Ring(mw, (10, 560, 430, 260), sg[3] + 0.1, L_ + 0.3),
        PushOut(mw, 'pickup', 0.3, 1.15, (RX, 190), RW, L_ + 0.3),
        Inset(HERE / 'build' / 'papers' / 'png' / 'mango-receipt-p0.png', RX + 60, 360, 380, sg[2] - 0.6, L_ + 0.3, caption='Receipt FI/HYD/26-27/0417 · for BRSR'),
        TechTag('Cloud Storage', "the receipt's PDF, kept for good", sg[3], L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- the papers in Priya's pack, then Lakshmi Agencies ends whole
    t0, t1 = t1, a('m09', 'Lakshmi') - 0.3
    L_ = t1 - t0
    pw = PW('mango', [(590.0, 591.4), (599.5, 600.6), (607.4, 608.4), (611.5, 612.6)], WS + '/paperwork/MF-2410-118')
    add('papers', t0, t1, room('priya', t0), [
        pw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'paperwork', [('docs.credit_note', 'CN/0117 · ₹5,932 · signed', 'ok'), ('itc.memo', '₹837 kept · s.17(5)(h)', 'ok')])],
                  'Every paper, drafted and signed.', width=620, call_gap=1.0),
        Checklist(64, 330, [('Price-support credit note', 'CN/0117 · ₹5,932, signed', 0.5), ('Staff sale receipt', 'LA/SR/26-27/0002 · 18 UPI payments', pw.seg_start(1, L_ + PUSH)),
                            ('Donation receipt', 'FI/HYD/26-27/0417 · 58 meals', pw.seg_start(2, L_ + PUSH)), ('GST ITC memo', 's.17(5)(h) · ₹837 kept', pw.seg_start(3, L_ + PUSH))], L_ + 0.3, gap=110, width=600),
        TechTag('Cloud Storage', 'every PDF, kept for good', a('m09', 'cloud') - t0 - 0.1, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    t0, t1 = t1, T['s01'][0] - PRE['s01']
    L_ = t1 - t0
    lw = LW('mango', [(748.0, 748.0 + L_ + WIPE)], WS + '/batches/MF-2410-118', LAKSHMI, speed=1.0)
    add('whole', t0, t1, room('lakshmi', t0), [
        lw,
        head(64, 60, 0.3, L_ + 0.3, 'SETTLE', 'Lakshmi Agencies ends whole.', width=600, hsize=46),
        Sprite(card('Price support · CN/0117 · ₹5,932', 'Munchly makes good what the scheme and the staff sale gave away.', ('proof', 'CREDIT NOTE'), 600), 64, 300, 0.35, L_ + 0.3),
        Sprite(card('Every pack accounted for', 'Sold to 52 kiranas, sold to the staff, or collected by Feeding India.', ('result', 'NOTHING LEFT'), 600), 64, 460, 0.7, L_ + 0.3),
        Sprite(card('Every paper signed', 'CN/0117 · LA/SR/26-27/0002 · FI/HYD/26-27/0417, each with its PDF.', ('proof', 'PAPERWORK'), 600), 64, 620, 1.05, L_ + 0.3),
        BigFigure(RX, 300, RW, 'LAKSHMI AGENCIES · OUT OF POCKET', '₹0', ['She ends whole on the batch.', 'Signed papers for every rupee.'], 0.5, L_ + 0.3)], xin='push', xd=PUSH)

    # ======================================================== 6 · the sad path: Munchly Masala Chips, Rakesh Traders
    # -- the kiranas: two order, the rest say no
    t0, t1 = t1, a('s02') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    kw_ = HW('sad', [(257.2, 259.0), (259.6, 261.6), (262.0, 263.2), (328.8, 332.4), (342.2, 343.6)], WS + '/offer/MF-2409-117', GANESH)
    sg = [kw_.seg_start(i, Lx) for i in range(5)]
    o0 = sg[3]
    kw_.who_at = [(o0, ('Om Sai Provision', 'Kirana · Nagpur', 'OS'))]
    add('chips', t0, t1, room('rakesh', t0), [
        kw_,
        Sprite(words_sprite(kicker='04 · SAD PATH · MUNCHLY MASALA CHIPS 150 G', width=900, kcolor='a'), 64, 24, 0.2, L_ + 0.3),
        head(64, 62, 0.3, L_ + 0.3, None, 'Not every batch sells.', width=600, hsize=46),
        PushOut(kw_, 'offer-ganesh', 0.3, 1.15, (64, 170), 600, L_ + 0.3),
        Ring(kw_, (18, 236, 396, 350), sg[1] - 0.6, sg[2] + 0.6),
        Sprite(card('Shree Ganesh Kirana orders 24', 'One of two shops: 24 packets, on the van round.', ('live', 'ORDER'), 600), 64, 360, sg[1] - 0.3, L_ + 0.3),
        Ring(kw_, (18, 560, 396, 160), o0 + 0.2, L_ + 0.3, accent='a',
             card=card('Om Sai Provision: not this time', '35 of 38 shops say no. The window stays open 48 hours.', ('result', 'DECLINED'), 600, 'a'), at=(64, 530)),
        KiranaMap(RX, 200, RW, 420, 'nagpur', "RAKESH TRADERS' KIRANAS · NAGPUR", 'Kalamna Market godown', 0.3, L_ + 0.3, 0.5, sad_states(1.0, o0 + 1.4),
                  [(lambda u: '2 ordered · 48 packets' if u >= 1.6 else ' ', G), (lambda u, o=o0: f"{max(1, int(round(35 * clamp((u - 1.2) / (o + 1.2)))))} said not this time" if u >= 1.2 else ' ', RED),
                   (lambda u, o=o0: '1 never answered' if u >= o + 1.4 else ' ', (160, 170, 166))], seed=7),
        TechTag('Firebase Cloud Messaging', 'the offer in Hindi, to 38 kiranas', 0.8, L_ + 0.3, x=64)],
        xin='wipe', xd=WIPE)

    # -- the ExpireSoon lot: a bid, the Negotiator's counter, the lot won
    t0, t1 = t1, a('s03') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    aw = HW('sad', [(429.0, 431.0), (431.2, 432.8), (433.0, 435.0), (448.4, 451.5), (459.0, 462.4)], WS + '/market/ES-24117', AGRAWAL)   # 451.6: the stage's card
    q = [aw.seg_start(i, Lx) for i in range(5)]
    u_won = aw.u_of(461.0, Lx)
    add('lot', t0, t1, room('agrawal', t0), [
        aw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'lister', [('expiresoon.list', 'ES-24117 · 772 packs · reserve hidden', 'ok')]),
                                        (q[3] - 0.2, 'negotiator', [('listing.bid', 'Agrawal Wholesale · ₹13.00 for 772', ''),
                                                                  ('listing.counter', '₹13.00 → ₹14.20, 24-hour dispatch', 'ok')])],
                  'The Negotiator sells the lot.', width=600, call_gap=1.0),
        ExpireSoonCard(64, 330, 0.5, L_ + 0.3, w=600),
        Ring(aw, (16, 400, 418, 152), q[2] + 0.1, q[3] - 0.05),
        PriceLadder(64, 530, 0.8, q[2] + 0.3, q[3] + 0.6, u_won, L_ + 0.3, w=600),
        Ring(aw, (14, 364, 422, 220), u_won, L_ + 0.3, card=card('Lot won at ₹14.20', '772 packs to Agrawal Wholesale, Raipur · a ₹1,644 token paid.', ('result', 'EXPIRESOON'), RW), at=(RX, 660)),
        Sprite(card('What the Negotiator knows', "The bid, the ask and the lot. Munchly's reserve stays with the API: it never reaches the model.", ('agent', 'NEGOTIATOR'), RW), RX, 200, 0.6, L_ + 0.3),
        PushOut(aw, 'counter', q[3] + 0.15, q[3] + 1.0, (RX, 400), RW, L_ + 0.3),
        TechTag('Gemini 3.1 Pro', 'negotiates; the reserve never reaches it', q[3] - 0.2, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- the window closes: 540 packets left at the godown
    t0, t1 = t1, a('s04') - 0.3
    L_ = t1 - t0
    pw = PW('sad', [(500.0, 500.0 + L_ + PUSH)], WS + '/execution/MF-2409-117', speed=1.0)
    add('window', t0, t1, room('priya-eve', t0), [
        pw,
        head(64, 52, 0.3, L_ + 0.3, 'EXECUTE', 'The offer window closes.', width=640, hsize=46),
        WindowFunnel(64, 236, 0.4, L_ + 0.3),
        Ring(pw, (265, 348, 438, 120), 0.6, L_ + 0.3, card=card('540 packets stayed at the godown', 'Neha closed the window from the console: 48 of 588 ordered.', ('live', 'EXECUTION'), 420, 'a'), at=(64, 820))],
        xin='push', xd=PUSH)

    # -- expiry day: Rakesh is asked to destroy them, and prove it
    t0, t1 = t1, a('s05') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    rw = LW('sad', [(550.6, 552.4), (562.4, 563.1), (573.0, 574.6), (577.2, 579.8)], WS + '/home', RAKESH)   # 551.1: the push lands; 558.7-562.3: the stage's chapter chip
    sg = [rw.seg_start(i, Lx) for i in range(4)]
    add('destroy-ask', t0, t1, room('rakesh', t0), [
        rw,
        head(64, 52, 0.3, L_ + 0.3, 'EXPIRY DAY', 'Destroy them, and prove it.', width=600, hsize=46, stop=7),
        PushOut(rw, 'destroy', rw.u_of(551.1, Lx), rw.u_of(551.1, Lx) + 0.75, (64, 250), 600, L_ + 0.3, own=False, src=(437, 68, 393, 120)),
        Sprite(card("Settled by Munchly's policy", "Destroyed at the godown, against evidence: two photos, an authorised agency's certificate, and a second yes.", ('proof', 'THE RULE'), 600), 64, 560, 0.9, L_ + 0.3),
        Ring(rw, (40, 330, 780, 120), sg[1] + 0.05, sg[2] - 0.05),
        Ring(rw, (40, 520, 780, 120), sg[3] + 0.1, L_ + 0.3),
        ProofPlan(RX, 170, 0.4, L_ + 0.3, w=RW),
        TechTag('Cloud Scheduler', 'expiry day falls due on its own', 0.6, L_ + 0.3, x=64)], xin='push', xd=PUSH)

    # -- at the landfill: the photos, then the certificate signed in place by four
    t0, t1 = t1, a('s06') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    # the other three signers fast-forwarded sheet to sheet: each signer's sheet from its blank pad to its signature
    # (the moments between, the sheet closed on the certificate, flickered for a frame at this speed)
    seg_ff = 2.0
    FF = [(603.5, 621.0), (624.0, 635.4), (638.5, 654.4)]
    ff_src = sum(b - a for a, b in FF)
    rw = LW('sad', [(574.3, 576.2, 1.8), (588.8, 590.4, 1.55), (594.6, 598.8, 3.9)] + [(a, b, seg_ff * (b - a) / ff_src) for a, b in FF]
            + [(656.0, 658.0, max(0.8, Lx - 1.8 - 1.55 - 3.9 - seg_ff))], WS + '/destroy/MF-2409-117', RAKESH)
    q = [rw.seg_start(i, Lx) for i in range(7)]
    q = q[:4] + [q[6]]                       # q[3]: the fast-forward's start, q[4]: the certificate signed by four
    before = photo_card(EVID / 'destruction-before-540-packs.webp', 290, 218, 16)
    after = photo_card(EVID / 'destruction-after-540-packs.webp', 290, 218, 16)
    t_fly = q[4] + 0.15
    add('sign', t0, t1, room('sign', t0), [
        rw,
        head(64, 52, 0.3, L_ + 0.3, 'SETTLE · AT THE LANDFILL', 'Photographed, then signed in place.', width=600, hsize=44, stop=7),
        Sprite(before, 64, 250, 0.35, L_ + 0.3), Sprite(after, 374, 250, 0.6, L_ + 0.3),
        Sprite(TX('Before · 540 packs, the batch slip', 'g', 17, 560, MUTED), 66, 478, 0.5, L_ + 0.3),
        Sprite(TX('After · at the landfill, the slate', 'g', 17, 560, MUTED), 376, 478, 0.75, L_ + 0.3),
        Badge(f'Fast-forward {ff_src / seg_ff:.0f}×', 1160, 150, q[3], q[4]),
        Ring(rw, (40, 120, 780, 300), 0.2, q[1] - 0.05),
        Ring(rw, (146, 728, 634, 280), q[4] + 0.1, L_ + 0.3),
        Sprite(card('Orange City Enviro Services', 'An authorised agency: its officer and two independent witnesses sign with Rakesh.', ('proof', 'OCE/DC/26-27/0219'), 600), 64, 530, 1.0, L_ + 0.3),
        SignSlots(RX, 240, q[2], L_ + 0.3, w=RW),
        ServiceBadge(RX, 600, 'database', 'Cloud SQL · the case record', 'sc.cases · four signatures, as strokes', q[2], L_ + 0.3, lands=(t_fly + 0.85,), w=RW),
        DataFly(token_card('signature', '4 signatures', 'strokes, each with its time'), win_pt(rw, (146, 728, 634, 280)), (RX + 40, 638), t_fly, 0.85)],
        xin='push', xd=PUSH)

    # -- Vision checks the photos on Rakesh's tablet, then Priya's second yes
    t0, t1 = t1, a('s06', 'Only') - 0.3
    L_ = t1 - t0
    Lx = L_ + PUSH
    rw = LW('sad', [(669.8, 670.8), (684.0, 685.4)], WS + '/destroy/MF-2409-117', RAKESH)
    add('vision', t0, t1, room('photo', t0), [
        rw,
        AgentHead(64, 52, 0.25, L_ + 0.3, [(0.25, 'vision', [('gemini.read_destruction', 'slip MF-2409-117 · ~540 packs', 'ok'), ('gemini.read_slate', 'MF-2409-117 · 540 · 03-10 · landfill', 'ok')])],
                  'Vision checks the photos.', width=600, call_gap=0.7),
        Sprite(photo_card(EVID / 'destruction-before-540-packs.webp', 290, 218, 16), 64, 330, 0.0, L_ + 0.3),
        Sprite(photo_card(EVID / 'destruction-after-540-packs.webp', 290, 218, 16), 374, 330, 0.0, L_ + 0.3),
        ChecksPanel(RX, 190, 0.3, 99, L_ + 0.3, w=RW)], xin='push', xd=PUSH)

    t0, t1 = t1, T['r01'][0] - PRE['r01']
    L_ = t1 - t0
    pw = PW('sad', [(696.2, 699.2), (720.0, 723.4)], WS + '/execution/MF-2409-117')
    y1 = pw.seg_start(1, L_ + PUSH)
    add('second-yes', t0, t1, room('priya-eve', t0), [
        pw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'you', []), (y1 + 0.6, 'paperwork', [('docs.certificate', 'OCE/DC/26-27/0219', 'ok'), ('docs.expiry_credit', 'CN/0118 · ₹13,284', 'ok')])],
                  "Priya's second yes.", width=640, call_gap=0.6),
        Ring(pw, (655, 160, 405, 560), 0.3, y1 - 0.05, card=card('Both photos, four checks, four signatures', 'Only now can the papers be issued.', ('proof', 'REVIEW'), 420), at=(64, 330)),
        Ring(pw, (790, 676, 262, 50), y1 + 0.05, y1 + 1.0, accent='a', card=card('Approve · issue the papers', 'Her second yes.', ('result', 'ONE TAP'), 400, 'a'), at=(64, 330)),
        Ring(pw, (650, 160, 400, 560), y1 + 1.1, L_ + 0.3, card=card('Certificate and expiry credit note', 'OCE/DC/26-27/0219 · CN/0118 ₹13,284', ('proof', 'PAPERWORK'), 400), at=(64, 330)),
        ChecksPanel(64, 520, 0.4, y1 + 0.2, L_ + 0.3, w=600),
        Push(pw, 'review', 0.25, 1.9),
        cs2 := ServiceBadge(64, 850, 'hard-drive', 'Cloud Storage · the papers', 'gs://aibuilder-510213-sc-docs-prod/munchly/MF-2409-117/', y1 + 0.9, L_ + 0.3, lands=(y1 + 2.15, y1 + 2.45)),
        DataFly(token_card('file-text', 'OCE/DC/26-27/0219.pdf', 'certificate · signed by four'), win_pt(pw, (650, 160, 400, 260)), (104, 888), y1 + 1.3, 0.85),
        DataFly(token_card('file-text', 'CN/0118.pdf', 'expiry credit note · ₹13,284'), win_pt(pw, (650, 420, 400, 260)), (104, 888), y1 + 1.6, 0.85)],
        xin='push', xd=PUSH)

    # ======================================================== 7 · on the record: the audit trail, and one real trace
    t0, t1 = t1, a('s08') - 0.3
    L_ = t1 - t0
    rec = Seqs([HERE / 'build' / 'record2'], scale=0.5)
    rw_ = Window(None, None, [(1.9, 4.88, 2.4), (4.88, 11.28)], 96, 214, 0.78, WS + '/record/MF-2409-117', seq=rec, enter=False)
    u_sql, u_tr = a('r01', 'Cloud') - t0 - 0.1, a('r01', 'requests') - t0 - 0.25
    ua = max(u_sql - 1.0, 2.5)
    add('audit', t0, t1, room('priya-eve', t0), [
        head(64, 60, 0.2, L_ + 0.3, 'ON THE RECORD', 'Every step, every yes.', width=700, hsize=44),
        rw_,
        Ring(rw_, (272, 120, 892, 700), ua, u_tr - 0.15, card=card('63 steps · 3 yeses, in their names', "Every agent's run, every person's step and every yes, append-only, in Cloud SQL.", ('proof', 'AUDIT TRAIL'), 420), at=(1100, 420)),
        Ring(rw_, (290, 436, 500, 52), u_tr - 0.1, L_ + 0.3),
        TraceLink(rw_, (790, 462), u_tr + 0.1, L_ + 0.3, (1080, 300), elbow=1048),
        ServiceBadge(1100, 200, 'database', 'Cloud SQL · the audit log', 'sc.audit_log · append-only, by grants and triggers', 0.4, u_tr - 0.1, w=760),
        TracePanel(1100, 176, u_tr, u_tr + 0.4, L_ + 0.3, w=760),
        LogPanel(1100, 786, u_tr + 2.4, L_ + 0.3, w=760),
        TechTag('Cloud SQL', 'an append-only audit trail', u_sql, u_tr),
        TechTag('Cloud Trace', 'OpenTelemetry, from the tap to the model', u_tr + 0.3, L_ + 0.3)], xin='push', xd=PUSH)

    # ======================================================== 8 · the chips' swing, and Impact's ledger
    t0, t1 = t1, a('m11') - 0.3
    L_ = t1 - t0
    ends = a('s08', 'Rakesh') - t0
    res = SwingResult(0.15, L_ + 0.4, 'THE MASALA CHIPS · HOW THE SWING ADDS UP', 'chips', 'MF-2409-117 · Rakesh Traders, Nagpur',
                      11702.40, 14868.00,
                      [('If|destroyed', -26329.60, 'bin'), ('Kirana|scheme', 840.00, 'gain'), ('ExpireSoon|lot', 10862.40, 'gain'),
                       ('Not|paid', 3165.60, 'saved'), ('With|the plan', -11461.60, 'plan')],
                      [('Rakesh Traders ends whole · ₹0', 'good'), ('Certificate signed by four', 'good'), ('Every rupee on the record', 'good')],
                      [ends, ends + 0.5, ends + 1.0], ('sad', 1009.0), bg=S7.Room('f-rakesh-L', 14, 0.62).img, t0=0.5, every=0.4)
    add('chips-result', t0, t1, res, [TechTag('Cloud SQL', 'every rupee, worked out on the record', 0.4, ends - 0.05)], xin='push', xd=PUSH)

    t0, t1 = t1, a('d01') - 0.3
    L_ = t1 - t0
    iw = PW('sad', [(853.2, 854.6), (862.0, 864.6), (872.6, 875.6)], WS + '/report')
    q = [iw.seg_start(i, L_ + PUSH) for i in range(3)]
    add('impact', t0, t1, room('priya-eve', t0), [
        iw,
        AgentHead(64, 52, 0.3, L_ + 0.3, [(0.3, 'impact', [('ledger.post', 'MF-2409-117 · ₹11,702', 'ok'), ('brsr.rows', 'Principle 6 · 131.2 kg', 'ok')])],
                  'The ledger, ready for BRSR.', width=640, call_gap=1.0),
        KiloBars(64, 330, 0.5, L_ + 0.3),
        Ring(iw, (240, 248, 420, 74), q[0] + 0.1, q[1] - 0.05),
        Ring(iw, (252, 120, 780, 300), q[2] + 0.1, L_ + 0.3, accent='a', card=card('Ready for BRSR', "Each batch's own line: kilos kept, destroyed, its evidence.", ('proof', 'BRSR'), 600, 'a'), at=(64, 728)),
        ServiceBadge(64, 880, 'database', 'BigQuery · the impact ledger', 'smartclearance.impact_ledger · a row per exit', a('m11', 'BigQuery') - t0 - 0.6, L_ + 0.3,
                     lands=(a('m11', 'BigQuery') - t0 + 0.75,)),
        DataFly(token_card('database', 'MF-2409-117 · ₹11,702', '131.2 kg kept out of landfill'), win_pt(iw, (240, 248, 420, 74)), (104, 918), a('m11', 'BigQuery') - t0 - 0.1, 0.85)], xin='push', xd=PUSH)

    live = [x.name for x in S]
    a0, a1 = live.index('console'), live.index('impact')
    for i in range(a0, a1 + 1):
        if S[i].name in ('install', 'chips-result'): continue
        S[i].items.append(LiveTag(fin=(i == a0), fout=(i == a1)))

    # ======================================================== 9 · the close: the guided demo, on one card
    t0, t1 = t1, END
    tag = ['Nine', 'AI', 'agents,', 'one', 'yes,', 'and', 'nothing', 'good', 'goes', 'to', 'waste.']
    words = [(w, 0.9 + 0.06 * i) + (((247, 192, 74),) if w == 'yes,' else ()) for i, w in enumerate(tag)]
    add('end', t0, t1, EndCard9(t1 - t0, words, [1.7, 2.1], a('d01') - t0 - 0.1), [Blackout(t1 - t0 - 0.9, t1 - t0, into=True)], xin='push', xd=PUSH)
    return S


def arch_cues(a, t0, L):
    """the architecture page's cues (arch11, as arch10's), from the voice's own word times, in the shot's local time"""
    w = {'t01': ('t01', None), 'hood': ('t01', 'hood'), 'google': ('t01', 'Google'),
         'u02': ('u02', None), 'apps': ('u02', 'apps'), 'firebase': ('u02', 'Firebase'), 'api': ('u02', 'API'), 'run': ('u02', 'Run'),
         'sql': ('u02', 'SQL'), 'record': ('u02', 'record'),
         'u03': ('u03', None), 'pubsub': ('u03', 'Pub'), 'step': ('u03', 'step'), 'scheduler': ('u03', 'Scheduler'), 'clock': ('u03', 'clock'),
         'u04': ('u17', None), 'nine': ('u17', 'Nine'), 'adk': ('u17', 'ADK'), 'sales': ('u17', 'sales'), 'bigquery': ('u17', 'BigQuery'),
         'photos': ('u17', 'photos'), 'storage': ('u17', 'storage'),
         'u05': ('u18', None), 'platform': ('u18', 'Platform'), 'gemini': ('u18', 'Gemini'), 'pro': ('u18', 'Pro'),
         'prices': ('u18', 'prices'), 'negotiates': ('u18', 'negotiates'), 'flash': ('u18', 'Flash'), 'reads': ('u18', 'reads'), 'writes': ('u18', 'writes'),
         'u06': ('u06', None), 'models': ('u06', 'models'), 'money': ('u06', 'money'), 'api2': ('u06', 'API'), 'figure': ('u06', 'figure'),
         'person': ('u06', 'person'), 'yes': ('u06', 'yes')}
    c = {k: round(a(lid, word) - t0, 3) for k, (lid, word) in w.items()}
    c['watcher'] = round(c['sales'] - 0.15, 3)      # the Watcher, plain code, lights as the voice says it reads sales
    c['end'] = round(L + PUSH + 0.2, 3)
    return c


S_CACHE = None
def shots():
    global S_CACHE
    if S_CACHE is None: S_CACHE = build()
    return S_CACHE


if __name__ == '__main__':
    sh = build()
    for s_ in sh:
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0:5.2f}s  in:{s_.xin}')
    print('END', END)
    for name, key in (('saas', 'saas10'), ('arch', 'arch11'), ('cast', 'cast10'), ('install', 'pwa9')):
        sh_ = next(x for x in sh if x.name == name)
        (HERE / 'build' / f'{key}-cues.json').write_text(json.dumps({k: round(v, 3) for k, v in sh_.cues.items()}))
        print(f'{key} cues ->', sh_.cues.get('end'))
