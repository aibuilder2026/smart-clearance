"""The small pieces: the figure checks (the same rules as backend-api's copy.py), the formats, the label read's tidy-up,
the backend client's retries and headers, the JSON logs with their trace, and the PDFs."""

import json
import logging

import httpx
import pytest

from sc_agents import checks, fmt, tracing
from sc_agents.agents.vision import mime_of, tidy
from sc_agents.backend import Backend
from sc_agents.errors import Permanent, Stale, Transient
from sc_agents.gcp import FixedToken
from sc_agents.logs import CloudJson
from sc_agents.tools import pdf
from tests.conftest import ACKNOWLEDGEMENT, HERO, RECEIPT, STORY, case


def test_figures_are_held_to_the_computed_ones():
    allowed = [21770, 26339.6, 588, 18, 772, 15, 26329.6, 14, 38]
    assert checks.check_numbers("588 to kiranas at ₹18 and 772 at ₹15: net ₹21,770, against ₹26,330.", allowed)
    assert checks.check_numbers("Two exits, one tap, 38 kiranas, 14 days.", allowed)
    assert not checks.check_numbers("53% of MRP", allowed)
    assert not checks.check_numbers("₹5 for all", allowed)  # money is never a counting word
    assert checks.check_numbers("Buy 10, get 2 free", [10])
    assert checks.foreign("₹19 for 600 units", allowed) == [19, 600]


def test_a_reply_states_the_decided_price_and_never_the_reserve():
    ok = "₹14.20 a pack for all 772, dispatch within 24 hours of the balance."
    assert checks.reply_ok(ok, decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert not checks.reply_ok("₹14.20, and no lower than ₹13.50.", decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert not checks.reply_ok("We can do a little less.", decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert checks.reply_ok("₹15 for 772 is accepted.", decided=15, others=[15, 772, 24], reserve=13.5)


@pytest.mark.parametrize(
    ("raw", "iso"),
    [
        ("2026-11-18", "2026-11-18"),
        ("18/11/2026", "2026-11-18"),
        ("18-11-26", "2026-11-18"),
        ("18.11.2026", "2026-11-18"),
        ("18 Nov 2026", "2026-11-18"),
        ("18 November, 2026", "2026-11-18"),
        ("Nov 18, 2026", "2026-11-18"),
        ("18-Nov-2026", "2026-11-18"),
        ("18 NOV 26", "2026-11-18"),
        ("31/02/2026", None),
        ("soon", None),
        (None, None),
    ],
)
def test_label_dates(raw, iso):
    assert checks.iso_date(raw) == iso


def test_a_read_is_tidied_as_backend_api_compares_it():
    out = tidy(
        {"batch": "mf-2409- 117", "mfg": "18/05/2026", "bestBefore": "18 Nov 2026", "mrp": "₹30.00", "confidence": 1.4}
    )
    assert out == {
        "batch": "MF-2409-117",
        "mfg": "2026-05-18",
        "bestBefore": "2026-11-18",
        "mrp": 30.0,
        "pack": None,
        "confidence": 1.0,
    }
    blind = tidy({"batch": None, "confidence": 0.95})
    assert blind["confidence"] == 0.5  # nothing to verify: no confidence in it
    assert mime_of(b"\x89PNG\r\n\x1a\n...") == "image/png" and mime_of(b"RIFF....WEBPVP8") == "image/webp"


def test_formats():
    assert fmt.inr(21770.4) == "₹21,770" and fmt.inr(123456789) == "₹12,34,56,789" and fmt.inr(-1.4) == "−₹1"
    assert fmt.inr2(14.2) == "₹14.20" and fmt.price(18) == "₹18" and fmt.price(17.5) == "₹17.50"
    assert fmt.day("2026-11-18") == "18 Nov 2026" and fmt.base("Masala Chips 150 g") == "Masala Chips"
    from datetime import date

    assert fmt.fiscal_quarter(date(2026, 10, 7)) == "FY27 Q3" and fmt.fiscal_quarter(date(2027, 2, 1)) == "FY27 Q4"
    assert fmt.fiscal_quarter(date(2026, 4, 1)) == "FY27 Q1"


async def test_the_backend_client_retries_a_5xx_then_gives_up():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(502 if len(seen) < 3 else 200, json={"ok": True})

    b = Backend("http://api", FixedToken("t"), transport=httpx.MockTransport(handler), retries=3, backoff=0)
    assert await b.post("/internal/x", {"a": 1}) == {"ok": True}
    assert len(seen) == 3 and all(r.headers["authorization"] == "Bearer t" for r in seen)

    always = Backend(
        "http://api", FixedToken(), transport=httpx.MockTransport(lambda r: httpx.Response(500)), backoff=0
    )
    with pytest.raises(Transient):
        await always.get("/internal/y")


@pytest.mark.parametrize(("status", "error"), [(404, Stale), (409, Stale), (422, Permanent), (403, Transient)])
async def test_the_backend_client_sorts_its_errors(status, error):
    b = Backend("http://api", FixedToken(), transport=httpx.MockTransport(lambda r: httpx.Response(status, json={})))
    with pytest.raises(error):
        await b.get("/internal/z")


async def test_the_backend_client_sends_the_runs_trace():
    seen = []
    b = Backend(
        "http://api",
        FixedToken(),
        transport=httpx.MockTransport(lambda r: seen.append(r) or httpx.Response(200, json={})),
    )
    with tracing.continue_from(f"00-{'ab' * 16}-{'cd' * 8}-01", "test"):
        await b.get("/internal/t")
    assert seen[0].headers["traceparent"].startswith(f"00-{'ab' * 16}-")


def test_json_logs_carry_the_trace():
    f = CloudJson("aibuilder-510213")
    with tracing.continue_from(f"00-{'12' * 16}-{'34' * 8}-01", "test"):
        record = logging.LogRecord("sc_agents.x", logging.INFO, __file__, 1, "run %s done", ("r1",), None)
        line = json.loads(f.format(record))
    assert line["message"] == "run r1 done" and line["severity"] == "INFO"
    assert line["logging.googleapis.com/trace"] == f"projects/aibuilder-510213/traces/{'12' * 16}"


# --- the PDFs ------------------------------------------------------------------------------------------------------------


def paper(doc_id: str) -> tuple[dict, dict]:
    from sc_agents.agents.common import cut_case

    doc = next(d for d in STORY["docs"] if d["id"] == doc_id)
    return doc, cut_case(case(phase="settled", photo="verified", docs=STORY["docs"]))


def test_each_paper_lays_out_backend_apis_figures():
    """SC-148: the tax invoice and the credit note in Tally's layout, every party with its GSTIN and state code"""
    doc, c = paper("invoice")
    page = pdf.html(doc, c, note="Issue it from Tally.", today="2026-10-04")
    for text in (
        "Tax Invoice",
        "(DRAFT, for Rakesh Traders to issue from Tally)",
        "INV/26-27/0931",
        "Agrawal Wholesale",
        "GSTIN/UIN: 22AAGFA0000A1ZW",
        "GSTIN/UIN: 27ABHPR0000K1ZW",
        "Place of Supply: Chhattisgarh (22)",
        "14.20",
        "10,962.40",
        "548.00",
        "₹ 11,510.00",
        "INR Eleven Thousand Five Hundred Ten Only",
        "Company's PAN: <b>ABHPR0000K</b>",
        "Not required: the consignment is under ₹50,000",
    ):
        assert text in page, text
    assert "Ack No." not in page  # a draft: the IRN and its acknowledgement come with the issue
    # nor is it signed (SC-174): he signs it as he issues it
    assert "marks/signatures/" not in page and "A draft: Rakesh Traders signs it as it is issued" in page
    assert "Computer Generated" not in page
    doc, c = paper("support")
    page = pdf.html(doc, c)
    for text in (
        "CN/0117",
        "₹ 8,768.00",
        "6,021.60",
        "Rakesh Traders",
        "27AAKCM0000M1ZN",
        "MFL/26-27/02417",
        "section 34",
    ):
        assert text in page, text
    # signed for Munchly beside its round seal (SC-174)
    for text in ("marks/signatures/munchly.webp", "marks/seals/munchly.webp", "Vinod Patwardhan, Head of Accounts"):
        assert text in page, text
    assert "Computer Generated" not in page
    doc, c = paper("itc")
    page = pdf.html(doc, c)
    assert "₹1,224.00" in page and "17(5)(h)" in page
    assert "marks/signatures/munchly.webp" in page and "for <b>Munchly Foods Ltd</b>" in page
    assert "and signed by its signatory" in page
    assert [d["id"] for d in STORY["docs"] if pdf.needs_pdf(d)] == ["invoice", "support", "itc"]
    assert HERO in page


def test_an_issued_invoice_carries_its_e_invoice():
    """SC-148: once the distributor issues it, its IRN, acknowledgement and signed QR code (tools/papers.py)"""
    from sc_agents.agents.common import cut_case

    doc = {**next(d for d in STORY["docs"] if d["id"] == "invoice"), "date": "2026-10-05"}
    c = cut_case(case(phase="settled", photo="verified", docs=STORY["docs"], issued="2026-10-05T11:00:00+05:30"))
    page = pdf.html(doc, c)
    for text in (
        "(ORIGINAL FOR RECIPIENT)",
        "bb3abe3b3282947cf3a2b41c5e4272934ca49ecb5faab6980518ec265e958fa7",
        "112611301431328",
        "05/10/2026 11:00",
        "<svg",
        'class="qr"',
        # signed by his signatory over his rubber stamp (SC-174)
        'class="ink rect"',
        "marks/signatures/rakesh.webp",
        "marks/seals/rakesh.webp",
        "Rakesh Jaiswal, Proprietor",
    ):
        assert text in page, text
    assert "A draft" not in page and "Computer Generated" not in page


def test_the_signatures_are_on_file():
    """SC-174: each signatory's specimen and each firm's stamp or seal, as the seed writes them into templates/marks"""
    assert pdf.mark("signatures", "rakesh") == "marks/signatures/rakesh.webp"
    assert pdf.mark("seals", "oce") == "marks/seals/oce.webp"
    for kind, ident in (("signatures", "nobody"), ("signatures", "../seals/oce"), ("seals", None), ("other", "oce")):
        assert pdf.mark(kind, ident) is None, (kind, ident)
    for who in [*STORY["distributors"].values(), STORY["client"]]:
        sig = who["signatory"]
        assert pdf.mark("signatures", sig["sign"]) and pdf.mark("seals", sig["seal"]), who.get("name")


def test_a_signatory_with_no_specimen_signs_on_the_original():
    from sc_agents.agents.common import cut_case

    doc = {**next(d for d in STORY["docs"] if d["id"] == "invoice"), "date": "2026-10-05"}
    c = cut_case(case(phase="settled", photo="verified", docs=STORY["docs"], issued="2026-10-05T11:00:00+05:30"))
    c["distributor"]["signatory"] = {**c["distributor"]["signatory"], "sign": "nobody"}
    page = pdf.html(doc, c)
    assert "signed on the original" in page and "marks/signatures/" not in page
    assert "Rakesh Jaiswal, Proprietor" in page


def test_the_fssai_checklist_is_signed_for_the_client():
    from sc_agents.agents.common import cut_case

    c = cut_case(case(phase="settled", photo="verified", which="mango"))
    doc = {"id": "fssai", "type": "FSSAI surplus-food checklist", "owner": "Munchly Foods", "no": "58 packs"}
    page = pdf.html({**doc, "status": "generated", "amount": 0}, c, today="2026-10-06")
    assert "marks/signatures/munchly.webp" in page and "Vinod Patwardhan, Head of Accounts" in page


def test_each_food_bank_issues_its_own_paper():
    """SC-110: Feeding India's in-app receipt, and India FoodBanking Network's acknowledgement with the value at the
    donor's cost for its CSR records"""
    from sc_agents.agents.common import cut_case

    c = cut_case(case(phase="executing", photo="verified", which="mango"))
    page = pdf.html(RECEIPT, c, today=RECEIPT["date"])
    for text in (
        "Donation receipt",
        "FI/HYD/26-27/0417",
        "RECEIVED",
        "Munchly Foods Ltd",
        "Lakshmi Agencies",
        "12.47 kg",
    ):
        assert text in page, text
    assert "the Charminar hunger spot" in page and "a meal for each pack served" in page and "CSR" not in page
    page = pdf.html(ACKNOWLEDGEMENT, c, today=RECEIPT["date"])
    for text in ("Donation acknowledgement", "IFBN/ACK/26-27/0112", "ACKNOWLEDGED", "₹638.00", "Schedule VII (i)"):
        assert text in page, text
    assert "not a tax certificate" in page and pdf.needs_pdf(RECEIPT) and not pdf.needs_pdf({**RECEIPT, "pdf": True})


def test_the_expiry_credit_note_lays_out_the_settlement():
    """SC-121: the packs left at the godown come back for full credit, on a credit note of their own (SC-94)"""
    _, c = paper("support")
    doc = {
        "id": "expiry",
        "type": "Expiry credit note",
        "owner": "Munchly",
        "no": "CN/0118",
        "status": "generated",
        "amount": 3087.5,
        "units": 65,
        "policy": "full-credit",
        "disposal": 97.5,
        "epr": 85.8,
        "itc": 131.95,
        "note": "The 65 packs that expired at Kalamna Market godown come back to Munchly for full credit.",
        "pdf": None,
    }
    page = pdf.html(doc, c, today="2026-11-18")
    assert "<b>18/11/2026</b>" in page  # no date of its own: the day it is laid out
    # a paper is dated by its own date, not the day it is laid out (the history's, laid out later, SC-125)
    assert "<b>23/08/2026</b>" in pdf.html({**doc, "date": "2026-08-23"}, c, today="2026-10-02")
    for text in ("Credit Note", "CN/0118", "3,087.50", "₹97.50", "₹85.80", "₹131.95", "₹3,402.75", "17(5)(h)"):
        assert text in page, text
    assert pdf.needs_pdf(doc) and not pdf.needs_pdf({**doc, "status": "not required"})


@pytest.mark.skipif(not pdf.available(), reason="WeasyPrint's system libraries (Pango) are not installed")
def test_weasyprint_renders_a_paper():
    doc, c = paper("invoice")
    data = pdf.render(pdf.html(doc, c, today="2026-10-04"))
    assert data.startswith(b"%PDF") and len(data) > 2000


@pytest.mark.skipif(not pdf.available(), reason="WeasyPrint's system libraries (Pango) are not installed")
def test_weasyprint_draws_the_signature_and_stamp_on_one_page():
    """SC-174: the WebP signature and stamp are drawn into the PDF, and the issued invoice still fits on one page"""
    from weasyprint import HTML

    from sc_agents.agents.common import cut_case

    doc = {**next(d for d in STORY["docs"] if d["id"] == "invoice"), "date": "2026-10-05"}
    c = cut_case(case(phase="settled", photo="verified", docs=STORY["docs"], issued="2026-10-05T11:00:00+05:30"))
    rendered = HTML(string=pdf.html(doc, c), base_url=str(pdf.TEMPLATES)).render()
    assert len(rendered.pages) == 1
    data = rendered.write_pdf(uncompressed_pdf=True)
    # the QR code is drawn as a path; the signature and the stamp are images, each with its transparency
    assert data.count(b"/Subtype /Image") >= 2


def test_journey_days_are_indias():
    from sc_agents.agents.common import ist_day, journey_today

    assert ist_day("2026-10-02T20:00:00+00:00") == "2026-10-03" and ist_day("2026-10-02T10:00:00") == "2026-10-02"
    assert journey_today({"now": "2026-10-02T03:35:00+00:00"}) == "2026-10-02"


@pytest.mark.parametrize(
    "text",
    ["best before 18 Nov 2026", "best before Nov 18, 2026", "by 18 November", "on 2026-11-18", "BB 18/11/26"],
)
def test_a_dates_day_is_not_a_price(text):
    assert not checks.shows(text, 18.0)


@pytest.mark.parametrize("text", ["not under ₹18", "18 a pack", "Rs 18.00", "₹18 on 18 Nov"])
def test_a_price_still_shows(text):
    assert checks.shows(text, 18.0)
