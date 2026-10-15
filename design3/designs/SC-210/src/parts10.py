"""SC-210: the sales film's own parts, over SC-205 to SC-209's compositor (parts, parts3 … parts7, whose display text
SC-210 made generic: no client, person or product named in anything the film draws itself).

- RoleTag: a person's part in the story (never their name), as a tag on glass;
- TalkShot: a talking scene (Veo 3.1 with its own sound), frame for frame at 25 fps from the word its line starts on;
  with `cert`, the signed certificate tracked onto the tablet's blank screen, under the fingers that cross it;
- StampSlam: WRITTEN OFF, slammed onto the frame;
- TitleScene, SaasScene, BrandsScene: the product, the service, every brand's own workspace;
- EcoScene: the agentic ecosystem (eco/eco.js, captured frame-exact), its labels set here in the film's own type;
- PaperWall: the papers, each landing as it is named, then signed and filed;
- IntegrationsScene, Tagline, EndCard10: what it plugs into, the line, where to try it."""
import json, math
from functools import lru_cache
from parts import *
from parts3 import *
from parts4 import *
from parts5 import *
from parts6 import *
from parts7 import *
from parts4 import _zoom, _dot, _glow_line
import fx, vfx

INK = (244, 248, 245)
MUTED = (170, 196, 182)
GG = (52, 211, 128)

# ---------------------------------------------------------------- a person's part in the story

@lru_cache(maxsize=None)
def role_sprite(role, sub, icon='users', ink=(52, 211, 128)):
    S = 2
    w = int(max(text_w(role, 'g', 28, 680), text_w(sub, 'g', 19, 460))) + 64 + 34 + 28
    h = 80
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=18 * S, fill=(8, 16, 12, 205), outline=tuple(ink) + (130,), width=int(1.3 * S))
    d.ellipse([14 * S, 14 * S, 66 * S, 66 * S], fill=(16, 40, 28, 255), outline=tuple(ink) + (210,), width=int(1.6 * S))
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    ic = ICON(icon, 26, (220, 244, 230))
    spr = spr.copy()
    y0, x0 = 27, 27
    hh, ww = ic.shape[:2]
    spr[y0:y0 + hh, x0:x0 + ww] = spr[y0:y0 + hh, x0:x0 + ww] * (1 - ic[..., 3:4]) + ic
    t1 = TX(role, 'g', 28, 680, INK); t2 = TX(sub, 'g', 19, 460, MUTED)
    out = np.zeros_like(spr); out[:] = spr
    def put(s, x, y):
        hh, ww = s.shape[:2]
        out[y:y + hh, x:x + ww] = out[y:y + hh, x:x + ww] * (1 - s[..., 3:4]) + s
    put(t1, 86, 9); put(t2, 87, 46)
    return out


class RoleTag:
    def __init__(self, role, sub, u0, u1, icon='users', x=64, y=None, ink=(52, 211, 128)):
        self.spr = role_sprite(role, sub, icon, ink)
        self.u0, self.u1, self.x = u0, u1, x
        self.y = y if y is not None else H - self.spr.shape[0] - 72
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.45, 0.4)
        if a <= 0: return
        e = ease_out((u - self.u0) / 0.6)
        blit(f, self.spr, self.x - 22 * (1 - e), self.y, a)


# ---------------------------------------------------------------- the talking scenes

def _paper_img(png):
    p = PAPERS / 'png' / png
    return cv2.imread(str(p))


class TabletCert:
    """the signed certificate on the tablet's blank white screen (t6): the screen's corners found in every frame of the
    clip (the brightest flat quadrilateral where the tablet is), the page warped into it, and only the screen's own
    white pixels replaced, so a finger that crosses the screen stays in front of it"""
    def __init__(self, key, png, hint=(740, 640, 1120, 1020), crop=(100, 220, 1450, 1640)):
        pg = _paper_img(png)
        x0, y0, x1, y1 = crop                    # the page's title and its signatures, at the screen's own shape
        self.page = pg[y0:y1, x0:x1].astype(np.float32) / 255
        self.key, self.hint = key, hint
        self.cache = {}
        tj = HERE / 'build' / 'talk' / f'{key}.quads.json'
        self.quads = {int(k): np.float32(v) for k, v in json.loads(tj.read_text()).items()} if tj.exists() else None

    @staticmethod
    def find(img, hint):
        x0, y0, x1, y1 = hint
        roi = img[y0:y1, x0:x1]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        m = ((hsv[..., 2] > 228) & (hsv[..., 1] < 25)).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cs: return None
        c = max(cs, key=cv2.contourArea)
        if cv2.contourArea(c) < 4000: return None
        hull = cv2.convexHull(c)
        for eps in (0.02, 0.03, 0.045, 0.06):
            ap = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)
            if len(ap) == 4: break
        if len(ap) != 4:
            r = cv2.minAreaRect(c); ap = cv2.boxPoints(r).reshape(-1, 1, 2)
        q = ap.reshape(4, 2).astype(np.float32) + np.float32([x0, y0])
        # order: top-left, top-right, bottom-right, bottom-left
        s = q.sum(1); dd = np.diff(q, axis=1).ravel()
        return np.float32([q[np.argmin(s)], q[np.argmin(dd)], q[np.argmax(s)], q[np.argmax(dd)]])

    def apply(self, img_u8, k):
        q = None
        if self.quads is not None and k in self.quads: q = self.quads[k]
        if q is None: q = self.find(img_u8, self.hint)
        if q is None: return img_u8.astype(np.float32) / 255
        base = img_u8.astype(np.float32) / 255
        ph, pw = self.page.shape[:2]
        # the page fitted to the screen's shape, with a margin of the screen's own white
        M = cv2.getPerspectiveTransform(np.float32([[0, 0], [pw, 0], [pw, ph], [0, ph]]), q)
        x0, y0 = np.floor(q.min(0)).astype(int) - 2; x1, y1 = np.ceil(q.max(0)).astype(int) + 3
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        T = np.float32([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]]) @ M
        warped = cv2.warpPerspective(self.page, T, (x1 - x0, y1 - y0), flags=cv2.INTER_AREA)
        inside = cv2.warpPerspective(np.ones((ph, pw), np.float32), T, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR)
        roi = base[y0:y1, x0:x1]
        hsv = cv2.cvtColor((roi * 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
        white = np.clip((hsv[..., 2].astype(np.float32) - 175) / 40, 0, 1) * np.clip((60 - hsv[..., 1].astype(np.float32)) / 30, 0, 1)
        white = cv2.GaussianBlur(white, (0, 0), 1.0)
        m = (inside * white)[..., None]
        # the screen's own light: the page takes the white's brightness, so it sits in the shot's exposure
        lum = roi.mean(axis=2, keepdims=True)
        roi[:] = roi * (1 - m) + warped * np.clip(lum / 0.93, 0.6, 1.05) * m
        return base


class TalkShot:
    """a talking scene: the clip's window (prep-veo10.py, clips/talk-<id>.mp4) from the moment its line starts (u_line),
    frame for frame at 25 fps under a slow push; before the line, its first frame. The person's part in the story as a tag."""
    def __init__(self, lid, u_line, role=None, sub=None, icon='users', z=(1.0, 1.035), pt=(W * 0.5, H * 0.45), dur=8.0,
                 cert=None, tag_at=0.6, tag_for=3.4):
        self.foot = Footage(f'talk-{lid}', push=0.0)
        self.u_line, self.z, self.pt, self.dur = u_line, z, pt, dur
        self.cert = cert
        self.tag = RoleTag(role, sub, u_line + tag_at, u_line + tag_at + tag_for, icon) if role else None
    def draw(self, f, u, L=None):
        uc = max(0.0, u - self.u_line)
        img, _ = self.foot.frame(uc)
        if self.cert is not None:
            base = self.cert.apply(img, self.foot.index(uc))
        else:
            base = img.astype(np.float32) / 255
        z = self.z[0] + (self.z[1] - self.z[0]) * ease_in_out(clamp(u / self.dur))
        f[:] = _zoom(base, z, self.pt)
        if self.tag: self.tag.draw(f, u)


def track_tablet(key, hint, out):
    """the tablet screen's corners in every frame of a talking clip, smoothed over time (so the page never jitters)"""
    foot = Footage(key, push=0.0)
    qs = {}
    for k in range(foot.n):
        img = foot.src.get(k / 24.0)
        q = TabletCert.find(img, hint)
        if q is not None: qs[k] = q
    from scipy.ndimage import median_filter
    from scipy.signal import savgol_filter
    ks = np.array(sorted(qs))
    arr = np.float32([qs[k] for k in ks])
    # a frame where a finger crossed the screen's edge throws its corners: found against a running median, bridged
    med = median_filter(arr, size=(7, 1, 1), mode='nearest')
    good = np.abs(arr - med).max(axis=(1, 2)) <= 3.0
    full = np.arange(ks[0], ks[-1] + 1)
    fill = np.stack([np.stack([np.interp(full, ks[good], arr[good, c, a]) for a in range(2)], 1) for c in range(4)], 1)
    sm = savgol_filter(fill, 11, 2, axis=0)          # then each corner smoothed over time, so the page never jitters
    json.dump({str(int(k)): sm[i].round(2).tolist() for i, k in enumerate(full)}, open(out, 'w'))
    return int(good.sum()), foot.n


# ---------------------------------------------------------------- WRITTEN OFF

class StampSlam:
    """a rubber stamp slammed onto the frame: it lands from large in 0.12 s, the frame jolts, a red flush at the edges,
    then it holds (its ink takes the light under it)"""
    def __init__(self, cx, cy, u0, text='WRITTEN OFF', size=760, ang=-9, u1=99.0):
        st = LabelPrint._stamp(text)
        s = size / st.shape[1]
        M = cv2.getRotationMatrix2D((st.shape[1] / 2, st.shape[0] / 2), ang, s)
        cw, ch = int(size * 1.15), int(size * 0.55)
        M[0, 2] += cw / 2 - st.shape[1] / 2; M[1, 2] += ch / 2 - st.shape[0] / 2
        self.ink = cv2.warpAffine(st, M, (cw, ch), flags=cv2.INTER_LINEAR)
        self.cx, self.cy, self.u0, self.u1 = cx, cy, u0, u1
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
        self.edge = (np.clip((d - 0.55) / 0.75, 0, 1) ** 1.5)[..., None]
    def draw(self, f, u, L=None):
        t = u - self.u0
        if t < 0 or u > self.u1: return
        p = clamp(t / 0.12)
        sc = 1.45 - 0.45 * ease_out(p)
        a = clamp(p * 3.0) * fade(u, self.u0, self.u1, 0.0, 0.3)
        ink = cv2.resize(self.ink, None, fx=sc, fy=sc, interpolation=cv2.INTER_LINEAR)
        h, w = ink.shape
        x0, y0 = int(self.cx - w / 2), int(self.cy - h / 2)
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
        if X1 > X0 and Y1 > Y0:
            m = (ink[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] * 0.92 * a)[..., None]
            roi = f[Y0:Y1, X0:X1]
            lum = roi.mean(axis=2, keepdims=True)
            red = np.float32([0.12, 0.13, 0.80])
            roi[:] = roi * (1 - m) + red * (0.55 + 0.55 * lum) * m
        if t < 0.6:
            flush = math.exp(-t / 0.16) * 0.42
            f[:] = f * (1 - self.edge * flush) + col((200, 30, 24)) * (self.edge * flush)
            jolt = math.exp(-t / 0.05) * math.cos(t * 70)
            if abs(jolt) > 0.02:
                M = np.float32([[1, 0, 0], [0, 1, 5.0 * jolt]])
                f[:] = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


class Shade:
    """a soft dark gradient from a side, so words read over a bright shot"""
    def __init__(self, side='left', reach=0.62, depth=0.62, u0=0.0, u1=99.0):
        x = np.linspace(0, 1, W, dtype=np.float32)
        y = np.linspace(0, 1, H, dtype=np.float32)
        if side == 'left': g = np.clip(1 - x / reach, 0, 1) ** 1.6; self.m = np.repeat(g[None, :], H, 0)
        elif side == 'right': g = np.clip((x - (1 - reach)) / reach, 0, 1) ** 1.6; self.m = np.repeat(g[None, :], H, 0)
        elif side == 'bottom': g = np.clip((y - (1 - reach)) / reach, 0, 1) ** 1.6; self.m = np.repeat(g[:, None], W, 1)
        else: g = np.clip(1 - y / reach, 0, 1) ** 1.6; self.m = np.repeat(g[:, None], W, 1)
        self.depth, self.u0, self.u1 = depth, u0, u1
    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.4, 0.4) * self.depth
        if a <= 0: return
        f *= (1 - a * self.m)[..., None]


class Grain:
    """film grain over live action, fixed per frame (seeded by the frame), never moving on a still"""
    def __init__(self, amt=0.022, seed=210):
        rng = np.random.default_rng(seed)
        self.tiles = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
        self.amt = amt
    def draw(self, f, u, L=None):
        k = int(u * FPS) % len(self.tiles)
        g = cv2.resize(self.tiles[k], (W, H), interpolation=cv2.INTER_LINEAR)
        lum = f.mean(axis=2)
        w_ = (0.35 + 0.65 * np.clip(1 - np.abs(lum - 0.45) / 0.55, 0, 1)) * self.amt
        f += (g * w_)[..., None]


class LightLeak:
    """a warm light leak washing across the frame, for a change of act: in over `dur`, peak, out"""
    def __init__(self, u0, dur=1.1, side=1, color=(80, 170, 255), power=0.75):
        self.u0, self.dur, self.side, self.color, self.power = u0, dur, side, np.float32(color) / 255, power
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.xx, self.yy = xx / W, yy / H
    def draw(self, f, u, L=None):
        t = (u - self.u0) / self.dur
        if t <= 0 or t >= 1: return
        a = math.sin(math.pi * t) ** 1.5 * self.power
        cx = (-0.2 + 1.4 * t) if self.side > 0 else (1.2 - 1.4 * t)
        d = np.sqrt(((self.xx - cx) / 0.55) ** 2 + ((self.yy - 0.35) / 0.9) ** 2)
        m = np.clip(1 - d, 0, 1) ** 2 * a
        f[:] = 1 - (1 - f) * (1 - self.color[None, None, :] * m[..., None])   # screen blend


# ---------------------------------------------------------------- the product, the service, every brand's workspace

class TitleScene:
    """This is Smart-Clearance: on the night ground, light falling in, the mark draws its route, the name rises"""
    def __init__(self, L, u_mark, u_name):
        self.L, self.um, self.un = L, u_mark, u_name
        self.mark = MarkDraw(W // 2 - 300, H // 2, 200, u_mark)
        self.bg = studio()
        self.dust = fx.Dust(n=140, seed=210, strength=0.4)
        self.rays = fx.Rays(W * 0.5, -160, strength=0.18, turn=0.012)
        self.name = TX('Smart-Clearance', 'b', 118, 800, INK)
        self.sub = TX('Near-expiry stock, routed by AI agents', 'g', 30, 520, MUTED)
    def draw(self, f, u, L=None):
        f[:] = self.bg
        self.rays.draw(f, u); self.dust.draw(f, u)
        self.mark.draw(f, u)
        a = clamp((u - self.un) / 0.45)
        if a > 0:
            e = ease_out((u - self.un) / 0.7)
            nx = W // 2 - 300 + 140
            blit(f, self.name, nx + 30 * (1 - e), H // 2 - self.name.shape[0] / 2 - 18, a)
            blit(f, self.sub, nx + 6 + 30 * (1 - e), H // 2 + self.name.shape[0] / 2 - 6, a * clamp((u - self.un - 0.3) / 0.4))
        if self.un - 0.1 < u < self.un + 0.9:   # a glint as the name lands
            fx.flare(f, W // 2 - 160 + 900 * ease_in_out((u - self.un + 0.1) / 1.0), H // 2 - 40, power=0.5 * math.sin(math.pi * clamp((u - self.un + 0.1) / 1.0)), streak=700)


class SaasScene:
    """software, delivered as a service, that turns write-offs into recovery: the line lands word by word, large; the
    batch's write-off, struck, rolls into what the plan recovered (money.js: −₹22,657 if destroyed, ₹16,917 recovered)"""
    def __init__(self, L, u_soft, u_write, u_rec, u_as=None, u_service=None, u_into=None):
        self.L, self.us, self.uw, self.ur = L, u_soft, u_write, u_rec
        self.bg = studio()
        self.kick = kicker_sprite('SOFTWARE AS A SERVICE · ONE PLATFORM, EVERY BRAND', (232, 242, 236), 20)
        self.l1 = Kinetic(W / 2, 300, [[('Software,', u_soft), ('delivered', u_soft + 0.55), ('as', u_as or u_soft + 1.3), ('a', u_as or u_soft + 1.3), ('service', u_service or u_soft + 1.7)]],
                          size=78, align='center')
        self.l2 = Kinetic(W / 2, 420, [[('write-offs', u_write, (255, 120, 100)), ('into', u_into or u_write + 0.55), ('recovery.', u_rec, (52, 211, 128))]], size=78, align='center')
        self.morph = RecoveryMorph(W / 2 - 205, 640, u_write, u_rec, L + 1)
        self.mark = MarkDraw(W // 2, 165, 84, 0.05)
        self.dust = fx.Dust(n=110, seed=211, strength=0.35)
        self.rays = fx.Rays(W * 0.5, -200, strength=0.12, turn=0.01)
    def draw(self, f, u, L=None):
        f[:] = self.bg
        self.rays.draw(f, u); self.dust.draw(f, u)
        self.mark.draw(f, u)
        a = clamp((u - self.us + 0.2) / 0.4)
        blit(f, self.kick, W / 2 - self.kick.shape[1] / 2, 228, a)
        self.l1.draw(f, u); self.l2.draw(f, u)
        self.morph.draw(f, u)


BRAND_ROLL = [('n1-factory-line', 'Snacks & Drinks Co.', 'snacks', 'snacks and drinks', (52, 160, 110)),
              ('b2-factory-tea', 'Tea Co.', 'tea', 'tea', (34, 150, 140)),
              ('b3-factory-biscuits', 'Biscuits Co.', 'biscuits', 'biscuits', (96, 110, 224))]


class BrandsScene:
    """every brand gets its own secure workspace: three brands' factories, each held and cross-faded, its own workspace
    sliding in, the earlier ones stacking (all fictional, generic)"""
    def __init__(self, L, cuts):
        self.L, self.cuts = L, cuts
        n = len(BRAND_ROLL)
        self.stills = [Still25D(k, z=(1.0, 1.06), pan=((0, 0), (-14 + 14 * i, -4)), dur=(cuts[i + 1] - cuts[i]) + 0.9 if i + 1 < len(cuts) else L - cuts[i] + 0.9,
                                focus=(0.5, 0.55), depth_k=0.45) for i, (k, *_r) in enumerate(BRAND_ROLL)]
        self.cards = [workspace_card(name, slug, what, tile) for _, name, slug, what, tile in BRAND_ROLL]
        self.kick = kicker_sprite('EVERY BRAND · ITS OWN SECURE WORKSPACE', (232, 242, 236), 17)
        self.top = (0.42 + 0.58 * np.linspace(0, 1, 190, dtype=np.float32) ** 1.4)[:, None, None]
    def stage(self, i, f, u):
        self.stills[i].draw(f, u - self.cuts[i])
        f *= 0.88
        f[:190] *= self.top
    def draw(self, f, u, L=None):
        i = max(0, min(len(BRAND_ROLL) - 1, sum(1 for c in self.cuts[1:] if u >= c)))
        self.stage(i, f, u)
        if i > 0 and u - self.cuts[i] < 0.55:
            prev = np.empty_like(f); self.stage(i - 1, prev, u)
            e = ease_in_out((u - self.cuts[i]) / 0.55)
            f[:] = prev * (1 - e) + f * e
        ka = clamp((u - 0.2) / 0.35)
        kh, kw = self.kick.shape[:2]
        panel(f, 80, 58, 112 + kw, 82 + kh, ka, r=14, alpha=0.82, shade=0.3)
        blit(f, self.kick, 96, 70, ka)
        for j in range(i + 1):
            c = self.cards[j]; tj = self.cuts[j] + 0.3
            if u < tj: continue
            sp = fm_spring(u - tj, 150, 22)
            if j < i:
                k = i - j
                blit(f, c, 96 + 40 * (k - 1), 860 - 40 * (k - 1), 0.85, scale=0.5)
            else:
                blit(f, c, 1220 + 160 * (1 - sp), 640, clamp((u - tj) / 0.35), scale=0.95 + 0.05 * sp)


# ---------------------------------------------------------------- the agentic ecosystem

ECO_JOB = {'data': 'loads the stock', 'watcher': "spots what won't sell", 'vision': 'reads the label', 'valuer': 'prices every exit',
           'router': 'splits the batch', 'outreach': 'finds the kiranas', 'lister': 'lists the lot', 'negotiator': 'closes the deal',
           'paperwork': 'files every paper', 'impact': 'measures the good', 'you': 'a person · the one yes'}
ECO_ICON = {k: v[1] for k, v in AGENT.items()}


@lru_cache(maxsize=None)
def eco_card(key):
    """an agent's card in the 3D world: its icon in an orb, its name, its one job, the model it thinks with"""
    name = 'You' if key == 'you' else AGENT[key][0]
    ink = AMBER if key == 'you' else G
    job = ECO_JOB[key]
    model = 'a person' if key == 'you' else MODEL[key]
    S = 2
    w = int(max(text_w(name, 'b', 34, 780), text_w(job, 'g', 20, 520), text_w(model, 'g', 16, 640) + 30)) + 92 + 40
    h = 132
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=20 * S, fill=(8, 16, 12, 214), outline=tuple(ink) + (150,), width=int(1.4 * S))
    draw_text(d, (92 * S, 14 * S), name, 'b', 34 * S, INK + (255,), 780)
    draw_text(d, (93 * S, 58 * S), job, 'g', 20 * S, MUTED + (255,), 520)
    mw = text_w(model, 'g', 16, 640) + 26
    pro = 'Pro' in model
    chip_ink = AMBER if pro or key == 'you' else G
    d.rounded_rectangle([92 * S, 92 * S, (92 + mw) * S, 118 * S], radius=13 * S, fill=tuple(int(c * 0.22) for c in chip_ink) + (255,), outline=tuple(chip_ink) + (200,), width=int(1.2 * S))
    draw_text(d, (105 * S, 95 * S), model, 'g', 16 * S, tuple(min(255, int(c * 1.05)) for c in chip_ink) + (255,), 640)
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    orb = orb_sprite(ECO_ICON.get(key, 'hand'), 64, ink)
    oh, ow = orb.shape[:2]
    y0, x0 = (h - oh) // 2, 16
    spr[y0:y0 + oh, x0:x0 + ow] = spr[y0:y0 + oh, x0:x0 + ow] * (1 - orb[..., 3:4]) + orb
    return spr


@lru_cache(maxsize=None)
def eco_name(key):
    name = 'You' if key == 'you' else AGENT[key][0]
    return TX(name, 'g', 19, 640, (225, 240, 232))


DEVICE_SIZE = {'laptop': (2.32, 1.52), 'tablet': (1.42, 1.87), 'phone': (0.87, 1.62)}   # eco.js DEV, with their frames


class EcoScene:
    """the agentic ecosystem as eco.js drew it (frames captured frame-exact on the narration's own cues), its labels set
    here: each agent's card beside it as the voice names it, its name kept under it after; the services as tags; the
    person's yes in amber; the scene's lines as headlines"""
    def __init__(self, folder, L, heads=(), tags=(), hold_last=True):
        self.dir = Path(folder)
        meta = json.loads((self.dir / 'frames.json').read_text())
        self.frames, self.cues, self.fps = meta['frames'], meta['cues'], meta['fps']
        self.src = SeqSource(self.dir, scale=1.0) if False else None
        self.L, self.heads, self.tags = L, list(heads), list(tags)
        self.cache = (None, None)
        self.order = ['data', 'watcher', 'vision', 'valuer', 'router', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact']
    def img(self, k):
        if self.cache[0] == k: return self.cache[1]
        p = self.dir / f'f{k:05d}.jpg'
        im = cv2.imread(str(p)).astype(np.float32) / 255
        self.cache = (k, im)
        return im
    def draw(self, f, u, L=None):
        k = int(clamp(round(u * self.fps), 0, len(self.frames) - 1))
        f[:] = self.img(k)
        fr = self.frames[k]
        nodes = fr['nodes']
        cues = self.cues
        # the cards: from its cue until the next agent's, gone as the next one comes, so two cards never share the
        # frame (neighbours on the ring would overlap); the last holds a moment longer
        names = []
        for i, key in enumerate(self.order):
            c = cues.get(key)
            if c is None: continue
            nxt = next((cues[x] for x in self.order[i + 1:] if cues.get(x) is not None), c + 2.2)
            u0, u1 = c - 0.05, min(nxt - 0.02, c + 2.6)
            x, y, vis, dist = nodes[key]['p']
            if vis and u0 <= u <= u1:
                a = fade(u, u0, u1, 0.25, 0.2)
                spr = eco_card(key)
                e = ease_out((u - u0) / 0.45)
                side = 1 if x < W * 0.62 else -1
                cx = x + side * (70 + 26 * (1 - e)); cy = y - 120
                bx = cx if side > 0 else cx - spr.shape[1]
                bx = clamp(bx, 40, W - spr.shape[1] - 40); by = clamp(cy - spr.shape[0] / 2, 120, H - spr.shape[0] - 120)
                line(f, (x, y), (bx if side > 0 else bx + spr.shape[1], by + spr.shape[0] / 2), (115, 201, 157), alpha=0.8 * a, width=1.6, dot=True)
                blit(f, spr, bx, by, a)
            # its name, kept under it once named, while the camera is wide enough for names to help
            elif vis and u > u1 and u < self.L - 0.2:
                d_ = dist
                a = clamp((u - u1) / 0.4) * clamp((d_ - 9.0) / 4.0) * 0.85
                if a > 0.02: names.append((d_, key, x, y, a))
        # the names, nearest first, each fading as it runs into a nearer name or another agent's node (continuous in the
        # camera's move, so nothing pops): the wide shot of all ten is not a tangle of labels
        placed = []
        # the live screens eco.js floats over the ring (its devices, at their projected centres): a name under one
        # fades, as under a nearer name. Their size on screen from the camera's 38-degree field of view (f = 1568 px)
        for dk, dv in fr.get('devices', {}).items():
            dx_, dy_, dvis, ddist = dv['p']
            if not dvis or dv['a'] < 0.05 or ddist <= 0: continue
            dw, dh = DEVICE_SIZE.get(dk, (1.4, 1.4))
            hw, hh = 1568 * dw / 2 / ddist, 1568 * dh / 2 / ddist
            placed.append(((dx_ - hw, dy_ - hh, dx_ + hw, dy_ + hh), dv['a']))
        pts = [(v['p'][0], v['p'][1]) for k_, v in nodes.items() if k_ in self.order and v['p'][2]]
        for d_, key, x, y, a in sorted(names):
            s_ = eco_name(key)
            w_, h_ = s_.shape[1], s_.shape[0]
            r = (x - w_ / 2 - 6, y + 14, x + w_ / 2 + 6, y + 22 + h_)
            area = (r[2] - r[0]) * (r[3] - r[1])
            m = 1.0
            for q, qa in placed:
                ox = max(0.0, min(r[2], q[2]) - max(r[0], q[0])); oy = max(0.0, min(r[3], q[3]) - max(r[1], q[1]))
                m = min(m, clamp(1 - 3.0 * qa * ox * oy / area))
            for px, py in pts:
                if abs(px - x) < 1 and abs(py - y) < 1: continue
                dx = max(r[0] - px, 0, px - r[2]); dy = max(r[1] - py, 0, py - r[3])
                m = min(m, clamp(((dx * dx + dy * dy) ** 0.5 - 4.0) / 14.0))
            if a * m > 0.02:
                blit(f, s_, x - w_ / 2, y + 18, a * m)
                placed.append((r, m))
        # the person's yes
        cy_ = cues.get('yes')
        if cy_ is not None and u >= cy_ - 0.1:
            x, y, vis, dist = nodes['you']['p']
            if vis:
                a = fade(u, cy_ - 0.1, self.L + 1, 0.3, 0.3)
                spr = eco_card('you')
                bx = clamp(x + 70, 40, W - spr.shape[1] - 40); by = clamp(y - 150, 120, H - spr.shape[0] - 120)
                line(f, (x, y), (bx, by + spr.shape[0] / 2), AMBER, alpha=0.85 * a, width=1.8, dot=True)
                blit(f, spr, bx, by, a)
        for it in self.heads: it.draw(f, u)
        for it in self.tags: it.draw(f, u)


# ---------------------------------------------------------------- the papers

class PaperWall:
    """the papers, each landing large as the voice names it (a ring on what matters on it, a caption beside), the one
    before stepping back into a fanned stack; on 'signed' the newest closes in on its signature; on 'filed' the stack
    gathers into a row, kept for good. beats: [(u, png, (x0, y0, x1, y1) page px or None, kicker, title, body)]"""
    def __init__(self, L, beats, u_signed=None, sign_rect=None, u_filed=None, bg=None):
        self.L, self.beats, self.us, self.sr, self.uf = L, beats, u_signed, sign_rect, u_filed
        self.pages = [_paper_img(b[1]).astype(np.float32) / 255 for b in beats]
        self.bg = bg if bg is not None else studio()
        self.caps = [card_sprite(b[4], b[5], ('proof', b[3]), 440) for b in beats]
        self.kick = kicker_sprite('PAPERWORK · DRAFTED, SIGNED AND FILED BY THE AGENT', (232, 242, 236), 16)
        self.filed = chip_sprite('Filed · every PDF kept in Cloud Storage', 'good', 24)
        self.mips = {}
    def page_at(self, i, s):
        key = (i, round(s, 3))
        pg = self.pages[i]
        return cv2.resize(pg, (max(2, int(pg.shape[1] * s)), max(2, int(pg.shape[0] * s))), interpolation=cv2.INTER_AREA)
    def put(self, f, i, cx, cy, s, ang, a, shadow_a=0.5):
        pg = self.page_at(i, s)
        h, w = pg.shape[:2]
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
        M[0, 2] += cx - w / 2; M[1, 2] += cy - h / 2
        img = cv2.warpAffine(pg, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        m = cv2.warpAffine(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
        sh = cv2.GaussianBlur(m, (0, 0), 18) * shadow_a * a
        sh = np.roll(sh, 16, axis=0)
        f *= (1 - sh[..., None])
        mm = (m * a)[..., None]
        f[:] = f * (1 - mm) + img * mm
        return M
    def draw(self, f, u, L=None):
        f[:] = self.bg
        a0 = clamp(u / 0.4)
        blit(f, self.kick, 96, 70, a0)
        n = len(self.beats)
        cur = max(-1, sum(1 for b in self.beats if u >= b[0]) - 1)
        gather = ease_in_out(clamp((u - self.uf) / 0.9)) if self.uf is not None else 0.0
        REST = 940
        # the stack: the earlier papers, fanned at the right, the oldest furthest back
        for j in range(cur):
            age = cur - j
            s = 300 / self.pages[j].shape[0]
            sx, sy = 1560 - (age - 1) * 34, 520 + (age - 1) * 10
            ang = -6 + (j % 3) * 4
            if gather > 0:
                gx, gy = 260 + j * 230, 860
                sx, sy = sx + (gx - sx) * gather, sy + (gy - sy) * gather
                ang = ang * (1 - gather)
                s = s * (1 - 0.25 * gather)
            self.put(f, j, sx, sy, s, ang, 0.95 * (1 - 0.0 * gather), 0.35)
        if cur < 0: return
        b = self.beats[cur]
        t = u - b[0]
        pg = self.pages[cur]
        s_rest = REST / pg.shape[0]
        e = ease_out(clamp(t / 0.55))
        # it lands from below right, turning to rest
        cx = 640 + 260 * (1 - e); cy = 560 + 420 * (1 - e)
        ang = 8 * (1 - e) - 1.5
        s = s_rest
        # 'signed': the newest closes in on its signature
        sg = 0.0
        if self.us is not None and cur == n - 1 and u >= self.us and self.sr is not None:
            sg = ease_in_out(clamp((u - self.us) / 0.8)) * (1 - gather)
            x0, y0, x1, y1 = self.sr
            zc = min(2.2, 780 / max(1, (x1 - x0) * s_rest)) * s_rest
            s = s_rest + (zc - s_rest) * sg
            # keep the signature's centre at the frame's left-centre as it grows
            px, py = (x0 + x1) / 2 - pg.shape[1] / 2, (y0 + y1) / 2 - pg.shape[0] / 2
            cx = cx + (680 - (cx + px * s)) * sg
            cy = cy + (560 - (cy + py * s)) * sg
        if gather > 0:
            gx, gy = 260 + cur * 230, 860
            s_end = 300 / pg.shape[0] * 0.75
            cx, cy = cx + (gx - cx) * gather, cy + (gy - cy) * gather
            s = s + (s_end - s) * gather
            ang = ang * (1 - gather)
        M = self.put(f, cur, cx, cy, s, ang, clamp(t / 0.2), 0.55)
        # the ring on what matters, once it has landed
        if b[2] is not None and t > 0.5 and gather < 0.3 and sg < 0.2:
            x0, y0, x1, y1 = b[2]
            pts = np.float32([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) * s
            pg_s = self.page_at(cur, s)
            hh, ww = pg_s.shape[:2]
            R = cv2.getRotationMatrix2D((ww / 2, hh / 2), ang, 1.0); R[0, 2] += cx - ww / 2; R[1, 2] += cy - hh / 2
            q = cv2.transform(pts[None], R)[0]
            rx0, ry0, rx1, ry1 = q[:, 0].min(), q[:, 1].min(), q[:, 0].max(), q[:, 1].max()
            ra = fade(u, b[0] + 0.5, (self.beats[cur + 1][0] if cur + 1 < n else self.L) - 0.05, 0.2, 0.25)
            ring(f, rx0 - 8, ry0 - 6, rx1 + 8, ry1 + 6, 10, prog=ease_out((t - 0.5) / 0.5), alpha=ra * (1 - sg), color=C['amber2'])
        if sg > 0.2 and self.sr is not None:
            ring(f, 680 - 330, 560 - 170, 680 + 330, 560 + 170, 14, prog=ease_out((u - self.us - 0.4) / 0.5), alpha=clamp((sg - 0.2) / 0.4) * (1 - gather), color=C['amber2'])
        # its caption, at the right
        ca = clamp((t - 0.35) / 0.35) * (1 - gather)
        nxt = self.beats[cur + 1][0] if cur + 1 < n else self.L
        ca *= 1 - clamp((u - (nxt - 0.15)) / 0.15)
        if ca > 0:
            cap = self.caps[cur]
            blit(f, cap, 1180 + 20 * (1 - ca), 760, ca)
        if self.us is not None and u >= self.us and cur == n - 1:
            sa = clamp((u - self.us - 0.5) / 0.35) * (1 - gather)
            blit(f, chip_sprite('Signed · the signatory over the firm’s own stamp', 'good', 24), 1180, 700, sa)
        if gather > 0.3:
            blit(f, self.filed, W / 2 - self.filed.shape[1] / 2, 700, clamp((gather - 0.3) / 0.4))


# ---------------------------------------------------------------- what it plugs into, the line, the end

INTEGRATIONS = [('file-text', 'Stock exports', "the distributor's DMS, every morning"),
                ('receipt', 'Tally', 'invoices issued from the books'),
                ('indian-rupee', 'UPI', 'staff payments, each by its reference'),
                ('shopping-bag', 'The marketplace', 'ExpireSoon, near-expiry lots'),
                ('heart-handshake', 'Food banks', 'pickups, with receipts')]


@lru_cache(maxsize=None)
def integ_card(icon, title, sub):
    S = 2
    w = int(max(text_w(title, 'b', 30, 760), text_w(sub, 'g', 18, 500))) + 86 + 34
    h = 96
    im = Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=20 * S, fill=(10, 20, 15, 225), outline=(63, 176, 123, 150), width=int(1.4 * S))
    draw_text(d, (86 * S, 16 * S), title, 'b', 30 * S, INK + (255,), 760)
    draw_text(d, (87 * S, 56 * S), sub, 'g', 18 * S, MUTED + (255,), 500)
    spr = to_sprite(im.resize((w, h), Image.LANCZOS))
    orb = orb_sprite(icon, 58, G)
    oh, ow = orb.shape[:2]
    y0, x0 = (h - oh) // 2, 16
    spr[y0:y0 + oh, x0:x0 + ow] = spr[y0:y0 + oh, x0:x0 + ow] * (1 - orb[..., 3:4]) + orb
    return spr


def device_still(rec, dev, t):
    """one frame of a production recording's device screen (the app as it ran), BGR float"""
    x, y, w, h = DEV[dev]
    src = FrameSource(REC[rec], rect=(x, y, w, h), fps=25)
    fr = src.get(t); src.close()
    return fr.astype(np.float32) / 255


class IntegrationsScene:
    """it plugs into what brands already use: the platform's mark at the centre, each integration landing on its ring
    as the voice names it, events running along the lines; then the workspace on a laptop, a tablet and a phone"""
    def __init__(self, L, cues, u_dev, shots):
        self.L, self.cues, self.ud = L, cues, u_dev
        self.bg = studio()
        self.mark = MarkDraw(W // 2, 530, 150, 0.1)
        self.c = (W / 2, 530)
        n = len(INTEGRATIONS)
        self.pos = [(W / 2 + 580 * math.cos(math.radians(a)), 530 + 290 * math.sin(math.radians(a))) for a in [210, 270, 330, 30, 150][:n]]
        self.cards = [integ_card(*it) for it in INTEGRATIONS]
        self.kick = kicker_sprite('IT PLUGS INTO WHAT BRANDS ALREADY USE', (232, 242, 236), 17)
        self.shots = shots   # [(BGR float, kind)] laptop, tablet, phone
        self.dust = fx.Dust(n=80, seed=212, strength=0.3)
    def frame_dev(self, f, img, x, y, w, h, r, a):
        sh = cv2.resize(img, (int(w), int(h)), interpolation=cv2.INTER_AREA)
        x0, y0 = int(x), int(y)
        shadow(f, x0, y0, x0 + int(w), y0 + int(h), r, alpha=0.5 * a)
        ix0, iy0, al = rrect_alpha(x0 - 10, y0 - 10, x0 + int(w) + 10, y0 + int(h) + 10, r + 8)
        over(f, ix0, iy0, col((24, 30, 27)), al * a)
        roi = f[y0:y0 + sh.shape[0], x0:x0 + sh.shape[1]]
        roi[:] = roi * (1 - a) + sh[:roi.shape[0], :roi.shape[1]] * a
    def draw(self, f, u, L=None):
        f[:] = self.bg
        self.dust.draw(f, u)
        dv = ease_in_out(clamp((u - self.ud) / 0.8))
        a0 = clamp(u / 0.4) * (1 - dv)
        blit(f, self.kick, W / 2 - self.kick.shape[1] / 2, 92, a0)
        if dv < 1:
            self.mark.draw(f, u)
            for i, ((x, y), c) in enumerate(zip(self.pos, self.cards)):
                t0 = self.cues[i]
                if u < t0: continue
                e = ease_out(clamp((u - t0) / 0.5))
                a = clamp((u - t0) / 0.3) * (1 - dv)
                line(f, self.c, (x, y), (115, 201, 157), alpha=0.55 * a * e, width=1.6, dot=False)
                for k in range(3):   # events running along the line, both ways
                    ph = ((u - t0) * 0.7 + k / 3) % 1.0
                    px, py = self.c[0] + (x - self.c[0]) * ph, self.c[1] + (y - self.c[1]) * ph
                    _dot(f, (px, py), 3.4, G, 0.85 * a, glow=5)
                blit(f, c, x - c.shape[1] / 2, y - c.shape[0] / 2 + 20 * (1 - e), a)
        if dv > 0 and self.shots:
            # the devices rise in a row: laptop, tablet, phone, each with the app as it ran on that device
            specs = [(120, 260, 980, 636, 14), (1150, 230, 410, 600, 22), (1610, 300, 236, 510, 30)]
            for i, ((img, kind), (x, y, w, h, r)) in enumerate(zip(self.shots, specs)):
                e = ease_out(clamp((u - self.ud - 0.12 * i) / 0.7))
                a = clamp((u - self.ud - 0.12 * i) / 0.4)
                if a <= 0: continue
                self.frame_dev(f, img, x, y + 60 * (1 - e), w, h, r, a)
            ka = clamp((u - self.ud - 0.4) / 0.4)
            lab = TX('Every phone, tablet and laptop · one workspace, installed as an app', 'g', 26, 600, MUTED)
            blit(f, lab, W / 2 - lab.shape[1] / 2, 960, ka)


class Tagline:
    """the line, word by word, over the closing shot (a shade under it)"""
    def __init__(self, x, y, words, size=78):
        self.x, self.y, self.words, self.size = x, y, words, size
    def draw(self, f, u, L=None):
        x = self.x; y = self.y
        for w, t, *rgb in self.words:
            if w == '\n': x = self.x; y += int(self.size * 1.18); continue
            s = TX(w, 'b', self.size, 800, tuple(rgb[0]) if rgb else INK)
            a, sc = slam(u, t)
            if a > 0: blit(f, s, x, y + s.shape[0] / 2, a, scale=sc, ox=0, oy=s.shape[0] / 2)
            x += s.shape[1] + int(self.size * 0.26)


class EndCard10:
    """the close: the mark and the name, the line, where to try it (the guided demo, its QR code), and what it runs on"""
    def __init__(self, L, u0=0.0):
        self.L, self.u0 = L, u0
        self.bg = studio()
        self.mark = MarkDraw(W // 2 - 390, 400, 150, u0 + 0.05)
        self.name = TX('Smart-Clearance', 'b', 104, 800, INK)
        self.line_ = TX('Ten agents. One yes. Nothing good goes to waste.', 'g', 32, 560, MUTED)
        self.url = TX('smartclearance-demo.web.app', 'b', 44, 760, GG)
        self.try_ = TX('TRY THE GUIDED DEMO', 'g', 17, 700, (232, 242, 236), 0.16)
        q = cv2.imread(str(HERE / 'build' / 'qr-demo.png'), cv2.IMREAD_UNCHANGED)
        if q.ndim == 2: q = cv2.cvtColor(q, cv2.COLOR_GRAY2BGR)
        if q.shape[2] == 3: q = np.dstack([q, np.full(q.shape[:2], 255, np.uint8)])
        q = cv2.resize(q, (190, 190), interpolation=cv2.INTER_NEAREST).astype(np.float32) / 255
        q[..., :3] *= q[..., 3:4]
        self.qr = q
        self.stack = TX('Built on Google Cloud · Gemini on Vertex AI · Cloud Run · Firebase · BigQuery', 'g', 20, 560, (130, 156, 142))
        self.dust = fx.Dust(n=110, seed=213, strength=0.35)
    def draw(self, f, u, L=None):
        f[:] = self.bg
        self.dust.draw(f, u)
        self.mark.draw(f, u)
        a = clamp((u - self.u0 - 0.5) / 0.45); e = ease_out((u - self.u0 - 0.5) / 0.7)
        nx = W // 2 - 390 + 110
        blit(f, self.name, nx + 24 * (1 - e), 400 - self.name.shape[0] / 2 - 20, a)
        blit(f, self.line_, nx + 4, 400 + self.name.shape[0] / 2 - 6, a * clamp((u - self.u0 - 0.8) / 0.4))
        b = clamp((u - self.u0 - 1.3) / 0.45)
        y = 640
        panel(f, W // 2 - 560, y - 24, W // 2 + 560, y + 236, b, r=24, alpha=0.82, shade=0.3)
        bq = np.ones((210, 210, 4), np.float32); bq[..., :3] = 1.0
        blit(f, bq, W // 2 - 540, y - 14, b)
        blit(f, self.qr, W // 2 - 530, y - 4, b)
        blit(f, self.try_, W // 2 - 300, y + 40, b)
        blit(f, self.url, W // 2 - 300, y + 76, b)
        blit(f, TX('the platform console, the workspace and three journeys, in your browser', 'g', 21, 520, MUTED), W // 2 - 300, y + 146, b)
        blit(f, self.stack, W / 2 - self.stack.shape[1] / 2, 960, clamp((u - self.u0 - 1.8) / 0.5))
