"""SC-147's codes: the barcodes and QR codes the carton labels carry, drawn as SVG, and the GSTINs the papers (SC-148)
name, each with its check character. Every number is fictional:

- GTINs sit under GS1 India's prefix 890 with a company number no business holds (8900000), so no barcode is a real
  product's; a pack carries its EAN-13, and the shipper carton of 24 its GTIN-14 as ITF-14 (indicator digit 1).
- The QR code is a GS1 Digital Link on a reserved .example domain: the GTIN (AI 01), the batch (AI 10) and the expiry
  date (AI 17, YYMMDD), so a phone reads the batch and its dates.
- A PAN's four digits are 0000, which the Income Tax Department never issues, so no GSTIN is a real taxpayer's.

    uv run --with segno python design3/designs/SC-147/codes/codes.py   # writes the sample codes into codes/
"""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).parent

# ---------- GTIN check digits (GS1: from the right, weights 3, 1, 3, …) ----------


def gs1_check(data: str) -> str:
    total = sum(int(d) * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(data)))
    return str((10 - total % 10) % 10)


COMPANY = "8900000"  # GS1 India (890), a company number no business holds
ITEM = {  # each SKU's item reference
    "chips": "00101",
    "biscuits": "00102",
    "chikki": "00103",
    "poha": "00104",
    "oats": "00105",
    "mango": "00106",
    "facewash": "00107",
    "hairoil": "00108",
}


def ean13(sku: str) -> str:
    """the pack's GTIN-13"""
    body = COMPANY + ITEM[sku]
    return body + gs1_check(body)


def gtin14(sku: str, indicator: str = "1") -> str:
    """the shipper carton's GTIN-14: an indicator digit, the pack's first 12 digits, its own check digit"""
    body = indicator + (COMPANY + ITEM[sku])
    return body + gs1_check(body)


# ---------- EAN-13 ----------

L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"]
G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"]
R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"]
PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"]


def ean13_modules(code: str) -> str:
    assert len(code) == 13 and code[-1] == gs1_check(code[:12]), code
    first, left, right = int(code[0]), code[1:7], code[7:]
    bits = "101"
    for d, p in zip(left, PARITY[first]):
        bits += (L if p == "L" else G)[int(d)]
    bits += "01010"
    for d in right:
        bits += R[int(d)]
    return bits + "101"


def ean13_svg(code: str, module: float = 3.0, height: float = 150.0, ink: str = "#111") -> str:
    """an EAN-13 with its human-readable digits, quiet zones included (11 modules left, 7 right)"""
    bits = ean13_modules(code)
    qz_l, qz_r, font = 11, 7, module * 9
    w = (qz_l + len(bits) + qz_r) * module
    guard = {0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94}  # the start, middle and end guards run longer
    rects = []
    for i, b in enumerate(bits):
        if b == "1":
            h = height + (font * 0.55 if i in guard else 0)
            rects.append(f'<rect x="{(qz_l + i) * module:.2f}" y="0" width="{module:.2f}" height="{h:.2f}"/>')
    th = height + font
    txt = [
        f'<text x="{(qz_l - 2) * module:.2f}" y="{th:.2f}" text-anchor="end">{code[0]}</text>',
        f'<text x="{(qz_l + 3 + 21) * module:.2f}" y="{th:.2f}" text-anchor="middle" letter-spacing="{module * 1.6:.1f}">{code[1:7]}</text>',
        f'<text x="{(qz_l + 50 + 21) * module:.2f}" y="{th:.2f}" text-anchor="middle" letter-spacing="{module * 1.6:.1f}">{code[7:]}</text>',
    ]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {th + module:.2f}" width="{w:.2f}" '
        f'height="{th + module:.2f}"><g fill="{ink}">{"".join(rects)}</g><g fill="{ink}" '
        f'font-family="OCR-B, Menlo, monospace" font-size="{font:.1f}">{"".join(txt)}</g></svg>'
    )


# ---------- ITF-14 (interleaved 2 of 5, with bearer bars) ----------

ITF = {
    "0": "nnwwn",
    "1": "wnnnw",
    "2": "nwnnw",
    "3": "wwnnn",
    "4": "nnwnw",
    "5": "wnwnn",
    "6": "nwwnn",
    "7": "nnnww",
    "8": "wnnwn",
    "9": "nwnwn",
}


def itf14_svg(code: str, narrow: float = 3.0, ratio: float = 2.5, height: float = 130.0, ink: str = "#1a1410") -> str:
    """an ITF-14 with its bearer bars and the GTIN-14 printed under it, as GS1 sets it out for a shipper carton"""
    assert len(code) == 14 and code[-1] == gs1_check(code[:13]), code
    wide = narrow * ratio
    seq: list[tuple[bool, float]] = [(True, narrow), (False, narrow), (True, narrow), (False, narrow)]  # start
    for a, b in zip(code[0::2], code[1::2]):
        for x, y in zip(ITF[a], ITF[b]):
            seq.append((True, wide if x == "w" else narrow))
            seq.append((False, wide if y == "w" else narrow))
    seq += [(True, wide), (False, narrow), (True, narrow)]  # stop
    quiet, bearer = narrow * 10, narrow * 4
    width = sum(w for _, w in seq) + 2 * quiet
    x, bars = quiet, []
    for is_bar, w in seq:
        if is_bar:
            bars.append(f'<rect x="{x:.2f}" y="{bearer:.2f}" width="{w:.2f}" height="{height:.2f}"/>')
        x += w
    frame = (
        f'<rect x="{bearer / 2:.2f}" y="{bearer / 2:.2f}" width="{width - bearer:.2f}" height="{height + bearer:.2f}" '
        f'fill="none" stroke="{ink}" stroke-width="{bearer:.2f}"/>'
    )
    font = narrow * 8
    th = height + 2 * bearer + font * 1.15
    human = f"{code[0]} {code[1:3]} {code[3:8]} {code[8:13]} {code[13]}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {th + narrow:.2f}" width="{width:.2f}" '
        f'height="{th + narrow:.2f}"><g fill="{ink}">{"".join(bars)}</g>{frame}<text x="{width / 2:.2f}" '
        f'y="{th:.2f}" text-anchor="middle" fill="{ink}" font-family="OCR-B, Menlo, monospace" '
        f'font-size="{font:.1f}" letter-spacing="{narrow:.1f}">{human}</text></svg>'
    )


# ---------- the QR code: a GS1 Digital Link ----------


def digital_link(gtin: str, batch: str, best_before: str) -> str:
    """the batch's GS1 Digital Link: its GTIN (01), batch (10) and expiry date (17, YYMMDD), on a .example domain"""
    y, m, d = best_before.split("-")
    return f"https://id.munchly.example/01/{gtin.zfill(14)}/10/{batch}?17={y[2:]}{m}{d}"


def qr_svg(data: str, scale: int = 6, dark: str = "#111") -> str:
    import segno

    q = segno.make(data, error="m")
    out = HERE / ".qr.svg"
    q.save(str(out), scale=scale, border=4, dark=dark, light=None, xmldecl=False, svgns=True)
    svg = out.read_text()
    out.unlink()
    # a viewBox, so the code scales to whatever size the label gives it, never crops
    import re

    w, h = re.search(r'width="([\d.]+)"', svg).group(1), re.search(r'height="([\d.]+)"', svg).group(1)
    return re.sub(r'<svg ([^>]*?)width="[\d.]+" height="[\d.]+"', rf'<svg \1viewBox="0 0 {w} {h}"', svg, count=1)


# ---------- GSTIN ----------

B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def gstin(state: str, pan: str, entity: str = "1") -> str:
    """a GSTIN: the state code, the PAN, the entity number, Z, and its check character"""
    body = f"{state}{pan}{entity}Z"
    assert len(body) == 14, body
    total = 0
    for i, ch in enumerate(body):
        p = B36.index(ch) * (1 if i % 2 == 0 else 2)
        total += p // 36 + p % 36
    return body + B36[(36 - total % 36) % 36]


def gstin_ok(g: str) -> bool:
    return len(g) == 15 and gstin(g[:2], g[2:12], g[12]) == g


if __name__ == "__main__":
    out = HERE
    sample = {"sku": "chips", "batch": "MF-2409-117", "bb": "2026-11-18"}
    e, t = ean13(sample["sku"]), gtin14(sample["sku"])
    (out / "ean13-chips.svg").write_text(ean13_svg(e))
    (out / "itf14-chips.svg").write_text(itf14_svg(t))
    link = digital_link(t, sample["batch"], sample["bb"])
    (out / "qr-chips.svg").write_text(qr_svg(link))
    print("EAN-13", e, "GTIN-14", t)
    print("QR", link)
    for name, state, pan in [("Munchly Foods Ltd", "27", "AAKCM0000M"), ("Rakesh Traders", "27", "ABHPR0000K")]:
        print(name, gstin(state, pan), gstin_ok(gstin(state, pan)))
    print("existing 27AABCM1234F1Z5 valid:", gstin_ok("27AABCM1234F1Z5"), "22AAGFA4821M1Z3 valid:", gstin_ok("22AAGFA4821M1Z3"))
    sys.exit(0)
