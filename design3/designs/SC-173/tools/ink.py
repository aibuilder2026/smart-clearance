"""SC-173: a signature scan (Qwen-Image, ink on white paper) keyed to its ink alone: the paper becomes transparent, the
ink keeps its own colour with an alpha from how dark it is, trimmed to the ink with a small margin, then WebP.
    python3 ink.py in.png out.webp [--height 160]
"""

import argparse

from PIL import Image, ImageFilter, ImageOps


def key(src: str, out: str, height: int) -> None:
    im = Image.open(src).convert("RGB")
    grey = ImageOps.grayscale(im)
    # the paper's own brightness, from its brightest tenth; the ink is anything well below it
    hist = grey.histogram()
    total, run, paper = sum(hist), 0, 255
    for v in range(255, -1, -1):
        run += hist[v]
        if run >= total * 0.5:
            paper = v
            break
    lo = max(0, paper - 150)
    alpha = grey.point(lambda v: 0 if v >= paper - 18 else 255 if v <= lo else int(255 * (paper - 18 - v) / (paper - 18 - lo)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    # the ink's colour: the darkest pixels' average, laid under the alpha so the edges never fringe white
    px = sorted(((grey.getpixel((x, y)), im.getpixel((x, y))) for y in range(0, im.height, 2) for x in range(0, im.width, 2) if grey.getpixel((x, y)) < paper - 40), key=lambda t: t[0])
    px = [p for _, p in px[: max(1, len(px) // 12)]]
    ink = tuple(sum(p[i] for p in px) // max(1, len(px)) for i in range(3)) if px else (20, 30, 90)
    out_im = Image.new("RGBA", im.size, ink + (0,))
    out_im.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        m = 12
        box = (max(0, box[0] - m), max(0, box[1] - m), min(im.width, box[2] + m), min(im.height, box[3] + m))
        out_im = out_im.crop(box)
    if out_im.height > height:
        out_im = out_im.resize((round(out_im.width * height / out_im.height), height), Image.LANCZOS)
    out_im.save(out, "WEBP", quality=90, method=6)
    print(out, out_im.size, "ink", ink)


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("src")
    a.add_argument("out")
    a.add_argument("--height", type=int, default=160)
    x = a.parse_args()
    key(x.src, x.out, x.height)
