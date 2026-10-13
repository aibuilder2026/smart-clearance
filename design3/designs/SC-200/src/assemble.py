"""SC-200: the cut, in ffmpeg.

Each shot of film.json renders to build/seg/NN-<hash>.mp4 at 1920 x 1080, 25 fps, as long as the shot plus the next
shot's dissolve; a file whose shot is unchanged is reused. Then the segments are chained with xfade at their absolute
starts, and the sound (voice-over, music bed with ducking, whooshes) from mix.py is laid under it.

- an LTX clip: retimed (motion-interpolated when slowed), upscaled, a slow camera push, graded, grain;
- a recording: the devices cropped from the 2560 x 1440 stage, each a floating screen with rounded corners, a shadow
  and a rim over the section's blurred plate and drifting dust; inside each screen the camera zooms and pans to what
  the voice names (scale by the zoom, then a fixed crop at the eased point);
- a title: the plate, the dust and the words.

  .venv-tools/bin/python assemble.py [--only N …] [--preview]   (--preview: 960 x 540 draft of the whole film)
"""
import hashlib, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
B = HERE / "build"
FILM = json.loads((HERE / "film.json").read_text())
FPS, W, H = FILM["fps"], FILM["width"], FILM["height"]
SHOTS = FILM["shots"]
SEG = B / "seg"; SEG.mkdir(parents=True, exist_ok=True)
GRADE = {
    "warm": "eq=contrast=1.05:saturation=1.07:gamma=0.98,colorbalance=rs=0.02:bs=-0.025:rh=0.025:bh=-0.03",
    "muted": "eq=contrast=1.05:saturation=0.88:gamma=0.99,colorbalance=bs=0.01",
    "cool": "eq=contrast=1.06:saturation=1.0:gamma=0.98,colorbalance=bs=0.03:bm=0.015",
}

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.stderr.write(r.stderr[-4000:]); raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])} …")

def ease(u):  # smoothstep of an expression already clamped to 0..1
    return f"(({u})*({u})*(3-2*({u})))"

def keyed(keys, idx):
    """An ffmpeg expression in t for one channel of camera keyframes [(t, z, x, y)], eased between keys."""
    if len(keys) == 1: return f"{keys[0][idx]}"
    expr = f"{keys[-1][idx]}"
    for (t0, *v0), (t1, *v1) in reversed(list(zip(keys, keys[1:]))):
        a, b = v0[idx - 1], v1[idx - 1]
        u = f"min(1,max(0,(t-{t0})/{max(0.01, t1 - t0)}))"
        expr = f"if(lt(t,{t1}),{a}+({b}-{a})*{ease(u)},{expr})"
    return f"if(lt(t,{keys[0][0]}),{keys[0][idx]},{expr})"

def card_size(dev, w):
    dw, dh = FILM["dev"][dev][2], FILM["dev"][dev][3]
    return round(w / 2) * 2, round(w * dh / dw / 2) * 2

class Graph:
    def __init__(self, L):
        self.L, self.inputs, self.chain, self.n = L, [], [], 0
    def inp(self, *args):
        self.inputs += list(args); self.n += 1; return self.n - 1
    def still(self, path):
        return self.inp("-loop", "1", "-framerate", str(FPS), "-t", f"{self.L:.3f}", "-i", str(path))
    def add(self, s):
        self.chain.append(s)

def overlays(g, s, base):
    """Lay the shot's overlays on [base], each fading in (and out) where it starts (and ends) inside the shot."""
    L = g.L
    for k, o in enumerate(s["ov"]):
        f, t2 = o["from"], min(o["to"], L)
        if t2 - f < 0.2: continue
        if o["id"] == "title":  # the mark draws its route, then holds, beside the wordmark
            xy = json.loads((B / "ov" / "title.json").read_text())["mark"]
            mi = g.inp("-framerate", str(FPS), "-i", str(B / "ov" / "mark" / "%03d.png"))
            g.add(f"[{mi}:v]format=rgba,tpad=stop_mode=clone:stop_duration={L:.3f},setpts=PTS+{f:.3f}/TB,"
                  f"fade=t=in:st={f:.3f}:d=0.25:alpha=1"
                  + (f",fade=t=out:st={t2 - 0.45:.3f}:d=0.45:alpha=1" if t2 < L - 0.05 else "") + f"[mk{k}]")
            g.add(f"[{base}][mk{k}]overlay={xy[0]}:{xy[1]}:eof_action=pass[b{k}m]"); base = f"b{k}m"
        i = g.still(B / "ov" / f"{o['id']}.png")
        fx = "format=rgba"
        if f > 0.05: fx += f",fade=t=in:st={f:.3f}:d=0.45:alpha=1"
        if t2 < L - 0.05: fx += f",fade=t=out:st={max(f, t2 - 0.4):.3f}:d=0.4:alpha=1"
        g.add(f"[{i}:v]{fx}[o{k}]")
        y = f"'18*pow(1-min(1,max(0,(t-{f:.3f})/0.6)),2)'" if f > 0.05 else "0"
        g.add(f"[{base}][o{k}]overlay=0:{y}:eval=frame[b{k}]"); base = f"b{k}"
    return base

def backdrop(g, sec, T0):
    """The section's blurred plate, drifting slowly (continuous across shots: driven by the film's clock), with dust."""
    bi = g.still(B / "back" / f"{sec}.png")
    start = int(T0 * FPS) % 250
    di = g.inp("-stream_loop", "-1", "-framerate", str(FPS), "-start_number", str(start), "-i", str(B / "dust" / "%04d.png"))
    g.add(f"[{bi}:v]crop={W}:{H}:x='96+80*sin(2*PI*({T0:.3f}+t)/47)':y='54+40*cos(2*PI*({T0:.3f}+t)/61)',format=rgba[bg0]")
    g.add(f"[{di}:v]format=rgba,colorchannelmixer=aa=0.75,trim=duration={g.L:.3f},setpts=PTS-STARTPTS[dust]")
    g.add("[bg0][dust]overlay=0:0:shortest=0[bg]")
    return "bg"

KEY = {"l01-hourglass": "g01-hourglass", "l02-pages": "g02-calendar-aisle", "l03-landfill": "g03-landfill", "l04-town": "g04-town-network",
       "l06-mango": "g06w-mango", "l07-chips": "g07w-chips", "l08-sunrise": "g08-town-sunrise"}

def clip_src(s):
    p = HERE / "clips" / f"{s['clip']}.mp4"
    return p if p.exists() else HERE / "img" / f"{KEY[s['clip']]}.png"

def shot_clip(g, s):
    L, sp = g.L, s["speed"]
    src = clip_src(s)
    if src.suffix == ".png":  # the clip is still rendering: its keyframe, with the same camera
        ci = g.still(src); interp = ""; sp = 1.0
    else:
        ci = g.inp("-ss", f"{s['seek']:.3f}", "-i", str(src))
        interp = f"minterpolate=fps={24 / sp:.3f}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1," if sp < 0.85 else ""
    z0, z1 = s["zoom"]; fx, fy = s["focus"]
    zt = f"({z0}+({z1}-{z0})*{ease(f'min(1,t/{L:.3f})')})"
    g.add(f"[{ci}:v]setpts=PTS-STARTPTS,{interp}setpts=PTS/{sp},fps={FPS},"
          f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},"
          f"tpad=stop_mode=clone:stop_duration={L:.3f},trim=duration={L:.3f},setpts=PTS-STARTPTS,"
          f"scale=eval=frame:w='ceil({W}*{zt}/2)*2':h='ceil({H}*{zt}/2)*2':flags=lanczos,"
          f"crop={W}:{H}:x='({W}*{zt}-{W})*{fx}':y='({H}*{zt}-{H})*{fy}',unsharp=5:5:0.55,"
          f"{GRADE[s.get('grade', 'warm')]},vignette=angle=PI/5,noise=alls=4:allf=t,format=rgba[base]")
    return "base"

def shot_screen(g, s):
    L, sp = g.L, s["speed"]
    base = backdrop(g, s["back"], s["start"])
    si = g.inp("-ss", f"{s['t0']:.3f}", "-t", f"{L * sp + 1:.3f}", "-i", FILM["src"][s["src"]])
    devs = list(FILM["layout"][s["layout"]].items())
    g.add(f"[{si}:v]setpts=(PTS-STARTPTS)/{sp},fps={FPS},tpad=stop_mode=clone:stop_duration={L:.3f},trim=duration={L:.3f},"
          f"setpts=PTS-STARTPTS,split={len(devs)}" + "".join(f"[s{k}]" for k in range(len(devs))))
    enter = s.get("enter")
    rise = "(36*pow(1-min(1,t/0.8),3))" if enter else "0"
    for k, (dev, (X, Y, w)) in enumerate(devs):
        cw, ch = card_size(dev, w)
        dx, dy, dw, dh = FILM["dev"][dev]
        keys = s["cams"].get(dev, [[0, 1.0, 0.5, 0.5]])
        Z, RX, RY = keyed(keys, 1), keyed(keys, 2), keyed(keys, 3)
        g.add(f"[s{k}]crop={dw}:{dh}:{dx}:{dy},"
              f"scale=eval=frame:w='ceil({cw}*({Z})/2)*2':h='ceil({ch}*({Z})/2)*2':flags=lanczos,"
              f"crop={cw}:{ch}:x='min(max(0,({RX})*{cw}*({Z})-{cw}/2),{cw}*({Z})-{cw})':"
              f"y='min(max(0,({RY})*{ch}*({Z})-{ch}/2),{ch}*({Z})-{ch})',format=rgba[c{k}]")
        name = f"{s['layout']}-{dev}"
        mi, shi, ri = g.still(B / "card" / f"{name}-mask.png"), g.still(B / "card" / f"{name}-shadow.png"), g.still(B / "card" / f"{name}-rim.png")
        fade = ",fade=t=in:st=0:d=0.55:alpha=1" if enter else ""
        g.add(f"[{mi}:v]format=gray[m{k}];[c{k}][m{k}]alphamerge{fade}[ca{k}]")
        g.add(f"[{shi}:v]format=rgba{fade}[sh{k}];[{ri}:v]format=rgba{fade}[r{k}]")
        g.add(f"[{base}][sh{k}]overlay={X - 120}:y='{Y - 120}+{rise}':eval=frame[q{k}a];"
              f"[q{k}a][ca{k}]overlay={X}:y='{Y}+{rise}':eval=frame[q{k}b];"
              f"[q{k}b][r{k}]overlay={X}:y='{Y}+{rise}':eval=frame[q{k}c]")
        base = f"q{k}c"
    return base

def shot_title(g, s):
    return backdrop(g, s["back"], s["start"])

def render(i, preview=False):
    s = SHOTS[i]
    nxt = SHOTS[i + 1]["xf"] if i + 1 < len(SHOTS) else 0.0
    L = round(s["dur"] + nxt, 3)
    srcs = [str(clip_src(s))] if s["type"] == "clip" else []
    key = hashlib.sha1(json.dumps([s, L, preview, 3, srcs], sort_keys=True).encode()).hexdigest()[:10]
    out = SEG / f"{s['n']:02d}-{key}.mp4"
    if out.exists(): return out, L
    for old in SEG.glob(f"{s['n']:02d}-*.mp4"): old.unlink()
    g = Graph(L)
    base = {"clip": shot_clip, "screen": shot_screen, "title": shot_title}[s["type"]](g, s)
    base = overlays(g, s, base)
    if i == len(SHOTS) - 1:
        g.add(f"[{base}]fade=t=out:st={L - 1.6:.3f}:d=1.6[fo]"); base = "fo"
    if i == 0:
        g.add(f"[{base}]fade=t=in:st=0:d=1.2[fi]"); base = "fi"
    size = "scale=960:540," if preview else ""
    g.add(f"[{base}]{size}format=yuv420p,trim=duration={L:.3f}[vout]")
    cmd = ["ffmpeg", "-v", "error", "-y", *g.inputs, "-filter_complex", ";".join(g.chain), "-map", "[vout]",
           "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast" if preview else "medium", "-crf", "20" if preview else "14",
           "-pix_fmt", "yuv420p", "-an", str(out)]
    run(cmd)
    return out, L

def chain(parts, out, preview=False):
    inputs, fc, prev = [], [], "0:v"
    for p, _ in parts: inputs += ["-i", str(p)]
    for i in range(1, len(parts)):
        s = SHOTS[i]
        fc.append(f"[{prev}][{i}:v]xfade=transition={s['kind']}:duration={s['xf']}:offset={s['start']:.3f}[x{i}]"); prev = f"x{i}"
    fc.append(f"[{prev}]format=yuv420p[v]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[v]", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "veryfast" if preview else "slow", "-crf", "20" if preview else "17", "-pix_fmt", "yuv420p", str(out)])

def main():
    args = sys.argv[1:]; preview = "--preview" in args
    only = {int(a) for a in args if a.isdigit()}
    parts = []
    for i, s in enumerate(SHOTS):
        if only and s["n"] not in only:
            parts.append((None, None)); continue
        p, L = render(i, preview); parts.append((p, L)); print(f"seg {s['n']:2} {L:6.2f}s {p.name}", flush=True)
    if only: return
    out = B / ("film-preview-silent.mp4" if preview else "film-silent.mp4")
    chain(parts, out, preview); print("chained", out)

if __name__ == "__main__":
    main()
