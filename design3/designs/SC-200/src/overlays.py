"""SC-200: every still the cut lays over the picture, drawn with Pillow on design system v3 (Bricolage Grotesque for
display, Geist for UI; the greens and the amber of tokens.css), transparent 1920 x 1080 PNGs in build/ov/:

- the overlays film.json names (statements, chips, the title, chapters, name tags, kickers, callouts, the close, the
  end card), each chips item as its own file (<id>#<k>) so they can arrive one by one;
- the brand mark drawn from design3/system/img/icon.svg's geometry, and its route drawing itself (build/ov/mark/);
- each device card's rounded mask, shadow and rim (build/card/);
- the section backdrops, blurred and graded (build/back/);
- a loop of drifting golden dust (build/dust/), laid over the backdrops in screen blend.

  .venv-tools/bin/python overlays.py
"""
import json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
D3 = HERE.parent.parent.parent
B = HERE / "build"
FILM = json.loads((HERE / "film.json").read_text())
W, H = FILM["width"], FILM["height"]

G900, G800, G700, G600, G500, G400, G300, G100, G50 = "#0e3c2b", "#12513a", "#176b4e", "#177c52", "#1f9563", "#3fb07b", "#73c99d", "#d4efe0", "#ecf8f1"
AMBER, CLAY, WHITE, PAPER = "#f7c04a", "#e0662c", "#ffffff", "#fbf8f1"

def rgba(hexc, a=255):
    hexc = hexc.lstrip("#"); return tuple(int(hexc[i:i + 2], 16) for i in (0, 2, 4)) + (a,)

# ---- type -------------------------------------------------------------------------------------------------------
FB = str(HERE / "fonts" / "Bricolage.ttf"); FG = str(HERE / "fonts" / "Geist.ttf"); FS = "/System/Library/Fonts/SFNS.ttf"
_cache = {}
def font(kind, size, wght=500):
    key = (kind, size, wght)
    if key not in _cache:
        f = ImageFont.truetype({"b": FB, "g": FG, "s": FS}[kind], size)
        try:
            if kind == "b": f.set_variation_by_axes([min(96, max(12, size)), wght, 100])
            elif kind == "g": f.set_variation_by_axes([wght])
        except Exception:  # noqa: BLE001
            pass
        _cache[key] = f
    return _cache[key]

MISSING = set("₹→−")  # not in the design system's subsets: drawn in SF Pro at the same size
def runs(text):
    out, cur, fb = [], "", None
    for ch in text:
        f = ch in MISSING
        if fb is None or f == fb: cur += ch
        else: out.append((cur, fb)); cur = ch
        fb = f
    if cur: out.append((cur, fb))
    return out

def text_w(text, kind, size, wght, track=0):
    w = 0
    for chunk, fb in runs(text):
        f = font("s", size, wght) if fb else font(kind, size, wght)
        w += f.getlength(chunk) + track * len(chunk)
    return w

def draw_text(d, xy, text, kind, size, wght, fill, track=0):
    x, y = xy
    for chunk, fb in runs(text):
        f = font("s", size, wght) if fb else font(kind, size, wght)
        if track:
            for ch in chunk:
                d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch) + track
        else:
            d.text((x, y + (size * 0.06 if fb else 0)), chunk, font=f, fill=fill); x += f.getlength(chunk)
    return x

def wrap(text, kind, size, wght, width):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if text_w(t, kind, size, wght) <= width or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def canvas():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def shadowed(layer, radius=14, alpha=0.55, offset=(0, 4)):
    """The layer over a soft shadow made from its own alpha, so white type reads on any plate."""
    a = layer.split()[3]
    sh = Image.new("RGBA", layer.size, (6, 20, 14, 0)); sh.putalpha(a.point(lambda v: int(v * alpha)))
    sh = sh.filter(ImageFilter.GaussianBlur(radius))
    out = canvas(); out.alpha_composite(sh, offset); out.alpha_composite(layer)
    return out

def glass(d, box, r, fill=(8, 34, 24, 168), rim=(255, 255, 255, 52)):
    d.rounded_rectangle(box, r, fill=fill, outline=rim, width=2)

# ---- the mark (icon.svg, 64 units) -----------------------------------------------------------------------------
def mark(size, progress=1.0, pin=1.0):
    S = 16; n = 64 * S; im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    # squircle with the diagonal gradient
    grad = Image.new("RGBA", (n, n))
    gp = grad.load()
    stops = [(0, (0x2f, 0xbf, 0x7f)), (0.55, (0x17, 0x82, 0x58)), (1, (0x0d, 0x5a, 0x3e))]
    for yy in range(0, n, 4):
        for xx in range(0, n, 4):
            u = ((xx / S - 8) * 50 + (yy / S - 4) * 58) / (50 * 50 + 58 * 58); u = max(0, min(1, u))
            for (u0, c0), (u1, c1) in zip(stops, stops[1:]):
                if u <= u1:
                    k = (u - u0) / (u1 - u0); c = tuple(int(c0[i] + (c1[i] - c0[i]) * k) for i in range(3)); break
            for dy in range(4):
                for dx in range(4):
                    gp[xx + dx, yy + dy] = c + (255,)
    sq = Image.new("L", (n, n), 0); sd = ImageDraw.Draw(sq)
    pts = []
    for i in range(720):
        th = 2 * math.pi * i / 720; c, s_ = math.cos(th), math.sin(th)
        rx = abs(c) ** (2 / 5) * (1 if c >= 0 else -1); ry = abs(s_) ** (2 / 5) * (1 if s_ >= 0 else -1)
        pts.append(((32 + 30 * rx) * S, (32 + 30 * ry) * S))
    sd.polygon(pts, fill=255)
    im.paste(grad, (0, 0), sq)
    hl = Image.new("RGBA", (n, n), (255, 255, 255, 0)); hd = ImageDraw.Draw(hl)
    hd.ellipse([3 * S, -10 * S, 61 * S, 34 * S], fill=(255, 255, 255, 46))
    hl.putalpha(Image.composite(hl.split()[3], Image.new("L", (n, n), 0), sq)); im.alpha_composite(hl)
    # the route: H43.5→27 at y19, arc r7 to y33, →37, arc r7 to y47, →20.5
    path = [(43.5 - 16.5 * k, 19) for k in [i / 40 for i in range(41)]]
    path += [(27 - 7 * math.sin(math.pi * k), 26 - 7 * math.cos(math.pi * k)) for k in [i / 40 for i in range(41)]]
    path += [(27 + 10 * k, 33) for k in [i / 30 for i in range(31)]]
    path += [(37 + 7 * math.sin(math.pi * k), 40 - 7 * math.cos(math.pi * k)) for k in [i / 40 for i in range(41)]]
    path += [(37 - 16.5 * k, 47) for k in [i / 40 for i in range(41)]]
    upto = max(2, int(len(path) * progress))
    d = ImageDraw.Draw(im); seg = [(x * S, y * S) for x, y in path[:upto]]
    d.line(seg, fill=WHITE, width=6 * S, joint="curve")
    for p in (seg[0], seg[-1]):
        d.ellipse([p[0] - 3 * S, p[1] - 3 * S, p[0] + 3 * S, p[1] + 3 * S], fill=WHITE)
    d.ellipse([(43.5 - 3.4 - 1.3) * S, (19 - 3.4 - 1.3) * S, (43.5 + 3.4 + 1.3) * S, (19 + 3.4 + 1.3) * S], fill=WHITE)
    d.ellipse([(43.5 - 3.4 + 1.3) * S, (19 - 3.4 + 1.3) * S, (43.5 + 3.4 - 1.3) * S, (19 + 3.4 - 1.3) * S], fill="#0d5a3e")
    if pin > 0:
        r = 5.2 * (0.6 + 0.4 * pin)
        d.ellipse([(20.5 - r - 1.1) * S, (47 - r - 1.1) * S, (20.5 + r + 1.1) * S, (47 + r + 1.1) * S], fill=WHITE)
        d.ellipse([(20.5 - r + 1.1) * S, (47 - r + 1.1) * S, (20.5 + r - 1.1) * S, (47 + r - 1.1) * S], fill=AMBER)
    return im.resize((size, size), Image.LANCZOS)

# ---- overlay kinds ---------------------------------------------------------------------------------------------
def k_statement(o):
    lay = canvas(); d = ImageDraw.Draw(lay); x, y = 112, 640
    draw_text(d, (x, y), o["kicker"], "g", 24, 650, rgba(AMBER), track=3.5)
    y += 50
    for ln in o["lines"]:
        draw_text(d, (x, y), ln, "b", 92, 640, WHITE); y += 100
    # a soft dark wash under the words, bottom-left
    wash = canvas(); wd = ImageDraw.Draw(wash)
    wd.ellipse([-500, 420, 1300, 1400], fill=(4, 14, 10, 140)); wash = wash.filter(ImageFilter.GaussianBlur(120))
    wash.alpha_composite(shadowed(lay, 18, 0.6))
    return wash

def k_chips(o):
    """One file per chip, laid out in a row (centred or from the left)."""
    size, pad, gap, hgt = 34, 30, 22, 74
    widths = [text_w(t, "g", size, 560) + 2 * pad + 34 for t in o["items"]]
    total = sum(widths) + gap * (len(widths) - 1)
    x = (W - total) / 2 if o.get("center") else 112
    out = []
    for t, w in zip(o["items"], widths):
        lay = canvas(); d = ImageDraw.Draw(lay); y = o["y"]
        if o.get("tone") == "clay":
            glass(d, [x, y, x + w, y + hgt], hgt // 2, fill=(40, 14, 6, 178), rim=(255, 170, 130, 90)); dot = CLAY
        else:
            glass(d, [x, y, x + w, y + hgt], hgt // 2, fill=(255, 255, 255, 40), rim=(255, 255, 255, 96)); dot = AMBER
        d.ellipse([x + pad - 4, y + hgt / 2 - 8, x + pad + 12, y + hgt / 2 + 8], fill=dot)
        draw_text(d, (x + pad + 30, y + (hgt - size) / 2 - 4), t, "g", size, 560, WHITE)
        out.append(shadowed(lay, 16, 0.5)); x += w + gap
    return out

def k_title(o):
    lay = canvas(); d = ImageDraw.Draw(lay)
    m = mark(168); word = "Smart-Clearance"; ws = text_w(word, "b", 118, 700)
    total = 168 + 40 + ws; x0 = (W - total) / 2; y0 = 360
    (B / "ov" / "title.json").write_text(json.dumps({"mark": [int(x0), y0]}))
    draw_text(d, (x0 + 208, y0 + 16), word, "b", 118, 700, WHITE)
    tw = text_w(o["tagline"], "g", 40, 430)
    draw_text(d, ((W - tw) / 2, y0 + 214), o["tagline"], "g", 40, 430, rgba(WHITE, 235))
    wash = canvas(); wd = ImageDraw.Draw(wash); wd.ellipse([260, 250, 1660, 720], fill=(4, 18, 12, 120))
    wash = wash.filter(ImageFilter.GaussianBlur(110)); wash.alpha_composite(shadowed(lay, 20, 0.55))
    return wash

def k_chapter(o):
    lay = canvas(); d = ImageDraw.Draw(lay); x, y = 112, 700
    draw_text(d, (x, y), f"{o['num']}", "b", 40, 700, rgba(AMBER))
    d.line([(x + 66, y + 26), (x + 136, y + 26)], fill=rgba(AMBER, 230), width=3)
    draw_text(d, (x + 156, y + 8), o["label"], "g", 24, 650, rgba(AMBER), track=3.5)
    draw_text(d, (x, y + 58), o["head"], "b", 96, 660, WHITE)
    draw_text(d, (x + 4, y + 182), o["sub"], "g", 30, 460, rgba(WHITE, 225))
    wash = canvas(); wd = ImageDraw.Draw(wash); wd.ellipse([-560, 480, 1500, 1500], fill=(4, 14, 10, 160))
    wash = wash.filter(ImageFilter.GaussianBlur(130)); wash.alpha_composite(shadowed(lay, 18, 0.6))
    return wash

def portrait(name, size):
    src = D3 / "system" / "img" / "people" / f"{name}.webp"
    im = Image.open(src).convert("RGBA"); s = min(im.size)
    im = im.crop(((im.width - s) // 2, 0, (im.width + s) // 2, s)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out

def k_tag(o):
    lay = canvas(); d = ImageDraw.Draw(lay); x, y = o["x"], o["y"]; av = 64
    nw = max(text_w(o["name"], "g", 30, 620), text_w(o["role"], "g", 23, 450))
    w = av + 28 + nw + 36; h = 88
    glass(d, [x, y, x + w, y + h], h // 2)
    lay.alpha_composite(portrait(o["person"], av), (x + 12, y + 12))
    d.ellipse([x + 12, y + 12, x + 12 + av, y + 12 + av], outline=rgba(AMBER, 230), width=3)
    draw_text(d, (x + av + 30, y + 14), o["name"], "g", 30, 620, WHITE)
    draw_text(d, (x + av + 30, y + 50), o["role"], "g", 23, 450, rgba(G100))
    return shadowed(lay, 16, 0.45)

def k_kicker(o):
    lay = canvas(); d = ImageDraw.Draw(lay); x, y, w = o["x"], o["y"], o["w"]
    acc = {"amber": AMBER, "clay": CLAY}.get(o.get("accent"), G300)
    d.rounded_rectangle([x, y, x + 6, y + 30], 3, fill=rgba(acc))
    draw_text(d, (x + 20, y + 1), o["kicker"], "g", 23, 650, rgba(acc if acc != G300 else G300), track=3)
    yy, hs = y + 52, o.get("hs", 56)
    for ln in wrap(o["head"], "b", hs, 640, w):
        draw_text(d, (x, yy), ln, "b", hs, 640, WHITE); yy += int(hs * 1.14)
    return shadowed(lay, 16, 0.55)

def k_callout(o):
    lay = canvas(); d = ImageDraw.Draw(lay); x, y = o["x"], o["y"]
    acc = {"amber": AMBER, "clay": CLAY}.get(o.get("accent"), G300)
    fs = o.get("fs", 92)
    fw = text_w(o["fig"], "b", fs, 700); cw = text_w(o["cap"], "g", 27, 450); kw = text_w(o["kicker"], "g", 21, 650, 3)
    w = max(fw, cw, kw) + 64; h = 130 + int(fs * 1.0)
    glass(d, [x, y, x + w, y + h], 28, fill=(8, 34, 24, 184))
    draw_text(d, (x + 32, y + 26), o["kicker"], "g", 21, 650, rgba(acc), track=3)
    draw_text(d, (x + 30, y + 54), o["fig"], "b", fs, 700, WHITE)
    draw_text(d, (x + 32, y + 76 + int(fs * 1.0)), o["cap"], "g", 27, 450, rgba(G100))
    return shadowed(lay, 18, 0.45)

def k_line(o):
    lay = canvas(); d = ImageDraw.Draw(lay)
    col = rgba(AMBER) if o.get("accent") == "amber" else WHITE
    tw = text_w(o["text"], "b", 76, 640)
    draw_text(d, ((W - tw) / 2, o["y"]), o["text"], "b", 76, 640, col)
    return shadowed(lay, 22, 0.7)

def k_end(o):
    lay = canvas(); d = ImageDraw.Draw(lay)
    m = mark(150); word = "Smart-Clearance"; ws = text_w(word, "b", 104, 700)
    total = 150 + 36 + ws; x0 = (W - total) / 2; y0 = 300
    lay.alpha_composite(m, (int(x0), y0)); draw_text(d, (x0 + 186, y0 + 14), word, "b", 104, 700, WHITE)
    tag = "Every near-expiry carton, a second chance."
    draw_text(d, ((W - text_w(tag, "g", 40, 430)) / 2, y0 + 190), tag, "g", 40, 430, rgba(WHITE, 235))
    rows = [("The platform", o["url"]), ("The guided demo", o["demo"])]
    y = y0 + 300
    for label, url in rows:
        lw = text_w(label.upper(), "g", 20, 650, 3); uw = text_w(url, "g", 34, 560)
        bw = max(lw, uw) + 72; bx = (W - bw) / 2
        glass(d, [bx, y, bx + bw, y + 96], 26, fill=(8, 34, 24, 150))
        draw_text(d, ((W - lw) / 2, y + 14), label.upper(), "g", 20, 650, rgba(AMBER), track=3)
        draw_text(d, ((W - uw) / 2, y + 42), url, "g", 34, 560, WHITE); y += 116
    foot = "Built on Google Cloud · agents on Gemini · Munchly Foods and every person shown are fictional"
    draw_text(d, ((W - text_w(foot, "g", 22, 430)) / 2, 1010), foot, "g", 22, 430, rgba(WHITE, 170))
    return shadowed(lay, 20, 0.5)

KINDS = {"statement": k_statement, "chips": k_chips, "title": k_title, "chapter": k_chapter, "tag": k_tag,
         "kicker": k_kicker, "callout": k_callout, "line": k_line, "end": k_end}

# ---- cards, backdrops, dust, the mark's draw -------------------------------------------------------------------
def card_assets():
    out = B / "card"; out.mkdir(parents=True, exist_ok=True)
    for name, lay in FILM["layout"].items():
        for dev, (x, y, w) in lay.items():
            dw, dh = FILM["dev"][dev][2], FILM["dev"][dev][3]
            h = round(w * dh / dw / 2) * 2; w = round(w / 2) * 2; r = 30 if dev != "phone" else 44
            m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
            m.save(out / f"{name}-{dev}-mask.png")
            pad = 120; sh = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
            ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 26, pad + w, pad + h + 26], r, fill=(2, 10, 6, 165))
            sh.filter(ImageFilter.GaussianBlur(34)).save(out / f"{name}-{dev}-shadow.png")
            rim = Image.new("RGBA", (w, h), (0, 0, 0, 0)); rd = ImageDraw.Draw(rim)
            rd.rounded_rectangle([0, 0, w - 1, h - 1], r, outline=(255, 255, 255, 96), width=3)
            rd.rounded_rectangle([3, 3, w - 4, h - 4], r - 3, outline=(0, 0, 0, 40), width=1)
            rim.save(out / f"{name}-{dev}-rim.png")

def backdrops():
    out = B / "back"; out.mkdir(parents=True, exist_ok=True)
    for sec, key in FILM["back"].items():
        im = Image.open(HERE / "img" / f"{key}.png").convert("RGB").resize((2112, 1188), Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(26))
        dark = Image.new("RGB", im.size, (6, 22, 15)); im = Image.blend(im, dark, 0.42 if sec != "console" else 0.18)
        vig = Image.new("L", im.size, 0); ImageDraw.Draw(vig).ellipse([-300, -260, 2412, 1448], fill=255)
        vig = vig.filter(ImageFilter.GaussianBlur(220)); im = Image.composite(im, Image.new("RGB", im.size, (3, 12, 8)), vig)
        if sec == "console":  # the paper hills read light; deepen them so white words sit on them
            im = Image.blend(im, Image.new("RGB", im.size, (10, 46, 32)), 0.45)
        im.save(out / f"{sec}.png")

def dust(frames=250):
    out = B / "dust"; out.mkdir(parents=True, exist_ok=True)
    if len(list(out.glob("*.png"))) == frames: return
    rnd = random.Random(200); parts = []
    for _ in range(64):
        parts.append({"x": rnd.uniform(0, W), "y": rnd.uniform(0, H), "r": rnd.uniform(1.5, 7.5), "vx": rnd.choice([-1, 1]) * rnd.uniform(4, 22),
                      "vy": -rnd.uniform(6, 26), "a": rnd.uniform(0.18, 0.55), "tw": rnd.choice([1, 2, 3]), "ph": rnd.uniform(0, 6.28)})
    for f in range(frames):
        t = f / 25; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        for p in parts:
            x = (p["x"] + p["vx"] * t) % (W + 60) - 30; y = (p["y"] + p["vy"] * t) % (H + 60) - 30
            a = p["a"] * (0.6 + 0.4 * math.sin(p["ph"] + 2 * math.pi * p["tw"] * t / 10))
            r = p["r"]; d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 226, 160, int(255 * a)))
        im.filter(ImageFilter.GaussianBlur(2.2)).save(out / f"{f:04d}.png")

def mark_draw(frames=30):
    out = B / "ov" / "mark"; out.mkdir(parents=True, exist_ok=True)
    for f in range(frames):
        u = f / (frames - 1); prog = min(1, u / 0.75); prog = 1 - (1 - prog) ** 3
        pin = max(0, (u - 0.72) / 0.28)
        mark(168, prog, pin).save(out / f"{f:03d}.png")

def main():
    ov = B / "ov"; ov.mkdir(parents=True, exist_ok=True)
    for o in FILM["overlays"]:
        res = KINDS[o["kind"]](o)
        if isinstance(res, list):
            for k, im in enumerate(res): im.save(ov / f"{o['id']}#{k}.png")
        else:
            res.save(ov / f"{o['id']}.png")
    card_assets(); backdrops(); dust(); mark_draw()
    print("overlays", len(FILM["overlays"]), "· cards, backdrops, dust, mark")

if __name__ == "__main__":
    main()
