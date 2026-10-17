"""SC-238: the staff member's UPI success screen for the staff sale's over-the-shoulder shot (the phone in front of the
distributor's tablet): a fictional payment (reference 6275 0418 3392), drawn at the phone's own 448 × 974. The rupee sign
comes from the system font (Geist has no ₹), the rest in Geist and Bricolage as the app sets them.
   uv run --with pillow python upi-screen.py   ->  build/upi-paid.png"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
W, H = 448, 974
GREEN, INK, MUTE, BG = (23, 125, 85), (16, 34, 26), (98, 118, 108), (246, 248, 247)
GEIST, BRIC = str(HERE / 'fonts' / 'Geist.ttf'), str(HERE / 'fonts' / 'Bricolage.ttf')
SYS = '/System/Library/Fonts/SFNS.ttf'


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        try: f.set_variation_by_axes([weight] + ([] if len(f.get_variation_axes()) == 1 else [x['default'] for x in f.get_variation_axes()[1:]]))
        except Exception: pass
    return f


def runs(d, x, y, parts, anchor='ls'):
    """draw text made of (text, font, fill) runs on one baseline, from x (or ending at x for anchor 'rs')"""
    widths = [d.textlength(t, font=f) for t, f, _ in parts]
    if anchor == 'rs': x -= sum(widths)
    if anchor == 'ms': x -= sum(widths) / 2
    for (t, f, c), w in zip(parts, widths):
        d.text((x, y), t, font=f, fill=c, anchor='ls'); x += w


im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 300], fill=GREEN)
d.ellipse([162, 58, 286, 182], fill=(255, 255, 255))
d.line([(196, 122), (218, 145), (258, 100)], fill=GREEN, width=13, joint='curve')
d.text((W / 2, 244), 'Payment successful', font=font(GEIST, 29, 700), fill=(255, 255, 255), anchor='ms')
big_r, big = font(SYS, 64, 700), font(GEIST, 66, 760)
runs(d, W / 2, 396, [('₹', big_r, INK), ('64.00', big, INK)], anchor='ms')
d.text((W / 2, 440), 'Paid by UPI · staff sale', font=font(GEIST, 21, 450), fill=(70, 88, 79), anchor='ms')
row = font(GEIST, 20, 430); rowb = font(GEIST, 20, 640); rr = font(SYS, 19, 430)
runs(d, 40, 542, [('8 packs × ', row, MUTE), ('₹', rr, MUTE), ('8.00', row, MUTE)])
d.text((W - 40, 542), 'mango drink', font=rowb, fill=INK, anchor='rs')
d.text((40, 606), 'UPI ref', font=row, fill=MUTE, anchor='ls'); d.text((W - 40, 606), '6275 0418 3392', font=rowb, fill=INK, anchor='rs')
d.text((40, 670), 'Date', font=row, fill=MUTE, anchor='ls'); d.text((W - 40, 670), '3 Oct 2026, 16:42', font=rowb, fill=INK, anchor='rs')
d.rounded_rectangle([40, 824, W - 40, 894], radius=35, fill=GREEN)
d.text((W / 2, 868), 'Done', font=font(GEIST, 24, 700), fill=(255, 255, 255), anchor='ms')
out = HERE / 'build' / 'upi-paid.png'; im.save(out); print(out)
