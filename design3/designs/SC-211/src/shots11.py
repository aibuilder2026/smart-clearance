"""SC-211: the sales film v2's shots, laid on the voice (Maya1's narration, at()) and the talking scenes (LTX clips made
here, each speaker looking into the lens). Six acts, as SC-210's, with what the maintainer asked for:
  - the opening opens on a slit of light over the godown, a wide frame's bars drawn back, a scanner over the cartons,
    and nothing in the top left;
  - every brand's workspace, every team's part (teams11), installed as an app on every device (pwa11);
  - the agents as the app's graph, in depth, each opened with what it does and the rule it keeps, the brand's rules as
    guardrails, the two human gates clicked open, the trace (graph11), with the brand's head saying it in between;
  - the journey, with more of its people talking (a kirana owner, the platform team, the distributor weeks later);
  - the record, one audit trail (audit11) and the platform watching itself (ops11);
  - a pop-up of what each person sees whenever they look at a screen; a hand-over chosen for every cut (xin); the
    light's glow on the brightest shots (bloom); no "live on production" tag.
Nothing the film draws names a client, a person or a product; the app's screens are shown as they were recorded."""
import json
from parts11 import *
import parts11 as P11
# after the parts: parts.py's LEAD is the timeline's lead-in (a number), shots10's the supply chain lead (a role tag)
from shots7 import (Shot, Room, Steps, LabelRings, Flash, CamView, card, head, EVID, XF, _takes_L)
from shots10 import (Seq, Live, Chip, PaperSprite, CostStack10, P3, L3, H3, A3, WS, CON, LEAD, DIST, DIST2, KIR, BUYER, FOOD, TEAM)

B_ = HERE / 'build'
LINE = {l['id']: l for l in LINES}
PRE_ROLL, POST_ROLL = 0.5, 0.5          # the talking clips' own seconds before the first word and after the last
TALK_AT = {}                            # each talking clip's first frame, in film seconds (the mix lays its sound there)


def build():
    S = []
    def add(name, t0, t1, bg, items=(), xin='dissolve', xopt=None, bloom=0.0):
        s = Shot(name, t0, t1 + XF, bg, items)
        s.xin, s.xopt, s.bloom = xin, xopt, bloom
        S.append(s)
        return s
    ALT = {'10': ['ten'], 'ten': ['10'], '1': ['one'], 'one': ['1'], 'smart': ['smartclearance'], 'Kiranas': ['kiranas'],
           'E': ['e-invoices', 'e'], 'Gemini': ['gemini', 'jemini'], 'UPI': ['upi', 'u'], 'GST': ['gst', 'g']}
    def a(lid, word=None, k=0, edge='s'):
        for w_ in [word] + ALT.get(word, []) + ALT.get((word or '').lower(), []):
            try: return at(lid, w_, k, edge)
            except KeyError: pass
        # a word the take's read-back did not give (or a take not yet made): its place in the line's text
        text = LINE[lid]['text']; ws = text.split()
        hits = [i for i, w in enumerate(ws) if norm(w).startswith(norm(word))]
        if not hits: raise KeyError(f'{lid}: {word}')
        i = hits[min(k, len(hits) - 1)]
        return T[lid][0] + (T[lid][1] - T[lid][0]) * len(' '.join(ws[:i])) / max(1, len(text))
    def talk(lid, t0, role, sub, icon, pt=(W * 0.5, H * 0.42), xin='zoom', xopt=None, z=(1.0, 1.01)):   # LTX's own camera pushes in
        """a talking shot from its clip's first frame (PRE_ROLL before the first word) to POST_ROLL after the last"""
        pre = min(PRE_ROLL, LINE[lid].get('pre_avail', PRE_ROLL)) * 24 / 25
        post = min(POST_ROLL, LINE[lid].get('post_avail', POST_ROLL)) * 24 / 25
        c0 = T[lid][0] - pre
        TALK_AT[lid] = c0
        t1 = T[lid][1] + post
        L_ = t1 - t0
        add(lid, t0, t1, TalkShot11(lid, c0 - t0, role, sub, icon, dur=L_ + XF, pt=pt, z=z), [Grain(0.014)], xin=xin, xopt=xopt, bloom=0.12)
        return t1

    # ================================================================ I · the waste
    # the godown at dawn, opened by a slit of light; a scanner finds each carton's days to its date, the month running out
    t0, t1 = 0.0, T['o2'][0] - 0.35
    L_ = t1 - t0
    PT = (1772, 577)
    god = Dive(StampedGodown7([], TAGS, (1.55, 3.1), (1.7, L_ - 0.6), {}, L_ - 0.5), L_ - 0.45, L_ + XF, PT, z=3.4, mode='in')
    add('godown', t0, t1, Layered(god, [(fx.Dust(n=150, seed=211, strength=0.5), 0.9), (fx.Rays(1500, -160, strength=0.24, turn=0.018), 0.9)], vign=0.22), [
        StreakReveal(0.12, 1.45),
        Letterbox(L_ - 1.6, 1.2),
        Grain(0.018)], bloom=0.35)

    # the carton's own label, its best-before ringed, the days running out
    t0, t1 = t1, T['t1'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    lab = Still25D('o1b-carton-macro', z=(1.0, 1.28), pan=((0, 0), (0, 0)), dur=L_ + XF, focus=(0.49, 0.47), depth_k=0.35)
    boxes = json.loads((B_ / 'labels' / 'MF-2410-118.boxes.json').read_text())
    LM = np.float32(json.loads((B_ / 'labels' / 'o1b.json').read_text())['H'])
    u_bb = a('o2', 'Because') - t0 - 0.4
    add('label', t0, t1, Dive(Layered(lab, [(fx.Dust(n=120, seed=21, strength=0.45), 0.8), (fx.Rays(1700, -140, strength=0.22, turn=0.015), 0.9)], vign=0.3),
                              0.0, 0.85, (W * 0.49, H * 0.47), z=2.3, mode='out'), [
        LabelRings(lab, LM, boxes, [('bb', u_bb, L_ + 0.2, card('Best before 24 Oct 2026', 'Every carton carries its batch and its date.', ('proof', 'THE LABEL'), 400, 'a'))], card_at=(64, 560)),
        Countdown(64, 712, u_bb + 0.5, L_ + 0.3, 60, 22),
        Grain(0.016)], xin='zoom', xopt={'pt': PT}, bloom=0.2)

    # the distributor, in her own words, looking at us
    t1 = talk('t1', t1, 'A distributor', 'at the godown, 22 days before the date', 'warehouse', pt=(W * 0.62, H * 0.38), xin='whip', xopt={'dir': 1})

    # too close for quick commerce, too slow for the shelf: on hold (what the checker's tablet tells him)
    t0, t1 = t1, a('o3', 'So') - 0.25
    L_ = t1 - t0
    add('hold', t0, t1, Live('v-hold-L', dur=L_ + XF), [
        Shade('left', 0.6, 0.55),
        PhonePop((1090, 640), 0.35, L_ - 0.2, card=pop_card('Rejected at the dock', 'Too close to its date: quick commerce takes only 30 days or more.', ('bad', 'INBOUND CHECK'), 400, 'a'), side=1, rise=-200),
        Chip('Quick commerce · too close to its date', 'bad', 72, 760, a('o3', 'quick') - t0 - 0.1, L_ + 0.3),
        Chip('The shelf · too slow to sell in time', 'bad', 72, 836, a('o3', 'slow') - t0 - 0.1, L_ + 0.3)],
        xin='whip', xopt={'dir': -1}, bloom=0.15)

    # written off, sent to a landfill, the tax credit reversed
    t0, t1 = t1, T['o4'][0] - 0.3
    L_ = t1 - t0
    u_w, u_lf, u_tax = a('o3', 'written') - t0, a('o3', 'landfill') - t0, a('o3', 'tax') - t0
    add('landfill', t0, t1, Live('w2-aerial-slow', z=(1.0, 1.0), dur=L_ + XF), [
        Shade('left', 0.55, 0.62),
        StampSlam(1290, 470, u_w + 0.02, 'WRITTEN OFF', size=820, ang=-9),
        CostStack10(64, 64, [u_w + 0.1, u_lf, u_lf + 0.45, u_tax - 0.05], u_tax + 0.9, L_ + 0.3, w=560)], xin='zoom', xopt={'pt': (W * 0.55, H * 0.5)})

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
        Grain(0.018)], xin='flash', xopt={'power': 0.55})

    # what if every one of those packs could still find a home? dawn at the bay, and a phone lights up
    t0, t1 = t1, T['p1'][0] - 0.35
    L_ = t1 - t0
    add('dawn', t0, t1, Live('v-dawn', z=(1.0, 1.05), dur=L_ + XF), [
        Shade('bottom', 0.5, 0.35),
        PhonePopAt((1250, 655), a('o5', 'home') - t0 - 0.2, L_ - 0.1, (360, 60), push='plan', width=440),
        LightLeak(L_ - 0.9, 1.4, side=1, power=0.8)], xin='leak', xopt={'side': 1, 'power': 0.8}, bloom=0.3)

    # ================================================================ II · the product, the service, every brand's workspace
    t0, t1 = t1, T['p2'][0] - 0.3
    L_ = t1 - t0
    add('title', t0, t1, TitleScene(L_, 0.1, a('p1', 'smart') - t0), [], xin='flash', xopt={'power': 0.7}, bloom=0.45)

    t0, t1 = t1, T['p3'][0] - 0.35
    L_ = t1 - t0
    add('saas', t0, t1, SaasScene(L_, a('p2', 'software') - t0, a('p2', 'write') - t0, a('p2', 'recovery') - t0,
                                  a('p2', 'as') - t0, a('p2', 'service') - t0, a('p2', 'into') - t0), [], bloom=0.3)

    t0, t1 = t1, a('p3', 'From') - 0.3
    L_ = t1 - t0
    add('brands', t0, t1, BrandsScene(L_, [0.0, L_ / 3, 2 * L_ / 3]), [], xin='zoom', bloom=0.15)

    # the console: a new brand onboarded in minutes (the production console, as recorded)
    t0, t1 = t1, T['p6'][0] - 0.3
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
        TechTag('Cloud SQL', 'every client, every rule, on the record', go + 1.5, L_ + 0.3)], xin='whip', xopt={'dir': 1})

    # every team sees its own part (teams11, captured on the voice's cues)
    t0, t1 = t1, T['p7'][0] - 0.3
    L_ = t1 - t0
    cT = {'inside': a('p6', 'Inside') - t0, 'team': a('p6', 'team') - t0, 'part': a('p6', 'part') - t0, 'supply': a('p6', 'supply') - t0,
          'distributors': a('p6', 'distributors') - t0, 'kiranas': a('p6', 'kiranas') - t0, 'food': a('p6', 'food') - t0, 'end': L_ + XF + 0.2}
    (B_ / 'teams11-cues.json').write_text(json.dumps({k: round(v, 3) for k, v in cT.items()}, indent=1))
    add('teams', t0, t1, PageScene(B_ / 'teams11') if (B_ / 'teams11' / 'frames.json').exists() else Studio(), [], xin='zoom', bloom=0.2)

    # installed as an app, on every device (pwa11)
    t0, t1 = t1, T['p5'][0] - 0.3
    L_ = t1 - t0
    cP = {'progressive': a('p7', 'progressive') - t0, 'install': a('p7', 'install') - t0, 'browser': a('p7', 'browser') - t0,
          'laptop': a('p7', 'laptop') - t0, 'tablet': a('p7', 'tablet') - t0, 'phone': a('p7', 'phone') - t0,
          'alert': a('p7', 'alert') - t0, 'notification': a('p7', 'notification') - t0, 'end': L_ + XF + 0.2}
    (B_ / 'pwa11-cues.json').write_text(json.dumps({k: round(v, 3) for k, v in cP.items()}, indent=1))
    add('pwa', t0, t1, PageScene(B_ / 'pwa11') if (B_ / 'pwa11' / 'frames.json').exists() else Studio(), [], xin='whip', xopt={'dir': 1}, bloom=0.2)

    # the same console: every client, every batch, every agent, live
    t0, t1 = t1, T['tn'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    ub, ua = a('p5', 'batch') - t0 - 0.2, a('p5', 'agent') - t0 - 0.2
    uc = a('p5', 'client') - t0 - 0.2
    mw = A3([(64.4, 66.4, ub - 0.3), (67.6, 69.6, ua - ub), (85.0, 87.4, L_ + XF - ua + 0.3)], CON + '/overview', u0=0.3)
    add('monitor', t0, t1, Room('f-neha', 18, 0.6), [
        mw,
        head(64, 60, 0.3, L_ + 0.3, 'THE PLATFORM TEAM', 'Every client, every batch, every agent.', width=500, hsize=40),
        Ring(mw, (0, 130, 1928, 300), uc, ub - 0.35, card=card('Every client, at a glance', 'Recovered, in flight, waiting for a yes, runs today.', ('live', 'OVERVIEW'), 400), at=(64, 600)),
        Ring(mw, (0, 0, 1928, 1202), ub + 0.05, ua - 0.35, card=card('Every batch, at its stop', 'Filtered live, client by client.', ('live', 'BATCHES'), 400), at=(64, 600)),
        Ring(mw, (0, 0, 1928, 1202), ua + 0.05, L_ + 0.3, card=card('Every agent, every client', "Each agent's job, its model and its clients.", ('live', 'AGENTS'), 400), at=(64, 600)),
        TechTag('Cloud Run · Cloud SQL', 'read every 30 seconds', 0.6, L_ + 0.3)], xin='leak', xopt={'side': -1, 'power': 0.6})

    # the platform team, in her own words
    t1 = talk('tn', t1, 'The platform team', 'watching every client, live', 'users', pt=(W * 0.62, H * 0.38), xin='zoom', xopt={'pt': (W * 0.6, H * 0.5)})

    # ================================================================ III · the agents, as the app's graph
    def graph_cues(seg, t0_, keys):
        c = {k: round(v - t0_, 3) for k, v in keys.items()}
        c['seg'] = seg
        return c
    t0 = t1
    t1 = T['tb'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    cA = graph_cues('A', t0, {'line': T['p4'][0], 'team': a('p4', 'team'), 'ten': a('a1', 'Ten'), 'cloud': a('a1', 'cloud'), 'gemini': a('a1', 'Gemini'),
                              'job': a('a2', 'job'), 'data': a('a2', 'Data'), 'watcher': a('a2', 'Watcher'), 'vision': a('a2', 'Vision'),
                              'valuer': a('a2', 'Valuer'), 'router': a('a2', 'Router'), 'outreach': a('a3', 'Outreach'),
                              'lister': a('a3', 'Lister'), 'negotiator': a('a3', 'Negotiator'), 'paperwork': a('a3', 'Paperwork'),
                              'impact': a('a3', 'Impact'), 'rails': a('g1', 'rails'), 'rules': a('g1', 'rules'), 'dates': a('g1', 'dates'),
                              'floor': a('g1', 'floor'), 'credit': a('g1', 'credit')})
    cA['end'] = round(L_ + XF + 0.2, 3)
    (B_ / 'graph11-A-cues.json').write_text(json.dumps(cA, indent=1))
    (B_ / 'gif11.json').write_text(json.dumps({'t0': round(t0 + cA['watcher'] - 0.6, 2), 'dur': 6.0}))   # the GIF: the agents opening, one by one
    add('graphA', t0, t1, PageScene(B_ / 'graph11-A') if (B_ / 'graph11-A' / 'frames.json').exists() else Studio(), [], xin='dip', bloom=0.25)

    t1 = talk('tb', t1, "The brand's head", 'sets the rules once', 'shield-check', pt=(W * 0.5, H * 0.36), xin='zoom')

    t0 = t1
    t1 = T['j1'][0] - PRE['j1'] - 0.2
    L_ = t1 - t0
    cB = graph_cues('B', t0, {'person': a('g2', 'person'), 'approves': a('g2', 'approves'), 'destruction': a('g2', 'destruction'),
                              'second': a('g2', 'second'), 'trace': a('g3', 'trace'), 'run': a('g3', 'run'), 'yes': a('g3', 'yes'),
                              'end2end': a('g3', 'end'), 'auditor': a('g3', 'auditor')})
    cB['end'] = round(L_ + XF + 0.2, 3)
    (B_ / 'graph11-B-cues.json').write_text(json.dumps(cB, indent=1))
    add('graphB', t0, t1, PageScene(B_ / 'graph11-B') if (B_ / 'graph11-B' / 'frames.json').exists() else Studio(), [], xin='whip', xopt={'dir': -1}, bloom=0.25)

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
        LightLeak(-0.1, 1.1, side=1, power=0.5)], xin='dip')

    # one photo of the carton; Vision checks it against the stock (what the distributor's phone shows, as it happens)
    t0, t1 = t1, a('j3') - 0.3
    L_ = t1 - t0
    uv = a('j2', 'Vision') - t0 - 0.15
    ins = Inset(EVID / 'label-photo.webp', 760, 150, 760, uv + 0.1, L_ + 0.3, caption='The photo the distributor sent: batch, dates, MRP, FSSAI licence, barcode and QR')
    add('photo', t0, t1, Seq([(0.0, Live('v-photo-L', z=(1.0, 1.05), dur=4.0)), (uv, Room('s-lakshmi-label', 18, 0.62))], xf=0.4), [
        RoleTag('A distributor', 'one photo of the carton', 0.4, uv - 0.2, 'warehouse'),
        ScreenPop((1318, 452), 0.55, uv - 0.05, rec='mango', dev='L', t_src=118.0, rate=2.4, width=300, side=-1, rise=40, kicker='ON THE PHONE: SENT, THEN READ'),
        ins,
        VisionScan([ins], [uv + 0.5], [['Batch MF-2409-117 · matches the stock', 'Best before 18 Nov 2026', 'MRP ₹30 · FSSAI licence in view']], L_ + 0.3),
        AgentHead(64, 52, uv + 0.2, L_ + 0.3, [(uv + 0.2, 'vision', [('gemini.read_label', 'MF-2409-117 · 18 Nov 2026 · ₹30', 'ok'), ('dms.reconcile', 'matches the stock export', 'ok')])],
                  'Vision reads the label.', width=560, call_gap=1.0),
        TechTag('Gemini 3.8 Flash', 'reads the printed label', uv + 0.4, L_ + 0.3, x=64)], xin='whip', xopt={'dir': 1})

    # the Valuer prices every exit, the Router splits the batch, from the history and the brand's rules
    t0, t1 = t1, T['t2'][0] - PRE_ROLL - 0.12
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
    t1 = talk('t2', t1, 'Supply chain lead', 'at the brand · gives the one yes', 'badge-check', pt=(W * 0.55, H * 0.36), xin='zoom', xopt={'pt': (W * 0.6, H * 0.45)})

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
        Ring(pw, (662, 150, 394, 590), u_placed + 0.05, L_ + 0.3, card=card('Plan placed', '₹22,194 better than the bin. The agents set off.', ('result', 'APPROVED'), 400), at=(64, 790))],
        xin='whip', xopt={'dir': -1})
    TAP_CLICK = t0 + u_placed - 0.1

    # the offer, in the shop's own language
    t0, t1 = t1, a('j5', 'Every') - 0.3
    L_ = t1 - t0
    go = 1.7
    kw_ = H3('mango', [(245.4, 247.5)], WS + '/offer/MF-2410-118', KIR, u0=go + 1.15, enter=False)
    add('offer', t0, t1, DeviceShot(Footage('f-kirana'), Footage('s-kirana'), kw_, t_whip=1.15, t_go=go, mode='push', who=KIR), [
        kw_,
        PhonePop((600, 470), 0.25, 1.15 - 0.05, push='offer', width=420, side=-1, rise=-150),
        TechTag('Gemini 3.8 Flash', "writes each offer in the shop's own language", 0.6, L_ + 0.3)], xin='leak', xopt={'side': 1, 'power': 0.6})

    # every order lands live, with its own GST invoice
    t0, t1 = t1, T['tk'][0] - PRE_ROLL - 0.12
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
        TechTag('Pub/Sub', 'each order an event, on the screen at once', 0.6, L_ + 0.3)], xin='whip', xopt={'dir': 1})

    # the kirana owner: the offer came in her own language
    t1 = talk('tk', t1, 'A kirana owner', 'ordered in one tap', 'store', pt=(W * 0.52, H * 0.36), xin='zoom', xopt={'pt': (W * 0.75, H * 0.35)})
    # the van round delivers
    t1 = talk('t3', t1, 'A shopkeeper', 'the van round delivers', 'truck', pt=(W * 0.6, H * 0.4), xin='whip', xopt={'dir': 1})

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
        AgentHead(64, 52, vis, L_ + 0.3, [(vis, 'vision', [('gemini.read_receipt', '18 UPI payments · ₹1,200 = 150 × ₹8', 'ok')])], None)],
        xin='whip', xopt={'dir': -1})
    UPI_PAID = t0 + upi.t_paid if hasattr(upi, 't_paid') else t0 + sc + 0.3

    # what remains near its date goes to a food bank, with a receipt
    t0, t1 = t1, T['t4'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    u_rc = a('j7', 'food') - t0 - 0.15
    add('foodbank', t0, t1, Live('v-foodbank-L', z=(1.0, 1.05), dur=L_ + XF), [
        Shade('right', 0.5, 0.55),
        PhonePop((640, 520), 0.3, u_rc - 0.1, push='pickup', width=420, side=-1, rise=-200),
        PaperSprite('mango-receipt-p0.png', 1240, 120, 820, u_rc, L_ - 0.05, ang=-3, focus=(110, 620, 1420, 1010),
                    u_ring=a('j7', 'receipt') - t0 - 0.3)], xin='whip', xopt={'dir': -1})

    # "Fifty-eight packs. That's fifty-eight meals tonight." (the volunteer at the van after the volunteer at the shelves: a cut)
    t1 = talk('t4', t1, 'A food bank', 'collects the donation', 'heart-handshake', pt=(W * 0.6, H * 0.42), xin='cut', z=(1.0, 1.035))

    # the marketplace: the Lister lists it, the Negotiator closes, the floor price never shown
    t0, t1 = t1, T['t5'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    go = 2.2
    d0 = a('j8', 'negotiator') - 0.3 - t0 - (go + 1.15)
    aw = H3('sad', [(441.0, 441.0 + max(0.6, d0), max(0.6, d0)), (449.3, 451.1), (460.0, 462.6)], WS + '/market/ES-24117', BUYER, u0=go + 1.15, enter=False)
    q1, q2 = aw.seg_start(1, L_ + XF), aw.seg_start(2, L_ + XF)
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
        TechTag('Gemini 3.1 Pro', 'bids, without ever seeing the floor price', a('j8', 'revealing') - t0 - 0.4, L_ + 0.3, x=64)], xin='whip', xopt={'dir': 1})

    # "Fourteen-twenty a pack? Done. Send the truck."
    t1 = talk('t5', t1, 'A wholesale buyer', 'on the near-expiry marketplace', 'shopping-bag', pt=(W * 0.5, H * 0.4), xin='zoom', xopt={'pt': (W * 0.3, H * 0.4)})

    t0, t1 = t1, T['j9'][0] - 0.3
    L_ = t1 - t0
    add('truck', t0, t1, Live('dl-truck', z=(1.0, 1.04), dur=L_ + XF), [
        Chip('Collected · 772 packs at ₹14.20, a ₹1,644 token', 'good', 72, 930, 0.3, L_ + 0.3, 26)], xin='whip', xopt={'dir': 1}, bloom=0.15)

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
        head(64, 60, 0.2, L_ + 0.3, 'THE HARDEST CASE', 'Destroyed, against evidence.', width=640, hsize=44, stop=7)], xin='dip')

    # the certificate signed on the spot: the officer, two witnesses, the distributor
    t0, t1 = t1, T['t6'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    go = 0.8
    rw = L3('sad', [(621.2, 624.4), (661.6, 662.9)], WS + '/destroy/MF-2409-117', DIST2, u0=go + 1.15, enter=False)
    add('sign', t0, t1, DeviceShot(None, Footage('s-landfill-sign'), rw, t_whip=0.0, t_go=go, mode='lift', who=None), [
        rw,
        head(64, 60, go + 0.9, L_ + 0.3, 'SIGNED ON THE SPOT', 'The certificate, signed in place.', width=640, hsize=44, stop=7),
        SignSlots(64, 236, go + 0.9, L_ + 0.3),
        Ring(rw, (146, 728, 634, 280), rw.seg_start(1, L_ + XF) + 0.1, L_ + 0.3, card=card('4 of 4 signatures', 'The officer, two witnesses and the distributor · OCE/DC/26-27/0219', ('proof', 'CERTIFICATE'), 400), at=(64, 620))])

    # "All four signatures. Now it's on the record."
    t1 = talk('t6', t1, 'At the authorised landfill', 'the officer, two witnesses, the distributor', 'signature', pt=(W * 0.47, H * 0.42), xin='zoom', xopt={'pt': (W * 0.6, H * 0.6)})

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
        Ring(pw, (650, 160, 400, 560), y2 + 0.1, L_ + 0.3)], xin='whip', xopt={'dir': -1})
    YES2_CLICK = t0 + y1 + 0.15

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
        ScreenPop((1338, 560), 0.6, um2 - 0.45, rec='mango', dev='L', t_src=752.0, rate=0.5, width=520, side=1, rise=-250, kicker='ON HIS SCREEN: THE CREDIT NOTE', crop=(0, 60, 846, 476)),
        TechTag('Cloud Storage', 'every PDF, kept for good', m('filed') - 0.2, L_ + 0.3),
        LightLeak(-0.1, 1.1, side=-1, power=0.5)], xin='dip')

    # the swing, worked out
    t0, t1 = t1, T['tw'][0] - PRE_ROLL - 0.12
    L_ = t1 - t0
    ends = min(L_ - 1.4, a('m3', 'seventeen') - t0 + 0.6)
    res = SwingResult(0.15, L_ + 0.4, 'ONE BATCH · HOW THE SWING ADDS UP', 'mango', 'Mango drink 200 ml · 1,580 packs at risk',
                      16917.10, 22194.30,
                      [('If|destroyed', -22657.20, 'bin'), ('Kirana|scheme', 15778.00, 'gain'), ('Staff|sale', 1200.00, 'gain'),
                       ('Food|bank', -60.90, 'loss'), ('Not|paid', 5277.20, 'saved'), ('With|the plan', -462.90, 'plan')],
                      [('The distributor ends whole · ₹0', 'good'), ('339.7 kg kept out of landfill', 'good'), ('Every paper signed', 'good')],
                      [ends, ends + 0.5, ends + 1.0], ('mango', 814.0), bg=Room('f-lakshmi-L', 14, 0.62).img, t0=0.35, every=0.26)
    add('swing', t0, t1, res, [TechTag('Cloud SQL', 'every rupee worked out, on the record', 0.4, ends - 0.05)], xin='whip', xopt={'dir': 1})

    # the distributor of the opening, weeks later: she ended whole
    t1 = talk('tw', t1, 'The distributor', 'weeks later', 'warehouse', pt=(W * 0.3, H * 0.4), xin='zoom', xopt={'pt': (W * 0.3, H * 0.45)})

    # every step on the record, every request traced
    t0, t1 = t1, T['m5'][0] - 0.3
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
        TechTag('Cloud Trace', 'OpenTelemetry, from the tap to the model', u_tr + 0.3, L_ + 0.3)], xin='whip', xopt={'dir': 1})

    # which agent did what, who said yes, and when: one audit trail (audit11)
    t0, t1 = t1, T['m6'][0] - 0.3
    L_ = t1 - t0
    cU = {'which': a('m5', 'Which') - t0, 'did': a('m5', 'did') - t0, 'who': a('m5', 'who') - t0, 'yes': a('m5', 'yes') - t0,
          'when': a('m5', 'when') - t0, 'whole': a('m5', 'whole') - t0, 'trail': a('m5', 'trail') - t0, 'end': L_ + XF + 0.2}
    (B_ / 'audit11-cues.json').write_text(json.dumps({k: round(v, 3) for k, v in cU.items()}, indent=1))
    add('audit', t0, t1, PageScene(B_ / 'audit11') if (B_ / 'audit11' / 'frames.json').exists() else Studio(), [], xin='zoom', bloom=0.2)

    # the platform watches itself (ops11)
    t0, t1 = t1, T['e1'][0] - 0.35
    L_ = t1 - t0
    cO = {'platform': a('m6', 'platform') - t0, 'watches': a('m6', 'watches') - t0, 'service': a('m6', 'service') - t0,
          'measured': a('m6', 'measured') - t0, 'live': a('m6', 'live') - t0, 'failure': a('m6', 'failure') - t0,
          'alerted': a('m6', 'alerted') - t0, 'ask': a('m6', 'ask') - t0, 'end': L_ + XF + 0.2}
    (B_ / 'ops11-cues.json').write_text(json.dumps({k: round(v, 3) for k, v in cO.items()}, indent=1))
    add('ops', t0, t1, PageScene(B_ / 'ops11') if (B_ / 'ops11' / 'frames.json').exists() else Studio(), [], xin='whip', xopt={'dir': 1}, bloom=0.2)

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
        TechTag('BigQuery', 'the impact ledger, one row an exit', uk + 0.4, L_ + 0.3)], xin='zoom')

    # ================================================================ VI · what it plugs into, the line, where to try it
    t0, t1 = t1, T['c2'][0] - 0.3
    L_ = t1 - t0
    def c(word, k=0): return a('c1', word, k) - t0
    shots = [(device_still('mango', 'P', 92.0), 'laptop'), (device_still('mango', 'L', 142.0), 'tablet'), (device_still('mango', 'H', 247.0), 'phone')]
    add('integrations', t0, t1, IntegrationsScene(L_, [c('stock') - 0.1, c('Tally') - 0.1, c('UPI') - 0.1, c('marketplace') - 0.1, c('food') - 0.1],
                                                   c('on') - 0.1, shots), [LightLeak(-0.1, 1.2, side=1, power=0.55)], xin='dip', bloom=0.25)

    t0, t1 = t1, T['c3'][0] - 0.25
    L_ = t1 - t0
    def q(word, k=0): return a('c2', word, k) - t0
    tag = Tagline(96, 742, [('Smart-Clearance.', q('smart')), ('\n', 0), ('Ten agents.', q('10')), ('One yes.', q('1'), AMBER), ('\n', 0),
                             ('And', q('And')), ('nothing', q('nothing')), ('good', q('good')), ('goes', q('goes')), ('to', q('to')), ('waste.', q('waste'))], size=64)
    add('tagline', t0, t1, Live('v-evening', z=(1.0, 1.05), dur=L_ + XF), [Shade('bottom', 0.55, 0.78), Shade('left', 0.62, 0.45), tag,
        ScreenPop((620, 420), 0.4, q('nothing') - 0.2, rec='mango', dev='P', t_src=720.6, rate=0.3, width=520, side=1, rise=-170, kicker='ON THEIR SCREEN: THE IMPACT LEDGER')],
        xin='leak', xopt={'side': 1, 'power': 0.8}, bloom=0.3)

    t0, t1 = t1, END
    L_ = t1 - t0
    add('end', t0, t1 - XF, EndCard10(L_, 0.0), [Blackout(L_ - 1.0, L_ - 0.05, into=True)], xin='dip', bloom=0.35)
    S[-1].t1 = END
    global CLICKS
    CLICKS = [TAP_CLICK, YES2_CLICK]
    return S


CLICKS = []

if __name__ == '__main__':
    for s_ in build():
        print(f'{s_.name:14} {s_.t0:7.2f} {s_.t1:7.2f}  {s_.t1 - s_.t0 - XF:5.2f}s  {s_.xin}')
    print('END', END)
