"""SC-211: the biscuit factory's worker held a tablet with a blank white screen (b3-factory-biscuits, Qwen-Image), which
read as a screen nobody had composited (the maintainer: "this scene shows white screen tablet looks odd"). Its screen
now shows the brand's own workspace, generic: the watchlist, three batches with their days to the date, the one flagged
in amber. Painted only over the screen's own white pixels, so the gloved finger on the glass stays in front. Written as
img/b3-factory-biscuits-L.png (Still25D takes the -L keyframe first), with the keyframe's depth map copied for it.
   .venv/bin/python tablet11.py"""
import shutil
import cv2, numpy as np
from PIL import Image, ImageDraw
from kit import HERE, draw_text, text_w

SRC = HERE / 'img' / 'b3-factory-biscuits.png'
OUT = HERE / 'img' / 'b3-factory-biscuits-L.png'
HINT = (520, 330, 1120, 760)   # where the tablet is, in the keyframe's pixels


def screen(w, h):
    """the workspace's watchlist, in the app's light theme"""
    S = 2
    im = Image.new('RGB', (w * S, h * S), (247, 249, 248)); d = ImageDraw.Draw(im)
    G, INK, MUT, AMB, RED = (22, 122, 82), (16, 33, 26), (96, 116, 106), (196, 128, 12), (196, 64, 44)
    d.rectangle([0, 0, w * S, 58 * S], fill=(255, 255, 255))
    d.line([0, 58 * S, w * S, 58 * S], fill=(222, 230, 226), width=2 * S)
    d.rounded_rectangle([16 * S, 12 * S, 50 * S, 46 * S], radius=9 * S, fill=(96, 110, 224))
    draw_text(d, (26 * S, 15 * S), 'B', 'b', 24 * S, (255, 255, 255), 800)
    draw_text(d, (62 * S, 12 * S), 'Biscuits Co.', 'b', 20 * S, INK, 760)
    draw_text(d, (62 * S, 36 * S), 'workspace · watchlist', 'g', 13 * S, MUT, 520)
    d.rounded_rectangle([(w - 112) * S, 16 * S, (w - 16) * S, 42 * S], radius=13 * S, fill=(229, 244, 236))
    draw_text(d, ((w - 100) * S, 20 * S), '● Live', 'g', 14 * S, G, 640)
    draw_text(d, (18 * S, 74 * S), 'Batches at the godowns', 'b', 22 * S, INK, 760)
    rows = [('Batch 4471 · 2,400 packs', 64, G, 'On track'), ('Batch 4486 · 1,900 packs', 31, AMB, 'Watching'),
            ('Batch 4502 · 1,580 packs', 19, RED, 'Flagged')]
    y = 112
    for name, days, ink, state in rows:
        d.rounded_rectangle([14 * S, y * S, (w - 14) * S, (y + 62) * S], radius=12 * S, fill=(255, 255, 255), outline=(226, 233, 229), width=2 * S)
        d.rounded_rectangle([26 * S, (y + 13) * S, 62 * S, (y + 49) * S], radius=8 * S, fill=(236, 226, 206))
        draw_text(d, (74 * S, (y + 10) * S), name, 'g', 16 * S, INK, 640)
        # days to the date, as a bar
        bw = w - 74 - 150
        d.rounded_rectangle([74 * S, (y + 38) * S, (74 + bw) * S, (y + 46) * S], radius=4 * S, fill=(232, 238, 235))
        d.rounded_rectangle([74 * S, (y + 38) * S, (74 + bw * min(1, days / 70)) * S, (y + 46) * S], radius=4 * S, fill=ink)
        cw = text_w(f'{days} days', 'b', 15, 760) + 22
        d.rounded_rectangle([(w - 26 - cw) * S, (y + 10) * S, (w - 26) * S, (y + 34) * S], radius=12 * S, fill=tuple(int(255 - (255 - c) * 0.16) for c in ink))
        draw_text(d, ((w - 26 - cw + 11) * S, (y + 12) * S), f'{days} days', 'b', 15 * S, ink, 760)
        draw_text(d, ((w - 26 - cw + 4) * S, (y + 40) * S), state, 'g', 12 * S, MUT, 560)
        y += 74
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32)[..., ::-1] / 255


def main():
    im = cv2.imread(str(SRC))
    x0, y0, x1, y1 = HINT
    roi = im[y0:y1, x0:x1]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    white = ((hsv[..., 2] > 215) & (hsv[..., 1] < 26)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    comp = (lab == i).astype(np.uint8)
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    hull = cv2.convexHull(c)   # the finger bites into the white; the hull bridges it
    for eps in (0.02, 0.03, 0.045, 0.06):
        ap = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)[:, 0].astype(np.float32)
        if len(ap) == 4: break
    if len(ap) != 4: ap = cv2.boxPoints(cv2.minAreaRect(hull)).astype(np.float32)
    ap += np.float32([x0, y0])
    s_, d_ = ap.sum(1), ap[:, 0] - ap[:, 1]
    q = np.float32([ap[np.argmin(s_)], ap[np.argmax(d_)], ap[np.argmax(s_)], ap[np.argmin(d_)]])
    q = q.mean(0) + (q - q.mean(0)) * 1.012   # to the glass's edge, so no white rim is left
    w, h = 640, 470
    P = screen(w, h)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    warped = cv2.warpPerspective(P, M, (im.shape[1], im.shape[0]), flags=cv2.INTER_AREA)
    inside = cv2.warpPerspective(np.ones((h, w), np.float32), M, (im.shape[1], im.shape[0]), flags=cv2.INTER_LINEAR)
    base = im.astype(np.float32) / 255
    hsv_all = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
    # only the screen's own white: a finger, its shadow and the bezel stay as they are
    wm = np.clip((hsv_all[..., 2] - 175) / 40, 0, 1) * np.clip((60 - hsv_all[..., 1]) / 30, 0, 1)
    wm = cv2.GaussianBlur(wm, (0, 0), 1.2)
    m = (inside * wm)[..., None]
    # the photo's own light on the glass: the screen keeps the white's falloff, a little soft, as the photo is
    lum = cv2.GaussianBlur(base.mean(axis=2, keepdims=True), (0, 0), 6)
    lum = lum if lum.ndim == 3 else lum[..., None]
    warped = cv2.GaussianBlur(warped, (0, 0), 0.8)
    out = base * (1 - m) + np.clip(warped * np.clip(lum / 0.92, 0.75, 1.04), 0, 1) * m
    cv2.imwrite(str(OUT), np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8))
    dep = HERE / 'build' / 'depth'
    if (dep / 'b3-factory-biscuits.png').exists():
        shutil.copy(dep / 'b3-factory-biscuits.png', dep / 'b3-factory-biscuits-L.png')
    print('wrote', OUT.name, 'screen', q.round(1).tolist())


if __name__ == '__main__':
    main()
