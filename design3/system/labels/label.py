"""The carton label every Munchly batch carries (SC-147, option A, the full statutory sticker), as HTML for compose.mjs
to print onto a base photo: the product in a band (with the veg mark on food), the ingredients, the net quantity and
MRP boxed, the batch and its dates boxed, the maker and customer care, the FSSAI mark and licence (or a cosmetic's
manufacturing licence), the pack's EAN-13, the batch's QR code (a GS1 Digital Link) and the storage line.

The batch, the dates and the MRP print exactly as the batch's record has them, so Vision's check still matches. A label
is printed in one of the styles cartons in India carry (`STYLES`), which Vision's eval set reads: standard, bilingual
Hindi, PKD and USE BY, two-digit years, month names. Each line Vision reads has an id (#batch, #mfg, #bb, #mrp), so a
cover can be put over it (compose.mjs). Every company, number and code is fictional.

    uv run --with segno python design3/system/labels/label.py <spec.json> <out.html>
A spec: {sku, batch, mfg, bestBefore, mrp, style?, w, h, pad?} (dates ISO).
"""

from __future__ import annotations

import json
import sys
from html import escape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import codes  # noqa: E402
import skus  # noqa: E402

MAKER = {
    "name": "Munchly Foods Ltd",
    "address": "Plot B-14, MIDC Chakan Phase II, Pune 410501, Maharashtra, India",
    "fssai": skus.FOOD_LIC,
    "care": "1800 000 2614 (toll free) · care@munchly.example",
}
MONTHS = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")


def dmy(iso: str, style: str = "slash") -> str:
    y, m, d = iso.split("-")
    if style == "dot":
        return f"{d}.{m}.{y}"
    if style == "short":
        return f"{d}-{m}-{y[2:]}"
    if style == "month":
        return f"{int(d):02d} {MONTHS[int(m) - 1]} {y}"
    return f"{d}/{m}/{y}"


def lines(spec: dict) -> dict:
    """what the two boxes print, by the label's style: the batch, the made date, the best-before, the MRP"""
    style, batch, mrp = spec.get("style", "standard"), spec["batch"], float(spec["mrp"])
    mfg, bb = spec["mfg"], spec["bestBefore"]
    food = skus.SKUS[spec["sku"]]["food"]
    until = "BEST BEFORE" if food else "USE BEFORE"
    if style == "hindi":
        return {
            "batch": f"बैच नं. / BATCH NO: {batch}",
            "mfg": f"निर्माण तिथि / MFG: {dmy(mfg)}",
            "bb": f"इससे पहले उपयोग करें / {until}: {dmy(bb)}",
            "mrp": f"अधिकतम खुदरा मूल्य / MRP ₹{mrp:.2f}",
            "tax": "(सभी करों सहित / incl. of all taxes)",
        }
    if style == "pkd":
        return {
            "batch": f"B.NO.: {batch}",
            "mfg": f"PKD: {dmy(mfg, 'dot')}",
            "bb": f"USE BY: {dmy(bb, 'dot')}",
            "mrp": f"M.R.P. Rs. {mrp:.0f}/-",
            "tax": "(incl. of all taxes)",
        }
    if style == "short":
        return {
            "batch": f"BATCH {batch}",
            "mfg": f"MFD {dmy(mfg, 'short')}",
            "bb": f"BB {dmy(bb, 'short')}",
            "mrp": f"MRP ₹{mrp:.2f}",
            "tax": "(incl. of all taxes)",
        }
    if style == "month":
        return {
            "batch": f"LOT NO: {batch}",
            "mfg": f"MFG DATE: {dmy(mfg, 'month')}",
            "bb": f"EXPIRY: {dmy(bb, 'month')}",
            "mrp": f"MRP ₹{mrp:.2f}",
            "tax": "(INCL. OF ALL TAXES)",
        }
    return {
        "batch": f"BATCH NO: {batch}",
        "mfg": f"MFG: {dmy(mfg)}",
        "bb": f"{until}: {dmy(bb)}",
        "mrp": f"MRP ₹{mrp:.2f}",
        "tax": "per pack (incl. of all taxes)",
    }


def fssai_mark(colour: str = "#1d3a8a") -> str:
    """an fssai wordmark with its swoosh, drawn here (not the authority's artwork)"""
    return (
        f'<svg class="fssai" viewBox="0 0 120 44" aria-hidden="true"><path d="M8 34 C 40 46, 82 44, 114 30" '
        f'fill="none" stroke="#e8771e" stroke-width="3.2" stroke-linecap="round"/><text x="60" y="27" '
        f'text-anchor="middle" font-family="Arial Rounded MT Bold, Arial Rounded Bold, Arial" font-weight="700" '
        f'font-style="italic" font-size="30" fill="{colour}">fssai</text></svg>'
    )


VEG = (
    '<svg class="veg" viewBox="0 0 20 20" aria-hidden="true"><rect x="1.2" y="1.2" width="17.6" height="17.6" '
    'fill="#fff" stroke="#1f8a3c" stroke-width="2"/><circle cx="10" cy="10" r="5" fill="#1f8a3c"/></svg>'
)

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: __W__px; height: __H__px; background: #fff; }
body { padding: __P__px; font-family: "Arial Narrow", Arial, sans-serif; color: #141414; -webkit-font-smoothing: antialiased; }
.fssai { width: 110px; height: 40px; display: block; flex: none; }
.veg { width: 26px; height: 26px; flex: none; }
svg { display: block; }
.a { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto 1fr auto; height: 100%; border: 3px solid #7a1418; overflow: hidden; }
.band { display: flex; align-items: center; gap: 14px; padding: 10px 18px; background: #7a1418; color: #fff; }
.band b { font: 700 40px/1 "Arial Black", Arial, sans-serif; letter-spacing: 0.5px; white-space: nowrap; flex: 1 1 auto; min-width: 0; overflow: hidden; }
.band span { font: 700 30px/1 "Arial Narrow", Arial; white-space: nowrap; }
.ing { padding: 8px 18px 6px; font-size: 17.5px; line-height: 1.25; border-bottom: 2px solid #7a1418; }
.mid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr); gap: 16px; padding: 14px 18px 12px; min-height: 0; }
.col { display: grid; gap: 14px; align-content: space-between; min-width: 0; }
.box { border: 2.5px solid #1d2a6b; border-radius: 22px; padding: 12px 18px; display: grid; gap: 6px;
  font: 700 29px/1.18 "Arial Narrow", Arial, "Kohinoor Devanagari", "Devanagari Sangam MN", sans-serif; min-width: 0; }
.box > span { white-space: nowrap; overflow: hidden; }
.box small { font: 400 15px/1.2 Arial, "Kohinoor Devanagari", sans-serif; white-space: normal; }
.maker { font: 400 19px/1.32 Arial; display: grid; gap: 9px; align-content: start; }
.maker b { font-weight: 700; }
.codes { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; justify-content: space-between; gap: 14px; }
.qr svg { width: 176px; height: 176px; }
.qr { flex: none; }
.qr figcaption { font: 400 15px/1.1 Arial; text-align: center; }
.ean svg { width: 330px; height: auto; max-width: 100%; }
.foot { background: #1d2a6b; color: #fff; text-align: center; font: 700 19px/1 Arial; padding: 8px 10px; white-space: nowrap; overflow: hidden; }
.lic { display: flex; align-items: center; gap: 10px; font: 700 20px/1.15 Arial; color: #1d2a6b; }
"""

# shrink any line that would run past its box, a pixel at a time, so a long product name or a bilingual line still fits
FIT = """<script>
addEventListener("DOMContentLoaded", () => {
  for (const el of document.querySelectorAll(".band b, .box > span, .foot")) {
    let px = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 0.5 && px > 12) el.style.fontSize = (px -= 1) + "px";
  }
  document.body.dataset.fit = "1";
});
</script>"""


def build(spec: dict) -> str:
    sku = skus.SKUS[spec["sku"]]
    w, h, pad = spec["w"], spec["h"], spec.get("pad", 0)
    e13, g14 = codes.ean13(spec["sku"]), codes.gtin14(spec["sku"])
    link = codes.digital_link(g14, spec["batch"], spec["bestBefore"])
    ean, qr = codes.ean13_svg(e13), codes.qr_svg(link)
    name, size = escape(sku["name"]), escape(sku["size"])
    brand = escape(sku.get("brand", "MUNCHLY"))
    L = {k: escape(v) for k, v in lines(spec).items()}
    if sku["food"]:
        lic = f'<div class="lic">{fssai_mark()}<span>Lic. No.<br>{skus.FOOD_LIC}</span></div>'
    else:  # a cosmetic: its manufacturing licence, no FSSAI mark and no veg mark
        lic = f'<div class="lic"><span>Cosmetics Mfg. Lic. No.<br>{skus.COSMETIC_LIC}</span></div>'
    per = spec.get("perCarton") or sku.get("perCarton", 24)
    body = f"""<div class="a">
<div class="band"><b>{brand} {name.upper()}</b><span>{size}</span>{VEG if sku["food"] else ""}</div>
<div class="ing"><b>Ingredients:</b> {escape(sku["ingredients"])}</div>
<div class="mid">
  <div class="col">
    <div class="box"><span>Net Qty: {per} × {size}</span><span id="mrp">{L["mrp"]} <small>{L["tax"]}</small></span></div>
    <div class="maker"><span><b>Mfd. &amp; Mktd. by:</b> {MAKER["name"]}, {MAKER["address"]}</span>
      <span><b>Customer care:</b> {MAKER["care"]}</span>{lic}</div>
  </div>
  <div class="col">
    <div class="box"><span id="batch">{L["batch"]}</span><span id="mfg">{L["mfg"]}</span><span id="bb">{L["bb"]}</span></div>
    <div class="codes"><div class="ean">{ean}</div><figure class="qr">{qr}<figcaption>Scan for this batch</figcaption></figure></div>
  </div>
</div>
<div class="foot">{escape(sku["store"])}</div>
</div>"""
    css = CSS.replace("__W__", str(w)).replace("__H__", str(h)).replace("__P__", str(pad))
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style>{FIT}</head><body>{body}</body></html>'


def expect(spec: dict) -> dict:
    """what a barcode reader must read back from the finished photo"""
    g14 = codes.gtin14(spec["sku"])
    return {"ean_13": codes.ean13(spec["sku"]), "qr_code": codes.digital_link(g14, spec["batch"], spec["bestBefore"])}


if __name__ == "__main__":
    spec, out = json.loads(Path(sys.argv[1]).read_text()), Path(sys.argv[2])
    out.write_text(build(spec))
    print(out, json.dumps(expect(spec)))
