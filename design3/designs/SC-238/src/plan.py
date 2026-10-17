"""SC-238: the film's edit decision list, from the narration's own measured times (tts/vo/maya1w-warm: durations.json,
asr.json) and the talking clips' measured lines (build/dlg.json, dlg.py).

Each scene is laid out in its own seconds: its narration placed with the pauses the director wants, its dialogue where
the clips say it, the words the picture lands on, and its shots: a person's clip (`clip`), a talking clip (`talk`), the
app's own screen from the production recordings (`win`: the device's screen cropped from the 2560 × 1440 stage, each
span played for the time the cut gives it), a still (`img`) or a scene of its own (`comp`). Every clip and window is
made at 60 fps to exactly its shot's length (media.py), so nothing plays at an odd rate.

Out: film/src/film.json (the Remotion film reads it), film/public/film.json, build/media.json (what media.py makes),
build/cues-agents.json (the 3D scene's cues) and build/timeline.txt.

   python3 plan.py"""
import json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
LIB = REPO / '.claude' / 'worktrees' / 'SC-205-demo-film' / 'design3' / 'designs'
VIDS = REPO / 'playwright-automation-videos'
VO = HERE / 'tts' / 'vo' / 'maya1w-warm'
DUR = json.loads((VO / 'durations.json').read_text())
ASR = json.loads((VO / 'asr.json').read_text())
LINES = {l['id']: l for l in json.loads((HERE / 'lines.json').read_text())['lines']}
for _id, _l in LINES.items():      # a line not voiced and picked yet: its length estimated from its words (0.42 s a word)
    if _id not in DUR:
        _ws = _l['text'].split(); DUR[_id] = round(0.42 * len(_ws) + 0.3, 3)
        ASR[_id] = {'text': _l['text'], 'words': [{'w': x, 's': round(0.15 + 0.42 * i, 3), 'e': round(0.15 + 0.42 * i + 0.36, 3)} for i, x in enumerate(_ws)]}
        print(f'(estimated {_id}: {DUR[_id]} s)')
DLGS = {d['id']: d for d in json.loads((HERE / 'lines.json').read_text())['dialogue']}
MEAS = json.loads((HERE / 'build' / 'dlg.json').read_text()) if (HERE / 'build' / 'dlg.json').exists() else {}
# a line's place in its clip until the clip exists and dlg.py has measured it
EST = {'d01': ('d-dawn-call', 0.52, 2.04), 'd03': ('d-dawn-call', 9.30, 9.98), 'd02': ('l-dawn-call', 0.16, 1.02), 'd04': ('l-dawn-call', 4.94, 5.74),
       'd05': ('b-approve', 0.6, 1.9), 'd06': ('l-approve', 0.6, 2.4), 'd07': ('k-order-b', 0.6, 2.4), 'd08': ('v-dock', 0.6, 2.6),
       'd09': ('s-shop-b', 0.6, 2.1), 'd10': ('w-buyer', 0.6, 3.0), 'd11': ('o-landfill', 0.6, 2.6), 'd12': ('d-eve-call', 0.6, 2.6),
       'd13': ('l-eve-call-b', 0.6, 2.2)}

# the production recordings (2560 × 1440, 25 fps) and the device screens on their stage (cut 17's kit.py: measured by
# brightness, inset 2 px): P Priya's tablet in landscape, L the distributor's in portrait, H the phone, A the laptop
REC = {'mango': VIDS / 'munchly-mango-e2e-prod-2026-10-13_09-09-12.mp4', 'sad': VIDS / 'munchly-chips-sad-e2e-prod-2026-10-13_11-07-40.mp4',
       'admin': VIDS / 'admin-console-e2e-prod-2026-10-16_10-14-51.mp4'}
DEV = {'P': (40, 182, 1078, 746), 'L': (1176, 182, 846, 1218), 'H': (2076, 180, 448, 974), 'A': (40, 182, 1928, 1202)}
# the people at work, and the places (earlier films' clips; 1920 × 1088 unless noted)
CLIPS = {
    'priya-desk': LIB / 'SC-205/src/clips/m1-priya-desk.mp4',          # 1280 × 704: the lead at her desk, phone and laptop
    'priya-approve': LIB / 'SC-205/src/clips/m3-priya-approve.mp4',    # 1280 × 704: the lead with her tablet
    'priya-eve': LIB / 'SC-205/src/clips/c5-priya-evening.mp4',        # 1024 × 576: the lead at dusk
    'lakshmi-photo': LIB / 'SC-205/src/clips/m2-lakshmi-photo.mp4',    # 1024 × 576
    'kirana-phone': LIB / 'SC-205/src/clips/m4-kirana-phone.mp4',      # 1024 × 576: the kirana owner reads the offer
    'staff-upi': LIB / 'SC-205/src/clips/m5-staff-upi.mp4',            # 1024 × 576: the staff pay by UPI
    'meera-van': LIB / 'SC-205/src/clips/m6-meera-van.mp4',            # 1024 × 576: the food bank's van loaded
    'kirana-delivery': LIB / 'SC-205/src/clips/m7-kirana-delivery.mp4',  # 1024 × 576
    'factory': LIB / 'SC-205/src/clips/n1-factory-line.mp4',
    'neha-console': LIB / 'SC-205/src/clips/n1-neha-console.mp4',      # 1024 × 576
    'mango-godown': LIB / 'SC-205/src/clips/n2-mango-godown.mp4',
    'chips-dusk': LIB / 'SC-205/src/clips/n3-chips-godown-dusk.mp4',   # 1024 × 576
    'agrawal-tablet': LIB / 'SC-205/src/clips/c2-agrawal-tablet.mp4',  # 1024 × 576
    'landfill-evidence': LIB / 'SC-205/src/clips/c3-landfill-evidence.mp4',  # 1024 × 576
    'landfill-sign': LIB / 'SC-205/src/clips/c4-landfill-sign.mp4',    # 1024 × 576
    'hold': LIB / 'SC-205/src/clips/i2-hold.mp4',
    'landfill': LIB / 'SC-205/src/clips/i3-landfill.mp4',
    'aisle': LIB / 'SC-207/src/clips/o0-godown-aisle-labelled.mp4',
    'mango-pack': HERE / 'clips/d-mango-pack3.mp4',                      # this film's: the distributor reads a pack's date (pass 9: an edit of her own dawn keyframe, no glasses)
    'aisle-plain': LIB / 'SC-206/src/clips/o0-godown-aisle.mp4',
    'van-kirana': LIB / 'SC-208/src/clips/dl-kirana.mp4',              # the van round at a kirana
    'truck': LIB / 'SC-208/src/clips/dl-truck.mp4',                    # the buyer's truck loaded
    'trail': LIB / 'SC-209/src/clips/w2-aerial.mp4',                   # the batch's cartons in a trail, a drone descending
    'landfill-heap': LIB / 'SC-209/src/clips/w1-landfill-b.mp4',
    'office': LIB / 'SC-210/src/clips/v-office.mp4',                   # Veo 1080p
    'evening': LIB / 'SC-210/src/clips/v-evening.mp4',
    'foodbank': LIB / 'SC-210/src/clips/v-foodbank.mp4',
    'neha-laptop': LIB / 'SC-206/src/clips/s-neha.mp4',
    'rakesh-tablet': LIB / 'SC-206/src/clips/s-rakesh.mp4',
    # this film's own (clips/, LTX 2.5 at 720p, 24 fps)
    'raise-phone': HERE / 'clips/d-raise-phone.mp4', 'raise-tablet': HERE / 'clips/r-raise-tablet.mp4',
    'sunrise': HERE / 'clips/godown-sunrise.mp4', 'darkstore': HERE / 'clips/q-darkstore.mp4',
    'a1-godown': HERE / 'clips/a1-godown.mp4', 'a2-town': HERE / 'clips/a2-town.mp4', 'a3-lane': HERE / 'clips/a3-lane.mp4',
    # after the first full-film critic: the lead at her desk reading, then tapping, her tablet's back to the camera (one
    # woman throughout); the Nagpur distributor raising his tablet at the landfill to photograph the evidence
    'a-desk': HERE / 'clips/a-desk.mp4', 'r-raise': HERE / 'clips/r-raise-tablet.mp4', 'k-tail': HERE / 'clips/k-order-b.mp4',
    # after the verification critic: the distributor at her godown at dusk, her portal on her tablet (the portal's shot was
    # the verify shot's clip again); the mango batch itself, closer (the rule's last shot was the godown's opening footage)
    'd-portal': HERE / 'clips/d-portal.mp4', 'd-batch': HERE / 'clips/d-batch.mp4',
}
# the people with their own devices, over the shoulder (SC-206's clips, 1920 × 1088, each blank screen tracked frame by
# frame by SC-207's track3.py): screens.py sets the app's real screen into the glass, under any finger
OTS = {k: (LIB / f'SC-206/src/clips/s-{k}.mp4', LIB / f'SC-207/src/build/track/s-{k}.json') for k in
       ['neha', 'priya', 'priya-eve', 'lakshmi-label', 'upi', 'kirana', 'meera', 'agrawal', 'landfill-photo', 'landfill-sign', 'rakesh']}
OTS_PHONE = LIB / 'SC-207/src/build/track/s-upi-phone.json'   # the staff member's phone in front of the distributor's tablet
NUM = {'10': 'ten', '9': 'nine', '22': 'twentytwo', '30': 'thirty', '45': 'fortyfive', '60': 'sixty', '90': 'ninety', '1': 'one', '17': 'seventeen'}
norm = lambda w: re.sub(r'[^a-z0-9]', '', str(w).lower())
MEDIA = {}


def win(name, rec, dev, segs):
    """a device's screen from a production recording: each span (start, end) in the recording's seconds, played over the
    time the cut gives it (a third value; its own length when left out). Returns the span starts in the window's time."""
    segs = [(a, b, round(d if d is not None else (b - a), 3)) for a, b, *rest in segs for d in [rest[0] if rest else None]]
    MEDIA[name] = {'kind': 'win', 'rec': rec, 'src': str(REC[rec]), 'dev': dev, 'rect': DEV[dev], 'segs': segs, 'dur': round(sum(s[2] for s in segs), 3)}
    starts, u = [], 0.0
    for s in segs: starts.append(round(u, 3)); u += s[2]
    return starts


def R(t0, t1, r, tone=None):
    """a ring on a window, in the recording's own pixels (Ring in device.tsx)"""
    d = {'t0': round(t0, 3), 't1': round(t1, 3), 'r': r}
    if tone: d['tone'] = tone
    return d


def C(t0, t1, at, k, h, s_=None, icon=None, tone=None, side='l', w=None):
    """a card beside a window, its leader on the ringed part (Card in device.tsx)"""
    d = {'t0': round(t0, 3), 't1': round(t1, 3), 'at': at, 'k': k, 'h': h, 'side': side}
    for kk, v in (('s', s_), ('icon', icon), ('tone', tone), ('w', w)):
        if v is not None: d[kk] = v
    return d


def Hd(t0, t1, name, stop, tier, icon, calls=(), done=None):
    """an agent at work: its orb, name, stop and model; its calls typed in as they run (AgentHead in ui.tsx)"""
    d = {'t0': round(t0, 3), 't1': round(t1, 3), 'name': name, 'stop': stop, 'tier': tier, 'icon': icon, 'calls': [[round(t, 3), l] for t, l in calls]}
    if done is not None: d['done'] = round(done, 3)
    return d


def winat(name, src_t, starts):
    """a window's own second for a moment of its recording (media.py: a span under 0.85× plays at 0.9× and holds)"""
    for (a, b, d), st in zip(MEDIA[name]['segs'], starts):
        if a - 1e-6 <= src_t <= b + 1e-6:
            sp = (b - a) / d
            return st + (src_t - a) / (0.9 if sp < 0.85 else sp)
    raise KeyError(f'{name}: {src_t} in no span')


def clip(name, key, a, b, dur=None):
    """a clip's span (a, b in its own seconds), played over `dur` seconds (its own length when left out), 60 fps"""
    d = round(dur if dur is not None else b - a, 3)
    MEDIA[name] = {'kind': 'clip', 'src': str(CLIPS[key]), 'in': a, 'out': b, 'dur': d}
    return d


def ots(name, who, win_media, d, lift, a=0.25, still=None, still2=None, dehalo=None):
    """a person over the shoulder with the app's screen in their device (screens.py): `win_media`'s frames from the
    shot's start (or a still), lifting out at `lift` (shot seconds); the clip at its own pace to the lift, then half
    pace, back and forth, behind the window"""
    src, trk = OTS[who]
    MEDIA[name] = {'kind': 'ots', 'src': str(src), 'track': str(trk), 'win': win_media, 'still': str(still) if still else None, 'in': a, 'dur': round(d, 3), 'lift': round(lift, 3)}
    if still2: MEDIA[name].update({'still2': str(still2), 'track2': str(OTS_PHONE)})
    # (the clips whose relabelled cartons show in the background get their glow taken out: screens.py's dehalo)
    if dehalo if dehalo is not None else who in ('lakshmi-label', 'agrawal', 'meera', 'upi', 'rakesh'): MEDIA[name]['dehalo'] = True
    return d


def talk(name, cl, a, b):
    MEDIA[name] = {'kind': 'talk', 'src': str(HERE / 'clips' / f'{cl}.mp4'), 'in': round(a, 3), 'out': round(b, 3), 'dur': round(b - a, 3)}


def dlg(id_):
    """a line's place in its clip: as dlg.py measured it in the clip lines.json names (a retake replaces the measure of
    the take before), else the estimate"""
    want = DLGS[id_]['clip']
    if id_ in MEAS and MEAS[id_]['clip'] == want and (HERE / 'clips' / f'{want}.mp4').exists(): m = MEAS[id_]; return m['clip'], m['s'], m['e']
    if EST[id_][0] != want and id_ in MEAS: m = MEAS[id_]; return m['clip'], m['s'], m['e']   # the retake not made yet: the take before
    return EST[id_]


class Scene:
    def __init__(self, id_, comp):
        self.id, self.comp = id_, comp
        self.vo, self.dl, self.marks, self.shots, self.end = [], [], {}, [], 0.0
        self.words = {}

    def say(self, lid, at, part=None):
        """a narration line at scene second `at` (or a part of its take, (from, to) in the take's seconds); returns
        where it ends"""
        a, b = (0.0, DUR[lid]) if part is None else (part[0], part[1] if part[1] is not None else DUR[lid])
        key = lid if part is None else f'{lid}@{a:g}'
        self.vo.append({'id': lid, 'key': key, 't': round(at, 3), 'from': round(a, 3), 'dur': round(b - a, 3)})
        ws = []
        for w in ASR[lid]['words']:
            if a - 0.05 <= w['s'] < b:
                t = round(at + w['s'] - a, 3)
                ws.append({'w': w['w'], 't': t, 'e': round(at + w['e'] - a, 3)})
                if norm(w['w']) in NUM: ws.append({'w': NUM[norm(w['w'])], 't': t, 'e': round(at + w['e'] - a, 3)})
        self.words[key] = ws
        return at + (b - a)

    def w(self, key, word, nth=0, at='t'):
        """when a word of a placed line is said (scene seconds)"""
        hits = [x for x in self.words[key] if norm(x['w']) == norm(word)] or [x for x in self.words[key] if norm(x['w']).startswith(norm(word))]
        if len(hits) <= nth: raise KeyError(f'{self.id}: no "{word}" #{nth} in {key}: {[x["w"] for x in self.words[key]]}')
        return hits[nth][at]

    def talk(self, did, at, lead=0.5, tail=0.55, name=None, cut=None):
        """a dialogue line, its clip cut so the line starts at scene second `at`; returns where the line ends. With `cut`
        (a second of the clip) the picture ends there and the rest of the line plays on under the next shot (an L-cut)"""
        cl, s, e = dlg(did)
        name = name or f'{self.id}-{did}'
        a, b = max(0.0, s - lead), e + tail
        bp = min(b, cut) if cut else b
        talk(name, cl, a, bp)
        if bp < b: MEDIA[name]['atail'] = round(b - bp, 3)
        self.dl.append({'id': did, 'clip': cl, 't': round(at, 3), 's': s, 'e': e})
        self.shots.append({'kind': 'talk', 'media': name, 't0': round(at - (s - a), 3), 't1': round(at - (s - a) + (bp - a), 3), 'line': did})
        return at + (e - s)

    def shot(self, kind, t0, t1, **props):
        self.shots.append({'kind': kind, 't0': round(t0, 3), 't1': round(t1, 3), **props})

    def mark(self, name, t):
        self.marks[name] = round(t, 3); return t

    def fill_tail(self, most=0.9):
        """a scene's last shot runs to its end: a short tail of nothing would be black between two scenes"""
        b = [x for x in self.shots if x['kind'] in ('clip', 'ots', 'talk')]
        if not b: return
        last = max(b, key=lambda x: x['t1']); g = round(self.end - last['t1'], 3)
        if not (0 < g < most): return
        m = MEDIA[last['media']]
        if last['kind'] == 'talk': m['out'] = round(m['out'] + g, 3)
        m['dur'] = round(m['dur'] + g, 3); last['t1'] = round(self.end, 3)
        for w in self.shots:
            if w['kind'] == 'win' and abs(w['t1'] + g - self.end) < 0.02 and w.get('media') and MEDIA[w['media']]['kind'] == 'win':
                wm = MEDIA[w['media']]; a_, b_, d_ = wm['segs'][-1]; wm['segs'][-1] = (a_, b_, round(d_ + g, 3)); wm['dur'] = round(wm['dur'] + g, 3); w['t1'] = round(self.end, 3)

    def close_gaps(self, most=0.6):
        """no black between two shots: a gap under `most` seconds in the picture (a talking clip cut to its line, a
        shot ended a beat early) is closed by starting a talking clip that much earlier in its own take, else by holding
        the shot before (its window too) until the next"""
        base = lambda: sorted([x for x in self.shots if x['kind'] in ('clip', 'ots', 'talk', 'seq')], key=lambda x: x['t0'])
        for _ in range(20):
            b = base(); fixed = False
            for i in range(len(b) - 1):
                end = max(x['t1'] for x in b[:i + 1]); nxt = b[i + 1]
                g = round(nxt['t0'] - end, 3)
                if not (0 < g < most): continue
                prev = max(b[:i + 1], key=lambda x: x['t1'])
                m = MEDIA.get(nxt.get('media', ''))
                if nxt['kind'] == 'talk' and m and m['in'] >= g:
                    m['in'] = round(m['in'] - g, 3); m['dur'] = round(m['dur'] + g, 3); nxt['t0'] = round(end, 3)
                else:
                    pm = MEDIA[prev['media']]
                    if prev['kind'] == 'talk': pm['out'] = round(pm['out'] + g, 3)
                    pm['dur'] = round(pm['dur'] + g, 3)
                    for w in self.shots:
                        if w['kind'] == 'win' and abs(w['t1'] - prev['t1']) < 0.02 and abs(w['t0'] - prev['t0']) < 0.02:
                            wm = MEDIA[w['media']]; a_, b_, d_ = wm['segs'][-1]; wm['segs'][-1] = (a_, b_, round(d_ + g, 3)); wm['dur'] = round(wm['dur'] + g, 3)
                            w['t1'] = round(w['t1'] + g, 3)
                    prev['t1'] = round(prev['t1'] + g, 3)
                fixed = True; break
            if not fixed: break


def have(key):
    """a clip this film made that exists (a job not run yet leaves nothing, or an empty placeholder)"""
    p = CLIPS[key]; return p.exists() and p.stat().st_size > 0


# the lead's tablet in her desk clip (film px): where her screen lifts out from, as she reads (0 s) and as she taps (4 s)
A_TABLET, A_TABLET_TAP = [390, 600, 490, 390], [215, 700, 640, 380]
D_PORTAL = [600, 790, 560, 290]   # the distributor's tablet at dusk (d-portal, at 3.3 s), film px


def build():
    S = []

    # ---- 1. Cold open: the dawn call, the label, the write-off --------------------------------------------------
    s = Scene('cold', 'ColdOpen')
    s.mark('ring', 0.12)
    t = s.talk('d01', 1.05, lead=0.52)                # the distributor at dawn: "Twenty-two days left on the mango."
    t = s.talk('d02', t + 0.45, lead=0.16) + 0.25     # the lead at home: "And quick commerce?"
    t = s.talk('d03', t + 0.35, lead=0.4)             # the distributor: "They won't take it."
    t = s.talk('d04', t + 1.0, lead=0.45, tail=0.2)   # the lead, looking down, a beat later: "Write it off, then."
    s.mark('label', t + 0.2)                          # her "then" cuts to the carton's label
    s.mark('ringbb', t + 0.9); s.mark('stamp', t + 2.2)
    s.end = s.marks['stamp'] + 1.5; S.append(s)

    # ---- 2. The godown: every morning, good food runs out of time ------------------------------------------------
    s = Scene('godown', 'Godown')
    d = clip('godown-aisle', 'aisle', 0.0, 5.95, 8.0)
    s.shot('clip', 0, d, media='godown-aisle')
    t = s.say('n01', 0.9)
    s.end = d; S.append(s)

    # ---- 3. The rule: not spoiled, just short on days; FSSAI's floor; the apps' gates; below every line --------------
    s = Scene('rule', 'Rule')
    t = s.say('n02', 0.5)
    s.mark('fssai', t + 0.45); t = s.say('n03', t + 1.0)
    s.mark('gates', t + 0.4); t = s.say('n04', t + 1.1)
    s.mark('batch', t + 0.5); t = s.say('n05', t + 1.2)
    s.end = t + 2.6
    d1 = clip('rule-mango', 'mango-pack', 0.2, 4.4, s.marks['fssai'] + 0.6)     # the distributor reads the mango's date (from 4.8 s the take looks into the lens)
    s.shot('clip', 0, d1, media='rule-mango')
    d2 = s.marks['batch'] - d1
    clip('rule-darkstore', 'darkstore', 0.0, 9.95, d2)                               # the dark store turning a carton away
    s.shot('clip', d1, d1 + d2, media='rule-darkstore', grade='green')
    if have('d-batch'): clip('rule-batch', 'd-batch', 0.2, 2.4, s.end - d1 - d2)    # back to the batch itself: a pack lifted from its open carton (after 2.4 s the take reshapes the pack)
    else: clip('rule-batch', 'aisle', 0.0, 5.95, s.end - d1 - d2)
    s.shot('clip', d1 + d2, s.end, media='rule-batch', grade='green')
    S.append(s)

    # ---- 4. The bin: if it is written off; week after week, brand after brand --------------------------------------
    s = Scene('bin', 'Bin')
    t = s.say('n06', 0.5)
    s.mark('stock', s.w('n06', 'stock')); s.mark('credit', s.w('n06', 'credit')); s.mark('destroy', s.w('n06', 'destroy'))
    s.mark('total', s.w('n06', 'twentytwo'))
    st = t + 2.6
    clip('bin-trail', 'trail', 0.0, 6.4, st)
    s.shot('clip', 0, st, media='bin-trail')
    t = s.say('n07', st + 0.05)
    for i, (k, key) in enumerate([('bin-factory', 'factory'), ('bin-hold', 'hold'), ('bin-heap', 'landfill-heap')]):
        a = st + i * 0.95
        clip(k, key, 1.0, 2.2, 0.95)
        s.shot('clip', a, a + 0.95, media=k); s.mark(f'st{i + 1}', a + 0.28)
    s.end = st + 3 * 0.95 + 0.14       # eight frames of silence, then the sunrise
    S.append(s)

    # ---- 5. The turn: sunrise in the godown ---------------------------------------------------------------------
    s = Scene('turn', 'Turn')
    t = s.say('n08', 1.2)
    s.end = t + 2.2
    clip('turn-sunrise', 'sunrise', 0.0, 7.95, s.end)
    s.shot('clip', 0, s.end, media='turn-sunrise')
    S.append(s)

    # ---- 6. The platform: the mark; each brand's workspace; the console; every team's part; installed --------------
    s = Scene('platform', 'Platform')
    t = s.say('n09', 1.8)
    s.mark('console', t + 0.6)
    t = s.say('n10', t + 1.5)
    # the console on the 16 Oct admin run (cut 16's spans, no stage marks): the clients, the brand opened, its first
    # stock export mapped, its distributors, its people, its rules (SKU gates)
    b = [s.w('n10', 'stock'), s.w('n10', 'distributors'), s.w('n10', 'people'), s.w('n10', 'rules')]
    c0 = s.marks['console']
    # (the 16 Oct run's clean stretches only: no stage note, ring or chapter chip; a short one plays at 0.9× and holds)
    # the clients; Munchly's page (its agents and their autonomy); its first stock export mapped, its distributors (one
    # held frame, the rings walking it on the words); its people (the invite panel); its own rules (a SKU's gates and a
    # batch's override)
    starts = win('console-setup', 'admin', 'A', [(1215.2, 1216.15, b[0] - c0 - 1.6), (935.1, 936.6, 1.6), (1006.1, 1007.75, b[2] - b[0]),
                                                (1069.6, 1070.2, b[3] - b[2]), (975.1, 977.1, 2.5)])
    S0 = c0
    s.shot('win', c0, c0 + MEDIA['console-setup']['dur'], media='console-setup', starts=starts, lift=1.5, place={'kind': 'laptop', 'cx': 1170, 'cy': 540, 'sw': 1320},
           rings=[R(S0 + 2.3, S0 + starts[1], [362, 755, 1546, 80]), R(S0 + starts[1] + 0.2, S0 + starts[2], [1100, 780, 290, 40]),
                  R(b[0] - 0.1, b[1] - 0.15, [380, 40, 1520, 400]), R(b[1] - 0.15, b[2] - 0.05, [1158, 860, 745, 335]),
                  R(b[2], S0 + starts[4], [1490, 105, 410, 590]), R(S0 + starts[4] + 0.3, S0 + MEDIA['console-setup']['dur'], [1110, 290, 730, 230])],
           cards=[C(S0 + 2.4, S0 + starts[1], [362, 755, 1546, 80], 'One console', 'Every brand, its own workspace', 'Its own address, its own data, its own rules.', 'building-2', w=360),
                  C(S0 + starts[4] + 0.4, S0 + MEDIA['console-setup']['dur'], [1110, 290, 730, 230], 'Its own rules', 'Gates per SKU, and per batch', 'What each app takes, set by the brand: the Watcher reads it every morning.', 'shield-check', w=360)])
    t = s.say('n10b', t + 1.0)                          # the platform team watches every client, live
    s.mark('watch', s.vo[-1]['t'])
    # the Overview live (figures, agents at work), its scroll to Food by day, then every client's batches
    # (the Overview takes the laptop a beat into the line, so the rules screen and its card are read first; the setup
    # screen, its last ring and its card leave as it does)
    w0, wb = s.marks['watch'] + 0.35, s.w('n10b', 'batch') - 0.25
    starts = win('console-overview', 'admin', 'A', [(195.7, 197.35, wb - w0 - 1.45), (197.35, 198.8, 1.45), (244.55, 245.4, t + 0.6 - wb)])
    O0 = w0
    cs = next(x for x in s.shots if x.get('media') == 'console-setup')
    cs['t1'] = round(min(cs['t1'], O0), 3)
    for x in cs['rings'] + cs['cards']: x['t1'] = round(min(x['t1'], O0), 3)
    s.shot('win', O0, t + 0.6, media='console-overview', starts=starts, enter='none', place={'kind': 'laptop', 'cx': 1170, 'cy': 540, 'sw': 1320},
           rings=[R(s.w('n10b', 'client') - 0.15, s.w('n10b', 'agent') - 0.1, [362, 265, 1546, 205]), R(s.w('n10b', 'agent') - 0.1, max(O0 + starts[1], s.w('n10b', 'agent') + 1.2), [362, 500, 1546, 470]),
                  R(O0 + starts[2] + 0.1, t + 0.6, [362, 230, 1546, 670])],
           cards=[C(s.w('n10b', 'client') - 0.05, t + 0.55, [362, 230, 1546, 740], 'Live', 'Every client, every agent', 'What they recovered, what waits for a yes, the agents at work.', 'activity', w=360)])   # (the whole page: it stays while its rings walk it)
    ots('p-neha', 'neha', 'console-setup', t + 0.6 - c0, 1.5, a=0.3)              # Neha at her laptop, the console on its screen
    s.shot('ots', c0, t + 0.6, media='p-neha', lift=1.5)
    s.mark('teams', t + 0.7)
    t = s.say('n11', t + 1.2)
    # every team's own part: the brand (Priya's Command Center), the distributor (her Today), the kirana (the offer),
    # the food bank (the pickups)
    win('team-brand', 'sad', 'P', [(98.5, 101.5, 3.0)]); win('team-dist', 'mango', 'L', [(564.55, 566.95, 3.0)])
    win('team-kirana', 'mango', 'H', [(249.6, 252.6, 3.0)]); win('team-foodbank', 'mango', 'H', [(527.0, 528.6, 3.0)])
    # each team's screen stays up until the line ends (its span plays, then holds as its person reads)
    t_end = s.vo[-1]['t'] + s.vo[-1]['dur'] + 0.5
    # the four devices rise awake in quick turn as the console leaves (no empty frame, no dark screen), and each is lit
    # on its word
    for k, (m, word) in enumerate([('team-brand', 'brand'), ('team-dist', 'distributors'), ('team-kirana', 'kiranas'), ('team-foodbank', 'food')]):
        a0 = s.marks['teams'] + 0.05 + 0.22 * k
        MEDIA[m]['segs'] = [(MEDIA[m]['segs'][0][0], MEDIA[m]['segs'][0][1], round(t_end - a0, 3))]; MEDIA[m]['dur'] = round(t_end - a0, 3)
        s.shot('win', a0, t_end, media=m, hi=round(s.w('n11', word) - 0.15, 3))
    # behind the four teams: the town from above, under the brand's green (the aerial a2-town; until it exists, the aisle)
    a_t = s.marks['teams'] - 0.15                       # from the overview's end: the town, then each team's device on its word
    clip('team-bg', 'a2-town' if (HERE / 'clips/a2-town.mp4').exists() and (HERE / 'clips/a2-town.mp4').stat().st_size else 'aisle-plain', 0.2, 4.9, t_end - a_t)
    s.mark('install', s.w('n11', 'installed') - 0.2)
    t = s.say('n11b', t + 1.1)                          # no app store: installed from the browser; alerts as notifications
    s.mark('notify', s.w('n11b', 'notification') - 0.5)
    s.end = t + 1.8; S.append(s)

    # ---- 7. The agents, in 3D (agents3d): nine stops, each held four seconds or more, the chase between ---------------
    s = Scene('agents', 'Agents3D')
    t = s.say('n12', 1.1); t = s.say('n13', t + 1.6)
    prev = None
    for lid in ['n14', 'n15', 'n16', 'n17', 'n18', 'n19', 'n20', 'n21', 'n21b']:
        at = t + 1.2 if prev is None else max(t + 1.0, prev + 5.9)
        if prev is None: at = max(at, s.vo[-1]['t'] + s.vo[-1]['dur'] + 2.2)
        prev = at; t = s.say(lid, at)
    t = s.say('n22', max(t + 1.6, prev + 5.9)); s.end = t + 4.6
    s.shot('seq', 0, s.end, media='agents3d')
    S.append(s)

    # ---- 8. One batch: the mango, Day 0 to Day 22 --------------------------------------------------------------
    # Each moment opens on the person with their own device, over the shoulder, the app's real screen in its glass; the
    # screen lifts out as the room racks out of focus; the person stays behind it. The clock chip names the hour.
    s = Scene('mango', 'Mango')
    # (a) Day 0 · 09:00 · the Watcher's flag on the lead's tablet: the quiet Command Center, the Watcher's two pushes
    #     landing, the flagged batches with the mango's card
    s.mark('detect', 0.0)
    t = s.say('n23', 2.0)
    d = t + 2.0
    starts = win('m-detect', 'sad', 'P', [(100.6, 104.8, 2.6), (104.8, 107.05, 2.25), (107.05, 111.0, d - 4.85)])
    a_rect = A_TABLET if have('a-desk') else [40, 430, 560, 250]
    if have('a-desk'): clip('a-detect', 'a-desk', 0.0, 2.0, d)      # the lead at her desk at nine, reading her tablet; its screen lifts out (she looks up at 1 s, by then out of focus)
    else: clip('a-detect', 'priya-desk', 0.2, 7.9, d)
    s.shot('clip', 0, d, media='a-detect', sharp=1.8, under='m-detect', fromRect=a_rect)
    s.shot('win', 0, d, media='m-detect', starts=starts, lift=1.8, fromRect=a_rect, clock=['Day 0', 'the morning check'],
           heads=[Hd(0.35, d - 0.1, 'Watcher', 'Detect', 'rules', 'radar', [(0.9, 'gates.check  → 22 days left · every gate shut'),
                  (1.8, 'sellthrough.project → 1,580 packs won’t sell'), (2.7, 'pubsub.publish → batch.at_risk')], done=3.4)],
           rings=[R(s.w('n23', 'flags') - 0.15, s.w('n23', 'flags') + 1.5, [717, 58, 346, 108]), R(s.w('n23', 'one') - 0.1, d - 0.2, [270, 505, 252, 62], 'red')],
           cards=[C(s.w('n23', 'one') + 0.3, d - 0.1, [270, 505, 252, 62], 'Caught 22 days out', '1,580 packs at risk',
                    'Flagged at the morning check, while there is still time to sell them elsewhere.', 'triangle-alert', 'red')])
    a0 = d
    # (b) Day 0 · 09:16 · one photo: the distributor at her cartons, her tablet's Today asking for the label; her
    #     camera's view full frame and the shutter; then Vision reading it, and the batch verified
    s.mark('verify', a0)
    t = s.say('n24', a0 + 0.9)
    e0 = t + 2.6
    d = e0 - a0
    starts = win('m-verify', 'mango', 'L', [(104.8, 106.2, 1.6), (106.2, 106.4, 1.7), (120.6, 122.2, 1.5), (133.3, 134.15, d - 4.8)])   # (the stage's TRUST card from 134.45)
    ots('b-verify', 'lakshmi-label', 'm-verify', d, 3.55)
    s.shot('ots', a0, a0 + d, media='b-verify', lift=3.55)
    s.shot('viewfinder', a0 + 1.6, a0 + 3.3, img='label-mango', shutter=a0 + 2.7)
    s.shot('win', a0, a0 + d, media='m-verify', starts=starts, lift=3.55, clock=['Day 0', 'the label photo'],
           heads=[Hd(a0 + 3.6, a0 + d - 0.1, 'Vision', 'Verify', 'flash', 'scan-line', [(a0 + 3.9, 'gemini.vision.read_label → batch · made · best before · MRP'),
                  (a0 + 4.7, 'dms.reconcile → ✓ matches the stock record')], done=a0 + 5.0)],
           rings=[R(a0 + winat('m-verify', 133.4, starts), a0 + d - 0.1, [338, 240, 248, 38]), R(s.w('n24', 'label') - 0.1, a0 + d - 0.1, [192, 762, 540, 158])],
           cards=[C(s.w('n24', 'against') - 0.2, a0 + d - 0.1, [192, 762, 540, 158], 'Read from one photo', 'The label matches the stock',
                    'Batch, dates and MRP checked against the stock record before anything is priced.', 'scan-line')])
    a0 = e0
    # (c) Day 0 · 09:20 · the plan priced: the Route Room, the Valuer and the Router, the split landing on its words
    s.mark('plan', a0)
    t = s.say('n25', a0 + 1.5)
    d = t + 2.2 - a0
    wp_, wk, wb = s.w('n25', 'plan') - a0 - 0.3, s.w('n25', 'Kiranas') - a0 - 0.6, s.w('n25', 'bin') - a0 + 0.5
    # the Router splitting, the plan ready (its push), the card with what it recovers, the five channels priced (held: the
    # stage rings each row from 174.5 to 181, so our rings walk the clean chart on the words), then what the plan earns
    starts = win('m-plan', 'mango', 'P', [(158.0, 162.9, wp_), (162.9, 163.9, 1.1), (165.4, 166.9, wk - wp_ - 1.1), (171.8, 173.0, wb - wk), (199.4, 200.9, d - wb)])
    ots('c-plan', 'priya', 'm-plan', d, 1.3, a=1.4)
    s.shot('ots', a0, a0 + d, media='c-plan', lift=1.3)
    P0 = a0
    s.shot('win', a0, a0 + d, media='m-plan', starts=starts, lift=1.3, clock=['Day 0', 'the plan'],
           heads=[Hd(P0 + 1.4, P0 + starts[3] - 0.05, 'Valuer', 'Value', 'pro', 'scale', [(P0 + 1.8, 'bigquery.price_history → sell-through by channel'),
                  (P0 + 2.8, 'price.exits → 5 exits, net of every cost')], done=P0 + starts[2] + 0.4),
                  Hd(P0 + starts[3], P0 + d - 0.1, 'Router', 'Decide', 'pro', 'route', [(P0 + starts[3] + 0.3, 'split → 1,372 kiranas · 150 staff · 58 food bank'),
                  (P0 + starts[3] + 1.4, 'write_off → 0 packs')], done=P0 + starts[4] + 0.3)],
           rings=[R(P0 + starts[1], P0 + starts[2], [717, 58, 346, 108]), R(P0 + starts[2] + 0.1, P0 + starts[3], [272, 425, 330, 108]),
                  R(s.w('n25', 'Kiranas') - 0.1, s.w('n25', 'staff') - 0.05, [285, 282, 425, 31]), R(s.w('n25', 'staff') - 0.05, s.w('n25', 'food') - 0.05, [313, 357, 335, 31]),
                  R(s.w('n25', 'food') - 0.05, s.w('n25', 'nothing') - 0.05, [308, 393, 290, 30]), R(s.w('n25', 'nothing') - 0.05, P0 + starts[4], [318, 429, 288, 30], 'red'),
                  R(P0 + starts[4] + 0.15, P0 + d - 0.1, [255, 674, 268, 52])],
           cards=[C(P0 + starts[4] + 0.3, P0 + d - 0.1, [255, 674, 268, 52], 'The plan', 'Nothing to the bin',
                    'Every pack placed, at prices set by the brand’s own rules, instead of a −₹22,657 write-off.')])
    a0 = a0 + d
    # (d) Day 0 · 09:35 · one yes: the brand's head asks, the lead approves; the Approve sheet, the tap
    s.mark('approve', a0)
    t = s.talk('d05', a0 + 0.55) + 0.25               # "Nothing to the bin?"
    t = s.talk('d06', t + 0.3, tail=0.08)             # "Not one pack. Approved." (cut on its last word: then her eyes pass the lens)
    a1 = t + 0.08
    t = s.say('n26', a1 + 0.5)
    d = t + 0.6 - a1
    starts = win('m-approve', 'mango', 'P', [(209.0, 209.05, 1.25), (209.05, 212.4, d - 1.25)])   # (the stage's CONTROL card up to 208.9)
    ap_rect = A_TABLET_TAP if have('a-desk') else [760, 330, 500, 390]
    if have('a-desk'): clip('d-approve', 'a-desk', 4.0, 6.0, d)     # the lead reaches to tap; the sheet lifts from her tablet
    else: clip('d-approve', 'priya-approve', 1.6, 5.8, d)
    s.shot('clip', a1, a1 + d, media='d-approve', sharp=0.55, under='m-approve', fromRect=ap_rect)
    tap = a1 + winat('m-approve', 209.9, starts)
    s.shot('win', a1, a1 + d, media='m-approve', starts=starts, lift=0.55, fromRect=ap_rect, clock=['Day 0', 'one yes'],
           heads=[Hd(a1 + 0.6, a1 + d - 0.05, 'One yes', 'Approve', 'you', 'hand', [], done=tap)],
           rings=[R(a1 + 0.75, tap + 0.35, [662, 576, 390, 46], 'amber')],
           cards=[C(a1 + 0.9, tap + 0.45, [662, 576, 390, 46], 'Nothing moves without it', 'One tap releases the agents',
                    'The lead sees what each one will do, then approves; every tap is logged.', 'hand', 'amber')],
           taps=[tap])
    s.mark('tap', tap)
    a0 = a1 + d
    # (e) Day 0 · 09:36 · the offer in Hindi on the kirana's phone; her line; it lands on the lead's Execution, the
    #     scheme filling, each order with its GST invoice
    s.mark('offer', a0)
    t = s.say('n27', a0 + 1.0, part=(0.0, 4.4))
    e0 = t + 1.2
    d = e0 - a0
    starts = win('m-offer', 'mango', 'H', [(244.85, 245.05, 1.6), (245.55, 245.88, d - 1.6)])   # (the blocked page to 244.8; the stage's ring 245.9-246.5)
    ots('e-offer', 'kirana', 'm-offer', d, 1.6)
    s.shot('ots', a0, a0 + d, media='e-offer', lift=1.6)
    s.shot('win', a0, a0 + d, media='m-offer', starts=starts, lift=1.6, clock=['Day 0', 'the offer'],
           heads=[Hd(a0 + 0.3, a0 + d - 0.05, 'Outreach', 'Execute', 'flash', 'send', [(a0 + 0.7, 'offer.write → Hindi · 10 + 2 free · 48 hours'),
                  (a0 + 1.6, 'fcm.send → 58 kiranas, each in their language')], done=a0 + 2.6)],
           rings=[R(max(a0 + 1.7, s.w('n27@0', 'offer') - 0.1), s.w('n27@0', 'Hindi'), [146, 326, 292, 92]), R(s.w('n27@0', 'Hindi') - 0.05, a0 + d - 0.05, [36, 478, 376, 116])],
           cards=[C(s.w('n27@0', 'Hindi') + 0.1, a0 + d - 0.05, [36, 478, 376, 116], 'In English', 'Today’s offer: ₹14.40 a pack',
                    'Buy 10, get 2 free. 48 hours only. Tap to order.', 'languages')])
    t = s.talk('d07', e0 + 0.5) + 0.5                 # the kirana owner: "Two free on ten. Twenty-four!" (from the frame the offer ends on)
    a1 = t
    s.mark('lands', a1 + 1.0)
    t = s.say('n27', a1 + 0.9, part=(4.45, None))     # "Each order lands with its own GST invoice."
    dk = t + 0.35 - a1
    starts = win('m-kinvoice', 'mango', 'H', [(252.3, 254.3, dk)])
    tk = next(x for x in s.shots if x.get('media') == 'mango-d07')   # her shop behind her phone, out of focus: the shot carries
    k_out = round(MEDIA['mango-d07']['out'] - (tk['t1'] - a1), 3)      # on from her line, from her clip's frame at the cut
    clip('k-invoice-bg', 'k-tail', k_out, 5.0, dk)      # (slowed: she turns to her right, so her phone sits on the left)
    s.shot('clip', a1, a1 + dk, media='k-invoice-bg', blur=True, under='m-kinvoice')
    s.shot('win', a1, a1 + dk, media='m-kinvoice', starts=starts, lift=0.0, place={'kind': 'phone', 'cx': 470, 'cy': 612, 'sh': 760}, clock=['Day 0', 'the scheme fills'],
           heads=[Hd(a1 + 0.3, a1 + dk - 0.05, 'Paperwork', 'Settle', 'flash', 'file-text', [(a1 + 0.6, 'invoice.issue → LA/26-27/0972 · ₹302'),
                  (s.w('n27@4.45', 'GST') - 0.3, 'pdf.lay_out → signed by the distributor')], done=s.w('n27@4.45', 'invoice'))],
           rings=[R(s.w('n27@4.45', 'GST') - 0.2, a1 + dk - 0.05, [34, 284, 330, 104])],
           cards=[C(s.w('n27@4.45', 'GST') + 0.05, a1 + dk - 0.05, [34, 284, 330, 104], 'Her own GST invoice', 'LA/26-27/0972 · ₹302',
                    'Issued by the distributor as she orders, paid on delivery.', 'receipt', side='r', w=380)])   # (her phone on the left: the card to its right)
    a1 += dk
    d_land = 1.3
    d = 6.2
    d_full = 2.1                                        # (the filled scheme held while its card is read)
    starts = win('m-orders', 'mango', 'P', [(248.5, 248.5 + d_land, d_land), (296.0, 437.0, d - d_land - d_full), (446.4, 447.6, d_full)])
    if have('a-desk'): clip('e-orders', 'a-desk', 4.6, 6.2, d)      # the orders land on the lead's Execution: her desk behind it
    else: clip('e-orders', 'priya-desk', 3.4, 7.9, d)
    s.shot('clip', a1, a1 + d, media='e-orders', blur=True, under='m-orders')
    s.shot('win', a1, a1 + d, media='m-orders', starts=starts, lift=0.0, ff=[starts[1], starts[2]], clock=['Day 0', 'the scheme fills'],
           heads=[Hd(a1 + 0.2, a1 + d - 0.05, 'Paperwork', 'Settle', 'flash', 'file-text', [(a1 + starts[1] + 0.4, 'register → 52 shops · 1,372 packs')], done=a1 + starts[2] + 0.4)],
           rings=[R(a1 + 0.3, a1 + starts[1], [262, 326, 200, 60]), R(a1 + starts[2] + 0.05, a1 + d - 0.05, [278, 666, 425, 50])],
           cards=[C(a1 + starts[2] + 0.25, a1 + d - 0.05, [278, 666, 425, 50], 'The scheme filled', '52 shops, 1,372 packs',
                    'Every order with its own GST invoice, in the distributor’s name.', 'receipt')],
           badge={'t0': round(a1 + starts[1], 3), 't1': round(a1 + starts[2], 3), 'text': '1 hour 45 minutes, fast', 'icon': 'fast-forward'})
    s.mark('invoice', s.w('n27@4.45', 'invoice') - 0.6)
    a0 = a1 + d
    # (f) Day 0 · 11:12 · the food bank: "Fifty-eight packs. All sealed."; the pickup collected, its receipt
    s.mark('pickup', a0)
    t = s.talk('d08', a0 + 0.55) + 0.45
    a1 = t + 0.2
    t = s.say('n29', a1 + 0.9)
    d = t + 2.6 - a1
    wr = s.w('n29', 'receipt') - a1 - 0.2            # (534.2-541.3: the stage rings the tracker; the receipt opens on 'receipt')
    starts = win('m-pickup', 'mango', 'H', [(529.2, 533.95, wr - 1.3), (541.5, 542.8, 1.3), (549.85, 551.95, d - wr)])
    ots('g-pickup', 'meera', 'm-pickup', d, 0.6)
    s.shot('ots', a1, a1 + d, media='g-pickup', lift=0.6)
    s.shot('win', a1, a1 + d, media='m-pickup', starts=starts, lift=0.6, clock=['Day 1', 'the food bank'],
           rings=[R(a1 + starts[2] + 0.2, a1 + d - 0.05, [48, 548, 352, 66]), R(a1 + starts[2] + 0.8, a1 + d - 0.05, [48, 726, 352, 30])],
           cards=[C(a1 + starts[2] + 0.4, a1 + d - 0.05, [48, 548, 352, 66], 'Donated, with evidence', '58 packs, 58 meals',
                    'The food bank’s own receipt, issued as it collects: evidence for the brand’s sustainability report.', 'heart-handshake')])
    s.mark('receipt', s.w('n29', 'receipt') - 0.4)
    a0 = a1 + d
    # (g) Day 1 · the staff sale: a staff member pays by UPI on his phone in front of the distributor's tablet, the
    #     receipt read by Vision, the sale recorded
    s.mark('staff', a0)
    t = s.say('n28', a0 + 1.6)
    d = t + 3.6 - a0                                   # (the sale recorded at its own pace after the line)
    wr = s.w('n28', 'receipt') - a0 + 0.2
    starts = win('m-staff', 'mango', 'L', [(456.0, 456.9, 1.6), (459.6, 461.0, wr - 1.6), (473.0, 473.3, 0.9), (474.85, 476.4, 1.7), (477.6, 480.6, d - wr - 2.6)])   # (the stage's ring on the match, 473.7-474.6, left out)
    ots('f-staff', 'upi', 'm-staff', d, 1.6, still2=HERE / 'build' / 'upi-paid.png')
    s.shot('ots', a0, a0 + d, media='f-staff', lift=1.6)
    s.shot('win', a0, a0 + d, media='m-staff', starts=starts, lift=1.6, clock=['Day 1', 'the staff sale'],
           heads=[Hd(a0 + starts[1], a0 + d - 0.05, 'Vision', 'Execute', 'flash', 'scan-line', [(a0 + starts[1] + 0.4, 'gemini.vision.read_receipt → 18 UPI payments'),
                  (a0 + starts[2] + 0.1, '✓ ₹1,200 = 150 packs × ₹8')], done=a0 + starts[2] + 0.2)],
           rings=[R(a0 + starts[2] + 0.05, a0 + starts[4] + 0.3, [208, 545, 597, 36]), R(a0 + starts[4] + 0.6, a0 + d - 0.05, [112, 640, 698, 52])],
           cards=[C(a0 + starts[2] + 0.3, a0 + d - 0.05, [208, 545, 597, 36], 'Checked, not trusted', 'The receipt matches the count',
                    'Every staff payment by its UPI reference: the sale records only when they add up.', 'badge-check')],
           taps=[a0 + starts[4] + 1.1])
    a0 = a0 + d
    # (h) Day 1 · the van round: the van at a kirana; "Bill's in the box? Good."
    s.mark('van', a0)
    clip('m-van', 'van-kirana', 0.4, 2.6, 2.0)
    s.shot('clip', a0, a0 + 2.0, media='m-van', clock=['Day 2', 'the van round'])
    t = s.talk('d09', a0 + 2.0 + 0.5) + 0.5
    a0 = t + 0.1
    # (i) Day 22 · best before: recovered against the write-off (over the evening); the distributor ends whole, on her
    #     own portal, her tablet in her hands
    s.mark('report', a0)
    t = s.say('n30', a0 + 0.9)
    s.mark('portal', t + 0.4)
    clip('m-report-bg', 'a3-lane', 0.2, 9.8, s.marks['portal'] - a0)   # the lanes the packs went to, from above (to the portal's first frame)
    s.shot('clip', a0, s.marks['portal'], media='m-report-bg', grade='greenSoft', clock=['Best before', 'the report'])
    t = s.say('n30b', t + 0.9)
    a1 = s.marks['portal']
    d = t + 1.4 - a1
    wp, wc = s.w('n30b', 'paper') - a1 - 0.5, s.w('n30b', 'rupee') - a1 - 0.4
    starts = win('m-portal', 'mango', 'L', [(748.0, 749.9, wp), (750.4, 750.95, wc - wp), (751.4, 755.2, d - wc)])   # (the stage's ring on the Papers tab at 750.0 and on the signature from 755.5, left out)
    pf = None
    if have('d-portal'):                                # at her godown at dusk, reading her portal on her tablet (its back to us)
        clip('i-portal', 'd-portal', 3.2, 5.0, d); pf = D_PORTAL     # (smiling down at it: before 3 s the take turns her away, after 5 s towards the lens)
        s.shot('clip', a1, a1 + d, media='i-portal', sharp=0.5, under='m-portal', fromRect=pf)
    else:
        ots('i-portal', 'lakshmi-label', 'm-portal', d, 0.5, a=2.4)
        s.shot('ots', a1, a1 + d, media='i-portal', lift=0.5)
    s.shot('win', a1, a1 + d, media='m-portal', starts=starts, lift=0.5, clock=['Best before', 'her portal'], **({'fromRect': pf} if pf else {}),
           rings=[R(a1 + 0.7, a1 + starts[1], [106, 522, 712, 30]), R(a1 + starts[1] + 0.1, a1 + starts[2], [95, 296, 260, 200]), R(a1 + starts[2] + 0.3, a1 + d - 0.05, [394, 776, 404, 26])],
           cards=[C(a1 + 0.9, a1 + starts[1], [106, 522, 712, 30], 'Her own portal', 'She ends whole: ₹0 lost',
                    'What each exit took, what was credited, and what she paid, line by line.', 'wallet'),
                  C(a1 + starts[2] + 0.5, a1 + d - 0.05, [394, 776, 404, 26], 'Credited on paper', '₹5,932 credit note',
                    'Signed by the brand, against its invoice: no expiry claim to chase.', 'file-check')])
    s.end = t + 1.4; S.append(s)

    # ---- 9. The hardest case: the chips, the lot, the window, the destruction and its second yes ----------------------
    s = Scene('chips', 'Chips')
    t = s.say('n31', 1.2)
    win('c-today', 'sad', 'L', [(108.5, 111.5, t + 0.6)])          # his Today: the chips flagged, Vision to check first
    ots('c-dusk', 'rakesh', 'c-today', t + 0.6, t + 5.0)           # (his screen stays in the glass: it never lifts out)
    s.shot('ots', 0, t + 0.6, media='c-dusk', sharp=2.6)
    a0 = t + 0.6
    # the lot: the buyer's phone, his bid, the Negotiator's counter, the lot won
    s.mark('lot', a0)
    t = s.say('n32', a0 + 1.0)
    d = t + 1.9 - a0
    starts = win('c-lot', 'sad', 'H', [(429.0, 431.0, 1.4), (431.2, 432.8, 1.2), (433.0, 435.0, 1.4), (448.4, 450.7, 2.2), (460.9, 462.4, d - 6.2)])   # (from the accept already pressed: the win and its card sooner)
    ots('j-lot', 'agrawal', 'c-lot', d, 1.0)
    s.shot('ots', a0, a0 + d, media='j-lot', lift=1.0)
    s.shot('win', a0, a0 + d, media='c-lot', starts=starts, lift=1.0, clock=['Day 0', 'the lot'],
           heads=[Hd(a0 + 1.1, a0 + d - 0.05, 'Negotiator', 'Execute', 'pro', 'handshake', [(a0 + starts[2] + 0.2, 'bid.read → ₹13.00 for 772'),
                  (a0 + starts[3] + 0.1, 'listing.counter → ₹14.20 · the floor stays hidden'), (a0 + starts[4] + 0.1, '✓ won at ₹14.20 · token paid')], done=a0 + starts[4] + 0.2)],
           rings=[R(a0 + winat('c-lot', 449.95, starts), a0 + starts[4], [36, 503, 378, 58], 'amber'),
                  R(a0 + winat('c-lot', 461.6, starts), a0 + d - 0.05, [30, 330, 352, 76])],
           cards=[C(a0 + winat('c-lot', 461.6, starts) + 0.2, a0 + d - 0.05, [30, 330, 352, 76], 'Closed by an agent', '772 packs at ₹14.20',
                    'Countered from the buyer’s ₹13 without ever showing the floor price; a GST invoice follows.', 'gavel')])
    s.talk('d10', a0 + d + 0.5, cut=3.45)             # the buyer: "Fourteen-twenty. Done." … "Truck's coming." over his truck
    a0 = s.shots[-1]['t1']
    s.mark('truck', a0)
    clip('c-truck', 'truck', 0.3, 4.6, 3.6)
    s.shot('clip', a0, a0 + 3.6, media='c-truck', clock=['Day 1', 'the buyer’s truck'], mask=[1088, 790, 124, 54])   # (its number plate's lettering is invented: softened)
    a0 += 3.6
    # the scheme: only two shops order; the window closes on 540 packets, on the lead's tablet at dusk
    s.mark('scheme', a0)
    t = s.say('n33', a0 + 0.7)
    d = t + 1.3 - a0
    starts = win('c-window', 'sad', 'P', [(502.8, 505.8, d)])     # (the stage's ring to 502.6; a push from 506; the page scrolls at 507.6)
    ots('k-window', 'priya-eve', 'c-window', d, 0.6)
    s.shot('ots', a0, a0 + d, media='k-window', lift=0.6)
    s.shot('win', a0, a0 + d, media='c-window', starts=starts, lift=0.6, clock=['Day 2', 'the window closes'],
           rings=[R(s.w('n33', 'two') - 0.1, s.w('n33', 'When'), [258, 418, 200, 66]), R(s.w('n33', 'When') - 0.05, a0 + d - 0.05, [278, 348, 424, 54], 'red')],
           cards=[C(s.w('n33', 'When') + 0.2, a0 + d - 0.05, [278, 348, 424, 54], 'The window closed', '540 packets left',
                    'Two shops ordered 48; the rest stayed at the distributor’s godown.', 'hourglass', 'red')])
    a0 += d
    # expiry day: the landfill; he photographs with his tablet (its camera's view in its glass, then full frame, the
    # shutter); Vision's checks on both photos; the signing at the facility; the certificate, signed by four
    s.mark('expiry', a0)
    clip('c-landfill', 'landfill', 0.3, 2.6, 2.0)
    s.shot('clip', a0, a0 + 2.0, media='c-landfill', clock=['Expiry day', 'at the landfill'])
    t = s.say('n34', a0 + 0.5)
    if have('r-raise'):
        clip('l-photo', 'r-raise', 0.5, 2.85, 2.0)       # (the take jumps at 3.0 s)
        s.shot('clip', a0 + 2.0, a0 + 4.0, media='l-photo', shutter=a0 + 2.0 + 1.72, clock=['Expiry day', 'the evidence'])   # (on the clip's own flash, 1.73 s in)
    else:
        ots('l-photo', 'landfill-photo', None, 2.0, 9.0, still=HERE / 'build' / 'cam-after.png')
        s.shot('ots', a0 + 2.0, a0 + 4.0, media='l-photo', clock=['Expiry day', 'the evidence'])
    s.shot('evidence', a0 + 4.0, s.w('n34', 'certificate') - 0.3)
    clip('c-evidence-bg', 'landfill-heap', 0.2, 4.8, s.w('n34', 'certificate') - 0.3 - (a0 + 4.0))   # the landfill behind Vision's checks
    a1 = s.w('n34', 'certificate') - 0.3
    OFF, FF = (594.6, 598.8), [(603.5, 621.0), (624.0, 635.4), (638.5, 654.4)]
    ff_src = sum(b - a for a, b in FF)
    d = t + 4.4 - a1
    sign_segs = [(OFF[0], OFF[1], 2.3)] + [(a, b, 1.8 * (b - a) / ff_src) for a, b in FF]
    rest = d - 4.1                                   # (the stage's ring on '4 of 4 signed', 657.0-657.9, left out)
    starts = win('c-sign', 'sad', 'L', sign_segs + [(655.8, 656.85, rest * 0.4), (658.1, 660.4, rest * 0.6)])
    ots('l-sign', 'landfill-sign', 'c-sign', d, 0.7)
    s.shot('ots', a1, a1 + d, media='l-sign', lift=0.7)
    s.shot('win', a1, a1 + d, media='c-sign', starts=starts, lift=0.7, ff=[starts[1], starts[1] + 1.8], clock=['Expiry day', 'signed on the spot'],
           rings=[R(a1 + starts[4] + 0.2, a1 + d - 0.05, [150, 740, 640, 200])],
           cards=[C(a1 + starts[4] + 0.4, a1 + d - 0.05, [150, 740, 640, 200], 'Signed in place', 'The officer, two witnesses, the distributor',
                    'On the agency’s certificate, on his tablet at the facility: each in their own box.', 'signature')],
           badge={'t0': round(a1 + starts[1], 3), 't1': round(a1 + starts[4], 3), 'text': 'Signing, fast', 'icon': 'fast-forward'})
    a0 = a1 + d
    t = s.talk('d11', a0 + 0.5) + 0.5                 # the distributor, to the officer: "All four signatures. It's on record."
    a0 = t
    # the second yes: the lead at dusk, the destruction review, the amber tap
    s.mark('second', a0)
    t = s.say('n35', a0 + 0.9)
    d = t + 3.0 - a0
    starts = win('c-yes', 'sad', 'P', [(696.9, 699.3, d - 3.4), (720.0, 723.4, 3.4)])   # (the stage's ring on a check, 696.2-696.7, left out)
    ots('m-yes', 'priya-eve', 'c-yes', d, 0.6, a=2.2)
    s.shot('ots', a0, a0 + d, media='m-yes', lift=0.6)
    tap = a0 + winat('c-yes', 720.7, starts)
    s.shot('win', a0, a0 + d, media='c-yes', starts=starts, lift=0.6, clock=['Expiry day', 'the second yes'],
           heads=[Hd(a0 + 0.6, a0 + d - 0.05, 'A second yes', 'Settle', 'you', 'hand', [], done=tap)],
           rings=[R(a0 + 0.7, a0 + starts[1], [662, 232, 390, 200]), R(a0 + starts[1] - 0.1, tap + 0.5, [800, 678, 252, 46], 'amber')],
           cards=[C(a0 + 0.9, tap + 0.45, [662, 232, 390, 200], 'Credit waits for evidence', 'Reviewed, then approved',
                    'Vision’s checks, the signed certificate, what the yes will issue: all on one sheet.', 'shield-check', 'amber')],
           taps=[tap])
    s.mark('tap', tap)
    a0 += d
    # the papers it issues: the expiry credit note and the agency's certificate, flat; the distributor made whole
    s.mark('issued', a0)
    t = s.say('n35b', a0 + 0.5)
    s.mark('whole', s.w('n35b', 'distributor') - 0.3)
    ots('c-issued-bg', 'rakesh', 'c-today', t + 1.9 - a0, t + 9.0 - a0, a=1.0)   # behind the papers: the distributor at his stack, his Today in the glass
    s.end = t + 1.9; S.append(s)

    # ---- 10. The record: every paper flat and signed; the audit trail; how it adds up; the impact ledger --------------
    s = Scene('record', 'Record')
    t = s.say('n36', 1.0)
    for k, word in [('gst', 'GST'), ('einv', 'e'), ('credit', 'credit'), ('memo', 'tax'), ('receipts', 'receipts'), ('certs', 'certificates')]:
        s.mark(k, s.w('n36', word) - 0.25)
    s.mark('audit', t + 3.4)
    t = s.say('n37', t + 4.0)
    s.mark('swing', t + 2.3)                           # (the trail draws back and folds into one export before the swing)
    t = s.say('n38', t + 2.4)
    s.mark('ledger', s.w('n38', 'impact') - 0.4)
    s.mark('kilos', t + 0.5)
    t = s.say('n38b', t + 0.9)
    ots('r-tablet', 'priya-eve', 'r-swing', t + 1.4 - s.marks['swing'], 0.6, a=0.6)
    s.shot('ots', s.marks['swing'], t + 1.4, media='r-tablet', lift=0.6)
    dsw = s.marks['ledger'] - s.marks['swing']
    starts = win('r-swing', 'mango', 'P', [(797.9, 800.15, 2.4), (808.6, 810.0, 1.7), (813.1, 816.0, dsw - 4.1)])
    SW0 = s.marks['swing']
    s.shot('win', SW0, s.marks['ledger'], media='r-swing', starts=starts, lift=0.6, clock=['Best before', 'the ledger'],
           rings=[R(SW0 + 1.0, s.w('n38', 'bin') - 0.3, [660, 60, 390, 60]), R(s.w('n38', 'bin') - 0.3, s.marks['ledger'], [660, 205, 392, 270])],
           cards=[C(s.w('n38', 'adds') - 0.2, s.marks['ledger'], [660, 60, 390, 60], 'How it adds up', '₹22,194 better than the bin', 'Exit by exit, against what destroying it would have cost.', 'scale', w=400)])
    d = s.marks['kilos'] - s.marks['ledger']
    starts = win('r-ledger', 'sad', 'P', [(853.2, 854.6, 1.4), (862.0, 863.6, d - 1.4)])
    s.shot('win', s.marks['ledger'], s.marks['kilos'], media='r-ledger', starts=starts, enter='none', clock=['Best before', 'the ledger'],
           rings=[R(s.w('n38', 'ledger') - 0.2, s.marks['kilos'], [250, 280, 800, 300])],
           cards=[C(s.w('n38', 'ready') - 0.2, s.marks['kilos'], [250, 280, 800, 300], 'The impact ledger', 'Ready for the BRSR report', 'Every batch posts its kilos, meals and CO₂e as it closes.', 'leaf', w=400)])
    d = t + 1.4 - s.marks['kilos']
    starts = win('r-mango', 'mango', 'P', [(771.0, 776.0, d)])
    s.shot('win', s.marks['kilos'], t + 1.4, media='r-mango', starts=starts, enter='none', clock=['Best before', 'the ledger'],
           rings=[R(s.w('n38b', 'kilos') - 0.2, s.w('n38b', 'meals') - 0.3, [716, 232, 348, 136]), R(s.w('n38b', 'meals') - 0.3, t + 1.4, [252, 468, 446, 170])],
           cards=[C(s.w('n38b', 'kilos') + 0.1, t + 1.4, [716, 232, 348, 136], 'On the mango alone', '340 kg kept out of landfill', '58 meals, from the food bank’s own receipt.', 'heart-handshake', w=400)])
    for k, key, a, b in [('r-truck', 'truck', 0.2, 4.8), ('r-van', 'van-kirana', 0.2, 4.8), ('r-godown', 'aisle-plain', 0.2, 4.8),
                         ('r-office', 'office', 0.2, 3.6), ('r-foodbank', 'foodbank', 0.2, 6.2), ('r-landfill', 'landfill-heap', 0.2, 4.8),
                         ('r-evening', 'evening', 0.2, 7.4)]:
        clip(k, key, a, b, None)
    s.end = t + 1.4; S.append(s)

    # ---- 11. The call, weeks later ---------------------------------------------------------------------------
    s = Scene('call', 'EveningCall')
    s.mark('ring', -0.9)                              # (a J-cut: the ring starts under the record's last shot)
    t = s.talk('d12', 0.5) + 0.4
    t = s.talk('d13', t + 0.35, tail=2.45) + 2.4       # her smile held after the line, until the close
    s.end = t; S.append(s)

    # ---- 12. The close: the line, the guided demo held five seconds after the last word ----------------------------
    s = Scene('close', 'Close')
    t = s.say('n39', 1.4)
    t = s.say('n40', t + 1.2); s.mark('cta', t - 1.6)
    clip('close-town', 'a2-town', 0.0, 9.95, t + 5.2)
    s.shot('clip', 0, t + 5.2, media='close-town', grade='green')
    s.end = t + 5.2; S.append(s)
    return S


def main():
    S = build()
    T = 0.0; out = {'fps': 60, 'w': 1920, 'h': 1080, 'scenes': [], 'vo': [], 'dlg': []}
    lines = []
    for s in S:
        if s.id in ('mango', 'chips'): s.close_gaps()
        s.fill_tail()
        sc = {'id': s.id, 'comp': s.comp, 't0': round(T, 3), 'dur': round(s.end, 3), 'marks': s.marks, 'vo': s.vo, 'dlg': s.dl,
              'words': s.words, 'shots': s.shots}
        for v in s.vo:
            out['vo'].append({'id': v['id'], 'key': v['key'], 't': round(T + v['t'], 3), 'from': v['from'], 'dur': v['dur'], 'file': f"tts/vo/maya1w-warm/{v['id']}.wav"})
            txt = LINES[v['id']]['text']
            lines.append(f"{T + v['t']:7.2f}  {s.id:9s} VO  {v['key']:9s} {v['dur']:5.2f}s  {txt if v['from'] == 0 and v['dur'] >= DUR[v['id']] - 0.01 else '(part) ' + txt}")
        for d in s.dl:
            out['dlg'].append({**d, 't': round(T + d['t'], 3)})
            lines.append(f"{T + d['t']:7.2f}  {s.id:9s} DLG {d['id']:9s} {d['e'] - d['s']:5.2f}s  {DLGS[d['id']]['text']} ({d['clip']})")
        out['scenes'].append(sc)
        lines.append(f"{T:7.2f}  {s.id:9s} --- scene {s.comp}, {s.end:.2f} s")
        T += s.end
    out['end'] = round(T, 3)
    out['media'] = {k: {kk: vv for kk, vv in m.items() if kk not in ('src',)} for k, m in MEDIA.items()}
    for p in [HERE / 'film' / 'src' / 'film.json', HERE / 'film' / 'public' / 'film.json']:
        p.parent.mkdir(parents=True, exist_ok=True); p.write_text(json.dumps(out, indent=1))
    (HERE / 'build').mkdir(exist_ok=True)
    (HERE / 'build' / 'media.json').write_text(json.dumps(MEDIA, indent=1))
    ag = next(x for x in out['scenes'] if x['id'] == 'agents')
    cues = {v['id']: [v['t'], round(v['t'] + v['dur'], 3)] for v in ag['vo']}
    cues['words'] = {k: [{'w': w['w'], 't': w['t']} for w in ws] for k, ws in ag['words'].items()}
    cues['end'] = ag['dur']
    (HERE / 'build' / 'cues-agents.json').write_text(json.dumps(cues, indent=1))
    lines.sort(key=lambda l: float(l[:7]))
    (HERE / 'build' / 'timeline.txt').write_text('\n'.join(lines) + f'\n{T:7.2f}  END\n')
    bad = [f"{k}: {sg}" for k, m in MEDIA.items() if m['kind'] == 'win' for sg in m['segs'] if sg[2] <= 0.05]
    if bad: print('WINDOW SPANS WITH NO TIME:', bad)
    print('\n'.join(l for l in lines if '---' in l)); print(f'{T:7.2f}  END  ({int(T // 60)} min {T % 60:.1f} s), {len(MEDIA)} media')


if __name__ == '__main__':
    main()
