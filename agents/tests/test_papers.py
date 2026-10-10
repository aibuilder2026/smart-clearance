"""What the GST papers print beyond their figures (SC-148) is design3/core/papers.js's: these answers are papers.js's
own, for the story's invoice, so Paperwork's PDFs carry the IRN, acknowledgement and signed QR the workspace draws."""

from sc_agents.tools import papers

INV = {
    "no": "INV/26-27/0931",
    "date": "2026-10-05",
    "issuedAt": "2026-10-05T11:00:00+05:30",
    "total": 11510.0,
    "hsn": "2005",
}
SELLER, BUYER = {"gstin": "27ABHPR0000K1ZW"}, {"gstin": "22AAGFA0000A1ZW"}
# papers.js's einvoice() for the same invoice (node -e, 10 Oct 2026)
IRN = "bb3abe3b3282947cf3a2b41c5e4272934ca49ecb5faab6980518ec265e958fa7"
SIGNED_HEAD = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImlsbHVzdHJhdGl2ZSIsInR5cCI6IkpXVCJ9."


def test_an_issued_invoice_has_papers_js_e_invoice():
    e = papers.einvoice(INV, SELLER, BUYER)
    assert e["irn"] == IRN and e["ackNo"] == "112611301431328" and e["ackDate"] == "2026-10-05 11:00:00"
    assert e["signed"].startswith(SIGNED_HEAD) and e["signed"].endswith(".illustrative-signature")
    assert len(e["signed"]) == 523


def test_words_years_and_the_dispatch_invoice():
    assert papers.words(11510) == "INR Eleven Thousand Five Hundred Ten Only"
    assert papers.words(10962.4) == "INR Ten Thousand Nine Hundred Sixty Two and Forty Paise Only"
    assert (
        papers.words(2441535.98)
        == "INR Twenty Four Lakh Forty One Thousand Five Hundred Thirty Five and Ninety Eight Paise Only"
    )
    assert papers.fy("2026-03-31", True) == "25-26" and papers.fy("2026-10-05") == "2026-27"
    assert papers.dispatch_of("MF-2409-117", "2026-05-18") == {"no": "MFL/26-27/02417", "date": "2026-05-21"}


def test_the_signed_qr_is_an_svg():
    svg = papers.qr_svg(papers.einvoice(INV, SELLER, BUYER)["signed"])
    assert svg.startswith("<svg") and 'viewBox="0 0 ' in svg and 'class="qr"' in svg
