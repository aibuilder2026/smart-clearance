"""SC-148's paper options: the distributor's tax invoice (INV/26-27/0931, Rakesh Traders to Agrawal Wholesale, the
story's ExpireSoon lot) and Munchly's price-support credit note (CN/0117), each drawn three ways, as HTML for
shoot.mjs to capture. Every figure is design3's (core/money.js documents); every party, GSTIN, PAN, licence and bank
detail is fictional: each PAN's digits are 0000, never issued, and each GSTIN carries its own check character.

    uv run --with segno python design3/designs/SC-148/papers.py
"""

from __future__ import annotations

import base64
import hashlib
import json
import sys
from html import escape
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "SC-147" / "codes"))
import codes  # noqa: E402

STATES = {"27": "Maharashtra", "22": "Chhattisgarh", "36": "Telangana", "23": "Madhya Pradesh"}


def party(name, state, pan, address, **more):
    return {"name": name, "state": STATES[state], "code": state, "pan": pan, "gstin": codes.gstin(state, pan), "address": address, **more}


MUNCHLY = party(
    "Munchly Foods Ltd", "27", "AAKCM0000M", "Plot B-14, MIDC Chakan Phase II, Pune 410501",
    fssai="10019022001234", cin="L15400MH2011PLC000117", email="accounts@munchly.example",
)
RAKESH = party(
    "Rakesh Traders", "27", "ABHPR0000K", "Shop 12, Kalamna Market, Nagpur 440035",
    fssai="21526000000117", email="accounts@rakeshtraders.example", phone="+91 712 000 0117",
    bank={"bank": "Example Co-operative Bank, Itwari, Nagpur", "account": "0000 0117 2409", "ifsc": "EXMP0000117"},
)
AGRAWAL = party("Agrawal Wholesale", "22", "AAGFA0000A", "Ganj Mandi, Raipur 492001", fssai="20526000000231")

INV = {  # design3 core/money.js documents(), the story's invoice
    "no": "INV/26-27/0931", "date": "05/10/2026", "units": 772, "price": 14.2, "taxable": 10962.4, "igst": 548,
    "roundOff": -0.4, "total": 11510, "hsn": "2005", "gst": 5, "lot": "ES-24117", "award": "05/10/2026",
    "item": "Munchly Masala Chips 150 g", "batch": "MF-2409-117", "bb": "18/11/2026", "mrp": 30,
}
CN = {  # the price-support credit note
    "no": "CN/0117", "date": "05/10/2026", "exact": 8767.6, "roundOff": 0.4, "amount": 8768, "van": 294, "fee": 100,
    "rows": [("Kirana cluster", 588, 18, 4, 2352), ("ExpireSoon", 772, 14.2, 7.8, 6021.6)],
    "against": "MFL/26-27/02417", "againstDate": "21/05/2026",  # Munchly's sale of the batch to Rakesh Traders
}


def inr(n, d=2):
    s = f"{abs(n):.{d}f}"
    whole, _, frac = s.partition(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join(groups + [tail])
    return ("-" if n < 0 else "") + whole + ("." + frac if d else "")


ONES = "Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen".split()
TENS = "_ _ Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety".split()


def words(n: int) -> str:
    """an amount in Indian words: crore, lakh, thousand, hundred"""
    def two(x):
        return ONES[x] if x < 20 else TENS[x // 10] + (" " + ONES[x % 10] if x % 10 else "")

    def three(x):
        return (ONES[x // 100] + " Hundred" + (" " + two(x % 100) if x % 100 else "")) if x >= 100 else two(x)

    if n == 0:
        return "Zero"
    out = []
    for size, name in ((10**7, "Crore"), (10**5, "Lakh"), (1000, "Thousand")):
        if n >= size:
            out.append(f"{three(n // size) if n // size < 1000 else words(n // size)} {name}")
            n %= size
    if n:
        out.append(three(n))
    return " ".join(out)


def rupees_words(x: float) -> str:
    r, p = int(round(x * 100)) // 100, int(round(x * 100)) % 100
    return f"INR {words(r)}{' and ' + two_p(p) + ' paise' if p else ''} Only"


def two_p(p):
    return ONES[p] if p < 20 else TENS[p // 10] + (" " + ONES[p % 10] if p % 10 else "")


def irn(gstin: str, fy: str, typ: str, no: str) -> str:
    """an IRN as the IRP makes one: SHA-256 of the supplier's GSTIN, the financial year, the document type and number"""
    return hashlib.sha256(f"{gstin}{fy}{typ}{no}".encode()).hexdigest()


def signed_qr(inv: dict) -> str:
    """the e-invoice's QR: the IRP's signed JWT of the invoice's key facts (this one's signature is illustrative)"""
    b64 = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(",", ":")).encode()).decode().rstrip("=")  # noqa: E731
    data = {
        "SellerGstin": RAKESH["gstin"], "BuyerGstin": AGRAWAL["gstin"], "DocNo": inv["no"], "DocTyp": "INV",
        "DocDt": inv["date"], "TotInvVal": inv["total"], "ItemCnt": 1, "MainHsnCode": inv["hsn"],
        "Irn": irn(RAKESH["gstin"], "2026-27", "INV", inv["no"]), "IrnDt": "2026-10-05 10:12:00",
    }
    jwt = b64({"alg": "RS256", "kid": "illustrative", "typ": "JWT"}) + "." + b64({"data": json.dumps(data)}) + ".illustrative-signature"
    return codes.qr_svg(jwt, scale=3)


CSS = """
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #111; font: 12.5px/1.35 Arial, Helvetica, sans-serif; }
.page { width: 794px; padding: 26px 28px; }
.t { border-collapse: collapse; width: 100%; }
.t td, .t th { border: 1px solid #222; padding: 4px 6px; vertical-align: top; }
.t th { font-weight: 700; text-align: center; background: #f3f3f3; }
.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.c { text-align: center; }
.small { font-size: 10.5px; color: #333; }
.h { font-size: 15px; font-weight: 700; }
.title { text-align: center; font-size: 17px; font-weight: 700; letter-spacing: 0.5px; margin: 0 0 4px; }
.sub { text-align: center; font-size: 10.5px; margin-bottom: 8px; }
.qr svg { width: 120px; height: 120px; display: block; }
.mono { font-family: Menlo, monospace; font-size: 10.5px; word-break: break-all; }
.sign { height: 64px; }
/* C, the app's paper */
.pp { width: 600px; margin: 28px auto; border: 1px solid #d8ded9; border-radius: 16px; padding: 22px 24px; font: 13.5px/1.45 Geist, Arial; color: #0e1a13; }
.pp .row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid #edf1ee; }
.pp .row:last-child { border: 0; }
.pp .cap { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #5b6a62; margin: 14px 0 4px; }
.pp .stamp { float: right; border: 2px solid #1f6f43; color: #1f6f43; border-radius: 6px; padding: 2px 8px; font-weight: 700; font-size: 11px; transform: rotate(-4deg); }
.pp h3 { margin: 0 0 2px; font-size: 18px; }
"""


def head_block(p, extra=""):
    return (f"<b>{escape(p['name'])}</b><br>{escape(p['address'])}<br>GSTIN/UIN: {p['gstin']}<br>"
            f"State Name: {p['state']}, Code: {p['code']}{extra}")


def invoice_tally(e_invoice: bool) -> str:
    i = INV
    tax_words = rupees_words(i["igst"])
    einv = ""
    if e_invoice:
        n = irn(RAKESH["gstin"], "2026-27", "INV", i["no"])
        einv = f"""<table class="t" style="margin-bottom:6px"><tr><td style="width:76%"><b>e-Invoice</b><br>
<b>IRN:</b> <span class="mono">{n}</span><br><b>Ack No.:</b> 112610050117931 &nbsp; <b>Ack Date:</b> 05-Oct-26 10:12
<br><span class="small">Signed QR code from the Invoice Registration Portal (signature illustrative)</span></td>
<td class="c qr">{signed_qr(i)}</td></tr></table>"""
    return f"""<div class="page">
<div class="title">Tax Invoice</div><div class="sub">(ORIGINAL FOR RECIPIENT)</div>
{einv}
<table class="t">
<tr><td rowspan="3" style="width:52%">{head_block(RAKESH, f"<br>FSSAI Lic. No.: {RAKESH['fssai']}<br>E-Mail: {RAKESH['email']}")}</td>
<td>Invoice No.<br><b>{i['no']}</b></td><td>Dated<br><b>{i['date']}</b></td></tr>
<tr><td>Delivery Note<br>{i['lot']}</td><td>Mode/Terms of Payment<br>Token ₹1,644 paid; balance in 48 h</td></tr>
<tr><td>Buyer's Order No.<br>ExpireSoon lot {i['lot']}</td><td>Dated<br>{i['award']}</td></tr>
<tr><td rowspan="2">Consignee (Ship to)<br>{head_block(AGRAWAL)}</td><td>Dispatched through<br>Buyer's own truck</td><td>Destination<br>Raipur</td></tr>
<tr><td colspan="2">Terms of Delivery<br>Ex-godown, Kalamna Market, Nagpur</td></tr>
<tr><td>Buyer (Bill to)<br>{head_block(AGRAWAL)}<br>Place of Supply: {AGRAWAL['state']} ({AGRAWAL['code']})</td>
<td colspan="2">Reverse charge: No<br>E-way bill: not required (consignment value under ₹50,000)</td></tr>
</table>
<table class="t" style="margin-top:-1px">
<tr><th style="width:4%">Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th>Amount</th></tr>
<tr style="height:200px"><td class="c">1</td><td><b>{i['item']}</b><br><span class="small">Batch {i['batch']} · best before {i['bb']} · MRP ₹{i['mrp']:.2f} a pack, incl. of all taxes</span>
<br><br><div class="num"><b>IGST @ {i['gst']}%</b><br>Round off</div></td>
<td class="c">{i['hsn']}</td><td class="num"><b>{i['units']:,} PCS</b></td><td class="num">{i['price']:.2f}</td><td class="c">PCS</td>
<td class="num">{inr(i['taxable'])}<br><br><br><b>{inr(i['igst'])}</b><br>{inr(i['roundOff'])}</td></tr>
<tr><td></td><td class="num"><b>Total</b></td><td></td><td class="num"><b>{i['units']:,} PCS</b></td><td></td><td></td><td class="num"><b>₹ {inr(i['total'])}</b></td></tr>
<tr><td colspan="7">Amount Chargeable (in words)<br><b>{rupees_words(i['total'])}</b></td></tr>
</table>
<table class="t" style="margin-top:-1px">
<tr><th rowspan="2">HSN/SAC</th><th rowspan="2">Taxable Value</th><th colspan="2">Integrated Tax</th><th rowspan="2">Total Tax Amount</th></tr>
<tr><th>Rate</th><th>Amount</th></tr>
<tr><td>{i['hsn']}</td><td class="num">{inr(i['taxable'])}</td><td class="num">{i['gst']}%</td><td class="num">{inr(i['igst'])}</td><td class="num">{inr(i['igst'])}</td></tr>
<tr><td class="num"><b>Total</b></td><td class="num"><b>{inr(i['taxable'])}</b></td><td></td><td class="num"><b>{inr(i['igst'])}</b></td><td class="num"><b>{inr(i['igst'])}</b></td></tr>
<tr><td colspan="5">Tax Amount (in words): <b>{tax_words}</b></td></tr>
</table>
<table class="t" style="margin-top:-1px">
<tr><td style="width:52%">Company's PAN: <b>{RAKESH['pan']}</b><br><br><u>Declaration</u><br>We declare that this invoice shows the actual
price of the goods described and that all particulars are true and correct. Goods sold within their best-before date,
under the brand's one-time permission.</td>
<td>Company's Bank Details<br>Bank Name: {RAKESH['bank']['bank']}<br>A/c No.: {RAKESH['bank']['account']}<br>Branch &amp; IFS Code: {RAKESH['bank']['ifsc']}
<div style="text-align:right;margin-top:10px">for <b>{RAKESH['name']}</b><div class="sign"></div>Authorised Signatory</div></td></tr>
</table>
<div class="sub" style="margin-top:6px">SUBJECT TO NAGPUR JURISDICTION · This is a Computer Generated Invoice</div>
</div>"""


def credit_tally(e_invoice: bool) -> str:
    c = CN
    rows = "".join(
        f"<tr><td>{n}</td><td>{escape(k)}: {u:,} packs sold at ₹{p:.2f}, ₹{g:.2f} under the dealer price</td>"
        f"<td class='num'>{u:,}</td><td class='num'>{g:.2f}</td><td class='num'>{inr(a)}</td></tr>"
        for n, (k, u, p, g, a) in enumerate(c["rows"], 1)
    )
    rows += f"<tr><td>3</td><td>Van round, the scheme's deliveries</td><td></td><td></td><td class='num'>{inr(c['van'])}</td></tr>"
    rows += f"<tr><td>4</td><td>ExpireSoon listing fee</td><td></td><td></td><td class='num'>{inr(c['fee'])}</td></tr>"
    note = ("Financial credit note: not a GST credit note under section 34 of the CGST Act, so no tax is adjusted and it "
            "is not reported on the IRP. The output tax on the original sale stands.") if e_invoice else (
            "Financial credit note: not a GST credit note under section 34 of the CGST Act, so no tax is adjusted. The "
            "output tax on the original sale stands.")
    return f"""<div class="page">
<div class="title">Credit Note</div><div class="sub">(Price support · financial, no GST adjusted)</div>
<table class="t">
<tr><td rowspan="2" style="width:52%">{head_block(MUNCHLY, f"<br>CIN: {MUNCHLY['cin']}<br>FSSAI Lic. No.: {MUNCHLY['fssai']}")}</td>
<td>Credit Note No.<br><b>{c['no']}</b></td><td>Dated<br><b>{c['date']}</b></td></tr>
<tr><td colspan="2">Against our invoice<br><b>{c['against']}</b> dated {c['againstDate']}<br>Batch {INV['batch']}, {INV['item']}</td></tr>
<tr><td>Issued to<br>{head_block(RAKESH)}</td><td colspan="2">Reason<br>Price support on the batch's clearance, the
gap to the dealer price of ₹22.00 a pack on what each exit sold, and the costs he met</td></tr>
</table>
<table class="t" style="margin-top:-1px">
<tr><th style="width:4%">Sl</th><th>Particulars</th><th>Packs</th><th>Gap a pack</th><th>Amount</th></tr>
{rows}
<tr><td></td><td class="num">Round off</td><td></td><td></td><td class="num">{inr(c['roundOff'])}</td></tr>
<tr><td></td><td class="num"><b>Credit to {RAKESH['name']}</b></td><td></td><td></td><td class="num"><b>₹ {inr(c['amount'])}</b></td></tr>
<tr><td colspan="5">Amount (in words): <b>{rupees_words(c['amount'])}</b></td></tr>
</table>
<table class="t" style="margin-top:-1px"><tr><td style="width:52%" class="small">{note}<br><br>Company's PAN: <b>{MUNCHLY['pan']}</b></td>
<td><div style="text-align:right">for <b>{MUNCHLY['name']}</b><div class="sign"></div>Authorised Signatory</div></td></tr></table>
<div class="sub" style="margin-top:6px">Adjusted against {RAKESH['name']}' account · This is a Computer Generated Document</div>
</div>"""


def invoice_app() -> str:
    i = INV
    return f"""<div class="pp"><span class="stamp">IGST</span><h3>Tax invoice</h3>
<div class="small">{i['no']} · drafted for Rakesh to issue from Tally · {i['date']}</div>
<div class="cap">From</div><div><b>{RAKESH['name']}</b>, {RAKESH['address']}<br>GSTIN {RAKESH['gstin']} · PAN {RAKESH['pan']} · FSSAI {RAKESH['fssai']} · {RAKESH['state']} ({RAKESH['code']})</div>
<div class="cap">To</div><div><b>{AGRAWAL['name']}</b>, {AGRAWAL['address']}<br>GSTIN {AGRAWAL['gstin']} · place of supply {AGRAWAL['state']} ({AGRAWAL['code']}) · reverse charge: no</div>
<div class="cap">Goods</div>
<div class="row"><span>{i['item']} · batch {i['batch']} · BB {i['bb']}<br><span class="small">HSN {i['hsn']} · {i['units']:,} PCS × ₹{i['price']:.2f}</span></span><b>₹{inr(i['taxable'])}</b></div>
<div class="row"><span>IGST at {i['gst']}% · Maharashtra → Chhattisgarh</span><span>₹{inr(i['igst'])}</span></div>
<div class="row"><span>Round off</span><span>{inr(i['roundOff'])}</span></div>
<div class="row"><b>Invoice total</b><b>₹{inr(i['total'])}</b></div>
<div class="small" style="margin-top:6px">{rupees_words(i['total'])} · e-way bill not required (under ₹50,000) · bank {RAKESH['bank']['ifsc']} · signed in Tally by the authorised signatory</div></div>"""


def credit_app() -> str:
    c = CN
    rows = "".join(f"<div class='row'><span>{k}: {u:,} × (₹22.00 − ₹{p:.2f})</span><span>₹{inr(a)}</span></div>" for k, u, p, g, a in c["rows"])
    return f"""<div class="pp"><span class="stamp">NO GST ADJ.</span><h3>Price-support credit note</h3>
<div class="small">{c['no']} · {c['date']} · against invoice {c['against']} of {c['againstDate']}</div>
<div class="cap">From</div><div><b>{MUNCHLY['name']}</b>, {MUNCHLY['address']}<br>GSTIN {MUNCHLY['gstin']} · PAN {MUNCHLY['pan']} · CIN {MUNCHLY['cin']}</div>
<div class="cap">To</div><div><b>{RAKESH['name']}</b>, {RAKESH['address']}<br>GSTIN {RAKESH['gstin']}</div>
<div class="cap">Credit</div>{rows}
<div class="row"><span>Van round</span><span>₹{inr(c['van'])}</span></div><div class="row"><span>Listing fee</span><span>₹{inr(c['fee'])}</span></div>
<div class="row"><span>Round off</span><span>{inr(c['roundOff'])}</span></div><div class="row"><b>Credit to Rakesh Traders</b><b>₹{inr(c['amount'])}</b></div>
<div class="small" style="margin-top:6px">{rupees_words(c['amount'])} · a financial credit note, not under section 34: no GST adjusted · signed by the authorised signatory</div></div>"""


def page(body: str, title: str) -> str:
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{body}</body></html>'


if __name__ == "__main__":
    out = {
        "option-a/invoice.html": page(invoice_tally(False), "Tax invoice · option A"),
        "option-a/credit-note.html": page(credit_tally(False), "Credit note · option A"),
        "option-b/invoice.html": page(invoice_tally(True), "Tax invoice · option B"),
        "option-b/credit-note.html": page(credit_tally(True), "Credit note · option B"),
        "option-c/invoice.html": page(invoice_app(), "Tax invoice · option C"),
        "option-c/credit-note.html": page(credit_app(), "Credit note · option C"),
    }
    for p, html in out.items():
        (HERE / p).write_text(html)
    for p in (MUNCHLY, RAKESH, AGRAWAL):
        print(p["name"], p["gstin"], codes.gstin_ok(p["gstin"]))
    print(rupees_words(11510), "|", rupees_words(548), "|", rupees_words(8768))
