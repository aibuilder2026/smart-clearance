"""What the GST papers print beyond their figures (SC-148), as design3/core/papers.js has it: an issued invoice's
e-invoice (its IRN, acknowledgement and signed QR code), the amount in words, the financial year, and the invoice the
client billed a batch to its distributor on, which a credit note is against. Worked out from a paper and its parties,
so nothing is kept; tests/test_papers.py holds them to papers.js's own answers. Every GSTIN, IRN and number is
fictional: an IRN is the portal's own recipe, and the signed QR's signature says it is illustrative."""

import base64
import hashlib
import io
import json
import re
from datetime import date, timedelta
from typing import Any

ONES = (
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
)
TENS = ("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety")


def _two(n: int) -> str:
    return ONES[n] if n < 20 else TENS[n // 10] + (" " + ONES[n % 10] if n % 10 else "")


def _three(n: int) -> str:
    return " ".join(x for x in (ONES[n // 100] + " Hundred" if n >= 100 else "", _two(n % 100) if n % 100 else "") if x)


def _in_words(n: int) -> str:
    if n == 0:
        return "Zero"
    crore, lakh, thousand, rest = n // 10**7, n % 10**7 // 10**5, n % 10**5 // 1000, n % 1000
    parts = []
    if crore:
        parts.append(_in_words(crore) + " Crore")
    if lakh:
        parts.append(_two(lakh) + " Lakh")
    if thousand:
        parts.append(_two(thousand) + " Thousand")
    if rest:
        parts.append(_three(rest))
    return " ".join(parts)


def words(amount: float) -> str:
    """'INR Eleven Thousand Five Hundred Ten Only', with the paise where there are any (lakh and crore, as Indian
    invoices write them)"""
    paise_all = round(amount * 100)
    rupees, paise = paise_all // 100, paise_all % 100
    return f"INR {_in_words(rupees)}{f' and {_two(paise)} Paise' if paise else ''} Only"


def fy(iso: str, short: bool = False) -> str:
    """the financial year (April to March), long ('2026-27') or short ('26-27')"""
    y, m = int(iso[:4]), int(iso[5:7])
    start = y if m >= 4 else y - 1
    end = f"{(start + 1) % 100:02d}"
    return f"{start % 100:02d}-{end}" if short else f"{start}-{end}"


def _num(v: Any) -> Any:
    """a figure as JavaScript writes it in JSON: 11510, not 11510.0"""
    return int(v) if isinstance(v, float) and v.is_integer() else v


def _b64(s: str) -> str:
    return base64.urlsafe_b64encode(s.encode()).decode().rstrip("=")


def _json(o: Any) -> str:
    return json.dumps(o, separators=(",", ":"), ensure_ascii=False)


def einvoice(inv: dict[str, Any], seller: dict[str, Any], buyer: dict[str, Any]) -> dict[str, str]:
    """an issued tax invoice's e-invoice: its IRN (SHA-256 of the supplier's GSTIN, the year, the type and the number),
    acknowledgement and the signed QR's text, a JWT of its key facts whose signature is illustrative. `inv`: no, date
    (ISO), issuedAt, total, hsn"""
    d = inv["date"]
    at = inv.get("issuedAt") or f"{d}T10:12"
    irn = hashlib.sha256(f"{seller.get('gstin')}{fy(d)}INV{inv['no']}".encode()).hexdigest()
    digits = "".join(str(int(c, 16) % 10) for c in irn[:11])
    ack_no = f"11{fy(d, True)[:2]}{digits}"
    ack_date = f"{at[:10]} {at[11:16]}:00"
    data = {
        "SellerGstin": seller.get("gstin"),
        "BuyerGstin": buyer.get("gstin"),
        "DocNo": inv["no"],
        "DocTyp": "INV",
        "DocDt": f"{d[8:10]}/{d[5:7]}/{d[:4]}",
        "TotInvVal": _num(inv["total"]),
        "ItemCnt": 1,
        "MainHsnCode": inv.get("hsn"),
        "Irn": irn,
        "IrnDt": ack_date,
    }
    header = _b64(_json({"alg": "RS256", "kid": "illustrative", "typ": "JWT"}))
    signed = f"{header}.{_b64(_json({'data': _json(data)}))}.illustrative-signature"
    return {"irn": irn, "ackNo": ack_no, "ackDate": ack_date, "signed": signed}


def dispatch_of(batch_ref: str, mfg: str) -> dict[str, str]:
    """the invoice the client billed the batch to its distributor on, three days after it was made"""
    d = (date.fromisoformat(mfg) + timedelta(days=3)).isoformat()
    return {"no": f"MFL/{fy(d, True)}/{2300 + int(batch_ref[-3:]):05d}", "date": d}


def qr_svg(text: str) -> str:
    """the signed QR code as an inline SVG (segno), scaled by the page"""
    import segno

    buf = io.BytesIO()
    segno.make(text, error="l").save(buf, kind="svg", scale=1, border=4, dark="#111", light="#fff", xmldecl=False)
    svg = buf.getvalue().decode()
    w = re.search(r'width="(\d+)"', svg).group(1)
    return re.sub(r'<svg ([^>]*?)width="\d+" height="\d+"', rf'<svg \1viewBox="0 0 {w} {w}" class="qr"', svg, count=1)
