"""SC-210: the sales film's shots, laid on the voice (the narrator's word timings, at()) and the talking scenes (their
clips' windows). Five acts: the waste; the product, the service and every brand's workspace; the agentic ecosystem in
depth; the journey through every exit, with the people who live it talking; the papers, the money, the record and the
impact; then what it plugs into and where to try it. Nothing the film draws names a client, a person or a product (the
app's screens are shown as they were recorded, on the maintainer's word); the people are their parts in the story."""
import json
from shots7 import (Shot, Room, Split, Stack, Steps, LabelRings, Flash, CamView, card, head, LABEL_PHOTO, EVID, XF, _takes_L)
from parts10 import *
import parts10 as P10

ECO = HERE / 'build' / 'eco'
WS = 'yourbrand-smartclearance.web.app'
CON = 'smartclearance-console.web.app'
# the people as their parts (their portraits from the app's cast, never their names)
LEAD = ('Supply chain lead', 'at the brand', 'p-priya')
DIST = ('A distributor', 'its godown', 'p-lakshmi')
DIST2 = ('A distributor', 'the batch at his godown', 'p-rakesh')
KIR = ('A kirana', 'one of 58 shops', 'p-lakshmi-ganapathi')
BUYER = ('A wholesale buyer', 'on the marketplace', 'p-agrawal')
FOOD = ('A food bank', 'collects the donation', 'p-meera')
TEAM = ('Platform team', 'the console', 'p-neha')


def P3(rec, segs, url, **kw): return Window(rec, 'P', segs, 770, 250, 1.0, url, who=LEAD, **kw)
def L3(rec, segs, url, w, **kw): return Window(rec, 'L', segs, 1200, 196, 0.68, url, who=w, **kw)
def H3(rec, segs, url, w, **kw): return Window(rec, 'H', segs, 1300, 176, 0.86, url, who=w, **kw)
def A3(segs, url, **kw): return Window('admin', 'A', segs, 584, 236, 0.66, url, who=TEAM, **kw)


class Seq:
    """backgrounds one after another: [(u start, drawable)], each cross-fading in over `xf`"""
    def __init__(self, parts, xf=0.35):
        self.parts, self.xf = parts, xf
    def draw(self, f, u, L=None):
        i = max(0, sum(1 for s, _ in self.parts if u >= s) - 1)
        s0, b = self.parts[i]
        b.draw(f, u - s0, L) if _takes_L(b) else b.draw(f, u - s0)
        if i > 0 and u - s0 < self.xf:
            prev = np.empty_like(f)
            sp, bp = self.parts[i - 1]
            bp.draw(prev, u - sp, L) if _takes_L(bp) else bp.draw(prev, u - sp)
            e = ease_in_out((u - s0) / self.xf)
            f[:] = prev * (1 - e) + f * e


class Live:
    """a clip as the frame, with film grain and a soft vignette (the live-action look)"""
    def __init__(self, key, z=(1.0, 1.05), pt=(W * 0.5, H * 0.5), dur=6.0, grain=0.02, vign=0.22):
        self.clip = ClipPush(key, z=z, pt=pt, dur=dur)
        self.grain = Grain(grain)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
        self.v = (1 - vign * np.clip(d - 0.35, 0, 1) ** 1.6)[..., None]
    def draw(self, f, u, L=None):
        self.clip.draw(f, u)
        f *= self.v
        self.grain.draw(f, u)


class Chip:
    def __init__(self, text, kind, x, y, u0, u1, size=28):
        self.spr, self.x, self.y, self.u0, self.u1 = chip_sprite(text, kind, size), x, y, u0, u1
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.3)
        if a <= 0: return
        e = ease_out((u - self.u0) / 0.45)
        blit(f, self.spr, self.x - 20 * (1 - e), self.y, a)


class PaperSprite:
    """a paper (its page as the Paperwork agent laid it out) rising onto the frame, with a ring on what matters"""
    def __init__(self, png, x, y, h, u0, u1, ang=-3.0, focus=None, u_ring=None):
        pg = cv2.imread(str(PAPERS / 'png' / png)).astype(np.float32) / 255
        s = h / pg.shape[0]
        self.pg = cv2.resize(pg, (int(pg.shape[1] * s), int(h)), interpolation=cv2.INTER_AREA)
        self.s, self.x, self.y, self.u0, self.u1, self.ang, self.focus, self.ur = s, x, y, u0, u1, ang, focus, u_ring
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.3, 0.35)
        if a <= 0: return
        e = ease_out((u - self.u0) / 0.6)
        h, w = self.pg.shape[:2]
        cx, cy = self.x + w / 2, self.y + h / 2 + 140 * (1 - e)
        ang = self.ang + 6 * (1 - e)
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0); M[0, 2] += cx - w / 2; M[1, 2] += cy - h / 2
        img = cv2.warpAffine(self.pg, M, (W, H), flags=cv2.INTER_LINEAR)
        m = cv2.warpAffine(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
        sh = np.roll(cv2.GaussianBlur(m, (0, 0), 16), 14, axis=0) * 0.5 * a
        f *= (1 - sh[..., None])
        mm = (m * a)[..., None]
        f[:] = f * (1 - mm) + img * mm
        if self.focus is not None and self.ur is not None and u > self.ur:
            x0, y0, x1, y1 = [v * self.s for v in self.focus]
            q = cv2.transform(np.float32([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]), M)[0]
            ring(f, q[:, 0].min() - 8, q[:, 1].min() - 6, q[:, 0].max() + 8, q[:, 1].max() + 6, 10,
                 prog=ease_out((u - self.ur) / 0.5), alpha=a, color=C['amber2'])


class CostStack10(CostStack):
    """the bin's cost in the order the line says it: written off, then the landfill's disposal and EPR, then the tax
    credit reversed; named as one batch (the shot is of another product's cartons)"""
    ROWS = [CostStack.ROWS[0], CostStack.ROWS[2], CostStack.ROWS[3], CostStack.ROWS[1]]
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.title = words_sprite(kicker='IF IT IS DESTROYED · ONE BATCH, 1,580 PACKS', width=self.w, kcolor='a')


def build():
    S = []
    def add(name, t0, t1, bg, items=()):
        S.append(Shot(name, t0, t1 + XF, bg, items))
    ALT = {'10': ['ten'], 'ten': ['10'], '1': ['one'], 'one': ['1'], 'BigQuery': ['big'], 'PubSub': ['pub'], 'smart': ['smartclearance'],
           'Kiranas': ['kiranas'], 'E': ['e-invoices', 'e']}
    def a(lid, word=None, k=0, edge='s'):
        for w_ in [word] + ALT.get(word, []):
            try: return at(lid, w_, k, edge)
            except KeyError: pass
        raise KeyError(f'{lid}: {word}')

    # ================================================================ I · the waste
    # the distributor's godown at dawn: a scan finds each carton's days to its date, the month running out
    t0, t1 = 0.0, T['o2'][0] - 0.35
    L_ = t1 - t0
    PT = (1772, 577)
    god = Dive(StampedGodown7([], TAGS, (0.45, 1.75), (0.6, L_ - 0.6), {}, L_ - 0.5), L_ - 0.45, L_ + XF, PT, z=3.4, mode='in')
    add('godown', t0, t1, Layered(god, [], vign=0.22), [
        Blackout(0.0, 1.1),
        DateTicker(64, 52, 0.7, L_ - 0.45, 0.6, L_ - 0.6),
        Grain(0.018)])

    # the carton's own label, its best-before ringed, the days running out
    t0, t1 = t1, T['t1'][0] - 0.12
    L_ = t1 - t0
    lab = Still25D('o1b-carton-macro', z=(1.0, 1.28), pan=((0, 0), (0, 0)), dur=L_ + XF, focus=(0.49, 0.47), depth_k=0.35)
    boxes = json.loads((HERE / 'build' / 'labels' / 'MF-2410-118.boxes.json').read_text())
    LM = np.float32(json.loads((HERE / 'build' / 'labels' / 'o1b.json').read_text())['H'])
    u_bb = a('o2', 'Because') - t0 - 0.4
    add('label', t0, t1, Dive(Layered(lab, [(fx.Dust(n=120, seed=21, strength=0.45), 0.8), (fx.Rays(1700, -140, strength=0.22, turn=0.015), 0.9)], vign=0.3),
                              0.0, 0.85, (W * 0.49, H * 0.47), z=2.3, mode='out'), [
        LabelRings(lab, LM, boxes, [('bb', u_bb, L_ + 0.2, card('Best before 24 Oct 2026', 'Every carton carries its batch and its date.', ('proof', 'THE LABEL'), 400, 'a'))], card_at=(64, 560)),
        Countdown(64, 712, u_bb + 0.5, L_ + 0.3, 60, 22),
        Grain(0.016)])

    # the distributor, in her own words
    t0, t1 = t1, T['t1'][1] + 0.3
    L_ = t1 - t0
    add('t1', t0, t1, TalkShot('t1', T['t1'][0] - t0, 'A distributor', 'at the godown, 22 days before the date', 'warehouse', dur=L_ + XF, pt=(W * 0.52, H * 0.42)), [Grain(0.016)])

    # too close for quick commerce, too slow for the shelf: on hold
    t0, t1 = t1, a('o3', 'So') - 0.25
    L_ = t1 - t0
    add('hold', t0, t1, Live('v-hold-L', dur=L_ + XF), [
        Shade('left', 0.6, 0.55),
        Chip('Quick commerce · too close to its date', 'bad', 72, 760, a('o3', 'quick') - t0 - 0.1, L_ + 0.3),
        Chip('The shelf · too slow to sell in time', 'bad', 72, 836, a('o3', 'slow') - t0 - 0.1, L_ + 0.3)])

    # written off, sent to a landfill, the tax credit reversed
    t0, t1 = t1, T['o4'][0] - 0.3
    L_ = t1 - t0
    u_w, u_lf, u_tax = a('o3', 'written') - t0, a('o3', 'landfill') - t0, a('o3', 'tax') - t0
    add('landfill', t0, t1, Live('w2-aerial-slow', z=(1.0, 1.0), dur=L_ + XF), [   # SC-209's bin: the batch's cartons in one trail, a drone descending
        Shade('left', 0.55, 0.62),
        StampSlam(1290, 470, u_w + 0.02, 'WRITTEN OFF', size=820, ang=-9),
        CostStack10(64, 64, [u_w + 0.1, u_lf, u_lf + 0.45, u_tax - 0.05], u_tax + 0.9, L_ + 0.3, w=560)])

    # week after week, brand after brand
    t0, t1 = t1, T['o5'][0] - 0.3
    L_ = t1 - t0
    ub1, ub2 = a('o4', 'brand') - t0, a('o4', 'brand', 1) - t0
    uw2 = a('o4', 'week', 1) - t0
    seq = Seq([(0.0, Layered(Still25D('o1-godown-stack-L', z=(1.0, 1.06), dur=3.0, focus=(0.42, 0.55), depth_k=0.5), [], vign=0.25)),
               (ub1 - 0.08, Layered(Still25D('b2-factory-tea', z=(1.0, 1.05), dur=1.4, focus=(0.5, 0.55), depth_k=0.4), [], vign=0.25)),
               (ub2 - 0.08, Layered(Still25D('b3-factory-biscuits', z=(1.0, 1.05), dur=2.0, focus=(0.5, 0.55), depth_k=0.4), [], vign=0.25))], xf=0.12)
    add('weeks', t0, t1, seq, [
        StampSlam(1180, 560, uw2 + 0.02, 'WRITTEN OFF', size=700, ang=-8, u1=ub1 - 0.05),
        StampSlam(820, 520, ub1 + 0.02, 'WRITTEN OFF', size=700, ang=7, u1=ub2 - 0.05),
        StampSlam(1100, 600, ub2 + 0.02, 'WRITTEN OFF', size=700, ang=-6),
        Grain(0.018)])

    # what if every one of those packs could still find a home? dawn at the bay
    t0, t1 = t1, T['p1'][0] - 0.35
    L_ = t1 - t0
    add('dawn', t0, t1, Live('v-dawn', z=(1.0, 1.05), dur=L_ + XF), [
        Shade('bottom', 0.5, 0.35),
        LightLeak(L_ - 0.9, 1.4, side=1, power=0.8)])

    # ================================================================ II · the product, the service, every brand's workspace
    t0, t1 = t1, T['p2'][0] - 0.3
    L_ = t1 - t0
    add('title', t0, t1, TitleScene(L_, 0.1, a('p1', 'smart') - t0), [])

    t0, t1 = t1, T['p3'][0] - 0.35
    L_ = t1 - t0
    add('saas', t0, t1, SaasScene(L_, a('p2', 'software') - t0, a('p2', 'write') - t0, a('p2', 'recovery') - t0,
                                  a('p2', 'as') - t0, a('p2', 'service') - t0, a('p2', 'into') - t0), [])

    t0, t1 = t1, a('p3', 'From') - 0.3
    L_ = t1 - t0
    add('brands', t0, t1, BrandsScene(L_, [0.0, L_ / 3, 2 * L_ / 3]), [])

    # the console: a new brand onboarded in minutes (the production console, as recorded)
    t0, t1 = t1, T['p5'][0] - 0.3
    L_ = t1 - t0
    def u(lid, word=None, k=0): return a(lid, word, k) - t0
    go = 1.2
    cues = [go + 1.15, u('p3', 'stock') - 0.15, u('p3', 'distributors') - 0.15, u('p3', 'people') - 0.15, u('p3', 'rules') - 0.15, L_ + XF]
    d = [max(0.6, cues[i + 1] - cues[i]) for i in range(5)]
    segs = [(103.0, 104.6, d[0]), (113.8, 115.2, d[1]), (123.6, 125.0, d[2]), (130.8, 132.4, d[3]), (143.9, 145.6, d[4])]
    cw = A3(segs, CON + '/clients', u0=go + 1.15, enter=False)
    st = [cw.seg_start(i, L_ + XF) for i in range(len(segs))]
    neha = DeviceShot(StillFace('f-neha', focus=(0.45, 0.40)), Footage('s-neha'), cw, t_whip=0.8, t_go=go, mode='push', who=TEAM)
    add('console', t0, t1, neha, [
        cw,
        head(64, 60, go + 1.3, L_ + 0.3, 'ONE CONSOLE', 'A brand, set up in minutes.', width=500, hsize=44),
        Steps(['Every client, one console', 'Its stock data, mapped', 'Its distributors', 'Its people, invited', 'Its own rules'],
              [go + 1.3, st[1], st[2], st[3], st[4]], 64, 330, u0=go + 1.3),
        TechTag('Cloud SQL', 'every client, every rule, on the record', go + 1.5, L_ + 0.3)])

    # the same console: every client, every batch, every agent, live
    t0, t1 = t1, T['p4'][0] - 0.3
    L_ = t1 - t0
    uc, ub, ua = u('p5', 'client') - 0.2 - (t0 - t0), a('p5', 'batch') - t0 - 0.2, a('p5', 'agent') - t0 - 0.2
    uc = a('p5', 'client') - t0 - 0.2
    mw = A3([(64.4, 66.4, ub - 0.3), (67.6, 69.6, ua - ub), (85.0, 87.4, L_ + XF - ua + 0.3)], CON + '/overview', u0=0.3)
    add('monitor', t0, t1, Room('f-neha', 18, 0.6), [
        mw,
        head(64, 60, 0.3, L_ + 0.3, 'LIVE · THE PLATFORM TEAM', 'Every client, every batch, every agent.', width=500, hsize=40),
        Ring(mw, (0, 130, 1928, 300), uc, ub - 0.35, card=card('Every client, at a glance', 'Recovered, in flight, waiting for a yes, runs today.', ('live', 'OVERVIEW'), 400), at=(64, 600)),
        Ring(mw, (0, 0, 1928, 1202), ub + 0.05, ua - 0.35, card=card('Every batch, at its stop', 'Filtered live, client by client.', ('live', 'BATCHES'), 400), at=(64, 600)),
        Ring(mw, (0, 0, 1928, 1202), ua + 0.05, L_ + 0.3, card=card('Every agent, every client', "Each agent's job, its model and its clients.", ('live', 'AGENTS'), 400), at=(64, 600)),
        TechTag('Cloud Run · Cloud SQL', 'read every 30 seconds', 0.6, L_ + 0.3)])

    # ================================================================ III · the agentic ecosystem
    t0, t1 = t1, T['j1'][0] - PRE['j1'] - 0.2
    L_ = t1 - t0
    def e(lid, word, k=0): return round(a(lid, word, k) - t0, 3)
    cues = {'ten': e('a1', '10'), 'adk': e('a1', 'agent'), 'run': e('a1', 'Cloud'), 'gemini': e('a1', 'Gemini'),
            'data': e('a2', 'data'), 'watcher': e('a2', 'watcher'), 'vision': e('a2', 'Vision'), 'valuer': e('a2', 'valuer'), 'router': e('a2', 'router'),
            'outreach': e('a3', 'Outreach'), 'lister': e('a3', 'lister'), 'negotiator': e('a3', 'negotiator'), 'paperwork': e('a3', 'Paperwork'), 'impact': e('a3', 'impact'),
            'pubsub': e('a5', 'PubSub'), 'bigquery': e('a5', 'BigQuery'), 'screens': e('a5', 'screen'), 'pass': e('a4', 'pass'), 'yes': e('a4', 'yes'),
            'end': round(L_ + XF + 0.2, 3)}
    (HERE / 'build').mkdir(exist_ok=True)
    (HERE / 'build' / 'eco-cues.json').write_text(json.dumps(cues, indent=1))
    heads = [Kinetic(64, 56, [[('A', e('p4', 'team') - 0.3), ('team', e('p4', 'team')), ('that', e('p4', 'that')), ('never', e('p4', 'never')), ('sleeps.', e('p4', 'sleeps'))]], size=56, u1=cues['ten'] - 0.1),
             Kinetic(64, 56, [[('Ten', cues['ten']), ('AI', e('a1', 'AI')), ('agents.', e('a1', 'agents'))]], size=56, u1=cues['data'] - 0.5),
             Kinetic(64, 56, [[('One', e('a2', 'one')), ('job', e('a2', 'job')), ('each.', e('a2', 'job') + 0.2)]], size=56, u1=cues['pubsub'] - 0.4),
             # the line builds as it is said, so no fragment hangs on screen for seconds
             Kinetic(64, 56, [[('Every', e('a5', 'Every')), ('event', e('a5', 'event')), ('flows.', e('a5', 'flows')), ('Every', e('a5', 'every', 1)),
                               ('screen,', e('a5', 'screen')), ('live.', e('a5', 'live'))]], size=56, u1=cues['pass'] - 0.3),
             Kinetic(64, 56, [[('Hand', e('a4', 'hand')), ('to', e('a4', 'to')), ('hand.', e('a4', 'hand', 1))], [('One', e('a4', 'one')), ('yes.', cues['yes'], AMBER)]], size=56, u1=L_ + 0.3)]
    tags = [TechTag('Google ADK', 'ten agents, one job each', cues['adk'] - 0.1, cues['run'] + 0.6),
            TechTag('Cloud Run', 'each agent its own service', cues['run'] - 0.1, cues['gemini'] + 0.2, y=H - 74 - 50),
            TechTag('Gemini 3.1 Pro · Gemini 3.8 Flash', 'on Vertex AI: Pro decides, Flash reads', cues['gemini'] - 0.1, cues['data'] + 1.2),
            TechTag('Pub/Sub', 'every event to every agent and screen', cues['pubsub'] - 0.1, cues['bigquery'] + 0.4),
            TechTag('BigQuery', 'the sales history', cues['bigquery'] - 0.1, cues['screens'] + 0.3, y=H - 74 - 50),
            TechTag('Server-sent events · FCM', 'every screen, live', cues['screens'] - 0.1, cues['pass'] + 0.3)]
    add('eco', t0, t1, EcoScene(ECO, L_, heads, tags) if (ECO / 'frames.json').exists() else Studio(), [Blackout(0.0, 0.6), LightLeak(-0.1, 1.2, side=-1, power=0.55)])

    # ================================================================ IV · the journey
    # dawn: the Watcher flags the batch that won't make it
    t0, t1 = t1, a('j2') - 0.3
    L_ = t1 - t0
    go = 0.9
    pw = P3('mango', [(89.9, 96.5)], WS + '/command', u0=go + 1.15, enter=False)
    add('detect', t0, t1, DeviceShot(None, Footage('s-priya'), pw, t_whip=0.0, t_go=go, mode='push', who=None), [
        pw,
        AgentHead(64, 52, go + 1.0, L_ + 0.3, [(go + 1.0, 'watcher', [('gates.check', '22 days: fails quick commerce', 'bad'),
                                                                   ('sellthrough.project', '28 a day: 420 of 2,000 in time', ''),
                                                                   ('pubsub.publish', 'batch.at_risk', 'ok')])],
                  'The Watcher flags the batch.', calls_at=None, call_gap=0.9),
        PhonePop((470, 640), 0.15, go + 0.05, push='detect', width=420, side=-1, rise=-220),
        SellThrough(64, 296, go + 1.4, L_ + 0.3, w=600),
        Ring(pw, (268, 420, 222, 68), go + 1.6, L_ + 0.3, card=card('₹22,657 at stake', '22 days left: too close for quick commerce.', ('live', 'WATCHER'), 400), at=(64, 600)),
        TechTag('BigQuery', '28 days of sell-through, every morning', a('j1', 'reads') - t0 - 0.1, L_ + 0.3),
        LightLeak(-0.1, 1.1, side=1, power=0.5)])

    # one photo of the carton; Vision checks it against the stock
    t0, t1 = t1, a('j3') - 0.3
    L_ = t1 - t0
    uv = a('j2', 'Vision') - t0 - 0.15
    ins = Inset(EVID / 'label-photo.webp', 760, 150, 760, uv + 0.1, L_ + 0.3, caption='The photo the distributor sent: batch, dates, MRP, FSSAI licence, barcode and QR')
    add('photo', t0, t1, Seq([(0.0, Live('v-photo-L', z=(1.0, 1.05), dur=4.0)), (uv, Room('s-lakshmi-label', 18, 0.62))], xf=0.4), [
        RoleTag('A distributor', 'one photo of the carton', 0.4, uv - 0.2, 'warehouse'),
        ins,
        VisionScan([ins], [uv + 0.5], [['Batch MF-2409-117 · matches the stock', 'Best before 18 Nov 2026', 'MRP ₹30 · FSSAI licence in view']], L_ + 0.3),
        AgentHead(64, 52, uv + 0.2, L_ + 0.3, [(uv + 0.2, 'vision', [('gemini.read_label', 'MF-2409-117 · 18 Nov 2026 · ₹30', 'ok'), ('dms.reconcile', 'matches the stock export', 'ok')])],
                  'Vision reads the label.', width=560, call_gap=1.0),
        TechTag('Gemini 3.8 Flash', 'reads the printed label', uv + 0.4, L_ + 0.3, x=64)])

    # the Valuer prices every exit, the Router splits the batch, from the history and the brand's rules
    t0, t1 = t1, T['t2'][0] - 0.12
    L_ = t1 - t0
    pw = P3('mango', [(176.2, 178.8), (201.0, 202.15)], WS + '/route/MF-2410-118')
    r_split, r_hist, r_rules = a('j3', 'router') - t0 - 0.15, a('j3', 'history') - t0 - 0.2, a('j3', 'rules') - t0 - 0.2
    add('route', t0, t1, Room('s-priya', 16, 0.5), [
        AgentHead(64, 52, 0.2, L_ + 0.3, [(0.2, 'valuer', [('bigquery.price_history', '28 days of sell-through', ''), ('cost_sheet.input_gst', '₹0.55 a pack', ''), ('writeoff.cost', '−₹14.34 a pack', 'bad')]),
                                          (r_split, 'router', [('allocate.greedy', '1,580 units → net ₹16,917', 'ok')])],
                  'Every exit priced.', call_gap=0.9),
        pw, Push(pw, 'plan', 0.3, 2.4),
        PlanFlow(70, 268, r_split, r_hist - 0.1, 'packs at risk', 1580,
                 [('52 kiranas', 'the scheme', 1372, (52, 211, 128)), ('Staff sale', 'at the godown', 150, (115, 201, 157)), ('Food bank', 'donated', 58, (247, 192, 74))], w=640, h=400),
        SplitWhy(70, 300, r_hist, r_rules, L_ + 9.0),
        TechTag('Gemini 3.1 Pro', 'the Router explains its split in plain words', r_split + 0.3, L_ + 0.3)])

    # "… and nothing to the bin. Approved."
    t0, t1 = t1, T['t2'][1] + 0.15
    L_ = t1 - t0
    add('t2', t0, t1, TalkShot('t2', T['t2'][0] - t0, 'Supply chain lead', 'at the brand · gives the one yes', 'badge-check', dur=L_ + XF, pt=(W * 0.5, H * 0.38)), [Grain(0.014)])

    # one tap: the plan placed, the agents set off
    t0, t1 = t1, a('j5') - 0.3
    L_ = t1 - t0
    pw = P3('mango', [(209.2, 212.0, L_ + XF - 0.2)], WS + '/route/MF-2410-118', u0=0.2)
    s3, d3 = pw.seg_start(0, L_ + XF), pw.seg_durs(L_ + XF)[0]
    u_placed = s3 + (211.3 - 209.2) / (212.0 - 209.2) * d3
    u_now = a('j4', 'Now') - t0
    add('tap', t0, t1, Room('s-priya', 16, 0.5), [
        pw,
        AgentHead(64, 52, 0.2, L_ + 0.3, [(0.2, 'you', []), (u_now, 'outreach', [('fcm.send', '58 kiranas · in Hindi', 'ok')]),
                                          (u_now + 0.5, 'lister', []), (u_now + 1.0, 'paperwork', [])],
                  'One tap.', call_gap=0.8),
        Ring(pw, (660, 574, 398, 52), 0.3, u_placed - 0.05, accent='a', card=card('Approve · release the agents', '₹16,917 net, against −₹22,657 in the bin.', ('result', 'ONE TAP'), 400, 'a'), at=(64, 790)),
        Ring(pw, (662, 150, 394, 590), u_placed + 0.05, L_ + 0.3, card=card('Plan placed', '₹22,194 better than the bin. The agents set off.', ('result', 'APPROVED'), 400), at=(64, 790))])

    # the offer, in the shop's own language
    t0, t1 = t1, a('j5', 'Every') - 0.3
    L_ = t1 - t0
    go = 1.7
    kw_ = H3('mango', [(245.4, 247.5)], WS + '/offer/MF-2410-118', KIR, u0=go + 1.15, enter=False)
    add('offer', t0, t1, DeviceShot(Footage('f-kirana'), Footage('s-kirana'), kw_, t_whip=1.15, t_go=go, mode='push', who=KIR), [
        kw_,
        PhonePop((600, 470), 0.25, 1.15 - 0.05, push='offer', width=420, side=-1, rise=-150),
        TechTag('Gemini 3.8 Flash', "writes each offer in the shop's own language", 0.6, L_ + 0.3)])

    # every order lands live, with its own GST invoice
    t0, t1 = t1, T['t3'][0] - 0.12
    L_ = t1 - t0
    pw = Window('mango', 'P', [(296.0, 437.0, L_ + XF - 0.3)], 770, 250, 1.0, WS + '/execution/MF-2410-118', who=LEAD, u0=0.2)
    ff = (437.0 - 296.0) / (L_ + XF - 0.3)
    cnt = [(0.25 + (L_ - 0.4) * k / 11, n) for k, n in enumerate([8, 9, 14, 19, 23, 29, 34, 41, 44, 45, 51, 52])]
    ords = curve_states('hyderabad', cnt, seed=52, first='h0')
    pk_u = [c[0] for c in cnt]; pk_v = [210, 236, 372, 508, 620, 776, 908, 1100, 1180, 1212, 1356, 1372]
    add('orders', t0, t1, Room('s-priya', 16, 0.5), [
        KiranaMap(64, 232, 600, 330, 'hyderabad', 'THE DISTRIBUTOR’S KIRANAS', 'The godown', 0.2, L_ + 0.3, None, ords,
                  [(lambda u_, a_=pk_u, b_=pk_v: f"{n0(round(float(np.interp(u_, a_, b_))))} of 1,372 packets", G),
                   (lambda u_, o=ords: f"{sum(1 for st_, tt in o.values() if u_ >= tt)} of 58 shops ordered", INK)], seed=31),
        InvoiceStack(64, 742, 0.6, L_ + 0.3),
        pw, Badge(f'Fast-forward {ff:.0f}×', 1640, 120, 0.3, L_ + 0.1),
        TechTag('Pub/Sub', 'each order an event, on the screen at once', 0.6, L_ + 0.3)])

    # the van round delivers
    t0, t1 = t1, T['t3'][1] + 0.3
    L_ = t1 - t0
    add('t3', t0, t1, TalkShot('t3', T['t3'][0] - t0, 'A kirana', 'the van round delivers', 'store', dur=L_ + XF, pt=(W * 0.55, H * 0.45)), [Grain(0.016)])

    # the staff sale, paid by UPI, the receipt read by Vision
    t0, t1 = t1, a('j7') - 0.3
    L_ = t1 - t0
    vis = a('j6', 'receipt') - t0 - 0.3
    lw = L3('mango', [(470.6, 470.6 + 6.0)], WS + '/home', DIST, u0=vis, speed=1.0)
    sc = a('j6', 'share') - t0
    upi = UpiScene(t_lift=1.0, t_pay=sc + 0.1, t_paid=a('j6', 'UPI') - t0 + 0.2, t_list=sc + 0.2, t_vision=vis, lwin=lw, L=L_)
    add('upi', t0, t1, upi, [
        head(64, 60, 0.2, vis, 'THE STAFF SALE', 'Paid by UPI, one scan each.', width=900, hsize=44, stop=6),
        lw, Ring(lw, (110, 468, 705, 160), vis + 0.7, L_ + 0.3, card=card('18 UPI payments · ₹1,200', 'Vision read the receipt: it matches 150 packs at ₹8.', ('agent', 'VISION'), 400), at=(120, 880)),
        AgentHead(64, 52, vis, L_ + 0.3, [(vis, 'vision', [('gemini.read_receipt', '18 UPI payments · ₹1,200 = 150 × ₹8', 'ok')])], None)])

    # what remains near its date goes to a food bank, with a receipt
    t0, t1 = t1, T['t4'][0] - 0.12
    L_ = t1 - t0
    u_rc = a('j7', 'food') - t0 - 0.15          # the receipt rises on "food bank", is ringed on "receipt", and is gone before the dissolve
    add('foodbank', t0, t1, Live('v-foodbank-L', z=(1.0, 1.05), dur=L_ + XF), [
        Shade('right', 0.5, 0.55),
        PhonePop((640, 520), 0.3, u_rc - 0.1, push='pickup', width=420, side=-1, rise=-200),
        PaperSprite('mango-receipt-p0.png', 1240, 120, 820, u_rc, L_ - 0.05, ang=-3, focus=(110, 620, 1420, 1010),
                    u_ring=a('j7', 'receipt') - t0 - 0.3)])

    # "Fifty-eight packs. That's fifty-eight meals tonight."
    t0, t1 = t1, T['t4'][1] + 0.3
    L_ = t1 - t0
    add('t4', t0, t1, TalkShot('t4', T['t4'][0] - t0, 'A food bank', 'collects the donation', 'heart-handshake', dur=L_ + XF, pt=(W * 0.6, H * 0.42)), [Grain(0.016)])
    S[-1].cut = True   # the volunteer at the van after the volunteer at the shelves: a cut, not a dissolve

    # the marketplace: the Lister lists it, the Negotiator closes, the floor price never shown
    t0, t1 = t1, T['t5'][0] - 0.12
    L_ = t1 - t0
    go = 2.2
    d0 = a('j8', 'negotiator') - 0.3 - t0 - (go + 1.15)
    aw = H3('sad', [(441.0, 441.0 + max(0.6, d0), max(0.6, d0)), (449.3, 451.1), (460.0, 462.6)], WS + '/market/ES-24117', BUYER, u0=go + 1.15, enter=False)
    q1, q2 = aw.seg_start(1, L_ + XF), aw.seg_start(2, L_ + XF)
    # the buyer at his stall: the keyframe his talking scene was made from, its cartons carrying the batch's own labels
    add('market', t0, t1, DeviceShot(StillFace('f-agrawal', focus=(0.5, 0.42), depth_k=0.3), Footage('s-agrawal'), aw, t_whip=1.4, t_go=go, mode='push', who=BUYER), [
        aw,
        AgentHead(64, 52, go + 1.2, L_ + 0.3, [(go + 1.2, 'lister', [('expiresoon.list', 'lot ES-24117 · 772 packs · ₹15.00', 'ok')]),
                                               (a('j8', 'negotiator') - t0, 'negotiator', [('listing.bid', 'a buyer · ₹13.00 for 772', ''),
                                                                                          ('listing.counter', '₹13.00 → ₹14.20, 24-hour dispatch', 'ok')])],
                  'Listed, bid, countered.', call_gap=1.0),
        PhonePop((520, 560), 0.3, 1.4 - 0.05, push='counter', width=420, side=-1, rise=-260),
        ExpireSoonCard(64, 236, go + 1.2, L_ + 0.3),
        PriceLadder(64, 440, go + 1.5, go + 1.75, q1 + 0.1, q2 + 0.15, L_ + 0.3),
        Ring(aw, (16, 400, 418, 152), go + 1.4, q1 - 0.05),
        Push(aw, 'counter', q1 + 0.1, q2 - 0.1),
        Ring(aw, (14, 364, 422, 220), q2 + 0.1, L_ + 0.3),
        TechTag('Gemini 3.1 Pro', 'bids, without ever seeing the floor price', a('j8', 'revealing') - t0 - 0.4, L_ + 0.3, x=64)])

    # "Fourteen-twenty a pack? Done. Send the truck."
    t0, t1 = t1, T['t5'][1] + 0.15
    L_ = t1 - t0
    add('t5', t0, t1, TalkShot('t5', T['t5'][0] - t0, 'A wholesale buyer', 'on the near-expiry marketplace', 'shopping-bag', dur=L_ + XF, pt=(W * 0.5, H * 0.4)), [Grain(0.016)])

    t0, t1 = t1, T['j9'][0] - 0.3
    L_ = t1 - t0
    add('truck', t0, t1, Live('dl-truck', z=(1.0, 1.04), dur=L_ + XF), [
        Chip('Collected · 772 packs at ₹14.20, a ₹1,644 token', 'good', 72, 930, 0.3, L_ + 0.3, 26)])

    # the hardest case: destroyed by an authorised agency, against two photos Vision checks
    t0, t1 = t1, a('j9', 'certificate') - 0.35
    L_ = t1 - t0
    shot_at = a('j9', 'Vision') - t0 - 1.2
    after = cv2.imread(str(EVID / 'destruction-after-540-packs.webp'))
    ins_b = Inset(EVID / 'destruction-before-540-packs.webp', 360, 250, 580, shot_at + 0.7, L_ + 0.3, caption='Before: 540 packs at the godown, the batch slip in view')
    ins_a = Inset(EVID / 'destruction-after-540-packs.webp', 1000, 250, 580, shot_at + 1.1, L_ + 0.3, caption='After: buried at the landfill, with the slate')
    add('proof', t0, t1, CamView('s-landfill-photo', screen_of('s-landfill-photo'), shot_at, photo=after, hold=shot_at + 0.6), [
        Flash(shot_at), ins_b, ins_a,
        VisionScan([ins_b, ins_a], [shot_at + 0.75, shot_at + 1.1],
                   [['Batch MF-2409-117 on the slip', 'About 540 packs in view'], ['Slate: MF-2409-117 · 540 · 03-10', 'Taken today, at the landfill']], L_ + 0.3),
        head(64, 60, 0.2, L_ + 0.3, 'THE HARDEST CASE', 'Destroyed, against evidence.', width=640, hsize=44, stop=7)])

    # the certificate signed on the spot: the officer, two witnesses, the distributor
    t0, t1 = t1, T['t6'][0] - 0.12
    L_ = t1 - t0
    go = 0.8
    rw = L3('sad', [(621.2, 624.4), (661.6, 662.9)], WS + '/destroy/MF-2409-117', DIST2, u0=go + 1.15, enter=False)
    add('sign', t0, t1, DeviceShot(None, Footage('s-landfill-sign'), rw, t_whip=0.0, t_go=go, mode='lift', who=None), [
        rw,
        head(64, 60, go + 0.9, L_ + 0.3, 'SIGNED ON THE SPOT', 'The certificate, signed in place.', width=640, hsize=44, stop=7),
        SignSlots(64, 236, go + 0.9, L_ + 0.3),
        Ring(rw, (146, 728, 634, 280), rw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, card=card('4 of 4 signatures', 'The officer, two witnesses and the distributor · OCE/DC/26-27/0219', ('proof', 'CERTIFICATE'), 400), at=(64, 620))])

    # "All four signatures. Now it's on the record."
    t0, t1 = t1, T['t6'][1] + 0.25
    L_ = t1 - t0
    cert = TabletCert('talk-t6', 'chips-destruction-p0.png')
    add('t6', t0, t1, TalkShot('t6', T['t6'][0] - t0, 'At the authorised landfill', 'the officer, two witnesses, the distributor', 'signature',
                                dur=L_ + XF, pt=(W * 0.47, H * 0.5), cert=cert, z=(1.0, 1.02)), [Grain(0.014)])

    # not a rupee credited until a second yes
    t0, t1 = t1, T['m1'][0] - PRE['m1'] - 0.2
    L_ = t1 - t0
    go = 0.6
    pw = P3('sad', [(697.0, 697.9), (721.1, 722.4), (751.3, 754.3)], WS + '/execution/MF-2409-117', u0=go + 1.15, enter=False)
    y1, y2 = pw.seg_start(1, L_ + XF), pw.seg_start(2, L_ + XF)
    add('second-yes', t0, t1, DeviceShot(None, Footage('s-priya-eve'), pw, t_whip=0.0, t_go=go, mode='push', who=None), [
        pw,
        AgentHead(64, 52, go + 1.0, L_ + 0.3, [(go + 1.0, 'vision', [('gemini.read_destruction', '4 of 4 checks · 540 packs', 'ok')]),
                                                (y1, 'you', []),
                                                (y2, 'paperwork', [('docs.certificate', 'OCE/DC/26-27/0219', 'ok'), ('docs.expiry_credit', 'CN/0118 · ₹13,284', 'ok')])],
                  'The second yes.', call_gap=0.6),
        ChecksPanel(64, 268, go + 1.2, y1 + 0.1, L_ + 0.3),
        Ring(pw, (655, 325, 405, 195), go + 1.3, y1 - 0.1),
        Ring(pw, (790, 676, 262, 50), y1 + 0.1, y1 + 1.05, accent='a'),
        Ring(pw, (650, 160, 400, 560), y2 + 0.1, L_ + 0.3)])

    # ================================================================ V · the papers, the money, the record, the impact
    t0, t1 = t1, T['m3'][0] - 0.35
    L_ = t1 - t0
    um2 = a('m2') - t0
    def m(word, k=0): return a('m2', word, k) - t0
    beats = [(m('tax') - 0.2, 'mango-kirana-h0-p0.png', (300, 800, 1470, 1040), 'TAX INVOICE · EVERY ORDER', 'A tax invoice for every order', 'Each kirana’s order, before GST, with CGST and SGST on their own rows.'),
             (m('E') - 0.2, 'chips-invoice-p0.png', (60, 150, 1490, 380), 'E-INVOICE', 'The e-invoice, with its IRN', 'Issued from the distributor’s books, its signed QR beside it.'),
             (m('credit') - 0.2, 'mango-support-p0.png', (70, 590, 1480, 905), 'CREDIT NOTE', 'Credit notes, line by line', 'Price support for each exit, against the brand’s own invoice.'),
             (m('GST') - 0.2, 'mango-itc-p0.png', (110, 640, 1440, 760), 'GST · s.17(5)(h)', 'The GST memo', 'Input tax credit kept on what sold, reversed on what was given away or destroyed.'),
             (m('Donation') - 0.2, 'mango-receipt-p0.png', (110, 620, 1420, 1010), 'DONATION RECEIPT', 'Donation receipts', 'From the food bank, with the meals it served.'),
             (m('certificates') - 0.1, 'chips-destruction-p0.png', (90, 1160, 1300, 1430), 'CERTIFICATE OF DESTRUCTION', 'Certificates', 'Signed at the facility by its officer, two witnesses and the distributor.')]
    wall = PaperWall(L_ - um2 + 0.5, [(b[0] - um2,) + b[1:] for b in beats], u_signed=m('signed') - um2 - 0.1, sign_rect=(90, 1160, 1300, 1430), u_filed=m('filed') - um2)
    add('papers', t0, t1, Seq([(0.0, Live('v-paper-L', z=(1.0, 1.05), dur=4.0)), (um2 - 0.3, wall)], xf=0.4), [
        RoleTag('A distributor', 'the papers write themselves', 0.4, um2 - 0.5, 'file-check'),
        TechTag('Cloud Storage', 'every PDF, kept for good', m('filed') - 0.2, L_ + 0.3),
        LightLeak(-0.1, 1.1, side=-1, power=0.5)])

    # the swing, worked out
    t0, t1 = t1, T['m4'][0] - 0.35
    L_ = t1 - t0
    ends = a('m3', 'ends') - t0
    res = SwingResult(0.15, L_ + 0.4, 'ONE BATCH · HOW THE SWING ADDS UP', 'mango', 'Mango drink 200 ml · 1,580 packs at risk',
                      16917.10, 22194.30,
                      [('If|destroyed', -22657.20, 'bin'), ('Kirana|scheme', 15778.00, 'gain'), ('Staff|sale', 1200.00, 'gain'),
                       ('Food|bank', -60.90, 'loss'), ('Not|paid', 5277.20, 'saved'), ('With|the plan', -462.90, 'plan')],
                      [('The distributor ends whole · ₹0', 'good'), ('339.7 kg kept out of landfill', 'good'), ('Every paper signed', 'good')],
                      [ends, ends + 0.5, ends + 1.0], ('mango', 814.0), bg=Room('f-lakshmi-L', 14, 0.62).img, t0=0.35, every=0.26)
    add('swing', t0, t1, res, [TechTag('Cloud SQL', 'every rupee worked out, on the record', 0.4, ends - 0.05)])

    # every step on the record, every request traced
    t0, t1 = t1, T['e1'][0] - 0.35
    L_ = t1 - t0
    rec = Seqs([HERE / 'build' / 'record2'], scale=0.5)
    rw_ = Window(None, None, [(1.9, 4.88, 1.6), (4.88, 11.28)], 96, 214, 0.78, WS + '/record/MF-2409-117', seq=rec)
    u_tr = a('m4', 'request') - t0 - 0.25
    add('record', t0, t1, Room('s-priya-eve', 18, 0.62), [
        head(64, 60, 0.2, L_ + 0.3, 'ON THE RECORD', 'Every step, every yes.', width=700, hsize=44),
        TiltIn(rw_, 0.1),
        Ring(rw_, (272, 120, 892, 700), 1.7, u_tr - 0.15, card=card('Every step · every yes, in a name', "Every agent's run and every person's step, append-only.", ('proof', 'AUDIT TRAIL'), 420), at=(1100, 420)),
        Ring(rw_, (290, 436, 500, 52), u_tr - 0.1, L_ + 0.3),
        TraceLink(rw_, (790, 462), u_tr + 0.1, L_ + 0.3, (1080, 300), elbow=1048),
        TracePanel(1100, 176, u_tr, u_tr + 0.4, L_ + 0.3, w=760),
        LogPanel(1100, 786, u_tr + 1.6, L_ + 0.3, w=760),
        TechTag('Cloud Trace', 'OpenTelemetry, from the tap to the model', u_tr + 0.3, L_ + 0.3)])

    # every batch posts to an impact ledger
    t0, t1 = t1, T['c1'][0] - PRE['c1'] - 0.2
    L_ = t1 - t0
    uk = a('e1', 'Kilos') - t0 - 0.3
    u_br = a('e1', 'ready') - t0 - 0.25
    iw = Window('mango', 'P', [(720.05, 721.45, 1.6), (721.95, 722.6), (724.8, 725.3), (728.6, 730.0), (734.0, 735.8, L_ + XF - u_br)],
                770, 250, 1.0, WS + '/report', who=LEAD, u0=uk)
    add('impact', t0, t1, Seq([(0.0, Live('f-priya', z=(1.0, 1.04), dur=4.0)), (uk, Room('s-priya-eve', 16, 0.55))], xf=0.4), [
        TiltIn(iw, uk + 0.1),
        AgentHead(64, 52, uk + 0.15, L_ + 0.3, [(uk + 0.15, 'impact', [('ledger.post', 'the batch · ₹16,917', 'ok'), ('brsr.rows', 'Principle 6', 'ok')])],
                  'The impact ledger.', call_gap=1.0),
        Ring(iw, (240, 248, 420, 74), uk + 0.9, a('e1', 'emissions') - t0 - 0.1,
             card=card('2.30 t kept out of landfill', 'This year so far: 2.07 t resold, 224.6 kg donated, 930 meals.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (265, 74, 783, 112), a('e1', 'emissions') - t0, u_br - 0.1,
             card=card('5.75 t CO₂e avoided', '97.1% of the food saved, every batch on the record.', ('result', 'IMPACT'), 420), at=(64, 330)),
        Ring(iw, (252, 237, 765, 186), u_br + 0.15, L_ + 0.3, accent='a',
             card=card('Ready for BRSR', "Each batch's own BRSR line, with its evidence.", ('proof', 'BRSR'), 420, 'a'), at=(64, 330)),
        KiloBars(64, 560, uk + 0.8, L_ + 0.3),
        RoleTag('The brand', 'its sustainability report', 0.4, uk - 0.2, 'leaf'),
        TechTag('BigQuery', 'the impact ledger, one row an exit', uk + 0.4, L_ + 0.3)])

    live = [x.name for x in S]
    for nm in ('console', 'monitor', 'detect', 'route', 'tap', 'orders', 'upi', 'market', 'sign', 'second-yes', 'record', 'impact'):
        if nm in live:
            S[live.index(nm)].items.append(LiveTag(fin=True, fout=True))

    # ================================================================ VI · what it plugs into, the line, where to try it
    t0, t1 = t1, T['c2'][0] - 0.3
    L_ = t1 - t0
    def c(word, k=0): return a('c1', word, k) - t0
    shots = [(device_still('mango', 'P', 92.0), 'laptop'), (device_still('mango', 'L', 142.0), 'tablet'), (device_still('mango', 'H', 247.0), 'phone')]
    add('integrations', t0, t1, IntegrationsScene(L_, [c('stock') - 0.1, c('Tally') - 0.1, c('UPI') - 0.1, c('marketplace') - 0.1, c('food') - 0.1],
                                                   c('on') - 0.1, shots), [LightLeak(-0.1, 1.2, side=1, power=0.55)])

    t0, t1 = t1, T['c3'][0] - 0.25
    L_ = t1 - t0
    def q(word, k=0): return a('c2', word, k) - t0
    tag = Tagline(96, 742, [('Smart-Clearance.', q('smart')), ('\n', 0), ('Ten agents.', q('10')), ('One yes.', q('1'), AMBER), ('\n', 0),
                             ('And', q('And')), ('nothing', q('nothing')), ('good', q('good')), ('goes', q('goes')), ('to', q('to')), ('waste.', q('waste'))], size=64)
    add('tagline', t0, t1, Live('v-evening', z=(1.0, 1.05), dur=L_ + XF), [Shade('bottom', 0.55, 0.78), Shade('left', 0.62, 0.45), tag])

    t0, t1 = t1, END
    L_ = t1 - t0
    add('end', t0, t1 - XF, EndCard10(L_, 0.0), [Blackout(L_ - 1.0, L_ - 0.05, into=True)])
    S[-1].t1 = END
    return S


if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s')
    print('END', END)
