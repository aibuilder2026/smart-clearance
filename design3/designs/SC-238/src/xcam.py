"""SC-238: the distributor's tablet filming the destruction at the landfill. Its camera's view of the packs going into
the pit (a clip, cropped to the tablet's portrait screen, its own frames at 25 fps), under the app's camera (the step at the top;
Cancel, the shutter and Upload at the foot, as the app's own camera step has them), then the shutter pressed: the
button dips, a white flash, the view frozen as the photo, "Photo taken" at the top. The frame is the distributor's
tablet window's (846 × 1218), so screens.py sets it into the glass exactly as it sets the app's screen.

   uv run --with numpy --with opencv-python-headless --with pillow python xcam.py [NAME]      (default m-xcam)
   Its media.json entry (plan.py) gives the clip, where in it the view starts, how long the content runs, when the shutter
   goes, and the crop: [left, top, height] as fractions of the clip, the width the tablet's portrait screen's."""
import subprocess, sys, tempfile
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import frc  # noqa: E402

FPS, CW, CH = 25, 846, 1218
FONT = str(HERE / 'film' / 'public' / 'fonts' / 'Geist.ttf')


def font(px, weight=600):
    f = ImageFont.truetype(FONT, px)
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f


def chrome(img, t, shutter):
    """the app's camera over the view: its step, the guide, Cancel, the shutter and Upload"""
    d = ImageDraw.Draw(img, 'RGBA')
    # the foot: a dark band with the three controls
    for y in range(CH - 300, CH):
        a = int(200 * min(1, (y - (CH - 300)) / 140))
        d.line([(0, y), (CW, y)], fill=(4, 10, 7, a))
    press = shutter <= t < shutter + 0.14
    cx, cy = CW // 2, CH - 130
    d.ellipse([cx - 62, cy - 62, cx + 62, cy + 62], outline=(255, 255, 255, 255), width=7)
    r = 40 if press else 50
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))
    f = font(32, 560)
    d.text((70, cy), 'Cancel', font=f, fill=(255, 255, 255, 235), anchor='lm')
    d.text((CW - 70, cy), 'Upload', font=f, fill=(255, 255, 255, 235), anchor='rm')
    # the guide's corners, closing a touch as it focuses
    k = min(1.0, t / 0.6)
    gx, gy = 120 - 20 * k, 230 - 20 * k
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        x0 = gx if sx > 0 else CW - gx
        y0 = gy if sy > 0 else (CH - 340) + 20 * k
        d.line([(x0, y0), (x0 + sx * 70, y0)], fill=(255, 255, 255, 230), width=6)
        d.line([(x0, y0), (x0, y0 + sy * 70)], fill=(255, 255, 255, 230), width=6)
    # the step at the top, then "Photo taken" once the shutter has gone
    taken = t >= shutter + 0.3
    label = 'Photo taken · after, at the landfill' if taken else 'Photo 2 of 2 · after, at the landfill'
    f2 = font(30, 600)
    w = d.textlength(label, font=f2)
    x0 = (CW - w) / 2 - 26
    d.rounded_rectangle([x0, 60, x0 + w + 52, 120], radius=30, fill=(46, 160, 104, 235) if taken else (4, 10, 7, 170))
    d.text((CW / 2, 90), label, font=f2, fill=(255, 255, 255, 255), anchor='mm')


def main():
    import json
    name = sys.argv[1] if len(sys.argv) > 1 else 'm-xcam'
    m = json.loads((HERE / 'build' / 'media.json').read_text())[name]
    src, a, dur, shutter = Path(m['src']), float(m['in']), float(m['dur']), float(m['shutter'])
    cw_, ch_, fin, cdur = frc.probe(src)
    fx, fy, fh = m['crop']
    h = int(round(fh * ch_)); w = int(round(h * CW / CH)); y = int(round(fy * ch_)); x = min(cw_ - w, int(round(fx * cw_)))
    n = round(dur * FPS); n_live = round(shutter * FPS) + 1
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        tmp = Path(td)
        span = min(shutter + 0.1, cdur - a - 0.05)
        ins = frc.frames(src, a, span, tmp / 'in', fin)
        # (its own frames, the nearest to each output time: RIFE only where the clip is too short for its time)
        live = ins if len(ins) >= 0.9 * n_live else frc.rife(tmp / 'in', tmp / 'live', max(n_live, len(ins)))
        seq = tmp / 'seq'; seq.mkdir()
        frozen = None
        for i in range(n):
            t = i / FPS
            if t <= shutter or frozen is None:
                fr = cv2.imread(str(live[min(len(live) - 1, round(t / span * (len(live) - 1)))]))
                view = cv2.resize(fr[y:y + h, x:x + w], (CW, CH), interpolation=cv2.INTER_AREA if w > CW else cv2.INTER_CUBIC)
                if t >= shutter: frozen = view.copy()
            else:
                view = frozen
            img = Image.fromarray(cv2.cvtColor(view, cv2.COLOR_BGR2RGB)).convert('RGBA')
            chrome(img, t, shutter)
            arr = np.asarray(img.convert('RGB')).astype(np.float32)
            if t >= shutter:                                        # the flash
                fl = float(np.exp(-(t - shutter) * 9.0))
                arr = arr * (1 - fl) + 255 * fl
            cv2.imwrite(str(seq / f'{i + 1:08d}.png'), cv2.cvtColor(np.clip(arr, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
        out = HERE / 'film' / 'public' / 'media' / f'{name}.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', str(seq / '%08d.png'), '-vf', 'tpad=stop_mode=clone:stop=3',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', str(out)], check=True)
    print(f'{name}: {n} frames, {src.name} from {a:.2f} s, the shutter at {shutter:.2f} s')


if __name__ == '__main__':
    main()
