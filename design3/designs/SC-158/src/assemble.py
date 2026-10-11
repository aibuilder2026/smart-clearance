"""SC-158: the cut. Reads film.json and builds the film with ffmpeg: each segment rendered on its own (an LTX clip
upscaled to 1080p and slowed a little, or one of the app's screens in a window or a phone over a blurred keyframe,
scrolling or zooming), with its overlays (the pop-ups sliding in, the captions and chapter labels fading); the
segments chained through half-second crossfades; the clips' own ambience under the music; one loudness pass.

  uv run --with pillow python assemble.py [--out ../media/mango-drink-demo.mp4] [--only 3,4] [--draft]

Needs: src/clips/<name>.mp4 (a missing clip falls back to its keyframe with a slow push in), src/img/<key>.png,
src/screens/<shot>.png (and --full.png for a scroll), src/overlays/out/<id>.png (node overlays.mjs), src/music.wav
(music.py). Intermediates go to src/build/.
"""

import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

HERE = Path(__file__).resolve().parent
FILM = json.loads((HERE / "film.json").read_text())
FPS, W, H, XF = FILM["fps"], FILM["width"], FILM["height"], FILM["xfade"]
CLIPS, IMG, SCREENS, OVL, BUILD = HERE / "clips", HERE / "img", HERE / "screens", HERE / "overlays" / "out", HERE / "build"
BUILD.mkdir(exist_ok=True)
FFMPEG = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y"]
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def run(cmd: list[str]) -> None:
    if os.environ.get("FILM_DEBUG"):
        print(" ".join(cmd), file=sys.stderr)
    r = subprocess.run(cmd, text=True, capture_output=True)
    if r.returncode:
        print(" ".join(cmd)[:3000], file=sys.stderr)
        print(r.stderr[-3000:], file=sys.stderr)
        raise SystemExit(f"ffmpeg failed ({r.returncode})")


def duration(seg: dict) -> float:
    if seg["kind"] == "clip":
        return seg["seconds"] / seg.get("speed", 1) + seg.get("hold", 0)
    return seg["seconds"]


def probe(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], text=True, capture_output=True).stdout.strip()
    return float(out or 0)


# ---- the app's screens in a window ----------------------------------------------------------------------------------

def backdrops(key: str, name: str) -> tuple[Path, Path]:
    """the live scene behind a screen, sharp and then pulled out of focus as the window comes in"""
    im = Image.open(IMG / f"{key}.png").convert("RGB").resize((W, H), Image.LANCZOS)
    sharp = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(2))).enhance(0.72)
    blur = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(26))).enhance(0.5)
    a, b = BUILD / f"{name}-bg0.png", BUILD / f"{name}-bg1.png"
    sharp.save(a)
    blur.save(b)
    return a, b


def sweep_plate(cw: int, ch: int, name: str) -> tuple[Path, int]:
    """a soft diagonal band of light that crosses the window once as it lands"""
    import numpy as np

    sw = 420
    xs = np.arange(sw)
    band = np.exp(-((xs - sw / 2) / (sw / 5)) ** 2)
    alpha = np.tile(band, (ch, 1))
    # shear it: each row shifts with its height
    out = np.zeros((ch, sw + ch // 3), dtype=np.float32)
    for yy in range(ch):
        off = (ch - yy) // 3
        out[yy, off : off + sw] = alpha[yy]
    rgba = np.zeros((ch, out.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (out * 70).astype(np.uint8)
    path = BUILD / f"{name}-sweep.png"
    Image.fromarray(rgba, "RGBA").save(path)
    return path, out.shape[1]


def window_plates(seg: dict, shot: Image.Image, name: str) -> dict:
    """the window's chrome as its own transparent plate (the shadow, the bar or the bezel, a hole where the screen shows
    through) on a canvas with room for the shadow, and where the canvas and the screenshot sit"""
    pad = 70
    if seg.get("phone"):
        scale = 850 / shot.height
        w, h = int(shot.width * scale), 850
        x0, y0 = 620, 44  # high and left of centre: neither a pop-up at the top right nor the caption covers it
        radius, bezel, bar = 52, 12, 0
    else:
        scale = 1344 / shot.width
        w, h = 1344, int(min(shot.height, 1000) * scale)
        x0, y0 = W - w - 150, 76  # right of the chapter label
        radius, bezel, bar = 16, 0, 40
    cw, ch = w + 2 * bezel + 2 * pad, h + bar + 2 * bezel + 2 * pad
    sx, sy = pad + bezel, pad + bezel + bar  # the screenshot's place on the canvas
    plate = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    sh = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([sx - bezel - 4, sy - bar - bezel + 28, sx + w + bezel + 4, sy + h + bezel + 40], radius=radius + 8, fill=(0, 0, 0, 165))
    sh = sh.filter(ImageFilter.GaussianBlur(30))
    plate.alpha_composite(sh)
    d = ImageDraw.Draw(plate)
    if seg.get("phone"):
        d.rounded_rectangle([sx - bezel, sy - bezel, sx + w + bezel, sy + h + bezel], radius=radius + bezel, fill=(18, 22, 20, 255))
    else:
        d.rounded_rectangle([sx - 1, sy - bar - 1, sx + w + 1, sy + h + 1], radius=radius, fill=(236, 240, 238, 255))
        for i, c in enumerate(((255, 95, 87), (255, 189, 46), (40, 201, 64))):
            d.ellipse([sx + 16 + i * 22, sy - bar + 13, sx + 30 + i * 22, sy - bar + 27], fill=c)
        d.rounded_rectangle([sx + 100, sy - bar + 8, sx + w - 100, sy - 8], radius=9, fill=(255, 255, 255, 255))
        url = seg.get("url") or ("smartclearance-console.web.app" if seg["shot"].startswith("console") else "munchly-smartclearance.web.app")
        try:
            from PIL import ImageFont
            font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 17)
        except Exception:
            font = None
        d.text((sx + w / 2, sy - bar / 2), url, fill=(90, 100, 95, 255), font=font, anchor="mm")
    # the hole: alpha 0 where the screen shows through
    import numpy as np

    hole = Image.new("L", (cw, ch), 255)
    if seg.get("phone"):
        ImageDraw.Draw(hole).rounded_rectangle([sx, sy, sx + w, sy + h], radius=radius, fill=0)
    else:
        inner = Image.new("L", (cw, ch), 255)
        ImageDraw.Draw(inner).rounded_rectangle([sx, sy - bar, sx + w, sy + h], radius=radius, fill=0)  # the window's outline
        body = Image.new("L", (cw, ch), 255)
        ImageDraw.Draw(body).rectangle([sx, sy, sx + w, sy + h], fill=0)  # below the bar
        hole = Image.fromarray(np.maximum(np.array(inner), np.array(body)))
    r, g, b, a = plate.split()
    plate = Image.merge("RGBA", (r, g, b, Image.fromarray(np.minimum(np.array(a), np.array(hole)))))
    path = BUILD / f"{name}-chrome.png"
    plate.save(path)
    return {"chrome": path, "cw": cw, "ch": ch, "sx": sx, "sy": sy, "w": w, "h": h, "scale": scale,
            "cx": x0 - pad - bezel + cw / 2, "cy": y0 - bar - pad - bezel + ch / 2}


def render_screen(seg: dict, name: str, out: Path) -> None:
    shot_path = SCREENS / f"{seg['shot']}.png"
    full_path = SCREENS / f"{seg['shot']}--full.png"
    if not shot_path.exists():
        raise SystemExit(f"no screenshot {shot_path.name}")
    shot = Image.open(shot_path)
    scroll = seg.get("scroll") and full_path.exists()
    src = Image.open(full_path) if scroll else shot
    D = seg["seconds"]
    bg0, bg1 = backdrops(seg["bg"], name)
    p = window_plates(seg, shot, name)
    sw_, sh_ = int(src.width * p["scale"]), int(src.height * p["scale"])
    scaled = BUILD / f"{name}-shot.png"
    src.convert("RGB").resize((sw_, sh_), Image.LANCZOS).save(scaled)
    sweep, sweep_w = sweep_plate(p["cw"], p["ch"], name)
    travel = max(0, sh_ - p["h"])
    scroll_ease = f"(1-cos(PI*min(1,max(0,(t-1.3)/({D}-2.4)))))/2"
    ypos = f"{p['sy']}-{travel}*{scroll_ease}" if scroll and travel else str(p["sy"])
    enter = "(1-pow(1-min(1,t/0.6),3))"  # the window lands: ease out
    phone = seg.get("phone")
    zoom = seg.get("zoom", 1.0) if not scroll else 1.0
    chain = (
        # the scene pulls out of focus as the window comes in
        f"[0:v][1:v]blend=all_expr='A*(1-min(1,T/1.0))+B*min(1,T/1.0)'[bg];"
        # the window: the screenshot under the chrome, the light sweep across it, then its entrance (scale, fade, slide)
        f"color=c=black@0.0:s={p['cw']}x{p['ch']}:r={FPS}:d={D},format=rgba[cv];"
        f"[cv][2:v]overlay=x={p['sx']}:y='{ypos}':format=rgb[w1];"
        f"[w1][3:v]overlay=0:0:format=rgb[w2];"
        f"[w2][4:v]overlay=x='-{sweep_w}+({p['cw']}+{sweep_w})*min(1,max(0,(t-0.45)/1.1))':y=0:format=rgb:enable='between(t,0.45,1.6)'[w3];"
        f"[w3]format=rgba,scale=eval=frame:w='iw*(0.93+0.07*{enter})':h=-1,fade=t=in:st=0:d=0.5:alpha=1[w4];"
        f"[bg][w4]overlay=x='{p['cx']}-w/2':y='{p['cy']}-h/2+{90 if phone else 40}*(1-{enter})':format=auto[b]"
    )
    last = "b"
    if zoom > 1.0:
        # a slow drift in (zoompan would freeze on the first frame: it emits its whole run from each input frame)
        chain += f";[b]scale=eval=frame:w='ceil(iw*(1+({zoom}-1)*t/{D})/2)*2':h=-1,crop={W}:{H}:'(iw-{W})/2':'(ih-{H})/2'[c]"
        last = "c"
    cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg0),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(bg1),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(scaled),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(p["chrome"]),
                    "-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(sweep),
                    "-f", "lavfi", "-t", str(D), "-i", "anullsrc=r=48000:cl=stereo"]
    chain, last = add_overlays(seg, chain, last, D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", "5:a", "-t", str(D)] + ENC + [str(out)]
    run(cmd)


# ---- the clips ----------------------------------------------------------------------------------------------------

def render_clip(seg: dict, name: str, out: Path) -> None:
    src = CLIPS / f"{seg['name']}.mp4"
    speed = seg.get("speed", 1.0)
    hold = seg.get("hold", 0)
    D = duration(seg)
    if src.exists():
        clip_len = probe(src)
        cmd = FFMPEG + ["-i", str(src)]
        chain = (f"[0:v]scale={W}:{H}:flags=lanczos,unsharp=5:5:0.4:5:5:0.0,setpts=PTS/{speed},fps={FPS}"
                 + (f",tpad=stop_mode=clone:stop_duration={hold}" if hold else "") + "[v0]")
        achain = f"[0:a]atempo={speed},aresample=48000" + (f",apad=pad_dur={hold}" if hold else "") + "[a0]"
        chain = chain + ";" + achain
        last, amap = "v0", "[a0]"
        print(f"   clip {seg['name']}: {clip_len:.1f} s at {speed} -> {D:.1f} s")
    else:
        # the keyframe stands in, with a slow push in, while the clip renders
        key = IMG / f"{seg['key']}.png"
        cmd = FFMPEG + ["-loop", "1", "-framerate", str(FPS), "-t", str(D), "-i", str(key), "-f", "lavfi", "-t", str(D), "-i", "anullsrc=r=48000:cl=stereo"]
        chain = f"[0:v]scale={W*2}:{H*2}:flags=lanczos,zoompan=z='1+0.08*on/({D*FPS})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(D*FPS)}:s={W}x{H}:fps={FPS}[v0]"
        last, amap = "v0", "1:a"
        print(f"   clip {seg['name']}: keyframe stand-in ({D:.1f} s)")
    chain, last = add_overlays(seg, chain, last, D, cmd)
    cmd += ["-filter_complex", chain, "-map", f"[{last}]", "-map", amap, "-t", str(D)] + ENC + [str(out)]
    run(cmd)


# ---- the overlays ---------------------------------------------------------------------------------------------------

def add_overlays(seg: dict, chain: str, last: str, D: float, cmd: list[str]) -> tuple[str, float]:
    """appends each overlay of the segment as a looped PNG input with its fade and slide"""
    items = []
    if seg.get("chapter"):
        items.append({"id": seg["chapter"], "at": 0.0, "until": D, "slide": False, "fade": 0.4})
    for o in seg.get("overlays", []):
        until = o["until"] if o["until"] > 0 else D + o["until"]
        items.append({"id": o["id"], "at": o["at"], "until": min(until, D), "slide": o["id"].startswith("push-"), "fade": 0.35})
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


# ---- the cut ------------------------------------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=str(HERE.parent / "media" / "mango-drink-demo.mp4"))
    p.add_argument("--only", help="segment numbers to re-render, comma-separated (the rest are reused)")
    p.add_argument("--draft", action="store_true", help="faster encode")
    p.add_argument("--no-music", action="store_true")
    p.add_argument("--no-concat", action="store_true", help="render the segments only")
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
        print(f"{name}: {seg['kind']} {seg.get('name') or seg.get('shot')}")
        if seg["kind"] == "clip":
            render_clip(seg, name, out)
        else:
            render_screen(seg, name, out)
    if a.no_concat:
        return
    durs = [probe(x) for x in parts]
    total = sum(durs) - XF * (len(parts) - 1)
    print(f"{len(parts)} segments, {total/60:.2f} min")

    # the crossfade chain
    cmd = FFMPEG[:]
    for x in parts:
        cmd += ["-i", str(x)]
    chain, cum = "", durs[0]
    vprev, aprev = "0:v", "0:a"
    for i in range(1, len(parts)):
        off = cum - XF
        both = segs[i - 1]["kind"] == "screen" and segs[i]["kind"] == "screen"
        kind = ("smoothleft" if i % 2 else "smoothup") if both else "fade"
        chain += f"[{vprev}][{i}:v]xfade=transition={kind}:duration={XF}:offset={off:.3f}[v{i}];"
        chain += f"[{aprev}][{i}:a]acrossfade=d={XF}:c1=tri:c2=tri[a{i}];"
        vprev, aprev = f"v{i}", f"a{i}"
        cum += durs[i] - XF
    music = HERE / "music.wav"
    if music.exists() and not a.no_music:
        cmd += ["-i", str(music)]
        m = len(parts)
        chain += f"[{aprev}]volume=0.85[amb];[{m}:a]volume=0.5,atrim=0:{total:.2f}[mus];[amb][mus]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
        amap = "[aout]"
    else:
        chain += f"[{aprev}]loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
        amap = "[aout]"
    chain += f";[{vprev}]format=yuv420p[vout]"
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd += ["-filter_complex", chain, "-map", "[vout]", "-map", amap, "-t", f"{total:.3f}", "-movflags", "+faststart"] + ENC + [str(out)]
    run(cmd)
    print(f"wrote {out} ({probe(out):.1f} s, {out.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
