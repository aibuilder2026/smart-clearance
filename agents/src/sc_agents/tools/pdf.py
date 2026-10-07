"""The Paperwork agent's PDFs: one HTML page per document (templates/, Jinja2), rendered by WeasyPrint. The figures
are backend-api's (`docsFull`, money.py's documents); the templates only lay them out. WeasyPrint needs Pango, Cairo
and HarfBuzz from the system (the Dockerfile installs them); it is imported only when a PDF is made."""

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from sc_agents import fmt

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
# what gets a PDF: the invoice draft, the price-support credit note, the ITC memo and the FSSAI checklist (the e-way
# bill check and the destruction certificate are records on the case, not papers anyone signs)
PAPERS = {"invoice": "invoice.html", "support": "credit_note.html", "itc": "itc_memo.html", "fssai": "fssai.html"}

_env = Environment(loader=FileSystemLoader(TEMPLATES), autoescape=select_autoescape(["html"]))
_env.filters.update(inr=lambda v, paise=False: fmt.inr2(v) if paise else fmt.inr(v), num=fmt.num, date=fmt.day)


def needs_pdf(doc: dict[str, Any]) -> bool:
    return doc.get("id") in PAPERS and doc.get("status") != "not required" and not doc.get("pdf")


def html(doc: dict[str, Any], case: dict[str, Any], *, note: str | None = None, today: str = "") -> str:
    """a document's page"""
    return _env.get_template(PAPERS[doc["id"]]).render(doc=doc, case=case, note=note, today=today)


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
