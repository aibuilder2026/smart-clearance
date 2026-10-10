"""The Paperwork agent's PDFs: one HTML page per document (templates/, Jinja2), rendered by WeasyPrint. The figures
are backend-api's (`docsFull`, money.py's documents); the templates only lay them out. WeasyPrint needs Pango, Cairo
and HarfBuzz from the system (the Dockerfile installs them); it is imported only when a PDF is made."""

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from sc_agents import fmt
from sc_agents.tools import papers

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
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


def needs_pdf(doc: dict[str, Any]) -> bool:
    """a paper to lay out: one with a template, issued (not awaiting another's, SC-139), and without its PDF yet; the
    destruction certificate only as the agency's, for packs destroyed at his godown"""
    if doc.get("id") == "destruction" and doc.get("at") != "godown":
        return False
    return doc.get("id") in PAPERS and doc.get("status") not in ("not required", "awaiting") and not doc.get("pdf")


def html(doc: dict[str, Any], case: dict[str, Any], *, note: str | None = None, today: str = "") -> str:
    """a document's page. The GST papers (SC-148) also take the amount in words, the invoice the client billed the batch
    on, and an issued invoice's e-invoice with its signed QR code, from tools/papers.py"""
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
