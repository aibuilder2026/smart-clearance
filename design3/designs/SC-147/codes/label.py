"""SC-147's carton labels, as HTML for the compositor (compose.mjs) to print onto a base photo. Three ways of labelling
a carton (the options), each carrying what Vision reads (the batch, the made and best-before dates, the MRP) as the
batch's record has it, and the codes (codes.py) that scan to the same batch.

    uv run --with segno python design3/designs/SC-147/codes/label.py <option a|b|c> <batch json> <out.html>
"""

from __future__ import annotations

import json
import sys
from html import escape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import codes  # noqa: E402

MAKER = {
    "name": "Munchly Foods Ltd",
    "address": "Plot B-14, MIDC Chakan Phase II, Pune 410501, Maharashtra, India",
    "fssai": "10019022001234",
    "care": "1800 000 2614 (toll free) · care@munchly.example",
}


def ddmmyyyy(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


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
body { font-family: "Arial Narrow", Arial, sans-serif; color: #141414; -webkit-font-smoothing: antialiased; }
.fssai { width: 92px; height: 34px; display: block; }
.veg { width: 26px; height: 26px; flex: none; }
.codes svg { display: block; }

/* A · the full statutory label, as the reference: a band, the ingredients, the dates boxed, the codes, the maker */
.a { display: grid; grid-template-rows: auto auto 1fr auto; height: 100%; border: 3px solid #7a1418; }
.a .band { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 18px;
  background: #7a1418; color: #fff; }
.a .band b { font: 700 40px/1 "Arial Black", Arial, sans-serif; letter-spacing: 0.5px; }
.a .band span { font: 700 30px/1 "Arial Narrow", Arial; }
.a .ing { padding: 8px 18px 6px; font-size: 17.5px; line-height: 1.25; border-bottom: 2px solid #7a1418; }
.a .mid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 16px; padding: 14px 18px 12px; }
.a .box { border: 2.5px solid #1d2a6b; border-radius: 22px; padding: 12px 18px; display: grid; gap: 6px;
  font: 700 29px/1.18 "Arial Narrow", Arial; }
.a .box small { font: 400 15px/1 Arial; }
.a .maker { font: 400 19px/1.32 Arial; display: grid; gap: 9px; align-content: start; }
.a .maker b { font-weight: 700; }
.a .codes { display: grid; grid-template-columns: auto auto; align-items: end; justify-content: space-between; gap: 14px; }
.a .codes .qr { width: 176px; }
.a .codes .qr svg { width: 176px; height: 176px; }
.a .codes figcaption { font: 400 15px/1.1 Arial; text-align: center; }
.a .ean svg { width: 330px; height: auto; }
.a .foot { background: #1d2a6b; color: #fff; text-align: center; font: 700 19px/1 Arial; padding: 8px 10px; }
.a .lic { display: flex; align-items: center; gap: 10px; font: 700 20px/1.15 Arial; color: #1d2a6b; }
.a .lic .fssai { width: 110px; height: 40px; }

/* B · the shipper carton, printed in one colour: the brand, the case barcode (ITF-14) and the QR on the board, and an
   inkjet coding box with the batch and its dates */
.b { height: 100%; display: grid; grid-template-columns: 1.15fr 1fr; gap: 18px; padding: 10px 14px; color: #2b1d12; }
.b .brand { font: 900 64px/0.9 "Arial Black", Arial; letter-spacing: -1px; }
.b .prod { font: 700 40px/1 "DIN Condensed", "Arial Narrow"; margin-top: 6px; }
.b .qty { font: 700 26px/1.2 "Arial Narrow"; margin-top: 4px; }
.b .left { display: grid; align-content: space-between; gap: 10px; }
.b .maker { font: 400 16.5px/1.3 Arial; }
.b .lic { display: flex; align-items: center; gap: 10px; font: 700 17px/1.15 Arial; }
.b .right { display: grid; align-content: space-between; justify-items: end; gap: 10px; }
.b .itf svg { width: 400px; height: auto; }
.b .row { display: flex; gap: 14px; align-items: flex-end; }
.b .qr svg { width: 160px; height: 160px; }
.b .ink { background: #fbfaf6; padding: 10px 14px; border: 2px solid #2b1d12; font: 700 24px/1.25 "Courier New", monospace;
  color: #161616; letter-spacing: 1px; filter: url(#dots); }
.b .icons { display: flex; gap: 10px; font: 700 15px/1 Arial; align-items: center; }
.b .icons i { display: inline-grid; place-items: center; width: 38px; height: 38px; border: 2.5px solid #2b1d12; font-style: normal; font-size: 22px; }

/* C · the label as it is, five lines, with the barcode, the QR and the FSSAI line along its foot */
.c { height: 100%; display: grid; grid-template-rows: 1fr auto; padding: 18px 26px 14px; }
.c .lines { font: 700 38px/1.32 Arial, sans-serif; letter-spacing: 0.2px; }
.c .lines .t { font-size: 42px; }
.c .foot { display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: end; border-top: 2px solid #222; padding-top: 10px; }
.c .ean svg { width: 260px; height: auto; }
.c .qr svg { width: 150px; height: 150px; }
.c .lic { font: 400 16px/1.3 Arial; display: grid; gap: 4px; }
"""

DOTS = (
    '<svg width="0" height="0" style="position:absolute"><filter id="dots"><feTurbulence type="fractalNoise" '
    'baseFrequency="1.6" numOctaves="1" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  '
    '0 0 0 0 0  0 0 0 -2.2 1.7" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></svg>'
)


def build(option: str, b: dict, w: int, h: int) -> str:
    e13, g14 = codes.ean13(b["sku"]), codes.gtin14(b["sku"])
    link = codes.digital_link(g14, b["batch"], b["bestBefore"])
    ean, itf, qr = codes.ean13_svg(e13), codes.itf14_svg(g14), codes.qr_svg(link)
    name, size, n = escape(b["name"]), escape(b["size"]), b["perCarton"]
    mrp = f"{b['mrp']:.2f}"
    mfg, bb = ddmmyyyy(b["mfg"]), ddmmyyyy(b["bestBefore"])
    lic = f'<div class="lic">{fssai_mark()}<span>Lic. No.<br>{MAKER["fssai"]}</span></div>'
    if option == "a":
        body = f"""<div class="a">
<div class="band"><b>MUNCHLY {name.upper()}</b><span>{size}</span>{VEG}</div>
<div class="ing"><b>Ingredients:</b> {escape(b["ingredients"])}</div>
<div class="mid">
  <div style="display:grid;gap:16px;align-content:space-between">
    <div class="box"><span>Net Qty: {n} × {size}</span><span>MRP ₹{mrp} <small>per pack (incl. of all taxes)</small></span></div>
    <div class="maker"><span><b>Mfd. &amp; Mktd. by:</b> {MAKER["name"]}, {MAKER["address"]}</span>
      <span><b>Customer care:</b> {MAKER["care"]}</span>{lic}</div>
  </div>
  <div style="display:grid;gap:14px;align-content:space-between">
    <div class="box"><span>BATCH NO: {b["batch"]}</span><span>MFG: {mfg}</span><span>BEST BEFORE: {bb}</span></div>
    <div class="codes"><div class="ean">{ean}</div><figure class="qr">{qr}<figcaption>Scan for this batch</figcaption></figure></div>
  </div>
</div>
<div class="foot">STORE IN A COOL, DRY PLACE AWAY FROM DIRECT SUNLIGHT</div>
</div>"""
    elif option == "b":
        body = f"""{DOTS}<div class="b">
<div class="left">
  <div><div class="brand">MUNCHLY</div><div class="prod">{name.upper()} {size}</div>
    <div class="qty">{n} × {size} · Net Wt. {b["netKg"]} kg</div></div>
  <div class="ink">BATCH NO: {b["batch"]}<br>MFG: {mfg}<br>BEST BEFORE: {bb}<br>MRP ₹{mrp}/PACK (INCL. OF ALL TAXES)</div>
  <div class="maker"><b>Mfd. by:</b> {MAKER["name"]}, {MAKER["address"]}<br><b>Care:</b> {MAKER["care"]}</div>
</div>
<div class="right">
  <div class="icons"><i>↑↑</i><i>☂</i><span>THIS WAY UP · KEEP DRY</span></div>
  {lic}
  <div class="row"><div class="qr">{qr}</div></div>
  <div class="itf">{itf}</div>
</div>
</div>"""
    else:
        body = f"""<div class="c">
<div class="lines"><div class="t">MUNCHLY {name.upper()} {size}</div><div>BATCH NO: {b["batch"]}</div>
  <div>MFG: {mfg}</div><div>BEST BEFORE: {bb}</div><div>MRP ₹{mrp} (incl. of all taxes)</div></div>
<div class="foot"><div class="ean">{ean}</div>
  <div class="lic">{fssai_mark()}<span>Lic. No. {MAKER["fssai"]}</span><span>{MAKER["name"]}, Pune 410501</span></div>
  <div class="qr">{qr}</div></div>
</div>"""
    css = CSS.replace("__W__", str(w)).replace("__H__", str(h))
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>'


if __name__ == "__main__":
    option, spec, out = sys.argv[1], json.loads(Path(sys.argv[2]).read_text()), Path(sys.argv[3])
    out.write_text(build(option, spec, spec["w"], spec["h"]))
    print(out, "·", codes.ean13(spec["sku"]), codes.gtin14(spec["sku"]))
