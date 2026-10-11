"""The Paperwork agent's PDFs: one HTML page per document (templates/, Jinja2), rendered by WeasyPrint. The figures
are backend-api's (`docsFull`, money.py's documents); the templates only lay them out. WeasyPrint needs Pango, Cairo
and HarfBuzz from the system (the Dockerfile installs them); it is imported only when a PDF is made.

Each paper is signed (SC-174): its signatory's specimen signature and the firm's stamp or seal are images in
templates/marks/ (signatures/<id>.webp, seals/<id>.webp, written there from design3 by the frontend's seed), which the
page references relative to the templates, as WeasyPrint's base_url."""

import base64
import io
import re
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

from sc_agents import fmt
from sc_agents.tools import papers

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
MARKS = ("signatures", "seals")
# what gets a PDF: the invoice draft, the price-support credit note, the ITC memo, the FSSAI checklist, the food
# bank's receipt (SC-110), the expiry credit note for the packs left at the godown (SC-121), and the authorised
# agency's certificate for packs destroyed at his godown (SC-139); the e-way bill check and the client's own
# destruction record are records on the case, not papers anyone signs
PAPERS = {
    "invoice": "invoice.html",
    "support": "credit_note.html",
    "itc": "itc_memo.html",
    "fssai": "fssai.html",
    "receipt": "receipt.html",
    "expiry": "expiry_note.html",
    "destruction": "destruction.html",
}

# each kirana order's tax invoice from the distributor (SC-153), laid out as the shop orders
KIRANA = "kirana_invoice.html"

_env = Environment(loader=FileSystemLoader(TEMPLATES), autoescape=select_autoescape(["html"]))
_env.filters.update(
    inr=lambda v, paise=False: fmt.inr2(v) if paise else fmt.inr(v),
    num=fmt.num,
    date=fmt.day,
    # a date as the GST papers print it, 05/10/2026 (SC-148)
    dmy=lambda iso: f"{iso[8:10]}/{iso[5:7]}/{iso[:4]}" if iso else "",
    # a figure as Tally prints it: Indian grouping, two decimals, no rupee sign (SC-148)
    n2=lambda v: ("-" if v < 0 else "") + fmt.inr2(abs(v)).lstrip("₹"),
)


def mark(kind: str, ident: Any) -> str | None:
    """a signature's or a seal's image as the page references it (marks/signatures/rakesh.webp), when it is on file;
    None for a signatory with no specimen, whose paper says it is signed on the original"""
    if kind not in MARKS or not ident or not re.fullmatch(r"[a-z0-9-]{1,40}", str(ident)):
        return None
    rel = f"marks/{kind}/{ident}.webp"
    return rel if (TEMPLATES / rel).is_file() else None


_env.globals["mark"] = mark

# a signature's ink as the pen drew it (SC-183): blue-black, about a ballpoint's width on the page
INK = "#1f2a86"
PEN_MM = 0.32


def drawn(ink: dict[str, Any] | None, name: str, h: float = 13, cls: str = "hand") -> Markup:
    """a signature signed in place at the facility, `h` mm high: its strokes as inline SVG, fitted to the ink and the
    pen a steady width whatever the size; a typed signature is the name, set in italic. Empty for no ink"""
    if not ink:
        return Markup("")
    strokes = [st for st in ink.get("strokes") or [] if st]
    if ink.get("typed") or not strokes:
        return Markup('<span class="{} typed" style="font-size: {:.1f}mm">{}</span>').format(cls, h * 0.6, name)
    xs = [float(p[0]) for st in strokes for p in st]
    ys = [float(p[1]) for st in strokes for p in st]
    m = 6.0
    x0, y0 = min(xs) - m, min(ys) - m
    w, hh = max(xs) - x0 + m, max(ys) - y0 + m
    sw = PEN_MM * hh / h

    def path(st: list[list[float]]) -> str:
        if len(st) == 1:
            return f"M{st[0][0]:g} {st[0][1]:g}l0.1 0"
        return "".join(("L" if i else "M") + f"{float(p[0]):g} {float(p[1]):g}" for i, p in enumerate(st))

    paths = Markup("").join(Markup('<path d="{}"/>').format(path(st)) for st in strokes)
    return Markup(
        '<svg class="{cls}" xmlns="http://www.w3.org/2000/svg" viewBox="{x0:g} {y0:g} {w:g} {hh:g}" '
        'style="height: {h:g}mm; width: {wmm:.1f}mm" role="img" aria-label="Signed by {name}">'
        '<g fill="none" stroke="{ink}" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round">'
        "{paths}</g></svg>"
    ).format(cls=cls, x0=x0, y0=y0, w=w, hh=hh, h=h, wmm=h * w / hh, name=name, ink=INK, sw=sw, paths=paths)


_env.globals["drawn"] = drawn


# the log's photos print about 62 mm wide: 900 px is ample at 300 dpi, and keeps the PDF small
PHOTO_PX = 900


def photo_uri(data: bytes) -> str:
    """a photo from the photos bucket as a data: URI for the page (the destruction certificate's log, SC-174),
    re-encoded as a JPEG no larger than the print needs, with Pillow (which WeasyPrint draws images with). Raises on
    bytes that are not a whole image: WeasyPrint would otherwise fail the whole PDF on it"""
    from PIL import Image

    with Image.open(io.BytesIO(data)) as im:
        rgb = im.convert("RGB")
    rgb.thumbnail((PHOTO_PX, PHOTO_PX))
    buf = io.BytesIO()
    rgb.save(buf, "JPEG", quality=80, optimize=True)
    return f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"


def needs_pdf(doc: dict[str, Any]) -> bool:
    """a paper to lay out: one with a template, issued (not awaiting another's, SC-139), and without its PDF yet; the
    destruction certificate only as the agency's, for packs destroyed at his godown"""
    if doc.get("id") == "destruction" and doc.get("at") != "godown":
        return False
    return doc.get("id") in PAPERS and doc.get("status") not in ("not required", "awaiting") and not doc.get("pdf")


def html(
    doc: dict[str, Any],
    case: dict[str, Any],
    *,
    note: str | None = None,
    today: str = "",
    photos: dict[str, str] | None = None,
) -> str:
    """a document's page. The GST papers (SC-148) also take the amount in words, the invoice the client billed the batch
    on, and an issued invoice's e-invoice with its signed QR code, from tools/papers.py; the destruction certificate
    (SC-174) its before and after photos, as data: URIs (`photos`, by which), where Paperwork could read them"""
    batch = case.get("batch") or {}
    extra: dict[str, Any] = {
        "words": papers.words,
        "dispatch": papers.dispatch_of(case["ref"], batch["mfg"]) if batch.get("mfg") and case.get("ref") else None,
        "eway": next((d for d in case.get("docs") or [] if d.get("id") == "eway"), None),
        "e": None,
        "qr": None,
    }
    if doc["id"] == "invoice" and case.get("invoiceIssuedAt") and doc.get("date"):
        inv = {**doc, "issuedAt": case["invoiceIssuedAt"]}
        extra["e"] = papers.einvoice(inv, case.get("distributor") or {}, case.get("buyer") or doc.get("to") or {})
        extra["qr"] = papers.qr_svg(extra["e"]["signed"])
    # a kirana order's tax invoice (SC-153): its own paper, by the shop it was issued to
    template = KIRANA if str(doc["id"]).startswith("kirana.") else PAPERS[doc["id"]]
    extra["scheme"] = case.get("scheme")
    extra["photos"] = photos or {}
    return _env.get_template(template).render(doc=doc, case=case, note=note, today=today, **extra)


def render(page: str) -> bytes:
    from weasyprint import HTML

    return HTML(string=page, base_url=str(TEMPLATES)).write_pdf()


def available() -> bool:
    """whether WeasyPrint's system libraries are installed (the tests skip the PDF when they are not)"""
    try:
        import weasyprint  # noqa: F401
    except OSError:
        return False
    return True
