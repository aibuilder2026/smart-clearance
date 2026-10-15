"""SC-210: the tea factory's packing machine had a blank white screen in its keyframe (b2-factory-tea, Qwen-Image), which
read as a screen nobody had composited. Its screen now shows a machine panel: the line, RUNNING, packs an hour and the
last eight hours as bars, in the plant's own dark HMI style, generic. Written as img/b2-factory-tea-L.png (Still25D
takes the -L keyframe first), with the keyframe's depth map copied for it.
   .venv/bin/python hmi.py"""
import shutil
from pathlib import Path
import cv2, numpy as np
from PIL import Image, ImageDraw
from kit import HERE, draw_text, text_w

SRC = HERE / 'img' / 'b2-factory-tea.png'
OUT = HERE / 'img' / 'b2-factory-tea-L.png'


def panel(w, h):
    im = Image.new('RGB', (w, h), (20, 27, 34)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, 64], fill=(33, 43, 54))
    draw_text(d, (22, 16), 'LINE 2  ·  PACKING', 'g', 26, (196, 208, 220), 640, 0.08)
    pw = text_w('RUNNING', 'b', 22, 760, 0.08) + 44
    d.rounded_rectangle([w - pw - 18, 14, w - 18, 50], radius=18, fill=(26, 120, 76))
    draw_text(d, (w - pw + 4, 20), 'RUNNING', 'b', 22, (226, 248, 236), 760, 0.08)
    draw_text(d, (24, 92), '1,284', 'b', 104, (236, 242, 246), 800)
    draw_text(d, (28 + text_w('1,284', 'b', 104, 800) + 16, 150), 'packs / hr', 'g', 28, (150, 166, 180), 560)
    vals = [0.62, 0.7, 0.66, 0.78, 0.74, 0.83, 0.8, 0.88]
    x0, y1, bw, gap, top = 26, h - 30, 56, 18, 250
    for i, v in enumerate(vals):
        x = x0 + i * (bw + gap)
        d.rectangle([x, y1 - (y1 - top) * v, x + bw, y1], fill=(52, 168, 110) if i == len(vals) - 1 else (40, 110, 80))
    d.line([20, y1 + 1, w - 20, y1 + 1], fill=(70, 84, 98), width=2)
    return np.asarray(im, np.float32)[..., ::-1] / 255


def main():
    im = cv2.imread(str(SRC))
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    white = ((hsv[..., 2] > 225) & (hsv[..., 1] < 20)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    comp = (lab == i).astype(np.uint8)
    comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)[:, 0].astype(np.float32)
    if len(ap) != 4: ap = cv2.boxPoints(cv2.minAreaRect(c)).astype(np.float32)
    s_, d_ = ap.sum(1), ap[:, 0] - ap[:, 1]
    q = np.float32([ap[np.argmin(s_)], ap[np.argmax(d_)], ap[np.argmax(s_)], ap[np.argmin(d_)]])
    # the screen's glass sits a pixel inside the white: grown by 2 px so no white rim is left
    q = q.mean(0) + (q - q.mean(0)) * (1 + 2.0 / max(1.0, np.ptp(q[:, 0]) / 2))
    w, h = 680, 512
    P = panel(w, h)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    warped = cv2.warpPerspective(P, M, (im.shape[1], im.shape[0]), flags=cv2.INTER_AREA)
    mask = cv2.warpPerspective(np.ones((h, w), np.float32), M, (im.shape[1], im.shape[0]), flags=cv2.INTER_LINEAR)
    mask = cv2.GaussianBlur(mask, (0, 0), 0.6)[..., None]
    # the room's light on the glass: a faint sheen from the window side, and the panel a touch soft, as the photo is
    warped = cv2.GaussianBlur(warped, (0, 0), 0.7)
    yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]].astype(np.float32)
    sheen = np.clip(1 - (xx - q[:, 0].min()) / max(1.0, np.ptp(q[:, 0])), 0, 1)[..., None] * 0.06
    base = im.astype(np.float32) / 255
    out = base * (1 - mask) + np.clip(warped + sheen, 0, 1) * mask
    cv2.imwrite(str(OUT), np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8))
    dep = HERE / 'build' / 'depth'
    shutil.copy(dep / 'b2-factory-tea.png', dep / 'b2-factory-tea-L.png')
    print('wrote', OUT.name, 'screen', q.round(1).tolist())


if __name__ == '__main__':
    main()
