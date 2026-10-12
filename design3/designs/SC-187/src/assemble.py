"""SC-187: the cut. Reads film.json and builds the film with ffmpeg: each segment rendered on its own (a Veo clip at its
speed, held on its last frame if the voice needs longer; one of the app's screens in a window or a phone over a blurred
keyframe, composed at 2x and panned, drifted or closed in on; a recorded interaction in the window; a diagram with a
slow drift), with its overlays (the pop-ups sliding in, the captions, lower thirds and callouts fading); the segments
chained through half-second crossfades; the voice-over's beats placed on the film's clock; the music ducked under the
voice; one loudness pass to -14 LUFS.

  uv run --with pillow --with numpy python assemble.py [--out ../media/smart-clearance-demo.mp4] [--only 3,4] [--draft]

Needs: the clips (src/clips/<name>.mp4, else media/<name>.mp4; r1-r4 are SC-154's finals; a missing clip falls back to its
keyframe with a slow push in), the keyframes (src/img/<key>.png, else img/<key>.webp), the app screens (src/screens/<shot>.png
and --full.png for a scroll, else screens/<shot>.webp), the recordings (src/clips/ui-*.mp4), the diagrams
(docs/architecture/<name>.webp), src/overlays/out/<id>.png (node overlays.mjs), the voice (src/vo/<voice>/*.wav) and
src/music.wav. Intermediates go to src/build/.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
FILM = json.loads((HERE / "film.json").read_text())
FPS, W, H, XF = FILM["fps"], FILM["width"], FILM["height"], FILM["xfade"]
S2 = 2  # the screens are composed at twice the film's size, so a close-in stays sharp
CLIPS, IMG, OVL = HERE / "clips", HERE / "img", HERE / "overlays" / "out"
SCREENS = Path(os.environ.get("FILM_SCREENS", HERE / "screens"))  # a stand-in folder while the captures are made
BUILD = Path(os.environ.get("FILM_BUILD", HERE / "build"))
TRACKED = {"clip": HERE.parent / "media", "img": HERE.parent / "img", "screen": HERE.parent / "screens"}
SC154 = {"r1-bay-dawn": "final-1-bay-dawn-v3", "r2-godown-noon": "final-2-godown-noon", "r3-yard-dusk": "final-3-yard-dusk-v2", "r4-office-dashboard": "final-4-office-dashboard"}
BUILD.mkdir(exist_ok=True)
FFMPEG = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y"]
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS)]
AENC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def find(kind: str, name: str) -> Path | None:
    if kind == "clip" and name in SC154:
        p = REPO / "design3/designs/SC-154/media" / f"{SC154[name]}.mp4"
        return p if p.exists() else None
    if kind == "clip" and name.startswith("ui-"):
        for ext in ("mp4", "webm"):
            p = CLIPS / f"{name}.{ext}"
            if p.exists():
                return p
        return None
    if kind == "diagram":
        p = REPO / "docs/architecture" / f"{name}.webp"
        return p if p.exists() else None
    local = {"clip": CLIPS / f"{name}.mp4", "img": IMG / f"{name}.png", "screen": SCREENS / f"{name}.png"}[kind]
    if local.exists():
        return local
    if kind == "img":
        # SC-158's keyframes stand in for the backdrops that name them (k14-office-dashboard)
        for d in (TRACKED["img"], REPO / "design3/designs/SC-158/img", REPO / "design3/designs/SC-154/img"):
            if (d / f"{name}.webp").exists():
                return d / f"{name}.webp"
        return None
    tracked = TRACKED[kind] / (f"{name}.mp4" if kind == "clip" else f"{name}.webp")
    return tracked if tracked.exists() else None


def run(cmd: list[str]) -> None:
    if os.environ.get("FILM_DEBUG"):
        print(" ".join(cmd), file=sys.stderr)
    r = subprocess.run(cmd, text=True, capture_output=True)
    if r.returncode:
        print(" ".join(cmd)[:4000], file=sys.stderr)
        print(r.stderr[-3000:], file=sys.stderr)
        raise SystemExit(f"ffmpeg failed ({r.returncode})")


def probe(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], text=True, capture_output=True).stdout.strip()
    return float(out or 0)


def silence(D: float) -> list[str]:
    return ["-f", "lavfi", "-t", str(D), "-i", "anullsrc=r=48000:cl=stereo"]


# ---- the backdrops ------------------------------------------------------------------------------------------------

def backdrops(key: str, name: str, scale: int = S2) -> tuple[Path, Path]:
    """the live scene behind a screen, sharp and then pulled out of focus as the window comes in"""
    src = find("img", key)
    if not src:
        raise SystemExit(f"no keyframe {key} for the backdrop of {name}")
    im = Image.open(src).convert("RGB").resize((W * scale, H * scale), Image.LANCZOS)
    sharp = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(2 * scale))).enhance(0.7)
    blur = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(24 * scale))).enhance(0.48)
    a, b = BUILD / f"{name}-bg0.png", BUILD / f"{name}-bg1.png"
    sharp.save(a)
    blur.save(b)
    return a, b


def sweep_plate(cw: int, ch: int, name: str) -> tuple[Path, int]:
    """a soft diagonal band of light that crosses the window once as it lands"""
    import numpy as np

    sw = 420 * S2
    xs = np.arange(sw)
    band = np.exp(-((xs - sw / 2) / (sw / 5)) ** 2)
    out = np.zeros((ch, sw + ch // 3), dtype=np.float32)
    for yy in range(ch):
        off = (ch - yy) // 3
        out[yy, off: off + sw] = band
    rgba = np.zeros((ch, out.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (out * 64).astype(np.uint8)
    path = BUILD / f"{name}-sweep.png"
    Image.fromarray(rgba, "RGBA").save(path)
    return path, out.shape[1]


def window_plates(phone: bool, shot_w: int, shot_h: int, name: str, url: str) -> dict:
    """the window's chrome at 2x as its own transparent plate: the shadow, the bar or the bezel, a hole where the screen
    shows through; and where the canvas and the screenshot sit on the 2x frame"""
    import numpy as np

    pad = 70 * S2
    if phone:
        h = 880 * S2
        scale = h / shot_h
        w = int(shot_w * scale)
        x0, y0 = 640 * S2, 40 * S2
        radius, bezel, bar = 54 * S2, 12 * S2, 0
    else:
        w = 1500 * S2
        scale = w / shot_w
        h = int(min(shot_h, 940 * S2 / scale) * scale)  # a tall page shows its top; a scroll moves it
        x0, y0 = W * S2 - w - 110 * S2, 70 * S2
        radius, bezel, bar = 16 * S2, 0, 40 * S2
    cw, ch = w + 2 * bezel + 2 * pad, h + bar + 2 * bezel + 2 * pad
    sx, sy = pad + bezel, pad + bezel + bar
    plate = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    sh = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([sx - bezel - 4 * S2, sy - bar - bezel + 28 * S2, sx + w + bezel + 4 * S2, sy + h + bezel + 40 * S2], radius=radius + 8 * S2, fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(30 * S2))
    plate.alpha_composite(sh)
    d = ImageDraw.Draw(plate)
    if phone:
        d.rounded_rectangle([sx - bezel, sy - bezel, sx + w + bezel, sy + h + bezel], radius=radius + bezel, fill=(16, 20, 18, 255))
    else:
        d.rounded_rectangle([sx - 1, sy - bar - 1, sx + w + 1, sy + h + 1], radius=radius, fill=(236, 240, 238, 255))
        for i, c in enumerate(((255, 95, 87), (255, 189, 46), (40, 201, 64))):
            d.ellipse([sx + (16 + i * 22) * S2, sy - bar + 13 * S2, sx + (30 + i * 22) * S2, sy - bar + 27 * S2], fill=c)
        d.rounded_rectangle([sx + 100 * S2, sy - bar + 8 * S2, sx + w - 100 * S2, sy - 8 * S2], radius=9 * S2, fill=(255, 255, 255, 255))
        try:
            from PIL import ImageFont
            font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 17 * S2)
        except Exception:
            font = None
        d.text((sx + w / 2, sy - bar / 2), url, fill=(90, 100, 95, 255), font=font, anchor="mm")
    hole = Image.new("L", (cw, ch), 255)
    if phone:
        ImageDraw.Draw(hole).rounded_rectangle([sx, sy, sx + w, sy + h], radius=radius, fill=0)
    else:
        inner = Image.new("L", (cw, ch), 255)
        ImageDraw.Draw(inner).rounded_rectangle([sx, sy - bar, sx + w, sy + h], radius=radius, fill=0)
        body = Image.new("L", (cw, ch), 255)
        ImageDraw.Draw(body).rectangle([sx, sy, sx + w, sy + h], fill=0)
        hole = Image.fromarray(np.maximum(np.array(inner), np.array(body)))
    r, g, b, a = plate.split()
    plate = Image.merge("RGBA", (r, g, b, Image.fromarray(np.minimum(np.array(a), np.array(hole)))))
    path = BUILD / f"{name}-chrome.png"
    plate.save(path)
    return {"chrome": path, "cw": cw, "ch": ch, "sx": sx, "sy": sy, "w": w, "h": h, "scale": scale,
            "cx": x0 - pad - bezel + cw / 2, "cy": y0 - bar - pad - bezel + ch / 2, "x0": x0, "y0": y0}


def url_for(seg: dict) -> str:
    shot = seg.get("shot") or seg.get("name") or ""
    if "console" in shot:
        return "smartclearance-console.web.app"
    if "demo" in shot:
        return "smartclearance-demo.web.app"
    return "munchly-smartclearance.web.app"


def focus_chain(seg: dict, p: dict, D: float, last: str) -> tuple[str, str]:
    """the 2x frame to the film's size: a close-in on a rectangle of the screenshot (in its own pixels) from 1.2 s,
    held, else a plain drift"""
    f = seg.get("focus")
    if f:
        fx, fy, fw, fh = f
        # the rectangle on the 2x frame, then on the film's frame
        rx = p["x0"] + fx * p["scale"]
        ry = p["y0"] + fy * p["scale"] - p.get("off", 0.0)
        rw, rh = fw * p["scale"], fh * p["scale"]
        z = min(W * S2 / (rw * 1.2), H * S2 / (rh * 1.2), 2.0)  # the rectangle fills about 80% of the frame; at 2x the 2x source is 1:1
        cx1, cy1 = (rx + rw / 2) / S2, (ry + rh / 2) / S2
        at, dur = seg.get("focusAt", 1.2), seg.get("focusFor", 1.4)
        ease = f"(1-cos(PI*min(1,max(0,(t-{at})/{dur}))))/2"
        zt = f"(1+({z}-1)*{ease})"
        # crop's size cannot follow t, so the frame is scaled by the zoom (scale may) and cropped at the film's size
        cx = f"({W / 2}+({cx1}-{W / 2})*{ease})*{zt}-{W / 2}"
        cy = f"({H / 2}+({cy1}-{H / 2})*{ease})*{zt}-{H / 2}"
        # crop's iw/ih are read once at configuration (the unscaled frame), so the clamp is written out from the zoom
        chain = (f";[{last}]scale=eval=frame:w='ceil({W}*{zt}/2)*2':h='ceil({H}*{zt}/2)*2':flags=lanczos,"
                 f"crop={W}:{H}:x='min(max(0,{cx}),{W}*{zt}-{W})':y='min(max(0,{cy}),{H}*{zt}-{H})'[z]")
        return chain, "z"
    zoom = seg.get("zoom", 1.0)
    if zoom > 1.0:
        chain = f";[{last}]scale=eval=frame:w='ceil(iw*(1+({zoom}-1)*t/{D})/2)*2':h=-1,crop={W * S2}:{H * S2}:'(iw-{W * S2})/2':'(ih-{H * S2})/2',scale={W}:{H}:flags=lanczos[z]"
        return chain, "z"
    return f";[{last}]scale={W}:{H}:flags=lanczos[z]", "z"


# ---- the app's screens in a window ---------------------------------------------------------------------------------

def render_screen(seg: dict, name: str, out: Path) -> None:
    shot_path = find("screen", seg["shot"])
    full_path = find("screen", seg["shot"] + "--full")
    if not shot_path:
        raise SystemExit(f"no screenshot {seg['shot']} in src/screens/ or screens/")
    shot = Image.open(shot_path).convert("RGB")
    scroll = seg.get("scroll") and full_path is not None
    use_full = (seg.get("scroll") or seg.get("focus")) and full_path is not None  # a focus rectangle is in the full page's pixels
    src = Image.open(full_path).convert("RGB") if use_full else shot
    D = seg["seconds"]
    bg0, bg1 = backdrops(seg["bg"], name)
    p = window_plates(seg.get("phone", False), shot.width, shot.height, name, url_for(seg))
    sw_, sh_ = int(src.width * p["scale"]), int(src.height * p["scale"])
    scaled = BUILD / f"{name}-shot.png"
    src.resize((sw_, sh_), Image.LANCZOS).save(scaled)
    sweep, sweep_w = sweep_plate(p["cw"], p["ch"], name)
    travel = max(0, sh_ - p["h"])
    off = 0.0
    if seg.get("focus"):
        fx, fy, fw, fh = seg["focus"]
        off = min(max(0.0, fy * p["scale"] + fh * p["scale"] / 2 - p["h"] / 2), float(travel))
        ypos = str(p["sy"] - off)
        scroll = False
    if scroll and travel:
        # the page scrolls as far as the segment allows, at a readable pace: about 300 film pixels a second at most
        reach = min(travel, 300 * S2 * max(0.5, D - 2.6))
        ypos = f"{p['sy']}-{reach}*(1-cos(PI*min(1,max(0,(t-1.3)/({D}-2.4)))))/2"
    elif not seg.get("focus"):
        ypos = str(p["sy"])
    enter = "(1-pow(1-min(1,t/0.6),3))"
    phone = seg.get("phone")
    p["off"] = off
    chain = (
        f"[0:v][1:v]blend=all_expr='A*(1-min(1,T/1.0))+B*min(1,T/1.0)'[bg];"
        f"color=c=black@0.0:s={p['w']}x{p['h']}:r={FPS}:d={D},format=rgba[hole];"
        f"[hole][2:v]overlay=x=0:y='({ypos})-{p['sy']}':format=auto[page];"
        f"color=c=black@0.0:s={p['cw']}x{p['ch']}:r={FPS}:d={D},format=rgba[cv];"
        f"[cv][page]overlay=x={p['sx']}:y={p['sy']}:format=auto[w1];"
        f"[w1][3:v]overlay=0:0:format=rgb[w2];"
        f"[w2][4:v]overlay=x='-{sweep_w}+({p['cw']}+{sweep_w})*min(1,max(0,(t-0.45)/1.1))':y=0:format=rgb:enable='between(t,0.45,1.6)'[w3];"
        f"[w3]format=rgba,scale=eval=frame:w='iw*(0.94+0.06*{enter})':h=-1,fade=t=in:st=0:d=0.5:alpha=1[w4];"
        f"[bg][w4]overlay=x='{p['cx']}-w/2':y='{p['cy']}-h/2+{(90 if phone else 40) * S2}*(1-{enter})':format=auto[b]"
    )
    chain2, last = focus_chain(seg, p, D, "b")
    chain += chain2
    cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg0),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg1),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(scaled),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(p["chrome"]),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(sweep)] + silence(D)
    chain, last = add_overlays(seg, chain, last, D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", "5:a", "-t", str(D)] + ENC + AENC + [str(out)]
    run(cmd)


def render_video(seg: dict, name: str, out: Path) -> None:
    """a recorded interaction in the window (the recording's own size sets the window), else its fallback screenshot"""
    src = find("clip", seg["name"])
    if not src:
        print(f"   (no recording {seg['name']}: its fallback screen stands in)")
        seg = {**seg, "kind": "screen", "shot": seg["fallback"], "scroll": False}
        return render_screen(seg, name, out)
    D = seg["seconds"]
    speed = seg.get("speed", 1.0)
    seek = seg.get("seek", 0.0)  # where in the recording the segment starts
    wh = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(src)], text=True, capture_output=True).stdout.strip().split(",")
    vw, vh = int(wh[0]), int(wh[1])
    bg0, bg1 = backdrops(seg["bg"], name)
    p = window_plates(seg.get("phone", False), vw, vh, name, url_for(seg))
    sweep, sweep_w = sweep_plate(p["cw"], p["ch"], name)
    enter = "(1-pow(1-min(1,t/0.6),3))"
    phone = seg.get("phone")
    chain = (
        f"[0:v][1:v]blend=all_expr='A*(1-min(1,T/1.0))+B*min(1,T/1.0)'[bg];"
        f"[2:v]setpts=PTS/{speed},fps={FPS},scale={p['w']}:{p['h']}:flags=lanczos,tpad=stop_mode=clone:stop_duration={D}[rec];"
        f"color=c=black@0.0:s={p['cw']}x{p['ch']}:r={FPS}:d={D},format=rgba[cv];"
        f"[cv][rec]overlay=x={p['sx']}:y={p['sy']}:format=rgb:eof_action=pass[w1];"
        f"[w1][3:v]overlay=0:0:format=rgb[w2];"
        f"[w2][4:v]overlay=x='-{sweep_w}+({p['cw']}+{sweep_w})*min(1,max(0,(t-0.45)/1.1))':y=0:format=rgb:enable='between(t,0.45,1.6)'[w3];"
        f"[w3]format=rgba,scale=eval=frame:w='iw*(0.94+0.06*{enter})':h=-1,fade=t=in:st=0:d=0.5:alpha=1[w4];"
        f"[bg][w4]overlay=x='{p['cx']}-w/2':y='{p['cy']}-h/2+{(90 if phone else 40) * S2}*(1-{enter})':format=auto[b]"
    )
    chain2, last = focus_chain(seg, p, D, "b")
    chain += chain2
    cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg0),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg1),
                    "-ss", str(seek), "-i", str(src),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(p["chrome"]),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(sweep)] + silence(D)
    chain, last = add_overlays(seg, chain, last, D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", "5:a", "-t", str(D)] + ENC + AENC + [str(out)]
    run(cmd)


# ---- the clips and the stills -------------------------------------------------------------------------------------

def render_clip(seg: dict, name: str, out: Path) -> None:
    src = find("clip", seg["name"])
    speed = seg.get("speed", 1.0)
    D = seg["seconds"]
    hold = seg.get("hold", 0)
    if src:
        chain = (f"[0:v]scale={W}:{H}:flags=lanczos,setpts=PTS/{speed},fps={FPS},tpad=stop_mode=clone:stop_duration={D}[v0]")
        cmd = FFMPEG + ["-i", str(src)] + silence(D)
        last, amap = "v0", "1:a"
        print(f"   clip {seg['name']}: {probe(src):.1f} s at {speed} -> {D:.1f} s" + (f" (held {hold:.1f} s)" if hold > 0.05 else ""))
    else:
        key = find("img", seg["key"])
        if not key:
            raise SystemExit(f"no clip and no keyframe for {seg['name']}")
        cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(key)] + silence(D)
        chain = f"[0:v]scale={W * 2}:{H * 2}:flags=lanczos,zoompan=z='1+0.08*on/({D * FPS})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(D * FPS)}:s={W}x{H}:fps={FPS}[v0]"
        last, amap = "v0", "1:a"
        print(f"   clip {seg['name']}: keyframe stand-in ({D:.1f} s)")
    chain, last = add_overlays(seg, chain, last, D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", amap, "-t", str(D)] + ENC + AENC + [str(out)]
    run(cmd)


def render_still(seg: dict, name: str, out: Path) -> None:
    """a diagram, full frame on a dark ground, with a slow drift"""
    src = find("diagram", seg["name"]) or find("img", seg["name"])
    if not src:
        raise SystemExit(f"no diagram {seg['name']}")
    D = seg["seconds"]
    im = Image.open(src).convert("RGB")
    # on the design system's dark ground, the diagram fitted with a margin
    ground = Image.new("RGB", (W * 2, H * 2), (16, 22, 19))
    fit = min((W * 2 - 240) / im.width, (H * 2 - 420) / im.height)
    im2 = im.resize((int(im.width * fit), int(im.height * fit)), Image.LANCZOS)
    card = Image.new("RGB", (im2.width + 48, im2.height + 48), (255, 255, 255))
    card.paste(im2, (24, 24))
    ground.paste(card, ((W * 2 - card.width) // 2, (H * 2 - card.height) // 2 - 80))
    plate = BUILD / f"{name}-plate.png"
    ground.save(plate)
    zoom = seg.get("zoom", 1.08)
    ay = seg.get("anchor", 0.5)  # where the drift closes in: a fraction of the height
    cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(plate)] + silence(D)
    ease = f"(1-cos(PI*min(1,t/{D})))/2"
    chain = (f"[0:v]scale=eval=frame:w='ceil(iw*(1+({zoom}-1)*{ease})/2)*2':h=-1,"
             f"crop={W * 2}:{H * 2}:'(iw-{W * 2})/2':'min(ih-{H * 2},max(0,ih*{ay}-{H * 2 * ay}))',scale={W}:{H}:flags=lanczos[v0]")
    chain, last = add_overlays(seg, chain, "v0", D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", "1:a", "-t", str(D)] + ENC + AENC + [str(out)]
    run(cmd)


# ---- the overlays ---------------------------------------------------------------------------------------------------

def add_overlays(seg: dict, chain: str, last: str, D: float, cmd: list[str]) -> tuple[str, str]:
    """appends each overlay of the segment as a looped PNG input with its fade (and a slide for a pop-up)"""
    items = []
    if seg.get("chapter"):
        items.append({"id": seg["chapter"], "at": 0.0, "until": D, "slide": False, "fade": 0.4})
    for o in seg.get("overlays", []):
        items.append({"id": o["id"], "at": o["at"], "until": min(o["until"], D), "slide": o.get("slide", False), "fade": 0.35})
    for it in items:
        png = OVL / f"{it['id']}.png"
        if not png.exists():
            print(f"   (no overlay {it['id']})")
            continue
        idx = sum(1 for a in cmd if a == "-i")
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(png)]
        a, b, f = it["at"], it["until"], it["fade"]
        lab = f"o{idx}"
        chain += f";[{idx}:v]format=rgba,fade=t=in:st={a}:d={f}:alpha=1,fade=t=out:st={max(a, b - f)}:d={f}:alpha=1[{lab}]"
        ypos = f"'-70*(1-(1-cos(PI*min(1,max(0,(t-{a})/0.5))))/2)'" if it["slide"] else "0"
        chain += f";[{last}][{lab}]overlay=x=0:y={ypos}:enable='between(t,{a},{b})':format=auto[{lab}v]"
        last = f"{lab}v"
    return chain, last


# ---- the cut --------------------------------------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=str(HERE.parent / "media" / "smart-clearance-demo.mp4"))
    p.add_argument("--only", help="segment numbers to re-render, comma-separated (the rest are reused)")
    p.add_argument("--draft", action="store_true", help="faster encode")
    p.add_argument("--no-music", action="store_true")
    p.add_argument("--no-vo", action="store_true")
    p.add_argument("--no-concat", action="store_true", help="render the segments only")
    p.add_argument("--lufs", type=float, default=-14.0)
    a = p.parse_args()
    if a.draft:
        ENC[ENC.index("-preset") + 1] = "veryfast"
        ENC[ENC.index("-crf") + 1] = "23"
    only = {int(x) for x in a.only.split(",")} if a.only else None
    segs = FILM["segments"]
    parts: list[Path] = []
    for i, seg in enumerate(segs):
        name = f"seg-{i:02d}"
        out = BUILD / f"{name}.mp4"
        parts.append(out)
        if only is not None and i not in only and out.exists():
            continue
        print(f"{name}: {seg['kind']} {seg.get('name') or seg.get('shot')} ({seg['seconds']:.1f} s)")
        {"clip": render_clip, "screen": render_screen, "video": render_video, "still": render_still}[seg["kind"]](seg, name, out)
    if a.no_concat:
        return
    durs = [probe(x) for x in parts]
    total = sum(durs) - XF * (len(parts) - 1)
    print(f"{len(parts)} segments, {total:.1f} s ({total/60:.2f} min)")

    cmd = FFMPEG[:]
    for x in parts:
        cmd += ["-i", str(x)]
    chain, cum = "", durs[0]
    vprev = "0:v"
    for i in range(1, len(parts)):
        off = cum - XF
        both = segs[i - 1]["kind"] in ("screen", "video") and segs[i]["kind"] in ("screen", "video")
        kind = ("smoothleft" if i % 2 else "smoothup") if both else "fade"
        chain += f"[{vprev}][{i}:v]xfade=transition={kind}:duration={XF}:offset={off:.3f}[v{i}];"
        vprev = f"v{i}"
        cum += durs[i] - XF
    n = len(parts)
    # the voice: every beat at its moment on the film's clock
    alabels = []
    if not a.no_vo:
        for b in FILM["vo"]:
            f = HERE / b["file"]
            if not f.exists():
                print(f"   (no voice file {b['file']})")
                continue
            idx = sum(1 for x in cmd if x == "-i")
            cmd += ["-i", str(f)]
            chain += f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(b['at'] * 1000)}|{int(b['at'] * 1000)}[vo{idx}];"
            alabels.append(f"[vo{idx}]")
    if alabels:
        chain += "".join(alabels) + f"amix=inputs={len(alabels)}:duration=longest:normalize=0,apad=whole_dur={total:.2f}[voice];"
    music = Path(os.environ.get("FILM_MUSIC", HERE / ("bed.wav" if (HERE / "bed.wav").exists() else "music.wav")))
    if music.exists() and not a.no_music:
        idx = sum(1 for x in cmd if x == "-i")
        cmd += ["-i", str(music)]
        chain += f"[{idx}:a]aresample=48000,atrim=0:{total:.2f},apad=whole_dur={total:.2f},volume=0.9[mus0];"
        if alabels:
            # the music ducks under the voice: the voice drives a compressor on the music
            chain += "[voice]asplit=2[vk][vm];[mus0][vk]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=600:makeup=1[musd];[vm][musd]amix=inputs=2:duration=first:normalize=0[mix];"
        else:
            chain += "[mus0]anull[mix];"
    elif alabels:
        chain += "[voice]anull[mix];"
    else:
        chain += f"anullsrc=r=48000:cl=stereo:d={total:.2f}[mix];"
    chain += f"[mix]loudnorm=I={a.lufs}:TP=-1.5:LRA=11[aout];[{vprev}]format=yuv420p[vout]"
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd += ["-filter_complex", chain, "-map", "[vout]", "-map", "[aout]", "-t", f"{total:.3f}", "-movflags", "+faststart"] + ENC + AENC + [str(out)]
    run(cmd)
    print(f"wrote {out} ({probe(out):.1f} s, {out.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
